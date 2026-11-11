// Logros. check(save, run) recibe las estadísticas guardadas y un resumen de la
// partida actual (ver Game.runSnapshot()). Se evalúan durante la partida y al final.
export const ACHIEVEMENTS = [
  { id: 'primer_paso',   name: 'Primer paso',        icon: '🥾', desc: 'Sobreviví 5 minutos',                        check: (s, r) => r.time >= 300 },
  { id: 'resistente',    name: 'Resistente',         icon: '🛡️', desc: 'Sobreviví 10 minutos',                       check: (s, r) => r.time >= 600 },
  { id: 'veterano',      name: 'Veterano',           icon: '⚔️', desc: 'Sobreviví 20 minutos',                       check: (s, r) => r.time >= 1200 },
  { id: 'victoria',      name: 'Victoria',           icon: '🏆', desc: 'Derrotá al jefe final de los 30 minutos',    check: (s, r) => r.won },
  { id: 'cazador',       name: 'Cazador',            icon: '🎯', desc: 'Matá 1.000 enemigos en una partida',         check: (s, r) => r.kills >= 1000 },
  { id: 'exterminador',  name: 'Exterminador',       icon: '💀', desc: 'Matá 5.000 enemigos en una partida',         check: (s, r) => r.kills >= 5000 },
  { id: 'matajefes',     name: 'Matajefes',          icon: '👑', desc: 'Derrotá un jefe',                            check: (s, r) => r.bosses >= 1 },
  { id: 'triple_corona', name: 'Triple corona',      icon: '👑', desc: 'Derrotá 3 jefes en una partida',             check: (s, r) => r.bosses >= 3 },
  { id: 'sinergia',      name: 'Alquimista',         icon: '🔮', desc: 'Desbloqueá una sinergia',                    check: (s, r) => r.synergies >= 1 },
  { id: 'trinidad',      name: 'Trinidad',           icon: '✨', desc: 'Desbloqueá una sinergia de tres elementos',  check: (s, r) => r.tripleSynergies >= 1 },
  { id: 'evolucion',     name: 'Forma definitiva',   icon: '🌟', desc: 'Evolucioná un poder al máximo',              check: (s, r) => r.evolutions >= 1 },
  { id: 'coleccionista', name: 'Coleccionista',      icon: '🎒', desc: 'Conseguí 8 ítems en una partida',            check: (s, r) => r.items >= 8 },
  { id: 'nivel30',       name: 'Nivel 30',           icon: '⭐', desc: 'Llegá a nivel 30',                           check: (s, r) => r.level >= 30 },
  { id: 'elementalista', name: 'Elementalista',      icon: '🌈', desc: 'Desbloqueá 4 elementos en una partida',      check: (s, r) => r.elements >= 4 },
  { id: 'intocable',     name: 'Intocable',          icon: '👻', desc: 'Pasá 3 minutos seguidos sin recibir daño',   check: (s, r) => r.noDamageTime >= 180 },
  { id: 'cripta',        name: 'Explorador',         icon: '🕯️', desc: 'Sobreviví 10 minutos en la Cripta',          check: (s, r) => r.map === 'cripta' && r.time >= 600 },
  { id: 'rico',          name: 'Rico',               icon: '🪙', desc: 'Acumulá 5.000 de oro en total',              check: (s) => s.gold >= 5000 },
  { id: 'habitue',       name: 'Habitué',            icon: '🎮', desc: 'Jugá 10 partidas',                           check: (s) => s.runs >= 10 },
  { id: 'todas_clases',  name: 'Maestro de todo',    icon: '🎓', desc: 'Sobreviví 10 minutos con cada clase',        check: (s) => ['fuego', 'agua', 'aire', 'tierra', 'luz', 'oscuridad'].every((c) => (s.bestTimeByClass[c] || 0) >= 600) },
  { id: 'mejorado',      name: 'Bien equipado',      icon: '🛠️', desc: 'Comprá 10 mejoras permanentes',              check: (s) => Object.values(s.upgrades || {}).reduce((a, b) => a + b, 0) >= 10 },
];
