import { CONFIG } from './config.js';
import { ENEMY_TYPES, BOSSES } from './data/enemies.js';
import { ELEMENTS } from './data/elements.js';
import { ELITE_CHEST_WEIGHTS } from './data/rarities.js';
import { ELITE_MODS, ELITE_MOD_LIST } from './data/events.js';
import { rand, weightedChoice, dist2, shuffle } from './utils.js';
import { spawnOrb, spawnCoin, spawnChest, spawnHeart } from './pickups.js';
import { getEnemySprite } from './sprites.js';

let nextId = 1;
export const FINAL_BOSS_TIME = 1800; // 30 minutos
export const FINAL_BOSS = 'avatar_ruina';

export class Enemy {
  constructor(game, type, x, y, opts = {}) {
    const def = opts.boss ? BOSSES[type] : ENEMY_TYPES[type];
    if (!def) throw new Error(`Enemigo desconocido: ${type}`);
    const m = game.difficulty();
    this.id = nextId++;
    this.game = game;
    this.type = type;
    this.def = def;
    this.name = def.name;
    this.x = x; this.y = y;
    this.elite = !!opts.elite;
    this.boss = !!opts.boss;
    this.final = !!def.final;
    this.ghost = !!def.ghost;
    this.maxHp = def.hp * m.hp * (this.elite ? 8 : 1);
    this.speed = def.speed * (this.elite ? 1.1 : 1) * rand(0.9, 1.1);
    this.damage = def.damage * m.dmg * (this.elite ? 1.5 : 1);
    this.size = def.size * (this.elite ? 1.6 : 1);
    this.xp = def.xp * (this.elite ? 10 : 1);
    this.armor = (def.armor || 0) + (this.elite ? 1 : 0);
    this.color = def.color;
    this.shape = def.shape || 'blob';
    this.status = {};
    this.kx = 0; this.ky = 0;
    this.contactCd = 0;
    this.flash = 0;
    this.spawnT = 0;
    this.burnTick = 0; this.poisonTick = 0; this.spreadTick = 0;
    this.dead = false;
    this.wobble = rand(0, Math.PI * 2);
    this.summonDef = def.summon || null;
    this.summonTimer = this.summonDef ? this.summonDef.every : 0;
    this.dashCd = def.dash ? rand(1, def.dash.cd) : 0;
    this.dashT = 0; this.dashDx = 0; this.dashDy = 0;
    this.shootCd = def.shoot ? rand(0.5, def.shoot.cd) : 0;
    this.phase2 = false; this.ringCd = 0;
    // modificadores de élite
    this.mods = opts.mods || [];
    for (const id of this.mods) {
      const mod = ELITE_MODS[id];
      if (mod.speed) this.speed *= mod.speed;
      if (mod.armor) this.armor += mod.armor;
      if (mod.hp) this.maxHp *= mod.hp;
      if (mod.size) this.size *= mod.size;
      if (mod.regen) this.regen = mod.regen;
      if (mod.summon) { this.summonDef = { type, count: mod.summon.count, every: mod.summon.every }; this.summonTimer = 3; }
    }
    this.hp = this.maxHp;
  }
  get modLabel() { return this.mods.map((id) => ELITE_MODS[id].name).join(' · '); }
  get modColor() { return this.mods.length ? ELITE_MODS[this.mods[0]].color : '#ffd54f'; }
}

// Aplica un estado (burn, poison, wet, slow, stun, curse) respetando el más fuerte.
export function applyStatus(enemy, kind, data) {
  if (enemy.boss && kind === 'stun') data = { dur: data.dur * 0.25 };
  const cur = enemy.status[kind];
  if (kind === 'burn' || kind === 'poison') {
    if (!cur || cur.dps <= data.dps) enemy.status[kind] = { t: data.dur, dps: data.dps };
    else cur.t = Math.max(cur.t, data.dur);
  } else if (kind === 'slow') {
    if (!cur || data.factor <= cur.factor) enemy.status.slow = { t: data.dur, factor: data.factor };
    else cur.t = Math.max(cur.t, data.dur);
  } else {
    enemy.status[kind] = { t: Math.max(cur ? cur.t : 0, data.dur) };
  }
}

