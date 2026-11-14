// Step 0: placeholder page that proves the build, deploy and physics library work.
// The real game loop starts in Step 1.
import Matter from 'matter-js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('Water Ring Toss', w / 2, h / 2);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Step 0: setup works', w / 2, h / 2 + 26);
}

window.addEventListener('resize', resize);
resize();

status.textContent = [
  `matter-js ${Matter.version}`,
  `https: ${location.protocol === 'https:'}`,
  `motion api: ${'DeviceMotionEvent' in window}`,
  `screen: ${innerWidth}x${innerHeight} @${devicePixelRatio}x`,
].join('\n');
