/* Wrecks, ruins, temples and other large hand-placed landmarks. */
import { TAU, rgba, mixColor, clamp } from './utils.js';

function localGlow(ctx, x, y, radius, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.45, rgba(color, alpha * 0.32));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
}

function stoneGrad(ctx, pal, x0, y0, x1, y1, lit = 0.08) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, mixColor(pal.rockTop, pal.rim, lit));
  g.addColorStop(0.44, mixColor(pal.rockTop, pal.rockBottom, 0.52));
  g.addColorStop(1, mixColor(pal.rockBottom, '#000', 0.18));
  return g;
}

function block(ctx, pal, x, y, w, h, lit = 0.08, r = 2) {
  ctx.fillStyle = stoneGrad(ctx, pal, x, y, x, y + h, lit);
  ctx.beginPath();
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,6,10,.32)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // lit top edge
  ctx.strokeStyle = rgba(pal.rim, 0.12);
  ctx.beginPath(); ctx.moveTo(x + 2, y + 0.7); ctx.lineTo(x + w - 2, y + 0.7); ctx.stroke();
}

function crack(ctx, x, y, len, seed) {
  ctx.strokeStyle = 'rgba(0,5,8,.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 1; i <= 4; i++) {
    ctx.lineTo(x + Math.sin(seed + i * 1.9) * 4 + i * len * 0.18, y + i * len * 0.24);
  }
  ctx.stroke();
}

export function drawRuin(r, obj, p = 1) {
  const ctx = r.ctx;
  const [sx, sy] = r.screen(obj.x, obj.y, p);
  if (!r.visible(obj.x, obj.y, 720, p)) return;
  const pal = r.palFor(obj.zone);
  const scale = r.zoom * obj.scale;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);
  switch (obj.variant) {
    case 'wreck': drawWreck(r, obj, pal); break;
    case 'temple': drawTemple(r, obj, pal); break;
    case 'vault': drawVault(r, obj, pal); break;
    case 'bones': drawBones(r, obj, pal); break;
    case 'archive': drawArchive(r, obj, pal); break;
    case 'arch': drawArch(r, obj, pal); break;
    case 'slab': drawSlab(r, obj, pal); break;
    default: drawColumns(r, obj, pal); break;
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
function drawColumns(r, obj, pal) {
  const ctx = r.ctx;
  // platform
  block(ctx, pal, -104, 28, 208, 25, 0.05, 3);
  block(ctx, pal, -118, 48, 236, 16, 0.03, 2);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = 'rgba(0,5,8,.2)';
    ctx.beginPath(); ctx.moveTo(-100 + i * 70, 30); ctx.lineTo(-100 + i * 70, 52); ctx.stroke();
  }
  // columns
  const cols = [
    { x: -63, h: 132, w: 25, break: 0.72, crack: 1.2 },
    { x: -9, h: 178, w: 28, break: 0.93, crack: 2.8 },
    { x: 55, h: 112, w: 23, break: 0.52, crack: 4.1 },
  ];
  for (let c = 0; c < cols.length; c++) {
    const col = cols[c];
    const baseTop = 28;
    const top = baseTop - col.h * col.break;
    // base
    block(ctx, pal, col.x - col.w / 2 - 5, baseTop - 8, col.w + 10, 11, 0.04, 1);
    // shaft
    ctx.save();
    ctx.translate(col.x, 0);
    const g = ctx.createLinearGradient(-col.w / 2, 0, col.w / 2, 0);
    g.addColorStop(0, mixColor(pal.rockBottom, '#000', 0.12));
    g.addColorStop(0.36, mixColor(pal.rockTop, pal.rim, 0.08));
    g.addColorStop(0.7, mixColor(pal.rockTop, pal.rockBottom, 0.5));
    g.addColorStop(1, mixColor(pal.rockBottom, '#000', 0.18));
    ctx.fillStyle = g;
    ctx.beginPath();
    const sh = top;
    ctx.moveTo(-col.w / 2, baseTop - 8);
    ctx.lineTo(-col.w / 2, sh + 5);
    ctx.lineTo(-col.w / 2 + 4, sh);
    ctx.lineTo(col.w / 2 - 3, sh + 4);
    ctx.lineTo(col.w / 2, sh + 10);
    ctx.lineTo(col.w / 2, baseTop - 8);
    ctx.closePath();
    ctx.fill();
    // flutes
    ctx.strokeStyle = 'rgba(0,7,11,.25)';
    ctx.lineWidth = 0.8;
    for (let f = 1; f < 4; f++) {
      const fx = -col.w / 2 + f * (col.w / 4);
      ctx.beginPath(); ctx.moveTo(fx, baseTop - 10); ctx.lineTo(fx + 1, sh + 7); ctx.stroke();
    }
    // runes
    if (c === 1) {
      ctx.strokeStyle = rgba(pal.accent, 0.42);
      ctx.lineWidth = 1.1;
      for (let k = 0; k < 3; k++) {
        const yy = sh + 38 + k * 27;
        ctx.beginPath();
        ctx.moveTo(-7, yy); ctx.lineTo(6, yy); ctx.lineTo(-3, yy + 8); ctx.lineTo(7, yy + 15);
        ctx.stroke();
      }
      localGlow(ctx, 0, sh + 66, 32, pal.accent, 0.15);
    }
    ctx.restore();
    // capital or broken top
    if (c === 1) {
      block(ctx, pal, col.x - col.w / 2 - 7, top - 2, col.w + 14, 10, 0.07, 1);
      block(ctx, pal, col.x - col.w / 2 - 10, top + 8, col.w + 20, 7, 0.04, 1);
    }
    crack(ctx, col.x + 2, top + 16, 40, col.crack);
  }
  // fallen drum
  ctx.save();
  ctx.translate(42, 34);
  ctx.rotate(0.18);
  block(ctx, pal, -24, -10, 50, 17, 0.05, 3);
  ctx.strokeStyle = 'rgba(0,6,10,.3)';
  ctx.beginPath(); ctx.ellipse(25, -1.5, 5, 8, 0, 0, TAU); ctx.stroke();
  ctx.restore();
  // coral + kelp
  drawRuinGrowth(ctx, obj, pal, 80);
}

