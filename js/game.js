// ZOMBIE OUTBREAK — game engine, rendering and UI orchestration.
import {
  WEAPONS, ZOMBIE_TYPES, BOSSES, UPGRADES, POWERUPS, POWERUP_BY_ID, STORAGE_KEYS,
} from './data.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { Player, Zombie } from './entities.js';
import {
  TAU, clamp, lerp, rand, randInt, chance, pick, shuffle, weightedPick, angleDiff, dist,
  norm, formatNumber, mulberry32, easeOutCubic, segCircle,
} from './utils.js';

const WORLD = { w: 2800, h: 2800 };
const $ = (id) => document.getElementById(id);

function loadBest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.best);
    if (raw) {
      const data = JSON.parse(raw);
      return { wave: data.wave || 0, score: data.score || 0, kills: data.kills || 0 };
    }
  } catch { /* ignored */ }
  return { wave: 0, score: 0, kills: 0 };
}

function saveBest(best) {
  try { localStorage.setItem(STORAGE_KEYS.best, JSON.stringify(best)); } catch { /* ignored */ }
}

class Game {
  constructor() {
    this.canvas = $('game');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.world = WORLD;
    this.dpr = 1;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.zoom = 1;
    this.time = 0;
    this.mode = 'menu';
    this.last = performance.now();
    this.best = loadBest();

    this.difficulty = { hp: 1, speed: 1, damage: 1 };
    this.zombies = [];
    this.bullets = [];
    this.acids = [];
    this.shockwaves = [];
    this.pickups = [];
    this.warnings = [];
    this.particles = [];
    this.texts = [];
    this.decals = [];
    this.menuZombies = [];
    this.spawnQueue = [];
    this.offers = [];
    this.boss = null;
    this.coins = 0;
    this.coinsEarned = 0;
    this.score = 0;
    this.kills = 0;
    this.wave = 0;
    this.runTime = 0;
    this.freeze = 0;
    this.shakeAmt = 0;
    this.damageFlash = 0;
    this.crosshairKick = 0;
    this.crosshairHit = 0;
    this.muzzleLight = null;
    this.damageNumbers = 0;
    this.toastTimer = 0;
    this.hintTimer = 0;
    this.hintFaded = false;
    this.upgradeBought = false;
    this.upgradeOrigin = null;
    this.powerSignature = '';
    this.hudTimer = 0;
    this.hudCache = {};
    this.cardCache = [];
    this.lastMinimap = -1;
    this.lastDamageOpacity = -1;

    this.camera = {
      x: WORLD.w / 2,
      y: WORLD.h / 2,
      zoom: 1,
      shakeX: 0,
      shakeY: 0,
    };

    this.sound = new Sound();
    this.input = new Input(this.canvas);
    this.player = new Player(this);
    this.player.reset();
    this.ui = this.cacheUI();
    this.buildWeaponCards();
    this.bindUI();
    this.resize();
    this.makeFloorPattern();
    this.makeDecor();
    this.buildFloorTexture();
    this.makeLightSprite();
    this.makeMenuScene();
    this.enterMenu(true);
    this.applyMuteUI();

    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'playing') this.pause();
    });

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    this.exposeDebug();
  }

  cacheUI() {
    return {
      hud: $('hud'),
      hpFill: $('hp-fill'),
      hpText: $('hp-text'),
      shieldWrap: $('shield-wrap'),
      shieldFill: $('shield-fill'),
      waveNum: $('wave-num'),
      enemiesNum: $('enemies-num'),
      coinNum: $('coin-num'),
      scoreNum: $('score-num'),
      weaponList: $('weapon-list'),
      powerList: $('power-list'),
      minimap: $('minimap'),
      bossBar: $('boss-bar'),
      bossName: $('boss-name'),
      bossFill: $('boss-fill'),
      bossHpText: $('boss-hp-text'),
      waveBanner: $('wave-banner'),
      bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'),
      toast: $('toast'),
      controlHint: $('control-hint'),
      damageFlash: $('damage-flash'),
      nukeFlash: $('nuke-flash'),
      menu: $('menu'),
      menuMute: $('menu-mute'),
      bestWave: $('best-wave'),
      bestScore: $('best-score'),
      howto: $('howto'),
      pause: $('pause'),
      upgrade: $('upgrade'),
      gameover: $('gameover'),
      upWave: $('up-wave'),
      upCoins: $('up-coins'),
      upBonus: $('up-bonus'),
      upgradeGrid: $('upgrade-grid'),
      upgradeTip: $('upgrade-tip'),
      btnNextWave: $('btn-next-wave'),
      pauseWave: $('pause-wave'),
      pauseKills: $('pause-kills'),
      pauseCoins: $('pause-coins'),
      goWave: $('go-wave'),
      goKills: $('go-kills'),
      goScore: $('go-score'),
      goCoins: $('go-coins'),
      newBest: $('new-best'),
      btnMute: $('btn-mute'),
      btnPause: $('btn-pause'),
    };
  }

  buildWeaponCards() {
    this.ui.weaponList.innerHTML = WEAPONS.map((w, i) => `
      <button class="weapon-card" data-weapon="${w.id}" data-index="${i}" aria-label="Equip ${w.name}">
        <div class="wc-top"><span class="wc-key">${w.key}</span><span class="wc-name">${w.name}</span></div>
        <div class="wc-ammo"><span class="wc-mag" data-mag>${w.magSize}</span><span class="wc-res" data-res>/ ∞</span></div>
        <div class="wc-reload" data-reload></div>
        <span class="wc-dry" data-dry>RELOAD</span>
      </button>
    `).join('');
    this.ui.weaponList.querySelectorAll('.weapon-card').forEach((el) => {
      el.addEventListener('click', () => {
        if (this.mode === 'playing' || this.mode === 'paused') {
          this.player.swapWeapon(Number(el.dataset.index));
        }
      });
    });
    this.cardCache = [...this.ui.weaponList.querySelectorAll('.weapon-card')].map((card) => ({
      card,
      mag: card.querySelector('[data-mag]'),
      res: card.querySelector('[data-res]'),
      reload: card.querySelector('[data-reload]'),
      dry: card.querySelector('[data-dry]'),
      lastMag: -1,
      lastRes: '',
      lastActive: null,
      lastReloading: null,
      lastEmpty: null,
      lastReloadW: -1,
      lastDry: null,
      lastDryText: '',
    }));
  }

  bindUI() {
    $('btn-play').addEventListener('click', () => {
      this.sound.unlock();
      this.startRun();
    });
    $('btn-how').addEventListener('click', () => this.openHowto('menu'));
    $('btn-how-close').addEventListener('click', () => this.closeHowto());
    $('btn-how-play').addEventListener('click', () => {
      const origin = this.howtoOrigin;
      this.closeHowto();
      if (origin === 'pause') this.resume();
      else this.startRun();
    });
    this.ui.menuMute.addEventListener('click', () => this.toggleMute());
    this.ui.btnMute.addEventListener('click', () => this.toggleMute());
    this.ui.btnPause.addEventListener('click', () => this.pause());
    $('btn-resume').addEventListener('click', () => this.resume());
    $('btn-pause-restart').addEventListener('click', () => this.startRun());
    $('btn-pause-menu').addEventListener('click', () => this.enterMenu());
    this.ui.btnNextWave.addEventListener('click', () => this.nextWave());
    this.ui.upgradeGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.upgrade-card');
      if (!card) return;
      this.buyUpgrade(Number(card.dataset.index));
    });
    $('btn-retry').addEventListener('click', () => this.startRun());
    $('btn-gameover-menu').addEventListener('click', () => this.enterMenu());

    // Unlock audio on the very first interaction.
    const unlock = () => this.sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  applyMuteUI() {
    const muted = this.sound.muted;
    this.ui.btnMute.classList.toggle('muted', muted);
    this.ui.btnMute.innerHTML = muted ? '<span class="sound-on">×</span>' : '<span class="sound-on">♪</span>';
    this.ui.btnMute.title = muted ? 'Unmute sound' : 'Mute sound';
    if (this.ui.menuMute) this.ui.menuMute.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
  }

  toggleMute() {
    this.sound.unlock();
    this.sound.toggleMuted();
    this.applyMuteUI();
    if (!this.sound.muted) this.sound.click();
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.zoom = this.w < 620 ? 0.96 : this.w < 980 ? 1.12 : 1.35;
    this.camera.zoom = this.zoom;
  }

  makeFloorPattern() {
    const tile = document.createElement('canvas');
    tile.width = 256;
    tile.height = 256;
    const c = tile.getContext('2d');
    c.fillStyle = '#11151a';
    c.fillRect(0, 0, 256, 256);
    const rng = mulberry32(90210);
    // asphalt noise
    for (let i = 0; i < 1300; i++) {
      const x = rng() * 256;
      const y = rng() * 256;
      const v = 18 + Math.floor(rng() * 26);
      c.fillStyle = `rgba(${v + 8},${v + 12},${v + 14},${0.12 + rng() * 0.2})`;
      c.fillRect(x, y, rng() * 2 + 0.6, rng() * 2 + 0.6);
    }
    // seams
    c.strokeStyle = 'rgba(255,255,255,0.026)';
    c.lineWidth = 1;
    for (let i = 0; i <= 256; i += 64) {
      c.beginPath(); c.moveTo(i + 0.5, 0); c.lineTo(i + 0.5, 256); c.stroke();
      c.beginPath(); c.moveTo(0, i + 0.5); c.lineTo(256, i + 0.5); c.stroke();
    }
    // cracks
    c.strokeStyle = 'rgba(0,0,0,0.32)';
    for (let i = 0; i < 4; i++) {
      let x = rng() * 256;
      let y = rng() * 256;
      c.beginPath();
      c.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (rng() - 0.5) * 42;
        y += (rng() - 0.5) * 42;
        c.lineTo(x, y);
      }
      c.lineWidth = 0.6 + rng();
      c.stroke();
    }
    this.floorPattern = this.ctx.createPattern(tile, 'repeat');
    this.floorTile = tile;
  }

  makeDecor() {
    const rng = mulberry32(77123);
    this.decor = [];
    for (let i = 0; i < 90; i++) {
      const type = pick(['stain', 'paper', 'crack', 'debris', 'stain', 'manhole']);
      this.decor.push({
        type,
        x: 80 + rng() * (WORLD.w - 160),
        y: 80 + rng() * (WORLD.h - 160),
        r: 6 + rng() * 34,
        rot: rng() * TAU,
        alpha: 0.05 + rng() * 0.15,
      });
    }
    // painted chemical warnings and huge center seal
    this.paintMarks = [];
    for (let i = 0; i < 8; i++) {
      this.paintMarks.push({
        x: 300 + rng() * (WORLD.w - 600),
        y: 300 + rng() * (WORLD.h - 600),
        rot: rng() * TAU,
        kind: pick(['arrow', 'hazard', 'text']),
        alpha: 0.04 + rng() * 0.05,
      });
    }
  }

  buildFloorTexture() {
    const size = 2048;
    const scale = size / WORLD.w;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const c = canvas.getContext('2d');
    const mainCtx = this.ctx;
    const mainPattern = this.floorPattern;
    this.ctx = c;
    this.floorPattern = c.createPattern(this.floorTile, 'repeat');
    c.save();
    c.scale(scale, scale);
    this.paintFloorBase({ x1: 0, y1: 0, x2: WORLD.w, y2: WORLD.h });
    c.restore();
    this.ctx = mainCtx;
    this.floorPattern = mainPattern;
    this.floorTexture = canvas;
  }

  makeLightSprite() {
    const w = 820;
    const h = 480;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    const ox = 40;
    const oy = h / 2;
    const cone = c.createLinearGradient(ox, oy, 780, oy);
    cone.addColorStop(0, 'rgba(255,226,175,0.2)');
    cone.addColorStop(0.38, 'rgba(255,220,160,0.095)');
    cone.addColorStop(1, 'rgba(255,210,150,0)');
    c.fillStyle = cone;
    c.beginPath();
    c.moveTo(ox, oy - 5);
    c.lineTo(360, oy - 110);
    c.lineTo(780, oy - 210);
    c.lineTo(780, oy + 210);
    c.lineTo(360, oy + 110);
    c.lineTo(ox, oy + 5);
    c.closePath();
    c.fill();
    const halo = c.createRadialGradient(ox, oy, 6, ox, oy, 250);
    halo.addColorStop(0, 'rgba(255,226,180,0.17)');
    halo.addColorStop(0.45, 'rgba(255,210,160,0.06)');
    halo.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ox, oy, 250, 0, TAU);
    c.fill();
    this.lightSprite = canvas;

    const flash = document.createElement('canvas');
    flash.width = 320;
    flash.height = 320;
    const fc = flash.getContext('2d');
    const g = fc.createRadialGradient(160, 160, 0, 160, 160, 160);
    g.addColorStop(0, 'rgba(255,240,200,0.55)');
    g.addColorStop(0.35, 'rgba(255,190,90,0.19)');
    g.addColorStop(1, 'rgba(255,160,60,0)');
    fc.fillStyle = g;
    fc.fillRect(0, 0, 320, 320);
    this.flashSprite = flash;
  }

  makeMenuScene() {
    this.difficulty = { hp: 1, speed: 1, damage: 1 };
    this.decals = [];
    this.particles = [];
    this.texts = [];
    this.menuZombies = [];
    this.player.reset();
    this.player.x = WORLD.w / 2 - 90;
    this.player.y = WORLD.h / 2 + 50;
    this.player.aim = -0.45;
    this.camera.x = WORLD.w / 2;
    this.camera.y = WORLD.h / 2;
    this.time = this.time || 0;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + rand(-0.2, 0.2);
      const r = rand(260, 760);
      const type = i % 4 === 0 ? 'runner' : i === 6 ? 'brute' : 'walker';
      const z = new Zombie(this, type, WORLD.w / 2 + Math.cos(a) * r, WORLD.h / 2 + Math.sin(a) * r);
      z.spawnT = 1;
      z.anim = rand(0, TAU);
      this.menuZombies.push(z);
    }
    for (let i = 0; i < 5; i++) {
      this.addDecal(rand(400, 2400), rand(400, 2400), rand(15, 45), '#3a0f12', 0.22);
    }
  }

  enterMenu(initial = false) {
    this.mode = 'menu';
    this.sound.stopAmbience();
    document.body.classList.remove('playing');
    this.ui.hud.classList.add('hidden');
    this.hideAllOverlays();
    this.ui.menu.classList.add('active');
    this.ui.bossBar.classList.add('hidden');
    this.ui.upgradeGrid.innerHTML = '';
    this.makeMenuScene();
    this.updateBestUI();
    if (!initial) this.sound.click();
    this.input.resetSticks();
  }

  updateBestUI() {
    this.ui.bestWave.textContent = String(this.best.wave);
    this.ui.bestScore.textContent = formatNumber(this.best.score);
  }

  hideAllOverlays() {
    [this.ui.menu, this.ui.howto, this.ui.pause, this.ui.upgrade, this.ui.gameover].forEach((el) => {
      el.classList.remove('active');
    });
  }

  hideGameplayOverlays() {
    [this.ui.howto, this.ui.pause, this.ui.upgrade, this.ui.gameover].forEach((el) => el.classList.remove('active'));
    this.ui.menu.classList.remove('active');
  }

  startRun() {
    this.sound.unlock();
    this.sound.startAmbience();
    this.hideGameplayOverlays();
    this.resetRun();
    this.ui.hud.classList.remove('hidden');
    this.ui.menu.classList.remove('active');
    this.mode = 'playing';
    document.body.classList.add('playing');
    this.ui.controlHint.classList.remove('fade');
    this.hintFaded = false;
    this.hintTimer = 0;
    this.startWave(1);
  }

  resetRun() {
    this.player.reset();
    this.zombies = [];
    this.bullets = [];
    this.acids = [];
    this.shockwaves = [];
    this.pickups = [];
    this.warnings = [];
    this.particles = [];
    this.texts = [];
    this.decals = [];
    this.spawnQueue = [];
    this.offers = [];
    this.boss = null;
    this.freeze = 0;
    this.wave = 0;
    this.coins = 0;
    this.coinsEarned = 0;
    this.score = 0;
    this.kills = 0;
    this.runTime = 0;
    this.shakeAmt = 0;
    this.damageFlash = 0;
    this.crosshairHit = 0;
    this.muzzleLight = null;
    this.toastTimer = 0;
    this.upgradeBought = false;
    this.difficulty = { hp: 1, speed: 1, damage: 1 };
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.ui.powerList.innerHTML = '';
    this.powerSignature = '';
    this.ui.bossBar.classList.add('hidden');
    this.ui.upgradeGrid.innerHTML = '';
    this.ui.damageFlash.style.opacity = '0';
    this.ui.nukeFlash.style.opacity = '0';
    this.ui.toast.classList.remove('show');
  }

  startWave(n) {
    this.wave = n;
    this.mode = 'playing';
    document.body.classList.add('playing');
    this.hideGameplayOverlays();
    this.ui.hud.classList.remove('hidden');
    this.warnings = [];
    this.spawnQueue = [];
    this.freeze = 0;
    this.waveEndTimer = 1.2;
    this.spawnTimer = n === 1 ? 1.3 : 1.0;
    this.player.invuln = Math.max(this.player.invuln, 1.0);
    this.boss = null;
    this.difficulty = {
      hp: 1 + (n - 1) * 0.165 + Math.floor((n - 1) / 5) * 0.12,
      speed: Math.min(1.5, 1 + (n - 1) * 0.021),
      damage: Math.min(3.2, 1 + (n - 1) * 0.075),
    };
    const bossWave = n % 5 === 0;
    let count = Math.min(52, 6 + Math.floor(n * 2.35));
    if (bossWave) count = Math.min(44, 8 + Math.floor(n * 1.3));
    const types = this.availableZombieTypes();
    const weights = {};
    for (const id of types) {
      const def = ZOMBIE_TYPES[id];
      let w = def.weight;
      if (id === 'walker') w *= Math.max(0.32, 1 - n * 0.025);
      if (id === 'runner') w *= 1 + Math.min(0.7, n * 0.025);
      if (id === 'brute') w *= 1 + Math.min(0.6, n * 0.02);
      weights[id] = w;
    }
    for (let i = 0; i < count; i++) {
      const id = weightedPick(types, (t) => weights[t]);
      this.spawnQueue.push(id);
    }
    this.spawnQueue = shuffle(this.spawnQueue);

    if (bossWave) {
      const point = this.chooseSpawnPoint(440);
      this.warnings.push({
        type: 'boss', x: point.x, y: point.y, t: 2.7, max: 2.7, boss: true,
        bossIndex: Math.ceil(n / 5),
      });
      this.announce(`WAVE ${n}`, 'A BOSS IS COMING', true);
      this.sound.wave();
    } else {
      this.announce(`WAVE ${n}`, n === 1 ? "THEY'RE COMING" : 'SURVIVE THE HORDE', false);
      this.sound.wave();
    }
    this.updateHUD();
  }

  announce(title, sub, boss = false) {
    const el = this.ui.waveBanner;
    this.ui.bannerTitle.textContent = title;
    this.ui.bannerSub.textContent = sub;
    el.classList.toggle('boss', boss);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  toast(text, type = '') {
    this.ui.toast.textContent = text;
    this.ui.toast.className = 'toast show ' + type;
    this.toastTimer = 2.2;
  }

  updateToast(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.ui.toast.classList.remove('show');
    }
  }

  pause() {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    document.body.classList.remove('playing');
    this.ui.pause.classList.add('active');
    this.ui.pauseWave.textContent = String(this.wave);
    this.ui.pauseKills.textContent = String(this.kills);
    this.ui.pauseCoins.textContent = String(this.coins);
    this.input.resetSticks();
    this.sound.click();
  }

  resume() {
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    document.body.classList.add('playing');
    this.ui.pause.classList.remove('active');
    this.last = performance.now();
    this.sound.click();
  }

  openHowto(origin) {
    this.howtoOrigin = origin;
    this.ui.howto.classList.add('active');
    this.sound.click();
  }

  closeHowto() {
    this.ui.howto.classList.remove('active');
    this.sound.click();
  }

  nextWave() {
    if (this.mode !== 'intermission') return;
    this.ui.upgrade.classList.remove('active');
    this.mode = 'playing';
    document.body.classList.add('playing');
    this.startWave(this.wave + 1);
  }

  completeWave() {
    this.mode = 'intermission';
    document.body.classList.remove('playing');
    this.ui.bossBar.classList.add('hidden');
    this.freeze = 0;
    const bonus = 15 + this.wave * 6 + (this.wave % 5 === 0 ? 35 : 0);
    this.coins += bonus;
    this.coinsEarned += bonus;
    this.score += this.wave * 45;
    // sweep up any coins left on the field
    for (const p of this.pickups) {
      if (p.kind === 'coin') {
        this.coins += p.value;
        this.coinsEarned += p.value;
        this.sparkle(p.x, p.y, '#ffb703', 2);
      }
    }
    this.pickups = this.pickups.filter((p) => p.kind !== 'coin');
    this.player.heal(15);
    this.player.addAmmo(0.22);
    this.generateOffers();
    this.ui.upWave.textContent = String(this.wave);
    this.ui.upCoins.textContent = String(this.coins);
    this.ui.upBonus.textContent = '+' + bonus;
    this.ui.upgradeTip.textContent = 'Choose wisely. The next wave hits harder.';
    this.ui.btnNextWave.disabled = false;
    this.renderOffers();
    this.ui.upgrade.classList.add('active');
    this.sound.upgrade();
    this.updateHUD();
    this.input.resetSticks();
  }

  generateOffers() {
    const available = UPGRADES.filter((u) => (this.player.upgradeLevels[u.id] || 0) < u.max);
    const chosen = shuffle(available).slice(0, 3);
    this.offers = chosen.map((def) => {
      const level = this.player.upgradeLevels[def.id] || 0;
      return {
        def,
        level,
        cost: Math.round(def.baseCost + this.wave * 6 + level * 18),
        sold: false,
      };
    });
    this.upgradeBought = false;
  }

  renderOffers() {
    if (!this.offers.length) {
      this.ui.upgradeGrid.innerHTML = '<div class="upgrade-empty">ALL AUGMENTS INSTALLED — YOU ARE THE WEAPON.</div>';
      return;
    }
    this.ui.upgradeGrid.innerHTML = this.offers.map((offer, i) => {
      const u = offer.def;
      const affordable = this.coins >= offer.cost;
      const pips = Array.from({ length: u.max }, (_, k) => `<span class="uc-pip ${k < offer.level ? 'on' : ''}"></span>`).join('');
      const soldClass = offer.sold ? 'sold' : this.upgradeBought ? 'locked' : !affordable ? 'locked' : '';
      const button = offer.sold
        ? ''
        : `<div class="uc-buy">${this.upgradeBought ? 'ONE PER BREAK' : 'INSTALL'} <span class="cost">${this.upgradeBought ? '' : `¢ ${offer.cost}`}</span></div>`;
      return `
        <div class="upgrade-card ${soldClass}" data-index="${i}">
          <div class="uc-top">
            <span class="uc-icon">${u.icon}</span>
            <span class="uc-level">LV ${offer.level} / ${u.max}</span>
          </div>
          <div class="uc-name">${u.name}</div>
          <div class="uc-desc">${u.desc}</div>
          <div class="uc-pips">${pips}</div>
          ${button}
        </div>`;
    }).join('');
  }

  buyUpgrade(index) {
    if (this.mode !== 'intermission' || this.upgradeBought) return;
    const offer = this.offers[index];
    if (!offer || offer.sold) return;
    if (this.coins < offer.cost) {
      this.toast('NOT ENOUGH COINS', 'warn');
      this.sound.empty();
      const card = this.ui.upgradeGrid.querySelector(`[data-index="${index}"]`);
      if (card) {
        card.animate([
          { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' }, { transform: 'translateX(0)' },
        ], { duration: 180 });
      }
      return;
    }
    this.coins -= offer.cost;
    const level = (this.player.upgradeLevels[offer.def.id] || 0) + 1;
    this.player.upgradeLevels[offer.def.id] = level;
    offer.def.apply(this.player);
    offer.level = level;
    offer.sold = true;
    this.upgradeBought = true;
    this.ui.upCoins.textContent = String(this.coins);
    this.ui.upgradeTip.textContent = `${offer.def.name.toUpperCase()} INSTALLED — PRESS NEXT WAVE WHEN READY.`;
    this.ui.btnNextWave.disabled = false;
    this.renderOffers();
    this.sound.upgrade();
    this.sparkle(this.player.x, this.player.y, '#ffb703', 8);
    this.updateHUD();
    this.toast(`${offer.def.name.toUpperCase()} INSTALLED`, '');
  }

  gameOver() {
    if (this.mode === 'gameover') return;
    this.mode = 'gameover';
    document.body.classList.remove('playing');
    this.player.dead = true;
    this.player.hp = 0;
    this.ui.bossBar.classList.add('hidden');
    this.shakeAmt = 22;
    this.damageFlash = 1;
    this.burstBlood(this.player.x, this.player.y, 26, '#8f1117', 240);
    this.addDecal(this.player.x, this.player.y, 52, '#4a0b0f', 0.7);
    this.addDecal(this.player.x + rand(-40, 40), this.player.y + rand(-30, 30), 28, '#5a0d11', 0.5);
    this.sound.stopAmbience();
    this.sound.hurt();
    this.sound.explosion();

    const prevBest = this.best;
    const isNewBest = this.score > prevBest.score;
    this.best = {
      wave: Math.max(prevBest.wave, this.wave),
      score: Math.max(prevBest.score, this.score),
      kills: Math.max(prevBest.kills, this.kills),
    };
    saveBest(this.best);

    this.ui.goWave.textContent = String(this.wave);
    this.ui.goKills.textContent = formatNumber(this.kills);
    this.ui.goScore.textContent = formatNumber(this.score);
    this.ui.goCoins.textContent = formatNumber(this.coinsEarned);
    this.ui.newBest.classList.toggle('hidden', !isNewBest);
    setTimeout(() => {
      if (this.mode === 'gameover') {
        this.ui.gameover.classList.add('active');
        this.updateBestUI();
      }
    }, 650);
  }

  // =========================================================
  //  MAIN LOOP & MODE UPDATE
  // =========================================================
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = clamp((now - this.last) / 1000, 0, 0.05);
    this.last = now;
    this.update(dt);
    this.renderAccumulator = (this.renderAccumulator || 0) + dt;
    const throttle = this.mode === 'menu' ? 1 / 20 : 0;
    if (this.renderAccumulator >= throttle) {
      this.renderAccumulator = 0;
      this.render();
    }
    this.input.endFrame();
  }

  update(dt) {
    this.time += dt;
    if (this.input.muteQueued) this.toggleMute();
    if (this.input.pauseQueued) {
      if (this.ui.howto.classList.contains('active')) this.closeHowto();
      else if (this.mode === 'playing') this.pause();
      else if (this.mode === 'paused') this.resume();
    }

    if (this.mode === 'menu') this.updateMenu(dt);
    else if (this.mode === 'playing') this.updatePlaying(dt);
    else if (this.mode === 'intermission') this.updateIntermission(dt);
    else if (this.mode === 'paused') this.updatePaused(dt);
    else if (this.mode === 'gameover') this.updateGameOver(dt);

    this.shakeAmt = Math.max(0, this.shakeAmt * Math.exp(-8 * dt) - dt * 5);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.3);
    this.crosshairKick = Math.max(0, this.crosshairKick - dt * 7);
    this.crosshairHit = Math.max(0, this.crosshairHit - dt * 2.6);
    const damageOpacity = Math.min(0.92, this.damageFlash);
    if (Math.abs(damageOpacity - this.lastDamageOpacity) > 0.04 || (damageOpacity === 0 && this.lastDamageOpacity !== 0)) {
      this.lastDamageOpacity = damageOpacity;
      this.ui.damageFlash.style.opacity = String(damageOpacity);
    }
    this.updateToast(dt);
    if (this.mode !== 'menu') {
      this.hudTimer += dt;
      if (this.hudTimer >= 0.1) {
        this.hudTimer = 0;
        this.updateHUD();
        this.updatePowerHUD(dt);
      }
    }
  }

  updateMenu(dt) {
    const cx = WORLD.w / 2;
    const cy = WORLD.h / 2;
    this.updateCameraTarget(cx + Math.sin(this.time * 0.11) * 110, cy + Math.cos(this.time * 0.08) * 70, dt);
    this.player.anim += dt * 0.8;
    this.player.aim = -0.55 + Math.sin(this.time * 0.23) * 0.45;
    this.player.muzzleFlash = 0;
    this.player.invuln = 0;
    this.player.hp = this.player.maxHp;

    for (const z of this.menuZombies) {
      z.spawnT = 1;
      z.anim += dt * 0.9;
      z.angle += Math.sin(this.time * 0.3 + z.anim) * dt * 0.35;
      const d = dist(z.x, z.y, cx, cy);
      if (d > 880) z.angle = Math.atan2(cy - z.y, cx - z.x) + rand(-0.3, 0.3);
      z.x += Math.cos(z.angle) * z.speed * 0.22 * dt;
      z.y += Math.sin(z.angle) * z.speed * 0.22 * dt;
    }
    if (chance(dt * 5)) {
      const a = rand(0, TAU);
      const r = rand(250, 700);
      this.spawnParticle({
        kind: 'ember', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
        vx: rand(-6, 6), vy: rand(-18, -4), life: rand(1.5, 3.5), maxLife: 3.5,
        size: rand(1, 2.4), color: 'rgba(255,140,80,0.4)',
      });
    }
    this.updateEffects(dt);
  }

  updatePlaying(dt) {
    this.runTime += dt;
    this.freeze = Math.max(0, this.freeze - dt);
    this.hintTimer += dt;
    if (!this.hintFaded && this.hintTimer > 15) {
      this.hintFaded = true;
      this.ui.controlHint.classList.add('fade');
    }

    this.player.update(dt);
    if (this.mode !== 'playing') return;

    this.updateWarnings(dt);
    this.updateSpawning(dt);
    this.updateZombies(dt);
    if (this.mode !== 'playing') return;
    this.updateBullets(dt);
    this.updateAcids(dt);
    this.updateShockwaves(dt);
    this.updatePickups(dt);
    this.updateEffects(dt);
    this.updateCamera(dt);
    this.updateMuzzleLight(dt);

    // ambient atmosphere
    if (chance(dt * 7) && this.particles.length < 500) {
      const view = this.getViewRect();
      this.spawnParticle({
        kind: 'ember', x: rand(view.x1, view.x2), y: rand(view.y1, view.y2),
        vx: rand(-6, 6), vy: rand(-16, -3), life: rand(1, 3), maxLife: 3,
        size: rand(0.8, 2), color: 'rgba(255,140,80,0.28)',
      });
    }
    if (chance(dt * 2)) {
      const view = this.getViewRect();
      this.spawnParticle({
        kind: 'smoke', x: rand(view.x1, view.x2), y: rand(view.y1, view.y2),
        vx: rand(6, 22), vy: rand(-6, 4), life: rand(2, 4), maxLife: 4,
        size: rand(14, 30), color: 'rgba(120,135,145,0.035)', grow: 8,
      });
    }

    // low-health heartbeat
    if (this.player.hp > 0 && this.player.hp / this.player.maxHp < 0.35) {
      this.heartTimer = (this.heartTimer || 0) - dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = 1.15;
        this.sound.heartbeat(1);
      }
    }

    // wave clear
    const remaining = this.spawnQueue.length + this.warnings.length + this.zombies.length;
    if (remaining === 0) {
      this.waveEndTimer -= dt;
      if (this.waveEndTimer <= 0) this.completeWave();
    } else {
      this.waveEndTimer = 1.2;
    }
  }

  updateIntermission(dt) {
    this.updateEffects(dt);
    this.updateCamera(dt);
    this.player.anim += dt * 0.3;
    if (chance(dt * 4)) {
      const view = this.getViewRect();
      this.spawnParticle({
        kind: 'ember', x: rand(view.x1, view.x2), y: rand(view.y1, view.y2),
        vx: rand(-5, 5), vy: rand(-14, -2), life: rand(1, 2.5), maxLife: 2.5,
        size: rand(0.8, 2), color: 'rgba(255,150,80,0.25)',
      });
    }
  }

  updatePaused() { /* frozen */ }

  updateGameOver(dt) {
    this.updateEffects(dt);
    this.player.anim += dt * 0.2;
  }

  updateCameraTarget(tx, ty, dt) {
    this.camera.x = lerp(this.camera.x, tx, 1 - Math.exp(-6 * dt));
    this.camera.y = lerp(this.camera.y, ty, 1 - Math.exp(-6 * dt));
    const halfW = this.w / (2 * this.zoom);
    const halfH = this.h / (2 * this.zoom);
    this.camera.x = clamp(this.camera.x, halfW, WORLD.w - halfW);
    this.camera.y = clamp(this.camera.y, halfH, WORLD.h - halfH);
  }

  updateCamera(dt) {
    const p = this.player;
    const look = 26;
    this.updateCameraTarget(p.x + Math.cos(p.aim) * look, p.y + Math.sin(p.aim) * look, dt);
  }

  screenToWorld(sx, sy) {
    return {
      x: this.camera.x + (sx - this.w / 2) / this.zoom,
      y: this.camera.y + (sy - this.h / 2) / this.zoom,
    };
  }

  getViewRect(margin = 100) {
    const halfW = this.w / (2 * this.zoom);
    const halfH = this.h / (2 * this.zoom);
    return {
      x1: this.camera.x - halfW - margin,
      x2: this.camera.x + halfW + margin,
      y1: this.camera.y - halfH - margin,
      y2: this.camera.y + halfH + margin,
    };
  }

  camVisible(x, y, margin = 100) {
    const v = this.getViewRect(margin);
    return x > v.x1 && x < v.x2 && y > v.y1 && y < v.y2;
  }

  // =========================================================
  //  SPAWNING, WAVES, COMBAT
  // =========================================================
  availableZombieTypes() {
    return Object.keys(ZOMBIE_TYPES).filter((id) => ZOMBIE_TYPES[id].unlock <= Math.max(1, this.wave));
  }

  chooseSpawnPoint(minDist = 430) {
    const view = this.getViewRect(70);
    for (let tries = 0; tries < 30; tries++) {
      const a = rand(0, TAU);
      const d = rand(minDist, minDist + 420);
      const x = this.player.x + Math.cos(a) * d;
      const y = this.player.y + Math.sin(a) * d;
      if (x < 90 || y < 90 || x > WORLD.w - 90 || y > WORLD.h - 90) continue;
      if (x > view.x1 - 40 && x < view.x2 + 40 && y > view.y1 - 40 && y < view.y2 + 40) continue;
      return { x, y };
    }
    const a = rand(0, TAU);
    return {
      x: clamp(this.player.x + Math.cos(a) * 560, 110, WORLD.w - 110),
      y: clamp(this.player.y + Math.sin(a) * 560, 110, WORLD.h - 110),
    };
  }

  updateSpawning(dt) {
    this.spawnTimer -= dt;
    const cap = Math.min(88, 38 + this.wave * 2);
    const pending = this.zombies.length + this.warnings.length;
    if (this.spawnQueue.length > 0 && pending < cap && this.spawnTimer <= 0) {
      const type = this.spawnQueue.shift();
      const point = this.chooseSpawnPoint(440);
      this.warnings.push({ type, x: point.x, y: point.y, t: 0.78, max: 0.78 });
      const interval = clamp(1.0 - this.wave * 0.028, 0.26, 1.0);
      this.spawnTimer = interval * rand(0.62, 1.2);
      if (this.warnings.length + this.zombies.length < 12) this.spawnTimer *= 0.7;
    }
  }

  updateWarnings(dt) {
    for (let i = this.warnings.length - 1; i >= 0; i--) {
      const w = this.warnings[i];
      w.t -= dt;
      if (chance(dt * 14)) {
        this.spawnParticle({
          kind: 'ember', x: w.x + rand(-22, 22), y: w.y + rand(-16, 16),
          vx: rand(-12, 12), vy: rand(-30, -8), life: 0.5, maxLife: 0.5,
          size: rand(1.5, 3), color: w.boss ? 'rgba(255,70,60,0.8)' : 'rgba(229,56,59,0.55)',
        });
      }
      if (w.t <= 0) {
        this.warnings.splice(i, 1);
        if (w.boss) {
          this.spawnZombie('boss', w.x, w.y, { bossIndex: w.bossIndex });
        } else {
          this.spawnZombie(w.type, w.x, w.y);
        }
      }
    }
  }

  updateZombies(dt) {
    for (const z of this.zombies) {
      if (z.dead) continue;
      z.update(dt);
      if (this.mode !== 'playing') break;
    }
    this.zombies = this.zombies.filter((z) => !z.dead);
    if (this.boss && this.boss.dead) this.boss = null;
  }

  spawnZombie(type, x, y, opts = {}) {
    const z = new Zombie(this, type, x, y, opts);
    if (opts.spawnT !== undefined) z.spawnT = opts.spawnT;
    this.zombies.push(z);
    this.dustBurst(x, y, type === 'boss' ? 26 : 8, '#5b5044');
    if (z.isBoss) {
      this.boss = z;
      this.ui.bossBar.classList.remove('hidden');
      this.announce(z.name, 'BOSS ENGAGED', true);
      this.sound.boss();
      this.shake(15);
      this.ring(x, y, 34, 'rgba(255,70,60,0.75)', 0.9, 360);
    } else {
      this.sound.growl(z.def.growl ? rand(z.def.growl[0], z.def.growl[1]) : 1);
    }
    return z;
  }

  killZombie(z, opts = {}) {
    if (z.rewarded) return;
    z.rewarded = true;
    z.dead = true;
    const def = z.def;
    const bloodColor = z.isBoss ? '#5a0d11' : def.blood;
    this.kills += 1;
    this.score += def.score + this.wave * 2;
    this.crosshairHit = Math.max(this.crosshairHit, 1);
    this.burstBlood(z.x, z.y, z.isBoss ? 40 : 14, bloodColor, z.isBoss ? 260 : 150);
    this.dustBurst(z.x, z.y, z.isBoss ? 30 : 5, '#4b4136');
    this.addDecal(z.x, z.y, z.r * rand(1.1, 2), bloodColor, 0.5);
    this.addDecal(z.x + rand(-18, 18), z.y + rand(-14, 14), z.r * rand(0.5, 1.1), bloodColor, 0.35);
    this.sound.kill();
    if (this.player.stats.lifesteal > 0) {
      const healed = this.player.heal(this.player.stats.lifesteal);
      if (healed > 0) this.floatText(z.x, z.y - 20, `+${Math.round(healed)}`, '#8ac926', 11);
    }

    if (z.type === 'screamer') {
      this.screamerDeath(z);
    }

    const coinCount = z.isBoss ? 24 : randInt(def.coins[0], def.coins[1]);
    for (let i = 0; i < coinCount; i++) {
      this.spawnPickup('coin', z.x + rand(-6, 6), z.y + rand(-6, 6), {
        value: z.isBoss ? 2 : 1,
        vx: rand(-160, 160),
        vy: rand(-160, 160),
      });
    }

    if (z.isBoss) {
      this.boss = null;
      this.ui.bossBar.classList.add('hidden');
      this.shake(24);
      this.sound.explosion();
      this.ring(z.x, z.y, 30, 'rgba(255,90,60,0.9)', 1.1, 500);
      this.ring(z.x, z.y, 50, 'rgba(255,220,150,0.6)', 0.8, 300);
      this.spawnPickup('health', z.x + 34, z.y, { vx: -80, vy: -60 });
      this.spawnPickup('ammo', z.x - 34, z.y, { vx: 80, vy: -60 });
      this.spawnPickup('powerup', z.x, z.y + 28, { vx: 0, vy: -90 });
      this.announce('BOSS DOWN', 'THE HORDE WAVERS', false);
      this.toast('BOSS ELIMINATED — SCAVENGE THE DROP', '');
      this.score += 750;
    } else {
      if (chance(0.045)) this.spawnPickup('health', z.x, z.y);
      if (chance(0.065)) this.spawnPickup('ammo', z.x, z.y);
      if (chance(0.016)) this.spawnPickup('powerup', z.x, z.y);
    }
  }

  screamerPulse(z) {
    this.ring(z.x, z.y, 18, 'rgba(255,224,102,0.7)', 0.55, 340);
    this.sound.growl(1.6);
    let buffed = 0;
    for (const other of this.zombies) {
      if (other === z || other.dead) continue;
      if (dist(z.x, z.y, other.x, other.y) < 360) {
        other.buffTimer = Math.max(other.buffTimer, 6);
        buffed++;
      }
    }
    if (buffed > 3) this.toast('SCREAMER IS BUFFING THE HORDE', 'warn');
    for (let i = 0; i < 14; i++) {
      const a = rand(0, TAU);
      this.spawnParticle({
        kind: 'spark', x: z.x, y: z.y, vx: Math.cos(a) * rand(60, 340), vy: Math.sin(a) * rand(60, 340),
        life: 0.5, maxLife: 0.5, size: rand(1, 2.5), color: '#ffe066', drag: 2,
      });
    }
  }

  screamerDeath(z) {
    this.ring(z.x, z.y, 26, 'rgba(255,224,102,0.8)', 0.8, 440);
    this.sound.growl(2);
    for (const other of this.zombies) {
      if (other === z || other.dead) continue;
      if (dist(z.x, z.y, other.x, other.y) < 320) other.buffTimer = Math.max(other.buffTimer, 7);
    }
  }

  // =========================================================
  //  PROJECTILES & PLAYER FIRE
  // =========================================================
  spawnBullet(b) {
    this.bullets.push({
      x: b.x, y: b.y, px: b.x, py: b.y,
      angle: b.angle,
      vx: Math.cos(b.angle) * b.speed,
      vy: Math.sin(b.angle) * b.speed,
      speed: b.speed,
      damage: b.damage,
      crit: b.crit,
      pierce: b.pierce || 0,
      knockback: b.knockback || 0,
      color: b.color,
      weapon: b.weapon,
      r: b.weapon === 'shotgun' ? 3.2 : 2.6,
      life: 1.2,
      hits: [],
      dead: false,
    });
    if (this.bullets.length > 180) this.bullets.shift();
  }

  updateBullets(dt) {
    const zs = this.zombies;
    for (const b of this.bullets) {
      if (b.dead) continue;
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < 34 || b.y < 34 || b.x > WORLD.w - 34 || b.y > WORLD.h - 34) {
        b.dead = true;
        continue;
      }
      const hits = [];
      for (const z of zs) {
        if (z.dead || z.spawnT < 0.22) continue;
        if (b.hits.includes(z)) continue;
        const t = segCircle(b.px, b.py, b.x, b.y, z.x, z.y, z.r + b.r);
        if (t >= 0) hits.push({ z, t });
      }
      if (!hits.length) continue;
      hits.sort((a, c) => a.t - c.t);
      let consumed = 0;
      for (const hit of hits) {
        const z = hit.z;
        if (z.dead) continue;
        const ix = lerp(b.px, b.x, hit.t);
        const iy = lerp(b.py, b.y, hit.t);
        z.takeDamage(b.damage, { crit: b.crit, weapon: b.weapon });
        b.hits.push(z);
        const kb = b.knockback * (z.isBoss ? 0.045 : z.type === 'brute' ? 0.35 : 1);
        z.vx += Math.cos(b.angle) * kb;
        z.vy += Math.sin(b.angle) * kb;
        this.burstBlood(ix, iy, b.crit ? 5 : 2, z.isBoss ? '#5a0d11' : z.def.blood, 100);
        this.sparkle(ix, iy, b.color, b.crit ? 3 : 1);
        this.floatText(ix + rand(-4, 4), iy - 12, String(Math.round(b.damage)), b.crit ? '#ffd166' : '#e8eef0', b.crit ? 16 : 10, b.crit);
        this.crosshairHit = Math.max(this.crosshairHit, 1);
        this.sound.hit(b.crit);
        consumed += 1;
        if (consumed > b.pierce) {
          b.dead = true;
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
  }

  spawnAcid(x, y, angle, damage, speed = 420) {
    this.acids.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 8,
      damage,
      life: 4.2,
      dead: false,
      trail: 0,
    });
  }

  updateAcids(dt) {
    const p = this.player;
    for (const a of this.acids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.life -= dt;
      a.trail -= dt;
      if (a.trail <= 0) {
        a.trail = 0.035;
        this.spawnParticle({
          kind: 'ember', x: a.x + rand(-3, 3), y: a.y + rand(-3, 3),
          vx: rand(-20, 20), vy: rand(-20, 20), life: 0.4, maxLife: 0.4,
          size: rand(2, 4), color: 'rgba(160,255,90,0.35)',
        });
      }
      if (dist(a.x, a.y, p.x, p.y) < a.r + p.r) {
        a.dead = true;
        p.takeDamage(a.damage, a.x - a.vx, a.y - a.vy);
        this.burstBlood(p.x, p.y, 6, '#4d5f1c', 130);
        this.ring(a.x, a.y, 8, 'rgba(157,255,77,0.5)', 0.35, 120);
        this.sound.hit(false);
      }
      if (a.life <= 0 || a.x < 34 || a.y < 34 || a.x > WORLD.w - 34 || a.y > WORLD.h - 34) {
        a.dead = true;
        this.ring(a.x, a.y, 6, 'rgba(157,255,77,0.35)', 0.4, 90);
      }
    }
    this.acids = this.acids.filter((a) => !a.dead);
  }

  spawnShockwave(x, y, maxRadius, damage, color = '#ff6b5c') {
    this.shockwaves.push({
      x, y, r: 26, max: maxRadius, damage, color,
      speed: 640, hit: false, dead: false,
    });
  }

  updateShockwaves(dt) {
    const p = this.player;
    for (const s of this.shockwaves) {
      const prev = s.r;
      s.r += s.speed * dt;
      if (chance(dt * 26)) {
        const a = rand(0, TAU);
        this.spawnParticle({
          kind: 'smoke', x: s.x + Math.cos(a) * s.r, y: s.y + Math.sin(a) * s.r,
          vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 0.45, maxLife: 0.45,
          size: rand(5, 11), color: 'rgba(190,140,110,0.14)', grow: 20,
        });
      }
      if (!s.hit && s.damage > 0) {
        const d = dist(s.x, s.y, p.x, p.y);
        if (d + p.r > prev - 12 && d - p.r < s.r + 12) {
          s.hit = true;
          p.takeDamage(s.damage, s.x, s.y);
        }
      }
      if (s.r >= s.max) s.dead = true;
    }
    this.shockwaves = this.shockwaves.filter((s) => !s.dead);
  }

  updateMuzzleLight(dt) {
    if (this.muzzleLight) {
      this.muzzleLight.life -= dt;
      if (this.muzzleLight.life <= 0) this.muzzleLight = null;
    }
  }

  shake(amount) {
    this.shakeAmt = Math.min(32, this.shakeAmt + amount);
  }

  getAimAssist(x, y, angle) {
    let best = null;
    let bestScore = Infinity;
    for (const z of this.zombies) {
      if (z.dead) continue;
      const d = dist(x, y, z.x, z.y);
      if (d > 560) continue;
      const a = Math.atan2(z.y - y, z.x - x);
      const diff = Math.abs(angleDiff(angle, a));
      if (diff > 0.35) continue;
      const score = diff + d / 4000;
      if (score < bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best === null ? angle : angleLerp(angle, best, 0.62);
  }

  // =========================================================
  //  PICKUPS & POWER-UPS
  // =========================================================
  spawnPickup(kind, x, y, opts = {}) {
    if (this.pickups.length > 260) {
      const idx = this.pickups.findIndex((p) => p.kind === 'coin');
      if (idx >= 0) this.pickups.splice(idx, 1);
    }
    const powerDef = kind === 'powerup'
      ? (opts.power ? POWERUP_BY_ID[opts.power] : weightedPick(POWERUPS, (p) => p.weight))
      : null;
    this.pickups.push({
      kind, x, y,
      vx: opts.vx ?? rand(-70, 70),
      vy: opts.vy ?? rand(-70, 70),
      value: opts.value || 1,
      power: powerDef,
      r: kind === 'coin' ? 7 : kind === 'powerup' ? 13 : 11,
      bob: rand(0, TAU),
      life: 0,
      dead: false,
    });
  }

  updatePickups(dt) {
    const p = this.player;
    const magnet = (kind) => {
      const base = kind === 'coin' ? 96 : 58;
      return base * p.stats.magnet;
    };
    for (const it of this.pickups) {
      it.bob += dt * 3.2;
      it.life += dt;
      const d = dist(it.x, it.y, p.x, p.y);
      const mr = magnet(it.kind);
      if (d < mr) {
        const n = norm(p.x - it.x, p.y - it.y);
        const pull = 380 + (mr - d) * 8;
        it.vx += n.x * pull * dt;
        it.vy += n.y * pull * dt;
      }
      it.vx *= Math.exp(-2.8 * dt);
      it.vy *= Math.exp(-2.8 * dt);
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      const takeR = p.r + it.r + 4;
      if (d < takeR) {
        it.dead = true;
        this.collectPickup(it);
      }
    }
    this.pickups = this.pickups.filter((it) => !it.dead);
  }

  collectPickup(it) {
    const p = this.player;
    if (it.kind === 'coin') {
      this.coins += it.value;
      this.coinsEarned += it.value;
      this.score += 3;
      this.sparkle(it.x, it.y, '#ffb703', 2);
      this.coinSoundCd = (this.coinSoundCd || 0) - 1;
      if (this.coinSoundCd <= 0) {
        this.sound.coin();
        this.coinSoundCd = 3;
      }
    } else if (it.kind === 'health') {
      const healed = p.heal(35);
      this.sparkle(it.x, it.y, '#ff6b6d', 8);
      this.sound.pickup();
      if (healed > 0) {
        this.toast(`TRAUMA KIT +${Math.round(healed)} HP`, '');
        this.floatText(p.x, p.y - 30, `+${Math.round(healed)}`, '#8ac926', 15);
      } else {
        this.score += 40;
        this.toast('VITALS FULL +40 SCORE', '');
      }
    } else if (it.kind === 'ammo') {
      const added = p.addAmmo(0.35);
      this.sparkle(it.x, it.y, '#ffd166', 8);
      this.sound.pickup();
      if (added > 0) this.toast(`AMMO CACHE +${added} RESERVE`, '');
      else {
        this.score += 40;
        this.toast('AMMO FULL +40 SCORE', '');
      }
    } else if (it.kind === 'powerup' && it.power) {
      this.applyPowerup(it.power);
      this.sparkle(it.x, it.y, it.power.color, 14);
    }
  }

  applyPowerup(power) {
    const p = this.player;
    this.sound.powerup();
    this.ring(p.x, p.y, 20, power.color, 0.7, 260);
    if (power.id === 'rapid') {
      p.rapid = Math.max(p.rapid, power.duration);
      this.toast('RAPID FIRE ONLINE', '');
    } else if (power.id === 'damage') {
      p.damagePower = Math.max(p.damagePower, power.duration);
      this.toast('OVERCHARGE — DAMAGE UP', '');
    } else if (power.id === 'shield') {
      p.addShield(70, power.duration);
      this.toast('AEGIS SHIELD DEPLOYED', '');
    } else if (power.id === 'freeze') {
      this.freeze = power.duration;
      this.toast('CRYO BURST — HORDE SLOWED', '');
      for (let i = 0; i < 26; i++) {
        const a = rand(0, TAU);
        this.spawnParticle({
          kind: 'spark', x: p.x, y: p.y, vx: Math.cos(a) * rand(80, 520), vy: Math.sin(a) * rand(80, 520),
          life: rand(0.4, 0.8), maxLife: 0.8, size: rand(1, 2.6), color: '#9bd7ff', drag: 2,
        });
      }
    } else if (power.id === 'nuke') {
      this.ui.nukeFlash.style.opacity = '0.92';
      setTimeout(() => { this.ui.nukeFlash.style.opacity = '0'; }, 70);
      this.sound.explosion();
      this.shake(22);
      this.ring(p.x, p.y, 30, 'rgba(255,220,140,0.95)', 1.4, 1500);
      for (const z of [...this.zombies]) {
        if (!z.dead) z.takeDamage(z.isBoss ? 320 : 9999, {});
      }
      this.toast('DIRTY BOMB DETONATED', '');
    }
    this.updatePowerHUD(0);
  }

  // =========================================================
  //  PARTICLES, TEXT, DECALS
  // =========================================================
  spawnParticle(props) {
    if (this.particles.length > 820) this.particles.shift();
    const life = props.life ?? 0.5;
    this.particles.push({
      kind: 'blood',
      x: 0, y: 0, vx: 0, vy: 0,
      life, maxLife: life,
      size: 2, color: '#a51e25',
      drag: 2, grow: 0, rot: 0, rotSpeed: 0,
      gravity: 0,
      ...props,
    });
  }

  burstBlood(x, y, count, color, force = 130) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(force * 0.25, force);
      this.spawnParticle({
        kind: 'blood', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.22, 0.7), maxLife: 0.7,
        size: rand(1.2, 3.6), color, drag: rand(3, 6),
      });
    }
    this.addDecal(x + rand(-6, 6), y + rand(-6, 6), rand(5, 12), color, 0.28);
  }

  burstSparks(x, y, count, color, force = 160, life = 0.3) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(force * 0.25, force);
      this.spawnParticle({
        kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(life * 0.5, life), maxLife: life, size: rand(0.8, 2.2), color, drag: 4,
      });
    }
  }

  sparkle(x, y, color, count = 4) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      this.spawnParticle({
        kind: 'ember', x, y, vx: Math.cos(a) * rand(20, 100), vy: Math.sin(a) * rand(20, 100),
        life: rand(0.2, 0.5), maxLife: 0.5, size: rand(1, 2.6), color, drag: 3,
      });
    }
  }

  dustBurst(x, y, count, color = '#5b5044') {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(20, 110);
      this.spawnParticle({
        kind: 'smoke', x: x + rand(-8, 8), y: y + rand(-6, 6),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.35, 0.8), maxLife: 0.8,
        size: rand(3, 9), color: 'rgba(120,110,95,0.22)', grow: rand(12, 28),
      });
    }
  }

  ring(x, y, radius, color, life = 0.5, grow = 260) {
    this.spawnParticle({
      kind: 'ring', x, y, radius, grow, color, life, maxLife: life, size: 1.5,
    });
  }

  floatText(x, y, text, color = '#fff', size = 12, crit = false) {
    if (this.texts.length > 80) this.texts.shift();
    this.texts.push({ x, y, text, color, size, crit, life: 0.8, maxLife: 0.8, vy: -46, vx: rand(-14, 14) });
  }

  addDecal(x, y, r, color, alpha) {
    if (this.decals.length > 170) this.decals.shift();
    this.decals.push({
      x, y, r, color, alpha,
      rot: rand(0, TAU),
      squash: rand(0.55, 1),
      blobs: Array.from({ length: randInt(2, 4) }, () => ({
        dx: rand(-r * 0.5, r * 0.5), dy: rand(-r * 0.35, r * 0.35), rr: rand(r * 0.2, r * 0.55),
      })),
    });
  }

  updateEffects(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const drag = Math.exp(-(p.drag || 0) * dt);
      p.vx *= drag;
      p.vy *= drag;
      if (p.grow) p.size += p.grow * dt;
      if (p.rotSpeed) p.rot += p.rotSpeed * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const t of this.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
      t.x += t.vx * dt;
      t.vy *= Math.exp(-1.8 * dt);
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  // =========================================================
  //  HUD
  // =========================================================
  updateHUD() {
    const p = this.player;
    const c = this.hudCache;
    const hpPct = clamp(p.hp / p.maxHp, 0, 1) * 100;
    const hpWidth = hpPct.toFixed(1);
    if (c.hpWidth !== hpWidth) {
      c.hpWidth = hpWidth;
      this.ui.hpFill.style.width = hpWidth + '%';
    }
    const hpText = String(Math.ceil(p.hp));
    if (c.hpText !== hpText) {
      c.hpText = hpText;
      this.ui.hpText.textContent = hpText;
    }
    const low = hpPct < 30;
    if (c.low !== low) {
      c.low = low;
      this.ui.hpText.classList.toggle('low', low);
      this.ui.hpFill.classList.toggle('low', low);
    }

    const shieldVisible = p.shield > 0;
    if (c.shieldVisible !== shieldVisible) {
      c.shieldVisible = shieldVisible;
      this.ui.shieldWrap.classList.toggle('hidden', !shieldVisible);
    }
    const shieldWidth = (clamp(p.shield / p.shieldMax, 0, 1) * 100).toFixed(1) + '%';
    if (c.shieldWidth !== shieldWidth) {
      c.shieldWidth = shieldWidth;
      this.ui.shieldFill.style.width = shieldWidth;
    }

    const waveText = String(this.wave).padStart(2, '0');
    if (c.wave !== waveText) {
      c.wave = waveText;
      this.ui.waveNum.textContent = waveText;
    }
    if (c.coins !== this.coins) {
      if (this.coins > (c.coins ?? 0)) {
        const chip = this.ui.coinNum.parentElement;
        chip.classList.remove('bump');
        void chip.offsetWidth;
        chip.classList.add('bump');
      }
      c.coins = this.coins;
      this.ui.coinNum.textContent = String(this.coins);
    }
    const scoreText = formatNumber(this.score);
    if (c.score !== scoreText) {
      c.score = scoreText;
      this.ui.scoreNum.textContent = scoreText;
    }
    let remaining = this.spawnQueue.length + this.warnings.length;
    for (const z of this.zombies) if (!z.dead) remaining++;
    if (c.remaining !== remaining) {
      c.remaining = remaining;
      this.ui.enemiesNum.textContent = String(remaining);
    }

    // weapons
    for (let i = 0; i < this.cardCache.length; i++) {
      const cache = this.cardCache[i];
      const wp = p.weapons[i];
      const def = wp.def;
      const active = i === p.weaponIndex;
      const reloading = wp.reloading;
      const empty = wp.mag <= 0;
      if (cache.lastActive !== active) {
        cache.lastActive = active;
        cache.card.classList.toggle('active', active);
      }
      if (cache.lastReloading !== reloading) {
        cache.lastReloading = reloading;
        cache.card.classList.toggle('reloading', reloading);
      }
      if (cache.lastEmpty !== empty) {
        cache.lastEmpty = empty;
        cache.card.classList.toggle('empty', empty);
      }
      if (cache.lastMag !== wp.mag) {
        cache.lastMag = wp.mag;
        cache.mag.textContent = String(wp.mag);
      }
      const resText = wp.reserve === Infinity ? '/ ∞' : `/ ${wp.reserve}`;
      if (cache.lastRes !== resText) {
        cache.lastRes = resText;
        cache.res.textContent = resText;
      }
      const reloadW = reloading
        ? (clamp(1 - wp.reloadTimer / (def.reload / p.stats.reloadSpeed), 0, 1) * 100).toFixed(1)
        : '0.0';
      if (cache.lastReloadW !== reloadW) {
        cache.lastReloadW = reloadW;
        cache.reload.style.width = reloadW + '%';
      }
      const dry = wp.mag <= 0 && !wp.reloading;
      if (cache.lastDry !== dry) {
        cache.lastDry = dry;
        cache.dry.style.display = dry ? 'block' : 'none';
      }
      const dryText = wp.reserve > 0 ? 'RELOAD' : 'NO AMMO';
      if (cache.lastDryText !== dryText) {
        cache.lastDryText = dryText;
        cache.dry.textContent = dryText;
      }
    }

    // boss
    const bossActive = Boolean(this.boss && !this.boss.dead);
    if (c.bossActive !== bossActive) {
      c.bossActive = bossActive;
      this.ui.bossBar.classList.toggle('hidden', !bossActive);
    }
    if (bossActive) {
      if (c.bossName !== this.boss.name) {
        c.bossName = this.boss.name;
        this.ui.bossName.textContent = this.boss.name;
      }
      const bossWidth = (clamp(this.boss.hp / this.boss.maxHp, 0, 1) * 100).toFixed(1) + '%';
      if (c.bossWidth !== bossWidth) {
        c.bossWidth = bossWidth;
        this.ui.bossFill.style.width = bossWidth;
      }
      const bossHp = `${Math.ceil(this.boss.hp)} / ${this.boss.maxHp}`;
      if (c.bossHp !== bossHp) {
        c.bossHp = bossHp;
        this.ui.bossHpText.textContent = bossHp;
      }
    }
  }

  updatePowerHUD(dt) {
    const p = this.player;
    const list = [];
    if (p.rapid > 0) list.push({ id: 'rapid', icon: '⚡', name: 'RAPID FIRE', time: p.rapid, cls: '' });
    if (p.damagePower > 0) list.push({ id: 'damage', icon: '☠', name: 'OVERCHARGE', time: p.damagePower, cls: 'damage' });
    if (p.shield > 0) list.push({ id: 'shield', icon: '⛨', name: 'SHIELD', time: p.shieldTimer, cls: 'shield', extra: Math.ceil(p.shield) });
    if (this.freeze > 0) list.push({ id: 'freeze', icon: '❄', name: 'CRYO', time: this.freeze, cls: 'slow' });
    const sig = list.map((x) => x.id).join(',');
    if (sig !== this.powerSignature) {
      this.powerSignature = sig;
      this.ui.powerList.innerHTML = list.map((x) => `
        <div class="power-chip ${x.cls}" data-power="${x.id}">
          <span class="p-icon">${x.icon}</span><span>${x.name}</span>
          <span class="p-time" data-time>${x.time.toFixed(1)}s</span>
        </div>
      `).join('');
      this.powerCache = list;
    } else if (list.length) {
      const chips = this.ui.powerList.children;
      for (let i = 0; i < list.length && i < chips.length; i++) {
        const el = chips[i].querySelector('[data-time]');
        const x = list[i];
        if (el) el.textContent = x.extra ? `${x.extra} | ${x.time.toFixed(1)}s` : `${x.time.toFixed(1)}s`;
      }
    }
  }

  // =========================================================
  //  DEBUG HOOK (also powers automated tests)
  // =========================================================
  exposeDebug() {
    const game = this;
    window.__ZO__ = {
      ready: true,
      get game() { return game; },
      snapshot() {
        return {
          mode: game.mode,
          wave: game.wave,
          hp: game.player.hp,
          maxHp: game.player.maxHp,
          shield: game.player.shield,
          coins: game.coins,
          score: game.score,
          kills: game.kills,
          weapon: game.player.weaponIndex,
          weapons: game.player.weapons.map((w) => ({ id: w.def.id, mag: w.mag, reserve: w.reserve, reloading: w.reloading })),
          zombies: game.zombies.length,
          zombiesByType: game.zombies.reduce((acc, z) => { acc[z.type] = (acc[z.type] || 0) + 1; return acc; }, {}),
          boss: game.boss ? { name: game.boss.name, hp: game.boss.hp, maxHp: game.boss.maxHp, state: game.boss.state } : null,
          spawnQueue: game.spawnQueue.length,
          warnings: game.warnings.length,
          offers: game.offers.map((o) => ({ id: o.def.id, cost: o.cost, sold: o.sold })),
          upgrades: { ...game.player.upgradeLevels },
          powerups: { rapid: game.player.rapid, damage: game.player.damagePower, freeze: game.freeze, shield: game.player.shield },
          particles: game.particles.length,
          touch: game.input.isTouch,
          devMode: game.player.upgradeLevels.dev === 1,
        };
      },
      start() { game.startRun(); },
      menu() { game.enterMenu(); },
      pause() { game.pause(); },
      resume() { game.resume(); },
      startWave(n) {
        game.hideGameplayOverlays();
        game.ui.hud.classList.remove('hidden');
        game.resetRun();
        game.mode = 'playing';
        document.body.classList.add('playing');
        game.startWave(n);
      },
      spawn(type = 'walker', dx = 130, dy = 0) {
        const p = game.player;
        return game.spawnZombie(type, p.x + dx, p.y + dy, { spawnT: 0.3 }).type;
      },
      spawnAt(type, x, y) {
        return game.spawnZombie(type, x, y, { spawnT: 0.3 });
      },
      step(seconds = 1, dt = 1 / 60) {
        const steps = Math.max(1, Math.ceil(seconds / dt));
        for (let i = 0; i < steps; i++) game.update(dt);
        return game.time;
      },
      givePower(id) {
        const power = POWERUP_BY_ID[id];
        if (power) game.applyPowerup(power);
        return Boolean(power);
      },
      killAll() {
        game.spawnQueue = [];
        game.warnings = [];
        for (const z of [...game.zombies]) {
          if (!z.dead) z.takeDamage(1e9, {});
        }
      },
      damagePlayer(n = 10) {
        game.player.invuln = 0;
        game.player.shield = 0;
        game.player.takeDamage(n, game.player.x + 30, game.player.y);
        return game.player.hp;
      },
      addCoins(n = 100) { game.coins += n; game.coinsEarned += n; game.updateHUD(); },
      setWeapon(i) { game.player.swapWeapon(i); },
      buy(index = 0) { game.buyUpgrade(index); },
      nextWave() { game.nextWave(); },
      clearOverlays() { game.hideGameplayOverlays(); },
      forceIntermission() {
        game.spawnQueue = [];
        game.warnings = [];
        for (const z of [...game.zombies]) if (!z.dead) z.takeDamage(1e9, {});
        game.zombies = [];
        game.waveEndTimer = 0.05;
      },
      aimAt(dx, dy) { game.player.aim = Math.atan2(dy, dx); },
      fire() { game.player.shoot(); },
      teleport(x, y) { game.player.x = x; game.player.y = y; },
      setupTouch() { game.input.isTouch = true; document.body.classList.add('touch'); document.body.classList.remove('desktop'); },
    };
  }

  // =========================================================
  //  RENDER
  // =========================================================
  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#06080b';
    ctx.fillRect(0, 0, this.w, this.h);

    const shake = this.shakeAmt;
    const sx = shake > 0.1 ? rand(-shake, shake) : 0;
    const sy = shake > 0.1 ? rand(-shake, shake) : 0;
    this.camera.shakeX = sx;
    this.camera.shakeY = sy;

    ctx.save();
    ctx.translate(this.w / 2 + sx, this.h / 2 + sy);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    this.drawFloor();

    if (this.mode === 'menu') {
      this.drawMenuScene();
    } else {
      this.drawWorldScene();
    }
    ctx.restore();

    this.drawScreenFog();
    if (this.mode === 'playing' && !this.input.isTouch) this.drawCrosshair();
    if (this.mode !== 'menu') this.drawMinimap();
  }

  paintFloorBase(view) {
    const ctx = this.ctx;
    const vw = view.x2 - view.x1;
    const vh = view.y2 - view.y1;

    ctx.fillStyle = '#0e1216';
    ctx.fillRect(view.x1, view.y1, vw, vh);
    if (this.floorPattern) {
      ctx.fillStyle = this.floorPattern;
      ctx.fillRect(view.x1, view.y1, vw, vh);
    }

    // central quarantine seal
    const cx = WORLD.w / 2;
    const cy = WORLD.h / 2;
    if (dist(view.x1 + vw / 2, view.y1 + vh / 2, cx, cy) < Math.max(vw, vh)) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(255,183,3,0.055)';
      ctx.fillStyle = 'rgba(255,183,3,0.025)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 430, 0, TAU);
      ctx.stroke();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.setLineDash([22, 26]);
      ctx.beginPath();
      ctx.arc(0, 0, 388, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 350, 0, TAU);
      ctx.stroke();
      // crosshair cardinal lines
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = 'rgba(255,183,3,0.06)';
        ctx.beginPath();
        ctx.moveTo(300, -12);
        ctx.lineTo(360, 0);
        ctx.lineTo(300, 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.rotate(-0.02);
      ctx.font = "900 46px Arial, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,183,3,0.05)';
      ctx.fillText('QUARANTINE', 0, -34);
      ctx.font = "700 17px monospace";
      ctx.fillText('ZONE 07  //  DO NOT CROSS', 0, 6);
      ctx.font = "900 28px Arial, sans-serif";
      ctx.fillStyle = 'rgba(229,56,59,0.06)';
      ctx.fillText('DEAD INSIDE', 0, 52);
      ctx.restore();
    }

    // painted marks
    for (const m of this.paintMarks) {
      if (m.x < view.x1 || m.x > view.x2 || m.y < view.y1 || m.y > view.y2) continue;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      ctx.globalAlpha = m.alpha;
      if (m.kind === 'arrow') {
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(-60, -14);
        ctx.lineTo(34, -14);
        ctx.lineTo(34, -30);
        ctx.lineTo(76, 0);
        ctx.lineTo(34, 30);
        ctx.lineTo(34, 14);
        ctx.lineTo(-60, 14);
        ctx.closePath();
        ctx.fill();
      } else if (m.kind === 'hazard') {
        ctx.fillStyle = '#ffb703';
        for (let i = 0; i < 9; i++) {
          ctx.save();
          ctx.translate(i * 20 - 90, 0);
          ctx.rotate(0.35);
          ctx.fillRect(-4, -25, 9, 50);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#d8e0e4';
        ctx.font = "700 17px monospace";
        ctx.textAlign = 'center';
        ctx.fillText('EVAC →', 0, 0);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // static debris and stains
    for (const d of this.decor) {
      if (d.x < view.x1 - 60 || d.x > view.x2 + 60 || d.y < view.y1 - 60 || d.y > view.y2 + 60) continue;
      this.drawDecor(d);
    }

    // walls
    this.drawWalls(view);
  }

  drawFloor() {
    const ctx = this.ctx;
    const view = this.getViewRect(80);
    if (this.floorTexture) {
      const s = this.floorTexture.width / WORLD.w;
      const vw = view.x2 - view.x1;
      const vh = view.y2 - view.y1;
      ctx.drawImage(
        this.floorTexture,
        view.x1 * s, view.y1 * s, vw * s, vh * s,
        view.x1, view.y1, vw, vh,
      );
    } else {
      this.paintFloorBase(view);
    }

    // dynamic blood decals
    for (const dec of this.decals) {
      if (dec.x < view.x1 - 80 || dec.x > view.x2 + 80 || dec.y < view.y1 - 80 || dec.y > view.y2 + 80) continue;
      ctx.save();
      ctx.translate(dec.x, dec.y);
      ctx.rotate(dec.rot);
      ctx.globalAlpha = dec.alpha;
      ctx.fillStyle = dec.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, dec.r, dec.r * dec.squash, 0, 0, TAU);
      ctx.fill();
      for (const b of dec.blobs) {
        ctx.beginPath();
        ctx.arc(b.dx, b.dy, b.rr, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawDecor(d) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = d.alpha;
    if (d.type === 'stain') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r, d.r * 0.62, 0, 0, TAU);
      ctx.ellipse(d.r * 0.4, d.r * 0.2, d.r * 0.45, d.r * 0.32, 0, 0, TAU);
      ctx.fill();
    } else if (d.type === 'paper') {
      ctx.fillStyle = '#9ba4a2';
      ctx.fillRect(-7, -9, 14, 18);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-4, -5, 8, 1);
      ctx.fillRect(-4, -2, 8, 1);
      ctx.fillRect(-4, 1, 5, 1);
    } else if (d.type === 'crack') {
      ctx.strokeStyle = '#050708';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-d.r, 0);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(-d.r + (i + 1) * (d.r * 2 / 5), (i % 2 ? 1 : -1) * d.r * 0.28);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -d.r * 0.4);
      ctx.lineTo(d.r * 0.3, d.r * 0.5);
      ctx.stroke();
    } else if (d.type === 'debris') {
      ctx.fillStyle = '#343b3e';
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(i * 0.8);
        ctx.fillRect(i * 5 - 10, i * 3 - 6, 5 + (i % 2) * 4, 3);
        ctx.restore();
      }
    } else if (d.type === 'manhole') {
      ctx.strokeStyle = '#050708';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, d.r * 0.8, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, d.r * 0.6, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate(i * TAU / 6);
        ctx.beginPath();
        ctx.moveTo(d.r * 0.25, 0);
        ctx.lineTo(d.r * 0.55, 0);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawWalls(view) {
    const ctx = this.ctx;
    const W = WORLD.w;
    const H = WORLD.h;
    const t = 48;
    ctx.save();
    // perimeter asphalt
    ctx.fillStyle = '#080b0e';
    ctx.fillRect(0, 0, W, t);
    ctx.fillRect(0, H - t, W, t);
    ctx.fillRect(0, 0, t, H);
    ctx.fillRect(W - t, 0, t, H);
    // concrete edge
    ctx.strokeStyle = 'rgba(120,132,140,0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(t + 1, t + 1, W - t * 2 - 2, H - t * 2 - 2);
    ctx.strokeStyle = 'rgba(229,56,59,0.17)';
    ctx.lineWidth = 3;
    ctx.strokeRect(t + 9, t + 9, W - t * 2 - 18, H - t * 2 - 18);

    // pylons / hazard markers
    const step = 240;
    const pulse = 0.5 + Math.sin(this.time * 2) * 0.2;
    for (let x = 120; x < W; x += step) {
      if (x > view.x1 - 20 && x < view.x2 + 20) {
        ctx.fillStyle = '#151b20';
        ctx.fillRect(x - 5, 30, 10, 18);
        ctx.fillStyle = `rgba(255,183,3,${0.18 + pulse * 0.12})`;
        ctx.fillRect(x - 2, 38, 4, 4);
        ctx.fillStyle = '#151b20';
        ctx.fillRect(x - 5, H - 48, 10, 18);
        ctx.fillStyle = `rgba(255,183,3,${0.18 + pulse * 0.12})`;
        ctx.fillRect(x - 2, H - 42, 4, 4);
      }
    }
    for (let y = 120; y < H; y += step) {
      if (y > view.y1 - 20 && y < view.y2 + 20) {
        ctx.fillStyle = '#151b20';
        ctx.fillRect(30, y - 5, 18, 10);
        ctx.fillStyle = `rgba(255,60,60,${0.18 + pulse * 0.14})`;
        ctx.fillRect(38, y - 2, 4, 4);
        ctx.fillStyle = '#151b20';
        ctx.fillRect(W - 48, y - 5, 18, 10);
        ctx.fillStyle = `rgba(255,60,60,${0.18 + pulse * 0.14})`;
        ctx.fillRect(W - 42, y - 2, 4, 4);
      }
    }

    // hazard corners
    for (const [cx2, cy2, rot] of [[t, t, 0], [W - t, t, Math.PI / 2], [W - t, H - t, Math.PI], [t, H - t, -Math.PI / 2]]) {
      ctx.save();
      ctx.translate(cx2, cy2);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffb703';
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(12 + i * 12, 14);
        ctx.rotate(0.5);
        ctx.fillRect(0, 0, 5, 32);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawMenuScene() {
    const ctx = this.ctx;
    this.drawPlayerLight();
    this.drawEntities();
    this.drawParticles();
    this.drawTexts();
  }

  drawWorldScene() {
    const ctx = this.ctx;
    const view = this.getViewRect(140);

    this.drawWarnings();
    this.drawPickups();
    this.drawShockwaves();
    this.drawPlayerLight();

    // boss ground telegraphs
    for (const z of this.zombies) {
      if (z.isBoss && !z.dead) z.drawTelegraph(ctx);
    }

    this.drawEntities();

    this.drawAcids();
    this.drawBullets();
    this.drawParticles();
    this.drawTexts();
    this.drawMuzzleLight();
  }

  drawPlayerLight() {
    if (!this.lightSprite) return;
    const ctx = this.ctx;
    const p = this.player;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aim);
    ctx.drawImage(this.lightSprite, -40, -this.lightSprite.height / 2);
    ctx.restore();
  }

  drawMuzzleLight() {
    if (!this.muzzleLight || !this.flashSprite) return;
    const ctx = this.ctx;
    const m = this.muzzleLight;
    const a = clamp(m.life / m.max, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.9;
    ctx.drawImage(this.flashSprite, m.x - 160, m.y - 160);
    ctx.restore();
  }

  drawWarnings() {
    const ctx = this.ctx;
    for (const w of this.warnings) {
      const progress = clamp(1 - w.t / w.max, 0, 1);
      const isBoss = w.boss;
      const radius = isBoss ? 62 : 22;
      const pulse = 0.6 + Math.sin(this.time * 15) * 0.25;
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = isBoss ? `rgba(255,60,55,${0.5 + pulse * 0.3})` : `rgba(229,56,59,${0.35 + pulse * 0.25})`;
      ctx.lineWidth = isBoss ? 4 : 2;
      ctx.setLineDash([isBoss ? 18 : 8, isBoss ? 12 : 6]);
      ctx.rotate(this.time * (isBoss ? 0.6 : 1.2));
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.6 + progress * 0.6), 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = 'rgba(255,80,70,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(TAU / 6);
        ctx.beginPath();
        ctx.moveTo(radius * 0.9, 0);
        ctx.lineTo(radius * 1.35 * (1 + Math.sin(this.time * 8 + i) * 0.1), 0);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // warning ! marker
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = isBoss ? '#ff5c5f' : '#e5383b';
      ctx.font = `900 ${isBoss ? 27 : 17}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, isBoss ? -radius - 16 : -radius - 7);
      ctx.restore();
    }
  }

  drawPickups() {
    const ctx = this.ctx;
    const p = this.player;
    for (const it of this.pickups) {
      const bob = Math.sin(it.bob) * 3;
      const x = it.x;
      const y = it.y;
      ctx.save();
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y + 7, it.r * 0.9, it.r * 0.4, 0, 0, TAU);
      ctx.fill();
      ctx.translate(x, y + bob);
      if (it.kind === 'coin') {
        ctx.save();
        ctx.scale(0.55 + Math.abs(Math.cos(it.bob * 1.3)) * 0.45, 1);
        ctx.fillStyle = '#b87a00';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffcf4a';
        ctx.beginPath();
        ctx.arc(0, 0, 6.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-2, -2, 1.8, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (it.kind === 'health') {
        ctx.fillStyle = 'rgba(255,50,60,0.12)';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#e9eef0';
        ctx.fillRect(-9, -9, 18, 18);
        ctx.strokeStyle = '#9aa3a7';
        ctx.lineWidth = 1;
        ctx.strokeRect(-9, -9, 18, 18);
        ctx.fillStyle = '#e5383b';
        ctx.fillRect(-2.5, -6, 5, 12);
        ctx.fillRect(-6, -2.5, 12, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(-8.5, -8.5, 17, 1.5);
      } else if (it.kind === 'ammo') {
        ctx.fillStyle = 'rgba(255,183,3,0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#4a5132';
        ctx.fillRect(-11, -8, 22, 16);
        ctx.strokeStyle = '#88914f';
        ctx.lineWidth = 1;
        ctx.strokeRect(-11, -8, 22, 16);
        ctx.fillStyle = '#ffd166';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(-8 + i * 4.5, -5, 2.4, 10);
          ctx.beginPath();
          ctx.arc(-6.8 + i * 4.5, -5, 1.2, Math.PI, 0);
          ctx.fill();
        }
      } else if (it.kind === 'powerup' && it.power) {
        const col = it.power.color;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 36);
        g.addColorStop(0, col + '88');
        g.addColorStop(0.5, col + '22');
        g.addColorStop(1, col + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#0c1114';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.font = '700 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.power.icon, 0, 1);
        ctx.strokeStyle = col + '55';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + Math.sin(this.time * 4) * 2, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawShockwaves() {
    const ctx = this.ctx;
    for (const s of this.shockwaves) {
      const t = clamp(s.r / s.max, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 1 - t;
      ctx.lineWidth = 6 * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = (1 - t) * 0.25;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.96, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawEntities() {
    const list = this.mode === 'menu' ? [...this.menuZombies, this.player] : [...this.zombies, this.player];
    list.sort((a, b) => a.y - b.y);
    for (const e of list) e.render(this.ctx, this.time);
  }

  drawAcids() {
    const ctx = this.ctx;
    for (const a of this.acids) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 24);
      g.addColorStop(0, 'rgba(200,255,120,0.55)');
      g.addColorStop(0.4, 'rgba(140,240,60,0.22)');
      g.addColorStop(1, 'rgba(100,200,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 24, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#d6ff9c';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 5.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#7fbe2f';
      ctx.beginPath();
      ctx.arc(a.x - 1, a.y - 1, 3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBullets() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const b of this.bullets) {
      const tail = b.weapon === 'shotgun' ? 14 : 22;
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = b.weapon === 'shotgun' ? 1.6 : 2.1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - Math.cos(b.angle) * tail, b.y - Math.sin(b.angle) * tail);
      ctx.stroke();
      ctx.fillStyle = '#fff8df';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.weapon === 'shotgun' ? 1.5 : 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const lifeRatio = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === 'blood') {
        ctx.globalAlpha = lifeRatio * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * lifeRatio), 0, TAU);
        ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lifeRatio;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.014, p.y - p.vy * 0.014);
        ctx.stroke();
        ctx.restore();
      } else if (p.kind === 'ember') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lifeRatio * 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * lifeRatio), 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'smoke') {
        ctx.globalAlpha = lifeRatio * 0.7;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      } else if (p.kind === 'casing') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, lifeRatio * 2);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -1, p.size, 2);
        ctx.restore();
      } else if (p.kind === 'ring') {
        const elapsed = p.maxLife - p.life;
        const r = (p.radius || 10) + (p.grow || 100) * elapsed;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lifeRatio * 0.85;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 + lifeRatio * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawTexts() {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const ratio = clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = Math.min(1, ratio * 2.2);
      ctx.font = `${t.crit ? 900 : 700} ${t.size}px "Arial", sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(3,5,7,0.85)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawScreenFog() {
    const ctx = this.ctx;
    if (this.mode !== 'playing') return;
    const hpPct = this.player.hp / this.player.maxHp;
    if (hpPct < 0.35) {
      const a = (0.35 - hpPct) * 0.5 * (0.55 + Math.sin(this.time * 5) * 0.25);
      ctx.fillStyle = `rgba(120,3,7,${Math.max(0, a)})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (this.freeze > 0) {
      ctx.fillStyle = 'rgba(120,200,255,0.035)';
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (this.boss && this.boss.enraged) {
      ctx.fillStyle = `rgba(180,20,20,${0.025 + Math.sin(this.time * 4) * 0.012})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  drawCrosshair() {
    const ctx = this.ctx;
    const mx = this.input.mouse.x;
    const my = this.input.mouse.y;
    const kick = this.crosshairKick * 6;
    const gap = 7 + kick;
    const len = 6;
    ctx.save();
    ctx.translate(mx, my);
    ctx.strokeStyle = 'rgba(255,183,3,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-gap - len, 0); ctx.lineTo(-gap, 0);
    ctx.moveTo(gap, 0); ctx.lineTo(gap + len, 0);
    ctx.moveTo(0, -gap - len); ctx.lineTo(0, -gap);
    ctx.moveTo(0, gap); ctx.lineTo(0, gap + len);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,160,0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, 1.3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,183,3,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, gap + len + 4, 0, TAU);
    ctx.stroke();
    if (this.crosshairHit > 0) {
      const a = clamp(this.crosshairHit, 0, 1);
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 2;
      const d = gap + 1;
      const l = 5;
      ctx.beginPath();
      ctx.moveTo(-d, -d); ctx.lineTo(-d - l, -d - l);
      ctx.moveTo(d, -d); ctx.lineTo(d + l, -d - l);
      ctx.moveTo(-d, d); ctx.lineTo(-d - l, d + l);
      ctx.moveTo(d, d); ctx.lineTo(d + l, d + l);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMinimap() {
    const canvas = this.ui.minimap;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const pad = 6;
    const scale = (size - pad * 2) / WORLD.w;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(6,10,13,0.9)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    for (let i = 1; i < 4; i++) {
      const v = pad + (size - pad * 2) * (i / 4);
      ctx.beginPath(); ctx.moveTo(v, pad); ctx.lineTo(v, size - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, v); ctx.lineTo(size - pad, v); ctx.stroke();
    }
    // viewport
    const vw = this.w / this.zoom * scale;
    const vh = this.h / this.zoom * scale;
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.strokeRect(pad + this.camera.x * scale - vw / 2, pad + this.camera.y * scale - vh / 2, vw, vh);
    // pickups
    for (const it of this.pickups) {
      if (it.kind === 'coin') {
        ctx.fillStyle = 'rgba(255,183,3,0.65)';
        ctx.fillRect(pad + it.x * scale - 0.8, pad + it.y * scale - 0.8, 1.6, 1.6);
      } else if (it.kind === 'powerup') {
        ctx.fillStyle = 'rgba(157,255,77,0.9)';
        ctx.beginPath();
        ctx.arc(pad + it.x * scale, pad + it.y * scale, 2, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = it.kind === 'health' ? '#ff5c5f' : '#ffd166';
        ctx.fillRect(pad + it.x * scale - 1.2, pad + it.y * scale - 1.2, 2.4, 2.4);
      }
    }
    // zombies
    for (const z of this.zombies) {
      if (z.dead) continue;
      ctx.fillStyle = z.isBoss ? '#ff3b3b' : 'rgba(229,84,70,0.85)';
      const r = z.isBoss ? 5 : 1.8;
      ctx.beginPath();
      ctx.arc(pad + z.x * scale, pad + z.y * scale, r, 0, TAU);
      ctx.fill();
      if (z.isBoss) {
        ctx.strokeStyle = 'rgba(255,60,60,0.35)';
        ctx.beginPath();
        ctx.arc(pad + z.x * scale, pad + z.y * scale, 8 + Math.sin(this.time * 5) * 2, 0, TAU);
        ctx.stroke();
      }
    }
    // player
    const px = pad + this.player.x * scale;
    const py = pad + this.player.y * scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.player.aim);
    ctx.fillStyle = '#f4f7f8';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3.5, -3.4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-3.5, 3.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // __APPEND_POINT_3__
}

// boot
const game = new Game();
window.__ZOMBIE_GAME__ = game;


// boot is appended below
