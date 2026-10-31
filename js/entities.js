import { TAU, clamp, dist, angleTo, angleDiff, hash2 } from './util.js';

export const WEAPONS = {
  fists: { name: 'Bare hands', short: 'HANDS', dmg: 6, range: 50, arc: 1.5, cd: 0.42, stamina: 5, type: 'blunt', knock: 60 },
  axe: { name: 'Hand axe', short: 'AXE', dmg: 15, range: 60, arc: 1.65, cd: 0.62, stamina: 12, type: 'slash', knock: 110 },
  spear: { name: 'Flint spear', short: 'SPEAR', dmg: 12, range: 92, arc: 0.8, cd: 0.55, stamina: 10, type: 'pierce', knock: 80 },
  torch: { name: 'Torch', short: 'TORCH', dmg: 7, range: 58, arc: 1.3, cd: 0.5, stamina: 7, type: 'fire', knock: 50 },
};

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.maxHp = 100;
    this.hp = 100;
    this.hunger = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.speed = 208;
    this.facing = -Math.PI / 2;
    this.weapon = 'fists';
    this.owned = { axe: false, spear: false, torch: false };
    this.inventory = { wood: 0, stone: 0, fiber: 0, flint: 0, berry: 2, meat: 0, bandage: 0, shard: 0 };
    this.attackCd = 0;
    this.attackAnim = 0;
    this.swingDir = 0;
    this.dodgeT = 0;
    this.dodgeCd = 0;
    this.invuln = 0;
    this.hurtT = 0;
    this.walkT = 0;
    this.staminaDelay = 0;
    this.dodgeDir = { x: 0, y: 0 };
    this.moving = false;
    this.stepDust = 0;
  }

  get weaponDef() { return WEAPONS[this.weapon]; }

  update(dt, input, world, game) {
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt * 4.2);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.staminaDelay = Math.max(0, this.staminaDelay - dt);

    let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const len = Math.hypot(ix, iy);
    if (len > 0) { ix /= len; iy /= len; }
    this.moving = len > 0;

    if (this.dodgeT > 0) {
      this.dodgeT -= dt;
      const sp = 560 * (0.55 + this.dodgeT * 1.6);
      world.moveEntity(this, this.dodgeDir.x * sp * dt, this.dodgeDir.y * sp * dt);
      game.spawnDust(this.x, this.y, 1);
      return;
    }

    if (input.dodge && this.dodgeCd <= 0 && this.stamina > 14) {
      this.dodgeT = 0.22;
      this.dodgeCd = 0.62;
      this.invuln = 0.3;
      this.stamina -= 16;
      this.staminaDelay = 0.5;
      const a = len > 0 ? Math.atan2(iy, ix) : this.facing;
      this.dodgeDir = { x: Math.cos(a), y: Math.sin(a) };
      game.memory.counters.dodges++;
      game.audio.sfx('dodge');
      game.spawnDust(this.x, this.y, 4);
      return;
    }

    const sprint = input.sprint && this.stamina > 2 && len > 0;
    const speed = this.speed * (sprint ? 1.48 : 1);
    if (sprint) {
      this.stamina = Math.max(0, this.stamina - 21 * dt);
      this.staminaDelay = 0.6;
    }
    this.walkT += dt * (sprint ? 13 : 9) * (len > 0 ? 1 : 0);

    if (len > 0) {
      world.moveEntity(this, ix * speed * dt, iy * speed * dt);
      this.stepDust -= dt;
      if (sprint && this.stepDust <= 0) {
        this.stepDust = 0.11;
        game.spawnDust(this.x, this.y + 6, 1);
      }
    }

    if (this.staminaDelay <= 0 && !sprint) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 26 * dt);
    }

    if (this.hunger <= 0) {
      this.hp -= 1.6 * dt;
      if (this.hp <= 0) game.die('Starved in a valley that had nothing left to give');
    } else {
      this.hunger = Math.max(0, this.hunger - 0.36 * dt);
      if (this.hunger > 55 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + 0.42 * dt);
    }
  }

  draw(ctx, cam, time, game) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const bob = this.moving ? Math.sin(this.walkT) * 1.6 : Math.sin(time * 2) * 0.6;
    const bobY = y + bob;

    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 7, 15, 6, 0, 0, TAU);
    ctx.fill();

    if (this.invuln > 0) {
      ctx.strokeStyle = `rgba(200, 220, 200, ${0.25 + Math.sin(time * 30) * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y - 4, 20, 0, TAU);
      ctx.stroke();
    }

    const hurt = this.hurtT > 0 ? `rgba(210, 80, 60, ${this.hurtT * 2})` : null;

    // cloak and shoulders
    ctx.save();
    ctx.translate(x, bobY - 6);
    ctx.rotate(this.facing + Math.PI / 2);
    ctx.scale(1.08, 1.08);

    // bedroll across the back
    ctx.fillStyle = '#6a5233';
    ctx.beginPath();
    ctx.ellipse(0, 7, 14, 5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#3c2c1b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-13, 5); ctx.lineTo(13, 5);
    ctx.moveTo(-13, 9); ctx.lineTo(13, 9);
    ctx.stroke();

    ctx.fillStyle = hurt || '#26332d';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(18, -6, 14, 15);
    ctx.quadraticCurveTo(0, 22, -14, 15);
    ctx.quadraticCurveTo(-18, -6, 0, -16);
    ctx.fill();

    ctx.fillStyle = hurt || '#3d5145';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(14, -5, 11, 13);
    ctx.quadraticCurveTo(0, 18, -11, 13);
    ctx.quadraticCurveTo(-14, -5, 0, -14);
    ctx.fill();

    ctx.fillStyle = hurt || '#4c6456';
    ctx.beginPath();
    ctx.moveTo(-9, -6);
    ctx.quadraticCurveTo(-4, 0, -7, 13);
    ctx.lineTo(-12, 11);
    ctx.quadraticCurveTo(-14, -2, -9, -6);
    ctx.fill();

    ctx.fillStyle = '#b58f55';
    ctx.fillRect(-10, 6, 20, 3.2);
    ctx.fillStyle = '#d7b273';
    ctx.fillRect(-10, 6, 20, 1.1);
    ctx.restore();

    // hood and face
    ctx.fillStyle = hurt || '#1d2925';
    ctx.beginPath();
    ctx.arc(x, bobY - 21, 10, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hurt || '#3f564a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, bobY - 21, 9.2, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();
    const fx = x + Math.cos(this.facing) * 3.2;
    const fy = bobY - 20 + Math.sin(this.facing) * 2.4;
    ctx.fillStyle = hurt || '#d9c6a2';
    ctx.beginPath();
    ctx.arc(fx, fy, 4.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(22, 26, 22, 0.8)';
    ctx.beginPath();
    ctx.arc(fx + Math.cos(this.facing) * 1.5, fy + Math.sin(this.facing) * 1.2, 1.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(181, 143, 85, 0.5)';
    ctx.beginPath();
    ctx.arc(fx - Math.cos(this.facing) * 2, fy - Math.sin(this.facing) * 1.5, 1.4, 0, TAU);
    ctx.fill();

    // weapon
    const wd = this.weaponDef;
    const swing = this.attackAnim;
    const dir = swing > 0 ? this.swingDir + (swing - 0.5) * wd.arc * 1.6 : this.facing;
    if (this.weapon !== 'fists') {
      const hx = x + Math.cos(dir) * 12;
      const hy = bobY - 8 + Math.sin(dir) * 7;
      const tipX = x + Math.cos(dir) * (12 + wd.range * 0.55);
      const tipY = bobY - 8 + Math.sin(dir) * (7 + wd.range * 0.4);
      ctx.strokeStyle = this.weapon === 'torch' ? '#5a4227' : '#8a7147';
      ctx.lineWidth = this.weapon === 'axe' ? 3 : 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      if (this.weapon === 'axe') {
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(dir);
        ctx.fillStyle = '#9ba29c';
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.lineTo(9, -11);
        ctx.lineTo(12, -4);
        ctx.lineTo(12, 5);
        ctx.lineTo(9, 10);
        ctx.lineTo(-2, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c7cdc4';
        ctx.beginPath();
        ctx.moveTo(9, -11);
        ctx.lineTo(12, -4);
        ctx.lineTo(12, 2);
        ctx.lineTo(10, -1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (this.weapon === 'spear') {
        ctx.fillStyle = '#c9c4b2';
        ctx.beginPath();
        ctx.moveTo(tipX + Math.cos(dir) * 7, tipY + Math.sin(dir) * 7);
        ctx.lineTo(tipX + Math.cos(dir + 1.5) * 3, tipY + Math.sin(dir + 1.5) * 3);
        ctx.lineTo(tipX + Math.cos(dir - 1.5) * 3, tipY + Math.sin(dir - 1.5) * 3);
        ctx.closePath();
        ctx.fill();
      } else if (this.weapon === 'torch') {
        const f = Math.sin(time * 12) * 2;
        ctx.fillStyle = 'rgba(240, 160, 60, 0.3)';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 20, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#f0a34e';
        ctx.beginPath();
        ctx.arc(tipX, tipY - 2, 5 + f * 0.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffe3a0';
        ctx.beginPath();
        ctx.arc(tipX, tipY - 2, 2.4, 0, TAU);
        ctx.fill();
      }
    }

    if (swing > 0.12) {
      ctx.strokeStyle = this.weapon === 'torch'
        ? `rgba(240, 150, 60, ${swing * 0.5})`
        : `rgba(236, 226, 200, ${swing * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, bobY - 8, wd.range * 0.72, this.swingDir - wd.arc * 0.7, this.swingDir + wd.arc * 0.7);
      ctx.stroke();
    }

    if (this.weapon === 'torch') {
      const flick = 0.85 + Math.sin(time * 11) * 0.08;
      ctx.fillStyle = `rgba(255, 190, 110, ${0.05 * flick})`;
      ctx.beginPath();
      ctx.arc(x, bobY - 8, 90, 0, TAU);
      ctx.fill();
    }
  }
}

