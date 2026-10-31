/**
 * The Ledger: everything the valley remembers about you, and everything
 * the Hollowed have learned to do about it.
 */

export const TRAIT_INFO = [
  { key: 'blade', label: 'BLADE', color: '#c98d6b' },
  { key: 'bow', label: 'BOW', color: '#a9b77c' },
  { key: 'shadow', label: 'SHADOW', color: '#8f9bc4' },
  { key: 'snare', label: 'SNARE', color: '#c2a86a' },
  { key: 'flame', label: 'FLAME', color: '#e0763c' },
  { key: 'mercy', label: 'MERCY', color: '#b9c99d' },
  { key: 'greed', label: 'GREED', color: '#b08d55' }
];

export const ADAPTATIONS = [
  {
    id: 'shielded',
    name: 'They Carry Shields',
    glyph: '◈',
    need: { bow: 4 },
    short: 'Hollowed raise hide shields against your arrows.',
    detail: 'Arrow damage is reduced by 45%.',
    codex: 'Four arrows in the dark was enough. They cut hide from something and bound it to their arms.',
    mods: { rangedResist: 0.45 }
  },
  {
    id: 'swift',
    name: 'They Run You Down',
    glyph: '»',
    need: { escapes: 4 },
    short: 'They have learned the shape of your retreat.',
    detail: 'Hollowed move 18% faster.',
    codex: 'You slipped away four times. Now they do not lope. They sprint.',
    mods: { speed: 1.18 }
  },
  {
    id: 'keen',
    name: 'They Have Your Scent',
    glyph: '◉',
    need: { shadow: 3 },
    short: 'They search the places you like to hide.',
    detail: 'Hollowed detect you from much farther away.',
    codex: 'Three quiet kills taught them where quiet things kneel. They circle the shadows now.',
    mods: { sense: 1.75 }
  },
  {
    id: 'warded',
    name: 'They Read the Ground',
    glyph: '⌖',
    need: { snare: 2 },
    short: 'They step around your snares, or tear free.',
    detail: 'Snares are often avoided entirely and break quickly.',
    codex: 'Twice they felt the wire before the snap. The third time, they brought sticks to feel ahead.',
    mods: { trapSense: 0.65 }
  },
  {
    id: 'pack',
    name: 'They Come in Threes',
    glyph: '⁂',
    need: { kills: 6 },
    short: 'Your kills have made the valley crowded. More come each night.',
    detail: 'Each night brings one additional Hollowed.',
    codex: 'Six bodies. The valley filled the space they left with more of them.',
    mods: { extra: 1 }
  },
  {
    id: 'emberhide',
    name: 'They Wear Emberhide',
    glyph: '✹',
    need: { flame: 3 },
    short: 'Fire no longer scares them the way it should.',
    detail: 'Ember flashes no longer frighten Hollowed and burn them less.',
    codex: 'You waved fire in their faces three times. They learned to blink through it.',
    mods: { fireResist: 1 }
  },
  {
    id: 'marrowbow',
    name: 'They Answer in Kind',
    glyph: '➶',
    need: { bow: 9 },
    short: 'Some Hollowed now carry bows made of marrow and sinew.',
    detail: 'Hollowed archers appear at night and keep their distance.',
    codex: 'They watched your arrows arc. Now they send their own back along the same path.',
    mods: { archers: true }
  }
];

const DEFAULT_MODS = {
  rangedResist: 0,
  speed: 1,
  sense: 1,
  trapSense: 0,
  extra: 0,
  fireResist: 0,
  archers: false
};

const KEY = 'hollowmoor.chronicle.v2';
const MAX_EVENTS = 70;

const EMPTY_TRAITS = () => ({
  blade: 0, bow: 0, shadow: 0, snare: 0, flame: 0,
  mercy: 0, greed: 0, kills: 0, escapes: 0, deaths: 0,
  foraged: 0, explored: 0
});

