export const WORLD_RADIUS = 400;
export const DEBT_FUSE = 9;
export const MAX_COLLECTORS = 4;

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const angleLerp = (a, b, t) => {
  let diff = ((b - a + Math.PI * 3) % TAU) - Math.PI;
  return a + diff * t;
};

const ENEMY_TYPES = {
  husk: {
    r: 14,
    hp: 30,
    speed: 112,
    contact: 9,
    score: 60,
    color: "#ff5d8f",
    label: "HUSK",
  },
  gazer: {
    r: 15,
    hp: 42,
    speed: 84,
    contact: 7,
    score: 90,
    color: "#ffc35c",
    label: "GAZER",
  },
  brute: {
    r: 30,
    hp: 170,
    speed: 55,
    contact: 14,
    score: 180,
    color: "#b38bff",
    label: "BRUTE",
  },
  collector: {
    r: 15,
    hp: 64,
    speed: 168,
    contact: 10,
    score: 260,
    color: "#ff4f6d",
    label: "COLLECTOR",
  },
};

const WAVE_SUBTITLES = {
  1: "THE PRESENT",
  2: "THE PRESENT RESISTS",
  3: "INTEREST ACCRUES",
  4: "COLLECTION NOTICE",
  5: "THE AUDITOR",
};

export class Game {
  constructor() {
    this.input = {
      moveX: 0,
      moveY: 0,
      aimAngle: -Math.PI / 2,
      fire: false,
      slow: false,
      dashPressed: false,
      touch: false,
    };
    this.onSfx = () => {};
    this.onToast = () => {};
    this.onBanner = () => {};
    this.onSlowChange = () => {};
    this.entitySeq = 0;
    this.moteSeq = 0;
    this.status = "idle";
    this.reset();
    this.status = "title";
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.pickups = [];
    this.debt = [];
  }

  reset() {
    this.status = "playing";
    this.time = 0;
    this.elapsed = 0;
    this.timeScale = 1;
    this.slowTarget = 1;
    this.wasSlowed = false;
    this.overdrive = 0;
    this.score = 0;
    this.combo = 0;
    this.comboT = 0;
    this.stolen = 0;
    this.debtFrac = 0;
    this.debt = [];
    this.moteSeq = 0;
    this.wave = 1;
    this.waveT = 0;
    this.waveDuration = 16;
    this.spawnT = 0.85;
    this.lastCollectorSpawn = -10;
    this.overdueNotified = false;
    this.boss = null;
    this.bossSpawnT = 0;
    this.bossSpawned = false;
    this.deathT = 0;
    this.victoryT = 0;
    this.shake = 0;
    this.flash = 0;
    this.hitstop = 0;
    this.input.fire = false;
    this.input.slow = false;
    this.input.dashPressed = false;

    this.player = {
      x: 0,
      y: 30,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      hp: 100,
      maxHp: 100,
      fireCd: 0,
      dashCd: 0,
      dashT: 0,
      dashDir: -Math.PI / 2,
      invuln: 0,
      trail: [],
      dead: false,
      overdriveGlow: 0,
    };

    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.pickups = [];
    this.echo = [];

    this.stats = {
      kills: 0,
      collectorsFaced: 0,
      collectorsKilled: 0,
      borrowed: 0,
      wave: 1,
      score: 0,
      time: 0,
    };

    this.flags = {
      firstDebt: false,
      firstCollector: false,
      firstSlow: false,
      hurt: false,
      bossIntro: false,
    };

    this.spawnInitial();
    this.onBanner("WAVE 01", WAVE_SUBTITLES[1]);
    this.onToast("HOLD SHIFT TO STEAL TIME · THE FUTURE IS WATCHING", "gold");
  }

