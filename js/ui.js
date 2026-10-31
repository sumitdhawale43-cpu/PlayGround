/* ============================================================
   TIME REWIND — DOM interface
   ============================================================ */

import { LEVELS, TOTAL_CORES } from './levels.js';

const $ = (id) => document.getElementById(id);

export class UIManager {
  constructor(game) {
    this.game = game;
    this.current = 'menu';
    this.screens = {
      menu: $('menuScreen'),
      levels: $('levelScreen'),
      how: $('howScreen'),
      settings: $('settingsScreen'),
      pause: $('pauseScreen'),
      complete: $('completeScreen')
    };
    this.hud = $('hud');
    this.hint = $('hint');
    this.hintText = $('hint-text');
    this.toast = $('toast');
    this.toastKicker = $('toast-kicker');
    this.toastText = $('toast-text');
    this.intro = $('levelIntro');
    this.death = $('death-prompt');
    this.deathEnergy = $('death-energy');
    this.deathBar = $('death-bar-fill');
    this.touch = $('touchControls');
    this.hintTimer = 0;
    this.toastTimer = 0;
    this.introTimer = 0;
    this.lastHud = 0;
    this._bind();
    this._bindTouch();
    this._detectTouch();
    window.addEventListener('resize', () => this._detectTouch());
  }

  _detectTouch() {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const small = window.innerWidth < 900;
    const touch = coarse || small;
    document.body.classList.toggle('touch', touch);
    if (this.game) this.game.resize();
  }

