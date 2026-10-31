export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const approach = (a, b, amount) => (a < b ? Math.min(a + amount, b) : Math.max(a - amount, b));
export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const rgba = (color, a) => {
  if (typeof color !== 'string') return color;
  if (color[0] === '#') {
    const h = color.length === 4
      ? [color[1] + color[1], color[2] + color[2], color[3] + color[3]]
      : [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)];
    return `rgba(${parseInt(h[0], 16)},${parseInt(h[1], 16)},${parseInt(h[2], 16)},${a})`;
  }
  const m = color.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(',').map((v) => parseFloat(v));
    if (p.length >= 3 && p.slice(0, 3).every(Number.isFinite)) {
      return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
    }
  }
  return color;
};
export const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const pick = (arr, seed) => arr[Math.floor(hash(seed) * arr.length) % arr.length];
