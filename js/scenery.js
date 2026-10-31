// SHADOW NINJA — procedural Japanese night scenery with parallax and neon

import { TAU, rand, pick, clamp, lerp, mulberry32, rgba, roundRect } from './utils.js';
import { GROUND_Y, WORLD_W } from './utils.js';

const KANJI = ['影', '忍', '侍', '月', '夜', '鬼', '夢', '刃', '風', '心', '雨', '桜'];

function makeGlow(color, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, color);
  grd.addColorStop(0.35, color.replace(/[\d.]+\)$/, '0.42)'));
  grd.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeLantern(color) {
  const c = document.createElement('canvas');
  c.width = 56;
  c.height = 84;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 10, 0, 72);
  grd.addColorStop(0, '#2a0d10');
  grd.addColorStop(0.25, color);
  grd.addColorStop(0.55, '#ffe3aa');
  grd.addColorStop(0.8, color);
  grd.addColorStop(1, '#24080c');
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(28, 42, 16, 27, 0, 0, TAU);
  g.fill();
  g.strokeStyle = 'rgba(40,10,10,0.5)';
  g.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.ellipse(28, 42, 16 - Math.abs(i) * 0.6, 27, 0, 0, TAU);
    g.stroke();
  }
  g.strokeStyle = 'rgba(20,6,6,0.9)';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(16, 16); g.lineTo(40, 16);
  g.moveTo(17, 69); g.lineTo(39, 69);
  g.stroke();
  g.fillStyle = 'rgba(255,120,80,0.9)';
  g.fillRect(26, 69, 4, 10);
  return c;
}

