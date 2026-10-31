const WAVE_SUBTITLES = {
  1: "THE PRESENT",
  2: "THE PRESENT RESISTS",
  3: "INTEREST ACCRUES",
  4: "COLLECTION NOTICE",
  5: "THE AUDITOR",
};

const formatScore = (value) => Math.round(value).toLocaleString("en-US");

export class UI {
  constructor() {
    const byId = (id) => document.getElementById(id);
    this.el = {
      hud: byId("hud"),
      hpnum: byId("hpnum"),
      hpfill: byId("hpfill"),
      wavenum: byId("wavenum"),
      wavesub: byId("wavesub"),
      score: byId("score"),
      stolen: byId("stolen"),
      debtlabel: byId("debtlabel"),
      debtcaption: byId("debtcaption"),
      timeline: byId("timeline"),
      motes: byId("motes"),
      future: document.querySelector(".future"),
      combo: byId("combo"),
      combomult: byId("combomult"),
      bossbar: byId("bossbar"),
      bossfill: byId("bossfill"),
      bossphase: byId("bossphase"),
      hint: byId("hint"),
      touch: byId("touch"),
      btnSlow: byId("btn-slow"),
      btnDash: byId("btn-dash"),
      slowwash: byId("slowwash"),
      damagewash: byId("damagewash"),
      title: byId("title"),
      bestScore: byId("best-score"),
      pause: byId("pause"),
      gameover: byId("gameover"),
      endKicker: byId("end-kicker"),
      endTitle: byId("end-title"),
      endCopy: byId("end-copy"),
      statTime: byId("stat-time"),
      statWave: byId("stat-wave"),
      statDebt: byId("stat-debt"),
      statCollectors: byId("stat-collectors"),
      statScore: byId("stat-score"),
      statBest: byId("stat-best"),
      endBest: byId("end-best"),
      endcard: document.querySelector(".endcard"),
      audioBtn: byId("btn-audio"),
      pauseMute: byId("btn-pause-mute"),
      banner: byId("banner"),
      bannerTitle: byId("banner-title"),
      bannerSub: byId("banner-sub"),
      toasts: byId("toasts"),
    };

    this.moteEls = new Map();
    this.toastEls = [];
    this.last = Object.create(null);
    this.bannerTimer = 0;
    this.titleTimer = 0;
    this.touchMode = false;
    this.hintShownAt = 0;
    this.state = "title";
  }

  setText(key, value) {
    if (this.last[key] === value) return;
    this.last[key] = value;
    if (this.el[key]) this.el[key].textContent = value;
  }

  setTouchMode(enabled) {
    this.touchMode = enabled;
    document.body.classList.toggle("touch-mode", enabled);
  }

  setPlaying(playing) {
    this.state = playing ? "playing" : this.state;
    this.el.hud.classList.toggle("is-hidden", !playing);
    this.el.touch.classList.toggle("is-hidden", !(playing && this.touchMode));
    this.el.hint.classList.toggle("is-hidden", !(playing && !this.touchMode));
    if (playing) {
      this.hintShownAt = performance.now();
      this.el.hint.classList.remove("faded");
    }
  }

  hideHud() {
    this.el.hud.classList.add("is-hidden");
    this.el.touch.classList.add("is-hidden");
    this.el.hint.classList.add("is-hidden");
  }

  showTitle() {
    clearTimeout(this.titleTimer);
    this.el.title.classList.remove("is-hidden", "fade-out");
    this.state = "title";
    this.el.gameover.classList.add("is-hidden");
    this.el.pause.classList.add("is-hidden");
    this.hideHud();
    this.clearMotes();
    this.clearToasts();
    this.el.combo.classList.remove("show");
    this.el.bossbar.classList.add("is-hidden");
  }

  hideTitle() {
    if (this.el.title.classList.contains("is-hidden")) return;
    this.el.title.classList.add("fade-out");
    clearTimeout(this.titleTimer);
    this.titleTimer = setTimeout(() => {
      this.el.title.classList.add("is-hidden");
      this.el.title.classList.remove("fade-out");
    }, 430);
  }

  showPause() {
    this.el.pause.classList.remove("is-hidden");
  }

