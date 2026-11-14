// Fake water. Instead of simulating real fluid, we keep a coarse grid of water
// velocities ("currents") over the tank and, every physics step:
//   - jets push the water in their cone upward
//   - moving water drags its neighbours along and slowly calms down
//   - each ring is pulled toward the speed of the water around it (drag),
//     gravity minus buoyancy makes it sink, and uneven currents spin it
//
// Velocities are in world units per physics step, because our step is always
// exactly 1/60 s (see loop.js), which is also Matter.js's base step.
import Matter from 'matter-js';
import { TANK, MAX_RING_SPEED } from './config.js';

const { Body } = Matter;
const CELL = 20; // grid cell size in world units
const JET_APEX_DEPTH = 40; // jet cone starts this far below the nozzle
const SUCTION = 0.3; // how strongly a firing jet draws water along the floor
const SUCTION_RANGE = 140; // ...from this far either side
const SUCTION_HEIGHT = 50; // ...in water this close to the floor

export function createWater() {
  const cols = Math.ceil(TANK.width / CELL);
  const rows = Math.ceil(TANK.height / CELL);
  const n = cols * rows;
  let ux = new Float32Array(n); // water velocity x per cell
  let uy = new Float32Array(n); // water velocity y per cell
  let nx = new Float32Array(n); // scratch buffers
  let ny = new Float32Array(n);

  const idx = (i, j) => j * cols + i;

  // Water velocity at any point (smoothly blended between cell centres)
  function sample(x, y) {
    const gx = Math.min(Math.max((x - TANK.x) / CELL - 0.5, 0), cols - 1.001);
    const gy = Math.min(Math.max((y - TANK.y) / CELL - 0.5, 0), rows - 1.001);
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const fx = gx - i;
    const fy = gy - j;
    const i1 = Math.min(i + 1, cols - 1);
    const j1 = Math.min(j + 1, rows - 1);
    const a = idx(i, j), b = idx(i1, j), c = idx(i, j1), d = idx(i1, j1);
    const lerp2 = (arr) =>
      (arr[a] * (1 - fx) + arr[b] * fx) * (1 - fy) + (arr[c] * (1 - fx) + arr[d] * fx) * fy;
    return { x: lerp2(ux), y: lerp2(uy) };
  }

  // jets: [{ x, y, power }] with power 0..1
  function step(p, jets) {
    const spread = (p.jetSpread * Math.PI) / 180;

    // 1. Jets push water in their cone. The cone starts from a point a little
    //    below the floor, so it's already as wide as the nozzle opening.
    for (const jet of jets) {
      if (jet.power < 0.001) continue;
      for (let j = 0; j < rows; j++) {
        const cy = TANK.y + (j + 0.5) * CELL;
        const up = jet.y + JET_APEX_DEPTH - cy; // distance above the cone's apex
        if (up <= 0) continue;
        for (let i = 0; i < cols; i++) {
          const cx = TANK.x + (i + 0.5) * CELL;
          const dx = cx - jet.x;

          // Water along the floor gets drawn toward a firing nozzle
          const fromFloor = jet.y - cy;
          if (fromFloor < SUCTION_HEIGHT && Math.abs(dx) < SUCTION_RANGE) {
            const pull = p.jetSpeed * jet.power * SUCTION * (1 - Math.abs(dx) / SUCTION_RANGE);
            ux[idx(i, j)] -= Math.sign(dx) * pull * 0.1;
          }

          const dist = Math.max(Math.hypot(dx, up), 1);
          if (dist > p.jetReach) continue;
          const off = Math.atan2(Math.abs(dx), up); // angle away from straight up
          if (off > spread) continue;
          const strength = (1 - dist / p.jetReach) * (1 - (off / spread) ** 2);
          const speed = p.jetSpeed * jet.power * strength;
          const dirX = dx / dist;
          const dirY = -up / dist;
          // Speed the water up along the jet direction (never slow it down)
          const k = idx(i, j);
          const along = ux[k] * dirX + uy[k] * dirY;
          const add = Math.max(0, speed - along) * 0.6;
          ux[k] += dirX * add;
          uy[k] += dirY * add;
        }
      }
    }

    // 2. Currents spread to neighbours and calm down. Walls block flow into them.
    const keep = 1 - p.currentDecay;
    const s = p.currentSpread;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = idx(i, j);
        const l = i > 0 ? k - 1 : k;
        const r = i < cols - 1 ? k + 1 : k;
        const t = j > 0 ? k - cols : k;
        const b = j < rows - 1 ? k + cols : k;
        let vx = (ux[k] * (1 - s) + ((ux[l] + ux[r] + ux[t] + ux[b]) / 4) * s) * keep;
        let vy = (uy[k] * (1 - s) + ((uy[l] + uy[r] + uy[t] + uy[b]) / 4) * s) * keep;
        // Water hitting the top or bottom turns sideways; hitting a side turns up/down
        if ((j === 0 && vy < 0) || (j === rows - 1 && vy > 0)) {
          vx += Math.sign(vx || (i < cols / 2 ? -1 : 1)) * Math.abs(vy) * 0.5;
          vy = 0;
        }
        if ((i === 0 && vx < 0) || (i === cols - 1 && vx > 0)) {
          vy += Math.sign(vy || 1) * Math.abs(vx) * 0.5;
          vx = 0;
        }
        nx[k] = vx;
        ny[k] = vy;
      }
    }
    [ux, nx] = [nx, ux];
    [uy, ny] = [ny, uy];
  }

  // `down` is a unit vector for the direction of gravity. Straight down for
  // now; tilting the phone will rotate it in Step 5.
  function applyToRings(rings, p, down = { x: 0, y: 1 }) {
    const sink = p.gravity * (1 - p.buoyancy); // net pull in water

    for (const ring of rings) {
      const u = sample(ring.position.x, ring.position.y);

      // Drag pulls the ring toward the water's own speed. A fixed part
      // (linear) plus a part that grows with the speed difference (quadratic).
      const wx = ring.velocity.x - u.x;
      const wy = ring.velocity.y - u.y;
      const diff = Math.hypot(wx, wy);
      const keep = Math.max(0, 1 - p.linearDrag - p.quadraticDrag * diff);
      let vx = u.x + wx * keep + down.x * sink;
      let vy = u.y + wy * keep + down.y * sink;

      // Hard speed limit so rings can't skip through thin pegs
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_RING_SPEED) {
        vx *= MAX_RING_SPEED / speed;
        vy *= MAX_RING_SPEED / speed;
      }
      Body.setVelocity(ring, { x: vx, y: vy });

      // Rotation: slow spinning; uneven currents across the ring spin it;
      // moving rings turn flat-side-down; random wobble.
      const [, rimA, rimB] = ring.parts;
      const uA = sample(rimA.position.x, rimA.position.y);
      const uB = sample(rimB.position.x, rimB.position.y);
      const normX = -Math.sin(ring.angle);
      const normY = Math.cos(ring.angle);
      const shear = (uB.x - uA.x) * normX + (uB.y - uA.y) * normY;

      const tiltFromFlat = ring.angle - Math.atan2(down.y, down.x) + Math.PI / 2;
      let av = ring.angularVelocity * (1 - p.angularDrag);
      av += p.tumble * shear;
      av -= p.flatten * Math.sin(2 * tiltFromFlat) * Math.min(diff, 3);
      av += (Math.random() - 0.5) * 2 * p.wobble;
      Body.setAngularVelocity(ring, av);
    }
  }

  // Shake: push all the water by (vx, vy), plus random swirls whose size
  // grows with `swirl`. Swirls make a shake stir things up instead of just
  // sliding everything one way.
  function shake(vx, vy, swirl) {
    for (let k = 0; k < n; k++) {
      ux[k] += vx;
      uy[k] += vy;
    }
    if (swirl <= 0) return;
    const SWIRLS = 3;
    const RADIUS = 80;
    for (let s = 0; s < SWIRLS; s++) {
      const cx = TANK.x + Math.random() * TANK.width;
      const cy = TANK.y + Math.random() * TANK.height;
      const spin = (Math.random() < 0.5 ? -1 : 1) * swirl;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const dx = TANK.x + (i + 0.5) * CELL - cx;
          const dy = TANK.y + (j + 0.5) * CELL - cy;
          const d = Math.hypot(dx, dy);
          if (d > RADIUS || d < 1) continue;
          const f = (spin * (1 - d / RADIUS)) / d;
          const k = idx(i, j);
          ux[k] += -dy * f;
          uy[k] += dx * f;
        }
      }
    }
  }

  function reset() {
    ux.fill(0);
    uy.fill(0);
  }

  return {
    cols,
    rows,
    cell: CELL,
    sample,
    step,
    applyToRings,
    shake,
    reset,
    get ux() { return ux; },
    get uy() { return uy; },
  };
}
