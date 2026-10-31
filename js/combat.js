import { clamp, dist, TAU, angleLerp } from './util.js';
import { resolveCollisions, hasLineOfSight } from './world.js';
import { TOOLS } from './config.js';

const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export function enemyCap(game) {
  const mods = game.chronicle.mods();
  const night = game.nightLevel();
  return Math.min(9, 3 + Math.floor(night * 2) + mods.extra + Math.min(2, Math.floor(game.time.day / 4)));
}

/* ============================================================
   PLAYER ACTIONS
   ============================================================ */
export function attack(game) {
  const p = game.player;
  if (game.mode !== 'play' || p.dead || p.atkCd > 0) return;
  const tool = TOOLS[p.tool];
  if (p.stamina < tool.stamina) {
    game.ui.toast('Too winded. Give it a breath.', 'danger', 1500);
    return;
  }
  if (!tool.melee && p.arrows <= 0) {
    game.ui.toast('Your quiver is empty. Whittle arrows in the craft panel.', 'danger', 2600);
    return;
  }

  p.atkCd = tool.cd;
  p.stamina = Math.max(0, p.stamina - tool.stamina);
  p.atkAnim = 0.24;
  p.swingAngle = p.angle;
  game.audio.sfx(tool.melee ? 'swing' : 'bow');

  if (!tool.melee) {
    p.arrows -= 1;
    const speed = 860;
    game.projectiles.push({
      x: p.x + Math.cos(p.angle) * 22,
      y: p.y + Math.sin(p.angle) * 22 - 4,
      vx: Math.cos(p.angle) * speed,
      vy: Math.sin(p.angle) * speed,
      life: 1.4, angle: p.angle, from: 'player', dmg: tool.dmg
    });
    game.addParticles('spark', p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20, 2, { color: '#d8c9a2' });
    if (game.ui) game.ui.updateResources(game);
    return;
  }

  const reach = tool.range;
  let hits = 0;
  for (const e of game.enemies) {
    if (e.dead || e.fade) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d > reach + e.r + 4) continue;
    if (Math.abs(angleDelta(p.angle, Math.atan2(e.y - p.y, e.x - p.x))) > tool.arc / 2) continue;
    const crit = p.sneak && !e.aggro;
    const dmg = tool.dmg * (crit ? 2.25 : 1) * (0.92 + game.rng.next() * 0.16);
    damageEnemy(game, e, dmg, 'melee', crit);
    hits++;
  }
  for (const a of [...game.animals]) {
    const d = dist(p.x, p.y, a.x, a.y);
    if (d > reach + 14) continue;
    if (Math.abs(angleDelta(p.angle, Math.atan2(a.y - p.y, a.x - p.x))) > tool.arc / 2) continue;
    a.hp -= tool.dmg;
    a.hit = 0.2;
    game.addParticles('blood', a.x, a.y, 6, {});
    game.addFloat(`-${Math.round(tool.dmg)}`, a.x, a.y - 18, '#d8c9a2', 11);
    game.audio.sfx('hit');
    if (a.hp <= 0) game.killAnimal(a);
  }
  for (const t of [...game.traps]) {
    if (!t.armed) continue;
    if (dist(p.x, p.y, t.x, t.y) < reach + 12) {
      t.armed = false;
      game.traps = game.traps.filter(x => x !== t);
      p.traps += 1;
      game.addFloat('+1 snare', t.x, t.y - 10, '#c9b98d', 10);
    }
  }

  // chop / mine the nearest prop in the swing
  let prop = null, pd = Infinity;
  for (const pr of game.world.props) {
    if (pr.done) continue;
    if (!['pine', 'oak', 'dead', 'rock'].includes(pr.kind)) continue;
    const d = dist(p.x, p.y, pr.x, pr.y);
    if (d > reach + (pr.r || 14) + 18 || d > pd) continue;
    if (Math.abs(angleDelta(p.angle, Math.atan2(pr.y - p.y, pr.x - p.x))) > 1.2) continue;
    prop = pr;
    pd = d;
  }
  if (prop) {
    hitProp(game, prop, tool);
    hits++;
  }

  if (hits === 0) {
    const tx = p.x + Math.cos(p.angle) * reach * 0.65;
    const ty = p.y + Math.sin(p.angle) * reach * 0.65;
    game.addParticles('dust', tx, ty, 2, { color: '#8d886c' });
  }
  if (game.ui) game.ui.updateResources(game);
}

