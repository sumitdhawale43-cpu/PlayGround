/* ============================================================
   GRAVITY BREAK — game engine
   State machine, camera, renderer, hazards, progression, UI.
   Depends on: GBLevels, GBAudio, GBParticles, GBEntities, GBInput
   ============================================================ */
(function (root) {
  'use strict';

  var LV = root.GBLevels, Audio2 = root.GBAudio, Particles = root.GBParticles,
      ENT = root.GBEntities, IN = root.GBInput;
  var T = LV.TILE;
  var CANVAS_W = 1024, CANVAS_H = 544;

  var STATE = { TITLE: 'title', LEVELS: 'levels', HOWTO: 'howto', PLAY: 'play', DYING: 'dying', PAUSE: 'pause', VICTORY: 'victory', COMPLETE: 'complete' };

  var SAVE_KEY = 'gravity-break-save-v1';

  function loadSave() {
    try {
      var s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s.unlocked === 'number') return s;
    } catch (e) {}
    return { unlocked: 1, sound: true, totalDeaths: 0, best: {}, shards: {}, completed: {} };  }
  function writeSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  var save = loadSave();

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function aabb(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
  function fmtTime(s) {
    var m = Math.floor(s / 60), r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
  }

  /* seeded rng for starfields */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================ */
  var game = {
    state: STATE.TITLE,
    levelIndex: 0,
    level: null,
    player: null,
    particles: new Particles(),
    t: 0,                 // level clock (drives lasers)
    runT: 0,              // run timer
    deaths: 0,
    collected: {},
    spawn: null,
    spawnDir: 1,
    dyingT: 0,
    camX: 0, shake: 0, shakeT: 0,
    won: false,
    flashA: 0,
    bannerT: 0
  };

  var canvas, ctx, tileLayer = null, bgLayer = null;

  /* ================= world accessors ================= */
  function tileAt(tx, ty) {
    var L = game.level;
    if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) return 1; // out of bounds = solid
    return L.grid[ty * L.w + tx];
  }
  function isSolidTile(tx, ty) { return tileAt(tx, ty) === 1; }
  function isSolidPx(px, py) { return isSolidTile(Math.floor(px / T), Math.floor(py / T)); }

  /* ================= level lifecycle ================= */
  function startLevel(i) {
    game.levelIndex = i;
    game.level = LV.compile(LV.LEVELS[i], i);
    var L = game.level;
    // instantiate live platform objects from compiled defs
    L.movers = L.movers.map(function (m) { return new ENT.Platform(m); });
    var sx = L.start.tx * T + T / 2, sy = (L.start.ty + 1) * T;
    game.spawn = { x: sx, y: sy };
    game.player = new ENT.Player(sx, sy);
    game.player.setWorld({
      isSolidPx: isSolidPx,
      plats: L.movers,
      onJump: onJumpFX, onFlip: onFlipFX, onLand: onLandFX
    });
    game.t = 0; game.runT = 0; game.deaths = 0;
    game.collected = {};
    game.checkpointId = -1;
    resetInput();
    game.camX = clamp(sx - CANVAS_W / 2, 0, L.w * T - CANVAS_W);
    game.particles.clear();
    game.shake = 0; game.flashA = 0; game.won = false; game.bannerT = 2.2;
    buildTileLayer(L);
    buildBgLayer(L);
    setState(STATE.PLAY);
    showBanner((i + 1) + ' — ' + L.name);
    updateHUD(true);
    Audio2.resume();
  }

  function resetInput() {
    IN.state.left = false; IN.state.right = false;
    IN.state.jump = false; IN.state.jumpPressed = false; IN.state.flipPressed = false;
  }

  function currentSpawnPoint() {
    var L = game.level;
    if (game.checkpointId >= 0) {
      var c = L.checkpoints[game.checkpointId];
      return { x: c.x, y: (c.ty + 1) * T };
    }
    return game.spawn;
  }

  function respawn() {
    var sp = currentSpawnPoint();
    resetInput();
    game.player.reset(sp.x, sp.y, 1);
    game.particles.burst(sp.x, sp.y - 14, 18, game.level.accent, 220, { life: 0.5, size: 3 });
    game.camX = clamp(sp.x - CANVAS_W / 2, 0, game.level.w * T - CANVAS_W);
    setState(STATE.PLAY);
  }

  /* ================= FX callbacks ================= */
  function onJumpFX(x, y, gdir) {
    Audio2.jump();
    var py = y + (gdir > 0 ? 0 : 12);
    game.particles.burst(x, py, 8, '#9be8ff', 130, { life: 0.3, size: 2.6, g: 0 });
  }
  function onFlipFX(x, y, gdir) {
    Audio2.flip();
    game.flashA = 0.5;
    game.player.spinT = 0;
    game.particles.burst(x, y, 20, '#ffffff', 260, { life: 0.4, size: 3 });
    shake(4);
  }
  function onLandFX(x, footY, gdir, vy) {
    Audio2.land();
    var impact = clamp((Math.abs(vy) - 260) / 700, 0, 1);
    if (impact > 0.03) {
      var n = 4 + Math.floor(impact * 8);
      game.particles.burst(x, footY, n, '#7fd4ff', 90 + impact * 160, { life: 0.35, size: 2.4 });
      shake(impact * 5);
    }
  }
  function shake(v) { game.shake = Math.min(14, Math.max(game.shake, v)); game.shakeT = 0.35; }

  /* ================= state machine ================= */
  function setState(s) {
    game.state = s;
    var playing = (s === STATE.PLAY || s === STATE.DYING);
    $('hud').classList.toggle('hidden', !(playing || s === STATE.PAUSE));
    $('btn-pause').classList.toggle('hidden', !playing);
    $('touch').classList.toggle('hidden', !(playing && IN.isTouchDevice()));
    var screens = ['screen-title', 'screen-howto', 'screen-levels', 'screen-pause', 'screen-victory', 'screen-complete'];
    screens.forEach(function (id) { $(id).classList.add('hidden'); });
    switch (s) {
      case STATE.TITLE: $('screen-title').classList.remove('hidden'); break;
      case STATE.HOWTO: $('screen-howto').classList.remove('hidden'); break;
      case STATE.LEVELS: $('screen-levels').classList.remove('hidden'); buildLevelGrid(); break;
      case STATE.PAUSE: $('screen-pause').classList.remove('hidden'); break;
      case STATE.VICTORY: $('screen-victory').classList.remove('hidden'); break;
      case STATE.COMPLETE: $('screen-complete').classList.remove('hidden'); break;
    }
  }

  function showBanner(text) {
    var b = $('level-banner');
    b.textContent = text;
    b.classList.remove('hidden');
    b.classList.remove('anim');
    void b.offsetWidth; // restart animation
    b.classList.add('anim');
  }

  /* ================= pause / restart ================= */
  function togglePause() {
    if (game.state === STATE.PLAY || game.state === STATE.DYING) {
      setState(STATE.PAUSE);
      resetInput();
    } else if (game.state === STATE.PAUSE) {
      resetInput();
      setState(STATE.PLAY);
    }
  }

  /* ================= simulation ================= */
  function step(dt) {
    var L = game.level, pl = game.player;
    if (!L || !pl) return;

    if (game.bannerT > 0) game.bannerT -= dt;

    // hazards time
    game.t += dt;

    // platforms always move
    for (var i = 0; i < L.movers.length; i++) L.movers[i].update(dt);

    if (game.state === STATE.PLAY) {
      game.runT += dt;
      // fell out of the level bottom -> death
      if (pl.y > L.h * T + 10) { die(); }
      // ride platform before physics
      if (pl.rider) {
        pl.x += pl.rider.dx;
        pl.y += pl.rider.dy;
      }
      pl.update(dt, IN.state);
      pl.resolvePlatforms(L.movers);
      checkHazards();
      if (game.state === STATE.PLAY) checkPickups();
    } else if (game.state === STATE.DYING) {
      game.dyingT -= dt;
      if (game.dyingT <= 0) respawn();
    }

    game.particles.update(dt);

    // camera
    var target = clamp(pl.centerX() - CANVAS_W / 2 + pl.vx * 0.1, 0, L.w * T - CANVAS_W);
    game.camX += (target - game.camX) * Math.min(1, dt * 8);

    // shake decay
    if (game.shakeT > 0) { game.shakeT -= dt; if (game.shakeT <= 0) game.shake = 0; }
    if (game.flashA > 0) game.flashA -= dt * 1.8;

    if (pl.spinT !== undefined && pl.spinT < 1) pl.spinT = Math.min(1, pl.spinT + dt * 4.5);
  }

  /* ---------- hazards ---------- */
  function laserRect(ls) {
    if (ls.axis === 'v') return aabb(ls.tx * T + T / 2 - 6, ls.ty * T, 12, ls.len * T);
    return aabb(ls.tx * T, ls.ty * T + T / 2 - 6, ls.len * T, 12);
  }
  function laserActive(ls) {
    var period = 2.8, on = 1.3;
    var ph = (game.t + ls.phase * 1.4) % period;
    return ph < on;
  }
  function checkHazards() {
    var L = game.level, hr = game.player.hurtRect();
    // spikes
    for (var i = 0; i < L.spikes.length; i++) {
      var s = L.spikes[i];
      var r = s.dir === 'up' ? aabb(s.tx * T + 5, s.ty * T + 16, T - 10, 16) : aabb(s.tx * T + 5, s.ty * T, T - 10, 16);
      if (rectsOverlap(hr, r)) { die(); return; }
    }
    // lasers
    for (var j = 0; j < L.lasers.length; j++) {
      var ls = L.lasers[j];
      if (laserActive(ls) && rectsOverlap(hr, laserRect(ls))) { die(); return; }
    }
  }

  function die() {
    if (game.state !== STATE.PLAY) return;
    game.deaths++;
    save.totalDeaths++;
    writeSave();
    Audio2.death();
    var pl = game.player;
    var hue = ['#ff2d78', '#ffb3cf', '#ffffff'];
    for (var k = 0; k < 26; k++) {
      game.particles.spawn(
        pl.centerX() + (Math.random() * 20 - 10), pl.centerY() + (Math.random() * 26 - 13),
        (Math.random() - 0.5) * 420, (Math.random() - 0.5) * 420,
        0.6 + Math.random() * 0.5,
        hue[k % 3], 3 + Math.random() * 3, { g: 300, drag: 1.2, square: true }
      );
    }
    game.dyingT = 0.8;
    shake(9);
    setState(STATE.DYING);
  }

  /* ---------- pickups ---------- */
  function checkPickups() {
    var L = game.level, pl = game.player;
    var body = aabb(pl.x, pl.y, pl.w, pl.h);
    // shards
    for (var i = 0; i < L.shards.length; i++) {
      var sh = L.shards[i];
      if (!sh.taken && !game.collected[sh.id] &&
          rectsOverlap(body, aabb(sh.x - 11, sh.y - 11, 22, 22))) {
        game.collected[sh.id] = true;
        Audio2.collect();
        game.particles.burst(sh.x, sh.y, 12, '#8ffcff', 180, { life: 0.45, size: 2.8, g: -60 });
      }
    }
    // checkpoints
    for (var c = 0; c < L.checkpoints.length; c++) {
      var cp = L.checkpoints[c];
      if (game.checkpointId === c) continue;
      if (rectsOverlap(body, aabb(cp.x - 14, cp.y - 6, 28, T + 6))) {
        game.checkpointId = c;
        Audio2.checkpoint();
        game.particles.burst(cp.x, cp.y + 10, 16, '#69ff9e', 170, { life: 0.5, size: 3 });
      }
    }
    // goal
    if (rectsOverlap(body, aabb(L.goal.tx * T + 2, L.goal.ty * T - 34, T - 4, T * 2 + 34))) {
      winLevel();
    }
  }

  function winLevel() {
    var i = game.levelIndex, L = game.level;
    game.won = true;
    Audio2.win();
    var gx = L.goal.tx * T + T / 2, gy = L.goal.ty * T + T;
    game.particles.burst(gx, gy - 30, 46, L.accent, 340, { life: 0.9, size: 3.4, drag: 1.6 });
    var n = 0;
    for (var k in game.collected) if (game.collected[k]) n++;
    var prevBest = save.best[i];
    if (prevBest === undefined || game.runT < prevBest) save.best[i] = game.runT;
    save.shards[i] = Math.max(save.shards[i] || 0, n);
    var firstClear = !save.completed[i];
    save.completed[i] = true;
    save.unlocked = Math.max(save.unlocked, Math.min(i + 2, LV.LEVEL_COUNT));
    writeSave();

    if (i === LV.LEVEL_COUNT - 1) {
      Audio2.complete();
      setState(STATE.COMPLETE);
      $('stat-total-shards').textContent = totalShards() + '/' + totalShardCount();
      $('stat-total-deaths').textContent = save.totalDeaths;
    } else {
      setState(STATE.VICTORY);
      $('stat-time').textContent = fmtTime(game.runT);
      $('stat-best').textContent = (game.runT === save.best[i] ? '★ ' : '') + fmtTime(save.best[i]);
      $('stat-shards').textContent = n + '/' + L.shards.length;
      $('stat-deaths').textContent = game.deaths;
      $('victory-title').textContent = 'LEVEL ' + (i + 1) + ' COMPLETE';
      var first = $('btn-next');
      first.textContent = 'NEXT LEVEL →  ' + LV.LEVELS[i + 1].name;
    }
    if (firstClear) {} // hook for extra effects if needed
  }

  function totalShardCount() {
    var n = 0;
    LV.LEVELS.forEach(function (L, i) { n += LV.compile(L, i).shards.length; });
    return n;
  }
  function totalShards() {
    var n = 0;
    LV.LEVELS.forEach(function (L, i) { n += save.shards[i] || 0; });
    return n;
  }

  /* ================= rendering ================= */
  function buildTileLayer(L) {
    tileLayer = document.createElement('canvas');
    tileLayer.width = L.w * T; tileLayer.height = L.h * T;
    var c = tileLayer.getContext('2d');
    var ac = L.accent;
    c.save();
    c.shadowColor = ac;
    c.shadowBlur = 0;
    for (var ty = 0; ty < L.h; ty++) {
      for (var tx = 0; tx < L.w; tx++) {
        var v = L.grid[ty * L.w + tx];
        var x = tx * T, y = ty * T;
        if (v === 1) {
          var g = c.createLinearGradient(x, y, x, y + T);
          g.addColorStop(0, 'rgba(18,26,64,1)');
          g.addColorStop(1, 'rgba(10,13,34,1)');
          c.fillStyle = g;
          c.fillRect(x, y, T, T);
          // neon edges where exposed
          c.lineWidth = 2;
          c.strokeStyle = ac;
          c.shadowColor = ac; c.shadowBlur = 7;
          c.beginPath();
          if (!isSolidTileLocal(L, tx, ty - 1)) { c.moveTo(x, y + 1.5); c.lineTo(x + T, y + 1.5); }
          if (!isSolidTileLocal(L, tx, ty + 1)) { c.moveTo(x, y + T - 1.5); c.lineTo(x + T, y + T - 1.5); }
          if (!isSolidTileLocal(L, tx - 1, ty)) { c.moveTo(x + 1.5, y); c.lineTo(x + 1.5, y + T); }
          if (!isSolidTileLocal(L, tx + 1, ty)) { c.moveTo(x + T - 1.5, y); c.lineTo(x + T - 1.5, y + T); }
          c.stroke();
          c.shadowBlur = 0;
          // inner detail
          c.strokeStyle = 'rgba(255,255,255,0.05)';
          c.strokeRect(x + 7.5, y + 7.5, T - 15, T - 15);
        } else if (v === 2 || v === 3) {
          drawSpike(c, x, y, v === 2 ? 'up' : 'down', '#ff2d78');
        }
      }
    }
    c.restore();
  }
  function isSolidTileLocal(L, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) return true;
    return L.grid[ty * L.w + tx] === 1;
  }

  function drawSpike(c, x, y, dir, color) {
    c.save();
    c.fillStyle = 'rgba(40,10,24,1)';
    c.fillRect(x + 2, dir === 'up' ? y + 16 : y, T - 4, 16);
    c.fillStyle = color;
    c.shadowColor = color; c.shadowBlur = 8;
    var base = dir === 'up' ? y + T : y;
    var tip = dir === 'up' ? y + 4 : y + T - 4;
    c.beginPath();
    for (var i = 0; i < 3; i++) {
      var x0 = x + 2 + i * 10;
      c.moveTo(x0, base);
      c.lineTo(x0 + 5, tip);
      c.lineTo(x0 + 10, base);
    }
    c.fill();
    c.restore();
  }

  function buildBgLayer(L) {
    bgLayer = document.createElement('canvas');
    bgLayer.width = CANVAS_W; bgLayer.height = CANVAS_H;
    var c = bgLayer.getContext('2d');
    var g = c.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, '#060915');
    g.addColorStop(0.6, '#0a0e26');
    g.addColorStop(1, '#04050f');
    c.fillStyle = g;
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // faint horizon glow
    var hg = c.createRadialGradient(CANVAS_W / 2, CANVAS_H + 60, 60, CANVAS_W / 2, CANVAS_H + 60, 620);
    hg.addColorStop(0, hexA(L.accent, 0.10));
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = hg;
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // stars
    var rnd = mulberry(97 + game.levelIndex * 131);
    c.save();
    for (var i = 0; i < 110; i++) {
      var x = rnd() * CANVAS_W, y = rnd() * CANVAS_H;
      var s = rnd();
      c.globalAlpha = 0.15 + s * 0.5;
      c.fillStyle = s > 0.85 ? L.accent : '#9fb4ff';
      var sz = 1 + s * 1.6;
      c.fillRect(x, y, sz, sz);
    }
    c.restore();
  }

  function hexA(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function render() {
    if (canvas.width === 0) return;
    ctx.setTransform(canvas.width / CANVAS_W, 0, 0, canvas.height / CANVAS_H, 0, 0);
    if (!game.level) { ctx.fillStyle = '#04050f'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); return; }
    var L = game.level, pl = game.player;
    var shakeX = 0, shakeY = 0;
    if (game.shake > 0) {
      shakeX = (Math.random() - 0.5) * game.shake;
      shakeY = (Math.random() - 0.5) * game.shake;
    }
    var camX = Math.round(game.camX);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // background (parallax stars)
    ctx.drawImage(bgLayer, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate((camX * 0.4) % CANVAS_W, 0);
    for (var rep = -1; rep <= 1; rep++) ctx.drawImage(bgLayer, rep * CANVAS_W, 0);
    ctx.restore();

    // moving grid
    ctx.save();
    ctx.strokeStyle = hexA(L.accent, 0.05);
    ctx.lineWidth = 1;
    var gx = -(camX * 0.25) % 64;
    for (var x = gx; x < CANVAS_W; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (var y = 0; y < CANVAS_H; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }
    ctx.restore();

    // world
    ctx.save();
    ctx.translate(-camX, 0);

    // tiles
    ctx.drawImage(tileLayer, 0, 0);

    // goal portal
    drawGoal(L);

    // lasers
    for (var li = 0; li < L.lasers.length; li++) drawLaser(L.lasers[li]);

    // checkpoints
    for (var ci = 0; ci < L.checkpoints.length; ci++) drawCheckpoint(L.checkpoints[ci], ci);

    // movers
    for (var mi = 0; mi < L.movers.length; mi++) drawPlatform(L.movers[mi], L.accent);

    // shards
    for (var si = 0; si < L.shards.length; si++) drawShard(L.shards[si]);

    // particles behind player
    game.particles.draw(ctx, camX, 0);

    // player + trail
    drawPlayer(pl, L.accent);

    ctx.restore(); // world

    // flip flash
    if (game.flashA > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (game.flashA * 0.14) + ')';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    ctx.restore(); // shake

    // vignette
    if (!render._vig) {
      var vg = document.createElement('canvas');
      vg.width = CANVAS_W; vg.height = CANVAS_H;
      var vc = vg.getContext('2d');
      var g2 = vc.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.42, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.85);
      g2.addColorStop(0, 'rgba(0,0,0,0)');
      g2.addColorStop(1, 'rgba(0,0,0,0.55)');
      vc.fillStyle = g2;
      vc.fillRect(0, 0, CANVAS_W, CANVAS_H);
      render._vig = vg;
    }
    ctx.drawImage(render._vig, 0, 0);
  }

  function drawGoal(L) {
    var x = L.goal.tx * T + T / 2, y = L.goal.ty * T + T; // floor point
    var pulse = 1 + Math.sin(game.t * 3.4) * 0.08;
    ctx.save();
    // beam
    var g = ctx.createLinearGradient(x, y - 96, x, y);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, hexA(L.accent, 0.4));
    ctx.fillStyle = g;
    ctx.fillRect(x - 16, y - 96, 32, 96);
    // rings
    ctx.strokeStyle = L.accent;
    ctx.shadowColor = L.accent; ctx.shadowBlur = 16;
    ctx.lineWidth = 3;
    for (var i = 0; i < 3; i++) {
      var rr = (10 + i * 10) * pulse;
      ctx.globalAlpha = 1 - i * 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y - 24, rr * 0.7, rr, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    // base pad
    ctx.save();
    ctx.fillStyle = hexA(L.accent, 0.25);
    ctx.fillRect(L.goal.tx * T, y - 4, T, 4);
    ctx.restore();
  }

  function drawLaser(ls) {
    var r = laserRect(ls);
    if (!laserActive(ls)) {
      // emitter tips + warning blink
      var warn = ((game.t + ls.phase * 1.4) % 2.8) > 2.3;
      if (warn && Math.floor(game.t * 14) % 2 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawBeamRect(r, ls.axis, '#ff2d55', 0.5);
        ctx.restore();
      }
      drawEmitters(ls, '#ff2d55');
      return;
    }
    drawBeamRect(r, ls.axis, '#ff2d55', 1);
    drawEmitters(ls, '#ffffff');
  }

  function drawBeamRect(r, axis, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    var core = axis === 'v' ? aabb(r.x + 3, r.y, r.w - 6, r.h) : aabb(r.x, r.y + 3, r.w, r.h - 6);
    ctx.fillStyle = 'rgba(255,45,85,0.25)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff6d8d';
    ctx.fillRect(core.x, core.y, core.w, core.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(core.x + 2, core.y + 2, Math.max(1, core.w - 4), Math.max(1, core.h - 4));
    ctx.restore();
  }

  function drawEmitters(ls, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 9;
    var cx = ls.tx * T + T / 2;
    if (ls.axis === 'v') {
      ctx.fillRect(cx - 4, (ls.ty + ls.len) * T - 8, 8, 8);
      ctx.fillRect(cx - 4, ls.ty * T, 8, 8);
    } else {
      ctx.fillRect(ls.tx * T, ls.ty * T + T / 2 - 4, 8, 8);
      ctx.fillRect((ls.tx + ls.len) * T - 8, ls.ty * T + T / 2 - 4, 8, 8);
    }
    ctx.restore();
  }

  function drawCheckpoint(cp, id) {
    var active = game.checkpointId === id || (game.checkpointId >= id && false);
    var x = cp.x, yBase = (cp.ty + 1) * T;
    var color = game.checkpointId === id ? '#69ff9e' : (game.checkpointId >= 0 && id <= game.checkpointId ? '#2f9e63' : '#5a6b8c');
    ctx.save();
    // pole
    ctx.fillStyle = '#1a2340';
    ctx.fillRect(x - 3, yBase - 40, 6, 40);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = game.checkpointId === id ? 12 : 4;
    ctx.strokeRect(x - 3, yBase - 40, 6, 40);
    // diamond
    var pulse = 1 + Math.sin(game.t * 4 + id) * 0.12;
    var dy = yBase - 46;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, dy - 10 * pulse);
    ctx.lineTo(x + 8, dy);
    ctx.lineTo(x, dy + 10 * pulse);
    ctx.lineTo(x - 8, dy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (game.checkpointId === id && Math.random() < 0.15) {
      game.particles.spawn(x + (Math.random() * 14 - 7), dy + Math.random() * 20, 0, -40, 0.5, '#69ff9e', 2, {});
    }
  }

  function drawPlatform(p, accent) {
    ctx.save();
    var g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    g.addColorStop(0, '#2a3768');
    g.addColorStop(1, '#141b3a');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.shadowColor = accent; ctx.shadowBlur = 10;
    ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
    ctx.shadowBlur = 0;
    // rivets
    ctx.fillStyle = hexA(accent, 0.8);
    for (var i = 0; i < 3; i++) ctx.fillRect(p.x + 10 + i * (p.w - 20) / 2 - 1.5, p.y + p.h / 2 - 1.5, 3, 3);
    // thruster wisps
    if (Math.random() < 0.3) {
      game.particles.spawn(
        p.x + Math.random() * p.w, p.y + p.h + (p.dy > 0 ? -2 : 2),
        -p.dx * 2 + (Math.random() - 0.5) * 20, (Math.random() * 30) * (p.dy >= 0 ? 1 : -1),
        0.4, hexA(accent, 1), 2, {}
      );
    }
    ctx.restore();
  }

  function drawShard(sh) {
    if (sh.taken || game.collected[sh.id]) return;
    var bob = Math.sin(game.t * 2.6 + sh.id * 1.7) * 4;
    ctx.save();
    ctx.translate(sh.x, sh.y + bob);
    ctx.rotate(game.t * 1.6 + sh.id);
    ctx.fillStyle = '#8ffcff';
    ctx.shadowColor = '#00d9ff'; ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-3.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer(pl, accent) {
    if (game.state === STATE.DYING) {
      // faint respawn marker
      return;
    }
    // trail
    ctx.save();
    for (var i = 0; i < pl.trail.length; i++) {
      var tr = pl.trail[i];
      var a = (i / pl.trail.length) * 0.22;
      ctx.globalAlpha = a;
      ctx.fillStyle = accent;
      roundRect(ctx, tr.x + 4, tr.y + 5, pl.w - 8, pl.h - 10, 7);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    var cx = pl.centerX(), cy = pl.centerY();
    // smooth 180° rotation when gravity flips
    var ang, target = pl.gdir < 0 ? Math.PI : 0;
    if (pl.spinT === undefined || pl.spinT >= 1) ang = target;
    else {
      var from = pl.gdir < 0 ? 0 : Math.PI;
      ang = from + (target - from) * pl.spinT;
    }
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    // squash & stretch
    var stretch = clamp(1 + Math.abs(pl.vy) / 2600, 1, 1.18);
    var squash = clamp(1 + Math.abs(pl.vx) / 2400, 1, 1.12);
    var sy = stretch / squash, sx = squash / stretch;
    ctx.scale(sx, sy);
    // body
    var g = ctx.createLinearGradient(0, -pl.h / 2, 0, pl.h / 2);
    g.addColorStop(0, '#eafcff');
    g.addColorStop(0.55, accent);
    g.addColorStop(1, '#0e7fae');
    ctx.fillStyle = g;
    ctx.shadowColor = accent; ctx.shadowBlur = 16;
    roundRect(ctx, -pl.w / 2, -pl.h / 2, pl.w, pl.h, 9);    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, -pl.w / 2 + 1, -pl.h / 2 + 1, pl.w - 2, pl.h - 2, 8);
    ctx.stroke();
    // visor
    ctx.fillStyle = '#071023';
    roundRect(ctx, -8, -pl.h / 2 + 6, 16, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#6cf2ff';
    ctx.fillRect(pl.face > 0 ? -1 : -4, -pl.h / 2 + 8, 5, 3.5);
    ctx.restore();

    // feet glow when grounded
    if (pl.grounded && Math.random() < 0.2) {
      game.particles.spawn(
        cx + (Math.random() * 14 - 7), pl.y + (pl.gdir > 0 ? pl.h : 0),
        -pl.vx * 0.3, (Math.random() * 20) * pl.gdir,
        0.3, hexA(accent, 1), 2, {}
      );
    }
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ================= HUD ================= */
  function updateHUD(force) {
    var L = game.level;
    if (!L) return;
    $('hud-level').textContent = 'LV' + (L.index + 1);
    $('hud-name').textContent = L.name;
    var n = 0;
    for (var k in game.collected) if (game.collected[k]) n++;
    $('hud-shards').textContent = n + '/' + L.shards.length;
    $('hud-time').textContent = fmtTime(game.runT);
    $('hud-deaths').textContent = '☠ ' + game.deaths;
  }

  /* ================= level select ================= */
  function buildLevelGrid() {
    var grid = $('level-grid');
    grid.innerHTML = '';
    LV.LEVELS.forEach(function (def, i) {
      var unlocked = i < save.unlocked;
      var cell = document.createElement('button');
      cell.className = 'level-cell' + (unlocked ? '' : ' locked') + (save.completed[i] ? ' done' : '');
      cell.style.setProperty('--accent', def.accent);
      var shardsTotal = LV.compile(def, i).shards.length;
      var got = save.shards[i] || 0;
      cell.innerHTML = unlocked
        ? '<span class="lc-num">' + (i + 1) + '</span><span class="lc-name">' + def.name + '</span>' +
          '<span class="lc-meta">◆ ' + got + '/' + shardsTotal + ' · ' + (save.best[i] !== undefined ? fmtTime(save.best[i]) : '—') + '</span>'
        : '<span class="lc-num">🔒</span><span class="lc-name">LOCKED</span>';
      if (unlocked) {
        cell.addEventListener('click', function () { Audio2.click(); startLevel(i); });
      }
      grid.appendChild(cell);
    });
  }

  /* ================= sound buttons ================= */
  function syncSoundButtons() {
    var label = 'SOUND: ' + (save.sound ? 'ON' : 'OFF');
    $('btn-sound').textContent = label;
    $('btn-sound2').textContent = label;
  }
  function toggleSound() {
    save.sound = !save.sound;
    Audio2.setSound(save.sound);
    writeSave();
    syncSoundButtons();
    Audio2.click();
  }

  /* ================= main loop ================= */
  var lastTime = 0, acc = 0, hudAcc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTime) lastTime = ts;
    var dt = (ts - lastTime) / 1000;
    lastTime = ts;
    if (dt > 0.1) dt = 0.1;

    var active = game.state === STATE.PLAY || game.state === STATE.DYING;
    if (active) {
      step(dt);
      hudAcc += dt;
      if (hudAcc > 0.08) { hudAcc = 0; updateHUD(); }
    } else {
      // still animate particles slightly on menus for life
      if (game.level) game.particles.update(dt * 0.5);
    }
    render();
  }

  /* ================= boot ================= */
  function boot() {
    canvas = $('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    IN.initTouch();
    IN.cb.onPause = function () { togglePause(); };
    IN.cb.onRestart = function () {
      if (game.state === STATE.PLAY || game.state === STATE.DYING || game.state === STATE.PAUSE) {
        Audio2.click(); startLevel(game.levelIndex);
      }
    };
    IN.cb.onSound = toggleSound;
    IN.cb.anyKey = function () {
      Audio2.resume();
      if (save.sound && !Audio2._musicTimer) Audio2.startMusic();
    };

    /* canvas DPI-aware sizing */
    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = root.devicePixelRatio || 1;
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        ctx.imageSmoothingEnabled = true;
      }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    syncSoundButtons();

    /* UI wiring */
    $('btn-start').addEventListener('click', function () { Audio2.click(); startLevel(Math.min(save.unlocked, LV.LEVEL_COUNT) - 1); });
    $('btn-levels').addEventListener('click', function () { Audio2.click(); setState(STATE.LEVELS); });
    $('btn-howto').addEventListener('click', function () { Audio2.click(); setState(STATE.HOWTO); });
    $('btn-howto-back').addEventListener('click', function () { Audio2.click(); setState(STATE.TITLE); });
    $('btn-levels-back').addEventListener('click', function () { Audio2.click(); setState(STATE.TITLE); });
    $('btn-sound').addEventListener('click', toggleSound);
    $('btn-sound2').addEventListener('click', toggleSound);
    $('btn-pause').addEventListener('click', function () { togglePause(); });
    $('btn-resume').addEventListener('click', function () { Audio2.click(); setState(STATE.PLAY); });
    $('btn-restart').addEventListener('click', function () { Audio2.click(); startLevel(game.levelIndex); });
    $('btn-pause-levels').addEventListener('click', function () { Audio2.click(); setState(STATE.LEVELS); });
    $('btn-quit').addEventListener('click', function () { Audio2.click(); setState(STATE.TITLE); });
    $('btn-next').addEventListener('click', function () {
      Audio2.click();
      if (game.levelIndex + 1 < LV.LEVEL_COUNT) startLevel(game.levelIndex + 1);
    });
    $('btn-again').addEventListener('click', function () { Audio2.click(); startLevel(game.levelIndex); });
    $('btn-victory-levels').addEventListener('click', function () { Audio2.click(); setState(STATE.LEVELS); });
    $('btn-complete-levels').addEventListener('click', function () { Audio2.click(); setState(STATE.LEVELS); });
    $('btn-complete-title').addEventListener('click', function () { Audio2.click(); setState(STATE.TITLE); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && (game.state === STATE.PLAY || game.state === STATE.DYING)) setState(STATE.PAUSE);
    });

    if (IN.isTouchDevice()) document.body.classList.add('touch-mode');
    Audio2.setSound(save.sound);
    if (save.sound) $('btn-sound').textContent = 'SOUND: ON'; else $('btn-sound').textContent = 'SOUND: OFF';

    setState(STATE.TITLE);
    requestAnimationFrame(frame);
  }

  root.GravityBreak = { boot: boot, game: game, setState: setState, startLevel: startLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GravityBreak;
})(typeof globalThis !== 'undefined' ? globalThis : this);
