/* Core simulation: the submarine, the ocean, the things that live in it. */
import {
  TAU, clamp, damp, dist, angleTo, rand, randInt,
} from './utils.js';
import {
  WORLD, ZONES, CHESTS, TOTAL_CHESTS, UPGRADES, upgradesAt,
  zoneAt, depthAt, createWorld,
} from './world.js';
import { DEFAULT_UPGRADES, loadSave, writeSave, clearSave } from './save.js';
import { OceanAudio } from './audio.js';
import { Hud } from './hud.js';

const START_SALVAGE = 40;
const OXYGEN_RESPAWN = 26;
const AUTOSAVE_EVERY = 12;
const SONAR_COOLDOWN = 12;
const SONAR_RADIUS = 980;
const INTERACT_RANGE = 142;
const PLAYER_RADIUS = 34;

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
]);

export class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.canvas = renderer.canvas;
    this.loadedSave = loadSave();
    this.muted = this.loadedSave?.muted ?? false;
    this.audio = new OceanAudio(this.muted);
    this.world = createWorld();
    this.time = 0;
    this.mode = 'title';
    this.titleSub = true;
    this.startedAt = Date.now();
    this.keys = new Set();
    this.joystick = { x: 0, y: 0 };
    this.boostInput = false;

    this.hud = new Hud(this);
    this._resetExpedition(this.loadedSave);
    this._bindInput();
    this._snapCamera(true);
    this.hud.showTitle(this.loadedSave);
    this._syncObjective(true);
    this.hud.sync();
  }

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  _resetExpedition(save) {
    const base = upgradesAt(save?.upgrades || {});
    const savedPlayer = save?.player;
    const startX = savedPlayer?.x ?? WORLD.spawn.x;
    const startY = savedPlayer?.y ?? WORLD.spawn.y;

    this.upgrades = { ...DEFAULT_UPGRADES, ...(save?.upgrades || {}) };
    this.salvage = save?.salvage ?? START_SALVAGE;
    this.relics = save?.relics ?? 0;
    this.openedChests = new Set(save?.opened || []);
    this.discovered = new Set(save?.discovered?.length ? save.discovered : ['shallows']);
    this.collected = new Set(save?.collected || []);
    this.completed = Boolean(save?.completed);
    this.startedAt = save?.startedAt || Date.now();
    this.stats = {
      dives: save?.stats?.dives || 0,
      time: save?.stats?.time || 0,
      bestDepth: save?.stats?.bestDepth || 0,
      resources: save?.stats?.resources || 0,
      creaturesSeen: save?.stats?.creaturesSeen || 0,
    };

    this.player = {
      x: WORLD.spawn.x,
      y: WORLD.spawn.y,
      vx: 0,
      vy: 0,
      facing: savedPlayer?.facing || 1,
      speed: base.speed,
      healthMax: base.health,
      health: clamp(savedPlayer?.health ?? base.health, 1, base.health),
      oxygenMax: base.oxygen,
      oxygen: clamp(savedPlayer?.oxygen ?? base.oxygen, 0, base.oxygen),
      ratedDepth: base.pressure,
      lampScale: base.light,
      magnetRadius: base.magnet,
      lightsOn: true,
      invulnerable: 0,
      boosting: false,
    };
    this.magnetRadius = base.magnet;
    this.resumePos = save ? { x: startX, y: startY } : null;

    this.chests = CHESTS.map(chest => ({
      ...chest,
      opened: this.openedChests.has(chest.id),
      pingUntil: 0,
    }));

    this.resources = this.world.resources.map(res => {
      const oxygen = res.type === 'oxygen';
      return {
        ...res,
        respawns: oxygen ? true : res.respawns,
        collected: !oxygen && this.collected.has(res.id),
        collectedAt: -Infinity,
        pingUntil: 0,
      };
    });

    this.creatures = this.world.creatures.map(creature => ({
      ...creature,
      hurtCooldown: 0,
      seen: false,
    }));

    this.bubbles = [];
    this.particles = [];
    this.pulse = null;
    this.damageFlash = 0;
    this.shake = 0;
    this.sonarCooldown = 0;
    this.sonarMax = SONAR_COOLDOWN;
    this.pressureOver = false;
    this.currentZone = zoneAt(WORLD.spawn.y);
    this.nearChest = null;
    this.victoryTimer = 0;
    this.warnTimer = 0;
    this.suffocating = false;
    this.saveTimer = 0;
    this.uiTimer = 0;
    this.objectiveTimer = 0;
    this.bubbleTimer = 0;
    this.ambientTimer = 0;
    this.audioDepth = -1;
    this.boosting = false;
    this.boostInput = false;
    this.joystick.x = 0;
    this.joystick.y = 0;
    this.keys.clear();

    this.camera = {
      x: WORLD.spawn.x - 190,
      y: WORLD.spawn.y - 110,
      shakeX: 0,
      shakeY: 0,
    };
  }

  _applyUpgrades(grow = false) {
    const stats = upgradesAt(this.upgrades);
    const p = this.player;
    if (grow) {
      const healthGain = stats.health - p.healthMax;
      const oxygenGain = stats.oxygen - p.oxygenMax;
      if (healthGain > 0) p.health = Math.min(stats.health, p.health + healthGain);
      if (oxygenGain > 0) p.oxygen = Math.min(stats.oxygen, p.oxygen + oxygenGain);
    }
    p.healthMax = stats.health;
    p.oxygenMax = stats.oxygen;
    p.speed = stats.speed;
    p.ratedDepth = stats.pressure;
    p.lampScale = stats.light;
    this.magnetRadius = stats.magnet;
  }

  _saveData() {
    return {
      upgrades: { ...this.upgrades },
      salvage: this.salvage,
      relics: this.relics,
      opened: [...this.openedChests],
      discovered: [...this.discovered],
      collected: [...this.collected],
      player: {
        x: this.player.x,
        y: this.player.y,
        oxygen: this.player.oxygen,
        health: this.player.health,
        facing: this.player.facing,
      },
      stats: { ...this.stats },
      completed: this.completed,
      muted: this.muted,
      startedAt: this.startedAt,
    };
  }

  saveGame(manual = false) {
    if (!['playing', 'paused', 'fabricator', 'victory'].includes(this.mode)) return false;
    const ok = writeSave(this._saveData());
    if (ok) this.hud.flashSave();
    if (manual && !ok) this.hud.toast('Could not write local save', 'danger', 'i-warning');
    return ok;
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */
  _bindInput() {
    window.addEventListener('keydown', event => {
      const code = event.code;
      if (MOVE_KEYS.has(code) || code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
        event.preventDefault();
      }
      if (MOVE_KEYS.has(code)) this.keys.add(code);
      if ((code === 'ShiftLeft' || code === 'ShiftRight') && !event.repeat) this.setBoost(true);

      if (event.repeat) return;
      if (code === 'Enter' && this.mode === 'title') { this.startGame(); return; }
      if (code === 'Escape') { this._handleEscape(); return; }
      if (code === 'KeyU') { this._toggleFabricator(); return; }
      if (code === 'Space' && this.mode === 'playing') { this.triggerSonar(); return; }
      if (code === 'KeyE' && this.mode === 'playing') { this.interact(); return; }
      if (code === 'KeyM') this.toggleMute();
    });

    window.addEventListener('keyup', event => {
      this.keys.delete(event.code);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.setBoost(false);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.setBoost(false);
      this.setJoystick(0, 0);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.saveGame(false);
    });
    window.addEventListener('pagehide', () => this.saveGame(false));
  }

  _handleEscape() {
    if (this.mode === 'fabricator') { this.closeFabricator(); return; }
    if (this.mode === 'paused') { this.resumeGame(); return; }
    if (this.mode === 'playing') this.pauseGame();
  }

  setBoost(value) {
    this.boostInput = Boolean(value);
  }

  setJoystick(x, y) {
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.joystick.x = Number.isFinite(x) ? x : 0;
    this.joystick.y = Number.isFinite(y) ? y : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle / overlays                                                */
  /* ------------------------------------------------------------------ */
  startGame() {
    if (this.mode !== 'title') return;
    this.audio.init();
    this.audio.setMuted(this.muted, true);
    this.audio.ui();

    if (this.resumePos) {
      this.player.x = clamp(this.resumePos.x, 90, WORLD.w - 90);
      this.player.y = clamp(this.resumePos.y, WORLD.surface + 50, WORLD.h - 100);
      this.resumePos = null;
    }
    this.mode = 'playing';
    this.titleSub = true;
    this.player.invulnerable = Math.max(this.player.invulnerable, 1.2);
    this.currentZone = zoneAt(this.player.y);
    this.discovered.add(this.currentZone.id);
    this.stats.dives += 1;
    this.hud.hideTitle();
    this.hud.closePause();
    this.hud.closeFabricator();
    this.hud.hideGameOver();
    this.hud.hideVictory();
    this.hud.showBanner(this.currentZone);
    this._snapCamera();
    this._syncObjective(true);
    this.hud.sync();
    this.saveTimer = 0;
  }

  newExpedition() {
    clearSave();
    this.loadedSave = null;
    this.world = createWorld();
    this._resetExpedition(null);
    this.mode = 'title';
    this.titleSub = true;
    this.hud.hideTitle();
    this.hud.closePause();
    this.hud.closeFabricator();
    this.hud.hideGameOver();
    this.hud.hideVictory();
    this.mode = 'playing';
    this.audio.init();
    this.audio.setMuted(this.muted, true);
    this.player.invulnerable = 2;
    this.currentZone = zoneAt(this.player.y);
    this.discovered.add(this.currentZone.id);
    this.stats.dives = 1;
    this.hud.showBanner(this.currentZone);
    this._snapCamera();
    this._syncObjective(true);
    this.hud.sync();
    this.saveGame(true);
    this.hud.toast('New expedition launched', 'gold', 'i-anchor');
  }

  pauseGame() {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.setBoost(false);
    this.setJoystick(0, 0);
    this.keys.clear();
    this.player.boosting = false;
    this.hud.setPauseStats();
    this.hud.openPause();
    this.audio.ui();
    this.saveGame(false);
  }

  resumeGame() {
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    this.hud.closePause();
    this.audio.ui();
  }

  _toggleFabricator() {
    if (this.mode === 'fabricator') this.closeFabricator();
    else if (this.mode === 'playing') this.openFabricator();
  }

  openFabricator() {
    if (this.mode !== 'playing') return;
    this.mode = 'fabricator';
    this.setBoost(false);
    this.setJoystick(0, 0);
    this.keys.clear();
    this.player.boosting = false;
    this.hud.openFabricator();
    this.audio.ui();
    this.saveGame(false);
  }

  closeFabricator() {
    if (this.mode !== 'fabricator') return;
    this.mode = 'playing';
    this.hud.closeFabricator();
    this.audio.ui();
  }

  returnToTitle() {
    if (this.mode === 'dead') {
      this.hud.hideGameOver();
      this.mode = 'playing';
    }
    this.saveGame(true);
    this.resumePos = { x: this.player.x, y: this.player.y };
    this.player.x = WORLD.spawn.x;
    this.player.y = WORLD.spawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.boosting = false;
    this.mode = 'title';
    this.titleSub = true;
    this.setBoost(false);
    this.setJoystick(0, 0);
    this.keys.clear();
    this.hud.closePause();
    this.hud.closeFabricator();
    this.hud.hideGameOver();
    this.hud.hideVictory();
    this.hud.showTitle(this._saveData());
    this._snapCamera(true);
    this.audio.ui();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audio.init();
    this.audio.setMuted(this.muted);
    this.audio.setDepth(this.audioDepth >= 0 ? this.audioDepth : depthAt(this.player.y));
    this.hud.setMuted(this.muted);
    if (!this.muted) this.audio.ui();
    if (this.mode !== 'title') this.saveGame(false);
  }

  /* ------------------------------------------------------------------ */
  /* Fabricator                                                          */
  /* ------------------------------------------------------------------ */
  buyUpgrade(id) {
    if (this.mode !== 'fabricator') return;
    const def = UPGRADES.find(up => up.id === id);
    if (!def) return;
    const level = this.upgrades[id] || 0;
    if (level >= def.max) return;
    const cost = def.costs[level];
    if (this.salvage < cost) {
      this.hud.toast(`Need ${cost - Math.round(this.salvage)} more salvage`, 'danger', 'i-salvage');
      this.audio.warn();
      return;
    }
    this.salvage -= cost;
    this.upgrades[id] = level + 1;
    this._applyUpgrades(true);
    this.audio.upgrade();
    this.hud.renderFabricator();
    this.hud.sync();
    this.hud.toast(`${def.name} installed · LV ${level + 1}`, 'gold', 'i-upgrade');
    this.saveGame(true);
  }

  repairHull() {
    if (this.mode !== 'fabricator') return;
    const p = this.player;
    const cost = 20;
    if (p.health >= p.healthMax) {
      this.hud.toast('Hull already at full integrity', '', 'i-hull');
      return;
    }
    if (this.salvage < cost) {
      this.hud.toast('Need 20 scrap for repairs', 'danger', 'i-salvage');
      this.audio.warn();
      return;
    }
    this.salvage -= cost;
    p.health = Math.min(p.healthMax, p.health + 50);
    this.audio.pickup('repair');
    this.hud.renderFabricator();
    this.hud.sync();
    this.hud.toast('Hull patched · +50', 'gold', 'i-hull');
    this.saveGame(true);
  }

  /* ------------------------------------------------------------------ */
  /* Interaction                                                         */
  /* ------------------------------------------------------------------ */
  _nearestChest(range = INTERACT_RANGE) {
    let best = null;
    let bestD = range;
    for (const chest of this.chests) {
      if (chest.opened) continue;
      const d = dist(this.player.x, this.player.y, chest.x, chest.y);
      if (d < bestD) { bestD = d; best = chest; }
    }
    return best;
  }

  interact() {
    if (this.mode !== 'playing') return;
    const chest = this._nearestChest();
    if (!chest) return;
    this._openChest(chest);
  }

  _openChest(chest) {
    if (chest.opened) return;
    chest.opened = true;
    chest.pingUntil = 0;
    this.openedChests.add(chest.id);
    this.salvage += chest.salvage;
    this.relics += chest.relics;
    this.stats.resources += 1;
    this.audio.chest();
    this.hud.bumpResource('chest');
    this.hud.bumpResource('salvage');
    if (chest.relics > 0) this.hud.bumpResource('relic');
    this.hud.toast(`${chest.name} · +${chest.salvage} scrap · +${chest.relics} relic${chest.relics > 1 ? 's' : ''}`, 'gold', 'i-chest');
    this._textPopup(chest.x, chest.y - 20, `+${chest.salvage} SCRAP`, '#ffd989', 13);
    this._textPopup(chest.x, chest.y - 40, `+${chest.relics} RELIC${chest.relics > 1 ? 'S' : ''}`, '#c9b4ff', 11);
    this._burst(chest.x, chest.y, '#ffd36f', 44, { speed: 150, size: 3 });
    this._burst(chest.x, chest.y, '#fff6cc', 18, { speed: 90, size: 2 });
    this.particles.push({
      x: chest.x, y: chest.y, vx: 0, vy: 0, life: 1, maxLife: 1,
      type: 'ring', radius: 90, color: '#ffe6a0', line: 2.5,
    });
    this._syncObjective(true);
    this._syncInteract();
    this.saveGame(true);

    if (this.openedChests.size >= TOTAL_CHESTS) {
      this.victoryTimer = 1.7;
      this.hud.toast('All caches recovered — return to the surface', 'gold', 'i-relic');
    }
  }

  triggerSonar() {
    if (this.mode !== 'playing' || this.sonarCooldown > 0) return;
    this.sonarCooldown = this.sonarMax;
    this.pulse = {
      x: this.player.x, y: this.player.y, t: 0, maxT: 1.5, radius: 1100,
    };
    this.audio.sonar();
    let found = 0;
    for (const chest of this.chests) {
      if (chest.opened) continue;
      if (dist(this.player.x, this.player.y, chest.x, chest.y) < 1900) {
        chest.pingUntil = this.time + 7;
        found++;
      }
    }
    for (const res of this.resources) {
      if (res.collected) continue;
      if (dist(this.player.x, this.player.y, res.x, res.y) < SONAR_RADIUS) res.pingUntil = this.time + 6;
    }
    for (const c of this.creatures) {
      if (dist(this.player.x, this.player.y, c.x, c.y) > SONAR_RADIUS) continue;
      if (c.type === 'shark' || c.type === 'angler' || c.type === 'jelly') c.stun = Math.max(c.stun || 0, 3.4);
      if (c.type === 'school') c.flee = 2;
    }
    this.hud.toast(found ? `${found} cache signal${found > 1 ? 's' : ''} found` : 'No caches in sonar range', '', 'i-sonar');
    this.player.invulnerable = Math.max(this.player.invulnerable, 0.4);
  }

  /* ------------------------------------------------------------------ */
  /* Simulation                                                          */
  /* ------------------------------------------------------------------ */
  update(dt) {
    dt = clamp(dt || 0, 0, 0.05);
    this.time += dt;

    if (this.mode === 'playing') this._updatePlaying(dt);
    else if (this.mode === 'title') this._updateTitle(dt);

    if (this.sonarCooldown > 0) this.sonarCooldown = Math.max(0, this.sonarCooldown - dt);
    if (this.pulse) {
      this.pulse.t += dt;
      if (this.pulse.t >= this.pulse.maxT) this.pulse = null;
    }
    this.damageFlash = Math.max(0, this.damageFlash - dt * 1.8);
    this._updateCamera(dt);
    this._updateBubbles(dt);
    this._updateParticles(dt);

    this.uiTimer += dt;
    if (this.uiTimer >= 0.08) {
      this.uiTimer = 0;
      if (this.mode === 'playing' || this.mode === 'paused' || this.mode === 'fabricator') {
        this.hud.sync();
        if (this.mode === 'playing') this._syncInteract();
      }
    }
  }

  _updateTitle(dt) {
    const p = this.player;
    p.vx = 0;
    p.vy = 0;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.facing = 1;
    p.lightsOn = true;
    p.boosting = false;
    if (Math.random() < dt * 2.2) {
      this._addBubble(
        p.x - 52 + rand(-8, 8),
        p.y + rand(-8, 8),
        rand(1, 3),
        rand(-45, -20),
        rand(-12, 12),
        rand(1.8, 3.6),
      );
    }
  }

  _updatePlaying(dt) {
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    this.stats.time += dt;

    // Input direction.
    let ix = 0;
    let iy = 0;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy -= 1;
    ix += this.joystick.x;
    iy += this.joystick.y;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    const moving = Math.hypot(ix, iy) > 0.12;
    const boost = this.boostInput && moving;
    this.boosting = boost;
    p.boosting = boost;
    const topSpeed = p.speed * (boost ? 1.55 : 1);
    const accel = boost ? 6.8 : 4.7;
    p.vx = damp(p.vx, ix * topSpeed, accel, dt);
    p.vy = damp(p.vy, iy * topSpeed, accel, dt);

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (ix > 0.15) p.facing = 1;
    else if (ix < -0.15) p.facing = -1;

    p.x = clamp(p.x, 80, WORLD.w - 80);
    p.y = clamp(p.y, WORLD.surface + 42, WORLD.h - 90);
    this._resolveCollisions();

    // Engine bubbles and the occasional ambient fizz.
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = boost ? 0.035 : 0.085;
      const spread = 0.6 + Math.abs(p.vx) / Math.max(1, p.speed);
      if (Math.abs(p.vx) + Math.abs(p.vy) > 24) {
        this._addBubble(
          p.x - p.facing * (48 + rand(0, 8)) + rand(-5, 5),
          p.y + rand(-7, 7),
          rand(1, 3.2) * spread,
          rand(-52, -22),
          -p.facing * rand(6, 30) + p.vx * 0.12,
          rand(1.4, 3.2),
        );
      }
    }
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) {
      this.ambientTimer = rand(0.18, 0.55);
      const halfW = this.renderer.W / (2 * this.renderer.zoom);
      const halfH = this.renderer.H / (2 * this.renderer.zoom);
      this._addBubble(
        this.camera.x + rand(-halfW, halfW),
        this.camera.y + rand(-halfH * 0.2, halfH),
        rand(0.7, 2.4),
        rand(-30, -12),
        rand(-6, 6),
        rand(2, 4.5),
      );
    }

    // World position bookkeeping.
    const depth = depthAt(p.y);
    this.stats.bestDepth = Math.max(this.stats.bestDepth, depth);
    const zone = zoneAt(p.y);
    if (zone.id !== this.currentZone.id) {
      this.currentZone = zone;
      this.discovered.add(zone.id);
      this.hud.showBanner(zone);
      this.audio.zone();
      this._hintZone(zone);
    }

    this._collectResources(dt);
    this._updateCreatures(dt, depth);
    this._updateLifeSupport(dt, depth);
    this._updatePressure(dt, depth);

    p.lightsOn = true;

    if (Math.abs(depth - this.audioDepth) > 16) {
      this.audioDepth = depth;
      this.audio.setDepth(depth);
    }
    this.audio.update(dt, true);

    this.objectiveTimer -= dt;
    if (this.objectiveTimer <= 0) {
      this.objectiveTimer = 0.7;
      this._syncObjective();
    }

    if (this.victoryTimer > 0) {
      this.victoryTimer -= dt;
      if (this.victoryTimer <= 0) this._win();
    }

    this.saveTimer += dt;
    if (this.saveTimer >= AUTOSAVE_EVERY) {
      this.saveTimer = 0;
      this.saveGame(false);
    }

    this.boostInput = this.boostInput && !this.keys.has('Escape');
  }

  _hintZone(zone) {
    const hints = {
      shallows: 'Coral gardens ahead. Salvage the shallows, then refit.',
      twilight: 'The light is thinning. Watch your oxygen and your depth rating.',
      midnight: 'Thermal vents ahead. Air pockets are rare this deep.',
      abyss: 'Nothing down here was built for you. Keep the hull together.',
    };
    this.hud.toast(hints[zone.id] || zone.tagline, '', 'i-anchor');
  }

  _resolveCollisions() {
    const p = this.player;
    for (const col of this.world.colliders) {
      if (!col) continue;
      const dx = p.x - col.x;
      const dy = p.y - col.y;
      if (Math.abs(dx) > col.rx + 70 || Math.abs(dy) > col.ry + 60) continue;
      const rx = col.rx + PLAYER_RADIUS * 0.6;
      const ry = col.ry + PLAYER_RADIUS * 0.4;
      const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (n >= 1 || n < 0.0001) continue;
      const scale = 1 / Math.sqrt(n);
      p.x = col.x + dx * scale;
      p.y = col.y + dy * scale;
      const nx = dx / (rx * rx);
      const ny = dy / (ry * ry);
      const len = Math.hypot(nx, ny) || 1;
      const dot = (p.vx * nx + p.vy * ny) / len;
      if (dot < 0) {
        p.vx -= (nx / len) * dot * 1.15;
        p.vy -= (ny / len) * dot * 1.15;
      }
      p.vx *= 0.88;
      p.vy *= 0.88;
    }
  }

  _collectResources(dt) {
    const p = this.player;
    for (const res of this.resources) {
      if (res.collected) {
        if (res.respawns && this.time - res.collectedAt > OXYGEN_RESPAWN) {
          res.collected = false;
          res.collectedAt = -Infinity;
          res.phase = rand(0, TAU);
          this._burst(res.x, res.y, '#72e9ff', 8, { speed: 38, size: 1.6 });
        }
        continue;
      }
      const reach = this.magnetRadius + res.radius + 18;
      if (dist(p.x, p.y, res.x, res.y) > reach) continue;

      res.collected = true;
      res.collectedAt = this.time;
      res.pingUntil = 0;
      this.stats.resources += 1;
      this.audio.pickup(res.type);
      this.hud.bumpResource('salvage');

      if (res.type === 'oxygen') {
        p.oxygen = Math.min(p.oxygenMax, p.oxygen + res.value);
        this._textPopup(res.x, res.y, `+${res.value} O₂`, '#7cefff', 11);
        this._burst(res.x, res.y, '#8ff5ff', 16, { speed: 76, size: 2.1 });
        for (let i = 0; i < 3; i++) {
          this._addBubble(res.x + rand(-8, 8), res.y + rand(-8, 8), rand(1.4, 3), rand(-70, -32), rand(-10, 10), rand(1.4, 3));
        }
        this.suffocating = false;
      } else if (res.type === 'repair') {
        p.health = Math.min(p.healthMax, p.health + res.value);
        this._textPopup(res.x, res.y, `+${res.value} HULL`, '#9cf7a8', 11);
        this._burst(res.x, res.y, '#9cf7a8', 16, { speed: 70, size: 2 });
      } else {
        this.salvage += res.value;
        this.collected.add(res.id);
        const label = res.type === 'pearl' ? 'PEARL' : res.type === 'crystal' ? 'CRYSTAL' : 'SCRAP';
        const color = res.type === 'pearl' ? '#f8edff' : res.type === 'crystal' ? '#8ffff2' : '#ffd989';
        this._textPopup(res.x, res.y, `+${res.value} ${label}`, color, 10);
        this._burst(res.x, res.y, color, 14, { speed: 66, size: 2 });
      }
      if (!res.respawns && res.type !== 'oxygen') this.collected.add(res.id);
      this._syncObjective(true);
    }
    if (dt < 0) this._syncObjective(true);
  }

  _updateLifeSupport(dt, depth) {
    const p = this.player;
    const drain = 0.4 + (depth / 1850) * 0.56 + (p.boosting ? 0.38 : 0);
    p.oxygen = Math.max(0, p.oxygen - drain * dt);

    if (p.oxygen <= 0) {
      if (!this.suffocating) {
        this.suffocating = true;
        this.hud.toast('Oxygen depleted — hull taking damage', 'danger', 'i-oxygen');
        this.audio.warn();
      }
      p.health -= 10 * dt;
      this.damageFlash = Math.max(this.damageFlash, 0.18);
      this.warnTimer -= dt;
      if (this.warnTimer <= 0) {
        this.warnTimer = 2.4;
        this.audio.warn();
      }
    } else {
      this.suffocating = false;
      // A gentle trickle of repair in friendly, shallow water.
      if (depth < 400 && p.oxygen / p.oxygenMax > 0.55 && p.health < p.healthMax) {
        p.health = Math.min(p.healthMax, p.health + 0.32 * dt);
      }
    }

    if (p.oxygen / p.oxygenMax < 0.18 && p.oxygen > 0) {
      this.warnTimer -= dt;
      if (this.warnTimer <= 0) {
        this.warnTimer = 3.4;
        this.audio.warn();
      }
    }

    if (p.health <= 0) this._die('life support');
  }

  _updatePressure(dt, depth) {
    const p = this.player;
    const over = depth > p.ratedDepth;
    if (over !== this.pressureOver) {
      this.pressureOver = over;
      if (over) {
        this.hud.toast(`Hull pressure exceeded · rated ${p.ratedDepth} m`, 'danger', 'i-warning');
        this.audio.warn();
        this.shake = Math.max(this.shake, 7);
        this.warnTimer = 0;
      } else if (depth <= p.ratedDepth) {
        this.hud.toast('Pressure nominal', '', 'i-hull');
      }
    }
    if (!over) return;
    const overshoot = depth - p.ratedDepth;
    const rate = 2.2 + Math.min(9, overshoot / 90);
    p.health -= rate * dt;
    this.damageFlash = Math.max(this.damageFlash, 0.12 + Math.min(0.28, overshoot / 1400));
    this.shake = Math.max(this.shake, 2.4 + Math.min(5, overshoot / 300));
    this.warnTimer -= dt;
    if (this.warnTimer <= 0) {
      this.warnTimer = 2.2;
      this.audio.warn();
    }
    if (p.health <= 0) this._die('pressure');
  }

  _die(reason) {
    if (this.mode !== 'playing') return;
    this.player.health = 0;
    this.player.boosting = false;
    this.boosting = false;
    this.mode = 'dead';
    this.setBoost(false);
    this.setJoystick(0, 0);
    this.keys.clear();
    const lost = Math.min(this.salvage, Math.max(8, Math.round(this.salvage * 0.3)));
    this.salvage = Math.max(0, this.salvage - lost);
    const depth = depthAt(this.player.y);
    this.audio.death();
    this.shake = 16;
    this.damageFlash = 1;
    this._burst(this.player.x, this.player.y, '#ff9a6d', 34, { speed: 130, size: 3 });
    this.hud.showGameOver({ depth, lost, reason });
    this.hud.setInteract(null);
  }

  respawn() {
    if (this.mode !== 'dead') return;
    const p = this.player;
    p.x = WORLD.spawn.x;
    p.y = WORLD.spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.health = p.healthMax;
    p.oxygen = p.oxygenMax;
    p.invulnerable = 2.5;
    p.boosting = false;
    this.suffocating = false;
    this.pressureOver = false;
    this.currentZone = zoneAt(p.y);
    this.mode = 'playing';
    this.victoryTimer = 0;
    this.hud.hideGameOver();
    this.hud.showBanner(this.currentZone);
    this._snapCamera();
    this._syncObjective(true);
    this.hud.sync();
    this.saveGame(true);
    this.audio.ui();
  }

  _win() {
    if (this.mode !== 'playing') return;
    this.mode = 'victory';
    this.completed = true;
    this.player.boosting = false;
    this.setBoost(false);
    this.setJoystick(0, 0);
    this.keys.clear();
    this.hud.showVictory({ depth: this.stats.bestDepth });
    this.audio.chest();
    this.saveGame(true);
  }

  continueExploring() {
    if (this.mode !== 'victory') return;
    this.mode = 'playing';
    this.hud.hideVictory();
    this.hud.sync();
    this.audio.ui();
  }

  /* ------------------------------------------------------------------ */
  /* Creatures                                                           */
  /* ------------------------------------------------------------------ */
  _updateCreatures(dt, depth) {
    const p = this.player;
    for (const c of this.creatures) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy);
      if (!c.seen && d < 650) {
        c.seen = true;
        this.stats.creaturesSeen += 1;
      }
      if (c.stun > 0) {
        c.stun = Math.max(0, c.stun - dt);
        c.state = 'stunned';
        continue;
      }
      if (c.hurtCooldown > 0) c.hurtCooldown = Math.max(0, c.hurtCooldown - dt);

      if (c.type === 'school') {
        if (d < 270) {
          c.flee = Math.max(c.flee, 1.1);
          c.dir = c.x < p.x ? -1 : 1;
        } else {
          c.flee = Math.max(0, c.flee - dt);
        }
        const wanderX = Math.sin(this.time * (0.25 + c.speed * 0.2) + c.phase) * 88;
        const wanderY = Math.cos(this.time * (0.2 + c.speed * 0.18) + c.phase * 1.7) * 44;
        const awayX = c.flee > 0 ? (c.x < p.x ? -1 : 1) * 210 : 0;
        const awayY = c.flee > 0 ? (c.y < p.y ? -1 : 1) * 80 : 0;
        c.x = damp(c.x, c.homeX + wanderX + awayX, c.flee > 0 ? 2.2 : 0.34, dt);
        c.y = damp(c.y, c.homeY + wanderY + awayY, c.flee > 0 ? 1.5 : 0.5, dt);
        if (c.flee <= 0) c.dir = c.homeX > c.x ? 1 : -1;
      } else if (c.type === 'jelly') {
        c.x = c.homeX + Math.sin(this.time * 0.22 + c.phase) * (26 + Math.abs(c.driftX) * 2.2);
        c.y = c.homeY + Math.sin(this.time * 0.3 + c.phase * 1.7) * 24 + Math.sin(this.time * 0.12 + c.phase) * 18;
        if (c.hazard && d < c.size * 0.62 + 26) {
          this._damage(4 + depth / 700, 'jellyfish', c.x, c.y, 90);
        }
      } else if (c.type === 'shark') {
        this._updateShark(c, dt, d, dx, dy);
      } else if (c.type === 'angler') {
        this._updateAngler(c, dt, d, dx, dy);
      } else if (c.type === 'manta') {
        c.x += (c.dir || 1) * c.speed * dt;
        c.y += Math.sin(this.time * 0.24 + c.phase) * 7 * dt;
        if (c.x > WORLD.w - 280) c.dir = -1;
        if (c.x < 280) c.dir = 1;
      }
    }
  }

  _updateShark(c, dt, d, dx, dy) {
    const p = this.player;
    c.biteCooldown = Math.max(0, (c.biteCooldown || 0) - dt);
    if (c.angle === undefined) c.angle = c.patrolAngle || 0;
    const detect = 430 + (this.player.pressureOver ? 60 : 0);
    if (d < detect) {
      c.state = d < 96 ? 'bite' : 'chase';
      c.alert = 1;
    } else if (d > 820) {
      c.state = 'patrol';
      c.alert = 0;
    }

    if (c.state === 'chase' || c.state === 'bite') {
      const desired = Math.atan2(dy, dx);
      let diff = ((desired - c.angle + Math.PI * 3) % TAU) - Math.PI;
      c.angle += clamp(diff, -2.3 * dt, 2.3 * dt);
      const speed = c.speed * (c.state === 'bite' ? 1.55 : 1.05);
      c.x += Math.cos(c.angle) * speed * dt;
      c.y += Math.sin(c.angle) * speed * dt;
      if (d < 52 * c.size + 36 && c.biteCooldown <= 0) {
        c.biteCooldown = 1.75;
        this._damage(13 + c.size * 7, 'shark', c.x, c.y, 220);
      }
    } else {
      c.patrolAngle += Math.sin(this.time * 0.24 + c.phase) * dt * 0.45;
      const tx = c.homeX + Math.cos(c.patrolAngle) * 280;
      const ty = c.homeY + Math.sin(c.patrolAngle * 0.82 + c.phase) * 170;
      const desired = angleTo(c.x, c.y, tx, ty);
      let diff = ((desired - c.angle + Math.PI * 3) % TAU) - Math.PI;
      c.angle += clamp(diff, -1.5 * dt, 1.5 * dt);
      c.x += Math.cos(c.angle) * c.speed * 0.43 * dt;
      c.y += Math.sin(c.angle) * c.speed * 0.43 * dt;
    }
    c.x = clamp(c.x, 100, WORLD.w - 100);
    c.y = clamp(c.y, WORLD.surface + 80, WORLD.h - 100);
  }

  _updateAngler(c, dt, d, dx, dy) {
    c.biteCooldown = Math.max(0, (c.biteCooldown || 0) - dt);
    if (c.lunge === undefined) c.lunge = 0;
    if (d < 360) {
      c.state = d < 112 ? 'lunge' : 'chase';
      c.alert = 1;
      c.dir = dx >= 0 ? 1 : -1;
    } else if (d > 520) {
      c.state = 'lurk';
      c.alert = 0;
    }

    if (c.state === 'chase' || c.state === 'lunge') {
      c.lunge = Math.max(0, c.lunge - dt);
      const speed = c.speed * (c.state === 'lunge' ? 1.4 : 0.72);
      const len = d || 1;
      c.x += (dx / len) * speed * dt;
      c.y += (dy / len) * speed * dt + Math.sin(this.time * 1.4 + c.phase) * 8 * dt;
      if (d < 46 * c.size + 30 && c.biteCooldown <= 0) {
        c.biteCooldown = 1.9;
        this._damage(11 + c.size * 6, 'anglerfish', c.x, c.y, 190);
      }
    } else {
      c.x = damp(c.x, c.homeX + Math.sin(this.time * 0.18 + c.phase) * 44, 0.4, dt);
      c.y = damp(c.y, c.homeY + Math.cos(this.time * 0.14 + c.phase * 1.3) * 26, 0.35, dt);
    }
    c.x = clamp(c.x, 90, WORLD.w - 90);
    c.y = clamp(c.y, WORLD.surface + 80, WORLD.h - 100);
  }

  _damage(amount, source, fromX, fromY, knockback = 120) {
    const p = this.player;
    if (this.mode !== 'playing' || p.invulnerable > 0) return;
    p.health = Math.max(0, p.health - amount);
    p.invulnerable = 1.45;
    this.damageFlash = Math.max(this.damageFlash, 0.9);
    this.shake = Math.max(this.shake, 10);
    this.audio.hurt();
    this._burst(p.x, p.y, '#ff8a72', 18, { speed: 110, size: 2.6 });
    this._textPopup(p.x, p.y - 24, `-${Math.round(amount)} HULL`, '#ff9f8b', 11);
    if (Number.isFinite(fromX) && Number.isFinite(fromY)) {
      const a = angleTo(fromX, fromY, p.x, p.y);
      p.vx += Math.cos(a) * knockback;
      p.vy += Math.sin(a) * knockback;
    }
    if (p.health <= 0) this._die(source);
  }

  /* ------------------------------------------------------------------ */
  /* Camera / particles                                                  */
  /* ------------------------------------------------------------------ */
  _snapCamera(title = false) {
    const p = this.player;
    const r = this.renderer;
    if (title) {
      this.camera.x = p.x - 190;
      this.camera.y = p.y - 110;
    } else {
      this.camera.x = p.x + clamp(p.vx / Math.max(1, p.speed), -1, 1) * 70;
      this.camera.y = p.y + clamp(p.vy / Math.max(1, p.speed), -1, 1) * 52 - 20;
    }
    this.camera.x = clamp(this.camera.x, 40, WORLD.w - 40);
    this.camera.y = clamp(this.camera.y, r.H ? 40 : 40, WORLD.h - 40);
    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
    this.shake = 0;
  }

  _updateCamera(dt) {
    const p = this.player;
    let tx;
    let ty;
    let lambda;
    if (this.mode === 'title') {
      tx = p.x - 190 + Math.sin(this.time * 0.055) * 64;
      ty = p.y - 110 + Math.sin(this.time * 0.085) * 34;
      lambda = 1.2;
    } else if (this.mode === 'dead') {
      tx = p.x + Math.sin(this.time * 0.4) * 22;
      ty = p.y + Math.cos(this.time * 0.33) * 16;
      lambda = 1.6;
    } else {
      const speed = Math.max(1, p.speed);
      tx = p.x + clamp(p.vx / speed, -1, 1) * 82;
      ty = p.y + clamp(p.vy / speed, -1, 1) * 58 - 26;
      lambda = 3.8;
    }
    this.camera.x = damp(this.camera.x, clamp(tx, 40, WORLD.w - 40), lambda, dt);
    this.camera.y = damp(this.camera.y, clamp(ty, 40, WORLD.h - 40), lambda, dt);

    this.shake = damp(this.shake, 0, 6.5, dt);
    this.camera.shakeX = Math.sin(this.time * 82) * this.shake + Math.sin(this.time * 37) * this.shake * 0.4;
    this.camera.shakeY = Math.cos(this.time * 66) * this.shake * 0.72;
  }

  _addBubble(x, y, r, vy, vx, life) {
    if (this.bubbles.length > 220) this.bubbles.shift();
    this.bubbles.push({
      x, y, r, vy, vx,
      life, maxLife: life,
      phase: rand(0, TAU),
      alpha: rand(0.35, 0.8),
      kind: Math.random() < 0.08 ? 'spark' : 'bubble',
      color: Math.random() < 0.15 ? '#b9fff4' : null,
    });
  }

  _updateBubbles(dt) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      if (b.life <= 0) { this.bubbles.splice(i, 1); continue; }
      b.x += (b.vx + Math.sin(this.time * 2.1 + b.phase) * 7) * dt;
      b.y += b.vy * dt;
      b.vy = damp(b.vy, -46, 1.4, dt);
    }
  }

  _burst(x, y, color, count, { speed = 90, size = 2.4, life = 0.9 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(speed * 0.25, speed);
      const l = rand(life * 0.55, life * 1.25);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 8,
        life: l,
        maxLife: l,
        size: rand(size * 0.45, size),
        color,
        type: Math.random() < 0.18 ? 'shard' : 'dot',
        angle: rand(0, TAU),
      });
    }
    if (this.particles.length > 360) this.particles.splice(0, this.particles.length - 360);
  }

  _textPopup(x, y, text, color = '#eaffff', size = 11) {
    this.particles.push({
      x, y, vx: rand(-5, 5), vy: -18,
      life: 1.25, maxLife: 1.25, type: 'text', text, color, size,
    });
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      if (p.type === 'text') {
        p.y += p.vy * dt;
        p.vy *= 0.97;
      } else if (p.type === 'ring') {
        // The renderer animates the expansion from the life ratio.
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.965;
        p.vy *= 0.965;
        p.vy -= 6 * dt;
        if (p.type === 'shard') p.angle += dt * 3;
      }
    }
  }

  _syncInteract() {
    if (this.mode !== 'playing') { this.hud.setInteract(null); this.nearChest = null; return; }
    const chest = this._nearestChest();
    if (chest !== this.nearChest) {
      this.nearChest = chest;
      this.hud.setInteract(chest);
    }
  }

  _syncObjective(force = false) {
    if (!this.hud) return;
    const remaining = this.chests.filter(c => !c.opened);
    const total = TOTAL_CHESTS;
    const progress = this.openedChests.size / total;
    if (!remaining.length) {
      this.hud.setObjective('All caches recovered. Return to the surface.', 'DONE', 1);
      return;
    }
    let nearest = remaining[0];
    let best = Infinity;
    for (const chest of remaining) {
      const d = dist(this.player.x, this.player.y, chest.x, chest.y);
      if (d < best) { best = d; nearest = chest; }
    }
    const meters = Math.round(best * WORLD.pxPerMeter);
    this.hud.setObjective(`Recover the ${nearest.name}`, `${meters} m`, progress);
    if (force) this.hud.sync();
  }
}

export { ZONES };
