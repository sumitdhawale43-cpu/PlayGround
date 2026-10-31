import { ARENAS, FIGHTERS, KEY_MAP, makeFighter } from './data.js';
import { samplePose, drawPreview } from './rig.js';
import { Renderer } from './world.js';
import { Game } from './game.js';
import { AudioEngine } from './audio.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

class PlayerControls {
  constructor() {
    this.held = { left: false, right: false, down: false, block: false, jump: false };
    this.buffer = { punch: 0, kick: 0, special: 0, jump: 0 };
  }
  press(action) {
    if (action in this.buffer) this.buffer[action] = 0.18;
    if (action in this.held) this.held[action] = true;
  }
  release(action) {
    if (action in this.held) this.held[action] = false;
  }
  update(dt) {
    for (const k of Object.keys(this.buffer)) {
      if (this.buffer[k] > 0) this.buffer[k] = Math.max(0, this.buffer[k] - dt);
    }
  }
  reset() {
    for (const k of Object.keys(this.held)) this.held[k] = false;
    for (const k of Object.keys(this.buffer)) this.buffer[k] = 0;
  }
}

const audio = new AudioEngine();
const renderer = new Renderer($('game'));
const controls = new PlayerControls();
let game = null;
let announceTimer = 0;
let matchTimer = 0;

const app = {
  scene: 'title',
  paused: false,
  selectedFighter: 'akira',
  selectedArena: 0,
  game: null,
  demo: [],
  time: 0,
  previewClock: 0,
  matchShown: false,
  lastWinner: null,
};

function otherFighter(key) {
  return key === 'akira' ? 'raze' : 'akira';
}

// ============================== UI helpers ==============================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('is-active', screen.id === id);
  });
}

function hideScreens() {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('is-active'));
}

function setIsHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('is-hidden', hidden);
}

function isTouchLayout() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || window.innerWidth < 820;
}

function refreshTouchMode() {
  document.body.classList.toggle('is-touch', isTouchLayout());
}

function announce(text, sub, opts = {}) {
  const el = $('announce');
  clearTimeout(announceTimer);
  el.className = 'announce';
  el.style.setProperty('--announce-dur', (opts.duration || 1.5) + 's');
  if (opts.color) el.style.setProperty('--accent', opts.color);
  else el.style.removeProperty('--accent');
  el.querySelector('.announce-kicker').textContent =
    opts.kicker || (opts.mode === 'ko' ? 'FINISH' : opts.mode === 'fight' ? 'ENGAGE' : opts.mode === 'win' ? 'ROUND OVER' : 'BLADE ARENA');
  el.querySelector('.announce-text').textContent = text;
  el.querySelector('.announce-sub').textContent = sub || '';
  void el.offsetWidth;
  el.className = 'announce show mode-' + (opts.mode || 'round');
  announceTimer = setTimeout(() => el.classList.remove('show'), (opts.duration || 1.5) * 1000 + 120);
}

function makeDemo() {
  const playerKey = app.selectedFighter;
  const cpuKey = otherFighter(playerKey);
  const p = makeFighter(playerKey, 520, 1);
  const c = makeFighter(cpuKey, 1080, -1);
  p.animTime = 0.35;
  c.animTime = 1.15;
  p.pose = samplePose('idle', p.animTime, p);
  c.pose = samplePose('idle', c.animTime, c);
  app.demo = [p, c];
}

function setPortrait(side, def) {
  const svg = $('portrait-' + side);
  const use = svg.querySelector('use');
  use.setAttribute('href', `#icon-${def.icon}`);
}

