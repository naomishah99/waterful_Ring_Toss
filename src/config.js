// All game measurements are in "world units", not screen pixels.
// The world is always 360 x 640 (a 9:16 portrait phone shape) and gets scaled to
// fit whatever screen it's on, so physics behaves the same on every phone.

export const WORLD = {
  width: 360,
  height: 640,
};

// The water tank, inside the world. The space below it is kept free for the
// jet buttons (Step 4).
export const TANK = {
  x: 16,
  y: 16,
  width: 328,
  height: 500,
  wallThickness: 60, // thick walls so fast-moving rings can't pass through
};

export const CONTROLS_AREA = {
  y: TANK.y + TANK.height + 12,
  height: WORLD.height - (TANK.y + TANK.height + 12) - 16,
};

export const PHYSICS = {
  stepMs: 1000 / 60, // fixed physics step: 60 updates per second on every device
  maxStepsPerFrame: 5, // if the phone lags, catch up at most this many steps
};

// Rings, seen from the side: two solid "rim" circles with an open gap between
// them, so a peg can pass through the middle (Step 3).
export const RING = {
  count: 8,
  outerRadius: 18, // centre of ring to its outer edge
  rimRadius: 4.5, // thickness of the ring band
  colors: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#f15bb5', '#00f5d4'],
};

// Pegs stick up in the middle of the tank (in the toy they're fixed to the back
// wall). Each has a wider "stopper" at its base that threaded rings rest on.
// A ring's open middle is 18 units wide, so a 8-unit peg fits through easily
// but the 34-unit stopper doesn't.
export const PEGS = {
  positions: [{ x: 120 }, { x: 240 }],
  tipY: 230, // top of the peg
  baseY: 300, // top of the stopper
  width: 8,
  stopperWidth: 34,
  stopperHeight: 6,
};

// Water behaviour. Speeds are in world units per physics step (1/60 s).
// These are the starting values; the tuning panel can change them live.
export const WATER_DEFAULTS = {
  gravity: 0.28, // pull downward (same as normal air gravity)
  buoyancy: 0.8, // fraction of gravity the water cancels out (1 = floats in place)
  linearDrag: 0.03, // slows everything a little each step: sets the slow sinking speed
  quadraticDrag: 0.008, // slows fast things a lot more: tames hard jets and shakes
  angularDrag: 0.06, // slows spinning
  flatten: 0.004, // tendency of a moving ring to turn flat-side-down, like a falling coin
  wobble: 0.0015, // small random turning, so rings flutter as they sink
};

// Hard speed limit (units per step). Thin pegs could otherwise be skipped
// over by a ring moving further than its own thickness in one step.
export const MAX_RING_SPEED = 8;