const ENEMY_BASE = {
  wolf: {
    name: 'Wolf', hp: 38, speed: 206, dmg: 8, range: 36, sight: 330, windup: 0.36,
    cd: 0.85, radius: 14, xp: 1, color: '#4a453c',
  },
  hollow: {
    name: 'Hollow', hp: 64, speed: 126, dmg: 13, range: 46, sight: 420, windup: 0.52,
    cd: 1.15, radius: 15, xp: 2, color: '#3a3730',
  },
  warden: {
    name: 'Warden', hp: 190, speed: 92, dmg: 22, range: 62, sight: 470, windup: 0.78,
    cd: 1.5, radius: 24, xp: 5, color: '#4a4436',
  },
};

export class Enemy {
  constructor(type, x, y, game, opts = {}) {
    const base = ENEMY_BASE[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.hp = base.hp;
    this.maxHp = base.hp;
    this.speed = base.speed;
    this.dmg = base.dmg;
    this.range = base.range;
    this.sight = base.sight;
    this.windupTime = base.windup;
    this.cdTime = base.cd;
    this.radius = base.radius;
    this.base = base;
    this.name = base.name;
    this.traits = game.activeTraits;
    this.guard = opts.guard || null;
    this.state = 'wander';
    this.aggro = false;
    this.windup = 0;
    this.cd = 0;
    this.flash = 0;
    this.attackAnim = 0;
    this.wanderT = 0;
    this.wanderTarget = { x, y };
    this.facing = Math.random() * TAU;
    this.vx = 0;
    this.vy = 0;
    this.orbit = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7);
    this.orbitT = 0;
    this.stuckT = 0;
    this.stuckX = x;
    this.stuckY = y;
    this.dead = false;
    this.spawnT = 0;
    this.douseT = 0;
    this.emberEyes = false;
    this.fireResist = 0;
    this.slashResist = 0;
    this.feint = false;
    this.douseFires = false;
    this.lunge = false;
    this.elite = false;
    this.scale = 1;

    this.applyTraits();
    this.hp = this.maxHp;
  }

