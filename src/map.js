// Mapa infinito sin obstáculos. El fondo se genera de forma determinista
// por celda con un hash, así siempre se ve igual en la misma posición.
import { ASSETS } from './assets.js';

const CELL = 160;

function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return h >>> 0;
}

export class GameMap {
  constructor(def) {
    this.def = def;
  }

  draw(ctx, cam, time) {
    const c = this.def.colors;
    const tile = ASSETS.get('tiles', this.def.id);
    if (tile) {
      // suelo con tile repetible de assets/ (alineado al mundo)
      if (!this.pattern) this.pattern = ctx.createPattern(tile.img, 'repeat');
      ctx.fillStyle = this.pattern;
      ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
    } else {
      ctx.fillStyle = c.bg;
      ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
    }

    const x0 = Math.floor(cam.x / CELL) - 1, x1 = Math.floor((cam.x + cam.w) / CELL) + 1;
    const y0 = Math.floor(cam.y / CELL) - 1, y1 = Math.floor((cam.y + cam.h) / CELL) + 1;
    const style = this.def.decorStyle;

    // manchas grandes de terreno (solo sin tile externo)
    for (let cx = x0; cx <= x1 && !tile; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const h = hash(cx, cy);
        const kind = (h >>> 16) & 7;
        if (kind > 3) continue;
        const px = cx * CELL + ((h & 0xff) / 255) * CELL;
        const py = cy * CELL + (((h >>> 8) & 0xff) / 255) * CELL;
        const r = 45 + (((h >>> 20) & 0xff) / 255) * 80;
        ctx.fillStyle = kind < 2 ? c.patch : c.patch2;
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * 0.62, ((h >>> 24) & 0xff) / 40, 0, Math.PI * 2);
        ctx.fill();
        if (kind === 3 && style === 'grass') {
          // charco
          ctx.fillStyle = c.water || '#1f4f6b';
          ctx.beginPath(); ctx.ellipse(px, py, r * 0.55, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(px - r * 0.1, py - r * 0.06, r * 0.3, r * 0.1, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        }
      }
    }

    // detalles pequeños
    ctx.lineWidth = 2;
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const h = hash(cx * 7 + 1, cy * 13 + 3);
        const n = 3 + ((h >>> 28) & 3);
        for (let i = 0; i < n; i++) {
          const hh = hash(cx * 31 + i * 17, cy * 29 + i * 11);
          const px = cx * CELL + ((hh & 0xff) / 255) * CELL;
          const py = cy * CELL + (((hh >>> 8) & 0xff) / 255) * CELL;
          const k = (hh >>> 16) & 15;
          const sway = Math.sin(time * 1.5 + px * 0.05) * 1.5;
          if (style === 'grass') {
            if (k < 9) {
              ctx.strokeStyle = k < 4 ? c.decor : c.decor2;
              const s = 6 + (k % 4) * 2;
              ctx.beginPath();
              ctx.moveTo(px, py); ctx.lineTo(px - 3 + sway, py - s);
              ctx.moveTo(px + 3, py); ctx.lineTo(px + 5 + sway, py - s * 0.8);
              ctx.moveTo(px + 1, py); ctx.lineTo(px + 1 + sway, py - s * 1.15);
              ctx.stroke();
            } else if (k < 11) {
              ctx.strokeStyle = c.decor2; ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + sway * 0.5, py - 7); ctx.stroke();
              ctx.lineWidth = 2;
              ctx.fillStyle = k === 9 ? c.flower : c.flower2 || '#f48fb1';
              for (let j = 0; j < 4; j++) { const a = (j / 4) * Math.PI * 2; ctx.beginPath(); ctx.arc(px + sway * 0.5 + Math.cos(a) * 2.2, py - 7 + Math.sin(a) * 2.2, 1.6, 0, Math.PI * 2); ctx.fill(); }
              ctx.fillStyle = '#fff59d';
              ctx.beginPath(); ctx.arc(px + sway * 0.5, py - 7, 1.2, 0, Math.PI * 2); ctx.fill();
            } else if (k < 13) {
              ctx.fillStyle = c.stone || '#6b7b68';
              ctx.beginPath(); ctx.ellipse(px, py, 6, 3.5, 0.3, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = 'rgba(255,255,255,0.15)';
              ctx.beginPath(); ctx.ellipse(px - 1.5, py - 1, 3, 1.5, 0.3, 0, Math.PI * 2); ctx.fill();
            } else if (k === 13) {
              // tronco caído
              ctx.fillStyle = '#4e342e';
              ctx.beginPath(); ctx.roundRect(px - 14, py - 4, 28, 8, 4); ctx.fill();
              ctx.fillStyle = '#6d4c41';
              ctx.beginPath(); ctx.ellipse(px + 14, py, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
            }
          } else {
            if (k < 6) {
              ctx.strokeStyle = c.decor;
              ctx.beginPath();
              ctx.moveTo(px, py); ctx.lineTo(px + 10 + k, py + 4); ctx.lineTo(px + 18 + k, py - 3); ctx.lineTo(px + 26 + k, py + 2);
              ctx.stroke();
            } else if (k < 8) {
              ctx.strokeStyle = c.decor2;
              ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.stroke();
              ctx.fillStyle = c.decor2;
              ctx.beginPath(); ctx.arc(px - 7, py, 2.2, 0, Math.PI * 2); ctx.arc(px + 7, py, 2.2, 0, Math.PI * 2); ctx.fill();
            } else if (k < 10) {
              // lápida
              ctx.fillStyle = c.decor;
              ctx.beginPath(); ctx.roundRect(px - 7, py - 16, 14, 18, [7, 7, 1, 1]); ctx.fill();
              ctx.strokeStyle = c.decor2; ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(px, py - 4); ctx.moveTo(px - 3, py - 9); ctx.lineTo(px + 3, py - 9); ctx.stroke();
              ctx.lineWidth = 2;
            } else if (k < 12) {
              // vela con brillo
              const fl = 0.7 + Math.sin(time * 6 + px) * 0.3;
              ctx.fillStyle = '#e0d7c0';
              ctx.fillRect(px - 2, py - 8, 4, 8);
              ctx.fillStyle = `rgba(255,180,60,${0.15 * fl})`;
              ctx.beginPath(); ctx.arc(px, py - 10, 14, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffb74d';
              ctx.beginPath(); ctx.ellipse(px, py - 10, 2, 3.5 * fl, 0, 0, Math.PI * 2); ctx.fill();
            } else if (k === 12) {
              ctx.fillStyle = c.flower;
              ctx.globalAlpha = 0.7 + Math.sin(time * 2 + k) * 0.3;
              ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
              ctx.globalAlpha = 1;
            } else if (k === 13) {
              ctx.fillStyle = c.decor;
              ctx.beginPath(); ctx.roundRect(px - 9, py - 6, 18, 12, 2); ctx.fill();
              ctx.strokeStyle = c.decor2; ctx.lineWidth = 1;
              ctx.strokeRect(px - 9, py - 6, 18, 12);
              ctx.lineWidth = 2;
            }
          }
        }
      }
    }
  }
}
