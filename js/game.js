// SHADOW NINJA — game orchestration, waves, combat resolution, rendering

import {
  TAU, GROUND_Y, WORLD_W, PLATFORMS, clamp, lerp, damp, rand, pick, sign,
  mulberry32, roundRect,
} from './utils.js';
import { FX } from './fx.js';
import { Scenery } from './scenery.js';
import { Player, Enemy, Projectile, Pickup } from './entities.js';
import { Boss } from './boss.js';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const WAVE_NAMES = {
  1: 'THE HUNT BEGINS',
  2: 'BLOOD ON STONE',
  3: 'ARROWS IN THE DARK',
  4: 'THE ONI\'S DOOR',
  5: 'NO WAY BACK',
};

const COMPOSITIONS = {
  1: ['ronin', 'ronin', 'ronin'],
  2: ['ronin', 'ronin', 'archer', 'ronin'],
  3: ['ronin', 'archer', 'ronin', 'brute', 'archer'],
  4: ['ronin', 'ronin', 'archer', 'brute', 'archer', 'ronin', 'brute'],
  5: ['ronin', 'archer', 'brute', 'ronin', 'archer', 'brute', 'ronin', 'archer', 'ronin'],
};

export class Game {
  constructor(canvas, input, sound) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.input = input;
    this.sound = sound;
    this.fx = new FX();
    this.scenery = new Scenery();
    this.ui = null;

    this.state = 'menu';
    this.viewW = 1280;
    this.viewH = 720;
    this.extraY = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.dpr = 1;

    this.camX = 0;
    this.camY = 0;
    this.camTargetX = 0;
    this.globalTime = 0;
    this.timeScale = 1;
    this.slowmo = 0;
    this.slowmoScale = 1;
    this.hitStopTimer = 0;
    this.danger = 0;

    this.best = 0;
    try {
      this.best = Number(localStorage.getItem('shadow-ninja-best')) || 0;
    } catch {}

    this.puddles = [];
    const rng = mulberry32(5521);
    for (let i = 0; i < 24; i++) {
      this.puddles.push({
        x: rng() * WORLD_W,
        w: 40 + rng() * 130,
        h: 4 + rng() * 8,
        color: pick(['255,80,100', '80,230,220', '255,170,90']),
        alpha: 0.05 + rng() * 0.1,
        phase: rng() * TAU,
      });
    }
    this.embers = [];

