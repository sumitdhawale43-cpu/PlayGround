/* Hand-drawn reef life, wreckage and collectibles. */
import { TAU, clamp, rgba, mixColor, lerp } from './utils.js';
import { drawRuin } from './render-ruins.js';

export { drawRuin };

function localGlow(ctx, x, y, radius, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.42, rgba(color, alpha * 0.34));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
}

function localKelp(r, ctx, height, count, spread, phase, time, colorA, colorB, lean = 0, fg = false) {
  for (let i = 0; i < count; i++) {
    const bx = (i - (count - 1) / 2) * spread;
    const h = height * (0.68 + 0.32 * Math.abs(Math.sin(phase + i * 1.71)));
    const swayA = Math.sin(time * 0.55 + phase + i * 0.8) * (14 + h * 0.08);
    const swayB = Math.sin(time * 0.43 + phase * 1.7 + i * 1.3) * (20 + h * 0.1);
    ctx.beginPath();
    ctx.moveTo(bx, 6);
    ctx.bezierCurveTo(bx + swayA * 0.35 + lean * 20, -h * 0.33, bx + swayB * 0.6 + lean * 45, -h * 0.72, bx + swayB + lean * 55, -h);
    ctx.strokeStyle = rgba(colorA, fg ? 0.92 : 0.78);
    ctx.lineWidth = (2.6 + (i % 3) * 0.7) * (fg ? 1.2 : 1);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = rgba(colorB, fg ? 0.2 : 0.42);
    ctx.lineWidth = 1.1;
    ctx.stroke();

    const leaves = fg ? 2 : 4;
    for (let l = 0; l < leaves; l++) {
      const t = 0.26 + l * 0.17;
      const lx = bx + swayB * t * t + Math.sin(time * 0.8 + l + phase + i) * 4;
      const ly = -h * t;
      const dir = (l % 2 === 0 ? 1 : -1);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(dir * 1.05 + Math.sin(time * 0.7 + l + phase) * 0.2);
      ctx.beginPath();
      ctx.ellipse(dir * 9, 0, 13 - l * 1.1, 3.1, 0, 0, TAU);
      ctx.fillStyle = rgba(l % 2 ? colorB : colorA, fg ? 0.8 : 0.55);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------------ */
export function drawReef(r, obj, p = 1, fg = false) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(obj.x, obj.y, p);
  const scale = r.zoom * obj.scale * (fg ? 1.08 : 1);
  if (sx < -420 || sx > r.W + 420 || sy < -420 || sy > r.H + 460) return;
  const pal = r.palFor(obj.zone);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);

  // Cool shadow cast into the water.
  const shadow = ctx.createRadialGradient(0, 26, 10, 0, 26, 190);
  shadow.addColorStop(0, 'rgba(0,4,9,.3)');
  shadow.addColorStop(1, 'rgba(0,4,9,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.ellipse(0, 30, 190, 70, 0, 0, TAU); ctx.fill();

  // Rock lumps, back to front.
  for (let i = 0; i < obj.lumps.length; i++) {
    const l = obj.lumps[i];
    ctx.save();
    ctx.translate(l.dx, l.dy);
    ctx.rotate(l.rot);
    const top = mixColor(pal.rockTop, pal.rim, 0.08 + l.tone * 0.11);
    const bottom = mixColor(pal.rockBottom, '#000000', 0.14 + (1 - l.tone) * 0.2);
    const g = ctx.createLinearGradient(0, -l.ry, 0, l.ry);
    g.addColorStop(0, top);
    g.addColorStop(0.46, mixColor(pal.rockTop, pal.rockBottom, 0.55));
    g.addColorStop(1, bottom);
    r.blobPath(0, 0, l.rx, l.ry, obj.seed + i * 13.7, 20, 0.13);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(pal.rim, fg ? 0.05 : 0.1);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Weathering, crevices and a lit upper edge.
    ctx.save();
    r.blobPath(0, 0, l.rx, l.ry, obj.seed + i * 13.7, 20, 0.13);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,8,12,.25)';
    ctx.lineWidth = 1.2;
    for (let c = 0; c < 3; c++) {
      const cx = Math.sin(obj.seed + c * 4.1 + i) * l.rx * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, -l.ry * 0.7);
      ctx.quadraticCurveTo(cx + l.rx * 0.24, 0, cx - l.rx * 0.12, l.ry * 0.75);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(pal.rim, 0.11);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(-l.rx * 0.08, -l.ry * 0.42, l.rx * 0.76, l.ry * 0.55, -0.12, Math.PI * 1.06, Math.PI * 1.92);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // Moss and encrusting life.
  ctx.save();
  ctx.globalAlpha = fg ? 0.2 : 0.32;
  ctx.fillStyle = pal.kelp;
  r.blobPath(-30, 12, 96, 20, obj.seed + 2, 16, 0.16);
  ctx.fill();
  ctx.fillStyle = pal.coral[obj.seed % pal.coral.length];
  r.blobPath(62, 2, 36, 10, obj.seed + 8, 12, 0.14);
  ctx.fill();
  ctx.restore();

  // Living foliage.
  for (const plant of obj.plants) {
    const color = mixColor(pal.coral[plant.hue % pal.coral.length], pal.rim, 0.08);
    ctx.save();
    ctx.translate(plant.dx, plant.dy);
    if (plant.kind === 'kelp' || plant.kind === 'whip') {
      const h = (plant.kind === 'whip' ? 70 : 120) * plant.size;
      localKelp(r, ctx, h, 3 + Math.round(plant.size * 2), 13 * plant.size, plant.phase, r.time,
        mixColor(pal.kelp, '#000', 0.14), plant.kind === 'whip' ? color : pal.kelp, plant.lean, fg);
    } else if (plant.kind === 'fan') {
      drawFanLocal(ctx, color, plant.size, plant.phase, r.time, fg);
    } else if (plant.kind === 'branch') {
      drawBranchLocal(ctx, color, plant.size, plant.phase, r.time, fg);
    } else if (plant.kind === 'tube') {
      drawTubeLocal(ctx, color, plant.size, plant.phase, r.time, pal, fg, obj.zone);
    } else {
      drawAnemoneLocal(ctx, color, plant.size, plant.phase, r.time, fg);
    }
    ctx.restore();
  }

  // Cold bioluminescence on deep reefs.
  if (obj.zone === 'midnight' || obj.zone === 'abyss') {
    for (let i = 0; i < 7; i++) {
      const a = obj.seed + i * 2.3;
      const x = Math.sin(a) * 100;
      const y = Math.cos(a * 1.4) * 28 - 8;
      const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(r.time * 1.2 + a));
      localGlow(ctx, x, y, 12, pal.accent, 0.22 * pulse);
      ctx.fillStyle = rgba(pal.accent, 0.55 * pulse);
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawKelp(r, obj, p = 1, fg = false) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(obj.x, obj.y, p);
  if (sx < -260 || sx > r.W + 260 || sy < -400 || sy > r.H + 260) return;
  const pal = r.palFor(obj.zone);
  const scale = r.zoom * obj.scale * (fg ? 1.1 : 1);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);
  ctx.fillStyle = rgba(mixColor(pal.rockBottom, '#000', 0.35), 0.9);
  ctx.beginPath(); ctx.ellipse(0, 8, obj.spread * 1.4, 11, 0, 0, TAU); ctx.fill();
  localKelp(r, ctx, obj.height, obj.count, obj.spread, obj.phase, r.time,
    fg ? mixColor(pal.kelpDark, '#000', 0.45) : mixColor(pal.kelp, '#000', 0.24),
    fg ? 'rgba(80,160,140,1)' : mixColor(pal.kelp, pal.rim, 0.15), 0, fg);
  ctx.restore();
}

export function drawCoral(r, obj, p = 1) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(obj.x, obj.y, p);
  if (sx < -180 || sx > r.W + 180 || sy < -220 || sy > r.H + 180) return;
  const pal = r.palFor(obj.zone);
  const scale = r.zoom * obj.scale * 0.92;
  const color = mixColor(pal.coral[obj.hue % pal.coral.length], pal.rim, 0.06);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);
  ctx.fillStyle = rgba(pal.rockBottom, 0.55);
  ctx.beginPath(); ctx.ellipse(0, 4, 24, 6, 0, 0, TAU); ctx.fill();
  if (obj.style === 'fan') drawFanLocal(ctx, color, 1.1, obj.phase, r.time, false);
  else if (obj.style === 'branch') drawBranchLocal(ctx, color, 1.05, obj.phase, r.time, false);
  else if (obj.style === 'tube') drawTubeLocal(ctx, color, 1, obj.phase, r.time, pal, false, obj.zone);
  else drawBrainLocal(ctx, color, obj.phase, r.time);
  ctx.restore();
}

