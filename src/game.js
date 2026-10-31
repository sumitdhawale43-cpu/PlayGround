import { Terrain, WORLD_W, WORLD_H } from "./terrain.js";
import { Renderer } from "./render.js";
import { Hud } from "./hud.js";
import { Sfx } from "./audio.js";
import {
  WEAPONS, GRAVITY, WIND_MULT, circleRect, pointInRect,
  distToRect, segmentRect, clamp, projectileSpeed,
} from "./physics.js";
import { chooseShot } from "./ai.js";

const CELL_SIZE = 44;
const BUILD_RANGE = 290;
const REACTION_RANGE = 200;
const MOVE_MAX = 110;
const MOVE_SPEED = 158;
const JUMP_VY = -442;
const WORM_GRAVITY = 1450;
const WORM_R = 14;

const COSTS = {
  wall: { wood: 15, brick: 28, metal: 42 },
  ramp: { wood: 15, brick: 28, metal: 42 },
  floor: { wood: 12, brick: 22, metal: 34 },
};
const HPS = {
  wall: { wood: 80, brick: 150, metal: 240 },
  ramp: { wood: 72, brick: 135, metal: 216 },
  floor: { wood: 64, brick: 120, metal: 192 },
};
const MAT_NAMES = { wood: "WOOD", brick: "BRICK", metal: "METAL" };
const MAT_COLORS = { wood: "#d9a262", brick: "#e58a72", metal: "#c3d4e3" };
const DIFF_NAMES = { easy: "ROOKIE", normal: "VETERAN", hard: "ELITE" };
const BLUE_NAMES = ["BRAMBLE", "PIP"];
const RED_NAMES = ["CINDER", "NIB"];

const canvas = document.getElementById("game");
const renderer = new Renderer(canvas);
const sfx = new Sfx();

const state = {
  scene: "menu",
  mode: "cpu",
  difficulty: "normal",
  paused: false,
  time: 0,
  terrain: null,
  teams: [],
  worms: [],
  structures: [],
  projectiles: [],
  particles: [],
  floaters: [],
  timers: [],
  active: null,
  activeIdx: [0, 0],
  turnTeam: 0,
  turn: 1,
  phase: "input",
  wind: 0,
  buildMode: false,
  selectedMat: "wood",
  selectedPiece: "wall",
  rampDir: 1,
  weapon: "bazooka",
  aim: { angle: -0.72, power: 0.68, active: false },
  drag: null,
  ghost: null,
  buildCost: 0,
  reaction: { available: false, team: 1, mat: "wood", cost: 0 },
  cam: { x: WORLD_W / 2, y: 380, scale: 1 },
  shake: 0,
  hitFlash: 0,
  slowmo: 1,
  pointer: { x: 0, y: 0, wx: 0, wy: 0, down: false },
  keys: { left: false, right: false },
  painting: false,
  costs: COSTS,
  muted: sfx.muted,
  winner: null,
  stats: { shots: 0, damage: 0, builds: 0, destroyed: 0, crates: 0 },
  hudTick: 0,
  structureId: 0,
};

const hud = new Hud({
  weapon: selectWeapon,
  mat: selectMat,
  piece: selectPiece,
  buildToggle: toggleBuild,
  reaction: () => reactionBuild(false),
  mute: toggleMute,
  help: openHelp,
});

