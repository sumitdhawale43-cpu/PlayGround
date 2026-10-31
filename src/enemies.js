import { TAU, clamp, approach, rand, lerp, rectsOverlap, dist2 } from "./util.js";

let boltId = 0;

export class Bolt {
  constructor(x, y, vx, vy, opts = {}) {
    this.id = ++boltId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = opts.r ?? 6;
    this.damage = opts.damage ?? 10;
    this.life = opts.life ?? 3.6;
    this.maxLife = this.life;
    this.color = opts.color ?? "#ff5a6e";
    this.trailColor = opts.trailColor ?? this.color;
    this.owner = opts.owner ?? "enemy";
    this.type = opts.type ?? "bolt";
    this.gravity = opts.gravity ?? 0;
    this.dead = false;
    this.trail = [];
    this.spin = rand(0, TAU);
  }

  update(dt, world, game) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += dt * 5;
    this.trail.push({ x: this.x, y: this.y, life: 0.18 });
    if (this.trail.length > 8) this.trail.shift();
    for (const t of this.trail) t.life -= dt;
    if (this.y > 760 || this.x < 0 || this.x > world.width) this.dead = true;
    // projectile hits terrain
    for (const p of world.platforms) {
      if (p.oneWay) continue;
      if (this.x > p.x && this.x < p.x + p.w && this.y > p.y && this.y < p.y + Math.min(p.h, 16)) {
        this.dead = true;
        game?.particles?.spark(this.x, this.y, this.color, 5, 100);
        return;
      }
    }
  }

  draw(ctx, time) {
    const a = clamp(this.life / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      if (t.life <= 0) continue;
      ctx.globalAlpha = a * (i / this.trail.length) * 0.35;
      ctx.fillStyle = this.trailColor;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.r * (i / this.trail.length) * 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    if (this.type === "blade") {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.spin);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -this.r * 2.2);
      ctx.lineTo(this.r, this.r);
      ctx.lineTo(0, this.r * 0.4);
      ctx.lineTo(-this.r, this.r);
      ctx.closePath();
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 2.6);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, this.color);
      g.addColorStop(1, "rgba(255,60,90,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.55, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

class Enemy {
  constructor(spawn) {
    this.type = spawn.type;
    this.spawn = { x: spawn.x, y: spawn.y };
    this.zone = spawn.zone ?? 0;
    this.elite = !!spawn.elite;
    this.dead = false;
    this.deathTimer = 0;
    this.active = false;
    this.awake = false;
    this.health = 50;
    this.maxHealth = 50;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.grounded = false;
    this.groundPlatform = null;
    this.hitFlash = 0;
    this.hitStun = 0;
    this.time = rand(0, 10);
    this.attackCooldown = rand(0.8, 2);
    this.once = false;
    this.score = 100;
    this.orbDrop = 2;
    this.alpha = 1;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  activateIfNear(player) {
    if (!this.awake) {
      const dx = Math.abs(player.cx - this.cx);
      const dy = Math.abs(player.cy - this.cy);
      if (dx < 640 && dy < 380) {
        this.awake = true;
        this.active = true;
        this.onWake?.();
      }
    } else {
      this.active = Math.abs(player.cx - this.cx) < 1150;
    }
  }

  hurt(damage, dirX, dirY, game, info = {}) {
    if (this.dead) return false;
    this.health -= damage;
    this.hitFlash = 1;
    this.hitStun = Math.max(this.hitStun, 0.08);
    this.awake = true;
    this.active = true;
    this.vx += dirX * (info.heavy ? 1 : 0.45);
    if (this.vy === 0 && dirY < 0) this.vy = dirY * 0.5;
    game?.particles?.hit(this.cx, this.cy - 4, info.heavy ? "#fff3b0" : "#c9ffff", info.heavy);
    game?.particles?.text(this.cx + rand(-8, 8), this.y - 6, `${Math.round(damage)}`, info.heavy ? "#fff3b0" : "#bffcff", info.heavy ? 16 : 12);
    game?.audio?.play(info.heavy ? "heavy" : "hit");
    game?.addShake?.(info.heavy ? 6 : 2.5);
    game?.hitstop?.(info.heavy ? 0.06 : 0.032);
    if (this.health <= 0) {
      this.die(game);
      return true;
    }
    return false;
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    this.deathTimer = 0;
    this.health = 0;
    game?.onEnemyKilled?.(this);
    game?.particles?.explosion(this.cx, this.cy, this.elite ? "#ffc36b" : "#ff7a4d", this.elite ? 1.35 : 0.9);
    game?.audio?.play("enemyDie");
    game?.addShake?.(this.elite ? 9 : 5);
  }

  physics(dt, world, game, gravity = 1900) {
    this.vy = Math.min(1050, this.vy + gravity * dt);
    const prevBottom = this.y + this.h;
    this.x += this.vx * dt;
    this.grounded = false;
    this.groundPlatform = null;
    if (this.x < 20) { this.x = 20; this.vx = 0; }
    for (const p of world.platforms) {
      if (p.oneWay) continue;
      if (!rectsOverlap(this, p)) continue;
      if (this.vx > 0) { this.x = p.x - this.w; this.vx = 0; }
      else if (this.vx < 0) { this.x = p.x + p.w; this.vx = 0; }
    }
    this.y += this.vy * dt;
    for (const p of world.platforms) {
      if (!rectsOverlap(this, p)) continue;
      if (this.vy >= 0) {
        const tolerance = p.oneWay ? 13 : 20;
        if (prevBottom <= p.y + tolerance) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.grounded = true;
          this.groundPlatform = p;
        }
      }
    }
    if (this.y > 760) this.die(game);
  }

  contact(player, game, damage = 7) {
    if (this.dead) return;
    if (rectsOverlap(this, player)) {
      player.takeDamage(damage, this.cx, game, { knockback: 220, shake: 5 });
    }
  }

  updateCommon(dt) {
    this.time += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4.2);
    this.hitStun = Math.max(0, this.hitStun - dt);
    if (this.dead) {
      this.deathTimer += dt;
      this.alpha = Math.max(0, 1 - this.deathTimer * 2);
    }
  }

  drawHealth(ctx) {
    if (this.dead || this.health >= this.maxHealth) return;
    const w = this.elite ? 58 : 44;
    const y = this.y - (this.type === "drone" ? 18 : 14);
    ctx.save();
    ctx.translate(this.cx - w / 2, y);
    ctx.fillStyle = "rgba(4,4,10,0.8)";
    ctx.fillRect(0, 0, w, 4);
    ctx.fillStyle = this.elite ? "#ffc36b" : "#ff5a6e";
    ctx.shadowColor = "#ff5a6e";
    ctx.shadowBlur = 6;
    ctx.fillRect(0, 0, w * clamp(this.health / this.maxHealth, 0, 1), 4);
    ctx.restore();
  }

  telegraph(ctx, time, color = "#ff3e62") {
    const r = 34 + Math.sin(time * 14) * 5;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- DRONE
export class Drone extends Enemy {
  constructor(spawn) {
    super(spawn);
    this.w = 44;
    this.h = 34;
    this.x = spawn.x;
    this.y = spawn.y;
    this.maxHealth = this.health = 32;
    this.score = 120;
    this.orbDrop = 2;
    this.baseY = spawn.y;
    this.diveTimer = 0;
    this.diving = false;
    this.diveDir = { x: 0, y: 0 };
    this.telegraphTimer = 0;
    this.returnTimer = 0;
    this.bobPhase = rand(0, TAU);
  }

  onWake() {}
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt, player, world, game, projectiles) {
    this.updateCommon(dt);
    if (this.dead) return;
    this.activateIfNear(player);
    if (!this.active) {
      this.y = this.baseY + Math.sin(this.time * 1.5 + this.bobPhase) * 8;
      return;
    }
    if (this.hitStun > 0) { this.x += this.vx * dt; this.vx *= 0.9; return; }
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    const dist = Math.hypot(dx, dy);
    this.facing = dx > 0 ? 1 : -1;

    if (this.diving) {
      this.diveTimer -= dt;
      this.x += this.diveDir.x * 620 * dt;
      this.y += this.diveDir.y * 620 * dt;
      if (Math.random() < 0.8) game?.particles?.add({ x: this.cx, y: this.cy, vx: rand(-20, 20), vy: rand(-10, 20), life: 0.35, size: rand(2, 4), color: "#ff3e62", glow: 8, drag: 0.94 });
      this.contact(player, game, 13);
      if (this.diveTimer <= 0) {
        this.diving = false;
        this.returnTimer = 0.9;
        this.attackCooldown = rand(2.2, 3.1);
        game?.particles?.ring(this.cx, this.cy, "#ff3e62", 30, 0.25, 2);
      }
      return;
    }

    // return to hover height
    if (this.returnTimer > 0) {
      this.returnTimer -= dt;
      const ty = player.y - 160 + Math.sin(this.time * 2) * 26;
      const tx = player.cx - this.facing * 140;
      this.x = approach(this.x, tx, 260 * dt);
      this.y = approach(this.y, ty, 260 * dt);
      this.contact(player, game, 8);
      return;
    }

    // hover / reposition
    const targetX = player.cx - Math.sign(dx || 1) * 190 + Math.sin(this.time * 1.1 + this.bobPhase) * 50;
    const targetY = player.y - 170 + Math.sin(this.time * 2.1 + this.bobPhase) * 18;
    this.x = approach(this.x, targetX, 170 * dt);
    this.y = approach(this.y, targetY, 180 * dt);
    this.contact(player, game, 8);
    this.attackCooldown -= dt;

    if (this.telegraphTimer > 0) {
      this.telegraphTimer -= dt;
      this.x += rand(-1.5, 1.5);
      this.y += rand(-1.5, 1.5);
      if (this.telegraphTimer <= 0) {
        this.diving = true;
        this.diveTimer = 0.48;
        const len = Math.hypot(dx, dy) || 1;
        this.diveDir = { x: dx / len * 0.75 + this.facing * 0.35, y: dy / len * 0.75 + 0.25 };
        const l = Math.hypot(this.diveDir.x, this.diveDir.y) || 1;
        this.diveDir.x /= l; this.diveDir.y /= l;
        game?.audio?.play("dash");
        game?.addShake?.(3);
      }
    } else if (this.attackCooldown <= 0 && dist < 540) {
      this.telegraphTimer = 0.5;
      this.attackCooldown = 3.5;
      game?.audio?.play("ui");
    }
  }

  draw(ctx, time) {
    if (this.dead && this.alpha <= 0) return;
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.globalAlpha = this.alpha;
    if (this.telegraphTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      this.telegraph(ctx, time, "#ff3e62");
      ctx.restore();
    }
    const tilt = clamp(this.vx / 600, -0.4, 0.4);
    ctx.rotate(tilt);
    // thruster glow
    ctx.globalCompositeOperation = "lighter";
    const tg = ctx.createRadialGradient(0, 20, 0, 0, 20, 20);
    tg.addColorStop(0, "rgba(93,247,255,0.55)");
    tg.addColorStop(1, "rgba(93,247,255,0)");
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.arc(0, 22, 20, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    // rotor fins
    ctx.strokeStyle = "#293a55";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 2; i++) {
      const a = time * (this.diving ? 15 : 7) + i * Math.PI;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 7, a, 0, TAU);
      ctx.stroke();
    }
    // body
    const g = ctx.createLinearGradient(0, -14, 0, 15);
    g.addColorStop(0, "#3c4966");
    g.addColorStop(0.45, "#1b2438");
    g.addColorStop(1, "#0a0e18");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(93,247,255,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // eye
    ctx.shadowColor = this.telegraphTimer > 0 ? "#ff3e62" : "#ff5a6e";
    ctx.shadowBlur = 16;
    ctx.fillStyle = this.telegraphTimer > 0 ? "#ffffff" : "#ff5a6e";
    ctx.beginPath();
    ctx.ellipse(this.facing * 6, 0, 5.5, 3, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    // antenna
    ctx.strokeStyle = "#4b5f80";
    ctx.beginPath();
    ctx.moveTo(0, -13); ctx.lineTo(0, -22);
    ctx.stroke();
    ctx.fillStyle = "#ff3fce";
    ctx.fillRect(-1.4, -24, 2.8, 2.8);
    ctx.restore();
    this.drawHealth(ctx);
  }
}

// ---------------------------------------------------------------- MELEE
export class MeleeBot extends Enemy {
  constructor(spawn) {
    super(spawn);
    this.w = 42;
    this.h = 60;
    this.x = spawn.x;
    this.y = spawn.y - this.h;
    this.maxHealth = this.health = spawn.elite ? 110 : 58;
    this.score = spawn.elite ? 300 : 150;
    this.orbDrop = spawn.elite ? 4 : 2;
    this.speed = spawn.elite ? 170 : 125;
    this.state = "idle";
    this.stateTimer = 0;
    this.attackCooldown = rand(0.6, 1.4);
    this.swing = 0;
    this.jumpCooldown = 0;
    this.patrolDir = 1;
    this.spawnX = spawn.x;
  }

  update(dt, player, world, game, projectiles) {
    this.updateCommon(dt);
    if (this.dead) return;
    this.activateIfNear(player);
    if (!this.active) {
      this.physics(dt, world, game);
      this.vx = Math.sin(this.time * 0.8) * 16;
      return;
    }
    if (this.hitStun > 0) {
      this.physics(dt, world, game);
      this.vx *= 0.9;
      return;
    }
    this.attackCooldown -= dt;
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    const adx = Math.abs(dx);
    this.facing = dx > 0 ? 1 : -1;
    this.contact(player, game, 6);

    if (this.state === "idle" || this.state === "chase") {
      if (!this.awake || adx > 520) {
        this.state = "idle";
        this.vx = Math.sin(this.time * 0.9) * 22;
      } else {
        this.state = "chase";
        if (adx > 82) this.vx = approach(this.vx, this.facing * this.speed, 700 * dt);
        else this.vx = approach(this.vx, 0, 800 * dt);
        // hop up to player
        if (this.grounded && player.y < this.y - 46 && adx < 150 && this.jumpCooldown <= 0) {
          this.vy = -620;
          this.jumpCooldown = 1.8;
          game?.particles?.dust(this.cx, this.y + this.h, "#b57a5a", 6, 60);
        }
        if (adx < 150 && Math.abs(dy) < 80 && this.attackCooldown <= 0) {
          this.state = "telegraph";
          this.stateTimer = this.elite ? 0.38 : 0.48;
          this.swing = 0;
          game?.audio?.play("ui");
        }
      }
    } else if (this.state === "telegraph") {
      this.vx *= 0.8;
      this.stateTimer -= dt;
      this.swing = Math.min(1, this.swing + dt * 2.5);
      if (this.stateTimer <= 0) {
        this.state = "strike";
        this.stateTimer = 0.24;
        this.vx = this.facing * (this.elite ? 560 : 440);
        this.attackHit = new Set();
        game?.audio?.play("slash2");
      }
    } else if (this.state === "strike") {
      this.stateTimer -= dt;
      this.vx = approach(this.vx, 0, 900 * dt);
      const hb = {
        x: this.facing > 0 ? this.x + this.w - 10 : this.x - 48,
        y: this.y + 8, w: 76, h: 48,
      };
      if (rectsOverlap(hb, player)) player.takeDamage(this.elite ? 22 : 15, this.cx, game, { knockback: 280, shake: 6 });
      if (this.stateTimer <= 0) {
        this.state = "recover";
        this.stateTimer = 0.48;
        this.attackCooldown = this.elite ? 0.55 : 0.9;
        this.swing = 0;
      }
    } else if (this.state === "recover") {
      this.stateTimer -= dt;
      this.vx = approach(this.vx, 0, 600 * dt);
      if (this.stateTimer <= 0) this.state = "chase";
    }

    if (this.grounded && this.groundPlatform) this.x += this.groundPlatform.dx;
    this.physics(dt, world, game);
  }

  draw(ctx, time) {
    if (this.dead && this.alpha <= 0) return;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.facing, 1);
    ctx.globalAlpha = this.alpha;
    if (this.elite) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(0, -30, 0, 0, -30, 55);
      g.addColorStop(0, "rgba(255,195,107,0.2)");
      g.addColorStop(1, "rgba(255,195,107,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, -30, 55, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (this.state === "telegraph") {
      ctx.save();
      this.telegraph(ctx, time, this.elite ? "#ffc36b" : "#ff3e62");
      ctx.restore();
    }
    const lean = this.state === "strike" ? 0.18 : this.state === "chase" ? 0.06 * Math.sign(this.vx) : 0;
    ctx.rotate(lean);
    const walk = this.grounded ? Math.sin(this.time * 8) * Math.min(1, Math.abs(this.vx) / 80) : 0;
    // legs
    ctx.strokeStyle = "#1b2438";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, -22); ctx.lineTo(-10 + walk * 7, -12); ctx.lineTo(-12 + walk * 12, -1);
    ctx.moveTo(7, -22); ctx.lineTo(10 - walk * 7, -12); ctx.lineTo(13 - walk * 12, -1);
    ctx.stroke();
    ctx.strokeStyle = "#ff5a3c";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10 + walk * 7, -12); ctx.lineTo(-12 + walk * 12, -1);
    ctx.moveTo(10 - walk * 7, -12); ctx.lineTo(13 - walk * 12, -1);
    ctx.stroke();
    // torso
    const g = ctx.createLinearGradient(-14, -52, 14, -20);
    g.addColorStop(0, this.elite ? "#4a3a22" : "#2d3348");
    g.addColorStop(0.6, "#141a29");
    g.addColorStop(1, "#080c14");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-15, -48);
    ctx.lineTo(14, -46);
    ctx.lineTo(11, -22);
    ctx.lineTo(-11, -23);
    ctx.closePath();
    ctx.fill();
    // shoulder plates
    ctx.fillStyle = this.elite ? "#5a4726" : "#232b3e";
    ctx.beginPath(); ctx.moveTo(-23, -49); ctx.lineTo(-10, -52); ctx.lineTo(-7, -39); ctx.lineTo(-20, -37); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(22, -48); ctx.lineTo(9, -51); ctx.lineTo(7, -38); ctx.lineTo(20, -36); ctx.closePath(); ctx.fill();
    // core
    ctx.shadowColor = this.elite ? "#ffc36b" : "#ff5a3c";
    ctx.shadowBlur = 13;
    ctx.fillStyle = this.elite ? "#ffc36b" : "#ff5a3c";
    ctx.beginPath(); ctx.arc(0, -35, 3.2, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    // head
    ctx.fillStyle = "#1b2234";
    ctx.fillRect(-7, -57, 15, 9);
    ctx.fillStyle = this.elite ? "#ffe2a0" : "#ff7b6a";
    ctx.fillRect(2, -54, 6, 2);
    ctx.fillStyle = "#5d6d88";
    ctx.fillRect(-8, -59, 2, 3);
    // sword arm
    const swingAngle = this.state === "telegraph" ? lerp(0.5, -1.9, this.swing) : this.state === "strike" ? 1.25 : -0.25;
    ctx.save();
    ctx.translate(17, -42);
    ctx.rotate(swingAngle);
    ctx.strokeStyle = "#0c111b";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.fillStyle = "#2b3852";
    ctx.fillRect(9, -3, 3, 6);
    // blade
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = this.elite ? "#ffdca0" : "#ff8b76";
    ctx.shadowColor = this.elite ? "#ffc36b" : "#ff5a3c";
    ctx.shadowBlur = 13;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(11, 0); ctx.lineTo(52, -3);
    ctx.stroke();
    ctx.restore();
    // eye glow
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = this.elite ? "#ffc36b" : "#ff3e62";
    ctx.beginPath(); ctx.arc(3, -53, 13, 0, TAU); ctx.fill();
    ctx.restore();
    this.drawHealth(ctx);
  }
}

