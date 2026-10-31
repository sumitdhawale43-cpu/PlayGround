// Player and zombie entities. Rendering is vector art, no external assets.
import { WEAPONS, ZOMBIE_TYPES, BOSSES } from './data.js';
import {
  TAU, clamp, lerp, rand, randInt, chance, angleLerp, angleDiff, dist, norm, easeOutCubic,
} from './utils.js';

export class Player {
  constructor(game) {
    this.g = game;
    this.reset();
  }

  reset() {
    const w = this.g.world;
    this.x = w.w / 2;
    this.y = w.h / 2;
    this.r = 15;
    this.vx = 0;
    this.vy = 0;
    this.speed = 238;
    this.aim = -Math.PI / 2;
    this.moveAngle = -Math.PI / 2;
    this.anim = 0;
    this.walking = false;
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 0;
    this.shieldTimer = 0;
    this.shieldMax = 70;
    this.invuln = 0;
    this.hurtTimer = 0;
    this.dashTimer = 0;
    this.dashCdTimer = 0;
    this.dashCdBase = 1.25;
    this.dashDir = { x: 1, y: 0 };
    this.muzzleFlash = 0;
    this.muzzleAngle = 0;
    this.rapid = 0;
    this.damagePower = 0;
    this.weaponIndex = 0;
    this.stats = {
      damage: 1,
      fireRate: 1,
      reloadSpeed: 1,
      speed: 1,
      magnet: 1,
      crit: 0,
      pierce: 0,
      dashCd: 1,
      regen: 0,
      lifesteal: 0,
      armor: 0,
      reserveMul: 1,
    };
    this.upgradeLevels = {};
    this.stepTimer = 0;
    this.dead = false;
    this.weapons = WEAPONS.map((def) => ({
      def,
      mag: def.magSize,
      reserve: def.reserve,
      maxReserve: def.reserve,
      reloading: false,
      reloadTimer: 0,
      cooldown: 0,
      lastEmpty: 0,
    }));
  }

  get weapon() { return this.weapons[this.weaponIndex]; }

  get alive() { return this.hp > 0; }

