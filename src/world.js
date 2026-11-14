// Creates the physics world and the tank walls.
import Matter from 'matter-js';
import { TANK } from './config.js';

const { Engine, Bodies, Composite } = Matter;

export function createWorld() {
  const engine = Engine.create();
  // Matter's built-in gravity is off: water.js applies gravity and buoyancy itself.
  engine.gravity.scale = 0;

  const t = TANK.wallThickness;
  const { x, y, width: w, height: h } = TANK;
  // Slippery like wet plastic (Matter uses the stickier of two touching bodies)
  const wallOptions = { isStatic: true, label: 'wall', friction: 0.05, frictionStatic: 0.05 };

  // Each wall sits just outside the tank's inner edge.
  const walls = [
    Bodies.rectangle(x + w / 2, y - t / 2, w + t * 2, t, wallOptions), // top
    Bodies.rectangle(x + w / 2, y + h + t / 2, w + t * 2, t, wallOptions), // bottom
    Bodies.rectangle(x - t / 2, y + h / 2, t, h + t * 2, wallOptions), // left
    Bodies.rectangle(x + w + t / 2, y + h / 2, t, h + t * 2, wallOptions), // right
  ];
  Composite.add(engine.world, walls);

  return { engine, walls };
}