/* ============================================================
   helpers
   ============================================================ */
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
function isHuman(team) { return state.mode === "local" || team === 0; }
function canAct() {
  return state.scene === "play" && state.phase === "input" && state.active &&
    state.active.alive && isHuman(state.active.team) && !state.paused;
}
function nearestEnemy(worm) {
  let best = null;
  let bd = Infinity;
  for (const w of state.worms) {
    if (!w.alive || w.team === worm.team) continue;
    const d = Math.hypot(w.x - worm.x, w.y - worm.y);
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}
function teamAlive(team) {
  return state.teams[team].worms.filter((w) => w.alive).length;
}
function schedule(delay, fn, tag = "fx") {
  state.timers.push({ t: delay, fn, tag });
}
function clearTimers(tag) {
  state.timers = state.timers.filter((t) => t.tag !== tag);
}
function updateTimers(dt) {
  if (!state.timers.length) return;
  const due = [];
  for (const t of state.timers) {
    t.t -= dt;
    if (t.t <= 0) due.push(t);
  }
  if (due.length) {
    state.timers = state.timers.filter((t) => t.t > 0);
    for (const t of due) {
      try { t.fn(); } catch (err) { console.error(err); }
    }
  }
}

/* ============================================================
   setup
   ============================================================ */
function makeTeams() {
  const spawns = [
    { team: 0, xs: [350, 412], names: BLUE_NAMES },
    { team: 1, xs: [930, 868], names: RED_NAMES },
  ];
  return spawns.map(({ team, xs, names }) => {
    const worms = xs.map((x, i) => {
      const surf = state.terrain.surfaceAt(x);
      return {
        id: `${team === 0 ? "b" : "r"}${i}`,
        name: names[i],
        team,
        idx: i,
        x,
        y: surf - WORM_R - 1,
        vx: 0,
        vy: 0,
        r: WORM_R,
        hp: 100,
        maxHp: 100,
        alive: true,
        onGround: true,
        facing: team === 0 ? 1 : -1,
        moveLeft: MOVE_MAX,
        maxMove: MOVE_MAX,
        ammo: { bazooka: Infinity, grenade: 3 },
        flash: 0,
        bob: Math.random() * 8,
        fallDist: 0,
        deathX: null,
        deathY: null,
      };
    });
    return {
      id: team,
      name: team === 0 ? "BLUE CREW" : "RED CREW",
      worms,
      mats: { wood: 140, brick: 60, metal: 20 },
    };
  });
}

function makeCrate(x, y) {
  return {
    id: ++state.structureId,
    type: "crate",
    mat: "wood",
    team: -1,
    x, y,
    rects: [{ x, y, w: 34, h: 34 }],
    hp: 55,
    maxHp: 55,
    born: state.time,
    flash: 0,
    dead: false,
  };
}

function addCrates() {
  const islandTop = 281;
  state.structures.push(makeCrate(623, islandTop - 34));
  const cx = 690;
  const surf = state.terrain.surfaceAt(cx);
  state.structures.push(makeCrate(cx - 17, surf - 35));
}

function setupMenuScene() {
  state.scene = "menu";
  state.phase = "input";
  state.paused = false;
  state.terrain = new Terrain((Math.random() * 1e9) | 0);
  state.teams = makeTeams();
  state.worms = state.teams.flatMap((t) => t.worms);
  state.structures = [];
  state.projectiles = [];
  state.particles = [];
  state.floaters = [];
  state.timers = [];
  state.active = state.teams[0].worms[0];
  state.turnTeam = 0;
  state.turn = 1;
  state.wind = 24;
  state.winner = null;
  state.buildMode = false;
  state.reaction.available = false;
  state.shake = 0;
  state.hitFlash = 0;
  state.slowmo = 1;
  state.cam = { x: WORLD_W / 2, y: 380, scale: 1 };
  state.stats = { shots: 0, damage: 0, builds: 0, destroyed: 0, crates: 0 };
  state.structureId = 0;
  // A little scenery behind the title card.
  addCrateDemo();
  updateCamera(0, true);
  hud.hide();
}

function addCrateDemo() {
  const builds = [
    ["wall", "wood", 8, 9, 0],
    ["ramp", "wood", 9, 10, 0],
    ["wall", "brick", 23, 10, 1],
    ["floor", "wood", 22, 9, 1],
  ];
  for (const [piece, mat, cx, cy, team] of builds) {
    const cellX = cx * CELL_SIZE;
    const cellY = cy * CELL_SIZE;
    const surf = state.terrain.surfaceAt(cellX + 22);
    if (cellY > surf + 44) continue;
    const s = makeStructure(piece, mat, cellX, cellY, team, team === 0 ? 1 : -1);
    s.born = state.time - 10;
    state.structures.push(s);
  }
}

function startMatch(mode) {
  sfx.resume();
  sfx.click();
  state.mode = mode;
  state.scene = "play";
  state.paused = false;
  state.phase = "input";
  state.winner = null;
  state.turn = 1;
  state.turnTeam = 0;
  state.activeIdx = [0, 0];
  state.active = null;
  state.buildMode = false;
  state.selectedMat = "wood";
  state.selectedPiece = "wall";
  state.weapon = "bazooka";
  state.wind = rand(-28, 28);
  state.projectiles = [];
  state.particles = [];
  state.floaters = [];
  state.timers = [];
  state.structures = [];
  state.shake = 0;
  state.hitFlash = 0;
  state.slowmo = 1;
  state.stats = { shots: 0, damage: 0, builds: 0, destroyed: 0, crates: 0 };
  state.structureId = 0;
  state.terrain.generate((Math.random() * 1e9) | 0);
  state.teams = makeTeams();
  state.worms = state.teams.flatMap((t) => t.worms);
  addCrates();
  state.reaction.available = false;

  document.getElementById("menu").classList.add("is-hidden");
  document.getElementById("gameover").classList.add("is-hidden");
  document.getElementById("help").classList.add("is-hidden");
  hud.show();
  updateCamera(0, true);
  startTurn(0, true);
}

function startTurn(teamIdx, first = false) {
  clearTimers("ai");
  clearTimers("turn");
  const team = state.teams[teamIdx];
  state.turnTeam = teamIdx;
  state.phase = "input";
  state.buildMode = false;
  state.ghost = null;
  state.drag = null;
  state.painting = false;
  state.aim.active = false;
  state.weapon = "bazooka";
  state.reaction.available = false;
  state.reaction.team = 1 - teamIdx;

  let idx = state.activeIdx[teamIdx];
  if (!team.worms[idx] || !team.worms[idx].alive) {
    for (let i = 1; i <= team.worms.length; i++) {
      const j = (idx + i) % team.worms.length;
      if (team.worms[j].alive) { idx = j; break; }
    }
  }
  state.activeIdx[teamIdx] = idx;
  state.active = team.worms[idx];
  const w = state.active;
  w.moveLeft = w.maxMove;
  w.vx = 0;
  w.vy = 0;
  w.flash = 0;
  w.onGround = true;
  w.fallDist = 0;

  const enemy = nearestEnemy(w);
  if (enemy) {
    const dir = enemy.x >= w.x ? 1 : -1;
    w.facing = dir;
    state.aim.angle = dir > 0 ? -0.72 : Math.PI + 0.72;
  }
  state.aim.power = 0.56;

  updateCamera(0, false);
  hud.update(state);
  sfx.turn();

  if (!isHuman(teamIdx)) {
    hud.toast(`${team.name} IS THINKING…`);
    schedule(0.9, aiTakeTurn, "ai");
  } else if (first) {
    hud.toast(state.mode === "local" ? `${team.name} — PLAYER ${teamIdx + 1}` : `${team.name} — YOUR MOVE`);
  } else {
    hud.toast(state.mode === "local" ? `${team.name} — PLAYER ${teamIdx + 1}` : "YOUR MOVE");
  }
}

function finishTurn() {
  if (state.scene !== "play") return;
  if (checkGameOver()) return;
  state.turn++;
  const change = rand(-52, 52);
  state.wind = clamp(state.wind + change, -100, 100);
  if (Math.abs(state.wind) < 7) state.wind = (Math.random() < 0.5 ? -1 : 1) * 7;
  const next = 1 - state.turnTeam;
  state.activeIdx[next] = (state.activeIdx[next] + 1) % state.teams[next].worms.length;
  startTurn(next);
}

function checkGameOver() {
  if (state.scene !== "play") return state.scene === "over";
  const a0 = teamAlive(0);
  const a1 = teamAlive(1);
  if (a0 > 0 && a1 > 0) return false;
  state.winner = a0 > 0 ? 0 : a1 > 0 ? 1 : -1;
  state.scene = "over";
  state.phase = "over";
  state.buildMode = false;
  state.ghost = null;
  state.reaction.available = false;
  state.slowmo = 0.35;
  state.shake = Math.max(state.shake, 10);
  hud.update(state);
  schedule(1.7, showGameOver, "end");
  return true;
}

function showGameOver() {
  const title = document.getElementById("winnerTitle");
  const sub = document.getElementById("winnerSub");
  const burst = document.getElementById("winnerBurst");
  const stats = document.getElementById("stats");
  const won = state.winner;
  if (won < 0) {
    title.textContent = "DRAW!";
    title.className = "winner-title";
    sub.textContent = "Mutual destruction. The battlefield is quiet.";
    burst.textContent = "STALEMATE";
  } else {
    const team = state.teams[won];
    title.textContent = `${team.name} WINS!`;
    title.className = `winner-title ${won === 0 ? "blue" : "red"}`;
    sub.textContent = won === 0
      ? (state.mode === "cpu" ? "The CPU never stood a chance." : "Blue takes the trench.")
      : (state.mode === "cpu" ? "The CPU out-built and out-shot you." : "Red takes the trench.");
    burst.textContent = won === 0 ? "VICTORY" : "DEFEAT";
  }
  stats.innerHTML = `
    <div class="stat"><b>${state.turn}</b><span>TURNS</span></div>
    <div class="stat"><b>${state.stats.builds}</b><span>PIECES BUILT</span></div>
    <div class="stat"><b>${state.stats.destroyed + state.stats.crates}</b><span>THINGS BLOWN UP</span></div>
    <div class="stat"><b>${Math.round(state.stats.damage)}</b><span>DAMAGE DEALT</span></div>`;
  document.getElementById("gameover").classList.remove("is-hidden");
  sfx.win();
}

function goMenu() {
  document.getElementById("gameover").classList.add("is-hidden");
  document.getElementById("help").classList.add("is-hidden");
  document.getElementById("menu").classList.remove("is-hidden");
  setupMenuScene();
}

/* ============================================================
   UI wiring
   ============================================================ */
document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => startMatch(btn.dataset.mode));
});
document.querySelectorAll("#difficulty [data-diff]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.difficulty = btn.dataset.diff;
    document.querySelectorAll("#difficulty [data-diff]").forEach((b) => b.classList.toggle("active", b === btn));
    sfx.click();
  });
});
document.getElementById("menuHelp").addEventListener("click", () => { sfx.click(); openHelp(); });
document.getElementById("helpClose").addEventListener("click", closeHelp);
document.getElementById("helpPlay").addEventListener("click", () => {
  sfx.click();
  if (state.scene === "menu") startMatch(state.mode);
  else closeHelp();
});
document.getElementById("rematchBtn").addEventListener("click", () => startMatch(state.mode));
document.getElementById("menuBtn").addEventListener("click", goMenu);
document.getElementById("help").addEventListener("click", (e) => { if (e.target.id === "help") closeHelp(); });

