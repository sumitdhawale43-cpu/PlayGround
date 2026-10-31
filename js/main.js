/* ============================================================
   DRIFT LEGENDS — boot, state machine and fixed-step loop.
   ============================================================ */

import {
  loadSave, persistSave, defaultSave, SAVE_KEY,
  CARS, TRACKS, AI_ROSTER, EMPTY_UPGRADES, UPGRADES,
} from './config.js';
import { buildTrack, renderTrackLayer } from './tracks.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Race } from './race.js';
import { effects } from './effects.js';
import { audio } from './audio.js';
import { UI } from './ui.js';
import { clamp, isTouchLike, ordinal } from './utils.js';

const STEP = 1 / 120;
const canvas = document.getElementById('game');
const save = loadSave();
const renderer = new Renderer(canvas);
const input = new Input();

let state = 'boot';
let race = null;
let currentTrack = null;
let acc = 0;
let last = 0;
let finishHandled = false;
let frameCount = 0;
let perfAcc = 0;
let perfTier = 0;
let touchMode = false;

const hud = {
  root: document.getElementById('hud'),
  countdown: document.getElementById('countdown'),
  banner: document.getElementById('banner'),
  wrongway: document.getElementById('wrongway'),
  driftbox: document.getElementById('driftbox'),
  driftNum: document.getElementById('drift-num'),
  touch: document.getElementById('touch'),
  pause: document.getElementById('btn-pause'),
};
let lastCombo = 1;
let lastCountdown = '';

