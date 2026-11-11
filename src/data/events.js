// Eventos de mapa: cada pocos minutos pasa algo durante un rato.
export const EVENTS = {
  meteoros:     { id: 'meteoros',     name: 'Lluvia de meteoros', icon: '☄️', dur: 25, color: '#ff6b35', desc: 'Caen meteoros que dañan a enemigos y a vos: mirá los círculos.' },
  niebla:       { id: 'niebla',       name: 'Niebla espesa',      icon: '🌫️', dur: 30, color: '#b0bec5', desc: 'La visión se reduce.' },
  hora_dorada:  { id: 'hora_dorada',  name: 'Hora dorada',        icon: '🪙', dur: 30, color: '#ffd54f', desc: 'Doble oro y más monedas.' },
  oleada:       { id: 'oleada',       name: 'Oleada',             icon: '👾', dur: 25, color: '#ff8a65', desc: 'Una marea de un solo tipo de enemigo.' },
  lluvia_gemas: { id: 'lluvia_gemas', name: 'Lluvia de gemas',    icon: '💎', dur: 20, color: '#42a5f5', desc: 'Aparecen muchas más gemas de experiencia.' },
  frenesi:      { id: 'frenesi',      name: 'Frenesí',            icon: '⚡', dur: 25, color: '#ffee58', desc: 'Los enemigos son más rápidos pero dan +50% de XP.' },
};
export const EVENT_LIST = Object.values(EVENTS);

// Modificadores de élite.
export const ELITE_MODS = {
  veloz:       { id: 'veloz',       name: 'Veloz',       color: '#40c4ff', speed: 1.6 },
  blindado:    { id: 'blindado',    name: 'Blindado',    color: '#cfd8dc', armor: 4, hp: 1.6, size: 1.15 },
  explosivo:   { id: 'explosivo',   name: 'Explosivo',   color: '#ff7043' },
  invocador:   { id: 'invocador',   name: 'Invocador',   color: '#ab47bc', summon: { count: 3, every: 6 } },
  regenerador: { id: 'regenerador', name: 'Regenerador', color: '#69f0ae', regen: 0.02 },
};
export const ELITE_MOD_LIST = Object.values(ELITE_MODS);
