// SHADOW NINJA — Kagemasa, the Oni Shogun (multi-phase boss)

import { TAU, GROUND_Y, WORLD_W, clamp, lerp, rand, pick, sign, easeOutCubic, circleRect } from './utils.js';

export class Boss {
  constructor(game, x, wave) {
    this.game = game;
    this.type = 'boss';
    this.name = 'KAGEMASA';
    this.title = 'THE ONI SHOGUN';
    this.w = 110;
    this.h = 168;
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.maxHp = 880;
    this.hp = this.maxHp;
    this.phase = 1;
    this.state = 'intro';
    this.timer = 2.4;
    this.pattern = null;
    this.patternT = 0;
    this.didDamage = false;
    this.hitFlash = 0;
    this.invuln = 2.6;
    this.dead = false;
    this.deathTimer = 0;
    this.anim = 0;
    this.alpha = 1;
    this.lastPattern = '';
    this.actionTick = 0;
    this.summonedThisPattern = false;
    this.phaseBurstDone = false;
    this.telegraph = 0;
    this.telegraphType = '';
    this.scoreValue = 6000;
    this.id = 99999;
  }

  get rect() {
    return { x: this.x - 46, y: this.y - 150, w: 92, h: 150 };
  }

  get alive() {
    return !this.dead;
  }

  update(dt, game) {
    this.anim += dt;
    if (this.dead) {
      this.deathTimer += dt;
      this.vy += 1200 * dt;
      this.y = Math.min(GROUND_Y, this.y + this.vy * dt);
      this.vx *= Math.exp(-3 * dt);
      this.x += this.vx * dt;
      if (this.deathTimer < 2.6 && Math.random() < dt * 7) {
        const ex = this.x + rand(-70, 70);
        const ey = this.y - rand(20, 150);
        game.fx.ember(ex, ey, pick(['#ff6a55', '#ffb26b', '#ff3355']), 12, 320, 1.1);
        game.fx.spark(ex, ey, '#ffe8c0', 5, 300);
        game.fx.smoke(ex, ey, '70,40,50', 2, 24);
        game.shake(0.2);
      }
      return;
    }
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.telegraph = Math.max(0, this.telegraph - dt);
    const player = game.player;
    const dx = player.x - this.x;
    const adx = Math.abs(dx);
    const dir = sign(dx || 1);

    if (this.state !== 'action' && this.state !== 'windup' && this.state !== 'phase') {
      this.facing = dir;
    }

    // gravity / ground
    this.vy += 2400 * dt;
    this.y = Math.min(GROUND_Y, this.y + this.vy * dt);
    if (this.y >= GROUND_Y) { this.y = GROUND_Y; this.vy = 0; }

    switch (this.state) {
      case 'intro': {
        this.timer -= dt;
        this.vx *= Math.exp(-6 * dt);
        if (this.timer <= 0) {
          this.state = 'idle';
          this.timer = 0.7;
          game.sound.sfx('roar');
          game.shake(0.5);
          game.fx.ring(this.x, this.y - 40, 'rgba(255,60,70,0.9)', 220, 7, 0.8, 20);
          game.fx.ember(this.x, this.y - 90, '#ff5b4a', 40, 340, 1.6);
          this.invuln = 0.4;
        }
        break;
      }
      case 'idle': {
        this.timer -= dt;
        this.vx = lerp(this.vx, 0, Math.min(1, dt * 6));
        if (adx > 280) this.vx = lerp(this.vx, dir * 95, Math.min(1, dt * 4));
        else if (adx < 130) this.vx = lerp(this.vx, -dir * 55, Math.min(1, dt * 3));
        if (this.timer <= 0) this.choosePattern(game, player, adx);
        break;
      }
      case 'windup': {
        this.timer -= dt;
        this.vx *= Math.exp(-8 * dt);
        this.updateWindupFx(dt, game, player);
        if (this.timer <= 0) this.startAction(game, player);
        break;
      }
      case 'action':
        this.updateAction(dt, game, player);
        break;
      case 'recover': {
        this.timer -= dt;
        this.vx *= Math.exp(-7 * dt);
        if (this.timer <= 0) {
          this.state = 'idle';
          this.timer = this.phase >= 3 ? 0.28 : this.phase >= 2 ? 0.42 : 0.55;
        }
        break;
      }
      case 'phase': {
        this.timer -= dt;
        this.vx *= Math.exp(-9 * dt);
        if (!this.phaseBurstDone && this.timer < 0.95) {
          this.phaseBurstDone = true;
          this.phaseBurst(game, player);
        }
        if (this.timer <= 0) {
          this.state = 'idle';
          this.timer = 0.3;
          this.alpha = 1;
          this.invuln = 0.2;
        }
        break;
      }
    }

    this.x += this.vx * dt;
    this.x = clamp(this.x, 180, WORLD_W - 120);
  }

