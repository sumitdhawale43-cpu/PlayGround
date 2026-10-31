/* ============================================================
   GRAVITY BREAK — headless test & validation
   Run: node test/validate.js
   1) Static level validation (bounds, spike anchoring, overlaps)
   2) Physics smoke test (simulate every level, no NaN/escaping)
   3) Conservative reachability check (goal, checkpoints, shards)
      — models: walk, jump (reaches tuned to real physics),
        gravity flip (floor<->ceiling in a clear column),
        walk-off falls, and riding moving platforms (bridges).
   ============================================================ */
'use strict';

var LV = require('../js/levels.js');
var ENT = require('../js/entities.js');
var T = LV.TILE;

var failures = 0, warnings = 0;
function fail(msg) { console.error('  ✗ ' + msg); failures++; }
function warn(msg) { console.warn('  ~ ' + msg); warnings++; }
function ok(msg) { console.log('  ✓ ' + msg); }

/* ---------- build mover virtual-floor map ---------- */
function moverFloors(L) {
  // map "tx,ty" -> true for standable mover endpoints
  var map = {};
  L.movers.forEach(function (m) {
    if (m.axis === 'x') {
      var x0 = m.tx, x1 = Math.floor((m.tx * T + m.travel) / T);
      for (var x = x0; x <= x1 + 2; x++) addKey(map, x, m.ty);
    } else {
      var y0 = m.ty, y1 = m.ty + Math.round(m.travel / T);
      for (var y = y0; y <= y1; y++) for (var x = m.tx; x <= m.tx + 2; x++) addKey(map, x, y);
    }
  });
  return map;
}
function addKey(map, x, y) { map[x + ',' + y] = true; }

function makeAccessors(L) {
  var mf = moverFloors(L);
  function g(x, y) {
    if (x < 0 || y < 0 || x >= L.w || y >= L.h) return 1;
    return L.grid[y * L.w + x];
  }
  var solid = function (x, y) { return g(x, y) === 1; };
  var standSolid = function (x, y) { return solid(x, y) || mf[x + ',' + y] === true; };
  var empty = function (x, y) { return g(x, y) === 0; };
  return { g: g, solid: solid, standSolid: standSolid, empty: empty };
}

/* ============================================================
   1) STATIC VALIDATION
   ============================================================ */
function staticValidate(L) {
  console.log('\nLEVEL ' + (L.index + 1) + ' — ' + L.name);
  var acc = makeAccessors(L);
  var issues = 0;

  function bounds(x, y, what) {
    if (x < 0 || y < 0 || x >= L.w || y >= L.h) { fail(what + ' out of bounds: ' + x + ',' + y); issues++; return false; }
    return true;
  }

  // start / goal
  bounds(L.start.tx, L.start.ty, 'start');
  bounds(L.goal.tx, L.goal.ty, 'goal');
  if (acc.g(L.start.tx, L.start.ty) === 1) { fail('start inside solid'); issues++; }
  if (acc.g(L.goal.tx, L.goal.ty) === 1) { fail('goal inside solid'); issues++; }

  // spikes anchored
  L.spikes.forEach(function (s) {
    if (!bounds(s.tx, s.ty, 'spike')) { issues++; return; }
    if (s.dir === 'up' && !acc.solid(s.tx, s.ty + 1)) { fail('floor spike @' + s.tx + ',' + s.ty + ' has no floor beneath'); issues++; }
    if (s.dir === 'down' && !acc.solid(s.tx, s.ty - 1)) { fail('ceiling spike @' + s.tx + ',' + s.ty + ' has no ceiling above'); issues++; }
  });

  // lasers in bounds
  L.lasers.forEach(function (ls) {
    if (ls.axis === 'v' && ls.ty + ls.len > L.h) { fail('vertical laser @' + ls.tx + ' exceeds level bottom'); issues++; }
    if (ls.axis === 'h' && ls.tx + ls.len > L.w) { fail('horizontal laser @' + ls.tx + ' exceeds level right'); issues++; }
  });

  // shards legal (not in solid, not in spike)
  L.shards.forEach(function (sh) {
    if (!bounds(sh.tx, sh.ty, 'shard')) { issues++; return; }
    if (acc.g(sh.tx, sh.ty) !== 0) { fail('shard @' + sh.tx + ',' + sh.ty + ' buried in solid/hazard'); issues++; }
  });

  // checkpoints grounded
  L.checkpoints.forEach(function (cp) {
    var grounded = false;
    for (var d = 1; d <= 4; d++) if (acc.standSolid(cp.tx, cp.ty + d)) { grounded = true; break; }
    if (!grounded) { fail('checkpoint @' + cp.tx + ',' + cp.ty + ' not near ground'); issues++; }
  });

  // sectors sanity: lasers aligned to ground level should have floor
  if (issues === 0) ok('static checks passed (' + L.shards.length + ' shards, ' +
    L.checkpoints.length + ' checkpoints, ' + L.lasers.length + ' lasers)');
  return issues;
}

