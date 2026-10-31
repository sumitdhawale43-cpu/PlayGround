import { formatScore, formatTime, clamp } from "./util.js";

const ROMAN = ["I", "II", "III"];

export class UI {
  constructor(input, audio) {
    this.input = input;
    this.audio = audio;
    this.screens = {
      menu: document.getElementById("menu"),
      help: document.getElementById("help"),
      pause: document.getElementById("pause"),
      gameover: document.getElementById("gameover"),
      victory: document.getElementById("victory"),
    };
    this.current = "menu";
    this.hud = document.getElementById("hud");
    this.el = {
      healthFill: document.getElementById("health-fill"),
      healthText: document.getElementById("health-text"),
      energyFill: document.getElementById("energy-fill"),
      energyText: document.getElementById("energy-text"),
      healthBar: document.querySelector(".bar.health"),
      dashPips: Array.from(document.querySelectorAll("#dash-pips i")),
      score: document.getElementById("score"),
      orbCount: document.getElementById("orb-count"),
      combo: document.getElementById("combo"),
      comboNum: document.getElementById("combo-num"),
      bossHud: document.getElementById("boss-hud"),
      bossFill: document.getElementById("boss-fill"),
      bossPhase: document.getElementById("boss-phase"),
      bossName: document.getElementById("boss-name"),
      toast: document.getElementById("toast"),
      hint: document.getElementById("hint"),
      sector: document.getElementById("sector-card"),
      sectorTitle: document.getElementById("sector-title"),
      sectorSub: document.getElementById("sector-sub"),
      damageFlash: document.getElementById("damage-flash"),
      pauseScore: document.getElementById("pause-score"),
      pauseSector: document.getElementById("pause-sector"),
      pauseOrbs: document.getElementById("pause-orbs"),
      overScore: document.getElementById("over-score"),
      overOrbs: document.getElementById("over-orbs"),
      overCombo: document.getElementById("over-combo"),
      winScore: document.getElementById("win-score"),
      winTime: document.getElementById("win-time"),
      winCombo: document.getElementById("win-combo"),
    };
    this.cache = { health: -1, energy: -1, score: -1, orbs: -1, combo: -1, boss: -1, phase: -1, hiddenBoss: true };
    this.toastTimer = null;
    this.hintTimer = null;
    this.sectorTimer = null;
    this.screenTimers = [];
    this.syncSound();
  }

