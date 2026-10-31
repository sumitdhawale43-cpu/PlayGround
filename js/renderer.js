/* =========================================================
   PORTAL RUNNER — scene composer
   Draws sky, parallax, live world, transition effects and
   the animated attract scene used behind the menus.
   ========================================================= */
import { LEVELS } from './levels.js';
import { drawWorldScene } from './world.js';
import { TAU, clamp, hash, rgba } from './utils.js';

const smooth = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const hexToRgb = (hex) => {
  if (typeof hex !== 'string' || hex[0] !== '#') return null;
  const h = hex.length === 4
    ? [hex[1] + hex[1], hex[2] + hex[2], hex[3] + hex[3]]
    : [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];
  return [parseInt(h[0], 16), parseInt(h[1], 16), parseInt(h[2], 16)];
};

const mixHex = (a, b, k) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return k < 0.5 ? a : b;
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * k));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

const mixPalette = (a, b, k) => ({
  sky: a.sky.map((c, i) => mixHex(c, b.sky[i], k)),
  accent: mixHex(a.accent, b.accent, k),
  accent2: mixHex(a.accent2, b.accent2, k),
  rockTop: mixHex(a.rockTop, b.rockTop, k),
  rockBody: mixHex(a.rockBody, b.rockBody, k),
  rockDeep: mixHex(a.rockDeep, b.rockDeep, k),
  far: mixHex(a.far, b.far, k),
  mid: mixHex(a.mid, b.mid, k),
  near: mixHex(a.near, b.near, k),
  sun: mixHex(a.sun, b.sun, k),
  sunEdge: mixHex(a.sunEdge, b.sunEdge, k),
  haze: k < 0.5 ? a.haze : b.haze,
  fog: k < 0.5 ? a.fog : b.fog,
});

const rr = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
};