  spawnInitial() {
    const positions = [
      { angle: -Math.PI / 2, radius: 330 },
      { angle: Math.PI * 0.28, radius: 345 },
      { angle: Math.PI * 0.78, radius: 340 },
    ];
    positions.forEach((spot, index) => {
      this.spawnEnemy("husk", {
        angle: spot.angle,
        radius: spot.radius,
        spawnT: 0.12 + index * 0.06,
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Main update                                                       */
  /* ---------------------------------------------------------------- */

  update(rawDt) {
    const dt = clamp(rawDt || 0, 0, 0.05);
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * (14 + this.shake * 4));
    this.flash = Math.max(0, this.flash - dt * 3.2);

    if (this.status === "playing") {
      this.elapsed += dt;
      this.updateTime(dt);
      this.updatePlayer(dt);
      this.updateDebt(dt);
      this.updateWaves(dt);
      this.updateEnemies(dt);
      this.updateBoss(dt);
      this.updateBullets(dt);
      this.updatePickups(dt);
      this.updateEffects(dt);
      this.updateCombo(dt);
      if (this.hitstop > 0) this.hitstop = Math.max(0, this.hitstop - dt);
      this.player.overdriveGlow = lerp(
        this.player.overdriveGlow,
        this.timeScale < 0.55 ? 1 : 0,
        Math.min(1, dt * 10)
      );
    } else if (this.status === "dying") {
      this.timeScale = lerp(this.timeScale, 0.15, Math.min(1, dt * 3));
      this.updateEnemies(dt);
      this.updateBoss(dt);
      this.updateBullets(dt);
      this.updateEffects(dt);
      this.deathT -= dt;
      if (this.deathT <= 0) {
        this.status = "dead";
        this.stats.time = this.elapsed;
        this.stats.score = Math.round(this.score);
      }
    } else if (this.status === "victory") {
      this.timeScale = lerp(this.timeScale, 0.2, Math.min(1, dt * 2.5));
      this.updateEnemies(dt);
      this.updateBullets(dt);
      this.updateEffects(dt);
      this.victoryT -= dt;
      if (this.victoryT <= 0) {
        this.status = "won";
        this.stats.time = this.elapsed;
        this.stats.score = Math.round(this.score);
      }
    }
  }

  updateTime(dt) {
    const active = this.status === "playing" && this.input.slow && !this.player.dead;
    this.slowTarget = active ? 0.19 : 1;
    const rate = active ? 13 : 8;
    this.timeScale = lerp(this.timeScale, this.slowTarget, Math.min(1, rate * dt));

    const slowed = this.timeScale < 0.55;
    if (slowed !== this.wasSlowed) {
      this.wasSlowed = slowed;
      this.onSlowChange(slowed);
      if (slowed && !this.flags.firstSlow) {
        this.flags.firstSlow = true;
        this.onToast("OVERCLOCK · SHARDS BURN HOTTER WHILE TIME IS SLOW", "gold");
      }
    }

    if (active) {
      this.stolen += dt;
      this.debtFrac += dt;
      this.stats.borrowed = this.stolen;
      while (this.debtFrac >= 1 - 1e-6) {
        this.debtFrac -= 1;
        this.addDebt();
      }
    }
  }

  addDebt() {
    this.debt.push({ id: ++this.moteSeq, fuse: DEBT_FUSE });
    this.onSfx("debt");
    this.addText(this.player.x, this.player.y - 28, "+1s", "#ff8b9f", 11);
    this.addParticles(this.player.x, this.player.y, 7, "#ff4f6d", {
      speed: 70,
      life: 0.55,
      size: 1.7,
      glow: true,
    });
    if (!this.flags.firstDebt) {
      this.flags.firstDebt = true;
      this.onToast("1 SECOND LOGGED · IT RETURNS IN 9s AS A COLLECTOR", "warn");
      this.onSfx("collector");
    }
  }

  updateDebt(dt) {
    for (const mote of this.debt) {
      if (mote.fuse > 0) mote.fuse = Math.max(0, mote.fuse - dt);
    }
    const activeCollectors = this.enemies.reduce(
      (count, enemy) => count + (enemy.type === "collector" && enemy.alive && enemy.spawnT <= 0 ? 1 : 0),
      0
    );
    const hasReady = this.debt.some((mote) => mote.fuse <= 0);
    if (hasReady && activeCollectors >= MAX_COLLECTORS) {
      if (!this.overdueNotified) {
        this.overdueNotified = true;
        this.onToast("THE FUTURE IS QUEUED · TOO MANY COLLECTORS ALIVE", "warn");
      }
      return;
    }
    this.overdueNotified = false;
    if (this.time - this.lastCollectorSpawn < 0.55) return;
    const ready = this.debt.find((mote) => mote.fuse <= 0);
    if (!ready) return;
    this.debt = this.debt.filter((mote) => mote !== ready);
    this.spawnCollector();
    this.lastCollectorSpawn = this.time;
  }

  spawnCollector() {
    const angle = Math.random() * TAU;
    const radius = 300 + Math.random() * 70;
    this.spawnEnemy("collector", { angle, radius, spawnT: 1.25 });
    this.stats.collectorsFaced += 1;
    this.onSfx("collector");
    this.flash = Math.max(this.flash, 0.32);
    this.shake = Math.max(this.shake, 7);
    this.ring(Math.cos(angle) * radius, Math.sin(angle) * radius, 16, 52, "#ff4f6d", 0.9, 2);
    if (!this.flags.firstCollector) {
      this.flags.firstCollector = true;
      this.onToast("THE FUTURE COLLECTS · KILL THE COLLECTOR", "warn");
    }
  }

  updateWaves(dt) {
    if (this.wave >= 5) {
      if (!this.bossSpawned) {
        this.bossSpawnT -= dt;
        if (this.bossSpawnT <= 0) this.spawnBoss();
      }
      return;
    }

    this.waveT += dt;
    if (this.waveT >= this.waveDuration) {
      this.wave += 1;
      this.waveT = 0;
      this.stats.wave = this.wave;
      this.score += 250 * (this.wave - 1);
      this.spawnT = 0.25;
      this.onSfx("wave");
      this.onBanner(`WAVE ${String(this.wave).padStart(2, "0")}`, WAVE_SUBTITLES[this.wave]);
      if (this.wave >= 5) {
        this.bossSpawnT = 2.1;
        this.bossSpawned = false;
        this.onSfx("boss");
        this.onToast("THE AUDITOR DESCENDS · IT COLLECTS WHAT YOU OWE", "warn");
        return;
      }
      const burst = 1 + Math.min(2, this.wave - 1);
      for (let i = 0; i < burst; i += 1) this.spawnRandomEnemy();
      if (this.wave === 2) this.onToast("GAZERS AIM SLOW · STEAL TIME TO SLIP THE SHOT", "gold");
      if (this.wave === 3) this.onToast("BRUTES TELEGRAPH A RADIAL BURST · BLINK THROUGH IT", "gold");
      if (this.wave === 4) this.onToast("THE FUTURE IS CLOSER NOW · SPEND SECONDS CAREFULLY", "warn");
    }

    this.spawnT -= dt;
    const cap = Math.min(16, 5 + this.wave * 2);
    if (this.spawnT <= 0 && this.enemies.filter((enemy) => enemy.alive).length < cap) {
      this.spawnRandomEnemy();
      this.spawnT = Math.max(0.7, 1.75 - (this.wave - 1) * 0.23);
    }
  }

  spawnRandomEnemy() {
    const roll = Math.random();
    let type = "husk";
    if (this.wave >= 2) {
      if (this.wave === 2) type = roll < 0.7 ? "husk" : "gazer";
      else if (this.wave === 3) type = roll < 0.52 ? "husk" : roll < 0.9 ? "gazer" : "brute";
      else type = roll < 0.42 ? "husk" : roll < 0.78 ? "gazer" : "brute";
    }
    this.spawnEnemy(type, {
      angle: Math.random() * TAU,
      radius: 315 + Math.random() * 60,
      spawnT: 0.6 + Math.random() * 0.3,
    });
  }

  spawnEnemy(type, options = {}) {
    const base = ENEMY_TYPES[type];
    const waveScale = 1 + Math.max(0, this.wave - 1) * 0.17;
    const angle = options.angle ?? Math.random() * TAU;
    const radius = options.radius ?? 300 + Math.random() * 70;
    const x = options.x ?? Math.cos(angle) * radius;
    const y = options.y ?? Math.sin(angle) * radius;
    const spawnT = options.spawnT ?? 0.6;
    const hp = Math.round(base.hp * (type === "collector" ? 1 + (this.wave - 1) * 0.1 : waveScale));
    const enemy = {
      id: ++this.entitySeq,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      r: base.r,
      hp,
      maxHp: hp,
      speed: base.speed * (1 + Math.max(0, this.wave - 1) * 0.035),
      contact: base.contact,
      score: base.score,
      color: base.color,
      angle: angle + Math.PI,
      spawnT,
      spawnMax: spawnT,
      spawnAngle: angle,
      t: Math.random() * 10,
      phase: Math.random() * TAU,
      orbital: Math.random() < 0.5 ? -1 : 1,
      fireT: 1 + Math.random() * 1.6,
      blinkT: 2 + Math.random() * 1.5,
      telegraph: 0,
      telegraphMax: 0,
      lockAngle: 0,
      contactCd: 0,
      flash: 0,
      alive: true,
      deadAt: 0,
    };
    this.enemies.push(enemy);
    this.ring(x, y, 4, base.r * 2.4, base.color, 0.65, 1.4);
    if (type !== "collector") this.onSfx("spawn");
    return enemy;
  }

  /* ---------------------------------------------------------------- */
  /* Player                                                            */
  /* ---------------------------------------------------------------- */

  updatePlayer(dt) {
    const p = this.player;
    if (p.dead) return;

    const rawX = this.input.moveX || 0;
    const rawY = this.input.moveY || 0;
    const moveMag = Math.hypot(rawX, rawY);
    const mx = moveMag > 1 ? rawX / moveMag : rawX;
    const my = moveMag > 1 ? rawY / moveMag : rawY;

    p.invuln = Math.max(0, p.invuln - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.fireCd = Math.max(0, p.fireCd - dt);

    if (this.input.dashPressed) {
      this.input.dashPressed = false;
      if (p.dashCd <= 0) {
        p.dashDir = moveMag > 0.35 ? Math.atan2(my, mx) : p.angle;
        p.dashT = 0.15;
        p.dashCd = 2;
        p.invuln = Math.max(p.invuln, 0.27);
        this.onSfx("dash");
        this.ring(p.x, p.y, 8, 36, "#6ff7f0", 0.4, 1.5);
        this.addParticles(p.x, p.y, 9, "#b8fffb", {
          speed: 150,
          life: 0.36,
          size: 2,
          glow: true,
        });
      }
    }

    if (p.dashT > 0) {
      p.dashT = Math.max(0, p.dashT - dt);
      p.x += Math.cos(p.dashDir) * 760 * dt;
      p.y += Math.sin(p.dashDir) * 760 * dt;
      p.vx = Math.cos(p.dashDir) * 180;
      p.vy = Math.sin(p.dashDir) * 180;
      if (Math.random() < 0.9) {
        this.addParticles(p.x, p.y, 1, Math.random() < 0.2 ? "#ffffff" : "#6ff7f0", {
          speed: 26,
          life: 0.3,
          size: 3.2,
          glow: true,
        });
      }
    } else {
      const speed = 218 * (this.timeScale < 0.55 ? 1.02 : 1);
      const accel = Math.min(1, dt * 15);
      p.vx += (mx * speed - p.vx) * accel;
      p.vy += (my * speed - p.vy) * accel;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (Math.hypot(p.vx, p.vy) > 60 && Math.random() < 0.24) {
        this.addParticles(
          p.x - Math.cos(p.angle) * 10,
          p.y - Math.sin(p.angle) * 10,
          1,
          "#3ce4de",
          { speed: 18, life: 0.32, size: 1.6, glow: true }
        );
      }
    }

    const dist = Math.hypot(p.x, p.y);
    const limit = WORLD_RADIUS - 16;
    if (dist > limit) {
      const nx = p.x / dist;
      const ny = p.y / dist;
      p.x = nx * limit;
      p.y = ny * limit;
      const radial = p.vx * nx + p.vy * ny;
      if (radial > 0) {
        p.vx -= radial * nx;
        p.vy -= radial * ny;
      }
    }

    const aim = Number.isFinite(this.input.aimAngle) ? this.input.aimAngle : p.angle;
    p.angle = angleLerp(p.angle, aim, Math.min(1, dt * 22));

    p.trail.unshift({ x: p.x, y: p.y, t: this.time });
    if (p.trail.length > 14) p.trail.length = 14;

    const echoSample = { x: p.x, y: p.y, angle: p.angle, t: this.time };
    const lastEcho = this.echo[this.echo.length - 1];
    if (!lastEcho || this.time - lastEcho.t > 0.045) this.echo.push(echoSample);
    while (this.echo.length && this.time - this.echo[0].t > 1.4) this.echo.shift();

    const overclocked = this.timeScale < 0.6;
    if (this.input.fire && p.fireCd <= 0) {
      p.fireCd = overclocked ? 0.092 : 0.155;
      const spread = overclocked ? 0.018 : 0.032;
      const shootAngle = p.angle + (Math.random() - 0.5) * spread;
      const damage = overclocked ? 23 : 11;
      const speed = overclocked ? 780 : 650;
      const muzzle = 17;
      this.bullets.push({
        x: p.x + Math.cos(shootAngle) * muzzle,
        y: p.y + Math.sin(shootAngle) * muzzle,
        vx: Math.cos(shootAngle) * speed,
        vy: Math.sin(shootAngle) * speed,
        r: overclocked ? 5 : 4,
        damage,
        friendly: true,
        life: 1.15,
        color: overclocked ? "#ffd76a" : "#7dfff4",
        overclocked,
        trailX: p.x,
        trailY: p.y,
      });
      this.addParticles(
        p.x + Math.cos(shootAngle) * 18,
        p.y + Math.sin(shootAngle) * 18,
        2,
        overclocked ? "#ffd76a" : "#9dfffb",
        { speed: 90, life: 0.2, size: 2.2, glow: true, spread: 0.55, angle: shootAngle }
      );
      this.shake = Math.max(this.shake, overclocked ? 2 : 1.1);
      this.onSfx("shoot", { overclock: overclocked });
    }
  }

  damagePlayer(amount, sourceX = null, sourceY = null) {
    const p = this.player;
    if (this.status !== "playing" || p.dead || p.invuln > 0) return;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 0.72;
    this.flash = Math.max(this.flash, 0.9);
    this.shake = Math.max(this.shake, 10);
    this.combo = 0;
    this.comboT = 0;
    this.onSfx("hurt");
    this.addParticles(p.x, p.y, 12, "#ff4f6d", {
      speed: 140,
      life: 0.55,
      size: 2.2,
      glow: true,
    });
    this.ring(p.x, p.y, 6, 44, "#ff4f6d", 0.45, 1.5);
    this.addText(p.x, p.y - 24, `-${amount}`, "#ff98a9", 12);
    if (sourceX !== null && sourceY !== null) {
      const dx = p.x - sourceX;
      const dy = p.y - sourceY;
      const d = Math.hypot(dx, dy) || 1;
      p.vx += (dx / d) * 150;
      p.vy += (dy / d) * 150;
    }
    if (p.hp <= 0) this.die();
  }

  die() {
    const p = this.player;
    p.dead = true;
    p.hp = 0;
    this.status = "dying";
    this.deathT = 1.8;
    this.shake = 22;
    this.flash = 1;
    this.onSlowChange(false);
    this.onSfx("defeat");
    this.addParticles(p.x, p.y, 44, "#ff4f6d", {
      speed: 260,
      life: 1.2,
      size: 2.8,
      glow: true,
    });
    this.addParticles(p.x, p.y, 22, "#ffd9df", {
      speed: 160,
      life: 0.9,
      size: 2,
      glow: true,
    });
    this.ring(p.x, p.y, 10, 140, "#ff4f6d", 1.3, 3);
    this.ring(p.x, p.y, 4, 90, "#ffffff", 0.8, 2);
    this.bullets = this.bullets.filter((bullet) => bullet.friendly);
    this.stats.time = this.elapsed;
  }

  /* ---------------------------------------------------------------- */
  /* Enemies                                                           */
  /* ---------------------------------------------------------------- */

  updateEnemies(dt) {
    const worldDt = dt * this.timeScale;
    const player = this.player;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.contactCd = Math.max(0, enemy.contactCd - dt);
      const previousTelegraph = enemy.telegraph;
      enemy.telegraph = Math.max(0, enemy.telegraph - worldDt);
      enemy.telegraphEnded = previousTelegraph > 0 && enemy.telegraph <= 0;
      enemy.spawnT = Math.max(0, enemy.spawnT - dt);

      if (enemy.spawnT > 0) continue;
      enemy.t += worldDt;

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      if (enemy.type === "husk") {
        const wobble = Math.sin(enemy.t * 3.2 + enemy.phase) * 0.42;
        const heading = Math.atan2(ny, nx) + wobble;
        const desired = enemy.speed * (dist < 120 ? 1.06 : 1);
        enemy.vx = lerp(enemy.vx, Math.cos(heading) * desired, Math.min(1, worldDt * 3.1));
        enemy.vy = lerp(enemy.vy, Math.sin(heading) * desired, Math.min(1, worldDt * 3.1));
        enemy.angle = Math.atan2(enemy.vy, enemy.vx);
      } else if (enemy.type === "gazer") {
        const ideal = 245 + Math.sin(enemy.phase) * 30;
        let moveX = 0;
        let moveY = 0;
        if (dist > ideal + 35) {
          moveX = nx;
          moveY = ny;
        } else if (dist < ideal - 35) {
          moveX = -nx;
          moveY = -ny;
        }
        moveX += -ny * enemy.orbital * 0.7;
        moveY += nx * enemy.orbital * 0.7;
        const mag = Math.hypot(moveX, moveY) || 1;
        enemy.vx = lerp(enemy.vx, (moveX / mag) * enemy.speed, Math.min(1, worldDt * 2.4));
        enemy.vy = lerp(enemy.vy, (moveY / mag) * enemy.speed, Math.min(1, worldDt * 2.4));
        enemy.angle = Math.atan2(dy, dx);
        enemy.fireT -= worldDt;
        if (enemy.fireT <= 0 && enemy.telegraph <= 0) {
          enemy.telegraph = 0.62;
          enemy.telegraphMax = 0.62;
          enemy.lockAngle = Math.atan2(dy, dx);
        }
        if (enemy.telegraph > 0) enemy.lockAngle = Math.atan2(dy, dx);
        if (enemy.telegraphEnded) {
          this.hostileBullet(enemy.x, enemy.y, enemy.lockAngle, 235, 8, "#ffc35c", 5);
          this.onSfx("shoot");
          enemy.fireT = 1.9 + Math.random() * 0.8;
          enemy.telegraph = 0;
        }
      } else if (enemy.type === "brute") {
        if (enemy.telegraphEnded) {
          const count = 12;
          const offset = Math.random() * TAU;
          for (let i = 0; i < count; i += 1) {
            this.hostileBullet(
              enemy.x,
              enemy.y,
              offset + (i / count) * TAU,
              185,
              9,
              "#c3a4ff",
              5.5
            );
          }
          this.ring(enemy.x, enemy.y, enemy.r, enemy.r + 70, "#b38bff", 0.55, 3);
          this.shake = Math.max(this.shake, 4);
          this.onSfx("debt");
          enemy.fireT = 3.1 + Math.random() * 0.7;
          enemy.telegraph = 0;
        } else if (enemy.telegraph > 0) {
          enemy.vx *= 0.9;
          enemy.vy *= 0.9;
          enemy.angle += worldDt * 1.4;
        } else {
          enemy.vx = lerp(enemy.vx, nx * enemy.speed, Math.min(1, worldDt * 1.8));
          enemy.vy = lerp(enemy.vy, ny * enemy.speed, Math.min(1, worldDt * 1.8));
          enemy.angle = Math.atan2(dy, dx);
          enemy.fireT -= worldDt;
          if (enemy.fireT <= 0) {
            enemy.telegraph = 0.95;
            enemy.telegraphMax = 0.95;
          }
        }
      } else if (enemy.type === "collector") {
        const ideal = 175;
        let moveX = 0;
        let moveY = 0;
        if (dist > ideal + 20) {
          moveX = nx;
          moveY = ny;
        } else if (dist < ideal - 30) {
          moveX = -nx * 0.8;
          moveY = -ny * 0.8;
        } else {
          moveX = -ny * enemy.orbital;
          moveY = nx * enemy.orbital;
        }
        const mag = Math.hypot(moveX, moveY) || 1;
        enemy.vx = lerp(enemy.vx, (moveX / mag) * enemy.speed, Math.min(1, worldDt * 3.4));
        enemy.vy = lerp(enemy.vy, (moveY / mag) * enemy.speed, Math.min(1, worldDt * 3.4));
        enemy.angle = Math.atan2(dy, dx);

        enemy.blinkT -= worldDt;
        if (enemy.blinkT <= 0 && dist > 100 && dist < 380) {
          const blinkAngle = Math.random() * TAU;
          const blinkRadius = 100 + Math.random() * 40;
          const nx2 = player.x + Math.cos(blinkAngle) * blinkRadius;
          const ny2 = player.y + Math.sin(blinkAngle) * blinkRadius;
          this.addParticles(enemy.x, enemy.y, 14, "#ff4f6d", {
            speed: 120,
            life: 0.6,
            size: 2.4,
            glow: true,
          });
          enemy.x = clamp(nx2, -WORLD_RADIUS + 30, WORLD_RADIUS - 30);
          enemy.y = clamp(ny2, -WORLD_RADIUS + 30, WORLD_RADIUS - 30);
          this.ring(enemy.x, enemy.y, 5, 36, "#ff4f6d", 0.45, 1.5);
          enemy.blinkT = 3.2 + Math.random() * 1.8;
          this.onSfx("dash");
        }

        enemy.fireT -= worldDt;
        if (enemy.telegraph > 0) enemy.lockAngle = Math.atan2(dy, dx);
        if (enemy.telegraphEnded) {
          const aim = enemy.lockAngle;
          for (const offset of [-0.16, 0, 0.16]) {
            this.hostileBullet(enemy.x, enemy.y, aim + offset, 275, 8, "#ff4f6d", 5);
          }
          this.onSfx("shoot", { overclock: true });
          enemy.fireT = 1.45 + Math.random() * 0.45;
          enemy.telegraph = 0;
        } else if (enemy.fireT <= 0 && enemy.telegraph <= 0) {
          enemy.telegraph = 0.42;
          enemy.telegraphMax = 0.42;
          enemy.lockAngle = Math.atan2(dy, dx);
        }
      }

      enemy.x += enemy.vx * worldDt;
      enemy.y += enemy.vy * worldDt;

      const edist = Math.hypot(enemy.x, enemy.y);
      const elimit = WORLD_RADIUS - enemy.r - 6;
      if (edist > elimit) {
        const ex = enemy.x / edist;
        const ey = enemy.y / edist;
        enemy.x = ex * elimit;
        enemy.y = ey * elimit;
        const radial = enemy.vx * ex + enemy.vy * ey;
        if (radial > 0) {
          enemy.vx -= radial * ex * 1.1;
          enemy.vy -= radial * ey * 1.1;
        }
      }

      if (this.status === "playing" && !player.dead) {
        const pd = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (pd < enemy.r + 12 && enemy.contactCd <= 0) {
          this.damagePlayer(enemy.contact, enemy.x, enemy.y);
          enemy.contactCd = 0.85;
          const push = (enemy.r + 12 - pd) * 0.5;
          const pdx = (enemy.x - player.x) / (pd || 1);
          const pdy = (enemy.y - player.y) / (pd || 1);
          player.x += pdx * push;
          player.y += pdy * push;
        }
      }
    }

    // Soft separation keeps the swarm readable without heavy physics.
    for (let i = 0; i < this.enemies.length; i += 1) {
      const a = this.enemies[i];
      if (!a.alive || a.spawnT > 0) continue;
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const b = this.enemies[j];
        if (!b.alive || b.spawnT > 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r + 4;
        if (d > 0 && d < min) {
          const overlap = (min - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }

    this.enemies = this.enemies.filter((enemy) => enemy.alive);
  }

  killEnemy(enemy, index) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.deadAt = this.time;
    this.stats.kills += 1;
    this.combo += 1;
    this.comboT = 3.5;
    const multiplier = this.comboMultiplier;
    this.score += enemy.score * multiplier;
    this.shake = Math.max(this.shake, enemy.type === "brute" ? 8 : 3.5);
    this.onSfx("kill");
    this.addParticles(enemy.x, enemy.y, enemy.type === "brute" ? 28 : 15, enemy.color, {
      speed: enemy.type === "brute" ? 210 : 160,
      life: 0.8,
      size: 2.4,
      glow: true,
    });
    this.addParticles(enemy.x, enemy.y, 5, "#ffffff", {
      speed: 90,
      life: 0.35,
      size: 1.6,
      glow: true,
    });
    this.ring(enemy.x, enemy.y, enemy.r, enemy.r + (enemy.type === "brute" ? 90 : 48), enemy.color, 0.55, 2);
    if (enemy.type === "collector") {
      this.stats.collectorsKilled += 1;
      this.addText(enemy.x, enemy.y - 20, "DEBT SETTLED", "#ffd2d8", 10);
      this.addParticles(enemy.x, enemy.y, 8, "#ffd76a", {
        speed: 120,
        life: 0.7,
        size: 2,
        glow: true,
      });
      this.flash = Math.max(this.flash, 0.2);
    }
    const dropChance =
      enemy.type === "brute" ? 1 : enemy.type === "collector" ? 0.4 : enemy.type === "gazer" ? 0.2 : 0.09;
    if (Math.random() < dropChance) this.dropPickup(enemy.x, enemy.y);
  }

  get comboMultiplier() {
    return 1 + Math.min(this.combo, 15) * 0.15;
  }

  updateCombo(dt) {
    if (this.combo <= 0) return;
    this.comboT -= dt;
    if (this.comboT <= 0) {
      this.combo = 0;
      this.comboT = 0;
    }
  }

  dropPickup(x, y) {
    this.pickups.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      life: 13,
      r: 9,
      t: Math.random() * 10,
    });
  }

  updatePickups(dt) {
    const p = this.player;
    for (const pickup of this.pickups) {
      pickup.life -= dt;
      pickup.t += dt;
      const dx = p.x - pickup.x;
      const dy = p.y - pickup.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 120) {
        pickup.vx += (dx / d) * 420 * dt;
        pickup.vy += (dy / d) * 420 * dt;
      }
      pickup.vx *= 0.98;
      pickup.vy *= 0.98;
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      if (d < 22 && this.status === "playing") {
        p.hp = Math.min(p.maxHp, p.hp + 14);
        pickup.life = 0;
        this.onSfx("pickup");
        this.addText(p.x, p.y - 26, "+14", "#9dffb0", 11);
        this.addParticles(p.x, p.y, 10, "#9dffb0", {
          speed: 110,
          life: 0.5,
          size: 1.8,
          glow: true,
        });
        this.ring(p.x, p.y, 5, 32, "#9dffb0", 0.4, 1.5);
      }
    }
    this.pickups = this.pickups.filter((pickup) => pickup.life > 0);
  }

  /* ---------------------------------------------------------------- */
  /* Boss                                                              */
  /* ---------------------------------------------------------------- */

  spawnBoss() {
    this.bossSpawned = true;
    this.boss = {
      x: 0,
      y: -170,
      targetX: 0,
      targetY: -60,
      r: 56,
      hp: 1080,
      maxHp: 1080,
      spawnT: 1.8,
      spawnMax: 1.8,
      t: 0,
      fireT: 2.4,
      telegraph: 0,
      telegraphMax: 0,
      pattern: "ring",
      patternIndex: 0,
      phase: 1,
      flash: 0,
      contactCd: 0,
      angle: -Math.PI / 2,
      lockAngle: 0,
      dead: false,
      deaths: 0,
    };
    this.shake = 14;
    this.flash = 0.5;
    this.ring(0, -170, 30, 170, "#ff4f6d", 1.4, 3);
    this.ring(0, -170, 10, 90, "#b38bff", 1, 2);
    this.onSfx("boss");
    this.onBanner("THE AUDITOR", "IT COLLECTS WHAT YOU OWE");
    this.flags.bossIntro = true;
  }

  updateBoss(dt) {
    const boss = this.boss;
    if (!boss || boss.dead) return;
    const worldDt = dt * this.timeScale;
    boss.flash = Math.max(0, boss.flash - dt);
    boss.contactCd = Math.max(0, boss.contactCd - dt);
    boss.spawnT = Math.max(0, boss.spawnT - dt);
    if (boss.spawnT > 0) return;

    boss.t += worldDt;
    boss.angle += worldDt * 0.34;
    const orbit = boss.t * 0.24;
    boss.targetX = Math.cos(orbit) * 170;
    boss.targetY = Math.sin(orbit * 1.17) * 115;
    const lerpRate = Math.min(1, worldDt * 0.9);
    boss.x = lerp(boss.x, boss.targetX, lerpRate);
    boss.y = lerp(boss.y, boss.targetY, lerpRate);

    if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.55) {
      boss.phase = 2;
      this.onBanner("PHASE II", "THE AUDITOR UNWINDS");
      this.onToast("THE AUDITOR IS UNWINDING · ATTACKS ACCELERATE", "warn");
      this.onSfx("boss");
      this.shake = 12;
      this.ring(boss.x, boss.y, boss.r, boss.r + 160, "#ff4f6d", 1, 3);
      this.flash = Math.max(this.flash, 0.4);
    }

    if (boss.telegraph > 0) {
      boss.telegraph = Math.max(0, boss.telegraph - worldDt);
      boss.lockAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      if (boss.telegraph <= 0.001) this.executeBossAttack();
    } else {
      boss.fireT -= worldDt;
      if (boss.fireT <= 0) this.startBossAttack();
    }

    const player = this.player;
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (this.status === "playing" && dist < boss.r + 13 && boss.contactCd <= 0) {
      this.damagePlayer(18, boss.x, boss.y);
      boss.contactCd = 1;
      const push = (boss.r + 20 - dist) * 0.7;
      player.x += (dx / dist) * push;
      player.y += (dy / dist) * push;
    }

    const limit = WORLD_RADIUS - boss.r - 10;
    const centerDist = Math.hypot(boss.x, boss.y);
    if (centerDist > limit) {
      boss.x = (boss.x / centerDist) * limit;
      boss.y = (boss.y / centerDist) * limit;
    }
  }

  startBossAttack() {
    const boss = this.boss;
    if (!boss) return;
    const patterns = ["ring", "aimed", "summon", "ring", "debt", "aimed", "summon"];
    boss.pattern = patterns[boss.patternIndex % patterns.length];
    boss.patternIndex += 1;
    if (boss.pattern === "debt" && this.debt.length === 0) boss.pattern = "ring";
    if (boss.pattern === "summon" && this.enemies.filter((enemy) => enemy.alive).length > 9) {
      boss.pattern = "ring";
    }
    boss.telegraph = boss.pattern === "debt" ? 0.35 : boss.phase === 2 ? 0.5 : 0.7;
    boss.telegraphMax = boss.telegraph;
    boss.lockAngle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
    this.onSfx("spawn");
  }

  executeBossAttack() {
    const boss = this.boss;
    if (!boss) return;
    const player = this.player;
    if (boss.pattern === "ring") {
      const count = boss.phase === 2 ? 20 : 15;
      const offset = Math.random() * TAU;
      for (let i = 0; i < count; i += 1) {
        this.hostileBullet(
          boss.x,
          boss.y,
          offset + (i / count) * TAU,
          boss.phase === 2 ? 195 : 170,
          9,
          "#ff5d7a",
          6
        );
      }
      this.ring(boss.x, boss.y, boss.r, boss.r + 120, "#ff4f6d", 0.7, 3);
      this.shake = 7;
      this.onSfx("debt");
    } else if (boss.pattern === "aimed") {
      const count = boss.phase === 2 ? 7 : 5;
      const aim = boss.lockAngle;
      const spread = boss.phase === 2 ? 0.5 : 0.38;
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        this.hostileBullet(boss.x, boss.y, aim + t * spread, 315, 10, "#ffb0bd", 5.5);
      }
      this.ring(boss.x, boss.y, boss.r, boss.r + 70, "#ffb0bd", 0.5, 2);
      this.onSfx("shoot", { overclock: true });
    } else if (boss.pattern === "summon") {
      const count = boss.phase === 2 ? 3 : 2;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * TAU;
        this.spawnEnemy(i === 1 ? "gazer" : "husk", {
          angle,
          radius: 290 + Math.random() * 60,
          spawnT: 0.7,
        });
      }
      this.ring(boss.x, boss.y, boss.r, boss.r + 90, "#b38bff", 0.7, 2);
      this.onSfx("spawn");
    } else if (boss.pattern === "debt") {
      if (this.debt.length) {
        this.debt.forEach((mote) => {
          mote.fuse = Math.max(0, mote.fuse - 2.6);
        });
        this.onToast("THE AUDITOR CALLS YOUR DEBT · FUSES SHORTEN", "warn");
        this.addText(boss.x, boss.y - 70, "-2.6s", "#ff8b9f", 14);
        this.onSfx("collector");
        this.flash = Math.max(this.flash, 0.3);
        for (const mote of this.debt.filter((item) => item.fuse <= 0)) {
          this.addParticles(boss.x, boss.y, 6, "#ff4f6d", {
            speed: 150,
            life: 0.6,
            size: 2.4,
            glow: true,
          });
          break;
        }
      } else {
        this.ring(boss.x, boss.y, boss.r, boss.r + 100, "#ff4f6d", 0.6, 2);
      }
    }
    boss.fireT = boss.phase === 2 ? 2.1 : 3.15;
    boss.telegraph = 0;
  }