export class Scenery {
  constructor() {
    const rng = mulberry32(9271);
    this.rand = rng;
    this.viewW = 1280;
    this.viewH = 720;
    this.extraY = 0;
    this.time = 0;

    this.glowWarm = makeGlow('rgba(255,150,80,0.85)');
    this.glowRed = makeGlow('rgba(255,60,90,0.85)');
    this.glowCyan = makeGlow('rgba(70,240,230,0.8)');
    this.glowMoon = makeGlow('rgba(255,235,205,0.55)');
    this.lanternSprites = [makeLantern('#e85736'), makeLantern('#d94a62'), makeLantern('#e9903f')];

    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: rng(), y: rng() * 0.62, r: 0.5 + rng() * 1.7,
        phase: rng() * TAU, speed: 0.5 + rng() * 1.6,
      });
    }

    this.ridges = [];
    const ridgeCols = ['#0b0a1c', '#0d0b21', '#100d26', '#090814'];
    for (let l = 0; l < 4; l++) {
      const pts = [];
      const base = 120 + l * 36;
      const amp = 120 - l * 20;
      for (let x = -300; x <= WORLD_W + 1400; x += 90) {
        const n =
          Math.sin(x * 0.0018 + l * 1.7) * 0.5 +
          Math.sin(x * 0.0043 + l * 2.9) * 0.28 +
          Math.sin(x * 0.011 + l) * 0.12;
        pts.push({ x, y: base + n * amp });
      }
      this.ridges.push({ pts, color: ridgeCols[l], factor: 0.035 + l * 0.012, alpha: 0.85 - l * 0.08 });
    }

    this.buildings = [];
    for (let i = 0; i < 34; i++) {
      const x = -300 + i * 155 + rng() * 70;
      const w = 60 + rng() * 120;
      const h = 40 + rng() * 200;
      const win = [];
      const cols = 2 + ((rng() * 4) | 0);
      const rows = 2 + ((rng() * 5) | 0);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rng() < 0.42) win.push({ x: c / cols, y: r / rows, warm: rng() < 0.7 });
        }
      }
      this.buildings.push({
        x, w, h, win,
        tiered: rng() < 0.28,
        alpha: 0.7 + rng() * 0.3,
      });
    }

    this.signs = [];
    for (let i = 0; i < 11; i++) {
      const color = pick(['#ff4560', '#45f0e0', '#ffcf6b', '#ff7b9c']);
      this.signs.push({
        x: -150 + i * 330 + rng() * 150,
        y: 320 + rng() * 110,
        w: 20 + rng() * 12,
        h: 76 + rng() * 90,
        char: pick(KANJI),
        color,
        phase: rng() * TAU,
        speed: 0.7 + rng() * 2.4,
        flicker: rng() < 0.25,
      });
    }

    this.pagodas = [
      { x: 280, s: 1.15, factor: 0.16 },
      { x: 1560, s: 0.85, factor: 0.19 },
      { x: 2720, s: 1.05, factor: 0.18 },
    ];

    this.torii = [
      { x: 900, s: 1, factor: 0.27 },
      { x: 2360, s: 0.82, factor: 0.29 },
    ];

    this.bamboo = [];
    for (let i = 0; i < 46; i++) {
      const cluster = rng() < 0.5 ? 0 : 1;
      this.bamboo.push({
        x: -100 + i * 95 + rng() * 60,
        h: 200 + rng() * 260,
        w: 4 + rng() * 7,
        lean: (rng() - 0.5) * 0.12,
        phase: rng() * TAU,
        alpha: 0.25 + rng() * 0.4,
        cluster,
      });
    }

    this.strings = [
      { x: -300, y: 205, len: 1900, sag: 90, factor: 0.33, count: 12, phase: rng() * 10 },
      { x: 1450, y: 245, len: 1700, sag: 70, factor: 0.36, count: 10, phase: rng() * 10 },
    ];

    this.petals = [];
    for (let i = 0; i < 34; i++) {
      this.petals.push({
        x: Math.random() * 1600,
        y: Math.random() * 760,
        s: rand(1.5, 4),
        vy: rand(12, 34),
        phase: rand(0, TAU),
        spin: rand(-2, 2),
        rot: rand(0, TAU),
        alpha: rand(0.25, 0.7),
      });
    }

    this.rain = [];
    for (let i = 0; i < 100; i++) {
      this.rain.push({
        x: Math.random() * 1600,
        y: Math.random() * 760,
        len: rand(9, 26),
        speed: rand(680, 1100),
        alpha: rand(0.05, 0.19),
      });
    }

    this.fireflies = [];
    for (let i = 0; i < 16; i++) {
      this.fireflies.push({
        x: rand(0, WORLD_W), y: rand(GROUND_Y - 180, GROUND_Y - 10),
        phase: rand(0, TAU), speed: rand(0.5, 1.4), r: rand(0.8, 2),
      });
    }

    this.fogOffsets = [0, 0.33, 0.66];
  }

  resize(viewW, viewH, extraY) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.extraY = extraY;
  }

  update(dt, camX) {
    this.time += dt;
    const w = this.viewW;
    const h = this.viewH;
    for (const p of this.petals) {
      p.y += p.vy * dt;
      p.x += Math.sin(this.time * 0.7 + p.phase) * 18 * dt + 14 * dt;
      p.rot += p.spin * dt;
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      if (p.x > w + 30) p.x = -20;
      if (p.x < -30) p.x = w + 20;
    }
    for (const r of this.rain) {
      r.y += r.speed * dt;
      r.x += r.speed * 0.12 * dt;
      if (r.y > h + 30) { r.y = -40; r.x = Math.random() * w; }
      if (r.x > w + 20) r.x = -20;
    }
  }

  sky(ctx, danger) {
    const { viewW, viewH } = this;
    const horizon = GROUND_Y + this.extraY;
    const g = ctx.createLinearGradient(0, 0, 0, Math.max(horizon, viewH));
    const d = clamp(danger, 0, 1);
    g.addColorStop(0, d > 0.3 ? '#0b0309' : '#04050e');
    g.addColorStop(0.32, d > 0.3 ? '#1c0612' : '#080820');
    g.addColorStop(0.58, d > 0.3 ? '#330b1a' : '#151028');
    g.addColorStop(0.78, d > 0.3 ? '#4a1018' : '#2a1427');
    g.addColorStop(0.92, d > 0.3 ? '#3d0c12' : '#471a2a');
    g.addColorStop(1, '#0d0810');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);

    // aurora glow near horizon
    const hg = ctx.createLinearGradient(0, horizon - 230, 0, horizon);
    hg.addColorStop(0, 'rgba(255,70,110,0)');
    hg.addColorStop(1, d > 0.3 ? 'rgba(180,30,50,0.16)' : 'rgba(150,40,90,0.10)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, horizon - 230, viewW, 230);
  }

  drawMoon(ctx, danger) {
    const horizon = GROUND_Y + this.extraY;
    const x = this.viewW * 0.76 - (this.camX || 0) * 0.012;
    const y = Math.max(110, horizon - 460);
    const d = clamp(danger, 0, 1);
    const r = 54;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = 300;
    ctx.globalAlpha = 0.55 + Math.sin(this.time * 0.4) * 0.05;
    ctx.drawImage(d > 0.35 ? this.glowRed : this.glowMoon, x - glow / 2, y - glow / 2, glow, glow);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(d > 0.35 ? this.glowRed : this.glowCyan, x - 180, y - 180, 360, 360);
    ctx.restore();

    // halo rings
    ctx.save();
    ctx.strokeStyle = d > 0.35 ? 'rgba(255,80,100,0.18)' : 'rgba(200,220,255,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r + 14, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(x, y, r + 30, 0, TAU); ctx.stroke();
    ctx.restore();

    // moon disc
    const mg = ctx.createRadialGradient(x - 18, y - 20, 6, x, y, r);
    if (d > 0.35) {
      mg.addColorStop(0, '#ffd9c8');
      mg.addColorStop(0.55, '#ff8a7e');
      mg.addColorStop(1, '#b02438');
    } else {
      mg.addColorStop(0, '#fff8e8');
      mg.addColorStop(0.65, '#f4e7cf');
      mg.addColorStop(1, '#cfbfa8');
    }
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = d > 0.35 ? '#7c1020' : '#8e8478';
    for (const [cx, cy, cr] of [[-18, -12, 10], [12, 14, 7], [22, -18, 5], [-4, 24, 4]]) {
      ctx.beginPath(); ctx.arc(x + cx, y + cy, cr, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  drawStars(ctx) {
    const horizon = GROUND_Y + this.extraY;
    ctx.save();
    ctx.fillStyle = '#dfe8ff';
    for (const s of this.stars) {
      const tw = 0.45 + Math.sin(this.time * s.speed + s.phase) * 0.35 + 0.2;
      ctx.globalAlpha = tw * 0.75;
      ctx.beginPath();
      ctx.arc(s.x * this.viewW, s.y * horizon, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawRidges(ctx, camX) {
    const horizon = GROUND_Y + this.extraY;
    for (const ridge of this.ridges) {
      ctx.save();
      ctx.globalAlpha = ridge.alpha;
      ctx.fillStyle = ridge.color;
      ctx.beginPath();
      const off = -camX * ridge.factor;
      ctx.moveTo(ridge.pts[0].x + off, horizon + 60);
      for (const p of ridge.pts) ctx.lineTo(p.x + off, horizon - p.y);
      ctx.lineTo(ridge.pts[ridge.pts.length - 1].x + off, horizon + 60);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawCity(ctx, camX, danger) {
    const horizon = GROUND_Y + this.extraY;
    const off = -camX * 0.115;
    ctx.save();
    // distant light pollution
    const lp = ctx.createLinearGradient(0, horizon - 180, 0, horizon);
    lp.addColorStop(0, 'rgba(255,40,90,0)');
    lp.addColorStop(1, danger > 0.4 ? 'rgba(255,50,50,0.10)' : 'rgba(255,60,110,0.06)');
    ctx.fillStyle = lp;
    ctx.fillRect(0, horizon - 180, this.viewW, 180);

    for (const b of this.buildings) {
      const x = b.x + off;
      if (x + b.w < -80 || x > this.viewW + 80) continue;
      const top = horizon - b.h;
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = '#0c0a1a';
      ctx.fillRect(x, top, b.w, b.h + 20);
      ctx.fillStyle = '#131026';
      ctx.fillRect(x + 2, top + 2, b.w - 4, 3);
      if (b.tiered) {
        for (let t = 0; t < 2; t++) {
          const tw = b.w * (0.5 + t * 0.22);
          const ty = top - 12 - t * 12;
          ctx.fillStyle = '#0d0b1c';
          ctx.beginPath();
          ctx.moveTo(x + b.w / 2 - tw / 2, ty + 12);
          ctx.quadraticCurveTo(x + b.w / 2, ty - 8, x + b.w / 2 + tw / 2, ty + 12);
          ctx.lineTo(x + b.w / 2 + tw / 2 - 4, ty + 12);
          ctx.quadraticCurveTo(x + b.w / 2, ty + 1, x + b.w / 2 - tw / 2 + 4, ty + 12);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,70,95,0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + b.w / 2 - tw / 2, ty + 12);
          ctx.quadraticCurveTo(x + b.w / 2, ty - 8, x + b.w / 2 + tw / 2, ty + 12);
          ctx.stroke();
        }
      }
      // windows
      ctx.save();
      for (const w of b.win) {
        const flicker = 0.75 + Math.sin(this.time * 0.8 + (w.x + w.y) * 17) * 0.12;
        ctx.globalAlpha = (w.warm ? 0.9 : 0.7) * flicker;
        ctx.fillStyle = w.warm ? 'rgba(255,190,112,0.9)' : 'rgba(92,238,226,0.75)';
        ctx.fillRect(x + 8 + w.x * (b.w - 16), top + 10 + w.y * (b.h - 20), 3, 5);
      }
      ctx.restore();
      // rooftop neon strip
      if (b.h > 120) {
        ctx.globalAlpha = 0.5 + Math.sin(this.time * 1.4 + b.x) * 0.2;
        ctx.fillStyle = b.x % 2 ? 'rgba(255,70,100,0.5)' : 'rgba(80,230,220,0.35)';
        ctx.fillRect(x + 4, top + 1, b.w - 8, 1);
      }
    }
    ctx.restore();

    this.drawSigns(ctx, camX);
  }

  drawSigns(ctx, camX) {
    const off = -camX * 0.13;
    for (const s of this.signs) {
      const x = s.x + off;
      if (x < -60 || x > this.viewW + 60) continue;
      let flicker = 0.88 + Math.sin(this.time * s.speed + s.phase) * 0.08;
      if (s.flicker && Math.sin(this.time * 9 + s.phase) > 0.93) flicker *= 0.45;
      const y = s.y;
      ctx.save();
      ctx.globalAlpha = flicker;
      // bracket
      ctx.strokeStyle = 'rgba(20,14,22,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 10); ctx.lineTo(x + s.w / 2, y - 10);
      ctx.lineTo(x + s.w / 2, y);
      ctx.stroke();
      // glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.10 * flicker;
      ctx.fillStyle = s.color;
      ctx.fillRect(x - 7, y - 7, s.w + 14, s.h + 14);
      // panel
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.95 * flicker;
      ctx.fillStyle = '#0a0710';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 1, y + 1, s.w - 2, s.h - 2);
      // inner line
      ctx.globalAlpha = 0.35 * flicker;
      ctx.strokeRect(x + 4, y + 4, s.w - 8, s.h - 8);
      // kanji
      ctx.globalAlpha = flicker;
      ctx.fillStyle = s.color;
      ctx.font = `${Math.round(s.h * 0.56)}px "Yu Mincho", "Hiragino Mincho ProN", "IPAGothic", "WenQuanYi Zen Hei", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 16;
      ctx.fillText(s.char, x + s.w / 2, y + s.h / 2 + 2);
      ctx.shadowBlur = 0;
      // cap lamps
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.8 * flicker;
      ctx.fillStyle = '#fff2d8';
      ctx.fillRect(x + s.w / 2 - 2, y - 2, 4, 4);
      ctx.fillRect(x + s.w / 2 - 2, y + s.h - 2, 4, 4);
      ctx.restore();
    }
  }

  drawClouds(ctx, camX) {
    const bands = [
      { y: 0.16, w: 420, h: 26, a: 0.055, sp: 2.4, off: 0 },
      { y: 0.27, w: 560, h: 34, a: 0.04, sp: 1.4, off: 380 },
      { y: 0.40, w: 340, h: 20, a: 0.035, sp: 3.1, off: 840 },
    ];
    ctx.save();
    for (const b of bands) {
      const span = this.viewW + b.w * 2;
      const cx = ((b.off + this.time * b.sp - camX * 0.03) % span + span) % span - b.w;
      const cy = this.viewH * b.y + this.extraY * 0.2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.w * 0.6);
      g.addColorStop(0, `rgba(170,160,200,${b.a})`);
      g.addColorStop(0.6, `rgba(120,110,160,${b.a * 0.5})`);
      g.addColorStop(1, 'rgba(80,70,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, b.w * 0.6, b.h, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPagoda(ctx, x, base, s, factor, camX, danger) {
    const px = x - camX * factor;
    ctx.save();
    ctx.translate(px, base);
    ctx.scale(s, s);
    // ambient red halo
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.drawImage(this.glowRed, -240, -330, 480, 380);
    ctx.restore();

    const neon = danger > 0.4 ? 'rgba(255,90,90,' : 'rgba(255,70,100,';
    ctx.fillStyle = '#090814';
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const y = -i * 44;
      const w = 132 - i * 20;
      // body
      ctx.fillStyle = '#0b0917';
      ctx.fillRect(-w * 0.28, y - 40, w * 0.56, 44);
      // warm lower band
      ctx.fillStyle = 'rgba(255,140,90,0.08)';
      ctx.fillRect(-w * 0.28, y - 12, w * 0.56, 10);
      // curved roof
      ctx.fillStyle = '#0a0915';
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 14, y - 34);
      ctx.quadraticCurveTo(-w / 2, y - 54, 0, y - 58);
      ctx.quadraticCurveTo(w / 2, y - 54, w / 2 + 14, y - 34);
      ctx.quadraticCurveTo(w / 2 - 8, y - 40, w / 2 - 16, y - 30);
      ctx.lineTo(-w / 2 + 16, y - 30);
      ctx.quadraticCurveTo(-w / 2 + 8, y - 40, -w / 2 - 14, y - 34);
      ctx.closePath();
      ctx.fill();
      // neon rim
      ctx.strokeStyle = neon + (0.3 + i * 0.02) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 14, y - 34);
      ctx.quadraticCurveTo(-w / 2, y - 54, 0, y - 58);
      ctx.quadraticCurveTo(w / 2, y - 54, w / 2 + 14, y - 34);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,210,160,0.10)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 6, y - 36);
      ctx.quadraticCurveTo(0, y - 51, w / 2 - 6, y - 36);
      ctx.stroke();
      // lit windows
      if (i < 3) {
        ctx.fillStyle = 'rgba(255,170,100,0.55)';
        ctx.fillRect(-5, y - 24, 10, 9);
        ctx.fillStyle = 'rgba(255,220,160,0.35)';
        ctx.fillRect(-3, y - 22, 3, 5);
      }
      // hanging red lanterns on lower tiers
      if (i < 2) {
        for (const side of [-1, 1]) {
          const lx = side * (w / 2 - 8);
          ctx.strokeStyle = 'rgba(120,30,40,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(lx, y - 30); ctx.lineTo(lx, y - 18); ctx.stroke();
          ctx.fillStyle = 'rgba(255,90,70,0.55)';
          ctx.beginPath(); ctx.ellipse(lx, y - 13, 3.5, 5, 0, 0, TAU); ctx.fill();
        }
      }
    }
    // spire
    ctx.strokeStyle = 'rgba(255,120,130,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -tiers * 44 - 36); ctx.lineTo(0, -tiers * 44 - 92); ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,140,0.7)';
    ctx.beginPath(); ctx.arc(0, -tiers * 44 - 94, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawTorii(ctx, x, base, s, factor, camX, danger) {
    const px = x - camX * factor;
    const red = danger > 0.4 ? '#470c15' : '#3a0c17';
    const edge = danger > 0.4 ? 'rgba(255,100,100,0.8)' : 'rgba(255,70,100,0.55)';
    ctx.save();
    ctx.translate(px, base);
    ctx.scale(s, s);
    // glow pool
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.4;
    ctx.drawImage(this.glowRed, -180, -280, 360, 340);
    ctx.restore();
    // legs
    ctx.fillStyle = red;
    ctx.fillRect(-92, -230, 20, 232);
    ctx.fillRect(72, -230, 20, 232);
    ctx.fillStyle = 'rgba(255,90,100,0.18)';
    ctx.fillRect(-92, -230, 3, 232);
    ctx.fillRect(72, -230, 3, 232);
    // lower beam
    ctx.fillRect(-108, -178, 216, 14);
    ctx.fillStyle = 'rgba(255,120,120,0.16)';
    ctx.fillRect(-108, -178, 216, 2);
    // top beams
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.moveTo(-140, -240);
    ctx.quadraticCurveTo(0, -258, 140, -240);
    ctx.lineTo(132, -222);
    ctx.quadraticCurveTo(0, -240, -132, -222);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-104, -212, 208, 12);
    // neon rims
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-140, -240); ctx.quadraticCurveTo(0, -258, 140, -240);
    ctx.moveTo(-132, -222); ctx.quadraticCurveTo(0, -240, 132, -222);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,100,110,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-92, -228); ctx.lineTo(-92, 0);
    ctx.moveTo(92, -228); ctx.lineTo(92, 0);
    ctx.stroke();
    // plaque
    ctx.fillStyle = '#160a10';
    ctx.fillRect(-24, -208, 48, 30);
    ctx.strokeStyle = 'rgba(255,200,140,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-24, -208, 48, 30);
    ctx.fillStyle = 'rgba(255,215,160,0.8)';
    ctx.font = '17px "Yu Mincho", "IPagothic", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('鬼門', 0, -192);
    // shimenawa rope
    ctx.strokeStyle = 'rgba(210,190,150,0.22)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-70, -178);
    ctx.quadraticCurveTo(0, -166, 70, -178);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = 'rgba(230,225,210,0.18)';
      ctx.beginPath();
      ctx.ellipse(i * 24, -172 + Math.abs(i) * 2, 3, 8, 0.2, 0, TAU);
      ctx.fill();
    }
    // hanging lanterns
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(this.glowWarm, -70 - 40, -196 - 40, 80, 80);
    ctx.drawImage(this.glowWarm, 70 - 40, -196 - 40, 80, 80);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,150,90,0.85)';
    ctx.beginPath(); ctx.ellipse(-70, -190, 7, 11, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(70, -190, 7, 11, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawBamboo(ctx, camX) {
    const horizon = GROUND_Y + this.extraY;
    const off = -camX * 0.4;
    ctx.save();
    ctx.lineCap = 'round';
    for (const b of this.bamboo) {
      const x = b.x + off;
      if (x < -60 || x > this.viewW + 60) continue;
      const top = horizon - b.h;
      const sway = Math.sin(this.time * 0.5 + b.phase) * 7;
      ctx.globalAlpha = b.alpha;
      const grad = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
      grad.addColorStop(0, 'rgba(6,12,12,0.9)');
      grad.addColorStop(0.55, 'rgba(22,48,40,1)');
      grad.addColorStop(1, 'rgba(8,18,18,0.85)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = b.w;
      ctx.beginPath();
      ctx.moveTo(x, horizon + 6);
      ctx.quadraticCurveTo(x + sway * 0.4, horizon - b.h * 0.55, x + sway, top);
      ctx.stroke();
      // nodes
      ctx.strokeStyle = 'rgba(8,16,16,0.75)';
      ctx.lineWidth = Math.max(1, b.w * 0.3);
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        const nx = x + sway * t * t;
        const ny = horizon - b.h * t;
        ctx.beginPath();
        ctx.moveTo(nx - b.w * 0.7, ny);
        ctx.lineTo(nx + b.w * 0.7, ny);
        ctx.stroke();
      }
      // leaves
      ctx.fillStyle = 'rgba(18,48,38,0.85)';
      for (let i = 0; i < 3; i++) {
        const ly = top + i * 22 + 10;
        const side = i % 2 ? 1 : -1;
        ctx.save();
        ctx.translate(x + sway * 0.9, ly);
        ctx.rotate(side * (0.7 + Math.sin(this.time + b.phase + i) * 0.1));
        ctx.beginPath();
        ctx.ellipse(side * 18, 0, 20, 3.2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawLanterns(ctx, camX) {
    for (const str of this.strings) {
      const off = -camX * str.factor;
      const x0 = str.x + off;
      const x1 = x0 + str.len;
      if (x1 < -100 || x0 > this.viewW + 100) continue;
      const y0 = str.y;
      // rope
      ctx.save();
      ctx.strokeStyle = 'rgba(30,18,24,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, y0 + str.sag * 2, x1, y0);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < str.count; i++) {
        const t = (i + 1) / (str.count + 1);
        const x = lerp(x0, x1, t);
        const sag = 4 * t * (1 - t);
        const y = y0 + str.sag * sag * 2;
        if (x < -40 || x > this.viewW + 40) continue;
        const sway = Math.sin(this.time * 1.1 + i * 1.3 + str.phase) * 2.5;
        const sprite = this.lanternSprites[i % this.lanternSprites.length];
        ctx.save();
        ctx.translate(x + sway, y + 12);
        // glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.38 + Math.sin(this.time * 2 + i) * 0.05;
        ctx.drawImage(this.glowWarm, -36, -42, 72, 84);
        ctx.restore();
        ctx.save();
        ctx.translate(x + sway, y + 10);
        ctx.rotate(sway * 0.012);
        ctx.drawImage(sprite, -14, -20, 28, 42);
        ctx.restore();
      }
    }
  }

  drawFireflies(ctx, camX, danger) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fireflies) {
      const x = f.x - camX * 0.9;
      if (x < -20 || x > this.viewW + 20) continue;
      const y = f.y + Math.sin(this.time * f.speed + f.phase) * 14;
      const a = 0.3 + Math.sin(this.time * 2.4 + f.phase) * 0.25;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = danger > 0.5 ? '#ff8a7a' : '#a8ffd8';
      ctx.beginPath(); ctx.arc(x, y, f.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = Math.max(0, a * 0.3);
      ctx.beginPath(); ctx.arc(x, y, f.r * 5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  drawFog(ctx, camX) {
    const horizon = GROUND_Y + this.extraY;
    ctx.save();
    const g = ctx.createLinearGradient(0, horizon - 130, 0, horizon + 40);
    g.addColorStop(0, 'rgba(40,30,60,0)');
    g.addColorStop(0.6, 'rgba(58,42,80,0.10)');
    g.addColorStop(1, 'rgba(20,14,30,0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon - 130, this.viewW, 180);
    ctx.restore();

    ctx.save();
    for (let i = 0; i < 3; i++) {
      const off = ((this.time * (5 + i * 3) + i * 400 - camX * 0.3) % (this.viewW + 600)) - 300;
      const g2 = ctx.createRadialGradient(off, horizon - 24, 0, off, horizon - 24, 380);
      g2.addColorStop(0, 'rgba(120,110,150,0.06)');
      g2.addColorStop(1, 'rgba(120,110,150,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(off - 400, horizon - 170, 800, 260);
    }
    ctx.restore();
  }

  draw(ctx, camX, danger) {
    this.camX = camX;
    this.sky(ctx, danger);
    this.drawStars(ctx);
    this.drawMoon(ctx, danger);
    this.drawRidges(ctx, camX);
    this.drawCity(ctx, camX, danger);
    for (const p of this.pagodas) {
      this.drawPagoda(ctx, p.x, GROUND_Y + this.extraY + 10, p.s, p.factor, camX, danger);
    }
    for (const t of this.torii) {
      this.drawTorii(ctx, t.x, GROUND_Y + this.extraY + 8, t.s, t.factor, camX, danger);
    }
    this.drawBamboo(ctx, camX);
    this.drawLanterns(ctx, camX);
    this.drawFireflies(ctx, camX, danger);
    this.drawFog(ctx, camX);
  }

  drawForeground(ctx, camX, danger) {
    const { viewW, viewH } = this;
    // rain
    ctx.save();
    ctx.strokeStyle = danger > 0.5 ? 'rgba(255,150,150,0.22)' : 'rgba(170,205,255,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const r of this.rain) {
      const x = ((r.x - camX * 0.06) % (viewW + 40) + viewW + 40) % (viewW + 40) - 20;
      ctx.globalAlpha = r.alpha;
      ctx.moveTo(x, r.y);
      ctx.lineTo(x - r.len * 0.12, r.y + r.len);
    }
    ctx.stroke();
    ctx.restore();

    // petals
    ctx.save();
    for (const p of this.petals) {
      const x = ((p.x - camX * 0.14) % (viewW + 40) + viewW + 40) % (viewW + 40) - 20;
      ctx.globalAlpha = p.alpha;
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = danger > 0.5 ? '#ff9a9a' : '#ffb7c9';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s, p.s * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // top corner branches
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,8,0.9)';
    ctx.strokeStyle = 'rgba(8,12,12,0.95)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-20, 20);
    ctx.quadraticCurveTo(120, 70, 230, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 50);
    ctx.quadraticCurveTo(80, 100, 170, 90);
    ctx.stroke();
    ctx.restore();
  }
}
