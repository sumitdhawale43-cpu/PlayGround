import { World, WORLD_SIZE, TILE } from './world.js';
import { Player, Enemy, NPC, WEAPONS } from './entities.js';
import {
  activeTraits, worldSeed, saveMemory, recordDeath, recordVictory, noteRun,
  npcGiftFor, npcAlive, campAbandoned, traitById, addChronicle,
} from './memory.js';
import { clamp, lerp, dist, angleTo, angleDiff, TAU, hash2, roman } from './util.js';

export const DAY_LENGTH = 210;

export const RECIPES = [
  { id: 'axe', name: 'Hand axe', glyph: '⟁', cost: { wood: 3, stone: 2 }, desc: 'Fell trees in fewer swings. Slash damage. Heavy in the hand.' },
  { id: 'spear', name: 'Flint spear', glyph: '⇈', cost: { wood: 3, flint: 1, fiber: 1 }, desc: 'Reach without closeness. The valley learns distance from it.' },
  { id: 'torch', name: 'Torch', glyph: '✧', cost: { wood: 2, fiber: 2 }, desc: 'Light, warmth, and fire damage. Fire leaves permanent scars.' },
  { id: 'bandage', name: 'Bandage', glyph: '✚', cost: { fiber: 3 }, desc: 'Bind a wound. Restores 35 life. Carry as many as you dare.' },
  { id: 'campfire', name: 'Campfire', glyph: '△', cost: { wood: 5, stone: 4 }, desc: 'A circle of safety — until the valley learns to smother it.' },
];