  _bind() {
    const click = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', (e) => { e.preventDefault(); this.game.audio.click(); fn(); }); };
    click('btn-play', () => this.game.playFromMenu());
    click('btn-continue', () => this.game.continueRun());
    click('btn-levels', () => this.game.openLevels());
    click('btn-how', () => this.game.openHow());
    click('btn-settings', () => this.game.openSettings());
    click('hud-pause', () => this.game.pause());
    click('hud-mute', () => this.game.toggleMute());
    click('btn-resume', () => this.game.resume());
    click('btn-restart', () => this.game.restartSector());
    click('btn-pause-levels', () => this.game.openLevels(true));
    click('btn-next', () => this.game.nextSector());
    click('btn-replay', () => this.game.replaySector());
    click('btn-complete-levels', () => this.game.openLevels(true));
    click('btn-reset', () => this.game.resetProgress());
    click('toggle-audio', () => this.game.toggleMute());
    click('toggle-motion', () => this.game.toggleReducedMotion());
    click('toggle-fx', () => this.game.toggleScreenFx());

    // Delegated UI actions (back buttons etc.)
    document.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const action = el.dataset.action;
        if (action === 'play') return;
        e.preventDefault();
        this.game.audio.click();
        if (action === 'menu') this.game.openMenu();
        else if (action === 'levels') this.game.openLevels();
        else if (action === 'how') this.game.openHow();
        else if (action === 'settings') this.game.openSettings();
      });
    });

    $('level-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card || card.classList.contains('locked')) return;
      this.game.audio.click();
      this.game.startSector(Number(card.dataset.index));
    });
  }

  _bindTouch() {
    const buttons = document.querySelectorAll('[data-touch]');
    const release = (btn) => {
      const action = btn.dataset.touch;
      btn.classList.remove('active');
      if (action === 'left' || action === 'right') this.game.setMove(action, false);
      if (action === 'rewind') this.game.setRewind(false);
      if (action === 'jump') this.game.releaseJump();
    };
    buttons.forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture?.(e.pointerId);
        btn.classList.add('active');
        this.game.audio.unlock();
        const action = btn.dataset.touch;
        if (action === 'left' || action === 'right') this.game.setMove(action, true);
        if (action === 'jump') this.game.pressJump();
        if (action === 'rewind') this.game.setRewind(true);
      });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        btn.addEventListener(ev, (e) => { e.preventDefault(); release(btn); });
      }
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  hideAllScreens() {
    Object.values(this.screens).forEach((s) => s.classList.add('is-hidden'));
    this.current = 'game';
  }

  show(name) {
    Object.entries(this.screens).forEach(([key, el]) => el.classList.toggle('is-hidden', key !== name));
    this.current = name;
  }

  showMenu(save, lastLevel) {
    this.show('menu');
    this.hud.classList.add('is-hidden');
    document.body.classList.remove('in-game');
    const summary = $('save-summary');
    if (save.completed && Object.keys(save.completed).length) {
      const clears = Object.keys(save.completed).length;
      summary.textContent = `${clears} SECTOR${clears > 1 ? 'S' : ''} RESTORED // ${save.totalCores || 0} CORES`;
    } else {
      summary.textContent = 'NO TIMELINE RECORDED';
    }
    const card = $('continue-card');
    if (lastLevel) {
      card.classList.remove('is-hidden');
      $('continue-name').textContent = `SECTOR ${lastLevel.number} — ${lastLevel.name}`;
    } else {
      card.classList.add('is-hidden');
    }
    this.refreshSettings(save);
  }

  showHud(level) {
    this.hud.classList.remove('is-hidden');
    this.hud.classList.remove('rewinding');
    document.body.classList.add('in-game');
    $('hud-number').textContent = level.number;
    $('hud-name').textContent = level.name;
    this.setCores(0, level.cores.length);
    this.setCheckpoint(-1);
    this.setEnergy(100);
  }

  hideHud() {
    this.hud.classList.add('is-hidden');
    document.body.classList.remove('in-game');
    this.hideDeath();
  }

  setCheckpoint(n) {
    const el = $('hud-checkpoint');
    if (n >= 0) {
      el.classList.add('active');
      el.innerHTML = '<span class="dot"></span> CHECKPOINT SECURED';
    } else {
      el.classList.remove('active');
      el.innerHTML = '<span class="dot"></span> CHECKPOINT —';
    }
  }

  setCores(n, total = 3) {
    $('hud-cores').textContent = `${n} / ${total}`;
  }

  setEnergy(value) {
    const v = Math.max(0, Math.min(100, value));
    const fill = $('energy-fill');
    fill.style.width = `${v}%`;
    fill.classList.toggle('low', v < 24);
    $('energy-value').textContent = `${Math.round(v)}%`;
    $('energy-panel').classList.toggle('is-rewinding', this.game && this.game.rewinding);
    const touch = document.body.classList.contains('touch');
    let hint = v < 8
      ? '<span style="color:var(--danger)">ENERGY DEPLETED — FIND A CELL</span>'
      : touch ? 'HOLD <b>REWIND</b> TO REVERSE TIME' : 'HOLD <kbd>R</kbd> / <kbd>SHIFT</kbd> TO REWIND';
    if (this.game && this.game.echoTimer > 0) {
      hint = `<span style="color:var(--gold)">ECHO WINDOW</span> · ${this.game.echoTimer.toFixed(1)}s`;
    }
    if (hint !== this.lastEnergyHint) {
      $('energy-hint').innerHTML = hint;
      this.lastEnergyHint = hint;
    }
  }

  setRewinding(active) {
    this.hud.classList.toggle('rewinding', active);
    if ($('energy-panel')) $('energy-panel').classList.toggle('is-rewinding', active);
  }

  setRewindSeconds(text) {
    $('rewind-seconds').textContent = text;
  }

  updateTimer(seconds) {
    $('hud-timer').textContent = formatTime(seconds);
  }

  showHint(html, duration = 6200) {
    clearTimeout(this.hintTimer);
    this.hintText.innerHTML = html;
    this.hint.classList.remove('is-hidden');
    requestAnimationFrame(() => this.hint.classList.add('show'));
    this.hintTimer = setTimeout(() => this.hideHint(), duration);
  }

  hideHint() {
    this.hint.classList.remove('show');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.hint.classList.add('is-hidden'), 400);
  }

  showToast(kicker, text, duration = 2800) {
    clearTimeout(this.toastTimer);
    this.toastKicker.textContent = kicker;
    this.toastText.textContent = text;
    this.toast.classList.remove('is-hidden');
    requestAnimationFrame(() => this.toast.classList.add('show'));
    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('show');
      setTimeout(() => this.toast.classList.add('is-hidden'), 300);
    }, duration);
  }

  showIntro(level) {
    clearTimeout(this.introTimer);
    this.intro.classList.add('is-hidden');
    $('intro-kicker').textContent = level.introKicker;
    $('intro-name').textContent = level.name;
    $('intro-sub').textContent = level.sub;
    // force CSS animation restart
    void this.intro.offsetWidth;
    this.intro.classList.remove('is-hidden');
    this.intro.classList.remove('show');
    void this.intro.offsetWidth;
    this.intro.classList.add('show');
    this.introTimer = setTimeout(() => this.intro.classList.add('is-hidden'), 4000);
  }

  showDeath(energy, maxWait) {
    $('death-energy').textContent = `${Math.round(energy)}%`;
    this.death.classList.remove('is-hidden');
    requestAnimationFrame(() => this.death.classList.add('show'));
    this.deathBar.style.transform = `scaleX(1)`;
    this.death.dataset.maxWait = String(maxWait);
  }

  updateDeath(remaining, maxWait) {
    this.deathBar.style.transform = `scaleX(${Math.max(0, Math.min(1, remaining / maxWait))})`;
  }

  hideDeath() {
    this.death.classList.remove('show');
    this.death.classList.add('is-hidden');
  }

  showPause(data) {
    $('pause-sector').textContent = data.number;
    $('pause-time').textContent = formatTime(data.time).slice(0, 5);
    $('pause-cores').textContent = `${data.cores}/3`;
    this.show('pause');
  }

  showComplete(data) {
    this.hud.classList.add('is-hidden');
    $('complete-kicker').textContent = data.final ? 'FINAL SECTOR RESTORED' : 'TEMPORAL PATHWAY SECURED';
    $('complete-title').textContent = data.final ? 'TIMELINE RESTORED' : 'SECTOR CLEAR';
    $('complete-name').textContent = data.level.name;
    $('result-time').textContent = formatTime(data.time);
    $('result-deaths').textContent = String(data.deaths);
    $('result-cores').textContent = `${data.cores}/${data.totalCores}`;
    const best = $('result-best');
    best.textContent = data.newRecord ? 'NEW RECORD' : `BEST ${formatTime(data.bestTime)}`;
    best.className = data.newRecord ? 'record' : '';
    const stars = document.querySelectorAll('#result-stars i');
    stars.forEach((s, i) => s.classList.toggle('on', i < data.stars));
    const next = $('btn-next');
    next.querySelector('.btn-label').textContent = data.final ? 'SECTOR SELECT' : 'NEXT SECTOR';
    $('campaign-complete').classList.toggle('is-hidden', !data.final);
    this.show('complete');
  }

  hideComplete() {
    this.screens.complete.classList.add('is-hidden');
    this.current = 'game';
  }

  renderLevels(save) {
    const grid = $('level-grid');
    const unlocked = Math.max(1, save.unlocked || 1);
    const completed = save.completed || {};
    grid.innerHTML = LEVELS.map((level, i) => {
      const locked = i >= unlocked;
      const rec = completed[level.id];
      const stars = rec ? rec.stars : 0;
      const palette = level.palette;
      const cores = rec ? rec.cores : 0;
      return `
        <button class="level-card ${locked ? 'locked' : ''} ${rec ? 'complete' : ''}" data-index="${i}" ${locked ? 'aria-disabled="true"' : ''} style="--card-accent:${palette.accent};--card-glow:${hexA(palette.accent, .16)}">
          <div class="card-art">
            <span class="card-badge ${rec ? 'done' : ''}">${rec ? 'RESTORED' : locked ? 'SEALED' : 'OPEN'}</span>
            <span class="card-num">${level.number}</span>
          </div>
          <div class="card-body">
            <span class="card-kicker">${level.tag}</span>
            <span class="card-name">${level.name}</span>
            <div class="card-stats">
              <span>${rec ? formatTime(rec.time).slice(0, 6) : '— : —'}</span>
              <span class="card-stars">${[0, 1, 2].map(n => `<i class="${n < stars ? 'on' : ''}"></i>`).join('')}</span>
            </div>
            <span class="card-arrow">→</span>
          </div>
        </button>`;
    }).join('');
    $('sector-progress').textContent = `${unlocked} / ${LEVELS.length} UNLOCKED`;
    $('sector-cores').textContent = `${save.totalCores || 0} / ${TOTAL_CORES} CORES`;
  }

  refreshSettings(save) {
    $('save-unlocked').textContent = String(Math.max(1, save.unlocked || 1));
    $('save-cores').textContent = String(save.totalCores || 0);
    $('save-runs').textContent = String(Object.keys(save.completed || {}).length);
    const audio = $('toggle-audio');
    audio.setAttribute('aria-checked', String(save.settings.audio));
    audio.querySelector('span').textContent = save.settings.audio ? 'ON' : 'OFF';
    const motion = $('toggle-motion');
    motion.setAttribute('aria-checked', String(save.settings.reducedMotion));
    motion.querySelector('span').textContent = save.settings.reducedMotion ? 'ON' : 'OFF';
    const fx = $('toggle-fx');
    fx.setAttribute('aria-checked', String(save.settings.screenFx));
    fx.querySelector('span').textContent = save.settings.screenFx ? 'ON' : 'OFF';
    this.setMute(!save.settings.audio);
  }

  setMute(muted, force = false) {
    $('hud-mute').classList.toggle('muted', muted);
    const audioToggle = $('toggle-audio');
    if (force || audioToggle) {
      audioToggle?.setAttribute('aria-checked', String(!muted));
      const label = audioToggle?.querySelector('span');
      if (label) label.textContent = muted ? 'OFF' : 'ON';
    }
  }

  updateHud(state) {
    this.setEnergy(state.energy);
    this.updateTimer(state.time);
    this.setCores(state.cores, state.totalCores);
    if (state.checkpoint !== this.lastCheckpoint) {
      this.setCheckpoint(state.checkpoint);
      this.lastCheckpoint = state.checkpoint;
    }
    if (state.rewinding) {
      this.setRewindSeconds(`−${state.rewindSeconds.toFixed(2)}s`);
    }
  }

  showLevels(save) {
    this.renderLevels(save);
    this.show('levels');
  }
}

export function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
