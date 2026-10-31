import { TAU, clamp, rgba, shadeHex, dist } from './util.js';
import { glyphForKind } from './memory.js';
import { TOOLS } from './config.js';

const rid = (seed, i = 0) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function shadow(ctx, x, y, rx, ry, a = 0.26) {
  ctx.fillStyle = `rgba(4, 8, 6, ${a})`;
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.22, y + ry * 0.36, rx, ry, 0, 0, TAU);
  ctx.fill();
}

/* ============================================================
   PROPS
   ============================================================ */
export function drawProp(ctx, p, t) {
  if (p.done) {
    if (p.kind === 'pine' || p.kind === 'oak' || p.kind === 'dead') return drawStump(ctx, p);
    if (p.kind === 'rock') return drawRubble(ctx, p);
    return;
  }
  switch (p.kind) {
    case 'pine': return drawPine(ctx, p, t);
    case 'oak': return drawOak(ctx, p, t);
    case 'dead': return drawDeadTree(ctx, p, t);
    case 'rock': return drawRock(ctx, p);
    case 'bush': return drawBush(ctx, p, t);
    case 'reed': return drawReed(ctx, p, t);
    case 'flower': return drawFlower(ctx, p);
    case 'mushroom': return drawMushroom(ctx, p);
    case 'stump': return drawStump(ctx, p);
    case 'bone': return drawBone(ctx, p);
    case 'log': return drawLog(ctx, p);
    case 'crate': return drawCrate(ctx, p);
    case 'barrel': return drawBarrel(ctx, p);
    case 'garden': return drawGarden(ctx, p);
    case 'banner': return drawBanner(ctx, p, t);
    case 'lantern': return drawLantern(ctx, p, t);
    case 'sign': return drawSign(ctx, p);
    case 'ruinPillar': return drawPillar(ctx, p);
    case 'ruinWall': return drawRuinWall(ctx, p);
    case 'standingStone': return drawStandingStone(ctx, p, t);
    case 'cache': return drawCache(ctx, p);
    default: return null;
  }
}

