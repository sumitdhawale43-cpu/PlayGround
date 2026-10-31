/* ============================================================
   Procedural textures + sprites. Everything is generated at
   runtime so the game has zero external assets.
   ============================================================ */

import { mulberry32 } from './maze.js';

const TEX = 128;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function packCanvas(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    w: canvas.width,
    h: canvas.height,
    data: new Uint32Array(img.data.buffer.slice(0)),
    rgba: img.data,
  };
}

function grainPixels(ctx, w, h, rand, amount) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (rand() - 0.5) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.9));
  }
  ctx.putImageData(img, 0, 0);
}

function blotches(ctx, w, h, rand, count, colors, alpha = 0.12, minR = 4, maxR = 20) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w, y = rand() * h;
    const r = minR + rand() * (maxR - minR);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = colors[(rand() * colors.length) | 0];
    g.addColorStop(0, `rgba(${col},${alpha})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function cracks(ctx, rand, count, color = 'rgba(8,8,10,0.45)', w = TEX, h = TEX) {
  for (let i = 0; i < count; i++) {
    let x = rand() * w, y = rand() * h;
    ctx.strokeStyle = color;
    ctx.lineWidth = rand() < 0.75 ? 0.7 : 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 3 + (rand() * 5) | 0;
    let ang = rand() * Math.PI * 2;
    for (let s = 0; s < segs; s++) {
      ang += (rand() - 0.5) * 1.5;
      const len = 2 + rand() * 9;
      x += Math.cos(ang) * len;
      y += Math.sin(ang) * len;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/* ---------------- wall materials ---------------- */

function concrete(rand, base = [43, 43, 48], tint = [0, 0, 0]) {
  const c = makeCanvas(TEX, TEX);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, TEX, TEX);

  blotches(ctx, TEX, TEX, rand, 42, ['30,30,33', '54,52,50', '22,24,26', '61,58,52'], 0.13, 5, 26);

  // Form-work seams at the very top and bottom.
  ctx.fillStyle = 'rgba(10,10,12,0.34)';
  ctx.fillRect(0, 0, TEX, 1);
  ctx.fillRect(0, TEX - 1, TEX, 1);
  ctx.fillStyle = 'rgba(120,116,106,0.05)';
  ctx.fillRect(0, 3, TEX, 1);

  // Vertical drip stains.
  for (let i = 0; i < 10; i++) {
    const x = rand() * TEX;
    const w = 1 + rand() * 5;
    const grad = ctx.createLinearGradient(0, 0, 0, TEX);
    grad.addColorStop(0, 'rgba(12,12,14,0.05)');
    grad.addColorStop(0.6, 'rgba(12,12,14,0.2)');
    grad.addColorStop(1, 'rgba(8,8,10,0.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, rand() * 20, w, TEX);
  }

  cracks(ctx, rand, 7);

  // Grime along the bottom edge.
  const g = ctx.createLinearGradient(0, TEX * 0.62, 0, TEX);
  g.addColorStop(0, 'rgba(10,10,11,0)');
  g.addColorStop(1, 'rgba(7,7,8,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, TEX * 0.62, TEX, TEX * 0.38);

  grainPixels(ctx, TEX, TEX, rand, 16);
  return packCanvas(c).data;
}

function wallpaper(rand) {
  const c = makeCanvas(TEX, TEX);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'rgb(64,61,48)';
  ctx.fillRect(0, 0, TEX, TEX);

  // Vertical stripes.
  for (let x = 0; x < TEX; x += 16) {
    ctx.fillStyle = 'rgba(28,29,23,0.28)';
    ctx.fillRect(x, 0, 7, TEX);
    ctx.fillStyle = 'rgba(112,104,80,0.09)';
    ctx.fillRect(x + 9, 0, 2, TEX);
  }

  // Damask diamonds.
  ctx.strokeStyle = 'rgba(112,104,80,0.2)';
  ctx.lineWidth = 1;
  for (let y = -16; y < TEX + 16; y += 38) {
    for (let x = 8; x < TEX; x += 32) {
      const ox = ((y / 38) & 1) ? 16 : 0;
      ctx.beginPath();
      ctx.moveTo(x + ox, y);
      ctx.lineTo(x + 10 + ox, y + 12);
      ctx.lineTo(x + ox, y + 24);
      ctx.lineTo(x - 10 + ox, y + 12);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + ox, y + 12, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Peeling patches reveal the concrete behind.
  for (let i = 0; i < 9; i++) {
    const x = rand() * TEX, y = rand() * TEX;
    const r = 4 + rand() * 15;
    ctx.fillStyle = 'rgba(48,48,50,0.9)';
    ctx.beginPath();
    const pts = 7 + ((rand() * 6) | 0);
    for (let p = 0; p < pts; p++) {
      const a = (p / pts) * Math.PI * 2;
      const rr = r * (0.55 + rand() * 0.7);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,17,16,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Water damage.
  for (let i = 0; i < 8; i++) {
    const x = rand() * TEX, y = TEX * (0.5 + rand() * 0.5);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 10 + rand() * 18);
    g.addColorStop(0, 'rgba(38,34,24,0.4)');
    g.addColorStop(1, 'rgba(38,34,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX, TEX);
  }

  const g = ctx.createLinearGradient(0, TEX * 0.6, 0, TEX);
  g.addColorStop(0, 'rgba(10,10,9,0)');
  g.addColorStop(1, 'rgba(8,8,7,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, TEX * 0.6, TEX, TEX * 0.4);

  grainPixels(ctx, TEX, TEX, rand, 15);
  return packCanvas(c).data;
}

function metal(rand) {
  const c = makeCanvas(TEX, TEX);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'rgb(38,42,46)';
  ctx.fillRect(0, 0, TEX, TEX);

  // Panels.
  for (let y = 0; y < TEX; y += 32) {
    for (let x = 0; x < TEX; x += 32) {
      ctx.fillStyle = `rgba(${52 + (rand() * 12) | 0},${56 + (rand() * 12) | 0},${60 + (rand() * 12) | 0},0.35)`;
      ctx.fillRect(x + 2, y + 2, 28, 28);
      ctx.strokeStyle = 'rgba(8,10,11,0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, 30, 30);
    }
  }
  // Rivets.
  ctx.fillStyle = 'rgba(120,126,128,0.35)';
  for (let y = 4; y < TEX; y += 32) {
    for (let x = 4; x < TEX; x += 32) {
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 24, y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + 24, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 24, y + 24, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Rust runs.
  for (let i = 0; i < 7; i++) {
    const x = rand() * TEX, y = rand() * TEX * 0.7;
    const g = ctx.createLinearGradient(0, y, 0, y + 30 + rand() * 40);
    g.addColorStop(0, 'rgba(98,54,32,0.55)');
    g.addColorStop(1, 'rgba(68,36,22,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1 + rand() * 4, 60);
  }
  blotches(ctx, TEX, TEX, rand, 18, ['20,22,24', '70,72,70'], 0.12, 4, 18);
  grainPixels(ctx, TEX, TEX, rand, 12);
  return packCanvas(c).data;
}

function graffiti(rand) {
  const c = makeCanvas(TEX, TEX);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'rgb(36,36,41)';
  ctx.fillRect(0, 0, TEX, TEX);
  blotches(ctx, TEX, TEX, rand, 34, ['22,22,25', '52,50,48'], 0.15, 5, 24);
  cracks(ctx, rand, 9);
  const g = ctx.createLinearGradient(0, TEX * 0.55, 0, TEX);
  g.addColorStop(0, 'rgba(8,8,9,0)');
  g.addColorStop(1, 'rgba(6,6,7,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, TEX * 0.55, TEX, TEX * 0.45);

  ctx.save();
  ctx.translate(TEX / 2, TEX / 2);
  ctx.rotate(-0.09);
  ctx.fillStyle = 'rgba(118,24,18,0.72)';
  ctx.textAlign = 'center';
  ctx.font = '700 17px "Courier New", monospace';
  ctx.fillText("DON'T", 0, -18);
  ctx.font = '700 21px "Courier New", monospace';
  ctx.fillText('LOOK', 0, 6);
  ctx.font = '700 17px "Courier New", monospace';
  ctx.fillText('BACK', 0, 28);
  // Drips.
  ctx.fillStyle = 'rgba(104,20,16,0.45)';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(-40 + rand() * 80, 28 + rand() * 4, 1, 4 + rand() * 16);
  }
  ctx.restore();
  grainPixels(ctx, TEX, TEX, rand, 16);
  return packCanvas(c).data;
}

/* ---------------- floor + ceiling ---------------- */

function floorTexture(rand) {
  const c = makeCanvas(TEX, TEX);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'rgb(31,31,33)';
  ctx.fillRect(0, 0, TEX, TEX);

  // Large slabs.
  for (let y = 0; y < TEX; y += 64) {
    for (let x = 0; x < TEX; x += 64) {
      ctx.fillStyle = `rgba(${40 + (rand() * 8) | 0},${40 + (rand() * 8) | 0},${42 + (rand() * 8) | 0},0.5)`;
      ctx.fillRect(x + 1, y + 1, 62, 62);
      ctx.strokeStyle = 'rgba(9,9,10,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, 62, 62);
    }
  }
  blotches(ctx, TEX, TEX, rand, 55, ['22,22,24', '58,56,52', '17,19,20'], 0.16, 4, 28);
  cracks(ctx, rand, 16, 'rgba(5,5,6,0.55)');
  // Dust.
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(${120 + (rand() * 50) | 0},${115 + (rand() * 40) | 0},${100 + (rand() * 40) | 0},${rand() * 0.09})`;
    ctx.fillRect(rand() * TEX, rand() * TEX, 1, 1);
  }
  grainPixels(ctx, TEX, TEX, rand, 14);
  return packCanvas(c).data;
}

