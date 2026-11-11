// Rarezas de ítems. `weight` es el peso relativo al sortear (más alto = más común).
export const RARITIES = {
  gris:   { id: 'gris',   name: 'Muy común',  color: '#b0bec5', weight: 40 },
  verde:  { id: 'verde',  name: 'Común',      color: '#66bb6a', weight: 28 },
  azul:   { id: 'azul',   name: 'Raro',       color: '#42a5f5', weight: 16 },
  morado: { id: 'morado', name: 'Épico',      color: '#ab47bc', weight: 9 },
  dorado: { id: 'dorado', name: 'Legendario', color: '#ffca28', weight: 4.5 },
  rojo:   { id: 'rojo',   name: 'Mítico',     color: '#ef5350', weight: 2 },
  blanco: { id: 'blanco', name: 'Divino',     color: '#ffffff', weight: 0.5 },
};

export const RARITY_LIST = Object.values(RARITIES);
export const rarityTier = (id) => RARITY_LIST.findIndex((r) => r.id === id);

// Rareza del cofre que sueltan los enemigos de élite.
export const ELITE_CHEST_WEIGHTS = { verde: 35, azul: 40, morado: 20, dorado: 5 };

// Colores de los orbes de experiencia.
export const ORB_COLORS = { azul: '#42a5f5', morado: '#ab47bc', dorado: '#ffca28', rojo: '#ef5350' };
export const ORB_NAMES = { azul: 'chico', morado: 'mediano', dorado: 'grande', rojo: 'muy grande' };