function hitProp(game, prop, tool) {
  const p = game.player;
  const isRock = prop.kind === 'rock';
  const dmg = isRock ? 1 : (tool.id === 'axe' ? 1.15 : 0.7);
  prop.hp -= dmg;
  if (isRock) {
    p.stone += 1;
    game.addParticles('stone', prop.x, prop.y, 5, {});
    game.audio.sfx('hit');
    game.addFloat('+1 stone', prop.x, prop.y - 14, '#b9b9ad', 10);
    if (prop.hp <= 0) {
      prop.done = true;
      p.stone += 2;
      game.addParticles('dust', prop.x, prop.y, 10, { color: '#8a8a80' });
      game.addFloat('+2 stone', prop.x, prop.y - 20, '#b9b9ad', 11);
      game.record({
        kind: 'gather', text: `You broke stone apart in ${game.locationName()}.`,
        traits: { foraged: 1 }, x: prop.x, y: prop.y
      });
    }
  } else {
    game.addParticles('leaf', prop.x, prop.y - 20, 7, { color: prop.kind === 'dead' ? '#6f6252' : '#74834f' });
    game.audio.sfx('hit');
    if (prop.hp <= 0) {
      prop.done = true;
      const wood = prop.kind === 'oak' ? 5 : prop.kind === 'dead' ? 2 : 4;
      p.wood += wood;
      game.addFloat(`+${wood} wood`, prop.x, prop.y - 18, '#c9b98d', 11);
      game.addParticles('dust', prop.x, prop.y, 12, { color: '#766a4f' });
      game.record({
        kind: 'gather',
        text: prop.kind === 'dead'
          ? `You pulled down a dead tree in ${game.locationName()}.`
          : `You felled a ${prop.kind === 'oak' ? 'broad oak' : 'pine'} in ${game.locationName()}.`,
        traits: { foraged: 1 }, x: prop.x, y: prop.y
      });
    } else {
      game.addFloat('chop', prop.x, prop.y - 22, '#c9b98d', 9);
    }
  }
  if (game.ui) game.ui.updateResources(game);
}

export function dodge(game) {
  const p = game.player;
  if (game.mode !== 'play' || p.dead || p.dashCd > 0 || p.stamina < 20) return;
  let mx = 0, my = 0;
  if (game.keys.has('KeyA') || game.keys.has('ArrowLeft')) mx -= 1;
  if (game.keys.has('KeyD') || game.keys.has('ArrowRight')) mx += 1;
  if (game.keys.has('KeyW') || game.keys.has('ArrowUp')) my -= 1;
  if (game.keys.has('KeyS') || game.keys.has('ArrowDown')) my += 1;
  mx += game.stick.x;
  my += game.stick.y;
  if (Math.hypot(mx, my) < 0.2) {
    mx = -Math.cos(p.angle);
    my = -Math.sin(p.angle);
  }
  const m = Math.hypot(mx, my) || 1;
  p.dashT = 0.2;
  p.dashX = (mx / m) * 660;
  p.dashY = (my / m) * 660;
  p.dashCd = 1.05;
  p.stamina = Math.max(0, p.stamina - 20);
  p.invuln = Math.max(p.invuln, 0.4);
  game.audio.sfx('swing');
  game.addParticles('dust', p.x, p.y + 8, 7, { color: '#a49a76' });
  const near = game.enemies.some(e => !e.dead && !e.fade && dist(e.x, e.y, p.x, p.y) < 210);
  if (near && game.t - p.lastEvade > 2) {
    p.lastEvade = game.t;
    game.addFloat('EVADE', p.x, p.y - 34, '#a9b77c', 11);
    game.record({
      kind: 'shadow', text: 'You slipped out of a Hollowed’s reach.',
      traits: { escapes: 1 }, x: p.x, y: p.y
    });
  }
  if (game.ui) game.ui.updateResources(game);
}

