// Debug touch controls (only while debug mode is on, so they can't be used to cheat):
//   - press on a ring and drag: the ring follows your finger on a springy line
//   - tap empty water: pushes nearby rings away ("poke")
import Matter from 'matter-js';
import { TANK } from './config.js';

const { Body, Constraint, Composite } = Matter;

const GRAB_RADIUS = 30; // how close to a ring's centre you need to press
const POKE_RADIUS = 90;
const POKE_STRENGTH = 9;

function inTank(p) {
  return p.x > TANK.x && p.x < TANK.x + TANK.width && p.y > TANK.y && p.y < TANK.y + TANK.height;
}

export function setupDebugInput({ canvas, view, engine, getRings }) {
  const drags = new Map(); // pointerId -> constraint (one per finger)
  let enabled = false;

  canvas.addEventListener('pointerdown', (e) => {
    if (!enabled) return;
    const p = view.toWorld(e.clientX, e.clientY);
    if (!inTank(p)) return;

    // Nearest ring under the finger?
    let nearest = null;
    let nearestDist = GRAB_RADIUS;
    for (const ring of getRings()) {
      const d = Math.hypot(ring.position.x - p.x, ring.position.y - p.y);
      if (d < nearestDist) {
        nearest = ring;
        nearestDist = d;
      }
    }

    if (nearest) {
      const constraint = Constraint.create({
        pointA: { x: p.x, y: p.y },
        bodyB: nearest,
        // grab where you touched, so the ring swings naturally
        pointB: { x: p.x - nearest.position.x, y: p.y - nearest.position.y },
        stiffness: 0.08,
        damping: 0.1,
        length: 0,
      });
      Composite.add(engine.world, constraint);
      drags.set(e.pointerId, constraint);
      try {
        canvas.setPointerCapture(e.pointerId); // keep getting moves even off the canvas
      } catch {
        // not a live pointer (e.g. a synthetic test event): dragging still works
      }
      return;
    }

    poke(getRings(), p);
  });

  canvas.addEventListener('pointermove', (e) => {
    const constraint = drags.get(e.pointerId);
    if (!constraint) return;
    const p = view.toWorld(e.clientX, e.clientY);
    constraint.pointA.x = p.x;
    constraint.pointA.y = p.y;
  });

  function release(e) {
    const constraint = drags.get(e.pointerId);
    if (!constraint) return;
    Composite.remove(engine.world, constraint);
    drags.delete(e.pointerId);
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  const api = {
    get enabled() {
      return enabled;
    },
    set enabled(value) {
      enabled = value;
      if (!value) api.releaseAll();
    },
    // Drop any grabs (e.g. when the rings are replaced)
    releaseAll() {
      for (const c of drags.values()) Composite.remove(engine.world, c);
      drags.clear();
    },
    drags,
  };
  return api;
}

function poke(rings, p) {
  for (const ring of rings) {
    const dx = ring.position.x - p.x;
    const dy = ring.position.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > POKE_RADIUS) continue;
    const push = POKE_STRENGTH * (1 - dist / POKE_RADIUS);
    const nx = dist > 0.001 ? dx / dist : 0;
    const ny = dist > 0.001 ? dy / dist : -1;
    Body.setVelocity(ring, {
      x: ring.velocity.x + nx * push,
      y: ring.velocity.y + ny * push - push * 0.5, // slight upward bias, like a jet
    });
    Body.setAngularVelocity(ring, ring.angularVelocity + (Math.random() - 0.5) * 0.3);
  }
}
