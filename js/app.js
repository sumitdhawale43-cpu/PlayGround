(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
  let lastCombo = 0;
  let comboPopTimer = 0;
  let lastHp = -1;
  let hudUpdateClock = 0;

  function updateSoundButtons() {
    const on = !!audio.enabled;
    dom.soundBtn.classList.toggle('muted', !on);
    dom.soundBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound');
    dom.titleSound.textContent = on ? 'SOUND: ON' : 'SOUND: OFF';
  }

  function showToast(message, duration = 2.2) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    G.toastTimer = duration;
  }

  function showBanner(kicker, title, sub, duration = 2.1) {
    dom.bannerKicker.textContent = kicker;
    dom.bannerTitle.textContent = title;
    dom.bannerSub.textContent = sub || '';
    dom.waveBanner.classList.add('show');
    G.bannerTimer = duration;
  }

  function hideBanner() {
    dom.waveBanner.classList.remove('show');
    G.bannerTimer = 0;
  }

  function updateTitleBest() {
    const best = G.best || { score: 0, wave: 0 };
    dom.titleBest.textContent = best.wave > 0 ? `WAVE ${roman(best.wave)}` : '—';
  }

  function storeBest() {
    if (G.score > (G.best.score || 0) || G.waveIndex + 1 > (G.best.wave || 0)) {
      G.best.score = Math.max(G.best.score || 0, G.score);
      G.best.wave = Math.max(G.best.wave || 0, Math.min(5, G.waveIndex + 1));
      store.set('best', G.best);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Screens & run lifecycle
  // ---------------------------------------------------------------------------
  function initPreview() {
    G.preview = true;
    G.state = 'title';
    G.player = new Player(900, 0.55);
    G.player.facing = 1;
    G.enemies = [
      new Enemy('ronin', 1050, 0.36, 0),
      new Enemy('spear', 1135, 0.75, 0),
      new Enemy('archer', 1230, 0.54, 0)
    ];
    for (const e of G.enemies) {
      e.state = 'idle';
      e.timer = 0;
      e.facing = -1;
      e.cooldown = 999;
      e.anim = rand(6);
      e.runPhase = rand(6);
    }
    G.effects.length = 0;
    G.particles.length = 0;
    G.projectiles.length = 0;
    G.texts.length = 0;
    G.cam.x = G.player.x - (view.W > 820 ? 130 : 25);
    G.cam.y = 0;
    G.shake = 0;
    G.slowmo = 0;
    G.flash = 0;
    G.zoom = 1;
    dom.flash.style.opacity = 0;
    dom.slowVignette.classList.remove('active');
    updateTitleBest();
  }

  function startRun() {
    audio.resume();
    audio.ui();
    input.clear();
    G.preview = false;
    G.state = 'playing';
    G.playTime = 0;
    G.score = 0;
    G.combo = 0;
    G.comboTimer = 0;
    G.bestCombo = 0;
    G.kills = 0;
    G.boss = null;
    G.bossDeathHandled = false;
    G.deathTimer = null;
    G.victoryTimer = null;
    G.hitstop = 0;
    G.slowmo = 0;
    G.flash = 0;
    G.shake = 0;
    G.zoom = 1;
    G.lastPerfect = false;
    G.enemies.length = 0;
    G.projectiles.length = 0;
    G.effects.length = 0;
    G.particles.length = 0;
    G.texts.length = 0;
    G.spawnQueue.length = 0;
    G.player = new Player(760, 0.56);
    G.player.facing = 1;
    G.cam.x = clamp(G.player.x + 55, view.half + 80, ARENA_W - view.half - 80);
    if (view.w >= ARENA_W) G.cam.x = ARENA_W / 2;

    dom.title.classList.add('is-hidden');
    dom.how.classList.add('is-hidden');
    dom.pause.classList.add('is-hidden');
    dom.over.classList.add('is-hidden');
    dom.win.classList.add('is-hidden');
    dom.hud.classList.remove('is-hidden');
    dom.touch.classList.remove('is-hidden');
    dom.bossBar.classList.add('is-hidden');
    dom.tutorial.classList.add('visible');
    dom.tutorialText.innerHTML = view.W < 821
      ? '<span class="touch-chip">JOYSTICK</span> move <i>·</i> <span class="touch-chip">SLASH</span> strike <i>·</i> <span class="touch-chip">DASH</span> vanish <i>·</i> <span class="touch-chip">KUNAI</span> throw <i>·</i> <span class="touch-chip">SHADOW</span> unleash'
      : '<kbd>WASD</kbd> move <i>·</i> <kbd>J</kbd> slash <i>·</i> <kbd>K</kbd> dash <i>·</i> <kbd>L</kbd> shuriken <i>·</i> <kbd>E</kbd> shadow art';
    G.tutorialTimer = 7.5;
    G.bestCombo = 0;
    lastCombo = 0;
    lastHp = -1;
    updateHud(0, true);
    spawnWave(0);
    dom.flash.style.opacity = 0;
    dom.slowVignette.classList.remove('active');
  }

  function returnTitle() {
    audio.ui();
    dom.title.classList.remove('is-hidden');
    dom.how.classList.add('is-hidden');
    dom.pause.classList.add('is-hidden');
    dom.over.classList.add('is-hidden');
    dom.win.classList.add('is-hidden');
    dom.hud.classList.add('is-hidden');
    dom.touch.classList.add('is-hidden');
    dom.waveBanner.classList.remove('show');
    dom.bossBar.classList.add('is-hidden');
    dom.combo.classList.remove('visible');
    initPreview();
    dom.flash.style.opacity = 0;
    dom.slowVignette.classList.remove('active');
    input.clear();
  }

  function pauseGame() {
    if (G.state !== 'playing' || G.player?.dead) return;
    G.state = 'paused';
    dom.pauseWave.textContent = roman(G.waveIndex + 1);
    dom.pauseScore.textContent = pad(G.score);
    dom.pauseCombo.textContent = G.bestCombo;
    dom.pause.classList.remove('is-hidden');
    audio.ui();
    input.clear();
  }

  function resumeGame() {
    if (G.state !== 'paused') return;
    G.state = 'playing';
    dom.pause.classList.add('is-hidden');
    audio.resume();
    audio.ui();
    input.clear();
  }

  function restartRun() {
    dom.pause.classList.add('is-hidden');
    startRun();
  }

  function finishRun(won) {
    G.state = won ? 'win' : 'over';
    const previousBest = G.best.score || 0;
    const isNew = G.score > previousBest;
    storeBest();
    updateTitleBest();
    dom.hud.classList.add('is-hidden');
    dom.touch.classList.add('is-hidden');
    dom.bossBar.classList.add('is-hidden');
    dom.waveBanner.classList.remove('show');
    dom.newBest.classList.toggle('is-hidden', !isNew);
    dom.winBest.classList.toggle('is-hidden', !isNew);
    if (won) {
      dom.winScore.textContent = pad(G.score);
      dom.winCombo.textContent = G.bestCombo;
      dom.winTime.textContent = formatTime(G.playTime);
      dom.win.classList.remove('is-hidden');
      audio.victory();
    } else {
      dom.overWave.textContent = roman(Math.max(1, G.waveIndex + 1));
      dom.overScore.textContent = pad(G.score);
      dom.overCombo.textContent = G.bestCombo;
      dom.over.classList.remove('is-hidden');
    }
    input.clear();
  }

  // ---------------------------------------------------------------------------
  // Waves & spawning
  // ---------------------------------------------------------------------------
  function spawnWave(index) {
    const wave = WAVES[index];
    G.waveIndex = index;
    G.waveActive = true;
    G.waveCleared = false;
    G.waveTimer = 0;
    G.spawnQueue.length = 0;
    G.boss = null;
    G.bossDeathHandled = false;
    G.victoryTimer = null;
    dom.waveNo.textContent = roman(index + 1);
    dom.waveName.textContent = wave.title;
    if (index + 1 > (G.best.wave || 0)) {
      G.best.wave = index + 1;
      store.set('best', G.best);
    }
    const spread = clamp(view.w * 0.3, 110, 370);
    G.spawnQueue = wave.enemies.map((type, i) => ({
      type,
      delay: 0.08 + i * 0.17 + (type === 'boss' ? 0.55 : 0),
      side: i % 2 === 0 ? 1 : -1,
      spread: spread + rand(55, 0),
      z: clamp(0.3 + ((i * 0.23 + rand(0.12, -0.1)) % 0.66), 0.12, 0.92)
    }));
    showBanner(`WAVE ${roman(index + 1)}`, wave.title, wave.sub, index === 4 ? 2.7 : 2.15);
    audio.wave();
    if (index === 4) {
      audio.bossRoar();
      flash('#a92f2c', 0.18);
      addShake(8);
    }
  }

  function spawnQueuedEnemy(item) {
    const player = G.player;
    let x = player.x + item.side * item.spread;
    if (x < 170 || x > ARENA_W - 170) x = player.x - item.side * item.spread;
    x = clamp(x, 150, ARENA_W - 150);
    const z = item.z;
    const e = new Enemy(item.type, x, z, G.waveIndex);
    e.facing = player.x >= x ? 1 : -1;
    G.enemies.push(e);
    if (item.type === 'boss') {
      G.boss = e;
      dom.bossBar.classList.remove('is-hidden');
      dom.bossFill.style.transform = 'scaleX(1)';
      G.tutorialTimer = 0;
      dom.tutorial.classList.remove('visible');
      addShake(12);
      audio.bossRoar();
    }
    spawnRing(x, z, item.type === 'boss' ? '#ff774e' : '#d75342', item.type === 'boss' ? 280 : 100, 0.55);
    for (let i = 0; i < (item.type === 'boss' ? 28 : 8); i++) {
      spawnParticle({
        x: x + rand(24, -24), y: groundY(z) - rand(120, 0), z,
        vx: rand(90, -90), vy: rand(-15, -90), gravity: 60,
        drag: 0.92, life: rand(0.85, 0.3), maxLife: 0.85,
        size: rand(16, 4), color: chance(0.45) ? '#0c0d12' : '#a83935',
        kind: chance(0.4) ? 'smoke' : 'ink', alpha: 0.35
      });
    }
  }

  function killBossMinions() {
    if (G.bossDeathHandled) return;
    G.bossDeathHandled = true;
    G.waveActive = false;
    G.waveCleared = true;
    for (const e of G.enemies) {
      if (!e.dead && !e.cfg.boss) {
        e.dead = true;
        e.state = 'dead';
        e.timer = 0;
        e.hp = 0;
        spawnDeath(e);
      }
    }
    G.projectiles.length = 0;
    showBanner('THE SHOGUN FALLS', 'THE NIGHT IS YOURS', 'The blood moon dims.', 2.4);
  }

  function clearWave() {
    if (!G.waveActive) return;
    G.waveActive = false;
    G.waveCleared = true;
    G.waveTimer = 2.35;
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 14);
    G.player.shadow = clamp(G.player.shadow + 16, 0, 100);
    G.score += 350 + G.waveIndex * 150;
    audio.wave();
    if (G.waveIndex === WAVES.length - 1) return;
    showBanner('WAVE CLEARED', 'BREATHE', '+14 VITALITY  ·  +16 SHADOW', 1.7);
    showToast('THE COURTYARD GROWS QUIET');
    G.tutorialTimer = 0;
    dom.tutorial.classList.remove('visible');
  }

  function updateWave(dt) {
    if (G.player.dead) return;
    for (let i = G.spawnQueue.length - 1; i >= 0; i--) {
      const item = G.spawnQueue[i];
      item.delay -= dt;
      if (item.delay <= 0) {
        spawnQueuedEnemy(item);
        G.spawnQueue.splice(i, 1);
      }
    }
    const alive = G.enemies.filter(e => !e.dead && e.state !== 'spawn').length;
    const incoming = G.spawnQueue.length;
    dom.enemyCount.textContent = String(alive + incoming);
    if (incoming === 0 && G.enemies.every(e => e.dead) && G.waveActive) {
      clearWave();
    }
    if (G.waveCleared && !G.waveActive && G.waveIndex < WAVES.length - 1) {
      G.waveTimer -= dt;
      if (G.waveTimer <= 0) spawnWave(G.waveIndex + 1);
    }
    if (G.boss) {
      if (G.boss.dead) {
        dom.bossBar.classList.add('is-hidden');
      } else {
        const ratio = clamp(G.boss.hp / G.boss.maxHp, 0, 1);
        dom.bossFill.style.transform = `scaleX(${ratio})`;
        dom.bossBar.classList.remove('is-hidden');
      }
    }
    if (G.victoryTimer != null) {
      if (!G.bossDeathHandled) killBossMinions();
      G.victoryTimer -= dt;
      if (G.victoryTimer <= 0) {
        G.victoryTimer = null;
        finishRun(true);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function updateCamera(dt) {
    if (!G.player) return;
    let target;
    if (view.w >= ARENA_W) target = ARENA_W / 2;
    else target = clamp(G.player.x + G.player.facing * 58, view.half + 80, ARENA_W - view.half - 80);
    const k = 1 - Math.exp(-dt * (G.player.state === 'special' ? 12 : 4.6));
    G.cam.x = lerp(G.cam.x, target, k);
    G.cam.y = 0;
    const zoomTarget = G.state === 'playing' ? 1.055 : 1;
    G.zoom = lerp(G.zoom, zoomTarget, 1 - Math.exp(-dt * 2.4));
  }

  function resolveBodyCollisions() {
    const p = G.player;
    if (!p || p.dead) return;
    for (const e of G.enemies) {
      if (e.dead || e.state === 'spawn') continue;
      const zRange = e.cfg.boss ? 0.15 : 0.095;
      const minX = e.cfg.boss ? 58 : 42;
      if (Math.abs(p.z - e.z) > zRange) continue;
      const dx = p.x - e.x;
      const ad = Math.abs(dx);
      if (ad >= minX || ad < 0.001) continue;
      const push = (minX - ad) * 0.5;
      const dir = sign(dx);
      p.x = clamp(p.x + dir * push, 120, ARENA_W - 120);
      e.x = clamp(e.x - dir * push, 100, ARENA_W - 100);
    }
  }

  function updateTitle(dt) {
    if (!G.player) return;
    G.player.previewUpdate(dt);
    for (const e of G.enemies) {
      e.anim += dt;
      e.runPhase += dt * 1.1;
      e.facing = -1;
    }
    const base = G.player.x - (view.W > 820 ? 130 : view.W < 700 ? 138 : 25);
    G.cam.x = base + Math.sin(G.time * 0.09) * 5;
    G.cam.y = 0;
  }

  function updateGame(dt) {
    G.playTime += dt;
    G.player.update(dt);
    for (const e of G.enemies) e.update(dt);
    resolveBodyCollisions();
    updateProjectiles(dt);
    updateEffects(dt);
    updateParticles(dt);
    updateWave(dt);
    updateCamera(dt);
    if (G.comboTimer > 0) {
      G.comboTimer -= dt;
      if (G.comboTimer <= 0) G.combo = 0;
    }
    G.enemies = G.enemies.filter(e => !(e.dead && e.timer > 1.55));
    if (G.player.hp <= 0 && G.deathTimer == null && !G.player.dead) G.player.die();
  }

  function updateVisuals(rdt) {
    // screen flash
    if (G.flash > 0) {
      G.flash = Math.max(0, G.flash - rdt * 2.6);
      dom.flash.style.opacity = String(G.flash);
    }
    // hit shake
    if (G.shake > 0) {
      G.shake = Math.max(0, G.shake - rdt * 38);
      const amt = G.reducedMotion ? 0 : G.shake;
      G.shakeX = rand(amt, -amt);
      G.shakeY = rand(amt * 0.55, -amt * 0.55) * 0.7;
    } else {
      G.shakeX = 0;
      G.shakeY = 0;
    }
    if (G.slowmo > 0) {
      G.slowmo = Math.max(0, G.slowmo - rdt);
      if (G.slowmo <= 0) dom.slowVignette.classList.remove('active');
    }
    if (G.bannerTimer > 0) {
      G.bannerTimer -= rdt;
      if (G.bannerTimer <= 0) hideBanner();
    }
    if (G.toastTimer > 0) {
      G.toastTimer -= rdt;
      if (G.toastTimer <= 0) dom.toast.classList.remove('show');
    }
    if (G.tutorialTimer > 0) {
      G.tutorialTimer -= rdt;
      if (G.tutorialTimer <= 0) dom.tutorial.classList.remove('visible');
    }
    if (G.perfectTimer > 0) {
      G.perfectTimer -= rdt;
      dom.pulsePrompt.classList.add('show');
      if (G.perfectTimer <= 0) dom.pulsePrompt.classList.remove('show');
    }
    if (G.state === 'playing') {
      if (G.deathTimer != null) {
        G.deathTimer -= rdt;
        if (G.deathTimer <= 0) {
          G.deathTimer = null;
          finishRun(false);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  function updateHud(rdt, force = false) {
    if (!G.player) return;
    hudUpdateClock -= rdt;
    const face = G.player.facing;
    if (hudUpdateClock > 0 && !force) return;
    hudUpdateClock = 0.04;
    const hp = clamp(G.player.hp / G.player.maxHp, 0, 1);
    const shadow = clamp(G.player.shadow / 100, 0, 1);
    dom.hpFill.style.transform = `scaleX(${hp})`;
    dom.hpLag.style.transform = `scaleX(${hp})`;
    dom.hpFill.classList.toggle('low', hp <= 0.3);
    dom.hpText.textContent = String(Math.ceil(G.player.hp));
    dom.shadowFill.style.transform = `scaleX(${shadow})`;
    dom.shadowTrack.classList.toggle('full', shadow >= 0.999);
    dom.shadowLabel.textContent = shadow >= 0.999 ? 'SHADOW READY' : 'SHADOW';
    dom.score.textContent = pad(G.score);
    dom.tutorial.classList.toggle('visible', G.tutorialTimer > 0 && G.state === 'playing');

    const showCombo = G.combo > 1 && G.comboTimer > 0 && G.state === 'playing';
    dom.combo.classList.toggle('visible', showCombo);
    if (G.combo !== lastCombo) {
      if (G.combo > lastCombo) {
        dom.combo.classList.remove('pop');
        void dom.combo.offsetWidth;
        dom.combo.classList.add('pop');
        comboPopTimer = 0.19;
      }
      lastCombo = G.combo;
    }
    if (comboPopTimer > 0) {
      comboPopTimer -= 0.04;
      if (comboPopTimer <= 0) dom.combo.classList.remove('pop');
    }
    dom.comboNum.textContent = String(G.combo);
    dom.comboMeter.style.transform = `scaleX(${clamp(G.comboTimer / 2.5, 0, 1)})`;

    const shadowAction = document.querySelector('.shadow-action');
    shadowAction.classList.toggle('ready', shadow >= 0.999);
    shadowAction.classList.toggle('cooldown', shadow < 0.999);
    document.querySelector('.dash-action').classList.toggle('cooldown', G.player.dashCd > 0.1);
    document.querySelector('.kunai-action').classList.toggle('cooldown', G.player.kunaiCd > 0.1);

    if (G.state === 'playing') {
      const alive = G.enemies.filter(e => !e.dead).length + G.spawnQueue.length;
      dom.enemyCount.textContent = String(alive);
    }
    dom.pulsePrompt.classList.toggle('show', G.perfectTimer > 0);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  function render() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    drawSky();
    drawAmbient(false);
    drawBamboo(false);
    drawGround();

    ctx.save();
    worldTransform(1, 0.72);
    drawGhosts();
    const drawables = [];
    if (G.player && (G.state !== 'over' || !G.player.dead || true)) drawables.push(G.player);
    for (const e of G.enemies) if (!(e.dead && e.timer > 1.5)) drawables.push(e);
    drawables.sort((a, b) => {
      if (Math.abs(a.z - b.z) < 0.05) return a.x - b.x;
      return a.z - b.z;
    });
    for (const entity of drawables) {
      if (entity === G.player) drawPlayer(entity);
      else drawEnemy(entity);
    }
    drawProjectiles();
    drawEffectsFront();
    drawParticles();
    drawTexts();
    ctx.restore();

    drawBamboo(true);
    drawForegroundFoliage();
    drawForegroundFog();
    drawAmbient(true);
    drawSpeedLines();
    drawSpecialOverlay();
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------
  let lastFrame = performance.now();
  function tick(now) {
    const rdt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    G.time += rdt;

    updateScenery(rdt);
    updateVisuals(rdt);
    audio.ambientTick();

    if (G.state === 'playing') {
      if (G.hitstop > 0) {
        G.hitstop = Math.max(0, G.hitstop - rdt);
      } else {
        const dt = rdt * (G.slowmo > 0 ? 0.3 : 1);
        updateGame(dt);
      }
    } else if (G.state === 'title' || G.state === 'how') {
      updateTitle(rdt);
    } else if (G.state === 'paused') {
      // world holds its breath
    }

    updateHud(rdt);
    render();
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  function bindUI() {
    dom.play.addEventListener('click', () => { audio.resume(); startRun(); });
    dom.howBtn.addEventListener('click', () => {
      audio.ui();
      dom.how.classList.remove('is-hidden');
      G.state = 'how';
    });
    document.querySelectorAll('[data-close="howScreen"]').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.how.classList.add('is-hidden');
        G.state = 'title';
        audio.ui();
      });
    });
    document.querySelectorAll('[data-start]').forEach(btn => {
      btn.addEventListener('click', () => { dom.how.classList.add('is-hidden'); startRun(); });
    });
    dom.pauseBtn.addEventListener('click', () => { if (G.state === 'playing') pauseGame(); else if (G.state === 'paused') resumeGame(); });
    dom.resumeBtn.addEventListener('click', resumeGame);
    dom.restartPauseBtn.addEventListener('click', restartRun);
    dom.retryBtn.addEventListener('click', () => { dom.over.classList.add('is-hidden'); startRun(); });
    dom.againBtn.addEventListener('click', () => { dom.win.classList.add('is-hidden'); startRun(); });
    dom.overTitleBtn.addEventListener('click', returnTitle);
    dom.winTitleBtn.addEventListener('click', returnTitle);
    const toggle = () => { audio.resume(); audio.setEnabled(!audio.enabled); };
    dom.soundBtn.addEventListener('click', toggle);
    dom.titleSound.addEventListener('click', toggle);
    window.addEventListener('pointerdown', () => { if (audio.enabled) audio.resume(); }, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.state === 'playing') pauseGame();
    });
  }

  function boot() {
    if (!G.best || typeof G.best !== 'object') G.best = { score: 0, wave: 0 };
    G.best.score = Number(G.best.score) || 0;
    G.best.wave = Number(G.best.wave) || 0;
    bindUI();
    updateSoundButtons();
    resize();
    initPreview();
    dom.hud.classList.add('is-hidden');
    dom.touch.classList.add('is-hidden');
    dom.bossBar.classList.add('is-hidden');
    dom.how.classList.add('is-hidden');
    dom.pause.classList.add('is-hidden');
    dom.over.classList.add('is-hidden');
    dom.win.classList.add('is-hidden');
    document.body.dataset.ready = 'true';
    requestAnimationFrame(tick);
  }

  // Boot after all systems have loaded.
  window.addEventListener('load', boot, { once: true });
  if (document.readyState === 'complete') boot();

  Object.assign(window, {
    startRun, pauseGame, resumeGame, returnTitle, showToast, showBanner,
    updateSoundButtons, finishRun
  });
})();
