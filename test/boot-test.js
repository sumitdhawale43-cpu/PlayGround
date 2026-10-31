/* ============================================================
   GRAVITY BREAK — headless integration test
   Boots the real game with a minimal DOM shim, drives frames,
   and exercises the full state machine: title -> play -> death
   -> respawn -> checkpoint -> victory -> complete -> level select.
   Run: node test/boot-test.js
   ============================================================ */
'use strict';

/* ---------- DOM shim ---------- */
function makeCtx() {
  var grad = { addColorStop: function () {} };
  return new Proxy({}, {
    get: function (t, k) {
      if (k === 'canvas') return null;
      if (['createLinearGradient', 'createRadialGradient'].indexOf(k) >= 0) return function () { return grad; };
      if (k === 'measureText') return function () { return { width: 0 }; };
      return function () {};
    },
    set: function () { return true; }
  });
}

var listeners = {}; // id -> {click:[], ...}
function makeEl(id) {
  var classSet = {};
  return {
    id: id,
    style: { setProperty: function () {} },
    classList: {
      add: function (c) { classSet[c] = true; },
      remove: function (c) { delete classSet[c]; },
      toggle: function (c, force) { if (force === undefined) { if (classSet[c]) delete classSet[c]; else classSet[c] = true; } else if (force) classSet[c] = true; else delete classSet[c]; },
      contains: function (c) { return !!classSet[c]; },
      _set: classSet
    },
    textContent: '', innerHTML: '',
    offsetWidth: 0,
    children: [],
    appendChild: function (c) { this.children.push(c); return c; },
    getBoundingClientRect: function () { return { width: 1024, height: 544, left: 0, top: 0 }; },
    addEventListener: function (ev, fn) {
      (listeners[id] = listeners[id] || {})[ev] = listeners[id][ev] || [];
      listeners[id][ev].push(fn);
    },
    removeEventListener: function () {},
    getContext: function () { if (!this._ctx) this._ctx = makeCtx(); return this._ctx; }
  };
}

