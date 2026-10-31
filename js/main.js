import { AudioEngine } from "./audio.js";
import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import { UI } from "./ui.js";

const BEST_KEY = "borrowed-seconds-best";

const canvas = document.getElementById("arena");
const ui = new UI();
const audio = new AudioEngine();
const game = new Game();
const renderer = new Renderer(canvas);

const app = {
  state: "title",
  touchMode: false,
  best: 0,
};

const input = {
  keys: new Set(),
  mouse: { x: window.innerWidth / 2, y: window.innerHeight * 0.4, down: false, right: false },
  slowHeld: false,
  dashQueued: false,
  sticks: {
    move: { active: false, pointerId: null, originX: 0, originY: 0, x: 0, y: 0, dx: 0, dy: 0 },
    aim: { active: false, pointerId: null, originX: 0, originY: 0, x: 0, y: 0, dx: 0, dy: 0 },
  },
};

function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(Math.round(value)));
  } catch {
    /* storage is optional */
  }
}

function detectTouchMode() {
  const coarse = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
  return coarse || navigator.maxTouchPoints > 0 || window.innerWidth <= 820;
}

function applyViewport() {
  renderer.resize();
  app.touchMode = detectTouchMode();
  ui.setTouchMode(app.touchMode);
  requestFrame();
}

function resetInput() {
  input.keys.clear();
  input.mouse.down = false;
  input.mouse.right = false;
  input.slowHeld = false;
  input.dashQueued = false;
  input.sticks.move.active = false;
  input.sticks.move.pointerId = null;
  input.sticks.aim.active = false;
  input.sticks.aim.pointerId = null;
  game.input.moveX = 0;
  game.input.moveY = 0;
  game.input.fire = false;
  game.input.slow = false;
  game.input.dashPressed = false;
}

function nearestTarget() {
  let best = null;
  let bestDist = Infinity;
  for (const enemy of game.enemies) {
    if (!enemy.alive || enemy.spawnT > 0) continue;
    const distance = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
    if (distance < bestDist) {
      best = enemy;
      bestDist = distance;
    }
  }
  if (game.boss && !game.boss.dead && game.boss.spawnT <= 0) {
    const distance = Math.hypot(game.boss.x - game.player.x, game.boss.y - game.player.y);
    if (distance < bestDist) best = game.boss;
  }
  return best;
}

function updateInput() {
  const playing = app.state === "playing" && game.status === "playing";
  if (!playing) {
    game.input.moveX = 0;
    game.input.moveY = 0;
    game.input.fire = false;
    game.input.slow = false;
    game.input.dashPressed = false;
    return;
  }

  let moveX = 0;
  let moveY = 0;
  if (input.keys.has("w") || input.keys.has("arrowup")) moveY -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) moveY += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) moveX -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) moveX += 1;

  const touch = app.touchMode;
  const moveStick = input.sticks.move;
  if (moveStick.active) {
    moveX = Math.max(-1, Math.min(1, moveStick.dx / 40));
    moveY = Math.max(-1, Math.min(1, moveStick.dy / 40));
  }
  const moveMag = Math.hypot(moveX, moveY);
  if (moveMag > 1) {
    moveX /= moveMag;
    moveY /= moveMag;
  }

  game.input.moveX = moveX;
  game.input.moveY = moveY;
  game.input.touch = touch;

  if (touch) {
    const aimStick = input.sticks.aim;
    const aimMag = Math.hypot(aimStick.dx, aimStick.dy);
    let target = null;
    if (aimStick.active && aimMag > 12) {
      game.input.aimAngle = Math.atan2(aimStick.dy, aimStick.dx);
      game.input.fire = true;
    } else {
      target = nearestTarget();
      if (target) {
        game.input.aimAngle = Math.atan2(target.y - game.player.y, target.x - game.player.x);
      }
      game.input.fire = Boolean(target);
    }
    game.input.slow = input.slowHeld || input.keys.has("shift");
  } else {
    const world = renderer.screenToWorld(input.mouse.x, input.mouse.y);
    game.input.aimAngle = Math.atan2(world.y - game.player.y, world.x - game.player.x);
    game.input.fire = input.mouse.down;
    game.input.slow = input.mouse.right || input.keys.has("shift");
  }

  if (input.dashQueued) {
    game.input.dashPressed = true;
    input.dashQueued = false;
  } else {
    game.input.dashPressed = false;
  }
}

function startGame() {
  audio.init();
  audio.setPaused(false);
  audio.sfx("ui");
  audio.startMusic();
  resetInput();
  app.state = "playing";
  ui.resetRun();
  game.reset();
  ui.setPlaying(true);
  ui.hideTitle();
  ui.setBest(app.best);
  ui.setMuted(audio.muted);
  requestFrame();
}

