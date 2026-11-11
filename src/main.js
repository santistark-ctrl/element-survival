import { CONFIG } from './config.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { Save } from './save.js';
import { GameAudio } from './audio.js';
import { Grid } from './spatial.js';
import { GameMap } from './map.js';
import { Player } from './player.js';
import { Particles } from './particles.js';
import { MAPS } from './data/maps.js';
import { CLASSES } from './data/classes.js';
import { starterPowersOfElement } from './data/powers.js';
import { UPGRADES, upgradeCost } from './data/upgrades.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { updateSpawner, updateEnemies } from './enemies.js';
import { updatePickups, updateOrbSpawner } from './pickups.js';
import { generateOptions, applyOption, generateChestOptions, chestBonus } from './levelup.js';
import { checkEvolutions } from './synergies.js';
import { updateEvents, updateHazards, eventMods } from './events.js';
import { render } from './render.js';
import { loadAssets } from './assets.js';
import { setupTouch } from './touch.js';
import { dist2, rand } from './utils.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new Input();
    this.save = new Save();
    this.settings = this.save.data.settings;
    this.audio = new GameAudio(this.settings);
    this.particles = new Particles(CONFIG.limits.maxParticles);
    this.ui = new UI(this);
    this.state = 'menu';
    this.map = null;
    this.player = null;
    this.cam = { x: 0, y: 0, w: 1280, h: 720 };
    this.grid = new Grid(96);
    this.shake = 0;
    this.last = 0;
    this.frame = 0;
    this.menuT = 0;
    this.flashT = 0; this.flashDur = 1; this.flashColor = '#fff';
    this.fps = 0; this.fpsAcc = 0; this.fpsFrames = 0;
    this.event = null; this.hazards = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    const unlock = () => { if (this.audio.ensure()) this.audio.startMusic(this.state === 'playing' ? 'game' : 'menu'); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('blur', () => { if (this.state === 'playing') this.pause(); });
    this.ui.showMenu();
    setupTouch(this);
    loadAssets();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const s = this.settings.pixel ? 0.5 : 1;
    this.canvas.width = Math.round(window.innerWidth * s);
    this.canvas.height = Math.round(window.innerHeight * s);
    this.canvas.classList.toggle('pixel', !!this.settings.pixel);
    this.ctx.imageSmoothingEnabled = !this.settings.pixel;
    this.cam.w = this.canvas.width; this.cam.h = this.canvas.height;
  }

  onSettingsChanged() {
    this.audio.applyVolumes();
    this.resize();
    this.save.write();
  }

  // ─── Ciclo de vida de la partida ───
  startRun(classId, mapId) {
    const cls = CLASSES[classId] || CLASSES.fuego;
    const def = MAPS.find((m) => m.id === mapId) || MAPS[0];
    this.save.data.lastClass = cls.id; this.save.data.lastMap = def.id; this.save.write();
    this.map = new GameMap(def);
    this.time = 0;
    this.enemies = []; this.enemyShots = []; this.projectiles = []; this.zones = []; this.effects = []; this.texts = [];
    this.orbs = []; this.coins = []; this.chests = []; this.hearts = []; this.hazards = []; this.heartTimer = 30;
    this.particles.list = [];
    this.activeSynergies = []; this.tripleSynergies = 0;
    this.damageByPower = {};
    this.pendingLevelUps = 0; this.pendingChests = [];
    this.spawnAcc = 0; this.orbTimer = 0; this.hordesSpawned = 0; this.currentSegment = 0; this.eliteTimer = 40; this.chestDelay = 0;
    this.boss = null; this.bossesSpawned = 0; this.bossesKilled = 0; this.finalBoss = null; this.won = false;
    this.event = null; this.nextEventAt = 75; this.lastEventId = null;
    this.achievementTimer = 1;
    this.shake = 0; this.flashT = 0;
    this.introT = 0.7; // fundido de entrada
    this.canvas.classList.remove('dying');
    this.player = new Player(this, cls);
    const starters = starterPowersOfElement(cls.element);
    this.player.addPower(starters[Math.floor(Math.random() * starters.length)].id);
    this.state = 'playing';
    this.ui.showHud();
    this.ui.announce(`${cls.name}`, cls.look.accent, 2);
    this.audio.setIntensity(1);
    this.audio.startMusic('game');
  }

  difficulty() {
    const m = this.time / 60;
    const curse = this.player ? this.player.stats.curse : 0;
    return { hp: (1 + m * 0.18 + (m / 10) * (m / 10) * 0.25) * (1 + curse * 0.5), dmg: 1 + m * 0.05 };
  }

  eventMods() { return eventMods(this); }

  pause() { if (this.state === 'playing') { this.state = 'paused'; this.ui.showPause(this); } }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.ui.hideOverlays(); } }

  // Muerte: animación breve con el mundo congelado y después el resumen.
  gameOver() {
    if (this.state === 'gameover' || this.state === 'dying' || !this.player) return;
    this.state = 'dying';
    this.dyingT = 0;
    this.canvas.classList.add('dying');
    this.ui.hideOverlays();
    const p = this.player;
    this.particles.emit(p.x, p.y, 40, { colors: [p.cls.look.accent, '#fff', '#ff5252'], speed: 220, life: [0.5, 1.2], size: [2, 5], grav: 60, drag: 1.5, add: true });
    this.addRing(p.x, p.y, 10, 260, p.cls.look.accent, 0.9);
    this.shakeScreen(10);
    this.flash('#3a0010', 0.8);
    this.audio.play('death');
    this.audio.stopMusic();
  }

  // Victoria: se derrotó al jefe final de los 30 minutos.
  victory() {
    if (this.state !== 'playing') return;
    this.won = true;
    this.state = 'dying';
    this.dyingT = -1.4; // celebración más larga
    this.ui.hideOverlays();
    this.ui.announce('¡VICTORIA!', '#ffd54f', 3);
    this.flash('#fff3b0', 0.8);
    this.shakeScreen(8);
    this.audio.stopMusic();
    this.audio.play('victory');
    this.checkAchievements();
  }

  finishGameOver() {
    this.state = 'gameover';
    const d = this.save.data;
    const won = this.won;
    const bonus = won ? 1000 + this.player.level * 10 : 0;
    this.player.gold += bonus;
    const stats = { time: this.time, level: this.player.level, kills: this.player.kills, bosses: this.bossesKilled, gold: this.player.gold, cls: this.player.cls.id, won, bonus };
    const records = [];
    if (stats.time > d.bestTime && d.runs > 0) records.push('Nuevo récord de tiempo');
    if (stats.level > d.bestLevel && d.runs > 0) records.push('Nuevo récord de nivel');
    if (stats.time > (d.bestTimeByClass[stats.cls] || 0) && d.runs > 0 && !records.length) records.push(`Mejor tiempo con ${this.player.cls.name}`);
    this.save.endRun(stats);
    this.checkAchievements(true);
    this.ui.showGameOver(stats, this.damageByPower, records, won);
    this.audio.play(won ? 'victory' : records.length ? 'record' : 'select');
    this.audio.setIntensity(0);
    this.audio.startMusic('menu');
  }

  buyUpgrade(id) {
    const def = UPGRADES[id];
    const d = this.save.data;
    const lvl = d.upgrades[id] || 0;
    const cost = upgradeCost(def, lvl);
    if (lvl >= def.max || d.gold < cost) { this.audio.play('denied'); return false; }
    d.gold -= cost;
    d.upgrades[id] = lvl + 1;
    this.save.write();
    this.audio.play('buy');
    this.checkAchievements(true);
    return true;
  }

  toMenu() {
    this.state = 'menu';
    this.map = null;
    this.canvas.classList.remove('dying');
    this.ui.showMenu();
    this.audio.startMusic('menu');
  }

  onBossKilled(e) {
    this.bossesKilled++;
    if (this.boss === e) this.boss = null;
    this.shakeScreen(12);
    this.flash('#fff3b0', 0.5);
    if (e.final) { this.finalBoss = null; this.victory(); return; }
    this.ui.announce('¡Jefe derrotado!', '#ffd54f', 3);
    this.audio.play('bossDead');
    this.audio.setIntensity(Math.min(3, 1 + Math.floor(this.time / 180)));
  }

  shakeScreen(v) { if (this.settings.screenShake) this.shake = Math.max(this.shake, v); }
  flash(color, dur) { this.flashColor = color; this.flashDur = dur; this.flashT = dur; }

  // ─── Logros ───
  runSnapshot() {
    const p = this.player;
    return {
      time: this.time, kills: p.kills, bosses: this.bossesKilled, level: p.level, items: p.items.length, elements: p.elements.size,
      synergies: p.evolved.length, tripleSynergies: this.tripleSynergies, evolutions: p.evolutionsDone, won: this.won,
      map: this.map ? this.map.def.id : null, noDamageTime: p.noDamageTime,
    };
  }

  checkAchievements(silentSave = false) {
    const d = this.save.data;
    const run = this.player && this.map ? this.runSnapshot() : { time: 0, kills: 0, bosses: 0, level: 0, items: 0, elements: 0, synergies: 0, tripleSynergies: 0, evolutions: 0, won: false, map: null, noDamageTime: 0 };
    let any = false;
    for (const a of ACHIEVEMENTS) {
      if (d.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.check(d, run); } catch (_) { ok = false; }
      if (!ok) continue;
      d.achievements[a.id] = Date.now();
      any = true;
      this.ui.announce(`🏆 Logro: ${a.name}`, '#ffd54f', 3);
      this.audio.play('achievement');
    }
    if (any || silentSave) this.save.write();
  }

  // ─── Subida de nivel y cofres ───
  startLevelUp() {
    this.state = 'levelup';
    this.audio.play('levelup');
    this.flash('#fff8e1', 0.3);
    const p = this.player;
    this.addRing(p.x, p.y, 10, 160, '#ffd54f', 0.5);
    this.particles.emit(p.x, p.y, 30, { colors: ['#ffd54f', '#fff', p.cls.look.accent], speed: 180, life: [0.4, 0.9], size: [2, 4], grav: -60, add: true });
    this.offerLevelUp();
  }

  offerLevelUp() {
    const options = generateOptions(this, 3);
    this.ui.showLevelUp(this.player.level, options, (opt) => this.pickLevelUp(opt));
  }

  // Aplica una elección (nivel o cofre) y anuncia sinergias, evoluciones y sinergias de ítems.
  afterPick(opt) {
    const p = this.player;
    const beforeItemSyn = new Set(p.itemSynergies.map((s) => s.id));
    const syn = applyOption(this, opt);
    if (opt.type === 'element') this.audio.play('element');
    for (const s of syn) { this.ui.announce(`¡Sinergia: ${s.name}!`, '#ce93d8', 3); this.audio.play('synergy'); this.flash('#ce93d8', 0.4); }
    const evos = checkEvolutions(this);
    for (const ev of evos) {
      this.ui.announce(`¡Evolución: ${ev.to.name}!`, '#ffd54f', 3.5);
      this.audio.play('evolution');
      this.flash('#fff3b0', 0.6);
      this.addRing(p.x, p.y, 20, 320, '#ffd54f', 0.8);
      this.particles.emitElement(p.x, p.y, ev.to.element, 50, { speed: 260 });
    }
    for (const s of p.itemSynergies) if (!beforeItemSyn.has(s.id)) { this.ui.announce(`Sinergia de ítems: ${s.name}`, '#80cbc4', 3); this.audio.play('synergy'); }
    this.checkAchievements();
  }

  pickLevelUp(opt) {
    this.afterPick(opt);
    this.finishLevelUp();
  }

  rerollLevelUp() {
    if (this.state !== 'levelup' || this.player.rerollsLeft <= 0) return;
    this.player.rerollsLeft--;
    this.offerLevelUp();
  }

  skipLevelUp() {
    if (this.state !== 'levelup') return;
    this.player.gold += CONFIG.player.skipGold;
    this.audio.play('skip');
    this.finishLevelUp();
  }

  finishLevelUp() {
    this.pendingLevelUps--;
    this.state = 'playing';
    this.ui.hideOverlays();
  }

  startChest() {
    this.state = 'chest';
    const rarity = this.pendingChests.shift();
    const options = generateChestOptions(this, rarity);
    const bonus = chestBonus(rarity);
    this.ui.showChest(rarity, options, bonus, (opt) => {
      this.afterPick(opt);
      if (bonus) { if (bonus.heal) this.player.heal(this.player.stats.maxHp); this.player.gold += bonus.gold; }
      this.state = 'playing';
      this.ui.hideOverlays();
    });
  }

  // ─── Utilidades para otros módulos ───
  nearestEnemy(x, y, range = Infinity, exclude = null) {
    let best = null, bd = range * range;
    for (const e of this.enemies) {
      if (e.dead || (exclude && exclude.has(e.id))) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  addText(x, y, text, color = '#fff', size = 13) {
    if (this.texts.length >= CONFIG.limits.maxTexts) this.texts.shift();
    this.texts.push({ x, y, text, color, size, t: 0, life: 0.75 });
  }

  addEffect(ef) {
    if (this.effects.length >= CONFIG.limits.maxEffects) this.effects.shift();
    ef.t = 0;
    this.effects.push(ef);
  }

  addRing(x, y, r0, r1, color, dur = 0.3) {
    this.addEffect({ dur, additive: true, draw(ctx, k) {
      ctx.strokeStyle = color; ctx.lineWidth = 5 * (1 - k) + 1; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * k, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * (1 - k) + 0.5; ctx.globalAlpha = (1 - k) * 0.8;
      ctx.beginPath(); ctx.arc(x, y, (r0 + (r1 - r0) * k) * 0.94, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } });
  }

  addLightning(pts, color) {
    const jag = [];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const segs = [];
      for (let j = 1; j < 4; j++) { const k = j / 4; segs.push([ax + (bx - ax) * k + rand(-9, 9), ay + (by - ay) * k + rand(-9, 9)]); }
      jag.push(segs);
    }
    this.addEffect({ dur: 0.2, additive: true, draw(ctx, k) {
      ctx.globalAlpha = 1 - k;
      ctx.lineCap = 'round';
      for (const [w, col] of [[6, color], [2.5, '#fff']]) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) { for (const [jx, jy] of jag[i - 1]) ctx.lineTo(jx, jy); ctx.lineTo(pts[i][0], pts[i][1]); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } });
  }

  addBurst(x, y, color, n) {
    this.particles.emit(x, y, n, { colors: [color, '#fff'], speed: 160, life: [0.3, 0.6], size: [2, 4], drag: 2, add: true });
  }

  // ─── Bucle ───
  loop(ts) {
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0);
    this.last = ts;
    this.frame++;
    this.menuT += dt;
    this.fpsAcc += dt; this.fpsFrames++;
    if (this.fpsAcc >= 0.5) { this.fps = Math.round(this.fpsFrames / this.fpsAcc); this.fpsAcc = 0; this.fpsFrames = 0; }
    this.input.pollGamepad();
    if (this.input.wasPressed('Escape')) {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }
    this.handleShortcuts();
    if (this.state === 'playing') this.update(dt);
    else if (this.state === 'dying') this.updateDying(dt);
    render(this);
    if (this.map && this.player && this.state !== 'menu') this.ui.updateHud(this);
    this.ui.tickPreviews(dt);
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  // Atajos: 1/2/3/4 elige carta, R reroll, Espacio habilidad (en juego) o saltar (en cartas), Enter reintenta.
  handleShortcuts() {
    const inp = this.input;
    if (this.state === 'playing') {
      if (inp.wasPressed('Space') || inp.wasPressed('GamepadA')) this.player.useSkill();
    } else if (this.state === 'levelup') {
      const cards = document.querySelectorAll('#levelup-cards .card');
      for (let i = 0; i < 3; i++) if (inp.wasPressed(`Digit${i + 1}`) && cards[i]) cards[i].click();
      if (inp.wasPressed('KeyR')) this.rerollLevelUp();
      if (inp.wasPressed('Space')) this.skipLevelUp();
    } else if (this.state === 'chest') {
      const cards = document.querySelectorAll('#chest-rewards .card');
      for (let i = 0; i < 4; i++) if (inp.wasPressed(`Digit${i + 1}`) && cards[i]) cards[i].click();
    } else if (this.state === 'gameover') {
      if (inp.wasPressed('Enter')) document.getElementById('btn-retry').click();
    }
  }

  updateDying(dt) {
    this.dyingT += dt;
    this.particles.update(dt);
    if (this.won && this.dyingT < 1.4 && Math.random() < 0.3) {
      // fuegos artificiales de victoria
      const p = this.player;
      this.particles.emit(p.x + rand(-300, 300), p.y + rand(-250, 150), 18, { colors: ['#ffd54f', '#ff6b35', '#4fc3f7', '#ce93d8', '#fff'], speed: 200, life: [0.5, 1.1], size: [2, 4], grav: 80, drag: 1.5, add: true });
    }
    for (const ef of this.effects) ef.t += dt;
    this.effects = this.effects.filter((ef) => ef.t < ef.dur);
    for (const t of this.texts) { t.t += dt; t.y -= 45 * dt; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    this.shake = Math.max(0, this.shake - 30 * dt);
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.dyingT >= 1.6) this.finishGameOver();
  }

  update(dt) {
    this.time += dt;
    if (this.introT > 0) this.introT -= dt;
    this.player.update(dt);

    this.grid.clear();
    for (const e of this.enemies) this.grid.insert(e);

    updateSpawner(this, dt);
    updateOrbSpawner(this, dt);
    updateEvents(this, dt);
    updateEnemies(this, dt);
    if (this.state !== 'playing') return;
    updateHazards(this, dt);
    if (this.state !== 'playing') return;

    for (const pw of this.player.allPowers()) pw.update(dt);
    for (const pr of this.projectiles) pr.update(dt, this);
    for (const z of this.zones) z.update(dt, this);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.zones = this.zones.filter((z) => !z.dead);
    this.enemies = this.enemies.filter((e) => !e.dead);
    if (this.state !== 'playing') return; // victoria durante el update

    updatePickups(this, dt);
    this.particles.update(dt);

    for (const t of this.texts) { t.t += dt; t.y -= 45 * dt; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    for (const ef of this.effects) ef.t += dt;
    this.effects = this.effects.filter((ef) => ef.t < ef.dur);
    this.shake = Math.max(0, this.shake - 30 * dt);
    this.flashT = Math.max(0, this.flashT - dt);

    const target = this.boss ? 3 : Math.min(2, 1 + Math.floor(this.time / 180));
    if (this.audio.intensity !== target) this.audio.setIntensity(target);

    this.achievementTimer -= dt;
    if (this.achievementTimer <= 0) { this.achievementTimer = 2; this.checkAchievements(); }

    if (this.pendingLevelUps > 0) this.startLevelUp();
    else if (this.pendingChests.length) {
      if (!this.chestDelay) {
        this.chestDelay = 0.5;
        const p = this.player;
        this.particles.emit(p.x, p.y, 24, { colors: ['#ffd54f', '#fff'], speed: 160, life: [0.3, 0.7], size: [2, 4], grav: -80, add: true });
        this.addRing(p.x, p.y, 10, 120, '#ffd54f', 0.5);
        this.audio.play('chest');
      } else {
        this.chestDelay -= dt;
        if (this.chestDelay <= 0) { this.chestDelay = 0; this.startChest(); }
      }
    }
  }
}

window.game = new Game();
