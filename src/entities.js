// ── The Remembering — living things ──────────────────────────────────────────
import { clamp, dist, angleDiff, RNG } from './util.js';

const ENEMY_TYPES = {
  raider: {
    label: 'Hollow raider', hp: 54, speed: 76, dmg: 9, detect: 250, range: 40,
    radius: 12, lose: 5.5, drop: { hide: 1, stone: 1 }, weight: 3,
  },
  archer: {
    label: 'Hollow archer', hp: 40, speed: 68, dmg: 8, detect: 310, range: 235,
    radius: 11, lose: 7, drop: { arrows: 3, hide: 1 }, weight: 2,
  },
  wolf: {
    label: 'ash wolf', hp: 34, speed: 122, dmg: 7, detect: 285, range: 30,
    radius: 10, lose: 7, drop: { meat: 1, hide: 1 }, weight: 2,
  },
  bear: {
    label: 'cave bear', hp: 128, speed: 64, dmg: 18, detect: 215, range: 44,
    radius: 18, lose: 6, drop: { meat: 3, hide: 2 }, weight: 1,
  },
};

const ANIMAL_TYPES = {
  deer: { label: 'deer', hp: 26, speed: 128, radius: 11, drop: { meat: 2, hide: 1 } },
  rabbit: { label: 'rabbit', hp: 7, speed: 142, radius: 6, drop: { meat: 1 } },
  boar: { label: 'boar', hp: 58, speed: 92, radius: 14, drop: { meat: 2, hide: 1 } },
};

export function moveEntity(game, e, dx, dy, speed, dt, radius = e.r || 10) {
  const d = Math.hypot(dx, dy);
  if (d < 0.0001) return;
  const step = Math.min(speed * dt, d);
  const nx = e.x + (dx / d) * step;
  const ny = e.y + (dy / d) * step;
  if (game.world.canWalk(nx, e.y, radius)) e.x = nx;
  if (game.world.canWalk(e.x, ny, radius)) e.y = ny;
}

export class Player {
  constructor(x, y, name, legacy = 0) {
    this.x = x; this.y = y;
    this.name = name;
    this.r = 12;
    this.dir = -Math.PI / 2;
    this.maxHp = 100 + Math.min(45, legacy * 5);
    this.hp = this.maxHp;
    this.stam = 100; this.maxStam = 100;
    this.hunger = 92; this.thirst = 88; this.warmth = 90;
    this.tool = 0;
    this.tools = [true, false, false, false];
    this.inv = { wood: 0, stone: 0, fiber: 0, berry: 2, meat: 0, hide: 0 };
    this.arrows = 0;
    this.snares = 0;
    this.attackCd = 0;
    this.attackTimer = 0;
    this.attackKind = null;
    this.dodgeCd = 0;
    this.dodgeTimer = 0;
    this.invuln = 0;
    this.crouching = false;
    this.hurtFlash = 0;
    this.stepPhase = 0;
    this.bowDraw = 0;
    this.dead = false;
    this.legacy = legacy;
    this.kills = 0;
    this.walked = 0;
    this.lastDamage = 0;
    this.aim = { x: x + 100, y: y };
  }

  get moving() { return false; }
}

export function createEnemy(game, kind, x, y, opts = {}) {
  const def = ENEMY_TYPES[kind] || ENEMY_TYPES.raider;
  const e = {
    kind: 'enemy', type: kind, label: def.label,
    x, y, r: def.radius, hp: def.hp, maxHp: def.hp,
    speed: def.speed, dmg: def.dmg, detect: def.detect, atkRange: def.range,
    loseTime: def.lose, drop: { ...def.drop }, weight: def.weight,
    home: { x, y }, state: 'patrol', alerted: false, lastSeen: null,
    seenTimer: 0, attackCd: 0, windup: 0, attackAnim: 0, dodgeCd: 0,
    dodgeTime: 0, dodgeVX: 0, dodgeVY: 0, stun: 0, hitFlash: 0,
    dead: false, fade: 1, face: Math.PI / 2, wanderT: 0,
    wanderX: x, wanderY: y, phase: Math.random() * 6.28, time: 0,
    reportRolled: false, fleeing: false, fleeTimer: 0,
    shield: false, lantern: false, fireResist: false, ashwalker: false,
    variant: Math.floor(Math.random() * 4), named: opts.named || false,
    fromRuin: opts.fromRuin || false,
  };

  if (game.memory.isUnlocked('shieldwall') && (kind === 'raider' || kind === 'archer')) {
    e.shield = true;
  }
  if (game.memory.isUnlocked('wardens') && kind === 'archer') {
    e.lantern = true;
    e.detect += 45;
  }
  if (game.memory.isUnlocked('hounds') && kind === 'wolf') {
    e.speed += 24;
    e.loseTime += 5;
  }
  if (game.memory.isUnlocked('ashwalkers') && kind === 'raider') {
    e.fireResist = true;
    e.ashwalker = true;
  }
  if (opts.elite) {
    e.hp = Math.round(e.hp * 1.45);
    e.maxHp = e.hp;
    e.dmg = Math.round(e.dmg * 1.2);
    e.elite = true;
  }
  return e;
}