export function ember(game) {
  const p = game.player;
  if (game.mode !== 'play' || p.dead || p.emberCd > 0) return;
  if (p.stamina < 16) {
    game.ui.toast('Not enough breath to wave fire.', 'danger', 1400);
    return;
  }
  p.emberCd = 6;
  p.stamina -= 16;
  game.emberRing = { x: p.x, y: p.y, t: 0.7, max: 0.7 };
  game.audio.sfx('ember');
  game.shake = Math.max(game.shake, 0.25);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    game.addParticles('spark', p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18, 1, {
      color: '#f0a064', speed: 120, life: 0.5
    });
  }
  const mods = game.chronicle.mods();
  for (const e of game.enemies) {
    if (e.dead || e.fade) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d > 178) continue;
    if (mods.fireResist) {
      damageEnemy(game, e, 5, 'ember');
    } else {
      e.fear = Math.max(e.fear, 3.2);
      e.aggro = false;
      e.windup = 0;
      damageEnemy(game, e, 11, 'ember');
      game.addFloat('FEARED', e.x, e.y - 28, '#e0a05c', 10);
    }
  }
  game.record({
    kind: 'flame', text: 'You waved fire at the dark. The dark took notes.',
    traits: { flame: 1 }, x: p.x, y: p.y
  });
  if (game.ui) game.ui.updateResources(game);
}

export function placeTrap(game) {
  const p = game.player;
  if (game.mode !== 'play' || p.dead) return;
  if (p.traps <= 0) {
    game.ui.toast('No snares left. Twist more from fibre.', 'danger', 2000);
    return;
  }
  p.traps -= 1;
  game.traps.push({
    x: p.x + Math.cos(p.angle) * 26,
    y: p.y + Math.sin(p.angle) * 26,
    armed: true,
    uid: `${Date.now().toString(36)}-${game.rng.int(0, 99999)}`,
    seed: game.rng.range(0, 1000)
  });
  game.audio.sfx('ui');
  game.addParticles('dust', p.x, p.y, 4, {});
  game.addFloat('snare set', p.x, p.y - 24, '#c9b98d', 10);
  if (game.ui) game.ui.updateResources(game);
}

/* ============================================================
   ENEMIES
   ============================================================ */
export function spawnEnemy(game, opts = {}) {
  const mods = game.chronicle.mods();
  const night = game.nightLevel();
  const p = game.player;
  let x = opts.x, y = opts.y;
  if (x == null || y == null) {
    let placed = false;
    for (let i = 0; i < 40; i++) {
      const a = game.rng.range(0, TAU);
      const r = game.rng.range(620, 900);
      const tx = p.x + Math.cos(a) * r;
      const ty = p.y + Math.sin(a) * r;
      if (tx < 80 || ty < 80 || tx > game.world.w - 80 || ty > game.world.h - 80) continue;
      if (game.world.waterAt(tx, ty)) continue;
      if (dist(tx, ty, game.world.village.x, game.world.village.y) < 430) continue;
      x = tx; y = ty;
      placed = true;
      break;
    }
    if (!placed) {
      x = clamp(p.x + 650, 100, game.world.w - 100);
      y = clamp(p.y + 650, 100, game.world.h - 100);
    }
  }
  const archer = !!mods.archers && game.rng.chance(0.3);
  const hp = (archer ? 38 : 48) + night * 14 + Math.min(22, game.time.day * 2);
  const e = {
    x, y, spawnX: x, spawnY: y,
    wanderX: x, wanderY: y,
    r: archer ? 13 : 15,
    angle: game.rng.range(0, TAU),
    hp, maxHp: hp,
    speed: (archer ? 82 : 88) * mods.speed * game.rng.range(0.92, 1.1),
    sense: (238 + night * 40) * mods.sense,
    dmg: 9 + night * 4 + Math.min(6, game.time.day * 0.8),
    type: archer ? 'archer' : 'hollow',
    shield: !archer && game.chronicle.has('shielded') && game.rng.chance(0.78),
    archer,
    aggro: !!opts.aggro,
    windup: 0,
    cd: game.rng.range(0.6, 2.2),
    root: 0,
    fear: 0,
    hurt: 0,
    dead: false,
    deathT: 0,
    fade: false,
    fadeT: 0,
    aiT: 0,
    walk: game.rng.range(0, TAU),
    spawnT: 0,
    seenTraps: new Set(),
    seed: game.rng.range(0, 1000)
  };
  game.enemies.push(e);
  game.addParticles('smoke', x, y, 8, {});
  game.addParticles('soul', x, y - 8, 4, {});
  return e;
}

