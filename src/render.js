// The game's look (Step 9). Moodboard: underwater light shining down through
// the water, a grey 90s bevelled window frame, and shiny "liquid glass"
// bubble buttons.
//
// Everything is drawn in world units (see view.js), back to front.
import Matter from 'matter-js';
import { WORLD, TANK, CONTROLS_AREA, RING, PEGS } from './config.js';

export const FONT = "'VT323', ui-monospace, monospace";

const C = {
  frame: '#c3c7cb', // 90s window grey
  light: '#ffffff',
  shadow: '#86898d',
  darkShadow: '#1d1f22',
  waterTop: '#9ff0f6',
  waterMid: '#2fb2e0',
  waterDeep: '#0b5aa3',
  floor: 'rgba(210, 245, 250, 0.35)',
};

const FLOOR = TANK.y + TANK.height;

// ---------- small helpers ----------

// 90s bevel: light on top/left and dark on bottom/right (raised), or the
// other way round (sunken)
function bevel(ctx, x, y, w, h, raised = true, depth = 2) {
  const tl = raised ? C.light : C.shadow;
  const br = raised ? C.darkShadow : C.light;
  const tl2 = raised ? '#e4e6e8' : C.darkShadow;
  const br2 = raised ? C.shadow : '#e4e6e8';
  ctx.lineWidth = 1;
  const edge = (a, b, i) => {
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(x + i + 0.5, y + h - i - 0.5);
    ctx.lineTo(x + i + 0.5, y + i + 0.5);
    ctx.lineTo(x + w - i - 0.5, y + i + 0.5);
    ctx.stroke();
    ctx.strokeStyle = b;
    ctx.beginPath();
    ctx.moveTo(x + w - i - 0.5, y + i + 0.5);
    ctx.lineTo(x + w - i - 0.5, y + h - i - 0.5);
    ctx.lineTo(x + i + 0.5, y + h - i - 0.5);
    ctx.stroke();
  };
  edge(tl, br, 0);
  if (depth > 1) edge(tl2, br2, 1);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Mix a hex colour toward black (amount < 0) or white (amount > 0)
const shadeCache = new Map();
function shade(hex, amount) {
  const key = hex + amount;
  if (shadeCache.has(key)) return shadeCache.get(key);
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const mix = (c) => Math.round(c + (target - c) * t);
  const out = `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  shadeCache.set(key, out);
  return out;
}

// ---------- the scene ----------

function drawFrame(ctx) {
  ctx.fillStyle = C.frame;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  bevel(ctx, 0, 0, WORLD.width, WORLD.height, true);
  // tank sits in a sunken well
  bevel(ctx, TANK.x - 3, TANK.y - 3, TANK.width + 6, TANK.height + 6, false);
}

function drawWater(ctx, t) {
  // Bright near the top where the light comes in, deep blue at the bottom
  const g = ctx.createLinearGradient(0, TANK.y, 0, FLOOR);
  g.addColorStop(0, C.waterTop);
  g.addColorStop(0.35, C.waterMid);
  g.addColorStop(1, C.waterDeep);
  ctx.fillStyle = g;
  ctx.fillRect(TANK.x, TANK.y, TANK.width, TANK.height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(TANK.x, TANK.y, TANK.width, TANK.height);
  ctx.clip();

  // Light rays fanning down from the top, swaying slowly
  for (let i = 0; i < 6; i++) {
    const sway = Math.sin(t * 0.25 + i * 1.7) * 14;
    const x0 = TANK.x + 20 + i * 58 + sway;
    const w0 = 14 + (i % 3) * 8;
    const len = 300 + (i % 2) * 120;
    const rg = ctx.createLinearGradient(0, TANK.y, 0, TANK.y + len);
    const a = 0.16 + 0.06 * Math.sin(t * 0.6 + i * 2.3);
    rg.addColorStop(0, `rgba(255, 255, 255, ${a})`);
    rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(x0, TANK.y);
    ctx.lineTo(x0 + w0, TANK.y);
    ctx.lineTo(x0 + w0 + 30 + len * 0.12, TANK.y + len);
    ctx.lineTo(x0 - 10 + len * 0.12, TANK.y + len);
    ctx.closePath();
    ctx.fill();
  }

  // Shimmering surface at the very top
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = TANK.x; x <= TANK.x + TANK.width; x += 6) {
    const y = TANK.y + 5 + Math.sin(x * 0.08 + t * 1.6) * 1.5;
    if (x === TANK.x) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Pale floor with rippling light (caustics)
  const fg = ctx.createLinearGradient(0, FLOOR - 46, 0, FLOOR);
  fg.addColorStop(0, 'rgba(210, 245, 250, 0)');
  fg.addColorStop(1, C.floor);
  ctx.fillStyle = fg;
  ctx.fillRect(TANK.x, FLOOR - 46, TANK.width, 46);
  ctx.strokeStyle = 'rgba(235, 255, 255, 0.28)';
  ctx.lineWidth = 1.2;
  for (let row = 0; row < 4; row++) {
    const baseY = FLOOR - 6 - row * 9;
    ctx.beginPath();
    for (let x = TANK.x; x <= TANK.x + TANK.width; x += 5) {
      const y =
        baseY +
        Math.sin(x * 0.07 + t * 1.1 + row * 1.9) * 2.2 +
        Math.sin(x * 0.19 - t * 0.8 + row) * 1.2;
      if (x === TANK.x) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawNozzles(ctx, jets) {
  for (const jet of jets) {
    const x = jet.x - 12;
    const y = FLOOR - 7;
    ctx.fillStyle = C.frame;
    ctx.fillRect(x, y, 24, 7);
    bevel(ctx, x, y, 24, 7, true, 1);
    ctx.fillStyle = C.darkShadow;
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 5 + i * 6, y + 2, 3, 3);
  }
}

function drawBubbles(ctx, bubbles) {
  ctx.lineWidth = 0.7;
  for (const b of bubbles) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (b.r > 1.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Glossy plastic peg (pearly white) with its stopper
function drawPeg(ctx, peg) {
  const x = peg.x;
  const top = PEGS.tipY;
  const h = PEGS.baseY - PEGS.tipY;
  const w = PEGS.width;
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#b9d3df');
  g.addColorStop(0.35, '#ffffff');
  g.addColorStop(1, '#8fb1c2');
  ctx.fillStyle = g;
  roundRect(ctx, x - w / 2, top, w, h + 1, [w / 2, w / 2, 0, 0]);
  ctx.fill();

  const sw = PEGS.stopperWidth;
  const sg = ctx.createLinearGradient(0, PEGS.baseY, 0, PEGS.baseY + PEGS.stopperHeight);
  sg.addColorStop(0, '#ffffff');
  sg.addColorStop(1, '#8fb1c2');
  ctx.fillStyle = sg;
  roundRect(ctx, x - sw / 2, PEGS.baseY, sw, PEGS.stopperHeight, 2);
  ctx.fill();
}

// Ring band seen almost edge-on, drawn in two halves so a peg can go between
function drawRing(ctx, ring, half, t) {
  const color = ring.render.fillStyle;
  const rx = RING.outerRadius - RING.rimRadius;
  const ry = 5;
  const back = half === 'back';
  const a0 = back ? Math.PI : 0;
  const a1 = back ? Math.PI * 2 : Math.PI;

  ctx.save();
  ctx.translate(ring.position.x, ring.position.y);
  ctx.rotate(ring.angle);
  ctx.lineCap = 'round';

  // Scored rings glow softly
  const scored = !!ring.plugin.scoring?.onPeg;
  if (scored && !back) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + 0.15 * Math.sin(t * 4)})`;
    ctx.lineWidth = RING.rimRadius * 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // dark edge, body colour, then a shiny highlight (front half only)
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = RING.rimRadius * 1.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, a0, a1);
  ctx.stroke();

  ctx.strokeStyle = back ? shade(color, -0.2) : color;
  ctx.lineWidth = RING.rimRadius * 1.25;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, a0, a1);
  ctx.stroke();

  if (!back) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -1.4, rx - 1, ry - 0.5, 0, Math.PI * 0.15, Math.PI * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