function setupFightUI(pDef, cDef) {
  setPortrait('player', pDef);
  setPortrait('cpu', cDef);
  $('name-player').textContent = pDef.name;
  $('epithet-player').textContent = pDef.epithet;
  $('name-cpu').textContent = cDef.name;
  $('epithet-cpu').textContent = cDef.epithet;
  $('panel-player').style.setProperty('--accent', pDef.accent);
  $('panel-cpu').style.setProperty('--accent', cDef.accent);
  $('ready-player').style.setProperty('--accent', pDef.accent);
  $('ready-cpu').style.setProperty('--accent', cDef.accent);
  $('combo-player').style.setProperty('--accent', pDef.accent);
  $('combo-cpu').style.setProperty('--accent', cDef.accent);
  $('hp-player').style.transform = 'scaleX(1)';
  $('hp-trail-player').style.transform = 'scaleX(1)';
  $('hp-cpu').style.transform = 'scaleX(1)';
  $('hp-trail-cpu').style.transform = 'scaleX(1)';
  $('energy-player').style.transform = 'scaleX(0.32)';
  $('energy-cpu').style.transform = 'scaleX(0.32)';
  $('combo-player').classList.remove('is-active');
  $('combo-cpu').classList.remove('is-active');
  $('ready-player').classList.add('is-hidden');
  $('ready-cpu').classList.add('is-hidden');
  $('timer').textContent = '99';
  $('timer').classList.remove('danger');
  $('round-text').textContent = 'ROUND 1';
  const pipsP = $('pips-player').querySelectorAll('i');
  const pipsC = $('pips-cpu').querySelectorAll('i');
  pipsP.forEach((i) => i.classList.remove('won'));
  pipsC.forEach((i) => i.classList.remove('won'));
}

function setBar(fill, trail, ratio) {
  fill.style.transform = `scaleX(${clamp(ratio, 0, 1)})`;
  trail.style.transform = `scaleX(${clamp(ratio, 0, 1)})`;
}

function updateHud() {
  if (!game) return;
  const p = game.player;
  const c = game.cpu;
  const hpP = p.hp / p.maxHp;
  const hpC = c.hp / c.maxHp;
  setBar($('hp-player'), $('hp-trail-player'), hpP);
  setBar($('hp-cpu'), $('hp-trail-cpu'), hpC);
  $('hpval-player').textContent = Math.ceil(p.hp);
  $('hpval-cpu').textContent = Math.ceil(c.hp);
  const frameP = $('hp-player').parentElement;
  const frameC = $('hp-cpu').parentElement;
  frameP.classList.toggle('mid', hpP <= 0.55 && hpP > 0.25);
  frameP.classList.toggle('danger', hpP <= 0.25);
  frameC.classList.toggle('mid', hpC <= 0.55 && hpC > 0.25);
  frameC.classList.toggle('danger', hpC <= 0.25);

  $('energy-player').style.transform = `scaleX(${p.energy / p.maxEnergy})`;
  $('energy-cpu').style.transform = `scaleX(${c.energy / c.maxEnergy})`;
  $('energyval-player').textContent = Math.floor(p.energy);
  $('energyval-cpu').textContent = Math.floor(c.energy);

  const timer = Math.ceil(game.timer);
  $('timer').textContent = timer;
  $('timer').classList.toggle('danger', timer <= 10);
  $('round-text').textContent = game.round >= 3 || (p.roundWins === 1 && c.roundWins === 1)
    ? 'FINAL ROUND'
    : `ROUND ${game.round}`;

  const pipsP = $('pips-player').querySelectorAll('i');
  const pipsC = $('pips-cpu').querySelectorAll('i');
  pipsP.forEach((el, i) => el.classList.toggle('won', i < p.roundWins));
  pipsC.forEach((el, i) => el.classList.toggle('won', i < c.roundWins));

  const comboP = p.combo >= 2 && p.comboTimer > 0 && game.phase !== 'matchEnd';
  const comboC = c.combo >= 2 && c.comboTimer > 0 && game.phase !== 'matchEnd';
  $('combo-player').classList.toggle('is-active', comboP);
  $('combo-cpu').classList.toggle('is-active', comboC);
  $('combo-player').querySelector('.combo-num').textContent = p.combo;
  $('combo-cpu').querySelector('.combo-num').textContent = c.combo;

  const readyP = p.energy >= 50;
  const readyC = c.energy >= 50;
  $('ready-player').classList.toggle('is-hidden', !readyP);
  $('ready-cpu').classList.toggle('is-hidden', !readyC);
  const specialBtn = document.querySelector('.touch-btn.special');
  if (specialBtn) {
    specialBtn.classList.toggle('disabled', !readyP);
    specialBtn.classList.toggle('ready', readyP);
  }
}

