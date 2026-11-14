// Fake water. Instead of simulating real fluid, every physics step we nudge
// each ring's velocity the way water would:
//   - gravity pulls it down, buoyancy cancels most of that, so it sinks slowly
//   - drag slows it down (more strongly the faster it goes)
//   - spinning slows down, moving rings turn flat-side-down, and they wobble a bit
//
// Velocities are in world units per physics step, because our step is always
// exactly 1/60 s (see loop.js), which is also Matter.js's base step.
import Matter from 'matter-js';
import { MAX_RING_SPEED } from './config.js';

const { Body } = Matter;

// `down` is a unit vector for the direction of gravity. It's straight down for
// now; tilting the phone will rotate it in Step 5.
export function applyWater(rings, p, down = { x: 0, y: 1 }) {
  const sink = p.gravity * (1 - p.buoyancy); // net downward pull in water

  for (const ring of rings) {
    let { x: vx, y: vy } = ring.velocity;

    // Gravity minus buoyancy
    vx += down.x * sink;
    vy += down.y * sink;

    // Drag: a fixed fraction (linear) plus a part that grows with speed (quadratic)
    const speed = Math.hypot(vx, vy);
    let keep = Math.max(0, 1 - p.linearDrag - p.quadraticDrag * speed);
    // Hard speed limit so rings can't skip through thin pegs
    if (speed * keep > MAX_RING_SPEED) keep = MAX_RING_SPEED / speed;
    vx *= keep;
    vy *= keep;
    Body.setVelocity(ring, { x: vx, y: vy });

    // Rotation: slow spinning, turn flat-side-down while moving, random wobble.
    // "Flat" means the ring's axis lines up with gravity, i.e. angle relative
    // to the floor is 0 or 180 degrees.
    const tiltFromFlat = ring.angle - Math.atan2(down.y, down.x) + Math.PI / 2;
    let av = ring.angularVelocity * (1 - p.angularDrag);
    av -= p.flatten * Math.sin(2 * tiltFromFlat) * Math.min(speed, 3);
    av += (Math.random() - 0.5) * 2 * p.wobble;
    Body.setAngularVelocity(ring, av);
  }
}
