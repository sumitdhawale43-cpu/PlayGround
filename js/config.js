/* ============================================================
   Static tuning data: physics constants, cars, upgrades, tracks.
   ============================================================ */

export const PHYS = {
  carLength: 48,
  carWidth: 26,
  wheelbase: 33,
  carRadius: 16,      // circle used for car-to-car collisions
  roadHalf: 78,       // half width of the asphalt
  verge: 108,         // beyond this the barrier starts
  wallLat: 96,        // max |lateral| of a car centre before it hits the wall
  spacing: 14,        // target spacing of centreline samples (world units)
  maxLaps: 9,
};

export const CARS = [
  {
    id: 'falcon', name: 'FALCON GT', cls: 'Sport', price: 0, shape: 'coupe',
    body: '#ef3b4d', body2: '#7d1220', accent: '#ffd166', glass: '#1b2a3a',
    stats: { speed: .60, accel: .66, grip: .70, handling: .70 },
    desc: 'Balanced, forgiving and eager. The perfect first legend.',
  },
  {
    id: 'viper', name: 'VIPER RS', cls: 'Drift', price: 1400, shape: 'drift',
    body: '#26d07c', body2: '#0b6b3d', accent: '#0b1b12', glass: '#123043',
    stats: { speed: .58, accel: .74, grip: .80, handling: .88 },
    desc: 'Sticky rear end and quick hands — built to slide through apexes.',
  },
  {
    id: 'thunder', name: 'THUNDER V8', cls: 'Muscle', price: 3000, shape: 'muscle',
    body: '#ff8a1f', body2: '#8a3d00', accent: '#15181e', glass: '#20303f',
    stats: { speed: .80, accel: .88, grip: .50, handling: .55 },
    desc: 'Brutal straight line shove. Point it and hope the tyres hold.',
  },
  {
    id: 'raider', name: 'RAIDER 4X', cls: 'Rally', price: 4200, shape: 'rally',
    body: '#4f8cff', body2: '#123a86', accent: '#f4f7ff', glass: '#16324a',
    stats: { speed: .64, accel: .76, grip: .74, handling: .74 },
    offroad: .55,
    desc: 'Long travel suspension shrugs off grass, gravel and bad decisions.',
  },
  {
    id: 'nebula', name: 'NEBULA X', cls: 'Hyper', price: 7200, shape: 'hyper',
    body: '#b7f4ff', body2: '#2b6f8a', accent: '#25d7ff', glass: '#0d1b2a',
    stats: { speed: .97, accel: .92, grip: .74, handling: .66 },
    desc: 'A missile with a steering wheel. Rewards clean, committed lines.',
  },
];

export const UPGRADES = {
  engine:  { name: 'ENGINE',  max: 5, cost: (l) => 500 + l * 650,  blurb: 'top speed + acceleration' },
  tires:   { name: 'TIRES',   max: 5, cost: (l) => 450 + l * 600,  blurb: 'grip + braking' },
  nitro:   { name: 'NITRO',   max: 5, cost: (l) => 550 + l * 700,  blurb: 'boost power + capacity' },
  chassis: { name: 'CHASSIS', max: 5, cost: (l) => 450 + l * 550,  blurb: 'steering + stability' },
};

export const EMPTY_UPGRADES = { engine: 0, tires: 0, nitro: 0, chassis: 0 };

/** Turn a car record + upgrade levels into the physics parameters used in-race. */
export function carSpec(car, up = EMPTY_UPGRADES) {
  const s = car.stats;
  const e = up.engine || 0;
  const t = up.tires || 0;
  const n = up.nitro || 0;
  const c = up.chassis || 0;
  return {
    id: car.id,
    topSpeed: 455 + s.speed * 175 + e * 26,
    accel: (250 + s.accel * 195) * (1 + e * 0.075),
    brake: 430 + s.grip * 170 + t * 40,
    grip: 6.1 + s.grip * 3.1 + t * 0.85,          // lateral grip coefficient (1/s)
    steerFactor: 1 + s.handling * 0.20 + c * 0.055,
    yawResponse: 8.4 + s.handling * 2.2 + c * 0.9,
    nitroPower: 330 + n * 85,
    nitroMax: 100 + n * 26,
    nitroDrain: 34 - n * 1.6,
    latAccel: 300 + s.grip * 90 + t * 26,
    offroad: car.offroad ?? 0.28,                  // how well it copes off the asphalt
    drag: 0.17,
  };
}

