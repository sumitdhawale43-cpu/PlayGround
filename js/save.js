import { LEVELS, SAVE_KEY } from './levels.js';

const DEFAULT = () => ({
  version: 1,
  unlocked: 1,
  completed: {},
  totalCores: 0,
  lastLevel: 0,
  settings: { audio: true, reducedMotion: false, screenFx: true },
  totalDeaths: 0
});

export class SaveStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return DEFAULT();
      const parsed = JSON.parse(raw);
      const base = DEFAULT();
      const data = {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
        completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {}
      };
      data.unlocked = clamp(Number(data.unlocked) || 1, 1, LEVELS.length);
      data.lastLevel = clamp(Number(data.lastLevel) || 0, 0, LEVELS.length - 1);
      data.totalCores = clamp(Number(data.totalCores) || 0, 0, LEVELS.length * 3);
      return data;
    } catch {
      return DEFAULT();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  get(levelId) {
    return this.data.completed[levelId] || null;
  }

  get lastLevelData() {
    return LEVELS[this.data.lastLevel] || null;
  }

  setLastLevel(index) {
    this.data.lastLevel = clamp(index, 0, LEVELS.length - 1);
    this.save();
  }

  completeLevel(index, { time, deaths, cores }) {
    const level = LEVELS[index];
    if (!level) return null;
    const prev = this.data.completed[level.id];
    const stars = 1 + (cores >= level.cores.length ? 1 : 0) + (deaths === 0 ? 1 : 0);
    const newRecord = !prev || time < prev.time;
    const record = {
      time: newRecord ? time : prev.time,
      deaths: Math.min(prev?.deaths ?? 999, deaths),
      cores: Math.max(prev?.cores || 0, cores),
      stars: Math.max(prev?.stars || 0, stars),
      clearedAt: Date.now()
    };
    this.data.completed[level.id] = record;
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(LEVELS.length, index + 2));
    this.data.totalCores = Object.keys(this.data.completed).reduce((sum, id) => {
      const levelData = LEVELS.find(l => l.id === id);
      return sum + Math.min(levelData ? levelData.cores.length : 3, this.data.completed[id].cores || 0);
    }, 0);
    this.data.totalDeaths = (this.data.totalDeaths || 0) + deaths;
    this.data.lastLevel = index;
    this.save();
    return { record, newRecord, stars, bestTime: record.time };
  }

  reset() {
    this.data = DEFAULT();
    this.save();
  }
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
