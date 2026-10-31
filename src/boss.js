import { TAU, clamp, approach, rand, lerp, rectsOverlap } from "./util.js";
import { Bolt } from "./enemies.js";

export class Boss {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.w = 96;
    this.h = 158;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.maxHealth = 880;
    this.health = this.maxHealth;
    this.phase = 1;
    this.state = "intro";
    this.stateTimer = 1.7;
    this.cooldown = 1.4;
    this.time = 0;
    this.hitFlash = 0;
    this.invuln = true;
    this.dead = false;
    this.deathTimer = 0;
    this.airOffset = 0;
    this.slashes = [];
    this.waves = [];
    this.afterimages = [];
    this.attackStep = 0;
    this.attackHit = false;
    this.telegraphTimer = 0;
    this.laserY = 0;
    this.laserActive = 0;
    this.laserCharge = 0;
    this.groundY = y + this.h;
    this.arena = game.world.arena;
    this.score = 5000;
    this.roared = false;
    this.defeatReported = false;
    this.slow = 1;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  hurt(damage, dirX, dirY, game, info = {}) {
    if (this.dead || this.state === "dying" || this.state === "phase") return false;
    if (this.state === "intro") return false;
    this.health -= damage;
    this.hitFlash = 1;
    game?.particles?.hit(this.cx + this.facing * 10, this.cy, info.heavy ? "#fff3b0" : "#ffd0d8", info.heavy);
    game?.particles?.text(this.cx + rand(-20, 20), this.y + 20, `${Math.round(damage)}`, info.heavy ? "#fff3b0" : "#ffd0d8", info.heavy ? 19 : 14);
    game?.audio?.play("bossHit");
    game?.addShake?.(info.heavy ? 7 : 3.5);
    game?.hitstop?.(info.heavy ? 0.05 : 0.025);
    if (this.health <= 0) {
      this.health = 0;
      this.die(game);
      return true;
    }
    const nextPhase = this.health <= this.maxHealth * 0.33 ? 3 : this.health <= this.maxHealth * 0.66 ? 2 : 1;
    if (nextPhase > this.phase) {
      this.phase = nextPhase;
      this.enterPhase(game);
    }
    return false;
  }

  enterPhase(game) {
    this.state = "phase";
    this.stateTimer = 1.45;
    this.invuln = true;
    this.vx = 0;
    this.laserCharge = 0;
    this.laserActive = 0;
    game?.audio?.play("bossRoar");
    game?.addShake?.(14);
    game?.hitstop?.(0.1);
    game?.particles?.explosion(this.cx, this.cy, "#ff3e62", 1.6);
    game?.particles?.ring(this.cx, this.cy, "#ffc36b", 220, 0.8, 6);
    game?.onBossPhase?.(this.phase);
  }

  die(game) {
    this.dead = true;
    this.state = "dying";
    this.deathTimer = 0;
    this.invuln = true;
    this.vx = 0;
    game?.audio?.play("bossDie");
    game?.addShake?.(18);
    game?.hitstop?.(0.14);
    game?.slowmo?.(0.35, 1.4);
    game?.onBossDefeated?.(this);
  }

  begin(state, timer) {
    this.state = state;
    this.stateTimer = timer;
    this.attackHit = false;
  }

