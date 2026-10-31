import {
  COMPONENT_SPECS,
  GATE_TYPES,
  displayScale,
  levelPorts,
  makeRef,
  portPosition,
} from './engine.js'

export const BOARD_WIDTH = 1040
export const BOARD_HEIGHT = 650

const TAU = Math.PI * 2
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)
const easeOutBack = (t) => {
  const c = 1.70158
  const n = clamp(t, 0, 1) - 1
  return 1 + (c + 1) * n * n * n + c * n * n
}

const COLORS = {
  board: '#04121a',
  boardDeep: '#020a0f',
  grid: 'rgba(67, 151, 160, 0.055)',
  gridMajor: 'rgba(74, 179, 186, 0.08)',
  trace: 'rgba(42, 118, 126, 0.24)',
  traceDim: 'rgba(40, 105, 112, 0.13)',
  high: '#ffc45f',
  low: '#52ecff',
  floating: '#44636c',
  danger: '#ff5a70',
  metal: '#69858b',
  text: '#b8d8da',
  muted: '#5b7c83',
  mint: '#67ffb1',
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function cubicPoint(curve, t) {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const d = t * t * t
  return {
    x: a * curve.p1.x + b * curve.c1.x + c * curve.c2.x + d * curve.p2.x,
    y: a * curve.p1.y + b * curve.c1.y + c * curve.c2.y + d * curve.p2.y,
  }
}

function distanceToSegmentSq(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const length = abx * abx + aby * aby
  const t = length ? clamp((apx * abx + apy * aby) / length, 0, 1) : 0
  const dx = px - (ax + abx * t)
  const dy = py - (ay + aby * t)
  return dx * dx + dy * dy
}

export class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.level = null
    this.portList = []
    this.portByRef = new Map()
    this.curveCache = new Map()
    this.decor = []
    this.screws = []
    this.switchVisuals = new Map()
    this.lastTime = 0
  }

  setLevel(level) {
    this.level = level
    this.scale = displayScale(level)
    this.portList = levelPorts(level)
    this.portByRef = new Map(this.portList.map((port) => [port.ref, port]))
    this.curveCache.clear()
    this.switchVisuals.clear()
    const random = mulberry32(level.id * 977 + 31)
    this.decor = Array.from({ length: 24 }, () => {
      const side = Math.floor(random() * 4)
      let x
      let y
      if (side === 0) {
        x = 28 + random() * 70
        y = 54 + random() * 540
      } else if (side === 1) {
        x = 942 + random() * 68
        y = 54 + random() * 540
      } else if (side === 2) {
        x = 100 + random() * 840
        y = 38 + random() * 58
      } else {
        x = 100 + random() * 840
        y = 566 + random() * 48
      }
      return { x, y, r: 1.8 + random() * 4.6, kind: random() > 0.64 ? 'via' : 'pad' }
    })
    this.screws = [
      { x: 58, y: 58 },
      { x: 982, y: 58 },
      { x: 58, y: 592 },
      { x: 982, y: 592 },
    ]
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.width * (BOARD_HEIGHT / BOARD_WIDTH) * dpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.ctx.setTransform(width / BOARD_WIDTH, 0, 0, height / BOARD_HEIGHT, 0, 0)
  }

  toVirtual(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * BOARD_WIDTH,
      y: ((clientY - rect.top) / rect.height) * BOARD_HEIGHT,
    }
  }

  curveFor(a, b) {
    const key = `${a}|${b}`
    if (this.curveCache.has(key)) return this.curveCache.get(key)
    const left = portPosition(this.level, a)
    const right = portPosition(this.level, b)
    if (!left || !right) return null
    const distance = Math.hypot(right.x - left.x, right.y - left.y)
    const reach = clamp(distance * 0.36, 54, 170)
    const curve = {
      p1: { x: left.x, y: left.y },
      c1: { x: left.x + left.dx * reach, y: left.y + left.dy * reach },
      p2: { x: right.x, y: right.y },
      c2: { x: right.x + right.dx * reach, y: right.y + right.dy * reach },
      key,
    }
    this.curveCache.set(key, curve)
    return curve
  }

  pointerCurve(fromRef, point, targetRef = null) {
    if (targetRef) return this.curveFor(fromRef, targetRef)
    const from = portPosition(this.level, fromRef)
    if (!from) return null
    const distance = Math.hypot(point.x - from.x, point.y - from.y)
    const reach = clamp(distance * 0.4, 55, 170)
    return {
      p1: { x: from.x, y: from.y },
      c1: { x: from.x + from.dx * reach, y: from.y + from.dy * reach },
      p2: { x: point.x, y: point.y },
      c2: { x: point.x - from.dx * 22, y: point.y - from.dy * 22 },
    }
  }

  traceCurve(ctx, curve) {
    ctx.beginPath()
    ctx.moveTo(curve.p1.x, curve.p1.y)
    ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.p2.x, curve.p2.y)
  }

  wireAt(x, y, wires, threshold = 12) {
    let best = null
    let bestDistance = threshold * threshold
    for (let index = 0; index < wires.length; index += 1) {
      const curve = this.curveFor(wires[index].a, wires[index].b)
      if (!curve) continue
      let previous = curve.p1
      for (let step = 1; step <= 24; step += 1) {
        const point = cubicPoint(curve, step / 24)
        const distance = distanceToSegmentSq(x, y, previous.x, previous.y, point.x, point.y)
        if (distance < bestDistance) {
          bestDistance = distance
          best = index
        }
        previous = point
      }
    }
    return best
  }

  portAt(x, y, radius = 30) {
    let closest = null
    let best = radius * radius
    for (const port of this.portList) {
      const dx = port.x - x
      const dy = port.y - y
      const distance = dx * dx + dy * dy
      if (distance < best) {
        best = distance
        closest = port
      }
    }
    return closest
  }

  switchAt(x, y) {
    if (!this.level) return null
    const scale = this.scale || 1
    for (const component of this.level.components) {
      if (component.type !== 'switch') continue
      if (Math.abs(x - component.x) < 62 * scale && Math.abs(y - component.y) < 36 * scale) {
        return component
      }
    }
    return null
  }

  componentAt(x, y) {
    if (!this.level) return null
    const scale = this.scale || 1
    for (const component of this.level.components) {
      const spec = COMPONENT_SPECS[component.type]
      if (!spec) continue
      const radius = (Math.max(spec.width, spec.height) / 2 + 6) * scale
      if (Math.hypot(x - component.x, y - component.y) < radius) return component
    }
    return null
  }

  draw(args) {
    const {
      time = 0,
      state,
      sim,
      loadAt = 0,
      hoveredPort = null,
      hoveredSwitch = null,
      hoveredWire = null,
      selectedWire = null,
      drag = null,
      armedPort = null,
      hint = null,
      celebration = null,
    } = args
    if (!this.level || !state || !sim) return
    this.resize()
    const dt = Math.min(50, time - (this.lastTime || time))
    this.lastTime = time
    for (const component of this.level.components) {
      if (component.type !== 'switch') continue
      const target = state.switches[component.id] ? 1 : 0
      const current = this.switchVisuals.get(component.id) ?? target
      const next = current + (target - current) * Math.min(1, dt * 0.018)
      this.switchVisuals.set(component.id, Math.abs(next - target) < 0.002 ? target : next)
    }

    const ctx = this.ctx
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)
    this.drawBoardBackground(ctx, time)
    this.drawAmbientMotes(ctx, time)
    this.drawWires(ctx, args)
    this.drawHint(ctx, hint, time)
    this.drawDrag(ctx, drag, time, armedPort)
    this.drawComponents(ctx, args, time, loadAt)
    this.drawPorts(ctx, args, time, loadAt)
    this.drawBoardForeground(ctx, time)
    if (celebration) this.drawCelebration(ctx, celebration, time)
  }

  drawBoardBackground(ctx, time) {
    const level = this.level
    ctx.save()
    const shadow = ctx.createRadialGradient(520, 320, 180, 520, 320, 600)
    shadow.addColorStop(0, 'rgba(9, 40, 49, 0.45)')
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = shadow
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)

    roundRectPath(ctx, 8, 8, 1024, 634, 34)
    const boardGradient = ctx.createLinearGradient(0, 0, BOARD_WIDTH, BOARD_HEIGHT)
    boardGradient.addColorStop(0, '#071b24')
    boardGradient.addColorStop(0.42, '#04121a')
    boardGradient.addColorStop(1, '#071a20')
    ctx.fillStyle = boardGradient
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 12
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    ctx.strokeStyle = 'rgba(82, 206, 212, 0.22)'
    ctx.lineWidth = 1.4
    ctx.stroke()

    roundRectPath(ctx, 20, 20, 1000, 610, 26)
    ctx.strokeStyle = 'rgba(92, 213, 219, 0.07)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.save()
    roundRectPath(ctx, 22, 22, 996, 606, 25)
    ctx.clip()

    const gridGradient = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT)
    gridGradient.addColorStop(0, 'rgba(75, 185, 193, 0.07)')
    gridGradient.addColorStop(0.6, 'rgba(75, 185, 193, 0.025)')
    gridGradient.addColorStop(1, 'rgba(75, 185, 193, 0.055)')
    ctx.strokeStyle = gridGradient
    ctx.lineWidth = 0.7
    for (let x = 64; x < 1000; x += 34) {
      ctx.beginPath()
      ctx.moveTo(x, 24)
      ctx.lineTo(x, 626)
      ctx.stroke()
    }
    for (let y = 54; y < 630; y += 34) {
      ctx.beginPath()
      ctx.moveTo(24, y)
      ctx.lineTo(1016, y)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(61, 150, 158, 0.06)'
    ctx.lineWidth = 1
    for (let x = 64; x < 1000; x += 136) {
      ctx.beginPath()
      ctx.moveTo(x, 24)
      ctx.lineTo(x, 626)
      ctx.stroke()
    }
    for (let y = 54; y < 630; y += 136) {
      ctx.beginPath()
      ctx.moveTo(24, y)
      ctx.lineTo(1016, y)
      ctx.stroke()
    }

    ctx.font = '500 8px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(104, 178, 184, 0.17)'
    ctx.textAlign = 'left'
    for (let x = 68; x <= 960; x += 136) {
      for (let y = 58; y <= 570; y += 136) {
        ctx.fillText(`${String.fromCharCode(65 + (x / 136) % 26)}${Math.floor(y / 68)}`, x, y)
      }
    }

    this.drawStaticTraces(ctx)

    for (const item of this.decor) {
      if (item.kind === 'via') {
        ctx.beginPath()
        ctx.arc(item.x, item.y, item.r + 2.6, 0, TAU)
        ctx.strokeStyle = 'rgba(104, 177, 182, 0.18)'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(item.x, item.y, item.r, 0, TAU)
        ctx.fillStyle = 'rgba(17, 50, 57, 0.8)'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(item.x, item.y, item.r, 0, TAU)
        ctx.fillStyle = 'rgba(33, 105, 113, 0.22)'
        ctx.fill()
      }
    }

    ctx.font = '700 150px "Space Grotesk", sans-serif'
    ctx.fillStyle = 'rgba(56, 150, 158, 0.025)'
    ctx.textAlign = 'center'
    ctx.fillText('CM', 520, 400)
    ctx.restore()

    // board edge traces
    ctx.strokeStyle = 'rgba(42, 135, 141, 0.21)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(37, 97)
    ctx.lineTo(37, 260)
    ctx.quadraticCurveTo(37, 274, 51, 274)
    ctx.lineTo(69, 274)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(1003, 553)
    ctx.lineTo(1003, 390)
    ctx.quadraticCurveTo(1003, 376, 989, 376)
    ctx.lineTo(971, 376)
    ctx.stroke()

    for (const screw of this.screws) {
      ctx.beginPath()
      ctx.arc(screw.x, screw.y, 9, 0, TAU)
      ctx.fillStyle = 'rgba(2, 9, 12, 0.66)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(133, 194, 198, 0.22)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(screw.x, screw.y, 4.1, 0, TAU)
      const metal = ctx.createRadialGradient(screw.x - 1, screw.y - 1, 0, screw.x, screw.y, 4.5)
      metal.addColorStop(0, '#7c9a9e')
      metal.addColorStop(0.6, '#334d53')
      metal.addColorStop(1, '#0a1a1f')
      ctx.fillStyle = metal
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(screw.x - 3, screw.y - 1)
      ctx.lineTo(screw.x + 3, screw.y + 1)
      ctx.strokeStyle = 'rgba(2, 10, 12, 0.8)'
      ctx.stroke()
    }

    ctx.font = '500 7px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(108, 181, 186, 0.38)'
    ctx.textAlign = 'left'
    ctx.fillText('CIRCUIT MASTER / MAINBOARD', 76, 620)
    ctx.textAlign = 'right'
    ctx.fillText(`CM-${String(level.id).padStart(3, '0')} · REV 1.0`, 964, 620)
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(108, 181, 186, 0.22)'
    ctx.fillText('POWER BUS', 78, 42)
    ctx.textAlign = 'right'
    ctx.fillText('SIGNAL PROCESSING ARRAY', 960, 42)

    // moving scanline
    const scanY = 30 + ((time * 0.018) % 575)
    const scan = ctx.createLinearGradient(22, scanY, 1018, scanY)
    scan.addColorStop(0, 'rgba(84, 243, 255, 0)')
    scan.addColorStop(0.5, 'rgba(84, 243, 255, 0.035)')
    scan.addColorStop(1, 'rgba(84, 243, 255, 0)')
    ctx.fillStyle = scan
    ctx.fillRect(22, scanY, 996, 1.2)
    ctx.restore()
  }

  drawStaticTraces(ctx) {
    const traces = [
      [74, 480, 74, 538, 132, 538, 132, 580],
      [966, 170, 966, 115, 925, 115, 900, 115],
      [230, 597, 315, 597, 315, 572, 380, 572],
      [73, 132, 130, 132, 130, 100, 184, 100],
    ]
    ctx.strokeStyle = 'rgba(52, 141, 149, 0.18)'
    ctx.lineWidth = 1.2
    for (const [x1, y1, x2, y2, x3, y3, x4, y4] of traces) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineTo(x3, y3)
      ctx.lineTo(x4, y4)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x4, y4, 2.4, 0, TAU)
      ctx.fillStyle = 'rgba(52, 141, 149, 0.28)'
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(68, 162, 168, 0.1)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(840, 70)
    ctx.lineTo(940, 70)
    ctx.quadraticCurveTo(958, 70, 958, 88)
    ctx.lineTo(958, 112)
    ctx.stroke()
  }

  drawAmbientMotes(ctx, time) {
    ctx.save()
    for (let index = 0; index < 13; index += 1) {
      const x = 90 + ((index * 137 + time * 0.006 * (index % 3 + 1)) % 850)
      const y = 90 + ((index * 89 + Math.sin(time * 0.00035 + index) * 26) % 480)
      const alpha = 0.08 + 0.06 * Math.sin(time * 0.001 + index * 2.1)
      ctx.beginPath()
      ctx.arc(x, y, 1.1, 0, TAU)
      ctx.fillStyle = `rgba(123, 239, 243, ${alpha})`
      ctx.fill()
    }
    ctx.restore()
  }

  drawWires(ctx, args) {
    const { state, sim, time, hoveredWire, selectedWire } = args
    const wires = state.wires || []
    for (let index = 0; index < wires.length; index += 1) {
      const wire = wires[index]
      const curve = this.curveFor(wire.a, wire.b)
      if (!curve) continue
      const high = sim.netPower.get(wire.a) === 'high' || sim.netPower.get(wire.b) === 'high'
      const low = sim.netPower.get(wire.a) === 'low' || sim.netPower.get(wire.b) === 'low'
      const conflict = sim.netPower.get(wire.a) === 'conflict' || sim.netPower.get(wire.b) === 'conflict'
      const active = sim.activeWires[index]
      const hovered = hoveredWire === index
      const selected = selectedWire === index
      const color = conflict ? COLORS.danger : high ? COLORS.high : low ? COLORS.low : '#28727b'

      ctx.save()
      ctx.lineCap = 'round'
      this.traceCurve(ctx, curve)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.lineWidth = 7.5
      ctx.stroke()

      this.traceCurve(ctx, curve)
      ctx.strokeStyle = active ? hexToRgba(color, 0.22) : 'rgba(33, 90, 97, 0.35)'
      ctx.lineWidth = active ? 7 : 5
      if (active) {
        ctx.shadowColor = color
        ctx.shadowBlur = 13
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      this.traceCurve(ctx, curve)
      ctx.strokeStyle = active ? hexToRgba(color, 0.92) : 'rgba(52, 117, 123, 0.64)'
      ctx.lineWidth = selected || hovered ? 2.8 : 2
      ctx.stroke()

      this.traceCurve(ctx, curve)
      ctx.strokeStyle = active
        ? 'rgba(244, 255, 255, 0.78)'
        : 'rgba(100, 174, 178, 0.2)'
      ctx.lineWidth = 0.8
      ctx.stroke()

      if (selected) {
        this.traceCurve(ctx, curve)
        ctx.setLineDash([7, 7])
        ctx.lineDashOffset = -time * 0.025
        ctx.strokeStyle = 'rgba(255, 195, 95, 0.95)'
        ctx.lineWidth = 2.2
        ctx.shadowColor = COLORS.high
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.setLineDash([])
      } else if (hovered) {
        this.traceCurve(ctx, curve)
        ctx.strokeStyle = 'rgba(219, 250, 251, 0.85)'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      if (active) {
        const phase = time * 0.00038 + index * 0.173
        for (let dot = 0; dot < 2; dot += 1) {
          const t = (phase + dot * 0.5) % 1
          const point = cubicPoint(curve, t)
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2.6, 0, TAU)
          ctx.fillStyle = `rgba(245, 255, 255, ${dot === 0 ? 0.9 : 0.5})`
          ctx.shadowColor = color
          ctx.shadowBlur = 10
          ctx.fill()
        }
      }
      ctx.restore()
    }
  }

  drawHint(ctx, hint, time) {
    if (!hint) return
    ctx.save()
    if (hint.wire) {
      const curve = this.curveFor(hint.wire.a, hint.wire.b)
      if (curve) {
        this.traceCurve(ctx, curve)
        ctx.strokeStyle = 'rgba(255, 195, 95, 0.18)'
        ctx.lineWidth = 9
        ctx.stroke()
        ctx.setLineDash([8, 9])
        ctx.lineDashOffset = -time * 0.035
        ctx.strokeStyle = 'rgba(255, 195, 95, 0.92)'
        ctx.lineWidth = 2.2
        ctx.shadowColor = COLORS.high
        ctx.shadowBlur = 14
        ctx.stroke()
        ctx.setLineDash([])
        for (const point of [curve.p1, curve.p2]) {
          this.drawPulseRing(ctx, point.x, point.y, time, COLORS.high)
        }
      }
    }
    if (hint.switchId) {
      const component = this.level.components.find((entry) => entry.id === hint.switchId)
      if (component) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.006)
        roundRectPath(ctx, component.x - 61, component.y - 37, 122, 74, 13)
        ctx.strokeStyle = `rgba(255, 195, 95, ${0.45 + pulse * 0.4})`
        ctx.lineWidth = 2
        ctx.shadowColor = COLORS.high
        ctx.shadowBlur = 16
        ctx.stroke()
        this.drawPulseRing(ctx, component.x, component.y, time, COLORS.high, 54)
      }
    }
    ctx.restore()
  }

  drawPulseRing(ctx, x, y, time, color, radius = 18) {
    const pulse = (time * 0.0012) % 1
    ctx.beginPath()
    ctx.arc(x, y, radius + pulse * 12, 0, TAU)
    ctx.strokeStyle = hexToRgba(color, 0.55 * (1 - pulse))
    ctx.lineWidth = 1.3
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, TAU)
    ctx.strokeStyle = hexToRgba(color, 0.72)
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  drawDrag(ctx, drag, time, armedPort) {
    ctx.save()
    if (armedPort) {
      const port = this.portByRef.get(armedPort)
      if (port) this.drawPulseRing(ctx, port.x, port.y, time, COLORS.high, 15)
    }
    if (!drag) {
      ctx.restore()
      return
    }
    const curve = this.pointerCurve(drag.from, drag.point, drag.targetRef)
    if (!curve) {
      ctx.restore()
      return
    }
    this.traceCurve(ctx, curve)
    ctx.strokeStyle = 'rgba(255, 195, 95, 0.18)'
    ctx.lineWidth = 10
    ctx.stroke()
    this.traceCurve(ctx, curve)
    ctx.setLineDash([7, 7])
    ctx.lineDashOffset = -time * 0.035
    ctx.strokeStyle = drag.targetRef ? 'rgba(101, 255, 173, 0.95)' : 'rgba(255, 195, 95, 0.9)'
    ctx.lineWidth = 2.2
    ctx.shadowColor = drag.targetRef ? COLORS.mint : COLORS.high
    ctx.shadowBlur = 14
    ctx.stroke()
    ctx.setLineDash([])
    const color = drag.targetRef ? COLORS.mint : COLORS.high
    for (const point of [curve.p1, curve.p2]) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 3.4, 0, TAU)
      ctx.fillStyle = '#f7ffff'
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.fill()
    }
    ctx.restore()
  }

  drawComponents(ctx, args, time, loadAt) {
    const { state, sim, hoveredSwitch, celebration } = args
    const order = this.level.components
    for (let index = 0; index < order.length; index += 1) {
      const component = order[index]
      const progress = loadAt ? easeOutBack(clamp((time - loadAt - index * 38) / 430, 0, 1)) : 1
      if (progress <= 0) continue
      const alpha = easeOutCubic(clamp((time - loadAt - index * 38) / 280, 0, 1))
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(component.x, component.y)
      ctx.scale(progress, progress)
      ctx.translate(-component.x, -component.y)
      const scale = this.scale || 1
      ctx.translate(component.x, component.y)
      ctx.scale(scale, scale)
      ctx.translate(-component.x, -component.y)
      if (component.type === 'battery') this.drawBattery(ctx, component, sim, time)
      else if (component.type === 'switch') {
        this.drawSwitch(ctx, component, state, sim, time, hoveredSwitch === component.id)
      } else if (component.type === 'led') this.drawLed(ctx, component, sim, time, celebration)
      else if (GATE_TYPES.has(component.type)) this.drawGate(ctx, component, sim, time)
      this.drawDesignator(ctx, component)
      ctx.restore()
    }
  }

  powerColor(value) {
    if (value === 'high') return COLORS.high
    if (value === 'low') return COLORS.low
    if (value === 'conflict') return COLORS.danger
    return COLORS.floating
  }

  drawDesignator(ctx, component) {
    const prefix = {
      battery: 'B',
      switch: 'SW',
      led: 'L',
      and: 'U',
      or: 'U',
      xor: 'U',
      not: 'U',
    }[component.type]
    const same = this.level.components.filter((entry) => entry.type === component.type)
    const index = same.findIndex((entry) => entry.id === component.id) + 1
    ctx.font = '500 7px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(129, 178, 182, 0.35)'
    ctx.fillText(`${prefix}${index}`, component.x, component.y + 52)
  }

  drawBattery(ctx, component, sim, time) {
    const positive = sim.netPower.get(makeRef(component.id, 'pos'))
    const negative = sim.netPower.get(makeRef(component.id, 'neg'))
    const live = positive === 'high' || negative === 'low'
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.0025)
    ctx.save()
    if (live) {
      const glow = ctx.createRadialGradient(component.x, component.y, 10, component.x, component.y, 95)
      glow.addColorStop(0, 'rgba(255, 195, 95, 0.12)')
      glow.addColorStop(1, 'rgba(255, 195, 95, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(component.x - 95, component.y - 95, 190, 190)
    }
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 7
    roundRectPath(ctx, component.x - 58, component.y - 38, 116, 76, 12)
    const body = ctx.createLinearGradient(component.x, component.y - 38, component.x, component.y + 38)
    body.addColorStop(0, '#243f46')
    body.addColorStop(0.22, '#122b32')
    body.addColorStop(0.66, '#091c22')
    body.addColorStop(1, '#17343b')
    ctx.fillStyle = body
    ctx.fill()
    ctx.strokeStyle = live ? 'rgba(255, 195, 95, 0.45)' : 'rgba(118, 175, 180, 0.24)'
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    roundRectPath(ctx, component.x - 42, component.y - 22, 84, 44, 7)
    ctx.fillStyle = 'rgba(3, 13, 17, 0.82)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(79, 147, 153, 0.18)'
    ctx.stroke()

    for (let cell = 0; cell < 2; cell += 1) {
      const x = component.x - 23 + cell * 28
      roundRectPath(ctx, x, component.y - 12, 16, 24, 3)
      ctx.fillStyle = 'rgba(18, 51, 58, 0.95)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(123, 193, 196, 0.33)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 195, 95, 0.8)'
      ctx.fillRect(x + 10, component.y - 16, 3, 8)
    }

    ctx.fillStyle = 'rgba(255, 195, 95, 0.9)'
    ctx.font = '600 13px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('+', component.x + 53, component.y + 4)
    ctx.fillStyle = 'rgba(111, 178, 184, 0.8)'
    ctx.fillText('−', component.x - 53, component.y + 4)

    ctx.beginPath()
    ctx.arc(component.x, component.y + 28, 1.5, 0, TAU)
    ctx.fillStyle = live ? `rgba(101, 255, 173, ${0.5 + pulse * 0.5})` : 'rgba(100, 144, 149, 0.3)'
    ctx.fill()
    ctx.restore()
  }

  drawSwitch(ctx, component, state, sim, time, hovered) {
    const closed = Boolean(state.switches[component.id])
    const visual = this.switchVisuals.get(component.id) ?? (closed ? 1 : 0)
    const input = sim.netPower.get(makeRef(component.id, 'a'))
    const output = sim.netPower.get(makeRef(component.id, 'b'))
    const active = input === 'high' || output === 'high'
    const angle = lerp(-0.46, -0.045, visual)
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 7
    roundRectPath(ctx, component.x - 54, component.y - 29, 108, 58, 11)
    const body = ctx.createLinearGradient(component.x, component.y - 29, component.x, component.y + 29)
    body.addColorStop(0, '#243f45')
    body.addColorStop(0.3, '#10272e')
    body.addColorStop(1, '#081a20')
    ctx.fillStyle = body
    ctx.fill()
    ctx.strokeStyle = hovered
      ? 'rgba(84, 243, 255, 0.7)'
      : active && closed
        ? 'rgba(101, 255, 173, 0.4)'
        : 'rgba(112, 174, 179, 0.22)'
    ctx.lineWidth = hovered ? 1.7 : 1.1
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    ctx.strokeStyle = 'rgba(82, 148, 153, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(component.x - 40, component.y + 16)
    ctx.lineTo(component.x + 40, component.y + 16)
    ctx.stroke()

    const pivotX = component.x - 29
    const pivotY = component.y + 7
    const leverLength = 58
    const endX = pivotX + Math.cos(angle) * leverLength
    const endY = pivotY + Math.sin(angle) * leverLength

    if (closed) {
      ctx.strokeStyle = 'rgba(101, 255, 173, 0.32)'
      ctx.lineWidth = 8
      ctx.shadowColor = COLORS.mint
      ctx.shadowBlur = 13
      ctx.beginPath()
      ctx.moveTo(pivotX, pivotY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    ctx.strokeStyle = closed ? '#d8fff0' : '#9bb6b9'
    ctx.lineWidth = 3.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(pivotX, pivotY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    for (const [x, y] of [
      [pivotX, pivotY],
      [component.x + 29, component.y + 7],
    ]) {
      ctx.beginPath()
      ctx.arc(x, y, 4.3, 0, TAU)
      ctx.fillStyle = active ? COLORS.high : '#536f75'
      ctx.fill()
      ctx.strokeStyle = 'rgba(221, 251, 252, 0.6)'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(component.x + 38, component.y - 16, 2.4, 0, TAU)
    ctx.fillStyle = closed ? COLORS.mint : 'rgba(93, 134, 139, 0.35)'
    if (closed) {
      ctx.shadowColor = COLORS.mint
      ctx.shadowBlur = 8
    }
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.font = '600 7px "JetBrains Mono", monospace'
    ctx.fillStyle = closed ? 'rgba(101, 255, 173, 0.8)' : 'rgba(120, 167, 171, 0.55)'
    ctx.textAlign = 'left'
    ctx.fillText(closed ? 'CLOSED' : 'OPEN', component.x - 42, component.y - 15)
    ctx.restore()
  }

  drawLed(ctx, component, sim, time, celebration) {
    const led = sim.ledById.get(component.id)
    const on = Boolean(led?.on)
    const reverse = Boolean(led?.reverse)
    const color = component.color || '#ffc45f'
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.004 + component.x * 0.01)
    const radius = on ? 27 : 25
    ctx.save()
    if (on) {
      const glowRadius = 62 + pulse * 5
      const glow = ctx.createRadialGradient(component.x, component.y, 4, component.x, component.y, glowRadius)
      glow.addColorStop(0, hexToRgba(color, 0.36))
      glow.addColorStop(0.4, hexToRgba(color, 0.15))
      glow.addColorStop(1, hexToRgba(color, 0))
      ctx.fillStyle = glow
      ctx.fillRect(component.x - glowRadius, component.y - glowRadius, glowRadius * 2, glowRadius * 2)

      ctx.strokeStyle = hexToRgba(color, 0.18 + pulse * 0.12)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(component.x, component.y, 36 + pulse * 3, 0, TAU)
      ctx.stroke()
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 6
    ctx.beginPath()
    ctx.ellipse(component.x, component.y + 31, 27, 8, 0, 0, TAU)
    ctx.fillStyle = '#07171c'
    ctx.fill()
    ctx.strokeStyle = 'rgba(101, 162, 168, 0.24)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    ctx.beginPath()
    ctx.arc(component.x, component.y, radius + 4, 0, TAU)
    ctx.fillStyle = '#0a1b21'
    ctx.fill()
    ctx.strokeStyle = on ? hexToRgba(color, 0.82) : 'rgba(112, 166, 171, 0.32)'
    ctx.lineWidth = 1.4
    if (on) {
      ctx.shadowColor = color
      ctx.shadowBlur = 13
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    const lens = ctx.createRadialGradient(
      component.x - radius * 0.35,
      component.y - radius * 0.4,
      1,
      component.x,
      component.y,
      radius,
    )
    if (on) {
      lens.addColorStop(0, '#ffffff')
      lens.addColorStop(0.18, hexToRgba(color, 0.98))
      lens.addColorStop(0.7, hexToRgba(color, 0.76))
      lens.addColorStop(1, hexToRgba(color, 0.33))
    } else {
      lens.addColorStop(0, hexToRgba(color, 0.32))
      lens.addColorStop(0.6, hexToRgba(color, 0.16))
      lens.addColorStop(1, 'rgba(6, 18, 22, 0.9)')
    }
    ctx.beginPath()
    ctx.arc(component.x, component.y, radius, 0, TAU)
    ctx.fillStyle = lens
    ctx.fill()

    ctx.beginPath()
    ctx.arc(component.x - 7, component.y - 8, 7.5, 0, TAU)
    ctx.fillStyle = on ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.06)'
    ctx.fill()

    if (on) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(component.x + 9, component.y - 13)
      ctx.lineTo(component.x + 9, component.y + 13)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(component.x + 3, component.y - 8)
      ctx.lineTo(component.x + 9, component.y)
      ctx.lineTo(component.x + 3, component.y + 8)
      ctx.stroke()
    }

    if (reverse) {
      ctx.font = '600 6px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(255, 90, 112, 0.9)'
      ctx.textAlign = 'center'
      ctx.fillText('REVERSED', component.x, component.y + 50)
    }
    if (celebration) {
      ctx.beginPath()
      ctx.arc(component.x, component.y, 34 + Math.sin(time * 0.006) * 4, 0, TAU)
      ctx.strokeStyle = hexToRgba(color, 0.28)
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.restore()
  }

  drawGate(ctx, component, sim, time) {
    const gate = sim.gateById.get(component.id)
    const state = gate?.out
    const outputPower = sim.netPower.get(makeRef(component.id, 'out'))
    const active = outputPower === 'high'
    const color = component.type === 'not' ? '#ff9dc2' : component.type === 'xor' ? '#c49bff' : '#67e9ff'
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.004 + component.y * 0.008)
    ctx.save()
    if (active) {
      const glow = ctx.createRadialGradient(component.x, component.y, 10, component.x, component.y, 94)
      glow.addColorStop(0, hexToRgba(color, 0.13))
      glow.addColorStop(1, hexToRgba(color, 0))
      ctx.fillStyle = glow
      ctx.fillRect(component.x - 94, component.y - 94, 188, 188)
    }
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 7
    ctx.beginPath()
    if (component.type === 'and') {
      ctx.moveTo(component.x - 66, component.y - 44)
      ctx.lineTo(component.x - 5, component.y - 44)
      ctx.bezierCurveTo(component.x + 45, component.y - 44, component.x + 64, component.y - 24, component.x + 64, component.y)
      ctx.bezierCurveTo(component.x + 64, component.y + 24, component.x + 45, component.y + 44, component.x - 5, component.y + 44)
      ctx.lineTo(component.x - 66, component.y + 44)
      ctx.closePath()
    } else if (component.type === 'not') {
      ctx.moveTo(component.x - 58, component.y - 40)
      ctx.lineTo(component.x + 41, component.y)
      ctx.lineTo(component.x - 58, component.y + 40)
      ctx.closePath()
    } else {
      ctx.moveTo(component.x - 66, component.y - 44)
      ctx.quadraticCurveTo(component.x - 34, component.y, component.x - 66, component.y + 44)
      ctx.quadraticCurveTo(component.x + 13, component.y + 43, component.x + 59, component.y)
      ctx.quadraticCurveTo(component.x + 13, component.y - 43, component.x - 66, component.y - 44)
      ctx.closePath()
    }
    const body = ctx.createLinearGradient(component.x, component.y - 50, component.x, component.y + 50)
    body.addColorStop(0, '#1d3940')
    body.addColorStop(0.4, '#0c232a')
    body.addColorStop(1, '#07171c')
    ctx.fillStyle = body
    ctx.fill()
    ctx.strokeStyle = active ? hexToRgba(color, 0.78) : 'rgba(112, 173, 178, 0.26)'
    ctx.lineWidth = 1.4
    if (active) {
      ctx.shadowColor = color
      ctx.shadowBlur = 12
    }
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    if (component.type === 'or' || component.type === 'xor') {
      ctx.beginPath()
      ctx.moveTo(component.x - 73, component.y - 48)
      ctx.quadraticCurveTo(component.x - 39, component.y, component.x - 73, component.y + 48)
      ctx.strokeStyle = active ? hexToRgba(color, 0.6) : 'rgba(112, 173, 178, 0.25)'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
    if (component.type === 'not') {
      ctx.beginPath()
      ctx.arc(component.x + 49, component.y, 7, 0, TAU)
      ctx.fillStyle = '#07171c'
      ctx.fill()
      ctx.strokeStyle = active ? color : 'rgba(112, 173, 178, 0.35)'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    ctx.font = '600 12px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = active ? '#eaffff' : 'rgba(169, 215, 217, 0.54)'
    ctx.shadowColor = active ? color : 'transparent'
    ctx.shadowBlur = active ? 8 : 0
    const label = { and: 'AND', or: 'OR', xor: 'XOR', not: 'NOT' }[component.type]
    ctx.fillText(label, component.x + (component.type === 'not' ? -7 : -5), component.y + 4)
    ctx.shadowBlur = 0

    const inputPorts = COMPONENT_SPECS[component.type].ports.filter(
      (port) => port.id === 'a' || port.id === 'b',
    )
    for (const port of inputPorts) {
      const power = sim.netPower.get(makeRef(component.id, port.id))
      if (power !== 'high') continue
      const x = component.x + port.dx
      const y = component.y + port.dy
      ctx.beginPath()
      ctx.arc(x, y, 4.5, 0, TAU)
      ctx.fillStyle = hexToRgba(COLORS.high, 0.92)
      ctx.shadowColor = COLORS.high
      ctx.shadowBlur = 7
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ctx.beginPath()
    ctx.arc(component.x + 50, component.y - 33, 2.4, 0, TAU)
    ctx.fillStyle = active ? COLORS.mint : 'rgba(92, 136, 141, 0.3)'
    if (active) {
      ctx.shadowColor = COLORS.mint
      ctx.shadowBlur = 8
    }
    ctx.fill()
    ctx.shadowBlur = 0
    if (!active && state === false) {
      ctx.strokeStyle = `rgba(255, 195, 95, ${0.2 + pulse * 0.15})`
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.arc(component.x + 50, component.y - 33, 4.4, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
  }

  drawPorts(ctx, args, time, loadAt) {
    const { state, sim, hoveredPort, drag, armedPort, hint } = args
    const connected = new Set()
    for (const wire of state.wires || []) {
      connected.add(wire.a)
      connected.add(wire.b)
    }
    const hintPorts = new Set()
    if (hint?.wire) {
      hintPorts.add(hint.wire.a)
      hintPorts.add(hint.wire.b)
    }
    for (const port of this.portList) {
      const fade = loadAt ? easeOutCubic(clamp((time - loadAt - 100) / 400, 0, 1)) : 1
      if (fade <= 0) continue
      const power = sim.netPower.get(port.ref) || 'floating'
      const color = this.powerColor(power)
      const isConnected = connected.has(port.ref)
      const isHovered = hoveredPort === port.ref
      const isArmed = armedPort === port.ref
      const isTarget =
        drag?.targetRef === port.ref ||
        (drag && drag.from !== port.ref && !drag.targetRef && Math.hypot(drag.point.x - port.x, drag.point.y - port.y) < 34)
      const isHint = hintPorts.has(port.ref)
      const canAccept = !drag || drag.from.split(':')[0] !== port.component.id
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.005 + port.x * 0.01)
      ctx.save()
      ctx.globalAlpha = fade
      if (isTarget && canAccept) {
        this.drawPulseRing(ctx, port.x, port.y, time, COLORS.mint, 18)
      } else if (isArmed || isHint) {
        this.drawPulseRing(ctx, port.x, port.y, time, COLORS.high, 16)
      }
      if (isHovered) {
        this.drawPulseRing(ctx, port.x, port.y, time, COLORS.low, 14)
      }
      if (drag && canAccept) {
        ctx.beginPath()
        ctx.arc(port.x, port.y, 16 + pulse * 2, 0, TAU)
        ctx.strokeStyle = 'rgba(84, 243, 255, 0.1)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(port.x, port.y, isConnected ? 10.2 : 9.2, 0, TAU)
      ctx.fillStyle = '#031016'
      ctx.fill()
      ctx.strokeStyle = isHovered || isTarget || isArmed
        ? 'rgba(238, 255, 255, 0.9)'
        : 'rgba(104, 161, 166, 0.48)'
      ctx.lineWidth = isHovered || isTarget || isArmed ? 1.6 : 1
      ctx.stroke()

      const metal = ctx.createRadialGradient(port.x - 2, port.y - 2, 0.5, port.x, port.y, 7)
      metal.addColorStop(0, power === 'floating' ? '#617d82' : hexToRgba(color, 0.95))
      metal.addColorStop(0.55, power === 'floating' ? '#263f45' : hexToRgba(color, 0.64))
      metal.addColorStop(1, '#07181d')
      ctx.beginPath()
      ctx.arc(port.x, port.y, 5.5, 0, TAU)
      ctx.fillStyle = metal
      ctx.fill()
      if (power !== 'floating') {
        ctx.shadowColor = color
        ctx.shadowBlur = 9
        ctx.beginPath()
        ctx.arc(port.x, port.y, 2.2, 0, TAU)
        ctx.fillStyle = '#f8ffff'
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (port.port.label && ['battery', 'led', 'and', 'or', 'xor', 'not'].includes(port.component.type)) {
        const label = port.port.label
        ctx.font = '600 7px "JetBrains Mono", monospace'
        ctx.fillStyle = power === 'high'
          ? 'rgba(255, 211, 130, 0.9)'
          : power === 'low'
            ? 'rgba(143, 244, 255, 0.9)'
            : 'rgba(125, 177, 180, 0.46)'
        ctx.textAlign = port.dir?.[0] < 0 ? 'left' : 'right'
        const labelX = port.x + (port.dir?.[0] < 0 ? 14 : -14)
        ctx.fillText(label, labelX, port.y + 2.5)
      }
      ctx.restore()
    }
  }

  drawBoardForeground(ctx, time) {
    ctx.save()
    const vignette = ctx.createRadialGradient(520, 325, 260, 520, 325, 600)
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vignette.addColorStop(0.72, 'rgba(0, 0, 0, 0.04)')
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.34)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)
    ctx.strokeStyle = 'rgba(101, 255, 173, 0.06)'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.moveTo(25, 630)
    ctx.lineTo(360, 630)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(680, 630)
    ctx.lineTo(1015, 630)
    ctx.stroke()
    ctx.restore()
  }

  drawCelebration(ctx, celebration, time) {
    const elapsed = time - celebration.start
    if (elapsed < 0 || elapsed > celebration.duration) return
    ctx.save()
    const fade = clamp(1 - elapsed / celebration.duration, 0, 1)
    for (const spark of celebration.sparks) {
      const x = spark.x + spark.vx * elapsed * 0.05
      const y = spark.y + spark.vy * elapsed * 0.05 + 0.00035 * elapsed * elapsed
      const alpha = Math.max(0, fade * spark.alpha)
      ctx.beginPath()
      ctx.arc(x, y, spark.size, 0, TAU)
      ctx.fillStyle = hexToRgba(spark.color, alpha)
      ctx.shadowColor = spark.color
      ctx.shadowBlur = 8
      ctx.fill()
    }
    ctx.restore()
  }
}

export function createSparkBurst(level) {
  const random = mulberry32(level.id * 313 + 7)
  const palette = [COLORS.high, COLORS.low, COLORS.mint, '#ff7ea7', '#b68dff']
  const center = { x: 520, y: 330 }
  const sparks = Array.from({ length: 64 }, (_, index) => {
    const angle = random() * TAU
    const speed = 2 + random() * 7
    return {
      x: center.x + (random() - 0.5) * 220,
      y: center.y + (random() - 0.5) * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 1.3 + random() * 2.6,
      alpha: 0.45 + random() * 0.5,
      color: palette[index % palette.length],
    }
  })
  return { start: performance.now(), duration: 2700, sparks }
}