function openHelp() {
  state.paused = true;
  document.getElementById("help").classList.remove("is-hidden");
}
function closeHelp() {
  state.paused = false;
  document.getElementById("help").classList.add("is-hidden");
}
function toggleMute() {
  sfx.init();
  sfx.setMuted(!state.muted);
  state.muted = sfx.muted;
  if (!state.muted) sfx.click();
  hud.update(state);
}
function selectWeapon(id) {
  if (!canAct()) return;
  if (id === "grenade" && state.active.ammo.grenade <= 0) {
    sfx.error();
    hud.toast("NO GRENADES LEFT", true);
    return;
  }
  state.weapon = id;
  state.buildMode = false;
  state.ghost = null;
  state.aim.active = false;
  state.drag = null;
  sfx.select();
  hud.update(state);
}
function selectMat(mat) {
  if (!canAct()) return;
  state.selectedMat = mat;
  sfx.click();
  updateGhost();
  hud.update(state);
}
function selectPiece(piece) {
  if (!canAct()) return;
  state.selectedPiece = piece;
  state.buildMode = true;
  state.aim.active = false;
  state.drag = null;
  sfx.select();
  updateGhost();
  hud.update(state);
}
function toggleBuild() {
  if (!canAct()) return;
  state.buildMode = !state.buildMode;
  state.ghost = null;
  state.aim.active = false;
  state.drag = null;
  sfx.select();
  if (state.buildMode) updateGhost();
  hud.update(state);
}

/* ============================================================
   keyboard
   ============================================================ */
window.addEventListener("keydown", (e) => {
  const k = e.key;
  if (k === "Escape") {
    if (!document.getElementById("help").classList.contains("is-hidden")) { closeHelp(); return; }
    if (state.buildMode) { state.buildMode = false; state.ghost = null; hud.update(state); return; }
    if (state.drag) { state.drag = null; state.aim.active = false; }
    return;
  }
  if (state.paused || state.scene !== "play") return;
  if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) e.preventDefault();

  if (k === "a" || k === "A" || k === "ArrowLeft") state.keys.left = true;
  if (k === "d" || k === "D" || k === "ArrowRight") state.keys.right = true;
  if (k === "w" || k === "W" || k === "ArrowUp" || k === " ") {
    if (k === " " && state.phase === "flight" && state.reaction.available) {
      reactionBuild(false);
    } else if (state.phase === "input") {
      tryJump();
    }
  }
  if (k === "q" || k === "Q") selectPiece("wall");
  if (k === "e" || k === "E") selectPiece("ramp");
  if (k === "f" || k === "F") selectPiece("floor");
  if (k === "b" || k === "B") toggleBuild();
  if (k === "1") selectMat("wood");
  if (k === "2") selectMat("brick");
  if (k === "3") selectMat("metal");
  if (k === "z" || k === "Z") selectWeapon("bazooka");
  if (k === "x" || k === "X") selectWeapon("grenade");
  if (k === "Enter" && canAct() && !state.buildMode) {
    state.aim.active = true;
    launchShot(state.active, state.aim.angle, state.aim.power, state.weapon);
  }
});
window.addEventListener("keyup", (e) => {
  const k = e.key;
  if (k === "a" || k === "A" || k === "ArrowLeft") state.keys.left = false;
  if (k === "d" || k === "D" || k === "ArrowRight") state.keys.right = false;
});

/* ============================================================
   pointer
   ============================================================ */
function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const scale = state.cam.scale;
  return {
    x, y,
    wx: (x - renderer.cw / 2) / scale + state.cam.x,
    wy: (y - renderer.ch / 2) / scale + state.cam.y,
  };
}
function setPointer(e) {
  const p = pointerPos(e);
  state.pointer.x = p.x;
  state.pointer.y = p.y;
  state.pointer.wx = p.wx;
  state.pointer.wy = p.wy;
}
function updateAimFromPointer() {
  const w = state.active;
  if (!w) return;
  const dx = state.pointer.wx - w.x;
  const dy = state.pointer.wy - (w.y - 4);
  const dist = Math.hypot(dx, dy);
  if (dist > 16) state.aim.angle = Math.atan2(dy, dx);
  state.aim.power = clamp((dist - 24) / 950, 0.1, 1);
  state.aim.active = true;
}

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (state.scene !== "play" || state.paused) return;
  e.preventDefault();
  setPointer(e);
  sfx.resume();
  state.pointer.down = true;

  if (state.phase === "flight") {
    if (state.reaction.available && isHuman(state.reaction.team)) reactionBuild(false);
    return;
  }
  if (state.phase !== "input" || !state.active || !isHuman(state.active.team)) return;

  if (state.buildMode) {
    const cell = cellAt(state.pointer.wx, state.pointer.wy);
    tryPlace(cell.x, cell.y);
    state.painting = true;
    return;
  }

  state.drag = { moved: false, sx: state.pointer.x, sy: state.pointer.y };
  updateAimFromPointer();
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});

canvas.addEventListener("pointermove", (e) => {
  if (state.scene !== "play") return;
  setPointer(e);
  if (state.drag) {
    if (Math.hypot(state.pointer.x - state.drag.sx, state.pointer.y - state.drag.sy) > 3) state.drag.moved = true;
    updateAimFromPointer();
  }
  if (state.buildMode) {
    updateGhost();
    if (state.painting) {
      const cell = cellAt(state.pointer.wx, state.pointer.wy);
      tryPlace(cell.x, cell.y);
    }
  }
});

function endPointer(e) {
  state.pointer.down = false;
  state.painting = false;
  if (state.drag) {
    const w = state.active;
    const dist = w ? Math.hypot(state.pointer.wx - w.x, state.pointer.wy - w.y) : 0;
    const shouldFire = state.drag.moved && dist > 26 && state.aim.power > 0.1;
    state.drag = null;
    state.aim.active = false;
    if (shouldFire && canAct()) launchShot(w, state.aim.angle, state.aim.power, state.weapon);
  }
  try { if (e && e.pointerId != null) canvas.releasePointerCapture(e.pointerId); } catch {}
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", () => {
  if (!state.drag) state.pointer.down = false;
});

document.querySelectorAll("#touchMove [data-move]").forEach((btn) => {
  const dir = btn.dataset.move;
  const down = (e) => {
    e.preventDefault();
    if (dir === "jump") tryJump();
    else if (dir === "left") state.keys.left = true;
    else state.keys.right = true;
  };
  const up = (e) => {
    e.preventDefault();
    if (dir === "left") state.keys.left = false;
    if (dir === "right") state.keys.right = false;
  };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
  btn.addEventListener("pointerleave", up);
});

/* ============================================================
   camera
   ============================================================ */
