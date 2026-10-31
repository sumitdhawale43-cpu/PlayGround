import { TAU, clamp, approach, lerp, rand, rectsOverlap } from "./util.js";

const GRAVITY = 2050;
const MAX_FALL = 1120;
const RUN_MAX = 385;
const ACCEL = 2850;
const AIR_ACCEL = 1800;
const FRICTION = 3100;
const JUMP_FORCE = 740;
const DOUBLE_JUMP_FORCE = 680;

export class Player {
  constructor(x, y) {
    this.w = 34;
    this.h = 62;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.groundPlatform = null;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumps = 0;
    this.jumpCut = false;
    this.maxHealth = 100;
    this.health = 100;
    this.maxEnergy = 100;
    this.energy = 100;
    this.energyDelay = 0;
    this.invuln = 0;
    this.hurtTimer = 0;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.airDash = true;
    this.dashStrike = false;
    this.dashStrikeTimer = 0;
    this.dashStrikeHit = false;
    this.attack = null;
    this.attackQueued = false;
    this.attackIndex = 0;
    this.comboTimer = 0;
    this.hitSet = new Set();
    this.slashes = [];
    this.afterimages = [];
    this.time = 0;
    this.runPhase = 0;
    this.alive = true;
    this.deathTimer = 0;
    this.scarf = [];
    for (let i = 0; i < 7; i++) this.scarf.push({ x: this.x + 10, y: this.y + 12, px: this.x + 10, py: this.y + 12 });
    this.stepTimer = 0;
    this.hitFlash = 0;
    this.parryWindow = 0;
    this.idleTime = 0;
    this.shadowY = y + this.h;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get footY() { return this.y + this.h; }

  respawn(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
    this.invuln = 1.2;
    this.hurtTimer = 0; this.dashTime = 0; this.dashCooldown = 0;
    this.attack = null; this.attackQueued = false;
    this.grounded = false; this.jumps = 0; this.alive = true;
    this.afterimages.length = 0;
    this.slashes.length = 0;
  }

  addEnergy(v) {
    this.energy = clamp(this.energy + v, 0, this.maxEnergy);
    this.energyDelay = Math.max(this.energyDelay, 0.45);
  }

  heal(v) {
    this.health = clamp(this.health + v, 0, this.maxHealth);
  }

  update(dt, world, input, game) {
    this.time += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.attackQueued = false;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.rare = 0;
    if (!this.alive) {
      this.deathTimer += dt;
      this.vx = approach(this.vx, 0, 700 * dt);
      this.x += this.vx * dt;
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
      this.y += this.vy * dt;
      this.updateCosmetics(dt, game);
      return;
    }

    // carried by a moving platform
    if (this.groundPlatform && this.grounded) {
      this.x += this.groundPlatform.dx;
      this.y += this.groundPlatform.dy;
    }

    const axis = input.axis;
    const wasGrounded = this.grounded;
    const aliveTime = dt;

    // energy regeneration
    this.energyDelay = Math.max(0, this.energyDelay - dt);
    if (this.energyDelay <= 0 && this.dashTime <= 0) {
      this.energy = Math.min(this.maxEnergy, this.energy + 11 * dt);
    }

    // timers
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.dashStrikeTimer = Math.max(0, this.dashStrikeTimer - dt);
    if (this.dashStrikeTimer <= 0) this.dashStrike = false;

    // jump input
    if (input.consume("jump")) {
      this.jumpBuffer = 0.125;
    }
    if (input.consume("attack")) {
      if (this.dashTime > 0 || this.dashStrikeTimer > 0) {
        this.beginDashStrike(game);
      } else if (this.attack) {
        if (this.attack.t > this.attack.dur * 0.26) this.attackQueued = true;
      } else {
        this.startAttack(game);
      }
    }
    if (input.consume("dash")) {
      if (this.dashTime <= 0 && this.dashCooldown <= 0 && this.energy >= 20 && (this.grounded || this.airDash)) {
        this.startDash(axis, game);
      }
    }

    // dash strike during dash
    if (this.dashStrike && this.dashTime > 0) {
      // already launched
    }

    // horizontal movement
    if (this.hurtTimer > 0.08) {
      this.vx = approach(this.vx, 0, 900 * dt);
    } else if (this.dashTime > 0) {
      this.vx = this.facing * 1120;
      this.vy = 0;
      this.dashTime -= dt;
      this.airDash = this.grounded ? this.airDash : false;
      if (Math.random() < dt * 70) {
        this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, life: 0.22, max: 0.22 });
      }
      if (this.dashTime <= 0) {
        this.vx = this.facing * 410;
        this.dashCooldown = 0.16;
      }
    } else {
      if (axis !== 0) {
        const accel = this.grounded ? ACCEL : AIR_ACCEL;
        this.vx = approach(this.vx, axis * RUN_MAX, accel * dt);
        this.facing = axis > 0 ? 1 : -1;
      } else {
        this.vx = approach(this.vx, 0, (this.grounded ? FRICTION : 700) * dt);
      }
      if (this.attack) this.vx *= Math.pow(0.012, dt);
    }

