// On-screen tuning panel: sliders that change the water settings live, so we
// can tune the feel on a real phone. Values are remembered on this device.
import { WATER_DEFAULTS } from './config.js';

const STORAGE_KEY = 'ringtoss.water.v2'; // v2: drag now works relative to the water, so old saved values don't apply

const SLIDERS = [
  { key: 'gravity', min: 0, max: 0.8, step: 0.01 },
  { key: 'buoyancy', min: 0, max: 1, step: 0.01 },
  { key: 'linearDrag', min: 0, max: 0.15, step: 0.002 },
  { key: 'quadraticDrag', min: 0, max: 0.05, step: 0.001 },
  { key: 'angularDrag', min: 0, max: 0.3, step: 0.005 },
  { key: 'flatten', min: 0, max: 0.02, step: 0.0005 },
  { key: 'wobble', min: 0, max: 0.01, step: 0.0005 },
  { key: 'jetSpeed', min: 0, max: 25, step: 0.5 },
  { key: 'jetReach', min: 100, max: 600, step: 10 },
  { key: 'jetSpread', min: 5, max: 60, step: 1 },
  { key: 'currentDecay', min: 0, max: 0.15, step: 0.005 },
  { key: 'currentSpread', min: 0, max: 0.6, step: 0.02 },
  { key: 'tumble', min: 0, max: 0.1, step: 0.002 },
  { key: 'tiltAmount', min: 0, max: 2, step: 0.05 },
  { key: 'shakeStrength', min: 0, max: 15, step: 0.5 },
  { key: 'shakeSwirl', min: 0, max: 10, step: 0.25 },
];

function load() {
  try {
    return { ...WATER_DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...WATER_DEFAULTS };
  }
}

function save(params) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // storage blocked (e.g. private browsing): settings just won't be remembered
  }
}

// Returns the live params object; `actions` adds extra buttons (label -> function).
export function createTuningPanel(actions = {}) {
  const params = load();

  const toggle = document.createElement('button');
  toggle.className = 'tune-toggle';
  toggle.textContent = 'Tune';

  const panel = document.createElement('div');
  panel.className = 'tune-panel';
  panel.hidden = true;

  const inputs = {};
  for (const s of SLIDERS) {
    const row = document.createElement('label');
    const name = document.createElement('span');
    const value = document.createElement('output');
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min: s.min, max: s.max, step: s.step });
    name.textContent = s.key;
    input.addEventListener('input', () => {
      params[s.key] = Number(input.value);
      value.textContent = input.value;
      save(params);
    });
    inputs[s.key] = { input, value };
    row.append(name, value, input);
    panel.append(row);
  }

  function syncInputs() {
    for (const s of SLIDERS) {
      inputs[s.key].input.value = params[s.key];
      inputs[s.key].value.textContent = params[s.key];
    }
  }
  syncInputs();

  const buttons = document.createElement('div');
  buttons.className = 'tune-buttons';
  const allActions = {
    ...actions,
    Defaults: () => {
      Object.assign(params, WATER_DEFAULTS);
      save(params);
      syncInputs();
    },
    'Copy values': () => {
      navigator.clipboard?.writeText(JSON.stringify(params, null, 2)).catch(() => {});
    },
  };
  for (const [label, fn] of Object.entries(allActions)) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', fn);
    buttons.append(b);
  }
  panel.append(buttons);

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.textContent = panel.hidden ? 'Tune' : 'Close';
  });

  document.body.append(toggle, panel);
  return params;
}
