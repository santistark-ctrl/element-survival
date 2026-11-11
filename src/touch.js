// Joystick virtual para pantallas táctiles (celulares/tablets).
export function setupTouch(game) {
  const input = game.input;
  if (!input.isTouchDevice) return;
  const layer = document.getElementById('touch-layer');
  const base = document.getElementById('joy-base');
  const knob = document.getElementById('joy-knob');
  const pauseBtn = document.getElementById('touch-pause');
  layer.classList.remove('hidden');
  pauseBtn.classList.remove('hidden');
  pauseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (game.state === 'playing') game.pause(); else if (game.state === 'paused') game.resume(); }, { passive: false });
  const skillBtn = document.getElementById('touch-skill');
  skillBtn.classList.remove('hidden');
  skillBtn.addEventListener('touchstart', (e) => { e.preventDefault(); input.pressed.add('Space'); }, { passive: false });

  const R = 55;
  let id = null, ox = 0, oy = 0;
  const show = (x, y) => { base.style.left = `${x - R}px`; base.style.top = `${y - R}px`; base.classList.remove('hidden'); knob.style.transform = 'translate(0,0)'; };
  const move = (x, y) => {
    let dx = x - ox, dy = y - oy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    input.touch = { x: dx / R, y: dy / R, active: true };
  };
  const end = () => { id = null; input.touch = { x: 0, y: 0, active: false }; base.classList.add('hidden'); };

  layer.addEventListener('touchstart', (e) => {
    if (game.state !== 'playing' || id !== null) return;
    const t = e.changedTouches[0];
    id = t.identifier; ox = t.clientX; oy = t.clientY;
    show(ox, oy);
    e.preventDefault();
  }, { passive: false });
  layer.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) if (t.identifier === id) { move(t.clientX, t.clientY); e.preventDefault(); }
  }, { passive: false });
  const onEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === id) end(); };
  layer.addEventListener('touchend', onEnd);
  layer.addEventListener('touchcancel', onEnd);
}
