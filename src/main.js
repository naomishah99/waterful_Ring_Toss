// Step 9: visual design. Debug tools only with ?debug in the URL.
import Matter from 'matter-js';
import '@fontsource/vt323';
import { RING } from './config.js';
import { createView } from './view.js';
import { createWorld } from './world.js';
import { startLoop } from './loop.js';
import { drawScene } from './render.js';
import { drawDebug } from './debugRender.js';
import { createBubbles } from './bubbles.js';
import { spawnRings } from './rings.js';
import { createWater } from './water.js';
import { createJets } from './jets.js';
import { setupControls, buttonLayout } from './controls.js';
import { createTilt } from './tilt.js';
import { createShake } from './shake.js';
import { showStartScreen } from './startScreen.js';
import { createPegs, updateScoring, totalScored, resetScoring } from './pegs.js';
import { createGame } from './game.js';
import { createHud } from './hud.js';
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
const shake = createShake();
const bubbles = createBubbles();
let rings = spawnRings(engine.world);

setupControls({ canvas, view, jets });
const debugInput = setupDebugInput({ canvas, view, engine, getRings: () => rings });

const hud = createHud({ onRestart: () => newRound('floor') });
const game = createGame({ ringCount: RING.count, onWin: (result) => hud.showWin(result) });

// Start a fresh round with the rings placed by `mode` ('floor' or 'scatter')
function newRound(mode) {
  debugInput.releaseAll();
  resetScoring(pegs);
  water.reset();
  jets.reset();
  bubbles.reset();
  rings = spawnRings(engine.world, rings, mode);
  game.reset(jets.pressCount);
  hud.hideWin();
}

// Dragging/poking rings is a testing tool only: it isn't offered in the real
// game. Add ?debug to the URL to get the toggle.
const debugAllowed = new URLSearchParams(location.search).has('debug');
const tuning = createTuningPanel({
  'Re-level': () => tilt.relevel(),
  ...(debugAllowed && {
    'Drop rings from top': () => newRound('scatter'),
    'Debug: off': (e) => {
      debugInput.enabled = !debugInput.enabled;
      e.currentTarget.textContent = `Debug: ${debugInput.enabled ? 'on' : 'off'}`;
      status.classList.toggle('debug-on', debugInput.enabled);
    },
  }),
});

showStartScreen(async () => {
  const source = await tilt.enable();
  if (source === 'sensor') shake.start();
});

startLoop({
  update(dt) {
    tilt.state.amount = tuning.tiltAmount;
    tilt.state.limit = (tuning.tiltLimit * Math.PI) / 180;
    tilt.update(dt / 1000);
    jets.update(dt / 1000);
    const jolt = shake.take();
    if (jolt.strength > 0) {
      water.shake(jolt.x * tuning.shakeStrength, jolt.y * tuning.shakeStrength, jolt.strength * tuning.shakeSwirl);
      bubbles.burst(jolt.strength);
    }
    water.step(tuning, jets.jets);
    water.applyToRings(rings, tuning, tilt.down());
    bubbles.step(jets.jets, water);
    Matter.Engine.update(engine, dt);
    updateScoring(rings, pegs);
    game.update(dt / 1000, jets.pressCount, totalScored(pegs));
  },
  render(stats) {
    drawScene(view, engine, { pegs, jets: jets.jets, buttons: buttonLayout, bubbles: bubbles.list, down: tilt.down() });
    if (debugInput.enabled) drawDebug(view, engine, { water });
    hud.update(game, totalScored(pegs), RING.count);
    if (debugInput.enabled) {
      const tiltDeg = Math.round((tilt.state.angle * 180) / Math.PI);
      const keysHelp = tilt.state.source === 'keys' ? ' (arrows, space)' : '';
      status.textContent =
        `fps ${stats.fps}  ${game.state.phase}\n` +
        `tilt ${tiltDeg}° ${tilt.state.source}${keysHelp}\n` +
        `shakes ${shake.state.count} ${shake.state.level > 0 ? '~' : ''}\n` +
        `drag rings, or tap water to poke`;
    }
  },
});

// Exposed for testing from the browser console
window.game = { Matter, engine, pegs, water, jets, tilt, shake, bubbles, game, debugInput, get rings() { return rings; } };
