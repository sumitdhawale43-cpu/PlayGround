// ── The Remembering — persistent memory, reputation and adaptation ───────────
import { clamp, RNG } from './util.js';

export const DOCTRINES = {
  shieldwall: {
    id: 'shieldwall', name: 'Shieldwall', stat: 'rangedKills', threshold: 2,
    desc: 'The Hollow raise hide shields. Arrows glance from their guard.',
    rumor: 'They carry shields now. Word of your arrows reached them.',
    icon: '◒',
  },
  slipstep: {
    id: 'slipstep', name: 'Slipstep', stat: 'meleeKills', threshold: 3,
    desc: 'They have learned to slip the first blow and circle behind it.',
    rumor: 'They no longer stand still when you swing. They have learned your rhythm.',
    icon: '↝',
  },
  sappers: {
    id: 'sappers', name: 'Sappers', stat: 'trapKills', threshold: 1,
    desc: 'Hollow sappers disarm snares before the line walks into them.',
    rumor: 'They send sappers ahead now. Your little wire tricks will not hold them.',
    icon: '⌁',
  },
  wardens: {
    id: 'wardens', name: 'Lantern Wardens', stat: 'stealthKills', threshold: 2,
    desc: 'Lantern sentries watch the dark. Crouching no longer hides you from them.',
    rumor: 'Lanterns move through the pines at night. They are looking for the quiet one.',
    icon: '◉',
  },
  hounds: {
    id: 'hounds', name: 'Scent Hounds', stat: 'escapes', threshold: 3,
    desc: 'Ash hounds follow your trail long after you break line of sight.',
    rumor: 'You ran. They bred hounds for runners. They will find the trail you left.',
    icon: '⌇',
  },
  ashwalkers: {
    id: 'ashwalkers', name: 'Ashwalkers', stat: 'fireHits', threshold: 2,
    desc: 'Ashwalkers have learned to walk through flame. Fire wounds them less.',
    rumor: 'They walk through fire now. Someone taught them not to fear your torch.',
    icon: '△',
  },
};

const CAUSES = {
  hollow: 'the Hollow', wolf: 'ash wolves', bear: 'a cave bear',
  starvation: 'hunger', thirst: 'thirst', cold: 'the cold', fall: 'the valley',
};

