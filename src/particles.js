import { familyOf } from './data/elements.js';
import { rand, choice } from './utils.js';

// Presets de partículas por elemento (colores y comportamiento).
const PRESETS = {
  fuego:      { colors: ['#ff6b35', '#ffab40', '#ffee58', '#ff3d00'], speed: 70, grav: -90, drag: 2, life: [0.3, 0.7], size: [2, 5], add: true, shape: 'circle' },
  lava:       { colors: ['#ff7043', '#ffab40', '#ff3d00', '#4e342e'], speed: 90, grav: 60, drag: 1, life: [0.4, 0.8], size: [2, 5], add: true, shape: 'circle' },
  rayo:       { colors: ['#ffee58', '#ffffff', '#fff59d'], speed: 220, grav: 0, drag: 6, life: [0.1, 0.3], size: [1, 3], add: true, shape: 'spark' },
  agua:       { colors: ['#4fc3f7', '#81d4fa', '#e1f5fe'], speed: 120, grav: 220, drag: 1, life: [0.3, 0.6], size: [2, 4], add: false, shape: 'circle' },
  hielo:      { colors: ['#80deea', '#e0f7fa', '#ffffff'], speed: 90, grav: 60, drag: 2, life: [0.3, 0.7], size: [1.5, 3.5], add: true, shape: 'square' },
  sangre:     { colors: ['#e53935', '#b71c1c', '#ff5252'], speed: 140, grav: 260, drag: 1, life: [0.3, 0.6], size: [2, 4], add: false, shape: 'circle' },
  tierra:     { colors: ['#a1887f', '#8d6e63', '#5d4037'], speed: 130, grav: 300, drag: 1, life: [0.3, 0.6], size: [2, 5], add: false, shape: 'square' },
  metal:      { colors: ['#eceff1', '#b0bec5', '#ffee58'], speed: 200, grav: 120, drag: 3, life: [0.15, 0.4], size: [1, 3], add: true, shape: 'spark' },
  arena:      { colors: ['#ffe082', '#ffd54f', '#d7ccc8'], speed: 80, grav: 40, drag: 1, life: [0.4, 0.9], size: [1.5, 3], add: false, shape: 'circle' },
  aire:       { colors: ['#ffffff', '#cfd8dc', '#e0f7fa'], speed: 160, grav: 0, drag: 3, life: [0.2, 0.5], size: [1.5, 3], add: true, shape: 'spark' },
  espiritu:   { colors: ['#b2ebf2', '#e0f7fa', '#80deea'], speed: 50, grav: -40, drag: 1, life: [0.5, 1.0], size: [2, 5], add: true, shape: 'circle' },
  luz:        { colors: ['#fff59d', '#ffffff', '#ffd54f'], speed: 80, grav: -30, drag: 2, life: [0.3, 0.8], size: [1.5, 4], add: true, shape: 'circle' },
  energia:    { colors: ['#ce93d8', '#ea80fc', '#ffffff'], speed: 180, grav: 0, drag: 4, life: [0.15, 0.4], size: [1.5, 3], add: true, shape: 'spark' },
  oscuridad:  { colors: ['#9575cd', '#4a148c', '#311b92'], speed: 50, grav: -50, drag: 1, life: [0.5, 1.0], size: [3, 7], add: false, shape: 'circle' },
  vacio:      { colors: ['#7e57c2', '#311b92', '#b388ff'], speed: 60, grav: 0, drag: 1, life: [0.4, 0.9], size: [2, 5], add: true, shape: 'circle' },
  naturaleza: { colors: ['#81c784', '#aed581', '#33691e'], speed: 90, grav: 90, drag: 1.5, life: [0.4, 0.9], size: [2, 4], add: false, shape: 'square' },
  veneno:     { colors: ['#aed581', '#c6ff00', '#7cb342'], speed: 50, grav: -60, drag: 1, life: [0.4, 0.9], size: [2, 5], add: true, shape: 'circle' },
};

export class Particles {
  constructor(max = 900) {
    this.max = max;
    this.list = [];
  }

  add(p) {
    if (this.list.length >= this.max) this.list.shift();
    p.t = 0;
    this.list.push(p);
  }

  // Emisión genérica.
  emit(x, y, n, o = {}) {
    const colors = o.colors || [o.color || '#fff'];
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + rand(-(o.arc ?? Math.PI), o.arc ?? Math.PI) : rand(0, Math.PI * 2);
      const sp = rand((o.speed ?? 100) * 0.3, o.speed ?? 100);
      this.add({
        x: x + rand(-(o.jitter || 0), o.jitter || 0), y: y + rand(-(o.jitter || 0), o.jitter || 0),
        vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0),
        life: rand(o.life ? o.life[0] : 0.3, o.life ? o.life[1] : 0.7),
        size: rand(o.size ? o.size[0] : 2, o.size ? o.size[1] : 4),
        color: choice(colors), grav: o.grav || 0, drag: o.drag || 0,
        add: !!o.add, shape: o.shape || 'circle', rot: rand(0, Math.PI * 2), vr: rand(-6, 6),
      });
    }
  }

  emitElement(x, y, element, n, o = {}) {
    const pr = PRESETS[element] || PRESETS[familyOf(element)] || PRESETS.luz;
    this.emit(x, y, n, { ...pr, ...o });
  }

  update(dt) {
    const l = this.list;
    for (let i = 0; i < l.length; i++) {
      const p = l[i];
      p.t += dt;
      if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.list = l.filter((p) => p.t < p.life);
  }

  draw(ctx, cam, additive) {
    for (const p of this.list) {
      if (p.add !== additive) continue;
      if (p.x < cam.x - 20 || p.x > cam.x + cam.w + 20 || p.y < cam.y - 20 || p.y > cam.y + cam.h + 20) continue;
      const k = p.t / p.life;
      const a = 1 - k;
      const s = p.size * (1 - k * 0.6);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.shape === 'spark') {
        ctx.strokeStyle = p.color; ctx.lineWidth = s;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
      } else if (p.shape === 'square') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