function goTitle() {
  audio.stopMusic();
  audio.setPaused(false);
  app.state = "title";
  game.status = "title";
  game.enemies = [];
  game.bullets = [];
  game.particles = [];
  game.rings = [];
  game.texts = [];
  game.pickups = [];
  game.debt = [];
  game.boss = null;
  game.stolen = 0;
  game.score = 0;
  game.timeScale = 1;
  game.overdrive = 0;
  game.player.x = 0;
  game.player.y = 30;
  game.player.angle = -Math.PI / 2;
  game.player.hp = game.player.maxHp;
  game.player.dead = false;
  game.player.invuln = 0;
  game.player.dashT = 0;
  game.player.dashCd = 0;
  game.player.vx = 0;
  game.player.vy = 0;
  game.player.trail = [];
  game.echo = [];
  resetInput();
  ui.showTitle();
  ui.setBest(app.best);
  ui.setMuted(audio.muted);
  requestFrame();
}

function endRun(victory) {
  if (app.state !== "playing") return;
  app.state = "gameover";
  const previousBest = app.best;
  const stats = {
    ...game.stats,
    score: Math.round(game.score),
    time: game.elapsed,
    borrowed: game.stolen,
    wave: game.wave,
  };
  if (stats.score > app.best) {
    app.best = stats.score;
    saveBest(app.best);
  }
  audio.stopMusic();
  audio.setPaused(false);
  resetInput();
  ui.setBest(app.best);
  ui.showEnd({
    victory,
    stats,
    best: app.best,
    previousBest,
    touchMode: app.touchMode,
  });
}

function togglePause() {
  if (app.state === "playing" && game.status === "playing") {
    app.state = "paused";
    ui.showPause();
    audio.setPaused(true);
    resetInput();
  } else if (app.state === "paused") {
    app.state = "playing";
    ui.hidePause();
    audio.setPaused(false);
    resetInput();
    ui.setPlaying(true);
    ui.hideTitle();
    requestFrame();
  }
}

function toggleMute() {
  const muted = audio.toggleMute();
  ui.setMuted(muted);
  if (!muted) {
    audio.init();
    audio.sfx("ui");
  }
}

function bindGameEvents() {
  game.onSfx = (name, options) => audio.sfx(name, options);
  game.onToast = (text, tone) => ui.toast(text, tone);
  game.onBanner = (title, subtitle) => ui.banner(title, subtitle);
  game.onSlowChange = (active) => audio.setSlow(active);
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

function pointerStickForZone(x, y) {
  return x < window.innerWidth / 2 ? "move" : "aim";
}

function handleCanvasPointerDown(event) {
  if (event.pointerType === "mouse") {
    input.mouse.x = event.clientX;
    input.mouse.y = event.clientY;
    if (event.button === 0) input.mouse.down = true;
    if (event.button === 2) input.mouse.right = true;
    return;
  }
  if (app.state !== "playing" || !app.touchMode) return;
  if (event.clientY < window.innerHeight * 0.4) return;
  const zone = pointerStickForZone(event.clientX, event.clientY);
  const stick = input.sticks[zone];
  if (stick.active) return;
  event.preventDefault();
  stick.active = true;
  stick.pointerId = event.pointerId;
  stick.originX = event.clientX;
  stick.originY = event.clientY;
  stick.x = event.clientX;
  stick.y = event.clientY;
  stick.dx = 0;
  stick.dy = 0;
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    /* capture is best effort */
  }
}

function handlePointerMove(event) {
  if (event.pointerType === "mouse") {
    input.mouse.x = event.clientX;
    input.mouse.y = event.clientY;
    return;
  }
  for (const stick of Object.values(input.sticks)) {
    if (stick.active && stick.pointerId === event.pointerId) {
      stick.x = event.clientX;
      stick.y = event.clientY;
      stick.dx = stick.x - stick.originX;
      stick.dy = stick.y - stick.originY;
    }
  }
}

function handlePointerUp(event) {
  if (event.pointerType === "mouse") {
    if (event.button === 0) input.mouse.down = false;
    if (event.button === 2) input.mouse.right = false;
    return;
  }
  for (const stick of Object.values(input.sticks)) {
    if (stick.active && stick.pointerId === event.pointerId) {
      stick.active = false;
      stick.pointerId = null;
      stick.dx = 0;
      stick.dy = 0;
    }
  }
}

canvas.addEventListener("pointerdown", handleCanvasPointerDown);
window.addEventListener("pointermove", handlePointerMove, { passive: true });
window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("pointercancel", handlePointerUp);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener(
  "keydown",
  (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    if (key === "shift") input.keys.add("shift");
    if (key === " ") {
      if (!event.repeat && app.state === "playing") input.dashQueued = true;
    }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      input.keys.add(key);
    }
    if ((key === "p" || key === "escape") && !event.repeat) {
      if (app.state === "playing" || app.state === "paused") togglePause();
    }
    if (key === "m" && !event.repeat) toggleMute();
    if (key === "enter" && app.state === "title" && !event.repeat) startGame();
  },
  { passive: false }
);

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  input.keys.delete(key);
  if (key === "shift") input.keys.delete("shift");
});