// ---------------------------------------------------------------- GUNNER
export class Gunner extends Enemy {
  constructor(spawn) {
    super(spawn);
    this.w = 46;
    this.h = 52;
    this.x = spawn.x;
    this.y = spawn.y - this.h;
    this.maxHealth = this.health = 46;
    this.score = 180;
    this.orbDrop = 2;
    this.state = "idle";
    this.stateTimer = 0;
    this.burst = 0;
    this.burstTimer = 0;
    this.aimAngle = 0;
    this.recoil = 0;
  }

  update(dt, player, world, game, projectiles) {
    this.updateCommon(dt);
    if (this.dead) return;
    this.activateIfNear(player);
    if (!this.active) {
      this.physics(dt, world, game);
      return;
    }
    if (this.hitStun > 0) { this.physics(dt, world, game); return; }
    const dx = player.cx - this.cx;
    const dy = (player.cy - 6) - (this.y + 18);
    const adx = Math.abs(dx);
    this.facing = dx > 0 ? 1 : -1;
    this.aimAngle = Math.atan2(dy, dx);
    this.recoil = Math.max(0, this.recoil - dt * 5);
    this.attackCooldown -= dt;
    this.contact(player, game, 5);

    if (this.state === "idle" || this.state === "move") {
      this.state = "move";
      if (adx > 340) this.vx = approach(this.vx, this.facing * 100, 400 * dt);
      else if (adx < 240) this.vx = approach(this.vx, -this.facing * 90, 400 * dt);
      else this.vx = approach(this.vx, 0, 400 * dt);
      if (this.attackCooldown <= 0 && adx < 620) {
        this.state = "telegraph";
        this.stateTimer = 0.42;
        this.burst = 3;
        this.burstTimer = 0;
        game?.audio?.play("ui");
      }
    } else if (this.state === "telegraph") {
      this.vx *= 0.82;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = "fire";
        this.burstTimer = 0;
        this.attackCooldown = rand(2.2, 3.1);
      }
    } else if (this.state === "fire") {
      this.vx *= 0.85;
      this.burstTimer -= dt;
      if (this.burstTimer <= 0 && this.burst > 0) {
        this.burst--;
        this.burstTimer = 0.11;
        this.recoil = 1;
        const spread = rand(-0.07, 0.07);
        const speed = 390;
        const ox = this.cx + Math.cos(this.aimAngle) * 32;
        const oy = this.y + 18 + Math.sin(this.aimAngle) * 10;
        projectiles.push(new Bolt(ox, oy, Math.cos(this.aimAngle + spread) * speed, Math.sin(this.aimAngle + spread) * speed, {
          color: "#ff8a5c", trailColor: "#ffc36b", damage: 9, r: 5, life: 4,
        }));
        game?.audio?.play("laser");
        game?.particles?.spark(ox, oy, "#ffc36b", 4, 120);
        game?.addShake?.(1.5);
      }
      if (this.burst <= 0 && this.burstTimer <= 0) {
        this.state = "move";
        this.stateTimer = 0.5;
      }
    }
    if (this.grounded && this.groundPlatform) this.x += this.groundPlatform.dx;
    this.physics(dt, world, game);
  }

  draw(ctx, time) {
    if (this.dead && this.alpha <= 0) return;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.globalAlpha = this.alpha;
    if (this.state === "telegraph" || this.state === "fire") {
      ctx.save();
      this.telegraph(ctx, time, "#ffc36b");
      ctx.restore();
    }
    const walk = this.grounded ? Math.sin(this.time * 6) * Math.min(1, Math.abs(this.vx) / 70) : 0;
    // tripod legs
    ctx.strokeStyle = "#1d2538";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, -24); ctx.lineTo(-17 + walk * 6, -1);
    ctx.moveTo(8, -24); ctx.lineTo(17 - walk * 6, -1);
    ctx.moveTo(0, -24); ctx.lineTo(-4, -2);
    ctx.stroke();
    // body
    const g = ctx.createLinearGradient(-14, -50, 14, -24);
    g.addColorStop(0, "#35405c");
    g.addColorStop(0.55, "#181f30");
    g.addColorStop(1, "#080b13");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-15, -47);
    ctx.lineTo(13, -47);
    ctx.lineTo(16, -30);
    ctx.lineTo(-16, -30);
    ctx.closePath();
    ctx.fill();
    // head visor
    ctx.fillStyle = "#121a29";
    ctx.fillRect(-8, -55, 17, 8);
    ctx.shadowColor = "#ff5a6e";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff7b6a";
    ctx.fillRect(-5, -53, 11, 2.2);
    ctx.shadowBlur = 0;
    // cannon arm
    ctx.save();
    ctx.translate(8, -38);
    ctx.rotate(this.aimAngle - 0.05 * this.recoil);
    ctx.fillStyle = "#2b3550";
    ctx.fillRect(-4, -5, 24, 10);
    ctx.fillStyle = "#0b101a";
    ctx.fillRect(16, -3.5, 14, 7);
    ctx.strokeStyle = "rgba(255,195,107,0.7)";
    ctx.strokeRect(16, -3.5, 14, 7);
    if (this.state === "telegraph" || this.state === "fire") {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#ffc36b";
      ctx.shadowColor = "#ffc36b";
      ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(31, 0, 2.5 + Math.sin(time * 20) * 1, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // shoulder antenna
    ctx.strokeStyle = "#4b5b7a";
    ctx.beginPath(); ctx.moveTo(-13, -47); ctx.lineTo(-16, -60); ctx.stroke();
    ctx.fillStyle = "#5df7ff";
    ctx.fillRect(-17, -62, 2, 2);
    ctx.restore();
    this.drawHealth(ctx);
  }
}

export function createEnemy(spawn) {
  if (spawn.type === "drone") return new Drone(spawn);
  if (spawn.type === "gunner") return new Gunner(spawn);
  return new MeleeBot(spawn);
}