export function spawnWave(game, cairn, count) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + game.rng.range(-0.3, 0.3);
    const r = 235 + game.rng.range(0, 60);
    const x = clamp(cairn.x + Math.cos(a) * r, 80, game.world.w - 80);
    const y = clamp(cairn.y + Math.sin(a) * r, 80, game.world.h - 80);
    if (game.world.waterAt(x, y)) continue;
    const e = spawnEnemy(game, { x, y, aggro: true });
    e.aggro = true;
  }
  game.ui.toast('The cairn’s light wakes something.', 'danger', 3200);
}

export function updateEnemies(game, dt) {
  const p = game.player;
  const mods = game.chronicle.mods();

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    if (e.dead) {
      e.deathT += dt;
      if (e.deathT > 1.4) game.enemies.splice(i, 1);
      continue;
    }
    if (e.fade) {
      e.fadeT += dt;
      if (e.fadeT > 1.2) game.enemies.splice(i, 1);
      continue;
    }
    e.spawnT = Math.min(1, e.spawnT + dt * 2.2);
    e.walk += dt * (2.5 + e.speed / 90);
    e.hurt = Math.max(0, e.hurt - dt);
    e.root = Math.max(0, e.root - dt);
    e.fear = Math.max(0, e.fear - dt);
    e.cd = Math.max(0, e.cd - dt);
    if (p.dead) continue;

    const d = dist(e.x, e.y, p.x, p.y);
    const detection = e.sense * (p.sneak ? 0.54 : 1);

    if (!e.aggro && d < detection) {
      e.aiT -= dt;
      if (e.aiT <= 0) {
        e.aiT = 0.35;
        if (hasLineOfSight(game.world, e.x, e.y, p.x, p.y)) {
          e.aggro = true;
          game.addFloat('!', e.x, e.y - 34, '#c94f43', 17);
          game.audio.sfx('trap');
        }
      }
    }
    if (e.aggro && d > 1350) e.aggro = false;

    let dx = 0, dy = 0, speed = e.speed;

    if (e.fear > 0) {
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      dx = Math.cos(a);
      dy = Math.sin(a);
      speed *= 1.18;
    } else if (e.root > 0) {
      dx = 0; dy = 0;
      if (game.rng.chance(dt * 3)) game.addParticles('dust', e.x, e.y + 6, 1, {});
    } else if (e.aggro) {
      if (e.archer) {
        if (d < 180) {
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          dx = Math.cos(a); dy = Math.sin(a);
        } else if (d > 330) {
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          dx = Math.cos(a); dy = Math.sin(a);
        } else {
          const a = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2 * (e.seed % 2 ? 1 : -1);
          dx = Math.cos(a) * 0.55; dy = Math.sin(a) * 0.55;
        }
        if (e.cd <= 0 && d < 460 && hasLineOfSight(game.world, e.x, e.y, p.x, p.y)) {
          e.cd = 2.2 + game.rng.next() * 1.2;
          const a = Math.atan2(p.y - e.y, p.x - e.x) + game.rng.range(-0.06, 0.06);
          game.projectiles.push({
            x: e.x + Math.cos(a) * 16, y: e.y + Math.sin(a) * 16 - 8,
            vx: Math.cos(a) * 390, vy: Math.sin(a) * 390,
            life: 2, angle: a, from: 'enemy', dmg: e.dmg * 0.7
          });
          game.audio.sfx('bow');
        }
        if (d < 50 && e.windup <= 0 && e.cd <= 0.1) {
          e.windup = 0.4;
        }
      } else {
        if (e.windup > 0) {
          e.windup -= dt;
          if (e.windup <= 0) {
            if (dist(e.x, e.y, p.x, p.y) < 56) game.hurtPlayer(e.dmg, e.x, e.y);
            e.cd = 1.05;
          }
        } else if (d < 56 && e.cd <= 0) {
          e.windup = 0.44;
          e.cd = 1.25;
          e.angle = Math.atan2(p.y - e.y, p.x - e.x);
        } else if (d > 34) {
          const a = Math.atan2(p.y - e.y, p.x - e.x) + Math.sin(e.walk * 0.7) * 0.16;
          dx = Math.cos(a); dy = Math.sin(a);
        }
      }
    } else {
      e.aiT -= dt;
      if (e.aiT <= 0) {
        e.aiT = 3 + game.rng.range(0, 3);
        const a = game.rng.range(0, TAU);
        const r = game.rng.range(20, 100);
        e.wanderX = e.spawnX + Math.cos(a) * r;
        e.wanderY = e.spawnY + Math.sin(a) * r;
      }
      const a = Math.atan2(e.wanderY - e.y, e.wanderX - e.x);
      if (dist(e.x, e.y, e.wanderX, e.wanderY) > 8) {
        dx = Math.cos(a); dy = Math.sin(a);
        speed *= 0.35;
      }
    }

    if (e.hurt > 0) speed *= 0.65;
    if (e.spawnT < 1) speed *= e.spawnT;

    // separation
    for (const o of game.enemies) {
      if (o === e || o.dead || o.fade) continue;
      const ox = e.x - o.x, oy = e.y - o.y;
      const od = Math.hypot(ox, oy);
      if (od > 0 && od < 30) {
        dx += (ox / od) * 0.6;
        dy += (oy / od) * 0.6;
      }
    }

    const len = Math.hypot(dx, dy);
    if (len > 0.01) {
      const nx = e.x + (dx / len) * speed * dt;
      const ny = e.y + (dy / len) * speed * dt;
      const res = resolveCollisions(game.world, nx, ny, e.r * 0.72);
      e.x = res.x;
      e.y = res.y;
      if (e.windup <= 0) e.angle = angleLerp(e.angle, Math.atan2(dy, dx), Math.min(1, dt * 6));
    }
    if (e.aggro && e.windup > 0) {
      e.angle = angleLerp(e.angle, Math.atan2(p.y - e.y, p.x - e.x), Math.min(1, dt * 8));
    }

    // hit player on contact if lunging
    if (e.windup > 0 && e.windup < 0.2 && dist(e.x, e.y, p.x, p.y) < 60) {
      // handled at windup completion
    }
  }
}

