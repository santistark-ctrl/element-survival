// Grilla espacial uniforme para consultas rápidas de enemigos cercanos.
export class Grid {
  constructor(cell = 96) {
    this.cell = cell;
    this.map = new Map();
  }
  clear() { this.map.clear(); }
  key(cx, cy) { return (cx + 1024) * 4096 + (cy + 1024); }
  insert(e) {
    const cx = Math.floor(e.x / this.cell), cy = Math.floor(e.y / this.cell);
    const k = this.key(cx, cy);
    let a = this.map.get(k);
    if (!a) { a = []; this.map.set(k, a); }
    a.push(e);
  }
  // Llama cb(e) para cada entidad en las celdas que tocan el círculo (x, y, r).
  query(x, y, r, cb) {
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const a = this.map.get(this.key(cx, cy));
        if (!a) continue;
        for (let i = 0; i < a.length; i++) { const e = a[i]; if (!e.dead) cb(e); }
      }
    }
  }
}