  hidePause() {
    this.el.pause.classList.add("is-hidden");
  }

  showEnd({ victory, stats, best, previousBest, touchMode }) {
    this.state = "end";
    this.hideHud();
    this.el.pause.classList.add("is-hidden");
    this.el.endcard.classList.toggle("win", victory);
    this.setText("endKicker", victory ? "AUDIT FAILED" : "DEBT COLLECTED");
    this.el.endKicker.textContent = victory ? "AUDIT FAILED" : "DEBT COLLECTED";
    this.el.endTitle.innerHTML = victory ? "DEBT<br />SETTLED" : "THE FUTURE<br />COLLECTED";
    this.el.endCopy.textContent = victory
      ? `The Auditor falls. You borrowed ${stats.borrowed.toFixed(1)} seconds and paid them back in full.`
      : `You borrowed ${stats.borrowed.toFixed(1)} seconds. The future took the rest.`;
    const seconds = Math.max(0, Math.floor(stats.time || 0));
    this.el.statTime.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    this.el.statWave.textContent = String(stats.wave || 1).padStart(2, "0");
    this.el.statDebt.textContent = `${(stats.borrowed || 0).toFixed(1)}s`;
    this.el.statCollectors.textContent = String(stats.collectorsFaced || 0);
    this.el.statScore.textContent = formatScore(stats.score || 0);
    this.el.statBest.textContent = formatScore(best || 0);
    const isBest = (stats.score || 0) > (previousBest || 0);
    this.el.endBest.classList.toggle("is-hidden", !isBest);
    this.el.gameover.classList.remove("is-hidden");
    this.setTouchMode(touchMode);
    const focusTarget = document.getElementById("btn-again");
    setTimeout(() => focusTarget?.focus({ preventScroll: true }), 60);
  }

  hideEnd() {
    this.el.gameover.classList.add("is-hidden");
  }

  setBest(best) {
    this.el.bestScore.textContent = formatScore(best || 0);
  }

  setMuted(muted) {
    this.el.audioBtn.classList.toggle("muted", muted);
    this.el.audioBtn.querySelector(".audio-glyph").textContent = muted ? "◌" : "◉";
    this.el.audioBtn.setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio");
    this.el.pauseMute.textContent = muted ? "Sound: Off" : "Sound: On";
  }

