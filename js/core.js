(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants & shared state
  // ---------------------------------------------------------------------------
  const TAU = Math.PI * 2;
  const ARENA_W = 2600;
  const HORIZON = 476;
  const GROUND_DEPTH = 320;
  const FLOOR_Z = { min: 0.06, max: 0.98 };
  const ATTACKS = [
    { startup: 0.06, active: 0.1, recover: 0.16, damage: 11, reach: 120, zReach: 0.27, lunge: 115, stop: 0.035, shake: 2.5 },
    { startup: 0.065, active: 0.11, recover: 0.18, damage: 14, reach: 128, zReach: 0.28, lunge: 95, stop: 0.04, shake: 3.5 },
    { startup: 0.1, active: 0.16, recover: 0.25, damage: 23, reach: 162, zReach: 0.36, lunge: 55, stop: 0.075, shake: 7 }
  ];
  const ENEMY_TYPES = {
    ronin:  { hp: 30,  speed: 92,  damage: 8,  range: 88,  zReach: 0.28, windup: 0.42, strike: 0.14, recover: 0.52, cooldown: 1.05, scale: 0.98, score: 110 },
    spear:  { hp: 38,  speed: 82,  damage: 11, range: 142, zReach: 0.3,  windup: 0.56, strike: 0.17, recover: 0.62, cooldown: 1.25, scale: 1.02, score: 150 },
    archer: { hp: 24,  speed: 82,  damage: 8,  range: 350, zReach: 0.55, windup: 0.8,  strike: 0.12, recover: 0.55, cooldown: 1.65, scale: 0.95, score: 140, ranged: true },
    brute:  { hp: 105, speed: 56,  damage: 18, range: 118, zReach: 0.4,  windup: 0.84, strike: 0.2,  recover: 0.85, cooldown: 2.0,  scale: 1.3,  score: 300, superArmor: true },
    boss:   { hp: 390, speed: 70,  damage: 21, range: 152, zReach: 0.55, windup: 0.68, strike: 0.22, recover: 0.68, cooldown: 1.25, scale: 1.68, score: 3000, superArmor: true, boss: true }
  };
  const WAVES = [
    {
      title: 'ASHES AT THE GATE',
      sub: 'They came for the shrine. They found the dark.',
      enemies: ['ronin', 'ronin', 'ronin']
    },
    {
      title: 'WHISPERS IN THE REEDS',
      sub: 'The arrows are not the worst of it. The quiet is.',
      enemies: ['ronin', 'archer', 'spear', 'ronin']
    },
    {
      title: 'THE CRIMSON GUARD',
      sub: 'Blood remembers what steel forgets.',
      enemies: ['spear', 'ronin', 'spear', 'archer']
    },
    {
      title: 'IRON AND BONE',
      sub: 'Something vast has woken beneath the courtyard.',
      enemies: ['brute', 'archer', 'ronin', 'archer']
    },
    {
      title: 'THE ONI SHOGUN',
      sub: 'Kurogane. The mountain made of scars.',
      enemies: ['boss', 'ronin', 'ronin']
    }
  ];

  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
  const randInt = (a, b) => Math.floor(rand(b + 1, a));
  const chance = p => Math.random() < p;
  const sign = v => v < 0 ? -1 : 1;
  const approach = (v, target, step) => v < target ? Math.min(v + step, target) : Math.max(v - step, target);
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeIn = t => Math.pow(clamp(t, 0, 1), 2.2);
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
  const pad = (n, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
  const roman = n => ROMAN[clamp(n - 1, 0, ROMAN.length - 1)] || String(n);
  const groundY = z => HORIZON + clamp(z, FLOOR_Z.min, FLOOR_Z.max) * GROUND_DEPTH;
  const depthScale = z => 0.79 + clamp(z, FLOOR_Z.min, FLOOR_Z.max) * 0.31;

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }

  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------
  const $ = id => document.getElementById(id);
  const dom = {
    hud: $('hud'), title: $('titleScreen'), how: $('howScreen'), pause: $('pauseScreen'),
    over: $('overScreen'), win: $('winScreen'), play: $('playBtn'), howBtn: $('howBtn'),
    soundBtn: $('soundBtn'), pauseBtn: $('pauseBtn'), titleSound: $('titleSound'),
    resumeBtn: $('resumeBtn'), restartPauseBtn: $('restartPauseBtn'), retryBtn: $('retryBtn'),
    overTitleBtn: $('overTitleBtn'), againBtn: $('againBtn'), winTitleBtn: $('winTitleBtn'),
    titleBest: $('titleBest'), waveNo: $('waveNo'), waveName: $('waveName'),
    enemyCount: $('enemyCount'), score: $('score'), hpFill: $('hpFill'), hpLag: $('hpLag'),
    hpText: $('hpText'), shadowFill: $('shadowFill'), shadowLabel: $('shadowLabel'),
    shadowTrack: document.querySelector('.shadow-track'), combo: $('combo'), comboNum: $('comboNum'),
    comboMeter: $('comboMeter'), waveBanner: $('waveBanner'), bannerKicker: $('bannerKicker'),
    bannerTitle: $('bannerTitle'), bannerSub: $('bannerSub'), bossBar: $('bossBar'),
    bossFill: $('bossFill'), toast: $('toast'), tutorial: $('tutorial'), tutorialText: $('tutorialText'),
    pulsePrompt: $('pulsePrompt'), flash: $('flash'), slowVignette: $('slowVignette'),
    touch: $('touchControls'), joystick: $('joystick'), knob: $('joystickKnob'),
    pauseWave: $('pauseWave'), pauseScore: $('pauseScore'), pauseCombo: $('pauseCombo'),
    overWave: $('overWave'), overScore: $('overScore'), overCombo: $('overCombo'),
    newBest: $('newBest'), winScore: $('winScore'), winCombo: $('winCombo'), winTime: $('winTime'),
    winBest: $('winBest'), rotateHint: $('rotateHint')
  };

  const canvas = $('scene');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const view = { w: 1440, h: 900, scale: 1, dpr: 1, W: 0, H: 0, half: 720 };

  // Save data
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('shadow-ninja:' + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('shadow-ninja:' + key, JSON.stringify(value)); } catch (e) {}
    }
  };

  const G = {
    state: 'title',
    time: 0,
    playTime: 0,
    late: 0,
    player: null,
    enemies: [],
    projectiles: [],
    effects: [],
    particles: [],
    texts: [],
    ambient: [],
    embers: [],
    cam: { x: 760, y: 0 },
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    zoom: 1,
    hitstop: 0,
    slowmo: 0,
    flash: 0,
    flashColor: '#fff6e0',
    flashMax: 1,
    waveIndex: 0,
    waveActive: false,
    waveCleared: false,
    spawnQueue: [],
    spawnTimer: 0,
    waveTimer: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    kills: 0,
    boss: null,
    bannerTimer: 0,
    toastTimer: 0,
    tutorialTimer: 0,
    perfectTimer: 0,
    deathTimer: null,
    victoryTimer: null,
    hitPauseText: null,
    best: store.get('best', { score: 0, wave: 0 }),
    soundOn: store.get('sound', true),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    preview: false
  };

  // ---------------------------------------------------------------------------
  // Audio — all synthesized, no external samples
  // ---------------------------------------------------------------------------
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.ambient = null;
      this.enabled = G.soundOn;
      this.nextPluck = 0;
      this.ready = false;
    }

    init() {
      if (this.ready) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? 0.46 : 0;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 18;
        comp.ratio.value = 5;
        comp.attack.value = 0.004;
        comp.release.value = 0.25;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        this.ready = true;
        this.startAmbient();
      } catch (e) { this.ready = false; }
    }

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    setEnabled(on) {
      this.enabled = on;
      G.soundOn = on;
      store.set('sound', on);
      if (this.master && this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.linearRampToValueAtTime(on ? 0.46 : 0, this.ctx.currentTime + 0.08);
      }
      updateSoundButtons();
    }

    now() { return this.ctx ? this.ctx.currentTime : 0; }

    makeNoise(seconds = 1) {
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buf;
    }

    noise(duration, type, freq, q, gain, slideTo) {
      if (!this.ready || !this.enabled) return;
      const t = this.now();
      const src = this.ctx.createBufferSource();
      src.buffer = this.makeNoise(Math.max(0.08, duration));
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.setValueAtTime(freq, t);
      if (slideTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + duration);
      filter.Q.value = q;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      src.connect(filter); filter.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + duration + 0.02);
    }

    tone(freq, duration, type, gain, slideTo, delay = 0) {
      if (!this.ready || !this.enabled) return;
      const t = this.now() + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + duration);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + duration + 0.02);
    }

    startAmbient() {
      if (!this.ready) return;
      const t = this.now();
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.045, t + 2.4);
      const low = this.ctx.createOscillator();
      low.type = 'sine'; low.frequency.value = 52;
      const low2 = this.ctx.createOscillator();
      low2.type = 'triangle'; low2.frequency.value = 78;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 6;
      lfo.connect(lfoGain); lfoGain.connect(low2.frequency);
      const lowGain = this.ctx.createGain(); lowGain.gain.value = 0.5;
      const low2Gain = this.ctx.createGain(); low2Gain.gain.value = 0.13;
      low.connect(lowGain); low2.connect(low2Gain);
      lowGain.connect(g); low2Gain.connect(g);

      const wind = this.ctx.createBufferSource();
      wind.buffer = this.makeNoise(5);
      wind.loop = true;
      const wf = this.ctx.createBiquadFilter();
      wf.type = 'bandpass'; wf.frequency.value = 390; wf.Q.value = 0.55;
      const wg = this.ctx.createGain(); wg.gain.value = 0.07;
      const wlfo = this.ctx.createOscillator(); wlfo.frequency.value = 0.045;
      const wlg = this.ctx.createGain(); wlg.gain.value = 0.035;
      wlfo.connect(wlg); wlg.connect(wg.gain);
      wind.connect(wf); wf.connect(wg); wg.connect(g);

      g.connect(this.master);
      low.start(t); low2.start(t); lfo.start(t); wind.start(t); wlfo.start(t);
      this.ambient = { g, low, low2, wind, lfo, wlfo };
      this.nextPluck = t + 4;
    }

    ambientTick() {
      if (!this.ready || !this.enabled) return;
      const t = this.now();
      if (t > this.nextPluck) {
        this.nextPluck = t + rand(9, 5);
        const notes = [220, 246.94, 293.66, 329.63, 392, 440];
        const n = notes[randInt(0, notes.length - 1)];
        this.pluck(n, 0.028);
        if (chance(0.4)) this.pluck(n * 1.5, 0.014, 0.55);
      }
    }

    pluck(freq, gain = 0.035, delay = 0) {
      if (!this.ready || !this.enabled) return;
      const t = this.now() + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1600;
      osc.type = 'triangle'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      osc.connect(filt); filt.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + 1.7);
    }

    slash(step = 0) {
      this.noise(0.18 + step * 0.02, 'bandpass', 900 + step * 220, 1.1, 0.2, 2600 + step * 500);
      this.tone(260 + step * 60, 0.1, 'sawtooth', 0.025, 90);
    }
    hit(heavy = false) {
      this.tone(heavy ? 68 : 96, heavy ? 0.24 : 0.13, 'sine', heavy ? 0.32 : 0.18, 34);
      this.noise(heavy ? 0.16 : 0.09, 'lowpass', 1200, 0.8, heavy ? 0.24 : 0.14, 220);
      this.tone(heavy ? 160 : 240, 0.06, 'square', 0.018, 80);
    }
    dash() {
      this.noise(0.28, 'bandpass', 2000, 1.4, 0.16, 420);
      this.tone(110, 0.18, 'sine', 0.06, 55);
    }
    kunai() {
      this.noise(0.13, 'highpass', 2200, 1, 0.12, 4800);
      this.tone(720, 0.08, 'triangle', 0.04, 330);
    }
    hurt() {
      this.hit(true);
      this.tone(48, 0.3, 'sine', 0.25, 24);
    }
    kill() {
      this.tone(92, 0.5, 'sine', 0.22, 36);
      this.noise(0.34, 'lowpass', 600, 0.7, 0.18, 100);
      this.pluck(329.63, 0.025);
    }
    perfect() {
      this.tone(880, 0.35, 'sine', 0.07, 1320);
      this.tone(1318.5, 0.5, 'sine', 0.035, 1760, 0.04);
      this.noise(0.4, 'highpass', 3800, 1, 0.06, 6000);
    }
    special() {
      this.tone(55, 1.1, 'sawtooth', 0.15, 28);
      this.noise(0.8, 'bandpass', 300, 0.7, 0.14, 2800);
      [220, 277, 330, 440].forEach((n, i) => this.pluck(n, 0.03, i * 0.07));
    }
    wave() {
      this.tone(58, 0.7, 'sine', 0.36, 26);
      this.noise(0.42, 'lowpass', 300, 0.8, 0.2, 70);
      this.pluck(146.83, 0.03, 0.06);
    }
    victory() {
      [293.66, 369.99, 440, 554.37, 659.25].forEach((n, i) => this.pluck(n, 0.04, i * 0.16));
      this.tone(73.42, 2.2, 'sine', 0.11, 36);
    }
    ui() {
      this.tone(560, 0.05, 'triangle', 0.018, 720);
    }
    bossRoar() {
      this.tone(44, 1.2, 'sawtooth', 0.2, 22);
      this.noise(1.1, 'lowpass', 220, 0.8, 0.2, 60);
    }
  }

  const audio = new AudioEngine();

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  const input = {
    held: Object.create(null),
    pressed: Object.create(null),
    touchX: 0,
    touchY: 0,
    touchActive: false,
    press(action) {
      if (!this.held[action]) this.pressed[action] = true;
      this.held[action] = true;
    },
    release(action) { this.held[action] = false; },
    consume(action) {
      if (this.pressed[action]) { this.pressed[action] = false; return true; }
      return false;
    },
    axis() {
      let x = (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
      let y = (this.held.down ? 1 : 0) - (this.held.up ? 1 : 0);
      if (this.touchActive) { x += this.touchX; y += this.touchY; }
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      return { x, y };
    },
    clear() {
      this.touchActive = false;
      this.touchX = this.touchY = 0;
      for (const k in this.held) this.held[k] = false;
      for (const k in this.pressed) this.pressed[k] = false;
      dom.knob.style.transform = '';
      dom.joystick.classList.remove('active');
      document.querySelectorAll('.action-btn.pressed').forEach(b => b.classList.remove('pressed'));
    }
  };

  const keyMap = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    KeyJ: 'attack', Space: 'attack', KeyK: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash',
    KeyL: 'kunai', KeyF: 'kunai', KeyE: 'special', KeyQ: 'special'
  };

  window.addEventListener('keydown', e => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (G.state === 'playing') { e.preventDefault(); pauseGame(); }
      else if (G.state === 'paused') { e.preventDefault(); resumeGame(); }
      else if (G.state === 'how') { e.preventDefault(); dom.how.classList.add('is-hidden'); G.state = 'title'; }
      return;
    }
    if (e.code === 'KeyM') { audio.setEnabled(!audio.enabled); return; }
    if (e.code === 'Enter' && G.state === 'title') { startRun(); return; }
    if (e.code === 'Enter' && (G.state === 'over' || G.state === 'win')) { startRun(); return; }
    const action = keyMap[e.code];
    if (!action) return;
    if (G.state === 'playing' || G.state === 'title' || G.state === 'paused') e.preventDefault();
    if (e.repeat) return;
    input.press(action);
  }, { passive: false });

  window.addEventListener('keyup', e => {
    const action = keyMap[e.code];
    if (action) input.release(action);
  });

  window.addEventListener('blur', () => { input.clear(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state === 'playing') pauseGame();
  });

  // Touch joystick
  let joyPointer = null;
  function setJoystick(e) {
    const r = dom.joystick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const max = r.width * 0.3;
    const m = Math.hypot(dx, dy);
    if (m > max) { dx = dx / m * max; dy = dy / m * max; }
    dom.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    input.touchX = dx / max;
    input.touchY = dy / max;
    input.touchActive = true;
  }
  dom.joystick.addEventListener('pointerdown', e => {
    joyPointer = e.pointerId;
    dom.joystick.classList.add('active');
    dom.joystick.setPointerCapture(e.pointerId);
    setJoystick(e);
    e.preventDefault();
  });
  dom.joystick.addEventListener('pointermove', e => {
    if (e.pointerId === joyPointer) setJoystick(e);
  });
  const endJoy = e => {
    if (e.pointerId !== joyPointer) return;
    joyPointer = null;
    input.touchActive = false;
    input.touchX = input.touchY = 0;
    dom.knob.style.transform = '';
    dom.joystick.classList.remove('active');
  };
  dom.joystick.addEventListener('pointerup', endJoy);
  dom.joystick.addEventListener('pointercancel', endJoy);
  dom.joystick.addEventListener('pointerleave', e => { if (e.pointerId === joyPointer && e.buttons === 0) endJoy(e); });

  // Touch action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    const action = btn.dataset.act;
    const down = e => {
      if (G.state !== 'playing') return;
      btn.setPointerCapture?.(e.pointerId);
      input.press(action);
      btn.classList.add('pressed');
      e.preventDefault();
    };
    const up = e => {
      input.release(action);
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', e => { if (e.buttons === 0) up(e); });
  });

  // Prevent context menu / double tap zoom
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.dpr = dpr;
    view.W = window.innerWidth;
    view.H = window.innerHeight;
    view.scale = view.H / 900;
    view.w = view.W / view.scale;
    view.h = 900;
    view.half = view.w / 2;
    canvas.width = Math.round(view.W * dpr);
    canvas.height = Math.round(view.H * dpr);
    canvas.style.width = view.W + 'px';
    canvas.style.height = view.H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (typeof buildScenery === 'function') buildScenery();
    if (G.state === 'title' && G.player) {
      G.cam.x = G.player.x - (view.w > 1000 ? 390 : 24);
    }
  }
  window.addEventListener('resize', resize);

  function worldTransform(parallax = 1, shake = 1) {
    ctx.translate(view.W / 2, 0);
    ctx.scale(view.scale * G.zoom, view.scale * G.zoom);
    ctx.translate(-G.cam.x * parallax + G.shakeX * shake, -G.cam.y + G.shakeY * shake);
  }

  function addShake(amount) {
    if (G.reducedMotion) return;
    G.shake = Math.max(G.shake, amount);
  }

  function flash(color = '#fff8e8', intensity = 0.6) {
    G.flashColor = color;
    G.flash = Math.max(G.flash, intensity);
    G.flashMax = Math.max(0.001, G.flash);
    dom.flash.style.background = color;
    dom.flash.style.mixBlendMode = color === '#8ff4ee' ? 'screen' : 'screen';
  }

  function slowTime(seconds = 0.55) {
    G.slowmo = Math.max(G.slowmo, seconds);
    dom.slowVignette.classList.add('active');
  }

  // Expose shared symbols for the other classic scripts.
  Object.assign(window, {
    TAU, ARENA_W, HORIZON, GROUND_DEPTH, FLOOR_Z, ATTACKS, ENEMY_TYPES, WAVES, ROMAN,
    clamp, lerp, rand, randInt, chance, sign, approach, easeOut, easeIn, smooth, dist2,
    pad, roman, groundY, depthScale, mulberry32, hexA, dom, canvas, ctx, view, store, G,
    audio, input, resize, worldTransform, addShake, flash, slowTime
  });
})();
