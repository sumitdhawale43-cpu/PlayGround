import {
  clamp, damp, dist, angleLerp, rand, mulberry32, lerp,
} from './utils.js';
import { ZONE_BY_ID, ZONES, WORLD, seabedY } from './world.js';

export class Player {
  constructor() {
    this.x = WORLD.baseX;
    this.y = 280;
    this.vx = 0;
    this.vy = 0;
    this.radius = 22;
    this.angle = Math.PI / 2;
    this.oxygen = 100;
    this.maxOxygen = 100;
    this.hull = 100;
    this.maxHull = 100;
    this.boosting = false;
    this.invuln = 0;
    this.hitFlash = 0;
    this.bubbleTimer = 0;
    this.thrusterLevel = 0;
    this.lampLevel = 0;
    this.hullLevel = 0;
    this.bob = 0;
    this.dead = false;
    this.surfaceGlow = 0;
    this.ambient = 0;
  }

  applyUpgrades(upgrades) {
    const oldMaxO = this.maxOxygen;
    const oldMaxH = this.maxHull;
    this.maxOxygen = 100 + (upgrades.oxygen || 0) * 25;
    this.maxHull = 100 + (upgrades.hull || 0) * 25;
    this.thrusterLevel = upgrades.thruster || 0;
    this.lampLevel = upgrades.lamp || 0;
    this.hullLevel = upgrades.hull || 0;
    if (this.maxOxygen > oldMaxO) this.oxygen = Math.min(this.maxOxygen, this.oxygen + (this.maxOxygen - oldMaxO));
    if (this.maxHull > oldMaxH) this.hull = Math.min(this.maxHull, this.hull + (this.maxHull - oldMaxH));
    this.oxygen = Math.min(this.oxygen, this.maxOxygen);
    this.hull = Math.min(this.hull, this.maxHull);
  }

  placeAt(x, y, oxygen = this.maxOxygen, hull = this.maxHull) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.oxygen = clamp(oxygen, 0, this.maxOxygen);
    this.hull = clamp(hull, 0, this.maxHull);
    this.dead = false;
    this.invuln = 1.5;
    this.hitFlash = 0;
  }

  update(dt, input, world, game) {
    this.invuln = Math.max(0, this.invuln - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.bob += dt;

    let ax = input.x;
    let ay = input.y;
    const mag = Math.hypot(ax, ay);
    if (mag > 1) {
      ax /= mag;
      ay /= mag;
    }
    const moving = mag > 0.06;
    this.boosting = moving && input.boost && this.oxygen > 0;
    const speedBonus = 1 + this.thrusterLevel * 0.1;
    const accel = 1420 * speedBonus * (this.boosting ? 1.34 : 1);
    const maxSpeed = 325 * speedBonus * (this.boosting ? 1.48 : 1);

    if (moving) {
      this.vx += ax * accel * dt;
      this.vy += ay * accel * dt;
    }

    // Water resistance.
    const drag = Math.exp(-(this.boosting ? 1.65 : 2.45) * dt);
    this.vx *= drag;
    this.vy *= drag;

    // A little neutral buoyancy so stopping feels like water.
    this.vy -= 2.2 * dt;

    const sp = Math.hypot(this.vx, this.vy);
    if (sp > maxSpeed) {
      this.vx = (this.vx / sp) * maxSpeed;
      this.vy = (this.vy / sp) * maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // World and seabed boundaries.
    this.x = clamp(this.x, 70, WORLD.width - 70);
    const floor = seabedY(this.x) - this.radius - 8;
    this.y = clamp(this.y, 36, floor);

    // Collide with rock bodies.
    for (const rock of world.rocks) {
      const dx = this.x - rock.x;
      const dy = this.y - rock.y;
      const rr = rock.r + this.radius;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        this.x = rock.x + nx * rr;
        this.y = rock.y + ny * rr;
        const vn = this.vx * nx + this.vy * ny;
        if (vn < 0) {
          this.vx -= vn * nx * 1.25;
          this.vy -= vn * ny * 1.25;
        }
      }
    }

    // Facing follows movement, with a gentle tilt.
    const targetAngle = sp > 22 ? Math.atan2(this.vy, this.vx) : this.angle;
    this.angle = angleLerp(this.angle, targetAngle, 1 - Math.exp(-7 * dt));

    // Thruster bubbles.
    this.bubbleTimer -= dt;
    if (moving && this.bubbleTimer <= 0) {
      this.bubbleTimer = this.boosting ? 0.035 : 0.075;
      const back = this.angle + Math.PI;
      game.particles.bubble(
        this.x + Math.cos(back) * 30 + rand(-5, 5),
        this.y + Math.sin(back) * 30 + rand(-5, 5),
        { size: rand(2, 5), rise: rand(30, 85), drift: rand(-12, 12), life: rand(1.2, 2.8) },
      );
    }
  }
}

