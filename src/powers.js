import { ELEMENTS, ELEMENT_INTERACTIONS, familyOf } from './data/elements.js';
import { ITEMS } from './data/items.js';
import { rand, dist2, shuffle } from './utils.js';
import { damageEnemy, applyStatus } from './enemies.js';
import { drawGlow, shade } from './sprites.js';
import { ASSETS } from './assets.js';

// Estilo visual de los proyectiles por elemento.
const VISUAL = {
  fuego: 'flame', lava: 'flame', agua: 'shard', hielo: 'shard', sangre: 'drop', tierra: 'rock', arena: 'rock',
  metal: 'blade', aire: 'blade', espiritu: 'wisp', luz: 'orb', energia: 'orb', rayo: 'bolt',
  oscuridad: 'dagger', vacio: 'dagger', naturaleza: 'leaf', veneno: 'dart',
};

// ─── Estadísticas por nivel ────────────────────────────────
export function computeStats(def, level) {
  const s = JSON.parse(JSON.stringify(def.base));
  for (let l = 2; l <= level; l++) {
    if (def.growth) for (const k in def.growth) s[k] = (s[k] || 0) + def.growth[k];
    const m = def.milestones && def.milestones[l];
    if (m) for (const k in m) s[k] = (s[k] || 0) + m[k];
  }
  return s;
}

// ─── Golpe a un enemigo (daño + estados + empuje + interacciones) ──
export function hitEnemy(game, enemy, power, dmg, kbx = 0, kby = 0, kb = 0) {
  if (enemy.dead) return;
  const el = power.def.element;
  const fam = familyOf(el);
  let mult = 1;
  if ((el === 'rayo' || el === 'energia') && enemy.status.wet) mult *= ELEMENT_INTERACTIONS.rayoVsWet;
  if ((fam === 'fuego' || el === 'lava') && enemy.status.stun) mult *= ELEMENT_INTERACTIONS.fuegoVsStun;
  if (enemy.status.curse) mult *= ELEMENT_INTERACTIONS.curseMult;
  // golpe crítico: 5% base + suerte
  const crit = Math.random() < Math.min(0.5, 0.05 + game.player.stats.luck * 0.1);
  if (crit) mult *= 2;
  const dealt = damageEnemy(game, enemy, dmg * mult, el, power.def.id, false, crit);
  const steal = (power.stats.lifesteal || 0) + game.player.stats.lifesteal;
  if (steal > 0 && dealt > 0) game.player.heal(dealt * steal);
  if (game.particles.list.length < game.particles.max * 0.7 && Math.random() < 0.6) {
    game.particles.emitElement(enemy.x, enemy.y, el, 2, { speed: 90, jitter: enemy.size * 0.4 });
  }
  if (enemy.dead) return;
  const st = power.stats.status;
  if (st) for (const k in st) applyStatus(enemy, k, st[k]);
  if (st && st.poison && game.player.stats.flags.poisonSlow) applyStatus(enemy, 'slow', { factor: 0.6, dur: st.poison.dur });
  if (el === 'hielo' && enemy.status.wet) {
    applyStatus(enemy, 'stun', { dur: ELEMENT_INTERACTIONS.hieloFreezeOnWet });
    delete enemy.status.wet;
  }
  if (kb > 0 && !enemy.boss) { enemy.kx += kbx * kb; enemy.ky += kby * kb; }
}

// ─── Instancia de poder del jugador ────────────────────────
export class PowerInstance {
  constructor(game, def, level = 1) {
    this.game = game;
    this.def = def;
    this.level = level;
    this.timer = 0.3;
    this.angle = 0;
    this.tick = 0;
    this.emitT = 0;
    this.orbs = [];
    this.orbTrails = [];
    this.hitTimes = new Map();
    this.recompute();
  }
  get element() { return ELEMENTS[this.def.element]; }
  get color() { return this.element.color; }
  get maxLevel() { return this.def.maxLevel || 8; }

  recompute() {
    const p = this.game.player;
    const ps = p.stats;
    const s = computeStats(this.def, this.level + (this.def.evolved ? 0 : ps.powerLevelBonus));
    s.flags = {};
    s.damage *= ps.damageMult;
    if (s.radius) s.radius *= ps.areaMult;
    if (s.size) s.size *= ps.areaMult;
    if (s.width) s.width *= ps.areaMult;
    if (s.blast) s.blast *= ps.areaMult;
    if (s.duration) s.duration *= ps.durationMult;
    if (s.knockback) s.knockback *= ps.knockbackMult;
    if (s.status) for (const k in s.status) if (s.status[k].dur) s.status[k].dur *= ps.durationMult * ps.statusDurMult;
    if (this.def.kind === 'projectile') { s.count += ps.extraProjectiles; s.speed *= ps.projSpeedMult; }
    if (familyOf(this.def.element) === p.cls.element) {
      s.damage *= 1 + p.cls.bonus.damage;
      if (s.cooldown != null) s.cooldown *= p.cls.bonus.cooldown;
    }
    for (const it of p.items) { const d = ITEMS[it.id]; if (d.powerMod) d.powerMod(s, this.def, it.level); }
    for (const sy of p.itemSynergies || []) if (sy.powerMod) sy.powerMod(s, this.def);
    if (s.cooldown != null) s.cooldown = Math.max(0.12, s.cooldown * ps.cooldownMult);
    this.stats = s;
  }