function computeCamera() {
  const cw = renderer.cw;
  const ch = renderer.ch;
  const aspect = cw / ch;
  let scale;
  let viewW;
  let viewH;
  if (aspect < 1.05) {
    viewW = 720;
    scale = cw / viewW;
    viewH = ch / scale;
  } else {
    scale = Math.min(cw / WORLD_W, ch / WORLD_H);
    viewW = cw / scale;
    viewH = ch / scale;
  }
  let tx = WORLD_W / 2;
  let ty = WORLD_H / 2;
  if (state.scene === "play" || state.scene === "over") {
    if (state.phase === "flight" && state.projectiles.length) {
      const p = state.projectiles[0];
      tx = p.x;
      ty = p.y;
    } else if (state.active) {
      if (aspect < 1.05) {
        // Portrait: keep the whole squad in frame instead of chasing one duel.
        let minX = Infinity, maxX = -Infinity, minY = Infinity;
        for (const w of state.worms) {
          if (!w.alive) continue;
          minX = Math.min(minX, w.x);
          maxX = Math.max(maxX, w.x);
          minY = Math.min(minY, w.y);
        }
        if (minX < maxX) {
          tx = (minX + maxX) / 2;
          ty = minY - 10;
        } else {
          tx = state.active.x;
          ty = state.active.y - 20;
        }
      } else {
        tx = state.active.x;
        ty = state.active.y - 20;
      }
    }
  }
  if (viewW < WORLD_W) tx = clamp(tx, viewW / 2, WORLD_W - viewW / 2);
  else tx = WORLD_W / 2;
  if (viewH < WORLD_H) ty = clamp(ty, viewH / 2, WORLD_H - viewH / 2);
  else ty = aspect < 1.05 ? clamp(ty, 400, 470) : WORLD_H / 2;
  return { scale, tx, ty, viewW, viewH };
}

function updateCamera(dt, snap = false) {
  const c = computeCamera();
  state.cam.scale = c.scale;
  const k = snap ? 1 : 1 - Math.exp(-dt * 4.2);
  state.cam.x += (c.tx - state.cam.x) * k;
  state.cam.y += (c.ty - state.cam.y) * k;
}

/* ============================================================
   building
   ============================================================ */
function cellAt(wx, wy) {
  return {
    x: Math.floor(wx / CELL_SIZE) * CELL_SIZE,
    y: Math.floor(wy / CELL_SIZE) * CELL_SIZE,
  };
}
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function checkPlacement(piece, mat, cellX, cellY, worm, opts = {}) {
  if (!worm) return "NO BUILDER";
  if (cellX < 0 || cellY < 0 || cellX + CELL_SIZE > WORLD_W || cellY + CELL_SIZE > WORLD_H) return "OUT OF BOUNDS";
  const range = opts.range ?? BUILD_RANGE;
  const cx = cellX + 22;
  const cy = cellY + 22;
  if (Math.hypot(cx - worm.x, cy - worm.y) > range) return "TOO FAR";
  const cost = COSTS[piece][mat];
  if (!opts.free && state.teams[worm.team].mats[mat] < cost) return `NEED ${cost} ${MAT_NAMES[mat]}`;

  const cellRect = { x: cellX + 3, y: cellY + 3, w: 38, h: 38 };
  if (!opts.ignoreTerrain) {
    if (state.terrain.solidWorld(cx, cy)) return "NO ROOM";
    const pts = [[8, 8], [36, 8], [8, 36], [36, 36], [22, 6]];
    let air = 0;
    for (const [px, py] of pts) if (!state.terrain.solidWorld(cellX + px, cellY + py)) air++;
    if (air < 3) return "NO ROOM";
  }
  for (const s of state.structures) {
    if (s.dead) continue;
    if (s.type !== "crate" && s.cellX === cellX && s.cellY === cellY) return "OCCUPIED";
    for (const r of s.rects) if (rectsOverlap(cellRect, r)) return "OCCUPIED";
  }
  for (const other of state.worms) {
    if (!other.alive) continue;
    if (circleRect(other.x, other.y, other.r + 4, cellRect)) return "WORM IN THE WAY";
  }
  return null;
}

function makeStructure(piece, mat, cellX, cellY, team, dir = 1) {
  const rects = [];
  if (piece === "wall") {
    rects.push({ x: cellX + 3, y: cellY + 3, w: 38, h: 38 });
  } else if (piece === "floor") {
    rects.push({ x: cellX + 1, y: cellY + 17, w: 42, h: 11 });
  } else {
    const strips = 7;
    for (let i = 0; i < strips; i++) {
      const w = CELL_SIZE * (strips - i) / strips;
      const x = dir >= 0 ? cellX + CELL_SIZE - w : cellX;
      const y = cellY + CELL_SIZE - (i + 1) * (CELL_SIZE / strips);
      rects.push({ x, y, w, h: CELL_SIZE / strips + 0.6 });
    }
  }
  const hp = HPS[piece][mat];
  return {
    id: ++state.structureId,
    type: piece,
    mat,
    cellX,
    cellY,
    x: cellX,
    y: cellY,
    rects,
    dir,
    hp,
    maxHp: hp,
    team,
    born: state.time,
    flash: 0,
    dead: false,
  };
}

function placeStructure(piece, mat, cellX, cellY, team, worm, dir = 1, opts = {}) {
  const s = makeStructure(piece, mat, cellX, cellY, team, dir);
  state.structures.push(s);
  if (!opts.free) state.teams[team].mats[mat] = Math.max(0, state.teams[team].mats[mat] - COSTS[piece][mat]);
  state.stats.builds++;
  const cx = cellX + 22;
  const cy = cellY + 22;
  for (let i = 0; i < 7; i++) {
    addParticle({
      kind: "smoke", x: cx + rand(-18, 18), y: cy + rand(-18, 18),
      vx: rand(-16, 16), vy: rand(-26, -4), life: rand(0.3, 0.6), maxLife: 0.6,
      size: rand(3, 6), color: "#b9a68f", alpha: 0.4,
    });
  }
  addRing(cx, cy, 12, team === 0 ? "#8fd8ff" : "#ff9aa5");
  sfx.build(mat);
  hud.update(state);
  return s;
}

function updateGhost() {
  if (!state.buildMode || state.phase !== "input" || !state.active || !isHuman(state.active.team)) {
    state.ghost = null;
    return;
  }
  const cell = cellAt(state.pointer.wx, state.pointer.wy);
  const reason = checkPlacement(state.selectedPiece, state.selectedMat, cell.x, cell.y, state.active);
  // Ramps rise away from the worm; no extra flip control needed on touch.
  if (state.selectedPiece === "ramp") {
    state.rampDir = cell.x + CELL_SIZE / 2 >= state.active.x ? 1 : -1;
  }
  // Don't paint an existing piece red with the "occupied" ghost right after placing it.
  state.ghost = reason === "OCCUPIED" ? null : { cellX: cell.x, cellY: cell.y, valid: !reason };
  state.buildCost = COSTS[state.selectedPiece][state.selectedMat];
}

