/* The ocean: zones, hand-placed landmarks, procedural reefs, loot and wildlife. */
import { RNG, clamp, smoothstep, lerp, mixColor } from './utils.js';

export const WORLD = {
  w: 5600,
  h: 7400,
  surface: 70,
  spawn: { x: 1220, y: 1200 },
  pxPerMeter: 0.25,
  maxDepthM: 1850,
};

export const ZONES = [
  {
    id: 'shallows', name: 'Sunlit Shallows', start: 0, end: 1500, range: '0 — 375 m',
    tagline: 'Coral gardens in the sunlit blue', short: 'LIGHT & CORAL',
    palette: {
      top: '#78dce9', mid: '#138ea7', bottom: '#075a73', fog: '#4bb4c7',
      accent: '#ffcf7a', rim: '#c7fff9', rockTop: '#345f6f', rockBottom: '#092f42',
      kelp: '#3c8a68', kelpDark: '#174d4b', particle: '#dcffff', jelly: '#ff9fd8',
      coral: ['#ff9a72', '#ffbd79', '#ef728d', '#70e2c8', '#d69bff'],
    },
    light: 1,
    description: 'Warm currents, old coral, and the last easy light for a thousand metres.',
  },
  {
    id: 'twilight', name: 'Twilight Reef', start: 1500, end: 3400, range: '375 — 850 m',
    tagline: 'Where the blue turns to ink', short: 'CRIMSON CORAL',
    palette: {
      top: '#287f98', mid: '#0b4c6b', bottom: '#06273f', fog: '#1d6885',
      accent: '#ff9b78', rim: '#8cece9', rockTop: '#274d63', rockBottom: '#061e30',
      kelp: '#2b706b', kelpDark: '#0d3a42', particle: '#c8f8ff', jelly: '#d9a2ff',
      coral: ['#ff7f6a', '#d8a6ff', '#f4c95d', '#55e1c5', '#ff6f9e'],
    },
    light: 0.62,
    description: 'A drowned thoroughfare of broken ships and night-coloured coral.',
  },
  {
    id: 'midnight', name: 'Midnight Trench', start: 3400, end: 5300, range: '850 — 1325 m',
    tagline: 'The vent fields breathe in the dark', short: 'THERMAL FIELDS',
    palette: {
      top: '#0e405a', mid: '#041f37', bottom: '#020b19', fog: '#0a2c43',
      accent: '#50f0dc', rim: '#64e9e2', rockTop: '#12394a', rockBottom: '#020a14',
      kelp: '#175a58', kelpDark: '#062b33', particle: '#7df5ff', jelly: '#7df0ff',
      coral: ['#4ff0dc', '#8a7dff', '#ff7e9e', '#d3ff6e', '#5ac8ff'],
    },
    light: 0.28,
    description: 'Black smokers, bone-white tube worms, and things that make their own light.',
  },
  {
    id: 'abyss', name: 'Abyssal Ruins', start: 5300, end: 7400, range: '1325 — 1850 m',
    tagline: 'A city the pressure forgot', short: 'LOST CIVILISATION',
    palette: {
      top: '#082a40', mid: '#020f1d', bottom: '#01050b', fog: '#061827',
      accent: '#b998ff', rim: '#9e9cff', rockTop: '#102d3d', rockBottom: '#010409',
      kelp: '#153f52', kelpDark: '#041a25', particle: '#b998ff', jelly: '#c4a2ff',
      coral: ['#b998ff', '#5ff0e2', '#7d8dff', '#ff92c8', '#d9c6ff'],
    },
    light: 0.1,
    description: 'The oldest stone in the ocean. It was not built by anything human.',
  },
];

