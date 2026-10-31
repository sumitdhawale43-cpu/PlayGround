import {
  MAP_W,
  MAP_H,
  LAMPS,
  floorVariant,
  wallVariant,
  cellHash,
  isWallCell
} from './map.js'

const FOV = (72 * Math.PI) / 180
const PLANE_LEN = Math.tan(FOV / 2)
const FAR = 34
const TEX = 64

export class Renderer {
  constructor(canvas, textures) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.textures = textures
    this.width = 0
    this.height = 0
    this.image = null
    this.buffer = null
    this.zBuffer = new Float32Array(0)
    this.lightGrid = new Float32Array(MAP_W * MAP_H)
    this.lightTime = -1
    this.flash = 1
    this.lastStare = 0
    this.resize()
  }

  resize() {
    const cssW = Math.max(1, window.innerWidth)
    const cssH = Math.max(1, window.innerHeight)
    const budget = cssW * cssH > 1800000 ? 560000 : 680000
    let scale = Math.sqrt(budget / (cssW * cssH))
    scale = Math.max(0.33, Math.min(1, scale))
    if (cssW > cssH) {
      this.width = Math.max(320, Math.round(cssW * scale))
    } else {
      this.width = Math.max(260, Math.round(cssW * scale))
    }
    this.height = Math.max(240, Math.round(this.width * (cssH / cssW)))
    if (this.height > 1100) {
      this.height = 1100
      this.width = Math.round(this.height * (cssW / cssH))
    }
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.width = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
    this.ctx.imageSmoothingEnabled = false
    this.image = this.ctx.createImageData(this.width, this.height)
    this.buffer = new Uint32Array(this.image.data.buffer)
    this.zBuffer = new Float32Array(this.width)
    this.updateLightGrid(0, 0)
  }

  updateLightGrid(time, corruption) {
    const t = Math.floor(time * 12) / 12
    if (Math.abs(t - this.lightTime) < 0.04) return
    this.lightTime = t
    const grid = this.lightGrid
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        let light = 0.028 + (1 - corruption) * 0.006
        for (let i = 0; i < LAMPS.length; i++) {
          const lx = LAMPS[i][0]
          const ly = LAMPS[i][1]
          const dx = x + 0.5 - lx
          const dy = y + 0.5 - ly
          const d2 = dx * dx + dy * dy
          if (d2 > 52) continue
          const flicker =
            0.72 +
            0.28 * Math.sin(t * 5.7 + i * 2.4) * Math.sin(t * 1.7 + i * 0.7)
          light += (0.95 * flicker) / (1 + d2 * 0.42)
        }
        grid[y * MAP_W + x] = light
      }
    }
  }

  render(scene) {
    const { player, monster, echoes, exit, corruption } = scene
    const W = this.width
    const H = this.height
    if (!W || !H) return
    this.updateLightGrid(scene.time, corruption)

    const buf = this.buffer
    const zb = this.zBuffer
    const dirX = Math.cos(player.angle)
    const dirY = Math.sin(player.angle)
    const planeX = -dirY * PLANE_LEN
    const planeY = dirX * PLANE_LEN
    const rayDirX0 = dirX - planeX
    const rayDirY0 = dirY - planeY
    const rayDirX1 = dirX + planeX
    const rayDirY1 = dirY + planeY

    const bob = player.bob || 0
    const breath = Math.sin(scene.time * 1.1) * 1.3
    const horizon =
      H / 2 +
      player.pitch * (H / 720) * 1.3 +
      bob * (H / 720) +
      breath * (0.35 + corruption * 0.9)

    const tintR = 1 + corruption * 0.16
    const tintG = 1 - corruption * 0.12
    const tintB = 1 - corruption * 0.18
    const flicker = this.flash
    const lightGrid = this.lightGrid
    const wallTex = this.textures.wall
    const floorTex = this.textures.floor
    const ceilingTex = this.textures.ceiling

    // Ceiling.
    const ceilEnd = Math.max(0, Math.min(H, Math.floor(horizon)))
    for (let y = 0; y < ceilEnd; y++) {
      const p = horizon - y
      if (p < 0.7) continue
      const rowDistance = (H * 0.5) / p
      if (rowDistance > FAR) {
        const rowOff = y * W
        for (let x = 0; x < W; x++) buf[rowOff + x] = 0xff070807
        continue
      }
      const stepX = (rowDistance * (rayDirX1 - rayDirX0)) / W
      const stepY = (rowDistance * (rayDirY1 - rayDirY0)) / W
      let worldX = player.x + rowDistance * rayDirX0
      let worldY = player.y + rowDistance * rayDirY0
      const rowOff = y * W
      const fog = Math.min(0.92, rowDistance * 0.075)
      for (let x = 0; x < W; x++) {
        const cx = (x / W) * 2 - 1
        const beam = Math.max(0, 1 - cx * cx * 1.4)
        const cellX = Math.floor(worldX)
        const cellY = Math.floor(worldY)
        let gridIndex = cellY * MAP_W + cellX
        if (cellX < 0 || cellY < 0 || cellX >= MAP_W || cellY >= MAP_H) gridIndex = -1
        const lamp = gridIndex >= 0 ? lightGrid[gridIndex] : 0.03
        const light =
          0.022 +
          lamp * 0.22 +
          (0.24 * flicker * beam) / (1 + rowDistance * rowDistance * 0.22)
        const shade = Math.max(0.015, light * (1 - fog))
        const tx = (worldX * TEX) & 63
        const ty = (worldY * TEX) & 63
        const color = ceilingTex[(ty << 6) + tx]
        const r = Math.min(255, (color & 255) * shade * 0.92 * tintR)
        const g = Math.min(255, ((color >> 8) & 255) * shade * 0.95 * tintG)
        const b = Math.min(255, ((color >> 16) & 255) * shade * 0.97 * tintB)
        buf[rowOff + x] = 0xff000000 | (b << 16) | (g << 8) | r
        worldX += stepX
        worldY += stepY
      }
    }

    // Floor.
    const floorStart = Math.max(0, Math.min(H, Math.floor(horizon) + 1))
    for (let y = floorStart; y < H; y++) {
      const p = y - horizon
      if (p < 0.7) continue
      const rowDistance = (H * 0.5) / p
      if (rowDistance > FAR) {
        const rowOff = y * W
        for (let x = 0; x < W; x++) buf[rowOff + x] = 0xff060706
        continue
      }
      const stepX = (rowDistance * (rayDirX1 - rayDirX0)) / W
      const stepY = (rowDistance * (rayDirY1 - rayDirY0)) / W
      let worldX = player.x + rowDistance * rayDirX0
      let worldY = player.y + rowDistance * rayDirY0
      const rowOff = y * W
      const fog = Math.min(0.92, rowDistance * 0.08)
      for (let x = 0; x < W; x++) {
        const cx = (x / W) * 2 - 1
        const beam = Math.max(0, 1 - cx * cx * 1.45)
        const cellX = Math.floor(worldX)
        const cellY = Math.floor(worldY)
        let gridIndex = cellY * MAP_W + cellX
        if (cellX < 0 || cellY < 0 || cellX >= MAP_W || cellY >= MAP_H) gridIndex = -1
        const lamp = gridIndex >= 0 ? lightGrid[gridIndex] : 0.03
        const light =
          0.027 +
          lamp * 0.63 +
          (0.85 * flicker * beam) / (1 + rowDistance * rowDistance * 0.1)
        const shade = Math.max(0.018, light * (1 - fog))
        const variant = floorVariant(cellX, cellY)
        const tex = floorTex[variant]
        const tx = (worldX * TEX) & 63
        const ty = (worldY * TEX) & 63
        const color = tex[(ty << 6) + tx]
        const r = Math.min(255, (color & 255) * shade * tintR)
        const g = Math.min(255, ((color >> 8) & 255) * shade * tintG)
        const b = Math.min(255, ((color >> 16) & 255) * shade * 0.9 * tintB)
        buf[rowOff + x] = 0xff000000 | (b << 16) | (g << 8) | r
        worldX += stepX
        worldY += stepY
      }
    }

    // Walls, column by column.
    for (let x = 0; x < W; x++) {
      const cameraX = (2 * x) / W - 1
      const rayDirX = dirX + planeX * cameraX
      const rayDirY = dirY + planeY * cameraX
      let mapX = Math.floor(player.x)
      let mapY = Math.floor(player.y)
      const deltaX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX)
      const deltaY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY)
      let stepX
      let stepY
      let sideDistX
      let sideDistY
      if (rayDirX < 0) {
        stepX = -1
        sideDistX = (player.x - mapX) * deltaX
      } else {
        stepX = 1
        sideDistX = (mapX + 1 - player.x) * deltaX
      }
      if (rayDirY < 0) {
        stepY = -1
        sideDistY = (player.y - mapY) * deltaY
      } else {
        stepY = 1
        sideDistY = (mapY + 1 - player.y) * deltaY
      }
      let hit = 0
      let side = 0
      let steps = 0
      while (!hit && steps++ < 90) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaX
          mapX += stepX
          side = 0
        } else {
          sideDistY += deltaY
          mapY += stepY
          side = 1
        }
        if (isWallCell(mapX, mapY)) hit = 1
      }
      if (!hit) {
        zb[x] = FAR
        continue
      }
      const perp =
        side === 0
          ? (mapX - player.x + (1 - stepX) / 2) / rayDirX
          : (mapY - player.y + (1 - stepY) / 2) / rayDirY
      const dist = Math.max(0.039, perp)
      zb[x] = dist

      let wallX =
        side === 0 ? player.y + dist * rayDirY : player.x + dist * rayDirX
      wallX -= Math.floor(wallX)
      let texX = Math.floor(wallX * TEX)
      if (side === 0 && rayDirX > 0) texX = TEX - texX - 1
      if (side === 1 && rayDirY < 0) texX = TEX - texX - 1

      let variant = wallVariant(mapX, mapY)
      if (corruption > 0.48) {
        const h = cellHash(mapX, mapY)
        if (h % 29 < (corruption - 0.48) * 30) variant = 3
      }
      const tex = wallTex[variant]
      texX = (texX + (cellHash(mapX, mapY) & 31)) & 63

      let lineHeight = H / dist
      let top = horizon - lineHeight / 2
      let bottom = horizon + lineHeight / 2
      if (corruption > 0.14 && x % 7 === 0) {
        const warp =
          Math.sin(scene.time * 2.4 + x * 0.052 + mapX * 1.7) *
          corruption *
          lineHeight *
          0.075
        top -= Math.abs(warp)
      }
      const drawStart = Math.max(0, Math.floor(top))
      const drawEnd = Math.min(H - 1, Math.ceil(bottom))
      if (drawEnd < drawStart) continue

      const cellLight = lightGrid[mapY * MAP_W + mapX] ?? 0.05
      const sideShade = side === 1 ? 0.72 : 1
      const fog = Math.min(0.88, dist * 0.095)
      const beam = Math.max(0, 1 - cameraX * cameraX * 1.25)
      const light =
        0.035 +
        cellLight * 0.56 * sideShade +
        (0.95 * flicker * beam * sideShade) / (1 + dist * dist * 0.11)
      const shade = Math.max(0.018, light * (1 - fog))
      const texStep = TEX / Math.max(1, bottom - top)
      let texPos = (drawStart - top) * texStep
      const rowOff = drawStart * W
      let idx = rowOff + x
      for (let y = drawStart; y <= drawEnd; y++) {
        const ty = texPos & 63
        const color = tex[(ty << 6) + texX]
        const r = Math.min(255, (color & 255) * shade * tintR)
        const g = Math.min(255, ((color >> 8) & 255) * shade * tintG)
        const b = Math.min(255, ((color >> 16) & 255) * shade * 0.9 * tintB)
        buf[idx] = 0xff000000 | (b << 16) | (g << 8) | r
        idx += W
        texPos += texStep
      }
    }

    if (corruption > 0.08) this.applyCorruption(corruption, scene.time)

    this.ctx.putImageData(this.image, 0, 0)
    this.ctx.imageSmoothingEnabled = false
    this.drawSprites(scene, horizon, dirX, dirY, planeX, planeY)
    this.drawDust(scene, W, H)
  }

  applyCorruption(corruption, time) {
    const W = this.width
    const H = this.height
    const buf = this.buffer
    const amount = Math.max(0, corruption - 0.06)
    const rows = Math.floor(H * (amount * 0.14 + (amount > 0.55 ? 0.03 : 0)))
    const mag = Math.max(1, Math.floor(W * 0.012 * amount))

    for (let i = 0; i < rows; i++) {
      const seed = Math.sin((i + 1) * 12.9898 + time * 2.13)
      const y = Math.floor(((seed * 43758.5453) % 1 + 1) % 1 * H)
      const rowStart = y * W
      const shift = Math.floor((Math.sin(time * 7 + i * 2.3) * 0.5 + 0.5) * 2 * mag) - mag
      if (shift > 0 && shift < W) {
        buf.copyWithin(rowStart + shift, rowStart, rowStart + W - shift)
        for (let x = 0; x < shift; x++) buf[rowStart + x] = 0xff050505
      } else if (shift < 0 && -shift < W) {
        buf.copyWithin(rowStart, rowStart - shift, rowStart + W)
        for (let x = W + shift; x < W; x++) buf[rowStart + x] = 0xff050505
      }
    }

    if (amount > 0.38) {
      const bands = Math.floor(amount * 4)
      for (let i = 0; i < bands; i++) {
        const seed = Math.sin((i + 1) * 91.7 + time * 1.7)
        if (seed < 0.63) continue
        const y = Math.floor(((seed * 317.31) % 1 + 1) % 1 * H)
        const start = y * W
        const width = Math.floor(W * (0.08 + amount * 0.2))
        const x0 = Math.floor(((seed * 53.7) % 1 + 1) % 1 * (W - width))
        for (let x = x0; x < x0 + width; x++) {
          buf[start + x] ^= 0x00ffffff
        }
      }
    }
  }

  drawSprites(scene, horizon, dirX, dirY, planeX, planeY) {
    const { player, monster, echoes, exit, corruption } = scene
    const W = this.width
    const H = this.height
    const list = []

    if (monster && monster.visible !== false) {
      const dx = monster.x - player.x
      const dy = monster.y - player.y
      const dist = Math.hypot(dx, dy)
      if (dist > 0.22) {
        const sprite = monster.observed ? this.textures.sprites.monsterFrozen : this.textures.sprites.monster[monster.frame % 6]
        list.push({
          kind: 'monster',
          x: monster.x,
          y: monster.y,
          canvas: sprite,
          height: 0.98,
          baseZ: 0,
          alpha: Math.max(0.18, Math.min(1, 1.2 - dist / 20)),
          dist,
          monster
        })
      }
    }

    for (const echo of echoes) {
      if (!echo.active) continue
      const dist = Math.hypot(echo.x - player.x, echo.y - player.y)
      if (dist > 26) continue
      list.push({
        kind: 'echo',
        x: echo.x,
        y: echo.y,
        canvas: this.textures.sprites.echo,
        height: 0.42,
        baseZ: 0.64 + Math.sin(scene.time * 1.7 + echo.x) * 0.035,
        alpha: 0.95,
        dist,
        echo
      })
    }

    if (exit) {
      const dist = Math.hypot(exit.x - player.x, exit.y - player.y)
      if (dist < 28) {
        list.push({
          kind: 'exit',
          x: exit.x,
          y: exit.y,
          canvas: exit.unlocked ? this.textures.sprites.exitOpen : this.textures.sprites.exitLocked,
          height: 0.97,
          baseZ: 0,
          alpha: 1,
          dist,
          exit
        })
      }
    }

    for (const lamp of LAMPS) {
      const dist = Math.hypot(lamp[0] - player.x, lamp[1] - player.y)
      if (dist > 14) continue
      list.push({
        kind: 'lamp',
        x: lamp[0],
        y: lamp[1],
        canvas: this.textures.sprites.lamp,
        height: 0.18,
        baseZ: 0.91,
        alpha: Math.min(0.9, 1.1 - dist / 15),
        dist
      })
    }

    if (scene.phantoms && corruption > 0.3) {
      for (const phantom of scene.phantoms) {
        list.push({
          kind: 'phantom',
          x: phantom.x,
          y: phantom.y,
          canvas: this.textures.sprites.phantom[phantom.frame % 2],
          height: 0.96,
          baseZ: 0,
          alpha:
            (phantom.renderAlpha ?? phantom.alpha) *
            Math.min(1, (corruption - 0.3) * 2),
          dist: Math.hypot(phantom.x - player.x, phantom.y - player.y),
          phantom
        })
      }
    }

    list.sort((a, b) => b.dist - a.dist)

    const invDet = 1 / (planeX * dirY - dirX * planeY)
    const ctx = this.ctx
    ctx.imageSmoothingEnabled = false

    for (const sprite of list) {
      const sx = sprite.x - player.x
      const sy = sprite.y - player.y
      const transformX = invDet * (dirY * sx - dirX * sy)
      const transformY = invDet * (-planeY * sx + planeX * sy)
      if (transformY <= 0.16) continue
      const screenX = (W / 2) * (1 + transformX / transformY)
      const projectedH = (H * sprite.height) / transformY
      const img = sprite.canvas
      const projectedW = projectedH * (img.width / img.height)
      const bottom =
        horizon + ((0.5 - sprite.baseZ) * H) / transformY
      const top = bottom - projectedH
      const left = screenX - projectedW / 2
      const right = screenX + projectedW / 2

      const start = Math.max(0, Math.floor(left))
      const end = Math.min(W - 1, Math.ceil(right))
      if (end < start || projectedH < 0.7) continue
      if (right < 0 || left > W) continue

      // Skip if its center column is behind a wall, for the rare glow pass.
      const centerCol = Math.max(0, Math.min(W - 1, Math.round(screenX)))
      const centerVisible = this.zBuffer[centerCol] > transformY

      ctx.globalAlpha = sprite.alpha

      if (sprite.kind === 'lamp') {
        if (!centerVisible) {
          ctx.globalAlpha = 1
          continue
        }
        ctx.globalCompositeOperation = 'lighter'
        this.drawColumnRange(img, left, right, top, projectedH, start, end, transformY)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        continue
      }

      if (sprite.kind === 'echo') {
        if (!centerVisible) {
          ctx.globalAlpha = 1
          continue
        }
        ctx.globalCompositeOperation = 'lighter'
        const pulse = 0.72 + Math.sin(scene.time * 3 + sprite.x) * 0.12
        ctx.globalAlpha = 0.75 * pulse
        this.drawColumnRange(img, left, right, top + projectedH * 0.08, projectedH * 0.95, start, end, transformY)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        continue
      }

      if (sprite.kind === 'phantom') {
        if (sprite.phantom.fade <= 0) {
          ctx.globalAlpha = 1
          continue
        }
        ctx.globalAlpha = sprite.alpha
        this.drawColumnRange(img, left, right, top, projectedH, start, end, transformY)
        ctx.globalAlpha = 1
        continue
      }

      // The monster gets a faint chromatic double when reality is damaged.
      if (sprite.kind === 'monster' && corruption > 0.32) {
        ctx.globalAlpha = sprite.alpha * corruption * 0.22
        ctx.globalCompositeOperation = 'lighter'
        this.drawColumnRange(
          img,
          left - projectedW * 0.032,
          right - projectedW * 0.032,
          top,
          projectedH,
          Math.max(0, start - Math.floor(projectedW * 0.03)),
          Math.min(W - 1, end - Math.floor(projectedW * 0.03)),
          transformY
        )
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.globalAlpha = sprite.alpha
      this.drawColumnRange(img, left, right, top, projectedH, start, end, transformY)
      ctx.globalAlpha = 1
    }
  }

  drawColumnRange(img, left, right, top, projectedH, start, end, transformY) {
    const W = this.width
    const zb = this.zBuffer
    const ctx = this.ctx
    const span = Math.max(0.0001, right - left)
    const srcW = img.width
    const srcH = img.height
    let runStart = -1

    for (let x = start; x <= end; x++) {
      const visible = zb[x] > transformY - 0.08
      if (visible && runStart < 0) runStart = x
      if ((!visible || x === end) && runStart >= 0) {
        const runEnd = visible ? x + 1 : x
        if (runEnd > runStart) {
          const u0 = Math.max(0, (runStart - left) / span)
          const u1 = Math.min(1, (runEnd - left) / span)
          if (u1 > u0) {
            ctx.drawImage(
              img,
              u0 * srcW,
              0,
              Math.max(1, (u1 - u0) * srcW),
              srcH,
              runStart,
              top,
              runEnd - runStart,
              projectedH
            )
          }
        }
        runStart = -1
      }
    }
  }

  drawDust(scene, W, H) {
    const ctx = this.ctx
    const count = 28
    const time = scene.time
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < count; i++) {
      const seed = i * 17.31
      const x = ((seed * 97.13 + time * (2 + (i % 3))) % (W + 80)) - 40
      const y = ((seed * 41.77 + Math.sin(time * 0.2 + i) * 24 + time * 1.1) % H + H) % H
      const a = 0.025 + ((i * 13) % 7) * 0.006
      ctx.fillStyle = `rgba(228, 222, 186, ${a})`
      ctx.fillRect(x | 0, y | 0, i % 5 === 0 ? 2 : 1, 1)
    }
    ctx.restore()
  }
}
