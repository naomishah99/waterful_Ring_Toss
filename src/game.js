// Game rules: a round starts with every ring on the floor; the clock starts
// on your first button press; you win when every ring is on a peg.
//
// phase: 'ready'   - waiting for the first press
//        'playing' - clock running
//        'won'     - all rings on pegs; clock stopped
export function createGame({ ringCount, onWin }) {
  const state = {
    phase: 'ready',
    time: 0, // seconds of play
    presses: 0, // button presses this round
  };
  let pressBase = 0; // jets.pressCount when this round began

  return {
    state,

    // Start a new round. `pressCount` is the jets' running total right now.
    reset(pressCount) {
      state.phase = 'ready';
      state.time = 0;
      state.presses = 0;
      pressBase = pressCount;
    },

    // Call once per physics step. dt in seconds.
    update(dt, pressCount, scored) {
      if (state.phase === 'won') return;
      state.presses = pressCount - pressBase;
      if (state.phase === 'ready' && state.presses > 0) state.phase = 'playing';
      if (state.phase === 'playing') state.time += dt;
      // Scoring already waits for a ring to settle on a peg, so no extra delay
      if (scored >= ringCount) {
        state.phase = 'won';
        onWin?.({ time: state.time, presses: state.presses });
      }
    },
  };
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
