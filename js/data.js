/* ============================================================
   LAST KINGDOM – static game data
   Tower defense framework (plain scripts, shared global scope)
   ============================================================ */

const WORLD = {
  W: 480,               // logical canvas width
  H: 640,               // logical canvas height
  BASE_HP: 100,
  BASE_POS: { x: 240, y: 600 },
  GOLD_START: 150,
  MAX_WAVES: 12,
};

const CELL = 40; // placement grid cell size

const MAPS = {
  fords: {
    key: "fords",
    name: "The Fords",
    tagline: "A narrow crossing beside the rushing river.",
    path: [
      [240, 560], [70, 560], [70, 300], [410, 300], [410, 560], [240, 600],
    ],
  },
  forest: {
    key: "forest",
    name: "The Old Forest",
    tagline: "Roots and fog swallow the old roads.",
    path: [
      [240, 540], [60, 540], [60, 300], [150, 210], [330, 210],
      [330, 420], [240, 600],
    ],
  },
  citadel: {
    key: "citadel",
    name: "The Black Citadel",
    tagline: "The dark keep rises at the heart of the land.",
    path: [
      [240, 590], [60, 590], [60, 180], [420, 180], [420, 560], [240, 600],
    ],
  },
};

const BOSS_WAVES = [5, 10, 12];

const ENEMY_TYPES = {
  militia:    { name: "Militia",    hp: 34,  speed: 46, dmg: 7,  gold: 12, radius: 12, color: "#8fa3b8", dark: "#5d6b7c" },
  spearman:   { name: "Spearman",   hp: 72,  speed: 33, dmg: 11, gold: 20, radius: 14, color: "#7d8b99", dark: "#4f5b68" },
  knight:     { name: "Knight",     hp: 145, speed: 25, dmg: 16, gold: 38, radius: 17, color: "#7488a0", dark: "#46536a" },
  brute:      { name: "Brute",      hp: 320, speed: 15, dmg: 26, gold: 80, radius: 24, color: "#a0522d", dark: "#6e3a20" },
  boss:       { name: "The Last King", hp: 1150, speed: 9, dmg: 42, gold: 320, radius: 38, color: "#6d2c52", dark: "#471a36" },
};

const TOWER_TYPES = {
  archer:   { name: "Archer",     icon: "🏹", cost: 60,  damage: 14, range: 135, fireRate: 0.85, radius: 13, projectile: "arrow",   color: "#b08968", dark: "#8a6248" },
  spear:   { name: "Spear Guard", icon: "🛡️", cost: 50, damage: 16, range: 46,  fireRate: 0.45, radius: 16, projectile: null,     color: "#d9a441", dark: "#a87c28" },
  mage:    { name: "Flame Acolyte", icon: "🔥", cost: 90, damage: 24, range: 145, fireRate: 0.80, radius: 14, projectile: "fire",   color: "#e63946", dark: "#b01f2e" },
  ballista: { name: "Ballista",  icon: "🎯", cost: 140, damage: 55, range: 180, fireRate: 2.6, radius: 18, projectile: "bolt",   color: "#8d99ae", dark: "#5f6b80" },
};

const UPGRADES = {
  archer: [
    { name: "Reinforced Arrows", desc: "+50% Damage", cost: 120, dmgMult: 1.5, rangeMult: 1.15 },
    { name: "Deadly Volley", desc: "+50% Damage · +35% Fire Rate · +15% Range", cost: 260, dmgMult: 1.5, rangeMult: 1.15, fireRateMult: 1.35 },
  ],
  spear: [
    { name: "Heavy Arms", desc: "+50% Damage · +15% Range", cost: 100, dmgMult: 1.5, rangeMult: 1.15 },
    { name: "Royal Guard", desc: "+50% Damage · +35% Fire Rate · +15% Range", cost: 220, dmgMult: 1.5, rangeMult: 1.15, fireRateMult: 1.35 },
  ],
  mage: [
    { name: "Inferno Seeds", desc: "+50% Damage · +15% Range", cost: 140, dmgMult: 1.5, rangeMult: 1.15 },
    { name: "Lord of Flames", desc: "+50% Damage · +35% Fire Rate · +15% Range", cost: 300, dmgMult: 1.5, rangeMult: 1.15, fireRateMult: 1.35 },
  ],
  ballista: [
    { name: "Heavy Bolt", desc: "+50% Damage · +15% Range", cost: 180, dmgMult: 1.5, rangeMult: 1.15 },
    { name: "Siege Mode", desc: "+50% Damage · +35% Fire Rate · +15% Range", cost: 380, dmgMult: 1.5, rangeMult: 1.15, fireRateMult: 1.35 },
  ],
};