export class MemorySystem {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.reset();
  }

  reset() {
    this.entries = [];
    this.stats = {
      rangedKills: 0, meleeKills: 0, stealthKills: 0, trapKills: 0,
      fireHits: 0, escapes: 0, kills: 0, hunts: 0, gifts: 0, thefts: 0,
      crafts: 0, shrines: 0, nights: 0, distance: 0,
    };
    this.doctrines = {};
    for (const id of Object.keys(DOCTRINES)) {
      this.doctrines[id] = { progress: 0, unlocked: false };
    }
    this.rep = {};
    this.regions = {};
    this.dead = [];
    this.legend = 0;
    this.day = 1;
    this.time = 0.3;
    this.characterName = '';
    this.seq = 0;
    this.lastRumor = -1;
  }

  ensureRegion(id) {
    if (!this.regions[id]) this.regions[id] = { states: [], heat: 0, visits: 0 };
    return this.regions[id];
  }

  record({ type = 'deed', text, region = null, tags = [], weight = 1, witnesses = [] }) {
    const entry = {
      id: ++this.seq,
      day: this.day,
      time: this.time,
      type,
      text,
      region,
      tags,
      weight,
      witnesses,
    };
    this.entries.push(entry);
    if (this.entries.length > 140) this.entries.splice(0, this.entries.length - 140);
    this.legend = Math.min(999, this.legend + weight);
    return entry;
  }

  increment(stat, amount = 1) {
    if (this.stats[stat] === undefined) this.stats[stat] = 0;
    this.stats[stat] += amount;
    const unlocked = [];
    for (const doc of Object.values(DOCTRINES)) {
      if (doc.stat !== stat) continue;
      const state = this.doctrines[doc.id];
      if (state.unlocked) continue;
      state.progress = Math.min(doc.threshold, state.progress + amount);
      if (state.progress >= doc.threshold) {
        state.unlocked = true;
        unlocked.push(doc);
      }
    }
    return unlocked;
  }

  isUnlocked(id) { return !!this.doctrines[id]?.unlocked; }
  progressOf(id) {
    const doc = DOCTRINES[id];
    const state = this.doctrines[id];
    return { value: state.progress, max: doc.threshold, unlocked: state.unlocked };
  }

  reputation(place) { return this.rep[place] || 0; }
  changeRep(place, delta) {
    this.rep[place] = clamp((this.rep[place] || 0) + delta, -100, 100);
    return this.rep[place];
  }

  addRegionState(regionId, state) {
    const r = this.ensureRegion(regionId);
    if (!r.states.includes(state)) r.states.push(state);
  }
  regionStates(regionId) { return this.ensureRegion(regionId).states; }
  addHeat(regionId, amount) {
    const r = this.ensureRegion(regionId);
    r.heat = clamp(r.heat + amount, 0, 100);
  }
  heat(regionId) { return this.ensureRegion(regionId).heat; }
  decayHeat(dt) {
    for (const r of Object.values(this.regions)) {
      r.heat = Math.max(0, r.heat - dt * 0.16);
    }
  }

  recent(n = 8) { return this.entries.slice(-n).reverse(); }
  inRegion(regionName, n = 5) {
    return this.entries.filter(e => e.region === regionName).slice(-n).reverse();
  }
  topMemories(n = 5) {
    return [...this.entries].sort((a, b) => b.weight - a.weight).slice(0, n);
  }
  doctrineList() {
    return Object.values(DOCTRINES).map(doc => ({ ...doc, ...this.doctrines[doc.id] }));
  }
  unlockedDoctrines() {
    return Object.values(DOCTRINES).filter(doc => this.doctrines[doc.id].unlocked);
  }
  topTactic() {
    const pairs = Object.entries(this.stats)
      .filter(([k]) => ['rangedKills', 'meleeKills', 'stealthKills', 'trapKills', 'fireHits', 'escapes'].includes(k))
      .sort((a, b) => b[1] - a[1]);
    return pairs[0]?.[1] > 0 ? pairs[0][0] : null;
  }

  rumor(game, npc) {
    const rng = new RNG((this.seed ^ (npc.id * 7919) ^ (this.seq * 31)) >>> 0);
    const region = game.world.regions[npc.region];
    const place = region?.name || 'the valley';
    const local = this.inRegion(place, 6);
    const unlocked = this.unlockedDoctrines();
    const options = [];

    if (local.length) {
      const entry = rng.pick(local);
      options.push(`They say you ${stripYou(entry.text)}. The ${npc.role === 'Trader' ? 'road' : 'fires'} still talk about it.`);
    }
    if (unlocked.length) {
      options.push(rng.pick(unlocked).rumor);
    }
    if (this.dead.length) {
      const last = this.dead[this.dead.length - 1];
      options.push(`You walk like ${last.name}. The valley still tells stories about what happened on day ${last.day}.`);
    }
    if (this.reputation(place) >= 15) {
      options.push(`Hearthcamp has been kind to you. That kindness travels farther than you think.`);
    } else if (this.reputation(place) <= -15) {
      options.push(`There are names for people like you. I will not use them at my fire.`);
    }
    if (region && this.regionStates(region.id).includes('scorched')) {
      options.push(`This land was green before the fire. The Hollow remember who lit it.`);
    }
    if (region && this.regionStates(region.id).includes('hunted-out')) {
      options.push(`The deer are gone from ${place}. Something has been hunting too hard.`);
    }
    const generic = [
      `The Hollow are not one enemy. They are a memory with spears.`,
      `At night, watch the treeline. They send the ones who have learned your shape.`,
      `The valley keeps a ledger. Every kindness and every knife.`,
      `If you run, they will learn the sound of your running.`,
      `There is a shrine east of here. The stones listen better than I do.`,
      `Ashwatch has not answered a signal fire in three days.`,
    ];
    options.push(rng.pick(generic));
    let idx = Math.floor(rng.next() * options.length);
    if (options.length > 1 && idx === this.lastRumor) idx = (idx + 1) % options.length;
    this.lastRumor = idx;
    return options[idx];
  }

  epitaph() {
    const docs = this.unlockedDoctrines().length;
    if (this.legend > 80) return 'The valley will tell this story for a long time.';
    if (docs >= 4) return 'The Hollow will teach your tactics to the next one.';
    if (this.dead.length) return 'Another name for the ledger.';
    return 'The grass closes over the trail.';
  }

  serialize() {
    return {
      seed: this.seed, entries: this.entries, stats: this.stats, doctrines: this.doctrines,
      rep: this.rep, regions: this.regions, dead: this.dead, legend: this.legend,
      day: this.day, time: this.time, characterName: this.characterName, seq: this.seq,
    };
  }

  load(data) {
    if (!data) return;
    this.entries = data.entries || [];
    this.stats = { ...this.stats, ...(data.stats || {}) };
    this.doctrines = data.doctrines || this.doctrines;
    this.rep = data.rep || {};
    this.regions = data.regions || {};
    this.dead = data.dead || [];
    this.legend = data.legend || 0;
    this.day = data.day || 1;
    this.time = data.time ?? 0.3;
    this.characterName = data.characterName || '';
    this.seq = data.seq || this.entries.length;
    for (const id of Object.keys(DOCTRINES)) {
      if (!this.doctrines[id]) this.doctrines[id] = { progress: 0, unlocked: false };
    }
  }
}

function stripYou(text) {
  return text.replace(/^You /, '').replace(/^you /, '');
}

export function causeLabel(cause) {
  return CAUSES[cause] || 'the valley';
}

export function legendTier(legend) {
  return clamp(Math.floor(legend / 18), 0, 12);
}
