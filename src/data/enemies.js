// Enemigos. Vienen en enjambres grandes: poca vida individual, poca XP cada uno.
// Sus estadísticas escalan con el tiempo (ver Game.difficulty()).
//
// shape: orb | blob | wings | ghost | square | tri | spider | eye | skull | star | crystal | worm | demon | beetle | mushroom | jelly
// Comportamientos opcionales:
//   ghost: true                        atraviesa (visual translúcido)
//   armor: n                           reduce n de daño por golpe
//   dash: { cd, speed, dur, range }    embiste al jugador
//   shoot: { cd, speed, dmg, range, count, spread }  dispara proyectiles
//   summon: { type, count, every }     invoca (jefes)
//   ring: true / spikes: n             detalles visuales de las esferas
export const ENEMY_TYPES = {
  // ─── Esferas (estilo Magic Survival) ───
  orbe_azul:     { name: 'Esfera azul',     hp: 8,   speed: 95,  damage: 4,  size: 14, xp: 0.4, color: '#2979ff', shape: 'orb', eyeColor: '#ffffff' },
  orbe_verde:    { name: 'Esfera verde',    hp: 16,  speed: 75,  damage: 6,  size: 17, xp: 0.8, color: '#43a047', shape: 'orb' },
  orbe_rojo:     { name: 'Esfera roja',     hp: 20,  speed: 130, damage: 8,  size: 16, xp: 1.2, color: '#e53935', shape: 'orb', spikes: 8 },
  orbe_violeta:  { name: 'Esfera violeta',  hp: 18,  speed: 65,  damage: 7,  size: 17, xp: 1.2, color: '#8e24aa', shape: 'orb', ring: true,
                   shoot: { cd: 2.8, speed: 200, dmg: 6, range: 380, count: 1 } },
  orbe_dorado:   { name: 'Esfera dorada',   hp: 60,  speed: 55,  damage: 12, size: 24, xp: 2.5, color: '#ffb300', shape: 'orb', ring: true, spikes: 6 },
  orbe_negro:    { name: 'Esfera negra',    hp: 120, speed: 45,  damage: 18, size: 32, xp: 4,   color: '#37474f', shape: 'orb', ring: true, armor: 2, eyeColor: '#ff1744' },
  esfera_gemela: { name: 'Esfera gemela',   hp: 26,  speed: 85,  damage: 8,  size: 18, xp: 1.6, color: '#00acc1', shape: 'orb', ring: true },

  // ─── Monstruos ───
  limo:       { name: 'Limo',        hp: 9,   speed: 65,  damage: 5,  size: 17, xp: 0.4, color: '#7cb342', shape: 'blob' },
  larva:      { name: 'Larva',       hp: 5,   speed: 110, damage: 3,  size: 11, xp: 0.3, color: '#c0ca33', shape: 'worm' },
  murcielago: { name: 'Murciélago',  hp: 6,   speed: 150, damage: 4,  size: 12, xp: 0.4, color: '#795548', shape: 'wings' },
  arana:      { name: 'Araña',       hp: 16,  speed: 95,  damage: 8,  size: 14, xp: 0.8, color: '#4e342e', shape: 'spider' },
  hongo:      { name: 'Hongo',       hp: 24,  speed: 40,  damage: 7,  size: 17, xp: 1.2, color: '#ab47bc', shape: 'mushroom',
                shoot: { cd: 3.2, speed: 150, dmg: 5, range: 340, count: 3, spread: 50 } },
  lobo:       { name: 'Lobo',        hp: 26,  speed: 120, damage: 12, size: 17, xp: 1.2, color: '#a1887f', shape: 'tri',
                dash: { cd: 3.5, speed: 380, dur: 0.4, range: 320 } },
  serpiente:  { name: 'Serpiente',   hp: 20,  speed: 135, damage: 10, size: 14, xp: 1.2, color: '#2e7d32', shape: 'worm' },
  espectro:   { name: 'Espectro',    hp: 20,  speed: 105, damage: 10, size: 17, xp: 1.2, color: '#9575cd', shape: 'ghost', ghost: true },
  ojo:        { name: 'Ojo errante', hp: 30,  speed: 60,  damage: 9,  size: 18, xp: 1.6, color: '#d81b60', shape: 'eye',
                shoot: { cd: 2.4, speed: 240, dmg: 7, range: 420, count: 1 } },
  calavera:   { name: 'Calavera',    hp: 22,  speed: 140, damage: 11, size: 15, xp: 1.6, color: '#e0e0e0', shape: 'skull', eyeColor: '#69f0ae' },
  medusa:     { name: 'Medusa',      hp: 45,  speed: 50,  damage: 10, size: 23, xp: 2,   color: '#26c6da', shape: 'jelly' },
  estrella:   { name: 'Estrella',    hp: 36,  speed: 90,  damage: 12, size: 17, xp: 2,   color: '#fdd835', shape: 'star' },
  golem:      { name: 'Gólem',       hp: 80,  speed: 42,  damage: 18, size: 28, xp: 2.5, color: '#78909c', shape: 'square', armor: 1, eyeColor: '#ffb300' },
  escarabajo: { name: 'Escarabajo',  hp: 60,  speed: 70,  damage: 13, size: 20, xp: 2.5, color: '#1565c0', shape: 'beetle', armor: 3 },
  cristal:    { name: 'Cristal',     hp: 90,  speed: 55,  damage: 16, size: 23, xp: 3,   color: '#4dd0e1', shape: 'crystal', armor: 2 },
  sombra:     { name: 'Sombra',      hp: 40,  speed: 150, damage: 14, size: 17, xp: 2.5, color: '#4527a0', shape: 'ghost', ghost: true, eyeColor: '#ea80fc' },
  gargola:    { name: 'Gárgola',     hp: 75,  speed: 95,  damage: 18, size: 22, xp: 3,   color: '#607d8b', shape: 'wings', eyeColor: '#ffab40',
                dash: { cd: 4, speed: 420, dur: 0.45, range: 380 } },
  demonio:    { name: 'Demonio',     hp: 130, speed: 80,  damage: 24, size: 27, xp: 5,   color: '#c62828', shape: 'demon',
                shoot: { cd: 3.5, speed: 240, dmg: 12, range: 450, count: 3, spread: 40 } },
};