  applyTraits() {
    const t = this.traits;
    const has = (id) => t.includes(id);
    const count = t.length;

    this.maxHp = Math.round(this.maxHp * (1 + count * 0.055) * (1 + (this.type === 'warden' ? 0.15 : 0)));
    this.dmg = this.dmg * (1 + count * 0.035);

    if (has('emberhide')) { this.fireResist = 0.62; this.emberEyes = true; this.elite = true; }
    if (has('longreach')) { this.speed *= 1.09; this.range += 12; this.lunge = true; this.elite = true; }
    if (has('feint')) { this.feint = true; this.elite = true; }
    if (has('pursuit')) { this.speed *= 1.12; this.sight *= 1.28; this.elite = true; }
    if (has('nightborn')) { this.nightborn = true; this.elite = true; }
    if (has('ashen')) { this.douseFires = true; this.elite = true; }
    if (has('packmind') && this.type === 'wolf') { this.speed *= 1.06; this.packmind = true; this.elite = true; }
    if (has('thickhide')) { this.slashResist = 0.45; this.elite = true; }
    if (has('apex')) { this.maxHp *= 1.18; this.dmg *= 1.08; this.elite = true; }
    if (has('blooddebt')) { this.sight *= 1.22; this.elite = true; }

    if (this.type === 'warden') { this.speed *= 1 + count * 0.015; this.range += 4; }
  }

