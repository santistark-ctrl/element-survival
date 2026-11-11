// Aumentos de estadísticas que aparecen al subir de nivel (junto a poderes y
// elementos). No ocupan slot y se pueden elegir varias veces.
export const BOOSTS = {
  dano:      { id: 'dano',      name: 'Fuerza',       icon: '⚔️', weight: 10, desc: '+8% de daño',                     apply: (s) => { s.damageMult += 0.08; } },
  vida:      { id: 'vida',      name: 'Vitalidad',    icon: '❤️', weight: 10, desc: '+15% de vida máxima',             apply: (s) => { s.maxHpMult += 0.15; } },
  velocidad: { id: 'velocidad', name: 'Agilidad',     icon: '👟', weight: 7,  desc: '+6% de velocidad de movimiento',  apply: (s) => { s.speedMult += 0.06; } },
  regen:     { id: 'regen',     name: 'Recuperación', icon: '🌿', weight: 4,  desc: '+0.1 de vida por segundo',        apply: (s) => { s.regen += 0.1; } },
  corazon:   { id: 'corazon',   name: 'Corazón cálido', icon: '💗', weight: 5, desc: 'Los corazones curan +25% más',     apply: (s) => { s.heartMult += 0.25; } },
  area:      { id: 'area',      name: 'Amplitud',     icon: '🔍', weight: 8,  desc: '+8% de área de efecto',           apply: (s) => { s.areaMult += 0.08; } },
  recarga:   { id: 'recarga',   name: 'Celeridad',    icon: '⏳', weight: 8,  desc: '-5% de tiempo de recarga',        apply: (s) => { s.cooldownMult *= 0.95; } },
  armadura:  { id: 'armadura',  name: 'Coraza',       icon: '🛡️', weight: 6,  desc: '+1 de armadura',                  apply: (s) => { s.armor += 1; } },
  suerte:    { id: 'suerte',    name: 'Fortuna',      icon: '🍀', weight: 5,  desc: '+8% de suerte',                   apply: (s) => { s.luck += 0.08; } },
  iman:      { id: 'iman',      name: 'Atracción',    icon: '🧲', weight: 6,  desc: '+20% de radio de recogida',       apply: (s) => { s.pickupMult += 0.20; } },
  xp:        { id: 'xp',        name: 'Sabiduría',    icon: '📖', weight: 6,  desc: '+8% de experiencia',              apply: (s) => { s.xpMult += 0.08; } },
  proyectil: { id: 'proyectil', name: 'Puntería',     icon: '🎯', weight: 5,  desc: '+10% de velocidad de proyectiles', apply: (s) => { s.projSpeedMult += 0.10; } },
  duracion:  { id: 'duracion',  name: 'Persistencia', icon: '🕯️', weight: 5,  desc: '+8% de duración de efectos',      apply: (s) => { s.durationMult += 0.08; } },
  oro:       { id: 'oro',       name: 'Codicia',      icon: '🪙', weight: 4,  desc: '+10% de oro',                     apply: (s) => { s.goldMult += 0.10; } },
};

export const BOOST_LIST = Object.values(BOOSTS);
