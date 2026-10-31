import {
  Background, World, ZONES, VIEW_W, VIEW_H, GROUND_Y,
  drawPlatform, drawHazard, drawOrb, drawCheckpoint, drawArenaGate,
} from "./level.js";
import { Player } from "./player.js";
import { createEnemy } from "./enemies.js";
import { Boss } from "./boss.js";
import { Particles } from "./particles.js";
import { TAU, clamp, lerp, rand, rectsOverlap, formatScore } from "./util.js";

const ROMAN = ["I", "II", "III"];

export class Game {
  constructor(canvas, input, audio, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.input = input;
    this.audio = audio;
    this.ui = ui;
    this.background = new Background();
    this.particles = new Particles();
    this.mode = "menu";
    this.clock = 0;
    this.menuTime = 0;
    this.camera = { x: 0, y: 0, shake: 0, shakeX: 0, shakeY: 0 };
    this.world = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.looseOrbs = [];
    this.boss = null;
    this.bossDefeated = false;
    this.bossIntroTimer = 0;
    this.hitstopTimer = 0;
    this.slowmoTimer = 0;
    this.flash = 0;
    this.flashColor = "#ffffff";
    this.deathDelay = 0;
    this.score = 0;
    this.orbCount = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.elapsed = 0;
    this.zone = ZONES[0];
    this.zonesSeen = new Set();
    this.hintsShown = new Set();
    this.checkpoint = null;
    this.spawnDefs = [];
    this.killed = new Set();
    this.menuParticles = [];
    for (let i = 0; i < 55; i++) {
      this.menuParticles.push({ x: rand(0, VIEW_W), y: rand(0, VIEW_H), s: rand(0.5, 2), v: rand(2, 14), p: rand(0, TAU) });
    }
    this.onVictoryScreen = null;
    this.onGameOverScreen = null;
    this.fgRain = [];
    for (let i = 0; i < 55; i++) {
      this.fgRain.push({ x: rand(0, VIEW_W), y: rand(0, VIEW_H), len: rand(12, 30), speed: rand(900, 1500), a: rand(0.05, 0.18) });
    }
    this.debugGod = false;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || 1280;
    const h = this.canvas.clientHeight || 720;
    this.cssW = w;
    this.cssH = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.scale = Math.min(w / VIEW_W, h / VIEW_H);
    this.offsetX = (w - VIEW_W * this.scale) / 2;
    this.offsetY = (h - VIEW_H * this.scale) / 2;
  }

  // ------------------------------------------------------------- LIFECYCLE
  startNewRun() {
    this.world = new World();
    this.player = new Player(this.world.respawn.x, GROUND_Y - 62);
    this.enemies = [];
    this.spawnDefs = this.world.enemies.map((s, i) => ({ ...s, __id: `enemy-${i}` }));
    this.killed = new Set();
    for (const def of this.spawnDefs) {
      const enemy = createEnemy(def);
      enemy.id = def.__id;
      enemy.zone = def.zone;
      enemy.maxHealth *= [1, 1.12, 1.25, 1.35][def.zone] || 1;
      enemy.health = enemy.maxHealth;
      this.enemies.push(enemy);
    }
    this.projectiles = [];
    this.looseOrbs = [];
    this.boss = null;
    this.bossDefeated = false;
    this.bossIntroTimer = 0;
    this.hitstopTimer = 0;
    this.slowmoTimer = 0;
    this.flash = 0;
    this.deathDelay = 0;
    this.score = 0;
    this.orbCount = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.elapsed = 0;
    this.zone = ZONES[0];
    this.zonesSeen = new Set([0]);
    this.hintsShown = new Set();
    this.checkpoint = null;
    this.world.checkpoints.forEach(cp => { cp.active = false; });
    this.camera.x = 0;
    this.camera.shake = 0;
    this.particles.clear();
    this.mode = "playing";
    this.audio.init();
    this.audio.resumeMusic();
    this.audio.setIntensity(0.12);
    this.ui?.showScreen("game");
    this.ui?.resetHUD();
    this.ui?.setTouchVisible(true);
    this.ui?.showSector(ZONES[0]);
    this.ui?.hint("A / D  ·  MOVE      SPACE  ·  JUMP", 6200);
    this.hintsShown.add("start");
    this.snapCamera();
    this.updateHUD(true);
  }

  enterMenu() {
    this.mode = "menu";
    this.menuTime = 0;
    this.ui?.showScreen("menu");
    this.ui?.hideBoss();
    this.ui?.setTouchVisible(false);
    this.audio.setIntensity(0.05);
    this.input.releaseAll();
    this.camera.x = 340;
  }

