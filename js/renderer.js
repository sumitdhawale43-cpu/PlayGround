/* Canvas renderer: water, canyon light, motes, scene composition. */
import {
  TAU, clamp, lerp, mixColor, rgba, wobble, RNG, easeOutCubic,
} from './utils.js';
import { ZONES, WORLD, paletteAt, zoneAt } from './world.js';
import { drawReef, drawKelp, drawCoral, drawVent, drawRuin, drawBeacon, drawChest, drawResource } from './render-environment.js';
import { drawCreature, drawAmbientJelly } from './render-creatures.js';
import { drawPlayer, drawHeadlight } from './render-player.js';

const ZONE_BY_ID = new Map(ZONES.map(z => [z.id, z]));

export class OceanRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.W = 0; this.H = 0; this.dpr = 1; this.zoom = 1;
    this.time = 0;
    this.pal = ZONES[0].palette;
    this.glowCache = new Map();
    this.motes = [];
    this.frameFronds = [];
    this.camera = { x: WORLD.spawn.x, y: WORLD.spawn.y, shakeX: 0, shakeY: 0 };
    this.game = null;
    this._initMotes();
    this._initFrameFronds();
    this.resize();
  }

  resize() {
    const W = window.innerWidth || document.documentElement.clientWidth;
    const H = window.innerHeight || document.documentElement.clientHeight;
    this.W = W; this.H = H;
    const lowFx = document.documentElement.classList.contains('low-fx');
    const cap = lowFx ? 1 : (W < 620 ? 1.6 : 2);
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.zoom = W / H < 0.88
      ? clamp(W / 560, 0.62, 0.9)
      : clamp(Math.min(W / 1360, H / 800), 0.7, 1.06);
  }

  _initMotes() {
    const rng = new RNG(4871);
    for (let i = 0; i < 150; i++) {
      this.motes.push({
        x: rng.next(), y: rng.next(), z: rng.range(0.25, 1),
        size: rng.range(0.5, 2.3), phase: rng.range(0, TAU),
        speed: rng.range(0.35, 1.4), glow: rng.chance(0.07),
      });
    }
  }

  _initFrameFronds() {
    const rng = new RNG(991);
    for (let i = 0; i < 12; i++) {
      this.frameFronds.push({
        side: i % 2 === 0 ? -1 : 1,
        x: rng.range(0.02, 0.2),
        height: rng.range(0.18, 0.46),
        lean: rng.range(-0.2, 0.2),
        phase: rng.range(0, TAU),
        width: rng.range(1.2, 3.4),
        leaves: rng.int(3, 6),
        dark: rng.range(0.35, 0.85),
      });
    }
  }

  /* ---------- transforms and shared helpers ---------- */
  screen(x, y, p = 1) {
    const cam = this.camera;
    return [
      (x - cam.x * p) * this.zoom + this.W / 2 + cam.shakeX,
      (y - cam.y * p) * this.zoom + this.H / 2 + cam.shakeY,
    ];
  }

  visible(x, y, pad = 260, p = 1) {
    const [sx, sy] = this.screen(x, y, p);
    return sx > -pad && sx < this.W + pad && sy > -pad && sy < this.H + pad;
  }

  palFor(zoneId) {
    return (ZONE_BY_ID.get(zoneId) || ZONES[0]).palette;
  }

  getGlow(color) {
    let c = this.glowCache.get(color);
    if (c) return c;
    const size = 128;
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, rgba(color, 0.95));
    grad.addColorStop(0.24, rgba(color, 0.48));
    grad.addColorStop(0.58, rgba(color, 0.12));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    this.glowCache.set(color, cv);
    return cv;
  }

  drawGlow(x, y, color, radius, alpha = 1) {
    const glow = this.getGlow(color);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  blobPath(cx, cy, rx, ry, seed, points = 13, rough = 0.17) {
    const ctx = this.ctx;
    const pts = [];
    for (let i = 0; i < points; i++) {
      const a = (i / points) * TAU;
      const n = 1 + rough * (Math.sin(seed * 0.91 + i * 2.71) * 0.65 + Math.sin(seed * 1.73 + i * 5.13) * 0.35);
      pts.push([cx + Math.cos(a) * rx * n, cy + Math.sin(a) * ry * n]);
    }
    ctx.beginPath();
    let prev = pts[points - 1];
    ctx.moveTo((prev[0] + pts[0][0]) / 2, (prev[1] + pts[0][1]) / 2);
    for (let i = 0; i < points; i++) {
      const cur = pts[i], next = pts[(i + 1) % points];
      ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2);
    }
    ctx.closePath();
  }

  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* ---------- main draw ---------- */
  render(game) {
    const ctx = this.ctx;
    this.time = game.time;
    this.game = game;
    this.camera = game.camera;
    this.pal = paletteAt(game.camera.y);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    this.drawWater();
    this.drawBackdrop();
    this.drawRays();
    this.drawMotes();

    this.drawDecor('back');
    this.drawDecor('mid');

    for (const chest of game.chests) if (this.visible(chest.x, chest.y, 140)) drawChest(this, chest, game);
    for (const res of game.resources) if (!res.collected && this.visible(res.x, res.y, 100)) drawResource(this, res, game);

    this.drawHeadlightIfAny();

    const drawables = [];
    for (const c of game.creatures) {
      if (!this.visible(c.x, c.y, 340)) continue;
      drawables.push({ y: c.y, kind: 'creature', c });
    }
    if (game.mode !== 'title' || game.titleSub) {
      drawables.push({ y: game.player.y, kind: 'player' });
    }
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.kind === 'creature') drawCreature(this, d.c);
      else drawPlayer(this, game);
    }

    this.drawBubbles(game.bubbles);
    this.drawDecor('fg');
    this.drawFrameFronds();
    this.drawParticles(game.particles);
    this.drawPulse(game);
    this.drawScreenFx(game);
  }

  drawHeadlightIfAny() {
    if (this.game.mode !== 'playing' && this.game.mode !== 'title') return;
    if (!this.game.player?.lightsOn) return;
    drawHeadlight(this, this.game);
  }

  /* ---------- water & atmosphere ---------- */
  drawWater() {
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    const zone = zoneAt(this.camera.y);
    const light = clamp(zone.light * (1 - clamp((this.camera.y - 500) / 6200, 0, 0.5)), 0, 1);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, pal.top);
    grad.addColorStop(0.38, pal.mid);
    grad.addColorStop(0.74, mixColor(pal.mid, pal.bottom, 0.72));
    grad.addColorStop(1, pal.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Broad surface bloom.
    if (light > 0.03) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(W * 0.5, -H * 0.12, 0, W * 0.5, -H * 0.12, H * 1.18);
      glow.addColorStop(0, rgba(pal.rim, 0.3 * light));
      glow.addColorStop(0.34, rgba(pal.fog, 0.11 * light));
      glow.addColorStop(1, rgba(pal.fog, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Cool rim at the edges of the water column.
    const side = ctx.createLinearGradient(0, 0, W, 0);
    side.addColorStop(0, 'rgba(0,5,12,.22)');
    side.addColorStop(0.15, 'rgba(0,5,12,0)');
    side.addColorStop(0.85, 'rgba(0,5,12,0)');
    side.addColorStop(1, 'rgba(0,5,12,.24)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, W, H);

    this.drawSurface();
    this.drawBioHaze();
  }

  drawSurface() {
    const ctx = this.ctx;
    const sy = (WORLD.surface - this.camera.y) * this.zoom + this.H / 2 + this.camera.shakeY;
    if (sy < -90 || sy > this.H * 0.72) return;
    const sky = ctx.createLinearGradient(0, Math.min(-200, sy - 300), 0, sy + 10);
    sky.addColorStop(0, '#c4f5fa');
    sky.addColorStop(0.62, '#8fe3ee');
    sky.addColorStop(1, '#63c8dc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, -400, this.W, Math.max(0, sy + 400));
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
      const y = sy - (i + 1) * 14;
      ctx.beginPath();
      for (let x = -20; x <= this.W + 20; x += 20) {
        const yy = y + Math.sin(x * 0.018 + this.time * 1.2 + i * 1.3) * (7 - i * 0.8);
        if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(226,255,255,${0.26 - i * 0.04})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    const glint = ctx.createLinearGradient(0, sy - 120, 0, sy + 20);
    glint.addColorStop(0, 'rgba(226,255,255,0)');
    glint.addColorStop(0.6, 'rgba(226,255,255,.13)');
    glint.addColorStop(1, 'rgba(120,240,238,.2)');
    ctx.fillStyle = glint;
    ctx.fillRect(0, sy - 120, this.W, 135);
    ctx.restore();
  }

  drawBioHaze() {
    if (this.camera.y < 2400) return;
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const x = W * (0.2 + i * 0.32) + Math.sin(this.time * 0.05 + i * 2.2) * 90;
      const y = H * (0.32 + 0.2 * Math.sin(i * 2.7 + this.time * 0.03));
      const r = H * (0.34 + i * 0.12);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(pal.accent, 0.035));
      g.addColorStop(0.5, rgba(pal.fog, 0.018));
      g.addColorStop(1, rgba(pal.fog, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  drawBackdrop() {
    this.drawCanyon();
    this.drawDistantRidges();

    for (const jelly of this.game.world.ambientJellies) {
      if (!this.visible(jelly.x, jelly.y, 300, jelly.parallax)) continue;
      drawAmbientJelly(this, jelly);
    }

    // A very distant survey whale, only in the deeper half of the ocean.
    if (this.camera.y > 2500) this.drawWhale();
  }

  drawCanyon() {
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    const camY = this.camera.y, camX = this.camera.x;
    const drawWall = (side, layers) => {
      for (const layer of layers) {
        const pts = [];
        const steps = 18;
        for (let i = 0; i <= steps; i++) {
          const yy = i / steps * H;
          const worldY = camY - H / 2 + yy;
          const n = wobble(worldY * 0.012 + side * 13.7, side * 2.3 + layer.seed);
          const bulge = Math.sin(worldY * 0.0021 + layer.seed) * layer.amp * 0.45;
          const edge = layer.base + (n * 0.5 + 0.5) * layer.amp + bulge + (camX - WORLD.spawn.x) * 0.018;
          const x = side < 0 ? edge * W : W - edge * W;
          pts.push([x, yy]);
        }
        ctx.beginPath();
        if (side < 0) {
          ctx.moveTo(-5, -5);
          for (const [x, y] of pts) ctx.lineTo(x, y);
          ctx.lineTo(-5, H + 5);
        } else {
          ctx.moveTo(W + 5, -5);
          for (const [x, y] of pts) ctx.lineTo(x, y);
          ctx.lineTo(W + 5, H + 5);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(side < 0 ? 0 : W, 0, side < 0 ? W * 0.3 : W * 0.7, 0);
        g.addColorStop(0, rgba(layer.color, layer.alpha));
        g.addColorStop(0.55, rgba(layer.color, layer.alpha * 0.62));
        g.addColorStop(1, rgba(layer.color, 0));
        ctx.fillStyle = g;
        ctx.fill();

        // Rim lighting along the jagged edge.
        if (layer.rim > 0) {
          ctx.beginPath();
          pts.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
          ctx.strokeStyle = rgba(pal.rim, layer.rim);
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        // Little rock shelves and cold bioluminescence on the wall.
        if (layer.shelves) {
          for (let i = 1; i < pts.length - 1; i += 3) {
            const [x, y] = pts[i];
            const w = (side < 0 ? 1 : -1) * (12 + (i % 4) * 9);
            ctx.beginPath();
            ctx.moveTo(x, y + 2);
            ctx.lineTo(x - w * 0.75, y + 20);
            ctx.lineTo(x - w * 0.1, y + 13);
            ctx.closePath();
            ctx.fillStyle = rgba(layer.color, layer.alpha * 0.65);
            ctx.fill();
            if ((i + layer.seed) % 5 === 0) {
              const gx = x + (side < 0 ? 16 : -16);
              const gy = y + 26;
              ctx.fillStyle = rgba(pal.accent, 0.24);
              ctx.beginPath(); ctx.arc(gx, gy, 1.6, 0, TAU); ctx.fill();
              if (this.camera.y > 2800) this.drawGlow(gx, gy, pal.accent, 12, 0.4);
            }
          }
        }
      }
    };

    const fog = mixColor(pal.fog, pal.bottom, 0.55);
    const near = mixColor(pal.rockBottom, '#000000', 0.22);
    drawWall(-1, [
      { base: 0.13, amp: 0.055, color: fog, alpha: 0.24, rim: 0.035, seed: 1.1, shelves: false },
      { base: 0.075, amp: 0.05, color: near, alpha: 0.55, rim: 0.07, seed: 4.4, shelves: true },
    ]);
    drawWall(1, [
      { base: 0.16, amp: 0.06, color: fog, alpha: 0.2, rim: 0.03, seed: 7.7, shelves: false },
      { base: 0.086, amp: 0.045, color: near, alpha: 0.52, rim: 0.065, seed: 2.8, shelves: true },
    ]);
  }

  drawDistantRidges() {
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    const drawRidge = (baseline, amp, color, alpha, seed) => {
      ctx.beginPath();
      ctx.moveTo(-20, H + 30);
      for (let x = -20; x <= W + 20; x += 26) {
        const wx = this.camera.x + (x - W / 2) / this.zoom;
        const n = wobble(wx * 0.006 + seed, seed * 1.7) * 0.5 + 0.5;
        const sway = Math.sin(this.camera.y * 0.0008 + seed) * 22;
        const y = baseline - n * amp + sway;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W + 20, H + 30);
      ctx.closePath();
      ctx.fillStyle = rgba(color, alpha);
      ctx.fill();
    };
    drawRidge(H * 0.88, H * 0.3, mixColor(pal.rockBottom, '#000', 0.15), 0.3, 2.2);
    drawRidge(H * 0.94, H * 0.25, mixColor(pal.rockBottom, '#000', 0.4), 0.45, 5.1);

    // Slow, enormous whale silhouette.
  }

  drawWhale() {
    const ctx = this.ctx, W = this.W;
    const t = this.time * 0.008;
    const x = ((t * 40 + 260) % (W + 1100)) - 500;
    const y = this.H * 0.28 + Math.sin(this.time * 0.07) * 26;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.4, 1.4);
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = '#04121f';
    ctx.beginPath();
    ctx.moveTo(-180, 0);
    ctx.bezierCurveTo(-120, -36, 80, -44, 170, -8);
    ctx.bezierCurveTo(196, 2, 188, 18, 150, 22);
    ctx.bezierCurveTo(40, 32, -90, 26, -180, 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(160, -4); ctx.lineTo(208, -30); ctx.lineTo(198, 18); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawRays() {
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    const zone = zoneAt(this.camera.y);
    const light = zone.light * clamp(1 - (this.camera.y - 300) / 5200, 0, 1);
    if (light < 0.035) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const count = 7;
    for (let i = 0; i < count; i++) {
      const base = (i + 0.4) / count * W + Math.sin(this.time * 0.055 + i * 1.73) * 28;
      const topW = 14 + (i % 3) * 10;
      const botW = 130 + (i % 4) * 48;
      const tilt = 150 + i * 16;
      const alpha = (0.04 + 0.05 * (0.5 + 0.5 * Math.sin(this.time * 0.23 + i * 2.1))) * light;
      const g = ctx.createLinearGradient(base, -30, base + tilt, H);
      g.addColorStop(0, rgba(pal.rim, alpha * 1.8));
      g.addColorStop(0.4, rgba(pal.rim, alpha * 0.7));
      g.addColorStop(1, rgba(pal.rim, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(base - topW, -40);
      ctx.lineTo(base + topW, -40);
      ctx.lineTo(base + tilt + botW, H + 40);
      ctx.lineTo(base + tilt - botW, H + 40);
      ctx.closePath();
      ctx.fill();
    }
    // Caustic ribbons just below the sun.
    if (this.camera.y < 1700) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 24) {
          const y = H * (0.08 + i * 0.07) + Math.sin(x * 0.011 + this.time * 0.6 + i * 1.9) * 13 + Math.sin(x * 0.03 - this.time * 0.4) * 4;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(pal.rim, 0.02 * light);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawMotes() {
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    const deep = clamp((this.camera.y - 1800) / 3400, 0, 1);
    const cam = this.camera;
    ctx.save();
    for (const m of this.motes) {
      const drift = this.time * m.speed;
      const x = ((m.x * W + drift * 5 + Math.sin(this.time * 0.24 + m.phase) * 14 - cam.x * 0.018 * m.z) % (W + 60) + W + 60) % (W + 60) - 30;
      const y = ((m.y * H + drift * 3.2 + Math.sin(this.time * 0.17 + m.phase * 2) * 9 - cam.y * 0.035 * m.z) % (H + 60) + H + 60) % (H + 60) - 30;
      const a = (0.1 + 0.42 * m.z) * (0.45 + deep * 0.55);
      const col = deep > 0.35 ? (m.glow ? pal.accent : pal.particle) : pal.particle;
      ctx.fillStyle = rgba(col, a);
      ctx.beginPath();
      ctx.arc(x, y, m.size * (0.55 + m.z * 0.75), 0, TAU);
      ctx.fill();
      if (m.glow && deep > 0.3) this.drawGlow(x, y, col, 10 + m.z * 12, a * 0.55);
    }
    ctx.restore();
  }

  /* ---------- scenery ---------- */
  drawDecor(layer) {
    const list = this.game.world.decor;
    const p = layer === 'fg' ? 1.055 : layer === 'back' ? 0.992 : 1;
    const visible = [];
    for (const obj of list) {
      if ((obj.layer || 'mid') !== layer) continue;
      if (!this.visible(obj.x, obj.y, layer === 'fg' ? 420 : 300, p)) continue;
      visible.push(obj);
    }
    visible.sort((a, b) => a.y - b.y);
    if (layer === 'fg') this.ctx.save();
    for (const obj of visible) {
      switch (obj.type) {
        case 'reef': drawReef(this, obj, p, layer === 'fg'); break;
        case 'kelp': drawKelp(this, obj, p, layer === 'fg'); break;
        case 'coral': drawCoral(this, obj, p); break;
        case 'vent': drawVent(this, obj, p); break;
        case 'ruin': drawRuin(this, obj, p); break;
        case 'beacon': drawBeacon(this, obj, p); break;
        default: break;
      }
    }
    if (layer === 'fg') this.ctx.restore();
  }

  drawBubbles(bubbles) {
    const ctx = this.ctx;
    for (const b of bubbles) {
      const [sx, sy] = this.screen(b.x, b.y);
      if (sx < -30 || sx > this.W + 30 || sy < -30 || sy > this.H + 30) continue;
      const r = Math.max(0.7, b.r * this.zoom);
      const a = clamp(b.life / b.maxLife, 0, 1) * (b.alpha ?? 0.65);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.fillStyle = b.kind === 'spark' ? rgba(b.color || '#c9ffff', 0.12) : 'rgba(185,245,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = b.color ? rgba(b.color, 0.55) : 'rgba(210,252,255,0.5)';
      ctx.lineWidth = Math.max(0.7, r * 0.16);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx - r * 0.3, sy - r * 0.35, Math.max(0.4, r * 0.2), 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    for (const p of particles) {
      const [sx, sy] = this.screen(p.x, p.y);
      if (sx < -80 || sx > this.W + 80 || sy < -80 || sy > this.H + 80) continue;
      const t = clamp(p.life / p.maxLife, 0, 1);
      if (p.type === 'text') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 2.4);
        ctx.font = `700 ${p.size || 11}px Manrope, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = p.color || '#eaffff';
        ctx.shadowColor = 'rgba(0,5,10,.85)';
        ctx.shadowBlur = 6;
        ctx.fillText(p.text, sx, sy - (1 - t) * 28);
        ctx.restore();
      } else if (p.type === 'ring') {
        ctx.save();
        ctx.globalAlpha = t * 0.75;
        ctx.strokeStyle = p.color || '#86fff1';
        ctx.lineWidth = p.line || 2;
        const r = (1 - t) * p.radius + 4;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke();
        ctx.restore();
      } else if (p.type === 'smoke') {
        ctx.save();
        ctx.globalAlpha = t * 0.35;
        ctx.fillStyle = p.color || '#0a1a24';
        ctx.beginPath(); ctx.arc(sx, sy, (1 - t) * p.size + 2, 0, TAU); ctx.fill();
        ctx.restore();
      } else {
        const col = p.color || '#d8ffff';
        const size = p.size * (p.shrink === false ? 1 : (0.3 + t * 0.7));
        if (size > 3.5) this.drawGlow(sx, sy, col, size * 3.4, 0.32 * t);
        ctx.save();
        ctx.globalAlpha = t;
        ctx.fillStyle = col;
        ctx.beginPath();
        if (p.type === 'shard') {
          ctx.translate(sx, sy);
          ctx.rotate(p.angle || 0);
          ctx.rect(-size * 0.35, -size, size * 0.7, size * 2);
        } else {
          ctx.arc(sx, sy, Math.max(0.5, size), 0, TAU);
        }
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawPulse(game) {
    const pulse = game.pulse;
    if (!pulse || pulse.t >= pulse.maxT) return;
    const ctx = this.ctx;
    const t = pulse.t / pulse.maxT;
    const [sx, sy] = this.screen(pulse.x, pulse.y);
    const r = easeOutCubic(t) * pulse.radius * this.zoom;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 2; i++) {
      const rr = r - i * 26 * this.zoom;
      if (rr <= 0) continue;
      ctx.beginPath();
      ctx.arc(sx, sy, rr, 0, TAU);
      ctx.strokeStyle = rgba('#7dfff1', (1 - t) * (i === 0 ? 0.5 : 0.2));
      ctx.lineWidth = (i === 0 ? 2.5 : 6) * (1 - t * 0.4);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(sx, sy, r * 0.55, sx, sy, r);
    g.addColorStop(0, 'rgba(90,255,235,0)');
    g.addColorStop(0.85, `rgba(90,255,235,${0.06 * (1 - t)})`);
    g.addColorStop(1, 'rgba(90,255,235,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawFrameFronds() {
    const ctx = this.ctx, W = this.W, H = this.H, pal = this.pal;
    const cam = this.camera;
    for (const f of this.frameFronds) {
      const baseX = f.side < 0 ? f.x * W - 40 + (cam.x % 30) * 0.4 : W - f.x * W + 40 - (cam.x % 30) * 0.4;
      const baseY = H + 30 - (cam.y % 20) * 0.2;
      const h = H * f.height;
      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.rotate(f.side * 0.05);
      const sway = Math.sin(this.time * 0.42 + f.phase) * 22 + f.lean * 30;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-f.side * 14, -h * 0.36, sway * 0.6 - f.side * 14, -h * 0.72, sway, -h);
      ctx.strokeStyle = rgba(mixColor(pal.kelpDark, '#000000', f.dark), 0.88);
      ctx.lineWidth = f.width * 2.4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = rgba(mixColor(pal.kelp, pal.rim, 0.12), 0.22);
      ctx.lineWidth = f.width * 0.8;
      ctx.stroke();
      for (let l = 0; l < f.leaves; l++) {
        const t = 0.22 + l * 0.14;
        const lx = lerp(0, sway, t) + Math.sin(t * 9 + f.phase) * 8;
        const ly = -h * t;
        const dir = (l % 2 ? 1 : -1) * f.side;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(dir * 0.9 + Math.sin(this.time * 0.7 + l + f.phase) * 0.16);
        ctx.beginPath();
        ctx.ellipse(dir * 16, 0, 23, 5.5, 0, 0, TAU);
        ctx.fillStyle = rgba(mixColor(pal.kelpDark, '#000', f.dark * 0.7), 0.82);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // Keep the bottom of the frame grounded.
    const g = ctx.createLinearGradient(0, H * 0.78, 0, H);
    g.addColorStop(0, 'rgba(0,5,10,0)');
    g.addColorStop(1, 'rgba(0,4,8,.52)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
  }

  drawScreenFx(game) {
    const ctx = this.ctx, W = this.W, H = this.H;
    const player = game.player;
    // Damage vignette.
    if (game.damageFlash > 0) {
      const a = clamp(game.damageFlash, 0, 1);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.72);
      g.addColorStop(0, 'rgba(255,40,30,0)');
      g.addColorStop(0.6, `rgba(220,36,28,${0.12 * a})`);
      g.addColorStop(1, `rgba(180,20,18,${0.5 * a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // Low oxygen blue edges.
    const o2 = player.oxygen / player.oxygenMax;
    if (o2 < 0.3 && game.mode === 'playing') {
      const a = (1 - o2 / 0.3) * (0.55 + 0.45 * Math.sin(game.time * 3.6));
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(10,40,80,0)');
      g.addColorStop(0.7, `rgba(4,36,74,${0.12 * a})`);
      g.addColorStop(1, `rgba(2,14,34,${0.48 * a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // Pressure edges.
    if (game.pressureOver) {
      const a = 0.28 + 0.18 * Math.sin(game.time * 5);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(255,120,60,0)');
      g.addColorStop(1, `rgba(160,40,20,${a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Lantern halo around the submarine in the dark.
    if (game.mode === 'playing' || game.mode === 'title') {
      const [sx, sy] = this.screen(player.x, player.y);
      const rad = (140 + (player.lightsOn ? 80 : 0)) * this.zoom;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
      const strength = clamp((game.camera.y - 1200) / 2600, 0, 0.5) + 0.04;
      glow.addColorStop(0, `rgba(180,250,245,${strength})`);
      glow.addColorStop(0.45, `rgba(110,210,220,${strength * 0.32})`);
      glow.addColorStop(1, 'rgba(2,20,30,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = glow;
      ctx.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
      ctx.restore();
    }

    // Classic lens vignette.
    const v = ctx.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * 0.32, W * 0.5, H * 0.46, Math.max(W, H) * 0.78);
    v.addColorStop(0, 'rgba(0,6,12,0)');
    v.addColorStop(0.76, 'rgba(0,5,10,.16)');
    v.addColorStop(1, 'rgba(0,3,7,.62)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}
