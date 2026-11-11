import { RARITIES, ORB_COLORS } from './data/rarities.js';
import { ELEMENT_LIST } from './data/elements.js';
import { ORB_SIZES } from './pickups.js';
import { getEnemySprite, drawGlow, FACING_ROTATE, SYMMETRIC, FLOATING, shade } from './sprites.js';
import { drawSilhouette } from './character.js';
import { Pool, Mine } from './powers.js';
import { ASSETS } from './assets.js';
import { drawHazards } from './events.js';

export { drawSilhouette };
const isGround = (z) => z instanceof Pool || z instanceof Mine;

// ═══════════════════════════════════════════════════════════
// Render principal
// ═══════════════════════════════════════════════════════════
export function render(game) {
  const ctx = game.ctx, c = game.canvas, w = c.width, h = c.height;
  if (!game.map || !game.player) { drawMenuBackground(ctx, w, h, game.menuT); return; }

  const p = game.player;
  const sx = (Math.random() - 0.5) * game.shake * 2, sy = (Math.random() - 0.5) * game.shake * 2;
  const cam = game.cam;
  cam.x = p.x - w / 2 + sx; cam.y = p.y - h / 2 + sy; cam.w = w; cam.h = h;
  const vis = (x, y, m = 60) => x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m && y < cam.y + cam.h + m;

  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  game.map.draw(ctx, cam, game.time);

  // capa de suelo: zonas, trampas, sombras
  for (const z of game.zones) if (isGround(z)) z.draw(ctx, game);
  drawHazards(ctx, game);
  drawShadows(ctx, game, vis);
  drawPickups(ctx, game, vis);
  drawFields(ctx, game);
  for (const z of game.zones) if (!isGround(z)) z.draw(ctx, game);
  drawEnemies(ctx, game, vis);
  drawEnemyShots(ctx, game, vis);
  game.particles.draw(ctx, cam, false);
  for (const pr of game.projectiles) if (vis(pr.x, pr.y)) pr.draw(ctx);
  drawPlayer(ctx, game);
  for (const ef of game.effects) if (!ef.additive) ef.draw(ctx, Math.min(1, ef.t / ef.dur));

  // capa aditiva: brillos y partículas luminosas
  ctx.globalCompositeOperation = 'lighter';
  for (const pr of game.projectiles) if (vis(pr.x, pr.y)) pr.drawGlow(ctx);
  drawGlows(ctx, game, vis);
  game.particles.draw(ctx, cam, true);
  for (const ef of game.effects) if (ef.additive) ef.draw(ctx, Math.min(1, ef.t / ef.dur));
  ctx.globalCompositeOperation = 'source-over';

  drawTexts(ctx, game);
  ctx.restore();

  // iluminación: viñeta oscura alrededor del jugador (más cerrada con niebla)
  const fog = game.event && game.event.id === 'niebla';
  const dark = fog ? 0.96 : (game.map.def.darkness ?? 0.5);
  const g = ctx.createRadialGradient(w / 2, h / 2, fog ? h * 0.12 : h * 0.25, w / 2, h / 2, fog ? h * 0.45 : Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, fog ? 'rgba(120,125,140,0.96)' : `rgba(0,0,10,${dark})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // bordes rojos: vida baja (pulso rápido) o jefe presente (pulso lento)
  const lowHp = p.hp / p.stats.maxHp < 0.25 && game.state !== 'dying';
  if (lowHp || (game.boss && !game.boss.dead)) {
    const a = lowHp ? 0.22 + Math.sin(game.time * 7) * 0.12 : 0.07 + Math.sin(game.time * 2.5) * 0.04;
    const g3 = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g3.addColorStop(0, 'rgba(200,0,20,0)');
    g3.addColorStop(1, `rgba(200,0,20,${a})`);
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, w, h);
  }

  drawIndicators(ctx, game, w, h);

  // destellos de pantalla (daño, nivel, jefe)
  if (game.flashT > 0) {
    ctx.globalAlpha = Math.min(1, game.flashT / game.flashDur) * 0.55;
    ctx.fillStyle = game.flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
  if (p.hurtFlash > 0) {
    const g2 = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
    g2.addColorStop(0, 'rgba(180,0,0,0)');
    g2.addColorStop(1, `rgba(180,0,0,${p.hurtFlash * 2.5})`);
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
  }
}

// Flechas en el borde de la pantalla hacia cofres y jefe fuera de vista.
function drawIndicators(ctx, game, w, h) {
  const p = game.player, cam = game.cam;
  const targets = game.chests.map((c) => ({ x: c.x, y: c.y, color: RARITIES[c.rarity].color, icon: '🎁' }));
  if (p.hp / p.stats.maxHp < 0.5) for (const h of game.hearts) targets.push({ x: h.x, y: h.y, color: '#ff4d6d', icon: '❤️' });
  if (game.boss && !game.boss.dead) targets.push({ x: game.boss.x, y: game.boss.y, color: '#ff1744', icon: '👑' });
  const m = 34;
  for (const t of targets) {
    const sx = t.x - cam.x, sy = t.y - cam.y;
    if (sx > 0 && sx < w && sy > 0 && sy < h) continue;
    const dx = t.x - p.x, dy = t.y - p.y;
    const ang = Math.atan2(dy, dx);
    // intersección del rayo con el rectángulo interior
    const hw = w / 2 - m, hh = h / 2 - m;
    const k = Math.min(Math.abs(hw / (Math.cos(ang) || 1e-6)), Math.abs(hh / (Math.sin(ang) || 1e-6)));
    const ix = w / 2 + Math.cos(ang) * k, iy = h / 2 + Math.sin(ang) * k;
    const dist = Math.hypot(dx, dy);
    ctx.save();
    ctx.translate(ix, iy);
    ctx.globalAlpha = 0.85;
    ctx.rotate(ang);
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-4, -8); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.rotate(-ang);
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.icon, -Math.cos(ang) * 16, -Math.sin(ang) * 16);
    ctx.font = 'bold 10px "Nunito", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(dist / 10) * 10}`, -Math.cos(ang) * 16, -Math.sin(ang) * 16 + 14);
    ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';
}

