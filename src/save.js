// Persistencia simple en localStorage: progreso, ajustes, estadísticas y logros.
const KEY = 'elementSurvival.save';

const DEFAULT_SETTINGS = { master: 0.8, music: 0.4, sfx: 0.8, damageNumbers: true, screenShake: true, showFps: false, pixel: false };

export class Save {
  constructor() {
    this.data = {
      gold: 0, bestTime: 0, runs: 0, totalKills: 0, bestLevel: 0, bossesKilled: 0, wins: 0, totalTime: 0,
      upgrades: {},
      killsByEnemy: {}, bestTimeByClass: {}, synergiesSeen: {}, evolutionsSeen: {}, achievements: {}, bossKillsByType: {},
      settings: { ...DEFAULT_SETTINGS },
      lastClass: 'fuego', lastMap: 'pradera',
    };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const k in this.data) {
          if (parsed[k] === undefined) continue;
          if (typeof this.data[k] === 'object' && this.data[k] !== null) this.data[k] = Object.assign({}, this.data[k], parsed[k]);
          else this.data[k] = parsed[k];
        }
      }
    } catch (_) { /* almacenamiento no disponible */ }
  }

  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (_) { /* ignorar */ }
  }

  endRun({ time, gold, kills, level, bosses, cls, won }) {
    const d = this.data;
    d.runs++;
    d.gold += gold;
    d.totalKills += kills;
    d.bossesKilled += bosses;
    d.totalTime += time;
    if (won) d.wins++;
    if (time > d.bestTime) d.bestTime = time;
    if (level > d.bestLevel) d.bestLevel = level;
    if (cls && time > (d.bestTimeByClass[cls] || 0)) d.bestTimeByClass[cls] = time;
    this.write();
  }
}
