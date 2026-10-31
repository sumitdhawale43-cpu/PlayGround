/* ============================================================
   Track geometry (Catmull-Rom -> uniform centreline samples)
   and the prerendered static world layer.
   ============================================================ */

import { PHYS } from './config.js';
import { mulberry32, clamp, lerp, catmullRomClosed, TAU } from './utils.js';

/* ---------------------------- themes ---------------------------- */
export const THEMES = {
  harbor: {
    night: false,
    ground: '#8e9d55', groundTile: '#8e9d55', speck: ['#7c8b48', '#a1ab63', '#96a45b'],
    patch: ['#c6ad77', '#7d8b4a', '#b9a06a'],
    verge: '#cbae79', vergeEdge: '#e6d5ac',
    asphalt: '#3b3f47', asphaltSpeck: ['#33373e', '#444952', '#2f333a'],
    curbA: '#e8483f', curbB: '#f6f8fb',
    line: '#f7f9fc', wall: '#e8ecf2', wallPost: '#c94b3a',
    rubber: 'rgba(18,20,24,.16)',
    grade: 'rgba(255,140,60,.10)',
    decor: ['palm', 'palm', 'tree', 'palm', 'rock', 'cone', 'tire', 'crate', 'tree'],
    sky: '#ff9d5c',
  },
  alpine: {
    night: false,
    ground: '#e4ecf5', groundTile: '#e4ecf5', speck: ['#d5e1ee', '#f3f8ff', '#cddced'],
    patch: ['#cddbe9', '#eff5fb', '#dcebf7'],
    verge: '#cfdae6', vergeEdge: '#ffffff',
    asphalt: '#474d56', asphaltSpeck: ['#3e444d', '#535a64', '#41474f'],
    curbA: '#3f7dd8', curbB: '#f6f8fb',
    line: '#ffffff', wall: '#f2f6fa', wallPost: '#3f7dd8',
    rubber: 'rgba(20,24,30,.13)',
    grade: 'rgba(120,180,255,.10)',
    decor: ['pine', 'pine', 'rock', 'pine', 'cone', 'tire', 'hut', 'fence'],
    sky: '#bcd8f5',
  },
  neon: {
    night: true,
    ground: '#1a1e29', groundTile: '#1a1e29', speck: ['#151924', '#222736', '#1b202c'],
    patch: ['#232936', '#12161f', '#2a3040'],
    verge: '#272d3c', vergeEdge: '#3b4358',
    asphalt: '#2a2f3b', asphaltSpeck: ['#242934', '#333947', '#282d38'],
    curbA: '#ff3d8b', curbB: '#25d7ff',
    line: '#8fa4c4', wall: '#4a5570', wallPost: '#25d7ff',
    rubber: 'rgba(8,10,16,.35)',
    grade: 'rgba(110,50,200,.16)',
    decor: ['building', 'billboard', 'lamp', 'barrel', 'crate', 'lamp', 'building'],
    sky: '#120e26',
  },
};

/* ---------------------------- helpers ---------------------------- */
function tile(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  draw(x, size);
  return c;
}

function makePattern(ctx, canvas, rep) {
  const p = ctx.createPattern(canvas, 'repeat');
  if (rep) p.setTransform(new DOMMatrix().scale(rep, rep));
  return p;
}

function groundTileCanvas(th, seed) {
  const rng = mulberry32(seed);
  return tile(128, (x, s) => {
    x.fillStyle = th.groundTile;
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 190; i++) {
      x.fillStyle = th.speck[(rng() * th.speck.length) | 0];
      x.globalAlpha = 0.35 + rng() * 0.5;
      const r = 1 + rng() * 3.4;
      x.beginPath();
      x.arc(rng() * s, rng() * s, r, 0, TAU);
      x.fill();
    }
    x.globalAlpha = 1;
  });
}

