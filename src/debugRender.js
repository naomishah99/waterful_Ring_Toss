// Plain "debug" drawing: outlines of every physics body plus layout guides.
// This gets replaced by real visuals in Phase 2.
import Matter from 'matter-js';
import { WORLD, TANK, CONTROLS_AREA } from './config.js';

const COLORS = {
  background: '#06202f',
  world: '#0b3d5c',
  tank: '#13557d',
  wall: '#5fa8d3',
  body: '#ffd166',
  controls: 'rgba(255,255,255,0.08)',
  text: 'rgba(255,255,255,0.6)',
};

export function drawDebug(view, engine) {
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

  // Every physics body, as an outline
  ctx.lineWidth = 1.5;
  for (const body of Matter.Composite.allBodies(engine.world)) {
    ctx.strokeStyle = body.isStatic ? COLORS.wall : COLORS.body;
    ctx.beginPath();
    if (body.circleRadius) {
      ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
      // a line from the centre shows rotation
      ctx.moveTo(body.position.x, body.position.y);
      ctx.lineTo(
        body.position.x + Math.cos(body.angle) * body.circleRadius,
        body.position.y + Math.sin(body.angle) * body.circleRadius,
      );
    } else {
      const v = body.vertices;
      ctx.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
      ctx.closePath();
    }
    ctx.stroke();
  }
}
