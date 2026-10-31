// SHADOW NINJA — particles, slash trails, afterimages, floating text, screen shake

import { TAU, rand, randInt, pick, clamp, lerp, easeOutCubic, hashNoise } from './utils.js';

const MAX_PARTICLES = 560;

export class FX {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.slashes = [];
    this.ghosts = [];
    this.trauma = 0;
    this.shakeSeed = Math.random() * 1000;
    this.flash = 0;
    this.flashColor = '255,255,255';
  }

  reset() {
    this.particles.length = 0;
    this.texts.length = 0;
    this.slashes.length = 0;
    this.ghosts.length = 0;
    this.trauma = 0;
    this.flash = 0;
  }

  addTrauma(v) {
    this.trauma = Math.min(1, this.trauma + v);
  }

  screenFlash(amount = 0.5, color = '255,255,255') {
    this.flash = Math.max(this.flash, amount);
    this.flashColor = color;
  }

  shakeOffset(time) {
    const t = this.trauma;
    if (t <= 0.001) return { x: 0, y: 0, rot: 0 };
    const mag = t * t;
    const s = this.shakeSeed + time * 34;
    return {
      x: (hashNoise(s) * 2 - 1) * 22 * mag,
      y: (hashNoise(s + 19.3) * 2 - 1) * 16 * mag,
      rot: (hashNoise(s + 41.7) * 2 - 1) * 0.018 * mag,
    };
  }

  spark(x, y, color, count = 6, speed = 260, opts = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const a = opts.angle !== undefined ? opts.angle + rand(-opts.spread || -0.8, opts.spread || 0.8) : rand(0, TAU);
      const sp = speed * rand(0.35, 1.2);
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + (opts.up || 0),
        life: rand(0.18, 0.5),
        max: 0.5,
        size: rand(1.2, 3.2),
        color,
        drag: 5,
        grav: opts.grav ?? 620,
        glow: true,
      });
    }
  }

  ember(x, y, color, count = 5, speed = 120, life = 1.1) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const a = rand(0, TAU);
      this.particles.push({
        type: 'ember',
        x: x + rand(-8, 8),
        y: y + rand(-10, 10),
        vx: Math.cos(a) * speed * rand(0.2, 1),
        vy: Math.sin(a) * speed * rand(0.2, 1) - rand(20, 80),
        life: rand(life * 0.5, life),
        max: life,
        size: rand(1.5, 4.5),
        color,
        drag: 1.4,
        grav: -20,
        glow: true,
      });
    }
  }

  petals(x, y, count = 6, color = '#ff9db7') {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const a = rand(0, TAU);
      const sp = rand(40, 240);
      this.particles.push({
        type: 'petal',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(30, 140),
        life: rand(0.8, 2),
        max: 2,
        size: rand(2.5, 6),
        color: pick([color, '#ffc4d4', '#e05a7a']),
        drag: 2.4,
        grav: 210,
        rot: rand(0, TAU),
        rotV: rand(-6, 6),
      });
    }
  }

  smoke(x, y, color = '120,120,150', count = 4, size = 16) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      this.particles.push({
        type: 'smoke',
        x: x + rand(-12, 12),
        y: y + rand(-8, 8),
        vx: rand(-30, 30),
        vy: rand(-60, -10),
        life: rand(0.5, 1.2),
        max: 1.2,
        size: size * rand(0.6, 1.3),
        color,
        drag: 2,
        grav: -30,
      });
    }
  }

  dust(x, y, dir = 0, count = 3) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      this.particles.push({
        type: 'smoke',
        x: x + rand(-6, 6),
        y,
        vx: rand(-60, 60) + dir * 60,
        vy: rand(-90, -25),
        life: rand(0.3, 0.7),
        max: 0.7,
        size: rand(6, 14),
        color: '160,160,180',
        drag: 3.5,
        grav: 40,
      });
    }
  }

  ring(x, y, color, radius = 80, width = 3, life = 0.35, startRadius = 4) {
    this.particles.push({
      type: 'ring',
      x, y,
      vx: 0, vy: 0,
      life, max: life,
      size: startRadius,
      radius,
      width,
      color,
      drag: 0,
      grav: 0,
      glow: true,
    });
  }

  shards(x, y, color, count = 6, speed = 240) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const a = rand(0, TAU);
      this.particles.push({
        type: 'shard',
        x, y,
        vx: Math.cos(a) * speed * rand(0.3, 1),
        vy: Math.sin(a) * speed * rand(0.3, 1) - 80,
        life: rand(0.4, 0.9),
        max: 0.9,
        size: rand(3, 8),
        color,
        drag: 1.2,
        grav: 900,
        rot: rand(0, TAU),
        rotV: rand(-12, 12),
      });
    }
  }

  slash(x, y, angle, radius, color = '#7ef9ff', life = 0.22, width = 9, sweep = 1.9) {
    this.slashes.push({
      x, y, angle, radius, color, life, max: life, width, sweep, rot: 0,
    });
  }

  ghost(x, y, facing, color = '90,230,255', life = 0.28, scale = 1) {
    this.ghosts.push({ x, y, facing, color, life, max: life, scale });
  }

  text(x, y, str, color = '#fff', size = 18, opts = {}) {
    this.texts.push({
      x, y,
      vx: opts.vx ?? rand(-25, 25),
      vy: opts.vy ?? -58,
      str,
      color,
      size,
      life: opts.life ?? 0.8,
      max: opts.life ?? 0.8,
      weight: opts.weight ?? 700,
      italic: opts.italic ?? false,
    });
  }

  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    this.flash = Math.max(0, this.flash - dt * 3.4);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.type === 'ring') {
        p.size = lerp(p.size, p.radius, 1 - Math.exp(-9 * dt));
        continue;
      }
      p.vy += (p.grav || 0) * dt;
      const d = Math.exp(-(p.drag || 0) * dt);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.rotV) p.rot += p.rotV * dt;
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.texts.splice(i, 1); continue; }
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy += 45 * dt;
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) this.slashes.splice(i, 1);
    }

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.life -= dt;
      if (g.life <= 0) this.ghosts.splice(i, 1);
    }
  }

  drawGhosts(ctx) {
    if (!this.ghosts.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const g of this.ghosts) {
      const p = g.life / g.max;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(g.facing * g.scale, g.scale);
      ctx.globalAlpha = p * 0.45;
      ctx.fillStyle = `rgba(${g.color},${0.35 * p})`;
      ctx.beginPath();
      ctx.ellipse(0, -36, 15, 34, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -66, 11, 12, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -48);
      ctx.lineTo(-28 - (1 - p) * 30, -40 + Math.sin(p * 9) * 8);
      ctx.lineTo(-10, -34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  draw(ctx) {
    // additive particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.type === 'spark') {
        const len = clamp(Math.hypot(p.vx, p.vy) * 0.035, 3, 16);
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.lineCap = 'round';
        const ang = Math.atan2(p.vy, p.vx);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
        ctx.stroke();
      } else if (p.type === 'ember') {
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.8), 0, TAU);
        ctx.fill();
      } else if (p.type === 'ring') {
        const t = 1 - p.life / p.max;
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width * (1 - t * 0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();

    // normal blend particles
    ctx.save();
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.type === 'petal') {
        ctx.globalAlpha = a * 0.85;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'smoke') {
        ctx.globalAlpha = a * 0.16;
        ctx.fillStyle = `rgb(${p.color})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.8 - a * 0.8), 0, TAU);
        ctx.fill();
      } else if (p.type === 'shard') {
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    // slash arcs
    if (this.slashes.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of this.slashes) {
        const t = 1 - s.life / s.max;
        const grow = easeOutCubic(clamp(t * 1.6, 0, 1));
        const alpha = Math.sin((1 - t) * Math.PI * 0.9) * 0.9;
        const r = s.radius * (0.65 + grow * 0.5);
        const start = s.angle - s.sweep / 2;
        const end = s.angle + s.sweep / 2;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot || 0);
        for (let layer = 0; layer < 3; layer++) {
          ctx.globalAlpha = alpha * (0.85 - layer * 0.24);
          ctx.strokeStyle = layer === 2 ? '#ffffff' : s.color;
          ctx.lineWidth = (s.width - layer * 2.6) * (1 - t * 0.5);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, r - layer * 5, start + (1 - grow) * 0.5, end - (1 - grow) * 0.5);
          ctx.stroke();
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.restore();
    }

    // floating combat text
    if (this.texts.length) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const t of this.texts) {
        const p = t.life / t.max;
        const pop = 1 + Math.sin(Math.min(1, (1 - p) * 3) * Math.PI) * 0.25;
        ctx.globalAlpha = Math.min(1, p * 1.8);
        ctx.font = `${t.italic ? 'italic ' : ''}${t.weight} ${Math.round(t.size * pop)}px Georgia, "Times New Roman", serif`;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillText(t.str, t.x + 1.5, t.y + 2.5);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.restore();
    }
  }
}
