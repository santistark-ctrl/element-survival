// Elementos: los "controles" base y los "subcontroles" (parent).
// Un subcontrol solo se puede desbloquear si su elemento padre ya está desbloqueado.
export const ELEMENTS = {
  // ─── Controles base ───
  fuego:      { id: 'fuego',      name: 'Fuego',      color: '#ff6b35', icon: '🔥', desc: 'Daño alto y quemaduras.' },
  agua:       { id: 'agua',       name: 'Agua',       color: '#4fc3f7', icon: '💧', desc: 'Control, empuje y enemigos mojados.' },
  tierra:     { id: 'tierra',     name: 'Tierra',     color: '#a1887f', icon: '🪨', desc: 'Golpes pesados y aturdimiento.' },
  aire:       { id: 'aire',       name: 'Viento',     color: '#cfd8dc', icon: '🌪️', desc: 'Cobertura en todas direcciones.' },
  luz:        { id: 'luz',        name: 'Luz',        color: '#fff59d', icon: '✨', desc: 'Haces y orbes que persiguen.' },
  oscuridad:  { id: 'oscuridad',  name: 'Oscuridad',  color: '#9575cd', icon: '🌑', desc: 'Atracción, dagas y maldiciones.' },
  naturaleza: { id: 'naturaleza', name: 'Naturaleza', color: '#81c784', icon: '🌿', desc: 'Trampas, raíces y esporas.' },

  // ─── Subcontroles ───
  rayo:     { id: 'rayo',     parent: 'fuego',      name: 'Rayo',     color: '#ffee58', icon: '⚡', desc: 'Cadenas y descargas. Más daño a mojados.' },
  hielo:    { id: 'hielo',    parent: 'agua',       name: 'Hielo',    color: '#80deea', icon: '❄️', desc: 'Ralentiza y congela a los mojados.' },
  sangre:   { id: 'sangre',   parent: 'agua',       name: 'Sangre',   color: '#e53935', icon: '🩸', desc: 'Roba vida con cada golpe.' },
  metal:    { id: 'metal',    parent: 'tierra',     name: 'Metal',    color: '#b0bec5', icon: '⚙️', desc: 'Cuchillas perforantes y escudos.' },
  arena:    { id: 'arena',    parent: 'tierra',     name: 'Arena',    color: '#ffe082', icon: '🏜️', desc: 'Tormentas que ralentizan.' },
  lava:     { id: 'lava',     parent: 'tierra',     name: 'Lava',     color: '#ff7043', icon: '🌋', desc: 'Charcos ardientes y erupciones.' },
  espiritu: { id: 'espiritu', parent: 'aire',       name: 'Espíritu', color: '#b2ebf2', icon: '👻', desc: 'Ataques etéreos que atraviesan todo.' },
  energia:  { id: 'energia',  parent: 'luz',        name: 'Energía',  color: '#ce93d8', icon: '🔮', desc: 'Pulsos y núcleos de energía pura.' },
  vacio:    { id: 'vacio',    parent: 'oscuridad',  name: 'Vacío',    color: '#7e57c2', icon: '🕳️', desc: 'Agujeros negros y grietas.' },
  veneno:   { id: 'veneno',   parent: 'naturaleza', name: 'Veneno',   color: '#aed581', icon: '☠️', desc: 'Daño en el tiempo que se acumula.' },
};

export const ELEMENT_LIST = Object.values(ELEMENTS);
export const BASE_ELEMENTS = ELEMENT_LIST.filter((e) => !e.parent);

// Elemento base de una rama (rayo -> fuego, metal -> tierra, fuego -> fuego).
export function familyOf(id) {
  const e = ELEMENTS[id];
  return e && e.parent ? e.parent : id;
}

// Interacciones entre elementos y estados (se aplican en powers.js -> hitEnemy()).
export const ELEMENT_INTERACTIONS = {
  rayoVsWet: 1.6,          // rayo/energía hacen +60% a mojados
  hieloFreezeOnWet: 0.7,   // hielo congela (aturde) a los mojados y consume el estado
  fuegoVsStun: 1.25,       // fuego/lava hacen +25% a aturdidos
  curseMult: 1.3,          // los malditos reciben +30% de daño
};
