// Sprites de enemigos y brillos, dibujados una vez en canvas fuera de pantalla.

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// ─── Brillos (radial) cacheados por color ───
const glowCache = new Map();
export function glowSprite(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}
export function drawGlow(ctx, x, y, r, color, alpha = 0.5) {
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

// ─── Sprites de enemigos ───
const spriteCache = new Map();
export function getEnemySprite(e, flash) {
  const key = `${e.type}|${e.boss ? 1 : 0}|${flash ? 1 : 0}`;
  let sp = spriteCache.get(key);
  if (!sp) {
    const s = e.def.size;
    const pad = Math.ceil(s * 2.6 + 14);
    const c = document.createElement('canvas');
    c.width = c.height = pad * 2;
    const cx = c.getContext('2d');
    cx.translate(pad, pad);
    drawEnemyShape(cx, e.shape, s, flash ? '#ffffff' : e.color, e.def, flash);
    sp = { canvas: c, pad };
    spriteCache.set(key, sp);
  }
  return sp;
}

function outline(ctx, w = 2.5, col = 'rgba(10,8,20,0.9)') { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke(); }

function angryEyes(ctx, s, y, color, pupil, spacing = 0.38, tilt = 0.35) {
  for (const d of [-1, 1]) {
    ctx.save();
    ctx.translate(d * s * spacing, y);
    ctx.rotate(d * tilt);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.2, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pupil;
    ctx.beginPath(); ctx.arc(d * s * 0.05, 0, s * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export function drawEnemyShape(ctx, shape, s, color, def, flash) {
  const dark = flash ? '#dddddd' : shade(color, -0.4);
  const darker = flash ? '#cccccc' : shade(color, -0.65);
  const light = flash ? '#ffffff' : shade(color, 0.4);
  const eyeW = flash ? '#eeeeee' : '#fff8e1';
  const pupil = flash ? '#888' : '#1a1020';
  const glowEye = flash ? '#888' : (def.eyeColor || '#ff5252');
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  switch (shape) {
    case 'orb': { // esfera con núcleo, cara enojada y púas opcionales
      if (def.spikes) {
        ctx.fillStyle = dark;
        ctx.beginPath();
        const n = def.spikes;
        for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2; const r = i % 2 ? s * 1.05 : s * 1.55; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); outline(ctx);
      }
      const g = ctx.createRadialGradient(-s * 0.3, -s * 0.35, s * 0.1, 0, 0, s);
      g.addColorStop(0, light); g.addColorStop(0.55, color); g.addColorStop(1, darker);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill(); outline(ctx, 3);
      // núcleo
      ctx.fillStyle = darker; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(0, s * 0.15, s * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = light; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.45, s * 0.25, s * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      angryEyes(ctx, s, -s * 0.1, eyeW, pupil, 0.36, 0.4);
      // boca dentada
      ctx.fillStyle = darker;
      ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 0.35);
      for (let i = 0; i <= 4; i++) ctx.lineTo(-s * 0.45 + (i * s * 0.9) / 4, s * 0.35 + (i % 2 ? s * 0.22 : 0));
      ctx.lineTo(s * 0.45, s * 0.55); ctx.lineTo(-s * 0.45, s * 0.55); ctx.closePath(); ctx.fill();
      if (def.ring) {
        ctx.strokeStyle = light; ctx.lineWidth = Math.max(2.5, s * 0.14); ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 1.55, s * 0.5, -0.45, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'blob': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s * 1.05, s * 0.55);
      ctx.quadraticCurveTo(-s * 1.2, -s * 0.5, -s * 0.3, -s * 0.9);
      ctx.quadraticCurveTo(s * 0.4, -s * 1.1, s * 0.95, -s * 0.3);
      ctx.quadraticCurveTo(s * 1.25, s * 0.4, s * 0.8, s * 0.7);
      ctx.quadraticCurveTo(s * 0.4, s * 0.95, 0, s * 0.75);
      ctx.quadraticCurveTo(-s * 0.5, s * 1.0, -s * 1.05, s * 0.55);
      ctx.closePath(); ctx.fill(); outline(ctx);
      ctx.fillStyle = dark; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 0.8, s * 0.3, 0, 0, Math.PI); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(-s * 0.45, -s * 0.4, s * 0.25, s * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
      angryEyes(ctx, s, -s * 0.15, eyeW, pupil, 0.32, 0.25);
      ctx.strokeStyle = darker; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, s * 0.2, s * 0.3, 0.3, Math.PI - 0.3); ctx.stroke();
      break;
    }
    case 'worm': { // mira hacia +x
      for (let i = 4; i >= 1; i--) {
        const r = s * (0.95 - i * 0.14);
        ctx.fillStyle = i % 2 ? dark : color;
        ctx.beginPath(); ctx.arc(-i * s * 0.7, Math.sin(i * 1.6) * s * 0.2, r, 0, Math.PI * 2); ctx.fill(); outline(ctx, 2);
      }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.05, s * 0.85, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx);
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.4, s * 0.3, s * 0.15, 0, 0, Math.PI * 2); ctx.fill();
      // lengua
      ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s * 0.95, s * 0.1); ctx.lineTo(s * 1.4, s * 0.05); ctx.lineTo(s * 1.55, -s * 0.15); ctx.moveTo(s * 1.4, s * 0.05); ctx.lineTo(s * 1.55, s * 0.25); ctx.stroke();
      ctx.fillStyle = eyeW;
      ctx.beginPath(); ctx.arc(s * 0.45, -s * 0.3, s * 0.2, 0, Math.PI * 2); ctx.arc(s * 0.45, s * 0.3, s * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pupil;
      ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.3, s * 0.1, 0, Math.PI * 2); ctx.arc(s * 0.52, s * 0.3, s * 0.1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'wings': {
      ctx.fillStyle = dark;
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(d * s * 0.4, 0);
        ctx.quadraticCurveTo(d * s * 1.4, -s * 1.3, d * s * 2.1, -s * 0.3);
        ctx.lineTo(d * s * 1.6, -s * 0.1);
        ctx.lineTo(d * s * 1.3, s * 0.35);
        ctx.lineTo(d * s * 0.9, s * 0.1);
        ctx.lineTo(d * s * 0.5, s * 0.4);
        ctx.closePath(); ctx.fill(); outline(ctx, 2);
        ctx.strokeStyle = darker; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(d * s * 0.5, 0); ctx.lineTo(d * s * 1.6, -s * 0.1); ctx.moveTo(d * s * 0.5, 0); ctx.lineTo(d * s * 1.3, s * 0.3); ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.7, s * 0.85, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx);
      ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.5); ctx.lineTo(-s * 0.35, -s * 1.25); ctx.lineTo(-s * 0.05, -s * 0.65); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.beginPath(); ctx.moveTo(s * 0.55, -s * 0.5); ctx.lineTo(s * 0.35, -s * 1.25); ctx.lineTo(s * 0.05, -s * 0.65); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.2, s * 0.13, 0, Math.PI * 2); ctx.arc(s * 0.25, -s * 0.2, s * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.25); ctx.lineTo(-s * 0.15, s * 0.55); ctx.lineTo(-s * 0.05, s * 0.25); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.25, s * 0.25); ctx.lineTo(s * 0.15, s * 0.55); ctx.lineTo(s * 0.05, s * 0.25); ctx.fill();
      break;
    }
    case 'spider': {
      ctx.strokeStyle = darker; ctx.lineWidth = Math.max(2.5, s * 0.18);
      for (let i = 0; i < 4; i++) {
        const a = -0.9 + i * 0.6;
        for (const d of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(d * Math.cos(a) * s * 1.2, Math.sin(a) * s * 1.2 - s * 0.35);
          ctx.lineTo(d * Math.cos(a) * s * 2.0, Math.sin(a) * s * 1.2 + s * 0.45);
          ctx.stroke();
        }
      }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, s * 0.4, s * 0.85, s * 0.7, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx);
      ctx.fillStyle = light; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.1); ctx.lineTo(s * 0.35, s * 0.4); ctx.lineTo(0, s * 0.95); ctx.lineTo(-s * 0.35, s * 0.4); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(0, -s * 0.5, s * 0.55, 0, Math.PI * 2); ctx.fill(); outline(ctx);
      ctx.fillStyle = glowEye;
      for (const [x, y, r] of [[-0.28, -0.55, 0.12], [0.28, -0.55, 0.12], [-0.12, -0.7, 0.08], [0.12, -0.7, 0.08], [-0.4, -0.4, 0.07], [0.4, -0.4, 0.07]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.15); ctx.lineTo(-s * 0.12, s * 0.1); ctx.lineTo(-s * 0.04, -s * 0.15); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.15); ctx.lineTo(s * 0.12, s * 0.1); ctx.lineTo(s * 0.04, -s * 0.15); ctx.fill();
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = flash ? '#eee' : '#f3e5d8';
      ctx.beginPath(); ctx.roundRect(-s * 0.45, -s * 0.1, s * 0.9, s * 1.05, s * 0.25); ctx.fill(); outline(ctx);
      angryEyes(ctx, s, s * 0.3, eyeW, pupil, 0.2, 0.3);
      ctx.fillStyle = darker;
      ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.6); ctx.lineTo(-s * 0.12, s * 0.72); ctx.lineTo(0, s * 0.6); ctx.lineTo(s * 0.12, s * 0.72); ctx.lineTo(s * 0.25, s * 0.6); ctx.lineTo(s * 0.25, s * 0.78); ctx.lineTo(-s * 0.25, s * 0.78); ctx.closePath(); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, -s * 0.2, s * 1.2, s * 0.85, 0, Math.PI, 0); ctx.quadraticCurveTo(s * 1.2, 0, s * 1.0, s * 0.05); ctx.lineTo(-s * 1.0, s * 0.05); ctx.quadraticCurveTo(-s * 1.2, 0, -s * 1.2, -s * 0.2); ctx.closePath(); ctx.fill(); outline(ctx);
      ctx.fillStyle = light;
      for (const [x, y, r] of [[-0.55, -0.5, 0.2], [0.15, -0.8, 0.15], [0.6, -0.4, 0.17], [-0.15, -0.35, 0.1]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'tri': { // lobo, mira hacia +x
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(s * 0.5, -s * 0.75); ctx.lineTo(-s * 0.3, -s * 0.9); ctx.lineTo(-s * 1.2, -s * 0.55); ctx.lineTo(-s * 0.75, 0); ctx.lineTo(-s * 1.2, s * 0.55); ctx.lineTo(-s * 0.3, s * 0.9); ctx.lineTo(s * 0.5, s * 0.75); ctx.closePath(); ctx.fill(); outline(ctx);
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.85); ctx.lineTo(0, -s * 1.4); ctx.lineTo(s * 0.35, -s * 0.65); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.85); ctx.lineTo(0, s * 1.4); ctx.lineTo(s * 0.35, s * 0.65); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.fillStyle = light; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(s * 1.3, 0); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.45); ctx.lineTo(s * 0.7, -s * 0.25); ctx.lineTo(s * 0.3, -s * 0.15); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.45); ctx.lineTo(s * 0.7, s * 0.25); ctx.lineTo(s * 0.3, s * 0.15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      for (const y of [-0.22, 0, 0.22]) { ctx.beginPath(); ctx.moveTo(s * 1.0, y * s - s * 0.08); ctx.lineTo(s * 1.3, y * s); ctx.lineTo(s * 1.0, y * s + s * 0.08); ctx.fill(); }
      break;
    }
    case 'ghost': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s, Math.PI, 0);
      ctx.lineTo(s, s * 0.7);
      for (let i = 0; i < 4; i++) {
        const x1 = s - ((i + 0.5) * s * 2) / 4, x2 = s - ((i + 1) * s * 2) / 4;
        ctx.quadraticCurveTo(x1, s * 1.1, x2, s * 0.7);
      }
      ctx.closePath(); ctx.fill(); outline(ctx, 2.5, flash ? '#ccc' : 'rgba(20,10,40,0.7)');
      const g = ctx.createRadialGradient(0, -s * 0.2, 0, 0, -s * 0.2, s);
      g.addColorStop(0, light); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(0, -s * 0.2, s, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = pupil;
      ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.3, s * 0.2, s * 0.26, 0, 0, Math.PI * 2); ctx.ellipse(s * 0.35, -s * 0.3, s * 0.2, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.18, s * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.3, s * 0.08, 0, Math.PI * 2); ctx.arc(s * 0.35, -s * 0.3, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'eye': {
      ctx.fillStyle = flash ? '#fff' : '#f7f2ea';
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.85, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 3);
      ctx.strokeStyle = flash ? '#ccc' : '#e57373'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.5); ctx.quadraticCurveTo(Math.cos(a + 0.2) * s * 0.75, Math.sin(a + 0.2) * s * 0.65, Math.cos(a + 0.35) * s * 0.95, Math.sin(a + 0.35) * s * 0.8); ctx.stroke(); }
      const g = ctx.createRadialGradient(0, 0, s * 0.05, 0, 0, s * 0.52);
      g.addColorStop(0, light); g.addColorStop(0.7, color); g.addColorStop(1, darker);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.16, s * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-s * 0.17, -s * 0.22, s * 0.1, 0, Math.PI * 2); ctx.fill();
      // párpado superior
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(0, -s * 0.2, s * 1.02, s * 0.75, 0, Math.PI, 0); ctx.lineTo(s * 1.02, -s * 0.55); ctx.quadraticCurveTo(0, -s * 0.2, -s * 1.02, -s * 0.55); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      break;
    }
    case 'skull': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.95, 0, Math.PI * 2); ctx.fill(); outline(ctx);
      ctx.beginPath(); ctx.roundRect(-s * 0.6, s * 0.3, s * 1.2, s * 0.62, s * 0.15); ctx.fill(); outline(ctx);
      ctx.strokeStyle = dark; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 1.05); ctx.lineTo(-s * 0.05, -s * 0.7); ctx.lineTo(-s * 0.25, -s * 0.5); ctx.stroke();
      ctx.fillStyle = pupil;
      ctx.beginPath(); ctx.ellipse(-s * 0.38, -s * 0.2, s * 0.28, s * 0.3, 0.2, 0, Math.PI * 2); ctx.ellipse(s * 0.38, -s * 0.2, s * 0.28, s * 0.3, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0.05 * s); ctx.lineTo(-s * 0.14, s * 0.32); ctx.lineTo(s * 0.14, s * 0.32); ctx.fill();
      ctx.strokeStyle = darker; ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.2, s * 0.45); ctx.lineTo(i * s * 0.2, s * 0.85); ctx.stroke(); }
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.arc(-s * 0.38, -s * 0.18, s * 0.12, 0, Math.PI * 2); ctx.arc(s * 0.38, -s * 0.18, s * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'jelly': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2.5, s * 0.14); ctx.globalAlpha = 0.85;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.32, s * 0.3); ctx.quadraticCurveTo(i * s * 0.5, s * 0.85, i * s * 0.3 + (i % 2 ? s * 0.2 : -s * 0.2), s * 1.45); ctx.stroke(); }
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(-s * 0.3, -s * 0.55, s * 0.1, 0, -s * 0.1, s * 1.05);
      g.addColorStop(0, light); g.addColorStop(0.7, color); g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, -s * 0.1, s, Math.PI, 0); ctx.quadraticCurveTo(s * 0.5, s * 0.55, 0, s * 0.45); ctx.quadraticCurveTo(-s * 0.5, s * 0.55, -s, -s * 0.1); ctx.closePath(); ctx.fill(); outline(ctx, 2.5, flash ? '#ccc' : 'rgba(10,30,50,0.7)');
      ctx.fillStyle = light; ctx.globalAlpha = 0.7;
      for (const [x, y, r] of [[-0.5, -0.5, 0.14], [0.2, -0.75, 0.1], [0.55, -0.35, 0.12]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      angryEyes(ctx, s, -s * 0.05, eyeW, pupil, 0.3, 0.2);
      break;
    }
    case 'star': {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? s * 0.6 : s * 1.4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); outline(ctx);
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
      angryEyes(ctx, s, -s * 0.05, eyeW, pupil, 0.2, 0.3);
      ctx.strokeStyle = pupil; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, s * 0.15, s * 0.2, 0.2, Math.PI - 0.2); ctx.stroke();
      break;
    }
    case 'square': { // gólem
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(-s, -s, s * 2, s * 2, s * 0.3); ctx.fill(); outline(ctx, 3);
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.roundRect(-s * 0.95, s * 0.35, s * 1.9, s * 0.6, s * 0.2); ctx.fill();
      ctx.strokeStyle = darker; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-s * 0.6, -s); ctx.lineTo(-s * 0.4, -s * 0.5); ctx.lineTo(-s * 0.7, -s * 0.2); ctx.moveTo(s * 0.5, s * 0.1); ctx.lineTo(s * 0.8, s * 0.4); ctx.moveTo(s * 0.2, -s * 0.95); ctx.lineTo(s * 0.35, -s * 0.6); ctx.stroke();
      ctx.fillStyle = flash ? '#ddd' : '#7cb342'; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(-s * 0.55, -s * 0.85, s * 0.4, s * 0.18, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = light;
      ctx.fillRect(-s * 0.85, -s * 0.85, s * 0.45, s * 0.2);
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.roundRect(-s * 0.6, -s * 0.35, s * 0.35, s * 0.3, 2); ctx.roundRect(s * 0.25, -s * 0.35, s * 0.35, s * 0.3, 2); ctx.fill();
      break;
    }
    case 'beetle': {
      ctx.strokeStyle = darker; ctx.lineWidth = Math.max(2.5, s * 0.16);
      for (let i = -1; i <= 1; i++) for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * s * 0.5, i * s * 0.4); ctx.lineTo(d * s * 1.0, i * s * 0.5 - s * 0.1); ctx.lineTo(d * s * 1.35, i * s * 0.55 + s * 0.3); ctx.stroke(); }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.9, s * 1.1, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 3);
      ctx.strokeStyle = darker; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(0, s * 1.05); ctx.stroke();
      ctx.fillStyle = light; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(-s * 0.4, -s * 0.35, s * 0.22, s * 0.4, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * 0.4, -s * 0.35, s * 0.22, s * 0.4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(0, -s * 1.0, s * 0.4, 0, Math.PI * 2); ctx.fill(); outline(ctx, 2);
      ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 1.25); ctx.lineTo(0, -s * 1.85); ctx.lineTo(s * 0.18, -s * 1.25); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.arc(-s * 0.18, -s * 1.05, s * 0.08, 0, Math.PI * 2); ctx.arc(s * 0.18, -s * 1.05, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'crystal': {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s * 0.85, -s * 0.4); ctx.lineTo(s * 0.65, s * 0.95); ctx.lineTo(-s * 0.65, s * 0.95); ctx.lineTo(-s * 0.85, -s * 0.4); ctx.closePath(); ctx.fill(); outline(ctx);
      ctx.fillStyle = light; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s * 0.85, -s * 0.4); ctx.lineTo(0, -s * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.1); ctx.lineTo(s * 0.65, s * 0.95); ctx.lineTo(-s * 0.65, s * 0.95); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = light; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(0, s * 0.95); ctx.moveTo(-s * 0.85, -s * 0.4); ctx.lineTo(0, -s * 0.1); ctx.lineTo(s * 0.85, -s * 0.4); ctx.stroke();
      ctx.fillStyle = glowEye;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.25); ctx.lineTo(-s * 0.1, s * 0.35); ctx.lineTo(-s * 0.4, s * 0.45); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.4, s * 0.25); ctx.lineTo(s * 0.1, s * 0.35); ctx.lineTo(s * 0.4, s * 0.45); ctx.closePath(); ctx.fill();
      break;
    }
    case 'demon': {
      ctx.fillStyle = darker;
      ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.6); ctx.quadraticCurveTo(-s * 1.2, -s * 1.2, -s * 0.9, -s * 1.7); ctx.quadraticCurveTo(-s * 0.5, -s * 1.2, -s * 0.15, -s * 0.85); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.6); ctx.quadraticCurveTo(s * 1.2, -s * 1.2, s * 0.9, -s * 1.7); ctx.quadraticCurveTo(s * 0.5, -s * 1.2, s * 0.15, -s * 0.85); ctx.closePath(); ctx.fill(); outline(ctx, 2);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.0, s * 1.05, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 3);
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(0, s * 0.55, s * 0.75, s * 0.42, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = flash ? '#888' : '#ffee58';
      ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.4); ctx.lineTo(-s * 0.1, -s * 0.15); ctx.lineTo(-s * 0.55, 0.02 * s); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.4); ctx.lineTo(s * 0.1, -s * 0.15); ctx.lineTo(s * 0.55, 0.02 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pupil;
      ctx.beginPath(); ctx.arc(-s * 0.38, -s * 0.18, s * 0.06, 0, Math.PI * 2); ctx.arc(s * 0.38, -s * 0.18, s * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      for (const x of [-0.45, -0.2, 0.2, 0.45]) { ctx.beginPath(); ctx.moveTo(x * s - s * 0.08, s * 0.35); ctx.lineTo(x * s, s * 0.72); ctx.lineTo(x * s + s * 0.08, s * 0.35); ctx.fill(); }
      break;
    }
    default: {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill(); outline(ctx);
    }
  }
}

export const FACING_ROTATE = new Set(['tri', 'worm']);
export const SYMMETRIC = new Set(['orb', 'star', 'crystal', 'eye', 'spider', 'beetle', 'square']);
export const FLOATING = new Set(['wings', 'ghost', 'eye', 'jelly', 'orb', 'star']);