  choosePattern(game, player, adx) {
    const pool = ['dashSlash', 'fanVolley', 'slam'];
    if (this.phase >= 2) {
      pool.push('teleportSlash');
      if (game.enemies.filter((e) => !e.dead && e.type !== 'boss').length < 3) pool.push('summon');
    }
    if (this.phase >= 3) pool.push('rain', 'fanVolley');
    let choices = pool.filter((p) => p !== this.lastPattern);
    if (!choices.length) choices = pool;
    const pattern = pick(choices);
    this.lastPattern = pattern;
    this.pattern = pattern;
    this.state = 'windup';
    this.didDamage = false;
    this.summonedThisPattern = false;
    this.actionTick = 0;

    if (pattern === 'dashSlash') {
      this.timer = this.phase >= 3 ? 0.44 : 0.58;
      this.telegraph = 0.58;
      this.telegraphType = 'line';
      this.facing = sign(player.x - this.x) || 1;
      game.sound.sfx('click');
    } else if (pattern === 'fanVolley') {
      this.timer = 0.5;
      this.telegraph = 0.5;
      this.telegraphType = 'fan';
    } else if (pattern === 'slam') {
      this.timer = 0.62;
      this.telegraph = 0.62;
      this.telegraphType = 'circle';
      game.sound.sfx('click');
    } else if (pattern === 'teleportSlash') {
      this.timer = 0.5;
      this.telegraph = 0.5;
      this.telegraphType = 'none';
      game.fx.smoke(this.x, this.y - 70, '90,30,50', 8, 30);
      game.sound.sfx('dash');
    } else if (pattern === 'summon') {
      this.timer = 0.7;
      this.telegraph = 0.7;
      this.telegraphType = 'circle';
    } else if (pattern === 'rain') {
      this.timer = 0.55;
      this.telegraph = 0.55;
      this.telegraphType = 'rain';
      this.facing = sign(player.x - this.x) || 1;
    }
  }

  updateWindupFx(dt, game, player) {
    if (this.pattern === 'teleportSlash') {
      this.alpha = lerp(this.alpha, 0, Math.min(1, dt * 6));
      if (Math.random() < dt * 30) game.fx.ember(this.x + rand(-40, 40), this.y - rand(10, 150), '#c53a65', 3, 140);
    } else if (this.pattern === 'rain') {
      if (Math.random() < dt * 28) game.fx.ember(this.x + rand(-70, 70), this.y - rand(20, 160), '#ff4f60', 2, 90);
    } else if (this.pattern === 'dashSlash' && Math.random() < dt * 22) {
      game.fx.spark(this.x + rand(-40, 40), this.y - rand(20, 150), '#ff7a6a', 1, 80, { grav: -80 });
    } else if (this.pattern === 'slam' && Math.random() < dt * 20) {
      game.fx.dust(this.x + rand(-60, 60), this.y, 0, 1);
    }
  }