/* ============================================================
   2) PHYSICS SMOKE TEST
   ============================================================ */
function physicsSmoke(allLevels) {
  console.log('\nPHYSICS SMOKE TEST');
  allLevels.forEach(function (Ldef) {
    var L = LV.compile(Ldef, 0);
    var sx = L.start.tx * T + T / 2, sy = (L.start.ty + 1) * T;
    var player = new ENT.Player(sx, sy);
    var plats = L.movers.map(function (m) { return new ENT.Platform(m); });
    player.setWorld({
      isSolidPx: function (px, py) {
        var tx = Math.floor(px / T), ty = Math.floor(py / T);
        if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) return true;
        return L.grid[ty * L.w + tx] === 1;
      },
      plats: plats
    });
    var rngSeed = 42, rng = function () { rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff; return (rngSeed / 0x7fffffff); };
    var input = { left: false, right: false, jump: false, jumpPressed: false, flipPressed: false };
    var bad = false, msg = '';
    try {
      for (var f = 0; f < 1800; f++) {
        plats.forEach(function (m) { m.update(1 / 60); });
        if (player.rider) { player.x += player.rider.dx; player.y += player.rider.dy; }
        input.right = rng() < 0.6; input.left = !input.right && rng() < 0.3;
        if (f % 40 === 0) input.jumpPressed = true;
        if (f % 120 === 0) input.flipPressed = true;
        input.jump = input.jumpPressed || f % 25 < 12;
        player.update(1 / 60, input);
        player.resolvePlatforms(L.movers);
        if (!isFinite(player.x) || !isFinite(player.y)) { bad = true; msg = 'NaN position at frame ' + f; break; }
        // center must never end inside a solid tile
        var ctx = Math.floor((player.x + player.w / 2) / T), cty = Math.floor((player.y + player.h / 2) / T);
        if (ctx >= 0 && cty >= 0 && ctx < L.w && cty < L.h && L.grid[cty * L.w + ctx] === 1) {
          bad = true; msg = 'player tunnelled into solid at ' + ctx + ',' + cty + ' (frame ' + f + ')';
          break;
        }
      }
    } catch (e) { bad = true; msg = 'exception: ' + (e && e.message); }
    // movers must stay sane
    L.movers.forEach(function (m) {
      if (!isFinite(m.x) || !isFinite(m.y)) { bad = true; msg = 'platform NaN'; }
    });
    if (bad) fail(L.name + ': ' + msg); else ok(L.name);
  });
}

/* ============================================================
   3) REACHABILITY (conservative)
   states: x,surfaceRow,type('f'=floor,'c'=ceiling)
   ============================================================ */
