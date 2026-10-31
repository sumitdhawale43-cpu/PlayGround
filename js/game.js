/* ============================================================
   TIME REWIND — game controller
   ============================================================ */

import { LEVELS, TOTAL_CORES } from './levels.js';
import { SaveStore } from './save.js';
import { AudioEngine } from './audio.js';
import { ParticleField } from './particles.js';
import { UIManager, formatTime } from './ui.js';
import { Background } from './background.js';
import { Renderer } from './renderer.js';
import {
  STEP, HISTORY_MAX, ECHO_WINDOW, clamp,
  fixedUpdate, startRewind, endRewind, killPlayer, respawnPlayer,
  captureSnapshot, setupBodies
} from './systems.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.saveStore = new SaveStore();
    this.save = this.saveStore.data;
    this.audio = new AudioEngine();
    this.particles = new ParticleField();

    this.mode = 'menu';
    this.levelIndex = -1;
    this.level = null;
    this.background = new Background(LEVELS[0]);

    this.platforms = [];
    this.hazards = [];
    this.enemies = [];
    this.projectiles = [];
    this.cores = [];
    this.energyOrbs = [];
    this.checkpoints = [];
    this.portal = null;
    this.player = null;

    this.rewinding = false;
    this.rewindCursor = 0;
    this.rewindAmount = 0;
    this.recoil = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.deathWait = 3.2;
    this.deathsThisRun = 0;
    this.checkpointIndex = -1;
    this.activeCheckpoints = new Set();
    this.coreCollected = new Set();
    this.echoTimer = 0;
    this.echoAnnounced = false;
    this.invuln = 0;
    this.timeEnergy = 100;
    this.levelTimer = 0;
    this.worldTime = 0;
    this.ambientTime = 0;
    this.time = 0;
    this.history = [];
    this.sampleTimer = 0;
    this.hintDelay = 0;
    this.hintCooldown = 0;
    this.hintsShown = new Set();
    this.camera = { x: 0, y: 0, shake: 0 };
    this.flash = { color: '#57f2ff', alpha: 0 };
    this.reducedMotion = this.save.settings.reducedMotion;
    this.god = false;

    this.input = {
      left: false, right: false, jumpHeld: false, jumpBuffer: 0, rewind: false
    };

    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.viewW = 1280;
    this.viewH = 720;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.ui = new UIManager(this);
    this.renderer = new Renderer(this);
    this.applySettings();
    this.bindInput();
    this.resize();
    this.showMenu();

    this.lastFrame = performance.now();
    this.accumulator = 0;
    this.hudClock = 0;
    this._isPlaying = false;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /* ------------------------------------------------------------ */
  /* lifecycle / render loop                                      */
  /* ------------------------------------------------------------ */

  loop(now) {
    const raw = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    const dt = Math.min(0.05, Math.max(0, raw));
    this.time += dt;
    this.ambientTime += dt;
    this.audio.update();

    const isPlaying = this.mode === 'playing';
    if (isPlaying !== this._isPlaying) {
      this._isPlaying = isPlaying;
      document.body.classList.toggle('is-playing', isPlaying);
    }

    if (this.mode === 'playing') {
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= STEP && steps < 6) {
        fixedUpdate(this, STEP);
        this.accumulator -= STEP;
        steps++;
      }
    } else {
      this.accumulator = 0;
    }

    const particleSpeed = this.mode === 'paused' || this.mode === 'complete' ? 0.08 : this.rewinding ? 0.45 : 1;
    this.particles.update(dt * particleSpeed);
    this.flash.alpha *= Math.exp(-dt * 6.5);
    if (this.flash.alpha < 0.002) this.flash.alpha = 0;
    this.camera.shake *= Math.exp(-dt * 7.5);
    if (this.camera.shake < 0.04) this.camera.shake = 0;

    if (this.mode === 'playing') this.updateCamera(dt);
    if (this.mode === 'menu') this.emitMenuMotes(dt);

    this.hudClock += dt;
    if (this.hudClock > 0.07 && (this.mode === 'playing' || this.dead)) {
      this.hudClock = 0;
      this.refreshHud();
    }
    this.renderer.render();
    requestAnimationFrame(this.loop);
  }

  updateCamera(dt) {
    const maxX = Math.max(0, 1280 - this.viewW);
    let target = 0;
    if (this.player) target = clamp(this.player.x - this.viewW * 0.43, 0, maxX);
    if (this.dead && this.player) target = clamp(this.player.x - this.viewW * 0.43, 0, maxX);
    const speed = this.dead ? 2.2 : 6.5;
    this.camera.x += (target - this.camera.x) * Math.min(1, dt * speed);
    this.camera.x = clamp(this.camera.x, 0, maxX);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(280, rect.width || window.innerWidth);
    const h = Math.max(220, rect.height || window.innerHeight);
    this.cssW = w;
    this.cssH = h;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.viewH = 720;
    const aspect = w / h;
    this.viewW = clamp(720 * aspect, 430, 1280);
    this.scale = Math.min(w / this.viewW, h / this.viewH);
    this.offsetX = (w - this.viewW * this.scale) / 2;
    this.offsetY = (h - this.viewH * this.scale) / 2;
    if (this.player) {
      this.camera.x = clamp(this.camera.x, 0, Math.max(0, 1280 - this.viewW));
    }
  }

  emitMenuMotes(dt) {
    if (Math.random() < dt * 1.8) {
      this.particles.add({
        x: 700 + Math.random() * 540,
        y: 210 + Math.random() * 380,
        vx: -4 - Math.random() * 7,
        vy: -2 - Math.random() * 7,
        life: 4 + Math.random() * 5,
        size: .5 + Math.random() * 1.3,
        color: Math.random() > .5 ? '#7deeff' : '#bca4ff',
        drag: .03,
        alpha: .6
      });
    }
  }

  /* ------------------------------------------------------------ */
  /* navigation                                                   */
  /* ------------------------------------------------------------ */

  showMenu() {
    this.mode = 'menu';
    this.ui.hideAllScreens();
    this.ui.showMenu(this.save, this.save.unlocked > 1 ? this.saveStore.lastLevelData : null);
    this.ui.hideHud();
    this.ui.hideHint();
    this.ui.hideDeath();
    this.ui.intro.classList.add('is-hidden');
    this.rewinding = false;
    this.dead = false;
    this.audio.setPaused(false);
    this.audio.rewindStop(true);
    this.audio.setEnabled(this.save.settings.audio);
    this.background = new Background(LEVELS[0]);
    this.flash.alpha = 0;
  }

  openMenu() {
    this.showMenu();
  }

  openLevels(fromPause = false) {
    this.mode = 'levels';
    this.ui.showLevels(this.save);
    this.ui.hideHud();
    this.ui.hideDeath();
    this.ui.hideHint();
    this.ui.intro.classList.add('is-hidden');
    this.audio.setPaused(true);
    this.rewinding = false;
    this.dead = false;
    if (fromPause) this.audio.rewindStop(true);
  }

  openHow() {
    this.mode = 'how';
    this.ui.show('how');
    this.ui.hideHud();
    this.ui.hideHint();
    this.ui.intro.classList.add('is-hidden');
  }

  openSettings() {
    this.mode = 'settings';
    this.ui.show('settings');
    this.ui.refreshSettings(this.save);
    this.ui.hideHud();
    this.ui.hideHint();
    this.ui.intro.classList.add('is-hidden');
  }

  playFromMenu() {
    const hasProgress = this.save.unlocked > 1 || Object.keys(this.save.completed).length > 0;
    const index = hasProgress ? clamp(this.save.lastLevel, 0, LEVELS.length - 1) : 0;
    this.startSector(index);
  }

  continueRun() {
    this.startSector(clamp(this.save.lastLevel, 0, LEVELS.length - 1));
  }

  startSector(index) {
    if (index < 0 || index >= LEVELS.length) return;
    if (index >= this.save.unlocked && !this.god) {
      this.ui.showToast('LOCKED', 'Restore the previous sector first.');
      return;
    }
    this.levelIndex = index;
    this.saveStore.setLastLevel(index);
    this.save = this.saveStore.data;
    this.deathsThisRun = 0;
    this.levelTimer = 0;
    this.checkpointIndex = -1;
    this.activeCheckpoints.clear();
    this.coreCollected.clear();
    this.hintsShown.clear();
    this.respawn = { ...LEVELS[index].spawn };
    this.mode = 'playing';
    this.ui.hideAllScreens();
    this.ui.hideDeath();
    this.ui.intro.classList.add('is-hidden');
    this.setupLevel(index, { fresh: true });
    this.ui.showHud(this.level);
    this.ui.showIntro(this.level);
    this.audio.setPaused(false);
    this.audio.setEnabled(this.save.settings.audio);
    this.audio.setLevel(index);
    this.audio.unlock();
    this.audio.portal();
    this.hintDelay = 2.25;
    this.camera.x = clamp(this.player.x - this.viewW * 0.43, 0, Math.max(0, 1280 - this.viewW));
    this.refreshHud(true);
  }

  setupLevel(index, { fresh = false } = {}) {
    const data = LEVELS[index];
    this.level = data;
    this.background = new Background(data);
    this.projectiles = [];
    this.history = [];
    this.sampleTimer = 0;
    this.rewindCursor = 0;
    this.rewindAmount = 0;
    this.worldTime = 0;
    this.echoTimer = 0;
    this.echoAnnounced = false;
    this.rewinding = false;
    this.dead = false;
    this.deadTimer = 0;
    this.invuln = 1.15;
    this.timeEnergy = 100;
    this.flash = { color: data.palette.accent, alpha: .18 };
    this.camera.shake = 0;
    this.input.jumpBuffer = 0;
    this.input.rewind = false;

    this.platforms = data.platforms.map((p, i) => ({
      ...p,
      id: i,
      kind: p.kind || 'solid',
      baseX: p.x,
      baseY: p.y,
      curX: p.x,
      curY: p.y,
      prevX: p.x,
      prevY: p.y,
      dx: 0,
      dy: 0,
      state: 0,
      timer: 0,
      fall: 0,
      phaseActive: true
    }));
    this.hazards = data.hazards.map((h) => ({ ...h }));
    this.cores = data.cores.map((c, i) => ({
      ...c,
      id: `${data.id}:${i}`,
      idx: i,
      collected: this.coreCollected.has(`${data.id}:${i}`)
    }));
    this.energyOrbs = data.energy.map((e, i) => ({ ...e, idx: i, collected: false }));
    this.checkpoints = data.checkpoints.map((c) => ({ ...c, active: this.activeCheckpoints.has(c.id) }));
    this.portal = { ...data.portal };
    this.enemies = setupBodies(data.enemies);
    this.levelTimer = fresh ? 0 : this.levelTimer;

    const spawn = fresh ? data.spawn : (this.respawn || data.spawn);
    this.player = {
      x: spawn.x, y: spawn.y, vx: 0, vy: 0,
      facing: 1, onGround: true, coyote: 0, jumpBuffer: 0,
      runPhase: 0, squash: 1, groundId: -1, jumpCut: false,
      alive: true, invuln: this.invuln, stepTimer: 0
    };
    this.updatePlatformState(0);
    this.snapCamera();
    this.recordSnapshot(true);
  }

  snapCamera() {
    this.camera.x = clamp(this.player.x - this.viewW * 0.43, 0, Math.max(0, 1280 - this.viewW));
  }

  restartSector() {
    if (this.levelIndex < 0) return;
    this.audio.click();
    this.startSector(this.levelIndex);
  }

  replaySector() {
    this.startSector(this.levelIndex);
  }

  nextSector() {
    if (this.levelIndex >= LEVELS.length - 1) {
      this.openLevels();
      return;
    }
    this.startSector(this.levelIndex + 1);
  }

  pause() {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.audio.setPaused(true);
    this.ui.showPause({
      number: this.level.number,
      time: this.levelTimer,
      cores: this.coreCollected.size
    });
    this.ui.hideHint();
    if (this.dead) this.ui.hideDeath();
  }

  resume() {
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    this.ui.hideAllScreens();
    this.audio.setPaused(false);
    this.lastFrame = performance.now();
    if (this.dead) this.ui.showDeath(this.timeEnergy, this.deathWait);
  }

  toggleMute() {
    this.save.settings.audio = !this.save.settings.audio;
    this.saveStore.data.settings.audio = this.save.settings.audio;
    this.saveStore.save();
    this.audio.setEnabled(this.save.settings.audio);
    this.ui.setMute(!this.save.settings.audio, true);
    this.ui.showToast('AUDIO', this.save.settings.audio ? 'Soundscape online.' : 'Soundscape muted.', 1800);
  }

  toggleReducedMotion() {
    this.save.settings.reducedMotion = !this.save.settings.reducedMotion;
    this.saveStore.data.settings.reducedMotion = this.save.settings.reducedMotion;
    this.saveStore.save();
    this.applySettings();
    this.ui.refreshSettings(this.save);
  }

  toggleScreenFx() {
    this.save.settings.screenFx = !this.save.settings.screenFx;
    this.saveStore.data.settings.screenFx = this.save.settings.screenFx;
    this.saveStore.save();
    this.applySettings();
    this.ui.refreshSettings(this.save);
  }

  applySettings() {
    this.reducedMotion = this.save.settings.reducedMotion;
    document.body.classList.toggle('no-fx', !this.save.settings.screenFx);
    document.body.classList.toggle('reduced-motion', this.reducedMotion);
    this.audio.setEnabled(this.save.settings.audio);
    this.ui.setMute(!this.save.settings.audio, true);
  }

  resetProgress() {
    const ok = window.confirm('Purge the entire timeline? All sectors, cores and best times will be erased.');
    if (!ok) return;
    this.saveStore.reset();
    this.save = this.saveStore.data;
    this.applySettings();
    this.ui.refreshSettings(this.save);
    this.ui.showToast('ARCHIVE PURGED', 'A new timeline begins.');
  }

  completeLevel() {
    if (this.mode !== 'playing' || !this.level) return;
    this.mode = 'complete';
    this.rewinding = false;
    this.audio.rewindStop(true);
    this.audio.setPaused(true);
    this.audio.portal();
    this.ui.setRewinding(false);
    this.ui.hideHint();
    this.ui.hideDeath();
    const cores = this.coreCollected.size;
    const result = this.saveStore.completeLevel(this.levelIndex, {
      time: this.levelTimer,
      deaths: this.deathsThisRun,
      cores
    });
    this.save = this.saveStore.data;
    const final = this.levelIndex >= LEVELS.length - 1;
    this.ui.showComplete({
      final,
      level: this.level,
      time: this.levelTimer,
      deaths: this.deathsThisRun,
      cores,
      totalCores: this.level.cores.length,
      stars: result ? result.stars : 1,
      bestTime: result ? result.bestTime : this.levelTimer,
      newRecord: result ? result.newRecord : true
    });
    if (!final) this.audio.unlockSfx();
    this.saveStore.save();
  }

  refreshHud(force = false) {
    if (!this.level || !this.player) return;
    this.ui.updateHud({
      energy: this.timeEnergy,
      time: this.levelTimer,
      cores: this.coreCollected.size,
      totalCores: this.level.cores.length,
      checkpoint: this.checkpointIndex,
      rewinding: this.rewinding,
      rewindSeconds: this.rewindAmount,
      echo: this.echoTimer
    });
    if (this.dead) {
      this.ui.updateDeath(Math.max(0, this.deathWait - this.deadTimer), this.deathWait);
    }
  }

  /* ------------------------------------------------------------ */
  /* input                                                         */
  /* ------------------------------------------------------------ */

  bindInput() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const playing = this.mode === 'playing';
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        if (playing) e.preventDefault();
      }
      this.audio.unlock();
      if (e.repeat) return;
      if (code === 'KeyA' || code === 'ArrowLeft') this.setMove('left', true);
      else if (code === 'KeyD' || code === 'ArrowRight') this.setMove('right', true);
      else if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
        if (playing) this.pressJump();
      } else if (code === 'KeyR' || code === 'ShiftLeft' || code === 'ShiftRight') {
        if (playing) this.setRewind(true);
      } else if (code === 'Escape' || code === 'KeyP') {
        this.handleEscape();
      } else if (code === 'KeyM') {
        this.toggleMute();
      } else if (code === 'Enter') {
        if (this.mode === 'menu') this.playFromMenu();
        else if (this.mode === 'paused') this.resume();
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') this.setMove('left', false);
      else if (code === 'KeyD' || code === 'ArrowRight') this.setMove('right', false);
      else if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') this.releaseJump();
      else if (code === 'KeyR' || code === 'ShiftLeft' || code === 'ShiftRight') this.setRewind(false);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'playing') this.pause();
    });
    window.addEventListener('blur', () => {
      if (this.mode === 'playing') this.pause();
    });
  }

  handleEscape() {
    if (this.mode === 'playing') this.pause();
    else if (this.mode === 'paused') this.resume();
    else if (this.mode === 'levels' || this.mode === 'how' || this.mode === 'settings') this.openMenu();
    else if (this.mode === 'complete') this.openLevels();
  }

  setMove(dir, pressed) {
    this.input[dir] = pressed;
  }

  pressJump() {
    this.input.jumpHeld = true;
    this.input.jumpBuffer = 0.13;
  }

  releaseJump() {
    this.input.jumpHeld = false;
  }

  setRewind(pressed) {
    this.input.rewind = pressed;
    if (pressed) {
      if (this.mode === 'playing' && !this.rewinding) this.beginRewind();
    } else if (this.rewinding) {
      this.finishRewind();
    }
  }

  /* ------------------------------------------------------------ */
  /* rewind wrappers (systems implement the heavy lifting)        */
  /* ------------------------------------------------------------ */

  beginRewind() {
    startRewind(this);
  }

  finishRewind() {
    endRewind(this);
  }

  die(cause = 'fracture') {
    killPlayer(this, cause);
  }

  respawn() {
    respawnPlayer(this);
  }

  recordSnapshot(force = false) {
    if (!this.player) return;
    this.history.push(captureSnapshot(this));
    if (this.history.length > HISTORY_MAX + 1) this.history.shift();
  }

  updatePlatformState(dt) {
    for (const p of this.platforms) {
      p.prevX = p.curX;
      p.prevY = p.curY;
      if (p.move) {
        const period = p.move.period || 4;
        const ph = p.move.phase || 0;
        const e = 0.5 - 0.5 * Math.cos(((this.worldTime / period) + ph) * Math.PI * 2);
        p.curX = p.baseX + (p.move.dx || 0) * e;
        p.curY = p.baseY + (p.move.dy || 0) * e;
      } else {
        p.curX = p.baseX;
        p.curY = p.baseY;
      }
      p.dx = p.curX - p.prevX;
      p.dy = p.curY - p.prevY;
      if (p.kind === 'phase') {
        const period = p.period || 3;
        const c = ((this.worldTime + (p.phase || 0)) % period) / period;
        p.phaseActive = c < (p.duty || 0.6);
      }
    }
  }

  /* ------------------------------------------------------------ */
  /* debug hooks used by automated verification                   */
  /* ------------------------------------------------------------ */

  installDebugApi() {
    const game = this;
    const api = {
      game,
      levels: LEVELS,
      start: (i) => game.startSector(i),
      state: () => ({
        mode: game.mode,
        level: game.levelIndex,
        x: game.player?.x, y: game.player?.y,
        vx: game.player?.vx, vy: game.player?.vy,
        energy: game.timeEnergy,
        rewinding: game.rewinding,
        dead: game.dead,
        history: game.history.length,
        cores: game.coreCollected.size,
        checkpoint: game.checkpointIndex,
        echo: game.echoTimer,
        unlocked: game.save.unlocked,
        completed: Object.keys(game.save.completed).length,
        platforms: game.platforms.map(p => ({ x: p.curX, y: p.curY, w: p.w, h: p.h, kind: p.kind, state: p.state, phaseActive: p.phaseActive }))
      }),
      teleport: (x, y) => {
        if (!game.player) return;
        game.player.x = x; game.player.y = y; game.player.vx = 0; game.player.vy = 0;
        game.snapCamera();
      },
      win: () => game.completeLevel(),
      kill: () => game.die('debug'),
      setEnergy: (v) => { game.timeEnergy = clamp(v, 0, 100); },
      setGod: (v) => { game.god = !!v; },
      unlockAll: () => {
        game.save.unlocked = LEVELS.length;
        game.saveStore.save();
      },
      clearHistory: () => { game.history.length = 0; },
      setWorldTime: (t) => { game.worldTime = t; },
      step: (n = 1) => { for (let i = 0; i < n; i++) fixedUpdate(game, STEP); },
      getLevel: (i) => LEVELS[i],
      resetSave: () => { game.saveStore.reset(); game.save = game.saveStore.data; }
    };
    window.TIME_REWIND = api;
    window.__TIME_REWIND__ = api;
  }
}

export { TOTAL_CORES, formatTime };