// Daño directo. `source` es el id del poder (para las estadísticas de partida).
export function damageEnemy(game, e, dmg, element, source = null, silent = false, crit = false) {
  if (e.dead) return 0;
  if (e.armor) dmg = Math.max(dmg * 0.2, dmg - e.armor);
  e.hp -= dmg;
  e.flash = 0.08;
  if (source) game.damageByPower[source] = (game.damageByPower[source] || 0) + dmg;
  if (game.settings.damageNumbers && (crit || ((!silent || Math.random() < 0.2) && (e.boss || e.elite || Math.random() < 0.5)))) {
    const col = crit ? '#ffeb3b' : (ELEMENTS[element] || {}).color || '#fff';
    game.addText(e.x + rand(-8, 8), e.y - e.size - 4, `${Math.round(dmg)}${crit ? '!' : ''}`, col, (e.boss ? 18 : 12) + (crit ? 6 : 0));
  }
  if (!silent) game.audio.hit(element);
  if (e.hp <= 0) killEnemy(game, e);
  return dmg;
}

export function killEnemy(game, e) {
  if (e.dead) return;
  e.dead = true;
  const p = game.player;
  const ev = game.eventMods();
  p.kills++;
  p.gainXp(e.xp * ev.xpMult);
  const kb = game.save.data.killsByEnemy;
  kb[e.type] = (kb[e.type] || 0) + 1;
  if (e.boss) {
    spawnCoin(game, e.x, e.y, 100);
    spawnOrb(game, e.x + 30, e.y, 'rojo');
    for (let i = 0; i < 3; i++) spawnHeart(game, e.x + rand(-60, 60), e.y + rand(30, 70));
    spawnChest(game, e.x - 30, e.y, game.bossesKilled >= 2 && Math.random() < 0.15 ? 'blanco' : 'rojo');
    const bk = game.save.data.bossKillsByType; bk[e.type] = (bk[e.type] || 0) + 1;
    game.onBossKilled(e);
  } else if (e.elite) {
    spawnCoin(game, e.x + 12, e.y, 15);
    spawnChest(game, e.x, e.y, weightedChoice(Object.keys(ELITE_CHEST_WEIGHTS), (k) => ELITE_CHEST_WEIGHTS[k]));
    if (Math.random() < 0.5) spawnOrb(game, e.x - 14, e.y, 'dorado');
    spawnHeart(game, e.x, e.y + 26);
    if (e.mods.includes('explosivo')) {
      game.hazards.push({ x: e.x, y: e.y, t: 0, delay: 0.75, r: 140, dmgEnemy: 0, dmgPlayer: e.damage * 1.5, color: '#ff7043', element: 'fuego', source: null, kind: 'explosive' });
    }
  } else if (Math.random() < ev.coinChance) {
    spawnCoin(game, e.x, e.y, 1 + Math.floor(Math.random() * 3));
  } else if (Math.random() < CONFIG.hearts.dropChance) {
    spawnHeart(game, e.x, e.y);
  }
  // animación de muerte: el sprite se infla y desvanece + partículas
  const sp = getEnemySprite(e, false);
  const scale = e.size / e.def.size, x = e.x, y = e.y;
  const flip = p.x < e.x ? -1 : 1;
  const big = e.boss || e.elite;
  game.addEffect({ dur: big ? 0.5 : 0.28, draw(ctx, k) {
    ctx.save(); ctx.translate(x, y - k * 10); ctx.scale(flip * scale * (1 + k * 0.5), scale * (1 - k * 0.4));
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.drawImage(sp.canvas, -sp.pad, -sp.pad);
    ctx.restore(); ctx.globalAlpha = 1;
  } });
  if (game.particles.list.length < game.particles.max * 0.85 || big) {
    game.particles.emit(x, y, big ? 40 : 7, { colors: [e.color, '#ffffff'], speed: big ? 260 : 120, life: [0.3, 0.7], size: [2, big ? 6 : 4], grav: 120, drag: 2, shape: 'square', jitter: e.size * 0.4 });
  }
  if (big) { game.addRing(x, y, e.size, e.size * 3, e.color, 0.5); game.audio.play(e.boss ? 'bossDead' : 'eliteDead'); }
}

