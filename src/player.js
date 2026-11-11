import { CONFIG } from './config.js';
import { ITEMS } from './data/items.js';
import { POWERS } from './data/powers.js';
import { ELEMENTS } from './data/elements.js';
import { UPGRADES } from './data/upgrades.js';
import { BOOSTS } from './data/boosts.js';
import { ITEM_SYNERGIES } from './data/itemSynergies.js';
import { PowerInstance, hitEnemy } from './powers.js';
import { applyStatus } from './enemies.js';

export function xpForLevel(l) {
  return Math.floor(8 + l * 7 + l * l * 0.9);
}

export class Player {
  constructor(game, cls) {
    this.game = game;
    this.cls = cls;
    this.x = 0; this.y = 0;
    this.size = 13;
    this.facing = { x: 1, y: 0 };
    this.moving = false;
    this.walk = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpForLevel(1);
    this.elements = new Set([cls.element]);
    this.powers = [];   // poderes activos (ocupan slot)
    this.evolved = [];  // poderes de sinergia (no ocupan slot)
    this.items = [];    // { id, level }
    this.boosts = {};   // { id: veces elegido } aumentos de stats de subida de nivel
    this.itemSynergies = [];
    this.evolvedFrom = new Set();
    this.evolutionsDone = 0;
    this.kills = 0;
    this.gold = 0;
    this.invuln = 0;
    this.hurtFlash = 0;
    this.revivesUsed = 0;
    this.lastHitTime = 0;
    // habilidad activa de la clase
    this.skill = cls.skill;
    this.skillCd = 0;
    this.dashT = 0; this.dashVx = 0; this.dashVy = 0;
    this.stats = null;
    this.hp = 0;
    this.recomputeStats();
    this.hp = this.stats.maxHp;
    this.rerollsLeft = this.stats.rerolls;
  }

  recomputeStats() {
    const s = {
      damageMult: 1, speedMult: 1, maxHp: CONFIG.player.baseHp, maxHpMult: 1, regen: CONFIG.player.baseRegen,
      areaMult: 1, cooldownMult: 1, pickupMult: 1, pickupRadius: CONFIG.player.pickupRadius,
      armor: 0, luck: 0, xpMult: 1, durationMult: 1, extraProjectiles: 0, projSpeedMult: 1, knockbackMult: 1,
      goldMult: 1, curse: 0, lifesteal: 0, revives: 0, rerolls: CONFIG.player.rerolls, orbValueMult: 1,
      statusDurMult: 1, powerLevelBonus: 0, slowAura: 0, heartMult: 1, flags: {},
    };
    for (const k in this.cls.stats) s[k] += this.cls.stats[k];
    const ups = this.game.save.data.upgrades || {};
    for (const id in ups) { const d = UPGRADES[id]; if (d && ups[id] > 0) d.apply(s, ups[id]); }
    for (const it of this.items) { const d = ITEMS[it.id]; if (d.apply) d.apply(s, it.level); }
    // sinergias de ítems activas
    this.itemSynergies = ITEM_SYNERGIES.filter((sy) => sy.items.every((id) => this.items.some((it) => it.id === id)));
    for (const sy of this.itemSynergies) {
      if (sy.apply) sy.apply(s);
      if (sy.flags) for (const f of sy.flags) s.flags[f] = true;
    }
    for (const id in this.boosts) for (let i = 0; i < this.boosts[id]; i++) BOOSTS[id].apply(s);
    s.maxHp *= s.maxHpMult;
    s.pickupRadius *= s.pickupMult;
    const prev = this.stats;
    this.stats = s;
    if (prev) {
      if (s.maxHp > prev.maxHp) this.hp += s.maxHp - prev.maxHp;
      if (s.rerolls > prev.rerolls) this.rerollsLeft += s.rerolls - prev.rerolls;
    }
    this.hp = Math.min(this.hp, s.maxHp);
    for (const p of this.allPowers()) p.recompute();
  }

  allPowers() { return this.powers.concat(this.evolved); }

  hasElement(id) { return this.elements.has(id); }

