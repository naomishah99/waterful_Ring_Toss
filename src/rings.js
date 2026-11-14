// Ring bodies. Each ring is one physics body made of two small circles (the
// rims you'd see looking at a ring edge-on), with nothing solid in between.
import Matter from 'matter-js';
import { RING, TANK } from './config.js';

const { Bodies, Body, Composite } = Matter;

function createRing(x, y, angle, color) {
  const offset = RING.outerRadius - RING.rimRadius; // centre -> rim centre
  const rimOptions = { restitution: 0.2, friction: 0.05 };
  const left = Bodies.circle(x - offset, y, RING.rimRadius, rimOptions);
  const right = Bodies.circle(x + offset, y, RING.rimRadius, rimOptions);

  const ring = Body.create({
    parts: [left, right],
    label: 'ring',
    restitution: 0.2,
    friction: 0.05,
    frictionAir: 0, // the water module handles all drag
  });
  Body.setAngle(ring, angle);
  ring.render.fillStyle = color; // our renderer reads this
  return ring;
}

// Scatter rings across the upper part of the tank, at random angles.
export function spawnRings(world, existing = []) {
  for (const ring of existing) Composite.remove(world, ring);

  const rings = [];
  const margin = RING.outerRadius + 6;
  for (let i = 0; i < RING.count; i++) {
    const x = TANK.x + margin + Math.random() * (TANK.width - margin * 2);
    const y = TANK.y + margin + Math.random() * (TANK.height * 0.45);
    const angle = (Math.random() - 0.5) * Math.PI;
    rings.push(createRing(x, y, angle, RING.colors[i % RING.colors.length]));
  }
  Composite.add(world, rings);
  return rings;
}
