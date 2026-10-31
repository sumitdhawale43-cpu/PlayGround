import { clamp, hash2, fbm, TAU, dist } from './util.js';

export const TILE = 48;

export const TER = { WATER: 0, SAND: 1, GRASS: 2, FOREST: 3, ROCK: 4, ASH: 5, DIRT: 6 };
export const WORLD_TILES = 150;
export const WORLD_SIZE = WORLD_TILES * TILE;

const COLORS = {
  [TER.WATER]: ['#1d3a40'],
  [TER.SAND]: ['#776541'],
  [TER.GRASS]: ['#475d34'],
  [TER.FOREST]: ['#344a2a'],
  [TER.ROCK]: ['#514e42'],
  [TER.ASH]: ['#3a342d'],
  [TER.DIRT]: ['#493c2a'],
};

export class World {
  constructor(seed, memory) {
    this.seed = seed;
    this.memory = memory;
    this.size = WORLD_TILES;
    this.terrain = new Uint8Array(this.size * this.size);
    this.props = [];
    this.grid = new Map();
    this.camp = { tx: 75, ty: 75, x: 75.5 * TILE, y: 75.5 * TILE };
    this.spawn = { x: 75.5 * TILE, y: 81 * TILE };
    this.ruins = [];
    this.chunks = new Map();
    this.burnSet = new Set((memory.burns || []).map((b) => `${Math.round(b.x / TILE)},${Math.round(b.y / TILE)}`));
    this.burnPoints = (memory.burns || []).map((b) => ({ x: b.x, y: b.y }));
    this.minimap = null;
    this.generate();
  }

