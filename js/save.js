/* =========================================================
   PORTAL RUNNER — persistent progress
   ========================================================= */
const STORAGE_KEY = 'portal-runner-save-v1';
const MAX_LEVEL = 5;

export function defaultSettings() {
  return { music: true, sfx: true, motion: false, touch: false, shake: true };
}

export function defaultSave() {
  return {
    version: 1,
    unlocked: 1,
    levels: {},
    settings: defaultSettings(),
    totals: { deaths: 0, runs: 0 },
  };
}

function clampInt(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

export function loadSave() {
  const base = defaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;
    base.unlocked = clampInt(parsed.unlocked, 1, MAX_LEVEL);
    base.settings = { ...base.settings, ...(parsed.settings || {}) };
    base.totals = { ...base.totals, ...(parsed.totals || {}) };
    if (parsed.levels && typeof parsed.levels === 'object') {
      for (const [id, rec] of Object.entries(parsed.levels)) {
        if (!rec || typeof rec !== 'object') continue;
        const stars = clampInt(rec.stars, 0, 3);
        base.levels[id] = {
          completed: !!rec.completed,
          stars,
          shards: Math.max(0, Number(rec.shards) || 0),
          keys: Math.max(0, Number(rec.keys) || 0),
          bestTime: Number(rec.bestTime) > 0 ? Number(rec.bestTime) : 0,
          deaths: Math.max(0, Number(rec.deaths) || 0),
        };
      }
    }
  } catch {
    /* corrupted save: start clean */
  }
  return base;
}

export function writeSave(save) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* storage may be unavailable in private mode */
  }
}

export function starCount(completed, shards, keys, totalShards, totalKeys) {
  if (!completed) return 0;
  let stars = 1;
  if (totalShards > 0 && shards >= Math.ceil(totalShards * 0.75)) stars++;
  if (totalKeys > 0 && keys >= totalKeys) stars++;
  return Math.min(3, stars);
}

export function recordLevel(save, levelId, result) {
  const id = String(levelId);
  const prev = save.levels[id] || {
    completed: false, stars: 0, shards: 0, keys: 0, bestTime: 0, deaths: 0,
  };
  const completed = true;
  const shards = Math.max(prev.shards, result.shards || 0);
  const keys = Math.max(prev.keys, result.keys || 0);
  const stars = Math.max(prev.stars, starCount(true, result.shards || 0, result.keys || 0, result.totalShards, result.totalKeys));
  const bestTime = prev.bestTime > 0 ? Math.min(prev.bestTime, result.time || prev.bestTime) : (result.time || 0);
  save.levels[id] = {
    completed,
    stars: Math.max(stars, prev.stars),
    shards,
    keys,
    bestTime,
    deaths: Math.max(prev.deaths, result.deaths || 0),
  };
  save.unlocked = Math.min(MAX_LEVEL, Math.max(save.unlocked, Number(levelId) + 1));
  save.totals.runs = (save.totals.runs || 0) + 1;
  save.totals.deaths = (save.totals.deaths || 0) + (result.deaths || 0);
  writeSave(save);
  return save.levels[id];
}

export function saveSettings(save, settings) {
  save.settings = { ...save.settings, ...settings };
  writeSave(save);
  return save.settings;
}

export function resetSave() {
  const fresh = defaultSave();
  writeSave(fresh);
  return fresh;
}

export function progressSummary(save) {
  let stars = 0;
  let completed = 0;
  let shards = 0;
  let keys = 0;
  for (const rec of Object.values(save.levels)) {
    stars += rec.stars || 0;
    if (rec.completed) completed++;
    shards += rec.shards || 0;
    keys += rec.keys || 0;
  }
  return { stars, completed, shards, keys, maxStars: MAX_LEVEL * 3 };
}

export function formatTime(seconds) {
  const s = Math.max(0, seconds || 0);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const tenth = Math.floor((s % 1) * 10);
  return `${m}:${String(sec).padStart(2, '0')}.${tenth}`;
}
