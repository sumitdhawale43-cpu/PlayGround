import { Rng, Noise, clamp, lerp, TAU, pointSegDist, shadeHex, mixHex, floorTo } from './util.js';

export const WORLD_W = 3800;
export const WORLD_H = 2800;

export const BIOME = {
  meadow: { base: '#6d7a4a', shades: ['#657244', '#74814f', '#5f6c42'] },
  forest: { base: '#44523a', shades: ['#3e4b35', '#4a593e', '#374331'] },
  bog: { base: '#455142', shades: ['#404d3f', '#4b5746', '#394639'] },
  ash: { base: '#4e4841', shades: ['#544d45', '#47413b', '#5a534b'] },
  rock: { base: '#595b55', shades: ['#545650', '#60625b', '#4e504b'] },
  water: { base: '#2e4a4f', shades: ['#2a454a', '#335156', '#263f44'] },
  village: { base: '#6f6043', shades: ['#776749', '#685a3e', '#7d6d4d'] }
};

export const BIOME_NAMES = {
  meadow: 'The Long Meadow',
  forest: 'The Whispering Wood',
  bog: 'The Sunkfen',
  ash: 'The Ashen Reach',
  rock: 'The Grey Steps',
  water: 'The Stillwater',
  village: 'Hollowmoor'
};

const MIN_SEP = {
  pine: 54, oak: 66, dead: 46, rock: 46, bush: 34, reed: 20, flower: 22,
  mushroom: 26, stump: 34, bone: 30, log: 46, crate: 40, barrel: 40,
  fence: 24, banner: 50, lantern: 80, sign: 60, garden: 80, ruinPillar: 40,
  ruinWall: 60, cache: 90
};

