/* =========================================================
   PORTAL RUNNER — level data
   Two layers per level. Every platform, hazard, collectible,
   portal, plate, bridge and enemy belongs to a layer.
   ========================================================= */

const G = (x, y, w, h = 260) => ({ x, y, w, h, type: 'solid' });
const O = (x, y, w, h = 18) => ({ x, y, w, h, type: 'oneway' });
const C = (x, y, w, h = 18) => ({ x, y, w, h, type: 'crumble' });
const LAVA = (x, y, w, h) => ({ x, y, w, h, type: 'lava' });
const SPIKES = (x, y, w, h = 24) => ({ x, y, w, h, type: 'spikes' });

const arc = (x, y, n = 3, dx = 38, lift = 44) =>
  Array.from({ length: n }, (_, i) => ({
    x: x + i * dx,
    y: y - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * lift,
  }));

const line = (x, y, n = 3, dx = 34) =>
  Array.from({ length: n }, (_, i) => ({ x: x + i * dx, y }));

const pair = (x, y) => [
  { x, y, layer: 'light', toX: x, toY: y, toLayer: 'dark' },
  { x, y, layer: 'dark', toX: x, toY: y, toLayer: 'light' },
];

const link = (ax, ay, al, bx, by, bl) => [
  { x: ax, y: ay, layer: al, toX: bx, toY: by, toLayer: bl, secret: true },
  { x: bx, y: by, layer: bl, toX: ax, toY: ay, toLayer: al, secret: true },
];

const PALETTES = {
  grove: {
    light: {
      sky: ['#04131f', '#0a3543', '#e9975f'],
      accent: '#6ff5d0', accent2: '#ffe29a',
      rockTop: '#2b7d74', rockBody: '#0d2b36', rockDeep: '#05141d',
      far: '#061f2a', mid: '#0a303b', near: '#0f3d46',
      haze: 'rgba(110,240,210,0.12)', fog: 'rgba(255,180,120,0.10)',
      sun: '#ffd28a', sunEdge: '#ff8b5c'
    },
    dark: {
      sky: ['#04030f', '#160a2c', '#5a1c47'],
      accent: '#ff72da', accent2: '#a68bff',
      rockTop: '#87408c', rockBody: '#1c0d2d', rockDeep: '#090415',
      far: '#0a0718', mid: '#160b29', near: '#241239',
      haze: 'rgba(255,114,218,0.13)', fog: 'rgba(180,120,255,0.10)',
      sun: '#ff9ee0', sunEdge: '#a25dff'
    }
  },
  canopy: {
    light: {
      sky: ['#03161b', '#0a3b37', '#dfb96e'],
      accent: '#8effc0', accent2: '#ffe38a',
      rockTop: '#3b8d66', rockBody: '#0e332e', rockDeep: '#041b19',
      far: '#05231f', mid: '#0a3730', near: '#11453b',
      haze: 'rgba(142,255,192,0.11)', fog: 'rgba(230,200,120,0.10)',
      sun: '#ffe9a3', sunEdge: '#ffb45f'
    },
    dark: {
      sky: ['#070414', '#211039', '#4d1a52'],
      accent: '#ff8ad8', accent2: '#b39dff',
      rockTop: '#8a4290', rockBody: '#1d0e30', rockDeep: '#090416',
      far: '#0c0618', mid: '#180c2a', near: '#27133c',
      haze: 'rgba(255,138,216,0.13)', fog: 'rgba(150,120,255,0.11)',
      sun: '#ffb5e5', sunEdge: '#8d66ff'
    }
  },
  glass: {
    light: {
      sky: ['#071522', '#123c55', '#aedde0'],
      accent: '#8ff5ff', accent2: '#fff0c4',
      rockTop: '#5fa7b4', rockBody: '#122f3e', rockDeep: '#071722',
      far: '#081f2c', mid: '#0e2c3b', near: '#153b4b',
      haze: 'rgba(143,245,255,0.13)', fog: 'rgba(200,230,255,0.12)',
      sun: '#e9ffff', sunEdge: '#7ad9e8'
    },
    dark: {
      sky: ['#080418', '#1c0d38', '#4a1257'],
      accent: '#ff7ce8', accent2: '#b18cff',
      rockTop: '#8a3f9c', rockBody: '#1d0c2f', rockDeep: '#080414',
      far: '#0c0619', mid: '#180b2b', near: '#27113d',
      haze: 'rgba(255,124,232,0.13)', fog: 'rgba(170,130,255,0.12)',
      sun: '#ffb6f1', sunEdge: '#8d5bff'
    }
  },
  ember: {
    light: {
      sky: ['#1a1016', '#3d1b2b', '#e2683e'],
      accent: '#ffd27a', accent2: '#9bf0c8',
      rockTop: '#9c6a45', rockBody: '#2f1c22', rockDeep: '#160d12',
      far: '#27131b', mid: '#3a1c24', near: '#4c2629',
      haze: 'rgba(255,210,122,0.11)', fog: 'rgba(255,120,80,0.12)',
      sun: '#ffdba0', sunEdge: '#ff7a45'
    },
    dark: {
      sky: ['#0c0205', '#2b0510', '#7a151b'],
      accent: '#ff7a3c', accent2: '#ffc46b',
      rockTop: '#a33c28', rockBody: '#26050c', rockDeep: '#0d0104',
      far: '#150309', mid: '#24060d', near: '#340a12',
      haze: 'rgba(255,122,60,0.16)', fog: 'rgba(255,70,40,0.14)',
      sun: '#ffb06a', sunEdge: '#ff3d24'
    }
  },
  convergence: {
    light: {
      sky: ['#050c1e', '#122a4e', '#7f9eff'],
      accent: '#9efcf0', accent2: '#ffe9a8',
      rockTop: '#4e7a9e', rockBody: '#112238', rockDeep: '#060f1d',
      far: '#071426', mid: '#0d2038', near: '#152c46',
      haze: 'rgba(158,252,240,0.14)', fog: 'rgba(140,170,255,0.12)',
      sun: '#f4ffff', sunEdge: '#7fa8ff'
    },
    dark: {
      sky: ['#06030f', '#220b35', '#5c1f68'],
      accent: '#ffd36e', accent2: '#ff74c8',
      rockTop: '#975886', rockBody: '#1b0b2a', rockDeep: '#07030f',
      far: '#0a0517', mid: '#150a24', near: '#231031',
      haze: 'rgba(255,211,110,0.11)', fog: 'rgba(255,116,200,0.12)',
      sun: '#ffe7ad', sunEdge: '#e46cff'
    }
  }
};

