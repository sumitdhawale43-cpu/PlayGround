/* =========================================================
   PORTAL RUNNER — world renderer
   ========================================================= */
import { TAU, clamp, hash, rgba } from './utils.js';

const rr = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
};

const topRounded = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
};

export function drawWorldScene(r, game, t) {
  const ctx = r.ctx;
  const view = game.view;
  const cam = game.cam;
  const layer = game.layer;
  const pal = game.level.palette[layer];
  const otherPal = game.level.palette[layer === 'light' ? 'dark' : 'light'];
  const left = cam.x - view.w / 2 - 90;
  const right = cam.x + view.w / 2 + 90;
  const top = cam.y - view.h / 2 - 90;
  const bottom = cam.y + view.h / 2 + 90;

  ctx.save();
  const shakeX = Math.sin(t * 91) * cam.shake;
  const shakeY = Math.cos(t * 77) * cam.shake;
  ctx.translate(view.w / 2 - cam.x + shakeX, view.h / 2 - cam.y + shakeY);

  drawGhosts(ctx, game, left, right, top, bottom, otherPal);
  drawSolids(ctx, game, pal, left, right, top, bottom, t);
  drawBridges(ctx, game, pal, t);
  drawHazards(ctx, game, pal, t);
  drawPlates(ctx, game, pal, t);
  drawCheckpoints(ctx, game, pal, t);

  for (const p of game.world.portals) {
    if (p.layer !== layer) continue;
    if (p.x < left || p.x > right) continue;
    drawPortal(ctx, game, p, pal, t, false, game.interaction && game.interaction.obj === p);
  }

  const goal = game.level.goal;
  if (goal && (goal.layer === 'both' || goal.layer === layer) && goal.x > left && goal.x < right) {
    drawPortal(ctx, game, goal, pal, t, true, game.interaction && game.interaction.obj === goal);
  }

  for (const s of game.world.shards) {
    if (s.taken || s.x < left || s.x > right) continue;
    drawShard(ctx, s, pal, t);
  }
  for (const k of game.world.keys) {
    if (k.taken || k.x < left || k.x > right) continue;
    drawKey(ctx, k, pal, t);
  }
  for (const e of game.world.enemies) {
    if (e.dead > 0 || e.curX < left - 40 || e.curX > right + 40) continue;
    drawEnemy(ctx, game, e, pal, t);
  }

  drawPlayer(ctx, game, pal, t);
  drawParticles(ctx, game, t);
  drawFloaters(ctx, game);

  ctx.restore();
}

/* ---------------------------------------------------------
   ghost geometry of the other dimension
   --------------------------------------------------------- */