function reachability(L) {
  var acc = makeAccessors(L);
  var OK = true, why = '';

  function standFloor(x, r) {
    if (r < 2 || r >= L.h) return false;
    if (!acc.standSolid(x, r)) return false;
    return acc.empty(x, r - 1) && acc.empty(x, r - 2);
  }
  function standCeil(x, r) {
    if (r < 0 || r >= L.h) return false;
    if (!acc.solid(x, r)) return false;      // ceiling surface: tiles only (not movers)
    return acc.empty(x, r + 1) && acc.empty(x, r + 2);
  }
  function floorDrop(x, fromRow) {
    for (var r = Math.max(2, fromRow); r < L.h; r++) {
      if (acc.standSolid(x, r)) {
        if (standFloorQuar2(x, r)) return r;
      }
    }
    return -1;
  }
  function standFloorQuar2(x, r) { return standFloor(x, r); }

  var nodes = [];
  var visited = [];
  var edges = [];
  var seen = {};
  function key(n) { return n[0] + ',' + n[1] + ',' + n[2]; }
  function pushNode(x, r, t) {
    var k = key([x, r, t]);
    if (!seen[k]) { seen[k] = true; visited.push([x, r, t]); nodes.push([x, r, t]); return true; }
    return false;
  }

  // seed from spawn
  var sxT = L.start.tx, syFoot = L.start.ty + 1;
  var seedOk = false;
  for (var r = syFoot; r <= syFoot + 6; r++) {
    if (standFloor(sxT, r)) { pushNode(sxT, r, 'f'); seedOk = true; break; }
  }
  if (!seedOk) return { ok: false, why: 'cannot stand at spawn column' };

  var reachBase = [7, 6, 4, 3]; // dUp 0..3 -> horizontal reach (full-speed physics, conservative)
  var guard = 0;
  while (nodes.length > 0 && guard++ < 60000) {
    var n = nodes.pop();
    var x = n[0], r = n[1], t = n[2];
    var isFloor = t === 'f';

    function standAt(xx, rr) { return isFloor ? standFloor(xx, rr) : standCeil(xx, rr); }

    // --- walk ---
    [1, -1].forEach(function (d) {
      var xx = x + d;
      if (xx < 0 || xx >= L.w) return;
      if (standAt(xx, r)) pushNode(xx, r, t);
      else if (isFloor) {
        var fr = floorDrop(xx, r + 1);
        if (fr > 0 && fr - r <= 16) pushNode(xx, fr, 'f');
      } else {
        // ceiling: walking off edge -> fall to floor
        var fr = floorDrop(xx, r + 3);
        if (fr > 0 && fr - r <= 17) pushNode(xx, fr, 'f');
      }
    });

    // --- jump ---
    if (isFloor) {
      for (var dUp = 0; dUp <= 3; dUp++) {
        // headroom at launch
        var clear = true;
        for (var i = 1; i <= dUp + 1; i++) if (!acc.empty(x, r - 1 - i)) { clear = false; break; }
        if (!clear) continue;
        var base = reachBase[dUp];
        for (var dx = -base; dx <= base; dx++) {
          var xx = x + dx;
          if (xx < 0 || xx >= L.w || dx === 0) continue;
          for (var rL = r - 1 - dUp; rL <= r + 6; rL++) {
            if (standFloor(xx, rL)) {
              var dDown = rL - r;
              var reach = dDown > dUp ? base + Math.min(3, dDown - dUp) : base;
              if (Math.abs(dx) <= reach) {
                if (pushNode(xx, rL, 'f')) edges.push({ x0: x, x1: xx, r0: r, r1: rL });
                break;
              }
            }
          }
        }
      }
    }

    // --- flip ---
    if (isFloor) {
      var rsF = -1;
      for (var r2 = r - 1; r2 >= 0 && r2 >= r - 17; r2--) {
        if (acc.solid(x, r2)) { rsF = r2; break; }
        if (!acc.empty(x, r2)) { rsF = -1; break; } // spike blocks the shaft
      }
      if (rsF >= 0 && standCeil(x, rsF)) pushNode(x, rsF, 'c');
    } else {
      var rb = -1;
      for (var r3 = r + 1; r3 <= Math.min(L.h - 1, r + 17); r3++) {
        if (acc.solid(x, r3)) { rb = r3; break; }
        if (!acc.empty(x, r3)) { rb = -1; break; }
      }
      if (rb > 0 && standFloor(x, rb)) pushNode(x, rb, 'f');
    }
  }

  // ---- check targets ----
  function nodeInfo(n) {
    var isFloor = n[2] === 'f';
    var body = isFloor ? [[n[0], n[1] - 1], [n[0], n[1] - 2]] : [[n[0], n[1] + 1], [n[0], n[1] + 2]];
    var winRows = isFloor ? [] : [];
    for (var i = -5; i <= -1; i++) winRows.push([n[0], n[1] + (isFloor ? i : -i)]);
    return { body: body, win: winRows, isFloor: isFloor, x: n[0] };
  }

  function report(list, label,超额) {}
  function check(list, label, gather) {
    var missing = [];
    list.forEach(function (item, idx) {
      var hit = gather(item);
      if (!hit) missing.push(idx);
    });
    if (missing.length === 0) ok(label + ': all reachable');
    else { fail(label + ': unreachable at tiles ' + missing.map(function (i) { return list[i].tx + ',' + list[i].ty; }).join(' | ')); return false; }
    return true;
  }

  // goal: column within reach of any node
  var goalOk = visited.some(function (n) {
    var info = nodeInfo(n);
    var rowsBody = info.body.map(function (b) { return b[1]; });
    return Math.abs(n[0] - L.goal.tx) <= 1 &&
      [L.goal.ty, L.goal.ty + 1].some(function (gr) {
        return rowsBody.indexOf(gr) >= 0 || info.win.some(function (w) { return w[0] === n[0] && w[1] === gr && Math.abs(n[0] - L.goal.tx) <= 3; });
      });
  });
  if (goalOk) ok('goal reachable');
  else fail('GOAL reachability failed');

  // checkpoints
  var cpOk = check(L.checkpoints, 'checkpoints', function (cp) {
    return visited.some(function (n) {
      var rows = nodeInfo(n).body.map(function (b) { return b[1]; });
      return n[0] === cp.tx && (rows.indexOf(cp.ty) >= 0 || rows.indexOf(cp.ty + 1) >= 0);
    });
  });

  // shards
  var shOk = check(L.shards, 'shards', function (sh) {
    return visited.some(function (n) {
      var info = nodeInfo(n);
      var rowsBody = info.body.map(function (b) { return b[1]; });
      // inside the body -> precise column overlap
      if (rowsBody.indexOf(sh.ty) >= 0) return n[0] === sh.tx;
      // inside the jump-apex band -> mid-flight collection
      return info.win.some(function (w) { return w[1] === sh.ty; }) && Math.abs(n[0] - sh.tx) <= 4;
    }) || edges.some(function (e) {
      // inside a jump arc (strictly between its endpoints, below launch height)
      var lo = Math.min(e.x0, e.x1), hi = Math.max(e.x0, e.x1);
      var top = Math.min(e.r0, e.r1);
      return sh.tx > lo && sh.tx < hi &&
        sh.ty >= top - 6 && sh.ty <= top - 1;
    });
  });

  var rr = { ok: goalOk && cpOk && shOk };
  if (!rr.ok && !why) rr.why = 'see failures above';
  return rr;
}

/* ============================================================ */
function main() {
  console.log('=== GRAVITY BREAK — validation suite ===');
  var issues = 0;
  LV.LEVELS.forEach(function (def, i) {
    var L = LV.compile(def, i);
    issues += staticValidate(L);
    var r = reachability(L);
    if (!r.ok) fail('reachability: ' + L.name + ' — ' + r.why);
  });
  physicsSmoke(LV.LEVELS);

  console.log('\n=========================================');
  console.log((failures === 0 ? '✔ ALL PASSED' : '✗ FAILURES: ' + failures) + ' · warnings: ' + warnings);
  if (failures > 0) process.exit(1);
}

main();
