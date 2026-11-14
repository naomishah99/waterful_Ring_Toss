// Fits the fixed-size world onto any screen, keeping its shape (letterboxing),
// and converts between screen pixels and world units.
import { WORLD } from './config.js';

export function createView(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { ctx, canvas, scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    view.dpr = dpr;
    view.scale = Math.min(cssW / WORLD.width, cssH / WORLD.height);
    view.offsetX = (cssW - WORLD.width * view.scale) / 2;
    view.offsetY = (cssH - WORLD.height * view.scale) / 2;
  }

  // Call before drawing: after this, draw using world units.
  view.applyTransform = () => {
    const s = view.scale * view.dpr;
    ctx.setTransform(s, 0, 0, s, view.offsetX * view.dpr, view.offsetY * view.dpr);
  };

  view.clear = (color) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Screen (CSS pixel) position -> world position
  view.toWorld = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - view.offsetX) / view.scale,
      y: (clientY - rect.top - view.offsetY) / view.scale,
    };
  };

  window.addEventListener('resize', resize);
  // iOS sometimes reports the old size right after rotating
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  resize();
  return view;
}