function drawGhosts(ctx, game, left, right, top, bottom, pal) {
  const other = game.level[game.layer === 'light' ? 'dark' : 'light'];
  ctx.save();
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 9]);
  const shimmer = 0.5 + 0.5 * Math.sin(game.t * 1.6);
  for (const s of other.solids) {
    if (s.shared) continue;
    if (s.x > right || s.x + s.w < left || s.y > bottom || s.y + s.h < top) continue;
    const isWall = s.w < 80 && s.h > 100;
    ctx.fillStyle = rgba(pal.accent, isWall ? 0.035 : 0.02);
    ctx.strokeStyle = rgba(pal.accent, isWall ? 0.2 + shimmer * 0.12 : 0.1 + shimmer * 0.06);
    if (s.type === 'oneway') {
      rr(ctx, s.x, s.y, s.w, Math.max(8, s.h), 5);
      ctx.fill();
      ctx.stroke();
    } else {
      topRounded(ctx, s.x, s.y, s.w, s.h, 8);
      ctx.fill();
      ctx.stroke();
      if (isWall) {
        for (let i = 0; i < 4; i++) {
          const y = s.y + 24 + i * 54;
          if (y > s.y + s.h - 10) break;
          ctx.beginPath();
          ctx.arc(s.x + s.w / 2, y, 5 + (i % 2) * 2, 0, TAU);
          ctx.stroke();
        }
      }
    }
  }
  for (const m of other.moving) {
    if (m.x > right || m.x + m.w < left) continue;
    ctx.strokeStyle = rgba(pal.accent, 0.13);
    rr(ctx, m.x, m.y, m.w, m.h, 5);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------------------------------------------------
   platforms
   --------------------------------------------------------- */
function drawSolids(ctx, game, pal, left, right, top, bottom, t) {
  const dark = game.layer === 'dark';
  for (const s of game.world.solids) {
    if (s.x > right || s.x + s.w < left || s.y > bottom || s.y + s.h < top) continue;
    if (s.type === 'crumble') {
      if (s.state === 'gone') continue;
      drawCrumble(ctx, s, pal, dark, t);
      continue;
    }
    if (s.type === 'oneway') {
      drawOneWay(ctx, s, pal, dark, t);
      continue;
    }
    drawGround(ctx, s, pal, dark, t);
  }
  for (const m of game.world.moving) {
    if (m.x > right || m.x + m.w < left || m.y > bottom || m.y + m.h < top) continue;
    drawMoving(ctx, m, pal, dark, t);
  }
}

function drawGround(ctx, s, pal, dark, t) {
  const wall = s.w < 80 && s.h > 110;
  ctx.save();
  const grad = ctx.createLinearGradient(0, s.y, 0, s.y + Math.min(s.h, 420));
  grad.addColorStop(0, pal.rockTop);
  grad.addColorStop(0.22, pal.rockBody);
  grad.addColorStop(1, pal.rockDeep);
  ctx.fillStyle = grad;
  ctx.shadowColor = rgba(pal.rockDeep, 0.8);
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  topRounded(ctx, s.x, s.y, s.w, s.h, wall ? 10 : 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // rim
  ctx.strokeStyle = rgba(pal.accent, dark ? 0.3 : 0.26);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(s.x + 5, s.y + 0.7);
  ctx.lineTo(s.x + s.w - 5, s.y + 0.7);
  ctx.stroke();
  const rim = ctx.createLinearGradient(s.x, s.y, s.x, s.y + 26);
  rim.addColorStop(0, rgba(pal.accent, dark ? 0.22 : 0.18));
  rim.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = rim;
  ctx.fillRect(s.x, s.y, s.w, 26);

  if (wall) {
    // monolith runes
    ctx.strokeStyle = rgba(pal.accent, 0.38);
    ctx.lineWidth = 1.4;
    const cx = s.x + s.w / 2;
    for (let i = 0; i < Math.min(5, Math.floor(s.h / 60)); i++) {
      const y = s.y + 34 + i * 58;
      ctx.beginPath();
      ctx.arc(cx, y, 7, -0.9, 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 5, y + 11);
      ctx.lineTo(cx + 5, y + 11);
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(cx, s.y + s.h / 2, 3, cx, s.y + s.h / 2, s.h * 0.8);
    glow.addColorStop(0, rgba(pal.accent, 0.09));
    glow.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(s.x - 40, s.y, s.w + 80, s.h);
    ctx.restore();
    return;
  }

  // cracks / veins
  ctx.strokeStyle = rgba(pal.accent, dark ? 0.12 : 0.08);
  ctx.lineWidth = 1;
  const count = Math.min(14, Math.floor(s.w / 70));
  for (let i = 0; i < count; i++) {
    const x = s.x + 20 + hash(s.x + i * 37) * (s.w - 40);
    const len = 18 + hash(i + s.y) * 44;
    ctx.beginPath();
    ctx.moveTo(x, s.y + 8);
    ctx.lineTo(x + (hash(i + 9) - 0.5) * 18, s.y + 8 + len);
    ctx.stroke();
  }

  // decorative fringe
  const step = dark ? 34 : 26;
  const decoCount = Math.min(50, Math.ceil(s.w / step));
  ctx.save();
  for (let i = 0; i < decoCount; i++) {
    const x = s.x + 8 + i * step + hash(s.x + i * 5) * (step - 12);
    if (x > s.x + s.w - 8) continue;
    const h1 = 4 + hash(i + s.x) * 9;
    if (dark) {
      ctx.fillStyle = rgba(pal.accent, 0.35 + hash(i) * 0.3);
      ctx.beginPath();
      ctx.moveTo(x - 2.5, s.y + 1);
      ctx.lineTo(x, s.y - h1 * 1.6);
      ctx.lineTo(x + 2.5, s.y + 1);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = rgba(pal.accent, 0.3 + hash(i) * 0.3);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 1);
      ctx.quadraticCurveTo(x + (hash(i + 3) - 0.5) * 8, s.y - h1 * 0.7, x + (hash(i + 7) - 0.5) * 11, s.y - h1);
      ctx.stroke();
    }
  }
  ctx.restore();

  // bottom fade for tall grounds
  if (s.h > 160) {
    const fade = ctx.createLinearGradient(0, s.y + s.h - 160, 0, s.y + s.h);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = fade;
    ctx.fillRect(s.x, s.y + s.h - 160, s.w, 160);
  }
  ctx.restore();
}

function drawOneWay(ctx, s, pal, dark) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
  grad.addColorStop(0, pal.rockTop);
  grad.addColorStop(0.55, pal.rockBody);
  grad.addColorStop(1, pal.rockDeep);
  ctx.fillStyle = grad;
  ctx.shadowColor = rgba(pal.rockDeep, 0.7);
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  rr(ctx, s.x, s.y, s.w, s.h, 5);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = rgba(pal.accent, 0.34);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(s.x + 4, s.y + 0.8);
  ctx.lineTo(s.x + s.w - 4, s.y + 0.8);
  ctx.stroke();
  // underglow
  const glow = ctx.createLinearGradient(0, s.y + s.h, 0, s.y + s.h + 18);
  glow.addColorStop(0, rgba(pal.accent, 0.13));
  glow.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(s.x + 5, s.y + s.h, s.w - 10, 18);
  // ends
  for (const x of [s.x + 7, s.x + s.w - 7]) {
    ctx.fillStyle = rgba(pal.accent, 0.5);
    ctx.beginPath();
    ctx.arc(x, s.y + s.h / 2, 1.6, 0, TAU);
    ctx.fill();
  }
  // tufts / crystals on top
  const count = Math.min(14, Math.floor(s.w / 18));
  for (let i = 0; i < count; i++) {
    const x = s.x + 8 + i * ((s.w - 16) / Math.max(1, count - 1));
    const h1 = 3 + hash(i + s.x * 0.1) * 7;
    if (dark) {
      ctx.fillStyle = rgba(pal.accent, 0.4);
      ctx.beginPath();
      ctx.moveTo(x - 2, s.y);
      ctx.lineTo(x, s.y - h1 * 1.6);
      ctx.lineTo(x + 2, s.y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = rgba(pal.accent, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, s.y);
      ctx.lineTo(x + (hash(i) - 0.5) * 5, s.y - h1);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCrumble(ctx, s, pal, dark, t) {
  const shaking = s.state === 'shaking';
  const offX = shaking ? Math.sin(t * 70) * 1.8 : 0;
  ctx.save();
  ctx.translate(offX, 0);
  const alpha = shaking ? 0.65 + Math.sin(t * 32) * 0.25 : 1;
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
  grad.addColorStop(0, dark ? '#a94a8e' : '#a5e8ef');
  grad.addColorStop(0.5, pal.rockBody);
  grad.addColorStop(1, pal.rockDeep);
  ctx.fillStyle = grad;
  rr(ctx, s.x, s.y, s.w, s.h, 5);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.accent, 0.55);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // cracks
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const x = s.x + 12 + i * (s.w / 4);
    ctx.beginPath();
    ctx.moveTo(x, s.y + 2);
    ctx.lineTo(x + (hash(i + s.x) - 0.5) * 10, s.y + s.h - 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMoving(ctx, m, pal, dark, t) {
  ctx.save();
  // energy tether
  const ox = m.originX + m.w / 2;
  const oy = m.originY + m.h / 2;
  const cx = m.x + m.w / 2;
  const cy = m.y + m.h / 2;
  ctx.strokeStyle = rgba(pal.accent, 0.14);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgba(pal.accent, 0.45);
  ctx.beginPath();
  ctx.arc(ox, oy, 3, 0, TAU);
  ctx.fill();

  const grad = ctx.createLinearGradient(0, m.y, 0, m.y + m.h);
  grad.addColorStop(0, dark ? '#8a4e9e' : '#4b918f');
  grad.addColorStop(1, pal.rockDeep);
  ctx.fillStyle = grad;
  ctx.shadowColor = rgba(pal.accent, 0.5);
  ctx.shadowBlur = 16;
  rr(ctx, m.x, m.y, m.w, m.h, 5);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(pal.accent, 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // runes
  ctx.fillStyle = rgba(pal.accent, 0.85);
  const n = 3;
  for (let i = 0; i < n; i++) {
    const x = m.x + 14 + i * ((m.w - 28) / Math.max(1, n - 1));
    ctx.beginPath();
    ctx.arc(x, m.y + m.h / 2, 1.8 + Math.sin(t * 2.4 + i) * 0.5, 0, TAU);
    ctx.fill();
  }
  // hover dust
  for (let i = 0; i < 3; i++) {
    const a = (t * 0.6 + i * 2.1) % TAU;
    ctx.fillStyle = rgba(pal.accent, 0.3);
    ctx.beginPath();
    ctx.arc(m.x + m.w / 2 + Math.cos(a) * (m.w * 0.45), m.y + m.h + 5 + Math.sin(a) * 4, 1.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ---------------------------------------------------------
   hazards
   --------------------------------------------------------- */
function drawHazards(ctx, game, pal, t) {
  for (const h of game.world.hazards) {
    if (h.type === 'lava') drawLava(ctx, h, t);
    else drawSpikes(ctx, h, pal, t);
  }
}

function drawLava(ctx, h, t) {
  ctx.save();
  ctx.beginPath();
  const topY = h.y + Math.sin(t * 1.6 + h.x * 0.01) * 2.5;
  ctx.moveTo(h.x, h.y + 10);
  for (let x = h.x; x <= h.x + h.w; x += 12) {
    ctx.lineTo(x, topY + Math.sin(t * 2.1 + x * 0.025) * 3.2);
  }
  ctx.lineTo(h.x + h.w, h.y + h.h);
  ctx.lineTo(h.x, h.y + h.h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
  grad.addColorStop(0, '#ffd27a');
  grad.addColorStop(0.14, '#ff8b3d');
  grad.addColorStop(0.45, '#c22d22');
  grad.addColorStop(1, '#3d0507');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createLinearGradient(0, h.y - 26, 0, h.y + 22);
  glow.addColorStop(0, 'rgba(255,120,40,0)');
  glow.addColorStop(0.6, 'rgba(255,130,50,0.42)');
  glow.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(h.x, h.y - 26, h.w, 48);
  ctx.strokeStyle = 'rgba(255,224,170,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let x = h.x; x <= h.x + h.w; x += 12) {
    const y = topY + Math.sin(t * 2.1 + x * 0.025) * 3.2;
    if (x === h.x) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // bubbles
  for (let i = 0; i < Math.min(12, Math.floor(h.w / 34)); i++) {
    const x = h.x + hash(i * 3 + h.x) * h.w;
    const cycle = 1 + hash(i * 7) * 2.4;
    const ph = ((t * 0.7 + hash(i)) % 1);
    const y = h.y + h.h * 0.55 - ph * (h.h * 0.4);
    const r = 1.5 + hash(i * 11) * 3;
    ctx.fillStyle = `rgba(255,${150 + Math.floor(hash(i) * 80)},70,${(1 - ph) * 0.65})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    void cycle;
  }
  ctx.restore();
}

function drawSpikes(ctx, h, pal, t) {
  ctx.save();
  const spikeW = 16;
  const n = Math.max(1, Math.floor(h.w / spikeW));
  for (let i = 0; i < n; i++) {
    const x = h.x + i * (h.w / n);
    const w = h.w / n;
    const grad = ctx.createLinearGradient(0, h.y + h.h, 0, h.y);
    grad.addColorStop(0, pal.rockBody);
    grad.addColorStop(0.55, '#dfe9ec');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x + 1, h.y + h.h);
    ctx.lineTo(x + w / 2, h.y - 2);
    ctx.lineTo(x + w - 1, h.y + h.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.4);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, h.y - 2);
    ctx.lineTo(x + w / 2 + 2, h.y + 8);
    ctx.lineTo(x + w / 2 - 1.5, h.y + 8);
    ctx.closePath();
    ctx.fill();
  }
  const glow = ctx.createRadialGradient(h.x + h.w / 2, h.y, 2, h.x + h.w / 2, h.y, h.w * 0.6);
  glow.addColorStop(0, rgba(pal.accent, 0.18));
  glow.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(h.x - 30, h.y - 20, h.w + 60, 40);
  ctx.restore();
  void t;
}

/* ---------------------------------------------------------
   bridges, plates, checkpoints
   --------------------------------------------------------- */
function drawBridges(ctx, game, pal, t) {
  for (const b of game.world.bridges) {
    const visible = b.anim > 0.02;
    ctx.save();
    // anchors
    for (const x of [b.x - 4, b.x + b.w + 4]) {
      ctx.fillStyle = rgba(pal.accent, 0.24 + b.anim * 0.4);
      rr(ctx, x - 4, b.y - 8, 8, 20, 3);
      ctx.fill();
      ctx.fillStyle = rgba(pal.accent, 0.8 * b.anim);
      ctx.beginPath();
      ctx.arc(x, b.y + 2, 2.6, 0, TAU);
      ctx.fill();
    }
    if (visible) {
      ctx.globalAlpha = Math.min(1, b.anim * 1.3);
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createLinearGradient(0, b.y - 4, 0, b.y + b.h + 8);
      grad.addColorStop(0, rgba(pal.accent, 0));
      grad.addColorStop(0.5, rgba(pal.accent, 0.7));
      grad.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y - 4, b.w, b.h + 10);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.h / 2);
      ctx.lineTo(b.x + b.w, b.y + b.h / 2);
      ctx.stroke();
      ctx.strokeStyle = rgba(pal.accent, 0.65);
      ctx.lineWidth = 1;
      const step = 26;
      const shift = (t * 30) % step;
      for (let x = b.x + shift; x < b.x + b.w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x - 6, b.y + b.h / 2 + 5);
        ctx.lineTo(x, b.y + b.h / 2);
        ctx.lineTo(x - 6, b.y + b.h / 2 - 5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawPlates(ctx, game, pal, t) {
  for (const p of game.world.plates) {
    ctx.save();
    const glow = p.glow || 0;
    ctx.fillStyle = rgba(pal.accent, 0.12 + glow * 0.25);
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + 2, p.w * 0.62, 10, 0, 0, TAU);
    ctx.fill();
    // base
    const grad = ctx.createLinearGradient(0, p.y - 12, 0, p.y + 6);
    grad.addColorStop(0, pal.rockTop);
    grad.addColorStop(1, pal.rockDeep);
    ctx.fillStyle = grad;
    rr(ctx, p.x, p.y - 10, p.w, 14, 4);
    ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.36 + glow * 0.5);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // glyph
    const cx = p.x + p.w / 2;
    const cy = p.y - 3;
    ctx.strokeStyle = rgba(pal.accent, 0.55 + glow * 0.45);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 3.5, cy);
    ctx.lineTo(cx + 3.5, cy);
    ctx.moveTo(cx, cy - 3.5);
    ctx.lineTo(cx, cy + 3.5);
    ctx.stroke();
    if (glow > 0.05) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 40);
      g.addColorStop(0, rgba(pal.accent, 0.4 * glow));
      g.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - 40, cy - 40, 80, 80);
      for (let i = 0; i < 3; i++) {
        const a = t * 1.2 + (i * TAU) / 3;
        ctx.fillStyle = rgba(pal.accent, 0.8);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 13, cy + Math.sin(a) * 5 - 10 - Math.sin(t * 2 + i) * 6, 1.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawCheckpoints(ctx, game, pal, t) {
  for (const c of game.world.checkpoints) {
    ctx.save();
    const active = c.active;
    const glow = active ? 1 : 0.25 + Math.sin(t * 2.4 + c.x) * 0.08;
    // base
    const grad = ctx.createLinearGradient(0, c.y - 48, 0, c.y);
    grad.addColorStop(0, pal.rockTop);
    grad.addColorStop(1, pal.rockDeep);
    ctx.fillStyle = grad;
    rr(ctx, c.x - 7, c.y - 42, 14, 42, 4);
    ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.3 + glow * 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
    // floating crystal
    const by = c.y - 58 + Math.sin(t * 1.8 + c.x) * 3;
    ctx.save();
    ctx.translate(c.x, by);
    ctx.rotate(Math.sin(t * 0.8 + c.x) * 0.25 + Math.PI / 4);
    ctx.fillStyle = rgba(pal.accent, 0.62 + glow * 0.38);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(c.x, by, 1, c.x, by, active ? 76 : 30);
    g.addColorStop(0, rgba(pal.accent, 0.45 * glow));
    g.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(c.x - 80, by - 80, 160, 160);
    if (active) {
      const beam = ctx.createLinearGradient(0, by - 190, 0, c.y);
      beam.addColorStop(0, rgba(pal.accent, 0));
      beam.addColorStop(0.55, rgba(pal.accent, 0.2));
      beam.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = beam;
      ctx.fillRect(c.x - 5, by - 190, 10, 210);
    }
    ctx.restore();
  }
}

/* ---------------------------------------------------------
   portals
   --------------------------------------------------------- */
function drawPortal(ctx, game, p, pal, t, goal, near) {
  const cx = p.x;
  const baseY = p.y;
  const cy = baseY - (goal ? 84 : 56);
  const rx = goal ? 58 : 31;
  const ry = goal ? 82 : 49;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.1 + (p.pulse || 0));
  const n = near ? 1 : 0.72;
  const accent = goal ? (game.layer === 'light' ? '#ffe29a' : '#ffd36e') : pal.accent;
  const accent2 = goal ? '#ffffff' : pal.accent2;
  ctx.save();

  // floor glow
  ctx.globalCompositeOperation = 'lighter';
  const floor = ctx.createRadialGradient(cx, baseY + 2, 2, cx, baseY + 2, goal ? 120 : 66);
  floor.addColorStop(0, rgba(accent, 0.35 * n));
  floor.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, goal ? 120 : 66, goal ? 24 : 14, 0, 0, TAU);
  ctx.fill();

  // outer halo
  const halo = ctx.createRadialGradient(cx, cy, ry * 0.2, cx, cy, ry * 2.1);
  halo.addColorStop(0, rgba(accent, 0.24 * n));
  halo.addColorStop(0.55, rgba(accent2, 0.1 * n));
  halo.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(cx - ry * 2.2, cy - ry * 2.2, ry * 4.4, ry * 4.4);

  // goal arch
  if (goal) {
    ctx.globalCompositeOperation = 'source-over';
    const stone = ctx.createLinearGradient(0, cy - ry, 0, baseY);
    stone.addColorStop(0, '#cfd8e2');
    stone.addColorStop(0.5, '#6d7f95');
    stone.addColorStop(1, '#2a3446');
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.moveTo(cx - rx - 34, baseY);
    ctx.lineTo(cx - rx - 18, cy - ry * 0.9);
    ctx.quadraticCurveTo(cx, cy - ry * 1.6, cx + rx + 18, cy - ry * 0.9);
    ctx.lineTo(cx + rx + 34, baseY);
    ctx.lineTo(cx + rx + 18, baseY);
    ctx.quadraticCurveTo(cx, cy - ry * 1.2, cx - rx - 18, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      const x = cx + Math.cos(a) * (rx + 26);
      const y = cy - 14 + Math.sin(a) * (ry + 4);
      ctx.fillStyle = rgba(accent, 0.7);
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, TAU);
      ctx.fill();
    }
  }

  // inner void
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.clip();
  const voidGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, ry);
  voidGrad.addColorStop(0, 'rgba(255,255,255,0.96)');
  voidGrad.addColorStop(0.18, rgba(accent, 0.85));
  voidGrad.addColorStop(0.52, rgba(accent2, 0.42));
  voidGrad.addColorStop(0.82, 'rgba(6,4,18,0.9)');
  voidGrad.addColorStop(1, 'rgba(2,2,8,1)');
  ctx.fillStyle = voidGrad;
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  // vortex arms
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 2;
  for (let k = 0; k < 7; k++) {
    const off = k * 0.9 + t * 1.4;
    ctx.strokeStyle = rgba(k % 2 ? accent2 : accent, 0.28 + (k % 3) * 0.12);
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const q = i / 26;
      const ang = off + q * Math.PI * 2.5;
      const rad = q * Math.max(rx, ry) * 0.94;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * (ry / rx);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // center flare
  const core = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx * 0.35);
  core.addColorStop(0, 'rgba(255,255,255,0.95)');
  core.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = core;
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.restore();

  // rings
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const rrX = rx + 5 + i * 5 + Math.sin(t * 1.3 + i) * 1.5;
    const rrY = ry + 6 + i * 5;
    ctx.strokeStyle = rgba(i === 1 ? accent2 : accent, (0.75 - i * 0.19) * n);
    ctx.lineWidth = i === 0 ? 2 : 1.1;
    ctx.setLineDash([rrX * 0.9, rrX * 0.55]);
    ctx.lineDashOffset = -t * (24 + i * 13) * (i % 2 ? -1 : 1);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rrX, rrY, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // orbiting motes
  for (let i = 0; i < 9; i++) {
    const a = t * (0.8 + (i % 3) * 0.3) + (i * TAU) / 9;
    const rad = rx * (1.15 + (i % 2) * 0.3);
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad * (ry / rx);
    ctx.fillStyle = rgba(i % 2 ? accent2 : '#ffffff', 0.5 + pulse * 0.4);
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3) * 0.6, 0, TAU);
    ctx.fill();
  }

  // label beam
  if (near) {
    ctx.strokeStyle = rgba(accent, 0.28 + pulse * 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 20 + pulse * 5, ry + 22 + pulse * 6, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  void game;
}

/* ---------------------------------------------------------
   collectibles + enemies
   --------------------------------------------------------- */
function drawShard(ctx, s, pal, t) {
  const y = s.y + Math.sin(t * 2 + s.bob) * 4;
  ctx.save();
  ctx.translate(s.x, y);
  const spin = Math.sin(t * 1.6 + s.bob) * 0.9;
  ctx.rotate(spin);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 26);
  glow.addColorStop(0, rgba(pal.accent, 0.5));
  glow.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(-26, -26, 52, 52);
  ctx.globalCompositeOperation = 'source-over';
  const grad = ctx.createLinearGradient(0, -9, 0, 9);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, pal.accent);
  grad.addColorStop(1, pal.accent2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6.5, 0);
  ctx.lineTo(0, 9);
  ctx.lineTo(-6.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(2, 0);
  ctx.lineTo(0, 4);
  ctx.lineTo(-2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawKey(ctx, k, pal, t) {
  const y = k.y + Math.sin(t * 1.8 + k.bob) * 4;
  ctx.save();
  ctx.translate(k.x, y);
  ctx.rotate(-0.35 + Math.sin(t * 1.1 + k.bob) * 0.18);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 34);
  glow.addColorStop(0, 'rgba(255,226,154,0.62)');
  glow.addColorStop(1, 'rgba(255,226,154,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-34, -34, 68, 68);
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#ffe29a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(-8, 0, 5.5, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2.5, 0);
  ctx.lineTo(13, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(8, 5);
  ctx.moveTo(12, 0);
  ctx.lineTo(12, 4);
  ctx.stroke();
  ctx.fillStyle = '#fff4cf';
  ctx.beginPath();
  ctx.arc(-8, 0, 2, 0, TAU);
  ctx.fill();
  ctx.restore();
  void pal;
}

function drawEnemy(ctx, game, e, pal, t) {
  const x = e.curX;
  const y = e.curY;
  const dark = game.layer === 'dark';
  ctx.save();
  ctx.translate(x, y);
  // tendrils
  ctx.strokeStyle = rgba(pal.accent, 0.34);
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 5, 10);
    ctx.quadraticCurveTo(i * 10 + Math.sin(t * 3 + i) * 4, 24, i * 7 + Math.sin(t * 2 + i) * 6, 34);
    ctx.stroke();
  }
  // glow
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  glow.addColorStop(0, rgba(pal.accent, 0.35));
  glow.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(-34, -34, 68, 68);
  ctx.globalCompositeOperation = 'source-over';
  // body
  const grad = ctx.createRadialGradient(-4, -5, 2, 0, 0, 16);
  grad.addColorStop(0, dark ? '#5a2352' : '#1f4c4a');
  grad.addColorStop(1, '#07040e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(pal.accent, 0.5);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // orbiting shards
  for (let i = 0; i < 3; i++) {
    const a = t * 1.4 + (i * TAU) / 3;
    const ox = Math.cos(a) * 19;
    const oy = Math.sin(a) * 12;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(a);
    ctx.fillStyle = rgba(pal.accent, 0.8);
    ctx.beginPath();
    ctx.moveTo(0, -3.5);
    ctx.lineTo(2.4, 0);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-2.4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // eye
  const dx = game.player ? clamp(game.player.x - x, -10, 10) : 0;
  const dy = game.player ? clamp(game.player.y - y, -8, 8) : 0;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(dx * 0.25, dy * 0.25, 6, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = dark ? '#ff4fbf' : '#ff8d5c';
  ctx.beginPath();
  ctx.arc(dx * 0.18, dy * 0.18, 2.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ---------------------------------------------------------
   player
   --------------------------------------------------------- */
function drawPlayer(ctx, game, pal, t) {
  const P = game.player;
  if (!P) return;
  const cx = P.x + P.w / 2;
  const feet = P.y + P.h;
  const dark = game.layer === 'dark';
  const accent = pal.accent;
  const accent2 = pal.accent2;

  // shadow
  let groundY = null;
  for (const s of game.solids) {
    if (cx < s.x - 4 || cx > s.x + s.w + 4) continue;
    if (s.y < feet - 8) continue;
    if (s.y - feet > 280) continue;
    if (groundY === null || s.y < groundY) groundY = s.y;
  }
  if (groundY !== null) {
    const d = clamp(1 - (groundY - feet) / 300, 0.15, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.28 * d})`;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 1.5, 16 * d, 4.6 * d, 0, 0, TAU);
    ctx.fill();
  }

  // dash afterimages
  for (const g of game.ghosts) {
    const a = clamp(g.life / g.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = a * 0.35;
    ctx.translate(g.x + PLAYER_HALF_W, g.y + P.h / 2);
    ctx.scale(g.facing, 1);
    ctx.fillStyle = rgba(accent, 0.8);
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.quadraticCurveTo(-14, 2, -4, 20);
    ctx.lineTo(7, 18);
    ctx.quadraticCurveTo(10, -2, 5, -19);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // scarf ribbon (world space)
  if (P.scarf.length > 2) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(accent, 0.5);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < P.scarf.length; i++) {
      const s = P.scarf[i];
      const wave = Math.sin(t * 9 + i * 0.7) * (i / P.scarf.length) * 4;
      if (i === 0) ctx.moveTo(s.x, s.y + wave);
      else ctx.lineTo(s.x, s.y + wave);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, feet);
  if (P.invuln > 0 && Math.floor(t * 18) % 2 === 0 && !game.dying) ctx.globalAlpha = 0.55;
  const lean = clamp(P.vx / RUN_SPEED, -1, 1) * 0.08;
  ctx.rotate(lean);
  ctx.scale(P.facing, 1);
  const dashing = P.dashTime > 0;
  const run = P.onGround ? Math.sin(P.walkPhase * 2) : 0;
  const bob = P.onGround ? Math.abs(Math.sin(P.walkPhase * 2)) * 1.4 : 0;
  const hipY = -18 + bob * 0.4;
  const shoulderY = -33 + bob * 0.5;
  const headY = -39 + bob * 0.55;

  // cape behind
  const capeWave = Math.sin(t * 7 + P.walkPhase) * 2.2 + clamp(-P.vx * P.facing * 0.012, -4, 6);
  const cape = ctx.createLinearGradient(-4, shoulderY, -20, -4);
  cape.addColorStop(0, dark ? '#7a2d75' : '#1c8c85');
  cape.addColorStop(0.6, dark ? '#4b1a55' : '#125c60');
  cape.addColorStop(1, dark ? '#1a0722' : '#062a2e');
  ctx.fillStyle = cape;
  ctx.beginPath();
  ctx.moveTo(2, shoulderY + 2);
  ctx.quadraticCurveTo(-12, shoulderY + 6, -17 - capeWave, hipY + 2);
  ctx.quadraticCurveTo(-22, -4, -10, feet - 5);
  ctx.lineTo(3, feet - 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.22);
  ctx.lineWidth = 1;
  ctx.stroke();

  // back arm
  ctx.strokeStyle = dark ? '#3a1c4d' : '#155057';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, shoulderY + 5);
  ctx.lineTo(-8 - run * 3, shoulderY + 14 + run * 2);
  ctx.stroke();

  // legs
  ctx.strokeStyle = dark ? '#2b1838' : '#0b3036';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  if (dashing) {
    ctx.beginPath();
    ctx.moveTo(-2, hipY);
    ctx.lineTo(9, hipY + 7);
    ctx.moveTo(2, hipY);
    ctx.lineTo(-9, hipY + 8);
    ctx.stroke();
  } else if (!P.onGround) {
    ctx.beginPath();
    ctx.moveTo(-2, hipY);
    ctx.quadraticCurveTo(-7, hipY + 9, -5, hipY + 16);
    ctx.moveTo(2, hipY);
    ctx.quadraticCurveTo(8, hipY + 6, 7, hipY + 14);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-2, hipY);
    ctx.lineTo(-2 + run * 7, hipY + 18);
    ctx.moveTo(2, hipY);
    ctx.lineTo(2 - run * 7, hipY + 18);
    ctx.stroke();
  }
  // boots
  ctx.strokeStyle = rgba(accent2, 0.7);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4 + run * 7, hipY + 18);
  ctx.lineTo(1 + run * 7, hipY + 18);
  ctx.moveTo(0 - run * 7, hipY + 18);
  ctx.lineTo(5 - run * 7, hipY + 18);
  ctx.stroke();

  // torso
  const torso = ctx.createLinearGradient(0, shoulderY, 0, hipY + 3);
  torso.addColorStop(0, dark ? '#efe6ff' : '#f6fffd');
  torso.addColorStop(0.35, dark ? '#cbb2e8' : '#d2fff7');
  torso.addColorStop(1, dark ? '#7a4ea0' : '#2d9b9a');
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-4, shoulderY);
  ctx.quadraticCurveTo(8, shoulderY + 1, 7, shoulderY + 8);
  ctx.quadraticCurveTo(7, hipY - 2, 4, hipY + 2);
  ctx.lineTo(-5, hipY + 2);
  ctx.quadraticCurveTo(-8, shoulderY + 9, -4, shoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.4);
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // chest sigil
  ctx.fillStyle = rgba(accent, 0.85);
  ctx.beginPath();
  ctx.arc(2.5, shoulderY + 8, 1.5, 0, TAU);
  ctx.fill();

  // front arm
  ctx.strokeStyle = dark ? '#e3d5f4' : '#e9fffb';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(4, shoulderY + 6);
  if (dashing) {
    ctx.lineTo(14, shoulderY + 7);
  } else {
    ctx.lineTo(7 - run * 4, shoulderY + 15);
  }
  ctx.stroke();

  // head / hood
  ctx.fillStyle = dark ? '#2d173f' : '#0b3239';
  ctx.beginPath();
  ctx.arc(1, headY, 8.2, 0, TAU);
  ctx.fill();
  const hood = ctx.createLinearGradient(0, headY - 8, 0, headY + 8);
  hood.addColorStop(0, dark ? '#f2e9ff' : '#faffff');
  hood.addColorStop(1, dark ? '#a986c9' : '#8fe0d5');
  ctx.fillStyle = hood;
  ctx.beginPath();
  ctx.arc(0, headY - 1, 7.4, Math.PI * 0.92, Math.PI * 2.08);
  ctx.quadraticCurveTo(8, headY + 4, 2, headY + 6);
  ctx.quadraticCurveTo(-7, headY + 4, -7, headY - 1);
  ctx.closePath();
  ctx.fill();
  // face
  ctx.fillStyle = '#0b1220';
  ctx.beginPath();
  ctx.ellipse(2.6, headY + 0.8, 3.8, 3, 0, 0, TAU);
  ctx.fill();
  // visor
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(4.2, headY + 0.5, 2.6, 1.1, -0.12, 0, TAU);
  ctx.fill();
  ctx.restore();
  // hood rim
  ctx.strokeStyle = rgba(accent, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, headY - 1, 7.4, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();

  // dash streak
  if (dashing) {
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createLinearGradient(-60, 0, 4, 0);
    grad.addColorStop(0, rgba(accent, 0));
    grad.addColorStop(1, rgba(accent, 0.55));
    ctx.fillStyle = grad;
    ctx.fillRect(-64, shoulderY + 4, 64, 26);
  }
  ctx.restore();

  // player name glyph? no
  void accent2;
}

/* ---------------------------------------------------------
   particles / floaters
   --------------------------------------------------------- */
function drawParticles(ctx, game, t) {
  for (const p of game.particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a;
    if (p.glow) ctx.globalCompositeOperation = 'lighter';
    if (p.shape === 'streak') {
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const len = 4 + p.size * 2.4;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(0.6, p.size * 0.7);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (p.vx / sp) * len, p.y - (p.vy / sp) * len);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.4, p.size * a), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  void t;
}

function drawFloaters(ctx, game) {
  for (const f of game.floaters) {
    const a = clamp(f.life / f.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '700 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 8;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

const PLAYER_HALF_W = 13;
const RUN_SPEED = 384;