  hitBoss(bullet) {
    const boss = this.boss;
    if (!boss || boss.dead || boss.spawnT > 0) return false;
    const dx = bullet.x - boss.x;
    const dy = bullet.y - boss.y;
    if (Math.hypot(dx, dy) > boss.r + bullet.r) return false;
    boss.hp = Math.max(0, boss.hp - bullet.damage);
    boss.flash = 0.1;
    this.ring(bullet.x, bullet.y, 2, 18, "#ffd76a", 0.25, 1.5);
    this.addParticles(bullet.x, bullet.y, 4, "#ffd76a", {
      speed: 90,
      life: 0.3,
      size: 1.7,
      glow: true,
    });
    this.onSfx("hit");
    if (boss.hp <= 0) this.killBoss();
    return true;
  }

  killBoss() {
    const boss = this.boss;
    if (!boss || boss.dead) return;
    boss.dead = true;
    this.score += 5000;
    this.stats.collectorsKilled += 0; // boss is not a collector
    this.status = "victory";
    this.victoryT = 2.8;
    this.shake = 26;
    this.flash = 1;
    this.onSfx("victory");
    this.onBanner("AUDIT FAILED", "THE FUTURE RELEASES YOU");
    this.bullets = this.bullets.filter((bullet) => bullet.friendly);
    for (let i = 0; i < 5; i += 1) {
      this.ring(boss.x, boss.y, 20 + i * 16, boss.r + 120 + i * 40, i % 2 ? "#ffd76a" : "#ff4f6d", 1.2, 3);
    }
    this.addParticles(boss.x, boss.y, 70, "#ff4f6d", {
      speed: 300,
      life: 1.6,
      size: 3,
      glow: true,
    });
    this.addParticles(boss.x, boss.y, 36, "#ffd76a", {
      speed: 210,
      life: 1.3,
      size: 2.4,
      glow: true,
    });
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.alive = false;
        this.addParticles(enemy.x, enemy.y, 10, enemy.color, {
          speed: 150,
          life: 0.8,
          size: 2,
          glow: true,
        });
      }
    }
    this.enemies = [];
    this.stats.time = this.elapsed;
  }

  /* ---------------------------------------------------------------- */
  /* Projectiles & effects                                             */
  /* ---------------------------------------------------------------- */

  hostileBullet(x, y, angle, speed, damage, color, radius = 5) {
    this.bullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: radius,
      damage,
      friendly: false,
      life: 6,
      color,
      trailX: x,
      trailY: y,
    });
  }

  updateBullets(dt) {
    const player = this.player;
    const bullets = this.bullets;
    for (const bullet of bullets) {
      if (!bullet.friendly) bullet.trailX = bullet.x, bullet.trailY = bullet.y;
      const step = bullet.friendly ? dt : dt * this.timeScale;
      bullet.x += bullet.vx * step;
      bullet.y += bullet.vy * step;
      bullet.life -= step;

      if (bullet.life <= 0) continue;
      if (Math.hypot(bullet.x, bullet.y) > WORLD_RADIUS + 70) {
        bullet.life = 0;
        continue;
      }

      if (bullet.friendly) {
        let hitSomething = false;
        for (const enemy of this.enemies) {
          if (!enemy.alive || enemy.spawnT > 0) continue;
          if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.r + bullet.r) {
            enemy.hp -= bullet.damage;
            enemy.flash = 0.12;
            this.addParticles(bullet.x, bullet.y, 4, bullet.overclocked ? "#ffd76a" : "#9dfffb", {
              speed: 110,
              life: 0.3,
              size: 1.7,
              glow: true,
            });
            this.ring(bullet.x, bullet.y, 2, 15, bullet.overclocked ? "#ffd76a" : "#9dfffb", 0.22, 1.2);
            this.onSfx("hit");
            if (enemy.hp <= 0) this.killEnemy(enemy);
            hitSomething = true;
            break;
          }
        }
        if (!hitSomething) hitSomething = this.hitBoss(bullet);
        if (hitSomething) bullet.life = 0;
      } else if (this.status === "playing" && !player.dead) {
        if (Math.hypot(bullet.x - player.x, bullet.y - player.y) < 12 + bullet.r) {
          this.damagePlayer(bullet.damage, bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02);
          bullet.life = 0;
          this.addParticles(bullet.x, bullet.y, 7, bullet.color, {
            speed: 110,
            life: 0.4,
            size: 1.8,
            glow: true,
          });
        }
      }
    }
    this.bullets = bullets.filter((bullet) => bullet.life > 0);
  }

  addParticles(x, y, count, color, options = {}) {
    const {
      speed = 120,
      life = 0.6,
      size = 2,
      glow = true,
      spread = TAU,
      angle = 0,
      drag = 3.2,
      type = "dot",
    } = options;
    for (let i = 0; i < count; i += 1) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * (0.35 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        glow,
        drag,
        type,
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 10,
      });
    }
    if (this.particles.length > 520) this.particles.splice(0, this.particles.length - 520);
  }

  ring(x, y, r0, r1, color, life = 0.5, width = 2) {
    this.rings.push({ x, y, r0, r1, color, life, maxLife: life, width });
    if (this.rings.length > 120) this.rings.shift();
  }

  addText(x, y, text, color, size = 10) {
    this.texts.push({ x, y, text, color, size, life: 1.1, maxLife: 1.1 });
    if (this.texts.length > 40) this.texts.shift();
  }

  updateEffects(dt) {
    const worldDt = dt * this.timeScale;
    for (const particle of this.particles) {
      particle.life -= worldDt;
      particle.x += particle.vx * worldDt;
      particle.y += particle.vy * worldDt;
      const damping = Math.max(0, 1 - particle.drag * worldDt);
      particle.vx *= damping;
      particle.vy *= damping;
      particle.rot += particle.vr * worldDt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    for (const ring of this.rings) {
      ring.life -= worldDt;
    }
    this.rings = this.rings.filter((ring) => ring.life > 0);

    for (const text of this.texts) {
      text.life -= dt;
      text.y -= 18 * dt;
    }
    this.texts = this.texts.filter((text) => text.life > 0);
  }
}
