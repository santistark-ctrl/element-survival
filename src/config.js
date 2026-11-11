// Parámetros globales del juego. Tocá estos números para balancear rápido.
export const CONFIG = {
  gameName: 'Element Survival',
  player: {
    baseHp: 100,
    baseSpeed: 220,       // px por segundo
    baseRegen: 0,         // sin regeneración: solo corazones e ítems curan
    pickupRadius: 110,    // radio de atracción de orbes
    maxPowers: 6,         // slots de poderes activos
    maxItems: 8,          // slots de ítems
    maxElements: 4,       // elementos desbloqueables por partida (incluye el de la clase)
    invulnAfterHit: 0.5,  // segundos de invulnerabilidad tras recibir daño
    rerolls: 2,           // rerolls de cartas por partida (los ítems pueden sumar)
    skipGold: 20,         // oro por saltar una subida de nivel
  },
  enemies: {
    maxAlive: 900,        // tope de enemigos vivos (enjambres grandes)
    contactCooldown: 1.0,
    despawnDist: 2200,    // si un enemigo queda más lejos, se reubica cerca del jugador
    rotationSec: 150,     // cada cuántos segundos cambia el par de enemigos (2,5 min)
    baseRate: 5.0,        // enemigos por segundo al inicio
    ratePerMinute: 1.6,   // cuánto sube la tasa por minuto
    hordeEverySec: 300,   // horda en anillo cada 5 minutos
    eliteEverySec: 55,    // un élite (con cofre) cada tantos segundos al inicio; baja con el tiempo
  },
  boss: {
    intervalSec: 600,     // oleada de jefe cada 10 minutos
  },
  orbs: {
    maxAlive: 45,
    spawnEvery: 0.6,
    despawnDist: 2400,
    weights: { azul: 70, morado: 22, dorado: 8 }, // rojo: solo jefes
    values: { azul: 4, morado: 14, dorado: 45, rojo: 250 },
  },
  hearts: {
    dropChance: 0.005,    // probabilidad por enemigo común muerto
    spawnEvery: 45,       // segundos entre corazones que aparecen solos por el mapa
    heal: 15,             // vida fija que cura
    healPct: 0.08,        // más este porcentaje de la vida máxima
  },
  chest: {
    rewards: { gris: 1, verde: 1, azul: 2, morado: 2, dorado: 3, rojo: 4, blanco: 5 },
  },
  limits: { maxTexts: 120, maxEffects: 260, maxParticles: 1000 },
};