export const CHESTS = [
  { id: 'cache-tideworn', name: 'Tideworn Cache', x: 1845, y: 1410, zone: 'shallows', tier: 1, salvage: 45, relics: 1, note: 'A diver’s chest, lost in the coral.' },
  { id: 'cache-smuggler', name: 'Smuggler’s Drop', x: 4320, y: 1490, zone: 'shallows', tier: 1, salvage: 55, relics: 1, note: 'Someone hid this beneath the reef shelf.' },
  { id: 'cache-meridian', name: 'Wreck of the Meridian', x: 1500, y: 2760, zone: 'twilight', tier: 2, salvage: 70, relics: 1, note: 'The captain’s lockbox is still sealed.' },
  { id: 'cache-crystal', name: 'Crystal Vault', x: 4130, y: 3160, zone: 'twilight', tier: 3, salvage: 85, relics: 1, note: 'A vault grown shut with violet crystal.' },
  { id: 'cache-vent', name: 'Vent Hoard', x: 2660, y: 4360, zone: 'midnight', tier: 3, salvage: 100, relics: 1, note: 'Wedged between two black smokers.' },
  { id: 'cache-ruin', name: 'The Drowned Archive', x: 4680, y: 4970, zone: 'midnight', tier: 4, salvage: 130, relics: 1, note: 'Sealed with a cipher no one remembers.' },
  { id: 'cache-leviathan', name: 'Leviathan’s Relic', x: 3270, y: 6460, zone: 'abyss', tier: 5, salvage: 280, relics: 2, note: 'The reason the expedition came this far.' },
];

export const TOTAL_CHESTS = CHESTS.length;

export const UPGRADES = [
  {
    id: 'oxygen', name: 'Oxygen Reserve', icon: 'i-oxygen', code: 'LIFE SUPPORT',
    max: 4, costs: [65, 145, 265, 420], values: [100, 140, 185, 235, 290],
    desc: 'Expands the twin breathing tanks. More time in the dark, more time to turn back.',
    effect: (cur, next) => `O₂ reserve ${cur} → ${next}`,
  },
  {
    id: 'hull', name: 'Hull Integrity', icon: 'i-hull', code: 'PRESSURE SHELL',
    max: 4, costs: [60, 135, 250, 400], values: [100, 135, 175, 220, 270],
    desc: 'Reinforced titanium ribs and a thicker viewport. Absorbs bites, stings and bad decisions.',
    effect: (cur, next) => `Hull ${cur} → ${next}`,
  },
  {
    id: 'thrusters', name: 'Vector Thrusters', icon: 'i-boost', code: 'PROPULSION',
    max: 3, costs: [55, 125, 235], values: [215, 245, 280, 320],
    desc: 'Higher flow impellers and a hotter drive. Moves faster through dense water.',
    effect: (cur, next) => `Top speed ${cur} → ${next}`,
  },
  {
    id: 'lamp', name: 'Floodlight', icon: 'i-sonar', code: 'ILLUMINATION',
    max: 3, costs: [45, 110, 195], values: [1, 1.28, 1.58, 1.95],
    desc: 'A wider, harder beam. Reveals caches and keeps the trench from swallowing the view.',
    effect: (cur, next) => `Beam reach +${Math.round((next / cur - 1) * 100)}%`,
  },
  {
    id: 'pressure', name: 'Pressure Hull', icon: 'i-warning', code: 'DEPTH RATING',
    max: 3, costs: [80, 190, 390], values: [480, 900, 1400, 2100],
    desc: 'Layers of ceramic composite. Required before the trench starts folding the hull.',
    effect: (cur, next) => `Rated ${cur} → ${next} m`,
  },
  {
    id: 'magnet', name: 'Salvage Array', icon: 'i-salvage', code: 'RECOVERY',
    max: 2, costs: [50, 120], values: [78, 135, 205],
    desc: 'A short-range gravitic scoop. Pulls loose salvage into the cargo bay from further away.',
    effect: (cur, next) => `Scoop radius ${cur} → ${next}`,
  },
];

