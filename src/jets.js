// Pump-driven water jets, one per button.
//
// Like the toy's plunger: pressing gives one stroke, a quick burst that fades
// even if you keep holding. Letting go refills the pump, so the next press is
// only as strong as the refill you allowed. Quick rhythmic pumping works best.
import { JETS, TANK } from './config.js';

export function createJets() {
  const jets = JETS.nozzles.map(({ x }) => ({
    x,
    y: TANK.y + TANK.height, // on the tank floor
    held: false,
    charge: 1, // how full the pump is (0..1)
    strokePower: 0, // charge used by the current stroke
    strokeTime: 0, // seconds since this press started
    power: 0, // current jet output (0..1), read by the water
  }));

  const api = {
    jets,
    pressCount: 0, // total button presses, for the game's press counter

    press(i) {
      const jet = jets[i];
      if (!jet || jet.held) return;
      api.pressCount++;
      jet.held = true;
      jet.strokePower = jet.charge;
      jet.charge = 0;
      jet.strokeTime = 0;
    },

    release(i) {
      const jet = jets[i];
      if (jet) jet.held = false;
    },

    // dt in seconds
    update(dt) {
      for (const jet of jets) {
        if (jet.held) {
          jet.strokeTime += dt;
          const t = jet.strokeTime;
          const shape =
            t < JETS.strokeRise ? t / JETS.strokeRise : Math.exp(-(t - JETS.strokeRise) / JETS.strokeFade);
          jet.power = jet.strokePower * shape;
        } else {
          jet.power = 0;
          jet.charge = Math.min(1, jet.charge + dt / JETS.refillTime);
        }
      }
    },

    reset() {
      for (const jet of jets) Object.assign(jet, { held: false, charge: 1, power: 0 });
    },
  };
  return api;
}