export class Game {
  constructor(canvas, ui, memory, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.memory = memory;
    this.audio = audio;
    this.state = 'title';
    this.paused = false;
    this.dpr = 1;
    this.w = 0;
    this.h = 0;
    this.activeTraits = activeTraits(memory);
    this.day = 1;
    this.timeOfDay = 0.63;
    this.shards = 0;
    this.enemies = [];
    this.npcs = [];
    this.particles = [];
    this.floaters = [];
    this.ambient = [];
    this.campfires = [];
    this.spawnTimer = 0;
    this.shake = 0;
    this.saveTimer = 0;
    this.uiTimer = 0;
    this.focus = null;
    this.mouse = { x: 0, y: 0, active: false, down: false };
    this.touch = { active: false, dx: 0, dy: 0 };
    this.input = { up: false, down: false, left: false, right: false, sprint: false, dodge: false };
    this.learned = { fire: 0, slash: 0, pierce: 0, blunt: 0 };
    this.adaptToast = 0;
    this.fleeAccum = 0;
    this.fledThisRun = false;
    this.titleT = 0;
    this.deathTimer = 0;
    this.pendingDeath = null;
    this.frame = 0;

    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');

    this.world = new World(worldSeed(memory), memory);
    this.player = new Player(this.world.spawn.x, this.world.spawn.y);
    this.camera = { x: this.world.camp.x, y: this.world.camp.y + 80 };
    this.spawnNpcs();
    this.resize();
    this.bindInput();
    this.ui.bind(this);

    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.paused = true;
    });

    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  /* ---------------- lifecycle ---------------- */

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.lightCanvas.width = Math.floor(this.w * this.dpr);
    this.lightCanvas.height = Math.floor(this.h * this.dpr);
    this.lightCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  bindInput() {
    const keys = new Set();
    const setKey = (e, down) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
      if (down && e.repeat) return;
      if (k === 'w' || k === 'arrowup') this.input.up = down;
      else if (k === 's' || k === 'arrowdown') this.input.down = down;
      else if (k === 'a' || k === 'arrowleft') this.input.left = down;
      else if (k === 'd' || k === 'arrowright') this.input.right = down;
      else if (k === 'shift') this.input.sprint = down;
      else if (k === ' ') { if (down) this.input.dodge = true; }
      else if (down && k === 'e') this.interact();
      else if (down && k === 'c') this.ui.toggleCraft(this);
      else if (down && k === 'm') this.ui.toggleMemory(this.memory);
      else if (down && k === 'escape') this.ui.closeAll();
      else if (down && k === '1') this.equip('axe');
      else if (down && k === '2') this.equip('spear');
      else if (down && k === '3') this.equip('torch');
      else if (down && k === '4') this.eat();
      else if (down && k === '5') this.bandage();
      else if (down && k === 'p') this.audio.toggleMute();
      if (down) keys.add(k); else keys.delete(k);
    };
    window.addEventListener('keydown', (e) => setKey(e, true));
    window.addEventListener('keyup', (e) => setKey(e, false));

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.mouse.down = true;
      this.audio.unlock();
      this.tryAttack();
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('touchstart', () => this.audio.unlock(), { passive: true });
  }

  spawnNpcs() {
    this.npcs = [];
    const c = this.world.camp;
    const defs = [
      { key: 'maren', name: 'Maren', x: c.x - 118, y: c.y + 120, robe: '#4a3d52', accent: '#c8a367' },
      { key: 'sable', name: 'Sable', x: c.x + 132, y: c.y + 96, robe: '#3c4536', accent: '#9f7a45' },
      { key: 'pell', name: 'Pell', x: c.x + 8, y: c.y + 168, robe: '#4d4435', accent: '#b9a06a' },
    ];
    for (const d of defs) {
      if (!npcAlive(this.memory, d.key)) continue;
      this.npcs.push(new NPC(d.key, d.name, d.x, d.y, d.robe, d.accent));
    }
  }

  startRun() {
    this.state = 'playing';
    this.paused = false;
    this.player = new Player(this.world.spawn.x, this.world.spawn.y);
    this.day = 1;
    this.timeOfDay = 0.27;
    this.shards = 0;
    this.enemies = [];
    this.particles = [];
    this.floaters = [];
    this.learned = { fire: 0, slash: 0, pierce: 0, blunt: 0 };
    this.spawnTimer = 5;
    this.shake = 0;
    this.fleeAccum = 0;
    this.fledThisRun = false;
    this.activeTraits = activeTraits(this.memory);
    this.world = new World(worldSeed(this.memory), this.memory);
    this.player.x = this.world.spawn.x;
    this.player.y = this.world.spawn.y;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.spawnNpcs();
    this.ui.hideTitle();
    this.ui.hideEnd();
    this.ui.showHud();
    this.ui.updateHUD(this, true);
    this.audio.startAmbient();
    this.audio.setNight(0);
    const abandoned = campAbandoned(this.memory);
    if (abandoned) this.toast('The Worldroot camp is silent. The tents are empty.', 'warn');
    else this.toast(`Day 1. The valley is listening.`, 'good');
    this.applyGifts();
    saveMemory(this.memory);
  }

  applyGifts() {
    let delay = 1800;
    for (const key of ['maren', 'sable', 'pell']) {
      const gift = npcGiftFor(this.memory, key);
      if (!gift) continue;
      for (const [item, n] of Object.entries(gift.items)) this.player.inventory[item] = (this.player.inventory[item] || 0) + n;
      setTimeout(() => { if (this.state === 'playing') this.toast(gift.line, 'good'); }, delay);
      delay += 2400;
    }
  }

  newCycle() {
    this.ui.hideEnd();
    this.ui.closeAll();
    this.world = new World(worldSeed(this.memory), this.memory);
    this.player = new Player(this.world.spawn.x, this.world.spawn.y);
    this.day = 1;
    this.timeOfDay = 0.27;
    this.shards = 0;
    this.enemies = [];
    this.particles = [];
    this.floaters = [];
    this.learned = { fire: 0, slash: 0, pierce: 0, blunt: 0 };
    this.activeTraits = activeTraits(this.memory);
    this.spawnTimer = 6;
    this.spawnNpcs();
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.state = 'playing';
    this.paused = false;
    this.ui.showHud();
    this.ui.updateHUD(this, true);
    this.toast(`Cycle ${roman(this.memory.cycles + 1)}. The valley remembers.`, 'good');
    this.applyGifts();
  }

  /* ---------------- loop ---------------- */

  loop(ts) {
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0.016);
    this.last = ts;
    this.frame++;
    if (!this.paused) this.update(dt);
    this.render(dt);
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'title') {
      this.titleT += dt;
      this.updateAmbient(dt);
      this.updateParticles(dt);
      return;
    }
    if (this.state !== 'playing') {
      this.updateParticles(dt);
      if (this.state === 'dying') {
        this.deathTimer -= dt;
        if (this.deathTimer <= 0 && this.pendingDeath) {
          this.state = 'dead';
          this.ui.showDeath(this.pendingDeath);
        }
      }
      return;
    }

    this.timeOfDay += dt / DAY_LENGTH;
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.day++;
      this.memory.counters.daysSurvived = Math.max(this.memory.counters.daysSurvived, this.day);
      this.toast(`Day ${this.day}. ${this.day % 2 === 0 ? 'The valley has grown hungrier.' : 'Something has changed in the trees.'}`, 'good');
      this.audio.sfx('dawn');
      this.save();
    }

    this.updatePlayer(dt);
    for (const e of [...this.enemies]) e.update(dt, this);
    this.enemies = this.enemies.filter((e) => !e.dead);
    for (const n of this.npcs) n.update(dt, this);
    this.npcs = this.npcs.filter((n) => !n.dead);

    this.updateSpawns(dt);
    this.updateAmbient(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);
    this.updatePrompt();
    this.updateAdaptation(dt);

    this.saveTimer -= dt;
    if (this.saveTimer <= 0) { this.saveTimer = 12; this.save(); }
    this.uiTimer -= dt;
    if (this.uiTimer <= 0) { this.uiTimer = 0.08; this.ui.updateHUD(this); }

    this.shake = Math.max(0, this.shake - dt * 26);
    this.audio.setNight(this.dark);
  }

  updatePlayer(dt) {
    const p = this.player;
    if (p.dead) return;

    if (this.mouse.active && !this.touch.active) {
      const sx = p.x - this.camera.x + this.w / 2;
      const sy = p.y - this.camera.y + this.h / 2;
      p.facing = Math.atan2(this.mouse.y - sy, this.mouse.x - sx);
    } else if (this.touch.active) {
      let nearest = null, nd = 240;
      for (const e of this.enemies) {
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < nd) { nd = d; nearest = e; }
      }
      if (nearest) p.facing = angleTo(p.x, p.y, nearest.x, nearest.y);
      else if (this.touch.dx || this.touch.dy) p.facing = Math.atan2(this.touch.dy, this.touch.dx);
    }

    const inp = {
      ...this.input,
      left: this.input.left || this.touch.dx < -0.22,
      right: this.input.right || this.touch.dx > 0.22,
      up: this.input.up || this.touch.dy < -0.22,
      down: this.input.down || this.touch.dy > 0.22,
    };
    if (this.input.dodge) { inp.dodge = true; this.input.dodge = false; }
    p.update(dt, inp, this.world, this);

    if ((this.mouse.down && !this.touch.active) || this.touch.attack) this.tryAttack();

    // fleeing is remembered
    let aggroNear = false;
    for (const e of this.enemies) if (e.aggro && dist(p.x, p.y, e.x, e.y) < 340) { aggroNear = true; break; }
    if (aggroNear && this.input.sprint && p.stamina > 1) {
      this.fleeAccum += dt;
      if (this.fleeAccum > 2.2 && !this.fledThisRun) {
        this.fledThisRun = true;
        this.memory.counters.flees++;
        this.toast('You run. The valley learns the shape of your back.', 'warn');
      }
    } else {
      this.fleeAccum = Math.max(0, this.fleeAccum - dt * 0.5);
    }
  }

  updateCamera(dt) {
    const p = this.player;
    const tx = p.x + Math.cos(p.facing) * 26;
    const ty = p.y + Math.sin(p.facing) * 26;
    this.camera.x = lerp(this.camera.x, tx, 1 - Math.pow(0.001, dt));
    this.camera.y = lerp(this.camera.y, ty, 1 - Math.pow(0.001, dt));
    this.clampCamera();
  }

  clampCamera() {
    if (this.w < WORLD_SIZE) this.camera.x = clamp(this.camera.x, this.w / 2, WORLD_SIZE - this.w / 2);
    else this.camera.x = WORLD_SIZE / 2;
    if (this.h < WORLD_SIZE) this.camera.y = clamp(this.camera.y, this.h / 2, WORLD_SIZE - this.h / 2);
    else this.camera.y = WORLD_SIZE / 2;
  }

  updateSpawns(dt) {
    this.spawnTimer -= dt;
    const dark = this.dark;
    const cap = 4 + Math.floor(dark * 6) + Math.min(3, this.activeTraits.length);
    if (this.spawnTimer <= 0) {
      if (dark > 0.22 && this.enemies.length < cap) {
        const pos = this.world.randomWalkableNear(this.player.x, this.player.y, 560, 860, Math.random);
        if (pos && dist(pos.x, pos.y, this.world.camp.x, this.world.camp.y) > 420) {
          const r = Math.random();
          let type = 'wolf';
          if (r > 0.58) type = 'hollow';
          if (r > 0.92 && (this.day > 2 || this.activeTraits.length >= 3)) type = 'warden';
          this.enemies.push(new Enemy(type, pos.x, pos.y, this));
          if (this.activeTraits.includes('packmind') && type === 'wolf' && Math.random() < 0.5) {
            const p2 = this.world.randomWalkableNear(pos.x, pos.y, 40, 100, Math.random);
            if (p2) this.enemies.push(new Enemy('wolf', p2.x, p2.y, this));
          }
          this.audio.sfx('spawn');
        }
        this.spawnTimer = Math.max(1.4, 3.4 - dark * 1.7 - this.activeTraits.length * 0.08);
      } else if (dark < 0.2 && this.enemies.length < 3) {
        const pos = this.world.randomWalkableNear(this.player.x, this.player.y, 700, 1000, Math.random);
        if (pos && dist(pos.x, pos.y, this.world.camp.x, this.world.camp.y) > 500) {
          this.enemies.push(new Enemy('wolf', pos.x, pos.y, this));
        }
        this.spawnTimer = 6;
      } else {
        this.spawnTimer = 2;
      }
    }

    // ruin guardians
    for (const ruin of this.world.ruins) {
      if (!ruin.pedestal || !ruin.pedestal.shard || ruin.triggered) continue;
      if (dist(this.player.x, this.player.y, ruin.x, ruin.y) < 520) {
        ruin.triggered = true;
        const count = 2 + (this.activeTraits.includes('apex') ? 1 : 0);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU + Math.random();
          const pos = this.world.randomWalkableNear(ruin.x + Math.cos(a) * 180, ruin.y + Math.sin(a) * 180, 20, 80, Math.random);
          if (pos) this.enemies.push(new Enemy(i === 0 ? 'warden' : 'hollow', pos.x, pos.y, this, { guard: ruin }));
        }
        this.toast('The ruin wakes. Something has been waiting here a long time.', 'warn');
        this.audio.sfx('warden');
      }
    }
  }

  updateAmbient(dt) {
    // campfire embers and smoke
    for (const p of this.world.campfires || []) {
      if (!p.lit) continue;
      if (Math.random() < dt * 5) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 14, y: p.y - 8,
          vx: (Math.random() - 0.5) * 10, vy: -20 - Math.random() * 26,
          life: 1.4 + Math.random(), max: 2.4, size: 1.5 + Math.random() * 1.5,
          color: Math.random() < 0.4 ? '#f6c96b' : '#e78c3e', kind: 'fire',
        });
      }
      if (Math.random() < dt * 1.6) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 10, y: p.y - 20,
          vx: (Math.random() - 0.5) * 8, vy: -16 - Math.random() * 14,
          life: 2.2 + Math.random() * 1.4, max: 3.6, size: 3 + Math.random() * 3,
          color: 'rgba(120, 116, 106, 0.2)', kind: 'smoke',
        });
      }
    }
    // torch embers
    if (this.state === 'playing' && this.player.weapon === 'torch' && !this.player.dead && Math.random() < dt * 9) {
      const a = this.player.facing;
      this.particles.push({
        x: this.player.x + Math.cos(a) * 30, y: this.player.y - 8 + Math.sin(a) * 20,
        vx: (Math.random() - 0.5) * 12, vy: -18 - Math.random() * 18,
        life: 0.8 + Math.random() * 0.6, max: 1.4, size: 1 + Math.random(),
        color: '#f0a34e', kind: 'fire',
      });
    }
    // fireflies at night
    if (this.dark > 0.4 && this.state !== 'title' && Math.random() < dt * 1.4) {
      const a = Math.random() * TAU, r = 200 + Math.random() * 500;
      this.ambient.push({
        x: this.player.x + Math.cos(a) * r, y: this.player.y + Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
        life: 4 + Math.random() * 4, max: 8, phase: Math.random() * TAU,
      });
    }
    for (const f of this.ambient) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.vx += Math.sin(this.titleT * 2 + f.phase) * dt * 3;
      f.vy += Math.cos(this.titleT * 1.7 + f.phase) * dt * 3;
      f.life -= dt;
    }
    this.ambient = this.ambient.filter((f) => f.life > 0).slice(-90);
    this.titleT += dt;
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 'fire' ? -8 : p.kind === 'smoke' ? -2 : 160) * dt;
      p.vx *= Math.pow(0.2, dt);
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0).slice(-420);
    for (const f of this.floaters) {
      f.y -= 26 * dt;
      f.life -= dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  updateAdaptation(dt) {
    const max = Math.max(this.learned.fire, this.learned.slash, this.learned.pierce, this.learned.blunt);
    const level = max / 0.42;
    if (this.adaptToast === 0 && level > 0.33) {
      this.adaptToast = 1;
      this.toast(this.learned.fire > 0.1 ? 'The valley is learning your fire.' : 'They are learning the weight of your swings.', 'warn');
    } else if (this.adaptToast === 1 && level > 0.66) {
      this.adaptToast = 2;
      this.toast('They are watching how you move now.', 'warn');
    } else if (this.adaptToast === 2 && level > 0.94) {
      this.adaptToast = 3;
      this.toast('They know your rhythm. Change it or die.', 'warn');
      this.audio.sfx('learn');
    }
    this.ui.setAdapt(level, this.state === 'playing');
  }

  updatePrompt() {
    if (this.state !== 'playing') { this.focus = null; this.ui.setPrompt('', false); return; }
    const p = this.player;
    let best = null, bestD = 82;
    for (const n of this.npcs) {
      const d = dist(p.x, p.y, n.x, n.y);
      if (d < 92 && d < bestD + 12) { best = { npc: n, kind: 'npc' }; bestD = d; }
    }
    const near = this.world.nearestInteractable(p.x, p.y, 80);
    if (near && (!best || near.dist < bestD)) best = near;
    this.focus = best;
    if (!best) { this.ui.setPrompt('', false); return; }
    if (best.kind === 'npc') this.ui.setPrompt(`Talk to ${best.npc.name}`, true);
    else if (best.kind === 'harvest') {
      const label = this.harvestLabel(best.prop);
      this.ui.setPrompt(label, true);
    } else if (best.kind === 'shard') this.ui.setPrompt('Take the ember shard', true);
    else if (best.kind === 'grave') this.ui.setPrompt('Search the cairn', true);
    else if (best.kind === 'beacon') {
      this.ui.setPrompt(this.shards >= 3 ? 'Kindle the beacon' : `The beacon is cold — ${3 - this.shards} shard${3 - this.shards === 1 ? '' : 's'} missing`, true);
    }
  }

  harvestLabel(prop) {
    if (prop.type === 'tree' || prop.type === 'pine' || prop.type === 'deadtree') return 'Gather wood';
    if (prop.type === 'bush') return 'Gather fiber and berries';
    if (prop.type === 'boulder') return 'Gather stone';
    if (prop.type === 'flint') return 'Gather flint';
    return 'Gather';
  }

  /* ---------------- actions ---------------- */

  tryAttack() {
    if (this.state !== 'playing' || this.paused || this.player.dead) return;
    const p = this.player;
    if (p.attackCd > 0 || p.dodgeT > 0) return;
    const wd = p.weaponDef;
    if (p.stamina < wd.stamina) return;
    p.stamina -= wd.stamina;
    p.staminaDelay = 0.55;
    p.attackCd = wd.cd;
    p.attackAnim = 1;
    p.swingDir = p.facing;
    this.memory.counters.attacks++;
    this.audio.sfx(p.weapon === 'fists' ? 'swing' : p.weapon);
    this.spawnSwing(p);

    let hitSomething = false;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > wd.range + e.radius) continue;
      const ad = Math.abs(angleDiff(angleTo(p.x, p.y, e.x, e.y), p.facing));
      if (ad > wd.arc / 2 + 0.12) continue;
      let dmg = wd.dmg;
      if (wd.type === 'fire' && e.type === 'wolf') dmg *= 1.18;
      if (wd.type === 'pierce' && e.type === 'warden') dmg *= 1.22;
      const applied = e.takeDamage(dmg, wd.type, this, wd.knock, p.facing);
      this.learn(wd.type);
      this.memory.counters.hits[wd.type]++;
      this.addFloater(e.x, e.y - e.radius - 14, `-${applied}`, wd.type === 'fire' ? '#f0a34e' : '#e7ddc6');
      hitSomething = true;
    }

    for (const n of this.npcs) {
      if (n.dead) continue;
      const d = dist(p.x, p.y, n.x, n.y);
      if (d > wd.range + n.radius) continue;
      const ad = Math.abs(angleDiff(angleTo(p.x, p.y, n.x, n.y), p.facing));
      if (ad > wd.arc / 2 + 0.12) continue;
      n.takeDamage(wd.dmg, this, p.facing);
      this.addFloater(n.x, n.y - 30, `-${wd.dmg}`, '#c9604d');
      this.shake = 4;
      hitSomething = true;
    }

    if (hitSomething) {
      this.shake = Math.max(this.shake, 4);
      this.audio.sfx('hit');
      this.hitStop = 0.04;
    }

    if (wd.type === 'fire') this.igniteNearby(p, wd);
  }

  igniteNearby(p, wd) {
    const props = this.world.propsNear(p.x, p.y, wd.range + 40);
    for (const prop of props) {
      if (prop.dead) continue;
      if (!['tree', 'pine', 'deadtree'].includes(prop.type)) continue;
      const d = dist(p.x, p.y, prop.x, prop.y);
      if (d > wd.range + 26) continue;
      const ad = Math.abs(angleDiff(angleTo(p.x, p.y, prop.x, prop.y), p.facing));
      if (ad > wd.arc / 2 + 0.4) continue;
      if (Math.random() > 0.4) continue;
      this.world.burnTree(prop);
      this.spawnFire(prop.x, prop.y - 20, 18);
      this.audio.sfx('fire');
      if (!this.burnToast) {
        this.burnToast = true;
        this.toast('The tree becomes a scar. The valley will keep it.', 'warn');
      }
      addChronicle(this.memory, { cycle: this.memory.cycles + 1, day: this.day, kind: 'fire', text: `Burned the forest near the ${this.compass(prop.x, prop.y)}.` });
    }
  }

  learn(type) {
    this.learned[type] = Math.min(0.42, this.learned[type] + 0.011);
    // Enemies slowly read the dominant style.
    const total = this.learned.fire + this.learned.slash + this.learned.pierce + this.learned.blunt;
    if (total > 0.9) {
      this.learned[type] = Math.min(0.42, this.learned[type] + 0.002);
    }
  }

  interact() {
    if (this.state !== 'playing' || this.paused || this.player.dead) return;
    const f = this.focus;
    if (!f) return;
    if (f.kind === 'npc') { this.audio.sfx('talk'); this.ui.openDialogue(f.npc, this); return; }
    if (f.kind === 'harvest') { this.harvest(f.prop); return; }
    if (f.kind === 'shard') { this.takeShard(f.prop); return; }
    if (f.kind === 'grave') { this.lootGrave(f.prop); return; }
    if (f.kind === 'beacon') { this.useBeacon(); return; }
  }

  harvest(prop) {
    const p = this.player;
    const axe = p.weapon === 'axe' || p.owned.axe;
    const inv = p.inventory;
    const gain = {};
    if (prop.type === 'tree' || prop.type === 'pine') {
      gain.wood = axe ? 3 : 1;
      this.spawnLeaves(prop.x, prop.y - 40, 10);
    } else if (prop.type === 'deadtree') {
      gain.wood = axe ? 2 : 1;
      this.spawnLeaves(prop.x, prop.y - 30, 6);
    } else if (prop.type === 'bush') {
      gain.fiber = 2;
      if (prop.berry) gain.berry = 1;
      this.spawnLeaves(prop.x, prop.y - 6, 8, '#7d945c');
    } else if (prop.type === 'boulder') {
      gain.stone = axe ? 3 : 2;
      this.spawnDust(prop.x, prop.y, 8);
    } else if (prop.type === 'flint') {
      gain.flint = 2;
      this.spawnDust(prop.x, prop.y, 5);
    }
    for (const [k, v] of Object.entries(gain)) inv[k] = (inv[k] || 0) + v;
    this.memory.counters.harvested++;
    const label = Object.entries(gain).map(([k, v]) => `+${v} ${k}`).join('  ');
    this.addFloater(p.x, p.y - 34, label, '#d9c69a');
    this.audio.sfx('gather');
    prop.charges = (prop.charges ?? 2) - 1;
    if (prop.charges <= 0) {
      this.world.removeProp(prop);
      this.spawnDust(prop.x, prop.y, 10);
    }
    this.ui.updateHUD(this, true);
  }

  takeShard(prop) {
    prop.shard = false;
    const site = this.world.ruins[prop.site];
    if (site) site.taken = true;
    this.shards++;
    this.memory.counters.shards++;
    this.addFloater(this.player.x, this.player.y - 44, 'EMBER SHARD', '#f0c987');
    this.toast(`${this.shards} of 3 shards. The beacon stirs.`, 'good');
    this.audio.sfx('shard');
    this.shake = 6;
    this.spawnFire(prop.x, prop.y - 50, 24);
    this.save();
    this.ui.updateHUD(this, true);
  }

  lootGrave(prop) {
    prop.looted = true;
    if (prop.grave) prop.grave.taken = true;
    const loot = prop.loot || { wood: 2, fiber: 2 };
    const inv = this.player.inventory;
    for (const [k, v] of Object.entries(loot)) {
      if (k === 'weapon') continue;
      inv[k] = (inv[k] || 0) + v;
    }
    if (loot.weapon && !this.player.owned[loot.weapon]) {
      this.player.owned[loot.weapon] = true;
      this.player.weapon = loot.weapon;
    }
    this.addFloater(this.player.x, this.player.y - 36, 'WHAT YOU LEFT BEHIND', '#d9c69a');
    this.toast('You find what the valley left of you. It kept everything.', 'good');
    this.audio.sfx('gather');
    this.save();
    this.ui.updateHUD(this, true);
  }

  useBeacon() {
    if (this.shards < 3) {
      this.toast(`The Worldroot is cold. ${3 - this.shards} shard${3 - this.shards === 1 ? '' : 's'} still sleep in the ruins.`, 'warn');
      return;
    }
    this.win();
  }

  equip(weapon) {
    if (weapon === 'fists') return;
    if (!this.player.owned[weapon]) {
      this.toast(`You have no ${WEAPONS[weapon].name.toLowerCase()} yet.`, 'warn');
      return;
    }
    this.player.weapon = weapon;
    this.audio.sfx('equip');
    this.ui.updateHUD(this, true);
  }

  eat() {
    if (this.state !== 'playing' || this.paused) return;
    const inv = this.player.inventory;
    if (inv.meat > 0) {
      inv.meat--;
      this.player.hunger = Math.min(100, this.player.hunger + 38);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 12);
      this.addFloater(this.player.x, this.player.y - 40, 'MEAT +38', '#c9a25c');
      this.audio.sfx('eat');
    } else if (inv.berry > 0) {
      inv.berry--;
      this.player.hunger = Math.min(100, this.player.hunger + 18);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
      this.addFloater(this.player.x, this.player.y - 40, 'BERRIES +18', '#c9a25c');
      this.audio.sfx('eat');
    } else {
      this.toast('Nothing to eat. The bushes are bare.', 'warn');
    }
    this.ui.updateHUD(this, true);
  }

  bandage() {
    if (this.state !== 'playing' || this.paused) return;
    const inv = this.player.inventory;
    if (inv.bandage <= 0) { this.toast('No bandages. Three fiber will make one.', 'warn'); return; }
    inv.bandage--;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
    this.addFloater(this.player.x, this.player.y - 40, '+35 LIFE', '#8fae7a');
    this.audio.sfx('heal');
    this.ui.updateHUD(this, true);
  }

  craft(id) {
    if (this.state !== 'playing') return false;
    const recipe = RECIPES.find((r) => r.id === id);
    if (!recipe) return false;
    const inv = this.player.inventory;
    for (const [k, v] of Object.entries(recipe.cost)) {
      if ((inv[k] || 0) < v) { this.toast(`Not enough ${k}.`, 'warn'); return false; }
    }
    for (const [k, v] of Object.entries(recipe.cost)) inv[k] -= v;
    this.memory.counters.crafted++;
    if (id === 'bandage') inv.bandage = (inv.bandage || 0) + 1;
    else if (id === 'campfire') {
      const a = this.player.facing;
      let x = this.player.x + Math.cos(a) * 46;
      let y = this.player.y + Math.sin(a) * 46;
      if (this.world.circleBlocked(x, y, 14)) { x = this.player.x; y = this.player.y + 20; }
      const fire = this.world.addCampfire(x, y);
      this.world.campfires.push(fire);
      this.memory.counters.campfireLit++;
      this.memory.ashes.push({ x: Math.round(x), y: Math.round(y) });
      if (this.memory.ashes.length > 16) this.memory.ashes.shift();
      this.spawnFire(x, y - 10, 14);
      this.toast('The fire takes. For a while, the dark keeps its distance.', 'good');
      addChronicle(this.memory, { cycle: this.memory.cycles + 1, day: this.day, kind: 'fire', text: `Made camp near the ${this.compass(x, y)}.` });
    } else {
      this.player.owned[id] = true;
      this.player.weapon = id;
    }
    this.audio.sfx('craft');
    this.ui.updateHUD(this, true);
    this.save();
    return true;
  }

  /* ---------------- combat / consequences ---------------- */

  damagePlayer(amount, source) {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.state !== 'playing') return;
    p.hp -= amount;
    p.hurtT = 1;
    p.stamina = Math.max(0, p.stamina - 8);
    this.shake = Math.max(this.shake, 7);
    this.audio.sfx('hurt');
    this.spawnBlood(p.x, p.y - 8, 'blood', 7);
    this.addFloater(p.x, p.y - 38, `-${Math.round(amount)}`, '#d98070');
    if (p.hp <= 0) {
      const cause = source
        ? source.type === 'wolf' ? 'Torn apart by the pack'
          : source.type === 'warden' ? 'Broken by a Warden of the ruin'
            : 'Cut down by a Hollow'
        : 'The valley took you';
      this.die(cause);
    }
  }

  onEnemyKilled(e) {
    const c = this.memory.counters;
    c.kills++;
    if (e.type === 'wolf') c.wolfKills++;
    if (e.type === 'hollow') c.hollowKills++;
    if (e.type === 'warden') c.wardenKills++;
    if (this.isNight) c.nightKills++;
    this.spawnBlood(e.x, e.y, 'blood', 16);
    this.spawnDust(e.x, e.y, 10);
    this.audio.sfx('kill');
    if (e.type === 'wolf') this.player.inventory.meat = (this.player.inventory.meat || 0) + 1;
    if (e.type === 'hollow') this.player.inventory.fiber = (this.player.inventory.fiber || 0) + 1;
    if (e.type === 'warden') {
      this.player.inventory.flint = (this.player.inventory.flint || 0) + 2;
      this.shake = 9;
    }
    this.addFloater(e.x, e.y - 30, e.type === 'warden' ? 'WARDEN FALLS' : 'SLAIN', '#d9c69a');
    // live adaptation on kill: enemies get a little bolder
    const dominant = this.dominantStyle();
    if (dominant) this.learned[dominant] = Math.min(0.42, this.learned[dominant] + 0.004);
    this.ui.updateHUD(this, true);
  }

  onNpcKilled(npc) {
    this.memory.npcs[npc.key].alive = false;
    this.memory.counters.npcKills++;
    addChronicle(this.memory, { cycle: this.memory.cycles + 1, day: this.day, kind: 'blood', text: `Killed ${npc.name} at the Worldroot.` });
    this.toast(`${npc.name} is dead. The valley will not forget this.`, 'warn');
    this.spawnBlood(npc.x, npc.y, 'blood', 24);
    this.audio.sfx('death');
    this.save();
  }

  dominantStyle() {
    const l = this.learned;
    let best = null, v = 0.12;
    for (const k of Object.keys(l)) if (l[k] > v) { v = l[k]; best = k; }
    return best;
  }

  die(cause) {
    if (this.state !== 'playing') return;
    const p = this.player;
    p.dead = true;
    p.hp = 0;
    this.state = 'dying';
    this.deathTimer = 1.15;
    this.audio.sfx('death');
    this.audio.stopAmbient();
    this.spawnBlood(p.x, p.y, 'blood', 30);
    this.shake = 14;
    const before = [...activeTraits(this.memory)];
    const loot = { wood: 2, fiber: 2 };
    if (p.weapon !== 'fists') loot.weapon = p.weapon;
    if (p.inventory.flint > 0) loot.flint = 1;
    const cycle = this.memory.cycles + 1;
    recordDeath(this.memory, { day: this.day, cause, x: p.x, y: p.y, cycle, loot });
    const after = activeTraits(this.memory);
    const gained = after.filter((t) => !before.includes(t));
    this.memory.lastRun = {
      kind: 'death', day: this.day, cause, cycle,
      traits: gained, kills: this.memory.counters.kills, at: Date.now(),
    };
    this.memory.counters.daysSurvived = Math.max(this.memory.counters.daysSurvived, this.day);
    saveMemory(this.memory);
    const line = gained.length
      ? 'The valley has learned something new about you.'
      : 'The valley already knew how you would die.';
    this.pendingDeath = {
      cause,
      day: this.day,
      cycle,
      gained,
      line,
      kills: this.memory.counters.kills,
      grave: this.memory.graves[0],
    };
  }

  win() {
    if (this.state !== 'playing') return;
    this.state = 'victory';
    const before = [...activeTraits(this.memory)];
    const cycle = this.memory.cycles + 1;
    recordVictory(this.memory, { day: this.day, cycle, kills: this.memory.counters.kills });
    const after = activeTraits(this.memory);
    const gained = after.filter((t) => !before.includes(t));
    this.memory.counters.daysSurvived = Math.max(this.memory.counters.daysSurvived, this.day);
    saveMemory(this.memory);
    this.audio.sfx('victory');
    this.audio.stopAmbient();
    this.shake = 12;
    this.spawnFire(this.world.beacon.x, this.world.beacon.y - 100, 60);
    this.ui.showVictory({
      day: this.day,
      cycle,
      kills: this.memory.counters.kills,
      gained,
      traits: after,
      line: gained.length
        ? 'It has learned new ways to make the next cycle harder.'
        : 'It already knew you. It will know you better.',
    });
  }

  /* ---------------- effects ---------------- */

  addFloater(x, y, text, color) {
    this.floaters.push({ x, y, text, color: color || '#e7ddc6', life: 1.25, max: 1.25 });
  }

  spawnDust(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      this.particles.push({
        x, y: y + 4, vx: Math.cos(a) * (10 + Math.random() * 30), vy: Math.sin(a) * (8 + Math.random() * 16),
        life: 0.4 + Math.random() * 0.4, max: 0.8, size: 2 + Math.random() * 2.5,
        color: 'rgba(150, 140, 112, 0.45)', kind: 'dust',
      });
    }
  }

  spawnBlood(x, y, kind, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 20 + Math.random() * 90;
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
        life: 0.35 + Math.random() * 0.5, max: 0.85, size: 1.5 + Math.random() * 2.6,
        color: kind === 'fire' ? '#f0a34e' : '#8e3b30', kind: 'blood',
      });
    }
  }

  spawnLeaves(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      this.particles.push({
        x, y, vx: Math.cos(a) * (20 + Math.random() * 50), vy: -10 + Math.random() * 20,
        life: 0.8 + Math.random() * 0.9, max: 1.7, size: 2 + Math.random() * 2.5,
        color: color || '#5f7a45', kind: 'leaf',
      });
    }
  }

  spawnFire(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 60,
        life: 0.6 + Math.random() * 1.1, max: 1.7, size: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#f6c96b' : '#e78c3e', kind: 'fire',
      });
    }
  }

  spawnSwing(p) {
    const wd = p.weaponDef;
    for (let i = 0; i < 4; i++) {
      const a = p.facing + (Math.random() - 0.5) * wd.arc;
      this.particles.push({
        x: p.x + Math.cos(a) * wd.range * 0.7, y: p.y - 8 + Math.sin(a) * wd.range * 0.5,
        vx: Math.cos(a) * 20, vy: Math.sin(a) * 20,
        life: 0.18, max: 0.2, size: 2, color: 'rgba(236, 226, 200, 0.4)', kind: 'dust',
      });
    }
  }

  toast(text, kind) {
    this.ui.toast(text, kind);
  }

  save() {
    if (this.state === 'playing') {
      noteRun(this.memory, {
        day: this.day,
        kills: this.memory.counters.kills,
        traits: this.activeTraits,
        cause: null,
      });
    }
    saveMemory(this.memory);
  }

  compass(x, y) {
    const dx = x - this.world.camp.x, dy = y - this.world.camp.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'east' : 'west';
    return dy > 0 ? 'south' : 'north';
  }

  get dark() {
    if (this.timeOfDay < 0.5) return 0;
    return Math.sin((this.timeOfDay - 0.5) * Math.PI);
  }

  get isNight() { return this.dark > 0.3; }

  get phase() {
    const t = this.timeOfDay;
    if (t < 0.1) return 'Dawn';
    if (t < 0.28) return 'Morning';
    if (t < 0.43) return 'Noon';
    if (t < 0.53) return 'Dusk';
    if (t < 0.9) return 'Night';
    return 'Dawn';
  }

  /* ---------------- debug ---------------- */

  debugSpawn(type = 'wolf', count = 3) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + Math.random();
      const pos = this.world.randomWalkableNear(this.player.x, this.player.y, 180, 320, Math.random) || { x: this.player.x + 120, y: this.player.y };
      this.enemies.push(new Enemy(type, pos.x, pos.y, this));
    }
    this.toast('Something is coming.', 'warn');
  }

  debugTime(t) { this.timeOfDay = t; this.audio.setNight(this.dark); }

  debugGive() {
    const inv = this.player.inventory;
    inv.wood += 12; inv.stone += 10; inv.fiber += 10; inv.flint += 4; inv.berry += 5; inv.meat += 2; inv.bandage += 2;
    this.player.owned.axe = true;
    this.player.owned.spear = true;
    this.player.owned.torch = true;
    this.ui.updateHUD(this, true);
  }

  debugRuin(i = 0) {
    const r = this.world.ruins[i];
    if (!r) return;
    this.player.x = r.x + 120;
    this.player.y = r.y + 120;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
  }

  /* ---------------- render ---------------- */

  render(dt) {
    const ctx = this.ctx;
    const w = this.w, h = this.h;
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;

    let cam = this.camera;
    if (this.state === 'title') {
      const t = this.titleT;
      cam = {
        x: this.world.camp.x + Math.sin(t * 0.1) * 130,
        y: this.world.camp.y + 40 + Math.cos(t * 0.08) * 60,
      };
      this.clampCameraFor(cam);
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(shakeX, shakeY);

    const view = { x: cam.x - w / 2, y: cam.y - h / 2 };
    this.world.drawGround(ctx, view, w, h, this.titleT);

    const renderables = [];
    for (const p of this.world.visibleProps(cam, w + 80, h + 80)) {
      if (p.type === 'banner') continue;
      renderables.push({ y: p.y + (p.type === 'tree' ? 0 : 0), kind: 'prop', obj: p });
    }
    for (const e of this.enemies) renderables.push({ y: e.y, kind: 'enemy', obj: e });
    for (const n of this.npcs) renderables.push({ y: n.y, kind: 'npc', obj: n });
    if (this.state !== 'title' || true) renderables.push({ y: this.player.y, kind: 'player', obj: this.player });
    renderables.sort((a, b) => a.y - b.y);

    for (const r of renderables) {
      if (r.kind === 'prop') this.world.drawProp(ctx, r.obj, this.titleT, view);
      else if (r.kind === 'enemy') r.obj.draw(ctx, view, this.titleT, this);
      else if (r.kind === 'npc') r.obj.draw(ctx, view, this.titleT, this);
      else r.obj.draw(ctx, view, this.titleT, this);
    }

    if (this.focus && this.focus.prop && this.state === 'playing') this.world.drawHighlight(ctx, this.focus.prop, view, this.titleT);

    this.drawParticles(ctx, view);
    this.drawAmbient(ctx, view);
    this.drawFloaters(ctx, view);
    ctx.restore();

    this.drawLighting(ctx, cam, w, h);
    this.drawWeather(ctx, w, h);
  }

  clampCameraFor(cam) {
    if (this.w < WORLD_SIZE) cam.x = clamp(cam.x, this.w / 2, WORLD_SIZE - this.w / 2);
    else cam.x = WORLD_SIZE / 2;
    if (this.h < WORLD_SIZE) cam.y = clamp(cam.y, this.h / 2, WORLD_SIZE - this.h / 2);
    else cam.y = WORLD_SIZE / 2;
  }

  drawParticles(ctx, cam) {
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = p.kind === 'smoke' ? a * 0.5 : a;
      ctx.fillStyle = p.color;
      if (p.kind === 'leaf') {
        ctx.save();
        ctx.translate(p.x - cam.x, p.y - cam.y);
        ctx.rotate(p.life * 8);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.kind === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x - cam.x, p.y - cam.y, p.size * (1.6 - a * 0.6), 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x - cam.x, p.y - cam.y, p.size * a, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawAmbient(ctx, cam) {
    for (const f of this.ambient) {
      const a = Math.min(1, f.life) * (0.4 + Math.sin(this.titleT * 4 + f.phase) * 0.3);
      ctx.fillStyle = `rgba(220, 240, 150, ${a})`;
      ctx.beginPath();
      ctx.arc(f.x - cam.x, f.y - cam.y, 1.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(220, 240, 150, ${a * 0.18})`;
      ctx.beginPath();
      ctx.arc(f.x - cam.x, f.y - cam.y, 6, 0, TAU);
      ctx.fill();
    }
  }

  drawFloaters(ctx, cam) {
    ctx.textAlign = 'center';
    for (const f of this.floaters) {
      const a = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = '600 10px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(f.text, f.x - cam.x + 1, f.y - cam.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x - cam.x, f.y - cam.y);
    }
    ctx.globalAlpha = 1;
  }

  drawLighting(ctx, cam, w, h) {
    const dark = this.state === 'title' ? Math.max(0.4, this.dark) : this.dark;
    if (dark < 0.03) return;
    const lctx = this.lightCtx;
    lctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    lctx.clearRect(0, 0, w, h);
    lctx.fillStyle = `rgba(7, 11, 20, ${0.86 * dark})`;
    lctx.fillRect(0, 0, w, h);

    const lights = [];
    for (const p of this.world.campfires || []) {
      if (p.lit) lights.push({ x: p.x, y: p.y, r: p.radius || 220, warm: 1 });
    }
    for (const p of this.world.lights || []) {
      if (p.lit) lights.push({ x: p.x, y: p.y - 44, r: 170, warm: 0.8 });
    }
    if (this.player.weapon === 'torch' && this.state !== 'title') {
      lights.push({ x: this.player.x, y: this.player.y - 6, r: 190, warm: 0.9 });
    }
    if (this.world.beacon) lights.push({ x: this.world.beacon.x, y: this.world.beacon.y - 70, r: 300, warm: 0.8 });
    for (const r of this.world.ruins) {
      if (r.pedestal && r.pedestal.shard) lights.push({ x: r.x, y: r.y - 40, r: 130, warm: 0.6 });
    }
    for (const e of this.enemies) {
      if (e.type === 'warden' && dist(e.x, e.y, cam.x, cam.y) < 900) lights.push({ x: e.x, y: e.y - 18, r: 80, warm: 0.2, cool: true });
    }

    lctx.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const sx = l.x - cam.x + w / 2;
      const sy = l.y - cam.y + h / 2;
      if (sx < -l.r || sy < -l.r || sx > w + l.r || sy > h + l.r) continue;
      const g = lctx.createRadialGradient(sx, sy, 0, sx, sy, l.r);
      g.addColorStop(0, 'rgba(0,0,0,0.95)');
      g.addColorStop(0.45, 'rgba(0,0,0,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(sx, sy, l.r, 0, TAU);
      lctx.fill();
    }
    lctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.lightCanvas, 0, 0, w, h);

    // warm additive bloom
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      if (l.cool) continue;
      const sx = l.x - cam.x + w / 2;
      const sy = l.y - cam.y + h / 2;
      if (sx < -l.r || sy < -l.r || sx > w + l.r || sy > h + l.r) continue;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, l.r * 0.8);
      const inten = 0.14 * dark * (l.warm || 1);
      g.addColorStop(0, `rgba(255, 176, 88, ${inten})`);
      g.addColorStop(0.5, `rgba(255, 140, 60, ${inten * 0.35})`);
      g.addColorStop(1, 'rgba(255, 120, 40, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, l.r * 0.8, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawWeather(ctx, w, h) {
    if (this.dark < 0.5) return;
    const a = (this.dark - 0.5) * 0.06;
    ctx.fillStyle = `rgba(90, 120, 140, ${a})`;
    ctx.fillRect(0, 0, w, h);
  }
}