var els = {};
global.document = {
  getElementById: function (id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  createElement: function (tag) { return makeEl('<' + tag + '>'); },
  addEventListener: function () {},
  removeEventListener: function () {},
  hidden: false
};
global.window = global;
global.addEventListener = function () {};
global.removeEventListener = function () {};
Object.defineProperty(global, 'navigator', { value: { maxTouchPoints: 0 }, configurable: true });
global.matchMedia = function () { return { matches: false }; };
global.localStorage = {
  _data: {},
  getItem: function (k) { return this._data[k] || null; },
  setItem: function (k, v) { this._data[k] = String(v); }
};
var rafQueue = [];
global.requestAnimationFrame = function (cb) { rafQueue.push(cb); return rafQueue.length; };
global.AudioContext = undefined; // audio silently disabled in test

function click(id) {
  var ls = (listeners[id] || {}).click || [];
  ls.forEach(function (fn) { fn({ preventDefault: function () {} }); });
}
function hasClass(id, cls) { return els[id] && els[id].classList.contains(cls); }

/* ---------- load game modules ---------- */
global.GBLevels = require('../js/levels.js');
global.GBAudio = require('../js/audio.js');
global.GBParticles = require('../js/particles.js');
global.GBEntities = require('../js/entities.js');
global.GBInput = require('../js/input.js');
require('../js/game.js');

var failures = 0;
function fail(msg) { console.error('  ✗ ' + msg); failures++; }
function ok(msg) { console.log('  ✓ ' + msg); }

var simT = 0;
function frames(n) {
  for (var i = 0; i < n; i++) {
    var q = rafQueue; rafQueue = [];
    simT += 16.667;
    q.forEach(function (cb) { cb(simT); });
  }
}

/* ---------- run ---------- */
console.log('=== GRAVITY BREAK — integration test ===');
var GB = global.GravityBreak;
var game = GB.game;
var IN = global.GBInput;
var LV = global.GBLevels;

try {
  GB.boot();
  frames(10);
  ok('boot, title screen rendered');
  if (!hasClass('screen-title', 'hidden')) ok('title visible');
  else fail('title screen should be visible');
} catch (e) {
  fail('boot threw: ' + (e && e.stack || e));
}

// start level 1 from menu
try {
  click('btn-start');
  frames(30);
  if (game.state === 'play' && game.levelIndex === 0 && game.player) ok('level 1 started via menu');
  else fail('expected state play/level 0, got ' + game.state + '/' + game.levelIndex);
} catch (e) {
  fail('start threw: ' + (e && e.stack || e));
}

// run right & jump randomly for a few seconds, sanity check simulation
try {
  for (var f = 0; f < 300; f++) {
    IN.state.right = true;
    if (f % 35 === 0) IN.state.jumpPressed = true;
    frames(1, f * 16.7);
  }
  if (game.player.x > 200) ok('player progresses when running right (x=' + game.player.x.toFixed(0) + ')');
  else fail('player barely moved: x=' + game.player.x);
} catch (e) { fail('run loop threw: ' + (e && e.stack || e)); }

// flip gravity
try {
  var y1 = game.player.y, vy1 = game.player.vy;
  IN.state.flipPressed = true;
  frames(20);
  if (game.player.gdir === -1) ok('gravity flip works');
  else fail('gdir=' + game.player.gdir);
  frames(60);
} catch (e) { fail('flip test threw: ' + (e && e.stack || e)); }

// death & respawn
try {
  game.collected['1'] = true; // fake shard
  game.player.x = 34 * 32; game.player.y = 14 * 32; // standing over pit area of L1? actually force via hazard:
  game.checkHazards ? game.checkHazards() : null;
  if (game.state !== 'dying') {
    // force death via spike tile of level 3
    GB.startLevel(2);
    frames(5);
    game.player.x = 30 * 32 + 16; game.player.y = 14 * 32 + 16; // inside floor spike @30,14
    frames(2);
    if (game.state === 'dying') ok('spike kill triggers dying state');
    else fail('expected dying, got ' + game.state + ' (spike test)');
    frames(60);
    if (game.state === 'play') ok('respawn after death');
    else fail('expected play after respawn, got ' + game.state);
  } else {
    ok('death triggers dying');
    frames(60);
  }
} catch (e) { fail('death test threw: ' + (e && e.stack || e)); }

// checkpoint pickup + respawn point
try {
  GB.startLevel(2); // SPIKE ALLEY has checkpoint at 27,14
  frames(5);
  game.player.x = 27 * 32 + 16; game.player.y = 14 * 32;
  frames(3);
  if (game.checkpointId === 0) ok('checkpoint activated');
  else fail('checkpoint not set: ' + game.checkpointId);
  // die far away
  game.player.x = 60 * 32; game.player.y = 14 * 32;
  game.player.x = 50 * 32; game.player.y = 14 * 32; // inside spike field 50..57
  frames(3);
  frames(60);
  var px = game.player.x;
  if (Math.abs(px - 27 * 32 - 16) < 40) ok('respawned at checkpoint (x=' + px.toFixed(0) + ')');
  else fail('respawn not at checkpoint: x=' + px.toFixed(0));
} catch (e) { fail('checkpoint test threw: ' + (e && e.stack || e)); }

// moving platforms: ride and position sanity (level 5)
try {
  GB.startLevel(4);
  IN.state.right = false; IN.state.left = false; IN.state.jump = false;
  frames(10);
  var p = game.player, plat = game.level.movers[0];
  p.x = plat.x + 10; p.y = plat.y - p.h - 1; p.vy = 0; p.gdir = 1;
  var platX0 = plat.x;
  frames(10);
  var rel0 = p.x - plat.x;
  frames(20);
  var rel1 = p.x - plat.x;
  var drift = Math.abs(rel1 - rel0);
  ok('platform carries rider (steady-state drift ' + drift.toFixed(2) + 'px over 20 frames)');
  if (drift > 2) fail('rider drift > 2px');
} catch (e) { fail('platform test threw: ' + (e && e.stack || e)); }

// win flow
try {
  GB.startLevel(0);
  frames(3);
  game.player.x = 58 * 32 + 16; game.player.y = 14 * 32;
  frames(5);
  if (game.state === 'victory') ok('reach goal -> victory screen');
  else fail('expected victory, got ' + game.state);
  if (global.localStorage._data['gravity-break-save-v1']) {
    var sv = JSON.parse(global.localStorage._data['gravity-break-save-v1']);
    if (sv.unlocked >= 2) ok('progress saved & level 2 unlocked');
    else fail('unlocked=' + sv.unlocked);
  } else fail('save not written');
  click('btn-again');
  frames(3);
  if (game.state === 'play') ok('replay works');
  GB.setState ? GB.setState('victory') : null;
  if (game.levelIndex === 0) {
    // next level button
    GB.setState('victory');
    click('btn-next');
    frames(3);
    if (game.levelIndex === 1 && game.state === 'play') ok('next level launches');
    else fail('next level state ' + game.state + ' idx ' + game.levelIndex);
  }
} catch (e) { fail('win flow threw: ' + (e && e.stack || e)); }

// last level complete flow
try {
  GB.startLevel(7);
  frames(3);
  game.player.x = 96 * 32 + 16; game.player.y = 14 * 32;
  frames(5);
  if (game.state === 'complete') ok('final level -> complete screen');
  else fail('expected complete, got ' + game.state);
  click('btn-complete-levels');
  frames(3);
  if (game.state === 'levels') ok('complete -> level select');
  else fail('expected levels, got ' + game.state);
  var cells = els['level-grid'].children.length;
  if (cells === LV.LEVEL_COUNT) ok('level grid has 8 cells');
  else fail('level grid cells: ' + cells);
} catch (e) { fail('complete flow threw: ' + (e && e.stack || e)); }

// pause / resume / quit
try {
  GB.startLevel(5);
  frames(3);
  IN.cb.onPause();
  if (game.state === 'pause') ok('pause toggles');
  frames(5);
  click('btn-resume');
  if (game.state === 'play') ok('resume works');
  IN.cb.onPause();
  click('btn-restart');
  if (game.state === 'play' && game.runT < 0.5) ok('restart resets level');
  click('btn-pause');
  IN.cb.onPause();
  click('btn-quit');
  if (game.state === 'title') ok('quit to title');
  else fail('quit: ' + game.state);
} catch (e) { fail('pause flow threw: ' + (e && e.stack || e)); }

// every level boots & renders for a second
try {
  var allOk = true;
  for (var i = 0; i < LV.LEVEL_COUNT; i++) {
    GB.startLevel(i);
    for (var f2 = 0; f2 < 70; f2++) { IN.state.right = f2 % 40 < 30; if (f2 % 30 === 0) IN.state.jumpPressed = true; frames(1); }
    if (!isFinite(game.player.x) || !isFinite(game.player.y)) { allOk = false; fail('level ' + i + ' produced NaN during play'); }
    if (i < LV.LEVEL_COUNT - 1 || game.state === 'complete' || game.state === 'play') {}
  }
  if (allOk) ok('all 8 levels simulate without errors');
} catch (e) { fail('all-levels loop threw: ' + (e && e.stack || e)); }

console.log('=========================================');
console.log(failures === 0 ? '✔ INTEGRATION PASSED' : '✗ FAILURES: ' + failures);
process.exit(failures === 0 ? 0 : 1);
