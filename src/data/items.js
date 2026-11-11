// Ítems. Dos categorías:
//   'stat'  -> apply(stats, level) modifica las estadísticas del jugador.
//   'power' -> powerMod(s, def, level) modifica las estadísticas de cada poder
//              (s = stats del poder ya calculadas, def = definición del poder).
//              Puede activar banderas en s.flags: split, bounce, explode.
//
// Estadísticas del jugador disponibles en `stats`:
//   damageMult, speedMult, maxHp, regen, areaMult, cooldownMult, pickupMult, armor, luck,
//   xpMult, durationMult, extraProjectiles, projSpeedMult, knockbackMult, goldMult, curse,
//   lifesteal, revives, rerolls, orbValueMult, statusDurMult, powerLevelBonus, slowAura
import { familyOf } from './elements.js';

const fam = (def, ...fams) => fams.includes(familyOf(def.element));
const el = (def, ...els) => els.includes(def.element);
const pct = (v) => `${Math.round(v * 100)}%`;

export const ITEMS = {
  // ═══════════ STATS (inspirados en Vampire Survivors) ═══════════
  espinaca:        { id: 'espinaca', name: 'Espinaca', icon: '🥬', rarity: 'gris', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de daño`, apply: (s, l) => { s.damageMult += 0.10 * l; } },
  armadura:        { id: 'armadura', name: 'Armadura', icon: '🛡️', rarity: 'gris', maxLevel: 5, category: 'stat',
    desc: (l) => `+${l} de armadura (reduce el daño recibido)`, apply: (s, l) => { s.armor += l; } },
  corazon_hueco:   { id: 'corazon_hueco', name: 'Corazón hueco', icon: '🫀', rarity: 'gris', maxLevel: 5, category: 'stat',
    desc: (l) => `+${20 * l}% de vida máxima`, apply: (s, l) => { s.maxHpMult += 0.20 * l; } },
  alas:            { id: 'alas', name: 'Alas', icon: '🪽', rarity: 'gris', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de velocidad de movimiento`, apply: (s, l) => { s.speedMult += 0.10 * l; } },
  tomate:          { id: 'tomate', name: 'Tomate', icon: '🍅', rarity: 'verde', maxLevel: 5, category: 'stat',
    desc: (l) => `+${(0.1 * l).toFixed(1)} de vida por segundo`, apply: (s, l) => { s.regen += 0.1 * l; } },
  tomo_vacio:      { id: 'tomo_vacio', name: 'Tomo vacío', icon: '📕', rarity: 'verde', maxLevel: 5, category: 'stat',
    desc: (l) => `-${8 * l}% de tiempo de recarga`, apply: (s, l) => { s.cooldownMult *= 1 - 0.08 * l; } },
  candelabro:      { id: 'candelabro', name: 'Candelabro', icon: '🕯️', rarity: 'verde', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de área de efecto`, apply: (s, l) => { s.areaMult += 0.10 * l; } },
  brazalete:       { id: 'brazalete', name: 'Brazalete', icon: '📿', rarity: 'verde', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de velocidad de proyectiles`, apply: (s, l) => { s.projSpeedMult += 0.10 * l; } },
  orbe_atractor:   { id: 'orbe_atractor', name: 'Orbe atractor', icon: '🔮', rarity: 'verde', maxLevel: 5, category: 'stat',
    desc: (l) => `+${30 * l}% de radio de recogida`, apply: (s, l) => { s.pickupMult += 0.30 * l; } },
  mascara_piedra:  { id: 'mascara_piedra', name: 'Máscara de piedra', icon: '🗿', rarity: 'verde', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de oro obtenido`, apply: (s, l) => { s.goldMult += 0.10 * l; } },
  encuadernador:   { id: 'encuadernador', name: 'Encuadernador', icon: '📗', rarity: 'azul', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de duración de efectos`, apply: (s, l) => { s.durationMult += 0.10 * l; } },
  trebol:          { id: 'trebol', name: 'Trébol', icon: '🍀', rarity: 'azul', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de suerte (mejores rarezas)`, apply: (s, l) => { s.luck += 0.10 * l; } },
  corona:          { id: 'corona', name: 'Corona', icon: '👑', rarity: 'azul', maxLevel: 5, category: 'stat',
    desc: (l) => `+${8 * l}% de experiencia`, apply: (s, l) => { s.xpMult += 0.08 * l; } },
  duplicador:      { id: 'duplicador', name: 'Duplicador', icon: '🪞', rarity: 'morado', maxLevel: 2, category: 'stat',
    desc: (l) => `+${l} proyectil a todos los poderes de proyectiles`, apply: (s, l) => { s.extraProjectiles += l; } },
  calavera_maniaca:{ id: 'calavera_maniaca', name: 'Calavera maníaca', icon: '💀', rarity: 'morado', maxLevel: 5, category: 'stat',
    desc: (l) => `+${10 * l}% de maldición (más enemigos, más fuertes) y +${5 * l}% de experiencia`, apply: (s, l) => { s.curse += 0.10 * l; s.xpMult += 0.05 * l; } },
  tiragisu:        { id: 'tiragisu', name: 'Tiragisú', icon: '🍰', rarity: 'dorado', maxLevel: 2, category: 'stat',
    desc: (l) => `Revivís ${l} ${l === 1 ? 'vez' : 'veces'} con la mitad de la vida`, apply: (s, l) => { s.revives += l; } },

  // ═══════════ STATS (estilo Magic Survival) ═══════════
  botas_grandes:   { id: 'botas_grandes', name: 'Botas grandes', icon: '👢', rarity: 'verde', maxLevel: 3, category: 'stat',
    desc: (l) => `+${12 * l}% de velocidad y +${5 * l}% de área`, apply: (s, l) => { s.speedMult += 0.12 * l; s.areaMult += 0.05 * l; } },
  brujula:         { id: 'brujula', name: 'Brújula', icon: '🧭', rarity: 'gris', maxLevel: 3, category: 'stat',
    desc: (l) => `+${20 * l}% de radio de recogida y los orbes valen +${10 * l}%`, apply: (s, l) => { s.pickupMult += 0.20 * l; s.orbValueMult += 0.10 * l; } },
  cuerno_guerra:   { id: 'cuerno_guerra', name: 'Cuerno de guerra', icon: '📯', rarity: 'verde', maxLevel: 3, category: 'stat',
    desc: (l) => `+${30 * l}% de empuje`, apply: (s, l) => { s.knockbackMult += 0.30 * l; } },
  bola_cristal:    { id: 'bola_cristal', name: 'Bola de cristal', icon: '🔮', rarity: 'azul', maxLevel: 3, category: 'stat',
    desc: (l) => `+${l} reroll de cartas por partida`, apply: (s, l) => { s.rerolls += l; } },
  gafas_sabio:     { id: 'gafas_sabio', name: 'Gafas del sabio', icon: '👓', rarity: 'azul', maxLevel: 3, category: 'stat',
    desc: (l) => `+${15 * l}% de experiencia`, apply: (s, l) => { s.xpMult += 0.15 * l; } },
  estatua_guardian:{ id: 'estatua_guardian', name: 'Estatua del guardián', icon: '🗿', rarity: 'azul', maxLevel: 3, category: 'stat',
    desc: (l) => `+${2 * l} de armadura y +${10 * l}% de vida máxima`, apply: (s, l) => { s.armor += 2 * l; s.maxHpMult += 0.10 * l; } },
  reloj_bolsillo:  { id: 'reloj_bolsillo', name: 'Reloj de bolsillo', icon: '⌚', rarity: 'morado', maxLevel: 3, category: 'stat',
    desc: (l) => `Los enemigos cercanos se mueven un ${15 * l}% más lento`, apply: (s, l) => { s.slowAura = Math.max(s.slowAura, 0.15 * l); } },
  piedra_sangre:   { id: 'piedra_sangre', name: 'Piedra de sangre', icon: '🩸', rarity: 'morado', maxLevel: 3, category: 'stat',
    desc: (l) => `${3 * l}% de robo de vida con todo el daño`, apply: (s, l) => { s.lifesteal += 0.03 * l; } },
  talisman_suerte: { id: 'talisman_suerte', name: 'Talismán de la suerte', icon: '🧿', rarity: 'dorado', maxLevel: 2, category: 'stat',
    desc: (l) => `+${25 * l}% de suerte y +${10 * l}% de oro`, apply: (s, l) => { s.luck += 0.25 * l; s.goldMult += 0.10 * l; } },
  sello_maldito:   { id: 'sello_maldito', name: 'Sello maldito', icon: '🩸', rarity: 'rojo', maxLevel: 1, category: 'stat',
    desc: () => `+30% de maldición y +30% de daño`, apply: (s) => { s.curse += 0.30; s.damageMult += 0.30; } },
  pluma_fenix:     { id: 'pluma_fenix', name: 'Pluma de fénix', icon: '🪶', rarity: 'rojo', maxLevel: 1, category: 'stat',
    desc: () => `Revivís una vez con vida completa y +0.5 de vida por segundo`, apply: (s) => { s.revives += 1; s.regen += 0.5; } },
  corazon_avatar:  { id: 'corazon_avatar', name: 'Corazón del Avatar', icon: '🌀', rarity: 'blanco', maxLevel: 1, category: 'stat',
    desc: () => `+25% daño, +25% área, -15% recarga y +1 proyectil`, apply: (s) => { s.damageMult += 0.25; s.areaMult += 0.25; s.cooldownMult *= 0.85; s.extraProjectiles += 1; } },
  lagrima_cosmos:  { id: 'lagrima_cosmos', name: 'Lágrima del cosmos', icon: '💧', rarity: 'blanco', maxLevel: 1, category: 'stat',
    desc: () => `Todos los poderes cuentan como 2 niveles más y revivís una vez`, apply: (s) => { s.powerLevelBonus += 2; s.revives += 1; } },

  // ═══════════ MODIFICADORES DE PODERES POR RAMA ═══════════
  nucleo_igneo:    { id: 'nucleo_igneo', name: 'Núcleo ígneo', icon: '🔥', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Fuego, Rayo y Lava: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'fuego') || el(d, 'lava')) s.damage *= 1 + 0.25 * l; } },
  perla_marina:    { id: 'perla_marina', name: 'Perla marina', icon: '🫧', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Agua, Hielo y Sangre: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'agua')) s.damage *= 1 + 0.25 * l; } },
  corazon_roca:    { id: 'corazon_roca', name: 'Corazón de roca', icon: '🪨', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Tierra, Metal, Arena y Lava: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'tierra')) s.damage *= 1 + 0.25 * l; } },
  pluma_aguila:    { id: 'pluma_aguila', name: 'Pluma de águila', icon: '🦅', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Viento y Espíritu: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'aire')) s.damage *= 1 + 0.25 * l; } },
  piedra_lunar:    { id: 'piedra_lunar', name: 'Piedra lunar', icon: '🌙', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Luz y Energía: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'luz')) s.damage *= 1 + 0.25 * l; } },
  obsidiana:       { id: 'obsidiana', name: 'Obsidiana', icon: '⬛', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Oscuridad y Vacío: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'oscuridad')) s.damage *= 1 + 0.25 * l; } },
  amuleto_raiz:    { id: 'amuleto_raiz', name: 'Amuleto de raíz', icon: '🌱', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Poderes de Naturaleza y Veneno: +${25 * l}% de daño`, powerMod: (s, d, l) => { if (fam(d, 'naturaleza')) s.damage *= 1 + 0.25 * l; } },

  // ═══════════ MODIFICADORES DE PODERES POR TIPO ═══════════
  ojo_halcon:      { id: 'ojo_halcon', name: 'Ojo de halcón', icon: '👁️', rarity: 'verde', maxLevel: 3, category: 'power',
    desc: (l) => `Proyectiles: +${30 * l}% de alcance`, powerMod: (s, d, l) => { if (d.kind === 'projectile') s.range *= 1 + 0.30 * l; } },
  lente_enfoque:   { id: 'lente_enfoque', name: 'Lente de enfoque', icon: '🔍', rarity: 'verde', maxLevel: 3, category: 'power',
    desc: (l) => `Haces: +${40 * l}% de ancho y +${20 * l}% de duración`, powerMod: (s, d, l) => { if (d.kind === 'beam') { s.width *= 1 + 0.4 * l; s.duration *= 1 + 0.2 * l; } } },
  catalizador:     { id: 'catalizador', name: 'Catalizador', icon: '⚗️', rarity: 'verde', maxLevel: 3, category: 'power',
    desc: (l) => `Auras: +${25 * l}% de radio`, powerMod: (s, d, l) => { if (d.kind === 'aura') s.radius *= 1 + 0.25 * l; } },
  iman_orbital:    { id: 'iman_orbital', name: 'Imán orbital', icon: '🧲', rarity: 'verde', maxLevel: 3, category: 'power',
    desc: (l) => `Órbitas: +${20 * l}% de radio y +${l} objeto`, powerMod: (s, d, l) => { if (d.kind === 'orbit') { s.radius *= 1 + 0.2 * l; s.count += l; } } },
  semilla_explosiva:{ id: 'semilla_explosiva', name: 'Semilla explosiva', icon: '🌰', rarity: 'morado', maxLevel: 3, category: 'power',
    desc: (l) => `Zonas y trampas: +${30 * l}% de radio y +${25 * l}% de daño`, powerMod: (s, d, l) => { if (d.kind === 'pool' || d.kind === 'mine') { s.radius *= 1 + 0.3 * l; if (s.blast) s.blast *= 1 + 0.3 * l; s.damage *= 1 + 0.25 * l; } } },
  cadena_espejos:  { id: 'cadena_espejos', name: 'Cadena de espejos', icon: '⛓️', rarity: 'morado', maxLevel: 3, category: 'power',
    desc: (l) => `Cadenas: +${2 * l} saltos y +${15 * l}% de alcance de salto`, powerMod: (s, d, l) => { if (d.kind === 'chain') { s.count += 2 * l; s.jumpRange *= 1 + 0.15 * l; } } },
  runa_tormenta:   { id: 'runa_tormenta', name: 'Runa de tormenta', icon: '🌩️', rarity: 'dorado', maxLevel: 2, category: 'power',
    desc: (l) => `Impactos: +${l} objetivo y -${20 * l}% de retraso`, powerMod: (s, d, l) => { if (d.kind === 'strike') { s.count += l; s.delay *= 1 - 0.2 * l; } } },
  guante_hierro:   { id: 'guante_hierro', name: 'Guante de hierro', icon: '🥊', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Cuerpo a cuerpo y ondas: +${30 * l}% de daño y +${20 * l}% de empuje`, powerMod: (s, d, l) => { if (d.kind === 'melee' || d.kind === 'nova') { s.damage *= 1 + 0.3 * l; if (s.knockback) s.knockback *= 1 + 0.2 * l; } } },
  veleta:          { id: 'veleta', name: 'Veleta', icon: '🎐', rarity: 'azul', maxLevel: 3, category: 'power',
    desc: (l) => `Errantes: +${30 * l}% de duración y +${15 * l}% de radio`, powerMod: (s, d, l) => { if (d.kind === 'wanderer') { s.duration *= 1 + 0.3 * l; s.radius *= 1 + 0.15 * l; } } },

  // ═══════════ MODIFICADORES QUE CAMBIAN LA NATURALEZA DE LOS PODERES ═══════════
  prisma:          { id: 'prisma', name: 'Prisma', icon: '🔺', rarity: 'morado', maxLevel: 1, category: 'power',
    desc: () => `Los proyectiles se dividen en dos al impactar`, powerMod: (s, d) => { if (d.kind === 'projectile') s.flags.split = true; } },
  espejo_rebote:   { id: 'espejo_rebote', name: 'Espejo de rebote', icon: '🪩', rarity: 'morado', maxLevel: 1, category: 'power',
    desc: () => `Los proyectiles rebotan hacia otro enemigo (+2 perforación)`, powerMod: (s, d) => { if (d.kind === 'projectile') { s.flags.bounce = true; s.pierce += 2; } } },
  polvora:         { id: 'polvora', name: 'Pólvora', icon: '🧨', rarity: 'morado', maxLevel: 1, category: 'power',
    desc: () => `Los proyectiles explotan al impactar (50% del daño en área)`, powerMod: (s, d) => { if (d.kind === 'projectile') s.flags.explode = true; } },
  reloj_congelado: { id: 'reloj_congelado', name: 'Reloj congelado', icon: '🧊', rarity: 'morado', maxLevel: 2, category: 'stat',
    desc: (l) => `Los estados (quemado, veneno, lento, etc.) duran +${50 * l}%`, apply: (s, l) => { s.statusDurMult += 0.5 * l; } },
  brasa_eterna:    { id: 'brasa_eterna', name: 'Brasa eterna', icon: '🔥', rarity: 'dorado', maxLevel: 2, category: 'power',
    desc: (l) => `Las quemaduras hacen +${100 * l}% de daño`, powerMod: (s, d, l) => { if (s.status && s.status.burn) s.status.burn.dps *= 1 + l; } },
  veneno_concentrado:{ id: 'veneno_concentrado', name: 'Veneno concentrado', icon: '🧪', rarity: 'dorado', maxLevel: 2, category: 'power',
    desc: (l) => `Los venenos hacen +${100 * l}% de daño`, powerMod: (s, d, l) => { if (s.status && s.status.poison) s.status.poison.dps *= 1 + l; } },
  cristal_eco:     { id: 'cristal_eco', name: 'Cristal de eco', icon: '💎', rarity: 'dorado', maxLevel: 1, category: 'power',
    desc: () => `Todos los poderes disparan un 30% más rápido pero hacen -10% de daño`, powerMod: (s) => { if (s.cooldown) s.cooldown *= 0.7; s.damage *= 0.9; } },
  baston_avatar:   { id: 'baston_avatar', name: 'Bastón del Avatar', icon: '🪄', rarity: 'rojo', maxLevel: 2, category: 'stat',
    desc: (l) => `Todos los poderes cuentan como ${l} ${l === 1 ? 'nivel más' : 'niveles más'}`, apply: (s, l) => { s.powerLevelBonus += l; } },
  esfera_infinita: { id: 'esfera_infinita', name: 'Esfera infinita', icon: '♾️', rarity: 'rojo', maxLevel: 1, category: 'stat',
    desc: () => `-25% de recarga global y +15% de área`, apply: (s) => { s.cooldownMult *= 0.75; s.areaMult += 0.15; } },
};

export const ITEM_LIST = Object.values(ITEMS);