  startAction(game, player) {
    this.state = 'action';
    this.patternT = 0;
    this.actionTick = 0;
    this.didDamage = false;
    const p = this.pattern;

    if (p === 'dashSlash') {
      this.timer = 0.5;
      this.facing = sign(player.x - this.x) || 1;
      this.vx = this.facing * (this.phase >= 3 ? 1180 : 980);
      game.sound.sfx('slashHeavy');
      game.shake(0.42);
      game.fx.slash(this.x + this.facing * 40, this.y - 80, this.facing > 0 ? 0 : Math.PI, 130, '#ff5a6e', 0.35, 16, 2.6);
      game.fx.ring(this.x, this.y - 80, 'rgba(255,60,70,0.8)', 110, 5, 0.4);
    } else if (p === 'fanVolley') {
      this.timer = 0.62;
      this.fireFan(game, player);
      this.actionTick = 0.2;
    } else if (p === 'slam') {
      this.timer = 0.5;
      this.doSlam(game, player);
    } else if (p === 'teleportSlash') {
      // appear behind the player
      const behind = player.x - player.facing * 115;
      this.x = clamp(behind, 260, WORLD_W - 200);
      this.y = GROUND_Y;
      this.facing = sign(player.x - this.x) || 1;
      this.alpha = 1;
      this.timer = 0.52;
      this.vx = this.facing * 620;
      this.didDamage = false;
      game.fx.smoke(this.x, this.y - 80, '100,30,55', 12, 38);
      game.fx.ring(this.x, this.y - 60, 'rgba(255,70,90,0.9)', 100, 4, 0.35);
      game.fx.slash(this.x + this.facing * 40, this.y - 80, this.facing > 0 ? -0.1 : Math.PI + 0.1, 130, '#ff5068', 0.34, 14, 2.4);
      game.sound.sfx('slashHeavy');
      game.shake(0.36);
    } else if (p === 'summon') {
      this.timer = 0.55;
      game.spawnBossMinions(this, 2);
      game.sound.sfx('roar');
      game.shake(0.3);
    } else if (p === 'rain') {
      this.timer = 1.6;
      this.actionTick = 0;
      game.sound.sfx('roar');
      game.shake(0.3);
      game.fx.ring(this.x, this.y - 90, 'rgba(255,50,70,0.85)', 150, 5, 0.5);
    }
  }