// Ring counts above each peg, in the VHS-style font
function drawPegScores(ctx, pegs) {
  ctx.font = `20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const peg of pegs) {
    const text = String(peg.rings.size);
    ctx.fillStyle = 'rgba(0, 40, 90, 0.35)';
    ctx.fillText(text, peg.x + 1, PEGS.tipY - 9);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, peg.x, PEGS.tipY - 10);
  }
}

// Liquid-glass reflections on the front of the tank
function drawGlass(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(TANK.x, TANK.y, TANK.width, TANK.height);
  ctx.clip();
  const g = ctx.createLinearGradient(TANK.x, TANK.y, TANK.x + 200, TANK.y + 260);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  g.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(TANK.x, TANK.y);
  ctx.lineTo(TANK.x + 150, TANK.y);
  ctx.lineTo(TANK.x, TANK.y + 220);
  ctx.closePath();
  ctx.fill();
  // thin vertical glints near the edges
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  roundRect(ctx, TANK.x + 6, TANK.y + 30, 3, TANK.height - 80, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(ctx, TANK.x + TANK.width - 10, TANK.y + 60, 2, TANK.height - 160, 1);
  ctx.fill();
  ctx.restore();
}

// ---------- controls ----------

// Glass bubble button. The water inside shows how full the pump is.
function drawButton(ctx, b, jet, t) {
  const r = jet?.held ? b.radius * 0.93 : b.radius;

  // sunken round socket in the grey panel
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius + 4, Math.PI * 0.25, Math.PI * 1.25, true);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.clip();

  // glass body
  const body = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
  body.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  body.addColorStop(0.45, 'rgba(190, 236, 248, 0.85)');
  body.addColorStop(1, 'rgba(70, 150, 200, 0.95)');
  ctx.fillStyle = body;
  ctx.fillRect(b.x - r, b.y - r, r * 2, r * 2);

  // water level inside = pump charge
  const charge = jet ? jet.charge : 1;
  const level = b.y + r - charge * r * 1.7;
  ctx.fillStyle = jet?.held ? 'rgba(10, 110, 200, 0.8)' : 'rgba(20, 140, 225, 0.7)';
  ctx.beginPath();
  ctx.moveTo(b.x - r, b.y + r);
  for (let x = -r; x <= r; x += 4) ctx.lineTo(b.x + x, level + Math.sin(x * 0.25 + t * 4) * 1.5);
  ctx.lineTo(b.x + r, b.y + r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // rim and shine
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.x, b.y, r - 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.ellipse(b.x - r * 0.3, b.y - r * 0.55, r * 0.38, r * 0.16, -0.35, 0, Math.PI * 2);
  ctx.fill();
}

// Spirit level between the buttons: the bubble drifts to the high side
function drawLevel(ctx, down) {
  const w = 70;
  const h = 18;
  const x = WORLD.width / 2 - w / 2;
  const y = CONTROLS_AREA.y + CONTROLS_AREA.height / 2 - h / 2;
  ctx.fillStyle = '#0b5aa3';
  ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(159, 240, 246, 0.9)');
  g.addColorStop(1, 'rgba(47, 178, 224, 0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  bevel(ctx, x, y, w, h, false);
  // centre marks
  ctx.fillStyle = 'rgba(0, 40, 90, 0.5)';
  ctx.fillRect(WORLD.width / 2 - 8, y + 3, 1, h - 6);
  ctx.fillRect(WORLD.width / 2 + 7, y + 3, 1, h - 6);
  // bubble
  const bx = WORLD.width / 2 - Math.max(-1, Math.min(1, down.x / 0.5)) * (w / 2 - 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(bx, y + h / 2, 7, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- main entry ----------

export function drawScene(view, engine, { pegs, jets, buttons, bubbles, down }) {
  const { ctx } = view;
  const t = performance.now() / 1000;
  view.clear(C.frame); // letterbox bars match the frame
  view.applyTransform();

  drawFrame(ctx);
  drawWater(ctx, t);
  drawNozzles(ctx, jets);

  const rings = Matter.Composite.allBodies(engine.world).filter((b) => b.label === 'ring');
  for (const ring of rings) drawRing(ctx, ring, 'back', t);
  for (const peg of pegs) drawPeg(ctx, peg);
  for (const ring of rings) drawRing(ctx, ring, 'front', t);

  drawBubbles(ctx, bubbles);
  drawPegScores(ctx, pegs);
  drawGlass(ctx);

  buttons.forEach((b, i) => drawButton(ctx, b, jets[i], t));
  drawLevel(ctx, down);
}
