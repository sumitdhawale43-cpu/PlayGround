// SHADOW NINJA — player, enemies, projectiles, pickups

import {
  TAU, GROUND_Y, PLATFORMS, WORLD_W, clamp, lerp, rand, pick, sign,
  easeOutCubic, easeOutBack, dist2, circleRect,
} from './utils.js';

const GRAVITY = 2350;
const JUMP_V = -790;
const DOUBLE_JUMP_V = -715;
const MAX_SPEED = 345;

function shadowBlob(ctx, x, y, w, alpha = 0.42) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.22, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawSword(ctx, x, y, angle, len = 46, color = '#9ef7ff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // handle
  ctx.strokeStyle = '#1b1420';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(0, 0); ctx.stroke();
  ctx.strokeStyle = '#c83246';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-11 + i * 3.4, -2.6);
    ctx.lineTo(-9 + i * 3.4, 2.6);
    ctx.stroke();
  }
  // guard
  ctx.fillStyle = '#c9a24a';
  ctx.beginPath(); ctx.ellipse(1, 0, 3, 6, 0, 0, TAU); ctx.fill();
  // blade glow
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(len, -1.5); ctx.stroke();
  // blade
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(4, 0, len, 0);
  g.addColorStop(0, '#dfe9f2');
  g.addColorStop(0.6, '#ffffff');
  g.addColorStop(1, '#b9d9e4');
  ctx.strokeStyle = g;
  ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(len, -1.5); ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(len - 2, -2.2); ctx.stroke();
  ctx.restore();
}

// ----------------------------------------------------------------------------
// PLAYER
// ----------------------------------------------------------------------------
export class Player {
  constructor(game) {
    this.game = game;
    this.w = 32;
    this.h = 62;
    this.x = 400;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = true;
    this.prevY = this.y;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumps = 0;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashDir = 1;
    this.airDashUsed = false;
    this.invuln = 0;
    this.hitFlash = 0;
    this.attack = null;
    this.attackBuffer = 0;
    this.comboStep = 0;
    this.comboWindow = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.focus = 0;
    this.maxFocus = 100;
    this.animTime = 0;
    this.airAttacks = 0;
    this.hurtLean = 0;
    this.ghostTimer = 0;
    this.dashHits = new Set();
    this.alive = true;
    this.deathTimer = 0;
  }

  get rect() {
    return { x: this.x - 16, y: this.y - 60, w: 32, h: 60 };
  }

  reset() {
    this.x = 400;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.health = this.maxHealth;
    this.focus = 0;
    this.invuln = 0;
    this.dashCd = 0;
    this.dashTimer = 0;
    this.attack = null;
    this.alive = true;
    this.deathTimer = 0;
    this.animTime = 0;
    this.onGround = true;
    this.hitFlash = 0;
    this.airAttacks = 0;
    this.attackBuffer = 0;
    this.comboStep = 0;
    this.comboWindow = 0;
  }

  startAttack(index, air = false) {
    const durations = [0.3, 0.31, 0.42];
    this.attack = {
      index,
      t: 0,
      duration: durations[index],
      active: false,
      hit: new Set(),
      queued: false,
      air,
      didHit: false,
    };
    this.comboStep = index;
    this.comboWindow = 0.28;
    if (index === 0) this.vx += this.facing * 190;
    else if (index === 1) this.vx += this.facing * 150;
    else this.vx += this.facing * 110;
    if (!air) this.vx = clamp(this.vx, -520, 520);
    this.game.sound.sfx(index === 2 ? 'slashHeavy' : 'slash', 1);
    const sx = this.x + this.facing * 34;
    this.game.fx.slash(
      sx, this.y - 38,
      this.facing > 0 ? -0.25 : Math.PI + 0.25,
      index === 2 ? 90 : 70,
      index === 2 ? '#ff6b81' : '#aef7ff',
      0.22,
      index === 2 ? 12 : 8,
      index === 2 ? 3.6 : 1.9,
    );
    this.game.shake(index === 2 ? 0.16 : 0.08);
  }

  attackInfo() {
    if (!this.attack || !this.attack.active) return null;
    const i = this.attack.index;
    const coffee = this.facing;
    if (i === 2) {
      return {
        x: this.x, y: this.y - 36, r: this.attack.air ? 96 : 112,
        damage: this.attack.air ? 20 : 28, knock: 340, index: i, air: this.attack.air,
      };
    }
    return {
      x: this.x + coffee * 58, y: this.y - 36, r: i === 1 ? 74 : 70,
      damage: i === 1 ? 16 : 14, knock: i === 1 ? 260 : 220, index: i, air: this.attack.air,
    };
  }

  update(dt, input) {
    this.animTime += dt;
    const game = this.game;
    if (!this.alive) {
      this.deathTimer += dt;
      this.vy += GRAVITY * dt;
      this.y = Math.min(GROUND_Y, this.y + this.vy * dt);
      this.vx *= Math.exp(-3 * dt);
      this.x += this.vx * dt;
      return;
    }

    this.prevY = this.y;
    const move = input.moveX();
    const wasGround = this.onGround;

    this.dashCd = Math.max(0, this.dashCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.hurtLean = lerp(this.hurtLean, 0, Math.min(1, dt * 8));
    this.attackBuffer = Math.max(0, this.attackBuffer - dt);
    this.comboWindow = Math.max(0, this.comboWindow - dt);
    this.coyote = this.onGround ? 0.1 : Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    // ---- dash ----
    if (input.pressed('dash') && this.dashCd <= 0 && this.dashTimer <= 0) {
      if (this.onGround || !this.airDashUsed) {
        this.dashTimer = 0.17;
        this.dashCd = 0.62;
        this.dashDir = move !== 0 ? sign(move) : this.facing;
        this.facing = this.dashDir;
        this.invuln = Math.max(this.invuln, 0.24);
        this.vy = 0;
        this.dashHits.clear();
        if (!this.onGround) this.airDashUsed = true;
        this.game.sound.sfx('dash');
        this.game.fx.ring(this.x, this.y - 34, 'rgba(110,240,255,0.8)', 70, 3, 0.3, 8);
        this.game.shake(0.1);
        this.game.fx.dust(this.x, this.y, -this.dashDir, 7);
      }
    }

    // ---- attack input ----
    if (input.pressed('attack')) {
      if (!this.attack && this.dashTimer <= 0) {
        if (this.onGround) {
          const next = this.comboWindow > 0 ? (this.comboStep + 1) % 3 : 0;
          this.startAttack(next, false);
        } else if (this.airAttacks < 2) {
          this.airAttacks++;
          this.startAttack(2, true);
        }
      } else if (this.attack) {
        this.attack.queued = true;
      }
    }

    // ---- burst ----
    if (input.pressed('burst') && this.focus >= this.maxFocus) {
      this.focus = 0;
      this.invuln = Math.max(this.invuln, 1.05);
      this.dashCd = 0;
      game.triggerBurst(this);
    }

    // ---- horizontal movement ----
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.dashDir * 760;
      this.vy = 0;
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.035;
        game.fx.ghost(this.x, this.y, this.facing, '95,235,255', 0.26, 1);
      }
      if (this.dashTimer <= 0) this.vx = this.dashDir * 330;
    } else {
      const attacking = !!this.attack;
      const control = attacking ? 0.5 : 1;
      if (move !== 0) {
        const target = move * MAX_SPEED;
        this.vx += (target - this.vx) * Math.min(1, dt * (this.onGround ? 12 : 8) * control);
        if (!attacking) this.facing = sign(move);
      } else {
        const friction = this.onGround ? 9 : 1.6;
        this.vx *= Math.exp(-friction * dt);
      }
      this.vx = clamp(this.vx, -MAX_SPEED * 1.4, MAX_SPEED * 1.4);
    }