/* ------------------------------------------------------------ helpers */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(Math.round(((n >> 16) & 255) * f), 0, 255);
  const g = clamp(Math.round(((n >> 8) & 255) * f), 0, 255);
  const b = clamp(Math.round((n & 255) * f), 0, 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function ensureTrack(id) {
  const def = TRACKS.find((t) => t.id === id) || TRACKS[0];
  if (currentTrack && currentTrack.def.id === def.id) return currentTrack;
  const t = buildTrack(def);
  renderTrackLayer(t);
  currentTrack = t;
  renderer.setTrack(t);
  return t;
}

function makeEntries(demo) {
  const playerCar = CARS.find((c) => c.id === save.car) || CARS[0];
  const models = CARS.filter((c) => c.id !== playerCar.id);
  const roster = AI_ROSTER.slice(0, 5).sort((a, b) => b.skill - a.skill);
  const entries = roster.map((d, i) => {
    const model = models[i % models.length];
    return {
      carDef: model,
      colors: { body: d.skin, body2: shade(d.skin, 0.45), accent: shade(d.skin, 1.6), glass: model.glass },
      mapColor: d.skin,
      name: d.name,
      skill: d.skill,
      isPlayer: false,
    };
  });
  entries.push({
    carDef: playerCar,
    colors: { body: playerCar.body, body2: playerCar.body2, accent: playerCar.accent, glass: playerCar.glass },
    mapColor: '#ffffff',
    name: demo ? 'FAN' : 'YOU',
    isPlayer: !demo,
    upgrades: save.upgrades[playerCar.id] || { ...EMPTY_UPGRADES },
  });
  return entries;
}

/* ------------------------------------------------------------ state */
function setState(next) {
  state = next;
  const racing = next === 'race';
  hud.root.classList.toggle('hidden', !(next === 'race' || next === 'paused'));
  hud.touch.classList.toggle('hidden', !(racing && touchMode));
  if (next === 'menu') {
    ui.show('scr-menu');
  } else if (next !== 'paused') {
    ui.show('');
  }
}

function startDemo() {
  const track = ensureTrack(save.track);
  effects.reset();
  race = new Race({
    track,
    entries: makeEntries(true),
    laps: 3,
    mode: 'demo',
    playerIndex: Math.min(1, 4),
  });
  renderer.cam.init = false;
  finishHandled = false;
}

function startRace(trackId, laps) {
  audio.resume();
  const track = ensureTrack(trackId || save.track);
  const entries = makeEntries(false);
  effects.reset();
  input.resetSteer();
  race = new Race({
    track,
    entries,
    laps: laps || save.laps || 3,
    mode: 'race',
    playerIndex: entries.length - 1,
  });
  renderer.cam.init = false;
  finishHandled = false;
  lastCombo = 1;
  lastCountdown = '';
  setState('race');
}

function togglePause(force) {
  if (state === 'race') {
    const h = race.hudFor(race.player);
    ui.openPause(
      `<span>${race.track.def.name}</span><span>LAP ${h.lap}/${race.laps}</span><span>POS ${ordinal(h.place)}</span>`
    );
    setState('paused');
    input.releaseAll();
    audio.back();
  } else if (state === 'paused' && force !== false) {
    ui.show('');
    setState('race');
    audio.click();
  }
}

function finishRace() {
  if (finishHandled) return;
  finishHandled = true;
  const res = race.buildResult();
  const def = TRACKS.find((t) => t.id === res.trackId);
  const prevBest = save.best[res.trackId];
  const isRecord = !!res.best && (!prevBest || res.best < prevBest);
  if (isRecord) save.best[res.trackId] = res.best;

  const posBonus = [650, 450, 320, 240, 190, 150][res.pos - 1] || 130;
  const lapBonus = res.lapsCount * 70;
  const driftBonus = Math.round(res.drift / 12);
  const diffMult = 1 + (def.difficulty - 1) * 0.15;
  const earned = Math.round((posBonus + lapBonus + driftBonus) * diffMult);

  save.coins += earned;
  save.races = (save.races || 0) + 1;
  if (res.pos === 1) save.wins = (save.wins || 0) + 1;
  persistSave(save);

  hud.root.classList.add('hidden');
  hud.touch.classList.add('hidden');
  setState('results');
  ui.fillResults(res, earned, isRecord);
}

function quitToMenu() {
  persistSave(save);
  startDemo();
  setState('menu');
}

/* ------------------------------------------------------------ UI bus */
const ui = new UI({
  save,
  click: () => audio.click(),
  back: () => audio.back(),
  onStart: () => startRace(save.track, save.laps),
  onStartRace: (trackId, laps) => {
    save.track = trackId;
    save.laps = laps;
    persistSave(save);
    startRace(trackId, laps);
  },
  onEquip: (id, cb) => {
    const car = CARS.find((c) => c.id === id);
    if (!car) return;
    if (!save.owned.includes(id)) {
      if (save.coins < car.price) { audio.back(); return; }
      save.coins -= car.price;
      save.owned.push(id);
      save.upgrades[id] = save.upgrades[id] || { ...EMPTY_UPGRADES };
      audio.bank(3);
    } else {
      audio.click();
    }
    save.car = id;
    persistSave(save);
    cb && cb();
  },
  onUpgrade: (carId, key, cb) => {
    const def = UPGRADES[key];
    save.upgrades[carId] = save.upgrades[carId] || { ...EMPTY_UPGRADES };
    const lvl = save.upgrades[carId][key] || 0;
    if (lvl >= def.max) { audio.back(); return; }
    const cost = def.cost(lvl);
    if (save.coins < cost) { audio.back(); return; }
    save.coins -= cost;
    save.upgrades[carId][key] = lvl + 1;
    persistSave(save);
    audio.bank(2);
    cb && cb();
  },
  onResume: () => togglePause(true),
  onRestart: () => startRace(race ? race.track.def.id : save.track, race ? race.laps : save.laps),
  onQuit: () => { audio.click(); quitToMenu(); },
  onSoundToggle: () => {
    save.sound = !save.sound;
    audio.setMuted(!save.sound);
    persistSave(save);
    if (save.sound) audio.click();
  },
  onResetSave: (cb) => {
    const fresh = defaultSave();
    Object.keys(fresh).forEach((k) => { save[k] = fresh[k]; });
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    persistSave(save);
    audio.click();
    cb && cb();
  },
});

/* ------------------------------------------------------------ input */
input.onKey = (code) => {
  audio.resume();
  if (code === 'Escape' || code === 'KeyP') {
    if (state === 'race' || state === 'paused') togglePause();
  } else if (code === 'KeyR') {
    if (state === 'race' && race && race.mode !== 'demo') race.recoverCar(race.player);
  } else if (code === 'Enter') {
    if (state === 'menu') startRace(save.track, save.laps);
    else if (state === 'paused') togglePause(true);
  } else if (code === 'KeyM') {
    save.sound = !save.sound;
    audio.setMuted(!save.sound);
    ui.updateSoundLabels();
    persistSave(save);
  }
};
input.attach(window, hud.touch);
hud.pause.addEventListener('click', () => { audio.resume(); togglePause(); });

window.addEventListener('pointerdown', () => audio.resume(), { passive: true });
window.addEventListener('keydown', () => audio.resume(), { passive: true });
window.addEventListener('resize', () => { renderer.resize(); touchMode = isTouchLike(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'race') togglePause();
});

/* ------------------------------------------------------------ DOM hud */
function updateDOMHUD() {
  if (state !== 'race' || !race) return;

  if (race.phase === 'countdown') {
    const n = Math.max(1, Math.ceil(race.countdown));
    const s = String(n);
    if (s !== lastCountdown) { lastCountdown = s; hud.countdown.textContent = s; }
    hud.countdown.classList.remove('hidden', 'go');
  } else if (race.goTimer > 0) {
    if (lastCountdown !== 'GO') { lastCountdown = 'GO'; hud.countdown.textContent = 'GO!'; }
    hud.countdown.classList.add('go');
    hud.countdown.classList.remove('hidden');
  } else {
    hud.countdown.classList.add('hidden');
  }

  if (race.banner) {
    hud.banner.textContent = race.banner;
    hud.banner.classList.remove('hidden');
  } else {
    hud.banner.classList.add('hidden');
  }

  hud.wrongway.classList.toggle('hidden', !race.wrongWay);

  const h = race.hudFor(race.player);
  if (h.drifting && h.chain > 50) {
    hud.driftbox.classList.remove('hidden');
    if (h.combo !== lastCombo) {
      lastCombo = h.combo;
      hud.driftbox.classList.remove('pop');
      void hud.driftbox.offsetWidth;
      hud.driftbox.classList.add('pop');
    }
    hud.driftNum.textContent = `${h.chain}${h.combo > 1 ? '  x' + h.combo : ''}`;
  } else {
    hud.driftbox.classList.add('hidden');
    if (!h.drifting) lastCombo = 1;
  }
}

/* ------------------------------------------------------------ loop */
function fixedUpdate(dt) {
  if (!race) return;
  if (state === 'race') {
    race.update(dt, input.control(dt));
    effects.update(dt);
    if (race.mode !== 'demo' && race.phase === 'finished') finishRace();
  } else if (state === 'menu' || state === 'boot') {
    race.update(dt, null);
    effects.update(dt);
  }
}

function render(dt) {
  if (!race) return;
  const target = state === 'menu' || state === 'boot'
    ? race.cars[Math.min(1, race.cars.length - 1)]
    : race.player;
  renderer.frameCamera(target, dt, race);
  renderer.drawWorld(race, dt);
  renderer.drawHUD(race, { touch: touchMode, best: save.best[race.track.def.id] });
}

/* Menus and the attract demo don't need 60fps — capping them keeps the main
   thread free (snappier input, far cheaper compositing on weak/software GPUs).
   Throttled by frame count, not elapsed time: on a slow rasteriser wall-clock
   elapsed is always large, so a time check would never skip a paint.
   A live race still paints every frame. */
let lastPaint = 0;
let paintDt = 1 / 60;
let menuTick = 0;
const MENU_SKIP = 3;      // paint 1 frame in 4 while a menu is up

function frame(now) {
  requestAnimationFrame(frame);
  if (!last) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;
  if (dt <= 0) dt = 1 / 60;

  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 10) { fixedUpdate(STEP); acc -= STEP; steps++; }
  if (steps === 10) acc = 0;

  const paint = state === 'race' || (menuTick = (menuTick + 1) % (MENU_SKIP + 1)) === 0;
  if (paint) {
    paintDt = lastPaint ? Math.min(0.1, (now - lastPaint) / 1000) : dt;
    lastPaint = now;
    render(paintDt);
    updateDOMHUD();
  }

  // audio mix follows the rendered frame
  if (race && (state === 'race' || state === 'menu')) {
    const c = race.player;
    const slip = Math.abs(c.slip);
    audio.mix({
      active: save.sound,
      speed: c.speed,
      throttle: Math.max(0, c.throttleVis),
      skid: clamp((slip - 0.08) * 2.4, 0, 1) * clamp(c.speed / 240, 0, 1),
      boost: c.boosting,
    });
  } else {
    audio.mix({ active: false, speed: 0, throttle: 0, skid: 0, boost: false });
  }

  // adaptive quality: dial effects back if the machine is struggling
  frameCount++;
  perfAcc += dt;
  if (frameCount === 150) {
    const avg = perfAcc / frameCount;
    if (avg > 0.026 && perfTier === 0) {
      perfTier = 1;
      effects.quality = 0.55;
      renderer.dprCap = 1;
      renderer.resize();
    } else if (avg > 0.034 && perfTier === 1) {
      perfTier = 2;
      effects.quality = 0.3;
    }
    frameCount = 0;
    perfAcc = 0;
  }
}

/* ------------------------------------------------------------ boot */
function boot() {
  touchMode = isTouchLike();
  audio.setMuted(!save.sound);

  // Show the menu and dismiss the splash immediately: the Start Game button
  // must be clickable before we spend time prerendering a circuit.
  setState('menu');
  ui.show('scr-menu');
  const loading = document.getElementById('loading');
  loading.classList.add('done');
  setTimeout(() => { loading.style.display = 'none'; }, 700);

  last = 0;
  requestAnimationFrame(frame);

  // Build the default circuit and start the attract demo once the menu is up.
  const heavy = () => { ensureTrack(save.track); startDemo(); };
  if (window.requestIdleCallback) requestIdleCallback(heavy, { timeout: 1200 });
  else setTimeout(heavy, 60);
}

// Give the browser a painted frame first, then boot the engine.
requestAnimationFrame(() => requestAnimationFrame(boot));

// expose a tiny hook for automated smoke tests
window.__driftLegends = {
  get state() { return state; },
  get race() { return race; },
  get renderer() { return renderer; },
  start: (trackId, laps) => startRace(trackId, laps),
  pause: () => togglePause(),
};