function ceilingTexture(rand) {
  const c = makeCanvas(TEX, TEX);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'rgb(22,23,25)';
  ctx.fillRect(0, 0, TEX, TEX);
  blotches(ctx, TEX, TEX, rand, 30, ['12,13,14', '40,40,40'], 0.15, 6, 30);
  cracks(ctx, rand, 10, 'rgba(4,4,5,0.5)');
  for (let i = 0; i < 6; i++) {
    const x = rand() * TEX, y = rand() * TEX;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 8 + rand() * 20);
    g.addColorStop(0, 'rgba(56,50,28,0.13)');
    g.addColorStop(1, 'rgba(56,50,28,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX, TEX);
  }
  grainPixels(ctx, TEX, TEX, rand, 10);
  return packCanvas(c).data;
}

/* ---------------- sprites ---------------- */

function drawMonster(ctx, W, H, pose = 'idle') {
  ctx.clearRect(0, 0, W, H);
  const s = W / 100;
  const cx = W / 2;

  ctx.save();
  ctx.scale(s, s * (H / (W * 2.1))); // normalized 100x210 canvas
  const unit = 100 / W; // not used, keep proportions

  const body = '#07080a';
  const rim = 'rgba(94,101,100,0.55)';
  const pale = '#8c8a7e';
  const paleDark = '#51514a';

  // legs
  ctx.strokeStyle = body;
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(45, 112); ctx.lineTo(40, 150); ctx.lineTo(38, 194);
  ctx.moveTo(55, 112); ctx.lineTo(60, 150); ctx.lineTo(61, 194);
  ctx.stroke();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(38, 194); ctx.lineTo(40, 150);
  ctx.moveTo(61, 194); ctx.lineTo(60, 150);
  ctx.stroke();

  // torso
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(38, 52);
  ctx.bezierCurveTo(31, 66, 33, 92, 40, 118);
  ctx.bezierCurveTo(47, 124, 53, 124, 60, 118);
  ctx.bezierCurveTo(67, 92, 69, 66, 62, 52);
  ctx.closePath();
  ctx.fill();
  // ribs
  ctx.strokeStyle = 'rgba(120,124,118,0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 68 + i * 8;
    ctx.beginPath();
    ctx.moveTo(39, y);
    ctx.quadraticCurveTo(47, y + 4, 56, y + 1);
    ctx.stroke();
  }
  // rim light
  ctx.strokeStyle = rim;
  ctx.beginPath();
  ctx.moveTo(38, 53);
  ctx.bezierCurveTo(31, 66, 33, 92, 40, 118);
  ctx.stroke();

  // arms
  ctx.strokeStyle = body;
  ctx.lineWidth = 6;
  if (pose === 'scream') {
    ctx.beginPath();
    ctx.moveTo(38, 56); ctx.quadraticCurveTo(18, 62, 10, 40);
    ctx.moveTo(62, 56); ctx.quadraticCurveTo(82, 62, 90, 40);
    ctx.stroke();
    // clawed fingers
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(10, 40); ctx.lineTo(2, 28);
    ctx.moveTo(10, 40); ctx.lineTo(8, 25);
    ctx.moveTo(10, 40); ctx.lineTo(16, 26);
    ctx.moveTo(90, 40); ctx.lineTo(98, 28);
    ctx.moveTo(90, 40); ctx.lineTo(92, 25);
    ctx.moveTo(90, 40); ctx.lineTo(84, 26);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(37, 56); ctx.quadraticCurveTo(22, 78, 26, 112);
    ctx.lineTo(20, 152);
    ctx.moveTo(63, 56); ctx.quadraticCurveTo(78, 78, 74, 112);
    ctx.lineTo(80, 152);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(20 + i * 2.2, 152); ctx.lineTo(16 + i * 3.2, 166 + (i & 1) * 3);
      ctx.moveTo(80 - i * 2.2, 152); ctx.lineTo(84 - i * 3.2, 166 + (i & 1) * 3);
    }
    ctx.stroke();
  }

  // neck
  ctx.fillStyle = body;
  ctx.fillRect(45, 42, 10, 15);

  // head, tilted
  ctx.save();
  ctx.translate(cx / s, 31);
  if (pose === 'scream') ctx.scale(1.16, 1.16);
  ctx.rotate(pose === 'scream' ? -0.07 : 0.11);
  const hw = pose === 'scream' ? 11.8 : 9.2;
  const hh = pose === 'scream' ? 19.5 : 17.5;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 1, hw + 3.4, hh + 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gaunt, tapered face.
  const face = new Path2D();
  face.moveTo(0, -hh);
  face.bezierCurveTo(hw * 1.02, -hh * 0.82, hw * 0.88, hh * 0.3, 0, hh);
  face.bezierCurveTo(-hw * 0.88, hh * 0.3, -hw * 1.02, -hh * 0.82, 0, -hh);
  const fg = ctx.createLinearGradient(-hw * 0.4, -hh, hw * 0.5, hh);
  fg.addColorStop(0, '#98958a');
  fg.addColorStop(0.42, '#7b796f');
  fg.addColorStop(1, '#41423c');
  ctx.fillStyle = fg;
  ctx.fill(face);
  ctx.strokeStyle = 'rgba(10,11,10,0.78)';
  ctx.lineWidth = 1.2;
  ctx.stroke(face);

  // Hollow cheeks and temples.
  ctx.fillStyle = 'rgba(26,27,25,0.4)';
  ctx.beginPath();
  ctx.ellipse(-hw * 0.54, hh * 0.38, hw * 0.24, hh * 0.34, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hw * 0.54, hh * 0.38, hw * 0.24, hh * 0.34, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(18,19,18,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.55, hw * 0.74, hh * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sunken sockets: long angled wounds rather than round eyes.
  const eyeY = -hh * 0.13;
  const eyeSpread = hw * 0.53;
  const sockets = [
    { x: -eyeSpread, y: eyeY, rx: hw * 0.28, ry: hh * 0.28, rot: 0.3 },
    { x: eyeSpread, y: eyeY, rx: hw * 0.26, ry: hh * 0.26, rot: -0.27 },
  ];
  for (const sck of sockets) {
    ctx.save();
    ctx.translate(sck.x, sck.y);
    ctx.rotate(sck.rot);
    ctx.fillStyle = '#030404';
    ctx.beginPath();
    ctx.ellipse(0, 0, sck.rx, sck.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(56,58,52,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -sck.ry * 0.55, sck.rx * 0.8, sck.ry * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    const pr = pose === 'scream' ? 1.05 : 0.8;
    ctx.fillStyle = 'rgba(202,197,178,0.6)';
    ctx.beginPath();
    ctx.arc(0, sck.ry * 0.06, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Nose slits.
  ctx.fillStyle = 'rgba(22,23,21,0.65)';
  ctx.beginPath();
  ctx.ellipse(-1.7, hh * 0.19, 0.8, 2.4, 0.3, 0, Math.PI * 2);
  ctx.ellipse(1.7, hh * 0.19, 0.8, 2.4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Dark tears.
  ctx.strokeStyle = 'rgba(12,13,12,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-eyeSpread + 0.8, eyeY + hh * 0.24);
  ctx.lineTo(-eyeSpread + 1.4, hh * 0.74);
  ctx.moveTo(eyeSpread - 0.8, eyeY + hh * 0.22);
  ctx.lineTo(eyeSpread - 1.1, hh * 0.58);
  ctx.stroke();

  // Mouth.
  if (pose === 'scream') {
    ctx.fillStyle = '#040505';
    ctx.beginPath();
    ctx.ellipse(0, hh * 0.55, hw * 0.43, hh * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(148,143,124,0.55)';
    for (let i = -2; i <= 2; i++) {
      const x = i * hw * 0.16;
      ctx.beginPath();
      ctx.moveTo(x - 0.7, hh * 0.26);
      ctx.lineTo(x + 0.5, hh * 0.4);
      ctx.lineTo(x + 1.6, hh * 0.26);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(130,126,110,0.5)';
    for (let i = -1; i <= 1; i++) {
      const x = i * hw * 0.22 + 0.6;
      ctx.beginPath();
      ctx.moveTo(x - 0.7, hh * 0.84);
      ctx.lineTo(x + 0.4, hh * 0.69);
      ctx.lineTo(x + 1.5, hh * 0.84);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#060707';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.42, hh * 0.38);
    ctx.lineTo(-hw * 0.14, hh * 0.43);
    ctx.lineTo(0, hh * 0.38);
    ctx.lineTo(hw * 0.18, hh * 0.45);
    ctx.lineTo(hw * 0.42, hh * 0.4);
    ctx.lineTo(hw * 0.16, hh * 0.6);
    ctx.lineTo(-hw * 0.02, hh * 0.53);
    ctx.lineTo(-hw * 0.2, hh * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,21,19,0.65)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Cracks and a hairline split.
  ctx.strokeStyle = 'rgba(30,30,28,0.55)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.7, -hh * 0.6);
  ctx.lineTo(-hw * 0.5, -hh * 0.35);
  ctx.lineTo(-hw * 0.6, -hh * 0.1);
  ctx.moveTo(hw * 0.55, -hh * 0.75);
  ctx.lineTo(hw * 0.4, -hh * 0.5);
  ctx.moveTo(hw * 0.1, -hh * 0.95);
  ctx.lineTo(-hw * 0.05, -hh * 0.55);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // Fine grain so the pixels feel photographed rather than drawn.
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const rand = mulberry32(999);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const lum = d[i] + d[i + 1] + d[i + 2];
    const n = (rand() - 0.5) * (lum > 90 ? 14 : 4);
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function makeMonster(pose = 'idle', w = 90, h = 189) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  drawMonster(ctx, w, h, pose);
  return c;
}

function sigilSprite() {
  const S = 72;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const cx = S / 2, cy = S / 2;

  // halo
  const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, S / 2);
  halo.addColorStop(0, 'rgba(255,236,190,0.32)');
  halo.addColorStop(0.4, 'rgba(255,220,150,0.12)');
  halo.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = 'rgba(255,240,206,0.92)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 24);
  ctx.lineTo(cx + 19, cy);
  ctx.lineTo(cx, cy + 24);
  ctx.lineTo(cx - 19, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,206,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 18);
  ctx.lineTo(cx + 14, cy);
  ctx.lineTo(cx, cy + 18);
  ctx.lineTo(cx - 14, cy);
  ctx.closePath();
  ctx.stroke();

  // rune
  ctx.strokeStyle = 'rgba(255,250,230,0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx, cy + 12);
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 7, cy - 2);
  ctx.moveTo(cx, cy + 1);
  ctx.lineTo(cx - 7, cy + 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,244,210,0.9)';
  ctx.beginPath(); ctx.arc(cx, cy - 12, 1.7, 0, Math.PI * 2); ctx.fill();
  return packCanvas(c);
}

function portalSprite() {
  const W = 72, H = 128;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const cx = W / 2;
  const arch = new Path2D();
  arch.moveTo(8, H);
  arch.lineTo(8, 44);
  arch.quadraticCurveTo(cx, -10, W - 8, 44);
  arch.lineTo(W - 8, H);

  // A cold breath of light held inside the arch, not a lit doorway.
  const inner = ctx.createLinearGradient(0, 8, 0, H);
  inner.addColorStop(0, 'rgba(255,255,255,0.015)');
  inner.addColorStop(0.55, 'rgba(255,255,255,0.05)');
  inner.addColorStop(0.9, 'rgba(255,255,255,0.13)');
  inner.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = inner;
  ctx.fill(arch);

  // Something breathing at the threshold.
  const low = ctx.createRadialGradient(cx, H - 8, 1, cx, H - 8, 30);
  low.addColorStop(0, 'rgba(255,255,255,0.30)');
  low.addColorStop(0.45, 'rgba(255,255,255,0.08)');
  low.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = low;
  ctx.beginPath();
  ctx.ellipse(cx, H - 6, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Halo around the arch.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 7;
  ctx.shadowColor = 'rgba(220,255,250,0.85)';
  ctx.shadowBlur = 12;
  ctx.stroke(arch);
  ctx.restore();

  // The arch itself: thin, wavering, barely holding together.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.82)';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = 'rgba(200,255,246,0.9)';
  ctx.shadowBlur = 5;
  ctx.stroke(arch);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(11, H - 10);
  ctx.lineTo(11, 45);
  ctx.quadraticCurveTo(cx, -6, W - 12, 45);
  ctx.stroke();

  // Motes drifting up through the frame.
  const rand = mulberry32(771);
  for (let i = 0; i < 26; i++) {
    const x = 14 + rand() * (W - 28);
    const y = 18 + rand() * (H - 28);
    const a = 0.06 + rand() * 0.24;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, rand() < 0.3 ? 1.4 : 0.8, 0.8 + rand() * 1.8);
  }

  // Faint vertical streaks rising from the floor.
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const x = 20 + rand() * (W - 40);
    const y = H - 14 - rand() * 30;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 2, y - 8 - rand() * 18);
    ctx.stroke();
  }
  return packCanvas(c);
}

function jumpscareSprite() {
  const W = 1200, H = 800;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const rand = mulberry32(606);

  // The dark behind it.
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 30, W / 2, H * 0.48, W * 0.72);
  bg.addColorStop(0, '#131211');
  bg.addColorStop(0.5, '#080809');
  bg.addColorStop(1, '#020203');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Shoulders and a thin neck swallowed by the dark.
  ctx.fillStyle = '#050506';
  ctx.beginPath();
  ctx.moveTo(110, H);
  ctx.bezierCurveTo(240, 640, 390, 570, 545, 552);
  ctx.lineTo(655, 552);
  ctx.bezierCurveTo(810, 570, 960, 640, 1090, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#08090a';
  ctx.fillRect(548, 430, 104, 170);

  ctx.save();
  ctx.translate(W / 2, 335);
  ctx.rotate(-0.045);
  ctx.scale(1.42, 1.42);

  const hw = 238, hh = 286;
  // Skull mass behind the face.
  const rim = ctx.createRadialGradient(-70, -100, 20, 0, 0, hh * 1.5);
  rim.addColorStop(0, 'rgba(150,147,134,0.42)');
  rim.addColorStop(0.6, 'rgba(70,70,64,0.25)');
  rim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, 0, hw * 1.18, hh * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gaunt, tapered face.
  const face = new Path2D();
  face.moveTo(0, -hh);
  face.bezierCurveTo(hw * 1.06, -hh * 0.82, hw * 0.86, hh * 0.34, 0, hh);
  face.bezierCurveTo(-hw * 0.86, hh * 0.34, -hw * 1.06, -hh * 0.82, 0, -hh);
  const fg = ctx.createLinearGradient(-hw * 0.55, -hh, hw * 0.6, hh);
  fg.addColorStop(0, '#7b786e');
  fg.addColorStop(0.22, '#4c4c45');
  fg.addColorStop(0.52, '#262724');
  fg.addColorStop(0.8, '#101110');
  fg.addColorStop(1, '#2e2e2a');
  ctx.fillStyle = fg;
  ctx.fill(face);
  ctx.strokeStyle = 'rgba(6,7,7,0.85)';
  ctx.lineWidth = 5;
  ctx.stroke(face);

  // Uneven light across the skin, so it reads as a face rather than a mask.
  ctx.save();
  ctx.clip(face);
  const light = ctx.createRadialGradient(-hw * 0.62, -hh * 0.5, 10, -hw * 0.24, 0, hh * 1.2);
  light.addColorStop(0, 'rgba(232,227,207,0.4)');
  light.addColorStop(0.32, 'rgba(0,0,0,0)');
  light.addColorStop(0.68, 'rgba(0,0,0,0.46)');
  light.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = light;
  ctx.fillRect(-hw * 1.2, -hh * 1.2, hw * 2.4, hh * 2.4);
  for (let i = 0; i < 1600; i++) {
    const px = (rand() - 0.5) * hw * 2.1;
    const py = (rand() - 0.5) * hh * 2.1;
    const a = 0.02 + rand() * 0.14;
    ctx.fillStyle = rand() < 0.6 ? `rgba(20,21,18,${a})` : `rgba(220,214,194,${a * 0.5})`;
    ctx.fillRect(px, py, 1, 1 + rand() * 2);
  }
  ctx.strokeStyle = 'rgba(24,25,22,0.25)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) {
    const x = (rand() - 0.5) * hw * 1.8;
    const y = (rand() - 0.5) * hh * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 50, y + rand() * 40);
    ctx.stroke();
  }
  // The jaw catches a little light below the maw.
  const chin = ctx.createRadialGradient(0, hh * 0.84, 4, 0, hh * 0.82, hw * 1.05);
  chin.addColorStop(0, 'rgba(176,170,150,0.38)');
  chin.addColorStop(0.55, 'rgba(110,107,94,0.16)');
  chin.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = chin;
  ctx.beginPath();
  ctx.ellipse(0, hh * 0.84, hw * 0.66, hh * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Something red is breathing on it from below.
  const under = ctx.createRadialGradient(0, hh * 0.95, 10, 0, hh * 0.7, hw * 1.7);
  under.addColorStop(0, 'rgba(132,32,22,0.26)');
  under.addColorStop(0.5, 'rgba(72,18,14,0.12)');
  under.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = under;
  ctx.fillRect(-hw * 1.2, -hh * 1.2, hw * 2.4, hh * 2.4);
  ctx.restore();

  // A tear down one cheek.
  ctx.strokeStyle = 'rgba(200,194,174,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hw * 0.62, hh * 0.02);
  ctx.lineTo(hw * 0.5, hh * 0.16);
  ctx.lineTo(hw * 0.58, hh * 0.3);
  ctx.lineTo(hw * 0.46, hh * 0.44);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(12,13,12,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hw * 0.63, hh * 0.03);
  ctx.lineTo(hw * 0.51, hh * 0.17);
  ctx.lineTo(hw * 0.59, hh * 0.31);
  ctx.lineTo(hw * 0.47, hh * 0.45);
  ctx.stroke();

  // Hollow temples and cheeks.
  ctx.fillStyle = 'rgba(22,23,21,0.42)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * hw * 0.54, -hh * 0.18, hw * 0.22, hh * 0.34, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * hw * 0.5, hh * 0.42, hw * 0.2, hh * 0.3, -side * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(15,16,15,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.62, hw * 0.74, hh * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye sockets: two long, unequal wounds.
  const eyes = [
    { x: -hw * 0.42, y: -hh * 0.16, rx: hw * 0.18, ry: hh * 0.27, rot: 0.36 },
    { x: hw * 0.42, y: -hh * 0.19, rx: hw * 0.15, ry: hh * 0.23, rot: -0.26 },
  ];
  for (const e of eyes) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot);
    const socket = new Path2D();
    socket.moveTo(-e.rx * 1.12, -e.ry * 0.28);
    socket.bezierCurveTo(-e.rx * 0.95, -e.ry * 1.18, e.rx * 0.55, -e.ry * 1.12, e.rx * 1.06, -e.ry * 0.12);
    socket.bezierCurveTo(e.rx * 0.92, e.ry * 0.72, -e.rx * 0.25, e.ry * 0.92, -e.rx * 0.96, e.ry * 0.34);
    socket.closePath();
    ctx.fillStyle = '#020303';
    ctx.fill(socket);
    ctx.strokeStyle = 'rgba(120,118,106,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke(socket);
    // A lid half-closed over the wound.
    ctx.fillStyle = 'rgba(50,50,45,0.55)';
    ctx.beginPath();
    ctx.moveTo(-e.rx * 1.12, -e.ry * 0.42);
    ctx.quadraticCurveTo(-e.rx * 0.1, -e.ry * 0.92, e.rx * 1.08, -e.ry * 0.3);
    ctx.lineTo(e.rx * 1.06, -e.ry * 0.7);
    ctx.quadraticCurveTo(-e.rx * 0.1, -e.ry * 1.32, -e.rx * 1.1, -e.ry * 0.78);
    ctx.closePath();
    ctx.fill();
    // A wet glint under the lid.
    ctx.fillStyle = 'rgba(72,74,67,0.4)';
    ctx.beginPath();
    ctx.ellipse(-e.rx * 0.12, -e.ry * 0.52, e.rx * 0.42, e.ry * 0.11, 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Vertical slit pupil, fixed on the viewer.
    ctx.fillStyle = 'rgba(196,190,171,0.7)';
    ctx.beginPath();
    ctx.ellipse(e.rx * 0.1, e.ry * 0.14, 1.7, e.ry * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(236,231,212,0.75)';
    ctx.fillRect(e.rx * 0.1 - 0.9, e.ry * 0.02, 1.8, 3);
    // A thin crease above the socket, lost in the shadow.
    ctx.strokeStyle = 'rgba(24,25,22,0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-e.rx * 1.02, -e.ry * 0.78);
    ctx.quadraticCurveTo(0, -e.ry * 1.4, e.rx * 1.02, -e.ry * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  // A curtain of wet hair, or maybe just the dark, hides half the face.
  const veil = new Path2D();
  veil.moveTo(hw * 0.05, -hh * 1.15);
  veil.lineTo(hw * 1.2, -hh * 1.24);
  veil.lineTo(hw * 1.2, hh * 1.2);
  veil.lineTo(hw * 0.78, hh * 0.72);
  veil.lineTo(hw * 0.54, hh * 0.18);
  veil.lineTo(hw * 0.34, -hh * 0.24);
  veil.lineTo(hw * 0.28, -hh * 0.72);
  veil.closePath();
  ctx.fillStyle = 'rgba(3,4,4,0.92)';
  ctx.fill(veil);
  ctx.strokeStyle = 'rgba(96,94,84,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hw * 0.05, -hh * 1.15);
  ctx.lineTo(hw * 0.28, -hh * 0.72);
  ctx.lineTo(hw * 0.34, -hh * 0.24);
  ctx.lineTo(hw * 0.54, hh * 0.18);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(3,4,4,0.85)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(hw * 0.58, hh * 0.05);
  ctx.quadraticCurveTo(hw * 0.5, hh * 0.4, hw * 0.58, hh * 0.72);
  ctx.stroke();

  // Nose slits.
  ctx.fillStyle = 'rgba(18,19,17,0.7)';
  ctx.beginPath();
  ctx.ellipse(-16, hh * 0.2, 7, 18, 0.3, 0, Math.PI * 2);
  ctx.ellipse(16, hh * 0.2, 7, 18, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // The scream: a torn, vertical maw.
  const mw = hw * 0.44, mh = hh * 0.3;
  const my = hh * 0.47;
  const mouth = new Path2D();
  mouth.moveTo(-mw * 0.94, my - mh * 0.28);
  mouth.bezierCurveTo(-mw * 0.9, my - mh * 1.12, mw * 0.55, my - mh * 1.2, mw * 0.82, my - mh * 0.5);
  mouth.bezierCurveTo(mw * 1.08, my + mh * 0.18, mw * 0.7, my + mh * 0.98, mw * 0.08, my + mh * 1.02);
  mouth.bezierCurveTo(-mw * 0.62, my + mh * 1.06, -mw * 1.08, my + mh * 0.42, -mw * 0.94, my - mh * 0.28);
  const throat = ctx.createRadialGradient(0, my + mh * 0.3, 3, 0, my, mw * 1.35);
  throat.addColorStop(0, '#010101');
  throat.addColorStop(0.52, '#050404');
  throat.addColorStop(1, '#1e1916');
  ctx.fillStyle = throat;
  ctx.fill(mouth);
  ctx.strokeStyle = 'rgba(12,12,10,0.9)';
  ctx.lineWidth = 9;
  ctx.stroke(mouth);
  // Wet inner lip.
  ctx.strokeStyle = 'rgba(154,148,129,0.2)';
  ctx.lineWidth = 3;
  ctx.stroke(mouth);

  // Ragged teeth, uneven and too few.
  ctx.fillStyle = 'rgba(158,152,134,0.52)';
  const upper = [-0.62, -0.2, 0.18, 0.55];
  for (let i = 0; i < upper.length; i++) {
    const tx = upper[i] * mw;
    const top = my - mh * (0.93 - Math.abs(upper[i]) * 0.2);
    const len = mh * (0.22 + (i % 3) * 0.07);
    ctx.beginPath();
    ctx.moveTo(tx - 7, top);
    ctx.lineTo(tx + 1, top + len);
    ctx.lineTo(tx + 9, top + 1);
    ctx.fill();
  }
  // One broken lower fang.
  ctx.fillStyle = 'rgba(132,127,111,0.42)';
  const tx = -mw * 0.6;
  const bot = my + mh * 0.84;
  ctx.beginPath();
  ctx.moveTo(tx - 7, bot);
  ctx.lineTo(tx + 1, bot - mh * 0.2);
  ctx.lineTo(tx + 9, bot - 1);
  ctx.fill();
  // A tongue, barely visible in the dark.
  ctx.fillStyle = 'rgba(78,34,30,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, my + mh * 0.55, mw * 0.5, mh * 0.25, 0.06, 0, Math.PI * 2);
  ctx.fill();
  // A pale lower lip defines the jaw.
  ctx.strokeStyle = 'rgba(150,144,126,0.26)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-mw * 0.9, my + mh * 0.34);
  ctx.quadraticCurveTo(0, my + mh * 1.16, mw * 0.9, my + mh * 0.32);
  ctx.stroke();
  // Saliva threads.
  ctx.strokeStyle = 'rgba(190,184,162,0.18)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-mw * 0.55, my - mh * 0.2);
  ctx.lineTo(-mw * 0.5, my + mh * 0.42);
  ctx.moveTo(mw * 0.62, my - mh * 0.1);
  ctx.lineTo(mw * 0.55, my + mh * 0.3);
  ctx.stroke();

  // Dark tears running from the sockets.
  ctx.strokeStyle = 'rgba(8,9,8,0.55)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.45, -hh * 0.08);
  ctx.quadraticCurveTo(-hw * 0.5, hh * 0.18, -hw * 0.38, hh * 0.46);
  ctx.moveTo(hw * 0.45, -hh * 0.1);
  ctx.quadraticCurveTo(hw * 0.5, hh * 0.2, hw * 0.4, hh * 0.4);
  ctx.stroke();

  // Hairline cracks across the forehead.
  ctx.strokeStyle = 'rgba(22,23,21,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.62, -hh * 0.66);
  ctx.lineTo(-hw * 0.42, -hh * 0.48);
  ctx.lineTo(-hw * 0.5, -hh * 0.28);
  ctx.moveTo(hw * 0.18, -hh * 0.95);
  ctx.lineTo(hw * 0.05, -hh * 0.7);
  ctx.moveTo(hw * 0.58, -hh * 0.7);
  ctx.lineTo(hw * 0.4, -hh * 0.52);
  ctx.stroke();
  ctx.restore();

  // Photographic grain.
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * (d[i] > 90 ? 16 : 7);
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // Crush the image into a broken transmission: harsh light, torn scanlines,
  // chromatic split and a vignette that swallows the edges.
  const src = new Uint8ClampedArray(d);
  for (let y = 0; y < H; y++) {
    const row = y * W * 4;
    const dy = (y - H / 2) / (H / 2);
    for (let x = 0; x < W; x++) {
      const o = row + x * 4;
      const dx = (x - W / 2) / (W / 2);
      let v = (src[o] * 0.3 + src[o + 1] * 0.59 + src[o + 2] * 0.11) / 255;
      v = (v - 0.26) * 1.62 + 0.38;
      if (v < 0) v = 0; else if (v > 1) v = 1;
      const vig = Math.max(0, 1 - (dx * dx * 0.55 + dy * dy * 0.45));
      v *= 0.52 + vig * 0.48;
      const rShift = x + 3 < W ? src[row + (x + 3) * 4] : 0;
      const bShift = x > 3 ? src[row + (x - 3) * 4 + 2] : 0;
      d[o] = Math.min(255, v * 258 + rShift * 0.08 + 10);
      d[o + 1] = Math.min(255, v * 230);
      d[o + 2] = Math.min(255, v * 208 + bShift * 0.05);
      if (y % 3 === 0) {
        d[o] *= 0.84; d[o + 1] *= 0.84; d[o + 2] *= 0.84;
      }
    }
  }
  // Horizontal tears.
  for (let i = 0; i < 11; i++) {
    const y0 = (rand() * H) | 0;
    const bh = 2 + ((rand() * 26) | 0);
    const shift = ((rand() - 0.5) * 90) | 0;
    for (let y = y0; y < Math.min(H, y0 + bh); y++) {
      const row = y * W * 4;
      if (shift > 0) {
        for (let x = W - 1; x >= shift; x--) {
          const o = row + x * 4;
          const s = row + (x - shift) * 4;
          d[o] = d[s]; d[o + 1] = d[s + 1]; d[o + 2] = d[s + 2];
        }
        for (let x = 0; x < shift; x++) {
          const o = row + x * 4;
          d[o] = 2; d[o + 1] = 2; d[o + 2] = 3;
        }
      } else if (shift < 0) {
        const sh = -shift;
        for (let x = 0; x < W - sh; x++) {
          const o = row + x * 4;
          const s = row + (x + sh) * 4;
          d[o] = d[s]; d[o + 1] = d[s + 1]; d[o + 2] = d[s + 2];
        }
      }
    }
  }
  // A few blown-out specks.
  for (let i = 0; i < 260; i++) {
    const o = ((rand() * W * H) | 0) * 4;
    const v = 130 + rand() * 120;
    d[o] = v; d[o + 1] = v; d[o + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function glowSprite() {
  const S = 96;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return packCanvas(c);
}

function eyesSprite() {
  const W = 64, H = 22;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  for (const x of [20, 44]) {
    const g = ctx.createRadialGradient(x, 11, 0, x, 11, 12);
    g.addColorStop(0, 'rgba(240,240,220,0.95)');
    g.addColorStop(0.16, 'rgba(230,230,210,0.7)');
    g.addColorStop(0.45, 'rgba(180,190,170,0.16)');
    g.addColorStop(1, 'rgba(180,190,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,10,10,0.8)';
    ctx.beginPath();
    ctx.ellipse(x, 11, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(250,250,240,1)';
    ctx.beginPath();
    ctx.arc(x, 11, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  return packCanvas(c);
}

export function createTextures(seed = 20261031) {
  const rand = mulberry32(seed);
  const walls = [null];
  walls[1] = concrete(rand);
  walls[2] = wallpaper(rand);
  walls[3] = metal(rand);
  walls[4] = graffiti(rand);

  const monsterCanvas = makeMonster('idle', 96, 202);
  const screamCanvas = makeMonster('scream', 240, 504);
  const jumpscareCanvas = jumpscareSprite();

  return {
    wall: walls,
    floor: floorTexture(rand),
    ceiling: ceilingTexture(rand),
    sprites: {
      monster: packCanvas(monsterCanvas),
      scream: packCanvas(screamCanvas),
      sigil: sigilSprite(),
      portal: portalSprite(),
      glow: glowSprite(),
      eyes: eyesSprite(),
    },
    jumpscareUrl: jumpscareCanvas.toDataURL('image/png'),
  };
}
