const PIECE_SVG = {
  wall: `<svg viewBox="0 0 20 14" width="18" height="13" fill="none"><rect x="1.2" y="1.2" width="17.6" height="11.6" rx="1.6" fill="currentColor" opacity=".85"/><path d="M1.2 4.8h17.6M1.2 9.2h17.6M6.7 1.2v11.6M13.3 1.2v11.6" stroke="rgba(8,14,24,.35)" stroke-width="1"/></svg>`,
  ramp: `<svg viewBox="0 0 20 14" width="18" height="13" fill="none"><path d="M1 13h18V1L1 13Z" fill="currentColor" opacity=".85"/><path d="M4 11.6 15.4 3M7.2 12.4 18 5" stroke="rgba(8,14,24,.3)" stroke-width="1"/></svg>`,
  floor: `<svg viewBox="0 0 20 14" width="18" height="13" fill="none"><rect x="1" y="4" width="18" height="5" rx="1.4" fill="currentColor" opacity=".85"/><path d="M3 9v4M17 9v4" stroke="currentColor" stroke-width="1.4" opacity=".55"/><path d="M1 6h18" stroke="rgba(8,14,24,.3)" stroke-width="1"/></svg>`,
};

const MAT_NAMES = { wood: "WOOD", brick: "BRICK", metal: "METAL" };
const PIECE_NAMES = { wall: "WALL", ramp: "RAMP", floor: "FLOOR" };
const PIECE_KEYS = { wall: "Q", ramp: "E", floor: "F" };

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export class Hud {
  constructor(handlers) {
    this.handlers = handlers;
    this.el = {
      hud: document.getElementById("hud"),
      blueList: document.getElementById("blueList"),
      redList: document.getElementById("redList"),
      blueTag: document.getElementById("blueTag"),
      redTag: document.getElementById("redTag"),
      windFill: document.getElementById("windFill"),
      windValue: document.getElementById("windValue"),
      turnLabel: document.getElementById("turnLabel"),
      toast: document.getElementById("toast"),
      buildBanner: document.getElementById("buildBanner"),
      buildHint: document.getElementById("buildHint"),
      buildPieceTag: document.getElementById("buildPieceTag"),
      reaction: document.getElementById("reaction"),
      reactionBtn: document.getElementById("reactionBtn"),
      reactionCost: document.getElementById("reactionCost"),
      hintText: document.getElementById("hintText"),
      activeName: document.getElementById("activeName"),
      activeTeam: document.getElementById("activeTeam"),
      activeHpBar: document.getElementById("activeHpBar"),
      activeHpText: document.getElementById("activeHpText"),
      activeMoveBar: document.getElementById("activeMoveBar"),
      activeMoveText: document.getElementById("activeMoveText"),
      wormAvatar: document.getElementById("wormAvatar"),
      weaponBtns: document.getElementById("weaponBtns"),
      matBtns: document.getElementById("matBtns"),
      pieceBtns: document.getElementById("pieceBtns"),
      buildToggle: document.getElementById("buildToggle"),
      muteBtn: document.getElementById("muteBtn"),
      helpBtn: document.getElementById("helpBtn"),
    };
    this.toastTimer = null;
    this.buildDock();
    this.bind();
  }

  buildDock() {
    this.el.weaponBtns.innerHTML = `
      <button class="dock-btn weapon" data-weapon="bazooka">
        <span class="key">Z</span><span class="lbl">BAZOOKA</span><span class="sub" data-ammo="bazooka">∞</span>
      </button>
      <button class="dock-btn weapon" data-weapon="grenade">
        <span class="key">X</span><span class="lbl">GRENADE</span><span class="sub" data-ammo="grenade">3</span>
      </button>`;
    this.el.matBtns.innerHTML = ["wood", "brick", "metal"]
      .map((m, i) => `
        <button class="dock-btn mat" data-mat="${m}">
          <span class="key">${i + 1}</span><span class="swatch ${m}"></span><span class="lbl">${MAT_NAMES[m]}</span><span class="sub" data-mat-count="${m}">0</span>
        </button>`).join("");
    this.el.pieceBtns.innerHTML = ["wall", "ramp", "floor"]
      .map((p) => `
        <button class="dock-btn piece" data-piece="${p}">
          <span class="key">${PIECE_KEYS[p]}</span><span class="piece-ico">${PIECE_SVG[p]}</span><span class="lbl">${PIECE_NAMES[p]}</span><span class="sub" data-piece-cost="${p}">15</span>
        </button>`).join("");
  }

  bind() {
    const h = this.handlers;
    this.el.weaponBtns.addEventListener("click", (e) => {
      const b = e.target.closest("[data-weapon]");
      if (b) h.weapon(b.dataset.weapon);
    });
    this.el.matBtns.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mat]");
      if (b) h.mat(b.dataset.mat);
    });
    this.el.pieceBtns.addEventListener("click", (e) => {
      const b = e.target.closest("[data-piece]");
      if (b) h.piece(b.dataset.piece);
    });
    this.el.buildToggle.addEventListener("click", () => h.buildToggle());
    this.el.reactionBtn.addEventListener("click", (e) => { e.stopPropagation(); h.reaction(); });
    this.el.muteBtn.addEventListener("click", () => h.mute());
    this.el.helpBtn.addEventListener("click", () => h.help());
  }

  show() {
    this.el.hud.classList.remove("is-hidden");
  }

  hide() {
    this.el.hud.classList.add("is-hidden");
  }

  toast(text, warn = false) {
    const el = this.el.toast;
    el.textContent = text;
    el.classList.toggle("warn", warn);
    el.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove("show"), 1900);
  }

  update(state) {
    this.updateTeams(state);
    this.updateTop(state);
    this.updateActive(state);
    this.updateDock(state);
    this.updateBuild(state);
    this.updateReaction(state);
    this.updateHint(state);
  }

  updateLive(state) {
    this.updateActive(state);
    this.updateHint(state);
  }

  updateTeams(state) {
    const render = (team, container) => {
      container.innerHTML = team.worms.map((w) => {
        const ratio = Math.max(0, w.hp / w.maxHp);
        const cls = ratio > 0.55 ? "" : ratio > 0.28 ? "low" : "crit";
        const active = state.active === w && w.alive;
        return `<div class="worm-row${active ? " active" : ""}${w.alive ? "" : " dead"}">
          <div class="w-face"><i></i></div>
          <div class="w-info">
            <div class="w-name">${esc(w.name)}</div>
            <div class="w-bar"><i class="${cls}" style="width:${ratio * 100}%"></i></div>
          </div>
          <div class="w-hp">${Math.ceil(w.hp)}</div>
        </div>`;
      }).join("");
    };
    render(state.teams[0], this.el.blueList);
    render(state.teams[1], this.el.redList);
  }

  updateTop(state) {
    const wind = Math.round(state.wind);
    const abs = Math.abs(wind);
    this.el.windValue.textContent = `${wind >= 0 ? "▶" : "◀"} ${abs}`;
    this.el.windFill.style.left = wind >= 0 ? "50%" : `${50 - abs / 2}%`;
    this.el.windFill.style.width = `${abs / 2}%`;

    this.el.blueTag.textContent = state.mode === "local" ? "P1" : "YOU";
    this.el.redTag.textContent = state.mode === "local" ? "P2" : "CPU";

    const team = state.teams[state.turnTeam];
    const human = state.mode === "local" || state.turnTeam === 0;
    let label = `TURN ${state.turn} · ${human ? (state.mode === "local" ? `${team.name}'S MOVE` : "YOUR MOVE") : "CPU THINKING"}`;
    if (state.phase === "flight") label = `TURN ${state.turn} · INCOMING!`;
    if (state.phase === "settle") label = `TURN ${state.turn} · RESOLVING`;
    this.el.turnLabel.textContent = label;
    this.el.turnLabel.className = `turn-label ${state.turnTeam === 0 ? "blue" : "red"}`;
  }

  updateActive(state) {
    const w = state.active;
    if (!w) return;
    this.el.activeName.textContent = w.name.toUpperCase();
    this.el.activeTeam.textContent = w.team === 0 ? "BLUE" : "RED";
    this.el.activeTeam.className = `worm-team${w.team === 1 ? " red" : ""}`;
    this.el.wormAvatar.classList.toggle("red", w.team === 1);
    const ratio = Math.max(0, w.hp / w.maxHp);
    const cls = ratio > 0.55 ? "" : ratio > 0.28 ? "low" : "crit";
    this.el.activeHpBar.style.width = `${ratio * 100}%`;
    this.el.activeHpBar.className = cls;
    this.el.activeHpText.textContent = `${Math.ceil(w.hp)} HP`;
    const move = Math.max(0, w.moveLeft);
    this.el.activeMoveBar.style.width = `${(move / w.maxMove) * 100}%`;
    this.el.activeMoveText.textContent = `MOVE ${Math.round(move)}`;
  }

  updateDock(state) {
    const w = state.active;
    const team = state.teams[state.turnTeam];
    this.el.weaponBtns.querySelectorAll("[data-weapon]").forEach((b) => {
      const id = b.dataset.weapon;
      b.classList.toggle("active", state.weapon === id);
      if (id === "grenade") {
        const ammo = w ? w.ammo.grenade : 0;
        b.querySelector('[data-ammo="grenade"]').textContent = ammo;
        b.classList.toggle("disabled", ammo <= 0);
      }
    });
    this.el.matBtns.querySelectorAll("[data-mat]").forEach((b) => {
      const m = b.dataset.mat;
      b.classList.toggle("active", state.selectedMat === m);
      b.querySelector(`[data-mat-count="${m}"]`).textContent = Math.floor(team.mats[m]);
    });
    this.el.pieceBtns.querySelectorAll("[data-piece]").forEach((b) => {
      const p = b.dataset.piece;
      b.classList.toggle("active", state.selectedPiece === p);
      const cost = state.costs[p][state.selectedMat];
      b.querySelector(`[data-piece-cost="${p}"]`).textContent = cost;
      b.classList.toggle("disabled", team.mats[state.selectedMat] < cost);
    });
    this.el.buildToggle.classList.toggle("active", state.buildMode);
    this.el.buildToggle.innerHTML = `<span class="key">B</span>${state.buildMode ? "EXIT" : "BUILD"}`;
    this.el.muteBtn.textContent = state.muted ? "🔇" : "🔊";
  }

  updateBuild(state) {
    this.el.buildBanner.classList.toggle("is-hidden", !state.buildMode);
    this.el.buildPieceTag.textContent = `${PIECE_NAMES[state.selectedPiece]} · ${MAT_NAMES[state.selectedMat]}`;
  }

  updateReaction(state) {
    const r = state.reaction;
    const show = r.available && (state.mode === "local" || r.team === 0);
    this.el.reaction.classList.toggle("is-hidden", !show);
    if (show) {
      this.el.reactionCost.textContent = `${r.cost} ${MAT_NAMES[r.mat]}`;
    }
  }

  updateHint(state) {
    let text = "Drag from your worm to aim. Release to fire.";
    if (state.buildMode) text = "Click or drag on the grid to place. B / Esc to exit.";
    else if (state.phase === "flight") {
      text = state.reaction.available ? "Incoming! Reaction-build with SPACE." : "Watch the shot…";
    } else if (state.phase === "settle") text = "Dust settling…";
    else if (state.mode === "cpu" && state.turnTeam === 1) text = "Red crew is lining up a shot…";
    else if (state.active && state.active.moveLeft <= 0) text = "Out of movement. Aim and fire, or build.";
    this.el.hintText.textContent = text;
  }
}