function findOpenPosition(world, zone, rng, radius = 40) {
  for (let i = 0; i < 90; i++) {
    const x = 140 + rng() * (WORLD.width - 280);
    const y = zone.y0 + 180 + rng() * Math.max(120, zone.y1 - zone.y0 - 360);
    let blocked = false;
    for (const rock of world.rocks) {
      const dx = x - rock.x;
      const dy = y - rock.y;
      if (dx * dx + dy * dy < (rock.r + radius + 30) ** 2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return { x, y };
  }
  return { x: 400 + rng() * (WORLD.width - 800), y: zone.y0 + (zone.y1 - zone.y0) * 0.5 };
}

function baseCreature(type, x, y, extra = {}) {
  return {
    type,
    x, y,
    homeX: x,
    homeY: y,
    vx: 0,
    vy: 0,
    angle: 0,
    dir: Math.random() < 0.5 ? -1 : 1,
    phase: Math.random() * Math.PI * 2,
    state: 'patrol',
    stateT: 0,
    attackCd: 0,
    stun: 0,
    size: 30,
    damage: 0,
    speed: 60,
    detect: 0,
    aggro: 0,
    ...extra,
  };
}

export function createCreatures(world, seed = 7741) {
  const rng = mulberry32(seed);
  const creatures = [];
  const zone = (id) => ZONE_BY_ID[id];

  const spawn = (type, zoneId, extra, radius = 45) => {
    const p = findOpenPosition(world, zone(zoneId), rng, radius);
    creatures.push(baseCreature(type, p.x, p.y, { zone: zoneId, ...extra }));
  };

  for (let i = 0; i < 3; i++) {
    spawn('shark', 'kelp', {
      size: 42, damage: 14, speed: 155, detect: 500, dir: rng() < 0.5 ? -1 : 1,
      patrolSpeed: 55, phase: rng() * 10,
    }, 70);
  }
  for (let i = 0; i < 3; i++) {
    spawn('shark', 'twilight', {
      size: 46, damage: 16, speed: 170, detect: 560, dir: rng() < 0.5 ? -1 : 1,
      patrolSpeed: 60, phase: rng() * 10,
    }, 70);
  }

  for (let i = 0; i < 7; i++) {
    spawn('jelly', 'twilight', {
      size: 26 + rng() * 10, damage: 8, speed: 18, detect: 0,
      tentacle: 60 + rng() * 50, glow: rng() < 0.4 ? 'violet' : 'cyan',
      phase: rng() * 10,
    }, 50);
  }
  for (let i = 0; i < 7; i++) {
    spawn('jelly', 'abyss', {
      size: 30 + rng() * 14, damage: 10, speed: 20, detect: 0,
      tentacle: 70 + rng() * 70, glow: rng() < 0.5 ? 'violet' : 'amber',
      phase: rng() * 10,
    }, 50);
  }

  for (let i = 0; i < 3; i++) {
    spawn('angler', 'abyss', {
      size: 38, damage: 20, speed: 74, detect: 440, dir: rng() < 0.5 ? -1 : 1,
      phase: rng() * 10,
    }, 60);
  }
  for (let i = 0; i < 2; i++) {
    spawn('angler', 'rift', {
      size: 42, damage: 22, speed: 82, detect: 470, dir: rng() < 0.5 ? -1 : 1,
      phase: rng() * 10,
    }, 60);
  }

  for (let i = 0; i < 3; i++) {
    spawn('eel', 'abyss', {
      size: 28, damage: 13, speed: 260, detect: 320, dir: rng() < 0.5 ? -1 : 1,
      phase: rng() * 10,
    }, 50);
  }
  for (let i = 0; i < 3; i++) {
    spawn('eel', 'rift', {
      size: 30, damage: 15, speed: 280, detect: 340, dir: rng() < 0.5 ? -1 : 1,
      phase: rng() * 10,
    }, 50);
  }

  // Urchins sit on coral and rock ledges.
  const urchinRocks = world.rocks.filter((r) => r.r > 60 && (r.zone === 'shallows' || r.zone === 'kelp'));
  for (let i = 0; i < 14; i++) {
    const rock = urchinRocks[Math.floor(rng() * urchinRocks.length)];
    if (!rock) continue;
    const angle = rng() * Math.PI * 2;
    const x = rock.x + Math.cos(angle) * rock.r * 0.82;
    const y = rock.y + Math.sin(angle) * rock.r * 0.82;
    creatures.push(baseCreature('urchin', x, y, {
      zone: rock.zone, size: 16 + rng() * 7, damage: 8, speed: 0, detect: 0,
      phase: rng() * 10, homeX: x, homeY: y,
    }));
  }

  // Stingrays are harmless ambience.
  for (let i = 0; i < 8; i++) {
    const zid = i < 4 ? 'shallows' : 'kelp';
    spawn('ray', zid, {
      size: 40 + rng() * 20, damage: 0, speed: 52, detect: 180,
      dir: rng() < 0.5 ? -1 : 1, phase: rng() * 10, patrolSpeed: 46,
    }, 80);
  }

  // The abyssal guardian circles the third relic.
  const relic = world.relics[2];
  if (relic) {
    creatures.push(baseCreature('guardian', relic.x - 260, relic.y + 80, {
      zone: 'abyss', size: 68, damage: 24, speed: 108, detect: 620,
      dir: 1, phase: 2.4, guardian: true,
    }));
  }

  return creatures;
}

function steer(c, tx, ty, speed, dt, responsiveness = 3.2) {
  const dx = tx - c.x;
  const dy = ty - c.y;
  const d = Math.hypot(dx, dy) || 1;
  const desiredX = (dx / d) * speed;
  const desiredY = (dy / d) * speed;
  c.vx = damp(c.vx, desiredX, responsiveness, dt);
  c.vy = damp(c.vy, desiredY, responsiveness, dt);
}

function wander(c, dt, speed) {
  c.phase += dt * 0.32;
  const tx = c.homeX + Math.sin(c.phase * 0.7) * 180;
  const ty = c.homeY + Math.cos(c.phase * 0.53) * 110;
  steer(c, tx, ty, speed, dt, 1.2);
}

export function updateCreatures(creatures, player, dt, game) {
  const px = player.x;
  const py = player.y;
  for (const c of creatures) {
    c.attackCd = Math.max(0, c.attackCd - dt);
    c.stateT += dt;
    c.phase += dt;

    if (c.stun > 0) {
      c.stun -= dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= Math.exp(-1.4 * dt);
      c.vy *= Math.exp(-1.4 * dt);
      continue;
    }

    const dx = px - c.x;
    const dy = py - c.y;
    const d = Math.hypot(dx, dy);

    switch (c.type) {
      case 'shark': {
        if (c.state === 'patrol' && d < c.detect) {
          c.state = 'chase';
          c.stateT = 0;
          c.aggro = 1;
        }
        if (c.state === 'chase') {
          steer(c, px, py, c.speed, dt, 3.4);
          if (d < c.size + player.radius + 12 && c.attackCd <= 0) {
            game.damage(c.damage, 'shark');
            c.attackCd = 1.9;
            c.state = 'retreat';
            c.stateT = 0;
          } else if (d > c.detect * 1.6) {
            c.state = 'patrol';
            c.stateT = 0;
          }
        } else if (c.state === 'retreat') {
          steer(c, c.x - dx * 2, c.y - dy * 2, c.speed * 1.25, dt, 3);
          if (c.stateT > 2.6) {
            c.state = 'patrol';
            c.stateT = 0;
          }
        } else {
          wander(c, dt, c.patrolSpeed);
        }
        c.dir = c.vx >= 0 ? 1 : -1;
        c.angle = Math.atan2(c.vy, c.vx);
        break;
      }
      case 'jelly': {
        // Slow, eerie drift with a vertical pulse.
        const pulse = Math.sin(c.phase * 1.15);
        c.vx = damp(c.vx, Math.sin(c.phase * 0.27) * c.speed * 0.6, 1.1, dt);
        c.vy = damp(c.vy, -12 - pulse * 20, 1.3, dt);
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.y < c.homeY - 220) c.vy += 12 * dt;
        if (c.y > c.homeY + 220) c.vy -= 12 * dt;
        c.dir = c.vx >= 0 ? 1 : -1;
        break;
      }
      case 'angler': {
        if (d < c.detect) {
          if (d > 130) steer(c, px, py, c.speed, dt, 1.8);
          else {
            steer(c, px, py, c.speed * 1.9, dt, 4);
            if (d < c.size + player.radius + 8 && c.attackCd <= 0) {
              game.damage(c.damage, 'anglerfish');
              c.attackCd = 2.2;
              c.state = 'retreat';
              c.stateT = 0;
            }
          }
        } else if (c.state === 'retreat') {
          steer(c, c.x - dx, c.y - dy, c.speed, dt, 2);
          if (c.stateT > 2.4) c.state = 'patrol';
        } else {
          wander(c, dt, c.speed * 0.42);
        }
        c.dir = c.vx >= 0 ? 1 : -1;
        c.angle = Math.atan2(c.vy, c.vx);
        break;
      }
      case 'guardian': {
        if (d < c.detect) {
          if (d > 210) steer(c, px, py, c.speed, dt, 1.4);
          else {
            steer(c, px, py, c.speed * 1.7, dt, 3);
            if (d < c.size + player.radius + 10 && c.attackCd <= 0) {
              game.damage(c.damage, 'the guardian');
              c.attackCd = 2.8;
              c.stateT = 0;
            }
          }
        } else {
          wander(c, dt, c.speed * 0.3);
        }
        c.dir = c.vx >= 0 ? 1 : -1;
        c.angle = Math.atan2(c.vy, c.vx);
        break;
      }
      case 'eel': {
        if (c.state === 'lunge') {
          steer(c, px, py, c.speed, dt, 6);
          if (d < c.size + player.radius + 8 && c.attackCd <= 0) {
            game.damage(c.damage, 'eel');
            c.attackCd = 2;
            c.state = 'retreat';
            c.stateT = 0;
          } else if (c.stateT > 1.15) {
            c.state = 'retreat';
            c.stateT = 0;
          }
        } else if (c.state === 'retreat') {
          steer(c, c.x - dx, c.y - dy, c.speed * 0.9, dt, 4);
          if (c.stateT > 2.2) {
            c.state = 'patrol';
            c.stateT = 0;
            c.homeX = c.x;
            c.homeY = c.y;
          }
        } else {
          c.phase += dt * 1.4;
          c.vx = damp(c.vx, Math.sin(c.phase) * 22, 1.5, dt);
          c.vy = damp(c.vy, Math.cos(c.phase * 0.7) * 16, 1.5, dt);
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          if (d < c.detect) {
            c.state = 'lunge';
            c.stateT = 0;
          }
        }
        c.dir = c.vx >= 0 ? 1 : -1;
        c.angle = Math.atan2(c.vy, c.vx);
        break;
      }
      case 'ray': {
        c.phase += dt * 0.7;
        const fleeing = d < c.detect;
        const speed = fleeing ? c.speed * 1.8 : c.patrolSpeed;
        c.vx = damp(c.vx, c.dir * speed, 1.1, dt);
        c.vy = damp(c.vy, Math.sin(c.phase) * 18, 1.4, dt);
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.x < 120) c.dir = 1;
        if (c.x > WORLD.width - 120) c.dir = -1;
        if (fleeing) c.dir = dx >= 0 ? 1 : -1;
        c.angle = Math.sin(c.phase) * 0.15;
        break;
      }
      case 'urchin': {
        c.phase += dt;
        break;
      }
      default:
        break;
    }

    // Keep creatures in open water and out of the seabed.
    c.x = clamp(c.x, 80, WORLD.width - 80);
    c.y = clamp(c.y, 80, seabedY(c.x) - c.size - 10);

    // Contact damage.
    if (c.damage > 0 && c.type !== 'urchin' && c.attackCd <= 0) {
      if (dist(c.x, c.y, px, py) < c.size + player.radius - 4) {
        game.damage(c.damage, c.type === 'guardian' ? 'the guardian' : c.type);
        c.attackCd = c.type === 'jelly' ? 2.2 : 1.8;
        if (c.type === 'shark') {
          c.state = 'retreat';
          c.stateT = 0;
        }
      }
    } else if (c.type === 'urchin' && c.attackCd <= 0) {
      if (dist(c.x, c.y, px, py) < c.size + player.radius + 2) {
        game.damage(c.damage, 'sea urchin');
        c.attackCd = 2.4;
      }
    }
  }
}