export const LEVELS = [
  /* =========================================================
     LEVEL 1 — AWAKENING
     ========================================================= */
  {
    id: 1,
    name: 'Awakening',
    subtitle: 'The First Rift',
    brief: 'Learn to shift. A wall in one world is only a ghost in the other.',
    width: 4400,
    height: 900,
    spawn: { x: 110, y: 560 },
    layerNames: { light: 'Lumen Grove', dark: 'Violet Hollow' },
    palette: PALETTES.grove,
    sharedSolids: [
      G(0, 640, 980), G(1140, 640, 520), G(1880, 640, 620),
      G(2650, 640, 560), G(3450, 640, 560), G(4060, 640, 340)
    ],
    light: {
      solids: [
        O(1690, 560, 100), O(1810, 495, 110), O(2010, 468, 150),
        O(2220, 398, 140), O(2400, 468, 130),
        G(3080, 300, 44), O(3320, 540, 90), O(3980, 545, 70),
        O(1490, 520, 70)
      ],
      hazards: [SPIKES(2120, 616, 90)],
      moving: [
        { x: 2560, y: 560, w: 90, h: 16, axis: 'x', dist: 62, speed: 1.15, phase: 1.4 }
      ],
      plates: [], bridges: [],
      enemies: [{ x: 3650, y: 590, axis: 'x', range: 80, speed: 62, phase: 0 }],
      shards: [
        ...arc(300, 566, 3, 40, 52),
        ...line(880, 540, 2, 44),
        { x: 1230, y: 500 }, { x: 1500, y: 520 },
        { x: 1705, y: 500 }, { x: 1835, y: 440 }, { x: 2080, y: 408 },
        { x: 2280, y: 338 }, { x: 2440, y: 408 },
        { x: 2700, y: 540 }, { x: 3325, y: 470 }, { x: 3420, y: 430 },
        { x: 3600, y: 540 }, { x: 4015, y: 500 }, { x: 4200, y: 540 }
      ],
      keys: [{ x: 2285, y: 292 }, { x: 4200, y: 470 }],
      portals: [
        ...pair(1460, 640), ...pair(2960, 640), ...pair(3540, 640),
        ...link(2080, 640, 'light', 2080, 300, 'dark')
      ],
      checkpoints: [{ x: 1250, y: 640 }, { x: 2750, y: 640 }, { x: 3600, y: 640 }],
      tips: [
        { x: 180, y: 560, r: 160, text: 'A / D to run · SPACE to jump' },
        { x: 1460, y: 570, r: 150, text: 'PORTAL — press E to shift dimension' },
        { x: 3080, y: 520, r: 170, text: 'This wall only exists in Lumen. Shift to pass.' }
      ]
    },
    dark: {
      solids: [
        O(1720, 570, 100), O(1990, 480, 140), O(2240, 405, 130),
        O(2410, 475, 120), O(1960, 300, 220),
        G(3740, 200, 44), O(3230, 555, 80), O(3350, 505, 90), O(3870, 540, 100)
      ],
      hazards: [
        LAVA(980, 690, 160, 210), LAVA(1660, 690, 220, 210),
        LAVA(2500, 690, 150, 210), LAVA(3210, 690, 240, 210),
        LAVA(4010, 690, 50, 210)
      ],
      moving: [
        { x: 1740, y: 595, w: 90, h: 16, axis: 'y', dist: 58, speed: 1.0, phase: 0.4 }
      ],
      plates: [], bridges: [],
      enemies: [
        { x: 2820, y: 590, axis: 'x', range: 90, speed: 55, phase: 0 },
        { x: 2250, y: 360, axis: 'x', range: 55, speed: 40, phase: 1 }
      ],
      shards: [
        ...line(1055, 555, 2, 40),
        { x: 1740, y: 470 }, ...line(2035, 250, 2, 48),
        { x: 2300, y: 348 }, { x: 2450, y: 418 },
        { x: 2860, y: 540 }, { x: 3260, y: 480 }, { x: 3385, y: 450 },
        { x: 3660, y: 540 }, { x: 3900, y: 480 }
      ],
      keys: [{ x: 2140, y: 248 }],
      portals: [
        ...pair(1460, 640), ...pair(2960, 640), ...pair(3540, 640),
        ...link(2080, 640, 'light', 2080, 300, 'dark')
      ],
      checkpoints: [{ x: 1250, y: 640 }, { x: 2750, y: 640 }, { x: 3600, y: 640 }],
      tips: [
        { x: 2080, y: 300, r: 150, text: 'Secret path found — the relic key is close.' }
      ]
    },
    goal: { x: 4250, y: 640, layer: 'both' }
  },

  /* =========================================================
     LEVEL 2 — TWIN CANOPY
     ========================================================= */
  {
    id: 2,
    name: 'Twin Canopy',
    subtitle: 'Roots & Starlight',
    brief: 'Ride moving platforms and wake the glyph bridges between worlds.',
    width: 5200,
    height: 940,
    spawn: { x: 100, y: 560 },
    layerNames: { light: 'Sunleaf Canopy', dark: 'Nightbloom Depths' },
    palette: PALETTES.canopy,
    sharedSolids: [
      G(0, 640, 720), G(920, 640, 500), G(1620, 640, 420),
      G(2280, 640, 440), G(2980, 640, 500), G(3720, 640, 420),
      G(4380, 640, 500), G(4920, 640, 280)
    ],
    light: {
      solids: [
        O(760, 545, 110), O(900, 480, 110),
        O(1460, 540, 120), O(1640, 470, 120),
        O(2320, 520, 120), O(2500, 450, 120), O(2700, 430, 100), O(2860, 360, 200),
        O(3200, 520, 140), O(3400, 430, 120), O(3560, 510, 100),
        O(3900, 500, 120), O(4100, 430, 120),
        O(4520, 520, 120), O(4700, 440, 120), O(4780, 320, 160),
        G(2650, 300, 44)
      ],
      hazards: [SPIKES(1850, 616, 80), SPIKES(3050, 616, 90), SPIKES(4460, 620, 100)],
      moving: [
        { x: 2750, y: 555, w: 90, h: 16, axis: 'x', dist: 62, speed: 1.15, phase: 1.2 },
        { x: 4150, y: 555, w: 90, h: 16, axis: 'y', dist: 78, speed: 1.0, phase: 0.2 }
      ],
      plates: [
        { x: 1300, y: 640, w: 76, target: 'b1' },
        { x: 3350, y: 640, w: 76, target: 'b3' }
      ],
      bridges: [
        { x: 2040, y: 570, w: 240, h: 18, id: 'b2' }
      ],
      enemies: [
        { x: 2520, y: 590, axis: 'x', range: 70, speed: 60, phase: 0 },
        { x: 4300, y: 590, axis: 'x', range: 90, speed: 65, phase: 1.6 }
      ],
      shards: [
        ...arc(250, 566, 3, 42, 50),
        ...line(990, 500, 2, 44),
        { x: 1280, y: 540 }, { x: 1500, y: 490 }, { x: 1680, y: 420 },
        { x: 2350, y: 460 }, { x: 2530, y: 390 }, { x: 2720, y: 370 },
        { x: 2900, y: 470 }, { x: 3220, y: 460 }, { x: 3420, y: 390 },
        { x: 3580, y: 450 }, { x: 3950, y: 440 }, { x: 4150, y: 370 },
        { x: 4550, y: 460 }, { x: 4740, y: 380 }
      ],
      keys: [{ x: 2900, y: 312 }],
      portals: [
        ...pair(1200, 640), ...pair(2400, 640), ...pair(3100, 640),
        ...pair(3900, 640), ...pair(4400, 640),
        ...link(3420, 640, 'light', 3350, 200, 'dark')
      ],
      checkpoints: [{ x: 1050, y: 640 }, { x: 2350, y: 640 }, { x: 3800, y: 640 }, { x: 4550, y: 640 }],
      tips: [
        { x: 1300, y: 580, r: 150, text: 'A glyph plate woke a bridge in the Umbra.' },
        { x: 2400, y: 560, r: 150, text: 'Bridges only exist in the world they were built for.' }
      ]
    },
    dark: {
      solids: [
        O(760, 560, 100), O(1440, 555, 100), O(2060, 520, 110),
        O(2740, 540, 100), O(3500, 540, 100), O(4160, 540, 100), O(4560, 540, 100),
        O(2360, 460, 100), O(2580, 390, 100), O(2800, 330, 120),
        O(3100, 380, 120), O(3320, 320, 100),
        O(3940, 420, 120), O(4140, 350, 120), O(4640, 390, 100),
        O(3220, 200, 220),
        G(4050, 200, 44)
      ],
      hazards: [
        LAVA(720, 700, 200, 200), LAVA(1420, 700, 200, 200),
        LAVA(2040, 700, 240, 200), LAVA(2720, 700, 260, 200),
        LAVA(3480, 700, 240, 200), LAVA(4140, 700, 240, 200)
      ],
      moving: [
        { x: 2100, y: 600, w: 90, h: 16, axis: 'y', dist: 96, speed: 0.9, phase: 0.3 },
        { x: 3550, y: 600, w: 90, h: 16, axis: 'y', dist: 78, speed: 1.2, phase: 1.8 },
        { x: 4700, y: 540, w: 90, h: 16, axis: 'x', dist: 50, speed: 1.4, phase: 0.6 }
      ],
      plates: [
        { x: 1980, y: 640, w: 76, target: 'b2' }
      ],
      bridges: [
        { x: 1420, y: 600, w: 200, h: 18, id: 'b1' },
        { x: 3480, y: 570, w: 240, h: 18, id: 'b3' }
      ],
      enemies: [
        { x: 1500, y: 590, axis: 'x', range: 90, speed: 55, phase: 0 },
        { x: 3300, y: 590, axis: 'x', range: 90, speed: 65, phase: 1 },
        { x: 4800, y: 590, axis: 'x', range: 70, speed: 60, phase: 2 }
      ],
      shards: [
        { x: 2100, y: 545 }, { x: 2800, y: 290 }, { x: 3150, y: 330 },
        { x: 3550, y: 500 }, { x: 4200, y: 480 }, ...arc(3340, 165, 3, 40, 30)
      ],
      keys: [{ x: 3400, y: 152 }, { x: 3370, y: 268 }],
      portals: [
        ...pair(1200, 640), ...pair(2400, 640), ...pair(3100, 640),
        ...pair(3900, 640), ...pair(4400, 640),
        ...link(3420, 640, 'light', 3350, 200, 'dark')
      ],
      checkpoints: [{ x: 1050, y: 640 }, { x: 2350, y: 640 }, { x: 3800, y: 640 }, { x: 4550, y: 640 }],
      tips: []
    },
    goal: { x: 5080, y: 640, layer: 'both' }
  },

  /* =========================================================
     LEVEL 3 — GLASS FRACTURE
     ========================================================= */
  {
    id: 3,
    name: 'Glass Fracture',
    subtitle: 'A City of Mirrors',
    brief: 'Crystal platforms crumble. Glyph plates rebuild the impossible.',
    width: 5800,
    height: 940,
    spawn: { x: 100, y: 560 },
    layerNames: { light: 'Prism Reach', dark: 'The Shattervoid' },
    palette: PALETTES.glass,
    sharedSolids: [
      G(0, 640, 700), G(900, 640, 460), G(1540, 640, 520),
      G(2240, 640, 420), G(2840, 640, 480), G(3500, 640, 460),
      G(4140, 640, 480), G(4800, 640, 520), G(5500, 640, 300)
    ],
    light: {
      solids: [
        C(660, 520, 90), O(820, 460, 90), C(1120, 520, 90),
        O(1600, 520, 100), O(1760, 440, 100),
        O(2280, 500, 120), O(2440, 430, 120),
        O(2960, 500, 100), O(3120, 420, 100),
        O(3300, 520, 100), O(3440, 440, 100), O(3580, 360, 100), O(3720, 440, 100),
        O(4020, 500, 100), O(4180, 420, 100),
        O(4360, 520, 100), O(4500, 440, 100), O(4640, 520, 100),
        O(4880, 500, 100), O(5020, 420, 120),
        O(5350, 480, 100),
        G(2900, 320, 44),
        O(5050, 240, 220)
      ],
      hazards: [SPIKES(1250, 616, 80), SPIKES(3700, 620, 80), SPIKES(4450, 616, 90)],
      moving: [
        { x: 760, y: 560, w: 90, h: 16, axis: 'y', dist: 70, speed: 1.2, phase: 0.5 },
        { x: 3300, y: 560, w: 90, h: 16, axis: 'x', dist: 70, speed: 1.3, phase: 2.0 }
      ],
      plates: [
        { x: 1600, y: 640, w: 76, target: 'b1' },
        { x: 5000, y: 640, w: 76, target: 'b3' }
      ],
      bridges: [
        { x: 3960, y: 560, w: 180, h: 18, id: 'b2' }
      ],
      enemies: [
        { x: 1180, y: 590, axis: 'x', range: 80, speed: 60, phase: 0 },
        { x: 3650, y: 590, axis: 'x', range: 70, speed: 70, phase: 1.2 },
        { x: 4900, y: 590, axis: 'x', range: 90, speed: 60, phase: 0.5 }
      ],
      shards: [
        ...arc(220, 566, 3, 40, 48),
        { x: 700, y: 470 }, { x: 860, y: 410 }, { x: 1160, y: 460 },
        { x: 1320, y: 540 }, { x: 1630, y: 460 }, { x: 1790, y: 380 },
        { x: 2300, y: 440 }, { x: 2470, y: 370 },
        { x: 2980, y: 440 }, { x: 3140, y: 360 },
        { x: 3320, y: 460 }, { x: 3460, y: 380 }, { x: 3600, y: 300 }, { x: 3740, y: 380 },
        { x: 4040, y: 440 }, { x: 4200, y: 360 },
        { x: 4380, y: 460 }, { x: 4520, y: 380 }, { x: 4660, y: 460 },
        { x: 4900, y: 440 }, { x: 5040, y: 360 }, { x: 5370, y: 420 },
        { x: 4900, y: 190 }, { x: 5220, y: 190 }
      ],
      keys: [{ x: 4600, y: 380 }],
      portals: [
        ...pair(1150, 640), ...pair(2500, 640), ...pair(3200, 640),
        ...pair(3700, 640), ...pair(4300, 640), ...pair(4900, 640), ...pair(5600, 640),
        ...link(5150, 640, 'dark', 5150, 240, 'light')
      ],
      checkpoints: [{ x: 1000, y: 640 }, { x: 2350, y: 640 }, { x: 3700, y: 640 }, { x: 4900, y: 640 }],
      tips: [
        { x: 700, y: 560, r: 170, text: 'Crystal ledges crumble — keep moving.' },
        { x: 2500, y: 560, r: 150, text: 'Shift through the portal to slip past the Prism wall.' }
      ]
    },
    dark: {
      solids: [
        C(680, 540, 90), O(820, 480, 90), C(1150, 520, 90),
        O(1460, 540, 100), O(1620, 460, 100), O(1780, 540, 100),
        O(2280, 520, 120), O(2440, 450, 120),
        O(2660, 500, 100), O(2820, 420, 100), O(2980, 500, 100),
        O(3240, 520, 100), O(3400, 440, 100), O(3560, 360, 100), O(3720, 440, 100),
        O(3880, 520, 100), O(4040, 440, 100),
        O(4400, 520, 120), O(4580, 440, 120), O(4760, 520, 100),
        O(5100, 520, 100), O(5260, 440, 120), O(5420, 520, 100),
        O(5050, 240, 200),
        G(4500, 200, 44)
      ],
      hazards: [
        LAVA(700, 700, 200, 200), LAVA(1360, 700, 180, 200),
        LAVA(2060, 700, 180, 200), LAVA(2660, 700, 180, 200),
        LAVA(3320, 700, 180, 200), LAVA(3960, 700, 180, 200),
        LAVA(4620, 700, 180, 200), LAVA(5320, 700, 180, 200)
      ],
      moving: [
        { x: 980, y: 590, w: 90, h: 16, axis: 'y', dist: 70, speed: 1.3, phase: 0.8 },
        { x: 2760, y: 560, w: 90, h: 16, axis: 'x', dist: 60, speed: 1.2, phase: 1.5 },
        { x: 4660, y: 560, w: 90, h: 16, axis: 'y', dist: 60, speed: 1.4, phase: 0.2 }
      ],
      plates: [
        { x: 3500, y: 640, w: 76, target: 'b2' }
      ],
      bridges: [
        { x: 2660, y: 580, w: 180, h: 18, id: 'b1' },
        { x: 5320, y: 560, w: 180, h: 18, id: 'b3' }
      ],
      enemies: [
        { x: 1750, y: 590, axis: 'x', range: 80, speed: 65, phase: 0.4 },
        { x: 3200, y: 590, axis: 'x', range: 70, speed: 75, phase: 1.4 },
        { x: 4700, y: 590, axis: 'x', range: 80, speed: 60, phase: 0 }
      ],
      shards: [
        { x: 700, y: 490 }, { x: 1000, y: 460 }, { x: 1450, y: 490 },
        { x: 1640, y: 410 }, { x: 2300, y: 460 }, { x: 2460, y: 390 },
        { x: 2680, y: 440 }, { x: 2840, y: 360 }, { x: 3260, y: 460 },
        { x: 3420, y: 380 }, { x: 3580, y: 300 }, { x: 3740, y: 380 },
        { x: 3900, y: 460 }, { x: 4060, y: 380 }, { x: 4420, y: 460 },
        { x: 4600, y: 380 }, { x: 4780, y: 460 }, { x: 5120, y: 460 },
        { x: 5280, y: 380 }, { x: 5440, y: 460 }, ...arc(5070, 200, 2, 60, 20)
      ],
      keys: [{ x: 3590, y: 310 }, { x: 5190, y: 190 }],
      portals: [
        ...pair(1150, 640), ...pair(2500, 640), ...pair(3200, 640),
        ...pair(3700, 640), ...pair(4300, 640), ...pair(4900, 640), ...pair(5600, 640),
        ...link(5150, 640, 'dark', 5150, 240, 'light')
      ],
      checkpoints: [{ x: 1000, y: 640 }, { x: 2350, y: 640 }, { x: 3700, y: 640 }, { x: 4900, y: 640 }],
      tips: []
    },
    goal: { x: 5710, y: 640, layer: 'both' }
  },

  /* =========================================================
     LEVEL 4 — EMBER RIFT
     ========================================================= */
  {
    id: 4,
    name: 'Ember Rift',
    subtitle: 'Where the World Burns',
    brief: 'Lava devours the dark. Low gravity saves you. Keep shifting.',
    width: 6400,
    height: 960,
    spawn: { x: 100, y: 560 },
    layerNames: { light: 'Ashen Highlands', dark: 'The Molten Deep' },
    palette: PALETTES.ember,
    sharedSolids: [
      G(0, 640, 720), G(1160, 640, 340), G(1780, 640, 300),
      G(2380, 640, 280), G(2920, 640, 360), G(3500, 640, 300),
      G(4080, 640, 300), G(4660, 640, 340), G(5240, 640, 280),
      G(5780, 640, 400), G(6220, 640, 220)
    ],
    light: {
      solids: [
        O(760, 540, 110), O(920, 468, 100), O(1060, 540, 90),
        O(1520, 540, 100), O(1680, 460, 100),
        O(2120, 540, 110), O(2280, 460, 100),
        O(2700, 540, 100), O(2860, 460, 100),
        O(3320, 540, 100), O(3450, 455, 100),
        O(3840, 540, 100), O(3980, 460, 100),
        O(4420, 540, 100), O(4560, 460, 100),
        O(5040, 540, 100), O(5180, 460, 100),
        O(5560, 540, 100), O(5700, 460, 100),
        O(5900, 380, 160), O(6060, 300, 120),
        G(4300, 320, 44),
        O(3980, 240, 220)
      ],
      hazards: [SPIKES(1250, 616, 100), SPIKES(3000, 616, 80), SPIKES(4150, 616, 100), SPIKES(5350, 616, 80)],
      moving: [
        { x: 800, y: 560, w: 100, h: 16, axis: 'x', dist: 170, speed: 0.7, phase: 0.4 },
        { x: 3350, y: 560, w: 90, h: 16, axis: 'y', dist: 96, speed: 1.15, phase: 1.2 },
        { x: 5080, y: 560, w: 90, h: 16, axis: 'x', dist: 100, speed: 1.05, phase: 0.8 }
      ],
      plates: [
        { x: 4700, y: 640, w: 76, target: 'b2' },
        { x: 5350, y: 640, w: 76, target: 'b3' }
      ],
      bridges: [
        { x: 3280, y: 560, w: 220, h: 18, id: 'b1' }
      ],
      enemies: [
        { x: 1900, y: 590, axis: 'x', range: 80, speed: 60, phase: 0 },
        { x: 4900, y: 590, axis: 'x', range: 100, speed: 70, phase: 1.1 }
      ],
      shards: [
        ...arc(240, 566, 3, 40, 46),
        { x: 790, y: 500 }, { x: 950, y: 420 }, { x: 1090, y: 500 },
        { x: 1250, y: 540 }, { x: 1550, y: 500 }, { x: 1710, y: 420 },
        { x: 2150, y: 500 }, { x: 2310, y: 420 },
        { x: 2730, y: 500 }, { x: 2890, y: 420 },
        { x: 3340, y: 500 }, { x: 3480, y: 410 },
        { x: 3860, y: 500 }, { x: 4000, y: 420 }, { x: 4010, y: 200 },
        { x: 4440, y: 500 }, { x: 4580, y: 420 },
        { x: 5060, y: 500 }, { x: 5200, y: 420 },
        { x: 5580, y: 500 }, { x: 5720, y: 420 },
        { x: 5920, y: 340 }, { x: 6080, y: 260 },
        { x: 6000, y: 540 }, { x: 6300, y: 540 }
      ],
      keys: [{ x: 6110, y: 258 }, { x: 4030, y: 196 }],
      portals: [
        ...pair(600, 640), ...pair(1250, 640), ...pair(1900, 640),
        ...pair(3000, 640), ...pair(3700, 640), ...pair(4900, 640),
        ...pair(5450, 640), ...pair(6100, 640),
        ...link(4100, 640, 'dark', 4100, 240, 'light')
      ],
      checkpoints: [{ x: 1250, y: 640 }, { x: 2600, y: 640 }, { x: 4150, y: 640 }, { x: 5300, y: 640 }, { x: 6000, y: 640 }],
      tips: [
        { x: 600, y: 560, r: 170, text: 'The bridge breathes. Ride it across.' },
        { x: 4900, y: 550, r: 150, text: 'A secret rift hums nearby…' }
      ]
    },
    dark: {
      solids: [
        O(780, 520, 100), O(940, 440, 100), O(1080, 520, 100),
        C(1240, 540, 100), C(1380, 480, 100), C(1480, 540, 90),
        O(1540, 520, 100), O(1700, 440, 100),
        O(2140, 520, 100), O(2300, 440, 100),
        O(2720, 520, 100), O(2880, 440, 100),
        O(3340, 520, 100), O(3460, 440, 100),
        O(3860, 520, 100), O(4020, 440, 100),
        O(4440, 520, 100), O(4600, 440, 100),
        O(5060, 520, 100), O(5200, 440, 100),
        O(5580, 520, 100), O(5720, 440, 100),
        O(3980, 240, 200),
        G(2550, 190, 44), G(6000, 190, 44)
      ],
      hazards: [
        LAVA(720, 690, 440, 220), LAVA(1500, 690, 280, 220),
        LAVA(2080, 690, 300, 220), LAVA(2660, 690, 260, 220),
        LAVA(3280, 690, 220, 220), LAVA(3800, 690, 280, 220),
        LAVA(4380, 690, 280, 220), LAVA(5000, 690, 240, 220),
        LAVA(5520, 690, 260, 220)
      ],
      moving: [
        { x: 1000, y: 600, w: 90, h: 16, axis: 'y', dist: 96, speed: 0.9, phase: 0.1 },
        { x: 3850, y: 580, w: 100, h: 16, axis: 'x', dist: 120, speed: 0.8, phase: 1.4 },
        { x: 5600, y: 560, w: 90, h: 16, axis: 'y', dist: 74, speed: 1.3, phase: 0.5 }
      ],
      plates: [
        { x: 3200, y: 640, w: 76, target: 'b1' }
      ],
      bridges: [
        { x: 5000, y: 560, w: 240, h: 18, id: 'b2' },
        { x: 5520, y: 560, w: 260, h: 18, id: 'b3' }
      ],
      enemies: [
        { x: 1300, y: 590, axis: 'x', range: 120, speed: 55, phase: 0 },
        { x: 3100, y: 590, axis: 'x', range: 90, speed: 70, phase: 1 },
        { x: 4200, y: 590, axis: 'x', range: 100, speed: 60, phase: 2 },
        { x: 5400, y: 590, axis: 'x', range: 80, speed: 65, phase: 0.4 }
      ],
      shards: [
        { x: 800, y: 470 }, { x: 960, y: 390 }, { x: 1100, y: 470 },
        { x: 1290, y: 490 }, { x: 1560, y: 470 }, { x: 1720, y: 390 },
        { x: 2160, y: 470 }, { x: 2320, y: 390 },
        { x: 2740, y: 470 }, { x: 2900, y: 390 },
        { x: 3360, y: 470 }, { x: 3480, y: 390 },
        { x: 3880, y: 470 }, { x: 4040, y: 390 }, ...arc(4000, 200, 2, 60, 20),
        { x: 4460, y: 470 }, { x: 4620, y: 390 },
        { x: 5080, y: 470 }, { x: 5220, y: 390 },
        { x: 5600, y: 470 }, { x: 5740, y: 390 },
        { x: 6150, y: 540 }
      ],
      keys: [{ x: 5760, y: 382 }],
      portals: [
        ...pair(600, 640), ...pair(1250, 640), ...pair(1900, 640),
        ...pair(3000, 640), ...pair(3700, 640), ...pair(4900, 640),
        ...pair(5450, 640), ...pair(6100, 640),
        ...link(4100, 640, 'dark', 4100, 240, 'light')
      ],
      checkpoints: [{ x: 1250, y: 640 }, { x: 2600, y: 640 }, { x: 4150, y: 640 }, { x: 5300, y: 640 }, { x: 6000, y: 640 }],
      tips: []
    },
    goal: { x: 6320, y: 640, layer: 'both' }
  },

  /* =========================================================
     LEVEL 5 — THE CONVERGENCE
     ========================================================= */
  {
    id: 5,
    name: 'The Convergence',
    subtitle: 'Two Worlds, One Heart',
    brief: 'Every rift at once. The final gate waits at the edge of both worlds.',
    width: 7600,
    height: 980,
    spawn: { x: 100, y: 560 },
    layerNames: { light: 'Aurora Spire', dark: 'The Last Eclipse' },
    palette: PALETTES.convergence,
    sharedSolids: [
      G(0, 640, 600), G(800, 640, 300), G(1240, 640, 360),
      G(1760, 640, 280), G(2240, 640, 320), G(2760, 640, 300),
      G(3280, 640, 300), G(3800, 640, 320), G(4320, 640, 280),
      G(4840, 640, 340), G(5440, 640, 300), G(6000, 640, 320),
      G(6600, 640, 380), G(7160, 640, 440)
    ],
    light: {
      solids: [
        O(640, 540, 100), O(760, 470, 100),
        O(1500, 540, 100), O(1640, 470, 100),
        O(2060, 540, 100), O(2200, 470, 100),
        O(2580, 540, 100), O(2740, 470, 100),
        O(3080, 540, 100), O(3220, 460, 100),
        O(3600, 540, 100), O(3740, 460, 100),
        O(4140, 540, 100), O(4280, 460, 100),
        O(4620, 540, 100), O(4760, 460, 100),
        O(5200, 540, 100), O(5340, 460, 100),
        O(5760, 540, 100), O(5900, 460, 100),
        O(6340, 540, 100), O(6480, 460, 100),
        O(6700, 380, 140), O(6900, 300, 120), O(7000, 440, 100),
        G(2500, 300, 44), G(5600, 300, 44),
        O(6600, 250, 220)
      ],
      hazards: [SPIKES(1350, 616, 80), SPIKES(3000, 616, 80), SPIKES(5000, 616, 90), SPIKES(6200, 616, 80)],
      moving: [
        { x: 650, y: 560, w: 90, h: 16, axis: 'x', dist: 70, speed: 1.1, phase: 0.3 },
        { x: 2080, y: 560, w: 90, h: 16, axis: 'x', dist: 80, speed: 1.25, phase: 1.2 },
        { x: 4150, y: 560, w: 90, h: 16, axis: 'y', dist: 84, speed: 1.1, phase: 0.7 },
        { x: 5750, y: 560, w: 90, h: 16, axis: 'x', dist: 64, speed: 1.3, phase: 1.8 },
        { x: 7000, y: 545, w: 90, h: 16, axis: 'y', dist: 54, speed: 1.0, phase: 0.2 }
      ],
      plates: [
        { x: 1400, y: 640, w: 76, target: 'b1' },
        { x: 4950, y: 640, w: 76, target: 'b3' }
      ],
      bridges: [
        { x: 3580, y: 560, w: 220, h: 18, id: 'b2' },
        { x: 6320, y: 560, w: 280, h: 18, id: 'b4' }
      ],
      enemies: [
        { x: 2400, y: 590, axis: 'x', range: 80, speed: 65, phase: 0 },
        { x: 4900, y: 590, axis: 'x', range: 90, speed: 70, phase: 1.2 }
      ],
      shards: [
        ...arc(250, 566, 3, 40, 48),
        { x: 670, y: 500 }, { x: 790, y: 430 },
        { x: 1300, y: 540 }, { x: 1530, y: 500 }, { x: 1670, y: 430 },
        { x: 2090, y: 500 }, { x: 2230, y: 430 },
        { x: 2610, y: 500 }, { x: 2770, y: 430 },
        { x: 3110, y: 500 }, { x: 3250, y: 420 },
        { x: 3630, y: 500 }, { x: 3770, y: 420 },
        { x: 4170, y: 500 }, { x: 4310, y: 420 },
        { x: 4650, y: 500 }, { x: 4790, y: 420 },
        { x: 5230, y: 500 }, { x: 5370, y: 420 },
        { x: 5790, y: 500 }, { x: 5930, y: 420 },
        { x: 6370, y: 500 }, { x: 6510, y: 420 },
        { x: 6730, y: 340 }, { x: 6930, y: 260 }
      ],
      keys: [{ x: 6750, y: 200 }],
      portals: [
        ...pair(900, 640), ...pair(2400, 640), ...pair(2900, 640),
        ...pair(3900, 640), ...pair(4400, 640), ...pair(5100, 640),
        ...pair(5550, 640), ...pair(6050, 640), ...pair(6700, 640),
        ...link(5050, 640, 'dark', 6700, 250, 'light')
      ],
      checkpoints: [{ x: 1300, y: 640 }, { x: 2850, y: 640 }, { x: 3700, y: 640 }, { x: 4500, y: 640 }, { x: 6100, y: 640 }, { x: 6900, y: 640 }],
      tips: [
        { x: 2400, y: 560, r: 150, text: 'Two walls, two worlds. Watch the ghosts.' },
        { x: 5050, y: 560, r: 150, text: 'The last secret rift opens only in the dark.' }
      ]
    },
    dark: {
      solids: [
        O(670, 560, 90), O(820, 490, 90),
        C(1130, 540, 90), C(1270, 480, 90),
        O(1270, 540, 100), O(1430, 470, 100),
        O(1790, 540, 100), O(1940, 470, 100),
        O(2270, 540, 100), O(2420, 470, 100),
        O(2790, 540, 100), O(2940, 460, 100),
        O(3310, 540, 100), O(3460, 460, 100),
        O(3830, 540, 100), O(3980, 460, 100),
        O(4350, 540, 100), O(4500, 460, 100),
        O(4870, 540, 100), O(5020, 460, 100),
        O(5470, 540, 100), O(5620, 460, 100),
        O(6030, 540, 100), O(6180, 460, 100),
        O(6630, 540, 100), O(6780, 460, 100),
        O(7200, 360, 140),
        G(4000, 190, 44), G(6800, 190, 44)
      ],
      hazards: [
        LAVA(600, 700, 200, 220), LAVA(1100, 700, 140, 220),
        LAVA(1600, 700, 160, 220), LAVA(2040, 700, 200, 220),
        LAVA(2560, 700, 200, 220), LAVA(3060, 700, 220, 220),
        LAVA(3580, 700, 220, 220), LAVA(4120, 700, 200, 220),
        LAVA(4600, 700, 240, 220), LAVA(5180, 700, 260, 220),
        LAVA(5740, 700, 260, 220), LAVA(6320, 700, 280, 220),
        LAVA(6980, 700, 180, 220)
      ],
      moving: [
        { x: 1100, y: 580, w: 90, h: 16, axis: 'y', dist: 84, speed: 1.2, phase: 0.2 },
        { x: 3080, y: 580, w: 90, h: 16, axis: 'y', dist: 80, speed: 1.4, phase: 1.1 },
        { x: 4630, y: 580, w: 80, h: 16, axis: 'x', dist: 70, speed: 1.5, phase: 0.6 },
        { x: 6350, y: 580, w: 90, h: 16, axis: 'y', dist: 76, speed: 1.3, phase: 1.6 }
      ],
      plates: [
        { x: 3400, y: 640, w: 76, target: 'b2' },
        { x: 6250, y: 640, w: 76, target: 'b4' }
      ],
      bridges: [
        { x: 2040, y: 580, w: 200, h: 18, id: 'b1' },
        { x: 5740, y: 560, w: 260, h: 18, id: 'b3' }
      ],
      enemies: [
        { x: 1350, y: 590, axis: 'x', range: 90, speed: 60, phase: 0 },
        { x: 3500, y: 590, axis: 'x', range: 80, speed: 75, phase: 1.3 },
        { x: 6200, y: 590, axis: 'x', range: 80, speed: 65, phase: 0.7 }
      ],
      shards: [
        { x: 690, y: 500 }, { x: 840, y: 430 },
        { x: 1160, y: 490 }, { x: 1300, y: 430 },
        { x: 1810, y: 490 }, { x: 1960, y: 420 },
        { x: 2290, y: 490 }, { x: 2440, y: 420 },
        { x: 2810, y: 490 }, { x: 2960, y: 410 },
        { x: 3330, y: 490 }, { x: 3480, y: 410 },
        { x: 3850, y: 490 }, { x: 4000, y: 410 },
        { x: 4370, y: 490 }, { x: 4520, y: 410 },
        { x: 4890, y: 490 }, { x: 5040, y: 410 },
        { x: 5490, y: 490 }, { x: 5640, y: 410 },
        { x: 6050, y: 490 }, { x: 6200, y: 410 },
        { x: 6650, y: 490 }, { x: 6800, y: 410 },
        { x: 7240, y: 310 }
      ],
      keys: [{ x: 3000, y: 402 }, { x: 7240, y: 300 }],
      portals: [
        ...pair(900, 640), ...pair(2400, 640), ...pair(2900, 640),
        ...pair(3900, 640), ...pair(4400, 640), ...pair(5100, 640),
        ...pair(5550, 640), ...pair(6050, 640), ...pair(6700, 640),
        ...link(5050, 640, 'dark', 6700, 250, 'light')
      ],
      checkpoints: [{ x: 1300, y: 640 }, { x: 2850, y: 640 }, { x: 3700, y: 640 }, { x: 4500, y: 640 }, { x: 6100, y: 640 }, { x: 6900, y: 640 }],
      tips: []
    },
    goal: { x: 7470, y: 640, layer: 'both' }
  }
];

