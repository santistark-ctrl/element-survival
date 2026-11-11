// Mapas infinitos. Entre mapas solo cambia el fondo y los enemigos.
//   roster: pares de enemigos por tramo de 2,5 minutos (CONFIG.enemies.rotationSec).
//           Cuando se acaban los tramos, se repiten los últimos `loopFrom` con más dificultad.
//   bosses: lista de jefes que se rotan cada 10 minutos.
export const MAPS = [
  {
    id: 'pradera',
    name: 'Pradera Olvidada',
    desc: 'Campo abierto. Limos, orbes y bestias del bosque.',
    colors: { bg: '#2c5636', patch: '#274c30', patch2: '#33613c', decor: '#3f7c4a', decor2: '#8bc34a', flower: '#ffeb3b', flower2: '#f48fb1', stone: '#6b7b68', water: '#1f4f6b' },
    decorStyle: 'grass',
    darkness: 0.5,
    roster: [
      ['orbe_azul', 'limo'],
      ['murcielago', 'larva'],
      ['orbe_verde', 'arana'],
      ['lobo', 'orbe_rojo'],
      ['hongo', 'serpiente'],
      ['espectro', 'orbe_violeta'],
      ['golem', 'calavera'],
      ['orbe_dorado', 'escarabajo'],
      ['estrella', 'medusa'],
      ['demonio', 'sombra'],
      ['orbe_negro', 'gargola'],
    ],
    loopFrom: 6,
    bosses: ['titan_roca', 'reina_murcielago', 'ojo_ancestral', 'orbe_primordial'],
  },
  {
    id: 'cripta',
    name: 'Cripta Sombría',
    desc: 'Piedra fría y niebla. Espectros, calaveras y demonios.',
    colors: { bg: '#221f2c', patch: '#1c1926', patch2: '#2a2637', decor: '#3d3752', decor2: '#6b6384', flower: '#9575cd' },
    decorStyle: 'stone',
    darkness: 0.75,
    roster: [
      ['murcielago', 'larva'],
      ['espectro', 'orbe_azul'],
      ['calavera', 'arana'],
      ['orbe_violeta', 'sombra'],
      ['ojo', 'medusa'],
      ['cristal', 'orbe_dorado'],
      ['gargola', 'estrella'],
      ['demonio', 'orbe_negro'],
    ],
    loopFrom: 4,
    bosses: ['coloso_espectral', 'ojo_ancestral', 'reina_murcielago', 'orbe_primordial'],
  },
];
