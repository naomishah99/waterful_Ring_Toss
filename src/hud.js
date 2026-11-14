// Heads-up display: time, presses and rings scored, a Restart button, and the
// "you won" screen. Plain for now; styled properly in Phase 2.
import { formatTime } from './game.js';

const pressesText = (n) => `${n} ${n === 1 ? 'press' : 'presses'}`;

export function createHud({ onRestart }) {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.setAttribute('aria-live', 'polite');

  const restart = document.createElement('button');
  restart.className = 'restart-button';
  restart.type = 'button';
  restart.textContent = 'Restart';
  restart.addEventListener('click', () => {
    restart.blur(); // so Space (shake on a laptop) doesn't press it again
    onRestart();
  });

  document.body.append(hud, restart);

  let winScreen = null;
  let lastText = '';

  return {
    update(game, scored, total) {
      const { time, presses } = game.state;
      const text = `${formatTime(time)} · ${pressesText(presses)} · ${scored}/${total}`;
      if (text !== lastText) {
        hud.textContent = text;
        lastText = text;
      }
    },

    showWin({ time, presses }) {
      winScreen?.remove();
      winScreen = document.createElement('div');
      winScreen.className = 'win-screen';
      winScreen.innerHTML = `
        <h2>All rings on!</h2>
        <p>Time ${formatTime(time)} · ${pressesText(presses)}</p>
        <button class="start-button" type="button">Play again</button>
      `;
      winScreen.querySelector('button').addEventListener('click', onRestart);
      document.body.append(winScreen);
    },

    hideWin() {
      winScreen?.remove();
      winScreen = null;
    },
  };
}
