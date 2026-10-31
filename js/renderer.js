/* ============================================================
   A small first-person software renderer: DDA walls, floor and
   ceiling casting, z-buffered billboards, warm flashlight.
   ============================================================ */

const DEG = Math.PI / 180;

export class Renderer {
  constructor(canvas, textures) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.textures = textures;
    this.w = 0;
    this.h = 0;
    this.image = null;
    this.buf = null;
    this.zbuf = null;
    this.dx2 = null;
    this.tmp = null;
    this.quality = 1;
    this.resize();
  }

  resize() {
    const aspect = Math.max(0.35, window.innerWidth / Math.max(1, window.innerHeight));
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const budget = (coarse ? 128000 : 240000) * this.quality;
    let h = Math.sqrt(budget / aspect);
    let w = h * aspect;
    w = Math.max(180, Math.min(760, Math.round(w)));
    h = Math.max(180, Math.min(720, Math.round(h)));

    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.image = this.ctx.createImageData(w, h);
    this.buf = new Uint32Array(this.image.data.buffer);
    this.zbuf = new Float32Array(w);
    this.tmp = new Uint32Array(w * 32);
    this.dx2 = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      const dx = (x - w / 2) / (w * 0.5);
      this.dx2[x] = dx * dx;
    }
    if (!this.noise) {
      this.noise = new Uint8Array(128 * 128);
      for (let i = 0; i < this.noise.length; i++) this.noise[i] = (Math.random() * 256) | 0;
    }
    this.ctx.imageSmoothingEnabled = false;
  }

  fog(d) {
    return 1 / (1 + d * d * 0.052);
  }

  render(v) {
    const w = this.w, h = this.h, buf = this.buf, zbuf = this.zbuf, tex = this.textures;
    const level = v.level;
    const px = v.px, py = v.py;
    const dirX = Math.cos(v.angle), dirY = Math.sin(v.angle);
    const aspect = w / h;
    const hfov = (70 + 16 * Math.max(0, Math.min(1, (aspect - 0.55) / 0.95))) * DEG;
    const planeLen = Math.tan(hfov / 2);
    const planeX = -dirY * planeLen, planeY = dirX * planeLen;
    const focal = (w / 2) / planeLen;
    const time = v.time || 0;
    const horizon = h * (0.5 + (v.pitch || 0)) + (v.bob || 0) + Math.sin(time * 47) * (v.shake || 0) * 0.7;
    const breakLevel = v.breakLevel || 0;
    const flicker = 0.9 + 0.1 * Math.sin(time * 23.7) * Math.sin(time * 7.3) + (v.flashPulse || 0);
    const fogCol = 0xff0a0806;

    buf.fill(fogCol);

    const rayDirX0 = dirX - planeX;
    const rayDirY0 = dirY - planeY;
    const rayDirX1 = dirX + planeX;
    const rayDirY1 = dirY + planeY;

    const focusY = horizon + h * 0.16;
    const invH = 1 / (h * 0.62);

    /* ---------------- floor + ceiling ---------------- */
    const floorTex = tex.floor, ceilTex = tex.ceiling, TS = 128;
    for (let y = Math.max(0, Math.ceil(horizon) + 1); y < h; y++) {
      const p = y - horizon;
      const rowDist = (0.75 * focal) / p;
      const fog = this.fog(rowDist);
      const dy = (y - focusY) * invH;
      const warm = 0.05 + 1.55 * fog;
      const rowBaseY = (((rowDist * 0.5 + py * 0) * 0) | 0); // silence linters
      const stepX = rowDist * (rayDirX1 - rayDirX0) / w;
      const stepY = rowDist * (rayDirY1 - rayDirY0) / w;
      let fx = px + rowDist * rayDirX0;
      let fy = py + rowDist * rayDirY0;
      const floorOff = ((((fy * TS) | 0) & 127) << 7);
      for (let x = 0; x < w; x++) {
        const r2 = this.dx2[x] + dy * dy;
        let beam = 1.35 - 2.0 * r2;
        if (beam < 0) beam = 0;
        const shade = (0.045 + beam * 1.15) * warm;
        const c = floorTex[(((fy * TS) | 0) & 127) * 128 + (((fx * TS) | 0) & 127)];
        const idx = y * w + x;
        if (shade > 0.008) {
          let r = ((c & 255) * shade * 1.05 + 2.5) | 0;
          let g = (((c >> 8) & 255) * shade * 0.99 + 3) | 0;
          let b = (((c >> 16) & 255) * shade * 0.86 + 5) | 0;
          if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
          buf[idx] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
        fx += stepX; fy += stepY;
        void floorOff;
      }
    }

    for (let y = 0; y < Math.min(h, Math.floor(horizon)); y++) {
      const p = horizon - y;
      if (p < 1) continue;
      const rowDist = (0.8 * focal) / p;
      const fog = this.fog(rowDist);
      const dy = (horizon - h * 0.34 - y) * invH;
      const stepX = rowDist * (rayDirX1 - rayDirX0) / w;
      const stepY = rowDist * (rayDirY1 - rayDirY0) / w;
      let fx = px + rowDist * rayDirX0;
      let fy = py + rowDist * rayDirY0;
      for (let x = 0; x < w; x++) {
        const r2 = this.dx2[x] * 1.4 + dy * dy;
        let beam = 1.1 - 2.2 * r2;
        if (beam < 0) beam = 0;
        const shade = (0.025 + beam * 0.42) * fog;
        if (shade > 0.006) {
          const c = ceilTex[(((fy * TS) | 0) & 127) * 128 + (((fx * TS) | 0) & 127)];
          let r = ((c & 255) * shade * 0.92 + 2) | 0;
          let g = (((c >> 8) & 255) * shade * 0.96 + 2.5) | 0;
          let b = (((c >> 16) & 255) * shade * 1.02 + 4) | 0;
          if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
          buf[y * w + x] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
        fx += stepX; fy += stepY;
      }
    }

    /* ---------------- walls ---------------- */
    for (let x = 0; x < w; x++) {
      const cameraX = (2 * x) / w - 1;
      const rayX = dirX + planeX * cameraX;
      const rayY = dirY + planeY * cameraX;
      let mapX = px | 0, mapY = py | 0;
      const deltaX = Math.abs(1 / (rayX || 1e-9));
      const deltaY = Math.abs(1 / (rayY || 1e-9));
      let stepX, stepY, sideX, sideY;
      if (rayX < 0) { stepX = -1; sideX = (px - mapX) * deltaX; }
      else { stepX = 1; sideX = (mapX + 1 - px) * deltaX; }
      if (rayY < 0) { stepY = -1; sideY = (py - mapY) * deltaY; }
      else { stepY = 1; sideY = (mapY + 1 - py) * deltaY; }
      let side = 0, hitType = 0, steps = 0;
      while (steps++ < 96) {
        if (sideX < sideY) { sideX += deltaX; mapX += stepX; side = 0; }
        else { sideY += deltaY; mapY += stepY; side = 1; }
        if (mapX < 0 || mapY < 0 || mapX >= level.w || mapY >= level.h) { hitType = 1; break; }
        const g = level.grid[mapY * level.w + mapX];
        if (g !== 0) { hitType = level.wallType[mapY * level.w + mapX] || 1; break; }
      }
      const perp = side === 0
        ? (sideX - deltaX)
        : (sideY - deltaY);
      const dist = Math.max(0.02, perp);
      zbuf[x] = dist;

      let lineH = focal * 1.55 / dist;
      if (breakLevel > 0) {
        lineH *= 1 + Math.sin(time * 1.4 + x * 0.045) * 0.012 * breakLevel;
      }
      const top = horizon - focal * 0.8 / dist;
      const bottom = horizon + focal * 0.75 / dist;
      let y0 = Math.max(0, Math.ceil(top));
      let y1 = Math.min(h - 1, Math.floor(bottom));
      if (y1 < y0) continue;

      // flashlight cone
      const cosA = 1 / Math.sqrt(1 + cameraX * cameraX * planeLen * planeLen);
      const beam = cosA * cosA * cosA;
      const fog = this.fog(dist);
      let shade = (0.095 + 1.7 * beam) * fog * flicker;
      if (side === 1) shade *= 0.72;
      if (hitType === 3) shade *= 0.78;
      shade = Math.min(1.45, shade);

      const texArr = tex.wall[hitType] || tex.wall[1];
      let wallX = side === 0 ? py + perp * rayY : px + perp * rayX;
      wallX -= Math.floor(wallX);
      let texX = (wallX * TS) | 0;
      if (texX < 0) texX = 0;
      if (texX >= TS) texX = TS - 1;
      if ((side === 0 && rayX > 0) || (side === 1 && rayY < 0)) texX = TS - 1 - texX;

      const texStep = TS / lineH;
      let texPos = (y0 - top) * texStep;
      const sr = shade * 1.04, sg = shade * 0.995, sb = shade * 0.88;
      let o = y0 * w + x;
      for (let y = y0; y <= y1; y++) {
        let ty = texPos | 0;
        if (ty < 0) ty = 0; else if (ty >= TS) ty = TS - 1;
        const c = texArr[ty * TS + texX];
        let r = ((c & 255) * sr + 2) | 0;
        let g = (((c >> 8) & 255) * sg + 3) | 0;
        let b = (((c >> 16) & 255) * sb + 4) | 0;
        if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
        buf[o] = 0xff000000 | (b << 16) | (g << 8) | r;
        texPos += texStep;
        o += w;
      }
    }

    /* ---------------- billboards ---------------- */
    const sprites = this.collectSprites(v, time);
    if (sprites.length) {
      const invDet = 1 / (planeX * dirY - dirX * planeY);
      for (const s of sprites) {
        const dxs = s.x - px, dys = s.y - py;
        s.dist2 = dxs * dxs + dys * dys;
      }
      sprites.sort((a, b) => b.dist2 - a.dist2);
      for (const s of sprites) {
        const sx = s.x - px, sy = s.y - py;
        const tX = invDet * (dirY * sx - dirX * sy);
        const tY = invDet * (-planeY * sx + planeX * sy);
        if (tY < 0.12) continue;

        let screenX = (w / 2) * (1 + tX / tY);
        let spriteH = focal * s.worldH / tY;
        let spriteW = focal * s.worldW / tY;
        if (spriteH < 1 || spriteW < 1) continue;

        const baseY = horizon + focal * 0.75 / tY - focal * (s.elevation || 0) / tY;
        const top = baseY - spriteH;
        let left = screenX - spriteW / 2;
        let right = left + spriteW;

        // slight sway for living things
        if (s.sway) {
          const sw = Math.sin(time * 1.7 + (s.phase || 0)) * s.sway * (focal / tY);
          left += sw; right += sw; screenX += sw;
        }

        let x0 = Math.max(0, Math.floor(left));
        let x1 = Math.min(w - 1, Math.ceil(right));
        if (x1 < x0) continue;
        let y0 = Math.max(0, Math.floor(top));
        let y1 = Math.min(h - 1, Math.ceil(baseY));
        if (y1 < y0) continue;

        const spr = s.texture;
        const tw = spr.w, th = spr.h, sdata = spr.data;
        const uStep = tw / spriteW;
        const vStep = th / spriteH;
        const alpha = s.alpha == null ? 1 : s.alpha;
        if (alpha <= 0.01) continue;

        const fog = this.fog(tY);
        const lit = s.selfLit ? 1 : Math.min(1.15, 0.22 + 1.15 * fog);
        const bright = (s.brightness == null ? 1 : s.brightness) * lit * alpha;
        const tr = (s.tint ? s.tint[0] : 1) * 1.0;
        const tg = (s.tint ? s.tint[1] : 1) * 1.0;
        const tb = (s.tint ? s.tint[2] : 1) * 1.0;
        const additive = !!s.additive;

        let u = (x0 - left) * uStep;
        for (let x = x0; x <= x1; x++) {
          if (tY >= zbuf[x]) { u += uStep; continue; }
          let v = (y0 - top) * vStep;
          let o = y0 * w + x;
          for (let y = y0; y <= y1; y++) {
            let tu = u | 0, tv = v | 0;
            if (tu >= tw) tu = tw - 1; else if (tu < 0) tu = 0;
            if (tv >= th) tv = th - 1; else if (tv < 0) tv = 0;
            const c = sdata[tv * tw + tu];
            const ca = (c >>> 24) / 255;
            if (ca > 0.015) {
              const a = ca * bright;
              if (a > 0.003) {
                const sr2 = ((c & 255) * tr) | 0;
                const sg2 = (((c >> 8) & 255) * tg) | 0;
                const sb2 = (((c >> 16) & 255) * tb) | 0;
                if (additive) {
                  const bg = buf[o];
                  let r = (bg & 255) + (sr2 * a) | 0;
                  let g = ((bg >> 8) & 255) + (sg2 * a) | 0;
                  let b = ((bg >> 16) & 255) + (sb2 * a) | 0;
                  if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
                  buf[o] = 0xff000000 | (b << 16) | (g << 8) | r;
                } else {
                  const bg = buf[o];
                  const br = bg & 255, bgc = (bg >> 8) & 255, bb = (bg >> 16) & 255;
                  let r = (br + (sr2 - br) * a) | 0;
                  let g = (bgc + (sg2 - bgc) * a) | 0;
                  let b = (bb + (sb2 - bb) * a) | 0;
                  if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
                  buf[o] = 0xff000000 | (b << 16) | (g << 8) | r;
                }
              }
            }
            v += vStep;
            o += w;
          }
          u += uStep;
        }
      }
    }

    /* ---------------- fracture tearing ---------------- */
    if (v.tear > 0) {
      const bands = 5 + ((v.tear * 4) | 0);
      for (let i = 0; i < bands; i++) {
        const bandH = 2 + ((Math.sin(i * 12.9898 + time * 31) * 0.5 + 0.5) * 18) | 0;
        const y0 = ((Math.sin(i * 78.233 + time * 7.7) * 0.5 + 0.5) * (h - bandH)) | 0;
        const shift = ((Math.sin(i * 43.12 + time * 13.1) * 0.5 + 0.5) * 2 - 1) * w * 0.18 * v.tear | 0;
        const src = y0 * w;
        const count = Math.min(bandH, Math.floor(this.tmp.length / w));
        this.tmp.set(buf.subarray(src, src + count * w));
        for (let r = 0; r < count; r++) {
          const dst = (y0 + r) * w;
          if (shift > 0) {
            buf.set(this.tmp.subarray(r * w, r * w + (w - shift)), dst + shift);
            buf.fill(0xff050608, dst, dst + Math.min(shift, w));
          } else if (shift < 0) {
            const sh = -shift;
            buf.set(this.tmp.subarray(r * w + sh, r * w + w), dst);
            buf.fill(0xff050608, dst + w - Math.min(sh, w), dst + w);
          }
        }
      }
    }

    /* ---------------- film grain + scanlines ---------------- */
    if (v.grain) {
      const noise = this.noise;
      const ox = (Math.random() * 128) | 0;
      const oy = (Math.random() * 128) | 0;
      const strength = v.grain;
      for (let y = 0; y < h; y++) {
        const dark = (y % 3 === 0) ? 0.9 : 1;
        const nrow = ((y + oy) & 127) << 7;
        let o = y * w;
        for (let x = 0; x < w; x++, o++) {
          const n = (noise[nrow | ((x + ox) & 127)] - 128) * strength;
          const c = buf[o];
          let r = ((c & 255) + n) * dark;
          let g = (((c >> 8) & 255) + n) * dark;
          let b = (((c >> 16) & 255) + n) * dark;
          if (r > 255) r = 255; else if (r < 0) r = 0;
          if (g > 255) g = 255; else if (g < 0) g = 0;
          if (b > 255) b = 255; else if (b < 0) b = 0;
          buf[o] = 0xff000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
        }
      }
    }

    this.ctx.putImageData(this.image, 0, 0);
    return { w, h, focal, horizon };
  }

  collectSprites(v, time) {
    const sprites = [];
    const tex = this.textures.sprites;

    if (v.sigils) {
      for (const s of v.sigils) {
        if (s.collected) continue;
        const bob = Math.sin(time * 1.3 + s.x) * 0.06;
        sprites.push({
          x: s.x, y: s.y, texture: tex.sigil, worldH: 0.42, worldW: 0.42,
          elevation: 0.95 + bob, selfLit: true, brightness: 1.0, additive: true,
          tint: [1.0, 0.88, 0.62], dist2: 0,
        });
        sprites.push({
          x: s.x, y: s.y, texture: tex.glow, worldH: 1.3, worldW: 1.3,
          elevation: 0.98 + bob, selfLit: true, brightness: 0.5 + 0.14 * Math.sin(time * 2.1 + s.y),
          additive: true, tint: [1.0, 0.78, 0.4], dist2: 0,
        });
      }
    }

    if (v.portal) {
      const p = v.portal;
      const tint = p.unlocked ? [0.55, 1.0, 0.96] : [1.0, 0.3, 0.22];
      const pulse = p.unlocked ? 0.85 + 0.15 * Math.sin(time * 2.6) : 0.35;
      sprites.push({
        x: p.x, y: p.y, texture: tex.portal, worldH: 1.48, worldW: 0.84,
        elevation: 0, selfLit: true, brightness: pulse, additive: true,
        tint, dist2: 0,
      });
      sprites.push({
        x: p.x, y: p.y, texture: tex.glow, worldH: 1.9, worldW: 1.9,
        elevation: 0.72, selfLit: true, brightness: p.unlocked ? 0.36 : 0.18,
        additive: true, tint, dist2: 0,
      });
    }

    if (v.monster && v.monster.alpha > 0.01) {
      const m = v.monster;
      sprites.push({
        x: m.x, y: m.y, texture: m.scream ? tex.scream : tex.monster,
        worldH: m.scream ? 1.52 : 1.44, worldW: m.scream ? 0.72 : 0.68,
        elevation: 0, brightness: 0.9, alpha: m.alpha,
        sway: 0.035, phase: m.phase || 0, tint: m.tint || [1, 1, 1], dist2: 0,
      });
    }

    if (v.echoes) {
      for (const e of v.echoes) {
        sprites.push({
          x: e.x, y: e.y, texture: tex.monster, worldH: 1.44, worldW: 0.68,
          elevation: 0, brightness: 0.5, alpha: e.alpha, additive: false,
          tint: [0.75, 0.85, 0.9], dist2: 0,
        });
      }
    }

    if (v.watchers) {
      for (const w of v.watchers) {
        sprites.push({
          x: w.x, y: w.y, texture: tex.eyes, worldH: 0.13, worldW: 0.38,
          elevation: w.height, selfLit: true, brightness: 0.9, alpha: w.alpha,
          additive: true, tint: [0.9, 0.92, 0.82], dist2: 0,
        });
      }
    }
    return sprites;
  }
}
