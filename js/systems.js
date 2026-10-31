/* ============================================================
   TIME REWIND — simulation systems
   ============================================================ */

export const STEP = 1 / 60;
export const SAMPLE_RATE = 30;
export const HISTORY_MAX = 150;
export const ECHO_WINDOW = 4.0;

const GRAVITY = 2360;
const MOVE_SPEED = 342;
const GROUND_ACCEL = 2900;
const AIR_ACCEL = 1800;
const GROUND_FRICTION = 3200;
const AIR_FRICTION = 260;
const JUMP_SPEED = 772;
const MAX_FALL = 1060;
const COYOTE = 0.095;
const PLAYER_W = 30;
const PLAYER_H = 52;
const REWIND_PLAYBACK = 1.62;
const REWIND_DRAIN = 24.5;
const ENERGY_REGEN = 1.8;

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const sign = (n) => n < 0 ? -1 : n > 0 ? 1 : 0;
const TAU = Math.PI * 2;

export function fixedUpdate(game, dt) {
  if (game.mode !== 'playing') return;

  if (game.dead) {
    game.deadTimer += dt;
    if (game.deadTimer >= game.deathWait) respawnPlayer(game);
    return;
  }

  if (game.rewinding) {
    updateRewind(game, dt);
    return;
  }

  game.levelTimer += dt;
  game.worldTime += dt;
  game.invuln = Math.max(0, game.invuln - dt);
  if (game.invuln > 0 && game.player) game.player.invuln = game.invuln;
  if (game.echoTimer > 0) {
    game.echoTimer = Math.max(0, game.echoTimer - dt);
    if (game.echoTimer === 0 && game.platforms.some(p => p.kind === 'echo')) {
      game.ui.showToast('ECHO FADED', 'The afterglow has collapsed.', 1400);
    }
  }

  game.updatePlatformState(dt);
  updateCrumbles(game, dt);
  updateEnemies(game, dt);
  updateProjectiles(game, dt);
  updatePlayer(game, dt);
  updatePickups(game);
  updateCheckpoints(game);
  updateHints(game, dt);
  updatePortal(game, dt);

  // recharge the chrono reserve slowly
  if (!game.dead) game.timeEnergy = clamp(game.timeEnergy + ENERGY_REGEN * dt, 0, 100);

  if (!game.god && game.player && game.player.y > 790) killPlayer(game, 'void');

  // record the last five seconds at 30 Hz
  game.sampleTimer += dt;
  const interval = 1 / SAMPLE_RATE;
  while (game.sampleTimer >= interval) {
    game.sampleTimer -= interval;
    game.recordSnapshot();
  }

  if (!game.dead) checkDanger(game);
}

/* ============================================================
   player
   ============================================================ */

function solid(game, p) {
  if (p.kind === 'phase' && !p.phaseActive) return false;
  if (p.kind === 'echo' && game.echoTimer <= 0) return false;
  if (p.kind === 'crumble' && p.state >= 2) return false;
  return true;
}

function playerRect(p, inset = 0) {
  return {
    x: p.x - PLAYER_W / 2 + inset,
    y: p.y - PLAYER_H + inset,
    w: PLAYER_W - inset * 2,
    h: PLAYER_H - inset * 2
  };
}

