export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  return dx * dx + dy * dy;
};
export const angleLerp = (a, b, t) => {
  let d = ((b - a + Math.PI * 3) % TAU) - Math.PI;
  return a + d * t;
};
export const sign = (v) => (v < 0 ? -1 : 1);

export function formatClock(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = dx * dx + dy * dy;
  let t = len ? ((px - x1) * dx + (py - y1) * dy) / len : 0;
  t = clamp(t, 0, 1);
  const x = x1 + dx * t, y = y1 + dy * t;
  return Math.hypot(px - x, py - y);
}

/** Small, fast seeded PRNG (mulberry32). */
export class Rng {
  constructor(seed = 1) {
    this.state = (seed >>> 0) || 1;
  }
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  sign() { return this.next() < 0.5 ? -1 : 1; }
}

/** Value-noise + fbm, deterministic for a seed. */
export class Noise {
  constructor(seed = 1) {
    this.seed = (seed | 0) || 1;
  }
  hash(ix, iy) {
    let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(this.seed, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  value(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const ux = smoothstep(fx), uy = smoothstep(fy);
    const a = this.hash(x0, y0), b = this.hash(x0 + 1, y0);
    const c = this.hash(x0, y0 + 1), d = this.hash(x0 + 1, y0 + 1);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
  }
  fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
    let amp = 0.5, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.value(x * freq, y * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }
}

/** #rrggbb helpers */
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  const c = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
export function shadeHex(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  return rgbToHex(r * (1 + amount), g * (1 + amount), b * (1 + amount));
}
export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function roman(n) {
  const table = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out || 'I';
}
export function floorTo(n, step) { return Math.floor(n / step) * step; }
