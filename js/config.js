export const TIME_SCALE = 6; // game minutes per real second — one day is four minutes
export const DAY_MINUTES = 1440;

export const TOOLS = [
  { id: 'axe', name: 'Axe', range: 64, arc: 1.55, dmg: 19, cd: 0.46, stamina: 6, melee: true },
  { id: 'spear', name: 'Spear', range: 90, arc: 0.8, dmg: 31, cd: 0.7, stamina: 9, melee: true },
  { id: 'bow', name: 'Bow', range: 540, arc: 0, dmg: 27, cd: 0.84, stamina: 5, melee: false }
];

export const RECIPES = [
  {
    id: 'arrows', name: 'Whittle Arrows', icon: 'arrow', qty: '×8',
    desc: 'Straight shafts, stone heads. The Hollowed are learning to count them.',
    cost: { wood: 2, stone: 1 }
  },
  {
    id: 'torch', name: 'Bind a Torch', icon: 'torch', qty: '×2',
    desc: 'Pitch and dry grass. The cairns need fire, and so will you.',
    cost: { wood: 2, fiber: 1 }
  },
  {
    id: 'snare', name: 'Twist a Snare', icon: 'trap', qty: '×2',
    desc: 'Braided fibre and a bent branch. Set it with Q. They will learn to read the ground.',
    cost: { wood: 3, fiber: 2 }
  },
  {
    id: 'campfire', name: 'Build a Campfire', icon: 'fire',
    desc: 'Warmth, light, and a place to cook. It leaves a scar on the ground.',
    cost: { wood: 6, stone: 5 }
  },
  {
    id: 'bandage', name: 'Pack a Bandage', icon: 'bandage', qty: '×2',
    desc: 'Moss, fibre, and a little luck. Used on its own when you are badly hurt.',
    cost: { fiber: 3, berry: 1 }
  },
  {
    id: 'cook', name: 'Cook Meat', icon: 'meat', qty: '×1',
    desc: 'Hold it over a fire. Raw meat keeps you alive, but not kindly.',
    cost: { meat: 1 }, needsFire: true
  },
  {
    id: 'cloak', name: 'Sew a Warm Cloak', icon: 'cloak',
    desc: 'Layered hide and moss. The cold finds you more slowly. Made once.',
    cost: { fiber: 6, meat: 2 }, once: true
  }
];

export const NPC_DEFS = [
  {
    id: 'maren', name: 'Maren', role: 'Hearthkeeper', initial: 'M', color: '#b56b47',
    hut: 0, spot: { x: -78, y: 54 },
    greet: [
      'Sit, if you have the manners for it. The fire is for everyone.',
      'You walk like someone the road has been chewing on.',
      'There is stew, but it is mostly turnip and memory.'
    ]
  },
  {
    id: 'ivo', name: 'Ivo', role: 'Hunter', initial: 'I', color: '#7f8c58',
    hut: 1, spot: { x: -148, y: -28 },
    greet: [
      'Quiet. The wood is listening.',
      'I counted your tracks this morning. You walk too straight.',
      'The deer are thin this year. So is everything else.'
    ]
  },
  {
    id: 'elsbeth', name: 'Elsbeth', role: 'Smith', initial: 'E', color: '#8a6a54',
    hut: 5, spot: { x: 126, y: 46 },
    greet: [
      'Steel remembers heat. So does this valley.',
      'Bring me wood and stone. I will show you what stays lit.',
      'Your axe edge is a disgrace. It will still cut.'
    ]
  },
  {
    id: 'sable', name: 'Sable', role: 'Bone-Reader', initial: 'S', color: '#8f80a0',
    hut: 4, spot: { x: -34, y: 146 },
    greet: [
      'I read what the valley wrote about you last night.',
      'The bones do not lie. They are simply not interested in being helpful.',
      'You have the look of someone keeping count.'
    ]
  },
  {
    id: 'orin', name: 'Orin', role: 'Child', initial: 'O', color: '#c3a06a',
    hut: 3, spot: { x: 44, y: -104 },
    greet: [
      'Did you see one? Up close? What colour are their eyes?',
      'Sable says the valley remembers. I think it just does not forget.',
      'I am not scared of the dark. I am scared of what walks in it.'
    ]
  }
];

export const ENEMY_NAMES = ['Hollowed', 'Hollowed', 'Hollowed', 'Gaunt One', 'Ash Walker'];

export const PHASES = {
  dawn: { label: 'DAWN', cls: 'dusk' },
  day: { label: 'DAY', cls: '' },
  dusk: { label: 'DUSK', cls: 'dusk' },
  night: { label: 'NIGHT', cls: 'night' }
};