// ============================== Flows ==============================
function showTitle() {
  app.scene = 'title';
  app.game = null;
  game = null;
  app.paused = false;
  app.matchShown = false;
  hideScreens();
  $('screen-title').classList.add('is-active');
  setIsHidden($('hud'), true);
  setIsHidden($('touch-controls'), true);
  $('screen-match').classList.remove('is-active');
  $('screen-pause').classList.remove('is-active');
  document.body.classList.remove('in-fight');
  audio.stopMusic();
  audio.duckMusic(false);
  makeDemo();
}

function showSelect() {
  app.scene = 'select';
  app.game = null;
  game = null;
  app.paused = false;
  app.matchShown = false;
  hideScreens();
  $('screen-select').classList.add('is-active');
  setIsHidden($('hud'), true);
  setIsHidden($('touch-controls'), true);
  document.body.classList.remove('in-fight');
  audio.stopMusic();
  audio.duckMusic(false);
  applySelectionUI();
  makeDemo();
  app.previewClock = 1;
}

function selectFighter(key) {
  if (!FIGHTERS[key]) return;
  app.selectedFighter = key;
  applySelectionUI();
  makeDemo();
  audio.play('select');
}

function applySelectionUI() {
  const playerKey = app.selectedFighter;
  const cpuKey = otherFighter(playerKey);
  const pDef = FIGHTERS[playerKey];
  const cDef = FIGHTERS[cpuKey];
  document.querySelectorAll('[data-fighter]').forEach((card) => {
    const key = card.dataset.fighter;
    card.classList.toggle('is-selected', key === playerKey);
    const tag = card.querySelector('[data-tag]');
    if (tag) tag.textContent = key === playerKey ? '1P' : 'CPU';
  });
  document.querySelectorAll('.arena-card').forEach((card) => {
    card.classList.toggle('is-selected', Number(card.dataset.arena) === app.selectedArena);
  });
  $('sel-player').textContent = pDef.name;
  $('sel-cpu').textContent = cDef.name;
  $('sel-arena').textContent = ARENAS[app.selectedArena].name;
  $('screen-select').style.setProperty('--accent', pDef.accent);
}

function selectArena(index) {
  app.selectedArena = clamp(index | 0, 0, ARENAS.length - 1);
  applySelectionUI();
  audio.play('select');
}

function startFight() {
  audio.ensure();
  audio.play('confirm');
  app.scene = 'fight';
  app.paused = false;
  app.matchShown = false;
  app.lastWinner = null;
  hideScreens();
  $('screen-pause').classList.remove('is-active');
  $('screen-match').classList.remove('is-active');
  setIsHidden($('hud'), false);
  refreshTouchMode();
  setIsHidden($('touch-controls'), !isTouchLayout());
  document.body.classList.add('in-fight');
  controls.reset();
  $('announce').classList.remove('show');
  clearTimeout(announceTimer);
  clearTimeout(matchTimer);

  const playerKey = app.selectedFighter;
  const cpuKey = otherFighter(playerKey);
  const pDef = FIGHTERS[playerKey];
  const cDef = FIGHTERS[cpuKey];
  setupFightUI(pDef, cDef);
  audio.startMusic(app.selectedArena);

  game = new Game({
    playerKey,
    cpuKey,
    arena: app.selectedArena,
    callbacks: {
      announce,
      sound: (name, opts) => audio.play(name, opts),
      roundEnd: () => {},
      matchEnd: (winnerKey, info) => {
        const current = game;
        clearTimeout(matchTimer);
        matchTimer = setTimeout(() => {
          if (game === current && app.scene === 'fight') openMatchScreen(winnerKey, info);
        }, 900);
      },
    },
  });
  game.setPlayerInput(controls);
  app.game = game;
  updateHud();
  renderer.setTarget((game.player.x + game.cpu.x) / 2, Math.abs(game.player.x - game.cpu.x) + 160);
}

