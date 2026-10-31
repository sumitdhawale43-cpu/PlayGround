import { TAU, clamp, rgba, lerp } from './util.js';
import {
  drawProp, drawHut, drawCairn, drawFire, drawPlayer, drawNpc, drawEnemy,
  drawAnimal, drawCorpse, drawTrap, drawArrow, drawEcho, drawDetail, drawHearthBase
} from './draw.js';

let lightCanvas = null;
let lightCtx = null;
let grainTile = null;
let grainPattern = null;
let vignetteCache = null;
let vignetteKey = '';

function ensureLight(w, h) {
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCtx = lightCanvas.getContext('2d');
  }
  if (lightCanvas.width !== w || lightCanvas.height !== h) {
    lightCanvas.width = w;
    lightCanvas.height = h;
  }
}

function getGrain(ctx) {
  if (!grainPattern) {
    grainTile = document.createElement('canvas');
    grainTile.width = 128;
    grainTile.height = 128;
    const g = grainTile.getContext('2d');
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * 0.06;
      g.fillStyle = Math.random() < 0.5 ? `rgba(240,235,210,${a})` : `rgba(10,14,10,${a * 1.4})`;
      g.fillRect(Math.random() * 128, Math.random() * 128, 1.4, 1.4);
    }
    grainPattern = ctx.createPattern(grainTile, 'repeat');
  }
  return grainPattern;
}

