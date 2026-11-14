// The jet buttons: on-screen (multi-touch, so both can be held at once) and
// keyboard for testing on a laptop (A = left, L = right).
import { BUTTONS, CONTROLS_AREA, JETS } from './config.js';

// Each button sits under its nozzle
export const buttonLayout = JETS.nozzles.map(({ x }) => ({
  x,
  y: CONTROLS_AREA.y + CONTROLS_AREA.height / 2,
  radius: BUTTONS.radius,
}));

const KEYS = { a: 0, l: 1 };

export function setupControls({ canvas, view, jets }) {
  const pointerToButton = new Map(); // pointerId -> button index
  const pressedBy = buttonLayout.map(() => new Set()); // button -> sources holding it

  function hold(i, source) {
    if (pressedBy[i].size === 0) jets.press(i);
    pressedBy[i].add(source);
  }
  function letGo(i, source) {
    pressedBy[i].delete(source);
    if (pressedBy[i].size === 0) jets.release(i);
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = view.toWorld(e.clientX, e.clientY);
    const i = buttonLayout.findIndex(
      (b) => Math.hypot(p.x - b.x, p.y - b.y) < BUTTONS.hitRadius,
    );
    if (i === -1) return;
    e.preventDefault();
    pointerToButton.set(e.pointerId, i);
    hold(i, `p${e.pointerId}`);
  });

  function pointerEnd(e) {
    const i = pointerToButton.get(e.pointerId);
    if (i === undefined) return;
    pointerToButton.delete(e.pointerId);
    letGo(i, `p${e.pointerId}`);
  }
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);

  window.addEventListener('keydown', (e) => {
    const i = KEYS[e.key.toLowerCase()];
    if (i === undefined || e.repeat) return;
    hold(i, 'key');
  });
  window.addEventListener('keyup', (e) => {
    const i = KEYS[e.key.toLowerCase()];
    if (i !== undefined) letGo(i, 'key');
  });

  // If the app loses focus mid-press, don't leave a button stuck down
  window.addEventListener('blur', () => {
    pointerToButton.clear();
    pressedBy.forEach((set, i) => {
      set.clear();
      jets.release(i);
    });
  });
}
