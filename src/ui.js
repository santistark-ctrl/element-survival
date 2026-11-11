import { CONFIG } from './config.js';
import { POWERS, POWER_LIST, STAT_NAMES, KIND_NAMES, powersOfElement } from './data/powers.js';
import { ITEMS } from './data/items.js';
import { ELEMENTS, ELEMENT_LIST } from './data/elements.js';
import { RARITIES } from './data/rarities.js';
import { MAPS } from './data/maps.js';
import { CLASS_LIST, CLASSES } from './data/classes.js';
import { SYNERGIES } from './data/synergies.js';
import { UPGRADE_LIST, upgradeCost } from './data/upgrades.js';
import { BOOSTS } from './data/boosts.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { EVOLUTIONS, evolutionOf } from './data/evolutions.js';
import { ITEM_SYNERGIES } from './data/itemSynergies.js';
import { ENEMY_TYPES, BOSSES } from './data/enemies.js';
import { EVENTS } from './data/events.js';
import { computeStats } from './powers.js';
import { fmtTime, fmtNum } from './utils.js';
import { drawSilhouette } from './character.js';

const OVERLAYS = ['menu', 'classselect', 'options', 'levelup', 'chest', 'pause', 'gameover', 'compendium', 'upgrades', 'achievements'];

export class UI {
  constructor(game) {
    this.game = game;
    this.$ = (id) => document.getElementById(id);
    this.slotSignature = '';
    this.announceTimer = null;
    this.optionsBack = 'menu';
    this.compendiumBack = 'menu';
    this.compendiumTab = 'elementos';
    this.previewT = 0;

    // mapas
    const sel = this.$('map-select');
    for (const m of MAPS) {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = `${m.name} — ${m.desc}`;
      sel.appendChild(o);
    }
    sel.value = game.save.data.lastMap;

    // clases
    this.selectedClass = CLASSES[game.save.data.lastClass] ? game.save.data.lastClass : 'fuego';
    const box = this.$('class-cards');
    box.innerHTML = CLASS_LIST.map((c) => {
      const el = ELEMENTS[c.element];
      return `<div class="class-card" data-id="${c.id}" style="--c:${el.color}">
        <canvas width="96" height="116"></canvas>
        <div class="class-name">${c.name}</div>
        <div class="class-el">${el.icon} ${el.name}</div>
        <div class="class-desc">${c.desc}</div>
        <div class="class-bonus">+${Math.round(c.bonus.damage * 100)}% daño y -${Math.round((1 - c.bonus.cooldown) * 100)}% recarga en su rama</div>
      </div>`;
    }).join('');
    [...box.children].forEach((el) => {
      el.onclick = () => { this.selectedClass = el.dataset.id; this.refreshClassCards(); game.audio.play('select'); };
      el.onmouseenter = () => game.audio.play('hover');
    });
    this.refreshClassCards();

    // botones
    const click = (id, fn) => { const el = this.$(id); el.onclick = () => { game.audio.play('select'); fn(); }; el.onmouseenter = () => game.audio.play('hover'); };
    click('btn-play', () => this.showClassSelect());
    click('btn-options', () => this.showOptions('menu'));
    click('btn-compendium', () => this.showCompendium('menu'));
    click('btn-upgrades', () => this.showUpgrades());
    click('btn-upgrades-back', () => this.showMenu());
    click('btn-achievements', () => this.showAchievements());
    click('btn-achievements-back', () => this.showMenu());
    this.achTab = 'logros';
    for (const tab of this.$('ach-tabs').children) {
      tab.onclick = () => { this.achTab = tab.dataset.tab; this.renderAchievements(); game.audio.play('select'); };
    }
    click('btn-start', () => game.startRun(this.selectedClass, sel.value));
    click('btn-class-back', () => this.showMenu());
    click('btn-options-back', () => this.closeOptions());
    click('btn-resume', () => game.resume());
    click('btn-pause-options', () => this.showOptions('pause'));
    click('btn-pause-compendium', () => this.showCompendium('pause'));
    click('btn-levelup-compendium', () => this.showCompendium('levelup'));
    click('btn-compendium-back', () => this.closeCompendium());
    click('btn-quit', () => game.gameOver());
    click('btn-menu', () => game.toMenu());
    click('btn-retry', () => game.startRun(game.player.cls.id, game.map.def.id));
    click('btn-reroll', () => game.rerollLevelUp());
    click('btn-skip', () => game.skipLevelUp());
    for (const tab of this.$('compendium-tabs').children) {
      tab.onclick = () => { this.compendiumTab = tab.dataset.tab; this.renderCompendium(); game.audio.play('select'); };
    }

    // opciones
    const st = game.settings;
    const bind = (id, key, isCheck = false) => {
      const el = this.$(id);
      if (isCheck) { el.checked = st[key]; el.onchange = () => { st[key] = el.checked; game.onSettingsChanged(); }; }
      else { el.value = st[key]; el.oninput = () => { st[key] = parseFloat(el.value); game.onSettingsChanged(); this.$(id + '-val').textContent = `${Math.round(st[key] * 100)}%`; }; this.$(id + '-val').textContent = `${Math.round(st[key] * 100)}%`; }
    };
    bind('opt-master', 'master'); bind('opt-music', 'music'); bind('opt-sfx', 'sfx');
    bind('opt-dmg', 'damageNumbers', true); bind('opt-shake', 'screenShake', true); bind('opt-fps', 'showFps', true); bind('opt-pixel', 'pixel', true);
    this.$('btn-test-sound').onclick = () => game.audio.play('levelup');

    this.$('game-title').textContent = CONFIG.gameName;
    document.title = CONFIG.gameName;
  }

