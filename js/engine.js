/* ============================================================
   LAST KINGDOM – math / path helpers
   ============================================================ */

function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function distTo(e, o) {
  return dist(e.x, e.y, o.x, o.y);
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function clamp(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* Advance an enemy along its waypoint path. Returns true when the
   enemy has reached the kingdom keep (base). */
function enemyStep(e, dt) {
  const path = e.path;
  let arrivedBase = false;
  if (e.wi < path.length - 1) {
    const t = path[e.wi];
    const d = Math.hypot(t.x - e.x, t.y - e.y);
    const speed = e.speed;
    if (d <= speed * dt) {
      e.x = t.x;
      e.y = t.y;
      e.wi += 1;
    } else {
      const s = (speed * dt) / d;
      e.x += (t.x - e.x) * s;
      e.y += (t.y - e.y) * s;
    }
  }
  if (e.wi >= path.length - 1) arrivedBase = true;
  return arrivedBase;
}
