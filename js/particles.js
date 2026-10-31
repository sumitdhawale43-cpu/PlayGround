/* ============================================================
   TIME REWIND — particle field
   ============================================================ */

const TAU = Math.PI * 2;

export class ParticleField {
  constructor() {
    this.items = [];
    this.max = 760;
  }

  add(p) {
    if (this.items.length >= this.max) this.items.shift();
    p.max = p.life = p.life ?? 0.5;
    p.age = 0;
    p.vx ??= 0; p.vy ??= 0; p.gravity ??= 0; p.drag ??= 0;
    p.size ??= 2; p.rot ??= 0; p.spin ??= 0; p.alpha ??= 1;
    p.type ??= 'dot'; p.color ??= '#57f2ff';
    this.items.push(p);
    return p;
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.age += dt;
      if (p.age >= p.life) { this.items.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp; p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  }

  clear() { this.items.length = 0; }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.items) {
      const t = p.age / p.life;
      const fade = (1 - t) * p.alpha;
      if (fade <= 0.002) continue;
      ctx.globalAlpha = Math.min(1, fade);
      if (p.type === 'ring') {
        const r = p.size + (p.grow ?? 50) * easeOut(t);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.6, (p.width ?? 1.5) * (1 - t));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.stroke();
      } else if (p.type === 'line' || p.type === 'streak') {
        const len = p.len ?? 20;
        const speed = Math.hypot(p.vx, p.vy) || 1;
        const nx = p.vx / speed, ny = p.vy / speed;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - nx * len, p.y - ny * len);
        ctx.stroke();
      } else if (p.type === 'glyph') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * .55, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * .55, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'smoke') {
        ctx.globalCompositeOperation = 'source-over';
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1 + t * 1.8));
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = fade * 0.25;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + t * 1.8), 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
      } else {
        const s = p.size * (p.shrink === false ? 1 : (1 - t * 0.35));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, s), 0, TAU);
        ctx.fill();
        if (p.glow !== false && s > 1.1) {
          ctx.globalAlpha = fade * 0.16;
          ctx.beginPath();
          ctx.arc(p.x, p.y, s * 3.4, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  /* ---------------- authored effects ---------------- */

  run(x, y, dir, color) {
    if (Math.random() > 0.55) return;
    this.add({
      x: x - dir * 8 + rnd(-4, 4), y: y - rnd(0, 3),
      vx: -dir * rnd(12, 55), vy: -rnd(4, 22),
      life: rnd(0.2, 0.5), size: rnd(.8, 2), color,
      gravity: -12, drag: 1.2
    });
  }

  jump(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const a = Math.PI + rnd(-0.8, 0.8);
      this.add({ x: x + rnd(-10, 10), y, vx: Math.cos(a) * rnd(20, 100), vy: Math.sin(a) * rnd(20, 70), life: rnd(.25, .55), size: rnd(1, 2.4), color, gravity: 90, drag: 2 });
    }
    this.add({ type: 'ring', x, y: y - 2, size: 5, grow: 28, life: .35, color, width: 1.2 });
  }

  land(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.add({ x: x + rnd(-12, 12), y: y - 1, vx: rnd(-70, 70), vy: -rnd(6, 38), life: rnd(.18, .45), size: rnd(1, 2), color, gravity: 140, drag: 2.2 });
    }
    this.add({ type: 'ring', x, y: y - 1, size: 8, grow: 34, life: .3, color, width: 1 });
  }

  death(x, y, color, accent) {
    for (let i = 0; i < 38; i++) {
      const a = Math.random() * TAU;
      const s = rnd(40, 260);
      this.add({
        type: i % 4 === 0 ? 'shard' : 'dot',
        x, y: y - 24, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30,
        life: rnd(.4, 1.1), size: rnd(1.4, 3.6), color: i % 3 ? color : accent,
        gravity: 280, drag: 1.6, spin: rnd(-8, 8), rot: Math.random() * TAU
      });
    }
    this.add({ type: 'ring', x, y: y - 24, size: 10, grow: 130, life: .7, color: '#ff4f7b', width: 3 });
    this.add({ type: 'ring', x, y: y - 24, size: 2, grow: 80, life: .5, color: '#ffffff', width: 1 });
    for (let i = 0; i < 5; i++) this.add({ type: 'smoke', x: x + rnd(-15, 15), y: y - rnd(8, 40), vx: rnd(-20, 20), vy: -rnd(10, 40), life: rnd(.6, 1.4), size: rnd(12, 28), color: 'rgba(255,80,110,.5)', drag: 1 });
  }

  pickupCore(x, y) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * TAU;
      this.add({ x, y, vx: Math.cos(a) * rnd(30, 130), vy: Math.sin(a) * rnd(30, 130) - 20, life: rnd(.35, .8), size: rnd(1, 2.6), color: i % 3 ? '#ffd36e' : '#ffffff', drag: 1.5, gravity: 40 });
    }
    this.add({ type: 'ring', x, y, size: 6, grow: 52, life: .5, color: '#ffd36e', width: 1.6 });
    this.add({ type: 'ring', x, y, size: 3, grow: 28, life: .35, color: '#fff2c4', width: 1 });
  }

  pickupEnergy(x, y) {
    for (let i = 0; i < 15; i++) {
      const a = Math.random() * TAU;
      this.add({ x, y, vx: Math.cos(a) * rnd(20, 110), vy: Math.sin(a) * rnd(20, 110), life: rnd(.3, .7), size: rnd(1, 2.2), color: i % 2 ? '#57f2ff' : '#b6fdff', drag: 1.5 });
    }
    this.add({ type: 'ring', x, y, size: 4, grow: 42, life: .45, color: '#57f2ff', width: 1.4 });
  }

  checkpoint(x, y) {
    for (let i = 0; i < 22; i++) {
      this.add({ type: 'glyph', x: x + rnd(-20, 20), y: y - rnd(0, 80), vx: rnd(-8, 8), vy: -rnd(20, 65), life: rnd(.6, 1.3), size: rnd(2, 4), color: i % 2 ? '#57f2ff' : '#d8fdff', drag: .5, spin: rnd(-4, 4) });
    }
    this.add({ type: 'ring', x, y: y - 15, size: 8, grow: 75, life: .7, color: '#57f2ff', width: 2 });
  }

  portal(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * TAU;
      const r = rnd(18, 48);
      this.add({ x: x + Math.cos(a) * r * .55, y: y - 52 + Math.sin(a) * r, vx: Math.cos(a + 1.57) * rnd(10, 45), vy: Math.sin(a + 1.57) * rnd(10, 45), life: rnd(.4, .9), size: rnd(.7, 2), color, drag: .8 });
    }
  }

  rewindBurst(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * TAU;
      const r = rnd(12, 38);
      this.add({ type: i % 3 === 1 ? 'glyph' : 'dot', x: x + Math.cos(a) * r, y: y - 24 + Math.sin(a) * r, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, life: rnd(.3, .7), size: rnd(1, 3), color, drag: 2, spin: rnd(-5, 5) });
    }
    if (Math.random() > .7) this.add({ type: 'ring', x, y: y - 22, size: 20, grow: 45, life: .4, color, width: 1 });
  }

  echoPulse(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.add({ type: 'glyph', x: x + rnd(-60, 60), y: y + rnd(-5, 5), vx: rnd(-15, 15), vy: -rnd(25, 80), life: rnd(.5, 1), size: rnd(1.5, 3.5), color, drag: .8, spin: rnd(-3, 3) });
    }
    this.add({ type: 'ring', x, y: y - 5, size: 20, grow: 100, life: .55, color, width: 1.2 });
  }

  enemyAlert(x, y) {
    for (let i = 0; i < 5; i++) this.add({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-30, 30), vy: rnd(-50, -10), life: rnd(.2, .45), size: rnd(1, 2), color: '#ff4f7b', drag: 2 });
  }

  dust(x, y, color) {
    this.add({ x, y, vx: rnd(-12, 12), vy: rnd(-18, -5), life: rnd(.8, 1.7), size: rnd(.4, 1.2), color, drag: .2 });
  }
}

function rnd(a, b) { return a + Math.random() * (b - a); }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
