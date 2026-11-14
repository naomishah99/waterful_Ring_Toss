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
  gravity: 1,
};
