// ============================================================
// NEON OVERDRIVE — core game
// A pseudo-3D neon highway racer rendered on a 2D canvas.
// ============================================================

import { NeonAudio } from './audio.js';
import {
  createPlayerSprite,
  createTrafficSprite,
  createPickupSprite,
  createGlow,
  createDebrisSprite,
  TRAFFIC_COLORS,
  rgba,
} from './sprites.js';

const TAU = Math.PI * 2;
const VIEW_DIST = 172;
const PLAYER_Z = 7;
const LANES = [-0.63, 0, 0.63];
const BEST_KEY = 'neon-overdrive.best';
const LEVEL_LENGTH = 750;
const MAX_PARTICLES = 620;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const pad2 = (n) => String(n).padStart(2, '0');
const pad7 = (n) => String(Math.max(0, Math.floor(n))).padStart(7, '0');
const comma = (n) => Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GLOW_COLORS = {
  cyan: '#31f2ff',
  white: '#eaffff',
  magenta: '#ff2bcc',
  violet: '#9d5cff',
  amber: '#ffc45c',
  red: '#ff3d5e',
  lime: '#b8ff4a',
  orange: '#ff8a2b',
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.audio = new NeonAudio();

    this.state = 'menu';
    this.time = 0;
    this.lastTs = performance.now();
    this.frame = 0;

    this.best = this.#loadBest();
    this.runId = '000000';
    this.score = 0;
    this.distance = 0;
    this.speed = 30;
    this.baseSpeed = 44;
    this.hull = 100;
    this.nitro = 50;
    this.combo = 1;
    this.comboTimer = 0;
    this.level = 1;
    this.runTime = 0;
    this.nearMisses = 0;
    this.collisions = 0;
    this.topSpeed = 0;
    this.bestChain = 1;
    this.newRecordLive = false;

    this.boosting = false;
    this.boostVisual = 0;
    this.invuln = 0;
    this.grace = 0;
    this.hitFlash = 0;
    this.shake = 0;
    this.nearFx = 0;
    this.nitroLock = 0;
    this.boostCooldown = 0;

    this.player = { x: 0, vx: 0, tilt: 0, w: 0.155, dead: false };
    this.camSway = 0;
    this.curve = 0;
    this.curveTarget = 0;
    this.curveTimer = 0;
    this.bgShift = 0;

    this.traffic = [];
    this.pickups = [];
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      life: 0, max: 1, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0,
      size: 10, color: 'cyan', smoke: false, drag: 0.9, gravity: 0, angle: 0, spin: 0,
    }));
    this.particleCursor = 0;
    this.debris = Array.from({ length: 26 }, () => ({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, size: 10, sprite: 0 }));
    this.debrisCursor = 0;
    this.rings = [];
    this.floats = [];
    this.meteor = { life: 0, delay: rand(2, 6), x: 0, y: 0, vx: 0, vy: 0 };

    this.spawnTimer = 0.8;
    this.pickupTimer = 1.2;
    this.menuSpawn = 0.8;
    this.menuPickup = 1.5;
    this.hudTick = 0;
    this.audioTick = 0;
    this.exhaustTimer = 0;
    this.deathTimer = 0;

    this.keys = new Set();
    this.input = { touchSteer: 0, touchNitro: false };
    this.pointer = null;
    this.isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || window.innerWidth <= 820;

    this.ui = {
      hud: document.getElementById('hud'),
      score: document.getElementById('score'),
      hudBest: document.getElementById('hud-best'),
      combo: document.getElementById('combo'),
      comboX: document.getElementById('combo-x'),
      comboBar: document.getElementById('combo-bar'),
      sector: document.getElementById('sector'),
      speed: document.getElementById('speed'),
      distance: document.getElementById('distance'),
      hullBars: document.getElementById('hull-bars'),
      hullBlock: document.querySelector('.hull-block'),
      hullText: document.getElementById('hull-text'),
      nitroFill: document.getElementById('nitro-fill'),
      nitroPct: document.getElementById('nitro-pct'),
      nitroBar: document.querySelector('.nitro-bar'),
      nitroBlock: document.querySelector('.nitro-block'),
      nitroHint: document.getElementById('nitro-hint'),
      menuBest: document.getElementById('menu-best'),
      overBest: document.getElementById('over-best'),
      pauseScore: document.getElementById('pause-score'),
      pauseDistance: document.getElementById('pause-distance'),
      pauseCombo: document.getElementById('pause-combo'),
      finalScore: document.getElementById('final-score'),
      finalDistance: document.getElementById('final-distance'),
      finalSpeed: document.getElementById('final-speed'),
      finalNearMiss: document.getElementById('final-nearmiss'),
      finalCombo: document.getElementById('final-combo'),
      newRecord: document.getElementById('new-record'),
      runCode: document.getElementById('run-code'),
      screens: Array.from(document.querySelectorAll('.screen')),
      touch: document.getElementById('touch-controls'),
      toast: document.getElementById('toast-layer'),
      nitroFx: document.getElementById('nitro-fx'),
      hitFx: document.getElementById('hit-fx'),
      launch: document.getElementById('launch-flash'),
    };

    this.sprites = {
      player: createPlayerSprite(),
      pickups: {
        coin: createPickupSprite('coin'),
        orb: createPickupSprite('orb'),
        surge: createPickupSprite('surge'),
      },
      traffic: new Map(),
      debris: ['#ff2bcc', '#31f2ff', '#ffc45c', '#9d5cff', '#ff8a2b'].map((c) => createDebrisSprite(c)),
    };
    this.glows = {};
    for (const [key, color] of Object.entries(GLOW_COLORS)) {
      this.glows[key] = createGlow(color, 192, 0.82);
    }

    this.#bindEvents();
    this.resize();
    this.#syncMuteUI();
    this.#updateBestDisplays();
    this.resetAttract();
    this.#setState('menu');
    this.#showScreen('screen-menu');
    this.#updateHud(true);

    requestAnimationFrame((ts) => this.#loop(ts));
  }

  // ----------------------------------------------------------
  // Layout & background construction
  // ----------------------------------------------------------

  resize() {
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(320, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.horizonY = h * (h < 560 ? 0.36 : 0.335);
    this.roadBottomY = h * 0.975;
    this.roadHalf = Math.min(w * 0.445, h * 0.465);
    this.centerX = w / 2;
    this.sun = {
      x: w * 0.715,
      y: this.horizonY - h * 0.105,
      r: Math.min(w, h) * 0.135,
    };
    this.planet = {
      x: w * 0.145,
      y: h * 0.145,
      r: Math.min(w, h) * 0.043,
    };

    this.#buildGradients();
    this.#buildSkyline();
    this.#buildStars();
    this.#buildBackgroundCache();
  }

  #buildGradients() {
    const c = this.ctx;
    const sky = c.createLinearGradient(0, 0, 0, this.horizonY + 60);
    sky.addColorStop(0, '#020007');
    sky.addColorStop(0.42, '#08021a');
    sky.addColorStop(0.76, '#180733');
    sky.addColorStop(0.93, '#2d0b4e');
    sky.addColorStop(1, '#45125d');
    this.skyGrad = sky;

    const ground = c.createLinearGradient(0, this.horizonY, 0, this.h);
    ground.addColorStop(0, '#1d0938');
    ground.addColorStop(0.16, '#100525');
    ground.addColorStop(0.55, '#080218');
    ground.addColorStop(1, '#04010d');
    this.groundGrad = ground;

    const road = c.createLinearGradient(0, this.horizonY, 0, this.h);
    road.addColorStop(0, '#2a0e48');
    road.addColorStop(0.08, '#1c0a35');
    road.addColorStop(0.33, '#110626');
    road.addColorStop(0.7, '#0b041b');
    road.addColorStop(1, '#070214');
    this.roadGrad = road;

    const haze = c.createLinearGradient(0, this.horizonY - 70, 0, this.horizonY + 90);
    haze.addColorStop(0, 'rgba(255, 43, 204, 0)');
    haze.addColorStop(0.55, 'rgba(157, 92, 255, 0.16)');
    haze.addColorStop(0.78, 'rgba(255, 43, 204, 0.18)');
    haze.addColorStop(1, 'rgba(255, 43, 204, 0)');
    this.hazeGrad = haze;

    const sun = c.createRadialGradient(this.sun.x, this.sun.y, 2, this.sun.x, this.sun.y, this.sun.r);
    sun.addColorStop(0, '#fff7cf');
    sun.addColorStop(0.25, '#ffd27a');
    sun.addColorStop(0.55, '#ff8a3d');
    sun.addColorStop(0.82, '#ff2b8f');
    sun.addColorStop(1, '#ff2bcc');
    this.sunGrad = sun;
  }

  #buildStars() {
    const rng = mulberry32(0x5eeda11);
    this.stars = Array.from({ length: 130 }, () => ({
      x: rng() * this.w,
      y: rng() * this.horizonY * 0.92,
      r: 0.4 + rng() * 1.5,
      phase: rng() * TAU,
      speed: 0.6 + rng() * 2.2,
      tint: rng() > 0.82 ? 'magenta' : rng() > 0.7 ? 'violet' : 'cyan',
    }));
  }

  // The sky is mostly static: bake its expensive gradients and glows once per
  // resize so each frame becomes a couple of image draws instead of dozens of
  // large software-rasterized fills.
  #buildBackgroundCache() {
    const w = Math.ceil(this.w);
    const h = Math.ceil(this.h);
    const skyH = Math.ceil(this.horizonY + 80);
    const sky = document.createElement('canvas');
    sky.width = Math.max(1, w);
    sky.height = Math.max(1, skyH);
    const g = sky.getContext('2d');

    g.fillStyle = this.skyGrad;
    g.fillRect(0, -40, w, skyH + 40);

    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.26;
    g.drawImage(this.glows.violet, w * 0.08 - w * 0.3, -h * 0.05, w * 0.6, h * 0.55);
    g.globalAlpha = 0.14;
    g.drawImage(this.glows.magenta, w * 0.58 - w * 0.25, h * 0.02, w * 0.55, h * 0.5);
    g.globalAlpha = 0.16;
    g.drawImage(this.glows.cyan, w * 0.38 - w * 0.3, this.horizonY - h * 0.24, w * 0.65, h * 0.35);
    g.restore();

    const sun = this.sun;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.42;
    g.drawImage(this.glows.magenta, sun.x - sun.r * 2.7, sun.y - sun.r * 2.7, sun.r * 5.4, sun.r * 5.4);
    g.globalAlpha = 0.22;
    g.drawImage(this.glows.orange || this.glows.amber, sun.x - sun.r * 1.8, sun.y - sun.r * 1.8, sun.r * 3.6, sun.r * 3.6);
    g.restore();

    g.save();
    g.beginPath();
    g.arc(sun.x, sun.y, sun.r, 0, TAU);
    g.clip();
    g.fillStyle = this.sunGrad;
    g.fillRect(sun.x - sun.r, sun.y - sun.r, sun.r * 2, sun.r * 2);
    g.fillStyle = 'rgba(8,2,20,0.9)';
    for (let i = 0; i < 9; i++) {
      const yy = sun.y + sun.r * (-0.2 + i * 0.13);
      const hh = sun.r * (0.014 + i * 0.012);
      g.fillRect(sun.x - sun.r, yy, sun.r * 2, hh);
    }
    const rim = g.createLinearGradient(0, sun.y - sun.r, 0, sun.y + sun.r);
    rim.addColorStop(0, 'rgba(255,255,255,0.28)');
    rim.addColorStop(1, 'rgba(255,43,204,0)');
    g.strokeStyle = rim;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(sun.x, sun.y, sun.r - 1, 0, TAU);
    g.stroke();
    g.restore();

    const pl = this.planet;
    g.save();
    g.translate(pl.x, pl.y);
    g.rotate(-0.36);
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(49,242,255,0.5)';
    g.lineWidth = Math.max(1, pl.r * 0.11);
    g.beginPath();
    g.ellipse(0, 0, pl.r * 2.15, pl.r * 0.54, 0, 0, TAU);
    g.stroke();
    g.strokeStyle = 'rgba(255,43,204,0.26)';
    g.lineWidth = Math.max(1, pl.r * 0.05);
    g.beginPath();
    g.ellipse(0, 0, pl.r * 2.5, pl.r * 0.64, 0, 0, TAU);
    g.stroke();
    g.globalCompositeOperation = 'source-over';
    const pg = g.createRadialGradient(-pl.r * 0.3, -pl.r * 0.32, 1, 0, 0, pl.r);
    pg.addColorStop(0, '#d9feff');
    pg.addColorStop(0.4, '#54d9e8');
    pg.addColorStop(0.8, '#23568f');
    pg.addColorStop(1, '#0c1638');
    g.fillStyle = pg;
    g.beginPath();
    g.arc(0, 0, pl.r, 0, TAU);
    g.fill();
    g.restore();

    this.bgSky = sky;

    const ground = document.createElement('canvas');
    ground.width = Math.max(1, w);
    ground.height = Math.max(1, h);
    const f = ground.getContext('2d');
    f.fillStyle = this.groundGrad;
    f.fillRect(0, this.horizonY, w, h - this.horizonY + 2);
    f.fillStyle = this.hazeGrad;
    f.fillRect(0, this.horizonY - 70, w, 160);
    const hg = f.createLinearGradient(0, this.horizonY - 2, 0, this.horizonY + 12);
    hg.addColorStop(0, 'rgba(255,43,204,0)');
    hg.addColorStop(0.45, 'rgba(255,138,232,0.5)');
    hg.addColorStop(0.7, 'rgba(49,242,255,0.35)');
    hg.addColorStop(1, 'rgba(49,242,255,0)');
    f.fillStyle = hg;
    f.fillRect(0, this.horizonY - 2, w, 14);
    this.bgGround = ground;
  }

  #makeSkyline(w, h, near, seed) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(w));
    canvas.height = Math.max(1, Math.ceil(h));
    const g = canvas.getContext('2d');
    const rng = mulberry32(seed);
    g.clearRect(0, 0, w, h);

    if (!near) {
      const base = g.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, 'rgba(32, 10, 66, 0)');
      base.addColorStop(0.7, 'rgba(32, 10, 66, 0.2)');
      base.addColorStop(1, 'rgba(60, 18, 100, 0.28)');
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
    }

    let x = -40;
    while (x < w + 40) {
      const bw = (near ? 34 : 24) + rng() * (near ? 100 : 78);
      const maxH = near ? h * 0.88 : h * 0.78;
      const bh = h * (near ? 0.26 : 0.2) + rng() * maxH * 0.7;
      const y = h - bh;

      if (near) {
        const bg = g.createLinearGradient(0, y, 0, h);
        bg.addColorStop(0, '#0b0420');
        bg.addColorStop(0.5, '#060213');
        bg.addColorStop(1, '#030009');
        g.fillStyle = bg;
        g.fillRect(x, y, bw, bh + 4);
        // neon crown
        g.strokeStyle = rng() > 0.5 ? 'rgba(49,242,255,0.26)' : 'rgba(255,43,204,0.24)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, y + 1);
        g.lineTo(x + bw, y + 1);
        g.stroke();
        // vertical sign
        if (rng() > 0.7) {
          const sx = x + 5 + rng() * (bw - 14);
          const sh = Math.min(bh * 0.42, 30 + rng() * 60);
          const col = rng() > 0.5 ? 'rgba(49,242,255,0.28)' : 'rgba(255,43,204,0.26)';
          g.fillStyle = col;
          g.fillRect(sx, y + 8, 2, sh);
          g.fillStyle = 'rgba(255,255,255,0.16)';
          g.fillRect(sx, y + 8, 2, 3);
        }
      } else {
        const bg = g.createLinearGradient(0, y, 0, h);
        bg.addColorStop(0, '#160733');
        bg.addColorStop(0.55, '#0d0522');
        bg.addColorStop(1, '#080216');
        g.fillStyle = bg;
        g.fillRect(x, y, bw, bh + 4);
      }

      // windows
      const dotW = near ? 3 : 2;
      const gap = near ? 8 : 7;
      const cols = Math.max(1, Math.floor((bw - 8) / gap));
      const rows = Math.max(1, Math.floor((bh - 12) / (near ? 11 : 9)));
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          if (rng() > (near ? 0.74 : 0.62)) {
            const a = 0.08 + rng() * (near ? 0.32 : 0.22);
            g.fillStyle = rng() > 0.84
              ? `rgba(255,138,232,${a})`
              : rng() > 0.5
                ? `rgba(120,220,255,${a})`
                : `rgba(180,160,255,${a * 0.8})`;
            g.fillRect(x + 5 + cx * gap, y + 8 + cy * (near ? 11 : 9), dotW, near ? 3 : 2);
          }
        }
      }

      // antenna / spire
      if (rng() > 0.66) {
        const ax = x + bw * (0.2 + rng() * 0.6);
        const ah = 10 + rng() * (near ? 60 : 34);
        g.strokeStyle = near ? 'rgba(157,92,255,0.32)' : 'rgba(157,92,255,0.2)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(ax, y);
        g.lineTo(ax, y - ah);
        g.stroke();
        g.fillStyle = rng() > 0.5 ? 'rgba(255,61,110,0.8)' : 'rgba(49,242,255,0.65)';
        g.fillRect(ax - 1, y - ah - 1, 2, 2);
      }

      // rooftop machinery
      if (rng() > 0.7) {
        g.fillStyle = near ? '#0a0320' : '#10062a';
        g.fillRect(x + bw * 0.2, y - 5 - rng() * 9, bw * 0.26, 8);
      }

      x += bw + (near ? 4 : 2) + rng() * (near ? 16 : 10);
    }

    // atmospheric base glow
    const glow = g.createLinearGradient(0, h * 0.55, 0, h);
    glow.addColorStop(0, 'rgba(157,92,255,0)');
    glow.addColorStop(1, near ? 'rgba(255,43,204,0.09)' : 'rgba(49,242,255,0.07)');
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);

    return { canvas, w, h };
  }

  #buildSkyline() {
    const w = Math.ceil(this.w * 1.8);
    this.skyFar = this.#makeSkyline(w, Math.ceil(this.h * 0.29), false, 0x51f15e);
    this.skyNear = this.#makeSkyline(w, Math.ceil(this.h * 0.27), true, 0x9e3779);
  }

  // ----------------------------------------------------------
  // Persistence & UI helpers
  // ----------------------------------------------------------

  #loadBest() {
    try {
      const v = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    } catch {
      return 0;
    }
  }

  #saveBest(value) {
    this.best = Math.max(this.best, Math.floor(value));
    try { localStorage.setItem(BEST_KEY, String(this.best)); } catch { /* private mode */ }
  }

  #updateBestDisplays() {
    const text = pad7(this.best);
    if (this.ui.menuBest) this.ui.menuBest.textContent = text;
    if (this.ui.hudBest) this.ui.hudBest.textContent = text;
    if (this.ui.overBest) this.ui.overBest.textContent = text;
  }

  #syncMuteUI() {
    const muted = this.audio.muted;
    document.querySelectorAll('[data-mute]').forEach((el) => {
      el.classList.toggle('muted', muted);
      el.setAttribute('aria-pressed', String(muted));
    });
    const footer = document.querySelector('.footer-sound');
    if (footer) footer.textContent = muted ? 'SOUND MUTED — PRESS M TO RESTORE' : 'SOUND ON — PRESS M TO MUTE';
    const pauseMute = document.querySelector('.pause-panel .text-btn');
    if (pauseMute) pauseMute.lastChild.textContent = muted ? 'SOUND OFF' : 'TOGGLE SOUND';
  }

  #showScreen(id) {
    for (const panel of this.ui.screens) panel.classList.toggle('active', panel.id === id);
  }

  #hideScreens() {
    for (const panel of this.ui.screens) panel.classList.remove('active');
  }

  #setState(next) {
    this.state = next;
    document.body.dataset.state = next;
    const hudActive = next === 'playing' || next === 'paused' || next === 'dying';
    if (this.ui.hud) {
      this.ui.hud.inert = !hudActive;
      this.ui.hud.setAttribute('aria-hidden', String(!hudActive));
    }
    if (this.ui.touch) {
      const showTouch = next === 'playing' && this.isTouch;
      this.ui.touch.classList.toggle('show', showTouch);
      this.ui.touch.setAttribute('aria-hidden', String(!showTouch));
    }
  }

  showCallout(text, danger = false) {
    if (!this.ui.toast) return;
    const el = document.createElement('div');
    el.className = `callout${danger ? ' danger' : ''}`;
    el.textContent = text;
    this.ui.toast.appendChild(el);
    while (this.ui.toast.children.length > 2) this.ui.toast.firstChild.remove();
    window.setTimeout(() => el.remove(), 2400);
  }

  // ----------------------------------------------------------
  // Run lifecycle
  // ----------------------------------------------------------

  resetAttract() {
    this.traffic = [];
    this.pickups = [];
    this.rings = [];
    this.floats = [];
    for (const p of this.particles) p.life = 0;
    for (const d of this.debris) d.life = 0;

    this.distance = rand(0, 500);
    this.speed = 32;
    this.level = 1;
    this.score = 0;
    this.nitro = 50;
    this.player.x = 0;
    this.player.vx = 0;
    this.player.tilt = 0;
    this.player.dead = false;
    this.curvatureInit();
    this.seedWorld(5, 3);
  }

  curvatureInit() {
    this.curve = rand(-0.03, 0.03);
    this.curveTarget = rand(-0.06, 0.06);
    this.curveTimer = rand(5, 10);
    this.camSway = 0;
  }

  resetRun() {
    this.score = 0;
    this.distance = 0;
    this.speed = 22;
    this.baseSpeed = 44;
    this.hull = 100;
    this.nitro = 42;
    this.combo = 1;
    this.comboTimer = 0;
    this.level = 1;
    this.runTime = 0;
    this.nearMisses = 0;
    this.collisions = 0;
    this.topSpeed = 0;
    this.bestChain = 1;
    this.newRecordLive = false;
    this.boosting = false;
    this.boostVisual = 0;
    this.invuln = 0;
    this.grace = 1.15;
    this.hitFlash = 0;
    this.shake = 0;
    this.nearFx = 0;
    this.nitroLock = 0;
    this.boostCooldown = 0;
    this.deathTimer = 0;
    this.spawnTimer = 0.7;
    this.pickupTimer = 0.9;
    this.exhaustTimer = 0;
    this.player.x = 0;
    this.player.vx = 0;
    this.player.tilt = 0;
    this.player.dead = false;
    this.pointer = null;
    this.curvatureInit();

    this.traffic = [];
    this.pickups = [];
    this.rings = [];
    this.floats = [];
    for (const p of this.particles) p.life = 0;
    for (const d of this.debris) d.life = 0;
    this.seedWorld(5, 2);
    this.runId = Math.floor(rand(0x100000, 0xffffff)).toString(16).toUpperCase();
    this.#updateHud(true);
  }

  seedWorld(cars, clusters) {
    for (let i = 0; i < cars; i++) this.spawnTraffic(rand(42, 158), true);
    for (let i = 0; i < clusters; i++) this.spawnPickupCluster(true);
  }

  startRun() {
    this.audio.unlock();
    this.audio.start();
    this.resetRun();
    this.#hideScreens();
    this.#setState('playing');
    this.#updateHud(true);
    this.#updateBestDisplays();
    if (this.ui.launch) {
      this.ui.launch.classList.remove('fire');
      void this.ui.launch.offsetWidth;
      this.ui.launch.classList.add('fire');
      window.setTimeout(() => this.ui.launch.classList.remove('fire'), 1000);
    }
    this.audio.startEngine();
    this.audio.startMusic();
    this.audio.countdown(true);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.#setState('paused');
    this.pointer = null;
    this.keys.clear();
    this.input.touchSteer = 0;
    this.input.touchNitro = false;
    if (this.ui.pauseScore) this.ui.pauseScore.textContent = pad7(this.score);
    if (this.ui.pauseDistance) this.ui.pauseDistance.textContent = `${comma(this.distance)} M`;
    if (this.ui.pauseCombo) this.ui.pauseCombo.textContent = `x${this.combo.toFixed(1)}`;
    this.audio.stopEngine();
    this.audio.stopMusic();
    this.audio.setNitro(false);
    this.audio.click();
    this.#showScreen('screen-pause');
    this.#updateHud(true);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.#hideScreens();
    this.#setState('playing');
    this.audio.unlock();
    this.audio.startEngine();
    this.audio.startMusic();
    this.audio.click();
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  quitToMenu() {
    this.audio.stopMusic();
    this.audio.stopEngine();
    this.audio.setNitro(false);
    this.resetAttract();
    this.#setState('menu');
    this.#showScreen('screen-menu');
    this.#updateBestDisplays();
    this.#updateHud(true);
    this.audio.click();
  }

  // ----------------------------------------------------------
  // Input
  // ----------------------------------------------------------

  #bindEvents() {
    window.addEventListener('resize', () => {
      this.pointer = null;
      this.resize();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause();
    });
    window.addEventListener('blur', () => {
      if (this.state === 'playing') this.pause();
    });

    document.addEventListener('keydown', (e) => this.#onKey(e, true));
    document.addEventListener('keyup', (e) => this.#onKey(e, false));

    const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    on('start-btn', () => this.startRun());
    on('restart-btn', () => this.startRun());
    on('resume-btn', () => this.resume());
    on('pause-restart-btn', () => this.startRun());
    on('pause-menu-btn', () => this.quitToMenu());
    on('over-menu-btn', () => this.quitToMenu());
    on('btn-pause', () => this.togglePause());

    document.querySelectorAll('[data-mute]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.audio.unlock();
        this.audio.toggleMute();
        this.#syncMuteUI();
      });
    });

    const canvas = this.canvas;
    canvas.addEventListener('pointerdown', (e) => {
      this.audio.unlock();
      if (this.state !== 'playing') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
      this.pointer = {
        id: e.pointerId,
        startX: e.clientX,
        carX: this.player.x,
        targetX: this.player.x,
      };
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.pointer || e.pointerId !== this.pointer.id) return;
      const spread = Math.max(90, this.roadHalf * 0.62);
      const dx = e.clientX - this.pointer.startX;
      this.pointer.targetX = clamp(this.pointer.carX + dx / spread, -0.842, 0.842);
    });
    const endPointer = (e) => {
      if (this.pointer && e.pointerId === this.pointer.id) this.pointer = null;
    };
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('lostpointercapture', endPointer);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const hold = (el, press, release) => {
      if (!el) return;
      let active = null;
      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.unlock();
        active = e.pointerId;
        el.classList.add('pressed');
        try { el.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
        press();
      };
      const end = (e) => {
        if (active !== null && e.pointerId !== active) return;
        active = null;
        el.classList.remove('pressed');
        release();
      };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('lostpointercapture', end);
    };

    hold(document.getElementById('touch-left'),
      () => { this.input.touchSteer = -1; },
      () => { if (this.input.touchSteer === -1) this.input.touchSteer = 0; });
    hold(document.getElementById('touch-right'),
      () => { this.input.touchSteer = 1; },
      () => { if (this.input.touchSteer === 1) this.input.touchSteer = 0; });
    hold(document.getElementById('touch-nitro'),
      () => { this.input.touchNitro = true; },
      () => { this.input.touchNitro = false; });
  }

  #onKey(e, down) {
    const code = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) {
      e.preventDefault();
    }
    if (down) this.audio.unlock();

    if (down && !e.repeat) {
      if (code === 'KeyM') {
        this.audio.toggleMute();
        this.#syncMuteUI();
        return;
      }
      if (code === 'KeyP' || code === 'Escape') {
        if (this.state === 'playing' || this.state === 'paused') {
          this.togglePause();
          return;
        }
        if (code === 'Escape' && this.state === 'over') {
          this.quitToMenu();
          return;
        }
      }
      if ((code === 'Enter' || code === 'Space') && (this.state === 'menu' || this.state === 'over')) {
        this.startRun();
        return;
      }
      if (code === 'Enter' && this.state === 'paused') {
        this.resume();
        return;
      }
      if (code === 'KeyR' && (this.state === 'paused' || this.state === 'over')) {
        this.startRun();
        return;
      }
    }

    if (down) this.keys.add(code);
    else this.keys.delete(code);
  }

  #axis() {
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    return clamp((right ? 1 : 0) - (left ? 1 : 0) + this.input.touchSteer, -1, 1);
  }

  #nitroHeld() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ||
      this.keys.has('Space') || this.input.touchNitro;
  }

  // ----------------------------------------------------------
  // Main loop & state updates
  // ----------------------------------------------------------

  #loop(ts) {
    const dt = clamp((ts - this.lastTs) / 1000, 0, 0.05);
    this.lastTs = ts;
    this.frame++;

    if (this.state !== 'paused') {
      this.time += dt;
      this.#updateMeteor(dt);

      if (this.state === 'menu') this.#updateMenu(dt);
      else if (this.state === 'playing') this.#updatePlaying(dt);
      else if (this.state === 'dying') this.#updateDying(dt);
      else if (this.state === 'over') this.#updateOver(dt);
    }

    this.render();
    this.#updateFxDom();
    requestAnimationFrame((next) => this.#loop(next));
  }

  #updateMenu(dt) {
    this.distance += 34 * dt;
    this.speed = 34;
    const t = this.time;
    this.player.x = Math.sin(t * 0.55) * 0.42;
    this.player.vx = Math.cos(t * 0.55) * 0.42 * 0.55;
    this.player.tilt = clamp(this.player.vx * 0.06, -0.16, 0.16);
    this.#updateCamera(dt);

    this.menuSpawn -= dt;
    if (this.menuSpawn <= 0) {
      if (this.traffic.length < 5) this.spawnTraffic();
      this.menuSpawn = rand(0.8, 1.6);
    }
    this.menuPickup -= dt;
    if (this.menuPickup <= 0) {
      if (this.pickups.length < 10) this.spawnPickupCluster(true);
      this.menuPickup = rand(1.2, 2.2);
    }

    this.updateTraffic(dt, true);
    this.updatePickups(dt, true);
    this.updateParticles(dt);
    this.updateRings(dt);
    this.updateFloats(dt);
    this.updateDebris(dt);

    this.exhaustTimer -= dt;
    if (this.exhaustTimer <= 0) {
      this.spawnExhaust(false, true);
      this.exhaustTimer = 0.09;
    }
    this.boostVisual = lerp(this.boostVisual, 0, Math.min(1, dt * 3));
    this.shake = 0;
    this.hitFlash = 0;
    this.nearFx = 0;
  }

  #updatePlaying(dt) {
    this.runTime += dt;
    if (this.grace > 0) this.grace -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.nitroLock > 0) this.nitroLock -= dt;
    if (this.boostCooldown > 0) this.boostCooldown -= dt;

    this.comboTimer -= dt;
    if (this.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - dt * 1.35);
      if (this.combo < 1.02) this.combo = 1;
    }

    const nextLevel = 1 + Math.floor(this.distance / LEVEL_LENGTH);
    if (nextLevel > this.level) {
      this.level = nextLevel;
      this.score += 350 * this.level;
      this.nitro = Math.min(100, this.nitro + 12);
      this.spawnTimer = 0;
      this.showCallout(`SECTOR ${pad2(this.level)} // SPEED UP`, true);
      this.audio.levelUp();
      const p = this.project(PLAYER_Z, this.player.x);
      this.addRing(p.x, p.y, 30, Math.max(this.w, this.h) * 0.5, 0.8, 'magenta', 0.6);
    }

    this.baseSpeed = 44 + Math.min(46, this.distance * 0.007 + this.runTime * 0.13);
    const slowdown = this.invuln > 1.1 ? 0.93 : 1;

    const wantBoost = this.#nitroHeld() && this.nitro > 0.4 &&
      this.nitroLock <= 0 && this.boostCooldown <= 0 && !this.player.dead;
    this.boosting = wantBoost;
    if (this.boosting) {
      this.nitro -= 30 * dt;
      if (this.nitro <= 0) {
        this.nitro = 0;
        this.boosting = false;
        this.nitroLock = 1.15;
        this.boostCooldown = 0.45;
      }
    } else {
      this.nitro = Math.min(100, this.nitro + 2.1 * dt);
    }

    const targetSpeed = this.baseSpeed * (this.boosting ? 1.42 : 1) * slowdown;
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 2.2);
    this.topSpeed = Math.max(this.topSpeed, this.speed);
    this.distance += this.speed * dt;
    this.score += dt * (9 + this.speed * 0.52) * this.combo * (this.boosting ? 1.35 : 1);

    this.#updateSteering(dt);
    this.#updateCamera(dt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 || (this.traffic.length < 3 && this.spawnTimer < 0.3)) {
      this.spawnTraffic();
      this.spawnTimer = Math.max(0.34, 1.35 - this.level * 0.055) * rand(0.7, 1.35);
    }
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.spawnPickupCluster();
      this.pickupTimer = rand(1.05, 1.8);
    }

    this.updateTraffic(dt, false);
    this.updatePickups(dt, false);
    this.updateParticles(dt);
    this.updateRings(dt);
    this.updateFloats(dt);
    this.updateDebris(dt);

    this.shake *= Math.exp(-dt * 7);
    if (this.shake < 0.15) this.shake = 0;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.4);
    this.nearFx = Math.max(0, this.nearFx - dt * 3);
    this.boostVisual = lerp(this.boostVisual, this.boosting ? 1 : 0, Math.min(1, dt * 6));

    this.exhaustTimer -= dt;
    if (this.exhaustTimer <= 0) {
      this.spawnExhaust(this.boosting, false);
      this.exhaustTimer = this.boosting ? 0.022 : 0.06;
    }

    this.audioTick -= dt;
    if (this.audioTick <= 0) {
      this.audio.setEngine(clamp(this.speed / 130, 0, 1), this.boostVisual);
      this.audio.setNitro(this.boosting);
      this.audioTick = 0.1;
    }

    this.hudTick -= dt;
    if (this.hudTick <= 0) {
      this.#updateHud();
      this.hudTick = 0.06;
    }

    if (!this.newRecordLive && this.best > 0 && this.score > this.best) {
      this.newRecordLive = true;
      this.showCallout('NEW PERSONAL BEST // KEEP GOING');
      this.audio.highScore();
    }
  }

  #updateDying(dt) {
    this.deathTimer += dt;
    this.speed = Math.max(0, this.speed - 55 * dt);
    this.distance += this.speed * dt;
    this.shake *= Math.exp(-dt * 5.5);
    if (this.shake < 0.15) this.shake = 0;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 1.2);
    this.boostVisual = Math.max(0, this.boostVisual - dt * 2);
    this.nearFx = 0;
    this.#updateCamera(dt * 0.4);
    this.updateTraffic(dt * 0.45, true);
    this.updatePickups(dt * 0.45, true);
    this.updateParticles(dt);
    this.updateRings(dt);
    this.updateFloats(dt);
    this.updateDebris(dt);
    this.#updateHud();
    if (this.deathTimer > 1.55) this.#finishRun();
  }

  #updateOver(dt) {
    this.speed = Math.max(0, this.speed - 18 * dt);
    this.distance += this.speed * dt;
    this.shake *= Math.exp(-dt * 6);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
    this.#updateCamera(dt * 0.3);
    this.updateTraffic(dt * 0.5, true);
    this.updatePickups(dt * 0.5, true);
    this.updateParticles(dt);
    this.updateRings(dt);
    this.updateFloats(dt);
    this.updateDebris(dt);
  }

  #updateSteering(dt) {
    const p = this.player;
    if (this.pointer) {
      const k = 1 - Math.exp(-dt * 16);
      const nx = p.x + (this.pointer.targetX - p.x) * k;
      p.vx = (nx - p.x) / Math.max(dt, 0.0001);
      p.x = nx;
    } else {
      const axis = this.#axis();
      const targetV = axis * 2.55;
      const response = axis !== 0 ? 16 : 11;
      p.vx += (targetV - p.vx) * Math.min(1, dt * response);
      p.x += p.vx * dt;
    }
    if (p.x < -0.842) {
      p.x = -0.842;
      if (p.vx < 0) p.vx *= -0.22;
    }
    if (p.x > 0.842) {
      p.x = 0.842;
      if (p.vx > 0) p.vx *= -0.22;
    }
    p.tilt = clamp(p.vx * 0.075, -0.2, 0.2);
  }

  #updateCamera(dt) {
    this.camSway += ((-this.player.x * this.roadHalf * 0.105) - this.camSway) * Math.min(1, dt * 6);
    this.bgShift += ((-this.player.x * 34 - this.camSway * 0.4 + this.curve * this.w * 0.5 + this.time * 2.4) - this.bgShift) * Math.min(1, dt * 2.5);
    this.curveTimer -= dt;
    if (this.curveTimer <= 0) {
      this.curveTarget = rand(-0.075, 0.075);
      this.curveTimer = rand(6, 12);
    }
    this.curve += (this.curveTarget - this.curve) * Math.min(1, dt * 0.35);
  }

  #updateMeteor(dt) {
    const m = this.meteor;
    if (m.life > 0) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;
    } else {
      m.delay -= dt;
      if (m.delay <= 0) {
        m.life = 1.1;
        m.x = rand(this.w * 0.12, this.w * 0.88);
        m.y = rand(this.h * 0.05, this.h * 0.3);
        m.vx = rand(-320, 320) || 140;
        m.vy = rand(110, 240);
        m.delay = rand(5, 12);
      }
    }
  }

  // ----------------------------------------------------------
  // Spawning
  // ----------------------------------------------------------

  spawnTraffic(zOverride, force = false) {
    const max = this.state === 'menu' ? 5 : Math.min(13, 6 + Math.floor(this.level * 0.8));
    if (!force && this.traffic.length >= max) return;

    const z = zOverride ?? rand(148, 168);
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    let laneIndex = -1;
    for (const idx of order) {
      const x = LANES[idx];
      if (this.traffic.some((c) => Math.abs(c.z - z) < 22 && Math.abs(c.x - x) < 0.3)) continue;
      const near = this.traffic.filter((c) => Math.abs(c.z - z) < 30);
      if (near.length >= 2) {
        const occupied = [false, false, false];
        for (const c of near) {
          const li = LANES.findIndex((lx) => Math.abs(lx - c.x) < 0.34);
          if (li >= 0) occupied[li] = true;
        }
        occupied[idx] = true;
        if (occupied.every(Boolean)) continue;
      }
      laneIndex = idx;
      break;
    }
    if (laneIndex < 0) return;
    const x = LANES[laneIndex];

    const r = Math.random();
    let kind;
    let w;
    if (r < 0.44) { kind = 'coupe'; w = 0.145; }
    else if (r < 0.64) { kind = 'hover'; w = 0.15; }
    else if (r < 0.86) { kind = 'truck'; w = 0.187; }
    else { kind = 'bike'; w = 0.068; }

    const truckSlow = kind === 'truck' ? 6 : kind === 'bike' ? 3 : 0;
    const rel = (16 + rand(0, 15) + this.level * 1.1 + truckSlow) * (0.8 + this.speed / 140);
    const color = pick(TRAFFIC_COLORS);
    const car = {
      kind,
      color,
      w,
      x,
      laneX: x,
      targetX: x,
      z,
      prevZ: z,
      rel,
      checked: false,
      hit: false,
      dead: false,
      tilt: 0,
      phase: rand(0, TAU),
      changeTimer: rand(1.6, 5),
      aggressive: Math.random() < 0.2,
      bob: rand(0, TAU),
    };
    this.traffic.push(car);
  }

  spawnPickupCluster(force = false) {
    const max = this.state === 'menu' ? 10 : 24;
    if (!force && this.pickups.length >= max) return;

    const zBase = rand(138, 166);
    const lane = pick(LANES);
    const orbChance = this.nitro < 32 ? 0.46 : 0.29;
    const roll = Math.random();
    let kind = 'coin';
    if (roll < orbChance) kind = 'orb';
    else if (roll > 0.955) kind = 'surge';
    const count = kind === 'coin' ? 3 + Math.floor(rand(0, 3)) : 1;
    const phase = rand(0, TAU);

    const items = [];
    for (let i = 0; i < count; i++) {
      const z = zBase + i * 5.4;
      const x = kind === 'coin' ? clamp(lane + Math.sin(i * 1.05 + phase) * 0.1, -0.78, 0.78) : lane;
      const blocked = this.traffic.some((c) => Math.abs(c.z - z) < 10 && Math.abs(c.x - x) < 0.36);
      if (blocked) return;
      if (z > VIEW_DIST + 14) break;
      items.push({ kind, x, z, phase: rand(0, TAU), dead: false });
    }

    for (const item of items) {
      this.pickups.push({
        ...item,
        prevZ: item.z,
        bob: rand(0, TAU),
      });
    }
  }

  // ----------------------------------------------------------
  // Traffic, pickups & collision
  // ----------------------------------------------------------

  updateTraffic(dt, demo) {
    for (const car of this.traffic) {
      if (car.dead) continue;
      car.prevZ = car.z;
      const pace = demo ? 1 : clamp(0.75 + this.speed / 120, 0.85, 1.5);
      car.z -= car.rel * dt * pace;

      car.changeTimer -= dt;
      if (car.changeTimer <= 0) {
        if (Math.random() < (car.aggressive ? 0.76 : 0.44)) {
          const idx = LANES.findIndex((v) => Math.abs(v - car.laneX) < 0.02);
          const dir = Math.random() < 0.5 ? -1 : 1;
          const ni = clamp(idx + dir, 0, 2);
          if (ni !== idx) {
            const nx = LANES[ni];
            const blocked = this.traffic.some((o) => o !== car && !o.dead &&
              Math.abs(o.z - car.z) < 20 && Math.abs(o.x - nx) < 0.3);
            if (!blocked) {
              car.laneX = nx;
              car.targetX = nx;
            }
          }
        }
        car.changeTimer = (car.aggressive ? 1.4 : 2.4) + Math.random() * 3.2;
      }

      if (car.kind === 'bike') {
        car.x = car.laneX + Math.sin(this.time * 2.8 + car.phase) * 0.07;
      } else {
        car.x += (car.laneX - car.x) * Math.min(1, dt * 2.2);
      }
      car.tilt = clamp((car.laneX - car.x) * 1.6, -0.5, 0.5);

      if (!demo && this.state === 'playing' && this.grace <= 0 && !car.hit && !car.dead) {
        if (Math.abs(car.z - PLAYER_Z) < 3.4 &&
          Math.abs(car.x - this.player.x) < this.player.w + car.w) {
          this.#hitTraffic(car);
          continue;
        }
      }

      if (!car.checked) {
        const crossed = car.prevZ > PLAYER_Z && car.z <= PLAYER_Z;
        if (crossed) {
          car.checked = true;
          if (!demo && !car.hit && !car.dead && this.state === 'playing') this.#onPass(car);
        } else if (car.z < PLAYER_Z - 9) {
          car.checked = true;
        }
      }
    }
    this.traffic = this.traffic.filter((c) => !c.dead && c.z > -26);
  }

  #onPass(car) {
    if (this.invuln > 0 || this.state !== 'playing') return;
    const gap = Math.abs(this.player.x - car.x) - this.player.w - car.w;
    if (gap < 0) {
      this.#hitTraffic(car);
      return;
    }
    if (gap < 0.19) this.#nearMiss(car, gap);
  }

  #nearMiss(car, gap) {
    const razor = gap < 0.052;
    const base = razor ? 380 : 220;
    const gain = Math.round(base * this.combo);
    this.score += gain;
    this.nearMisses++;
    this.#addCombo(razor ? 0.38 : 0.25);
    this.nitro = Math.min(100, this.nitro + (razor ? 10 : 6));
    this.nearFx = 1;
    this.shake = Math.max(this.shake, razor ? 5 : 3);

    const p = this.project(car.z, car.x);
    this.addFloat(
      `${razor ? 'RAZOR PASS' : 'NEAR MISS'} +${gain}`,
      p.x,
      p.y - 34,
      razor ? '#ff8ae8' : '#ffd36b',
      razor ? 19 : 16,
    );
    this.spawnBurst(p.x, p.y - 10, {
      count: razor ? 18 : 11,
      colors: razor ? ['magenta', 'white', 'cyan'] : ['amber', 'white', 'cyan'],
      speed: 210,
      size: 13,
      life: 0.45,
      gravity: -20,
      drag: 3,
    });
    this.audio.nearMiss();
  }

  #hitTraffic(car) {
    if (this.state !== 'playing' || this.invuln > 0 || this.grace > 0) return;
    car.dead = true;
    car.hit = true;

    const p = this.project(car.z, car.x);
    this.hull = Math.max(0, this.hull - 34);
    this.collisions++;
    this.invuln = 1.9;
    this.shake = Math.max(this.shake, 23);
    this.hitFlash = 1;
    this.combo = 1;
    this.comboTimer = 0;
    this.speed = Math.max(20, this.speed * 0.66);
    this.boostCooldown = Math.max(this.boostCooldown, 1.25);
    this.nitro = Math.min(100, this.nitro + 9);
    this.player.vx += Math.sign(this.player.x - car.x || 1) * 0.9;
    this.addFloat('HULL -34', p.x, p.y - 50, '#ff3d6e', 18);
    this.spawnBurst(p.x, p.y - 20, {
      count: 40,
      colors: ['red', 'orange', 'amber', 'white'],
      speed: 340,
      size: 18,
      life: 0.75,
      gravity: 220,
      drag: 1.6,
    });
    this.spawnDebris(p.x, p.y - 10, 9);
    this.addRing(p.x, p.y, 12, 150, 0.6, 'orange', 0.65);
    this.audio.crash();
    this.#updateHud(true);

    if (this.hull <= 0) {
      this.#beginDeath();
    } else {
      this.showCallout(`HULL ${Math.round(this.hull)}% // IMPACT`, true);
    }
  }

  #beginDeath() {
    if (this.state !== 'playing') return;
    this.#setState('dying');
    this.player.dead = true;
    this.deathTimer = 0;
    this.speed = Math.min(this.speed, 48);
    this.boosting = false;
    this.boostVisual = 1;
    this.shake = 36;
    this.hitFlash = 1;
    this.pointer = null;
    this.input.touchSteer = 0;
    this.input.touchNitro = false;

    const p = this.project(PLAYER_Z, this.player.x);
    this.spawnBurst(p.x, p.y, {
      count: 110,
      colors: ['white', 'cyan', 'magenta', 'amber', 'orange'],
      speed: 620,
      size: 28,
      life: 1.25,
      gravity: 280,
      drag: 1.2,
    });
    this.spawnDebris(p.x, p.y, 20);
    this.addRing(p.x, p.y, 10, Math.max(this.w, this.h) * 0.72, 1.25, 'cyan', 0.85);
    this.addRing(p.x, p.y, 4, Math.max(this.w, this.h) * 0.48, 1.0, 'magenta', 0.7);

    this.audio.stopEngine();
    this.audio.stopMusic();
    this.audio.setNitro(false);
    this.audio.explode();
    this.audio.gameOver();
  }

  #finishRun() {
    if (this.state !== 'dying') return;
    const finalScore = Math.floor(this.score);
    const record = finalScore > this.best && finalScore > 0;
    if (record) this.#saveBest(finalScore);
    this.bestChain = Math.max(this.bestChain, this.combo);
    this.topSpeed = Math.max(this.topSpeed, this.speed);

    this.#setState('over');
    this.#updateBestDisplays();
    if (this.ui.finalScore) this.ui.finalScore.textContent = pad7(finalScore);
    if (this.ui.finalDistance) this.ui.finalDistance.textContent = `${comma(this.distance)} M`;
    if (this.ui.finalSpeed) this.ui.finalSpeed.textContent = `${Math.round(this.topSpeed * 3.6)} KM/H`;
    if (this.ui.finalNearMiss) this.ui.finalNearMiss.textContent = String(this.nearMisses);
    if (this.ui.finalCombo) this.ui.finalCombo.textContent = `x${this.bestChain.toFixed(1)}`;
    if (this.ui.newRecord) this.ui.newRecord.hidden = !record;
    if (this.ui.runCode) this.ui.runCode.textContent = `RUN ID // ${this.runId}`;
    this.#showScreen('screen-over');

    if (record) {
      window.setTimeout(() => {
        if (this.state === 'over') this.audio.highScore();
      }, 600);
    }
  }

  updatePickups(dt, demo) {
    for (const item of this.pickups) {
      if (item.dead) continue;
      item.prevZ = item.z;
      item.z -= this.speed * dt;

      if (!demo && this.state === 'playing' &&
        item.z <= PLAYER_Z + 1.2 && item.z > -6 &&
        Math.abs(item.x - this.player.x) < this.player.w + 0.14) {
        this.#collect(item);
        item.dead = true;
      }
    }
    this.pickups = this.pickups.filter((p) => !p.dead && p.z > -10 && p.z < VIEW_DIST + 24);
  }

  #collect(item) {
    const p = this.project(item.z, item.x);
    let base = 55;
    let nitro = 3;
    let combo = 0.07;
    let color = 'amber';
    let textColor = '#ffd36b';

    if (item.kind === 'orb') {
      base = 110;
      nitro = 27;
      combo = 0.15;
      color = 'cyan';
      textColor = '#8afaff';
      this.audio.orb();
    } else if (item.kind === 'surge') {
      base = 320;
      nitro = 100;
      combo = 0.32;
      color = 'magenta';
      textColor = '#ff8ae8';
      this.hull = clamp(this.hull + 10, 0, 100);
      this.addRing(p.x, p.y, 10, 130, 0.55, 'magenta', 0.7);
      this.showCallout('SURGE CELL // HULL REPAIRED');
      this.audio.surge();
    } else {
      this.audio.coin(Math.ceil(this.combo));
    }

    const gain = Math.round(base * this.combo);
    this.score += gain;
    this.nitro = clamp(this.nitro + nitro, 0, 100);
    this.#addCombo(combo);
    this.addFloat(`+${gain}`, p.x, p.y - 26, textColor, item.kind === 'surge' ? 22 : 16);
    this.spawnBurst(p.x, p.y - 12, {
      count: item.kind === 'coin' ? 10 : 20,
      colors: item.kind === 'coin'
        ? ['amber', 'white']
        : item.kind === 'orb' ? ['cyan', 'white', 'violet'] : ['magenta', 'white', 'amber'],
      speed: 180,
      size: item.kind === 'surge' ? 18 : 13,
      life: 0.55,
      gravity: -60,
      drag: 2.8,
    });
    this.#updateHud(true);
  }

  #addCombo(amount) {
    this.combo = Math.min(9.9, this.combo + amount);
    this.comboTimer = 4.6;
    this.bestChain = Math.max(this.bestChain, this.combo);
  }

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  addParticle(opts) {
    let slot = null;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const candidate = this.particles[(this.particleCursor + i) % MAX_PARTICLES];
      if (candidate.life <= 0) {
        slot = candidate;
        this.particleCursor = (this.particleCursor + i + 1) % MAX_PARTICLES;
        break;
      }
    }
    if (!slot) {
      slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
    }
    slot.life = opts.life ?? 0.6;
    slot.max = slot.life;
    slot.x = opts.x;
    slot.y = opts.y;
    slot.px = opts.x;
    slot.py = opts.y;
    slot.vx = opts.vx ?? 0;
    slot.vy = opts.vy ?? 0;
    slot.size = opts.size ?? 12;
    slot.color = opts.color ?? 'cyan';
    slot.smoke = Boolean(opts.smoke);
    slot.drag = opts.drag ?? 1.2;
    slot.gravity = opts.gravity ?? 0;
    slot.angle = opts.angle ?? 0;
    slot.spin = opts.spin ?? 0;
    return slot;
  }

  spawnBurst(x, y, {
    count = 12,
    colors = ['cyan'],
    speed = 180,
    spread = TAU,
    angle = 0,
    size = 14,
    life = 0.6,
    gravity = 120,
    drag = 2.2,
    smoke = false,
  } = {}) {
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = speed * rand(0.25, 1);
      this.addParticle({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: size * rand(0.5, 1.25),
        life: life * rand(0.65, 1.15),
        color: pick(colors),
        gravity,
        drag,
        smoke,
      });
    }
  }

  spawnDebris(x, y, count) {
    for (let i = 0; i < count; i++) {
      const d = this.debris[this.debrisCursor];
      this.debrisCursor = (this.debrisCursor + 1) % this.debris.length;
      d.life = rand(0.55, 1.2);
      d.max = d.life;
      d.x = x + rand(-16, 16);
      d.y = y + rand(-20, 14);
      d.vx = rand(-280, 280);
      d.vy = rand(-420, -80);
      d.rot = rand(0, TAU);
      d.vr = rand(-9, 9);
      d.size = rand(8, 20);
      d.sprite = (Math.random() * this.sprites.debris.length) | 0;
    }
  }

  addRing(x, y, startR, maxR, dur, color, ratio = 1) {
    this.rings.push({ x, y, r: startR, start: startR, maxR, dur, life: dur, color, ratio });
    if (this.rings.length > 24) this.rings.shift();
  }

  addFloat(text, x, y, color = '#eaffff', size = 16) {
    this.floats.push({ text, x, y, vy: -46, life: 1.15, max: 1.15, color, size });
    if (this.floats.length > 24) this.floats.shift();
  }

  spawnExhaust(boosting, menu) {
    const p = this.project(PLAYER_Z, this.player.x);
    const s = p.s;
    const carW = 2 * this.player.w * this.roadHalf * s * 1.06;
    const carH = carW * (this.sprites.player.h / this.sprites.player.w);
    const rearY = p.y + carH * 0.4;
    const count = boosting ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const x = p.x + rand(-0.2, 0.2) * carW;
      const y = rearY + rand(-2, 8) * s;
      const hot = boosting || Math.random() > 0.7;
      this.addParticle({
        x,
        y,
        vx: rand(-45, 45) - this.player.vx * 24 + (boosting ? rand(-70, 70) : 0),
        vy: rand(90, 210) * (boosting ? 2.1 : 1) + (menu ? 30 : 0),
        size: carW * rand(0.1, 0.18) * (boosting ? 1.6 : 1),
        life: rand(0.18, 0.4) * (boosting ? 1.5 : 1),
        color: hot ? 'cyan' : 'violet',
        gravity: -70,
        drag: 2.4,
      });
      if (boosting && Math.random() > 0.45) {
        this.addParticle({
          x,
          y,
          vx: rand(-140, 140),
          vy: rand(220, 480),
          size: carW * rand(0.04, 0.08),
          life: rand(0.2, 0.45),
          color: Math.random() > 0.5 ? 'magenta' : 'white',
          gravity: 60,
          drag: 1.2,
        });
      }
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const damping = Math.exp(-p.drag * dt);
      p.vx *= damping;
      p.vy = p.vy * damping + p.gravity * dt;
      p.angle += p.spin * dt;
      p.life -= dt;
    }
  }

  updateDebris(dt) {
    for (const d of this.debris) {
      if (d.life <= 0) continue;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 950 * dt;
      d.vx *= Math.exp(-0.5 * dt);
      d.rot += d.vr * dt;
      d.life -= dt;
    }
  }

  updateRings(dt) {
    for (const ring of this.rings) {
      const progress = 1 - ring.life / ring.dur;
      ring.r = lerp(ring.start, ring.maxR, 1 - Math.pow(1 - progress, 2));
      ring.life -= dt;
    }
    this.rings = this.rings.filter((r) => r.life > 0);
  }

  updateFloats(dt) {
    for (const f of this.floats) {
      f.y += f.vy * dt;
      f.vy *= Math.exp(-2.2 * dt);
      f.life -= dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  // ----------------------------------------------------------
  // Projection & HUD
  // ----------------------------------------------------------

  roadCenter(z) {
    const s = 1 / (1 + Math.max(0, z) * 0.043);
    return this.w / 2 + this.camSway + this.curve * this.w * Math.pow(1 - s, 1.6);
  }

  project(z, x = 0) {
    const zz = Math.max(0, z);
    const s = 1 / (1 + zz * 0.043);
    const cx = this.roadCenter(z);
    return {
      x: cx + x * this.roadHalf * s,
      y: this.horizonY + (this.roadBottomY - this.horizonY) * s,
      s,
      cx,
    };
  }

  #updateHud(force = false) {
    const ui = this.ui;
    const scoreText = pad7(this.score);
    if (force || ui.score.textContent !== scoreText) ui.score.textContent = scoreText;

    const kmh = Math.round(this.speed * 3.6);
    const speedText = String(kmh).padStart(3, '0');
    if (force || ui.speed.textContent !== speedText) ui.speed.textContent = speedText;

    const distText = comma(this.distance);
    if (force || ui.distance.textContent !== distText) ui.distance.textContent = distText;

    const activeHull = Math.ceil(this.hull / 33.34);
    Array.from(ui.hullBars.children).forEach((bar, i) => {
      bar.classList.toggle('down', i >= activeHull);
    });
    ui.hullBlock.classList.toggle('damaged', this.hull < 40);
    const hullStatus = this.hull >= 100 ? 'NOMINAL' : this.hull >= 67 ? 'STABLE' : this.hull >= 34 ? 'DAMAGED' : this.hull > 0 ? 'CRITICAL' : 'OFFLINE';
    const hullText = `${Math.round(this.hull)}% // ${hullStatus}`;
    if (ui.hullText.textContent !== hullText) ui.hullText.textContent = hullText;

    const nitroRatio = clamp(this.nitro / 100, 0, 1);
    ui.nitroFill.style.transform = `scaleX(${nitroRatio.toFixed(3)})`;
    const nitroText = `${Math.round(this.nitro)}%`;
    if (ui.nitroPct.textContent !== nitroText) ui.nitroPct.textContent = nitroText;
    ui.nitroBar.classList.toggle('burning', this.boosting);
    ui.nitroBlock.classList.toggle('burning', this.boosting);
    const hint = this.isTouch
      ? (this.boosting ? 'NITRO ENGAGED' : 'STEER · TAP NITRO')
      : this.boosting ? 'NITRO ENGAGED' : 'SHIFT / SPACE TO BURN';
    if (ui.nitroHint.textContent !== hint) ui.nitroHint.textContent = hint;

    const comboActive = this.combo > 1.02;
    ui.combo.classList.toggle('active', comboActive);
    if (comboActive) {
      const comboText = `x${this.combo.toFixed(1)}`;
      if (ui.comboX.textContent !== comboText) ui.comboX.textContent = comboText;
      ui.comboBar.style.transform = `scaleX(${clamp(this.comboTimer / 4.6, 0, 1).toFixed(3)})`;
    }

    const sector = pad2(this.level);
    if (ui.sector.textContent !== sector) ui.sector.textContent = sector;
  }

  #updateFxDom() {
    if (this.ui.nitroFx) {
      const target = (this.state === 'playing' || this.state === 'dying') ? this.boostVisual * 0.9 : 0;
      if (Math.abs(target - (this._nitroFx ?? -1)) > 0.012) {
        this.ui.nitroFx.style.opacity = target.toFixed(2);
        this._nitroFx = target;
      }
    }
    if (this.ui.hitFx) {
      const target = this.hitFlash * 0.95;
      if (Math.abs(target - (this._hitFx ?? -1)) > 0.012) {
        this.ui.hitFx.style.opacity = target.toFixed(2);
        this._hitFx = target;
      }
    }
  }

  // ----------------------------------------------------------
  // Background & road rendering
  // ----------------------------------------------------------

  drawBackground(ctx) {
    const sun = this.sun;

    if (this.bgSky) {
      ctx.drawImage(this.bgSky, 0, 0);
    } else {
      ctx.fillStyle = this.skyGrad;
      ctx.fillRect(-40, -40, this.w + 80, this.horizonY + 80);
    }

    // stars (baked sky already contains the sun, so skip stars behind it)
    const t = this.time;
    const sunR2 = (sun.r * 1.08) ** 2;
    for (const star of this.stars) {
      if ((star.x - sun.x) ** 2 + (star.y - sun.y) ** 2 < sunR2) continue;
      const twinkle = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = GLOW_COLORS[star.tint] || '#cfefff';
      if (star.r > 1.25) {
        ctx.fillRect(star.x, star.y, star.r * 1.7, 1);
        ctx.fillRect(star.x, star.y, 1, star.r * 1.7);
      } else {
        ctx.fillRect(star.x, star.y, star.r, star.r);
      }
    }
    ctx.globalAlpha = 1;

    // meteor
    const m = this.meteor;
    if (m.life > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.16, m.y - m.vy * 0.16);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.25, 'rgba(49,242,255,0.55)');
      grad.addColorStop(1, 'rgba(49,242,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 0.16, m.y - m.vy * 0.16);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // parallax city layers
    this.#drawSkylineLayer(ctx, this.skyFar, this.horizonY + 28, 0.9);
    this.#drawSkylineLayer(ctx, this.skyNear, this.horizonY + 38, 1);

    if (this.bgGround) {
      ctx.drawImage(this.bgGround, 0, 0);
    } else {
      ctx.fillStyle = this.groundGrad;
      ctx.fillRect(-40, this.horizonY, this.w + 80, this.h - this.horizonY + 40);
      ctx.fillStyle = this.hazeGrad;
      ctx.fillRect(-40, this.horizonY - 70, this.w + 80, 160);
    }
  }

  #drawSkylineLayer(ctx, layer, baseY, alpha) {
    const offset = ((this.bgShift % layer.w) + layer.w) % layer.w;
    ctx.globalAlpha = alpha;
    for (let x = -offset; x < this.w; x += layer.w) {
      ctx.drawImage(layer.canvas, x, baseY - layer.h, layer.w, layer.h);
    }
    ctx.globalAlpha = 1;
  }

  drawGroundGrid(ctx) {
    const off = this.distance % 9;
    ctx.save();
    ctx.lineWidth = 1;
    // Batch the grid into three depth bands so each band is a single stroke
    // call instead of one per line.
    const bands = [
      { max: 55, alpha: 0.07 },
      { max: 110, alpha: 0.05 },
      { max: VIEW_DIST, alpha: 0.035 },
    ];
    for (const band of bands) {
      ctx.strokeStyle = `rgba(128, 88, 230, ${band.alpha})`;
      ctx.beginPath();
      for (let z = off; z < band.max; z += 9) {
        const p = this.project(z, 0);
        if (p.y < this.horizonY || p.y > this.h + 4) continue;
        ctx.moveTo(-30, p.y);
        ctx.lineTo(this.w + 30, p.y);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(102, 66, 190, 0.055)';
    ctx.beginPath();
    for (const gx of [-5.4, -4.2, -3.2, -2.4, 2.4, 3.2, 4.2, 5.4]) {
      for (let i = 0; i <= 10; i++) {
        const z = (i / 10) * VIEW_DIST;
        const p = this.project(z, gx);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawRoad(ctx) {
    const N = 58;
    const left = [];
    const right = [];
    for (let i = 0; i <= N; i++) {
      const z = (i / N) * VIEW_DIST;
      left.push(this.project(z, -1));
      right.push(this.project(z, 1));
    }

    // road surface
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fillStyle = this.roadGrad;
    ctx.fill();

    // inner sheen
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const z = (i / N) * VIEW_DIST;
      const p = this.project(z, -0.52);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    for (let i = N; i >= 0; i--) {
      const z = (i / N) * VIEW_DIST;
      const p = this.project(z, 0.52);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(80, 200, 255, 0.022)';
    ctx.fill();

    // fine grid rungs (single batched stroke)
    const off = this.distance % 12;
    ctx.strokeStyle = 'rgba(154, 116, 255, 0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let z = off; z < VIEW_DIST; z += 12) {
      const a = this.project(z, -1);
      const b = this.project(z, 1);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    this.#drawLaneDashes(ctx);
    this.#drawRoadEdge(ctx, -1, '#31f2ff');
    this.#drawRoadEdge(ctx, 1, '#ff2bcc');

    // reflected edge pulses
    const pulseOff = this.distance % 34;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const side of [-1, 1]) {
      for (let z = pulseOff; z < VIEW_DIST; z += 34) {
        if (z < 4) continue;
        const p = this.project(z, side * 0.985);
        const s = p.s;
        const size = Math.max(3, 26 * s);
        const color = side < 0 ? 'cyan' : 'magenta';
        ctx.globalAlpha = 0.5 * Math.min(1, s * 1.4);
        ctx.drawImage(this.glows[color], p.x - size / 2, p.y - size / 2, size, size);
      }
    }
    ctx.restore();
  }

  #drawLaneDashes(ctx) {
    const dashLen = 4.8;
    const period = 10.1;
    const start = Math.ceil(this.distance / period) * period;
    const pxs = Math.max(0.55, this.roadHalf / 418);
    const bands = [
      { lo: 1, hi: 45, alpha: 0.62, glow: 0.12, width: 5.2 },
      { lo: 45, hi: 95, alpha: 0.44, glow: 0.09, width: 4.4 },
      { lo: 95, hi: VIEW_DIST - 2, alpha: 0.3, glow: 0.06, width: 3.8 },
    ];

    ctx.save();
    ctx.lineCap = 'round';
    for (const band of bands) {
      const sMid = this.project((band.lo + band.hi) * 0.5, 0).s;
      const core = Math.max(0.8, band.width * sMid * pxs);
      for (let pass = 0; pass < 2; pass++) {
        const glow = pass === 0;
        ctx.strokeStyle = glow
          ? `rgba(49,242,255,${band.glow})`
          : `rgba(216,252,255,${band.alpha})`;
        ctx.lineWidth = glow ? core * 3.4 : core;
        ctx.beginPath();
        for (let world = start; world < this.distance + VIEW_DIST; world += period) {
          const z1 = world - this.distance;
          const z2 = Math.min(VIEW_DIST - 1, z1 + dashLen);
          if (z1 < band.lo || z1 > band.hi) continue;
          for (const laneX of [-1 / 3, 1 / 3]) {
            const a = this.project(z1, laneX);
            const b = this.project(z2, laneX);
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  #drawRoadEdge(ctx, side, color) {
    const N = 45;
    const pxs = Math.max(0.6, this.roadHalf / 418);
    const passes = [
      { mult: 5.2, alpha: 0.085 },
      { mult: 1.7, alpha: 0.85 },
      { mult: 0.55, alpha: 0.95 },
    ];
    const bands = [
      [0, 45],
      [45, 95],
      [95, VIEW_DIST],
    ];
    ctx.lineCap = 'round';
    for (const pass of passes) {
      ctx.strokeStyle = rgba(color, pass.alpha);
      for (const [lo, hi] of bands) {
        const sMid = this.project((lo + hi) * 0.5, side * 0.995).s;
        ctx.lineWidth = Math.max(0.8, pass.mult * sMid * pxs);
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const z1 = (i / N) * VIEW_DIST;
          if (z1 < lo || z1 >= hi) continue;
          const z2 = Math.min(hi, ((i + 1) / N) * VIEW_DIST);
          const a = this.project(z1, side * 0.995);
          const b = this.project(z2, side * 0.995);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
  }

  drawSpeedLines(ctx) {
    const speedFactor = clamp((this.speed - 48) / 65, 0, 1);
    const intensity = speedFactor * 0.3 + this.boostVisual * 0.9;
    if (intensity < 0.03) return;

    const cx = this.w / 2 + this.camSway * 0.5;
    const cy = this.horizonY + this.h * 0.015;
    const seedBase = Math.floor(this.time * 26) * 0.71;
    const count = 20 + Math.floor(this.boostVisual * 18);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const seed = Math.abs(Math.sin(i * 78.233 + seedBase) * 43758.5453) % 1;
      const angle = 0.1 * Math.PI + seed * 0.8 * Math.PI;
      const dist = (0.22 + seed * 0.7) * Math.min(this.w, this.h);
      const len = (60 + this.boostVisual * 260 + seed * 130) * (0.7 + speedFactor * 0.5);
      const x0 = cx + Math.cos(angle) * dist;
      const y0 = cy + Math.sin(angle) * dist * 0.62;
      const x1 = cx + Math.cos(angle) * (dist + len);
      const y1 = cy + Math.sin(angle) * (dist + len) * 0.62;
      ctx.strokeStyle = i % 3 === 0
        ? `rgba(255, 110, 230, ${(intensity * 0.3).toFixed(3)})`
        : `rgba(150, 250, 255, ${(intensity * 0.22).toFixed(3)})`;
      ctx.lineWidth = 0.7 + seed * 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    if (this.boostVisual > 0.05) {
      ctx.strokeStyle = `rgba(49,242,255,${(this.boostVisual * 0.2).toFixed(3)})`;
      for (let i = 0; i < 9; i++) {
        const y = this.h * (0.5 + i * 0.055);
        const len = (50 + (i % 3) * 70) * this.boostVisual;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(len, y);
        ctx.moveTo(this.w, y + 26);
        ctx.lineTo(this.w - len, y + 26);
        ctx.stroke();
      }
    }

    if (this.nearFx > 0.02) {
      const a = this.nearFx * 0.5;
      ctx.strokeStyle = `rgba(255,196,92,${a.toFixed(3)})`;
      for (let i = 0; i < 4; i++) {
        const y = this.h * (0.42 + i * 0.09);
        const len = 90 + i * 40;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(len, y - 8);
        ctx.moveTo(this.w, y + 14);
        ctx.lineTo(this.w - len, y + 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ----------------------------------------------------------
  // World objects
  // ----------------------------------------------------------

  drawWorld(ctx) {
    const objects = [];

    const archSpacing = 185;
    const firstArch = Math.ceil((this.distance + 16) / archSpacing) * archSpacing;
    for (let world = firstArch; world < this.distance + VIEW_DIST; world += archSpacing) {
      const z = world - this.distance;
      if (z < 11 || z > VIEW_DIST - 4) continue;
      objects.push({ z, type: 'arch', world });
    }

    const pylonSpacing = 17;
    const firstPylon = Math.ceil((this.distance + 2) / pylonSpacing) * pylonSpacing;
    for (let world = firstPylon; world < this.distance + VIEW_DIST; world += pylonSpacing) {
      const z = world - this.distance;
      if (z < 2.5 || z > VIEW_DIST - 2) continue;
      objects.push({ z, type: 'pylon', world, side: -1 });
      objects.push({ z, type: 'pylon', world, side: 1 });
    }

    const billboardSpacing = 270;
    const firstBoard = Math.ceil((this.distance + 24) / billboardSpacing) * billboardSpacing;
    for (let world = firstBoard; world < this.distance + VIEW_DIST; world += billboardSpacing) {
      const z = world - this.distance;
      if (z < 26 || z > VIEW_DIST - 8) continue;
      objects.push({ z, type: 'billboard', world, side: Math.round(world / billboardSpacing) % 2 === 0 ? -1 : 1 });
    }

    for (const item of this.pickups) {
      if (item.dead || item.z < PLAYER_Z - 3 || item.z > VIEW_DIST + 2) continue;
      objects.push({ z: item.z, type: 'pickup', item });
    }

    for (const car of this.traffic) {
      if (car.dead || car.z < -20 || car.z > VIEW_DIST + 2) continue;
      objects.push({ z: car.z, type: 'traffic', car });
    }

    if (!this.player.dead && (this.state === 'playing' || this.state === 'menu' || this.state === 'paused')) {
      objects.push({ z: PLAYER_Z, type: 'player' });
    }

    objects.sort((a, b) => b.z - a.z);

    for (const obj of objects) {
      if (obj.type === 'arch') this.#drawArch(ctx, obj.z, obj.world);
      else if (obj.type === 'pylon') this.#drawPylon(ctx, obj.z, obj.side, obj.world);
      else if (obj.type === 'billboard') this.#drawBillboard(ctx, obj.z, obj.side, obj.world);
      else if (obj.type === 'pickup') this.#drawPickup(ctx, obj.item);
      else if (obj.type === 'traffic') this.#drawTraffic(ctx, obj.car);
      else if (obj.type === 'player') this.#drawPlayer(ctx);
    }
  }

  #drawPylon(ctx, z, side, world) {
    const p = this.project(z, side * 1.3);
    const s = p.s;
    const pxs = clamp(this.roadHalf / 418, 0.62, 1.25);
    const height = this.h * 0.14 * s;
    const topY = p.y - height;
    const width = Math.max(1.1, 4.4 * s * pxs);
    const isMagenta = Math.round(world / 17) % 4 === 0;
    const color = isMagenta ? '#ff2bcc' : '#31f2ff';
    const armDir = side < 0 ? 1 : -1;
    const armLen = 34 * s * pxs;
    const armX = p.x + armDir * armLen;

    // ground light pool
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.2 * Math.min(1, s * 1.6);
    const pool = Math.max(10, 120 * s * pxs);
    ctx.drawImage(this.glows[isMagenta ? 'magenta' : 'cyan'], p.x - pool / 2, p.y - pool * 0.16, pool, pool * 0.32);
    ctx.restore();

    // post
    ctx.fillStyle = 'rgba(8, 5, 20, 0.94)';
    ctx.fillRect(p.x - width / 2, topY, width, height);
    ctx.fillStyle = rgba(color, 0.7);
    ctx.fillRect(p.x - width * 0.18, topY, Math.max(0.8, width * 0.34), height);
    ctx.fillStyle = rgba(color, 0.28);
    ctx.fillRect(p.x - width / 2, topY, width, Math.max(1, 2 * s));

    // arm
    ctx.strokeStyle = rgba(color, 0.55);
    ctx.lineWidth = Math.max(1, 2.2 * s * pxs);
    ctx.beginPath();
    ctx.moveTo(p.x, topY + height * 0.04);
    ctx.lineTo(armX, topY + height * 0.12);
    ctx.stroke();

    // lamp glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lampSize = Math.max(7, 54 * s * pxs);
    ctx.globalAlpha = Math.min(1, 0.35 + s * 0.7);
    ctx.drawImage(this.glows[isMagenta ? 'magenta' : 'cyan'], armX - lampSize / 2, topY + height * 0.12 - lampSize / 2, lampSize, lampSize);
    ctx.globalAlpha = Math.min(0.55, 0.2 + s * 0.4);
    ctx.drawImage(this.glows.white, armX - lampSize * 0.16, topY + height * 0.12 - lampSize * 0.16, lampSize * 0.32, lampSize * 0.32);
    ctx.restore();
  }

  #drawArch(ctx, z, world) {
    const p = this.project(z, 0);
    const s = p.s;
    const pxs = clamp(this.roadHalf / 418, 0.62, 1.25);
    const rx = this.roadHalf * s * 1.33;
    const ry = this.h * 0.225 * s;
    const color = Math.round(world / 185) % 2 === 0 ? '#31f2ff' : '#ff2bcc';

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // outer haze
    ctx.strokeStyle = rgba(color, 0.12);
    ctx.lineWidth = Math.max(3, 18 * s * pxs);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, Math.PI, TAU);
    ctx.stroke();

    // core arch
    ctx.strokeStyle = rgba(color, 0.82);
    ctx.lineWidth = Math.max(1.2, 2.6 * s * pxs);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, Math.PI, TAU);
    ctx.stroke();

    // secondary arc
    ctx.strokeStyle = rgba(color === '#31f2ff' ? '#ff2bcc' : '#31f2ff', 0.32);
    ctx.lineWidth = Math.max(0.8, 1.2 * s);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * 1.035, ry * 1.06, 0, Math.PI, TAU);
    ctx.stroke();

    // running lights
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i + 0.5) / 7 * Math.PI;
      const x = p.x + Math.cos(a) * rx;
      const y = p.y + Math.sin(a) * ry;
      const size = Math.max(3, 22 * s * pxs);
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.time * 3 + i);
      ctx.drawImage(this.glows[color === '#31f2ff' ? 'cyan' : 'magenta'], x - size / 2, y - size / 2, size, size);
    }

    // feet
    ctx.globalAlpha = 0.6;
    const foot = Math.max(6, 42 * s * pxs);
    ctx.drawImage(this.glows[color === '#31f2ff' ? 'cyan' : 'magenta'], p.x - rx - foot / 2, p.y - foot / 2, foot, foot);
    ctx.drawImage(this.glows[color === '#31f2ff' ? 'cyan' : 'magenta'], p.x + rx - foot / 2, p.y - foot / 2, foot, foot);
    ctx.restore();
  }

  #drawBillboard(ctx, z, side, world) {
    const p = this.project(z, side * 1.8);
    const s = p.s;
    const pxs = clamp(this.roadHalf / 418, 0.62, 1.25);
    const panelW = 165 * s * pxs;
    const panelH = panelW * 0.54;
    const topY = p.y - this.h * 0.19 * s - panelH;
    const labels = ['NEON', 'VOID', 'ZERO-G', 'SYNTH', 'HYPER', 'NX-09', 'NIGHT'];
    const label = labels[Math.floor(world / 270) % labels.length];
    const colors = ['#31f2ff', '#ff2bcc', '#9d5cff', '#b8ff4a'];
    const color = colors[Math.floor(world / 270) % colors.length];

    // support
    ctx.strokeStyle = 'rgba(86, 66, 140, 0.55)';
    ctx.lineWidth = Math.max(1, 2.4 * s * pxs);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, topY + panelH);
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowSize = panelW * 1.6;
    ctx.globalAlpha = 0.22;
    ctx.drawImage(this.glows[color === '#ff2bcc' ? 'magenta' : color === '#b8ff4a' ? 'lime' : color === '#9d5cff' ? 'violet' : 'cyan'],
      p.x - glowSize / 2, topY + panelH / 2 - glowSize / 2, glowSize, glowSize);
    ctx.restore();

    ctx.fillStyle = 'rgba(8, 4, 22, 0.88)';
    ctx.fillRect(p.x - panelW / 2, topY, panelW, panelH);
    ctx.strokeStyle = rgba(color, 0.7);
    ctx.lineWidth = Math.max(1, 1.4 * s);
    ctx.strokeRect(p.x - panelW / 2, topY, panelW, panelH);
    ctx.fillStyle = rgba(color, 0.12);
    ctx.fillRect(p.x - panelW / 2 + 3, topY + 3, panelW - 6, panelH - 6);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(6, 17 * s * pxs)}px Orbitron, Arial Black, sans-serif`;
    ctx.fillStyle = rgba(color, 0.92);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * s * pxs;
    ctx.fillText(label, p.x, topY + panelH / 2 + 1);
    ctx.restore();

    // scan glitch
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fillRect(p.x - panelW / 2 + 4, topY + panelH * 0.26, panelW - 8, 1);
    ctx.fillRect(p.x - panelW / 2 + 4, topY + panelH * 0.72, panelW - 8, 1);
  }

  #drawPickup(ctx, item) {
    const p = this.project(item.z, item.x);
    const s = p.s;
    const pxs = clamp(this.roadHalf / 418, 0.62, 1.25);
    const pulse = 1 + Math.sin(this.time * 4 + item.bob) * 0.06;
    const size = 48 * s * pxs * pulse * (item.kind === 'surge' ? 1.22 : 1);
    if (size < 1) return;
    const y = p.y - 18 * s * pxs - Math.sin(this.time * 3 + item.bob) * 6 * s * pxs;
    const colorKey = item.kind === 'coin' ? 'amber' : item.kind === 'surge' ? 'magenta' : 'cyan';

    // light beam to road
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = ctx.createLinearGradient(0, y, 0, p.y + 6);
    beam.addColorStop(0, rgba(GLOW_COLORS[colorKey], 0.18));
    beam.addColorStop(1, rgba(GLOW_COLORS[colorKey], 0));
    ctx.fillStyle = beam;
    ctx.fillRect(p.x - Math.max(0.8, size * 0.04), y, Math.max(1.6, size * 0.08), p.y - y);
    const glowSize = size * 2.7;
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(this.time * 5 + item.bob);
    ctx.drawImage(this.glows[colorKey], p.x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
    ctx.restore();

    const sprite = this.sprites.pickups[item.kind];
    ctx.save();
    ctx.translate(p.x, y);
    if (item.kind === 'coin') {
      const spin = Math.cos(this.time * 4.2 + item.bob);
      const sx = Math.sign(spin) * Math.max(0.16, Math.abs(spin));
      ctx.scale(sx, 1);
    } else {
      ctx.rotate(this.time * 0.9 + item.bob);
    }
    ctx.drawImage(sprite.canvas, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  #trafficSprite(kind, color) {
    const key = `${kind}:${color}`;
    let sprite = this.sprites.traffic.get(key);
    if (!sprite) {
      sprite = createTrafficSprite(kind, color);
      this.sprites.traffic.set(key, sprite);
    }
    return sprite;
  }

  #glowKeyFor(hex) {
    return {
      '#ff2bcc': 'magenta',
      '#ff7a2b': 'orange',
      '#b8ff4a': 'lime',
      '#9d5cff': 'violet',
      '#ff3d6e': 'red',
      '#31f2ff': 'cyan',
      '#ffc45c': 'amber',
    }[hex] || 'violet';
  }

  #drawTraffic(ctx, car) {
    const p = this.project(car.z, car.x);
    if (p.y > this.h + 260) return;
    const s = p.s;
    const pxs = clamp(this.roadHalf / 418, 0.62, 1.25);
    const sprite = this.#trafficSprite(car.kind, car.color);
    const w = Math.max(2, 2 * car.w * this.roadHalf * s * 1.14);
    const h = w * (sprite.h / sprite.w);
    const bob = car.kind === 'hover' ? Math.sin(this.time * 3.2 + car.phase) * 3.4 * s : 0;
    const x = p.x;
    const y = p.y - h * 0.45 + bob;
    const colorKey = this.#glowKeyFor(car.color);

    // shadow on the road
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.32 + s * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x, p.y + h * 0.05, w * 0.48, Math.max(1.5, w * 0.1), 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // neon underglow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 + s * 0.18;
    const gw = w * 1.7;
    ctx.drawImage(this.glows[colorKey], x - gw / 2, p.y - gw * 0.2, gw, gw * 0.44);
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-car.tilt * 0.1);
    ctx.drawImage(sprite.canvas, -w / 2, -h / 2, w, h);

    // headlights and brake light bloom
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7;
    const tailSize = w * 0.72;
    ctx.drawImage(this.glows.red, -tailSize / 2, h * 0.32 - tailSize / 2, tailSize, tailSize * 0.6);
    ctx.globalAlpha = 0.45;
    const headSize = w * 0.4;
    ctx.drawImage(this.glows.white, -headSize / 2, -h * 0.46 - headSize / 2, headSize, headSize);
    ctx.restore();
  }

  #drawPlayer(ctx) {
    const p = this.project(PLAYER_Z, this.player.x);
    const s = p.s;
    const pxs = clamp(this.roadHalf / 418, 0.62, 1.2);
    const sprite = this.sprites.player;
    const w = 2 * this.player.w * this.roadHalf * s * 1.06;
    const h = w * (sprite.h / sprite.w);
    const x = p.x;
    const y = p.y - h * 0.03;
    const hurting = this.invuln > 0;

    // underglow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.52;
    const gw = w * 2.35;
    ctx.drawImage(this.glows.cyan, x - gw / 2, p.y + h * 0.2 - gw * 0.2, gw, gw * 0.42);
    ctx.globalAlpha = 0.42;
    const mw = w * 1.35;
    ctx.drawImage(this.glows.magenta, x - mw / 2, p.y + h * 0.44 - mw * 0.12, mw, mw * 0.24);
    ctx.restore();

    // headlight cones
    const frontY = p.y - h * 0.44;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beamGrad = ctx.createLinearGradient(0, frontY, 0, frontY - this.h * 0.42);
    beamGrad.addColorStop(0, 'rgba(206,255,255,0.13)');
    beamGrad.addColorStop(0.55, 'rgba(49,242,255,0.045)');
    beamGrad.addColorStop(1, 'rgba(49,242,255,0)');
    ctx.fillStyle = beamGrad;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + dir * w * 0.16, frontY);
      ctx.lineTo(x + dir * w * 0.13, frontY);
      ctx.lineTo(x + dir * w * 0.72, frontY - this.h * 0.4);
      ctx.lineTo(x + dir * w * 0.38, frontY - this.h * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // thruster flames
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rearY = p.y + h * 0.42;
    const boost = this.boostVisual;
    const flick = 0.82 + Math.random() * 0.32;
    const flameLen = h * (0.08 + boost * 0.52) * flick;
    for (const dir of [-1, 1]) {
      const fx = x + dir * w * 0.2;
      const fw = w * (0.1 + boost * 0.075);
      const fg = ctx.createLinearGradient(0, rearY, 0, rearY + flameLen);
      fg.addColorStop(0, 'rgba(255,255,255,0.95)');
      fg.addColorStop(0.22, 'rgba(147,252,255,0.85)');
      fg.addColorStop(0.58, 'rgba(49,242,255,0.35)');
      fg.addColorStop(1, 'rgba(255,43,204,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(fx - fw / 2, rearY);
      ctx.quadraticCurveTo(fx - fw * 0.8, rearY + flameLen * 0.5, fx, rearY + flameLen);
      ctx.quadraticCurveTo(fx + fw * 0.8, rearY + flameLen * 0.5, fx + fw / 2, rearY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // invulnerability shield
    if (hurting && !this.player.dead) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.3 + 0.2 * Math.sin(this.time * 14);
      ctx.strokeStyle = `rgba(49,242,255,${pulse.toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, p.y, w * 0.68, h * 0.56, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,43,204,${(pulse * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, p.y, w * 0.74, h * 0.6, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.player.tilt * 0.5);
    if (hurting && Math.floor(this.time * 18) % 2 === 0) ctx.globalAlpha = 0.42;
    ctx.drawImage(sprite.canvas, -w / 2, -h / 2, w, h);
    ctx.restore();

    // tail light bloom
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.72;
    const tail = w * 0.8;
    ctx.drawImage(this.glows.magenta, x - tail / 2, p.y + h * 0.35, tail, tail * 0.4);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(255,90,220,0.9)';
    ctx.fillRect(x - w * 0.2, p.y + h * 0.41, w * 0.12, Math.max(1, 2 * s));
    ctx.fillRect(x + w * 0.08, p.y + h * 0.41, w * 0.12, Math.max(1, 2 * s));
    ctx.restore();

    // nitro wake rings
    if (boost > 0.08) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(49,242,255,${(boost * 0.24).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const rr = w * (0.7 + i * 0.34) + Math.sin(this.time * 9 + i) * 4;
        ctx.beginPath();
        ctx.ellipse(x, p.y + h * (0.12 + i * 0.06), rr, rr * 0.32, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ----------------------------------------------------------
  // Effects rendering
  // ----------------------------------------------------------

  drawParticles(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      const t = clamp(p.life / p.max, 0, 1);
      const size = Math.max(1, p.size * (0.55 + t * 0.7));
      ctx.globalAlpha = Math.min(1, t * 1.5);
      ctx.drawImage(this.glows[p.color] || this.glows.cyan, p.x - size / 2, p.y - size / 2, size, size);
      if (p.smoke) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = t * 0.1;
        ctx.fillStyle = '#8a6ab0';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.7, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
      } else if (Math.abs(p.vx) + Math.abs(p.vy) > 40) {
        ctx.globalAlpha = t * 0.28;
        ctx.strokeStyle = GLOW_COLORS[p.color] || GLOW_COLORS.cyan;
        ctx.lineWidth = Math.max(0.6, size * 0.12);
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawRings(ctx) {
    if (!this.rings.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const ring of this.rings) {
      const t = clamp(ring.life / ring.dur, 0, 1);
      ctx.globalAlpha = t * 0.85;
      ctx.strokeStyle = GLOW_COLORS[ring.color] || ring.color;
      ctx.lineWidth = Math.max(0.6, 5 * t);
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, Math.max(1, ring.r), Math.max(0.5, ring.r * ring.ratio), 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = t * 0.2;
      ctx.lineWidth = Math.max(0.6, 12 * t);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDebris(ctx) {
    for (const d of this.debris) {
      if (d.life <= 0) continue;
      const t = clamp(d.life / d.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 1.8);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      const sprite = this.sprites.debris[d.sprite];
      ctx.drawImage(sprite.canvas, -d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }
  }

  drawFloats(ctx) {
    if (!this.floats.length) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floats) {
      const t = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = Math.min(1, t * 2.2);
      ctx.font = `700 ${Math.max(9, f.size * (0.85 + t * 0.2))}px Orbitron, Arial Black, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(3,1,10,0.6)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 14;
      ctx.fillText(f.text, f.x, f.y);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // ----------------------------------------------------------
  // Frame composition
  // ----------------------------------------------------------

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#04010c';
    ctx.fillRect(0, 0, this.w, this.h);

    let sx = 0;
    let sy = 0;
    if (this.shake > 0.1) {
      sx = (Math.random() * 2 - 1) * this.shake;
      sy = (Math.random() * 2 - 1) * this.shake * 0.7;
    }

    ctx.save();
    ctx.translate(sx, sy);
    this.drawBackground(ctx);
    this.drawGroundGrid(ctx);
    this.drawRoad(ctx);
    this.drawWorld(ctx);
    this.drawSpeedLines(ctx);
    this.drawParticles(ctx);
    this.drawRings(ctx);
    this.drawDebris(ctx);
    this.drawFloats(ctx);
    ctx.restore();

    if (this.state === 'paused') {
      ctx.save();
      ctx.strokeStyle = 'rgba(49,242,255,0.05)';
      ctx.lineWidth = 1;
      const step = 44;
      for (let x = 0; x < this.w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.h);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

