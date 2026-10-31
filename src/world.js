// ── The Remembering — procedural valley ──────────────────────────────────────
import {
  TILE, GRID, WORLD, BIOME, BIOME_INFO, RNG, fbm, clamp, dist,
} from './util.js';

const NAME_BANK = {
  [BIOME.FOREST]: [
    ['Hollow', 'Mosslight', 'Briar', 'Rook', 'Fallow', 'Thorn'],
    ['Pines', 'Wood', 'Thicket', 'Reach', 'Holt', 'Canopy'],
  ],
  [BIOME.MARSH]: [
    ['Drowned', 'Willow', 'Fen', 'Reed', 'Mire', 'Grey'],
    ['Fen', 'Marsh', 'Mire', 'Crossing', 'Water', 'Hollow'],
  ],
  [BIOME.ROCK]: [
    ['Grey', 'Stone', 'Rook', 'Iron', 'High', 'Bare'],
    ['Watch', 'Crag', 'Rise', 'Spine', 'Shelf', 'Gate'],
  ],
  [BIOME.ASH]: [
    ['Cinder', 'Ashen', 'Ember', 'Soot', 'Char', 'Black'],
    ['Steppe', 'Vale', 'Waste', 'Reach', 'Field', 'Hollow'],
  ],
  [BIOME.MEADOW]: [
    ['Amber', 'Fallow', 'Long', 'Sweet', 'Golden', 'Quiet'],
    ['Meadow', 'Reach', 'Crossing', 'Grass', 'Downs', 'Field'],
  ],
  [BIOME.SAND]: [
    ['Pale', 'Salt', 'Shell', 'Wrack', 'Dune', 'Low'],
    ['Shore', 'Strand', 'Bank', 'Beach', 'Cove', 'Point'],
  ],
};

const RESOURCE_RULES = {
  [BIOME.FOREST]: [['tree', 0.20], ['bush', 0.035], ['fiber', 0.05], ['rock', 0.008]],
  [BIOME.MEADOW]: [['tree', 0.018], ['bush', 0.045], ['fiber', 0.05], ['berry', 0.022], ['rock', 0.012]],
  [BIOME.MARSH]:  [['reed', 0.16], ['bush', 0.025], ['fiber', 0.035], ['tree', 0.02]],
  [BIOME.ROCK]:   [['rock', 0.14], ['tree', 0.014], ['fiber', 0.012]],
  [BIOME.ASH]:    [['rock', 0.07], ['deadtree', 0.035], ['fiber', 0.01]],
  [BIOME.SAND]:   [['reed', 0.018], ['rock', 0.01], ['driftwood', 0.012]],
};