function openHelp() {
  $('screen-help').classList.add('is-active');
  audio.play('select');
  if (audio.ctx) audio.duckMusic(true);
}

function closeHelp() {
  $('screen-help').classList.remove('is-active');
  if (audio.ctx) audio.duckMusic(false);
}

function togglePause() {
  if (app.scene !== 'fight' || !game) return;
  if (app.paused) {
    app.paused = false;
    $('screen-pause').classList.remove('is-active');
    audio.duckMusic(false);
    audio.play('select');
    return;
  }
  if (game.phase === 'matchEnd') return;
  app.paused = true;
  $('pause-score-player').textContent = game.player.roundWins;
  $('pause-score-cpu').textContent = game.cpu.roundWins;
  $('screen-pause').classList.add('is-active');
  audio.duckMusic(true);
  audio.play('select');
}

function openMatchScreen(winnerKey, info) {
  if (!game) return;
  app.scene = 'matchover';
  app.matchShown = true;
  app.lastWinner = winnerKey;
  setIsHidden($('hud'), true);
  setIsHidden($('touch-controls'), true);
  audio.stopMusic();
  audio.play('win');
  const def = FIGHTERS[winnerKey];
  const isPlayer = winnerKey === game.player.key;
  const winnerFighter = isPlayer ? game.player : game.cpu;
  const panel = document.querySelector('.match-panel');
  panel.style.setProperty('--accent', def.accent);
  $('match-icon').querySelector('use').setAttribute('href', `#icon-${def.icon}`);
  $('match-winner').textContent = def.name;
  $('match-epithet').textContent = def.epithet;
  $('match-verdict').textContent = isPlayer ? 'VICTORY' : 'DEFEAT';
  $('match-kicker').textContent = isPlayer ? 'MATCH COMPLETE // FLAWLESS BLADE' : 'MATCH COMPLETE // THE BLADE FALLS';
  $('match-score-player').textContent = game.player.roundWins;
  $('match-score-cpu').textContent = game.cpu.roundWins;
  $('stat-combo').textContent = `${winnerFighter.maxCombo || 1} HITS`;
  $('stat-hits').textContent = winnerFighter.hitCount;
  $('stat-arena').textContent = ARENAS[game.arena].name;
  $('screen-match').classList.add('is-active');
}

function backToSelectFromFight() {
  clearTimeout(matchTimer);
  audio.stopMusic();
  game = null;
  app.game = null;
  app.paused = false;
  app.scene = 'select';
  $('screen-pause').classList.remove('is-active');
  $('screen-match').classList.remove('is-active');
  setIsHidden($('hud'), true);
  setIsHidden($('touch-controls'), true);
  document.body.classList.remove('in-fight');
  showSelect();
}

// ============================== Keyboard ==============================
function handleMenuKey(e) {
  if ($('screen-help').classList.contains('is-active')) {
    if (e.code === 'Escape' || e.code === 'Enter') closeHelp();
    return true;
  }
  if ($('screen-pause').classList.contains('is-active')) {
    if (e.code === 'Escape') togglePause();
    return true;
  }
  if ($('screen-match').classList.contains('is-active')) {
    if (e.code === 'Enter') {
      $('screen-match').classList.remove('is-active');
      startFight();
    }
    return true;
  }
  if (app.scene === 'title') {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      showSelect();
      audio.play('confirm');
      return true;
    }
    return false;
  }
  if (app.scene === 'select') {
    if (e.code === 'Escape') {
      showTitle();
      audio.play('select');
      return true;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      startFight();
      return true;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (app.selectedFighter !== 'akira') selectFighter('akira');
      return true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (app.selectedFighter !== 'raze') selectFighter('raze');
      return true;
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      selectArena((app.selectedArena + ARENAS.length - 1) % ARENAS.length);
      return true;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      selectArena((app.selectedArena + 1) % ARENAS.length);
      return true;
    }
    if (e.code === 'Digit1' || e.code === 'Numpad1') { selectArena(0); return true; }
    if (e.code === 'Digit2' || e.code === 'Numpad2') { selectArena(1); return true; }
    if (e.code === 'Digit3' || e.code === 'Numpad3') { selectArena(2); return true; }
    return false;
  }
  return false;
}

