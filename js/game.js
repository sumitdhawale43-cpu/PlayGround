import { clamp, lerp, dist, angleLerp, TAU, Rng, formatClock } from './util.js';
import { createWorld, resolveCollisions } from './world.js';
import { Chronicle, ADAPTATIONS } from './memory.js';
import { TIME_SCALE, DAY_MINUTES, TOOLS, RECIPES, NPC_DEFS, PHASES } from './config.js';
import {
  attack as combatAttack,
  dodge as combatDodge,
  ember as combatEmber,
  placeTrap as combatPlaceTrap,
  spawnEnemy,
  spawnWave,
  enemyCap,
  updateEnemies,
  updateProjectiles,
  updateTraps,
  damageEnemy
} from './combat.js';

export class Game {
  constructor(canvas, sound) {
    this.canvas = canvas;
    this.audio = sound;
    this.ui = null;
    this.isTouch = false;
    this.rng = new Rng((Date.now() ^ 0x51f15e) >>> 0);
    this.chronicle = Chronicle.load() || new Chronicle();
    this.mode = 'title';
    this.t = 0;
    this.view = { w: window.innerWidth, h: window.innerHeight, dpr: 1 };
    this.zoom = 1;
    this.camera = { x: 0, y: 0 };
    this.shake = 0;
    this.damageFlash = 0;
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.stick = { x: 0, y: 0, active: false };
    this.keys = new Set();
    this.introT = 0;
    this.saveTimer = 0;
    this.spawnTimer = 14;
    this.lastPhase = 'dawn';
    this.lastLocation = 'Hollowmoor';
    this.locationTimer = 0;
    this.audioTimer = 0;
    this.visited = new Set(['Hollowmoor']);
    this.echoes = [];
    this.particles = [];
    this.floaters = [];
    this.winTimer = 0;
    this.deathReason = '';
    this.startedOnce = false;

    this.world = createWorld(1207 + this.chronicle.cycle * 131);
    this.initRun();
    this.attachInput();
  }

  /* ============================================================
     SETUP
     ============================================================ */
  initRun() {
    this.time = { day: 1, minutes: 7 * 60 + 20 };
    this.weather = { type: 'clear', intensity: 0 };
    this.player = this.makePlayer();
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.enemies = [];
    this.projectiles = [];
    this.traps = [];
    this.corpses = [];
    this.particles = [];
    this.floaters = [];
    this.echoes = this.chronicle.events.filter(e => e.x != null).slice(-16);
    this.fires = [{
      x: this.world.hearth.x,
      y: this.world.hearth.y,
      r: 24,
      light: 300,
      life: Infinity,
      maxLife: Infinity,
      eternal: true,
      seed: 7
    }];
    this.npcs = this.makeNpcs();
    this.animals = this.makeAnimals();
    this.visited = new Set(['Hollowmoor']);
    this.lastLocation = 'Hollowmoor';
    this.lastPhase = this.phaseKey();
    this.spawnTimer = 13;
    this.saveTimer = 0;
    this.winTimer = 0;
    this.introT = 0;
    this.mode = this.mode === 'ending' ? 'play' : this.mode;
  }

  makePlayer() {
    const v = this.world.village;
    return {
      x: v.x - 12,
      y: v.y + 168,
      r: 13,
      angle: -Math.PI / 2,
      vx: 0, vy: 0,
      hp: 100, maxHp: 100,
      hunger: 82, maxHunger: 100,
      warmth: 100, maxWarmth: 100,
      stamina: 100, maxStamina: 100,
      wood: 3, stone: 1, fiber: 2, berry: 2, meat: 0, cooked: 0,
      arrows: 6, torches: 1, traps: 1, bandage: 0,
      tool: 0,
      sneak: false,
      sprinting: false,
      moving: false,
      bob: 0,
      walkTime: 0,
      atkCd: 0,
      atkAnim: 0,
      swingAngle: 0,
      dashT: 0,
      dashCd: 0,
      dashX: 0,
      dashY: 0,
      invuln: 0,
      sinceDamage: 99,
      emberCd: 0,
      eatCd: 0,
      footstep: 0,
      lastEvade: -99,
      cloak: false,
      inWater: false,
      dead: false
    };
  }

  makeNpcs() {
    return NPC_DEFS.map((def) => {
      const hut = this.world.huts[def.hut];
      return {
        ...def,
        hutIndex: def.hut,
        doorAngle: hut.doorAngle,
        x: this.world.village.x + def.spot.x,
        y: this.world.village.y + def.spot.y,
        homeX: this.world.village.x + def.spot.x,
        homeY: this.world.village.y + def.spot.y,
        hutX: hut.x,
        hutY: hut.y,
        hutName: hut.name,
        angle: this.rng.range(0, TAU),
        state: 'idle',
        timer: this.rng.range(1, 5),
        wx: 0, wy: 0,
        inside: false,
        sharedToday: false,
        walking: false,
        bob: this.rng.range(0, TAU)
      };
    });
  }

  makeAnimals() {
    const animals = [];
    const spots = [
      { type: 'deer', count: 9, hp: 28 },
      { type: 'rabbit', count: 7, hp: 10 }
    ];
    for (const s of spots) {
      for (let i = 0; i < s.count; i++) {
        const pos = this.randomAnimalPoint();
        animals.push({
          type: s.type,
          x: pos.x, y: pos.y,
          angle: this.rng.range(0, TAU),
          hp: s.hp, maxHp: s.hp,
          state: 'idle',
          timer: this.rng.range(1, 5),
          tx: pos.x, ty: pos.y,
          hit: 0,
          bob: this.rng.range(0, TAU),
          dead: false
        });
      }
    }
    return animals;
  }

  randomAnimalPoint() {
    for (let i = 0; i < 120; i++) {
      const x = this.rng.range(100, this.world.w - 100);
      const y = this.rng.range(100, this.world.h - 100);
      const b = this.world.biomeAt(x, y);
      if (b === 'water' || b === 'village') continue;
      if (Math.hypot(x - this.world.village.x, y - this.world.village.y) < 500) continue;
      return { x, y };
    }
    return { x: this.world.village.x + 600, y: this.world.village.y + 400 };
  }

  attachInput() {
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (this.mode === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') this.start();
        return;
      }
      if (this.mode === 'dialogue') {
        if (['KeyE', 'Space', 'Enter', 'Escape'].includes(e.code)) this.closeDialogue();
        return;
      }
      if (this.mode === 'ledger' || this.mode === 'craft') {
        if (e.code === 'Escape' || e.code === 'Tab' || (this.mode === 'craft' && e.code === 'KeyC')) this.closePanels();
        return;
      }
      if (this.mode !== 'play') return;
      switch (e.code) {
        case 'Tab': case 'KeyM': this.openLedger(); break;
        case 'KeyC': this.openCraft(); break;
        case 'KeyE': this.interact(); break;
        case 'Space': this.dodge(); break;
        case 'KeyF': this.ember(); break;
        case 'KeyQ': this.placeTrap(); break;
        case 'KeyR': this.eat(); break;
        case 'Digit1': this.selectTool(0); break;
        case 'Digit2': this.selectTool(1); break;
        case 'Digit3': this.selectTool(2); break;
        case 'Escape': this.closePanels(); break;
        default: break;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.stick.x = 0; this.stick.y = 0; });

