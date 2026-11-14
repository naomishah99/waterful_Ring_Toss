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
  buoyancy: 0.6, // fraction of gravity the water cancels out (1 = floats in place)
  linearDrag: 0.08, // slows everything a little each step: sets the slow sinking speed
  quadraticDrag: 0.008, // slows fast things a lot more: tames hard jets and shakes
  angularDrag: 0.06, // slows spinning
  flatten: 0.004, // tendency of a moving ring to turn flat-side-down, like a falling coin
  wobble: 0.0015, // small random turning, so rings flutter as they sink
  // Jets and currents (Step 4)
  jetSpeed: 22, // water speed right at a nozzle during a full pump stroke
  jetReach: 380, // how far up the jet reaches
  jetSpread: 28, // half-width of the jet cone, in degrees
  currentDecay: 0.025, // how quickly stirred-up water calms down
  currentSpread: 0.1, // how much moving water drags its neighbours along
  tumble: 0.02, // how much uneven currents spin a ring
  // Tilt (Step 5)
  tiltAmount: 1, // 1 = real tilt; higher exaggerates it, 0 turns it off
};

// Water jet nozzles on the tank floor, and the pump that drives each one.
// Like the toy: each press is one pump stroke (a burst that fades); the pump
// refills while the button is up, so rhythmic pressing works best.
export const JETS = {
  nozzles: [{ x: 98 }, { x: 262 }],
  strokeRise: 0.05, // seconds for a stroke to reach full power
  strokeFade: 0.3, // seconds for a stroke to fade (keeps fading while held)
  refillTime: 0.4, // seconds with the button up to fully refill the pump
};

// On-screen buttons, one per nozzle, in the area under the tank
export const BUTTONS = {
  radius: 34,
  hitRadius: 50, // a little forgiving for thumbs
};

// Hard speed limit (units per step). Thin pegs could otherwise be skipped
// over by a ring moving further than its own thickness in one step.
export const MAX_RING_SPEED = 8;