export function upgradesAt(levels = {}) {
  const level = id => clamp(Math.floor(levels[id] || 0), 0, 4);
  return {
    oxygen: UPGRADES[0].values[Math.min(level('oxygen'), 4)],
    health: UPGRADES[1].values[Math.min(level('hull'), 4)],
    speed: UPGRADES[2].values[Math.min(level('thrusters'), 3)],
    light: UPGRADES[3].values[Math.min(level('lamp'), 3)],
    pressure: UPGRADES[4].values[Math.min(level('pressure'), 3)],
    magnet: UPGRADES[5].values[Math.min(level('magnet'), 2)],
  };
}

export function zoneAt(y) {
  for (let i = ZONES.length - 1; i >= 0; i--) if (y >= ZONES[i].start) return ZONES[i];
  return ZONES[0];
}

export function zoneIndex(id) {
  return Math.max(0, ZONES.findIndex(z => z.id === id));
}

let paletteCache = new Map();
function blendPalette(a, b, t) {
  const key = `${a.top}${b.top}${t.toFixed(3)}`;
  if (paletteCache.has(key)) return paletteCache.get(key);
  const out = {};
  for (const k of ['top', 'mid', 'bottom', 'fog', 'accent', 'rim', 'rockTop', 'rockBottom', 'kelp', 'kelpDark', 'particle', 'jelly']) {
    out[k] = mixColor(a[k], b[k], t);
  }
  out.coral = a.coral.map((c, i) => mixColor(c, b.coral[i % b.coral.length], t));
  paletteCache.set(key, out);
  return out;
}

export function paletteAt(y) {
  const zone = zoneAt(y);
  const idx = ZONES.indexOf(zone);
  const next = ZONES[idx + 1];
  const distanceToEnd = zone.end - y;
  if (next && distanceToEnd < 320) {
    return blendPalette(zone.palette, next.palette, smoothstep(1 - distanceToEnd / 320));
  }
  const prev = ZONES[idx - 1];
  const distanceFromStart = y - zone.start;
  if (prev && distanceFromStart < 320) {
    return blendPalette(prev.palette, zone.palette, smoothstep(distanceFromStart / 320));
  }
  return zone.palette;
}

export function depthAt(y) {
  return Math.max(0, Math.round(y * WORLD.pxPerMeter));
}

export function yForDepth(depth) {
  return depth / WORLD.pxPerMeter;
}

export function lightAt(y) {
  const zone = zoneAt(y);
  return zone.light;
}

/* ------------------------------------------------------------------ */
/* Scenery generation                                                  */
/* ------------------------------------------------------------------ */
function makeReef(rng, x, y, scale, zone, opts = {}) {
  const lumps = [];
  const count = rng.int(4, 7);
  const spread = 150;
  for (let i = 0; i < count; i++) {
    const pos = count === 1 ? 0 : i / (count - 1) * 2 - 1;
    lumps.push({
      dx: pos * spread + rng.range(-28, 28),
      dy: rng.range(-38, 44) - Math.abs(pos) * 9,
      rx: rng.range(42, 88),
      ry: rng.range(24, 62),
      rot: rng.range(-0.2, 0.2),
      tone: rng.next(),
    });
  }
  const plants = [];
  const plantCount = rng.int(2, 6);
  for (let i = 0; i < plantCount; i++) {
    const kind = rng.pick(['kelp', 'fan', 'branch', 'tube', 'anemone', 'whip']);
    plants.push({
      kind,
      dx: rng.range(-112, 112),
      dy: rng.range(-42, -6),
      size: rng.range(0.55, 1.25),
      hue: rng.int(0, zone.palette.coral.length - 1),
      phase: rng.range(0, Math.PI * 2),
      lean: rng.range(-0.2, 0.2),
    });
  }
  return {
    type: 'reef', x, y, scale, zone: zone.id, seed: rng.int(0, 999999), lumps, plants,
    collider: opts.collider === false ? null : { x, y: y - 8 * scale, rx: 128 * scale, ry: 64 * scale },
    layer: opts.layer || 'mid',
  };
}