// Jefes. Aparecen cada 10 minutos y sueltan un cofre mítico y un orbe rojo.
export const BOSSES = {
  titan_roca:       { name: 'Titán de Roca',    hp: 2500, speed: 70,  damage: 35, size: 66, xp: 60,  color: '#78909c', shape: 'square', armor: 3, eyeColor: '#ffb300',
                      dash: { cd: 6, speed: 300, dur: 0.6, range: 500 } },
  reina_murcielago: { name: 'Reina Murciélago', hp: 3200, speed: 130, damage: 30, size: 55, xp: 80,  color: '#5d4037', shape: 'wings',
                      summon: { type: 'murcielago', count: 8, every: 7 } },
  ojo_ancestral:    { name: 'Ojo Ancestral',    hp: 3800, speed: 60,  damage: 30, size: 60, xp: 100, color: '#d81b60', shape: 'eye',
                      shoot: { cd: 1.8, speed: 280, dmg: 14, range: 600, count: 5, spread: 70 } },
  coloso_espectral: { name: 'Coloso Espectral', hp: 4500, speed: 90,  damage: 45, size: 76, xp: 120, color: '#7e57c2', shape: 'ghost', ghost: true, eyeColor: '#ea80fc',
                      summon: { type: 'espectro', count: 5, every: 9 } },
  orbe_primordial:  { name: 'Esfera Primordial', hp: 5500, speed: 75, damage: 40, size: 80, xp: 140, color: '#ffb300', shape: 'orb', ring: true, spikes: 10,
                      summon: { type: 'orbe_rojo', count: 6, every: 7 }, shoot: { cd: 2.5, speed: 220, dmg: 15, range: 520, count: 8, spread: 360 } },
  // Jefe final de los 30 minutos: al matarlo se gana la partida.
  avatar_ruina:     { name: 'Avatar de la Ruina', hp: 16000, speed: 85, damage: 55, size: 92, xp: 500, color: '#263238', shape: 'demon', eyeColor: '#ff1744', armor: 4, final: true,
                      summon: { type: 'demonio', count: 2, every: 12 }, shoot: { cd: 2.2, speed: 260, dmg: 18, range: 650, count: 6, spread: 90 },
                      dash: { cd: 7, speed: 320, dur: 0.7, range: 600 } },
};
