// SHADOW NINJA — DOM HUD, menus, banners, overlays

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const $ = (id) => document.getElementById(id);
const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(7, '0');

function timeText(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class UI {
  constructor(game, sound) {
    this.game = game;
    this.sound = sound;
    this.lastCombo = 0;
    this.bannerTimer = null;
    this.last = {};

    this.el = {
      hud: $('hud'),
      healthFill: $('health-fill'),
      healthText: $('health-text'),
      focusFill: $('focus-fill'),
      focusText: $('focus-text'),
      focusBar: $('focus-bar'),
      dashFill: $('dash-fill'),
      dashState: $('dash-state'),
      score: $('score'),
      best: $('best'),
      waveLabel: $('wave-label'),
      combo: $('combo'),
      comboCount: $('combo-count'),
      comboMult: $('combo-mult'),
      bossBar: $('boss-bar'),
      bossFill: $('boss-fill'),
      bossName: $('boss-name'),
      bossKicker: $('boss-kicker'),
      banner: $('banner'),
      bannerKicker: $('banner-kicker'),
      bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'),
      hints: $('hints'),
      damage: $('damage-flash'),
      menu: $('menu-screen'),
      pause: $('pause-screen'),
      over: $('gameover-screen'),
      victory: $('victory-screen'),
      menuBest: $('menu-best'),
      pauseKicker: $('pause-kicker'),
      pauseWave: $('pause-wave'),
      pauseScore: $('pause-score'),
      pauseCombo: $('pause-combo'),
      bootFlash: $('boot-flash'),
    };
    this.screens = [this.el.menu, this.el.pause, this.el.over, this.el.victory];

    this.bind();
    this.syncMute();
  }

  bind() {
    const g = this.game;
    const unlock = () => this.sound.unlock();

    const start = $('start-btn');
    start?.addEventListener('click', () => {
      unlock();
      this.sound.sfx('click');
      this.bootFlash();
      g.startGame();
      start.blur();
    });

    $('resume-btn')?.addEventListener('click', () => { unlock(); g.resume(); });
    $('pause-restart-btn')?.addEventListener('click', () => { unlock(); g.restart(); });
    $('pause-menu-btn')?.addEventListener('click', () => { unlock(); g.quitToMenu(); });
    $('retry-btn')?.addEventListener('click', () => { unlock(); g.restart(); });
    $('over-menu-btn')?.addEventListener('click', () => { unlock(); g.quitToMenu(); });
    $('victory-again-btn')?.addEventListener('click', () => { unlock(); g.restart(); });
    $('victory-menu-btn')?.addEventListener('click', () => { unlock(); g.quitToMenu(); });
    $('pause-btn')?.addEventListener('click', () => { unlock(); g.togglePause(); });

    document.querySelectorAll('[data-mute]').forEach((btn) => {
      btn.addEventListener('click', () => {
        unlock();
        this.toggleMute();
      });
    });
  }

  bootFlash() {
    const el = this.el.bootFlash;
    if (!el) return;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }

  toggleMute() {
    this.sound.unlock();
    this.sound.toggleMute();
    this.syncMute();
    if (!this.sound.muted) this.sound.sfx('click');
  }

  syncMute() {
    document.body.classList.toggle('muted', this.sound.muted);
    document.querySelectorAll('[data-mute]').forEach((b) => {
      b.setAttribute('aria-pressed', String(this.sound.muted));
      b.title = this.sound.muted ? 'Unmute (M)' : 'Mute (M)';
    });
  }

  hideScreens() {
    for (const s of this.screens) s.classList.remove('active');
    document.body.classList.remove('paused', 'over', 'victory');
  }

  showMenu() {
    this.hideScreens();
    this.el.menu.classList.add('active');
    this.el.hud.classList.remove('visible');
    document.body.classList.remove('playing', 'paused', 'over', 'victory');
    this.el.bossBar.classList.remove('visible', 'dead', 'phase2', 'phase3');
    this.el.combo.classList.remove('show', 'high', 'insane');
    this.hideHints();
    this.hideBanner();
    this.updateBest(this.game.best);
  }

  showPlaying() {
    this.hideScreens();
    this.el.hud.classList.add('visible');
    document.body.classList.add('playing');
    this.el.bossBar.classList.remove('visible', 'dead', 'phase2', 'phase3');
    this.el.combo.classList.remove('show', 'high', 'insane');
    this.hideBanner();
    this.hideHints();
  }

  showPause(auto = false) {
    this.el.pause.classList.add('active');
    document.body.classList.add('paused');
    this.el.pauseKicker.textContent = auto ? 'THE NIGHT WAITS · PAUSED' : 'THE NIGHT HOLDS ITS BREATH';
    this.el.pauseWave.textContent = this.game.wave >= 6 ? 'SHOGUN' : ROMAN[this.game.wave] || 'I';
    this.el.pauseScore.textContent = pad(this.game.score);
    this.el.pauseCombo.textContent = String(this.game.maxCombo);
  }

  showGameOver(stats) {
    this.hideScreens();
    this.fillStats('over', stats);
    $('over-record').classList.toggle('show', !!stats.newBest && stats.score > 0);
    this.el.over.classList.add('active');
    document.body.classList.add('over');
    document.body.classList.remove('playing');
    this.hideHints();
  }

  showVictory(stats) {
    this.hideScreens();
    this.fillStats('vic', stats);
    $('vic-record').classList.toggle('show', !!stats.newBest && stats.score > 0);
    this.el.victory.classList.add('active');
    document.body.classList.add('victory');
    document.body.classList.remove('playing');
    this.hideHints();
  }

  fillStats(prefix, stats) {
    const waveText = stats.wave >= 6 ? (stats.boss ? 'THE SHOGUN' : 'VI') : ROMAN[stats.wave] || 'I';
    const fields = {
      score: pad(stats.score),
      wave: waveText,
      kills: String(stats.kills),
      combo: String(stats.maxCombo),
      time: timeText(stats.time),
      best: pad(stats.best),
    };
    for (const [key, value] of Object.entries(fields)) {
      const el = $(`${prefix}-${key}`);
      if (el) el.textContent = value;
    }
  }

  updateBest(best) {
    this.el.best.textContent = pad(best);
    this.el.menuBest.textContent = pad(best);
  }

  update(game) {
    const p = game.player;
    const hp = Math.max(0, Math.round(p.health));
    const hpPct = Math.max(0, Math.min(100, (hp / p.maxHealth) * 100));
    if (this.last.hp !== hpPct) {
      this.el.healthFill.style.width = `${hpPct}%`;
      this.el.healthText.textContent = String(hp);
      this.last.hp = hpPct;
    }
    const focus = Math.round(p.focus);
    if (this.last.focus !== focus) {
      this.el.focusFill.style.width = `${(focus / p.maxFocus) * 100}%`;
      this.el.focusText.textContent = String(focus);
      this.last.focus = focus;
      this.el.focusBar.classList.toggle('ready', focus >= p.maxFocus);
      document.body.classList.toggle('focus-ready', focus >= p.maxFocus);
    }

    const dashReady = p.dashCd <= 0.001;
    const dashRatio = dashReady ? 1 : 1 - Math.min(1, p.dashCd / 0.62);
    this.el.dashFill.style.transform = `scaleX(${dashRatio.toFixed(3)})`;
    this.el.dashState.textContent = dashReady ? 'READY' : 'COOLING';
    this.el.dashState.classList.toggle('cooling', !dashReady);

    if (this.last.score !== game.score) {
      this.el.score.textContent = pad(game.score);
      this.last.score = game.score;
    }
    if (this.last.best !== game.best) {
      this.el.best.textContent = pad(game.best);
      this.last.best = game.best;
    }

    const waveText = game.wave >= 6 ? 'FINAL DUEL' : `WAVE ${ROMAN[game.wave] || 'I'}`;
    if (this.last.waveText !== waveText) {
      this.el.waveLabel.textContent = waveText;
      this.el.waveLabel.classList.toggle('boss', game.wave >= 6);
      this.last.waveText = waveText;
    }

    if (game.boss) {
      this.el.bossBar.classList.add('visible');
      const pct = Math.max(0, (game.boss.hp / game.boss.maxHp) * 100);
      this.el.bossFill.style.width = `${pct}%`;
      this.el.bossBar.classList.toggle('phase2', game.boss.phase === 2);
      this.el.bossBar.classList.toggle('phase3', game.boss.phase === 3);
      this.el.bossBar.classList.toggle('dead', game.boss.dead);
      if (this.last.bossPhase !== game.boss.phase) {
        this.el.bossName.innerHTML = game.boss.dead
          ? 'KAGEMASA <em>·</em> FALLEN'
          : `KAGEMASA <em>·</em> ONI SHOGUN`;
        this.last.bossPhase = game.boss.phase;
      }
    } else if (this.el.bossBar.classList.contains('visible')) {
      this.el.bossBar.classList.remove('visible', 'dead', 'phase2', 'phase3');
    }

    if (game.combo >= 2 && (game.state === 'playing' || game.state === 'paused')) {
      this.el.combo.classList.add('show');
      if (this.last.combo !== game.combo) {
        this.el.comboCount.textContent = String(game.combo);
        this.el.comboMult.textContent = `×${game.multiplier.toFixed(1)}`;
        this.el.combo.classList.remove('pop');
        void this.el.combo.offsetWidth;
        this.el.combo.classList.add('pop');
        this.el.combo.classList.toggle('high', game.combo >= 10);
        this.el.combo.classList.toggle('insane', game.combo >= 20);
        this.last.combo = game.combo;
      }
    } else {
      this.el.combo.classList.remove('show');
    }
  }

  banner(kicker, title, sub, kind = 'wave') {
    const b = this.el.banner;
    this.el.bannerKicker.textContent = kicker;
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub;
    b.className = `banner show ${kind}`;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.hideBanner(), kind === 'boss' ? 3200 : 2700);
  }

  hideBanner() {
    this.el.banner.classList.remove('show');
    clearTimeout(this.bannerTimer);
  }

  showHints(mobile) {
    this.el.hints.innerHTML = mobile
      ? `<span>DASH THROUGH ARROWS TO PARRY</span><span>·</span><span>FILL FOCUS · UNLEASH BURST</span>`
      : `<span><kbd>A</kbd><kbd>D</kbd> MOVE</span>
         <span><kbd>SPACE</kbd> JUMP ×2</span>
         <span><kbd>J</kbd> ATTACK</span>
         <span><kbd>K</kbd> DASH</span>
         <span><kbd>L</kbd> BURST</span>`;
    this.el.hints.classList.add('show');
  }

  hideHints() {
    this.el.hints.classList.remove('show');
  }

  damageFlash() {
    const d = this.el.damage;
    d.classList.remove('hit');
    void d.offsetWidth;
    d.classList.add('hit');
  }
}