function tryPlace(cellX, cellY) {
  if (!canAct() || !state.buildMode) return false;
  const w = state.active;
  const piece = state.selectedPiece;
  const mat = state.selectedMat;
  const reason = checkPlacement(piece, mat, cellX, cellY, w);
  const key = `${cellX},${cellY},${piece},${mat}`;
  if (reason) {
    if (state.lastFail !== key) {
      state.lastFail = key;
      sfx.error();
      hud.toast(reason, true);
    }
    updateGhost();
    return false;
  }
  state.lastFail = null;
  const dir = piece === "ramp" ? (cellX + CELL_SIZE / 2 >= w.x ? 1 : -1) : 1;
  placeStructure(piece, mat, cellX, cellY, w.team, w, dir);
  // Clear the ghost so the fresh piece is not instantly painted red as "occupied".
  state.ghost = null;
  return true;
}

function setupReaction(teamIdx) {
  const team = state.teams[teamIdx];
  const order = isHuman(teamIdx)
    ? [...new Set([state.selectedMat, "wood", "brick", "metal"])]
    : ["wood", "brick", "metal"];
  let mat = null;
  for (const m of order) {
    if (team.mats[m] >= COSTS.wall[m]) { mat = m; break; }
  }
  state.reaction = {
    available: !!mat,
    team: teamIdx,
    mat: mat || "wood",
    cost: mat ? COSTS.wall[mat] : 0,
  };
  if (mat && !isHuman(teamIdx)) {
    const chance = { easy: 0.22, normal: 0.6, hard: 0.85 }[state.difficulty] ?? 0.6;
    if (Math.random() < chance) schedule(0.3 + Math.random() * 0.32, aiReaction, "ai");
  }
  hud.update(state);
}

function distPointSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function reactionBuild(byAI) {
  const r = state.reaction;
  if (!r.available || state.phase !== "flight" || !state.projectiles.length) return false;
  const teamIdx = r.team;
  if (byAI && isHuman(teamIdx)) return false;
  if (!byAI && !isHuman(teamIdx)) return false;
  const team = state.teams[teamIdx];
  let mat = r.mat;
  if (team.mats[mat] < COSTS.wall[mat]) {
    mat = null;
    for (const m of ["wood", "brick", "metal"]) {
      if (team.mats[m] >= COSTS.wall[m]) { mat = m; break; }
    }
    if (!mat) return false;
  }
  const p = state.projectiles[0];
  const worm = (team.worms[state.activeIdx[teamIdx]] && team.worms[state.activeIdx[teamIdx]].alive)
    ? team.worms[state.activeIdx[teamIdx]]
    : team.worms.find((w) => w.alive);
  if (!worm) return false;

  const dir = Math.sign(p.x - worm.x) || worm.facing || 1;
  let best = null;
  for (const dx of [58, 80, 102, 124, 146]) {
    for (const dy of [-70, -48, -26, -4, 18, 40]) {
      const wx = worm.x + dir * dx;
      const wy = worm.y + dy;
      const cellX = Math.floor(wx / CELL_SIZE) * CELL_SIZE;
      const cellY = Math.floor(wy / CELL_SIZE) * CELL_SIZE;
      if (checkPlacement("wall", mat, cellX, cellY, worm, { range: REACTION_RANGE })) continue;
      const score = distPointSegment(cellX + 22, cellY + 22, worm.x, worm.y, p.x, p.y) * 0.6
        + Math.abs(dy + 14) * 0.22 + dx * 0.015;
      if (!best || score < best.score) best = { cellX, cellY, score };
    }
  }
  if (!best) {
    if (!byAI) hud.toast("NO ROOM FOR A WALL!", true);
    return false;
  }
  state.reaction.available = false;
  placeStructure("wall", mat, best.cellX, best.cellY, teamIdx, worm, 1);
  addRing(worm.x, worm.y - 10, 22, "#bfeaff");
  addFloater(worm.x, worm.y - 60, byAI ? "CPU REACTION!" : "REACTION BUILD!", "#bfeaff", 13);
  state.shake = Math.max(state.shake, 3);
  sfx.reaction();
  hud.update(state);
  return true;
}

/* ============================================================
   movement
   ============================================================ */
function tryJump() {
  if (!canAct() || state.buildMode) return;
  const w = state.active;
  if (!w || !w.onGround || w.moveLeft <= 0) return;
  w.vy = JUMP_VY;
  w.onGround = false;
  w.moveLeft = Math.max(0, w.moveLeft - 5);
  w.fallDist = 0;
  sfx.jump();
  for (let i = 0; i < 4; i++) {
    addParticle({
      kind: "smoke", x: w.x + rand(-7, 7), y: w.y + 12,
      vx: rand(-18, 18), vy: rand(-12, 6), life: rand(0.25, 0.45), maxLife: 0.45,
      size: rand(2.5, 4.5), color: "#cbbba2", alpha: 0.35,
    });
  }
}

function wormCollides(x, y, r) {
  const pts = [
    [0, 0], [0, r * 0.92], [0, -r * 0.92],
    [-r * 0.8, r * 0.5], [r * 0.8, r * 0.5],
    [-r * 0.8, -r * 0.5], [r * 0.8, -r * 0.5],
    [-r * 0.55, r * 0.8], [r * 0.55, r * 0.8],
  ];
  for (const [dx, dy] of pts) {
    if (state.terrain.solidWorld(x + dx, y + dy)) return true;
  }
  for (const s of state.structures) {
    if (s.dead) continue;
    for (const rect of s.rects) {
      if (circleRect(x, y, r, rect)) return true;
    }
  }
  return false;
}

function updateWorms(dt) {
  for (const w of state.worms) {
    if (!w.alive) continue;
    w.flash = Math.max(0, w.flash - dt * 4.5);
    const controllable = state.phase === "input" && w === state.active &&
      isHuman(w.team) && !state.buildMode && !state.paused;
    let moving = false;
    if (controllable) {
      if (state.keys.left && !state.keys.right && w.moveLeft > 0) {
        w.vx = -MOVE_SPEED;
        w.facing = -1;
        w.moveLeft = Math.max(0, w.moveLeft - MOVE_SPEED * dt);
        moving = true;
      } else if (state.keys.right && !state.keys.left && w.moveLeft > 0) {
        w.vx = MOVE_SPEED;
        w.facing = 1;
        w.moveLeft = Math.max(0, w.moveLeft - MOVE_SPEED * dt);
        moving = true;
      }
    }
    if (!moving) w.vx *= Math.pow(0.0015, dt);
    if (Math.abs(w.vx) < 0.5) w.vx = 0;

    w.vy += WORM_GRAVITY * dt;
    const prevY = w.y;
    w.y += w.vy * dt;
    const wasAir = !w.onGround;
    if (wormCollides(w.x, w.y, w.r)) {
      if (w.vy > 0) {
        let lift = 0;
        while (wormCollides(w.x, w.y, w.r) && lift < 28) { w.y -= 1; lift++; }
        if (wasAir && w.vy > 260) {
          if (w.fallDist > 145) {
            const dmg = Math.min(34, (w.fallDist - 145) * 0.2);
            if (dmg > 1) damageWorm(w, dmg, null, false, "FALL");
          }
          for (let i = 0; i < 5; i++) {
            addParticle({
              kind: "smoke", x: w.x + rand(-10, 10), y: w.y + 12,
              vx: rand(-24, 24), vy: rand(-14, 4), life: rand(0.25, 0.5), maxLife: 0.5,
              size: rand(3, 5.5), color: "#cbbba2", alpha: 0.3,
            });
          }
        }
        w.vy = 0;
        w.onGround = true;
        w.fallDist = 0;
      } else {
        w.y = prevY;
        w.vy = 0;
      }
    } else {
      w.onGround = false;
      if (w.vy > 0) w.fallDist += Math.max(0, w.y - prevY);
    }

    const prevX = w.x;
    w.x += w.vx * dt;
    if (wormCollides(w.x, w.y, w.r)) {
      let lifted = false;
      for (let s = 1; s <= 15; s++) {
        if (!wormCollides(w.x, w.y - s, w.r)) {
          w.y -= s;
          lifted = true;
          break;
        }
      }
      if (!lifted) {
        w.x = prevX;
        w.vx = 0;
      }
    }
    w.x = clamp(w.x, 16, WORLD_W - 16);
    if (w.y > WORLD_H + 90) { w.y = WORLD_H + 90; w.vy = 0; }
  }

  if (state.active && !state.active.alive && state.phase === "input") {
    state.phase = "settle";
    state.reaction.available = false;
    schedule(0.9, finishTurn, "turn");
    hud.update(state);
  }
}

