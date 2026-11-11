# Revisión del 10/11/2026 (v0.3.0)

Cómo se revisó: lectura del código de juego, validación automática de todos los datos
(89 poderes, 54 ítems, 22 sinergias, 16 evoluciones, mapas, enemigos y logros) y tres partidas
simuladas de 31 minutos en modo invencible (fuego/pradera, oscuridad/cripta, aire/pradera).
Ninguna simulación produjo errores ni valores inválidos.

## Problemas encontrados (sin corregir todavía)

1. **Jefes que nunca aparecen.** Cada mapa lista 4 jefes, pero solo salen 2 (minutos 10 y 20) porque
   a los 30 llega el jefe final. La Esfera Primordial no aparece en ningún mapa
   (`updateSpawner` en `src/enemies.js`, `bosses` en `src/data/maps.js`).
2. **Las hordas suelen no aparecer.** La horda llena hasta el tope de 900 enemigos; si ya hay 900
   (pasó desde el minuto 6 en las simulaciones) se anuncia "¡Horda!" y no aparece nadie.
3. **Espacio saltea una subida de nivel.** Espacio es la habilidad en partida y "Saltar" en las cartas.
   Si se aprieta justo cuando aparecen las cartas, se pierde la mejora (`handleShortcuts` en `src/main.js`).
4. **Ignorar al jefe facilita la partida.** Los jefes no se reubican y son lentos. Mientras uno sigue
   vivo aparece 40% menos de enemigos y no hay eventos de mapa, sin límite de tiempo.
   Al llegar el siguiente jefe, el anterior pierde su barra y su flecha.
5. **Dash y Paso sombrío más cortos con joystick.** `facing` no se normaliza: con el stick o el joystick
   táctil a medias, el dash y el teletransporte recorren menos distancia (`src/player.js`).
6. **Los jefes grandes reciben menos golpes en los bordes.** Las consultas a la grilla usan un margen fijo
   de 40 px y los jefes miden hasta 92: los ataques que rozan el borde a veces no los detectan (`src/spatial.js`).
7. **Contenido sin usar:** el enemigo `esfera_gemela` no está en ningún mapa.

## Observaciones de balance (para decidir, no son errores)

- El tope de 900 enemigos se alcanza temprano; desde ahí la tasa de aparición deja de importar y la
  dificultad sube solo por la vida de los enemigos (×3 al minuto 10, ×8,6 al minuto 30).
- El jefe final pega 137 por contacto al minuto 30 contra 100 de vida base.

## Rendimiento

- La lógica cuesta 0,5 a 2 ms por cuadro con 900 enemigos.
- Medido sin placa de video (el peor caso), el juego se mantuvo entre 45 y 60 cuadros por segundo con
  900 enemigos. Con armas que matan mucho a la vez bajó a unos 30 por la cantidad de números de daño,
  partículas y animaciones de muerte. No se midió en un celular real.