window.addEventListener('keydown', (e) => {
  audio.ensure();
  if (e.code === 'KeyM') {
    toggleMute();
    return;
  }
  if (e.code === 'Escape') {
    if ($('screen-help').classList.contains('is-active')) {
      closeHelp();
      e.preventDefault();
      return;
    }
    if (app.scene === 'fight') {
      togglePause();
      e.preventDefault();
      return;
    }
    if (app.scene === 'select') {
      showTitle();
      audio.play('select');
      e.preventDefault();
      return;
    }
  }
  if (handleMenuKey(e)) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) e.preventDefault();
    return;
  }
  if (app.scene !== 'fight' || app.paused) return;
  const action = KEY_MAP[e.code];
  if (!action) return;
  e.preventDefault();
  if (e.repeat) return;
  controls.press(action);
});

window.addEventListener('keyup', (e) => {
  const action = KEY_MAP[e.code];
  if (action) controls.release(action);
});
window.addEventListener('blur', () => controls.reset());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && app.scene === 'fight' && !app.paused && game && game.phase !== 'matchEnd') togglePause();
});

// ============================== Pointer / buttons ==============================
document.addEventListener('pointerdown', () => audio.ensure(), { once: true });

document.querySelectorAll('[data-fighter]').forEach((card) => {
  card.addEventListener('click', () => {
    selectFighter(card.dataset.fighter);
  });
});

document.querySelectorAll('[data-arena]').forEach((card) => {
  card.addEventListener('click', () => {
    selectArena(Number(card.dataset.arena));
  });
});

document.querySelectorAll('[data-roster]').forEach((chip) => {
  chip.addEventListener('click', () => {
    audio.ensure();
    selectFighter(chip.dataset.roster);
    showSelect();
    audio.play('confirm');
  });
});

$('btn-start').addEventListener('click', () => {
  audio.ensure();
  audio.play('confirm');
  showSelect();
});
$('btn-howto').addEventListener('click', openHelp);
$('btn-help-close').addEventListener('click', closeHelp);
$('btn-help-done').addEventListener('click', closeHelp);
$('btn-select-back').addEventListener('click', () => {
  showTitle();
  audio.play('select');
});
$('btn-fight').addEventListener('click', startFight);

$('btn-resume').addEventListener('click', togglePause);
$('btn-restart').addEventListener('click', () => {
  $('screen-pause').classList.remove('is-active');
  startFight();
});
$('btn-pause-select').addEventListener('click', () => {
  $('screen-pause').classList.remove('is-active');
  backToSelectFromFight();
});
$('btn-pause-menu').addEventListener('click', () => {
  $('screen-pause').classList.remove('is-active');
  showTitle();
});
$('btn-sound').addEventListener('click', toggleMute);

$('btn-rematch').addEventListener('click', () => {
  $('screen-match').classList.remove('is-active');
  startFight();
});
$('btn-change').addEventListener('click', () => {
  $('screen-match').classList.remove('is-active');
  backToSelectFromFight();
});
$('btn-menu').addEventListener('click', () => {
  $('screen-match').classList.remove('is-active');
  showTitle();
});

// touch controls
document.querySelectorAll('[data-touch]').forEach((btn) => {
  const action = btn.dataset.touch;
  const press = (e) => {
    e.preventDefault();
    audio.ensure();
    btn.classList.add('is-pressed');
    controls.press(action);
    try { btn.setPointerCapture(e.pointerId); } catch {}
  };
  const release = (e) => {
    if (e) e.preventDefault();
    btn.classList.remove('is-pressed');
    controls.release(action);
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
});

document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.touch-controls')) e.preventDefault();
});