export const AI_ROSTER = [
  { name: 'BLAZE', skin: '#ff9f1c', skill: .955 },
  { name: 'NOVA',  skin: '#4cc9f0', skill: .985 },
  { name: 'RAX',   skin: '#c77dff', skill: .935 },
  { name: 'KILO',  skin: '#80ed99', skill: .995 },
  { name: 'ASH',   skin: '#ff5d8f', skill: .945 },
  { name: 'ZANE',  skin: '#ffe066', skill: .965 },
];

/* ------------------------------------------------------------
   Track control points (closed loops, world units)
   ------------------------------------------------------------ */
export const TRACKS = [
  {
    id: 'harbor', name: 'SUNSET HARBOR', theme: 'harbor', laps: 3, difficulty: 2,
    blurb: 'Fast seaside sweepers, a long main straight and one punishing hairpin at the container yard.',
    points: [
      [480, 1580], [940, 1640], [1400, 1620], [1780, 1520], [2060, 1340], [2200, 1080],
      [2380, 900], [2440, 620], [2260, 380], [1940, 340], [1660, 440], [1500, 720],
      [1300, 900], [1040, 860], [860, 700], [620, 720], [470, 960], [430, 1280],
    ],
  },
  {
    id: 'alpine', name: 'ALPINE RING', theme: 'alpine', laps: 3, difficulty: 3,
    blurb: 'Snow banks, pine shadows and a rhythm section that punishes lazy throttle control.',
    points: [
      [520, 1500], [420, 1180], [480, 880], [700, 700], [940, 760], [1060, 520],
      [1340, 400], [1620, 480], [1700, 760], [1960, 820], [2220, 700], [2380, 940],
      [2320, 1260], [2060, 1420], [1740, 1360], [1500, 1520], [1180, 1620], [820, 1620],
    ],
  },
  {
    id: 'neon', name: 'NEON NIGHTS', theme: 'neon', laps: 3, difficulty: 3,
    blurb: 'A tight downtown circuit between skyscrapers. Walls are close, lines are tighter.',
    points: [
      [560, 1500], [440, 1220], [520, 940], [360, 700], [520, 440], [840, 380],
      [1080, 520], [1180, 800], [1440, 880], [1660, 760], [1760, 480], [2060, 400],
      [2320, 600], [2360, 960], [2180, 1220], [1880, 1260], [1700, 1140], [1460, 1180],
      [1280, 1460], [940, 1620], [700, 1620],
    ],
  },
];

/* ------------------------------------------------------------ save file */
export const SAVE_KEY = 'drift-legends-save-v1';

export function defaultSave() {
  return {
    coins: 900,
    owned: ['falcon'],
    car: 'falcon',
    upgrades: { falcon: { ...EMPTY_UPGRADES } },
    track: 'harbor',
    laps: 3,
    best: {},           // trackId -> seconds
    races: 0,
    wins: 0,
    sound: true,
  };
}

export function loadSave() {
  const base = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const data = JSON.parse(raw);
    return {
      ...base,
      ...data,
      owned: Array.isArray(data.owned) && data.owned.length ? data.owned : base.owned,
      upgrades: { ...base.upgrades, ...(data.upgrades || {}) },
      best: { ...(data.best || {}) },
    };
  } catch (e) {
    return base;
  }
}

export function persistSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) { /* private mode / sandboxed storage */ }
}
