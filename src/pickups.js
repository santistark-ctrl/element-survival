import { CONFIG } from './config.js';
import { ORB_COLORS } from './data/rarities.js';
import { dist, rand, weightedChoice } from './utils.js';

// Orbes de experiencia, monedas y cofres tirados en el mapa.
export const ORB_SIZES = { azul: 6, morado: 8, dorado: 11, rojo: 15 };

export function spawnOrb(game, x, y, type) {
  game.orbs.push({ x, y, type, mag: false, t: 0, bob: Math.random() * 6 });
}

export function spawnCoin(game, x, y, v) {
  game.coins.push({ x, y, v, mag: false, t: 0 });
}

export function spawnChest(game, x, y, rarity) {
  game.chests.push({ x, y, rarity, bob: Math.random() * 6 });
}

export function spawnHeart(game, x, y) {
  game.hearts.push({ x, y, mag: false, t: 0, bob: Math.random() * 6 });
}

export function orbValue(game, type) {
  const minutes = game.time / 60;
  return Math.round(CONFIG.orbs.values[type] * (1 + minutes * 0.15) * game.player.stats.orbValueMult);
}

export function orbColor(type) { return ORB_COLORS[type]; }

// Genera orbes alrededor del jugador para que siempre haya algo que recoger.
export function updateOrbSpawner(game, dt) {
  // corazones que aparecen solos por el mapa
  game.heartTimer -= dt;
  if (game.heartTimer <= 0) {
    game.heartTimer = CONFIG.hearts.spawnEvery;
    const p = game.player, cam = game.cam;
    const a = rand(0, Math.PI * 2), r = Math.max(cam.w, cam.h) / 2 + rand(100, 500);
    spawnHeart(game, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
  }
  game.orbTimer -= dt;
  if (game.orbTimer > 0) return;
  game.orbTimer = CONFIG.orbs.spawnEvery;
  if (game.orbs.length >= CONFIG.orbs.maxAlive) return;
  const p = game.player, cam = game.cam;
  const type = weightedChoice(Object.keys(CONFIG.orbs.weights), (k) => CONFIG.orbs.weights[k]);
  const a = rand(0, Math.PI * 2);
  const r = Math.max(cam.w, cam.h) / 2 + rand(100, 700);
  spawnOrb(game, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, type);
}

export function updatePickups(game, dt) {
  const p = game.player;
  const pr = p.stats.pickupRadius;

  const pullTo = (o) => {
    o.t += dt;
    const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1;
    const sp = 260 + o.t * 900;
    o.x += (dx / d) * Math.min(sp * dt, d);
    o.y += (dy / d) * Math.min(sp * dt, d);
    return d;
  };

  for (const o of game.orbs) {
    const d = dist(p.x, p.y, o.x, o.y);
    if (!o.mag && d < pr) o.mag = true;
    if (o.mag) {
      const dd = pullTo(o);
      if (o.type !== 'azul' && game.particles.list.length < game.particles.max * 0.6) game.particles.emit(o.x, o.y, 1, { colors: [ORB_COLORS[o.type]], speed: 10, life: [0.15, 0.3], size: [1.5, 3], add: true });
      if (dd < p.size + 8) {
        o.dead = true;
        const v = orbValue(game, o.type);
        p.gainXp(v);
        game.addText(p.x, p.y - 34, `+${v} XP`, ORB_COLORS[o.type], o.type === 'azul' ? 11 : 14);
        game.audio.play(o.type === 'azul' ? 'pickup' : 'pickupBig');
        game.particles.emit(p.x, p.y, o.type === 'azul' ? 4 : 10, { colors: [ORB_COLORS[o.type], '#fff'], speed: 90, life: [0.2, 0.5], size: [1.5, 3], add: true });
      }
    } else if (o.type !== 'rojo' && d > CONFIG.orbs.despawnDist) {
      o.dead = true;
    }
  }
  game.orbs = game.orbs.filter((o) => !o.dead);

  for (const c of game.coins) {
    const d = dist(p.x, p.y, c.x, c.y);
    if (!c.mag && d < pr) c.mag = true;
    if (c.mag) {
      const dd = pullTo(c);
      if (dd < p.size + 8) {
        c.dead = true;
        const v = Math.round(c.v * p.stats.goldMult);
        p.gold += v;
        game.addText(p.x, p.y - 30, `+${v} oro`, '#ffd54f', 12);
        game.audio.play('coin');
      }
    } else if (d > 3200) c.dead = true;
  }
  game.coins = game.coins.filter((c) => !c.dead);

  for (const h of game.hearts) {
    const d = dist(p.x, p.y, h.x, h.y);
    if (!h.mag && d < pr) h.mag = true;
    if (h.mag) {
      const dd = pullTo(h);
      if (dd < p.size + 8) {
        h.dead = true;
        const v = Math.round((CONFIG.hearts.heal + p.stats.maxHp * CONFIG.hearts.healPct) * p.stats.heartMult);
        p.heal(v);
        game.addText(p.x, p.y - 34, `+${v}`, '#69f0ae', 15);
        game.audio.play('heal');
        game.particles.emit(p.x, p.y, 12, { colors: ['#ff5e8a', '#ffffff', '#69f0ae'], speed: 90, life: [0.3, 0.7], size: [2, 4], grav: -60, add: true });
      }
    } else if (d > 3200) h.dead = true;
  }
  game.hearts = game.hearts.filter((h) => !h.dead);

  for (const ch of game.chests) {
    if (dist(p.x, p.y, ch.x, ch.y) < p.size + 24) {
      ch.dead = true;
      game.pendingChests.push(ch.rarity);
    }
  }
  game.chests = game.chests.filter((c) => !c.dead);
}