function asphaltTileCanvas(th, seed) {
  const rng = mulberry32(seed);
  return tile(96, (x, s) => {
    x.fillStyle = th.asphalt;
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      x.fillStyle = th.asphaltSpeck[(rng() * th.asphaltSpeck.length) | 0];
      x.globalAlpha = 0.3 + rng() * 0.55;
      x.fillRect(rng() * s, rng() * s, 1 + rng() * 2.5, 1 + rng() * 2.5);
    }
    x.globalAlpha = 0.12;
    x.strokeStyle = '#000';
    x.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      x.beginPath();
      x.moveTo(rng() * s, 0);
      x.lineTo(rng() * s, s);
      x.stroke();
    }
    x.globalAlpha = 1;
  });
}

/* ---------------------------- geometry ---------------------------- */
export function buildTrack(def) {
  // dense catmull-rom, segment count proportional to segment length
  const pts = def.points;
  const dense = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const per = clamp(Math.round(d / 16), 8, 40);
    // segment a->b is the *second* arc of the closed 4-point spline, which
    // carries the correct neighbour tangents (a->b with p(i-1) / p(i+2))
    const chunk = catmullRomClosed([pts[(i - 1 + n) % n], a, b, pts[(i + 2) % n]], per);
    for (let k = per; k < 2 * per; k++) dense.push(chunk[k]);
  }

  // arc length of the dense polyline
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1];
    const b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[cum.length - 1];
  const spacing = PHYS.spacing;
  const count = Math.max(48, Math.round(total / spacing));

  // uniform resample
  const samples = new Array(count);
  let seg = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total;
    while (seg < dense.length - 1 && cum[seg + 1] < target) seg++;
    const a = dense[seg];
    const b = dense[(seg + 1) % dense.length];
    const segLen = cum[seg + 1] - cum[seg] || 1;
    const t = clamp((target - cum[seg]) / segLen, 0, 1);
    samples[i] = { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t) };
  }

  // tangents / normals / curvature
  const step = total / count;
  for (let i = 0; i < count; i++) {
    const p = samples[(i - 1 + count) % count];
    const q = samples[(i + 1) % count];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const l = Math.hypot(dx, dy) || 1;
    const tx = dx / l;
    const ty = dy / l;
    samples[i].tx = tx;
    samples[i].ty = ty;
    samples[i].nx = -ty;
    samples[i].ny = tx;
  }
  for (let i = 0; i < count; i++) {
    const a = samples[i].tx;
    const b = samples[i].ty;
    const c = samples[(i + 1) % count].tx;
    const d = samples[(i + 1) % count].ty;
    samples[i].k = (a * d - b * c) / step;   // signed curvature (+ = turning toward -normal)
  }

  // bounds
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const s of samples) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }
  const m = PHYS.roadHalf + 40;
  const bounds = { minX: minX - m, minY: minY - m, maxX: maxX + m, maxY: maxY + m };

  const track = {
    def,
    theme: THEMES[def.theme],
    samples,
    count,
    spacing: step,
    step,
    length: total,
    bounds,
    layer: null,
    groundPattern: null,
    roadPath: null,
    vergePath: null,
    edgeA: null,
    edgeB: null,
    wallA: null,
    wallB: null,
    centrePath: null,
    mapPath: null,
    rubberPath: null,
  };

  buildPaths(track);
  return track;
}

function ribbon(samples, halfW) {
  const n = samples.length;
  const p = new Path2D();
  p.moveTo(samples[0].x + samples[0].nx * halfW, samples[0].y + samples[0].ny * halfW);
  for (let i = 1; i < n; i++) p.lineTo(samples[i].x + samples[i].nx * halfW, samples[i].y + samples[i].ny * halfW);
  for (let i = n - 1; i >= 0; i--) p.lineTo(samples[i].x - samples[i].nx * halfW, samples[i].y - samples[i].ny * halfW);
  p.closePath();
  return p;
}

