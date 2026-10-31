/* ============================================================
   Particle / skid-mark / floating-text pool + camera shake.
   All pools are pre-allocated so nothing allocates during play.
   ============================================================ */

import { blobSprite } from './sprites.js';
import { TAU, clamp } from './utils.js';

const MAX_PARTS = 640;
const MAX_SKIDS = 1400;
const MAX_TEXTS = 40;

function newPart() {
  return { on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 10, size1: 20, color: '#fff', a0: 1, drag: 1, grav: 0, rot: 0, spin: 0, w: 3 };
}

class Effects {
  constructor() {
    this.parts = new Array(MAX_PARTS);
    for (let i = 0; i < MAX_PARTS; i++) this.parts[i] = newPart();
    this.head = 0;
    this.skids = new Array(MAX_SKIDS);
    for (let i = 0; i < MAX_SKIDS; i++) this.skids[i] = { on: false, x1: 0, y1: 0, x2: 0, y2: 0, w: 4, a: 0, age: 0, life: 8, dark: 1 };
    this.shead = 0;
    this.texts = new Array(MAX_TEXTS);
    for (let i = 0; i < MAX_TEXTS; i++) this.texts[i] = { on: false, x: 0, y: 0, vy: -34, str: '', color: '#fff', size: 26, age: 0, life: 1.2, crit: false };
    this.theads = 0;
    this.shakeAmt = 0;
    this.shakeT = 0;
    this.quality = 1;
    this.flash = 0;
    this.flashColor = 'rgba(255,255,255,.5)';
  }

  reset() {
    for (const p of this.parts) p.on = false;
    for (const s of this.skids) s.on = false;
    for (const t of this.texts) t.on = false;
    this.shakeAmt = 0;
    this.flash = 0;
  }

  spawn(kind, x, y, o) {
    let p = null;
    for (let i = 0; i < MAX_PARTS; i++) {
      const c = this.parts[(this.head + i) % MAX_PARTS];
      if (!c.on) { p = c; this.head = (this.head + i + 1) % MAX_PARTS; break; }
    }
    if (!p) { p = this.parts[this.head]; this.head = (this.head + 1) % MAX_PARTS; }
    p.on = true;
    p.kind = kind;
    p.x = x; p.y = y;
    p.vx = o.vx || 0; p.vy = o.vy || 0;
    p.age = 0;
    p.life = o.life || 1;
    p.size = o.size || 10;
    p.size1 = o.size1 !== undefined ? o.size1 : p.size * 1.8;
    p.color = o.color || '#fff';
    p.a0 = o.a0 !== undefined ? o.a0 : 1;
    p.drag = o.drag !== undefined ? o.drag : 1.4;
    p.grav = o.grav || 0;
    p.rot = o.rot || 0;
    p.spin = o.spin || 0;
    p.w = o.w || 3;
    return p;
  }

