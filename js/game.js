// Combat engine, rounds, AI and effects
import { ATTACKS, FIGHTERS, WORLD, makeFighter } from './data.js';
import { samplePose } from './rig.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const sign = (v) => (v < 0 ? -1 : 1);

const ACTIONS = ['punch', 'kick', 'special', 'jump'];
const START_ENERGY = 32;

function held(inp, action) {
  return !!(inp && inp.held && inp.held[action]);
}
function buffered(inp, action) {
  return !!(inp && inp.buffer && inp.buffer[action] > 0);
}
function consume(inp, action) {
  if (inp && inp.buffer) inp.buffer[action] = 0;
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function hurtbox(f) {
  const s = f.def.scale;
  const h = f.crouching ? 238 : 312;
  const w = 92 * s;
  return { x: f.x - w / 2, y: f.y - h * s, w, h: h * s };
}

class CPUControls {
  constructor() {
    this.held = { left: false, right: false, jump: false, down: false, block: false };
    this.buffer = { punch: 0, kick: 0, special: 0, jump: 0 };
  }
  update(dt) {
    for (const k of ACTIONS) if (this.buffer[k] > 0) this.buffer[k] = Math.max(0, this.buffer[k] - dt);
  }
  clearHeld() {
    for (const k of Object.keys(this.held)) this.held[k] = false;
  }
  press(action) {
    this.buffer[action] = 0.2;
    if (action === 'jump') this.held.jump = true;
  }
}

class FightAI {
  constructor(game) {
    this.game = game;
    this.input = new CPUControls();
    this.timer = 0.4;
    this.specialCooldown = 2;
    this.blockTimer = 0;
    this.reaction = 0.115;
  }

  update(dt) {
    const game = this.game;
    const inp = this.input;
    inp.update(dt);
    inp.clearHeld();
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    if (game.phase !== 'active') {
      this.timer = Math.min(this.timer, 0.2);
      return;
    }
    const me = game.cpu;
    const opp = game.player;
    if (!me || !opp || me.state === 'ko' || opp.state === 'ko') return;

    const dist = Math.abs(opp.x - me.x);
    const toward = opp.x >= me.x ? 1 : -1;
    this.timer -= dt;
    this.blockTimer = Math.max(0, this.blockTimer - dt);

    // react to incoming projectiles
    let threat = null;
    for (const p of game.projectiles) {
      if (p.owner === me) continue;
      if (Math.abs(p.y - (me.y - 180)) < 170 && Math.abs(p.x - me.x) < 430) {
        const movingToward = Math.sign(p.vx) === Math.sign(me.x - p.x);
        if (movingToward) threat = p;
      }
    }
    if (threat && Math.random() < 0.52) {
      inp.held.block = true;
      this.blockTimer = 0.28;
      return;
    }

    // if still blocking from a decision, keep the guard up briefly
    if (this.blockTimer > 0) {
      inp.held.block = true;
      return;
    }

    if (this.timer > 0) return;
    this.timer = this.reaction + rand(0, 0.09);

    const attacking = opp.state === 'attack' && opp.attack;
    const oppThreat = attacking && opp.attack.elapsed < opp.attack.startup + opp.attack.active + 0.04;
    if (oppThreat && dist < 280 && Math.random() < 0.48) {
      inp.held.block = true;
      this.blockTimer = 0.26 + rand(0, 0.15);
      return;
    }

    if (dist > 240) {
      inp.held[toward > 0 ? 'right' : 'left'] = true;
      if (Math.random() < 0.03) inp.press('jump');
      if (me.energy >= 50 && dist > 340 && dist < 1150 && this.specialCooldown <= 0 && Math.random() < 0.32) {
        inp.press('special');
        this.specialCooldown = 2.4;
      } else if (dist < 330 && Math.random() < 0.42) {
        inp.press('kick');
      }
      return;
    }

    if (dist < 132) {
      if (Math.random() < 0.19) {
        inp.held[toward > 0 ? 'left' : 'right'] = true;
      }
      if (me.energy >= 50 && this.specialCooldown <= 0 && Math.random() < 0.16) {
        inp.press('special');
        this.specialCooldown = 2.6;
      } else if (Math.random() < 0.62) {
        inp.press(Math.random() < 0.66 ? 'punch' : 'kick');
      } else if (Math.random() < 0.17) {
        inp.held.block = true;
        this.blockTimer = 0.2;
      }
      if (Math.random() < 0.035) inp.press('jump');
      return;
    }

    // mid range: poke, step in, or defend
    if (dist > 195) inp.held[toward > 0 ? 'right' : 'left'] = true;
    else if (Math.random() < 0.22) inp.held[toward > 0 ? 'left' : 'right'] = true;
    if (me.energy >= 50 && dist > 250 && this.specialCooldown <= 0 && Math.random() < 0.19) {
      inp.press('special');
      this.specialCooldown = 3;
    } else if (Math.random() < 0.45) {
      inp.press(Math.random() < 0.5 ? 'punch' : 'kick');
    }
    if (Math.random() < 0.045) inp.press('jump');
  }
}

export class Game {
  constructor({ playerKey, cpuKey, arena, callbacks }) {
    this.callbacks = callbacks || {};
    this.arena = arena | 0;
    this.player = makeFighter(playerKey, 540, 1);
    this.cpu = makeFighter(cpuKey, 1060, -1);
    this.round = 1;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.time = 0;
    this.timer = 99;
    this.hitstop = 0;
    this.shake = 0;
    this.flash = 0;
    this.particles = [];
    this.effects = [];
    this.projectiles = [];
    this.ai = new FightAI(this);
    this.playerInput = null;
    this.announcedFight = false;
    this.matchOver = false;
    this.lastRoundWinner = null;
    this.winBannerShown = false;
    this.startRound(true);
  }

  setPlayerInput(input) {
    this.playerInput = input;
  }

  sound(name, opts) {
    if (this.callbacks.sound) this.callbacks.sound(name, opts);
  }

  announce(text, sub, opts = {}) {
    if (this.callbacks.announce) this.callbacks.announce(text, sub, opts);
  }

  startRound(first = false) {
    const p = this.player;
    const c = this.cpu;
    for (const f of [p, c]) {
      f.x = f === p ? 540 : 1060;
      f.y = WORLD.ground;
      f.vx = 0;
      f.vy = 0;
      f.grounded = true;
      f.hp = f.maxHp;
      f.energy = START_ENERGY;
      f.state = 'idle';
      f.anim = 'idle';
      f.animTime = rand(0, 1.4);
      f.attack = null;
      f.hitstun = 0;
      f.blockstun = 0;
      f.blocking = false;
      f.crouching = false;
      f.combo = 0;
      f.comboTimer = 0;
      f.flash = 0;
      f.koTime = 0;
      f.hitElapsed = 0;
      f.hitDuration = 0;
      f.pose = samplePose('idle', f.animTime, f);
    }
    p.facing = 1;
    c.facing = -1;
    this.timer = 99;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.hitstop = 0;
    this.shake = 0;
    this.flash = 0;
    this.projectiles.length = 0;
    this.effects.length = 0;
    this.particles.length = 0;
    this.announcedFight = false;
    this.winBannerShown = false;
    const roundName = this.round === 3 || (p.roundWins === 1 && c.roundWins === 1) ? 'FINAL ROUND' : `ROUND ${this.round}`;
    this.announce(roundName, this.round === 1 ? 'THE BLADES AWAKEN' : 'STEEL REMEMBERS', { duration: 1.5, mode: 'round' });
    this.sound('round');
    if (first) this.sound('intro');
  }

  update(dt) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 55);
    this.flash = Math.max(0, this.flash - dt * 3.8);

    if (this.phase === 'matchEnd') {
      this.updateVisualOnly(dt);
      this.updateParticles(dt * 0.35);
      this.updateEffects(dt * 0.35);
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.updateParticles(dt * 0.18);
      this.updateEffects(dt * 0.18);
      return;
    }

    this.phaseTime += dt;
    if (this.phase === 'intro') {
      this.updateVisualOnly(dt);
      if (!this.announcedFight && this.phaseTime > 1.22) {
        this.announcedFight = true;
        this.phase = 'active';
        this.announce('FIGHT!', 'DRAW YOUR BLADE', { duration: 0.9, mode: 'fight' });
        this.sound('fight');
      }
      return;
    }

    if (this.phase === 'ko' || this.phase === 'timeup') {
      this.updateVisualOnly(dt, true);
      this.updateParticles(dt);
      this.updateEffects(dt);
      if (this.phaseTime > 2.35) this.finishRound(this.pendingWinner, this.pendingDraw);
      return;
    }

    if (this.phase === 'roundEnd') {
      this.updateVisualOnly(dt);
      this.updateParticles(dt);
      this.updateEffects(dt);
      if (this.phaseTime > 1.35) {
        if (this.matchOver) {
          this.phase = 'matchEnd';
          this.phaseTime = 0;
          if (this.callbacks.matchEnd) this.callbacks.matchEnd(this.lastRoundWinner ? this.lastRoundWinner.key : null, {
            playerWins: this.player.roundWins,
            cpuWins: this.cpu.roundWins,
          });
        } else {
          this.round += 1;
          this.startRound(false);
        }
      }
      return;
    }

    if (this.phase !== 'active') return;

    // timer
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.timeUp();
      return;
    }

    this.ai.update(dt);
    const pInput = this.playerInput || { held: {}, buffer: {} };
    this.updateFighter(this.player, this.cpu, pInput, dt);
    this.updateFighter(this.cpu, this.player, this.ai.input, dt);
    this.resolveMelee(this.player, this.cpu);
    this.resolveMelee(this.cpu, this.player);
    this.updateProjectiles(dt);
    this.separate();
    this.updateParticles(dt);
    this.updateEffects(dt);

    if (this.player.comboTimer > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) this.player.combo = 0;
    }
    if (this.cpu.comboTimer > 0) {
      this.cpu.comboTimer -= dt;
      if (this.cpu.comboTimer <= 0) this.cpu.combo = 0;
    }

    if (this.player.hp <= 0 || this.cpu.hp <= 0) return;
  }

  updateVisualOnly(dt, ko = false) {
    for (const f of [this.player, this.cpu]) {
      f.animTime += dt;
      f.flash = Math.max(0, f.flash - dt * 4);
      if (ko || f.state === 'ko') {
        f.koTime += dt;
      }
      if (f.state === 'ko') {
        f.vy += (f.grounded ? 0 : WORLD.gravity) * 0.4 * dt;
        if (!f.grounded) {
          f.y += f.vy * dt;
          if (f.y >= WORLD.ground) {
            f.y = WORLD.ground;
            f.vy = 0;
            f.grounded = true;
          }
        }
        f.x += f.vx * dt;
        f.vx *= Math.pow(0.004, dt);
        f.x = clamp(f.x, WORLD.left, WORLD.right);
        f.pose = samplePose('ko', clamp(f.koTime * 1.65, 0, 1), f);
      } else if (f.state === 'victory') {
        f.pose = samplePose('victory', f.animTime, f);
      } else if (f.state === 'hit') {
        f.hitElapsed += dt;
        if (!f.grounded) {
          f.vy += WORLD.gravity * dt;
          f.y += f.vy * dt;
          if (f.y >= WORLD.ground) { f.y = WORLD.ground; f.vy = 0; f.grounded = true; }
        }
        f.x += f.vx * dt;
        f.vx *= Math.pow(0.01, dt);
        f.pose = samplePose('hit', clamp(f.hitElapsed / Math.max(0.001, f.hitDuration), 0, 1), f);
      } else {
        f.pose = samplePose(f.anim || 'idle', f.animTime, f);
      }
      f.x = clamp(f.x, WORLD.left, WORLD.right);
    }
  }

  updateFighter(f, opp, inp, dt) {
    f.animTime += dt;
    f.flash = Math.max(0, f.flash - dt * 4.2);
    if (f.state === 'ko') {
      f.koTime += dt;
      f.pose = samplePose('ko', clamp(f.koTime * 1.65, 0, 1), f);
      return;
    }

    const canFace = f.state !== 'attack' && f.state !== 'hit' && f.blockstun <= 0;
    if (canFace) f.facing = opp.x >= f.x ? 1 : -1;

    if (f.hitstun > 0) {
      f.hitstun -= dt;
      f.hitElapsed += dt;
      f.blocking = false;
      f.attack = null;
      this.applyPhysics(f, dt);
      f.pose = samplePose('hit', clamp(f.hitElapsed / Math.max(0.001, f.hitDuration), 0, 1), f);
      if (f.hitstun <= 0) {
        f.state = f.grounded ? 'idle' : 'jump';
        f.anim = f.grounded ? 'idle' : 'jumpDown';
        f.animTime = 0;
      }
      return;
    }

    if (f.blockstun > 0) {
      f.blockstun -= dt;
      f.state = 'block';
      f.blocking = true;
      f.vx *= Math.pow(0.002, dt);
      this.applyPhysics(f, dt);
      f.pose = samplePose('block', 1, f);
      return;
    }

    if (f.state === 'attack' && f.attack) {
      const a = f.attack;
      a.elapsed += dt;
      if (!a.slashSpawned && a.elapsed >= a.startup) {
        a.slashSpawned = true;
        this.spawnSlash(f, a);
      }
      if (!a.spawned && a.base.spawnProjectile !== undefined && a.elapsed >= a.base.spawnProjectile) {
        a.spawned = true;
        this.spawnProjectile(f, a);
      }
      // special cancel window
      if (a.contact && a.elapsed >= a.startup * 0.72) {
        for (const action of ['special', 'kick', 'punch']) {
          if (!a.base.chain.includes(action)) continue;
          if (!buffered(inp, action)) continue;
          if (this.startAttack(f, action)) {
            consume(inp, action);
            return;
          }
        }
      }
      this.applyPhysics(f, dt);
      if (a.elapsed >= a.total) {
        f.attack = null;
        if (f.grounded) {
          f.state = 'idle';
          f.anim = 'idle';
          f.animTime = 0;
        } else {
          f.state = 'jump';
          f.anim = 'jumpDown';
        }
      } else {
        f.pose = samplePose(a.key, clamp(a.elapsed / a.total, 0, 1), f);
      }
      return;
    }

    // actions that can start from the ground
    if (f.grounded) {
      f.crouching = false;
      const blocking = held(inp, 'block');
      f.blocking = blocking;
      if (blocking) {
        f.state = 'block';
        f.vx *= Math.pow(0.001, dt);
        f.energy = Math.min(f.maxEnergy, f.energy + dt * 1.8);
        f.pose = samplePose('block', 1, f);
        return;
      }
      if (buffered(inp, 'punch') && this.startAttack(f, 'punch')) { consume(inp, 'punch'); return; }
      if (buffered(inp, 'kick') && this.startAttack(f, 'kick')) { consume(inp, 'kick'); return; }
      if (buffered(inp, 'special') && this.startAttack(f, 'special')) { consume(inp, 'special'); return; }
      if (buffered(inp, 'jump')) {
        consume(inp, 'jump');
        f.vy = -f.def.jump;
        f.grounded = false;
        f.state = 'jump';
        f.anim = 'jumpUp';
        f.animTime = 0;
        f.vx = (held(inp, 'left') ? -1 : held(inp, 'right') ? 1 : 0) * f.def.speed * 0.78;
        this.spawnDust(f.x, WORLD.ground, 6, f.def.colors.accent);
        this.sound('jump');
      }
      if (held(inp, 'down') && f.grounded) {
        f.crouching = true;
        f.state = 'crouch';
        f.vx *= Math.pow(0.0001, dt);
        f.pose = samplePose('crouch', clamp((f.animTime = Math.min(f.animTime + dt, 0.16)) / 0.16, 0, 1), f);
        return;
      }
      // walking
      let move = 0;
      if (held(inp, 'left')) move -= 1;
      if (held(inp, 'right')) move += 1;
      if (move !== 0) {
        const forward = move === f.facing;
        f.vx = move * (forward ? f.def.speed : f.def.backSpeed);
        f.state = forward ? 'walk' : 'back';
        f.anim = forward ? 'walk' : 'backwalk';
        f.walkDust += dt;
        if (f.walkDust > 0.16 && f.grounded) {
          f.walkDust = 0;
          this.spawnDust(f.x - f.facing * 24, WORLD.ground, 1, f.def.colors.accent, 0.42);
        }
      } else {
        f.vx *= Math.pow(0.0001, dt);
        f.state = f.state === 'crouch' ? 'crouch' : 'idle';
        if (f.state === 'idle') f.anim = 'idle';
      }
      this.applyPhysics(f, dt);
      if (f.state === 'idle' || f.state === 'walk' || f.state === 'back') {
        f.pose = samplePose(f.anim, f.animTime, f);
      } else if (f.state === 'crouch') {
        f.pose = samplePose('crouch', 1, f);
      }
      return;
    }

    // airborne
    f.state = 'jump';
    f.crouching = false;
    f.blocking = false;
    if (held(inp, 'left')) f.vx = Math.max(-f.def.speed * 0.6, f.vx - f.def.speed * 1.5 * dt);
    else if (held(inp, 'right')) f.vx = Math.min(f.def.speed * 0.6, f.vx + f.def.speed * 1.5 * dt);
    if (buffered(inp, 'punch') && this.startAttack(f, 'punch')) { consume(inp, 'punch'); this.applyPhysics(f, dt); return; }
    if (buffered(inp, 'kick') && this.startAttack(f, 'kick')) { consume(inp, 'kick'); this.applyPhysics(f, dt); return; }
    this.applyPhysics(f, dt);
    f.pose = samplePose(f.vy < 40 ? 'jumpUp' : 'jumpDown', clamp(0.3 + Math.abs(f.vy) / 1200, 0, 1), f);
  }

  applyPhysics(f, dt) {
    f.x += f.vx * dt;
    f.x = clamp(f.x, WORLD.left, WORLD.right);
    if (!f.grounded) {
      f.vy += WORLD.gravity * dt;
      f.y += f.vy * dt;
      if (f.y >= WORLD.ground) {
        f.y = WORLD.ground;
        f.vy = 0;
        f.grounded = true;
        this.spawnDust(f.x, WORLD.ground, 5, f.def.colors.accent, 0.8);
        if (f.state === 'jump' || f.state === 'attack') {
          f.attack = null;
          f.state = 'idle';
          f.anim = 'idle';
          f.animTime = 0;
        }
      }
    } else {
      f.y = WORLD.ground;
    }
    if (f.state !== 'walk' && f.state !== 'back') f.vx *= Math.pow(0.02, dt);
  }

  startAttack(f, key) {
    const base = ATTACKS[key];
    if (!base) return false;
    if (f.state === 'attack' && f.attack) {
      const old = f.attack;
      if (!old.contact || old.elapsed < old.startup * 0.7) return false;
      if (!old.base.chain.includes(key)) return false;
    } else if (f.state === 'hit' || f.state === 'ko' || f.blockstun > 0 || f.state === 'victory') {
      return false;
    }
    if (base.cost && f.energy < base.cost) {
      this.sound('deny');
      return false;
    }
    if (base.cost) f.energy -= base.cost;

    const speedMod = f.def.speedMod;
    const startup = base.startup * speedMod;
    const active = base.active;
    const recovery = base.recovery * speedMod;
    const total = startup + active + recovery;
    const scale = f.def.range;
    f.attack = {
      key,
      base,
      elapsed: 0,
      startup,
      active,
      recovery,
      total,
      damage: base.damage * f.def.power,
      hitstun: base.hitstun,
      blockstun: base.blockstun,
      knockback: base.knockback,
      hitbox: {
        x: base.hitbox.x * scale,
        y: base.hitbox.y,
        w: base.hitbox.w * scale,
        h: base.hitbox.h,
      },
      hitDone: false,
      contact: false,
      slashSpawned: false,
      spawned: false,
      facing: f.facing,
    };
    f.state = 'attack';
    f.anim = key;
    f.animTime = 0;
    f.vx *= 0.2;
    f.crouching = false;
    f.pose = samplePose(key, 0, f);
    this.sound('whoosh', { heavy: key === 'kick', special: key === 'special' });
    if (key === 'special') {
      this.flash = Math.max(this.flash, 0.09);
      this.shake = Math.max(this.shake, 4);
      this.sound('charge');
      this.addEffect({
        type: 'charge', x: f.x, y: f.y - 175, size: 120, life: 0.45, maxLife: 0.45, color: f.def.colors.glow,
      });
      for (let i = 0; i < 18; i++) {
        const a = rand(0, TAU);
        this.addParticle({
          x: f.x + Math.cos(a) * 55, y: f.y - 170 + Math.sin(a) * 70,
          vx: -Math.cos(a) * rand(30, 130), vy: -Math.sin(a) * rand(30, 130),
          life: rand(0.3, 0.7), maxLife: 0.7, size: rand(1.5, 4),
          color: f.def.colors.accent, additive: true, alpha: 0.9,
        });
      }
    }
    return true;
  }

  spawnSlash(f, a) {
    const heavy = a.key === 'kick';
    const special = a.key === 'special';
    const y = f.y - (special ? 230 : heavy ? 175 : 225);
    this.addEffect({
      type: 'slash',
      x: f.x + f.facing * 30,
      y,
      facing: f.facing,
      size: special ? 235 : heavy ? 160 : 112,
      width: special ? 26 : heavy ? 18 : 11,
      color: f.def.colors.accent,
      life: special ? 0.38 : 0.2,
      maxLife: special ? 0.38 : 0.2,
      angle0: special ? -1.85 : heavy ? -1.5 : -1.15,
      angle1: special ? 0.75 : heavy ? 0.7 : 0.55,
      radius: special ? 1.05 : 0.9,
    });
    if (special) {
      this.shake = Math.max(this.shake, 7);
      for (let i = 0; i < 24; i++) {
        this.addParticle({
          x: f.x + f.facing * rand(10, 160), y: y + rand(-120, 120),
          vx: f.facing * rand(50, 340), vy: rand(-180, 80),
          life: rand(0.25, 0.6), maxLife: 0.6, size: rand(1.4, 4.2),
          color: f.def.colors.accent, additive: true, alpha: 0.9, shape: 'shard', rot: rand(0, TAU),
        });
      }
    }
  }

  spawnProjectile(f, a) {
    const sp = f.def.special;
    const direction = f.facing;
    this.projectiles.push({
      x: f.x + direction * 96,
      y: f.y - 212,
      vx: direction * sp.speed,
      facing: direction,
      owner: f,
      ownerKey: f.key,
      type: sp.type,
      radius: sp.radius,
      damage: sp.damage * f.def.power,
      hitstun: 0.43,
      blockstun: 0.24,
      knockback: 225,
      life: 2.2,
      hit: false,
      trailTime: 0,
      color: f.def.colors.accent,
    });
    this.addEffect({
      type: 'ring', x: f.x + direction * 80, y: f.y - 212, size: 80, width: 5,
      life: 0.4, maxLife: 0.4, color: f.def.colors.accent, alpha: 0.8,
    });
    this.flash = Math.max(this.flash, 0.18);
    this.shake = Math.max(this.shake, 8);
    this.sound('special');
  }

  resolveMelee(attacker, defender) {
    const a = attacker.attack;
    if (!a || a.hitDone) return;
    if (a.elapsed < a.startup || a.elapsed > a.startup + a.active) return;
    const box = {
      x: a.facing > 0 ? attacker.x + a.hitbox.x : attacker.x - a.hitbox.x - a.hitbox.w,
      y: attacker.y + a.hitbox.y,
      w: a.hitbox.w,
      h: a.hitbox.h,
    };
    const hurt = hurtbox(defender);
    if (!overlap(box, hurt)) return;
    a.hitDone = true;
    a.contact = true;
    const contact = {
      x: defender.x - a.facing * 22,
      y: clamp(box.y + box.h * 0.45, hurt.y, hurt.y + hurt.h),
    };
    this.applyHit(attacker, defender, a, contact, false);
  }

  applyHit(attacker, defender, data, contact, isProjectile) {
    if (defender.state === 'ko' || this.phase !== 'active') return;
    const baseDamage = data.damage || 40;
    const chip = data.base ? data.base.chip : 0.15;

    // blocking check
    if (defender.blocking && defender.blockstun <= 0 && defender.grounded && defender.state !== 'hit') {
      const facingAttacker = (attacker.x > defender.x && defender.facing > 0) || (attacker.x < defender.x && defender.facing < 0);
      if (facingAttacker || isProjectile) {
        const chipDamage = Math.max(1, baseDamage * chip);
        defender.hp = Math.max(0, defender.hp - chipDamage);
        defender.energy = Math.min(defender.maxEnergy, defender.energy + baseDamage * 0.2);
        defender.blockstun = data.blockstun + 0.03;
        defender.state = 'block';
        defender.vx = (data.facing || sign(defender.x - attacker.x)) * (data.knockback || 80) * 0.32;
        attacker.combo = 0;
        attacker.comboTimer = 0;
        this.hitstop = Math.max(this.hitstop, 0.028);
        this.shake = Math.max(this.shake, 2.6);
        this.spawnBlockSpark(contact, defender.def.colors.accent);
        this.sound('block');
        if (defender.hp <= 0) this.beginKO(attacker, defender);
        return;
      }
    }

    const counter = defender.state === 'attack' && defender.attack && defender.attack.elapsed < defender.attack.startup;
    const continuing = defender.hitstun > 0;
    attacker.combo = continuing ? attacker.combo + 1 : 1;
    attacker.comboTimer = 0.9 + (data.hitstun || 0.2);
    attacker.hitCount += 1;
    attacker.maxCombo = Math.max(attacker.maxCombo, attacker.combo);
    const scaling = Math.max(0.42, 1 - (attacker.combo - 1) * 0.078);
    const damage = Math.round(baseDamage * scaling * (counter ? 1.18 : 1));
    defender.hp = Math.max(0, defender.hp - damage);
    defender.hitstun = (data.hitstun || 0.2) + (counter ? 0.08 : 0) + (isProjectile ? 0.05 : 0);
    defender.hitDuration = defender.hitstun;
    defender.hitElapsed = 0;
    defender.state = 'hit';
    defender.blocking = false;
    defender.blockstun = 0;
    defender.attack = null;
    defender.flash = 0.7;
    if (isProjectile) {
      defender.vy = -210;
      defender.grounded = false;
    }
    defender.vx = (data.facing || sign(defender.x - attacker.x)) * (data.knockback || 80);
    defender.energy = Math.min(defender.maxEnergy, defender.energy + damage * 0.13);
    attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + damage * 0.17);
    this.hitstop = Math.max(this.hitstop, (data.base ? data.base.hitstop : 0.04) * (counter ? 1.35 : 1));
    this.shake = Math.max(this.shake, (data.base ? data.base.shake : 5) * (counter ? 1.3 : 1));
    this.flash = Math.max(this.flash, isProjectile ? 0.22 : 0.12);

    const size = isProjectile ? 46 : data.key === 'kick' ? 34 : data.key === 'special' ? 52 : 24;
    this.spawnHitSpark(contact, attacker.def.colors.accent, size);
    this.addEffect({
      type: 'ring', x: contact.x, y: contact.y, size: size * 1.1, width: 4,
      life: 0.32, maxLife: 0.32, color: attacker.def.colors.accent, alpha: 0.7,
    });
    for (let i = 0; i < (isProjectile ? 18 : counter ? 14 : 9); i++) {
      const a = rand(0, TAU);
      const sp = rand(80, isProjectile ? 520 : 360);
      this.addParticle({
        x: contact.x, y: contact.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: rand(0.2, 0.55), maxLife: 0.55, size: rand(1.2, 3.4),
        color: i % 3 === 0 ? '#ffffff' : attacker.def.colors.accent,
        additive: true, alpha: 0.95, shape: i % 4 === 0 ? 'line' : 'circle',
        shape2: 'line',
      });
    }
    this.sound(counter ? 'counter' : 'hit', { heavy: isProjectile || data.key === 'kick' });
    if (attacker.combo >= 2) this.sound('combo', { count: attacker.combo });
    if (defender.hp <= 0) this.beginKO(attacker, defender);
  }

  beginKO(winner, loser) {
    if (this.phase !== 'active') return;
    loser.hp = 0;
    loser.state = 'ko';
    loser.koTime = 0;
    loser.hitstun = 0;
    loser.blockstun = 0;
    loser.attack = null;
    loser.vy = -320;
    loser.grounded = false;
    loser.vx = sign(loser.x - winner.x) * 240;
    winner.state = 'victory';
    winner.anim = 'victory';
    winner.animTime = 0;
    winner.attack = null;
    winner.blocking = false;
    winner.crouching = false;
    winner.vx = 0;
    this.phase = 'ko';
    this.phaseTime = 0;
    this.pendingWinner = winner;
    this.pendingDraw = false;
    this.matchOver = winner.roundWins + 1 >= 2;
    this.winBannerShown = false;
    this.hitstop = 0.09;
    this.shake = 18;
    this.flash = 0.5;
    this.sound('ko');
    this.announce('K.O.', 'FINISH', { duration: 1.6, mode: 'ko' });
    this.addEffect({ type: 'shockwave', x: loser.x, y: loser.y - 6, size: 150, life: 0.6, maxLife: 0.6, color: winner.def.colors.accent });
    for (let i = 0; i < 36; i++) {
      const a = rand(0, TAU);
      this.addParticle({
        x: loser.x + rand(-30, 30), y: loser.y - rand(40, 260),
        vx: Math.cos(a) * rand(80, 440), vy: Math.sin(a) * rand(80, 440) - 100,
        life: rand(0.5, 1.3), maxLife: 1.3, size: rand(1.5, 4.5),
        color: i % 3 === 0 ? '#ffffff' : winner.def.colors.accent,
        additive: true, alpha: 0.9, shape: 'line',
      });
    }
  }

  timeUp() {
    if (this.phase !== 'active') return;
    this.phase = 'timeup';
    this.phaseTime = 0;
    const p = this.player, c = this.cpu;
    if (Math.abs(p.hp - c.hp) < 1) {
      this.pendingDraw = true;
      this.pendingWinner = null;
      this.matchOver = false;
      this.sound('timeup');
      this.announce('TIME UP', 'DRAW', { duration: 1.7, mode: 'ko' });
      return;
    }
    const winner = p.hp > c.hp ? p : c;
    const loser = winner === p ? c : p;
    this.pendingDraw = false;
    this.pendingWinner = winner;
    this.matchOver = winner.roundWins + 1 >= 2;
    winner.state = 'victory';
    winner.anim = 'victory';
    winner.animTime = 0;
    loser.state = 'idle';
    this.sound('timeup');
    this.announce('TIME UP', `${winner.def.name} LEADS`, { duration: 1.7, mode: 'ko' });
  }

  finishRound(winner, draw) {
    if (draw || !winner) {
      this.announce('DRAW', 'ROUND REPLAYED', { duration: 1.3, mode: 'round' });
      this.phase = 'roundEnd';
      this.phaseTime = 0;
      this.matchOver = false;
      return;
    }
    if (this.phase !== 'roundEnd') {
      winner.roundWins += 1;
      this.lastRoundWinner = winner;
      this.phase = 'roundEnd';
      this.phaseTime = 0;
      this.matchOver = winner.roundWins >= 2;
      this.announce(`${winner.def.name} WINS`, `ROUND ${this.round}`, {
        duration: 1.25, mode: 'win', color: winner.def.accent,
      });
      this.sound('win');
      if (this.callbacks.roundEnd) {
        this.callbacks.roundEnd({
          winner: winner.key,
          playerWins: this.player.roundWins,
          cpuWins: this.cpu.roundWins,
          matchOver: this.matchOver,
          round: this.round,
        });
      }
    }
  }

  updateProjectiles(dt) {
    const list = this.projectiles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx * dt;
      p.life -= dt;
      p.trailTime += dt;
      if (p.trailTime > 0.028) {
        p.trailTime = 0;
        const back = p.facing > 0 ? -1 : 1;
        for (let k = 0; k < 2; k++) {
          this.addParticle({
            x: p.x + back * rand(10, p.radius * 1.4), y: p.y + rand(-p.radius, p.radius),
            vx: p.vx * 0.1 + rand(-40, 40), vy: rand(-70, 70),
            life: rand(0.15, 0.38), maxLife: 0.38, size: rand(1.2, 3.1),
            color: p.type === 'ice' ? '#9ff7ff' : '#ffb347', additive: true, alpha: 0.8,
            shape: p.type === 'ice' ? 'shard' : 'circle', rot: rand(0, TAU),
          });
        }
      }
      const target = p.owner === this.player ? this.cpu : this.player;
      if (!p.hit && target && target.state !== 'ko') {
        const hb = hurtbox(target);
        const closestX = clamp(p.x, hb.x, hb.x + hb.w);
        const closestY = clamp(p.y, hb.y, hb.y + hb.h);
        const dx = p.x - closestX;
        const dy = p.y - closestY;
        if (dx * dx + dy * dy < p.radius * p.radius) {
          p.hit = true;
          this.applyHit(p.owner, target, {
            damage: p.damage,
            hitstun: p.hitstun,
            blockstun: p.blockstun,
            knockback: p.knockback,
            facing: p.facing,
            base: { chip: 0.22, hitstop: 0.07, shake: 12 },
            key: 'special',
          }, { x: p.x, y: p.y }, true);
          this.addEffect({
            type: 'shockwave', x: p.x, y: p.y, size: p.radius * 2.2, life: 0.45, maxLife: 0.45,
            color: p.type === 'ice' ? '#bffaff' : '#ffb347',
          });
          p.life = 0;
        }
      }
      if (p.x < -100 || p.x > WORLD.w + 100) p.life = 0;
    }
    // projectile clash
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!a || !b || a.owner === b.owner) continue;
        if (Math.abs(a.x - b.x) < a.radius + b.radius && Math.abs(a.y - b.y) < a.radius + b.radius) {
          a.life = 0; b.life = 0;
          const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
          this.addEffect({ type: 'shockwave', x, y, size: 170, life: 0.55, maxLife: 0.55, color: '#ffffff' });
          this.spawnHitSpark({ x, y }, '#ffe6a8', 50);
          this.shake = Math.max(this.shake, 10);
          this.flash = Math.max(this.flash, 0.24);
          this.sound('clash');
          for (let k = 0; k < 24; k++) {
            const ang = rand(0, TAU);
            this.addParticle({
              x, y, vx: Math.cos(ang) * rand(80, 520), vy: Math.sin(ang) * rand(80, 520),
              life: rand(0.3, 0.8), maxLife: 0.8, size: rand(1.5, 4),
              color: k % 2 ? '#9ff7ff' : '#ffb347', additive: true, alpha: 0.9, shape: 'line',
            });
          }
        }
      }
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
  }

  separate() {
    const p = this.player, c = this.cpu;
    if (!p || !c || p.state === 'ko' || c.state === 'ko') return;
    const min = 82;
    const dx = c.x - p.x;
    if (Math.abs(dx) < min) {
      const push = (min - Math.abs(dx)) / 2;
      const dir = dx >= 0 ? 1 : -1;
      p.x = clamp(p.x - dir * push, WORLD.left, WORLD.right);
      c.x = clamp(c.x + dir * push, WORLD.left, WORLD.right);
    }
  }

  spawnDust(x, y, count, color, scale = 1) {
    for (let i = 0; i < count; i++) {
      this.addParticle({
        x: x + rand(-18, 18), y: y - rand(0, 8),
        vx: rand(-80, 80) * scale, vy: rand(-95, -20) * scale,
        life: rand(0.25, 0.6), maxLife: 0.6, size: rand(2, 5) * scale,
        color: i % 2 ? color : '#cfd8e8', additive: false, alpha: 0.28, layer: 'back',
      });
    }
  }

  spawnHitSpark(contact, color, size) {
    this.addEffect({
      type: 'hit', x: contact.x, y: contact.y, size, color, life: 0.3, maxLife: 0.3, seed: rand(0, TAU),
    });
  }

  spawnBlockSpark(contact, color) {
    this.addEffect({
      type: 'block', x: contact.x, y: contact.y, size: 46, color: color || '#9ff6ff', life: 0.3, maxLife: 0.3,
    });
    for (let i = 0; i < 8; i++) {
      this.addParticle({
        x: contact.x, y: contact.y, vx: rand(-180, 180), vy: rand(-180, 120),
        life: rand(0.15, 0.35), maxLife: 0.35, size: rand(1, 2.6),
        color: i % 2 ? '#ffffff' : (color || '#9ff6ff'), additive: true, alpha: 0.9, shape: 'line',
      });
    }
  }

  addParticle(p) {
    if (this.particles.length > 520) this.particles.shift();
    this.particles.push(p);
  }

  addEffect(e) {
    if (this.effects.length > 90) this.effects.shift();
    this.effects.push(e);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity ?? 520) * dt;
      p.vx *= Math.pow(0.2, dt);
      if (p.rot !== undefined) p.rot += dt * 6;
    }
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.life <= 0) this.effects.splice(i, 1);
    }
  }

  getHud() {
    const p = this.player, c = this.cpu;
    return {
      player: {
        hp: p.hp, maxHp: p.maxHp, energy: p.energy, wins: p.roundWins, combo: p.combo,
        comboTimer: p.comboTimer, key: p.key,
      },
      cpu: {
        hp: c.hp, maxHp: c.maxHp, energy: c.energy, wins: c.roundWins, combo: c.combo,
        comboTimer: c.comboTimer, key: c.key,
      },
      timer: Math.ceil(this.timer),
      round: this.round,
      phase: this.phase,
    };
  }
}
