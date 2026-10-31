/* CHRONO DEBT — a temporal arena combat game.
   Every second you steal is added to the ledger. The future always collects. */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const MAX_DEBT = 8;
  const PATH_DT = 0.055;

  const $ = (sel) => document.querySelector(sel);
  const app = $('#app');
  const canvas = $('#game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const el = {
    menu: $('#menu'), pause: $('#pause'), end: $('#end'),
    play: $('#playBtn'), resume: $('#resumeBtn'), retry: $('#retryBtn'),
    mute: $('#muteBtn'), best: $('#bestScore'), endBest: $('#endBest'),
    hpFill: $('#hpFill'), hpNum: $('#hpNum'), dashState: $('#dashState'),
    waveNum: $('#waveNum'), score: $('#score'), combo: $('#combo'),
    debtNum: $('#debtNum'), debtFill: $('#debtFill'), debtBlock: $('#debtBlock'),
    debtWarn: $('#debtWarn'), debtEcho: $('#debtEcho'),
    bossHud: $('#bossHud'), bossFill: $('#bossFill'),
    banner: $('#banner'), toast: $('#toast'),
    endRank: $('#endRank'), endKicker: $('#endKicker'), endTitle: $('#endTitle'),
    endSub: $('#endSub'), statScore: $('#statScore'), statKills: $('#statKills'),
    statStolen: $('#statStolen'), statEchoes: $('#statEchoes'),
    endFoot: $('#endFoot'), stealBtn: $('#stealBtn'), dashBtn: $('#dashBtn'),
    moveStick: $('#moveStick'), aimStick: $('#aimStick')
  };

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const pad = (n, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, '0');

  function angleDiff(a, b) {
    let d = (a - b + Math.PI) % TAU;
    if (d < 0) d += TAU;
    return d - Math.PI;
  }
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  function hexRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function rgba(hex, a) {
    const [r, g, b] = hexRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  const COLOR = {
    cyan: '#61f1ff', cyanHot: '#c9fdff', cyanDeep: '#0aa7c4',
    amber: '#ffb84d', amberHot: '#ffe0a1', red: '#ff3f5f',
    pink: '#ff4ea3', green: '#7dffc4', ink: '#eaf8ff', white: '#ffffff'
  };

  /* ------------------------------------------------------------------ view */

  const view = {
    w: 0, h: 0, dpr: 1, cx: 0, cy: 0, R: 0, k: 1,
    menuCx: 0, menuCy: 0, menuR: 0
  };

  const dust = [];

  function resize() {
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(320, window.innerHeight);
    const dpr = Math.min(1.75, window.devicePixelRatio || 1);
    view.w = w; view.h = h; view.dpr = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const portrait = h > w;
    view.cx = w / 2;
    if (!portrait && h < 560) {
      view.cy = h * 0.52;
      view.R = Math.min(w * 0.32, h * 0.3);
    } else {
      view.cy = portrait ? h * 0.46 : h * 0.535;
      view.R = Math.min(portrait ? w * 0.45 : w * 0.4, portrait ? h * 0.34 : h * 0.38);
    }
    view.k = clamp(view.R / 330, 0.7, 1.12);

    view.menuCx = portrait ? w * 0.5 : w * 0.72;
    view.menuCy = portrait ? h * 0.67 : h * 0.5;
    view.menuR = Math.min(portrait ? w * 0.58 : w * 0.31, h * 0.43);

    dust.length = 0;
    for (let i = 0; i < 80; i++) {
      dust.push({
        x: Math.random() * w, y: Math.random() * h,
        z: rand(1, .2), s: rand(1.8, .4), ph: rand(TAU)
      });
    }

    if (typeof state !== 'undefined' && state) {
      const p = state.player;
      if (state.mode === 'menu') {
        p.x = view.menuCx; p.y = view.menuCy;
      } else {
        clampToArena(p, 30 * view.k);
      }
      p.r = 14 * view.k;
      for (const e of state.enemies) clampToArena(e, e.r + 4);
    }
  }

  function clampToArena(obj, margin = 0) {
    const dx = obj.x - view.cx, dy = obj.y - view.cy;
    const d = Math.hypot(dx, dy);
    const max = Math.max(10, view.R - margin);
    if (d > max) {
      obj.x = view.cx + dx / d * max;
      obj.y = view.cy + dy / d * max;
      if (obj.vx !== undefined) { obj.vx *= .2; obj.vy *= .2; }
    }
  }

  function stageInfo() {
    const menu = state && state.mode === 'menu';
    return menu
      ? { cx: view.menuCx, cy: view.menuCy, R: view.menuR, menu: true }
      : { cx: view.cx, cy: view.cy, R: view.R, menu: false };
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));

  /* ----------------------------------------------------------------- audio */

  const Sound = {
    ctx: null, master: null, droneGain: null, noiseBuf: null, muted: false,
    init() {
      if (this.ctx) { this.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = new AC();
        const master = ac.createGain();
        master.gain.value = this.muted ? 0 : 0.55;
        master.connect(ac.destination);
        this.ctx = ac; this.master = master;

        const drone = ac.createGain();
        drone.gain.value = 0.045;
        drone.connect(master);
        this.droneGain = drone;

        [55, 82.5].forEach((f, i) => {
          const o = ac.createOscillator();
          o.type = i ? 'sine' : 'triangle';
          o.frequency.value = f;
          const g = ac.createGain();
          g.gain.value = i ? 0.3 : 0.5;
          const lp = ac.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 210;
          o.connect(g); g.connect(lp); lp.connect(drone);
          o.start();
        });

        const lfo = ac.createOscillator();
        lfo.frequency.value = 0.07;
        const lg = ac.createGain();
        lg.gain.value = 0.021;
        lfo.connect(lg); lg.connect(drone.gain); lfo.start();

        const len = Math.floor(ac.sampleRate * 1.2);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;

        const wind = ac.createBufferSource();
        wind.buffer = buf; wind.loop = true;
        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = 0.6;
        const ng = ac.createGain(); ng.gain.value = 0.012;
        wind.connect(bp); bp.connect(ng); ng.connect(master);
        wind.start();
      } catch (err) { /* audio is optional */ }
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
    setMuted(muted) {
      this.muted = muted;
      if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.04);
      el.mute.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
    },
    tone(f0, f1, dur, type = 'sine', vol = 0.08, delay = 0) {
      if (!this.ctx || this.muted) return;
      const ac = this.ctx;
      const t0 = ac.currentTime + delay;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(20, f0), t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    },
    noise(dur = 0.1, vol = 0.08, freq = 1400, q = 1, delay = 0) {
      if (!this.ctx || this.muted || !this.noiseBuf) return;
      const ac = this.ctx;
      const t0 = ac.currentTime + delay;
      const s = ac.createBufferSource();
      s.buffer = this.noiseBuf;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(this.master);
      s.start(t0); s.stop(t0 + dur + 0.03);
    },
    slash(heavy) {
      this.noise(heavy ? 0.15 : 0.08, heavy ? 0.15 : 0.1, heavy ? 2600 : 1700, 1.2);
      this.tone(heavy ? 1100 : 820, 220, heavy ? 0.15 : 0.1, 'triangle', 0.045);
    },
    hit() { this.tone(210, 80, 0.06, 'square', 0.03); },
    kill() { this.noise(0.14, 0.11, 2600, 1); this.tone(480, 920, 0.1, 'triangle', 0.045); },
    hurt() { this.tone(155, 44, 0.32, 'sawtooth', 0.12); this.noise(0.22, 0.055, 480, 0.7); },
    dash() { this.noise(0.18, 0.075, 900, 2); this.tone(250, 780, 0.16, 'sine', 0.035); },
    stealOn() { this.tone(180, 760, 0.5, 'sine', 0.065); this.noise(0.3, 0.02, 3000, 2); },
    stealOff() { this.tone(720, 190, 0.22, 'sine', 0.03); },
    tick() { this.tone(1500, 1200, 0.028, 'square', 0.012); },
    collect() {
      this.tone(88, 30, 1.6, 'sine', 0.22);
      this.tone(235, 58, 1.0, 'sawtooth', 0.06);
      this.noise(0.8, 0.08, 300, 0.5);
      for (let i = 0; i < 3; i++) this.tone(900, 660, 0.12, 'square', 0.035, 0.22 + i * 0.18);
    },
    shoot() { this.tone(430, 140, 0.12, 'square', 0.03); },
    echo() { this.tone(112, 92, 0.55, 'sawtooth', 0.06); this.tone(117, 95, 0.55, 'sawtooth', 0.045); },
    wave() { [220, 277, 330].forEach((f, i) => this.tone(f, f * 1.5, 0.4, 'triangle', 0.025, i * 0.06)); },
    boss() { this.tone(60, 34, 1.4, 'sine', 0.14); this.noise(0.7, 0.055, 200, 0.5); },
    pickup() { this.tone(900, 1520, 0.06, 'sine', 0.022); },
    heal() { this.tone(440, 880, 0.2, 'sine', 0.035); },
    win() { [261, 329, 392, 523, 659].forEach((f, i) => this.tone(f, f, 0.7, 'triangle', 0.045, i * 0.12)); }
  };

  function getBest() {
    try { return Number(localStorage.getItem('chrono-debt-best')) || 0; } catch (err) { return 0; }
  }
  function setBest(v) {
    try { localStorage.setItem('chrono-debt-best', String(v)); } catch (err) { /* ignore */ }
  }

  /* ----------------------------------------------------------------- input */

  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, active: false },
    attackHeld: false,
    stealing: false,
    move: { x: 0, y: 0, active: false },
    aim: { x: 0, y: 0, active: false },
    firing: false,
    touch: false,
    touchSeen: false
  };

  /* ------------------------------------------------------------------ data */

  const WAVES = [
    {
      title: 'THE FIRST WITHDRAWAL',
      sub: 'A small loan, to begin.',
      types: [['husk', 3], ['husk', 2]],
      spacing: 0.62
    },
    {
      title: 'BORROWED BREATH',
      sub: 'They can smell the interest.',
      types: [['husk', 3], ['spitter', 2], ['husk', 2]],
      spacing: 0.58
    },
    {
      title: 'COMPOUND INTEREST',
      sub: 'Every second is earning.',
      types: [['husk', 4], ['spitter', 2], ['brute', 1], ['husk', 2]],
      spacing: 0.52
    },
    {
      title: 'PAST DUE',
      sub: 'The ledger sends its reminders.',
      types: [['husk', 4], ['spitter', 3], ['brute', 2], ['husk', 3]],
      spacing: 0.46
    },
    {
      title: 'FINAL COLLECTION',
      sub: 'It has come for the balance.',
      types: [['husk', 3], ['spitter', 2]],
      spacing: 1.25,
      boss: true
    }
  ];

  const ENEMY = {
    husk: { hp: 24, r: 13, speed: 98, dmg: 12, color: COLOR.pink, score: 100 },
    spitter: { hp: 19, r: 12, speed: 62, dmg: 8, color: COLOR.amber, score: 150 },
    brute: { hp: 82, r: 24, speed: 52, dmg: 19, color: COLOR.red, score: 300 },
    echo: { hp: 66, r: 15, speed: 150, dmg: 15, color: '#ffd9de', score: 500 },
    boss: { hp: 640, r: 56, speed: 44, dmg: 26, color: COLOR.red, score: 5000 }
  };

  let state = null;
  let bannerTimer = 0;
  let toastTimer = 0;

  function makePlayer(mode) {
    const menu = mode === 'menu';
    return {
      x: menu ? view.menuCx : view.cx,
      y: menu ? view.menuCy : view.cy,
      vx: 0, vy: 0,
      angle: -Math.PI / 2,
      r: 14 * view.k,
      hp: 100, maxHp: 100,
      cd: 0, dashCd: 0, dash: 0, dashVX: 0, dashVY: 0,
      invuln: 0, swing: 0, slash: null,
      trail: [], trailAcc: 0, walk: 0, dead: false
    };
  }

  function createState(mode) {
    return {
      mode,
      rt: 0, time: 0,
      timeScale: 1, slowBlend: 0, wasStealing: false, snap: 0,
      debt: 0, maxDebt: MAX_DEBT, collections: 0, stolen: 0,
      score: 0, combo: 1, comboTimer: 0, kills: 0, damageTaken: 0,
      wave: 0, wavePhase: 'idle', waveTimer: 0, spawnQueue: [], spawnTimer: 0,
      player: makePlayer(mode),
      enemies: [], projectiles: [], particles: [], texts: [], motes: [], spawners: [],
      shake: 0, flash: 0, flashColor: '255,255,255', hitstop: 0,
      tickAcc: 0, surge: 0, hudAcc: 0,
      path: [], pathAcc: 0,
      best: getBest(),
      endShown: false, bossDefeated: false, bossAlive: false, stealHintShown: false,
      runId: Math.random()
    };
  }

  state = createState('menu');

  /* ---------------------------------------------------------------- banners */

  function showBanner(kicker, title, sub, kind = '', dur = 2.5) {
    el.banner.querySelector('.banner-kicker').textContent = kicker;
    el.banner.querySelector('.banner-title').textContent = title;
    el.banner.querySelector('.banner-sub').textContent = sub;
    el.banner.className = 'banner on' + (kind ? ' ' + kind : '');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => el.banner.classList.remove('on'), dur * 1000);
  }

  function hideBanner() {
    clearTimeout(bannerTimer);
    el.banner.classList.remove('on');
  }

  function showToast(text, kind = '', dur = 2.4) {
    el.toast.textContent = text;
    el.toast.className = 'on' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('on'), dur * 1000);
  }

  /* ------------------------------------------------------------------- run */

  function startGame() {
    Sound.init();
    Sound.resume();
    state = createState('playing');
    document.body.classList.add('is-playing');
    document.body.classList.remove('is-menu');
    app.classList.remove('is-menu');
    app.classList.add('is-playing');
    el.menu.classList.add('hidden');
    el.pause.classList.add('hidden');
    el.end.classList.add('hidden');
    el.bossHud.classList.remove('on');
    hideBanner();
    el.toast.classList.remove('on');
    updateHud(true);
    startWave(0);
    render();
  }

  function startWave(i) {
    const cfg = WAVES[i];
    state.wave = i;
    state.wavePhase = 'active';
    state.waveTimer = 0;
    state.spawnQueue = [];
    for (const [kind, n] of cfg.types) {
      for (let k = 0; k < n; k++) state.spawnQueue.push(kind);
    }
    for (let k = state.spawnQueue.length - 1; k > 0; k--) {
      const j = (Math.random() * (k + 1)) | 0;
      [state.spawnQueue[k], state.spawnQueue[j]] = [state.spawnQueue[j], state.spawnQueue[k]];
    }

    state.spawnTimer = cfg.boss ? 2.4 : 0.5;

    if (cfg.boss) {
      addSpawner('boss', view.cx, view.cy - view.R * 0.5, 1.9);
      showBanner('WAVE 05 / 05', cfg.title, cfg.sub, 'danger', 3);
      Sound.boss();
      showToast('THE COLLECTOR REMEMBERS EVERY SECOND', 'danger', 3.4);
    } else {
      // Put the first tear in the arena immediately so the fight never opens empty.
      if (state.spawnQueue.length) {
        const kind = state.spawnQueue.shift();
        const pt = spawnPoint();
        addSpawner(kind, pt.x, pt.y, 0.82);
        state.spawnTimer = 0.55;
      }
      showBanner('WAVE ' + pad(i + 1, 2) + ' / 05', cfg.title, cfg.sub, '', 2.4);
      Sound.wave();
    }
  }

  function spawnPoint() {
    let best = null;
    let bestDist = 0;
    for (let i = 0; i < 14; i++) {
      const a = rand(TAU);
      const rad = view.R * rand(0.93, 0.8);
      const x = view.cx + Math.cos(a) * rad;
      const y = view.cy + Math.sin(a) * rad;
      const d = Math.hypot(x - state.player.x, y - state.player.y);
      if (d > 155 * view.k) return { x, y };
      if (d > bestDist) { bestDist = d; best = { x, y }; }
    }
    return best || { x: view.cx + view.R * .8, y: view.cy };
  }

  /* ------------------------------------------------------------------ time */

  function updateTime(dt) {
    const p = state.player;
    let want = 1;
    const canSteal = input.stealing && state.snap <= 0 && p.hp > 0 && state.mode === 'playing';

    if (state.snap > 0) {
      state.snap -= dt;
      want = 1;
      state.timeScale = Math.min(1, state.timeScale + dt * 3.2);
    } else if (canSteal) {
      want = 0.3;
      state.debt += dt;
      state.stolen += dt;
      if (!state.stealHintShown) {
        state.stealHintShown = true;
        showToast('STOLEN SECONDS BECOME DEBT · COLLECTIONS RELEASE ECHOES', 'gold', 3.8);
      }
      if (Math.random() < dt * 16) {
        const a = rand(TAU), d = rand(80, 20) * view.k;
        spawnParticle({
          kind: 'dot', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d,
          vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, r: rand(2, 1), color: COLOR.cyan,
          life: rand(.7, .3), max: .7, drag: 2
        });
      }
    }

    state.timeScale = damp(state.timeScale, want, state.snap > 0 ? 20 : 15, dt);
    if (state.timeScale < 0.3 && !canSteal) state.timeScale = Math.max(0.3, state.timeScale);
    state.slowBlend = clamp((1 - state.timeScale) / 0.7, 0, 1);

    if (canSteal !== state.wasStealing) {
      if (canSteal) Sound.stealOn(); else Sound.stealOff();
      state.wasStealing = canSteal;
    }

    if (Math.random() < dt * (canSteal ? 3 : .5)) {
      const a = rand(TAU), d = view.R * rand(.95, .3);
      spawnParticle({
        kind: 'dot', x: view.cx + Math.cos(a) * d, y: view.cy + Math.sin(a) * d,
        vx: rand(-4, -14), vy: rand(-10, 2), r: rand(1.4, .4),
        color: canSteal ? COLOR.cyan : COLOR.amber, life: rand(2.4, .9), max: 2.4, drag: .4
      });
    }

    if (state.surge > 0) state.surge -= dt;

    state.tickAcc += dt;
    const interval = lerp(1.4, 0.34, clamp(state.debt / MAX_DEBT, 0, 1));
    if (state.tickAcc >= interval) {
      state.tickAcc = 0;
      Sound.tick();
    }

    if (state.debt >= MAX_DEBT) collectDebt();
  }

  function collectDebt() {
    state.debt = 0;
    state.collections++;
    state.snap = 0.85;
    state.surge = 4.5;
    state.timeScale = 1.3;
    state.flash = Math.max(state.flash, 0.85);
    state.flashColor = '255,63,95';
    state.shake = Math.max(state.shake, 20);
    state.hitstop = Math.max(state.hitstop, 0.08);
    const p = state.player;
    ringFx(p.x, p.y, COLOR.red, 20, view.R, 2.5, .65);
    ringFx(p.x, p.y, COLOR.amber, 10, view.R * .7, 5, .45);
    spawnBurst(p.x, p.y, COLOR.red, 46, 340, 3.2);
    Sound.collect();
    spawnEchoFromDebt();
    showBanner('INTEREST DUE', 'THE FUTURE COLLECTS', 'AN ECHO OF YOUR DEBT HAS BEEN RELEASED', 'danger', 2.8);
    showToast(state.collections === 1 ? 'AN ECHO HUNTS YOU · KILL IT TO RECLAIM 1.2s' : state.collections + ' COLLECTIONS · ENEMIES SURGE', 'danger', 3.4);
  }

  /* ---------------------------------------------------------------- player */

  function nearestEnemy(fromX, fromY) {
    let best = null, bd = Infinity;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fromX, e.y - fromY);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function updatePlayer(dt) {
    const p = state.player;
    p.cd = Math.max(0, p.cd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.walk += dt;

    let mx = 0, my = 0;
    if (input.keys.has('w') || input.keys.has('arrowup')) my -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) my += 1;
    if (input.keys.has('a') || input.keys.has('arrowleft')) mx -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) mx += 1;
    if (input.move.active) { mx = input.move.x; my = input.move.y; }
    const m = Math.hypot(mx, my);
    if (m > 1) { mx /= m; my /= m; }

    if (p.dash > 0) {
      p.dash -= dt;
      p.x += p.dashVX * dt;
      p.y += p.dashVY * dt;
      p.dashVX *= Math.pow(0.006, dt);
      p.dashVY *= Math.pow(0.006, dt);
      if (Math.random() < dt * 55) {
        spawnParticle({
          kind: 'spark', x: p.x, y: p.y, vx: -p.dashVX * .12 + rand(40, -40),
          vy: -p.dashVY * .12 + rand(40, -40), r: rand(2.4, .8), len: rand(10, 3),
          color: COLOR.cyan, life: rand(.4, .15), max: .4, drag: 3
        });
      }
    } else {
      const sp = 270 * view.k;
      p.vx = damp(p.vx, mx * sp, 14, dt);
      p.vy = damp(p.vy, my * sp, 14, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    clampToArena(p, 27 * view.k);

    // Aim priority: touch aim > mouse > nearest enemy > movement.
    let aimX = p.x + Math.cos(p.angle) * 100;
    let aimY = p.y + Math.sin(p.angle) * 100;
    if (input.aim.active && Math.hypot(input.aim.x, input.aim.y) > 0.18) {
      p.angle = Math.atan2(input.aim.y, input.aim.x);
    } else if (input.mouse.active && !input.touch) {
      p.angle = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);
    } else {
      const target = nearestEnemy(p.x, p.y);
      if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
      else if (m > 0.1) p.angle = Math.atan2(my, mx);
    }

    if ((input.attackHeld || input.firing || input.keys.has('j')) && p.cd <= 0) attack();

    if (p.slash) {
      p.slash.t += dt;
      if (p.slash.t >= p.slash.dur) p.slash = null;
    }

    p.trailAcc -= dt;
    if (p.trailAcc <= 0) {
      p.trailAcc = 0.028;
      p.trail.push({ x: p.x, y: p.y, a: p.angle, life: 0.34, max: 0.34 });
      if (p.trail.length > 20) p.trail.shift();
    }
    for (const t of p.trail) t.life -= dt;
    p.trail = p.trail.filter(t => t.life > 0);

    state.pathAcc += dt;
    if (state.pathAcc >= PATH_DT) {
      state.pathAcc -= PATH_DT;
      state.path.push({ x: p.x, y: p.y, angle: p.angle });
      const cap = Math.ceil(9 / PATH_DT);
      if (state.path.length > cap) state.path.shift();
    }

    if (p.invuln > 0 && Math.random() < dt * 10) {
      spawnParticle({
        kind: 'dot', x: p.x + rand(14, -14), y: p.y + rand(14, -14),
        vx: rand(20, -20), vy: rand(20, -20), r: rand(2, .6),
        color: p.invuln > .5 ? COLOR.white : COLOR.red, life: .3, max: .3, drag: 2
      });
    }
  }

  function dash() {
    if (state.mode !== 'playing') return;
    const p = state.player;
    if (p.dashCd > 0 || p.dash > 0) return;
    let dx = 0, dy = 0;
    if (input.move.active) { dx = input.move.x; dy = input.move.y; }
    else {
      if (input.keys.has('w') || input.keys.has('arrowup')) dy -= 1;
      if (input.keys.has('s') || input.keys.has('arrowdown')) dy += 1;
      if (input.keys.has('a') || input.keys.has('arrowleft')) dx -= 1;
      if (input.keys.has('d') || input.keys.has('arrowright')) dx += 1;
    }
    if (Math.hypot(dx, dy) < 0.15) { dx = Math.cos(p.angle); dy = Math.sin(p.angle); }
    const d = Math.hypot(dx, dy) || 1;
    p.dashVX = dx / d * 930 * view.k;
    p.dashVY = dy / d * 930 * view.k;
    p.dash = 0.145;
    p.dashCd = 1.15;
    p.invuln = Math.max(p.invuln, 0.3);
    state.shake = Math.max(state.shake, 4);
    Sound.dash();
    ringFx(p.x, p.y, COLOR.cyan, 6, 44 * view.k, 2, .3);
    spawnBurst(p.x, p.y, COLOR.cyan, 12, 180, 2);
  }

  function attack() {
    const p = state.player;
    p.swing++;
    const heavy = p.swing % 3 === 0;
    const reach = (heavy ? 152 : 121) * view.k;
    const half = heavy ? 1.02 : 0.8;
    p.cd = heavy ? 0.34 : 0.235;
    p.slash = {
      t: 0, dur: heavy ? 0.23 : 0.16, ang: p.angle,
      reach, half, heavy, side: p.swing % 2 ? 1 : -1
    };
    p.vx += Math.cos(p.angle) * (heavy ? 105 : 52) * view.k;
    p.vy += Math.sin(p.angle) * (heavy ? 105 : 52) * view.k;

    let hits = 0;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const diff = Math.abs(angleDiff(Math.atan2(dy, dx), p.angle));
      if (d < reach + e.r && (d < p.r + e.r + 28 || diff < half + Math.min(.5, e.r / d))) {
        const dmg = heavy ? 26 : 15;
        damageEnemy(e, dmg, dx / d, dy / d, heavy);
        hits++;
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const b = state.projectiles[i];
      const dx = b.x - p.x, dy = b.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < reach + b.r && Math.abs(angleDiff(Math.atan2(dy, dx), p.angle)) < half + .25) {
        state.projectiles.splice(i, 1);
        spawnBurst(b.x, b.y, b.color, 7, 130, 1.6);
        ringFx(b.x, b.y, b.color, 2, 22, 1.5, .25);
        state.score += 10;
        Sound.hit();
      }
    }

    if (hits > 0) {
      state.hitstop = Math.max(state.hitstop, heavy ? .075 : .04);
      state.shake = Math.max(state.shake, heavy ? 8 : 4.5);
    }
    Sound.slash(heavy);
  }

  function damageEnemy(e, dmg, dx, dy, heavy) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.11;
    if (e.kind !== 'boss') {
      const push = (heavy ? 380 : 190) / (e.kind === 'brute' ? 2.4 : 1);
      e.kx += dx * push;
      e.ky += dy * push;
    }
    spawnBurst(e.x + dx * -e.r * .2, e.y + dy * -e.r * .2, heavy ? COLOR.amberHot : e.color, heavy ? 12 : 6, heavy ? 240 : 150, 2.2);
    if (heavy) {
      ringFx(e.x, e.y, COLOR.amberHot, 6, 58, 2, .3);
      showText(e.x + rand(10, -10), e.y - e.r - 8, '-' + dmg, COLOR.amberHot, 12);
    }
    Sound.hit();
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    state.kills++;
    state.combo = Math.min(5, state.combo + 0.18);
    state.comboTimer = 3;
    const gained = Math.round(e.score * state.combo);
    state.score += gained;
    state.debt = Math.max(0, state.debt - (e.kind === 'boss' ? 4 : e.kind === 'echo' ? 1.2 : 0.32));

    spawnBurst(e.x, e.y, e.color, e.kind === 'boss' ? 90 : e.kind === 'brute' ? 34 : 20, e.kind === 'boss' ? 520 : 280, e.kind === 'boss' ? 4 : 2.6);
    ringFx(e.x, e.y, e.color, e.r, e.kind === 'boss' ? view.R : e.r * 7, e.kind === 'boss' ? 5 : 2.4, e.kind === 'boss' ? .9 : .5);
    showText(e.x, e.y - e.r - 10, '+' + gained, e.kind === 'boss' ? COLOR.amberHot : COLOR.cyanHot, e.kind === 'boss' ? 22 : 12);

    const drops = e.kind === 'boss' ? 12 : e.kind === 'brute' ? 3 : e.kind === 'echo' ? 4 : 1;
    for (let i = 0; i < drops; i++) spawnMote(e.x, e.y, 'time');
    if (e.kind === 'brute' && Math.random() < 0.55) spawnMote(e.x, e.y, 'heal');
    if (e.kind === 'echo') showToast('ECHO SILENCED · DEBT −1.2s', 'gold', 2);

    if (e.kind === 'boss') {
      state.bossDefeated = true;
      state.bossAlive = false;
      el.bossHud.classList.remove('on');
      state.flash = Math.max(state.flash, .9);
      state.flashColor = '255,220,150';
      state.shake = 28;
      ringFx(e.x, e.y, COLOR.amber, 20, view.R * 1.4, 6, 1.2);
      win();
    } else {
      Sound.kill();
      state.shake = Math.max(state.shake, e.kind === 'brute' ? 10 : 5);
    }
  }

  function hurtPlayer(dmg, srcX, srcY) {
    const p = state.player;
    if (p.invuln > 0 || state.mode !== 'playing' || p.dead) return;
    p.hp = Math.max(0, p.hp - dmg);
    p.invuln = 0.85;
    state.damageTaken += dmg;
    state.flash = Math.max(state.flash, .38);
    state.flashColor = '255,63,95';
    state.shake = Math.max(state.shake, 12);
    const a = Math.atan2(p.y - srcY, p.x - srcX);
    p.vx += Math.cos(a) * 290 * view.k;
    p.vy += Math.sin(a) * 290 * view.k;
    spawnBurst(p.x, p.y, COLOR.red, 18, 240, 2.5);
    showText(p.x, p.y - 24, '-' + dmg, COLOR.red, 14);
    Sound.hurt();
    if (p.hp <= 0) die();
  }

  function die() {
    if (state.mode !== 'playing') return;
    state.mode = 'dead';
    const p = state.player;
    p.dead = true;
    state.flash = Math.max(state.flash, .7);
    state.flashColor = '255,63,95';
    state.shake = 24;
    spawnBurst(p.x, p.y, COLOR.red, 70, 420, 3.5);
    ringFx(p.x, p.y, COLOR.red, 8, view.R, 4, 1);
    state.projectiles.length = 0;
    showBanner('CREDIT EXHAUSTED', 'YOU RAN OUT OF TIME', 'THE FUTURE COLLECTED', 'danger', 3);
    const run = state;
    setTimeout(() => { if (state === run) showEnd(false); }, 1250);
  }

  function win() {
    if (state.mode !== 'playing') return;
    state.mode = 'won';
    state.projectiles.length = 0;
    state.flash = 1;
    state.flashColor = '255,225,160';
    state.shake = 26;
    const run = state;
    showBanner('THE LEDGER IS CLOSED', 'DEBT PAID IN FULL', 'YOU OUTLIVED YOUR OWN INTEREST', 'gold', 3);
    Sound.win();
    setTimeout(() => { if (state === run) showEnd(true); }, 1650);
  }

  /* ----------------------------------------------------------------- waves */

  function addSpawner(kind, x, y, dur) {
    const s = { kind, x, y, t: 0, dur: dur || (kind === 'boss' ? 1.8 : 0.8) };
    const dx = x - view.cx, dy = y - view.cy;
    const d = Math.hypot(dx, dy);
    const max = view.R - 46 * view.k;
    if (d > max) { s.x = view.cx + dx / d * max; s.y = view.cy + dy / d * max; }
    state.spawners.push(s);
  }

  function makeEnemy(kind, x, y) {
    const base = ENEMY[kind];
    const e = {
      kind, x, y,
      hp: base.hp, maxHp: base.hp,
      r: base.r * view.k,
      speed: base.speed * view.k,
      dmg: base.dmg,
      color: base.color,
      score: base.score,
      kx: 0, ky: 0, flash: 0,
      spin: rand(TAU), spinDir: Math.random() < .5 ? -1 : 1,
      wob: rand(TAU), cd: rand(1.6, .5),
      wind: 0, lunge: 0, dir: rand(TAU),
      strafeDir: Math.random() < .5 ? -1 : 1,
      aimT: 0, aimAng: 0,
      behavior: 0, chargeT: 0, restT: 0,
      moveAng: 0,
      dead: false
    };
    if (kind === 'boss') {
      e.hp = e.maxHp = base.hp + state.collections * 40;
      e.orbAng = rand(TAU);
      e.nextAttack = 0;
      e.spiral = 0; e.spiralT = 0; e.spiralAng = 0;
      e.phase = 1;
      e.pending = 'ring';
    }
    if (kind === 'echo') {
      e.path = []; e.pathT = 0;
    }
    return e;
  }

  function spawnEnemy(kind, x, y) {
    const e = makeEnemy(kind, x, y);
    clampToArena(e, e.r + 6);
    state.enemies.push(e);
    ringFx(e.x, e.y, e.color, e.r * .4, e.r * 3.2, 2, .45);
    spawnBurst(e.x, e.y, e.color, kind === 'boss' ? 40 : 12, kind === 'boss' ? 300 : 160, 2);
    if (kind === 'boss') {
      state.bossAlive = true;
      el.bossHud.classList.add('on');
      state.shake = Math.max(state.shake, 14);
      Sound.boss();
      showToast('THE COLLECTOR HAS ENTERED THE ARENA', 'danger', 3);
    }
  }

  function spawnEchoFromDebt() {
    const p = state.player;
    const past = state.path.slice(-Math.floor(5.5 / PATH_DT)).map(pt => ({ x: pt.x, y: pt.y, angle: pt.angle }));
    let sx = p.x - 160 * view.k, sy = p.y - 120 * view.k;
    if (past.length > 8) {
      sx = past[0].x; sy = past[0].y;
    }
    if (Math.hypot(sx - p.x, sy - p.y) < 140 * view.k) {
      const a = rand(TAU);
      sx = p.x + Math.cos(a) * 180 * view.k;
      sy = p.y + Math.sin(a) * 180 * view.k;
    }
    const e = makeEnemy('echo', sx, sy);
    e.path = past;
    e.pathT = 0;
    clampToArena(e, e.r + 8);
    state.enemies.push(e);
    ringFx(e.x, e.y, COLOR.red, 4, 110 * view.k, 3, .7);
    ringFx(e.x, e.y, COLOR.white, 2, 60 * view.k, 1.5, .45);
    spawnBurst(e.x, e.y, COLOR.red, 26, 250, 2.5);
    showText(e.x, e.y - 32, 'ECHO', COLOR.red, 15);
    Sound.echo();
  }

  function updateWaves(dt) {
    if (state.wavePhase === 'intermission') {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) startWave(state.wave + 1);
      return;
    }
    if (state.wavePhase !== 'active') return;

    const cfg = WAVES[state.wave];
    state.spawnTimer -= dt;
    if (state.spawnQueue.length && state.spawnTimer <= 0) {
      const kind = state.spawnQueue.shift();
      const pt = spawnPoint();
      addSpawner(kind, pt.x, pt.y, kind === 'brute' ? 1.0 : 0.82);
      state.spawnTimer = cfg.spacing * rand(1.2, .82);
    }

    if (!state.spawnQueue.length && !state.spawners.length && !state.enemies.length) {
      if (state.bossDefeated || state.wave >= WAVES.length - 1) {
        win();
      } else {
        state.wavePhase = 'intermission';
        state.waveTimer = 2.5;
        const p = state.player;
        p.hp = Math.min(p.maxHp, p.hp + 10);
        state.debt = Math.max(0, state.debt - 0.8);
        showToast('WAVE CLEARED · +10 VITALITY · −0.8s DEBT', 'gold', 2.6);
        ringFx(p.x, p.y, COLOR.green, 12, 130 * view.k, 3, .6);
        Sound.heal();
      }
    }
  }

  function updateSpawners(dt) {
    for (const s of state.spawners) {
      s.t += dt;
      if (s.t >= s.dur) {
        spawnEnemy(s.kind, s.x, s.y);
        s.done = true;
      }
    }
    state.spawners = state.spawners.filter(s => !s.done);
  }

  /* ---------------------------------------------------------------- enemies */

  function updateEnemies(dt, realDt) {
    const p = state.player;
    const speedMul = 1 + (state.debt / MAX_DEBT) * 0.5 + (state.surge > 0 ? 0.55 : 0);

    for (const e of state.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - realDt);
      e.spin += dt * (e.kind === 'boss' ? .5 : 2.2) * e.spinDir;
      e.kx *= Math.pow(0.004, dt);
      e.ky *= Math.pow(0.004, dt);
      e.x += e.kx * dt;
      e.y += e.ky * dt;

      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx);

      if (e.kind === 'husk') {
        e.wob += dt * 5;
        e.cd -= dt;
        if (e.lunge > 0) {
          e.lunge -= dt;
          e.x += Math.cos(e.dir) * e.speed * 2.7 * speedMul * dt;
          e.y += Math.sin(e.dir) * e.speed * 2.7 * speedMul * dt;
          if (Math.random() < dt * 30) {
            spawnParticle({
              kind: 'spark', x: e.x, y: e.y, vx: -Math.cos(e.dir) * 80, vy: -Math.sin(e.dir) * 80,
              r: 1.4, len: 8, color: e.color, life: .3, max: .3, drag: 2
            });
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          if (e.wind <= 0) {
            e.lunge = 0.3;
            e.dir = Math.atan2(p.y - e.y, p.x - e.x);
            ringFx(e.x, e.y, e.color, 2, 38 * view.k, 1.5, .22);
          }
        } else {
          const moveAng = ang + Math.sin(e.wob) * .3;
          const sp = e.speed * speedMul;
          e.x += Math.cos(moveAng) * sp * dt;
          e.y += Math.sin(moveAng) * sp * dt;
          if (e.cd <= 0 && dist < 215 * view.k) {
            e.wind = .27;
            e.cd = 2.0 + rand(.8);
          }
        }
      } else if (e.kind === 'spitter') {
        e.cd -= dt;
        const desired = 248 * view.k;
        let moveAng, sp;
        if (dist < desired * .78) { moveAng = ang + Math.PI; sp = e.speed * 1.25; }
        else if (dist > desired * 1.18) { moveAng = ang; sp = e.speed; }
        else { moveAng = ang + e.strafeDir * Math.PI / 2; sp = e.speed * .6; }
        e.x += Math.cos(moveAng) * sp * speedMul * dt;
        e.y += Math.sin(moveAng) * sp * speedMul * dt;
        if (e.aimT > 0) {
          e.aimT -= dt;
          if (e.aimT <= 0) {
            fireBullet(e.x, e.y, e.aimAng, 195 * view.k, 9, COLOR.amber, 6);
            Sound.shoot();
          }
        } else if (e.cd <= 0 && dist < 690 * view.k) {
          e.aimT = .46;
          e.aimAng = ang;
          e.cd = 2.15 + rand(1.1);
        }
      } else if (e.kind === 'brute') {
        e.cd -= dt;
        if (e.behavior === 0) {
          const moveAng = ang + Math.sin(e.wob) * .14;
          const sp = e.speed * speedMul;
          e.x += Math.cos(moveAng) * sp * dt;
          e.y += Math.sin(moveAng) * sp * dt;
          if (e.cd <= 0 && dist < 330 * view.k) {
            e.behavior = 1;
            e.wind = .68;
            e.dir = ang;
          }
        } else if (e.behavior === 1) {
          e.wind -= dt;
          if (e.wind <= 0) {
            e.behavior = 2;
            e.chargeT = .52;
            e.dir = Math.atan2(p.y - e.y, p.x - e.x);
            ringFx(e.x, e.y, e.color, 4, 46 * view.k, 2, .3);
            Sound.dash();
          }
        } else if (e.behavior === 2) {
          e.chargeT -= dt;
          e.x += Math.cos(e.dir) * 540 * view.k * dt;
          e.y += Math.sin(e.dir) * 540 * view.k * dt;
          if (Math.random() < dt * 40) {
            spawnParticle({
              kind: 'dot', x: e.x, y: e.y, vx: rand(30, -30), vy: rand(30, -30),
              r: rand(3, 1), color: e.color, life: .4, max: .4, drag: 2
            });
          }
          if (e.chargeT <= 0) { e.behavior = 3; e.restT = .85; }
        } else {
          e.restT -= dt;
          if (e.restT <= 0) { e.behavior = 0; e.cd = 1.0; }
        }
      } else if (e.kind === 'echo') {
        e.cd -= dt;
        if (e.path && e.path.length > 6 && e.pathT < (e.path.length - 1) * PATH_DT) {
          e.pathT += dt * 1.4;
          const idx = Math.min(e.path.length - 1, Math.floor(e.pathT / PATH_DT));
          const tgt = e.path[idx];
          e.moveAng = Math.atan2(tgt.y - e.y, tgt.x - e.x);
          e.x = damp(e.x, tgt.x, 11, dt);
          e.y = damp(e.y, tgt.y, 11, dt);
        } else {
          e.moveAng = ang;
          e.x += Math.cos(ang) * e.speed * .95 * speedMul * dt;
          e.y += Math.sin(ang) * e.speed * .95 * speedMul * dt;
        }
        if (Math.random() < dt * 22) {
          spawnParticle({
            kind: 'dot', x: e.x + rand(8, -8), y: e.y + rand(8, -8),
            vx: rand(20, -20), vy: rand(20, -20), r: rand(2.6, .8),
            color: COLOR.red, life: .45, max: .45, drag: 2
          });
        }
        if (e.aimT > 0) {
          e.aimT -= dt;
          if (e.aimT <= 0) {
            fireBullet(e.x, e.y, e.aimAng, 270 * view.k, 14, '#ff7c93', 8, 'echo');
            Sound.shoot();
          }
        } else if (e.cd <= 0 && dist < 760 * view.k) {
          e.aimT = .34;
          e.aimAng = ang;
          e.cd = 1.65;
        }
      } else if (e.kind === 'boss') {
        updateBoss(e, dt, speedMul, dist, ang, realDt);
      }

      clampToArena(e, e.r + 6);

      // Contact damage
      if (dist < e.r + p.r) {
        const contact = e.kind === 'brute' && e.behavior === 2 ? e.dmg + 4 : e.dmg;
        hurtPlayer(contact, e.x, e.y);
      }
    }

    state.enemies = state.enemies.filter(e => !e.dead);
  }

  function updateBoss(e, dt, speedMul, dist, ang, realDt) {
    const p = state.player;
    e.orbAng += dt * 0.26 * e.spinDir;
    const tx = view.cx + Math.cos(e.orbAng) * view.R * 0.42;
    const ty = view.cy + Math.sin(e.orbAng) * view.R * 0.3;
    e.x = damp(e.x, tx, 1.7, dt);
    e.y = damp(e.y, ty, 1.7, dt);

    if (e.phase === 1 && e.hp < e.maxHp * 0.5) {
      e.phase = 2;
      e.cd = Math.min(e.cd, .5);
      ringFx(e.x, e.y, COLOR.amber, 20, view.R * .9, 4, .7);
      showToast('THE COLLECTOR ACCELERATES · PHASE II', 'danger', 2.6);
      state.shake = Math.max(state.shake, 12);
      Sound.boss();
    }

    e.cd -= dt;

    if (e.spiral > 0) {
      e.spiral -= dt;
      e.spiralT -= dt;
      if (e.spiralT <= 0) {
        e.spiralT = .085;
        fireBullet(e.x, e.y, e.spiralAng, 175 * view.k, 10, '#ff6b7f', 6);
        fireBullet(e.x, e.y, e.spiralAng + Math.PI, 175 * view.k, 10, '#ffb84d', 6);
        e.spiralAng += .38;
      }
    }

    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) executeBossAttack(e);
    } else if (e.cd <= 0 && e.spiral <= 0) {
      const options = e.phase === 2
        ? ['ring', 'fan', 'summon', 'spiral']
        : ['ring', 'fan', 'summon'];
      e.pending = pick(options);
      e.wind = e.phase === 2 ? .42 : .58;
    }

    if (Math.random() < realDt * 8) {
      spawnParticle({
        kind: 'dot', x: e.x + rand(40, -40), y: e.y + rand(40, -40),
        vx: rand(18, -18), vy: rand(-30, -6), r: rand(2.4, .8),
        color: e.phase === 2 ? COLOR.amber : COLOR.red, life: .7, max: .7, drag: .8
      });
    }
  }

  function executeBossAttack(e) {
    const p = state.player;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    const type = e.pending;

    if (type === 'ring') {
      const n = e.phase === 2 ? 22 : 17;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + e.orbAng;
        fireBullet(e.x, e.y, a, (e.phase === 2 ? 185 : 165) * view.k, 11, '#ff6b7f', 7);
      }
      ringFx(e.x, e.y, COLOR.red, 10, view.R * .5, 2, .4);
      Sound.shoot();
    } else if (type === 'fan') {
      for (let i = -2; i <= 2; i++) {
        fireBullet(e.x, e.y, ang + i * .17, 230 * view.k, 12, '#ffb84d', 6);
      }
      Sound.shoot();
    } else if (type === 'summon') {
      for (let i = 0; i < 2; i++) {
        const a = rand(TAU);
        addSpawner(i === 0 ? 'husk' : 'spitter', e.x + Math.cos(a) * 100 * view.k, e.y + Math.sin(a) * 100 * view.k, .7);
      }
      ringFx(e.x, e.y, COLOR.amber, 6, 80 * view.k, 2.5, .5);
      Sound.echo();
    } else {
      e.spiral = 1.55;
      e.spiralT = 0;
      e.spiralAng = rand(TAU);
      Sound.shoot();
    }

    e.cd = e.phase === 2 ? 1.75 : 2.55;
  }

  function fireBullet(x, y, ang, speed, dmg, color, r = 6, type = 'enemy') {
    state.projectiles.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: r * view.k,
      dmg, color, type,
      life: 9, spin: rand(TAU)
    });
  }

  function updateProjectiles(dt) {
    const p = state.player;
    for (const b of state.projectiles) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      b.spin += dt * 8;
      if (Math.random() < dt * 16) {
        spawnParticle({
          kind: 'dot', x: b.x, y: b.y, vx: -b.vx * .06, vy: -b.vy * .06,
          r: b.r * .35, color: b.color, life: .32, max: .32, drag: 1
        });
      }
      if (Math.hypot(b.x - view.cx, b.y - view.cy) > view.R + 70) { b.life = 0; continue; }
      if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r) {
        b.life = 0;
        if (p.invuln <= 0) {
          hurtPlayer(b.dmg, b.x, b.y);
          spawnBurst(b.x, b.y, b.color, 8, 140, 2);
        }
      }
    }
    state.projectiles = state.projectiles.filter(b => b.life > 0);
  }

  /* ------------------------------------------------------------------ motes */

  function spawnMote(x, y, type) {
    state.motes.push({
      x, y,
      vx: rand(150, -150),
      vy: rand(150, -150),
      r: type === 'heal' ? 7 : 5,
      type,
      spin: rand(TAU),
      life: 20
    });
    if (state.motes.length > 90) state.motes.shift();
  }

  function updateMotes(dt) {
    const p = state.player;
    for (const m of state.motes) {
      m.life -= dt;
      m.spin += dt * 3;
      const dx = p.x - m.x, dy = p.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 205 * view.k) {
        m.vx += dx / d * 980 * dt;
        m.vy += dy / d * 980 * dt;
      }
      m.vx *= Math.exp(-1.6 * dt);
      m.vy *= Math.exp(-1.6 * dt);
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (d < p.r + 13 * view.k) {
        m.life = 0;
        if (m.type === 'heal') {
          p.hp = Math.min(p.maxHp, p.hp + 14);
          state.score += 30;
          showText(m.x, m.y - 8, '+14', COLOR.green, 12);
          Sound.heal();
        } else {
          state.score += Math.round(25 * state.combo);
          state.debt = Math.max(0, state.debt - .08);
          p.hp = Math.min(p.maxHp, p.hp + 1);
          Sound.pickup();
        }
        ringFx(m.x, m.y, m.type === 'heal' ? COLOR.green : COLOR.cyan, 2, 20, 1.5, .25);
        spawnBurst(m.x, m.y, m.type === 'heal' ? COLOR.green : COLOR.cyan, 4, 90, 1.5);
      }
    }
    state.motes = state.motes.filter(m => m.life > 0);
  }

  /* ------------------------------------------------------------------- fx */

  function spawnParticle(p) {
    if (state.particles.length > 850) state.particles.shift();
    if (p.max === undefined) p.max = p.life;
    state.particles.push(p);
  }

  function spawnBurst(x, y, color, count, speed, size) {
    for (let i = 0; i < count; i++) {
      const a = rand(TAU);
      const s = rand(speed, speed * .12);
      spawnParticle({
        kind: Math.random() < .45 ? 'spark' : 'dot',
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: rand(size, size * .3),
        len: rand(12, 3),
        color,
        life: rand(.75, .2),
        drag: rand(2.8, 1)
      });
    }
  }

  function ringFx(x, y, color, r0, r1, width, life) {
    spawnParticle({
      kind: 'ring', x, y, r0, r1, width, color,
      life, max: life, vx: 0, vy: 0, drag: 0
    });
  }

  function showText(x, y, text, color, size = 12) {
    state.texts.push({ x, y, text, color, size, life: .85, max: .85, vy: -34 });
    if (state.texts.length > 46) state.texts.shift();
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      if (p.kind === 'ring') continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const drag = p.drag || 0;
      if (drag) {
        const f = Math.exp(-drag * dt);
        p.vx *= f; p.vy *= f;
      }
    }
    state.particles = state.particles.filter(p => p.life > 0);
  }

  function updateTexts(dt) {
    for (const t of state.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= Math.exp(-2 * dt);
    }
    state.texts = state.texts.filter(t => t.life > 0);
  }

  /* --------------------------------------------------------------- render */

  const glowCache = new Map();
  function glowSprite(color) {
    let c = glowCache.get(color);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.13, rgba(color, 0.8));
    grad.addColorStop(0.42, rgba(color, 0.2));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    glowCache.set(color, c);
    return c;
  }

  function drawGlow(x, y, size, color, alpha) {
    const s = glowSprite(color);
    ctx.globalAlpha = alpha;
    ctx.drawImage(s, x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = 1;
  }

  function drawBackground(st) {
    const { w, h } = view;
    const g = ctx.createRadialGradient(st.cx, st.cy, 0, st.cx, st.cy, Math.max(w, h) * .78);
    g.addColorStop(0, '#0b1628');
    g.addColorStop(.42, '#060c17');
    g.addColorStop(.78, '#04070f');
    g.addColorStop(1, '#020307');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // cool horizon wash
    const hz = ctx.createLinearGradient(0, st.cy - st.R, 0, st.cy + st.R);
    hz.addColorStop(0, 'rgba(30,120,170,0)');
    hz.addColorStop(.5, 'rgba(30,120,170,0.045)');
    hz.addColorStop(1, 'rgba(255,90,140,0.02)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    for (const d of dust) {
      const tw = .3 + .7 * (0.5 + 0.5 * Math.sin(state.rt * .7 + d.ph));
      const s = d.s * (0.7 + d.z * .7) * (0.75 + tw * .5);
      ctx.rect(d.x, d.y, s, s);
      d.y -= d.z * 5 * .016;
      if (d.y < -4) { d.y = view.h + 4; d.x = Math.random() * view.w; }
    }
    ctx.fillStyle = 'rgba(130,220,255,.09)';
    ctx.fill();
  }

  function drawArena(st) {
    const { cx, cy, R } = st;
    ctx.save();
    ctx.translate(cx, cy);

    const floor = ctx.createRadialGradient(0, 0, R * .03, 0, 0, R);
    floor.addColorStop(0, 'rgba(30,92,126,.22)');
    floor.addColorStop(.55, 'rgba(13,40,64,.16)');
    floor.addColorStop(.9, 'rgba(7,16,30,.1)');
    floor.addColorStop(1, 'rgba(4,8,18,0)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = floor;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R - 1, 0, TAU);
    ctx.clip();
    const step = 58 * view.k;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(88,210,240,.055)';
    ctx.beginPath();
    for (let x = -R; x <= R; x += step) {
      ctx.moveTo(x, -R); ctx.lineTo(x, R);
    }
    for (let y = -R; y <= R; y += step) {
      ctx.moveTo(-R, y); ctx.lineTo(R, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(97,241,255,.04)';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      ctx.moveTo(Math.cos(a) * R * .3, Math.sin(a) * R * .3);
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    ctx.stroke();
    ctx.restore();

    // concentric rings
    for (const rr of [.33, .62, .84]) {
      ctx.beginPath();
      ctx.arc(0, 0, R * rr, 0, TAU);
      ctx.setLineDash(rr === .62 ? [3, 18] : []);
      ctx.strokeStyle = rr === .62 ? 'rgba(97,241,255,.1)' : 'rgba(97,241,255,.055)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // clock ticks (batched into two paths)
    ctx.beginPath();
    for (let i = 0; i < 72; i++) {
      if (i % 6 === 0) continue;
      const a = i / 72 * TAU - Math.PI / 2;
      ctx.moveTo(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3));
      ctx.lineTo(Math.cos(a) * (R - 10), Math.sin(a) * (R - 10));
    }
    ctx.strokeStyle = 'rgba(100,200,230,.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < 72; i += 6) {
      const a = i / 72 * TAU - Math.PI / 2;
      ctx.moveTo(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3));
      ctx.lineTo(Math.cos(a) * (R - 19), Math.sin(a) * (R - 19));
    }
    ctx.strokeStyle = 'rgba(170,245,255,.42)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // roman numerals
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.font = Math.max(6, R * .033) + 'px "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(140,230,255,.22)';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2;
      ctx.fillText(numerals[i], Math.cos(a) * (R - 34), Math.sin(a) * (R - 34));
    }

    // faint clock hands
    const hand = state.rt * .06;
    ctx.strokeStyle = 'rgba(120,220,255,.07)';
    ctx.lineWidth = Math.max(1.5, R * .008);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hand) * R * .55, Math.sin(hand) * R * .55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hand * 12 + 1.2) * R * .76, Math.sin(hand * 12 + 1.2) * R * .76); ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.strokeStyle = 'rgba(97,241,255,.5)';
    ctx.lineWidth = 1.3;
    ctx.shadowColor = COLOR.cyan;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(0, 0, R + 5, 0, TAU);
    ctx.strokeStyle = 'rgba(97,241,255,.09)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // rotating outer dashes
    ctx.save();
    ctx.rotate(state.rt * .035);
    ctx.beginPath();
    ctx.arc(0, 0, R + 13, 0, TAU);
    ctx.setLineDash([2, 22]);
    ctx.strokeStyle = 'rgba(97,241,255,.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    // debt ring
    const frac = clamp((state.debt || 0) / MAX_DEBT, 0, 1);
    const rr = R + 22;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, TAU);
    ctx.strokeStyle = 'rgba(255,184,77,.09)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (rr - 4), Math.sin(a) * (rr - 4));
      ctx.lineTo(Math.cos(a) * (rr + 4), Math.sin(a) * (rr + 4));
      ctx.strokeStyle = 'rgba(255,184,77,.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (frac > 0.004) {
      const pulse = 0.7 + 0.3 * Math.sin(state.rt * (frac > .66 ? 12 : 4));
      ctx.beginPath();
      ctx.arc(0, 0, rr, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
      ctx.strokeStyle = frac > .66 ? COLOR.red : COLOR.amber;
      ctx.lineWidth = 3;
      ctx.globalAlpha = .55 + .4 * pulse;
      ctx.shadowColor = frac > .66 ? COLOR.red : COLOR.amber;
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // center sigil
    ctx.globalAlpha = .2;
    ctx.strokeStyle = COLOR.cyan;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * view.k, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22 * view.k, 0); ctx.lineTo(22 * view.k, 0);
    ctx.moveTo(0, -22 * view.k); ctx.lineTo(0, 22 * view.k);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function drawSpawners() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of state.spawners) {
      const prog = clamp(s.t / s.dur, 0, 1);
      const col = s.kind === 'boss' ? COLOR.red : s.kind === 'brute' ? COLOR.red : s.kind === 'spitter' ? COLOR.amber : COLOR.pink;
      drawGlow(s.x, s.y, (s.kind === 'boss' ? 300 : 120) * view.k, col, .16 + prog * .2);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.t * (s.kind === 'boss' ? 1.2 : 2.2));
      const rad = (s.kind === 'boss' ? 70 : 26) * view.k * (1 - prog * .35);
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, TAU);
      ctx.setLineDash([3, 9]);
      ctx.strokeStyle = rgba(col, .35 + prog * .5);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(0, 0, rad * .55, 0, TAU);
      ctx.strokeStyle = rgba(col, .2 + prog * .6);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU;
        const x = Math.cos(a) * rad * .38, y = Math.sin(a) * rad * .38;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = rgba(col, .12 + prog * .4);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * (1.2 + Math.sin(state.rt * 5 + prog * 8) * .1), 0, TAU);
      ctx.strokeStyle = rgba(col, .16 * (1 - prog));
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMotes() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const m of state.motes) {
      const col = m.type === 'heal' ? COLOR.green : COLOR.cyan;
      const pulse = .7 + .3 * Math.sin(m.spin * 2);
      drawGlow(m.x, m.y, 34 * view.k * pulse, col, .6);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.spin);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU;
        const rr = i % 2 === 0 ? m.r * 1.5 * view.k : m.r * .55 * view.k;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEnemies() {
    // echo paths first
    ctx.save();
    for (const e of state.enemies) {
      if (e.kind !== 'echo' || !e.path || e.path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(e.path[0].x, e.path[0].y);
      for (let i = 1; i < e.path.length; i++) ctx.lineTo(e.path[i].x, e.path[i].y);
      ctx.strokeStyle = 'rgba(255,63,95,.11)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    for (const e of state.enemies) {
      if (e.dead) continue;
      const drawColor = e.flash > 0 ? COLOR.white : e.color;
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.kind === 'boss') {
        drawBoss(e, drawColor);
      } else {
        drawGlow(0, 0, e.r * 5.4, e.flash > 0 ? COLOR.white : e.color, e.kind === 'echo' ? .35 : .25);

        if (e.kind === 'husk') drawHusk(e, drawColor);
        else if (e.kind === 'spitter') drawSpitter(e, drawColor);
        else if (e.kind === 'brute') drawBrute(e, drawColor);
        else if (e.kind === 'echo') drawEcho(e, drawColor);

        if (e.wind > 0 && e.kind !== 'echo') {
          const rate = e.kind === 'brute' ? .68 : .27;
          const t = 1 - clamp(e.wind / rate, 0, 1);
          ctx.beginPath();
          ctx.arc(0, 0, e.r + 6 + t * (e.kind === 'brute' ? 54 : 22) * view.k, 0, TAU);
          ctx.strokeStyle = rgba(e.kind === 'brute' ? COLOR.red : COLOR.amberHot, .5 * (1 - t));
          ctx.lineWidth = 1.5;
          ctx.stroke();
          if (e.kind === 'brute') {
            ctx.beginPath();
            ctx.moveTo(Math.cos(e.dir) * e.r, Math.sin(e.dir) * e.r);
            ctx.lineTo(Math.cos(e.dir) * (e.r + 90 * view.k), Math.sin(e.dir) * (e.r + 90 * view.k));
            ctx.strokeStyle = 'rgba(255,63,95,.28)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      if (e.kind !== 'boss' && e.hp < e.maxHp) {
        const w = Math.max(24, e.r * 2.4);
        const y = e.y - e.r - 12;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(e.x - w / 2, y, w, 3);
        ctx.fillStyle = e.kind === 'echo' ? COLOR.red : e.color;
        ctx.fillRect(e.x - w / 2, y, w * clamp(e.hp / e.maxHp, 0, 1), 3);
      }
    }
  }

  function drawHusk(e, col) {
    ctx.save();
    ctx.rotate(e.spin);
    const r = e.r;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.45); ctx.lineTo(r * .8, 0); ctx.lineTo(0, r * 1.45); ctx.lineTo(-r * .8, 0);
    ctx.closePath();
    ctx.fillStyle = rgba(col, .14);
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * .9, 0); ctx.lineTo(r * .9, 0);
    ctx.strokeStyle = rgba(col, .55);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * .28, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * .55, 0, TAU);
    ctx.strokeStyle = rgba(col, .35);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpitter(e, col) {
    if (e.aimT > 0) {
      ctx.save();
      const t = clamp(1 - e.aimT / .46, 0, 1);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(e.aimAng) * 520 * view.k, e.y + Math.sin(e.aimAng) * 520 * view.k);
      ctx.strokeStyle = rgba(COLOR.amber, .06 + t * .16);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.save();
    ctx.rotate(e.spin);
    const r = e.r;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(col, .12);
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * .38, 0, TAU);
    ctx.fillStyle = rgba(col, .75);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * .85, 0, r * .14, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  function drawBrute(e, col) {
    ctx.save();
    if (e.behavior === 2) { ctx.globalAlpha = .95; }
    ctx.rotate(e.spin * .3);
    const r = e.r;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const rr = i % 2 === 0 ? r : r * .82;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(col, .13);
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.rotate(-e.spin * .6);
    ctx.beginPath();
    ctx.arc(0, 0, r * .52, 0, TAU);
    ctx.strokeStyle = rgba(col, .55);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * .32, 0); ctx.lineTo(r * .32, 0);
    ctx.moveTo(0, -r * .32); ctx.lineTo(0, r * .32);
    ctx.strokeStyle = rgba(COLOR.amberHot, .75);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawEcho(e, col) {
    ctx.save();
    for (let i = 3; i >= 1; i--) {
      const a = e.moveAng || e.spin;
      ctx.save();
      ctx.translate(-Math.cos(a) * i * 7, -Math.sin(a) * i * 7);
      ctx.rotate(a);
      ctx.globalAlpha = .09 * (4 - i);
      drawChevron(e.r, '#ffd9de', COLOR.red);
      ctx.restore();
    }
    ctx.rotate(e.moveAng || e.spin);
    drawChevron(e.r, '#ffe7ea', COLOR.red);
    ctx.globalAlpha = .7;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * .35, 0, TAU);
    ctx.fillStyle = COLOR.red;
    ctx.fill();
    ctx.restore();

    if (e.aimT > 0) {
      const t = clamp(1 - e.aimT / .34, 0, 1);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(e.aimAng) * 620 * view.k, e.y + Math.sin(e.aimAng) * 620 * view.k);
      ctx.strokeStyle = 'rgba(255,63,95,' + (.04 + t * .14) + ')';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawChevron(r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(r * 1.3, 0);
    ctx.lineTo(-r * .55, r * .62);
    ctx.lineTo(-r * .3, 0);
    ctx.lineTo(-r * .55, -r * .62);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawBoss(e, col) {
    const pulse = .5 + .5 * Math.sin(state.rt * (e.phase === 2 ? 8 : 4));
    drawGlow(0, 0, e.r * 5.5, e.phase === 2 ? COLOR.red : COLOR.amber, .3 + pulse * .1);
    ctx.save();
    ctx.rotate(e.spin);
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, TAU);
    ctx.fillStyle = 'rgba(20,6,12,.7)';
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.r * .82, Math.sin(a) * e.r * .82);
      ctx.lineTo(Math.cos(a) * e.r * 1.04, Math.sin(a) * e.r * 1.04);
      ctx.strokeStyle = rgba(col, .5);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, e.r * .8, 0, TAU);
    ctx.strokeStyle = rgba(COLOR.amber, .6);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // hands
    ctx.save();
    const h1 = state.rt * (e.phase === 2 ? .8 : .4);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(Math.cos(h1) * e.r * .58, Math.sin(h1) * e.r * .58);
    ctx.strokeStyle = rgba(COLOR.amber, .8);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(Math.cos(h1 * 3 + .6) * e.r * .36, Math.sin(h1 * 3 + .6) * e.r * .36);
    ctx.strokeStyle = rgba(COLOR.red, .9);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // eye
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r * .26, e.r * .17, 0, 0, TAU);
    ctx.fillStyle = e.flash > 0 ? '#fff' : COLOR.amberHot;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, e.r * .09, 0, TAU);
    ctx.fillStyle = '#2b0710';
    ctx.fill();

    // orbit shards
    for (let i = 0; i < 6; i++) {
      const a = e.spin * 1.7 + i / 6 * TAU;
      const rr = e.r * 1.36;
      ctx.save();
      ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -e.r * .11); ctx.lineTo(e.r * .12, 0); ctx.lineTo(0, e.r * .11); ctx.lineTo(-e.r * .12, 0);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? rgba(COLOR.red, .8) : rgba(COLOR.amber, .8);
      ctx.fill();
      ctx.restore();
    }

    if (e.wind > 0) {
      const t = 1 - clamp(e.wind / (e.phase === 2 ? .42 : .58), 0, 1);
      ctx.beginPath();
      ctx.arc(0, 0, e.r * (2.4 - t * .8), 0, TAU);
      ctx.strokeStyle = rgba(COLOR.amber, .2 + t * .35);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawProjectiles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of state.projectiles) {
      const a = Math.atan2(b.vy, b.vx);
      const speed = Math.hypot(b.vx, b.vy) || 1;
      ctx.save();
      ctx.translate(b.x, b.y);
      drawGlow(0, 0, b.r * 6, b.color, .6);
      ctx.beginPath();
      ctx.moveTo(-b.vx / speed * b.r * 4.5, -b.vy / speed * b.r * 4.5);
      ctx.lineTo(b.x * 0, 0);
      ctx.strokeStyle = rgba(b.color, .25);
      ctx.lineWidth = b.r * .8;
      ctx.stroke();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(b.r * 1.7, 0); ctx.lineTo(0, b.r * .8); ctx.lineTo(-b.r * 1.2, 0); ctx.lineTo(0, -b.r * .8);
      ctx.closePath();
      ctx.fillStyle = rgba(b.color, .92);
      ctx.fill();
      ctx.strokeStyle = b.type === 'echo' ? '#ffe7ea' : 'rgba(255,244,230,.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, b.r * .32, 0, TAU);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPlayer(menu = false) {
    const p = state.player;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const t of p.trail) {
      const a = clamp(t.life / t.max, 0, 1);
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.a);
      ctx.globalAlpha = a * .24;
      drawChevron(p.r * .9, 'rgba(97,241,255,.3)', COLOR.cyan);
      ctx.restore();
    }

    drawGlow(p.x, p.y, (menu ? 170 : 108) * view.k, p.invuln > 0 ? COLOR.red : COLOR.cyan, menu ? .34 : .42);
    if (state.slowBlend > .04) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (2.4 + Math.sin(state.rt * 8) * .15), 0, TAU);
      ctx.strokeStyle = rgba(COLOR.cyan, .12 + state.slowBlend * .18);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (p.invuln > 0 && !menu && Math.floor(state.rt * 26) % 2 === 0) ctx.globalAlpha = .4;

    // tail
    ctx.beginPath();
    ctx.moveTo(-p.r * .6, 0);
    ctx.lineTo(-p.r * 2.4, Math.sin(state.rt * 8) * 3);
    ctx.strokeStyle = rgba(COLOR.cyan, .38);
    ctx.lineWidth = 1.3;
    ctx.stroke();

    drawChevron(p.r * 1.15, '#f2feff', p.invuln > 0 ? COLOR.red : COLOR.cyan);
    ctx.beginPath();
    ctx.arc(p.r * .18, 0, p.r * .24, 0, TAU);
    ctx.fillStyle = COLOR.cyanHot;
    ctx.fill();

    if (p.dashCd > 0 && !menu) {
      const t = 1 - p.dashCd / 1.15;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 2, -Math.PI / 2, -Math.PI / 2 + TAU * t);
      ctx.strokeStyle = rgba(COLOR.cyan, .25);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSlash() {
    const p = state.player;
    const s = p.slash;
    if (!s) return;
    const t = clamp(s.t / s.dur, 0, 1);
    const e = easeOut(t);
    const start = s.ang - s.half;
    const sweep = s.half * 2 * e;
    const col = s.heavy ? COLOR.amberHot : COLOR.cyan;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalCompositeOperation = 'lighter';

    const inner = p.r * 1.2;
    const grad = ctx.createRadialGradient(0, 0, inner, 0, 0, s.reach);
    grad.addColorStop(0, rgba(col, .015));
    grad.addColorStop(.55, rgba(col, .055));
    grad.addColorStop(1, rgba(col, .17 * (1 - t * .55)));
    ctx.beginPath();
    ctx.moveTo(Math.cos(start) * inner, Math.sin(start) * inner);
    ctx.arc(0, 0, s.reach, start, start + sweep);
    ctx.arc(0, 0, inner, start + sweep, start, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, s.reach * (.32 + i * .24), start, start + sweep);
      ctx.strokeStyle = rgba(col, .07 * (1 - t));
      ctx.lineWidth = (s.heavy ? 12 : 8) * (1 - t) + 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, s.reach * .94, start, start + sweep);
    ctx.strokeStyle = rgba(col, .9 * (1 - t * .55));
    ctx.lineWidth = s.heavy ? 4 : 2.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20;
    ctx.stroke();

    const lead = start + sweep;
    ctx.beginPath();
    ctx.moveTo(Math.cos(lead) * inner, Math.sin(lead) * inner);
    ctx.lineTo(Math.cos(lead) * s.reach, Math.sin(lead) * s.reach);
    ctx.strokeStyle = rgba('#ffffff', .85 * (1 - t));
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawGlow(Math.cos(lead) * s.reach, Math.sin(lead) * s.reach, (s.heavy ? 46 : 30) * view.k, col, .5 * (1 - t));
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of state.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.life <= 0) continue;
      if (p.kind === 'ring') {
        const t = easeOut(1 - a);
        const rr = lerp(p.r0, p.r1, t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, rr), 0, TAU);
        ctx.strokeStyle = rgba(p.color, a * .55);
        ctx.lineWidth = Math.max(.5, p.width * (.4 + a * .6));
        ctx.stroke();
      } else if (p.kind === 'spark') {
        const sp = Math.hypot(p.vx, p.vy) || 1;
        const len = (p.len || 6) * a;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx / sp * len, p.y - p.vy / sp * len);
        ctx.strokeStyle = rgba(p.color, a * .85);
        ctx.lineWidth = Math.max(.6, p.r * a);
        ctx.stroke();
      } else {
        if (p.r > 2) drawGlow(p.x, p.y, p.r * 7, p.color, a * .35);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(.4, p.r * (.5 + a * .5)), 0, TAU);
        ctx.fillStyle = rgba(p.color, a * .85);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawTexts() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of state.texts) {
      const a = clamp(t.life / t.max * 1.6, 0, 1);
      ctx.font = '600 ' + t.size + 'px "SFMono-Regular", Consolas, monospace';
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(3,5,10,.7)';
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawMenuGhosts(st) {
    const { cx, cy, R } = st;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const a = state.rt * .1 + i / 3 * TAU;
      const x = cx + Math.cos(a) * R * .62;
      const y = cy + Math.sin(a) * R * .45;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2);
      ctx.globalAlpha = .13;
      drawChevron(12 * view.k, 'rgba(255,217,222,.5)', COLOR.red);
      ctx.restore();
      ctx.globalAlpha = .1;
      drawGlow(x, y, 80 * view.k, COLOR.red, .14);
    }
    ctx.restore();
  }

  function drawSlowmo(st) {
    const b = state.slowBlend;
    if (b < .03) return;
    const p = state.player;
    ctx.save();
    ctx.fillStyle = 'rgba(60,205,245,' + (b * .03) + ')';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ph = (state.rt * .55 + i / 3) % 1;
      const rr = 36 * view.k + ph * Math.min(330 * view.k, view.R * .9);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, TAU);
      ctx.strokeStyle = 'rgba(150,245,255,' + ((1 - ph) * .09 * b) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(97,241,255,' + (b * .32) + ')';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = state.rt * .7 + i / 6 * TAU;
      const r0 = view.R * .55, r1 = view.R * .95;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0);
      ctx.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
      ctx.globalAlpha = b * .035;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawReticle() {
    if (state.mode !== 'playing' || !input.mouse.active || input.touch) return;
    const x = input.mouse.x, y = input.mouse.y;
    const p = state.player;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(97,241,255,.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * p.r * 1.8, p.y + Math.sin(p.angle) * p.r * 1.8);
    ctx.lineTo(p.x + Math.cos(p.angle) * p.r * 7.2, p.y + Math.sin(p.angle) * p.r * 7.2);
    ctx.stroke();

    ctx.translate(x, y);
    ctx.rotate(state.rt * .9);
    ctx.strokeStyle = 'rgba(180,250,255,.8)';
    ctx.lineWidth = 1.2;
    const r = 11;
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(0, 0, r, a - .25, a + .25);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, TAU);
    ctx.fillStyle = COLOR.cyanHot;
    ctx.fill();
    ctx.restore();
  }

  function render() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    const st = stageInfo();
    drawBackground(st);

    const shake = state.shake;
    const sx = shake > .1 ? rand(shake, -shake) : 0;
    const sy = shake > .1 ? rand(shake, -shake) : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawArena(st);

    if (st.menu) {
      drawMenuGhosts(st);
      drawPlayer(true);
      drawParticles();
    } else {
      drawSpawners();
      drawMotes();
      drawEnemies();
      drawProjectiles();
      drawPlayer(false);
      drawSlash();
      drawParticles();
      drawTexts();
    }
    ctx.restore();

    if (state.flash > .005) {
      ctx.fillStyle = 'rgba(' + state.flashColor + ',' + (state.flash * .55) + ')';
      ctx.fillRect(0, 0, view.w, view.h);
    }

    drawSlowmo(st);
    drawReticle();
  }

  /* ------------------------------------------------------------------ loop */

  function updateMenu(dt) {
    const p = state.player;
    p.x = view.menuCx;
    p.y = view.menuCy;
    p.angle = -Math.PI / 2 + Math.sin(state.rt * .32) * .32;
    state.time += dt * .3;
    if (state.particles.length < 26 && Math.random() < dt * 5) {
      const a = rand(TAU), d = rand(view.menuR * .9, view.menuR * .2);
      spawnParticle({
        kind: Math.random() < .25 ? 'spark' : 'dot',
        x: view.menuCx + Math.cos(a) * d,
        y: view.menuCy + Math.sin(a) * d,
        vx: rand(8, -8), vy: rand(-16, -2),
        r: rand(2.2, .5), len: rand(8, 2),
        color: Math.random() < .15 ? COLOR.amber : COLOR.cyan,
        life: rand(3, 1), max: 3, drag: .4
      });
    }
    updateParticles(dt * .8);
    updateTexts(dt);
    state.flash = Math.max(0, state.flash - dt * 2);
    state.shake = damp(state.shake, 0, 6, dt);
    setAtmosphere();
  }

  function update(dt) {
    state.rt += dt;

    if (state.mode === 'menu') {
      updateMenu(dt);
      return;
    }
    if (state.mode === 'paused') return;

    if (state.mode === 'playing') {
      let sdt = dt;
      if (state.hitstop > 0) {
        state.hitstop -= dt;
        sdt *= 0.16;
      }

      updateTime(dt);
      const wdt = sdt * clamp(state.timeScale, 0.05, 1.4);
      state.time += wdt;

      updatePlayer(sdt);
      updateWaves(sdt);
      updateSpawners(wdt);
      updateEnemies(wdt, sdt);
      updateProjectiles(wdt);
      updateMotes(wdt);
      updateParticles(wdt);
      updateTexts(dt);

      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.comboTimer = 0;
        state.combo = 1;
      }
      updateHud(dt);
    } else {
      state.time += dt * .25;
      state.slowBlend = damp(state.slowBlend, 0, 3, dt);
      updateParticles(dt * .6);
      updateTexts(dt);
      updateHud(dt);
    }

    state.flash = Math.max(0, state.flash - dt * 2.1);
    state.shake = damp(state.shake, 0, 6, dt);
    setAtmosphere();
  }

  function setAtmosphere() {
    const danger = state.mode === 'menu' ? 0 : clamp(state.debt / MAX_DEBT * .68 + (state.flashColor === '255,63,95' ? state.flash * .25 : 0), 0, 1);
    app.style.setProperty('--danger', danger.toFixed(3));
    app.style.setProperty('--slow', (state.slowBlend * .95).toFixed(3));
  }

  /* ------------------------------------------------------------------- hud */

  function updateHud(dt) {
    state.hudAcc += dt;
    if (state.hudAcc < 0.07) return;
    state.hudAcc = 0;

    const p = state.player;
    const hp = clamp(p.hp / p.maxHp, 0, 1);
    el.hpFill.style.width = (hp * 100).toFixed(1) + '%';
    el.hpFill.classList.toggle('low', hp < .35);
    el.hpNum.textContent = Math.ceil(p.hp);

    if (p.dashCd > 0) {
      el.dashState.textContent = 'DASH ' + p.dashCd.toFixed(1) + 's';
      el.dashState.classList.remove('ready');
    } else {
      el.dashState.textContent = 'DASH READY';
      el.dashState.classList.add('ready');
    }

    el.waveNum.textContent = pad(state.wave + 1, 2);
    el.score.textContent = pad(state.score);
    el.combo.textContent = '×' + state.combo.toFixed(1);
    el.combo.classList.toggle('on', state.combo > 1.02);

    const frac = clamp(state.debt / MAX_DEBT, 0, 1);
    el.debtNum.textContent = state.debt.toFixed(1);
    el.debtFill.style.width = (frac * 100).toFixed(1) + '%';
    el.debtBlock.classList.toggle('warn', frac > .62);
    el.debtWarn.textContent = frac > .86 ? 'COLLECTION IMMINENT' : frac > .62 ? 'INTEREST RISING' : 'INTEREST ACCRUING';

    let echoes = 0;
    let boss = null;
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (e.kind === 'echo') echoes++;
      if (e.kind === 'boss') boss = e;
    }
    el.debtEcho.textContent = echoes + ' ECHO' + (echoes === 1 ? '' : 'ES');

    if (boss) {
      el.bossHud.classList.add('on');
      el.bossFill.style.width = (clamp(boss.hp / boss.maxHp, 0, 1) * 100).toFixed(1) + '%';
    } else {
      el.bossHud.classList.remove('on');
    }
  }

  function showEnd(won) {
    if (state.endShown) return;
    state.endShown = true;
    hideBanner();
    el.toast.classList.remove('on');
    document.body.classList.remove('is-playing');

    const score = state.score;
    let rank;
    if (won) {
      rank = score >= 15000 && state.collections <= 2 ? 'S' : score >= 9000 ? 'A' : 'B';
    } else {
      rank = score >= 12000 ? 'A' : score >= 6000 ? 'B' : 'C';
    }

    el.statScore.textContent = String(score);
    el.statKills.textContent = String(state.kills);
    el.statStolen.textContent = state.stolen.toFixed(1) + 's';
    el.statEchoes.textContent = String(state.collections);

    if (won) {
      el.endKicker.textContent = 'THE LEDGER IS CLOSED';
      el.endTitle.innerHTML = 'DEBT PAID<br>IN FULL';
      el.endSub.textContent = 'You survived the collection. The future will remember your name — and your interest rate.';
    } else {
      el.endKicker.textContent = 'THE LEDGER IS CLOSED';
      el.endTitle.innerHTML = 'THE FUTURE<br>COLLECTED';
      el.endSub.textContent = 'You borrowed more than the moment could afford. Somewhere, a second of you is still being spent.';
    }
    el.endRank.className = 'end-rank rank-' + rank.toLowerCase();
    el.endRank.innerHTML = '<span>' + rank + '</span>';

    if (score > state.best) {
      state.best = score;
      setBest(score);
    }
    el.best.textContent = pad(state.best);
    el.endBest.textContent = pad(state.best);
    el.endFoot.style.display = '';
    el.end.classList.remove('hidden');
    Sound.resume();
  }

  function togglePause() {
    if (state.mode === 'playing') {
      state.mode = 'paused';
      el.pause.classList.remove('hidden');
      document.body.classList.remove('is-playing');
    } else if (state.mode === 'paused') {
      state.mode = 'playing';
      el.pause.classList.add('hidden');
      document.body.classList.add('is-playing');
      Sound.resume();
    }
  }

  function toggleMute() {
    Sound.init();
    Sound.setMuted(!Sound.muted);
  }

  /* ----------------------------------------------------------------- input */

  function keyDown(e) {
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();

    if (k === 'm') { toggleMute(); return; }
    if (k === 'escape' || k === 'p') {
      if (state.mode === 'playing' || state.mode === 'paused') togglePause();
      return;
    }
    if (state.mode === 'menu') {
      if (k === 'enter' || k === ' ') startGame();
      return;
    }
    if (state.mode === 'dead' || state.mode === 'won') {
      if (k === 'enter' || k === 'r') startGame();
      return;
    }
    if (state.mode !== 'playing') return;

    if (k === ' ') { dash(); return; }
    if (k === 'shift') { input.stealing = true; return; }
    input.keys.add(k);
  }

  function keyUp(e) {
    const k = e.key.toLowerCase();
    input.keys.delete(k);
    if (k === 'shift') input.stealing = false;
  }

  function clearInput() {
    input.keys.clear();
    input.attackHeld = false;
    input.stealing = false;
    input.move.active = false;
    input.aim.active = false;
    input.firing = false;
  }

  function bindStick(node, target, isAim) {
    if (!node) return;
    const knob = node.querySelector('.tknob');
    let pid = null;

    const apply = (e) => {
      const r = node.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const max = r.width * 0.34;
      const m = Math.hypot(dx, dy);
      if (m > max) { dx *= max / m; dy *= max / m; }
      if (knob) knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      target.x = dx / max;
      target.y = dy / max;
      target.active = true;
      if (isAim) input.firing = Math.hypot(target.x, target.y) > 0.22;
    };

    node.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      enableTouch();
      pid = e.pointerId;
      try { node.setPointerCapture(pid); } catch (err) { /* ignore */ }
      node.classList.add('active');
      apply(e);
    });
    node.addEventListener('pointermove', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      e.preventDefault();
      apply(e);
    });
    const end = (e) => {
      if (pid !== null && e.pointerId !== pid) return;
      pid = null;
      node.classList.remove('active');
      if (knob) knob.style.transform = '';
      target.x = 0; target.y = 0; target.active = false;
      if (isAim) input.firing = false;
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
    node.addEventListener('lostpointercapture', end);
  }

  function bindHoldButton(node, onDown, onUp) {
    if (!node) return;
    let id = null;
    node.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enableTouch();
      id = e.pointerId;
      try { node.setPointerCapture(id); } catch (err) { /* ignore */ }
      node.classList.add('active');
      onDown();
    });
    const end = (e) => {
      if (id !== null && e.pointerId !== id) return;
      id = null;
      node.classList.remove('active');
      onUp();
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
    node.addEventListener('lostpointercapture', end);
  }

  function enableTouch() {
    input.touch = true;
    input.touchSeen = true;
    document.body.classList.add('is-touch');
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', clearInput);

  window.addEventListener('mousemove', (e) => {
    input.mouse.x = e.clientX;
    input.mouse.y = e.clientY;
    input.mouse.active = true;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.target && e.target.closest && e.target.closest('button, .screen, .tstick')) return;
    if (state.mode !== 'playing') return;
    if (e.button === 0) { input.attackHeld = true; Sound.init(); }
    else if (e.button === 2) { input.stealing = true; Sound.init(); }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.attackHeld = false;
    if (e.button === 2) input.stealing = false;
  });

  window.addEventListener('contextmenu', (e) => {
    if (e.target && e.target.closest && e.target.closest('#app')) e.preventDefault();
  });

  window.addEventListener('touchstart', enableTouch, { passive: true, once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'playing') togglePause();
  });

  el.play.addEventListener('click', startGame);
  el.retry.addEventListener('click', startGame);
  el.resume.addEventListener('click', () => { if (state.mode === 'paused') togglePause(); });
  el.mute.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); });

  bindStick(el.moveStick, input.move, false);
  bindStick(el.aimStick, input.aim, true);
  bindHoldButton(el.stealBtn, () => { Sound.init(); input.stealing = true; }, () => { input.stealing = false; });
  bindHoldButton(el.dashBtn, () => { Sound.init(); dash(); }, () => {});

  /* ------------------------------------------------------------------ boot */

  resize();
  document.body.classList.add('is-menu');
  document.body.classList.remove('is-playing');
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) enableTouch();
  else if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) document.body.classList.add('is-touch');
  el.best.textContent = pad(state.best);
  el.endBest.textContent = pad(state.best);
  el.mute.textContent = 'SOUND ON';

  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    // The opening screen is drawn entirely in CSS; keeping the canvas idle
    // avoids a costly full-arena repaint before the first interaction.
    if (state.mode === 'menu') {
      requestAnimationFrame(frame);
      return;
    }
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // A small read-only debug handle for verification and screenshots.
  window.__chrono = {
    get state() { return state; },
    start: startGame,
    debt(seconds) {
      if (state.mode !== 'playing') return;
      state.debt = clamp(seconds, 0, MAX_DEBT - .001);
    },
    hurt(amount) {
      if (state.mode === 'playing') hurtPlayer(amount, state.player.x + 40, state.player.y);
    },
    attack() { if (state.mode === 'playing') attack(); },
    dash() { if (state.mode === 'playing') dash(); },
    spawn(kind) {
      if (state.mode !== 'playing') return;
      const a = rand(TAU);
      spawnEnemy(kind, state.player.x + Math.cos(a) * 190 * view.k, state.player.y + Math.sin(a) * 150 * view.k);
    },
    killAll() {
      if (state.mode !== 'playing') return;
      for (const e of state.enemies.slice()) killEnemy(e);
    },
    clearWave() {
      if (state.mode !== 'playing') return;
      state.spawnQueue.length = 0;
      state.spawners.length = 0;
      state.enemies.length = 0;
    }
  };
})();
