// Creates the physics world and the tank walls.
import Matter from 'matter-js';
import { TANK, PHYSICS } from './config.js';

const { Engine, Bodies, Composite } = Matter;

export function createWorld() {
  const engine = Engine.create();
  engine.gravity.y = PHYSICS.gravity;

  const t = TANK.wallThickness;
  const { x, y, width: w, height: h } = TANK;
  const wallOptions = { isStatic: true, label: 'wall' };

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
