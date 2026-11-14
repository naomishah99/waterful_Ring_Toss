// Step 5: tilt.
import Matter from 'matter-js';
import { RING } from './config.js';
import { createView } from './view.js';
import { createWorld } from './world.js';
import { startLoop } from './loop.js';
import { drawDebug } from './debugRender.js';
import { spawnRings } from './rings.js';
import { createWater } from './water.js';
import { createJets } from './jets.js';
import { setupControls, buttonLayout } from './controls.js';
import { createTilt } from './tilt.js';
import { showStartScreen } from './startScreen.js';
import { createPegs, updateScoring, totalScored, resetScoring } from './pegs.js';
import { createTuningPanel } from './tuningPanel.js';
import { setupDebugInput } from './debugInput.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');

const view = createView(canvas);
const { engine } = createWorld();
const pegs = createPegs(engine.world);
const water = createWater();
const jets = createJets();
const tilt = createTilt();
let rings = spawnRings(engine.world);

setupControls({ canvas, view, jets });
const input = setupDebugInput({ canvas, view, engine, getRings: () => rings });

const tuning = createTuningPanel({
  'Drop rings': () => {
    input.releaseAll();
    resetScoring(pegs);
    water.reset();
    rings = spawnRings(engine.world, rings);
  },
  'Re-level': () => tilt.relevel(),
});

showStartScreen(() => tilt.enable());

startLoop({
  update(dt) {
    tilt.state.amount = tuning.tiltAmount;
    tilt.update(dt / 1000);
    jets.update(dt / 1000);
    water.step(tuning, jets.jets);
    water.applyToRings(rings, tuning, tilt.down());
    Matter.Engine.update(engine, dt);
    updateScoring(rings, pegs);
  },
  render(stats) {
    drawDebug(view, engine, { pegs, water, jets: jets.jets, buttons: buttonLayout, down: tilt.down() });
    const tiltDeg = Math.round((tilt.state.angle * 180) / Math.PI);
    const tiltHelp = tilt.state.source === 'keys' ? '(arrow keys)' : '';
    status.textContent =
      `fps ${stats.fps}   scored ${totalScored(pegs)} / ${RING.count}\n` +
      `tilt ${tiltDeg}° ${tilt.state.source} ${tiltHelp}`;
  },
});

// Exposed for testing from the browser console
window.game = { engine, pegs, water, jets, tilt, get rings() { return rings; } };