function drawFanLocal(ctx, color, size, phase, time, fg) {
  ctx.save();
  ctx.scale(size, size);
  const sway = Math.sin(time * 0.5 + phase) * 0.02;
  ctx.rotate(sway);
  ctx.strokeStyle = rgba(color, fg ? 0.45 : 0.78);
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, fg ? 0.5 : 0.82);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.8 + (i / 8) * Math.PI * 0.6;
    const len = 45 + (i % 3) * 12;
    ctx.lineWidth = 2.1 - (i % 3) * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.55, Math.cos(a) * len, Math.sin(a) * len - 6);
    ctx.stroke();
    // fan lattice
    for (let j = 1; j < 3; j++) {
      const t = j / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * len * t * 0.74, Math.sin(a) * len * t * 0.8);
      ctx.lineTo(Math.cos(a + 0.16) * len * t * 0.9, Math.sin(a + 0.16) * len * t * 0.9);
      ctx.strokeStyle = rgba(color, 0.35);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, -8); ctx.stroke();
  ctx.restore();
}

function drawBranchLocal(ctx, color, size, phase, time, fg) {
  ctx.save();
  ctx.scale(size, size);
  ctx.rotate(Math.sin(time * 0.45 + phase) * 0.015);
  const branch = (x, y, angle, len, width, depth) => {
    const nx = x + Math.cos(angle) * len;
    const ny = y + Math.sin(angle) * len;
    ctx.strokeStyle = rgba(depth > 1 ? mixColor(color, '#ffffff', 0.08) : mixColor(color, '#061820', 0.12), fg ? 0.6 : 0.88);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + nx) / 2 + Math.sin(phase + depth) * 5, (y + ny) / 2, nx, ny); ctx.stroke();
    if (depth > 0) {
      branch(nx, ny, angle - 0.44 - (depth % 2) * 0.12, len * 0.7, width * 0.65, depth - 1);
      branch(nx, ny, angle + 0.5, len * 0.66, width * 0.6, depth - 1);
    } else {
      ctx.fillStyle = rgba(color, 0.8);
      ctx.beginPath(); ctx.arc(nx, ny, 2.4, 0, TAU); ctx.fill();
    }
  };
  branch(0, 4, -Math.PI / 2, 24, 4.2, 3);
  branch(0, 4, -Math.PI / 2 - 0.45, 17, 3, 2);
  branch(0, 4, -Math.PI / 2 + 0.4, 18, 3, 2);
  ctx.restore();
}

