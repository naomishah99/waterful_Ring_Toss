// "Tap to start" screen. The tap is needed because iPhones only let a page ask
// for motion-sensor permission in response to a tap.
export function showStartScreen(onStart) {
  const overlay = document.createElement('div');
  overlay.className = 'start-screen';
  overlay.innerHTML = `
    <button class="start-button" type="button">Tap to start</button>
    <p>Hold your phone the way you want to play.<br />That position counts as level.</p>
  `;
  document.body.append(overlay);

  overlay.querySelector('button').addEventListener(
    'click',
    async () => {
      overlay.querySelector('p').textContent = 'Starting…';
      await onStart();
      overlay.remove();
    },
    { once: true },
  );
}
