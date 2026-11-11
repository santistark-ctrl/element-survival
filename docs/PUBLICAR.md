# Cómo publicar Element Survival (y cuánto cuesta)

El juego es HTML5 + JavaScript. Ese mismo código sirve para las tres salidas: navegador, PC (Steam) y Android (Play Store). No hace falta reescribirlo en otro motor: Vampire Survivors salió en Steam exactamente así (juego web dentro de Electron) y recién años después se portó a otro motor.

## Resumen de costos

| Qué | Costo | Notas |
|---|---|---|
| Motor y herramientas (Node, Electron, Capacitor, Android Studio) | Gratis | Todo open source. |
| Publicar en itch.io (web) | Gratis | Opcional: comisión sobre ventas si cobrás. |
| Cuenta de desarrollador de Google Play | **25 USD una sola vez** | Además Google pide una verificación de identidad y, para cuentas nuevas, un período de prueba cerrada con testers antes de publicar. |
| Steam Direct | **100 USD por juego** | Se devuelven cuando el juego supera 1.000 USD en ventas. Hay que completar datos fiscales (formulario W-8BEN para no residentes de EE. UU.). |
| Arte | Gratis a 30 USD | Packs CC0 gratis; Aseprite unos 20 USD (opcional); packs de itch.io 5-30 USD. |
| Música y sonidos | Gratis | jsfxr, ChipTone, Bosca Ceoil, packs CC0. |
| App Store de Apple (si algún día) | 99 USD por año | No hace falta para Steam ni Play Store. |

En resumen: podés hacer y probar todo gratis. Solo pagás cuando decidís publicar en una tienda: 25 USD (Play Store) o 100 USD (Steam).

## 1. Navegador (itch.io, gratis)

Ver el README: zip con `index.html`, `styles.css`, `src/` y `assets/`, subir como juego HTML.

## 2. PC / Steam (Electron)

Ya está preparado en `desktop/main.cjs` y `package.json`.

```bash
npm install          # descarga Electron (una vez, ~200 MB)
npm run desktop      # abre el juego como programa
npm run build:win    # genera el instalador y un .exe portable en dist/
```

Para Steam además:
1. Crear cuenta en Steamworks y pagar Steam Direct (100 USD).
2. Subir el contenido de `dist/` con SteamPipe (herramienta de Steam) y configurar la página de la tienda.
3. Opcional: logros y guardado en la nube con el addon `steamworks.js` (gratis).

El juego ya soporta gamepad (stick izquierdo para moverse, Start para pausar) y F11 para pantalla completa, que es lo mínimo que Steam espera.

## 3. Android / Play Store (Capacitor)

Capacitor envuelve la web en una app nativa. El juego ya tiene joystick táctil y botón de pausa en pantallas táctiles.

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Element Survival" com.tuusuario.elementsurvival --web-dir .
npx cap add android
npx cap open android      # abre Android Studio (gratis)
```

En Android Studio: Build > Generate Signed Bundle (AAB). Ese archivo se sube a Google Play Console (cuenta de 25 USD).

Para que se vea bien en celular:
- El canvas ya ocupa toda la pantalla y escala a cualquier resolución.
- Conviene activar "Modo píxel" en Opciones en celulares de gama baja (dibuja a mitad de resolución) si el rendimiento no llega a 60 fps.
- Los menús son HTML, así que funcionan con el dedo sin cambios.

## 4. Si más adelante querés migrar a un motor

Recomendación: **Godot 4** (gratis, sin regalías, exporta a Windows, Linux, Mac, Android e iOS, muy bueno para 2D). Toda la lógica de contenido de `src/data/` se porta casi igual, porque son tablas de datos. Solo tiene sentido si necesitás cosas que el navegador no da (mucho mejor rendimiento en celulares viejos, shaders complejos, física). Para un juego de este tipo la ruta web + Electron + Capacitor alcanza para publicar.

## Orden sugerido

1. Conseguir o generar el arte (ver `assets/README.md`) y probarlo en el juego.
2. Publicar la versión web en itch.io para que jueguen amigos y juntar opiniones.
3. Balancear y agregar contenido (mapas, mejoras permanentes).
4. Build de Windows con Electron y página en Steam (100 USD).
5. Versión Android con Capacitor (25 USD).