/* ============================================================
   combat
   ============================================================ */
function addParticle(p) {
  if (state.particles.length > 460) return;
  state.particles.push(p);
}
function addRing(x, y, size, color) {
  addParticle({ kind: "ring", x, y, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, size, color });
}
function addFloater(x, y, text, color = "#fff", size = 16) {
  state.floaters.push({ x, y, text, color, size, life: 1.3, maxLife: 1.3, vy: -36 });
  if (state.floaters.length > 34) state.floaters.shift();
}

function award(teamIdx, mat, amount, x, y) {
  if (!amount || amount <= 0) return;
  const team = state.teams[teamIdx];
  if (!team) return;
  team.mats[mat] = Math.min(999, team.mats[mat] + amount);
  addFloater(x, y, `+${amount} ${MAT_NAMES[mat]}`, MAT_COLORS[mat], 13);
  hud.update(state);
}

function launchShot(worm, angle, power, weapon) {
  if (!worm || !worm.alive || state.phase !== "input" || state.scene !== "play") return;
  if (weapon === "grenade" && worm.ammo.grenade <= 0) weapon = "bazooka";
  const spec = WEAPONS[weapon];
  const speed = projectileSpeed(weapon, power);
  const mx = worm.x + Math.cos(angle) * 24;
  const my = worm.y - 2 + Math.sin(angle) * 24;
  const p = {
    x: mx, y: my,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    weapon,
    owner: worm,
    ownerTeam: worm.team,
    spin: 0,
    trail: [],
    age: 0,
    fuse: spec.fuse || 0,
    bounces: 0,
    dead: false,
  };
  state.projectiles.push(p);
  if (weapon === "grenade") worm.ammo.grenade--;
  state.stats.shots++;
  state.phase = "flight";
  state.buildMode = false;
  state.ghost = null;
  state.drag = null;
  state.aim.active = false;
  state.painting = false;
  state.weapon = weapon;
  worm.vx -= Math.cos(angle) * 26;
  worm.vy -= Math.sin(angle) * 8;
  worm.onGround = false;
  worm.fallDist = 0;

  for (let i = 0; i < 8; i++) {
    addParticle({
      kind: "spark", x: mx, y: my,
      vx: Math.cos(angle) * rand(60, 240) + rand(-50, 50),
      vy: Math.sin(angle) * rand(60, 240) + rand(-50, 50),
      life: rand(0.15, 0.35), maxLife: 0.35, size: rand(1.5, 2.8),
      color: i % 2 ? "#ffd447" : "#ff9b3d",
    });
  }
  for (let i = 0; i < 4; i++) {
    addParticle({
      kind: "smoke", x: mx, y: my,
      vx: Math.cos(angle) * rand(20, 80) + rand(-20, 20),
      vy: Math.sin(angle) * rand(20, 80) + rand(-20, 20),
      life: rand(0.4, 0.8), maxLife: 0.8, size: rand(4, 8), color: "#c9c2b4", alpha: 0.4,
    });
  }
  addRing(mx, my, 8, "#ffe3a0");
  state.shake = Math.max(state.shake, 2.5);
  sfx.shoot(weapon);
  setupReaction(1 - worm.team);
  hud.update(state);
}

function bounceTerrain(p) {
  const sx = state.terrain.solidWorld(p.x - 6, p.y) ? 1 : 0;
  const sx2 = state.terrain.solidWorld(p.x + 6, p.y) ? 1 : 0;
  const sy = state.terrain.solidWorld(p.x, p.y - 6) ? 1 : 0;
  const sy2 = state.terrain.solidWorld(p.x, p.y + 6) ? 1 : 0;
  let nx = sx - sx2;
  let ny = sy - sy2;
  const len = Math.hypot(nx, ny);
  if (len < 0.001) { nx = 0; ny = -1; } else { nx /= len; ny /= len; }
  const dot = p.vx * nx + p.vy * ny;
  if (dot < 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; }
  p.vx *= 0.42;
  p.vy *= 0.42;
  p.x += nx * 4;
  p.y += ny * 4;
  p.bounces++;
}
function bounceStructure(p, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = (p.x - cx) / Math.max(1, rect.w / 2);
  const dy = (p.y - cy) / Math.max(1, rect.h / 2);
  let nx = 0;
  let ny = 0;
  if (Math.abs(dx) > Math.abs(dy)) nx = Math.sign(dx) || 1;
  else ny = Math.sign(dy) || -1;
  const dot = p.vx * nx + p.vy * ny;
  if (dot < 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; }
  p.vx *= 0.42;
  p.vy *= 0.42;
  p.x += nx * 4;
  p.y += ny * 4;
  p.bounces++;
}

