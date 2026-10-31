import { hashString } from './util.js';

const KEY = 'twr.memory.v1';

export const TRAITS = {
  emberhide: {
    name: 'Emberhide',
    desc: 'They have learned your fire. Hide and rag smoulder without burning.',
  },
  longreach: {
    name: 'Long Reach',
    desc: 'Your spear taught them distance. They close faster now, and lunge.',
  },
  feint: {
    name: 'Feinted Strikes',
    desc: 'They wait for your roll, then strike where you land.',
  },
  pursuit: {
    name: 'The Pursuit',
    desc: 'Running is a language they understand. They see farther and run longer.',
  },
  nightborn: {
    name: 'Nightborn',
    desc: 'You hunted in the dark. The dark learned to hunt back.',
  },
  ashen: {
    name: 'Ash-Eaters',
    desc: 'They smother campfires. Warmth is no longer a wall.',
  },
  packmind: {
    name: 'Packmind',
    desc: 'The wolves remember their dead. They come in greater numbers.',
  },
  thickhide: {
    name: 'Thickhide',
    desc: 'Your axe dulled against them. Blades bite shallower now.',
  },
  apex: {
    name: 'Apex',
    desc: 'You have killed enough to be a legend. Legends draw bigger things.',
  },
  blooddebt: {
    name: 'Blood Debt',
    desc: 'You spilled the valley\'s own. It has not forgotten the smell of you.',
  },
};

export function defaultMemory() {
  return {
    version: 1,
    cycles: 0,
    bestDay: 0,
    seedSalt: Math.floor(Math.random() * 100000),
    counters: {
      hits: { slash: 0, pierce: 0, fire: 0, blunt: 0 },
      attacks: 0,
      dodges: 0,
      flees: 0,
      kills: 0,
      wolfKills: 0,
      hollowKills: 0,
      wardenKills: 0,
      nightKills: 0,
      campfireLit: 0,
      shards: 0,
      deaths: 0,
      npcHits: 0,
      npcKills: 0,
      daysSurvived: 0,
      totalDays: 0,
      harvested: 0,
      crafted: 0,
    },
    npcs: {
      maren: { trust: 0, quests: { berries: false, shards: false }, alive: true },
      sable: { trust: 0, quests: { meat: false, hunt: false }, alive: true },
      pell: { trust: 0, alive: true },
    },
    graves: [],
    burns: [],
    ashes: [],
    chronicle: [],
    lastRun: null,
    settings: { muted: false },
  };
}

export function loadMemory() {
  const base = defaultMemory();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return base;
    const merged = { ...base, ...saved };
    merged.counters = { ...base.counters, ...(saved.counters || {}) };
    merged.counters.hits = { ...base.counters.hits, ...(saved.counters?.hits || {}) };
    merged.npcs = { ...base.npcs };
    for (const k of Object.keys(base.npcs)) {
      merged.npcs[k] = { ...base.npcs[k], ...(saved.npcs?.[k] || {}) };
      merged.npcs[k].quests = { ...base.npcs[k].quests, ...(saved.npcs?.[k]?.quests || {}) };
    }
    merged.settings = { ...base.settings, ...(saved.settings || {}) };
    merged.graves = Array.isArray(saved.graves) ? saved.graves.slice(0, 6) : [];
    merged.burns = Array.isArray(saved.burns) ? saved.burns.slice(-400) : [];
    merged.ashes = Array.isArray(saved.ashes) ? saved.ashes.slice(-16) : [];
    merged.chronicle = Array.isArray(saved.chronicle) ? saved.chronicle.slice(-40) : [];
    return merged;
  } catch {
    return base;
  }
}

export function saveMemory(memory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage may be unavailable */
  }
}

