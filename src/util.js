// ── The Remembering — shared math, noise and palette ─────────────────────────
export const TILE = 28;
export const GRID = 96;
export const WORLD = TILE * GRID;
export const DAY_SECONDS = 300;

export const BIOME = {
  WATER: 0, SAND: 1, MEADOW: 2, FOREST: 3, MARSH: 4, ROCK: 5, ASH: 6,
};

export const BIOME_INFO = {
  [BIOME.WATER]:  { key: 'water',  name: 'water',  color: '#1b3d48', walk: false },
  [BIOME.SAND]:   { key: 'sand',   name: 'shore',  color: '#b9a374', walk: true },
  [BIOME.MEADOW]: { key: 'meadow', name: 'meadow', color: '#6d8450', walk: true },
  [BIOME.FOREST]: { key: 'forest', name: 'forest', color: '#405b3c', walk: true },
  [BIOME.MARSH]:  { key: 'marsh',  name: 'marsh',  color: '#4a5c46', walk: true },
  [BIOME.ROCK]:   { key: 'rock',   name: 'stone',  color: '#68665f', walk: true },
  [BIOME.ASH]:    { key: 'ash',    name: 'ashland',color: '#514944', walk: true },
};

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax, ay, bx, by) => (bx - ax) ** 2 + (by - ay) ** 2;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const angleLerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedLabel(seed) {
  return (seed >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

export class RNG {
  constructor(seed) {
    this.s = (seed >>> 0) || 0x9e3779b9;
  }
  next() {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

function hash2(ix, iy, seed) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function noise2(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

export function fbm(x, y, seed, octaves = 4) {
  let v = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    v += noise2(x * freq, y * freq, seed + i * 1013) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return v / norm;
}

export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amount >= 0) {
    r = Math.round(lerp(r, 255, amount));
    g = Math.round(lerp(g, 255, amount));
    b = Math.round(lerp(b, 255, amount));
  } else {
    const t = 1 + amount;
    r = Math.round(r * t); g = Math.round(g * t); b = Math.round(b * t);
  }
  return `rgb(${r},${g},${b})`;
}

export function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function formatClock(fraction) {
  const total = Math.floor(((fraction % 1) + 1) % 1 * 24 * 60);
  const h = Math.floor(total / 60), m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function angleDiff(a, b) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function inArc(px, py, cx, cy, facing, radius, arc) {
  const d = Math.hypot(px - cx, py - cy);
  if (d > radius) return false;
  const a = Math.atan2(py - cy, px - cx);
  return Math.abs(angleDiff(facing, a)) <= arc / 2;
}

export function pickName(rng, used = new Set()) {
  const first = ['Wren','Kestrel','Mara','Ash','Rowan','Sable','Orin','Maelin','Iris','Bram','Fenn','Tove','Rook','Lark','Cael','Nyla','Dain','Eira','Sorrel','Vale'];
  const last = ['of the Fen','the Quiet','Ashborn','of Greywatch','the Kind','Halfhand','of the Long Road','the Watchful','Emberwise','of Hollow Pines','the Unbroken','Duskward'];
  for (let i = 0; i < 30; i++) {
    const n = `${rng.pick(first)} ${rng.pick(last)}`;
    if (!used.has(n)) { used.add(n); return n; }
  }
  return `Wanderer ${Math.floor(rng.range(10, 99))}`;
}

export const TACTIC_LABELS = {
  rangedKills: 'ranged kills',
  meleeKills: 'close kills',
  stealthKills: 'unseen kills',
  trapKills: 'snare kills',
  fireHits: 'fire wounds',
  escapes: 'escaped foes',
};
