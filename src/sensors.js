// Helpers shared by tilt and shake for reading the phone's motion sensor.

// How far the screen is rotated from portrait (0, 90, 180, 270 degrees), in radians
function screenRotation() {
  const deg = screen.orientation?.angle ?? window.orientation ?? 0;
  return (deg * Math.PI) / 180;
}

// Converts a sensor vector from the phone's own axes (x = right edge,
// y = top edge) into screen axes as drawn (x = right, y = down), allowing for
// the screen being rotated.
export function deviceToScreen(x, y) {
  const r = screenRotation();
  const sx = x * Math.cos(r) - y * Math.sin(r);
  const syUp = x * Math.sin(r) + y * Math.cos(r);
  return { x: sx, y: -syUp };
}