  update(dt) {
    const input = this.g.input;
    const w = this.g.world;

    // timers
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashCdTimer = Math.max(0, this.dashCdTimer - dt);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt);
    this.rapid = Math.max(0, this.rapid - dt);
    this.damagePower = Math.max(0, this.damagePower - dt);
    if (this.shield > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer <= 0) this.shield = 0;
    }

    // weapon switching
    if (input.switchTo !== null) this.swapWeapon(input.switchTo);
    if (input.cycleQueued) this.cycleWeapon(input.cycleQueued);

    // aim
    if (input.aimsWithStick) {
      let a = Math.atan2(input.aimStick.y, input.aimStick.x);
      a = this.g.getAimAssist(this.x, this.y, a);
      this.aim = angleLerp(this.aim, a, 1 - Math.exp(-18 * dt));
    } else {
      const m = this.g.screenToWorld(input.mouse.x, input.mouse.y);
      const target = Math.atan2(m.y - this.y, m.x - this.x);
      this.aim = angleLerp(this.aim, target, 1 - Math.exp(-26 * dt));
    }
    if (this.aim > Math.PI) this.aim -= TAU;
    else if (this.aim < -Math.PI) this.aim += TAU;

    // movement
    const move = input.getMoveVector();
    this.walking = move.mag > 0.05;
    if (this.walking) this.moveAngle = Math.atan2(move.y, move.x);
    let speed = this.speed * this.stats.speed;

    if (this.dashTimer > 0) {
      speed *= 3.15;
      const targetVx = this.dashDir.x * speed;
      const targetVy = this.dashDir.y * speed;
      this.vx = lerp(this.vx, targetVx, 1 - Math.exp(-30 * dt));
      this.vy = lerp(this.vy, targetVy, 1 - Math.exp(-30 * dt));
      if (chance(dt * 60)) {
        this.g.spawnParticle({
          kind: 'smoke', x: this.x - this.dashDir.x * 8 + rand(-4, 4), y: this.y - this.dashDir.y * 8 + rand(-4, 4),
          vx: rand(-20, 20), vy: rand(-20, 20), life: 0.4, maxLife: 0.4, size: rand(3, 7), color: 'rgba(170,190,200,0.28)', grow: 12,
        });
      }
    } else {
      const targetVx = move.x * speed;
      const targetVy = move.y * speed;
      const accel = 1 - Math.exp(-(move.mag > 0.05 ? 16 : 11) * dt);
      this.vx = lerp(this.vx, targetVx, accel);
      this.vy = lerp(this.vy, targetVy, accel);
    }

    if (move.mag > 0.4 && this.walking && this.dashTimer <= 0) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.22;
        this.g.spawnParticle({
          kind: 'smoke', x: this.x + rand(-5, 5), y: this.y + 5, vx: rand(-8, 8), vy: rand(2, 12),
          life: 0.35, maxLife: 0.35, size: rand(2, 4), color: 'rgba(140,150,140,0.13)', grow: 9,
        });
      }
    }

    // dash
    const canDash = this.dashCdTimer <= 0;
    if (input.dashQueued && canDash) this.startDash(move);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // zombie body separation (prevents walking inside the horde)
    for (const z of this.g.zombies) {
      if (z.dead || z.spawnT < 0.22) continue;
      const dx = this.x - z.x;
      const dy = this.y - z.y;
      const min = this.r * 0.7 + z.r * 0.72;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.001 && d2 < min * min) {
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.32;
        this.x += (dx / d) * push;
        this.y += (dy / d) * push;
      }
    }

    this.x = clamp(this.x, 54, w.w - 54);
    this.y = clamp(this.y, 54, w.h - 54);

    this.anim += (Math.hypot(this.vx, this.vy) / 60 + 2) * dt;
    if (this.stats.regen > 0 && this.hp > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.stats.regen * dt);
    }

    // reload
    const wp = this.weapon;
    wp.cooldown = Math.max(0, wp.cooldown - dt);
    if (wp.reloading) {
      wp.reloadTimer -= dt;
      if (wp.reloadTimer <= 0) this.finishReload();
    }

    if (input.reloadQueued) this.startReload();

    // firing
    if (input.firing) {
      if (!wp.reloading && wp.cooldown <= 0 && wp.mag > 0) this.shoot();
      else if (!wp.reloading && wp.mag <= 0) {
        if (wp.reserve > 0) this.startReload();
        else if (this.g.time - wp.lastEmpty > 0.35) {
          wp.lastEmpty = this.g.time;
          this.g.sound.empty();
          this.g.toast('OUT OF AMMO — FIND A CRATE', 'warn');
        }
      }
    }

    if (this.dashCdTimer > 0 && this.dashTimer <= 0) {
      const w2 = this.dashCdTimer / (this.dashCdBase * this.stats.dashCd);
      this.g.dashCharge = 1 - clamp(w2, 0, 1);
    } else this.g.dashCharge = 1;
  }

  startDash(move) {
    const useMove = move.mag > 0.1;
    this.dashDir = useMove
      ? { x: move.x, y: move.y }
      : { x: Math.cos(this.aim), y: Math.sin(this.aim) };
    this.dashTimer = 0.16;
    this.invuln = Math.max(this.invuln, 0.3);
    this.dashCdTimer = this.dashCdBase * this.stats.dashCd;
    this.g.sound.dash();
    this.g.shake(2.5);
    this.g.ring(this.x, this.y, 34, 'rgba(180,220,230,0.35)', 0.35, 110);
    this.g.burstSparks(this.x, this.y, 6, '#b9d4dd', 90, 0.3);
  }

  swapWeapon(index) {
    index = clamp(index, 0, this.weapons.length - 1);
    if (index === this.weaponIndex) return;
    const cur = this.weapon;
    if (cur.reloading) { cur.reloading = false; cur.reloadTimer = 0; }
    this.weaponIndex = index;
    this.weapon.cooldown = Math.max(this.weapon.cooldown, 0.16);
    this.g.sound.swap();
    this.g.toast(this.weapon.def.name + ' READY', '');
  }

  cycleWeapon(delta) {
    const len = this.weapons.length;
    this.swapWeapon(((this.weaponIndex + delta) % len + len) % len);
  }

  startReload(silent = false) {
    const wp = this.weapon;
    if (wp.reloading || wp.mag >= wp.def.magSize) return;
    if (wp.reserve <= 0) {
      if (!silent) {
        this.g.sound.empty();
        this.g.toast('NO RESERVE AMMO — SCAVENGE CRATES', 'warn');
      }
      return;
    }
    wp.reloading = true;
    wp.reloadTimer = wp.def.reload / this.stats.reloadSpeed;
    if (!silent) this.g.sound.reload(0);
  }

  finishReload() {
    const wp = this.weapon;
    const need = wp.def.magSize - wp.mag;
    if (need <= 0) { wp.reloading = false; return; }
    if (wp.reserve === Infinity) {
      wp.mag = wp.def.magSize;
    } else {
      const take = Math.min(need, wp.reserve);
      wp.mag += take;
      wp.reserve -= take;
      wp.maxReserve = Math.round(wp.def.reserve * this.stats.reserveMul);
    }
    wp.reloading = false;
    this.g.sound.reload(1);
  }

  shoot() {
    const wp = this.weapon;
    const def = wp.def;
    if (wp.mag <= 0 || wp.reloading) return;
    wp.mag -= 1;
    const rapidMul = this.rapid > 0 ? 0.48 : 1;
    wp.cooldown = def.fireInterval / this.stats.fireRate * rapidMul;

    const movingSpread = Math.min(1.9, 1 + Math.hypot(this.vx, this.vy) / 420);
    const dmgMul = this.stats.damage * (this.damagePower > 0 ? 1.65 : 1);
    const muzzleX = this.x + Math.cos(this.aim) * (this.r + 12);
    const muzzleY = this.y + Math.sin(this.aim) * (this.r + 12);
    const pellets = def.pellets;

    for (let i = 0; i < pellets; i++) {
      let angle;
      if (pellets > 1) {
        const t = pellets === 1 ? 0 : i / (pellets - 1) - 0.5;
        angle = this.aim + t * def.spread * 2 + rand(-0.022, 0.022);
      } else {
        angle = this.aim + rand(-def.spread, def.spread) * movingSpread;
      }
      const crit = chance(this.stats.crit);
      const damage = def.damage * dmgMul * (crit ? 2 : 1);
      this.g.spawnBullet({
        x: muzzleX,
        y: muzzleY,
        angle,
        speed: def.speed * rand(0.97, 1.03),
        damage,
        crit,
        pierce: def.pierce + Math.floor(this.stats.pierce),
        knockback: def.knockback,
        color: def.tracer,
        weapon: def.id,
      });
    }

    // recoil, muzzle effects, sound
    this.vx -= Math.cos(this.aim) * def.recoil;
    this.vy -= Math.sin(this.aim) * def.recoil;
    this.muzzleFlash = 0.075;
    this.muzzleAngle = this.aim;
    this.g.shake(def.shake);
    this.g.crosshairKick = 1;
    const spreadParticles = def.id === 'shotgun' ? 9 : 4;
    for (let i = 0; i < spreadParticles; i++) {
      const a = this.aim + rand(-0.22, 0.22);
      const sp = rand(80, 320);
      this.g.spawnParticle({
        kind: 'spark', x: muzzleX, y: muzzleY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.06, 0.18), maxLife: 0.18, size: rand(1, 2.4), color: def.id === 'shotgun' ? '#ffc98a' : '#ffe6a8', drag: 5,
      });
    }
    this.g.spawnParticle({
      kind: 'smoke', x: muzzleX, y: muzzleY, vx: Math.cos(this.aim) * 40, vy: Math.sin(this.aim) * 40,
      life: 0.35, maxLife: 0.35, size: rand(3, 6), color: 'rgba(200,190,170,0.16)', grow: 34,
    });
    // shell casing
    const casingA = this.aim + Math.PI / 2 + rand(-0.3, 0.3);
    this.g.spawnParticle({
      kind: 'casing', x: this.x + Math.cos(this.aim) * 10, y: this.y + Math.sin(this.aim) * 10,
      vx: Math.cos(casingA) * rand(60, 130), vy: Math.sin(casingA) * rand(60, 130) - 20,
      life: 1.6, maxLife: 1.6, size: 2.4, color: '#dcb45a', rot: rand(0, TAU), rotSpeed: rand(-12, 12), drag: 5,
    });
    this.g.sound.shoot(def.id);
    this.g.muzzleLight = { x: muzzleX, y: muzzleY, angle: this.aim, life: 0.075, max: 0.075, color: def.color };
    this.g.lastShotWeapon = def.id;
  }

  takeDamage(amount, srcX = null, srcY = null, opts = {}) {
    if (this.hp <= 0 || this.invuln > 0 || this.dashTimer > 0 || this.g.mode !== 'playing') return false;
    let dmg = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, dmg);
      this.shield -= absorbed;
      dmg -= absorbed;
      this.shieldTimer = Math.max(this.shieldTimer, 1.5);
      this.g.sound.shieldHit();
      this.g.ring(this.x, this.y, this.r + 12, 'rgba(90,215,255,0.65)', 0.4, 90);
      this.g.shake(4);
      if (dmg <= 0) {
        this.invuln = 0.35;
        return true;
      }
    }
    dmg *= (1 - this.stats.armor);
    this.hp = Math.max(0, this.hp - dmg);
    this.invuln = 0.68;
    this.hurtTimer = 0.35;
    this.g.damageFlash = Math.min(1, this.g.damageFlash + 0.75);
    this.g.shake(8 + dmg * 0.22);
    this.g.sound.hurt();
    this.g.floatText(this.x, this.y - 24, '-' + Math.round(dmg), '#ff5c5f', 17);
    this.g.burstBlood(this.x, this.y, 7, '#a51e25', 160);
    this.g.hitDirection = srcX !== null ? Math.atan2(this.y - srcY, this.x - srcX) : rand(0, TAU);
    if (srcX !== null) {
      const n = norm(this.x - srcX, this.y - srcY);
      this.vx += n.x * 130;
      this.vy += n.y * 130;
    }
    if (this.hp <= 0) this.g.gameOver();
    return true;
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  addShield(amount, time = 12) {
    this.shieldMax = Math.max(this.shieldMax, amount);
    this.shield = Math.min(this.shieldMax, this.shield + amount);
    this.shieldTimer = Math.max(this.shieldTimer, time);
  }

  addAmmo(frac = 0.35) {
    let added = 0;
    for (const w of this.weapons) {
      if (w.reserve === Infinity) continue;
      w.maxReserve = Math.round(w.def.reserve * this.stats.reserveMul);
      const before = w.reserve;
      w.reserve = Math.min(w.maxReserve, w.reserve + Math.ceil(w.maxReserve * frac));
      added += w.reserve - before;
    }
    return added;
  }

  refillReserves() {
    for (const w of this.weapons) {
      if (w.reserve === Infinity) continue;
      w.maxReserve = Math.round(w.def.reserve * this.stats.reserveMul);
      w.reserve = w.maxReserve;
    }
  }

  render(ctx, time) {
    const blink = this.invuln > 0 && Math.floor(time * 22) % 2 === 0 ? 0.45 : 1;
    ctx.save();
    ctx.translate(this.x, this.y);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 7, this.r * 1.25, this.r * 0.72, 0, 0, TAU);
    ctx.fill();

    // legs
    ctx.save();
    ctx.rotate(this.moveAngle);
    const stride = this.walking ? Math.sin(this.anim * 7) * 5 : 0;
    ctx.strokeStyle = '#22282b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -6);
    ctx.lineTo(-7 + stride, -10);
    ctx.moveTo(-3, 6);
    ctx.lineTo(-7 - stride, 10);
    ctx.stroke();
    ctx.strokeStyle = '#101315';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-6 + stride, -10);
    ctx.lineTo(-8 + stride, -13);
    ctx.moveTo(-6 - stride, 10);
    ctx.lineTo(-8 - stride, 13);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(this.aim);
    ctx.globalAlpha = blink;

    // backpack
    ctx.fillStyle = '#202a26';
    ctx.beginPath();
    ctx.ellipse(-10, 0, 7, 10, 0, 0, TAU);
    ctx.fill();

    // torso
    ctx.fillStyle = '#2f3d33';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 12.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#182019';
    ctx.lineWidth = 2;
    ctx.stroke();
    // vest highlight
    ctx.fillStyle = '#44563f';
    ctx.beginPath();
    ctx.ellipse(2, 0, 8.5, 8.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,210,160,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(2, 0, 8.5, -1.1, 1.1);
    ctx.stroke();

    // shoulders
    ctx.fillStyle = '#26332b';
    ctx.beginPath();
    ctx.ellipse(1, -10, 5, 4, -0.4, 0, TAU);
    ctx.ellipse(1, 10, 5, 4, 0.4, 0, TAU);
    ctx.fill();

    // gun (extends forward)
    const kind = this.weapon.def.id;
    if (kind === 'shotgun') {
      ctx.fillStyle = '#1b1c1e';
      ctx.fillRect(12, -2.6, 25, 5.2);
      ctx.fillStyle = '#3a2f25';
      ctx.fillRect(5, -4.5, 10, 9);
      ctx.fillStyle = '#5c4a36';
      ctx.fillRect(20, 2, 7, 4);
      ctx.fillStyle = '#c9a86a';
      ctx.fillRect(30, -1.2, 6, 2.4);
    } else if (kind === 'smg') {
      ctx.fillStyle = '#1c2024';
      ctx.fillRect(12, -3.5, 21, 7);
      ctx.fillStyle = '#2a3035';
      ctx.fillRect(14, 2.5, 7, 9);
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(22, -1, 6, 2);
      ctx.fillStyle = '#0e1114';
      ctx.fillRect(31, -1.4, 5, 2.8);
    } else {
      ctx.fillStyle = '#1c1f22';
      ctx.fillRect(13, -2.3, 13, 4.6);
      ctx.fillStyle = '#2b3135';
      ctx.fillRect(12, 2, 6, 8);
      ctx.fillStyle = '#c9a86a';
      ctx.fillRect(24, -1, 4, 2);
    }

    // arms
    ctx.strokeStyle = '#6d7d58';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(1, -8);
    ctx.lineTo(10, -5);
    ctx.lineTo(15, 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#5c6b4b';
    ctx.beginPath();
    ctx.moveTo(1, 8);
    ctx.lineTo(9, 5);
    ctx.lineTo(14, 1.5);
    ctx.stroke();

    // head / cap
    ctx.fillStyle = '#b28c67';
    ctx.beginPath();
    ctx.arc(6, 0, 7.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#7b5f45';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#31402f';
    ctx.beginPath();
    ctx.arc(4.5, 0, 6.4, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();
    ctx.fillStyle = '#26331f';
    ctx.beginPath();
    ctx.ellipse(10.5, 0, 3.4, 4.6, 0, 0, TAU);
    ctx.fill();
    // flash light glint
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.beginPath();
    ctx.arc(12.8, 0, 1.6, 0, TAU);
    ctx.fill();

    // muzzle flash
    if (this.muzzleFlash > 0) {
      const f = this.muzzleFlash / 0.075;
      const mx = kind === 'shotgun' ? 37 : kind === 'smg' ? 36 : 28;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,220,140,${0.85 * f})`;
      ctx.beginPath();
      ctx.moveTo(mx, 0);
      ctx.lineTo(mx + 12 * f, -6 * f);
      ctx.lineTo(mx + 20 * f, 0);
      ctx.lineTo(mx + 12 * f, 6 * f);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,240,${0.9 * f})`;
      ctx.beginPath();
      ctx.arc(mx, 0, 4.5 * f, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // shield bubble
    if (this.shield > 0) {
      const ratio = this.shield / this.shieldMax;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(0, 0, this.r * 0.5, 0, 0, this.r + 17);
      grad.addColorStop(0, 'rgba(76,201,240,0)');
      grad.addColorStop(0.7, `rgba(76,201,240,${0.08 + ratio * 0.08})`);
      grad.addColorStop(1, `rgba(120,230,255,${0.24 + ratio * 0.24})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 17, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(140,235,255,${0.35 + ratio * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 16, time * 1.4, time * 1.4 + Math.PI * 1.45);
      ctx.stroke();
      ctx.restore();
    }

    if (this.dashCdTimer <= 0) {
      ctx.strokeStyle = 'rgba(255,183,3,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 7, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class Zombie {
  constructor(game, type, x, y, opts = {}) {
    this.g = game;
    this.type = type;
    this.isBoss = type === 'boss';
    if (this.isBoss) {
      this.def = {
        id: 'boss', name: 'BOSS', hp: 1500, speed: 55, radius: 54, damage: 24,
        attackCd: 1.0, coins: [40, 50], score: 600, body: '#5a1f22', bodyDark: '#2a0d0f',
        skin: '#b13a3f', accent: '#ff5c5f', eye: '#ffe066', blood: '#4a0f12', ranged: false,
      };
      this.bossIndex = opts.bossIndex || 1;
      const b = BOSSES[(this.bossIndex - 1) % BOSSES.length];
      this.bossColors = b;
      this.name = b.name;
    } else {
      this.def = ZOMBIE_TYPES[type];
    }
    this.x = x;
    this.y = y;
    this.spawnT = 0;
    this.r = this.def.radius * (this.isBoss ? 1 : rand(0.92, 1.08));
    const hpMul = game.difficulty.hp;
    this.maxHp = Math.round(this.def.hp * hpMul * (this.isBoss ? (1 + (this.bossIndex - 1) * 0.85) * 1.6 : 1));
    this.hp = this.maxHp;
    this.speed = this.def.speed * game.difficulty.speed * (this.isBoss ? 1 : rand(0.92, 1.08));
    this.damage = this.def.damage * game.difficulty.damage;
    this.vx = 0;
    this.vy = 0;
    this.angle = rand(0, TAU);
    this.anim = rand(0, TAU);
    this.hitFlash = 0;
    this.attackCd = rand(0.3, 0.8);
    this.contactCd = 0;
    this.lungeCd = rand(0.6, 2);
    this.lungeTimer = 0;
    this.fireCd = rand(1.2, 2.6);
    this.pulseCd = rand(1.5, 3.5);
    this.windup = 0;
    this.windupKind = null;
    this.attackAnim = 0;
    this.buffTimer = 0;
    this.slowTimer = 0;
    this.dead = false;
    this.lastHitDir = 0;
    this.state = 'chase';
    this.stateTimer = 0;
    this.bossAtkCd = 2.2;
    this.chargeAngle = 0;
    this.chargeHit = false;
    this.enraged = false;
    this.summonCount = 0;
    this.growlTimer = rand(2, 7);
  }

  get frozen() { return this.g.freeze > 0; }

  update(dt) {
    this.spawnT += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.contactCd = Math.max(0, this.contactCd - dt);
    this.lungeCd = Math.max(0, this.lungeCd - dt);
    this.lungeTimer = Math.max(0, this.lungeTimer - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);
    this.pulseCd = Math.max(0, this.pulseCd - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.buffTimer = Math.max(0, this.buffTimer - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.growlTimer -= dt;
    if (this.growlTimer <= 0) {
      this.growlTimer = rand(5, 11);
      if (this.g.camVisible(this.x, this.y, 300)) this.g.sound.growl(this.isBoss ? 0.5 : 1);
    }

    if (this.spawnT < 0.3 || this.dead) return;

    const p = this.g.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const d = Math.hypot(dx, dy) || 0.001;
    const nx = dx / d;
    const ny = dy / d;

    let speed = this.speed;
    if (this.frozen) speed *= this.isBoss ? 0.6 : 0.34;
    if (this.slowTimer > 0) speed *= 0.55;
    if (this.buffTimer > 0) speed *= 1.35;
    if (this.isBoss) {
      this.updateBoss(dt, d, nx, ny, speed);
      return;
    }

    // Face travel / player
    if (this.windup <= 0) {
      this.angle = angleLerp(this.angle, Math.atan2(dy, dx), 1 - Math.exp(-7 * dt));
    }

    let vx = 0;
    let vy = 0;
    let animSpeed = 1;

    if (this.type === 'spitter') {
      const pref = this.def.preferredRange;
      if (d < pref - 70) {
        vx = -nx * speed;
        vy = -ny * speed;
        this.angle = angleLerp(this.angle, Math.atan2(dy, dx), 1 - Math.exp(-5 * dt));
      } else if (d > pref + 70) {
        vx = nx * speed;
        vy = ny * speed;
      } else {
        const strafe = Math.sin(this.g.time * 0.9 + this.anim) * speed * 0.55;
        vx = -ny * strafe;
        vy = nx * strafe;
      }
      if (this.fireCd <= 0 && d < 560 && this.windup <= 0) {
        this.windup = 0.42;
        this.windupKind = 'spit';
        this.fireCd = this.def.attackCd * rand(0.85, 1.2);
      }
      animSpeed = 0.7;
    } else if (this.type === 'brute') {
      vx = nx * speed;
      vy = ny * speed;
      animSpeed = 0.6;
      if (d < 130 && this.attackCd <= 0 && this.windup <= 0) {
        this.windup = 0.62;
        this.windupKind = 'slam';
        this.attackCd = this.def.attackCd + 1.1;
        this.angle = Math.atan2(dy, dx);
        this.g.ring(this.x, this.y, 100, 'rgba(229,56,59,0.34)', 0.62, 0);
        this.g.sound.growl(0.6);
      }
      if (this.windup > 0) { vx = 0; vy = 0; }
    } else if (this.type === 'runner') {
      vx = nx * speed;
      vy = ny * speed;
      animSpeed = 1.6;
      if (this.lungeCd <= 0 && d > 70 && d < 250) {
        this.lungeCd = rand(2.8, 4.2);
        this.lungeTimer = 0.33;
        this.angle = Math.atan2(dy, dx);
        this.g.burstSparks(this.x, this.y, 4, '#d8cba8', 70, 0.25);
      }
      if (this.lungeTimer > 0) {
        vx *= 2.8;
        vy *= 2.8;
        this.g.spawnParticle({
          kind: 'smoke', x: this.x, y: this.y + 3, vx: -vx * 0.05, vy: -vy * 0.05,
          life: 0.28, maxLife: 0.28, size: 3, color: 'rgba(170,160,140,0.14)', grow: 7,
        });
      }
    } else if (this.type === 'screamer') {
      vx = nx * speed * 0.85;
      vy = ny * speed * 0.85;
      if (this.pulseCd <= 0) {
        this.pulseCd = 4.2;
        this.g.screamerPulse(this);
      }
      animSpeed = 1.1;
    } else {
      vx = nx * speed;
      vy = ny * speed;
      animSpeed = 1;
      if (this.type === 'walker' && this.g.time % 7 < dt) {
        vx *= 0.4;
        vy *= 0.4;
      }
    }

    // windup handling
    if (this.windup > 0) {
      this.windup -= dt;
      vx = 0;
      vy = 0;
      if (this.windupKind === 'slam') {
        this.g.spawnParticle({
          kind: 'smoke', x: this.x + rand(-20, 20), y: this.y + 8, vx: rand(-10, 10), vy: rand(-4, 2),
          life: 0.3, maxLife: 0.3, size: rand(4, 8), color: 'rgba(120,110,90,0.2)', grow: 16,
        });
      }
      if (this.windup <= 0) this.resolveWindup(d);
    }

    // separation from other zombies
    let sx = 0;
    let sy = 0;
    const zombies = this.g.zombies;
    for (let i = 0; i < zombies.length; i++) {
      const o = zombies[i];
      if (o === this || o.dead) continue;
      const ox = this.x - o.x;
      const oy = this.y - o.y;
      const min = (this.r + o.r) * 0.82;
      const od2 = ox * ox + oy * oy;
      if (od2 > 0.001 && od2 < min * min) {
        const od = Math.sqrt(od2);
        const force = (min - od) / min;
        sx += (ox / od) * force;
        sy += (oy / od) * force;
      }
    }
    vx += sx * speed * 0.9;
    vy += sy * speed * 0.9;

    // avoid stacking directly on the player
    if (d < this.r + p.r * 0.65) {
      vx -= nx * speed * 0.8;
      vy -= ny * speed * 0.8;
    }

    const accel = 1 - Math.exp(-(this.isBoss ? 4 : 9) * dt);
    this.vx = lerp(this.vx, vx, accel);
    this.vy = lerp(this.vy, vy, accel);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.anim += dt * animSpeed * (1 + Math.hypot(this.vx, this.vy) / 300);

    // melee
    if (d < this.r + p.r + 5 && this.attackCd <= 0 && this.windup <= 0) {
      if (this.type === 'brute') {
        // handled by windup, do nothing
      } else {
        this.attackCd = this.def.attackCd * rand(0.9, 1.15);
        this.attackAnim = 0.22;
        p.takeDamage(this.damage * (this.buffTimer > 0 ? 1.2 : 1), this.x, this.y);
        this.g.burstBlood(p.x, p.y, 2, '#7a1218', 70);
      }
    }

    const w = this.g.world;
    this.x = clamp(this.x, 40, w.w - 40);
    this.y = clamp(this.y, 40, w.h - 40);
  }

  resolveWindup(d) {
    const p = this.g.player;
    if (this.windupKind === 'slam') {
      this.g.sound.slam();
      this.g.shake(13);
      this.g.ring(this.x, this.y, 100, 'rgba(255,120,90,0.65)', 0.55, 420);
      this.g.dustBurst(this.x, this.y, 22, '#6b5d4a');
      if (d < 122) p.takeDamage(this.damage * 1.25, this.x, this.y);
    } else if (this.windupKind === 'spit') {
      const angle = Math.atan2(p.y - this.y, p.x - this.x) + rand(-0.05, 0.05);
      this.g.spawnAcid(this.x + Math.cos(angle) * this.r, this.y + Math.sin(angle) * this.r, angle, this.damage, 420);
      this.g.sound.spit();
      this.attackAnim = 0.3;
    }
    this.windupKind = null;
  }

  updateBoss(dt, d, nx, ny, speed) {
    const p = this.g.player;
    if (!this.enraged && this.hp < this.maxHp * 0.35) {
      this.enraged = true;
      this.speed *= 1.22;
      this.g.toast(`${this.name} IS ENRAGED`, 'danger');
      this.g.sound.boss();
      this.g.shake(10);
      this.g.ring(this.x, this.y, this.r + 40, 'rgba(255,60,60,0.8)', 0.8, 380);
    }

    const face = Math.atan2(p.y - this.y, p.x - this.x);
    if (this.state === 'chase') {
      if (this.windup <= 0) this.angle = angleLerp(this.angle, face, 1 - Math.exp(-5 * dt));
      this.vx = lerp(this.vx, nx * speed, 1 - Math.exp(-4 * dt));
      this.vy = lerp(this.vy, ny * speed, 1 - Math.exp(-4 * dt));
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.anim += dt * (1 + Math.hypot(this.vx, this.vy) / 300);
      this.bossAtkCd -= dt;
      if (d < this.r + p.r + 6 && this.contactCd <= 0) {
        this.contactCd = 0.85;
        p.takeDamage(this.damage, this.x, this.y);
        this.attackAnim = 0.3;
      }
      if (this.bossAtkCd <= 0) this.chooseBossAttack(d);
    } else if (this.state === 'chargeWind') {
      this.stateTimer -= dt;
      this.angle = angleLerp(this.angle, face, 1 - Math.exp(-9 * dt));
      this.chargeAngle = this.angle;
      this.vx *= 0.85;
      this.vy *= 0.85;
      this.g.spawnParticle({
        kind: 'ember', x: this.x + rand(-this.r, this.r), y: this.y + rand(-this.r, this.r),
        vx: rand(-20, 20), vy: rand(-30, 0), life: 0.4, maxLife: 0.4, size: rand(2, 4), color: 'rgba(255,120,90,0.7)',
      });
      if (this.stateTimer <= 0) {
        this.state = 'charge';
        this.stateTimer = 0.55;
        this.chargeHit = false;
        this.vx = Math.cos(this.chargeAngle) * 760;
        this.vy = Math.sin(this.chargeAngle) * 760;
        this.g.shake(6);
        this.g.sound.growl(0.4);
      }
    } else if (this.state === 'charge') {
      this.stateTimer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.anim += dt * 6;
      if (chance(dt * 50)) {
        this.g.dustBurst(this.x - Math.cos(this.chargeAngle) * 20, this.y - Math.sin(this.chargeAngle) * 20, 3, '#675a48');
      }
      if (!this.chargeHit && d < this.r + p.r + 12) {
        this.chargeHit = true;
        p.takeDamage(this.damage * 1.35, this.x, this.y);
        this.g.shake(14);
      }
      if (this.stateTimer <= 0) {
        this.state = 'recover';
        this.stateTimer = this.enraged ? 0.55 : 0.9;
        this.bossAtkCd = this.enraged ? 1.6 : 2.3;
      }
    } else if (this.state === 'slamWind') {
      this.stateTimer -= dt;
      this.vx *= 0.8;
      this.vy *= 0.8;
      if (chance(dt * 25)) this.g.dustBurst(this.x, this.y + 10, 2, '#5b5044');
      if (this.stateTimer <= 0) {
        this.state = 'recover';
        this.stateTimer = 0.95;
        this.bossAtkCd = this.enraged ? 1.7 : 2.5;
        this.g.sound.slam();
        this.g.shake(20);
        this.g.spawnShockwave(this.x, this.y, 300, this.damage * 1.5, '#ff6b5c');
        this.g.dustBurst(this.x, this.y, 30, '#6b5d4a');
      }
    } else if (this.state === 'summon') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        const count = this.enraged ? 6 : 4;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU + rand(-0.2, 0.2);
          const r = this.r + rand(30, 70);
          const types = this.g.availableZombieTypes().filter((t) => t !== 'brute');
          const t = types.length ? types[randInt(0, types.length - 1)] : 'walker';
          this.g.spawnZombie(t, this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, { noWarning: true });
          this.g.burstBlood(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, 4, '#3a0d0f', 100);
        }
        this.g.toast(`${this.name} CALLS THE HORDE`, 'danger');
        this.g.sound.boss();
        this.state = 'recover';
        this.stateTimer = 0.9;
        this.bossAtkCd = this.enraged ? 1.6 : 2.4;
      }
    } else if (this.state === 'volley') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        const base = Math.atan2(p.y - this.y, p.x - this.x);
        const count = this.enraged ? 9 : 6;
        for (let i = 0; i < count; i++) {
          const a = base + (i - (count - 1) / 2) * 0.16;
          this.g.spawnAcid(this.x + Math.cos(a) * this.r, this.y + Math.sin(a) * this.r, a, this.damage * 0.7, 470);
        }
        this.g.sound.spit();
        this.state = 'recover';
        this.stateTimer = 0.75;
        this.bossAtkCd = this.enraged ? 1.5 : 2.2;
      }
    } else if (this.state === 'recover') {
      this.stateTimer -= dt;
      this.vx *= 0.86;
      this.vy *= 0.86;
      if (this.stateTimer <= 0) this.state = 'chase';
    }

    const w = this.g.world;
    this.x = clamp(this.x, 54, w.w - 54);
    this.y = clamp(this.y, 54, w.h - 54);
  }

  chooseBossAttack(d) {
    const roll = Math.random();
    if (d < 210) {
      if (roll < 0.45) this.beginSlam();
      else if (roll < 0.7) this.beginSummon();
      else if (roll < 0.88) this.beginVolley();
      else this.beginCharge();
    } else {
      if (roll < 0.44) this.beginCharge();
      else if (roll < 0.66) this.beginSummon();
      else if (roll < 0.9) this.beginVolley();
      else this.beginSlam();
    }
  }

  beginCharge() {
    this.state = 'chargeWind';
    this.stateTimer = this.enraged ? 0.6 : 0.9;
    this.g.sound.growl(0.35);
  }

  beginSlam() {
    this.state = 'slamWind';
    this.stateTimer = this.enraged ? 0.7 : 1.0;
    this.g.sound.growl(0.4);
  }

  beginSummon() {
    this.state = 'summon';
    this.stateTimer = 0.85;
  }

  beginVolley() {
    this.state = 'volley';
    this.stateTimer = 0.7;
  }

  takeDamage(amount, opts = {}) {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 0.1;
    if (opts.crit) this.hitFlash = 0.16;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.g.killZombie(this, opts);
    }
  }

  drawTelegraph(ctx) {
    if (!this.isBoss) return;
    const pulse = 0.5 + Math.sin(this.g.time * 12) * 0.2;
    if (this.state === 'chargeWind') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.chargeAngle);
      const grad = ctx.createLinearGradient(0, 0, 780, 0);
      grad.addColorStop(0, `rgba(255,55,55,${0.3 * pulse + 0.12})`);
      grad.addColorStop(0.8, 'rgba(255,55,55,0.1)');
      grad.addColorStop(1, 'rgba(255,55,55,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, -this.r * 0.6, 780, this.r * 1.2);
      ctx.strokeStyle = `rgba(255,90,90,${pulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(780, 0);
      ctx.stroke();
      ctx.restore();
    } else if (this.state === 'slamWind') {
      ctx.save();
      ctx.strokeStyle = `rgba(255,80,60,${0.35 + pulse * 0.4})`;
      ctx.fillStyle = `rgba(255,60,40,${0.05 + pulse * 0.05})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 9]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, 300, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  render(ctx, time) {
    if (this.spawnT < 0.3) {
      // rise-from-ground spawn effect drawn by the warning; keep entity mostly hidden
    }
    const appear = clamp(this.spawnT / 0.3, 0, 1);
    const scale = this.isBoss ? easeOutCubic(appear) : lerp(0.55, 1, easeOutCubic(appear));
    const def = this.def;
    const bodyCol = this.isBoss ? this.bossColors.body : def.body;
    const darkCol = this.isBoss ? this.bossColors.dark : def.bodyDark;
    const skinCol = this.isBoss ? this.bossColors.skin : def.skin;
    const accent = this.isBoss ? this.bossColors.accent : def.accent;

    // shadow
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = appear;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, this.r * 0.5, this.r * 1.15, this.r * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.rotate(this.angle);
    ctx.globalAlpha = appear;
    const r = this.r;
    const wobble = Math.sin(this.anim * 6) * 0.12;

    // legs
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = Math.max(4, r * 0.24);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.34);
    ctx.lineTo(-r * 0.72, -r * 0.6 + Math.sin(this.anim * 7) * r * 0.16);
    ctx.moveTo(-r * 0.3, r * 0.34);
    ctx.lineTo(-r * 0.72, r * 0.6 - Math.sin(this.anim * 7) * r * 0.16);
    ctx.stroke();

    // arms reaching
    const reach = this.attackAnim > 0 ? 1.22 : 1;
    ctx.strokeStyle = skinCol;
    ctx.lineWidth = Math.max(3.5, r * 0.2);
    ctx.beginPath();
    ctx.moveTo(r * 0.1, -r * 0.55);
    ctx.lineTo(r * 0.92 * reach, -r * 0.68 - wobble * r);
    ctx.lineTo(r * 1.18 * reach, -r * 0.36);
    ctx.moveTo(r * 0.1, r * 0.55);
    ctx.lineTo(r * 0.92 * reach, r * 0.68 - wobble * r);
    ctx.lineTo(r * 1.18 * reach, r * 0.36);
    ctx.stroke();
    // hands
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.arc(r * 1.2 * reach, -r * 0.34, r * 0.16, 0, TAU);
    ctx.arc(r * 1.2 * reach, r * 0.34, r * 0.16, 0, TAU);
    ctx.fill();

    // body
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    if (this.type === 'runner') {
      ctx.ellipse(0, 0, r * 0.78, r * 0.58, 0, 0, TAU);
    } else if (this.type === 'brute' || this.isBoss) {
      ctx.ellipse(0, 0, r * 0.98, r * 0.88, 0, 0, TAU);
    } else {
      ctx.ellipse(0, 0, r * 0.84, r * 0.72, 0, 0, TAU);
    }
    ctx.fill();
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = 2;
    ctx.stroke();

    // torn shirt / ribs
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.globalAlpha = appear * 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, -0.8, 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r * 0.4);
    ctx.lineTo(-r * 0.4, -r * 0.15);
    ctx.stroke();
    ctx.globalAlpha = appear;

    // shoulders spikes for brute/boss
    if (this.type === 'brute' || this.isBoss) {
      ctx.fillStyle = accent;
      ctx.globalAlpha = appear * 0.5;
      for (let i = 0; i < 4; i++) {
        const a = -0.9 + i * 0.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
        ctx.lineTo(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12);
        ctx.lineTo(Math.cos(a + 0.18) * r * 0.7, Math.sin(a + 0.18) * r * 0.7);
        ctx.fill();
      }
      ctx.globalAlpha = appear;
    }

    // spitter sac
    if (this.type === 'spitter') {
      ctx.fillStyle = 'rgba(157,255,77,0.5)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, 0, r * 0.38, r * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,255,120,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // screamer ribs / open mouth
    if (this.type === 'screamer') {
      ctx.fillStyle = accent;
      ctx.globalAlpha = appear * 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3 + Math.sin(time * 8) * r * 0.04, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = appear;
    }

    // head
    const hx = r * 0.62;
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.arc(hx, 0, r * 0.48, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = darkCol;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // hair patch at back
    ctx.fillStyle = darkCol;
    ctx.beginPath();
    ctx.arc(hx - r * 0.16, 0, r * 0.38, Math.PI * 0.52, Math.PI * 1.48);
    ctx.fill();
    // eyes
    const eyeGlow = this.isBoss || this.buffTimer > 0;
    if (eyeGlow) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = this.isBoss ? this.bossColors.eye : accent;
      ctx.globalAlpha = 0.18 + Math.sin(time * 7) * 0.05;
      ctx.beginPath();
      ctx.arc(hx + r * 0.12, -r * 0.23, r * 0.24, 0, TAU);
      ctx.arc(hx + r * 0.12, r * 0.23, r * 0.24, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = appear;
    }
    ctx.fillStyle = this.isBoss ? this.bossColors.eye : def.eye;
    ctx.beginPath();
    ctx.arc(hx + r * 0.17, -r * 0.21, Math.max(1.4, r * 0.075), 0, TAU);
    ctx.arc(hx + r * 0.17, r * 0.21, Math.max(1.4, r * 0.075), 0, TAU);
    ctx.fill();
    // jaw / mouth
    ctx.fillStyle = '#201113';
    ctx.beginPath();
    ctx.ellipse(hx + r * 0.26, 0, r * 0.16, r * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,220,200,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx + r * 0.18, -r * 0.12);
    ctx.lineTo(hx + r * 0.3, -r * 0.12);
    ctx.moveTo(hx + r * 0.18, r * 0.12);
    ctx.lineTo(hx + r * 0.3, r * 0.12);
    ctx.stroke();

    // boss crown / horns
    if (this.isBoss) {
      ctx.fillStyle = this.bossColors.accent;
      ctx.globalAlpha = appear * 0.8;
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.9);
      ctx.lineTo(-r * 0.5, -r * 1.32);
      ctx.lineTo(-r * 0.55, -r * 0.72);
      ctx.moveTo(-r * 0.15, r * 0.9);
      ctx.lineTo(-r * 0.42, r * 1.3);
      ctx.lineTo(-r * 0.5, r * 0.7);
      ctx.fill();
      ctx.globalAlpha = appear;
      // glowing core
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.8);
      core.addColorStop(0, this.enraged ? 'rgba(255,70,40,0.65)' : 'rgba(255,120,80,0.34)');
      core.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // frozen tint
    if (this.frozen) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(140,210,255,0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // hit flash
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, this.hitFlash * 7)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.05, r * 0.92, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // buff aura
    if (this.buffTimer > 0) {
      ctx.strokeStyle = `rgba(255,205,70,${0.25 + Math.sin(time * 6) * 0.12})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();

    // health bar
    if (this.isBoss || (this.hp < this.maxHp && this.spawnT > 0.3)) {
      if (this.isBoss) {
        // main boss bar is DOM; small marker stays hidden
      } else {
        const w = Math.max(26, r * 2.1);
        const ratio = clamp(this.hp / this.maxHp, 0, 1);
        const y = this.y - r - 11;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(this.x - w / 2, y, w, 4);
        ctx.fillStyle = ratio > 0.5 ? '#9bc44a' : ratio > 0.25 ? '#ffb703' : '#e5383b';
        ctx.fillRect(this.x - w / 2, y, w * ratio, 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - w / 2 + 0.5, y + 0.5, w - 1, 3);
      }
    }
  }
}