export class Enemy {
  static update(game, e, dt) {
    if (e.dead) { e.fade = Math.max(0, e.fade - dt * 1.4); return; }
    e.time += dt;
    e.attackCd -= dt;
    e.dodgeCd -= dt;
    e.stun -= dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.attackAnim = Math.max(0, e.attackAnim - dt);
    if (e.dodgeTime > 0) {
      e.dodgeTime -= dt;
      if (game.world.canWalk(e.x + e.dodgeVX * dt, e.y, e.r)) e.x += e.dodgeVX * dt;
      if (game.world.canWalk(e.x, e.y + e.dodgeVY * dt, e.r)) e.y += e.dodgeVY * dt;
      return;
    }
    if (e.stun > 0) return;

    const p = game.player;
    if (p.dead) {
      e.alerted = false;
      return;
    }
    const d = dist(e.x, e.y, p.x, p.y);
    const canSee = d < detectionRange(game, e);
    if (canSee) {
      e.lastSeen = { x: p.x, y: p.y };
      e.seenTimer = e.loseTime;
      if (!e.alerted) {
        e.alerted = true;
        e.alertTimer = 0.9;
        game.alertNearby(e);
        game.addFloat(e.x, e.y - 22, '!', '#e8894a');
      }
    } else {
      e.seenTimer -= dt;
    }
    if (e.alertTimer > 0) e.alertTimer -= dt;

    // Sapper doctrine: walk over and cut snares.
    if (game.memory.isUnlocked('sappers') && (e.type === 'raider' || e.type === 'archer')) {
      const trap = game.traps.find(t => !t.dead && dist(t.x, t.y, e.x, e.y) < 120);
      if (trap) {
        const td = dist(e.x, e.y, trap.x, trap.y);
        if (td < 24) {
          trap.dead = true;
          game.addFloat(trap.x, trap.y - 12, 'disarmed', '#b9a374');
          game.burst(trap.x, trap.y, '#d7c08a', 8, 55, 'spark');
          game.toast('A Hollow sapper cut a snare.', 'warn');
          return;
        }
        moveEntity(game, e, trap.x - e.x, trap.y - e.y, e.speed * 0.95, dt, e.r);
        e.face = Math.atan2(trap.y - e.y, trap.x - e.x);
        return;
      }
    }

    // Raiders break and carry word if badly hurt.
    if (e.fleeing) {
      e.fleeTimer += dt;
      const away = Math.atan2(e.y - p.y, e.x - p.x);
      moveEntity(game, e, Math.cos(away), Math.sin(away), e.speed * 1.22, dt, e.r);
      e.face = away;
      if (e.fleeTimer > 2.2 && (d > 760 || e.fleeTimer > 8)) {
        e.dead = true;
        e.fade = 0;
        game.onIntelEscaped(e);
      }
      return;
    }
    if (e.hp < e.maxHp * 0.22 && !e.reportRolled && (e.type === 'raider' || e.type === 'wolf')) {
      e.reportRolled = true;
      if (e.type === 'raider' && game.rng.chance(0.58)) {
        e.fleeing = true;
        game.toast('A Hollow broke away — it will carry word.', 'danger');
        return;
      }
      if (e.type === 'wolf') {
        e.fleeing = true;
        return;
      }
    }

    // Slipstep doctrine: sidestep telegraphed melee.
    if (game.memory.isUnlocked('slipstep') && p.attackTimer > 0 && d < 86 && e.dodgeCd <= 0 && e.type !== 'bear') {
      const side = game.rng.chance(0.5) ? 1 : -1;
      const a = Math.atan2(p.y - e.y, p.x - e.x) + side * Math.PI / 2;
      e.dodgeVX = Math.cos(a) * 235;
      e.dodgeVY = Math.sin(a) * 235;
      e.dodgeTime = 0.19;
      e.dodgeCd = 2.4;
      game.burst(e.x, e.y, '#8f8a78', 4, 30, 'dust');
      return;
    }

    const aware = e.alerted && (canSee || e.seenTimer > 0);
    if (!aware) {
      // Drift home and patrol.
      e.wanderT -= dt;
      if (e.wanderT <= 0) {
        e.wanderT = 2.4 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        e.wanderX = e.home.x + Math.cos(a) * (30 + Math.random() * 90);
        e.wanderY = e.home.y + Math.sin(a) * (30 + Math.random() * 90);
      }
      if (dist(e.x, e.y, e.wanderX, e.wanderY) > 8) {
        moveEntity(game, e, e.wanderX - e.x, e.wanderY - e.y, e.speed * 0.36, dt, e.r);
        e.face = Math.atan2(e.wanderY - e.y, e.wanderX - e.x);
      }
      if (e.seenTimer <= 0 && e.alerted) e.alerted = false;
      return;
    }

    e.face = Math.atan2(p.y - e.y, p.x - e.x);

    if (e.type === 'archer') {
      updateArcher(game, e, dt, d, canSee);
      return;
    }

    // Flanking: with a pack, fan around the player.
    let tx = p.x, ty = p.y;
    if (d < 220) {
      const pack = game.enemies.filter(o => !o.dead && o !== e && o.alerted &&
        Math.abs(o.x - e.x) < 230 && Math.abs(o.y - e.y) < 230);
      if (pack.length >= 2) {
        const idx = pack.indexOf(e);
        const offset = (idx - pack.length / 2) * 0.42;
        const a = Math.atan2(p.y - e.y, p.x - e.x) + offset;
        const rr = Math.max(42, d * 0.65);
        tx = p.x + Math.cos(a) * rr;
        ty = p.y + Math.sin(a) * rr;
      }
    }
    const dd = dist(e.x, e.y, tx, ty);
    const reach = e.atkRange + p.r;

    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        if (dist(e.x, e.y, p.x, p.y) < reach + 22) game.damagePlayer(e.dmg, e, 'hollow');
        game.burst(e.x + Math.cos(e.face) * 18, e.y + Math.sin(e.face) * 18, '#e8894a', 5, 55, 'spark');
      }
      return;
    }

    if (d <= reach) {
      if (e.attackCd <= 0) {
        e.attackCd = e.type === 'bear' ? 1.55 : 1.05;
        e.windup = e.type === 'bear' ? 0.42 : 0.28;
        e.attackAnim = 0.3;
      }
      return;
    }

    const spd = e.speed * (e.shield ? 0.88 : 1) * (e.hp < e.maxHp * 0.35 ? 0.92 : 1);
    if (dd > 6) moveEntity(game, e, tx - e.x, ty - e.y, spd, dt, e.r);
  }
}

