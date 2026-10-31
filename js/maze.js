/* ============================================================
   Level generation, pathfinding, line of sight
   ============================================================ */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = list[i]; list[i] = list[j]; list[j] = t;
  }
  return list;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

const DIRS = [[2, 0], [-2, 0], [0, 2], [0, -2]];

function isRoom(x, y) {
  return (x & 1) === 1 && (y & 1) === 1;
}

export function bfsDistances(level, sx, sy) {
  const { w, h, grid } = level;
  const dist = new Int16Array(w * h).fill(-1);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h || grid[sy * w + sx] !== 0) return dist;
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  dist[sy * w + sx] = 0;
  queue[tail++] = sy * w + sx;
  while (head < tail) {
    const cur = queue[head++];
    const x = cur % w, y = (cur / w) | 0;
    const d = dist[cur];
    if (x + 1 < w && grid[cur + 1] === 0 && dist[cur + 1] < 0) { dist[cur + 1] = d + 1; queue[tail++] = cur + 1; }
    if (x - 1 >= 0 && grid[cur - 1] === 0 && dist[cur - 1] < 0) { dist[cur - 1] = d + 1; queue[tail++] = cur - 1; }
    if (y + 1 < h && grid[cur + w] === 0 && dist[cur + w] < 0) { dist[cur + w] = d + 1; queue[tail++] = cur + w; }
    if (y - 1 >= 0 && grid[cur - w] === 0 && dist[cur - w] < 0) { dist[cur - w] = d + 1; queue[tail++] = cur - w; }
  }
  return dist;
}

export function findPath(level, from, to) {
  const { w, h, grid } = level;
  const startIdx = (from.y | 0) * w + (from.x | 0);
  const goalIdx = (to.y | 0) * w + (to.x | 0);
  if (startIdx === goalIdx) return [];
  if (grid[goalIdx] !== 0 || grid[startIdx] !== 0) return [];
  const prev = new Int32Array(w * h).fill(-1);
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  queue[tail++] = startIdx;
  seen[startIdx] = 1;
  let found = false;
  while (head < tail) {
    const cur = queue[head++];
    if (cur === goalIdx) { found = true; break; }
    const x = cur % w, y = (cur / w) | 0;
    const neigh = [
      cur + 1, cur - 1, cur + w, cur - w,
    ];
    for (let i = 0; i < 4; i++) {
      const n = neigh[i];
      if (n < 0 || n >= w * h) continue;
      const nx = n % w, ny = (n / w) | 0;
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      if (grid[n] !== 0 || seen[n]) continue;
      seen[n] = 1;
      prev[n] = cur;
      queue[tail++] = n;
    }
  }
  if (!found) return [];
  const path = [];
  let cur = goalIdx;
  while (cur !== startIdx && cur >= 0) {
    path.push({ x: cur % w, y: (cur / w) | 0 });
    cur = prev[cur];
  }
  path.reverse();
  return path;
}

export function hasLineOfSight(level, x0, y0, x1, y1) {
  const { w, h, grid } = level;
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return true;
  const steps = Math.max(2, Math.ceil(dist / 0.07));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + dx * t, y = y0 + dy * t;
    const cx = x | 0, cy = y | 0;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) return false;
    if (grid[cy * w + cx] !== 0) return false;
  }
  return true;
}