  showScreen(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      if (!el) continue;
      el.classList.toggle("active", key === name);
    }
    this.current = name;
    const inGame = name === "game";
    this.hud?.classList.toggle("hidden", !inGame);
    if (!inGame && name !== "pause") {
      this.hideBoss();
    }
    if (name === "game") {
      this.screens.menu?.classList.remove("active");
      this.screens.help?.classList.remove("active");
    }
    this.input.setTouchVisible(inGame);
  }

  resetHUD() {
    this.cache = { health: -1, energy: -1, score: -1, orbs: -1, combo: -1, boss: -1, phase: -1, hiddenBoss: true };
    this.hideBoss();
    this.el.combo?.classList.add("hidden");
    this.updateHUD(null, true);
  }

  updateHUD(game, force = false) {
    if (!game || !game.player) return;
    const p = game.player;
    const health = Math.round(p.health);
    const energy = Math.round(p.energy);
    if (force || health !== this.cache.health) {
      this.cache.health = health;
      const pct = clamp(health / p.maxHealth, 0, 1) * 100;
      this.el.healthFill.style.width = `${pct}%`;
      this.el.healthText.textContent = String(health);
      this.el.healthBar.classList.toggle("low", pct <= 30);
    }
    if (force || energy !== this.cache.energy) {
      this.cache.energy = energy;
      this.el.energyFill.style.width = `${clamp(energy / p.maxEnergy, 0, 1) * 100}%`;
      this.el.energyText.textContent = String(energy);
      const canDash = energy >= 20;
      this.el.dashPips[0]?.classList.toggle("on", canDash);
      this.el.dashPips[1]?.classList.toggle("on", canDash && p.airDash);
      this.el.dashPips[1]?.classList.toggle("cool", !p.airDash);
    }
    if (force || game.score !== this.cache.score) {
      this.cache.score = game.score;
      this.el.score.textContent = formatScore(game.score);
    }
    if (force || game.orbCount !== this.cache.orbs) {
      this.cache.orbs = game.orbCount;
      this.el.orbCount.textContent = String(game.orbCount);
    }
    const combo = game.combo >= 2 ? game.combo : 0;
    if (combo !== this.cache.combo) {
      this.cache.combo = combo;
      this.el.combo.classList.toggle("hidden", combo < 2);
      if (combo >= 2) {
        this.el.comboNum.textContent = `×${combo}`;
        this.el.combo.style.transform = `translateX(-50%) rotate(${combo > 8 ? -2 : 2}deg) scale(${1 + Math.min(0.25, combo * 0.015)})`;
      }
    }
    if (game.boss && !game.boss.dead) {
      if (this.cache.hiddenBoss) this.showBoss(game.boss);
      const hp = clamp(game.boss.health / game.boss.maxHealth, 0, 1) * 100;
      if (force || hp !== this.cache.boss) {
        this.cache.boss = hp;
        this.el.bossFill.style.width = `${hp}%`;
      }
      if (force || game.boss.phase !== this.cache.phase) {
        this.cache.phase = game.boss.phase;
        this.el.bossPhase.textContent = `PHASE ${ROMAN[game.boss.phase - 1]}`;
      }
    } else if (!game.boss && !this.cache.hiddenBoss) {
      this.hideBoss();
    }
  }

  toast(text, duration = 1800) {
    if (!this.el.toast) return;
    this.el.toast.textContent = text;
    this.el.toast.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.el.toast.classList.remove("show"), duration);
  }

  hint(text, duration = 5000) {
    if (!this.el.hint) return;
    clearTimeout(this.hintTimer);
    if (!text) {
      this.el.hint.classList.remove("show");
      return;
    }
    this.el.hint.textContent = text;
    this.el.hint.classList.add("show");
    if (duration > 0) this.hintTimer = setTimeout(() => this.el.hint.classList.remove("show"), duration);
  }

  showSector(zone) {
    if (!zone || !this.el.sector) return;
    this.el.sectorTitle.textContent = `${zone.label} · ${zone.name}`;
    this.el.sectorSub.textContent = zone.sub;
    this.el.sector.classList.add("show");
    clearTimeout(this.sectorTimer);
    this.sectorTimer = setTimeout(() => this.el.sector.classList.remove("show"), 3200);
  }

  flashDamage() {
    const el = this.el.damageFlash;
    if (!el) return;
    el.classList.add("on");
    clearTimeout(this._dmgTimer);
    this._dmgTimer = setTimeout(() => el.classList.remove("on"), 90);
  }

  showBoss(boss) {
    this.el.bossHud.classList.remove("hidden");
    this.hud?.classList.add("boss-fight");
    this.el.bossName.textContent = "ZERO";
    this.el.bossFill.style.width = `${(boss.health / boss.maxHealth) * 100}%`;
    this.el.bossPhase.textContent = "PHASE I";
    this.cache.hiddenBoss = false;
    this.cache.boss = -1;
    this.cache.phase = -1;
  }

  hideBoss() {
    this.el.bossHud?.classList.add("hidden");
    this.hud?.classList.remove("boss-fight");
    this.cache.hiddenBoss = true;
  }

  hideSector() {
    clearTimeout(this.sectorTimer);
    this.el.sector?.classList.remove("show");
  }

  setBossPhase(phase) {
    this.el.bossPhase.textContent = `PHASE ${ROMAN[phase - 1]}`;
  }

  updatePause(game) {
    this.el.pauseScore.textContent = formatScore(game.score);
    this.el.pauseSector.textContent = game.zone.label;
    this.el.pauseOrbs.textContent = String(game.orbCount);
  }

  showGameOver(game) {
    this.el.overScore.textContent = formatScore(game.score);
    this.el.overOrbs.textContent = String(game.orbCount);
    this.el.overCombo.textContent = String(game.maxCombo);
    this.showScreen("gameover");
  }

  showVictory(game) {
    this.el.winScore.textContent = formatScore(game.score);
    this.el.winTime.textContent = formatTime(game.elapsed);
    this.el.winCombo.textContent = String(game.maxCombo);
    this.showScreen("victory");
  }

  syncSound() {
    const on = !this.audio.muted;
    document.getElementById("btn-sound").textContent = on ? "♪" : "×";
    document.getElementById("btn-sound").title = on ? "Mute sound" : "Enable sound";
    document.getElementById("btn-sound-menu").textContent = `SOUND: ${on ? "ON" : "OFF"}`;
    document.getElementById("btn-pause-sound").textContent = `SOUND: ${on ? "ON" : "OFF"}`;
  }

  setTouchVisible(visible) {
    this.input.setTouchVisible(visible);
  }
}