/* ---------- normalization helpers ---------- */
export const LAYERS = ['light', 'dark'];

export function layerLabel(level, layer) {
  return level.layerNames[layer];
}

export function normalizeLevel(level) {
  if (level._normalized) return level;
  for (const layer of LAYERS) {
    const world = level[layer];
    world.solids = [...level.sharedSolids, ...world.solids].map((s) => ({
      ...s,
      type: s.type || 'solid',
      layer,
      shared: level.sharedSolids.includes(s)
    }));
    world.hazards = world.hazards.map((h) => ({ ...h, layer }));
    world.moving = (world.moving || []).map((m, i) => ({
      ...m, layer, id: `m${layer}${i}`, originX: m.x, originY: m.y, prevX: m.x, prevY: m.y, dx: 0, dy: 0
    }));
    world.enemies = (world.enemies || []).map((e, i) => ({
      ...e, layer, id: `e${layer}${i}`, baseX: e.x, baseY: e.y, dead: 0
    }));
    world.shards = (world.shards || []).map((s, i) => ({
      x: s.x, y: s.y, layer, id: `s${layer}${i}`, taken: false, bob: (i * 1.7) % 6.283
    }));
    world.keys = (world.keys || []).map((k, i) => ({
      x: k.x, y: k.y, layer, id: `k${layer}${i}`, taken: false, bob: (i * 2.3) % 6.283
    }));
    world.portals = (world.portals || []).map((p, i) => ({
      ...p, layer: p.layer || layer, id: `p${layer}${i}`, charge: 1, pulse: (i * 1.1) % 6.283
    }));
    world.checkpoints = (world.checkpoints || []).map((c, i) => ({
      ...c, layer, id: `c${layer}${i}`, active: false
    }));
    world.plates = (world.plates || []).map((p, i) => ({
      ...p, h: 14, layer, id: `pl${layer}${i}`, on: false, glow: 0
    }));
    world.bridges = (world.bridges || []).map((b, i) => ({
      ...b, type: 'bridge', layer: b.layer || layer, active: !!b.startsActive, id: b.id || `br${layer}${i}`, anim: b.startsActive ? 1 : 0
    }));
    world.tips = (world.tips || []).map((t, i) => ({ ...t, id: `t${layer}${i}`, seen: false }));
  }
  level._normalized = true;
  return level;
}

export function getLevelStats(level) {
  let shards = 0;
  let keys = 0;
  for (const layer of LAYERS) {
    shards += level[layer].shards.length;
    keys += level[layer].keys.length;
  }
  return { shards, keys };
}