function makeKelp(rng, x, y, scale, zone, layer = 'mid') {
  return {
    type: 'kelp', x, y, scale, zone: zone.id, seed: rng.int(0, 99999),
    height: rng.range(130, 300),
    count: rng.int(4, 8),
    spread: rng.range(24, 70),
    phase: rng.range(0, Math.PI * 2),
    layer,
  };
}

function makeCoral(rng, x, y, scale, zone) {
  return {
    type: 'coral', x, y, scale, zone: zone.id, seed: rng.int(0, 99999),
    style: rng.pick(['fan', 'branch', 'tube', 'brain']),
    hue: rng.int(0, zone.palette.coral.length - 1),
    phase: rng.range(0, Math.PI * 2),
    layer: 'mid',
  };
}

function makeVent(rng, x, y, scale, zone) {
  return { type: 'vent', x, y, scale, zone: zone.id, seed: rng.int(0, 99999), layer: 'mid' };
}

function makeRuin(rng, x, y, scale, zone, variant = 'columns') {
  return { type: 'ruin', x, y, scale, zone: zone.id, seed: rng.int(0, 99999), variant, layer: 'back' };
}

function near(list, x, y, radius) {
  for (const p of list) if ((p.x - x) ** 2 + (p.y - y) ** 2 < radius * radius) return true;
  return false;
}