export class World {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.rng = new RNG(this.seed);
    this.tiles = new Uint8Array(GRID * GRID);
    this.heights = new Float32Array(GRID * GRID);
    this.moisture = new Float32Array(GRID * GRID);
    this.regions = [];
    this.pois = [];
    this.settlements = [];
    this.resources = [];
    this.explored = new Uint8Array(48 * 48);
    this.spawn = { x: WORLD / 2, y: WORLD / 2 };
    this.generateTerrain();
    this.generateRegions();
    this.placeWorld();
    this.spawnResources();
    this.ensureTutorialResources();
    this.pickSpawn();
  }

  generateTerrain() {
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const nx = (gx + 0.5) / GRID;
        const ny = (gy + 0.5) / GRID;
        const d = Math.hypot(nx - 0.5, ny - 0.5) * 1.48;
        let h = fbm(nx * 2.7 + 11.3, ny * 2.7 + 4.7, this.seed, 5);
        h = h * 0.94 + 0.17 - d * d * 0.72;
        h += (fbm(nx * 8.1 + 30, ny * 8.1 + 70, this.seed ^ 0x5bd1, 3) - 0.5) * 0.055;
        const m = fbm(nx * 3.2 + 47.1, ny * 3.2 + 91.7, this.seed ^ 0x9e3779b9, 3);
        this.heights[gy * GRID + gx] = h;
        this.moisture[gy * GRID + gx] = m;
        let biome;
        if (h < 0.385) biome = BIOME.WATER;
        else if (h < 0.412) biome = BIOME.SAND;
        else if (h > 0.735) biome = BIOME.ROCK;
        else if (m > 0.635) biome = BIOME.MARSH;
        else if (h > 0.625 && m < 0.405) biome = BIOME.ASH;
        else if (m > 0.485) biome = BIOME.FOREST;
        else biome = BIOME.MEADOW;
        this.tiles[gy * GRID + gx] = biome;
      }
    }
  }

  generateRegions() {
    const used = new Set();
    for (let ry = 0; ry < 3; ry++) {
      for (let rx = 0; rx < 3; rx++) {
        const id = ry * 3 + rx;
        const counts = {};
        const x0 = Math.floor(rx * GRID / 3), x1 = Math.floor((rx + 1) * GRID / 3);
        const y0 = Math.floor(ry * GRID / 3), y1 = Math.floor((ry + 1) * GRID / 3);
        for (let gy = y0; gy < y1; gy++) {
          for (let gx = x0; gx < x1; gx++) {
            const b = this.tiles[gy * GRID + gx];
            if (b !== BIOME.WATER) counts[b] = (counts[b] || 0) + 1;
          }
        }
        let dominant = BIOME.MEADOW;
        let best = -1;
        for (const [k, v] of Object.entries(counts)) {
          if (v > best) { best = v; dominant = Number(k); }
        }
        const bank = NAME_BANK[dominant] || NAME_BANK[BIOME.MEADOW];
        let name = '';
        for (let i = 0; i < 24; i++) {
          const candidate = `${this.rng.pick(bank[0])} ${this.rng.pick(bank[1])}`;
          if (!used.has(candidate)) { name = candidate; used.add(candidate); break; }
        }
        if (!name) name = `Unnamed ${id + 1}`;
        this.regions.push({
          id, name, dominant,
          rect: { x0: x0 * TILE, y0: y0 * TILE, x1: x1 * TILE, y1: y1 * TILE },
          states: [], heat: 0, discovered: false,
        });
      }
    }
  }

  placeWorld() {
    const settlementNames = ['Hearthcamp', 'Fenwick', 'Ashwatch'];
    const settlementRegions = [4, 0, 8];
    settlementRegions.forEach((regionId, i) => {
      const poi = this.placePOI('settlement', regionId, settlementNames[i], 420, true);
      if (!poi) return;
      const roles = i === 0
        ? ['Keeper', 'Trader', 'Hunter']
        : i === 1 ? ['Elder', 'Trader', 'Warden'] : ['Warden', 'Trader', 'Hunter'];
      const names = i === 0
        ? ['Maelin', 'Sable', 'Orin']
        : i === 1 ? ['Tove', 'Bram', 'Iris'] : ['Rook', 'Lark', 'Dain'];
      poi.npcSpots = roles.map((role, j) => {
        const a = (j / roles.length) * Math.PI * 2 + this.rng.range(-0.4, 0.4);
        const r = this.rng.range(34, 58);
        return { role, name: names[j], x: poi.x + Math.cos(a) * r, y: poi.y + Math.sin(a) * r };
      });
      poi.tents = [];
      for (let j = 0; j < 3; j++) {
        const a = (j / 3) * Math.PI * 2 + 0.7;
        poi.tents.push({ x: poi.x + Math.cos(a) * 78, y: poi.y + Math.sin(a) * 78, rot: a + Math.PI / 2, hue: j });
      }
      poi.fire = { x: poi.x, y: poi.y };
      poi.radius = 108;
      this.settlements.push(poi);
    });

    const ruinNames = ['The Sunken Chapel', 'Old Greywatch', 'Bone Circle'];
    [2, 6, 7].forEach((regionId, i) => {
      const poi = this.placePOI('ruin', regionId, ruinNames[i], 340, false);
      if (!poi) return;
      poi.walls = [];
      const n = 5 + Math.floor(this.rng.range(0, 3));
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2;
        poi.walls.push({
          x: poi.x + Math.cos(a) * this.rng.range(36, 62),
          y: poi.y + Math.sin(a) * this.rng.range(30, 52),
          w: this.rng.range(24, 52), h: this.rng.range(13, 20),
          rot: a + this.rng.range(-0.4, 0.4),
        });
      }
      poi.chest = { x: poi.x + this.rng.range(-18, 18), y: poi.y + this.rng.range(10, 30) };
      poi.radius = 90;
    });

    const shrineNames = ['Shrine of the Quiet', 'The Ember Shrine'];
    [1, 5].forEach((regionId, i) => {
      const poi = this.placePOI('shrine', regionId, shrineNames[i], 320, false);
      if (!poi) return;
      poi.stones = [];
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2 + 0.2;
        poi.stones.push({
          x: poi.x + Math.cos(a) * 40, y: poi.y + Math.sin(a) * 34,
          h: this.rng.range(28, 46), w: this.rng.range(9, 14), rot: this.rng.range(-0.2, 0.2),
        });
      }
      poi.radius = 70;
    });

    [3, 7].forEach((regionId, i) => {
      const poi = this.placePOI('camp', regionId, i === 0 ? "Hunter's Rest" : 'Drifter Camp', 280, false);
      if (!poi) return;
      poi.radius = 58;
      poi.npcSpots = [{
        role: i === 0 ? 'Hunter' : 'Drifter',
        name: i === 0 ? 'Fenn' : 'Sorrel',
        x: poi.x + 20, y: poi.y + 12,
      }];
      poi.tents = [{ x: poi.x - 24, y: poi.y - 12, rot: 0.5, hue: 2 }];
      poi.fire = { x: poi.x + 10, y: poi.y - 6 };
    });
  }

  placePOI(type, regionId, name, minSpacing, needsOpen) {
    const region = this.regions[regionId];
    const target = { x: (region.rect.x0 + region.rect.x1) / 2, y: (region.rect.y0 + region.rect.y1) / 2 };
    let best = null, bestScore = -1;
    for (let attempt = 0; attempt < 120; attempt++) {
      const x = attempt === 0 ? target.x : region.rect.x0 + this.rng.range(0.14, 0.86) * (region.rect.x1 - region.rect.x0);
      const y = attempt === 0 ? target.y : region.rect.y0 + this.rng.range(0.14, 0.86) * (region.rect.y1 - region.rect.y0);
      if (!this.isLand(x, y)) continue;
      if (needsOpen && this.landFraction(x, y, 5) < 0.74) continue;
      if (this.pois.some(p => dist(p.x, p.y, x, y) < minSpacing)) continue;
      let score = this.landFraction(x, y, 4) + this.rng.range(0, 0.18);
      if (x < 200 || y < 200 || x > WORLD - 200 || y > WORLD - 200) score -= 0.5;
      if (score > bestScore) { bestScore = score; best = { x, y }; }
      if (attempt > 70 && best) break;
    }
    if (!best) {
      for (let i = 0; i < 500; i++) {
        const x = this.rng.range(180, WORLD - 180), y = this.rng.range(180, WORLD - 180);
        if (this.isLand(x, y) && this.landFraction(x, y, 4) > 0.7 &&
            !this.pois.some(p => dist(p.x, p.y, x, y) < minSpacing)) { best = { x, y }; break; }
      }
    }
    if (!best) return null;
    const poi = { id: this.pois.length, type, name, x: best.x, y: best.y, region: regionId };
    this.pois.push(poi);
    return poi;
  }

  spawnResources() {
    const rng = this.rng;
    for (let gy = 1; gy < GRID - 1; gy++) {
      for (let gx = 1; gx < GRID - 1; gx++) {
        const biome = this.tiles[gy * GRID + gx];
        const rules = RESOURCE_RULES[biome];
        if (!rules) continue;
        const x = (gx + rng.range(0.2, 0.8)) * TILE;
        const y = (gy + rng.range(0.2, 0.8)) * TILE;
        if (this.pois.some(p => dist(p.x, p.y, x, y) < (p.type === 'settlement' ? 128 : 68))) continue;
        for (const [kind, chance] of rules) {
          if (!rng.chance(chance)) continue;
          this.addResource(kind, x, y, rng);
          break;
        }
      }
    }
  }

  addResource(kind, x, y, rng = this.rng) {
    const base = {
      kind: 'resource', type: kind, x, y,
      r: kind === 'tree' || kind === 'deadtree' ? 13 : kind === 'rock' ? 15 : 10,
      variant: rng.int(0, 3), phase: rng.range(0, Math.PI * 2),
      hp: kind === 'tree' ? 3 : kind === 'rock' ? 3 : 1,
      maxHp: kind === 'tree' ? 3 : kind === 'rock' ? 3 : 1,
      sway: rng.range(0.7, 1.4),
    };
    if (kind === 'tree') base.pine = rng.chance(0.62);
    if (kind === 'berry') base.ripe = true;
    this.resources.push(base);
    return base;
  }

  ensureTutorialResources() {
    const hearth = this.settlements[0];
    if (!hearth) return;
    const rng = this.rng;
    const counts = { tree: 0, rock: 0, berry: 0 };
    for (let i = 0; i < 24; i++) {
      const a = rng.range(0, Math.PI * 2);
      const r = rng.range(120, 235);
      const x = hearth.x + Math.cos(a) * r;
      const y = hearth.y + Math.sin(a) * r;
      if (!this.isLand(x, y)) continue;
      const type = i % 4 === 0 ? 'rock' : i % 5 === 0 ? 'berry' : 'tree';
      if (counts[type] >= (type === 'tree' ? 8 : 4)) continue;
      if (this.resources.some(n => dist(n.x, n.y, x, y) < 44)) continue;
      this.addResource(type, x, y, rng);
      counts[type]++;
    }
  }

  pickSpawn() {
    const hearth = this.settlements[0];
    if (!hearth) {
      this.spawn = { x: WORLD / 2, y: WORLD / 2 };
      return;
    }
    for (let i = 0; i < 120; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(95, 145);
      const x = hearth.x + Math.cos(a) * r;
      const y = hearth.y + Math.sin(a) * r;
      if (this.canWalk(x, y, 12)) { this.spawn = { x, y }; return; }
    }
    this.spawn = { x: hearth.x, y: hearth.y + 100 };
  }

  // ── queries ────────────────────────────────────────────────────────────────
  tileIndex(x, y) {
    const gx = clamp(Math.floor(x / TILE), 0, GRID - 1);
    const gy = clamp(Math.floor(y / TILE), 0, GRID - 1);
    return gy * GRID + gx;
  }
  biomeAt(x, y) { return this.tiles[this.tileIndex(x, y)]; }
  isWater(x, y) { return this.biomeAt(x, y) === BIOME.WATER; }
  isLand(x, y) { return !this.isWater(x, y); }
  isNearWater(x, y, range = 80) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      for (let r = 20; r <= range; r += 20) {
        if (this.isWater(x + Math.cos(a) * r, y + Math.sin(a) * r)) return true;
      }
    }
    return false;
  }
  canWalk(x, y, r = 10) {
    if (x < r || y < r || x > WORLD - r || y > WORLD - r) return false;
    if (this.isWater(x, y)) return false;
    if (this.isWater(x + r * 0.7, y) || this.isWater(x - r * 0.7, y)) return false;
    if (this.isWater(x, y + r * 0.7) || this.isWater(x, y - r * 0.7)) return false;
    return true;
  }
  landFraction(x, y, tiles) {
    let land = 0, total = 0;
    const gx = Math.floor(x / TILE), gy = Math.floor(y / TILE);
    for (let oy = -tiles; oy <= tiles; oy++) {
      for (let ox = -tiles; ox <= tiles; ox++) {
        const tx = gx + ox, ty = gy + oy;
        if (tx < 0 || ty < 0 || tx >= GRID || ty >= GRID) continue;
        total++;
        if (this.tiles[ty * GRID + tx] !== BIOME.WATER) land++;
      }
    }
    return total ? land / total : 0;
  }
  regionAt(x, y) {
    const rx = clamp(Math.floor(x / WORLD * 3), 0, 2);
    const ry = clamp(Math.floor(y / WORLD * 3), 0, 2);
    return this.regions[ry * 3 + rx];
  }
  poiAt(x, y, range = 120) {
    return this.pois.find(p => dist(p.x, p.y, x, y) < (p.radius || 90) + range) || null;
  }
  addRegionState(regionId, state) {
    const region = this.regions[regionId];
    if (region && !region.states.includes(state)) region.states.push(state);
  }
  reveal(x, y, radiusTiles = 9) {
    const cx = Math.floor(x / TILE / 2), cy = Math.floor(y / TILE / 2);
    const r = Math.ceil(radiusTiles / 2);
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        const tx = cx + ox, ty = cy + oy;
        if (tx < 0 || ty < 0 || tx >= 48 || ty >= 48) continue;
        if (ox * ox + oy * oy <= r * r) this.explored[ty * 48 + tx] = 1;
      }
    }
  }
  biomeName(x, y) { return BIOME_INFO[this.biomeAt(x, y)].name; }
}
