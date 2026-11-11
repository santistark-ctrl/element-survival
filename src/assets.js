// Cargador de assets opcional. Si existe assets/manifest.json y los archivos que
// nombra, el juego usa esas imágenes en lugar de los gráficos procedurales.
// Cualquier entrada que falte cae al dibujo por código, así se puede ir
// reemplazando el arte de a poco. Ver assets/README.md para el formato.

export const ASSETS = {
  loaded: false,
  data: {},          // { categoria: { id: entrada } }
  whites: new Map(), // versiones blancas (flash de daño)

  get(cat, id) {
    const c = this.data[cat];
    return c ? c[id] || null : null;
  },

  // Índice de frame para animar una entrada según el tiempo.
  frame(entry, time, offset = 0) {
    if (entry.frames <= 1) return 0;
    return Math.floor(time * entry.fps + offset) % entry.frames;
  },

  // Dibuja un frame centrado en (0,0) del contexto actual, con altura destino `h`.
  draw(ctx, entry, frame, h, white = false) {
    const img = white ? this.white(entry) : entry.img;
    const w = h * (entry.fw / entry.fh);
    ctx.drawImage(img, frame * entry.fw, 0, entry.fw, entry.fh, -w / 2, -h / 2, w, h);
  },

  // Silueta blanca cacheada (para el parpadeo al recibir daño).
  white(entry) {
    let c = this.whites.get(entry);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = entry.img.width; c.height = entry.img.height;
    const cx = c.getContext('2d');
    cx.drawImage(entry.img, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, c.width, c.height);
    this.whites.set(entry, c);
    return c;
  },
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadAssets() {
  let manifest;
  try {
    const r = await fetch('assets/manifest.json', { cache: 'no-store' });
    if (!r.ok) return;
    manifest = await r.json();
  } catch (_) { return; }
  const jobs = [];
  for (const cat in manifest) {
    ASSETS.data[cat] = {};
    for (const id in manifest[cat]) {
      const def = manifest[cat][id];
      jobs.push(loadImage('assets/' + def.file).then((img) => {
        if (!img) { console.warn(`[assets] no se pudo cargar ${def.file}`); return; }
        const fh = def.fh || img.height;
        const fw = def.fw || fh;
        ASSETS.data[cat][id] = { img, fw, fh, frames: def.frames || Math.max(1, Math.floor(img.width / fw)), fps: def.fps || 6, scale: def.scale || 1 };
      }));
    }
  }
  await Promise.all(jobs);
  ASSETS.loaded = true;
  const n = Object.values(ASSETS.data).reduce((a, c) => a + Object.keys(c).length, 0);
  if (n) console.log(`[assets] ${n} sprites cargados`);
}