window.addEventListener("blur", () => {
  input.keys.clear();
  input.mouse.down = false;
  input.mouse.right = false;
  input.slowHeld = false;
  for (const stick of Object.values(input.sticks)) {
    stick.active = false;
    stick.pointerId = null;
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && app.state === "playing" && game.status === "playing") togglePause();
});

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const playButton = document.getElementById("btn-play");
const againButton = document.getElementById("btn-again");
const titleButton = document.getElementById("btn-title");
const resumeButton = document.getElementById("btn-resume");
const quitButton = document.getElementById("btn-quit");
const pauseButton = document.getElementById("btn-pause");
const audioButton = document.getElementById("btn-audio");
const pauseMuteButton = document.getElementById("btn-pause-mute");

playButton?.addEventListener("click", () => {
  audio.sfx("ui");
  startGame();
});
againButton?.addEventListener("click", () => {
  audio.sfx("ui");
  startGame();
});
titleButton?.addEventListener("click", () => {
  audio.sfx("ui");
  goTitle();
});
resumeButton?.addEventListener("click", () => {
  audio.sfx("ui");
  togglePause();
});
quitButton?.addEventListener("click", () => {
  audio.sfx("ui");
  goTitle();
});
pauseButton?.addEventListener("click", () => togglePause());
audioButton?.addEventListener("click", () => toggleMute());
pauseMuteButton?.addEventListener("click", () => toggleMute());

const slowButton = document.getElementById("btn-slow");
const dashButton = document.getElementById("btn-dash");

function holdSlow(active) {
  input.slowHeld = active;
  slowButton?.classList.toggle("held", active);
}

slowButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  holdSlow(true);
  try {
    slowButton.setPointerCapture(event.pointerId);
  } catch {
    /* best effort */
  }
});
const releaseSlow = (event) => {
  event.preventDefault();
  holdSlow(false);
};
slowButton?.addEventListener("pointerup", releaseSlow);
slowButton?.addEventListener("pointercancel", releaseSlow);
slowButton?.addEventListener("lostpointercapture", () => holdSlow(false));
slowButton?.addEventListener("contextmenu", (event) => event.preventDefault());

dashButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (app.state === "playing") input.dashQueued = true;
  try {
    dashButton.setPointerCapture(event.pointerId);
  } catch {
    /* best effort */
  }
});
dashButton?.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener("resize", applyViewport);
window.addEventListener("orientationchange", () => setTimeout(applyViewport, 120));

/* ------------------------------------------------------------------ */
/* Boot & loop                                                         */
/* ------------------------------------------------------------------ */

app.best = loadBest();
app.touchMode = detectTouchMode();
app.input = input;
ui.setTouchMode(app.touchMode);
ui.setBest(app.best);
ui.setMuted(audio.muted);
bindGameEvents();

window.__BORROWED = {
  get state() {
    return app.state;
  },
  game,
  audio,
  ui,
  renderer,
  app,
  start: startGame,
  restart: startGame,
  title: goTitle,
  borrow(seconds = 1) {
    const count = Math.max(1, Math.floor(seconds));
    for (let i = 0; i < count; i += 1) game.addDebt();
    game.stolen += count;
    game.stats.borrowed = game.stolen;
  },
  spawnCollector() {
    game.spawnCollector();
  },
  setWave(wave) {
    game.wave = Math.max(1, Math.min(5, wave));
    game.waveT = 0;
    game.stats.wave = game.wave;
    if (game.wave >= 5) {
      game.bossSpawnT = 0.05;
      game.bossSpawned = false;
    }
  },
  boss() {
    game.wave = 5;
    game.bossSpawnT = 0;
    game.bossSpawned = false;
    game.spawnBoss();
    if (game.boss) game.boss.spawnT = 0;
  },
  win() {
    if (!game.boss) {
      game.wave = 5;
      game.spawnBoss();
    }
    if (game.boss) {
      game.boss.spawnT = 0;
      game.boss.hp = 0;
      game.killBoss();
    }
  },
  hurt(amount = 25) {
    game.player.invuln = 0;
    game.damagePlayer(amount);
  },
  settle() {
    for (const mote of game.debt) mote.fuse = 0;
  },
  resume: togglePause,
  mute: toggleMute,
};

let lastFrame = performance.now();
let frameQueued = false;

function requestFrame() {
  if (frameQueued) return;
  frameQueued = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function frame(now) {
  frameQueued = false;
  const rawDt = Math.max(0, (now - lastFrame) / 1000);
  lastFrame = now;

  updateInput();

  if (app.state === "playing") {
    // Catch up in fixed steps so game timers track wall-clock time even when
    // a screenshot or a slow software-rendered frame stalls the loop.
    let remaining = Math.min(0.3, rawDt);
    let steps = 0;
    while (remaining > 0 && steps < 8) {
      const step = Math.min(0.05, remaining);
      remaining -= step;
      steps += 1;
      game.update(step);
      if (game.status === "dead") {
        endRun(false);
        break;
      }
      if (game.status === "won") {
        endRun(true);
        break;
      }
    }
  }

  ui.update(game, app.state === "paused");
  renderer.render(game, Math.min(0.1, rawDt), app);

  // Render loop only while a run is live. Title, pause and end screens are
  // static, so idling here keeps the page light and the Play button instantly
  // actionable (important on software-rendered machines).
  if (app.state === "playing") requestFrame();
}

requestFrame();