function drawTubeLocal(ctx, color, size, phase, time, pal, fg, zoneId) {
  ctx.save();
  ctx.scale(size, size);
  const deep = zoneId === 'midnight' || zoneId === 'abyss';
  const count = 7;
  ctx.fillStyle = rgba(mixColor(color, '#031015', 0.55), fg ? 0.6 : 0.9);
  ctx.beginPath(); ctx.ellipse(0, 2, count * 3.9, 4, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 7.4;
    const h = 20 + ((i * 17 + 11) % 30) + Math.sin(time * 0.6 + phase + i) * 1.5;
    const w = 3 + (i % 3) * 0.4;
    const grad = ctx.createLinearGradient(x - w, 0, x + w, 0);
    grad.addColorStop(0, rgba(mixColor(color, '#04111b', 0.52), fg ? 0.55 : 0.94));
    grad.addColorStop(0.32, rgba(mixColor(color, '#ffffff', 0.16), fg ? 0.5 : 0.9));
    grad.addColorStop(0.72, rgba(color, fg ? 0.5 : 0.92));
    grad.addColorStop(1, rgba(mixColor(color, '#04111b', 0.46), fg ? 0.55 : 0.94));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w, 2);
    ctx.quadraticCurveTo(x - w * 1.06, -h * 0.55, x - w * 0.82, -h);
    ctx.lineTo(x + w * 0.82, -h);
    ctx.quadraticCurveTo(x + w * 1.06, -h * 0.55, x + w, 2);
    ctx.closePath();
    ctx.fill();
    // Dark throat and a lit lip.
    ctx.fillStyle = deep ? rgba('#031015', 0.85) : rgba(mixColor(color, '#04111b', 0.72), 0.9);
    ctx.beginPath(); ctx.ellipse(x, -h + 0.6, w * 0.82, 1.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = deep ? rgba(pal.accent, 0.75) : rgba(mixColor(color, '#ffffff', 0.55), 0.8);
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(x, -h + 0.6, w * 0.85, 1.6, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
    if (deep) localGlow(ctx, x, -h, 13, pal.accent, 0.3);
  }
  ctx.restore();
}

function drawAnemoneLocal(ctx, color, size, phase, time, fg) {
  ctx.save();
  ctx.scale(size, size);
  ctx.fillStyle = rgba(mixColor(color, '#061820', 0.2), 0.8);
  ctx.beginPath(); ctx.ellipse(0, 2, 18, 8, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * 0.92 + (i / 9) * Math.PI * 0.84;
    const len = 17 + Math.sin(i * 2.1) * 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.6, Math.cos(a) * len + Math.sin(time + phase + i) * 2.3, Math.sin(a) * len);
    ctx.strokeStyle = rgba(mixColor(color, '#fff', 0.16), fg ? 0.5 : 0.8);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(Math.cos(a) * len, Math.sin(a) * len, 1.6, 0, TAU);
    ctx.fillStyle = rgba(mixColor(color, '#fff', 0.55), 0.9);
    ctx.fill();
  }
  ctx.restore();
}

