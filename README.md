# Element Survival

Survival estilo *Magic Survival* / *Vampire Survivors*: sobrevivís a enjambres con ataques automáticos, subís de nivel, desbloqueás elementos y sus poderes, juntás ítems que modifican tus poderes, combinás elementos en sinergias y enfrentás un jefe cada 10 minutos.

Hecho con **HTML5 Canvas + JavaScript puro** (módulos ES). Sin frameworks ni dependencias. Todos los gráficos, partículas, efectos de sonido y música se generan por código (no hay archivos de assets).

## Cómo correrlo

Necesitás **Node.js**. Los módulos ES no cargan abriendo el `index.html` directo, hace falta un servidor local:

- **Doble clic en `jugar.bat`** abre el navegador y levanta el servidor.
- O desde la terminal, dentro de esta carpeta:

```bash
npm start
```

y entrás a <http://localhost:8080>. Las tipografías (Cinzel y Nunito) se cargan de Google Fonts; sin internet se usa una fuente del sistema.

## Controles

| Tecla | Acción |
|---|---|
| WASD / flechas | moverse |
| ESC | pausa / continuar |

Los ataques son automáticos.

## Estructura

```
survival/
├── index.html          página, HUD y todas las pantallas (DOM)
├── styles.css          estilos (fuentes, animaciones de cartas, compendio)
├── server.js           servidor estático mínimo
├── jugar.bat           atajo para Windows
└── src/
    ├── main.js         clase Game: bucle, estados, efectos, destellos, reroll/saltar
    ├── config.js       números globales de balance (tasa de enemigos, orbes, slots…)
    ├── player.js       jugador: clase, elementos desbloqueados, stats, XP, revivir
    ├── enemies.js      enemigos: rotación de pares cada 2,5 min, élites, hordas, jefes, disparos, embestidas, muerte animada
    ├── powers.js       comportamientos y visuales de poderes, banderas de ítems (rebote, división, explosión)
    ├── particles.js    sistema de partículas con presets por elemento
    ├── sprites.js      sprites de enemigos (16 formas) y brillos, cacheados en canvas
    ├── character.js    silueta del personaje con vestimenta por clase
    ├── render.js       dibujo por capas, iluminación (viñeta), fondo animado del menú
    ├── map.js          mapa infinito procedural (pasto, flores, charcos / lápidas, velas, huesos)
    ├── pickups.js      orbes de XP (gemas), monedas y cofres
    ├── levelup.js      cartas de subida de nivel (poder / elemento / ítem) y recompensas de cofres
    ├── synergies.js    detección de sinergias -> poderes evolucionados
    ├── ui.js           menú, clases, opciones, compendio, HUD, pausa, fin de partida
    ├── audio.js        efectos por elemento y música secuenciada (WebAudio)
    ├── input.js        teclado, gamepad y joystick táctil
    ├── touch.js        joystick virtual para pantallas táctiles
    ├── assets.js       cargador opcional de sprites desde assets/
    ├── spatial.js      grilla espacial
    ├── save.js         progreso, ajustes y estadísticas en localStorage
    └── data/           TODO EL CONTENIDO ES DATA:
        ├── elements.js   7 controles base + 10 subcontroles
        ├── classes.js    6 clases iniciales con vestimenta
        ├── powers.js     41 poderes base + 16 evolucionados (11 tipos de comportamiento)
        ├── items.js      ~50 ítems: stats del personaje y modificadores de poderes
        ├── rarities.js   7 rarezas y colores de orbes
        ├── synergies.js  16 sinergias entre elementos
        ├── enemies.js    25 enemigos (esferas y monstruos) + 5 jefes
        └── maps.js       mapas: fondo, pares de enemigos por tramo, jefes, oscuridad
```

## Mecánicas