    // variable-height jump
    if (!input.jumpHeld && this.vy < -270 && !this.jumpCut && this.dashTime <= 0) {
      this.vy *= 0.52;
      this.jumpCut = true;
    }

    // jumping
    if (this.jumpBuffer > 0) {
      if (this.grounded || this.coyote > 0) {
        this.vy = -JUMP_FORCE;
        this.grounded = false;
        this.groundPlatform = null;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.jumps = 1;
        this.jumpCut = false;
        this.energyDelay = Math.max(this.energyDelay, 0.25);
        game?.audio?.play("jump");
        game?.particles?.dust(this.cx, this.footY, "#5df7ff", 6, 90);
      } else if (this.jumps < 2) {
        this.vy = -DOUBLE_JUMP_FORCE;
        this.jumps = 2;
        this.jumpBuffer = 0;
        this.jumpCut = false;
        this.energyDelay = Math.max(this.energyDelay, 0.3);
        game?.audio?.play("doubleJump");
        game?.particles?.ring(this.cx, this.cy + 14, "#5df7ff", 32, 0.28, 2);
        game?.particles?.spark(this.cx, this.cy + 14, "#bffcff", 10, 180);
      }
    }

    // gravity
    if (this.dashTime <= 0) {
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
    }

    // attack state
    if (this.attack) {
      this.attack.t += dt;
      if (this.attack.t >= this.attack.dur) {
        if (this.attackQueued) {
          const next = (this.attack.index + 1) % 3;
          this.startAttack(game, next);
        } else {
          this.attack = null;
          this.comboTimer = 0.55;
        }
      }
    } else {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) this.attackIndex = 0;
    }

    this.comboTimer = Math.max(0, this.comboTimer - dt);

    // integrate with axis-separated collision
    const prevBottom = this.y + this.h;
    const prevTop = this.y;
    this.x += this.vx * dt;
    this.resolveHorizontal(world);
    this.y += this.vy * dt;
    this.resolveVertical(world, prevBottom, prevTop, wasGrounded, game, input);

    // world bounds
    if (this.x < 8) { this.x = 8; this.vx = 0; }
    const maxX = world.arena.active ? world.arena.x1 - this.w - 8 : world.width - this.w - 8;
    if (this.x > maxX) { this.x = maxX; this.vx = Math.min(0, this.vx); }

    // footsteps
    if (this.grounded && Math.abs(this.vx) > 90 && this.dashTime <= 0) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.16 - Math.min(0.08, Math.abs(this.vx) / 8000);
        game?.particles?.dust(this.cx + rand(-5, 5), this.footY, "#78c7d8", 2, 38);
        game?.audio?.play("land");
      }
    }

    if (this.grounded) {
      this.jumps = 0;
      this.airDash = true;
      this.coyote = 0.1;
      if (!wasGrounded && this.vy > 240) {
        game?.particles?.dust(this.cx, this.footY, "#9ec9d8", Math.min(10, 4 + this.vy / 150), 85);
        game?.audio?.play("land");
        game?.addShake?.(Math.min(4, this.vy / 240));
      }
    } else if (this.jumps === 0) {
      // walked off ledge: retain only the air jump after coyote expires
      if (this.coyote <= 0) this.jumps = 1;
    }

    // fall out of world
    if (this.y > 820) game?.playerFell?.();

    // dust while dashing
    if (this.dashTime > 0 && Math.random() < 0.8) {
      game?.particles?.add({
        x: this.cx + rand(-10, 10), y: this.cy + rand(-22, 22),
        vx: -this.facing * rand(60, 220), vy: rand(-40, 40),
        life: rand(0.2, 0.4), size: rand(1, 3), color: "#5df7ff",
        shape: "line", stretch: 2.5, glow: 8, drag: 0.92,
      });
    }

    // passive energy trail
    this.updateCosmetics(dt, game);
  }

  startAttack(game, forcedIndex = null) {
    let index;
    if (forcedIndex !== null) index = forcedIndex;
    else if (this.comboTimer > 0) index = (this.attackIndex + 1) % 3;
    else index = 0;
    this.attackIndex = index;
    const air = !this.grounded;
    const dur = air ? 0.34 : [0.27, 0.29, 0.34][index];
    this.attack = {
      index, t: 0, dur, air,
      activeFrom: air ? 0.055 : [0.045, 0.05, 0.07][index],
      activeTo: air ? 0.21 : [0.14, 0.15, 0.2][index],
    };
    this.hitSet = new Set();
    this.comboTimer = 0.75;
    this.energyDelay = Math.max(this.energyDelay, 0.3);
    const type = air ? "air" : index === 2 ? "overhead" : index === 1 ? "reverse" : "slash";
    this.slashes.push({ age: 0, max: air ? 0.3 : 0.24, type, facing: this.facing, x: this.x + this.w / 2, y: this.y + 27, seed: Math.random() * 4 });
    game?.audio?.play(index === 1 ? "slash2" : index === 2 ? "slash3" : "slash", 1 + index * 0.1);
    game?.addShake?.(index === 2 ? 2.5 : 1.2);
  }

  beginDashStrike(game) {
    if (this.dashStrikeHit) return;
    this.dashStrike = true;
    this.dashStrikeTimer = 0.3;
    this.dashStrikeHit = false;
    this.hitSet = new Set();
    this.dashTime = Math.max(this.dashTime, 0.13);
    this.slashes.push({ age: 0, max: 0.26, type: "dash", facing: this.facing, x: this.x + this.w / 2, y: this.y + 30, seed: Math.random() * 4 });
    game?.audio?.play("slash3");
    game?.audio?.play("dash");
    game?.addShake?.(4);
  }

  startDash(axis, game) {
    this.facing = axis !== 0 ? (axis > 0 ? 1 : -1) : this.facing;
    this.dashTime = 0.17;
    this.invuln = Math.max(this.invuln, 0.24);
    this.energy -= 22;
    this.energyDelay = 0.7;
    this.airDash = this.grounded ? this.airDash : false;
    this.dashStrikeHit = false;
    game?.audio?.play("dash");
    game?.particles?.ring(this.cx, this.cy, "#5df7ff", 30, 0.2, 2);
    game?.particles?.spark(this.cx, this.cy, "#5df7ff", 8, 140);
  }

  resolveHorizontal(world) {
    for (const p of world.platforms) {
      if (p.oneWay) continue;
      if (!rectsOverlap(this, p)) continue;
      if (this.vx > 0) {
        this.x = p.x - this.w - 0.01;
        this.vx = 0;
      } else if (this.vx < 0) {
        this.x = p.x + p.w + 0.01;
        this.vx = 0;
      }
    }
  }

  resolveVertical(world, prevBottom, prevTop, wasGrounded, game, input) {
    this.grounded = false;
    this.groundPlatform = null;
    for (const p of world.platforms) {
      if (!rectsOverlap(this, p)) continue;
      if (this.vy >= 0) {
        const tolerance = p.oneWay ? 12 : 20;
        if (prevBottom <= p.y + tolerance) {
          this.y = p.y - this.h;
          if (this.vy > 620) {
            game?.particles?.dust(this.cx, p.y, "#8fd2e2", 6, 70);
          }
          this.vy = 0;
          this.grounded = true;
          this.groundPlatform = p;
        }
      } else if (!p.oneWay) {
        if (prevTop >= p.y + p.h - 14) {
          this.y = p.y + p.h;
          this.vy = 60;
        }
      }
    }
  }

  getAttackInfo() {
    if (!this.alive) return null;
    if (this.dashStrike && !this.dashStrikeHit && this.dashStrikeTimer > 0) {
      const dir = this.facing;
      return {
        x: dir > 0 ? this.x + 8 : this.x - 100,
        y: this.y + 2,
        w: 126,
        h: 60,
        damage: 34,
        knockX: dir * 460,
        knockY: -210,
        heavy: true,
        kind: "dash",
      };
    }
    if (!this.attack) return null;
    const a = this.attack;
    if (a.t < a.activeFrom || a.t > a.activeTo) return null;
    const dir = this.facing;
    if (a.air) {
      return {
        x: this.cx - 62, y: this.y - 2, w: 124, h: 68,
        damage: 16, knockX: dir * 200, knockY: -170, heavy: false, kind: "air",
      };
    }
    const idx = a.index;
    const reach = [84, 92, 104][idx];
    return {
      x: dir > 0 ? this.x + this.w - 8 : this.x - reach + 8,
      y: this.y + (idx === 2 ? -4 : 10),
      w: reach,
      h: idx === 2 ? 76 : 48,
      damage: [12, 14, 20][idx],
      knockX: dir * (idx === 2 ? 330 : 180),
      knockY: idx === 2 ? -330 : -60,
      heavy: idx === 2,
      kind: "combo",
    };
  }

  registerHit(kind) {
    if (kind === "dash") this.dashStrikeHit = true;
    this.addEnergy(kind === "dash" ? 12 : 7);
    this.energyDelay = Math.max(this.energyDelay, 0.4);
  }

  takeDamage(amount, fromX, game, opts = {}) {
    if (!this.alive) return false;
    if (this.invuln > 0 && !opts.ignoreInvuln) return false;
    if (this.dashTime > 0 && !opts.ignoreInvuln) return false;
    this.health -= amount;
    this.hitFlash = 1;
    this.invuln = opts.invuln ?? 0.9;
    this.hurtTimer = 0.24;
    const dir = fromX === undefined ? -this.facing : (this.cx < fromX ? -1 : 1);
    this.vx = dir * (opts.knockback ?? 260);
    this.vy = Math.min(this.vy, -180);
    this.attack = null;
    this.dashTime = 0;
    this.attackQueued = false;
    game?.onPlayerHurt?.();
    game?.audio?.play("hurt");
    game?.addShake?.(opts.shake ?? 8);
    game?.flashDamage?.();
    game?.hitstop?.(0.045);
    game?.particles?.hit(this.cx, this.cy, "#ff5a7a", true);
    game?.particles?.text(this.cx, this.y - 4, `-${Math.round(amount)}`, "#ff8aa0", 13);
    if (this.health <= 0) {
      this.health = 0;
      this.die(game);
    }
    return true;
  }

  die(game) {
    if (!this.alive) return;
    this.alive = false;
    this.deathTimer = 0;
    this.vy = -340;
    this.vx = -this.facing * 120;
    game?.audio?.play("death");
    game?.onPlayerDeath?.();
  }

  updateCosmetics(dt, game) {
    // run cycle
    if (this.grounded && Math.abs(this.vx) > 20) this.runPhase += dt * (5 + Math.abs(this.vx) * 0.028);
    else if (this.grounded) this.runPhase += dt * 1.6;
    // scarf follows head
    const targetX = this.x + this.w / 2 - this.facing * 12;
    const targetY = this.y + 15;
    const points = this.scarf;
    points[0].x = targetX;
    points[0].y = targetY;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      p.x += (prev.x - p.x) * Math.min(1, dt * 16);
      p.y += (prev.y - p.y) * Math.min(1, dt * 16);
      p.x -= this.vx * dt * 0.06;
      p.y += (18 + i * 1.5) * dt;
      p.y += Math.sin(this.time * 4 - i * 0.7) * 7 * dt;
    }
    // afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const a = this.afterimages[i];
      a.life -= dt;
      if (a.life <= 0) this.afterimages.splice(i, 1);
    }
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.age += dt;
      if (s.age >= s.max) this.slashes.splice(i, 1);
    }
    // passive trail when very fast
    if (this.grounded && Math.abs(this.vx) > 300 && Math.random() < dt * 10) {
      game?.particles?.add({
        x: this.cx - this.facing * 12, y: this.footY - rand(4, 30),
        vx: -this.facing * rand(10, 60), vy: rand(-20, 8),
        life: rand(0.2, 0.4), size: rand(1, 2.5), color: "#5df7ff", glow: 5, drag: 0.94,
      });
    }
  }

  // ------------------------------------------------------------------ DRAW
  draw(ctx, game, time) {
    // shadow
    ctx.save();
    const shadowY = this.grounded ? this.footY : Math.min(this.footY + 40, 640);
    const g = ctx.createRadialGradient(this.cx, shadowY, 2, this.cx, shadowY, 32);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(this.cx, shadowY, 26, 6, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // afterimages
    for (const a of this.afterimages) {
      const alpha = (a.life / a.max) * 0.32;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#5df7ff";
      ctx.shadowColor = "#5df7ff";
      ctx.shadowBlur = 16;
      ctx.fillRect(a.x + 4, a.y + 8, this.w - 8, this.h - 10);
      ctx.restore();
    }

    // slash effects
    for (const s of this.slashes) this.drawSlash(ctx, s);

    if (!this.alive && this.deathTimer > 0.01) {
      // death dissolve flicker
    }

    const flicker = this.invuln > 0 && this.invuln < 0.9 && Math.floor(this.time * 24) % 2 === 0;
    if (flicker) return;

    ctx.save();
    ctx.translate(this.cx, this.footY);
    ctx.scale(this.facing * 1.14, 1.14);

    const run = clamp(Math.abs(this.vx) / RUN_MAX, 0, 1);
    const phase = this.runPhase;
    const airborne = !this.grounded;
    const dashing = this.dashTime > 0;
    const attacking = !!this.attack || this.dashStrike;
    const hurt = this.hurtTimer > 0.05;
    const bob = this.grounded && !dashing ? Math.sin(phase * 2) * 1.2 * (1 - run) : 0;

    // soft energy backlight to separate the silhouette from the city
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const aura = ctx.createRadialGradient(0, -34, 4, 0, -34, 46);
    aura.addColorStop(0, "rgba(93,247,255,0.10)");
    aura.addColorStop(0.55, "rgba(93,247,255,0.035)");
    aura.addColorStop(1, "rgba(93,247,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(0, -34, 32, 44, 0, 0, TAU); ctx.fill();
    ctx.restore();

    // scarf behind
    this.drawScarf(ctx);

    // legs
    let legA = 0, legB = 0, footLift = 0;
    if (airborne) {
      legA = 0.75; legB = -0.5;
      if (this.vy < 0) { legA = 0.95; legB = -0.7; }
    } else if (attack_in_progress(this)) {
      legA = 0.35; legB = -0.35;
    } else {
      legA = Math.sin(phase) * 0.8 * run;
      legB = -Math.sin(phase) * 0.8 * run;
    }
    const hipY = -27 + bob;
    const hipX = -1;
    const stance = airborne ? 6 : 7 + run * 3;
    this.limb(ctx, hipX, hipY, hipX + Math.sin(legA) * 7, -14 + Math.abs(Math.sin(legA)) * 1, -2 + legA * 1.2, 6.2, "#11192b");
    this.limb(ctx, hipX, hipY, hipX + Math.sin(legB) * 7, -14, -2 + legB * 1.2, 6.2, "#0a1020");
    // boots
    ctx.fillStyle = "#2b3b55";
    ctx.fillRect(-4 + legacyFoot(legA), -5, 11, 5);
    ctx.fillStyle = "#1c2940";
    ctx.fillRect(-4 + legacyFoot(legB), -5, 11, 5);

    // torso
    const torsoGrad = ctx.createLinearGradient(-10, -52, 12, -24);
    torsoGrad.addColorStop(0, "#1b2940");
    torsoGrad.addColorStop(0.6, "#0d1526");
    torsoGrad.addColorStop(1, "#070c16");
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.moveTo(-8, -49 + bob);
    ctx.lineTo(9, -46 + bob);
    ctx.lineTo(7, -27 + bob);
    ctx.lineTo(-7, -28 + bob);
    ctx.closePath();
    ctx.fill();
    // chest armor highlight
    ctx.strokeStyle = "rgba(93,247,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -44 + bob); ctx.lineTo(5, -42 + bob); ctx.lineTo(4, -33 + bob);
    ctx.stroke();
    // belt
    ctx.fillStyle = "#ff3fce";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(-8, -29 + bob, 16, 2);
    ctx.globalAlpha = 1;

    // back arm
    const backArm = attacking ? -0.5 : Math.sin(phase) * 0.5 * run;
    this.limb(ctx, -4, -44 + bob, -10, -35 + bob, -8 + backArm * 5, -25 + bob, 4.3, "#0c1422");
    ctx.fillStyle = "#121d30";
    ctx.beginPath(); ctx.arc(-8 + backArm * 5, -24 + bob, 2.6, 0, TAU); ctx.fill();

    // head
    const headX = 2, headY = -57 + bob;
    ctx.save();
    ctx.translate(headX, headY);
    ctx.fillStyle = "#111a2b";
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, TAU);
    ctx.fill();
    // helmet crest
    ctx.fillStyle = "#1e2e49";
    ctx.beginPath();
    ctx.moveTo(-8, -3); ctx.lineTo(-2, -13); ctx.lineTo(7, -9); ctx.lineTo(8, -2); ctx.closePath();
    ctx.fill();
    // visor
    ctx.shadowColor = "#5df7ff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#9bfbff";
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(8.5, -1.6);
    ctx.lineTo(8.5, 1.6);
    ctx.lineTo(0, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // scarf collar
    ctx.fillStyle = "#ff3fce";
    ctx.fillRect(-9, 5, 13, 2.5);
    ctx.restore();

    // front arm & sword
    if (attacking) this.drawAttackPose(ctx, bob);
    else this.drawIdleArm(ctx, bob, phase, run, airborne, dashing);

    // rim light
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#5df7ff";
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-7, -47 + bob); ctx.lineTo(-8, -28 + bob);
    ctx.stroke();
    // forward edge catch-light (cyan on the leading silhouette)
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#bdfbff";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(8.2, -50 + bob);
    ctx.lineTo(9.2, -44 + bob);
    ctx.lineTo(7.4, -29 + bob);
    ctx.lineTo(8.2, -25 + bob);
    ctx.stroke();
    // helmet rim
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(2, -57 + bob, 8.6, -1.5, 0.7);
    ctx.stroke();
    // boot energy soles
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#5df7ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3 + legacyFoot(legA), -1);
    ctx.lineTo(6 + legacyFoot(legA), -1);
    ctx.moveTo(-3 + legacyFoot(legB), -1);
    ctx.lineTo(6 + legacyFoot(legB), -1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();

    // dash energy streaks
    if (this.dashTime > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#5df7ff";
      ctx.shadowColor = "#5df7ff";
      ctx.shadowBlur = 14;
      for (let i = 0; i < 4; i++) {
        const y = this.y + 14 + i * 11;
        ctx.beginPath();
        ctx.moveTo(this.x - this.facing * (10 + i * 9), y);
        ctx.lineTo(this.x - this.facing * (70 + i * 20), y + rand(-2, 2));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawScarf(ctx) {
    const pts = this.scarf;
    if (pts.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let layer = 0; layer < 2; layer++) {
      ctx.beginPath();
      ctx.moveTo(-6, -51);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const x = p.x - (this.cx) + (layer === 0 ? 0 : 2);
        const y = p.y - this.footY + (layer === 0 ? 0 : 3);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = layer === 0 ? "rgba(255,63,206,0.85)" : "rgba(255,160,235,0.4)";
      ctx.lineWidth = layer === 0 ? 4 : 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#ff3fce";
      ctx.shadowBlur = layer === 0 ? 12 : 6;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawIdleArm(ctx, bob, phase, run, airborne, dashing) {
    let handX, handY, elbowX, elbowY;
    if (dashing) {
      handX = 12; handY = -34; elbowX = 7; elbowY = -41;
    } else if (airborne) {
      handX = 11; handY = -42; elbowX = 9; elbowY = -46;
    } else {
      const swing = Math.sin(phase + Math.PI) * 0.55 * run;
      handX = 5 + swing * 7;
      handY = -30 + Math.abs(swing) * 2;
      elbowX = 7 + swing * 4;
      elbowY = -38 + bob;
    }
    this.limb(ctx, 4, -44 + bob, elbowX, elbowY, handX, handY, 4.2, "#152136");
    ctx.fillStyle = "#5df7ff";
    ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(handX, handY, 1.4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // sheathed katana on back
    ctx.save();
    ctx.translate(-7, -40 + bob);
    ctx.rotate(-0.62);
    ctx.strokeStyle = "#1a2740";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(31, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(93,247,255,0.75)";
    ctx.lineWidth = 1;
    ctx.shadowColor = "#5df7ff";
    ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(31, 0); ctx.stroke();
    ctx.restore();
  }

  drawAttackPose(ctx, bob) {
    let t;
    let kind;
    if (this.dashStrike && this.dashStrikeTimer > 0) {
      t = 1 - this.dashStrikeTimer / 0.3;
      kind = "dash";
    } else if (this.attack) {
      t = clamp(this.attack.t / this.attack.dur, 0, 1);
      kind = this.attack.air ? "air" : this.attack.index === 2 ? "overhead" : "combo";
    } else {
      t = 0; kind = "combo";
    }
    let handX = 20, handY = -38, elbowX = 12, elbowY = -40;
    let swordAngle = -0.5;
    if (kind === "dash") {
      handX = 30; handY = -36; elbowX = 16; elbowY = -41;
      swordAngle = -0.06;
    } else if (kind === "air") {
      const a = t * TAU;
      handX = Math.cos(a) * 14 + 8;
      handY = Math.sin(a) * 12 - 36;
      elbowX = handX * 0.7;
      elbowY = handY * 0.85 - 4;
      swordAngle = a + 1.4;
    } else if (kind === "overhead") {
      swordAngle = -1.9 + t * 3.1;
      handX = 17 + t * 8; handY = -43 + t * 12;
      elbowX = 9; elbowY = -42;
    } else {
      const idx = this.attack?.index ?? 0;
      if (idx === 1) {
        swordAngle = 1.75 - t * 3.4;
        handX = 15 - t * 2; handY = -33;
      } else {
        swordAngle = -1.45 + t * 3.0;
        handX = 19 + t * 4; handY = -38 - t * 2;
      }
      elbowX = 11; elbowY = -40;
    }
    this.limb(ctx, 4, -44 + bob, elbowX, elbowY, handX, handY, 4.4, "#18263e");
    // glove
    ctx.fillStyle = "#0a1220";
    ctx.beginPath(); ctx.arc(handX, handY, 3, 0, TAU); ctx.fill();
    // katana
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(swordAngle);
    // hilt
    ctx.strokeStyle = "#161c2b";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(1, 0); ctx.stroke();
    ctx.strokeStyle = "#ff3fce";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, 0); ctx.stroke();
    // guard
    ctx.fillStyle = "#2a3b55";
    ctx.fillRect(0, -4, 2.5, 8);
    // blade
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#5df7ff";
    ctx.shadowBlur = 15;
    const grad = ctx.createLinearGradient(2, 0, 54, 0);
    grad.addColorStop(0, "#eaffff");
    grad.addColorStop(0.6, "#b9fbff");
    grad.addColorStop(1, "rgba(93,247,255,0.35)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(52, -1.5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(4, -0.6);
    ctx.lineTo(50, -2);
    ctx.stroke();
    ctx.restore();
    // arc afterimage near blade
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#5df7ff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(8, -36 + bob, 39, swordAngle - 0.45, swordAngle + 0.1);
    ctx.stroke();
    ctx.restore();
  }

  drawSlash(ctx, s) {
    const p = s.age / s.max;
    const alpha = Math.sin(Math.min(1, p * 1.6) * Math.PI) * (1 - p * 0.5);
    if (alpha <= 0) return;
    const dir = s.facing;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(dir, 1);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.85;
    ctx.shadowColor = "#5df7ff";
    ctx.shadowBlur = 18;
    let start, end, radius, width;
    if (s.type === "dash") {
      start = -0.9; end = 0.7; radius = 92; width = 9;
    } else if (s.type === "overhead") {
      start = -2.5; end = 1.4; radius = 72; width = 7;
    } else if (s.type === "air") {
      start = -2.8 + p * 1.5; end = start + TAU * 0.8; radius = 64; width = 6;
    } else if (s.type === "reverse") {
      start = 1.9 - p * 0.4; end = -1.4; radius = 68; width = 6;
    } else {
      start = -1.7 + p * 0.3; end = 0.9; radius = 66; width = 6;
    }
    const beats = s.type === "dash" ? 3 : 2;
    for (let i = 0; i < beats; i++) {
      const rr = radius - i * 7;
      ctx.globalAlpha = alpha * (0.7 - i * 0.2);
      ctx.lineWidth = width - i * 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, rr, start, end, false);
      ctx.strokeStyle = i === 0 ? "#eaffff" : "#5df7ff";
      ctx.stroke();
    }
    ctx.globalAlpha = alpha * 0.35;
    ctx.lineWidth = width * 2.4;
    ctx.strokeStyle = "#5df7ff";
    ctx.beginPath();
    ctx.arc(0, 0, radius, start, end, false);
    ctx.stroke();
    ctx.restore();
  }

  limb(ctx, x1, y1, x2, y2, x3, y3, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }
}

function attack_in_progress(p) {
  return !!p.attack || p.dashStrike;
}
function legacyFoot(angle) {
  return Math.sin(angle) * 8;
}
