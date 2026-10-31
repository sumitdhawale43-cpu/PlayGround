// ── The Remembering — a valley that keeps score ─────────────────────────────
import {
  WORLD, DAY_SECONDS, BIOME, clamp, dist, angleDiff, inArc,
  RNG, hashString, seedLabel, smoothstep, pickName, formatClock,
} from './util.js';
import { World } from './world.js';
import { MemorySystem, DOCTRINES, causeLabel, legendTier } from './memory.js';
import {
  Player, Enemy, Animal, NPC, Projectile, Trap, createEnemy, createAnimal,
  damageEnemy, damageAnimal, moveEntity, burst,
} from './entities.js';
import { Renderer } from './render.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';

const SAVE_KEY = 'the-remembering-save-v1';

const RECIPES = [
  { id: 'bow', name: 'Hunting bow', desc: 'A yew stave and gut string. It comes with four arrows.', cost: { wood: 3, fiber: 2 }, once: true, action: 'Craft bow' },
  { id: 'arrows', name: 'Arrows ×5', desc: 'Fletched with grey feathers. The Hollow will learn to count them.', cost: { wood: 1, stone: 1 }, action: 'Fletch' },
  { id: 'torch', name: 'Torch', desc: 'Pitch and dry grass. Fire changes what the valley remembers.', cost: { wood: 1, fiber: 1 }, once: true, action: 'Light it' },
  { id: 'snare', name: 'Snare', desc: 'A wire loop and patience. Place it with tool 4.', cost: { wood: 2, fiber: 1 }, action: 'Twist one' },
  { id: 'bandage', name: 'Bandage', desc: 'Clean fibre, pressed tight. Restores 35 health when used.', cost: { fiber: 2 }, action: 'Wrap it' },
  { id: 'spear', name: 'Knapped spear', desc: 'A stone head lashed to your spear. +10 melee damage.', cost: { stone: 2, fiber: 1 }, once: true, action: 'Lash it' },
];

function nightAmount(t) {
  if (t >= 0.75 && t < 0.84) return smoothstep(0.75, 0.84, t);
  if (t >= 0.84 || t < 0.16) return 1;
  if (t >= 0.16 && t < 0.26) return 1 - smoothstep(0.16, 0.26, t);
  return 0;
}

function randomSeed() {
  return (Math.random() * 0xffffffff) >>> 0;
}

function parseSeed(value) {
  const s = String(value || '').trim();
  if (!s) return randomSeed();
  if (/^\d+$/.test(s)) return Number(s) >>> 0;
  return hashString(s.toUpperCase()) || randomSeed();
}

function tutorialQuest() {
  return {
    step: 0, eyebrow: 'WHISPERS', title: 'Gather what the valley offers',
    text: 'Four wood, two stone. Press E beside a tree or rock.',
    progress: '0 / 4 wood · 0 / 2 stone', wood: 0, stone: 0, target: null,
  };
}