/* ------------------------------------------------------------------ */
function drawArch(r, obj, pal) {
  const ctx = r.ctx;
  block(ctx, pal, -96, 34, 38, 18, 0.03, 2);
  block(ctx, pal, 58, 34, 38, 18, 0.03, 2);
  // pillars
  for (const x of [-84, 72]) {
    const g = stoneGrad(ctx, pal, x, -90, x + 28, 38, 0.07);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, 36); ctx.lineTo(x + 2, -82); ctx.lineTo(x + 26, -76); ctx.lineTo(x + 28, 36); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,6,10,.28)'; ctx.stroke();
    ctx.strokeStyle = rgba(pal.rim, 0.1);
    ctx.beginPath(); ctx.moveTo(x + 3, 32); ctx.lineTo(x + 4, -78); ctx.stroke();
  }
  // arch
  ctx.strokeStyle = stoneGrad(ctx, pal, -90, -100, 90, -20, 0.08);
  ctx.lineWidth = 19;
  ctx.beginPath();
  ctx.moveTo(-86, -70);
  ctx.bezierCurveTo(-74, -148, 66, -154, 86, -72);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,6,10,.32)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const x = -68 + i * 34;
    const y = -110 - Math.sin((x + 86) / 172 * Math.PI) * 18;
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 2, y + 9); ctx.stroke();
  }
  // broken keystone
  ctx.fillStyle = stoneGrad(ctx, pal, -12, -154, 18, -115, 0.07);
  ctx.beginPath(); ctx.moveTo(-10, -145); ctx.lineTo(14, -151); ctx.lineTo(9, -123); ctx.lineTo(-6, -126); ctx.closePath(); ctx.fill();
  // runes
  ctx.strokeStyle = rgba(pal.accent, 0.32); ctx.lineWidth = 1.2;
  for (let k = 0; k < 2; k++) {
    const y = -46 + k * 18;
    ctx.beginPath(); ctx.moveTo(-18, y); ctx.lineTo(18, y); ctx.moveTo(-11, y + 7); ctx.lineTo(11, y - 7); ctx.stroke();
  }
  localGlow(ctx, 0, -112, 60, pal.accent, 0.09);
  drawRuinGrowth(ctx, obj, pal, 44);
}

