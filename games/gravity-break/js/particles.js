/* ============================================================
   GRAVITY BREAK — particle system
   Simple pooled particle list with additive rendering.
   ============================================================ */
(function (root) {
  'use strict';

  var MAX = 700;

  function Particles() {
    this.list = [];
  }

  Particles.prototype.spawn = function (x, y, vx, vy, life, color, size, opts) {
    if (this.list.length >= MAX) this.list.shift();
    opts = opts || {};
    this.list.push({
      x: x, y: y, vx: vx, vy: vy,
      life: life, maxLife: life,
      color: color, size: size,
      g: opts.g !== undefined ? opts.g : 0,
      drag: opts.drag !== undefined ? opts.drag : 0,
      fade: opts.fade !== false,
      shrink: opts.shrink !== false,
      square: !!opts.square
    });
  };

  Particles.prototype.burst = function (x, y, n, color, speed, opts) {
    opts = opts || {};
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = speed * (0.3 + Math.random() * 0.7);
      this.spawn(
        x, y,
        Math.cos(a) * s, Math.sin(a) * s,
        (opts.life || 0.5) * (0.5 + Math.random() * 0.8),
        color,
        (opts.size || 3) * (0.5 + Math.random() * 0.8),
        { g: opts.g, drag: opts.drag, square: opts.square }
      );
    }
  };

  Particles.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.vy += p.g * dt;
      if (p.drag) { var d = 1 - p.drag * dt; p.vx *= d; p.vy *= d; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  };

  Particles.prototype.draw = function (ctx, ox, oy) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      var t = p.life / p.maxLife;
      ctx.globalAlpha = p.fade ? t : 1;
      ctx.fillStyle = p.color;
      var s = p.shrink ? p.size * (0.35 + 0.65 * t) : p.size;
      var x = p.x - ox, y = p.y - oy;
      if (p.square) {
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  Particles.prototype.clear = function () { this.list.length = 0; };

  root.GBParticles = Particles;
  if (typeof module !== 'undefined' && module.exports) module.exports = Particles;
})(typeof globalThis !== 'undefined' ? globalThis : this);