- **Clases**: cada una empieza con su elemento desbloqueado y un poder de ese elemento. Potencian su rama y cambian la vestimenta.
- **Elementos**: solo podés elegir poderes de elementos desbloqueados. Al subir de nivel aparecen cartas para desbloquear otro (máximo 4). Los subcontroles requieren el elemento padre.
- **Compendio**: desde el menú, la pausa o la pantalla de subida de nivel: lista todos los elementos (con estado), todas las magias y todas las sinergias con su progreso.
- **Poderes**: 11 tipos: proyectil, aura, órbita, impacto, cadena, onda, haz, errante, cuerpo a cuerpo, zona y trampa, cada uno con su animación y sonido por elemento. Estados: quemado, veneno, mojado, lento, aturdido, maldito.
- **Sinergias**: un poder nivel 3+ de cada elemento requerido desbloquea un poder evolucionado sin ocupar slot.
- **Experiencia**: matar da XP directa (poca por enemigo, son enjambres). Además hay gemas por el mapa: azul (chica), morada (mediana), dorada (grande) y roja (muy grande, solo jefes).
- **Subida de nivel**: 3 cartas entre poderes (nuevos o mejoras), desbloqueo de elemento y **aumentos de stats** (`src/data/boosts.js`), con **Reroll** y **Saltar**. Nunca salen ítems.
- **Ítems** (7 rarezas): de personaje y modificadores de poderes (por rama, por tipo, o que cambian su naturaleza). Solo se consiguen en cofres.
- **Cofres**: ofrecen 3 opciones (4 en legendario, mítico y divino) y elegís una. La rareza mínima sube con el cofre; los míticos y divinos además curan y dan oro.
- **Enemigos**: enjambres grandes (hasta 900 vivos); cada 2,5 minutos cambia el par activo con aviso. Disparan, embisten, tienen armadura o atraviesan. Horda cada 5 minutos, jefe cada 10.
- **Audio**: efectos sintetizados por elemento (golpe, lanzamiento, impacto) y música con intensidad que sube con los minutos y durante los jefes. Todo con volúmenes en Opciones.
- **Mejoras permanentes**: con el oro acumulado se compran 13 mejoras (vida, daño, velocidad, regeneración, armadura, área, recarga, suerte, XP, oro, imán, rerolls, revivir) con costo creciente. Están en `src/data/upgrades.js`.
- **Críticos**: 5% base más la suerte; hacen el doble de daño y se muestran en amarillo con "!".
- **Calidad de vida**: flechas en el borde hacia cofres y jefe fuera de pantalla, aviso de vida baja (borde rojo y latido), pausa automática al perder el foco, animación de muerte con "¡Nuevo récord!" en el resumen, atajos 1/2/3/4 para cartas, R reroll, Enter reintentar.
- **Curación**: no hay regeneración base. Se cura con **corazones** (los sueltan a veces los enemigos, siempre los élites y los jefes, y aparece uno por el mapa cada 45 s; curan 15 más 8% de la vida máxima) o con los pocos ítems y mejoras que dan vida por segundo, que son muy bajos según rareza (Tomate 0,1 por nivel, Pluma de fénix 0,5). Números en `CONFIG.hearts`.
- **Habilidad activa** (Espacio, botón A del gamepad o botón táctil): una por clase con recarga: Estallido ígneo, Marea curativa, Ráfaga (dash), Muralla de piedra, Destello cegador y Paso sombrío. Definidas en `src/data/classes.js`, lógica en `Player.useSkill()`.
- **Final a los 30 minutos**: aparece el Avatar de la Ruina; si lo derrotás ganás la partida con una recompensa grande de oro. Los jefes normales entran en **fase 2** al 50% de vida: más rápidos, más daño, disparos en anillo, doble invocación.
- **Eventos de mapa** (`src/data/events.js`, lógica en `src/events.js`): cada 1,5 a 2,5 minutos: lluvia de meteoros, niebla, hora dorada, oleada de un solo enemigo, lluvia de gemas o frenesí. Se muestran con una insignia bajo el reloj.
- **Élites con modificadores**: veloz, blindado, explosivo (deja una zona que estalla), invocador y regenerador, con etiqueta y color propio. Dos modificadores a partir del minuto 12.
- **Evoluciones finales** (`src/data/evolutions.js`): poder al nivel máximo + un ítem concreto = versión definitiva que reemplaza al poder en su slot. 16 evoluciones; la carta del poder dice con qué ítem evoluciona y el compendio tiene su pestaña.
- **Sinergias de ítems** (`src/data/itemSynergies.js`): 14 pares de ítems con efecto extra (Prisma + Pólvora = Metralla, etc.). Pestaña "Ítems" del compendio.
- **Tercer poder de cada subcontrol** y **6 sinergias de tres elementos** (Apocalipsis, Pacto helado, Núcleo planetario, Ascensión total, Fin de los tiempos, Jardín venenoso).
- **Logros y estadísticas** (`src/data/achievements.js`): 20 logros que se anuncian en la partida, y una pantalla con estadísticas globales, mejor tiempo por clase, bajas por enemigo, jefes y sinergias/evoluciones descubiertas.

