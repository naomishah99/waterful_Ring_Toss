// Pegs, and working out which rings are threaded onto them.
import Matter from 'matter-js';
import { PEGS, RING } from './config.js';

const { Bodies, Composite } = Matter;
const SLIPPERY = { friction: 0.05, frictionStatic: 0.05 }; // wet plastic

export function createPegs(world) {
  const pegs = PEGS.positions.map(({ x }, index) => {
    const height = PEGS.baseY - PEGS.tipY;
    const shaft = Bodies.rectangle(x, PEGS.tipY + height / 2, PEGS.width, height, {
      isStatic: true,
      label: 'peg',
      ...SLIPPERY,
      chamfer: { radius: [PEGS.width / 2, PEGS.width / 2, 0, 0] }, // rounded tip guides rings on
    });
    const stopper = Bodies.rectangle(
      x,
      PEGS.baseY + PEGS.stopperHeight / 2,
      PEGS.stopperWidth,
      PEGS.stopperHeight,
      { isStatic: true, label: 'stopper', chamfer: { radius: 2 }, ...SLIPPERY },
    );
    Composite.add(world, [shaft, stopper]);
    return { index, x, shaft, stopper, rings: new Set() };
  });
  return pegs;
}

// How many physics steps a ring has to stay on (or off) a peg before it
// counts, so a ring brushing past the tip doesn't flicker the score.
const ON_STEPS = 20;
const OFF_STEPS = 10;

// Is the peg passing through this ring's open middle right now?
function isThreaded(ring, peg) {
  const [, rimA, rimB] = ring.parts;
  const left = Math.min(rimA.position.x, rimB.position.x);
  const right = Math.max(rimA.position.x, rimB.position.x);
  const y = ring.position.y;
  return (
    peg.x > left &&
    peg.x < right &&
    y > PEGS.tipY + RING.rimRadius && // centre is below the tip
    y < PEGS.baseY + PEGS.stopperHeight // and above the stopper's bottom
  );
}

// Call once per physics step. Updates each peg's `rings` set and each ring's
// `onPeg` (the peg it's on, or null).
export function updateScoring(rings, pegs) {
  for (const ring of rings) {
    const state = (ring.plugin.scoring ??= { onPeg: null, counter: 0, candidate: null });
    const touching = pegs.find((peg) => isThreaded(ring, peg)) ?? null;

    if (touching === state.onPeg) {
      state.counter = 0;
      continue;
    }
    // Something changed: wait until it has been true for long enough
    if (touching !== state.candidate) {
      state.candidate = touching;
      state.counter = 0;
    }
    state.counter++;
    const needed = touching ? ON_STEPS : OFF_STEPS;
    if (state.counter >= needed) {
      state.onPeg?.rings.delete(ring);
      touching?.rings.add(ring);
      state.onPeg = touching;
      state.counter = 0;
    }
  }
}

export function totalScored(pegs) {
  return pegs.reduce((sum, peg) => sum + peg.rings.size, 0);
}

export function resetScoring(pegs) {
  for (const peg of pegs) peg.rings.clear();
}