  levelUp() {
    if (this.level < this.maxLevel) { this.level++; this.recompute(); }
  }

  update(dt) {
    const k = KINDS[this.def.kind];
    if (!k) return;
    if (k.passive) { k.update(this, dt); return; }
    this.timer -= dt;
    if (this.timer <= 0) { this.timer += this.stats.cooldown; k.fire(this); this.game.audio.cast(this.def.element, this.def.kind); }
  }
}

// ─── Direcciones de disparo ────────────────────────────────
function aimDirs(pw) {
  const g = pw.game, p = g.player, s = pw.stats;
  const n = Math.max(1, Math.round(s.count));
  const dirs = [];
  const aim = pw.def.aim || 'nearest';
  if (aim === 'ring') {
    const off = rand(0, Math.PI * 2);
    for (let i = 0; i < n; i++) { const a = off + (i * Math.PI * 2) / n; dirs.push([Math.cos(a), Math.sin(a)]); }
    return dirs;
  }
  if (aim === 'random') {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2); dirs.push([Math.cos(a), Math.sin(a)]); }
    return dirs;
  }
  let bx, by;
  if (aim === 'facing') { bx = p.facing.x; by = p.facing.y; }
  else if (aim === 'behind') { bx = -p.facing.x; by = -p.facing.y; }
  else {
    const t = g.nearestEnemy(p.x, p.y, s.range || 700);
    if (t) { const d = Math.hypot(t.x - p.x, t.y - p.y) || 1; bx = (t.x - p.x) / d; by = (t.y - p.y) / d; }
    else { bx = p.facing.x; by = p.facing.y; }
  }
  const base = Math.atan2(by, bx);
  const spread = ((s.spread || 20) * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? base : base - spread / 2 + (spread * i) / (n - 1);
    dirs.push([Math.cos(a), Math.sin(a)]);
  }
  return dirs;
}

