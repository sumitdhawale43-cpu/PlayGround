const TAU = Math.PI * 2;
const WORLD_RADIUS = 400;
const CYAN = "#6ff7f0";
const RED = "#ff4f6d";
const AMBER = "#ffc35c";
const VIOLET = "#b38bff";
const GREEN = "#9dffb0";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function rgba(hex, alpha) {
  if (!hex || !hex.startsWith("#")) return `rgba(255,255,255,${alpha})`;
  const value = hex.slice(1);
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.w = 1;
    this.h = 1;
    this.dpr = 1;
    this.cx = 0;
    this.cy = 0;
    this.scale = 1;
    this.radius = 360;
    this.portrait = false;
    this.stars = [];
    this.dust = [];
    this.cracks = [];
    this.glows = new Map();
    this.titleT = 0;
    this.ambient = [];
    this.arenaGradient = null;
    this.bgGradient = null;
    this.resize();
    this.seedAmbient();
  }

  resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.portrait = h > w * 1.08;
    let radius;
    if (this.portrait) {
      radius = Math.min(w * 0.475, h * 0.295);
      this.cy = h * 0.425;
    } else {
      radius = Math.min(w * 0.405, h * 0.4);
      this.cy = h * 0.515;
    }
    if (w <= 820 && !this.portrait) {
      radius = Math.min(w * 0.34, h * 0.44);
      this.cy = h * 0.53;
    }
    this.radius = radius;
    this.cx = w / 2;
    this.scale = radius / WORLD_RADIUS;
    this.makeGradients();
    this.seedScene();
    this.buildCaches();
  }

  buildCaches() {
    this.buildBackdropCache();
    this.buildArenaCache();
  }

  buildBackdropCache() {
    const { w, h, dpr } = this;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
    bg.addColorStop(0, "#0d2033");
    bg.addColorStop(0.46, "#06101d");
    bg.addColorStop(1, "#010409");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const nebulaA = ctx.createRadialGradient(w * 0.16, h * 0.1, 0, w * 0.16, h * 0.1, Math.min(w, h) * 0.52);
    nebulaA.addColorStop(0, "rgba(28, 122, 132, 0.12)");
    nebulaA.addColorStop(1, "rgba(28, 122, 132, 0)");
    ctx.fillStyle = nebulaA;
    ctx.fillRect(0, 0, w, h);
    const nebulaB = ctx.createRadialGradient(w * 0.88, h * 0.92, 0, w * 0.88, h * 0.92, Math.min(w, h) * 0.5);
    nebulaB.addColorStop(0, "rgba(142, 32, 72, 0.1)");
    nebulaB.addColorStop(1, "rgba(142, 32, 72, 0)");
    ctx.fillStyle = nebulaB;
    ctx.fillRect(0, 0, w, h);

    // Static teal wash beneath the arena.
    const lift = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.radius * 1.35);
    lift.addColorStop(0, "rgba(24, 92, 102, 0.3)");
    lift.addColorStop(0.5, "rgba(9, 40, 52, 0.15)");
    lift.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lift;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const star of this.stars) {
      const alpha = star.alpha * (0.55 + 0.45 * Math.sin(star.phase));
      ctx.fillStyle =
        star.tint === "red"
          ? `rgba(255, 120, 140, ${alpha * 0.7})`
          : star.tint === "cyan"
            ? `rgba(111, 247, 240, ${alpha * 0.7})`
            : `rgba(220, 242, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, TAU);
      ctx.fill();
    }
    for (const mote of this.dust) {
      ctx.fillStyle = rgba(mote.tint, mote.alpha);
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(111, 247, 240, 0.025)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i += 1) {
      const y = i * 90 - 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + Math.sin(i) * 30);
      ctx.stroke();
    }
    ctx.restore();

    // Baked vignette (previously a full-screen DOM layer that forced the
    // browser to re-composite the animated canvas every frame).
    const vignette = ctx.createRadialGradient(
      w / 2,
      h * 0.48,
      Math.min(w, h) * 0.28,
      w / 2,
      h * 0.48,
      Math.max(w, h) * 0.72
    );
    vignette.addColorStop(0, "rgba(0, 2, 6, 0)");
    vignette.addColorStop(0.55, "rgba(0, 2, 6, 0.16)");
    vignette.addColorStop(1, "rgba(0, 2, 6, 0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const cinema = ctx.createLinearGradient(0, 0, 0, h);
    cinema.addColorStop(0, "rgba(0, 2, 6, 0.4)");
    cinema.addColorStop(0.12, "rgba(0, 2, 6, 0)");
    cinema.addColorStop(0.86, "rgba(0, 2, 6, 0)");
    cinema.addColorStop(1, "rgba(0, 2, 6, 0.48)");
    ctx.fillStyle = cinema;
    ctx.fillRect(0, 0, w, h);

    // Baked scanline grain, also static now.
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.022)";
    ctx.beginPath();
    for (let y = 0; y < h; y += 3) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.009)";
    ctx.beginPath();
    for (let x = 0; x < w; x += 4) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    ctx.stroke();
    ctx.restore();

    this.backdropCache = canvas;
  }

  buildArenaCache() {
    const extent = WORLD_RADIUS * 2 + 90;
    const pixelScale = this.scale * this.dpr;
    const px = Math.max(2, Math.ceil(extent * pixelScale));
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(pixelScale, 0, 0, pixelScale, px / 2, px / 2);
    const R = WORLD_RADIUS;

    const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    floor.addColorStop(0, "rgba(17, 50, 62, 0.99)");
    floor.addColorStop(0.42, "rgba(10, 30, 43, 0.97)");
    floor.addColorStop(0.78, "rgba(5, 16, 28, 0.99)");
    floor.addColorStop(1, "rgba(2, 6, 13, 1)");
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.clip();

    const rings = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.85, 0.94];
    rings.forEach((fraction, index) => {
      ctx.strokeStyle =
        index === rings.length - 1 ? "rgba(111,247,240,0.17)" : `rgba(111,247,240,${0.04 + index * 0.007})`;
      ctx.lineWidth = index === rings.length - 1 ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, R * fraction, 0, TAU);
      ctx.stroke();
    });

    ctx.strokeStyle = "rgba(111,247,240,0.04)";
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * R * 0.15, Math.sin(angle) * R * 0.15);
      ctx.lineTo(Math.cos(angle) * R * 0.955, Math.sin(angle) * R * 0.955);
      ctx.stroke();
    }

    for (let i = 0; i < 72; i += 1) {
      const angle = (i / 72) * TAU;
      const major = i % 6 === 0;
      const inner = R * (major ? 0.952 : 0.972);
      const outer = R * 0.99;
      ctx.strokeStyle = major ? "rgba(111,247,240,0.23)" : "rgba(111,247,240,0.06)";
      ctx.lineWidth = major ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    const numerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    ctx.font = "500 12px 'SFMono-Regular', 'Liberation Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    numerals.forEach((label, index) => {
      const angle = -Math.PI / 2 + (index / 12) * TAU;
      ctx.fillStyle = "rgba(160, 226, 228, 0.13)";
      ctx.fillText(label, Math.cos(angle) * (R - 24), Math.sin(angle) * (R - 24));
    });

    for (const crack of this.cracks) {
      ctx.strokeStyle = crack.color;
      ctx.lineWidth = crack.width;
      ctx.beginPath();
      crack.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(111,247,240,0.1)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 132, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([3, 9]);
    ctx.strokeStyle = "rgba(255,79,109,0.14)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 152, 0, TAU * 0.72);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(111,247,240,0.13)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, TAU);
    ctx.stroke();

    // Faint face marks near the centre.
    ctx.strokeStyle = "rgba(111,247,240,0.06)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 140, Math.sin(angle) * 140);
      ctx.lineTo(Math.cos(angle) * 148, Math.sin(angle) * 148);
      ctx.stroke();
    }
    ctx.restore();

    this.arenaCache = { canvas, extent };
  }

  makeGradients() {
    const ctx = this.ctx;
    const arena = ctx.createRadialGradient(0, 0, 0, 0, 0, WORLD_RADIUS);
    arena.addColorStop(0, "rgba(17, 50, 62, 0.99)");
    arena.addColorStop(0.42, "rgba(10, 30, 43, 0.97)");
    arena.addColorStop(0.78, "rgba(5, 16, 28, 0.99)");
    arena.addColorStop(1, "rgba(2, 6, 13, 1)");
    this.arenaGradient = arena;

    const bg = ctx.createRadialGradient(
      this.w * 0.5,
      this.h * 0.45,
      0,
      this.w * 0.5,
      this.h * 0.5,
      Math.max(this.w, this.h) * 0.78
    );
    bg.addColorStop(0, "#0d2033");
    bg.addColorStop(0.46, "#06101d");
    bg.addColorStop(1, "#010409");
    this.bgGradient = bg;
  }

  seedScene() {
    const random = mulberry32(1337 + Math.round(this.w + this.h));
    this.stars = Array.from({ length: 110 }, () => ({
      x: random() * this.w,
      y: random() * this.h,
      size: 0.5 + random() * 1.5,
      alpha: 0.12 + random() * 0.55,
      phase: random() * TAU,
      drift: 2 + random() * 6,
      tint: random() < 0.18 ? "red" : random() < 0.4 ? "cyan" : "white",
    }));
    this.dust = Array.from({ length: 42 }, () => ({
      x: random() * this.w,
      y: random() * this.h,
      r: 0.6 + random() * 2.2,
      speed: 4 + random() * 12,
      phase: random() * TAU,
      alpha: 0.05 + random() * 0.16,
      tint: random() < 0.2 ? AMBER : CYAN,
    }));

    this.cracks = [];
    const crackRandom = mulberry32(91);
    for (let c = 0; c < 6; c += 1) {
      const angle = crackRandom() * TAU;
      const start = 60 + crackRandom() * 240;
      const points = [];
      let r = start;
      let a = angle;
      for (let i = 0; i < 6; i += 1) {
        points.push([Math.cos(a) * r, Math.sin(a) * r]);
        r += 24 + crackRandom() * 45;
        a += (crackRandom() - 0.5) * 0.32;
      }
      this.cracks.push({
        points,
        color: crackRandom() < 0.3 ? "rgba(255,79,109,0.16)" : "rgba(111,247,240,0.1)",
        width: 0.7 + crackRandom() * 1.3,
      });
    }
  }

  seedAmbient() {
    const random = mulberry32(77);
    this.ambient = Array.from({ length: 28 }, () => ({
      angle: random() * TAU,
      radius: 120 + random() * 260,
      speed: 0.05 + random() * 0.18,
      size: 0.8 + random() * 2.2,
      phase: random() * TAU,
      color: random() < 0.3 ? RED : random() < 0.5 ? AMBER : CYAN,
    }));
  }

  glowSprite(color) {
    if (this.glows.has(color)) return this.glows.get(color);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, rgba(color, 0.95));
    gradient.addColorStop(0.18, rgba(color, 0.68));
    gradient.addColorStop(0.45, rgba(color, 0.22));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    this.glows.set(color, canvas);
    return canvas;
  }

  drawGlow(x, y, size, color, alpha = 1) {
    const sprite = this.glowSprite(color);
    const ctx = this.ctx;
    const previous = ctx.globalAlpha;
    ctx.globalAlpha = previous * alpha;
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = previous;
  }

  screenToWorld(x, y) {
    return {
      x: (x - this.cx) / this.scale,
      y: (y - this.cy) / this.scale,
    };
  }

  render(game, dt, app) {
    const ctx = this.ctx;
    const { w, h, dpr } = this;
    this.titleT += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    this.drawBackdrop(game, dt);

    const shake = game.shake || 0;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.translate(this.cx + sx, this.cy + sy);
    ctx.scale(this.scale, this.scale);

    this.drawArena(game, app);
    this.drawRings(game);
    if (app.state === "title") {
      this.drawTitleScene(game, app);
    } else {
      this.drawPickups(game);
      this.drawEnemies(game);
      this.drawBoss(game);
      this.drawPlayer(game, app);
      this.drawBullets(game);
      this.drawParticles(game);
      this.drawTexts(game);
    }
    ctx.restore();

    this.drawScreenEffects(game, app);
    if (app.touchMode && (app.state === "playing" || app.state === "paused")) {
      this.drawSticks(app, game);
    }
  }

  drawBackdrop(game, dt) {
    const ctx = this.ctx;
    const { w, h } = this;

    if (this.backdropCache) {
      ctx.drawImage(this.backdropCache, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#04060c";
      ctx.fillRect(0, 0, w, h);
    }

    // Cheap animated layer: a sparse subset of stars and dust so the
    // starfield still breathes without repainting the whole sky.
    const t = this.titleT;
    const pressure = Math.min(1, (game.debt.length + (game.boss ? 2 : 0)) / 8);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const twinklers = this.stars.length > 0 ? 3 : 1;
    for (let i = 0; i < this.stars.length; i += twinklers) {
      const star = this.stars[i];
      const x = star.x + Math.sin(t * 0.16 + star.phase) * star.drift;
      const y = (star.y + t * star.drift * 0.45) % (h + 20) - 10;
      const alpha = star.alpha * (0.55 + 0.45 * Math.sin(t * 0.8 + star.phase));
      ctx.fillStyle =
        star.tint === "red"
          ? `rgba(255, 120, 140, ${alpha * 0.7})`
          : star.tint === "cyan"
            ? `rgba(111, 247, 240, ${alpha * 0.7})`
            : `rgba(220, 242, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < this.dust.length; i += 4) {
      const mote = this.dust[i];
      const x = (mote.x + t * mote.speed * 0.35 + Math.sin(t * 0.4 + mote.phase) * 12) % (w + 40) - 20;
      const y = (mote.y - t * mote.speed + h + 20) % (h + 40) - 20;
      ctx.fillStyle = rgba(mote.tint, mote.alpha * 1.6);
      ctx.beginPath();
      ctx.arc(x, y, mote.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (pressure > 0.05) {
      const gradient = ctx.createRadialGradient(this.cx, this.cy, this.radius, this.cx, this.cy, this.radius * 1.4);
      gradient.addColorStop(0, "rgba(255,79,109,0)");
      gradient.addColorStop(1, `rgba(255,79,109,${pressure * 0.08})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawArena(game, app) {
    const ctx = this.ctx;
    const R = WORLD_RADIUS;
    const t = this.titleT;
    const pending = game.debt.length;
    const activeCollectors = game.enemies.reduce(
      (n, enemy) => n + (enemy.type === "collector" && enemy.alive ? 1 : 0),
      0
    );
    const pressure = Math.min(1, (pending * 0.55 + activeCollectors * 0.35 + (game.boss ? 0.6 : 0)) / 4);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);

    // Cached clock face (floor, rings, spokes, ticks, numerals, cracks, sigil).
    if (this.arenaCache) {
      const extent = this.arenaCache.extent;
      ctx.drawImage(this.arenaCache.canvas, -extent / 2, -extent / 2, extent, extent);
    }

    // Cheap outer halo instead of a per-frame radial gradient.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(111,247,240,${0.035 + pressure * 0.02})`;
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(0, 0, R + 6, 0, TAU);
    ctx.stroke();
    if (pressure > 0.03) {
      ctx.strokeStyle = `rgba(255,79,109,${pressure * 0.1})`;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(0, 0, R + 16, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // Clock hands — the minute hand spins while time is stolen.
    const stolenBonus = game.stolen ? game.stolen * 0.22 : 0;
    const hourAngle = -Math.PI / 2 + t * 0.035;
    const minuteAngle = -Math.PI / 2 + t * 0.22 + stolenBonus;
    ctx.strokeStyle = "rgba(180, 255, 250, 0.16)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(hourAngle) * 42, Math.sin(hourAngle) * 42);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,120,140,${0.18 + pressure * 0.2})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(minuteAngle) * 72, Math.sin(minuteAngle) * 72);
    ctx.stroke();
    ctx.fillStyle = "rgba(111,247,240,0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, TAU);
    ctx.fill();

    // Outer boundary.
    ctx.strokeStyle = `rgba(111,247,240,${0.22 + pressure * 0.25})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,79,109,${pressure * 0.18 * (0.6 + 0.4 * pulse)})`;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, R + 6, 0, TAU);
    ctx.stroke();

    // Debt pressure crawls around the rim.
    if (pressure > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const arcLength = TAU * 0.12 + pressure * TAU * 0.52;
      const arcStart = t * 0.35;
      for (let i = 0; i < 3; i += 1) {
        ctx.strokeStyle = `rgba(255,79,109,${(0.12 + pressure * 0.22) * (0.6 + 0.4 * Math.sin(t * 1.6 + i))})`;
        ctx.lineWidth = 2 + i;
        ctx.beginPath();
        ctx.arc(0, 0, R - 7 - i * 5, arcStart + i * 0.5, arcStart + i * 0.5 + arcLength);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Giant echo rings beyond the arena wall.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i += 1) {
      const ringRadius = R * (1.18 + i * 0.17);
      ctx.strokeStyle = `rgba(111,247,240,${0.035 - i * 0.008})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 16]);
      ctx.save();
      ctx.rotate(t * (i % 2 === 0 ? 0.018 : -0.014) + i);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Rotating marker shards at the edge.
    ctx.save();
    ctx.rotate(t * 0.08);
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(TAU / 4);
      ctx.fillStyle = `rgba(255,79,109,${0.14 + pressure * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(R + 1, -4);
      ctx.lineTo(R + 16, 0);
      ctx.lineTo(R + 1, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (game.boss && !game.boss.dead) {
      ctx.strokeStyle = `rgba(179,139,255,${0.12 + pulse * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.68, 0, TAU);
      ctx.stroke();
    }
  }

  drawTitleScene(game, app) {
    const ctx = this.ctx;
    const t = this.titleT;
    const p = game.player;

    // Ambient time dust.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of this.ambient) {
      const angle = mote.angle + t * mote.speed * 0.12;
      const radius = mote.radius + Math.sin(t * 0.4 + mote.phase) * 16;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      this.drawGlow(x, y, mote.size * 9, mote.color, 0.16 + 0.1 * Math.sin(t + mote.phase));
    }
    ctx.restore();

    // Future echoes pacing the rim.
    for (let i = 0; i < 3; i += 1) {
      const angle = t * 0.12 + (i / 3) * TAU;
      const x = Math.cos(angle) * 285;
      const y = Math.sin(angle) * 285;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalAlpha = 0.13 + 0.04 * Math.sin(t * 0.8 + i);
      this.drawShipShape(23, RED);
      ctx.restore();
    }

    // The duelist waits at the centre.
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-Math.PI / 2 + Math.sin(t * 0.5) * 0.06);
    const breathe = 1 + Math.sin(t * 1.2) * 0.03;
    ctx.scale(breathe, breathe);
    this.drawGlow(0, 0, 130, CYAN, 0.24);
    this.drawShipShape(28, CYAN, true);
    ctx.restore();

    this.drawGlow(0, 0, 300, CYAN, 0.035);
  }

  drawRings(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ring of game.rings) {
      const progress = 1 - ring.life / ring.maxLife;
      const radius = lerp(ring.r0, ring.r1, 1 - Math.pow(1 - progress, 2));
      const alpha = Math.max(0, ring.life / ring.maxLife) * 0.7;
      ctx.strokeStyle = rgba(ring.color, alpha * 0.35);
      ctx.lineWidth = ring.width * 2.4;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(ring.color, alpha);
      ctx.lineWidth = ring.width;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPickups(game) {
    const ctx = this.ctx;
    for (const pickup of game.pickups) {
      const pulse = 0.5 + 0.5 * Math.sin(pickup.t * 4);
      const alpha = pickup.life < 3 ? 0.4 + 0.6 * Math.abs(Math.sin(pickup.life * 6)) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawGlow(pickup.x, pickup.y, 44 + pulse * 10, GREEN, 0.32);
      ctx.translate(pickup.x, pickup.y);
      ctx.rotate(pickup.t * 0.9);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = "rgba(157,255,176,0.16)";
      ctx.fill();
      ctx.rotate(-pickup.t * 0.9);
      ctx.strokeStyle = "rgba(220,255,230,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawEnemies(game) {
    const ctx = this.ctx;
    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;
      if (enemy.spawnT > 0) {
        this.drawPortal(enemy);
        continue;
      }
      const alpha = enemy.flash > 0 ? 1 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (enemy.telegraph > 0) this.drawEnemyTelegraph(enemy, game);
      // Motion smear.
      if (Math.hypot(enemy.vx, enemy.vy) > 20) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        this.drawGlow(enemy.x - enemy.vx * 0.04, enemy.y - enemy.vy * 0.04, enemy.r * 3.6, enemy.color, 0.14);
        ctx.restore();
      }
      switch (enemy.type) {
        case "husk":
          this.drawHusk(enemy);
          break;
        case "gazer":
          this.drawGazer(enemy, game);
          break;
        case "brute":
          this.drawBrute(enemy);
          break;
        case "collector":
          this.drawCollector(enemy, game);
          break;
        default:
          break;
      }
      if (enemy.flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        this.drawGlow(enemy.x, enemy.y, enemy.r * 4, "#ffffff", Math.min(0.8, enemy.flash * 6));
        ctx.restore();
      }
      ctx.restore();
    }
  }

  drawPortal(enemy) {
    const ctx = this.ctx;
    const t = 1 - enemy.spawnT / enemy.spawnMax;
    const radius = lerp(enemy.r * 2.6, enemy.r * 1.1, t);
    const color = enemy.color;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(enemy.x, enemy.y);
    this.drawGlow(0, 0, enemy.r * 7, color, 0.3);
    ctx.rotate(this.titleT * 1.4);
    ctx.strokeStyle = rgba(color, 0.65);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 3; i += 1) {
      ctx.rotate(TAU / 3);
      ctx.strokeStyle = rgba(color, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.72, 0, 0.7);
      ctx.stroke();
    }
    ctx.restore();
    if (enemy.type === "collector") {
      ctx.save();
      ctx.fillStyle = `rgba(255,79,109,${0.5 + 0.3 * Math.sin(this.titleT * 8)})`;
      ctx.font = "700 9px 'SFMono-Regular', monospace";
      ctx.textAlign = "center";
      ctx.fillText("COLLECTOR", enemy.x, enemy.y - enemy.r * 2.1);
      ctx.restore();
    }
  }

  drawHusk(enemy) {
    const ctx = this.ctx;
    const angle = enemy.angle || 0;
    this.drawGlow(enemy.x, enemy.y, enemy.r * 6.8, enemy.color, 0.32);
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(this.titleT * 0.8 + enemy.phase);
    ctx.strokeStyle = rgba(enemy.color, 0.25);
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r + 7, i * 2.1, i * 2.1 + 0.9);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(62, 10, 30, 0.92)";
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(enemy.r * 1.3, 0);
    ctx.lineTo(-enemy.r * 0.55, enemy.r * 0.9);
    ctx.lineTo(-enemy.r * 0.12, 0);
    ctx.lineTo(-enemy.r * 0.55, -enemy.r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,220,230,0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(enemy.r * 0.78, 0);
    ctx.lineTo(-enemy.r * 0.15, 0);
    ctx.stroke();
    ctx.fillStyle = "#fff1f5";
    ctx.beginPath();
    ctx.arc(enemy.r * 0.38, 0, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawGazer(enemy, game) {
    const ctx = this.ctx;
    const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
    this.drawGlow(enemy.x, enemy.y, enemy.r * 5.8, enemy.color, 0.24);
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(this.titleT * 0.5 + enemy.phase);
    ctx.strokeStyle = rgba(enemy.color, 0.6);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r + 4 + i * 2.5, i * 0.6, i * 0.6 + 1.3);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.4;
    ctx.fillStyle = "rgba(32, 20, 5, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.r, enemy.r * 0.78, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    const blink = 0.55 + 0.45 * Math.abs(Math.sin(this.titleT * 1.3 + enemy.phase));
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(255,235,190,0.92)";
    ctx.beginPath();
    ctx.ellipse(2, 0, enemy.r * 0.56, enemy.r * 0.4 * blink, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#2b1602";
    ctx.beginPath();
    ctx.arc(5, 0, enemy.r * 0.22 * blink + 1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff6df";
    ctx.beginPath();
    ctx.arc(4, -2, 1.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  drawBrute(enemy) {
    const ctx = this.ctx;
    this.drawGlow(enemy.x, enemy.y, enemy.r * 5.2, enemy.color, 0.25);
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle * 0.4 + this.titleT * 0.2);
    ctx.strokeStyle = "rgba(179,139,255,0.75)";
    ctx.fillStyle = "rgba(24,14,42,0.9)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      const x = Math.cos(angle) * enemy.r;
      const y = Math.sin(angle) * enemy.r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-enemy.angle * 0.8);
    for (let i = 0; i < 3; i += 1) {
      ctx.rotate(TAU / 3);
      ctx.strokeStyle = rgba(enemy.color, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r * 0.62, 0.2, 1.1);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(230,210,255,0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();

    this.drawEnemyHealthBar(enemy, enemy.r * 2.2, -enemy.r - 12, "rgba(179,139,255,0.7)");
  }

  drawCollector(enemy, game) {
    const ctx = this.ctx;
    const angle = enemy.angle || 0;
    this.drawGlow(enemy.x, enemy.y, enemy.r * 6.4, RED, 0.34);
    for (let i = 1; i <= 2; i += 1) {
      ctx.save();
      ctx.globalAlpha = 0.16 / i;
      ctx.translate(enemy.x - enemy.vx * 0.035 * i, enemy.y - enemy.vy * 0.035 * i);
      ctx.rotate(angle);
      this.drawShipShape(enemy.r, RED);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(255,120,140,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r + 6, this.titleT * 1.5, this.titleT * 1.5 + 2.2);
    ctx.stroke();
    this.drawShipShape(enemy.r, RED);
    ctx.restore();

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(-this.titleT * 2.1);
    for (let i = 0; i < 3; i += 1) {
      ctx.rotate(TAU / 3);
      ctx.fillStyle = "rgba(255,79,109,0.75)";
      ctx.beginPath();
      ctx.moveTo(enemy.r + 8, 0);
      ctx.lineTo(enemy.r + 12, -1.7);
      ctx.lineTo(enemy.r + 12, 1.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    this.drawEnemyHealthBar(enemy, enemy.r * 2.4, -enemy.r - 13, "rgba(255,79,109,0.85)");
  }

  drawShipShape(size, color, bright = false) {
    const ctx = this.ctx;
    ctx.fillStyle = bright ? "rgba(12,54,58,0.9)" : "rgba(42,5,15,0.82)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.48, size * 0.5);
    ctx.lineTo(-size * 0.18, 0);
    ctx.lineTo(-size * 0.48, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bright ? "#eafffd" : "rgba(255,200,210,0.9)";
    ctx.beginPath();
    ctx.arc(size * 0.2, 0, Math.max(1.4, size * 0.09), 0, TAU);
    ctx.fill();
    if (bright) {
      ctx.strokeStyle = "rgba(111,247,240,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size * 0.28, size * 0.26);
      ctx.lineTo(-size * 0.72, size * 0.62);
      ctx.moveTo(-size * 0.28, -size * 0.26);
      ctx.lineTo(-size * 0.72, -size * 0.62);
      ctx.stroke();
    }
  }

  drawEnemyTelegraph(enemy, game) {
    const ctx = this.ctx;
    const strength = clamp(enemy.telegraph / Math.max(0.001, enemy.telegraphMax), 0, 1);
    const color =
      enemy.type === "brute" ? VIOLET : enemy.type === "gazer" ? AMBER : enemy.type === "collector" ? RED : CYAN;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.drawGlow(enemy.x, enemy.y, (enemy.r + 30) * 2, color, 0.1 + strength * 0.18);
    ctx.strokeStyle = rgba(color, 0.18 + strength * 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.r + 8 + strength * 8, 0, TAU);
    ctx.stroke();

    if (enemy.type === "gazer" || enemy.type === "collector") {
      const angle = Number.isFinite(enemy.lockAngle) ? enemy.lockAngle : 0;
      ctx.strokeStyle = rgba(color, 0.2 + strength * 0.35);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.x + Math.cos(angle) * 520, enemy.y + Math.sin(angle) * 520);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (enemy.type === "brute") {
      ctx.strokeStyle = rgba(VIOLET, 0.2 + strength * 0.4);
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(enemy.x + Math.cos(angle) * (enemy.r + 6), enemy.y + Math.sin(angle) * (enemy.r + 6));
        ctx.lineTo(enemy.x + Math.cos(angle) * (enemy.r + 22), enemy.y + Math.sin(angle) * (enemy.r + 22));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawEnemyHealthBar(enemy, width, offsetY, color) {
    const ctx = this.ctx;
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    const x = enemy.x - width / 2;
    const y = enemy.y + offsetY;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, width, 2.6);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * ratio, 2.6);
    ctx.restore();
  }

  drawBoss(game) {
    const boss = game.boss;
    if (!boss) return;
    const ctx = this.ctx;
    if (boss.spawnT > 0) {
      const t = 1 - boss.spawnT / boss.spawnMax;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.globalCompositeOperation = "lighter";
      this.drawGlow(0, 0, 400, RED, 0.25 + t * 0.2);
      ctx.rotate(this.titleT * 2);
      for (let i = 0; i < 4; i += 1) {
        ctx.rotate(TAU / 4);
        ctx.strokeStyle = `rgba(255,79,109,${0.2 + t * 0.5})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 160 - t * 80, 0, 1.2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    const pulse = 0.5 + 0.5 * Math.sin(this.titleT * 2.4);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.drawGlow(boss.x, boss.y, boss.r * 8, RED, 0.2 + pulse * 0.06);
    ctx.restore();

    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(boss.angle * 0.3);
    // Outer gear ring
    ctx.strokeStyle = "rgba(255,120,140,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, boss.r + 12, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 20; i += 1) {
      const angle = (i / 20) * TAU;
      ctx.strokeStyle = i % 5 === 0 ? "rgba(255,200,210,0.65)" : "rgba(255,79,109,0.4)";
      ctx.lineWidth = i % 5 === 0 ? 1.6 : 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (boss.r + 12), Math.sin(angle) * (boss.r + 12));
      ctx.lineTo(Math.cos(angle) * (boss.r + (i % 5 === 0 ? 22 : 18)), Math.sin(angle) * (boss.r + (i % 5 === 0 ? 22 : 18)));
      ctx.stroke();
    }
    ctx.rotate(-boss.angle * 0.8 + this.titleT * 0.1);
    ctx.strokeStyle = "rgba(179,139,255,0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, boss.r + 34, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    if (boss.phase === 2) {
      ctx.strokeStyle = `rgba(255,79,109,${0.2 + pulse * 0.2})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, boss.r + 46, this.titleT * 0.7, this.titleT * 0.7 + 4.8);
      ctx.stroke();
    }
    ctx.restore();

    // Face / clock body
    ctx.save();
    ctx.translate(boss.x, boss.y);
    const body = ctx.createRadialGradient(0, 0, 0, 0, 0, boss.r);
    body.addColorStop(0, "rgba(58, 16, 30, 0.98)");
    body.addColorStop(0.7, "rgba(20, 8, 18, 0.98)");
    body.addColorStop(1, "rgba(8, 3, 9, 1)");
    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(255,140,155,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, boss.r, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,170,185,0.22)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * TAU;
      const inner = boss.r * (i % 3 === 0 ? 0.78 : 0.86);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * boss.r * 0.94, Math.sin(angle) * boss.r * 0.94);
      ctx.stroke();
    }

    // Eye
    const toPlayer = Math.atan2(game.player.y - boss.y, game.player.x - boss.x);
    ctx.save();
    ctx.rotate(toPlayer);
    ctx.fillStyle = "rgba(255, 60, 90, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 0, boss.r * 0.52, boss.r * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,120,140,0.7)";
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 70, 95, 0.92)";
    ctx.beginPath();
    ctx.arc(boss.r * 0.12, 0, boss.r * 0.18 + pulse * 1.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff0f2";
    ctx.beginPath();
    ctx.arc(boss.r * 0.1, -2, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Hands
    ctx.rotate(this.titleT * 0.12);
    ctx.strokeStyle = "rgba(255,200,210,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-1.2) * boss.r * 0.5, Math.sin(-1.2) * boss.r * 0.5);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(255,79,109,0.65)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.titleT * 0.4) * boss.r * 0.72, Math.sin(this.titleT * 0.4) * boss.r * 0.72);
    ctx.stroke();
    ctx.restore();

    if (boss.telegraph > 0) {
      const strength = 1 - boss.telegraph / Math.max(0.001, boss.telegraphMax);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,79,109,${0.2 + strength * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.r + 25 + (1 - strength) * 40, 0, TAU);
      ctx.stroke();
      if (boss.pattern === "aimed") {
        const angle = Number.isFinite(boss.lockAngle) ? boss.lockAngle : 0;
        ctx.strokeStyle = `rgba(255,176,189,${0.2 + strength * 0.35})`;
        ctx.setLineDash([6, 9]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y);
        ctx.lineTo(boss.x + Math.cos(angle) * 560, boss.y + Math.sin(angle) * 560);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    if (boss.flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      this.drawGlow(boss.x, boss.y, boss.r * 4, "#ffffff", 0.7);
      ctx.restore();
    }

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 10px 'SFMono-Regular', monospace";
    ctx.fillStyle = `rgba(255,150,165,${0.5 + pulse * 0.2})`;
    ctx.fillText("THE AUDITOR", boss.x, boss.y - boss.r - 30);
    ctx.restore();
  }

  drawPlayer(game, app) {
    const ctx = this.ctx;
    const p = game.player;
    if (p.dead) return;
    const over = p.overdriveGlow || 0;

    // Movement trail
    if (p.trail.length > 2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 1; i < p.trail.length; i += 1) {
        const point = p.trail[i];
        const alpha = (1 - i / p.trail.length) * 0.12;
        this.drawGlow(point.x, point.y, 20 - i, CYAN, alpha);
      }
      ctx.restore();
    }

    // Future echo while time is slow.
    if (game.timeScale < 0.8 && game.echo.length > 3) {
      const target = game.time - 0.52;
      let sample = game.echo[0];
      for (const entry of game.echo) {
        if (entry.t <= target) sample = entry;
        else break;
      }
      if (sample) {
        const echoDist = Math.hypot(p.x - sample.x, p.y - sample.y);
        if (echoDist >= 16) {
          ctx.save();
          ctx.globalAlpha = Math.min(0.32, 0.1 + echoDist / 260) + 0.06 * Math.sin(this.titleT * 9);
          ctx.translate(sample.x, sample.y);
          ctx.rotate(sample.angle);
          this.drawShipShape(22, RED);
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.strokeStyle = RED;
          ctx.setLineDash([2, 6]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sample.x, sample.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    // Overclock aura
    if (over > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = over;
      this.drawGlow(p.x, p.y, 150, AMBER, 0.2 + 0.08 * Math.sin(this.titleT * 8));
      ctx.translate(p.x, p.y);
      ctx.rotate(this.titleT * 3.4);
      for (let i = 0; i < 3; i += 1) {
        ctx.rotate(TAU / 3);
        ctx.fillStyle = "rgba(255,215,106,0.8)";
        ctx.beginPath();
        ctx.moveTo(34, 0);
        ctx.lineTo(40, -2.4);
        ctx.lineTo(40, 2.4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Dash cooldown ring
    if (p.dashCd > 0) {
      const ratio = 1 - p.dashCd / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(111,247,240,0.13)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 28, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "rgba(111,247,240,0.5)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 28, -Math.PI / 2, -Math.PI / 2 + ratio * TAU);
      ctx.stroke();
      ctx.restore();
    }

    this.drawGlow(p.x, p.y, 124, over > 0.5 ? AMBER : CYAN, 0.3);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (p.invuln > 0 && Math.floor(p.invuln * 24) % 2 === 0) ctx.globalAlpha = 0.55;
    ctx.strokeStyle = over > 0.5 ? "rgba(255,215,106,0.35)" : "rgba(111,247,240,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, TAU);
    ctx.stroke();
    this.drawShipShape(27, over > 0.5 ? AMBER : CYAN, true);

    // Blink arc
    ctx.strokeStyle = over > 0.5 ? "rgba(255,215,106,0.55)" : "rgba(111,247,240,0.5)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, 21, -0.6, 0.6);
    ctx.stroke();
    ctx.restore();

    // Aim tick
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = over > 0.5 ? AMBER : CYAN;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * 34, p.y + Math.sin(p.angle) * 34);
    ctx.lineTo(p.x + Math.cos(p.angle) * 60, p.y + Math.sin(p.angle) * 60);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawBullets(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const bullet of game.bullets) {
      const friendly = bullet.friendly;
      const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
      const tail = friendly ? 22 : 14;
      const tx = bullet.x - (bullet.vx / speed) * tail;
      const ty = bullet.y - (bullet.vy / speed) * tail;
      const gradient = ctx.createLinearGradient(tx, ty, bullet.x, bullet.y);
      gradient.addColorStop(0, rgba(bullet.color, 0));
      gradient.addColorStop(1, rgba(bullet.color, friendly ? 0.8 : 0.55));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = friendly ? 2.6 : 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();
      this.drawGlow(bullet.x, bullet.y, friendly ? 24 : 19, bullet.color, friendly ? 0.5 : 0.4);
      ctx.fillStyle = friendly && bullet.overclocked ? "#fff4cc" : "#ffffff";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, friendly ? 2.2 : 1.8, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawParticles(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of game.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      if (particle.glow) this.drawGlow(particle.x, particle.y, particle.size * 8, particle.color, alpha * 0.3);
      if (particle.type === "shard") {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rot);
        ctx.fillStyle = rgba(particle.color, alpha);
        ctx.fillRect(-particle.size, -particle.size * 0.4, particle.size * 2, particle.size * 0.8);
        ctx.restore();
      } else {
        ctx.fillStyle = rgba(particle.color, alpha);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.4 + alpha * 0.6), 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawTexts(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const text of game.texts) {
      const alpha = clamp(text.life / text.maxLife, 0, 1);
      ctx.font = `700 ${text.size}px 'SFMono-Regular', 'Liberation Mono', monospace`;
      ctx.fillStyle = rgba(text.color, alpha);
      ctx.shadowColor = rgba(text.color, alpha * 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.restore();
  }

  drawScreenEffects(game, app) {
    const ctx = this.ctx;
    const { w, h } = this;
    const slow = clamp((1 - game.timeScale) / 0.8, 0, 1);

    if (slow > 0.02 && app.state !== "title") {
      ctx.save();
      ctx.fillStyle = `rgba(40, 110, 255, ${slow * 0.035})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const cx = w / 2;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.33;
      ctx.strokeStyle = `rgba(150, 235, 255, ${slow * 0.045})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(150, 235, 255, ${slow * 0.035})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.72, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 60; i += 1) {
        const angle = (i / 60) * TAU;
        ctx.globalAlpha = slow * (i % 5 === 0 ? 0.13 : 0.05);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * radius * 0.94, cy + Math.sin(angle) * radius * 0.94);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();
      }
      ctx.globalAlpha = slow * 0.16;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      const hand = game.time * 3.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hand) * radius * 0.62, cy + Math.sin(hand) * radius * 0.62);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hand * 0.18 - 1.2) * radius * 0.36, cy + Math.sin(hand * 0.18 - 1.2) * radius * 0.36);
      ctx.stroke();
      ctx.restore();
    }

    // Low health vignette.
    if (game.player.hp <= 32 && game.player.hp > 0 && app.state !== "title") {
      const pulse = 0.35 + 0.35 * Math.sin(this.titleT * 4);
      const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
      gradient.addColorStop(0, "rgba(255,40,70,0)");
      gradient.addColorStop(1, `rgba(255,30,60,${0.1 + pulse * 0.08})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    // Cinematic letterbox flash on death/victory.
    if (game.status === "dying" || game.status === "victory") {
      const amount = game.status === "dying" ? 0.55 : 0.2;
      const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${amount})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawSticks(app, game) {
    const ctx = this.ctx;
    const { w, h } = this;
    const defaultX = Math.max(88, w * 0.22);
    const baseY = h - 96;
    const sticks = app.input?.sticks;
    const drawStick = (name, defaultXPos, label) => {
      const stick = sticks?.[name];
      const active = stick?.active;
      const x = active ? stick.originX : defaultXPos;
      const y = active ? stick.originY : baseY;
      const nx = active ? stick.x : x;
      const ny = active ? stick.y : y;
      ctx.save();
      ctx.globalAlpha = active ? 0.75 : 0.28;
      ctx.strokeStyle = "rgba(111,247,240,0.5)";
      ctx.fillStyle = "rgba(5,12,20,0.28)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 48, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(111,247,240,0.18)";
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, TAU);
      ctx.stroke();
      const dx = nx - x;
      const dy = ny - y;
      const dist = Math.hypot(dx, dy);
      const max = 34;
      const scale = dist > max ? max / dist : 1;
      ctx.globalAlpha = active ? 0.95 : 0.5;
      this.drawGlow(x + dx * scale, y + dy * scale, 62, game.input.slow && name === "aim" ? AMBER : CYAN, 0.35);
      ctx.fillStyle = "rgba(160, 255, 250, 0.2)";
      ctx.strokeStyle = "rgba(160,255,250,0.8)";
      ctx.beginPath();
      ctx.arc(x + dx * scale, y + dy * scale, 21, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (!active) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "rgba(180, 220, 228, 0.65)";
        ctx.font = "700 9px 'SFMono-Regular', monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y + 66);
      }
      ctx.restore();
    };
    drawStick("move", defaultX, "MOVE");
    drawStick("aim", w - defaultX, "AIM · FIRE");
  }
}
