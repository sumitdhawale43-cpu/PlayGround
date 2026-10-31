// ============================================================
// NEON OVERDRIVE — procedural sprite art
// Everything is drawn at boot into cached canvases so the game
// loop only pays for a handful of scaled drawImage calls.
// ============================================================

const SS = 2.4;

function sprite(w, h, draw, scale = SS) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * scale);
  canvas.height = Math.ceil(h * scale);
  const g = canvas.getContext('2d');
  g.scale(scale, scale);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  draw(g, w, h);
  return { canvas, w, h };
}

function roundRect(g, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + radius, y);
  g.arcTo(x + w, y, x + w, y + h, radius);
  g.arcTo(x + w, y + h, x, y + h, radius);
  g.arcTo(x, y + h, x, y, radius);
  g.arcTo(x, y, x + w, y, radius);
  g.closePath();
}

function hexRgb(hex) {
  if (typeof hex !== 'string') return [0, 0, 0];
  // Accept colors already produced by mix() so shades can be layered.
  if (hex.startsWith('rgb')) {
    const parts = hex.match(/[\d.]+/g) || [];
    return parts.slice(0, 3).map((v) => clampByte(parseFloat(v)));
  }
  const v = hex.replace('#', '');
  const n = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
  return [0, 2, 4].map((i) => clampByte(parseInt(n.slice(i, i + 2), 16)));
}

function clampByte(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(255, Math.round(value))) : 0;
}