// ============================== Sound ==============================
try {
  audio.muted = localStorage.getItem('blade-arena-muted') === '1';
} catch {}
function toggleMute() {
  audio.ensure();
  audio.setMuted(!audio.muted);
  try { localStorage.setItem('blade-arena-muted', audio.muted ? '1' : '0'); } catch {}
  $('btn-sound').textContent = audio.muted ? 'SOUND: OFF' : 'SOUND: ON';
  if (!audio.muted) audio.play('select');
}
$('btn-sound').textContent = audio.muted ? 'SOUND: OFF' : 'SOUND: ON';

// ============================== Previews ==============================
function fitCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(canvas.clientWidth));
  const h = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h, dpr };
}

function drawArenaPreview(canvas, index, time) {
  const { ctx, w, h } = fitCanvas(canvas);
  const scale = Math.max(w / 1600, h / 900);
  const v = {
    w, h, scale,
    offX: w / 2 - 800 * scale,
    offY: h / 2 - 450 * scale,
    camX: 800,
    mobile: false,
    groundY: h / 2 - 450 * scale + 760 * scale,
    horizon: h / 2 - 450 * scale + 548 * scale,
    visibleW: w / scale,
    visibleH: h / scale,
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  renderer.drawArena(ctx, ARENAS[index], time, v);
  renderer.drawArenaParticles(ctx, ARENAS[index], time, v);
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(4,9,16,0.04)');
  shade.addColorStop(1, 'rgba(4,9,16,0.4)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function renderPreviews(dt) {
  if (app.scene !== 'select') return;
  app.previewClock += dt;
  if (app.previewClock < 1 / 26) return;
  app.previewClock = 0;
  document.querySelectorAll('[data-preview]').forEach((canvas) => {
    const key = canvas.dataset.preview;
    const def = FIGHTERS[key];
    if (!def) return;
    const { ctx, w, h } = fitCanvas(canvas);
    if (w < 10 || h < 10) return;
    drawPreview(ctx, def, w, h, app.time, key === 'akira' ? 1 : -1);
  });
  document.querySelectorAll('[data-arena-preview]').forEach((canvas) => {
    const index = Number(canvas.dataset.arenaPreview);
    drawArenaPreview(canvas, index, app.time);
  });
}

// ============================== Main loop ==============================
let last = performance.now();
let accumulator = 0;

function updateDemo(dt) {
  if (!app.demo.length) return;
  for (const f of app.demo) {
    f.animTime += dt;
    f.pose = samplePose('idle', f.animTime, f);
  }
}

function render(dt) {
  let scene;
  if (game && (app.scene === 'fight' || app.scene === 'matchover')) {
    const p = game.player;
    const c = game.cpu;
    scene = {
      arena: game.arena,
      fighters: [p, c],
      projectiles: game.projectiles,
      particles: game.particles,
      effects: game.effects,
      time: game.time,
      shake: game.shake,
      flash: game.flash,
    };
    renderer.setTarget((p.x + c.x) / 2, Math.abs(p.x - c.x) + 160);
  } else {
    scene = {
      arena: app.selectedArena,
      fighters: app.scene === 'select' ? [] : app.demo,
      projectiles: [],
      particles: [],
      effects: [],
      time: app.time,
      shake: 0,
      flash: 0,
    };
    renderer.setTarget(800, 520);
  }
  renderer.render(scene, dt);
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  app.time += dt;
  controls.update(dt);

  if (app.scene === 'fight' && game) {
    if (!app.paused) {
      accumulator += dt;
      let steps = 0;
      while (accumulator >= 1 / 120 && steps < 10) {
        game.update(1 / 120);
        accumulator -= 1 / 120;
        steps++;
      }
      if (steps >= 10) accumulator = 0;
    }
    updateHud();
  } else {
    accumulator = 0;
    updateDemo(dt);
  }

  render(dt);
  renderPreviews(dt);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  renderer.resize();
  refreshTouchMode();
  if (app.scene === 'fight' && game) {
    setIsHidden($('touch-controls'), !isTouchLayout() || app.matchShown);
  }
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    renderer.resize();
    refreshTouchMode();
  }, 220);
});

// boot
window.__blade = { app, controls, get game() { return game; }, renderer };
refreshTouchMode();
makeDemo();
applySelectionUI();
showTitle();
requestAnimationFrame(loop);