// ─── Aparición ─────────────────────────────────────────────
export function currentPair(game) {
  const map = game.map.def;
  const seg = Math.floor(game.time / CONFIG.enemies.rotationSec);
  const r = map.roster;
  if (seg < r.length) return r[seg];
  const span = r.length - map.loopFrom;
  return r[map.loopFrom + ((seg - map.loopFrom) % span)];
}

export function updateSpawner(game, dt) {
  const t = game.time;
  const pair = currentPair(game);
  const minutes = t / 60;
  const ev = game.eventMods();
  let rate = (CONFIG.enemies.baseRate + minutes * CONFIG.enemies.ratePerMinute) * (1 + game.player.stats.curse) * ev.spawnRate;
  if (game.boss) rate *= game.boss.final ? 0.35 : 0.6;
  game.spawnAcc += rate * dt;
  while (game.spawnAcc >= 1) {
    game.spawnAcc -= 1;
    if (game.enemies.length < CONFIG.enemies.maxAlive) spawnAround(game, ev.forcedType || pair[Math.floor(Math.random() * pair.length)]);
  }

  // aviso cuando cambia el par de enemigos
  const seg = Math.floor(t / CONFIG.enemies.rotationSec);
  if (seg !== game.currentSegment) {
    game.currentSegment = seg;
    if (seg > 0 && !game.finalBoss) {
      const names = pair.map((id) => ENEMY_TYPES[id].name).join(' y ');
      game.ui.announce(`Nuevos enemigos: ${names}`, '#ffab91', 3);
    }
  }

  // élites con cofre y modificadores
  game.eliteTimer -= dt;
  if (game.eliteTimer <= 0) {
    game.eliteTimer = Math.max(25, CONFIG.enemies.eliteEverySec - minutes * 1.5);
    const n = minutes >= 15 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const modCount = minutes >= 12 ? 2 : 1;
      const mods = shuffle(ELITE_MOD_LIST.map((m) => m.id)).slice(0, modCount);
      const e = spawnAround(game, pair[Math.floor(Math.random() * pair.length)], true, null, { mods });
      void e;
    }
  }

  // hordas en anillo cada 5 minutos (salvo los minutos de jefe)
  const hordeIdx = Math.floor(t / CONFIG.enemies.hordeEverySec);
  if (hordeIdx >= 1 && hordeIdx > game.hordesSpawned) {
    game.hordesSpawned = hordeIdx;
    if ((hordeIdx * CONFIG.enemies.hordeEverySec) % CONFIG.boss.intervalSec !== 0 && !game.finalBoss) {
      const n = Math.min(80 + hordeIdx * 20, CONFIG.enemies.maxAlive - game.enemies.length);
      for (let i = 0; i < n; i++) spawnAround(game, pair[i % pair.length], false, (i * Math.PI * 2) / n);
      game.ui.announce('¡Horda!', '#ff8a65');
      game.audio.play('horde');
    }
  }

  const bossIdx = Math.floor(t / CONFIG.boss.intervalSec);
  if (bossIdx >= 1 && bossIdx > game.bossesSpawned) {
    game.bossesSpawned = bossIdx;
    if (bossIdx * CONFIG.boss.intervalSec >= FINAL_BOSS_TIME) {
      if (!game.finalBoss) spawnBoss(game, FINAL_BOSS, true);
    } else {
      const list = game.map.def.bosses;
      spawnBoss(game, list[(bossIdx - 1) % list.length]);
    }
  }
}

export function spawnAround(game, type, elite = false, angle = null, opts = {}) {
  const p = game.player, cam = game.cam;
  const r = Math.max(cam.w, cam.h) / 2 + rand(60, 260);
  const a = angle != null ? angle : rand(0, Math.PI * 2);
  const e = new Enemy(game, type, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, { elite, ...opts });
  game.enemies.push(e);
  return e;
}