function updateProjectiles(dt) {
  if (!state.projectiles.length) return;
  for (const p of state.projectiles) {
    if (p.dead) continue;
    p.age += dt;
    p.trail.push({ x: p.x, y: p.y, life: 0.5, maxLife: 0.5 });
    for (const t of p.trail) t.life -= dt;
    p.trail = p.trail.filter((t) => t.life > 0).slice(-34);

    const spec = WEAPONS[p.weapon];
    if (spec.fuse) p.fuse -= dt;
    const speed = Math.hypot(p.vx, p.vy);
    const steps = Math.max(1, Math.ceil((speed * dt) / 4));
    const sdt = dt / steps;

    for (let i = 0; i < steps && !p.dead; i++) {
      p.vx += state.wind * WIND_MULT * sdt;
      p.vy += GRAVITY * sdt;
      p.x += p.vx * sdt;
      p.y += p.vy * sdt;
      p.spin += sdt * 11;

      if (p.x < -180 || p.x > WORLD_W + 180 || p.y > WORLD_H + 120 || p.y < -2400) {
        p.dead = true;
        p.missed = true;
        break;
      }

      if (state.terrain.solidWorld(p.x, p.y)) {
        if (p.weapon === "grenade" && p.bounces < 3) {
          bounceTerrain(p);
          addParticle({ kind: "spark", x: p.x, y: p.y, vx: rand(-50, 50), vy: rand(-50, 50), life: 0.2, maxLife: 0.2, size: 2, color: "#cfe6ff" });
        } else {
          explode(p.x, p.y, p.weapon, p.owner);
          p.dead = true;
        }
        break;
      }

      let hit = null;
      for (const s of state.structures) {
        if (s.dead) continue;
        // Launch clearance: a shot leaves through its own team's fresh build.
        if (p.age < 0.45 && s.team === p.ownerTeam) continue;
        for (const r of s.rects) {
          if (pointInRect(p.x, p.y, r, 0)) { hit = { s, r }; break; }
        }
        if (hit) break;
      }
      if (hit) {
        if (p.weapon === "grenade" && p.bounces < 3) {
          bounceStructure(p, hit.r);
          addParticle({ kind: "spark", x: p.x, y: p.y, vx: rand(-50, 50), vy: rand(-50, 50), life: 0.2, maxLife: 0.2, size: 2, color: "#cfe6ff" });
        } else {
          explode(p.x, p.y, p.weapon, p.owner);
          p.dead = true;
        }
        break;
      }

      for (const w of state.worms) {
        if (!w.alive) continue;
        if (w === p.owner && p.age < 0.18) continue;
        if (Math.hypot(p.x - w.x, p.y - w.y) < w.r + 4) {
          explode(p.x, p.y, p.weapon, p.owner);
          p.dead = true;
          break;
        }
      }
      if (p.dead) break;

      if (spec.fuse && p.fuse <= 0) {
        explode(p.x, p.y, p.weapon, p.owner);
        p.dead = true;
        break;
      }
    }
  }

  state.projectiles = state.projectiles.filter((p) => !p.dead);
  if (state.phase === "flight" && state.projectiles.length === 0) onProjectileDone();
}

function explode(x, y, weapon, shooter) {
  const spec = WEAPONS[weapon];
  const r = spec.radius;
  const removed = state.terrain.carve(x, y, r * 0.9);
  if (removed > 0 && shooter) {
    const amount = Math.min(18, Math.max(2, Math.round(removed / 120)));
    award(shooter.team, "wood", amount, x, y - 16);
  }

  for (const s of state.structures) {
    if (s.dead) continue;
    let d = Infinity;
    for (const rect of s.rects) d = Math.min(d, distToRect(x, y, rect));
    if (d < r + 8) {
      const dmg = spec.damage * 1.6 * (1 - d / (r + 8));
      damageStructure(s, dmg, shooter);
    }
  }
  state.structures = state.structures.filter((s) => !s.dead);

  for (const w of state.worms) {
    if (!w.alive) continue;
    const d = Math.hypot(w.x - x, w.y - y);
    if (d >= r + w.r) continue;
    let falloff = 1 - d / (r + w.r);
    falloff = Math.pow(Math.max(0, falloff), 0.85);
    let blocked = false;
    for (const s of state.structures) {
      if (s.dead) continue;
      for (const rect of s.rects) {
        if (segmentRect(x, y, w.x, w.y, rect)) { blocked = true; break; }
      }
      if (blocked) break;
    }
    let dmg = spec.damage * falloff * (blocked ? 0.35 : 1);
    if (d < w.r + 10) dmg += 6;
    damageWorm(w, dmg, shooter, blocked, blocked ? "BLOCKED" : null);
    const ang = Math.atan2(w.y - y, w.x - x);
    const kb = (blocked ? 105 : 275) * (0.4 + falloff * 0.8);
    w.vx += Math.cos(ang) * kb;
    w.vy += Math.sin(ang) * kb - 35;
    w.onGround = false;
    w.fallDist = 0;
    w.flash = 1;
  }

  for (let i = 0; i < 16; i++) {
    addParticle({
      kind: "spark", x, y,
      vx: rand(-260, 260), vy: rand(-260, 160),
      life: rand(0.2, 0.6), maxLife: 0.6, size: rand(1.5, 3.4),
      color: pick(["#ffd447", "#ff9b3d", "#fff2b0", "#ff6b4a"]),
    });
  }
  for (let i = 0; i < 12; i++) {
    addParticle({
      kind: "smoke", x: x + rand(-18, 18), y: y + rand(-18, 18),
      vx: rand(-60, 60), vy: rand(-70, 10),
      life: rand(0.5, 1.2), maxLife: 1.2, size: rand(7, 16),
      color: pick(["#6b625c", "#857a70", "#514a45"]), alpha: 0.42,
    });
  }
  for (let i = 0; i < 10; i++) {
    addParticle({
      kind: "dirt", x: x + rand(-20, 20), y: y + rand(-14, 20),
      vx: rand(-170, 170), vy: rand(-230, -20), gravity: 720,
      life: rand(0.4, 0.9), maxLife: 0.9, size: rand(2, 5), rot: rand(0, 6), spin: rand(-10, 10),
      color: pick(["#6b4a30", "#8a5a3b", "#4a3123"]), tall: Math.random() > 0.5,
    });
  }
  addParticle({ kind: "flash", x, y, vx: 0, vy: 0, life: 0.28, maxLife: 0.28, size: r * 1.35 });
  addRing(x, y, r * 0.55, "#fff2b0");
  addRing(x, y, r * 0.85, "#ffb347");

  state.shake = Math.max(state.shake, Math.min(24, 8 + r * 0.12));
  state.hitFlash = 0.75;
  sfx.explosion(weapon);

  if (teamAlive(0) === 0 || teamAlive(1) === 0) {
    state.slowmo = Math.min(state.slowmo, 0.4);
    state.shake = Math.max(state.shake, 14);
  }
  hud.update(state);
}

function damageStructure(s, dmg, shooter) {
  if (s.dead) return;
  s.hp -= dmg;
  s.flash = 1;
  if (s.hp > 0) return;
  s.dead = true;
  s.hp = 0;
  const cx = s.cellX != null ? s.cellX + 22 : s.rects[0].x + s.rects[0].w / 2;
  const cy = s.cellY != null ? s.cellY + 22 : s.rects[0].y + s.rects[0].h / 2;
  const colors = s.type === "crate" ? ["#e3a961", "#a86a31", "#5a3316"] : {
    wood: ["#b9793f", "#8e5a2c", "#5a3316"],
    brick: ["#b95747", "#7d3329", "#e3b39f"],
    metal: ["#8298ad", "#52667a", "#dbe8f3"],
  }[s.mat] || ["#8a5a3b"];
  for (let i = 0; i < 12; i++) {
    addParticle({
      kind: "debris", x: cx + rand(-16, 16), y: cy + rand(-16, 16),
      vx: rand(-150, 150), vy: rand(-220, -30), gravity: 800,
      life: rand(0.4, 0.9), maxLife: 0.9, size: rand(3, 6), rot: rand(0, 6), spin: rand(-12, 12),
      color: pick(colors), tall: Math.random() > 0.6,
    });
  }
  if (shooter) {
    if (s.type === "crate") {
      state.stats.crates++;
      award(shooter.team, "wood", 55, cx, cy - 10);
      award(shooter.team, "brick", 30, cx, cy - 28);
      award(shooter.team, "metal", 15, cx, cy - 46);
      addFloater(cx, cy - 62, "LOOT CACHE!", "#ffe066", 15);
      sfx.crate();
    } else {
      state.stats.destroyed++;
      const refund = Math.ceil(COSTS[s.type][s.mat] * 0.6);
      award(shooter.team, s.mat, refund, cx, cy - 16);
    }
  }
}

