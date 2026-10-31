// MONSTER MERGE — game data
// Five elemental families, four evolution stages each: 20 unique monsters.

export const ELEMENTS = {
  ember: {
    id: 'ember', name: 'Ember', color: '#ff8a4a', deep: '#c9314f', light: '#ffd166',
    glyph: 'flame', blurb: 'Fierce and full of spark.'
  },
  tide: {
    id: 'tide', name: 'Tide', color: '#49c6f5', deep: '#2563eb', light: '#a5f3fc',
    glyph: 'drop', blurb: 'Calm currents, crushing depth.'
  },
  verdant: {
    id: 'verdant', name: 'Verdant', color: '#78de8a', deep: '#15965c', light: '#d9f99d',
    glyph: 'leaf', blurb: 'Ancient roots and blooming power.'
  },
  storm: {
    id: 'storm', name: 'Storm', color: '#ffd45e', deep: '#e06d13', light: '#fff7c2',
    glyph: 'bolt', blurb: 'Fast, loud and impossible to pin down.'
  },
  umbra: {
    id: 'umbra', name: 'Umbra', color: '#c58bff', deep: '#6d28d9', light: '#e9d5ff',
    glyph: 'moon', blurb: 'Quiet shadows with hungry hearts.'
  }
}

export const ELEMENT_ORDER = ['ember', 'tide', 'verdant', 'storm', 'umbra']

// Strong against -> target. Ember > Verdant > Storm > Tide > Ember. Umbra is neutral.
export const STRONG_AGAINST = {
  ember: 'verdant',
  verdant: 'storm',
  storm: 'tide',
  tide: 'ember',
  umbra: null
}

export const WEAK_AGAINST = {
  ember: 'tide',
  verdant: 'ember',
  storm: 'verdant',
  tide: 'storm',
  umbra: null
}

const A = (name, desc, opts) => ({
  name,
  desc,
  cooldown: 3,
  target: 'one',
  power: 1.15,
  hits: 1,
  ...opts
})