function updateArcher(game, e, dt, d, canSee) {
  const p = game.player;
  if (d < 105) {
    const away = Math.atan2(e.y - p.y, e.x - p.x);
    moveEntity(game, e, Math.cos(away), Math.sin(away), e.speed * 1.15, dt, e.r);
    return;
  }
  if (d > 250) {
    moveEntity(game, e, p.x - e.x, p.y - e.y, e.speed * 0.9, dt, e.r);
    return;
  }
  if (canSee && e.attackCd <= 0) {
    e.attackCd = 2.1;
    e.attackAnim = 0.4;
    game.spawnEnemyArrow(e);
  }
}

function detectionRange(game, e) {
  let range = e.detect;
  const p = game.player;
  if (p.crouching) range *= 0.52;
  if (game.weather === 'fog') range *= 0.74;
  if (game.nightFactor > 0.35) range *= 1.16;
  if (p.tool === 2 && game.nightFactor > 0.25) range *= 1.14;
  if (e.lantern) range *= 1.3;
  if (e.alerted) range *= 1.55;
  const biome = game.world.biomeAt(e.x, e.y);
  if (biome === 3 && p.crouching) range *= 0.86;
  return range;
}

export function damageEnemy(game, e, amount, opts = {}) {
  if (e.dead) return;
  if (e.shield && opts.arrow) {
    const incoming = Math.atan2(opts.vy ?? 0, opts.vx ?? 0);
    const frontal = Math.abs(angleDiff(e.face, incoming)) > Math.PI * 0.55;
    if (frontal && game.rng.chance(0.72)) {
      game.addFloat(e.x, e.y - 26, 'blocked', '#cfc6a8');
      game.burst(e.x + Math.cos(e.face) * 14, e.y + Math.sin(e.face) * 14, '#e7d9ae', 6, 70, 'spark');
      e.alerted = true;
      e.lastSeen = { x: game.player.x, y: game.player.y };
      e.seenTimer = e.loseTime;
      return;
    }
  }
  if (opts.fire && e.fireResist) amount *= 0.45;
  e.hp -= amount;
  e.hitFlash = 0.2;
  e.alerted = true;
  e.lastSeen = { x: game.player.x, y: game.player.y };
  e.seenTimer = e.loseTime;
  game.addFloat(e.x, e.y - 28, String(Math.round(amount)), opts.fire ? '#f2a35c' : '#f0e6cf');
  game.burst(e.x, e.y, opts.fire ? '#e8894a' : '#8f3a34', opts.fire ? 8 : 6, 90, opts.fire ? 'ember' : 'blood');
  game.shake(opts.heavy ? 5 : 2.2);
  if (e.hp <= 0) {
    killEnemy(game, e, opts);
    return;
  }
  if (opts.knock) {
    const a = Math.atan2(e.y - game.player.y, e.x - game.player.x);
    const nx = e.x + Math.cos(a) * opts.knock;
    const ny = e.y + Math.sin(a) * opts.knock;
    if (game.world.canWalk(nx, ny, e.r)) { e.x = nx; e.y = ny; }
  }
}