export function createWorld(seed = 1234) {
  const rng = new Rng(seed);
  const nGround = new Noise(seed);
  const nMoist = new Noise(seed + 101);
  const nRock = new Noise(seed + 202);
  const nDetail = new Noise(seed + 303);

  const village = { x: Math.round(WORLD_W * 0.52), y: Math.round(WORLD_H * 0.5) };
  const lake = { x: WORLD_W * 0.845, y: WORLD_H * 0.32, rx: 545, ry: 410 };
  const bog = { x: 790, y: 2320, rx: 760, ry: 480 };
  const ruins = { x: village.x + 660, y: village.y - 800, name: 'The Sunken Court' };

  const cairns = [
    { id: 'weeping', name: 'The Weeping Cairn', x: village.x - 1180, y: village.y - 730, lit: false },
    { id: 'ash', name: 'The Cairn of Ash', x: village.x + 1080, y: village.y + 790, lit: false },
    { id: 'gate', name: 'The Hollow Gate', x: village.x - 340, y: village.y + 1080, lit: false }
  ];

  const pathPlans = [
    { to: 'weeping', end: cairns[0] },
    { to: 'ash', end: cairns[1] },
    { to: 'gate', end: cairns[2] },
    { to: 'ruins', end: ruins }
  ];

  function waterAt(x, y) {
    const wobble = (nMoist.fbm(x * 0.0038, y * 0.0038, 2) - 0.5) * 0.24;
    const nx = (x - lake.x) / lake.rx;
    const ny = (y - lake.y) / lake.ry;
    return nx * nx + ny * ny < 1 + wobble;
  }

  function inBog(x, y) {
    const nx = (x - bog.x) / bog.rx;
    const ny = (y - bog.y) / bog.ry;
    if (nx * nx + ny * ny > 1) return false;
    return nMoist.fbm(x * 0.0032 + 9, y * 0.0032 + 3, 3) > 0.41;
  }

  function nearAsh(x, y) {
    for (const c of cairns) {
      const radius = 285 + nMoist.value(x * 0.012, y * 0.012) * 130;
      if ((x - c.x) ** 2 + (y - c.y) ** 2 < radius * radius) return true;
    }
    return false;
  }

  function biomeAt(x, y) {
    if (waterAt(x, y)) return 'water';
    if ((x - village.x) ** 2 + (y - village.y) ** 2 < 286 * 286) return 'village';
    if (nearAsh(x, y)) return 'ash';
    if (inBog(x, y)) return 'bog';
    if (nRock.fbm(x * 0.0017 + 4, y * 0.0017 + 11, 3) > 0.665) return 'rock';
    if (nGround.fbm(x * 0.00155, y * 0.00155, 4) > 0.525) return 'forest';
    return 'meadow';
  }

  /* ---------- roads ---------- */
  const paths = pathPlans.map((plan, pi) => {
    const end = plan.end;
    const dx = end.x - village.x, dy = end.y - village.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const start = { x: village.x + ux * 150, y: village.y + uy * 150 };
    const endPad = 120;
    const ex = end.x - ux * endPad, ey = end.y - uy * endPad;
    const mx = (start.x + ex) / 2, my = (start.y + ey) / 2;
    const bend = (pi % 2 ? 1 : -1) * Math.min(260, len * 0.16);
    const cx = mx - uy * bend, cy = my + ux * bend;
    const points = [];
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const it = 1 - t;
      points.push({
        x: it * it * start.x + 2 * it * t * cx + t * t * ex,
        y: it * it * start.y + 2 * it * t * cy + t * t * ey
      });
    }
    return { id: plan.to, points };
  });

  function nearPath(x, y, pad = 40) {
    for (const path of paths) {
      for (let i = 0; i < path.points.length - 1; i++) {
        const a = path.points[i], b = path.points[i + 1];
        if (pointSegDist(x, y, a.x, a.y, b.x, b.y) < pad) return true;
      }
    }
    return false;
  }

  /* ---------- village ---------- */
  const hearth = { x: village.x, y: village.y + 8, r: 17, eternal: true };
  const hutAngles = [-2.08, -1.42, -0.24, 0.14, 1.32, 2.86];
  const hutNames = ['Maren’s Hearth', 'Ivo’s Lodge', 'The Longhouse', 'Orin’s Cot', 'Sable’s Hollow', 'Elsbeth’s Forge'];
  const hutColors = ['#6b5438', '#5d4c36', '#705a3b', '#63513a', '#574732', '#6d5639'];
  const huts = hutAngles.map((angle, i) => {
    const d = 214 + rng.range(-10, 10);
    const x = village.x + Math.cos(angle) * d;
    const y = village.y + Math.sin(angle) * d;
    const r = i === 2 ? 72 : 55 + rng.range(0, 9);
    return {
      id: `hut${i}`,
      x, y, r,
      angle,
      doorAngle: angle + Math.PI,
      name: hutNames[i],
      color: hutColors[i],
      lit: false,
      stolen: false
    };
  });

  /* ---------- props ---------- */
  const props = [];
  const detailProps = [];
  const colliders = [];
  const grid = new Map();
  const CELL = 100;

  function gridKey(x, y) { return `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`; }
  function tooClose(x, y, kind) {
    const min = MIN_SEP[kind] || 25;
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const list = grid.get(`${gx},${gy}`);
        if (!list) continue;
        for (const p of list) {
          const m = Math.max(min, MIN_SEP[p.kind] || 25) * 0.62;
          if ((p.x - x) ** 2 + (p.y - y) ** 2 < m * m) return true;
        }
      }
    }
    return false;
  }
  function register(prop) {
    props.push(prop);
    const k = gridKey(prop.x, prop.y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(prop);
  }

  function baseProp(kind, x, y, bi, extra = {}) {
    const p = {
      kind, x, y, biome: bi,
      s: 1,
      seed: rng.range(0, 1000),
      hp: 0,
      done: false,
      harvested: false,
      regrow: 0,
      solid: false,
      ...extra
    };
    if (kind === 'pine') { p.s = rng.range(0.84, 1.3); p.r = 15 * p.s; p.hp = 3; p.solid = true; }
    if (kind === 'oak') { p.s = rng.range(0.86, 1.24); p.r = 19 * p.s; p.hp = 4; p.solid = true; }
    if (kind === 'dead') { p.s = rng.range(0.8, 1.25); p.r = 9 * p.s; p.hp = 2; p.solid = true; }
    if (kind === 'rock') { p.s = rng.range(0.7, 1.5); p.r = 16 * p.s; p.hp = 3; p.solid = true; }
    if (kind === 'log') { p.s = rng.range(0.8, 1.2); p.r = 13; }
    if (kind === 'bush') { p.s = rng.range(0.8, 1.2); p.berries = rng.int(2, 4); }
    if (kind === 'reed') { p.s = rng.range(0.7, 1.3); }
    if (kind === 'flower') { p.s = rng.range(0.7, 1.2); p.hue = rng.pick(['#d8b46a', '#c7d3a2', '#c98d77', '#b8c9c3']); }
    if (kind === 'mushroom') { p.s = rng.range(0.7, 1.2); }
    if (kind === 'stump') { p.s = rng.range(0.8, 1.2); }
    if (kind === 'bone') { p.s = rng.range(0.8, 1.2); }
    if (kind === 'crate') { p.s = rng.range(0.9, 1.1); p.r = 11; p.solid = true; p.loot = { berry: rng.int(1, 2), fiber: rng.int(1, 2) }; p.stolen = false; }
    if (kind === 'barrel') { p.s = 1; p.r = 9; p.solid = true; p.loot = { berries: 1 }; p.stolen = false; }
    if (kind === 'banner') { p.s = rng.range(0.9, 1.1); p.hue = rng.pick(['#7c3f2e', '#5b6340', '#6a4e2c']); }
    if (kind === 'lantern') { p.s = 1; p.r = 4; p.solid = true; }
    if (kind === 'sign') { p.s = 1; p.r = 4; p.solid = true; }
    if (kind === 'garden') { p.s = 1; p.r = 0; p.berries = 3; p.rows = 3; p.w = 56; p.h = 32; }
    if (kind === 'ruinPillar') { p.s = rng.range(0.85, 1.15); p.r = 15 * p.s; p.solid = true; }
    if (kind === 'ruinWall') { p.s = rng.range(0.9, 1.2); p.r = 22; p.solid = true; p.len = rng.range(54, 88); p.rot = rng.range(0, TAU); }
    if (kind === 'cache') { p.s = 1; p.r = 13; p.solid = true; p.loot = { arrows: 5, stone: 4, torches: 1 }; p.stolen = false; }
    return p;
  }

  const kindsByBiome = {
    forest: [['pine', 0.62], ['oak', 0.12], ['bush', 0.09], ['mushroom', 0.07], ['rock', 0.04], ['dead', 0.04], ['stump', 0.02]],
    meadow: [['oak', 0.2], ['bush', 0.22], ['flower', 0.22], ['rock', 0.1], ['log', 0.05], ['mushroom', 0.03], ['stump', 0.03], ['dead', 0.02], ['pine', 0.13]],
    bog: [['dead', 0.3], ['reed', 0.3], ['mushroom', 0.1], ['rock', 0.08], ['bush', 0.1], ['stump', 0.06], ['bone', 0.06]],
    ash: [['dead', 0.32], ['bone', 0.24], ['rock', 0.18], ['stump', 0.12], ['bush', 0.06], ['log', 0.08]],
    rock: [['rock', 0.54], ['dead', 0.16], ['pine', 0.14], ['bush', 0.08], ['mushroom', 0.08]]
  };

  function pickKind(biome) {
    const table = kindsByBiome[biome];
    if (!table) return null;
    let r = rng.next();
    for (const [kind, prob] of table) {
      r -= prob;
      if (r <= 0) return kind;
    }
    return table[0][0];
  }

  const detailKinds = ['grass', 'grass', 'grass', 'pebble', 'twig', 'sprout'];

  for (let i = 0; i < 8200; i++) {
    const x = rng.range(30, WORLD_W - 30);
    const y = rng.range(30, WORLD_H - 30);
    const biome = biomeAt(x, y);
    if (biome === 'water') {
      if (rng.chance(0.35) && detailProps.length < 1600) {
        detailProps.push({ kind: 'lily', x, y, s: rng.range(0.6, 1.1), seed: rng.range(0, 1000) });
      }
      continue;
    }
    if (biome === 'village' || biome === 'rock') {
      // rock biome handled below; village cleared
    }
    if (biome === 'village') continue;
    if ((x - village.x) ** 2 + (y - village.y) ** 2 < 300 * 300) continue;
    if (nearPath(x, y, 38)) continue;
    let skipCairn = false;
    for (const c of cairns) if ((x - c.x) ** 2 + (y - c.y) ** 2 < 145 * 145) skipCairn = true;
    if (skipCairn) continue;
    if ((x - ruins.x) ** 2 + (y - ruins.y) ** 2 < 160 * 160) continue;

    const kind = pickKind(biome);
    if (!kind) continue;
    const density = biome === 'forest' ? 0.72 : biome === 'meadow' ? 0.34 : 0.5;
    if (!rng.chance(density)) continue;
    if (tooClose(x, y, kind)) continue;
    const p = baseProp(kind, x, y, biome);
    register(p);
    if (p.solid) colliders.push({ x: p.x, y: p.y, r: p.r, prop: p });
  }

  // scattered ground detail (no collision)
  for (let i = 0; i < 1900; i++) {
    const x = rng.range(20, WORLD_W - 20);
    const y = rng.range(20, WORLD_H - 20);
    if (waterAt(x, y)) continue;
    detailProps.push({ kind: rng.pick(detailKinds), x, y, s: rng.range(0.6, 1.25), seed: rng.range(0, 1000) });
  }

  /* ---------- village dressing ---------- */
  function addVillageProp(kind, x, y, extra = {}) {
    const p = baseProp(kind, x, y, 'village', extra);
    props.push(p);
    if (p.solid) colliders.push({ x: p.x, y: p.y, r: p.r, prop: p });
    return p;
  }

  const villageProps = [
    addVillageProp('crate', village.x + 118, village.y + 44, { stolen: false }),
    addVillageProp('crate', village.x + 148, village.y + 96, { stolen: false }),
    addVillageProp('barrel', village.x - 98, village.y + 118),
    addVillageProp('barrel', village.x + 52, village.y - 138),
    addVillageProp('garden', village.x - 152, village.y + 54, { angle: -0.3 }),
    addVillageProp('garden', village.x - 142, village.y + 112, { angle: 0.2 }),
    addVillageProp('banner', village.x + 70, village.y - 74, { hue: '#7c3f2e', angle: 0.4 }),
    addVillageProp('banner', village.x - 62, village.y + 84, { hue: '#5b6340', angle: 2.6 }),
    addVillageProp('sign', village.x - 44, village.y + 168, { angle: -0.16 })
  ];
  const crates = villageProps.filter(p => p.kind === 'crate');
  const gardens = villageProps.filter(p => p.kind === 'garden');

  // Lanterns line the first stretch of every road.
  const lanterns = [];
  for (const path of paths) {
    for (const idx of [7, 15]) {
      const pt = path.points[idx];
      const px = pt.x, py = pt.y;
      const p = baseProp('lantern', px + (idx === 7 ? 24 : -24), py + 12, 'village');
      p.solid = false;
      props.push(p);
      lanterns.push({ x: p.x, y: p.y - 20, r: 118, prop: p });
    }
  }

  /* ---------- village huts colliders ---------- */
  for (const h of huts) {
    colliders.push({ x: h.x, y: h.y + 6, r: h.r * 0.72, prop: h });
  }

  /* ---------- cairn stones ---------- */
  for (const cairn of cairns) {
    cairn.stones = [];
    cairn.radius = 108;
    const count = 6;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + 0.3;
      const rr = 92 + (i % 2) * 15;
      const st = {
        kind: 'standingStone',
        x: cairn.x + Math.cos(a) * rr,
        y: cairn.y + Math.sin(a) * rr,
        s: 0.9 + (i % 3) * 0.16,
        seed: i * 37 + cairn.x,
        rot: a + Math.PI / 2,
        solid: true,
        hp: 0,
        done: false
      };
      props.push(st);
      colliders.push({ x: st.x, y: st.y, r: 13, prop: st });
      cairn.stones.push(st);
    }
    cairn.stones.sort((a, b) => a.y - b.y);
  }

  /* ---------- ruins ---------- */
  const ruinProps = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.5;
    const rr = 82 + (i % 2) * 18;
    const p = baseProp('ruinPillar', ruins.x + Math.cos(a) * rr, ruins.y + Math.sin(a) * rr, 'rock');
    ruinProps.push(p);
    props.push(p);
    colliders.push({ x: p.x, y: p.y, r: p.r, prop: p });
  }
  for (let i = 0; i < 3; i++) {
    const p = baseProp('ruinWall', ruins.x + Math.cos(i * 2.1 + 0.4) * 122, ruins.y + Math.sin(i * 2.1 + 0.4) * 122, 'rock');
    ruinProps.push(p);
    props.push(p);
    colliders.push({ x: p.x, y: p.y, r: 20, prop: p });
  }
  const cache = baseProp('cache', ruins.x + 6, ruins.y + 12, 'ruins');
  props.push(cache);
  colliders.push({ x: cache.x, y: cache.y, r: cache.r, prop: cache });
  ruinProps.push(cache);

  /* ---------- static ground texture / minimap ---------- */
  const groundCanvas = buildGroundCanvas(biomeAt, nDetail);
  const minimap = buildMinimap(biomeAt, paths);

  /* ---------- collision grid ---------- */
  const colGrid = new Map();
  const CCELL = 180;
  for (const c of colliders) {
    const key = `${Math.floor(c.x / CCELL)},${Math.floor(c.y / CCELL)}`;
    if (!colGrid.has(key)) colGrid.set(key, []);
    colGrid.get(key).push(c);
  }

  const world = {
    seed, w: WORLD_W, h: WORLD_H,
    village, lake, bog, ruins, cairns, paths, hearth, huts,
    props, detailProps, colliders, colGrid, colCell: CCELL,
    lanterns, crates, gardens, cache, ruinProps,
    groundCanvas, minimap,
    biomeAt, waterAt,
    biomeNameAt(x, y) {
      const b = biomeAt(x, y);
      if (Math.hypot(x - village.x, y - village.y) < 320) return 'Hollowmoor';
      for (const c of cairns) if (Math.hypot(x - c.x, y - c.y) < 220) return c.name;
      if (Math.hypot(x - ruins.x, y - ruins.y) < 190) return 'The Sunken Court';
      return BIOME_NAMES[b] || 'Hollowmoor';
    },
    nearestCairn(x, y) {
      let best = null, bd = Infinity;
      for (const c of cairns) {
        const d = (x - c.x) ** 2 + (y - c.y) ** 2;
        if (d < bd) { bd = d; best = c; }
      }
      return best;
    }
  };
  return world;
}