/* ------------------------------------------------------------------ */
function drawSlab(r, obj, pal) {
  const ctx = r.ctx;
  ctx.save();
  ctx.rotate(-0.24);
  block(ctx, pal, -56, -72, 112, 92, 0.06, 4);
  ctx.strokeStyle = 'rgba(0,6,10,.3)';
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(0, -26, 24, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -26, 14, 0, TAU); ctx.stroke();
  ctx.strokeStyle = rgba(pal.accent, 0.34);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-24 + i * 18, -4);
    ctx.lineTo(-16 + i * 14, 10);
    ctx.lineTo(-22 + i * 12, 24);
    ctx.stroke();
  }
  localGlow(ctx, 0, -26, 48, pal.accent, 0.08);
  ctx.restore();
  // shards at base
  ctx.fillStyle = stoneGrad(ctx, pal, -60, 20, 60, 44, 0.03);
  ctx.beginPath(); ctx.moveTo(-70, 38); ctx.lineTo(-28, 22); ctx.lineTo(30, 28); ctx.lineTo(58, 44); ctx.closePath(); ctx.fill();
  drawRuinGrowth(ctx, obj, pal, 34);
}

/* ------------------------------------------------------------------ */
function drawWreck(r, obj, pal) {
  const ctx = r.ctx;
  const t = r.time;
  ctx.rotate(-0.08);
  // deep shadow
  ctx.fillStyle = 'rgba(0,4,8,.32)';
  ctx.beginPath(); ctx.ellipse(0, 58, 210, 32, 0, 0, TAU); ctx.fill();

  // hull
  const hull = ctx.createLinearGradient(0, -38, 0, 46);
  hull.addColorStop(0, mixColor('#2a4650', pal.rim, 0.06));
  hull.addColorStop(0.36, '#17313a');
  hull.addColorStop(1, '#050e13');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-142, -6);
  ctx.bezierCurveTo(-110, -44, 20, -54, 112, -28);
  ctx.bezierCurveTo(160, -17, 178, 4, 168, 18);
  ctx.bezierCurveTo(120, 44, -20, 48, -110, 38);
  ctx.bezierCurveTo(-160, 32, -164, 18, -142, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,7,10,.5)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // hull planks and ribs
  ctx.save();
  ctx.strokeStyle = 'rgba(0,7,11,.26)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-128 + i * 7, -2 + i * 5);
    ctx.bezierCurveTo(-40, -34 + i * 11, 70, -30 + i * 9, 156, 6 + i * 3);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(139,225,220,.075)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-90 + i * 48, -30);
    ctx.lineTo(-78 + i * 48, 38);
    ctx.stroke();
  }
  ctx.restore();

  // broken gap in the hull
  ctx.fillStyle = '#02080c';
  ctx.beginPath();
  ctx.moveTo(-62, 2);
  ctx.lineTo(-30, -12);
  ctx.lineTo(-4, 4);
  ctx.lineTo(-18, 26);
  ctx.lineTo(-44, 32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,210,205,.12)';
  ctx.stroke();
  // Splinters
  ctx.fillStyle = '#122830';
  for (const [x, y, a] of [[-58, -2, -0.4], [-24, -10, 0.2], [-8, 18, 0.9]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-3, -8, 5, 18); ctx.restore();
  }

  // portholes
  for (let i = 0; i < 4; i++) {
    const x = -112 + i * 47, y = 4 + i * 1.8;
    ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fillStyle = '#061014'; ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.7); ctx.lineWidth = 1.3; ctx.stroke();
    localGlow(ctx, x, y, 22, pal.accent, 0.22 + 0.06 * Math.sin(t * 1.4 + i));
    ctx.beginPath(); ctx.arc(x - 1, y - 1, 2.4, 0, TAU); ctx.fillStyle = rgba('#ffe0a0', 0.55); ctx.fill();
  }

  // Deck rail / bowsprit.
  ctx.strokeStyle = 'rgba(120,210,205,.17)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-110, -20); ctx.quadraticCurveTo(36, -45, 145, -20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(165, 10); ctx.lineTo(214, -6); ctx.stroke();

  // Mast, snapped and tilted.
  ctx.save();
  ctx.translate(12, -30);
  ctx.rotate(0.18);
  const mast = ctx.createLinearGradient(-4, 0, 4, 0);
  mast.addColorStop(0, '#081319'); mast.addColorStop(0.5, '#2a454d'); mast.addColorStop(1, '#071016');
  ctx.fillStyle = mast;
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-2.4, -205); ctx.lineTo(3.4, -208); ctx.lineTo(4.5, 0); ctx.closePath(); ctx.fill();
  // yardarm
  ctx.save();
  ctx.translate(0, -155); ctx.rotate(-0.05);
  ctx.fillStyle = '#13282f';
  ctx.fillRect(-78, -2, 156, 5);
  ctx.restore();
  // torn sail
  ctx.fillStyle = 'rgba(103,157,157,.12)';
  ctx.beginPath();
  ctx.moveTo(-67, -151);
  ctx.bezierCurveTo(-42, -112, -23, -54, -30, -10);
  ctx.lineTo(-12, -34);
  ctx.bezierCurveTo(-20, -82, -12, -120, -4, -150);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(137,218,210,.1)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-63, -148); ctx.quadraticCurveTo(-38, -92, -30, -16); ctx.stroke();
  // rigging
  ctx.strokeStyle = 'rgba(124,205,200,.12)';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(-128, -24); ctx.moveTo(0, -200); ctx.lineTo(142, -24); ctx.stroke();
  ctx.restore();

  // coral growth on the wreck
  drawRuinGrowth(ctx, obj, pal, 88);
  // hanging weed from the rail
  ctx.strokeStyle = rgba(pal.kelp, 0.5);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const x = -80 + i * 42;
    ctx.beginPath();
    ctx.moveTo(x, 3);
    ctx.bezierCurveTo(x + Math.sin(t * 0.5 + i) * 16, 30, x - 8 + Math.sin(t * 0.4 + i) * 20, 52, x + Math.sin(t * 0.6 + i) * 22, 76);
    ctx.stroke();
  }
  // A few lazy bubbles from the wreck.
  for (let i = 0; i < 5; i++) {
    const ph = (t * 0.14 + i * 0.2) % 1;
    ctx.globalAlpha = (1 - ph) * 0.35;
    ctx.strokeStyle = 'rgba(208,250,255,.7)';
    ctx.beginPath();
    ctx.arc(-40 + Math.sin(t + i * 2) * 30, 20 - ph * 130, 1.5 + i * 0.5, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
function drawVault(r, obj, pal) {
  const ctx = r.ctx;
  // stone plinth
  block(ctx, pal, -72, 34, 144, 18, 0.03, 3);
  block(ctx, pal, -88, 50, 176, 13, 0.02, 2);
  // giant crystals
  const crystal = (x, y, w, h, hue, tilt) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const g = ctx.createLinearGradient(0, 0, w, -h);
    g.addColorStop(0, rgba(mixColor(hue, '#001018', 0.38), 0.96));
    g.addColorStop(0.45, rgba(hue, 0.86));
    g.addColorStop(1, rgba(mixColor(hue, '#ffffff', 0.55), 0.62));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w * 0.42, -h * 0.52);
    ctx.lineTo(0, -h);
    ctx.lineTo(w * 0.34, -h * 0.45);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#ffffff', 0.25);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = rgba(mixColor(hue, '#ffffff', 0.65), 0.36);
    ctx.beginPath(); ctx.moveTo(-1, -h * 0.94); ctx.lineTo(-2, -h * 0.1); ctx.stroke();
    localGlow(ctx, 0, -h * 0.5, h * 0.8, hue, 0.16);
    ctx.restore();
  };
  const hue = mixColor(pal.coral[1], '#c9a6ff', 0.5);
  crystal(-34, 34, 30, 160, hue, -0.2);
  crystal(20, 36, 42, 118, pal.coral[0], 0.18);
  crystal(52, 38, 24, 78, pal.accent, 0.32);
  crystal(-62, 40, 18, 64, pal.accent, -0.4);
  for (let i = 0; i < 7; i++) {
    const a = r.time * 0.4 + i * 1.9;
    localGlow(ctx, Math.cos(a) * 70, -10 + Math.sin(a) * 34, 12, pal.accent, 0.16);
  }
  drawRuinGrowth(ctx, obj, pal, 66);
}

