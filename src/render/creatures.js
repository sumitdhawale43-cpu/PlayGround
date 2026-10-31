import { clamp, rgba, roundRect } from '../utils.js';
import { zoneAtY } from '../world.js';

const CREATURE_COLORS = {
  shark: { body: '#2e6571', dark: '#123a48', light: '#7ba6a9', belly: '#b6d2cf' },
  angler: { body: '#1b2730', dark: '#070e14', light: '#42606a', glow: '#9cf7ff' },
  guardian: { body: '#20141f', dark: '#07050a', light: '#54364f', glow: '#ffbd7a' },
  eel: { body: '#1c2d2f', dark: '#071012', light: '#4d7d76', glow: '#7dffd6' },
};

function visible(r, x, y, pad = 180) {
  return x > r.cam.x - r.viewW / 2 - pad && x < r.cam.x + r.viewW / 2 + pad
    && y > r.cam.y - r.viewH / 2 - pad && y < r.cam.y + r.viewH / 2 + pad;
}

function glow(r, x, y, radius, color, alpha) {
  const { ctx } = r;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSchools(r, game) {
  const { ctx, time } = r;
  for (const school of game.world.schools) {
    if (!visible(r, school.x, school.y, 260)) continue;
    const dir = school.dir;
    ctx.save();
    for (let i = 0; i < school.count; i++) {
      const t = time * 1.2 + i * 0.8 + school.phase;
      const ox = (i - school.count / 2) * 12 + Math.sin(t * 1.3) * 6;
      const oy = Math.sin(t * 1.7 + i) * 8 + (i % 3 - 1) * 5;
      const x = school.x + ox;
      const y = school.y + oy;
      const scale = 0.75 + (i % 3) * 0.16;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir * scale, scale);
      ctx.rotate(Math.sin(t * 2 + i) * 0.08);
      if (school.type === 'gold') ctx.fillStyle = 'rgba(255, 203, 120, 0.8)';
      else if (school.type === 'lantern') ctx.fillStyle = 'rgba(130, 168, 196, 0.8)';
      else ctx.fillStyle = 'rgba(168, 219, 224, 0.72)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-13, -4.5);
      ctx.lineTo(-12, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(6, 22, 28, 0.8)';
      ctx.beginPath();
      ctx.arc(4, -0.7, 0.9, 0, Math.PI * 2);
      ctx.fill();
      if (school.type === 'lantern') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(130, 246, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(2, 3.2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

export function drawCreatures(r, game) {
  const { ctx, time } = r;
  for (const c of game.creatures) {
    if (!visible(r, c.x, c.y, c.size * 3 + 160)) continue;
    if (c.type === 'jelly') drawJelly(r, c, time);
    else if (c.type === 'shark') drawShark(r, c, time);
    else if (c.type === 'angler') drawAngler(r, c, time, false);
    else if (c.type === 'guardian') drawAngler(r, c, time, true);
    else if (c.type === 'eel') drawEel(r, c, time);
    else if (c.type === 'ray') drawRay(r, c, time);
    else if (c.type === 'urchin') drawUrchin(r, c, time);

    if (c.stun > 0) drawStun(r, c, time);
  }
}

function drawJelly(r, c, time) {
  const { ctx } = r;
  const pulse = 1 + Math.sin(c.phase * 1.4) * 0.07;
  const color = c.glow === 'violet' ? '#b69bff' : c.glow === 'amber' ? '#ffb36b' : '#7ef6ff';
  ctx.save();
  ctx.translate(c.x, c.y);
  glow(r, 0, 0, c.size * 2.6, color, 0.16);

  // Tentacles.
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const base = (i - 2.5) * c.size * 0.28;
    const sway = Math.sin(time * 1.2 + i * 1.4 + c.phase) * 12;
    const len = c.tentacle * (0.6 + (i % 3) * 0.2);
    ctx.strokeStyle = rgba(color, 0.36);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(base, c.size * 0.5);
    ctx.bezierCurveTo(base + sway * 0.4, c.size + len * 0.3, base - sway, c.size + len * 0.7, base + sway * 0.6, c.size + len);
    ctx.stroke();
    // Tentacle light beads.
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 1; j <= 3; j++) {
      const t = j / 4;
      const x = base + Math.sin(time * 1.2 + i + j) * 8 * t;
      const y = c.size * 0.5 + len * t;
      ctx.fillStyle = rgba(color, 0.3 - t * 0.05);
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Bell.
  ctx.scale(pulse, pulse);
  const bell = ctx.createLinearGradient(0, -c.size, 0, c.size);
  bell.addColorStop(0, rgba(color, 0.75));
  bell.addColorStop(0.55, rgba(color, 0.26));
  bell.addColorStop(1, rgba(color, 0.08));
  ctx.fillStyle = bell;
  ctx.beginPath();
  ctx.moveTo(-c.size, 4);
  ctx.bezierCurveTo(-c.size * 1.05, -c.size * 1.1, c.size * 1.05, -c.size * 1.1, c.size, 4);
  ctx.quadraticCurveTo(c.size * 0.55, c.size * 0.65, 0, c.size * 0.55);
  ctx.quadraticCurveTo(-c.size * 0.55, c.size * 0.65, -c.size, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.55);
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Inner organs.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const a = time * 0.8 + i * 1.6;
    ctx.fillStyle = rgba(color, 0.24);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * c.size * 0.3, Math.sin(a) * c.size * 0.15, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(color, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, c.size * 0.72, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.restore();
}

function drawShark(r, c, time) {
  const { ctx } = r;
  const col = CREATURE_COLORS.shark;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.dir, 1);
  ctx.rotate(clamp(c.vy / 600, -0.35, 0.35));
  const wag = Math.sin(time * 5.2 + c.phase) * 6;

  // Body.
  const body = ctx.createLinearGradient(0, -22, 0, 22);
  body.addColorStop(0, col.light);
  body.addColorStop(0.4, col.body);
  body.addColorStop(1, col.belly);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(58, 0);
  ctx.quadraticCurveTo(42, -19, 8, -20);
  ctx.quadraticCurveTo(-34, -18, -62, wag * 0.25);
  ctx.quadraticCurveTo(-38, 18, 8, 20);
  ctx.quadraticCurveTo(44, 18, 58, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 24, 31, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Tail.
  ctx.fillStyle = col.body;
  ctx.beginPath();
  ctx.moveTo(-58, 0);
  ctx.lineTo(-96, -24 + wag);
  ctx.lineTo(-80, 1);
  ctx.lineTo(-96, 24 + wag);
  ctx.closePath();
  ctx.fill();

  // Dorsal fin.
  ctx.fillStyle = col.dark;
  ctx.beginPath();
  ctx.moveTo(6, -19);
  ctx.lineTo(-16, -54);
  ctx.lineTo(-34, -18);
  ctx.closePath();
  ctx.fill();
  // Pectoral fin.
  ctx.beginPath();
  ctx.moveTo(10, 17);
  ctx.lineTo(-8, 48);
  ctx.lineTo(-26, 18);
  ctx.closePath();
  ctx.fill();

  // Gill slits.
  ctx.strokeStyle = 'rgba(8, 35, 43, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(22 + i * 5, -10);
    ctx.quadraticCurveTo(25 + i * 5, 0, 22 + i * 5, 10);
    ctx.stroke();
  }

  // Eye.
  ctx.fillStyle = '#e9f5ef';
  ctx.beginPath();
  ctx.arc(40, -6, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#071115';
  ctx.beginPath();
  ctx.arc(41, -6, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(41.7, -6.7, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Teeth.
  ctx.strokeStyle = 'rgba(232, 245, 239, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 4);
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(52 - i * 3, 4 + (i % 2 ? 2.5 : 0));
  }
  ctx.stroke();

  // Scars.
  ctx.strokeStyle = 'rgba(178, 210, 206, 0.24)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-8, -12);
  ctx.lineTo(3, -5);
  ctx.moveTo(-14, 8);
  ctx.lineTo(-3, 14);
  ctx.stroke();

  if (c.state === 'chase') {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(52, 0, 0, 52, 0, 30);
    g.addColorStop(0, 'rgba(255, 130, 110, 0.14)');
    g.addColorStop(1, 'rgba(255, 130, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(52, 0, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAngler(r, c, time, guardian) {
  const { ctx } = r;
  const col = guardian ? CREATURE_COLORS.guardian : CREATURE_COLORS.angler;
  const size = c.size;
  const open = 0.5 + Math.sin(time * 1.3 + c.phase) * 0.12;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.dir, 1);
  ctx.rotate(clamp(c.vy / 700, -0.2, 0.2));

  if (guardian) glow(r, 0, 0, size * 3.4, col.glow, 0.09);

  // Tail.
  ctx.fillStyle = col.dark;
  ctx.beginPath();
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(-size * 1.55, -size * 0.42);
  ctx.lineTo(-size * 1.32, 0);
  ctx.lineTo(-size * 1.55, size * 0.42);
  ctx.closePath();
  ctx.fill();

  // Body.
  const body = ctx.createRadialGradient(-size * 0.2, -size * 0.35, size * 0.1, 0, 0, size * 1.35);
  body.addColorStop(0, col.light);
  body.addColorStop(0.45, col.body);
  body.addColorStop(1, col.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.1, size * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Jaw.
  ctx.fillStyle = '#05080b';
  ctx.beginPath();
  ctx.moveTo(size * 0.55, -size * 0.18);
  ctx.quadraticCurveTo(size * 1.35, -size * 0.1, size * 1.18, size * 0.22);
  ctx.quadraticCurveTo(size * 0.8, size * 0.45, size * 0.45, size * 0.2);
  ctx.closePath();
  ctx.fill();

  // Teeth.
  ctx.fillStyle = 'rgba(235, 242, 225, 0.82)';
  for (let i = 0; i < 7; i++) {
    const x = size * 0.62 + i * size * 0.075;
    const y = -size * 0.1 + Math.sin(i * 0.9) * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * 0.035, y + size * (0.09 + open * 0.04));
    ctx.lineTo(x + size * 0.07, y);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const x = size * 0.7 + i * size * 0.085;
    const y = size * 0.16;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * 0.03, y - size * 0.075);
    ctx.lineTo(x + size * 0.065, y);
    ctx.closePath();
    ctx.fill();
  }

  // Eye.
  ctx.fillStyle = 'rgba(226, 246, 238, 0.85)';
  ctx.beginPath();
  ctx.arc(size * 0.35, -size * 0.3, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#071013';
  ctx.beginPath();
  ctx.arc(size * 0.37, -size * 0.3, size * 0.075, 0, Math.PI * 2);
  ctx.fill();

  // Fins.
  ctx.fillStyle = col.dark;
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, -size * 0.75);
  ctx.lineTo(-size * 0.55, -size * 1.18);
  ctx.lineTo(-size * 0.65, -size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.05, size * 0.7);
  ctx.lineTo(-size * 0.35, size * 1.15);
  ctx.lineTo(-size * 0.6, size * 0.6);
  ctx.closePath();
  ctx.fill();

  // Lure.
  ctx.strokeStyle = 'rgba(180, 205, 200, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, -size * 0.8);
  ctx.quadraticCurveTo(size * 0.35, -size * 1.65, size * 0.75, -size * 1.5);
  ctx.stroke();
  const lx = size * 0.75;
  const ly = -size * 1.5;
  glow(r, lx, ly, size * (guardian ? 1.2 : 0.8), col.glow, 0.5);
  ctx.fillStyle = '#fffef0';
  ctx.beginPath();
  ctx.arc(lx, ly, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  if (guardian) {
    // Crown of smaller lures.
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.5;
      const x = Math.cos(a) * size * 0.75;
      const y = Math.sin(a) * size * 0.75 - size * 0.2;
      glow(r, x, y, size * 0.42, col.glow, 0.4);
      ctx.fillStyle = '#ffe8c2';
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ancient markings.
    ctx.strokeStyle = 'rgba(255, 189, 122, 0.28)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-size * 0.15, 0, size * (0.25 + i * 0.14), -0.9, 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEel(r, c, time) {
  const { ctx } = r;
  const col = CREATURE_COLORS.eel;
  const len = c.size * 4;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  const segments = 14;
  const amp = c.state === 'lunge' ? 8 : 15;
  const speed = c.state === 'lunge' ? 14 : 5.5;
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const x = -t * len;
    const y = Math.sin(time * speed - t * 4.2 + c.phase) * amp * t;
    pts.push([x, y]);
  }
  // Body segments, back to front.
  for (let i = segments - 1; i >= 0; i--) {
    const t = i / (segments - 1);
    const [x, y] = pts[i];
    const rad = (1 - t) * c.size * 0.55 + 1.5;
    const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.4, 0, x, y, rad * 1.3);
    g.addColorStop(0, col.light);
    g.addColorStop(0.5, col.body);
    g.addColorStop(1, col.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(col.glow, 0.18);
      ctx.beginPath();
      ctx.arc(x, y - rad * 0.2, rad * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  // Head.
  const [hx, hy] = pts[0];
  ctx.fillStyle = col.body;
  ctx.beginPath();
  ctx.ellipse(hx + 4, hy, c.size * 0.8, c.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jaw.
  const jaw = c.state === 'lunge' ? 0.55 : 0.1;
  ctx.strokeStyle = 'rgba(180, 220, 210, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx + 18, hy + 1);
  ctx.lineTo(hx + 34, hy + 2 + jaw * 6);
  ctx.stroke();
  ctx.fillStyle = '#061012';
  ctx.beginPath();
  ctx.moveTo(hx + 18, hy + 1);
  ctx.lineTo(hx + 34, hy + 2 + jaw * 6);
  ctx.lineTo(hx + 22, hy + 6);
  ctx.closePath();
  ctx.fill();
  // Eye.
  glow(r, hx + 12, hy - 4, 9, col.glow, 0.4);
  ctx.fillStyle = '#dffdf3';
  ctx.beginPath();
  ctx.arc(hx + 12, hy - 4, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#061010';
  ctx.beginPath();
  ctx.arc(hx + 12.6, hy - 4, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRay(r, c, time) {
  const { ctx } = r;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.dir, 1);
  ctx.rotate(c.angle || 0);
  const flap = Math.sin(time * 2.1 + c.phase) * 0.5;
  const s = c.size;
  const g = ctx.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, 'rgba(88, 118, 120, 0.7)');
  g.addColorStop(1, 'rgba(26, 47, 51, 0.85)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.15);
  ctx.quadraticCurveTo(-s * 0.7, -s * (0.7 + flap), -s * 1.1, -s * 0.18);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.28, 0, s * 0.12);
  ctx.quadraticCurveTo(s * 0.5, s * 0.28, s * 1.1, -s * 0.18);
  ctx.quadraticCurveTo(s * 0.7, -s * (0.7 + flap), 0, -s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 200, 196, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Tail.
  ctx.strokeStyle = 'rgba(82, 116, 114, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, 0);
  ctx.quadraticCurveTo(-s * 1.6, s * 0.25, -s * 2.1, s * 0.08);
  ctx.stroke();
  // Eyes.
  ctx.fillStyle = 'rgba(200, 232, 226, 0.7)';
  ctx.beginPath();
  ctx.arc(s * 0.1, -s * 0.16, 2, 0, Math.PI * 2);
  ctx.arc(s * 0.1, s * 0.16, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawUrchin(r, c, time) {
  const { ctx } = r;
  ctx.save();
  ctx.translate(c.x, c.y);
  const spikes = 18;
  ctx.strokeStyle = 'rgba(94, 44, 88, 0.85)';
  ctx.lineWidth = 2;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + Math.sin(time * 0.6 + c.phase) * 0.04;
    const len = c.size * (1.4 + (i % 3) * 0.25);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * c.size * 0.5, Math.sin(a) * c.size * 0.5);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
    if (i % 4 === 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 110, 180, 0.45)';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * len, Math.sin(a) * len, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  const g = ctx.createRadialGradient(-c.size * 0.3, -c.size * 0.3, 1, 0, 0, c.size);
  g.addColorStop(0, '#6e2b5f');
  g.addColorStop(1, '#200a22');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, c.size * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStun(r, c, time) {
  const { ctx } = r;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(150, 235, 255, ${0.18 + Math.sin(time * 8) * 0.08})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const rr = c.size * (1.3 + i * 0.28);
    ctx.beginPath();
    ctx.arc(0, 0, rr, time * 1.5 + i * 2, time * 1.5 + i * 2 + 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