function updatePlayer(game, dt) {
  const p = game.player;
  const input = game.input;
  if (!p) return;

  p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  const wasGrounded = p.onGround;
  p.coyote = wasGrounded ? COYOTE : Math.max(0, p.coyote - dt);

  // carry momentum from a moving platform
  if (p.groundId >= 0) {
    const gp = game.platforms[p.groundId];
    if (gp && solid(game, gp) && wasGrounded) {
      p.x += gp.dx;
      p.y += gp.dy;
    }
  }

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const accel = wasGrounded ? GROUND_ACCEL : AIR_ACCEL;
  if (dir !== 0) {
    const target = dir * MOVE_SPEED;
    if (p.vx < target) p.vx = Math.min(target, p.vx + accel * dt);
    else if (p.vx > target) p.vx = Math.max(target, p.vx - accel * dt);
    p.facing = dir;
  } else {
    const friction = (wasGrounded ? GROUND_FRICTION : AIR_FRICTION) * dt;
    if (Math.abs(p.vx) <= friction) p.vx = 0;
    else p.vx -= sign(p.vx) * friction;
  }

  // jump — with coyote time and input buffering
  if (input.jumpBuffer > 0 && (wasGrounded || p.coyote > 0)) {
    p.vy = -JUMP_SPEED;
    p.onGround = false;
    p.groundId = -1;
    p.coyote = 0;
    p.jumpCut = false;
    input.jumpBuffer = 0;
    p.squash = 0.86;
    game.audio.jump();
    game.particles.jump(p.x, p.y, game.level.palette.accent);
  }

  if (!input.jumpHeld && p.vy < -285 && !p.jumpCut) {
    p.vy = Math.max(p.vy, -470);
    p.jumpCut = true;
  }
  if (input.jumpHeld) p.jumpCut = false;

  const oldVy = p.vy;
  p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
  p.onGround = false;
  p.groundId = -1;

  // horizontal phase
  const prevX = p.x;
  p.x += p.vx * dt;
  const body = playerRect(p, 1);

  for (const plat of game.platforms) {
    if (!solid(game, plat)) continue;
    const pr = { x: plat.curX, y: plat.curY, w: plat.w, h: plat.h };
    if (!rectsOverlap(body, pr)) continue;
    if (body.y + body.h <= pr.y + 1.5) continue;
    if (body.y >= pr.y + pr.h - 1.5) continue;
    if (p.vx > 0) {
      p.x = pr.x - PLAYER_W / 2 - 0.5;
    } else if (p.vx < 0) {
      p.x = pr.x + pr.w + PLAYER_W / 2 + 0.5;
    } else {
      const pushLeft = (body.x + body.w) - pr.x;
      const pushRight = (pr.x + pr.w) - body.x;
      p.x += pushLeft < pushRight ? -pushLeft - .5 : pushRight + .5;
    }
    p.vx = 0;
    body.x = p.x - PLAYER_W / 2 + 1;
    break;
  }

  // vertical phase
  const prevY = p.y;
  p.y += p.vy * dt;
  const nextBody = playerRect(p, 1);
  let landing = null;
  let ceiling = null;

  for (const plat of game.platforms) {
    if (!solid(game, plat)) continue;
    const pr = { x: plat.curX, y: plat.curY, w: plat.w, h: plat.h };
    if (nextBody.x + nextBody.w <= pr.x + 1 || nextBody.x >= pr.x + pr.w - 1) continue;

    if (p.vy >= 0) {
      const snap = Math.max(8, Math.abs(plat.dy) + 5);
      if (prevY <= pr.y + snap && p.y >= pr.y && nextBody.y < pr.y + pr.h - 1) {
        if (!landing || pr.y < landing.curY) landing = plat;
      }
    } else {
      if (prevY - PLAYER_H >= pr.y + pr.h - 3 && nextBody.y <= pr.y + pr.h && p.y > pr.y) {
        if (!ceiling || pr.y + pr.h > ceiling.curY + ceiling.h) ceiling = plat;
      }
    }
  }

  if (landing) {
    p.y = landing.curY;
    p.vy = 0;
    p.onGround = true;
    p.groundId = landing.id;
    p.squash = Math.min(p.squash, 0.9);
    if (oldVy > 410) {
      game.audio.land();
      game.particles.land(p.x, p.y, game.level.palette.accent);
      if (!game.reducedMotion) game.camera.shake = Math.min(4.5, oldVy / 260);
    }
    if (landing.kind === 'crumble' && landing.state === 0) triggerCrumble(game, landing);
  } else if (ceiling) {
    p.y = ceiling.curY + ceiling.h + PLAYER_H + 0.2;
    p.vy = Math.max(0, p.vy);
  }

  if (p.x < 18) { p.x = 18; p.vx = Math.max(0, p.vx); }
  if (p.x > 1262) { p.x = 1262; p.vx = Math.min(0, p.vx); }

  p.squash += (1 - p.squash) * Math.min(1, dt * 10);
  if (p.onGround && Math.abs(p.vx) > 25) {
    p.runPhase += (Math.abs(p.vx) / MOVE_SPEED) * dt * 15;
    p.stepTimer -= dt;
    if (p.stepTimer <= 0) {
      p.stepTimer = 0.1;
      game.particles.run(p.x, p.y, p.facing, game.level.palette.accent);
    }
  } else if (!p.onGround) {
    p.runPhase += dt * 3;
  }
}

