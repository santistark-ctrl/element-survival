// Silueta del personaje con vestimenta por clase.
import { drawGlow } from './sprites.js';

export function drawSilhouette(ctx, look, x, y, scale, t, moving, dir = 1, hurt = false) {
  const sil = hurt ? '#7a2020' : '#15121f';
  const cloth = hurt ? '#b33' : look.cloth;
  const swing = moving ? Math.sin(t) * 6 : 0;
  const bob = moving ? Math.abs(Math.sin(t)) * 2.2 : Math.sin(t * 0.5) * 0.8;
  const breathe = moving ? 0 : Math.sin(t * 0.5) * 0.4;
  const flutter = Math.sin(t * 0.9) * (moving ? 3 : 1.2);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 21, 13, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, -bob);
  ctx.scale(dir, 1);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // capa detrás (ondea)
  ctx.fillStyle = shadeHex(cloth, -0.35);
  ctx.beginPath();
  ctx.moveTo(-7, -9);
  ctx.quadraticCurveTo(-16 - flutter, 2, -13 - flutter * 1.6, 16 + flutter * 0.4);
  ctx.lineTo(-3, 12);
  ctx.closePath(); ctx.fill();

  // bastón detrás (viento)
  if (look.feature === 'staff') {
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-13, -27); ctx.lineTo(-9, 20); ctx.stroke();
    ctx.fillStyle = look.accent;
    ctx.beginPath(); ctx.arc(-13.5, -29, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  // piernas
  ctx.strokeStyle = sil; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(-4 + swing, 18); ctx.moveTo(4, 6); ctx.lineTo(4 - swing, 18); ctx.stroke();
  // botas
  ctx.fillStyle = shadeHex(cloth, -0.5);
  ctx.beginPath(); ctx.ellipse(-4 + swing, 18.5, 4, 2.2, 0, 0, Math.PI * 2); ctx.ellipse(4 - swing, 18.5, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // brazo trasero
  ctx.strokeStyle = sil; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-10 - swing * 0.4, 5); ctx.stroke();
  // túnica
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.moveTo(-8, -9 - breathe); ctx.lineTo(8, -9 - breathe); ctx.lineTo(11, 11); ctx.lineTo(-11, 11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(-1, -9); ctx.lineTo(-1, 11); ctx.lineTo(-11, 11); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = look.trim; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(1, -9); ctx.lineTo(1, 11); ctx.stroke();
  // cinturón
  ctx.fillStyle = shadeHex(cloth, -0.45);
  ctx.fillRect(-9.5, 1, 19, 3);
  ctx.fillStyle = look.trim;
  ctx.fillRect(-1.5, 0.5, 3, 4);
  // rasgos de clase
  if (look.feature === 'sash') {
    ctx.strokeStyle = look.accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(2, 2, 9, 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 9); ctx.quadraticCurveTo(14, 12 + flutter * 0.5, 12, 18 + flutter * 0.3); ctx.stroke();
  } else if (look.feature === 'pads') {
    ctx.fillStyle = look.accent;
    ctx.beginPath(); ctx.roundRect(-14, -12, 8, 6, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(6, -12, 8, 6, 2); ctx.fill();
    ctx.strokeStyle = shadeHex(look.accent, -0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-14, -12, 8, 6, 2); ctx.roundRect(6, -12, 8, 6, 2); ctx.stroke();
  } else if (look.feature === 'flames') {
    ctx.fillStyle = look.accent;
    for (const [fx, h] of [[-9, 6], [-5, 9], [-1, 6], [3, 9], [7, 6]]) {
      const fl = h + Math.sin(t * 2.5 + fx) * 1.5;
      ctx.beginPath(); ctx.moveTo(fx - 2, -8); ctx.quadraticCurveTo(fx + 1, -8 - fl * 0.5, fx, -8 - fl); ctx.quadraticCurveTo(fx + 1, -8 - fl * 0.4, fx + 2, -8); ctx.fill();
    }
  }
  // brazo delantero
  ctx.strokeStyle = sil; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(10 + swing * 0.4, 5); ctx.stroke();
  // energía elemental en la mano
  const hx = 10 + swing * 0.4, hy = 6;
  drawGlow(ctx, hx, hy, 9, look.accent, 0.5 + Math.sin(t * 1.5) * 0.15);
  ctx.fillStyle = look.accent;
  ctx.beginPath(); ctx.arc(hx, hy, 2.6, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a = t * 0.8 + (i * Math.PI * 2) / 3;
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(hx + Math.cos(a) * 5, hy + Math.sin(a) * 3, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // cabeza
  ctx.fillStyle = sil;
  ctx.beginPath(); ctx.arc(0, -16 - breathe, 7.5, 0, Math.PI * 2); ctx.fill();
  if (look.feature === 'hood') {
    ctx.fillStyle = cloth;
    ctx.beginPath(); ctx.moveTo(-9.5, -12); ctx.quadraticCurveTo(-9, -29, 2, -27); ctx.quadraticCurveTo(10.5, -25, 9.5, -12); ctx.lineTo(6, -12); ctx.quadraticCurveTo(5, -21, 0, -22); ctx.quadraticCurveTo(-5, -21, -6, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(-5, -21, 0, -22); ctx.lineTo(0, -12); ctx.closePath(); ctx.fill();
  } else if (look.feature === 'halo') {
    drawGlow(ctx, 0, -28, 12, look.accent, 0.35);
    ctx.strokeStyle = look.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.ellipse(0, -28 + Math.sin(t * 0.7), 8, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = sil;
    ctx.beginPath(); ctx.moveTo(-8, -18); ctx.quadraticCurveTo(-2, -28, 8, -20); ctx.lineTo(9, -17); ctx.lineTo(-7, -14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -22); ctx.lineTo(9, -26); ctx.lineTo(8, -19); ctx.fill();
  }
  // ojos brillantes
  drawGlow(ctx, 4.5, -17, 6, look.accent, 0.35);
  ctx.fillStyle = look.accent;
  ctx.beginPath(); ctx.arc(3, -17 - breathe, 1.5, 0, Math.PI * 2); ctx.arc(6.5, -17 - breathe, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function shadeHex(hex, amt) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