  showOnly(id) {
    for (const o of OVERLAYS) this.$(o).classList.toggle('hidden', o !== id);
  }
  hideOverlays() { this.showOnly(null); }

  // ─── Menú ───
  showMenu() {
    const d = this.game.save.data;
    this.$('hud').classList.add('hidden');
    this.$('menu-meta').innerHTML =
      `<span>🪙 <b>${d.gold}</b> oro</span><span>⏱️ <b>${fmtTime(d.bestTime)}</b> mejor tiempo</span><span>⭐ <b>${d.bestLevel}</b> mejor nivel</span>` +
      `<span>🎮 <b>${d.runs}</b> partidas</span><span>☠️ <b>${d.totalKills}</b> bajas</span><span>👑 <b>${d.bossesKilled}</b> jefes</span>`;
    this.showOnly('menu');
  }

  showClassSelect() {
    this.showOnly('classselect');
    this.refreshClassCards();
  }

  refreshClassCards() {
    for (const el of this.$('class-cards').children) el.classList.toggle('selected', el.dataset.id === this.selectedClass);
  }

  tickPreviews(dt) {
    if (this.$('classselect').classList.contains('hidden')) return;
    this.previewT += dt * 6;
    for (const el of this.$('class-cards').children) {
      const c = CLASSES[el.dataset.id];
      const cv = el.querySelector('canvas');
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawSilhouette(ctx, c.look, cv.width / 2, 66, 1.9, this.previewT, el.dataset.id === this.selectedClass, 1, false);
    }
  }

