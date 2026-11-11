// Entrada: teclado, gamepad (stick izquierdo) y joystick táctil.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.touch = { x: 0, y: 0, active: false };
    this.padStartWas = false;
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  get isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

  // Lee el gamepad una vez por frame (Start = pausa).
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[0];
    this.pad = null;
    if (!gp) return;
    const dz = 0.2;
    let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
    if (Math.abs(x) < dz) x = 0; if (Math.abs(y) < dz) y = 0;
    if (gp.buttons[14]?.pressed) x = -1; if (gp.buttons[15]?.pressed) x = 1;
    if (gp.buttons[12]?.pressed) y = -1; if (gp.buttons[13]?.pressed) y = 1;
    this.pad = { x, y };
    const start = !!gp.buttons[9]?.pressed;
    if (start && !this.padStartWas) this.pressed.add('Escape');
    this.padStartWas = start;
    const a = !!gp.buttons[0]?.pressed;
    if (a && !this.padAWas) this.pressed.add('GamepadA');
    this.padAWas = a;
  }

  axis() {
    let x = 0, y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (!x && !y && this.pad && (this.pad.x || this.pad.y)) { x = this.pad.x; y = this.pad.y; }
    if (!x && !y && this.touch.active) { x = this.touch.x; y = this.touch.y; }
    const l = Math.hypot(x, y);
    if (l > 1) return { x: x / l, y: y / l };
    return l > 0.05 ? { x, y } : { x: 0, y: 0 };
  }

  wasPressed(code) { return this.pressed.has(code); }
  endFrame() { this.pressed.clear(); }
}
