// ── The Remembering — painterly canvas renderer ──────────────────────────────
import {
  TILE, GRID, WORLD, BIOME, BIOME_INFO, RNG, clamp, lerp, dist,
  shade, rgba, roundRect, angleDiff,
} from './util.js';

const TERRAIN_SCALE = 0.55;

const ROLE_COLORS = {
  Keeper: '#c9a45c', Trader: '#7fa7a0', Hunter: '#9a7d55',
  Elder: '#b8a17b', Warden: '#8d9c76', Drifter: '#a58b73',
};

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cam = { x: game.player.x, y: game.player.y };
    this.time = 0;
    this.shakeX = 0; this.shakeY = 0;
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.miniAcc = 0;
    this.resize();
    this.buildTerrain();
    this.buildMini();
    this.rain = [];
    this.leaves = [];
    this.fireflies = [];
    this.initAmbient();
  }

  resize() {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.canvas.width = Math.floor(this.vw * this.dpr);
    this.canvas.height = Math.floor(this.vh * this.dpr);
    this.canvas.style.width = this.vw + 'px';
    this.canvas.style.height = this.vh + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.lightCanvas.width = this.canvas.width;
    this.lightCanvas.height = this.canvas.height;
    this.lightCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  rebuild() {
    this.buildTerrain();
    this.buildMini();
    this.cam.x = this.game.player.x;
    this.cam.y = this.game.player.y;
  }

  // ── terrain prepaint ───────────────────────────────────────────────────────
  buildTerrain() {
    const world = this.game.world;
    const size = Math.ceil(WORLD * TERRAIN_SCALE);
    const base = document.createElement('canvas');
    base.width = size; base.height = size;
    const bctx = base.getContext('2d');
    const rng = new RNG(world.seed ^ 0x51ed270b);
    const tile = TILE * TERRAIN_SCALE;

    const grad = bctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#173741');
    grad.addColorStop(0.55, '#1a3c46');
    grad.addColorStop(1, '#122d38');
    bctx.fillStyle = grad;
    bctx.fillRect(0, 0, size, size);

    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const i = gy * GRID + gx;
        const biome = world.tiles[i];
        const info = BIOME_INFO[biome];
        const h = world.heights[i];
        const m = world.moisture[i];
        let baseCol = info.color;
        let variation = (h - 0.5) * 0.24 + (m - 0.5) * 0.08 + (rng.next() - 0.5) * 0.10;
        if (biome === BIOME.WATER) {
          variation = (h - 0.3) * 0.15 + (rng.next() - 0.5) * 0.06;
          baseCol = h < 0.3 ? '#143440' : '#1b3d48';
        }
        bctx.fillStyle = shade(baseCol, variation);
        bctx.fillRect(gx * tile - 0.8, gy * tile - 0.8, tile + 1.6, tile + 1.6);
        if (biome === BIOME.MARSH && rng.chance(0.28)) {
          bctx.fillStyle = 'rgba(40,74,72,0.5)';
          bctx.beginPath();
          bctx.ellipse(gx * tile + rng.range(2, tile - 2), gy * tile + rng.range(2, tile - 2), rng.range(2, 6), rng.range(1, 3), rng.range(0, 3), 0, 6.29);
          bctx.fill();
        }
        // organic tonal patch inside the tile so the grid never reads as flat colour
        if (rng.chance(0.55)) {
          const cx = gx * tile + rng.range(tile * 0.15, tile * 0.85);
          const cy = gy * tile + rng.range(tile * 0.15, tile * 0.85);
          const rr = rng.range(tile * 0.35, tile * 0.85);
          const g2 = bctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
          g2.addColorStop(0, rng.chance(0.5) ? 'rgba(232,240,214,0.10)' : 'rgba(12,20,14,0.12)');
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          bctx.fillStyle = g2;
          bctx.beginPath(); bctx.arc(cx, cy, rr, 0, 6.29); bctx.fill();
        }
      }
    }

    // organic blobs straddling biome borders so edges wander instead of snapping to the grid
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const i = gy * GRID + gx;
        const biome = world.tiles[i];
        const col = BIOME_INFO[biome].color;
        const x = gx * tile, y = gy * tile;
        const right = gx < GRID - 1 ? world.tiles[i + 1] : biome;
        const down = gy < GRID - 1 ? world.tiles[i + GRID] : biome;
        const blobs = (right !== biome ? 3 : 0) + (down !== biome ? 3 : 0);
        for (let b = 0; b < blobs; b++) {
          const alongEdge = b < 3 && right !== biome;
          const bx = alongEdge ? x + tile + rng.range(-4, 4) : x + rng.range(0, tile);
          const by = alongEdge ? y + rng.range(0, tile) : y + tile + rng.range(-4, 4);
          bctx.fillStyle = rgba(col, rng.range(0.35, 0.65));
          bctx.beginPath();
          bctx.ellipse(bx, by, rng.range(3, 8), rng.range(2, 5), rng.range(0, 3), 0, 6.29);
          bctx.fill();
        }
      }
    }

    // broad painterly washes of light and shade
    for (let i = 0; i < 620; i++) {
      const x = rng.range(0, size), y = rng.range(0, size);
      const b = world.biomeAt(x / TERRAIN_SCALE, y / TERRAIN_SCALE);
      if (b === BIOME.WATER) continue;
      const col = BIOME_INFO[b].color;
      const rr = rng.range(7, 30);
      const g2 = bctx.createRadialGradient(x, y, 0, x, y, rr);
      g2.addColorStop(0, rgba(col, rng.chance(0.5) ? rng.range(0.05, 0.10) : rng.range(0.03, 0.07)));
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.fillStyle = g2;
      bctx.beginPath(); bctx.ellipse(x, y, rr, rr * rng.range(0.5, 0.9), rng.range(0, 3), 0, 6.29); bctx.fill();
    }

    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    // soften the tile boundaries; detail is painted back on sharp afterwards
    ctx.save();
    ctx.filter = 'blur(4.5px)';
    ctx.drawImage(base, 0, 0);
    ctx.restore();

    // soft shoreline foam and wet sand
    for (let gy = 1; gy < GRID - 1; gy++) {
      for (let gx = 1; gx < GRID - 1; gx++) {
        const b = world.tiles[gy * GRID + gx];
        if (b !== BIOME.WATER) continue;
        const neighbors = [
          world.tiles[(gy - 1) * GRID + gx], world.tiles[(gy + 1) * GRID + gx],
          world.tiles[gy * GRID + gx - 1], world.tiles[gy * GRID + gx + 1],
        ];
        if (neighbors.some(n => n !== BIOME.WATER)) {
          ctx.strokeStyle = 'rgba(196,218,203,0.13)';
          ctx.lineWidth = 1.6;
          const x = gx * tile, y = gy * tile;
          ctx.beginPath();
          if (neighbors[0] !== BIOME.WATER) { ctx.moveTo(x, y); ctx.lineTo(x + tile, y); }
          if (neighbors[1] !== BIOME.WATER) { ctx.moveTo(x, y + tile); ctx.lineTo(x + tile, y + tile); }
          if (neighbors[2] !== BIOME.WATER) { ctx.moveTo(x, y); ctx.lineTo(x, y + tile); }
          if (neighbors[3] !== BIOME.WATER) { ctx.moveTo(x + tile, y); ctx.lineTo(x + tile, y + tile); }
          ctx.stroke();
        }
      }
    }

    // texture dabs and ground detail
    for (let i = 0; i < 12000; i++) {
      const x = rng.range(0, WORLD), y = rng.range(0, WORLD);
      const b = world.biomeAt(x, y);
      if (b === BIOME.WATER) {
        if (rng.chance(0.35)) {
          ctx.strokeStyle = `rgba(132,180,184,${rng.range(0.03, 0.09)})`;
          ctx.lineWidth = 0.7;
          const len = rng.range(4, 16);
          ctx.beginPath();
          ctx.moveTo(x * TERRAIN_SCALE, y * TERRAIN_SCALE);
          ctx.lineTo((x + len) * TERRAIN_SCALE, y * TERRAIN_SCALE);
          ctx.stroke();
        }
        continue;
      }
      const sx = x * TERRAIN_SCALE, sy = y * TERRAIN_SCALE;
      if (b === BIOME.MEADOW) {
        if (rng.chance(0.72)) {
          ctx.strokeStyle = rng.chance(0.5) ? 'rgba(151,169,98,0.34)' : 'rgba(58,77,42,0.30)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          const blades = rng.int(2, 4);
          for (let k = 0; k < blades; k++) {
            const bx = sx + rng.range(-1.6, 1.6), by = sy + rng.range(-1, 1);
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + rng.range(-2.4, 2.4), by - rng.range(1.5, 4.5));
          }
          ctx.stroke();
        } else {
          ctx.fillStyle = rng.chance(0.5) ? 'rgba(219,199,133,0.5)' : 'rgba(188,164,196,0.4)';
          ctx.beginPath();
          ctx.arc(sx, sy, rng.range(0.6, 1.4), 0, 6.29);
          ctx.fill();
        }
      } else if (b === BIOME.FOREST) {
        if (rng.chance(0.25)) {
          ctx.strokeStyle = 'rgba(116,140,82,0.26)';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(sx - 2, sy);
          ctx.lineTo(sx - 3.5, sy - 3);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 1, sy - 4);
          ctx.moveTo(sx + 2, sy);
          ctx.lineTo(sx + 3.5, sy - 2.6);
          ctx.stroke();
        } else {
          ctx.fillStyle = rng.chance(0.5) ? 'rgba(32,51,31,0.30)' : 'rgba(106,130,76,0.20)';
          ctx.beginPath();
          ctx.arc(sx, sy, rng.range(0.8, 2.4), 0, 6.29);
          ctx.fill();
        }
      } else if (b === BIOME.MARSH) {
        ctx.strokeStyle = 'rgba(110,128,92,0.24)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + rng.range(-1, 1), sy - rng.range(2, 5));
        ctx.stroke();
      } else if (b === BIOME.ROCK) {
        if (rng.chance(0.55)) {
          ctx.strokeStyle = rng.chance(0.5) ? 'rgba(44,45,42,0.26)' : 'rgba(158,155,142,0.20)';
          ctx.lineWidth = 0.7;
          const len = rng.range(3, 11);
          const a = rng.range(-0.5, 0.5);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
          ctx.stroke();
        } else {
          ctx.fillStyle = rng.chance(0.5) ? 'rgba(42,43,40,0.32)' : 'rgba(150,148,137,0.24)';
          ctx.beginPath();
          ctx.ellipse(sx, sy, rng.range(0.7, 1.9), rng.range(0.5, 1.2), rng.range(0, 3), 0, 6.29);
          ctx.fill();
        }
      } else if (b === BIOME.ASH) {
        if (rng.chance(0.22)) {
          ctx.strokeStyle = 'rgba(32,29,27,0.22)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + rng.range(2, 7), sy + rng.range(-2, 2));
          ctx.stroke();
        } else {
          ctx.fillStyle = rng.chance(0.6) ? 'rgba(36,32,30,0.42)' : 'rgba(124,109,96,0.28)';
          ctx.beginPath();
          ctx.arc(sx, sy, rng.range(0.7, 2), 0, 6.29);
          ctx.fill();
        }
      } else if (b === BIOME.SAND) {
        if (rng.chance(0.35)) {
          ctx.strokeStyle = 'rgba(226,213,176,0.24)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx - 4, sy);
          ctx.quadraticCurveTo(sx, sy + 1.2, sx + 4, sy);
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(230,216,178,0.24)';
          ctx.beginPath();
          ctx.arc(sx, sy, rng.range(0.5, 1.2), 0, 6.29);
          ctx.fill();
        }
      }
    }

    // stone plates and cracks give the high country a readable geology
    for (let i = 0; i < 420; i++) {
      const x = rng.range(0, WORLD), y = rng.range(0, WORLD);
      if (world.biomeAt(x, y) !== BIOME.ROCK) continue;
      const sx = x * TERRAIN_SCALE, sy = y * TERRAIN_SCALE;
      const w = rng.range(3, 11), h = rng.range(2, 6);
      ctx.fillStyle = rng.chance(0.5) ? 'rgba(120,118,110,0.15)' : 'rgba(46,47,44,0.16)';
      ctx.beginPath();
      ctx.moveTo(sx - w, sy);
      ctx.lineTo(sx - w * 0.35, sy - h);
      ctx.lineTo(sx + w * 0.55, sy - h * 0.75);
      ctx.lineTo(sx + w, sy + h * 0.15);
      ctx.lineTo(sx + w * 0.1, sy + h);
      ctx.closePath();
      ctx.fill();
      if (rng.chance(0.4)) {
        ctx.strokeStyle = 'rgba(40,41,38,0.22)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - w * 0.5, sy - h * 0.3);
        ctx.lineTo(sx - w * 0.05, sy + h * 0.15);
        ctx.lineTo(sx + w * 0.4, sy - h * 0.2);
        ctx.stroke();
      }
    }

    // a few faint game trails around settlements
    for (const s of world.settlements) {
      ctx.strokeStyle = 'rgba(163,142,100,0.13)';
      ctx.lineWidth = 5;
      ctx.setLineDash([2, 10]);
      ctx.beginPath();
      ctx.arc(s.x * TERRAIN_SCALE, s.y * TERRAIN_SCALE, 72 * TERRAIN_SCALE, 0, 6.29);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.terrain = c;
  }

  buildMini() {
    const c = document.createElement('canvas');
    c.width = 216; c.height = 216;
    const ctx = c.getContext('2d');
    ctx.drawImage(this.terrain, 0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(10,20,18,0.18)';
    ctx.fillRect(0, 0, c.width, c.height);
    this.mini = c;
  }

  initAmbient() {
    const rng = new RNG((this.game.world.seed ^ 0x2a3b4c) >>> 0);
    this.rain = [];
    for (let i = 0; i < 170; i++) {
      this.rain.push({
        x: rng.range(-100, this.vw + 100), y: rng.range(-this.vh, this.vh),
        len: rng.range(8, 20), speed: rng.range(680, 980), drift: rng.range(-90, -40),
      });
    }
    this.leaves = [];
    for (let i = 0; i < 30; i++) {
      this.leaves.push({
        x: rng.range(0, this.vw), y: rng.range(0, this.vh),
        vx: rng.range(-18, 18), vy: rng.range(12, 34),
        size: rng.range(1.4, 3.2), phase: rng.range(0, 6.28), hue: rng.range(0, 1),
      });
    }
    this.fireflies = [];
    for (let i = 0; i < 34; i++) {
      this.fireflies.push({
        x: rng.range(0, this.vw), y: rng.range(0, this.vh),
        phase: rng.range(0, 6.28), speed: rng.range(0.3, 0.8),
        r: rng.range(0.8, 2.1),
      });
    }
  }

  // ── frame ──────────────────────────────────────────────────────────────────
  draw(dt) {
    this.time += dt;
    const game = this.game;
    const p = game.player;
    const ctx = this.ctx;
    const night = game.nightFactor;

    const targetX = p.x + (game.mouseWorld.x - p.x) * 0.045;
    const targetY = p.y + (game.mouseWorld.y - p.y) * 0.045;
    const follow = 1 - Math.exp(-6.5 * dt);
    this.cam.x = lerp(this.cam.x, targetX, follow);
    this.cam.y = lerp(this.cam.y, targetY, follow);
    const maxX = Math.max(0, WORLD - this.vw), maxY = Math.max(0, WORLD - this.vh);
    this.cam.x = clamp(this.cam.x, Math.min(this.vw / 2, maxX), Math.max(maxX, WORLD - this.vw / 2));
    this.cam.y = clamp(this.cam.y, Math.min(this.vh / 2, maxY), Math.max(maxY, WORLD - this.vh / 2));
    const camX = clamp(this.cam.x - this.vw / 2, 0, Math.max(0, WORLD - this.vw));
    const camY = clamp(this.cam.y - this.vh / 2, 0, Math.max(0, WORLD - this.vh));
    this.camX = camX; this.camY = camY;

    game.shakeTime = Math.max(0, (game.shakeTime || 0) - dt);
    const shakeAmt = (game.shakeTime || 0) * 5;
    this.shakeX = (Math.random() - 0.5) * shakeAmt;
    this.shakeY = (Math.random() - 0.5) * shakeAmt;

    ctx.clearRect(0, 0, this.vw, this.vh);
    ctx.save();
    ctx.translate(-camX + this.shakeX, -camY + this.shakeY);

    ctx.drawImage(this.terrain, 0, 0, WORLD, WORLD);
    this.drawGround(ctx, game);
    this.drawWorld(ctx, game);

    // aim
    if (!game.touchMode && !game.paused && !p.dead) this.drawAim(ctx, game);
    ctx.restore();

    this.drawLighting(game, camX, camY, night);
    this.drawWeather(ctx, game, dt);
    this.drawScreenFX(ctx, game);

    this.miniAcc += dt;
    if (this.miniAcc > 0.12) {
      this.miniAcc = 0;
      this.drawMini(game);
    }
  }

  drawGround(ctx, game) {
    const world = game.world;
    for (const s of world.settlements) {
      const g = ctx.createRadialGradient(s.x, s.y, 12, s.x, s.y, 118);
      g.addColorStop(0, 'rgba(130,109,74,0.45)');
      g.addColorStop(0.72, 'rgba(118,102,70,0.20)');
      g.addColorStop(1, 'rgba(118,102,70,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 120, 96, 0, 0, 6.29);
      ctx.fill();
    }
    for (const poi of world.pois) {
      if (poi.type === 'ruin') {
        ctx.fillStyle = 'rgba(45,46,43,0.35)';
        ctx.beginPath();
        ctx.ellipse(poi.x, poi.y, 76, 60, 0, 0, 6.29);
        ctx.fill();
      }
      if (poi.type === 'shrine') {
        ctx.fillStyle = 'rgba(79,96,66,0.32)';
        ctx.beginPath();
        ctx.ellipse(poi.x, poi.y, 58, 48, 0, 0, 6.29);
        ctx.fill();
      }
    }
    for (const b of game.burns) {
      const alpha = clamp(b.life / b.maxLife, 0, 1) * 0.45;
      const g = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(28,23,20,${alpha})`);
      g.addColorStop(0.6, `rgba(39,30,25,${alpha * 0.65})`);
      g.addColorStop(1, 'rgba(39,30,25,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r, b.r * 0.72, b.rot || 0, 0, 6.29);
      ctx.fill();
    }
    for (const t of game.traps) {
      if (t.dead) continue;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.strokeStyle = t.arm > 0 ? 'rgba(216,200,160,0.6)' : 'rgba(190,174,138,0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, 6.29);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
        ctx.lineTo(Math.cos(a + 0.5) * 11, Math.sin(a + 0.5) * 11);
      }
      ctx.stroke();
      ctx.restore();
    }
    for (const c of game.corpses) {
      if (c.fade <= 0) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.face || 0);
      ctx.globalAlpha = c.fade * 0.75;
      ctx.fillStyle = c.kind === 'wolf' || c.kind === 'deer' || c.kind === 'boar' ? '#3b3430' : '#2e2b26';
      ctx.beginPath();
      ctx.ellipse(0, 0, c.kind === 'bear' ? 20 : 13, c.kind === 'bear' ? 13 : 8, 0, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = 'rgba(85,44,38,0.5)';
      ctx.beginPath();
      ctx.ellipse(4, 3, 10, 5, 0.3, 0, 6.29);
      ctx.fill();
      ctx.restore();
    }
  }

  drawWorld(ctx, game) {
    const items = [];
    const pad = 120;
    const inView = (x, y) => x > this.camX - pad && x < this.camX + this.vw + pad &&
      y > this.camY - pad && y < this.camY + this.vh + pad;

    for (const r of game.world.resources) {
      if (inView(r.x, r.y)) items.push({ y: r.y, kind: 'resource', o: r });
    }
    for (const poi of game.world.pois) {
      if (!inView(poi.x, poi.y)) continue;
      if (poi.type === 'settlement' || poi.type === 'camp') {
        for (const t of poi.tents) items.push({ y: t.y, kind: 'tent', o: t });
        if (poi.fire) items.push({ y: poi.fire.y, kind: 'fire', o: poi.fire });
      }
      if (poi.type === 'ruin') {
        for (const w of poi.walls) items.push({ y: w.y, kind: 'wall', o: w });
        if (poi.chest) items.push({ y: poi.chest.y, kind: 'chest', o: poi.chest, poi });
      }
      if (poi.type === 'shrine') {
        for (const s of poi.stones) items.push({ y: s.y, kind: 'stone', o: s });
      }
    }
    for (const n of game.npcs) if (inView(n.x, n.y)) items.push({ y: n.y, kind: 'npc', o: n });
    for (const a of game.animals) if (inView(a.x, a.y)) items.push({ y: a.y, kind: 'animal', o: a });
    for (const e of game.enemies) if (inView(e.x, e.y)) items.push({ y: e.y, kind: 'enemy', o: e });
    if (inView(game.player.x, game.player.y)) items.push({ y: game.player.y, kind: 'player', o: game.player });
    items.sort((a, b) => a.y - b.y);

    for (const it of items) {
      const o = it.o;
      switch (it.kind) {
        case 'resource': this.drawResource(ctx, o, game); break;
        case 'tent': this.drawTent(ctx, o); break;
        case 'fire': this.drawFire(ctx, o, game); break;
        case 'wall': this.drawWall(ctx, o); break;
        case 'chest': this.drawChest(ctx, o, it.poi, game); break;
        case 'stone': this.drawShrineStone(ctx, o, game); break;
        case 'npc': this.drawNPC(ctx, o, game); break;
        case 'animal': this.drawAnimal(ctx, o, game); break;
        case 'enemy': this.drawEnemy(ctx, o, game); break;
        case 'player': this.drawPlayer(ctx, o, game); break;
      }
    }

    for (const pr of game.projectiles) {
      if (!inView(pr.x, pr.y)) continue;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.strokeStyle = pr.from === 'player' ? '#ded2b2' : '#c5b18c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.fillStyle = pr.from === 'player' ? '#e8dfc8' : '#b7483a';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
      if (pr.fire) {
        ctx.fillStyle = 'rgba(232,137,74,0.35)';
        ctx.beginPath();
        ctx.arc(-6, 0, 7, 0, 6.29);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const p of game.particles) {
      if (!inView(p.x, p.y)) continue;
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.type === 'spark' || p.type === 'ember') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.6), 0, 6.29);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    for (const f of game.floats) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = f.big ? '600 16px Georgia, serif' : '600 12px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillText(f.text, f.x + 1, f.y - (1 - a) * 24 + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - (1 - a) * 24);
      ctx.globalAlpha = 1;
    }
  }

  // ── scenery ────────────────────────────────────────────────────────────────
  drawResource(ctx, r, game) {
    const t = this.time;
    if (r.hp <= 0) {
      if (r.type === 'tree' || r.type === 'deadtree') {
        ctx.fillStyle = 'rgba(20,24,18,0.25)';
        ctx.beginPath(); ctx.ellipse(r.x + 2, r.y + 4, 10, 4, 0, 0, 6.29); ctx.fill();
        ctx.fillStyle = '#5a4631';
        ctx.beginPath(); ctx.ellipse(r.x, r.y - 2, 6, 5, 0, 0, 6.29); ctx.fill();
      }
      return;
    }
    const region = game.world.regionAt(r.x, r.y);
    const scorched = region.states.includes('scorched');
    if (r.type === 'tree') this.drawTree(ctx, r, t, scorched);
    else if (r.type === 'deadtree') this.drawDeadTree(ctx, r, t, scorched);
    else if (r.type === 'rock') this.drawRock(ctx, r, game);
    else if (r.type === 'bush' || r.type === 'berry') this.drawBush(ctx, r, t, scorched);
    else if (r.type === 'reed') this.drawReed(ctx, r, t);
    else if (r.type === 'fiber') this.drawFiber(ctx, r, t);
    else if (r.type === 'driftwood') this.drawDriftwood(ctx, r, t);
  }

  drawTree(ctx, r, t, scorched) {
    const sway = Math.sin(t * r.sway + r.phase) * 1.5;
    ctx.fillStyle = 'rgba(16,24,18,0.28)';
    ctx.beginPath();
    ctx.ellipse(r.x + 3, r.y + 3, 18, 7, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = scorched ? '#2c2622' : '#5b4631';
    ctx.fillRect(r.x - 2.5, r.y - 12, 5, 14);
    const dark = scorched ? '#2a2622' : (r.pine ? '#2f4a36' : '#3e5c3d');
    const mid = scorched ? '#38302a' : (r.pine ? '#3d5b41' : '#52714a');
    const light = scorched ? '#443a31' : (r.pine ? '#56724c' : '#6e8a56');
    if (r.pine) {
      for (let i = 0; i < 3; i++) {
        const y = r.y - 13 - i * 12;
        const w = 20 - i * 4;
        ctx.fillStyle = i === 2 ? light : i === 1 ? mid : dark;
        ctx.beginPath();
        ctx.moveTo(r.x + sway * (i + 1) * 0.35, y - 22);
        ctx.lineTo(r.x - w, y + 6);
        ctx.lineTo(r.x + w, y + 6);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      const blobs = [
        [-10, -25, 15], [9, -27, 14], [0, -37, 16], [0, -22, 17],
      ];
      ctx.fillStyle = dark;
      for (const [dx, dy, rr] of blobs) {
        ctx.beginPath();
        ctx.arc(r.x + dx + sway, r.y + dy, rr, 0, 6.29);
        ctx.fill();
      }
      ctx.fillStyle = mid;
      for (const [dx, dy, rr] of blobs) {
        ctx.beginPath();
        ctx.arc(r.x + dx - 3 + sway * 1.3, r.y + dy - 4, rr * 0.78, 0, 6.29);
        ctx.fill();
      }
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.arc(r.x - 7 + sway * 1.4, r.y - 36, 8, 0, 6.29);
      ctx.arc(r.x + 7 + sway * 1.2, r.y - 31, 6, 0, 6.29);
      ctx.fill();
    }
  }

  drawDeadTree(ctx, r, t, scorched) {
    const sway = Math.sin(t * 0.9 + r.phase) * 1.2;
    ctx.fillStyle = 'rgba(16,20,16,0.25)';
    ctx.beginPath(); ctx.ellipse(r.x + 2, r.y + 3, 12, 5, 0, 0, 6.29); ctx.fill();
    ctx.strokeStyle = scorched ? '#211d1a' : '#4b4034';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x + sway, r.y - 30);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r.x + sway * 0.5, r.y - 18);
    ctx.lineTo(r.x - 11, r.y - 30);
    ctx.moveTo(r.x + sway * 0.7, r.y - 23);
    ctx.lineTo(r.x + 10, r.y - 36);
    ctx.stroke();
  }

  drawRock(ctx, r, game) {
    const variant = r.variant;
    ctx.fillStyle = 'rgba(18,22,18,0.24)';
    ctx.beginPath(); ctx.ellipse(r.x + 3, r.y + 4, 17, 7, 0, 0, 6.29); ctx.fill();
    const base = variant % 2 ? '#69675f' : '#75726a';
    const pts = variant === 0
      ? [[-15, 2], [-11, -10], [2, -14], [14, -6], [12, 5], [0, 8]]
      : variant === 1
        ? [[-14, 3], [-9, -13], [5, -16], [15, -4], [10, 6], [-2, 7]]
        : [[-16, 1], [-8, -9], [1, -16], [11, -9], [14, 2], [5, 8]];
    ctx.fillStyle = base;
    ctx.beginPath();
    pts.forEach(([dx, dy], i) => i ? ctx.lineTo(r.x + dx, r.y + dy) : ctx.moveTo(r.x + dx, r.y + dy));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(190,187,174,0.30)';
    ctx.beginPath();
    ctx.moveTo(r.x - 8, r.y - 7);
    ctx.lineTo(r.x + 1, r.y - 13);
    ctx.lineTo(r.x + 8, r.y - 6);
    ctx.lineTo(r.x - 1, r.y - 2);
    ctx.closePath();
    ctx.fill();
    const b = game.world.biomeAt(r.x, r.y);
    if (b === BIOME.FOREST || b === BIOME.MARSH) {
      ctx.fillStyle = 'rgba(91,120,66,0.55)';
      ctx.beginPath(); ctx.ellipse(r.x - 6, r.y - 4, 6, 2.4, 0.3, 0, 6.29); ctx.fill();
    }
  }

  drawBush(ctx, r, t, scorched) {
    const sway = Math.sin(t * 1.1 + r.phase) * 1;
    ctx.fillStyle = 'rgba(16,22,16,0.22)';
    ctx.beginPath(); ctx.ellipse(r.x + 2, r.y + 2, 12, 4, 0, 0, 6.29); ctx.fill();
    const col = scorched ? '#3b332c' : '#4d6a3f';
    ctx.fillStyle = col;
    for (const [dx, dy, rr] of [[-6, -6, 7], [5, -8, 7], [0, -13, 7]]) {
      ctx.beginPath(); ctx.arc(r.x + dx + sway, r.y + dy, rr, 0, 6.29); ctx.fill();
    }
    ctx.fillStyle = scorched ? '#4a4036' : '#688a51';
    ctx.beginPath(); ctx.arc(r.x - 4 + sway, r.y - 9, 4.5, 0, 6.29); ctx.fill();
    if (r.type === 'berry' && r.ripe && !scorched) {
      ctx.fillStyle = '#a84f46';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(r.x - 7 + i * 4.4 + sway, r.y - 10 + (i % 2) * 4, 1.7, 0, 6.29);
        ctx.fill();
      }
    }
  }

  drawReed(ctx, r, t) {
    const sway = Math.sin(t * 1.6 + r.phase) * 2.4;
    ctx.strokeStyle = '#7a835c';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) {
      const dx = (i - 1.5) * 3.4;
      ctx.beginPath();
      ctx.moveTo(r.x + dx, r.y);
      ctx.quadraticCurveTo(r.x + dx + sway * 0.5, r.y - 12, r.x + dx + sway, r.y - 20 - i);
      ctx.stroke();
    }
    ctx.fillStyle = '#8b7c55';
    ctx.beginPath(); ctx.ellipse(r.x + sway, r.y - 21, 2.4, 5, 0.15, 0, 6.29); ctx.fill();
  }

  drawFiber(ctx, r, t) {
    const sway = Math.sin(t * 2 + r.phase) * 2;
    ctx.strokeStyle = '#83945d';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 2.6;
      ctx.beginPath();
      ctx.moveTo(r.x + dx, r.y);
      ctx.quadraticCurveTo(r.x + dx + sway, r.y - 7, r.x + dx + sway * 1.7, r.y - 13 - (i % 2) * 3);
      ctx.stroke();
    }
  }

  drawDriftwood(ctx, r, t) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.phase);
    ctx.strokeStyle = '#8a7b63';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(9, 1);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(5, -7);
    ctx.stroke();
    ctx.restore();
  }

  drawTent(ctx, t) {
    const colors = [['#77664d', '#5a4c3a'], ['#6c7059', '#50543f'], ['#7d604e', '#5c4638']];
    const [c1, c2] = colors[t.hue % colors.length];
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rot);
    ctx.fillStyle = 'rgba(14,20,16,0.28)';
    ctx.beginPath(); ctx.ellipse(2, 7, 25, 8, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(-22, 8);
    ctx.lineTo(0, -30);
    ctx.lineTo(23, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(-22, 8);
    ctx.lineTo(0, -30);
    ctx.lineTo(2, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(20,18,16,0.75)';
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.lineTo(0, -12);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,206,174,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 8); ctx.stroke();
    ctx.restore();
  }

  drawFire(ctx, f, game) {
    const t = this.time;
    ctx.fillStyle = 'rgba(18,18,14,0.28)';
    ctx.beginPath(); ctx.ellipse(f.x, f.y + 4, 18, 7, 0, 0, 6.29); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      ctx.fillStyle = i % 2 ? '#6d6a61' : '#5a584f';
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(a) * 12, f.y + Math.sin(a) * 8 + 1, 3.2, 0, 6.29);
      ctx.fill();
    }
    ctx.strokeStyle = '#5b4631';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(f.x - 8, f.y + 3); ctx.lineTo(f.x + 7, f.y - 3);
    ctx.moveTo(f.x - 6, f.y - 4); ctx.lineTo(f.x + 8, f.y + 4);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const h = 16 + Math.sin(t * 7 + i * 2) * 5;
      const sway = Math.sin(t * 4 + i) * 2;
      ctx.fillStyle = i === 0 ? 'rgba(224,112,54,0.9)' : i === 1 ? 'rgba(244,166,74,0.9)' : 'rgba(255,224,150,0.9)';
      ctx.beginPath();
      ctx.moveTo(f.x - 6 + i * 3, f.y);
      ctx.quadraticCurveTo(f.x - 2 + sway, f.y - h * 0.55, f.x + sway * 1.3, f.y - h);
      ctx.quadraticCurveTo(f.x + 5 + sway, f.y - h * 0.45, f.x + 6 - i * 2, f.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawWall(ctx, w) {
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.rot);
    ctx.fillStyle = 'rgba(16,20,17,0.24)';
    ctx.beginPath(); ctx.ellipse(2, 4, w.w / 2 + 3, 7, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#5f5d55';
    roundRect(ctx, -w.w / 2, -w.h, w.w, w.h + 5, 3);
    ctx.fill();
    ctx.fillStyle = '#757169';
    roundRect(ctx, -w.w / 2 + 2, -w.h + 1, w.w - 4, 4, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(38,38,34,0.55)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w.w / 3, -w.h + 5);
      ctx.lineTo(i * w.w / 3 + 2, 3);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(88,112,64,0.4)';
    ctx.beginPath(); ctx.ellipse(-w.w / 3, -2, 7, 2.5, 0.2, 0, 6.29); ctx.fill();
    ctx.restore();
  }

  drawChest(ctx, c, poi, game) {
    const open = game.openedChests?.has(poi.id);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = 'rgba(16,20,17,0.3)';
    ctx.beginPath(); ctx.ellipse(1, 3, 13, 5, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#5b4530';
    roundRect(ctx, -10, -8, 20, 13, 2);
    ctx.fill();
    ctx.fillStyle = open ? '#3b3026' : '#7a5c3a';
    roundRect(ctx, -10, -12, 20, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#b08a4f';
    ctx.fillRect(-2, -7, 4, 6);
    ctx.restore();
  }

  drawShrineStone(ctx, s, game) {
    const glow = 0.55 + Math.sin(this.time * 2 + s.rot * 4) * 0.18;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = 'rgba(16,22,18,0.26)';
    ctx.beginPath(); ctx.ellipse(2, 3, s.w + 4, 5, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#676b60';
    roundRect(ctx, -s.w / 2, -s.h, s.w, s.h, 3);
    ctx.fill();
    ctx.fillStyle = '#7b8072';
    roundRect(ctx, -s.w / 2 + 2, -s.h + 2, s.w - 4, 5, 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(154,198,152,${glow})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, -s.h + 9);
    ctx.lineTo(-3, -s.h + 15);
    ctx.lineTo(3, -s.h + 19);
    ctx.lineTo(0, -s.h + 26);
    ctx.stroke();
    ctx.restore();
  }

  // ── characters ─────────────────────────────────────────────────────────────
  drawPlayer(ctx, p, game) {
    const moving = game.playerMoving;
    const bob = moving ? Math.sin(p.stepPhase * 2) * 1.3 : Math.sin(this.time * 2) * 0.5;
    const crouch = p.crouching ? 0.84 : 1;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    // soft warm halo lifts the wanderer off the ground
    const halo = ctx.createRadialGradient(0, -4, 2, 0, -4, 34);
    halo.addColorStop(0, 'rgba(238,222,176,0.16)');
    halo.addColorStop(0.55, 'rgba(238,222,176,0.06)');
    halo.addColorStop(1, 'rgba(238,222,176,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, -4, 34, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(8,14,10,0.42)';
    ctx.beginPath(); ctx.ellipse(1, 4, 14, 6, 0, 0, 6.29); ctx.fill();
    if (p.dodgeTimer > 0) ctx.globalAlpha = 0.72;
    ctx.rotate(p.dir + Math.PI / 2);
    ctx.scale(crouch, crouch);
    const cloak = p.hurtFlash > 0 ? '#8d4038' : '#4c7160';
    const cloakLight = p.hurtFlash > 0 ? '#b05045' : '#6b927a';
    // dark outline keeps the silhouette readable against forest and stone
    ctx.fillStyle = 'rgba(14,22,16,0.85)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12.4, 15.4, 0, 0, 6.29);
    ctx.fill();
    // cloak
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 14, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = cloakLight;
    ctx.beginPath();
    ctx.ellipse(-3, 0, 5.7, 10.8, -0.12, 0, 6.29);
    ctx.fill();
    // rim light along the upper-left shoulder
    ctx.strokeStyle = 'rgba(222,234,206,0.72)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 14, 0, Math.PI * 0.92, Math.PI * 1.72);
    ctx.stroke();
    // pale mantle across the shoulders
    ctx.strokeStyle = 'rgba(210,190,148,0.7)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -1, 8.5, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    // sash
    ctx.strokeStyle = '#d18f4e';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-8.5, -2);
    ctx.lineTo(7.5, 4);
    ctx.stroke();
    // hood / head
    ctx.fillStyle = 'rgba(14,22,16,0.85)';
    ctx.beginPath();
    ctx.arc(0, -9, 8.2, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#3a5242';
    ctx.beginPath();
    ctx.arc(0, -9, 7.2, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#d8c2a0';
    ctx.beginPath();
    ctx.arc(0, -11, 4.3, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#3a5242';
    ctx.beginPath();
    ctx.arc(0, -12.5, 4.8, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,228,198,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -9, 7.2, Math.PI * 0.95, Math.PI * 1.55);
    ctx.stroke();
    // weapon
    const tool = p.tool;
    if (tool === 0) {
      ctx.strokeStyle = '#8a7354';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(7, 3);
      ctx.lineTo(12, -21);
      ctx.stroke();
      ctx.fillStyle = '#cfc6ae';
      ctx.beginPath();
      ctx.moveTo(12, -24);
      ctx.lineTo(10.4, -18);
      ctx.lineTo(13.8, -18);
      ctx.closePath();
      ctx.fill();
    } else if (tool === 1) {
      const draw = clamp(p.bowDraw, 0, 1);
      ctx.strokeStyle = '#8b704c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(8, -4, 10, -1.25, 1.25);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(220,210,180,0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(11, -13.5);
      ctx.lineTo(11 + draw * 3, -4);
      ctx.lineTo(11, 5.5);
      ctx.stroke();
    } else if (tool === 2) {
      ctx.strokeStyle = '#6d5439';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(7, 3);
      ctx.lineTo(12, -12);
      ctx.stroke();
      const f = 1 + Math.sin(this.time * 9) * 0.18;
      ctx.fillStyle = 'rgba(232,137,74,0.85)';
      ctx.beginPath();
      ctx.ellipse(12.5, -15, 3.4 * f, 6 * f, 0.15, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,216,142,0.9)';
      ctx.beginPath();
      ctx.ellipse(12.5, -15.5, 1.6 * f, 3.4 * f, 0.15, 0, 6.29);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#b9a374';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(9, 1, 5, 0, 6.29);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(9, 1, 2.6, 0, 6.29);
      ctx.stroke();
    }
    ctx.restore();
    if (p.crouching) {
      ctx.fillStyle = 'rgba(210,224,196,0.5)';
      ctx.font = '9px ui-sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('hidden', p.x, p.y - 30);
    }
  }

  drawEnemy(ctx, e, game) {
    if (e.dead) {
      if (e.fade <= 0) return;
      ctx.globalAlpha = e.fade;
    }
    const t = this.time;
    const bob = Math.sin(t * 5 + e.phase) * 1.1;
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    ctx.fillStyle = 'rgba(10,12,10,0.32)';
    ctx.beginPath(); ctx.ellipse(1, 4, e.r + 3, 5, 0, 0, 6.29); ctx.fill();
    ctx.rotate(e.face + Math.PI / 2);
    if (e.hitFlash > 0) ctx.globalAlpha *= 0.7;

    if (e.type === 'wolf') {
      this.drawWolf(ctx, e, t);
    } else if (e.type === 'bear') {
      this.drawBear(ctx, e, t);
    } else {
      const body = e.ashwalker ? '#3a302b' : '#33302d';
      const trim = e.ashwalker ? '#7a4a35' : '#4a423b';
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 2, 10, 12.5, 0, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.ellipse(-2.5, -1, 4.6, 9, -0.1, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#1e1c1a';
      ctx.beginPath(); ctx.arc(0, -9, 6.4, 0, 6.29); ctx.fill();
      // bone mask
      ctx.fillStyle = e.ashwalker ? '#8d7760' : '#c3b89d';
      ctx.beginPath();
      ctx.ellipse(0, -10, 4.3, 5.3, 0, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#7e2f2a';
      ctx.beginPath();
      ctx.arc(-1.7, -11, 1.1, 0, 6.29);
      ctx.arc(1.7, -11, 1.1, 0, 6.29);
      ctx.fill();
      // weapon
      if (e.type === 'archer') {
        ctx.strokeStyle = '#7d6649';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(8, -3, 9, -1.2, 1.2); ctx.stroke();
        ctx.strokeStyle = 'rgba(220,210,180,0.55)';
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(11, -12); ctx.lineTo(11, 6); ctx.stroke();
      } else {
        ctx.strokeStyle = '#6f6252';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(7, 2); ctx.lineTo(11, -17); ctx.stroke();
        ctx.fillStyle = '#a9a18e';
        ctx.beginPath();
        ctx.moveTo(11, -20); ctx.lineTo(9, -14); ctx.lineTo(13.5, -15);
        ctx.closePath(); ctx.fill();
      }
      if (e.shield) {
        ctx.save();
        ctx.translate(-9, -4);
        ctx.rotate(-0.25);
        ctx.fillStyle = '#6b5842';
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 10, 0, 0, 6.29);
        ctx.fill();
        ctx.strokeStyle = '#b39a6b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#c7ae7e';
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, 6.29); ctx.fill();
        ctx.restore();
      }
      if (e.lantern) {
        const glow = 0.65 + Math.sin(t * 5 + e.phase) * 0.15;
        ctx.fillStyle = `rgba(232,180,92,${glow})`;
        ctx.beginPath(); ctx.arc(-8, 7, 3, 0, 6.29); ctx.fill();
        ctx.strokeStyle = '#6b5a40';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(-8, 1); ctx.stroke();
      }
    }
    if (e.windup > 0) {
      ctx.strokeStyle = 'rgba(197,74,58,0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, e.atkRange + 7, -Math.PI * 0.72, -Math.PI * 0.28);
      ctx.stroke();
    }
    if (e.elite) {
      ctx.fillStyle = '#d8a75f';
      ctx.beginPath();
      ctx.moveTo(0, -22); ctx.lineTo(4, -17); ctx.lineTo(0, -13); ctx.lineTo(-4, -17);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    if (e.hp < e.maxHp && !e.dead) {
      const w = 26;
      ctx.fillStyle = 'rgba(8,10,9,0.7)';
      ctx.fillRect(e.x - w / 2, e.y - e.r - 22, w, 4);
      ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#a9b478' : e.hp / e.maxHp > 0.25 ? '#d1a35f' : '#b64b3f';
      ctx.fillRect(e.x - w / 2, e.y - e.r - 22, w * clamp(e.hp / e.maxHp, 0, 1), 4);
    }
    if (e.alerted && !e.dead) {
      ctx.fillStyle = 'rgba(232,137,74,0.9)';
      ctx.font = '700 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', e.x, e.y - e.r - 27);
    }
  }

  drawWolf(ctx, e, t) {
    const stride = Math.sin(t * 10 + e.phase) * 2.5;
    ctx.fillStyle = '#3b3630';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 14, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#4a443c';
    ctx.beginPath(); ctx.ellipse(0, -9, 5.5, 7, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#2a2723';
    ctx.beginPath(); ctx.ellipse(0, -15, 3.4, 4, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#c95d4c';
    ctx.beginPath();
    ctx.arc(-1.8, -16, 0.9, 0, 6.29);
    ctx.arc(1.8, -16, 0.9, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = '#2f2b26';
    ctx.lineWidth = 2;
    for (const [dx, off] of [[-4, stride], [4, -stride], [-4, -stride], [4, stride]]) {
      ctx.beginPath();
      ctx.moveTo(dx, 5);
      ctx.lineTo(dx + off * 0.4, 12 + off);
      ctx.stroke();
    }
    ctx.strokeStyle = '#3b3630';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(4, 18, 1, 22);
    ctx.stroke();
  }

  drawBear(ctx, e, t) {
    const stride = Math.sin(t * 6 + e.phase) * 2;
    ctx.fillStyle = '#3a312a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 18, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#4b3e33';
    ctx.beginPath(); ctx.ellipse(0, -13, 8.5, 8, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#2b2520';
    ctx.beginPath(); ctx.ellipse(0, -20, 5, 5, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#d1a35f';
    ctx.beginPath(); ctx.arc(-2.5, -21, 1, 0, 6.29); ctx.arc(2.5, -21, 1, 0, 6.29); ctx.fill();
    ctx.strokeStyle = '#2b2520';
    ctx.lineWidth = 3.4;
    for (const [dx, off] of [[-7, stride], [7, -stride], [-7, -stride], [7, stride]]) {
      ctx.beginPath(); ctx.moveTo(dx, 8); ctx.lineTo(dx + off * 0.3, 18); ctx.stroke();
    }
  }

  drawAnimal(ctx, a, game) {
    if (a.dead) return;
    const t = this.time;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.fillStyle = 'rgba(12,16,12,0.24)';
    ctx.beginPath(); ctx.ellipse(1, 3, a.r + 3, 4, 0, 0, 6.29); ctx.fill();
    ctx.rotate(a.face + Math.PI / 2);
    if (a.hitFlash > 0) ctx.globalAlpha = 0.7;
    if (a.type === 'rabbit') {
      ctx.fillStyle = '#8a7c68';
      ctx.beginPath(); ctx.ellipse(0, 0, 4, 6, 0, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -5, 3, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#8a7c68';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(-3, -13); ctx.moveTo(2, -7); ctx.lineTo(3, -13); ctx.stroke();
    } else if (a.type === 'boar') {
      ctx.fillStyle = '#4d4034';
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 14, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#5d4d3e';
      ctx.beginPath(); ctx.ellipse(0, -11, 7, 7, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#d8cba9';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-4, -15); ctx.lineTo(-6, -20); ctx.moveTo(4, -15); ctx.lineTo(6, -20); ctx.stroke();
    } else {
      const stride = Math.sin(t * 7 + a.phase) * 2;
      ctx.fillStyle = '#6d563e';
      ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 12, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#82684b';
      ctx.beginPath(); ctx.ellipse(0, -10, 4.6, 6.5, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#6d563e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, -14); ctx.lineTo(-5, -20); ctx.moveTo(2, -14); ctx.lineTo(5, -20);
      ctx.moveTo(-4, 4); ctx.lineTo(-5, 12 + stride); ctx.moveTo(4, 4); ctx.lineTo(5, 12 - stride);
      ctx.stroke();
      ctx.fillStyle = '#d8cba9';
      ctx.beginPath(); ctx.arc(-3, -17, 0.8, 0, 6.29); ctx.arc(3, -17, 0.8, 0, 6.29); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawNPC(ctx, n, game) {
    const bob = Math.sin(this.time * 1.8 + n.phase) * 0.7;
    ctx.save();
    ctx.translate(n.x, n.y + bob);
    ctx.fillStyle = 'rgba(12,16,12,0.28)';
    ctx.beginPath(); ctx.ellipse(1, 3, 11, 4.5, 0, 0, 6.29); ctx.fill();
    ctx.rotate(n.face + Math.PI / 2);
    const col = ROLE_COLORS[n.role] || '#a58b73';
    ctx.fillStyle = '#3b3730';
    ctx.beginPath(); ctx.ellipse(0, 2, 9.5, 12.5, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(-2, -1, 4.6, 9, -0.1, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#c9b18d';
    ctx.beginPath(); ctx.arc(0, -9.5, 5.2, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#3b3730';
    ctx.beginPath(); ctx.arc(0, -12, 5.8, Math.PI, 0); ctx.fill();
    if (n.role === 'Hunter') {
      ctx.strokeStyle = '#7d6649';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(8, -3, 8, -1.2, 1.2); ctx.stroke();
    } else if (n.role === 'Warden') {
      ctx.strokeStyle = '#8a7354';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(7, 4); ctx.lineTo(11, -16); ctx.stroke();
    } else {
      ctx.strokeStyle = '#6d5439';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(7, 4); ctx.lineTo(9, -11); ctx.stroke();
    }
    ctx.restore();
    const d = dist(n.x, n.y, game.player.x, game.player.y);
    if (d < 190) {
      ctx.font = '500 10px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(8,12,9,0.65)';
      ctx.fillText(n.name, n.x + 1, n.y - 28 + 1);
      ctx.fillStyle = n.aware ? '#e8dfc8' : 'rgba(232,223,200,0.72)';
      ctx.fillText(n.name, n.x, n.y - 28);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(n.x, n.y - 36, 2, 0, 6.29);
      ctx.fill();
    }
  }

  drawAim(ctx, game) {
    const m = game.mouseWorld;
    const p = game.player;
    const d = dist(m.x, m.y, p.x, p.y);
    if (d < 18) return;
    const target = game.enemies.find(e => !e.dead && dist(m.x, m.y, e.x, e.y) < 22);
    ctx.strokeStyle = target ? 'rgba(232,137,74,0.9)' : 'rgba(232,223,200,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(m.x, m.y, target ? 8 : 5, 0, 6.29);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(m.x - 10, m.y); ctx.lineTo(m.x - 6, m.y);
    ctx.moveTo(m.x + 6, m.y); ctx.lineTo(m.x + 10, m.y);
    ctx.moveTo(m.x, m.y - 10); ctx.lineTo(m.x, m.y - 6);
    ctx.moveTo(m.x, m.y + 6); ctx.lineTo(m.x, m.y + 10);
    ctx.stroke();
  }

  // ── lighting and weather ───────────────────────────────────────────────────
  drawLighting(game, camX, camY, night) {
    if (night < 0.015) return;
    const ctx = this.ctx;
    const lc = this.lightCtx;
    lc.clearRect(0, 0, this.vw, this.vh);
    lc.globalCompositeOperation = 'source-over';
    const dark = 0.82 * night;
    const grad = lc.createLinearGradient(0, 0, 0, this.vh);
    grad.addColorStop(0, `rgba(5,9,20,${dark * 1.04})`);
    grad.addColorStop(1, `rgba(4,7,16,${dark * 0.92})`);
    lc.fillStyle = grad;
    lc.fillRect(0, 0, this.vw, this.vh);
    lc.globalCompositeOperation = 'destination-out';

    const light = (wx, wy, radius, strength = 1) => {
      const x = wx - camX, y = wy - camY;
      if (x < -radius || y < -radius || x > this.vw + radius || y > this.vh + radius) return;
      const g = lc.createRadialGradient(x, y, 2, x, y, radius);
      g.addColorStop(0, `rgba(0,0,0,${0.95 * strength})`);
      g.addColorStop(0.55, `rgba(0,0,0,${0.62 * strength})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g;
      lc.beginPath();
      lc.arc(x, y, radius, 0, 6.29);
      lc.fill();
    };

    const p = game.player;
    light(p.x, p.y, p.tool === 2 ? 155 : 105, 0.9);
    for (const s of game.world.settlements) {
      if (s.fire) light(s.fire.x, s.fire.y, 175, 1);
    }
    for (const poi of game.world.pois) {
      if (poi.fire) light(poi.fire.x, poi.fire.y, 140, 0.9);
      if (poi.type === 'shrine') light(poi.x, poi.y, 125, 0.65);
    }
    for (const e of game.enemies) {
      if (!e.dead && e.lantern) light(e.x, e.y, 105, 0.8);
    }
    for (const pr of game.projectiles) {
      if (pr.fire) light(pr.x, pr.y, 55, 0.6);
    }
    ctx.drawImage(this.lightCanvas, 0, 0, this.vw, this.vh);

    // warm additive glow at fires
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of game.world.settlements) {
      if (!s.fire) continue;
      const x = s.fire.x - camX, y = s.fire.y - camY;
      if (x < -200 || y < -200 || x > this.vw + 200 || y > this.vh + 200) continue;
      const g = ctx.createRadialGradient(x, y, 4, x, y, 120);
      g.addColorStop(0, `rgba(232,137,74,${0.15 * night})`);
      g.addColorStop(1, 'rgba(232,137,74,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 120, 0, 6.29); ctx.fill();
    }
    ctx.restore();
  }

  drawWeather(ctx, game, dt) {
    const weather = game.weather;
    if (weather === 'rain') {
      ctx.save();
      ctx.strokeStyle = 'rgba(176,203,205,0.30)';
      ctx.lineWidth = 1;
      for (const r of this.rain) {
        r.y += r.speed * dt;
        r.x += r.drift * dt;
        if (r.y > this.vh + 30) { r.y = -30; r.x = Math.random() * (this.vw + 200) - 100; }
        if (r.x < -100) r.x = this.vw + 50;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.len * 0.18, r.y + r.len);
        ctx.stroke();
      }
      ctx.restore();
    } else if (weather === 'fog') {
      ctx.save();
      ctx.fillStyle = 'rgba(188,201,193,0.12)';
      ctx.fillRect(0, 0, this.vw, this.vh);
      for (let i = 0; i < 5; i++) {
        const x = ((this.time * (9 + i * 3) + i * 340) % (this.vw + 500)) - 250;
        const y = this.vh * (0.25 + i * 0.14);
        const g = ctx.createRadialGradient(x, y, 20, x, y, 260);
        g.addColorStop(0, 'rgba(205,214,205,0.09)');
        g.addColorStop(1, 'rgba(205,214,205,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 260, 0, 6.29); ctx.fill();
      }
      ctx.restore();
    } else {
      const night = game.nightFactor;
      if (night > 0.3) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const f of this.fireflies) {
          const x = (f.x + Math.sin(this.time * f.speed + f.phase) * 60 + this.vw) % this.vw;
          const y = (f.y + Math.cos(this.time * f.speed * 0.7 + f.phase) * 40 + this.vh) % this.vh;
          const a = (0.4 + Math.sin(this.time * 2 + f.phase) * 0.35) * night;
          ctx.fillStyle = `rgba(198,224,120,${a})`;
          ctx.beginPath(); ctx.arc(x, y, f.r, 0, 6.29); ctx.fill();
        }
        ctx.restore();
      } else {
        for (const l of this.leaves) {
          l.x += l.vx * dt;
          l.y += l.vy * dt;
          if (l.y > this.vh + 10) { l.y = -10; l.x = Math.random() * this.vw; }
          if (l.x < -10) l.x = this.vw + 5;
          if (l.x > this.vw + 10) l.x = -5;
          ctx.fillStyle = l.hue > 0.5 ? 'rgba(147,136,80,0.35)' : 'rgba(112,129,79,0.35)';
          ctx.beginPath();
          ctx.ellipse(l.x, l.y, l.size, l.size * 0.55, l.phase + this.time, 0, 6.29);
          ctx.fill();
        }
      }
    }
  }

  drawScreenFX(ctx, game) {
    // dawn / dusk warmth
    const t = game.dayFraction;
    let warm = 0;
    if (t > 0.70 && t < 0.83) warm = Math.sin((t - 0.70) / 0.13 * Math.PI) * 0.20;
    if (t > 0.15 && t < 0.27) warm = Math.sin((t - 0.15) / 0.12 * Math.PI) * 0.14;
    if (warm > 0) {
      ctx.fillStyle = `rgba(196,104,54,${warm})`;
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
    this.drawQuestMarker(ctx, game);
    // vignette
    const v = ctx.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.32, this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.75);
    v.addColorStop(0, 'rgba(4,8,7,0)');
    v.addColorStop(1, 'rgba(4,8,7,0.46)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, this.vw, this.vh);
    // hurt flash
    if (game.player.hurtFlash > 0) {
      ctx.fillStyle = `rgba(132,38,34,${game.player.hurtFlash * 0.26})`;
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
    // low vitals
    const p = game.player;
    const low = Math.max(0, 1 - Math.min(p.hp / 30, p.hunger / 20, p.thirst / 20, p.warmth / 20));
    if (low > 0) {
      const g = ctx.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.3, this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.72);
      g.addColorStop(0, 'rgba(120,20,18,0)');
      g.addColorStop(1, `rgba(120,20,18,${low * 0.25})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
  }

  drawQuestMarker(ctx, game) {
    const target = game.quest?.target;
    if (!target || game.state !== 'playing') return;
    const sx = target.x - this.camX;
    const sy = target.y - this.camY;
    const pulse = 0.5 + Math.sin(this.time * 2.4) * 0.5;
    ctx.save();
    if (sx > 26 && sx < this.vw - 26 && sy > 26 && sy < this.vh - 26) {
      ctx.strokeStyle = `rgba(242,178,108,${0.5 + pulse * 0.4})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 15 + pulse * 5, 0, 6.29);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy); ctx.lineTo(sx + 5, sy);
      ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 5);
      ctx.stroke();
      ctx.font = '500 9px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(8,12,9,0.72)';
      ctx.fillText(target.label, sx + 1, sy - 24);
      ctx.fillStyle = 'rgba(242,178,108,0.9)';
      ctx.fillText(target.label, sx, sy - 25);
    } else {
      const cx = this.vw / 2, cy = this.vh / 2;
      const a = Math.atan2(sy - cy, sx - cx);
      const ex = clamp(sx, 42, this.vw - 42);
      const ey = clamp(sy, 72, this.vh - 72);
      ctx.translate(ex, ey);
      ctx.rotate(a);
      ctx.fillStyle = 'rgba(242,178,108,0.9)';
      ctx.beginPath();
      ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-2, 0); ctx.lineTo(-6, 6);
      ctx.closePath(); ctx.fill();
      ctx.rotate(-a);
      ctx.font = '500 9px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(242,178,108,0.85)';
      ctx.fillText(target.label, 0, -14);
    }
    ctx.restore();
  }

  drawMini(game) {
    const canvas = this.game.ui?.minimap;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(this.mini, 0, 0, size, size);
    const s = size / 48;
    // unexplored fog
    ctx.fillStyle = 'rgba(10,19,19,0.64)';
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        if (!game.world.explored[y * 48 + x]) ctx.fillRect(x * s, y * s, s + 0.5, s + 0.5);
      }
    }
    // poi markers
    for (const poi of game.world.pois) {
      const x = poi.x / WORLD * size, y = poi.y / WORLD * size;
      const discovered = game.world.explored[Math.floor(y / size * 48) * 48 + Math.floor(x / size * 48)];
      if (!discovered) continue;
      ctx.save();
      ctx.translate(x, y);
      if (poi.type === 'settlement') {
        ctx.fillStyle = '#e2c98d';
        ctx.fillRect(-2.5, -2.5, 5, 5);
        ctx.strokeStyle = 'rgba(10,14,11,0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2.5, -2.5, 5, 5);
      } else if (poi.type === 'shrine') {
        ctx.fillStyle = '#a8c99a';
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(3.5, 0); ctx.lineTo(0, 4); ctx.lineTo(-3.5, 0); ctx.closePath(); ctx.fill();
      } else if (poi.type === 'ruin') {
        ctx.fillStyle = '#a59a84';
        ctx.beginPath(); ctx.moveTo(-3.5, 3); ctx.lineTo(0, -4); ctx.lineTo(3.5, 3); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#c9a06a';
        ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 6.29); ctx.fill();
      }
      ctx.restore();
    }
    // enemies nearby
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (dist(e.x, e.y, game.player.x, game.player.y) > 520) continue;
      ctx.fillStyle = 'rgba(198,75,62,0.9)';
      ctx.beginPath();
      ctx.arc(e.x / WORLD * size, e.y / WORLD * size, 2, 0, 6.29);
      ctx.fill();
    }
    // player
    const px = game.player.x / WORLD * size, py = game.player.y / WORLD * size;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(game.player.dir + Math.PI / 2);
    ctx.fillStyle = '#f4ead2';
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(3.6, 4); ctx.lineTo(0, 2); ctx.lineTo(-3.6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(244,234,210,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px, py, 5.5, 0, 6.29); ctx.stroke();
  }
}
