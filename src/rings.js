// Ring bodies. Each ring is one physics body made of two small circles (the
// rims you'd see looking at a ring edge-on), with nothing solid in between.
import Matter from 'matter-js';
import { RING, TANK } from './config.js';

const { Bodies, Body, Composite } = Matter;

function createRing(x, y, angle, color) {
  const offset = RING.outerRadius - RING.rimRadius; // centre -> rim centre
  // Underwater plastic: no contact friction (water drag already slows sliding rings)
  const rimOptions = { restitution: 0.2, friction: 0, frictionStatic: 0 };
  const left = Bodies.circle(x - offset, y, RING.rimRadius, rimOptions);
  const right = Bodies.circle(x + offset, y, RING.rimRadius, rimOptions);

  const ring = Body.create({
    parts: [left, right],
    label: 'ring',
    restitution: 0.2,
    friction: 0,
    frictionStatic: 0,
    frictionAir: 0, // the water module handles all drag
  });
  Body.setAngle(ring, angle);
  ring.render.fillStyle = color; // our renderer reads this
  return ring;
}

// Place a fresh set of rings, removing `existing` ones.
//   'floor':   resting in a row on the tank floor, like the toy at the start
//   'scatter': scattered in the upper tank at random angles (for testing sinking)
export function spawnRings(world, existing = [], mode = 'floor') {
  for (const ring of existing) Composite.remove(world, ring);

  const colors = [...RING.colors].sort(() => Math.random() - 0.5); // shuffled order
  const rings = [];
  const margin = RING.outerRadius + 6;
  const floorY = TANK.y + TANK.height - RING.rimRadius - 1;
  const slot = (TANK.width - margin * 2) / Math.max(1, RING.count - 1);

  for (let i = 0; i < RING.count; i++) {
    let x, y, angle;
    if (mode === 'floor') {
      x = TANK.x + margin + i * slot + (Math.random() - 0.5) * 4;
      y = floorY;
      angle = (Math.random() - 0.5) * 0.1;
    } else {
      x = TANK.x + margin + Math.random() * (TANK.width - margin * 2);
      y = TANK.y + margin + Math.random() * (TANK.height * 0.45);
      angle = (Math.random() - 0.5) * Math.PI;
    }
    rings.push(createRing(x, y, angle, colors[i % colors.length]));
  }
  Composite.add(world, rings);
  return rings;
}