export class Chronicle {
  constructor(data = null) {
    this.cycle = 1;
    this.events = [];
    this.traits = EMPTY_TRAITS();
    this.unlocked = [];
    this.rep = 0;
    this.fresh = [];
    this.started = Date.now();
    this.bestDay = 1;
    if (data) this.load(data);
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.traits) return null;
      return new Chronicle(data);
    } catch {
      return null;
    }
  }

  load(data) {
    this.cycle = Math.max(1, data.cycle || 1);
    this.events = Array.isArray(data.events) ? data.events.slice(-MAX_EVENTS) : [];
    this.traits = { ...EMPTY_TRAITS(), ...(data.traits || {}) };
    this.unlocked = Array.isArray(data.unlocked) ? data.unlocked.filter(id => ADAPTATIONS.some(a => a.id === id)) : [];
    this.rep = typeof data.rep === 'number' ? data.rep : 0;
    this.started = data.started || Date.now();
    this.bestDay = data.bestDay || 1;
    this.fresh = [];
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        cycle: this.cycle,
        events: this.events.slice(-MAX_EVENTS),
        traits: this.traits,
        unlocked: this.unlocked,
        rep: this.rep,
        started: this.started,
        bestDay: this.bestDay
      }));
    } catch { /* private mode, storage full — the valley forgets */ }
  }

  bump(traits = {}) {
    for (const [k, v] of Object.entries(traits)) {
      if (typeof v !== 'number') continue;
      this.traits[k] = (this.traits[k] || 0) + v;
    }
  }

  record({ kind, text, traits = {}, x = null, y = null, day = 1, time = 0, tags = [] }) {
    this.bump(traits);
    const event = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      text,
      day,
      time,
      x, y,
      tags,
      traits: Object.keys(traits)
    };
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS);
    const gained = this.evaluate();
    if (gained.length) this.save();
    return event;
  }

  evaluate() {
    const gained = [];
    for (const a of ADAPTATIONS) {
      if (this.unlocked.includes(a.id)) continue;
      const ok = Object.entries(a.need).every(([k, v]) => (this.traits[k] || 0) >= v);
      if (ok) {
        this.unlocked.push(a.id);
        gained.push(a);
        this.fresh.push(a.id);
      }
    }
    return gained;
  }

  has(id) { return this.unlocked.includes(id); }

  mods() {
    const out = { ...DEFAULT_MODS };
    for (const a of ADAPTATIONS) {
      if (!this.has(a.id)) continue;
      const m = a.mods || {};
      if (m.rangedResist != null) out.rangedResist = Math.max(out.rangedResist, m.rangedResist);
      if (m.speed != null) out.speed = Math.max(out.speed, m.speed);
      if (m.sense != null) out.sense = Math.max(out.sense, m.sense);
      if (m.trapSense != null) out.trapSense = Math.max(out.trapSense, m.trapSense);
      if (m.extra != null) out.extra = Math.max(out.extra, m.extra);
      if (m.fireResist != null) out.fireResist = Math.max(out.fireResist, m.fireResist);
      if (m.archers) out.archers = true;
    }
    return out;
  }

  adjustRep(n) {
    this.rep = Math.max(-100, Math.min(100, this.rep + n));
    return this.rep;
  }

  repLabel() {
    if (this.rep >= 45) return 'Kin';
    if (this.rep >= 15) return 'Trusted';
    if (this.rep > -15) return 'Watched';
    if (this.rep > -45) return 'Distrusted';
    return 'Hated';
  }

  topTrait(exclude = ['kills', 'escapes', 'deaths', 'foraged', 'explored']) {
    let best = null, bv = 0;
    for (const t of TRAIT_INFO) {
      if (exclude.includes(t.key)) continue;
      if ((this.traits[t.key] || 0) > bv) { bv = this.traits[t.key]; best = t; }
    }
    return { trait: best, value: bv };
  }

  recent(limit = 6) {
    return this.events.slice(-limit).reverse();
  }

  deeds() {
    return this.events.filter(e => e.kind !== 'arrive' && e.kind !== 'sleep');
  }

  nextCycle(reason = 'ending') {
    this.cycle += 1;
    this.bestDay = Math.max(this.bestDay, 1);
    this.record({
      kind: 'arrive',
      text: reason === 'ending'
        ? 'You left by the three fires. The valley kept the shape of you.'
        : 'You came back to Hollowmoor. Something in the trees recognised you.',
      traits: {},
      tags: ['cycle']
    });
    // Keep the lessons, thin the diary.
    if (this.events.length > 18) this.events = this.events.slice(-18);
    this.rep = Math.round(this.rep * 0.5);
    this.save();
  }

  summary(day = 1) {
    const top = this.topTrait();
    return {
      day,
      cycle: this.cycle,
      deeds: this.deeds().length,
      kills: this.traits.kills || 0,
      rep: this.repLabel(),
      adaptations: this.unlocked.length,
      top: top.trait ? top.trait.label.toLowerCase() : 'the quiet life'
    };
  }
}

export function glyphForKind(kind) {
  switch (kind) {
    case 'kill': return '⚔';
    case 'bow': return '➶';
    case 'shadow': return '◐';
    case 'snare': return '⌖';
    case 'flame': return '✹';
    case 'mercy': return '✦';
    case 'greed': return '◈';
    case 'death': return '☠';
    case 'build': return '⌂';
    case 'explore': return '◎';
    case 'gather': return '❧';
    case 'cairn': return '△';
    case 'arrive': return '◇';
    case 'sleep': return '☾';
    case 'save': return '✧';
    default: return '·';
  }
}