function triggerCrumble(game, plat) {
  plat.state = 1;
  plat.timer = 0.72;
  game.audio.noise(0.12, 0.025, 1200);
  for (let i = 0; i < 8; i++) {
    game.particles.add({
      x: plat.curX + Math.random() * plat.w,
      y: plat.curY + 2,
      vx: (Math.random() - .5) * 50,
      vy: -20 - Math.random() * 30,
      life: .4 + Math.random() * .4,
      size: 1 + Math.random() * 1.6,
      color: '#ffb15f',
      gravity: 170,
      drag: 1
    });
  }
}

function updateCrumbles(game, dt) {
  for (const p of game.platforms) {
    if (p.kind !== 'crumble') continue;
    if (p.state === 1) {
      p.timer -= dt;
      if (p.timer <= 0) {
        p.state = 2;
        p.timer = 2.15;
        p.fall = 0;
        p.shake = 0;
        game.audio.noise(0.22, 0.035, 550);
        for (let i = 0; i < 10; i++) {
          game.particles.add({
            x: p.curX + Math.random() * p.w,
            y: p.curY + 4,
            vx: (Math.random() - .5) * 90,
            vy: -10 + Math.random() * 40,
            life: .5 + Math.random() * .6,
            size: 1 + Math.random() * 2,
            color: '#ffb15f',
            gravity: 280
          });
        }
      }
    } else if (p.state === 2) {
      p.timer -= dt;
      p.fall += (220 + (2.15 - p.timer) * 130) * dt;
      if (p.timer <= 0) {
        p.state = 0;
        p.timer = 0;
        p.fall = 0;
      }
    }
  }
}

/* ============================================================
   enemies
   ============================================================ */

export function setupBodies(enemies) {
  return enemies.map((e, i) => {
    if (e.type === 'sentinel') {
      return {
        ...e, id: i, dir: 1, state: 'patrol', alertT: 0,
        alert: false, step: Math.random() * 10, phase: i * 1.7
      };
    }
    return {
      ...e, id: i, baseX: e.x, baseY: e.y,
      fireTimer: (e.fireRate || 2.4) * (0.55 + (i % 3) * .14),
      alert: false, phase: i * 2.1, step: 0
    };
  });
}

function updateEnemies(game, dt) {
  const p = game.player;
  if (!p) return;
  for (const e of game.enemies) {
    if (e.type === 'sentinel') {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const canSee = Math.abs(dx) < 315 && dy > -120 && dy < 95 && !game.dead;
      if (canSee) {
        if (e.state !== 'chase') {
          game.particles.enemyAlert(e.x, e.y - 28);
          game.audio.tone(180, .18, 'sawtooth', .035, 80);
        }
        e.state = 'chase';
        e.alert = true;
        e.alertT = 2.1;
        e.dir = sign(dx) || e.dir;
      } else {
        e.alertT -= dt;
        if (e.alertT <= 0) { e.state = 'patrol'; e.alert = false; }
      }
      const speed = e.state === 'chase' ? e.speed * 2.05 : e.speed;
      e.x += e.dir * speed * dt;
      if (e.x <= e.minX) { e.x = e.minX; e.dir = 1; }
      if (e.x >= e.maxX) { e.x = e.maxX; e.dir = -1; }
      e.step += dt * (speed * .13 + 2);
    } else if (e.type === 'drone') {
      const dx = p.x - e.x;
      const dy = (p.y - 26) - e.y;
      const dist = Math.hypot(dx, dy);
      const inRange = dist < (e.range || 360) && !game.dead;
      if (inRange) {
        if (!e.alert) game.particles.enemyAlert(e.x, e.y - 15);
        e.alert = true;
        const targetX = p.x + (Math.abs(dx) < 60 ? 120 : 0);
        const targetY = p.y - 165;
        const speed = 74;
        e.x += clamp(targetX - e.x, -speed * dt, speed * dt);
        e.y += clamp(targetY - e.y, -speed * dt, speed * dt);
        e.x = clamp(e.x, 40, 1240);
        e.y = clamp(e.y, 85, 480);
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && game.invuln <= 0) {
          e.fireTimer = (e.fireRate || 2.4) * (0.9 + Math.random() * 0.2);
          fireBolt(game, e, p);
        }
      } else {
        e.alert = false;
        e.x += clamp(e.baseX - e.x, -52 * dt, 52 * dt);
        e.y += clamp(e.baseY - e.y, -52 * dt, 52 * dt);
      }
    }
  }
}