/* ------------------------------------------------------------------ */
function drawTemple(r, obj, pal) {
  const ctx = r.ctx;
  const t = r.time;
  // silhouette behind the gate
  ctx.fillStyle = 'rgba(0,4,8,.55)';
  ctx.beginPath();
  ctx.moveTo(-150, 120); ctx.lineTo(-150, -120); ctx.lineTo(-100, -220); ctx.lineTo(0, -286);
  ctx.lineTo(104, -214); ctx.lineTo(152, -110); ctx.lineTo(152, 120); ctx.closePath(); ctx.fill();

  // plinth steps
  block(ctx, pal, -142, 98, 284, 22, 0.03, 2);
  block(ctx, pal, -126, 78, 252, 24, 0.04, 2);
  block(ctx, pal, -110, 58, 220, 23, 0.05, 2);
  // carved step glyphs
  ctx.strokeStyle = rgba(pal.accent, 0.25);
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const x = -92 + i * 30;
    ctx.beginPath(); ctx.moveTo(x, 99); ctx.lineTo(x + 8, 109); ctx.lineTo(x + 2, 116); ctx.stroke();
  }

  // gate columns
  const colXs = [-104, -56, 56, 104];
  for (let c = 0; c < colXs.length; c++) {
    const x = colXs[c];
    const w = 19;
    const broken = c === 3;
    const top = broken ? -90 : -180;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, mixColor(pal.rockBottom, '#000', 0.1));
    g.addColorStop(0.36, mixColor(pal.rockTop, pal.rim, 0.08));
    g.addColorStop(0.72, mixColor(pal.rockTop, pal.rockBottom, 0.46));
    g.addColorStop(1, mixColor(pal.rockBottom, '#000', 0.2));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, 62);
    ctx.lineTo(x - w / 2, top + 8);
    ctx.lineTo(x - w / 2 + 4, top);
    ctx.lineTo(x + w / 2 - 2, top + 7);
    ctx.lineTo(x + w / 2, top + 12);
    ctx.lineTo(x + w / 2, 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,7,10,.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // capitals
    if (!broken) {
      block(ctx, pal, x - w / 2 - 5, top - 2, w + 10, 8, 0.08, 1);
      block(ctx, pal, x - w / 2 - 8, top + 6, w + 16, 6, 0.04, 1);
    }
    // glyph strip
    ctx.strokeStyle = rgba(pal.accent, 0.3);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const y = -30 + k * 20;
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y - 3); ctx.lineTo(x + 1, y + 6); ctx.stroke();
    }
    localGlow(ctx, x, -20, 30, pal.accent, 0.04);
    crack(ctx, x + 2, top + 14, 34, c + 1.9);
  }

  // lintel
  block(ctx, pal, -124, -208, 248, 30, 0.06, 2);
  block(ctx, pal, -112, -236, 224, 30, 0.055, 2);
  // pediment
  ctx.fillStyle = stoneGrad(ctx, pal, -80, -300, 80, -236, 0.06);
  ctx.beginPath();
  ctx.moveTo(-104, -236); ctx.lineTo(0, -308); ctx.lineTo(104, -236); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,7,11,.34)'; ctx.lineWidth = 1.1; ctx.stroke();
  // carved sigil on pediment
  ctx.strokeStyle = rgba(pal.accent, 0.24);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, -264, 15, 0, TAU);
  ctx.moveTo(0, -282); ctx.lineTo(0, -246);
  ctx.moveTo(-13, -264); ctx.lineTo(13, -264);
  ctx.stroke();
  localGlow(ctx, 0, -264, 55, pal.accent, 0.1);

  // central portal
  const portal = ctx.createLinearGradient(0, -170, 0, 60);
  portal.addColorStop(0, 'rgba(0,3,7,.88)');
  portal.addColorStop(0.72, 'rgba(1,7,12,.95)');
  portal.addColorStop(1, 'rgba(0,2,5,1)');
  ctx.fillStyle = portal;
  ctx.beginPath();
  ctx.moveTo(-42, 60);
  ctx.lineTo(-42, -132);
  ctx.quadraticCurveTo(0, -194, 42, -132);
  ctx.lineTo(42, 60);
  ctx.closePath();
  ctx.fill();
  // portal runes
  ctx.strokeStyle = rgba(pal.accent, 0.5);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-42, -128);
  ctx.quadraticCurveTo(0, -184, 42, -128);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = -0.72 + i * 0.16;
    const x = Math.sin(a) * 52;
    const y = -146 + Math.cos(a) * 30;
    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fillStyle = rgba(pal.accent, 0.55); ctx.fill();
    localGlow(ctx, x, y, 10, pal.accent, 0.25);
  }
  // inner glow
  const inGlow = ctx.createRadialGradient(0, -60, 0, 0, -60, 70);
  inGlow.addColorStop(0, rgba(pal.accent, 0.2 + 0.05 * Math.sin(t * 0.8)));
  inGlow.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = inGlow;
  ctx.fillRect(-80, -160, 160, 200);

  drawRuinGrowth(ctx, obj, pal, 90);
  // drifting motes
  for (let i = 0; i < 12; i++) {
    const a = i * 2.7;
    const x = Math.sin(a + t * 0.18) * 120;
    const y = -150 + Math.cos(a * 1.4 + t * 0.15) * 90;
    ctx.fillStyle = rgba(pal.accent, 0.3 + 0.25 * Math.sin(t + i));
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
function drawBones(r, obj, pal) {
  const ctx = r.ctx;
  const bone = mixColor('#c9d5c7', pal.rim, 0.12);
  const boneDark = mixColor('#929e93', pal.rockBottom, 0.36);
  ctx.save();
  ctx.rotate(-0.06);
  // skull
  const g = ctx.createLinearGradient(-170, -80, -80, 30);
  g.addColorStop(0, bone);
  g.addColorStop(0.62, mixColor(bone, boneDark, 0.5));
  g.addColorStop(1, boneDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-168, 10);
  ctx.bezierCurveTo(-158, -52, -102, -76, -66, -44);
  ctx.bezierCurveTo(-48, -28, -52, 2, -72, 18);
  ctx.lineTo(-158, 34);
  ctx.bezierCurveTo(-176, 30, -180, 18, -168, 10);
  ctx.closePath();
  ctx.fill();
  // jaw
  ctx.save();
  ctx.translate(-100, 14); ctx.rotate(-0.16);
  ctx.fillStyle = boneDark;
  r.blobPath(0, 16, 44, 12, 3.2, 9, 0.16);
  ctx.fill();
  ctx.restore();
  // eye
  ctx.fillStyle = 'rgba(2,8,12,.8)';
  ctx.beginPath(); ctx.ellipse(-116, -26, 13, 9, -0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = rgba(pal.accent, 0.35);
  ctx.beginPath(); ctx.arc(-116, -26, 3, 0, TAU); ctx.fill();
  localGlow(ctx, -116, -26, 30, pal.accent, 0.09);
  // teeth
  ctx.fillStyle = '#dbe6d8';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-142 + i * 9, 24);
    ctx.lineTo(-138 + i * 9, 38);
    ctx.lineTo(-134 + i * 9, 24);
    ctx.closePath(); ctx.fill();
  }

  // spine
  ctx.strokeStyle = bone;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-66, -6);
  ctx.bezierCurveTo(10, -18, 90, 2, 150, 22);
  ctx.stroke();
  ctx.strokeStyle = boneDark;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-60, -8); ctx.bezierCurveTo(20, -20, 92, 0, 148, 20); ctx.stroke();
  // vertebrae
  for (let i = 0; i < 9; i++) {
    const x = -50 + i * 22;
    const y = -10 + i * 3;
    ctx.fillStyle = boneDark;
    ctx.beginPath(); ctx.ellipse(x, y, 8, 9, 0.1, 0, TAU); ctx.fill();
  }
  // ribs
  ctx.strokeStyle = bone;
  ctx.lineWidth = 4.6;
  for (let i = 0; i < 7; i++) {
    const x = -34 + i * 24;
    const len = 76 + i * 8;
    ctx.beginPath();
    ctx.moveTo(x, -9 + i * 3);
    ctx.bezierCurveTo(x - 22, -42 - i * 2, x - 36, -len, x + 8, -len - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, -9 + i * 3);
    ctx.bezierCurveTo(x + 18, 28 + i * 2, x + 28, len * 0.8, x - 12, len * 0.88 + 8);
    ctx.stroke();
  }
  ctx.restore();
  // algae
  drawRuinGrowth(ctx, obj, pal, 72);
}

