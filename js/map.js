// SITE 07 — observation wing
// A hand-built facility: two service rings, a central spine, and four rooms.
// '#' is solid. S/A/B/C/E/M are walkable markers.

export const MAP_ROWS = [
  '###################################',
  '#.................................#',
  '#.................................#',
  '#..#############...#############..#',
  '#..#.....#....##...##..........#.M#',
  '#..#..A..#....##...##......C...#..#',
  '#........#..............#..#......#',
  '#........#........................#',
  '#..#..........##...##...#..#...#..#',
  '#..#..........##...##..........#..#',
  '#..#############...#############..#',
  '#.................................#',
  '#................S................#',
  '#.................................#',
  '#..#############...#############..#',
  '#..#...###....##...##...#......#..#',
  '#..#..........##...##..........#..#',
  '#.................................#',
  '#.....B.................#..E......#',
  '#..#..........##...##..........#..#',
  '#..#..........##...##...#......#..#',
  '#..#############...#############..#',
  '#.................................#',
  '#.................................#',
  '###################################'
]

export const MAP_W = MAP_ROWS[0].length
export const MAP_H = MAP_ROWS.length

if (MAP_ROWS.some((row) => row.length !== MAP_W)) {
  throw new Error('Map rows must all share the same width.')
}

export const WALL = 1
export const FLOOR = 0

export const tiles = new Uint8Array(MAP_W * MAP_H)
export const markers = {}

for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const ch = MAP_ROWS[y][x]
    if (ch === '#') tiles[y * MAP_W + x] = WALL
    else if (ch !== '.') markers[ch] = { x, y }
  }
}

export const SPAWN = markers.S
export const ECHO_SPOTS = [
  { id: 'A', x: markers.A.x + 0.5, y: markers.A.y + 0.5, name: 'THE FIRST ROOM' },
  { id: 'B', x: markers.B.x + 0.5, y: markers.B.y + 0.5, name: 'THE DORMITORY' },
  { id: 'C', x: markers.C.x + 0.5, y: markers.C.y + 0.5, name: 'THE ARCHIVE' }
]
export const EXIT_SPOT = { x: markers.E.x + 0.5, y: markers.E.y + 0.5 }
export const MONSTER_START = { x: markers.M.x + 0.5, y: markers.M.y + 0.5 }

export const MONSTER_SPAWNS = [
  { x: 33.5, y: 4.5 },
  { x: 2.5, y: 4.5 },
  { x: 33.5, y: 21.5 },
  { x: 2.5, y: 21.5 },
  { x: 17.5, y: 2.5 },
  { x: 17.5, y: 22.5 },
  { x: 2.5, y: 12.5 },
  { x: 32.5, y: 12.5 },
  { x: 6.5, y: 8.5 },
  { x: 27.5, y: 8.5 },
  { x: 6.5, y: 15.5 },
  { x: 27.5, y: 15.5 }
]

export const LAMPS = [
  [17.5, 4.5],
  [17.5, 9.5],
  [17.5, 15.5],
  [17.5, 20.5],
  [6.5, 11.5],
  [28.5, 11.5],
  [6.5, 6.5],
  [26.5, 6.5],
  [6.5, 16.5],
  [25.5, 18.5],
  [2.5, 5.5],
  [32.5, 5.5],
  [2.5, 19.5],
  [32.5, 19.5]
]

export function isWallCell(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true
  return tiles[y * MAP_W + x] === WALL
}

export function isWall(worldX, worldY) {
  return isWallCell(Math.floor(worldX), Math.floor(worldY))
}

export function isWalkableCell(x, y) {
  return !isWallCell(x, y)
}

export function cellHash(x, y) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

export function wallVariant(x, y) {
  const h = cellHash(x, y)
  // Central spine is steel; rooms are plaster and tile; the ring is concrete.
  if (x >= 16 && x <= 18) return h % 5 === 0 ? 0 : 2
  if (y >= 11 && y <= 13) return h % 6 === 0 ? 0 : 2
  const inWestRoom = x >= 4 && x <= 13 && ((y >= 4 && y <= 9) || (y >= 15 && y <= 20))
  const inEastRoom = x >= 21 && x <= 30 && ((y >= 4 && y <= 9) || (y >= 15 && y <= 20))
  if (inWestRoom || inEastRoom) return h % 3 === 0 ? 1 : 0
  return h % 7 === 0 ? 1 : 0
}

