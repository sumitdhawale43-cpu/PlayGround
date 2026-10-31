/* Living creatures. Each has a readable silhouette and readable intent. */
import { TAU, clamp, rgba, mixColor } from './utils.js';

export function drawCreature(r, c) {
  switch (c.type) {
    case 'school': drawSchool(r, c); break;
    case 'jelly': drawJelly(r, c); break;
    case 'shark': drawShark(r, c); break;
    case 'angler': drawAngler(r, c); break;
    case 'manta': drawManta(r, c); break;
    default: break;
  }
}

/* ------------------------------------------------------------------ */
function drawSchool(r, c) {
  const ctx = r.ctx;
  const [cx, cy] = r.screen(c.x, c.y);
  if (cx < -260 || cx > r.W + 260 || cy < -220 || cy > r.H + 220) return;
  const baseScale = r.zoom * c.size;
  const fleeBoost = c.flee > 0 ? 1.25 : 1;
  const dir = c.dir;
  ctx.save();
  for (let i = 0; i < c.fish.length; i++) {
    const f = c.fish[i];
    const t = r.time * (1.1 + f.speed * 0.5) + f.phase;
    const fx = cx + (f.dx + Math.sin(t * 0.55) * 8) * baseScale;
    const fy = cy + (f.dy + Math.cos(t * 0.7) * 6 - Math.sin(c.phase + t * 0.2) * 5) * baseScale;
    const s = baseScale * f.size * fleeBoost;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(Math.sin(t * 1.4) * 0.07);
    ctx.scale(dir * s, s);
    const color = c.color;
    // tail
    const tail = Math.sin(t * 5.5) * 0.5;
    ctx.fillStyle = rgba(mixColor(color, '#063040', 0.25), 0.72);
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.quadraticCurveTo(-14, -5 + tail * 2, -17, -4);
    ctx.quadraticCurveTo(-14, 0, -17, 5);
    ctx.quadraticCurveTo(-13, 4 - tail * 2, -9, 0);
    ctx.fill();
    // body
    const g = ctx.createLinearGradient(0, -4, 0, 4);
    g.addColorStop(0, rgba(mixColor(color, '#ffffff', 0.22), 0.9));
    g.addColorStop(0.55, rgba(color, 0.8));
    g.addColorStop(1, rgba(mixColor(color, '#04131b', 0.32), 0.75));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-1, 0, 10, 4.2, 0, 0, TAU);
    ctx.fill();
    // top fin
    ctx.fillStyle = rgba(color, 0.55);
    ctx.beginPath();
    ctx.moveTo(-2, -3.4); ctx.lineTo(2, -7); ctx.lineTo(5, -3); ctx.closePath();
    ctx.fill();
    // eye
    ctx.fillStyle = 'rgba(3,16,24,.8)';
    ctx.beginPath(); ctx.arc(6, -0.8, 1.1, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // occasional silver glints along the school
  if (Math.sin(r.time * 0.7 + c.phase) > 0.86) {
    const f = c.fish[Math.floor(r.time * 2) % c.fish.length];
    r.drawGlow(cx + f.dx * baseScale, cy + f.dy * baseScale, c.color, 18, 0.16);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
function drawJelly(r, c) {
  const [sx, sy] = r.screen(c.x, c.y);
  if (sx < -220 || sx > r.W + 220 || sy < -260 || sy > r.H + 260) return;
  handleStun(r, c, sx, sy, c.size * 0.9);
  const bob = Math.sin(r.time * 0.8 + c.phase) * 7 * r.zoom;
  drawJellyBody(r, sx, sy + bob, c.size, c.color, c.phase, c.alpha, c.hazard);
}

export function drawAmbientJelly(r, jelly) {
  const [sx, sy] = r.screen(jelly.x, jelly.y, jelly.parallax);
  const bob = Math.sin(r.time * 0.5 + jelly.phase) * 12 * r.zoom;
  drawJellyBody(r, sx, sy + bob, jelly.size, jelly.color, jelly.phase, jelly.alpha, false, true);
}

function drawJellyBody(r, sx, sy, size, color, phase, alpha, hazard, background = false) {
  const ctx = r.ctx;
  const s = (size / 60) * r.zoom * (background ? 1 : 1);
  const pulse = 1 + Math.sin(r.time * 1.1 + phase) * 0.055;
  const glowAlpha = hazard ? 0.32 : 0.22;
  r.drawGlow(sx, sy - size * 0.22 * r.zoom, color, size * 1.65 * r.zoom, glowAlpha * (background ? 0.7 : 1));

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(s, s);
  ctx.globalAlpha = alpha;

  // tentacles behind the bell
  const armCount = 6;
  for (let i = 0; i < armCount; i++) {
    const ox = -38 + i * 15;
    const len = 78 + (i % 3) * 26 + Math.sin(phase + i) * 8;
    const sway = Math.sin(r.time * 0.9 + phase + i * 0.8) * 15;
    const sway2 = Math.sin(r.time * 0.7 + phase * 1.3 + i) * 23;
    ctx.beginPath();
    ctx.moveTo(ox, 2);
    ctx.bezierCurveTo(ox + sway * 0.4, len * 0.4, ox + sway2 * 0.7, len * 0.75, ox + sway2, len);
    ctx.strokeStyle = rgba(color, 0.4);
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.stroke();
    // bead
    ctx.fillStyle = rgba(color, 0.5);
    ctx.beginPath(); ctx.arc(ox + sway2, len, 1.5, 0, TAU); ctx.fill();
  }
  // ruffled oral arms
  for (let i = 0; i < 3; i++) {
    const ox = -18 + i * 18;
    const len = 64 + i * 12;
    const sway = Math.sin(r.time * 0.8 + phase + i * 1.2) * 20;
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.bezierCurveTo(ox - 10 + sway * 0.3, len * 0.3, ox + 14 + sway * 0.6, len * 0.6, ox + sway, len);
    ctx.strokeStyle = rgba(mixColor(color, '#ffffff', 0.25), 0.36);
    ctx.lineWidth = 5 - i;
    ctx.stroke();
  }

  // bell
  ctx.save();
  ctx.scale(1, pulse);
  const g = ctx.createLinearGradient(0, -58, 0, 6);
  g.addColorStop(0, rgba(mixColor(color, '#ffffff', 0.55), 0.55));
  g.addColorStop(0.42, rgba(color, 0.32));
  g.addColorStop(1, rgba(color, 0.035));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-42, 0);
  ctx.bezierCurveTo(-46, -35, -26, -56, 0, -56);
  ctx.bezierCurveTo(27, -56, 47, -34, 42, 0);
  ctx.bezierCurveTo(30, 7, 18, 10, 7, 7);
  ctx.bezierCurveTo(-7, 11, -20, 7, -29, 9);
  ctx.bezierCurveTo(-36, 8, -40, 4, -42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(mixColor(color, '#ffffff', 0.6), 0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // inner bell ribs
  ctx.strokeStyle = rgba(mixColor(color, '#ffffff', 0.5), 0.3);
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const x = -22 + i * 15;
    ctx.beginPath();
    ctx.moveTo(x, 2);
    ctx.quadraticCurveTo(x * 0.7, -30, x * 0.34, -48);
    ctx.stroke();
  }
  // luminous spots
  for (let i = 0; i < 5; i++) {
    const a = phase + i * 1.6;
    const x = Math.sin(a) * 25;
    const y = -20 + Math.cos(a * 1.3) * 12;
    const p = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(r.time * 2 + i));
    ctx.fillStyle = rgba(mixColor(color, '#ffffff', 0.7), 0.55 * p);
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
function drawShark(r, c) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(c.x, c.y);
  if (sx < -220 || sx > r.W + 220 || sy < -180 || sy > r.H + 180) return;
  handleStun(r, c, sx, sy, 74 * c.size);
  const s = r.zoom * c.size;
  const angle = c.angle || 0;
  const chasing = c.state === 'chase' || c.state === 'bite';
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  if (Math.cos(angle) < 0) ctx.scale(1, -1);
  ctx.scale(s, s);

  // wake / glow
  if (chasing) {
    localGlow(ctx, 0, 0, 70, '#ff6b5e', 0.05);
  }

  // tail
  const swish = Math.sin(r.time * 7.5 + c.phase) * 0.34;
  ctx.save();
  ctx.translate(-55, 0);
  ctx.rotate(swish);
  ctx.fillStyle = mixColor('#17384a', '#04121b', 0.42);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-23, -17, -34, -24);
  ctx.quadraticCurveTo(-20, -3, -29, 4);
  ctx.quadraticCurveTo(-16, 11, -38, 28);
  ctx.quadraticCurveTo(-16, 13, 0, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // pectoral fin (behind)
  ctx.fillStyle = mixColor('#1c4053', '#04121b', 0.35);
  ctx.beginPath();
  ctx.moveTo(7, 11);
  ctx.quadraticCurveTo(2, 35, -18, 43);
  ctx.quadraticCurveTo(-8, 20, -4, 10);
  ctx.closePath();
  ctx.fill();

  // body
  const g = ctx.createLinearGradient(0, -27, 0, 34);
  g.addColorStop(0, mixColor('#54798a', r.pal.rim, 0.1));
  g.addColorStop(0.34, '#2d5364');
  g.addColorStop(0.62, '#18384a');
  g.addColorStop(0.78, '#a7bcc0');
  g.addColorStop(1, '#c9d8d6');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(70, 2);
  ctx.bezierCurveTo(54, -17, 18, -29, -32, -23);
  ctx.bezierCurveTo(-48, -20, -53, -9, -55, 0);
  ctx.bezierCurveTo(-48, 9, -34, 17, -8, 22);
  ctx.bezierCurveTo(26, 26, 52, 17, 70, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,8,14,.32)';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // dorsal fin
  ctx.fillStyle = mixColor('#2a4b5d', '#061823', 0.2);
  ctx.beginPath();
  ctx.moveTo(-8, -23);
  ctx.quadraticCurveTo(-16, -55, -25, -57);
  ctx.quadraticCurveTo(-20, -32, -22, -21);
  ctx.closePath();
  ctx.fill();
  // second dorsal
  ctx.beginPath();
  ctx.moveTo(-41, -16); ctx.quadraticCurveTo(-50, -34, -54, -31); ctx.quadraticCurveTo(-50, -18, -48, -13); ctx.closePath(); ctx.fill();
  // pelvic fin
  ctx.beginPath();
  ctx.moveTo(-20, 18); ctx.quadraticCurveTo(-27, 31, -35, 32); ctx.quadraticCurveTo(-29, 20, -26, 15); ctx.closePath(); ctx.fill();

  // belly line
  ctx.strokeStyle = 'rgba(230,245,242,.2)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(45, 13);
  ctx.bezierCurveTo(20, 19, -16, 18, -40, 8);
  ctx.stroke();

  // gill slits
  ctx.strokeStyle = 'rgba(6,20,28,.5)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(26 - i * 4, -8);
    ctx.quadraticCurveTo(22 - i * 4, 0, 25 - i * 4, 7);
    ctx.stroke();
  }

  // eye + mouth
  const eyeY = -7;
  ctx.fillStyle = chasing ? '#ff765f' : 'rgba(3,12,17,.9)';
  ctx.beginPath(); ctx.arc(43, eyeY, 2.4, 0, TAU); ctx.fill();
  if (chasing) localGlow(ctx, 43, eyeY, 12, '#ff6a58', 0.3);

  ctx.strokeStyle = 'rgba(6,17,23,.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(68, 8);
  ctx.quadraticCurveTo(53, 13, 39, 10);
  ctx.stroke();
  if (chasing) {
    ctx.fillStyle = 'rgba(238,242,228,.8)';
    for (let i = 0; i < 5; i++) {
      const x = 44 + i * 4.2;
      ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x + 1.5, 16); ctx.lineTo(x + 3, 11); ctx.closePath(); ctx.fill();
    }
  }
  // scars
  ctx.strokeStyle = 'rgba(190,228,225,.12)';
  ctx.beginPath(); ctx.moveTo(-2, -19); ctx.lineTo(8, -10); ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
function drawAngler(r, c) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(c.x, c.y);
  if (sx < -180 || sx > r.W + 180 || sy < -200 || sy > r.H + 200) return;
  handleStun(r, c, sx, sy, 60 * c.size);
  const s = r.zoom * c.size;
  const hunting = c.state === 'chase' || c.state === 'lunge';
  const lureGlow = mixColor(r.pal.accent, '#ffffff', 0.25);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale((c.dir || 1) * s, s);
  const bob = Math.sin(r.time * 0.9 + c.phase) * 2.5;
  ctx.translate(0, bob);

  // rear glow
  r.drawGlow(sx, sy - 26 * s, lureGlow, 90 * c.size * r.zoom, hunting ? 0.28 : 0.16);

  // fins
  ctx.fillStyle = '#08141e';
  ctx.beginPath();
  ctx.moveTo(-20, 8); ctx.quadraticCurveTo(-45, 18, -54, 34); ctx.quadraticCurveTo(-30, 30, -13, 18); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, -28); ctx.quadraticCurveTo(-12, -44, -26, -48); ctx.quadraticCurveTo(-19, -30, -18, -23); ctx.closePath(); ctx.fill();

  // body
  const g = ctx.createRadialGradient(-10, -18, 4, 0, 0, 56);
  g.addColorStop(0, mixColor('#36596b', r.pal.rim, 0.12));
  g.addColorStop(0.55, '#153247');
  g.addColorStop(1, '#030c14');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(48, 3);
  ctx.bezierCurveTo(41, -26, 15, -42, -16, -35);
  ctx.bezierCurveTo(-40, -30, -48, -9, -42, 12);
  ctx.bezierCurveTo(-35, 33, -6, 44, 22, 33);
  ctx.bezierCurveTo(38, 26, 49, 16, 48, 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(mixColor('#4d798c', r.pal.rim, 0.35), 0.42);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // tail fin
  ctx.fillStyle = '#07121b';
  ctx.beginPath();
  ctx.moveTo(-42, 2);
  ctx.quadraticCurveTo(-62, -9, -72, -5);
  ctx.quadraticCurveTo(-57, 5, -68, 17);
  ctx.quadraticCurveTo(-48, 12, -39, 9);
  ctx.closePath();
  ctx.fill();

  // jaw
  const jawOpen = hunting ? 8 + Math.sin(r.time * 8) * 2 : 4;
  const jaw = ctx.createLinearGradient(0, 12, 0, 34);
  jaw.addColorStop(0, '#261c1f');
  jaw.addColorStop(1, '#07070c');
  ctx.fillStyle = jaw;
  ctx.beginPath();
  ctx.moveTo(46, 4);
  ctx.lineTo(45, 17 + jawOpen);
  ctx.quadraticCurveTo(20, 30 + jawOpen, -6, 24 + jawOpen * 0.5);
  ctx.quadraticCurveTo(14, 15, 20, 10);
  ctx.closePath();
  ctx.fill();
  // teeth
  ctx.fillStyle = 'rgba(228,238,224,.85)';
  for (let i = 0; i < 6; i++) {
    const x = 38 - i * 7;
    const y = 12 + jawOpen * (x / 48);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 1.4, y + 6.5 + (i % 2) * 2);
    ctx.lineTo(x - 3.2, y);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    const x = 32 - i * 7;
    ctx.beginPath();
    ctx.moveTo(x, 16 + jawOpen * 0.7);
    ctx.lineTo(x - 1, 10 + jawOpen * 0.7);
    ctx.lineTo(x - 3, 16 + jawOpen * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  // eye
  ctx.fillStyle = 'rgba(230,250,250,.9)';
  ctx.beginPath(); ctx.arc(17, -14, 3.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#041016';
  ctx.beginPath(); ctx.arc(17.5, -14, 1.7, 0, TAU); ctx.fill();
  if (hunting) {
    ctx.fillStyle = 'rgba(255,104,74,.7)';
    ctx.beginPath(); ctx.arc(17.5, -14, 2.2, 0, TAU); ctx.fill();
  }

  // lure stalk
  ctx.strokeStyle = 'rgba(10,31,42,.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -37);
  ctx.bezierCurveTo(8, -62, 34, -70, 46, -55 + Math.sin(r.time * 1.3 + c.phase) * 5);
  ctx.stroke();
  const lx = 46;
  const ly = -55 + Math.sin(r.time * 1.3 + c.phase) * 5;
  localGlow(ctx, lx, ly, 20, lureGlow, 0.6);
  ctx.fillStyle = 'rgba(235,255,250,.92)';
  ctx.beginPath(); ctx.arc(lx, ly, 3, 0, TAU); ctx.fill();

  // lateral glow dots
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = rgba(r.pal.accent, 0.22 + 0.1 * Math.sin(r.time * 1.4 + i));
    ctx.beginPath(); ctx.arc(-24 + i * 12, 6 + i * 2, 1.2, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
function drawManta(r, c) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(c.x, c.y);
  if (sx < -450 || sx > r.W + 450 || sy < -360 || sy > r.H + 360) return;
  const s = r.zoom * c.size * 1.25;
  const flap = Math.sin(r.time * 0.8 + c.phase);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale((c.dir || 1) * s, s);
  ctx.globalAlpha = 0.66;
  const body = ctx.createLinearGradient(0, -30, 0, 44);
  body.addColorStop(0, mixColor('#153b4b', r.pal.rim, 0.07));
  body.addColorStop(0.55, '#0a222f');
  body.addColorStop(1, '#04121b');
  ctx.fillStyle = body;
  // wings + body
  ctx.beginPath();
  ctx.moveTo(-6, -18);
  ctx.bezierCurveTo(-34, -58 - flap * 15, -102, -62 - flap * 34, -122, -30 - flap * 18);
  ctx.bezierCurveTo(-98, -14, -52, 2, -24, 8);
  ctx.bezierCurveTo(-11, 6, -3, 0, 0, -6);
  ctx.bezierCurveTo(3, 0, 11, 6, 24, 8);
  ctx.bezierCurveTo(52, 2, 98, -14, 122, -30 - flap * 18);
  ctx.bezierCurveTo(102, -62 - flap * 34, 34, -58 - flap * 15, 6, -18);
  ctx.closePath();
  ctx.fill();
  // cephalic lobes
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.quadraticCurveTo(-18, -29, -28, -25);
  ctx.quadraticCurveTo(-22, -12, -12, -8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -14);
  ctx.quadraticCurveTo(18, -29, 28, -25);
  ctx.quadraticCurveTo(22, -12, 12, -8);
  ctx.closePath();
  ctx.fill();
  // underside hint
  ctx.fillStyle = 'rgba(132,191,194,.12)';
  ctx.beginPath();
  ctx.moveTo(-20, 2);
  ctx.quadraticCurveTo(0, 28, 20, 2);
  ctx.quadraticCurveTo(0, 12, -20, 2);
  ctx.fill();
  // tail
  ctx.strokeStyle = '#0b2633';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(8, 50, 2 + flap * 8, 96);
  ctx.stroke();
  // spots
  ctx.fillStyle = 'rgba(145,214,206,.13)';
  for (let i = 0; i < 7; i++) {
    const a = i * 1.7;
    ctx.beginPath();
    ctx.ellipse(Math.sin(a) * 54, -14 + Math.cos(a * 1.2) * 18, 3.2, 2, 0.2, 0, TAU);
    ctx.fill();
  }
  // eyes
  ctx.fillStyle = 'rgba(3,12,18,.9)';
  ctx.beginPath(); ctx.arc(-7, -19, 1.7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -19, 1.7, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
function handleStun(r, c, sx, sy, radius) {
  if (!(c.stun > 0)) return;
  const ctx = r.ctx;
  const t = r.time * 5;
  ctx.save();
  ctx.strokeStyle = 'rgba(112,255,240,.55)';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(sx, sy, radius + i * 12, t + i * 2.1, t + i * 2.1 + 1.4);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(160,255,246,.65)';
  for (let i = 0; i < 4; i++) {
    const a = t * 0.6 + i * 1.7;
    ctx.beginPath(); ctx.arc(sx + Math.cos(a) * radius * 0.8, sy + Math.sin(a) * radius * 0.6, 1.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function localGlow(ctx, x, y, radius, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.4, rgba(color, alpha * 0.36));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
}