export function render(ctx, game) {
  const { w, h, dpr } = game.view;
  const z = game.zoom;
  const t = game.t;
  const shakeX = (Math.random() - 0.5) * game.shake * 11;
  const shakeY = (Math.random() - 0.5) * game.shake * 11;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0f0c';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
  ctx.scale(z, z);
  ctx.translate(-game.camera.x, -game.camera.y);

  const halfW = w / (2 * z);
  const halfH = h / (2 * z);
  const view = {
    x1: game.camera.x - halfW - 70,
    y1: game.camera.y - halfH - 70,
    x2: game.camera.x + halfW + 70,
    y2: game.camera.y + halfH + 70
  };
  const visible = (x, y, pad = 50) =>
    x > view.x1 - pad && x < view.x2 + pad && y > view.y1 - pad && y < view.y2 + pad;

  drawGround(ctx, game, view, visible, t);
  drawPaths(ctx, game);
  drawWater(ctx, game, view, visible, t);
  for (const d of game.world.detailProps) {
    if (visible(d.x, d.y, 20)) drawDetail(ctx, d, t);
  }
  drawGroundMemory(ctx, game, t);

  /* --- y-sorted world --- */
  const list = [];
  for (const p of game.world.props) {
    if (!visible(p.x, p.y, 90)) continue;
    list.push({ y: p.y, kind: 'prop', o: p });
  }
  for (const hut of game.world.huts) {
    if (visible(hut.x, hut.y, 130)) list.push({ y: hut.y + hut.r * 0.4, kind: 'hut', o: hut });
  }
  for (const c of game.world.cairns) {
    if (visible(c.x, c.y, 160)) list.push({ y: c.y, kind: 'cairn', o: c });
  }
  for (const f of game.fires) {
    if (visible(f.x, f.y, 60)) list.push({ y: f.y, kind: 'fire', o: f });
  }
  for (const n of game.npcs) {
    if (!n.inside && visible(n.x, n.y, 60)) list.push({ y: n.y, kind: 'npc', o: n });
  }
  for (const e of game.enemies) {
    if (visible(e.x, e.y, 90)) list.push({ y: e.y, kind: 'enemy', o: e });
  }
  for (const a of game.animals) {
    if (visible(a.x, a.y, 60)) list.push({ y: a.y, kind: 'animal', o: a });
  }
  for (const c of game.corpses) {
    if (visible(c.x, c.y, 50)) list.push({ y: c.y, kind: 'corpse', o: c });
  }
  for (const tr of game.traps) {
    if (visible(tr.x, tr.y, 40)) list.push({ y: tr.y - 2, kind: 'trap', o: tr });
  }
  if (game.mode !== 'title' && !game.player.dead) {
    list.push({ y: game.player.y, kind: 'player', o: game.player });
  }
  list.sort((a, b) => a.y - b.y);

  // hearth base under fires
  for (const f of game.fires) {
    if (f.eternal && visible(f.x, f.y, 40)) drawHearthBase(ctx, f.x, f.y);
  }

  for (const item of list) {
    switch (item.kind) {
      case 'prop': drawProp(ctx, item.o, t); break;
      case 'hut': drawHut(ctx, item.o, t, game.nightLevel()); break;
      case 'cairn': drawCairn(ctx, item.o, t); break;
      case 'fire': drawFire(ctx, item.o, t); break;
      case 'npc': drawNpc(ctx, item.o, game); break;
      case 'enemy': drawEnemy(ctx, item.o, game); break;
      case 'animal': drawAnimal(ctx, item.o, game); break;
      case 'corpse': drawCorpse(ctx, item.o); break;
      case 'trap': drawTrap(ctx, item.o); break;
      case 'player': drawPlayer(ctx, game.player, game); break;
      default: break;
    }
  }

  // arrows above the ground clutter
  for (const pr of game.projectiles) {
    if (visible(pr.x, pr.y, 40)) drawArrow(ctx, pr);
  }

  // ember ring
  if (game.emberRing) {
    const ring = game.emberRing;
    ring.t -= 1 / 60;
    if (ring.t <= 0) game.emberRing = null;
    else {
      const p = 1 - ring.t / ring.max;
      ctx.strokeStyle = `rgba(240, 160, 90, ${0.5 * (1 - p)})`;
      ctx.lineWidth = 3 * (1 - p) + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 40 + p * 150, 0, TAU);
      ctx.stroke();
    }
  }

  // particles
  for (const p of game.particles) {
    if (!visible(p.x, p.y, 30)) continue;
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = p.kind === 'smoke' ? a * 0.35 : a;
    ctx.fillStyle = p.color;
    if (p.kind === 'ember' || p.kind === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.kind === 'smoke' ? 1 + (1 - a) * 1.2 : 1), 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;

  // interaction marker
  if (game.currentInteract && game.mode === 'play') {
    const it = game.currentInteract;
    const pulse = 0.55 + Math.sin(t * 3.4) * 0.22;
    ctx.strokeStyle = `rgba(233, 225, 207, ${pulse * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(it.x, it.y - 8, 16, 0, TAU);
    ctx.stroke();
  }

  ctx.restore();

  /* --- screen-space light & weather --- */
  drawLighting(ctx, game, shakeX, shakeY, t);

  // beam and memory glow above the dark
  ctx.save();
  ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
  ctx.scale(z, z);
  ctx.translate(-game.camera.x, -game.camera.y);
  for (const c of game.world.cairns) {
    if (c.lit && visibleStatic(c.x, c.y, game, w, h, z, 260)) drawBeam(ctx, c, t);
  }
  game.echoes.forEach((e, i) => {
    if (e.x != null && visibleStatic(e.x, e.y, game, w, h, z, 60)) drawEcho(ctx, e, t, i);
  });
  for (const f of game.floaters) {
    const a = clamp(f.life / f.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = `600 ${f.size}px "Iowan Old Style", Palatino, Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(f.text, f.x, f.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawWeather(ctx, game, t, w, h);
  drawVignette(ctx, game, w, h, shakeX, shakeY);
}

function visibleStatic(x, y, game, w, h, z, pad = 0) {
  const dx = Math.abs(x - game.camera.x) * z;
  const dy = Math.abs(y - game.camera.y) * z;
  return dx < w / 2 + pad && dy < h / 2 + pad;
}

/* ============================================================
   GROUND
   ============================================================ */
function drawGround(ctx, game, view, visible, t) {
  const world = game.world;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(world.groundCanvas, 0, 0, world.w, world.h);

  // village worn earth
  const v = world.village;
  if (visible(v.x, v.y, 400)) {
    const g = ctx.createRadialGradient(v.x, v.y, 40, v.x, v.y, 330);
    g.addColorStop(0, 'rgba(130, 110, 76, 0.36)');
    g.addColorStop(0.6, 'rgba(130, 110, 76, 0.14)');
    g.addColorStop(1, 'rgba(130, 110, 76, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 330, 0, TAU);
    ctx.fill();
  }

  // subtle painterly grain
  const pat = getGrain(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pat;
    ctx.fillRect(view.x1, view.y1, view.x2 - view.x1, view.y2 - view.y1);
    ctx.restore();
  }

  // faint biome light pools for depth
  const patches = [
    [world.lake.x, world.lake.y, 520, 'rgba(80, 130, 140, 0.05)'],
    [world.bog.x, world.bog.y, 460, 'rgba(60, 90, 70, 0.06)'],
    [world.ruins.x, world.ruins.y, 260, 'rgba(180, 190, 180, 0.035)']
  ];
  for (const [x, y, r, col] of patches) {
    if (!visible(x, y, r)) continue;
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
}

function drawPaths(ctx, game) {
  const paths = game.world.paths;
  for (const path of paths) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(99, 83, 58, 0.34)';
    ctx.lineWidth = 34;
    strokePoints(ctx, path.points);
    ctx.strokeStyle = 'rgba(124, 106, 74, 0.32)';
    ctx.lineWidth = 20;
    strokePoints(ctx, path.points);
    ctx.strokeStyle = 'rgba(154, 136, 98, 0.13)';
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 15]);
    strokePoints(ctx, path.points);
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
  }
}

function strokePoints(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

function drawWater(ctx, game, view, visible, t) {
  if (!game.world._waterCells) {
    const cells = [];
    const step = 90;
    for (let y = 0; y < game.world.h; y += step) {
      for (let x = 0; x < game.world.w; x += step) {
        if (game.world.waterAt(x, y)) cells.push({ x, y, seed: (x * 13 + y * 7) % 100 });
      }
    }
    game.world._waterCells = cells;
  }
  ctx.strokeStyle = 'rgba(190, 220, 220, 0.18)';
  ctx.lineWidth = 1.2;
  for (const c of game.world._waterCells) {
    if (!visible(c.x, c.y, 20)) continue;
    const wob = Math.sin(t * 1.3 + c.seed) * 4;
    ctx.beginPath();
    ctx.moveTo(c.x - 9 + wob, c.y + Math.sin(t + c.seed) * 1.5);
    ctx.lineTo(c.x + 9 + wob, c.y + Math.sin(t + c.seed) * 1.5);
    ctx.stroke();
  }
}

/* ============================================================
   WORLD MEMORY
   ============================================================ */
function drawGroundMemory(ctx, game, t) {
  const memory = game.world._campScars;
  if (memory) {
    for (const s of memory) {
      ctx.fillStyle = 'rgba(24, 20, 16, 0.22)';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 34, 18, 0, 0, TAU);
      ctx.fill();
    }
  }
  // recent campfire scars are drawn from the fires list, including dead ones
}

function drawBeam(ctx, c, t) {
  const flick = 0.7 + Math.sin(t * 2.2 + c.x) * 0.14;
  const g = ctx.createLinearGradient(0, c.y - 440, 0, c.y - 20);
  g.addColorStop(0, 'rgba(240, 170, 90, 0)');
  g.addColorStop(0.55, `rgba(240, 160, 86, ${0.1 * flick})`);
  g.addColorStop(1, `rgba(255, 190, 120, ${0.2 * flick})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(c.x - 8, c.y - 20);
  ctx.lineTo(c.x - 30, c.y - 440);
  ctx.lineTo(c.x + 30, c.y - 440);
  ctx.lineTo(c.x + 8, c.y - 20);
  ctx.closePath();
  ctx.fill();
}

/* ============================================================
   LIGHTING
   ============================================================ */
function drawLighting(ctx, game, shakeX, shakeY, t) {
  const { w, h } = game.view;
  const dark = game.centerDarkness();
  if (dark <= 0.02) return;
  ensureLight(w, h);
  const l = lightCtx;
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.clearRect(0, 0, w, h);
  l.fillStyle = `rgba(5, 9, 15, ${clamp(dark, 0, 0.86)})`;
  l.fillRect(0, 0, w, h);

  const z = game.zoom;
  const sx = (x) => (x - game.camera.x) * z + w / 2 + shakeX;
  const sy = (y) => (y - game.camera.y) * z + h / 2 + shakeY;

  l.globalCompositeOperation = 'destination-out';
  const hole = (x, y, radius, strength = 1) => {
    const g = l.createRadialGradient(x, y, radius * 0.05, x, y, radius);
    g.addColorStop(0, `rgba(0,0,0,${strength})`);
    g.addColorStop(0.42, `rgba(0,0,0,${strength * 0.82})`);
    g.addColorStop(0.72, `rgba(0,0,0,${strength * 0.34})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g;
    l.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  const p = game.player;
  hole(sx(p.x), sy(p.y), 150 * z, 0.55);
  for (const f of game.fires) {
    const flick = 1 + Math.sin(t * 7 + f.seed) * 0.05 + Math.sin(t * 11.7 + f.seed) * 0.03;
    hole(sx(f.x), sy(f.y), f.light * z * flick, f.eternal ? 1 : 0.95);
  }
  for (const c of game.world.cairns) {
    if (c.lit) hole(sx(c.x), sy(c.y), 315 * z, 0.9);
  }
  if (dark > 0.2) {
    for (const lantern of game.world.lanterns) {
      hole(sx(lantern.x), sy(lantern.y), lantern.r * z, 0.6);
    }
  }
  l.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0);

  // warm glow on top
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const f of game.fires) {
    const flick = 0.9 + Math.sin(t * 6 + f.seed) * 0.1;
    const x = sx(f.x), y = sy(f.y);
    const g = ctx.createRadialGradient(x, y, 2, x, y, f.light * z * 0.7);
    g.addColorStop(0, `rgba(240, 150, 80, ${0.16 * flick})`);
    g.addColorStop(0.4, `rgba(224, 118, 60, ${0.06 * flick})`);
    g.addColorStop(1, 'rgba(224, 118, 60, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - f.light * z, y - f.light * z, f.light * z * 2, f.light * z * 2);
  }
  for (const c of game.world.cairns) {
    if (!c.lit) continue;
    const x = sx(c.x), y = sy(c.y);
    const g = ctx.createRadialGradient(x, y, 2, x, y, 320 * z);
    g.addColorStop(0, 'rgba(240, 170, 90, 0.14)');
    g.addColorStop(1, 'rgba(240, 170, 90, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 320 * z, y - 320 * z, 640 * z, 640 * z);
  }
  ctx.restore();
}

/* ============================================================
   WEATHER / VIGNETTE
   ============================================================ */
function drawWeather(ctx, game, t, w, h) {
  if (game.weather.type === 'rain' && game.mode !== 'title') {
    ctx.save();
    ctx.strokeStyle = 'rgba(170, 195, 200, 0.19)';
    ctx.lineWidth = 1;
    const drift = t * 420;
    for (let i = 0; i < 130; i++) {
      const x = ((i * 97.3 + drift * 0.7) % (w + 120)) - 60;
      const y = ((i * 53.7 + drift) % (h + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 15);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(30, 50, 52, 0.05)';
    ctx.fillRect(0, 0, w, h);
  }
  if (game.weather.type === 'fog') {
    ctx.save();
    ctx.fillStyle = 'rgba(160, 172, 170, 0.045)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = ((i * 420 + t * 12) % (w + 500)) - 250;
      const y = h * (0.28 + i * 0.16) + Math.sin(t * 0.2 + i) * 20;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 320);
      g.addColorStop(0, 'rgba(180, 192, 190, 0.05)');
      g.addColorStop(1, 'rgba(180, 192, 190, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 320, y - 320, 640, 640);
    }
    ctx.restore();
  }
  if (game.weather.type === 'clear' && game.nightLevel() > 0.4 && game.mode !== 'title') {
    // fireflies
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const x = ((i * 211.7 + t * (9 + i % 5)) % (w + 80)) - 40;
      const y = ((i * 137.3 + Math.sin(t * 0.7 + i) * 40) % (h + 80)) - 40;
      const a = 0.18 + Math.sin(t * 2.4 + i * 1.7) * 0.14;
      ctx.fillStyle = `rgba(206, 220, 140, ${Math.max(0, a)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  if (game.nightLevel() > 0.35) {
    ctx.fillStyle = `rgba(20, 34, 54, ${game.nightLevel() * 0.045})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawVignette(ctx, game, w, h, shakeX, shakeY) {
  const key = `${w}x${h}`;
  if (vignetteKey !== key) {
    vignetteCache = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.26, w / 2, h / 2, Math.max(w, h) * 0.78);
    vignetteCache.addColorStop(0, 'rgba(3, 6, 5, 0)');
    vignetteCache.addColorStop(0.65, 'rgba(3, 6, 5, 0.12)');
    vignetteCache.addColorStop(1, 'rgba(3, 6, 5, 0.62)');
    vignetteKey = key;
  }
  ctx.fillStyle = vignetteCache;
  ctx.fillRect(0, 0, w, h);

  if (game.damageFlash > 0.01) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.62);
    g.addColorStop(0, 'rgba(120, 24, 18, 0)');
    g.addColorStop(1, `rgba(120, 24, 18, ${game.damageFlash * 0.5})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  if (game.phaseKey() === 'dusk' || game.phaseKey() === 'dawn') {
    ctx.fillStyle = 'rgba(224, 138, 68, 0.035)';
    ctx.fillRect(0, 0, w, h);
  }

  // letterbox grain at screen edges
  const g2 = ctx.createLinearGradient(0, 0, 0, h);
  g2.addColorStop(0, 'rgba(3, 6, 5, 0.28)');
  g2.addColorStop(0.14, 'rgba(3, 6, 5, 0)');
  g2.addColorStop(0.86, 'rgba(3, 6, 5, 0)');
  g2.addColorStop(1, 'rgba(3, 6, 5, 0.34)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
}

/* ============================================================
   MINIMAP
   ============================================================ */
export function drawMinimap(canvas, game) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const world = game.world;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(world.minimap, 0, 0, w, h);

  const mx = (x) => (x / world.w) * w;
  const my = (y) => (y / world.h) * h;

  // village
  ctx.fillStyle = 'rgba(233, 225, 207, 0.65)';
  ctx.beginPath();
  ctx.arc(mx(world.village.x), my(world.village.y), 2.6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(233, 225, 207, 0.28)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(mx(world.village.x), my(world.village.y), 5, 0, TAU);
  ctx.stroke();

  // cairns
  for (const c of world.cairns) {
    const x = mx(c.x), y = my(c.y);
    if (c.lit) {
      ctx.fillStyle = 'rgba(240, 160, 86, 0.95)';
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, TAU);
      ctx.fill();
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g.addColorStop(0, 'rgba(240, 160, 86, 0.45)');
      g.addColorStop(1, 'rgba(240, 160, 86, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 8, y - 8, 16, 16);
    } else {
      ctx.strokeStyle = 'rgba(233, 225, 207, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 3.5);
      ctx.lineTo(x + 2.8, y + 2);
      ctx.lineTo(x - 2.8, y + 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ruins
  ctx.fillStyle = 'rgba(200, 205, 195, 0.35)';
  ctx.fillRect(mx(world.ruins.x) - 2, my(world.ruins.y) - 2, 4, 4);

  // memory echoes
  for (const e of game.echoes) {
    if (e.x == null) continue;
    ctx.fillStyle = 'rgba(216, 180, 106, 0.4)';
    ctx.beginPath();
    ctx.arc(mx(e.x), my(e.y), 1, 0, TAU);
    ctx.fill();
  }

  // enemies
  for (const e of game.enemies) {
    if (e.dead || e.fade) continue;
    ctx.fillStyle = 'rgba(212, 90, 74, 0.85)';
    ctx.beginPath();
    ctx.arc(mx(e.x), my(e.y), 1.7, 0, TAU);
    ctx.fill();
  }

  // player arrow
  const px = mx(game.player.x), py = my(game.player.y);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(game.player.angle);
  ctx.fillStyle = 'rgba(245, 238, 218, 0.95)';
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-3.4, 3.2);
  ctx.lineTo(-1.6, 0);
  ctx.lineTo(-3.4, -3.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // night wash
  const night = game.nightLevel();
  if (night > 0) {
    ctx.fillStyle = `rgba(10, 16, 24, ${night * 0.24})`;
    ctx.fillRect(0, 0, w, h);
  }
  // frame
  ctx.strokeStyle = 'rgba(233, 225, 207, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}
