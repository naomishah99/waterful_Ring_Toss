// Step 2: rings sinking through water.
import Matter from 'matter-js';
import { TANK } from './config.js';
import { createView } from './view.js';
import { createWorld } from './world.js';
import { startLoop } from './loop.js';
import { drawDebug } from './debugRender.js';
import { spawnRings } from './rings.js';
import { applyWater } from './water.js';
import { createTuningPanel } from './tuningPanel.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');

const view = createView(canvas);
const { engine } = createWorld();
let rings = spawnRings(engine.world);

const water = createTuningPanel({
  'Drop rings': () => {
    rings = spawnRings(engine.world, rings);
  },
});

// Debug "poke": tap the tank to push nearby rings away from your finger.
// A rough stand-in for water jets until Step 4.
const POKE_RADIUS = 90;
const POKE_STRENGTH = 9;
canvas.addEventListener('pointerdown', (e) => {
  const p = view.toWorld(e.clientX, e.clientY);
  const inTank =
    p.x > TANK.x && p.x < TANK.x + TANK.width && p.y > TANK.y && p.y < TANK.y + TANK.height;
  if (!inTank) return;
  for (const ring of rings) {
    const dx = ring.position.x - p.x;
    const dy = ring.position.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > POKE_RADIUS) continue;
    const push = POKE_STRENGTH * (1 - dist / POKE_RADIUS);
    const nx = dist > 0.001 ? dx / dist : 0;
    const ny = dist > 0.001 ? dy / dist : -1;
    Matter.Body.setVelocity(ring, {
      x: ring.velocity.x + nx * push,
      y: ring.velocity.y + ny * push - push * 0.5, // slight upward bias, like a jet
    });
    Matter.Body.setAngularVelocity(ring, ring.angularVelocity + (Math.random() - 0.5) * 0.3);
  }
});

startLoop({
  update(dt) {
    applyWater(rings, water);
    Matter.Engine.update(engine, dt);
  },
  render(stats) {
    drawDebug(view, engine);
    status.textContent =
      `fps ${stats.fps}  rings ${rings.length}\n` +
      `scale ${view.scale.toFixed(2)}  ${canvas.clientWidth}x${canvas.clientHeight}\n` +
      `tap the tank to poke rings`;
  },
});
