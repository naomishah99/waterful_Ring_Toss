// Game loop with a fixed physics step.
//
// Phones refresh at different rates (60Hz, 90Hz, 120Hz) and sometimes lag.
// So we draw every frame, but always advance physics in equal 1/60s steps,
// running as many steps as real time requires. That keeps the game feeling the
// same on every device.
import { PHYSICS } from './config.js';

export function startLoop({ update, render }) {
  let last = performance.now();
  let accumulator = 0;
  let frames = 0;
  let fpsTimer = 0;
  const stats = { fps: 0, steps: 0 };

  function frame(now) {
    let elapsed = now - last;
    last = now;
    // After the tab was hidden or the phone froze, don't try to catch up on minutes of time
    elapsed = Math.min(elapsed, PHYSICS.stepMs * PHYSICS.maxStepsPerFrame);

    accumulator += elapsed;
    let steps = 0;
    while (accumulator >= PHYSICS.stepMs) {
      update(PHYSICS.stepMs);
      accumulator -= PHYSICS.stepMs;
      steps++;
    }
    stats.steps = steps;

    frames++;
    fpsTimer += elapsed;
    if (fpsTimer >= 500) {
      stats.fps = Math.round((frames * 1000) / fpsTimer);
      frames = 0;
      fpsTimer = 0;
    }

    render(stats);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
  return stats;
}
