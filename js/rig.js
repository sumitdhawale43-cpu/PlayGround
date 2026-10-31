// Procedural vector fighter rig + animation clips
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const dir = (a) => ({ x: Math.sin(a), y: Math.cos(a) });

const BASE = {
  dx: 0, dy: 0, lean: 0.035, head: 0, headX: 0, rot: 0,
  fUp: 0.14, fFore: 0.08,
  bUp: -0.20, bFore: -0.16,
  fThigh: 0.10, fShin: 0.02,
  bThigh: -0.09, bShin: -0.02,
  blade: 2.35, bladeGlow: 0.18,
};

export const CLIPS = {
  idle: {
    loop: 1.8,
    keys: [
      { t: 0, p: {} },
      { t: 0.5, p: { dy: -4, lean: 0.055, head: -0.02, fUp: 0.11, bUp: -0.17, fThigh: 0.11, bThigh: -0.08, blade: 2.3 } },
      { t: 1, p: {} },
    ],
  },
  walk: {
    loop: 0.72,
    keys: [
      { t: 0, p: { dy: -1, lean: 0.075, fThigh: 0.56, fShin: -0.12, bThigh: -0.44, bShin: 0.07, fUp: -0.26, fFore: -0.18, bUp: 0.34, bFore: 0.27, head: -0.03 } },
      { t: 0.25, p: { dy: -6, lean: 0.06, fThigh: 0.16, fShin: 0.06, bThigh: -0.12, bShin: 0.04, fUp: 0.04, fFore: 0.05, bUp: 0.03, bFore: 0.02 } },
      { t: 0.5, p: { dy: -1, lean: 0.075, fThigh: -0.42, fShin: 0.08, bThigh: 0.55, bShin: -0.1, fUp: 0.33, fFore: 0.25, bUp: -0.25, bFore: -0.17, head: -0.03 } },
      { t: 0.75, p: { dy: -6, lean: 0.06, fThigh: -0.12, fShin: 0.04, bThigh: 0.16, bShin: 0.06, fUp: 0.03, fFore: 0.02, bUp: 0.04, bFore: 0.05 } },
      { t: 1, p: { dy: -1, lean: 0.075, fThigh: 0.56, fShin: -0.12, bThigh: -0.44, bShin: 0.07, fUp: -0.26, fFore: -0.18, bUp: 0.34, bFore: 0.27, head: -0.03 } },
    ],
  },
  backwalk: {
    loop: 0.8,
    keys: [
      { t: 0, p: { dy: -2, lean: -0.02, fThigh: -0.38, fShin: 0.06, bThigh: 0.48, bShin: -0.1, fUp: 0.28, fFore: 0.22, bUp: -0.24, bFore: -0.18 } },
      { t: 0.5, p: { dy: -5, lean: -0.02, fThigh: 0.45, fShin: -0.1, bThigh: -0.35, bShin: 0.05, fUp: -0.23, fFore: -0.17, bUp: 0.3, bFore: 0.23 } },
      { t: 1, p: { dy: -2, lean: -0.02, fThigh: -0.38, fShin: 0.06, bThigh: 0.48, bShin: -0.1, fUp: 0.28, fFore: 0.22, bUp: -0.24, bFore: -0.18 } },
    ],
  },
  jumpUp: {
    loop: 0,
    keys: [
      { t: 0, p: { dy: 2, lean: 0.1, fThigh: 0.9, fShin: 1.7, bThigh: 0.5, bShin: 1.45, fUp: -0.8, fFore: -0.4, bUp: -0.9, bFore: -0.5, head: 0.05 } },
      { t: 0.35, p: { dy: 0, lean: 0.15, fThigh: 1.15, fShin: 1.95, bThigh: 0.75, bShin: 1.7, fUp: -1.2, fFore: -0.5, bUp: -1.3, bFore: -0.6, head: 0.08 } },
      { t: 1, p: { dy: 0, lean: 0.12, fThigh: 1.2, fShin: 1.9, bThigh: 0.8, bShin: 1.65, fUp: -1.1, fFore: -0.4, bUp: -1.2, bFore: -0.5, head: 0.06 } },
    ],
  },
  jumpDown: {
    loop: 0,
    keys: [
      { t: 0, p: { dy: 0, lean: 0.02, fThigh: 0.35, fShin: -0.18, bThigh: -0.15, bShin: -0.05, fUp: -0.55, fFore: -0.25, bUp: -0.6, bFore: -0.3, head: -0.02 } },
      { t: 0.5, p: { dy: 1, lean: 0.0, fThigh: 0.28, fShin: -0.22, bThigh: -0.1, bShin: -0.02, fUp: -0.3, fFore: -0.1, bUp: -0.35, bFore: -0.15 } },
      { t: 1, p: { dy: 2, lean: -0.02, fThigh: 0.2, fShin: -0.15, bThigh: -0.05, bShin: 0, fUp: -0.1, fFore: 0.02, bUp: -0.15, bFore: -0.02 } },
    ],
  },
  crouch: {
    loop: 0,
    keys: [
      { t: 0, p: { dy: 0, lean: 0.08, fThigh: 0.25, fShin: 0.1, bThigh: -0.2, bShin: 0.05 } },
      { t: 0.3, p: { dy: 0, lean: 0.2, fThigh: 0.95, fShin: 1.8, bThigh: 0.35, bShin: 1.55, fUp: 0.4, fFore: 1.2, bUp: 0.3, bFore: 1.1, head: 0.05, blade: -1.8 } },
      { t: 1, p: { dy: 0, lean: 0.22, fThigh: 1.0, fShin: 1.85, bThigh: 0.4, bShin: 1.6, fUp: 0.45, fFore: 1.25, bUp: 0.35, bFore: 1.15, head: 0.05, blade: -1.8 } },
    ],
  },
  block: {
    loop: 0,
    keys: [
      { t: 0, p: {} },
      { t: 0.18, p: { dy: 3, lean: -0.08, head: -0.03, fUp: 1.05, fFore: 2.35, bUp: 0.78, bFore: 2.15, fThigh: 0.35, fShin: 0.45, bThigh: -0.38, bShin: 0.35, blade: -1.25, bladeGlow: 0.5 } },
      { t: 1, p: { dy: 3, lean: -0.08, head: -0.03, fUp: 1.05, fFore: 2.35, bUp: 0.78, bFore: 2.15, fThigh: 0.35, fShin: 0.45, bThigh: -0.38, bShin: 0.35, blade: -1.25, bladeGlow: 0.5 } },
    ],
  },
  punch: {
    loop: 0,
    keys: [
      { t: 0, p: {} },
      { t: 0.2, p: { dy: 2, lean: -0.05, fUp: -0.3, fFore: -0.18, bUp: -0.48, bFore: -0.3, blade: -2.7, head: -0.02 } },
      { t: 0.36, p: { dy: -2, lean: 0.2, fUp: 1.53, fFore: 1.56, bUp: -0.78, bFore: -0.55, fThigh: 0.3, fShin: 0.05, bThigh: -0.3, bShin: 0.02, head: 0.04, blade: 1.5, bladeGlow: 0.9 } },
      { t: 0.58, p: { dy: -1, lean: 0.12, fUp: 1.2, fFore: 1.2, bUp: -0.6, bFore: -0.4, blade: 1.2, bladeGlow: 0.55 } },
      { t: 1, p: {} },
    ],
  },
  kick: {
    loop: 0,
    keys: [
      { t: 0, p: {} },
      { t: 0.22, p: { dy: 0, lean: -0.08, fThigh: 0.85, fShin: 1.6, bThigh: -0.2, bShin: 0.12, fUp: -0.45, fFore: -0.3, bUp: 0.4, bFore: 0.5, blade: -2.2 } },
      { t: 0.4, p: { dy: 0, lean: -0.22, fThigh: 1.52, fShin: 1.56, bThigh: -0.34, bShin: 0.05, fUp: -0.85, fFore: -0.5, bUp: 0.9, bFore: 1.1, head: -0.04, blade: -2.0, bladeGlow: 0.55 } },
      { t: 0.62, p: { dy: 0, lean: -0.16, fThigh: 1.2, fShin: 1.35, bThigh: -0.3, bShin: 0.06, fUp: -0.7, fFore: -0.4, bUp: 0.6, bFore: 0.8, blade: -2.1 } },
      { t: 1, p: {} },
    ],
  },
  special: {
    loop: 0,
    keys: [
      { t: 0, p: {} },
      { t: 0.2, p: { dy: 5, lean: -0.2, head: -0.08, fUp: 0.5, fFore: 1.5, bUp: 0.4, bFore: 1.4, fThigh: 0.55, fShin: 0.6, bThigh: -0.55, bShin: 0.5, blade: -2.9, bladeGlow: 0.7 } },
      { t: 0.31, p: { dy: -2, lean: 0.28, head: 0.06, fUp: 1.95, fFore: 1.55, bUp: -0.65, bFore: -0.3, fThigh: 0.5, fShin: 0.08, bThigh: -0.55, bShin: 0.06, blade: 1.05, bladeGlow: 1.7 } },
      { t: 0.46, p: { dy: 0, lean: 0.2, head: 0.02, fUp: 1.55, fFore: 1.35, bUp: -0.5, bFore: -0.25, fThigh: 0.4, fShin: 0.05, bThigh: -0.45, bShin: 0.05, blade: 1.3, bladeGlow: 1.2 } },
      { t: 1, p: {} },
    ],
  },
  hit: {
    loop: 0,
    keys: [
      { t: 0, p: {} },
      { t: 0.14, p: { dx: -9, dy: -3, lean: -0.3, head: -0.32, headX: -4, fUp: -0.75, fFore: -0.5, bUp: -1.05, bFore: -0.6, fThigh: 0.38, fShin: 0.18, bThigh: -0.3, bShin: 0.1, blade: -2.8 } },
      { t: 0.46, p: { dx: -4, dy: 0, lean: -0.16, head: -0.16, headX: -2, fUp: -0.35, fFore: -0.2, bUp: -0.55, bFore: -0.3, blade: -2.6 } },
      { t: 1, p: {} },
    ],
  },
  ko: {
    loop: 0,
    keys: [
      { t: 0, p: {} },
      { t: 0.16, p: { dx: -8, dy: -3, lean: -0.38, head: -0.4, fUp: -1.2, fFore: -0.6, bUp: -1.5, bFore: -0.8, fThigh: 0.3, fShin: 0.2, bThigh: -0.3, bShin: 0.16, blade: -3.0 } },
      { t: 0.7, p: { dx: -34, dy: 26, lean: -0.5, head: -0.35, rot: -1.46, fUp: -1.4, fFore: -0.7, bUp: -1.7, bFore: -0.9, fThigh: 0.5, fShin: 0.3, bThigh: -0.2, bShin: 0.2, blade: -2.7, bladeGlow: 0 } },
      { t: 1, p: { dx: -36, dy: 28, lean: -0.5, head: -0.35, rot: -1.5, fUp: -1.4, fFore: -0.7, bUp: -1.7, bFore: -0.9, fThigh: 0.5, fShin: 0.3, bThigh: -0.2, bShin: 0.2, blade: -2.7, bladeGlow: 0 } },
    ],
  },
  victory: {
    loop: 2.2,
    keys: [
      { t: 0, p: { lean: -0.06, head: -0.08, fUp: 2.75, fFore: 2.82, bUp: -0.5, bFore: -0.28, blade: 3.02, bladeGlow: 1.1 } },
      { t: 0.5, p: { dy: -4, lean: -0.04, head: -0.05, fUp: 2.68, fFore: 2.78, bUp: -0.45, bFore: -0.25, blade: 3.0, bladeGlow: 1.3 } },
      { t: 1, p: { lean: -0.06, head: -0.08, fUp: 2.75, fFore: 2.82, bUp: -0.5, bFore: -0.28, blade: 3.02, bladeGlow: 1.1 } },
    ],
  },
  winIdle: {
    loop: 2,
    keys: [
      { t: 0, p: { lean: -0.02, fUp: 0.2, fFore: 0.1, bUp: -0.25, bFore: -0.2, blade: 2.35 } },
      { t: 0.5, p: { dy: -4, lean: 0.01, fUp: 0.16, fFore: 0.08, bUp: -0.2, bFore: -0.16, blade: 2.4 } },
      { t: 1, p: { lean: -0.02, fUp: 0.2, fFore: 0.1, bUp: -0.25, bFore: -0.2, blade: 2.35 } },
    ],
  },
};

