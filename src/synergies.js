import { SYNERGIES } from './data/synergies.js';
import { EVOLUTIONS } from './data/evolutions.js';
import { POWERS } from './data/powers.js';
import { PowerInstance } from './powers.js';

// Revisa qué sinergias se cumplen y otorga los poderes evolucionados nuevos.
export function checkSynergies(game) {
  const p = game.player;
  const unlocked = [];
  for (const syn of SYNERGIES) {
    if (p.evolved.some((e) => e.def.id === syn.grants)) continue;
    const ok = syn.elements.every((el) => p.powers.some((pw) => pw.def.element === el && pw.level >= syn.minLevel));
    if (!ok) continue;
    p.addEvolved(syn.grants);
    game.activeSynergies.push(syn);
    if (syn.elements.length >= 3) game.tripleSynergies++;
    const seen = game.save.data.synergiesSeen;
    if (seen) seen[syn.id] = true;
    unlocked.push(syn);
  }
  return unlocked;
}

// Evoluciones finales: poder al máximo + ítem -> versión definitiva en el mismo slot.
export function checkEvolutions(game) {
  const p = game.player;
  const out = [];
  for (const ev of EVOLUTIONS) {
    const idx = p.powers.findIndex((pw) => pw.def.id === ev.power);
    if (idx < 0) continue;
    const pw = p.powers[idx];
    if (pw.level < pw.maxLevel) continue;
    if (!p.items.some((it) => it.id === ev.item)) continue;
    const np = new PowerInstance(game, POWERS[ev.result], 1);
    p.powers[idx] = np;
    p.evolvedFrom.add(ev.power);
    p.evolutionsDone++;
    const seen = game.save.data.evolutionsSeen;
    if (seen) seen[ev.result] = true;
    out.push({ from: pw.def, to: np.def });
  }
  return out;
}

// Progreso de sinergias (para pausa y compendio).
export function synergyProgress(game) {
  const p = game.player;
  return SYNERGIES.map((syn) => {
    const active = p.evolved.some((e) => e.def.id === syn.grants);
    const have = syn.elements.map((el) => {
      const best = p.powers.filter((pw) => pw.def.element === el).reduce((m, pw) => Math.max(m, pw.level), 0);
      return { el, level: best, need: syn.minLevel };
    });
    return { syn, active, have };
  });
}