  canUnlockElement(id) {
    const e = ELEMENTS[id];
    if (!e || this.elements.has(id)) return false;
    if (this.elements.size >= CONFIG.player.maxElements) return false;
    return !e.parent || this.elements.has(e.parent);
  }

  unlockElement(id) { this.elements.add(id); }

  addPower(id) {
    const ex = this.powers.find((p) => p.def.id === id);
    if (ex) { ex.levelUp(); return ex; }
    const p = new PowerInstance(this.game, POWERS[id], 1);
    this.powers.push(p);
    return p;
  }

  addEvolved(id) {
    if (this.evolved.some((p) => p.def.id === id)) return null;
    const p = new PowerInstance(this.game, POWERS[id], 1);
    this.evolved.push(p);
    return p;
  }

  addBoost(id) {
    this.boosts[id] = (this.boosts[id] || 0) + 1;
    this.recomputeStats();
  }

  addItem(id) {
    const ex = this.items.find((i) => i.id === id);
    if (ex) ex.level = Math.min(ex.level + 1, ITEMS[id].maxLevel);
    else this.items.push({ id, level: 1 });
    this.recomputeStats();
  }

  gainXp(v) {
    this.xp += v * this.stats.xpMult;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpForLevel(this.level);
      this.game.pendingLevelUps++;
    }
  }

  takeDamage(d) {
    if (this.invuln > 0 || this.dashT > 0 || this.hp <= 0) return;
    const dmg = Math.max(1, d - this.stats.armor);
    this.hp -= dmg;
    this.invuln = CONFIG.player.invulnAfterHit;
    this.hurtFlash = 0.2;
    this.lastHitTime = this.game.time;
    this.game.addText(this.x, this.y - 30, `-${Math.round(dmg)}`, '#ff5252', 15);
    this.game.shakeScreen(4);
    this.game.audio.play('hurt');
    this.game.particles.emit(this.x, this.y, 6, { colors: ['#ff5252', '#b71c1c'], speed: 120, life: [0.3, 0.5], size: [2, 4], grav: 200 });
    if (this.hp <= 0) {
      if (this.stats.revives - this.revivesUsed > 0) this.revive();
      else { this.hp = 0; this.game.gameOver(); }
    } else if (this.hp / this.stats.maxHp < 0.25) {
      this.game.audio.play('heartbeat');
    }
  }

  revive() {
    this.revivesUsed++;
    const full = !!this.stats.flags.reviveFull;
    this.hp = full ? this.stats.maxHp : this.stats.maxHp * 0.6;
    this.invuln = full ? 5 : 2.5;
    for (const e of this.game.enemies) {
      const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 1;
      if (d < 400 && !e.boss) { e.kx += (dx / d) * 700; e.ky += (dy / d) * 700; }
    }
    this.game.addRing(this.x, this.y, 20, 420, '#ffd54f', 0.6);
    this.game.ui.announce('¡Reviviste!', '#ffd54f', 2.5);
    this.game.audio.play('revive');
  }

  heal(v) { this.hp = Math.min(this.stats.maxHp, this.hp + v); }

  get noDamageTime() { return this.game.time - this.lastHitTime; }

  // ─── Habilidad activa (Espacio) ───
  useSkill() {
    if (!this.skill || this.skillCd > 0 || this.dashT > 0) return false;
    const g = this.game, s = this.stats, lvl = this.level;
    const fake = (element, damage, status, kb = 0) => ({ def: { element, id: 'habilidad', kind: 'skill' }, stats: { damage, status, lifesteal: 0, flags: {}, knockback: kb } });
    const hitAround = (radius, pw) => {
      g.grid.query(this.x, this.y, radius + 60, (e) => {
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 1;
        if (d <= radius + e.size) hitEnemy(g, e, pw, pw.stats.damage, dx / d, dy / d, pw.stats.knockback || 0);
      });
    };
    const el = this.cls.element;
    switch (this.skill.id) {
      case 'estallido': {
        const r = 240 * s.areaMult;
        hitAround(r, fake('fuego', (70 + lvl * 8) * s.damageMult, { burn: { dps: 8, dur: 4 } }, 260));
        g.addRing(this.x, this.y, 20, r, '#ff6b35', 0.5);
        g.particles.emitElement(this.x, this.y, 'fuego', 40, { speed: 260 });
        g.flash('#ff8a50', 0.25); g.shakeScreen(7);
        break;
      }
      case 'marea': {
        this.heal(s.maxHp * 0.2);
        const r = 280 * s.areaMult;
        hitAround(r, fake('agua', (25 + lvl * 3) * s.damageMult, { wet: { dur: 5 } }, 380));
        g.addRing(this.x, this.y, 20, r, '#4fc3f7', 0.6);
        g.particles.emitElement(this.x, this.y, 'agua', 40, { speed: 220 });
        g.addText(this.x, this.y - 40, `+${Math.round(s.maxHp * 0.2)}`, '#69f0ae', 16);
        break;
      }
      case 'rafaga_veloz': {
        this.dashT = 0.22;
        this.dashVx = this.facing.x * 1150; this.dashVy = this.facing.y * 1150;
        this.invuln = Math.max(this.invuln, 0.6);
        g.particles.emitElement(this.x, this.y, 'aire', 18, { speed: 150 });
        break;
      }
      case 'muralla': {
        this.invuln = Math.max(this.invuln, 3);
        const r = 220 * s.areaMult;
        hitAround(r, fake('tierra', (30 + lvl * 3) * s.damageMult, { stun: { dur: 1.6 } }, 200));
        g.addRing(this.x, this.y, 20, r, '#a1887f', 0.5);
        g.particles.emitElement(this.x, this.y, 'tierra', 30, { speed: 200 });
        g.shakeScreen(6);
        break;
      }
      case 'destello_cegador': {
        hitAround(700, fake('luz', (15 + lvl * 2) * s.damageMult, { stun: { dur: 2.2 } }));
        g.addRing(this.x, this.y, 30, 700, '#fff59d', 0.6);
        g.flash('#ffffff', 0.35);
        break;
      }
      case 'paso_sombrio': {
        const ox = this.x, oy = this.y;
        g.particles.emitElement(ox, oy, 'oscuridad', 25, { speed: 120 });
        this.x += this.facing.x * 230; this.y += this.facing.y * 230;
        this.invuln = Math.max(this.invuln, 0.5);
        const pw = fake('oscuridad', (20 + lvl * 3) * s.damageMult, { curse: { dur: 5 } });
        g.grid.query(ox, oy, 260, (e) => { if (Math.hypot(e.x - ox, e.y - oy) <= 220 + e.size) hitEnemy(g, e, pw, pw.stats.damage); });
        g.addRing(ox, oy, 10, 220, '#9575cd', 0.4);
        g.particles.emitElement(this.x, this.y, 'oscuridad', 25, { speed: 120 });
        break;
      }
      default: return false;
    }
    void el; void applyStatus;
    this.skillCd = this.skill.cd;
    g.audio.play('skill');
    return true;
  }

  update(dt) {
    this.skillCd = Math.max(0, this.skillCd - dt);
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.x += this.dashVx * dt; this.y += this.dashVy * dt;
      this.moving = true; this.walk += dt * 12;
      this.game.particles.emit(this.x, this.y, 2, { colors: ['#ffffff', this.cls.look.accent], speed: 40, life: [0.2, 0.4], size: [2, 4], add: true });
    } else {
      const ax = this.game.input.axis();
      const sp = CONFIG.player.baseSpeed * this.stats.speedMult;
      this.moving = !!(ax.x || ax.y);
      if (this.moving) {
        this.x += ax.x * sp * dt;
        this.y += ax.y * sp * dt;
        this.facing = { x: ax.x, y: ax.y };
        this.walk += dt * 9;
        this.dustT = (this.dustT || 0) - dt;
        if (this.dustT <= 0) {
          this.dustT = 0.12;
          this.game.particles.emit(this.x - ax.x * 8, this.y + 16, 1, { colors: ['rgba(255,255,255,0.35)'], speed: 20, life: [0.3, 0.5], size: [2, 3.5], grav: -10 });
        }
      } else {
        this.walk += dt * 2;
      }
    }
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.heal(this.stats.regen * dt);
  }
}