export function damageEnemy(game, e, amount, source = 'melee', crit = false) {
  if (e.dead) return;
  const mods = game.chronicle.mods();
  let dmg = amount;
  if (source === 'arrow') dmg *= 1 - mods.rangedResist;
  if (source === 'ember' && mods.fireResist) dmg *= 0.5;
  if (e.shield && source === 'melee') dmg *= 0.92;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg;
  e.hurt = 0.22;
  e.aggro = true;
  game.addFloat(`${crit ? 'SILENT ' : ''}${dmg}`, e.x, e.y - 32, crit ? '#f0c07a' : '#e9e1cf', crit ? 13 : 11);
  game.addParticles('blood', e.x, e.y - 6, crit ? 12 : 4, {});
  game.audio.sfx('hit');

  if (source === 'arrow') {
    game.record({
      kind: 'bow',
      text: `Your arrow found a Hollowed in ${game.locationName()}.`,
      traits: { bow: 1 },
      x: e.x, y: e.y
    });
  }

  if (e.hp <= 0) {
    e.dead = true;
    e.deathT = 0;
    game.addParticles('soul', e.x, e.y - 10, 14, {});
    game.addParticles('blood', e.x, e.y, 10, {});
    game.audio.sfx('hit');
    const loc = game.locationName();
    let text = `You put a Hollowed down in ${loc}.`;
    if (source === 'arrow') text = `An arrow put a Hollowed down in ${loc}.`;
    if (source === 'trap') text = `Your snare took a Hollowed in ${loc}.`;
    if (crit) text = `You killed a Hollowed silently in ${loc}.`;
    const traits = { kills: 1 };
    if (crit) traits.shadow = 1;
    game.record({ kind: 'kill', text, traits, x: e.x, y: e.y });
    if (crit && game.ui) game.ui.toast('A silent kill. The dark did not hear you coming.', 'good', 2400);
    if (e.archer) {
      game.player.arrows += 2;
      game.addFloat('+2 arrows', e.x, e.y - 18, '#d8c9a2', 10);
    }
  }
}

