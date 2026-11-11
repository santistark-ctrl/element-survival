// Clases iniciales. Cada una empieza con su elemento desbloqueado y un poder
// aleatorio de ese elemento, y potencia toda su rama (elemento + subcontroles).
export const CLASSES = {
  fuego: {
    id: 'fuego', name: 'Maestro del Fuego', element: 'fuego',
    desc: 'Agresivo. Sus llamas y rayos hacen más daño.',
    bonus: { damage: 0.20, cooldown: 0.90 },
    stats: { damageMult: 0.05 },
    look: { cloth: '#b71c1c', accent: '#ff6b35', trim: '#ffab40', feature: 'flames' },
    skill: { id: 'estallido', name: 'Estallido ígneo', icon: '💥', cd: 18, desc: 'Explosión de fuego alrededor que quema.' },
  },
  agua: {
    id: 'agua', name: 'Maestra del Agua', element: 'agua',
    desc: 'Resistente. Más vida, armadura y control del campo.',
    bonus: { damage: 0.15, cooldown: 0.90 },
    stats: { maxHp: 25, armor: 1 },
    look: { cloth: '#0d47a1', accent: '#4fc3f7', trim: '#b3e5fc', feature: 'sash' },
    skill: { id: 'marea', name: 'Marea curativa', icon: '🌊', cd: 24, desc: 'Curás 20% de vida y una ola empuja a los enemigos.' },
  },
  aire: {
    id: 'aire', name: 'Nómada del Viento', element: 'aire',
    desc: 'Rápido. Se mueve y recoge orbes desde más lejos.',
    bonus: { damage: 0.15, cooldown: 0.85 },
    stats: { speedMult: 0.12, pickupMult: 0.2 },
    look: { cloth: '#ffb74d', accent: '#cfd8dc', trim: '#fff3e0', feature: 'staff' },
    skill: { id: 'rafaga_veloz', name: 'Ráfaga', icon: '💨', cd: 7, desc: 'Un dash rápido e invulnerable hacia donde mirás.' },
  },
  tierra: {
    id: 'tierra', name: 'Maestro de la Tierra', element: 'tierra',
    desc: 'Tanque. Más vida y armadura, golpes que aturden.',
    bonus: { damage: 0.20, cooldown: 0.95 },
    stats: { maxHp: 30, armor: 2 },
    look: { cloth: '#5d4037', accent: '#a1887f', trim: '#8bc34a', feature: 'pads' },
    skill: { id: 'muralla', name: 'Muralla de piedra', icon: '🧱', cd: 24, desc: '3 segundos invulnerable y aturdís a los enemigos cercanos.' },
  },
  luz: {
    id: 'luz', name: 'Acólita de la Luz', element: 'luz',
    desc: 'Afortunada. Mejores rarezas y más experiencia.',
    bonus: { damage: 0.15, cooldown: 0.90 },
    stats: { luck: 0.15, xpMult: 0.10 },
    look: { cloth: '#fafafa', accent: '#fff59d', trim: '#ffd54f', feature: 'halo' },
    skill: { id: 'destello_cegador', name: 'Destello cegador', icon: '🌞', cd: 24, desc: 'Aturde a todos los enemigos en pantalla durante 2 segundos.' },
  },
  oscuridad: {
    id: 'oscuridad', name: 'Acólito de la Oscuridad', element: 'oscuridad',
    desc: 'Vampírico. Roba vida y atrae a los enemigos.',
    bonus: { damage: 0.20, cooldown: 0.90 },
    stats: { lifesteal: 0.02, curse: 0.1 },
    look: { cloth: '#311b92', accent: '#9575cd', trim: '#ea80fc', feature: 'hood' },
    skill: { id: 'paso_sombrio', name: 'Paso sombrío', icon: '🌑', cd: 14, desc: 'Te teletransportás hacia adelante y maldecís a los enemigos que dejás atrás.' },
  },
};

export const CLASS_LIST = Object.values(CLASSES);
