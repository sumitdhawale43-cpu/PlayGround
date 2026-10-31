import { Input } from "./input.js";
import { AudioEngine } from "./audio.js";
import { UI } from "./ui.js";
import { Game } from "./game.js";
import { formatScore } from "./util.js";

const canvas = document.getElementById("game");
const input = new Input(canvas);
const audio = new AudioEngine();
try { audio.muted = localStorage.getItem("shadowstrike.muted") === "1"; } catch {}
const ui = new UI(input, audio);
const game = new Game(canvas, input, audio, ui);

const STEP = 1 / 60;
let last = performance.now();
let accumulator = 0;
let running = true;

function startGame() {
  audio.init();
  audio.play("ui");
  document.activeElement?.blur?.();
  ui.hideBoss();
  game.startNewRun();
}

function togglePause() {
  if (game.mode === "playing") {
    game.pause();
  } else if (game.mode === "paused") {
    game.resume();
  }
}

function toggleSound() {
  audio.init();
  audio.toggle();
  ui.syncSound();
  if (!audio.muted) audio.play("ui");
}

function showHelp() {
  audio.init();
  audio.play("ui");
  ui.showScreen("help");
}

function quitToMenu() {
  game.enterMenu();
  updateBest();
  audio.play("ui");
}

function updateBest() {
  let best = 0;
  try { best = Number(localStorage.getItem("shadowstrike.best") || 0); } catch {}
  if (game.score > best) {
    best = game.score;
    try { localStorage.setItem("shadowstrike.best", String(best)); } catch {}
  }
  const el = document.querySelector(".build");
  if (el) el.textContent = `BEST ${formatScore(best)}  //  BUILD 07.31`;
}

game.onVictoryScreen = () => {
  updateBest();
  audio.stopMusic();
  setTimeout(() => audio.resumeMusic(), 900);
};
game.onGameOverScreen = () => {
  updateBest();
};

input.onPause = () => {
  if (game.mode === "playing" || game.mode === "paused") togglePause();
};
input.onMute = toggleSound;

// ------------------------------------------------------------- MENU EVENTS
document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-help").addEventListener("click", showHelp);
document.getElementById("btn-sound-menu").addEventListener("click", toggleSound);
document.querySelectorAll("[data-close='help']").forEach(el => el.addEventListener("click", () => {
  audio.play("ui");
  ui.showScreen("menu");
  updateBest();
}));
document.getElementById("btn-resume").addEventListener("click", () => { audio.play("ui"); game.resume(); });
document.getElementById("btn-restart").addEventListener("click", () => { audio.play("ui"); game.retryCheckpoint(); });
document.getElementById("btn-pause-sound").addEventListener("click", toggleSound);
document.getElementById("btn-quit").addEventListener("click", quitToMenu);
document.getElementById("btn-sound").addEventListener("click", (e) => { e.stopPropagation(); toggleSound(); });
document.getElementById("btn-pause").addEventListener("click", (e) => { e.stopPropagation(); togglePause(); });
document.getElementById("btn-retry").addEventListener("click", () => { audio.play("ui"); game.retryCheckpoint(); });
document.getElementById("btn-over-menu").addEventListener("click", quitToMenu);
document.getElementById("btn-again").addEventListener("click", startGame);
document.getElementById("btn-win-menu").addEventListener("click", quitToMenu);

window.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    if (ui.current === "menu") { e.preventDefault(); startGame(); }
    else if (ui.current === "victory") { e.preventDefault(); startGame(); }
    else if (ui.current === "gameover") { e.preventDefault(); audio.play("ui"); game.retryCheckpoint(); }
  }
  if (e.code === "KeyR" && game.mode === "gameover") {
    e.preventDefault();
    game.retryCheckpoint();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.mode === "playing") game.pause();
});

// ---------------------------------------------------------------- THE LOOP
function frame(now) {
  if (!running) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  accumulator += dt;
  let steps = 0;
  while (accumulator >= STEP && steps < 6) {
    game.update(STEP);
    accumulator -= STEP;
    steps++;
  }
  if (steps > 0) input.clearFramePresses();
  game.draw();
  requestAnimationFrame(frame);
}

// prevent stuck keys when focus is lost
window.addEventListener("blur", () => input.releaseAll());

// boot
ui.syncSound();
updateBest();
game.enterMenu();
requestAnimationFrame((t) => {
  last = t;
  requestAnimationFrame(frame);
});

const loading = document.getElementById("loading");
const hideLoading = () => {
  loading?.classList.add("done");
  setTimeout(() => { if (loading) loading.style.display = "none"; }, 700);
};
if (document.readyState === "complete") setTimeout(hideLoading, 420);
else window.addEventListener("load", () => setTimeout(hideLoading, 420));
setTimeout(hideLoading, 2200);

// -------------------------------------------------------------- DEBUG API
window.__SHADOW__ = {
  game, input, audio, ui,
  start: startGame,
  pause: () => game.pause(),
  resume: () => game.resume(),
  state: () => ({
    mode: game.mode,
    screen: ui.current,
    player: game.player ? {
      x: game.player.x, y: game.player.y, vx: game.player.vx, vy: game.player.vy,
      health: game.player.health, energy: game.player.energy,
      grounded: game.player.grounded, attacking: !!game.player.attack,
      dash: game.player.dashTime > 0, facing: game.player.facing,
    } : null,
    score: game.score,
    orbs: game.orbCount,
    combo: game.combo,
    kills: game.kills,
    zone: game.zone?.id,
    camera: game.camera.x,
    enemies: game.enemies.filter(e => !e.dead).length,
    boss: game.boss ? { health: game.boss.health, phase: game.boss.phase, state: game.boss.state, x: game.boss.x } : null,
    projectiles: game.projectiles.length,
    bossDefeated: game.bossDefeated,
  }),
  teleport: (x, y) => {
    if (!game.player) return;
    game.player.x = x;
    if (y !== undefined) game.player.y = y;
    game.player.vx = 0; game.player.vy = 0;
    game.snapCamera();
  },
  hurt: (n = 20) => game.player?.takeDamage(n, game.player.cx - 40, game, { ignoreInvuln: true }),
  heal: (n = 100) => game.player?.heal(n),
  setHealth: (n) => { if (game.player) game.player.health = n; },
  setEnergy: (n) => { if (game.player) game.player.energy = n; },
  killAll: () => {
    for (const e of game.enemies) if (!e.dead) e.die(game);
  },
  gotoBoss: () => {
    if (!game.player) return;
    game.teleport(10680, 620 - game.player.h);
    game.snapCamera();
  },
  hurtBoss: (n = 100) => game.boss?.hurt(n, 1, 0, game, { heavy: true }),
  killBoss: () => {
    if (game.boss) game.boss.hurt(99999, 1, 0, game, {});
  },
  key: (action, down = true) => {
    if (!(action in input.held)) return;
    if (down) input._press(action);
    else input.held[action] = false;
  },
  press: (action) => {
    if (action in input.pressed) input._press(action);
  },
  god: (v = true) => {
    game.debugGod = v;
    if (v && game.player) game.player.invuln = 999;
  },
  win: () => {
    if (!game.boss) game.gotoBoss();
    setTimeout(() => {
      if (game.boss) game.boss.hurt(99999, 1, 0, game, {});
    }, 900);
  },
};

// expose a small, stable readiness flag for capture tooling
document.documentElement.dataset.gameReady = "true";