function fireBolt(game, e, p) {
  const sx = e.x, sy = e.y + 6;
  const tx = p.x, ty = p.y - 28;
  const a = Math.atan2(ty - sy, tx - sx);
  const speed = 305;
  game.projectiles.push({
    x: sx, y: sy,
    vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
    life: 4.5, radius: 5.5, trail: 0
  });
  game.audio.tone(720, .12, 'square', .024, 1040);
  game.particles.add({ type: 'ring', x: sx, y: sy, size: 2, grow: 20, life: .25, color: '#ff5f7e', width: 1 });
  for (let i = 0; i < 5; i++) {
    game.particles.add({
      x: sx, y: sy, vx: Math.cos(a) * 70 + (Math.random() - .5) * 60,
      vy: Math.sin(a) * 70 + (Math.random() - .5) * 60,
      life: .2 + Math.random() * .2, size: 1.2, color: '#ff7d96', drag: 2
    });
  }
}

function updateProjectiles(game, dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const b = game.projectiles[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.trail = (b.trail || 0) - dt;
    if (b.life <= 0 || b.x < -40 || b.x > 1320 || b.y < -40 || b.y > 780) {
      game.projectiles.splice(i, 1);
    }
  }
}

/* ============================================================
   world objects
   ============================================================ */

function updatePickups(game) {
  const p = game.player;
  if (!p) return;
  const cy = p.y - 27;
  for (const c of game.cores) {
    if (c.collected) continue;
    if (Math.hypot(p.x - c.x, cy - c.y) < 31) {
      c.collected = true;
      const key = `${game.level.id}:${c.idx}`;
      game.coreCollected.add(key);
      game.particles.pickupCore(c.x, c.y);
      game.audio.core();
      game.flash = { color: '#ffd36e', alpha: .16 };
      game.ui.showToast('CHRONO CORE', `${game.coreCollected.size} / ${game.level.cores.length} FRAGMENTS RECOVERED`, 1500);
    }
  }
  for (const e of game.energyOrbs) {
    if (e.collected) continue;
    if (Math.hypot(p.x - e.x, cy - e.y) < 27) {
      e.collected = true;
      game.timeEnergy = clamp(game.timeEnergy + 35, 0, 100);
      game.particles.pickupEnergy(e.x, e.y);
      game.audio.energy();
      game.ui.showToast('CHRONO ENERGY', '+35% RESERVE RESTORED', 1500);
    }
  }
}

function updateCheckpoints(game) {
  const p = game.player;
  if (!p) return;
  for (const c of game.checkpoints) {
    if (game.activeCheckpoints.has(c.id)) continue;
    if (Math.abs(p.x - c.x) < 32 && Math.abs(p.y - c.y) < 24) {
      game.activeCheckpoints.add(c.id);
      c.active = true;
      game.checkpointIndex = Math.max(game.checkpointIndex, c.id);
      game.respawn = { x: c.x, y: c.y };
      game.particles.checkpoint(c.x, c.y);
      game.audio.checkpoint();
      game.flash = { color: '#57f2ff', alpha: .16 };
      game.invuln = Math.max(game.invuln, .6);
      game.ui.setCheckpoint(game.checkpointIndex);
      game.ui.showToast('CHECKPOINT SECURED', 'Your next reconstruction point is locked.', 2100);
    }
  }
}

