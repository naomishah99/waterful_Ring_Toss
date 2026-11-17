// Debug overlay (only with ?debug and Debug: on): water currents, the outline
// of every physics shape, and finger-drag lines, drawn on top of the scene.
import Matter from 'matter-js';
import { TANK } from './config.js';

export function drawDebug(view, engine, { water }) {
  const { ctx } = view;
  view.applyTransform();

  // Water currents as faint arrows
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let j = 0; j < water.rows; j++) {
    for (let i = 0; i < water.cols; i++) {
      const k = j * water.cols + i;
      const vx = water.ux[k];
      const vy = water.uy[k];
      if (vx * vx + vy * vy < 0.04) continue;
      const x = TANK.x + (i + 0.5) * water.cell;
      const y = TANK.y + (j + 0.5) * water.cell;
      ctx.moveTo(x, y);
      ctx.lineTo(x + vx * 2, y + vy * 2);
    }
  }
  ctx.stroke();

  // Every physics shape (compound bodies: each part)
  const bodies = Matter.Composite.allBodies(engine.world);
  const shapes = bodies.flatMap((b) => (b.parts.length > 1 ? b.parts.slice(1) : [b]));
  for (const body of shapes) {
    ctx.strokeStyle = body.isStatic ? 'rgba(255, 0, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
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