/* ------------------------------------------------------------------ */
function drawArchive(r, obj, pal) {
  const ctx = r.ctx;
  const t = r.time;
  // stone ring, broken in places
  ctx.save();
  ctx.rotate(0.05);
  ctx.strokeStyle = stoneGrad(ctx, pal, -100, -100, 100, 100, 0.07);
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(0, -30, 84, Math.PI * 0.12, Math.PI * 1.82);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,6,10,.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * 0.14 + i / 9 * Math.PI * 1.66;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 73, -30 + Math.sin(a) * 73);
    ctx.lineTo(Math.cos(a) * 95, -30 + Math.sin(a) * 95);
    ctx.stroke();
  }
  // broken section
  ctx.fillStyle = 'rgba(0,4,8,.65)';
  ctx.beginPath();
  ctx.moveTo(76, -86); ctx.lineTo(102, -66); ctx.lineTo(86, -30); ctx.lineTo(66, -46); ctx.closePath(); ctx.fill();
  ctx.restore();
  // portal void
  const portal = ctx.createRadialGradient(0, -30, 2, 0, -30, 74);
  portal.addColorStop(0, 'rgba(2,6,12,.98)');
  portal.addColorStop(0.7, 'rgba(2,7,13,.9)');
  portal.addColorStop(1, rgba(pal.accent, 0.12));
  ctx.fillStyle = portal;
  ctx.beginPath(); ctx.arc(0, -30, 72, 0, TAU); ctx.fill();
  // spiral light in the gate
  ctx.strokeStyle = rgba(pal.accent, 0.12);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, -30, 18 + i * 16 + Math.sin(t * 0.6 + i) * 4, t * 0.15 + i, t * 0.15 + i + 3.9);
    ctx.stroke();
  }
  // runic lights around the ring
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * 0.18 + i / 8 * Math.PI * 1.64;
    const x = Math.cos(a) * 84, y = -30 + Math.sin(a) * 84;
    const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 1.7));
    ctx.fillStyle = rgba(pal.accent, 0.55 * pulse);
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
    localGlow(ctx, x, y, 17, pal.accent, 0.22 * pulse);
  }
  // base
  block(ctx, pal, -62, 44, 124, 18, 0.03, 2);
  // floor glyphs
  ctx.strokeStyle = rgba(pal.accent, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-38, 54); ctx.lineTo(0, 46); ctx.lineTo(38, 54); ctx.stroke();
  drawRuinGrowth(ctx, obj, pal, 70);
}