  update(dt, player, world, game, projectiles) {
    this.time += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    if (this.state === "dying") {
      this.deathTimer += dt;
      this.stateTimer -= dt;
      if (Math.random() < dt * 12) {
        const ex = this.cx + rand(-70, 70), ey = this.y + rand(0, this.h);
        game?.particles?.explosion(ex, ey, Math.random() > 0.5 ? "#ffc36b" : "#ff5a3e", rand(0.5, 1.1));
        game?.audio?.play("enemyDie");
      }
      this.y += dt * 8;
      if (this.stateTimer <= 0 && !this.defeatReported) {
        this.defeatReported = true;
        game?.onVictory?.();
      }
      return;
    }
    if (this.state === "intro") {
      this.stateTimer -= dt;
      this.facing = player.cx < this.cx ? -1 : 1;
      if (this.stateTimer <= 0) {
        this.invuln = false;
        this.state = "idle";
        this.stateTimer = 0.7;
      }
      return;
    }
    if (this.state === "phase") {
      this.stateTimer -= dt;
      this.airOffset = -Math.sin(clamp((1.45 - this.stateTimer) / 1.45, 0, 1) * Math.PI) * 24;
      if (Math.random() < dt * 14) {
        game?.particles?.add({
          x: this.cx + rand(-60, 60), y: this.y + rand(0, this.h),
          vx: rand(-80, 80), vy: rand(-220, -60), life: rand(0.4, 0.9),
          size: rand(2, 5), color: this.phase === 2 ? "#ffc36b" : "#ff3e62", glow: 10, drag: 0.96,
        });
      }
      if (this.stateTimer <= 0) {
        this.invuln = false;
        this.airOffset = 0;
        this.state = "idle";
        this.stateTimer = 0.4;
        this.cooldown = 0.4;
      }
      return;
    }
    if (this.state === "stagger") {
      this.stateTimer -= dt;
      this.vx = approach(this.vx, 0, 900 * dt);
      this.move(dt, world);
      if (this.stateTimer <= 0) {
        this.state = "idle";
        this.stateTimer = 0.3;
      }
      return;
    }

    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.cooldown -= dt;
    this.stateTimer -= dt;
    this.facing = player.cx < this.cx ? -1 : 1;
    const speedMult = this.phase === 1 ? 1 : this.phase === 2 ? 1.2 : 1.45;

    // contact body damage
    if (rectsOverlap(this, player)) {
      player.takeDamage(9, this.cx, game, { knockback: 300, shake: 6 });
    }

    switch (this.state) {
      case "idle": {
        this.vx = approach(this.vx, 0, 800 * dt);
        const dx = player.cx - this.cx;
        if (Math.abs(dx) > 300) this.vx = approach(this.vx, Math.sign(dx) * 55 * speedMult, 300 * dt);
        if (this.stateTimer <= 0 && this.cooldown <= 0) this.chooseAttack(player, game);
        break;
      }
      case "walk": {
        const dx = player.cx - this.cx;
        this.vx = approach(this.vx, Math.sign(dx) * 95 * speedMult, 500 * dt);
        if (this.stateTimer <= 0) { this.state = "idle"; this.stateTimer = 0.25; }
        break;
      }
      case "slash": {
        this.vx = approach(this.vx, 0, 900 * dt);
        const total = 1.0;
        const p = 1 - this.stateTimer / total;
        if (p < 0.38) {
          this.telegraphTimer = 1 - p / 0.38;
        } else if (p < 0.55) {
          this.telegraphTimer = 0;
          if (this.attackHit !== 1) {
            this.attackHit = 1;
            const hb = { x: this.facing > 0 ? this.x + 40 : this.x - 90, y: this.y + 10, w: 160, h: 120 };
            if (rectsOverlap(hb, player)) player.takeDamage(this.phase === 3 ? 20 : 16, this.cx, game, { knockback: 340, shake: 7 });
            this.addSlash(game, this.facing, 1, 0);
            game?.audio?.play("slash3");
            game?.addShake?.(6);
          }
          this.vx = this.facing * 130;
        } else if (p < 0.72) {
          if (this.attackHit !== 2) {
            this.attackHit = 2;
            const hb = { x: this.facing > 0 ? this.x + 40 : this.x - 90, y: this.y + 10, w: 160, h: 120 };
            if (rectsOverlap(hb, player)) player.takeDamage(this.phase === 3 ? 24 : 19, this.cx, game, { knockback: 360, shake: 8 });
            this.addSlash(game, this.facing, -1, 1);
            game?.audio?.play("slash3");
            game?.addShake?.(7);
          }
        } else {
          this.attackHit = false;
        }
        if (this.stateTimer <= 0) {
          this.state = "recover";
          this.stateTimer = this.phase === 3 ? 0.32 : 0.55;
        }
        break;
      }
      case "dashSlash": {
        const p = 1 - this.stateTimer / 0.62;
        if (p < 0.5) {
          this.vx = 0;
          this.telegraphTimer = p / 0.5;
        } else {
          this.telegraphTimer = 0;
          if (this.attackStep === 0) { this.attackStep = 1; game?.audio?.play("slash3"); }
          this.vx = this.facing * 980 * speedMult;
          if (Math.random() < 0.75) this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, life: 0.2, max: 0.2 });
          if (!this.attackHit && rectsOverlap(this, player)) {
            player.takeDamage(this.phase === 3 ? 24 : 18, this.cx, game, { knockback: 390, shake: 8 });
            this.attackHit = true;
          }
          if (p > 0.78) this.addSlash(game, this.facing, 2, 0);
        }
        if (this.stateTimer <= 0) {
          this.vx = 0;
          this.state = "recover";
          this.stateTimer = this.phase === 3 ? 0.3 : 0.5;
        }
        break;
      }
      case "volley": {
        this.vx = 0;
        const total = this.phase === 3 ? 1.5 : 1.3;
        const p = 1 - this.stateTimer / total;
        if (p < 0.3) {
          this.telegraphTimer = 1 - p / 0.3;
        } else {
          this.telegraphTimer = 0;
          this.fireTimer -= dt;
          const waves = this.phase === 3 ? 3 : 2;
          const shots = this.phase === 3 ? 3 : 1;
          if (this.fireTimer <= 0 && this.attackStep < waves) {
            this.attackStep++;
            this.fireTimer = 0.3;
            const base = Math.atan2(player.cy - (this.y + 40), player.cx - this.cx);
            for (let i = 0; i < shots; i++) {
              const spread = (i - (shots - 1) / 2) * 0.2;
              const speed = 350;
              projectiles.push(new Bolt(this.cx + this.facing * 30, this.y + 46, Math.cos(base + spread) * speed, Math.sin(base + spread) * speed, {
                color: "#ff3e62", trailColor: "#ff9aae", damage: 11, r: 6, life: 4, type: "blade",
              }));
            }
            game?.audio?.play("laser");
            game?.addShake?.(2);
          }
        }
        if (this.stateTimer <= 0) {
          this.state = "recover";
          this.stateTimer = 0.4;
          this.attackStep = 0;
        }
        break;
      }
      case "shockwave": {
        this.vx = 0;
        const p = 1 - this.stateTimer / 1.25;
        if (p < 0.55) {
          this.telegraphTimer = p / 0.55;
        } else if (!this.attackHit && p > 0.62) {
          this.attackHit = true;
          this.spawnWaves(game);
          game?.audio?.play("shockwave");
          game?.addShake?.(12);
          game?.particles?.dust(this.cx, 640, "#ff8a5c", 20, 200);
          game?.particles?.ring(this.cx, 620, "#ffc36b", 100, 0.4, 4);
        }
        if (this.stateTimer <= 0) {
          this.state = "recover";
          this.stateTimer = 0.45;
        }
        break;
      }
      case "storm": {
        this.vx = 0;
        const total = 1.8;
        const p = 1 - this.stateTimer / total;
        this.telegraphTimer = p < 0.55 ? p / 0.55 : 0;
        if (p < 0.55) {
          this.airOffset = -Math.sin(p / 0.55 * Math.PI * 0.5) * 150;
        } else if (p > 0.62) {
          this.airOffset = 0;
          if (!this.attackHit) {
            this.attackHit = true;
            this.spawnWaves(game);
            const base = rand(0, TAU);
            for (let i = 0; i < 12; i++) {
              const a = base + i / 12 * TAU;
              projectiles.push(new Bolt(this.cx, this.y + 55, Math.cos(a) * 270, Math.sin(a) * 270, {
                color: "#ffc36b", trailColor: "#ff5a3e", damage: 10, r: 5, life: 3, type: "blade",
              }));
            }
            game?.audio?.play("bossRoar");
            game?.audio?.play("shockwave");
            game?.addShake?.(15);
            game?.particles?.explosion(this.cx, 620, "#ff5a3e", 1.4);
          }
        }
        if (this.stateTimer <= 0) {
          this.state = "recover";
          this.stateTimer = 0.55;
        }
        break;
      }
      case "laser": {
        this.vx = 0;
        const total = 1.5;
        const p = 1 - this.stateTimer / total;
        if (p < 0.18) {
          this.telegraphTimer = p / 0.18;
          this.laserY = player.cy;
        } else if (p < 0.62) {
          this.telegraphTimer = 0.3;
          this.laserCharge = (p - 0.18) / 0.44;
          this.laserY = lerp(this.laserY, player.cy, dt * 3);
        } else if (p < 0.82) {
          this.laserCharge = 0;
          this.laserActive = 1;
          const beam = { x: this.arena.x0, y: this.laserY - 14, w: this.arena.x1 - this.arena.x0, h: 28 };
          if (rectsOverlap(beam, player)) {
            player.takeDamage(22, this.cx, game, { knockback: 320, shake: 8 });
          }
          if (!this.laserSound) { game?.audio?.play("laser"); this.laserSound = true; }
        } else {
          this.laserActive = 0;
        }
        if (this.stateTimer <= 0) {
          this.laserActive = 0;
          this.laserCharge = 0;
          this.laserSound = false;
          this.state = "recover";
          this.stateTimer = 0.45;
        }
        break;
      }
      case "recover": {
        this.vx = approach(this.vx, 0, 900 * dt);
        if (this.stateTimer <= 0) {
          this.state = "idle";
          this.stateTimer = 0.25;
          this.cooldown = this.phase === 1 ? 0.7 : this.phase === 2 ? 0.45 : 0.24;
        }
        break;
      }
      default:
        this.state = "idle";
        this.stateTimer = 0.3;
    }

    if (this.state !== "idle" && this.telegraphTimer < 0.3) {
      this.airOffset = lerp(this.airOffset, 0, dt * 8);
    }
    this.move(dt, world);
    this.updateWaves(dt, player, game);
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
  }

  chooseAttack(player, game) {
    const dist = Math.abs(player.cx - this.cx);
    const options = [];
    if (dist < 230) options.push("slash", "shockwave");
    if (dist >= 160) options.push("dashSlash");
    options.push("volley");
    if (this.phase >= 2) options.push("laser");
    if (this.phase >= 3) options.push("storm");
    if (this.phase === 1 && Math.random() < 0.3) options.push("walk");
    let choice = options[Math.floor(Math.random() * options.length)];
    if (choice === "slash") { this.begin("slash", 1.0); this.attackStep = 0; }
    else if (choice === "dashSlash") { this.begin("dashSlash", 0.62); this.attackStep = 0; }
    else if (choice === "volley") { this.begin("volley", this.phase === 3 ? 1.5 : 1.3); this.attackStep = 0; this.fireTimer = 0.22; }
    else if (choice === "shockwave") this.begin("shockwave", 1.25);
    else if (choice === "laser") { this.begin("laser", 1.5); this.laserSound = false; this.laserY = player.cy; }
    else if (choice === "storm") this.begin("storm", 1.8);
    else this.begin("walk", 0.7);
    this.telegraphTimer = 0;
  }

  spawnWaves(game) {
    for (const dir of [-1, 1]) {
      this.waves.push({ x: this.cx + dir * 40, y: 620, dir, speed: 430 * (dir > 0 ? 1 : 0.92), life: 2.4, hit: false, phase: Math.random() * 4 });
    }
    game?.particles?.ring(this.cx, 620, "#ffc36b", 140, 0.5, 5);
  }

  updateWaves(dt, player, game) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.x += w.dir * w.speed * dt;
      w.life -= dt;
      const rect = { x: w.x - 22, y: w.y - 30, w: 44, h: 34 };
      if (!w.hit && rectsOverlap(rect, player)) {
        w.hit = true;
        player.takeDamage(15, w.x, game, { knockback: 260, shake: 6 });
      }
      if (w.life <= 0 || w.x < this.arena.x0 - 60 || w.x > this.arena.x1 + 60) this.waves.splice(i, 1);
    }
  }

  addSlash(game, dir, kind, variant) {
    this.slashes.push({ age: 0, max: 0.28, dir, kind, variant });
  }

  move(dt, world) {
    this.x += this.vx * dt;
    if (this.x < this.arena.x0 + 50) { this.x = this.arena.x0 + 50; this.vx = Math.max(0, this.vx); }
    if (this.x + this.w > this.arena.x1 - 20) { this.x = this.arena.x1 - 20 - this.w; this.vx = Math.min(0, this.vx); }
    this.y = this.groundY - this.h + this.airOffset;
  }

  // ------------------------------------------------------------- DRAW
  draw(ctx, game, time) {
    // waves under boss
    for (const w of this.waves) this.drawWave(ctx, w, time);
    // afterimages
    for (const a of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = (a.life / a.max) * 0.22;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#ff3e62";
      ctx.shadowColor = "#ff3e62";
      ctx.shadowBlur = 20;
      ctx.fillRect(a.x + 10, a.y + 20, this.w - 20, this.h - 30);
      ctx.restore();
    }
    // slash effects
    for (const s of this.slashes) this.drawSlash(ctx, s);

    ctx.save();
    const shakeX = this.telegraphTimer > 0.01 ? Math.sin(time * 70) * this.telegraphTimer * 3 : 0;
    ctx.translate(this.cx + shakeX, this.y + this.h);
    ctx.scale(this.facing, 1);
    if (this.state === "dying") {
      ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 2.8);
      ctx.rotate(Math.min(0.4, this.deathTimer * 0.12));
    }
    const bob = Math.sin(time * 1.7) * 2;
    const walk = Math.abs(this.vx) > 20 ? Math.sin(time * 7) * 6 : 0;
    const phaseColor = this.phase === 3 ? "#ffc36b" : this.phase === 2 ? "#ff7a3e" : "#ff3e62";
    const heat = this.phase === 3 ? 1 : 0;

    // aura
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const aura = ctx.createRadialGradient(0, -80, 10, 0, -80, 130);
    aura.addColorStop(0, `rgba(255,62,98,${0.1 + heat * 0.05})`);
    aura.addColorStop(0.5, `rgba(255,62,98,${0.045 + heat * 0.03})`);
    aura.addColorStop(1, "rgba(255,62,98,0)");
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(0, -80, 130, 0, TAU); ctx.fill();
    ctx.restore();

    // cape ribbons
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-11, -125);
      const sway = Math.sin(time * 2.4 + i) * 12;
      ctx.quadraticCurveTo(-52 - i * 10, -100 + i * 14 + sway, -80 - i * 18, -52 + i * 22 + sway * 1.5);
      ctx.strokeStyle = i === 0 ? "rgba(255,63,206,0.55)" : "rgba(255,63,206,0.22)";
      ctx.lineWidth = 7 - i * 1.8;
      ctx.lineCap = "round";
      ctx.shadowColor = "#ff3fce";
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.restore();

    // legs
    ctx.strokeStyle = "#1a1a2b";
    ctx.lineWidth = 15;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-22, -75); ctx.lineTo(-30 + walk, -42); ctx.lineTo(-40 + walk, -6);
    ctx.moveTo(21, -75); ctx.lineTo(30 - walk, -42); ctx.lineTo(42 - walk, -6);
    ctx.stroke();
    ctx.strokeStyle = "#2c2b44";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-23, -68); ctx.lineTo(-30 + walk, -43);
    ctx.moveTo(22, -68); ctx.lineTo(30 - walk, -43);
    ctx.stroke();
    // feet
    ctx.fillStyle = "#171726";
    ctx.fillRect(-54 + walk, -10, 28, 10);
    ctx.fillRect(28 - walk, -10, 30, 10);
    ctx.fillStyle = phaseColor;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(-52 + walk, -7, 9, 1.5);
    ctx.fillRect(30 - walk, -7, 9, 1.5);
    ctx.globalAlpha = 1;

    // tassets / skirt armor
    ctx.fillStyle = "#12121f";
    ctx.beginPath();
    ctx.moveTo(-31, -82); ctx.lineTo(31, -82); ctx.lineTo(24, -46); ctx.lineTo(-24, -46); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,62,98,0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = i % 2 ? "#1d1c30" : "#181726";
      ctx.fillRect(i * 12 - 5, -80, 9, 30);
      ctx.fillStyle = phaseColor;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(i * 12 - 5, -54, 9, 1);
      ctx.globalAlpha = 1;
    }

    // torso
    const torsoGrad = ctx.createLinearGradient(-45, -145, 50, -75);
    torsoGrad.addColorStop(0, "#2a2841");
    torsoGrad.addColorStop(0.4, "#171628");
    torsoGrad.addColorStop(1, "#0a0912");
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.moveTo(-36, -138 + bob);
    ctx.lineTo(34, -138 + bob);
    ctx.lineTo(42, -102 + bob);
    ctx.lineTo(28, -72 + bob);
    ctx.lineTo(-26, -72 + bob);
    ctx.lineTo(-42, -100 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,62,98,0.22)";
    ctx.stroke();
    // chest ribs
    ctx.strokeStyle = "rgba(138,92,255,0.28)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-28, -124 + i * 13 + bob);
      ctx.quadraticCurveTo(0, -118 + i * 13 + bob, 28, -124 + i * 13 + bob);
      ctx.stroke();
    }
    // core
    const corePulse = 0.65 + Math.sin(time * 3.3) * 0.18 + heat * 0.2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 26;
    const core = ctx.createRadialGradient(0, -108 + bob, 0, 0, -108 + bob, 20);
    core.addColorStop(0, "#fff");
    core.addColorStop(0.28, phaseColor);
    core.addColorStop(1, "rgba(255,62,98,0)");
    ctx.fillStyle = core;
    ctx.globalAlpha = corePulse;
    ctx.beginPath(); ctx.arc(0, -108 + bob, 20, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0, -108 + bob, 3.4, 0, TAU); ctx.fill();
    ctx.restore();

    // shoulder pauldrons
    const shoulderRaise = (this.state === "shockwave" || this.state === "laser") ? -8 : 0;
    ctx.fillStyle = "#242339";
    ctx.strokeStyle = "rgba(255,62,98,0.4)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-40, -138 + bob); ctx.lineTo(-64, -128 + bob + shoulderRaise); ctx.lineTo(-58, -109 + bob + shoulderRaise); ctx.lineTo(-34, -118 + bob); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(40, -138 + bob); ctx.lineTo(64, -128 + bob + shoulderRaise); ctx.lineTo(58, -109 + bob + shoulderRaise); ctx.lineTo(34, -118 + bob); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // spikes
    ctx.fillStyle = phaseColor;
    ctx.beginPath(); ctx.moveTo(-63, -128 + shoulderRaise + bob); ctx.lineTo(-78, -145 + shoulderRaise + bob); ctx.lineTo(-56, -136 + shoulderRaise + bob); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(63, -128 + shoulderRaise + bob); ctx.lineTo(81, -147 + shoulderRaise + bob); ctx.lineTo(56, -136 + shoulderRaise + bob); ctx.closePath(); ctx.fill();

    // head + horned helmet
    ctx.save();
    ctx.translate(0, -158 + bob);
    ctx.fillStyle = "#191827";
    ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.fill();
    // helmet crest
    ctx.fillStyle = "#29273f";
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(-10, -20); ctx.lineTo(0, -26); ctx.lineTo(12, -19); ctx.lineTo(20, 0); ctx.lineTo(8, -6); ctx.lineTo(-8, -6); ctx.closePath();
    ctx.fill();
    // horns
    ctx.fillStyle = phaseColor;
    ctx.beginPath(); ctx.moveTo(-17, -14); ctx.lineTo(-34, -38); ctx.lineTo(-12, -22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(17, -14); ctx.lineTo(35, -40); ctx.lineTo(12, -22); ctx.closePath(); ctx.fill();
    // mask
    ctx.fillStyle = "#0a0912";
    ctx.fillRect(-13, -7, 26, 14);
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fff";
    ctx.fillRect(-10, -3, 8, 2.4);
    ctx.fillRect(3, -3, 8, 2.4);
    ctx.shadowBlur = 0;
    // mask vents
    ctx.strokeStyle = "rgba(255,62,98,0.5)";
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(-5 + i * 4, 5); ctx.lineTo(-5 + i * 4, 9); }
    ctx.stroke();
    ctx.restore();

    // arms + swords
    this.drawArms(ctx, bob, phaseColor, time);

    // hit flash
    if (this.hitFlash > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = this.hitFlash * 0.55;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, -95, 55, 85, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // telegraph circle under boss
    if (this.telegraphTimer > 0.02 && this.state !== "phase") {
      ctx.save();
      ctx.translate(this.cx, 620);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.25 + this.telegraphTimer * 0.4;
      ctx.strokeStyle = "#ff3e62";
      ctx.shadowColor = "#ff3e62";
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 70 + this.telegraphTimer * 50, 18 + this.telegraphTimer * 10, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    // laser telegraph / beam
    if (this.state === "laser") {
      if (this.laserCharge > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.2 + this.laserCharge * 0.6;
        ctx.strokeStyle = "#ffc36b";
        ctx.lineWidth = 1 + this.laserCharge * 3;
        ctx.shadowColor = "#ff3e62";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(this.cx, this.y + 46);
        const targetX = this.facing > 0 ? this.arena.x1 : this.arena.x0;
        ctx.lineTo(targetX, this.laserY);
        ctx.stroke();
        ctx.restore();
      }
      if (this.laserActive > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const y = this.laserY;
        const grad = ctx.createLinearGradient(0, y - 16, 0, y + 16);
        grad.addColorStop(0, "rgba(255,62,98,0)");
        grad.addColorStop(0.28, "rgba(255,62,98,0.6)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.72, "rgba(255,62,98,0.6)");
        grad.addColorStop(1, "rgba(255,62,98,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(this.arena.x0, y - 17, this.arena.x1 - this.arena.x0, 34);
        ctx.strokeStyle = "rgba(255,240,200,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.arena.x0, y); ctx.lineTo(this.arena.x1, y); ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawArms(ctx, bob, phaseColor, time) {
    let angleL = 0.5, angleR = 0.6, lift = 0;
    if (this.state === "slash") {
      const p = 1 - this.stateTimer / 1.0;
      angleR = p < 0.38 ? lerp(0.6, -2.4, p / 0.38) : p < 0.72 ? lerp(-2.4, 1.1, (p - 0.38) / 0.34) : 1.1;
      angleL = -0.3;
    } else if (this.state === "dashSlash") {
      angleR = 0.15; angleL = 0.4;
    } else if (this.state === "volley") {
      angleR = -1.1; angleL = -0.9;
    } else if (this.state === "shockwave") {
      const p = 1 - this.stateTimer / 1.25;
      angleR = p < 0.55 ? lerp(0.6, -2.6, p / 0.55) : lerp(-2.6, 1.5, (p - 0.55) / 0.3);
      angleL = -2.0;
    } else if (this.state === "storm") {
      angleR = -1.9 - Math.sin(time * 20) * 0.3; angleL = -1.9 + Math.sin(time * 20) * 0.3;
    } else if (this.state === "laser") {
      angleR = -0.9; angleL = 0.9; lift = -8;
    } else if (this.state === "phase") {
      angleR = -2.2; angleL = 2.2;
    } else if (this.state === "recover") {
      angleR = 1.1; angleL = 0.5;
    }
    const armY = -126 + bob + lift;
    // left arm (back)
    this.drawArm(ctx, -32, armY, angleL, "#1a1930", phaseColor, false, time);
    // right arm (front)
    this.drawArm(ctx, 32, armY, angleR, "#242239", phaseColor, true, time);
  }

  drawArm(ctx, sx, sy, angle, color, glow, front, time) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    // upper arm
    ctx.strokeStyle = color;
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(28, 8);
    ctx.stroke();
    // forearm
    ctx.strokeStyle = "#2f2c48";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(28, 8); ctx.lineTo(54, 18);
    ctx.stroke();
    // hand
    ctx.fillStyle = "#0d0c16";
    ctx.beginPath(); ctx.arc(56, 19, 6, 0, TAU); ctx.fill();
    // blade
    const glowCol = this.phase === 3 ? "#ffc36b" : "#ff5a7a";
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = glowCol;
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(58, 16);
    ctx.lineTo(128, -6);
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(61, 15);
    ctx.lineTo(126, -6);
    ctx.stroke();
    // hilt
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#0b0a12";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(48, 20); ctx.lineTo(58, 16);
    ctx.stroke();
    ctx.restore();
  }

  drawWave(ctx, w, time) {
    const alpha = clamp(w.life / 0.5, 0, 1);
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.scale(w.dir, 1);
    ctx.shadowColor = "#ffc36b";
    ctx.shadowBlur = 24;
    // ground fissure
    ctx.fillStyle = "rgba(255,195,107,0.65)";
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(-8, -34 - Math.sin(time * 18 + w.phase) * 6);
    ctx.lineTo(4, -20);
    ctx.lineTo(20, -48 - Math.sin(time * 20) * 8);
    ctx.lineTo(30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff4d6";
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(0, -24); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,120,80,0.3)";
    ctx.fillRect(-30, -4, 60, 4);
    ctx.restore();
  }

  drawSlash(ctx, s) {
    const p = s.age / s.max;
    const alpha = Math.sin(Math.min(1, p * 1.5) * Math.PI);
    ctx.save();
    ctx.translate(this.cx, this.y + 40);
    ctx.scale(s.dir, 1);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = s.variant ? "#ffc36b" : "#ff6a82";
    ctx.shadowColor = "#ff3e62";
    ctx.shadowBlur = 26;
    ctx.lineWidth = 10 - p * 5;
    const start = s.variant ? 0.7 : -2.2;
    const end = s.variant ? -1.3 : 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, 150, start, end, false);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 155, start, end, false);
    ctx.stroke();
    ctx.restore();
  }
}
