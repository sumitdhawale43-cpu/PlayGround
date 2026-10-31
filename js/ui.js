/* =========================================================
   PORTAL RUNNER — DOM interface, menus & mobile controls
   ========================================================= */
import { LEVELS, getLevelStats } from './levels.js';
import { formatTime, progressSummary } from './save.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(game) {
    this.game = game;
    this.screen = 'title';
    this.settingsReturn = 'title';
    this.lastHud = {};
    this.artCache = new Map();
    this.toastTimer = 0;
    this.bannerTimer = 0;
    this.resetArm = 0;
    this.resetTimer = 0;
    this.stickPointer = null;
    this.stickCenter = { x: 0, y: 0 };

    this.el = {
      hud: $('hud'),
      screens: [...document.querySelectorAll('.screen')],
      screenTitle: $('screen-title'),
      screenLevels: $('screen-levels'),
      screenHelp: $('screen-help'),
      screenSettings: $('screen-settings'),
      screenPause: $('screen-pause'),
      screenComplete: $('screen-complete'),
      levelGrid: $('level-grid'),
      titleProgress: $('title-progress'),
      playSub: $('play-sub'),
      atlasProgress: $('atlas-progress'),
      settingsProgress: $('settings-progress'),
      hudIndex: $('hud-index'),
      hudName: $('hud-name'),
      hudSub: $('hud-sub'),
      hudShards: $('hud-shards'),
      hudKeys: $('hud-keys'),
      hudTimer: $('hud-timer'),
      dimName: $('dim-name'),
      dashArc: $('dash-arc'),
      dashMeter: $('dash-meter'),
      prompt: $('portal-prompt'),
      promptText: document.querySelector('#portal-prompt .prompt-text'),
      toast: $('toast'),
      banner: $('level-banner'),
      bannerIndex: $('banner-index'),
      bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'),
      death: $('death-vignette'),
      touch: $('touch-controls'),
      touchPhase: $('touch-phase'),
      touchDash: $('touch-dash'),
      touchJump: $('touch-jump'),
      stickZone: $('stick-zone'),
      stickBase: $('stick-base'),
      stickKnob: $('stick-knob'),
      pauseStats: $('pause-stats'),
      completeEyebrow: $('complete-eyebrow'),
      completeTitle: $('complete-title'),
      completeStars: [...document.querySelectorAll('#complete-stars .big-star')],
      completeStats: $('complete-stats'),
      completeHint: $('complete-hint'),
      btnNext: $('btn-next'),
      setMusic: $('set-music'),
      setSfx: $('set-sfx'),
      setMotion: $('set-motion'),
      setTouch: $('set-touch'),
      setShake: $('set-shake'),
      btnReset: $('btn-reset'),
      flash: $('flash'),
      curtain: $('curtain'),
    };

    this.bindActions();
    this.bindSettings();
    this.bindTouch();
    this.syncSettings();
    this.buildLevelGrid();
    this.updateTitle();
    document.body.classList.toggle('reduced-motion', !!game.save.settings.motion);
    document.body.classList.toggle('muted', !(game.save.settings.music || game.save.settings.sfx));
  }

  /* ---------------------------------------------------------
     navigation
     --------------------------------------------------------- */
  showOnly(name) {
    for (const s of this.el.screens) s.classList.remove('active');
    const target = $('screen-' + name);
    if (target) target.classList.add('active');
    this.screen = name;
  }

  hideScreens() {
    for (const s of this.el.screens) s.classList.remove('active');
    this.screen = 'playing';
    this.showHUD();
  }

  hideOverlays() {
    this.el.screenPause.classList.remove('active');
    this.el.screenComplete.classList.remove('active');
    if (!['title', 'levels', 'help', 'settings'].includes(this.screen)) this.screen = 'playing';
    this.showHUD();
    this.setTouchVisibility();
  }

  showHUD() {
    this.el.hud.classList.remove('hidden');
  }

  hideHUD() {
    this.el.hud.classList.add('hidden');
  }

  showTitle() {
    this.game.mode = 'title';
    this.game.level = null;
    this.game.player = null;
    this.game.dying = 0;
    this.hideHUD();
    this.setTouchVisibility();
    this.showOnly('title');
    this.updateTitle();
    this.buildLevelGrid();
    this.setPrompt(null);
    document.body.classList.remove('dark-dim');
  }

  showLevels() {
    this.game.mode = 'levels';
    this.game.level = null;
    this.game.player = null;
    this.hideHUD();
    this.setTouchVisibility();
    this.showOnly('levels');
    this.updateTitle();
    this.buildLevelGrid();
    document.body.classList.remove('dark-dim');
  }

  showHelp() {
    this.game.mode = 'help';
    this.hideHUD();
    this.setTouchVisibility();
    this.showOnly('help');
  }

  showSettings(from = 'title') {
    this.settingsReturn = from;
    this.hideHUD();
    this.setTouchVisibility();
    this.showOnly('settings');
    this.syncSettings();
    this.updateSettingsProgress();
  }

  showPause(game) {
    this.hideHUD();
    this.setTouchVisibility();
    this.screen = 'pause';
    this.el.screenPause.classList.add('active');
    this.el.screenComplete.classList.remove('active');
    this.el.pauseStats.textContent =
      `SHARDS ${game.shards}/${game.totalShards}  ·  RELICS ${game.keys}/${game.totalKeys}  ·  ${formatTime(game.levelTime)}`;
    this.setPrompt(null);
  }

  showComplete(game, result, record) {
    this.hideHUD();
    this.setTouchVisibility();
    this.screen = 'complete';
    this.el.screenComplete.classList.add('active');
    this.el.screenPause.classList.remove('active');
    const isFinal = game.level.id === LEVELS.length;
    this.el.completeEyebrow.textContent = isFinal ? 'JOURNEY COMPLETE' : 'RIFT STABILIZED';
    this.el.completeTitle.textContent = isFinal ? 'The Rifts Are Whole' : 'Rift Cleared';
    this.el.completeStars.forEach((star, i) => {
      star.classList.remove('on');
      if (i < result.stars) {
        setTimeout(() => star.classList.add('on'), 120 + i * 180);
      }
    });
    this.el.completeStats.innerHTML = `
      <div class="cstat"><small>Shards</small><b>${result.shards}<span class="of">/${result.totalShards}</span></b></div>
      <div class="cstat"><small>Relic keys</small><b>${result.keys}<span class="of">/${result.totalKeys}</span></b></div>
      <div class="cstat"><small>Time</small><b>${formatTime(result.time)}</b></div>`;
    const bestStars = record ? record.stars : result.stars;
    this.el.completeHint.innerHTML = `Best rating ${'★'.repeat(bestStars)}${'☆'.repeat(3 - bestStars)} · ${result.deaths} fall${result.deaths === 1 ? '' : 's'} · <kbd>ENTER</kbd> continue`;
    const nextLabel = this.el.btnNext.querySelector('b');
    const nextSmall = this.el.btnNext.querySelector('small');
    if (isFinal) {
      nextLabel.textContent = 'RETURN TO ATLAS';
      nextSmall.textContent = 'REPLAY ANY RIFT';
    } else {
      nextLabel.textContent = 'NEXT RIFT';
      nextSmall.textContent = 'KEEP SHIFTING';
    }
    this.buildLevelGrid();
    this.updateTitle();
    this.setPrompt(null);
  }

  setTouchVisibility() {
    const visible = this.game.mode === 'playing' && (this.game.coarse || this.game.save.settings.touch);
    this.el.touch.classList.toggle('hidden', !visible);
    document.body.classList.toggle('touch-ui', visible);
    if (!visible) {
      this.game.touchAxis = 0;
      this.game.touchJumpHeld = false;
    }
  }

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */
  updateHUD(game) {
    if (!game.level || game.mode !== 'playing') return;
    const cache = this.lastHud;
    const levelId = game.level.id;
    if (cache.levelId !== levelId) {
      cache.levelId = levelId;
      this.el.hudIndex.textContent = String(levelId).padStart(2, '0');
      this.el.hudName.textContent = game.level.name;
      this.el.hudSub.textContent = game.level.layerNames.light + '  ·  ' + game.level.layerNames.dark;
    }
    const shardText = `${game.shards}/${game.totalShards}`;
    if (cache.shards !== shardText) {
      cache.shards = shardText;
      this.el.hudShards.textContent = shardText;
    }
    const keyText = `${game.keys}/${game.totalKeys}`;
    if (cache.keys !== keyText) {
      cache.keys = keyText;
      this.el.hudKeys.textContent = keyText;
    }
    const timeText = formatTime(game.levelTime);
    if (cache.time !== timeText) {
      cache.time = timeText;
      this.el.hudTimer.textContent = timeText;
    }
    const dimLabel = (game.level.layerNames[game.layer] || '').toUpperCase();
    if (cache.dim !== dimLabel) {
      cache.dim = dimLabel;
      this.el.dimName.textContent = dimLabel;
    }
    const charge = game.player ? clamp01(1 - game.player.dashCd / 1.12) : 1;
    const offset = (113 * (1 - charge)).toFixed(1);
    if (cache.dash !== offset) {
      cache.dash = offset;
      this.el.dashArc.style.strokeDashoffset = offset;
    }
    const empty = charge <= 0.01;
    if (cache.dashEmpty !== empty) {
      cache.dashEmpty = empty;
      this.el.dashMeter.classList.toggle('empty', empty);
    }
  }

  setDimension(layer, level) {
    if (!level) return;
    const name = (level.layerNames[layer] || '').toUpperCase();
    this.el.dimName.textContent = name;
    document.body.classList.toggle('dark-dim', layer === 'dark');
    this.lastHud.dim = name;
    const badge = document.querySelector('.dim-badge');
    if (badge) {
      badge.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
        { duration: 420, easing: 'ease-out' }
      );
    }
  }

  setPrompt(text) {
    const prompt = this.el.prompt;
    if (!text) {
      if (!prompt.classList.contains('hidden')) prompt.classList.remove('show');
      return;
    }
    this.el.promptText.textContent = text;
    prompt.classList.remove('hidden');
    requestAnimationFrame(() => prompt.classList.add('show'));
  }

  updateTouchPhase(ready, isGoal = false) {
    const btn = this.el.touchPhase;
    btn.classList.toggle('ready', !!ready);
    btn.classList.toggle('cool', !ready);
    const span = btn.querySelector('span');
    if (span) span.textContent = isGoal ? 'ASCEND' : 'PHASE';
  }

  showLevelIntro(level) {
    this.el.bannerIndex.textContent = 'LEVEL ' + String(level.id).padStart(2, '0');
    this.el.bannerTitle.textContent = level.name;
    this.el.bannerSub.textContent = `${level.layerNames.light}  ·  ${level.layerNames.dark}`;
    const banner = this.el.banner;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => banner.classList.remove('show'), 3500);
    this.el.toast.classList.remove('show');
  }

  toast(text, gold = false, duration = 2.6) {
    const el = this.el.toast;
    el.textContent = text;
    el.classList.toggle('gold', !!gold);
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), duration * 1000);
  }

  setDeath(on) {
    this.el.death.classList.toggle('show', !!on);
  }

  /* ---------------------------------------------------------
     menus
     --------------------------------------------------------- */
  updateTitle() {
    const save = this.game.save;
    const p = progressSummary(save);
    const level = Math.min(LEVELS.length, Math.max(1, save.unlocked));
    const allDone = Object.keys(save.levels).filter((id) => save.levels[id].completed).length >= LEVELS.length;
    if (this.el.playSub) {
      this.el.playSub.textContent = allDone
        ? 'REPLAY THE RIFTS'
        : save.unlocked > 1 ? `CONTINUE · RIFT ${String(level).padStart(2, '0')}` : 'BEGIN THE JOURNEY';
    }
    const btnLabel = document.querySelector('#btn-play b');
    if (btnLabel) btnLabel.textContent = save.unlocked > 1 ? 'CONTINUE' : 'PLAY';
    let totalShards = 0;
    for (const l of LEVELS) totalShards += getLevelStats(l).shards;
    const collectedStars = p.stars;
    this.el.titleProgress.innerHTML =
      `<b>${collectedStars}</b> / ${p.maxStars} STARS &nbsp;·&nbsp; <b>${p.shards}</b> / ${totalShards} SHARDS &nbsp;·&nbsp; <b>${p.keys}</b> / 15 RELICS`;
    if (this.el.settingsProgress) {
      this.el.settingsProgress.textContent = `${Math.round((collectedStars / p.maxStars) * 100)}% COMPLETE`;
    }
  }

  updateSettingsProgress() {
    const p = progressSummary(this.game.save);
    this.el.settingsProgress.textContent = `${Math.round((p.stars / p.maxStars) * 100)}% COMPLETE`;
  }

  buildLevelGrid() {
    if (!this.el.levelGrid) return;
    const save = this.game.save;
    let totalStars = 0;
    for (const rec of Object.values(save.levels)) totalStars += rec.stars || 0;
    this.el.atlasProgress.textContent = `${totalStars} / ${LEVELS.length * 3} STARS`;
    const cards = LEVELS.map((level) => {
      const stats = getLevelStats(level);
      const rec = save.levels[String(level.id)] || null;
      const locked = level.id > save.unlocked;
      const stars = rec ? rec.stars : 0;
      const bestShards = rec ? rec.shards : 0;
      const bestKeys = rec ? rec.keys : 0;
      const best = rec && rec.bestTime > 0 ? formatTime(rec.bestTime) : '—';
      if (!this.artCache.has(level.id)) {
        this.artCache.set(level.id, this.game.renderer.makeCardArt(level));
      }
      const art = this.artCache.get(level.id);
      const starHtml = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
      return `
        <button class="level-card ${locked ? 'locked' : ''} ${level.id === save.unlocked ? 'current' : ''}"
          data-level="${level.id}" ${locked ? 'aria-disabled="true"' : ''} aria-label="${locked ? 'Locked' : 'Play'} ${level.name}">
          <div class="card-art" style="background-image:url('${art}')"></div>
          <div class="card-num">${String(level.id).padStart(2, '0')}</div>
          <div class="card-stars">${starHtml}</div>
          <div class="card-info">
            <div class="card-name">${level.name}</div>
            <div class="card-sub">${level.subtitle}</div>
            <div class="card-meta">
              <span class="mini-shard"></span>${bestShards}/${stats.shards}
              <span class="mini-key"></span>${bestKeys}/${stats.keys}
            </div>
          </div>
          <div class="card-best">${best}</div>
        </button>`;
    });
    this.el.levelGrid.innerHTML = cards.join('');
  }

  /* ---------------------------------------------------------
     controls / bindings
     --------------------------------------------------------- */
  bindActions() {
    document.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.game.unlockAudio();
        this.game.audio.sfx('click');
        this.handleAction(btn.dataset.action);
      });
    });

    const grid = this.el.levelGrid;
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card) return;
      this.game.unlockAudio();
      if (card.classList.contains('locked')) {
        this.game.audio.sfx('denied');
        this.toast('Stabilise the previous rift first', false, 1.8);
        return;
      }
      const id = Number(card.dataset.level);
      this.game.audio.sfx('click');
      this.game.startLevel(id - 1);
    });

    $('btn-pause').addEventListener('click', () => this.game.pause());
    $('btn-sound').addEventListener('click', () => this.game.toggleSound());

    this.el.btnReset.addEventListener('click', () => this.handleReset());
  }

  handleAction(action) {
    switch (action) {
      case 'play': this.game.play(); break;
      case 'levels': this.showLevels(); break;
      case 'help': this.showHelp(); break;
      case 'settings': this.game.openSettings(this.screen === 'pause' ? 'pause' : 'title'); break;
      case 'back-title':
        if (this.screen === 'settings') this.game.closeSettings();
        else this.showTitle();
        break;
      case 'resume': this.game.resume(); break;
      case 'restart': this.game.restart(); break;
      case 'exit-level': this.game.exitLevel(); break;
      case 'next-level': this.game.nextLevel(); break;
      case 'retry': this.game.restart(); break;
      default: break;
    }
  }

  bindSettings() {
    const map = [
      [this.el.setMusic, 'music'],
      [this.el.setSfx, 'sfx'],
      [this.el.setMotion, 'motion'],
      [this.el.setTouch, 'touch'],
      [this.el.setShake, 'shake'],
    ];
    for (const [input, key] of map) {
      input.addEventListener('change', () => {
        this.game.applySettings({ [key]: input.checked });
        if (key === 'touch') this.game.resize();
        this.game.audio.sfx('click');
      });
    }
  }

  syncSettings() {
    const s = this.game.save.settings;
    this.el.setMusic.checked = !!s.music;
    this.el.setSfx.checked = !!s.sfx;
    this.el.setMotion.checked = !!s.motion;
    this.el.setTouch.checked = !!s.touch;
    this.el.setShake.checked = !!s.shake;
    document.body.classList.toggle('muted', !(s.music || s.sfx));
    document.body.classList.toggle('reduced-motion', !!s.motion);
  }

  handleReset() {
    const btn = this.el.btnReset;
    const now = Date.now();
    if (this.resetArm && now - this.resetArm < 3000) {
      clearTimeout(this.resetTimer);
      this.resetArm = 0;
      btn.classList.remove('armed');
      btn.textContent = 'RESET';
      this.game.resetProgress();
      this.game.level = null;
      this.game.player = null;
      this.game.mode = 'title';
      this.el.screenPause.classList.remove('active');
      this.el.screenComplete.classList.remove('active');
      this.showTitle();
      return;
    }
    this.resetArm = now;
    btn.classList.add('armed');
    btn.textContent = 'CONFIRM?';
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.resetArm = 0;
      btn.classList.remove('armed');
      btn.textContent = 'RESET';
    }, 3000);
  }

  bindTouch() {
    const jump = this.el.touchJump;
    const dash = this.el.touchDash;
    const phase = this.el.touchPhase;
    const hold = (el, down, up) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.classList.add('held');
        if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
        down();
      });
      const release = (e) => {
        e.preventDefault();
        el.classList.remove('held');
        up();
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('pointerleave', (e) => {
        if (e.buttons) release(e);
      });
    };
    hold(jump, () => this.game.queueJump(), () => this.game.releaseJump());
    hold(dash, () => this.game.queueDash(), () => {});
    hold(phase, () => this.game.queuePhase(), () => {});

    const zone = this.el.stickZone;
    const base = this.el.stickBase;
    const knob = this.el.stickKnob;
    const updateStick = (e) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const max = rect.width * 0.36;
      const len = Math.hypot(dx, dy) || 1;
      const cl = Math.min(1, len / max);
      const ox = (dx / len) * cl * max;
      const oy = (dy / len) * cl * max;
      knob.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
      this.game.setTouchAxis((dx / max));
      base.classList.add('active');
    };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.stickPointer = e.pointerId;
      if (zone.setPointerCapture) zone.setPointerCapture(e.pointerId);
      updateStick(e);
    });
    zone.addEventListener('pointermove', (e) => {
      if (this.stickPointer !== e.pointerId) return;
      e.preventDefault();
      updateStick(e);
    });
    const releaseStick = (e) => {
      if (this.stickPointer !== null && e.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.game.setTouchAxis(0);
      knob.style.transform = 'translate(-50%, -50%)';
      base.classList.remove('active');
    };
    zone.addEventListener('pointerup', releaseStick);
    zone.addEventListener('pointercancel', releaseStick);
    zone.addEventListener('pointerleave', releaseStick);
  }

  refreshAll() {
    this.syncSettings();
    this.updateTitle();
    this.buildLevelGrid();
    this.updateSettingsProgress();
  }
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
