// Plain "debug" drawing: outlines of every physics body plus layout guides.
// This gets replaced by real visuals in Phase 2.
import Matter from 'matter-js';
import { WORLD, TANK, CONTROLS_AREA, RING, PEGS } from './config.js';

const COLORS = {
  background: '#06202f',
  world: '#0b3d5c',
  tank: '#13557d',
  wall: '#5fa8d3',
  peg: '#e0e6ea',
  outline: 'rgba(255,255,255,0.5)',
  scored: '#ffffff',
  drag: 'rgba(255,255,255,0.7)',
  controls: 'rgba(255,255,255,0.08)',
  text: 'rgba(255,255,255,0.6)',
};

function fillShape(ctx, body) {
  const v = body.vertices;
  ctx.beginPath();
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  ctx.fill();
}

// The ring band as a flattened oval (a ring seen almost edge-on).
// `half` draws only the back ('back') or front ('front') half, so a peg can be
// drawn in between and look like it goes through the ring.
function drawRingBand(ctx, ring, half) {
  ctx.save();
  ctx.translate(ring.position.x, ring.position.y);
  ctx.rotate(ring.angle);
  ctx.strokeStyle = ring.render.fillStyle;
  ctx.lineWidth = RING.rimRadius * 1.6;
  ctx.beginPath();
  const rx = RING.outerRadius - RING.rimRadius;
  if (half === 'back') ctx.ellipse(0, 0, rx, 5, 0, Math.PI, Math.PI * 2);
  else ctx.ellipse(0, 0, rx, 5, 0, 0, Math.PI);
  ctx.stroke();
  // white outline on rings that are scored
  if (ring.plugin.scoring?.onPeg && half === 'front') {
    ctx.strokeStyle = COLORS.scored;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx + RING.rimRadius, 5 + RING.rimRadius, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawDebug(view, engine, pegs = []) {
  const { ctx } = view;
  view.clear(COLORS.background); // letterbox bars
  view.applyTransform();

  // World area and tank water
  ctx.fillStyle = COLORS.world;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = COLORS.tank;
  ctx.fillRect(TANK.x, TANK.y, TANK.width, TANK.height);

  // Placeholder for where the jet buttons will go
  ctx.fillStyle = COLORS.controls;
  ctx.fillRect(TANK.x, CONTROLS_AREA.y, TANK.width, CONTROLS_AREA.height);
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('buttons go here (Step 4)', WORLD.width / 2, CONTROLS_AREA.y + CONTROLS_AREA.height / 2 + 4);

  const bodies = Matter.Composite.allBodies(engine.world);
  const rings = bodies.filter((b) => b.label === 'ring');

  // Back halves of rings, then pegs, then front halves: pegs look threaded
  for (const ring of rings) drawRingBand(ctx, ring, 'back');
  ctx.fillStyle = COLORS.peg;
  for (const b of bodies) if (b.label === 'peg' || b.label === 'stopper') fillShape(ctx, b);
  for (const ring of rings) drawRingBand(ctx, ring, 'front');

  // Score above each peg
  ctx.fillStyle = COLORS.scored;
  ctx.font = '600 14px system-ui, sans-serif';
  for (const peg of pegs) ctx.fillText(String(peg.rings.size), peg.x, PEGS.tipY - 12);

  // Every physics shape, as a thin outline (compound bodies: each part)
  ctx.lineWidth = 1;
  const shapes = bodies.flatMap((b) => (b.parts.length > 1 ? b.parts.slice(1) : [b]));
  for (const body of shapes) {
    ctx.strokeStyle = body.isStatic ? COLORS.wall : COLORS.outline;
    ctx.beginPath();
    if (body.circleRadius) {
      ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
    } else {
      const v = body.vertices;
      ctx.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
      ctx.closePath();
    }
    ctx.stroke();
  }

  // Finger-drag lines
  ctx.strokeStyle = COLORS.drag;
  ctx.setLineDash([4, 4]);
  for (const c of Matter.Composite.allConstraints(engine.world)) {
    const b = Matter.Constraint.pointBWorld(c);
    ctx.beginPath();
    ctx.moveTo(c.pointA.x, c.pointA.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