export function createWorld(seed = 20261031) {
  const rng = new RNG(seed);
  const decor = [];
  const resources = [];
  const creatures = [];
  const ambientJellies = [];
  const colliders = [];

  const forbidden = [
    { x: WORLD.spawn.x, y: WORLD.spawn.y },
    ...CHESTS.map(c => ({ x: c.x, y: c.y })),
    { x: 1845, y: 1410 },
  ];

  /* Hand-framed starting canyon. */
  decor.push(makeReef(rng, 560, 1540, 3.4, ZONES[0], { collider: false, layer: 'back' }));
  decor.push(makeReef(rng, 1930, 1510, 3.15, ZONES[0], { collider: false, layer: 'back' }));
  decor.push(makeReef(rng, 890, 1770, 1.7, ZONES[0], { collider: false, layer: 'back' }));
  decor.push(makeReef(rng, 1660, 1810, 1.4, ZONES[0], { collider: false, layer: 'back' }));
  decor.push(makeKelp(rng, 720, 1760, 1.35, ZONES[0]));
  decor.push(makeKelp(rng, 1780, 1710, 1.08, ZONES[0]));
  decor.push(makeKelp(rng, 500, 1680, 1.5, ZONES[0], 'fg'));
  decor.push(makeKelp(rng, 1960, 1660, 1.35, ZONES[0], 'fg'));
  decor.push(makeCoral(rng, 940, 1590, 1.45, ZONES[0]));
  decor.push(makeCoral(rng, 1700, 1640, 1.2, ZONES[0]));
  decor.push(makeRuin(rng, 760, 1605, 1.25, ZONES[0], 'columns'));
  decor.push(makeReef(rng, 1120, 940, 1.15, ZONES[0], { collider: false, layer: 'back' }));

  /* Ambient, beautiful background life near the opening shot. */
  ambientJellies.push(
    { x: 720, y: 860, size: 122, color: '#ff9cd6', phase: 0.4, alpha: 0.58, parallax: 0.72 },
    { x: 1560, y: 800, size: 92, color: '#b8fff7', phase: 2.2, alpha: 0.48, parallax: 0.62 },
    { x: 2060, y: 1080, size: 160, color: '#c68cff', phase: 4.1, alpha: 0.26, parallax: 0.48 },
  );

  /* Reef pieces throughout every zone. */
  for (let zi = 0; zi < ZONES.length; zi++) {
    const zone = ZONES[zi];
    const top = zone.start + 160;
    const bottom = zone.end - 100;
    const reefCount = zi === 0 ? 24 : zi === 1 ? 26 : zi === 2 ? 25 : 21;
    for (let i = 0; i < reefCount; i++) {
      let x, y, tries = 0;
      do {
        x = rng.range(160, WORLD.w - 160);
        y = rng.range(top, bottom);
        tries++;
      } while (tries < 30 && (near(forbidden, x, y, 300) || near(decor.filter(d => d.type === 'reef'), x, y, 210)));
      const scale = rng.range(0.62, 1.65) * (zi === 3 ? 1.12 : 1);
      const reef = makeReef(rng, x, y, scale, zone, { layer: zi === 3 && i % 5 === 0 ? 'back' : 'mid' });
      if (reef.collider) colliders.push(reef.collider);
      decor.push(reef);
      if (i % 3 === 0) decor.push(makeCoral(rng, x + rng.range(-180, 180), y + rng.range(30, 90), rng.range(0.7, 1.6), zone));
      if (i % 4 === 0) decor.push(makeKelp(rng, x + rng.range(-160, 160), y + rng.range(30, 80), rng.range(0.7, 1.4), zone));
    }

    const extras = zi === 0 ? 10 : 14;
    for (let i = 0; i < extras; i++) {
      const x = rng.range(120, WORLD.w - 120);
      const y = rng.range(top, bottom);
      if (near(forbidden, x, y, 220)) continue;
      const roll = rng.next();
      if (roll < 0.4) decor.push(makeKelp(rng, x, y, rng.range(0.65, 1.55), zone));
      else if (roll < 0.78) decor.push(makeCoral(rng, x, y, rng.range(0.65, 1.4), zone));
      else if (roll < 0.88) decor.push(makeRuin(rng, x, y, rng.range(0.7, 1.4), zone, rng.pick(['columns', 'arch', 'slab'])));
      else decor.push(makeVent(rng, x, y, rng.range(0.75, 1.25), zone));
    }

    /* A few foreground silhouettes for parallax. */
    for (let i = 0; i < 4; i++) {
      const x = rng.range(120, WORLD.w - 120);
      const y = rng.range(top + 120, bottom);
      if (near(forbidden, x, y, 280)) continue;
      decor.push(makeKelp(rng, x, y, rng.range(1.3, 2.1), zone, 'fg'));
      if (i % 2 === 0) decor.push(makeReef(rng, x + 90, y + 90, rng.range(1.4, 2.2), zone, { collider: false, layer: 'fg' }));
    }
  }

  /* Key landmarks. */
  decor.push(makeRuin(rng, 1500, 2880, 2.7, ZONES[1], 'wreck'));
  decor.push(makeRuin(rng, 4120, 3320, 1.7, ZONES[1], 'vault'));
  decor.push(makeRuin(rng, 3260, 6600, 3.6, ZONES[3], 'temple'));
  decor.push(makeRuin(rng, 4260, 6050, 2.3, ZONES[3], 'bones'));
  decor.push(makeRuin(rng, 4680, 5120, 1.9, ZONES[2], 'archive'));
  for (let i = 0; i < 5; i++) {
    decor.push(makeVent(rng, 2480 + i * 72, 4490 + rng.range(-50, 50), rng.range(0.9, 1.5), ZONES[2]));
  }

  /* Resources — hand-placed starter trail plus zone scatter. */
  const starter = [
    { type: 'scrap', x: 1430, y: 1150, value: 5 },
    { type: 'scrap', x: 1080, y: 1290, value: 4 },
    { type: 'pearl', x: 1540, y: 1370, value: 10 },
    { type: 'oxygen', x: 940, y: 1160, value: 22 },
    { type: 'oxygen', x: 1680, y: 1190, value: 22 },
    { type: 'crystal', x: 860, y: 1450, value: 16 },
    { type: 'scrap', x: 1360, y: 1560, value: 6 },
    { type: 'repair', x: 1770, y: 1530, value: 18 },
  ];
  let rid = 0;
  for (const r of starter) resources.push(makeResource(`${r.type}-start-${rid++}`, r.type, r.x, r.y, r.value, 'shallows'));

  for (let zi = 0; zi < ZONES.length; zi++) {
    const zone = ZONES[zi];
    const count = zi === 0 ? 15 : 17;
    for (let i = 0; i < count; i++) {
      let x, y, tries = 0;
      do {
        x = rng.range(150, WORLD.w - 150);
        y = rng.range(zone.start + 120, zone.end - 80);
        tries++;
      } while (tries < 24 && (near(forbidden, x, y, 230) || near(resources, x, y, 120)));
      const roll = rng.next();
      let type = 'scrap';
      if (zi === 0) type = roll < 0.4 ? 'scrap' : roll < 0.72 ? 'pearl' : roll < 0.86 ? 'oxygen' : roll < 0.95 ? 'crystal' : 'repair';
      else if (zi === 1) type = roll < 0.34 ? 'scrap' : roll < 0.58 ? 'pearl' : roll < 0.8 ? 'crystal' : roll < 0.92 ? 'oxygen' : 'repair';
      else if (zi === 2) type = roll < 0.28 ? 'scrap' : roll < 0.4 ? 'pearl' : roll < 0.76 ? 'crystal' : roll < 0.92 ? 'oxygen' : 'repair';
      else type = roll < 0.22 ? 'scrap' : roll < 0.3 ? 'pearl' : roll < 0.7 ? 'crystal' : roll < 0.9 ? 'oxygen' : 'repair';
      const value = type === 'scrap' ? rng.int(3, 7) : type === 'pearl' ? rng.int(8, 14) : type === 'crystal' ? rng.int(14, 24) : type === 'oxygen' ? 22 : 18;
      resources.push(makeResource(`${zone.id}-res-${i}`, type, x, y, value, zone.id, type === 'oxygen'));
    }
    // Guaranteed air pockets at vents / ledges.
    resources.push(makeResource(`${zone.id}-air-a`, 'oxygen', rng.range(700, 1800) + (zi % 2) * 2500, rng.range(zone.start + 300, zone.end - 250), 26, zone.id, true));
    resources.push(makeResource(`${zone.id}-air-b`, 'oxygen', rng.range(700, 1800) + ((zi + 1) % 2) * 2500, rng.range(zone.start + 300, zone.end - 250), 26, zone.id, true));
  }

  /* Wildlife. */
  const creatureDefs = [
    { zone: 'shallows', schools: 7, jellies: 8, sharks: 1, anglers: 0 },
    { zone: 'twilight', schools: 6, jellies: 9, sharks: 2, anglers: 2 },
    { zone: 'midnight', schools: 5, jellies: 8, sharks: 2, anglers: 3 },
    { zone: 'abyss', schools: 4, jellies: 7, sharks: 2, anglers: 3 },
  ];

  for (const def of creatureDefs) {
    const zone = ZONES.find(z => z.id === def.zone);
    const top = zone.start + 200;
    const bottom = zone.end - 120;
    for (let i = 0; i < def.schools; i++) {
      const x = rng.range(260, WORLD.w - 260);
      const y = rng.range(top, bottom);
      if (near(forbidden, x, y, 280)) continue;
      creatures.push(makeSchool(rng, x, y, zone));
    }
    for (let i = 0; i < def.jellies; i++) {
      const x = rng.range(220, WORLD.w - 220);
      const y = rng.range(top, bottom);
      const size = rng.range(26, 58);
      const special = near([{ x: 1050, y: 980 }, { x: 1600, y: 900 }], x, y, 220);
      if (special || near(forbidden, x, y, 200)) continue;
      creatures.push(makeJelly(rng, x, y, size, zone, true));
    }
    for (let i = 0; i < def.sharks; i++) {
      const x = rng.range(500, WORLD.w - 500);
      const y = rng.range(top + 60, bottom - 60);
      if (near(forbidden, x, y, 720)) { i--; continue; }
      creatures.push(makeShark(rng, x, y, zone, i));
    }
    for (let i = 0; i < def.anglers; i++) {
      const x = rng.range(400, WORLD.w - 400);
      const y = rng.range(top + 100, bottom - 80);
      if (near(forbidden, x, y, 700)) { i--; continue; }
      creatures.push(makeAngler(rng, x, y, zone));
    }
  }

  creatures.push(makeJelly(rng, 1040, 960, 55, ZONES[0], true));
  creatures.push(makeJelly(rng, 1620, 880, 40, ZONES[0], true));
  creatures.push(makeSchool(rng, 1480, 1060, ZONES[0], 13));
  creatures.push(makeManta(rng, 1660, 820, 1.15, ZONES[0], -1));
  creatures.push(makeManta(rng, 3600, 2500, 1.55, ZONES[1], 1));
  creatures.push(makeManta(rng, 4800, 5800, 1.8, ZONES[3], -1));

  return { decor, resources, creatures, ambientJellies, colliders };
}