  smoke(x, y, vx, vy, amount, color = '#e8edf6', scale = 1) {
    const n = Math.max(1, Math.round(amount * this.quality));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 10 + Math.random() * 40;
      this.spawn(0, x, y, {
        vx: vx * .35 + Math.cos(a) * sp,
        vy: vy * .35 + Math.sin(a) * sp,
        life: .7 + Math.random() * .8,
        size: (12 + Math.random() * 10) * scale,
        size1: (46 + Math.random() * 34) * scale,
        color, a0: .34 + Math.random() * .22,
        drag: 1.9,
      });
    }
  }

  dust(x, y, vx, vy, amount, color = '#c9a86a') {
    const n = Math.max(1, Math.round(amount * this.quality));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 16 + Math.random() * 70;
      this.spawn(0, x, y, {
        vx: vx * .4 + Math.cos(a) * sp,
        vy: vy * .4 + Math.sin(a) * sp,
        life: .5 + Math.random() * .6,
        size: 9 + Math.random() * 8,
        size1: 34 + Math.random() * 26,
        color, a0: .5 + Math.random() * .3,
        drag: 2.4,
      });
    }
  }

  spark(x, y, vx, vy, amount, color = '#ffd36b') {
    const n = Math.max(1, Math.round(amount * this.quality));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 60 + Math.random() * 240;
      this.spawn(1, x, y, {
        vx: vx * .5 + Math.cos(a) * sp,
        vy: vy * .5 + Math.sin(a) * sp,
        life: .22 + Math.random() * .4,
        size: 3, size1: 1,
        color, a0: 1, drag: 3.2, grav: 90, w: 1.6 + Math.random() * 1.8,
      });
    }
  }

  flame(x, y, vx, vy, color = '#7cdcff') {
    this.spawn(0, x, y, {
      vx, vy, life: .18 + Math.random() * .2,
      size: 12 + Math.random() * 8, size1: 3,
      color, a0: .85, drag: 5,
    });
  }

  debris(x, y, amount, color = '#cfd6e2') {
    const n = Math.max(1, Math.round(amount * this.quality));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 60 + Math.random() * 220;
      this.spawn(2, x, y, {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: .6 + Math.random() * .7,
        size: 3 + Math.random() * 4, size1: 3,
        color, a0: 1, drag: 2.2, grav: 140,
        rot: Math.random() * TAU, spin: (Math.random() - .5) * 18,
      });
    }
  }

  skid(x1, y1, x2, y2, a, w = 5, dark = 1) {
    const s = this.skids[this.shead];
    this.shead = (this.shead + 1) % MAX_SKIDS;
    s.on = true;
    s.x1 = x1; s.y1 = y1; s.x2 = x2; s.y2 = y2;
    s.a = clamp(a, 0, .85);
    s.w = w;
    s.age = 0;
    s.life = 7;
    s.dark = dark;
  }

  text(x, y, str, color = '#fff', size = 26, life = 1.2) {
    const t = this.texts[this.theads];
    this.theads = (this.theads + 1) % MAX_TEXTS;
    t.on = true;
    t.x = x; t.y = y; t.str = str; t.color = color; t.size = size;
    t.age = 0; t.life = life; t.vy = -46;
  }

  addShake(v) { this.shakeAmt = Math.min(26, this.shakeAmt + v); }

  update(dt) {
    for (const p of this.parts) {
      if (!p.on) continue;
      p.age += dt;
      if (p.age >= p.life) { p.on = false; continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    for (const s of this.skids) {
      if (!s.on) continue;
      s.age += dt;
      if (s.age >= s.life) s.on = false;
    }
    for (const t of this.texts) {
      if (!t.on) continue;
      t.age += dt;
      if (t.age >= t.life) { t.on = false; continue; }
      t.y += t.vy * dt;
      t.vy *= Math.exp(-1.4 * dt);
    }
    this.shakeAmt *= Math.exp(-5.5 * dt);
    if (this.shakeAmt < .05) this.shakeAmt = 0;
    this.shakeT += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
  }

  shakeOffset() {
    if (!this.shakeAmt) return [0, 0];
    const t = this.shakeT * 47;
    return [
      Math.sin(t * 1.7) * this.shakeAmt,
      Math.cos(t * 2.3) * this.shakeAmt * .8,
    ];
  }

  /** skid marks + soft blobs (called inside the world transform) */
  drawUnder(ctx) {
    // --- skid marks, batched into 6 alpha buckets
    const buckets = [[], [], [], [], [], []];
    for (const s of this.skids) {
      if (!s.on) continue;
      const k = 1 - s.age / s.life;
      const bi = clamp(Math.floor(k * 6), 0, 5);
      buckets[bi].push(s);
    }
    ctx.lineCap = 'round';
    for (let b = 0; b < 6; b++) {
      const list = buckets[b];
      if (!list.length) continue;
      ctx.globalAlpha = (b + 1) / 6 * .78;
      for (const dark of [1, 0]) {
        let started = false;
        ctx.beginPath();
        for (const s of list) {
          if ((s.dark ? 1 : 0) !== dark) continue;
          if (!started) { started = true; } else { /* continued */ }
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
        if (started) {
          ctx.strokeStyle = dark ? '#12151b' : 'rgba(255,255,255,.75)';
          ctx.lineWidth = 5;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  drawParticles(ctx) {
    // soft blobs first
    ctx.globalCompositeOperation = 'source-over';
    for (const p of this.parts) {
      if (!p.on || p.kind !== 0) continue;
      const t = p.age / p.life;
      const size = p.size + (p.size1 - p.size) * t;
      ctx.globalAlpha = p.a0 * (1 - t) * (1 - t * .35);
      const img = blobSprite(p.color);
      ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;

    // debris (opaque)
    for (const p of this.parts) {
      if (!p.on || p.kind !== 2) continue;
      const t = p.age / p.life;
      ctx.globalAlpha = 1 - t;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size, -p.size * .6, p.size * 2, p.size * 1.2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // sparks / flames additively
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      if (!p.on || p.kind !== 1) continue;
      const t = p.age / p.life;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * .02, p.y - p.vy * .02);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawTexts(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      if (!t.on) continue;
      const k = t.age / t.life;
      const a = k < .12 ? k / .12 : 1 - Math.max(0, (k - .55) / .45);
      ctx.globalAlpha = clamp(a, 0, 1);
      const sc = 1 + (k < .18 ? (0.18 - k) * 2.4 : 0);
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(sc, sc);
      ctx.font = `900 italic ${t.size}px "Arial Narrow", Impact, sans-serif`;
      ctx.lineWidth = Math.max(3, t.size * .16);
      ctx.strokeStyle = 'rgba(0,0,0,.75)';
      ctx.strokeText(t.str, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

export const effects = new Effects();