export function rgba(hex, alpha) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mix(hex, target, amount) {
  const a = hexRgb(hex);
  const b = hexRgb(target);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * amount)).join(',')})`;
}

function vGrad(g, y0, y1, stops) {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([at, color]) => grad.addColorStop(at, color));
  return grad;
}

// ------------------------------------------------------------
// Player hypercar
// ------------------------------------------------------------

export function createPlayerSprite() {
  return sprite(210, 400, (g, w, h) => {
    const cx = w / 2;

    // ground shadow baked softly under the car
    g.save();
    g.translate(cx, 372);
    g.scale(1, 0.28);
    const sh = g.createRadialGradient(0, 0, 4, 0, 0, 82);
    sh.addColorStop(0, 'rgba(0,0,0,0.62)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.beginPath(); g.arc(0, 0, 82, 0, Math.PI * 2); g.fill();
    g.restore();

    // wheels
    const wheel = (x, y, ww, hh) => {
      g.fillStyle = '#06040e';
      roundRect(g, x, y, ww, hh, 7);
      g.fill();
      g.strokeStyle = 'rgba(72, 96, 140, 0.55)';
      g.lineWidth = 1.2;
      g.stroke();
      g.fillStyle = 'rgba(18, 26, 50, 0.95)';
      roundRect(g, x + 3, y + 5, ww - 6, hh - 10, 5);
      g.fill();
      // glowing rim line
      g.strokeStyle = 'rgba(49,242,255,0.6)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(x + 2, y + 9);
      g.lineTo(x + 2, y + hh - 9);
      g.stroke();
    };
    wheel(39, 84, 22, 54);
    wheel(149, 84, 22, 54);
    wheel(35, 260, 26, 62);
    wheel(149, 260, 26, 62);

    // rear diffuser fins
    g.strokeStyle = 'rgba(42, 20, 76, 0.9)';
    g.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const x = 70 + i * 17;
      g.beginPath(); g.moveTo(x, 344); g.lineTo(x, 368); g.stroke();
    }

    // main body
    const body = new Path2D();
    body.moveTo(cx, 26);
    body.bezierCurveTo(cx + 16, 26, cx + 29, 48, cx + 34, 80);
    body.bezierCurveTo(cx + 40, 108, cx + 53, 139, cx + 55, 185);
    body.bezierCurveTo(cx + 57, 232, cx + 55, 292, cx + 50, 335);
    body.bezierCurveTo(cx + 47, 360, cx + 35, 373, cx + 20, 377);
    body.lineTo(cx - 20, 377);
    body.bezierCurveTo(cx - 35, 373, cx - 47, 360, cx - 50, 335);
    body.bezierCurveTo(cx - 55, 292, cx - 57, 232, cx - 55, 185);
    body.bezierCurveTo(cx - 53, 139, cx - 40, 108, cx - 34, 80);
    body.bezierCurveTo(cx - 29, 48, cx - 16, 26, cx, 26);
    body.closePath();

    g.save();
    g.shadowColor = 'rgba(49,242,255,0.75)';
    g.shadowBlur = 16;
    g.fillStyle = vGrad(g, 20, 380, [
      [0, '#f7ffff'],
      [0.09, '#d7fcff'],
      [0.22, '#8ceaff'],
      [0.38, '#46b7ff'],
      [0.55, '#2c6ce6'],
      [0.72, '#27228f'],
      [0.88, '#1b0c48'],
      [1, '#10052c'],
    ]);
    g.fill(body);
    g.restore();

    // side shading
    g.save();
    g.clip(body);
    const sideL = g.createLinearGradient(50, 0, cx, 0);
    sideL.addColorStop(0, 'rgba(3, 5, 22, 0.72)');
    sideL.addColorStop(0.28, 'rgba(6, 16, 44, 0.16)');
    sideL.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    sideL.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sideL;
    g.fillRect(40, 20, cx - 40, 370);
    const sideR = g.createLinearGradient(w - 50, 0, cx, 0);
    sideR.addColorStop(0, 'rgba(3, 5, 22, 0.72)');
    sideR.addColorStop(0.28, 'rgba(6, 16, 44, 0.16)');
    sideR.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    sideR.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sideR;
    g.fillRect(cx, 20, w - cx - 40, 370);

    // rear heat haze / body vents
    const vent = g.createLinearGradient(0, 300, 0, 370);
    vent.addColorStop(0, 'rgba(5, 4, 20, 0)');
    vent.addColorStop(1, 'rgba(3, 2, 14, 0.75)');
    g.fillStyle = vent;
    g.fillRect(50, 295, w - 100, 82);
    g.restore();

    // body outline
    g.strokeStyle = 'rgba(197, 254, 255, 0.92)';
    g.lineWidth = 2.2;
    g.stroke(body);
    g.strokeStyle = 'rgba(49, 242, 255, 0.5)';
    g.lineWidth = 5;
    g.globalAlpha = 0.35;
    g.stroke(body);
    g.globalAlpha = 1;

    // nose intakes
    g.fillStyle = 'rgba(2, 8, 22, 0.86)';
    g.beginPath();
    g.moveTo(cx - 24, 64); g.lineTo(cx - 12, 50); g.lineTo(cx - 9, 86); g.lineTo(cx - 22, 92);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(cx + 24, 64); g.lineTo(cx + 12, 50); g.lineTo(cx + 9, 86); g.lineTo(cx + 22, 92);
    g.closePath(); g.fill();

    // headlight slits
    const head = (x) => {
      const hg = g.createLinearGradient(0, 40, 0, 60);
      hg.addColorStop(0, '#ffffff');
      hg.addColorStop(0.45, '#b7feff');
      hg.addColorStop(1, '#25baff');
      g.fillStyle = hg;
      g.beginPath();
      g.moveTo(x, 48); g.lineTo(x + 14, 55); g.lineTo(x + 10, 65); g.lineTo(x - 4, 56);
      g.closePath(); g.fill();
    };
    head(cx - 31);
    head(cx + 17);

    // center racing stripe
    const stripe = g.createLinearGradient(0, 30, 0, 330);
    stripe.addColorStop(0, 'rgba(255,255,255,0.9)');
    stripe.addColorStop(0.4, 'rgba(255,255,255,0.55)');
    stripe.addColorStop(0.7, 'rgba(255,255,255,0.08)');
    stripe.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = stripe;
    g.beginPath();
    g.moveTo(cx - 5, 34);
    g.lineTo(cx + 5, 34);
    g.lineTo(cx + 9, 124);
    g.lineTo(cx + 3, 198);
    g.lineTo(cx - 3, 198);
    g.lineTo(cx - 9, 124);
    g.closePath();
    g.fill();

    // cockpit
    const cockpit = new Path2D();
    cockpit.moveTo(cx, 118);
    cockpit.bezierCurveTo(cx + 19, 120, cx + 26, 146, cx + 27, 180);
    cockpit.bezierCurveTo(cx + 27, 208, cx + 17, 228, cx, 236);
    cockpit.bezierCurveTo(cx - 17, 228, cx - 27, 208, cx - 27, 180);
    cockpit.bezierCurveTo(cx - 26, 146, cx - 19, 120, cx, 118);
    cockpit.closePath();
    const cockpitGrad = g.createLinearGradient(0, 118, 0, 236);
    cockpitGrad.addColorStop(0, '#0b2942');
    cockpitGrad.addColorStop(0.4, '#051327');
    cockpitGrad.addColorStop(1, '#020712');
    g.fillStyle = cockpitGrad;
    g.fill(cockpit);
    g.strokeStyle = 'rgba(49,242,255,0.65)';
    g.lineWidth = 1.5;
    g.stroke(cockpit);

    // windshield reflection
    g.save();
    g.clip(cockpit);
    g.globalAlpha = 0.4;
    g.fillStyle = 'rgba(140, 245, 255, 0.55)';
    g.beginPath();
    g.moveTo(cx - 18, 128);
    g.lineTo(cx + 2, 136);
    g.lineTo(cx - 12, 183);
    g.lineTo(cx - 25, 165);
    g.closePath();
    g.fill();
    g.globalAlpha = 0.18;
    g.fillStyle = '#ff2bcc';
    g.fillRect(cx - 30, 200, 60, 8);
    g.restore();

    // cockpit halo frame
    g.strokeStyle = 'rgba(185,254,255,0.35)';
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(cx - 30, 188);
    g.bezierCurveTo(cx - 30, 226, cx - 18, 241, cx, 245);
    g.bezierCurveTo(cx + 18, 241, cx + 30, 226, cx + 30, 188);
    g.stroke();

    // side neon light strips
    const strip = (side) => {
      const x = side < 0 ? 61 : 149;
      g.save();
      g.strokeStyle = 'rgba(255,43,204,0.95)';
      g.shadowColor = '#ff2bcc';
      g.shadowBlur = 12;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + side * 3, 116);
      g.quadraticCurveTo(x + side * 6, 200, x + side * 5, 300);
      g.stroke();
      g.restore();
      g.strokeStyle = 'rgba(185,254,255,0.9)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x + side * 4, 120);
      g.quadraticCurveTo(x + side * 7, 200, x + side * 6, 294);
      g.stroke();
    };
    strip(-1);
    strip(1);

    // rear wing
    const wing = g.createLinearGradient(0, 328, 0, 352);
    wing.addColorStop(0, '#ff86e8');
    wing.addColorStop(0.4, '#b42cff');
    wing.addColorStop(1, '#3a0b6e');
    g.fillStyle = wing;
    roundRect(g, 47, 328, w - 94, 15, 4);
    g.fill();
    g.strokeStyle = 'rgba(255,175,240,0.9)';
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = 'rgba(6,3,18,0.9)';
    roundRect(g, 60, 343, 13, 14, 3); g.fill();
    roundRect(g, w - 73, 343, 13, 14, 3); g.fill();
    g.fillStyle = 'rgba(49,242,255,0.9)';
    g.fillRect(74, 333, 20, 2);
    g.fillRect(w - 94, 333, 20, 2);

    // thruster housings
    const thruster = (x) => {
      g.save();
      g.translate(x, 366);
      g.fillStyle = '#09041a';
      g.beginPath(); g.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2); g.fill();
      const core = g.createRadialGradient(0, 0, 1, 0, 0, 10);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.35, '#8ffcff');
      core.addColorStop(0.7, '#20b8ff');
      core.addColorStop(1, '#6a24ff');
      g.fillStyle = core;
      g.beginPath(); g.ellipse(0, 0, 8, 6.5, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,43,204,0.85)';
      g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    };
    thruster(cx - 21);
    thruster(cx + 21);

    // tail light bar
    g.save();
    g.shadowColor = '#ff2bcc';
    g.shadowBlur = 16;
    g.fillStyle = 'rgba(255, 60, 210, 0.95)';
    roundRect(g, 70, 349, w - 140, 4, 2);
    g.fill();
    g.restore();

    // small hood decal
    g.fillStyle = 'rgba(6, 12, 30, 0.9)';
    g.font = '700 13px Orbitron, sans-serif';
    g.textAlign = 'center';
    g.fillText('07', cx, 104);
    g.fillStyle = 'rgba(185,254,255,0.65)';
    g.font = '700 6px Orbitron, sans-serif';
    g.fillText('NX-09', cx, 112);

    // panel seams
    g.strokeStyle = 'rgba(7, 18, 40, 0.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx - 38, 255); g.lineTo(cx - 8, 262);
    g.moveTo(cx + 38, 255); g.lineTo(cx + 8, 262);
    g.stroke();
  }, 2.6);
}

// ------------------------------------------------------------
// Traffic vehicles
// ------------------------------------------------------------

const TRAFFIC_META = {
  coupe: { w: 176, h: 320 },
  hover: { w: 168, h: 296 },
  truck: { w: 190, h: 380 },
  bike: { w: 96, h: 238 },
};

export function createTrafficSprite(kind, color) {
  const meta = TRAFFIC_META[kind] || TRAFFIC_META.coupe;
  const W = meta.w;
  const H = meta.h;
  const cx = W / 2;

  return sprite(W, H, (g) => {
    const dark = mix(color, '#05010f', 0.62);
    const mid = mix(color, '#05010f', 0.35);
    const light = mix(color, '#ffffff', 0.35);

    // body shadow
    g.save();
    g.translate(cx, H - 16);
    g.scale(1, 0.3);
    const sh = g.createRadialGradient(0, 0, 4, 0, 0, W * 0.44);
    sh.addColorStop(0, 'rgba(0,0,0,0.55)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.beginPath(); g.arc(0, 0, W * 0.44, 0, Math.PI * 2); g.fill();
    g.restore();

    if (kind === 'bike') {
      drawBike(g, W, H, cx, color, dark, light);
    } else if (kind === 'truck') {
      drawTruck(g, W, H, cx, color, dark, mid, light);
    } else if (kind === 'hover') {
      drawHover(g, W, H, cx, color, dark, mid, light);
    } else {
      drawCoupe(g, W, H, cx, color, dark, mid, light);
    }
  }, 2.2);
}

function tailLights(g, x, y, w, h, color) {
  g.save();
  g.shadowColor = '#ff1f4c';
  g.shadowBlur = 14;
  g.fillStyle = 'rgba(255, 56, 72, 0.98)';
  roundRect(g, x, y, w, h, 2);
  g.fill();
  g.restore();
  g.fillStyle = 'rgba(255, 220, 230, 0.9)';
  roundRect(g, x + w * 0.15, y + h * 0.28, w * 0.7, Math.max(1, h * 0.3), 1);
  g.fill();
  // colored accent around the tail bar
  g.strokeStyle = rgba(color, 0.75);
  g.lineWidth = 1;
  g.strokeRect(x - 2, y - 2, w + 4, h + 4);
}

function drawCoupe(g, W, H, cx, color, dark, mid, light) {
  // wheels
  const wheel = (x, y, ww, hh) => {
    g.fillStyle = '#05030d';
    roundRect(g, x, y, ww, hh, 5);
    g.fill();
    g.fillStyle = 'rgba(30, 38, 62, 0.9)';
    roundRect(g, x + 2.5, y + 4, ww - 5, hh - 8, 4);
    g.fill();
  };
  wheel(23, 82, 18, 44);
  wheel(W - 41, 82, 18, 44);
  wheel(21, H - 126, 20, 48);
  wheel(W - 41, H - 126, 20, 48);

  const body = new Path2D();
  body.moveTo(cx, 18);
  body.bezierCurveTo(cx + 17, 20, cx + 26, 44, cx + 31, 78);
  body.bezierCurveTo(cx + 38, 110, cx + 46, 150, cx + 45, 210);
  body.bezierCurveTo(cx + 44, 262, cx + 38, H - 44, cx + 33, H - 20);
  body.lineTo(cx - 33, H - 20);
  body.bezierCurveTo(cx - 38, H - 44, cx - 44, 262, cx - 45, 210);
  body.bezierCurveTo(cx - 46, 150, cx - 38, 110, cx - 31, 78);
  body.bezierCurveTo(cx - 26, 44, cx - 17, 20, cx, 18);
  body.closePath();

  g.fillStyle = vGrad(g, 15, H, [
    [0, light],
    [0.22, color],
    [0.6, mid],
    [0.9, dark],
    [1, mix(dark, '#000000', 0.4)],
  ]);
  g.fill(body);
  g.strokeStyle = rgba(light, 0.8);
  g.lineWidth = 1.5;
  g.stroke(body);

  // cabin
  const cab = new Path2D();
  cab.moveTo(cx, 100);
  cab.bezierCurveTo(cx + 21, 104, cx + 27, 132, cx + 25, 170);
  cab.bezierCurveTo(cx + 23, 198, cx + 14, 210, cx, 214);
  cab.bezierCurveTo(cx - 14, 210, cx - 23, 198, cx - 25, 170);
  cab.bezierCurveTo(cx - 27, 132, cx - 21, 104, cx, 100);
  cab.closePath();
  g.fillStyle = vGrad(g, 100, 214, [[0, '#314a75'], [0.4, '#0a1730'], [1, '#030812']]);
  g.fill(cab);
  g.strokeStyle = 'rgba(180, 230, 255, 0.4)';
  g.lineWidth = 1;
  g.stroke(cab);

  // roof highlight
  g.fillStyle = rgba(light, 0.5);
  roundRect(g, cx - 12, 118, 24, 4, 2);
  g.fill();

  // rear window
  g.fillStyle = 'rgba(10, 26, 48, 0.92)';
  g.beginPath();
  g.moveTo(cx - 20, H - 92);
  g.lineTo(cx + 20, H - 92);
  g.lineTo(cx + 16, H - 58);
  g.lineTo(cx - 16, H - 58);
  g.closePath();
  g.fill();
  g.strokeStyle = rgba(color, 0.6);
  g.stroke();

  // accent side strips
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 9;
  g.strokeStyle = rgba(light, 0.9);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(37, 120); g.lineTo(31, 245);
  g.moveTo(W - 37, 120); g.lineTo(W - 31, 245);
  g.stroke();
  g.restore();

  // headlights
  g.fillStyle = 'rgba(245, 255, 255, 0.95)';
  g.beginPath();
  g.moveTo(cx - 24, 32); g.lineTo(cx - 10, 38); g.lineTo(cx - 12, 46); g.lineTo(cx - 26, 39);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(cx + 24, 32); g.lineTo(cx + 10, 38); g.lineTo(cx + 12, 46); g.lineTo(cx + 26, 39);
  g.closePath(); g.fill();

  // rear spoiler + tail lights
  g.fillStyle = rgba(dark, 0.95);
  roundRect(g, cx - 42, H - 34, 84, 8, 3);
  g.fill();
  g.strokeStyle = rgba(color, 0.8);
  g.lineWidth = 1;
  g.stroke();
  tailLights(g, cx - 38, H - 26, 76, 6, color);
}

function drawTruck(g, W, H, cx, color, dark, mid, light) {
  // wheels
  g.fillStyle = '#05030d';
  [[15, 84, 20, 54], [W - 35, 84, 20, 54], [13, H - 120, 22, 56], [W - 35, H - 120, 22, 56]].forEach(([x, y, ww, hh]) => {
    roundRect(g, x, y, ww, hh, 5); g.fill();
  });

  // cargo body
  const body = new Path2D();
  body.moveTo(cx - 48, 30);
  body.lineTo(cx + 48, 30);
  body.lineTo(cx + 55, 70);
  body.lineTo(cx + 57, H - 30);
  body.lineTo(cx + 44, H - 14);
  body.lineTo(cx - 44, H - 14);
  body.lineTo(cx - 57, H - 30);
  body.lineTo(cx - 55, 70);
  body.closePath();
  g.fillStyle = vGrad(g, 20, H, [
    [0, light],
    [0.12, color],
    [0.3, mid],
    [0.75, dark],
    [1, mix(dark, '#000', 0.3)],
  ]);
  g.fill(body);
  g.strokeStyle = rgba(light, 0.65);
  g.lineWidth = 1.6;
  g.stroke(body);

  // cab window
  g.fillStyle = '#081426';
  roundRect(g, cx - 34, 48, 68, 58, 8);
  g.fill();
  g.strokeStyle = rgba(light, 0.35);
  g.stroke();

  // cargo panels
  g.strokeStyle = rgba(light, 0.22);
  g.lineWidth = 1;
  for (let y = 140; y < H - 50; y += 44) {
    g.beginPath(); g.moveTo(cx - 44, y); g.lineTo(cx + 44, y); g.stroke();
  }
  g.strokeStyle = 'rgba(4, 6, 18, 0.65)';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(cx, 118); g.lineTo(cx, H - 34); g.stroke();

  // neon side rails
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 12;
  g.strokeStyle = rgba(light, 0.9);
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(cx - 51, 120); g.lineTo(cx - 51, H - 40);
  g.moveTo(cx + 51, 120); g.lineTo(cx + 51, H - 40);
  g.stroke();
  g.restore();

  // hazard chevrons at rear
  g.save();
  g.strokeStyle = 'rgba(255, 196, 92, 0.85)';
  g.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const y = H - 78 + i * 12;
    g.beginPath();
    g.moveTo(cx - 34, y); g.lineTo(cx, y + 9); g.lineTo(cx + 34, y);
    g.stroke();
  }
  g.restore();

  tailLights(g, cx - 46, H - 32, 28, 11, color);
  tailLights(g, cx + 18, H - 32, 28, 11, color);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  roundRect(g, cx - 8, H - 30, 16, 7, 2); g.fill();
}

function drawHover(g, W, H, cx, color, dark, mid, light) {
  const body = new Path2D();
  body.moveTo(cx, 22);
  body.bezierCurveTo(cx + 32, 24, cx + 49, 62, cx + 51, 120);
  body.bezierCurveTo(cx + 53, 180, cx + 46, 236, cx + 34, H - 34);
  body.bezierCurveTo(cx + 28, H - 12, cx - 28, H - 12, cx - 34, H - 34);
  body.bezierCurveTo(cx - 46, 236, cx - 53, 180, cx - 51, 120);
  body.bezierCurveTo(cx - 49, 62, cx - 32, 24, cx, 22);
  body.closePath();

  g.fillStyle = vGrad(g, 20, H, [
    [0, light],
    [0.2, color],
    [0.55, mid],
    [0.9, dark],
    [1, mix(dark, '#000', 0.5)],
  ]);
  g.fill(body);
  g.strokeStyle = rgba(light, 0.85);
  g.lineWidth = 1.8;
  g.stroke(body);

  // canopy
  const canopy = new Path2D();
  canopy.moveTo(cx, 82);
  canopy.bezierCurveTo(cx + 26, 92, cx + 33, 140, cx + 27, 190);
  canopy.bezierCurveTo(cx + 21, 226, cx - 21, 226, cx - 27, 190);
  canopy.bezierCurveTo(cx - 33, 140, cx - 26, 92, cx, 82);
  canopy.closePath();
  g.fillStyle = vGrad(g, 82, 226, [[0, '#1c3f6b'], [0.6, '#071329'], [1, '#02060f']]);
  g.fill(canopy);
  g.strokeStyle = 'rgba(150, 245, 255, 0.4)';
  g.lineWidth = 1.2;
  g.stroke(canopy);

  // glowing hover rings
  const ring = (x, y, rad) => {
    g.save();
    g.translate(x, y);
    g.shadowColor = color;
    g.shadowBlur = 16;
    g.strokeStyle = rgba(light, 0.9);
    g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 0, rad, rad * 0.42, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 0.8;
    g.beginPath(); g.ellipse(0, 0, rad * 0.62, rad * 0.26, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
  };
  ring(cx - 44, 110, 16);
  ring(cx + 44, 110, 16);
  ring(cx - 43, H - 96, 18);
  ring(cx + 43, H - 96, 18);

  // center line
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 10;
  g.strokeStyle = rgba(light, 0.8);
  g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(cx, 46); g.lineTo(cx, 76); g.stroke();
  g.restore();

  tailLights(g, cx - 26, H - 44, 52, 7, color);
}

function drawBike(g, W, H, cx, color, dark, light) {
  // front/rear wheel
  g.fillStyle = '#04020b';
  roundRect(g, cx - 8, 30, 16, 54, 8); g.fill();
  roundRect(g, cx - 10, H - 68, 20, 56, 9); g.fill();
  g.strokeStyle = 'rgba(90,110,150,0.6)';
  g.lineWidth = 1;
  roundRect(g, cx - 8, 30, 16, 54, 8); g.stroke();
  roundRect(g, cx - 10, H - 68, 20, 56, 9); g.stroke();

  // frame
  const body = new Path2D();
  body.moveTo(cx, 48);
  body.bezierCurveTo(cx + 17, 66, cx + 22, 120, cx + 18, 168);
  body.bezierCurveTo(cx + 15, 206, cx + 10, H - 50, cx + 7, H - 28);
  body.lineTo(cx - 7, H - 28);
  body.bezierCurveTo(cx - 10, H - 50, cx - 15, 206, cx - 18, 168);
  body.bezierCurveTo(cx - 22, 120, cx - 17, 66, cx, 48);
  body.closePath();
  g.fillStyle = vGrad(g, 40, H, [[0, light], [0.35, color], [0.75, dark], [1, mix(dark, '#000', 0.3)]]);
  g.fill(body);
  g.strokeStyle = rgba(light, 0.75);
  g.lineWidth = 1.2;
  g.stroke(body);

  // rider
  g.fillStyle = '#07101e';
  g.beginPath();
  g.ellipse(cx, 128, 19, 30, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = rgba(light, 0.5);
  g.lineWidth = 1.2;
  g.stroke();
  // helmet
  g.fillStyle = vGrad(g, 104, 132, [[0, '#e8feff'], [0.5, color], [1, dark]]);
  g.beginPath();
  g.ellipse(cx, 112, 13, 16, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(49,242,255,0.75)';
  g.stroke();
  // visor
  g.fillStyle = 'rgba(49,242,255,0.85)';
  g.beginPath();
  g.ellipse(cx, 106, 8, 5, 0, 0, Math.PI * 2);
  g.fill();

  // arms
  g.strokeStyle = '#0b1a2e';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(cx - 14, 128); g.lineTo(cx - 12, 82);
  g.moveTo(cx + 14, 128); g.lineTo(cx + 12, 82);
  g.stroke();

  // side thrusters
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 12;
  g.strokeStyle = rgba(light, 0.9);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx - 13, 160); g.lineTo(cx - 13, 208);
  g.moveTo(cx + 13, 160); g.lineTo(cx + 13, 208);
  g.stroke();
  g.restore();

  tailLights(g, cx - 9, H - 34, 18, 6, color);
}

// ------------------------------------------------------------
// Pickups
// ------------------------------------------------------------

export function createPickupSprite(kind) {
  const palette = {
    coin: { a: '#ffd36b', b: '#ff9a1f', glow: '#ffb020' },
    orb: { a: '#c9feff', b: '#22d7ff', glow: '#31f2ff' },
    surge: { a: '#fff0ff', b: '#ff2bcc', glow: '#ff2bcc' },
  }[kind] || { a: '#fff', b: '#31f2ff', glow: '#31f2ff' };

  return sprite(112, 112, (g, w) => {
    const cx = w / 2;
    const cy = w / 2;

    // halo
    const halo = g.createRadialGradient(cx, cy, 2, cx, cy, 54);
    halo.addColorStop(0, rgba(palette.glow, 0.6));
    halo.addColorStop(0.32, rgba(palette.glow, 0.24));
    halo.addColorStop(0.72, rgba(palette.glow, 0.05));
    halo.addColorStop(1, rgba(palette.glow, 0));
    g.fillStyle = halo;
    g.beginPath(); g.arc(cx, cy, 54, 0, Math.PI * 2); g.fill();

    if (kind === 'coin') {
      // credit chip: hexagonal coin
      const hex = (r) => {
        const p = new Path2D();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i - Math.PI / 2;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * 1.06;
          if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
        }
        p.closePath();
        return p;
      };
      g.save();
      g.shadowColor = palette.glow;
      g.shadowBlur = 16;
      const face = g.createLinearGradient(cx - 26, cy - 26, cx + 26, cy + 26);
      face.addColorStop(0, '#fff3c4');
      face.addColorStop(0.35, palette.a);
      face.addColorStop(0.75, palette.b);
      face.addColorStop(1, '#b85a00');
      g.fillStyle = face;
      g.fill(hex(27));
      g.restore();
      g.strokeStyle = 'rgba(255, 244, 200, 0.95)';
      g.lineWidth = 2.2;
      g.stroke(hex(27));
      g.strokeStyle = 'rgba(120, 58, 0, 0.6)';
      g.lineWidth = 1.2;
      g.stroke(hex(20));
      // inner glyph
      g.fillStyle = 'rgba(70, 30, 0, 0.62)';
      g.beginPath();
      g.moveTo(cx - 9, cy - 10);
      g.lineTo(cx + 9, cy - 10);
      g.lineTo(cx + 9, cy + 3);
      g.lineTo(cx, cy + 11);
      g.lineTo(cx - 9, cy + 3);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255, 246, 210, 0.9)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(cx - 5, cy - 4); g.lineTo(cx + 5, cy - 4);
      g.moveTo(cx, cy - 4); g.lineTo(cx, cy + 5);
      g.stroke();
      // sparkle
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath(); g.arc(cx - 15, cy - 16, 2.2, 0, Math.PI * 2); g.fill();
    } else {
      // energy orb with orbital rings
      g.save();
      g.translate(cx, cy);
      g.rotate(-0.35);
      g.strokeStyle = rgba(palette.a, 0.65);
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(0, 0, 31, 12, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rgba(palette.b, 0.5);
      g.lineWidth = 1;
      g.beginPath(); g.ellipse(0, 0, 34, 15, 0.8, 0, Math.PI * 2); g.stroke();
      g.restore();

      const core = g.createRadialGradient(cx - 5, cy - 7, 2, cx, cy, 22);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.3, palette.a);
      core.addColorStop(0.68, palette.b);
      core.addColorStop(1, rgba(palette.b, 0.05));
      g.fillStyle = core;
      g.beginPath(); g.arc(cx, cy, 22, 0, Math.PI * 2); g.fill();

      // hex shield
      const hex = new Path2D();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + Math.PI / 6;
        const x = cx + Math.cos(a) * 25;
        const y = cy + Math.sin(a) * 25;
        if (i === 0) hex.moveTo(x, y); else hex.lineTo(x, y);
      }
      hex.closePath();
      g.strokeStyle = rgba(palette.a, 0.85);
      g.lineWidth = 1.6;
      g.stroke(hex);
      g.strokeStyle = rgba(palette.b, 0.45);
      g.lineWidth = 4;
      g.globalAlpha = 0.4;
      g.stroke(hex);
      g.globalAlpha = 1;

      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath(); g.arc(cx - 7, cy - 9, 3, 0, Math.PI * 2); g.fill();
    }
  }, 2.4);
}

// ------------------------------------------------------------
// Utility glows
// ------------------------------------------------------------

export function createGlow(color, size = 160, strength = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const c = size / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, rgba(color, strength));
  grad.addColorStop(0.22, rgba(color, strength * 0.62));
  grad.addColorStop(0.55, rgba(color, strength * 0.15));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return canvas;
}

export function createSparkTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.25, rgba(color, 0.95));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return canvas;
}

export function createDebrisSprite(color) {
  return sprite(22, 22, (g) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(11, 1); g.lineTo(21, 8); g.lineTo(17, 20); g.lineTo(4, 18); g.lineTo(1, 7);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = 1;
    g.stroke();
  }, 2);
}

export const TRAFFIC_COLORS = [
  '#ff2bcc', '#ff7a2b', '#b8ff4a', '#9d5cff', '#ff3d6e', '#31f2ff', '#ffc45c',
];
