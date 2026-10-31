/* Small shared maths + color helpers. */
export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (v - a) / (b - a || 1);
export const smoothstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
export const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
export const sign = v => v < 0 ? -1 : 1;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[(Math.random() * arr.length) | 0];
export const chance = p => Math.random() < p;

export class RNG {
  constructor(seed = 1) { this.s = seed >>> 0; }
  next() {
    let t = this.s += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

export function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatNumber(n) {
  return Math.round(n).toLocaleString('en-US');
}

/* ---------- color ---------- */
const colorCache = new Map();
export function parseColor(hex) {
  if (Array.isArray(hex)) return hex;
  let cached = colorCache.get(hex);
  if (cached) return cached;
  let out;
  if (typeof hex === 'string' && hex.trim().startsWith('rgb')) {
    const parts = hex.slice(hex.indexOf('(') + 1, hex.lastIndexOf(')')).split(',').map(Number);
    out = [(parts[0] || 0) | 0, (parts[1] || 0) | 0, (parts[2] || 0) | 0];
  } else {
    let h = String(hex || '#000').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length === 8) h = h.slice(0, 6);
    const n = parseInt(h, 16) || 0;
    out = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  colorCache.set(hex, out);
  return out;
}
export function rgba(hex, a = 1) {
  const [r, g, b] = parseColor(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export function mixColor(a, b, t) {
  const A = parseColor(a), B = parseColor(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
export function mixRgb(a, b, t) {
  const A = parseColor(a), B = parseColor(b);
  return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];
}
export function rgbCss(arr, a = 1) {
  return `rgba(${Math.round(arr[0])},${Math.round(arr[1])},${Math.round(arr[2])},${a})`;
}

export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* Cheap deterministic wave used for silhouette jitter. */
export function wobble(x, seed = 0) {
  return Math.sin(x * 0.013 + seed) * 0.55 + Math.sin(x * 0.031 + seed * 2.1) * 0.28 + Math.sin(x * 0.007 - seed * 0.7) * 0.17;
}

export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
