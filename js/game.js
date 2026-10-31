/* ============================================================
   DON'T LOOK BACK
   It only moves when you don't look.
   ============================================================ */

import { generateLevel, findPath, hasLineOfSight } from './maze.js';
import { createTextures } from './textures.js';
import { Renderer } from './renderer.js';
import { AudioEngine } from './audio.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

const TAU = Math.PI * 2;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function loadSettings() {
  try {
    return Object.assign(
      { sens: 1, flashes: true, muted: false },
      JSON.parse(localStorage.getItem('dlb-settings-v1') || '{}')
    );
  } catch {
    return { sens: 1, flashes: true, muted: false };
  }
}

class Game {
  constructor() {
    this.canvas = $('scene');
    this.textures = createTextures(20261031);
    this.renderer = new Renderer(this.canvas, this.textures);
    this.audio = new AudioEngine();

    this.settings = loadSettings();
    this.isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.keys = new Set();
    this.touchLook = null;
    this.stickPointer = null;
    this.stickVec = { x: 0, y: 0 };
    this.dragging = false;
    this.dragX = 0;
    this.dragY = 0;
    this.hadLock = false;
    this.lockGrace = 0;
    this.time = 0;
    this.last = performance.now();
    this.timers = new Set();
    this.flashTimeout = null;

    this.state = {
      mode: 'menu',
      gaze: 0,
      reality: 3,
      breakLevel: 0,
      tears: 0,
      shake: 0,
      hintsHidden: false,
      listen: 0,
      listenCooldown: 0,
      listenTarget: -1,
      flashPulse: 0,
      observed: false,
      dyingKind: null,
    };

    this.level = generateLevel((Math.random() * 0xffffffff) >>> 0);
    this.player = { x: 0, y: 0, angle: 0, pitch: 0, bobPhase: 0, bobY: 0, stepAccum: 0, roll: 0 };
    this.monster = { x: 0, y: 0, path: [], repath: 0, unseen: 0, boost: 0, phase: 0 };
    this.sigils = [];
    this.watchers = [];
    this.echoes = [];
    this.schedule = [];
    this.runTime = 0;
    this.messages = { timer: 0 };
    this.echoTimer = 5;
    this.glitchTimer = 1.5;
    this.sealedTimer = 0;
    this.behindTimer = 0;

    this.el = this.collectElements();
    this.bindUI();
    this.bindInput();
    this.applySettings();
    this.makeGrain();
    this.setupMenuWorld();
    this.updateHud(true);
    this.updateAudioSettings();

    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.mode === 'playing') this.pause();
    });

    requestAnimationFrame((t) => this.loop(t));

    // Small, intentional debugging surface for automated checks.
    this.exposeDebug();
  }

  collectElements() {
    return {
      menu: $('menu'),
      hud: $('hud'),
      pauseOverlay: $('pauseOverlay'),
      deathOverlay: $('deathOverlay'),
      winOverlay: $('winOverlay'),
      jumpscare: $('jumpscare'),
      jumpscareImg: $('jumpscareImg'),
      message: $('message'),
      hint: $('hint'),
      gazeWrap: $('gazeWrap'),
      gazeFill: $('gazeFill'),
      gazeLabel: $('gazeLabel'),
      reticle: $('reticle'),
      sigilPips: $('sigilPips'),
      realityPips: $('realityPips'),
      compass: $('compass'),
      compassArrow: $('compassArrow'),
      compassText: $('compassText'),
      stickBase: $('stickBase'),
      stickKnob: $('stickKnob'),
      listenBtn: $('listenBtn'),
      pauseBtn: $('pauseBtn'),
      flash: $('flash'),
      deathKicker: $('deathKicker'),
      deathTitle: $('deathTitle'),
      deathReason: $('deathReason'),
      deathStats: $('deathStats'),
      winStats: $('winStats'),
      deathOverlayCard: $('deathOverlay'),
      sensRange: $('sensRange'),
      flashCheck: $('flashCheck'),
      muteCheck: $('muteCheck'),
      startBtn: $('startBtn'),
      resumeBtn: $('resumeBtn'),
      restartBtnPause: $('restartBtnPause'),
      retryBtn: $('retryBtn'),
      againBtn: $('againBtn'),
      menuBtn: $('menuBtn'),
    };
  }

  show(el) { el.classList.remove('is-hidden'); }
  hide(el) { el.classList.add('is-hidden'); }

  makeGrain() {
    const size = 180;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    document.documentElement.style.setProperty('--grain', `url(${c.toDataURL('image/png')})`);
    this.el.jumpscareImg.src = this.textures.jumpscareUrl;
  }

  applySettings() {
    const s = this.settings;
    this.el.sensRange.value = s.sens;
    this.el.flashCheck.checked = s.flashes;
    this.el.muteCheck.checked = s.muted;
    this.audio.setMuted(s.muted);
    this.audio.setReduced(!s.flashes);
    document.body.classList.toggle('no-flash', !s.flashes);
    try { localStorage.setItem('dlb-settings-v1', JSON.stringify(s)); } catch { /* ignore */ }
  }

  bindUI() {
    const start = (e) => {
      e.preventDefault();
      this.beginRun();
    };
    this.el.startBtn.addEventListener('click', start);
    this.el.retryBtn.addEventListener('click', (e) => { e.preventDefault(); this.audio.click(); this.beginRun(); });
    this.el.againBtn.addEventListener('click', (e) => { e.preventDefault(); this.audio.click(); this.beginRun(); });
    this.el.resumeBtn.addEventListener('click', (e) => { e.preventDefault(); this.audio.click(); this.resume(); });
    this.el.restartBtnPause.addEventListener('click', (e) => { e.preventDefault(); this.audio.click(); this.beginRun(); });
    this.el.menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.audio.click();
      this.returnToMenu();
    });
    this.el.pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.audio.click();
      if (this.state.mode === 'playing') this.pause();
      else if (this.state.mode === 'paused') this.resume();
    });

    this.el.listenBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.listen();
    });
    this.el.listenBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.listen(); });

    this.el.sensRange.addEventListener('input', () => {
      this.settings.sens = parseFloat(this.el.sensRange.value) || 1;
      this.applySettings();
    });
    this.el.flashCheck.addEventListener('change', () => {
      this.settings.flashes = this.el.flashCheck.checked;
      this.applySettings();
      this.updateAudioSettings();
    });
    this.el.muteCheck.addEventListener('change', () => {
      this.settings.muted = this.el.muteCheck.checked;
      this.applySettings();
    });

    this.canvas.addEventListener('click', () => {
      if (this.state.mode === 'playing' && !this.isTouch && !document.pointerLockElement) {
        this.requestLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === this.canvas;
      if (locked) {
        this.hadLock = true;
        this.lockGrace = performance.now() + 320;
      } else if (this.hadLock && this.state.mode === 'playing') {
        this.pause();
      }
    });

    document.addEventListener('pointerlockerror', () => {
      this.hadLock = false;
    });
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'Escape') {
        if (this.state.mode === 'playing') this.pause();
        else if (this.state.mode === 'paused') this.resume();
        return;
      }
      if (e.code === 'Space') {
        this.listen();
        return;
      }
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.stickVec.x = 0; this.stickVec.y = 0;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.state.mode !== 'playing' || this.isTouch) return;
      if (document.pointerLockElement === this.canvas) {
        if (performance.now() < this.lockGrace) return;
        if (Math.abs(e.movementX) > 160 || Math.abs(e.movementY) > 160) return;
        this.look(e.movementX, e.movementY, 1);
      } else if (this.dragging) {
        const dx = e.clientX - this.dragX;
        const dy = e.clientY - this.dragY;
        this.dragX = e.clientX; this.dragY = e.clientY;
        this.look(dx, dy, 1.15);
      }
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || this.state.mode !== 'playing') return;
      if (!document.pointerLockElement) {
        this.dragging = true;
        this.dragX = e.clientX; this.dragY = e.clientY;
      }
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') this.dragging = false;
    });

    const app = $('app');
    app.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
    app.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: false });
    app.addEventListener('pointerup', (e) => this.onPointerUp(e), { passive: false });
    app.addEventListener('pointercancel', (e) => this.onPointerUp(e), { passive: false });
    app.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('wheel', (e) => {
      if (this.state.mode === 'playing') e.preventDefault();
    }, { passive: false });
  }

  requestLock() {
    if (this.isTouch) return;
    this.hadLock = false;
    try {
      const p = this.canvas.requestPointerLock?.({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => {
        try { this.canvas.requestPointerLock?.(); } catch { /* ignore */ }
      });
    } catch {
      try { this.canvas.requestPointerLock?.(); } catch { /* ignore */ }
    }
  }

  look(dx, dy, factor = 1) {
    if (this.state.mode !== 'playing') return;
    const sens = 0.0022 * this.settings.sens * factor;
    this.player.angle = (this.player.angle + dx * sens) % TAU;
    this.player.pitch = clamp(this.player.pitch - dy * sens * 0.5, -0.26, 0.26);
  }

  onPointerDown(e) {
    if (this.state.mode !== 'playing') return;
    if (e.pointerType !== 'touch') return;
    if (e.target.closest('button')) return;
    const x = e.clientX, y = e.clientY;
    if (x < window.innerWidth * 0.48) {
      this.stickPointer = e.pointerId;
      this.stickOrigin = { x, y };
      this.stickVec.x = 0; this.stickVec.y = 0;
      this.el.stickBase.style.left = `${x - 62}px`;
      this.el.stickBase.style.top = `${y - 62}px`;
      this.el.stickBase.style.bottom = 'auto';
      this.el.stickBase.classList.add('on');
      this.el.stickKnob.style.transform = 'translate(0px, 0px)';
      e.preventDefault();
    } else {
      this.touchLook = { id: e.pointerId, x, y };
      e.preventDefault();
    }
  }

  onPointerMove(e) {
    if (e.pointerType !== 'touch') return;
    if (this.stickPointer === e.pointerId) {
      const dx = e.clientX - this.stickOrigin.x;
      const dy = e.clientY - this.stickOrigin.y;
      const len = Math.hypot(dx, dy) || 1;
      const max = 48;
      const cl = Math.min(len, max);
      const kx = (dx / len) * cl;
      const ky = (dy / len) * cl;
      this.el.stickKnob.style.transform = `translate(${kx}px, ${ky}px)`;
      this.stickVec.x = kx / max;
      this.stickVec.y = ky / max;
      e.preventDefault();
    } else if (this.touchLook && this.touchLook.id === e.pointerId) {
      const dx = e.clientX - this.touchLook.x;
      const dy = e.clientY - this.touchLook.y;
      this.touchLook.x = e.clientX;
      this.touchLook.y = e.clientY;
      this.look(dx, dy, 3.2);
      e.preventDefault();
    }
  }

  onPointerUp(e) {
    if (e.pointerType !== 'touch') return;
    if (this.stickPointer === e.pointerId) {
      this.stickPointer = null;
      this.stickVec.x = 0; this.stickVec.y = 0;
      this.el.stickBase.classList.remove('on');
      this.el.stickKnob.style.transform = 'translate(0px, 0px)';
    }
    if (this.touchLook && this.touchLook.id === e.pointerId) this.touchLook = null;
  }

  setupMenuWorld() {
    this.level = generateLevel((Math.random() * 0xffffffff) >>> 0);
    this.player.x = this.level.start.x + 0.5;
    this.player.y = this.level.start.y + 0.5;
    this.player.angle = this.level.startAngle;
    this.player.pitch = 0;
    this.player.bobPhase = 0;
    this.player.bobY = 0;
    this.worldSigils = this.level.sigils.map(s => ({ x: s.x + 0.5, y: s.y + 0.5, collected: false }));
    this.sigils = this.worldSigils;
    this.monster.x = this.level.monsterSpawn.x + 0.5;
    this.monster.y = this.level.monsterSpawn.y + 0.5;
    this.monster.path = [];
    this.watchers = this.level.watchers.map(w => ({ ...w, seen: false, seenT: 0, alpha: 0 }));
    this.echoes = [];
  }

  beginRun() {
    this.clearTimers();
    this.audio.start();
    if (!this.isTouch) this.requestLock();
    document.body.classList.add('playing');
    this.level = generateLevel((Math.random() * 0xffffffff) >>> 0);
    this.player.x = this.level.start.x + 0.5;
    this.player.y = this.level.start.y + 0.5;
    this.player.angle = this.level.startAngle;
    this.player.pitch = 0;
    this.player.bobPhase = 0;
    this.player.bobY = 0;
    this.player.stepAccum = 0;

    this.sigils = this.level.sigils.map(s => ({ x: s.x + 0.5, y: s.y + 0.5, collected: false }));
    this.monster = {
      x: this.level.monsterSpawn.x + 0.5,
      y: this.level.monsterSpawn.y + 0.5,
      path: [], repath: 0, unseen: 0, boost: 0, phase: Math.random() * 10,
    };
    this.watchers = this.level.watchers.map(w => ({ ...w, seen: false, seenT: 0, alpha: 0 }));
    this.echoes = [];
    this.state = {
      mode: 'playing',
      gaze: 0,
      reality: 3,
      breakLevel: 0,
      tears: 0,
      shake: 0,
      hintsHidden: false,
      listen: 0,
      listenCooldown: 0,
      listenTarget: -1,
      flashPulse: 0,
      observed: false,
      dyingKind: null,
    };
    this.runTime = 0;
    this.echoTimer = 6;
    this.glitchTimer = 1.5;
    this.sealedTimer = 0;
    this.behindTimer = 0;
    this.setupSchedule();

    document.body.classList.remove('reality-broken-1', 'reality-broken-2', 'fracturing', 'shake');
    this.el.gazeWrap.classList.remove('on', 'hot');
    this.el.reticle.classList.remove('locked');
    this.el.compass.classList.remove('on');
    this.el.message.classList.remove('on', 'glitch');
    this.el.hint.classList.remove('fade');
    this.el.listenBtn.classList.remove('cooldown');
    this.hide(this.el.menu);
    this.hide(this.el.pauseOverlay);
    this.hide(this.el.deathOverlay);
    this.hide(this.el.winOverlay);
    this.el.jumpscare.classList.remove('active');
    this.el.jumpscare.style.opacity = '0';
    this.el.jumpscare.style.visibility = 'hidden';
    this.el.flash.style.opacity = '0';
    this.audio.setAmbient(0.5, 1.2);
    this.show(this.el.hud);
    this.updateHud(true);
    this.say('THREE SIGILS. ONE GATE.', 3600);
    this.timers.add(setTimeout(() => this.el.hint.classList.add('fade'), 14000));
  }

  setupSchedule() {
    this.schedule = [
      { at: 7, text: 'IT ONLY MOVES WHEN YOU DON\u2019T LOOK.', fired: false },
      { at: 17, text: 'STARING TOO LONG IS HOW IT GETS IN.', fired: false },
      { at: 31, text: 'PRESS SPACE TO LISTEN. IT WILL HEAR YOU TOO.', fired: false },
      { at: 55, text: 'THE HALLS REMEMBER YOUR FACE.', fired: false },
    ];
  }

  clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    if (this.flashTimeout) { clearTimeout(this.flashTimeout); this.flashTimeout = null; }
  }

  returnToMenu() {
    this.clearTimers();
    this.state.mode = 'menu';
    document.body.classList.remove('playing');
    this.hide(this.el.hud);
    this.hide(this.el.pauseOverlay);
    this.hide(this.el.deathOverlay);
    this.hide(this.el.winOverlay);
    this.show(this.el.menu);
    this.el.jumpscare.classList.remove('active');
    this.el.message.classList.remove('on', 'glitch');
    this.el.compass.classList.remove('on');
    this.el.reticle.classList.remove('locked');
    document.body.classList.remove('reality-broken-1', 'reality-broken-2', 'fracturing', 'shake');
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.setupMenuWorld();
    this.audio.setAmbient(0.35, 1.2);
  }

  pause() {
    if (this.state.mode !== 'playing') return;
    this.state.mode = 'paused';
    document.body.classList.remove('playing');
    this.show(this.el.pauseOverlay);
    this.audio.setAmbient(0.18, 0.5);
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  resume() {
    if (this.state.mode !== 'paused') return;
    this.state.mode = 'playing';
    document.body.classList.add('playing');
    this.hide(this.el.pauseOverlay);
    this.audio.setAmbient(0.5, 0.6);
    this.requestLock();
  }

  say(text, ms = 3600, glitch = false) {
    const el = this.el.message;
    el.textContent = text;
    el.classList.toggle('glitch', glitch);
    el.classList.add('on');
    this.messages.timer = ms / 1000;
  }

  updateAudioSettings() {
    this.audio.setMuted(this.settings.muted);
    this.audio.setReduced(!this.settings.flashes);
  }

  /* ---------------- world ---------------- */

  isObserved() {
    const m = this.monster;
    const dx = m.x - this.player.x, dy = m.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 18) return false;
    const toM = Math.atan2(dy, dx);
    const rel = wrapAngle(toM - this.player.angle);
    if (Math.abs(rel) > 0.72) return false;
    return hasLineOfSight(this.level, this.player.x, this.player.y, m.x, m.y);
  }

  collectSigils() {
    for (const s of this.sigils) {
      if (s.collected) continue;
      const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
      if (d < 0.62) {
        s.collected = true;
        this.audio.sigil();
        this.flashScreen(0.35);
        this.state.shake = 3;
        const n = this.collectedCount();
        this.say(n >= 3 ? 'THREE SIGILS. THE GATE IS OPEN.' : `SIGIL ${n} OF 3. THE AIR THINS.`, 3800);
        this.monster.boost = Math.max(this.monster.boost, 1.1);
        this.updateHud(true);
      }
    }
  }

  collectedCount() {
    return this.sigils.reduce((n, s) => n + (s.collected ? 1 : 0), 0);
  }

  listen() {
    if (this.state.mode !== 'playing') return;
    if (this.state.listenCooldown > 0) return;
    this.audio.listenPulse();
    this.state.listen = 3.2;
    this.state.listenCooldown = 8;
    let best = -1, bestD = Infinity;
    this.sigils.forEach((s, i) => {
      if (s.collected) return;
      const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    this.state.listenTarget = best;
    if (best >= 0) {
      this.el.compass.classList.add('on');
      this.el.compassArrow.classList.toggle('onscreen', bestD < 5);
    }
    // The sound draws attention.
    if (!this.state.observed) this.monster.boost = Math.max(this.monster.boost, 1.6);
  }

  fracture() {
    this.state.gaze = 0.22;
    this.state.reality -= 1;
    this.state.breakLevel = 3 - this.state.reality;
    this.state.tears = 0.85;
    this.state.shake = 12;
    this.state.flashPulse = 0.6;
    this.state.listen = 0;
    this.state.observed = false;
    this.audio.fracture();
    this.flashScreen(0.65);
    document.body.classList.add('fracturing');
    this.timers.add(setTimeout(() => document.body.classList.remove('fracturing'), 700));
    document.body.classList.toggle('reality-broken-1', this.state.reality === 2);
    document.body.classList.toggle('reality-broken-2', this.state.reality === 1);
    if (this.state.reality <= 0) {
      this.endRun('unravelled');
      return;
    }
    // It is suddenly much closer.
    const from = { x: Math.floor(this.monster.x), y: Math.floor(this.monster.y) };
    const to = { x: Math.floor(this.player.x), y: Math.floor(this.player.y) };
    const path = findPath(this.level, from, to);
    if (path.length > 2) {
      const target = path[Math.min(3, path.length - 2)];
      this.monster.x = target.x + 0.5;
      this.monster.y = target.y + 0.5;
    }
    this.monster.path = [];
    this.monster.repath = 0;
    this.monster.boost = 3.2;
    this.updateHud(true);
    const lines = [
      'IT IS CLOSER NOW.',
      'YOU SAW TOO MUCH.',
      'THE WALLS MOVED FOR IT.',
      'REALITY FRACTURED. IT DID NOT.',
    ];
    this.say(lines[(Math.random() * lines.length) | 0], 4200, true);
  }

  endRun(kind) {
    if (this.state.mode === 'dying' || this.state.mode === 'dead' || this.state.mode === 'won' || this.state.mode === 'winning') return;
    this.state.mode = 'dying';
    this.state.dyingKind = kind;
    document.body.classList.remove('playing');
    this.audio.setAmbient(0.05, 0.4);
    this.hide(this.el.hud);
    this.el.gazeWrap.classList.remove('on');
    if (document.pointerLockElement) document.exitPointerLock?.();
    if (kind === 'caught') {
      this.audio.death();
      this.el.jumpscare.classList.add('active');
      this.el.jumpscare.style.opacity = '1';
      this.el.jumpscare.style.visibility = 'visible';
      this.timers.add(setTimeout(() => {
        this.el.jumpscare.classList.remove('active');
        this.el.jumpscare.style.opacity = '0';
        this.el.jumpscare.style.visibility = 'hidden';
        this.showDeath();
      }, 1250));
    } else {
      this.audio.fracture();
      this.flashScreen(1);
      this.state.tears = 1;
      this.timers.add(setTimeout(() => this.showDeath(), 900));
    }
  }

  showDeath() {
    this.state.mode = 'dead';
    const caught = this.state.dyingKind === 'caught';
    this.el.deathKicker.textContent = caught ? 'CAUGHT' : 'UNRAVELLED';
    this.el.deathTitle.textContent = caught ? 'IT FOUND YOU' : 'THERE IS NOTHING LEFT';
    this.el.deathReason.textContent = caught
      ? 'It only needed one unwatched second. You gave it more.'
      : 'You stared until the world came apart. It watched you do it.';
    this.el.deathStats.innerHTML = `
      <div>TIME<b>${formatTime(this.runTime)}</b></div>
      <div>SIGILS<b>${this.collectedCount()}/3</b></div>
      <div>REALITY<b>${Math.max(0, this.state.reality)}/3</b></div>`;
    this.show(this.el.deathOverlay);
    this.audio.setAmbient(0.14, 1.0);
  }

  winRun() {
    if (this.state.mode !== 'playing') return;
    this.state.mode = 'winning';
    document.body.classList.remove('playing');
    this.hide(this.el.hud);
    this.audio.setAmbient(0.03, 0.8);
    this.audio.win();
    this.flashScreen(1);
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.timers.add(setTimeout(() => {
      this.state.mode = 'won';
      this.el.winStats.innerHTML = `
        <div>TIME<b>${formatTime(this.runTime)}</b></div>
        <div>SIGILS<b>3/3</b></div>
        <div>REALITY<b>${Math.max(0, this.state.reality)}/3</b></div>`;
      this.show(this.el.winOverlay);
    }, 900));
  }

  flashScreen(power = 1) {
    if (!this.settings.flashes) return;
    const f = this.el.flash;
    f.style.opacity = String(clamp(power, 0, 1) * 0.7);
    this.timers.add(setTimeout(() => { f.style.opacity = '0'; }, 90));
  }

  /* ---------------- update ---------------- */

  loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;
    if (this.state.mode === 'playing') this.update(dt);
    else if (this.state.mode === 'dying' || this.state.mode === 'winning') this.updateEffects(dt);
    else this.updateIdle(dt);
    this.render();
    this.updateCss();
    requestAnimationFrame((t) => this.loop(t));
  }

  updateIdle(dt) {
    this.state.tears = Math.max(0, this.state.tears - dt * 1.4);
    this.state.shake = Math.max(0, this.state.shake - dt * 30);
    if (this.messages.timer > 0) {
      this.messages.timer -= dt;
      if (this.messages.timer <= 0) this.el.message.classList.remove('on');
    }
    if (this.state.mode === 'menu') {
      this.player.bobPhase += dt * 0.6;
      this.player.bobY = Math.sin(this.player.bobPhase) * this.renderer.h * 0.003;
    }
  }

  updateEffects(dt) {
    this.state.tears = Math.max(0, this.state.tears - dt * (this.state.mode === 'dying' ? 0.5 : 3));
    this.state.shake = Math.max(0, this.state.shake - dt * 25);
    this.state.flashPulse = Math.max(0, this.state.flashPulse - dt * 3);
  }

  update(dt) {
    this.runTime += dt;
    this.updateEffects(dt);
    this.state.listen = Math.max(0, this.state.listen - dt);
    this.state.listenCooldown = Math.max(0, this.state.listenCooldown - dt);
    this.monster.boost = Math.max(0, this.monster.boost - dt);
    this.monster.phase += dt;
    this.sealedTimer = Math.max(0, this.sealedTimer - dt);
    this.behindTimer = Math.max(0, this.behindTimer - dt);

    for (const q of this.schedule) {
      if (!q.fired && this.runTime >= q.at) {
        q.fired = true;
        this.say(q.text, 4200);
      }
    }

    if (this.messages.timer > 0) {
      this.messages.timer -= dt;
      if (this.messages.timer <= 0) this.el.message.classList.remove('on', 'glitch');
    }

    this.movePlayer(dt);
    this.collectSigils();
    this.updateMonster(dt);
    this.updateWatchers(dt);
    this.updateEchoes(dt);
    this.updateCompass();
    this.checkExit();
    this.updateHud();
    this.updateAudio(dt);
  }

  movePlayer(dt) {
    let forward = 0, strafe = 0;
    if (this.keys.has('KeyW')) forward += 1;
    if (this.keys.has('KeyS')) forward -= 1;
    if (this.keys.has('KeyD')) strafe += 1;
    if (this.keys.has('KeyA')) strafe -= 1;
    forward += -this.stickVec.y;
    strafe += this.stickVec.x;

    const turn = (this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('ArrowLeft') ? 1 : 0);
    if (turn) this.player.angle = (this.player.angle + turn * dt * 1.9) % TAU;
    const lookY = (this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('ArrowUp') ? 1 : 0);
    if (lookY) this.player.pitch = clamp(this.player.pitch + lookY * dt * 0.55, -0.26, 0.26);

    const mag = Math.hypot(forward, strafe);
    if (mag > 1) { forward /= mag; strafe /= mag; }
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = (sprint ? 3.05 : 1.95) * (this.state.breakLevel >= 2 ? 0.92 : 1);
    const dirX = Math.cos(this.player.angle), dirY = Math.sin(this.player.angle);
    const vx = (dirX * forward + -dirY * strafe) * speed;
    const vy = (dirY * forward + dirX * strafe) * speed;

    const r = 0.23;
    const canStand = (x, y) => !(
      this.level.isWall(x - r, y - r) || this.level.isWall(x + r, y - r) ||
      this.level.isWall(x - r, y + r) || this.level.isWall(x + r, y + r)
    );

    const nx = this.player.x + vx * dt;
    if (canStand(nx, this.player.y)) this.player.x = nx;
    const ny = this.player.y + vy * dt;
    if (canStand(this.player.x, ny)) this.player.y = ny;

    const moving = Math.hypot(vx, vy) > 0.05;
    const movingSpeed = Math.hypot(vx, vy);
    if (moving) {
      this.player.bobPhase += dt * (7.4 + movingSpeed * 1.4);
      this.player.stepAccum += movingSpeed * dt;
      const stepLen = sprint ? 0.8 : 0.64;
      if (this.player.stepAccum > stepLen) {
        this.player.stepAccum = 0;
        this.audio.footstep(sprint ? 1.35 : 0.9);
        this.state.shake = Math.max(this.state.shake, 0.8);
      }
    } else {
      this.player.bobPhase += dt * 1.4;
    }
    this.player.bobY = Math.sin(this.player.bobPhase) * this.renderer.h * (moving ? 0.0055 : 0.0012);
    this.player.roll = Math.sin(this.player.bobPhase * 0.5) * (moving ? 0.3 : 0.08);

    // breathing / sanity overlay
    if (this.state.gaze > 0.62) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) {
        this.glitchTimer = 1.1 + Math.random() * 1.6;
        this.state.tears = Math.max(this.state.tears, 0.18);
        this.state.shake = Math.max(this.state.shake, 2.5);
        if (Math.random() < 0.55) this.say('DON\u2019T STARE AT IT.', 1500, true);
      }
    } else {
      this.glitchTimer = 0.7;
    }
  }

  updateMonster(dt) {
    const m = this.monster;
    const observed = this.state.observed = this.isObserved();
    const dx = this.player.x - m.x, dy = this.player.y - m.y;
    const dist = Math.hypot(dx, dy);

    if (observed) {
      m.unseen = 0;
      this.state.gaze = Math.min(1, this.state.gaze + dt * 0.225);
      if (this.state.gaze >= 1) {
        this.fracture();
        return;
      }
    } else {
      m.unseen += dt;
      this.state.gaze = Math.max(0, this.state.gaze - dt * 0.13);
    }

    if (dist < 0.62) {
      this.endRun('caught');
      return;
    }

    if (dist < 5 && this.behindTimer <= 0 && !observed) {
      this.behindTimer = 16;
      this.say('IT IS RIGHT BEHIND YOU.', 2200, false);
    }

    if (observed && this.state.gaze > 0.8 && this.messages.timer < 0.1) {
      this.say('STOP LOOKING.', 900, true);
    }

    // Freeze while watched, with a tiny reaction grace when you look away.
    if (observed || m.unseen < 0.22) return;

    m.repath -= dt;
    if (m.repath <= 0 || !m.path.length) {
      const from = { x: Math.floor(m.x), y: Math.floor(m.y) };
      const to = { x: Math.floor(this.player.x), y: Math.floor(this.player.y) };
      m.path = findPath(this.level, from, to);
      m.repath = 0.45;
    }
    if (!m.path.length) return;

    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    let speed = 0.94 + this.collectedCount() * 0.11 + (m.boost > 0 ? 0.55 : 0) + (sprint ? 0.15 : 0);
    if (this.state.breakLevel >= 1) speed += 0.08;
    if (this.state.breakLevel >= 2) speed += 0.1;

    let remaining = speed * dt;
    let guard = 0;
    while (remaining > 0 && m.path.length && guard++ < 8) {
      const next = m.path[0];
      const tx = next.x + 0.5, ty = next.y + 0.5;
      const ddx = tx - m.x, ddy = ty - m.y;
      const d = Math.hypot(ddx, ddy);
      if (d < 0.001) { m.path.shift(); continue; }
      if (d <= remaining) {
        m.x = tx; m.y = ty;
        m.path.shift();
        remaining -= d;
        if (m.path.length === 0) m.repath = 0;
      } else {
        m.x += (ddx / d) * remaining;
        m.y += (ddy / d) * remaining;
        remaining = 0;
      }
    }

    const nd = Math.hypot(this.player.x - m.x, this.player.y - m.y);
    if (nd < 0.62) this.endRun('caught');
  }

  updateWatchers(dt) {
    for (const w of this.watchers) {
      if (w.seen) { w.alpha = Math.max(0, w.alpha - dt * 2); continue; }
      const dx = w.x - this.player.x, dy = w.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 15) { w.alpha = Math.max(0, w.alpha - dt * 2); continue; }
      const rel = Math.abs(wrapAngle(Math.atan2(dy, dx) - this.player.angle));
      if (rel < 0.5 && hasLineOfSight(this.level, this.player.x, this.player.y, w.x, w.y)) {
        w.seenT += dt;
        if (w.seenT > 0.35) w.seen = true;
      } else {
        w.seenT = Math.max(0, w.seenT - dt * 0.4);
      }
      const near = clamp((15 - dist) / 7, 0, 1) * clamp((dist - 2.4) / 2.6, 0, 1);
      const flicker = 0.45 + 0.55 * Math.sin(this.time * 1.7 + w.phase);
      w.alpha = near * flicker * 0.5;
    }
  }

  updateEchoes(dt) {
    for (const e of this.echoes) {
      e.life -= dt;
      e.alpha = Math.max(0, Math.min(0.22, e.life * 0.08)) * (0.5 + 0.5 * Math.sin(this.time * 5 + e.phase));
    }
    this.echoes = this.echoes.filter(e => e.life > 0);
    if (this.state.breakLevel < 1) return;
    this.echoTimer -= dt;
    if (this.echoTimer <= 0) {
      this.echoTimer = 5 + Math.random() * 6;
      const candidates = [];
      for (let y = 1; y < this.level.h - 1; y += 2) {
        for (let x = 1; x < this.level.w - 1; x += 2) {
          if (this.level.grid[y * this.level.w + x] !== 0) continue;
          const d = Math.hypot(x + 0.5 - this.player.x, y + 0.5 - this.player.y);
          if (d > 3 && d < 9) candidates.push({ x: x + 0.5, y: y + 0.5 });
        }
      }
      if (candidates.length) {
        const p = candidates[(Math.random() * candidates.length) | 0];
        this.echoes.push({ x: p.x, y: p.y, life: 3.5, phase: Math.random() * 6, alpha: 0.2 });
      }
    }
  }

  updateCompass() {
    const el = this.el;
    if (this.state.listen <= 0) {
      el.compass.classList.remove('on');
      return;
    }
    const target = this.sigils[this.state.listenTarget];
    if (!target || target.collected) {
      el.compass.classList.remove('on');
      return;
    }
    const dx = target.x - this.player.x, dy = target.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    const rel = wrapAngle(Math.atan2(dy, dx) - this.player.angle);
    el.compass.classList.add('on');
    el.compassArrow.style.transform = `rotate(${(rel * 180 / Math.PI).toFixed(1)}deg)`;
    el.compassArrow.classList.toggle('onscreen', Math.abs(rel) < 0.6);
    el.compassText.textContent = `SIGIL \u00b7 ${dist.toFixed(0)}M`;
    if (this.state.listenCooldown > 0) {
      el.listenBtn.classList.add('cooldown');
    }
    if (this.state.listen <= 0.05) el.compass.classList.remove('on');
  }

  checkExit() {
    if (this.state.mode !== 'playing') return;
    const ex = this.level.exit;
    const d = Math.hypot(this.player.x - (ex.x + 0.5), this.player.y - (ex.y + 0.5));
    if (d < 0.55) {
      if (this.collectedCount() >= 3) {
        this.winRun();
      } else if (this.sealedTimer <= 0) {
        this.sealedTimer = 5;
        this.say('THE GATE IS SEALED. THREE SIGILS.', 3200);
        this.audio.noiseBurst(0.5, 0.1, 200, 'lowpass');
      }
    }
  }

  updateAudio(dt) {
    const dx = this.monster.x - this.player.x;
    const dy = this.monster.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    const rel = wrapAngle(Math.atan2(dy, dx) - this.player.angle);
    const pan = clamp(Math.sin(rel), -1, 1);
    this.audio.update(dt, {
      distance: dist,
      gaze: this.state.gaze,
      observed: this.state.observed,
      pan,
      breakLevel: this.state.breakLevel,
    });
    if (this.state.listenCooldown <= 0) this.el.listenBtn.classList.remove('cooldown');
    else this.el.listenBtn.classList.add('cooldown');
  }

  updateHud(force = false) {
    const el = this.el;
    const collected = this.collectedCount();
    if (force || this.hudSigils !== collected) {
      this.hudSigils = collected;
      el.sigilPips.textContent = Array.from({ length: 3 }, (_, i) => (i < collected ? '\u25c6' : '\u25c7')).join(' ');
    }
    if (force || this.hudReality !== this.state.reality) {
      this.hudReality = this.state.reality;
      el.realityPips.textContent = Array.from({ length: 3 }, (_, i) => (i < this.state.reality ? '\u25a0' : '\u25a1')).join(' ');
      el.realityPips.parentElement.classList.toggle('danger', this.state.reality <= 1);
    }

    const gaze = this.state.gaze;
    el.gazeFill.style.width = `${(gaze * 100).toFixed(1)}%`;
    const show = gaze > 0.02 || this.state.observed;
    el.gazeWrap.classList.toggle('on', show);
    el.gazeWrap.classList.toggle('hot', gaze > 0.68);
    if (gaze > 0.9) el.gazeLabel.textContent = 'IT IS INSIDE YOUR EYES';
    else if (gaze > 0.68) el.gazeLabel.textContent = 'REALITY IS THINNING';
    else if (this.state.observed) el.gazeLabel.textContent = 'IT IS STILL \u00b7 DON\u2019T STARE';
    else el.gazeLabel.textContent = 'IT IS STILL';

    el.reticle.classList.toggle('locked', this.state.observed);
  }

  updateCss() {
    const gaze = this.state.gaze;
    const brk = this.state.breakLevel;
    const root = document.documentElement.style;
    root.setProperty('--gaze', gaze.toFixed(3));
    root.setProperty('--vignette', (0.55 + gaze * 0.4 + brk * 0.06).toFixed(3));
    root.setProperty('--edge', (gaze * 0.8).toFixed(3));
    root.setProperty('--sat', (1 - brk * 0.16 + gaze * 0.08 - (this.state.mode === 'dying' ? 0.5 : 0)).toFixed(3));
    root.setProperty('--hue', `${(brk * -6 + (gaze > 0.8 ? Math.sin(this.time * 9) * 8 : 0)).toFixed(1)}deg`);

    const shake = this.state.shake;
    if (shake > 0.15 || this.state.tears > 0.1) {
      const sx = (Math.random() * 2 - 1) * shake;
      const sy = (Math.random() * 2 - 1) * shake;
      this.canvas.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(1.02)`;
    } else if (this.canvas.style.transform) {
      this.canvas.style.transform = '';
    }
  }

  render() {
    const menu = this.state.mode === 'menu';
    const sway = menu ? Math.sin(this.time * 0.17) * 0.1 : 0;
    const px = this.player.x;
    const py = this.player.y;
    const angle = this.player.angle + sway;
    const pitch = this.player.pitch + (menu ? Math.sin(this.time * 0.23) * 0.012 : 0);
    const view = {
      level: this.level,
      px, py,
      angle,
      pitch,
      bob: this.player.bobY,
      time: this.time,
      breakLevel: this.state.breakLevel,
      gaze: this.state.gaze,
      tear: this.state.tears,
      flashPulse: this.state.flashPulse,
      shake: this.state.shake,
      grain: 0.055,
      sigils: this.sigils || [],
      portal: {
        x: this.level.exit.x + 0.5,
        y: this.level.exit.y + 0.5,
        unlocked: (this.sigils || []).filter(s => s.collected).length >= 3,
      },
      monster: {
        x: this.monster.x,
        y: this.monster.y,
        alpha: menu ? 0 : 1,
        phase: this.monster.phase,
        scream: Math.hypot(this.monster.x - px, this.monster.y - py) < 1.9 || this.monster.boost > 2.4,
        tint: [1, 1, 1],
      },
      watchers: menu ? [] : this.watchers,
      echoes: menu ? [] : this.echoes,
    };
    this.renderer.render(view);
  }

  exposeDebug() {
    const game = this;
    window.__DLB = {
      game,
      get state() {
        return {
          mode: game.state.mode,
          gaze: game.state.gaze,
          reality: game.state.reality,
          breakLevel: game.state.breakLevel,
          sigils: game.collectedCount(),
          observed: game.state.observed,
          player: { x: game.player.x, y: game.player.y, angle: game.player.angle },
          monster: { x: game.monster.x, y: game.monster.y },
          level: {
            start: game.level.start,
            exit: game.level.exit,
            sigils: game.level.sigils,
            seed: game.level.seed,
            w: game.level.w,
            h: game.level.h,
            grid: Array.from(game.level.grid),
          },
          renderer: { w: game.renderer.w, h: game.renderer.h },
        };
      },
      start: () => game.beginRun(),
      pause: () => game.pause(),
      teleport: (x, y) => { game.player.x = x; game.player.y = y; },
      look: (a) => { game.player.angle = a; },
      placeMonster: (x, y) => { game.monster.x = x; game.monster.y = y; game.monster.path = []; },
      setGaze: (v) => { game.state.gaze = clamp(v, 0, 1); },
      forceFracture: () => game.fracture(),
      collectAllSigils: () => {
        game.sigils.forEach(s => { s.collected = true; });
        game.updateHud(true);
      },
      goToExit: () => {
        game.player.x = game.level.exit.x + 0.5;
        game.player.y = game.level.exit.y + 0.5;
      },
      goToSigil: (i = 0) => {
        const s = game.sigils[i];
        if (s) { game.player.x = s.x; game.player.y = s.y; }
      },
      settings: () => ({ ...game.settings }),
      hint: () => game.say('THE MONSTER MOVES WHEN UNSEEN. STARE TO FREEZE IT.', 2500),
    };
  }
}

new Game();