function killEnemy(game, e, opts) {
  e.dead = true;
  e.fade = 1;
  e.hp = 0;
  game.corpses.push({ x: e.x, y: e.y, kind: e.type, fade: 1, time: 0, face: e.face });
  for (const [item, n] of Object.entries(e.drop)) {
    if (item === 'arrows') game.player.arrows += n;
    else game.player.inv[item] = (game.player.inv[item] || 0) + n;
  }
  game.burst(e.x, e.y, '#8f3a34', 14, 120, 'blood');
  game.shake(4);
  game.onEnemyKilled(e, opts);
}

// ── animals ──────────────────────────────────────────────────────────────────
export function createAnimal(game, kind, x, y) {
  const def = ANIMAL_TYPES[kind] || ANIMAL_TYPES.deer;
  return {
    kind: 'animal', type: kind, label: def.label,
    x, y, r: def.radius, hp: def.hp, maxHp: def.hp, speed: def.speed,
    drop: { ...def.drop }, home: { x, y }, state: 'wander', flee: 0,
    wanderT: Math.random() * 2, tx: x, ty: y, face: Math.random() * 6.28,
    dead: false, hitFlash: 0, phase: Math.random() * 6.28, time: 0,
    variant: Math.floor(Math.random() * 3),
  };
}

export class Animal {
  static update(game, a, dt) {
    if (a.dead) return;
    a.time += dt;
    a.hitFlash = Math.max(0, a.hitFlash - dt);
    const p = game.player;
    const d = dist(a.x, a.y, p.x, p.y);
    if (a.type === 'boar' && a.hitFlash > 0) a.state = 'angry';
    if (d < (a.state === 'angry' ? 999 : 205) && !p.dead) {
      if (a.state !== 'angry') a.state = 'flee';
    } else if (a.state === 'flee' && d > 330) {
      a.state = 'wander';
    }
    if (a.state === 'flee') {
      const away = Math.atan2(a.y - p.y, a.x - p.x);
      moveEntity(game, a, Math.cos(away), Math.sin(away), a.speed * 1.35, dt, a.r);
      a.face = away;
      return;
    }
    if (a.state === 'angry') {
      if (d < a.r + p.r + 8) {
        if (a.attackCd === undefined) a.attackCd = 0;
        a.attackCd -= dt;
        if (a.attackCd <= 0) {
          a.attackCd = 1.5;
          game.damagePlayer(11, a, 'boar');
        }
      } else {
        moveEntity(game, a, p.x - a.x, p.y - a.y, a.speed, dt, a.r);
        a.face = Math.atan2(p.y - a.y, p.x - a.x);
      }
      return;
    }
    a.wanderT -= dt;
    if (a.wanderT <= 0) {
      a.wanderT = 2.5 + Math.random() * 4;
      const ang = Math.random() * Math.PI * 2;
      a.tx = a.home.x + Math.cos(ang) * (24 + Math.random() * 90);
      a.ty = a.home.y + Math.sin(ang) * (24 + Math.random() * 90);
    }
    if (dist(a.x, a.y, a.tx, a.ty) > 7) {
      moveEntity(game, a, a.tx - a.x, a.ty - a.y, a.speed * 0.28, dt, a.r);
      a.face = Math.atan2(a.ty - a.y, a.tx - a.x);
    }
  }
}