function damageWorm(w, dmg, source, blocked = false, tag = null) {
  if (!w || !w.alive || dmg <= 0) return;
  const amount = Math.max(1, Math.round(dmg));
  w.hp = Math.max(0, w.hp - amount);
  w.flash = 1;
  state.stats.damage += amount;
  addFloater(w.x + rand(-6, 6), w.y - 38, `-${amount}`, blocked ? "#9fd8ff" : "#ff9aa5", 17);
  if (tag === "BLOCKED") addFloater(w.x, w.y - 58, "BLOCKED", "#9fd8ff", 10);
  if (tag === "FALL") addFloater(w.x, w.y - 56, "FALL!", "#d9b38c", 10);
  sfx.hit();
  if (w.hp <= 0) killWorm(w);
  hud.update(state);
}

function killWorm(w) {
  if (!w.alive) return;
  w.alive = false;
  w.hp = 0;
  w.deathX = w.x;
  w.deathY = w.y;
  addFloater(w.x, w.y - 44, "ELIMINATED", "#ff8b96", 14);
  for (let i = 0; i < 18; i++) {
    addParticle({
      kind: "spark", x: w.x, y: w.y - 6,
      vx: rand(-220, 220), vy: rand(-260, 80),
      life: rand(0.3, 0.7), maxLife: 0.7, size: rand(2, 4),
      color: pick(["#ffd447", "#ff8b96", "#ffb3ba", "#fff2b0"]),
    });
  }
  addRing(w.x, w.y, 16, "#ff8b96");
  sfx.death();
  if (teamAlive(0) === 0 || teamAlive(1) === 0) {
    state.slowmo = Math.min(state.slowmo, 0.4);
    state.shake = Math.max(state.shake, 12);
  }
  hud.update(state);
}

function onProjectileDone() {
  if (state.phase !== "flight") return;
  state.phase = "settle";
  state.reaction.available = false;
  state.buildMode = false;
  state.ghost = null;
  hud.update(state);
  schedule(1.0, finishTurn, "turn");
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.life -= dt;
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (p.gravity) p.vy += p.gravity * dt;
    p.vx *= Math.pow(0.35, dt);
    if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floaters) {
    f.life -= dt;
    f.y += f.vy * dt;
    f.vy *= Math.pow(0.25, dt);
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
}

/* ============================================================
   CPU
   ============================================================ */
function aiTakeTurn() {
  if (state.scene !== "play" || state.phase !== "input" || !state.active) return;
  if (isHuman(state.active.team)) return;
  const w = state.active;
  const shouldBuild = Math.random() < 0.55 && (w.hp < 78 || Math.random() < 0.32);
  if (shouldBuild && aiBuild(w)) {
    hud.toast("RED CREW IS BUILDING…");
    schedule(0.6, aiAim, "ai");
    return;
  }
  aiAim();
}

function aiBuild(w) {
  const enemy = nearestEnemy(w);
  if (!enemy) return false;
  const dir = enemy.x >= w.x ? 1 : -1;
  const team = state.teams[w.team];
  let mat = "wood";
  if (team.mats.wood < COSTS.wall.wood) {
    if (team.mats.brick >= COSTS.wall.brick) mat = "brick";
    else if (team.mats.metal >= COSTS.wall.metal) mat = "metal";
    else return false;
  }
  for (const dx of [92, 68, 116, 44]) {
    for (const dy of [-48, -4, 42, -92]) {
      const cellX = Math.floor((w.x + dir * dx) / CELL_SIZE) * CELL_SIZE;
      const cellY = Math.floor((w.y + dy) / CELL_SIZE) * CELL_SIZE;
      if (!checkPlacement("wall", mat, cellX, cellY, w)) {
        placeStructure("wall", mat, cellX, cellY, w.team, w, 1);
        return true;
      }
    }
  }
  return false;
}

function aiAim() {
  if (state.scene !== "play" || state.phase !== "input" || !state.active || isHuman(state.active.team)) return;
  const w = state.active;
  const enemies = state.worms.filter((x) => x.alive && x.team !== w.team);
  const shot = chooseShot({
    worm: w,
    enemies,
    wind: state.wind,
    terrain: state.terrain,
    structures: state.structures,
    worms: state.worms,
    difficulty: state.difficulty,
  });
  if (!shot) return;
  state.weapon = shot.weapon;
  state.aim.angle = shot.angle;
  state.aim.power = shot.power;
  state.aim.active = true;
  hud.toast("RED CREW IS AIMING…");
  hud.update(state);
  schedule(0.72, () => {
    if (state.scene === "play" && state.phase === "input" && state.active === w) {
      launchShot(w, shot.angle, shot.power, shot.weapon);
    }
  }, "ai");
}

function aiReaction() {
  if (state.phase !== "flight" || !state.reaction.available || state.reaction.team !== 1) return;
  if (isHuman(1)) return;
  const p = state.projectiles[0];
  if (!p) return;
  const worm = state.teams[1].worms[state.activeIdx[1]];
  if (!worm || !worm.alive) return;
  const toward = (worm.x - p.x) * p.vx + (worm.y - p.y) * p.vy;
  const dist = Math.hypot(worm.x - p.x, worm.y - p.y);
  if (toward <= 0 || dist > 680) return;
  reactionBuild(true);
}

/* ============================================================
   update & render loop
   ============================================================ */
function update(dt) {
  updateTimers(dt);
  if (state.scene === "menu") {
    updateCamera(dt);
    return;
  }
  const gdt = dt * state.slowmo;
  updateWorms(gdt);
  updateProjectiles(gdt);
  updateParticles(gdt);
  if (state.buildMode) updateGhost();
  updateCamera(dt);

  state.shake *= Math.exp(-dt * 7);
  if (state.shake < 0.12) state.shake = 0;
  state.hitFlash = Math.max(0, state.hitFlash - dt * 3.4);
  state.slowmo += (1 - state.slowmo) * Math.min(1, dt * 1.7);

  state.hudTick += dt;
  if (state.hudTick > 0.1) {
    state.hudTick = 0;
    hud.updateLive(state);
  }
}

let last = performance.now();
function frame(now) {
  const raw = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!state.paused) {
    state.time += raw;
    update(raw);
  }
  renderer.draw(state);
  requestAnimationFrame(frame);
}

/* ============================================================
   resize / boot
   ============================================================ */
let rotateTimer = null;
function updateRotateHint() {
  const el = document.getElementById("rotateHint");
  const portrait = window.innerWidth < 640 && window.innerHeight > window.innerWidth * 1.05;
  if (state.scene === "play" && portrait) {
    el.classList.remove("is-hidden");
    clearTimeout(rotateTimer);
    rotateTimer = setTimeout(() => el.classList.add("is-hidden"), 6500);
  } else {
    el.classList.add("is-hidden");
  }
}

function onResize() {
  renderer.resize();
  updateCamera(0, true);
  updateRotateHint();
}
window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", () => setTimeout(onResize, 140));

function boot() {
  setupMenuScene();
  hud.update(state);
  onResize();
  requestAnimationFrame(frame);
}
boot();