  update(game, paused = false) {
    if (this.el.hud.classList.contains("is-hidden")) {
      if (paused) return;
      return;
    }
    const hp = Math.max(0, game.player.hp);
    const hpPercent = Math.max(0, Math.min(100, (hp / game.player.maxHp) * 100));
    this.el.hpfill.style.width = `${hpPercent}%`;
    this.el.hpfill.classList.toggle("low", hp <= 30);
    this.el.hpnum.textContent = String(Math.ceil(hp));
    this.el.hpnum.classList.toggle("low", hp <= 30);

    this.setText("score", formatScore(game.score));
    this.setText("stolen", (game.stolen || 0).toFixed(1));
    this.setText("wavenum", String(game.wave).padStart(2, "0"));
    this.setText("wavesub", WAVE_SUBTITLES[game.wave] || "THE LOOP");

    const pending = game.debt.length;
    const activeCollectors = game.enemies.reduce(
      (total, enemy) => total + (enemy.type === "collector" && enemy.alive ? 1 : 0),
      0
    );
    const ready = game.debt.some((mote) => mote.fuse <= 0);
    const hot = pending > 0 || activeCollectors > 0;
    this.el.future.classList.toggle("damage", false);
    this.el.future.classList.toggle("danger", pending >= 3 || activeCollectors > 0);
    this.el.debtlabel.classList.toggle("hot", hot);
    this.setText("debtlabel", pending > 0 ? `${pending} PENDING` : "CLEAR");

    if (ready) this.setText("debtcaption", "COLLECTION OVERDUE · THE FUTURE IS QUEUED");
    else if (pending > 0) {
      const next = Math.min(...game.debt.map((mote) => mote.fuse));
      this.setText("debtcaption", `NEXT COLLECTION IN ${next.toFixed(1)}s`);
    } else if (activeCollectors > 0) {
      this.setText("debtcaption", `${activeCollectors} COLLECTOR${activeCollectors === 1 ? "" : "S"} IN THE ARENA`);
    } else {
      this.setText("debtcaption", "EVERY SECOND YOU STEAL ARRIVES HERE");
    }

    this.syncMotes(game.debt);

    if (game.combo >= 2) {
      this.el.combo.classList.add("show");
      this.setText("combomult", `×${game.comboMultiplier.toFixed(1)}`);
    } else {
      this.el.combo.classList.remove("show");
    }

    if (game.boss && !game.boss.dead) {
      this.el.bossbar.classList.remove("is-hidden");
      const ratio = Math.max(0, game.boss.hp / game.boss.maxHp);
      this.el.bossfill.style.width = `${ratio * 100}%`;
      this.setText("bossphase", game.boss.phase === 2 ? "PHASE II" : "PHASE I");
    } else {
      this.el.bossbar.classList.add("is-hidden");
    }

    this.el.slowwash.classList.toggle("on", game.timeScale < 0.72);
    const damageAlpha = Math.min(0.9, game.flash * 0.9);
    this.el.damagewash.style.opacity = String(damageAlpha);
    this.el.touch.classList.toggle("is-hidden", !(this.touchMode && !paused));

    if (this.touchMode) {
      this.el.btnSlow.classList.toggle("held", Boolean(game.input.slow) && game.status === "playing" && !paused);
      const cooldown = game.player.dashCd;
      this.el.btnDash.classList.toggle("cooling", cooldown > 0);
      const small = this.el.btnDash.querySelector("small");
      small.textContent = cooldown > 0 ? `${cooldown.toFixed(1)}s` : "READY";
    }

    if (this.el.hint.classList.contains("is-hidden") === false) {
      const age = performance.now() - this.hintShownAt;
      if (age > 12000) this.el.hint.classList.add("faded");
    }
  }

  syncMotes(debts) {
    const seen = new Set();
    for (const mote of debts) {
      seen.add(mote.id);
      let element = this.moteEls.get(mote.id);
      if (!element) {
        element = document.createElement("i");
        element.className = "mote";
        element.style.left = "100%";
        this.el.motes.appendChild(element);
        this.moteEls.set(mote.id, element);
      }
      const ratio = Math.max(0, Math.min(1, mote.fuse / 9));
      element.style.left = `${(1 - ratio) * 100}%`;
      element.classList.toggle("overdue", mote.fuse <= 0);
    }
    for (const [id, element] of this.moteEls) {
      if (!seen.has(id)) {
        element.remove();
        this.moteEls.delete(id);
      }
    }
  }

  clearMotes() {
    for (const element of this.moteEls.values()) element.remove();
    this.moteEls.clear();
    this.el.motes.innerHTML = "";
  }

  banner(title, sub) {
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub || "";
    this.el.banner.classList.remove("show");
    void this.el.banner.offsetWidth;
    this.el.banner.classList.add("show");
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.el.banner.classList.remove("show");
    }, 2400);
  }

  toast(text, tone = "") {
    if (!text) return;
    const element = document.createElement("div");
    element.className = `toast ${tone}`.trim();
    element.textContent = text;
    this.el.toasts.appendChild(element);
    this.toastEls.push(element);
    while (this.toastEls.length > 3) {
      const old = this.toastEls.shift();
      old.remove();
    }
    setTimeout(() => {
      element.classList.add("out");
      setTimeout(() => element.remove(), 340);
    }, 3200);
  }

  clearToasts() {
    for (const element of this.toastEls) element.remove();
    this.toastEls = [];
    this.el.toasts.innerHTML = "";
  }

  resetRun() {
    this.last = Object.create(null);
    this.clearMotes();
    this.clearToasts();
    this.el.combo.classList.remove("show");
    this.el.bossbar.classList.add("is-hidden");
    this.el.damagewash.style.opacity = "0";
    this.el.slowwash.classList.remove("on");
    this.el.hint.classList.remove("faded");
    this.el.gameover.classList.add("is-hidden");
    this.el.pause.classList.add("is-hidden");
    this.el.endBest.classList.add("is-hidden");
  }
}
