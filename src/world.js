import { mulberry32, weightedPick, clamp, lerp, mixColor, smoothstep } from './utils.js';

export const WORLD = {
  width: 9200,
  height: 10200,
  surfaceY: 0,
  baseX: 1250,
  baseY: 70,
  depthScale: 10,
};

export const ZONES = [
  {
    id: 'shallows', name: 'Sunlit Shallows', short: 'SHALLOWS',
    min: 0, max: 140, y0: 0, y1: 1400,
    risk: 'LOW', pressure: 0, ambient: 0.035, drain: 0.95,
    top: '#6ff4f2', mid: '#19b3c4', bottom: '#075f78',
    glow: '#c8feff', accent: '#ffd58a', fog: '#0a6d83',
    desc: 'Warm currents, coral gardens and the wreck of a ship that never made it home.',
  },
  {
    id: 'kelp', name: 'Kelp Wilds', short: 'KELP WILDS',
    min: 140, max: 340, y0: 1400, y1: 3400,
    risk: 'MEDIUM', pressure: 0, ambient: 0.15, drain: 1.18,
    top: '#2fc4ae', mid: '#0b7f7b', bottom: '#04444f',
    glow: '#9dffc2', accent: '#d7ff9b', fog: '#075c60',
    desc: 'Towering kelp forests hide salvage, old bones and something with too many teeth.',
  },
  {
    id: 'twilight', name: 'Twilight Trench', short: 'TWILIGHT',
    min: 340, max: 600, y0: 3400, y1: 6000,
    risk: 'HIGH', pressure: 1, ambient: 0.38, drain: 1.45,
    top: '#1c5d88', mid: '#0a3157', bottom: '#051a36',
    glow: '#a99bff', accent: '#6fe9ff', fog: '#071f3c',
    desc: 'The last blue light dies here. Jellyfish bloom in the dark and the rock hums.',
  },
  {
    id: 'abyss', name: 'Midnight Abyss', short: 'ABYSS',
    min: 600, max: 860, y0: 6000, y1: 8600,
    risk: 'EXTREME', pressure: 2, ambient: 0.63, drain: 1.8,
    top: '#0b1f3a', mid: '#050f22', bottom: '#020610',
    glow: '#54e8ff', accent: '#a48bff', fog: '#030b18',
    desc: 'No sunlight has ever reached the ruins down here. The anglerfish know your light.',
  },
  {
    id: 'rift', name: 'Hydrothermal Rift', short: 'THE RIFT',
    min: 860, max: 1020, y0: 8600, y1: 10200,
    risk: 'EXTREME', pressure: 3, ambient: 0.76, drain: 2.2,
    top: '#2d1020', mid: '#12060f', bottom: '#050205',
    glow: '#ff9a5c', accent: '#ffd06b', fog: '#10050c',
    desc: 'The bottom of the world. Superheated vents, black smoke and a pearl the size of a heart.',
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

export const RESOURCE_META = {
  scrap: { name: 'Salvage', short: 'SALVAGE', color: '#c7e2e9', glow: '#9fdfe9', weight: 1 },
  pearl: { name: 'Pearl', short: 'PEARLS', color: '#ffd8a5', glow: '#ffc777', weight: 2 },
  crystal: { name: 'Crystal', short: 'CRYSTALS', color: '#8cecff', glow: '#5ce6ff', weight: 3 },
  repair: { name: 'Repair Kit', short: 'REPAIR', color: '#8dffd3', glow: '#62ffc0', weight: 0 },
};

export const UPGRADES = [
  {
    id: 'oxygen', name: 'Oxygen Reserve', icon: 'oxygen', max: 4, tag: 'LIFE SUPPORT',
    desc: (lvl) => `Adds +25 maximum oxygen. Current reserve: ${100 + lvl * 25} O₂.`,
    cost: (lvl) => ({ scrap: 10 + lvl * 8, pearl: 2 + lvl * 2 }),
  },
  {
    id: 'thruster', name: 'Ion Thruster', icon: 'thruster', max: 4, tag: 'PROPULSION',
    desc: (lvl) => `Increases swim speed by 10%. Current bonus: +${lvl * 10}%.`,
    cost: (lvl) => ({ scrap: 12 + lvl * 10, crystal: Math.floor(lvl / 2) }),
  },
  {
    id: 'hull', name: 'Hull Plating', icon: 'hull', max: 3, tag: 'PRESSURE',
    desc: (lvl) => `+25 hull integrity and pressure rating ${lvl + 1}. Unlocks the ${['Twilight Trench', 'Midnight Abyss', 'Hydrothermal Rift'][Math.min(lvl, 2)]}.`,
    cost: (lvl) => ({ scrap: 14 + lvl * 12, pearl: 4 + lvl * 3 }),
  },
  {
    id: 'lamp', name: 'Deep Lamp', icon: 'lamp', max: 3, tag: 'OPTICS',
    desc: (lvl) => `A wider, brighter beam. Light reach: ${380 + lvl * 110} m-equivalent.`,
    cost: (lvl) => ({ scrap: 8 + lvl * 7, pearl: lvl * 2 }),
  },
  {
    id: 'sonar', name: 'Sonar Suite', icon: 'sonar', max: 1, tag: 'NAVIGATION',
    desc: (lvl) => lvl ? 'Treasures, vents and relic signatures are marked on the sonar map.' : 'Marks chests, air vents and relic signatures on the sonar map.',
    cost: () => ({ scrap: 16, pearl: 6, crystal: 2 }),
  },
  {
    id: 'pulse', name: 'Pulse Emitter', icon: 'pulse', max: 3, tag: 'DEFENSE',
    desc: (lvl) => `Repels nearby creatures. Cooldown ${(9 - lvl * 1.2).toFixed(1)}s, radius ${260 + lvl * 45}.`,
    cost: (lvl) => ({ crystal: 2 + lvl * 2, pearl: 3 + lvl * 2 }),
  },
];

export const RELIC_DEFS = [
  {
    id: 'relic-coral', name: 'Coral Keystone', zone: 'kelp', x: 7220, y: 2540,
    lore: 'A living stone cut from the reef. It hums when the current turns.',
  },
  {
    id: 'relic-prism', name: 'Trench Prism', zone: 'twilight', x: 2630, y: 4920,
    lore: 'It bends the last light of the surface into a map of something below.',
  },
  {
    id: 'relic-sigil', name: 'Abyssal Sigil', zone: 'abyss', x: 7060, y: 7360,
    lore: 'The glyphs are not carved. They grew.',
  },
];

const WATER_STOPS = [
  [0, '#7ff4f2'], [620, '#30c8d1'], [1400, '#0d909d'], [2400, '#087280'],
  [3400, '#0b4166'], [4700, '#07284c'], [6000, '#06152e'], [7300, '#040c1d'],
  [8600, '#0d0818'], [9400, '#1d0a13'], [10200, '#090305'],
];

export function waterColorAt(y) {
  const v = clamp(y, 0, WORLD.height);
  for (let i = 0; i < WATER_STOPS.length - 1; i++) {
    const [y0, c0] = WATER_STOPS[i];
    const [y1, c1] = WATER_STOPS[i + 1];
    if (v >= y0 && v <= y1) return mixColor(c0, c1, smoothstep((v - y0) / (y1 - y0)));
  }
  return WATER_STOPS[WATER_STOPS.length - 1][1];
}

export function yToDepth(y) {
  return Math.max(0, y / WORLD.depthScale);
}

export function zoneAtDepth(depth) {
  for (const z of ZONES) if (depth < z.max) return z;
  return ZONES[ZONES.length - 1];
}

export function zoneAtY(y) {
  return zoneAtDepth(yToDepth(y));
}

export function seabedY(x) {
  return 9870 + Math.sin(x * 0.0011) * 62 + Math.sin(x * 0.0031 + 1.7) * 27 + Math.sin(x * 0.0077 + 0.6) * 9;
}

const VENT_DEFS = [
  { x: 1950, y: 760, zone: 'shallows', type: 'air' },
  { x: 5720, y: 1120, zone: 'shallows', type: 'air' },
  { x: 3260, y: 2140, zone: 'kelp', type: 'air' },
  { x: 7720, y: 3060, zone: 'kelp', type: 'air' },
  { x: 1560, y: 4180, zone: 'twilight', type: 'air' },
  { x: 6880, y: 5280, zone: 'twilight', type: 'air' },
  { x: 4340, y: 6780, zone: 'abyss', type: 'air' },
  { x: 8120, y: 7720, zone: 'abyss', type: 'air' },
  { x: 2440, y: 9120, zone: 'rift', type: 'thermal' },
  { x: 6020, y: 9360, zone: 'rift', type: 'thermal' },
  { x: 8350, y: 9620, zone: 'rift', type: 'thermal' },
];

const SPECIAL_CHESTS = [
  { x: 3980, y: 760, zone: 'shallows', label: 'Wreck of the Calypso' },
  { x: 2520, y: 6630, zone: 'abyss', label: 'Ruined observatory' },
  { x: 7830, y: 9240, zone: 'rift', label: 'Vent vault' },
];

const RUIN_SITES = [
  { x: 2480, y: 6880, zone: 'abyss', scale: 1.1, seed: 41 },
  { x: 6180, y: 7060, zone: 'abyss', scale: 0.82, seed: 77 },
];

const WRECK = { x: 3980, y: 960, zone: 'shallows', angle: -0.11, scale: 1.15 };

const BONES = { x: 5340, y: 4280, zone: 'twilight', angle: 0.12, scale: 1.3 };

function overlapsRock(rocks, x, y, r) {
  for (const rock of rocks) {
    const dx = x - rock.x;
    const dy = y - rock.y;
    if (dx * dx + dy * dy < (rock.r + r) * (rock.r + r)) return true;
  }
  return false;
}

function nearProtected(protectedPoints, x, y, pad = 0) {
  for (const p of protectedPoints) {
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy < (p.r + pad) * (p.r + pad)) return true;
  }
  return false;
}

export function createWorld(seed = 20261031) {
  const rng = mulberry32(seed);
  const rocks = [];
  const decorations = [];
  const nodes = [];
  const chests = [];
  const vents = [];
  const schools = [];
  const landmarks = [];

  const protectedPoints = [
    { x: WORLD.baseX, y: 240, r: 460 },
    ...RELIC_DEFS.map((r) => ({ x: r.x, y: r.y, r: 330 })),
    ...VENT_DEFS.map((v) => ({ x: v.x, y: v.y, r: 220 })),
  ];

  // ── Rock formations, ledges and arches ──────────────────────────────
  const counts = [19, 22, 25, 23, 21];
  ZONES.forEach((zone, zi) => {
    const count = counts[zi];
    for (let i = 0; i < count; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 18 && !placed; attempt++) {
        const x = 130 + rng() * (WORLD.width - 260);
        const y = zone.y0 + 170 + rng() * Math.max(160, zone.y1 - zone.y0 - 340);
        const baseR = 58 + rng() * (zi > 2 ? 120 : 95);
        if (nearProtected(protectedPoints, x, y, baseR + 90)) continue;
        if (overlapsRock(rocks, x, y, baseR + 60)) continue;
        const pieces = 1 + Math.floor(rng() * 3);
        const cluster = [];
        for (let p = 0; p < pieces; p++) {
          const angle = rng() * Math.PI * 2;
          const off = p === 0 ? 0 : 20 + rng() * baseR * 0.85;
          const r = p === 0 ? baseR : baseR * (0.55 + rng() * 0.42);
          const rx = x + Math.cos(angle) * off;
          const ry = y + Math.sin(angle) * off * 0.62;
          cluster.push({ x: rx, y: ry, r });
        }
        const kind = rng() < 0.18 ? 'moss' : rng() < 0.1 ? 'dark' : 'rock';
        const seedVal = Math.floor(rng() * 100000);
        for (const c of cluster) {
          rocks.push({ ...c, kind, seed: seedVal, zone: zone.id, zi });
        }
        placed = true;
      }
    }
  });

  // Guaranteed shelves beneath landmarks.
  const shelves = [
    { x: WRECK.x - 80, y: WRECK.y + 210, r: 185, kind: 'shelf', zone: 'shallows' },
    { x: WRECK.x + 150, y: WRECK.y + 245, r: 140, kind: 'shelf', zone: 'shallows' },
    { x: RUIN_SITES[0].x, y: RUIN_SITES[0].y + 230, r: 280, kind: 'shelf', zone: 'abyss' },
    { x: RUIN_SITES[1].x, y: RUIN_SITES[1].y + 210, r: 240, kind: 'shelf', zone: 'abyss' },
    { x: BONES.x, y: BONES.y + 150, r: 210, kind: 'shelf', zone: 'twilight' },
  ];
  shelves.forEach((s) => rocks.push({ ...s, seed: 991, zi: ZONES.findIndex((z) => z.id === s.zone) }));

  // A guaranteed coral reef around the Aurora so the first dive reads as a reef,
  // not an empty blue room. These are placed beyond the immediate spawn radius.
  const starterReef = [
    { x: 860, y: 640, r: 96, kind: 'moss' },
    { x: 1640, y: 560, r: 86, kind: 'moss' },
    { x: 720, y: 940, r: 138, kind: 'moss' },
    { x: 1810, y: 900, r: 152, kind: 'moss' },
    { x: 1030, y: 1090, r: 168, kind: 'moss' },
    { x: 2010, y: 1130, r: 150, kind: 'moss' },
    { x: 560, y: 610, r: 62, kind: 'rock' },
  ];
  starterReef.forEach((s, i) => {
    rocks.push({ ...s, zone: 'shallows', seed: 4200 + i, zi: 0 });
    const colors = [0.08, 0.28, 0.55, 0.72, 0.9];
    decorations.push(
      { type: 'coral', x: s.x - s.r * 0.28, y: s.y - s.r * 0.66, scale: 0.9 + (i % 3) * 0.2, phase: i * 1.4, seed: 8100 + i, hue: colors[i % colors.length], zone: 'shallows' },
      { type: 'fan', x: s.x + s.r * 0.34, y: s.y - s.r * 0.62, scale: 0.8 + (i % 2) * 0.3, phase: i * 2.1, seed: 8200 + i, hue: colors[(i + 2) % colors.length], zone: 'shallows' },
      { type: 'anemone', x: s.x + s.r * 0.1, y: s.y - s.r * 0.78, scale: 0.9, phase: i * 1.7, seed: 8300 + i, hue: colors[(i + 1) % colors.length], zone: 'shallows' },
    );
  });
  schools.push({
    id: 'school-reef',
    x: 1510, y: 560, zone: 'shallows', count: 11, dir: -1, speed: 32,
    spread: 60, phase: 1.7, type: 'gold',
  });

  // ── Vents ───────────────────────────────────────────────────────────
  VENT_DEFS.forEach((v, i) => {
    vents.push({ ...v, id: `vent-${i}`, r: v.type === 'thermal' ? 150 : 170, phase: rng() * 10 });
    // a small rocky mouth for each vent
    rocks.push({ x: v.x, y: v.y + 120, r: 48 + rng() * 26, kind: 'vent', zone: v.zone, seed: 300 + i, zi: ZONES.findIndex((z) => z.id === v.zone) });
  });

  // ── Ruins ───────────────────────────────────────────────────────────
  const ruins = RUIN_SITES.map((site, idx) => {
    const columns = [];
    const count = 5 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const cx = site.x + (i - count / 2) * 92 * site.scale + (rng() - 0.5) * 30;
      const h = (130 + rng() * 210) * site.scale;
      columns.push({ x: cx, y: site.y + 40, h, w: 34 + rng() * 20, broken: rng() > 0.45, seed: rng() * 1000 });
      rocks.push({ x: cx, y: site.y + 60, r: 24 + rng() * 12, kind: 'ruin', zone: 'abyss', seed: 700 + i, zi: 3 });
    }
    return { ...site, columns, id: `ruin-${idx}` };
  });

  // ── Wreck ───────────────────────────────────────────────────────────
  rocks.push(
    { x: WRECK.x - 150, y: WRECK.y + 80, r: 80, kind: 'wreck', zone: 'shallows', seed: 121, zi: 0 },
    { x: WRECK.x + 60, y: WRECK.y + 90, r: 100, kind: 'wreck', zone: 'shallows', seed: 122, zi: 0 },
    { x: WRECK.x + 230, y: WRECK.y + 120, r: 64, kind: 'wreck', zone: 'shallows', seed: 123, zi: 0 },
  );

  // ── Coral, kelp, anemones and glowing flora ─────────────────────────
  const coralRocks = rocks.filter((r) => r.r > 55 && (r.zone === 'shallows' || r.zone === 'kelp'));
  const deepRocks = rocks.filter((r) => r.r > 55 && (r.zone === 'twilight' || r.zone === 'abyss' || r.zone === 'rift'));
  for (let i = 0; i < 72; i++) {
    const rock = coralRocks[Math.floor(rng() * coralRocks.length)];
    if (!rock) continue;
    decorations.push({
      type: rng() < 0.46 ? 'coral' : rng() < 0.7 ? 'fan' : 'anemone',
      x: rock.x + (rng() - 0.5) * rock.r * 1.2,
      y: rock.y - rock.r * (0.55 + rng() * 0.2),
      scale: 0.55 + rng() * 1.15,
      phase: rng() * Math.PI * 2,
      seed: Math.floor(rng() * 9999),
      hue: rng(),
      zone: rock.zone,
    });
  }
  const kelpRocks = rocks.filter((r) => r.zone === 'kelp' && r.r > 70);
  for (let i = 0; i < 95; i++) {
    const rock = kelpRocks[Math.floor(rng() * kelpRocks.length)];
    if (!rock) continue;
    decorations.push({
      type: 'kelp',
      x: rock.x + (rng() - 0.5) * rock.r * 1.5,
      y: rock.y - rock.r * 0.5,
      height: 180 + rng() * 440,
      scale: 0.7 + rng() * 0.8,
      phase: rng() * Math.PI * 2,
      seed: Math.floor(rng() * 9999),
      hue: rng(),
      zone: 'kelp',
    });
  }
  for (let i = 0; i < 58; i++) {
    const rock = deepRocks[Math.floor(rng() * deepRocks.length)];
    if (!rock) continue;
    decorations.push({
      type: rng() < 0.55 ? 'glowplant' : rng() < 0.8 ? 'tube' : 'anemone',
      x: rock.x + (rng() - 0.5) * rock.r * 1.3,
      y: rock.y - rock.r * (0.45 + rng() * 0.3),
      height: 40 + rng() * 130,
      scale: 0.6 + rng() * 1.1,
      phase: rng() * Math.PI * 2,
      seed: Math.floor(rng() * 9999),
      hue: rng(),
      zone: rock.zone,
    });
  }

  // ── Collectible nodes ───────────────────────────────────────────────
  const nodeCounts = [23, 25, 24, 22, 19];
  let nodeId = 0;
  ZONES.forEach((zone, zi) => {
    const weights = [
      [['scrap', 56], ['pearl', 32], ['crystal', 5], ['repair', 7]],
      [['scrap', 39], ['pearl', 43], ['crystal', 12], ['repair', 6]],
      [['scrap', 22], ['pearl', 30], ['crystal', 42], ['repair', 6]],
      [['scrap', 14], ['pearl', 21], ['crystal', 59], ['repair', 6]],
      [['scrap', 23], ['pearl', 17], ['crystal', 54], ['repair', 6]],
    ][zi];
    for (let i = 0; i < nodeCounts[zi]; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 70 && !placed; attempt++) {
        const x = 160 + rng() * (WORLD.width - 320);
        const y = zone.y0 + 120 + rng() * Math.max(120, zone.y1 - zone.y0 - 220);
        if (nearProtected([{ x: WORLD.baseX, y: 250, r: 260 }], x, y)) continue;
        if (overlapsRock(rocks, x, y, 54)) continue;
        if (nodes.some((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < 150 * 150)) continue;
        const type = weightedPick(rng, weights);
        const amount = type === 'repair' ? 1 : type === 'crystal' ? 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 3);
        nodes.push({ id: `node-${nodeId++}`, type, x, y, amount, phase: rng() * 10, seed: rng() * 999, zone: zone.id });
        placed = true;
      }
    }
  });

  // ── Chests ──────────────────────────────────────────────────────────
  const chestDefs = SPECIAL_CHESTS.map((c) => ({ ...c, special: true }));
  const chestZoneCounts = [2, 3, 2, 3, 2];
  ZONES.forEach((zone, zi) => {
    for (let i = 0; i < chestZoneCounts[zi]; i++) {
      for (let attempt = 0; attempt < 60; attempt++) {
        const x = 170 + rng() * (WORLD.width - 340);
        const y = zone.y0 + 160 + rng() * Math.max(120, zone.y1 - zone.y0 - 300);
        if (nearProtected([{ x: WORLD.baseX, y: 250, r: 300 }], x, y)) continue;
        if (overlapsRock(rocks, x, y, 60)) continue;
        if (chests.some((c) => (c.x - x) ** 2 + (c.y - y) ** 2 < 220 * 220)) continue;
        chestDefs.push({ x, y, zone: zone.id, special: false });
        break;
      }
    }
  });

  const chestLoot = {
    shallows: { scrap: [5, 9], pearl: [1, 3], crystal: [0, 1] },
    kelp: { scrap: [4, 8], pearl: [2, 4], crystal: [0, 2] },
    twilight: { scrap: [3, 6], pearl: [2, 4], crystal: [2, 4] },
    abyss: { scrap: [2, 5], pearl: [1, 3], crystal: [3, 6] },
    rift: { scrap: [4, 8], pearl: [2, 4], crystal: [4, 7] },
  };
  chestDefs.forEach((def, i) => {
    const loot = chestLoot[def.zone];
    const roll = (range) => Math.floor(range[0] + rng() * (range[1] - range[0] + 1));
    chests.push({
      id: `chest-${i}`,
      x: def.x,
      y: def.y,
      zone: def.zone,
      label: def.label || null,
      special: !!def.special,
      loot: { scrap: roll(loot.scrap), pearl: roll(loot.pearl), crystal: roll(loot.crystal) },
      phase: rng() * 10,
    });
  });

  // ── Relics and the leviathan pearl ──────────────────────────────────
  const relics = RELIC_DEFS.map((r) => ({ ...r, phase: rng() * 10 }));
  const leviathanPearl = { id: 'leviathan-pearl', x: 7660, y: 9380, phase: rng() * 10 };

  // ── Ambient fish schools ────────────────────────────────────────────
  const schoolZones = ['shallows', 'shallows', 'shallows', 'kelp', 'kelp', 'kelp', 'kelp', 'twilight', 'twilight', 'twilight', 'twilight', 'shallows'];
  schoolZones.forEach((zid, i) => {
    const z = ZONE_BY_ID[zid];
    schools.push({
      id: `school-${i}`,
      x: 300 + rng() * (WORLD.width - 600),
      y: z.y0 + 200 + rng() * (z.y1 - z.y0 - 400),
      zone: zid,
      count: 5 + Math.floor(rng() * 10),
      dir: rng() < 0.5 ? -1 : 1,
      speed: 20 + rng() * 34,
      spread: 40 + rng() * 80,
      phase: rng() * 10,
      type: zid === 'twilight' ? 'lantern' : rng() < 0.3 ? 'gold' : 'silver',
    });
  });

  // ── Map landmarks ───────────────────────────────────────────────────
  landmarks.push({ type: 'base', x: WORLD.baseX, y: 150, label: 'The Aurora' });
  landmarks.push({ type: 'wreck', x: WRECK.x, y: WRECK.y, label: 'The Calypso' });
  landmarks.push({ type: 'bones', x: BONES.x, y: BONES.y, label: 'Whale fall' });
  RUIN_SITES.forEach((r) => landmarks.push({ type: 'ruin', x: r.x, y: r.y, label: 'Sunken ruins' }));
  landmarks.push({ type: 'pearl', x: leviathanPearl.x, y: leviathanPearl.y, label: 'Leviathan Pearl' });

  return {
    seed,
    rocks,
    decorations,
    nodes,
    chests,
    vents,
    schools,
    relics,
    ruins,
    wreck: WRECK,
    bones: BONES,
    leviathanPearl,
    landmarks,
    seabedY,
  };
}

export function upgradeCost(upgrade, level) {
  if (level >= upgrade.max) return null;
  return upgrade.cost(level);
}

export function pressureRating(upgrades) {
  return upgrades.hull || 0;
}