function buildGroundCanvas(biomeAt, noise) {
  const scale = 0.16;
  const w = Math.ceil(WORLD_W * scale);
  const h = Math.ceil(WORLD_H * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const cache = new Map();
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const wx = px / scale, wy = py / scale;
      const biome = biomeAt(wx, wy);
      let palette = BIOME[biome];
      if (!palette) palette = BIOME.meadow;
      const v = noise.value(px * 0.44, py * 0.44);
      const idx = Math.min(2, Math.floor(v * 3));
      const hex = palette.shades[idx];
      const n = parseInt(hex.slice(1), 16);
      const i = (py * w + px) * 4;
      img.data[i] = (n >> 16) & 255;
      img.data[i + 1] = (n >> 8) & 255;
      img.data[i + 2] = n & 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function buildMinimap(biomeAt, paths) {
  const w = 184, h = 136;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const wx = (x / w) * WORLD_W, wy = (y / h) * WORLD_H;
      const b = biomeAt(wx, wy);
      ctx.fillStyle = BIOME[b] ? BIOME[b].base : '#5a6742';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.strokeStyle = 'rgba(216, 180, 106, 0.32)';
  ctx.lineWidth = 1.2;
  for (const path of paths) {
    ctx.beginPath();
    path.points.forEach((p, i) => {
      const x = (p.x / WORLD_W) * w, y = (p.y / WORLD_H) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  return canvas;
}

/** Resolve a circle against the world's solid colliders. Mutates and returns {x,y}. */
export function resolveCollisions(world, x, y, radius) {
  const cells = 1;
  let px = x, py = y;
  for (let pass = 0; pass < 2; pass++) {
    const cx = Math.floor(px / world.colCell), cy = Math.floor(py / world.colCell);
    for (let gx = cx - cells; gx <= cx + cells; gx++) {
      for (let gy = cy - cells; gy <= cy + cells; gy++) {
        const list = world.colGrid.get(`${gx},${gy}`);
        if (!list) continue;
        for (const c of list) {
          if (c.prop && (c.prop.done || c.prop.kind === 'garden' || c.prop.kind === 'lantern')) continue;
          const dx = px - c.x, dy = py - c.y;
          const rr = radius + c.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 0.001;
          px += (dx / d) * (rr - d);
          py += (dy / d) * (rr - d);
        }
      }
    }
  }
  return {
    x: clamp(px, 24, world.w - 24),
    y: clamp(py, 24, world.h - 24)
  };
}

export function hasLineOfSight(world, x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 26);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = lerp(x1, x2, t), y = lerp(y1, y2, t);
    const cx = Math.floor(x / world.colCell), cy = Math.floor(y / world.colCell);
    for (let gx = cx - 0; gx <= cx; gx++) {
      for (let gy = cy - 0; gy <= cy; gy++) {
        const list = world.colGrid.get(`${gx},${gy}`);
        if (!list) continue;
        for (const c of list) {
          if (!c.prop || c.prop.done) continue;
          if (c.prop.kind === 'lantern' || c.prop.kind === 'bush' || c.prop.kind === 'garden') continue;
          if ((x - c.x) ** 2 + (y - c.y) ** 2 < (c.r + 4) ** 2) return false;
        }
      }
    }
  }
  return true;
}

export function randomLandPoint(world, rng, filter) {
  for (let i = 0; i < 200; i++) {
    const x = rng.range(120, world.w - 120);
    const y = rng.range(120, world.h - 120);
    const b = world.biomeAt(x, y);
    if (b === 'water') continue;
    if (filter && !filter(x, y, b)) continue;
    return { x, y };
  }
  return { x: world.village.x + 200, y: world.village.y + 200 };
}
