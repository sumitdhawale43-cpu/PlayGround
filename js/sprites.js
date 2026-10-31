/* ============================================================
   Procedural sprites: car bodies, wheels, soft glow blobs.
   Everything is pre-rendered once and blitted per frame.
   ============================================================ */

import { PHYS } from './config.js';
import { TAU, mulberry32 } from './utils.js';

const S = 2;                       // sprite supersampling
const HL = PHYS.carLength / 2;      // half length  (24)
const HW = PHYS.carWidth / 2;       // half width   (13)

const blobCache = new Map();
const glowCache = new Map();

export function blobSprite(color) {
  if (blobCache.has(color)) return blobCache.get(color);
  const size = 72;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.45, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  blobCache.set(color, c);
  return c;
}

export function glowSprite(color) {
  if (glowCache.has(color)) return glowCache.get(color);
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.3, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  glowCache.set(color, c);
  return c;
}

function roundRect(x, px, py, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  x.beginPath();
  x.moveTo(px + rr, py);
  x.arcTo(px + w, py, px + w, py + h, rr);
  x.arcTo(px + w, py + h, px, py + h, rr);
  x.arcTo(px, py + h, px, py, rr);
  x.arcTo(px, py, px + w, py, rr);
  x.closePath();
}

/* body silhouette, forward = +x */
function outline(shape) {
  const p = new Path2D();
  if (shape === 'muscle') {
    p.moveTo(HL, -HW * 0.72);
    p.quadraticCurveTo(HL + 1, -HW, HL - 7, -HW);
    p.lineTo(-HL + 6, -HW * 1.02);
    p.quadraticCurveTo(-HL - 1, -HW * .98, -HL - 1, -HW * .66);
    p.lineTo(-HL - 1, HW * .66);
    p.quadraticCurveTo(-HL - 1, HW * .98, -HL + 6, HW * 1.02);
    p.lineTo(HL - 7, HW);
    p.quadraticCurveTo(HL + 1, HW, HL, HW * 0.72);
    p.closePath();
  } else if (shape === 'hyper') {
    p.moveTo(HL + 2, -HW * 0.40);
    p.quadraticCurveTo(HL + 3, -HW * 0.86, HL - 9, -HW);
    p.lineTo(-HL + 5, -HW * 1.0);
    p.quadraticCurveTo(-HL - 4, -HW * .86, -HL - 5, -HW * .3);
    p.lineTo(-HL - 5, HW * .3);
    p.quadraticCurveTo(-HL - 4, HW * .86, -HL + 5, HW);
    p.lineTo(HL - 9, HW);
    p.quadraticCurveTo(HL + 3, HW * 0.86, HL + 2, HW * 0.40);
    p.closePath();
  } else if (shape === 'rally') {
    p.moveTo(HL - 1, -HW * 0.82);
    p.quadraticCurveTo(HL + 2, -HW, HL - 6, -HW * 1.04);
    p.lineTo(-HL + 4, -HW * 1.06);
    p.quadraticCurveTo(-HL - 3, -HW * 1.02, -HL - 3, -HW * .6);
    p.lineTo(-HL - 3, HW * .6);
    p.quadraticCurveTo(-HL - 3, HW * 1.02, -HL + 4, HW * 1.06);
    p.lineTo(HL - 6, HW * 1.04);
    p.quadraticCurveTo(HL + 2, HW, HL - 1, HW * 0.82);
    p.closePath();
  } else {                       // coupe / drift
    p.moveTo(HL, -HW * 0.52);
    p.quadraticCurveTo(HL + 1.5, -HW * .9, HL - 7, -HW * .99);
    p.quadraticCurveTo(HL - 15, -HW, -HL + 4, -HW * .96);
    p.quadraticCurveTo(-HL - 3, -HW * .9, -HL - 3, -HW * .35);
    p.lineTo(-HL - 3, HW * .35);
    p.quadraticCurveTo(-HL - 3, HW * .9, -HL + 4, HW * .96);
    p.quadraticCurveTo(HL - 15, HW, HL - 7, HW * .99);
    p.quadraticCurveTo(HL + 1.5, HW * .9, HL, HW * 0.52);
    p.closePath();
  }
  return p;
}

