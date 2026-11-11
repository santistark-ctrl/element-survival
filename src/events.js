// Eventos de mapa y peligros (meteoros, explosiones de élites).
import { EVENTS, EVENT_LIST } from './data/events.js';
import { ENEMY_TYPES } from './data/enemies.js';
import { CONFIG } from './config.js';
import { currentPair, damageEnemy } from './enemies.js';
import { spawnOrb } from './pickups.js';
import { rand, choice, dist2, weightedChoice } from './utils.js';

export function updateEvents(game, dt) {
  const ev = game.event;
  if (ev) {
    ev.t += dt;
    tickEvent(game, ev, dt);
    if (ev.t >= ev.dur) {
      game.event = null;
      game.lastEventId = ev.id;
      game.nextEventAt = game.time + rand(95, 150);
    }
    return;
  }
  if (game.time < game.nextEventAt || game.boss || game.finalBoss) return;
  const toBoss = CONFIG.boss.intervalSec - (game.time % CONFIG.boss.intervalSec);
  if (toBoss < 45 || game.time > 1740) return;
  startEvent(game, choice(EVENT_LIST.filter((e) => e.id !== game.lastEventId)).id);
}

export function startEvent(game, id) {
  const def = EVENTS[id];
  const ev = { id, def, t: 0, dur: def.dur, data: {} };
  if (id === 'oleada') {
    const pair = currentPair(game);
    ev.data.type = choice(pair);
    ev.data.name = ENEMY_TYPES[ev.data.type].name;
  }
  if (id === 'meteoros') ev.data.timer = 0.8;
  if (id === 'lluvia_gemas') ev.data.timer = 0;
  game.event = ev;
  const label = id === 'oleada' ? `Oleada de ${ev.data.name}` : def.name;
  game.ui.announce(`${def.icon} ${label}`, def.color, 3);
  game.audio.play('event');
  game.flash(def.color, 0.3);
}

function tickEvent(game, ev, dt) {
  const p = game.player, cam = game.cam;
  if (ev.id === 'meteoros') {
    ev.data.timer -= dt;
    if (ev.data.timer <= 0) {
      ev.data.timer = 0.45;
      const m = game.time / 60;
      game.hazards.push({
        x: p.x + rand(-cam.w * 0.45, cam.w * 0.45), y: p.y + rand(-cam.h * 0.45, cam.h * 0.45),
        t: 0, delay: 1.1, r: 78, dmgEnemy: 45 * (1 + m * 0.35), dmgPlayer: 14, color: '#ff6b35', element: 'fuego', source: 'meteoros', kind: 'meteor',
      });
    }
  } else if (ev.id === 'lluvia_gemas') {
    ev.data.timer -= dt;
    if (ev.data.timer <= 0 && game.orbs.length < CONFIG.orbs.maxAlive * 3) {
      ev.data.timer = 0.2;
      const type = weightedChoice(['azul', 'morado', 'dorado'], (k) => ({ azul: 60, morado: 30, dorado: 10 })[k]);
      const a = rand(0, Math.PI * 2), r = rand(120, Math.max(cam.w, cam.h) * 0.5);
      spawnOrb(game, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, type);
    }
  }
}

// Multiplicadores que otros sistemas consultan.
export function eventMods(game) {
  const id = game.event ? game.event.id : null;
  return {
    goldMult: id === 'hora_dorada' ? 2 : 1,
    coinChance: id === 'hora_dorada' ? 0.25 : 0.05,
    enemySpeed: id === 'frenesi' ? 1.4 : 1,
    xpMult: id === 'frenesi' ? 1.5 : 1,
    spawnRate: id === 'oleada' ? 2.2 : 1,
    forcedType: id === 'oleada' ? game.event.data.type : null,
    fog: id === 'niebla',
  };
}

// Peligros con telegrafía: dañan enemigos y jugador al estallar.
export function updateHazards(game, dt) {
  const p = game.player;
  for (const h of game.hazards) {
    h.t += dt;
    if (h.t < h.delay) continue;
    if (h.dmgEnemy > 0) {
      game.grid.query(h.x, h.y, h.r + 40, (e) => {
        const r = h.r + e.size;
        if (dist2(h.x, h.y, e.x, e.y) <= r * r) damageEnemy(game, e, h.dmgEnemy, h.element, h.source);
      });
    }
    if (h.dmgPlayer > 0) {
      const r = h.r + p.size;
      if (dist2(h.x, h.y, p.x, p.y) <= r * r) p.takeDamage(h.dmgPlayer);
    }
    game.addRing(h.x, h.y, h.r * 0.3, h.r * 1.3, h.color, 0.35);
    game.particles.emitElement(h.x, h.y, h.element, 16, { speed: 200, jitter: h.r * 0.3 });
    game.shakeScreen(3);
    game.audio.impact(h.element);
    h.dead = true;
  }
  game.hazards = game.hazards.filter((h) => !h.dead);
}

export function drawHazards(ctx, game) {
  for (const h of game.hazards) {
    const k = Math.min(1, h.t / h.delay);
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.strokeStyle = h.color; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85;
    ctx.setLineDash([6, 6]); ctx.lineDashOffset = -game.time * 80;
    ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35 * k; ctx.fillStyle = h.color;
    ctx.beginPath(); ctx.arc(0, 0, h.r * k, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    if (h.kind === 'meteor') {
      const mx = h.x + 260 * (1 - k), my = h.y - 600 * (1 - k);
      ctx.strokeStyle = h.color; ctx.lineWidth = h.r * 0.3; ctx.lineCap = 'round'; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(mx + 60, my - 130); ctx.lineTo(mx, my); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = h.color; ctx.beginPath(); ctx.arc(mx, my, h.r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(mx, my, h.r * 0.15, 0, Math.PI * 2); ctx.fill();
    } else if (h.kind === 'explosive') {
      ctx.font = `bold ${Math.round(h.r * 0.5)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('!', h.x, h.y + h.r * 0.18);
    }
  }
}