export function damageAnimal(game, a, amount, opts = {}) {
  if (a.dead) return;
  a.hp -= amount;
  a.hitFlash = 0.22;
  a.state = a.type === 'boar' ? 'angry' : 'flee';
  game.addFloat(a.x, a.y - 20, String(Math.round(amount)), '#f0e6cf');
  game.burst(a.x, a.y, '#8f3a34', 5, 75, 'blood');
  if (a.hp <= 0) {
    a.dead = true;
    for (const [item, n] of Object.entries(a.drop)) {
      game.player.inv[item] = (game.player.inv[item] || 0) + n;
    }
    game.corpses.push({ x: a.x, y: a.y, kind: a.type, fade: 1, time: 0, face: a.face });
    game.onAnimalKilled(a, opts);
  }
}

// ── people ───────────────────────────────────────────────────────────────────
export class NPC {
  static update(game, n, dt) {
    n.time += dt;
    const p = game.player;
    const d = dist(n.x, n.y, p.x, p.y);
    if (d < 110) {
      n.face = Math.atan2(p.y - n.y, p.x - n.x);
      n.aware = true;
    } else {
      n.aware = false;
      n.wanderT -= dt;
      if (n.wanderT <= 0) {
        n.wanderT = 4 + Math.random() * 5;
        const a = Math.random() * Math.PI * 2;
        n.tx = n.home.x + Math.cos(a) * 26;
        n.ty = n.home.y + Math.sin(a) * 26;
      }
      if (dist(n.x, n.y, n.tx, n.ty) > 6) {
        moveEntity(game, n, n.tx - n.x, n.ty - n.y, 26, dt, n.r);
        n.face = Math.atan2(n.ty - n.y, n.tx - n.x);
      }
    }
  }
}

// ── projectiles ──────────────────────────────────────────────────────────────
export class Projectile {
  constructor(x, y, angle, speed, dmg, from, opts = {}) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = angle;
    this.dmg = dmg;
    this.from = from;
    this.life = opts.life ?? 1.8;
    this.dead = false;
    this.fire = !!opts.fire;
    this.trail = 0;
  }
  update(game, dt) {
    if (this.dead) return;
    this.life -= dt;
    this.trail -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || !game.world.canWalk(this.x, this.y, 2)) { this.dead = true; return; }
    if (this.trail <= 0) {
      this.trail = 0.03;
      game.particles.push({
        x: this.x, y: this.y, vx: 0, vy: 0, life: 0.2, maxLife: 0.2,
        size: 1.6, color: this.fire ? '#e8894a' : '#d8cba9', type: 'spark',
      });
    }
    if (this.from === 'player') {
      for (const e of game.enemies) {
        if (e.dead) continue;
        if (dist(this.x, this.y, e.x, e.y) < e.r + 4) {
          this.dead = true;
          damageEnemy(game, e, this.dmg, {
            arrow: true, vx: this.vx, vy: this.vy, fire: this.fire,
          });
          return;
        }
      }
    } else {
      const p = game.player;
      if (!p.dead && dist(this.x, this.y, p.x, p.y) < p.r + 4) {
        this.dead = true;
        game.damagePlayer(this.dmg, null, 'hollow');
      }
    }
  }
}

export class Trap {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.arm = 0.45;
    this.dead = false;
    this.phase = Math.random() * 6.28;
  }
  update(game, dt) {
    if (this.dead) return;
    this.arm -= dt;
    if (this.arm > 0) return;
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (dist(this.x, this.y, e.x, e.y) < e.r + 12) {
        this.dead = true;
        e.stun = 1.5;
        game.burst(this.x, this.y, '#b9a374', 10, 95, 'dust');
        damageEnemy(game, e, 46, { trap: true, heavy: true });
        return;
      }
    }
  }
}

// ── effects ──────────────────────────────────────────────────────────────────
export function burst(game, x, y, color, count, speed, type = 'dust') {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.9);
    game.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.35 + Math.random() * 0.55,
      maxLife: 0.9,
      size: 1.5 + Math.random() * 2.6,
      color, type,
      gravity: type === 'blood' ? 55 : type === 'ember' ? -30 : 0,
    });
  }
  if (game.particles.length > 520) game.particles.splice(0, game.particles.length - 520);
}