function makeResource(id, type, x, y, value, zone, respawns = false) {
  return {
    id, type, x, y, value, zone, respawns,
    phase: (id.length * 1.73) % 6.28,
    radius: type === 'oxygen' ? 13 : type === 'scrap' ? 12 : 15,
    collectedAt: -Infinity,
  };
}

function makeSchool(rng, x, y, zone, count = 0) {
  const n = count || rng.int(8, 16);
  const fish = [];
  for (let i = 0; i < n; i++) {
    fish.push({
      dx: rng.range(-85, 85), dy: rng.range(-42, 42),
      phase: rng.range(0, 6.28), speed: rng.range(0.6, 1.4),
      size: rng.range(0.7, 1.25), flip: rng.chance(0.5) ? 1 : -1,
    });
  }
  return {
    type: 'school', x, y, homeX: x, homeY: y, count: n, fish,
    zone: zone.id, color: rng.pick(['#bfeef0', '#ffd98c', '#99d8ff', '#f4b3c8', '#b8ffe9']),
    phase: rng.range(0, 6.28), flee: 0, dir: rng.chance(0.5) ? 1 : -1,
    size: rng.range(0.75, 1.25), speed: rng.range(0.25, 0.6),
  };
}

function makeJelly(rng, x, y, size, zone, hazard = false) {
  return {
    type: 'jelly', x, y, homeX: x, homeY: y, size, zone: zone.id, hazard,
    color: rng.chance(0.5) ? zone.palette.jelly : rng.pick(zone.palette.coral),
    phase: rng.range(0, 6.28), driftX: rng.range(-12, 12), driftY: rng.range(-9, 9),
    pulse: rng.range(0, 6.28), alpha: rng.range(0.55, 0.9),
  };
}

function makeShark(rng, x, y, zone, index) {
  return {
    type: 'shark', x, y, homeX: x, homeY: y, size: rng.range(0.9, 1.35),
    zone: zone.id, phase: rng.range(0, 6.28), state: 'patrol',
    patrolAngle: rng.range(0, 6.28), dir: rng.chance(0.5) ? 1 : -1,
    speed: rng.range(96, 132), stun: 0, biteCooldown: 0, alert: 0,
    turn: rng.range(0, 6.28), trailTimer: 0, index,
  };
}

function makeAngler(rng, x, y, zone) {
  return {
    type: 'angler', x, y, homeX: x, homeY: y, size: rng.range(0.85, 1.3),
    zone: zone.id, phase: rng.range(0, 6.28), state: 'lurk',
    speed: rng.range(90, 120), stun: 0, biteCooldown: 0, dir: rng.chance(0.5) ? 1 : -1,
    glow: rng.range(0, 6.28), lunge: 0, alert: 0,
  };
}

function makeManta(rng, x, y, scale, zone, dir = 1) {
  return {
    type: 'manta', x, y, homeX: x, homeY: y, size: scale,
    zone: zone.id, phase: rng.range(0, 6.28), dir, ambient: true,
    speed: rng.range(10, 18),
  };
}
