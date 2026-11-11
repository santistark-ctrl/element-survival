import { CONFIG } from './config.js';
import { POWERS } from './data/powers.js';
import { ITEMS } from './data/items.js';
import { ELEMENTS } from './data/elements.js';
import { BOOST_LIST } from './data/boosts.js';
import { RARITIES, rarityTier } from './data/rarities.js';
import { weightedChoice } from './utils.js';
import { checkSynergies } from './synergies.js';

function itemWeight(def, luck) {
  const r = RARITIES[def.rarity];
  const tier = rarityTier(def.rarity);
  // la suerte favorece las rarezas altas de forma progresiva
  return tier === 0 ? r.weight : r.weight * (1 + luck * (0.5 + tier * 0.5));
}

// ─── Subida de nivel: poderes, elementos y aumentos de stats (sin ítems) ───
export function generateOptions(game, n = 3) {
  const p = game.player;
  const pool = [];

  for (const id in POWERS) {
    const def = POWERS[id];
    if (def.evolved || !p.hasElement(def.element) || p.evolvedFrom.has(id)) continue;
    const ex = p.powers.find((x) => x.def.id === id);
    if (ex) {
      if (ex.level < ex.maxLevel) pool.push({ type: 'power', id, isNew: false, level: ex.level + 1, weight: 12 });
    } else if (p.powers.length < CONFIG.player.maxPowers) {
      pool.push({ type: 'power', id, isNew: true, level: 1, weight: 10 });
    }
  }
  // desbloqueo de elementos: entre todos suman un peso fijo (un poco más alto si tenés pocos)
  const unlockable = Object.keys(ELEMENTS).filter((id) => p.canUnlockElement(id));
  const elementWeight = p.elements.size < 2 ? 26 : 20;
  for (const id of unlockable) pool.push({ type: 'element', id, weight: elementWeight / unlockable.length });
  // aumentos de stats: entre todos pesan como ~2 poderes
  const totalBoost = BOOST_LIST.reduce((a, b) => a + b.weight, 0);
  for (const b of BOOST_LIST) pool.push({ type: 'stat', id: b.id, weight: (24 * b.weight) / totalBoost });

  const out = [];
  const pick = (candidates) => {
    const c = weightedChoice(candidates, (o) => o.weight);
    pool.splice(pool.indexOf(c), 1);
    // solo una carta de elemento y máximo dos de stats por oferta
    if (c.type === 'element') for (let i = pool.length - 1; i >= 0; i--) if (pool[i].type === 'element') pool.splice(i, 1);
    if (c.type === 'stat' && out.filter((o) => o.type === 'stat').length >= 1) for (let i = pool.length - 1; i >= 0; i--) if (pool[i].type === 'stat') pool.splice(i, 1);
    out.push(c);
  };
  // garantizar al menos una opción de poder/elemento si existe
  const nonStat = pool.filter((o) => o.type !== 'stat');
  if (nonStat.length) pick(nonStat);
  while (out.length < n && pool.length) pick(pool);
  if (!out.length) {
    out.push({ type: 'gold', amount: 50 });
    out.push({ type: 'heal' });
  }
  return out;
}

// ─── Cofres: 3 o 4 ítems a elegir, con rareza mínima según el cofre ───
const CHEST_MIN_TIER = { gris: 0, verde: 0, azul: 1, morado: 2, dorado: 3, rojo: 4, blanco: 5 };
const CHEST_OPTIONS = { gris: 3, verde: 3, azul: 3, morado: 3, dorado: 4, rojo: 4, blanco: 4 };

export function generateChestOptions(game, rarity) {
  const p = game.player;
  const luck = p.stats.luck;
  const n = CHEST_OPTIONS[rarity] || 3;
  const build = (minTier) => {
    const pool = [];
    for (const id in ITEMS) {
      const def = ITEMS[id];
      if (rarityTier(def.rarity) < minTier) continue;
      const weight = itemWeight(def, luck);
      const ex = p.items.find((x) => x.id === id);
      if (ex) {
        if (ex.level < def.maxLevel) pool.push({ type: 'item', id, isNew: false, level: ex.level + 1, rarity: def.rarity, weight });
      } else if (p.items.length < CONFIG.player.maxItems) {
        pool.push({ type: 'item', id, isNew: true, level: 1, rarity: def.rarity, weight });
      }
    }
    return pool;
  };
  // baja la rareza mínima hasta juntar suficientes opciones
  let pool = [];
  for (let t = CHEST_MIN_TIER[rarity] || 0; t >= 0; t--) { pool = build(t); if (pool.length >= n) break; }
  const out = [];
  while (out.length < n && pool.length) {
    const c = weightedChoice(pool, (o) => o.weight);
    pool.splice(pool.indexOf(c), 1);
    out.push(c);
  }
  // sin ítems posibles (slots llenos y todo al máximo): mejoras de poder
  if (!out.length) {
    for (const pw of p.powers) if (pw.level < pw.maxLevel && out.length < n) out.push({ type: 'power', id: pw.def.id, isNew: false, level: pw.level + 1 });
  }
  if (!out.length) out.push({ type: 'gold', amount: 100 }, { type: 'heal' });
  return out;
}

// Bonificaciones fijas de los cofres altos (además de la opción elegida).
export function chestBonus(rarity) {
  if (rarity === 'blanco') return { heal: true, gold: 300 };
  if (rarity === 'rojo') return { heal: true, gold: 150 };
  if (rarity === 'dorado') return { heal: false, gold: 60 };
  return null;
}

// Aplica una opción elegida y devuelve las sinergias desbloqueadas (si hubo).
export function applyOption(game, opt) {
  const p = game.player;
  if (opt.type === 'power') { p.addPower(opt.id); return checkSynergies(game); }
  if (opt.type === 'element') {
    p.unlockElement(opt.id);
    game.ui.announce(`Elemento desbloqueado: ${ELEMENTS[opt.id].name}`, ELEMENTS[opt.id].color, 2.5);
    return [];
  }
  if (opt.type === 'stat') { p.addBoost(opt.id); return []; }
  if (opt.type === 'item') { p.addItem(opt.id); return []; }
  if (opt.type === 'gold') { p.gold += opt.amount; return []; }
  if (opt.type === 'heal') { p.heal(p.stats.maxHp * 0.3); return []; }
  return [];
}