    this.player = new Player(this);
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.boss = null;
    this.resetRun();
    this.resize();
  }

  resetRun() {
    this.player.reset();
    this.player.x = 420;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.boss = null;
    this.fx.reset();
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.wave = 0;
    this.wavePhase = 'none';
    this.waveQueue = [];
    this.spawnTimer = 0;
    this.clearTimer = 0;
    this.bossIntro = 0;
    this.bossDeathTimer = 0;
    this.deathDelay = 0;
    this.kills = 0;
    this.runTime = 0;
    this.hintTimer = 10;
    this.slowmo = 0;
    this.hitStopTimer = 0;
    this.danger = 0;
    this.newBest = false;
    this.camX = clamp(this.player.x - this.viewW * 0.5, 0, Math.max(0, WORLD_W - this.viewW));
    this.camY = -this.extraY;
  }

  // ---------------------------------------------------------------- lifecycle
  startGame() {
    this.resetRun();
    this.state = 'playing';
    this.sound.setMode('battle');
    this.sound.duck(false);
    this.ui.showPlaying();
    this.ui.showHints(this.input.coarse);
    this.beginWave(1);
    this.fx.screenFlash(0.2, '180,230,255');
    this.camX = clamp(this.player.x - this.viewW * 0.45, 0, Math.max(0, WORLD_W - this.viewW));
    this.hintTimer = this.input.coarse ? 0 : 11;
  }

  restart() {
    this.sound.sfx('click');
    this.startGame();
  }

  quitToMenu() {
    this.state = 'menu';
    this.resetRun();
    this.fx.reset();
    this.sound.setMode('menu');
    this.sound.duck(false);
    this.ui.showMenu();
    this.ui.updateBest(this.best);
  }

  pause(auto = false) {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.showPause(auto);
    this.sound.duck(true);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.hideScreens();
    this.sound.duck(false);
    this.sound.sfx('click');
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  // ---------------------------------------------------------------- helpers
  shake(v) { this.fx.addTrauma(v); }
  hitStop(seconds = 0.05) { this.hitStopTimer = Math.max(this.hitStopTimer, seconds); }
  slowMotion(duration, scale) {
    this.slowmo = Math.max(this.slowmo, duration);
    this.slowmoScale = scale;
  }

  get multiplier() {
    return 1 + Math.min(this.combo, 50) * 0.08;
  }

  addScore(base) {
    const v = Math.round(base * this.multiplier);
    this.score += v;
    return v;
  }

  addCombo() {
    this.combo++;
    this.comboTimer = 2.6;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
      try { localStorage.setItem('shadow-ninja-best', String(this.best)); } catch {}
    }
    if (this.ui) this.ui.updateBest(this.best);
  }

  // ---------------------------------------------------------------- waves
  beginWave(n) {
    this.wave = n;
    this.wavePhase = 'spawn';
    this.waveQueue = [...COMPOSITIONS[n]];
    this.spawnTimer = 0.6;
    this.clearTimer = 0;
    this.ui.banner(`WAVE ${ROMAN[n]}`, WAVE_NAMES[n] || 'THE HUNT CONTINUES', 'SURVIVE', 'wave');
    this.sound.sfx('wave');
    this.sound.setMode('battle');
    this.hintTimer = Math.max(this.hintTimer, 8);
  }

  spawnEnemy(type, x = null, y = GROUND_Y) {
    let sx = x;
    if (sx == null) {
      const left = this.camX - 90;
      const right = this.camX + this.viewW + 90;
      const playerSide = this.player.x < this.camX + this.viewW * 0.5 ? 1 : -1;
      sx = playerSide > 0 ? right : left;
      if (sx < 50) sx = Math.max(60, this.player.x + 380);
      if (sx > WORLD_W - 50) sx = Math.min(WORLD_W - 60, this.player.x - 380);
      sx = clamp(sx, 60, WORLD_W - 60);
      if (Math.abs(sx - this.player.x) < 260) {
        sx = clamp(this.player.x + (playerSide > 0 ? 400 : -400), 60, WORLD_W - 60);
      }
    }
    const enemy = new Enemy(type, sx, y, this, this.wave || 1);
    this.enemies.push(enemy);
    this.fx.smoke(sx, y - 16, '80,24,44', 8, 26);
    this.fx.ring(sx, y, 'rgba(255,60,80,0.55)', 44, 2.5, 0.45, 6);
    this.fx.ember(sx, y - 20, '#ff5a6e', 8, 180);
    return enemy;
  }

  spawnBossMinions(boss, count) {
    for (let i = 0; i < count; i++) {
      if (this.enemies.filter((e) => !e.dead && e.type !== 'boss').length >= 5) break;
      const x = clamp(boss.x + (i === 0 ? -160 : 160), 80, WORLD_W - 80);
      const e = this.spawnEnemy(i === 0 ? 'ronin' : 'archer', x);
      e.state = 'spawn';
      e.timer = 0.55;
    }
  }

  startBossFight() {
    this.wave = 6;
    this.wavePhase = 'boss';
    this.waveQueue = [];
    const bx = clamp(this.player.x + 560, 900, WORLD_W - 320);
    this.boss = new Boss(this, bx, 6);
    this.enemies.push(this.boss);
    this.bossIntro = 2.8;
    this.player.heal(30);
    this.ui.banner('KAGEMASA', 'THE ONI SHOGUN', 'THE FINAL DUEL', 'boss');
    this.sound.setMode('boss');
    this.sound.sfx('roar');
    this.fx.screenFlash(0.6, '255,40,50');
    this.fx.ring(bx, GROUND_Y - 60, 'rgba(255,50,60,0.9)', 300, 8, 0.9, 20);
    this.fx.ember(bx, GROUND_Y - 100, '#ff5a4a', 40, 420, 1.8);
    this.shake(0.7);
    this.slowMotion(0.8, 0.55);
  }

  checkWaves(dt) {
    if (this.boss) return;
    if (this.wavePhase === 'spawn') {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.waveQueue.length) {
        const type = this.waveQueue.shift();
        this.spawnEnemy(type);
        this.spawnTimer = 0.5 + Math.random() * 0.35;
      }
      if (!this.waveQueue.length) this.wavePhase = 'active';
    } else if (this.wavePhase === 'active') {
      if (!this.enemies.some((e) => !e.dead)) {
        this.wavePhase = 'cleared';
        this.clearTimer = 2.7;
        const bonus = 450 * this.wave;
        this.addScore(bonus);
        this.player.heal(16);
        this.ui.banner(`WAVE ${ROMAN[this.wave]}`, 'CLEARED', `+${bonus} · VITALITY RESTORED`, 'clear');
        this.sound.sfx('wave');
        this.fx.text(this.player.x, this.player.y - 100, 'WAVE CLEAR', '#ffd98a', 28);
      }
    } else if (this.wavePhase === 'cleared') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        if (this.wave >= 5) this.startBossFight();
        else this.beginWave(this.wave + 1);
      }
    }
  }

  // ---------------------------------------------------------------- combat
  spawnEnemyProjectile(opts) {
    const p = new Projectile({
      ...opts,
      destructible: opts.destructible ?? opts.owner !== 'boss',
    });
    this.projectiles.push(p);
    return p;
  }

  resolvePlayerAttack(player, info) {
    const attack = player.attack;
    if (!attack) return;
    for (const e of this.enemies) {
      if (e.dead || attack.hit.has(e.id)) continue;
      const ex = e.x;
      const ey = e.y - e.h * 0.5;
      if (Math.abs(ex - info.x) > info.r + e.w * 0.45) continue;
      if (Math.abs(ey - info.y) > info.r * 0.95 + e.h * 0.12) continue;
      attack.hit.add(e.id);
      attack.didHit = true;
      const dir = sign(e.x - player.x || player.facing);
      const dmg = info.damage;
      const hitX = clamp(info.x, ex - e.w * 0.4, ex + e.w * 0.4);
      const hitY = ey;
      const before = e.dead;
      e.takeDamage(dmg, dir, this, { knock: info.knock });
      this.addCombo();
      this.addScore(dmg * 5);
      player.addFocus(5);
      this.fx.text(hitX, hitY - 26, String(dmg), attack.index === 2 ? '#ffd066' : '#fff1d6', attack.index === 2 ? 24 : 18);
      this.fx.spark(hitX, hitY, attack.index === 2 ? '#ffb35c' : '#bff8ff', attack.index === 2 ? 12 : 7, 300);
      this.fx.shards(hitX, hitY, '#ff6b6b', 3, 200);
      this.hitStop(attack.index === 2 ? 0.07 : 0.038);
      this.shake(attack.index === 2 ? 0.26 : 0.12);
      this.sound.sfx('hit', attack.index === 2 ? 1.2 : 0.9);
      this.sound.sfx('combo', this.combo);
      if (!before && e.dead) {
        this.fx.screenFlash(0.08, '255,220,190');
      }
      if (player.attack && player.attack.air && !player.onGround) {
        player.vy = -480;
        this.fx.ring(player.x, player.y - 30, 'rgba(255,170,90,0.8)', 50, 2, 0.3);
        this.sound.sfx('doubleJump');
      }
    }

    // sword parry — cut enemy projectiles from the air
    for (const pr of this.projectiles) {
      if (pr.dead || !pr.destructible) continue;
      if (Math.abs(pr.x - info.x) < info.r + pr.r + 6 && Math.abs(pr.y - info.y) < info.r + pr.r + 6) {
        pr.dead = true;
        this.addCombo();
        this.addScore(40);
        this.player.addFocus(6);
        this.fx.ring(pr.x, pr.y, 'rgba(160,255,255,0.9)', 34, 2, 0.28);
        this.fx.spark(pr.x, pr.y, '#c8ffff', 9, 260);
        this.fx.text(pr.x, pr.y - 18, 'PARRY', '#9ef7ff', 16, { italic: true });
        this.sound.sfx('parry');
        this.shake(0.16);
        this.hitStop(0.045);
      }
    }
  }

  resolveDashAttack(player) {
    for (const e of this.enemies) {
      if (e.dead || player.dashHits.has(e.id)) continue;
      if (Math.abs(e.x - player.x) < 40 + e.w * 0.4 && Math.abs((e.y - e.h * 0.5) - (player.y - 34)) < e.h * 0.6 + 26) {
        player.dashHits.add(e.id);
        e.takeDamage(10, sign(e.x - player.x || player.facing), this, { knock: 200 });
        this.addCombo();
        this.addScore(50);
        player.addFocus(2);
        this.fx.spark(e.x, e.y - e.h * 0.5, '#8ff7ff', 8, 260);
        this.fx.text(e.x, e.y - e.h * 0.5 - 20, '10', '#9ef7ff', 15);
        this.shake(0.1);
        this.hitStop(0.025);
      }
    }
    for (const pr of this.projectiles) {
      if (pr.dead) continue;
      if (Math.abs(pr.x - player.x) < 46 && Math.abs(pr.y - (player.y - 32)) < 60) {
        pr.dead = true;
        this.player.addFocus(3);
        this.fx.spark(pr.x, pr.y, '#9ef7ff', 5, 200);
        this.sound.sfx('parry');
      }
    }
  }

  triggerBurst(player) {
    this.slowMotion(0.45, 0.32);
    this.hitStop(0.075);
    this.shake(0.8);
    this.fx.screenFlash(0.55, '180,245,255');
    this.fx.ring(player.x, player.y - 36, 'rgba(170,250,255,0.95)', 320, 9, 0.7, 14);
    this.fx.ring(player.x, player.y - 36, 'rgba(255,220,160,0.8)', 230, 5, 0.55, 10);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      this.fx.slash(player.x, player.y - 36, a, 160, i % 2 ? '#ffd98a' : '#9ef7ff', 0.45, 12, 2.4);
    }
    this.fx.ember(player.x, player.y - 36, '#aef7ff', 34, 480, 1.2);
    this.fx.ember(player.x, player.y - 36, '#ffcf6b', 20, 380, 1.1);
    this.fx.text(player.x, player.y - 120, 'SHADOW BURST', '#e9ffff', 30, { vy: -34, life: 1.3, italic: true });
    this.sound.sfx('burst');
    this.sound.sfx('slashHeavy');
    this.input.rumble(0.8);

    let hits = 0;
    for (const e of [...this.enemies]) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - player.x, (e.y - e.h * 0.5) - (player.y - 34));
      if (d < 330) {
        const dmg = e.type === 'boss' ? 85 : 58;
        e.takeDamage(dmg, sign(e.x - player.x || player.facing), this, { knock: 460 });
        this.fx.text(e.x, e.y - e.h * 0.7, String(dmg), '#9ef7ff', 27);
        hits++;
      }
    }
    for (const pr of this.projectiles) {
      if (!pr.dead && Math.hypot(pr.x - player.x, pr.y - (player.y - 36)) < 340) {
        pr.dead = true;
        this.fx.spark(pr.x, pr.y, '#bff8ff', 3, 200);
      }
    }
    if (hits) this.addScore(200 * hits);
  }

  onPlayerHit(amount, dir) {
    this.combo = 0;
    this.comboTimer = 0;
    this.shake(0.6);
    this.hitStop(0.045);
    this.fx.screenFlash(0.2, '255,40,60');
    this.fx.spark(this.player.x, this.player.y - 34, '#ff4d5e', 14, 340);
    this.fx.text(this.player.x, this.player.y - 80, `-${amount}`, '#ff6a75', 22);
    this.sound.sfx('hurt');
    this.input.rumble(0.7);
    if (this.ui) this.ui.damageFlash();
  }

  onPlayerDeath() {
    this.state = 'dying';
    this.deathDelay = 0;
    this.slowMotion(1.4, 0.25);
    this.shake(0.85);
    this.fx.screenFlash(0.4, '255,30,40');
    this.fx.ring(this.player.x, this.player.y - 30, 'rgba(255,60,70,0.9)', 200, 6, 0.7);
    this.fx.ember(this.player.x, this.player.y - 30, '#ff5c6e', 26, 320, 1.5);
    this.sound.sfx('death');
    this.sound.duck(true);
    this.input.rumble(1);
  }

  onEnemyKilled(enemy) {
    this.kills++;
    const gained = this.addScore(enemy.scoreValue);
    this.player.addFocus(12);
    this.fx.text(enemy.x, enemy.y - enemy.h - 22, `+${gained}`, '#ffd98a', 16, { life: 1.1 });
    this.addCombo();
    if (enemy.type === 'ronin' && Math.random() < (this.player.health < 65 ? 0.22 : 0.1)) {
      this.pickups.push(new Pickup('health', enemy.x, enemy.y - 40));
    } else if (Math.random() < 0.08 && this.player.focus < 70) {
      this.pickups.push(new Pickup('focus', enemy.x, enemy.y - 40));
    }
  }

  onBossKilled(boss) {
    this.kills++;
    const gained = this.addScore(boss.scoreValue);
    this.fx.text(boss.x, boss.y - 140, `+${gained}`, '#ffd98a', 30, { life: 2, vy: -28 });
    this.state = 'bossDeath';
    this.bossDeathTimer = 0;
    this.slowMotion(3.2, 0.22);
    this.hitStop(0.12);
    this.shake(1);
    this.fx.screenFlash(0.9, '255,190,150');
    this.fx.ring(boss.x, boss.y - 80, 'rgba(255,220,170,0.95)', 420, 10, 1.2, 16);
    this.fx.ember(boss.x, boss.y - 100, '#ffce8a', 60, 520, 2.2);
    this.sound.sfx('roar');
    this.sound.sfx('death');
    this.projectiles = [];
    for (const e of this.enemies) {
      if (e !== boss && !e.dead) e.die(this, sign(e.x - boss.x || 1));
    }
    this.saveBest();
    this.ui.banner('THE SHOGUN', 'HAS FALLEN', 'THE NIGHT IS YOURS', 'boss');
  }

  onBossPhase(n) {
    this.ui.banner('THE SHOGUN', n === 2 ? 'PHASE II' : 'PHASE III', n === 2 ? 'HIS BLOOD BURNS' : 'NO MERCY REMAINS', 'phase');
    this.sound.sfx('roar');
    this.slowMotion(0.55, 0.5);
    this.shake(0.65);
    this.fx.screenFlash(0.25, '255,70,70');
  }

  // ---------------------------------------------------------------- update
  update(dt) {
    const raw = dt;
    this.globalTime += raw;

    if (this.state === 'paused' || this.state === 'gameover' || this.state === 'victory') {
      return;
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= raw;
      this.updateCamera(raw * 0.35);
      this.updateAmbient(raw * 0.35);
      return;
    }

    let scale = 1;
    if (this.slowmo > 0) {
      this.slowmo -= raw;
      scale = this.slowmoScale;
      if (this.slowmo <= 0) scale = 1;
    }
    this.timeScale = scale;
    const sdt = raw * scale;

    if (this.state === 'playing') {
      this.runTime += raw;
      this.player.update(sdt, this.input);
      if (this.state !== 'playing') return;

      for (const e of this.enemies) e.update(sdt, this);
      if (this.state !== 'playing') return;

      for (const p of this.projectiles) p.update(sdt, this);
      if (this.state !== 'playing') return;
      for (const p of this.pickups) p.update(sdt, this);

      this.enemies = this.enemies.filter((e) => !(e.dead && e.deathTimer <= 0));
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      this.pickups = this.pickups.filter((p) => !p.dead);

      this.checkWaves(sdt);

      if (this.comboTimer > 0) {
        this.comboTimer -= sdt;
        if (this.comboTimer <= 0) this.combo = 0;
      }
      if (this.hintTimer > 0) {
        this.hintTimer -= raw;
        if (this.hintTimer <= 0) this.ui.hideHints();
      }
      if (this.boss && !this.boss.dead) {
        this.danger = damp(this.danger, 0.7 + (this.boss.phase - 1) * 0.15, 2, raw);
      } else {
        this.danger = damp(this.danger, 0, 2, raw);
      }
      if (this.bossIntro > 0) this.bossIntro -= raw;
    } else if (this.state === 'dying') {
      this.deathDelay += raw;
      this.player.update(sdt, { moveX: () => 0, pressed: () => false, down: () => false });
      this.enemies.forEach((e) => { if (!e.dead) e.anim += sdt; });
      this.danger = damp(this.danger, 0.8, 2, raw);
      if (this.deathDelay > 1.9) this.finishGameOver();
    } else if (this.state === 'bossDeath') {
      this.bossDeathTimer += raw;
      this.player.update(sdt, { moveX: () => 0, pressed: () => false, down: () => false });
      if (this.boss) this.boss.update(sdt, this);
      this.enemies.forEach((e) => { if (!e.dead) e.anim += sdt; });
      this.danger = damp(this.danger, 0.9, 2, raw);
      if (this.bossDeathTimer > 3.3) this.finishVictory();
    } else if (this.state === 'menu') {
      this.updateMenu(raw);
      this.fx.update(raw);
      this.spawnAmbient(raw);
      return;
    }

    this.fx.update(sdt);
    this.updateAmbient(sdt);
    this.updateCamera(raw);
    this.spawnAmbient(sdt);
  }

  finishGameOver() {
    this.state = 'gameover';
    this.saveBest();
    this.sound.setMode('menu');
    this.sound.duck(true);
    this.ui.showGameOver(this.stats());
  }

  finishVictory() {
    this.state = 'victory';
    this.saveBest();
    this.sound.setMode('menu');
    this.sound.duck(false);
    this.sound.sfx('victory');
    this.ui.showVictory(this.stats());
  }

  stats() {
    return {
      score: this.score,
      wave: Math.min(this.wave, 6),
      kills: this.kills,
      maxCombo: this.maxCombo,
      time: this.runTime,
      best: this.best,
      newBest: this.newBest,
      boss: this.wave >= 6,
    };
  }

  updateMenu(dt) {
    this.timeScale = 1;
    this.player.animTime += dt;
    this.player.facing = 1;
    const drift = Math.sin(this.globalTime * 0.06) * 260;
    this.camTargetX = clamp(430 + drift, 0, Math.max(0, WORLD_W - this.viewW));
    this.camX = damp(this.camX, this.camTargetX, 1.4, dt);
    this.camY = -this.extraY;
    this.danger = damp(this.danger, 0.06, 1, dt);
  }

  updateAmbient(dt) {
    this.scenery.update(dt, this.camX);
    if (Math.random() < dt * 4) {
      const x = this.camX + rand(0, this.viewW);
      this.embers.push({ x, y: GROUND_Y - rand(0, 120), life: rand(0.8, 2.2), max: 2.2, vy: rand(-40, -10), phase: rand(0, TAU) });
    }
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life -= dt;
      e.y += e.vy * dt;
      e.x += Math.sin(this.globalTime + e.phase) * 6 * dt;
      if (e.life <= 0) this.embers.splice(i, 1);
    }
  }

  spawnAmbient(dt) {
    if (this.state === 'menu') {
      if (Math.random() < dt * 3) {
        this.fx.spark(this.camX + rand(0, this.viewW), GROUND_Y - rand(20, 260), '#ffb070', 1, 40, { grav: -30 });
      }
    }
  }

  updateCamera(dt) {
    const p = this.player;
    let target = p.x + clamp(p.vx * 0.22, -120, 120) + p.facing * 30 - this.viewW * 0.5;
    if (this.boss && !this.boss.dead) {
      const weight = this.bossIntro > 0 ? 0.55 : 0.28;
      target = lerp(target, this.boss.x - this.viewW * 0.5, weight);
    }
    target = clamp(target, 0, Math.max(0, WORLD_W - this.viewW));
    const rate = this.state === 'menu' ? 1.4 : 5.2;
    this.camX = damp(this.camX, target, rate, dt);
    let yShift = 0;
    if (this.state !== 'menu') yShift = clamp((p.y - 560) * 0.16, -46, 0);
    this.camY = damp(this.camY, -this.extraY + yShift, 5, dt);
  }

  // ---------------------------------------------------------------- render
  resize() {
    const cssW = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const cssH = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    const aspect = cssW / cssH;
    let viewH = 720;
    let viewW = 720 * aspect;
    if (viewW < 1200) {
      viewW = 1200;
      viewH = 1200 / aspect;
    }
    this.viewW = viewW;
    this.viewH = viewH;
    this.extraY = Math.max(0, viewH - 720);
    this.scaleX = this.canvas.width / viewW;
    this.scaleY = this.canvas.height / viewH;
    this.scenery.resize(viewW, viewH, this.extraY);
    this.camX = clamp(this.camX, 0, Math.max(0, WORLD_W - viewW));
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const danger = clamp(this.danger, 0, 1);
    this.scenery.draw(ctx, this.camX, danger);

    const shake = this.fx.shakeOffset(this.globalTime);
    ctx.save();
    // screen shake rotation around center
    ctx.translate(this.viewW / 2, this.viewH / 2);
    ctx.rotate(shake.rot);
    ctx.translate(-this.viewW / 2, -this.viewH / 2);
    ctx.translate(-this.camX + shake.x, -this.camY + shake.y);

    this.drawGround(ctx);
    this.drawPlatforms(ctx);
    if (this.boss && !this.boss.dead) this.drawSeals(ctx);

    for (const p of this.pickups) p.draw(ctx);
    for (const e of this.enemies) {
      if (e.type !== 'boss') e.draw(ctx);
    }
    if (this.boss) this.boss.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
    this.fx.drawGhosts(ctx);
    this.player.draw(ctx);
    this.fx.draw(ctx);
    this.drawAmbientEmbers(ctx);
    ctx.restore();

    this.scenery.drawForeground(ctx, this.camX, danger);

    if (this.fx.flash > 0.001) {
      ctx.fillStyle = `rgba(${this.fx.flashColor},${this.fx.flash * 0.65})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    // subtle edge darkening in-canvas (overlay also exists in CSS)
    const vg = ctx.createRadialGradient(
      this.viewW * 0.5, this.viewH * 0.46, Math.min(this.viewW, this.viewH) * 0.3,
      this.viewW * 0.5, this.viewH * 0.5, Math.max(this.viewW, this.viewH) * 0.72,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  drawAmbientEmbers(ctx) {
    if (!this.embers.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      const a = clamp(e.life / e.max, 0, 1);
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = '#ffb36b';
      ctx.beginPath(); ctx.arc(e.x, e.y, 1.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = a * 0.15;
      ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  drawGround(ctx) {
    ctx.save();
    const g = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 190);
    g.addColorStop(0, '#201d2b');
    g.addColorStop(0.14, '#16141f');
    g.addColorStop(0.5, '#0c0b14');
    g.addColorStop(1, '#04040a');
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND_Y, WORLD_W, 220);

    // wet rim
    const rim = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 30);
    rim.addColorStop(0, 'rgba(185,240,250,0.5)');
    rim.addColorStop(0.18, 'rgba(130,215,235,0.16)');
    rim.addColorStop(1, 'rgba(120,200,220,0)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, GROUND_Y, WORLD_W, 30);

    // stone tiles, two courses
    for (let row = 0; row < 2; row++) {
      const ty = GROUND_Y + 6 + row * 22;
      for (let x = -20; x < WORLD_W; x += 118) {
        const alt = (((x / 118) | 0) + row) % 3;
        ctx.fillStyle = alt === 0
          ? 'rgba(150,185,210,0.11)'
          : alt === 1
            ? 'rgba(220,235,245,0.05)'
            : 'rgba(255,120,150,0.045)';
        ctx.fillRect(x + 2 + row * 20, ty, 112, 19);
        ctx.strokeStyle = 'rgba(4,4,10,0.62)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2 + row * 20, ty, 112, 19);
        // wet highlight on top edge
        ctx.fillStyle = 'rgba(190,235,245,0.16)';
        ctx.fillRect(x + 5 + row * 20, ty + 1, 106, 1.4);
      }
    }
    // long top seams
    ctx.strokeStyle = 'rgba(100,140,170,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 4.5);
    ctx.lineTo(WORLD_W, GROUND_Y + 4.5);
    ctx.stroke();

    // neon signs bleeding across the wet stone
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const neonCols = ['80,240,225', '255,64,96', '255,168,74', '150,110,255', '90,200,255'];
    for (let i = 0; i < 14; i++) {
      const x = (i * 233 + 140) % WORLD_W;
      const col = neonCols[i % neonCols.length];
      const a = 0.05 + (i % 3) * 0.02;
      const lg = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 96);
      lg.addColorStop(0, `rgba(${col},${a})`);
      lg.addColorStop(0.5, `rgba(${col},${a * 0.35})`);
      lg.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 6, 64 + (i % 4) * 22, 52, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x = (i * 379 + 120) % WORLD_W;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 5);
      ctx.lineTo(x + 22, GROUND_Y + 22);
      ctx.lineTo(x + 14, GROUND_Y + 40);
      ctx.stroke();
    }

    // puddle reflections + ripples
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.puddles.length; i++) {
      const p = this.puddles[i];
      const pulse = 0.7 + Math.sin(this.globalTime * 0.8 + p.phase) * 0.3;
      const grad = ctx.createRadialGradient(p.x, GROUND_Y + 8, 0, p.x, GROUND_Y + 8, p.w * 0.6);
      grad.addColorStop(0, `rgba(${p.color},${(p.alpha + 0.1) * pulse})`);
      grad.addColorStop(0.6, `rgba(${p.color},${p.alpha * 0.55 * pulse})`);
      grad.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, GROUND_Y + 8, p.w * 0.6, p.h, 0, 0, TAU);
      ctx.fill();
      // ripple
      const rp = (this.globalTime * 0.4 + p.phase) % 1;
      ctx.globalAlpha = (1 - rp) * 0.22;
      ctx.strokeStyle = `rgba(${p.color},0.8)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p.x, GROUND_Y + 8, p.w * 0.6 * rp, Math.max(1, p.h * rp), 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // warm torii light pools
    for (const lx of [900, 2360]) {
      const lg = ctx.createLinearGradient(lx, GROUND_Y, lx, GROUND_Y + 70);
      lg.addColorStop(0, 'rgba(255,80,80,0.10)');
      lg.addColorStop(1, 'rgba(255,80,80,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(lx, GROUND_Y + 12, 260, 60, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // foreground grass tufts
    ctx.strokeStyle = 'rgba(36,62,54,0.7)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 46; i++) {
      const x = (i * 257 + 63) % WORLD_W;
      const h = 5 + ((i * 13) % 11);
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 2);
      ctx.quadraticCurveTo(x + 2, GROUND_Y - h * 0.6, x + 5, GROUND_Y - h);
      ctx.stroke();
    }

    // low rolling mist
    const mist = ctx.createLinearGradient(0, GROUND_Y - 34, 0, GROUND_Y + 56);
    mist.addColorStop(0, 'rgba(120,120,160,0)');
    mist.addColorStop(0.45, 'rgba(120,120,160,0.075)');
    mist.addColorStop(1, 'rgba(120,120,160,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, GROUND_Y - 34, WORLD_W, 90);
    ctx.restore();
  }

  drawPlatforms(ctx) {
    for (const p of PLATFORMS) {
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + 26);
      g.addColorStop(0, '#17121d');
      g.addColorStop(0.45, '#0b0912');
      g.addColorStop(1, '#06050a');
      ctx.fillStyle = g;
      roundRect(ctx, p.x, p.y, p.w, 20, 3);
      ctx.fill();
      // top sheen
      ctx.fillStyle = 'rgba(160,210,230,0.10)';
      ctx.fillRect(p.x + 3, p.y + 1, p.w - 6, 2);
      ctx.strokeStyle = 'rgba(100,240,230,0.28)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x + 4, p.y + 0.5);
      ctx.lineTo(p.x + p.w - 4, p.y + 0.5);
      ctx.stroke();
      // underglow
      const ug = ctx.createLinearGradient(0, p.y + 18, 0, p.y + 46);
      ug.addColorStop(0, 'rgba(90,220,220,0.08)');
      ug.addColorStop(1, 'rgba(90,220,220,0)');
      ctx.fillStyle = ug;
      ctx.fillRect(p.x + 8, p.y + 18, p.w - 16, 28);
      // support struts
      ctx.strokeStyle = 'rgba(10,10,16,0.95)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p.x + 18, p.y + 19);
      ctx.lineTo(p.x + 34, p.y + 70);
      ctx.moveTo(p.x + p.w - 18, p.y + 19);
      ctx.lineTo(p.x + p.w - 34, p.y + 70);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,80,100,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + 8, p.y + 3);
      ctx.lineTo(p.x + p.w - 8, p.y + 3);
      ctx.stroke();
      // hanging seal
      if (p.x % 2 === 0 || p.w > 240) {
        ctx.strokeStyle = 'rgba(180,50,70,0.35)';
        ctx.lineWidth = 1;
        const sx = p.x + p.w * 0.7;
        ctx.beginPath();
        ctx.moveTo(sx, p.y + 20);
        ctx.lineTo(sx, p.y + 45);
        ctx.stroke();
        ctx.fillStyle = 'rgba(230,80,80,0.3)';
        ctx.fillRect(sx - 4, p.y + 45, 8, 14);
      }
    }
  }

  drawSeals(ctx) {
    const p = 0.5 + Math.sin(this.globalTime * 2) * 0.2;
    for (const x of [120, WORLD_W - 120]) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(x, GROUND_Y - 340, x, GROUND_Y);
      g.addColorStop(0, 'rgba(255,50,70,0)');
      g.addColorStop(0.5, `rgba(255,50,70,${0.08 * p})`);
      g.addColorStop(1, 'rgba(255,80,90,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 18, GROUND_Y - 340, 36, 340);
      ctx.strokeStyle = `rgba(255,90,110,${0.25 * p})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 330);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- HUD sync
  syncUI() {
    if (this.ui) this.ui.update(this);
  }
}
