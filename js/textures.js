const TEX = 64

function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function clamp255(value) {
  return value < 0 ? 0 : value > 255 ? 255 : value | 0
}

function canvasToUint32(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  return new Uint32Array(data.buffer.slice(0))
}

function baseNoiseTexture(seed, base, options = {}) {
  const rng = mulberry32(seed)
  const canvas = makeCanvas(TEX, TEX)
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(TEX, TEX)
  const data = image.data
  const grain = options.grain ?? 18
  const verticalBias = options.verticalBias ?? 0

  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const index = (y * TEX + x) * 4
      const n = (rng() - 0.5) * grain
      const vertical = Math.sin((y / TEX) * Math.PI) * verticalBias
      const horizontal = Math.sin((x / TEX) * Math.PI * 2) * 2
      data[index] = clamp255(base[0] + n + vertical + horizontal)
      data[index + 1] = clamp255(base[1] + n * 0.9 + vertical + horizontal)
      data[index + 2] = clamp255(base[2] + n * 0.8 + vertical * 0.8 + horizontal)
      data[index + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return { canvas, ctx, rng }
}

function addStains(ctx, rng, count, color, maxRadius = 18, alpha = 0.18) {
  for (let i = 0; i < count; i++) {
    const x = rng() * TEX
    const y = rng() * TEX
    const radius = 3 + rng() * maxRadius
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color.replace('ALPHA', String(alpha)))
    gradient.addColorStop(0.55, color.replace('ALPHA', String(alpha * 0.45)))
    gradient.addColorStop(1, color.replace('ALPHA', '0'))
    ctx.fillStyle = gradient
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
}

function addCracks(ctx, rng, count, color) {
  ctx.strokeStyle = color
  ctx.lineCap = 'square'
  for (let c = 0; c < count; c++) {
    let x = rng() * TEX
    let y = rng() * TEX
    ctx.beginPath()
    ctx.moveTo(x, y)
    const segments = 4 + (rng() * 8) | 0
    for (let i = 0; i < segments; i++) {
      x += (rng() - 0.5) * 9
      y += (rng() - 0.3) * 8
      ctx.lineTo(x, y)
    }
    ctx.globalAlpha = 0.2 + rng() * 0.35
    ctx.lineWidth = rng() < 0.8 ? 0.55 : 1.15
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function makeConcrete(seed) {
  const { canvas, ctx, rng } = baseNoiseTexture(seed, [64, 64, 57], { grain: 20, verticalBias: 2 })
  // Poured-concrete seams and formwork holes.
  ctx.fillStyle = 'rgba(16, 18, 15, .34)'
  ctx.fillRect(0, 31, TEX, 2)
  ctx.fillRect(47, 0, 1, TEX)
  for (let x = 8; x < TEX; x += 16) {
    for (let y = 10; y < TEX; y += 22) {
      ctx.beginPath()
      ctx.arc(x + rng() * 4, y + rng() * 5, 0.9, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(10, 11, 9, .55)'
      ctx.fill()
    }
  }
  addStains(ctx, rng, 5, 'rgba(28, 35, 25, ALPHA)', 17, 0.28)
  addStains(ctx, rng, 3, 'rgba(88, 76, 47, ALPHA)', 12, 0.12)
  addCracks(ctx, rng, 4, 'rgba(13, 14, 12, 1)')
  return canvas
}

function makeTile(seed) {
  const { canvas, ctx, rng } = baseNoiseTexture(seed, [87, 88, 76], { grain: 11 })
  ctx.fillStyle = 'rgba(20, 22, 18, .75)'
  for (let i = 0; i <= TEX; i += 16) {
    ctx.fillRect(i, 0, 1, TEX)
    ctx.fillRect(0, i, TEX, 1)
  }
  // A few chipped tiles and one very wrong stain.
  ctx.fillStyle = 'rgba(35, 38, 30, .65)'
  ctx.fillRect(17, 33, 14, 13)
  ctx.fillStyle = 'rgba(62, 61, 50, .7)'
  ctx.fillRect(18, 34, 12, 11)
  addStains(ctx, rng, 7, 'rgba(31, 41, 28, ALPHA)', 15, 0.3)
  addStains(ctx, rng, 2, 'rgba(81, 28, 24, ALPHA)', 8, 0.2)
  addCracks(ctx, rng, 3, 'rgba(20, 20, 15, 1)')
  return canvas
}

function makePanel(seed) {
  const { canvas, ctx, rng } = baseNoiseTexture(seed, [45, 49, 46], { grain: 9, verticalBias: -3 })
  ctx.fillStyle = 'rgba(8, 10, 9, .7)'
  ctx.fillRect(0, 0, 2, TEX)
  ctx.fillRect(31, 0, 2, TEX)
  ctx.fillRect(0, 0, TEX, 2)
  ctx.fillRect(0, 31, TEX, 2)
  // Rivets.
  for (const [x, y] of [[7, 7], [24, 7], [39, 7], [56, 7], [7, 24], [56, 24], [7, 56], [56, 56]]) {
    ctx.beginPath()
    ctx.arc(x, y, 1.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(112, 117, 104, .6)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 0.5, y + 0.7, 0.7, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(8, 9, 8, .75)'
    ctx.fill()
  }
  // Faded stencil.
  ctx.save()
  ctx.translate(9, 46)
  ctx.rotate(-0.035)
  ctx.font = '7px monospace'
  ctx.fillStyle = 'rgba(142, 127, 74, .34)'
  ctx.fillText('07-B', 0, 0)
  ctx.fillRect(0, 3, 21, 1)
  ctx.restore()
  addStains(ctx, rng, 4, 'rgba(35, 26, 20, ALPHA)', 13, 0.26)
  addCracks(ctx, rng, 2, 'rgba(8, 10, 8, 1)')
  return canvas
}

function makeWrong(seed) {
  const { canvas, ctx, rng } = baseNoiseTexture(seed, [52, 29, 29], { grain: 22 })
  // Something under the plaster.
  for (let i = 0; i < 14; i++) {
    const x = rng() * TEX
    const y = rng() * TEX
    const r = 1 + rng() * 4
    ctx.beginPath()
    ctx.ellipse(x, y, r * 0.55, r, rng() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${12 + rng() * 22}, ${7 + rng() * 10}, ${8 + rng() * 10}, .5)`
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(18, 8, 9, .65)'
  for (let i = 0; i < 9; i++) {
    let x = rng() * TEX
    let y = rng() * TEX
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let j = 0; j < 8; j++) {
      x += (rng() - 0.45) * 7
      y += (rng() - 0.3) * 6
      ctx.lineTo(x, y)
    }
    ctx.lineWidth = 0.4 + rng() * 0.9
    ctx.stroke()
  }
  addStains(ctx, rng, 5, 'rgba(93, 22, 19, ALPHA)', 14, 0.25)
  return canvas
}

function makeFloor(seed, striped = false) {
  const { canvas, ctx, rng } = baseNoiseTexture(seed, [46, 46, 41], { grain: 19, verticalBias: -2 })
  ctx.fillStyle = 'rgba(16, 17, 15, .55)'
  for (let i = 0; i <= TEX; i += 16) {
    ctx.fillRect(i, 0, 1, TEX)
    ctx.fillRect(0, i, TEX, 1)
  }
  // Grime along tile edges.
  addStains(ctx, rng, 8, 'rgba(13, 16, 13, ALPHA)', 16, 0.28)
  addStains(ctx, rng, 3, 'rgba(73, 61, 36, ALPHA)', 12, 0.12)
  addCracks(ctx, rng, 3, 'rgba(12, 12, 10, 1)')

  if (striped) {
    ctx.save()
    ctx.globalAlpha = 0.44
    ctx.fillStyle = '#8c7431'
    ctx.fillRect(0, 28, TEX, 5)
    ctx.fillStyle = 'rgba(18, 18, 15, .8)'
    for (let x = -4; x < TEX + 4; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, 28)
      ctx.lineTo(x + 8, 33)
      ctx.lineTo(x + 8, 33)
      ctx.lineTo(x, 33)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }
  return canvas
}

function makeCeiling(seed) {
  const { canvas, ctx, rng } = baseNoiseTexture(seed, [29, 31, 29], { grain: 12 })
  ctx.fillStyle = 'rgba(9, 10, 9, .75)'
  ctx.fillRect(0, 0, TEX, 2)
  ctx.fillRect(0, 31, TEX, 2)
  ctx.fillRect(0, 0, 2, TEX)
  ctx.fillRect(31, 0, 2, TEX)
  addStains(ctx, rng, 4, 'rgba(47, 42, 28, ALPHA)', 12, 0.18)
  return canvas
}

function outlineFigure(ctx, points, fill = '#070908', rim = 'rgba(126, 134, 116, .34)') {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    ctx.lineTo(p[0], p[1])
  }
  ctx.closePath()
  ctx.fillStyle = rim
  ctx.translate(2, 0)
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    ctx.lineTo(p[0], p[1])
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function makeMonsterFrame(frame, frozen = false) {
  const w = 176
  const h = 352
  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')
  const rng = mulberry32(9001 + frame * 71)
  const sway = [0, 1.5, -1, 0.8, -0.6, 1.2][frame % 6]
  const armLift = [0, 8, -4, 6, -6, 3][frame % 6]
  const tilt = frozen ? -5 : [0, -1, 2, -2, 1, -3][frame % 6]
  const cx = w / 2 + sway

  ctx.save()
  ctx.translate(cx, 0)
  ctx.rotate((tilt * Math.PI) / 180)

  // A faint halo gives the silhouette an edge against the dark.
  const halo = ctx.createRadialGradient(0, 130, 8, 0, 140, 118)
  halo.addColorStop(0, 'rgba(109, 122, 103, .08)')
  halo.addColorStop(0.62, 'rgba(81, 94, 77, .035)')
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(-w, -10, w * 2, h)

  // Legs.
  for (const side of [-1, 1]) {
    const stride = Math.sin((frame / 6) * Math.PI * 2 + (side > 0 ? Math.PI : 0)) * 7
    outlineFigure(ctx, [
      [side * 9, 222],
      [side * 22 + stride * 0.2, 244],
      [side * 23 + stride, 310],
      [side * 35 + stride, 312],
      [side * 34 + stride, 320],
      [side * 12 + stride, 320],
      [side * 10, 246]
    ], '#060807', 'rgba(107, 116, 101, .22)')
  }

  // Torso: too narrow at the waist, too long in the ribs.
  outlineFigure(ctx, [
    [-14, 79],
    [-30, 100],
    [-25, 145],
    [-13, 190],
    [-17, 238],
    [-5, 244],
    [0, 208],
    [5, 244],
    [17, 238],
    [13, 190],
    [25, 145],
    [30, 100],
    [14, 79]
  ], '#060807', 'rgba(122, 132, 112, .34)')

  // Arms, articulated and much too long.
  for (const side of [-1, 1]) {
    const shoulder = [side * 26, 101]
    const elbow = [side * (38 + armLift * 0.3), 163 + armLift]
    const wrist = [side * (30 + armLift * 0.55), 236 + armLift * 0.4]
    const hand = [side * (34 + armLift * 0.55), 258 + armLift * 0.5]
    outlineFigure(ctx, [
      shoulder,
      [elbow[0] + side * 4, elbow[1]],
      [wrist[0] + side * 2, wrist[1]],
      [hand[0] + side * 8, hand[1] - 4],
      [hand[0] + side * 6, hand[1] + 15],
      [hand[0] - side * 2, hand[1] + 6],
      [wrist[0] - side * 3, wrist[1] - 2],
      [elbow[0] - side * 5, elbow[1] - 3],
      [shoulder[0] - side * 4, shoulder[1] + 9]
    ], '#070908', 'rgba(122, 132, 112, .28)')
  }

  // Neck and head.
  ctx.fillStyle = '#060807'
  ctx.fillRect(-5, 65, 10, 18)
  ctx.beginPath()
  ctx.ellipse(0, 47, 18, 27, frozen ? -0.08 : 0.02, 0, Math.PI * 2)
  ctx.fillStyle = '#050706'
  ctx.fill()
  ctx.strokeStyle = 'rgba(128, 137, 118, .24)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Face. Two pinpricks, no mouth.
  const eyeY = 47 + (frozen ? 1 : 0)
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(side * 6.5, eyeY, 2.4, frozen ? 3.2 : 2.2, 0, 0, Math.PI * 2)
    ctx.fillStyle = frozen ? 'rgba(238, 235, 207, .92)' : 'rgba(206, 207, 181, .64)'
    ctx.fill()
    if (frozen) {
      ctx.beginPath()
      ctx.arc(side * 6.5, eyeY, 7, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(225, 222, 190, .06)'
      ctx.fill()
    }
  }

  // Vertical wrongness along the body.
  ctx.save()
  ctx.beginPath()
  ctx.rect(-42, 60, 84, 190)
  ctx.clip()
  for (let i = 0; i < 34; i++) {
    const x = -30 + rng() * 60
    const y = 75 + rng() * 173
    ctx.strokeStyle = `rgba(149, 157, 132, ${0.015 + rng() * 0.055})`
    ctx.lineWidth = 0.5 + rng()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rng() - 0.5) * 5, y + 9 + rng() * 28)
    ctx.stroke()
  }
  ctx.restore()

  // Speckle.
  ctx.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < 170; i++) {
    ctx.fillStyle = rng() < 0.7 ? 'rgba(0, 0, 0, .28)' : 'rgba(152, 159, 137, .07)'
    ctx.fillRect(rng() * w, rng() * h, 1, 1)
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
  return canvas
}

function makePhantom(frame) {
  const w = 144
  const h = 300
  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')
  const rng = mulberry32(551 + frame)
  ctx.translate(w / 2, 0)
  outlineFigure(ctx, [
    [-10, 80], [-24, 105], [-18, 160], [-4, 210], [0, 272],
    [4, 210], [18, 160], [24, 105], [10, 80]
  ], 'rgba(195, 201, 180, .34)', 'rgba(225, 229, 207, .15)')
  ctx.beginPath()
  ctx.ellipse(0, 55, 17, 24, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(210, 215, 190, .36)'
  ctx.fill()
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(side * 6, 54, 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(4, 5, 4, .7)'
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = 'rgba(0, 0, 0, .2)'
    ctx.fillRect(rng() * w, rng() * h, 1, 1)
  }
  return canvas
}

function makeEcho() {
  const size = 160
  const canvas = makeCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 68)
  glow.addColorStop(0, 'rgba(155, 255, 215, .52)')
  glow.addColorStop(0.18, 'rgba(97, 228, 183, .22)')
  glow.addColorStop(0.56, 'rgba(48, 154, 133, .07)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.25)
  // The shard.
  ctx.beginPath()
  ctx.moveTo(0, -44)
  ctx.lineTo(19, -13)
  ctx.lineTo(8, 38)
  ctx.lineTo(-9, 48)
  ctx.lineTo(-19, -7)
  ctx.closePath()
  const body = ctx.createLinearGradient(-20, -40, 20, 48)
  body.addColorStop(0, '#172321')
  body.addColorStop(0.5, '#05100f')
  body.addColorStop(1, '#213c36')
  ctx.fillStyle = body
  ctx.fill()
  ctx.strokeStyle = 'rgba(152, 255, 219, .68)'
  ctx.lineWidth = 1.3
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-2, -35)
  ctx.lineTo(7, -11)
  ctx.lineTo(2, 11)
  ctx.lineTo(14, 31)
  ctx.strokeStyle = 'rgba(149, 255, 218, .55)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-11, -20)
  ctx.lineTo(-2, -4)
  ctx.lineTo(-6, 13)
  ctx.strokeStyle = 'rgba(100, 221, 185, .35)'
  ctx.stroke()
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = 'rgba(217, 255, 239, .6)'
    ctx.fillRect(-12 + Math.random() * 24, -26 + Math.random() * 58, 1, 1)
  }
  ctx.restore()

  // Focus ring.
  ctx.beginPath()
  ctx.ellipse(cx, cy, 63, 24, -0.18, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(110, 239, 199, .13)'
  ctx.lineWidth = 1
  ctx.stroke()
  return canvas
}

function makeExit(open) {
  const w = 192
  const h = 352
  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')
  const cx = w / 2
  const top = 28
  const bottom = 340
  const half = 59

  const glow = ctx.createRadialGradient(cx, h * 0.62, 8, cx, h * 0.62, 140)
  if (open) {
    glow.addColorStop(0, 'rgba(157, 255, 213, .34)')
    glow.addColorStop(0.5, 'rgba(54, 197, 163, .08)')
  } else {
    glow.addColorStop(0, 'rgba(154, 49, 41, .18)')
    glow.addColorStop(0.5, 'rgba(106, 25, 22, .04)')
  }
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Monumental freestanding gate.
  ctx.fillStyle = '#101311'
  ctx.fillRect(cx - half - 14, top + 4, 14, bottom - top)
  ctx.fillRect(cx + half, top + 4, 14, bottom - top)
  ctx.fillRect(cx - half - 14, top - 12, half * 2 + 28, 18)
  ctx.strokeStyle = open ? 'rgba(131, 255, 211, .8)' : 'rgba(142, 65, 50, .62)'
  ctx.lineWidth = 2
  ctx.strokeRect(cx - half - 14, top - 12, half * 2 + 28, bottom - top + 12)

  // Inner void.
  ctx.fillStyle = open ? '#040807' : '#080504'
  ctx.fillRect(cx - half, top + 8, half * 2, bottom - top - 8)
  ctx.beginPath()
  ctx.moveTo(cx - half, top + 8)
  ctx.lineTo(cx + half, top + 8)
  ctx.lineTo(cx + half - 10, bottom)
  ctx.lineTo(cx - half + 10, bottom)
  ctx.closePath()
  ctx.fillStyle = open ? 'rgba(18, 54, 46, .58)' : 'rgba(42, 12, 11, .3)'
  ctx.fill()

  // Seam.
  ctx.beginPath()
  ctx.moveTo(cx, top + 8)
  ctx.lineTo(cx, bottom)
  ctx.strokeStyle = open ? 'rgba(147, 255, 218, .7)' : 'rgba(137, 54, 45, .55)'
  ctx.lineWidth = 1.2
  ctx.stroke()

  // Graphic marks.
  ctx.save()
  ctx.translate(cx, h * 0.56)
  ctx.strokeStyle = open ? 'rgba(168, 255, 224, .65)' : 'rgba(156, 80, 63, .45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 19, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, -12)
  ctx.lineTo(0, 12)
  ctx.moveTo(-12, 0)
  ctx.lineTo(12, 0)
  ctx.stroke()
  ctx.font = '8px monospace'
  ctx.fillStyle = open ? 'rgba(188, 255, 231, .62)' : 'rgba(157, 85, 71, .58)'
  ctx.textAlign = 'center'
  ctx.fillText(open ? 'OPEN' : 'SEALED', 0, 44)
  ctx.restore()

  // Hazard teeth at the base.
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(128, 98, 43, .25)' : 'rgba(12, 12, 10, .6)'
    ctx.fillRect(cx - 52 + i * 13, bottom - 11, 13, 8)
  }
  return canvas
}

function makeLamp() {
  const size = 160
  const canvas = makeCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 78)
  glow.addColorStop(0, 'rgba(255, 236, 178, .92)')
  glow.addColorStop(0.09, 'rgba(247, 218, 146, .68)')
  glow.addColorStop(0.32, 'rgba(210, 169, 96, .18)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(255, 248, 211, .85)'
  ctx.fillRect(cx - 24, cy - 3, 48, 6)
  ctx.fillStyle = 'rgba(255, 255, 236, .95)'
  ctx.fillRect(cx - 19, cy - 1, 38, 2)
  return canvas
}

function makeDust() {
  const size = 64
  const canvas = makeCanvas(size, size)
  const ctx = canvas.getContext('2d')
  for (let i = 0; i < 42; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const a = 0.03 + Math.random() * 0.09
    ctx.fillStyle = `rgba(225, 221, 190, ${a})`
    ctx.fillRect(x, y, Math.random() < 0.2 ? 1.5 : 0.7, 0.7)
  }
  return canvas
}

function makeFace() {
  const size = 620
  const canvas = makeCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const rng = mulberry32(80808)
  ctx.fillStyle = '#010202'
  ctx.fillRect(0, 0, size, size)

  // Sick halo behind the head.
  const halo = ctx.createRadialGradient(size / 2, size * 0.45, 20, size / 2, size * 0.5, size * 0.52)
  halo.addColorStop(0, 'rgba(169, 172, 147, .23)')
  halo.addColorStop(0.42, 'rgba(83, 88, 73, .1)')
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, size, size)

  ctx.save()
  ctx.translate(size / 2, size * 0.49)
  ctx.rotate(-0.035)

  // Elongated skull.
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.225, size * 0.37, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#0b0d0b'
  ctx.fill()
  ctx.strokeStyle = 'rgba(151, 157, 131, .42)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Brow plane.
  ctx.beginPath()
  ctx.ellipse(0, -size * 0.1, size * 0.21, size * 0.105, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(34, 38, 31, .85)'
  ctx.fill()

  // Eyes: wet black cuts, each with a single far-too-small point of light.
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(side * size * 0.092, -size * 0.065, size * 0.048, size * 0.072, side * 0.03, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.strokeStyle = 'rgba(166, 172, 143, .2)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(side * size * 0.085, -size * 0.055, 2.2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(244, 241, 210, .94)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(side * size * 0.085, -size * 0.055, 14, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(228, 225, 194, .06)'
    ctx.fill()
  }

  // Nasal slit.
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.005)
  ctx.lineTo(-size * 0.014, size * 0.066)
  ctx.lineTo(size * 0.008, size * 0.074)
  ctx.strokeStyle = 'rgba(0, 0, 0, .85)'
  ctx.lineWidth = 4
  ctx.stroke()

  // Mouth, opened slightly too far.
  ctx.beginPath()
  ctx.ellipse(0, size * 0.185, size * 0.09, size * 0.12, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.strokeStyle = 'rgba(142, 147, 120, .26)'
  ctx.lineWidth = 1.3
  ctx.stroke()
  for (let i = 0; i < 7; i++) {
    const x = -size * 0.06 + i * size * 0.02
    const h = size * (0.015 + rng() * 0.028)
    ctx.fillStyle = 'rgba(166, 166, 139, .3)'
    ctx.fillRect(x, size * 0.085, size * 0.008, h)
  }

  // Cheek ridges and pores.
  for (let i = 0; i < 500; i++) {
    const angle = rng() * Math.PI * 2
    const radius = Math.pow(rng(), 0.6)
    const x = Math.cos(angle) * size * 0.21 * radius
    const y = Math.sin(angle) * size * 0.345 * radius
    ctx.fillStyle = rng() < 0.7 ? 'rgba(0, 0, 0, .25)' : 'rgba(152, 158, 132, .07)'
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.restore()

  // Interference bands.
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 24; i++) {
    const y = rng() * size
    ctx.fillStyle = `rgba(${70 + rng() * 80}, ${45 + rng() * 40}, ${40 + rng() * 30}, ${rng() * 0.045})`
    ctx.fillRect(0, y, size, 1 + rng() * 3)
  }
  return canvas
}

export function createTextureSet() {
  const wall = [makeConcrete(20), makeTile(70), makePanel(120), makeWrong(170)]
  const floor = [makeFloor(220), makeFloor(270, true)]
  const ceiling = makeCeiling(320)

  return {
    wall: wall.map(canvasToUint32),
    wallCanvas: wall,
    floor: floor.map(canvasToUint32),
    floorCanvas: floor,
    ceiling: canvasToUint32(ceiling),
    sprites: {
      monster: Array.from({ length: 6 }, (_, i) => makeMonsterFrame(i, false)),
      monsterFrozen: makeMonsterFrame(2, true),
      phantom: [makePhantom(0), makePhantom(1)],
      echo: makeEcho(),
      exitLocked: makeExit(false),
      exitOpen: makeExit(true),
      lamp: makeLamp(),
      dust: makeDust(),
      face: makeFace()
    }
  }
}