  idx(tx, ty) { return ty * this.size + tx; }
  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.size && ty < this.size; }
  terrainAt(tx, ty) {
    if (!this.inBounds(tx, ty)) return TER.WATER;
    return this.terrain[this.idx(tx, ty)];
  }
  terrainAtPx(x, y) { return this.terrainAt(Math.floor(x / TILE), Math.floor(y / TILE)); }

  generate() {
    const { size, seed } = this;
    // First pass: water / land. A second pass turns only the low shore into
    // sand, so beaches hug the water instead of flooding whole biomes brown.
    for (let ty = 0; ty < size; ty++) {
      for (let tx = 0; tx < size; tx++) {
        const edge = Math.min(tx, ty, size - 1 - tx, size - 1 - ty);
        let e = fbm(tx * 0.026, ty * 0.026, 4, seed);
        e = e * 0.82 + 0.09;
        this.terrain[this.idx(tx, ty)] = edge < 2 || e < 0.295 ? TER.WATER : TER.GRASS;
      }
    }
    for (let ty = 0; ty < size; ty++) {
      for (let tx = 0; tx < size; tx++) {
        if (this.terrain[this.idx(tx, ty)] === TER.WATER) continue;
        const e = fbm(tx * 0.026, ty * 0.026, 4, seed) * 0.82 + 0.09;
        const m = fbm(tx * 0.043 + 40, ty * 0.043 + 90, 3, seed + 31);
        let t;
        if (e < 0.34 && this.nearWater(tx, ty, 2)) t = TER.SAND;
        else if (e > 0.715) t = TER.ROCK;
        else if (m > 0.575) t = TER.FOREST;
        else t = TER.GRASS;
        if (t === TER.ROCK && e < 0.735 && hash2(tx, ty, seed + 7) > 0.5) t = TER.GRASS;
        this.terrain[this.idx(tx, ty)] = t;
      }
    }

    this.carveCamp();
    this.placeRuins();
    this.placeProps();
    this.placeCamp();
    this.campfires = this.props.filter((p) => p.type === 'campfire');
    this.lights = this.props.filter((p) => p.type === 'lantern' && p.lit);
    this.placeMemory();
    this.buildMinimap();
    this.buildGroundNoise();
    this.buildTerrainBase();
  }

  nearWater(tx, ty, radius = 2) {
    for (let y = ty - radius; y <= ty + radius; y++) {
      for (let x = tx - radius; x <= tx + radius; x++) {
        if (this.terrainAt(x, y) === TER.WATER) return true;
      }
    }
    return false;
  }

  carveCamp() {
    const { tx: cx, ty: cy } = this.camp;
    for (let y = cy - 13; y <= cy + 13; y++) {
      for (let x = cx - 13; x <= cx + 13; x++) {
        if (!this.inBounds(x, y)) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d > 13) continue;
        let t = this.terrain[this.idx(x, y)];
        if (t === TER.WATER || t === TER.ROCK) t = TER.GRASS;
        // ragged dirt clearing, softened by a noisy rim
        const edge = d + (hash2(x, y, this.seed + 71) - 0.5) * 1.7;
        if (edge < 7.4) t = TER.DIRT;
        else if (d > 9 && (t === TER.GRASS || t === TER.FOREST)) t = TER.GRASS;
        this.terrain[this.idx(x, y)] = t;
      }
    }
    for (let y = cy + 8; y <= cy + 15; y++) {
      for (let x = cx - 4; x <= cx + 4; x++) {
        if (this.terrainAt(x, y) === TER.WATER) this.terrain[this.idx(x, y)] = TER.GRASS;
      }
    }
  }

  findWalkableNear(tx, ty, maxR = 14) {
    for (let r = 0; r <= maxR; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = tx + dx, y = ty + dy;
          const t = this.terrainAt(x, y);
          if (t === TER.GRASS || t === TER.FOREST || t === TER.SAND || t === TER.ASH || t === TER.DIRT) return { tx: x, ty: y };
        }
      }
    }
    return null;
  }

  placeRuins() {
    const angles = [0.5, 2.55, 4.55];
    const radii = [43, 51, 47];
    for (let i = 0; i < 3; i++) {
      const a = angles[i] + (hash2(i, 3, this.seed) - 0.5) * 0.4;
      const r = radii[i] + Math.floor(hash2(i, 9, this.seed) * 8);
      let tx = Math.round(this.camp.tx + Math.cos(a) * r);
      let ty = Math.round(this.camp.ty + Math.sin(a) * r);
      tx = clamp(tx, 8, this.size - 9);
      ty = clamp(ty, 8, this.size - 9);
      const spot = this.findWalkableNear(tx, ty, 18);
      if (!spot) continue;
      for (let y = spot.ty - 6; y <= spot.ty + 6; y++) {
        for (let x = spot.tx - 6; x <= spot.tx + 6; x++) {
          if (!this.inBounds(x, y)) continue;
          if (Math.hypot(x - spot.tx, y - spot.ty) > 6) continue;
          const t = this.terrain[this.idx(x, y)];
          if (t === TER.WATER || t === TER.ROCK) this.terrain[this.idx(x, y)] = TER.ASH;
          else if (t === TER.GRASS || t === TER.FOREST) this.terrain[this.idx(x, y)] = TER.ASH;
        }
      }
      const site = {
        index: i,
        tx: spot.tx,
        ty: spot.ty,
        x: (spot.tx + 0.5) * TILE,
        y: (spot.ty + 0.5) * TILE,
        taken: false,
      };
      this.ruins.push(site);
    }
  }

  addProp(type, tx, ty, extra = {}) {
    const x = (tx + 0.5) * TILE + (extra.ox || 0);
    const y = (ty + 0.5) * TILE + (extra.oy || 0);
    const p = {
      type, x, y, tx, ty,
      dead: false,
      seed: hash2(tx, ty, this.seed + 13),
      ...extra,
    };
    this.props.push(p);
    const key = `${tx},${ty}`;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(p);
    return p;
  }

  placeProps() {
    const { size, seed } = this;
    for (let ty = 0; ty < size; ty++) {
      for (let tx = 0; tx < size; tx++) {
        const t = this.terrain[this.idx(tx, ty)];
        const h = hash2(tx, ty, seed + 101);
        const dc = Math.hypot(tx - this.camp.tx, ty - this.camp.ty);
        if (dc < 13) continue;
        let nearRuin = false;
        for (const r of this.ruins) if (Math.hypot(tx - r.tx, ty - r.ty) < 7.5) nearRuin = true;
        if (nearRuin) continue;

        if (t === TER.FOREST) {
          if (h < 0.4) {
            const pine = hash2(tx, ty, seed + 5) < 0.38;
            this.addProp(pine ? 'pine' : 'tree', tx, ty, { solid: true, r: pine ? 11 : 13, wood: 3 });
          } else if (h < 0.46) {
            this.addProp('bush', tx, ty, { solid: false, fiber: 2, berry: hash2(tx, ty, seed + 8) < 0.5 ? 1 : 0 });
          } else if (h < 0.475) {
            this.addProp('deadtree', tx, ty, { solid: true, r: 9, wood: 2 });
          }
        } else if (t === TER.GRASS) {
          if (h < 0.045) {
            this.addProp('bush', tx, ty, { solid: false, fiber: 2, berry: hash2(tx, ty, seed + 8) < 0.35 ? 1 : 0 });
          } else if (h > 0.955) {
            this.addProp('boulder', tx, ty, { solid: true, r: 20, stone: 3 });
          } else if (h > 0.935 && h < 0.945) {
            this.addProp('tree', tx, ty, { solid: true, r: 12, wood: 3 });
          }
        } else if (t === TER.SAND) {
          if (h < 0.05) this.addProp('reeds', tx, ty, { solid: false });
        } else if (t === TER.ROCK) {
          if (h < 0.24) this.addProp('flint', tx, ty, { solid: false, flint: 2 });
          else if (h > 0.9) this.addProp('boulder', tx, ty, { solid: true, r: 18, stone: 2 });
        } else if (t === TER.ASH) {
          if (h < 0.06) this.addProp('deadtree', tx, ty, { solid: true, r: 8, wood: 1 });
          if (h > 0.93) this.addProp('flint', tx, ty, { solid: false, flint: 1 });
        }
      }
    }
  }

  placeCamp() {
    const { tx: cx, ty: cy } = this.camp;
    const root = this.addProp('worldroot', cx, cy - 3, { solid: true, r: 38, beacon: true, y: (cy - 3 + 0.5) * TILE + 24 });
    this.beacon = root;
    this.addProp('campfire', cx, cy + 2, { solid: false, lit: true, radius: 230 });
    this.addProp('tent', cx - 4, cy + 3, { solid: true, r: 24 });
    this.addProp('tent', cx + 4, cy + 4, { solid: true, r: 24 });
    this.addProp('crate', cx - 3, cy + 1, { solid: true, r: 11 });
    this.addProp('crate', cx + 3, cy + 1, { solid: true, r: 11 });
    this.addProp('banner', cx - 6, cy - 2, { solid: false });
    this.addProp('banner', cx + 6, cy - 2, { solid: false });
    this.addProp('log', cx - 2, cy + 3, { solid: false });
    this.addProp('log', cx + 2, cy + 3, { solid: false });
    this.addProp('lantern', cx - 5, cy + 1, { solid: true, r: 7, lit: true });
    this.addProp('lantern', cx + 5, cy + 1, { solid: true, r: 7, lit: true });
    this.addProp('rack', cx - 6, cy + 5, { solid: false });
    this.spawn = { x: (cx + 0.5) * TILE, y: (cy + 6.5) * TILE };
  }

  placeMemory() {
    for (const r of this.ruins) {
      const p = this.addProp('pedestal', r.tx, r.ty, { solid: true, r: 13, site: r.index, shard: !r.taken, y: (r.ty + 0.5) * TILE + 18 });
      r.pedestal = p;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.3;
        if (i === 1 || i === 4) continue;
        const px = Math.round(r.tx + Math.cos(a) * 3.6);
        const py = Math.round(r.ty + Math.sin(a) * 3.6);
        this.addProp('pillar', px, py, { solid: true, r: 15, broken: hash2(px, py, this.seed) < 0.5 });
      }
      this.addProp('rubble', r.tx + 2, r.ty - 2, { solid: false });
      this.addProp('rubble', r.tx - 3, r.ty + 1, { solid: false });
    }

    for (const g of this.memory.graves || []) {
      const tx = clamp(Math.round(g.x / TILE), 4, this.size - 5);
      const ty = clamp(Math.round(g.y / TILE), 4, this.size - 5);
      const spot = this.findWalkableNear(tx, ty, 10);
      if (!spot) continue;
      this.addProp('cairn', spot.tx, spot.ty, {
        solid: false,
        grave: g,
        looted: g.taken,
        loot: g.loot,
        y: (spot.ty + 0.5) * TILE + 10,
      });
    }

    for (const a of this.memory.ashes || []) {
      const tx = clamp(Math.round(a.x / TILE), 4, this.size - 5);
      const ty = clamp(Math.round(a.y / TILE), 4, this.size - 5);
      const spot = this.findWalkableNear(tx, ty, 6);
      if (spot) this.addProp('ashring', spot.tx, spot.ty, { solid: false });
    }
  }

  /* ---------------- queries ---------------- */

  propsNear(x, y, radius = 96) {
    const out = [];
    const r = Math.ceil(radius / TILE) + 1;
    const cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
    for (let ty = cy - r; ty <= cy + r; ty++) {
      for (let tx = cx - r; tx <= cx + r; tx++) {
        const bucket = this.grid.get(`${tx},${ty}`);
        if (!bucket) continue;
        for (const p of bucket) {
          if (p.dead) continue;
          if (Math.abs(p.x - x) <= radius + 40 && Math.abs(p.y - y) <= radius + 40) out.push(p);
        }
      }
    }
    return out;
  }

  solidAtPoint(x, y, radius = 0) {
    const t = this.terrainAtPx(x, y);
    if (t === TER.WATER || t === TER.ROCK) return true;
    if (radius > 0) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const tt = this.terrainAtPx(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
        if (tt === TER.WATER || tt === TER.ROCK) return true;
      }
    }
    return false;
  }

  circleBlocked(x, y, radius) {
    if (this.solidAtPoint(x, y, radius * 0.8)) return true;
    const props = this.propsNear(x, y, radius + 42);
    for (const p of props) {
      if (!p.solid || p.dead) continue;
      const rr = (p.r || 12) * 0.82 + radius;
      if (dist(x, y, p.x, p.y - (p.type === 'tree' || p.type === 'pine' ? 8 : 0)) < rr) return true;
    }
    return false;
  }

  moveEntity(ent, dx, dy) {
    const r = ent.radius || 13;
    if (!this.circleBlocked(ent.x + dx, ent.y, r)) ent.x += dx;
    if (!this.circleBlocked(ent.x, ent.y + dy, r)) ent.y += dy;
    ent.x = clamp(ent.x, 20, WORLD_SIZE - 20);
    ent.y = clamp(ent.y, 20, WORLD_SIZE - 20);
  }

  nearestInteractable(x, y, radius = 76) {
    let best = null;
    let bestD = radius;
    for (const p of this.propsNear(x, y, radius)) {
      if (p.dead) continue;
      let kind = null;
      if (p.beacon) kind = 'beacon';
      else if (p.type === 'pedestal' && p.shard) kind = 'shard';
      else if (p.type === 'cairn' && !p.looted) kind = 'grave';
      else if (p.type === 'tree' || p.type === 'pine' || p.type === 'bush' || p.type === 'boulder' || p.type === 'flint' || p.type === 'deadtree') kind = 'harvest';
      if (!kind) continue;
      const d = dist(x, y, p.x, p.y);
      if (d < bestD) { bestD = d; best = { prop: p, kind, dist: d }; }
    }
    return best;
  }

  removeProp(p) {
    p.dead = true;
  }

  burnTree(p) {
    if (p.dead) return;
    p.dead = true;
    const key = `${p.tx},${p.ty}`;
    this.burnSet.add(key);
    this.burnPoints.push({ x: p.x, y: p.y });
    this.memory.burns = this.memory.burns || [];
    this.memory.burns.push({ x: Math.round(p.x), y: Math.round(p.y) });
    if (this.memory.burns.length > 400) this.memory.burns.shift();
    this.terrain[this.idx(p.tx, p.ty)] = TER.ASH;
    const chunk = this.chunks.get(`${Math.floor(p.tx / 12)},${Math.floor(p.ty / 12)}`);
    if (chunk) chunk.dirty = true;
    this.invalidateChunkAt(p.tx, p.ty);
  }

  addCampfire(x, y) {
    const p = this.addProp('campfire', Math.floor(x / TILE), Math.floor(y / TILE), {
      solid: false, lit: true, radius: 210, built: true, ox: 0, oy: 0,
    });
    p.x = x; p.y = y;
    return p;
  }

  randomWalkableNear(x, y, minR, maxR, rng) {
    for (let i = 0; i < 40; i++) {
      const a = rng() * TAU;
      const r = minR + rng() * (maxR - minR);
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (px < 200 || py < 200 || px > WORLD_SIZE - 200 || py > WORLD_SIZE - 200) continue;
      if (this.circleBlocked(px, py, 18)) continue;
      return { x: px, y: py };
    }
    return null;
  }

  findWalkableAround(x, y, radius = 600, rng = Math.random) {
    for (let i = 0; i < 60; i++) {
      const a = rng() * TAU;
      const r = 80 + rng() * radius;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (px < 80 || py < 80 || px > WORLD_SIZE - 80 || py > WORLD_SIZE - 80) continue;
      if (!this.circleBlocked(px, py, 16)) return { x: px, y: py };
    }
    return { x: this.camp.x, y: this.camp.y + 200 };
  }

  /* ---------------- minimap ---------------- */

  buildTerrainBase() {
    const px = 8;
    const n = this.size * px;
    const c = document.createElement('canvas');
    c.width = n; c.height = n;
    const g = c.getContext('2d');
    const img = g.createImageData(n, n);
    for (let ty = 0; ty < this.size; ty++) {
      for (let tx = 0; tx < this.size; tx++) {
        const t = this.terrain[this.idx(tx, ty)];
        const col = COLORS[t][0];
        const r = parseInt(col.slice(1, 3), 16);
        const gg = parseInt(col.slice(3, 5), 16);
        const b = parseInt(col.slice(5, 7), 16);
        const jitter = (hash2(tx, ty, this.seed + 55) - 0.5) * 2.5;
        for (let oy = 0; oy < px; oy++) {
          for (let ox = 0; ox < px; ox++) {
            const i = ((ty * px + oy) * n + (tx * px + ox)) * 4;
            img.data[i] = clamp(r + jitter, 0, 255);
            img.data[i + 1] = clamp(gg + jitter, 0, 255);
            img.data[i + 2] = clamp(b + jitter, 0, 255);
            img.data[i + 3] = 255;
          }
        }
      }
    }
    g.putImageData(img, 0, 0);

    // A single soft pass melts the straight biome seams. Detail is drawn on
    // top by the chunk renderer, so the base can stay low-frequency.
    const tmp = document.createElement('canvas');
    tmp.width = n; tmp.height = n;
    const tg = tmp.getContext('2d');
    if ('filter' in tg) {
      tg.filter = 'blur(2px)';
      tg.drawImage(c, 0, 0);
      g.clearRect(0, 0, n, n);
      g.drawImage(tmp, 0, 0);
    }
    this.terrainBase = c;
  }

  buildGroundNoise() {
    const n = 320;
    const c = document.createElement('canvas');
    c.width = n; c.height = n;
    const g = c.getContext('2d');
    const img = g.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const a = fbm(x * 0.055, y * 0.055, 4, this.seed + 701);
        const b = fbm(x * 0.17 + 30, y * 0.17 + 70, 3, this.seed + 903);
        let v = 118 + (a - 0.5) * 130 + (b - 0.5) * 46;
        v = clamp(v, 34, 232);
        const i = (y * n + x) * 4;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    this.groundNoise = c;
  }

  buildMinimap() {
    const c = document.createElement('canvas');
    c.width = this.size;
    c.height = this.size;
    const g = c.getContext('2d');
    const img = g.createImageData(this.size, this.size);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const t = this.terrain[this.idx(x, y)];
        let col;
        if (t === TER.WATER) col = [28, 48, 54];
        else if (t === TER.SAND) col = [92, 81, 55];
        else if (t === TER.FOREST) col = [45, 60, 38];
        else if (t === TER.ROCK) col = [64, 62, 55];
        else if (t === TER.ASH) col = [46, 42, 37];
        else if (t === TER.DIRT) col = [72, 59, 40];
        else col = [58, 74, 46];
        const i = (y * this.size + x) * 4;
        img.data[i] = col[0];
        img.data[i + 1] = col[1];
        img.data[i + 2] = col[2];
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    this.minimap = c;
  }

  /* ---------------- rendering ---------------- */

  invalidateChunkAt(tx, ty) {
    const key = `${Math.floor(tx / 12)},${Math.floor(ty / 12)}`;
    const chunk = this.chunks.get(key);
    if (chunk) chunk.dirty = true;
  }

  getChunk(cx, cy) {
    const key = `${cx},${cy}`;
    let entry = this.chunks.get(key);
    if (entry && !entry.dirty) return entry.canvas;
    if (!entry) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE * 12;
      canvas.height = TILE * 12;
      entry = { canvas, dirty: true };
      if (this.chunks.size > 48) this.chunks.clear();
      this.chunks.set(key, entry);
    }
    const ctx = entry.canvas.getContext('2d');
    ctx.clearRect(0, 0, TILE * 12, TILE * 12);

    for (let ly = 0; ly < 12; ly++) {
      for (let lx = 0; lx < 12; lx++) {
        const tx = cx * 12 + lx, ty = cy * 12 + ly;
        if (!this.inBounds(tx, ty)) continue;
        this.drawTile(ctx, tx, ty, lx * TILE, ly * TILE);
      }
    }
    entry.dirty = false;
    return entry.canvas;
  }

  drawTile(ctx, tx, ty, px, py) {
    const t = this.terrain[this.idx(tx, ty)];
    const h = hash2(tx, ty, this.seed + 3);

    if (t === TER.GRASS || t === TER.FOREST) {
      const tufts = t === TER.FOREST ? 4 : 6;
      ctx.strokeStyle = t === TER.FOREST ? 'rgba(100,124,76,0.5)' : 'rgba(122,148,92,0.42)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < tufts; i++) {
        const hx = hash2(tx, ty, i * 17 + 4);
        const hy = hash2(tx, ty, i * 31 + 9);
        const gx = px + 2 + hx * (TILE - 4);
        const gy = py + 4 + hy * (TILE - 6);
        const lean = (hx - 0.5) * 4;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + lean, gy - 4 - hy * 3);
        ctx.stroke();
        if (i === 0 && h > 0.5) {
          ctx.beginPath();
          ctx.moveTo(gx + 2, gy);
          ctx.lineTo(gx + 4 + lean, gy - 3);
          ctx.stroke();
        }
      }
      if (t === TER.FOREST && h > 0.35) {
        ctx.fillStyle = 'rgba(23,30,18,0.5)';
        ctx.beginPath();
        ctx.ellipse(px + 10 + h * 24, py + 14 + h * 20, 5, 3, h, 0, TAU);
        ctx.fill();
      }
      if (t === TER.FOREST && h > 0.86) {
        ctx.fillStyle = 'rgba(134,152,102,0.35)';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(px + 8 + hash2(tx, ty, 60 + i) * 32, py + 8 + hash2(tx, ty, 70 + i) * 32, 1.5, 1.5);
        }
      }
      if (h > 0.72) {
        const fx = px + 6 + hash2(tx, ty, 90) * 36;
        const fy = py + 6 + hash2(tx, ty, 91) * 36;
        ctx.fillStyle = hash2(tx, ty, 92) > 0.6 ? 'rgba(224, 214, 176, 0.55)' : 'rgba(200, 176, 90, 0.5)';
        ctx.fillRect(fx, fy, 1.6, 1.6);
      }
    } else if (t === TER.SAND) {
      ctx.fillStyle = 'rgba(45, 40, 28, 0.35)';
      for (let i = 0; i < 3; i++) {
        const gx = px + hash2(tx, ty, 20 + i) * TILE;
        const gy = py + hash2(tx, ty, 30 + i) * TILE;
        ctx.fillRect(gx, gy, 2, 1);
      }
    } else if (t === TER.ROCK) {
      ctx.strokeStyle = 'rgba(25, 25, 22, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const sx = px + 8 + h * 20, sy = py + 6 + h * 10;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 8, sy + 14);
      ctx.lineTo(sx + 4, sy + 24);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.beginPath();
      ctx.ellipse(px + 28, py + 18, 9, 5, -0.5, 0, TAU);
      ctx.fill();
    } else if (t === TER.WATER) {
      ctx.fillStyle = 'rgba(96, 148, 148, 0.05)';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = 'rgba(150, 196, 192, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 16 + h * 12);
      ctx.quadraticCurveTo(px + 18, py + 12 + h * 12, px + 30, py + 17 + h * 12);
      ctx.stroke();

      // small foam dashes where the water meets land
      const landL = this.terrainAt(tx - 1, ty) !== TER.WATER;
      const landR = this.terrainAt(tx + 1, ty) !== TER.WATER;
      const landT = this.terrainAt(tx, ty - 1) !== TER.WATER;
      const landB = this.terrainAt(tx, ty + 1) !== TER.WATER;
      if (landL || landR || landT || landB) {
        ctx.strokeStyle = 'rgba(182, 216, 206, 0.14)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          const o = 8 + i * 14 + h * 3;
          ctx.beginPath();
          if (landL) { ctx.moveTo(px + 1, py + o); ctx.quadraticCurveTo(px + 5, py + o + 2, px + 2, py + o + 5); }
          if (landR) { ctx.moveTo(px + TILE - 1, py + o); ctx.quadraticCurveTo(px + TILE - 5, py + o + 2, px + TILE - 2, py + o + 5); }
          if (landT) { ctx.moveTo(px + o, py + 1); ctx.quadraticCurveTo(px + o + 2, py + 5, px + o + 5, py + 2); }
          if (landB) { ctx.moveTo(px + o, py + TILE - 1); ctx.quadraticCurveTo(px + o + 2, py + TILE - 5, px + o + 5, py + TILE - 2); }
          ctx.stroke();
        }
      }
    } else if (t === TER.ASH) {
      ctx.fillStyle = 'rgba(12, 11, 10, 0.35)';
      ctx.beginPath();
      ctx.ellipse(px + 20 + h * 10, py + 20 + h * 8, 9, 5, h * 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(140, 120, 100, 0.18)';
      ctx.fillRect(px + 8 + h * 26, py + 10 + h * 20, 1.5, 1.5);
    } else if (t === TER.DIRT) {
      ctx.fillStyle = 'rgba(36, 29, 19, 0.28)';
      for (let i = 0; i < 3; i++) {
        const gx = px + 5 + hash2(tx, ty, 130 + i) * (TILE - 10);
        const gy = py + 5 + hash2(tx, ty, 140 + i) * (TILE - 10);
        ctx.beginPath();
        ctx.ellipse(gx, gy, 4 + i, 2.2 + i * 0.4, h * 2, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(158, 140, 102, 0.2)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(px + 3 + hash2(tx, ty, 150 + i) * (TILE - 6), py + 3 + hash2(tx, ty, 160 + i) * (TILE - 6), 1.4, 1.2);
      }
      if (h > 0.7) {
        ctx.strokeStyle = 'rgba(116, 132, 82, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gx = px + 8 + hash2(tx, ty, 170) * 30;
        const gy = py + 30 + hash2(tx, ty, 171) * 12;
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 1, gy - 5);
        ctx.stroke();
      }
    }
  }

  drawGround(ctx, view, w, h, time) {
    const ox = view.x;
    const oy = view.y;
    if (this.terrainBase) {
      const scale = WORLD_SIZE / this.terrainBase.width;
      const sx = clamp(ox / scale, 0, this.terrainBase.width);
      const sy = clamp(oy / scale, 0, this.terrainBase.height);
      const sw = Math.min(this.terrainBase.width - sx, w / scale);
      const sh = Math.min(this.terrainBase.height - sy, h / scale);
      const dx = sx * scale - ox;
      const dy = sy * scale - oy;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.terrainBase, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);
    }

    const c0x = Math.floor(ox / (TILE * 12)) - 1;
    const c1x = Math.floor((ox + w) / (TILE * 12)) + 1;
    const c0y = Math.floor(oy / (TILE * 12)) - 1;
    const c1y = Math.floor((oy + h) / (TILE * 12)) + 1;
    for (let cy = c0y; cy <= c1y; cy++) {
      for (let cx = c0x; cx <= c1x; cx++) {
        const chunk = this.getChunk(cx, cy);
        ctx.drawImage(chunk, cx * TILE * 12 - ox, cy * TILE * 12 - oy);
      }
    }

    // continuous ground mottling breaks up the tile grid
    if (this.groundNoise) {
      const n = this.groundNoise.width;
      const scale = WORLD_SIZE / n;
      const sx = clamp(ox / scale, 0, n);
      const sy = clamp(oy / scale, 0, n);
      const sw = Math.min(n - sx, w / scale);
      const sh = Math.min(n - sy, h / scale);
      const dx = sx * scale - ox;
      const dy = sy * scale - oy;
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.groundNoise, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);
      ctx.restore();
    }

    // camp clearing — the terrain itself carries the dirt now; this only
    // warms the ground where the fire lives.
    const campX = this.camp.x - ox;
    const campY = this.camp.y - oy;
    if (campX > -420 && campX < w + 420 && campY > -420 && campY < h + 420) {
      const cg = ctx.createRadialGradient(campX, campY + 20, 20, campX, campY + 20, 280);
      cg.addColorStop(0, 'rgba(150, 122, 76, 0.10)');
      cg.addColorStop(0.55, 'rgba(120, 98, 60, 0.05)');
      cg.addColorStop(1, 'rgba(100, 84, 52, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(campX, campY + 20, 280, 200, 0, 0, TAU);
      ctx.fill();
    }

    // animated water highlights
    const tx0 = Math.max(0, Math.floor(ox / TILE));
    const ty0 = Math.max(0, Math.floor(oy / TILE));
    const tx1 = Math.min(this.size - 1, Math.ceil((ox + w) / TILE));
    const ty1 = Math.min(this.size - 1, Math.ceil((oy + h) / TILE));
    ctx.strokeStyle = 'rgba(170, 214, 208, 0.2)';
    ctx.lineWidth = 1;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.terrain[this.idx(tx, ty)] !== TER.WATER) continue;
        const hsh = hash2(tx, ty, this.seed + 44);
        if (hsh < 0.55) continue;
        const px = tx * TILE - ox;
        const py = ty * TILE - oy;
        const wob = Math.sin(time * 1.1 + tx * 0.7 + ty * 0.5) * 3;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 20 + wob);
        ctx.quadraticCurveTo(px + 20, py + 16 + wob, px + 34, py + 21 + wob);
        ctx.stroke();
      }
    }

    // burn scars
    for (const b of this.burnPoints) {
      if (b.x < ox - 60 || b.x > ox + w + 60 || b.y < oy - 60 || b.y > oy + h + 60) continue;
      const px = b.x - ox, py = b.y - oy;
      ctx.fillStyle = 'rgba(10, 9, 8, 0.55)';
      ctx.beginPath();
      ctx.ellipse(px, py + 2, 17, 10, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 96, 74, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px - 5, py - 12);
      ctx.moveTo(px + 2, py);
      ctx.lineTo(px + 5, py - 8);
      ctx.stroke();
    }
  }

  visibleProps(cam, w, h) {
    const ox = cam.x - w / 2;
    const oy = cam.y - h / 2;
    const tx0 = Math.max(0, Math.floor(ox / TILE) - 1);
    const ty0 = Math.max(0, Math.floor(oy / TILE) - 1);
    const tx1 = Math.min(this.size - 1, Math.ceil((ox + w) / TILE) + 1);
    const ty1 = Math.min(this.size - 1, Math.ceil((oy + h) / TILE) + 1);
    const out = [];
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const bucket = this.grid.get(`${tx},${ty}`);
        if (!bucket) continue;
        for (const p of bucket) if (!p.dead) out.push(p);
      }
    }
    return out;
  }

  drawProp(ctx, p, time, cam) {
    const ox = cam.x, oy = cam.y;
    const x = p.x - ox;
    const y = p.y - oy;
    const sway = Math.sin(time * 0.8 + p.x * 0.02) * 1.6;
    const h = p.seed || 0.5;

    switch (p.type) {
      case 'tree': {
        const sc = 0.8 + h * 0.45;
        const tone = h > 0.55 ? ['#1c2a17', '#29401f', '#38552c'] : h > 0.25 ? ['#1e2c19', '#2b3f22', '#3a5330'] : ['#202e1a', '#304722', '#405c32'];
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(x + 6 * sc, y + 4, 26 * sc, 10 * sc, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3a2a1b';
        ctx.fillRect(x - 4 * sc, y - 30 * sc, 8 * sc, 34 * sc);
        ctx.fillStyle = '#4a3824';
        ctx.fillRect(x - 4 * sc, y - 30 * sc, 3 * sc, 34 * sc);
        ctx.fillStyle = tone[0];
        ctx.beginPath();
        ctx.ellipse(x + sway, y - 46 * sc, 30 * sc, 24 * sc, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = tone[1];
        ctx.beginPath();
        ctx.ellipse(x - 8 * sc + sway * 0.6, y - 54 * sc, 22 * sc, 19 * sc, 0.3, 0, TAU);
        ctx.ellipse(x + 12 * sc + sway * 0.8, y - 48 * sc, 19 * sc, 16 * sc, -0.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = tone[2];
        ctx.beginPath();
        ctx.ellipse(x - 6 * sc + sway, y - 60 * sc, 13 * sc, 10 * sc, 0.2, 0, TAU);
        ctx.fill();
        if (h > 0.6) {
          ctx.fillStyle = 'rgba(130, 156, 92, 0.32)';
          ctx.beginPath();
          ctx.ellipse(x + 6 * sc + sway, y - 58 * sc, 5 * sc, 3 * sc, 0, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case 'pine': {
        const sc = 0.82 + h * 0.4;
        ctx.fillStyle = 'rgba(0,0,0,0.26)';
        ctx.beginPath();
        ctx.ellipse(x + 5 * sc, y + 3, 20 * sc, 8 * sc, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#33251a';
        ctx.fillRect(x - 3 * sc, y - 22 * sc, 6 * sc, 26 * sc);
        ctx.fillStyle = '#1c2a1b';
        for (let i = 0; i < 3; i++) {
          const yy = y - (26 + i * 15) * sc;
          const ww = (24 - i * 5) * sc;
          ctx.beginPath();
          ctx.moveTo(x + sway * (i * 0.3), yy - 20 * sc);
          ctx.lineTo(x - ww, yy);
          ctx.lineTo(x + ww, yy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#2c422a';
        ctx.beginPath();
        ctx.moveTo(x + sway, y - 72 * sc);
        ctx.lineTo(x - 12 * sc, y - 48 * sc);
        ctx.lineTo(x + 12 * sc, y - 48 * sc);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'deadtree': {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 2, 14, 6, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#4a4034';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + sway * 0.4, y - 40);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 22);
        ctx.lineTo(x - 14, y - 36);
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x + 13, y - 46);
        ctx.stroke();
        break;
      }
      case 'bush': {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 4, 16, 6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#283a21';
        ctx.beginPath();
        ctx.ellipse(x - 6, y - 2, 10, 8, 0, 0, TAU);
        ctx.ellipse(x + 6, y - 3, 11, 9, 0, 0, TAU);
        ctx.ellipse(x, y - 9, 10, 8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3b5530';
        ctx.beginPath();
        ctx.ellipse(x - 3, y - 10, 6, 4, 0, 0, TAU);
        ctx.fill();
        if (p.berry) {
          ctx.fillStyle = '#b45a4b';
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x - 8 + i * 7, y - 6 - (i % 2) * 4, 1.8, 0, TAU);
            ctx.fill();
          }
        }
        break;
      }
      case 'boulder': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 5, 24, 9, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4a483f';
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x - 14, y - 18);
        ctx.lineTo(x + 2, y - 24);
        ctx.lineTo(x + 18, y - 14);
        ctx.lineTo(x + 20, y + 2);
        ctx.lineTo(x + 4, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5c594e';
        ctx.beginPath();
        ctx.moveTo(x - 14, y - 16);
        ctx.lineTo(x + 2, y - 22);
        ctx.lineTo(x + 10, y - 12);
        ctx.lineTo(x - 6, y - 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(30,29,25,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 2, y - 20);
        ctx.lineTo(x + 4, y - 6);
        ctx.stroke();
        break;
      }
      case 'flint': {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 12, 4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#5b5950';
        for (let i = 0; i < 3; i++) {
          const a = i * 2.1 + h;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 3);
          ctx.lineTo(x + Math.cos(a + 0.6) * 11, y + Math.sin(a + 0.6) * 5 - 4);
          ctx.lineTo(x + Math.cos(a + 1.2) * 5, y + Math.sin(a + 1.2) * 4 + 1);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(210, 205, 180, 0.4)';
        ctx.fillRect(x - 2, y - 5, 2, 1);
        break;
      }
      case 'pillar': {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(x + 3, y + 3, 18, 7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#514c40';
        ctx.fillRect(x - 11, y - 42 + (p.broken ? 12 : 0), 22, 44 - (p.broken ? 12 : 0));
        ctx.fillStyle = '#615b4c';
        ctx.fillRect(x - 11, y - 42 + (p.broken ? 12 : 0), 6, 44 - (p.broken ? 12 : 0));
        ctx.fillStyle = '#3a362d';
        ctx.fillRect(x - 13, y - 2, 26, 5);
        if (p.broken) {
          ctx.fillStyle = '#454033';
          ctx.beginPath();
          ctx.moveTo(x - 11, y - 30);
          ctx.lineTo(x - 2, y - 36);
          ctx.lineTo(x + 4, y - 28);
          ctx.lineTo(x + 11, y - 31);
          ctx.lineTo(x + 11, y - 24);
          ctx.lineTo(x - 11, y - 24);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(60, 80, 50, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 8);
        ctx.lineTo(x + 6, y - 16);
        ctx.stroke();
        break;
      }
      case 'pedestal': {
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 4, 22, 8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4a463b';
        ctx.fillRect(x - 16, y - 6, 32, 10);
        ctx.fillStyle = '#575243';
        ctx.fillRect(x - 11, y - 28, 22, 24);
        ctx.fillStyle = '#6a6453';
        ctx.fillRect(x - 11, y - 28, 5, 24);
        ctx.fillStyle = '#3b372e';
        ctx.fillRect(x - 15, y - 31, 30, 5);
        if (p.shard) {
          const fy = y - 46 + Math.sin(time * 2.2 + p.x) * 3;
          ctx.fillStyle = 'rgba(227, 180, 107, 0.18)';
          ctx.beginPath();
          ctx.arc(x, fy, 24, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#f0c987';
          ctx.beginPath();
          ctx.moveTo(x, fy - 12);
          ctx.lineTo(x + 7, fy);
          ctx.lineTo(x, fy + 12);
          ctx.lineTo(x - 7, fy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff1cf';
          ctx.beginPath();
          ctx.moveTo(x, fy - 8);
          ctx.lineTo(x + 3, fy - 1);
          ctx.lineTo(x, fy + 5);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'worldroot': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 6, 54, 18, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#43301d';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const a = Math.PI * 0.15 + i * 0.28;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + Math.cos(a) * 26, y - 12, x + Math.cos(a) * 46, y + 8);
          ctx.stroke();
        }
        ctx.fillStyle = '#4a3320';
        ctx.beginPath();
        ctx.moveTo(x - 26, y + 4);
        ctx.lineTo(x - 18, y - 92);
        ctx.lineTo(x + 18, y - 92);
        ctx.lineTo(x + 26, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5d4127';
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x - 12, y - 88);
        ctx.lineTo(x - 2, y - 88);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#6c4c2c';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 10 + i * 6, y - 20 - i * 14);
          ctx.quadraticCurveTo(x - 2 + i * 6, y - 30 - i * 14, x + 4 + i * 6, y - 24 - i * 14);
          ctx.stroke();
        }
        const glow = 0.55 + Math.sin(time * 1.6) * 0.18;
        ctx.fillStyle = `rgba(240, 196, 120, ${glow})`;
        for (let i = 0; i < 5; i++) {
          const rx = x - 14 + hash2(i, 2, 7) * 28;
          const ry = y - 24 - i * 11;
          ctx.beginPath();
          ctx.arc(rx, ry, 1.8, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#1d2c1a';
        ctx.beginPath();
        ctx.ellipse(x + sway * 0.3, y - 118, 62, 42, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#273b22';
        ctx.beginPath();
        ctx.ellipse(x - 30 + sway * 0.2, y - 130, 36, 30, 0.3, 0, TAU);
        ctx.ellipse(x + 30 + sway * 0.4, y - 124, 38, 32, -0.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#33502b';
        ctx.beginPath();
        ctx.ellipse(x - 6 + sway * 0.3, y - 142, 30, 22, 0.2, 0, TAU);
        ctx.fill();
        break;
      }
      case 'campfire': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 22, 8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3b352c';
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * 15, y + Math.sin(a) * 7, 5, 3.5, a, 0, TAU);
          ctx.fill();
        }
        ctx.strokeStyle = '#4b3520';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 2);
        ctx.lineTo(x + 10, y - 3);
        ctx.moveTo(x - 9, y - 3);
        ctx.lineTo(x + 9, y + 3);
        ctx.stroke();
        if (p.lit) {
          const f = Math.sin(time * 9 + p.x) * 0.5 + 0.5;
          ctx.fillStyle = 'rgba(240, 160, 70, 0.22)';
          ctx.beginPath();
          ctx.arc(x, y - 8, 34 + f * 5, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#e78c3e';
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 2);
          ctx.quadraticCurveTo(x - 4, y - 18 - f * 5, x, y - 26 - f * 6);
          ctx.quadraticCurveTo(x + 5, y - 16, x + 9, y - 2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#f6c96b';
          ctx.beginPath();
          ctx.moveTo(x - 5, y - 2);
          ctx.quadraticCurveTo(x - 1, y - 13 - f * 4, x + 1, y - 18 - f * 4);
          ctx.quadraticCurveTo(x + 4, y - 10, x + 5, y - 2);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'tent': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 4, 30, 10, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#5a4b34';
        ctx.beginPath();
        ctx.moveTo(x - 30, y);
        ctx.lineTo(x, y - 40);
        ctx.lineTo(x + 30, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6b5a3f';
        ctx.beginPath();
        ctx.moveTo(x - 30, y);
        ctx.lineTo(x, y - 40);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2a2118';
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 2, y - 24);
        ctx.lineTo(x + 14, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3d3122';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 40);
        ctx.lineTo(x, y - 48);
        ctx.stroke();
        break;
      }
      case 'crate': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 16, 6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#5b4528';
        ctx.fillRect(x - 13, y - 18, 26, 20);
        ctx.strokeStyle = '#3c2c18';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 13, y - 18, 26, 20);
        ctx.beginPath();
        ctx.moveTo(x - 13, y - 8);
        ctx.lineTo(x + 13, y - 8);
        ctx.moveTo(x - 5, y - 18);
        ctx.lineTo(x - 5, y + 2);
        ctx.stroke();
        ctx.fillStyle = '#7a5f37';
        ctx.fillRect(x - 13, y - 18, 26, 3);
        break;
      }
      case 'banner': {
        ctx.strokeStyle = '#3d3022';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 52);
        ctx.stroke();
        ctx.fillStyle = '#6d5a3a';
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 50);
        ctx.lineTo(x + 24 + sway, y - 44);
        ctx.lineTo(x + 20 + sway, y - 26);
        ctx.lineTo(x + 2, y - 32);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(227, 180, 107, 0.55)';
        ctx.beginPath();
        ctx.arc(x + 11, y - 38, 3, 0, TAU);
        ctx.fill();
        break;
      }
      case 'log': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 17, 6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4d3822';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x - 18, y - 7, 36, 10, 5) : ctx.rect(x - 18, y - 7, 36, 10);
        ctx.fill();
        ctx.fillStyle = '#6a4d2e';
        ctx.beginPath();
        ctx.ellipse(x - 17, y - 2, 3, 5, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#3a2a19';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 6);
        ctx.lineTo(x - 6, y + 2);
        ctx.stroke();
        break;
      }
      case 'lantern': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 9, 4, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#3b2e1e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 38);
        ctx.stroke();
        ctx.fillStyle = '#2f2519';
        ctx.fillRect(x - 6, y - 50, 12, 14);
        if (p.lit) {
          const fl = 0.7 + Math.sin(time * 6 + p.x) * 0.15;
          ctx.fillStyle = `rgba(245, 190, 105, ${fl})`;
          ctx.fillRect(x - 3, y - 48, 6, 10);
          ctx.fillStyle = 'rgba(245, 190, 105, 0.14)';
          ctx.beginPath();
          ctx.arc(x, y - 43, 26, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#2f2519';
        ctx.fillRect(x - 8, y - 52, 16, 3);
        break;
      }
      case 'rack': {
        ctx.strokeStyle = '#4a3823';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 18, y + 2);
        ctx.lineTo(x - 14, y - 30);
        ctx.moveTo(x + 18, y + 2);
        ctx.lineTo(x + 14, y - 30);
        ctx.moveTo(x - 15, y - 28);
        ctx.lineTo(x + 15, y - 28);
        ctx.stroke();
        ctx.fillStyle = 'rgba(150, 130, 96, 0.55)';
        for (let i = 0; i < 3; i++) ctx.fillRect(x - 10 + i * 9, y - 27, 4, 12 + i * 2);
        break;
      }
      case 'cairn': {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 14, 5, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#565248';
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 12, 5, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, y - 9, 9, 4.5, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, y - 15, 6, 4, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#6f6a5c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 3);
        ctx.lineTo(x + 9, y - 4);
        ctx.stroke();
        ctx.strokeStyle = '#3f3b33';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 8, y - 2);
        ctx.lineTo(x + 12, y - 20);
        ctx.stroke();
        ctx.fillStyle = p.looted ? 'rgba(160,150,130,0.3)' : 'rgba(227, 180, 107, 0.85)';
        ctx.beginPath();
        ctx.arc(x + 12, y - 21, 2.4, 0, TAU);
        ctx.fill();
        break;
      }
      case 'ashring': {
        ctx.fillStyle = 'rgba(14, 12, 10, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x, y, 19, 8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3f3a31';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * 16, y + Math.sin(a) * 7, 3, 2, a, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(180, 170, 150, 0.18)';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 3, 0, 0, TAU);
        ctx.fill();
        break;
      }
      case 'rubble': {
        ctx.fillStyle = '#4b473d';
        for (let i = 0; i < 4; i++) {
          const a = i * 1.9 + h;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * 10, y + Math.sin(a) * 5, 4, 3, a, 0, TAU);
          ctx.fill();
        }
        break;
      }
      case 'reeds': {
        ctx.strokeStyle = 'rgba(126, 138, 92, 0.6)';
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 4; i++) {
          const rx = x - 8 + i * 5;
          const rh = 10 + hash2(p.tx, p.ty, i) * 10;
          ctx.beginPath();
          ctx.moveTo(rx, y + 2);
          ctx.quadraticCurveTo(rx + sway, y - rh * 0.6, rx + sway * 1.4, y - rh);
          ctx.stroke();
        }
        break;
      }
    }
  }

  drawHighlight(ctx, prop, cam, time) {
    const x = prop.x - cam.x;
    const y = prop.y - cam.y;
    ctx.strokeStyle = `rgba(227, 180, 107, ${0.45 + Math.sin(time * 4) * 0.15})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 22, 9, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
