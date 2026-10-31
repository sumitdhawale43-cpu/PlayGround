import { rand, randInt, TAU, clamp } from "./util.js";

const MAX_PARTICLES = 700;

export class Particles {
  constructor() {
    this.items = [];
    this.texts = [];
    this.rings = [];
  }

  add(opts) {
    if (this.items.length >= MAX_PARTICLES) this.items.shift();
    this.items.push({
      x: opts.x, y: opts.y,
      vx: opts.vx ?? 0, vy: opts.vy ?? 0,
      gravity: opts.gravity ?? 0,
      drag: opts.drag ?? 0.98,
      life: opts.life ?? 0.5,
      maxLife: opts.life ?? 0.5,
      size: opts.size ?? 3,
      endSize: opts.endSize ?? 0,
      color: opts.color ?? "#5df7ff",
      alpha: opts.alpha ?? 1,
      additive: opts.additive !== false,
      shape: opts.shape ?? "dot",
      rotation: opts.rotation ?? 0,
      spin: opts.spin ?? 0,
      glow: opts.glow ?? 0,
      stretch: opts.stretch ?? 1,
      tail: opts.tail ?? 0,
    });
  }

  spark(x, y, color, count = 8, power = 260) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(power * 0.25, power);
      this.add({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - power * 0.15,
        gravity: 700, drag: 0.93, life: rand(0.18, 0.48), size: rand(1, 2.6),
        endSize: 0, color, shape: "line", stretch: rand(0.5, 1.6), glow: 8,
      });
    }
  }

  hit(x, y, color = "#fff6cc", heavy = false) {
    this.spark(x, y, color, heavy ? 16 : 9, heavy ? 420 : 280);
    for (let i = 0; i < (heavy ? 5 : 2); i++) {
      this.add({
        x: x + rand(-8, 8), y: y + rand(-8, 8),
        vx: rand(-60, 60), vy: rand(-120, -20), gravity: 300,
        life: rand(0.3, 0.6), size: rand(8, 18), endSize: rand(20, 36),
        color, shape: "smoke", alpha: 0.15, additive: false, drag: 0.96,
      });
    }
    this.ring(x, y, color, heavy ? 52 : 30, heavy ? 0.28 : 0.18);
  }

  dust(x, y, color = "#6fd4e8", count = 4, power = 70) {
    for (let i = 0; i < count; i++) {
      this.add({
        x: x + rand(-8, 8), y: y - rand(0, 5),
        vx: rand(-power, power), vy: rand(-power * 0.7, -8),
        gravity: 120, drag: 0.92, life: rand(0.25, 0.5), size: rand(3, 7),
        endSize: rand(9, 17), color, shape: "smoke", alpha: 0.4, additive: false,
      });
    }
  }

  explosion(x, y, color = "#ff8a3d", scale = 1) {
    this.add({ x, y, vx: 0, vy: 0, life: 0.32, size: 10 * scale, endSize: 100 * scale, color: "#fff3d0", shape: "flash", glow: 30 });
    this.ring(x, y, color, 40 * scale, 0.42, 5);
    this.ring(x, y, "#fff3d0", 24 * scale, 0.22, 3);
    this.spark(x, y, color, Math.round(22 * scale), 460 * scale);
    this.spark(x, y, "#ffffff", Math.round(10 * scale), 360 * scale);
    for (let i = 0; i < 12 * scale; i++) {
      const a = rand(0, TAU);
      this.add({
        x, y,
        vx: Math.cos(a) * rand(40, 170) * scale,
        vy: Math.sin(a) * rand(40, 170) * scale - 50,
        gravity: 520, drag: 0.985,
        life: rand(0.45, 1.05), size: rand(2, 6) * scale, endSize: 1,
        color: i % 3 === 0 ? "#ffcf7a" : color, shape: "shard",
        rotation: rand(0, TAU), spin: rand(-12, 12), glow: 6,
      });
    }
    for (let i = 0; i < 7; i++) {
      this.add({
        x: x + rand(-20, 20), y: y + rand(-20, 20),
        vx: rand(-40, 40), vy: rand(-90, -20), drag: 0.97,
        life: rand(0.6, 1.3), size: rand(14, 30) * scale, endSize: rand(40, 70) * scale,
        color: "#3a2a44", shape: "smoke", alpha: 0.28, additive: false,
      });
    }
  }

  orbTrail(x, y, color = "#5df7ff") {
    this.add({
      x: x + rand(-3, 3), y: y + rand(-3, 3), vx: rand(-30, 30), vy: rand(-30, 30),
      drag: 0.9, life: rand(0.2, 0.45), size: rand(2, 5), color, glow: 10, shape: "dot",
    });
  }

  slashTrail(x1, y1, x2, y2, color = "#bffcff", width = 3) {
    this.add({
      x: x1, y: y1, vx: (x2 - x1) * 2, vy: (y2 - y1) * 2,
      life: 0.12, size: width, color, shape: "line", glow: 12, drag: 0.9,
      stretch: 1, tail: 0,
    });
  }

  ring(x, y, color, radius, life = 0.3, width = 2) {
    if (this.rings.length > 30) this.rings.shift();
    this.rings.push({ x, y, color, radius, life, maxLife: life, width });
  }

  text(x, y, text, color = "#bffcff", size = 16, vy = -50) {
    if (this.texts.length > 24) this.texts.shift();
    this.texts.push({ x, y, text, color, size, vy, life: 0.85, maxLife: 0.85, vx: rand(-12, 12) });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) { this.items.splice(i, 1); continue; }
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.texts.splice(i, 1); continue; }
      t.y += t.vy * dt;
      t.x += t.vx * dt;
      t.vy += 60 * dt;
    }
  }

  draw(ctx) {
    // smoke/dark particles first
    ctx.save();
    for (const p of this.items) {
      if (p.additive) continue;
      const t = p.life / p.maxLife;
      const alpha = p.alpha * t;
      if (alpha <= 0.005) continue;
      const size = p.size + (p.endSize - p.size) * (1 - t);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === "smoke") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.items) {
      if (!p.additive) continue;
      const t = p.life / p.maxLife;
      const alpha = p.alpha * (t > 0.8 ? (1 - t) / 0.2 : t / 0.8);
      if (alpha <= 0.005) continue;
      const size = p.size + (p.endSize - p.size) * (1 - t);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.glow > 0) {
        ctx.shadowBlur = p.glow;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }
      if (p.shape === "line") {
        const len = Math.max(size, size * (p.stretch + 1));
        const speed = Math.hypot(p.vx, p.vy) || 1;
        ctx.lineWidth = Math.max(0.7, size * 0.65);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.vx / speed) * len, p.y - (p.vy / speed) * len);
        ctx.stroke();
      } else if (p.shape === "shard") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.moveTo(-size, -size * 0.3);
        ctx.lineTo(size * 0.4, -size * 0.55);
        ctx.lineTo(size, size * 0.4);
        ctx.lineTo(-size * 0.5, size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.shape === "flash") {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.35, p.color);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, size), 0, TAU);
        ctx.fill();
      }
    }
    for (const r of this.rings) {
      const t = 1 - r.life / r.maxLife;
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * (1 - t) + 0.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(1, r.radius * t), 0, TAU);
      ctx.stroke();
    }
    // text
    ctx.globalCompositeOperation = "source-over";
    for (const t of this.texts) {
      const a = clamp(t.life / t.maxLife * 1.6, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `700 ${t.size}px "DejaVu Sans Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#05030d";
      ctx.fillText(t.text, t.x + 1.5, t.y + 1.5);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  clear() {
    this.items.length = 0;
    this.texts.length = 0;
    this.rings.length = 0;
  }
}