    // ---- jump ----
    if (input.pressed('jump')) this.jumpBuffer = 0.12;
    if (this.jumpBuffer > 0 && this.dashTimer <= 0) {
      if (this.coyote > 0) {
        this.vy = JUMP_V;
        this.onGround = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.jumps = 1;
        this.airAttacks = 0;
        game.sound.sfx('jump');
        game.fx.dust(this.x, this.y, 0, 4);
        game.fx.ring(this.x, this.y - 4, 'rgba(180,220,255,0.35)', 26, 2, 0.25, 4);
      } else if (this.jumps < 2) {
        this.vy = DOUBLE_JUMP_V;
        this.jumps = 2;
        this.jumpBuffer = 0;
        this.airAttacks = 0;
        game.sound.sfx('doubleJump');
        game.fx.ring(this.x, this.y - 26, 'rgba(120,240,255,0.85)', 46, 2.5, 0.32, 6);
        for (let i = 0; i < 8; i++) {
          game.fx.particles.push({
            type: 'spark', x: this.x, y: this.y - 20,
            vx: Math.cos((i / 8) * TAU) * rand(60, 160),
            vy: Math.sin((i / 8) * TAU) * rand(60, 160),
            life: 0.35, max: 0.35, size: 2, color: '#9ef7ff',
            drag: 4, grav: 120, glow: true,
          });
        }
      }
    }
    if (!input.down('jump') && this.vy < -220) this.vy += 1900 * dt;

    // ---- attack progression ----
    if (this.attack) {
      const a = this.attack;
      a.t += dt;
      const i = a.index;
      const activeStart = i === 2 ? (a.air ? 0.07 : 0.08) : 0.055;
      const activeEnd = i === 2 ? (a.air ? 0.25 : 0.27) : 0.16;
      a.active = a.t >= activeStart && a.t <= activeEnd;
      if (a.active) {
        const info = this.attackInfo();
        if (info) game.resolvePlayerAttack(this, info);
      }
      if (a.t >= a.duration * 0.62 && a.queued) {
        const next = (i + 1) % 3;
        const wasAir = a.air;
        this.attack = null;
        if (wasAir && this.onGround) this.startAttack(0, false);
        else this.startAttack(next, wasAir);
      } else if (a.t >= a.duration) {
        this.attack = null;
        this.comboWindow = 0.22;
      }
    }

    // ---- physics ----
    if (this.dashTimer <= 0) this.vy += GRAVITY * dt;
    this.vy = Math.min(this.vy, 1300);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // world bounds
    if (this.x < 34) { this.x = 34; this.vx = Math.max(0, this.vx); }
    if (this.x > WORLD_W - 34) { this.x = WORLD_W - 34; this.vx = Math.min(0, this.vx); }

    // ground / platforms
    this.onGround = false;
    const wasFalling = this.vy >= 0;
    if (this.y >= GROUND_Y) {
      if (!wasGround && this.vy > 300) {
        game.fx.dust(this.x, this.y, 0, 5);
        game.shake(0.06);
      }
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
    }
    if (wasFalling && this.vy > 0 && this.dashTimer <= 0) {
      for (const p of PLATFORMS) {
        if (
          this.x > p.x - 10 && this.x < p.x + p.w + 10 &&
          this.prevY <= p.y + 1 && this.y >= p.y
        ) {
          this.y = p.y;
          this.vy = 0;
          this.onGround = true;
          if (!wasGround) {
            game.fx.dust(this.x, this.y, 0, 3);
            game.fx.ring(this.x, this.y, 'rgba(160,220,255,0.3)', 22, 2, 0.2, 3);
          }
          break;
        }
      }
    }
    if (this.onGround) {
      this.jumps = 0;
      this.airDashUsed = false;
      this.airAttacks = 0;
    }

    // dash trail + contact damage
    if (this.dashTimer > 0) {
      game.resolveDashAttack(this);
    }

    // footsteps
    if (this.onGround && Math.abs(this.vx) > 100 && this.dashTimer <= 0) {
      this.stepTimer = (this.stepTimer || 0) - dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.12;
        game.fx.dust(this.x - this.facing * 8, this.y, -this.facing, 1);
      }
    }

    if (this.y > 900) { this.y = GROUND_Y; this.vy = 0; }
  }

  takeDamage(amount, dir) {
    if (!this.alive || this.invuln > 0 || this.dashTimer > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invuln = 1.0;
    this.hitFlash = 0.2;
    this.hurtLean = 1;
    this.vx = dir * 420;
    this.vy = -280;
    this.onGround = false;
    this.game.onPlayerHit(amount, dir);
    if (this.health <= 0) {
      this.alive = false;
      this.deathTimer = 0;
      this.vy = -420;
      this.game.onPlayerDeath();
    }
    return true;
  }

  heal(v) {
    this.health = Math.min(this.maxHealth, this.health + v);
  }

  addFocus(v) {
    this.focus = Math.min(this.maxFocus, this.focus + v);
  }

  draw(ctx) {
    const t = this.animTime;
    const blink = this.invuln > 0 && this.dashTimer <= 0 && this.hitFlash <= 0 && this.alive
      ? 0.55 + Math.sin(this.animTime * 48) * 0.35
      : 1;
    ctx.save();
    if (!this.alive) {
      const fall = Math.min(1, this.deathTimer * 1.6);
      ctx.globalAlpha = Math.max(0, 1 - this.deathTimer * 0.7);
      ctx.translate(this.x, this.y);
      ctx.rotate(-this.facing * fall * 1.2);
      ctx.translate(0, 0);
      ctx.scale(this.facing, 1);
      drawNinjaBody(ctx, this, t, null);
      ctx.restore();
      return;
    }
    ctx.globalAlpha = blink;
    if (this.hitFlash > 0) ctx.filter = 'brightness(2.6) saturate(0.4)';
    drawNinjaBody(ctx, this, t, this.attack);
    ctx.restore();
    if (this.hitFlash > 0) ctx.filter = 'none';
  }
}

