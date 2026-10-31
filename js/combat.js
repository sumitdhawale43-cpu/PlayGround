(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // FX helpers
  // ---------------------------------------------------------------------------
  function spawnParticle(o) {
    if (G.particles.length > 520) G.particles.shift();
    G.particles.push(Object.assign({
      x: 0, y: 0, z: 0.6, vx: 0, vy: 0, gravity: 0, drag: 0.98,
      life: 0.5, maxLife: 0.5, size: 2, color: '#fff', kind: 'spark',
      rot: rand(TAU), spin: rand(4, -4), alpha: 1, glow: false
    }, o));
  }

  function spawnImpact(x, y, z, color = '#ffe6b4', count = 10, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = rand(TAU);
      const sp = rand(420, 90) * power;
      spawnParticle({
        x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        gravity: 620, drag: 0.92, life: rand(0.38, 0.14),
        maxLife: 0.4, size: rand(3.5, 1), color, kind: chance(0.7) ? 'spark' : 'ink', glow: true
      });
    }
    for (let i = 0; i < Math.ceil(count * 0.45); i++) {
      const a = rand(TAU);
      spawnParticle({
        x, y, z, vx: Math.cos(a) * rand(75, 12), vy: rand(-6, -55),
        gravity: 20, drag: 0.9, life: rand(0.8, 0.35), maxLife: 0.8,
        size: rand(14, 4), color: chance(0.5) ? 'rgba(13,14,20,0.75)' : color,
        kind: 'smoke', alpha: 0.22
      });
    }
  }

  function spawnDeath(e) {
    const s = depthScale(e.z);
    const y = groundY(e.z) - 75 * s;
    const count = e.cfg.boss ? 48 : e.cfg.superArmor ? 28 : 18;
    const colors = e.cfg.boss ? ['#ffd18b', '#e3503e', '#23151a'] : ['#d9c4a4', '#a62f31', '#151018'];
    for (let i = 0; i < count; i++) {
      const a = rand(TAU), sp = rand(300, 30) * (e.cfg.boss ? 1.4 : 1);
      spawnParticle({
        x: e.x + rand(20, -20), y: y + rand(30, -30), z: e.z,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, gravity: 480,
        drag: 0.95, life: rand(1.25, 0.4), maxLife: 1.3,
        size: rand(5, 1), color: colors[randInt(0, colors.length - 1)],
        kind: chance(0.25) ? 'petal' : chance(0.5) ? 'ink' : 'spark', glow: chance(0.5)
      });
    }
    for (let i = 0; i < 10; i++) {
      const a = rand(TAU);
      spawnParticle({
        x: e.x, y: y + rand(40), z: e.z, vx: Math.cos(a) * rand(110, 20), vy: rand(-70, -20),
        gravity: 10, life: rand(1.1, 0.5), maxLife: 1.1, size: rand(24, 8),
        color: '#0a0b10', kind: 'smoke', alpha: 0.25
      });
    }
    if (e.cfg.boss) {
      G.effects.push({ type: 'ring', x: e.x, y: groundY(e.z), z: e.z, life: 1.0, maxLife: 1.0, r: 40, maxR: 420, color: '#ffb66e', width: 8 });
      flash('#ffc27b', 0.55);
      addShake(18);
    }
  }

  function spawnGhost(p, life = 0.32, color = '#7de4df') {
    G.effects.push({
      type: 'ghost', x: p.x, y: groundY(p.z), z: p.z, facing: p.facing,
      life, maxLife: life, color, state: p.state, anim: p.anim, attackStep: p.attackStep,
      timer: p.timer
    });
  }

  function spawnSlash(p, step, life = 0.2) {
    const facing = p.facing;
    const data = step === 1
      ? { from: -2.1, to: 0.9, radius: 118, color: '#f6f1dd' }
      : step === 2
        ? { from: 2.25, to: -1.15, radius: 126, color: '#bff5ed' }
        : { from: -2.8, to: 2.7, radius: 155, color: '#ffd8a1' };
    G.effects.push({
      type: 'slash', x: p.x, y: groundY(p.z) - 92 * depthScale(p.z), z: p.z,
      facing, from: data.from, to: data.to, radius: data.radius,
      life, maxLife: life, color: data.color, step
    });
  }

  function spawnEnemySlash(e) {
    const facing = e.facing;
    G.effects.push({
      type: 'eslash', x: e.x, y: groundY(e.z) - 84 * depthScale(e.z), z: e.z,
      facing, from: -1.9, to: 1.3, radius: e.cfg.boss ? 175 : 105,
      life: 0.26, maxLife: 0.26, color: e.cfg.boss ? '#ff9b63' : '#ca4b43', step: 1
    });
  }

  function spawnRing(x, z, color = '#f0c584', maxR = 180, life = 0.45) {
    G.effects.push({ type: 'ring', x, y: groundY(z), z, life, maxLife: life, r: 10, maxR, color, width: 3 });
  }

  function addFloatText(text, x, y, z, color = '#f3e7d0', size = 18) {
    G.texts.push({ text, x: x + rand(12, -12), y, z, color, size, life: 0.9, maxLife: 0.9, vy: -55 });
  }

  // ---------------------------------------------------------------------------
  // Damage & rewards
  // ---------------------------------------------------------------------------
  function damageEnemy(enemy, amount, opts = {}) {
    if (!enemy || enemy.dead || enemy.state === 'spawn') return;
    const wasHp = enemy.hp;
    const killed = enemy.hurt(amount, opts.source || G.player, opts);
    G.combo += 1;
    G.comboTimer = 2.5;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    G.player.shadow = clamp(G.player.shadow + (opts.shadow || 6), 0, 100);
    G.score += Math.round(amount * 10 * (1 + G.combo * 0.055));
    const s = depthScale(enemy.z);
    const hy = groundY(enemy.z) - 92 * s;
    addFloatText(String(Math.round(amount)), enemy.x, hy - 20, enemy.z, opts.heavy ? '#ffcc8e' : '#f5ead5', opts.heavy ? 24 : 18);
    spawnImpact(enemy.x, hy, enemy.z, killColor(enemy), opts.heavy ? 15 : 9, opts.heavy ? 1.4 : 0.9);
    addShake(opts.shake ?? (opts.heavy ? 7 : 3));
    if (!opts.noHitstop) G.hitstop = Math.max(G.hitstop, opts.stop ?? (opts.heavy ? 0.07 : 0.035));
    audio.hit(!!opts.heavy);
    if (killed) {
      onEnemyKilled(enemy);
    }
    return killed;
  }

  function killColor(e) {
    if (e.type === 'archer') return '#b8e6c5';
    if (e.type === 'brute' || e.type === 'boss') return '#ffb575';
    if (e.type === 'spear') return '#e6b3a0';
    return '#f3d8b6';
  }

  function onEnemyKilled(enemy) {
    G.kills++;
    const bonus = enemy.cfg.score;
    G.score += Math.round(bonus * (1 + G.combo * 0.04));
    G.player.shadow = clamp(G.player.shadow + (enemy.cfg.boss ? 45 : 12), 0, 100);
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + (enemy.cfg.boss ? 0 : 2));
    spawnDeath(enemy);
    audio.kill();
    G.hitstop = Math.max(G.hitstop, enemy.cfg.boss ? 0.14 : 0.075);
    addShake(enemy.cfg.boss ? 16 : 8);
    if (enemy.cfg.boss) {
      slowTime(1.25);
      flash('#ffe0b0', 0.8);
      G.victoryTimer = 2.4;
    } else if (enemy.cfg.superArmor) {
      slowTime(0.45);
    }
    if (G.combo > 0 && G.combo % 10 === 0) {
      showToast(`${G.combo} HIT CHAIN  ·  +${G.combo * 12} SHADOW`);
      G.player.shadow = clamp(G.player.shadow + 8, 0, 100);
    }
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------
  class Player {
    constructor(x = 760, z = 0.55) {
      this.x = x;
      this.z = z;
      this.facing = 1;
      this.maxHp = 100;
      this.hp = 100;
      this.shadow = 0;
      this.state = 'idle';
      this.timer = 0;
      this.anim = rand(4);
      this.runPhase = 0;
      this.attackStep = 0;
      this.queued = false;
      this.attackHit = false;
      this.dashCd = 0;
      this.kunaiCd = 0;
      this.iframe = 0;
      this.flash = 0;
      this.dead = false;
      this.ghostTimer = 0;
      this.dustTimer = 0;
      this.perfectThisDash = false;
      this.dashDirX = 1;
      this.dashDirZ = 0;
      this.specialTargets = [];
      this.specialIndex = 0;
      this.specialNext = 0;
      this.specialOrigin = { x, z };
      this.lastDamage = 0;
      this.stepPhase = 0;
    }

    get invulnerable() {
      return this.iframe > 0 || this.state === 'dash' || this.state === 'special';
    }

    update(dt) {
      this.anim += dt;
      this.flash = Math.max(0, this.flash - dt * 5);
      this.iframe = Math.max(0, this.iframe - dt);
      this.dashCd = Math.max(0, this.dashCd - dt);
      this.kunaiCd = Math.max(0, this.kunaiCd - dt);
      if (this.dead) return;

      if (this.state === 'attack') return this.updateAttack(dt);
      if (this.state === 'dash') return this.updateDash(dt);
      if (this.state === 'kunai') return this.updateKunai(dt);
      if (this.state === 'special') return this.updateSpecial(dt);
      if (this.state === 'hurt') {
        this.timer += dt;
        if (this.timer > 0.28) { this.state = 'idle'; this.timer = 0; }
        return;
      }
      this.updateMovement(dt);
    }

    updateMovement(dt) {
      const axis = input.axis();
      const ax = axis.x, az = axis.y;
      if (Math.abs(ax) > 0.18) this.facing = sign(ax);

      // Ability input order matters while cancelling.
      if (input.consume('special') && this.shadow >= 100 && G.enemies.some(e => !e.dead)) {
        this.startSpecial();
        return;
      }
      if (input.consume('dash') && this.dashCd <= 0) {
        this.startDash(ax, az);
        return;
      }
      if (input.consume('kunai') && this.kunaiCd <= 0) {
        this.startKunai();
        return;
      }
      if (input.consume('attack') || input.held.attack) {
        this.startAttack(1);
        return;
      }

      const speed = 270;
      const dzSpeed = 0.82;
      const moving = Math.hypot(ax, az) > 0.08;
      if (moving) {
        this.x += ax * speed * dt;
        this.z += az * dzSpeed * dt;
        this.state = 'run';
        this.runPhase += dt * (8.5 + Math.hypot(ax, az) * 4);
        this.dustTimer -= dt;
        if (this.dustTimer <= 0) {
          this.dustTimer = 0.13;
          spawnParticle({
            x: this.x + rand(14, -14), y: groundY(this.z) - 2, z: this.z,
            vx: -ax * rand(40, 8) + rand(12, -12), vy: rand(-24, -6), gravity: -10,
            life: rand(0.5, 0.25), maxLife: 0.5, size: rand(10, 3),
            color: 'rgba(173,164,148,0.35)', kind: 'dust', drag: 0.94
          });
        }
      } else {
        this.state = 'idle';
        this.runPhase += dt * 1.5;
      }
      this.clampPosition();
    }

    clampPosition() {
      this.x = clamp(this.x, 120, ARENA_W - 120);
      this.z = clamp(this.z, FLOOR_Z.min, FLOOR_Z.max);
    }

    startAttack(step) {
      const spec = ATTACKS[step - 1];
      this.state = 'attack';
      this.attackStep = step;
      this.timer = 0;
      this.attackHit = false;
      this.queued = false;
      this.stepPhase = 0;
      audio.slash(step - 1);
      if (step === 3) {
        // The finisher begins with a low, coiled stance.
        spawnRing(this.x, this.z, '#f3d3a2', 95, 0.3);
      }
      // Stick to the target direction on startup.
      if (Math.abs(input.axis().x) > 0.2) this.facing = sign(input.axis().x);
      this.lungeRemaining = spec.lunge;
    }

    updateAttack(dt) {
      const spec = ATTACKS[this.attackStep - 1];
      this.timer += dt;
      const p = this.timer;
      // forward lunge
      if (p < spec.startup + spec.active) {
        this.x += this.facing * spec.lunge * dt * 1.8;
        this.clampPosition();
      }
      if (!this.attackHit && p >= spec.startup) {
        this.attackHit = true;
        this.performAttack(spec);
        spawnSlash(this, this.attackStep, this.attackStep === 3 ? 0.27 : 0.2);
        if (this.attackStep === 3) {
          addShake(6);
          G.effects.push({ type: 'ring', x: this.x, y: groundY(this.z), z: this.z, life: 0.36, maxLife: 0.36, r: 20, maxR: 170, color: '#ffe1b1', width: 2 });
        }
      }
      // Allow dash-cancel after the active frames for fluid defense.
      if (p > spec.startup + spec.active * 0.55 && input.consume('dash') && this.dashCd <= 0) {
        this.startDash(input.axis().x, input.axis().y);
        return;
      }
      if (input.consume('attack') && p > 0.04) this.queued = true;
      if (p > spec.startup + spec.active + spec.recover) {
        if (this.queued && this.attackStep < 3) {
          this.startAttack(this.attackStep + 1);
        } else {
          this.state = 'idle';
          this.timer = 0;
        }
      }
    }

    performAttack(spec) {
      let hitAny = false;
      for (const e of G.enemies) {
        if (!e || e.dead || e.state === 'spawn') continue;
        const dx = e.x - this.x;
        const dz = e.z - this.z;
        const forward = this.attackStep === 3 || dx * this.facing > -24;
        if (!forward) continue;
        if (Math.abs(dx) < spec.reach * (this.attackStep === 3 ? 1.05 : 1) && Math.abs(dz) < spec.zReach) {
          const heavy = this.attackStep === 3;
          const killed = damageEnemy(e, spec.damage * (1 + G.combo * 0.012), {
            source: this, heavy, shadow: heavy ? 10 : 6,
            stop: spec.stop, shake: spec.shake,
            knockback: heavy ? 62 : this.attackStep === 2 ? 36 : 24
          });
          hitAny = true;
          if (killed && this.attackStep < 3) this.queued = true;
          // small forward drag on impact
          this.x += this.facing * (heavy ? 10 : 4);
        }
      }
      if (hitAny && chance(0.35)) flash('rgba(255,244,218,0.08)', 0.1);
      this.clampPosition();
    }

    startDash(ax, az) {
      if (this.dashCd > 0) return;
      let dx = ax, dz = az;
      if (Math.hypot(dx, dz) < 0.15) { dx = this.facing; dz = 0; }
      const m = Math.hypot(dx, dz) || 1;
      this.dashDirX = dx / m;
      this.dashDirZ = dz / m;
      if (Math.abs(this.dashDirX) > 0.1) this.facing = sign(this.dashDirX);
      this.state = 'dash';
      this.timer = 0;
      this.dashCd = 0.52;
      this.iframe = 0.24;
      this.perfectThisDash = false;
      this.ghostTimer = 0;
      audio.dash();
      spawnRing(this.x, this.z, 'rgba(137,236,229,0.9)', 70, 0.3);
      for (let i = 0; i < 8; i++) {
        spawnParticle({
          x: this.x + rand(18, -18), y: groundY(this.z) - rand(80, 10), z: this.z,
          vx: -this.dashDirX * rand(220, 80) + rand(30, -30), vy: rand(20, -80),
          gravity: 140, drag: 0.9, life: rand(0.4, 0.15), maxLife: 0.4,
          size: rand(9, 2), color: chance(0.5) ? '#82dad4' : '#e9dcc2', kind: 'spark', glow: true
        });
      }
    }

    updateDash(dt) {
      this.timer += dt;
      const speed = 790 * (1 - this.timer * 1.2);
      this.x += this.dashDirX * speed * dt;
      this.z += this.dashDirZ * speed * 0.0011 * dt;
      this.clampPosition();
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.027;
        spawnGhost(this, 0.26, '#5fd8d1');
      }
      if (this.timer > 0.19) {
        this.state = 'idle';
        this.timer = 0;
      }
    }

    startKunai() {
      if (this.kunaiCd > 0) return;
      this.state = 'kunai';
      this.timer = 0;
      this.kunaiCd = 0.48;
      this.thrown = false;
    }

    updateKunai(dt) {
      this.timer += dt;
      if (!this.thrown && this.timer >= 0.08) {
        this.thrown = true;
        G.projectiles.push({
          kind: 'kunai', x: this.x + this.facing * 34, z: this.z,
          vx: this.facing * 900, life: 1.1, maxLife: 1.1,
          spin: 0, owner: 'player', damage: 7 + G.combo * 0.2
        });
        audio.kunai();
        for (let i = 0; i < 3; i++) {
          spawnParticle({
            x: this.x + this.facing * 35, y: groundY(this.z) - 100, z: this.z,
            vx: this.facing * rand(130, 40), vy: rand(20, -20), gravity: 0,
            life: 0.25, maxLife: 0.25, size: rand(4, 1), color: '#b9f3ec', kind: 'spark', glow: true
          });
        }
      }
      if (this.timer > 0.27) { this.state = 'idle'; this.timer = 0; }
    }

    startSpecial() {
      if (this.shadow < 100) return;
      const targets = G.enemies.filter(e => !e.dead && e.state !== 'spawn')
        .sort((a, b) => dist2(a.x, a.z * 200, this.x, this.z * 200) - dist2(b.x, b.z * 200, this.x, this.z * 200));
      if (!targets.length) return;
      this.shadow = 0;
      this.state = 'special';
      this.timer = 0;
      this.specialTargets = targets.slice(0, 8);
      this.specialIndex = 0;
      this.specialNext = 0.09;
      this.iframe = 2.2;
      this.specialOrigin = { x: this.x, z: this.z };
      audio.special();
      audio.bossRoar();
      flash('#9cf6ee', 0.5);
      slowTime(0.55);
      addShake(10);
      spawnRing(this.x, this.z, '#a7f5ee', 240, 0.65);
    }

    updateSpecial(dt) {
      this.timer += dt;
      this.specialNext -= dt;
      if (this.specialNext <= 0) {
        const target = this.specialTargets[this.specialIndex];
        this.specialIndex++;
        this.specialNext = 0.085;
        if (target && !target.dead) {
          const oldX = this.x, oldZ = this.z;
          const side = target.x > ARENA_W / 2 ? -1 : 1;
          this.x = clamp(target.x + side * 48, 100, ARENA_W - 100);
          this.z = clamp(target.z + rand(0.04, -0.04), FLOOR_Z.min, FLOOR_Z.max);
          this.facing = sign(target.x - this.x) || 1;
          spawnGhost({ ...this, x: oldX, z: oldZ, state: 'dash', anim: this.anim, attackStep: 1 }, 0.45, '#8ff8ef');
          for (let i = 0; i < 2; i++) {
            spawnGhost(this, 0.38, '#b3fff6');
          }
          spawnSlash(this, 2, 0.3);
          spawnImpact(target.x, groundY(target.z) - 90, target.z, '#a5fff4', 14, 1.3);
          damageEnemy(target, 19, {
            source: this, heavy: true, noHitstop: true, shadow: 0, stop: 0, shake: 3,
            knockback: 22
          });
          G.hitstop = Math.max(G.hitstop, 0.018);
          addShake(4);
          flash('rgba(170,255,244,0.09)', 0.08);
        }
        if (this.specialIndex >= this.specialTargets.length || !this.specialTargets.some(t => !t.dead)) {
          this.finishSpecial();
        }
      }
      if (this.timer > 1.5) this.finishSpecial();
    }

    finishSpecial() {
      this.state = 'idle';
      this.iframe = 0.55;
      this.timer = 0;
      this.x = clamp(this.x, 120, ARENA_W - 120);
      spawnRing(this.x, this.z, '#b8fff7', 300, 0.7);
      flash('#c8fff9', 0.4);
      addShake(14);
      audio.hit(true);
      G.shadowBurst = 0.6;
    }

    takeDamage(amount, source) {
      if (this.dead) return false;
      if (this.state === 'dash' || this.state === 'special') {
        if (this.state === 'dash' && !this.perfectThisDash) {
          this.perfectThisDash = true;
          this.iframe = Math.max(this.iframe, 0.14);
          this.perfectDodge(source);
        }
        return false;
      }
      if (this.iframe > 0) return false;
      this.hp = Math.max(0, this.hp - amount);
      this.lastDamage = amount;
      this.iframe = 0.58;
      this.state = 'hurt';
      this.timer = 0;
      this.flash = 1;
      this.queued = false;
      const dir = sign(this.x - (source?.x ?? this.x));
      this.x = clamp(this.x + dir * 20, 120, ARENA_W - 120);
      spawnImpact(this.x, groundY(this.z) - 92, this.z, '#e65242', 16, 1.1);
      addFloatText(`-${Math.round(amount)}`, this.x, groundY(this.z) - 150, this.z, '#ff7866', 20);
      flash('#c6232c', 0.4);
      addShake(12);
      G.hitstop = Math.max(G.hitstop, 0.075);
      audio.hurt();
      G.combo = 0;
      G.comboTimer = 0;
      if (this.hp <= 0) this.die();
      return true;
    }

    perfectDodge(source) {
      this.shadow = clamp(this.shadow + 25, 0, 100);
      slowTime(0.8);
      flash('#9ff7f2', 0.35);
      addShake(3);
      audio.perfect();
      G.perfectTimer = 0.8;
      G.score += 75;
      spawnRing(this.x, this.z, '#9ff7f2', 220, 0.6);
      for (let i = 0; i < 16; i++) {
        spawnParticle({
          x: this.x + rand(20, -20), y: groundY(this.z) - rand(120, 10), z: this.z,
          vx: rand(260, -260), vy: rand(80, -200), gravity: 300,
          life: rand(0.55, 0.2), maxLife: 0.55, size: rand(3, 1),
          color: chance(0.5) ? '#b9fff9' : '#f4e4c5', kind: 'spark', glow: true
        });
      }
      addFloatText('PERFECT', this.x, groundY(this.z) - 175, this.z, '#a8fff8', 22);
    }

    die() {
      this.dead = true;
      this.state = 'dead';
      this.timer = 0;
      G.deathTimer = 1.4;
      slowTime(1.1);
      flash('#b51d2a', 0.55);
      addShake(16);
      spawnImpact(this.x, groundY(this.z) - 85, this.z, '#da3d36', 30, 1.5);
      for (let i = 0; i < 24; i++) {
        spawnParticle({
          x: this.x + rand(30, -30), y: groundY(this.z) - rand(140, 10), z: this.z,
          vx: rand(220, -220), vy: rand(-20, -220), gravity: 400,
          life: rand(1.1, 0.4), maxLife: 1.1, size: rand(14, 2),
          color: chance(0.5) ? '#10121a' : '#d8453d', kind: chance(0.4) ? 'smoke' : 'ink'
        });
      }
    }

    // Preview-only shimmering idle used behind the title.
    previewUpdate(dt) {
      this.anim += dt;
      this.runPhase += dt * 1.2;
    }
  }

  // ---------------------------------------------------------------------------
  // Enemy
  // ---------------------------------------------------------------------------
  class Enemy {
    constructor(type, x, z, wave = 0) {
      this.type = type;
      this.cfg = ENEMY_TYPES[type];
      this.x = x;
      this.z = clamp(z, FLOOR_Z.min, FLOOR_Z.max);
      this.facing = -1;
      this.maxHp = Math.round(this.cfg.hp + (this.cfg.boss ? wave * 18 : wave * 3.2));
      this.hp = this.maxHp;
      this.state = 'spawn';
      this.timer = 0;
      this.spawnDuration = 0.48;
      this.anim = rand(5);
      this.runPhase = rand(10);
      this.windupT = this.cfg.windup;
      this.strikeT = this.cfg.strike;
      this.recoverT = this.cfg.recover;
      this.cooldown = rand(1.4, 0.45);
      this.think = rand(1.2, 0.2);
      this.strafe = chance(0.5) ? 1 : -1;
      this.dead = false;
      this.flash = 0;
      this.didHit = false;
      this.hpBar = 0;
      this.speed = this.cfg.speed * rand(1.08, 0.92);
      this.enraged = false;
      this.shadowTrail = 0;
      this.wave = wave;
    }

    get alive() { return !this.dead; }

    update(dt) {
      this.anim += dt;
      this.flash = Math.max(0, this.flash - dt * 6);
      this.hpBar = Math.max(0, this.hpBar - dt * 0.24);
      if (this.dead) {
        this.timer += dt;
        return;
      }
      if (this.state === 'spawn') {
        this.timer += dt;
        if (this.timer >= this.spawnDuration) {
          this.state = 'idle';
          this.timer = 0;
        }
        return;
      }
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.think -= dt;

      if (this.state === 'hurt') {
        this.timer += dt;
        if (this.timer > (this.cfg.superArmor ? 0.2 : 0.3)) { this.state = 'idle'; this.timer = 0; }
        return;
      }
      if (this.state === 'windup') {
        this.timer += dt;
        if (this.timer >= this.windupT) {
          this.state = 'strike';
          this.timer = 0;
          this.didHit = false;
        }
        return;
      }
      if (this.state === 'strike') {
        this.timer += dt;
        if (!this.didHit && this.timer >= this.strikeT * 0.3) {
          this.didHit = true;
          this.doAttack();
        }
        if (this.timer >= this.strikeT + 0.05) {
          this.state = 'recover';
          this.timer = 0;
        }
        return;
      }
      if (this.state === 'recover') {
        this.timer += dt;
        if (this.timer >= this.recoverT) { this.state = 'idle'; this.timer = 0; }
        return;
      }

      // Approach / spacing / strafing
      const dx = G.player.x - this.x;
      const dz = G.player.z - this.z;
      const adx = Math.abs(dx), adz = Math.abs(dz);
      const desired = this.cfg.ranged ? 280 : this.type === 'spear' ? 118 : this.type === 'brute' ? 94 : this.type === 'boss' ? 138 : 66;
      let mx = 0, mz = 0;
      if (adx > desired + 12) mx = sign(dx);
      else if (adx < desired - 30) mx = -sign(dx);
      // archers and everyone else circle a little
      if (this.think <= 0) {
        this.think = rand(2.2, 0.8);
        this.strafe = chance(0.5) ? 1 : -1;
      }
      const strafeFactor = this.cfg.ranged ? 0.45 : 0.26;
      mz = clamp(dz * 4.0 + this.strafe * 0.1, -1, 1);
      if (Math.abs(dz) < 0.1) mz *= 0.4;

      // separation from allies
      for (const other of G.enemies) {
        if (other === this || other.dead || other.state === 'spawn') continue;
        const odx = this.x - other.x, odz = this.z - other.z;
        if (Math.abs(odx) < 48 && Math.abs(odz) < 0.12) {
          mx += sign(odx || 1) * 0.7;
          mz += sign(odz || 1) * 0.3;
        }
      }

      const spd = this.speed * (this.enraged ? 1.35 : 1);
      if (Math.abs(mx) > 0.03 || Math.abs(mz) > 0.04) {
        this.x += clamp(mx, -1, 1) * spd * dt;
        this.z += clamp(mz, -1, 1) * spd * 0.0032 * dt;
        this.state = 'walk';
        this.runPhase += dt * 6.5;
      } else {
        this.state = 'idle';
      }
      this.facing = dx >= 0 ? 1 : -1;
      this.x = clamp(this.x, 100, ARENA_W - 100);
      this.z = clamp(this.z, FLOOR_Z.min, FLOOR_Z.max);

      if (this.cfg.boss && !this.enraged && this.hp < this.maxHp * 0.42) {
        this.enraged = true;
        this.cooldown = 0.2;
        this.speed *= 1.18;
        G.effects.push({ type: 'ring', x: this.x, y: groundY(this.z), z: this.z, life: 0.8, maxLife: 0.8, r: 30, maxR: 260, color: '#ff7f54', width: 5 });
        flash('#ff6d4d', 0.24);
        addShake(10);
        audio.bossRoar();
        showToast('THE ONI SHOGUN IS ENRAGED');
      }

      const inRange = adx < this.cfg.range * (this.enraged ? 1.25 : 1.12) && adz < this.cfg.zReach * 1.25;
      if (this.cooldown <= 0 && inRange && this.think < 1.3) {
        this.state = 'windup';
        this.timer = 0;
        this.windupT = this.cfg.windup * (this.enraged ? 0.72 : 1) * rand(1.08, 0.9);
        this.cooldown = this.cfg.cooldown * (this.enraged ? 0.7 : 1) * rand(1.25, 0.85);
      }
    }

    doAttack() {
      const dx = Math.abs(G.player.x - this.x);
      const dz = Math.abs(G.player.z - this.z);
      const isArcher = this.type === 'archer';
      if (isArcher) {
        const px = G.player.x, pz = G.player.z;
        const worldDz = (pz - this.z) * GROUND_DEPTH;
        const len = Math.hypot(px - this.x, worldDz) || 1;
        G.projectiles.push({
          kind: 'arrow', x: this.x + this.facing * 24, z: this.z,
          vx: (px - this.x) / len * 430,
          vz: (pz - this.z) / len * 430 / GROUND_DEPTH,
          life: 2.3, maxLife: 2.3, spin: 0, owner: 'enemy', damage: this.cfg.damage
        });
        audio.kunai();
        spawnParticle({
          x: this.x + this.facing * 25, y: groundY(this.z) - 104, z: this.z,
          vx: this.facing * 50, vy: -15, life: 0.3, maxLife: 0.3, size: 8,
          color: '#d64b41', kind: 'spark', glow: true
        });
        return;
      }

      spawnEnemySlash(this);
      if (this.type === 'brute' || this.cfg.boss) {
        const r = this.cfg.boss ? 185 : 128;
        spawnRing(this.x, this.z, this.cfg.boss ? '#ff8358' : '#e5b078', r * 1.4, 0.5);
        addShake(this.cfg.boss ? 10 : 7);
        if (dx < r && dz < 0.55) {
          G.player.takeDamage(this.cfg.damage, this);
        }
        for (let i = 0; i < 16; i++) {
          const a = rand(TAU);
          spawnParticle({
            x: this.x + Math.cos(a) * 20, y: groundY(this.z) - 4, z: this.z,
            vx: Math.cos(a) * rand(220, 50), vy: rand(-40, -150), gravity: 500,
            life: rand(0.7, 0.25), maxLife: 0.7, size: rand(9, 2),
            color: chance(0.5) ? '#7f654a' : '#b04339', kind: 'dust'
          });
        }
        return;
      }
      // sword / spear
      if (dx < this.cfg.range * 1.16 && dz < this.cfg.zReach * 1.2) {
        G.player.takeDamage(this.cfg.damage, this);
      }
      addShake(3);
    }

    hurt(amount, source, opts = {}) {
      if (this.dead) return false;
      this.hp -= amount;
      this.flash = 0.16;
      this.hpBar = 3.2;
      const dir = source ? sign(this.x - source.x || 1) : 1;
      this.x = clamp(this.x + dir * (opts.knockback || 18), 100, ARENA_W - 100);
      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
        this.state = 'dead';
        this.timer = 0;
        return true;
      }
      if (!this.cfg.superArmor || opts.heavy) {
        this.state = 'hurt';
        this.timer = 0;
        if (this.cfg.superArmor) {
          this.x += dir * 8;
        }
      }
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Projectiles
  // ---------------------------------------------------------------------------
  function updateProjectiles(dt) {
    for (let i = G.projectiles.length - 1; i >= 0; i--) {
      const p = G.projectiles[i];
      p.x += p.vx * dt;
      p.z += (p.vz || 0) * dt;
      p.life -= dt;
      p.spin += dt * 18;
      let hit = false;
      if (p.owner === 'player') {
        for (const e of G.enemies) {
          if (e.dead || e.state === 'spawn') continue;
          if (Math.abs(p.x - e.x) < 25 && Math.abs(p.z - e.z) < 0.17) {
            damageEnemy(e, p.damage, { source: G.player, shadow: 2, shake: 2, stop: 0.025 });
            spawnImpact(e.x, groundY(e.z) - 84, e.z, '#bff9f2', 7, 0.8);
            hit = true;
            break;
          }
        }
      } else {
        if (!G.player.dead && Math.abs(p.x - G.player.x) < 22 && Math.abs(p.z - G.player.z) < 0.17) {
          G.player.takeDamage(p.damage, p);
          hit = true;
        }
      }
      if (p.life <= 0 || hit || p.x < -80 || p.x > ARENA_W + 80 || p.z < 0 || p.z > 1.1) {
        if (!hit && p.owner === 'player') {
          spawnParticle({
            x: p.x, y: groundY(p.z) - 90, z: p.z, vx: 0, vy: -10,
            life: 0.35, maxLife: 0.35, size: 8, color: '#9be8e1', kind: 'spark', glow: true
          });
        }
        G.projectiles.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.life -= dt;
      if (p.life <= 0) { G.particles.splice(i, 1); continue; }
      p.vy += (p.gravity || 0) * dt;
      p.vx *= Math.pow(p.drag || 0.98, dt * 60);
      p.vy *= Math.pow(p.drag || 0.98, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  }

  function updateEffects(dt) {
    for (let i = G.effects.length - 1; i >= 0; i--) {
      const e = G.effects[i];
      e.life -= dt;
      if (e.type === 'ring') e.r = lerp(e.r, e.maxR, 1 - Math.pow(0.001, dt));
      if (e.life <= 0) G.effects.splice(i, 1);
    }
    for (let i = G.texts.length - 1; i >= 0; i--) {
      const t = G.texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= 0.96;
      if (t.life <= 0) G.texts.splice(i, 1);
    }
  }

  Object.assign(window, {
    spawnParticle, spawnImpact, spawnDeath, spawnGhost, spawnSlash, spawnEnemySlash,
    spawnRing, addFloatText, damageEnemy, onEnemyKilled, Player, Enemy,
    updateProjectiles, updateParticles, updateEffects
  });
})();