    this.canvas.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (e.button === 0) this.attack();
      if (e.button === 2) this.ember();
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setViewport(w, h, dpr = 1) {
    this.view = { w, h, dpr };
    const base = Math.min(w, h) / 860;
    this.zoom = clamp(base, 0.72, 1.06);
  }

  /* ============================================================
     FLOW
     ============================================================ */
  start() {
    if (this.mode !== 'title') return;
    this.audio.init();
    this.audio.setNight(this.nightLevel());
    this.mode = 'play';
    this.startedOnce = true;
    if (this.ui) this.ui.begin(this);
    this.record({
      kind: 'arrive',
      text: this.chronicle.cycle > 1
        ? `You returned to Hollowmoor for cycle ${this.chronicle.cycle}. Something in the trees recognised you.`
        : 'You came down the old road into Hollowmoor with an axe, a bow, and very little else.',
      traits: {},
      x: this.player.x,
      y: this.player.y
    });
    if (this.ui) {
      this.ui.toast('THE VALLEY IS WATCHING · It remembers every deed.', 'learn', 5200);
      if (this.chronicle.unlocked.length) {
        this.ui.toast('They remember what you taught them.', '', 4600);
      }
    }
    this.audio.sfx('dawn');
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 2.6);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 1.8);
    this.updateParticles(dt);
    this.updateFloaters(dt);

    if (this.mode === 'play') {
      this.updateTime(dt);
      this.updatePlayer(dt);
      this.updateNpcs(dt, false);
      this.updateAnimals(dt, false);
      updateEnemies(this, dt);
      updateProjectiles(this, dt);
      updateTraps(this, dt);
      this.updateFires(dt, true);
      this.updateSurvival(dt);
      this.updateSpawning(dt);
      this.updateInteractPrompt();
      this.updateCamera(dt);
      this.updateLocation(dt);
      this.updateAudioState(dt);
      this.autoSave(dt);
      if (this.winTimer > 0) {
        this.winTimer -= dt;
        if (this.winTimer <= 0) this.finishEnding();
      }
    } else if (this.mode === 'title') {
      this.updateNpcs(dt, true);
      this.updateAnimals(dt, true);
      this.updateFires(dt, false);
      this.updateTitleCamera(dt);
    } else {
      this.updateFires(dt, false);
    }

    this.updateAim();
    if (this.ui) this.ui.update(this, dt);
  }

  updateTime(dt) {
    const beforePhase = this.phaseKey();
    this.time.minutes += dt * TIME_SCALE;
    while (this.time.minutes >= DAY_MINUTES) {
      this.time.minutes -= DAY_MINUTES;
      this.time.day += 1;
      this.onNewDay();
    }
    const after = this.phaseKey();
    if (after !== beforePhase) this.onPhaseChange(after);
    this.lastPhase = after;
  }

  onPhaseChange(phase) {
    if (phase === 'night') {
      this.ui.toast('Nightfall — the Hollowed are waking.', 'danger', 4200);
      this.audio.sfx('night');
      this.audio.setNight(1);
      if (this.time.day >= 1) {
        const n = Math.min(3, 1 + Math.floor(this.chronicle.traits.deaths / 2));
        for (let i = 0; i < n; i++) spawnEnemy(this);
        this.spawnTimer = 10;
      }
    } else if (phase === 'dawn') {
      this.ui.toast('Dawn. The Hollowed withdraw into the ash.', 'good', 3800);
      this.audio.sfx('dawn');
      this.audio.setNight(0);
      for (const e of this.enemies) e.fade = true;
    } else if (phase === 'dusk') {
      this.ui.toast('The light is going. Find fire, or make one.', '', 3600);
    }
  }

  onNewDay() {
    this.ui.toast(`DAY ${this.time.day} · The valley has added a page.`, '', 3600);
    for (const p of this.world.props) {
      if (p.kind === 'bush') { p.harvested = false; p.berries = 2 + Math.floor(this.rng.next() * 3); }
      if (p.kind === 'garden') { p.stolen = false; p.berries = 3; }
    }
    for (const n of this.npcs) n.sharedToday = false;
    this.rollWeather();
    this.chronicle.bestDay = Math.max(this.chronicle.bestDay, this.time.day);
    this.chronicle.save();
    this.saveTimer = 0;
  }

  rollWeather() {
    const r = new Rng(this.world.seed + this.time.day * 71);
    if (r.chance(0.34)) this.weather = { type: 'rain', intensity: 0.7 + r.next() * 0.3 };
    else if (r.chance(0.12)) this.weather = { type: 'fog', intensity: 0.6 };
    else this.weather = { type: 'clear', intensity: 0 };
  }

  phaseKey() {
    const h = this.time.minutes / 60;
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 18) return 'day';
    if (h >= 18 && h < 20) return 'dusk';
    return 'night';
  }

  nightLevel() {
    const h = this.time.minutes / 60;
    if (h >= 20 || h < 4) return 1;
    if (h < 6) return clamp(1 - (h - 4) / 2, 0, 1);
    if (h >= 18) return clamp((h - 18) / 2, 0, 1);
    return 0;
  }

  centerDarkness() {
    return this.nightLevel() * 0.78 + (this.weather.type === 'rain' ? 0.06 : 0) + (this.weather.type === 'fog' ? 0.05 : 0);
  }

  /* ============================================================
     PLAYER
     ============================================================ */
  updatePlayer(dt) {
    const p = this.player;
    if (p.dead) return;
    let mx = 0, my = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) my -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) my += 1;
    mx += this.stick.x;
    my += this.stick.y;
    const mag = Math.hypot(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }

    p.sneak = this.keys.has('ControlLeft') || this.keys.has('ControlRight') || this.keys.has('KeyX');
    p.sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && !p.sneak && p.stamina > 1 && mag > 0.1;
    let speed = 168;
    if (p.sneak) speed = 92;
    else if (p.sprinting) speed = 248;
    const wet = this.world.waterAt(p.x, p.y);
    p.inWater = wet;
    if (wet) speed *= 0.55;

    p.moving = mag > 0.12;
    p.vx = mx * speed;
    p.vy = my * speed;

    if (p.sprinting) p.stamina = Math.max(0, p.stamina - dt * 13);

    if (p.dashT > 0) {
      p.dashT -= dt;
      p.vx = p.dashX;
      p.vy = p.dashY;
    }

    const nx = p.x + p.vx * dt;
    const ny = p.y + p.vy * dt;
    const resolved = resolveCollisions(this.world, nx, ny, p.r);
    p.x = resolved.x;
    p.y = resolved.y;

    if (p.moving) {
      p.walkTime += dt * (p.sprinting ? 12 : p.sneak ? 5 : 8.5);
      p.bob = Math.sin(p.walkTime) * (p.sneak ? 1.2 : 2.4);
      p.footstep -= dt;
      if (p.footstep <= 0) {
        p.footstep = p.sprinting ? 0.16 : 0.28;
        const col = wet ? '#9fc2c6' : this.world.biomeAt(p.x, p.y) === 'ash' ? '#8d867c' : '#9b946f';
        this.addParticles(wet ? 'water' : 'dust', p.x, p.y + 8, wet ? 3 : 2, { color: col });
        if (p.sneak) this.chronicle.bump({ shadow: 0.06 });
      }
    } else {
      p.walkTime += dt * 1.2;
      p.bob = Math.sin(p.walkTime) * 0.6;
    }

    p.atkCd = Math.max(0, p.atkCd - dt);
    p.atkAnim = Math.max(0, p.atkAnim - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.emberCd = Math.max(0, p.emberCd - dt);
    p.eatCd = Math.max(0, p.eatCd - dt);
    p.sinceDamage += dt;

    // upgrade the player's "presence" for enemies when sneaking
    if (p.sneak && p.moving) this.chronicle.bump({ shadow: dt * 0.04 });
  }

  updateSurvival(dt) {
    const p = this.player;
    if (p.dead) return;
    const night = this.nightLevel();
    p.hunger = clamp(p.hunger - dt * 0.29, 0, p.maxHunger);

    const fire = this.nearFire(p.x, p.y, 148);
    let warmthDelta = 0;
    if (fire) warmthDelta += 6.5;
    if (night > 0.15) warmthDelta -= night * 1.25 * (p.cloak ? 0.62 : 1);
    else warmthDelta += 2.4;
    if (this.weather.type === 'rain') warmthDelta -= 0.55;
    if (p.inWater) warmthDelta -= 1.2;
    p.warmth = clamp(p.warmth + warmthDelta * dt, 0, p.maxWarmth);

    if (!p.sprinting && p.dashT <= 0) p.stamina = clamp(p.stamina + dt * 17, 0, p.maxStamina);

    if (p.hunger <= 0) p.hp = Math.max(0, p.hp - dt * 1.45);
    if (p.warmth <= 0) p.hp = Math.max(0, p.hp - dt * 1.7);

    if (p.sinceDamage > 5 && p.hunger > 30 && p.warmth > 18 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + dt * 0.55);
    }

    if (p.bandage > 0 && p.hp < 46 && p.sinceDamage > 4) {
      p.bandage -= 1;
      p.hp = Math.min(p.maxHp, p.hp + 30);
      this.addFloat('+30', p.x, p.y - 26, '#b9c99d', 13);
      this.addParticles('leaf', p.x, p.y, 8, { color: '#b9c99d' });
      this.ui.toast('You bind the wound with moss and fibre.', 'good', 2600);
      this.audio.sfx('pickup');
    }

    if (p.hp <= 0) this.die();
  }

  /* ============================================================
     CAMERA / AIM
     ============================================================ */
  updateCamera(dt) {
    const p = this.player;
    const z = this.zoom;
    const halfW = this.view.w / (2 * z);
    const halfH = this.view.h / (2 * z);
    const leadX = Math.cos(p.angle) * 42;
    const leadY = Math.sin(p.angle) * 42;
    const targetX = p.x + leadX;
    const targetY = p.y + leadY;
    const k = 1 - Math.pow(0.002, dt);
    this.camera.x = lerp(this.camera.x, targetX, k);
    this.camera.y = lerp(this.camera.y, targetY, k);
    if (halfW < this.world.w / 2) this.camera.x = clamp(this.camera.x, halfW, this.world.w - halfW);
    else this.camera.x = this.world.w / 2;
    if (halfH < this.world.h / 2) this.camera.y = clamp(this.camera.y, halfH, this.world.h - halfH);
    else this.camera.y = this.world.h / 2;
  }

  updateTitleCamera(dt) {
    const v = this.world.village;
    const t = this.t * 0.07;
    const targetX = v.x + Math.sin(t) * 120;
    const targetY = v.y + Math.cos(t * 0.8) * 78 + 30;
    const k = 1 - Math.pow(0.4, dt);
    this.camera.x = lerp(this.camera.x, targetX, k);
    this.camera.y = lerp(this.camera.y, targetY, k);
  }

  updateAim() {
    const p = this.player;
    if (!p) return;
    if (this.isTouch) {
      let best = null, bd = 430;
      for (const e of this.enemies) {
        if (e.dead || e.fade) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) p.angle = Math.atan2(best.y - p.y, best.x - p.x);
      else if (Math.hypot(this.stick.x, this.stick.y) > 0.25) p.angle = Math.atan2(this.stick.y, this.stick.x);
      return;
    }
    const z = this.zoom;
    const wx = this.camera.x + (this.mouse.x - this.view.w / 2) / z;
    const wy = this.camera.y + (this.mouse.y - this.view.h / 2) / z;
    p.angle = Math.atan2(wy - p.y, wx - p.x);
  }

  /* ============================================================
     ACTIONS
     ============================================================ */
  attack() {
    if (this.mode !== 'play') return;
    combatAttack(this);
  }

  dodge() {
    if (this.mode !== 'play') return;
    combatDodge(this);
  }

  ember() {
    if (this.mode !== 'play') return;
    combatEmber(this);
  }

  placeTrap() {
    if (this.mode !== 'play') return;
    combatPlaceTrap(this);
  }

  selectTool(i) {
    if (this.mode !== 'play') return;
    if (i < 0 || i >= TOOLS.length) return;
    if (this.player.tool === i) return;
    this.player.tool = i;
    this.audio.sfx('ui');
    if (this.ui) this.ui.updateHotbar(this);
  }

  cycleTool() {
    this.selectTool((this.player.tool + 1) % TOOLS.length);
  }

  eat() {
    if (this.mode !== 'play') return;
    const p = this.player;
    if (p.eatCd > 0) return;
    p.eatCd = 0.4;
    if (p.cooked > 0) {
      p.cooked -= 1;
      p.hunger = Math.min(p.maxHunger, p.hunger + 34);
      p.hp = Math.min(p.maxHp, p.hp + 4);
      this.ui.toast('Cooked meat. It tastes like a decision.', '', 2200);
      this.audio.sfx('pickup');
    } else if (p.berry > 0) {
      p.berry -= 1;
      p.hunger = Math.min(p.maxHunger, p.hunger + 12);
      this.audio.sfx('pickup');
    } else if (p.meat > 0) {
      p.meat -= 1;
      p.hunger = Math.min(p.maxHunger, p.hunger + 19);
      p.hp = Math.max(1, p.hp - 5);
      this.ui.toast('Raw meat. Your stomach will remember this too.', 'danger', 2600);
      this.audio.sfx('pickup');
    } else {
      this.ui.toast('There is nothing in your pack to eat.', 'danger', 2200);
    }
    if (this.ui) this.ui.updateResources(this);
  }

  /* ============================================================
     INVENTORY / CRAFT
     ============================================================ */
  canCraft(id) {
    const r = RECIPES.find(x => x.id === id);
    if (!r) return { ok: false, reason: 'Unknown recipe', costs: [] };
    const p = this.player;
    if (r.once && p.cloak) return { ok: false, reason: 'Already made', costs: [] };
    if (r.needsFire && !this.nearFire(p.x, p.y, 150)) {
      return { ok: false, reason: 'You need to be beside a fire', costs: [] };
    }
    const costs = Object.entries(r.cost).map(([key, need]) => ({
      key, need, have: p[key] || 0, lack: (p[key] || 0) < need
    }));
    if (costs.some(c => c.lack)) return { ok: false, reason: 'Not enough gathered', costs };
    if (id === 'campfire' && this.world.waterAt(p.x, p.y)) {
      return { ok: false, reason: 'The ground is too wet', costs };
    }
    return { ok: true, costs };
  }

  craft(id) {
    if (this.mode !== 'play' && this.mode !== 'craft') return false;
    const check = this.canCraft(id);
    if (!check.ok) {
      this.ui.toast(check.reason, 'danger', 2400);
      this.audio.sfx('ui');
      return false;
    }
    const p = this.player;
    const r = RECIPES.find(x => x.id === id);
    for (const [key, need] of Object.entries(r.cost)) p[key] -= need;
    let msg = '';
    switch (id) {
      case 'arrows': p.arrows += 8; msg = 'Eight arrows. Straight enough.'; break;
      case 'torch': p.torches += 2; msg = 'Two torches, bound and ready.'; break;
      case 'snare': p.traps += 2; msg = 'Two snares. The wire is eager.'; break;
      case 'bandage': p.bandage += 2; msg = 'Two bandages packed in moss.'; break;
      case 'cook': {
        p.cooked += 1;
        msg = 'The meat darkens over the fire.';
        break;
      }
      case 'cloak': p.cloak = true; msg = 'The cloak settles around your shoulders.'; break;
      case 'campfire': {
        const fx = p.x + Math.cos(p.angle) * 30;
        const fy = p.y + Math.sin(p.angle) * 30;
        this.fires.push({
          x: fx, y: fy, r: 22, light: 205, life: 155, maxLife: 155,
          eternal: false, seed: this.rng.range(0, 1000)
        });
        this.addParticles('ember', fx, fy - 10, 18, {});
        this.record({
          kind: 'build', text: 'You built a campfire and taught the dark a small lesson.',
          traits: {}, x: fx, y: fy
        });
        msg = 'The fire takes. Keep it close.';
        break;
      }
      default: break;
    }
    this.audio.sfx('craft');
    this.ui.toast(msg, 'good', 2600);
    this.addFloat(msg.split('.')[0], p.x, p.y - 30, '#e9e1cf', 12);
    this.ui.updateResources(this);
    this.ui.refreshCraft(this);
    this.saveTimer = 0;
    return true;
  }

  nearFire(x, y, range = 150) {
    let best = null, bd = range;
    for (const f of this.fires) {
      const d = dist(x, y, f.x, f.y);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }

  adjustRep(n) {
    this.chronicle.adjustRep(n);
    this.chronicle.save();
  }

  /* ============================================================
     DEEDS / MEMORY
     ============================================================ */
  record(payload) {
    const before = new Set(this.chronicle.unlocked);
    const ev = this.chronicle.record({
      ...payload,
      day: this.time.day,
      time: this.time.minutes
    });
    if (ev.x != null) {
      this.echoes.push(ev);
      if (this.echoes.length > 16) this.echoes.shift();
    }
    const gained = this.chronicle.unlocked.filter(id => !before.has(id));
    for (const id of gained) {
      const a = ADAPTATIONS.find(x => x.id === id);
      if (a) this.onAdaptation(a);
    }
    this.chronicle.fresh = [];
    this.saveTimer = 26;
    return ev;
  }

  onAdaptation(a) {
    if (this.ui) {
      this.ui.toast(`THE VALLEY LEARNS · ${a.name}`, 'learn', 5600);
      this.ui.addLearning(a);
    }
    this.audio.sfx('learn');
    this.addParticles('spark', this.player.x, this.player.y - 18, 20, { color: '#e0763c' });
    this.shake = Math.max(this.shake, 0.35);
  }

  /* ============================================================
     EFFECTS
     ============================================================ */
  addParticles(kind, x, y, count = 5, opts = {}) {
    if (this.particles.length > 700) return;
    const rng = this.rng;
    for (let i = 0; i < count; i++) {
      const a = rng.range(0, TAU);
      let sp = opts.speed ?? rng.range(10, 60);
      let color = opts.color || '#b9b09a';
      let life = opts.life ?? rng.range(0.4, 1.1);
      let size = opts.size ?? rng.range(1.2, 3);
      let g = 0;
      let drag = 0.9;
      if (kind === 'dust') { color = opts.color || '#a09a79'; size = rng.range(1, 2.6); life = rng.range(0.35, 0.8); }
      if (kind === 'leaf') { color = opts.color || '#7f8c58'; size = rng.range(1.5, 3); life = rng.range(0.6, 1.4); g = 40; }
      if (kind === 'blood') { color = opts.color || '#8f3b32'; size = rng.range(1.2, 2.6); life = rng.range(0.3, 0.7); g = 120; }
      if (kind === 'spark') { color = opts.color || '#e0a05c'; size = rng.range(1, 2.4); life = rng.range(0.4, 1); g = -12; }
      if (kind === 'ember') { color = opts.color || '#e08a44'; size = rng.range(1, 2.4); life = rng.range(0.8, 2.1); g = -28; }
      if (kind === 'smoke') { color = opts.color || 'rgba(80,86,78,0.4)'; size = rng.range(3, 7); life = rng.range(1.2, 2.4); g = -16; sp = rng.range(4, 14); }
      if (kind === 'soul') { color = opts.color || '#c8d0da'; size = rng.range(1.4, 3); life = rng.range(0.8, 1.6); g = -20; }
      if (kind === 'water') { color = opts.color || '#9fc2c6'; size = rng.range(1, 2.2); life = rng.range(0.3, 0.6); g = 90; }
      this.particles.push({
        kind, x: x + rng.range(-4, 4), y: y + rng.range(-4, 4),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.rise || 0),
        g, drag, life, maxLife: life, size, color
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
    }
  }

  addFloat(text, x, y, color = '#e9e1cf', size = 12) {
    this.floaters.push({ text, x, y, color, size, life: 1.3, maxLife: 1.3 });
    if (this.floaters.length > 40) this.floaters.shift();
  }

  updateFloaters(dt) {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y -= dt * 24;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
  }

  /* ============================================================
     LOCATION / AUDIO / SAVE
     ============================================================ */
  locationName() {
    return this.world.biomeNameAt(this.player.x, this.player.y);
  }

  updateLocation(dt) {
    this.locationTimer -= dt;
    if (this.locationTimer > 0) return;
    this.locationTimer = 1.2;
    const name = this.locationName();
    if (name !== this.lastLocation) {
      this.lastLocation = name;
      if (!this.visited.has(name)) {
        this.visited.add(name);
        this.record({
          kind: 'explore', text: `You walked into ${name}.`,
          traits: { explored: 1 }, x: this.player.x, y: this.player.y
        });
        this.ui.toast(name.toUpperCase(), '', 2400);
      }
    }
  }

  updateAudioState(dt) {
    this.audioTimer -= dt;
    if (this.audioTimer > 0) return;
    this.audioTimer = 0.8;
    this.audio.setNight(this.nightLevel());
  }

  autoSave(dt) {
    this.saveTimer += dt;
    if (this.saveTimer > 25) {
      this.saveTimer = 0;
      this.chronicle.save();
    }
  }

  /* ============================================================
     PANELS
     ============================================================ */
  openLedger() {
    if (this.mode !== 'play') return;
    this.mode = 'ledger';
    this.audio.sfx('ui');
    if (this.ui) this.ui.openLedger(this);
  }

  openCraft() {
    if (this.mode !== 'play') return;
    this.mode = 'craft';
    this.audio.sfx('ui');
    if (this.ui) this.ui.openCraft(this);
  }

  closePanels() {
    if (this.mode !== 'ledger' && this.mode !== 'craft' && this.mode !== 'dialogue') return;
    if (this.mode === 'dialogue') { this.closeDialogue(); return; }
    this.mode = 'play';
    this.audio.sfx('ui');
    if (this.ui) this.ui.closePanels();
  }

  closeDialogue() {
    if (this.mode !== 'dialogue') return;
    this.mode = 'play';
    if (this.ui) this.ui.hideDialogue();
  }

  /* ============================================================
     DEATH / ENDING / CYCLE
     ============================================================ */
  hurtPlayer(dmg, sourceX = null, sourceY = null) {
    const p = this.player;
    if (this.mode !== 'play' || p.dead || p.invuln > 0 || p.dashT > 0) return;
    p.hp = Math.max(0, p.hp - dmg);
    p.invuln = 0.85;
    p.sinceDamage = 0;
    p.hitT = 0.25;
    this.damageFlash = Math.min(0.9, this.damageFlash + 0.65);
    this.shake = Math.max(this.shake, 0.55);
    this.audio.sfx('hurt');
    this.addParticles('blood', p.x, p.y - 6, 9, {});
    this.addFloat(`-${Math.round(dmg)}`, p.x, p.y - 30, '#d76a56', 13);
    if (sourceX != null) {
      const a = Math.atan2(p.y - sourceY, p.x - sourceX);
      const moved = resolveCollisions(this.world, p.x + Math.cos(a) * 16, p.y + Math.sin(a) * 16, p.r);
      p.x = moved.x;
      p.y = moved.y;
    }
    if (p.hp <= 0) this.die();
  }

  die() {
    if (this.mode === 'dead' || this.mode === 'ending') return;
    const p = this.player;
    p.dead = true;
    p.hp = 0;
    this.mode = 'dead';
    this.audio.sfx('death');
    const top = this.chronicle.topTrait();
    const area = this.locationName();
    const text = this.chronicle.unlocked.length
      ? `You fell in ${area}. They had learned the shape of your hands, and they used it. The valley wrote the page anyway.`
      : `You fell in ${area}. The valley wrote the page anyway. It is a patient archivist.`;
    this.record({
      kind: 'death',
      text: `You died in ${area}${top.trait ? `, your ${top.trait.label.toLowerCase()} still heavy in the air` : ''}.`,
      traits: { deaths: 1 },
      x: p.x, y: p.y
    });
    this.damageFlash = 1;
    this.shake = 1;
    this.chronicle.save();
    if (this.ui) {
      this.ui.setPrompt(null);
      this.ui.showDeath(text);
    }
  }

  respawn() {
    if (this.mode !== 'dead') return;
    const p = this.player;
    p.dead = false;
    p.x = this.world.hearth.x + 54;
    p.y = this.world.hearth.y + 74;
    p.hp = 62;
    p.hunger = 58;
    p.warmth = 66;
    p.stamina = 100;
    p.wood = Math.floor(p.wood * 0.65);
    p.stone = Math.floor(p.stone * 0.65);
    p.fiber = Math.floor(p.fiber * 0.65);
    p.berry = Math.floor(p.berry * 0.65);
    p.arrows = Math.floor(p.arrows * 0.6);
    p.traps = Math.floor(p.traps * 0.5);
    p.invuln = 2.5;
    this.enemies = [];
    this.projectiles = [];
    this.adjustRep(-4);
    this.advanceMinutes(90);
    this.mode = 'play';
    if (this.ui) {
      this.ui.hideDeath();
      this.ui.toast('You wake at the hearth. Someone dragged you back. They will not say who.', 'good', 4200);
    }
    this.record({
      kind: 'arrive',
      text: 'You woke at the hearth with mud in your teeth and your pack lighter.',
      traits: {}, x: p.x, y: p.y
    });
  }

  finishEnding() {
    if (this.mode === 'ending') return;
    this.mode = 'ending';
    this.chronicle.save();
    this.audio.sfx('cairn');
    if (this.ui) this.ui.showEnding({
      ...this.chronicle.summary(this.time.day),
      days: this.time.day
    });
  }

  newCycle() {
    this.chronicle.nextCycle('ending');
    this.mode = 'play';
    this.world = createWorld(1207 + this.chronicle.cycle * 131);
    this.initRun();
    if (this.ui) {
      this.ui.hideEnding();
      this.ui.closePanels();
      this.ui.toast(`CYCLE ${this.chronicle.cycle} · The valley remembers everything.`, 'learn', 5200);
      this.ui.syncLearnings(this.chronicle);
      this.ui.updateResources(this);
      this.ui.updateHotbar(this);
    }
    this.audio.sfx('learn');
    this.record({
      kind: 'arrive',
      text: 'You walked into the valley again. The trees leaned in to look at you.',
      traits: {}, x: this.player.x, y: this.player.y
    });
  }

  /* ============================================================
     TIME HELPERS
     ============================================================ */
  advanceMinutes(minutes) {
    this.time.minutes += minutes;
    while (this.time.minutes >= DAY_MINUTES) {
      this.time.minutes -= DAY_MINUTES;
      this.time.day += 1;
      this.onNewDay();
    }
    this.lastPhase = this.phaseKey();
  }

  clockString() {
    return `${formatClock(this.time.minutes)}`;
  }

  phaseInfo() {
    return PHASES[this.phaseKey()] || PHASES.day;
  }

  objective() {
    const lit = this.world.cairns.filter(c => c.lit).length;
    return { lit, total: this.world.cairns.length };
  }

  /* ============================================================
     NPCs
     ============================================================ */
  updateNpcs(dt, ambient = false) {
    const night = this.nightLevel();
    const hearth = this.world.hearth;
    for (const n of this.npcs) {
      n.bob += dt;
      const danger = !ambient && this.enemies.some(e =>
        !e.dead && !e.fade && dist(n.x, n.y, e.x, e.y) < 250
      );
      const goIn = night > 0.55 && !(n.id === 'sable' && night < 0.92) && !danger;
      let tx = n.homeX, ty = n.homeY, speed = 44;

      if (danger) {
        tx = hearth.x + (n.homeX - hearth.x) * 0.3;
        ty = hearth.y + (n.homeY - hearth.y) * 0.3;
        speed = 92;
      } else if (goIn) {
        tx = n.hutX;
        ty = n.hutY;
        speed = 54;
      } else {
        n.timer -= dt;
        if (n.timer <= 0) {
          n.timer = this.rng.range(2.5, 7);
          n.wx = n.homeX + this.rng.range(-38, 38);
          n.wy = n.homeY + this.rng.range(-30, 30);
        }
        tx = n.wx || n.homeX;
        ty = n.wy || n.homeY;
        speed = 34;
      }

      let dx = tx - n.x, dy = ty - n.y;
      const d = Math.hypot(dx, dy);
      n.walking = false;
      if (goIn && d < 30) {
        n.inside = true;
      } else if (!goIn && n.inside) {
        n.inside = false;
        const hut = this.world.huts[n.hutIndex];
        n.x = n.hutX + Math.cos(n.doorAngle) * (hut.r + 24);
        n.y = n.hutY + Math.sin(n.doorAngle) * (hut.r + 24);
      } else if (!n.inside && d > 6) {
        const vx = (dx / d) * speed * dt;
        const vy = (dy / d) * speed * dt;
        n.x += vx;
        n.y += vy;
        n.angle = angleLerp(n.angle, Math.atan2(dy, dx), Math.min(1, dt * 6));
        n.walking = true;
        n.x = clamp(n.x, 30, this.world.w - 30);
        n.y = clamp(n.y, 30, this.world.h - 30);
      }

      if (ambient) n.inside = false;
      if (!n.inside) {
        const pd = dist(n.x, n.y, this.player.x, this.player.y);
        if (pd < 110) n.angle = angleLerp(n.angle, Math.atan2(this.player.y - n.y, this.player.x - n.x), Math.min(1, dt * 4));
      }
    }
  }

  npcDialogue(npc) {
    const ch = this.chronicle;
    const lastAdapt = ch.unlocked.length ? ADAPTATIONS.find(a => a.id === ch.unlocked[ch.unlocked.length - 1]) : null;
    const adaptLines = {
      shielded: 'You put four arrows in them, so now they carry hide shields. I watched one practise this morning. It was patient about it.',
      swift: 'You ran from them. They learned to run faster. I heard them in the trees, teaching the others.',
      keen: 'You like the shadows. They have started searching the shadows first.',
      warded: 'They step around your wires now. One of them laughed. I did not know they could.',
      pack: 'There are more of them every night. The valley keeps filling the space you make.',
      emberhide: 'You waved fire in their faces. Now they walk through it. That is your doing.',
      marrowbow: 'One of them shot at me last night. Same angle you use. They are copying you.'
    };
    let memory = '';
    if (lastAdapt) memory = adaptLines[lastAdapt.id] || lastAdapt.short;
    else if (ch.traits.deaths > 0) memory = 'We carried you back through the mud once. You were cold as the lake. The valley remembers that too.';
    else if (ch.traits.greed > 0) memory = 'A crate went missing at dawn. I remember counting what was in it.';
    else if (ch.traits.mercy > 0) memory = 'You gave food when you did not have to. The children ate. I remember that.';
    else if (ch.traits.kills > 0) memory = 'There is blood under your nails, and the wood has gone quiet around you.';
    else if (ch.traits.bow > 1) memory = 'You have been loosing arrows into the dark. They are counting them back.';
    else if (ch.traits.flame > 0) memory = 'You carry fire like an argument. The dark is listening.';
    else memory = 'You are still new here. The valley has not finished looking at you.';

    const hints = {
      maren: 'Three cairns hold the old road open — west, east, and south. Take fire to each.',
      ivo: 'The eastern cairn sits in the open. They will see you coming from a mile off.',
      elsbeth: 'Bind torches before you go. Two at least. Cairns are always hungry.',
      sable: this.isTouch
        ? 'The ledger is yours to read. Open it from the HUD. The valley does not hide its arithmetic.'
        : 'The ledger is yours to read. Press Tab. The valley does not hide its arithmetic.',
      orin: 'If you light all three, do we get to leave too?'
    };
    let hint = hints[npc.id] || hints.maren;
    const lit = this.objective().lit;
    if (lit === 1) hint = 'One fire is lit. Two left, and the Hollowed know it.';
    if (lit === 2) hint = 'Two fires. The last one is waiting. So are they.';
    if (lit > 0 && npc.id === 'sable') hint = `${lit} of three. I have written the rest of the page already.`;

    let repLine = '';
    if (ch.rep <= -25) repLine = 'The village has not decided whether to bar the door to you.';
    else if (ch.rep >= 35) repLine = 'Hollowmoor has decided you are ours. That is not always a kindness.';

    const shared = this.maybeShareFood(npc);
    const greet = npc.greet[Math.max(0, this.time.day - 1) % npc.greet.length];
    let text = `${greet}\n\n${memory}`;
    if (repLine) text += `\n\n${repLine}`;
    text += `\n\n${hint}`;
    if (shared) text += '\n\nYou leave a handful of berries on the wood. They pretend not to notice.';

    let tag = 'A NEW PAGE';
    if (lastAdapt) tag = `THEY REMEMBER: ${lastAdapt.name.toUpperCase()}`;
    else if (ch.traits.greed > 0) tag = 'THEY REMEMBER: THE MISSING CRATE';
    else if (ch.traits.mercy > 0) tag = 'THEY REMEMBER: THE SHARED FOOD';
    else if (ch.traits.deaths > 0) tag = 'THEY REMEMBER: THE NIGHT YOU DIED';
    else if (ch.traits.kills > 0) tag = 'THEY REMEMBER: THE BODIES';
    if (shared) tag = 'YOU SHARED FOOD';

    return { text, tag };
  }

  maybeShareFood(npc) {
    const p = this.player;
    if (npc.sharedToday || p.berry <= 0 || this.chronicle.rep < -20) return false;
    npc.sharedToday = true;
    p.berry -= 1;
    this.adjustRep(6);
    this.record({
      kind: 'mercy',
      text: `You shared food with ${npc.name}.`,
      traits: { mercy: 1 },
      x: p.x, y: p.y
    });
    if (this.ui) this.ui.updateResources(this);
    return true;
  }

  talkTo(npc) {
    if (this.mode !== 'play') return;
    this.mode = 'dialogue';
    const info = this.npcDialogue(npc);
    this.audio.sfx('talk');
    if (this.ui) {
      this.ui.setPrompt(null);
      this.ui.showDialogue({
        name: npc.name,
        role: npc.role,
        text: info.text,
        tag: info.tag,
        initial: npc.initial,
        color: npc.color
      });
    }
  }

  /* ============================================================
     ANIMALS
     ============================================================ */
  updateAnimals(dt, ambient = false) {
    const p = this.player;
    for (const a of this.animals) {
      a.bob += dt * 2;
      a.hit = Math.max(0, a.hit - dt);
      let fleeing = false;
      if (!ambient && !p.dead) {
        const d = dist(a.x, a.y, p.x, p.y);
        const range = a.type === 'deer' ? 220 : 128;
        if (d < range) {
          const ang = Math.atan2(a.y - p.y, a.x - p.x);
          a.tx = a.x + Math.cos(ang) * 180;
          a.ty = a.y + Math.sin(ang) * 180;
          a.state = 'flee';
          fleeing = true;
        }
      }
      if (!ambient) {
        for (const e of this.enemies) {
          if (e.dead || e.fade) continue;
          if (dist(a.x, a.y, e.x, e.y) < 150) {
            const ang = Math.atan2(a.y - e.y, a.x - e.x);
            a.tx = a.x + Math.cos(ang) * 160;
            a.ty = a.y + Math.sin(ang) * 160;
            a.state = 'flee';
            fleeing = true;
            break;
          }
        }
      }
      if (!fleeing) {
        a.timer -= dt;
        if (a.timer <= 0 || dist(a.x, a.y, a.tx, a.ty) < 12) {
          a.timer = this.rng.range(2, 6);
          const ang = this.rng.range(0, TAU);
          const r = this.rng.range(40, 170);
          a.tx = clamp(a.x + Math.cos(ang) * r, 80, this.world.w - 80);
          a.ty = clamp(a.y + Math.sin(ang) * r, 80, this.world.h - 80);
          a.state = 'idle';
        }
      }
      const dx = a.tx - a.x, dy = a.ty - a.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        const speed = a.state === 'flee' ? (a.type === 'deer' ? 165 : 130) : (a.type === 'deer' ? 34 : 26);
        const nx = a.x + (dx / d) * speed * dt;
        const ny = a.y + (dy / d) * speed * dt;
        if (!this.world.waterAt(nx, ny)) {
          a.x = nx;
          a.y = ny;
        }
        a.angle = angleLerp(a.angle, Math.atan2(dy, dx), Math.min(1, dt * 5));
        if (a.state === 'flee' && this.rng.chance(dt * 4)) {
          this.addParticles('dust', a.x, a.y + 5, 1, { color: '#9b946f' });
        }
      }
    }
  }

  killAnimal(a, byBow = false) {
    if (a.dead) return;
    a.dead = true;
    const meat = a.type === 'deer' ? 3 : 1;
    this.corpses.push({
      x: a.x, y: a.y, type: a.type, meat, angle: a.angle, bob: this.rng.range(0, TAU)
    });
    this.animals = this.animals.filter(x => x !== a);
    this.addParticles('blood', a.x, a.y, 8, {});
    this.addFloat(`+${meat} meat`, a.x, a.y - 16, '#c9b98d', 11);
    this.record({
      kind: 'gather',
      text: `You brought down a ${a.type} in ${this.locationName()}.`,
      traits: { foraged: 1 },
      x: a.x, y: a.y
    });
    this.audio.sfx('arrowhit');
  }

  /* ============================================================
     FIRES
     ============================================================ */
  updateFires(dt, emit) {
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i];
      if (!f.eternal) {
        f.life -= dt;
        if (f.life <= 0) {
          this.fires.splice(i, 1);
          this.addParticles('smoke', f.x, f.y, 10, {});
          continue;
        }
      }
      if (emit && this.rng.chance(dt * 3.2)) {
        this.addParticles('ember', f.x + this.rng.range(-8, 8), f.y - 4, 1, {});
      }
      if (emit && this.rng.chance(dt * 1.4)) {
        this.addParticles('smoke', f.x + this.rng.range(-6, 6), f.y - 16, 1, {});
      }
      if (this.rng.chance(dt * 0.5) && this.t % 3 < 0.05) {
        this.addParticles('spark', f.x, f.y - 8, 1, {});
      }
    }
    // lanterns emit no particles, but their light is handled by render
  }

  /* ============================================================
     SPAWNING
     ============================================================ */
  updateSpawning(dt) {
    const night = this.nightLevel();
    if (night < 0.5) return;
    this.spawnTimer -= dt;
    const alive = this.enemies.filter(e => !e.dead && !e.fade).length;
    if (this.spawnTimer <= 0 && alive < enemyCap(this)) {
      spawnEnemy(this);
      this.spawnTimer = 9 + this.rng.next() * 8 - night * 2;
    }
  }

  /* ============================================================
     INTERACTION
     ============================================================ */
  findInteractable() {
    const p = this.player;
    let best = null;
    let bd = Infinity;
    const consider = (type, obj, x, y, range, label, danger = false) => {
      const d = dist(p.x, p.y, x, y);
      if (d < range && d < bd) {
        bd = d;
        best = { type, obj, x, y, label, danger };
      }
    };

    for (const n of this.npcs) {
      if (n.inside) continue;
      consider('npc', n, n.x, n.y, 82, `Speak with ${n.name}`);
    }
    for (const f of this.fires) {
      const close = dist(p.x, p.y, f.x, f.y);
      if (close < 92) {
        const label = p.meat > 0 ? `Cook ${p.meat > 1 ? 'meat' : 'the meat'}` : 'Warm yourself by the fire';
        consider('fire', f, f.x, f.y, 92, label);
      }
    }
    for (const hut of this.world.huts) {
      const dx = Math.cos(hut.doorAngle) * (hut.r + 10);
      const dy = Math.sin(hut.doorAngle) * (hut.r + 10);
      consider('hut', hut, hut.x + dx, hut.y + dy, 78, `Rest in ${hut.name}`);
    }
    for (const c of this.world.cairns) {
      consider('cairn', c, c.x, c.y, 128, c.lit ? `${c.name} is lit` : `Light ${c.name} · 1 torch + 3 wood`);
    }
    if (this.world.cache && !this.world.cache.stolen) {
      consider('cache', this.world.cache, this.world.cache.x, this.world.cache.y, 72, 'Search the old cache');
    }
    for (const prop of this.world.props) {
      if (Math.abs(prop.x - p.x) > 130 || Math.abs(prop.y - p.y) > 130) continue;
      if (prop.kind === 'bush') {
        consider('bush', prop, prop.x, prop.y, 62, prop.harvested ? 'The bush is picked clean' : 'Gather berries');
      } else if (prop.kind === 'rock' && !prop.done) {
        consider('rock', prop, prop.x, prop.y, 68, 'Mine stone');
      } else if (prop.kind === 'crate' && prop !== this.world.cache) {
        consider('crate', prop, prop.x, prop.y, 66, prop.stolen ? 'The crate is empty' : 'Take from the crate', !prop.stolen);
      } else if (prop.kind === 'garden') {
        consider('garden', prop, prop.x, prop.y, 74, prop.stolen ? 'The garden is bare' : 'Pull from the garden', !prop.stolen);
      } else if (prop.kind === 'cache') {
        consider('cache', prop, prop.x, prop.y, 72, prop.stolen ? 'The cache is empty' : 'Search the old cache');
      }
    }
    for (const c of this.corpses) {
      consider('corpse', c, c.x, c.y, 68, `Butcher the ${c.type}`);
    }
    for (const t of this.traps) {
      if (t.armed) consider('trap', t, t.x, t.y, 54, 'Recover your snare');
    }
    return best;
  }

  updateInteractPrompt() {
    if (this.mode !== 'play') return;
    const it = this.findInteractable();
    this.currentInteract = it;
    if (this.ui) this.ui.setPrompt(it ? it.label : null, it && it.danger);
  }

  interact() {
    if (this.mode !== 'play') return;
    const it = this.findInteractable();
    if (!it) return;
    const p = this.player;
    switch (it.type) {
      case 'npc':
        this.talkTo(it.obj);
        return;
      case 'bush': {
        const b = it.obj;
        if (b.harvested) { this.ui.toast('Picked clean. It will fruit again tomorrow.', '', 2000); return; }
        const n = b.berries || 2;
        b.harvested = true;
        p.berry += n;
        this.audio.sfx('pickup');
        this.addParticles('leaf', b.x, b.y - 4, 6, { color: '#8fa06a' });
        this.addFloat(`+${n} berries`, b.x, b.y - 14, '#c9d5a4', 11);
        this.record({ kind: 'gather', text: `You picked berries in ${this.locationName()}.`, traits: { foraged: 1 }, x: b.x, y: b.y });
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'rock': {
        const r = it.obj;
        if (r.done) return;
        r.hp -= 1;
        p.stone += 2;
        this.audio.sfx('hit');
        this.addParticles('stone', r.x, r.y, 6, {});
        this.addFloat('+2 stone', r.x, r.y - 14, '#b9b9ad', 11);
        if (r.hp <= 0) {
          r.done = true;
          this.addParticles('dust', r.x, r.y, 10, { color: '#8a8a80' });
        }
        this.record({ kind: 'gather', text: `You worked stone loose in ${this.locationName()}.`, traits: { foraged: 1 }, x: r.x, y: r.y });
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'crate': {
        const c = it.obj;
        if (c.stolen) { this.ui.toast('Nothing left but dust and the shape of what was taken.', '', 2200); return; }
        c.stolen = true;
        p.berry += c.loot?.berry || 1;
        p.fiber += c.loot?.fiber || 1;
        this.adjustRep(-13);
        this.audio.sfx('pickup');
        this.addParticles('dust', c.x, c.y, 6, {});
        this.record({
          kind: 'greed', text: 'You emptied a village crate and did not ask.',
          traits: { greed: 1 }, x: c.x, y: c.y
        });
        this.ui.toast('They will notice. They always notice.', 'danger', 3000);
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'garden': {
        const g = it.obj;
        if (g.stolen) { this.ui.toast('Bare earth. Someone has already been here.', '', 2000); return; }
        g.stolen = true;
        p.berry += 3;
        this.adjustRep(-8);
        this.audio.sfx('pickup');
        this.record({ kind: 'greed', text: 'You pulled from the village garden after dark.', traits: { greed: 1 }, x: g.x, y: g.y });
        this.ui.toast('The rows are thinner now.', 'danger', 2400);
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'cache': {
        const c = it.obj;
        if (c.stolen) { this.ui.toast('Empty. Whatever was here is long gone.', '', 2000); return; }
        c.stolen = true;
        p.arrows += c.loot?.arrows || 4;
        p.stone += c.loot?.stone || 3;
        p.torches += c.loot?.torches || 1;
        this.audio.sfx('pickup');
        this.addParticles('spark', c.x, c.y, 10, { color: '#d8b46a' });
        this.record({ kind: 'explore', text: 'You opened the old cache at the Sunken Court.', traits: { explored: 1 }, x: c.x, y: c.y });
        this.ui.toast('Arrows, stone, and one dry torch. The court keeps its debts.', 'good', 3000);
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'fire': {
        const f = it.obj;
        if (p.meat > 0) {
          const n = p.meat;
          p.meat = 0;
          p.cooked += n;
          this.audio.sfx('craft');
          this.addParticles('smoke', f.x, f.y - 12, 8, {});
          this.ui.toast(`You cook ${n} meat over the fire.`, 'good', 2400);
        } else if (this.t - (f.lastUse || -99) > 6) {
          f.lastUse = this.t;
          p.stamina = p.maxStamina;
          p.warmth = Math.min(p.maxWarmth, p.warmth + 22);
          this.advanceMinutes(25);
          this.audio.sfx('pickup');
          this.ui.toast('You sit close and let the fire do its work.', '', 2400);
        }
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'hut': {
        this.sleepInHut(it.obj);
        return;
      }
      case 'cairn': {
        this.lightCairn(it.obj);
        return;
      }
      case 'trap': {
        const t = it.obj;
        t.armed = false;
        p.traps += 1;
        this.traps = this.traps.filter(x => x !== t);
        this.audio.sfx('pickup');
        this.addFloat('+1 snare', t.x, t.y - 12, '#c9b98d', 11);
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      case 'corpse': {
        const c = it.obj;
        p.meat += c.meat;
        this.corpses = this.corpses.filter(x => x !== c);
        this.audio.sfx('pickup');
        this.addFloat(`+${c.meat} meat`, c.x, c.y - 14, '#c9b98d', 11);
        this.addParticles('blood', c.x, c.y, 5, {});
        if (this.ui) this.ui.updateResources(this);
        return;
      }
      default: return;
    }
  }

  sleepInHut(hut) {
    const p = this.player;
    if (this.chronicle.rep <= -25) {
      this.ui.toast(`${hut.name} is barred against you.`, 'danger', 2600);
      return;
    }
    const danger = this.enemies.some(e => !e.dead && !e.fade && dist(e.x, e.y, hut.x, hut.y) < 260);
    if (danger) {
      this.ui.toast('Not with them this close. You would not wake.', 'danger', 2600);
      return;
    }
    const h = this.time.minutes / 60;
    let delta;
    if (h >= 20 || h < 6) {
      delta = h >= 20 ? (DAY_MINUTES - this.time.minutes + 6 * 60) : (6 * 60 - this.time.minutes);
    } else {
      delta = 80;
    }
    this.advanceMinutes(delta);
    p.warmth = Math.min(p.maxWarmth, p.warmth + 36);
    p.stamina = p.maxStamina;
    p.hunger = Math.max(0, p.hunger - 8);
    p.hp = Math.min(p.maxHp, p.hp + 10);
    this.audio.sfx('ui');
    this.record({
      kind: 'sleep', text: `You slept in ${hut.name}. The valley kept working while you did.`,
      traits: {}, x: hut.x, y: hut.y
    });
    this.ui.toast(delta > 100 ? 'You wake at dawn, stiff and alive.' : 'You rest for a while.', 'good', 2800);
  }

  lightCairn(cairn) {
    if (cairn.lit) {
      this.ui.toast(`${cairn.name} is already burning.`, '', 2200);
      return;
    }
    const p = this.player;
    if (p.torches < 1 || p.wood < 3) {
      this.ui.toast('The cairn needs 1 torch and 3 wood. The stones are patient.', 'danger', 3000);
      return;
    }
    p.torches -= 1;
    p.wood -= 3;
    cairn.lit = true;
    this.audio.sfx('cairn');
    this.addParticles('ember', cairn.x, cairn.y - 20, 34, { speed: 80 });
    this.addParticles('spark', cairn.x, cairn.y - 20, 20, { color: '#f0c07a' });
    this.shake = Math.max(this.shake, 0.5);
    this.adjustRep(12);
    const lit = this.objective();
    this.record({
      kind: 'cairn',
      text: `You lit ${cairn.name}. The old road remembers fire.`,
      traits: { explored: 1 },
      x: cairn.x, y: cairn.y
    });
    this.ui.toast(`${cairn.name.toUpperCase()} IS LIT · ${lit.lit} of ${lit.total}`, 'learn', 4200);
    spawnWave(this, cairn, 2 + Math.floor(this.nightLevel() * 2));
    if (lit.lit >= lit.total) {
      this.winTimer = 2.8;
      this.ui.toast('The three fires answer one another. The valley is holding its breath.', 'learn', 5000);
    }
    if (this.ui) this.ui.updateResources(this);
  }
}