/* ------------------------------------------------------------------ */
function drawRuinGrowth(ctx, obj, pal, spread) {
  const t = 0; // static silhouettes; movement comes from surrounding water
  const color = pal.coral[(obj.seed + 2) % pal.coral.length];
  // coral fans at the base
  for (let i = 0; i < 3; i++) {
    const x = Math.sin(obj.seed + i * 2.1) * spread;
    ctx.strokeStyle = rgba(color, 0.42);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.quadraticCurveTo(x + 11, 8, x + 4 + i * 2, -18);
    ctx.stroke();
    for (let j = 0; j < 3; j++) {
      const a = -0.8 + j * 0.6;
      ctx.beginPath();
      ctx.moveTo(x + 5, -8 - j * 3);
      ctx.lineTo(x + 5 + Math.cos(a) * 13, -8 - j * 3 + Math.sin(a) * 13);
      ctx.stroke();
    }
  }
  // moss
  ctx.fillStyle = rgba(pal.kelp, 0.2);
  ctx.beginPath(); ctx.ellipse(-spread * 0.4, 36, 42, 9, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(spread * 0.45, 39, 34, 8, 0, 0, TAU); ctx.fill();
  // kelp ribbons
  for (let i = 0; i < 4; i++) {
    const x = -spread * 0.7 + i * spread * 0.42;
    ctx.strokeStyle = rgba(pal.kelp, 0.28);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.bezierCurveTo(x - 10, 10, x + 6, -12, x - 2, -30 - i * 5);
    ctx.stroke();
  }
  // glow motes around deep structures
  if (obj.zone === 'midnight' || obj.zone === 'abyss') {
    for (let i = 0; i < 6; i++) {
      const a = obj.seed + i * 2.4;
      const x = Math.sin(a) * spread * 0.9;
      const y = Math.cos(a * 1.3) * 36 - 4;
      localGlow(ctx, x, y, 13, pal.accent, 0.18);
      ctx.fillStyle = rgba(pal.accent, 0.55);
      ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill();
    }
  }
}