export function floorVariant(x, y) {
  if (x >= 16 && x <= 18) return 1
  if (y >= 11 && y <= 13) return 1
  return 0
}

export function zoneAt(x, y) {
  if (y >= 10.5 && y <= 14.5 && x >= 14.5 && x <= 20.5) return 'OBSERVATION SPINE'
  if (x < 15 && y < 11) return 'WEST OBSERVATION'
  if (x > 20 && y < 11) return 'THE ARCHIVE'
  if (x < 15 && y > 13) return 'DORMITORY 3'
  if (x > 20 && y > 13) return 'THE GATE'
  if (y < 11) return 'NORTH SERVICE RING'
  if (y > 14) return 'SOUTH SERVICE RING'
  if (x < 16) return 'WEST SERVICE RING'
  return 'EAST SERVICE RING'
}

export function canStand(x, y, radius = 0.24) {
  const minX = Math.floor(x - radius)
  const maxX = Math.floor(x + radius)
  const minY = Math.floor(y - radius)
  const maxY = Math.floor(y + radius)
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (isWallCell(cx, cy)) return false
    }
  }
  return true
}

export function lineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy)
  if (dist < 0.001) return true
  const steps = Math.ceil(dist / 0.06)
  const inv = 1 / steps
  for (let i = 1; i < steps; i++) {
    const t = i * inv
    if (isWall(x0 + dx * t, y0 + dy * t)) return false
  }
  return true
}

export function findPath(startX, startY, targetX, targetY) {
  const sx = Math.floor(startX)
  const sy = Math.floor(startY)
  const tx = Math.floor(targetX)
  const ty = Math.floor(targetY)
  if (isWallCell(sx, sy) || isWallCell(tx, ty)) return []

  const w = MAP_W
  const h = MAP_H
  const total = w * h
  const start = sy * w + sx
  const target = ty * w + tx
  if (start === target) return []

  const gScore = new Float32Array(total)
  const fScore = new Float32Array(total)
  const cameFrom = new Int32Array(total)
  const closed = new Uint8Array(total)
  gScore.fill(Infinity)
  fScore.fill(Infinity)
  cameFrom.fill(-1)

  const heap = []
  const push = (node) => {
    heap.push(node)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (fScore[heap[p]] <= fScore[heap[i]]) break
      const tmp = heap[p]
      heap[p] = heap[i]
      heap[i] = tmp
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length && last !== undefined) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let smallest = i
        if (l < heap.length && fScore[heap[l]] < fScore[heap[smallest]]) smallest = l
        if (r < heap.length && fScore[heap[r]] < fScore[heap[smallest]]) smallest = r
        if (smallest === i) break
        const tmp = heap[i]
        heap[i] = heap[smallest]
        heap[smallest] = tmp
        i = smallest
      }
    }
    return top
  }

  gScore[start] = 0
  fScore[start] = Math.abs(tx - sx) + Math.abs(ty - sy)
  push(start)

  while (heap.length) {
    const current = pop()
    if (current === target) {
      const path = []
      let node = current
      while (node !== start) {
        path.push({ x: (node % w) + 0.5, y: Math.floor(node / w) + 0.5 })
        node = cameFrom[node]
      }
      path.reverse()
      return path
    }
    if (closed[current]) continue
    closed[current] = 1

    const cx = current % w
    const cy = Math.floor(current / w)
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ]
    for (let i = 0; i < neighbors.length; i++) {
      const nx = neighbors[i][0]
      const ny = neighbors[i][1]
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      if (isWallCell(nx, ny)) continue
      const next = ny * w + nx
      if (closed[next]) continue
      const tentative = gScore[current] + 1
      if (tentative < gScore[next]) {
        cameFrom[next] = current
        gScore[next] = tentative
        fScore[next] = tentative + Math.abs(tx - nx) + Math.abs(ty - ny)
        push(next)
      }
    }
  }
  return []
}
