import { rgba, mulberry32, roundRect, clamp } from '../utils.js';
import { RESOURCE_META } from '../world.js';

function visible(r, x, y, pad = 180) {
  return x > r.cam.x - r.viewW / 2 - pad && x < r.cam.x + r.viewW / 2 + pad
    && y > r.cam.y - r.viewH / 2 - pad && y < r.cam.y + r.viewH / 2 + pad;
}

const CORAL_COLORS = ['#ff8f6b', '#ffb36b', '#d678ff', '#63e9d2', '#ff6f9c', '#ffd36b'];

export function drawDecorations(r, game) {
  const { ctx, time } = r;
  for (const d of game.world.decorations) {
    if (!visible(r, d.x, d.y, 260)) continue;
    if (d.type === 'kelp') drawKelp(r, d, time);
    else if (d.type === 'coral') drawCoral(r, d, time);
    else if (d.type === 'fan') drawFan(r, d, time);
    else if (d.type === 'anemone') drawAnemone(r, d, time);
    else if (d.type === 'glowplant') drawGlowPlant(r, d, time);
    else if (d.type === 'tube') drawTubeWorms(r, d, time);
  }
}

function drawKelp(r, d, time) {
  const { ctx } = r;
  const sway = Math.sin(time * 0.55 + d.phase) * (16 + d.height * 0.05);
  ctx.save();
  ctx.translate(d.x, d.y);
  const blades = 3;
  for (let b = 0; b < blades; b++) {
    const h = d.height * (0.62 + b * 0.19) * d.scale;
    const offset = (b - 1) * 8 * d.scale;
    const localSway = sway * (0.7 + b * 0.16);
    const g = ctx.createLinearGradient(0, 0, localSway, -h);
    g.addColorStop(0, 'rgba(10, 56, 46, 0.85)');
    g.addColorStop(0.45, 'rgba(20, 92, 68, 0.8)');
    g.addColorStop(1, 'rgba(72, 150, 96, 0.65)');
    ctx.strokeStyle = g;
    ctx.lineWidth = (5.5 - b) * d.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.quadraticCurveTo(offset + localSway * 0.35, -h * 0.55, offset + localSway, -h);
    ctx.stroke();

    // Leaves.
    ctx.fillStyle = 'rgba(42, 117, 78, 0.55)';
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const lx = offset + localSway * t * t;
      const ly = -h * t;
      const side = i % 2 ? 1 : -1;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(side * (0.7 + Math.sin(time * 0.7 + i) * 0.15));
      ctx.beginPath();
      ctx.ellipse(side * 8 * d.scale, 0, 13 * d.scale, 4.5 * d.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function coralBranches(d) {
  if (d._branches) return d._branches;
  const rng = mulberry32(d.seed || 1);
  const branches = [];
  const count = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i - count / 2) * 0.34 + (rng() - 0.5) * 0.2;
    const len = (38 + rng() * 45) * d.scale;
    const branch = { x0: (rng() - 0.5) * 10, y0: 0, angle, len, children: [] };
    for (let c = 0; c < 2; c++) {
      branch.children.push({
        t: 0.45 + rng() * 0.4,
        angle: angle + (c ? 1 : -1) * (0.45 + rng() * 0.4),
        len: len * (0.35 + rng() * 0.3),
      });
    }
    branches.push(branch);
  }
  d._branches = branches;
  return branches;
}

function drawCoral(r, d, time) {
  const { ctx } = r;
  const color = CORAL_COLORS[Math.floor(d.hue * CORAL_COLORS.length)];
  const branches = coralBranches(d);
  const sway = Math.sin(time * 0.8 + d.phase) * 0.03;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(sway);
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.75;
  for (const b of branches) {
    const ex = b.x0 + Math.cos(b.angle) * b.len;
    const ey = b.y0 + Math.sin(b.angle) * b.len;
    ctx.lineWidth = 5.5 * d.scale;
    ctx.beginPath();
    ctx.moveTo(b.x0, b.y0);
    ctx.quadraticCurveTo(b.x0 + Math.cos(b.angle) * b.len * 0.4 + 4, b.y0 + Math.sin(b.angle) * b.len * 0.6, ex, ey);
    ctx.stroke();
    for (const c of b.children) {
      const cx = b.x0 + (ex - b.x0) * c.t;
      const cy = b.y0 + (ey - b.y0) * c.t;
      ctx.lineWidth = 3 * d.scale;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(c.angle) * c.len, cy + Math.sin(c.angle) * c.len);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const b of branches) {
    const ex = b.x0 + Math.cos(b.angle) * b.len;
    const ey = b.y0 + Math.sin(b.angle) * b.len;
    const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 9);
    glow.addColorStop(0, rgba(color, 0.45));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ex, ey, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFan(r, d, time) {
  const { ctx } = r;
  const color = CORAL_COLORS[Math.floor(d.hue * CORAL_COLORS.length)];
  const sway = Math.sin(time * 0.65 + d.phase) * 0.08;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(sway);
  const size = 46 * d.scale;
  ctx.fillStyle = rgba(color, 0.15);
  ctx.strokeStyle = rgba(color, 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, size, -Math.PI * 0.92, -Math.PI * 0.08);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * size * 0.94, Math.sin(a) * size * 0.94);
    ctx.stroke();
    for (let j = 1; j < 4; j++) {
      const t = j / 4;
      const x = Math.cos(a) * size * t;
      const y = Math.sin(a) * size * t;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a + 0.7) * 9, y + Math.sin(a + 0.7) * 9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAnemone(r, d, time) {
  const { ctx } = r;
  const color = CORAL_COLORS[Math.floor(d.hue * CORAL_COLORS.length)];
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const base = (i - 4) * 0.12;
    const sway = Math.sin(time * 1.3 + i * 1.7 + d.phase) * 0.35;
    const len = (26 + (i % 3) * 10) * d.scale;
    ctx.strokeStyle = rgba(color, 0.55);
    ctx.lineWidth = 2.4 * d.scale;
    ctx.beginPath();
    ctx.moveTo(base * 12, 0);
    ctx.quadraticCurveTo(base * 26 + sway * 8, -len * 0.55, base * 38 + sway * 14, -len);
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    const gx = base * 38 + sway * 14;
    const gy = -len;
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 6);
    glow.addColorStop(0, rgba(color, 0.5));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawGlowPlant(r, d, time) {
  const { ctx } = r;
  const color = d.zone === 'rift' ? '#ff8a4d' : d.hue > 0.5 ? '#7dffd6' : '#8f9bff';
  ctx.save();
  ctx.translate(d.x, d.y);
  for (let b = 0; b < 3; b++) {
    const h = d.height * (0.55 + b * 0.2);
    const sway = Math.sin(time * 0.7 + d.phase + b) * 10;
    ctx.strokeStyle = rgba(color, 0.42);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((b - 1) * 5, 0);
    ctx.quadraticCurveTo((b - 1) * 8 + sway * 0.4, -h * 0.55, (b - 1) * 10 + sway, -h);
    ctx.stroke();
    const gx = (b - 1) * 10 + sway;
    const gy = -h;
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 14);
    glow.addColorStop(0, rgba(color, 0.5));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx, gy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(color, 0.9);
    ctx.beginPath();
    ctx.arc(gx, gy, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawTubeWorms(r, d, time) {
  const { ctx } = r;
  ctx.save();
  ctx.translate(d.x, d.y);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 8 * d.scale;
    const h = d.height * (0.5 + (i % 3) * 0.22);
    const sway = Math.sin(time * 0.9 + i + d.phase) * 4;
    ctx.strokeStyle = 'rgba(110, 76, 72, 0.7)';
    ctx.lineWidth = 4.5 * d.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + sway, -h * 0.6, x + sway, -h);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 107, 92, 0.8)';
    ctx.beginPath();
    ctx.arc(x + sway, -h, 3.2 * d.scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Collectibles ──────────────────────────────────────────────────────
export function drawPickups(r, game) {
  const { ctx, time } = r;
  const nearest = game.nearestInteract;
  for (const node of game.world.nodes) {
    if (game.save.collectedNodes.includes(node.id)) continue;
    if (!visible(r, node.x, node.y, 120)) continue;
    const bob = Math.sin(time * 1.35 + node.phase) * 4;
    const active = nearest && nearest.id === node.id;
    drawNode(r, node, node.x, node.y + bob, active, time);
  }

  for (const chest of game.world.chests) {
    const opened = game.save.openedChests.includes(chest.id);
    if (!visible(r, chest.x, chest.y, 160)) continue;
    drawChest(r, chest, opened, nearest && nearest.id === chest.id, time);
  }

  for (const relic of game.world.relics) {
    if (game.save.relics.includes(relic.id)) continue;
    if (!visible(r, relic.x, relic.y, 260)) continue;
    drawRelic(r, relic, nearest && nearest.id === relic.id, time);
  }
}

function drawNode(r, node, x, y, active, time) {
  const { ctx } = r;
  const meta = RESOURCE_META[node.type] || RESOURCE_META.scrap;
  ctx.save();
  ctx.translate(x, y);

  // Ground / water glow.
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, active ? 62 : 44);
  glow.addColorStop(0, rgba(meta.glow, active ? 0.3 : 0.17));
  glow.addColorStop(1, rgba(meta.glow, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, active ? 62 : 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  if (active) {
    ctx.strokeStyle = rgba(meta.color, 0.6);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -time * 18;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (node.type === 'scrap') {
    ctx.rotate(Math.sin(time * 0.7 + node.phase) * 0.12);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(i * 1.1 + node.seed);
      ctx.fillStyle = i === 1 ? '#9fbac2' : '#c7dde2';
      ctx.strokeStyle = 'rgba(36, 62, 69, 0.7)';
      ctx.lineWidth = 1;
      roundRect(ctx, -12 + i * 5, -7 + (i % 2) * 7, 19, 10, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(24, 52, 60, 0.8)';
      ctx.beginPath();
      ctx.arc(-7 + i * 5, -2 + (i % 2) * 7, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (node.type === 'pearl') {
    ctx.fillStyle = '#c99d70';
    ctx.strokeStyle = 'rgba(255, 231, 193, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(-8, 4, 13, 9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(8, 4, 13, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    const pg = ctx.createRadialGradient(0, -2, 0, 0, -2, 13);
    pg.addColorStop(0, 'rgba(255, 249, 226, 0.95)');
    pg.addColorStop(0.5, 'rgba(255, 216, 165, 0.6)');
    pg.addColorStop(1, 'rgba(255, 216, 165, 0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, -2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff8e8';
    ctx.beginPath();
    ctx.arc(0, -2, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.type === 'crystal') {
    ctx.rotate(Math.sin(time * 0.6 + node.phase) * 0.2);
    const shards = [[0, -18, 7, 34], [-11, -8, 5, 24], [11, -10, 5, 26]];
    for (let i = 0; i < shards.length; i++) {
      const [sx, sy, w, h] = shards[i];
      const g = ctx.createLinearGradient(sx, sy, sx, sy + h);
      g.addColorStop(0, '#e8ffff');
      g.addColorStop(0.35, '#7eeaff');
      g.addColorStop(1, '#146b86');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + w, sy + h * 0.4);
      ctx.lineTo(sx + w * 0.35, sy + h);
      ctx.lineTo(sx - w * 0.5, sy + h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 255, 255, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'rgba(13, 50, 47, 0.9)';
    roundRect(ctx, -13, -13, 26, 26, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 255, 211, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#8dffd3';
    ctx.fillRect(-2.5, -8, 5, 16);
    ctx.fillRect(-8, -2.5, 16, 5);
  }
  ctx.restore();
}

function drawChest(r, chest, opened, active, time) {
  const { ctx } = r;
  ctx.save();
  ctx.translate(chest.x, chest.y);
  const scale = chest.special ? 1.25 : 1;
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0, 8, 12, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!opened) {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, active ? 82 : 56);
    glow.addColorStop(0, `rgba(255, 202, 122, ${active ? 0.28 : 0.13})`);
    glow.addColorStop(1, 'rgba(255, 202, 122, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, active ? 82 : 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  if (active) {
    ctx.strokeStyle = 'rgba(255, 219, 154, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -time * 18;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Chest body.
  const body = ctx.createLinearGradient(0, -6, 0, 26);
  body.addColorStop(0, opened ? '#3b2b21' : '#7a5230');
  body.addColorStop(1, opened ? '#1b1410' : '#3d2919');
  ctx.fillStyle = body;
  roundRect(ctx, -27, -2, 54, 27, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 24, 14, 0.8)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Metal bands.
  ctx.fillStyle = opened ? 'rgba(126, 106, 74, 0.5)' : '#c69c58';
  ctx.fillRect(-27, 5, 54, 4);
  ctx.fillRect(-27, 18, 54, 4);
  ctx.fillRect(-20, -2, 5, 27);
  ctx.fillRect(15, -2, 5, 27);

  // Lid.
  ctx.save();
  if (opened) {
    ctx.translate(0, -4);
    ctx.rotate(-0.55);
    ctx.translate(0, 4);
  }
  const lid = ctx.createLinearGradient(0, -20, 0, 0);
  lid.addColorStop(0, opened ? '#4d3726' : '#9b6a3b');
  lid.addColorStop(1, opened ? '#2a1d14' : '#553a21');
  ctx.fillStyle = lid;
  ctx.beginPath();
  ctx.moveTo(-27, -2);
  ctx.quadraticCurveTo(-24, -20, 0, -20);
  ctx.quadraticCurveTo(24, -20, 27, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(44, 27, 15, 0.8)';
  ctx.stroke();
  ctx.fillStyle = opened ? 'rgba(126, 106, 74, 0.5)' : '#c69c58';
  ctx.fillRect(-2, -18, 4, 17);
  ctx.restore();

  // Lock.
  if (!opened) {
    ctx.fillStyle = '#f0c26e';
    roundRect(ctx, -5, 2, 10, 11, 2);
    ctx.fill();
    ctx.fillStyle = '#5b3d1e';
    ctx.beginPath();
    ctx.arc(0, 7, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-0.8, 7, 1.6, 4);
  } else {
    ctx.globalCompositeOperation = 'lighter';
    const inner = ctx.createRadialGradient(0, 4, 0, 0, 4, 22);
    inner.addColorStop(0, 'rgba(255, 216, 140, 0.22)');
    inner.addColorStop(1, 'rgba(255, 216, 140, 0)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(0, 4, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparkles.
  if (!opened) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const a = time * 1.5 + i * 2.1 + chest.phase;
      const sx = Math.cos(a) * (22 + i * 5);
      const sy = Math.sin(a * 1.3) * (12 + i * 3) - 10;
      const alpha = 0.25 + Math.sin(a * 2) * 0.2;
      ctx.fillStyle = `rgba(255, 235, 180, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRelic(r, relic, active, time) {
  const { ctx } = r;
  const bob = Math.sin(time * 1.15 + relic.phase) * 7;
  ctx.save();
  ctx.translate(relic.x, relic.y + bob);

  // Beacon.
  ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(0, 0, 0, -520);
  beam.addColorStop(0, 'rgba(255, 208, 122, 0.2)');
  beam.addColorStop(0.5, 'rgba(255, 208, 122, 0.05)');
  beam.addColorStop(1, 'rgba(255, 208, 122, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(-7, -520);
  ctx.lineTo(10, -520);
  ctx.lineTo(28, 0);
  ctx.closePath();
  ctx.fill();

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, active ? 150 : 110);
  glow.addColorStop(0, 'rgba(255, 240, 198, 0.4)');
  glow.addColorStop(0.28, 'rgba(255, 202, 122, 0.18)');
  glow.addColorStop(1, 'rgba(255, 202, 122, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, active ? 150 : 110, 0, Math.PI * 2);
  ctx.fill();

  // Orbits.
  ctx.strokeStyle = 'rgba(255, 222, 158, 0.4)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const a = time * (0.25 + i * 0.08) + i * 2.1;
    const rr = 48 + i * 13;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.33, a, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.rotate(Math.sin(time * 0.5 + relic.phase) * 0.12);
  const shard = ctx.createLinearGradient(-18, -34, 18, 34);
  shard.addColorStop(0, '#fff9e5');
  shard.addColorStop(0.4, '#ffe2a4');
  shard.addColorStop(0.7, '#d9994f');
  shard.addColorStop(1, '#6c3c1c');
  ctx.fillStyle = shard;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(19, -12);
  ctx.lineTo(10, 33);
  ctx.lineTo(-10, 33);
  ctx.lineTo(-19, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 246, 220, 0.65)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Inner glyph.
  ctx.strokeStyle = 'rgba(72, 34, 14, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, 20);
  ctx.moveTo(-8, -8);
  ctx.lineTo(8, -8);
  ctx.moveTo(-7, 8);
  ctx.lineTo(7, 8);
  ctx.stroke();

  // Gold frame.
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -2, 31, 0.35, Math.PI * 1.65);
  ctx.stroke();

  if (active) {
    ctx.strokeStyle = 'rgba(255, 230, 178, 0.65)';
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -time * 20;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
