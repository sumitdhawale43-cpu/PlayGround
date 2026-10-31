/* Local persistence. The whole expedition survives a reload. */
const KEY = 'deepocean.save.v1';

export const DEFAULT_UPGRADES = {
  oxygen: 0,
  hull: 0,
  thrusters: 0,
  lamp: 0,
  pressure: 0,
  magnet: 0,
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return normalize(data);
  } catch (error) {
    console.warn('Deep Ocean: could not read save', error);
    return null;
  }
}

export function writeSave(data) {
  try {
    const payload = normalize({ ...data, version: 1, savedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn('Deep Ocean: could not write save', error);
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalize(data) {
  const upgrades = { ...DEFAULT_UPGRADES };
  for (const key of Object.keys(DEFAULT_UPGRADES)) {
    upgrades[key] = Math.max(0, Math.min(9, Math.floor(finite(data.upgrades?.[key], 0))));
  }
  const stats = data.stats || {};
  return {
    version: 1,
    upgrades,
    salvage: Math.max(0, Math.floor(finite(data.salvage, 0))),
    relics: Math.max(0, Math.floor(finite(data.relics, 0))),
    opened: Array.isArray(data.opened) ? data.opened.filter(v => typeof v === 'string').slice(0, 40) : [],
    discovered: Array.isArray(data.discovered) ? data.discovered.filter(v => typeof v === 'string').slice(0, 20) : [],
    collected: Array.isArray(data.collected) ? data.collected.filter(v => typeof v === 'string').slice(0, 800) : [],
    player: {
      x: finite(data.player?.x, 1220),
      y: finite(data.player?.y, 1200),
      oxygen: Math.max(0, finite(data.player?.oxygen, 100)),
      health: Math.max(1, finite(data.player?.health, 100)),
      facing: finite(data.player?.facing, 1) < 0 ? -1 : 1,
    },
    stats: {
      dives: Math.max(0, Math.floor(finite(stats.dives, 0))),
      time: Math.max(0, finite(stats.time, 0)),
      bestDepth: Math.max(0, finite(stats.bestDepth, 0)),
      resources: Math.max(0, Math.floor(finite(stats.resources, 0))),
      creaturesSeen: Math.max(0, Math.floor(finite(stats.creaturesSeen, 0))),
    },
    completed: Boolean(data.completed),
    muted: Boolean(data.muted),
    startedAt: finite(data.startedAt, Date.now()),
    savedAt: finite(data.savedAt, Date.now()),
  };
}
