const KEY = 'deep-ocean-expedition-v1';

export function defaultSave() {
  return {
    version: 1,
    started: false,
    completed: false,
    resources: { scrap: 0, pearl: 0, crystal: 0 },
    upgrades: { oxygen: 0, thruster: 0, hull: 0, lamp: 0, sonar: 0, pulse: 0 },
    relics: [],
    leviathanPearl: false,
    collectedNodes: [],
    openedChests: [],
    discoveredZones: ['shallows'],
    player: { x: 1250, y: 280, oxygen: 100, hull: 100 },
    stats: {
      maxDepth: 0,
      dives: 0,
      time: 0,
      deaths: 0,
      chests: 0,
      nodes: 0,
      scrap: 0,
      pearl: 0,
      crystal: 0,
    },
    muted: false,
    savedAt: 0,
  };
}

function merge(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;
  const out = { ...base };
  for (const key of Object.keys(base)) {
    const b = base[key];
    const i = incoming[key];
    if (i === undefined || i === null) continue;
    if (Array.isArray(b)) out[key] = Array.isArray(i) ? i : b;
    else if (typeof b === 'object') out[key] = merge(b, i);
    else if (typeof i === typeof b) out[key] = i;
  }
  return out;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    return merge(defaultSave(), parsed);
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    data.savedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage can be unavailable in private mode */
  }
}
