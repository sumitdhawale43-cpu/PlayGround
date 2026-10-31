/* Kingdom Builder — simulation, economy, progression and persistence. */
(function () {
  'use strict';
  const G = window.KBG = window.KBG || {};

  G.TW = 100;
  G.TH = 50;
  G.MAP_W = 14;
  G.MAP_H = 11;
  G.SAVE_KEY = 'kingdom-builder-valewood-v1';
  G.MAX_LEVEL = 7;

  const resourceOrder = ['wood', 'stone', 'food', 'gold'];
  G.RESOURCES = resourceOrder;

  G.BUILDINGS = {
    keep: {
      name: 'Town Keep', category: 'Civic', unlock: 1, buildable: false, unique: true,
      cost: {}, capacity: 6, jobs: 2, production: { gold: .012 }, xp: 0, maxLevel: 1,
      desc: 'The heart of Valewood. Its banner is the first thing travellers see.', art: { w: 286, dy: 18 }
    },
    house: {
      name: 'House', category: 'Dwellings', unlock: 1, cost: { wood: 35, stone: 12 }, capacity: 4,
      jobs: 0, happiness: 3, xp: 16, maxLevel: 3, buildable: true,
      desc: 'A timber-framed home. Every house shelters four more subjects.',
      art: { w: 150, dy: 8 }
    },
    farm: {
      name: 'Farm', category: 'Provisions', unlock: 1, cost: { wood: 28, stone: 6 }, jobs: 2,
      production: { food: .34 }, xp: 18, maxLevel: 3, buildable: true,
      desc: 'Wheat fields feed the realm. Assign two workers per field.',
      art: { w: 128, dy: 2 }
    },
    lumber: {
      name: 'Lumber Camp', category: 'Industry', unlock: 1, cost: { wood: 24, stone: 8 }, jobs: 2,
      production: { wood: .28 }, xp: 18, maxLevel: 3, buildable: true,
      desc: 'Fells timber from the surrounding woods.',
      art: { w: 178, dy: 6 }
    },
    road: {
      name: 'Road', category: 'Infrastructure', unlock: 1, cost: { wood: 4, stone: 5 }, xp: 1,
      maxLevel: 1, buildable: true, road: true,
      desc: 'Cobbled roads link buildings to the Keep, increasing output by 20%.',
      art: { w: 100, dy: 0 }
    },
    well: {
      name: 'Well', category: 'Civic', unlock: 1, cost: { wood: 20, stone: 28 }, happiness: 4,
      xp: 10, maxLevel: 2, buildable: true,
      desc: 'A clean well lifts the spirits of nearby households.',
      art: { w: 96, dy: 2 }
    },
    quarry: {
      name: 'Quarry', category: 'Industry', unlock: 2, cost: { wood: 45, stone: 32 }, jobs: 4,
      production: { stone: .26 }, happiness: -1, xp: 24, maxLevel: 3, buildable: true,
      desc: 'Cuts good stone from the hillside. Needs four strong workers.',
      art: { w: 166, dy: 4 }
    },
    factory: {
      name: 'Factory', category: 'Industry', unlock: 2, cost: { wood: 65, stone: 45, gold: 35 }, jobs: 4,
      production: { gold: .34 }, consumption: { wood: .09, stone: .07 }, happiness: -4,
      xp: 36, maxLevel: 3, buildable: true,
      desc: 'A busy works that turns timber and stone into gold. Smoky and noisy.',
      art: { w: 196, dy: 8 }
    },
    market: {
      name: 'Market', category: 'Commerce', unlock: 3, cost: { wood: 75, stone: 50, gold: 45 }, jobs: 2,
      production: { gold: .27 }, happiness: 2, xp: 36, maxLevel: 3, buildable: true,
      desc: 'Traders bring coin and news. A lively market raises spirits.',
      art: { w: 180, dy: 5 }
    },
    chapel: {
      name: 'Chapel', category: 'Civic', unlock: 3, cost: { wood: 80, stone: 70, gold: 50 }, jobs: 1,
      happiness: 8, xp: 45, maxLevel: 2, buildable: true,
      desc: 'A place of quiet devotion. Lifts the contentment of the whole realm.',
      art: { w: 162, dy: 6 }
    },
    garden: {
      name: 'Garden', category: 'Civic', unlock: 3, cost: { wood: 25, stone: 20, gold: 15 }, jobs: 1,
      happiness: 6, xp: 14, maxLevel: 2, buildable: true,
      desc: 'Hedges, flowers and a cool fountain. A favourite of the people.',
      art: { w: 126, dy: 3 }
    },
    tavern: {
      name: 'Tavern', category: 'Commerce', unlock: 4, cost: { wood: 65, stone: 40, gold: 40 }, jobs: 2,
      production: { gold: .10 }, consumption: { food: .022 }, happiness: 5,
      xp: 30, maxLevel: 2, buildable: true,
      desc: 'Ale, songs and warm hearths. Costs a little food, earns coin and cheer.',
      art: { w: 170, dy: 6 }
    },
    watchtower: {
      name: 'Watchtower', category: 'Defence', unlock: 4, cost: { wood: 70, stone: 75, gold: 35 }, jobs: 1,
      happiness: 1, xp: 28, maxLevel: 2, buildable: true, defence: 3,
      desc: 'A tall tower overlooking the realm. Keeps the roads safe.',
      art: { w: 126, dy: 6 }
    },
    barracks: {
      name: 'Barracks', category: 'Defence', unlock: 5, cost: { wood: 95, stone: 90, gold: 80 }, jobs: 4,
      happiness: 2, xp: 48, maxLevel: 2, buildable: true, defence: 6,
      desc: 'A garrison of loyal guards. The people sleep easier behind its walls.',
      art: { w: 198, dy: 8 }
    },
    monument: {
      name: 'Grand Monument', category: 'Civic', unlock: 6, cost: { wood: 60, stone: 160, gold: 200 }, jobs: 1,
      happiness: 10, xp: 90, maxLevel: 1, buildable: true, unique: true, defence: 2,
      desc: 'A gilded statue of the founder. A wonder that will outlast us all.',
      art: { w: 142, dy: 6 }
    }
  };

  G.BUILD_ORDER = ['house', 'farm', 'lumber', 'road', 'well', 'quarry', 'factory', 'market', 'chapel', 'garden', 'tavern', 'watchtower', 'barracks', 'monument'];

  G.LEVELS = [
    { level: 1, title: 'Hamlet', xp: 0 },
    { level: 2, title: 'Village', xp: 90 },
    { level: 3, title: 'Township', xp: 260 },
    { level: 4, title: 'Borough', xp: 560 },
    { level: 5, title: 'Town', xp: 980 },
    { level: 6, title: 'City', xp: 1550 },
    { level: 7, title: 'Kingdom', xp: 2300 }
  ];

  G.TAX = {
    low: { label: 'Low', mult: .55, happy: 6 },
    normal: { label: 'Fair', mult: 1, happy: 0 },
    high: { label: 'High', mult: 1.6, happy: -11 }
  };

  G.SEASONS = ['Highsun', 'Amberfall', 'Longnight', 'Greentide'];

  G.QUESTS = [
    { id: 'house5', title: 'A Roof for Every Head', desc: 'Raise a fifth house in Valewood.', target: 5, reward: { wood: 55, gold: 35 }, xp: 18,
      check: s => s.built.house >= 5, progress: s => `${Math.min(5, s.built.house || 0)} / 5` },
    { id: 'people12', title: 'A Growing People', desc: 'Reach a population of 12.', target: 12, reward: { food: 60, gold: 30 }, xp: 15,
      check: s => s.pop >= 12, progress: s => `${s.pop} / 12` },
    { id: 'quarry1', title: 'Stone from the Hills', desc: 'Open a Quarry for stone and masonry.', target: 1, reward: { stone: 45, gold: 25 }, xp: 15,
      check: s => s.built.quarry >= 1, progress: s => `${Math.min(1, s.built.quarry || 0)} / 1` },
    { id: 'level2', title: 'A Village Rises', desc: 'Reach renown level 2.', target: 2, reward: { wood: 45, food: 35 }, xp: 12,
      check: s => s.level >= 2, progress: s => `Level ${s.level} / 2` },
    { id: 'factory1', title: 'The Wheel Turns', desc: 'Build a Factory to turn materials into gold.', target: 1, reward: { gold: 75, stone: 30 }, xp: 20,
      check: s => s.built.factory >= 1, progress: s => `${Math.min(1, s.built.factory || 0)} / 1` },
    { id: 'market1', title: 'A Merchant’s Square', desc: 'Build a Market for trade and coin.', target: 1, reward: { gold: 90, wood: 40 }, xp: 20,
      check: s => s.built.market >= 1, progress: s => `${Math.min(1, s.built.market || 0)} / 1` },
    { id: 'people20', title: 'The Township Blooms', desc: 'Grow the population to 20 souls.', target: 20, reward: { food: 100, gold: 60 }, xp: 25,
      check: s => s.pop >= 20, progress: s => `${s.pop} / 20` },
    { id: 'chapel1', title: 'A Steeple to the Sky', desc: 'Build a Chapel for your people.', target: 1, reward: { gold: 110, stone: 35 }, xp: 25,
      check: s => s.built.chapel >= 1, progress: s => `${Math.min(1, s.built.chapel || 0)} / 1` },
    { id: 'level4', title: 'A Borough of Note', desc: 'Reach renown level 4.', target: 4, reward: { wood: 80, gold: 100 }, xp: 30,
      check: s => s.level >= 4, progress: s => `Level ${s.level} / 4` },
    { id: 'barracks1', title: 'Guards of Valewood', desc: 'Build a Barracks to protect the realm.', target: 1, reward: { gold: 160, stone: 50 }, xp: 40,
      check: s => s.built.barracks >= 1, progress: s => `${Math.min(1, s.built.barracks || 0)} / 1` }
  ];

  const START_BUILDINGS = [
    { type: 'keep', x: 6, y: 4 },
    { type: 'house', x: 3, y: 3, variant: 1 },
    { type: 'house', x: 8, y: 4, variant: 2 },
    { type: 'house', x: 4, y: 6, variant: 3 },
    { type: 'house', x: 8, y: 6, variant: 1 },
    { type: 'well', x: 6, y: 6 },
    { type: 'farm', x: 2, y: 6 },
    { type: 'lumber', x: 9, y: 7 },
    { type: 'road', x: 3, y: 4 }, { type: 'road', x: 2, y: 5 }, { type: 'road', x: 3, y: 5 },
    { type: 'road', x: 4, y: 5 }, { type: 'road', x: 5, y: 5 }, { type: 'road', x: 6, y: 5 },
    { type: 'road', x: 7, y: 5 }, { type: 'road', x: 8, y: 5 }, { type: 'road', x: 9, y: 5 },
    { type: 'road', x: 9, y: 6 }
  ];

  G.START_BUILDINGS = START_BUILDINGS;

  // ---------- utility ----------
  G.hash = function (x, y, salt = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  };
  G.key = (x, y) => `${x},${y}`;
  G.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  G.round = (v, p = 1) => {
    const f = Math.pow(10, p);
    return Math.round(v * f) / f;
  };
  G.fmt = function (v) {
    if (v >= 10000) return (v / 1000).toFixed(1) + 'k';
    if (v >= 1000) return Math.round(v).toLocaleString('en-US');
    return `${Math.floor(v)}`;
  };
  G.perMin = function (v) {
    const n = v * 60;
    const abs = Math.abs(n);
    const sign = n >= 0 ? '+' : '−';
    if (abs < .05) return '—';
    return sign + (abs < 10 ? abs.toFixed(1) : Math.round(abs));
  };
  G.day = s => 1 + Math.floor((s.playTime || 0) / 80);
  G.season = s => G.SEASONS[Math.floor((G.day(s) - 1) / 4) % 4];
  G.levelData = lvl => G.LEVELS[G.clamp(lvl, 1, G.MAX_LEVEL) - 1];

  G.levelForXp = function (xp) {
    let l = 1;
    for (const row of G.LEVELS) if (xp >= row.xp) l = row.level;
    return l;
  };

  G.buildingAt = function (x, y, state = G.state) {
    if (!state) return null;
    return state.buildings.find(b => b.x === x && b.y === y) || null;
  };

  G.effective = function (b) {
    const def = G.BUILDINGS[b.type];
    if (!def) return null;
    const lv = b.level || 1;
    const mult = 1 + (lv - 1) * .5;
    const jobs = def.jobs ? def.jobs + (lv - 1) : 0;
    const capacity = def.capacity ? def.capacity + (lv - 1) * 2 : 0;
    const production = {};
    const consumption = {};
    for (const k in def.production || {}) production[k] = def.production[k] * mult;
    for (const k in def.consumption || {}) consumption[k] = def.consumption[k] * mult;
    return { def, mult, jobs, capacity, production, consumption, happiness: def.happiness || 0 };
  };

  // ---------- static map ----------
  G.terrain = [];
  G.scenery = [];
  G.pond = new Set(['2,8', '3,8', '2,9', '3,9']);
  G.forestTiles = [
    [0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2],
    [10, 1], [11, 0], [11, 1], [11, 2], [9, 2], [10, 2], [10, 3],
    [0, 8], [1, 8], [1, 9], [11, 8]
  ];
  G.rockTiles = [[11, 3], [0, 7]];

  function makeMap() {
    G.terrain = [];
    for (let y = 0; y < G.MAP_H; y++) {
      const row = [];
      for (let x = 0; x < G.MAP_W; x++) {
        let kind = 'grass';
        if (x >= 12 || y >= 10 || G.pond.has(G.key(x, y))) kind = 'water';
        if (G.forestTiles.some(p => p[0] === x && p[1] === y)) kind = 'forest';
        if (G.rockTiles.some(p => p[0] === x && p[1] === y)) kind = 'rock';
        row.push({ kind, blocked: kind !== 'grass', variant: Math.floor(G.hash(x, y, 3) * 4) });
      }
      G.terrain.push(row);
    }

    const scenery = [];
    for (const [x, y] of G.forestTiles) {
      const n = 2 + Math.floor(G.hash(x, y, 1) * 2);
      for (let i = 0; i < n; i++) {
        const h = G.hash(x, y, i + 10);
        const type = h < .38 ? 'oak1' : h < .63 ? 'oak2' : h < .86 ? 'pine1' : 'pine2';
        scenery.push({
          x, y, sprite: type,
          dx: (G.hash(x, y, i + 20) - .5) * .6,
          dy: (G.hash(x, y, i + 30) - .5) * .32,
          scale: .72 + G.hash(x, y, i + 40) * .32,
          sort: G.hash(x, y, i + 50) * .3
        });
      }
      if (G.hash(x, y, 2) > .35) scenery.push({ x, y, sprite: 'bush', dx: (G.hash(x, y, 3) - .5) * .55, dy: .2, scale: .6, sort: .55 });
    }
    for (const [x, y] of G.rockTiles) {
      scenery.push({ x, y, sprite: 'rock', dx: 0, dy: .06, scale: 1, sort: .1 });
    }
    // wild flowers & shrubs tucked into the edges of the realm
    const decorTiles = [[2, 2], [4, 2], [7, 2], [0, 3], [11, 4], [2, 7], [10, 6], [0, 6], [7, 9], [11, 7], [5, 9], [1, 4]];
    for (const [x, y] of decorTiles) {
      const h = G.hash(x, y, 7);
      const sprite = h < .45 ? 'flowers' : h < .8 ? 'bush' : 'fence';
      if (G.terrain[y] && G.terrain[y][x] && G.terrain[y][x].kind === 'grass') {
        scenery.push({ x, y, sprite, dx: (G.hash(x, y, 8) - .5) * .44, dy: .18, scale: sprite === 'fence' ? .7 : .72, sort: .45, decor: true });
      }
    }
    // reeds at the pond
    for (const [x, y] of G.pond) {
      scenery.push({ x, y, sprite: 'flowers', dx: .28, dy: .1, scale: .42, sort: .6, decor: true, water: true });
    }
    G.scenery = scenery;
  }
  makeMap();

  G.terrainAt = (x, y) => (G.terrain[y] && G.terrain[y][x]) || null;

  // ---------- state ----------
  G.newGame = function () {
    const buildings = START_BUILDINGS.map((b, i) => ({
      id: 'b' + (i + 1), type: b.type, x: b.x, y: b.y, level: 1,
      variant: b.variant || 1, built: 0
    }));
    const built = {};
    for (const b of buildings) built[b.type] = (built[b.type] || 0) + 1;
    G.state = {
      version: 1, name: 'Valewood',
      resources: { wood: 160, stone: 90, food: 150, gold: 110 },
      pop: 8, xp: 38, level: 1, tax: 'normal',
      festival: 0, growth: 0, decline: 0, playTime: 0,
      buildings, completedQuests: [], built,
      stats: { totalBuilt: buildings.length, upgrades: 0, peakPop: 8, questsDone: 0 },
      soundOn: true, nextId: buildings.length + 1,
      lastSaved: 0, dirty: true
    };
    G.recountBuilt();
    G.state.level = G.levelForXp(G.state.xp);
    return G.state;
  };

  G.recountBuilt = function () {
    const built = {};
    for (const b of G.state.buildings) built[b.type] = (built[b.type] || 0) + 1;
    G.state.built = built;
  };

  G.addXp = function (amount, silent = false) {
    if (!amount) return;
    const s = G.state;
    s.xp += amount;
    const next = G.levelForXp(s.xp);
    if (next > s.level) {
      const old = s.level;
      s.level = next;
      for (let lv = old + 1; lv <= next; lv++) {
        const row = G.levelData(lv);
        const unlocked = G.BUILD_ORDER.filter(t => G.BUILDINGS[t].unlock === lv).map(t => G.BUILDINGS[t].name);
        const note = unlocked.length ? `${unlocked.join(', ')} unlocked.` : 'Your realm grows in renown.';
        G.toast(`Renown level ${lv} — ${row.title}`, note, 'good', '♛');
      }
      G.emitFx('levelup');
      s.dirty = true;
    }
    return next;
  };

  G.toast = function (title, msg, kind = '', icon = '✦') {
    window.dispatchEvent(new CustomEvent('kb:toast', { detail: { title, msg, kind, icon } }));
  };

  G.emitFx = function (kind, data = {}) {
    window.dispatchEvent(new CustomEvent('kb:fx', { detail: { kind, ...data } }));
  };

  G.snapshot = function () {
    const s = G.state;
    let jobs = 0, capacity = 0, baseHappy = 0, defence = 0;
    for (const b of s.buildings) {
      const e = G.effective(b);
      if (!e) continue;
      jobs += e.jobs;
      capacity += e.capacity;
      baseHappy += e.happiness;
      defence += (e.def.defence || 0) * (b.level || 1);
    }

    // road network
    const roadSet = new Set();
    const roads = [];
    let keep = null;
    for (const b of s.buildings) {
      if (b.type === 'road') roads.push(b);
      if (b.type === 'keep') keep = b;
    }
    if (keep) {
      const roadAt = new Map(roads.map(r => [G.key(r.x, r.y), r]));
      const queue = [];
      const pushNeighbours = (x, y) => {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = G.key(x + dx, y + dy);
          if (roadAt.has(k) && !roadSet.has(k)) { roadSet.add(k); queue.push(roadAt.get(k)); }
        }
      };
      pushNeighbours(keep.x, keep.y);
      while (queue.length) {
        const r = queue.shift();
        pushNeighbours(r.x, r.y);
      }
    }

    const buildingMap = new Map(s.buildings.map(b => [G.key(b.x, b.y), b]));
    const isConnected = b => {
      if (b.type === 'keep') return true;
      if (b.type === 'road') return roadSet.has(G.key(b.x, b.y));
      if (!keep) return false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = buildingMap.get(G.key(b.x + dx, b.y + dy));
        if (!n) continue;
        if (n.type === 'keep') return true;
        if (n.type === 'road' && roadSet.has(G.key(n.x, n.y))) return true;
      }
      return false;
    };

    const foodShortage = s.resources.food <= .1;
    const lowFood = s.resources.food < Math.max(10, s.pop * 1.2);
    const employed = Math.min(s.pop, jobs);
    const unemployment = jobs > 0 ? Math.max(0, s.pop - jobs) / Math.max(1, s.pop) : (s.pop > 0 ? 1 : 0);
    const overcrowded = capacity > 0 && s.pop > capacity;
    const taxMod = G.TAX[s.tax] || G.TAX.normal;
    let happiness = 55 + baseHappy;
    happiness += Math.min(10, roadSet.size * .7);
    happiness += taxMod.happy;
    if (foodShortage) happiness -= 28;
    else if (lowFood) happiness -= 5;
    if (unemployment > .12) happiness -= Math.min(8, unemployment * 9);
    if (overcrowded) happiness -= 14;
    if (s.festival > 0) happiness += 12;
    if (!s.buildings.some(b => b.type === 'house')) happiness -= 10;
    happiness = G.clamp(happiness, 4, 100);

    const productivity = .58 + .42 * (happiness / 100);
    const satisfied = employed / Math.max(1, s.pop);
    const staffFactor = jobs > 0 ? G.clamp(s.pop / jobs, 0, 1) : 1;

    const gross = { wood: 0, stone: 0, food: 0, gold: 0 };
    const consume = { wood: 0, stone: 0, food: 0, gold: 0 };
    const items = [];
    for (const b of s.buildings) {
      const e = G.effective(b);
      if (!e) continue;
      const connected = isConnected(b);
      const isProducer = Object.keys(e.production).length > 0;
      if (!isProducer) continue;
      const roadBonus = connected && b.type !== 'keep' ? 1.2 : 1;
      const mult = productivity * staffFactor * roadBonus;
      const prod = {};
      const cons = {};
      for (const k in e.production) { prod[k] = e.production[k] * mult; gross[k] += prod[k]; }
      for (const k in e.consumption) { cons[k] = e.consumption[k] * Math.max(.35, staffFactor); consume[k] += cons[k]; }
      items.push({ b, e, connected, prod, cons });
    }

    const taxGold = s.pop * .0042 * taxMod.mult * (.55 + happiness / 220);
    const foodEat = s.pop * .018;
    gross.gold += taxGold;
    consume.food += foodEat;
    const net = {};
    for (const k of resourceOrder) net[k] = gross[k] - consume[k];

    return {
      jobs, capacity, employed, satisfaction: satisfied, staffFactor, happiness,
      productivity, defence, roadCount: roadSet.size, roads: roadSet,
      isConnected, items, gross, consume, net, taxGold, foodEat,
      foodShortage, lowFood, overcrowded, unemployment
    };
  };

  G.connected = function (b) {
    if (!b) return false;
    const keep = G.state.buildings.find(x => x.type === 'keep');
    if (!keep) return false;
    if (b.type === 'keep') return true;
    const roadSet = new Set();
    const roads = G.state.buildings.filter(x => x.type === 'road');
    const roadAt = new Map(roads.map(r => [G.key(r.x, r.y), r]));
    const queue = [];
    const push = (x, y) => {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = G.key(x + dx, y + dy);
        if (roadAt.has(k) && !roadSet.has(k)) { roadSet.add(k); queue.push(roadAt.get(k)); }
      }
    };
    push(keep.x, keep.y);
    while (queue.length) { const r = queue.shift(); push(r.x, r.y); }
    if (b.type === 'road') return roadSet.has(G.key(b.x, b.y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = G.buildingAt(b.x + dx, b.y + dy);
      if (n && (n.type === 'keep' || (n.type === 'road' && roadSet.has(G.key(n.x, n.y))))) return true;
    }
    return false;
  };

  G.happyNote = function (eco) {
    if (eco.foodShortage) return 'The granary is empty — your people are hungry.';
    if (eco.overcrowded) return 'Houses are crowded. Raise more homes.';
    if (eco.unemployment > .18) return 'Many hands are idle. Build more workplaces.';
    if (G.state.festival > 0) return 'Music and lanterns fill the square!';
    if (eco.happiness >= 86) return 'Valewood is the envy of the valley.';
    if (eco.happiness >= 68) return 'Your people are content and hopeful.';
    if (eco.happiness >= 50) return 'Life is modest, but the hearths are warm.';
    if (eco.happiness >= 34) return 'Discontent murmurs in the lanes.';
    return 'The people are unhappy. Something must change.';
  };

  G.levelProgress = function () {
    const s = G.state;
    const cur = G.levelData(s.level);
    const next = G.levelData(Math.min(G.MAX_LEVEL, s.level + 1));
    if (s.level >= G.MAX_LEVEL) return { pct: 100, text: `${Math.floor(s.xp)} renown`, next: 'A legend among kingdoms' };
    const span = next.xp - cur.xp;
    const pct = G.clamp(((s.xp - cur.xp) / span) * 100, 0, 100);
    return { pct, text: `${Math.floor(s.xp)} / ${next.xp} renown`, next: `Next: ${next.title}` };
  };

  G.questProgress = q => (q.progress ? q.progress(G.state) : '');
  G.activeQuests = function () {
    return G.QUESTS.filter(q => !G.state.completedQuests.includes(q.id)).slice(0, 3);
  };

  G.checkQuests = function () {
    const s = G.state;
    if (!s) return false;
    let changed = false;
    for (const q of G.QUESTS) {
      if (s.completedQuests.includes(q.id)) continue;
      if (q.check(s)) {
        s.completedQuests.push(q.id);
        s.stats.questsDone = (s.stats.questsDone || 0) + 1;
        for (const k in q.reward) s.resources[k] = (s.resources[k] || 0) + q.reward[k];
        G.toast('Decree fulfilled', `${q.title} — ${G.rewardText(q.reward)}`, 'good', '✓');
        G.addXp(q.xp || 0);
        changed = true;
        s.dirty = true;
        G.emitFx('quest');
      }
    }
    return changed;
  };

  G.rewardText = function (reward) {
    return Object.entries(reward).map(([k, v]) => `+${v} ${k}`).join(' · ');
  };

  G.canPlace = function (type, x, y, checkCost = true) {
    const def = G.BUILDINGS[type];
    if (!def || !def.buildable) return { ok: false, reason: 'This cannot be built.' };
    if (x < 0 || y < 0 || x >= G.MAP_W || y >= G.MAP_H) return { ok: false, reason: 'Beyond the edge of the realm.' };
    const tile = G.terrainAt(x, y);
    if (!tile) return { ok: false, reason: 'Beyond the edge of the realm.' };
    if (tile.kind === 'water') return { ok: false, reason: 'You cannot build on water.' };
    if (tile.kind === 'forest') return { ok: false, reason: 'The old forest will not yield.' };
    if (tile.kind === 'rock') return { ok: false, reason: 'The ground is too stony here.' };
    if (G.buildingAt(x, y)) return { ok: false, reason: 'This plot is already occupied.' };
    if (type === 'road' && G.buildingAt(x, y)) return { ok: false, reason: 'This plot is occupied.' };
    if (def.unique && G.state.buildings.some(b => b.type === type)) return { ok: false, reason: 'Only one may be raised.' };
    if (checkCost) {
      for (const [k, v] of Object.entries(def.cost)) {
        if ((G.state.resources[k] || 0) < v) return { ok: false, reason: `Not enough ${k}.`, missing: k };
      }
    }
    return { ok: true };
  };

  G.place = function (type, x, y) {
    const check = G.canPlace(type, x, y, true);
    if (!check.ok) {
      G.toast('Cannot build there', check.reason, 'bad', '✕');
      return check;
    }
    const def = G.BUILDINGS[type];
    for (const [k, v] of Object.entries(def.cost)) G.state.resources[k] -= v;
    const b = {
      id: 'b' + (G.state.nextId++), type, x, y, level: 1,
      variant: 1 + Math.floor(G.hash(x, y, G.state.nextId) * 3), built: G.day(G.state)
    };
    G.state.buildings.push(b);
    G.state.built[type] = (G.state.built[type] || 0) + 1;
    G.state.stats.totalBuilt = (G.state.stats.totalBuilt || 0) + 1;
    G.addXp(def.xp || 0);
    G.state.dirty = true;
    G.emitFx('build', { x, y });
    G.checkQuests();
    return { ok: true, building: b };
  };

  G.upgradeCost = function (b) {
    const def = G.BUILDINGS[b.type];
    if (!def || !def.buildable) return {};
    const factor = (b.level || 1) === 1 ? .7 : 1.2;
    const out = {};
    for (const [k, v] of Object.entries(def.cost)) out[k] = Math.max(5, Math.ceil((v * factor) / 5) * 5);
    return out;
  };

  G.canUpgrade = function (b) {
    const def = G.BUILDINGS[b.type];
    if (!def || (b.level || 1) >= (def.maxLevel || 1)) return { ok: false, reason: 'Already fully upgraded.' };
    const cost = G.upgradeCost(b);
    for (const [k, v] of Object.entries(cost)) if ((G.state.resources[k] || 0) < v) return { ok: false, reason: `Need ${v} ${k}.`, missing: k };
    return { ok: true, cost };
  };

  G.upgrade = function (id) {
    const b = G.state.buildings.find(x => x.id === id);
    if (!b) return false;
    const check = G.canUpgrade(b);
    if (!check.ok) { G.toast('Cannot upgrade', check.reason, 'bad', '✕'); return false; }
    for (const [k, v] of Object.entries(check.cost)) G.state.resources[k] -= v;
    b.level += 1;
    G.state.stats.upgrades = (G.state.stats.upgrades || 0) + 1;
    G.addXp(12 + b.level * 8);
    G.state.dirty = true;
    G.emitFx('upgrade', { x: b.x, y: b.y });
    G.toast(`${G.BUILDINGS[b.type].name} upgraded`, `Now level ${b.level}. Production and capacity increased.`, 'good', '⬆');
    return true;
  };

  G.demolish = function (id) {
    const i = G.state.buildings.findIndex(x => x.id === id);
    if (i < 0) return false;
    const b = G.state.buildings[i];
    const def = G.BUILDINGS[b.type];
    if (b.type === 'keep') { G.toast('The Keep stands', 'The heart of your realm cannot be demolished.', 'bad', '✕'); return false; }
    const refund = {};
    for (const [k, v] of Object.entries(def.cost)) {
      const amount = Math.max(1, Math.floor(v * .4));
      refund[k] = amount;
      G.state.resources[k] += amount;
    }
    G.state.buildings.splice(i, 1);
    G.recountBuilt();
    G.state.dirty = true;
    G.emitFx('demolish', { x: b.x, y: b.y });
    G.toast(`${def.name} removed`, `Salvaged ${Object.entries(refund).map(([k, v]) => `${v} ${k}`).join(' · ')}.`, '', '⌫');
    return true;
  };

  G.holdFestival = function () {
    const s = G.state;
    if (s.festival > 0) return false;
    if (s.resources.food < 30 || s.resources.gold < 25) {
      G.toast('The festival cannot begin', 'It requires 30 food and 25 gold.', 'bad', '✦');
      return false;
    }
    s.resources.food -= 30;
    s.resources.gold -= 25;
    s.festival = 45;
    s.dirty = true;
    G.toast('A festival begins!', 'Music, mead and merriment raise contentment for 45 seconds.', 'good', '✦');
    G.emitFx('festival');
    return true;
  };

  G.setTax = function (tax) {
    if (!G.TAX[tax]) return;
    G.state.tax = tax;
    G.state.dirty = true;
    G.emitFx('tax');
  };

  // ---------- simulation ----------
  G.simulate = function (dt) {
    const s = G.state;
    if (!s) return;
    const eco = G.snapshot();
    s.happiness = eco.happiness;
    s.capacity = eco.capacity;
    s.jobs = eco.jobs;

    for (const item of eco.items) {
      let ratio = 1;
      for (const k in item.cons) {
        if (item.cons[k] <= 0) continue;
        ratio = Math.min(ratio, (s.resources[k] || 0) / Math.max(.00001, item.cons[k] * dt));
      }
      ratio = G.clamp(ratio, 0, 1);
      for (const k in item.prod) s.resources[k] += item.prod[k] * dt * ratio;
      for (const k in item.cons) s.resources[k] -= item.cons[k] * dt * ratio;
    }
    s.resources.gold += eco.taxGold * dt;
    s.resources.food -= eco.foodEat * dt;
    for (const k of resourceOrder) s.resources[k] = G.clamp(s.resources[k], 0, 999999);

    if (s.festival > 0) {
      s.festival = Math.max(0, s.festival - dt);
      if (s.festival === 0) G.toast('The festival ends', 'The lanterns are dimmed, but the memory remains.', '', '✦');
    }

    const capacity = eco.capacity;
    const canGrow = s.pop < capacity && s.resources.food > 15 && eco.happiness >= 45;
    if (canGrow) {
      s.growth += dt;
      const interval = Math.max(11, 26 - eco.happiness * .12);
      if (s.growth >= interval) {
        s.growth = 0;
        s.pop += 1;
        s.stats.peakPop = Math.max(s.stats.peakPop || 0, s.pop);
        G.addXp(5, true);
        G.toast('New villagers arrive', `Valewood now has ${s.pop} souls.`, 'good', '♟');
        G.emitFx('growth');
        G.checkQuests();
        s.dirty = true;
      }
    } else {
      s.growth = Math.max(0, s.growth - dt * .55);
    }

    if (s.resources.food <= 0 && eco.happiness < 32) {
      s.decline += dt;
      if (s.decline > 35 && s.pop > 1) {
        s.decline = 0;
        s.pop -= 1;
        G.toast('A family departs', 'Hunger has driven a family from Valewood.', 'bad', '☹');
        s.dirty = true;
      }
    } else s.decline = Math.max(0, s.decline - dt);

    s.playTime += dt;
    s.dirty = true;
    G.questTimer = (G.questTimer || 0) + dt;
    if (G.questTimer > 1.2) { G.questTimer = 0; G.checkQuests(); }
  };

  // ---------- persistence ----------
  G.saveGame = function (manual = false) {
    try {
      const s = G.state;
      s.lastSaved = Date.now();
      s.dirty = false;
      localStorage.setItem(G.SAVE_KEY, JSON.stringify(s));
      window.dispatchEvent(new CustomEvent('kb:saved', { detail: { manual, at: s.lastSaved } }));
      if (manual) G.toast('Chronicle saved', 'Your kingdom is recorded in the royal archives.', 'good', '✎');
      return true;
    } catch (e) {
      if (manual) G.toast('Could not save', 'The chronicle could not be written to this browser.', 'bad', '✕');
      return false;
    }
  };

  G.hasSave = function () {
    try { return !!localStorage.getItem(G.SAVE_KEY); } catch { return false; }
  };

  G.loadGame = function () {
    try {
      const raw = localStorage.getItem(G.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.buildings)) return false;
      const base = G.newGame();
      const s = {
        ...base, ...data,
        resources: { ...base.resources, ...(data.resources || {}) },
        stats: { ...base.stats, ...(data.stats || {}) },
        buildings: data.buildings.filter(b => b && G.BUILDINGS[b.type] && Number.isInteger(b.x) && Number.isInteger(b.y))
          .map((b, i) => ({ ...b, level: G.clamp(b.level || 1, 1, G.BUILDINGS[b.type].maxLevel || 1), id: b.id || 'b' + (i + 100) }))
      };
      G.state = s;
      G.recountBuilt();
      s.level = G.levelForXp(s.xp || 0);
      s.pop = G.clamp(+s.pop || 1, 1, 9999);
      s.tax = G.TAX[s.tax] ? s.tax : 'normal';
      if (!Array.isArray(s.completedQuests)) s.completedQuests = [];
      s.dirty = false;
      G.checkQuests();
      window.dispatchEvent(new CustomEvent('kb:loaded'));
      return true;
    } catch (e) {
      console.warn('Could not load save', e);
      return false;
    }
  };

  G.deleteSave = function () {
    try { localStorage.removeItem(G.SAVE_KEY); } catch { /* noop */ }
  };

  G.costText = function (cost) {
    return Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(' · ');
  };

  G.newGame();
})();