function edgePath(samples, side, off) {
  const n = samples.length;
  const p = new Path2D();
  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const x = s.x + s.nx * side * off;
    const y = s.y + s.ny * side * off;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

function buildPaths(track) {
  const s = track.samples;
  track.vergePath = ribbon(s, PHYS.verge);
  track.roadPath = ribbon(s, PHYS.roadHalf);
  track.edgeA = edgePath(s, 1, PHYS.roadHalf);
  track.edgeB = edgePath(s, -1, PHYS.roadHalf);
  track.curbAPath = edgePath(s, 1, PHYS.roadHalf + 5);
  track.curbBPath = edgePath(s, -1, PHYS.roadHalf + 5);
  track.wallA = edgePath(s, 1, PHYS.verge);
  track.wallB = edgePath(s, -1, PHYS.verge);
  track.rubberA = edgePath(s, 1, 26);
  track.rubberB = edgePath(s, -1, 26);

  const cp = new Path2D();
  for (let i = 0; i < s.length; i++) {
    if (i === 0) cp.moveTo(s[i].x, s[i].y); else cp.lineTo(s[i].x, s[i].y);
  }
  cp.closePath();
  track.centrePath = cp;

  // minimap path — drawn under the world-space transform in drawMinimap(),
  // so it must share the centreline's coordinate space
  track.mapPath = cp;
}

/** nearest centreline sample search around a hint index */
export function queryTrack(track, x, y, hint) {
  const s = track.samples;
  const n = track.count;
  const base = hint === undefined ? -1 : hint;
  let best = 0;
  let bestD = Infinity;
  if (base < 0) {
    for (let i = 0; i < n; i++) {
      const d = (s[i].x - x) ** 2 + (s[i].y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
  } else {
    for (let k = -26; k <= 26; k++) {
      const i = ((base + k) % n + n) % n;
      const d = (s[i].x - x) ** 2 + (s[i].y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
  }
  // project onto the neighbouring segment for a fractional index
  const a = s[best];
  const b = s[(best + 1) % n];
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const el = ex * ex + ey * ey || 1;
  const t = clamp(((x - a.x) * ex + (y - a.y) * ey) / el, 0, 1);
  const lat = (x - (a.x + ex * t)) * a.nx + (y - (a.y + ey * t)) * a.ny;
  return { i: best, frac: best + t, lat, s: a };
}

/* ---------------------------- decorations ---------------------------- */
function shadow(ctx, x, y, rx, ry, alpha = 0.28) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.16, y + ry * 0.2, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawDecor(ctx, type, x, y, size, rng, theme, night, angle) {
  switch (type) {
    case 'palm': {
      shadow(ctx, x, y, size * .55, size * .32, .3);
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = '#7a5a35';
      ctx.lineWidth = size * .16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * .1, -size * .5, size * .04, -size * .95);
      ctx.stroke();
      const cx = size * .04, cy = -size * .95;
      ctx.fillStyle = '#3f7d3a';
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + rng() * .3;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(size * .34, 0, size * .38, size * .12, 0, 0, TAU);
        ctx.fillStyle = i % 2 ? '#4b9445' : '#37723a';
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#5c4326';
      ctx.beginPath();
      ctx.arc(cx, cy, size * .1, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'tree': {
      shadow(ctx, x, y, size * .5, size * .3, .3);
      ctx.fillStyle = '#5d4526';
      ctx.fillRect(x - size * .07, y - size * .1, size * .14, size * .3);
      ctx.fillStyle = '#2f6b34';
      ctx.beginPath(); ctx.arc(x, y - size * .1, size * .46, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3d8a42';
      ctx.beginPath(); ctx.arc(x - size * .16, y - size * .3, size * .3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + size * .2, y - size * .24, size * .26, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(x - size * .22, y - size * .4, size * .14, 0, TAU); ctx.fill();
      break;
    }
    case 'pine': {
      shadow(ctx, x, y, size * .42, size * .26, .26);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(-size * .06, -size * .05, size * .12, size * .3);
      const tiers = 3;
      for (let i = 0; i < tiers; i++) {
        const w = size * (.72 - i * .18);
        const yy = -size * .1 - i * size * .3;
        ctx.fillStyle = i % 2 ? '#1f5133' : '#286043';
        ctx.beginPath();
        ctx.moveTo(0, yy - size * .46);
        ctx.lineTo(w / 2, yy);
        ctx.lineTo(-w / 2, yy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath();
        ctx.moveTo(0, yy - size * .46);
        ctx.lineTo(w * .18, yy - size * .24);
        ctx.lineTo(-w * .18, yy - size * .24);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'rock': {
      shadow(ctx, x, y, size * .4, size * .24, .25);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#7d838c';
      ctx.beginPath();
      const r = size * .42;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        const rr = r * (0.7 + rng() * 0.5);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr * .8;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.beginPath();
      ctx.ellipse(-r * .2, -r * .3, r * .3, r * .18, -.4, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'cone': {
      shadow(ctx, x, y, size * .3, size * .18, .3);
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(x, y - size * .5);
      ctx.lineTo(x + size * .32, y + size * .3);
      ctx.lineTo(x - size * .32, y + size * .3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - size * .2, y - size * .06, size * .4, size * .16);
      break;
    }
    case 'tire': {
      shadow(ctx, x, y, size * .38, size * .26, .3);
      for (let i = 0; i < 3; i++) {
        const rr = size * (.36 - i * .03);
        ctx.fillStyle = i % 2 ? '#15171b' : '#22252b';
        ctx.beginPath();
        ctx.ellipse(x, y - i * size * .12, rr, rr * .78, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3a3f47';
        ctx.beginPath();
        ctx.ellipse(x, y - i * size * .12, rr * .45, rr * .34, 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'crate': {
      shadow(ctx, x, y, size * .5, size * .3, .3);
      const cols = ['#c9463d', '#2f7fbf', '#d9a327', '#3f9a5c'];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rng() * TAU);
      ctx.fillStyle = cols[(rng() * cols.length) | 0];
      ctx.fillRect(-size * .5, -size * .34, size, size * .68);
      ctx.strokeStyle = 'rgba(0,0,0,.4)';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size * .2, -size * .34);
        ctx.lineTo(i * size * .2, size * .34);
        ctx.stroke();
      }
      ctx.strokeRect(-size * .5, -size * .34, size, size * .68);
      ctx.restore();
      break;
    }
    case 'stand': {
      const w = size * 3.4, h = size * 1.15;
      ctx.save();
      ctx.translate(x, y);
      if (angle) ctx.rotate(angle);   /* long side follows the track tangent */
      shadow(ctx, 0, 0, w * .5, h * .5, .3);
      ctx.fillStyle = '#20242c';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      const rng2 = mulberry32((x * 7 + y * 13) | 0);
      for (let row = 0; row < 4; row++) {
        for (let i = 0; i < 16; i++) {
          ctx.fillStyle = ['#ffd166', '#ff6a13', '#4cc9f0', '#f2f2f2', '#ff5d8f'][(rng2() * 5) | 0];
          ctx.fillRect(-w / 2 + 6 + i * (w - 12) / 16, -h / 2 + 6 + row * (h - 12) / 4, 6, 6);
        }
      }
      ctx.fillStyle = '#c9ced8';
      ctx.fillRect(-w / 2 - 6, -h / 2 - 10, w + 12, 10);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(-w / 2 - 6, -h / 2 - 10, w + 12, 3);
      ctx.restore();
      break;
    }
    case 'hut': {
      shadow(ctx, x, y, size * .55, size * .34, .28);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#7a4a2c';
      ctx.fillRect(-size * .5, -size * .4, size, size * .8);
      ctx.fillStyle = '#5b3a22';
      ctx.beginPath();
      ctx.moveTo(-size * .6, -size * .4);
      ctx.lineTo(0, -size * .85);
      ctx.lineTo(size * .6, -size * .4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillRect(-size * .6, -size * .46, size * 1.2, size * .1);
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(-size * .3, -size * .1, size * .24, size * .24);
      ctx.restore();
      break;
    }
    case 'fence': {
      ctx.strokeStyle = '#8d6b45';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * size * .4, y - size * .3);
        ctx.lineTo(x + i * size * .4, y + size * .3);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x - size * .5, y - size * .12);
      ctx.lineTo(x + size * .5, y - size * .12);
      ctx.stroke();
      break;
    }
    case 'barrel': {
      shadow(ctx, x, y, size * .3, size * .2, .3);
      ctx.fillStyle = '#b7c0cc';
      ctx.fillRect(x - size * .22, y - size * .34, size * .44, size * .68);
      ctx.fillStyle = '#ff4d2e';
      ctx.fillRect(x - size * .22, y - size * .1, size * .44, size * .16);
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.fillRect(x - size * .22, y - size * .34, size * .1, size * .68);
      break;
    }
    case 'building': {
      const w = size * (1.1 + rng() * .9);
      const h = size * (1.4 + rng() * 1.1);
      ctx.save();
      ctx.translate(x, y);
      shadow(ctx, 0, 0, w * .5, h * .5, .45);
      ctx.fillStyle = ['#242938', '#1d2230', '#2b3143'][(rng() * 3) | 0];
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      const cols = ['#25d7ff', '#ff3d8b', '#ffe066', '#9dff4d'];
      const neon = cols[(rng() * cols.length) | 0];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 4; c++) {
          const lit = rng() > .38;
          ctx.fillStyle = lit ? (rng() > .5 ? '#ffe9b8' : '#bfe9ff') : 'rgba(255,255,255,.06)';
          ctx.fillRect(-w / 2 + 8 + c * (w - 16) / 4, -h / 2 + 10 + r * (h - 20) / 5, (w - 16) / 6, (h - 20) / 9);
        }
      }
      ctx.strokeStyle = neon;
      ctx.lineWidth = 4;
      ctx.shadowColor = neon;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, -h / 2 + 4);
      ctx.lineTo(w / 2 - 4, -h / 2 + 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
      break;
    }
    case 'billboard': {
      ctx.save();
      ctx.translate(x, y);
      shadow(ctx, 0, 0, size * .7, size * .3, .35);
      ctx.fillStyle = '#101319';
      ctx.fillRect(-size * .7, -size * .5, size * 1.4, size);
      const neon = ['#25d7ff', '#ff3d8b', '#ffe066'][(rng() * 3) | 0];
      ctx.shadowColor = neon;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = neon;
      ctx.lineWidth = 4;
      ctx.strokeRect(-size * .7, -size * .5, size * 1.4, size);
      ctx.fillStyle = neon;
      ctx.font = `900 ${size * .42}px "Arial Narrow", Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(['DRIFT', 'NITRO', 'LEGEND', 'TURBO'][(rng() * 4) | 0], 0, 2);
      ctx.shadowBlur = 0;
      ctx.restore();
      break;
    }
    case 'lamp': {
      ctx.save();
      ctx.translate(x, y);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 2.4);
      g.addColorStop(0, 'rgba(255,226,160,.55)');
      g.addColorStop(.4, 'rgba(255,205,120,.18)');
      g.addColorStop(1, 'rgba(255,205,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, size * 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0d1018';
      ctx.beginPath();
      ctx.arc(0, 0, size * .3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe6a8';
      ctx.beginPath();
      ctx.arc(0, 0, size * .16, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    default: break;
  }
}

/* ---------------------------- layer ---------------------------- */
/* The prerendered world is capped at LAYER_MAX px on its longest side: the
   first upload of a >6MP canvas costs seconds on software rasterisers (and is
   wasteful on weak GPUs) for no visible gain at typical camera zoom. */
const LAYER_MAX = 2048;

export function renderTrackLayer(track) {
  const th = track.theme;
  const pad = 300;
  const b = track.bounds;
  const ox = Math.floor(b.minX - pad);
  const oy = Math.floor(b.minY - pad);
  const w = Math.ceil(b.maxX - b.minX + pad * 2);
  const h = Math.ceil(b.maxY - b.minY + pad * 2);
  const res = Math.min(1, LAYER_MAX / Math.max(w, h));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w * res));
  cv.height = Math.max(1, Math.round(h * res));
  const ctx = cv.getContext('2d');
  ctx.scale(res, res);
  ctx.translate(-ox, -oy);

  const seed = track.def.id.split('').reduce((a, c) => a + c.charCodeAt(0), 7) * 977;
  const rng = mulberry32(seed);

  // ground
  const gTile = groundTileCanvas(th, seed);
  const gPat = makePattern(ctx, gTile);
  ctx.fillStyle = gPat;
  ctx.fillRect(ox, oy, w, h);

  // large ground patches for depth
  for (let i = 0; i < 90; i++) {
    const x = ox + rng() * w;
    const y = oy + rng() * h;
    const r = 40 + rng() * 160;
    ctx.globalAlpha = .10 + rng() * .14;
    ctx.fillStyle = th.patch[(rng() * th.patch.length) | 0];
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (.5 + rng() * .6), rng() * TAU, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // run-off apron
  ctx.fillStyle = th.verge;
  ctx.fill(track.vergePath);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 4;
  ctx.stroke(track.vergePath);

  // asphalt
  const aTile = asphaltTileCanvas(th, seed + 11);
  ctx.fillStyle = makePattern(ctx, aTile);
  ctx.fill(track.roadPath);

  // polished racing groove
  ctx.strokeStyle = th.rubber;
  ctx.lineWidth = 46;
  ctx.lineCap = 'round';
  ctx.stroke(track.rubberA);
  ctx.stroke(track.rubberB);
  ctx.lineWidth = 34;
  ctx.globalAlpha = .5;
  ctx.stroke(track.centrePath);
  ctx.globalAlpha = 1;

  // edge lines
  ctx.strokeStyle = th.line;
  ctx.lineWidth = 4;
  ctx.stroke(track.edgeA);
  ctx.stroke(track.edgeB);

  // kerbs (two dashed strokes = alternating blocks)
  ctx.lineWidth = 11;
  ctx.lineDashOffset = 0;
  ctx.setLineDash([26, 26]);
  ctx.strokeStyle = th.curbA;
  ctx.stroke(track.curbAPath);
  ctx.stroke(track.curbBPath);
  ctx.setLineDash([26, 26]);
  ctx.lineDashOffset = 26;
  ctx.strokeStyle = th.curbB;
  ctx.stroke(track.curbAPath);
  ctx.stroke(track.curbBPath);
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // start / finish grid
  drawStartLine(ctx, track, th);

  // guard rails
  ctx.lineCap = 'butt';
  for (const wp of [track.wallA, track.wallB]) {
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 12;
    ctx.stroke(wp);
    ctx.strokeStyle = th.wall;
    ctx.lineWidth = 7;
    ctx.stroke(wp);
    ctx.setLineDash([16, 34]);
    ctx.strokeStyle = th.wallPost;
    ctx.lineWidth = 7;
    ctx.stroke(wp);
    ctx.setLineDash([]);
  }

  // scenery
  const s = track.samples;
  const n = track.count;
  const night = th.night;
  for (let i = 0; i < n; i += 2) {
    for (const side of [1, -1]) {
      if (rng() > 0.42) continue;
      const sm = s[i];
      const type = th.decor[(rng() * th.decor.length) | 0];
      const size = type === 'building' ? 74 + rng() * 46
        : type === 'billboard' ? 46
        : type === 'stand' ? 34
        : 34 + rng() * 34;
      const off = PHYS.verge + size * .55 + rng() * 74;
      const x = sm.x + sm.nx * side * off;
      const y = sm.y + sm.ny * side * off;
      drawDecor(ctx, type, x, y, size, rng, th, night);
    }
  }

  // grandstands around the start/finish — aligned to the track so the long
  // side never leans over the road on a curved start straight
  for (const side of [1, -1]) {
    const base = Math.round(n * 0.965);
    for (let k = 0; k < 4; k++) {
      const i = (base + k * 12) % n;
      const sm = s[i];
      const size = 40;
      const depth = size * 1.15;
      const off = PHYS.verge + depth * 0.5 + 22;
      drawDecor(ctx, 'stand', sm.x + sm.nx * side * off, sm.y + sm.ny * side * off, size, rng, th, night,
        Math.atan2(sm.ty, sm.tx));
    }
  }

  // apex tyrewalls on the tightest corners
  for (let i = 0; i < n; i++) {
    if (Math.abs(s[i].k) < 0.011) continue;
    if (i % 5) continue;
    const side = s[i].k > 0 ? -1 : 1;   // outside of the corner
    const off = PHYS.verge + 16;
    drawDecor(ctx, 'tire', s[i].x + s[i].nx * side * off, s[i].y + s[i].ny * side * off, 34, rng, th, night);
  }

  track.layer = { canvas: cv, ox, oy, w, h };
  track.groundPattern = gPat;
  track.groundTile = gTile;
  return track.layer;
}

function drawStartLine(ctx, track, th) {
  const s0 = track.samples[0];
  ctx.save();
  ctx.translate(s0.x, s0.y);
  ctx.rotate(Math.atan2(s0.ty, s0.tx));
  const cell = 15;
  const rows = 2;
  const cols = Math.ceil((PHYS.roadHalf * 2) / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2) continue;
      ctx.fillStyle = '#f4f7fb';
      ctx.fillRect(-18 + r * 18, -PHYS.roadHalf + c * cell, 18, cell);
    }
  }
  ctx.globalAlpha = .35;
  ctx.fillStyle = '#000';
  ctx.fillRect(-20, -PHYS.roadHalf, 3, PHYS.roadHalf * 2);
  ctx.fillRect(18, -PHYS.roadHalf, 3, PHYS.roadHalf * 2);
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* ---------------------------- minimap ---------------------------- */
export function drawMinimap(ctx, track, cars, x, y, w, h, playerIdx) {
  const b = track.bounds;
  const tw = b.maxX - b.minX;
  const thh = b.maxY - b.minY;
  const sc = Math.min((w - 14) / tw, (h - 14) / thh);
  const px = x + (w - tw * sc) / 2;
  const py = y + (h - thh * sc) / 2;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(sc, sc);
  ctx.translate(-b.minX, -b.minY);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const inv = 1 / sc; /* the context is scaled to world units; keep strokes ~px on screen */
  ctx.strokeStyle = 'rgba(4,7,12,.82)';
  ctx.lineWidth = PHYS.roadHalf * 2.4;
  ctx.stroke(track.mapPath);
  ctx.strokeStyle = 'rgba(255,255,255,.30)';
  ctx.lineWidth = 2.2 * inv;
  ctx.stroke(track.mapPath);
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 1.3 * inv;
  ctx.setLineDash([7 * inv, 7 * inv]);
  ctx.stroke(track.mapPath);
  ctx.setLineDash([]);

  const s0 = track.samples[0];
  ctx.fillStyle = '#fff';
  const m = 8 * inv;
  ctx.fillRect(s0.x - m, s0.y - m, m * 2, m * 2);

  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    ctx.fillStyle = i === playerIdx ? '#fff' : c.color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, (i === playerIdx ? 4.2 : 3.1) * inv, 0, TAU);
    ctx.fill();
    if (i === playerIdx) {
      ctx.strokeStyle = '#ff6a13';
      ctx.lineWidth = 2.2 * inv;
      ctx.stroke();
    }
  }
  ctx.restore();
}
