/* ============================================================
   SHADOW HEIST — Nightfall Engine
   A hand-built stealth game. No dependencies.
   ============================================================ */
(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const TILE = 40;
  const COLS = 40;
  const ROWS = 24;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const IS_TOUCH =
    window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  const normAngle = (a) => {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  };
  const angleDiff = (a, b) => Math.abs(normAngle(a - b));
  const lerpAngle = (a, b, t) => a + normAngle(b - a) * clamp(t, 0, 1);
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const rgba = (c, a) => `rgba(${c},${a})`;
  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };
  const hash2 = (x, y) => {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  };
  const seeded = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };
  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = dx * dx + dy * dy;
    let t = len ? ((px - x1) * dx + (py - y1) * dy) / len : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };

  /* ============================================================
     AUDIO — small synthesized score + foley
     ============================================================ */
  class Sound {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = localStorage.getItem("shadow-heist-muted") === "1";
      this.ambientStarted = false;
      this.updateButton();
    }
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.22;
      this.master.connect(this.ctx.destination);
    }
    resume() {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      if (this.ctx && !this.ambientStarted) this.startAmbient();
    }
    startAmbient() {
      if (!this.ctx) return;
      this.ambientStarted = true;
      const g = this.ctx.createGain();
      g.gain.value = 0.018;
      g.connect(this.master);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 210;
      filter.connect(g);
      [46, 69, 92].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = i === 2 ? "triangle" : "sine";
        osc.frequency.value = freq;
        const lfo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lfo.frequency.value = 0.035 + i * 0.013;
        lg.gain.value = 1.4 + i;
        lfo.connect(lg);
        lg.connect(osc.detune);
        osc.connect(filter);
        osc.start();
        lfo.start();
      });
    }
    updateButton() {
      const btn = $("#soundBtn");
      if (!btn) return;
      btn.classList.toggle("muted", this.muted);
      btn.setAttribute("aria-label", this.muted ? "Enable sound" : "Mute sound");
    }
    toggle() {
      this.muted = !this.muted;
      localStorage.setItem("shadow-heist-muted", this.muted ? "1" : "0");
      if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.22, this.ctx.currentTime, 0.03);
      this.updateButton();
      return this.muted;
    }
    tone(freq, dur = 0.1, type = "sine", vol = 0.08, slide = 0, delay = 0) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
    noise(dur = 0.15, freq = 700, vol = 0.05, delay = 0) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      src.start(t0);
    }
    click() { this.tone(520, 0.05, "square", 0.025, -60); }
    step(soft = false) { this.noise(0.055, soft ? 340 : 520, soft ? 0.018 : 0.038); }
    throwStone() { this.noise(0.13, 1200, 0.04); this.tone(310, 0.1, "triangle", 0.025, 120); }
    ping() {
      this.tone(880, 0.08, "sine", 0.06, -240);
      this.tone(1320, 0.13, "triangle", 0.035, -320, 0.04);
    }
    suspicion() { this.tone(460, 0.13, "triangle", 0.04, 80); }
    alarm() {
      [0, 0.18, 0.36].forEach((d, i) => {
        this.tone(600 - i * 40, 0.15, "sawtooth", 0.05, 120, d);
        this.tone(900 - i * 50, 0.15, "square", 0.025, -150, d + 0.05);
      });
    }
    cameraAlert() {
      this.tone(1200, 0.06, "square", 0.05);
      this.tone(1200, 0.06, "square", 0.05, 0, 0.18);
      this.tone(1200, 0.06, "square", 0.05, 0, 0.36);
    }
    laser() {
      this.noise(0.18, 2200, 0.06);
      this.tone(110, 0.22, "sawtooth", 0.07, -50);
    }
    loot() {
      [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.2, "sine", 0.05, 0, i * 0.06));
    }
    success() {
      [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.55, "triangle", 0.045, 0, i * 0.12));
    }
    fail() {
      this.tone(180, 0.5, "sawtooth", 0.06, -80);
      this.tone(120, 0.7, "sine", 0.06, -40, 0.12);
    }
    unlock() {
      this.tone(260, 0.12, "square", 0.035, 120);
      this.tone(420, 0.18, "triangle", 0.04, 180, 0.12);
    }
  }

  /* ============================================================
     GAME
     ============================================================ */
  class Game {
    constructor() {
      this.canvas = $("#scene");
      this.ctx = this.canvas.getContext("2d");
      this.darkCanvas = document.createElement("canvas");
      this.darkCtx = this.darkCanvas.getContext("2d");
      this.sound = new Sound();
      this.menu = $("#menu");
      this.gameUI = $("#gameUI");
      this.vw = window.innerWidth;
      this.vh = window.innerHeight;
      this.dpr = 1;
      this.state = "menu";
      this.selected = 0;
      this.time = 0;
      this.last = performance.now();
      this.keys = new Set();
      this.touchVec = { x: 0, y: 0 };
      this.joy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };
      this.mouse = { x: 0, y: 0, wx: 0, wy: 0, active: false, movedAt: -999 };
      this.toastTimer = 0;
      this.missionTimer = 0;
      this.introTimer = 0;
      this.modal = null;
      this.flash = 0;
      this.flashColor = "255,82,101";
      this.shake = 0;
      this.result = null;
      this.particles = [];
      this.floaters = [];
      this.noises = [];
      this.projectiles = [];
      this.noiseId = 0;
      this.level = null;
      this.player = null;
      this.camera = { x: 0, y: 0, scale: 1 };
      this.menuScene = null;
      this.tutorialShown = false;
      this.bind();
      this.resize();
      this.buildMissionList();
      this.selectMission(0, false);
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    /* ------------------------- UI wiring ------------------------- */
    bind() {
      const click = (id, fn) => {
        const el = $(id);
        if (el) el.addEventListener("click", (e) => { this.sound.resume(); this.sound.click(); fn(e); });
      };
      click("#soundBtn", () => this.sound.toggle());
      click("#helpBtn", () => this.showModal("help"));
      click("#closeHelp", () => this.hideModals());
      click("#briefBtn", () => this.showBriefing());
      click("#closeBrief", () => this.hideModals());
      click("#briefDeployBtn", () => { this.hideModals(); this.startMission(this.selected); });
      click("#deployBtn", () => this.startMission(this.selected));
      click("#pauseBtn", () => this.togglePause());
      click("#touchPause", () => this.togglePause());
      click("#resumeBtn", () => this.togglePause(false));
      click("#restartBtn", () => this.startMission(this.selected));
      click("#abortBtn", () => this.quitToMenu());
      click("#retryBtn", () => this.startMission(this.selected));
      click("#menuBtn", () => this.quitToMenu());
      click("#nextBtn", () => this.nextMission());
      click("#touchCrouch", () => this.toggleCrouch());
      click("#touchInteract", () => this.interact());
      click("#touchThrow", () => this.throwNoise());
      click("#missionList", (e) => {
        const card = e.target.closest(".mission-card");
        if (card) this.selectMission(Number(card.dataset.index));
      });
      window.addEventListener("resize", () => this.resize());
      window.addEventListener("keydown", (e) => this.onKeyDown(e));
      window.addEventListener("keyup", (e) => this.keys.delete(e.code));
      window.addEventListener("pointermove", (e) => this.onPointerMove(e));
      window.addEventListener("pointerdown", () => { this.sound.resume(); });
      window.addEventListener("blur", () => {
        this.keys.clear();
        if (this.state === "playing") this.togglePause(true);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.state === "playing") this.togglePause(true);
      });
      this.bindJoystick();
    }

    onKeyDown(e) {
      const code = e.code;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(code);
      if (code === "KeyM") { this.sound.resume(); this.sound.toggle(); return; }
      if (this.state === "menu") {
        if (code === "Enter") { this.sound.resume(); this.startMission(this.selected); }
        return;
      }
      if (code === "Escape") {
        if (this.modal) this.hideModals();
        else if (this.state === "playing" || this.state === "paused") this.togglePause();
        return;
      }
      if (this.state !== "playing") return;
      if (code === "KeyE" || code === "Space") this.interact();
      if (code === "KeyQ") this.throwNoise();
      if (code === "KeyC" || code === "ControlLeft" || code === "ControlRight") this.toggleCrouch();
    }

    onPointerMove(e) {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.movedAt = performance.now();
      if (this.player && this.level) {
        const s = this.camera.scale;
        this.mouse.wx = (e.clientX - this.vw / 2) / s + this.camera.x;
        this.mouse.wy = (e.clientY - this.vh / 2) / s + this.camera.y;
      }
    }

    bindJoystick() {
      const zone = $("#joystickZone");
      const knob = $("#joystickKnob");
      if (!zone) return;
      const getPos = (e) => {
        const r = zone.getBoundingClientRect();
        return { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2), max: r.width * 0.32 };
      };
      const move = (e) => {
        const p = getPos(e);
        const m = Math.min(1, Math.hypot(p.x, p.y) / p.max);
        const a = Math.atan2(p.y, p.x);
        this.joy.dx = Math.cos(a) * m;
        this.joy.dy = Math.sin(a) * m;
        const visual = Math.min(34, Math.hypot(p.x, p.y));
        knob.style.transform = `translate(${Math.cos(a) * visual}px, ${Math.sin(a) * visual}px)`;
      };
      zone.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.sound.resume();
        this.joy.active = true;
        this.joy.id = e.pointerId;
        zone.setPointerCapture(e.pointerId);
        move(e);
      });
      zone.addEventListener("pointermove", (e) => {
        if (!this.joy.active || e.pointerId !== this.joy.id) return;
        e.preventDefault();
        move(e);
      });
      const end = (e) => {
        if (e.pointerId !== this.joy.id) return;
        this.joy.active = false;
        this.joy.id = null;
        this.joy.dx = 0;
        this.joy.dy = 0;
        knob.style.transform = "translate(0,0)";
      };
      zone.addEventListener("pointerup", end);
      zone.addEventListener("pointercancel", end);
    }

    resize() {
      this.vw = window.innerWidth;
      this.vh = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(this.vw * this.dpr);
      this.canvas.height = Math.floor(this.vh * this.dpr);
      this.darkCanvas.width = this.vw;
      this.darkCanvas.height = this.vh;
      this.buildMenuScene();
      this.updateCameraScale();
      $("#rotateHint").classList.toggle("is-hidden", !(IS_TOUCH && this.vh > this.vw && this.vh < 600));
    }

    updateCameraScale() {
      const tw = IS_TOUCH ? 12.2 : 35;
      const th = IS_TOUCH ? 20 : 21;
      this.camera.scale = clamp(Math.min(this.vw / (tw * TILE), this.vh / (th * TILE)), 0.55, 1.35);
    }

    buildMissionList() {
      const riskBars = (level) => {
        let bars = "";
        for (let i = 0; i < 5; i++) bars += `<i class="${i < level.risk ? "on" : ""}"></i>`;
        const cls = level.risk <= 1 ? "low" : level.risk <= 3 ? "mid" : "high";
        return `<span class="mission-risk ${cls}" aria-label="${level.riskLabel}">${bars}</span>`;
      };
      $("#missionList").innerHTML = LEVELS.map((l, i) => `
        <button class="mission-card" data-index="${i}" role="listitem" aria-label="Select ${l.name}">
          <span class="mission-index">${l.num}</span>
          <span class="mission-info"><strong>${l.name}</strong><small>${l.location} · ${l.district}</small></span>
          ${riskBars(l)}
        </button>`).join("");
      $("#missionCount").textContent = String(LEVELS.length).padStart(2, "0");
    }

    selectMission(index, sound = true) {
      this.selected = clamp(index, 0, LEVELS.length - 1);
      const level = LEVELS[this.selected];
      $$(".mission-card").forEach((c, i) => c.classList.toggle("active", i === this.selected));
      $("#dossierName").textContent = level.name;
      $("#dossierBrief").textContent = level.brief;
      $("#dossierDifficulty").textContent = level.riskLabel;
      $("#dossierGuards").textContent = String(level.build().guards.length).padStart(2, "0");
      $("#dossierCams").textContent = String(level.build().cameras.length).padStart(2, "0");
      $("#dossierLoot").textContent = String(level.build().objectives.length).padStart(2, "0");
      $("#deployBtn .btn-kicker").textContent = `MISSION ${level.num}`;
      $("#menuTip").innerHTML = `<span>TIP //</span> ${level.note}`;
      if (sound) this.sound.tone(620, 0.04, "sine", 0.02, -70);
    }

    showBriefing() {
      const level = LEVELS[this.selected];
      const built = level.build();
      $("#briefKicker").textContent = `DOSSIER // MISSION ${level.num}`;
      $("#briefTitle").textContent = level.name;
      $("#briefBody").textContent = level.brief;
      $("#briefLocation").textContent = level.location;
      $("#briefThreat").textContent = level.riskLabel;
      $("#briefPrimary").textContent = built.objectives.map((o) => o.name).join(" + ");
      $("#briefNote").textContent = level.note;
      this.showModal("brief");
    }

    showModal(name) {
      this.modal = name;
      $("#modalLayer").classList.remove("is-hidden");
      ["pause", "help", "result", "brief"].forEach((m) => {
        const el = $(`#${m}Modal`);
        if (el) el.classList.toggle("is-hidden", m !== name);
      });
    }

    hideModals() {
      this.modal = null;
      $("#modalLayer").classList.add("is-hidden");
      ["pause", "help", "result", "brief"].forEach((m) => {
        const el = $(`#${m}Modal`);
        if (el) el.classList.add("is-hidden");
      });
      if (this.state === "paused") this.state = "playing";
    }

    /* ------------------------- session flow ------------------------- */
    startMission(index) {
      this.sound.resume();
      this.selected = clamp(index, 0, LEVELS.length - 1);
      this.hideModals();
      this.state = "playing";
      this.loadLevel(this.selected);
      this.menu.classList.add("is-hidden");
      this.gameUI.classList.remove("is-hidden");
      this.gameUI.setAttribute("aria-hidden", "false");
      this.missionTimer = 0;
      this.introTimer = 3.6;
      this.flash = 0;
      this.shake = 0;
      this.time = 0;
      const level = LEVELS[this.selected];
      $("#hudMissionNo").textContent = `MISSION ${level.num}`;
      $("#hudMissionName").textContent = level.name;
      $("#introLabel").textContent = `MISSION ${level.num} // ${level.location.split(" · ")[0]}`;
      $("#introTitle").textContent = level.name;
      $("#introObjective").textContent = this.level.objectives.map((o) => o.short).join("  ·  ");
      const intro = $("#missionIntro");
      intro.classList.remove("is-hidden");
      intro.style.animation = "none";
      void intro.offsetWidth;
      intro.style.animation = "";
      setTimeout(() => intro.classList.add("is-hidden"), 3600);
      this.updateHUD(true);
    }

    quitToMenu() {
      this.state = "menu";
      this.hideModals();
      this.gameUI.classList.add("is-hidden");
      this.gameUI.setAttribute("aria-hidden", "true");
      this.menu.classList.remove("is-hidden");
      this.level = null;
      this.player = null;
      this.projectiles = [];
      this.particles = [];
      this.buildMenuScene();
      this.selectMission(this.selected, false);
    }

    nextMission() {
      if (this.selected < LEVELS.length - 1) this.startMission(this.selected + 1);
      else this.quitToMenu();
    }

    togglePause(force) {
      if (this.state === "playing") {
        this.state = "paused";
        $("#pauseModal .micro-label").textContent = "OPERATION SUSPENDED";
        this.showModal("pause");
      } else if (this.state === "paused" && force !== true) {
        this.hideModals();
        this.state = "playing";
        this.last = performance.now();
      }
    }

    loadLevel(index) {
      const def = LEVELS[index];
      const built = def.build();
      const theme = SHADOW_THEMES[def.theme];
      const px = (v) => (v + 0.5) * TILE;
      const cellAt = (x, y) => {
        if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return "#";
        return built.tiles[y][x];
      };
      const level = {
        index, def, theme,
        tiles: built.tiles,
        cellAt,
        objects: {},
        hiding: built.hiding.map((h, i) => ({ ...h, id: i, px: px(h.x), py: px(h.y), occupied: false })),
        terminals: built.terminals.map((t, i) => ({ ...t, id: i, px: px(t.x), py: px(t.y), cooldown: 0, activeUntil: 0 })),
        objectives: built.objectives.map((o, i) => ({ ...o, id: i, px: px(o.x), py: px(o.y), collected: false, bob: Math.random() * TAU })),
        loot: built.loot.map((l, i) => ({ ...l, id: i, px: px(l.x), py: px(l.y), collected: false, bob: Math.random() * TAU })),
        cameras: built.cameras.map((c, i) => ({
          ...c, id: i, px: px(c.x), py: px(c.y), angle: c.angle, angleBase: c.angle,
          disabledUntil: 0, confidence: 0, alarmCooldown: 0, flash: 0, beeped: false
        })),
        lasers: built.lasers.map((l, i) => ({
          ...l, id: i, x1p: px(l.x1), y1p: px(l.y1), x2p: px(l.x2), y2p: px(l.y2),
          active: true, hitCooldown: 0
        })),
        guards: built.guards.map((g, i) => ({
          ...g, id: i, x: px(g.path[0][0]), y: px(g.path[0][1]),
          spawn: [px(g.path[0][0]), px(g.path[0][1])],
          angle: 0, state: "patrol", waypoint: 0, awareness: 0, wait: 0.4,
          nav: [], navIndex: 0, targetX: 0, targetY: 0, repath: 0,
          seen: false, lastSeenX: 0, lastSeenY: 0, lostTimer: 0,
          suspicionTimer: 0, searchTimer: 0, scanBase: 0, scanPhase: Math.random() * TAU,
          speed: g.speed, stepPhase: Math.random() * TAU, alertFlash: 0, lastNoiseId: -1
        })),
        lights: built.lights.map((l) => ({ ...l, px: px(l.x), py: px(l.y), r: l.r * TILE })),
        exit: { x: built.exit[0], y: built.exit[1], px: px(built.exit[0]), py: px(built.exit[1]), active: false },
        spawn: { x: px(built.spawn[0]), y: px(built.spawn[1]) },
        decals: this.makeDecals(built, theme, index)
      };
      level.exit.active = false;
      this.level = level;
      this.alert = 0;
      this.peakAlert = 0;
      this.lastDetectionAt = -999;
      this.lootCollected = 0;
      this.lootTotal = level.loot.length;
      this.throwCooldown = 0;
      this.throwFlash = 0;
      this.particles = [];
      this.floaters = [];
      this.noises = [];
      this.projectiles = [];
      this.interactable = null;
      this.player = {
        x: level.spawn.x, y: level.spawn.y, r: 10.5, angle: -Math.PI / 2,
        hidden: false, hideId: null, crouching: false, sprinting: false,
        inVent: false, moving: false, bob: 0, stepTimer: 0, spotted: false,
        noiseTimer: 0, trail: []
      };
      this.camera.x = this.player.x;
      this.camera.y = this.player.y;
      this.revealMap(true);
      this.updateObjectivesUI();
      this.updateHUD(true);
    }

    makeDecals(built, theme, index) {
      const decals = [];
      const rng = seeded(1000 + index * 7907);
      const floorSpots = [];
      for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
          if (built.tiles[y][x] === ".") floorSpots.push([x, y]);
        }
      }
      for (let i = 0; i < 70; i++) {
        const [x, y] = floorSpots[Math.floor(rng() * floorSpots.length)];
        decals.push({
          type: "speck", x: x * TILE + rng() * TILE, y: y * TILE + rng() * TILE,
          r: 0.5 + rng() * 2.2, a: 0.03 + rng() * 0.09
        });
      }
      const labels = [
        { type: "stripe", x: 12, y: 20.4, w: 5, rot: 0 },
        { type: "text", x: 18.4, y: 12.4, text: "GALLERY", rot: 0 },
        { type: "text", x: 2.4, y: 19.6, text: "SERVICE", rot: 0 },
        { type: "arrow", x: 26, y: 20.2, rot: 0 }
      ];
      labels.forEach((l) => decals.push({ ...l, themeColor: theme.accent }));
      return decals;
    }

    revealMap(initial) {
      if (!this.level) return;
      this.level.reveal = this.level.reveal || new Uint8Array(COLS * ROWS);
    }

    /* ------------------------- utilities ------------------------- */
    isWall(tx, ty) {
      const ch = this.level.cellAt(tx, ty);
      return ch === "#";
    }
    isVent(tx, ty) {
      return this.level.cellAt(tx, ty) === "V";
    }
    isFloorPx(x, y) {
      return !this.isWall(Math.floor(x / TILE), Math.floor(y / TILE));
    }
    circleHitsWall(x, y, r) {
      const minX = Math.floor((x - r) / TILE);
      const maxX = Math.floor((x + r) / TILE);
      const minY = Math.floor((y - r) / TILE);
      const maxY = Math.floor((y + r) / TILE);
      for (let ty = minY; ty <= maxY; ty++) {
        for (let tx = minX; tx <= maxX; tx++) {
          if (!this.isWall(tx, ty)) continue;
          const nx = clamp(x, tx * TILE, (tx + 1) * TILE);
          const ny = clamp(y, ty * TILE, (ty + 1) * TILE);
          if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
        }
      }
      return false;
    }
    lineOfSight(x1, y1, x2, y2) {
      const d = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.ceil(d / 6);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        if (this.isWall(Math.floor(x / TILE), Math.floor(y / TILE))) return false;
      }
      return true;
    }
    raycast(x, y, angle, maxDist) {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const step = 5;
      let d = 0;
      while (d < maxDist) {
        d += step;
        const px = x + dx * d;
        const py = y + dy * d;
        if (this.isWall(Math.floor(px / TILE), Math.floor(py / TILE))) return { x: x + dx * (d - step), y: y + dy * (d - step), d: d - step };
      }
      return { x: x + dx * maxDist, y: y + dy * maxDist, d: maxDist };
    }
    tileCenter(tx, ty) { return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }; }
    cellOf(x, y) { return { x: Math.floor(x / TILE), y: Math.floor(y / TILE) }; }

    findPath(sx, sy, tx, ty, allowVent = false) {
      const start = this.cellOf(sx, sy);
      let goal = this.cellOf(tx, ty);
      if (this.isWall(goal.x, goal.y)) {
        let best = null;
        for (let oy = -2; oy <= 2; oy++) {
          for (let ox = -2; ox <= 2; ox++) {
            const nx = goal.x + ox;
            const ny = goal.y + oy;
            if (!this.isWall(nx, ny) && (!this.isVent(nx, ny) || allowVent)) {
              const d = Math.abs(ox) + Math.abs(oy);
              if (!best || d < best.d) best = { x: nx, y: ny, d };
            }
          }
        }
        if (best) goal = best;
      }
      const pass = (x, y) => {
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
        const ch = this.level.tiles[y][x];
        return ch === "." || (allowVent && ch === "V");
      };
      if (!pass(goal.x, goal.y)) return [];
      const key = (x, y) => y * COLS + x;
      const open = new Map();
      const closed = new Uint8Array(COLS * ROWS);
      const gScore = new Float32Array(COLS * ROWS).fill(Infinity);
      const parents = new Int32Array(COLS * ROWS).fill(-1);
      const startKey = key(start.x, start.y);
      gScore[startKey] = 0;
      open.set(startKey, { x: start.x, y: start.y, f: Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y) });
      const dirs = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414]];
      let iterations = 0;
      while (open.size && iterations++ < 2200) {
        let currentKey = -1;
        let current = null;
        for (const [k, v] of open) {
          if (!current || v.f < current.f) { current = v; currentKey = k; }
        }
        open.delete(currentKey);
        if (current.x === goal.x && current.y === goal.y) {
          const path = [];
          let k = currentKey;
          while (k !== -1 && k !== startKey) {
            path.push({ x: (k % COLS + 0.5) * TILE, y: (Math.floor(k / COLS) + 0.5) * TILE });
            k = parents[k];
          }
          path.reverse();
          return path;
        }
        closed[currentKey] = 1;
        for (const [dx, dy, cost] of dirs) {
          const nx = current.x + dx;
          const ny = current.y + dy;
          if (!pass(nx, ny)) continue;
          if (dx && dy && (!pass(current.x + dx, current.y) || !pass(current.x, current.y + dy))) continue;
          const nk = key(nx, ny);
          if (closed[nk]) continue;
          const tentative = gScore[currentKey] + cost;
          if (tentative < gScore[nk]) {
            parents[nk] = currentKey;
            gScore[nk] = tentative;
            const h = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
            open.set(nk, { x: nx, y: ny, f: tentative + h * 1.05 });
          }
        }
      }
      return [];
    }

    emitNoise(x, y, radius, type = "noise") {
      const noise = { id: ++this.noiseId, x, y, radius, type, time: this.time };
      this.noises.push(noise);
      this.addNoiseRing(x, y, radius);
      for (const guard of this.level.guards) {
        if (guard.state === "chase") continue;
        const d = dist(guard.x, guard.y, x, y);
        if (d < radius && this.time > (guard.noiseCooldown || 0)) {
          guard.noiseCooldown = this.time + 0.6;
          guard.lastNoiseId = noise.id;
          this.investigate(guard, x, y);
        }
      }
      return noise;
    }

    addNoiseRing(x, y, radius) {
      this.particles.push({ type: "ring", x, y, radius: 8, maxRadius: radius, life: 0, maxLife: 0.8, color: "126,242,213" });
    }

    /* ------------------------- game loop ------------------------- */
    loop(now) {
      const dt = Math.min(0.033, (now - this.last) / 1000 || 0.016);
      this.last = now;
      this.time += dt;
      if (this.state === "playing" && this.level) {
        this.missionTimer += dt;
        this.update(dt);
      } else if (this.state === "menu") {
        this.updateMenu(dt);
      }
      this.render(dt);
      requestAnimationFrame(this.loop);
    }
  }

  /* ============================================================
     UPDATE — menu atmosphere
     ============================================================ */
  Game.prototype.buildMenuScene = function () {
    const rng = seeded(19477);
    const buildings = [];
    let x = -40;
    while (x < this.vw + 80) {
      const w = 34 + rng() * 95;
      const h = 90 + rng() * 300;
      const windows = [];
      const cols = Math.max(2, Math.floor(w / 17));
      const rows = Math.floor(h / 22);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (rng() > 0.67) windows.push({
            x: 9 + cx * (w - 18) / cols + rng() * 3,
            y: 12 + cy * 22,
            w: 3 + rng() * 4, h: 5 + rng() * 5,
            a: 0.07 + rng() * 0.25,
            t: rng() * TAU
          });
        }
      }
      buildings.push({ x, w, h, layer: rng() > 0.52 ? 1 : 0, windows, antenna: rng() > 0.78, blink: rng() * TAU });
      x += w + 2 + rng() * 12;
    }
    const rain = Array.from({ length: 90 }, () => ({
      x: rng() * this.vw, y: rng() * this.vh,
      len: 8 + rng() * 18, speed: 180 + rng() * 340, a: 0.035 + rng() * 0.1
    }));
    const embers = Array.from({ length: 28 }, () => ({
      x: rng() * this.vw, y: this.vh * (0.45 + rng() * 0.55),
      r: 0.4 + rng() * 1.3, speed: 5 + rng() * 17, drift: (rng() - 0.5) * 8, a: rng() * TAU
    }));
    this.menuScene = { buildings, rain, embers, rng };
  };

  Game.prototype.updateMenu = function (dt) {
    if (!this.menuScene) return;
    for (const r of this.menuScene.rain) {
      r.y += r.speed * dt;
      r.x -= r.speed * 0.1 * dt;
      if (r.y > this.vh + 20) { r.y = -20; r.x = Math.random() * this.vw; }
      if (r.x < -20) r.x = this.vw + 20;
    }
    for (const e of this.menuScene.embers) {
      e.y -= e.speed * dt;
      e.x += Math.sin(this.time * 0.4 + e.a) * e.drift * dt;
      if (e.y < this.vh * 0.3) { e.y = this.vh + 5; e.x = Math.random() * this.vw; }
    }
  };

  /* ============================================================
     UPDATE — mission
     ============================================================ */
  Game.prototype.update = function (dt) {
    if (!this.level || !this.player) return;
    this.throwCooldown = Math.max(0, this.throwCooldown - dt);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.shake = Math.max(0, this.shake - dt * 22);
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) $("#toast").classList.remove("show");
    }
    this.player.spotted = false;
    this.updatePlayer(dt);
    this.updateProjectiles(dt);
    for (const guard of this.level.guards) this.updateGuard(guard, dt);
    for (const camera of this.level.cameras) this.updateCamera(camera, dt);
    this.updateLasers(dt);
    this.updateAlert(dt);
    this.updateInteraction();
    this.updateCameraView(dt);
    this.updateParticles(dt);
    this.updateHUD(false);
  };

  Game.prototype.getMoveVector = function () {
    let x = 0, y = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) y -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) y += 1;
    x += this.touchVec.x;
    y += this.touchVec.y;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len: Math.min(1, len) };
  };

  Game.prototype.updatePlayer = function (dt) {
    const p = this.player;
    const move = this.getMoveVector();
    p.inVent = this.isVent(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
    const canSprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    p.sprinting = !p.crouching && !this.joy.active && canSprint && move.len > 0.2 && !p.inVent && !p.hidden;
    p.moving = move.len > 0.06 && !p.hidden;
    if (p.hidden) p.moving = false;
    let speed = p.crouching ? 58 : p.sprinting ? 176 : 108;
    if (p.inVent) { speed = 56; p.sprinting = false; }
    if (p.hidden) speed = 0;
    const dx = move.x * speed * dt;
    const dy = move.y * speed * dt;
    if (p.moving) {
      p.x += dx;
      if (this.circleHitsWall(p.x, p.y, p.r)) p.x -= dx;
      p.y += dy;
      if (this.circleHitsWall(p.x, p.y, p.r)) p.y -= dy;
      p.x = clamp(p.x, TILE + p.r, WORLD_W - TILE - p.r);
      p.y = clamp(p.y, TILE + p.r, WORLD_H - TILE - p.r);
      p.bob += dt * (p.sprinting ? 13 : p.crouching ? 5 : 9);
      p.stepTimer -= dt;
      if (p.stepTimer <= 0) {
        p.stepTimer = p.sprinting ? 0.25 : p.crouching ? 0.55 : 0.38;
        this.sound.step(p.crouching);
        this.particles.push({
          type: "step", x: p.x + (Math.random() - 0.5) * 8, y: p.y + 7,
          life: 0, maxLife: 0.5, r: 3, color: this.level.theme.accent
        });
        if (p.sprinting) {
          this.emitNoise(p.x, p.y, 150, "sprint");
        } else if (!p.crouching && !p.inVent) {
          this.emitNoise(p.x, p.y, 42, "step");
        }
      }
      p.trail.push({ x: p.x, y: p.y, life: 0.28 });
      if (p.trail.length > 10) p.trail.shift();
    } else {
      p.bob += dt * 1.8;
    }
    for (const t of p.trail) t.life -= dt;
    p.trail = p.trail.filter((t) => t.life > 0);
    // Aim follows the mouse on desktop; facing follows motion otherwise.
    const recentMouse = performance.now() - this.mouse.movedAt < 2600;
    if (!IS_TOUCH && recentMouse) {
      const s = this.camera.scale;
      this.mouse.wx = (this.mouse.x - this.vw / 2) / s + this.camera.x;
      this.mouse.wy = (this.mouse.y - this.vh / 2) / s + this.camera.y;
      p.angle = lerpAngle(p.angle, angleTo(p.x, p.y, this.mouse.wx, this.mouse.wy), dt * 16);
    } else if (p.moving) {
      p.angle = lerpAngle(p.angle, Math.atan2(move.y, move.x), dt * 12);
    }
    if (p.hidden) {
      const spot = this.level.hiding.find((h) => h.id === p.hideId);
      if (spot) p.angle = lerpAngle(p.angle, angleTo(p.x, p.y, this.mouse.wx || p.x + 30, this.mouse.wy || p.y), dt * 3);
    }
    if (this.missionTimer < 2.4) {
      const intro = $("#missionIntro");
      if (intro && !intro.classList.contains("is-hidden")) {
        // keep the first moments uncluttered
      }
    }
  };

  Game.prototype.updateCameraView = function (dt) {
    const p = this.player;
    const leadX = p.x + Math.cos(p.angle) * (p.moving ? 32 : 12);
    const leadY = p.y + Math.sin(p.angle) * (p.moving ? 32 : 12);
    const halfW = this.vw / (2 * this.camera.scale);
    const halfH = this.vh / (2 * this.camera.scale);
    let tx = leadX, ty = leadY;
    if (halfW * 2 >= WORLD_W) tx = WORLD_W / 2;
    else tx = clamp(tx, halfW, WORLD_W - halfW);
    if (halfH * 2 >= WORLD_H) ty = WORLD_H / 2;
    else ty = clamp(ty, halfH, WORLD_H - halfH);
    this.camera.x = lerp(this.camera.x, tx, 1 - Math.pow(0.001, dt));
    this.camera.y = lerp(this.camera.y, ty, 1 - Math.pow(0.001, dt));
  };

  /* ------------------------- guards ------------------------- */
  Game.prototype.guardSeesPlayer = function (g) {
    const p = this.player;
    if (!p || p.hidden) return false;
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    if (this.isVent(tx, ty)) return false;
    const maxRange = g.range * (p.crouching ? 0.72 : 1) * (g.state === "chase" ? 1.06 : 1);
    const d = dist(g.x, g.y, p.x, p.y);
    if (d > maxRange) return false;
    if (angleDiff(g.angle, angleTo(g.x, g.y, p.x, p.y)) > g.fov * 0.5) return false;
    return this.lineOfSight(g.x, g.y, p.x, p.y);
  };

  Game.prototype.startChase = function (g) {
    if (g.state === "chase") return;
    g.state = "chase";
    g.awareness = 1;
    g.lostTimer = 0;
    g.nav = [];
    g.alertFlash = 1;
    g.lastSeenX = this.player.x;
    g.lastSeenY = this.player.y;
    this.raiseAlert(13, g.x, g.y);
    this.flash = Math.max(this.flash, 0.3);
    this.shake = 5;
    this.sound.alarm();
    this.notify("SPOTTED", "Break line of sight — now", true);
    for (const other of this.level.guards) {
      if (other !== g && other.state !== "chase" && dist(other.x, other.y, g.x, g.y) < 500) {
        this.investigate(other, this.player.x, this.player.y);
      }
    }
  };

  Game.prototype.investigate = function (g, x, y) {
    if (g.state === "chase") return;
    g.state = "investigate";
    g.nav = [];
    g.goalX = x;
    g.goalY = y;
    g.investigateTimer = 7;
    g.searchTimer = 0;
    g.targetX = x;
    g.targetY = y;
    g.repathAt = 0;
    if (g.awareness < 0.12) g.awareness = 0.12;
    if (Math.random() < 0.35) this.sound.suspicion();
  };

  Game.prototype.moveGuardTo = function (g, tx, ty, speed, dt, repath = 0.55) {
    const goalChanged = !g.goalX || Math.hypot(g.goalX - tx, g.goalY - ty) > 8;
    if (!g.nav.length || goalChanged || this.time > (g.repathAt || 0)) {
      if (goalChanged || !g.nav.length) {
        g.nav = this.findPath(g.x, g.y, tx, ty, false);
        g.navIndex = 0;
        g.goalX = tx;
        g.goalY = ty;
      }
      g.repathAt = this.time + repath;
    }
    if (!g.nav.length) return false;
    while (g.navIndex < g.nav.length && dist(g.x, g.y, g.nav[g.navIndex].x, g.nav[g.navIndex].y) < 7) g.navIndex++;
    if (g.navIndex >= g.nav.length) return dist(g.x, g.y, tx, ty) < 18;
    const target = g.nav[g.navIndex];
    const a = angleTo(g.x, g.y, target.x, target.y);
    g.x += Math.cos(a) * speed * dt;
    g.y += Math.sin(a) * speed * dt;
    g.angle = lerpAngle(g.angle, a, dt * 7.5);
    g.stepPhase += dt * (speed / 18);
    return dist(g.x, g.y, tx, ty) < 14;
  };

  Game.prototype.updateGuard = function (g, dt) {
    g.alertFlash = Math.max(0, g.alertFlash - dt * 1.8);
    const sees = this.guardSeesPlayer(g);
    if (sees) {
      this.player.spotted = true;
      g.lastSeenX = this.player.x;
      g.lastSeenY = this.player.y;
      g.lostTimer = 0;
      const d = dist(g.x, g.y, this.player.x, this.player.y);
      const closeness = 1 - clamp(d / Math.max(1, g.range), 0, 1);
      let rate = 0.82 + closeness * 1.4;
      if (this.player.crouching) rate *= 0.55;
      if (this.player.sprinting) rate *= 1.28;
      if (g.state === "chase") rate *= 2.15;
      const old = g.awareness;
      g.awareness = Math.min(1, g.awareness + rate * dt);
      if (g.state === "patrol" || g.state === "return") {
        g.state = "suspicious";
        g.nav = [];
        g.suspicionTimer = 0;
      }
      if (old < 0.08 && g.awareness >= 0.08) this.sound.suspicion();
      if (g.state === "suspicious" || g.state === "investigate") {
        g.state = "suspicious";
        g.suspicionTimer += dt;
        g.angle = lerpAngle(g.angle, angleTo(g.x, g.y, this.player.x, this.player.y), dt * 5.2);
      }
      if (g.awareness >= 1 && g.state !== "chase") this.startChase(g);
    } else {
      if (g.state === "suspicious") {
        g.awareness = Math.max(0, g.awareness - dt * 0.27);
        g.suspicionTimer += dt;
        g.angle += Math.sin(this.time * 1.4 + g.id) * dt * 0.45;
        if ((g.awareness < 0.07 && g.suspicionTimer > 1.7) || g.suspicionTimer > 5) {
          this.investigate(g, g.lastSeenX || g.x, g.lastSeenY || g.y);
        }
      } else if (g.state === "chase") {
        g.awareness = Math.max(0.72, g.awareness - dt * 0.04);
        g.lostTimer += dt;
        if (g.lostTimer > 2.3) {
          g.state = "search";
          g.nav = [];
          g.searchTimer = 3.2;
          g.searchAngle = g.angle;
        }
      } else {
        g.awareness = Math.max(0, g.awareness - dt * 0.38);
      }
    }

    if (g.state === "chase") {
      const targetX = sees ? this.player.x : g.lastSeenX;
      const targetY = sees ? this.player.y : g.lastSeenY;
      this.moveGuardTo(g, targetX, targetY, g.speed * 1.52, dt, 0.42);
      if (sees) {
        g.angle = lerpAngle(g.angle, angleTo(g.x, g.y, this.player.x, this.player.y), dt * 9);
      }
      this.alert = clamp(this.alert + dt * 0.62, 0, 100);
      this.lastDetectionAt = Math.max(this.lastDetectionAt, this.time - 0.2);
      if (!this.player.hidden && !this.player.inVent && dist(g.x, g.y, this.player.x, this.player.y) < 22) {
        this.failMission("A guard got their hands on you.");
      }
    } else if (g.state === "suspicious") {
      // freeze and stare; tension is the point
    } else if (g.state === "investigate") {
      g.investigateTimer -= dt;
      const reached = this.moveGuardTo(g, g.targetX, g.targetY, g.speed * 1.16, dt, 0.7);
      if (reached) {
        g.investigateTimer = 0;
        g.state = "search";
        g.searchTimer = 3.4;
        g.searchAngle = g.angle;
        g.nav = [];
      } else if (g.investigateTimer <= 0) {
        g.state = "return";
        g.nav = [];
      }
    } else if (g.state === "search") {
      g.searchTimer -= dt;
      g.angle += Math.sin(this.time * 1.8 + g.id * 2) * dt * 0.85;
      if (g.searchTimer <= 0) {
        g.state = "return";
        g.nav = [];
      }
    } else if (g.state === "return") {
      const wp = g.path[g.waypoint % g.path.length];
      const tx = (wp[0] + 0.5) * TILE;
      const ty = (wp[1] + 0.5) * TILE;
      const reached = this.moveGuardTo(g, tx, ty, g.speed, dt, 0.8);
      if (reached) {
        g.state = "patrol";
        g.wait = 0.7;
        g.nav = [];
      }
    } else {
      // patrol
      if (g.wait > 0) {
        g.wait -= dt;
        g.angle = g.scanBase + Math.sin(this.time * 1.55 + g.scanPhase) * 0.64;
      } else {
        const wp = g.path[g.waypoint % g.path.length];
        const tx = (wp[0] + 0.5) * TILE;
        const ty = (wp[1] + 0.5) * TILE;
        const reached = this.moveGuardTo(g, tx, ty, g.speed, dt, 0.8);
        if (reached) {
          g.wait = 1.15 + (g.id % 3) * 0.35;
          g.scanBase = g.angle;
          g.waypoint = (g.waypoint + 1) % g.path.length;
          g.nav = [];
        }
      }
    }
    g.x = clamp(g.x, TILE + 8, WORLD_W - TILE - 8);
    g.y = clamp(g.y, TILE + 8, WORLD_H - TILE - 8);
  };

  /* ------------------------- cameras ------------------------- */
  Game.prototype.updateCamera = function (cam, dt) {
    const disabled = this.level.camerasDisabledUntil > this.time;
    cam.disabled = disabled;
    cam.flash = Math.max(0, cam.flash - dt * 2);
    if (!disabled) {
      cam.angle = cam.angleBase + Math.sin(this.time * cam.speed + cam.phase) * cam.sweep;
    }
    cam.alarmCooldown = Math.max(0, cam.alarmCooldown - dt);
    const p = this.player;
    let sees = false;
    if (!disabled && cam.alarmCooldown <= 0 && !p.hidden) {
      const tx = Math.floor(p.x / TILE);
      const ty = Math.floor(p.y / TILE);
      if (!this.isVent(tx, ty)) {
        const d = dist(cam.px, cam.py, p.x, p.y);
        if (d < cam.range && angleDiff(cam.angle, angleTo(cam.px, cam.py, p.x, p.y)) < cam.fov * 0.5) {
          sees = this.lineOfSight(cam.px, cam.py, p.x, p.y);
        }
      }
    }
    if (sees) {
      this.player.spotted = true;
      const crest = 1 - clamp(dist(cam.px, cam.py, p.x, p.y) / cam.range, 0, 1);
      cam.confidence += dt * (0.52 + crest * 0.75) * (p.crouching ? 0.62 : 1);
      if (cam.confidence > 0.18 && !cam.beeped) { cam.beeped = true; this.sound.tone(1180, 0.04, "square", 0.028); }
      if (cam.confidence >= 1) {
        cam.confidence = 0;
        cam.beeped = false;
        cam.alarmCooldown = 5.5;
        cam.flash = 1;
        this.cameraAlarm(cam);
      }
    } else {
      cam.confidence = Math.max(0, cam.confidence - dt * 0.55);
      if (cam.confidence < 0.15) cam.beeped = false;
    }
  };

  Game.prototype.cameraAlarm = function (cam) {
    this.raiseAlert(17, cam.px, cam.py);
    this.flash = Math.max(this.flash, 0.42);
    this.shake = 8;
    this.sound.cameraAlert();
    this.addFloatText(cam.px, cam.py - 28, "CAMERA ALARM", "255,82,101");
    this.notify("CAMERA ALARM", "The feed just went hot", true);
    for (const g of this.level.guards) {
      if (g.state !== "chase" && dist(g.x, g.y, cam.px, cam.py) < 760) {
        this.investigate(g, this.player.x, this.player.y);
      }
    }
    this.particles.push({ type: "cameraBurst", x: cam.px, y: cam.py, life: 0, maxLife: 0.7, color: "255,82,101" });
  };

  /* ------------------------- lasers ------------------------- */
  Game.prototype.updateLasers = function (dt) {
    const disabled = this.level.lasersDisabledUntil > this.time;
    let activeCount = 0;
    for (const laser of this.level.lasers) {
      laser.hitCooldown = Math.max(0, laser.hitCooldown - dt);
      const cycle = (this.time + laser.phase) % laser.period;
      const on = !disabled && cycle < laser.period * laser.duty;
      laser.active = on;
      if (!on) continue;
      activeCount++;
      const d = distToSegment(this.player.x, this.player.y, laser.x1p, laser.y1p, laser.x2p, laser.y2p);
      const under = laser.low && this.player.crouching;
      if (d < this.player.r + 2.5 && !under && !this.player.hidden && laser.hitCooldown <= 0) {
        laser.hitCooldown = 1.25;
        this.raiseAlert(18, this.player.x, this.player.y);
        this.flash = Math.max(this.flash, 0.55);
        this.shake = 10;
        this.sound.laser();
        this.notify("LASER BREACH", laser.low ? "Crouch under the low beam" : "The grid felt that", true);
        const midX = (laser.x1p + laser.x2p) / 2;
        const midY = (laser.y1p + laser.y2p) / 2;
        const a = angleTo(midX, midY, this.player.x, this.player.y);
        this.player.x += Math.cos(a) * 17;
        this.player.y += Math.sin(a) * 17;
        if (this.circleHitsWall(this.player.x, this.player.y, this.player.r)) {
          this.player.x -= Math.cos(a) * 17;
          this.player.y -= Math.sin(a) * 17;
        }
        this.addSparkBurst(this.player.x, this.player.y, "255,82,101", 12);
        for (const g of this.level.guards) {
          if (g.state !== "chase" && dist(g.x, g.y, this.player.x, this.player.y) < 330) this.investigate(g, this.player.x, this.player.y);
        }
      }
    }
    this.level.activeLasers = activeCount;
  };

  /* ------------------------- projectile, particles, alert ------------------------- */
  Game.prototype.updateProjectiles = function (dt) {
    for (const proj of this.projectiles) {
      if (proj.done) continue;
      proj.life -= dt;
      proj.x += Math.cos(proj.angle) * proj.speed * dt;
      proj.y += Math.sin(proj.angle) * proj.speed * dt;
      proj.spin += dt * 14;
      if (this.circleHitsWall(proj.x, proj.y, 3)) {
        proj.x -= Math.cos(proj.angle) * proj.speed * dt;
        proj.y -= Math.sin(proj.angle) * proj.speed * dt;
        this.landProjectile(proj);
      } else if (proj.life <= 0) {
        this.landProjectile(proj);
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
  };

  Game.prototype.landProjectile = function (proj) {
    if (proj.done) return;
    proj.done = true;
    this.sound.ping();
    this.emitNoise(proj.x, proj.y, 330, "stone");
    this.addSparkBurst(proj.x, proj.y, "185,244,228", 7);
    this.addFloatText(proj.x, proj.y - 12, "NOISE", "159,242,213");
  };

  Game.prototype.updateParticles = function (dt) {
    for (const p of this.particles) {
      p.life += dt;
      if (p.type === "ring") p.radius = lerp(p.radius, p.maxRadius, dt * 4);
      if (p.type === "spark" || p.type === "cameraBurst") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.15, dt);
        p.vy *= Math.pow(0.15, dt);
      }
      if (p.type === "float") p.y -= 22 * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
    for (const f of this.floaters) {
      f.life += dt;
      f.y -= 20 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life < f.maxLife);
  };

  Game.prototype.addSparkBurst = function (x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = 30 + Math.random() * 110;
      this.particles.push({
        type: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, maxLife: 0.35 + Math.random() * 0.35, r: 1 + Math.random() * 2.2, color
      });
    }
  };

  Game.prototype.addFloatText = function (x, y, text, color = "111,242,209") {
    this.floaters.push({ x, y, text, color, life: 0, maxLife: 1.35 });
  };

  Game.prototype.raiseAlert = function (amount, x, y) {
    this.alert = clamp(this.alert + amount, 0, 100);
    this.peakAlert = Math.max(this.peakAlert || 0, this.alert);
    this.lastDetectionAt = this.time;
    this.flash = Math.max(this.flash, 0.16);
    if (this.alert >= 100) {
      if (this.state === "playing") this.failMission("The facility went into total lockdown.");
    }
  };

  Game.prototype.updateAlert = function (dt) {
    const anyChase = this.level.guards.some((g) => g.state === "chase");
    const anySuspicious = this.level.guards.some((g) => g.state === "suspicious" || g.state === "investigate");
    const camHot = this.level.cameras.some((c) => c.confidence > 0.08);
    if (anyChase) this.lastDetectionAt = this.time;
    if (!anyChase && !anySuspicious && !camHot && this.time - this.lastDetectionAt > 4.2) {
      this.alert = Math.max(0, this.alert - dt * 2.1);
    } else if (anyChase && this.time - this.lastDetectionAt > 1) {
      this.alert = Math.min(100, this.alert + dt * 0.52);
      this.lastDetectionAt = this.time;
    }
    this.peakAlert = Math.max(this.peakAlert || 0, this.alert);
    if (this.alert >= 100 && this.state === "playing") this.failMission("The facility went into total lockdown.");
  };

  /* ------------------------- interaction ------------------------- */
  Game.prototype.nearest = function (list, radius) {
    let best = null;
    let bestD = radius;
    for (const item of list) {
      if (item.collected) continue;
      const d = dist(this.player.x, this.player.y, item.px, item.py);
      if (d < bestD) { bestD = d; best = item; }
    }
    return best;
  };

  Game.prototype.updateInteraction = function () {
    const p = this.player;
    const l = this.level;
    let item = null;
    if (p.hidden) {
      item = { kind: "unhide", label: "LEAVE HIDING SPOT" };
    } else {
      const target = this.nearest(l.objectives, 48);
      if (target) item = { kind: "objective", label: `TAKE ${target.name}`, target };
    }
    if (!item) {
      const terminal = l.terminals.find((t) => !t.usedPermanent && dist(p.x, p.y, t.px, t.py) < 46 && this.time >= t.cooldown);
      if (terminal) {
        item = {
          kind: "terminal",
          label: terminal.disables === "cameras" ? "SLICE CCTV · 18s BLACKOUT" : "CUT LASER RELAY · 18s",
          target: terminal
        };
      }
    }
    if (!item) {
      const spot = l.hiding.find((h) => !h.occupied && dist(p.x, p.y, h.px, h.py) < 48);
      if (spot) item = { kind: "hide", label: spot.type === "cabinet" ? "HIDE IN CABINET" : "HIDE IN LOCKER", target: spot };
    }
    if (!item) {
      const allDone = l.objectives.every((o) => o.collected);
      if (dist(p.x, p.y, l.exit.px, l.exit.py) < 54) {
        item = allDone
          ? { kind: "exit", label: "EXTRACT" }
          : { kind: "exitLocked", label: `${l.objectives.filter((o) => !o.collected).length} OBJECTIVE${l.objectives.filter((o) => !o.collected).length === 1 ? "" : "S"} REMAIN` };
      }
    }
    this.interactable = item;
    const prompt = $("#interactPrompt");
    if (item && this.state === "playing") {
      prompt.classList.remove("is-hidden");
      $("#interactText").textContent = item.label;
      $("#promptProgress").style.width = "0%";
    } else {
      prompt.classList.add("is-hidden");
    }
    // automatic pickups: secondary loot is grabbed by touch
    for (const loot of l.loot) {
      if (!loot.collected && dist(p.x, p.y, loot.px, loot.py) < 22) {
        loot.collected = true;
        this.lootCollected++;
        this.sound.loot();
        this.addFloatText(loot.px, loot.py - 12, `+${loot.value}`, "255,195,102");
        this.addSparkBurst(loot.px, loot.py, "255,195,102", 9);
        this.notify("VALUABLE SECURED", loot.name);
        this.updateObjectivesUI();
      }
    }
  };

  Game.prototype.interact = function () {
    if (this.state !== "playing" || !this.interactable) return;
    const item = this.interactable;
    const p = this.player;
    if (item.kind === "unhide") {
      p.hidden = false;
      const spot = this.level.hiding.find((h) => h.id === p.hideId);
      if (spot) spot.occupied = false;
      p.hideId = null;
      this.sound.tone(260, 0.08, "square", 0.025, 60);
      this.notify("COVER BROKEN", "Back into the dark");
      this.updateHUD(true);
      return;
    }
    if (item.kind === "hide") {
      p.hidden = true;
      p.hideId = item.target.id;
      item.target.occupied = true;
      p.x = item.target.px;
      p.y = item.target.py;
      this.sound.noise(0.18, 220, 0.04);
      this.notify("HIDDEN", "Hold still. Breathe.");
      this.addFloatText(p.x, p.y - 22, "CONCEALED", "111,242,209");
      this.updateHUD(true);
      return;
    }
    if (item.kind === "objective") {
      const target = item.target;
      target.collected = true;
      this.sound.loot();
      this.addSparkBurst(target.px, target.py, "126,242,213", 18);
      this.addFloatText(target.px, target.py - 20, "SECURED", "126,242,213");
      this.raiseAlert(2.2, p.x, p.y);
      const remaining = this.level.objectives.filter((o) => !o.collected).length;
      if (remaining === 0) {
        this.level.exit.active = true;
        this.notify("OBJECTIVES COMPLETE", "Extraction is live — move");
        this.addFloatText(this.level.exit.px, this.level.exit.py - 30, "EXTRACTION LIVE", "111,242,209");
        this.sound.unlock();
      } else {
        this.notify("OBJECTIVE SECURED", `${target.name} — ${remaining} to go`);
      }
      this.updateObjectivesUI();
      this.updateHUD(true);
      return;
    }
    if (item.kind === "terminal") {
      const terminal = item.target;
      terminal.cooldown = this.time + 28;
      terminal.activeUntil = this.time + 18;
      if (terminal.disables === "cameras") {
        this.level.camerasDisabledUntil = this.time + 18;
        this.level.cameras.forEach((c) => { c.confidence = 0; c.beeped = false; });
        this.notify("CCTV SLICED", "Camera grid dark for 18 seconds");
      } else {
        this.level.lasersDisabledUntil = this.time + 18;
        this.level.lasers.forEach((l) => { l.hitCooldown = 0; });
        this.notify("LASER RELAY CUT", "Grid down for 18 seconds");
      }
      this.sound.unlock();
      this.addSparkBurst(terminal.px, terminal.py, "111,242,209", 13);
      this.addFloatText(terminal.px, terminal.py - 18, "OFFLINE", "111,242,209");
      this.updateHUD(true);
      return;
    }
    if (item.kind === "exit") {
      this.completeMission();
      return;
    }
    if (item.kind === "exitLocked") {
      this.notify("EXTRACTION LOCKED", "Recover every primary objective first");
      this.sound.tone(210, 0.12, "square", 0.035, -40);
    }
  };

  Game.prototype.toggleCrouch = function () {
    if (this.state !== "playing" || !this.player) return;
    this.player.crouching = !this.player.crouching;
    $("#touchCrouch").classList.toggle("active", this.player.crouching);
    this.sound.tone(this.player.crouching ? 300 : 390, 0.06, "triangle", 0.022, this.player.crouching ? -55 : 55);
    this.updateHUD(true);
  };

  Game.prototype.throwNoise = function () {
    if (this.state !== "playing" || !this.player) return;
    if (this.throwCooldown > 0) {
      this.sound.tone(170, 0.05, "square", 0.02);
      return;
    }
    this.throwCooldown = 3.2;
    this.throwFlash = 1;
    const p = this.player;
    let angle = p.angle;
    if (!IS_TOUCH && performance.now() - this.mouse.movedAt < 2600) {
      angle = angleTo(p.x, p.y, this.mouse.wx, this.mouse.wy);
    }
    p.angle = angle;
    const proj = { x: p.x + Math.cos(angle) * 15, y: p.y + Math.sin(angle) * 15, angle, speed: 455, life: 0.58, spin: 0, done: false };
    this.projectiles.push(proj);
    this.sound.throwStone();
    this.addFloatText(p.x, p.y - 20, "THROW", "174,236,219");
    this.updateHUD(true);
  };

  /* ------------------------- HUD + objective state ------------------------- */
  Game.prototype.updateObjectivesUI = function () {
    if (!this.level) return;
    const objectives = this.level.objectives;
    const done = objectives.filter((o) => o.collected).length;
    $("#objectiveCount").textContent = `${done} / ${objectives.length}`;
    $("#objectiveList").innerHTML = objectives.map((o) => `
      <div class="obj-item ${o.collected ? "done" : ""}">
        <span class="obj-dot"></span>
        <span>${o.collected ? o.name : o.short}<span class="obj-sub">${o.collected ? "SECURED" : "PRIMARY"}</span></span>
      </div>`).join("");
    const next = objectives.find((o) => !o.collected);
    $("#objectiveSummary").innerHTML = next
      ? `<span class="micro-label">EXTRACTION</span><b>${next.short}</b>`
      : `<span class="micro-label">EXTRACTION</span><b>REACH THE EXTRACTION POINT</b>`;
  };

  Game.prototype.updateHUD = function (force) {
    if (!this.level) return;
    const alert = this.alert || 0;
    const anyChase = this.level.guards.some((g) => g.state === "chase");
    const anySuspicious = this.level.guards.some((g) => g.state === "suspicious" || g.state === "investigate" || g.state === "search");
    const camHot = this.level.cameras.some((c) => c.confidence > 0.08);
    const fill = $("#alertFill");
    fill.style.width = `${alert}%`;
    fill.classList.toggle("warn", alert >= 42 && alert < 72);
    fill.classList.toggle("danger", alert >= 72 || anyChase);
    const state = $("#alertState");
    let label = "UNDETECTED";
    let cls = "";
    if (alert >= 72 || anyChase) { label = "LOCKDOWN"; cls = "danger"; }
    else if (alert >= 38 || anySuspicious || camHot) { label = "SUSPICIOUS"; cls = "warn"; }
    state.textContent = label;
    state.style.color = label === "LOCKDOWN" ? "var(--red)" : label === "SUSPICIOUS" ? "var(--amber)" : "var(--mint)";
    $(".alert-cluster").classList.toggle("danger", cls === "danger");
    const vis = $("#visibilityChip");
    const vt = $("#visibilityText");
    vis.classList.remove("exposed", "hidden", "vent");
    if (this.player.hidden) { vt.textContent = "HIDDEN"; vis.classList.add("hidden"); }
    else if (this.player.inVent) { vt.textContent = "VENT CRAWL"; vis.classList.add("vent"); }
    else if (this.player.spotted) { vt.textContent = "EXPOSED"; vis.classList.add("exposed"); }
    else if (this.player.crouching) { vt.textContent = "LOW PROFILE"; vis.classList.add("hidden"); }
    else { vt.textContent = "CONCEALED"; }
    $("#stanceLabel").textContent = this.player.hidden ? "HIDDEN" : this.player.inVent ? "CRAWLING" : this.player.crouching ? "CROUCHED" : this.player.sprinting ? "SPRINTING" : "STEALTH";
    const ready = this.throwCooldown <= 0;
    $("#throwStatus").textContent = ready ? "READY" : `${this.throwCooldown.toFixed(1)}s`;
    $("#throwTool").classList.toggle("ready", ready);
    $("#throwTool").classList.toggle("cooling", !ready);
    $("#cooldownRing").style.width = ready ? "100%" : `${(1 - this.throwCooldown / 3.2) * 100}%`;
    const terminalNear = this.level.terminals.find((t) => dist(this.player.x, this.player.y, t.px, t.py) < 46);
    if (terminalNear && terminalNear.activeUntil > this.time) {
      const left = Math.ceil(terminalNear.activeUntil - this.time);
      $("#visibilityText").textContent = `${terminalNear.disables === "cameras" ? "CAMS" : "GRID"} OFFLINE · ${left}s`;
    }
    if (force) this.updateObjectivesUI();
  };

  /* ------------------------- mission end ------------------------- */
  Game.prototype.completeMission = function () {
    if (this.state !== "playing") return;
    this.state = "won";
    this.sound.success();
    const time = this.missionTimer;
    const stars = 1 + (this.peakAlert < 55 ? 1 : 0) + (time < this.level.def.par ? 1 : 0);
    this.result = {
      success: true,
      stars,
      time,
      alert: Math.round(this.peakAlert),
      loot: this.lootCollected,
      totalLoot: this.lootTotal
    };
    this.flash = 0.45;
    this.flashColor = "111,242,209";
    this.addSparkBurst(this.player.x, this.player.y, "111,242,209", 28);
    this.fillResultModal();
    setTimeout(() => this.showModal("result"), 550);
  };

  Game.prototype.failMission = function (reason) {
    if (this.state !== "playing") return;
    this.state = "failed";
    this.sound.fail();
    this.flash = 0.8;
    this.flashColor = "255,82,101";
    this.shake = 14;
    this.result = { success: false, reason, time: this.missionTimer, alert: Math.round(this.peakAlert) };
    this.fillResultModal();
    setTimeout(() => this.showModal("result"), 650);
  };

  Game.prototype.fillResultModal = function () {
    const modal = $("#resultModal");
    const r = this.result;
    if (!r) return;
    modal.classList.toggle("fail", !r.success);
    if (r.success) {
      $("#resultKicker").textContent = "CONTRACT COMPLETE";
      $("#resultTitle").textContent = r.alert < 25 ? "GHOST PROTOCOL" : r.alert < 60 ? "CLEAN GETAWAY" : "SKIN OF YOUR TEETH";
      $("#resultSub").textContent = r.loot === r.totalLoot ? "Every piece secured. Not a soul saw you." : "The primary objective is secure. Some things were left behind.";
      $("#resultTime").textContent = fmtTime(r.time);
      $("#resultAlert").textContent = `${r.alert}%`;
      $("#resultLoot").textContent = `${r.loot} / ${r.totalLoot}`;
      $$("#resultStars span").forEach((s, i) => s.classList.toggle("on", i < r.stars));
      $("#retryBtn").classList.remove("is-hidden");
      $("#nextBtn").classList.remove("is-hidden");
      $("#nextBtn .btn-label").textContent = this.selected < LEVELS.length - 1 ? "NEXT OPERATION" : "RETURN TO OPS";
    } else {
      $("#resultKicker").textContent = "MISSION COMPROMISED";
      $("#resultTitle").textContent = "HEIST BLOWN";
      $("#resultSub").textContent = r.reason || "The facility locked down.";
      $("#resultTime").textContent = fmtTime(r.time);
      $("#resultAlert").textContent = `${r.alert}%`;
      $("#resultLoot").textContent = `${this.lootCollected} / ${this.lootTotal}`;
      $("#nextBtn").classList.add("is-hidden");
      $("#retryBtn").classList.remove("is-hidden");
    }
  };

  Game.prototype.notify = function (kicker, text, danger = false) {
    const toast = $("#toast");
    if (!toast) return;
    $("#toastKicker").textContent = kicker;
    $("#toastText").textContent = text;
    toast.classList.toggle("danger", danger);
    toast.classList.add("show");
    this.toastTimer = 2.8;
  };

  /* ============================================================
     RENDER — dispatch
     ============================================================ */
  Game.prototype.render = function () {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.vw, this.vh);
    if (this.state === "menu") {
      this.drawMenuBackground();
    } else if (this.level && this.player) {
      this.drawGameScene();
    } else {
      ctx.fillStyle = "#05090c";
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
  };

  /* ============================================================
     RENDER — menu atmosphere
     ============================================================ */
  Game.prototype.drawMenuBackground = function () {
    const ctx = this.ctx;
    const t = this.time;
    const w = this.vw;
    const h = this.vh;
    // dusk sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#040a10");
    sky.addColorStop(0.42, "#071118");
    sky.addColorStop(0.72, "#0a1518");
    sky.addColorStop(1, "#030708");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // cold moon + bloom
    const mx = w * 0.72;
    const my = h * 0.18;
    const moon = ctx.createRadialGradient(mx, my, 2, mx, my, Math.max(w, h) * 0.4);
    moon.addColorStop(0, "rgba(185,236,226,.16)");
    moon.addColorStop(0.2, "rgba(101,182,177,.08)");
    moon.addColorStop(1, "rgba(9,24,27,0)");
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, TAU);
    ctx.fillStyle = "rgba(203,240,231,.55)";
    ctx.shadowBlur = 55;
    ctx.shadowColor = "rgba(137,227,210,.45)";
    ctx.fill();
    ctx.shadowBlur = 0;
    // distant haze
    const haze = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.86);
    haze.addColorStop(0, "rgba(48,103,106,0)");
    haze.addColorStop(0.52, "rgba(35,84,87,.12)");
    haze.addColorStop(1, "rgba(6,17,19,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
    // skyline
    if (this.menuScene) {
      for (const b of this.menuScene.buildings) {
        const base = h * (b.layer === 0 ? 0.86 : 0.89);
        const top = base - b.h;
        ctx.fillStyle = b.layer === 0 ? "rgba(5,12,16,.88)" : "rgba(4,10,13,.94)";
        ctx.fillRect(b.x, top, b.w, b.h + 4);
        ctx.fillStyle = b.layer === 0 ? "rgba(155,207,198,.05)" : "rgba(155,207,198,.035)";
        ctx.fillRect(b.x, top, b.w, 1);
        for (const win of b.windows) {
          const flicker = 0.68 + Math.sin(t * 0.35 + win.t) * 0.32;
          ctx.fillStyle = `rgba(126,204,192,${win.a * flicker})`;
          ctx.fillRect(b.x + win.x, top + win.y, win.w, win.h);
        }
        if (b.antenna) {
          ctx.fillStyle = "rgba(4,9,12,.95)";
          ctx.fillRect(b.x + b.w * 0.7, top - 26, 1, 26);
          const blink = Math.sin(t * 1.6 + b.blink) > 0.32;
          if (blink) {
            ctx.fillStyle = "rgba(255,82,101,.75)";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(255,82,101,.8)";
            ctx.fillRect(b.x + b.w * 0.7 - 1, top - 27, 3, 3);
            ctx.shadowBlur = 0;
          }
        }
      }
    }
    // searchlights
    this.drawMenuSearchlight(w * 0.79, h * 0.09, 2.13 + Math.sin(t * 0.07) * 0.26, h * 0.92, 0.071, "163,243,222");
    this.drawMenuSearchlight(w * 0.21, h * 0.06, 1.18 + Math.sin(t * 0.05 + 2) * 0.19, h * 0.82, 0.045, "255,199,126");
    this.drawMenuSearchlight(w * 0.96, h * 0.3, 2.65 + Math.sin(t * 0.04 + 3) * 0.2, h * 0.74, 0.035, "124,169,255");
    // low mist
    const mist = ctx.createLinearGradient(0, h * 0.65, 0, h);
    mist.addColorStop(0, "rgba(9,25,26,0)");
    mist.addColorStop(0.55, "rgba(20,48,47,.18)");
    mist.addColorStop(1, "rgba(2,7,8,.23)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    // roof deck / perspective
    const baseY = h * 0.88;
    ctx.fillStyle = "rgba(3,7,9,.94)";
    ctx.fillRect(0, baseY, w, h - baseY);
    ctx.strokeStyle = "rgba(118,190,180,.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const x = (i / 17) * w * 1.4 - w * 0.2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + (x - w / 2) * 0.25, baseY);
      ctx.lineTo(x, h + 15);
      ctx.stroke();
    }
    for (let i = 1; i < 7; i++) {
      const y = baseY + Math.pow(i / 7, 1.7) * (h - baseY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // foreground rail
    ctx.strokeStyle = "rgba(107,169,160,.17)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, baseY - 13);
    ctx.lineTo(w, baseY - 16);
    ctx.stroke();
    ctx.strokeStyle = "rgba(107,169,160,.1)";
    for (let x = 20; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, baseY - 16);
      ctx.lineTo(x, baseY + 18);
      ctx.stroke();
    }
    // rain
    if (this.menuScene) {
      ctx.lineWidth = 1;
      for (const r of this.menuScene.rain) {
        ctx.strokeStyle = `rgba(165,221,214,${r.a})`;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.len * 0.16, r.y + r.len);
        ctx.stroke();
      }
      for (const e of this.menuScene.embers) {
        ctx.fillStyle = `rgba(114,224,199,${0.12 + 0.1 * Math.sin(t + e.a)})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, TAU);
        ctx.fill();
      }
    }
    // lower teal wash to tie canvas to UI
    const wash = ctx.createLinearGradient(0, h * 0.55, 0, h);
    wash.addColorStop(0, "rgba(3,11,13,0)");
    wash.addColorStop(1, "rgba(2,8,10,.54)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  };

  Game.prototype.drawMenuSearchlight = function (x, y, angle, length, width, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, `rgba(${color},.11)`);
    grad.addColorStop(0.55, `rgba(${color},.025)`);
    grad.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, -length * width);
    ctx.lineTo(length, length * width);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${color},.12)`;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  /* ============================================================
     RENDER — mission world
     ============================================================ */
  Game.prototype.applyWorld = function (ctx, shake = true) {
    const sx = shake && this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const sy = shake && this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(this.vw / 2 + sx, this.vh / 2 + sy);
    ctx.scale(this.camera.scale, this.camera.scale);
    ctx.translate(-this.camera.x, -this.camera.y);
  };

  Game.prototype.drawGameScene = function () {
    const ctx = this.ctx;
    const l = this.level;
    ctx.fillStyle = l.theme.fog;
    ctx.fillRect(0, 0, this.vw, this.vh);
    this.applyWorld(ctx);
    this.drawFloor(ctx);
    this.drawWalls(ctx);
    this.drawFloorDetails(ctx);
    this.drawStaticProps(ctx);
    ctx.restore();

    this.drawDarkness(ctx);
    this.drawLightBloom(ctx);

    this.applyWorld(ctx, false);
    this.drawVisionCones(ctx);
    this.drawLaserBeams(ctx);
    this.drawInteractiveProps(ctx);
    this.drawGuards(ctx);
    this.drawPlayer(ctx);
    this.drawParticles(ctx);
    this.drawFloatingText(ctx);
    ctx.restore();

    this.drawScreenEffects(ctx);
  };

  /* ------------------------- environment ------------------------- */
  Game.prototype.drawFloor = function (ctx) {
    const l = this.level;
    const theme = l.theme;
    ctx.fillStyle = theme.floor;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const ch = l.tiles[y][x];
        if (ch === "#") continue;
        const n = hash2(x, y);
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = n > 0.52 ? theme.floorAlt : theme.floor;
        ctx.fillRect(px, py, TILE, TILE);
        if (ch === "V") {
          ctx.fillStyle = "rgba(2,9,10,.75)";
          ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
          ctx.strokeStyle = "rgba(121,218,199,.16)";
          ctx.lineWidth = 1;
          for (let gy = py + 6; gy < py + TILE - 4; gy += 5) {
            ctx.beginPath();
            ctx.moveTo(px + 5, gy);
            ctx.lineTo(px + TILE - 5, gy);
            ctx.stroke();
          }
          ctx.strokeStyle = "rgba(121,218,199,.09)";
          ctx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
        } else {
          if (n > 0.86) {
            ctx.fillStyle = "rgba(255,255,255,.018)";
            ctx.fillRect(px + 7, py + 9, 13, 1);
            ctx.fillRect(px + 11, py + 22, 7, 1);
          }
          ctx.strokeStyle = theme.floorLine;
          ctx.lineWidth = 0.7;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        }
      }
    }
  };

  Game.prototype.drawWalls = function (ctx) {
    const l = this.level;
    const theme = l.theme;
    // cast shadows first
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        if (l.tiles[y][x] !== "#") continue;
        const below = l.tiles[y + 1]?.[x];
        if (below && below !== "#") {
          const g = ctx.createLinearGradient(0, (y + 1) * TILE, 0, (y + 1) * TILE + 20);
          g.addColorStop(0, "rgba(0,0,0,.46)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(x * TILE, (y + 1) * TILE, TILE, 20);
        }
        if (l.tiles[y]?.[x + 1] && l.tiles[y][x + 1] !== "#") {
          const g = ctx.createLinearGradient((x + 1) * TILE, 0, (x + 1) * TILE + 11, 0);
          g.addColorStop(0, "rgba(0,0,0,.32)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect((x + 1) * TILE, y * TILE, 11, TILE);
        }
      }
    }
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (l.tiles[y][x] !== "#") continue;
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = theme.wall;
        ctx.fillRect(px, py, TILE, TILE);
        // recessed panel
        ctx.fillStyle = "rgba(0,0,0,.16)";
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = "rgba(255,255,255,.025)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
        const above = l.tiles[y - 1]?.[x];
        if (above !== "#") {
          ctx.fillStyle = theme.wallTop;
          ctx.fillRect(px, py, TILE, 3);
          ctx.fillStyle = "rgba(255,255,255,.06)";
          ctx.fillRect(px, py, TILE, 1);
        }
        const left = l.tiles[y]?.[x - 1];
        if (left !== "#") {
          ctx.fillStyle = theme.wallEdge;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(px, py, 1, TILE);
          ctx.globalAlpha = 1;
        }
        if (hash2(x, y) > 0.82) {
          ctx.fillStyle = "rgba(255,255,255,.03)";
          ctx.fillRect(px + 8, py + 14, 18, 1);
          ctx.fillRect(px + 14, py + 27, 9, 1);
        }
      }
    }
  };

  Game.prototype.drawFloorDetails = function (ctx) {
    const l = this.level;
    const theme = l.theme;
    for (const d of l.decals) {
      if (d.type === "speck") {
        ctx.fillStyle = `rgba(185,225,215,${d.a})`;
        ctx.fillRect(d.x, d.y, d.r, d.r);
      } else if (d.type === "stripe") {
        ctx.save();
        ctx.translate(d.x * TILE, d.y * TILE);
        ctx.rotate(d.rot);
        for (let i = 0; i < d.w * TILE; i += 14) {
          ctx.fillStyle = "rgba(255,195,102,.13)";
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 7, 0);
          ctx.lineTo(i + 1, 10);
          ctx.lineTo(i - 6, 10);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (d.type === "text") {
        ctx.save();
        ctx.translate(d.x * TILE, d.y * TILE);
        ctx.rotate(d.rot);
        ctx.font = "600 10px 'Barlow Condensed', sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillStyle = "rgba(162,214,205,.13)";
        ctx.fillText(d.text, 0, 0);
        ctx.restore();
      } else if (d.type === "arrow") {
        ctx.save();
        ctx.translate(d.x * TILE, d.y * TILE);
        ctx.rotate(d.rot);
        ctx.strokeStyle = "rgba(186,236,224,.14)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(28, 4);
        ctx.moveTo(21, -2);
        ctx.lineTo(28, 4);
        ctx.lineTo(21, 10);
        ctx.stroke();
        ctx.restore();
      }
    }
    // extraction pad floor marking
    const e = l.exit;
    ctx.save();
    ctx.translate(e.px, e.py);
    ctx.strokeStyle = l.exit.active ? "rgba(111,242,209,.34)" : "rgba(140,161,160,.13)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 23 + i * 7 + Math.sin(this.time * 2 + i) * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.lineTo(18, 18);
    ctx.moveTo(18, -18);
    ctx.lineTo(-18, 18);
    ctx.strokeStyle = l.exit.active ? "rgba(111,242,209,.16)" : "rgba(140,161,160,.06)";
    ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawStaticProps = function (ctx) {
    const l = this.level;
    // light fixtures are part of the architecture, before darkness
    for (const light of l.lights) {
      ctx.save();
      ctx.translate(light.px, light.py);
      ctx.fillStyle = "rgba(3,8,10,.9)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(light.color, 0.5 + Math.sin(this.time * 1.2 + light.px) * 0.08);
      ctx.shadowBlur = 18;
      ctx.shadowColor = rgba(light.color, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // hiding spot bodies
    for (const spot of l.hiding) this.drawHidingSpot(ctx, spot);
    // terminals
    for (const terminal of l.terminals) this.drawTerminal(ctx, terminal);
    // cameras body
    for (const cam of l.cameras) this.drawCameraBody(ctx, cam);
  };

  /* ------------------------- lighting ------------------------- */
  Game.prototype.drawDarkness = function (ctx) {
    const dark = this.darkCtx;
    const l = this.level;
    dark.setTransform(1, 0, 0, 1, 0, 0);
    dark.clearRect(0, 0, this.vw, this.vh);
    dark.fillStyle = "rgba(3,8,11,0.72)";
    dark.fillRect(0, 0, this.vw, this.vh);
    dark.globalCompositeOperation = "destination-out";
    const hole = (x, y, radius, strength = 0.9) => {
      const sx = (x - this.camera.x) * this.camera.scale + this.vw / 2;
      const sy = (y - this.camera.y) * this.camera.scale + this.vh / 2;
      const r = Math.max(24, radius * this.camera.scale);
      if (sx < -r || sy < -r || sx > this.vw + r || sy > this.vh + r) return;
      const g = dark.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(0,0,0,${0.88 * strength})`);
      g.addColorStop(0.36, `rgba(0,0,0,${0.58 * strength})`);
      g.addColorStop(0.72, `rgba(0,0,0,${0.2 * strength})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      dark.fillStyle = g;
      dark.fillRect(sx - r, sy - r, r * 2, r * 2);
    };
    for (const light of l.lights) {
      hole(light.px, light.py, light.r * 1.32, Math.min(1.25, light.intensity + 0.32));
    }
    hole(this.player.x, this.player.y, 165, 0.92);
    hole(this.player.x, this.player.y, 300, 0.36);
    hole(l.exit.px, l.exit.py, l.exit.active ? 75 : 40, 0.52);
    for (const obj of l.objectives) hole(obj.px, obj.py, 38, 0.36);
    for (const terminal of l.terminals) hole(terminal.px, terminal.py, 28, 0.24);
    dark.globalCompositeOperation = "source-over";
    ctx.drawImage(this.darkCanvas, 0, 0, this.vw, this.vh);
  };

  Game.prototype.drawLightBloom = function (ctx) {
    const l = this.level;
    this.applyWorld(ctx, false);
    ctx.globalCompositeOperation = "screen";
    for (const light of l.lights) {
      const r = light.r * 1.35;
      const g = ctx.createRadialGradient(light.px, light.py, 0, light.px, light.py, r);
      g.addColorStop(0, rgba(light.color, 0.25 * light.intensity));
      g.addColorStop(0.4, rgba(light.color, 0.055 * light.intensity));
      g.addColorStop(1, rgba(light.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(light.px - r, light.py - r, r * 2, r * 2);
      // volumetric cone beneath ceiling light
      ctx.save();
      ctx.translate(light.px, light.py);
      const cone = ctx.createLinearGradient(0, 0, 0, 72);
      cone.addColorStop(0, rgba(light.color, 0.055));
      cone.addColorStop(1, rgba(light.color, 0));
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-32, 76);
      ctx.lineTo(32, 76);
      ctx.lineTo(4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  };

  Game.prototype.conePolygon = function (x, y, angle, fov, range, rays = 34) {
    const pts = [{ x, y }];
    for (let i = 0; i <= rays; i++) {
      const a = angle - fov / 2 + (fov * i) / rays;
      const hit = this.raycast(x, y, a, range);
      pts.push({ x: hit.x, y: hit.y });
    }
    return pts;
  };

  Game.prototype.drawVisionCone = function (x, y, angle, fov, range, color, alpha, rays = 32) {
    if (range <= 0) return;
    const ctx = this.ctx;
    const pts = this.conePolygon(x, y, angle, fov, range, rays);
    const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
    grad.addColorStop(0, rgba(color, alpha));
    grad.addColorStop(0.55, rgba(color, alpha * 0.52));
    grad.addColorStop(1, rgba(color, 0));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = rgba(color, alpha * 1.7);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawLaserBeams = function (ctx) {
    const disabled = this.level.lasersDisabledUntil > this.time;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const laser of this.level.lasers) {
      const mx = (laser.x1p + laser.x2p) / 2;
      const my = (laser.y1p + laser.y2p) / 2;
      // emitters
      ctx.fillStyle = "rgba(22,30,31,.95)";
      ctx.strokeStyle = "rgba(255,88,101,.24)";
      ctx.lineWidth = 1;
      for (const p of [{ x: laser.x1p, y: laser.y1p }, { x: laser.x2p, y: laser.y2p }]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      if (!laser.active) {
        ctx.strokeStyle = disabled ? "rgba(111,242,209,.08)" : "rgba(255,82,101,.1)";
        ctx.setLineDash([3, 7]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(laser.x1p, laser.y1p);
        ctx.lineTo(laser.x2p, laser.y2p);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }
      const pulse = 0.7 + Math.sin(this.time * 9 + laser.id) * 0.18;
      ctx.strokeStyle = laser.low ? `rgba(255,159,98,${pulse})` : `rgba(255,64,84,${pulse})`;
      ctx.lineWidth = laser.low ? 1.1 : 1.7;
      ctx.shadowBlur = 14;
      ctx.shadowColor = laser.low ? "rgba(255,159,98,.75)" : "rgba(255,64,84,.8)";
      ctx.beginPath();
      ctx.moveTo(laser.x1p, laser.y1p);
      ctx.lineTo(laser.x2p, laser.y2p);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,235,220,.65)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(laser.x1p, laser.y1p);
      ctx.lineTo(laser.x2p, laser.y2p);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // travelling energy bead
      const t = (this.time * (laser.low ? 0.45 : 0.7) + laser.id * 0.31) % 1;
      const bx = lerp(laser.x1p, laser.x2p, t);
      const by = lerp(laser.y1p, laser.y2p, t);
      ctx.fillStyle = "rgba(255,245,225,.9)";
      ctx.beginPath();
      ctx.arc(bx, by, 1.6, 0, TAU);
      ctx.fill();
      // low beam floor label
      if (laser.low) {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.translate(mx, my + 10);
        ctx.font = "600 7px 'Barlow Condensed', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,182,118,.5)";
        ctx.fillText("LOW BEAM · CROUCH", 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  /* ------------------------- interactive props ------------------------- */
  Game.prototype.drawInteractiveProps = function (ctx) {
    const l = this.level;
    this.drawExit(ctx);
    for (const obj of l.objectives) {
      if (!obj.collected) this.drawObjective(ctx, obj);
      else this.drawEmptyPedestal(ctx, obj);
    }
    for (const item of l.loot) {
      if (!item.collected) this.drawLoot(ctx, item);
    }
    for (const spot of l.hiding) this.drawHidingHighlight(ctx, spot);
    for (const terminal of l.terminals) this.drawTerminalGlow(ctx, terminal);
    for (const cam of l.cameras) this.drawCameraGlow(ctx, cam);
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.spin);
      ctx.fillStyle = "#aebdb8";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(174,220,207,.4)";
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.lineTo(2, -3);
      ctx.lineTo(4, 1);
      ctx.lineTo(0, 4);
      ctx.lineTo(-3, 1);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    if (this.interactable && this.interactable.target) {
      const t = this.interactable.target;
      const r = 26 + Math.sin(this.time * 3) * 2;
      ctx.strokeStyle = "rgba(111,242,209,.34)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(t.px, t.py, r, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  Game.prototype.roundRect = function (ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  Game.prototype.drawHidingSpot = function (ctx, spot) {
    const near = dist(this.player.x, this.player.y, spot.px, spot.py) < 48;
    const active = this.player.hidden && this.player.hideId === spot.id;
    ctx.save();
    ctx.translate(spot.px, spot.py);
    ctx.fillStyle = "rgba(0,0,0,.36)";
    ctx.beginPath();
    ctx.ellipse(2, 15, 16, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = spot.type === "cabinet" ? "#202a28" : "#1b2628";
    ctx.strokeStyle = "rgba(148,193,183,.2)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, -12, -17, 24, 33, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(7,12,13,.55)";
    this.roundRect(ctx, -9, -14, 18, 27, 1);
    ctx.fill();
    ctx.strokeStyle = "rgba(139,190,179,.12)";
    for (let yy = -10; yy < 12; yy += 4) {
      ctx.beginPath();
      ctx.moveTo(-7, yy);
      ctx.lineTo(7, yy);
      ctx.stroke();
    }
    ctx.fillStyle = active ? "#6ff2d1" : near ? "#a8d7ca" : "rgba(140,180,170,.42)";
    ctx.shadowBlur = active || near ? 9 : 0;
    ctx.shadowColor = "rgba(111,242,209,.75)";
    ctx.fillRect(6, -1, 2, 5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = active ? "rgba(111,242,209,.8)" : "rgba(111,242,209,.24)";
    ctx.fillRect(-10, -17, 20, 1);
    ctx.restore();
  };

  Game.prototype.drawHidingHighlight = function (ctx, spot) {
    const near = dist(this.player.x, this.player.y, spot.px, spot.py) < 48;
    if (!near && !(this.player.hidden && this.player.hideId === spot.id)) return;
    ctx.save();
    ctx.translate(spot.px, spot.py);
    ctx.strokeStyle = this.player.hidden ? "rgba(111,242,209,.55)" : "rgba(111,242,209,.24)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, -14, -19, 28, 37, 3);
    ctx.stroke();
    if (this.player.hidden && this.player.hideId === spot.id) {
      const pulse = 0.5 + Math.sin(this.time * 3) * 0.22;
      ctx.strokeStyle = `rgba(111,242,209,${pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + Math.sin(this.time * 2) * 3, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawTerminal = function (ctx, terminal) {
    ctx.save();
    ctx.translate(terminal.px, terminal.py);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(1, 12, 14, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#1b2528";
    ctx.strokeStyle = "rgba(128,177,172,.25)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, -13, -14, 26, 27, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#081014";
    this.roundRect(ctx, -9, -10, 18, 11, 1);
    ctx.fill();
    ctx.fillStyle = "rgba(111,242,209,.08)";
    ctx.fillRect(-8, -9, 16, 9);
    ctx.fillStyle = "rgba(111,242,209,.52)";
    ctx.fillRect(-7, -3, 9, 1);
    ctx.fillRect(-7, -1, 5, 1);
    ctx.restore();
  };

  Game.prototype.drawTerminalGlow = function (ctx, terminal) {
    const near = dist(this.player.x, this.player.y, terminal.px, terminal.py) < 46;
    const active = terminal.activeUntil > this.time;
    const cooling = this.time < terminal.cooldown;
    ctx.save();
    ctx.translate(terminal.px, terminal.py);
    const col = active ? "111,242,209" : cooling ? "255,82,101" : "255,195,102";
    ctx.fillStyle = rgba(col, active ? 0.14 : 0.06);
    ctx.shadowBlur = near ? 14 : 6;
    ctx.shadowColor = rgba(col, 0.4);
    ctx.fillRect(-8, -9, 16, 9);
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(col, active ? 0.9 : 0.55);
    ctx.fillRect(-6, -7, 3, 1);
    ctx.fillRect(-6, -4, 8, 1);
    if (near) {
      ctx.strokeStyle = rgba(col, 0.3);
      ctx.lineWidth = 1;
      ctx.strokeRect(-14, -15, 28, 29);
    }
    ctx.restore();
  };

  Game.prototype.drawExit = function (ctx) {
    const l = this.level;
    const e = l.exit;
    const active = e.active;
    const t = this.time;
    ctx.save();
    ctx.translate(e.px, e.py);
    const col = active ? "111,242,209" : "255,195,102";
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 45);
    glow.addColorStop(0, rgba(col, active ? 0.2 : 0.06));
    glow.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-50, -50, 100, 100);
    ctx.strokeStyle = rgba(col, active ? 0.7 : 0.22);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, 24 + Math.sin(t * 2) * 1.5, -t * 0.22, TAU - t * 0.22);
    ctx.stroke();
    ctx.setLineDash([]);
    // extraction beam
    if (active) {
      const beam = ctx.createLinearGradient(0, -70, 0, 4);
      beam.addColorStop(0, "rgba(111,242,209,0)");
      beam.addColorStop(0.7, "rgba(111,242,209,.055)");
      beam.addColorStop(1, "rgba(111,242,209,.2)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-20, -76);
      ctx.lineTo(20, -76);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(col, active ? 0.8 : 0.35);
    ctx.font = "600 8px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(active ? "EXTRACTION" : "LOCKED", 0, 39);
    ctx.restore();
  };

  Game.prototype.drawObjective = function (ctx, obj) {
    const t = this.time;
    const colors = {
      gem: "111,242,209", mask: "146,216,255", core: "117,255,188",
      falcon: "255,195,102", pearl: "221,211,255", crown: "199,168,255"
    };
    const color = colors[obj.kind] || "111,242,209";
    const bob = Math.sin(t * 1.6 + obj.bob) * 3;
    ctx.save();
    ctx.translate(obj.px, obj.py);
    // pedestal
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(35,45,44,.9)";
    this.roundRect(ctx, -12, 2, 24, 12, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(118,142,136,.25)";
    ctx.fillRect(-13, 2, 26, 2);
    ctx.translate(0, bob - 5);
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 42);
    glow.addColorStop(0, rgba(color, 0.21));
    glow.addColorStop(0.45, rgba(color, 0.07));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-45, -45, 90, 90);
    ctx.save();
    ctx.rotate(Math.sin(t * 0.7 + obj.bob) * 0.09);
    ctx.shadowBlur = 18;
    ctx.shadowColor = rgba(color, 0.7);
    ctx.fillStyle = rgba(color, 0.92);
    ctx.strokeStyle = rgba(color, 1);
    ctx.lineWidth = 0.8;
    if (obj.kind === "pearl") {
      ctx.beginPath();
      ctx.arc(0, -7, 6.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.beginPath();
      ctx.arc(-2, -9, 2.5, 0, TAU);
      ctx.stroke();
    } else if (obj.kind === "mask") {
      ctx.beginPath();
      ctx.ellipse(0, -7, 8, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(5,12,15,.9)";
      ctx.beginPath();
      ctx.ellipse(-3, -9, 1.7, 1, 0, 0, TAU);
      ctx.ellipse(3, -9, 1.7, 1, 0, 0, TAU);
      ctx.fill();
    } else if (obj.kind === "core") {
      ctx.beginPath();
      ctx.arc(0, -7, 7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.beginPath();
      ctx.arc(0, -7, 3.5 + Math.sin(t * 3) * 1, 0, TAU);
      ctx.stroke();
    } else if (obj.kind === "falcon") {
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(7, -5);
      ctx.lineTo(4, 1);
      ctx.lineTo(0, -2);
      ctx.lineTo(-4, 1);
      ctx.lineTo(-7, -5);
      ctx.closePath();
      ctx.fill();
    } else if (obj.kind === "crown") {
      ctx.beginPath();
      ctx.moveTo(-9, -1);
      ctx.lineTo(-7, -12);
      ctx.lineTo(-2, -5);
      ctx.lineTo(0, -15);
      ctx.lineTo(2, -5);
      ctx.lineTo(7, -12);
      ctx.lineTo(9, -1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(5,10,12,.6)";
      ctx.fillRect(-7, -2, 14, 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(8, -7);
      ctx.lineTo(0, 3);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)";
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 3);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    // scanning ring
    ctx.strokeStyle = rgba(color, 0.2);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, -7, 15 + Math.sin(t * 1.7) * 2, 5 + Math.sin(t * 1.7) * 0.7, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawEmptyPedestal = function (ctx, obj) {
    ctx.save();
    ctx.translate(obj.px, obj.py);
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 16, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(30,39,38,.8)";
    this.roundRect(ctx, -12, 5, 24, 9, 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(113,143,136,.15)";
    ctx.strokeRect(-11, 6, 22, 7);
    ctx.restore();
  };

  Game.prototype.drawCameraBody = function (ctx, cam) {
    ctx.save();
    ctx.translate(cam.px, cam.py);
    const disabled = this.level.camerasDisabledUntil > this.time;
    ctx.rotate(cam.angle);
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 4, 0, 0, TAU);
    ctx.fill();
    // wall mount
    ctx.strokeStyle = "rgba(111,142,140,.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(-13, -8);
    ctx.stroke();
    ctx.fillStyle = "#171f22";
    ctx.strokeStyle = "rgba(135,184,178,.34)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, -11, -7, 23, 14, 3);
    ctx.fill();
    ctx.stroke();
    // lens housing
    ctx.fillStyle = disabled ? "#202726" : "#2e3636";
    ctx.beginPath();
    ctx.arc(12, 0, 4.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = disabled ? "rgba(111,242,209,.14)" : "rgba(255,188,111,.35)";
    ctx.stroke();
    ctx.fillStyle = disabled ? "rgba(111,242,209,.2)" : "rgba(255,195,102,.75)";
    ctx.shadowBlur = disabled ? 0 : 9;
    ctx.shadowColor = "rgba(255,195,102,.6)";
    ctx.beginPath();
    ctx.arc(12, 0, 1.8, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // status label
    if (disabled) {
      ctx.save();
      ctx.translate(cam.px, cam.py - 18);
      ctx.font = "600 7px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(111,242,209,.48)";
      ctx.fillText("OFFLINE", 0, 0);
      ctx.restore();
    }
  };

  Game.prototype.drawCameraGlow = function (ctx, cam) {
    const disabled = this.level.camerasDisabledUntil > this.time;
    if (disabled) return;
    const hot = cam.confidence > 0.03;
    ctx.save();
    ctx.translate(cam.px, cam.py);
    const col = hot ? "255,82,101" : "255,195,102";
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 23);
    g.addColorStop(0, rgba(col, hot ? 0.28 : 0.13));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-25, -25, 50, 50);
    if (cam.confidence > 0.02) {
      ctx.strokeStyle = rgba(col, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + TAU * cam.confidence);
      ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawGuards = function (ctx) {
    for (const g of this.level.guards) {
      const moving = g.state === "patrol" || g.state === "investigate" || g.state === "return" || g.state === "chase";
      const stride = moving ? Math.sin(g.stepPhase) : 0;
      const bob = moving ? Math.abs(Math.cos(g.stepPhase)) * 1.4 : Math.sin(this.time * 1.7 + g.id) * 0.6;
      // ground shadow
      ctx.save();
      ctx.translate(g.x + 2, g.y + 8);
      ctx.rotate(g.angle);
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      // body
      ctx.save();
      ctx.translate(g.x, g.y - bob);
      ctx.rotate(g.angle);
      const chase = g.state === "chase";
      const alert = chase || g.state === "suspicious" || g.state === "investigate";
      // legs
      ctx.fillStyle = "#11191d";
      ctx.save();
      ctx.rotate(0.06 + stride * 0.22);
      this.roundRect(ctx, -12, 4, 6, 12, 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.rotate(-0.06 - stride * 0.22);
      this.roundRect(ctx, -8, 4, 6, 12, 2);
      ctx.fill();
      ctx.restore();
      // torso
      const body = ctx.createLinearGradient(-8, -10, 10, 12);
      body.addColorStop(0, "#2d3b3d");
      body.addColorStop(0.55, "#1a272b");
      body.addColorStop(1, "#121c20");
      ctx.fillStyle = body;
      ctx.strokeStyle = chase ? "rgba(255,82,101,.65)" : alert ? "rgba(255,164,88,.36)" : "rgba(149,183,178,.19)";
      ctx.lineWidth = 1;
      this.roundRect(ctx, -9, -10, 18, 20, 5);
      ctx.fill();
      ctx.stroke();
      // shoulder plates
      ctx.fillStyle = "#27363a";
      this.roundRect(ctx, -11, -6, 6, 9, 2);
      ctx.fill();
      this.roundRect(ctx, 5, -6, 6, 9, 2);
      ctx.fill();
      // arms / flashlight
      ctx.strokeStyle = "#334044";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(7, -2);
      ctx.lineTo(14, 1);
      ctx.stroke();
      ctx.fillStyle = "#0a0e10";
      this.roundRect(ctx, 12, -2, 5, 5, 1);
      ctx.fill();
      ctx.fillStyle = chase ? "rgba(255,90,106,.9)" : "rgba(255,206,137,.7)";
      ctx.shadowBlur = 9;
      ctx.shadowColor = chase ? "rgba(255,82,101,.8)" : "rgba(255,195,102,.55)";
      ctx.fillRect(17, 0, 2, 1.7);
      ctx.shadowBlur = 0;
      // head
      ctx.fillStyle = "#a98b75";
      ctx.beginPath();
      ctx.arc(2, -4, 5.3, 0, TAU);
      ctx.fill();
      // cap
      ctx.fillStyle = "#182427";
      ctx.beginPath();
      ctx.arc(1, -5, 5.5, Math.PI, TAU);
      ctx.fill();
      ctx.fillRect(-4, -6, 10, 2.4);
      // visor
      ctx.fillStyle = chase ? "rgba(255,72,92,.95)" : "rgba(255,169,92,.78)";
      ctx.shadowBlur = 4;
      ctx.shadowColor = chase ? "rgba(255,82,101,.8)" : "rgba(255,178,102,.5)";
      ctx.fillRect(4, -4.5, 4, 2);
      ctx.shadowBlur = 0;
      // belt
      ctx.fillStyle = "rgba(255,170,92,.28)";
      ctx.fillRect(-7, 6, 15, 1.5);
      ctx.restore();
      // awareness indicator
      const top = g.y - 31 - bob;
      if (g.state === "chase") {
        ctx.save();
        ctx.translate(g.x, top);
        const pulse = 1 + Math.sin(this.time * 8) * 0.09;
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "rgba(255,82,101,.16)";
        ctx.strokeStyle = "rgba(255,82,101,.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ff7383";
        ctx.font = "700 13px 'Barlow Condensed', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", 0, 0);
        ctx.restore();
      } else if (g.awareness > 0.025 || g.state === "suspicious" || g.state === "investigate" || g.state === "search") {
        ctx.save();
        ctx.translate(g.x, top);
        ctx.strokeStyle = "rgba(255,195,102,.16)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,181,94,.8)";
        ctx.beginPath();
        ctx.arc(0, 0, 9, -Math.PI / 2, -Math.PI / 2 + TAU * g.awareness);
        ctx.stroke();
        ctx.fillStyle = g.state === "search" ? "rgba(255,195,102,.8)" : "rgba(255,213,153,.9)";
        ctx.font = "700 12px 'Barlow Condensed', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(g.state === "search" ? "?" : "?", 0, 0.5);
        ctx.restore();
      }
      if (g.alertFlash > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255,82,101,${g.alertFlash * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 22 + (1 - g.alertFlash) * 24, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  Game.prototype.drawPlayer = function (ctx) {
    const p = this.player;
    if (p.hidden) return;
    const crouch = p.crouching || p.inVent;
    const scale = crouch ? 0.84 : 1;
    const stride = p.moving ? Math.sin(p.bob) : 0;
    const bob = p.moving ? Math.abs(Math.cos(p.bob)) * 1.6 : Math.sin(this.time * 1.8) * 0.5;
    // sprint afterimages
    if (p.sprinting) {
      for (const t of p.trail) {
        ctx.save();
        ctx.globalAlpha = (t.life / 0.28) * 0.1;
        ctx.fillStyle = "rgba(111,242,209,.7)";
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, 9, 5, p.angle, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(p.x + 2, p.y + 9);
    ctx.rotate(p.angle);
    ctx.fillStyle = "rgba(0,0,0,.46)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(p.x, p.y - bob);
    ctx.rotate(p.angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = p.inVent ? 0.7 : 1;
    // legs
    ctx.strokeStyle = "#121d21";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(-7 - stride * 2, 13 + stride * 2);
    ctx.moveTo(3, 4);
    ctx.lineTo(5 + stride * 2, 13 - stride * 2);
    ctx.stroke();
    // body
    const suit = ctx.createLinearGradient(-8, -10, 8, 10);
    suit.addColorStop(0, "#263a3d");
    suit.addColorStop(0.55, "#142327");
    suit.addColorStop(1, "#0b1417");
    ctx.fillStyle = suit;
    ctx.strokeStyle = "rgba(111,242,209,.24)";
    ctx.lineWidth = 0.9;
    this.roundRect(ctx, -8, -9, 16, 19, 5);
    ctx.fill();
    ctx.stroke();
    // backpack
    ctx.fillStyle = "#0b1416";
    ctx.strokeStyle = "rgba(126,182,173,.18)";
    this.roundRect(ctx, -10, -5, 5, 10, 2);
    ctx.fill();
    ctx.stroke();
    // arm
    ctx.strokeStyle = "#1a2a2d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -3);
    ctx.lineTo(10, 3);
    ctx.stroke();
    // scarf / accent
    ctx.fillStyle = "rgba(111,242,209,.72)";
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(4, -9);
    ctx.lineTo(1, -4);
    ctx.lineTo(-7, -3);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.fillStyle = "#1c2c30";
    ctx.beginPath();
    ctx.arc(2, -6, 5, 0, TAU);
    ctx.fill();
    // hood / goggles
    ctx.fillStyle = "#0b1417";
    ctx.beginPath();
    ctx.arc(1, -7, 5.4, Math.PI * 0.82, Math.PI * 2.18);
    ctx.fill();
    ctx.fillStyle = "rgba(111,242,209,.92)";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "rgba(111,242,209,.7)";
    ctx.fillRect(4.5, -7.5, 3.6, 1.5);
    ctx.shadowBlur = 0;
    ctx.restore();
    // visibility ring in vent
    if (p.inVent) {
      ctx.save();
      ctx.strokeStyle = "rgba(107,183,255,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15 + Math.sin(this.time * 2.5) * 1.5, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  };

  Game.prototype.drawParticles = function (ctx) {
    for (const p of this.particles) {
      const life = p.life / p.maxLife;
      ctx.save();
      if (p.type === "ring") {
        ctx.strokeStyle = `rgba(${p.color},${(1 - life) * 0.5})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${p.color},${(1 - life) * 0.15})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.62, 0, TAU);
        ctx.stroke();
      } else if (p.type === "spark") {
        ctx.fillStyle = `rgba(${p.color},${1 - life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 - life * 0.5), 0, TAU);
        ctx.fill();
      } else if (p.type === "step") {
        ctx.strokeStyle = `rgba(164,208,196,${(1 - life) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + life * 7, 0, TAU);
        ctx.stroke();
      } else if (p.type === "cameraBurst") {
        ctx.strokeStyle = `rgba(${p.color},${(1 - life) * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12 + life * 36, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 + life * 22, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const f of this.floaters) {
      const life = f.life / f.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.sin(Math.min(1, life * 1.4) * Math.PI) * 0.92;
      ctx.font = "600 10px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(${f.color},1)`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${f.color},.45)`;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  };

  Game.prototype.drawFloatingText = function () {
    // reserved hook used by scene ordering; text is drawn with particles
  };

  Game.prototype.drawScreenEffects = function (ctx) {
    const l = this.level;
    if (!l) return;
    const alert = this.alert || 0;
    if (alert > 35) {
      const a = clamp((alert - 35) / 65, 0, 1);
      const g = ctx.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.22, this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.73);
      g.addColorStop(0, "rgba(255,40,65,0)");
      g.addColorStop(0.72, `rgba(255,40,65,${a * 0.035})`);
      g.addColorStop(1, `rgba(255,30,55,${a * 0.16})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
    if (this.flash > 0) {
      ctx.fillStyle = rgba(this.flashColor, this.flash * 0.17);
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
    // crosshair / aim
    if (!IS_TOUCH && performance.now() - this.mouse.movedAt < 2600 && this.state === "playing") {
      const x = this.mouse.x;
      const y = this.mouse.y;
      ctx.strokeStyle = "rgba(191,245,232,.38)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 10, y); ctx.lineTo(x - 7, y);
      ctx.moveTo(x + 7, y); ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 7);
      ctx.moveTo(x, y + 7); ctx.lineTo(x, y + 10);
      ctx.stroke();
      if (this.throwCooldown > 0) {
        ctx.strokeStyle = "rgba(255,195,102,.32)";
        ctx.beginPath();
        ctx.arc(x, y, 9, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - this.throwCooldown / 3.2));
        ctx.stroke();
      }
    }
    // very subtle scan sweep
    const scan = ((this.time * 0.045) % 1) * this.vh;
    const sg = ctx.createLinearGradient(0, scan - 18, 0, scan + 18);
    sg.addColorStop(0, "rgba(111,242,209,0)");
    sg.addColorStop(0.5, "rgba(111,242,209,.008)");
    sg.addColorStop(1, "rgba(111,242,209,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, scan - 18, this.vw, 36);
  };

  Game.prototype.drawLoot = function (ctx, item) {
    const t = this.time;
    const bob = Math.sin(t * 2.2 + item.bob) * 2.5;
    ctx.save();
    ctx.translate(item.px, item.py + bob);
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    glow.addColorStop(0, "rgba(255,195,102,.18)");
    glow.addColorStop(1, "rgba(255,195,102,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-24, -24, 48, 48);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "rgba(255,203,115,.9)";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,195,102,.8)";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = "rgba(255,246,220,.8)";
    ctx.fillRect(-2, -4, 1, 3);
    ctx.shadowBlur = 0;
    ctx.rotate(-Math.PI / 4);
    const tw = 0.4 + Math.sin(t * 4 + item.bob) * 0.35;
    ctx.strokeStyle = `rgba(255,224,170,${tw})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(-7, 0);
    ctx.moveTo(8, 0); ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawVisionCones = function (ctx) {
    const p = this.player;
    // camera sweeps
    for (const cam of this.level.cameras) {
      if (cam.disabled) continue;
      const hot = cam.confidence > 0.03;
      const color = hot ? "255,82,101" : "255,204,126";
      const alpha = cam.confidence > 0.03 ? 0.085 + cam.confidence * 0.085 : 0.052;
      this.drawVisionCone(cam.px, cam.py, cam.angle, cam.fov, cam.range, color, alpha, 28);
      ctx.save();
      ctx.translate(cam.px, cam.py);
      ctx.rotate(cam.angle);
      const beam = ctx.createLinearGradient(0, 0, 90, 0);
      beam.addColorStop(0, rgba(color, hot ? 0.3 : 0.13));
      beam.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = beam;
      ctx.fillRect(12, -1.5, cam.range * 0.5, 3);
      ctx.restore();
    }
    // guards
    for (const g of this.level.guards) {
      const chase = g.state === "chase";
      const alert = g.state === "suspicious" || g.state === "investigate" || g.state === "search";
      const color = chase ? "255,64,88" : alert ? "255,164,88" : "255,196,118";
      const range = g.range * (p.crouching ? 0.72 : 1) * (chase ? 1.06 : 1);
      const alpha = chase ? 0.09 : alert ? 0.07 : 0.048;
      this.drawVisionCone(g.x, g.y, g.angle, g.fov, range, color, alpha, 30);
      // flashlight core
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      const beam = ctx.createLinearGradient(0, 0, 130, 0);
      beam.addColorStop(0, rgba(color, chase ? 0.3 : 0.12));
      beam.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(135, -16);
      ctx.lineTo(135, 16);
      ctx.lineTo(8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const game = new Game();
  window.shadowHeist = game;
})();