// ─── Fondo animado del menú ───
const MENU_ORBS = [];
for (let i = 0; i < 34; i++) {
  const el = ELEMENT_LIST[i % ELEMENT_LIST.length];
  MENU_ORBS.push({ x: Math.random(), y: Math.random(), r: 6 + Math.random() * 26, color: el.color, sp: 0.01 + Math.random() * 0.03, ph: Math.random() * 6 });
}
function drawMenuBackground(ctx, w, h, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0b0e17'); g.addColorStop(1, '#120c1e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // estrellas
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 90; i++) {
    const x = ((i * 977) % 1000) / 1000 * w, y = ((i * 613) % 1000) / 1000 * h;
    ctx.globalAlpha = 0.25 + Math.sin(t * 1.5 + i) * 0.2;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const o of MENU_ORBS) {
    const x = ((o.x + Math.sin(t * o.sp * 8 + o.ph) * 0.03) % 1) * w;
    const y = ((o.y - t * o.sp * 0.5 + 10) % 1) * h;
    drawGlow(ctx, x, y, o.r * 2.2, o.color, 0.22);
    ctx.globalAlpha = 0.9; ctx.fillStyle = o.color;
    ctx.beginPath(); ctx.arc(x, y, o.r * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function drawShadows(ctx, game, vis) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (const e of game.enemies) {
    if (e.dead || !vis(e.x, e.y, e.size * 2)) continue;
    ctx.beginPath(); ctx.ellipse(e.x, e.y + e.size * 0.85, e.size * 0.9, e.size * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPickups(ctx, game, vis) {
  const t = game.time;
  for (const o of game.orbs) {
    if (!vis(o.x, o.y, 30)) continue;
    const col = ORB_COLORS[o.type];
    const s = ORB_SIZES[o.type];
    const bob = Math.sin(t * 3 + o.bob) * 2;
    const oa = ASSETS.get('orbs', o.type);
    if (oa) {
      ctx.save(); ctx.translate(o.x, o.y + bob);
      ASSETS.draw(ctx, oa, ASSETS.frame(oa, t, o.bob), s * 2.6 * oa.scale);
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(o.x, o.y + bob);
    ctx.rotate(Math.sin(t * 2 + o.bob) * 0.2);
    // gema con facetas
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s, 0); ctx.lineTo(0, s * 1.3); ctx.lineTo(-s, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.moveTo(0, s * 1.3); ctx.lineTo(-s, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s, 0); ctx.lineTo(0, s * 1.3); ctx.lineTo(-s, 0); ctx.closePath(); ctx.stroke();
    ctx.restore();
    // destello
    const sp = (Math.sin(t * 4 + o.bob) + 1) / 2;
    if (sp > 0.8) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.globalAlpha = (sp - 0.8) * 5;
      ctx.beginPath(); ctx.moveTo(o.x - s * 0.5, o.y - s + bob); ctx.lineTo(o.x - s * 0.5, o.y - s * 2 + bob); ctx.moveTo(o.x - s, o.y - s * 1.5 + bob); ctx.lineTo(o.x, o.y - s * 1.5 + bob); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  for (const h of game.hearts) {
    if (!vis(h.x, h.y, 24)) continue;
    const bob = Math.sin(t * 3 + h.bob) * 2;
    const beat = 1 + (Math.sin(t * 5 + h.bob) > 0.7 ? 0.15 : 0);
    ctx.save();
    ctx.translate(h.x, h.y + bob);
    ctx.scale(beat, beat);
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-11, -2, -9, -11, -2, -8);
    ctx.bezierCurveTo(0, -7, 0, -6, 0, -5);
    ctx.bezierCurveTo(0, -6, 0, -7, 2, -8);
    ctx.bezierCurveTo(9, -11, 11, -2, 0, 7);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,0,20,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-4, -5, 2.2, 1.4, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  for (const c of game.coins) {
    if (!vis(c.x, c.y, 20)) continue;
    const ca = ASSETS.get('ui', 'coin');
    if (ca) { ctx.save(); ctx.translate(c.x, c.y); ASSETS.draw(ctx, ca, ASSETS.frame(ca, t, c.x), 14 * ca.scale); ctx.restore(); continue; }
    const sq = Math.abs(Math.cos(t * 4 + c.x));
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 6 * sq + 1, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c79100'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffb300';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 3 * sq + 0.5, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  for (const ch of game.chests) {
    if (!vis(ch.x, ch.y, 40)) continue;
    const r = RARITIES[ch.rarity];
    const bob = Math.sin(t * 3 + ch.bob) * 3;
    ctx.save();
    ctx.translate(ch.x, ch.y + bob);
    const cha = ASSETS.get('ui', 'chest');
    if (cha) {
      ASSETS.draw(ctx, cha, ASSETS.frame(cha, t, ch.bob), 36 * cha.scale);
      ctx.restore();
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = r.color;
      ctx.fillText(r.name, ch.x, ch.y - 24 + bob);
      continue;
    }
    ctx.fillStyle = '#4e342e';
    ctx.beginPath(); ctx.roundRect(-17, -10, 34, 22, 4); ctx.fill();
    ctx.strokeStyle = '#2b1a14'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-17, -2, 34, 3);
    ctx.fillStyle = r.color;
    ctx.beginPath(); ctx.roundRect(-17, -15, 34, 9, 4); ctx.fill();
    ctx.strokeStyle = shade(r.color === '#ffffff' ? '#cccccc' : r.color, -0.4); ctx.stroke();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.roundRect(-3.5, -7, 7, 9, 2); ctx.fill();
    ctx.fillStyle = '#5d4037';
    ctx.beginPath(); ctx.arc(0, -3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = r.color;
    ctx.fillText(r.name, ch.x, ch.y - 22 + bob);
  }
}

// Brillos aditivos: orbes, cofres, órbitas, auras.
function drawGlows(ctx, game, vis) {
  const t = game.time;
  for (const o of game.orbs) if (vis(o.x, o.y, 30)) drawGlow(ctx, o.x, o.y + Math.sin(t * 3 + o.bob) * 2, ORB_SIZES[o.type] * 3, ORB_COLORS[o.type], 0.4 + Math.sin(t * 4 + o.bob) * 0.1);
  for (const ch of game.chests) if (vis(ch.x, ch.y, 40)) drawGlow(ctx, ch.x, ch.y, 44, RARITIES[ch.rarity].color, 0.35 + Math.sin(t * 3) * 0.1);
  for (const h of game.hearts) if (vis(h.x, h.y, 30)) drawGlow(ctx, h.x, h.y + Math.sin(t * 3 + h.bob) * 2, 26, '#ff4d6d', 0.45 + Math.sin(t * 5 + h.bob) * 0.15);
  for (const pw of game.player.allPowers()) {
    if (pw.def.kind === 'orbit') for (const [ox, oy] of pw.orbs) drawGlow(ctx, ox, oy, pw.stats.size * 2.6, pw.color, 0.5);
  }
  for (const s of game.enemyShots) if (vis(s.x, s.y, 20)) drawGlow(ctx, s.x, s.y, s.size * 3, s.color, 0.5);
  const p = game.player;
  drawGlow(ctx, p.x, p.y, 70, p.cls.look.accent, 0.12);
  if (game.boss && !game.boss.dead) drawGlow(ctx, game.boss.x, game.boss.y, game.boss.size * (game.boss.phase2 ? 3 : 2.2), game.boss.phase2 ? '#ff1744' : game.boss.color, game.boss.phase2 ? 0.35 + Math.sin(t * 6) * 0.1 : 0.25);
  for (const e of game.enemies) if (e.elite && !e.dead && vis(e.x, e.y, e.size * 2)) drawGlow(ctx, e.x, e.y, e.size * 2.4, e.modColor, 0.22);
}

// Auras y órbitas dibujadas desde las instancias de poder.
function drawFields(ctx, game) {
  const p = game.player;
  for (const pw of game.player.allPowers()) {
    const s = pw.stats;
    if (pw.def.kind === 'aura') {
      const pulse = 1 + Math.sin(game.time * 4) * 0.03;
      const r = s.radius * pulse;
      const grd = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, pw.color);
      ctx.globalAlpha = 0.22; ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7; ctx.strokeStyle = pw.color; ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]); ctx.lineDashOffset = -pw.angle * 40;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.88, 0, Math.PI * 2); ctx.stroke();
      // glifos orbitando
      ctx.fillStyle = pw.color; ctx.globalAlpha = 0.9;
      for (let i = 0; i < 6; i++) {
        const a = pw.angle + (i * Math.PI * 2) / 6;
        const gx = p.x + Math.cos(a) * r * 0.94, gy = p.y + Math.sin(a) * r * 0.94;
        ctx.beginPath(); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx + 4, gy); ctx.lineTo(gx, gy + 4); ctx.lineTo(gx - 4, gy); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (pw.def.kind === 'orbit') {
      for (const [ox, oy] of pw.orbs) {
        ctx.fillStyle = pw.color;
        ctx.beginPath(); ctx.arc(ox, oy, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = shade(pw.color, -0.4); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(ox - s.size * 0.3, oy - s.size * 0.3, s.size * 0.4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function drawEnemies(ctx, game, vis) {
  const p = game.player, t = game.time;
  for (const e of game.enemies) {
    if (e.dead || !vis(e.x, e.y, e.size * 2 + 40)) continue;
    const st = e.status;
    const sp = getEnemySprite(e, false);
    const scale = e.size / e.def.size;
    const dx = p.x - e.x, dy = p.y - e.y;
    const spawnK = Math.min(1, e.spawnT / 0.35);
    ctx.save();
    const bob = FLOATING.has(e.shape) ? Math.sin(t * 5 + e.wobble) * 3 : 0;
    ctx.translate(e.x, e.y + bob);
    ctx.globalAlpha = (e.ghost ? 0.82 : 1) * spawnK;
    if (FACING_ROTATE.has(e.shape)) ctx.rotate(Math.atan2(dy, dx));
    else if (!SYMMETRIC.has(e.shape) && dx < 0) ctx.scale(-1, 1);
    if (e.shape === 'star') ctx.rotate(t * 2 + e.wobble);
    else if (e.shape === 'crystal' || e.shape === 'orb') ctx.rotate(Math.sin(t * 2 + e.wobble) * 0.12);
    else if (e.shape === 'blob' || e.shape === 'mushroom' || e.shape === 'jelly') { const w = Math.sin(t * 6 + e.wobble) * 0.08; ctx.scale(1 + w, 1 - w); }
    else if (e.shape === 'spider' || e.shape === 'beetle' || e.shape === 'skull' || e.shape === 'square') { ctx.translate(0, Math.abs(Math.sin(t * 9 + e.wobble)) * -2.5); }
    if (e.dashT > 0) ctx.scale(1.15, 0.9);
    const asset = ASSETS.get(e.boss ? 'bosses' : 'enemies', e.type);
    if (asset) {
      // sprite externo (assets/): animado por tiempo, escalado al tamaño del enemigo
      const k = 0.5 + spawnK * 0.5;
      ctx.scale(k, k);
      const fr = ASSETS.frame(asset, t, e.wobble);
      ASSETS.draw(ctx, asset, fr, e.size * 2.4 * asset.scale);
      if (e.flash > 0) { ctx.globalAlpha = 0.85; ASSETS.draw(ctx, asset, fr, e.size * 2.4 * asset.scale, true); }
    } else {
      ctx.scale(scale * (0.5 + spawnK * 0.5), scale * (0.5 + spawnK * 0.5));
      ctx.drawImage(sp.canvas, -sp.pad, -sp.pad);
      if (e.flash > 0) {
        const fs = getEnemySprite(e, true);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(fs.canvas, -fs.pad, -fs.pad);
      }
    }
    ctx.restore();

    // indicadores de estado
    const s = e.size;
    if (st.stun) {
      ctx.fillStyle = 'rgba(179,229,252,0.45)'; ctx.beginPath(); ctx.arc(e.x, e.y, s + 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e1f5fe'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const a = t * 3 + (i * Math.PI * 2) / 3; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * (s + 6), e.y - s * 0.6 + Math.sin(a) * 4, 2, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (st.burn) { ctx.fillStyle = 'rgba(255,107,53,0.85)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(e.x + Math.sin(t * 10 + i * 2) * s * 0.5, e.y - s - 4 - ((t * 40 + i * 9) % 12), 3, 0, Math.PI * 2); ctx.fill(); } }
    if (st.poison) { ctx.fillStyle = 'rgba(174,213,129,0.85)'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(e.x + Math.cos(t * 6 + i * 3) * s * 0.6, e.y - s - 2 - ((t * 25 + i * 7) % 10), 2.5, 0, Math.PI * 2); ctx.fill(); } }
    if (st.wet) { ctx.strokeStyle = 'rgba(79,195,247,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, s + 4, 0, Math.PI * 2); ctx.stroke(); }
    if (st.slow) { ctx.strokeStyle = 'rgba(128,222,234,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(e.x, e.y, s + 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (st.curse) { ctx.fillStyle = '#b388ff'; ctx.font = `${Math.max(10, s * 0.7)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('☠', e.x, e.y - s - 8); }
    if (e.elite && !e.boss) {
      const mc = e.modColor;
      ctx.strokeStyle = mc; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(e.x, e.y, s + 6, t * 3, t * 3 + 4.5); ctx.stroke();
      if (e.mods.length > 1) { ctx.strokeStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(e.x, e.y, s + 10, -t * 2, -t * 2 + 3.5); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - s, e.y - s - 12, s * 2, 4);
      ctx.fillStyle = mc; ctx.fillRect(e.x - s, e.y - s - 12, s * 2 * (e.hp / e.maxHp), 4);
      if (e.mods.length) {
        ctx.font = 'bold 11px "Nunito", sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#000'; ctx.fillText(e.modLabel, e.x + 1, e.y - s - 16);
        ctx.fillStyle = mc; ctx.fillText(e.modLabel, e.x, e.y - s - 17);
      }
    }
    if (e.boss) {
      const col = e.phase2 ? '#ff1744' : e.final ? '#b71c1c' : '#ff1744';
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(e.x, e.y, s + 8, -t * 2, -t * 2 + 5); ctx.stroke();
      if (e.phase2) {
        ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3;
        ctx.beginPath(); ctx.arc(e.x, e.y, s + 16 + Math.sin(t * 6) * 4, t * 3, t * 3 + 4); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.font = `${s * 0.6}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(e.final ? '💀' : '👑', e.x, e.y - s - 8);
    }
  }
}

function drawEnemyShots(ctx, game, vis) {
  for (const s of game.enemyShots) {
    if (!vis(s.x, s.y, 20)) continue;
    ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(s.x - s.size * 0.25, s.y - s.size * 0.25, s.size * 0.35, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  if (game.state === 'dying' && game.won) {
    drawSilhouette(ctx, p.cls.look, p.x, p.y, 1, p.walk, false, p.facing.x < 0 ? -1 : 1, false);
    return;
  }
  if (game.state === 'dying') {
    // desvanecimiento con elevación
    const k = Math.min(1, Math.max(0, game.dyingT) / 1.0);
    ctx.globalAlpha = 1 - k;
    drawSilhouette(ctx, p.cls.look, p.x, p.y - k * 30, 1 + k * 0.3, p.walk, false, p.facing.x < 0 ? -1 : 1, true);
    ctx.globalAlpha = 1;
    return;
  }
  const blink = p.invuln > 0 && Math.floor(game.time * 30) % 2 === 0;
  ctx.globalAlpha = 0.05; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.stats.pickupRadius, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  const asset = ASSETS.get('player', p.cls.id);
  if (!blink && asset) {
    const bob = p.moving ? Math.abs(Math.sin(p.walk)) * 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 21, 13, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y - bob);
    if (p.facing.x < 0) ctx.scale(-1, 1);
    const fr = p.moving ? Math.floor((p.walk / 9) * asset.fps) % asset.frames : 0;
    ASSETS.draw(ctx, asset, fr, 52 * asset.scale);
    if (p.hurtFlash > 0) { ctx.globalAlpha = 0.6; ASSETS.draw(ctx, asset, fr, 52 * asset.scale, true); }
    ctx.restore();
    ctx.globalAlpha = 1;
  } else if (!blink) {
    drawSilhouette(ctx, p.cls.look, p.x, p.y, 1, p.walk, p.moving, p.facing.x < 0 ? -1 : 1, p.hurtFlash > 0);
  }
  if (p.hp < p.stats.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(p.x - 17, p.y + 24, 34, 5, 2); ctx.fill();
    ctx.fillStyle = p.hp / p.stats.maxHp > 0.3 ? '#66bb6a' : '#ef5350';
    ctx.beginPath(); ctx.roundRect(p.x - 16, p.y + 25, 32 * (p.hp / p.stats.maxHp), 3, 1); ctx.fill();
  }
}

function drawTexts(ctx, game) {
  ctx.textAlign = 'center';
  for (const t of game.texts) {
    const k = t.t / t.life;
    const scale = k < 0.15 ? 1 + (0.15 - k) * 3 : 1;
    ctx.globalAlpha = 1 - k;
    ctx.font = `bold ${Math.round(t.size * scale)}px "Nunito", sans-serif`;
    ctx.fillStyle = '#000';
    ctx.fillText(t.text, t.x + 1, t.y + 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