  update(dt, game) {
    const player = game.player;
    const world = game.world;
    this.spawnT += dt;
    this.flash = Math.max(0, this.flash - dt * 4);
    this.attackAnim = Math.max(0, this.attackAnim - dt * 4);
    this.cd = Math.max(0, this.cd - dt);
    this.windup = Math.max(0, this.windup - dt);

    if (this.vx || this.vy) {
      world.moveEntity(this, this.vx * dt, this.vy * dt);
      this.vx *= Math.pow(0.02, dt);
      this.vy *= Math.pow(0.02, dt);
    }

    const pd = dist(this.x, this.y, player.x, player.y);
    const nightBonus = this.nightborn && game.isNight ? 1.16 : 1;
    const speed = this.speed * nightBonus;

    if (!this.aggro && pd < this.sight && !player.dead) {
      this.aggro = true;
      this.state = 'chase';
      if (this.spawnT > 1) game.enemyAlert(this);
    }

    if (this.aggro && pd > this.sight * 1.9) {
      this.aggro = false;
      this.state = 'wander';
    }

    // Ashen enemies douse fires
    if (this.douseFires && game.isNight) {
      let fire = null;
      for (const p of game.world.campfires || []) {
        if (p.lit && dist(this.x, this.y, p.x, p.y) < 250) { fire = p; break; }
      }
      if (fire) {
        const fd = dist(this.x, this.y, fire.x, fire.y);
        if (fd < 34) {
          this.douseT += dt;
          if (this.douseT > 0.9) {
            fire.lit = false;
            fire.doused = true;
            this.douseT = 0;
            game.toast('A campfire hisses out. Something learned to hate the light.', 'warn');
            game.audio.sfx('douse');
          }
          return;
        } else if (fd < 260) {
          this.state = 'douse';
          this.moveToward(fire.x, fire.y, speed * 1.05, dt, world);
          return;
        }
      }
    }

    // avoid fire unless warden / ashen
    let fireFear = null;
    if (!this.douseFires && this.type !== 'warden') {
      for (const p of game.world.campfires || []) {
        if (p.lit) {
          const fd = dist(this.x, this.y, p.x, p.y);
          if (fd < 120) { fireFear = p; break; }
        }
      }
    }

    if (this.state === 'windup') {
      if (this.feint) this.facing = angleTo(this.x, this.y, player.x, player.y);
      if (this.windup <= 0) {
        const strikeRange = this.range + 18;
        if (dist(this.x, this.y, player.x, player.y) < strikeRange) {
          game.damagePlayer(this.dmg * nightBonus, this);
          this.attackAnim = 1;
        }
        this.state = 'recover';
        this.cd = this.cdTime;
        this.recoverT = 0.24;
      }
      return;
    }

    if (this.state === 'recover') {
      this.recoverT -= dt;
      if (this.recoverT <= 0) this.state = this.aggro ? 'chase' : 'wander';
      return;
    }

    if (this.aggro && !player.dead) {
      const a = angleTo(this.x, this.y, player.x, player.y);
      this.facing = a;
      this.orbitT += dt;
      if (pd < this.range + 6 && this.cd <= 0) {
        this.state = 'windup';
        this.windup = this.windupTime * (this.feint ? 1.55 : 1);
        game.audio.sfx(this.type === 'wolf' ? 'snarl' : 'growl');
        return;
      }
      if (pd < this.range * 0.9) {
        // back off slightly to keep attack range
        const back = this.type === 'warden' ? 0.2 : 0.55;
        this.moveToward(player.x - Math.cos(a) * 20, player.y - Math.sin(a) * 20, speed * back, dt, world, true);
      } else {
        let targetA = a;
        if (this.type === 'wolf' && pd > 100) targetA = a + Math.sin(this.orbitT * 1.7) * 0.5 * this.orbit;
        if (this.packmind) targetA += Math.sin(this.orbitT * 2.2) * 0.22;
        const lunge = this.lunge && pd > 130 && pd < 260 && Math.sin(this.orbitT * 3) > 0.94;
        this.moveToward(
          player.x - Math.cos(targetA) * (this.range * 0.7),
          player.y - Math.sin(targetA) * (this.range * 0.7),
          speed * (lunge ? 1.7 : 1),
          dt, world
        );
      }
      // separation
      for (const other of game.enemies) {
        if (other === this || other.dead) continue;
        const d = dist(this.x, this.y, other.x, other.y);
        if (d < this.radius + other.radius + 8 && d > 0.01) {
          const push = (this.radius + other.radius + 8 - d) * 0.5;
          world.moveEntity(this, ((this.x - other.x) / d) * push, ((this.y - other.y) / d) * push);
        }
      }
      return;
    }

    // wander
    this.wanderT -= dt;
    if (this.wanderT <= 0) {
      this.wanderT = 2 + Math.random() * 3;
      const a = Math.random() * TAU;
      const r = 20 + Math.random() * 70;
      this.wanderTarget = { x: this.spawnX + Math.cos(a) * r, y: this.spawnY + Math.sin(a) * r };
    }
    const wd = dist(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
    if (wd > 6) {
      this.facing = angleTo(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
      this.moveToward(this.wanderTarget.x, this.wanderTarget.y, speed * 0.3, dt, world);
    }
  }

  moveToward(tx, ty, speed, dt, world, slow = false) {
    const a = angleTo(this.x, this.y, tx, ty);
    let dx = Math.cos(a) * speed * dt;
    let dy = Math.sin(a) * speed * dt;
    if (slow) { dx *= 0.6; dy *= 0.6; }
    const beforeX = this.x, beforeY = this.y;
    world.moveEntity(this, dx, dy);
    if (Math.abs(this.x - beforeX) < 0.01 && Math.abs(this.y - beforeY) < 0.01) {
      // slide along obstacle
      world.moveEntity(this, Math.cos(a + Math.PI / 2) * speed * dt, Math.sin(a + Math.PI / 2) * speed * dt);
      if (this.x === beforeX && this.y === beforeY) {
        world.moveEntity(this, Math.cos(a - Math.PI / 2) * speed * dt, Math.sin(a - Math.PI / 2) * speed * dt);
      }
    }
  }

  takeDamage(amount, type, game, knock = 0, fromAngle = 0) {
    if (this.dead) return 0;
    let dmg = amount;
    if (type === 'fire') dmg *= 1 - clamp(this.fireResist + (game.learned?.fire || 0) * 0.8, 0, 0.85);
    if (type === 'slash') dmg *= 1 - clamp(this.slashResist + (game.learned?.slash || 0) * 0.55, 0, 0.85);
    if (type === 'pierce') dmg *= 1 - clamp((game.learned?.pierce || 0) * 0.45, 0, 0.6);
    if (type === 'blunt') dmg *= 1 - clamp((game.learned?.blunt || 0) * 0.45, 0, 0.6);
    dmg = Math.max(1, Math.round(dmg));
    this.hp -= dmg;
    this.flash = 1;
    this.aggro = true;
    if (this.state === 'wander') this.state = 'chase';
    if (knock) {
      this.vx += Math.cos(fromAngle) * knock;
      this.vy += Math.sin(fromAngle) * knock;
    }
    game.spawnBlood(this.x, this.y, type === 'fire' ? 'fire' : 'blood', Math.min(9, 2 + dmg * 0.25));
    if (this.hp <= 0) {
      this.dead = true;
      game.onEnemyKilled(this);
    }
    return dmg;
  }

  draw(ctx, cam, time, game) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const isNight = game.isNight;

    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 6, this.radius + 5, (this.radius + 5) * 0.4, 0, 0, TAU);
    ctx.fill();

    const hurt = this.flash > 0.35;
    ctx.save();
    ctx.translate(x, y - 3);
    ctx.rotate(this.facing + Math.PI / 2);

    if (this.type === 'wolf') {
      const run = Math.sin(time * 12 + this.x) * 2.4;
      const fur = hurt ? '#d9a08f' : this.emberEyes ? '#43392d' : '#4a453c';
      const furDark = hurt ? '#c98f7e' : '#332f29';
      ctx.strokeStyle = hurt ? '#e8b6a4' : '#2e2b26';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, 5); ctx.lineTo(-10, 15 + run * 0.4);
      ctx.moveTo(7, 5); ctx.lineTo(10, 15 - run * 0.4);
      ctx.moveTo(-5, -10); ctx.lineTo(-7, -2 - run * 0.3);
      ctx.moveTo(5, -10); ctx.lineTo(7, -2 + run * 0.3);
      ctx.stroke();
      // tail
      ctx.strokeStyle = furDark;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.quadraticCurveTo(9, 24, 5, 31 + run * 0.6);
      ctx.stroke();
      // body
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, 1, 12, 20, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = furDark;
      ctx.beginPath();
      ctx.ellipse(0, 7, 9, 12, 0, 0, TAU);
      ctx.fill();
      // shoulder ruff
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, -10, 11, 9, 0, 0, TAU);
      ctx.fill();
      // head
      ctx.fillStyle = furDark;
      ctx.beginPath();
      ctx.ellipse(0, -17, 8, 8, 0, 0, TAU);
      ctx.fill();
      // snout
      ctx.fillStyle = furDark;
      ctx.beginPath();
      ctx.moveTo(-4, -20);
      ctx.lineTo(0, -29);
      ctx.lineTo(4, -20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a1815';
      ctx.beginPath();
      ctx.arc(0, -27, 1.7, 0, TAU);
      ctx.fill();
      // ears
      ctx.fillStyle = furDark;
      ctx.beginPath();
      ctx.moveTo(-7, -20); ctx.lineTo(-5, -27); ctx.lineTo(-2, -20); ctx.closePath();
      ctx.moveTo(7, -20); ctx.lineTo(5, -27); ctx.lineTo(2, -20); ctx.closePath();
      ctx.fill();
      // eyes
      ctx.fillStyle = this.emberEyes ? '#ffad55' : isNight ? '#f0c070' : '#d8b36a';
      ctx.beginPath();
      ctx.arc(-3.2, -18, 1.6, 0, TAU);
      ctx.arc(3.2, -18, 1.6, 0, TAU);
      ctx.fill();
      if (this.emberEyes) {
        ctx.fillStyle = 'rgba(240, 140, 50, 0.22)';
        ctx.beginPath();
        ctx.arc(0, -18, 11, 0, TAU);
        ctx.fill();
      }
    } else if (this.type === 'hollow') {
      const bob = Math.sin(time * 4 + this.x) * 1;
      ctx.fillStyle = hurt ? '#d9a08f' : '#2f2c27';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(14, -4, 11, 15);
      ctx.quadraticCurveTo(0, 20, -11, 15);
      ctx.quadraticCurveTo(-14, -4, 0, -14);
      ctx.fill();
      ctx.fillStyle = hurt ? '#e8b6a4' : '#3b372f';
      ctx.beginPath();
      ctx.arc(0, -16 + bob, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#171512';
      ctx.beginPath();
      ctx.arc(0, -16 + bob, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.emberEyes ? '#f09a4a' : '#b9c0a0';
      ctx.beginPath();
      ctx.arc(-2.4, -17 + bob, 1.4, 0, TAU);
      ctx.arc(2.4, -17 + bob, 1.4, 0, TAU);
      ctx.fill();
      const sw = this.attackAnim;
      ctx.strokeStyle = '#8b7350';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, 2);
      ctx.lineTo(9 + Math.cos(sw * 2) * 22, 2 - 14 + Math.sin(sw * 2) * 6);
      ctx.stroke();
      ctx.fillStyle = '#b9b4a3';
      ctx.beginPath();
      ctx.ellipse(9 + Math.cos(sw * 2) * 24, -12 + Math.sin(sw * 2) * 6, 2.5, 6, 0.4, 0, TAU);
      ctx.fill();
    } else if (this.type === 'warden') {
      const bob = Math.sin(time * 2 + this.x) * 1.5;
      ctx.fillStyle = hurt ? '#d9a08f' : '#3d382e';
      ctx.beginPath();
      ctx.ellipse(0, 4, 20, 25, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = hurt ? '#e8b6a4' : '#4c463a';
      ctx.beginPath();
      ctx.ellipse(-10, -8 + bob, 8, 12, -0.3, 0, TAU);
      ctx.ellipse(10, -8 + bob, 8, 12, 0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2b2822';
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.emberEyes ? '#ffb05a' : '#7fd0b0';
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 4.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(127, 208, 176, 0.16)';
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 16, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hurt ? '#e8b6a4' : '#2f2b24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-14, 18); ctx.lineTo(-17, 28);
      ctx.moveTo(14, 18); ctx.lineTo(17, 28);
      ctx.stroke();
      ctx.strokeStyle = '#6b5b3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, -2);
      ctx.lineTo(16 + Math.cos(this.attackAnim * 2) * 30, 12 + Math.sin(this.attackAnim * 2) * 10);
      ctx.stroke();
    }
    ctx.restore();

    if (this.state === 'windup') {
      const p = 1 - this.windup / (this.windupTime * (this.feint ? 1.55 : 1));
      ctx.strokeStyle = `rgba(201, 96, 77, ${0.25 + p * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 4, this.range + 8, this.facing - 0.45, this.facing + 0.45);
      ctx.stroke();
      ctx.strokeStyle = `rgba(201, 96, 77, ${0.1 + p * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y - 4, this.radius + 6 + p * 8, 0, TAU);
      ctx.stroke();
    }

    if (this.hp < this.maxHp) {
      const w = 34;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - w / 2, y - this.radius - 26, w, 3);
      ctx.fillStyle = this.type === 'warden' ? '#c9604d' : '#c98a5a';
      ctx.fillRect(x - w / 2, y - this.radius - 26, w * clamp(this.hp / this.maxHp, 0, 1), 3);
    }
    if (this.elite) {
      ctx.fillStyle = 'rgba(227, 180, 107, 0.65)';
      ctx.font = '8px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.traitLabel || 'ADAPTED', x, y - this.radius - 32);
    }
  }
}

export class NPC {
  constructor(key, name, x, y, robe, accent) {
    this.key = key;
    this.name = name;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.robe = robe;
    this.accent = accent;
    this.facing = Math.random() * TAU;
    this.radius = 13;
    this.hp = 90;
    this.maxHp = 90;
    this.fleeT = 0;
    this.wanderT = 0;
    this.wanderTarget = { x, y };
    this.hurtT = 0;
    this.dead = false;
    this.solid = true;
  }

  update(dt, game) {
    this.hurtT = Math.max(0, this.hurtT - dt);
    const p = game.player;
    const d = dist(this.x, this.y, p.x, p.y);
    if (this.fleeT > 0) {
      this.fleeT -= dt;
      const a = Math.atan2(this.y - p.y, this.x - p.x);
      game.world.moveEntity(this, Math.cos(a) * 160 * dt, Math.sin(a) * 160 * dt);
      this.facing = a;
      return;
    }
    if (d < 150) {
      this.facing = Math.atan2(p.y - this.y, p.x - this.x);
      return;
    }
    this.wanderT -= dt;
    if (this.wanderT <= 0) {
      this.wanderT = 3 + Math.random() * 4;
      const a = Math.random() * TAU;
      this.wanderTarget = {
        x: this.homeX + Math.cos(a) * 50,
        y: this.homeY + Math.sin(a) * 40,
      };
    }
    if (dist(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y) > 8) {
      const a = Math.atan2(this.wanderTarget.y - this.y, this.wanderTarget.x - this.x);
      this.facing = a;
      game.world.moveEntity(this, Math.cos(a) * 38 * dt, Math.sin(a) * 38 * dt);
    }
  }

  takeDamage(amount, game, fromAngle) {
    this.hp -= amount;
    this.hurtT = 1;
    this.fleeT = 6;
    game.memory.counters.npcHits++;
    game.spawnBlood(this.x, this.y, 'blood', 5);
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      game.onNpcKilled(this);
    }
  }

  draw(ctx, cam, time, game) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const bob = Math.sin(time * 2.2 + this.homeX) * 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 1, y + 6, 14, 5, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y - 4 + bob);
    ctx.rotate(this.facing + Math.PI / 2);
    ctx.fillStyle = this.hurtT > 0 ? '#d9a08f' : this.robe;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(14, -4, 11, 14);
    ctx.quadraticCurveTo(0, 18, -11, 14);
    ctx.quadraticCurveTo(-14, -4, 0, -14);
    ctx.fill();
    ctx.fillStyle = this.accent;
    ctx.fillRect(-8, 4, 16, 3);
    ctx.fillStyle = this.hurtT > 0 ? '#e8b6a4' : '#c9b391';
    ctx.beginPath();
    ctx.arc(0, -19, 7.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a2620';
    ctx.beginPath();
    ctx.arc(0, -21, 7.5, Math.PI, TAU);
    ctx.fill();
    ctx.restore();

    ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(227, 180, 107, 0.8)';
    ctx.fillText(this.name.toUpperCase(), x, y - 36);
    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - 15, y - 31, 30, 2.5);
      ctx.fillStyle = '#c9604d';
      ctx.fillRect(x - 15, y - 31, 30 * clamp(this.hp / this.maxHp, 0, 1), 2.5);
    }
  }
}