function sandboxQuest() {
  return {
    step: 4, eyebrow: 'THE LEDGER', title: 'Live with what you have made',
    text: 'The Hollow are learning. Open the journal with J to see what the valley keeps.',
    progress: '', target: null,
  };
}

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.rawSave = this.readSave();
    this.seed = this.rawSave?.seed ?? randomSeed();
    this.memory = new MemorySystem(this.seed);
    if (this.rawSave?.memory) this.memory.load(this.rawSave.memory);
    this.world = new World(this.seed);
    this.applyMemoryToWorld();

    this.enemies = [];
    this.animals = [];
    this.npcs = [];
    this.projectiles = [];
    this.traps = [];
    this.corpses = [];
    this.particles = [];
    this.floats = [];
    this.burns = [];
    this.scout = null;

    const name = this.rawSave?.player?.name || this.makeName();
    this.player = new Player(this.world.spawn.x, this.world.spawn.y, name, 0);
    this.player.spearTier = 0;
    this.player.inv.bandage = 0;
    this.player.inv.cooked = 0;

    this.keys = new Set();
    this.touchMode = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.touchMove = { x: 0, y: 0 };
    this.mouseScreen = { x: window.innerWidth / 2 + 100, y: window.innerHeight / 2 };
    this.mouseWorld = { x: this.player.x + 100, y: this.player.y };

    this.state = 'title';
    this.paused = true;
    this.activePanel = null;
    this.activeNpc = null;
    this.dialogueOptions = [];
    this.started = false;
    this.muted = false;
    this.weather = 'clear';
    this.weatherTimer = 90;
    this.dayFraction = 0.31;
    this.nightFactor = 0;
    this.nightRecorded = false;
    this.quest = tutorialQuest();
    this.runStartSeq = 0;
    this.openedChests = new Set();
    this.gatheredTypes = new Set();
    this.usedShrines = new Set();
    this.warnedRegions = new Set();
    this.huntedRegions = new Set();
    this.shakeTime = 0;
    this.playerMoving = false;
    this.interactTarget = null;
    this.spawnTimer = 22;
    this.revengeTimer = 0;
    this.saveTimer = 0;
    this.revealTimer = 0;
    this.hudTimer = 0;
    this.audioMoodTimer = 0;
    this.elapsed = 0;
    this.lastRegion = -1;
    this.deathCause = 'the valley';
    this.rng = new RNG(this.seed ^ 0x6d2b79f5);

    this.ui = new UI(this);
    this.audio = new AudioEngine();
    this.renderer = new Renderer(this.canvas, this);
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.mouseScreen.x = Math.min(this.mouseScreen.x, window.innerWidth);
      this.mouseScreen.y = Math.min(this.mouseScreen.y, window.innerHeight);
      this.updateMouseWorld();
    });
    this.ui.setTouch(this.touchMode);
    this.ui.minimapSeed = null;
    const seedEl = document.getElementById('minimap-seed');
    if (seedEl) seedEl.textContent = seedLabel(this.seed);

    if (this.rawSave) this.restoreSave(this.rawSave);
    else this.startFreshRun();

    this.spawnPopulation();
    if (this.quest.step === 2) this.spawnScout();

    this.ui.showTitle({
      hasSave: !!this.rawSave,
      seed: this.seed,
      dead: this.rawSave && this.rawSave.alive === false,
    });
    this.ui.showHUD(false);
    this.bindInput();
    this.bindTouch();

    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  makeName() {
    const used = new Set(this.memory.dead.map(d => d.name));
    const takenFirsts = new Set();
    for (const d of this.memory.dead) takenFirsts.add(d.name.split(' ')[0]);
    for (const s of this.world.settlements) {
      for (const spot of (s.npcSpots || [])) {
        used.add(spot.name);
        takenFirsts.add(spot.name.split(' ')[0]);
      }
    }
    for (const n of this.npcs) {
      used.add(n.name);
      takenFirsts.add(n.name.split(' ')[0]);
    }
    const rng = new RNG(this.seed ^ 0x9e3779b9);
    for (let i = 0; i < 40; i++) {
      const name = pickName(rng, used);
      if (!takenFirsts.has(name.split(' ')[0])) return name;
    }
    return pickName(rng, used);
  }

  applyMemoryToWorld() {
    for (const region of this.world.regions) {
      const st = this.memory.regionStates(region.id);
      region.states = [...st];
      region.heat = this.memory.heat(region.id);
      region.discovered = this.memory.ensureRegion(region.id).visits > 0;
    }
  }

  readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.seed) return null;
      return data;
    } catch { return null; }
  }

  restoreSave(data) {
    const p = data.player || {};
    this.player.name = p.name || this.player.name;
    this.player.legacy = p.legacy || 0;
    this.player.maxHp = p.maxHp || this.player.maxHp;
    this.player.hp = p.hp ?? this.player.maxHp;
    this.player.stam = p.stam ?? 100;
    this.player.hunger = p.hunger ?? 90;
    this.player.thirst = p.thirst ?? 88;
    this.player.warmth = p.warmth ?? 90;
    this.player.inv = { ...this.player.inv, ...(p.inv || {}) };
    this.player.arrows = p.arrows || 0;
    this.player.snares = p.snares || 0;
    this.player.tools = p.tools || this.player.tools;
    this.player.tool = p.tool || 0;
    this.player.spearTier = p.spearTier || 0;
    if (p.x !== undefined && this.world.canWalk(p.x, p.y, 12)) {
      this.player.x = p.x; this.player.y = p.y;
    }
    this.dayFraction = data.dayFraction ?? 0.31;
    this.weather = data.weather || 'clear';
    this.weatherTimer = data.weatherTimer || 90;
    this.nightFactor = nightAmount(this.dayFraction);
    this.memory.time = this.dayFraction;
    this.openedChests = new Set(data.openedChests || []);
    this.gatheredTypes = new Set(data.gatheredTypes || []);
    this.usedShrines = new Set(data.usedShrines || []);
    this.quest = data.quest || sandboxQuest();
    this.runStartSeq = data.runStartSeq ?? this.memory.seq;
    this.saveAlive = data.alive !== false;
    this.player.dead = !this.saveAlive;
    this.memory.characterName = this.player.name;
    if (this.quest.step >= 4) this.quest = sandboxQuest();
  }

  startFreshRun() {
    this.runStartSeq = this.memory.seq;
    this.memory.characterName = this.player.name;
    this.memory.day = this.memory.day || 1;
    this.memory.time = this.dayFraction;
    this.quest = tutorialQuest();
    const region = this.world.regionAt(this.player.x, this.player.y);
    this.memory.record({
      type: 'memory',
      text: `You woke at the edge of Hearthcamp with nothing but a name.`,
      region: region.name,
      weight: 1,
    });
    this.memory.ensureRegion(region.id).visits++;
    this.memory.ensureRegion(region.id).discovered = true;
    this.lastRegion = region.id;
  }

  spawnPopulation() {
    this.npcs = [];
    this.animals = [];
    this.enemies = [];
    this.scout = null;
    let id = 0;
    for (const poi of this.world.pois) {
      if (!poi.npcSpots) continue;
      for (const spot of poi.npcSpots) {
        const x = this.world.canWalk(spot.x, spot.y, 10) ? spot.x : poi.x;
        const y = this.world.canWalk(spot.x, spot.y, 10) ? spot.y : poi.y;
        this.npcs.push({
          kind: 'npc', id: ++id, name: spot.name, role: spot.role,
          x, y, home: { x, y }, r: 10, region: poi.region, poi: poi.id,
          face: this.rng.range(0, 6.28), phase: this.rng.range(0, 6.28),
          time: 0, wanderT: this.rng.range(1, 5), tx: x, ty: y, aware: false,
        });
      }
    }
    const animalKinds = ['deer', 'deer', 'rabbit', 'rabbit', 'boar'];
    for (let i = 0; i < 28; i++) {
      for (let tries = 0; tries < 30; tries++) {
        const x = this.rng.range(140, WORLD - 140), y = this.rng.range(140, WORLD - 140);
        if (!this.world.canWalk(x, y, 12)) continue;
        if (this.world.pois.some(p => dist(p.x, p.y, x, y) < 170)) continue;
        if (dist(x, y, this.player.x, this.player.y) < 260) continue;
        this.animals.push(createAnimal(this, this.rng.pick(animalKinds), x, y));
        break;
      }
    }
    for (const poi of this.world.pois) {
      if (poi.type !== 'ruin') continue;
      for (let i = 0; i < 2; i++) {
        const x = poi.x + this.rng.range(-80, 80), y = poi.y + this.rng.range(-70, 70);
        if (!this.world.canWalk(x, y, 12)) continue;
        this.enemies.push(createEnemy(this, 'raider', x, y, { fromRuin: true }));
      }
      const ax = poi.x + this.rng.range(-60, 60), ay = poi.y + this.rng.range(-60, 60);
      if (this.world.canWalk(ax, ay, 12)) this.enemies.push(createEnemy(this, 'archer', ax, ay, { fromRuin: true }));
    }
    for (let i = 0; i < 7; i++) {
      for (let tries = 0; tries < 30; tries++) {
        const x = this.rng.range(160, WORLD - 160), y = this.rng.range(160, WORLD - 160);
        if (!this.world.canWalk(x, y, 12)) continue;
        if (this.world.pois.some(p => dist(p.x, p.y, x, y) < 200)) continue;
        if (dist(x, y, this.player.x, this.player.y) < 520) continue;
        this.enemies.push(createEnemy(this, 'wolf', x, y));
        break;
      }
    }
    for (let i = 0; i < 2; i++) {
      const x = this.rng.range(300, WORLD - 300), y = this.rng.range(300, WORLD - 300);
      if (this.world.canWalk(x, y, 20) && !this.world.pois.some(p => dist(p.x, p.y, x, y) < 240)) {
        this.enemies.push(createEnemy(this, 'bear', x, y));
      }
    }
  }

  spawnScout() {
    if (this.scout && !this.scout.dead) return;
    let sx = this.player.x + 430, sy = this.player.y;
    for (let i = 0; i < 60; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(360, 480);
      const x = this.player.x + Math.cos(a) * r;
      const y = this.player.y + Math.sin(a) * r;
      if (this.world.canWalk(x, y, 14)) { sx = x; sy = y; break; }
    }
    const e = createEnemy(this, 'raider', sx, sy);
    e.scout = true;
    e.label = 'Hollow scout';
    e.hp = 42; e.maxHp = 42;
    e.home = { x: sx, y: sy };
    this.enemies.push(e);
    this.scout = e;
    this.quest.target = { x: e.x, y: e.y, label: 'Hollow scout' };
  }

  // ── input ──────────────────────────────────────────────────────────────────
  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (this.state === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') this.enterWorld();
        return;
      }
      if (this.state === 'dead') {
        if (e.code === 'Enter') this.respawn();
        return;
      }
      if (this.activePanel) {
        if (e.code === 'Escape') this.closePanels();
        if (e.code === 'KeyJ' && this.activePanel === 'journal') this.closePanels();
        if (e.code === 'KeyC' && this.activePanel === 'craft') this.closePanels();
        return;
      }
      if (e.code === 'Escape') { this.togglePanel('pause'); return; }
      if (e.code === 'KeyJ') { this.togglePanel('journal'); return; }
      if (e.code === 'KeyC') { this.togglePanel('craft'); return; }
      if (e.code === 'KeyM') { this.toggleMute(); return; }
      if (this.paused) return;
      if (e.code === 'KeyE') this.interact();
      else if (e.code === 'KeyQ') this.eat();
      else if (e.code === 'KeyF') this.drink();
      else if (e.code === 'Space') this.dodge();
      else if (e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 4) this.selectTool(n - 1);
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseScreen.x = e.clientX;
      this.mouseScreen.y = e.clientY;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (this.state === 'playing' && !this.paused && !this.activePanel) this.attack();
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cycleTool(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.keys.clear();
        if (this.state === 'playing' && !this.paused) this.togglePanel('pause');
        this.save();
      }
    });
    window.addEventListener('pagehide', () => this.save());
  }

  bindTouch() {
    const joy = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    if (!joy) return;
    let active = null;
    const update = (e) => {
      const r = joy.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const max = r.width * 0.36;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const norm = Math.min(1, d / max);
      const nd = Math.hypot(dx, dy) || 1;
      this.touchMove.x = (dx / nd) * norm;
      this.touchMove.y = (dy / nd) * norm;
    };
    joy.addEventListener('pointerdown', (e) => {
      active = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      update(e);
      e.preventDefault();
    });
    joy.addEventListener('pointermove', (e) => {
      if (active === e.pointerId) { update(e); e.preventDefault(); }
    });
    const end = (e) => {
      if (active !== e.pointerId) return;
      active = null;
      knob.style.transform = '';
      this.touchMove.x = 0; this.touchMove.y = 0;
    };
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);

    document.querySelectorAll('[data-touch]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.dataset.touch;
        if (this.state !== 'playing' || this.paused) return;
        if (action === 'attack') this.attack();
        else if (action === 'interact') this.interact();
        else if (action === 'dodge') this.dodge();
        else if (action === 'tool') this.cycleTool(1);
        else if (action === 'journal') this.togglePanel('journal');
      });
    });
  }

  // ── loop ───────────────────────────────────────────────────────────────────
  loop(now) {
    const dt = Math.min(0.05, Math.max(0.0001, (now - this.last) / 1000));
    this.last = now;
    if (this.state === 'playing' && !this.paused && !this.activePanel) this.update(dt);
    this.renderer.draw(dt);
    this.ui.update(dt, this);
    requestAnimationFrame((t) => this.loop(t));
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────
  enterWorld() {
    this.audio.init();
    this.ui.hideTitle();
    this.ui.showHUD(true);
    this.started = true;
    if (this.rawSave && this.rawSave.alive === false) {
      this.state = 'dead';
      this.paused = true;
      this.showDeathForLast();
      return;
    }
    this.state = 'playing';
    this.paused = false;
    this.audio.setMood(this.nightFactor, this.weather);
    this.save();
    if (this.memory.entries.length <= 2) {
      setTimeout(() => this.ui.toast('The valley is listening. Everything you do becomes part of it.', 'memory', 6000), 900);
    }
  }

  newWorldFromTitle() {
    const input = document.getElementById('seed-input')?.value;
    const seed = parseSeed(input);
    if (this.rawSave && !window.confirm('Abandon this valley? Its ledger will be lost, and the Hollow will forget you.')) return;
    this.startNewWorld(seed);
  }

  confirmNewWorld() {
    if (!window.confirm('Abandon this valley? Its ledger will be lost, and the Hollow will forget you.')) return;
    this.startNewWorld(randomSeed());
  }

  startNewWorld(seed) {
    this.seed = seed >>> 0;
    this.memory = new MemorySystem(this.seed);
    this.world = new World(this.seed);
    this.player = new Player(this.world.spawn.x, this.world.spawn.y, this.makeName(), 0);
    this.player.spearTier = 0;
    this.player.inv.bandage = 0;
    this.player.inv.cooked = 0;
    this.enemies = []; this.animals = []; this.npcs = [];
    this.projectiles = []; this.traps = []; this.corpses = [];
    this.particles = []; this.floats = []; this.burns = [];
    this.scout = null;
    this.openedChests = new Set();
    this.gatheredTypes = new Set();
    this.usedShrines = new Set();
    this.warnedRegions = new Set();
    this.huntedRegions = new Set();
    this.dayFraction = 0.31;
    this.nightFactor = 0;
    this.nightActive = false;
    this.nightRecorded = false;
    this.weather = 'clear';
    this.weatherTimer = 90;
    this.spawnTimer = 22;
    this.revengeTimer = 0;
    this.quest = tutorialQuest();
    this.lastRegion = -1;
    this.rng = new RNG(this.seed ^ 0x6d2b79f5);
    this.applyMemoryToWorld();
    this.spawnPopulation();
    this.startFreshRun();
    this.renderer.game = this;
    this.renderer.rebuild();
    this.renderer.initAmbient();
    this.renderer.cam.x = this.player.x;
    this.renderer.cam.y = this.player.y;
    const seedEl = document.getElementById('minimap-seed');
    if (seedEl) seedEl.textContent = seedLabel(this.seed);
    this.rawSave = null;
    this.saveAlive = true;
    this.started = true;
    this.state = 'playing';
    this.paused = false;
    this.ui.closeAll();
    this.ui.hideTitle();
    this.ui.hideDeath();
    this.ui.showHUD(true);
    this.audio.init();
    this.save();
    this.ui.banner('A NEW LEDGER', 'The valley has not met you', `Seed ${seedLabel(this.seed)} · every choice will be remembered`, 'memory');
  }

  save() {
    if (!this.started) return;
    try {
      const data = {
        v: 1,
        seed: this.seed,
        memory: this.memory.serialize(),
        player: {
          x: this.player.x, y: this.player.y, name: this.player.name,
          legacy: this.player.legacy, maxHp: this.player.maxHp, hp: this.player.hp,
          stam: this.player.stam, hunger: this.player.hunger, thirst: this.player.thirst,
          warmth: this.player.warmth, inv: this.player.inv, arrows: this.player.arrows,
          snares: this.player.snares, tools: this.player.tools, tool: this.player.tool,
          spearTier: this.player.spearTier,
        },
        dayFraction: this.dayFraction,
        weather: this.weather,
        weatherTimer: this.weatherTimer,
        openedChests: [...this.openedChests],
        gatheredTypes: [...this.gatheredTypes],
        usedShrines: [...this.usedShrines],
        quest: this.quest,
        runStartSeq: this.runStartSeq,
        alive: this.state !== 'dead',
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      this.rawSave = data;
      this.saveAlive = data.alive;
    } catch { /* storage may be unavailable */ }
  }

  clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    this.rawSave = null;
  }

  // ── simulation ─────────────────────────────────────────────────────────────
  update(dt) {
    this.elapsed += dt;
    this.updateMouseWorld();
    this.updateTime(dt);
    this.updatePlayer(dt);
    this.updateEntities(dt);
    this.updateEffects(dt);
    this.updateDirector(dt);
    this.updateWeather(dt);
    this.updateQuest(dt);
    this.updateInteract();
    this.updateReveal(dt);
    this.audioMoodTimer -= dt;
    if (this.audioMoodTimer <= 0) {
      this.audioMoodTimer = 1.5;
      this.audio.setMood(this.nightFactor, this.weather);
    }
    this.saveTimer += dt;
    if (this.saveTimer > 18) { this.saveTimer = 0; this.save(); }
  }

  updateMouseWorld() {
    const p = this.player;
    if (this.touchMode) {
      let best = null, bd = 430;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) this.mouseWorld = { x: best.x, y: best.y };
      else {
        const mv = this.moveVector();
        const a = (mv.x || mv.y) ? Math.atan2(mv.y, mv.x) : p.dir;
        this.mouseWorld = { x: p.x + Math.cos(a) * 130, y: p.y + Math.sin(a) * 130 };
      }
    } else {
      this.mouseWorld.x = (this.renderer?.camX || 0) + this.mouseScreen.x;
      this.mouseWorld.y = (this.renderer?.camY || 0) + this.mouseScreen.y;
    }
  }

  updateTime(dt) {
    this.dayFraction += dt / DAY_SECONDS;
    if (this.dayFraction >= 1) {
      this.dayFraction -= 1;
      this.memory.day++;
      this.onNewDay();
    }
    this.memory.time = this.dayFraction;
    this.nightFactor = nightAmount(this.dayFraction);
    if (this.nightFactor > 0.55 && !this.nightActive) {
      this.nightActive = true;
      if (this.started) {
        this.ui.toast('Night settles. The Hollow move more freely in the dark.', 'warn', 5000);
        this.audio.play('fire');
      }
    }
    if (this.nightActive && this.nightFactor < 0.15) {
      this.nightActive = false;
      if (!this.nightRecorded) {
        this.nightRecorded = true;
        this.memory.stats.nights++;
        const region = this.world.regionAt(this.player.x, this.player.y);
        this.memory.record({
          type: 'memory',
          text: `You survived the night of day ${this.memory.day} in ${region.name}.`,
          region: region.name, weight: 1.2,
        });
        this.ui.toast('Dawn. The valley adds another night to your ledger.', 'good', 4200);
      }
    }
  }

  onNewDay() {
    this.nightRecorded = false;
    const region = this.world.regionAt(this.player.x, this.player.y);
    this.memory.record({
      type: 'memory',
      text: `Dawn broke on day ${this.memory.day}. You were still in ${region.name}.`,
      region: region.name, weight: 0.5,
    });
    this.ui.toast(`Day ${this.memory.day}. The valley has not forgotten yesterday.`, 'memory', 4400);
    if (this.animals.length < 26) {
      for (let i = 0; i < 4; i++) {
        const x = this.rng.range(160, WORLD - 160), y = this.rng.range(160, WORLD - 160);
        if (this.world.canWalk(x, y, 12) && !this.world.pois.some(p => dist(p.x, p.y, x, y) < 180)) {
          this.animals.push(createAnimal(this, this.rng.pick(['deer', 'rabbit']), x, y));
        }
      }
    }
    this.save();
  }

  moveVector() {
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (this.touchMode) { x += this.touchMove.x; y += this.touchMove.y; }
    const d = Math.hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    return { x, y };
  }

  updatePlayer(dt) {
    const p = this.player;
    if (p.dead) return;
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.dodgeCd = Math.max(0, p.dodgeCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt * 2.4);
    p.bowDraw = Math.max(0, p.bowDraw - dt * 3.2);

    const crouch = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && p.dodgeTimer <= 0;
    p.crouching = crouch;
    const mv = this.moveVector();
    let moved = 0;

    if (p.dodgeTimer > 0) {
      p.dodgeTimer -= dt;
      const dd = p.dodgeDir || { x: 0, y: 0 };
      const before = { x: p.x, y: p.y };
      moveEntity(this, p, dd.x, dd.y, 410, dt, p.r);
      moved = dist(before.x, before.y, p.x, p.y);
      p.stepPhase += moved * 0.2;
    } else if (mv.x || mv.y) {
      const biome = this.world.biomeAt(p.x, p.y);
      const base = crouch ? 64 : (biome === BIOME.MARSH ? 118 : 150);
      const before = { x: p.x, y: p.y };
      moveEntity(this, p, mv.x, mv.y, base, dt, p.r);
      moved = dist(before.x, before.y, p.x, p.y);
      p.stepPhase += moved * 0.16;
      p.walked += moved;
    }
    this.playerMoving = moved > 0.05;

    if (this.playerMoving) {
      this.stepSound = (this.stepSound || 0) - dt;
      if (this.stepSound <= 0) {
        this.stepSound = crouch ? 0.5 : 0.33;
        this.audio.play('step');
      }
    }

    const aimA = Math.atan2(this.mouseWorld.y - p.y, this.mouseWorld.x - p.x);
    p.dir = aimA;
    if (this.touchMode && !this.playerMoving) p.dir = aimA;

    if (p.stam < p.maxStam && p.attackCd <= 0) {
      p.stam = Math.min(p.maxStam, p.stam + (crouch ? 9 : 15) * dt);
    }

    const movingDrain = this.playerMoving ? 0.06 : 0;
    p.hunger = clamp(p.hunger - (0.30 + movingDrain) * dt, 0, 100);
    p.thirst = clamp(p.thirst - (0.38 + movingDrain) * dt, 0, 100);

    let nearFire = null;
    for (const s of this.world.settlements) {
      if (s.fire && dist(p.x, p.y, s.fire.x, s.fire.y) < 145) nearFire = s.fire;
    }
    for (const poi of this.world.pois) {
      if (poi.fire && dist(p.x, p.y, poi.fire.x, poi.fire.y) < 120) nearFire = poi.fire;
    }
    this.nearFire = nearFire;
    const biome = this.world.biomeAt(p.x, p.y);
    let cold = 0.12 + (this.nightFactor > 0.3 ? 0.9 * this.nightFactor : 0) + (this.weather === 'rain' ? 0.55 : 0);
    if (biome === BIOME.MARSH) cold += 0.18;
    if (p.tool === 2) cold -= 0.45;
    if (nearFire) {
      p.warmth = clamp(p.warmth + 13 * dt, 0, 100);
      if (p.stam < p.maxStam) p.stam = Math.min(p.maxStam, p.stam + 8 * dt);
    } else {
      p.warmth = clamp(p.warmth - cold * dt, 0, 100);
      if (this.nightFactor < 0.2 && this.weather !== 'rain') p.warmth = clamp(p.warmth + 0.45 * dt, 0, 100);
    }

    if (p.hunger <= 0) p.hp -= 1.4 * dt;
    if (p.thirst <= 0) p.hp -= 1.9 * dt;
    if (p.warmth <= 0) p.hp -= 1.3 * dt;
    if (p.hunger > 45 && p.thirst > 45 && p.warmth > 30 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + 0.45 * dt);
    }
    p.hp = clamp(p.hp, 0, p.maxHp);
    if (p.hp <= 0) {
      const cause = p.hunger <= 0 ? 'starvation' : p.thirst <= 0 ? 'thirst' : p.warmth <= 0 ? 'cold' : this.deathCause;
      this.die(cause);
      return;
    }

    const region = this.world.regionAt(p.x, p.y);
    if (region.id !== this.lastRegion) {
      this.lastRegion = region.id;
      this.memory.ensureRegion(region.id).visits++;
      if (!region.discovered) {
        region.discovered = true;
        this.memory.ensureRegion(region.id).discovered = true;
        this.memory.record({
          type: 'travel', text: `You entered ${region.name} for the first time.`,
          region: region.name, weight: 0.5,
        });
        this.ui.toast(`You have entered ${region.name}.`, 'memory', 3400);
      }
    }
  }

  updateEntities(dt) {
    for (const e of this.enemies) {
      if (!e.dead) Enemy.update(this, e, dt);
      else e.fade = Math.max(0, e.fade - dt * 1.2);
    }
    for (const a of this.animals) Animal.update(this, a, dt);
    for (const n of this.npcs) NPC.update(this, n, dt);
    for (const pr of this.projectiles) pr.update(this, dt);
    for (const t of this.traps) t.update(this, dt);

    // keep bodies from occupying the same space
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j];
        if (b.dead) continue;
        const d = dist(a.x, a.y, b.x, b.y);
        const min = a.r + b.r - 2;
        if (d > 0.01 && d < min) {
          const push = (min - d) * 0.5;
          const nx = (a.x - b.x) / d, ny = (a.y - b.y) / d;
          if (this.world.canWalk(a.x + nx * push, a.y + ny * push, a.r)) { a.x += nx * push; a.y += ny * push; }
          if (this.world.canWalk(b.x - nx * push, b.y - ny * push, b.r)) { b.x -= nx * push; b.y -= ny * push; }
        }
      }
    }

    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.traps = this.traps.filter(t => !t.dead);
    this.enemies = this.enemies.filter(e => !e.dead || e.fade > 0);
    this.animals = this.animals.filter(a => !a.dead);
  }

  updateEffects(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const f of this.floats) {
      f.life -= dt;
      f.y -= 18 * dt;
    }
    this.floats = this.floats.filter(f => f.life > 0);
    for (const b of this.burns) b.life -= dt;
    this.burns = this.burns.filter(b => b.life > 0);
    for (const c of this.corpses) {
      c.time += dt;
      c.fade = Math.max(0, 1 - c.time / 150);
    }
    this.corpses = this.corpses.filter(c => c.fade > 0);
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
  }

  updateWeather(dt) {
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const r = this.rng.next();
      let next = r < 0.56 ? 'clear' : r < 0.81 ? 'rain' : 'fog';
      if (next === this.weather) next = next === 'clear' ? 'rain' : 'clear';
      this.weather = next;
      this.weatherTimer = 85 + this.rng.next() * 100;
      if (this.started) {
        const text = next === 'rain' ? 'Rain moves in from the west. Warmth will be harder to keep.'
          : next === 'fog' ? 'Fog thickens. Even the Hollow will see less of you.'
          : 'The rain thins. The valley opens its eyes again.';
        this.ui.toast(text, 'info', 3600);
      }
    }
  }

  updateDirector(dt) {
    this.memory.decayHeat(dt);
    const alive = this.enemies.filter(e => !e.dead).length;
    const region = this.world.regionAt(this.player.x, this.player.y);
    const heat = this.memory.heat(region.id);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.nightFactor > 0.4 ? 17 : 30;
      const cap = 18 + Math.min(8, Math.floor(this.memory.legend / 50));
      if (alive < cap && !this.player.dead) {
        if (heat > 16 || this.rng.chance(0.42)) {
          this.spawnPatrol(heat > 55 ? 3 : 2, heat > 35);
        }
      }
    }
    if (this.revengeTimer > 0) {
      this.revengeTimer -= dt;
      if (this.revengeTimer <= 0 && heat > 6 && !this.player.dead) {
        this.spawnPatrol(2, true);
        this.ui.toast('Something answers the ledger. A patrol is moving.', 'danger', 4200);
      }
    }
    if (heat > 40 && !this.warnedRegions.has(region.id)) {
      this.warnedRegions.add(region.id);
      this.setRegionState(region.id, 'Hollow hunting');
      this.ui.toast(`The Hollow are hunting you in ${region.name}.`, 'danger', 5200);
      this.audio.play('adapt');
    }
    for (const e of this.enemies) {
      if (e.dead || e.scout) continue;
      if (!e.alerted && dist(e.x, e.y, this.player.x, this.player.y) > 1900) {
        e.despawn = true;
      }
    }
    this.enemies = this.enemies.filter(e => !e.despawn);
  }

  updateReveal(dt) {
    this.revealTimer -= dt;
    if (this.revealTimer <= 0) {
      this.revealTimer = 0.24;
      this.world.reveal(this.player.x, this.player.y, 12);
    }
  }

  updateInteract() {
    const p = this.player;
    if (p.dead) { this.interactTarget = null; return; }
    let best = null;
    const consider = (target, priority, penalty = 0) => {
      if (!target) return;
      target.priority = priority;
      target.score = dist(p.x, p.y, target.x, target.y) - priority * 8 + penalty;
      if (!best || target.score < best.score) best = target;
    };
    for (const n of this.npcs) {
      const d = dist(p.x, p.y, n.x, n.y);
      if (d < 70) consider({ type: 'npc', obj: n, x: n.x, y: n.y, prompt: `Speak with ${n.name}` }, 6);
    }
    for (const poi of this.world.pois) {
      if (poi.chest && dist(p.x, p.y, poi.chest.x, poi.chest.y) < 62) {
        consider({ type: 'chest', obj: poi, x: poi.chest.x, y: poi.chest.y, prompt: this.openedChests.has(poi.id) ? 'The chest is empty' : 'Open the old chest' }, 5);
      }
      if (poi.fire && dist(p.x, p.y, poi.fire.x, poi.fire.y) < 82) {
        consider({ type: 'fire', obj: poi, x: poi.fire.x, y: poi.fire.y, prompt: 'Warm yourself at the fire' }, 4);
      }
      if (poi.type === 'shrine' && dist(p.x, p.y, poi.x, poi.y) < 92) {
        consider({ type: 'shrine', obj: poi, x: poi.x, y: poi.y, prompt: 'Pray at the stones' }, 4);
      }
    }
    for (const s of this.world.settlements) {
      if (s.fire && dist(p.x, p.y, s.fire.x, s.fire.y) < 82) {
        consider({ type: 'fire', obj: s, x: s.fire.x, y: s.fire.y, prompt: 'Warm yourself at the fire' }, 4);
      }
    }
    if (this.world.isNearWater(p.x, p.y, 86)) {
      // drinking is a fallback: nearby people and resources take precedence
      consider({ type: 'water', x: p.x, y: p.y, prompt: 'Drink from the water' }, 2, 44);
    }
    for (const r of this.world.resources) {
      if (r.hp <= 0) continue;
      const d = dist(p.x, p.y, r.x, r.y);
      if (d < 68) {
        const label = r.type === 'tree' ? 'Chop the tree' : r.type === 'rock' ? 'Break the stone'
          : r.type === 'berry' ? 'Pick the berries' : r.type === 'bush' ? 'Gather fibre' : 'Gather reeds';
        consider({ type: 'resource', obj: r, x: r.x, y: r.y, prompt: label }, 1);
      }
    }
    this.interactTarget = best;
  }

  updateQuest(dt) {
    this.hudTimer -= dt;
    if (this.hudTimer > 0) return;
    this.hudTimer = 0.5;
    const q = this.quest;
    if (q.step === 0) {
      q.progress = `${q.wood || 0} / 4 wood · ${q.stone || 0} / 2 stone`;
      if ((q.wood || 0) >= 4 && (q.stone || 0) >= 2) {
        this.quest = {
          step: 1, eyebrow: 'WHISPERS', title: 'Make a weapon of the wild',
          text: 'Craft a hunting bow at the workbench of your own hands. Press C.', progress: '', target: null,
        };
        this.memory.record({ type: 'memory', text: 'You gathered enough to arm yourself. The valley noticed.', weight: 0.7 });
        this.ui.banner('THE VALLEY NOTICES', 'You are becoming someone', 'Craft a bow, then see what comes looking.', 'memory');
        this.audio.play('memory');
      }
    } else if (q.step === 1) {
      if (this.player.tools[1]) this.beginScoutStep();
    } else if (q.step === 2) {
      if (this.scout && !this.scout.dead) {
        q.target = { x: this.scout.x, y: this.scout.y, label: 'Hollow scout' };
        q.progress = 'Follow the marker · kill or drive it off';
      } else {
        q.progress = 'The scout is gone. Word is already moving.';
      }
    } else if (q.step === 3) {
      const keeper = this.npcs.find(n => n.role === 'Keeper');
      if (keeper) {
        q.target = { x: keeper.x, y: keeper.y, label: 'Keeper Maelin' };
        q.progress = 'Return to Hearthcamp';
      }
    } else if (q.step >= 4) {
      const region = this.world.regionAt(this.player.x, this.player.y);
      const docs = this.memory.unlockedDoctrines().length;
      const heat = this.memory.heat(region.id);
      if (this.nightFactor > 0.4) {
        q.title = 'Survive until dawn';
        q.text = 'The Hollow move freely in the dark. Keep a fire between you and the treeline.';
      } else if (docs > 0) {
        q.title = 'They are learning';
        q.text = `The Hollow have adapted ${docs} ${docs === 1 ? 'time' : 'times'}. Open the ledger (J) to see what they know.`;
      } else if (heat > 25) {
        q.title = 'You are being hunted';
        q.text = 'The ledger is heavy here. Expect patrols, and expect them to be ready for you.';
      } else {
        q.title = 'Live with what you have made';
        q.text = 'Gather, build, trade, or burn. The valley will remember whichever you choose.';
      }
      q.progress = `Day ${this.memory.day} · ${this.memory.entries.length} memories · ${docs} adaptation${docs === 1 ? '' : 's'}`;
    }
  }

  // ── world reaction ─────────────────────────────────────────────────────────
  gainTactic(stat, amount = 1, regionId = null) {
    const unlocked = this.memory.increment(stat, amount);
    for (const doc of unlocked) {
      const region = regionId !== null ? this.world.regions[regionId] : this.world.regionAt(this.player.x, this.player.y);
      this.memory.record({
        type: 'adapt',
        text: `The Hollow learned ${doc.name}. ${doc.desc}`,
        region: region.name, weight: 4, tags: ['adapt', doc.id],
      });
      this.ui.banner('THE HOLLOW ADAPT', doc.name, doc.desc, 'danger');
      this.ui.toast(`The world remembers: the Hollow learned ${doc.name}.`, 'danger', 5600);
      this.audio.play('adapt');
      this.shake(5);
      this.spawnPatrol(2, true);
      if (regionId !== null) this.addHeat(regionId, 8);
    }
    return unlocked;
  }

  setRegionState(regionId, state) {
    const had = this.memory.regionStates(regionId).includes(state);
    this.memory.addRegionState(regionId, state);
    this.world.regions[regionId].states = [...this.memory.regionStates(regionId)];
    if (!had) {
      const region = this.world.regions[regionId];
      this.memory.record({
        type: 'memory', text: `${region.name} is marked: ${state}.`,
        region: region.name, weight: 1,
      });
    }
  }

  addHeat(regionId, amount) {
    this.memory.addHeat(regionId, amount);
    this.world.regions[regionId].heat = this.memory.heat(regionId);
  }

  witnessesNear(x, y, radius = 300) {
    return this.npcs.filter(n => dist(n.x, n.y, x, y) < radius).map(n => n.name);
  }

  alertNearby(source) {
    for (const e of this.enemies) {
      if (e === source || e.dead || e.alerted) continue;
      if (dist(e.x, e.y, source.x, source.y) < 270) {
        e.alerted = true;
        e.lastSeen = { x: this.player.x, y: this.player.y };
        e.seenTimer = e.loseTime;
      }
    }
  }

  addBurn(x, y, r = 34) {
    this.burns.push({
      x, y, r, rot: this.rng.range(0, 6.28),
      life: 240, maxLife: 240,
    });
    if (this.burns.length > 90) this.burns.shift();
  }

  spawnPatrol(count, adapted = false) {
    if (this.player.dead) return;
    let cx = this.player.x, cy = this.player.y;
    let found = false;
    for (let i = 0; i < 70; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(540, 780);
      const x = this.player.x + Math.cos(a) * r;
      const y = this.player.y + Math.sin(a) * r;
      if (!this.world.canWalk(x, y, 16)) continue;
      if (this.world.pois.some(p => p.type === 'settlement' && dist(p.x, p.y, x, y) < 220)) continue;
      cx = x; cy = y; found = true; break;
    }
    if (!found) return;
    const top = this.memory.topTactic();
    for (let i = 0; i < count; i++) {
      let kind = 'raider';
      const roll = this.rng.next();
      if (roll < 0.58) kind = 'raider';
      else if (roll < 0.8) kind = 'archer';
      else kind = 'wolf';
      if (this.memory.isUnlocked('hounds') && this.rng.chance(0.35)) kind = 'wolf';
      if (top === 'rangedKills' && this.rng.chance(0.35)) kind = 'archer';
      if (top === 'stealthKills' && this.rng.chance(0.3)) kind = 'archer';
      const x = cx + this.rng.range(-48, 48), y = cy + this.rng.range(-48, 48);
      if (!this.world.canWalk(x, y, 14)) continue;
      const e = createEnemy(this, kind, x, y, { elite: adapted && this.rng.chance(0.3) });
      e.home = { x: cx, y: cy };
      this.enemies.push(e);
    }
  }

  spawnEnemyArrow(e) {
    const p = this.player;
    const a = Math.atan2(p.y - e.y, p.x - e.x) + this.rng.range(-0.055, 0.055);
    this.projectiles.push(new Projectile(e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14, a, 330, e.dmg, 'enemy'));
    this.audio.play('bow');
  }

  shake(amount) {
    this.shakeTime = Math.max(this.shakeTime, amount * 0.085);
  }

  addFloat(x, y, text, color = '#f0e6cf', big = false) {
    this.floats.push({ x, y, text, color, life: 0.9, maxLife: 0.9, big });
    if (this.floats.length > 80) this.floats.shift();
  }

  burst(x, y, color, count, speed, type) {
    burst(this, x, y, color, count, speed, type);
  }

  damagePlayer(amount, source, cause = 'the valley') {
    const p = this.player;
    if (p.dead || p.invuln > 0) return;
    p.hp -= amount;
    p.hurtFlash = 0.6;
    p.invuln = 0.35;
    this.deathCause = cause;
    this.shake(6);
    this.audio.play('hurt');
    this.addFloat(p.x, p.y - 26, `-${Math.round(amount)}`, '#d87563');
    this.burst(p.x, p.y, '#8f3a34', 7, 90, 'blood');
    if (source && source.x !== undefined) {
      const a = Math.atan2(p.y - source.y, p.x - source.x);
      const nx = p.x + Math.cos(a) * 12, ny = p.y + Math.sin(a) * 12;
      if (this.world.canWalk(nx, ny, p.r)) { p.x = nx; p.y = ny; }
    }
    if (p.hp <= 0) this.die(cause);
  }

  onEnemyKilled(e, opts = {}) {
    this.memory.stats.kills++;
    const region = this.world.regionAt(e.x, e.y);
    const witnesses = this.witnessesNear(e.x, e.y);
    let tactic = 'meleeKills';
    if (opts.trap) tactic = 'trapKills';
    else if (opts.stealth) tactic = 'stealthKills';
    else if (opts.arrow) tactic = 'rangedKills';
    else if (opts.fire) tactic = 'meleeKills';
    this.gainTactic(tactic, 1, region.id);

    let text;
    if (opts.stealth) text = `You killed a Hollow ${e.type} without being seen in ${region.name}.`;
    else if (opts.trap) text = `A snare broke a Hollow ${e.type} in ${region.name}.`;
    else if (opts.arrow) text = `You put an arrow through a Hollow ${e.type} in ${region.name}.`;
    else if (opts.fire) text = `You burned a Hollow ${e.type} in ${region.name}.`;
    else text = `You killed a Hollow ${e.type} in ${region.name}.`;
    this.memory.record({
      type: 'kill', text, region: region.name, weight: 2,
      tags: ['kill', e.type, tactic], witnesses,
    });
    this.addHeat(region.id, 11);
    this.revengeTimer = 22 + this.rng.next() * 20;
    this.ui.toast(`The world remembers: ${text.charAt(0).toLowerCase()}${text.slice(1)}`, 'memory', 4200);
    this.audio.play('memory');

    if (e.scout) {
      this.scout = null;
      if (this.quest.step === 2) {
        this.quest = {
          step: 3, eyebrow: 'WORD TRAVELS', title: 'Return to Keeper Maelin',
          text: 'The scout will not report. But someone saw. Go back to Hearthcamp and speak to the Keeper.',
          progress: 'Return to Hearthcamp', target: null,
        };
        const keeper = this.npcs.find(n => n.role === 'Keeper');
        if (keeper) this.quest.target = { x: keeper.x, y: keeper.y, label: 'Keeper Maelin' };
        this.ui.banner('WORD TRAVELS', 'The scout is silent', 'Someone at Hearthcamp will want to hear it.', 'memory');
      }
    }
  }

  onAnimalKilled(a, opts = {}) {
    this.memory.stats.hunts++;
    const region = this.world.regionAt(a.x, a.y);
    const r = this.memory.ensureRegion(region.id);
    r.hunts = (r.hunts || 0) + 1;
    this.memory.record({
      type: 'hunt',
      text: `You hunted a ${a.type} in ${region.name}.`,
      region: region.name, weight: 1, tags: ['hunt', a.type],
    });
    this.ui.toast(`The world remembers: you hunted a ${a.type}.`, 'memory', 3200);
    this.audio.play('memory');
    if (r.hunts >= 4 && !this.huntedRegions.has(region.id)) {
      this.huntedRegions.add(region.id);
      this.setRegionState(region.id, 'hunted out');
      this.ui.toast(`The deer are growing scarce in ${region.name}. The wolves have noticed.`, 'warn', 4800);
      this.spawnPatrol(2, false);
    }
  }

  onIntelEscaped(e) {
    const region = this.world.regionAt(e.x, e.y);
    this.gainTactic('escapes', 1, region.id);
    this.memory.record({
      type: 'memory',
      text: `A Hollow survivor carried word of your tactics out of ${region.name}.`,
      region: region.name, weight: 2.5, tags: ['escape'],
    });
    this.addHeat(region.id, 15);
    this.revengeTimer = 10;
    this.ui.toast('A Hollow broke away. It will teach the others what it saw.', 'danger', 5200);
    this.audio.play('adapt');
    if (e.scout) {
      this.scout = null;
      if (this.quest.step === 2) {
        this.quest = {
          step: 3, eyebrow: 'WORD TRAVELS', title: 'Word is already moving',
          text: 'The scout escaped. Whatever it learned is no longer yours. Return to Maelin.',
          progress: 'Return to Hearthcamp', target: null,
        };
        const keeper = this.npcs.find(n => n.role === 'Keeper');
        if (keeper) this.quest.target = { x: keeper.x, y: keeper.y, label: 'Keeper Maelin' };
        this.ui.banner('WORD TRAVELS', 'The scout escaped', 'The Hollow will know you were here.', 'danger');
      }
    }
  }

  // ── combat ─────────────────────────────────────────────────────────────────
  attack() {
    const p = this.player;
    if (p.dead || p.attackCd > 0 || this.paused || this.activePanel) return;
    if (this.touchMode) this.updateMouseWorld();
    if (p.tool === 1) {
      if (!p.tools[1]) { this.ui.toast('You have no bow. Press C to craft one.', 'info'); return; }
      if (p.arrows <= 0) { this.ui.toast('No arrows. Fletch more with C.', 'info'); return; }
      p.arrows--;
      p.attackCd = 0.62;
      p.bowDraw = 1;
      const a = Math.atan2(this.mouseWorld.y - p.y, this.mouseWorld.x - p.x);
      this.projectiles.push(new Projectile(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18, a, 640, 24 + p.spearTier * 2, 'player'));
      this.audio.play('bow');
      this.burst(p.x + Math.cos(a) * 16, p.y + Math.sin(a) * 16, '#d8cba9', 3, 40, 'dust');
      return;
    }
    if (p.tool === 3) {
      if (!p.tools[3]) { this.ui.toast('You have no snares. Press C to twist one.', 'info'); return; }
      if (p.snares <= 0) { this.ui.toast('No snares left. Craft more with C.', 'info'); return; }
      if (this.traps.length >= 5) { this.ui.toast('You can only keep five snares in the ground.', 'info'); return; }
      p.snares--;
      p.attackCd = 0.45;
      this.traps.push(new Trap(p.x, p.y));
      this.audio.play('trap');
      this.ui.toast('Snare set. Step back and wait.', 'info', 2200);
      return;
    }

    p.attackCd = p.tool === 2 ? 0.52 : 0.46;
    p.attackTimer = 0.26;
    p.attackKind = p.tool === 2 ? 'torch' : 'spear';
    p.stam = Math.max(0, p.stam - 5);
    const isTorch = p.tool === 2;
    const reach = isTorch ? 52 : 60;
    const arc = isTorch ? 1.75 : 1.55;
    let hit = false;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (!inArc(e.x, e.y, p.x, p.y, p.dir, reach + e.r, arc)) continue;
      const behind = Math.abs(angleDiff(e.face, Math.atan2(p.y - e.y, p.x - e.x))) > 1.85;
      const stealth = (behind || (!e.alerted && p.crouching)) && !e.lantern;
      let dmg = isTorch ? 13 : 24 + p.spearTier * 10;
      if (stealth) dmg *= 2.2;
      damageEnemy(this, e, dmg, {
        stealth, fire: isTorch, arrow: false, knock: isTorch ? 8 : 15,
        heavy: stealth || p.spearTier > 0,
      });
      hit = true;
      if (isTorch) {
        this.gainTactic('fireHits', 1, this.world.regionAt(e.x, e.y).id);
        this.addBurn(e.x, e.y, 30);
        this.audio.play('fire');
      }
    }
    for (const a of this.animals) {
      if (a.dead) continue;
      if (!inArc(a.x, a.y, p.x, p.y, p.dir, reach + a.r, arc)) continue;
      damageAnimal(this, a, isTorch ? 10 : 24 + p.spearTier * 10, {});
      hit = true;
    }
    if (isTorch) {
      const bx = p.x + Math.cos(p.dir) * 34, by = p.y + Math.sin(p.dir) * 34;
      this.addBurn(bx, by, 26);
      const region = this.world.regionAt(p.x, p.y);
      const r = this.memory.ensureRegion(region.id);
      r.fires = (r.fires || 0) + 1;
      if (r.fires >= 4 && !this.memory.regionStates(region.id).includes('scorched')) {
        this.setRegionState(region.id, 'scorched');
        this.memory.record({
          type: 'memory', text: `Fire has marked ${region.name}. The Hollow will remember the smoke.`,
          region: region.name, weight: 2,
        });
        this.ui.toast(`Fire has marked ${region.name}.`, 'warn', 4400);
      }
    }
    this.audio.play(hit ? 'hit' : 'swing');
    if (hit) this.shake(2.5);
  }

  dodge() {
    const p = this.player;
    if (p.dead || p.dodgeCd > 0 || p.stam < 20) return;
    const mv = this.moveVector();
    const a = (mv.x || mv.y) ? Math.atan2(mv.y, mv.x) : p.dir;
    p.dodgeDir = { x: Math.cos(a), y: Math.sin(a) };
    p.dodgeTimer = 0.17;
    p.dodgeCd = 0.72;
    p.invuln = 0.32;
    p.stam -= 22;
    this.audio.play('swing');
    this.burst(p.x, p.y, '#8f8a78', 5, 45, 'dust');
  }

  selectTool(i) {
    const p = this.player;
    if (i < 0 || i >= 4) return;
    if (!p.tools[i]) {
      const names = ['spear', 'bow', 'torch', 'snare'];
      this.ui.toast(`You have no ${names[i]} yet. Press C to craft.`, 'info', 2600);
      return;
    }
    p.tool = i;
    this.audio.play('ui');
  }

  cycleTool(dir = 1) {
    const p = this.player;
    for (let i = 1; i <= 4; i++) {
      const next = (p.tool + dir * i + 4) % 4;
      if (p.tools[next]) { p.tool = next; this.audio.play('ui'); return; }
    }
  }

  // ── interaction ────────────────────────────────────────────────────────────
  interact() {
    const t = this.interactTarget;
    if (!t || this.player.dead) return;
    if (t.type === 'npc') this.openDialogue(t.obj);
    else if (t.type === 'fire') this.restAtFire();
    else if (t.type === 'shrine') this.pray(t.obj);
    else if (t.type === 'chest') this.lootChest(t.obj);
    else if (t.type === 'water') this.drink();
    else if (t.type === 'resource') this.gather(t.obj);
  }

  gather(r) {
    const p = this.player;
    if (r.hp <= 0) return;
    r.hp--;
    const region = this.world.regionAt(r.x, r.y);
    let item = 'wood';
    if (r.type === 'rock') item = 'stone';
    else if (r.type === 'bush' || r.type === 'fiber' || r.type === 'reed') item = 'fiber';
    else if (r.type === 'berry') item = 'berry';
    else if (r.type === 'driftwood') item = 'wood';
    const amount = r.type === 'tree' ? 2 : r.type === 'rock' ? 2 : r.type === 'berry' ? 2 : 1;
    p.inv[item] = (p.inv[item] || 0) + amount;
    if (r.type === 'berry') p.inv.berry = (p.inv.berry || 0) + 1;
    this.audio.play('pickup');
    this.burst(r.x, r.y - 8, item === 'stone' ? '#8d8a80' : item === 'berry' ? '#a84f46' : '#8a9a63', 4, 45, 'dust');
    if (!this.gatheredTypes.has(r.type)) {
      this.gatheredTypes.add(r.type);
      const labels = { tree: 'wood', rock: 'stone', bush: 'fibre', fiber: 'fibre', reed: 'reeds', berry: 'berries', deadtree: 'deadwood', driftwood: 'driftwood' };
      this.memory.record({
        type: 'gather', text: `You gathered ${labels[r.type] || item} in ${region.name}.`,
        region: region.name, weight: 0.5, tags: ['gather', r.type],
      });
    }
    if (this.quest.step === 0) {
      if (item === 'wood') this.quest.wood = (this.quest.wood || 0) + amount;
      if (item === 'stone') this.quest.stone = (this.quest.stone || 0) + amount;
    }
    if (r.hp <= 0) {
      this.burst(r.x, r.y - 10, '#5a4631', 10, 70, 'leaf');
    }
  }

  drink() {
    const p = this.player;
    if (!this.world.isNearWater(p.x, p.y, 92)) {
      this.ui.toast('There is no water within reach.', 'info', 2400);
      return;
    }
    p.thirst = clamp(p.thirst + 30, 0, 100);
    this.audio.play('drink');
    this.addFloat(p.x, p.y - 26, '+30 thirst', '#8fc1c8');
    this.ui.toast('You drink. The water is cold and tastes of stone.', 'info', 2200);
  }

  eat() {
    const p = this.player;
    if (p.inv.meat > 0) {
      p.inv.meat--;
      p.hunger = clamp(p.hunger + 30, 0, 100);
      p.warmth = clamp(p.warmth + 4, 0, 100);
      this.audio.play('eat');
      this.addFloat(p.x, p.y - 26, '+30 food', '#b7b46a');
      return;
    }
    if (p.inv.berry > 0) {
      p.inv.berry--;
      p.hunger = clamp(p.hunger + 13, 0, 100);
      p.thirst = clamp(p.thirst + 4, 0, 100);
      this.audio.play('eat');
      this.addFloat(p.x, p.y - 26, '+13 food', '#b7b46a');
      return;
    }
    this.ui.toast('Nothing to eat. Berries grow in the meadows; deer move in the grass.', 'info', 3000);
  }

  useVital(key) {
    const p = this.player;
    if (key === 'hunger') this.eat();
    else if (key === 'thirst') this.drink();
    else if (key === 'hp') {
      if (p.inv.bandage > 0) {
        p.inv.bandage--;
        p.hp = clamp(p.hp + 35, 0, p.maxHp);
        this.audio.play('craft');
        this.addFloat(p.x, p.y - 26, '+35 health', '#a9c98c');
      } else {
        this.ui.toast('No bandages. Craft one from two fibre (C).', 'info', 2600);
      }
    }
  }

  restAtFire() {
    const p = this.player;
    p.warmth = clamp(p.warmth + 30, 0, 100);
    p.stam = clamp(p.stam + 35, 0, p.maxStam);
    p.hp = clamp(p.hp + 6, 0, p.maxHp);
    this.audio.play('fire');
    this.ui.toast('You warm your hands. The fire keeps the dark at arm\'s length.', 'info', 3000);
    this.addFloat(p.x, p.y - 26, 'warmth', '#e0a05c');
  }

  pray(poi) {
    if (this.usedShrines.has(poi.id)) {
      this.ui.toast('The stones are quiet. They have already heard you.', 'info', 2600);
      return;
    }
    this.usedShrines.add(poi.id);
    const p = this.player;
    p.hp = clamp(p.hp + 28, 0, p.maxHp);
    p.warmth = clamp(p.warmth + 22, 0, 100);
    p.stam = p.maxStam;
    this.memory.stats.shrines++;
    const region = this.world.regionAt(poi.x, poi.y);
    this.memory.record({
      type: 'memory', text: `You prayed at ${poi.name} and the stones answered with quiet.`,
      region: region.name, weight: 2, tags: ['shrine'],
    });
    this.setRegionState(region.id, 'blessed');
    this.ui.banner('THE STONES LISTEN', poi.name, 'Something old adds your name to its keeping.', 'memory');
    this.audio.play('shrine');
    this.burst(poi.x, poi.y, '#a8c99a', 18, 60, 'spark');
  }

  lootChest(poi) {
    if (this.openedChests.has(poi.id)) {
      this.ui.toast('Nothing but dust and old cloth.', 'info', 2400);
      return;
    }
    this.openedChests.add(poi.id);
    const p = this.player;
    const arrows = 3 + Math.floor(this.rng.next() * 4);
    p.arrows += arrows;
    p.inv.stone += 2;
    p.inv.hide += 1;
    p.inv.berry += 2;
    const region = this.world.regionAt(poi.x, poi.y);
    this.memory.record({
      type: 'memory', text: `You broke open the chest at ${poi.name} in ${region.name}.`,
      region: region.name, weight: 2, tags: ['loot'],
    });
    this.addHeat(region.id, 5);
    this.ui.toast(`The chest yields ${arrows} arrows, stone, hide and dried berries.`, 'good', 3800);
    this.audio.play('pickup');
    this.burst(poi.chest.x, poi.chest.y - 8, '#d8b56a', 14, 55, 'spark');
  }

  // ── crafting ───────────────────────────────────────────────────────────────
  getRecipes() {
    const p = this.player;
    return RECIPES.map(r => {
      const owned = r.id === 'bow' ? p.tools[1]
        : r.id === 'torch' ? p.tools[2]
        : r.id === 'spear' ? p.spearTier > 0
        : false;
      const canAfford = Object.entries(r.cost).every(([k, v]) => (p.inv[k] || 0) >= v);
      const can = canAfford && !(r.once && owned);
      const costText = Object.entries(r.cost).map(([k, v]) => `${v} ${k}`).join(' · ');
      return { ...r, can, owned: owned ? 'owned' : '', costText };
    });
  }

  craft(id) {
    const recipe = RECIPES.find(r => r.id === id);
    if (!recipe) return;
    const p = this.player;
    const owned = id === 'bow' ? p.tools[1] : id === 'torch' ? p.tools[2] : id === 'spear' ? p.spearTier > 0 : false;
    if (recipe.once && owned) return;
    for (const [k, v] of Object.entries(recipe.cost)) {
      if ((p.inv[k] || 0) < v) {
        this.ui.toast(`Not enough ${k}.`, 'warn', 2400);
        return;
      }
    }
    for (const [k, v] of Object.entries(recipe.cost)) p.inv[k] -= v;
    if (id === 'bow') {
      p.tools[1] = true;
      p.arrows += 4;
      p.tool = 1;
      this.ui.toast('A bow, and four arrows. The valley just became a smaller place.', 'good', 3800);
    } else if (id === 'arrows') {
      p.arrows += 5;
    } else if (id === 'torch') {
      p.tools[2] = true;
      p.tool = 2;
    } else if (id === 'snare') {
      p.tools[3] = true;
      p.snares++;
      p.tool = 3;
    } else if (id === 'bandage') {
      p.inv.bandage = (p.inv.bandage || 0) + 1;
    } else if (id === 'spear') {
      p.spearTier = 1;
    }
    this.memory.stats.crafts++;
    const region = this.world.regionAt(p.x, p.y);
    this.memory.record({
      type: 'memory', text: `You crafted ${recipe.name.toLowerCase()} in ${region.name}.`,
      region: region.name, weight: 0.7, tags: ['craft', id],
    });
    this.audio.play('craft');
    this.addFloat(p.x, p.y - 26, recipe.name, '#d8cba9');
    if (id === 'bow' && this.quest.step <= 1) this.beginScoutStep();
    this.save();
  }

  beginScoutStep() {
    if (this.quest.step >= 2) return;
    this.quest = {
      step: 2, eyebrow: 'A SHAPE IN THE PINES', title: 'The scout is watching',
      text: 'A Hollow scout has been shadowing you since you took up the bow. It has seen enough. Find it.',
      progress: 'Follow the marker · kill or drive it off', target: null,
    };
    this.spawnScout();
    this.memory.record({
      type: 'memory', text: 'A Hollow scout began shadowing you. It is deciding what to tell the others.',
      region: this.world.regionAt(this.player.x, this.player.y).name, weight: 1.5,
      tags: ['hollow', 'scout'],
    });
    this.ui.banner('A SHAPE IN THE PINES', 'You are being watched', 'A Hollow scout has seen enough to carry word.', 'danger');
    this.audio.play('adapt');
  }

  // ── people ─────────────────────────────────────────────────────────────────
  openDialogue(npc) {
    if (this.state !== 'playing' || this.player.dead) return;
    this.activeNpc = npc;
    this.activePanel = 'dialogue';
    this.paused = true;
    this.showNpcDialogue(npc);
    this.audio.play('ui');
  }

  npcGreeting(npc) {
    if (npc.role === 'Keeper' && this.quest.step === 3) {
      return 'You came back. Good. Sit. Tell me what the Hollow saw when it looked at you.';
    }
    if (this.memory.reputation(this.world.settlements.find(s => s.name === 'Hearthcamp')?.name || 'Hearthcamp') <= -25) {
      return 'I know what you did. Do not expect the fire to be warm.';
    }
    if (this.memory.dead.length > 0) {
      const last = this.memory.dead[this.memory.dead.length - 1];
      return `You have the look of ${last.name}. The valley still tells stories about what happened on day ${last.day}.`;
    }
    const local = this.memory.inRegion(this.world.regions[npc.region].name, 1)[0];
    if (local && this.rng.chance(0.5)) {
      return `They say you ${local.text.replace(/^You /, '').replace(/^you /, '')}. Word travels faster than feet out here.`;
    }
    if (npc.role === 'Trader') return 'Hide, stone, arrows. I trade in things that keep people alive. What do you need?';
    if (npc.role === 'Hunter') return 'The deer are moving east. Something else is moving with them.';
    if (npc.role === 'Warden') return 'Watch the treeline. They send the ones who have learned your shape.';
    if (npc.role === 'Drifter') return 'I do not stay anywhere long enough to be remembered. You should try it.';
    return 'The valley is listening. It always is. What do you want to be remembered for?';
  }

  showNpcDialogue(npc, line) {
    const text = line || this.npcGreeting(npc);
    const options = this.npcOptions(npc);
    this.dialogueOptions = options;
    this.ui.showDialogue(npc, text, options);
  }

  npcOptions(npc) {
    const p = this.player;
    const opts = [];
    if (npc.role === 'Keeper' && this.quest.step === 3) {
      opts.push({
        label: 'Tell Maelin what you saw', hint: 'Complete the first thread',
        action: () => this.completeTutorial(npc),
      });
    }
    const canGift = p.inv.berry >= 2 || p.inv.meat >= 1;
    opts.push({
      label: 'Share what you have', hint: canGift ? '2 berries or 1 meat' : 'you have nothing to spare',
      disabled: !canGift, action: () => this.gift(npc),
    });
    opts.push({
      label: 'Ask what they have heard', hint: 'the valley talks',
      action: () => this.askRumor(npc),
    });
    const canTrade = p.inv.hide >= 2;
    opts.push({
      label: 'Trade for arrows', hint: canTrade ? '2 hide → 6 arrows' : 'needs 2 hide',
      disabled: !canTrade, action: () => this.trade(npc),
    });
    opts.push({ label: 'Leave', hint: '', action: () => this.closePanels() });
    return opts;
  }

  chooseDialogue(i) {
    const opt = this.dialogueOptions[i];
    if (!opt || opt.disabled) return;
    opt.action();
  }

  gift(npc) {
    const p = this.player;
    if (p.inv.meat > 0) p.inv.meat--;
    else p.inv.berry -= 2;
    this.memory.stats.gifts++;
    const place = this.world.settlements.find(s => s.name === 'Hearthcamp')?.name || 'Hearthcamp';
    this.memory.changeRep(place, 7);
    this.memory.record({
      type: 'memory', text: `You shared food with ${npc.name} at ${this.world.pois.find(p => p.id === npc.poi)?.name || 'the fire'}.`,
      region: this.world.regions[npc.region].name, weight: 1.2,
      tags: ['gift'], witnesses: [npc.name],
    });
    this.audio.play('ui');
    this.ui.toast(`The world remembers: you shared food with ${npc.name}.`, 'good', 3800);
    this.showNpcDialogue(npc, 'That is a kindness I will remember. The fire is warmer with two names at it.');
  }

  askRumor(npc) {
    const line = this.memory.rumor(this, npc);
    this.memory.changeRep(this.world.settlements.find(s => s.name === 'Hearthcamp')?.name || 'Hearthcamp', 1);
    this.showNpcDialogue(npc, line);
  }

  trade(npc) {
    const p = this.player;
    if (p.inv.hide < 2) return;
    p.inv.hide -= 2;
    p.arrows += 6;
    this.memory.changeRep(this.world.settlements.find(s => s.name === 'Hearthcamp')?.name || 'Hearthcamp', 1);
    this.audio.play('pickup');
    this.showNpcDialogue(npc, 'Six arrows, fletched last winter. Try not to leave them all in the Hollow.');
  }

  completeTutorial(npc) {
    this.quest = sandboxQuest();
    const place = 'Hearthcamp';
    this.memory.changeRep(place, 12);
    this.player.arrows += 5;
    this.player.inv.bandage = (this.player.inv.bandage || 0) + 1;
    this.memory.record({
      type: 'memory',
      text: `You told Keeper Maelin what you saw. Hearthcamp will remember your name.`,
      region: this.world.regions[npc.region].name, weight: 3,
      tags: ['story'], witnesses: [npc.name],
    });
    this.ui.banner('THE FIRST THREAD', 'Hearthcamp knows your name', 'The Hollow will learn it too. That is the price.', 'memory');
    this.ui.toast('Maelin gives you five arrows and a bandage.', 'good', 4200);
    this.audio.play('memory');
    this.showNpcDialogue(npc, 'So it has started. The Hollow will learn from every mark you leave. So will we. Go on, then. The valley is yours to make worse or better.');
    this.save();
  }

  // ── panels, death, persistence ─────────────────────────────────────────────
  togglePanel(name) {
    if (this.state !== 'playing') return;
    if (this.activePanel === name) { this.closePanels(); return; }
    this.activePanel = name;
    this.paused = true;
    this.ui.showPanel(name);
    this.audio.play('ui');
  }

  closePanels() {
    this.activePanel = null;
    this.activeNpc = null;
    this.dialogueOptions = [];
    this.ui.closeAll();
    this.paused = this.state !== 'playing';
    this.audio.play('ui');
    this.save();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    this.ui.setMuted(this.muted);
    this.ui.toast(this.muted ? 'Sound off.' : 'Sound on.', 'info', 1800);
  }

  toggleTouch() {
    this.touchMode = !this.touchMode;
    this.ui.setTouch(this.touchMode);
    const label = document.getElementById('pause-touch-label');
    if (label) label.textContent = this.touchMode ? 'Touch controls: on' : 'Touch controls: off';
    this.ui.toast(this.touchMode ? 'Touch controls on.' : 'Touch controls off.', 'info', 1800);
  }

  deathRecap(deadEntry) {
    const tier = legendTier(this.memory.legend);
    const docs = this.memory.unlockedDoctrines().length;
    const parts = [];
    if (tier > 0) parts.push(`+${tier * 5} max health`);
    if (docs > 0) parts.push(`${docs} Hollow adaptation${docs === 1 ? '' : 's'} carried forward`);
    return {
      name: deadEntry.name,
      day: deadEntry.day,
      cause: deadEntry.cause,
      memories: deadEntry.memories || [],
      legacyLine: parts.length
        ? `The next wanderer inherits ${parts.join(' and ')}. The ledger does not close.`
        : 'The next wanderer will inherit the world this one made. The ledger does not close.',
    };
  }

  showDeathForLast() {
    const last = this.memory.dead[this.memory.dead.length - 1];
    if (!last) {
      this.state = 'playing';
      this.paused = false;
      return;
    }
    this.ui.showDeath(this.deathRecap(last));
  }

  die(cause) {
    if (this.state === 'dead' || this.player.dead) return;
    const p = this.player;
    p.dead = true;
    p.hp = 0;
    this.deathCause = cause;
    const region = this.world.regionAt(p.x, p.y);
    const runMemories = this.memory.entries
      .filter(e => e.id > this.runStartSeq)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(e => ({ day: e.day, text: e.text }));
    const epitaph = this.memory.epitaph();
    const deadEntry = {
      name: p.name, day: this.memory.day, cause: causeLabel(cause),
      legend: this.memory.legend, epitaph, memories: runMemories,
    };
    this.memory.dead.push(deadEntry);
    this.memory.record({
      type: 'death',
      text: `You died to ${causeLabel(cause)} in ${region.name}.`,
      region: region.name, weight: 3, tags: ['death'],
    });
    this.saveAlive = false;
    this.state = 'dead';
    this.paused = true;
    this.audio.play('death');
    this.save();
    setTimeout(() => {
      if (this.state === 'dead') this.ui.showDeath(this.deathRecap(deadEntry));
    }, 1200);
  }

  respawn() {
    if (this.state !== 'dead') return;
    const oldName = this.player.name;
    const tier = legendTier(this.memory.legend);
    const name = this.makeName();
    this.player = new Player(this.world.spawn.x, this.world.spawn.y, name, tier);
    this.player.spearTier = 0;
    this.player.inv.bandage = tier > 0 ? 1 : 0;
    this.player.inv.cooked = 0;
    if (tier > 0) this.player.arrows = 6;
    this.dayFraction = 0.30;
    this.nightFactor = 0;
    this.nightActive = false;
    this.nightRecorded = false;
    this.memory.day++;
    this.memory.characterName = name;
    this.runStartSeq = this.memory.seq;
    this.quest = sandboxQuest();
    this.enemies = this.enemies.filter(e => dist(e.x, e.y, this.player.x, this.player.y) > 460);
    this.projectiles = [];
    this.traps = [];
    this.interactTarget = null;
    this.state = 'playing';
    this.paused = false;
    this.started = true;
    this.ui.hideDeath();
    this.ui.closeAll();
    this.ui.showHUD(true);
    this.renderer.cam.x = this.player.x;
    this.renderer.cam.y = this.player.y;
    this.memory.record({
      type: 'memory',
      text: `A new wanderer named ${name} woke in the valley. ${oldName} is still in the ledger.`,
      region: this.world.regionAt(this.player.x, this.player.y).name, weight: 1,
    });
    this.audio.init();
    const bonus = tier > 0 ? ` · +${tier * 5} max health` : '';
    this.ui.banner('THE LEDGER CONTINUES', name, `${oldName} is remembered${bonus}`, 'memory');
    this.ui.toast('The valley remembers the one before. Now it will learn you too.', 'memory', 5000);
    this.save();
  }
}

const game = new Game();
window.__game = game;