export function generateLevel(seed = (Math.random() * 0xffffffff) >>> 0) {
  const rand = mulberry32(seed);
  const w = 19, h = 19;
  const grid = new Uint8Array(w * h).fill(1);
  const at = (x, y) => y * w + x;

  // Carve a perfect maze on odd coordinates.
  grid[at(1, 1)] = 0;
  const stack = [[1, 1]];
  const visited = new Set(['1,1']);
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const dirs = shuffle(DIRS.slice(), rand);
    let moved = false;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && !visited.has(nx + ',' + ny)) {
        grid[at(cx + dx / 2, cy + dy / 2)] = 0;
        grid[at(nx, ny)] = 0;
        visited.add(nx + ',' + ny);
        stack.push([nx, ny]);
        moved = true;
        break;
      }
    }
    if (!moved) stack.pop();
  }

  const level = { seed, w, h, grid, wallType: null };

  const rooms = [];
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) rooms.push({ x, y });
  }

  const openNeighbors = (x, y) => {
    let n = 0;
    if (grid[at(x + 1, y)] === 0) n++;
    if (grid[at(x - 1, y)] === 0) n++;
    if (grid[at(x, y + 1)] === 0) n++;
    if (grid[at(x, y - 1)] === 0) n++;
    return n;
  };

  // Braid some dead ends so the maze has loops and fewer frustrating pockets.
  const deadEnds = rooms.filter(r => openNeighbors(r.x, r.y) === 1);
  shuffle(deadEnds, rand);
  for (const room of deadEnds) {
    if (rand() > 0.6) continue;
    const choices = shuffle([[0, -1], [1, 0], [0, 1], [-1, 0]], rand);
    for (const [dx, dy] of choices) {
      const wx = room.x + dx, wy = room.y + dy;
      const ox = room.x + dx * 2, oy = room.y + dy * 2;
      if (ox <= 0 || oy <= 0 || ox >= w - 1 || oy >= h - 1) continue;
      if (grid[at(wx, wy)] === 1 && grid[at(ox, oy)] === 0) {
        grid[at(wx, wy)] = 0;
        break;
      }
    }
  }

  // A couple of extra breaches for flow.
  for (let i = 0; i < 14; i++) {
    const x = 2 + ((rand() * ((w - 5) / 2)) | 0) * 2;
    const y = 2 + ((rand() * ((h - 5) / 2)) | 0) * 2;
    const horizontal = rand() < 0.5;
    const wx = horizontal ? x + 1 : x;
    const wy = horizontal ? y : y + 1;
    const ax = horizontal ? x : x;
    const ay = horizontal ? y : y;
    const bx = horizontal ? x + 2 : x;
    const by = horizontal ? y : y + 2;
    if (ax > 0 && ay > 0 && bx < w && by < h &&
        grid[at(ax, ay)] === 0 && grid[at(bx, by)] === 0 && grid[at(wx, wy)] === 1) {
      grid[at(wx, wy)] = 0;
    }
  }

  // Wall material zones.
  const wallType = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[at(x, y)] === 0) continue;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        wallType[at(x, y)] = 1;
        continue;
      }
      const zone = hash2((x / 3) | 0, (y / 3) | 0);
      const rare = hash2(x * 7.31, y * 3.77);
      if (rare > 0.965) wallType[at(x, y)] = 4;
      else if (zone < 0.54) wallType[at(x, y)] = 1;
      else if (zone < 0.78) wallType[at(x, y)] = 2;
      else wallType[at(x, y)] = 3;
    }
  }
  level.wallType = wallType;

  // Pick a dead-end start room, or a corner.
  const starts = rooms.filter(r => openNeighbors(r.x, r.y) === 1);
  const startRoom = starts.length ? starts[(rand() * starts.length) | 0] : { x: 1, y: 1 };
  level.start = { x: startRoom.x, y: startRoom.y };

  const distFromStart = bfsDistances(level, startRoom.x, startRoom.y);

  // Exit = the farthest reachable room.
  let exitRoom = startRoom, best = -1;
  for (const room of rooms) {
    const d = distFromStart[at(room.x, room.y)];
    if (d > best) { best = d; exitRoom = room; }
  }
  level.exit = { x: exitRoom.x, y: exitRoom.y };

  // Sigils: distant rooms, spread apart.
  const candidates = rooms
    .filter(r => !(r.x === startRoom.x && r.y === startRoom.y))
    .filter(r => !(r.x === exitRoom.x && r.y === exitRoom.y))
    .filter(r => distFromStart[at(r.x, r.y)] > 4)
    .sort((a, b) => distFromStart[at(b.x, b.y)] - distFromStart[at(a.x, a.y)]);

  const sigils = [];
  const sigilDistances = [];
  for (const room of candidates) {
    if (sigils.length >= 3) break;
    const d = bfsDistances(level, room.x, room.y);
    let ok = true;
    for (const s of sigils) {
      const sd = d[at(s.x, s.y)];
      if (sd < 0 || sd < 7) { ok = false; break; }
    }
    if (!ok) continue;
    sigils.push({ x: room.x, y: room.y });
    sigilDistances.push(distFromStart[at(room.x, room.y)]);
  }
  // Fallbacks if spacing was too strict.
  for (const room of candidates) {
    if (sigils.length >= 3) break;
    if (sigils.some(s => s.x === room.x && s.y === room.y)) continue;
    sigils.push({ x: room.x, y: room.y });
  }
  level.sigils = sigils;

  // Monster starts far away, preferably on the far side of the exit.
  const monsterCandidates = rooms
    .filter(r => !(r.x === startRoom.x && r.y === startRoom.y))
    .filter(r => !(r.x === exitRoom.x && r.y === exitRoom.y))
    .filter(r => !sigils.some(s => s.x === r.x && s.y === r.y))
    .filter(r => distFromStart[at(r.x, r.y)] > 8)
    .sort((a, b) => distFromStart[at(b.x, b.y)] - distFromStart[at(a.x, a.y)]);
  level.monsterSpawn = monsterCandidates.length
    ? monsterCandidates[(rand() * Math.min(monsterCandidates.length, 8)) | 0]
    : { x: exitRoom.x, y: exitRoom.y };

  level.distFromStart = distFromStart;

  // Player facing: toward an open neighbour.
  const facingOptions = [];
  if (grid[at(startRoom.x + 1, startRoom.y)] === 0) facingOptions.push(0);
  if (grid[at(startRoom.x, startRoom.y + 1)] === 0) facingOptions.push(Math.PI / 2);
  if (grid[at(startRoom.x - 1, startRoom.y)] === 0) facingOptions.push(Math.PI);
  if (grid[at(startRoom.x, startRoom.y - 1)] === 0) facingOptions.push(-Math.PI / 2);
  // Face away from the monster spawn when possible.
  const toMonster = Math.atan2(level.monsterSpawn.y - startRoom.y, level.monsterSpawn.x - startRoom.x);
  facingOptions.sort((a, b) => {
    const da = Math.abs(Math.atan2(Math.sin(a - toMonster), Math.cos(a - toMonster)));
    const db = Math.abs(Math.atan2(Math.sin(b - toMonster), Math.cos(b - toMonster)));
    return db - da;
  });
  level.startAngle = facingOptions.length ? facingOptions[0] : 0;

  // Decorative eyes in side rooms.
  const eyeRooms = shuffle(rooms.filter(r =>
    !sigils.some(s => s.x === r.x && s.y === r.y) &&
    !(r.x === startRoom.x && r.y === startRoom.y) &&
    !(r.x === exitRoom.x && r.y === exitRoom.y)
  ), rand).slice(0, 4);
  level.watchers = eyeRooms.map(r => ({
    x: r.x + 0.5 + (rand() - 0.5) * 0.35,
    y: r.y + 0.5 + (rand() - 0.5) * 0.35,
    height: 0.92 + rand() * 0.18,
    phase: rand() * Math.PI * 2,
  }));

  level.isWall = (x, y) => {
    const cx = Math.floor(x), cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) return true;
    return grid[cy * w + cx] !== 0;
  };

  return level;
}

export function cellOf(x, y) {
  return { x: Math.floor(x), y: Math.floor(y) };
}

export function cellCenter(c) {
  return { x: c.x + 0.5, y: c.y + 0.5 };
}