function updateHints(game, dt) {
  if (game.hintDelay > 0) {
    game.hintDelay -= dt;
    return;
  }
  game.hintCooldown = Math.max(0, game.hintCooldown - dt);
  if (game.hintCooldown > 0) return;
  const next = game.level.hints.find((h, i) => !game.hintsShown.has(i) && game.player.x >= h.triggerX);
  if (!next) return;
  const idx = game.level.hints.indexOf(next);
  game.hintsShown.add(idx);
  game.hintCooldown = 5.5;
  game.ui.showHint(next.text, 6800);
}

function updatePortal(game, dt) {
  const p = game.player;
  if (!p) return;
  if (Math.random() < dt * 7) game.particles.portal(game.portal.x, game.portal.y, game.level.palette.accent);
  if (Math.abs(p.x - game.portal.x) < 38 && p.y > game.portal.y - 112 && p.y < game.portal.y + 12) {
    game.completeLevel();
  }
}

/* ============================================================
   danger
   ============================================================ */

function checkDanger(game) {
  if (game.dead || game.god) return;
  const p = game.player;
  const box = playerRect(p, 4);
  if (game.invuln > 0) return;

  for (const p2 of game.projectiles) {
    if (circleRect(p2.x, p2.y, p2.radius || 5, box)) return killPlayer(game, 'bolt');
  }

  for (const h of game.hazards) {
    if (h.type === 'laser') {
      const cyc = ((game.worldTime + (h.phase || 0)) % h.period) / h.period;
      if (cyc < h.duty && rectsOverlap(box, { x: h.x, y: h.y, w: h.w, h: h.h })) {
        return killPlayer(game, 'laser');
      }
    } else if (h.type === 'saw') {
      const cyc = ((game.worldTime + (h.phase || 0)) % h.period) / h.period;
      const e = .5 - .5 * Math.cos(cyc * TAU);
      const x = h.x + (h.moveX || 0) * e;
      const y = h.y + (h.moveY || 0) * e;
      if (circleRect(x, y, (h.r || 18) + 2, box)) return killPlayer(game, 'saw');
    }
  }

  for (const e of game.enemies) {
    if (e.type === 'sentinel') {
      const body = { x: e.x - 20, y: e.y - 43, w: 40, h: 41 };
      if (rectsOverlap(box, body)) return killPlayer(game, 'sentinel');
    } else if (e.type === 'drone') {
      const bob = Math.sin(game.worldTime * 2 + e.phase) * (e.alert ? 1 : 5);
      if (circleRect(e.x, e.y + bob, 21, box)) return killPlayer(game, 'drone');
    }
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/* ============================================================
   death / respawn / completion helpers
   ============================================================ */

export function killPlayer(game, cause = 'fracture') {
  if (!game.player || game.dead || game.god) return;
  if (game.invuln > 0 && cause !== 'void') return;
  game.dead = true;
  game.deadTimer = 0;
  game.deathsThisRun += 1;
  game.deathWait = game.timeEnergy > 4 ? 3.4 : 2.4;
  game.player.alive = false;
  game.player.vx = 0;
  game.player.vy = 0;
  game.rewinding = false;
  game.input.rewind = false;
  game.ui.setRewinding(false);
  game.audio.rewindStop(true);
  game.audio.death();
  const px = game.player.x, py = game.player.y - 24;
  game.particles.death(px, py + 24, game.level.palette.accent, '#ff4f7b');
  game.camera.shake = game.reducedMotion ? 0 : 13;
  game.flash = { color: '#ff4f7b', alpha: .22 };
  game.ui.hideHint();
  game.ui.showDeath(game.timeEnergy, game.deathWait);
  game.history = game.history.slice(-Math.min(game.history.length, HISTORY_MAX));
}

export function respawnPlayer(game) {
  const deaths = game.deathsThisRun;
  game.audio.rewindStop(true);
  game.dead = false;
  game.deadTimer = 0;
  game.audio.setPaused(false);
  game.ui.hideDeath();
  game.ui.setRewinding(false);
  game.setupLevel(game.levelIndex, { fresh: false });
  game.deathsThisRun = deaths;
  game.timeEnergy = 100;
  game.invuln = 1.7;
  game.player.invuln = 1.7;
  game.echoTimer = 0;
  game.mode = 'playing';
  game.ui.showToast('RECONSTITUTED', game.checkpointIndex >= 0 ? 'Checkpoint timeline restored.' : 'Entry point restored.', 2100);
  game.flash = { color: '#57f2ff', alpha: .2 };
  game.audio.checkpoint();
  game.refreshHud(true);
}

/* ============================================================
   rewind
   ============================================================ */

export function startRewind(game) {
  if (game.rewinding || game.mode !== 'playing') return;
  if (game.timeEnergy <= 2) {
    game.ui.showToast('ENERGY DEPLETED', 'Find a chrono cell to rewind again.', 2000);
    game.audio.tone(120, .2, 'sine', .04, 70);
    return;
  }
  if (game.history.length < 5) {
    game.ui.showToast('TIMELINE TOO SHORT', 'Move for a moment before rewinding.', 1600);
    return;
  }
  const wasDead = game.dead;
  if (game.dead) {
    game.dead = false;
    game.deadTimer = 0;
    game.player.alive = true;
    game.ui.hideDeath();
  }
  game.rewinding = true;
  game.rewindCursor = game.history.length - 1;
  game.rewindAmount = 0;
  game.invuln = 0;
  game.input.jumpBuffer = 0;
  game.audio.rewindStart();
  game.audio.setPaused(false);
  game.ui.setRewinding(true);
  game.ui.setRewindSeconds('−0.00s');
  game.ui.hideHint();
  game.camera.shake = game.reducedMotion ? 0 : 2.4;
  game.flash = { color: '#57f2ff', alpha: .22 };
  if (wasDead) {
    game.particles.add({ type: 'ring', x: game.player.x, y: game.player.y - 26, size: 6, grow: 120, life: .55, color: '#57f2ff', width: 2.2 });
  }
}

function updateRewind(game, dt) {
  game.rewindCursor -= dt * SAMPLE_RATE * REWIND_PLAYBACK;
  game.timeEnergy = Math.max(0, game.timeEnergy - REWIND_DRAIN * dt);
  const maxIndex = game.history.length - 1;
  if (game.rewindCursor <= 0 || game.timeEnergy <= 0 || maxIndex < 1) {
    game.rewindCursor = Math.max(0, game.rewindCursor);
    endRewind(game);
    return;
  }
  applyInterpolated(game, game.rewindCursor);
  const latest = game.history[maxIndex];
  const current = snapshotAt(game, game.rewindCursor);
  game.rewindAmount = Math.max(0, (latest?.time || 0) - (current?.time || 0));
  game.particles.rewindBurst(game.player.x, game.player.y, '#57f2ff');
  game.audio.rewindTick(Math.min(1, game.rewindAmount / 5));
  if (Math.random() < dt * 20) {
    game.particles.add({
      type: 'glyph',
      x: game.player.x + (Math.random() - .5) * 60,
      y: game.player.y - 26 + (Math.random() - .5) * 70,
      vx: (Math.random() - .5) * 30,
      vy: (Math.random() - .5) * 30,
      life: .3 + Math.random() * .4,
      size: 1 + Math.random() * 2.5,
      color: '#57f2ff',
      drag: 1.5,
      spin: (Math.random() - .5) * 8
    });
  }
}

export function endRewind(game) {
  if (!game.rewinding) return;
  const maxIndex = game.history.length - 1;
  const idx = clamp(Math.floor(game.rewindCursor), 0, maxIndex);
  const snap = game.history[idx];
  if (snap) restoreSnapshot(game, snap);
  game.history = game.history.slice(0, idx + 1);
  game.rewindCursor = 0;
  game.rewinding = false;
  game.dead = false;
  game.deadTimer = 0;
  if (game.player) {
    game.player.alive = true;
    game.player.invuln = 1.15;
  }
  game.invuln = 1.15;
  game.sampleTimer = 0;
  game.echoTimer = ECHO_WINDOW;
  game.echoAnnounced = false;
  game.audio.rewindStop();
  game.ui.setRewinding(false);
  game.ui.setRewindSeconds('−0.00s');
  game.camera.shake = game.reducedMotion ? 0 : 3.5;
  game.flash = { color: '#57f2ff', alpha: .18 };
  game.particles.echoPulse(game.player.x, game.player.y, '#ffd36e');
  const hasEcho = game.platforms.some(p => p.kind === 'echo');
  if (hasEcho) {
    game.ui.showToast('ECHO WINDOW', 'Golden platforms are solid for 4.0 seconds.', 1900);
    game.audio.unlockSfx();
  }
  game.recordSnapshot(true);
  game.refreshHud(true);
}

/* ============================================================
   snapshot / restore
   ============================================================ */

export function captureSnapshot(game) {
  const p = game.player;
  return {
    time: game.worldTime,
    player: p ? {
      x: p.x, y: p.y, vx: p.vx, vy: p.vy, facing: p.facing,
      onGround: p.onGround, coyote: p.coyote, jumpBuffer: p.jumpBuffer,
      runPhase: p.runPhase, squash: p.squash, groundId: p.groundId,
      jumpCut: p.jumpCut, alive: p.alive
    } : null,
    enemies: game.enemies.map(e => ({ ...e })),
    projectiles: game.projectiles.map(p2 => ({ ...p2 })),
    platforms: game.platforms.map(p2 => ({
      state: p2.state, timer: p2.timer, fall: p2.fall
    }))
  };
}

function slotSnapshot(game, index) {
  return game.history[clamp(Math.floor(index), 0, game.history.length - 1)];
}

function snapshotAt(game, cursor) {
  const i = Math.floor(cursor);
  const a = game.history[i];
  const b = game.history[Math.min(game.history.length - 1, i + 1)];
  if (!a) return null;
  const t = clamp(cursor - i, 0, 1);
  return { ...a, time: lerp(a.time, b?.time ?? a.time, t) };
}

function applyInterpolated(game, cursor) {
  const i = Math.floor(cursor);
  const a = game.history[i];
  const b = game.history[Math.min(game.history.length - 1, i + 1)];
  if (!a) return;
  const t = clamp(cursor - i, 0, 1);
  game.worldTime = lerp(a.time, b?.time ?? a.time, t);

  if (a.player) {
    game.player = {
      ...game.player,
      ...a.player,
      x: lerp(a.player.x, b?.player?.x ?? a.player.x, t),
      y: lerp(a.player.y, b?.player?.y ?? a.player.y, t),
      vx: lerp(a.player.vx, b?.player?.vx ?? a.player.vx, t),
      vy: lerp(a.player.vy, b?.player?.vy ?? a.player.vy, t),
      invuln: 0,
      alive: true
    };
  }
  game.enemies = a.enemies.map((e, idx) => {
    const nb = b?.enemies?.[idx];
    if (!nb) return { ...e };
    return {
      ...e,
      x: lerp(e.x, nb.x, t),
      y: lerp(e.y, nb.y, t)
    };
  });
  game.projectiles = a.projectiles.map((p, idx) => {
    const np = b?.projectiles?.[idx];
    if (!np) return { ...p };
    return { ...p, x: lerp(p.x, np.x, t), y: lerp(p.y, np.y, t) };
  });
  game.platforms.forEach((p, idx) => {
    const ps = a.platforms[idx];
    if (!ps) return;
    p.state = ps.state;
    p.timer = ps.timer;
    p.fall = ps.fall;
  });
  game.updatePlatformState(0);
}

function restoreSnapshot(game, snap) {
  game.worldTime = snap.time;
  if (snap.player) {
    game.player = {
      ...game.player,
      ...snap.player,
      invuln: 1.15,
      alive: true
    };
  }
  game.enemies = snap.enemies.map(e => ({ ...e }));
  game.projectiles = snap.projectiles.map(p => ({ ...p }));
  game.platforms.forEach((p, idx) => {
    const ps = snap.platforms[idx];
    if (!ps) return;
    p.state = ps.state;
    p.timer = ps.timer;
    p.fall = ps.fall;
  });
  game.updatePlatformState(0);
}
