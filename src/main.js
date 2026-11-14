// Step 3: pegs and scoring.
import Matter from 'matter-js';
import { RING } from './config.js';
import { createView } from './view.js';
import { createWorld } from './world.js';
import { startLoop } from './loop.js';
import { drawDebug } from './debugRender.js';
import { spawnRings } from './rings.js';
import { applyWater } from './water.js';
import { createPegs, updateScoring, totalScored, resetScoring } from './pegs.js';
import { createTuningPanel } from './tuningPanel.js';
import { setupDebugInput } from './debugInput.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');

const view = createView(canvas);
const { engine } = createWorld();
const pegs = createPegs(engine.world);
let rings = spawnRings(engine.world);

const input = setupDebugInput({ canvas, view, engine, getRings: () => rings });

const water = createTuningPanel({
  'Drop rings': () => {
    input.releaseAll();
    resetScoring(pegs);
    rings = spawnRings(engine.world, rings);
  },
});

startLoop({
  update(dt) {
    applyWater(rings, water);
    Matter.Engine.update(engine, dt);
    updateScoring(rings, pegs);
  },
  render(stats) {
    drawDebug(view, engine, pegs);
    status.textContent =
      `fps ${stats.fps}   scored ${totalScored(pegs)} / ${RING.count}\n` +
      `drag a ring onto a peg, or tap water to poke`;
  },
});

// Exposed for testing from the browser console
window.game = { engine, pegs, get rings() { return rings; } };