export function repelCreatures(creatures, x, y, radius, player) {
  for (const c of creatures) {
    const dx = c.x - x;
    const dy = c.y - y;
    const d = Math.hypot(dx, dy);
    if (d < radius && c.type !== 'urchin') {
      const nx = d > 0.001 ? dx / d : 1;
      const ny = d > 0.001 ? dy / d : 0;
      const force = (1 - d / radius) * 620;
      c.vx += nx * force;
      c.vy += ny * force;
      c.stun = c.guardian ? 2.2 : 3.1;
      c.attackCd = 1.5;
      if (c.type === 'shark') c.state = 'retreat';
      if (c.type === 'eel') c.state = 'retreat';
    }
  }
}

// ═══════════════════ PARTICLES ═══════════════════
export class Particles {
  constructor() {
    this.items = [];
    this.max = 620;
  }

  add(p) {
    if (this.items.length >= this.max) this.items.shift();
    this.items.push(p);
  }

  bubble(x, y, opts = {}) {
    const life = opts.life ?? rand(1.5, 3.4);
    this.add({
      kind: 'bubble',
      x, y,
      vx: opts.drift ?? rand(-10, 10),
      vy: -(opts.rise ?? rand(24, 60)),
      size: opts.size ?? rand(1.8, 4.6),
      life,
      maxLife: life,
      wobble: rand(0, 10),
      alpha: opts.alpha ?? 0.8,
    });
  }

