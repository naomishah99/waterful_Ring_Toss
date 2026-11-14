// Shake: moving the phone sharply sloshes the water.
//
// Real physics: when you jerk a tank one way, the water inside lags behind,
// so relative to the tank it moves the *opposite* way. We read the phone's
// acceleration (gravity removed), and push the water opposite to it.
//
// Ignoring small accelerations (a "dead zone") means slow tilting and hand
// wobble do nothing; only real shakes count.
//
// On a laptop, press Space for a shake.
import { deviceToScreen } from './sensors.js';

const DEAD_ZONE = 4; // m/s². Below this, it's not a shake
const GRAVITY_SMOOTHING = 0.1; // for phones that don't report acceleration without gravity
const SHAKE_COOLDOWN_MS = 300; // for counting separate shakes
const KEY_SHAKE = 18; // m/s², how hard a Space-key shake is
const KEY_SHAKE_MS = 120; // and how long it lasts

export function createShake() {
  const state = {
    count: 0, // number of separate shakes detected
    level: 0, // current shake strength above the dead zone (m/s²), for display
  };
  // Water push collected since the last physics step, in m/s² * seconds
  let pending = { x: 0, y: 0, strength: 0 };
  let gravityEstimate = null;
  let lastShakeAt = -Infinity;
  let lastEventAt = 0;

  // `accel` is the phone's acceleration in screen axes (m/s², y down)
  function addAcceleration(accel, dt) {
    const mag = Math.hypot(accel.x, accel.y);
    if (mag <= DEAD_ZONE) {
      state.level = 0;
      return;
    }
    const over = mag - DEAD_ZONE; // only the part above the dead zone counts
    state.level = over;
    // Water lags behind the tank: it's pushed the opposite way
    pending.x -= (accel.x / mag) * over * dt;
    pending.y -= (accel.y / mag) * over * dt;
    pending.strength += over * dt;

    const now = performance.now();
    if (now - lastShakeAt > SHAKE_COOLDOWN_MS) state.count++;
    lastShakeAt = now;
  }

  function onMotion(e) {
    const now = performance.now();
    // Time since the last reading, in seconds (capped, in case of gaps)
    const dt = lastEventAt ? Math.min((now - lastEventAt) / 1000, 0.05) : 1 / 60;
    lastEventAt = now;

    let lin;
    const a = e.acceleration;
    if (a && a.x != null && a.y != null) {
      lin = { x: a.x, y: a.y };
    } else {
      // No gravity-free reading: estimate gravity by smoothing, and subtract it
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      gravityEstimate = gravityEstimate
        ? {
            x: gravityEstimate.x + (g.x - gravityEstimate.x) * GRAVITY_SMOOTHING,
            y: gravityEstimate.y + (g.y - gravityEstimate.y) * GRAVITY_SMOOTHING,
          }
        : { x: g.x, y: g.y };
      lin = { x: g.x - gravityEstimate.x, y: g.y - gravityEstimate.y };
    }
    addAcceleration(deviceToScreen(lin.x, lin.y), dt);
  }

  // Space key: a quick jolt in a random sideways-ish direction
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    const angle = Math.random() * Math.PI * 2;
    const accel = { x: Math.cos(angle) * KEY_SHAKE, y: Math.sin(angle) * KEY_SHAKE };
    const steps = Math.round(KEY_SHAKE_MS / 16);
    for (let i = 0; i < steps; i++) addAcceleration(accel, 0.016);
  });

  return {
    state,

    // Start listening to the sensor (only after permission was granted)
    start() {
      window.addEventListener('devicemotion', onMotion);
    },

    // Called once per physics step: returns the push collected since last time
    take() {
      const out = pending;
      if (out.strength === 0) state.level = 0; // nothing this step: not shaking
      pending = { x: 0, y: 0, strength: 0 };
      return out;
    },

    _onMotion: onMotion, // for testing
  };
}