## Cómo agregar contenido

- **Poder**: entrada en `src/data/powers.js` con un `kind` existente. El estilo visual del proyectil sale del elemento (`VISUAL` en `powers.js`).
- **Elemento / subcontrol**: `src/data/elements.js` (+ preset de partículas en `particles.js` y sonidos en `audio.js` si querés algo distinto a la familia).
- **Clase**: `src/data/classes.js` (`look.feature`: flames | sash | staff | pads | halo | hood).
- **Ítem**: `src/data/items.js` con `apply` (stats) o `powerMod` (modifica poderes).
- **Sinergia**: `src/data/synergies.js` + su poder `evolved: true`.
- **Enemigo**: `src/data/enemies.js` (`shape` existente o nuevo en `sprites.js`) y sumarlo al `roster` de un mapa.
- **Mapa**: `src/data/maps.js` (colores, `decorStyle`, `darkness`, `roster`, `bosses`).
- **Balance**: `src/config.js` y `Game.difficulty()` en `main.js`.

## Arte propio (carpeta `assets/`)

Lo que hay hoy es todo procedural. Si ponés imágenes PNG en `assets/` y las registrás en `assets/manifest.json`, el juego las usa en lugar del dibujo por código, sprite por sprite (personaje, enemigos, jefes, proyectiles, gemas, cofre, moneda y tile de suelo). La lista completa de lo que necesita, tamaños y formato está en `assets/README.md`.

## Publicar (web, Steam, Play Store)

- **Web**: zip con `index.html`, `styles.css`, `src/` y `assets/` a itch.io.
- **PC / Steam**: envoltorio Electron listo en `desktop/` (`npm install`, `npm run desktop`, `npm run build:win`). Gamepad (stick izquierdo, Start = pausa) y F11 pantalla completa.
- **Android / Play Store**: Capacitor; el juego ya tiene joystick táctil y botón de pausa en pantallas táctiles, y un "Modo píxel" en Opciones para rendir mejor en celulares.

La guía paso a paso con costos está en `docs/PUBLICAR.md`.

## Pulido visual (10/11/2026)

- **Selección de clase**: los personajes se ven nítidos y las 6 clases entran en una pantalla (antes una regla CSS general estiraba los lienzos).
- **Menú**: fondo con nebulosas, estrellas en dos capas, estrellas fugaces y orbes con estela (`drawMenuBackground` en `render.js`).
- **Partida**: luciérnagas en la pradera y polvo con brasas en la cripta (`drawAmbient`), fundido al empezar, anillo del color de la clase bajo el personaje, estelas en el dash y el paso sombrío, los enemigos "saltan" al recibir un golpe y los proyectiles dejan una chispa al impactar.
- **HUD**: la barra de vida deja una estela blanca al perder vida y late cuando queda poca, la de experiencia destella al subir de nivel y el reloj marca cada minuto. El HUD ya no reescribe el DOM en cada cuadro.
- **Jefes**: barras de cine al aparecer. **Muerte**: la imagen se desatura.

La revisión del código, con los problemas encontrados, está en `docs/REVISION.md`.

## Pendiente

- Más mapas y más jefes.
- Sprites y música con archivos si se consiguen assets (ver `assets/README.md`).