function spawnBoss(game, type, final = false) {
  const e = spawnAround(game, type, false, null, { boss: true });
  game.boss = e;
  if (final) {
    game.finalBoss = e;
    game.ui.announce(`¡JEFE FINAL: ${e.name}!`, '#ff1744', 4);
    game.flash('#3a0010', 0.8);
  } else {
    game.ui.announce(`¡JEFE: ${e.name}!`, '#ef5350', 3.5);
    game.flash('#3a0010', 0.5);
  }
  game.shakeScreen(10);
  game.audio.play('boss');
}

// ─── Actualización ─────────────────────────────────────────
export function updateEnemies(game, dt) {
  const p = game.player;
  const toAdd = [];
  const slowAura = p.stats.slowAura;
  const despawn2 = CONFIG.enemies.despawnDist * CONFIG.enemies.despawnDist;
  const frameParity = game.frame & 1;
  const ev = game.eventMods();
  const burnSpread = !!p.stats.flags.burnSpread;
  const diff = game.difficulty();

  for (const e of game.enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    e.spawnT += dt;
    if (e.regen) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * e.regen * dt);

    // estados
    const st = e.status;
    for (const k in st) { st[k].t -= dt; if (st[k].t <= 0) delete st[k]; }
    if (st.burn) {
      e.burnTick -= dt;
      if (e.burnTick <= 0) { e.burnTick = 0.5; damageEnemy(game, e, st.burn.dps * 0.5, 'fuego', 'quemadura', true); if (e.dead) continue; }
      if (burnSpread) {
        e.spreadTick -= dt;
        if (e.spreadTick <= 0) {
          e.spreadTick = 1;
          const dps = st.burn.dps, dur = st.burn.t;
          game.grid.query(e.x, e.y, 70, (o) => { if (o !== e && !o.status.burn && dist2(o.x, o.y, e.x, e.y) < 70 * 70) applyStatus(o, 'burn', { dps, dur: Math.max(1, dur) }); });
        }
      }
    }
    if (st.poison) {
      e.poisonTick -= dt;
      if (e.poisonTick <= 0) { e.poisonTick = 0.5; damageEnemy(game, e, st.poison.dps * 0.5, 'veneno', 'veneno', true); if (e.dead) continue; }
    }

    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;

    // reubicar si quedó demasiado lejos (mapa infinito)
    if (!e.boss && d * d > despawn2) {
      const a = rand(0, Math.PI * 2), r = Math.max(game.cam.w, game.cam.h) / 2 + rand(80, 200);
      e.x = p.x + Math.cos(a) * r; e.y = p.y + Math.sin(a) * r;
      e.spawnT = 0;
      continue;
    }

    // fase 2 de jefes al 50% de vida
    if (e.boss && !e.phase2 && e.hp < e.maxHp * 0.5) {
      e.phase2 = true;
      e.speed *= 1.3; e.damage *= 1.2; e.ringCd = 1.5;
      game.ui.announce(`¡${e.name} se enfurece!`, '#ff1744', 3);
      game.flash('#5a0010', 0.5); game.shakeScreen(8);
      game.audio.play('phase');
      game.addRing(e.x, e.y, e.size, e.size * 4, '#ff1744', 0.7);
    }

    let sp = e.speed * ev.enemySpeed;
    if (st.slow) sp *= st.slow.factor;
    if (slowAura && d < 260) sp *= 1 - slowAura;
    if (st.stun) sp = 0;

    // embestida
    if (e.def.dash && !st.stun) {
      e.dashCd -= dt;
      if (e.dashT > 0) {
        e.dashT -= dt;
        e.x += e.dashDx * e.def.dash.speed * dt; e.y += e.dashDy * e.def.dash.speed * dt;
        sp = 0;
      } else if (e.dashCd <= 0 && d < e.def.dash.range && d > 40) {
        e.dashCd = e.def.dash.cd * (e.phase2 ? 0.5 : 1); e.dashT = e.def.dash.dur;
        e.dashDx = dx / d; e.dashDy = dy / d;
        game.addRing(e.x, e.y, e.size, e.size * 2, e.color, 0.25);
      }
    }

    // disparo
    if (e.def.shoot && !st.stun) {
      e.shootCd -= dt;
      const sh = e.def.shoot;
      if (d < sh.range) sp *= 0.5;
      if (e.shootCd <= 0 && d < sh.range) {
        e.shootCd = sh.cd;
        const n = sh.count || 1, spread = ((sh.spread || 0) * Math.PI) / 180;
        const base = Math.atan2(dy, dx);
        for (let i = 0; i < n; i++) {
          const a = n === 1 ? base : base - spread / 2 + (spread * i) / (n - 1);
          game.enemyShots.push({ x: e.x, y: e.y, vx: Math.cos(a) * sh.speed, vy: Math.sin(a) * sh.speed, dmg: sh.dmg * diff.dmg, life: sh.range / sh.speed + 0.5, color: e.color, size: e.boss ? 8 : 5 });
        }
        game.audio.play('enemyShot');
      }
    }
    // anillo de disparos de jefes enfurecidos
    if (e.phase2 && !st.stun) {
      e.ringCd -= dt;
      if (e.ringCd <= 0) {
        e.ringCd = 4;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + game.time;
          game.enemyShots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg: 12 * diff.dmg, life: 3, color: '#ff1744', size: 7 });
        }
        game.addRing(e.x, e.y, e.size, e.size * 2.5, '#ff1744', 0.4);
        game.audio.play('enemyShot');
      }
    }

    if (sp > 0) { e.x += (dx / d) * sp * dt; e.y += (dy / d) * sp * dt; }

    if (e.kx || e.ky) {
      e.x += e.kx * dt; e.y += e.ky * dt;
      const f = Math.exp(-8 * dt);
      e.kx *= f; e.ky *= f;
      if (Math.abs(e.kx) < 1) e.kx = 0;
      if (Math.abs(e.ky) < 1) e.ky = 0;
    }

    // separación entre enemigos (frames alternados para soportar enjambres)
    if (!e.boss && (e.id & 1) === frameParity) {
      game.grid.query(e.x, e.y, e.size * 2, (o) => {
        if (o === e) return;
        const ox = e.x - o.x, oy = e.y - o.y;
        const d2 = ox * ox + oy * oy;
        const min = (e.size + o.size) * 0.8;
        if (d2 < min * min && d2 > 0.01) {
          const dd = Math.sqrt(d2);
          const push = (min - dd) * 0.6;
          e.x += (ox / dd) * push; e.y += (oy / dd) * push;
        }
      });
    }

    // daño por contacto
    e.contactCd -= dt;
    if (e.contactCd <= 0) {
      const r = e.size + p.size;
      if (dist2(e.x, e.y, p.x, p.y) < r * r) {
        e.contactCd = CONFIG.enemies.contactCooldown;
        p.takeDamage(e.damage);
      }
    }

    // invocaciones (jefes y élites invocadores)
    if (e.summonDef) {
      e.summonTimer -= dt;
      if (e.summonTimer <= 0) {
        e.summonTimer = e.summonDef.every;
        const count = e.summonDef.count * (e.phase2 ? 2 : 1);
        for (let i = 0; i < count; i++) {
          const a = rand(0, Math.PI * 2);
          toAdd.push(new Enemy(game, e.summonDef.type, e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70));
        }
        game.addRing(e.x, e.y, e.size, e.size * 2.5, e.color, 0.4);
      }
    }
  }
  for (const e of toAdd) if (game.enemies.length < CONFIG.enemies.maxAlive + 50) game.enemies.push(e);

  // proyectiles enemigos
  for (const s of game.enemyShots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0) { s.dead = true; continue; }
    const r = s.size + p.size;
    if (dist2(s.x, s.y, p.x, p.y) < r * r) { s.dead = true; p.takeDamage(s.dmg); }
  }
  game.enemyShots = game.enemyShots.filter((s) => !s.dead);
}
