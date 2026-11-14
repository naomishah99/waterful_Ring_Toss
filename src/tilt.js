// Tilt: which way is "down" for the rings.
//
// On a phone we read the motion sensor's gravity reading (accelerationIncludingGravity),
// smooth it, and measure how far it has rotated, in the plane of the screen,
// from the "level" captured when the game starts. Measuring relative to that
// starting position means:
//   - whatever angle you hold the phone at to play counts as level
//   - it works even though some phones report the reading with flipped signs
//
// On a laptop (no sensor), hold the left / right arrow keys to tilt.

import { deviceToScreen } from './sensors.js';

const SMOOTHING = 0.15; // 0..1 per reading: lower = smoother but laggier
const MIN_READING = 1.5; // m/s². Below this, the phone is too flat to tell direction
const CALIBRATION_SAMPLES = 15; // readings averaged to find "level"
const KEY_TILT = (35 * Math.PI) / 180; // how far the arrow keys tilt
const KEY_EASE = 4; // how quickly key tilt eases in/out (per second)
const SENSOR_TIMEOUT_MS = 1500; // no readings by then -> assume no sensor

// Angle (radians) of gravity in screen space, measured from straight down,
// positive when it points toward the right of the screen.
function gravityAngle(x, y) {
  return Math.atan2(x, y);
}

function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function createTilt() {
  const state = {
    source: 'none', // 'sensor' | 'keys' | 'none'
    angle: 0, // current tilt in radians (+ = right side down)
    amount: 1, // multiplier from the tuning panel
    limit: Math.PI / 6, // most "down" can lean either way (radians), from the tuning panel
  };
  let smooth = null; // smoothed gravity vector, screen coords (y down)
  let reference = null; // gravity angle counted as level
  let calibration = [];
  let keyTarget = 0;
  const keysDown = new Set();

  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null) return;
    state.source = 'sensor';

    // The sensor reports the push *against* gravity, so flip it to get gravity,
    // then convert to screen axes.
    const v = deviceToScreen(-a.x, -a.y);

    smooth = smooth
      ? { x: smooth.x + (v.x - smooth.x) * SMOOTHING, y: smooth.y + (v.y - smooth.y) * SMOOTHING }
      : v;
    if (Math.hypot(smooth.x, smooth.y) < MIN_READING) return; // too flat: keep last tilt

    if (reference === null) {
      calibration.push({ ...smooth });
      if (calibration.length < CALIBRATION_SAMPLES) return;
      const sum = calibration.reduce((s, c) => ({ x: s.x + c.x, y: s.y + c.y }), { x: 0, y: 0 });
      reference = gravityAngle(sum.x, sum.y);
      calibration = [];
    }
    state.angle = wrapAngle(gravityAngle(smooth.x, smooth.y) - reference);
  }

  function onKey(e, down) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (down) keysDown.add(e.key);
    else keysDown.delete(e.key);
    keyTarget = (keysDown.has('ArrowRight') ? KEY_TILT : 0) - (keysDown.has('ArrowLeft') ? KEY_TILT : 0);
    if (state.source !== 'sensor') state.source = 'keys';
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  return {
    state,

    // Must be called from a tap (iPhone only allows the permission prompt then).
    // Resolves to 'sensor', 'keys' (no sensor / denied) once known.
    async enable() {
      const DME = window.DeviceMotionEvent;
      if (!DME) {
        state.source = 'keys';
        return state.source;
      }
      if (typeof DME.requestPermission === 'function') {
        try {
          const result = await DME.requestPermission();
          if (result !== 'granted') {
            state.source = 'keys';
            return state.source;
          }
        } catch {
          state.source = 'keys';
          return state.source;
        }
      }
      window.addEventListener('devicemotion', onMotion);
      // Laptops often have the API but never send readings
      await new Promise((resolve) => setTimeout(resolve, SENSOR_TIMEOUT_MS));
      if (state.source !== 'sensor') state.source = 'keys';
      return state.source;
    },

    // Treat the current phone position as level
    relevel() {
      reference = null;
      calibration = [];
      state.angle = 0;
    },

    // dt in seconds. Eases keyboard tilt.
    update(dt) {
      if (state.source === 'sensor') return;
      const step = Math.min(1, dt * KEY_EASE);
      state.angle += (keyTarget - state.angle) * step;
    },

    // Unit vector for "down" in the game, after the tuning multiplier. Capped
    // so even a phone turned upside down only slides rings sideways; it never
    // lifts them (only the jets and shaking should do that).
    down() {
      const a = Math.max(-state.limit, Math.min(state.limit, state.angle * state.amount));
      return { x: Math.sin(a), y: Math.cos(a) };
    },

    // Exposed for the shake detector (Step 6) and testing
    _onMotion: onMotion,
  };
}
