// Step 1: empty tank, fixed-step physics loop and debug drawing.
import Matter from 'matter-js';
import { TANK } from './config.js';
import { createView } from './view.js';
import { createWorld } from './world.js';
import { startLoop } from './loop.js';
import { drawDebug } from './debugRender.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');

const view = createView(canvas);
const { engine } = createWorld();

// Debug: tap inside the tank to drop a test ball, to check the walls and loop.
// (No water yet, so balls fall as if in air. Water comes in Step 2.)
const MAX_TEST_BALLS = 15;
const testBalls = [];
canvas.addEventListener('pointerdown', (e) => {
  const p = view.toWorld(e.clientX, e.clientY);
  const inTank =
    p.x > TANK.x && p.x < TANK.x + TANK.width && p.y > TANK.y && p.y < TANK.y + TANK.height;
  if (!inTank) return;
  const ball = Matter.Bodies.circle(p.x, p.y, 12, { restitution: 0.4, label: 'test' });
  Matter.Composite.add(engine.world, ball);
  testBalls.push(ball);
  if (testBalls.length > MAX_TEST_BALLS) Matter.Composite.remove(engine.world, testBalls.shift());
});

startLoop({
  update(dt) {
    Matter.Engine.update(engine, dt);
  },
  render(stats) {
    drawDebug(view, engine);
    status.textContent =
      `fps ${stats.fps}  bodies ${Matter.Composite.allBodies(engine.world).length}\n` +
      `scale ${view.scale.toFixed(2)}  ${canvas.clientWidth}x${canvas.clientHeight}\n` +
      `tap the tank to drop a test ball`;
  },
});