function drawPine(ctx, p, t) {
  const s = p.s;
  const sway = Math.sin(t * 0.9 + p.seed) * 1.6;
  shadow(ctx, p.x, p.y, 17 * s, 6.5 * s);
  ctx.fillStyle = '#3c3327';
  ctx.fillRect(p.x - 2.2 * s, p.y - 20 * s, 4.4 * s, 20 * s);
  const layers = [
    { y: -12, w: 24, h: 30, c: '#2c3c2a' },
    { y: -30, w: 19, h: 28, c: '#33452f' },
    { y: -48, w: 13, h: 24, c: '#3b4e34' }
  ];
  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    const x = p.x + sway * (0.4 + i * 0.4);
    const baseY = p.y + L.y * s;
    ctx.fillStyle = L.c;
    ctx.beginPath();
    ctx.moveTo(x, baseY - L.h * s);
    ctx.lineTo(x - L.w * s, baseY);
    ctx.quadraticCurveTo(x, baseY + 4 * s, x + L.w * s, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(190, 208, 150, 0.07)';
    ctx.beginPath();
    ctx.moveTo(x, baseY - L.h * s);
    ctx.lineTo(x - L.w * 0.55 * s, baseY - 2 * s);
    ctx.lineTo(x - L.w * 0.1 * s, baseY - 2 * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawOak(ctx, p, t) {
  const s = p.s;
  const sway = Math.sin(t * 0.7 + p.seed) * 1.2;
  shadow(ctx, p.x, p.y, 23 * s, 8 * s);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(p.x - 2.8 * s, p.y - 26 * s, 5.6 * s, 26 * s);
  ctx.strokeStyle = '#4a3a28';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 20 * s);
  ctx.lineTo(p.x - 8 * s + sway * 0.3, p.y - 34 * s);
  ctx.moveTo(p.x, p.y - 22 * s);
  ctx.lineTo(p.x + 9 * s + sway * 0.3, p.y - 36 * s);
  ctx.stroke();

  const blobs = [
    [-13, -44, 15, '#44532f'],
    [12, -46, 16, '#4a5a34'],
    [0, -55, 18, '#526238'],
    [-4, -36, 16, '#4d5c33'],
    [6, -34, 14, '#42512e']
  ];
  for (const [bx, by, br, col] of blobs) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x + bx * s + sway, p.y + by * s, br * s, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(200, 215, 150, 0.1)';
  ctx.beginPath();
  ctx.arc(p.x - 7 * s + sway, p.y - 50 * s, 9 * s, 0, TAU);
  ctx.fill();
}

function drawDeadTree(ctx, p, t) {
  const s = p.s;
  const sway = Math.sin(t * 0.6 + p.seed) * 1.2;
  shadow(ctx, p.x, p.y, 11 * s, 4 * s, 0.22);
  ctx.strokeStyle = '#6a5f50';
  ctx.lineWidth = 3.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + sway * 0.4, p.y - 40 * s);
  ctx.moveTo(p.x + sway * 0.2, p.y - 24 * s);
  ctx.lineTo(p.x - 14 * s, p.y - 38 * s);
  ctx.moveTo(p.x + sway * 0.3, p.y - 30 * s);
  ctx.lineTo(p.x + 13 * s, p.y - 48 * s);
  ctx.moveTo(p.x - 6 * s, p.y - 32 * s);
  ctx.lineTo(p.x - 17 * s, p.y - 52 * s);
  ctx.stroke();
  ctx.lineWidth = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(p.x - 14 * s, p.y - 38 * s);
  ctx.lineTo(p.x - 20 * s, p.y - 45 * s);
  ctx.moveTo(p.x + 13 * s, p.y - 48 * s);
  ctx.lineTo(p.x + 19 * s, p.y - 55 * s);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawRock(ctx, p) {
  const s = p.s;
  const n = 7;
  shadow(ctx, p.x, p.y, 17 * s, 6 * s, 0.24);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = (12 + rid(p.seed, i) * 8) * s;
    const x = p.x + Math.cos(a) * rr;
    const y = p.y - 4 * s + Math.sin(a) * rr * 0.72;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#666860';
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * 0.85 + i * 0.38;
    const x = p.x + Math.cos(a) * 12 * s;
    const y = p.y - 8 * s + Math.sin(a) * 11 * s;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(210, 212, 196, 0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(80, 88, 62, 0.35)';
  ctx.beginPath();
  ctx.arc(p.x - 6 * s, p.y + 2 * s, 4 * s, 0, TAU);
  ctx.fill();
}

function drawBush(ctx, p) {
  const s = p.s;
  shadow(ctx, p.x, p.y, 13 * s, 5 * s, 0.2);
  ctx.fillStyle = '#42512f';
  ctx.beginPath();
  ctx.arc(p.x - 6 * s, p.y - 8 * s, 9 * s, 0, TAU);
  ctx.arc(p.x + 5 * s, p.y - 9 * s, 10 * s, 0, TAU);
  ctx.arc(p.x, p.y - 15 * s, 8 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(170, 196, 120, 0.14)';
  ctx.beginPath();
  ctx.arc(p.x - 4 * s, p.y - 17 * s, 5 * s, 0, TAU);
  ctx.fill();
  if (!p.harvested) {
    for (let i = 0; i < (p.berries || 2); i++) {
      const a = rid(p.seed, i) * TAU;
      const r = 4 + rid(p.seed, i + 4) * 8;
      ctx.fillStyle = '#a45b3f';
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * r * s, p.y - 11 * s + Math.sin(a) * r * 0.6 * s, 1.8 * s, 0, TAU);
      ctx.fill();
    }
  }
}

function drawReed(ctx, p, t) {
  const s = p.s;
  const sway = Math.sin(t * 1.3 + p.seed) * 4;
  ctx.strokeStyle = '#6f7c4b';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const off = (i - 2) * 3.2 * s;
    ctx.beginPath();
    ctx.moveTo(p.x + off, p.y);
    ctx.quadraticCurveTo(p.x + off + sway * 0.3, p.y - 18 * s, p.x + off + sway, p.y - 28 * s - i * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a7c4e';
  ctx.beginPath();
  ctx.ellipse(p.x + sway, p.y - 29 * s, 1.6, 4, 0.3, 0, TAU);
  ctx.fill();
}

function drawFlower(ctx, p) {
  const s = p.s;
  ctx.strokeStyle = '#5f6c41';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + 1 * s, p.y - 8 * s);
  ctx.stroke();
  ctx.fillStyle = p.hue || '#d8b46a';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(a) * 2.2 * s, p.y - 9 * s + Math.sin(a) * 2.2 * s, 1.6 * s, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#efe6c8';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 9 * s, 1.2 * s, 0, TAU);
  ctx.fill();
}

function drawMushroom(ctx, p) {
  const s = p.s;
  ctx.fillStyle = '#d6cdb2';
  ctx.fillRect(p.x - 1, p.y - 6 * s, 2, 6 * s);
  ctx.fillStyle = '#9c5f44';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 7 * s, 4.5 * s, 3 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(233, 225, 207, 0.5)';
  ctx.beginPath();
  ctx.arc(p.x - 1.5 * s, p.y - 8 * s, 0.8 * s, 0, TAU);
  ctx.fill();
}

function drawStump(ctx, p) {
  const s = p.s;
  shadow(ctx, p.x, p.y, 9 * s, 4 * s, 0.2);
  ctx.fillStyle = '#51402c';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 3 * s, 9 * s, 6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 180, 140, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 3 * s, (9 - i * 2.5) * s, (6 - i * 1.6) * s, 0, 0, TAU);
    ctx.stroke();
  }
}

function drawBone(ctx, p) {
  const s = p.s;
  ctx.strokeStyle = '#c9c2aa';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  const a = rid(p.seed, 1) * TAU;
  ctx.beginPath();
  ctx.moveTo(p.x - Math.cos(a) * 7 * s, p.y - Math.sin(a) * 4 * s);
  ctx.lineTo(p.x + Math.cos(a) * 7 * s, p.y + Math.sin(a) * 4 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(a) * 7 * s, p.y - Math.sin(a) * 4 * s, 1.8, 0, TAU);
  ctx.arc(p.x + Math.cos(a) * 7 * s, p.y + Math.sin(a) * 4 * s, 1.8, 0, TAU);
  ctx.fillStyle = '#c9c2aa';
  ctx.fill();
  ctx.lineCap = 'butt';
}

function drawLog(ctx, p) {
  const s = p.s;
  const a = rid(p.seed, 2) * TAU;
  shadow(ctx, p.x, p.y, 13 * s, 5 * s, 0.18);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(a);
  ctx.fillStyle = '#4f3f2b';
  ctx.beginPath();
  ctx.roundRect(-12 * s, -4.5 * s, 24 * s, 9 * s, 4 * s);
  ctx.fill();
  ctx.fillStyle = '#6d5638';
  ctx.beginPath();
  ctx.ellipse(12 * s, 0, 3.6 * s, 4.5 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(12 * s, 0, 2 * s, 2.6 * s, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawCrate(ctx, p) {
  shadow(ctx, p.x, p.y, 11, 4, 0.22);
  ctx.fillStyle = '#6a5233';
  ctx.fillRect(p.x - 9, p.y - 20, 18, 20);
  ctx.strokeStyle = '#3c2c1a';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(p.x - 9, p.y - 20, 18, 20);
  ctx.beginPath();
  ctx.moveTo(p.x - 9, p.y - 20);
  ctx.lineTo(p.x + 9, p.y);
  ctx.moveTo(p.x + 9, p.y - 20);
  ctx.lineTo(p.x - 9, p.y);
  ctx.stroke();
  ctx.fillStyle = '#b9b09a';
  ctx.fillRect(p.x - 3, p.y - 12, 6, 2);
}

function drawBarrel(ctx, p) {
  shadow(ctx, p.x, p.y, 9, 3, 0.2);
  ctx.fillStyle = '#5e472c';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 10, 8, 10, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#2f2519';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 15, 8, 2.6, 0, 0, TAU);
  ctx.moveTo(p.x - 8, p.y - 7);
  ctx.lineTo(p.x + 8, p.y - 7);
  ctx.stroke();
}

function drawGarden(ctx, p) {
  const a = p.angle || 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(a);
  ctx.fillStyle = '#57462f';
  ctx.beginPath();
  ctx.roundRect(-30, -18, 60, 36, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 32, 20, 0.5)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-26, i * 10);
    ctx.lineTo(26, i * 10);
    ctx.stroke();
  }
  if (!p.stolen) {
    for (let r = -1; r <= 1; r++) {
      for (let c = -2; c <= 2; c++) {
        ctx.fillStyle = (c + r) % 2 ? '#6f8047' : '#7d8d50';
        ctx.beginPath();
        ctx.arc(c * 10, r * 10 - 2, 3.2, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawBanner(ctx, p, t) {
  const s = p.s;
  const wave = Math.sin(t * 2 + p.seed) * 3;
  shadow(ctx, p.x, p.y, 5, 2, 0.18);
  ctx.strokeStyle = '#4c3a25';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - 52 * s);
  ctx.stroke();
  ctx.fillStyle = p.hue || '#7c3f2e';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 50 * s);
  ctx.quadraticCurveTo(p.x + 20 * s + wave, p.y - 44 * s, p.x + 24 * s + wave, p.y - 36 * s);
  ctx.lineTo(p.x + 12 * s, p.y - 32 * s);
  ctx.lineTo(p.x, p.y - 38 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(233, 225, 207, 0.35)';
  ctx.beginPath();
  ctx.arc(p.x + 8 * s, p.y - 41 * s, 2.2, 0, TAU);
  ctx.fill();
}

function drawLantern(ctx, p, t) {
  ctx.strokeStyle = '#3d3223';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - 30);
  ctx.lineTo(p.x + 7, p.y - 30);
  ctx.stroke();
  const flick = 0.75 + Math.sin(t * 4 + p.seed) * 0.15;
  ctx.fillStyle = 'rgba(240, 176, 100, 0.85)';
  ctx.beginPath();
  ctx.roundRect(p.x + 4, p.y - 29, 6, 8, 1.5);
  ctx.fill();
  ctx.fillStyle = `rgba(240, 176, 100, ${0.16 * flick})`;
  ctx.beginPath();
  ctx.arc(p.x + 7, p.y - 25, 12, 0, TAU);
  ctx.fill();
}

function drawSign(ctx, p) {
  shadow(ctx, p.x, p.y, 6, 2, 0.18);
  ctx.strokeStyle = '#4b3a25';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - 30);
  ctx.stroke();
  ctx.save();
  ctx.translate(p.x, p.y - 26);
  ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#685232';
  ctx.fillRect(-14, -6, 28, 11);
  ctx.fillStyle = 'rgba(233, 225, 207, 0.35)';
  ctx.fillRect(-10, -3, 12, 1.2);
  ctx.fillRect(-10, 0, 8, 1.2);
  ctx.restore();
}

function drawPillar(ctx, p) {
  const s = p.s;
  shadow(ctx, p.x, p.y, 15 * s, 5 * s, 0.24);
  ctx.fillStyle = '#767468';
  ctx.beginPath();
  ctx.roundRect(p.x - 9 * s, p.y - 12 * s, 18 * s, 12 * s, 2);
  ctx.fill();
  ctx.fillStyle = '#8a8778';
  ctx.beginPath();
  ctx.roundRect(p.x - 7 * s, p.y - 42 * s, 14 * s, 32 * s, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(50, 54, 48, 0.35)';
  ctx.fillRect(p.x - 7 * s, p.y - 20 * s, 14 * s, 2);
  ctx.fillRect(p.x - 7 * s, p.y - 30 * s, 14 * s, 2);
  ctx.fillStyle = '#5f5d54';
  ctx.beginPath();
  ctx.moveTo(p.x - 7 * s, p.y - 42 * s);
  ctx.lineTo(p.x + 2 * s, p.y - 47 * s);
  ctx.lineTo(p.x + 7 * s, p.y - 40 * s);
  ctx.lineTo(p.x + 3 * s, p.y - 37 * s);
  ctx.closePath();
  ctx.fill();
}

function drawRuinWall(ctx, p) {
  const s = p.s;
  shadow(ctx, p.x, p.y, 30 * s, 6 * s, 0.22);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot || 0);
  ctx.fillStyle = '#6f6d61';
  ctx.beginPath();
  ctx.roundRect(-p.len * s * 0.5, -14 * s, p.len * s, 16 * s, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 42, 38, 0.35)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 18 * s, -14 * s);
    ctx.lineTo(i * 18 * s, 2 * s);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200, 200, 180, 0.12)';
  ctx.fillRect(-p.len * s * 0.5, -14 * s, p.len * s, 2);
  ctx.restore();
}

function drawStandingStone(ctx, p, t) {
  const s = p.s;
  shadow(ctx, p.x, p.y, 13 * s, 6 * s, 0.26);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rot || 0) * 0.06);
  ctx.fillStyle = '#6b6c62';
  ctx.beginPath();
  ctx.moveTo(-8 * s, 0);
  ctx.quadraticCurveTo(-10 * s, -34 * s, -3 * s, -48 * s);
  ctx.quadraticCurveTo(4 * s, -52 * s, 8 * s, -42 * s);
  ctx.quadraticCurveTo(9 * s, -18 * s, 8 * s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(210, 212, 190, 0.18)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4 * s, -40 * s);
  ctx.lineTo(1 * s, -33 * s);
  ctx.lineTo(-3 * s, -27 * s);
  ctx.lineTo(2 * s, -20 * s);
  ctx.stroke();
  ctx.restore();
}