  pause() {
    if (this.mode !== "playing") return;
    this.mode = "paused";
    this.input.releaseAll();
    this.ui?.showScreen("pause");
    this.ui?.setTouchVisible(false);
    this.ui?.updatePause(this);
    this.audio.setIntensity(0.02);
  }

  resume() {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    this.ui?.showScreen("game");
    this.ui?.setTouchVisible(true);
    this.audio.resumeMusic();
    this.audio.setIntensity(this.zone.id === 3 ? 0.9 : 0.2 + this.zone.id * 0.12);
  }

  retryCheckpoint() {
    if (!this.world || !this.player) return;
    const px = this.world.respawn.x;
    const py = this.world.respawn.y;
    this.player.respawn(px, py);
    this.player.health = this.player.maxHealth;
    this.deathDelay = 0;
    this.projectiles = [];
    this.looseOrbs = [];
    this.boss = null;
    this.bossDefeated = false;
    this.world.arena.active = false;
    this.world.gateOpen = false;
    this.hitstopTimer = 0;
    this.slowmoTimer = 0;
    this.mode = "playing";
    this.combo = 0;
    this.comboTimer = 0;
    this.ui?.hideBoss();
    // revive enemies belonging to the current sector
    const zoneId = this.zone.id;
    this.enemies = this.enemies.filter(e => !(e.dead && e.zone === zoneId));
    for (const def of this.spawnDefs) {
      if (def.zone !== zoneId) continue;
      this.killed.delete(def.__id);
      if (!this.enemies.some(e => e.id === def.__id)) {
        const e = createEnemy(def);
        e.id = def.__id;
        e.maxHealth *= [1, 1.12, 1.25, 1.35][def.zone] || 1;
        e.health = e.maxHealth;
        this.enemies.push(e);
      }
    }
    this.ui?.showScreen("game");
    this.ui?.setTouchVisible(true);
    this.ui?.resetHUD();
    this.ui?.toast("CHECKPOINT LINK RESTORED", 1800);
    this.snapCamera();
    this.audio.resumeMusic();
    this.audio.play("checkpoint");
    this.updateHUD(true);
  }

  // --------------------------------------------------------------- UPDATE
  update(dt) {
    this.clock += dt;
    const bgCam = this.mode === "menu" ? this.camera.x : this.camera.x;
    this.background.update(dt, bgCam);
    this.background.camera = bgCam;
    for (const p of this.fgRain) {
      p.y += p.speed * dt;
      p.x -= p.speed * 0.14 * dt;
      if (p.y > VIEW_H + 30) { p.y = -30; p.x = rand(0, VIEW_W + 200); }
      if (p.x < -30) p.x += VIEW_W + 60;
    }

    if (this.mode === "menu") {
      this.menuTime += dt;
      this.camera.x = 520 + Math.sin(this.menuTime * 0.035) * 520;
      this.audio.update(dt);
      for (const p of this.menuParticles) {
        p.y -= p.v * dt;
        p.x += Math.sin(this.menuTime * 0.5 + p.p) * 5 * dt;
        if (p.y < -10) { p.y = VIEW_H + 10; p.x = rand(0, VIEW_W); }
      }
      return;
    }
    if (this.mode !== "playing") {
      this.particles.update(dt * 0.15);
      this.updateShake(dt);
      this.audio.update(dt);
      return;
    }

    // hitstop freezes gameplay for a few frames while effects catch up
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.particles.update(dt * 0.25);
      this.updateShake(dt);
      this.audio.update(dt);
      this.ui?.updateHUD(this);
      return;
    }
    const sdt = this.slowmoTimer > 0 ? dt * 0.36 : dt;
    this.slowmoTimer = Math.max(0, this.slowmoTimer - dt);
    this.elapsed += sdt;

    const prevHealth = this.player.health;
    this.world.update(sdt);
    this.player.update(sdt, this.world, this.input, this);
    if (this.player.health < prevHealth - 0.01) this.onPlayerHurt();
    this.updateEnemies(sdt);
    this.updateBoss(sdt);
    this.updateProjectiles(sdt);
    this.handlePlayerAttack();
    this.handleHazards();
    this.updateLooseOrbs(sdt);
    this.handleCollectibles();
    this.handleCheckpoints();
    this.handleArena();
    this.handleZones();
    this.updateCombo(sdt);
    this.updateCamera(dt);
    this.particles.update(sdt);
    this.updateShake(dt);
    this.flash = Math.max(0, this.flash - dt * 3.6);
    this.bossIntroTimer = Math.max(0, this.bossIntroTimer - dt);
    this.updateHUD();
    this.updateHints();
    this.audio.update(dt);