export const MONSTERS = [
  // ── EMBER ─────────────────────────────────────────────────────────────
  {
    id: 'cindlet', name: 'Cindlet', element: 'ember', stage: 1, family: 'Ember Fox',
    lore: 'A playful ember fox. Its tail sparks whenever it gets excited.',
    stats: { hp: 64, atk: 15, def: 7, spd: 13 },
    ability: A('Ember Puff', 'Scorches one foe and sets it burning for 3 turns.', {
      cooldown: 3, power: 1.05, effects: [{ type: 'burn', turns: 3, potency: 0.24 }]
    }),
    art: {
      build: 'quad', pose: 'kit',
      palette: { base: '#ff9a4d', dark: '#e85d24', light: '#ffd08a', accent: '#ff5a36', glow: '#ffb347', belly: '#ffe3b3', eye: '#3a1c12' },
      ears: 'fox', tail: 'flame', mane: 'spark', fierce: false, spikes: 0, mark: 'diamond', cheek: true
    }
  },
  {
    id: 'flarepup', name: 'Flarepup', element: 'ember', stage: 2, family: 'Ember Fox',
    lore: 'Twin flames dance along its back, growing brighter around friends.',
    stats: { hp: 106, atk: 25, def: 11, spd: 17 },
    ability: A('Twin Flame', 'Strikes twice and leaves a 2-turn burn.', {
      cooldown: 3, power: 0.62, hits: 2, effects: [{ type: 'burn', turns: 2, potency: 0.2 }]
    }),
    art: {
      build: 'quad', pose: 'kit',
      palette: { base: '#ff7c3f', dark: '#d9481f', light: '#ffc166', accent: '#ff3d2e', glow: '#ff9d3b', belly: '#ffdca6', eye: '#34150d' },
      ears: 'fox', tail: 'flame-double', mane: 'flame', fierce: false, spikes: 1, mark: 'stripes', cheek: true
    }
  },
  {
    id: 'blazefang', name: 'Blazefang', element: 'ember', stage: 3, family: 'Ember Fox',
    lore: 'A fierce ember wolf whose blazing bite can mend its own wounds.',
    stats: { hp: 168, atk: 39, def: 18, spd: 21 },
    ability: A('Blazing Fang', 'A savage bite that heals 30% of damage dealt.', {
      cooldown: 3, power: 1.55, lifesteal: 0.3, effects: []
    }),
    art: {
      build: 'quad', pose: 'wolf',
      palette: { base: '#e94b2e', dark: '#821f18', light: '#ff9350', accent: '#ffcb45', glow: '#ff6b35', belly: '#ffb46b', eye: '#ffd166' },
      ears: 'wolf', tail: 'flame', mane: 'flame', fierce: true, spikes: 3, mark: 'cracks', horns: 'ember', cheek: false
    }
  },
  {
    id: 'infernox', name: 'Infernox', element: 'ember', stage: 4, family: 'Ember Fox',
    lore: 'The volcanic sovereign. Its roar awakens dormant mountains.',
    stats: { hp: 252, atk: 55, def: 27, spd: 24 },
    ability: A('Volcanic Roar', 'Engulfs all foes in fire and burns them for 3 turns.', {
      cooldown: 4, target: 'all', power: 0.85, effects: [{ type: 'burn', turns: 3, potency: 0.2 }]
    }),
    art: {
      build: 'quad', pose: 'drake',
      palette: { base: '#b83224', dark: '#4a1218', light: '#ff7b35', accent: '#ffc23d', glow: '#ff4d1f', belly: '#ff8c42', eye: '#ffe066' },
      ears: 'dragon', tail: 'drake', mane: 'inferno', fierce: true, spikes: 4, mark: 'lava', horns: 'crown', wings: 'bat', cheek: false
    }
  },

  // ── TIDE ──────────────────────────────────────────────────────────────
  {
    id: 'dripling', name: 'Dripling', element: 'tide', stage: 1, family: 'Tide Wyrm',
    lore: 'A bouncy brook sprite with gills that shimmer like stained glass.',
    stats: { hp: 74, atk: 12, def: 9, spd: 12 },
    ability: A('Bubble Burst', 'Blasts one foe and wraps itself in a bubble shield.', {
      cooldown: 3, power: 1.0, effects: [{ type: 'shieldSelf', potency: 0.16, turns: 2 }]
    }),
    art: {
      build: 'axolotl', pose: 'kit',
      palette: { base: '#55cdf5', dark: '#1f7fbb', light: '#b9f3ff', accent: '#ff9ecb', glow: '#6ee7ff', belly: '#d7fbff', eye: '#13324a' },
      tail: 'fin', crest: 'fin', fierce: false, mark: 'bubbles', cheek: true
    }
  },
  {
    id: 'aquafin', name: 'Aquafin', element: 'tide', stage: 2, family: 'Tide Wyrm',
    lore: 'A swift reef hunter that turns ocean currents into blades.',
    stats: { hp: 122, atk: 20, def: 14, spd: 16 },
    ability: A('Riptide', 'Crashes into a foe, lowering its attack for 2 turns.', {
      cooldown: 3, power: 1.3, effects: [{ type: 'atkDown', turns: 2, potency: 0.25 }]
    }),
    art: {
      build: 'shark', pose: 'kit',
      palette: { base: '#2d9ee0', dark: '#14558f', light: '#8fe8ff', accent: '#ffd166', glow: '#54d6ff', belly: '#e2fbff', eye: '#0b2436' },
      tail: 'shark', crest: 'fin', fierce: false, mark: 'gills', cheek: false
    }
  },
  {
    id: 'tidalisk', name: 'Tidalisk', element: 'tide', stage: 3, family: 'Tide Wyrm',
    lore: 'An ancient sea serpent that carries the tide in its coiled wake.',
    stats: { hp: 188, atk: 31, def: 23, spd: 19 },
    ability: A('Tidal Crash', 'Sweeps all foes and sends healing spray to its team.', {
      cooldown: 4, target: 'all', power: 0.9, effects: [{ type: 'healTeam', potency: 0.1 }]
    }),
    art: {
      build: 'serpent', pose: 'serpent',
      palette: { base: '#2f86d6', dark: '#133a75', light: '#9ce6ff', accent: '#5eead4', glow: '#38bdf8', belly: '#c7f5ff', eye: '#062a3d' },
      tail: 'fin', crest: 'coral', fierce: true, mark: 'scales', horns: 'coral', cheek: false
    }
  },
  {
    id: 'leviathan', name: 'Leviathan', element: 'tide', stage: 4, family: 'Tide Wyrm',
    lore: 'Ruler of the abyss. Sailors speak of its maw in frightened whispers.',
    stats: { hp: 282, atk: 45, def: 33, spd: 22 },
    ability: A('Abyssal Maw', 'A crushing bite that stuns the target for a turn.', {
      cooldown: 4, power: 1.85, effects: [{ type: 'stun', turns: 1 }]
    }),
    art: {
      build: 'quad', pose: 'drake',
      palette: { base: '#2367b8', dark: '#0b2454', light: '#75dbff', accent: '#5eead4', glow: '#2fb6ff', belly: '#a9efff', eye: '#9dfff0' },
      ears: 'dragon', tail: 'drake', mane: 'wave', fierce: true, spikes: 4, mark: 'scales', horns: 'crown', wings: 'water', cheek: false
    }
  },

  // ── VERDANT ───────────────────────────────────────────────────────────
  {
    id: 'sproutle', name: 'Sproutle', element: 'verdant', stage: 1, family: 'Verdant Guardian',
    lore: 'A curious seedling that hums softly to the morning sun.',
    stats: { hp: 72, atk: 12, def: 10, spd: 10 },
    ability: A('Vine Whip', 'Lashes a foe with a thorny vine and poisons it.', {
      cooldown: 3, power: 1.1, effects: [{ type: 'poison', turns: 3, potency: 0.22 }]
    }),
    art: {
      build: 'quad', pose: 'sprout',
      palette: { base: '#8ee58b', dark: '#309b55', light: '#d9ffb0', accent: '#ffe066', glow: '#8cf59e', belly: '#f2ffd6', eye: '#173a22' },
      ears: 'leaf', tail: 'leaf', mane: 'sprout', fierce: false, spikes: 0, mark: 'spots', cheek: true, sprout: true
    }
  },
  {
    id: 'thornkit', name: 'Thornkit', element: 'verdant', stage: 2, family: 'Verdant Guardian',
    lore: 'A prickly guardian that grows its armor from fallen leaves.',
    stats: { hp: 120, atk: 20, def: 16, spd: 14 },
    ability: A('Thorn Guard', 'Shields the team and swipes a foe with briars.', {
      cooldown: 3, power: 0.85, effects: [{ type: 'shieldTeam', potency: 0.14, turns: 2 }]
    }),
    art: {
      build: 'quad', pose: 'kit',
      palette: { base: '#63c96f', dark: '#1e6e44', light: '#c9f77c', accent: '#ffb84d', glow: '#75e88a', belly: '#e8ffc9', eye: '#12331e' },
      ears: 'leaf', tail: 'leaf', mane: 'leaf', fierce: false, spikes: 3, mark: 'spots', cheek: true
    }
  },
  {
    id: 'mossbeast', name: 'Mossbeast', element: 'verdant', stage: 3, family: 'Verdant Guardian',
    lore: 'A gentle giant whose footsteps bloom into wildflowers.',
    stats: { hp: 195, atk: 31, def: 25, spd: 16 },
    ability: A('Bloom Burst', 'Heals the whole team and cleanses all ailments.', {
      cooldown: 4, target: 'team', power: 0, effects: [{ type: 'healTeam', potency: 0.28 }, { type: 'cleanseTeam' }]
    }),
    art: {
      build: 'bear', pose: 'bear',
      palette: { base: '#4fae60', dark: '#1c5836', light: '#a7e878', accent: '#ffcf6b', glow: '#7ce495', belly: '#e6f8bd', eye: '#fff3a3', moss: '#2f7d46' },
      ears: 'bear', tail: 'leaf', mane: 'moss', fierce: false, spikes: 2, mark: 'moss', horns: 'antler-small', cheek: false
    }
  },
  {
    id: 'sylvagon', name: 'Sylvagon', element: 'verdant', stage: 4, family: 'Verdant Guardian',
    lore: "The forest's ancient heart, crowned in living antlers.",
    stats: { hp: 290, atk: 44, def: 36, spd: 20 },
    ability: A('Ancient Roots', 'Roots erupt under all foes, poisoning them for 2 turns.', {
      cooldown: 4, target: 'all', power: 1.15, effects: [{ type: 'poison', turns: 2, potency: 0.16 }]
    }),
    art: {
      build: 'stag', pose: 'stag',
      palette: { base: '#3c9c53', dark: '#12472c', light: '#a8e76b', accent: '#ffd166', glow: '#6ee7a0', belly: '#e5f8b9', eye: '#f8ffb0' },
      ears: 'stag', tail: 'leaf', mane: 'moss', fierce: true, spikes: 3, mark: 'moss', horns: 'antler', wings: 'leaf', cheek: false
    }
  },

  // ── STORM ─────────────────────────────────────────────────────────────
  {
    id: 'sparkwing', name: 'Sparkwing', element: 'storm', stage: 1, family: 'Storm Flock',
    lore: 'A hyperactive storm bat that crackles when it giggles.',
    stats: { hp: 60, atk: 14, def: 7, spd: 18 },
    ability: A('Static Peck', 'A quick zap with a 30% chance to stun.', {
      cooldown: 3, power: 1.15, effects: [{ type: 'stun', turns: 1, chance: 0.3 }]
    }),
    art: {
      build: 'bird', pose: 'bat',
      palette: { base: '#ffd84d', dark: '#c77a10', light: '#fff6b0', accent: '#8b5cf6', glow: '#ffe066', belly: '#fff4c2', eye: '#3b2a06' },
      wings: 'bat-small', crest: 'spark', tail: 'spark', fierce: false, mark: 'zigzag', cheek: true
    }
  },
  {
    id: 'voltbeak', name: 'Voltbeak', element: 'storm', stage: 2, family: 'Storm Flock',
    lore: 'A sky raider that dives on bolts of its own making.',
    stats: { hp: 100, atk: 23, def: 11, spd: 23 },
    ability: A('Thunder Dive', 'A high-speed dive with a boosted critical chance.', {
      cooldown: 3, power: 1.45, critBonus: 0.2, effects: []
    }),
    art: {
      build: 'bird', pose: 'bird',
      palette: { base: '#f7c948', dark: '#b56a10', light: '#fff2a8', accent: '#4cc9f0', glow: '#ffe45c', belly: '#fff8d6', eye: '#2b1e05' },
      wings: 'feather', crest: 'bolt', tail: 'spark', fierce: false, mark: 'zigzag', cheek: true
    }
  },
  {
    id: 'thundrix', name: 'Thundrix', element: 'storm', stage: 3, family: 'Storm Flock',
    lore: 'A thunder griffin whose wingbeats echo across the peaks.',
    stats: { hp: 160, atk: 36, def: 17, spd: 28 },
    ability: A('Chain Lightning', 'Zaps all foes and supercharges team speed.', {
      cooldown: 4, target: 'all', power: 1.0, effects: [{ type: 'spdUpTeam', turns: 3, potency: 0.25 }]
    }),
    art: {
      build: 'bird', pose: 'griffin',
      palette: { base: '#f2b705', dark: '#8a4d0b', light: '#fff08a', accent: '#7c3aed', glow: '#ffd93d', belly: '#fff6c9', eye: '#5b21b6' },
      wings: 'feather-big', crest: 'bolt', tail: 'thunder', fierce: true, mark: 'zigzag', horns: 'spark', cheek: false
    }
  },
  {
    id: 'tempestrix', name: 'Tempestrix', element: 'storm', stage: 4, family: 'Storm Flock',
    lore: 'The storm incarnate. Its feathers are woven from lightning.',
    stats: { hp: 238, atk: 51, def: 25, spd: 33 },
    ability: A('Maelstrom', 'A thunderous strike that stuns for a full turn.', {
      cooldown: 4, power: 1.6, effects: [{ type: 'stun', turns: 1 }]
    }),
    art: {
      build: 'quad', pose: 'drake',
      palette: { base: '#e3a814', dark: '#613b0c', light: '#fff29a', accent: '#8b5cf6', glow: '#ffd93d', belly: '#fff3bd', eye: '#7c3aed' },
      ears: 'dragon', tail: 'thunder', mane: 'storm', fierce: true, spikes: 4, mark: 'zigzag', horns: 'crown', wings: 'storm', cheek: false
    }
  },

  // ── UMBRA ─────────────────────────────────────────────────────────────
  {
    id: 'wispy', name: 'Wispy', element: 'umbra', stage: 1, family: 'Umbra Court',
    lore: 'A shy little flame that drifted away from the spirit world.',
    stats: { hp: 66, atk: 16, def: 8, spd: 15 },
    ability: A('Hex Flame', 'Burns a foe and curses it to deal less damage.', {
      cooldown: 3, power: 1.05, effects: [{ type: 'curse', turns: 3, potency: 0.2 }]
    }),
    art: {
      build: 'wisp', pose: 'wisp',
      palette: { base: '#b07cff', dark: '#4c1d95', light: '#e9d5ff', accent: '#67e8f9', glow: '#c084fc', belly: '#f5e8ff', eye: '#2e1065' },
      tail: 'wisp', crest: 'wisp', fierce: false, mark: 'rune', cheek: true
    }
  },
  {
    id: 'shadepaw', name: 'Shadepaw', element: 'umbra', stage: 2, family: 'Umbra Court',
    lore: 'A nimble shadow cat that hunts between moonbeams.',
    stats: { hp: 108, atk: 26, def: 12, spd: 20 },
    ability: A('Night Slash', 'A shadow claw that ignores 35% of defense.', {
      cooldown: 3, power: 1.45, ignoreDef: 0.35, effects: []
    }),
    art: {
      build: 'quad', pose: 'cat',
      palette: { base: '#7c5cbf', dark: '#2e1065', light: '#c4b5fd', accent: '#67e8f9', glow: '#a78bfa', belly: '#d8ccff', eye: '#7ff5ff' },
      ears: 'cat', tail: 'wisp', mane: 'wisp', fierce: false, spikes: 1, mark: 'rune', horns: 'crescent', cheek: false
    }
  },
  {
    id: 'nocturne', name: 'Nocturne', element: 'umbra', stage: 3, family: 'Umbra Court',
    lore: 'A silent moon owl that collects secrets in its feathers.',
    stats: { hp: 170, atk: 38, def: 19, spd: 24 },
    ability: A('Soul Siphon', 'Drains a foe and heals for 70% of the damage dealt.', {
      cooldown: 3, power: 1.2, lifesteal: 0.7, effects: []
    }),
    art: {
      build: 'owl', pose: 'owl',
      palette: { base: '#6d4aa8', dark: '#1e0b3d', light: '#c4b5fd', accent: '#67e8f9', glow: '#a855f7', belly: '#e2d6ff', eye: '#a5f3fc' },
      wings: 'owl', crest: 'moon', tail: 'wisp', fierce: true, mark: 'stars', horns: 'crescent', cheek: false
    }
  },
  {
    id: 'umbravoid', name: 'Umbravoid', element: 'umbra', stage: 4, family: 'Umbra Court',
    lore: 'The eclipse dragon. It swallows light and returns it as starlight.',
    stats: { hp: 248, atk: 54, def: 28, spd: 27 },
    ability: A('Event Horizon', 'Devours all foes for 35% lifesteal.', {
      cooldown: 4, target: 'all', power: 1.05, lifesteal: 0.35, effects: []
    }),
    art: {
      build: 'quad', pose: 'drake',
      palette: { base: '#55308f', dark: '#16032e', light: '#b18aff', accent: '#67e8f9', glow: '#a855f7', belly: '#2a1250', eye: '#7ff5ff' },
      ears: 'dragon', tail: 'void', mane: 'void', fierce: true, spikes: 4, mark: 'stars', horns: 'void', wings: 'void', cheek: false
    }
  }
]