/* ============================================================
   PROJECTILES & TRAPS
   ============================================================ */
function solidAt(world, x, y) {
  const cell = world.colCell;
  const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
  for (let gx = cx - 1; gx <= cx + 1; gx++) {
    for (let gy = cy - 1; gy <= cy + 1; gy++) {
      const list = world.colGrid.get(`${gx},${gy}`);
      if (!list) continue;
      for (const c of list) {
        if (c.prop && (c.prop.done || c.prop.kind === 'garden' || c.prop.kind === 'lantern')) continue;
        if ((x - c.x) ** 2 + (y - c.y) ** 2 < (c.r + 2) ** 2) return true;
      }
    }
  }
  return false;
}

export function updateProjectiles(game, dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const pr = game.projectiles[i];
    pr.life -= dt;
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    let remove = pr.life <= 0;
    if (pr.x < 0 || pr.y < 0 || pr.x > game.world.w || pr.y > game.world.h) remove = true;

    if (!remove && solidAt(game.world, pr.x, pr.y)) {
      remove = true;
      game.addParticles('dust', pr.x, pr.y, 3, { color: '#8d886c' });
    }

    if (!remove && pr.from === 'player') {
      for (const e of game.enemies) {
        if (e.dead || e.fade) continue;
        if (dist(pr.x, pr.y, e.x, e.y) < e.r + 7) {
          damageEnemy(game, e, pr.dmg, 'arrow');
          remove = true;
          break;
        }
      }
      if (!remove) {
        for (const a of [...game.animals]) {
          if (dist(pr.x, pr.y, a.x, a.y) < 16) {
            a.hp -= pr.dmg;
            a.hit = 0.2;
            game.addParticles('blood', a.x, a.y, 6, {});
            game.addFloat(`-${Math.round(pr.dmg)}`, a.x, a.y - 18, '#d8c9a2', 11);
            if (a.hp <= 0) game.killAnimal(a, true);
            remove = true;
            break;
          }
        }
      }
    } else if (!remove && pr.from === 'enemy') {
      const p = game.player;
      if (dist(pr.x, pr.y, p.x, p.y) < p.r + 5) {
        game.hurtPlayer(pr.dmg, pr.x, pr.y);
        remove = true;
      }
    }

    if (remove) game.projectiles.splice(i, 1);
  }
}

export function updateTraps(game, dt) {
  const mods = game.chronicle.mods();
  for (const t of game.traps) {
    if (!t.armed) continue;
    for (const e of game.enemies) {
      if (e.dead || e.fade || e.root > 0) continue;
      if (dist(e.x, e.y, t.x, t.y) > 38) continue;
      if (mods.trapSense > 0 && !e.seenTraps.has(t.uid) && game.rng.chance(0.72)) {
        e.seenTraps.add(t.uid);
        game.addFloat('AVOIDED', t.x, t.y - 16, '#8f9bc4', 9);
        continue;
      }
      t.armed = false;
      e.root = 3.4;
      e.windup = 0;
      e.aggro = true;
      game.audio.sfx('trap');
      game.addParticles('dust', t.x, t.y, 10, {});
      game.addParticles('blood', t.x, t.y, 5, {});
      damageEnemy(game, e, 20, 'trap');
      game.record({
        kind: 'snare', text: `A snare caught a Hollowed in ${game.locationName()}.`,
        traits: { snare: 1 }, x: t.x, y: t.y
      });
      break;
    }
  }
}
