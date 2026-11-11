# Arte del juego (carpeta `assets/`)

El juego dibuja todo por código, pero **si acá hay imágenes, las usa en lugar del dibujo procedural**. Se puede reemplazar de a un sprite a la vez: lo que falte sigue viéndose como ahora.

## Formato general

- **PNG con fondo transparente.**
- Animaciones: **tira horizontal de frames del mismo tamaño** (frame 1, frame 2, … de izquierda a derecha, en una sola fila).
- Estilo recomendado: pixel art de **32 x 32** para enemigos comunes, dibujado mirando a la **derecha** (el juego lo espeja solo). Podés usar otro tamaño: el juego escala cada sprite a su tamaño en pantalla.
- Registrá cada archivo en `manifest.json`:

```json
{
  "enemies": {
    "limo": { "file": "enemies/limo.png", "frames": 4, "fps": 6 }
  }
}
```

Campos: `file` (ruta dentro de `assets/`), `frames` (cantidad de frames; si se omite se calcula como ancho ÷ alto), `fw`/`fh` (tamaño de cada frame; si se omite se asume que los frames son cuadrados de la altura de la imagen), `fps` (velocidad de la animación), `scale` (multiplicador de tamaño, por defecto 1).

## Lista de sprites que usa el juego

### `player` (uno por clase, ids: `fuego`, `agua`, `aire`, `tierra`, `luz`, `oscuridad`)
- Tira de **caminata** de 4 a 6 frames, tamaño sugerido 32 x 48 (alto mayor que ancho). El frame 0 se usa como pose quieto.
- Mirando a la derecha. Silueta oscura con la túnica del color de la clase (rojo, azul, naranja/gris, marrón, blanco/dorado, violeta).

### `enemies` (ids = los de `src/data/enemies.js`)
`orbe_azul`, `orbe_verde`, `orbe_rojo`, `orbe_violeta`, `orbe_dorado`, `orbe_negro`, `esfera_gemela`, `limo`, `larva`, `murcielago`, `arana`, `hongo`, `lobo`, `serpiente`, `espectro`, `ojo`, `calavera`, `medusa`, `estrella`, `golem`, `escarabajo`, `cristal`, `sombra`, `gargola`, `demonio`.
- 2 a 4 frames de animación (flotar, caminar, aletear), 32 x 32. Los grandes (gólem, demonio, esfera negra, cristal) pueden ser 48 x 48.
- Los que "miran" (lobo, serpiente, larva) dibujados hacia la derecha.

### `bosses` (ids: `titan_roca`, `reina_murcielago`, `ojo_ancestral`, `coloso_espectral`, `orbe_primordial`)
- 2 a 4 frames, 96 x 96 o más.

### `projectiles` (ids = elementos: `fuego`, `agua`, `tierra`, `aire`, `luz`, `oscuridad`, `naturaleza`, `rayo`, `hielo`, `sangre`, `metal`, `arena`, `lava`, `espiritu`, `energia`, `vacio`, `veneno`)
- 1 a 4 frames, 16 x 16, apuntando a la derecha (el juego lo rota según la dirección).

### `orbs` (ids: `azul`, `morado`, `dorado`, `rojo`)
- Gema de experiencia, 1 a 4 frames (brillo), 16 x 16.

### `ui`
- `chest`: cofre cerrado, 32 x 32 (el color de rareza se dibuja alrededor).
- `coin`: moneda, 12 x 12, opcionalmente 4 a 6 frames girando.

### `tiles` (ids = mapas: `pradera`, `cripta`)
- **Un tile de suelo repetible** (seamless) de 64 x 64 o 128 x 128. Se usa como patrón de fondo y reemplaza el fondo procedural.

## Dónde conseguir arte gratis o barato

- **Packs CC0 / gratuitos**: itch.io (buscar "top down monsters", "pixel art enemies", "roguelike pack"), Kenney.nl, OpenGameArt.org.
- **Dibujar**: Aseprite (unos 20 USD, o gratis compilándolo), Piskel o LibreSprite (gratis).
- **Generar con IA**: PixelLab, Scenario o Stable Diffusion con un modelo de pixel art; después limpiar y recortar en Aseprite.

Cuando tengas archivos, ponelos en esta carpeta, registralos en `manifest.json` y recargá el juego.