export const MONSTER_BY_ID = Object.fromEntries(MONSTERS.map(m => [m.id, m]))

export const FAMILIES = ELEMENT_ORDER.map(element => ({
  element,
  monsters: MONSTERS.filter(m => m.element === element).sort((a, b) => a.stage - b.stage)
}))

export function evolutionLine(monster) {
  return MONSTERS.filter(m => m.family === monster.family).sort((a, b) => a.stage - b.stage)
}

export function nextEvolution(monster) {
  return MONSTERS.find(m => m.family === monster.family && m.stage === monster.stage + 1) || null
}

export function previousEvolution(monster) {
  return MONSTERS.find(m => m.family === monster.family && m.stage === monster.stage - 1) || null
}

// Campaign — 12 encounters with a steady difficulty curve and four bosses.
export const CAMPAIGN = [
  {
    id: 1, name: 'Sunny Glade', subtitle: 'First steps', theme: 'glade',
    enemies: [{ species: 'cindlet', level: 1 }, { species: 'sproutle', level: 1 }],
    rewards: { coins: 55, gems: 2, xp: 30, egg: 'common' }
  },
  {
    id: 2, name: 'Mossy Path', subtitle: 'A rustle in the fern', theme: 'glade',
    enemies: [{ species: 'sproutle', level: 2 }, { species: 'dripling', level: 2 }, { species: 'sparkwing', level: 1 }],
    rewards: { coins: 75, gems: 2, xp: 42, egg: 'common' }
  },
  {
    id: 3, name: 'Thorn Den', subtitle: 'Boss • Bramble Warden', theme: 'glade', boss: true,
    enemies: [{ species: 'thornkit', level: 3, boss: true }, { species: 'sproutle', level: 2 }, { species: 'sproutle', level: 2 }],
    rewards: { coins: 120, gems: 4, xp: 65, egg: 'common' }
  },
  {
    id: 4, name: 'Crystal Brook', subtitle: 'Ripples of power', theme: 'brook',
    enemies: [{ species: 'dripling', level: 3 }, { species: 'aquafin', level: 3 }, { species: 'dripling', level: 3 }],
    rewards: { coins: 105, gems: 3, xp: 58, egg: 'wild' }
  },
  {
    id: 5, name: 'Storm Ridge', subtitle: 'Charge in the air', theme: 'ridge',
    enemies: [{ species: 'sparkwing', level: 4 }, { species: 'voltbeak', level: 4 }, { species: 'sparkwing', level: 3 }],
    rewards: { coins: 125, gems: 3, xp: 72, egg: 'wild' }
  },
  {
    id: 6, name: 'Sky Roost', subtitle: 'Boss • Thunderlord', theme: 'ridge', boss: true,
    enemies: [{ species: 'thundrix', level: 6, boss: true }, { species: 'voltbeak', level: 5 }, { species: 'sparkwing', level: 5 }],
    rewards: { coins: 180, gems: 5, xp: 100, egg: 'wild' }
  },
  {
    id: 7, name: 'Ashen Hollow', subtitle: 'The embers remember', theme: 'ash',
    enemies: [{ species: 'flarepup', level: 7 }, { species: 'cindlet', level: 6 }, { species: 'flarepup', level: 6 }],
    rewards: { coins: 155, gems: 4, xp: 88, egg: 'wild' }
  },
  {
    id: 8, name: 'Moonlit Ruins', subtitle: 'Whispers in the dark', theme: 'ruins',
    enemies: [{ species: 'shadepaw', level: 9 }, { species: 'wispy', level: 8 }, { species: 'shadepaw', level: 8 }],
    rewards: { coins: 175, gems: 4, xp: 104, egg: 'wild' }
  },
  {
    id: 9, name: 'Obsidian Gate', subtitle: 'Boss • Court of Shadows', theme: 'ruins', boss: true,
    enemies: [{ species: 'nocturne', level: 11, boss: true }, { species: 'shadepaw', level: 10 }, { species: 'wispy', level: 10 }],
    rewards: { coins: 240, gems: 7, xp: 140, egg: 'radiant' }
  },
  {
    id: 10, name: 'Frostfire Peak', subtitle: 'Where flame meets frost', theme: 'peak',
    enemies: [{ species: 'blazefang', level: 13 }, { species: 'aquafin', level: 12 }, { species: 'blazefang', level: 13 }],
    rewards: { coins: 220, gems: 5, xp: 130, egg: 'radiant' }
  },
  {
    id: 11, name: 'The Deep Coil', subtitle: 'Something stirs below', theme: 'brook',
    enemies: [{ species: 'tidalisk', level: 15 }, { species: 'mossbeast', level: 14 }, { species: 'thundrix', level: 14 }],
    rewards: { coins: 260, gems: 6, xp: 155, egg: 'radiant' }
  },
  {
    id: 12, name: 'Eclipse Throne', subtitle: 'Boss • The Void Sovereign', theme: 'eclipse', boss: true,
    enemies: [{ species: 'umbravoid', level: 18, boss: true }, { species: 'infernox', level: 16 }, { species: 'tempestrix', level: 16 }],
    rewards: { coins: 500, gems: 15, xp: 260, egg: 'radiant' }
  }
]