export class Renderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.lastT = 0;
    this.stars = Array.from({ length: 150 }, (_, i) => ({
      x: hash(i * 3.13 + 4),
      y: hash(i * 7.77 + 19) * 0.78,
      r: 0.4 + hash(i * 12.9) * 1.7,
      tw: 0.9 + hash(i * 4.4) * 2.6,
      ph: hash(i * 21.3) * TAU,
      depth: 0.25 + hash(i * 5.1) * 0.75,
    }));
    this.embers = Array.from({ length: 64 }, (_, i) => ({
      x: hash(i * 8.31),
      y: hash(i * 3.97 + 9),
      s: 0.6 + hash(i * 13.7) * 2.4,
      sp: 0.2 + hash(i * 6.2) * 0.8,
      ph: hash(i * 18.2) * TAU,
    }));
    this.cardCache = new Map();
    this.menuPortal = { x: 0, y: 0, r: 0 };
  }

  /* ---------------------------------------------------------
     master draw
     --------------------------------------------------------- */
  render(t) {
    const g = this.game;
    const ctx = this.ctx;
    const view = g.view;
    const dpr = view.dpr || 1;
    const scale = view.scale || 1;
    const dt = Math.min(0.05, Math.max(0, t - this.lastT));
    this.lastT = t;

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    const hasLevel = !!(g.level && g.level.palette);
    const live = !!(hasLevel && g.player && g.world);
    const pal = hasLevel
      ? g.level.palette[g.layer] || g.level.palette.light
      : this.menuPalette(t);

    const camX = hasLevel ? (g.cam.x || 0) : t * 15;
    const camY = hasLevel ? (g.cam.y || 360) : 380;

    this.drawSky(ctx, view, pal, t, {
      camX,
      camY,
      menu: !hasLevel,
      drift: hasLevel ? 0 : t * 7
    });
    this.drawRidges(ctx, view, pal, camX, camY, t, hasLevel ? 0 : t * 9);
    this.drawCloudBands(ctx, view, pal, t, camX * 0.05, !hasLevel);

    if (!hasLevel) {
      this.drawAttract(ctx, view, pal, t);
    } else if (live) {
      drawWorldScene(this, g, t);
      this.drawWorldEffects(ctx, g, t);
    }

    this.drawAtmosphere(ctx, view, pal, t, !hasLevel);

    if (live && g.switching) this.drawSwitchFX(ctx, view, g, t);
    if (live && g.dying > 0) this.drawDeathFX(ctx, view, g);

    this.updateFlash(g);
    this.updateCursorGlow(g, dt);
  }

  /* ---------------------------------------------------------
     palette for the menu attract loop
     --------------------------------------------------------- */
  menuPalette(t) {
    const period = 17;
    const idx = Math.floor(t / period) % LEVELS.length;
    const next = (idx + 1) % LEVELS.length;
    const local = t % period;
    const k = smooth((local - (period - 3.2)) / 3.2);
    const a = LEVELS[idx].palette.light;
    const b = LEVELS[next].palette.light;
    return mixPalette(a, b, k);
  }

  /* ---------------------------------------------------------
     sky / stars / sun
     --------------------------------------------------------- */
  drawSky(ctx, view, pal, t, opts) {
    const w = view.w;
    const h = view.h;
    const menu = opts.menu;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(0.48, pal.sky[1]);
    sky.addColorStop(0.84, pal.sky[2]);
    sky.addColorStop(1, pal.rockDeep);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // stars sink toward the horizon and twinkle slowly
    const darkness = hexToRgb(pal.sky[0]);
    const starBoost = darkness ? clamp(1.15 - (darkness[0] + darkness[1] + darkness[2]) / 420, 0.32, 1) : 0.7;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const x = ((s.x * w + opts.camX * 0.018 * s.depth + w) % w);
      const y = s.y * h * 0.92 + Math.sin(t * 0.04 + s.ph) * 3;
      const a = (0.28 + 0.72 * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph))) * starBoost;
      ctx.fillStyle = `rgba(255,255,255,${a * (1 - y / h * 0.55)})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, TAU);
      ctx.fill();
      if (s.r > 1.5) {
        ctx.fillStyle = rgba(pal.accent, a * 0.28);
        ctx.beginPath();
        ctx.arc(x, y, s.r * 3.6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    // sun / moon
    const sunX = w * (menu ? 0.72 : 0.78) - opts.camX * 0.03;
    const sunY = h * (menu ? 0.24 : 0.2) + Math.sin(t * 0.12) * 4;
    const sunR = Math.min(w, h) * (menu ? 0.095 : 0.075);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.15, sunX, sunY, sunR * 5.6);
    halo.addColorStop(0, rgba(pal.sun, 0.5));
    halo.addColorStop(0.25, rgba(pal.sunEdge, 0.18));
    halo.addColorStop(1, rgba(pal.sunEdge, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(sunX - sunR * 6, sunY - sunR * 6, sunR * 12, sunR * 12);
    ctx.globalCompositeOperation = 'source-over';
    const disc = ctx.createRadialGradient(sunX - sunR * 0.3, sunY - sunR * 0.35, 1, sunX, sunY, sunR);
    disc.addColorStop(0, '#ffffff');
    disc.addColorStop(0.38, pal.sun);
    disc.addColorStop(0.86, pal.sunEdge);
    disc.addColorStop(1, rgba(pal.sunEdge, 0.15));
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();

    // thin eclipse ring
    ctx.strokeStyle = rgba(pal.accent, 0.28);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 1.36, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // aurora ribbons
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let band = 0; band < 3; band++) {
      const yBase = h * (0.24 + band * 0.1);
      const amp = h * (0.05 + band * 0.016);
      const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp * 2.4);
      grad.addColorStop(0, rgba(pal.accent, 0));
      grad.addColorStop(0.45, rgba(band === 1 ? pal.accent2 : pal.accent, 0.13 - band * 0.025));
      grad.addColorStop(1, rgba(pal.accent2, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-40, yBase);
      for (let x = -40; x <= w + 40; x += 34) {
        const y = yBase
          + Math.sin(x * 0.0055 + t * 0.22 + band * 1.7) * amp
          + Math.sin(x * 0.0021 - t * 0.13 + band) * amp * 0.8;
        ctx.lineTo(x, y);
      }
      for (let x = w + 40; x >= -40; x -= 34) {
        const y = yBase + amp * 1.9
          + Math.sin(x * 0.0042 + t * 0.19 + band * 2.1) * amp * 0.6;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawRidges(ctx, view, pal, camX, camY, t, drift = 0) {
    const w = view.w;
    const h = view.h;
    const layers = [
      { p: 0.055, base: 0.62, amp: 0.12, step: 150, seed: 12, color: pal.far, glow: 0.16 },
      { p: 0.11, base: 0.71, amp: 0.15, step: 122, seed: 47, color: pal.mid, glow: 0.22 },
      { p: 0.21, base: 0.83, amp: 0.17, step: 96, seed: 91, color: pal.near, glow: 0.3 },
    ];

    for (const L of layers) {
      const base = h * L.base + (camY - 360) * L.p * 0.22;
      const amp = h * L.amp;
      const offset = -camX * L.p + drift * L.p * 2;
      const pts = [];
      for (let x = -L.step * 2; x <= w + L.step * 2; x += L.step) {
        const wx = x - offset;
        const ridge =
          Math.sin(wx * 0.0022 + L.seed) * 0.55 +
          Math.sin(wx * 0.0057 + L.seed * 1.7) * 0.28 +
          Math.sin(wx * 0.0131 + L.seed * 0.6) * 0.12;
        const y = base - amp * (0.48 + ridge * 0.62);
        pts.push([x, y]);
      }

      ctx.beginPath();
      ctx.moveTo(-L.step * 2, h + 40);
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(w + L.step * 2, h + 40);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, base - amp, 0, h);
      grad.addColorStop(0, rgba(L.color, 0.96));
      grad.addColorStop(0.62, rgba(L.color, 0.98));
      grad.addColorStop(1, pal.rockDeep);
      ctx.fillStyle = grad;
      ctx.fill();

      // silhouette rim light along the ridge
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = rgba(pal.accent, L.glow);
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // sparse trees / spires on the near two layers
      if (L.p > 0.1) {
        ctx.fillStyle = rgba(pal.rockDeep, 0.75);
        for (let i = 0; i < pts.length; i += 4) {
          const [x, y] = pts[i];
          if (x < -40 || x > w + 40) continue;
          const sd = hash(i * 7 + L.seed);
          if (sd < 0.28) continue;
          const th = 8 + sd * (L.p > 0.2 ? 34 : 20);
          ctx.beginPath();
          ctx.moveTo(x - th * 0.16, y);
          ctx.lineTo(x, y - th);
          ctx.lineTo(x + th * 0.16, y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // horizon haze line
    const haze = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.9);
    haze.addColorStop(0, rgba(pal.accent, 0));
    haze.addColorStop(0.55, rgba(pal.accent, 0.035));
    haze.addColorStop(1, rgba(pal.accent2, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.5, w, h * 0.46);
    void t;
  }

  drawCloudBands(ctx, view, pal, t, parallax, menu) {
    const w = view.w;
    const h = view.h;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const speed = 2.2 + hash(i * 3.2) * 5;
      const span = w + 480;
      const x = ((hash(i * 8.1) * span + t * speed - parallax * 60 + span) % span) - 240;
      const y = h * (0.44 + hash(i * 5.7) * 0.22) + Math.sin(t * 0.1 + i) * 5;
      const rx = 90 + hash(i * 11.3) * 180;
      const ry = 9 + hash(i * 4.9) * 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rx);
      grad.addColorStop(0, rgba(pal.accent2, 0.032));
      grad.addColorStop(0.55, rgba(pal.accent, 0.022));
      grad.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = grad;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    void menu;
  }

  /* ---------------------------------------------------------
     attract scene behind the title and menus
     --------------------------------------------------------- */
  drawAttract(ctx, view, pal, t) {
    const w = view.w;
    const h = view.h;
    const px = w * 0.715;
    const py = h * 0.475 + Math.sin(t * 0.55) * 5;
    const R = Math.min(w, h) * 0.205;

    this.menuPortal = { x: px, y: py, r: R };

    // distant broken arches
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const x = w * (0.08 + i * 0.21) - ((t * 2.2) % (w * 0.2));
      const base = h * 0.81 + 10;
      const aw = 34 + (i % 3) * 22;
      const ah = 90 + (i % 4) * 46;
      ctx.fillStyle = pal.far;
      ctx.beginPath();
      ctx.moveTo(x - aw * 0.55, base);
      ctx.lineTo(x - aw * 0.34, base - ah);
      ctx.quadraticCurveTo(x, base - ah - aw * 0.7, x + aw * 0.34, base - ah);
      ctx.lineTo(x + aw * 0.55, base);
      ctx.lineTo(x + aw * 0.18, base);
      ctx.lineTo(x + aw * 0.18, base - ah * 0.65);
      ctx.quadraticCurveTo(x, base - ah * 0.9, x - aw * 0.18, base - ah * 0.65);
      ctx.lineTo(x - aw * 0.18, base);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // light beam through the portal
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = ctx.createLinearGradient(px, py, px, 0);
    beam.addColorStop(0, rgba(pal.accent, 0.16));
    beam.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(px - R * 0.72, py + R * 0.2);
    ctx.lineTo(px - R * 2.4, -40);
    ctx.lineTo(px + R * 2.4, -40);
    ctx.lineTo(px + R * 0.72, py + R * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // floating island
    const islandY = py + R * 1.12;
    this.drawIsland(ctx, px, islandY, R * 0.92, pal, t);

    // the portal itself
    this.drawPortalRing(ctx, px, py, R, pal, t, { attract: true });

    // traveler silhouette on the island
    this.drawTraveler(ctx, px + R * 0.02, islandY - 4, Math.max(0.75, R / 150), pal, t);

    // floating shards around the ring
    for (let i = 0; i < 7; i++) {
      const a = t * 0.28 + (i / 7) * TAU;
      const rr2 = R * (1.25 + (i % 3) * 0.14);
      const sx = px + Math.cos(a) * rr2;
      const sy = py + Math.sin(a) * rr2 * 0.72 + Math.sin(t * 0.9 + i) * 6;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a * 1.7);
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      glow.addColorStop(0, rgba(i % 2 ? pal.accent2 : pal.accent, 0.55));
      glow.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(-20, -20, 40, 40);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = i % 2 ? pal.accent2 : pal.accent;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // foreground mist
    const mist = ctx.createLinearGradient(0, h * 0.68, 0, h);
    mist.addColorStop(0, rgba(pal.accent, 0));
    mist.addColorStop(0.55, rgba(pal.accent, 0.05));
    mist.addColorStop(1, rgba(pal.rockDeep, 0.74));
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.66, w, h * 0.34);
  }

  drawIsland(ctx, cx, top, r, pal, t) {
    ctx.save();
    ctx.translate(cx, top);
    const grad = ctx.createLinearGradient(0, 0, 0, r * 1.2);
    grad.addColorStop(0, pal.rockTop);
    grad.addColorStop(0.34, pal.rockBody);
    grad.addColorStop(1, pal.rockDeep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(-r * 0.8, 14, -r * 0.42, 18);
    ctx.quadraticCurveTo(-r * 0.18, r * 0.72, 0, r * 0.94);
    ctx.quadraticCurveTo(r * 0.24, r * 0.62, r * 0.44, 18);
    ctx.quadraticCurveTo(r * 0.82, 13, r, 0);
    ctx.quadraticCurveTo(0, 22, -r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(pal.accent, 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, 22, r, 0);
    ctx.stroke();

    // hanging vines
    ctx.strokeStyle = rgba(pal.accent, 0.24);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const x = -r * 0.7 + (i / 4) * r * 1.4;
      const len = 12 + hash(i * 4.3) * 34;
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.quadraticCurveTo(x + Math.sin(t * 0.8 + i) * 6, 12 + len * 0.6, x + Math.sin(t * 0.8 + i) * 9, 12 + len);
      ctx.stroke();
    }
    ctx.restore();

    // tiny floating rocks
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * r * 1.16;
      const y = top + 34 + Math.sin(t * 0.7 + i * 1.7) * 10 + i * 12;
      const s = 9 + i * 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.4 + i) * 0.2);
      ctx.fillStyle = rgba(pal.rockBody, 0.9);
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(-s * 0.3, -s * 0.5);
      ctx.lineTo(s * 0.7, -s * 0.2);
      ctx.lineTo(s * 0.4, s * 0.7);
      ctx.lineTo(-s * 0.6, s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(pal.accent, 0.24);
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawTraveler(ctx, x, feet, s, pal, t) {
    ctx.save();
    ctx.translate(x, feet);
    ctx.scale(s, s);
    // shadow on the island
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 4, 0, 0, TAU);
    ctx.fill();

    const sway = Math.sin(t * 0.9) * 1.4;
    // cape
    ctx.fillStyle = rgba(pal.accent, 0.34);
    ctx.beginPath();
    ctx.moveTo(-5, -52);
    ctx.quadraticCurveTo(-26 - sway * 3, -42, -34 - sway * 5, -8);
    ctx.quadraticCurveTo(-16, -20, -3, -28);
    ctx.closePath();
    ctx.fill();

    // legs
    ctx.strokeStyle = '#0b1220';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -24);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-10, 0);
    ctx.moveTo(4, -24);
    ctx.lineTo(7, -10);
    ctx.lineTo(5, 0);
    ctx.stroke();

    // torso
    const grad = ctx.createLinearGradient(0, -58, 0, -22);
    grad.addColorStop(0, '#26334f');
    grad.addColorStop(1, '#0b1220');
    ctx.fillStyle = grad;
    rr(ctx, -8, -52, 16, 30, 6);
    ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.7);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // head + visor
    ctx.fillStyle = '#0b1220';
    ctx.beginPath();
    ctx.arc(0, -61, 9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.6);
    ctx.stroke();
    ctx.fillStyle = pal.accent;
    ctx.shadowColor = pal.accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(3.5, -61, 5.5, 2.3, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    // scarf
    ctx.strokeStyle = rgba(pal.accent2, 0.86);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -51);
    ctx.quadraticCurveTo(-19 + sway, -48, -25 + sway * 2, -38);
    ctx.stroke();

    ctx.restore();
  }

  drawPortalRing(ctx, x, y, r, pal, t, opts = {}) {
    const rx = r * 0.72;
    const ry = r;
    const spin = t * 0.55;
    ctx.save();
    ctx.translate(x, y);

    // glow behind the portal
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.65);
    glow.addColorStop(0, rgba(pal.accent, 0.28));
    glow.addColorStop(0.52, rgba(pal.accent2, 0.1));
    glow.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-r * 1.7, -r * 1.7, r * 3.4, r * 3.4);

    // portal core
    const core = ctx.createRadialGradient(-rx * 0.18, -ry * 0.2, r * 0.05, 0, 0, r);
    core.addColorStop(0, 'rgba(255,255,255,0.98)');
    core.addColorStop(0.16, rgba(pal.accent, 0.92));
    core.addColorStop(0.44, rgba(pal.accent2, 0.62));
    core.addColorStop(0.75, rgba(pal.rockDeep, 0.9));
    core.addColorStop(1, rgba(pal.rockDeep, 0.2));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // swirling bands inside the core
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.94, ry * 0.96, 0, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a0 = spin * (0.7 + i * 0.12) + i * 0.9;
      ctx.strokeStyle = rgba(i % 2 ? pal.accent2 : '#ffffff', 0.16 + (i % 3) * 0.05);
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a0) * rx * 0.14,
        Math.sin(a0) * ry * 0.14,
        rx * (0.26 + i * 0.09),
        ry * (0.2 + i * 0.09),
        a0,
        0,
        TAU * 0.72
      );
      ctx.stroke();
    }
    // drifting sparks in the portal
    for (let i = 0; i < 26; i++) {
      const a = hash(i * 4.2) * TAU + t * (0.12 + hash(i * 7.1) * 0.22);
      const rad = hash(i * 9.8) * 0.82;
      const sx = Math.cos(a) * rx * rad;
      const sy = Math.sin(a) * ry * rad;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + hash(i * 3.3) * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.7 + hash(i * 6.7) * 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // ring body
    const ringGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    ringGrad.addColorStop(0, '#ffffff');
    ringGrad.addColorStop(0.3, pal.accent);
    ringGrad.addColorStop(0.72, pal.accent2);
    ringGrad.addColorStop(1, rgba(pal.accent, 0.4));
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = Math.max(3, r * 0.055);
    ctx.shadowColor = pal.accent;
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // thin secondary rings
    ctx.strokeStyle = rgba('#ffffff', 0.52);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.08, ry * 1.06, 0, 0, TAU);
    ctx.stroke();

    // orbiting runes
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const a = spin * 0.9 + (i / 18) * TAU;
      const ox = Math.cos(a) * rx * 1.2;
      const oy = Math.sin(a) * ry * 1.2;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(a);
      ctx.fillStyle = rgba(i % 2 ? pal.accent2 : pal.accent, 0.72);
      ctx.fillRect(-1.3, -1.3, 2.6, 2.6);
      ctx.restore();
    }
    ctx.restore();

    if (opts.attract) {
      // ground ring reflection
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const refl = ctx.createLinearGradient(0, y + r * 0.9, 0, y + r * 1.7);
      refl.addColorStop(0, rgba(pal.accent, 0.14));
      refl.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = refl;
      ctx.beginPath();
      ctx.ellipse(x, y + r * 1.22, rx * 0.92, r * 0.28, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------
     live world extras
     --------------------------------------------------------- */
  drawWorldEffects(ctx, g, t) {
    const view = g.view;
    const cam = g.cam;
    const shakeX = Math.sin(t * 91) * cam.shake;
    const shakeY = Math.cos(t * 77) * cam.shake;

    ctx.save();
    ctx.translate(view.w / 2 - cam.x + shakeX, view.h / 2 - cam.y + shakeY);

    // dash speed lines
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of g.speedLines) {
      const a = clamp(l.life / l.max, 0, 1);
      if (a <= 0) continue;
      ctx.strokeStyle = g.layer === 'light'
        ? `rgba(190,255,248,${a * 0.55})`
        : `rgba(255,190,242,${a * 0.55})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - Math.sign(l.vx || 1) * (18 + a * 34), l.y);
      ctx.stroke();
    }
    ctx.restore();

    // ring shockwaves
    for (const e of g.effects) {
      if (e.type !== 'ring') continue;
      const p = 1 - clamp(e.life / e.max, 0, 1);
      const rad = e.radius + p * 190;
      const a = (1 - p) * 0.6;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(e.color, a);
      ctx.lineWidth = 2.4 * (1 - p) + 0.6;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(e.color, a * 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad * 0.72, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  drawSwitchFX(ctx, view, g, t) {
    const sw = g.switching;
    if (!sw) return;
    const p = clamp(sw.t / sw.dur, 0, 1);
    const portal = sw.portal;
    const sx = portal.x - g.cam.x + view.w / 2;
    const sy = portal.y - 54 - g.cam.y + view.h / 2;
    const cx = clamp(sx, -80, view.w + 80);
    const cy = clamp(sy, -80, view.h + 80);
    const pal = g.level.palette[g.layer];
    const force = Math.sin(p * Math.PI);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';

    // radial streaks
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU + t * 0.3;
      const inner = 20 + p * 70;
      const outer = inner + 40 + force * 170;
      ctx.strokeStyle = rgba(i % 2 ? pal.accent2 : pal.accent, force * 0.28);
      ctx.lineWidth = 1 + (i % 3) * 0.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }

    // expanding rings
    for (let i = 0; i < 4; i++) {
      const ph = (p * 1.45 + i * 0.2) % 1;
      const rad = 30 + ph * Math.max(view.w, view.h) * 0.55;
      ctx.strokeStyle = rgba(i % 2 ? pal.accent2 : pal.accent, (1 - ph) * 0.5 * force);
      ctx.lineWidth = 2 + (1 - ph) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, TAU);
      ctx.stroke();
    }

    // centre bloom
    const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, 130 + force * 80);
    bloom.addColorStop(0, `rgba(255,255,255,${0.38 * force})`);
    bloom.addColorStop(0.35, rgba(pal.accent, 0.22 * force));
    bloom.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(-260, -260, 520, 520);
    ctx.restore();
  }

  drawDeathFX(ctx, view, g) {
    const p = clamp(g.dying / 0.55, 0, 1);
    if (p <= 0) return;
    const grad = ctx.createRadialGradient(
      view.w / 2, view.h / 2, view.h * 0.1,
      view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.72
    );
    grad.addColorStop(0, 'rgba(255,60,110,0)');
    grad.addColorStop(0.7, `rgba(255,40,90,${0.12 * p})`);
    grad.addColorStop(1, `rgba(120,0,35,${0.3 * p})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  drawAtmosphere(ctx, view, pal, t, menu) {
    const w = view.w;
    const h = view.h;
    ctx.save();

    // dimension haze / coloured fog
    const fog = ctx.createLinearGradient(0, h * 0.52, 0, h);
    fog.addColorStop(0, rgba(pal.accent, 0));
    fog.addColorStop(0.6, pal.haze);
    fog.addColorStop(1, rgba(pal.rockDeep, 0.78));
    ctx.globalAlpha = menu ? 0.45 : 0.72;
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);
    ctx.globalAlpha = 1;

    // drifting motes
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      const x = ((e.x * w + t * (6 + e.sp * 16) + Math.sin(t * 0.3 + e.ph) * 18) % (w + 40)) - 20;
      const y = ((e.y * h - t * (3 + e.sp * 10) + h + 40) % (h + 40)) - 20;
      const a = 0.16 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + e.ph));
      ctx.fillStyle = rgba(e.s > 1.7 ? pal.accent2 : pal.accent, a);
      ctx.beginPath();
      ctx.arc(x, y, e.s * 0.7, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // top light wash
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    top.addColorStop(0, rgba(pal.accent, menu ? 0.08 : 0.05));
    top.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.4);

    // subtle corner vignette to marry canvas and UI
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(2,5,12,0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  updateFlash(g) {
    const el = g.ui && g.ui.el && g.ui.el.flash;
    if (!el) return;
    const a = clamp(g.dimFlash || 0, 0, 1);
    el.style.opacity = a.toFixed(3);
    if (a > 0.001) {
      const x = clamp(g.dimFlashPos ? g.dimFlashPos.x : 0.5, 0, 1) * 100;
      const y = clamp(g.dimFlashPos ? g.dimFlashPos.y : 0.5, 0, 1) * 100;
      el.style.setProperty('--fx', x.toFixed(1) + '%');
      el.style.setProperty('--fy', y.toFixed(1) + '%');
    }
  }

  updateCursorGlow() {
    // reserved for future pointer-reactive lighting
  }

  /* ---------------------------------------------------------
     level-select card art
     --------------------------------------------------------- */
  makeCardArt(level) {
    if (!level || !level.palette) return '';
    const key = level.id + ':' + (level.palette.light ? level.palette.light.sky[1] : '');
    if (this.cardCache.has(key)) return this.cardCache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    const view = { w: 720, h: 440 };
    const pal = level.palette.light;
    const t = level.id * 1.7;

    this.drawSky(ctx, view, pal, t, { camX: 240 + level.id * 60, camY: 360, menu: true, drift: level.id * 4 });
    this.drawRidges(ctx, view, pal, 260 + level.id * 80, 360, t, level.id * 3);
    this.drawCloudBands(ctx, view, pal, t, 12, true);

    // curated floating platforms using the level's own palette
    const platform = (x, y, w, h, glow) => {
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, pal.rockTop);
      grad.addColorStop(0.22, pal.rockBody);
      grad.addColorStop(1, pal.rockDeep);
      ctx.fillStyle = grad;
      rr(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = rgba(pal.accent, glow);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 1);
      ctx.lineTo(x + w - 8, y + 1);
      ctx.stroke();
    };

    platform(-30, 352, 286, 88, 0.5);
    platform(312, 312, 170, 30, 0.42);
    platform(536, 370, 214, 70, 0.45);

    // ghost platform from the other layer
    ctx.save();
    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = rgba(pal.accent, 0.35);
    ctx.fillStyle = rgba(pal.accent, 0.05);
    rr(ctx, 226, 250, 190, 22, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // portal
    this.drawPortalRing(ctx, 544, 246, 82, pal, t + 2, { attract: true });

    // traveller on the middle platform
    this.drawTraveler(ctx, 390, 311, 0.82, pal, t);

    // shards
    for (let i = 0; i < 5; i++) {
      const x = 130 + i * 116 + Math.sin(t + i) * 6;
      const y = 210 + Math.sin(i * 1.8) * 28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.8 + i) * 0.5);
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
      glow.addColorStop(0, rgba(i === 2 ? pal.accent2 : pal.accent, 0.5));
      glow.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(-18, -18, 36, 36);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = i === 2 ? pal.accent2 : pal.accent;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-4.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // readable gradient for card copy
    const shade = ctx.createLinearGradient(0, 150, 0, 440);
    shade.addColorStop(0, 'rgba(3,7,14,0)');
    shade.addColorStop(0.58, 'rgba(3,7,14,0.42)');
    shade.addColorStop(1, 'rgba(3,7,14,0.92)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 140, 720, 300);

    // frame glow
    const border = ctx.createLinearGradient(0, 0, 720, 440);
    border.addColorStop(0, rgba(pal.accent, 0.34));
    border.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    border.addColorStop(1, rgba(pal.accent2, 0.26));
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 717, 437);

    const url = canvas.toDataURL('image/jpeg', 0.84);
    this.cardCache.set(key, url);
    return url;
  }
}