function drawCache(ctx, p) {
  shadow(ctx, p.x, p.y, 14, 5, 0.24);
  ctx.fillStyle = '#4a3722';
  ctx.beginPath();
  ctx.roundRect(p.x - 12, p.y - 20, 24, 20, 2);
  ctx.fill();
  ctx.strokeStyle = '#c7a76a';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(p.x - 10, p.y - 18, 20, 16);
  ctx.fillStyle = '#c7a76a';
  ctx.fillRect(p.x - 2, p.y - 12, 4, 5);
  const glow = 0.4 + Math.sin(p.seed) * 0.1;
  ctx.fillStyle = `rgba(216, 180, 106, ${glow * 0.18})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 10, 20, 0, TAU);
  ctx.fill();
}

function drawRubble(ctx, p) {
  ctx.fillStyle = '#5c5e56';
  for (let i = 0; i < 4; i++) {
    const a = rid(p.seed, i) * TAU;
    ctx.beginPath();
    ctx.ellipse(p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 4, 3 + rid(p.seed, i + 4) * 3, 2.4, 0, 0, TAU);
    ctx.fill();
  }
}

/* ============================================================
   VILLAGE
   ============================================================ */
export function drawHut(ctx, h, t, night) {
  shadow(ctx, h.x, h.y, h.r * 1.05, h.r * 0.42, 0.32);
  ctx.fillStyle = '#57452f';
  ctx.beginPath();
  ctx.ellipse(h.x, h.y, h.r * 0.88, h.r * 0.62, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = h.color || '#6b5438';
  ctx.beginPath();
  ctx.arc(h.x, h.y - 6, h.r, 0, TAU);
  ctx.fill();

  const grad = ctx.createRadialGradient(h.x - h.r * 0.35, h.y - h.r * 0.45, h.r * 0.15, h.x, h.y, h.r);
  grad.addColorStop(0, '#8a6c44');
  grad.addColorStop(0.55, '#6a5133');
  grad.addColorStop(1, '#473522');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(h.x, h.y - 8, h.r, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = 'rgba(42, 30, 18, 0.3)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y - 8);
    ctx.lineTo(h.x + Math.cos(a) * h.r, h.y - 8 + Math.sin(a) * h.r);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(233, 210, 160, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(h.x, h.y - 8, h.r * 0.92, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();

  // door faces the hearth
  ctx.save();
  ctx.translate(h.x, h.y - 6);
  ctx.rotate(h.doorAngle);
  ctx.fillStyle = '#221a12';
  ctx.beginPath();
  ctx.ellipse(h.r * 0.72, 0, 10, 14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(224, 138, 68, 0.55)';
  if (night > 0.25) {
    ctx.beginPath();
    ctx.ellipse(h.r * 0.72, 0, 3.2, 5, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // hanging charm
  ctx.fillStyle = 'rgba(216, 180, 106, 0.6)';
  ctx.beginPath();
  ctx.arc(h.x - h.r * 0.55, h.y - h.r * 0.25, 2.2, 0, TAU);
  ctx.fill();
}

export function drawHearthBase(ctx, x, y) {
  ctx.fillStyle = '#4a4438';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 24, y + Math.sin(a) * 15, 5, 3.4, a, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(30, 26, 20, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y, 20, 12, 0, 0, TAU);
  ctx.fill();
}

/* ============================================================
   CAIRN
   ============================================================ */
export function drawCairn(ctx, c, t) {
  const lit = c.lit;
  ctx.save();
  if (lit) {
    const g = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 150);
    g.addColorStop(0, 'rgba(224, 138, 68, 0.15)');
    g.addColorStop(1, 'rgba(224, 138, 68, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 150, 0, TAU);
    ctx.fill();
  }

  ctx.strokeStyle = lit ? 'rgba(224, 138, 68, 0.4)' : 'rgba(200, 200, 180, 0.12)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(c.x, c.y, 104, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  shadow(ctx, c.x, c.y, 30, 11, 0.3);
  const stones = [
    [0, 0, 26, 13],
    [-3, -8, 22, 11],
    [1, -15, 17, 9],
    [-1, -21, 12, 7],
    [2, -26, 8, 5]
  ];
  for (let i = 0; i < stones.length; i++) {
    const [ox, oy, rx, ry] = stones[i];
    ctx.fillStyle = i % 2 ? '#6a6b61' : '#77786c';
    ctx.beginPath();
    ctx.ellipse(c.x + ox, c.y + oy, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 222, 200, 0.1)';
    ctx.beginPath();
    ctx.ellipse(c.x + ox - rx * 0.2, c.y + oy - ry * 0.3, rx * 0.5, ry * 0.4, 0, 0, TAU);
    ctx.fill();
  }
  if (lit) {
    ctx.fillStyle = 'rgba(240, 176, 100, 0.9)';
    ctx.beginPath();
    ctx.arc(c.x + 2, c.y - 30, 3.4, 0, TAU);
    ctx.fill();
    const glow = ctx.createRadialGradient(c.x + 2, c.y - 30, 1, c.x + 2, c.y - 30, 26);
    glow.addColorStop(0, 'rgba(240, 190, 120, 0.55)');
    glow.addColorStop(1, 'rgba(240, 190, 120, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c.x + 2, c.y - 30, 26, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   FIRES
   ============================================================ */
export function drawFire(ctx, f, t) {
  const big = f.eternal ? 1.25 : 1;
  if (!f.eternal) {
    ctx.fillStyle = '#4a4438';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      ctx.beginPath();
      ctx.ellipse(f.x + Math.cos(a) * 19, f.y + Math.sin(a) * 10, 4.4, 3, a, 0, TAU);
      ctx.fill();
    }
  }
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(-0.25);
  ctx.fillStyle = '#4a3521';
  ctx.beginPath();
  ctx.roundRect(-11 * big, -3 * big, 22 * big, 5 * big, 2);
  ctx.fill();
  ctx.rotate(0.55);
  ctx.beginPath();
  ctx.roundRect(-10 * big, -3 * big, 20 * big, 5 * big, 2);
  ctx.fill();
  ctx.restore();

  const flick = Math.sin(t * 8.5 + f.seed) * 0.16 + Math.sin(t * 13 + f.seed * 2) * 0.08;
  const h = (34 + flick * 30) * big;
  const layers = [
    { w: 15, h: 1, c: 'rgba(224, 90, 40, 0.85)' },
    { w: 10, h: 0.76, c: 'rgba(240, 150, 70, 0.95)' },
    { w: 5.5, h: 0.52, c: 'rgba(255, 220, 160, 0.95)' }
  ];
  for (const L of layers) {
    const w = L.w * big;
    const hh = h * L.h;
    ctx.fillStyle = L.c;
    ctx.beginPath();
    ctx.moveTo(f.x - w, f.y - 2);
    ctx.quadraticCurveTo(f.x - w * 0.8, f.y - hh * 0.5, f.x + flick * 12, f.y - hh);
    ctx.quadraticCurveTo(f.x + w * 0.9, f.y - hh * 0.5, f.x + w, f.y - 2);
    ctx.closePath();
    ctx.fill();
  }
}

/* ============================================================
   PEOPLE
   ============================================================ */
export function drawPlayer(ctx, p, game) {
  const t = game.t;
  const bob = p.bob;
  shadow(ctx, p.x, p.y + 4, p.sneak ? 11 : 13, 5, 0.3);
  if (p.inWater) {
    ctx.strokeStyle = 'rgba(170, 205, 205, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 5, 16 + Math.sin(t * 4) * 2, 6, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.35);
  ctx.rotate(p.angle);
  const sc = p.sneak ? 0.9 : 1;
  ctx.scale(sc, sc);
  if (p.invuln > 0 && Math.floor(t * 14) % 2 === 0) ctx.globalAlpha = 0.7;

  // cloak tail
  ctx.fillStyle = '#3c4636';
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.quadraticCurveTo(-26 - Math.sin(t * 3) * 2, -2, -20, 10);
  ctx.quadraticCurveTo(-10, 10, -6, 5);
  ctx.closePath();
  ctx.fill();

  // body
  ctx.fillStyle = '#4b5540';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10.5, 9, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5a674a';
  ctx.beginPath();
  ctx.ellipse(-2, -2, 7, 6, 0, 0, TAU);
  ctx.fill();

  // scarf
  ctx.fillStyle = '#b56b47';
  ctx.beginPath();
  ctx.moveTo(1, -7);
  ctx.quadraticCurveTo(-6, -10 - Math.sin(t * 5) * 2, -14, -5);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();

  // head + hood
  ctx.fillStyle = '#c9b08a';
  ctx.beginPath();
  ctx.arc(6.5, 0, 5.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3f4938';
  ctx.beginPath();
  ctx.arc(5, 0, 6.2, Math.PI * 0.6, Math.PI * 1.7);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 24, 16, 0.65)';
  ctx.beginPath();
  ctx.arc(9.5, 0, 3, -1.2, 1.2);
  ctx.fill();

  // tool
  const tool = TOOLS[p.tool];
  const swing = p.atkAnim > 0 ? Math.sin((1 - p.atkAnim / 0.24) * Math.PI) : 0;
  const handX = 7;
  const handY = 8;
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(-0.45 + swing * 1.5);
  if (tool.id === 'axe') {
    ctx.strokeStyle = '#5a4329';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, -18);
    ctx.stroke();
    ctx.fillStyle = '#9aa0a0';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(10, -20, 9, -10);
    ctx.lineTo(0, -9);
    ctx.closePath();
    ctx.fill();
  } else if (tool.id === 'spear') {
    ctx.strokeStyle = '#5a4329';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -34);
    ctx.stroke();
    ctx.fillStyle = '#a7aca6';
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(3.5, -32);
    ctx.lineTo(-3.5, -32);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = '#5a4329';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -5, 13, -1.15, 1.15);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220, 210, 180, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4.4, -17);
    ctx.lineTo(4.4, 5);
    ctx.stroke();
  }
  ctx.restore();

  // held light at night
  if (game.nightLevel() > 0.25) {
    const glow = ctx.createRadialGradient(2, 2, 2, 2, 2, 46);
    glow.addColorStop(0, 'rgba(240, 180, 110, 0.16)');
    glow.addColorStop(1, 'rgba(240, 180, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(2, 2, 46, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // swing arc
  if (p.atkAnim > 0 && tool.melee) {
    const prog = 1 - p.atkAnim / 0.24;
    const a0 = p.swingAngle - tool.arc / 2 + prog * tool.arc * 0.8;
    const alpha = Math.sin(prog * Math.PI) * 0.45;
    ctx.strokeStyle = `rgba(233, 225, 207, ${alpha})`;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 2, tool.range * 0.85, a0 - 0.3, a0 + 0.3);
    ctx.stroke();
  }
}

export function drawNpc(ctx, n, game) {
  if (n.inside) return;
  const t = game.t;
  const bob = n.walking ? Math.sin(t * 8 + n.bob) * 1.8 : Math.sin(t * 1.4 + n.bob) * 0.5;
  shadow(ctx, n.x, n.y + 3, 11, 4.5, 0.26);
  ctx.save();
  ctx.translate(n.x, n.y + bob * 0.4);
  ctx.rotate(n.angle);
  const sc = n.id === 'orin' ? 0.78 : 1;
  ctx.scale(sc, sc);

  ctx.fillStyle = shadeHex(n.color || '#8a6a54', -0.35);
  ctx.beginPath();
  ctx.moveTo(-9, -7);
  ctx.quadraticCurveTo(-18, 0, -14, 8);
  ctx.lineTo(-2, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = n.color || '#8a6a54';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.5, 8.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.ellipse(-2, -3, 5.5, 4.4, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#c9b08a';
  ctx.beginPath();
  ctx.arc(5.8, 0, 4.9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = shadeHex(n.color || '#8a6a54', -0.2);
  ctx.beginPath();
  ctx.arc(4.6, 0, 5.6, Math.PI * 0.62, Math.PI * 1.66);
  ctx.fill();

  if (n.id === 'ivo') {
    // hunter's hood
    ctx.fillStyle = '#4f5a36';
    ctx.beginPath();
    ctx.ellipse(3, 0, 7.2, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c9b08a';
    ctx.beginPath();
    ctx.arc(8.4, 0, 3.4, 0, TAU);
    ctx.fill();
  }
  if (n.id === 'sable') {
    ctx.strokeStyle = '#5d4a32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(14, 12);
    ctx.stroke();
    ctx.fillStyle = 'rgba(190, 200, 220, 0.7)';
    ctx.beginPath();
    ctx.arc(14.5, 12.5, 2.4, 0, TAU);
    ctx.fill();
  }
  if (n.id === 'elsbeth') {
    ctx.fillStyle = '#3c3630';
    ctx.beginPath();
    ctx.roundRect(-2, 5, 9, 5, 2);
    ctx.fill();
  }
  ctx.restore();

  if (dist(n.x, n.y, game.player.x, game.player.y) < 150) {
    ctx.font = '10px "Iowan Old Style", Palatino, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(233, 225, 207, 0.72)';
    ctx.fillText(n.name, n.x, n.y - 30);
  }
}

/* ============================================================
   ENEMIES
   ============================================================ */
export function drawEnemy(ctx, e, game) {
  if (e.dead && e.deathT > 0.7) return;
  let alpha = 1;
  if (e.fade) alpha = 1 - e.fadeT / 1.2;
  if (e.dead) alpha = 1 - e.deathT / 1.4;
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;

  const t = game.t;
  const bob = Math.sin(e.walk) * 1.2;
  const sc = (0.55 + e.spawnT * 0.45) * (e.type === 'archer' ? 0.94 : 1);
  shadow(ctx, e.x, e.y + 3, 13 * sc, 5 * sc, 0.34 * alpha);
  ctx.save();
  ctx.translate(e.x, e.y + bob * 0.5);
  ctx.rotate(e.angle);
  ctx.scale(sc, sc);
  if (e.dead) {
    ctx.rotate(0.6);
    ctx.translate(0, 4);
  }
  if (e.hurt > 0) ctx.globalAlpha = alpha * 0.75;

  // long limbs
  ctx.strokeStyle = '#141d19';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const stride = Math.sin(e.walk) * 6;
  ctx.beginPath();
  ctx.moveTo(-2, -5);
  ctx.lineTo(-10 - stride, -9);
  ctx.moveTo(-2, 5);
  ctx.lineTo(-10 + stride, 9);
  ctx.moveTo(5, -6);
  ctx.lineTo(12 + (e.windup > 0 ? 6 : 0), -9);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // torso
  ctx.fillStyle = e.dead ? '#242a25' : '#1b2620';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 9.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(120, 140, 120, 0.12)';
  ctx.beginPath();
  ctx.ellipse(-1, -2, 7, 5, 0, 0, TAU);
  ctx.fill();

  // ragged cloth
  ctx.fillStyle = 'rgba(70, 62, 48, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(-4, 4);
  ctx.lineTo(0, -2);
  ctx.lineTo(3, 6);
  ctx.lineTo(6, -4);
  ctx.closePath();
  ctx.fill();

  // pale head
  ctx.fillStyle = '#b6b39f';
  ctx.beginPath();
  ctx.ellipse(10, 0, 6.4, 5.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#252a23';
  ctx.beginPath();
  ctx.ellipse(12, 0, 3.2, 4.2, 0, 0, TAU);
  ctx.fill();

  // antlers
  ctx.strokeStyle = '#cfc7ae';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.lineTo(14, -13);
  ctx.lineTo(18, -14);
  ctx.moveTo(13, -9);
  ctx.lineTo(17, -8);
  ctx.moveTo(10, 4);
  ctx.lineTo(14, 13);
  ctx.lineTo(18, 14);
  ctx.moveTo(13, 9);
  ctx.lineTo(17, 8);
  ctx.stroke();

  // eyes
  if (!e.dead) {
    ctx.fillStyle = 'rgba(224, 94, 70, 0.95)';
    ctx.beginPath();
    ctx.arc(13, -2, 1.1, 0, TAU);
    ctx.arc(13, 2, 1.1, 0, TAU);
    ctx.fill();
    const g = ctx.createRadialGradient(13, 0, 0, 13, 0, 11);
    g.addColorStop(0, 'rgba(224, 94, 70, 0.28)');
    g.addColorStop(1, 'rgba(224, 94, 70, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(13, 0, 11, 0, TAU);
    ctx.fill();
  }

  if (e.shield) {
    ctx.fillStyle = 'rgba(86, 70, 48, 0.95)';
    ctx.beginPath();
    ctx.arc(13, 0, 13, -1.25, 1.25);
    ctx.arc(15, 0, 13, 1.25, -1.25, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(210, 190, 150, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(13, 0, 11, -1.1, 1.1);
    ctx.stroke();
  }
  if (e.archer) {
    ctx.strokeStyle = '#6b5638';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(8, 10, 12, -1.2, 1.2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // attack telegraph
  if (e.windup > 0 && !e.dead) {
    ctx.strokeStyle = 'rgba(201, 79, 67, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 52, e.angle - 0.55, e.angle + 0.55);
    ctx.stroke();
  }

  // health + trait marks
  if (!e.dead && (e.hp < e.maxHp || e.aggro)) {
    const w = 34;
    const x = e.x - w / 2;
    const y = e.y - 46;
    ctx.fillStyle = 'rgba(6, 10, 8, 0.65)';
    ctx.fillRect(x, y, w, 3.4);
    ctx.fillStyle = 'rgba(201, 79, 67, 0.9)';
    ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), 3.4);
    if (e.shield || e.archer) {
      ctx.font = '9px "Iowan Old Style", Palatino, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(240, 176, 100, 0.8)';
      ctx.fillText(e.archer ? '➶' : '◈', e.x, y - 4);
    }
  }
}

/* ============================================================
   ANIMALS
   ============================================================ */
export function drawAnimal(ctx, a, game) {
  const t = game.t;
  const bob = Math.sin(a.bob) * (a.state === 'flee' ? 2.2 : 0.8);
  shadow(ctx, a.x, a.y + 2, a.type === 'deer' ? 12 : 6, 4, 0.24);
  ctx.save();
  ctx.translate(a.x, a.y + bob * 0.3);
  ctx.rotate(a.angle);
  if (a.type === 'deer') {
    ctx.strokeStyle = '#5c4630';
    ctx.lineWidth = 2;
    const stride = Math.sin(a.bob * 2) * 4;
    ctx.beginPath();
    ctx.moveTo(-4, -5); ctx.lineTo(-8 - stride, -8);
    ctx.moveTo(-4, 5); ctx.lineTo(-8 + stride, 8);
    ctx.moveTo(6, -5); ctx.lineTo(9 + stride, -8);
    ctx.moveTo(6, 5); ctx.lineTo(9 - stride, 8);
    ctx.stroke();
    ctx.fillStyle = '#8a6845';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 7.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9d7b55';
    ctx.beginPath();
    ctx.ellipse(11, 0, 5, 4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#c9b98d';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(13, -2); ctx.lineTo(18, -9); ctx.lineTo(21, -10);
    ctx.moveTo(17, -6); ctx.lineTo(19, -2);
    ctx.moveTo(13, 2); ctx.lineTo(18, 9); ctx.lineTo(21, 10);
    ctx.stroke();
    ctx.fillStyle = '#3a2c1d';
    ctx.beginPath();
    ctx.arc(14, 0, 1.4, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = '#9a8869';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 5.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#a8977a';
    ctx.beginPath();
    ctx.ellipse(6, 0, 3.6, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#a8977a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -3); ctx.lineTo(3, -9);
    ctx.moveTo(5, -3); ctx.lineTo(7, -9);
    ctx.stroke();
    ctx.fillStyle = '#2e251a';
    ctx.beginPath();
    ctx.arc(8, 0, 1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  if (a.hit > 0) {
    ctx.fillStyle = `rgba(201, 79, 67, ${a.hit * 2})`;
    ctx.beginPath();
    ctx.arc(a.x, a.y - 4, 12, 0, TAU);
    ctx.fill();
  }
}

export function drawCorpse(ctx, c) {
  ctx.fillStyle = 'rgba(90, 30, 26, 0.28)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 4, 17, 7, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = '#6d5338';
  ctx.beginPath();
  ctx.ellipse(0, 0, c.type === 'deer' ? 13 : 7, c.type === 'deer' ? 6 : 4.5, 0, 0, TAU);
  ctx.fill();
  if (c.type === 'deer') {
    ctx.fillStyle = '#82643f';
    ctx.beginPath();
    ctx.ellipse(10, 0, 4.4, 3.4, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   ITEMS / FX
   ============================================================ */
export function drawTrap(ctx, tr) {
  ctx.strokeStyle = tr.armed ? 'rgba(205, 195, 165, 0.8)' : 'rgba(120, 110, 92, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(tr.x, tr.y, 9, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(tr.x + Math.cos(a) * 7, tr.y + Math.sin(a) * 5);
    ctx.lineTo(tr.x + Math.cos(a) * 11, tr.y + Math.sin(a) * 8);
    ctx.stroke();
  }
  if (tr.armed) {
    ctx.fillStyle = 'rgba(233, 225, 207, 0.7)';
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, 1.6, 0, TAU);
    ctx.fill();
  }
}

export function drawArrow(ctx, pr) {
  ctx.strokeStyle = pr.from === 'player' ? 'rgba(233, 225, 207, 0.9)' : 'rgba(224, 110, 90, 0.9)';
  ctx.lineWidth = 1.6;
  const bx = pr.x - Math.cos(pr.angle) * 13;
  const by = pr.y - Math.sin(pr.angle) * 13;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(pr.x, pr.y);
  ctx.stroke();
  ctx.fillStyle = pr.from === 'player' ? '#e9e1cf' : '#e07a64';
  ctx.beginPath();
  ctx.arc(pr.x, pr.y, 1.8, 0, TAU);
  ctx.fill();
}

export function drawEcho(ctx, e, t, i) {
  const col = {
    bow: '#a9b77c', flame: '#e0763c', greed: '#b08d55', mercy: '#b9c99d',
    kill: '#c94f43', snare: '#c2a86a', shadow: '#8f9bc4', cairn: '#f0b06a',
    explore: '#8fa5b0', gather: '#9aab72', build: '#d8b46a', death: '#c94f43'
  }[e.kind] || '#d8b46a';
  const pulse = 0.55 + Math.sin(t * 1.8 + i) * 0.3;
  const glow = ctx.createRadialGradient(e.x, e.y - 4, 1, e.x, e.y - 4, 28);
  glow.addColorStop(0, rgba(col, 0.2 * pulse));
  glow.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(e.x, e.y - 4, 28, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.translate(e.x, e.y - 6);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = rgba(col, 0.5 + pulse * 0.4);
  ctx.lineWidth = 1;
  ctx.strokeRect(-4, -4, 8, 8);
  ctx.restore();

  ctx.fillStyle = rgba(col, 0.75 + pulse * 0.25);
  ctx.font = '9px "Iowan Old Style", Palatino, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(glyphForKind(e.kind), e.x, e.y - 12 + Math.sin(t * 2 + i) * 2);
}

export function drawDetail(ctx, d, t) {
  switch (d.kind) {
    case 'grass': {
      const s = d.s;
      ctx.strokeStyle = 'rgba(126, 140, 92, 0.55)';
      ctx.lineWidth = 1;
      const sway = Math.sin(t * 2 + d.seed) * 1.4;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.quadraticCurveTo(d.x - 2 * s, d.y - 4 * s, d.x - 3 * s + sway, d.y - 7 * s);
      ctx.moveTo(d.x, d.y);
      ctx.quadraticCurveTo(d.x + 1 * s, d.y - 4 * s, d.x + 2 * s + sway, d.y - 6 * s);
      ctx.stroke();
      break;
    }
    case 'pebble':
      ctx.fillStyle = 'rgba(140, 140, 128, 0.4)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 2.4 * d.s, 1.6 * d.s, 0, 0, TAU);
      ctx.fill();
      break;
    case 'twig':
      ctx.strokeStyle = 'rgba(96, 84, 62, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x - 3, d.y);
      ctx.lineTo(d.x + 3, d.y - 1.5);
      ctx.stroke();
      break;
    case 'sprout':
      ctx.fillStyle = 'rgba(120, 140, 82, 0.5)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y - 1.5, 2.4, 1.2, 0.5, 0, TAU);
      ctx.fill();
      break;
    case 'lily':
      ctx.fillStyle = 'rgba(96, 128, 92, 0.42)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 5 * d.s, 3 * d.s, 0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(220, 210, 180, 0.5)';
      ctx.beginPath();
      ctx.arc(d.x, d.y - 1, 1.1, 0, TAU);
      ctx.fill();
      break;
    default: break;
  }
}