  fireFan(game, player) {
    const n = this.phase >= 3 ? 7 : 5;
    const base = Math.atan2((player.y - 34) - (this.y - 95), player.x - this.x);
    const spread = 0.72;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (spread / (n - 1)) * 2;
      game.spawnEnemyProjectile({
        type: 'orb',
        x: this.x + Math.cos(a) * 50,
        y: this.y - 100 + Math.sin(a) * 50,
        vx: Math.cos(a) * (this.phase >= 3 ? 500 : 430),
        vy: Math.sin(a) * (this.phase >= 3 ? 500 : 430),
        r: 9, damage: Math.round(12 + this.phase * 2),
        life: 3.2, color: '#ff4d64', owner: 'boss',
      });
    }
    game.sound.sfx('slash', 0.9);
    game.shake(0.2);
  }

  doSlam(game, player) {
    game.shake(0.72);
    game.sound.sfx('slam');
    game.fx.screenFlash(0.22, '255,90,70');
    const sx = this.x + this.facing * 60;
    for (let i = 0; i < 2; i++) {
      game.fx.ring(sx, GROUND_Y, 'rgba(255,90,60,0.9)', 190, 6, 0.5, 12);
      game.fx.shards(sx, GROUND_Y - 4, '#ff8a60', 12, 400);
    }
    game.fx.smoke(sx, GROUND_Y, '90,60,60', 9, 32);
    game.fx.ember(sx, GROUND_Y - 10, '#ff6a50', 22, 320);
    game.spawnEnemyProjectile({
      type: 'shock', x: sx, y: GROUND_Y, vx: 620, vy: 0, r: 28,
      damage: 16, life: 1.5, color: '#ff6a55',
    });
    game.spawnEnemyProjectile({
      type: 'shock', x: sx, y: GROUND_Y, vx: -620, vy: 0, r: 28,
      damage: 16, life: 1.5, color: '#ff6a55',
    });
    if (Math.abs(player.x - sx) < 170 && player.y > GROUND_Y - 130) {
      player.takeDamage(24, sign(player.x - this.x));
    }
    if (this.phase >= 3) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.22;
        game.spawnEnemyProjectile({
          type: 'orb', x: sx, y: GROUND_Y - 20,
          vx: Math.cos(a) * 330, vy: Math.sin(a) * 330,
          r: 8, damage: 11, life: 2.5, color: '#ff8a4d',
        });
      }
    }
  }

  updateAction(dt, game, player) {
    this.patternT += dt;
    this.timer -= dt;

    switch (this.pattern) {
      case 'dashSlash': {
        this.vx *= Math.exp(-1.4 * dt);
        if (Math.random() < dt * 40) {
          game.fx.ghost(this.x + rand(-30, 30), this.y, this.facing, '255,90,80', 0.24, 1.4);
          game.fx.ember(this.x - this.facing * 30, this.y - rand(20, 140), '#ff6a55', 2, 120);
        }
        if (!this.didDamage) {
          const hit = { x: this.x + this.facing * 25, y: this.y - 80, r: 70 };
          if (circleRect(hit.x, hit.y, hit.r, player.rect)) {
            if (player.takeDamage(20 + this.phase * 3, this.facing)) this.didDamage = true;
          }
        }
        if (this.timer <= 0) {
          this.endAction(game, 0.75);
        }
        break;
      }
      case 'fanVolley': {
        this.vx *= Math.exp(-10 * dt);
        this.actionTick -= dt;
        if (this.actionTick <= 0) {
          this.actionTick = 0.22;
          if (this.patternT < 0.4) this.fireFan(game, player);
        }
        if (this.timer <= 0) this.endAction(game, 0.6);
        break;
      }
      case 'slam': {
        this.vx *= Math.exp(-10 * dt);
        if (this.timer <= 0) this.endAction(game, 0.9);
        break;
      }
      case 'teleportSlash': {
        this.vx *= Math.exp(-2.5 * dt);
        if (!this.didDamage) {
          const hit = { x: this.x + this.facing * 55, y: this.y - 80, r: 82 };
          if (circleRect(hit.x, hit.y, hit.r, player.rect)) {
            if (player.takeDamage(18 + this.phase * 3, this.facing)) this.didDamage = true;
          }
        }
        if (this.timer <= 0) {
          this.vx = 0;
          this.endAction(game, 0.55);
        }
        break;
      }
      case 'summon': {
        this.vx *= Math.exp(-10 * dt);
        if (this.timer <= 0) this.endAction(game, 0.5);
        break;
      }
      case 'rain': {
        this.vx *= Math.exp(-10 * dt);
        this.actionTick -= dt;
        if (this.actionTick <= 0 && this.patternT < 1.35) {
          this.actionTick = 0.11;
          const x = clamp(player.x + rand(-330, 330), 60, WORLD_W - 60);
          game.spawnEnemyProjectile({
            type: 'rain', x, y: -20, vx: rand(-20, 20), vy: 420,
            r: 8, damage: 13, life: 4, gravity: 520, color: '#ff4d5e', owner: 'boss',
          });
          game.fx.ring(x, GROUND_Y - 2, 'rgba(255,70,80,0.5)', 34, 2, 0.5);
        }
        if (this.timer <= 0) this.endAction(game, 0.7);
        break;
      }
    }
  }

  endAction(game, recover) {
    this.state = 'recover';
    this.timer = recover;
    this.pattern = null;
    this.telegraphType = '';
    this.telegraph = 0;
    this.alpha = 1;
  }

  phaseBurst(game, player) {
    game.shake(0.7);
    game.sound.sfx('roar');
    game.fx.screenFlash(0.35, '255,80,80');
    game.fx.ring(this.x, this.y - 80, 'rgba(255,90,80,0.95)', 260, 8, 0.7, 14);
    game.fx.ring(this.x, this.y - 80, 'rgba(255,220,180,0.7)', 170, 4, 0.5, 10);
    game.fx.ember(this.x, this.y - 80, '#ff5a4a', 32, 380, 1.6);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      game.spawnEnemyProjectile({
        type: 'orb', x: this.x, y: this.y - 80,
        vx: Math.cos(a) * 330, vy: Math.sin(a) * 330,
        r: 8, damage: 10, life: 2.2, color: '#ff6a55', owner: 'boss',
      });
    }
    if (Math.abs(player.x - this.x) < 240) {
      player.takeDamage(10, sign(player.x - this.x));
    }
  }

  takeDamage(dmg, dir, game, opts = {}) {
    if (this.dead || this.invuln > 0) return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.hitFlash = 0.12;
    this.vx += dir * 12;
    game.fx.ember(this.x + rand(-30, 30), this.y - 100 + rand(-30, 30), '#ffb08a', 4, 140);
    if (this.hp <= 0) {
      this.die(game, dir);
    } else if (this.phase === 1 && this.hp <= this.maxHp * 0.6) {
      this.beginPhase(2, game);
    } else if (this.phase === 2 && this.hp <= this.maxHp * 0.3) {
      this.beginPhase(3, game);
    }
    return true;
  }

  beginPhase(n, game) {
    this.phase = n;
    this.state = 'phase';
    this.timer = 1.5;
    this.phaseBurstDone = false;
    this.invuln = 1.6;
    this.vx = 0;
    this.alpha = 1;
    this.telegraph = 0;
    this.pattern = null;
    game.onBossPhase(n);
  }

  die(game, dir) {
    this.dead = true;
    this.hp = 0;
    this.deathTimer = 0;
    this.vx = dir * 120;
    game.onBossKilled(this);
  }

  draw(ctx) {
    if (this.alpha <= 0.01) { this.drawTelegraph(ctx); return; }
    const t = this.anim;
    const walking = Math.abs(this.vx) > 30;
    const phaseT = t * (walking ? 7 : 2);
    const bob = walking ? Math.sin(phaseT * 2) * 2 : Math.sin(t * 1.6) * 1.2;
    const wind = this.state === 'windup' ? 1 - this.timer / Math.max(0.2, this.telegraph || 0.5) : 0;
    const action = this.state === 'action' ? 1 : 0;
    const phaseColor = this.phase === 1 ? '#ff4d5e' : this.phase === 2 ? '#ff7a3d' : '#ff3d8a';

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    // aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const auraR = 170 + Math.sin(t * 3) * 12 + (this.state === 'phase' ? 90 : 0);
    const ag = ctx.createRadialGradient(0, -90, 10, 0, -90, auraR);
    ag.addColorStop(0, this.phase === 3 ? 'rgba(255,60,120,0.24)' : 'rgba(255,60,60,0.20)');
    ag.addColorStop(0.55, 'rgba(160,20,40,0.10)');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(0, -90, auraR, 0, TAU); ctx.fill();
    ctx.restore();

    // ground shadow
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 2, 62, 13, 0, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.scale(this.facing, 1);
    ctx.translate(0, bob);
    if (this.hitFlash > 0) ctx.filter = 'brightness(2.6) saturate(0.3)';
    if (this.dead) {
      const p = Math.min(1, this.deathTimer * 0.5);
      ctx.rotate(-p * 1.1);
      ctx.translate(0, p * 20);
      ctx.globalAlpha = clamp(1.2 - this.deathTimer * 0.22, 0.25, 1);
    }

    const stride = walking ? Math.sin(phaseT) * 10 : 0;

    // cape
    ctx.save();
    const capeG = ctx.createLinearGradient(0, -140, -80, 20);
    capeG.addColorStop(0, '#2a0a16');
    capeG.addColorStop(0.6, '#4d0e1c');
    capeG.addColorStop(1, '#19060c');
    ctx.fillStyle = capeG;
    ctx.beginPath();
    ctx.moveTo(-20, -140);
    ctx.quadraticCurveTo(-95, -120 + Math.sin(t * 2) * 8, -100, -6);
    ctx.quadraticCurveTo(-70, -22, -52, -4);
    ctx.quadraticCurveTo(-34, -28, -18, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,70,80,0.18)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-24, -136);
    ctx.quadraticCurveTo(-92, -110, -96, -10);
    ctx.stroke();
    ctx.restore();

    // legs
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#120a10';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(-22, -66); ctx.lineTo(-28 + stride, -4);
    ctx.moveTo(22, -66); ctx.lineTo(28 - stride, -4);
    ctx.stroke();
    ctx.strokeStyle = '#2b1720';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-34 + stride, -4); ctx.lineTo(-20 + stride, -4);
    ctx.moveTo(28 - stride, -4); ctx.lineTo(42 - stride, -4);
    ctx.stroke();
    // shin guards
    ctx.strokeStyle = 'rgba(210,150,90,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-27 + stride * 0.6, -30); ctx.lineTo(-30 + stride, -10);
    ctx.moveTo(27 - stride * 0.6, -30); ctx.lineTo(30 - stride, -10);
    ctx.stroke();

    // torso
    const bg = ctx.createLinearGradient(-46, -150, 46, -50);
    bg.addColorStop(0, '#0b070d');
    bg.addColorStop(0.5, '#25101b');
    bg.addColorStop(1, '#3b1822');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-38, -62);
    ctx.quadraticCurveTo(-58, -105, -34, -145);
    ctx.quadraticCurveTo(0, -165, 34, -145);
    ctx.quadraticCurveTo(58, -105, 38, -62);
    ctx.quadraticCurveTo(0, -48, -38, -62);
    ctx.closePath();
    ctx.fill();
    // armor plates / gold trim
    ctx.strokeStyle = 'rgba(220,170,95,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-30 + i * 4, -132 + i * 20);
      ctx.quadraticCurveTo(0, -120 + i * 20, 30 - i * 4, -132 + i * 20);
      ctx.stroke();
    }
    // chest emblem
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = phaseColor;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -106, 16, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -118); ctx.lineTo(0, -94);
    ctx.moveTo(-8, -106); ctx.lineTo(8, -106);
    ctx.stroke();
    ctx.restore();
    // shoulder pauldrons with spikes
    ctx.fillStyle = '#1b0d14';
    ctx.beginPath(); ctx.ellipse(-40, -136, 20, 16, -0.35, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(40, -136, 20, 16, 0.35, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,80,90,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(40, -136, 20, 16, 0.35, 0, TAU); ctx.stroke();
    for (let s = 0; s < 3; s++) {
      ctx.strokeStyle = '#b98754';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(34 + s * 7, -148); ctx.lineTo(40 + s * 8, -160 - s * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-34 - s * 7, -148); ctx.lineTo(-40 - s * 8, -160 - s * 3);
      ctx.stroke();
    }

    // head & oni mask
    ctx.fillStyle = '#10080e';
    ctx.beginPath(); ctx.ellipse(4, -166, 24, 24, 0, 0, TAU); ctx.fill();
    // mane
    ctx.fillStyle = '#0a0509';
    ctx.beginPath();
    ctx.moveTo(-18, -184);
    ctx.quadraticCurveTo(-38, -170, -30, -146);
    ctx.quadraticCurveTo(-18, -160, -12, -156);
    ctx.closePath();
    ctx.fill();
    // horns
    ctx.strokeStyle = '#d9c4a2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -184);
    ctx.quadraticCurveTo(-40, -206, -30, -224);
    ctx.moveTo(18, -184);
    ctx.quadraticCurveTo(48, -206, 38, -224);
    ctx.stroke();
    // mask face
    ctx.fillStyle = '#d9cdb5';
    ctx.beginPath();
    ctx.ellipse(6, -164, 17, 20, 0.08, 0, TAU);
    ctx.fill();
    // red mask markings
    ctx.fillStyle = '#8c1124';
    ctx.beginPath();
    ctx.moveTo(-2, -180);
    ctx.quadraticCurveTo(6, -174, 2, -164);
    ctx.quadraticCurveTo(-2, -172, -6, -178);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,15,30,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, -182); ctx.quadraticCurveTo(14, -176, 18, -166);
    ctx.stroke();
    // mouth with fangs
    ctx.fillStyle = '#1b070d';
    ctx.beginPath();
    ctx.ellipse(7, -153, 10, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath();
    ctx.moveTo(1, -156); ctx.lineTo(4, -150); ctx.lineTo(6, -155);
    ctx.moveTo(9, -155); ctx.lineTo(12, -150); ctx.lineTo(14, -155);
    ctx.fill();
    // eyes
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = phaseColor;
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.ellipse(-1, -170, 4.5, 2.2, 0.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13, -170, 4.5, 2.2, -0.15, 0, TAU); ctx.fill();
    ctx.restore();
    // topknot
    ctx.strokeStyle = '#1a0a10';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(4, -187); ctx.quadraticCurveTo(10, -202, 2, -210);
    ctx.stroke();

    // giant blade
    let bladeAngle = -0.9;
    if (this.state === 'windup') {
      bladeAngle = this.pattern === 'fanVolley' ? lerp(-0.9, -2.1, wind) : lerp(-0.9, -2.4, wind);
    } else if (this.state === 'action') {
      if (this.pattern === 'dashSlash' || this.pattern === 'teleportSlash') bladeAngle = 0.1;
      else if (this.pattern === 'slam') bladeAngle = 1.0;
      else if (this.pattern === 'fanVolley') bladeAngle = -1.3;
      else if (this.pattern === 'rain') bladeAngle = -2.0;
    }
    const sx = 38, sy = -124;
    const hx = sx + Math.cos(bladeAngle) * 28;
    const hy = sy + Math.sin(bladeAngle) * 28;
    ctx.strokeStyle = '#160c12';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 10, sy + 14, hx, hy);
    ctx.stroke();
    // hand
    ctx.fillStyle = '#2a1620';
    ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
    // blade
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(bladeAngle);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,60,70,0.22)';
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(130, -4); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    const bg2 = ctx.createLinearGradient(4, 0, 130, 0);
    bg2.addColorStop(0, '#d7c7ae');
    bg2.addColorStop(0.7, '#f1e6d2');
    bg2.addColorStop(1, '#a9937c');
    ctx.strokeStyle = bg2;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(130, -4); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = phaseColor;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(126, -6); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#b31f35';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(3, 0); ctx.stroke();
    ctx.fillStyle = '#d9b56a';
    ctx.beginPath(); ctx.ellipse(3, 0, 4, 10, 0, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.filter = 'none';
    ctx.restore();

    this.drawTelegraph(ctx);

    // phase transition aura ring
    if (this.state === 'phase') {
      ctx.save();
      ctx.translate(this.x, this.y - 80);
      ctx.globalCompositeOperation = 'lighter';
      const p = 1 - this.timer / 1.5;
      ctx.globalAlpha = 0.5 * (1 - p);
      ctx.strokeStyle = phaseColor;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 60 + p * 150, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }

  drawTelegraph(ctx) {
    if (this.state !== 'windup' || this.telegraphType === 'none') return;
    const player = this.game.player;
    const p = 1 - this.timer / Math.max(0.01, this.telegraph);
    const pulse = 0.35 + Math.sin(this.anim * 26) * 0.2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = this.phase >= 3 ? '#ff4d8a' : '#ff5a4a';
    ctx.fillStyle = this.phase >= 3 ? 'rgba(255,60,120,0.08)' : 'rgba(255,70,60,0.07)';
    ctx.globalAlpha = pulse;
    if (this.telegraphType === 'line') {
      const dir = sign(player.x - this.x) || 1;
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(this.x + dir * 60, this.y - 80);
      ctx.lineTo(this.x + dir * 620, this.y - 80);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillRect(this.x + dir * 60, this.y - 130, dir * 560, 100);
    } else if (this.telegraphType === 'circle') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.x + this.facing * 50, GROUND_Y - 6, 150, 42, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.6;
      ctx.beginPath(); ctx.arc(this.x + this.facing * 50, this.y - 50, 90 + p * 40, 0, TAU); ctx.stroke();
    } else if (this.telegraphType === 'fan') {
      const base = Math.atan2((player.y - 34) - (this.y - 95), player.x - this.x);
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        const a = base + i * 0.18;
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(a) * 50, this.y - 100 + Math.sin(a) * 50);
        ctx.lineTo(this.x + Math.cos(a) * 500, this.y - 100 + Math.sin(a) * 500);
        ctx.stroke();
      }
    } else if (this.telegraphType === 'rain') {
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x = player.x - 210 + i * 140;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
      }
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillRect(player.x - 260, 0, 520, GROUND_Y);
    }
    ctx.restore();
  }
}
