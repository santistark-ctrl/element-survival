// Sinergias de ítems: tener los dos ítems activa un efecto extra.
//   apply(stats)         modifica stats del jugador
//   flags: [...]         banderas que leen otros sistemas (proyectiles, estados, revivir)
//   powerMod(s, def)     modifica las stats de cada poder
export const ITEM_SYNERGIES = [
  { id: 'metralla',      name: 'Metralla',           items: ['prisma', 'polvora'],                desc: 'Los fragmentos de los proyectiles también explotan.', flags: ['splitExplode'] },
  { id: 'ricochet',      name: 'Ricochet',           items: ['espejo_rebote', 'ojo_halcon'],      desc: 'Los proyectiles rebotan dos veces más.', powerMod: (s, d) => { if (d.kind === 'projectile') s.pierce += 2; } },
  { id: 'incendio',      name: 'Incendio',           items: ['brasa_eterna', 'nucleo_igneo'],     desc: 'Las quemaduras se contagian a los enemigos cercanos.', flags: ['burnSpread'] },
  { id: 'toxina',        name: 'Toxina paralizante', items: ['veneno_concentrado', 'amuleto_raiz'], desc: 'El veneno también ralentiza.', flags: ['poisonSlow'] },
  { id: 'hemofagia',     name: 'Hemofagia',          items: ['piedra_sangre', 'tomate'],          desc: 'El robo de vida se duplica.', apply: (s) => { s.lifesteal *= 2; } },
  { id: 'destino',       name: 'Destino',            items: ['trebol', 'corona'],                 desc: '+20% de suerte y +10% de experiencia.', apply: (s) => { s.luck += 0.2; s.xpMult += 0.1; } },
  { id: 'zancada',       name: 'Zancada',            items: ['alas', 'botas_grandes'],            desc: '+15% de velocidad y +10% de área.', apply: (s) => { s.speedMult += 0.15; s.areaMult += 0.1; } },
  { id: 'andanada',      name: 'Andanada',           items: ['duplicador', 'brazalete'],          desc: '+1 proyectil y +20% de velocidad de proyectiles.', apply: (s) => { s.extraProjectiles += 1; s.projSpeedMult += 0.2; } },
  { id: 'eternidad',     name: 'Eternidad',          items: ['reloj_congelado', 'encuadernador'], desc: 'Los estados duran +50% más.', apply: (s) => { s.statusDurMult += 0.5; } },
  { id: 'renacer',       name: 'Renacer',            items: ['tiragisu', 'pluma_fenix'],          desc: 'Al revivir volvés con toda la vida y 5 segundos de invulnerabilidad.', flags: ['reviveFull'] },
  { id: 'pacto_oscuro',  name: 'Pacto oscuro',       items: ['calavera_maniaca', 'sello_maldito'], desc: '+30% de daño adicional.', apply: (s) => { s.damageMult += 0.3; } },
  { id: 'resonancia',    name: 'Resonancia',         items: ['catalizador', 'candelabro'],        desc: '+15% de área y las auras golpean más seguido.', apply: (s) => { s.areaMult += 0.15; }, powerMod: (s, d) => { if (d.kind === 'aura') s.tick *= 0.8; } },
  { id: 'fortaleza',     name: 'Fortaleza',          items: ['armadura', 'estatua_guardian'],     desc: '+3 de armadura y +20% de vida máxima.', apply: (s) => { s.armor += 3; s.maxHpMult += 0.2; } },
  { id: 'avaricia',      name: 'Avaricia',           items: ['mascara_piedra', 'talisman_suerte'], desc: '+50% de oro.', apply: (s) => { s.goldMult += 0.5; } },
];