export function samplePose(clipName, time, fighter) {
  const clip = CLIPS[clipName] || CLIPS.idle;
  let t = time;
  if (clip.loop) t = ((t % clip.loop) + clip.loop) % clip.loop / clip.loop;
  else t = clamp(t, 0, 1);
  let a = clip.keys[0];
  let b = clip.keys[clip.keys.length - 1];
  for (let i = 0; i < clip.keys.length - 1; i++) {
    if (t >= clip.keys[i].t && t <= clip.keys[i + 1].t) {
      a = clip.keys[i];
      b = clip.keys[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, b.t - a.t);
  let k = clamp((t - a.t) / span, 0, 1);
  k = smooth(k);
  const pose = {};
  for (const key of Object.keys(BASE)) {
    const av = a.p[key] !== undefined ? a.p[key] : BASE[key];
    const bv = b.p[key] !== undefined ? b.p[key] : BASE[key];
    pose[key] = lerp(av, bv, k);
  }
  // subtle procedural sway on idle/walk so cloth and hair feel alive
  if (fighter && (clipName === 'idle' || clipName === 'winIdle')) {
    pose.head += Math.sin(time * 1.7) * 0.012;
    pose.fUp += Math.sin(time * 1.35) * 0.012;
  }
  return pose;
}

function limb(ctx, x1, y1, x2, y2, width, fill, stroke, highlight, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width + 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (highlight) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.strokeStyle = highlight;
    ctx.lineWidth = Math.max(1.2, width * 0.2);
    ctx.beginPath();
    ctx.moveTo(x1 + nx * width * 0.26, y1 + ny * width * 0.26);
    ctx.lineTo(x2 + nx * width * 0.2, y2 + ny * width * 0.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function circle(ctx, x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function clothTail(ctx, x, y, len, w, time, color, edge, dirSign = -1, alpha = 1) {
  const sway = Math.sin(time * 2.2 + x * 0.01) * 8;
  const sway2 = Math.sin(time * 2.8 + 1.2) * 10;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y - w * 0.5);
  ctx.bezierCurveTo(
    x + dirSign * len * 0.28, y + 6 + sway * 0.2,
    x + dirSign * len * 0.75, y + 18 + sway,
    x + dirSign * len, y + 32 + sway2
  );
  ctx.bezierCurveTo(
    x + dirSign * len * 0.72, y + 46 + sway,
    x + dirSign * len * 0.3, y + 44 + sway * 0.4,
    x, y + w * 0.5
  );
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y - w, x + dirSign * len, y + 40);
  g.addColorStop(0, color);
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(3, 8, 14, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawScarf(ctx, neck, pose, time, def) {
  const up = { x: Math.sin(pose.lean), y: -Math.cos(pose.lean) };
  const sx = neck.x - up.x * 10;
  const sy = neck.y - up.y * 10 - 5;
  if (def.key === 'akira') {
    clothTail(ctx, sx, sy, 108, 17, time + 0.2, '#f1fcff', def.colors.coatShade, -1, 0.92);
    clothTail(ctx, sx, sy + 10, 86, 11, time + 0.7, '#c8f4ff', '#6fc3db', -1, 0.82);
    clothTail(ctx, sx, sy - 3, 74, 8, time + 1.1, '#ffffff', '#8bd6ea', -1, 0.66);
  } else {
    // tattered cape
    const sway = Math.sin(time * 1.9) * 7;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy - 4);
    ctx.lineTo(sx - 22, sy + 16);
    ctx.lineTo(sx - 62 + sway, sy + 112);
    ctx.lineTo(sx - 36 + sway, sy + 100);
    ctx.lineTo(sx - 24 + sway, sy + 132);
    ctx.lineTo(sx - 2, sy + 104);
    ctx.lineTo(sx + 12, sy + 112);
    ctx.closePath();
    const g = ctx.createLinearGradient(sx, sy, sx - 50, sy + 120);
    g.addColorStop(0, '#691625');
    g.addColorStop(0.55, '#350a15');
    g.addColorStop(1, '#14040a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(4, 3, 8, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 90, 60, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy + 22);
    ctx.quadraticCurveTo(sx - 30, sy + 60, sx - 40 + sway, sy + 96);
    ctx.stroke();
  }
}

function drawHead(ctx, cx, cy, pose, time, def) {
  const c = def.colors;
  const tilt = pose.lean + pose.head;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  // back hair mass
  if (def.key === 'akira') {
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.bezierCurveTo(-38, -8, -36, 27, -22, 41);
    ctx.bezierCurveTo(-14, 50, -5, 48, 4, 38);
    ctx.bezierCurveTo(16, 24, 20, 6, 16, -18);
    ctx.closePath();
    const g = ctx.createLinearGradient(-20, -20, -10, 40);
    g.addColorStop(0, c.hair);
    g.addColorStop(0.6, c.hairShade);
    g.addColorStop(1, c.hairDark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 25, 34, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // long strands
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-16 + i * 7, 10);
      ctx.quadraticCurveTo(-30 + i * 8, 48 + i * 5, -16 + i * 9, 70 + i * 4);
      ctx.strokeStyle = 'rgba(159, 219, 236, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(-18, -16);
    ctx.lineTo(-35, -4);
    ctx.lineTo(-26, 3);
    ctx.lineTo(-38, 14);
    ctx.lineTo(-20, 17);
    ctx.lineTo(-24, 31);
    ctx.lineTo(-8, 28);
    ctx.lineTo(0, 38);
    ctx.lineTo(8, 22);
    ctx.lineTo(15, 8);
    ctx.lineTo(15, -18);
    ctx.closePath();
    const g = ctx.createLinearGradient(-24, -20, 8, 34);
    g.addColorStop(0, c.hairShade);
    g.addColorStop(0.55, c.hair);
    g.addColorStop(1, c.hairDark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(5, 2, 5, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // neck
  ctx.strokeStyle = c.skinShade;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(-2, 28);
  ctx.stroke();
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(-2, 26);
  ctx.stroke();

  // face
  const g = ctx.createLinearGradient(-14, -24, 19, 27);
  g.addColorStop(0, '#fff0e4');
  g.addColorStop(0.55, c.skin);
  g.addColorStop(1, c.skinShade);
  ctx.beginPath();
  ctx.moveTo(-15, -19);
  ctx.bezierCurveTo(2, -31, 20, -20, 23, -3);
  ctx.bezierCurveTo(26, 8, 20, 20, 11, 24);
  ctx.bezierCurveTo(2, 28, -10, 24, -15, 12);
  ctx.bezierCurveTo(-18, 2, -18, -10, -15, -19);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(50, 24, 24, 0.75)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // ear
  ctx.beginPath();
  ctx.ellipse(-10, 4, 5, 8, -0.2, 0, TAU);
  ctx.fillStyle = c.skinShade;
  ctx.fill();

  // eye
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(5, -4);
  ctx.quadraticCurveTo(13, -11, 21, -4);
  ctx.quadraticCurveTo(14, 3, 5, -4);
  ctx.fillStyle = '#f7feff';
  ctx.fill();
  ctx.clip();
  circle(ctx, 14, -4, 4.2, c.eye);
  circle(ctx, 14, -4, 2.1, '#071016');
  circle(ctx, 15.4, -5.4, 1.2, '#ffffff');
  ctx.restore();
  // brow
  ctx.strokeStyle = def.key === 'raze' ? '#31080e' : '#4b849b';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4, -11);
  ctx.lineTo(20, -9);
  ctx.stroke();

  // nose + mouth
  ctx.strokeStyle = 'rgba(120, 65, 55, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(24, 6);
  ctx.lineTo(20, 7);
  ctx.stroke();

  if (def.key === 'raze') {
    // mask
    ctx.beginPath();
    ctx.moveTo(-16, 9);
    ctx.quadraticCurveTo(2, 14, 20, 7);
    ctx.lineTo(17, 22);
    ctx.quadraticCurveTo(0, 31, -14, 20);
    ctx.closePath();
    ctx.fillStyle = '#16060b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 90, 60, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 194, 92, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, 17);
    ctx.lineTo(10, 14);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(140, 70, 62, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(9, 16);
    ctx.quadraticCurveTo(14, 18, 18, 15);
    ctx.stroke();
  }

  // front hair / fringe
  if (def.key === 'akira') {
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.bezierCurveTo(-10, -40, 12, -43, 24, -24);
    ctx.lineTo(21, -16);
    ctx.lineTo(13, -25);
    ctx.lineTo(8, -13);
    ctx.lineTo(1, -24);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-12, -20);
    ctx.closePath();
    const hg = ctx.createLinearGradient(-12, -38, 16, -10);
    hg.addColorStop(0, '#ffffff');
    hg.addColorStop(0.55, c.hair);
    hg.addColorStop(1, c.hairShade);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(25, 65, 82, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // side bang
    ctx.beginPath();
    ctx.moveTo(-15, -18);
    ctx.quadraticCurveTo(-24, 0, -18, 19);
    ctx.quadraticCurveTo(-11, 5, -9, -11);
    ctx.closePath();
    ctx.fillStyle = c.hairShade;
    ctx.fill();
    // hair shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-3, -31);
    ctx.quadraticCurveTo(8, -36, 17, -27);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-17, -19);
    ctx.lineTo(-27, -32);
    ctx.lineTo(-12, -30);
    ctx.lineTo(-18, -45);
    ctx.lineTo(0, -36);
    ctx.lineTo(7, -48);
    ctx.lineTo(14, -32);
    ctx.lineTo(28, -39);
    ctx.lineTo(23, -22);
    ctx.lineTo(30, -10);
    ctx.lineTo(17, -12);
    ctx.lineTo(8, -4);
    ctx.lineTo(2, -17);
    ctx.lineTo(-8, -8);
    ctx.closePath();
    const hg = ctx.createLinearGradient(-18, -46, 20, -6);
    hg.addColorStop(0, c.hairShade);
    hg.addColorStop(0.45, c.hair);
    hg.addColorStop(1, c.hairDark);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(5, 2, 5, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // topknot band
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-15, -27);
    ctx.lineTo(-3, -34);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWeapon(ctx, hand, angle, def, glow, time) {
  const c = def.colors;
  const len = def.rig.weapon;
  const d = dir(angle);
  const nx = -d.y, ny = d.x;
  const hx = hand.x - d.x * 26;
  const hy = hand.y - d.y * 26;

  ctx.save();
  if (glow > 0.05) {
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 12 + glow * 25;
  }

  if (def.key === 'akira') {
    // hilt
    ctx.strokeStyle = '#0a1d28';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + nx * 1, hy + ny * 1);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();
    // guard
    ctx.strokeStyle = c.metal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hand.x + nx * 11, hand.y + ny * 11);
    ctx.lineTo(hand.x - nx * 11, hand.y - ny * 11);
    ctx.stroke();
    // blade
    const tip = { x: hand.x + d.x * len, y: hand.y + d.y * len };
    const curve = Math.sin(angle) * 5;
    ctx.beginPath();
    ctx.moveTo(hand.x + nx * 4.5, hand.y + ny * 4.5);
    ctx.quadraticCurveTo(
      hand.x + d.x * len * 0.55 + nx * 7 + curve,
      hand.y + d.y * len * 0.55 + ny * 7 + curve,
      tip.x, tip.y
    );
    ctx.lineTo(hand.x - nx * 4.5, hand.y - ny * 4.5);
    ctx.closePath();
    const g = ctx.createLinearGradient(hand.x, hand.y, tip.x, tip.y);
    g.addColorStop(0, '#7acfe6');
    g.addColorStop(0.45, c.blade);
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // glowing edge
    ctx.strokeStyle = c.glow;
    ctx.lineWidth = 2 + glow * 2;
    ctx.beginPath();
    ctx.moveTo(hand.x + nx * 4.5, hand.y + ny * 4.5);
    ctx.quadraticCurveTo(hand.x + d.x * len * 0.55 + nx * 7, hand.y + d.y * len * 0.55 + ny * 7, tip.x, tip.y);
    ctx.stroke();
    // energy glint
    if (glow > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(tip.x - d.x * 8, tip.y - d.y * 8, 2.2 + glow, 0, TAU);
      ctx.fill();
    }
  } else {
    // heavy cleaver
    ctx.strokeStyle = '#100307';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hand.x + d.x * 6, hand.y + d.y * 6);
    ctx.stroke();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hand.x + d.x * 4, hand.y + d.y * 4);
    ctx.stroke();
    // guard
    ctx.strokeStyle = '#43101a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(hand.x + nx * 13, hand.y + ny * 13);
    ctx.lineTo(hand.x - nx * 13, hand.y - ny * 13);
    ctx.stroke();
    // blade body
    const w0 = 17, w1 = 13;
    const tip = { x: hand.x + d.x * len, y: hand.y + d.y * len };
    ctx.beginPath();
    ctx.moveTo(hand.x + nx * w0, hand.y + ny * w0);
    ctx.lineTo(tip.x + nx * w1, tip.y + ny * w1);
    ctx.lineTo(tip.x + d.x * 14 - nx * 2, tip.y + d.y * 14 - ny * 2);
    ctx.lineTo(tip.x - nx * w1 * 0.9, tip.y - ny * w1 * 0.9);
    ctx.lineTo(hand.x - nx * w0 * 0.7, hand.y - ny * w0 * 0.7);
    ctx.closePath();
    const g = ctx.createLinearGradient(hand.x, hand.y, tip.x, tip.y);
    g.addColorStop(0, '#2b1014');
    g.addColorStop(0.45, '#6b2424');
    g.addColorStop(0.85, '#b25434');
    g.addColorStop(1, c.blade);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 3, 5, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // serrated edge glow
    ctx.strokeStyle = c.glow;
    ctx.lineWidth = 2 + glow * 2;
    ctx.beginPath();
    ctx.moveTo(hand.x + nx * w0, hand.y + ny * w0);
    for (let i = 1; i <= 4; i++) {
      const k = i / 4;
      const ox = hand.x + d.x * len * k + nx * (w0 + 3 * Math.sin(i * 2.2));
      const oy = hand.y + d.y * len * k + ny * (w0 + 3 * Math.sin(i * 2.2));
      ctx.lineTo(ox, oy);
    }
    ctx.stroke();
    // runes
    ctx.strokeStyle = 'rgba(255, 194, 92, 0.8)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const k = 0.35 + i * 0.18;
      const bx = hand.x + d.x * len * k;
      const by = hand.y + d.y * len * k;
      ctx.beginPath();
      ctx.moveTo(bx - nx * 5, by - ny * 5);
      ctx.lineTo(bx + nx * 5, by + ny * 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFoot(ctx, foot, angle, def, front) {
  const c = def.colors;
  const a = angle + 0.45;
  const dx = Math.sin(a), dy = Math.cos(a);
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(angle * 0.75);
  ctx.beginPath();
  ctx.ellipse(5, 3, 15, 9, 0.1, 0, TAU);
  ctx.fillStyle = front ? c.boot : '#0a1820';
  ctx.fill();
  ctx.strokeStyle = 'rgba(2, 6, 10, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = front ? c.accent : 'rgba(120, 210, 235, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-2, 7);
  ctx.lineTo(14, 8);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a fighter in local world space.
 * The caller has already applied the view transform.
 */
export function drawFighter(ctx, fighter, time, opts = {}) {
  const def = fighter.def || fighter;
  const pose = fighter.pose || samplePose(fighter.anim || 'idle', fighter.animTime || 0, fighter);
  const R = def.rig;
  const c = def.colors;
  const facing = fighter.facing || 1;
  const alpha = opts.alpha ?? 1;
  const isKo = fighter.state === 'ko';
  const flash = fighter.flash || 0;

  const hip = { x: pose.dx, y: -R.hip + pose.dy };
  const up = { x: Math.sin(pose.lean), y: -Math.cos(pose.lean) };
  const perp = { x: Math.cos(pose.lean), y: Math.sin(pose.lean) };
  const neck = { x: hip.x + up.x * R.torso, y: hip.y + up.y * R.torso };
  const shoulderC = { x: neck.x + up.x * 14 + perp.x * -2, y: neck.y + up.y * 14 + perp.y * -2 };
  const hipC = { x: hip.x, y: hip.y - 2 };
  const headCenter = {
    x: neck.x + Math.sin(pose.lean + pose.head) * R.headR * 1.5 + pose.headX + 2,
    y: neck.y - R.headR * 1.42,
  };

  const frontShoulder = { x: shoulderC.x + perp.x * R.shoulder * 0.45, y: shoulderC.y + perp.y * R.shoulder * 0.45 };
  const backShoulder = { x: shoulderC.x - perp.x * R.shoulder * 0.45, y: shoulderC.y - perp.y * R.shoulder * 0.45 };
  const frontHip = { x: hipC.x + perp.x * 10, y: hipC.y + perp.y * 10 };
  const backHip = { x: hipC.x - perp.x * 10, y: hipC.y - perp.y * 10 };

  const armPoint = (sh, angles) => {
    const e = dir(angles[0]);
    const elbow = { x: sh.x + e.x * R.upperArm, y: sh.y + e.y * R.upperArm };
    const f = dir(angles[1]);
    const hand = { x: elbow.x + f.x * R.foreArm, y: elbow.y + f.y * R.foreArm };
    return { elbow, hand, upperAngle: angles[0], foreAngle: angles[1] };
  };
  const legPoint = (hp, thighA, shinA) => {
    const t = dir(thighA);
    const knee = { x: hp.x + t.x * R.thigh, y: hp.y + t.y * R.thigh };
    const s = dir(shinA);
    const foot = { x: knee.x + s.x * R.shin, y: knee.y + s.y * R.shin };
    return { knee, foot, thighA, shinA };
  };

  const frontArm = armPoint(frontShoulder, [pose.fUp, pose.fFore]);
  const backArm = armPoint(backShoulder, [pose.bUp, pose.bFore]);
  const frontLeg = legPoint(frontHip, pose.fThigh, pose.fShin);
  const backLeg = legPoint(backHip, pose.bThigh, pose.bShin);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(fighter.x, fighter.y);
  ctx.scale(facing * def.scale, def.scale);
  if (pose.rot) {
    ctx.translate(0, -R.hip * 0.48);
    ctx.rotate(pose.rot);
    ctx.translate(0, R.hip * 0.48);
  }

  const cx = 0;
  const outline = 'rgba(3, 9, 14, 0.82)';
  const shadeFill = def.key === 'akira' ? '#7fb9cd' : '#3d0c14';
  const frontFill = c.suitLight;
  const backFill = c.suit;

  // soft ground contact glow
  if (!opts.noGlow) {
    ctx.save();
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = c.glow;
    ctx.beginPath();
    ctx.ellipse(0, 2, 46, 9, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // scarf / cape behind everything
  drawScarf(ctx, neck, pose, time, def);

  // coat tails
  if (def.key === 'akira') {
    clothTail(ctx, -4, hip.y + 2, 60, 18, time + 0.4, '#d9f6ff', '#79bfd2', -1, 0.95);
    clothTail(ctx, 3, hip.y + 8, 46, 12, time + 0.9, '#f5feff', '#a9dce9', -1, 0.8);
  } else {
    clothTail(ctx, -5, hip.y + 2, 54, 22, time + 0.2, '#4a101c', '#16040a', -1, 0.95);
    clothTail(ctx, 5, hip.y + 10, 38, 13, time + 0.8, '#651826', '#21050b', -1, 0.8);
  }

  // back leg
  limb(ctx, backHip.x, backHip.y, backLeg.knee.x, backLeg.knee.y, 21, shadeFill, outline, def.key === 'akira' ? 'rgba(210,250,255,0.2)' : 'rgba(255,120,80,0.16)');
  limb(ctx, backLeg.knee.x, backLeg.knee.y, backLeg.foot.x, backLeg.foot.y, 17, backFill, outline, null);
  drawFoot(ctx, backLeg.foot, backLeg.shinA, def, false);

  // back arm
  limb(ctx, backShoulder.x, backShoulder.y, backArm.elbow.x, backArm.elbow.y, 18, shadeFill, outline, null);
  limb(ctx, backArm.elbow.x, backArm.elbow.y, backArm.hand.x, backArm.hand.y, 15, backFill, outline, null);
  circle(ctx, backArm.hand.x, backArm.hand.y, 8, c.glove, outline, 2);

  // torso silhouette
  ctx.beginPath();
  ctx.moveTo(hip.x - 15, hip.y - 2);
  ctx.quadraticCurveTo(hip.x - 24, hip.y - R.torso * 0.48, shoulderC.x - R.shoulder * 0.55, shoulderC.y + 4);
  ctx.quadraticCurveTo(neck.x + 2, neck.y + 9, neck.x + 19, neck.y + 14);
  ctx.quadraticCurveTo(neck.x + 25, neck.y + 36, hip.x + 22, hip.y - 8);
  ctx.closePath();
  const tg = ctx.createLinearGradient(-20, neck.y, 26, hip.y);
  tg.addColorStop(0, c.coat);
  tg.addColorStop(0.42, c.coatShade);
  tg.addColorStop(1, c.coatDark);
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // jacket panels / armor
  if (def.key === 'akira') {
    ctx.beginPath();
    ctx.moveTo(hip.x - 12, hip.y - 2);
    ctx.lineTo(neck.x - 2, neck.y + 18);
    ctx.lineTo(neck.x + 11, neck.y + 22);
    ctx.lineTo(hip.x + 8, hip.y - 4);
    ctx.closePath();
    ctx.fillStyle = c.suit;
    ctx.fill();
    ctx.strokeStyle = 'rgba(2, 10, 16, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // cyan seam
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(hip.x - 10, hip.y - 14);
    ctx.quadraticCurveTo(neck.x - 2, neck.y + 40, neck.x + 10, neck.y + 20);
    ctx.stroke();
    // belt
    ctx.strokeStyle = c.belt;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(hip.x - 16, hip.y - 15);
    ctx.lineTo(hip.x + 17, hip.y - 19);
    ctx.stroke();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hip.x - 10, hip.y - 15);
    ctx.lineTo(hip.x + 10, hip.y - 17);
    ctx.stroke();
  } else {
    // chest plate
    ctx.beginPath();
    ctx.moveTo(neck.x - 20, neck.y + 22);
    ctx.quadraticCurveTo(neck.x + 2, neck.y + 10, neck.x + 26, neck.y + 24);
    ctx.lineTo(hip.x + 18, hip.y - 16);
    ctx.lineTo(hip.x - 14, hip.y - 14);
    ctx.closePath();
    ctx.fillStyle = '#240910';
    ctx.fill();
    ctx.strokeStyle = 'rgba(4, 2, 5, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(neck.x - 8, neck.y + 26);
    ctx.lineTo(hip.x + 3, hip.y - 22);
    ctx.stroke();
    // belt
    ctx.strokeStyle = c.belt;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(hip.x - 19, hip.y - 14);
    ctx.lineTo(hip.x + 19, hip.y - 17);
    ctx.stroke();
    ctx.strokeStyle = c.accent2;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(hip.x - 12, hip.y - 15);
    ctx.lineTo(hip.x + 8, hip.y - 16);
    ctx.stroke();
  }

  // shoulder plates
  if (def.key === 'raze') {
    for (const [sh, front] of [[backShoulder, false], [frontShoulder, true]]) {
      ctx.beginPath();
      ctx.moveTo(sh.x - 17, sh.y - 10);
      ctx.quadraticCurveTo(sh.x + 2, sh.y - 26, sh.x + 22, sh.y - 10);
      ctx.lineTo(sh.x + 15, sh.y + 10);
      ctx.quadraticCurveTo(sh.x, sh.y + 16, sh.x - 17, sh.y + 5);
      ctx.closePath();
      ctx.fillStyle = front ? '#3a0c16' : '#24060d';
      ctx.fill();
      ctx.strokeStyle = 'rgba(5, 2, 5, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sh.x - 8, sh.y - 8);
      ctx.lineTo(sh.x + 12, sh.y - 9);
      ctx.stroke();
      // spike
      ctx.beginPath();
      ctx.moveTo(sh.x - 6, sh.y - 16);
      ctx.lineTo(sh.x - 1, sh.y - 32);
      ctx.lineTo(sh.x + 5, sh.y - 15);
      ctx.closePath();
      ctx.fillStyle = c.metal;
      ctx.fill();
    }
  } else {
    // light shoulder guard
    ctx.beginPath();
    ctx.moveTo(frontShoulder.x - 13, frontShoulder.y - 7);
    ctx.quadraticCurveTo(frontShoulder.x + 2, frontShoulder.y - 20, frontShoulder.x + 16, frontShoulder.y - 4);
    ctx.lineTo(frontShoulder.x + 8, frontShoulder.y + 8);
    ctx.quadraticCurveTo(frontShoulder.x - 5, frontShoulder.y + 10, frontShoulder.x - 13, frontShoulder.y - 7);
    ctx.closePath();
    ctx.fillStyle = c.coatShade;
    ctx.fill();
    ctx.strokeStyle = 'rgba(4, 16, 22, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // front leg
  limb(ctx, frontHip.x, frontHip.y, frontLeg.knee.x, frontLeg.knee.y, 23, frontFill, outline, def.key === 'akira' ? 'rgba(215,250,255,0.28)' : 'rgba(255,120,80,0.2)');
  limb(ctx, frontLeg.knee.x, frontLeg.knee.y, frontLeg.foot.x, frontLeg.foot.y, 19, def.key === 'akira' ? c.coat : c.suitLight, outline, def.key === 'akira' ? 'rgba(255,255,255,0.3)' : null);
  drawFoot(ctx, frontLeg.foot, frontLeg.shinA, def, true);

  // head
  drawHead(ctx, headCenter.x, headCenter.y, pose, time, def);

  // front arm
  limb(ctx, frontShoulder.x, frontShoulder.y, frontArm.elbow.x, frontArm.elbow.y, 19, frontFill, outline, def.key === 'akira' ? 'rgba(230,255,255,0.32)' : 'rgba(255,120,80,0.2)');
  limb(ctx, frontArm.elbow.x, frontArm.elbow.y, frontArm.hand.x, frontArm.hand.y, 16, def.key === 'akira' ? c.coatShade : c.suitLight, outline, 'rgba(255,255,255,0.2)');
  // hand
  circle(ctx, frontArm.hand.x, frontArm.hand.y, 8.5, c.glove, outline, 2);
  if (def.key === 'raze') {
    // gauntlet
    ctx.beginPath();
    ctx.arc(frontArm.hand.x, frontArm.hand.y, 11, 0, TAU);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // weapon
  drawWeapon(ctx, frontArm.hand, pose.blade, def, pose.bladeGlow + (fighter.state === 'attack' && fighter.attack ? 0.55 : 0), time);

  // impact flash
  if (flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(flash, 0, 0.75);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -R.hip * 1.1, 52, 100, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // KO stars
  if (isKo && opts.koTime > 0.7) {
    for (let i = 0; i < 3; i++) {
      const a = time * 2 + (i / 3) * TAU;
      const sx = headCenter.x + Math.cos(a) * 30;
      const sy = headCenter.y - 32 + Math.sin(a) * 8;
      ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const aa = (k / 5) * TAU - Math.PI / 2;
        const rr = k % 2 === 0 ? 5 : 2;
        ctx.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawShadow(ctx, fighter, time) {
  const def = fighter.def;
  const height = Math.max(0, 760 - fighter.y);
  const air = clamp(1 - height / 420, 0.35, 1);
  const w = 54 * def.scale * air;
  const a = 0.32 * air;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(fighter.x, 760, 2, fighter.x, 760, w);
  g.addColorStop(0, '#000000');
  g.addColorStop(0.6, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(fighter.x, 760, w, w * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawPreview(ctx, def, w, h, time, facing = 1) {
  const scale = Math.min(w / 390, h / 420);
  const fake = {
    def,
    x: 0,
    y: 0,
    facing,
    pose: samplePose('idle', time, def),
    state: 'idle',
    animTime: time,
    flash: 0,
  };
  // glow disc in screen space
  const g = ctx.createRadialGradient(w / 2, h * 0.6, 8, w / 2, h * 0.6, w * 0.5);
  g.addColorStop(0, def.accent + '38');
  g.addColorStop(0.5, def.accent + '12');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h * 0.94);
  ctx.scale(scale, scale);
  drawFighter(ctx, fake, time, { noGlow: true, alpha: 1 });
  ctx.restore();
}
