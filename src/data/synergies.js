// Sinergias entre elementos.
// Se activan cuando tenés al menos un poder de cada elemento requerido con
// nivel >= minLevel. Al activarse otorgan un poder evolucionado (grants) que
// no ocupa slot.
export const SYNERGIES = [
  { id: 'tormenta_ignea',     name: 'Tormenta ígnea',     elements: ['fuego', 'aire'],        minLevel: 3, grants: 'tormenta_ignea' },
  { id: 'electrocucion',      name: 'Electrocución',      elements: ['agua', 'rayo'],         minLevel: 3, grants: 'electrocucion' },
  { id: 'avalancha',          name: 'Avalancha',          elements: ['hielo', 'tierra'],      minLevel: 3, grants: 'avalancha' },
  { id: 'eclipse',            name: 'Eclipse',            elements: ['luz', 'oscuridad'],     minLevel: 3, grants: 'eclipse' },
  { id: 'magma',              name: 'Magma',              elements: ['fuego', 'tierra'],      minLevel: 3, grants: 'magma' },
  { id: 'ventisca',           name: 'Ventisca',           elements: ['hielo', 'aire'],        minLevel: 3, grants: 'ventisca' },
  { id: 'lanza_glacial',      name: 'Lanza glacial',      elements: ['agua', 'hielo'],        minLevel: 3, grants: 'lanza_glacial' },
  { id: 'juicio',             name: 'Juicio',             elements: ['rayo', 'luz'],          minLevel: 3, grants: 'juicio' },
  { id: 'incendio_forestal',  name: 'Incendio forestal',  elements: ['naturaleza', 'fuego'],  minLevel: 3, grants: 'incendio_forestal' },
  { id: 'nube_letal',         name: 'Nube letal',         elements: ['veneno', 'aire'],       minLevel: 3, grants: 'nube_letal' },
  { id: 'pacto_sangre',       name: 'Pacto de sangre',    elements: ['sangre', 'oscuridad'],  minLevel: 3, grants: 'pacto_sangre' },
  { id: 'tormenta_magnetica', name: 'Tormenta magnética', elements: ['metal', 'rayo'],        minLevel: 3, grants: 'tormenta_magnetica' },
  { id: 'lodo',               name: 'Lodo',               elements: ['arena', 'agua'],        minLevel: 3, grants: 'lodo' },
  { id: 'choque_termico',     name: 'Choque térmico',     elements: ['lava', 'hielo'],        minLevel: 3, grants: 'choque_termico' },
  { id: 'ascension',          name: 'Ascensión',          elements: ['espiritu', 'luz'],      minLevel: 3, grants: 'ascension' },
  { id: 'singularidad',       name: 'Singularidad',       elements: ['energia', 'vacio'],     minLevel: 3, grants: 'singularidad' },
  // ─── Sinergias de tres elementos ───
  { id: 'apocalipsis',        name: 'Apocalipsis',        elements: ['fuego', 'rayo', 'aire'],          minLevel: 3, grants: 'apocalipsis' },
  { id: 'pacto_helado',       name: 'Pacto helado',       elements: ['agua', 'hielo', 'sangre'],        minLevel: 3, grants: 'pacto_helado' },
  { id: 'nucleo_planetario',  name: 'Núcleo planetario',  elements: ['tierra', 'metal', 'lava'],        minLevel: 3, grants: 'nucleo_planetario' },
  { id: 'ascension_total',    name: 'Ascensión total',    elements: ['luz', 'energia', 'espiritu'],     minLevel: 3, grants: 'ascension_total' },
  { id: 'fin_de_los_tiempos', name: 'Fin de los tiempos', elements: ['oscuridad', 'vacio', 'veneno'],   minLevel: 3, grants: 'fin_de_los_tiempos' },
  { id: 'jardin_venenoso',    name: 'Jardín venenoso',    elements: ['naturaleza', 'veneno', 'agua'],   minLevel: 3, grants: 'jardin_venenoso' },
];