export const THEMES = {
  glade: { name: 'Verdant Glade', sky: ['#0b3b3c', '#155e4e', '#2f8f5b'], ground: '#1d6b46', glow: '#7ce495' },
  brook: { name: 'Crystal Brook', sky: ['#072b4a', '#0e5a78', '#1c9bb0'], ground: '#1b6b78', glow: '#6ee7ff' },
  ridge: { name: 'Storm Ridge', sky: ['#1a1a3d', '#3b2a63', '#6d4b8a'], ground: '#39406b', glow: '#ffd93d' },
  ash: { name: 'Ashen Hollow', sky: ['#2b1017', '#5c1f1f', '#8c3a22'], ground: '#56241d', glow: '#ff8a4a' },
  ruins: { name: 'Moonlit Ruins', sky: ['#140d2e', '#2d1b5c', '#4c2b7a'], ground: '#2b1f4a', glow: '#c084fc' },
  peak: { name: 'Frostfire Peak', sky: ['#0b1c35', '#2c2a5e', '#6b3a72'], ground: '#3a3558', glow: '#a5f3fc' },
  eclipse: { name: 'Eclipse Throne', sky: ['#08040f', '#1c0b33', '#3b1257'], ground: '#1c1033', glow: '#c084fc' }
}

// Egg pools used by summons and battle rewards.
export const EGGS = {
  common: {
    id: 'common', name: 'Forest Egg', price: 120, currency: 'coins', color: '#7ce495',
    desc: 'A warm speckled egg. Usually holds a stage 1 or 2 monster.',
    pool: [{ stage: 1, weight: 68 }, { stage: 2, weight: 32 }]
  },
  wild: {
    id: 'wild', name: 'Wild Egg', price: 340, currency: 'coins', color: '#ffd166',
    desc: 'Crackling with wild energy. Stage 2 and 3 monsters are common.',
    pool: [{ stage: 2, weight: 70 }, { stage: 3, weight: 30 }]
  },
  radiant: {
    id: 'radiant', name: 'Radiant Egg', price: 40, currency: 'gems', color: '#c084fc',
    desc: 'A rare star-shelled egg. Strong evolutions await inside.',
    pool: [{ stage: 2, weight: 20 }, { stage: 3, weight: 58 }, { stage: 4, weight: 22 }]
  }
}

export const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD' }

export const XP_FOR_LEVEL = level => Math.round(48 + 26 * Math.pow(level, 1.45))
export const MAX_LEVEL = 30

export function levelPower(level, stars = 0) {
  return (1 + 0.082 * (level - 1)) * (1 + 0.14 * stars)
}

export function statsFor(monster, level = 1, stars = 0) {
  const mult = levelPower(level, stars)
  return {
    hp: Math.round(monster.stats.hp * mult),
    atk: Math.round(monster.stats.atk * mult),
    def: Math.round(monster.stats.def * mult),
    spd: Math.round(monster.stats.spd * mult)
  }
}

export function powerOf(monster, level = 1, stars = 0) {
  const s = statsFor(monster, level, stars)
  return Math.round(s.hp * 0.5 + s.atk * 4.4 + s.def * 3.1 + s.spd * 2.2)
}
