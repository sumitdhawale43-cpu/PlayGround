export const GRAVITY = 980;
export const WIND_MULT = 2.15;

export const WEAPONS = {
  bazooka: {
    id: "bazooka",
    label: "BAZOOKA",
    speed: 1180,
    minSpeed: 300,
    radius: 62,
    damage: 46,
    fuse: 0,
    bounces: 0,
    trail: "#ffd9a0",
  },
  grenade: {
    id: "grenade",
    label: "GRENADE",
    speed: 980,
    minSpeed: 280,
    radius: 76,
    damage: 62,
    fuse: 2.55,
    bounces: 3,
    trail: "#bfe6ff",
  },
};

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

export function pointInRect(x, y, r, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

export function circleRect(cx, cy, cr, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= cr * cr;
}

export function distToRect(x, y, r) {
  const nx = clamp(x, r.x, r.x + r.w);
  const ny = clamp(y, r.y, r.y + r.h);
  return Math.hypot(x - nx, y - ny);
}

export function segmentRect(x1, y1, x2, y2, r) {
  // Liang-Barsky style clip test.
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function projectileSpeed(weapon, power) {
  const spec = WEAPONS[weapon];
  return spec.minSpeed + (spec.speed - spec.minSpeed) * clamp(power, 0, 1);
}

function bounceTerrain(px, py, vx, vy, terrain) {
  const sx = terrain.solidWorld(px - 6, py) ? 1 : 0;
  const sx2 = terrain.solidWorld(px + 6, py) ? 1 : 0;
  const sy = terrain.solidWorld(px, py - 6) ? 1 : 0;
  const sy2 = terrain.solidWorld(px, py + 6) ? 1 : 0;
  let nx = sx - sx2;
  let ny = sy - sy2;
  const len = Math.hypot(nx, ny);
  if (len < 0.001) {
    ny = -1;
    nx = 0;
  } else {
    nx /= len;
    ny /= len;
  }
  const dot = vx * nx + vy * ny;
  if (dot < 0) {
    vx -= 2 * dot * nx;
    vy -= 2 * dot * ny;
  }
  const speed = Math.hypot(vx, vy);
  if (speed > 0) {
    vx = (vx / speed) * speed * 0.42;
    vy = (vy / speed) * speed * 0.42;
  }
  return { vx, vy, nx, ny };
}

function bounceRect(px, py, vx, vy, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = (px - cx) / Math.max(1, rect.w / 2);
  const dy = (py - cy) / Math.max(1, rect.h / 2);
  let nx = 0;
  let ny = 0;
  if (Math.abs(dx) > Math.abs(dy)) nx = Math.sign(dx) || 1;
  else ny = Math.sign(dy) || -1;
  const dot = vx * nx + vy * ny;
  if (dot < 0) {
    vx -= 2 * dot * nx;
    vy -= 2 * dot * ny;
  }
  vx *= 0.42;
  vy *= 0.42;
  return { vx, vy, nx, ny };
}

/**
 * Predict a shot. Returns the flight path and the impact details.
 * Used by both the aiming preview and the CPU planner.
 */
export function simulateShot({
  x, y, angle, power, weapon = "bazooka", wind = 0,
  terrain, structures = [], worms = [], ignoreWormId = null,
  ownerTeam = null, maxTime = 7,
}) {
  const spec = WEAPONS[weapon];
  const speed = projectileSpeed(weapon, power);
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let px = x;
  let py = y;
  let t = 0;
  let fuse = spec.fuse || 0;
  let bounces = 0;
  const points = [{ x, y }];

  while (t < maxTime) {
    const sp = Math.hypot(vx, vy);
    const dt = Math.min(1 / 45, 4.2 / Math.max(1, sp));
    vx += wind * WIND_MULT * dt;
    vy += GRAVITY * dt;
    px += vx * dt;
    py += vy * dt;
    t += dt;
    if (spec.fuse) fuse -= dt;

    if (px < -160 || px > 1440 || py > 820 || py < -2200) {
      return { points, impact: { x: px, y: py, type: "miss" }, hitWorm: null, bounces };
    }

    let hit = null;
    if (terrain.solidWorld(px, py)) {
      hit = { type: "terrain" };
    } else {
      for (const s of structures) {
        if (s.dead) continue;
        // Launch clearance: a shot leaves through its own team's fresh build.
        if (ownerTeam != null && s.team === ownerTeam && t < 0.45) continue;
        for (const r of s.rects) {
          if (pointInRect(px, py, r, -1)) { hit = { type: "structure", s, rect: r }; break; }
        }
        if (hit) break;
      }
    }
    if (!hit) {
      for (const w of worms) {
        if (!w.alive) continue;
        if (ignoreWormId != null && w.id === ignoreWormId && t < 0.2) continue;
        const d = Math.hypot(px - w.x, py - w.y);
        if (d < w.r + 3) { hit = { type: "worm", w }; break; }
      }
    }

    if (hit) {
      if (spec.bounces > 0 && bounces < spec.bounces && hit.type !== "worm") {
        let res;
        if (hit.type === "terrain") res = bounceTerrain(px, py, vx, vy, terrain);
        else res = bounceRect(px, py, vx, vy, hit.rect);
        vx = res.vx;
        vy = res.vy;
        px += res.nx * 3;
        py += res.ny * 3;
        bounces++;
        points.push({ x: px, y: py, bounce: true });
        continue;
      }
      if (hit.type === "structure" && hit.s && hit.s.type === "crate") {
        return { points, impact: { x: px, y: py, type: "crate", s: hit.s }, hitWorm: null, bounces };
      }
      return {
        points,
        impact: { x: px, y: py, type: hit.type, s: hit.s || null },
        hitWorm: hit.type === "worm" ? hit.w : null,
        bounces,
      };
    }

    if (spec.fuse && fuse <= 0) {
      return { points, impact: { x: px, y: py, type: "fuse" }, hitWorm: null, bounces };
    }

    const last = points[points.length - 1];
    if (!last || (px - last.x) ** 2 + (py - last.y) ** 2 > 34) points.push({ x: px, y: py });
  }

  return { points, impact: { x: px, y: py, type: "timeout" }, hitWorm: null, bounces };
}
