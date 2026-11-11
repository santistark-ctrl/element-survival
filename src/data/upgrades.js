// Mejoras permanentes que se compran con el oro acumulado entre partidas.
// Se aplican a las estadísticas base del jugador al empezar cada partida.
//   cost(level) = base * growth^level   (level = nivel ya comprado)
export const UPGRADES = {
  vitalidad:    { id: 'vitalidad',    name: 'Vitalidad',     icon: '❤️', max: 10, base: 80,  growth: 1.45, desc: (l) => `+${10 * l} de vida máxima`,          apply: (s, l) => { s.maxHp += 10 * l; } },
  fuerza:       { id: 'fuerza',       name: 'Fuerza',        icon: '⚔️', max: 10, base: 120, growth: 1.45, desc: (l) => `+${4 * l}% de daño`,                   apply: (s, l) => { s.damageMult += 0.04 * l; } },
  agilidad:     { id: 'agilidad',     name: 'Agilidad',      icon: '👟', max: 5,  base: 100, growth: 1.5,  desc: (l) => `+${3 * l}% de velocidad`,              apply: (s, l) => { s.speedMult += 0.03 * l; } },
  regeneracion: { id: 'regeneracion', name: 'Regeneración',  icon: '🌿', max: 5,  base: 200, growth: 1.6,  desc: (l) => `+${(0.05 * l).toFixed(2)} de vida por segundo`, apply: (s, l) => { s.regen += 0.05 * l; } },
  corazones:    { id: 'corazones',    name: 'Corazones',     icon: '💗', max: 5,  base: 150, growth: 1.5,  desc: (l) => `Los corazones curan +${5 * l}% más`, apply: (s, l) => { s.heartMult += 0.05 * l; } },
  armadura:     { id: 'armadura',     name: 'Armadura',      icon: '🛡️', max: 5,  base: 200, growth: 1.5,  desc: (l) => `+${l} de armadura`,                    apply: (s, l) => { s.armor += l; } },
  area:         { id: 'area',         name: 'Amplitud',      icon: '🔍', max: 5,  base: 150, growth: 1.5,  desc: (l) => `+${4 * l}% de área`,                   apply: (s, l) => { s.areaMult += 0.04 * l; } },
  recarga:      { id: 'recarga',      name: 'Celeridad',     icon: '⏳', max: 5,  base: 180, growth: 1.5,  desc: (l) => `-${3 * l}% de recarga`,                apply: (s, l) => { s.cooldownMult *= 1 - 0.03 * l; } },
  suerte:       { id: 'suerte',       name: 'Suerte',        icon: '🍀', max: 5,  base: 200, growth: 1.5,  desc: (l) => `+${5 * l}% de suerte`,                 apply: (s, l) => { s.luck += 0.05 * l; } },
  sabiduria:    { id: 'sabiduria',    name: 'Sabiduría',     icon: '📖', max: 5,  base: 180, growth: 1.5,  desc: (l) => `+${5 * l}% de experiencia`,            apply: (s, l) => { s.xpMult += 0.05 * l; } },
  codicia:      { id: 'codicia',      name: 'Codicia',       icon: '🪙', max: 5,  base: 150, growth: 1.5,  desc: (l) => `+${10 * l}% de oro`,                   apply: (s, l) => { s.goldMult += 0.10 * l; } },
  iman:         { id: 'iman',         name: 'Imán',          icon: '🧲', max: 5,  base: 100, growth: 1.5,  desc: (l) => `+${10 * l}% de radio de recogida`,     apply: (s, l) => { s.pickupMult += 0.10 * l; } },
  reroll:       { id: 'reroll',       name: 'Segunda opinión', icon: '🎲', max: 3, base: 400, growth: 1.8, desc: (l) => `+${l} reroll por partida`,             apply: (s, l) => { s.rerolls += l; } },
  revivir:      { id: 'revivir',      name: 'Segunda vida',  icon: '🕊️', max: 1,  base: 1500, growth: 1,   desc: () => `Revivís una vez por partida`,           apply: (s, l) => { s.revives += l; } },
};

export const UPGRADE_LIST = Object.values(UPGRADES);
export const upgradeCost = (def, level) => Math.round(def.base * Math.pow(def.growth, level));
