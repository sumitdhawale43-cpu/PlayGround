/* =========================================================
   PORTAL RUNNER — game engine
   Canvas 2D platformer with two simultaneous world layers.
   ========================================================= */
import { LEVELS, normalizeLevel, getLevelStats } from './levels.js';
import { AudioEngine } from './audio.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import {
  loadSave, writeSave, recordLevel, saveSettings, resetSave,
  progressSummary, formatTime, starCount
} from './save.js';
import { clamp, overlap, hash, approach } from './utils.js';

const TAU = Math.PI * 2;
const STEP = 1 / 120;
const PLAYER_W = 26;
const PLAYER_H = 46;
const RUN_SPEED = 384;
const GROUND_ACCEL = 4300;
const AIR_ACCEL = 2700;
const GROUND_FRICTION = 3800;
const JUMP_V = 910;
const AIR_JUMP_V = 770;
const GRAVITY = { light: 2420, dark: 1880 };
const MAX_FALL = 1280;
const DASH_SPEED = 1060;
const DASH_TIME = 0.16;
const DASH_COOLDOWN = 1.12;

const LEVEL_TEMPLATES = LEVELS.map((l) => normalizeLevel(l));

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.save = loadSave();
    this.audio = new AudioEngine(this.save.settings);

    this.mode = 'title';
    this.level = null;
    this.levelIndex = -1;
    this.layer = 'light';
    this.player = null;
    this.solids = [];
    this.shards = 0;
    this.keys = 0;
    this.totalShards = 0;
    this.totalKeys = 0;
    this.levelTime = 0;
    this.deaths = 0;
    this.checkpoint = null;
    this.dying = 0;
    this.switching = null;
    this.portalArmed = true;
    this.interaction = null;
    this.dimFlash = 0;
    this.dimFlashPos = { x: 0.5, y: 0.5 };
    this.t = 0;
    this.last = 0;
    this.acc = 0;
    this.timeScale = 1;
    this.mouse = { x: 0.5, y: 0.5 };
    this.coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

    this.particles = [];
    this.floaters = [];
    this.ghosts = [];
    this.effects = [];
    this.speedLines = [];
    this.cam = { x: 0, y: 0, shake: 0, look: 0 };
    this.view = { w: 1280, h: 720, scale: 1, cw: 1280, ch: 720, dpr: 1 };

    this.input = new Set();
    this.actions = { jump: false, dash: false, phase: false };
    this.touchAxis = 0;
    this.touchJumpHeld = false;

    this.renderer = new Renderer(this);
    this.ui = new UI(this);

    this.bindEvents();
    this.resize();
    this.ui.showTitle();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /* ---------------------------------------------------------
     boot / persistence
     --------------------------------------------------------- */
  persist() {
    writeSave(this.save);
  }

  unlockAudio() {
    this.audio.init();
    if (this.audio.ctx) {
      this.audio.setMusic(this.save.settings.music);
      this.audio.setSfx(this.save.settings.sfx);
      this.audio.setLayer(this.layer || 'light');
    }
  }

  applySettings(patch) {
    this.save.settings = saveSettings(this.save, patch);
    this.audio.setMusic(this.save.settings.music);
    this.audio.setSfx(this.save.settings.sfx);
    document.body.classList.toggle('reduced-motion', !!this.save.settings.motion);
    this.ui.syncSettings();
    this.ui.setTouchVisibility();
    if (patch.music || patch.sfx) {
      this.audio.init();
      this.audio.setMusic(this.save.settings.music);
      this.audio.setSfx(this.save.settings.sfx);
    }
  }

  toggleSound() {
    const on = !(this.save.settings.music || this.save.settings.sfx);
    this.save.settings.music = on;
    this.save.settings.sfx = on;
    this.persist();
    this.unlockAudio();
    this.audio.setMusic(on);
    this.audio.setSfx(on);
    document.body.classList.toggle('muted', !on);
    this.ui.syncSettings();
    this.ui.toast(on ? 'Sound on' : 'Sound off', false, 1.4);
  }

  resetProgress() {
    this.save = resetSave();
    this.audio.settings = this.save.settings;
    document.body.classList.remove('muted');
    document.body.classList.toggle('reduced-motion', !!this.save.settings.motion);
    this.ui.refreshAll();
    this.ui.toast('Progress reset — the rifts await', true, 2.6);
  }

  /* ---------------------------------------------------------
     layout
     --------------------------------------------------------- */
  resize() {
    this.coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const cw = Math.max(320, window.innerWidth);
    const ch = Math.max(320, window.innerHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
    const touchLayout = this.coarse || this.save.settings.touch;
    const baseH = touchLayout ? 640 : 720;
    let scale = Math.min(ch / baseH, cw / 560);
    if (cw / scale > 1720) scale = cw / 1720;
    this.view = { w: cw / scale, h: ch / scale, scale, cw, ch, dpr };
    this.ui.setTouchVisibility();
  }

  /* ---------------------------------------------------------
     input
     --------------------------------------------------------- */
  bindEvents() {
    const unlock = () => this.unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX / Math.max(1, window.innerWidth);
      this.mouse.y = e.clientY / Math.max(1, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => {
      this.input.clear();
      this.touchJumpHeld = false;
      this.touchAxis = 0;
      if (this.mode === 'playing') this.pause();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'playing') this.pause();
    });
  }

  isJumpKey(code) {
    return code === 'Space' || code === 'KeyW' || code === 'ArrowUp';
  }

  onKeyDown(e) {
    const code = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) e.preventDefault();
    if (!e.repeat) {
      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        this.handleEscape();
        return;
      }
      if (code === 'KeyM') {
        this.toggleSound();
        return;
      }
      if (code === 'Enter') {
        if (this.mode === 'title') { this.play(); return; }
        if (this.mode === 'complete') { this.nextLevel(); return; }
        if (this.mode === 'paused') { this.resume(); return; }
        if (this.mode === 'playing') { this.actions.phase = true; return; }
      }
      if (this.mode === 'playing') {
        if (this.isJumpKey(code)) this.actions.jump = true;
        if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyX' || code === 'KeyK') this.actions.dash = true;
        if (code === 'KeyE' || code === 'KeyF') this.actions.phase = true;
        if (code === 'KeyR') this.restart();
      }
    }
    if (this.mode === 'playing') {
      if (this.isJumpKey(code)) this.input.add('jumpHeld');
      this.input.add(code);
    }
  }

  onKeyUp(e) {
    this.input.delete(e.code);
    if (this.isJumpKey(e.code)) this.input.delete('jumpHeld');
  }

  get axisInput() {
    let axis = this.touchAxis;
    if (this.input.has('ArrowLeft') || this.input.has('KeyA')) axis -= 1;
    if (this.input.has('ArrowRight') || this.input.has('KeyD')) axis += 1;
    return clamp(axis, -1, 1);
  }

  get jumpHeld() {
    return this.touchJumpHeld || this.input.has('jumpHeld');
  }

  handleEscape() {
    if (this.ui.screen === 'settings') { this.closeSettings(); return; }
    if (this.ui.screen === 'help' || this.ui.screen === 'levels') { this.ui.showTitle(); return; }
    if (this.mode === 'playing') this.pause();
    else if (this.mode === 'paused') this.resume();
    else if (this.mode === 'complete') this.ui.showLevels();
    else if (this.mode === 'title') return;
  }

  /* ---------------------------------------------------------
     flow
     --------------------------------------------------------- */
  play() {
    this.unlockAudio();
    this.audio.sfx('click');
    const level = clamp(this.save.unlocked, 1, LEVELS.length);
    this.startLevel(level - 1);
  }

  startLevel(index) {
    const i = clamp(index, 0, LEVELS.length - 1);
    const template = LEVEL_TEMPLATES[i];
    this.level = JSON.parse(JSON.stringify(template));
    this.levelIndex = i;
    this.layer = 'light';
    this.levelTime = 0;
    this.deaths = 0;
    this.shards = 0;
    this.keys = 0;
    const stats = getLevelStats(this.level);
    this.totalShards = stats.shards;
    this.totalKeys = stats.keys;
    this.checkpoint = { x: this.level.spawn.x, groundY: 640, layer: 'light' };
    this.player = this.createPlayer(this.level.spawn.x, 640, 'light');
    this.cam.x = this.player.x + PLAYER_W / 2;
    this.cam.y = this.player.y - 40;
    this.cam.shake = 0;
    this.dying = 0;
    this.switching = null;
    this.portalArmed = true;
    this.interaction = null;
    this.levelTime = 0;
    this.particles = [];
    this.floaters = [];
    this.ghosts = [];
    this.effects = [];
    this.speedLines = [];
    this.actions = { jump: false, dash: false, phase: false };
    this.acc = 0;
    this.resetLevelObjects(this.level);
    this.mode = 'playing';
    this.ui.hideScreens();
    this.ui.setTouchVisibility();
    this.ui.setDimension('light', this.level);
    this.ui.showLevelIntro(this.level);
    this.ui.updateHUD(this);
    document.body.classList.remove('dark-dim', 'muted');
    document.body.classList.toggle('muted', !(this.save.settings.music || this.save.settings.sfx));
    this.audio.setLayer('light');
    this.audio.sfx('portal');
    this.updateCamera(1 / 60, true);
  }

  resetLevelObjects(level) {
    for (const layer of ['light', 'dark']) {
      const w = level[layer];
      for (const s of w.solids) {
        if (s.type === 'crumble') {
          s.state = 'idle';
          s.crumbleTimer = 0;
          s.respawnTimer = 0;
        }
      }
      for (const m of w.moving) {
        m.x = m.originX;
        m.y = m.originY;
        m.dx = 0;
        m.dy = 0;
      }
      for (const b of w.bridges) {
        b.active = !!b.startsActive;
        b.anim = b.active ? 1 : 0;
      }
      for (const p of w.plates) {
        p.on = false;
        p.glow = 0;
      }
      for (const e of w.enemies) {
        e.dead = 0;
        e.curX = e.x;
        e.curY = e.y;
      }
    }
  }

  createPlayer(x, groundY, layer) {
    return {
      x: x - PLAYER_W / 2,
      y: groundY - PLAYER_H - 3,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      wasOnGround: false,
      groundSolid: null,
      coyote: 0,
      airJumps: 0,
      airDashes: 1,
      jumpBuffer: 0,
      jumpCut: false,
      dashTime: 0,
      dashCd: 0,
      dashDir: 1,
      invuln: 1.1,
      walkPhase: 0,
      scarf: [],
      scarfTimer: 0,
      ghostTimer: 0,
      alive: true,
      dead: false,
    };
  }

  restart() {
    if (this.levelIndex < 0) return;
    this.ui.hideOverlays();
    this.startLevel(this.levelIndex);
  }

  pause() {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.audio.sfx('click');
    this.ui.showPause(this);
  }

  resume() {
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    this.audio.sfx('click');
    this.ui.hideOverlays();
    this.last = performance.now();
    this.acc = 0;
  }

  exitLevel() {
    this.mode = 'levels';
    this.level = null;
    this.player = null;
    this.ui.hideOverlays();
    this.ui.showLevels();
    this.audio.setLayer('light');
    this.audio.sfx('click');
  }

  nextLevel() {
    if (this.levelIndex >= LEVELS.length - 1) {
      this.ui.showLevels();
      this.mode = 'levels';
      return;
    }
    this.ui.hideOverlays();
    this.startLevel(this.levelIndex + 1);
  }

  completeLevel() {
    if (this.mode !== 'playing' || !this.level) return;
    this.mode = 'complete';
    const earned = starCount(true, this.shards, this.keys, this.totalShards, this.totalKeys);
    const result = {
      shards: this.shards,
      keys: this.keys,
      totalShards: this.totalShards,
      totalKeys: this.totalKeys,
      time: this.levelTime,
      deaths: this.deaths,
      stars: earned,
    };
    const record = recordLevel(this.save, this.level.id, result);
    this.audio.sfx('complete');
    this.addShake(8);
    this.ui.showComplete(this, result, record);
    this.ui.updateTouchPhase(false);
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * TAU;
      const s = 90 + Math.random() * 420;
      this.spawnParticle({
        x: this.player.x + PLAYER_W / 2,
        y: this.player.y + PLAYER_H / 2,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 140,
        life: 1 + Math.random() * 1.4,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#ffe29a' : '#6ff5d0',
        glow: true,
        gravity: 280,
        drag: 0.6,
      });
    }
  }

  /* ---------------------------------------------------------
     main loop
     --------------------------------------------------------- */
  loop(now) {
    if (!this.last) this.last = now;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!Number.isFinite(dt)) dt = 0;
    dt = clamp(dt, 0, 0.05);
    this.t += dt;

    if (this.mode === 'playing') {
      this.acc += dt;
      let first = true;
      let guard = 0;
      while (this.acc >= STEP && guard < 12) {
        this.update(STEP, first);
        first = false;
        guard++;
        this.acc -= STEP;
      }
      if (guard >= 12) this.acc = 0;
    } else if (this.mode === 'paused' || this.mode === 'complete') {
      this.updateVisuals(dt * 0.25);
    }

    this.renderer.render(this.t);
    this.ui.updateHUD(this);
    requestAnimationFrame(this.loop);
  }

  update(dt, first) {
    const actions = first ? this.actions : { jump: false, dash: false, phase: false };
    if (first) this.actions = { jump: false, dash: false, phase: false };

    if (this.switching) {
      this.levelTime += dt;
      const sw = this.switching;
      sw.t += dt;
      if (!sw.switched && sw.t >= 0.16) {
        this.performTeleport(sw.portal);
        sw.switched = true;
      }
      if (sw.t >= sw.dur) this.switching = null;
      this.updateVisuals(dt);
      this.updateCamera(dt);
      this.updateDimFlash(dt);
      return;
    }

    if (this.dying > 0) {
      this.dying -= dt;
      this.updateVisuals(dt);
      this.updateCamera(dt);
      this.updateDimFlash(dt);
      if (this.dying <= 0) this.respawn();
      return;
    }

    this.levelTime += dt;
    this.updateWorld(dt);
    this.buildSolids();
    this.applyPlatformCarry();
    this.updatePlayer(dt, actions);
    this.updateWorldObjects(dt);
    this.updatePickupsAndHazards(dt);
    this.updateInteraction();
    if (actions.phase) this.handlePhase();
    this.updateVisuals(dt);
    this.updateCamera(dt);
    this.updateDimFlash(dt);
  }
  /* ---------------------------------------------------------
     world simulation
     --------------------------------------------------------- */
  get world() {
    return this.level ? this.level[this.layer] : null;
  }

  updateWorld(dt) {
    const w = this.world;
    if (!w) return;
    for (const m of w.moving) {
      const prevX = m.x;
      const prevY = m.y;
      const phase = this.levelTime * m.speed + m.phase;
      if (m.axis === 'x') {
        m.x = m.originX + Math.sin(phase) * m.dist;
        m.y = m.originY;
      } else {
        m.x = m.originX;
        m.y = m.originY + Math.sin(phase) * m.dist;
      }
      m.dx = m.x - prevX;
      m.dy = m.y - prevY;
    }
    for (const b of w.bridges) {
      const target = b.active ? 1 : 0;
      b.anim += (target - b.anim) * Math.min(1, dt * 7);
    }
    for (const s of w.solids) {
      if (s.type !== 'crumble') continue;
      if (s.state === 'gone') {
        s.respawnTimer -= dt;
        if (s.respawnTimer <= 0) {
          s.state = 'idle';
          s.crumbleTimer = 0;
          this.spawnBurst(s.x + s.w / 2, s.y + s.h / 2, this.layer === 'light' ? '#8ff5ff' : '#ff9ae8', 12, 90);
        }
      } else if (s.state === 'shaking') {
        s.crumbleTimer -= dt;
        if (s.crumbleTimer <= 0) {
          s.state = 'gone';
          s.respawnTimer = 2.8;
          this.spawnBurst(s.x + s.w / 2, s.y + s.h / 2, this.layer === 'light' ? '#aef6ff' : '#ff8fe0', 22, 160);
          this.audio.sfx('land');
          this.addShake(3);
        }
      }
    }
    for (const p of w.plates) {
      p.glow += ((p.on ? 1 : 0) - p.glow) * Math.min(1, dt * 8);
    }
    for (const e of w.enemies) {
      if (e.dead > 0) {
        e.dead -= dt;
        continue;
      }
      e.curX = e.baseX + Math.sin(this.levelTime * (e.speed * 0.021) + e.phase) * e.range;
      e.curY = e.baseY + Math.sin(this.levelTime * 2.1 + e.phase) * 7;
    }
  }

  buildSolids() {
    const w = this.world;
    this.solids = [];
    for (const s of w.solids) {
      if (s.type === 'crumble' && s.state === 'gone') continue;
      s.isMoving = false;
      this.solids.push(s);
    }
    for (const m of w.moving) {
      m.isMoving = true;
      m.type = 'moving';
      this.solids.push(m);
    }
    for (const b of w.bridges) {
      if (b.active && b.anim > 0.35) {
        this.solids.push({ x: b.x, y: b.y, w: b.w, h: b.h, type: 'bridge', isMoving: false });
      }
    }
  }

  applyPlatformCarry() {
    const p = this.player;
    if (!p || !p.groundSolid) return;
    const s = p.groundSolid;
    if (s.isMoving) {
      p.x += s.dx || 0;
      p.y += s.dy || 0;
    }
  }

  updatePlayer(dt, actions) {
    const P = this.player;
    if (!P) return;
    const wasGround = P.onGround;
    const startY = P.y;
    P.invuln = Math.max(0, P.invuln - dt);
    P.dashCd = Math.max(0, P.dashCd - dt);
    P.jumpBuffer = Math.max(0, P.jumpBuffer - dt);

    if (wasGround) {
      P.coyote = 0.1;
      P.airJumps = 0;
      P.airDashes = 1;
    } else {
      P.coyote = Math.max(0, P.coyote - dt);
    }
    if (actions.jump) P.jumpBuffer = 0.12;

    const axis = this.axisInput;

    if (actions.dash && P.dashCd <= 0 && P.dashTime <= 0 && (wasGround || P.airDashes > 0)) {
      P.dashTime = DASH_TIME;
      P.dashCd = DASH_COOLDOWN;
      P.dashDir = axis !== 0 ? Math.sign(axis) : P.facing;
      P.facing = P.dashDir;
      P.vy = 0;
      P.jumpCut = true;
      if (!wasGround) P.airDashes--;
      this.audio.sfx('dash');
      this.addShake(4);
      this.spawnDashBurst(P);
    }

    if (P.jumpBuffer > 0 && P.dashTime <= 0) {
      if (wasGround || P.coyote > 0) {
        this.doJump(P, JUMP_V, 'jump');
        P.airJumps = 0;
      } else if (P.airJumps < 1) {
        P.airJumps++;
        this.doJump(P, AIR_JUMP_V, 'double');
      }
    }

    if (!this.jumpHeld && P.vy < -150 && !P.jumpCut) {
      P.vy *= 0.55;
      P.jumpCut = true;
    }

    if (P.dashTime > 0) {
      P.vx = P.dashDir * DASH_SPEED;
      P.dashTime -= dt;
      P.ghostTimer -= dt;
      if (P.ghostTimer <= 0) {
        P.ghostTimer = 0.028;
        this.ghosts.push({ x: P.x, y: P.y, facing: P.facing, life: 0.3, max: 0.3, layer: this.layer });
      }
      if (P.dashTime <= 0) {
        P.vx = P.dashDir * RUN_SPEED * 0.68;
      }
    } else {
      if (axis !== 0) {
        P.vx = approach(P.vx, axis * RUN_SPEED, (P.onGround ? GROUND_ACCEL : AIR_ACCEL) * dt);
        P.facing = axis > 0 ? 1 : -1;
      } else {
        P.vx = approach(P.vx, 0, (P.onGround ? GROUND_FRICTION : GROUND_FRICTION * 0.3) * dt);
      }
      const apical = P.vy < 0 && this.jumpHeld && !P.jumpCut && !this.save.settings.motion;
      const g = GRAVITY[this.layer] * (apical ? 0.86 : 1);
      P.vy = Math.min(MAX_FALL, P.vy + g * dt);
    }

    if (P.onGround && Math.abs(P.vx) > 28) {
      P.walkPhase += Math.abs(P.vx) * dt * 0.045;
    } else {
      P.walkPhase += dt * 1.3;
    }

    // horizontal movement + collision
    P.x += P.vx * dt;
    for (const s of this.solids) {
      if (s.type === 'oneway') continue;
      if (overlap(P, s)) {
        if (P.vx > 0) P.x = s.x - P.w;
        else if (P.vx < 0) P.x = s.x + s.w;
        P.vx = 0;
      }
    }

    // vertical movement + collision
    const fallSpeed = P.vy;
    const prevBottom = P.y + P.h;
    P.y += P.vy * dt;
    P.onGround = false;
    P.groundSolid = null;
    for (const s of this.solids) {
      if (!overlap(P, s)) continue;
      if (s.type === 'oneway') {
        if (P.vy >= 0 && prevBottom <= s.y + 3) {
          P.y = s.y - P.h;
          P.vy = 0;
          P.onGround = true;
          P.groundSolid = s;
        }
      } else if (P.vy > 0) {
        P.y = s.y - P.h;
        P.vy = 0;
        P.onGround = true;
        P.groundSolid = s;
      } else if (P.vy < 0) {
        P.y = s.y + s.h;
        P.vy = 0;
      }
    }

    // world edges
    P.x = clamp(P.x, -90, this.level.width - P.w + 90);

    if (P.groundSolid && P.groundSolid.type === 'crumble' && P.groundSolid.state === 'idle') {
      P.groundSolid.state = 'shaking';
      P.groundSolid.crumbleTimer = 0.68;
      this.spawnBurst(P.x + P.w / 2, P.y + P.h, this.layer === 'light' ? '#bff8ff' : '#ffb3ef', 8, 60);
    }

    if (P.onGround && !wasGround && fallSpeed > 330) {
      this.audio.sfx('land');
      this.addShake(Math.min(7, fallSpeed / 160));
      this.spawnDust(P.x + P.w / 2, P.y + P.h, 9, this.layer === 'light' ? '#a9f5df' : '#ff9ade');
    }
    if (P.onGround && Math.abs(P.vx) > 280 && Math.random() < 0.3) {
      this.spawnDust(P.x + P.w / 2 - P.facing * 8, P.y + P.h, 1, this.layer === 'light' ? 'rgba(190,255,235,0.5)' : 'rgba(255,150,225,0.5)');
    }
    if (P.dashTime > 0 && Math.random() < 0.65) {
      this.spawnParticle({
        x: P.x + P.w / 2 - P.dashDir * 12,
        y: P.y + P.h * 0.55 + (Math.random() - 0.5) * 30,
        vx: -P.dashDir * (40 + Math.random() * 120),
        vy: (Math.random() - 0.5) * 60,
        life: 0.3,
        size: 1.5 + Math.random() * 2.5,
        color: this.layer === 'light' ? '#9effe9' : '#ff9ae6',
        glow: true,
        drag: 1,
      });
    }

    // scarf trail
    P.scarfTimer -= dt;
    if (P.scarfTimer <= 0) {
      P.scarfTimer = 0.026;
      P.scarf.unshift({ x: P.x + P.w / 2 - P.facing * 6, y: P.y + 18 });
      if (P.scarf.length > 11) P.scarf.pop();
    }
    for (let i = 0; i < P.scarf.length; i++) {
      const s = P.scarf[i];
      s.y += (P.y + 18 - s.y) * Math.min(1, dt * 2.6);
      s.x += P.vx * dt * 0.12;
    }

    P.wasOnGround = P.onGround;
    P.alive = true;
    if (P.y > this.level.height + 240 || P.y < -2000) {
      this.killPlayer('fall');
    }
    void startY;
  }

  doJump(P, velocity, kind) {
    P.vy = -velocity;
    P.onGround = false;
    P.coyote = 0;
    P.jumpBuffer = 0;
    P.jumpCut = false;
    this.audio.sfx(kind);
    this.spawnDust(P.x + P.w / 2, P.y + P.h, kind === 'double' ? 12 : 7, this.layer === 'light' ? '#a9f5df' : '#ff9ade');
    if (kind === 'double') {
      this.spawnRing(P.x + P.w / 2, P.y + P.h - 6, this.layer === 'light' ? '#b8fff0' : '#ffb3ef', 26);
    }
  }

  updateWorldObjects() {
    if (!this.world) return;
    const P = this.player;
    const pcx = P.x + P.w / 2;
    const pcy = P.y + P.h / 2;
    for (const c of this.world.checkpoints) {
      if (c.active) continue;
      if (Math.abs(pcx - c.x) < 64 && Math.abs(P.y + P.h - c.y) < 120) {
        for (const layer of ['light', 'dark']) {
          for (const other of this.level[layer].checkpoints) other.active = false;
        }
        c.active = true;
        this.checkpoint = { x: c.x, groundY: c.y, layer: this.layer };
        this.audio.sfx('checkpoint');
        this.spawnRing(c.x, c.y - 32, this.layer === 'light' ? '#bafff1' : '#ffc0f1', 54);
        this.spawnBurst(c.x, c.y - 34, this.layer === 'light' ? '#bafff1' : '#ffc0f1', 20, 110);
        this.ui.toast('Checkpoint lit · ' + this.level.layerNames[this.layer], false, 2.2);
      }
    }
  }

  updatePickupsAndHazards(dt) {
    const P = this.player;
    const w = this.world;
    if (!w) return;
    const body = { x: P.x + 5, y: P.y + 4, w: P.w - 10, h: P.h - 6 };
    for (const h of w.hazards) {
      if (overlap(body, h)) {
        this.killPlayer(h.type === 'lava' ? 'lava' : 'spikes');
        return;
      }
    }

    const pcx = P.x + P.w / 2;
    const pcy = P.y + P.h / 2;

    for (const s of w.shards) {
      if (s.taken) continue;
      const dx = pcx - s.x;
      const dy = pcy - (s.y + Math.sin(this.t * 2 + s.bob) * 4);
      if (dx * dx + dy * dy < 30 * 30) {
        s.taken = true;
        this.shards++;
        this.audio.sfx('collect');
        this.spawnBurst(s.x, s.y, this.layer === 'light' ? '#b8fff0' : '#ffb7f1', 12, 110);
        this.floaters.push({ x: s.x, y: s.y, text: '+1 SHARD', color: this.layer === 'light' ? '#d6fff8' : '#ffe2fa', life: 0.9, max: 0.9 });
      }
    }

    for (const k of w.keys) {
      if (k.taken) continue;
      const dx = pcx - k.x;
      const dy = pcy - (k.y + Math.sin(this.t * 1.8 + k.bob) * 4);
      if (dx * dx + dy * dy < 36 * 36) {
        k.taken = true;
        this.keys++;
        this.audio.sfx('key');
        this.spawnBurst(k.x, k.y, '#ffe29a', 26, 150);
        this.spawnRing(k.x, k.y, '#ffe29a', 40);
        this.floaters.push({ x: k.x, y: k.y - 8, text: 'RELIC KEY', color: '#ffe29a', life: 1.3, max: 1.3 });
        this.ui.toast('Relic key found · ' + this.keys + ' / ' + this.totalKeys, true, 2.2);
      }
    }

    for (const e of w.enemies) {
      if (e.dead > 0) continue;
      const dx = pcx - e.curX;
      const dy = pcy - e.curY;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 32) {
        if (P.dashTime > 0) {
          this.killEnemy(e, 'dash');
        } else if (P.vy > 120 && P.y + P.h < e.curY + 8) {
          this.killEnemy(e, 'stomp');
          P.vy = -630;
          P.airJumps = 0;
          this.audio.sfx('stomp');
          this.addShake(5);
        } else if (P.invuln <= 0) {
          this.killPlayer('watcher');
          return;
        }
      }
    }

    for (const plate of w.plates) {
      if (plate.on) continue;
      if (pcx > plate.x - 30 && pcx < plate.x + plate.w + 30 && Math.abs(P.y + P.h - plate.y) < 34) {
        plate.on = true;
        plate.glow = 0.2;
        const bridge = this.findBridge(plate.target);
        this.audio.sfx('bridge');
        this.spawnRing(plate.x + plate.w / 2, plate.y - 4, this.layer === 'light' ? '#b8fff0' : '#ffb3ef', 44);
        if (bridge && !bridge.active) {
          bridge.active = true;
          bridge.anim = 0;
          this.ui.toast('BRIDGE STABILISED IN ' + this.level.layerNames[bridge.layer].toUpperCase(), true, 3);
          this.spawnBurst(bridge.x + bridge.w / 2, bridge.y, this.layer === 'light' ? '#b8fff0' : '#ffb3ef', 26, 170);
        }
      }
    }

    for (const tip of w.tips) {
      if (tip.seen) continue;
      if (Math.abs(pcx - tip.x) < tip.r && Math.abs(pcy - tip.y) < 210) {
        tip.seen = true;
        this.ui.toast(tip.text, tip.text.toLowerCase().includes('secret'), 3.8);
      }
    }
  }

  findBridge(id) {
    if (!this.level) return null;
    for (const layer of ['light', 'dark']) {
      for (const b of this.level[layer].bridges) if (b.id === id) return b;
    }
    return null;
  }

  killEnemy(e, cause) {
    e.dead = 6;
    this.audio.sfx(cause === 'stomp' ? 'stomp' : 'stomp');
    this.spawnBurst(e.curX, e.curY, this.layer === 'light' ? '#c8fff4' : '#ffb3ef', 24, 190);
    this.spawnRing(e.curX, e.curY, this.layer === 'light' ? '#c8fff4' : '#ffb3ef', 30);
    this.addShake(cause === 'dash' ? 5 : 4);
    this.floaters.push({ x: e.curX, y: e.curY - 14, text: cause === 'dash' ? 'SHATTERED' : 'BANISHED', color: '#fff', life: 0.8, max: 0.8 });
  }

  killPlayer() {
    if (!this.player || this.mode !== 'playing' || this.dying > 0) return;
    if (this.player.invuln > 0) return;
    this.dying = 0.92;
    this.deaths++;
    this.player.vx = 0;
    this.player.vy = 0;
    this.audio.sfx('death');
    this.addShake(17);
    this.spawnBurst(this.player.x + PLAYER_W / 2, this.player.y + PLAYER_H / 2, this.layer === 'light' ? '#9effe9' : '#ff9ae6', 46, 280);
    this.spawnRing(this.player.x + PLAYER_W / 2, this.player.y + PLAYER_H / 2, this.layer === 'light' ? '#ffffff' : '#ffc4f4', 50);
    this.ui.setDeath(true);
    this.ui.updateTouchPhase(false);
  }

  respawn() {
    const cp = this.checkpoint || { x: this.level.spawn.x, groundY: 640, layer: 'light' };
    this.layer = cp.layer || 'light';
    this.player = this.createPlayer(cp.x, cp.groundY, this.layer);
    this.player.invuln = 1.6;
    this.portalArmed = true;
    this.dying = 0;
    this.switching = null;
    this.ui.setDeath(false);
    this.ui.setDimension(this.layer, this.level);
    this.audio.setLayer(this.layer);
    this.spawnBurst(cp.x, cp.groundY - 20, this.layer === 'light' ? '#bafff1' : '#ffc0f1', 28, 140);
    this.spawnRing(cp.x, cp.groundY - 18, this.layer === 'light' ? '#bafff1' : '#ffc0f1', 42);
    this.updateCamera(1 / 60, true);
    this.ui.toast('SIGNAL RESTORED', false, 1.6);
  }

  /* ---------------------------------------------------------
     portals / interaction
     --------------------------------------------------------- */
  updateInteraction() {
    this.interaction = null;
    if (!this.level || !this.player) {
      this.ui.updateTouchPhase(false);
      return;
    }
    const P = this.player;
    const pcx = P.x + P.w / 2;
    const pcy = P.y + P.h / 2;

    if (!this.portalArmed) {
      let nearAny = false;
      for (const p of this.world.portals) {
        if (p.layer !== this.layer) continue;
        if (Math.abs(pcx - p.x) < 100 && Math.abs(pcy - (p.y - 54)) < 112) nearAny = true;
      }
      if (!nearAny) this.portalArmed = true;
    }

    if (this.portalArmed) {
      let best = null;
      let bestDist = Infinity;
      for (const p of this.world.portals) {
        if (p.layer !== this.layer) continue;
        const px = p.x;
        const py = p.y - 54;
        const dx = Math.abs(pcx - px);
        const dy = Math.abs(pcy - py);
        if (dx < 52 && dy < 70) {
          const d = dx * dx + dy * dy;
          if (d < bestDist) {
            bestDist = d;
            best = p;
          }
        }
      }
      if (best) this.interaction = { type: 'portal', obj: best };
    }

    if (!this.interaction) {
      const goal = this.level.goal;
      if (goal && (goal.layer === 'both' || goal.layer === this.layer)) {
        const dx = Math.abs(pcx - goal.x);
        const dy = Math.abs(pcy - (goal.y - 80));
        if (dx < 86 && dy < 112) this.interaction = { type: 'goal', obj: goal };
      }
    }

    const near = !!this.interaction;
    this.ui.updateTouchPhase(near, this.interaction && this.interaction.type === 'goal');
    this.ui.setPrompt(near ? (this.interaction.type === 'goal' ? 'ASCEND' : 'PHASE') : null);
  }

  handlePhase() {
    if (!this.interaction) {
      this.audio.sfx('denied');
      if (this.coarse) this.ui.toast('Find a portal to shift', false, 1.2);
      return;
    }
    if (this.interaction.type === 'portal') {
      this.beginSwitch(this.interaction.obj);
    } else if (this.interaction.type === 'goal') {
      this.completeLevel();
    }
  }

  beginSwitch(portal) {
    if (this.switching) return;
    this.switching = { t: 0, dur: 0.54, portal, switched: false };
    this.portalArmed = false;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.dashTime = 0;
    this.audio.sfx('portal');
    this.addShake(9);
    this.spawnBurst(portal.x, portal.y - 54, this.layer === 'light' ? '#9effe9' : '#ff8fe8', 30, 160);
    this.spawnRing(portal.x, portal.y - 54, this.layer === 'light' ? '#9effe9' : '#ff8fe8', 40);
    this.ui.setPrompt(null);
  }

  performTeleport(portal) {
    const P = this.player;
    const targetLayer = portal.toLayer || (this.layer === 'light' ? 'dark' : 'light');
    this.layer = targetLayer;
    P.x = portal.toX - P.w / 2;
    P.y = portal.toY - P.h - 3;
    P.vx *= 0.35;
    P.vy = 0;
    P.onGround = false;
    P.groundSolid = null;
    P.invuln = Math.max(P.invuln, 0.9);
    this.portalArmed = false;
    this.dimFlash = 1;
    this.dimFlashPos = {
      x: (portal.toX - this.cam.x + this.view.w / 2) / this.view.w,
      y: (portal.toY - 40 - this.cam.y + this.view.h / 2) / this.view.h,
    };
    this.spawnBurst(portal.toX, portal.toY - 54, targetLayer === 'light' ? '#9effe9' : '#ff8fe8', 44, 230);
    this.spawnRing(portal.toX, portal.toY - 54, targetLayer === 'light' ? '#b8fff0' : '#ffb0ee', 46);
    this.audio.setLayer(targetLayer);
    this.ui.setDimension(targetLayer, this.level);
    document.body.classList.toggle('dark-dim', targetLayer === 'dark');
    this.addShake(13);
    if (portal.secret) {
      this.ui.toast('SECRET RIFT DISCOVERED', true, 3);
      this.audio.sfx('secret');
    }
    if (Math.abs(portal.toX - P.x) > 640) this.updateCamera(1 / 60, true);
  }

  /* ---------------------------------------------------------
     camera / visual effects
     --------------------------------------------------------- */
  updateCamera(dt, snap = false) {
    if (!this.level || !this.player) return;
    const P = this.player;
    const look = clamp(P.vx * 0.07, -52, 52) + P.facing * 18;
    let targetX = P.x + P.w / 2 + look;
    let targetY = P.y + P.h / 2 - this.view.h * 0.115 + clamp(P.vy * 0.05, -34, 48);
    const halfW = this.view.w / 2;
    const halfH = this.view.h / 2;
    if (this.level.width > this.view.w) {
      targetX = clamp(targetX, halfW, this.level.width - halfW);
    } else {
      targetX = this.level.width / 2;
    }
    const maxY = Math.max(-80, this.level.height + 110 - halfH);
    targetY = clamp(targetY, -160, maxY);
    if (snap) {
      this.cam.x = targetX;
      this.cam.y = targetY;
    } else {
      const kx = 1 - Math.exp(-dt * 8);
      const ky = 1 - Math.exp(-dt * 6);
      this.cam.x += (targetX - this.cam.x) * kx;
      this.cam.y += (targetY - this.cam.y) * ky;
    }
    this.cam.shake *= Math.exp(-dt * 7);
    if (this.cam.shake < 0.1) this.cam.shake = 0;
  }

  addShake(n) {
    if (this.save.settings.motion || !this.save.settings.shake) return;
    this.cam.shake = Math.min(26, Math.max(this.cam.shake, n));
  }

  updateVisuals(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      if (p.drag) {
        const d = Math.exp(-p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].life -= dt;
      if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.life <= 0) this.effects.splice(i, 1);
    }
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const l = this.speedLines[i];
      l.life -= dt;
      l.x += l.vx * dt;
      if (l.life <= 0) this.speedLines.splice(i, 1);
    }
    this.cam.shake *= Math.exp(-dt * 4.6);
    if (this.cam.shake < 0.08) this.cam.shake = 0;
  }

  updateDimFlash(dt) {
    this.dimFlash = Math.max(0, this.dimFlash - dt * 2.3);
  }

  spawnParticle(opts) {
    if (this.particles.length > 460) return;
    this.particles.push({
      x: 0, y: 0, vx: 0, vy: 0, size: 2, life: 0.6, gravity: 0, drag: 0,
      color: '#ffffff', glow: false, shape: 'dot', spin: 0, rot: 0,
      ...opts,
      maxLife: opts.life || 0.6,
    });
  }

  spawnDust(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.spawnParticle({
        x: x + (Math.random() - 0.5) * 18,
        y: y - Math.random() * 5,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 90,
        life: 0.3 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 3,
        color,
        drag: 2.4,
        glow: true,
      });
    }
  }

  spawnBurst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.25 + Math.random() * 0.9);
      this.spawnParticle({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 0.4 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 3.5,
        color,
        glow: true,
        gravity: 180,
        drag: 0.9,
        shape: Math.random() < 0.25 ? 'streak' : 'dot',
      });
    }
  }

  spawnRing(x, y, color, radius) {
    this.effects.push({ type: 'ring', x, y, color, radius, life: 0.55, max: 0.55 });
  }

  spawnDashBurst(P) {
    const color = this.layer === 'light' ? '#a8fff0' : '#ff9ae6';
    for (let i = 0; i < 16; i++) {
      this.spawnParticle({
        x: P.x + P.w / 2 + (Math.random() - 0.5) * 24,
        y: P.y + Math.random() * P.h,
        vx: -P.dashDir * (120 + Math.random() * 300),
        vy: (Math.random() - 0.5) * 140,
        life: 0.28 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 3,
        color,
        glow: true,
        shape: 'streak',
        drag: 1.2,
      });
    }
    for (let i = 0; i < 5; i++) {
      this.speedLines.push({
        x: P.x + P.w / 2,
        y: P.y + Math.random() * P.h,
        vx: -P.dashDir * (520 + Math.random() * 400),
        life: 0.22,
        max: 0.22,
      });
    }
  }

  /* ---------------------------------------------------------
     input helpers used by the touch UI
     --------------------------------------------------------- */
  queueJump() {
    if (this.mode !== 'playing') return;
    this.actions.jump = true;
    this.touchJumpHeld = true;
    this.unlockAudio();
  }

  releaseJump() {
    this.touchJumpHeld = false;
  }

  queueDash() {
    if (this.mode !== 'playing') return;
    this.actions.dash = true;
    this.unlockAudio();
  }

  queuePhase() {
    if (this.mode !== 'playing') return;
    this.actions.phase = true;
    this.unlockAudio();
  }

  setTouchAxis(v) {
    this.touchAxis = clamp(v, -1, 1);
  }

  openSettings(from = 'title') {
    this.settingsReturn = from;
    if (from !== 'pause') this.mode = 'settings';
    this.ui.showSettings(from);
  }

  closeSettings() {
    if (this.settingsReturn === 'pause' && this.level) {
      this.mode = 'paused';
      this.ui.showPause(this);
    } else {
      this.mode = 'title';
      this.ui.showTitle();
    }
  }

  /* ---------------------------------------------------------
     developer / test hooks
     --------------------------------------------------------- */
  debugState() {
    return {
      mode: this.mode,
      layer: this.layer,
      level: this.level ? this.level.id : null,
      levelIndex: this.levelIndex,
      shards: this.shards,
      keys: this.keys,
      totalShards: this.totalShards,
      totalKeys: this.totalKeys,
      time: this.levelTime,
      deaths: this.deaths,
      interaction: this.interaction ? this.interaction.type : null,
      portalArmed: this.portalArmed,
      player: this.player ? {
        x: this.player.x, y: this.player.y, vx: this.player.vx, vy: this.player.vy,
        onGround: this.player.onGround, facing: this.player.facing,
        dashCd: this.player.dashCd, dashTime: this.player.dashTime,
      } : null,
    };
  }

  debugTeleport(x, y, layer = this.layer) {
    if (!this.player || !this.level) return;
    if (layer !== this.layer) {
      this.layer = layer;
      this.ui.setDimension(layer, this.level);
      this.audio.setLayer(layer);
      document.body.classList.toggle('dark-dim', layer === 'dark');
    }
    this.player.x = x;
    this.player.y = y - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.updateCamera(1 / 60, true);
    this.portalArmed = true;
  }

  debugCollectAll() {
    if (!this.level) return;
    for (const layer of ['light', 'dark']) {
      for (const s of this.level[layer].shards) {
        if (!s.taken) { s.taken = true; this.shards++; }
      }
      for (const k of this.level[layer].keys) {
        if (!k.taken) { k.taken = true; this.keys++; }
      }
    }
    this.ui.updateHUD(this);
  }
}
