// Bubbles: purely visual. Jets blow streams of them, shakes stir up a burst,
// and a few drift up from the floor on their own. They ride the water
// currents, so they also show where the water is moving.
import { TANK } from './config.js';

const MAX_BUBBLES = 260;
const FLOOR = TANK.y + TANK.height;

export function createBubbles() {
  const list = [];

  function add(x, y, r) {
    if (list.length >= MAX_BUBBLES) list.shift();
    list.push({ x, y, r, phase: Math.random() * Math.PI * 2, age: 0 });
  }

  return {
    list,

    // Call once per physics step
    step(jets, water) {
      for (const jet of jets) {
        // More power, more bubbles (fractional counts become a chance)
        let count = jet.power * 2.5;
        while (count > 0) {
          if (Math.random() < count) add(jet.x + (Math.random() - 0.5) * 18, FLOOR - 4, 1.2 + Math.random() * 3);
          count -= 1;
        }
      }
      // An occasional stray bubble from the floor
      if (Math.random() < 0.03) add(TANK.x + 10 + Math.random() * (TANK.width - 20), FLOOR - 3, 0.8 + Math.random() * 1.5);

      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        const u = water.sample(b.x, b.y);
        b.phase += 0.12;
        b.age++;
        b.x += u.x * 0.7 + Math.sin(b.phase) * 0.35;
        b.y += u.y * 0.7 - (0.5 + b.r * 0.18); // bigger bubbles rise faster
        b.x = Math.min(Math.max(b.x, TANK.x + b.r), TANK.x + TANK.width - b.r);
        if (b.y < TANK.y + b.r + 1 || b.y > FLOOR || b.age > 900) list.splice(i, 1);
      }
    },

    // A shake stirs up bubbles all over the tank
    burst(amount) {
      const n = Math.min(40, Math.round(amount * 30)); // amount is ~0.1–1 per step while shaking
      for (let i = 0; i < n; i++) {
        add(TANK.x + Math.random() * TANK.width, TANK.y + 40 + Math.random() * (TANK.height - 40), 0.8 + Math.random() * 2.5);
      }
    },

    reset() {
      list.length = 0;
    },
  };
}
