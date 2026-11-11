// Evoluciones finales: un poder en nivel máximo + un ítem concreto (de cualquier
// nivel) se convierte en su versión definitiva, que reemplaza al poder en su slot.
export const EVOLUTIONS = [
  { power: 'bola_fuego',       item: 'nucleo_igneo',      result: 'sol_naciente' },
  { power: 'anillo_fuego',     item: 'catalizador',       result: 'infierno' },
  { power: 'latigo_agua',      item: 'guante_hierro',     result: 'maremoto' },
  { power: 'ola',              item: 'cuerno_guerra',     result: 'tsunami' },
  { power: 'rocas_orbitales',  item: 'iman_orbital',      result: 'cinturon_asteroides' },
  { power: 'estalagmita',      item: 'runa_tormenta',     result: 'falla_tectonica' },
  { power: 'cuchillas_viento', item: 'duplicador',        result: 'huracan_de_cuchillas' },
  { power: 'tornado',          item: 'veleta',            result: 'ciclon' },
  { power: 'rayo_sagrado',     item: 'lente_enfoque',     result: 'luz_divina' },
  { power: 'orbe_luz',         item: 'brazalete',         result: 'constelacion' },
  { power: 'dagas_sombra',     item: 'prisma',            result: 'tormenta_de_dagas' },
  { power: 'abismo',           item: 'obsidiana',         result: 'agujero_del_olvido' },
  { power: 'cadena_rayos',     item: 'cadena_espejos',    result: 'tormenta_electrica' },
  { power: 'fragmento_hielo',  item: 'espejo_rebote',     result: 'cero_absoluto' },
  { power: 'enredadera',       item: 'amuleto_raiz',      result: 'bosque_viviente' },
  { power: 'esporas',          item: 'veneno_concentrado', result: 'plaga' },
];

export const evolutionOf = (powerId) => EVOLUTIONS.find((e) => e.power === powerId);