function drawBrainLocal(ctx, color, phase, time) {
  ctx.save();
  const grad = ctx.createRadialGradient(-8, -12, 2, 0, 0, 32);
  grad.addColorStop(0, rgba(mixColor(color, '#fff', 0.2), 0.9));
  grad.addColorStop(1, rgba(mixColor(color, '#04111b', 0.3), 0.9));
  ctx.fillStyle = grad;
  rBlob(ctx, 0, -8, 30, 22);
  ctx.fill();
  ctx.strokeStyle = rgba(mixColor(color, '#04111b', 0.5), 0.55);
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(-12 + i * 8, -10 + Math.sin(i + phase) * 3, 8, 0.3, Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

function rBlob(ctx, x, y, rx, ry) {
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    const n = 1 + Math.sin(i * 2.7) * 0.08;
    const px = x + Math.cos(a) * rx * n, py = y + Math.sin(a) * ry * n;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
export function drawVent(r, obj, p = 1) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(obj.x, obj.y, p);
  if (sx < -220 || sx > r.W + 220 || sy < -300 || sy > r.H + 200) return;
  const pal = r.palFor(obj.zone);
  const scale = r.zoom * obj.scale;
  const hot = obj.zone === 'abyss' ? mixColor('#ff965c', pal.accent, 0.28) : '#ff9457';
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);

  // Chimney stack.
  const g = ctx.createLinearGradient(-24, 0, 30, 0);
  g.addColorStop(0, '#061018');
  g.addColorStop(0.4, mixColor(pal.rockTop, '#000', 0.2));
  g.addColorStop(1, '#02080c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-38, 44);
  ctx.lineTo(-22, -64);
  ctx.lineTo(-10, -78);
  ctx.lineTo(4, -72);
  ctx.lineTo(11, -48);
  ctx.lineTo(25, 44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(pal.rim, 0.09);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Strata.
  ctx.strokeStyle = 'rgba(0,4,8,.32)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-30 + i * 2, -46 + i * 20);
    ctx.lineTo(14 + i, -40 + i * 19);
    ctx.stroke();
  }
  // Vent mouth.
  ctx.beginPath(); ctx.ellipse(-4, -75, 12, 5, -0.1, 0, TAU);
  ctx.fillStyle = '#180a05'; ctx.fill();
  localGlow(ctx, -3, -76, 42 + Math.sin(r.time * 1.7 + obj.seed) * 6, hot, 0.5);
  ctx.beginPath(); ctx.ellipse(-3, -76, 8, 2.4, 0, 0, TAU);
  ctx.fillStyle = rgba('#ffbf7a', 0.85); ctx.fill();

  // Rising black smoke / shimmer.
  for (let i = 0; i < 6; i++) {
    const t = (r.time * 0.16 + i / 6 + obj.seed * 0.001) % 1;
    const yy = -86 - t * 130;
    const xx = -3 + Math.sin(t * 7 + obj.seed + i) * (8 + t * 22);
    const rr = 5 + t * 19;
    ctx.globalAlpha = (1 - t) * 0.22;
    ctx.fillStyle = i % 3 === 0 ? hot : '#07131c';
    ctx.beginPath(); ctx.ellipse(xx, yy, rr * 1.3, rr, 0.2, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ------------------------------------------------------------------ */
export function drawBeacon(r, obj, p = 1) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(obj.x, obj.y, p);
  if (!r.visible(obj.x, obj.y, 200, p)) return;
  const bob = Math.sin(r.time * 1.2 + 1.5) * 3;
  ctx.save();
  ctx.translate(sx, sy + bob);
  ctx.scale(r.zoom, r.zoom);
  r.drawGlow(0, 0, '#7dffe9', 60, 0.3);
  ctx.strokeStyle = 'rgba(141,244,234,.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-26, -22); ctx.lineTo(26, -22); ctx.stroke();
  ctx.fillStyle = '#0a2c3a';
  r.roundRect(-16, -18, 32, 34, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(151,246,238,.55)'; ctx.stroke();
  ctx.fillStyle = '#5cf1de';
  ctx.beginPath(); ctx.arc(0, 2, 5, 0, TAU); ctx.fill();
  localGlow(ctx, 0, 2, 28, '#7dffe9', 0.5);
  ctx.strokeStyle = 'rgba(132,246,236,.3)';
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -45); ctx.stroke();
  ctx.fillStyle = '#ffcf7a';
  ctx.beginPath(); ctx.arc(0, -46, 2.5, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
export function drawChest(r, chest, game) {
  const ctx = r.ctx;
  const [rawX, rawY] = r.screen(chest.x, chest.y);
  const bob = Math.sin(game.time * 1.5 + chest.x * 0.01) * 3;
  const sx = rawX, sy = rawY + bob;
  if (sx < -120 || sx > r.W + 120 || sy < -150 || sy > r.H + 120) return;
  const tier = chest.tier || 1;
  const gold = tier >= 5 ? '#c7a2ff' : tier >= 4 ? '#9ff5e3' : '#ffd36f';
  const opened = chest.opened;

  r.drawGlow(sx, sy - 4, gold, 62 + tier * 6, opened ? 0.18 : 0.42);
  if (!opened) {
    for (let i = 0; i < 4; i++) {
      const a = game.time * 0.8 + i * 1.7 + chest.x;
      const px = sx + Math.cos(a) * (27 + i * 4);
      const py = sy - 8 + Math.sin(a * 1.3) * (13 + i * 2);
      ctx.fillStyle = rgba(gold, 0.42 + 0.28 * Math.sin(game.time * 2 + i));
      ctx.beginPath(); ctx.arc(px, py, 1.2 + (i % 2) * 0.7, 0, TAU); ctx.fill();
    }
  }

  // Sonar beam.
  if (!opened && chest.pingUntil > game.time) {
    const a = clamp((chest.pingUntil - game.time) / 6, 0, 1);
    const grad = ctx.createLinearGradient(sx, sy - 280, sx, sy);
    grad.addColorStop(0, rgba(gold, 0));
    grad.addColorStop(1, rgba(gold, 0.22 * a));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sx - 15, sy); ctx.lineTo(sx + 15, sy); ctx.lineTo(sx + 35, sy - 300); ctx.lineTo(sx - 35, sy - 300); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(gold, 0.3 * a);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sx, sy - 4, 24 + Math.sin(game.time * 3) * 4, 0, TAU); ctx.stroke();
  }

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(r.zoom, r.zoom);

  // Ledge.
  ctx.fillStyle = 'rgba(0,5,9,.42)';
  ctx.beginPath(); ctx.ellipse(0, 19, 44, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = mixColor(r.pal.rockTop, '#000', 0.15);
  r.blobPath(0, 15, 38, 10, chest.x, 10, 0.2);
  ctx.fill();

  // Chest box.
  const wood = ctx.createLinearGradient(0, -18, 0, 18);
  wood.addColorStop(0, tier >= 5 ? '#3b2a58' : '#3d2b1d');
  wood.addColorStop(0.55, tier >= 5 ? '#1e1530' : '#251a13');
  wood.addColorStop(1, '#0c0a0b');
  ctx.fillStyle = wood;
  r.roundRect(-28, -10, 56, 28, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Planks.
  ctx.strokeStyle = 'rgba(255,210,140,.09)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-24 + i * 14, -8); ctx.lineTo(-24 + i * 14, 16); ctx.stroke();
  }
  // Bands.
  ctx.fillStyle = rgba(gold, 0.72);
  ctx.fillRect(-31, -2, 62, 3.2);
  ctx.fillRect(-31, 10, 62, 2.4);
  // Lid.
  const lidY = opened ? -24 : -14;
  ctx.save();
  if (opened) {
    ctx.translate(-28, -10);
    ctx.rotate(-0.68);
    ctx.translate(28, 10);
  }
  const lid = ctx.createLinearGradient(0, -20, 0, 2);
  lid.addColorStop(0, tier >= 5 ? '#4a356b' : '#4b3421');
  lid.addColorStop(1, '#1a110c');
  ctx.fillStyle = lid;
  r.roundRect(-30, -22, 60, 18, 7);
  ctx.fill();
  ctx.strokeStyle = rgba(gold, 0.62);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = rgba(gold, 0.55);
  ctx.fillRect(-32, -12, 64, 2);
  ctx.restore();
  // Lock.
  if (!opened) {
    ctx.fillStyle = rgba(gold, 0.9);
    r.roundRect(-5, -4, 10, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#2a1b0d';
    ctx.beginPath(); ctx.arc(0, 1, 1.8, 0, TAU); ctx.fill();
  } else {
    // Glowing interior.
    const inner = ctx.createRadialGradient(0, -8, 0, 0, -8, 34);
    inner.addColorStop(0, rgba(gold, 0.85));
    inner.addColorStop(0.5, rgba(gold, 0.2));
    inner.addColorStop(1, rgba(gold, 0));
    ctx.fillStyle = inner;
    ctx.beginPath(); ctx.ellipse(0, -8, 34, 20, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe9ae';
    for (let i = 0; i < 5; i++) {
      const a = game.time * 1.4 + i * 1.9;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 14, -8 + Math.sin(a * 1.3) * 6, 1.4, 0, TAU); ctx.fill();
    }
  }
  // Tier gems on the front.
  if (tier >= 4) {
    ctx.fillStyle = rgba(gold, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, 3); ctx.lineTo(4, 7); ctx.lineTo(0, 11); ctx.lineTo(-4, 7); ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
export function drawResource(r, res, game) {
  const ctx = r.ctx;
  const bob = Math.sin(game.time * 2 + res.phase) * 4;
  const [sx, sy] = r.screen(res.x, res.y + bob);
  if (sx < -60 || sx > r.W + 60 || sy < -60 || sy > r.H + 60) return;
  const colors = {
    scrap: '#ffc46d', pearl: '#f5ecff', crystal: '#7ff7ee', oxygen: '#72e9ff', repair: '#9cf7a8',
  };
  const color = colors[res.type] || '#ffd36f';
  const scale = r.zoom;
  const pulse = 0.85 + 0.15 * Math.sin(game.time * 2.4 + res.phase);
  r.drawGlow(sx, sy, color, 34 * pulse, 0.34);
  if (res.pingUntil > game.time) {
    ctx.save();
    ctx.strokeStyle = rgba(color, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sx, sy, 22 + Math.sin(game.time * 3 + res.phase) * 3, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(Math.sin(game.time * 1.15 + res.phase) * 0.1);
  ctx.scale(scale, scale);

  if (res.type === 'scrap') {
    // A small cluster of recovered machinery.
    ctx.strokeStyle = 'rgba(43,21,7,.55)';
    ctx.fillStyle = 'rgba(255,188,84,.92)';
    ctx.lineWidth = 2;
    gear(ctx, -4, 2, 8.5, 8, game.time * 0.4 + res.phase);
    gear(ctx, 9, -6, 5.2, 6, -game.time * 0.55);
    ctx.fillStyle = 'rgba(255,231,169,.9)';
    ctx.beginPath(); ctx.arc(-4, 2, 2.6, 0, TAU); ctx.fill();
  } else if (res.type === 'pearl') {
    ctx.fillStyle = 'rgba(158,108,150,.7)';
    ctx.beginPath(); ctx.ellipse(0, 5, 15, 9, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,244,.55)'; ctx.lineWidth = 1; ctx.stroke();
    const pg = ctx.createRadialGradient(-3, -4, 1, 0, -3, 10);
    pg.addColorStop(0, '#ffffff');
    pg.addColorStop(0.54, '#fff2ff');
    pg.addColorStop(1, '#bca1d8');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(0, -3, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath(); ctx.arc(-3, -6, 2, 0, TAU); ctx.fill();
  } else if (res.type === 'crystal') {
    const shards = [[-8, 10, -2, -14], [1, 13, 7, -17], [10, 12, 12, -7]];
    for (let i = 0; i < shards.length; i++) {
      const [x1, y1, x2, y2] = shards[i];
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      const zc = r.palFor(res.zone).accent;
      g.addColorStop(0, rgba(mixColor(zc, '#ffffff', 0.4), 0.58));
      g.addColorStop(0.5, rgba(zc, 0.86));
      g.addColorStop(1, rgba(mixColor(zc, '#001018', 0.25), 0.95));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x1 - 3, y1 - 3); ctx.lineTo(x2, y2); ctx.lineTo(x2 + 4, y2 + 3); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = 0.7; ctx.stroke();
    }
  } else if (res.type === 'oxygen') {
    const orb = ctx.createRadialGradient(-4, -6, 1, 0, 0, 16);
    orb.addColorStop(0, 'rgba(235,255,255,.92)');
    orb.addColorStop(0.44, 'rgba(113,238,255,.4)');
    orb.addColorStop(1, 'rgba(20,114,146,.18)');
    ctx.fillStyle = orb;
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(178,251,255,.68)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath(); ctx.arc(-4, -5, 2.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(7, 6, 1.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-7, 7, 1, 0, TAU); ctx.fill();
  } else {
    // Repair kit.
    ctx.rotate(-0.06);
    const g = ctx.createLinearGradient(0, -12, 0, 13);
    g.addColorStop(0, '#d9fff0');
    g.addColorStop(0.3, '#6fdca8');
    g.addColorStop(1, '#1b7660');
    ctx.fillStyle = g;
    r.roundRect(-13, -10, 26, 21, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(3,36,35,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(4,46,42,.85)';
    ctx.fillRect(-4, -4, 8, 13);
    ctx.fillRect(-8, 0, 16, 5);
    ctx.strokeStyle = 'rgba(220,255,242,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-13, -2); ctx.lineTo(13, -2); ctx.stroke();
  }
  ctx.restore();
}

function gear(ctx, x, y, r1, teeth, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(phase);
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = i / (teeth * 2) * TAU;
    const rr = i % 2 === 0 ? r1 : r1 * 0.74;
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r1 * 0.32, 0, TAU);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