// ─── Proyectiles ───────────────────────────────────────────
export class Projectile {
  constructor(pw, x, y, dx, dy, opts = {}) {
    const s = pw.stats;
    this.power = pw;
    this.x = x; this.y = y;
    this.speed = s.speed;
    this.vx = dx * s.speed; this.vy = dy * s.speed;
    this.size = opts.size ?? s.size;
    this.damage = opts.damage ?? s.damage;
    this.pierce = opts.pierce ?? (s.pierce || 0);
    this.life = opts.life ?? (s.range || 600) / s.speed;
    this.homing = !!pw.def.homing;
    this.kb = s.knockback || 0;
    this.isSplit = !!opts.isSplit;
    this.hit = new Set();
    this.dead = false;
    this.color = pw.color;
    this.light = shade(pw.color, 0.5);
    this.visual = VISUAL[pw.def.element] || 'orb';
    this.spin = rand(0, Math.PI * 2);
    this.trail = [];
    this.emitT = 0;
  }
  update(dt, g) {
    if (this.homing) {
      const t = g.nearestEnemy(this.x, this.y, 420, this.hit);
      if (t) {
        const d = Math.hypot(t.x - this.x, t.y - this.y) || 1;
        this.vx += ((t.x - this.x) / d) * this.speed * 3 * dt;
        this.vy += ((t.y - this.y) / d) * this.speed * 3 * dt;
        const l = Math.hypot(this.vx, this.vy) || 1;
        this.vx = (this.vx / l) * this.speed; this.vy = (this.vy / l) * this.speed;
      }
    }
    this.trail.push(this.x, this.y);
    if (this.trail.length > 14) this.trail.splice(0, 2);
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt; this.spin += dt * 12;
    this.emitT -= dt;
    if (this.emitT <= 0 && g.particles.list.length < g.particles.max * 0.6) {
      this.emitT = 0.06;
      g.particles.emitElement(this.x, this.y, this.power.def.element, 1, { speed: 30, life: [0.15, 0.35], size: [1, this.size * 0.4] });
    }
    if (this.life <= 0) { this.dead = true; return; }
    const flags = this.power.stats.flags;
    g.grid.query(this.x, this.y, this.size + 40, (e) => {
      if (this.dead || this.hit.has(e.id)) return;
      const r = e.size + this.size;
      if (dist2(this.x, this.y, e.x, e.y) > r * r) return;
      this.hit.add(e.id);
      const l = Math.hypot(this.vx, this.vy) || 1;
      hitEnemy(g, e, this.power, this.damage, this.vx / l, this.vy / l, this.kb);
      if (flags.explode && (!this.isSplit || g.player.stats.flags.splitExplode)) {
        const br = 55 * g.player.stats.areaMult;
        g.grid.query(this.x, this.y, br + 40, (o) => {
          if (o === e) return;
          const rr = br + o.size;
          if (dist2(this.x, this.y, o.x, o.y) <= rr * rr) hitEnemy(g, o, this.power, this.damage * 0.5);
        });
        g.addRing(this.x, this.y, 6, br, this.color, 0.25);
        g.particles.emitElement(this.x, this.y, this.power.def.element, 8, { speed: 160 });
      }
      if (flags.split && !this.isSplit) {
        const a = Math.atan2(this.vy, this.vx);
        for (const off of [-0.6, 0.6]) {
          g.projectiles.push(new Projectile(this.power, this.x, this.y, Math.cos(a + off), Math.sin(a + off),
            { damage: this.damage * 0.5, size: this.size * 0.75, pierce: 0, life: 0.5, isSplit: true }));
        }
      }
      if (this.pierce <= 0) { this.dead = true; return; }
      this.pierce--;
      if (flags.bounce) {
        const t = g.nearestEnemy(this.x, this.y, 350, this.hit);
        if (t) {
          const d = Math.hypot(t.x - this.x, t.y - this.y) || 1;
          this.vx = ((t.x - this.x) / d) * this.speed; this.vy = ((t.y - this.y) / d) * this.speed;
          this.life = Math.max(this.life, 0.8);
        }
      }
    });
  }
  draw(ctx) {
    const s = this.size, c = this.color, v = this.visual;
    const ang = Math.atan2(this.vy, this.vx);
    // estela
    const tr = this.trail, n = tr.length / 2;
    if (n > 1) {
      ctx.strokeStyle = c; ctx.lineCap = 'round';
      for (let i = 1; i < n; i++) {
        const k = i / n;
        ctx.globalAlpha = k * 0.45; ctx.lineWidth = s * 1.6 * k;
        ctx.beginPath(); ctx.moveTo(tr[(i - 1) * 2], tr[(i - 1) * 2 + 1]); ctx.lineTo(tr[i * 2], tr[i * 2 + 1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    const asset = ASSETS.get('projectiles', this.power.def.element);
    if (asset) {
      ctx.rotate(ang);
      ASSETS.draw(ctx, asset, ASSETS.frame(asset, this.spin / 12, 0), s * 3 * asset.scale);
      ctx.restore();
      return;
    }
    switch (v) {
      case 'flame': {
        ctx.rotate(ang);
        ctx.fillStyle = c; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(-s * 2.6, 0); ctx.quadraticCurveTo(-s, -s * 1.1, s * 0.4, -s * 0.6); ctx.quadraticCurveTo(-s, s * 1.1, -s * 2.6, 0); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(s * 0.15, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'shard': {
        ctx.rotate(ang);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(s * 2.2, 0); ctx.lineTo(0, -s * 0.9); ctx.lineTo(-s * 1.6, 0); ctx.lineTo(0, s * 0.9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.moveTo(s * 1.6, 0); ctx.lineTo(0, -s * 0.4); ctx.lineTo(-s * 0.8, 0); ctx.lineTo(0, s * 0.4); ctx.closePath(); ctx.fill();
        break;
      }
      case 'drop': {
        ctx.rotate(ang);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(s * 1.8, 0); ctx.quadraticCurveTo(0, -s * 1.2, -s * 0.9, 0); ctx.quadraticCurveTo(0, s * 1.2, s * 1.8, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.3, s * 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'rock': {
        ctx.rotate(this.spin);
        ctx.fillStyle = c;
        ctx.beginPath();
        for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const r = s * (0.8 + ((i * 7) % 3) * 0.15); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'blade': {
        ctx.rotate(ang);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0, 0, s * 2, -1.2, 1.2); ctx.arc(s * 0.9, 0, s * 1.5, 1.0, -1.0, true); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(0, 0, s * 2, -1.1, 1.1); ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
      case 'wisp': {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.2, s * 0.15, 0, Math.PI * 2); ctx.arc(s * 0.3, -s * 0.2, s * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case 'bolt': {
        ctx.rotate(ang);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.5;
        ctx.beginPath(); ctx.moveTo(-s * 2, 0); ctx.lineTo(-s * 0.8, -s * 0.7); ctx.lineTo(0, s * 0.5); ctx.lineTo(s * 1.4, -s * 0.3); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = s * 0.25; ctx.stroke();
        break;
      }
      case 'dagger': {
        ctx.rotate(ang);
        ctx.fillStyle = shade(c, -0.3);
        ctx.beginPath(); ctx.moveTo(s * 2.4, 0); ctx.lineTo(-s * 0.5, -s * 0.6); ctx.lineTo(-s * 1.4, 0); ctx.lineTo(-s * 0.5, s * 0.6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(s * 2.4, 0); ctx.lineTo(-s * 0.5, -s * 0.25); ctx.lineTo(-s * 0.5, s * 0.25); ctx.closePath(); ctx.fill();
        break;
      }
      case 'leaf': {
        ctx.rotate(ang + Math.sin(this.spin) * 0.3);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 1.8, s * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-s * 1.6, 0); ctx.lineTo(s * 1.6, 0); ctx.stroke();
        break;
      }
      case 'dart': {
        ctx.rotate(ang);
        ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = s * 0.7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-s * 2, 0); ctx.lineTo(s * 1.5, 0); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(s * 2.4, 0); ctx.lineTo(s * 0.8, -s * 0.7); ctx.lineTo(s * 0.8, s * 0.7); ctx.closePath(); ctx.fill();
        break;
      }
      default: { // orb
        ctx.rotate(this.spin);
        ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; ctx.moveTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6); ctx.lineTo(Math.cos(a) * s * 2.2, Math.sin(a) * s * 2.2); }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  drawGlow(ctx) { drawGlow(ctx, this.x, this.y, this.size * 3.2, this.color, 0.55); }
}

// ─── Zonas transitorias ────────────────────────────────────
export class Strike {
  constructor(pw, x, y) {
    this.power = pw; this.x = x; this.y = y;
    this.delay = pw.stats.delay; this.t = this.delay;
    this.r = pw.stats.radius;
    this.dead = false; this.color = pw.color;
    const el = pw.def.element;
    this.style = (el === 'fuego' || el === 'lava') && this.delay >= 0.5 ? 'meteor'
      : (el === 'rayo' || el === 'luz' || el === 'energia') ? 'column'
      : (el === 'tierra' || el === 'hielo' || el === 'metal' || el === 'naturaleza' || el === 'arena') ? 'spikes' : 'blast';
  }
  update(dt, g) {
    this.t -= dt;
    if (this.t > 0) return;
    const s = this.power.stats;
    g.grid.query(this.x, this.y, this.r + 40, (e) => {
      const r = this.r + e.size;
      if (dist2(this.x, this.y, e.x, e.y) <= r * r) {
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 1;
        hitEnemy(g, e, this.power, s.damage, dx / d, dy / d, s.knockback || 0);
      }
    });
    const el = this.power.def.element, color = this.color, x = this.x, y = this.y, r = this.r, style = this.style;
    g.addRing(x, y, r * 0.3, r * 1.25, color, 0.35);
    g.particles.emitElement(x, y, el, 14, { speed: 180, jitter: r * 0.3 });
    if (style === 'column') {
      g.addEffect({ dur: 0.28, additive: true, draw(ctx, k) {
        const w = r * 0.5 * (1 - k) + 2;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = color; ctx.fillRect(x - w, y - 900, w * 2, 900);
        ctx.fillStyle = '#fff'; ctx.fillRect(x - w * 0.35, y - 900, w * 0.7, 900);
        drawGlow(ctx, x, y, r * 1.6, color, 0.8 * (1 - k));
        ctx.globalAlpha = 1;
      } });
    } else if (style === 'spikes') {
      const spikes = [];
      for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2), d = rand(0, r * 0.75); spikes.push([x + Math.cos(a) * d, y + Math.sin(a) * d, rand(r * 0.35, r * 0.7), rand(-0.4, 0.4)]); }
      const dark = shade(color, -0.35);
      g.addEffect({ dur: 0.5, draw(ctx, k) {
        const h = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7;
        ctx.globalAlpha = 1;
        for (const [sx, sy, sh, tilt] of spikes) {
          ctx.fillStyle = dark;
          ctx.beginPath(); ctx.moveTo(sx - sh * 0.3, sy); ctx.lineTo(sx + tilt * sh, sy - sh * h); ctx.lineTo(sx + sh * 0.3, sy); ctx.closePath(); ctx.fill();
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.moveTo(sx - sh * 0.3, sy); ctx.lineTo(sx + tilt * sh, sy - sh * h); ctx.lineTo(sx, sy); ctx.closePath(); ctx.fill();
        }
      } });
    } else {
      g.addEffect({ dur: 0.25, additive: true, draw(ctx, k) { drawGlow(ctx, x, y, r * 1.8, color, 0.9 * (1 - k)); } });
    }
    g.shakeScreen(style === 'meteor' ? 5 : 2);
    g.audio.impact(el);
    this.dead = true;
  }
  draw(ctx, g) {
    const k = 1 - this.t / this.delay;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.75;
    ctx.setLineDash([8, 6]); ctx.lineDashOffset = -g.time * 60;
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35 * k; ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(0, 0, this.r * k, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    if (this.style === 'meteor') {
      const mx = this.x + 320 * (1 - k), my = this.y - 520 * (1 - k);
      ctx.strokeStyle = this.color; ctx.lineWidth = this.r * 0.35; ctx.lineCap = 'round'; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(mx + 70, my - 110); ctx.lineTo(mx, my); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(mx, my, this.r * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(mx, my, this.r * 0.16, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export class Nova {
  constructor(pw) {
    const p = pw.game.player;
    this.power = pw; this.x = p.x; this.y = p.y;
    this.t = 0; this.dur = pw.stats.duration; this.maxR = pw.stats.radius;
    this.hit = new Set(); this.dead = false; this.color = pw.color;
  }
  update(dt, g) {
    this.t += dt;
    const r = this.maxR * Math.min(1, this.t / this.dur);
    const s = this.power.stats;
    g.grid.query(this.x, this.y, r + 40, (e) => {
      if (this.hit.has(e.id)) return;
      const rr = r + e.size;
      if (dist2(this.x, this.y, e.x, e.y) <= rr * rr) {
        this.hit.add(e.id);
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 1;
        hitEnemy(g, e, this.power, s.damage, dx / d, dy / d, s.knockback || 0);
      }
    });
    if (g.particles.list.length < g.particles.max * 0.7) {
      for (let i = 0; i < 3; i++) { const a = rand(0, Math.PI * 2); g.particles.emitElement(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, this.power.def.element, 1, { speed: 60, angle: a, arc: 0.4 }); }
    }
    if (this.t >= this.dur) this.dead = true;
  }
  draw(ctx) {
    const k = Math.min(1, this.t / this.dur);
    const r = this.maxR * k;
    ctx.strokeStyle = this.color; ctx.lineWidth = 14 * (1 - k) + 3; ctx.globalAlpha = 1 - k * 0.6;
    ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(this.x, this.y, r * 0.96, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.2 * (1 - k); ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class Beam {
  constructor(pw, angle) {
    this.power = pw; this.angle = angle;
    this.t = pw.stats.duration; this.dur = this.t; this.tick = 0;
    this.dead = false; this.color = pw.color;
  }
  update(dt, g) {
    const p = g.player, s = this.power.stats;
    this.t -= dt; this.tick -= dt;
    const tgt = g.nearestEnemy(p.x, p.y, s.range);
    if (tgt) {
      const ta = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      let da = ta - this.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      this.angle += Math.sign(da) * Math.min(Math.abs(da), 2.5 * dt);
    }
    if (this.tick <= 0) {
      this.tick = s.tick;
      const cx = Math.cos(this.angle), cy = Math.sin(this.angle);
      for (const e of g.enemies) {
        if (e.dead) continue;
        const dx = e.x - p.x, dy = e.y - p.y;
        const proj = dx * cx + dy * cy;
        if (proj < 0 || proj > s.range) continue;
        const perp = Math.abs(dx * cy - dy * cx);
        if (perp <= s.width / 2 + e.size) hitEnemy(g, e, this.power, s.damage);
      }
      if (g.particles.list.length < g.particles.max * 0.7) {
        const d = rand(20, s.range);
        g.particles.emitElement(p.x + cx * d, p.y + cy * d, this.power.def.element, 2, { speed: 40 });
      }
    }
    if (this.t <= 0) this.dead = true;
  }
  draw(ctx, g) {
    const p = g.player, s = this.power.stats;
    const fade = Math.min(1, this.t / 0.2, (this.dur - this.t) / 0.12 + 0.2);
    const flick = 1 + Math.sin(g.time * 40) * 0.12;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(this.angle);
    ctx.globalAlpha = 0.28 * fade; ctx.fillStyle = this.color;
    ctx.fillRect(0, -s.width * 0.8 * flick, s.range, s.width * 1.6 * flick);
    ctx.globalAlpha = 0.6 * fade;
    ctx.fillRect(0, -s.width / 2, s.range, s.width);
    ctx.globalAlpha = 0.95 * fade; ctx.fillStyle = '#fff';
    ctx.fillRect(0, -s.width / 6 * flick, s.range, s.width / 3 * flick);
    ctx.restore();
    ctx.globalAlpha = 1;
    drawGlow(ctx, p.x + Math.cos(this.angle) * s.range, p.y + Math.sin(this.angle) * s.range, s.width * 1.5, this.color, 0.7 * fade);
    drawGlow(ctx, p.x, p.y, s.width * 1.2, this.color, 0.6 * fade);
  }
}

export class Wanderer {
  constructor(pw) {
    const p = pw.game.player;
    this.power = pw; this.x = p.x; this.y = p.y;
    this.a = rand(0, Math.PI * 2);
    this.t = pw.stats.duration; this.dur = this.t; this.tick = 0; this.turn = 0; this.spin = 0;
    this.dead = false; this.color = pw.color;
    const el = pw.def.element;
    this.style = el === 'aire' ? 'tornado' : 'cloud';
  }
  update(dt, g) {
    const s = this.power.stats;
    this.t -= dt; this.turn -= dt; this.spin += dt * 7;
    if (this.turn <= 0) {
      this.turn = rand(0.5, 1.5);
      const tgt = g.nearestEnemy(this.x, this.y, 320);
      if (tgt && Math.random() < 0.6) this.a = Math.atan2(tgt.y - this.y, tgt.x - this.x);
      else this.a += rand(-1.5, 1.5);
    }
    this.x += Math.cos(this.a) * s.speed * dt;
    this.y += Math.sin(this.a) * s.speed * dt;
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = s.tick;
      g.grid.query(this.x, this.y, s.radius + 40, (e) => {
        const r = s.radius + e.size;
        if (dist2(this.x, this.y, e.x, e.y) <= r * r) {
          const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 1;
          hitEnemy(g, e, this.power, s.damage, dx / d, dy / d, s.knockback || 0);
        }
      });
      if (g.particles.list.length < g.particles.max * 0.7) g.particles.emitElement(this.x, this.y, this.power.def.element, 2, { speed: 80, jitter: s.radius * 0.6 });
    }
    if (this.t <= 0) this.dead = true;
  }
  draw(ctx) {
    const s = this.power.stats;
    const fade = Math.min(1, this.t / 0.4, (this.dur - this.t) / 0.4);
    if (this.style === 'tornado') {
      for (let i = 0; i < 5; i++) {
        const r = s.radius * (0.3 + i * 0.18);
        ctx.strokeStyle = i % 2 ? '#fff' : this.color; ctx.lineWidth = 3; ctx.globalAlpha = (0.7 - i * 0.1) * fade;
        ctx.beginPath(); ctx.ellipse(this.x + Math.sin(this.spin + i) * 4, this.y - i * s.radius * 0.35, r, r * 0.4, this.spin * 0.3, this.spin + i, this.spin + i + 4.5); ctx.stroke();
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const a = this.spin * 0.5 + (i * Math.PI * 2) / 6;
        const r = s.radius * 0.45;
        ctx.fillStyle = this.color; ctx.globalAlpha = 0.28 * fade;
        ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r * 0.7, s.radius * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 0.12 * fade; ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, s.radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class MeleeSlash {
  constructor(pw, angle) {
    this.power = pw; this.angle = angle; this.t = 0.26; this.dur = 0.26;
    this.dead = false; this.color = pw.color;
    const p = pw.game.player; this.x = p.x; this.y = p.y;
  }
  update(dt) { this.t -= dt; if (this.t <= 0) this.dead = true; }
  draw(ctx, g) {
    const p = g.player, s = this.power.stats;
    const k = this.t / this.dur;
    const half = ((s.arc / 2) * Math.PI) / 180;
    const sweep = (1 - k) * 2 - 1; // -1..1: el borde blanco barre el arco
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 0.45 * k; ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, s.radius, this.angle - half, this.angle + half); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = (0.9 - i * 0.25) * k; ctx.strokeStyle = i === 0 ? '#fff' : this.color; ctx.lineWidth = 4 - i;
      ctx.beginPath(); ctx.arc(0, 0, s.radius * (0.95 - i * 0.12), this.angle - half, this.angle + half * Math.min(1, sweep + 1)); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export class Pool {
  constructor(pw, x, y) {
    this.power = pw; this.x = x; this.y = y;
    this.t = pw.stats.duration; this.dur = this.t; this.tick = 0.05; this.spin = rand(0, 6);
    this.dead = false; this.color = pw.color;
    const el = pw.def.element;
    this.style = el === 'lava' || el === 'fuego' || el === 'naturaleza' ? 'lava' : el === 'veneno' ? 'bubbles' : el === 'vacio' || el === 'energia' ? 'vortex' : 'sand';
    this.bubbles = [];
    for (let i = 0; i < 8; i++) this.bubbles.push([rand(-0.8, 0.8), rand(-0.8, 0.8), rand(0, 6), rand(0.4, 1)]);
  }
  update(dt, g) {
    const s = this.power.stats;
    this.t -= dt; this.tick -= dt; this.spin += dt;
    const doHit = this.tick <= 0;
    if (doHit) this.tick = s.tick;
    g.grid.query(this.x, this.y, s.radius + 40, (e) => {
      const r = s.radius + e.size * 0.5;
      const d2 = dist2(this.x, this.y, e.x, e.y);
      if (d2 > r * r) return;
      if (s.pull && !e.boss) {
        const d = Math.sqrt(d2) || 1;
        e.x -= ((e.x - this.x) / d) * s.pull * dt;
        e.y -= ((e.y - this.y) / d) * s.pull * dt;
      }
      if (doHit) hitEnemy(g, e, this.power, s.damage);
    });
    if (doHit && g.particles.list.length < g.particles.max * 0.6) {
      const a = rand(0, Math.PI * 2), d = rand(0, s.radius * 0.9);
      g.particles.emitElement(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, this.power.def.element, 1, { speed: 25 });
    }
    if (this.t <= 0) this.dead = true;
  }
  draw(ctx) {
    const s = this.power.stats, r = s.radius;
    const fade = Math.min(1, this.t / 0.5, (this.dur - this.t) / 0.3 + 0.2);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.32 * fade; ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.2 * fade; ctx.fillStyle = shade(this.color, -0.5);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
    if (this.style === 'lava') {
      for (const [bx, by, ph, sz] of this.bubbles) {
        const k = ((this.spin * 1.5 + ph) % 2) / 2;
        ctx.globalAlpha = (1 - k) * 0.8 * fade; ctx.fillStyle = shade(this.color, 0.4);
        ctx.beginPath(); ctx.arc(bx * r * 0.8, by * r * 0.8, r * 0.12 * sz * (0.4 + k), 0, Math.PI * 2); ctx.fill();
      }
    } else if (this.style === 'bubbles') {
      for (const [bx, by, ph, sz] of this.bubbles) {
        const k = ((this.spin + ph) % 2) / 2;
        ctx.globalAlpha = (1 - k) * 0.7 * fade; ctx.strokeStyle = shade(this.color, 0.4); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bx * r * 0.7, by * r * 0.7 - k * r * 0.5, r * 0.08 * sz, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (this.style === 'vortex') {
      ctx.strokeStyle = shade(this.color, 0.3); ctx.lineWidth = 2; ctx.globalAlpha = 0.7 * fade;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const k = i / 20; const a = -this.spin * 2.5 + arm * 2.09 + k * 4; const rr = r * k; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.stroke();
      }
      ctx.fillStyle = '#000'; ctx.globalAlpha = 0.6 * fade;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = shade(this.color, 0.2); ctx.lineWidth = 2; ctx.globalAlpha = 0.5 * fade;
      ctx.setLineDash([10, 8]); ctx.lineDashOffset = -this.spin * 40;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2); ctx.stroke();
      ctx.lineDashOffset = this.spin * 30;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export class Mine {
  constructor(pw, x, y) {
    this.power = pw; this.x = x; this.y = y; this.arm = 0.4; this.spin = rand(0, 6);
    this.dead = false; this.color = pw.color;
  }
  update(dt, g) {
    const s = this.power.stats;
    this.arm -= dt; this.spin += dt * 2;
    if (this.arm > 0) return;
    let triggered = false;
    g.grid.query(this.x, this.y, s.radius + 40, (e) => {
      const r = s.radius + e.size;
      if (dist2(this.x, this.y, e.x, e.y) <= r * r) triggered = true;
    });
    if (!triggered) return;
    g.grid.query(this.x, this.y, s.blast + 40, (e) => {
      const r = s.blast + e.size;
      if (dist2(this.x, this.y, e.x, e.y) <= r * r) {
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 1;
        hitEnemy(g, e, this.power, s.damage, dx / d, dy / d, s.knockback || 0);
      }
    });
    g.addRing(this.x, this.y, 8, s.blast, this.color, 0.35);
    g.particles.emitElement(this.x, this.y, this.power.def.element, 16, { speed: 200 });
    const x = this.x, y = this.y, blast = s.blast, color = this.color, dark = shade(this.color, -0.4);
    g.addEffect({ dur: 0.45, draw(ctx, k) {
      const h = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const len = blast * 0.9 * h;
        ctx.strokeStyle = i % 2 ? color : dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * len * 0.6, y + Math.sin(a + 0.4) * len * 0.6, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
      }
    } });
    g.audio.impact(this.power.def.element);
    this.dead = true;
  }
  draw(ctx) {
    const s = this.power.stats;
    ctx.save();
    ctx.translate(this.x, this.y); ctx.rotate(this.spin);
    ctx.strokeStyle = shade(this.color, -0.3); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.globalAlpha = this.arm > 0 ? 0.4 : 0.9;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a + 0.5) * s.radius * 0.5, Math.sin(a + 0.5) * s.radius * 0.5, Math.cos(a) * s.radius * 0.9, Math.sin(a) * s.radius * 0.9); }
    ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(0, 0, 5 + Math.sin(this.spin * 4) * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

// ─── Comportamientos por tipo ──────────────────────────────
function activeOf(g, cls, pw) { let n = 0; for (const z of g.zones) if (z instanceof cls && z.power === pw) n++; return n; }

const KINDS = {
  projectile: {
    fire(pw) {
      const p = pw.game.player;
      for (const [dx, dy] of aimDirs(pw)) pw.game.projectiles.push(new Projectile(pw, p.x + dx * 12, p.y + dy * 12, dx, dy));
    },
  },
  strike: {
    fire(pw) {
      const g = pw.game, p = g.player, s = pw.stats;
      const n = Math.max(1, Math.round(s.count));
      const cands = pw.def.target === 'random' ? [] : shuffle(g.enemies.filter((e) => !e.dead && dist2(e.x, e.y, p.x, p.y) < 520 * 520));
      for (let i = 0; i < n; i++) {
        let x, y;
        if (i < cands.length) { x = cands[i].x; y = cands[i].y; }
        else { const a = rand(0, Math.PI * 2), r = rand(60, 260); x = p.x + Math.cos(a) * r; y = p.y + Math.sin(a) * r; }
        g.zones.push(new Strike(pw, x, y));
      }
    },
  },
  chain: {
    fire(pw) {
      const g = pw.game, p = g.player, s = pw.stats;
      let cur = g.nearestEnemy(p.x, p.y, s.range);
      if (!cur) return;
      const hit = new Set();
      const pts = [[p.x, p.y]];
      let n = Math.max(1, Math.round(s.count));
      while (cur && n > 0) {
        hit.add(cur.id);
        pts.push([cur.x, cur.y]);
        hitEnemy(g, cur, pw, s.damage);
        g.particles.emitElement(cur.x, cur.y, pw.def.element, 3, { speed: 120 });
        n--;
        cur = g.nearestEnemy(cur.x, cur.y, s.jumpRange, hit);
      }
      g.addLightning(pts, pw.color);
    },
  },
  nova: {
    fire(pw) {
      const g = pw.game;
      g.zones.push(new Nova(pw));
      g.particles.emitElement(g.player.x, g.player.y, pw.def.element, 10, { speed: 200 });
    },
  },
  beam: {
    fire(pw) {
      const g = pw.game, p = g.player;
      const t = g.nearestEnemy(p.x, p.y, pw.stats.range);
      const a = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.facing.y, p.facing.x);
      g.zones.push(new Beam(pw, a));
    },
  },
  wanderer: {
    fire(pw) {
      const g = pw.game;
      if (activeOf(g, Wanderer, pw) < Math.round(pw.stats.count)) g.zones.push(new Wanderer(pw));
    },
  },
  melee: {
    fire(pw) {
      const g = pw.game, p = g.player, s = pw.stats;
      const angle = Math.atan2(p.facing.y, p.facing.x);
      const half = ((s.arc / 2) * Math.PI) / 180;
      g.grid.query(p.x, p.y, s.radius + 40, (e) => {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d > s.radius + e.size) return;
        let da = Math.atan2(dy, dx) - angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) <= half) hitEnemy(g, e, pw, s.damage, dx / d, dy / d, s.knockback || 0);
      });
      g.zones.push(new MeleeSlash(pw, angle));
      for (let i = 0; i < 6; i++) { const a = angle + rand(-half, half); g.particles.emitElement(p.x + Math.cos(a) * s.radius * 0.8, p.y + Math.sin(a) * s.radius * 0.8, pw.def.element, 1, { speed: 90, angle: a, arc: 0.5 }); }
    },
  },
  pool: {
    fire(pw) {
      const g = pw.game, p = g.player, s = pw.stats;
      if (activeOf(g, Pool, pw) >= Math.round(s.count)) return;
      let x = p.x, y = p.y;
      if (pw.def.target === 'enemy') {
        const cands = g.enemies.filter((e) => !e.dead && dist2(e.x, e.y, p.x, p.y) < 500 * 500);
        if (cands.length) { const e = cands[Math.floor(Math.random() * cands.length)]; x = e.x; y = e.y; }
        else { const a = rand(0, Math.PI * 2), r = rand(80, 250); x += Math.cos(a) * r; y += Math.sin(a) * r; }
      }
      g.zones.push(new Pool(pw, x, y));
    },
  },
  mine: {
    fire(pw) {
      const g = pw.game, p = g.player, s = pw.stats;
      if (activeOf(g, Mine, pw) >= Math.round(s.count)) return;
      g.zones.push(new Mine(pw, p.x + rand(-30, 30), p.y + rand(-30, 30)));
    },
  },
  orbit: {
    passive: true,
    update(pw, dt) {
      const g = pw.game, p = g.player, s = pw.stats;
      pw.angle += s.rotSpeed * dt;
      const n = Math.max(1, Math.round(s.count));
      pw.orbs.length = 0;
      for (let i = 0; i < n; i++) {
        const a = pw.angle + (i * Math.PI * 2) / n;
        const ox = p.x + Math.cos(a) * s.radius, oy = p.y + Math.sin(a) * s.radius;
        pw.orbs.push([ox, oy]);
        g.grid.query(ox, oy, s.size + 40, (e) => {
          const r = e.size + s.size;
          if (dist2(ox, oy, e.x, e.y) > r * r) return;
          const last = pw.hitTimes.get(e.id) ?? -99;
          if (g.time - last < s.hitCd) return;
          pw.hitTimes.set(e.id, g.time);
          const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
          hitEnemy(g, e, pw, s.damage, dx / d, dy / d, s.knockback || 0);
        });
      }
      pw.emitT -= dt;
      if (pw.emitT <= 0 && g.particles.list.length < g.particles.max * 0.6) {
        pw.emitT = 0.08;
        const [ox, oy] = pw.orbs[Math.floor(Math.random() * pw.orbs.length)];
        g.particles.emitElement(ox, oy, pw.def.element, 1, { speed: 20, life: [0.2, 0.4] });
      }
      if (pw.hitTimes.size > 3000) pw.hitTimes.clear();
    },
  },
  aura: {
    passive: true,
    update(pw, dt) {
      const g = pw.game, p = g.player, s = pw.stats;
      pw.tick -= dt;
      pw.angle += dt * 0.6;
      const doHit = pw.tick <= 0;
      if (doHit) pw.tick = s.tick;
      g.grid.query(p.x, p.y, s.radius + 40, (e) => {
        const r = s.radius + e.size * 0.5;
        const d2 = dist2(p.x, p.y, e.x, e.y);
        if (d2 > r * r) return;
        if (s.pull && !e.boss) {
          const d = Math.sqrt(d2) || 1;
          if (d > s.radius * 0.5) {
            e.x -= ((e.x - p.x) / d) * s.pull * dt;
            e.y -= ((e.y - p.y) / d) * s.pull * dt;
          }
        }
        if (doHit) hitEnemy(g, e, pw, s.damage);
      });
      pw.emitT -= dt;
      if (pw.emitT <= 0 && g.particles.list.length < g.particles.max * 0.6) {
        pw.emitT = 0.1;
        const a = rand(0, Math.PI * 2), d = rand(s.radius * 0.5, s.radius);
        g.particles.emitElement(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, pw.def.element, 1, { speed: 25, life: [0.4, 0.9] });
      }
    },
  },
};
