// Step 4: buttons and water jets.
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
});

startLoop({
  update(dt) {
    jets.update(dt / 1000);
    water.step(tuning, jets.jets);
    water.applyToRings(rings, tuning);
    Matter.Engine.update(engine, dt);
    updateScoring(rings, pegs);
  },
  render(stats) {
    drawDebug(view, engine, { pegs, water, jets: jets.jets, buttons: buttonLayout });
    status.textContent =
      `fps ${stats.fps}   scored ${totalScored(pegs)} / ${RING.count}\n` +
      `buttons (or A / L keys) fire jets`;
  },
});

// Exposed for testing from the browser console
window.game = { engine, pegs, water, jets, get rings() { return rings; } };