function drawNinjaBody(ctx, p, t, attack) {
  const moving = Math.abs(p.vx) > 60;
  const run = p.onGround ? clamp(Math.abs(p.vx) / 340, 0, 1) : 0;
  const phase = t * (7 + run * 8);
  const bob = p.onGround ? Math.sin(phase * 2) * (1 + run) : 0;
  const airborne = !p.onGround && p.dashTimer <= 0;
  const dashing = p.dashTimer > 0;

  ctx.save();
  ctx.translate(p.x, p.y);
  // subtle visual scale-up for readability (hitboxes are unchanged)
  ctx.scale(1.1, 1.1);
  // shadow
  const air = clamp((GROUND_Y - p.y) / 260, 0, 1);
  shadowBlob(ctx, 0, 1, 22 * (1 - air * 0.45), 0.36 * (1 - air * 0.5));

  ctx.scale(p.facing, 1);
  if (p.hurtLean > 0) ctx.rotate(-p.hurtLean * 0.22);
  if (dashing) ctx.rotate(-0.22);
  ctx.translate(0, bob);

  // attack angle
  let swordAngle = -2.35 - Math.sin(t * 2) * 0.04;
  let armAngle = swordAngle;
  if (dashing) { swordAngle = -0.15; armAngle = 0.2; }
  else if (airborne) { swordAngle = 1.9; armAngle = 1.7; }
  else if (moving) { swordAngle = -2.5; armAngle = -2.2; }
  if (attack) {
    const prog = clamp(attack.t / attack.duration, 0, 1);
    if (attack.index === 0) {
      swordAngle = lerp(-2.0, 0.75, easeOutCubic(clamp(prog * 1.9, 0, 1)));
      armAngle = swordAngle;
    } else if (attack.index === 1) {
      swordAngle = lerp(1.05, -1.9, easeOutCubic(clamp(prog * 1.9, 0, 1)));
      armAngle = swordAngle;
    } else {
      swordAngle = -0.3 + prog * TAU * 1.15;
      armAngle = -0.5 + prog * TAU * 0.9;
    }
  }

  const stride = Math.sin(phase) * 10 * run;
  const stride2 = Math.sin(phase + Math.PI) * 10 * run;

  // scarf
  const speed = clamp(Math.abs(p.vx) / 340, 0, 1);
  const scarfLen = 38 + speed * 34 + (dashing ? 34 : 0);
  const scarfWave = Math.sin(t * 6.5) * 6;
  ctx.save();
  ctx.globalAlpha = 0.92;
  for (let layer = 0; layer < 2; layer++) {
    const g = ctx.createLinearGradient(0, 0, -scarfLen, -30);
    g.addColorStop(0, layer === 0 ? '#c8102e' : '#7e0b1d');
    g.addColorStop(1, layer === 0 ? '#ff4d5e' : '#a3122a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-3, -63 + layer * 3);
    ctx.bezierCurveTo(
      -18, -66 + layer * 5,
      -scarfLen * 0.55, -48 + scarfWave + layer * 4,
      -scarfLen, -58 + Math.sin(t * 5 + layer) * 10 + layer * 4,
    );
    ctx.bezierCurveTo(
      -scarfLen * 0.6, -38 + scarfWave + layer * 4,
      -16, -52 + layer * 5, -3, -56 + layer * 3,
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const legColor = '#0c1424';
  const rim = 'rgba(126,239,255,0.5)';

  // back arm
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0a111f';
  ctx.lineWidth = 8;
  const backSwing = moving ? Math.sin(phase + Math.PI) * 6 : 0;
  ctx.beginPath();
  ctx.moveTo(-5, -55);
  ctx.quadraticCurveTo(-14, -46 + backSwing, -12 - (dashing ? 14 : 0), -34 + backSwing);
  ctx.stroke();

  // back leg
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-4, -36);
  if (airborne || dashing) {
    ctx.quadraticCurveTo(-14, -26, -22, -16);
  } else {
    ctx.quadraticCurveTo(-7 + stride2 * 0.7, -20, -10 + stride2, -2);
  }
  ctx.stroke();
  ctx.strokeStyle = '#1a2336';
  ctx.lineWidth = 7;
  ctx.beginPath();
  if (airborne || dashing) {
    ctx.moveTo(-22, -16); ctx.lineTo(-28, -8);
  } else {
    ctx.moveTo(-10 + stride2, -5); ctx.lineTo(-10 + stride2 + 5, -2);
  }
  ctx.stroke();

  // torso
  const g = ctx.createLinearGradient(-16, -66, 12, -34);
  g.addColorStop(0, '#070d18');
  g.addColorStop(0.5, '#111d30');
  g.addColorStop(1, '#1c3048');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, -38);
  ctx.quadraticCurveTo(-14, -56, -8, -65);
  ctx.quadraticCurveTo(3, -70, 10, -62);
  ctx.quadraticCurveTo(13, -52, 7, -37);
  ctx.quadraticCurveTo(-2, -32, -10, -38);
  ctx.closePath();
  ctx.fill();
  // rim light
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(9, -61);
  ctx.quadraticCurveTo(13, -51, 7, -38);
  ctx.stroke();

  // chest wrap
  ctx.strokeStyle = '#9c1830';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-8, -57);
  ctx.lineTo(8, -47);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,110,120,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -58.5); ctx.lineTo(7, -49); ctx.stroke();

  // belt + knot
  ctx.fillStyle = '#17111a';
  ctx.fillRect(-9, -41, 18, 5);
  ctx.fillStyle = '#d8a94b';
  ctx.beginPath(); ctx.arc(6, -39, 3.2, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#d8a94b';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(6, -37); ctx.lineTo(8, -28); ctx.stroke();

  // front leg
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(3, -37);
  if (airborne || dashing) {
    ctx.quadraticCurveTo(10, -26, 20, -22);
  } else {
    ctx.quadraticCurveTo(5 - stride * 0.6, -20, 8 - stride, -2);
  }
  ctx.stroke();
  ctx.strokeStyle = '#20304a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (airborne || dashing) {
    ctx.moveTo(20, -22); ctx.lineTo(27, -16);
  } else {
    ctx.moveTo(8 - stride, -6); ctx.lineTo(8 - stride + 5, -2);
  }
  ctx.stroke();
  // shin glow
  ctx.strokeStyle = 'rgba(80,210,230,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (!airborne && !dashing) {
    ctx.moveTo(6 - stride * 0.5, -18);
    ctx.lineTo(8 - stride, -6);
  }
  ctx.stroke();

  // leg rim light — keeps silhouette readable against the dark ground
  ctx.strokeStyle = 'rgba(110,225,245,0.30)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (airborne || dashing) {
    ctx.moveTo(5, -35);
    ctx.quadraticCurveTo(15, -27, 24, -21);
  } else {
    ctx.moveTo(5, -34);
    ctx.quadraticCurveTo(8 - stride * 0.6, -20, 11 - stride, -4);
  }
  ctx.stroke();
  // back leg faint rim
  ctx.strokeStyle = 'rgba(90,190,220,0.16)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  if (airborne || dashing) {
    ctx.moveTo(-3, -34);
    ctx.quadraticCurveTo(-13, -26, -20, -17);
  } else {
    ctx.moveTo(-3, -33);
    ctx.quadraticCurveTo(-6 + stride2 * 0.7, -19, -8 + stride2, -4);
  }
  ctx.stroke();

  // head
  ctx.save();
  // hood tail
  ctx.fillStyle = '#0b1424';
  ctx.beginPath();
  ctx.moveTo(-4, -70);
  ctx.quadraticCurveTo(-18, -71, -22, -62);
  ctx.quadraticCurveTo(-12, -64, -6, -63);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#101b2b';
  ctx.beginPath();
  ctx.ellipse(2, -67, 10.5, 11, 0.06, 0, TAU);
  ctx.fill();
  // face mask
  ctx.fillStyle = '#080d16';
  ctx.beginPath();
  ctx.ellipse(6, -64, 8.5, 8, 0.1, 0, TAU);
  ctx.fill();
  // eyes
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#9dfbff';
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.ellipse(7.5, -68, 2.15, 0.95, -0.12, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.arc(8, -68, 3.6, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // headband
  ctx.strokeStyle = '#b81633';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-7, -72);
  ctx.quadraticCurveTo(-16, -70, -24 - speed * 10, -66 + Math.sin(t * 8) * 3);
  ctx.stroke();
  ctx.restore();

  // sword arm
  const shoulderX = 4, shoulderY = -55;
  const handX = shoulderX + Math.cos(armAngle) * 17;
  const handY = shoulderY + Math.sin(armAngle) * 17;
  ctx.strokeStyle = '#101a2a';
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.quadraticCurveTo(shoulderX + Math.cos(armAngle) * 10 + 3, shoulderY + Math.sin(armAngle) * 10 - 3, handX, handY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,230,255,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(shoulderX + 2, shoulderY + 2);
  ctx.lineTo(handX + 1, handY - 1);
  ctx.stroke();

  drawSword(ctx, handX, handY, swordAngle, 48 + (attack && attack.index === 2 ? 8 : 0));

  // glow at eye level
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = '#7df7ff';
  ctx.beginPath(); ctx.arc(6, -68, 8, 0, TAU); ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ----------------------------------------------------------------------------
// ENEMIES
// ----------------------------------------------------------------------------
const ENEMY_STATS = {
  ronin: { hp: 55, speed: 132, w: 34, h: 64, damage: 12, score: 120 },
  archer: { hp: 42, speed: 96, w: 30, h: 60, damage: 9, score: 150 },
  brute: { hp: 170, speed: 62, w: 54, h: 94, damage: 22, score: 300 },
};

let enemyId = 1;

export class Enemy {
  constructor(type, x, y, game, wave) {
    const s = ENEMY_STATS[type];
    this.id = enemyId++;
    this.type = type;
    this.game = game;
    this.w = s.w;
    this.h = s.h;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.maxHp = Math.round(s.hp * (1 + 0.16 * Math.max(0, wave - 1)));
    this.hp = this.maxHp;
    this.speed = s.speed * (1 + 0.035 * Math.max(0, wave - 1));
    this.damage = Math.round(s.damage * (1 + 0.075 * Math.max(0, wave - 1)));
    this.scoreValue = s.score;
    this.state = 'spawn';
    this.timer = 0.55;
    this.cooldown = rand(0.4, 1.1);
    this.hitFlash = 0;
    this.windup = 0;
    this.attackT = 0;
    this.didHit = false;
    this.dead = false;
    this.deathTimer = 0;
    this.anim = rand(0, 10);
    this.stateTime = 0;
    this.blockShake = 0;
    this.arrowCharged = false;
    this.telegraph = 0;
  }

  get rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  get alive() {
    return !this.dead;
  }

  update(dt, game) {
    this.anim += dt;
    this.stateTime += dt;
    if (this.dead) {
      this.deathTimer -= dt;
      this.vx *= Math.exp(-4 * dt);
      this.x += this.vx * dt;
      return;
    }
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.telegraph = Math.max(0, this.telegraph - dt);
    const player = game.player;
    const dx = player.x - this.x;
    const adx = Math.abs(dx);
    const dir = sign(dx || 1);
    if (this.state !== 'attack' && this.state !== 'windup') this.facing = dir;
    this.vy += GRAVITY * dt;
    this.y = Math.min(GROUND_Y, this.y + this.vy * dt);
    if (this.y >= GROUND_Y) { this.y = GROUND_Y; this.vy = 0; }

    // separation from other enemies
    for (const e of game.enemies) {
      if (e === this || e.dead || e.type === 'boss') continue;
      const d = this.x - e.x;
      if (Math.abs(d) < (this.w + e.w) * 0.42 && Math.abs(this.y - e.y) < 20) {
        this.x += sign(d || 1) * 26 * dt;
      }
    }

    switch (this.type) {
      case 'ronin': this.updateRonin(dt, game, player, dx, adx, dir); break;
      case 'archer': this.updateArcher(dt, game, player, dx, adx, dir); break;
      case 'brute': this.updateBrute(dt, game, player, dx, adx, dir); break;
    }

    this.x += this.vx * dt;
    this.x = clamp(this.x, 30, WORLD_W - 30);
    if (this.y > 900) this.dead = true;
  }

  moveToward(speed, dir, dt, game) {
    this.vx = lerp(this.vx, dir * speed, Math.min(1, dt * 8));
    if (Math.abs(this.vx) > 40 && Math.random() < dt * 3) game.fx.dust(this.x, this.y, -sign(this.vx), 1);
  }

  updateRonin(dt, game, player, dx, adx, dir) {
    if (this.state === 'spawn') {
      this.timer -= dt;
      this.vx = 0;
      if (this.timer <= 0) { this.state = 'chase'; this.stateTime = 0; }
      return;
    }
    if (this.state === 'chase') {
      if (adx > 82) this.moveToward(this.speed, dir, dt, game);
      else this.vx *= Math.exp(-10 * dt);
      if (adx < 112 && this.cooldown <= 0 && Math.abs(player.y - this.y) < 80) {
        this.state = 'windup';
        this.timer = 0.4;
        this.stateTime = 0;
        this.windup = 0.4;
        this.telegraph = 0.4;
        this.vx = 0;
        game.sound.sfx('click', 1);
      }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.vx *= Math.exp(-12 * dt);
      if (this.timer <= 0) {
        this.state = 'attack';
        this.timer = 0.26;
        this.attackT = 0;
        this.didHit = false;
        this.vx = dir * 480;
        game.sound.sfx('slash', 0.7);
        game.fx.slash(this.x + dir * 42, this.y - 34, dir > 0 ? 0.15 : Math.PI - 0.15, 56, 'rgba(255,80,90,0.8)', 0.16, 6, 1.7);
      }
    } else if (this.state === 'attack') {
      this.timer -= dt;
      this.attackT += dt;
      this.vx *= Math.exp(-2.5 * dt);
      if (!this.didHit && this.attackT > 0.04) {
        const hit = { x: this.x + this.facing * 42, y: this.y - 34, r: 46 };
        if (circleRect(hit.x, hit.y, hit.r, player.rect) && player.takeDamage(this.damage, this.facing)) {
          this.didHit = true;
          game.fx.spark(hit.x, hit.y, '#ff7080', 8, 280);
        }
      }
      if (this.timer <= 0) {
        this.state = 'recover';
        this.timer = 0.42;
        this.cooldown = rand(0.85, 1.5);
      }
    } else if (this.state === 'recover') {
      this.timer -= dt;
      this.vx *= Math.exp(-8 * dt);
      if (this.timer <= 0) this.state = 'chase';
    }
  }

  updateArcher(dt, game, player, dx, adx, dir) {
    if (this.state === 'spawn') {
      this.timer -= dt;
      this.vx = 0;
      if (this.timer <= 0) this.state = 'chase';
      return;
    }
    if (this.state === 'chase') {
      if (adx < 210) this.moveToward(this.speed * 1.15, -dir, dt, game);
      else if (adx > 400) this.moveToward(this.speed * 0.8, dir, dt, game);
      else this.vx *= Math.exp(-8 * dt);
      if (this.cooldown <= 0 && adx < 620 && adx > 70) {
        this.state = 'aim';
        this.timer = 0.62;
        this.vx = 0;
        this.telegraph = 0.62;
        this.arrowCharged = false;
      }
      if (adx < 75) {
        this.vx = -dir * 340;
      }
    } else if (this.state === 'aim') {
      this.timer -= dt;
      this.vx *= Math.exp(-12 * dt);
      if (!this.arrowCharged && this.timer < 0.16) {
        this.arrowCharged = true;
        game.sound.sfx('click');
      }
      if (this.timer <= 0) {
        this.state = 'shoot';
        this.timer = 0.16;
        const tx = player.x + player.vx * 0.12;
        const ty = player.y - 30;
        const ang = Math.atan2(ty - (this.y - 34), tx - this.x);
        const sp = 640;
        game.spawnEnemyProjectile({
          type: 'arrow', x: this.x + Math.cos(ang) * 24, y: this.y - 34 + Math.sin(ang) * 24,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          r: 5, damage: this.damage, life: 2.2, color: '#ff9b6a',
        });
        if (this.maxHp > 60) {
          const a2 = ang + 0.12;
          game.spawnEnemyProjectile({
            type: 'arrow', x: this.x + Math.cos(a2) * 24, y: this.y - 34 + Math.sin(a2) * 24,
            vx: Math.cos(a2) * sp, vy: Math.sin(a2) * sp,
            r: 5, damage: this.damage, life: 2.2, color: '#ff9b6a',
          });
        }
        game.sound.sfx('arrow');
      }
    } else if (this.state === 'shoot') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = 'chase';
        this.cooldown = rand(1.8, 2.6);
      }
    }
  }

  updateBrute(dt, game, player, dx, adx, dir) {
    if (this.state === 'spawn') {
      this.timer -= dt;
      this.vx = 0;
      if (this.timer <= 0) this.state = 'chase';
      return;
    }
    if (this.state === 'chase') {
      if (adx > 105) this.moveToward(this.speed, dir, dt, game);
      else this.vx *= Math.exp(-8 * dt);
      if (adx < 150 && this.cooldown <= 0) {
        this.state = 'windup';
        this.timer = 0.68;
        this.windup = 0.68;
        this.telegraph = 0.68;
        this.vx = 0;
        this.didHit = false;
        game.sound.sfx('click');
      }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      this.vx *= Math.exp(-12 * dt);
      if (this.timer <= 0) {
        this.state = 'attack';
        this.timer = 0.36;
        this.attackT = 0;
        this.didHit = false;
        game.shake(0.42);
        game.sound.sfx('slam');
        game.fx.ring(this.x + this.facing * 60, this.y, 'rgba(255,90,70,0.9)', 130, 5, 0.38, 10);
        game.fx.shards(this.x + this.facing * 64, this.y - 6, '#ff7f5a', 9, 340);
        game.fx.smoke(this.x + this.facing * 70, this.y, '90,70,80', 6, 22);
        if (Math.abs(player.x - (this.x + this.facing * 60)) < 135 && player.y > this.y - 110) {
          player.takeDamage(this.damage, this.facing);
        }
        game.spawnEnemyProjectile({
          type: 'shock', x: this.x, y: GROUND_Y, vx: this.facing * 520, vy: 0,
          r: 26, damage: Math.round(this.damage * 0.8), life: 1.4, color: '#ff6a55',
        });
        if (this.maxHp > 200) game.spawnEnemyProjectile({
          type: 'shock', x: this.x, y: GROUND_Y, vx: -this.facing * 520, vy: 0,
          r: 26, damage: Math.round(this.damage * 0.8), life: 1.4, color: '#ff6a55',
        });
      }
    } else if (this.state === 'attack') {
      this.timer -= dt;
      this.vx *= Math.exp(-10 * dt);
      if (this.timer <= 0) {
        this.state = 'recover';
        this.timer = 0.85;
        this.cooldown = rand(1.4, 2.1);
      }
    } else if (this.state === 'recover') {
      this.timer -= dt;
      this.vx *= Math.exp(-8 * dt);
      if (this.timer <= 0) this.state = 'chase';
    }
  }

  takeDamage(dmg, dir, game, opts = {}) {
    if (this.dead) return false;
    this.hp -= dmg;
    this.hitFlash = 0.14;
    if (this.type === 'brute') {
      this.vx += dir * 40;
      this.x += dir * 4;
    } else {
      this.vx += dir * (opts.knock ?? 260) * 0.6;
      this.x += dir * 5;
      if (this.state === 'windup' || this.state === 'aim') {
        this.state = 'recover';
        this.timer = 0.25;
      }
    }
    game.fx.ember(this.x, this.y - this.h * 0.6, '#ff9a86', 4, 150);
    if (this.hp <= 0) {
      this.die(game, dir);
    }
    return true;
  }

  die(game, dir) {
    this.dead = true;
    this.deathTimer = 0.55;
    this.vx = dir * 180;
    game.onEnemyKilled(this);
    const cy = this.y - this.h * 0.55;
    const color = this.type === 'brute' ? '#ff8b5c' : this.type === 'archer' ? '#7ef0d8' : '#ff5c6e';
    game.fx.ember(this.x, cy, color, 18, 260, 1.3);
    game.fx.spark(this.x, cy, '#ffe6c0', 12, 320);
    game.fx.smoke(this.x, cy, '80,60,80', 5, 20);
    game.fx.petals(this.x, cy, 5);
    game.fx.shards(this.x, cy, '#3a2028', 5, 260);
    game.shake(0.2);
    game.hitStop(0.045);
    game.sound.sfx('kill');
    if (this.type === 'brute') {
      game.fx.ring(this.x, this.y - 50, 'rgba(255,120,80,0.8)', 100, 4, 0.45);
    }
  }

  draw(ctx) {
    const alpha = this.dead ? clamp(this.deathTimer / 0.55, 0, 1) : 1;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    const air = clamp((GROUND_Y - this.y) / 220, 0, 1);
    shadowBlob(ctx, 0, 1, this.w * 0.62 * (1 - air * 0.4), 0.35);
    if (this.hitFlash > 0) ctx.filter = 'brightness(2.7) saturate(0.3)';
    if (this.dead) {
      ctx.rotate(this.facing * (1 - alpha) * 0.9);
      ctx.translate(0, (1 - alpha) * 10);
      ctx.globalAlpha = alpha * 0.8;
    }
    if (this.state === 'spawn') {
      const t = 1 - clamp(this.timer / 0.55, 0, 1);
      ctx.globalAlpha *= t;
      ctx.scale(0.85 + t * 0.15, 0.85 + t * 0.15);
      ctx.translate(0, (1 - t) * 18);
    }
    ctx.scale(1.06, 1.06);
    ctx.scale(this.facing, 1);
    if (this.type === 'ronin') drawRonin(ctx, this);
    else if (this.type === 'archer') drawArcher(ctx, this);
    else drawBrute(ctx, this);
    ctx.filter = 'none';
    ctx.restore();

    if (!this.dead && this.type === 'brute' && this.hp < this.maxHp) {
      const w = 54;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(this.x - w / 2, this.y - this.h - 16, w, 5);
      ctx.fillStyle = '#ff5f62';
      ctx.fillRect(this.x - w / 2, this.y - this.h - 16, (this.hp / this.maxHp) * w, 5);
      ctx.restore();
    }

    if (this.telegraph > 0 && !this.dead) {
      const p = 1 - this.telegraph / Math.max(0.001, this.windup || 0.62);
      ctx.save();
      ctx.translate(this.x + this.facing * (this.type === 'brute' ? 60 : 36), this.y - this.h * 0.5);
      ctx.scale(this.facing, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(p * 24) * 0.2;
      ctx.strokeStyle = '#ff4d5e';
      ctx.lineWidth = 2;
      const r = 30 + p * 26;
      ctx.beginPath();
      ctx.arc(0, 0, r, -0.9, 0.9);
      ctx.stroke();
      ctx.fillStyle = '#ff4d5e';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.8;
      ctx.fillText('!', 0, -r - 8);
      ctx.restore();
    }
  }
}

function drawRonin(ctx, e) {
  const t = e.anim;
  const walking = Math.abs(e.vx) > 20;
  const phase = t * (walking ? 9 : 3);
  const bob = walking ? Math.sin(phase * 2) * 1.4 : Math.sin(t * 2) * 0.8;
  const wind = e.state === 'windup' ? 1 - e.timer / 0.4 : 0;
  const attack = e.state === 'attack' ? 1 - e.timer / 0.26 : 0;
  ctx.translate(0, bob);

  // legs
  const stride = walking ? Math.sin(phase) * 8 : 0;
  ctx.strokeStyle = '#0b0d17';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -30); ctx.lineTo(-8 + stride, -2);
  ctx.moveTo(3, -30); ctx.lineTo(8 - stride, -2);
  ctx.stroke();
  ctx.strokeStyle = '#241720';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8 + stride - 3, -2); ctx.lineTo(-4 + stride, -2);
  ctx.moveTo(8 - stride - 3, -2); ctx.lineTo(12 - stride, -2);
  ctx.stroke();

  // tattered skirt
  ctx.fillStyle = '#170d16';
  ctx.beginPath();
  ctx.moveTo(-12, -36);
  ctx.lineTo(12, -36);
  ctx.lineTo(10, -22);
  ctx.lineTo(5, -27);
  ctx.lineTo(1, -19);
  ctx.lineTo(-4, -26);
  ctx.lineTo(-10, -20);
  ctx.closePath();
  ctx.fill();

  // torso armor
  const g = ctx.createLinearGradient(-14, -62, 14, -30);
  g.addColorStop(0, '#0a0a13');
  g.addColorStop(0.55, '#1b1420');
  g.addColorStop(1, '#2b1a24');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-12, -36);
  ctx.quadraticCurveTo(-15, -55, -7, -61);
  ctx.lineTo(8, -61);
  ctx.quadraticCurveTo(15, -54, 11, -36);
  ctx.closePath();
  ctx.fill();
  // lamellar lines
  ctx.strokeStyle = 'rgba(180,80,90,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-10 + i, -46 - i * 5);
    ctx.lineTo(10 - i, -46 - i * 5);
    ctx.stroke();
  }
  // red sash
  ctx.fillStyle = '#8e1424';
  ctx.fillRect(-11, -38, 22, 4);
  // shoulder plates
  ctx.fillStyle = '#14101c';
  ctx.beginPath();
  ctx.ellipse(-12, -57, 8, 6, -0.3, 0, TAU);
  ctx.ellipse(12, -57, 8, 6, 0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,80,90,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(12, -57, 8, 6, 0.3, 0, TAU); ctx.stroke();

  // head + horned helmet
  ctx.fillStyle = '#17121d';
  ctx.beginPath();
  ctx.ellipse(1, -68, 9.5, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0a0910';
  ctx.beginPath();
  ctx.moveTo(-9, -72);
  ctx.quadraticCurveTo(0, -84, 10, -72);
  ctx.lineTo(8, -68);
  ctx.quadraticCurveTo(0, -75, -8, -68);
  ctx.closePath();
  ctx.fill();
  // horns
  ctx.strokeStyle = '#b9a98e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-6, -76); ctx.quadraticCurveTo(-15, -88, -12, -93);
  ctx.moveTo(7, -76); ctx.quadraticCurveTo(15, -88, 12, -93);
  ctx.stroke();
  // mask/eyes
  ctx.fillStyle = '#06050a';
  ctx.beginPath(); ctx.ellipse(3, -66, 7, 6, 0, 0, TAU); ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ff4757';
  ctx.shadowColor = '#ff3344';
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.ellipse(5.5, -67, 2.4, 1.1, -0.1, 0, TAU); ctx.fill();
  ctx.restore();

  // katana arm
  let angle = -2.1;
  if (e.state === 'windup') angle = lerp(-2.2, -2.9, wind);
  else if (e.state === 'attack') angle = lerp(-2.9, 0.7, easeOutCubic(Math.min(1, attack * 2.4)));
  else if (walking) angle = -2.35 + Math.sin(phase) * 0.08;
  const sx = 6, sy = -56;
  const hx = sx + Math.cos(angle) * 15;
  const hy = sy + Math.sin(angle) * 15;
  ctx.strokeStyle = '#14101a';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(sx + 6, sy + 8, hx, hy);
  ctx.stroke();
  // glowing red blade
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,70,80,0.2)';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(45, 0); ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#d8cfc2';
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(45, 0); ctx.stroke();
  ctx.strokeStyle = '#ff6a70';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(42, -1); ctx.stroke();
  ctx.fillStyle = '#2a1a1a';
  ctx.fillRect(-9, -4, 11, 8);
  ctx.restore();
}