  spark(x, y, color = '#8ff8ff', opts = {}) {
    const angle = opts.angle ?? rand(0, Math.PI * 2);
    const speed = opts.speed ?? rand(30, 150);
    const life = opts.life ?? rand(0.4, 1.2);
    this.add({
      kind: 'spark',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: opts.size ?? rand(1.2, 3.2),
      life,
      maxLife: life,
      color,
      drag: opts.drag ?? 2.6,
    });
  }

  burst(x, y, color = '#8ff8ff', count = 12, power = 120) {
    for (let i = 0; i < count; i++) {
      this.spark(x, y, color, { angle: rand(0, Math.PI * 2), speed: rand(power * 0.3, power), size: rand(1.3, 3.6) });
    }
  }

  damage(x, y) {
    for (let i = 0; i < 10; i++) {
      this.spark(x, y, i % 2 ? '#ff8b7a' : '#ffd0a0', { angle: rand(0, Math.PI * 2), speed: rand(50, 230), size: rand(1.5, 4), life: rand(0.25, 0.7) });
    }
    this.bubble(x, y, { size: rand(3, 7), rise: rand(50, 120), life: rand(0.8, 1.8) });
  }

  update(dt) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0) {
        items.splice(i, 1);
        continue;
      }
      if (p.kind === 'bubble') {
        p.wobble += dt * 4.2;
        p.x += (p.vx + Math.sin(p.wobble) * 12) * dt;
        p.y += p.vy * dt;
        p.vy *= Math.exp(-0.12 * dt);
        p.vx *= Math.exp(-0.5 * dt);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.exp(-(p.drag || 2) * dt);
        p.vy *= Math.exp(-(p.drag || 2) * dt);
        p.vy += 12 * dt;
      }
    }
  }
}