export function forgetMemory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function activeTraits(memory) {
  const c = memory.counters;
  const h = c.hits;
  const total = Math.max(1, h.slash + h.pierce + h.fire + h.blunt);
  const out = [];
  if (h.fire >= 10 && h.fire / total > 0.26) out.push('emberhide');
  if (h.pierce >= 10 && h.pierce / total > 0.28) out.push('longreach');
  if (c.dodges >= 16) out.push('feint');
  if (c.flees >= 5) out.push('pursuit');
  if (c.nightKills >= 5) out.push('nightborn');
  if (c.campfireLit >= 6) out.push('ashen');
  if (c.wolfKills >= 7) out.push('packmind');
  if (h.slash >= 12 && h.slash / total > 0.3) out.push('thickhide');
  if (c.kills >= 22) out.push('apex');
  if (c.npcKills > 0) out.push('blooddebt');
  return out;
}

export function traitById(id) {
  return TRAITS[id] || { name: id, desc: '' };
}

export function worldSeed(memory) {
  return hashString(`valley:${memory.cycles}:${memory.seedSalt}:${memory.counters.deaths}:${memory.counters.kills}`);
}

export function addChronicle(memory, entry) {
  memory.chronicle.push({ ...entry, at: Date.now() });
  if (memory.chronicle.length > 40) memory.chronicle.shift();
}

export function recordDeath(memory, { day, cause, x, y, cycle, loot }) {
  const c = memory.counters;
  c.deaths++;
  c.totalDays += Math.max(0, day - 1);
  memory.bestDay = Math.max(memory.bestDay, day);
  memory.cycles++;
  const grave = {
    x: Math.round(x),
    y: Math.round(y),
    day,
    cycle,
    cause,
    loot: loot || { wood: 2, fiber: 2 },
    taken: false,
  };
  memory.graves.unshift(grave);
  memory.graves = memory.graves.slice(0, 5);
  addChronicle(memory, {
    cycle,
    day,
    kind: 'death',
    text: `Died on day ${day} — ${cause}.`,
  });
  memory.lastRun = { kind: 'death', day, cause, cycle, at: Date.now() };
  return grave;
}

export function recordVictory(memory, { day, cycle, kills }) {
  const c = memory.counters;
  memory.bestDay = Math.max(memory.bestDay, day);
  c.totalDays += Math.max(0, day - 1);
  memory.cycles++;
  addChronicle(memory, {
    cycle,
    day,
    kind: 'victory',
    text: `Kindled the beacon on day ${day} after ${kills} kills.`,
  });
  memory.lastRun = { kind: 'victory', day, cycle, at: Date.now() };
}

export function noteRun(memory, { day, kills, traits, cause }) {
  memory.lastRun = {
    kind: 'progress',
    day,
    kills,
    traits,
    cause,
    at: Date.now(),
  };
}

export function applyBurn(memory, x, y) {
  memory.burns.push({ x: Math.round(x), y: Math.round(y) });
  if (memory.burns.length > 400) memory.burns.shift();
}

export function addAsh(memory, x, y) {
  memory.ashes.push({ x: Math.round(x), y: Math.round(y) });
  if (memory.ashes.length > 16) memory.ashes.shift();
}

export function npcGiftFor(memory, key) {
  const npc = memory.npcs[key];
  if (!npc || !npc.alive) return null;
  if (key === 'maren' && npc.trust >= 40) {
    return { items: { bandage: 2 }, line: 'Maren left two bandages wrapped in oilcloth at the gate.' };
  }
  if (key === 'sable' && npc.trust >= 40) {
    return { items: { flint: 2, meat: 1 }, line: 'Sable left flint and a cut of meat on the woodpile.' };
  }
  if (key === 'pell' && npc.trust >= 30) {
    return { items: { berry: 3 }, line: 'Pell left a handful of berries where you sleep.' };
  }
  return null;
}

export function npcAlive(memory, key) {
  return memory.npcs[key]?.alive !== false;
}

export function campAbandoned(memory) {
  return !npcAlive(memory, 'maren') && !npcAlive(memory, 'sable');
}

export function daysPhrase(n) {
  return n === 1 ? 'one day' : `${n} days`;
}