/**
 * Pre-render a car body (no wheels) into an off-screen canvas.
 */
export function makeCarSprite(shape, colors, glass, seed = 1) {
  const w = Math.ceil((PHYS.carLength + 30) * S);
  const h = Math.ceil((PHYS.carWidth + 26) * S);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.translate(w / 2, h / 2);
  x.scale(S, S);

  const body = outline(shape);
  const rng = mulberry32(seed * 977 + 13);

  // ---- main paint (light falls from the top-left)
  const grad = x.createLinearGradient(0, -HW, 0, HW);
  grad.addColorStop(0, colors.body);
  grad.addColorStop(0.42, colors.body);
  grad.addColorStop(1, colors.body2);
  x.fillStyle = grad;
  x.fill(body);

  // clip everything that follows to the silhouette
  x.save();
  x.clip(body);

  // ---- width-wise shading
  const shade = x.createLinearGradient(-HL, 0, HL, 0);
  shade.addColorStop(0, 'rgba(0,0,0,.35)');
  shade.addColorStop(0.35, 'rgba(0,0,0,0)');
  shade.addColorStop(0.75, 'rgba(255,255,255,.10)');
  shade.addColorStop(1, 'rgba(0,0,0,.30)');
  x.fillStyle = shade;
  x.fillRect(-HL - 6, -HW - 4, HL * 2 + 12, HW * 2 + 8);

  // ---- racing stripes
  if (shape !== 'hyper') {
    x.globalAlpha = .92;
    x.fillStyle = colors.accent;
    x.fillRect(-HL, -6.5, HL * 2, 3.4);
    x.fillRect(-HL, 3.1, HL * 2, 3.4);
    x.globalAlpha = 1;
  } else {
    x.globalAlpha = .8;
    x.fillStyle = colors.accent;
    x.fillRect(-HL, -2, HL * 2, 4);
    x.globalAlpha = 1;
  }

  // ---- glass house
  const glassGrad = x.createLinearGradient(0, -HW, 0, HW);
  glassGrad.addColorStop(0, '#9fd6ff');
  glassGrad.addColorStop(0.25, glass);
  glassGrad.addColorStop(1, '#050a10');
  x.fillStyle = glassGrad;
  if (shape === 'rally') {
    roundRect(x, -11, -HW + 4, 22, HW * 2 - 8, 5);
  } else if (shape === 'muscle') {
    roundRect(x, -12, -HW + 4.5, 24, HW * 2 - 9, 4);
  } else if (shape === 'hyper') {
    roundRect(x, -10, -HW + 4.5, 21, HW * 2 - 9, 6);
  } else {
    roundRect(x, -11, -HW + 4, 21, HW * 2 - 8, 6);
  }
  x.fill();
  // windscreen / rear screen split
  x.fillStyle = 'rgba(0,0,0,.55)';
  x.fillRect(-3.4, -HW + 4, 2.2, HW * 2 - 8);
  x.fillRect(5.4, -HW + 4, 1.6, HW * 2 - 8);
  // roof panel
  x.fillStyle = colors.body2;
  roundRect(x, -1.4, -HW + 5.5, 6.4, HW * 2 - 11, 3);
  x.fill();

  // ---- panel lines
  x.strokeStyle = 'rgba(0,0,0,.32)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(HL - 6, -HW * .9); x.lineTo(HL - 6, HW * .9);
  x.moveTo(-HL + 5, -HW * .9); x.lineTo(-HL + 5, HW * .9);
  x.stroke();

  // ---- vents / details per shape
  if (shape === 'muscle') {
    x.fillStyle = 'rgba(0,0,0,.55)';
    roundRect(x, HL - 13, -6, 8, 12, 2);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,.16)';
    roundRect(x, HL - 13, -6, 8, 3, 2);
    x.fill();
  }
  if (shape === 'drift') {
    x.fillStyle = 'rgba(0,0,0,.5)';
    for (let i = 0; i < 3; i++) {
      x.fillRect(HL - 14 + i * 4, -HW + 3, 2, HW * 2 - 6);
    }
  }
  if (shape === 'rally') {
    x.fillStyle = '#1b2230';
    roundRect(x, -9, -HW + 1.5, 18, 3, 1.5);
    x.fill();
    x.fillStyle = colors.accent;
    for (let i = 0; i < 4; i++) x.fillRect(-8 + i * 4.6, -HW + 1.9, 3, 2.2);
  }

  // ---- highlights
  x.globalAlpha = .5;
  x.fillStyle = '#fff';
  x.fillRect(-HL + 3, -HW + 2.2, HL * 2 - 6, 2);
  x.globalAlpha = 1;

  // ---- dirt / spec speckle for texture
  x.globalAlpha = .07;
  for (let i = 0; i < 70; i++) {
    x.fillStyle = rng() > .5 ? '#fff' : '#000';
    x.fillRect(-HL + rng() * HL * 2, -HW + rng() * HW * 2, 1.6, 1.6);
  }
  x.globalAlpha = 1;

  x.restore();   // end clip

  // ---- spoiler
  if (shape === 'drift' || shape === 'hyper' || shape === 'muscle') {
    const wingW = shape === 'hyper' ? HW + 3.5 : HW + 2.5;
    x.fillStyle = 'rgba(0,0,0,.78)';
    roundRect(x, -HL - 1, -wingW, 4.5, wingW * 2, 2);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,.18)';
    x.fillRect(-HL - 1, -wingW, 4.5, 2);
    x.fillStyle = '#0b0d11';
    x.fillRect(-HL + 3, -wingW + 1.5, 3, 3);
    x.fillRect(-HL + 3, wingW - 4.5, 3, 3);
  }

  // ---- lights
  x.fillStyle = '#fff8d6';
  roundRect(x, HL - 4.5, -HW * .82, 4, 5, 1.5); x.fill();
  roundRect(x, HL - 4.5, HW * .82 - 5, 4, 5, 1.5); x.fill();
  x.fillStyle = '#ff4a5e';
  roundRect(x, -HL + 1, -HW * .85, 3.4, 5.4, 1.4); x.fill();
  roundRect(x, -HL + 1, HW * .85 - 5.4, 3.4, 5.4, 1.4); x.fill();

  // ---- mirrors
  x.fillStyle = colors.body2;
  roundRect(x, 4, -HW - 3, 5, 4, 1.5); x.fill();
  roundRect(x, 4, HW - 1, 5, 4, 1.5); x.fill();

  // ---- outline
  x.strokeStyle = 'rgba(0,0,0,.62)';
  x.lineWidth = 1.4;
  x.stroke(outline(shape));

  return { canvas: c, w: w / S, h: h / S };
}

export function drawWheel(ctx, cx, cy, ang, steer, front) {
  const w = front ? 11 : 12;
  const h = 7.2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(steer);
  ctx.fillStyle = '#0a0c10';
  roundRect(ctx, -w / 2, -h / 2, w, h, 2.4);
  ctx.fill();
  ctx.fillStyle = '#2a2f38';
  roundRect(ctx, -w / 2 + 2, -h / 2 + 1.5, w - 4, h - 3, 1.4);
  ctx.fill();
  ctx.fillStyle = front ? '#4b525e' : '#3a4049';
  roundRect(ctx, -w / 2 + 3.4, -h / 2 + 2.3, w - 6.8, h - 4.6, 1);
  ctx.fill();
  ctx.restore();
}

/** Pre-rendered drop shadow ellipse used beneath every car. */
export function makeShadowSprite() {
  const w = 132, h = 96;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.translate(w / 2, h / 2);
  x.scale(1.7, 1.7);
  const g = x.createRadialGradient(0, 2, 2, 0, 2, 34);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(0.55, 'rgba(0,0,0,.34)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.beginPath();
  x.ellipse(0, 2, 34, 24, 0, 0, TAU);
  x.fill();
  return c;
}