  // ─── Logros y estadísticas ───
  showAchievements() {
    this.renderAchievements();
    this.showOnly('achievements');
  }
  renderAchievements() {
    for (const tab of this.$('ach-tabs').children) tab.classList.toggle('active', tab.dataset.tab === this.achTab);
    const d = this.game.save.data;
    const body = this.$('ach-body');
    if (this.achTab === 'logros') {
      const done = ACHIEVEMENTS.filter((a) => d.achievements[a.id]).length;
      this.$('ach-sub').textContent = `${done} de ${ACHIEVEMENTS.length} logros desbloqueados`;
      body.innerHTML = `<div class="ach-grid">` + ACHIEVEMENTS.map((a) => {
        const ok = !!d.achievements[a.id];
        return `<div class="ach-card ${ok ? 'done' : ''}"><div class="ach-icon">${ok ? a.icon : '🔒'}</div><div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div></div>`;
      }).join('') + `</div>`;
    } else {
      this.$('ach-sub').textContent = 'Todo lo que jugaste hasta ahora';
      const cls = CLASS_LIST.map((c) => `<div class="stat-row"><span>${ELEMENTS[c.element].icon} ${c.name}</span><b>${fmtTime(d.bestTimeByClass[c.id] || 0)}</b></div>`).join('');
      const kills = Object.entries(d.killsByEnemy).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([id, n]) => `<div class="stat-row"><span>${(ENEMY_TYPES[id] || BOSSES[id] || { name: id }).name}</span><b>${n.toLocaleString('es-AR')}</b></div>`).join('') || '<div class="muted">Todavía nada</div>';
      const bosses = Object.entries(d.bossKillsByType).map(([id, n]) => `<div class="stat-row"><span>👑 ${(BOSSES[id] || { name: id }).name}</span><b>${n}</b></div>`).join('') || '<div class="muted">Ninguno todavía</div>';
      const synCount = Object.keys(d.synergiesSeen).length, evoCount = Object.keys(d.evolutionsSeen).length;
      body.innerHTML = `<div class="stats-cols">
        <div><h3>General</h3>
          <div class="stat-row"><span>Partidas</span><b>${d.runs}</b></div><div class="stat-row"><span>Victorias</span><b>${d.wins}</b></div>
          <div class="stat-row"><span>Tiempo total jugado</span><b>${fmtTime(d.totalTime)}</b></div><div class="stat-row"><span>Mejor tiempo</span><b>${fmtTime(d.bestTime)}</b></div>
          <div class="stat-row"><span>Mejor nivel</span><b>${d.bestLevel}</b></div><div class="stat-row"><span>Bajas totales</span><b>${d.totalKills.toLocaleString('es-AR')}</b></div>
          <div class="stat-row"><span>Jefes derrotados</span><b>${d.bossesKilled}</b></div><div class="stat-row"><span>Oro actual</span><b>${d.gold}</b></div>
          <div class="stat-row"><span>Sinergias descubiertas</span><b>${synCount} / ${SYNERGIES.length}</b></div><div class="stat-row"><span>Evoluciones descubiertas</span><b>${evoCount} / ${EVOLUTIONS.length}</b></div>
          <h3>Jefes</h3>${bosses}</div>
        <div><h3>Mejor tiempo por clase</h3>${cls}<h3>Bajas por enemigo</h3>${kills}</div>
      </div>`;
    }
  }

  // ─── Mejoras permanentes ───
  showUpgrades() {
    this.renderUpgrades();
    this.showOnly('upgrades');
  }
  renderUpgrades() {
    const d = this.game.save.data;
    const ups = d.upgrades || {};
    this.$('upgrades-gold').innerHTML = `🪙 <b>${d.gold}</b> oro disponible`;
    const box = this.$('upgrades-list');
    box.innerHTML = UPGRADE_LIST.map((u) => {
      const lvl = ups[u.id] || 0;
      const maxed = lvl >= u.max;
      const cost = maxed ? 0 : upgradeCost(u, lvl);
      const can = !maxed && d.gold >= cost;
      const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      return `<div class="up-row ${maxed ? 'maxed' : ''}">
        <div class="up-icon">${u.icon}</div>
        <div class="up-info"><div class="up-name">${u.name} <span class="muted">${lvl}/${u.max}</span></div><div class="up-desc">${lvl ? u.desc(lvl) : 'Sin comprar'}${!maxed ? ` → <b>${u.desc(lvl + 1)}</b>` : ''}</div><div class="up-pips">${pips}</div></div>
        <button class="btn ${can ? 'primary' : ''}" data-id="${u.id}" ${can ? '' : 'disabled'}>${maxed ? 'Máximo' : `🪙 ${cost}`}</button>
      </div>`;
    }).join('');
    for (const b of box.querySelectorAll('button')) b.onclick = () => { this.game.buyUpgrade(b.dataset.id); this.renderUpgrades(); };
  }

  showOptions(back) { this.optionsBack = back; this.showOnly('options'); }
  closeOptions() {
    this.game.save.write();
    if (this.optionsBack === 'pause') this.showOnly('pause');
    else this.showMenu();
  }

  // ─── Compendio ───
  showCompendium(back) {
    this.compendiumBack = back;
    this.renderCompendium();
    this.showOnly('compendium');
  }
  closeCompendium() {
    const b = this.compendiumBack;
    if (b === 'menu') this.showMenu(); else this.showOnly(b);
  }
  renderCompendium() {
    for (const tab of this.$('compendium-tabs').children) tab.classList.toggle('active', tab.dataset.tab === this.compendiumTab);
    const p = this.game.player;
    const body = this.$('compendium-body');
    if (this.compendiumTab === 'elementos') {
      body.innerHTML = ELEMENT_LIST.map((el) => {
        const state = !p ? '' : p.hasElement(el.id) ? 'owned' : p.canUnlockElement(el.id) ? 'available' : 'locked';
        const label = !p ? '' : p.hasElement(el.id) ? 'Desbloqueado' : p.canUnlockElement(el.id) ? 'Disponible' : el.parent && !p.hasElement(el.parent) ? `Requiere ${ELEMENTS[el.parent].name}` : 'Bloqueado';
        const powers = powersOfElement(el.id).map((pw) => {
          const own = p && p.powers.find((x) => x.def.id === pw.id);
          return `<li>${pw.name}${own ? ` <b>Nv.${own.level}</b>` : ''} <span class="muted">· ${KIND_NAMES[pw.kind]}</span></li>`;
        }).join('');
        return `<div class="comp-card ${state}" style="--c:${el.color}">
          <div class="comp-head"><span class="comp-icon">${el.icon}</span><div><div class="comp-title">${el.name}</div><div class="comp-sub">${el.parent ? `Subcontrol de ${ELEMENTS[el.parent].name}` : 'Control base'}${label ? ` · ${label}` : ''}</div></div></div>
          <div class="comp-desc">${el.desc}</div><ul class="comp-list">${powers}</ul></div>`;
      }).join('');
    } else if (this.compendiumTab === 'magias') {
      body.innerHTML = POWER_LIST.filter((pw) => !pw.evolved).map((pw) => {
        const el = ELEMENTS[pw.element];
        const own = p && p.powers.find((x) => x.def.id === pw.id);
        const state = !p ? '' : own ? 'owned' : p.hasElement(pw.element) ? 'available' : 'locked';
        const s = pw.base;
        const stats = ['damage', 'cooldown', 'count', 'radius', 'range', 'duration'].filter((k) => s[k] != null).map((k) => `${STAT_NAMES[k]} ${fmtNum(s[k])}`).join(' · ');
        return `<div class="comp-card ${state}" style="--c:${el.color}">
          <div class="comp-head"><span class="comp-icon">${el.icon}</span><div><div class="comp-title">${pw.name}${own ? ` <b>Nv.${own.level}</b>` : ''}</div><div class="comp-sub">${el.name} · ${KIND_NAMES[pw.kind]}</div></div></div>
          <div class="comp-desc">${pw.desc}</div><div class="comp-stats">${stats}</div></div>`;
      }).join('');
    } else if (this.compendiumTab === 'evoluciones') {
      body.innerHTML = EVOLUTIONS.map((ev) => {
        const base = POWERS[ev.power], item = ITEMS[ev.item], res = POWERS[ev.result];
        const el = ELEMENTS[res.element];
        const own = p && p.powers.find((x) => x.def.id === ev.power);
        const done = p && p.powers.some((x) => x.def.id === ev.result);
        const hasItem = p && p.items.some((it) => it.id === ev.item);
        const state = done ? 'owned' : (own || hasItem) ? 'available' : '';
        return `<div class="comp-card ${state}" style="--c:${el.color}">
          <div class="comp-head"><span class="comp-icon">${el.icon}</span><div><div class="comp-title">${res.name}${done ? ' ✅' : ''}</div><div class="comp-sub">${KIND_NAMES[res.kind]} · ${el.name}</div></div></div>
          <div class="syn-req"><span class="syn-part ${own && own.level >= own.maxLevel ? 'ok' : ''}" style="--c:${el.color}">${el.icon} ${base.name} nivel máx.${own ? ` (${own.level}/${own.maxLevel})` : ''}</span><span class="syn-plus">+</span><span class="syn-part ${hasItem ? 'ok' : ''}" style="--c:${RARITIES[item.rarity].color}">${item.icon} ${item.name}</span></div>
          <div class="comp-desc">${res.desc}</div></div>`;
      }).join('');
    } else if (this.compendiumTab === 'objetos') {
      body.innerHTML = ITEM_SYNERGIES.map((sy) => {
        const active = p && p.itemSynergies.some((s) => s.id === sy.id);
        const parts = sy.items.map((id) => { const it = ITEMS[id]; const has = p && p.items.some((x) => x.id === id); return `<span class="syn-part ${has ? 'ok' : ''}" style="--c:${RARITIES[it.rarity].color}">${it.icon} ${it.name}</span>`; }).join('<span class="syn-plus">+</span>');
        return `<div class="comp-card ${active ? 'owned' : ''}" style="--c:#80cbc4">
          <div class="comp-head"><span class="comp-icon">🧩</span><div><div class="comp-title">${sy.name}${active ? ' ✅' : ''}</div><div class="comp-sub">Sinergia de ítems</div></div></div>
          <div class="syn-req">${parts}</div><div class="comp-desc">${sy.desc}</div></div>`;
      }).join('');
    } else {
      body.innerHTML = SYNERGIES.map((syn) => {
        const ev = POWERS[syn.grants];
        const active = p && p.evolved.some((e) => e.def.id === syn.grants);
        const parts = syn.elements.map((id) => {
          const el = ELEMENTS[id];
          const best = p ? p.powers.filter((pw) => pw.def.element === id).reduce((m, pw) => Math.max(m, pw.level), 0) : 0;
          const ok = best >= syn.minLevel;
          return `<span class="syn-part ${ok ? 'ok' : ''}" style="--c:${el.color}">${el.icon} ${el.name}${p ? ` ${best}/${syn.minLevel}` : ` Nv.${syn.minLevel}`}</span>`;
        }).join('<span class="syn-plus">+</span>');
        const state = active ? 'owned' : '';
        return `<div class="comp-card ${state}" style="--c:${ELEMENTS[ev.element].color}">
          <div class="comp-head"><span class="comp-icon">${ELEMENTS[ev.element].icon}</span><div><div class="comp-title">${syn.name}${active ? ' ✅' : ''}</div><div class="comp-sub">Otorga: ${ev.name} (${KIND_NAMES[ev.kind]})</div></div></div>
          <div class="syn-req">${parts}</div><div class="comp-desc">${ev.desc}</div></div>`;
      }).join('');
    }
  }

  showHud() {
    this.hideOverlays();
    this.$('hud').classList.remove('hidden');
    this.slotSignature = '';
  }

  // ─── HUD ───
  updateHud(game) {
    const p = game.player;
    const hp = this.$('hud').querySelector('.bar.hp');
    hp.querySelector('.fill').style.width = `${(p.hp / p.stats.maxHp) * 100}%`;
    hp.querySelector('.label').textContent = `${Math.ceil(p.hp)} / ${Math.round(p.stats.maxHp)}`;
    const xp = this.$('hud').querySelector('.bar.xp');
    xp.querySelector('.fill').style.width = `${(p.xp / p.xpNext) * 100}%`;
    xp.querySelector('.label').textContent = `Nivel ${p.level} · ${Math.floor(p.xp)} / ${p.xpNext} XP`;
    this.$('timer').textContent = fmtTime(game.time);
    this.$('stats').innerHTML = `<span>☠️ ${p.kills}</span><span>🪙 ${p.gold}</span><span>👾 ${game.enemies.length}</span>${game.settings.showFps ? `<span>${game.fps} fps</span>` : ''}`;

    const sig = p.powers.map((x) => x.def.id + x.level).join() + '|' + p.items.map((x) => x.id + x.level).join() + '|' + p.evolved.map((x) => x.def.id).join() + '|' + [...p.elements].join();
    if (sig !== this.slotSignature) {
      this.slotSignature = sig;
      this.$('element-slots').innerHTML = [...p.elements].map((id) => {
        const el = ELEMENTS[id];
        return `<div class="slot small" style="--c:${el.color}" title="${el.name}">${el.icon}</div>`;
      }).join('') + `<div class="slot small empty" title="Elementos">${p.elements.size}/${CONFIG.player.maxElements}</div>`;
      this.$('power-slots').innerHTML = p.powers.map((pw) =>
        `<div class="slot" style="--c:${pw.color}" title="${pw.def.name} Nv.${pw.level}">${pw.element.icon}<span class="lvl">${pw.level}</span></div>`).join('');
      this.$('item-slots').innerHTML = p.items.map((it) => {
        const d = ITEMS[it.id], r = RARITIES[d.rarity];
        return `<div class="slot" style="--c:${r.color}" title="${d.name} Nv.${it.level}">${d.icon}<span class="lvl">${it.level}</span></div>`;
      }).join('');
      this.$('synergy-slots').innerHTML = p.evolved.map((pw) =>
        `<div class="slot synergy" style="--c:${pw.color}">${pw.element.icon} ${pw.def.name}</div>`).join('');
    }

    // evento activo
    const eb = this.$('event-badge');
    if (game.event) {
      const ev = game.event;
      eb.classList.remove('hidden');
      eb.style.setProperty('--c', ev.def.color);
      eb.innerHTML = `<span class="ev-icon">${ev.def.icon}</span><span class="ev-name">${ev.id === 'oleada' ? `Oleada de ${ev.data.name}` : ev.def.name}</span><span class="ev-time">${Math.ceil(ev.dur - ev.t)}s</span>`;
    } else eb.classList.add('hidden');
    // habilidad activa
    const sk = this.$('skill-hud');
    if (p.skill) {
      sk.classList.remove('hidden');
      const k = p.skillCd / p.skill.cd;
      sk.style.setProperty('--cd', `${Math.round(k * 100)}%`);
      sk.classList.toggle('ready', p.skillCd <= 0);
      sk.querySelector('.sk-icon').textContent = p.skill.icon;
      sk.querySelector('.sk-name').textContent = p.skillCd > 0 ? `${p.skillCd.toFixed(1)}s` : p.skill.name;
    }

    const bb = this.$('boss-bar');
    if (game.boss && !game.boss.dead) {
      bb.classList.remove('hidden');
      bb.querySelector('.name').textContent = game.boss.name;
      bb.querySelector('.fill').style.width = `${Math.max(0, (game.boss.hp / game.boss.maxHp) * 100)}%`;
    } else bb.classList.add('hidden');
  }

  announce(text, color = '#fff', dur = 2.5) {
    const a = this.$('announce');
    a.textContent = text; a.style.color = color;
    a.style.fontSize = text.length > 22 ? '26px' : text.length > 14 ? '34px' : '42px';
    a.classList.remove('show');
    void a.offsetWidth; // reinicia la animación
    a.classList.add('show');
    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => a.classList.remove('show'), dur * 1000);
  }

  // ─── Cartas ───
  cardHtml(opt, clickable = true, i = 0) {
    const cls = `card${clickable ? '' : ' static'}`;
    const style = (c) => `style="--c:${c}; animation-delay:${i * 70}ms"`;
    if (opt.type === 'power') {
      const d = POWERS[opt.id], el = ELEMENTS[d.element];
      const body = opt.isNew ? d.desc : levelDiffHtml(d, opt.level);
      const ev = evolutionOf(d.id);
      const evoTag = ev ? ` · evoluciona con ${ITEMS[ev.item].icon} ${ITEMS[ev.item].name}` : '';
      return `<div class="${cls}" ${style(el.color)}>
        <div class="card-head"><div class="card-icon">${el.icon}</div><div><div class="card-title">${d.name}</div><div class="card-sub">${el.name} · ${opt.isNew ? 'Nuevo poder' : `Nivel ${opt.level}`}</div></div></div>
        <div class="card-desc">${body}</div>
        <div class="card-tag">${KIND_NAMES[d.kind] || d.kind} · máx. nivel ${d.maxLevel || 8}${evoTag}</div></div>`;
    }
    if (opt.type === 'element') {
      const el = ELEMENTS[opt.id];
      const list = powersOfElement(opt.id).map((p) => p.name).join(', ');
      return `<div class="${cls} element" ${style(el.color)}>
        <div class="card-head"><div class="card-icon">${el.icon}</div><div><div class="card-title">${el.name}</div><div class="card-sub">${el.parent ? `Subcontrol de ${ELEMENTS[el.parent].name}` : 'Nuevo elemento'}</div></div></div>
        <div class="card-desc">${el.desc}<br><br>Desbloquea: ${list}.</div>
        <div class="card-tag">Elementos: ${this.game.player.elements.size}/${CONFIG.player.maxElements}</div></div>`;
    }
    if (opt.type === 'stat') {
      const b = BOOSTS[opt.id];
      const times = this.game.player.boosts[opt.id] || 0;
      return `<div class="${cls} stat" ${style('#80cbc4')}>
        <div class="card-head"><div class="card-icon">${b.icon}</div><div><div class="card-title">${b.name}</div><div class="card-sub">Aumento de stats${times ? ` · elegido ${times}×` : ''}</div></div></div>
        <div class="card-desc">${b.desc}</div>
        <div class="card-tag">Permanente durante la partida · no ocupa slot</div></div>`;
    }
    if (opt.type === 'item') {
      const d = ITEMS[opt.id], r = RARITIES[d.rarity];
      return `<div class="${cls} rarity-${d.rarity}" ${style(r.color)}>
        <div class="card-head"><div class="card-icon">${d.icon}</div><div><div class="card-title">${d.name}</div><div class="card-sub">${r.name} · ${opt.isNew ? 'Nuevo ítem' : `Nivel ${opt.level}`}</div></div></div>
        <div class="card-desc">${d.desc(opt.level)}</div>
        <div class="card-tag">${d.category === 'power' ? 'Modificador de poderes' : 'Ítem de personaje'} · máx. nivel ${d.maxLevel}</div></div>`;
    }
    if (opt.type === 'gold') {
      return `<div class="${cls}" ${style('#ffd54f')}><div class="card-head"><div class="card-icon">🪙</div><div><div class="card-title">Oro</div><div class="card-sub">Bonificación</div></div></div><div class="card-desc">+${opt.amount} de oro${opt.extra ? ' y vida completa' : ''}.</div></div>`;
    }
    return `<div class="${cls}" ${style('#ef5350')}><div class="card-head"><div class="card-icon">❤️</div><div><div class="card-title">Curación</div><div class="card-sub">Bonificación</div></div></div><div class="card-desc">Recuperás el 30% de tu vida máxima.</div></div>`;
  }

  showLevelUp(level, options, onPick) {
    const p = this.game.player;
    this.$('levelup-title').textContent = `¡Nivel ${level}!`;
    const box = this.$('levelup-cards');
    box.innerHTML = options.map((o, i) => this.cardHtml(o, true, i)).join('');
    [...box.children].forEach((el, i) => {
      el.onclick = () => { this.game.audio.play('select'); onPick(options[i]); };
      el.onmouseenter = () => this.game.audio.play('hover');
    });
    const rr = this.$('btn-reroll');
    rr.textContent = `Reroll (${p.rerollsLeft})`;
    rr.disabled = p.rerollsLeft <= 0;
    this.$('btn-skip').textContent = `Saltar (+${CONFIG.player.skipGold} oro)`;
    this.showOnly('levelup');
  }

  showChest(rarity, options, bonus, onPick) {
    const r = RARITIES[rarity];
    this.$('chest-title').innerHTML = `Cofre <span style="color:${r.color}">${r.name}</span>`;
    const extra = bonus ? ` · Además: ${bonus.heal ? 'vida completa y ' : ''}+${bonus.gold} de oro` : '';
    this.$('chest-sub').textContent = `Elegí un ítem${extra}`;
    const box = this.$('chest-rewards');
    box.innerHTML = options.map((o, i) => this.cardHtml(o, true, i)).join('');
    [...box.children].forEach((el, i) => {
      el.onclick = () => { this.game.audio.play('select'); onPick(options[i]); };
      el.onmouseenter = () => this.game.audio.play('hover');
    });
    this.$('chest').querySelector('.panel').style.setProperty('--c', r.color);
    this.showOnly('chest');
  }

  showPause(game) {
    const p = game.player;
    const s = p.stats;
    const powers = p.powers.map((pw) => `${pw.element.icon} ${pw.def.name} <b>Nv.${pw.level}</b> <span class="muted">(${fmtNum(Math.round(pw.stats.damage))} daño)</span>`).join('<br>') || '—';
    const items = p.items.map((it) => `${ITEMS[it.id].icon} ${ITEMS[it.id].name} <b>Nv.${it.level}</b>`).join('<br>') || '—';
    const boosts = Object.entries(p.boosts).map(([id, n]) => `${BOOSTS[id].icon} ${BOOSTS[id].name} <b>×${n}</b>`).join(', ') || '—';
    const elements = [...p.elements].map((id) => `${ELEMENTS[id].icon} ${ELEMENTS[id].name}`).join(', ');
    const evolved = p.evolved.map((pw) => `${pw.element.icon} ${pw.def.name}`).join(', ') || '—';
    const itemSyn = p.itemSynergies.map((s) => `🧩 ${s.name}`).join(', ') || '—';
    const skill = p.skill ? `${p.skill.icon} ${p.skill.name} <span class="muted">(Espacio, ${p.skill.cd}s)</span>` : '—';
    const stats = `Daño ${pct(s.damageMult)} · Área ${pct(s.areaMult)} · Recarga ${pct(s.cooldownMult)} · Velocidad ${pct(s.speedMult)}<br>` +
      `Armadura ${s.armor} · Regen ${s.regen.toFixed(1)}/s · Suerte ${pct(s.luck, true)} · XP ${pct(s.xpMult)} · Maldición ${pct(s.curse, true)}<br>` +
      `Robo de vida ${pct(s.lifesteal, true)} · Revives ${s.revives - p.revivesUsed} · Rerolls ${p.rerollsLeft}`;
    this.$('pause-summary').innerHTML =
      `<div class="cols"><div><b>Elementos</b><br>${elements}<br><br><b>Habilidad</b><br>${skill}<br><br><b>Poderes</b><br>${powers}<br><br><b>Sinergias activas</b><br>${evolved}</div>` +
      `<div><b>Ítems</b><br>${items}<br><br><b>Sinergias de ítems</b><br>${itemSyn}<br><br><b>Aumentos de stats</b><br>${boosts}<br><br><b>Estadísticas</b><br>${stats}</div></div>`;
    this.showOnly('pause');
  }

  showGameOver(stats, damageByPower, records = [], won = false) {
    const title = this.$('gameover').querySelector('h2');
    title.textContent = won ? '¡Victoria!' : 'Has caído';
    title.classList.toggle('danger', !won);
    title.classList.toggle('glow-title', won);
    if (won) records = [`Sobreviviste los 30 minutos · +${stats.bonus} de oro`, ...records];
    const rows = Object.entries(damageByPower).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, dmg]) => {
      const d = POWERS[id];
      const name = d ? `${ELEMENTS[d.element].icon} ${d.name}` : id === 'quemadura' ? '🔥 Quemaduras' : id === 'veneno' ? '☠️ Veneno' : id === 'habilidad' ? '✨ Habilidad de clase' : id === 'meteoros' ? '☄️ Meteoros' : id;
      return `<div class="dmg-row"><span>${name}</span><span>${Math.round(dmg).toLocaleString('es-AR')}</span></div>`;
    }).join('') || '—';
    this.$('gameover-stats').innerHTML =
      (records.length ? `<div class="record">🏆 ${records.join(' · ')}</div>` : '') +
      `<div class="go-grid"><div><span>Tiempo</span><b>${fmtTime(stats.time)}</b></div><div><span>Nivel</span><b>${stats.level}</b></div><div><span>Bajas</span><b>${stats.kills}</b></div><div><span>Jefes</span><b>${stats.bosses}</b></div><div><span>Oro</span><b style="color:#ffd54f">${stats.gold}</b></div></div>` +
      `<br><b>Daño por poder</b>${rows}`;
    this.showOnly('gameover');
  }
}

function pct(v, add = false) { return `${Math.round((add ? v : v - 1) * 100)}%`.replace(/^(\d)/, '+$1'); }

// Describe qué cambia entre el nivel anterior y el nuevo.
function levelDiffHtml(def, level) {
  const a = computeStats(def, level - 1), b = computeStats(def, level);
  const rows = [];
  for (const k in b) {
    if (typeof b[k] !== 'number' || a[k] === b[k]) continue;
    rows.push(`<li>${STAT_NAMES[k] || k}: ${fmtNum(a[k])} → <b>${fmtNum(b[k])}</b></li>`);
  }
  return rows.length ? `<ul>${rows.join('')}</ul>` : 'Mejora general.';
}