    if (this.deathDelay > 0) {
      this.deathDelay -= dt;
      if (this.deathDelay <= 0) this.finishGameOver();
    }
  }

  updateEnemies(dt) {
    for (const e of this.enemies) {
      if (e.dead) { e.updateCommon(dt); continue; }
      if (Math.abs(e.cx - this.player.cx) > 1500) continue;
      e.update(dt, this.player, this.world, this, this.projectiles);
    }
    // prune corpses after fade
    if (this.enemies.length > 0 && this.enemies.some(e => e.dead && e.deathTimer > 1.2)) {
      this.enemies = this.enemies.filter(e => !(e.dead && e.deathTimer > 1.2));
    }
  }

  updateBoss(dt) {
    if (!this.boss) return;
    this.boss.update(dt, this.player, this.world, this, this.projectiles);
  }

  updateProjectiles(dt) {
    for (const b of this.projectiles) {
      b.update(dt, this.world, this);
      if (!b.dead && b.owner === "enemy") {
        const p = this.player;
        if (b.x + b.r > p.x && b.x - b.r < p.x + p.w && b.y + b.r > p.y && b.y - b.r < p.y + p.h) {
          if (p.takeDamage(b.damage, b.x, this, { knockback: 210, shake: 5 })) {
            b.dead = true;
            this.particles.spark(b.x, b.y, b.color, 10, 200);
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter(b => !b.dead);
  }

  handlePlayerAttack() {
    const p = this.player;
    if (!p.alive) return;
    const info = p.getAttackInfo();
    if (!info) return;
    let connected = false;
    for (const e of this.enemies) {
      if (e.dead || p.hitSet.has(e.id)) continue;
      if (rectsOverlap(info, e)) {
        p.hitSet.add(e.id);
        e.hurt(info.damage, info.knockX, info.knockY, this, { heavy: info.heavy });
        p.registerHit(info.kind);
        connected = true;
      }
    }
    if (this.boss && !this.boss.dead && !p.hitSet.has("boss")) {
      if (rectsOverlap(info, this.boss)) {
        p.hitSet.add("boss");
        this.boss.hurt(info.damage, info.knockX, info.knockY, this, { heavy: info.heavy });
        p.registerHit(info.kind);
        connected = true;
      }
    }
    for (const b of this.projectiles) {
      if (b.dead || b.owner !== "enemy") continue;
      if (b.x > info.x - b.r && b.x < info.x + info.w + b.r && b.y > info.y - b.r && b.y < info.y + info.h + b.r) {
        b.dead = true;
        p.registerHit("parry");
        this.particles.spark(b.x, b.y, "#bffcff", 10, 210);
        this.particles.ring(b.x, b.y, "#5df7ff", 22, 0.2, 2);
        this.audio.play("parry");
        this.combo++;
        this.comboTimer = 2.2;
        this.addScore(12);
        connected = true;
      }
    }
    if (connected) {
      this.combo++;
      this.comboTimer = 2.2;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.addScore(6 + (info.heavy ? 6 : 0));
    }
  }

  onEnemyKilled(enemy) {
    if (this.killed.has(enemy.id)) return;
    this.killed.add(enemy.id);
    this.kills++;
    const mult = this.multiplier;
    this.addScore(Math.round(enemy.score * mult));
    this.spawnDrops(enemy);
    this.audio.setIntensity(clamp(0.15 + this.kills * 0.03, 0, 0.8));
    if (!this.hintsShown.has("kill")) {
      this.hintsShown.add("kill");
      this.ui?.hint("SHIFT / K  ·  DASH — INVULNERABLE MID-DASH", 5400);
    }
  }

  spawnDrops(enemy) {
    const count = enemy.orbDrop ?? 2;
    for (let i = 0; i < count; i++) {
      this.looseOrbs.push({
        x: enemy.cx, y: enemy.cy,
        vx: rand(-150, 150), vy: rand(-330, -160),
        r: 9, collected: false, phase: rand(0, TAU), age: 0,
        delay: 0.25 + i * 0.05,
      });
    }
  }

  updateLooseOrbs(dt) {
    for (const o of this.looseOrbs) {
      o.age += dt;
      o.vy += 950 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.y > 596) {
        o.y = 596;
        o.vy *= -0.32;
        if (Math.abs(o.vy) < 45) o.vy = 0;
        o.vx *= 0.8;
      }
    }
    this.looseOrbs = this.looseOrbs.filter(o => o.age < 20 || o.collected);
  }

  handleCollectibles() {
    const p = this.player;
    for (const orb of this.world.orbs) {
      if (orb.collected) continue;
      const dx = orb.x - p.cx, dy = orb.y - p.cy;
      if (dx * dx + dy * dy < 34 * 34) {
        orb.collected = true;
        this.collectOrb(orb, 45, 14);
      }
    }
    for (const orb of this.looseOrbs) {
      if (orb.collected || orb.age < orb.delay) continue;
      const dx = orb.x - p.cx, dy = orb.y - p.cy;
      if (dx * dx + dy * dy < 34 * 34) {
        orb.collected = true;
        this.collectOrb(orb, 25, 10);
      }
    }
    this.looseOrbs = this.looseOrbs.filter(o => !o.collected);
  }

  collectOrb(orb, base, energy) {
    this.orbCount++;
    this.player.addEnergy(energy);
    this.addScore(Math.round(base * this.multiplier));
    this.audio.play("orb");
    this.particles.ring(orb.x, orb.y, "#5df7ff", 26, 0.28, 2);
    for (let i = 0; i < 8; i++) this.particles.add({
      x: orb.x, y: orb.y, vx: rand(-90, 90), vy: rand(-140, 20),
      life: rand(0.25, 0.5), size: rand(1.5, 3.5), color: "#bffcff", glow: 8, drag: 0.9,
    });
    this.particles.text(orb.x, orb.y - 18, `+${Math.round(base * this.multiplier)}`, "#bffcff", 11);
  }

  handleHazards() {
    const p = this.player;
    if (!p || !p.alive) return;
    for (const h of this.world.hazards) {
      if (!this.world.hazardActive(h)) continue;
      if (!rectsOverlap(h, p)) continue;
      const cx = h.x + h.w / 2;
      if (p.takeDamage(h.damage, cx, this, { knockback: 300, shake: 7 })) {
        this.particles.spark(p.cx, p.cy, "#ff6a80", 14, 230);
        this.particles.ring(cx, h.y + h.h / 2, "#ff3e62", 30, 0.25, 2);
      }
    }
  }

  handleCheckpoints() {
    const p = this.player;
    for (const cp of this.world.checkpoints) {
      if (cp.active) continue;
      if (Math.abs(p.cx - cp.x) < 58 && Math.abs(p.footY - cp.y) < 100) {
        this.world.activateCheckpoint(cp);
        this.checkpoint = cp;
        p.heal(38);
        p.energy = p.maxEnergy;
        p.invuln = Math.max(p.invuln, 0.8);
        this.audio.play("checkpoint");
        this.particles.ring(cp.x, cp.y - 40, "#5df7ff", 90, 0.7, 4);
        this.particles.spark(cp.x, cp.y - 40, "#bffcff", 22, 260);
        this.ui?.toast("CHECKPOINT LINKED  //  VITALS RESTORED", 2200);
        this.ui?.hint("CHECKPOINT SECURED — ENEMIES IN THIS SECTOR WILL RESET ON DEATH", 4200);
        this.addScore(100);
      }
    }
  }

  handleArena() {
    if (!this.world || this.world.arena.active) {
      if (this.world?.arena.active && this.player.x < this.world.arena.x0 + 40) {
        this.player.x = this.world.arena.x0 + 40;
        this.player.vx = Math.max(0, this.player.vx);
      }
      return;
    }
    if (this.player.cx > this.world.arena.trigger && !this.bossDefeated) {
      this.startBossFight();
    }
  }

  startBossFight() {
    const a = this.world.arena;
    a.active = true;
    this.world.gateOpen = false;
    this.boss = new Boss(11400, GROUND_Y - 158, this);
    this.bossIntroTimer = 2.4;
    this.snapCamera();
    this.projectiles = [];
    this.hitstopTimer = 0.12;
    this.flash = 0.35;
    this.flashColor = "#ff3e62";
    this.addShake(10);
    this.audio.play("bossRoar");
    this.audio.setIntensity(1);
    this.ui?.hideSector();
    this.ui?.showBoss(this.boss);
    this.ui?.toast("OVERLORD ZERO  //  SIGNAL UNSTABLE", 3000);
    this.ui?.hint("DASH THROUGH RED. STRIKE BOLTS TO PARRY.", 7000);
    this.particles.ring(this.boss.cx, 620, "#ff3e62", 260, 1.1, 6);
    this.particles.explosion(this.boss.cx, 560, "#ff3e62", 1.6);
  }

  onBossPhase(phase) {
    this.ui?.toast(`OVERLORD ZERO  //  PHASE ${ROMAN[phase - 1]}`, 2200);
    this.flash = 0.35;
    this.flashColor = phase === 3 ? "#ffc36b" : "#ff3e62";
    this.addShake(16);
  }

  onBossDefeated(boss) {
    this.bossDefeated = true;
    this.addScore(5000);
    this.ui?.toast("OVERLORD ZERO  //  TERMINATED", 3200);
    this.ui?.setBossPhase(3);
    this.audio.setIntensity(0.2);
    this.audio.play("victory");
    this.flash = 0.8;
    this.flashColor = "#ffffff";
    this.particles.explosion(boss.cx, boss.cy, "#ffc36b", 2.4);
  }

  onVictory() {
    if (this.mode !== "playing") return;
    this.mode = "victory";
    this.ui?.showVictory(this);
    this.ui?.setTouchVisible(false);
    this.ui?.hideBoss();
    this.audio.play("victory");
    this.audio.setIntensity(0.08);
    this.onVictoryScreen?.(this);
  }

  onPlayerDeath() {
    if (this.deathDelay > 0) return;
    this.deathDelay = 2.0;
    this.slowmoTimer = 0.8;
    this.addShake(14);
    this.flash = 0.5;
    this.flashColor = "#ff3e62";
    this.ui?.hint("", 0);
    this.particles.explosion(this.player.cx, this.player.cy, "#ff3e62", 1.4);
    this.audio.setIntensity(0.03);
  }

  finishGameOver() {
    if (this.mode !== "playing") return;
    this.mode = "gameover";
    this.ui?.showGameOver(this);
    this.ui?.setTouchVisible(false);
    this.ui?.hideBoss();
    this.onGameOverScreen?.(this);
  }

  onPlayerHurt() {
    this.combo = 0;
    this.comboTimer = 0;
    this.player.comboTimer = 0;
  }

  playerFell() {
    if (!this.player.alive) return;
    const dmg = this.debugGod ? 0 : 22;
    if (dmg > 0) this.player.takeDamage(dmg, this.player.cx, this, { ignoreInvuln: true, knockback: 0, shake: 7, invuln: 1.5 });
    if (!this.player.alive) return;
    this.player.x = this.world.respawn.x;
    this.player.y = this.world.respawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invuln = Math.max(this.player.invuln, 1.4);
    this.particles.ring(this.player.cx, this.player.cy, "#ff3e62", 70, 0.5, 4);
    this.particles.spark(this.player.cx, this.player.cy, "#ff5a7a", 16, 260);
    this.ui?.toast("VOID RECOVERY  //  SIGNAL RESTORED", 1600);
    this.snapCamera();
    this.addShake(8);
  }

  handleZones() {
    const z = this.world.getZone(this.player.cx);
    if (z.id !== this.zone.id) {
      this.zone = z;
      if (!this.zonesSeen.has(z.id)) {
        this.zonesSeen.add(z.id);
        this.ui?.showSector(z);
        this.audio.play("checkpoint");
        if (z.id === 1) this.ui?.hint("CHAIN KILLS TO RAISE THE SCORE MULTIPLIER", 5000);
        if (z.id === 2) this.ui?.hint("ELITE UNITS AHEAD — USE AIR STRIKES", 5000);
        this.audio.setIntensity(clamp(0.18 + z.id * 0.16, 0, 0.8));
      }
    }
    if (this.player.cx > 700 && !this.hintsShown.has("attack")) {
      this.hintsShown.add("attack");
      this.ui?.hint("J / CLICK  ·  STRIKE      SPACE ×2  ·  DOUBLE JUMP", 6400);
    }
    if (this.player.cx > 3280 && !this.hintsShown.has("dash")) {
      this.hintsShown.add("dash");
      this.ui?.hint("SHIFT / K  ·  DASH THROUGH DANGER", 5000);
    }
  }

  updateHints() {
    // reserved for contextual prompts triggered by position
  }

  updateCombo(dt) {
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }
  }

  get multiplier() {
    if (this.combo <= 1) return 1;
    return 1 + Math.min(2.5, (this.combo - 1) * 0.12);
  }

  addScore(v) {
    this.score += Math.max(0, Math.round(v));
  }

  addShake(v) {
    this.camera.shake = Math.min(24, this.camera.shake + v);
  }

  hitstopFor(seconds) {
    this.hitstopTimer = Math.max(this.hitstopTimer, seconds);
  }

  hitstop(seconds) { this.hitstopFor(seconds); }

  slowmo(scale, duration) {
    this.slowmoTimer = Math.max(this.slowmoTimer, duration);
  }

  flashDamage() {
    this.ui?.flashDamage();
    this.flash = Math.max(this.flash, 0.16);
    this.flashColor = "#ff3e62";
  }

  updateShake(dt) {
    this.camera.shake = Math.max(0, this.camera.shake - dt * 34);
    const s = this.camera.shake;
    this.camera.shakeX = s > 0.1 ? rand(-s, s) : 0;
    this.camera.shakeY = s > 0.1 ? rand(-s * 0.7, s * 0.7) : 0;
  }

  cameraTarget() {
    if (!this.player || !this.world) return 0;
    const max = this.world.width - VIEW_W;
    let target;
    if (this.world.arena.active && this.boss && !this.boss.dead) {
      // keep both duelists in frame during the boss fight
      target = (this.player.cx + this.boss.cx) * 0.5 - VIEW_W * 0.5;
      target = clamp(target, this.world.arena.x0 - 30, this.world.arena.x1 - VIEW_W + 30);
    } else {
      target = this.player.cx - VIEW_W * 0.43 + this.player.facing * 42;
    }
    return clamp(target, 0, max);
  }

  updateCamera(dt) {
    if (!this.player) return;
    const target = this.cameraTarget();
    this.camera.x = lerp(this.camera.x, target, 1 - Math.exp(-6.5 * dt));
    this.camera.y = 0;
  }

  snapCamera() {
    if (!this.player || !this.world) return;
    this.camera.x = this.cameraTarget();
    this.camera.shake = 0;
  }

  teleport(x, y) {
    if (!this.player) return;
    this.player.x = x;
    if (y !== undefined) this.player.y = y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.snapCamera();
  }

  updateHUD(force = false) {
    this.ui?.updateHUD(this, force);
  }

  // --------------------------------------------------------------- RENDER
  draw() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#020106";
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();

    if (this.mode === "menu") {
      this.drawMenu(ctx);
      ctx.restore();
      return;
    }

    const camX = this.camera.x + this.camera.shakeX;
    const camY = this.camera.y + this.camera.shakeY;
    this.background.draw(ctx, this.camera.x);
    ctx.save();
    ctx.translate(-camX, -camY);

    this.drawSceneryBack(ctx);
    this.drawSceneryFront(ctx);
    this.drawWorld(ctx);
    this.drawEntities(ctx);
    this.particles.draw(ctx);

    ctx.restore();

    // foreground rain
    ctx.save();
    ctx.lineCap = "round";
    for (const d of this.fgRain) {
      ctx.globalAlpha = d.a;
      ctx.strokeStyle = "#c6e8ff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.16, d.y + d.len);
      ctx.stroke();
    }
    ctx.restore();

    // bottom haze (kept light so the wet street stays readable)
    const haze = ctx.createLinearGradient(0, 596, 0, 720);
    haze.addColorStop(0, "rgba(4,3,12,0)");
    haze.addColorStop(1, "rgba(4,3,12,0.3)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 590, VIEW_W, 130);

    // speed lines during dash
    if (this.player && this.player.dashTime > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 9; i++) {
        const y = 180 + i * 46 + rand(-10, 10);
        ctx.globalAlpha = rand(0.03, 0.11);
        ctx.strokeStyle = "#5df7ff";
        ctx.lineWidth = rand(0.6, 2);
        ctx.beginPath();
        ctx.moveTo(rand(0, 400), y);
        ctx.lineTo(rand(900, 1280), y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(0.75, this.flash * 0.5);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.restore();
    }

    // cinematic letterbox during boss intro
    if (this.bossIntroTimer > 0) {
      const t = Math.min(1, (2.4 - this.bossIntroTimer) * 3);
      const h = 58 * Math.min(1, this.bossIntroTimer < 0.6 ? this.bossIntroTimer / 0.6 : t);
      ctx.fillStyle = "#020106";
      ctx.fillRect(0, 0, VIEW_W, h);
      ctx.fillRect(0, VIEW_H - h, VIEW_W, h);
      if (this.bossIntroTimer > 0.35) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = '900 30px "DejaVu Sans", sans-serif';
        ctx.letterSpacing = "8px";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#ff3e62";
        ctx.shadowBlur = 24;
        ctx.globalAlpha = clamp(this.bossIntroTimer / 2, 0, 1);
        ctx.fillText("OVERLORD  ZERO", VIEW_W / 2, 112);
        ctx.font = '400 10px "DejaVu Sans Mono", monospace';
        ctx.fillStyle = "#ff8aa6";
        ctx.fillText("SIGNAL ANOMALY // PHASE I", VIEW_W / 2, 136);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  drawMenu(ctx) {
    this.background.draw(ctx, this.camera.x, true);
    // distant rain shimmer
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.menuParticles) {
      ctx.globalAlpha = 0.15 + Math.abs(Math.sin(this.menuTime + p.p)) * 0.25;
      ctx.fillStyle = p.x % 2 > 1 ? "#5df7ff" : "#ff3fce";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // foreground rooftop
    ctx.save();
    const groundGrad = ctx.createLinearGradient(0, 610, 0, 720);
    groundGrad.addColorStop(0, "#0a0a17");
    groundGrad.addColorStop(1, "#030208");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 632, VIEW_W, 88);
    ctx.fillStyle = "#0d0d1c";
    ctx.beginPath();
    ctx.moveTo(0, 632);
    for (let x = 0; x <= VIEW_W; x += 160) {
      ctx.lineTo(x, 632 - Math.sin(x * 0.013 + 1) * 8);
    }
    ctx.lineTo(VIEW_W, 680);
    ctx.lineTo(0, 680);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(93,247,255,0.55)";
    ctx.shadowColor = "#5df7ff";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 632);
    for (let x = 0; x <= VIEW_W; x += 160) ctx.lineTo(x, 632 - Math.sin(x * 0.013 + 1) * 8);
    ctx.stroke();
    // neon reflections
    ctx.globalCompositeOperation = "lighter";
    const refl = ctx.createLinearGradient(0, 638, 0, 720);
    refl.addColorStop(0, "rgba(255,63,206,0.10)");
    refl.addColorStop(1, "rgba(93,247,255,0)");
    ctx.fillStyle = refl;
    ctx.fillRect(0, 638, VIEW_W, 82);
    ctx.restore();

    // silhouette cables
    ctx.save();
    ctx.strokeStyle = "rgba(5,4,14,0.9)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 160 + i * 70);
      ctx.bezierCurveTo(300, 220 + i * 70, 980, 150 + i * 70, VIEW_W, 210 + i * 70);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSceneryBack(ctx) {
    const cam = this.camera.x;
    const left = cam - 100, right = cam + VIEW_W + 100;
    // sagging cables with lanterns
    ctx.save();
    for (let base = 250; base < this.world.width; base += 760) {
      if (base > right + 760 || base < left - 760) continue;
      const p1 = 90 + (base % 3) * 20;
      ctx.strokeStyle = "rgba(10,8,22,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(base, p1);
      ctx.quadraticCurveTo(base + 380, p1 + 120, base + 760, p1 + 10);
      ctx.stroke();
      for (let k = 1; k < 5; k++) {
        const t = k / 5;
        const lx = base + t * 760;
        const ly = p1 + Math.sin(t * Math.PI) * 60;
        ctx.fillStyle = k % 2 ? "#ff3fce" : "#5df7ff";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(this.clock * 2 + k);
        ctx.beginPath(); ctx.arc(lx, ly, 2.2, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(8,7,18,0.8)";
        ctx.fillRect(lx - 1, ly - 22, 2, 22);
      }
    }
    ctx.restore();

    // floating holograms behind the route
    const holo = [
      { x: 1180, y: 245, text: "SHADOW", color: "#ff3fce", w: 90, h: 150 },
      { x: 3720, y: 230, text: "GHOST", color: "#5df7ff", w: 100, h: 130 },
      { x: 6480, y: 260, text: "RONIN", color: "#8a5cff", w: 92, h: 145 },
      { x: 9340, y: 205, text: "ZERO", color: "#ff3e62", w: 100, h: 120 },
    ];
    for (const s of holo) {
      if (s.x > right + 200 || s.x + s.w < left - 200) continue;
      const flicker = Math.sin(this.clock * 7 + s.x) > 0.94 ? 0.35 : 0.8;
      ctx.save();
      ctx.translate(s.x, s.y + Math.sin(this.clock * 1.4) * 5);
      ctx.globalAlpha = 0.16 * flicker;
      ctx.fillStyle = s.color;
      ctx.fillRect(0, 0, s.w, s.h);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#05040e";
      ctx.fillRect(4, 4, s.w - 8, s.h - 8);
      ctx.globalAlpha = 0.4 * flicker;
      ctx.strokeStyle = s.color;
      ctx.strokeRect(0, 0, s.w, s.h);
      ctx.globalAlpha = 0.6 * flicker;
      ctx.fillStyle = s.color;
      ctx.font = '700 20px "DejaVu Sans Mono", monospace';
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      const chars = s.text.split("");
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], 14 + (i % 2) * 16, 32 + i * 22);
      }
      ctx.restore();
    }
  }

  drawSceneryFront(ctx) {
    const cam = this.camera.x;
    const right = cam + VIEW_W + 100;
    // boss arena monolith
    if (right > this.world.arena.x0 - 200) {
      const x = 11620;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#07050e";
      ctx.fillRect(x - 120, 120, 240, 500);
      ctx.strokeStyle = "rgba(255,62,98,0.16)";
      ctx.strokeRect(x - 120, 120, 240, 500);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(255,62,98,${0.04 + 0.02 * Math.sin(this.clock + i)})`;
        ctx.fillRect(x - 90 + i * 45, 180, 2, 380);
      }
      ctx.restore();
    }
    // torii gate at sector 3
    if (right > 7300 && cam < 8100) {
      const x = 7660;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#080610";
      ctx.fillRect(x - 150, 340, 22, 280);
      ctx.fillRect(x + 128, 340, 22, 280);
      ctx.fillRect(x - 180, 320, 360, 22);
      ctx.fillRect(x - 155, 355, 310, 12);
      ctx.strokeStyle = "rgba(138,92,255,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 180, 320, 360, 22);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(138,92,255,0.32)";
      ctx.fillRect(x - 150, 342, 2, 278);
      ctx.fillRect(x + 148, 342, 2, 278);
      ctx.font = '700 26px "DejaVu Sans Mono", monospace';
      ctx.fillStyle = "rgba(255,63,206,0.5)";
      ctx.shadowColor = "#ff3fce";
      ctx.shadowBlur = 14;
      ctx.fillText("R O N I N", x - 76, 302);
      ctx.restore();
    }
  }

  drawWorld(ctx) {
    const cam = this.camera.x;
    const left = cam - 120, right = cam + VIEW_W + 120;
    // arena gate
    if (right > this.world.arena.x0 - 100) {
      drawArenaGate(ctx, this.world.arena.x0, this.world.time, this.world.arena.active);
    }
    for (const p of this.world.platforms) {
      if (p.x + p.w < left || p.x > right) continue;
      drawPlatform(ctx, p, this.world.time, this.background.paletteFor(this.player.cx));
    }
    for (const h of this.world.hazards) {
      if (h.x + h.w < left || h.x > right) continue;
      drawHazard(ctx, h, this.world.hazardActive(h), this.world.time);
    }
    for (const cp of this.world.checkpoints) {
      if (cp.x < left || cp.x > right) continue;
      drawCheckpoint(ctx, cp, this.world.time);
    }
    for (const orb of this.world.orbs) {
      if (orb.collected || orb.x < left || orb.x > right) continue;
      drawOrb(ctx, orb, this.world.time);
    }
    for (const orb of this.looseOrbs) {
      if (orb.collected || orb.x < left || orb.x > right) continue;
      drawOrb(ctx, orb, this.world.time + 2);
    }
  }

  drawEntities(ctx) {
    const cam = this.camera.x;
    const left = cam - 200, right = cam + VIEW_W + 200;
    for (const e of this.enemies) {
      if (e.dead && e.alpha <= 0) continue;
      if (e.cx < left || e.cx > right) continue;
      e.draw(ctx, this.world.time);
      if (this.debugGod) {
        // optional overlays for automated verification only
      }
    }
    if (this.boss) {
      this.boss.draw(ctx, this, this.world.time);
    }
    for (const b of this.projectiles) {
      if (b.x > left && b.x < right) b.draw(ctx, this.world.time);
    }
    if (this.player) this.player.draw(ctx, this, this.world.time);
  }

  // ------------------------------------------------------------- UI GLUE
  showScreen(name) { this.ui?.showScreen(name); }

  get stats() {
    return {
      score: this.score,
      orbs: this.orbCount,
      duration: this.elapsed,
      maxCombo: this.maxCombo,
      kills: this.kills,
      checkpoint: this.checkpoint,
      health: this.player?.health ?? 0,
      energy: this.player?.energy ?? 0,
      zone: this.zone,
      boss: this.boss ? { health: this.boss.health, max: this.boss.maxHealth, phase: this.boss.phase, state: this.boss.state } : null,
    };
  }

  screenPosition(worldX, worldY) {
    return {
      x: this.offsetX + (worldX - this.camera.x) * this.scale,
      y: this.offsetY + (worldY - this.camera.y) * this.scale,
    };
  }
}