function drawArcher(ctx, e) {
  const t = e.anim;
  const walking = Math.abs(e.vx) > 20;
  const phase = t * (walking ? 9 : 3);
  const stride = walking ? Math.sin(phase) * 7 : 0;
  const aim = e.state === 'aim' ? 1 - e.timer / 0.62 : 0;
  ctx.translate(0, walking ? Math.sin(phase * 2) * 1.2 : Math.sin(t * 2) * 0.6);

  // legs
  ctx.strokeStyle = '#0a1016';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -28); ctx.lineTo(-7 + stride, -2);
  ctx.moveTo(3, -28); ctx.lineTo(7 - stride, -2);
  ctx.stroke();
  ctx.strokeStyle = '#173a35';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-7 + stride, -4); ctx.lineTo(-3 + stride, -4);
  ctx.moveTo(7 - stride, -4); ctx.lineTo(11 - stride, -4);
  ctx.stroke();

  // tattered cloak
  ctx.fillStyle = '#0b1417';
  ctx.beginPath();
  ctx.moveTo(-10, -50);
  ctx.quadraticCurveTo(-18, -30, -14, -18);
  ctx.lineTo(-3, -26);
  ctx.lineTo(2, -16);
  ctx.lineTo(8, -27);
  ctx.lineTo(12, -20);
  ctx.quadraticCurveTo(15, -38, 9, -52);
  ctx.closePath();
  ctx.fill();

  // torso
  const g = ctx.createLinearGradient(-10, -60, 12, -30);
  g.addColorStop(0, '#071016');
  g.addColorStop(1, '#16302e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-8, -32);
  ctx.quadraticCurveTo(-12, -50, -5, -58);
  ctx.quadraticCurveTo(4, -62, 9, -52);
  ctx.quadraticCurveTo(11, -40, 6, -32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,255,220,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, -51); ctx.lineTo(6, -33); ctx.stroke();
  // sash
  ctx.fillStyle = '#187a68';
  ctx.fillRect(-8, -36, 16, 3);

  // hooded head
  ctx.fillStyle = '#0b181c';
  ctx.beginPath();
  ctx.ellipse(1, -66, 9, 9.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#071013';
  ctx.beginPath();
  ctx.moveTo(-8, -70);
  ctx.quadraticCurveTo(1, -84, 10, -68);
  ctx.quadraticCurveTo(1, -74, -8, -66);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#63ffe0';
  ctx.shadowColor = '#52ffe0';
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.ellipse(5, -67, 2.2, 1.1, 0, 0, TAU); ctx.fill();
  ctx.restore();
  // scarf tail
  ctx.strokeStyle = '#1a9c84';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -70);
  ctx.quadraticCurveTo(-16, -66, -20, -58 + Math.sin(t * 6) * 3);
  ctx.stroke();

  // bow
  const bowX = 13;
  const bowY = -45;
  ctx.save();
  ctx.translate(bowX, bowY);
  ctx.strokeStyle = '#8c6a3e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 22, -1.15, 1.15);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,255,230,0.5)';
  ctx.lineWidth = 1;
  const pull = aim * 9;
  ctx.beginPath();
  ctx.moveTo(8.4, -20.5);
  ctx.lineTo(-pull, 0);
  ctx.lineTo(8.4, 20.5);
  ctx.stroke();
  if (e.state === 'aim' || e.state === 'shoot') {
    ctx.strokeStyle = '#bffcf0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-pull, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.fillStyle = '#eafff8';
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(24, -3); ctx.lineTo(24, 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // arm
  ctx.strokeStyle = '#0d1a1c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(4, -52);
  ctx.quadraticCurveTo(12, -47, 13, -45);
  ctx.stroke();
  // quiver
  ctx.save();
  ctx.rotate(-0.25);
  ctx.fillStyle = '#173a34';
  ctx.fillRect(-16, -55, 6, 22);
  ctx.strokeStyle = '#8ef5dd';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-14 + i * 2, -55);
    ctx.lineTo(-16 + i * 2, -62);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrute(ctx, e) {
  const t = e.anim;
  const wind = e.state === 'windup' ? 1 - e.timer / 0.68 : 0;
  const swing = e.state === 'attack' ? 1 - e.timer / 0.36 : 0;
  const walking = Math.abs(e.vx) > 15;
  const phase = t * 6;
  const bob = walking ? Math.sin(phase * 2) * 2 : Math.sin(t * 2) * 1;
  ctx.translate(0, bob);

  // legs
  const stride = walking ? Math.sin(phase) * 8 : 0;
  ctx.strokeStyle = '#120d16';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, -42); ctx.lineTo(-18 + stride, -4);
  ctx.moveTo(13, -42); ctx.lineTo(18 - stride, -4);
  ctx.stroke();
  ctx.strokeStyle = '#2a1820';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-18 + stride - 5, -4); ctx.lineTo(-12 + stride, -4);
  ctx.moveTo(18 - stride - 5, -4); ctx.lineTo(24 - stride, -4);
  ctx.stroke();

  // giant torso
  const g = ctx.createLinearGradient(-28, -92, 26, -32);
  g.addColorStop(0, '#0d0811');
  g.addColorStop(0.5, '#261420');
  g.addColorStop(1, '#3a1d28');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-22, -38);
  ctx.quadraticCurveTo(-32, -66, -20, -84);
  ctx.quadraticCurveTo(0, -96, 20, -84);
  ctx.quadraticCurveTo(32, -64, 22, -38);
  ctx.quadraticCurveTo(0, -30, -22, -38);
  ctx.closePath();
  ctx.fill();
  // armor plates
  ctx.strokeStyle = 'rgba(255,110,80,0.22)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-18 + i * 2, -76 + i * 10);
    ctx.quadraticCurveTo(0, -70 + i * 10, 18 - i * 2, -76 + i * 10);
    ctx.stroke();
  }
  // glowing cracks
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,90,70,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, -82); ctx.lineTo(2, -70); ctx.lineTo(-4, -60); ctx.lineTo(8, -50);
  ctx.stroke();
  ctx.restore();
  // belt/skirt
  ctx.fillStyle = '#160d14';
  ctx.fillRect(-22, -42, 44, 8);
  // shoulders
  ctx.fillStyle = '#1a1018';
  ctx.beginPath(); ctx.ellipse(-26, -76, 12, 10, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(26, -76, 12, 10, 0.4, 0, TAU); ctx.fill();

  // head + oni mask
  ctx.fillStyle = '#161018';
  ctx.beginPath(); ctx.ellipse(0, -94, 13, 13, 0, 0, TAU); ctx.fill();
  // white mask
  ctx.fillStyle = '#cbbfa8';
  ctx.beginPath();
  ctx.ellipse(3, -94, 10, 11, 0.05, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a0d12';
  ctx.beginPath();
  ctx.ellipse(5, -92, 6.5, 4, 0, 0, TAU);
  ctx.fill();
  // horns
  ctx.strokeStyle = '#caa982';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-5, -102); ctx.quadraticCurveTo(-16, -118, -10, -124);
  ctx.moveTo(8, -102); ctx.quadraticCurveTo(20, -116, 14, -124);
  ctx.stroke();
  // glowing eyes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ff4d3d';
  ctx.shadowColor = '#ff3a30';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.ellipse(3, -95, 2.6, 1.4, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -95, 2.6, 1.4, 0, 0, TAU); ctx.fill();
  ctx.restore();

  // club arm
  let angle = -1.0;
  if (e.state === 'windup') angle = lerp(-1.0, -2.3, wind);
  else if (e.state === 'attack') angle = lerp(-2.3, 1.1, Math.min(1, swing * 2));
  const sx = 24, sy = -72;
  const hx = sx + Math.cos(angle) * 20;
  const hy = sy + Math.sin(angle) * 20;
  ctx.strokeStyle = '#1a1018';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(sx + 10, sy + 10, hx, hy);
  ctx.stroke();
  // club
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(angle);
  ctx.fillStyle = '#241318';
  ctx.fillRect(-6, -5, 34, 10);
  ctx.beginPath();
  ctx.moveTo(28, -13);
  ctx.lineTo(56, -16);
  ctx.lineTo(60, 0);
  ctx.lineTo(56, 16);
  ctx.lineTo(28, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7d6a5c';
  ctx.beginPath();
  ctx.moveTo(48, -16); ctx.lineTo(56, -8); ctx.lineTo(50, -2);
  ctx.lineTo(48, -16);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35 + wind * 0.5;
  ctx.strokeStyle = '#ff5a3c';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(54, 0); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ----------------------------------------------------------------------------
// PROJECTILES
// ----------------------------------------------------------------------------
export class Projectile {
  constructor(opts) {
    Object.assign(this, {
      type: 'arrow', x: 0, y: 0, vx: 0, vy: 0, r: 6, damage: 10,
      life: 2, maxLife: 2, color: '#ff9b6a', gravity: 0, dead: false,
      phase: rand(0, TAU), owner: 'enemy', destructible: true,
    }, opts);
    this.maxLife = this.life;
  }

  update(dt, game) {
    if (this.dead) return;
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    if (this.gravity) this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.phase += dt * 6;

    if (this.type === 'shock') {
      this.y = GROUND_Y;
      if (game.player.onGround && Math.abs(game.player.x - this.x) < this.r + 16 &&
          Math.abs(game.player.y - GROUND_Y) < 60) {
        if (game.player.takeDamage(this.damage, sign(this.vx))) this.dead = true;
      }
      if (Math.random() < dt * 20) {
        game.fx.dust(this.x, GROUND_Y, -sign(this.vx), 1);
      }
    } else if (this.type === 'rain') {
      if (this.y > GROUND_Y - 4) {
        this.dead = true;
        game.fx.ring(this.x, GROUND_Y - 8, 'rgba(255,80,90,0.75)', 40, 3, 0.32);
        game.fx.spark(this.x, GROUND_Y - 8, '#ff5c6e', 7, 240);
        game.shake(0.1);
        if (Math.abs(game.player.x - this.x) < 42 && game.player.y > GROUND_Y - 70) {
          game.player.takeDamage(this.damage, sign(this.x - game.player.x));
        }
      }
    } else {
      if (circleRect(this.x, this.y, this.r, game.player.rect)) {
        if (game.player.takeDamage(this.damage, sign(this.vx || 1))) this.dead = true;
      }
    }
    if (this.x < -80 || this.x > WORLD_W + 80 || this.y > GROUND_Y + 80) this.dead = true;
    if (this.type === 'orb' && Math.random() < dt * 12) {
      game.fx.ember(this.x, this.y, this.color, 1, 20, 0.5);
    }
  }

  draw(ctx) {
    if (this.dead) return;
    const fade = clamp(this.life / Math.min(this.maxLife, 0.5), 0, 1);
    ctx.save();
    if (this.type === 'shock') {
      const p = 1 - this.life / this.maxLife;
      const dir = sign(this.vx);
      ctx.translate(this.x, this.y);
      ctx.scale(dir, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85 * fade;
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = i === 0 ? '#fff2e0' : this.color;
        ctx.lineWidth = 4 - i;
        ctx.beginPath();
        ctx.arc(0, 0, 26 + i * 6, -1.2, 0.1);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,90,60,${0.16 * fade})`;
      ctx.beginPath(); ctx.ellipse(0, -18, 44, 30, 0, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }
    if (this.type === 'rain') {
      ctx.translate(this.x, this.y);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = fade;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r * 0.7, this.r * 2.4, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.22;
      ctx.beginPath(); ctx.arc(0, 0, this.r * 3, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }
    const ang = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    if (this.type === 'arrow') {
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.35 * fade;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(4, 0); ctx.stroke();
      ctx.globalAlpha = 0.9 * fade;
      ctx.strokeStyle = '#ffe8d0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(6, 0); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(3, -3); ctx.lineTo(3, 3); ctx.closePath(); ctx.fill();
    } else {
      // orb
      const r = this.r;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = fade;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.25, this.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r * 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

// ----------------------------------------------------------------------------
// PICKUPS
// ----------------------------------------------------------------------------
export class Pickup {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vy = -180;
    this.phase = rand(0, TAU);
    this.life = 14;
    this.dead = false;
    this.grounded = false;
  }

  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    this.phase += dt * 3;
    if (!this.grounded) {
      this.vy += GRAVITY * 0.6 * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y - 18) {
        this.y = GROUND_Y - 18;
        this.vy = 0;
        this.grounded = true;
      }
    }
    const p = game.player;
    if (Math.abs(p.x - this.x) < 38 && Math.abs(p.y - 34 - this.y) < 56) {
      this.dead = true;
      if (this.type === 'health') {
        p.heal(22);
        game.fx.text(this.x, this.y - 20, '+22', '#8dffc8', 20);
        game.fx.ring(this.x, this.y, 'rgba(110,255,190,0.8)', 50, 2, 0.3);
      } else {
        p.addFocus(40);
        game.fx.text(this.x, this.y - 20, '+40 FOCUS', '#9ef7ff', 16);
        game.fx.ring(this.x, this.y, 'rgba(110,220,255,0.8)', 50, 2, 0.3);
      }
      game.sound.sfx('pickup');
      game.fx.ember(this.x, this.y, this.type === 'health' ? '#7dffc0' : '#8ee8ff', 7, 120);
    }
  }

  draw(ctx) {
    const bob = Math.sin(this.phase * 2) * 3;
    const a = this.life < 3 ? (0.4 + Math.sin(this.life * 18) * 0.35) : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, a);
    ctx.translate(this.x, this.y + bob);
    const col = this.type === 'health' ? '#67ffb0' : '#7de8ff';
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
    g.addColorStop(0, col);
    g.addColorStop(0.4, this.type === 'health' ? 'rgba(80,255,170,0.32)' : 'rgba(90,220,255,0.32)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
    ctx.globalAlpha *= 0.95;
    ctx.fillStyle = this.type === 'health' ? 'rgba(20,80,45,0.9)' : 'rgba(20,50,80,0.9)';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#eafff4';
    if (this.type === 'health') {
      ctx.fillRect(-1.6, -4, 3.2, 8);
      ctx.fillRect(-4, -1.6, 8, 3.2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}
