// Arena, camera, effects and projectile rendering
import { ARENAS, FIGHTERS, WORLD } from './data.js';
import { drawFighter, drawShadow } from './rig.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xb1ade);
const buildingsFar = [];
const buildingsMid = [];
const stars = [];
const rain = [];
const snow = [];
const embers = [];
const dust = [];
for (let i = 0; i < 140; i++) stars.push({ x: rng(), y: rng() * 0.62, s: rng() * 1.8 + 0.4, p: rng() * TAU });
for (let x = -260; x < 2200; x += 58 + rng() * 100) {
  buildingsFar.push({ x, w: 50 + rng() * 110, h: 70 + rng() * 250, c: rng(), s: rng() });
}
for (let x = -240; x < 2200; x += 90 + rng() * 130) {
  buildingsMid.push({ x, w: 60 + rng() * 120, h: 110 + rng() * 330, c: rng(), s: rng() });
}
for (let i = 0; i < 120; i++) rain.push({ x: rng(), y: rng(), len: 8 + rng() * 20, sp: 0.5 + rng() * 1.1, a: 0.04 + rng() * 0.14 });
for (let i = 0; i < 150; i++) snow.push({ x: rng(), y: rng(), r: 0.6 + rng() * 2.4, sp: 0.02 + rng() * 0.08, sway: rng() * TAU, a: 0.18 + rng() * 0.55 });
for (let i = 0; i < 90; i++) embers.push({ x: rng(), y: rng(), r: 0.6 + rng() * 2.4, sp: 0.01 + rng() * 0.06, sway: rng() * TAU, a: 0.2 + rng() * 0.7 });
for (let i = 0; i < 45; i++) dust.push({ x: rng(), y: rng(), r: 0.5 + rng() * 2.2, sp: 0.005 + rng() * 0.02, sway: rng() * TAU, a: 0.08 + rng() * 0.2 });

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.view = null;
    this.camera = { x: 800, span: 520, smoothX: 800, smoothSpan: 520 };
    this.arenaLayer = document.createElement('canvas');
    this.arenaLayerCtx = this.arenaLayer.getContext('2d', { alpha: false });
    this.arenaKey = '';
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
  }

  setTarget(x, span) {
    this.camera.x = x;
    this.camera.span = span;
  }

  computeView(dt = 1 / 60) {
    const w = this.w, h = this.h;
    const aspect = w / h;
    const mobile = w < 860 && aspect < 1.02;
    const cam = this.camera;
    cam.smoothX += (cam.x - cam.smoothX) * Math.min(1, dt * 8);
    cam.smoothSpan += (cam.span - cam.smoothSpan) * Math.min(1, dt * 5);
    let scale, offX, offY, camX;
    if (mobile) {
      const desired = clamp(cam.smoothSpan + 265, 660, 1360);
      scale = clamp(w / desired, 0.33, 0.72);
      camX = clamp(cam.smoothX, desired / 2, WORLD.w - desired / 2);
      offX = w / 2 - camX * scale;
      offY = h * 0.625 - WORLD.ground * scale;
    } else {
      scale = Math.max(w / WORLD.w, h / WORLD.h);
      camX = 800;
      offX = w / 2 - 800 * scale;
      offY = h / 2 - 450 * scale;
    }
    this.view = {
      w, h, scale, offX, offY, camX, mobile,
      groundY: offY + WORLD.ground * scale,
      horizon: offY + 548 * scale,
      visibleW: w / scale,
      visibleH: h / scale,
    };
    return this.view;
  }

  render(scene, dt) {
    const ctx = this.ctx;
    const v = this.computeView(dt);
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const arena = ARENAS[scene.arena] || ARENAS[0];
    this.drawArenaCached(ctx, arena, scene.time, v);
    this.drawArenaParticles(ctx, arena, scene.time, v);

    const shake = scene.shake || 0;
    const sx = shake ? Math.sin(scene.time * 71) * shake : 0;
    const sy = shake ? Math.cos(scene.time * 83) * shake * 0.6 : 0;

    ctx.save();
    ctx.translate(v.offX + sx, v.offY + sy);
    ctx.scale(v.scale, v.scale);

    const fighters = scene.fighters || [];
    // accent glow under each fighter
    for (const f of fighters) {
      if (!f) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(f.x, WORLD.ground - 2, 3, f.x, WORLD.ground - 2, 100);
      g.addColorStop(0, f.def.accent + '22');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(f.x, WORLD.ground, 110, 20, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawShadow(ctx, f, scene.time);
    }

    // ground dust / low particles behind fighters
    this.drawParticles(ctx, (scene.particles || []).filter((p) => p.layer === 'back'), scene.time);

    const order = fighters.filter(Boolean).slice().sort((a, b) => {
      const aa = a.state === 'attack' ? 1 : 0;
      const bb = b.state === 'attack' ? 1 : 0;
      if (aa !== bb) return aa - bb;
      return a.x - b.x;
    });
    for (const f of order) drawFighter(ctx, f, scene.time, { koTime: f.state === 'ko' ? f.koTime : 0 });

    this.drawProjectiles(ctx, scene.projectiles || [], scene.time);
    this.drawParticles(ctx, (scene.particles || []).filter((p) => p.layer !== 'back'), scene.time);
    this.drawEffects(ctx, scene.effects || [], scene.time);

    ctx.restore();

    // foreground atmosphere
    this.drawForeground(ctx, arena, scene.time, v, scene);
    if (scene.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.6, scene.flash);
      ctx.fillStyle = '#dff8ff';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  drawArena(ctx, arena, t, v) {
    const { w, h } = v;
    const gY = v.groundY;
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(v.horizon, gY));
    sky.addColorStop(0, arena.sky[0]);
    sky.addColorStop(0.45, arena.sky[1]);
    sky.addColorStop(0.8, arena.sky[2]);
    sky.addColorStop(1, arena.sky[3]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    if (arena.key === 'neon') this.drawNeon(ctx, t, v);
    else if (arena.key === 'frost') this.drawFrost(ctx, t, v);
    else this.drawFoundry(ctx, t, v);

    // global haze at the horizon
    const fog = ctx.createLinearGradient(0, v.horizon - 160 * v.scale, 0, gY + 40);
    fog.addColorStop(0, 'rgba(0,0,0,0)');
    fog.addColorStop(0.65, arena.fog);
    fog.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, v.horizon - 180 * v.scale, w, gY - v.horizon + 220 * v.scale);
  }

  drawArenaCached(ctx, arena, t, v) {
    const camKey = v.mobile ? Math.round(v.camX / 90) : 'fixed';
    const key = `${arena.key}|${v.w}|${v.h}|${this.dpr}|${camKey}`;
    if (key !== this.arenaKey) {
      const layer = this.arenaLayer;
      const lctx = this.arenaLayerCtx;
      const pw = Math.max(1, Math.round(v.w * this.dpr));
      const ph = Math.max(1, Math.round(v.h * this.dpr));
      if (layer.width !== pw || layer.height !== ph) {
        layer.width = pw;
        layer.height = ph;
      }
      lctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      lctx.globalAlpha = 1;
      lctx.globalCompositeOperation = 'source-over';
      this.drawArena(lctx, arena, t, v);
      this.arenaKey = key;
    }
    ctx.drawImage(this.arenaLayer, 0, 0, v.w, v.h);
  }

  drawNeon(ctx, t, v) {
    const { w, h } = v;
    const gY = v.groundY;
    const s = v.scale;
    const horizon = v.horizon;

    // stars
    for (const st of stars) {
      const tw = 0.35 + Math.sin(t * 1.4 + st.p) * 0.3;
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#c8e9ff';
      ctx.fillRect(st.x * w, st.y * horizon, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // moon
    const mx = w * 0.76 - (v.camX - 800) * s * 0.04;
    const my = horizon * 0.34;
    const mr = 64 * s;
    const mg = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 3.4);
    mg.addColorStop(0, 'rgba(190, 230, 255, 0.32)');
    mg.addColorStop(0.22, 'rgba(130, 190, 255, 0.13)');
    mg.addColorStop(1, 'rgba(40, 100, 220, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3.4, 0, TAU);
    ctx.fill();
    const moonG = ctx.createLinearGradient(mx, my - mr, mx, my + mr);
    moonG.addColorStop(0, '#eaf7ff');
    moonG.addColorStop(0.55, '#b8d9ea');
    moonG.addColorStop(1, '#7c9fbf');
    ctx.fillStyle = moonG;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(50, 80, 120, 0.18)';
    ctx.beginPath();
    ctx.arc(mx - mr * 0.3, my - mr * 0.15, mr * 0.25, 0, TAU);
    ctx.arc(mx + mr * 0.35, my + mr * 0.2, mr * 0.16, 0, TAU);
    ctx.fill();

    // glow behind skyline
    const bg = ctx.createRadialGradient(w * 0.64, horizon, 10, w * 0.64, horizon, w * 0.7);
    bg.addColorStop(0, 'rgba(255, 38, 130, 0.20)');
    bg.addColorStop(0.35, 'rgba(93, 45, 180, 0.14)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const bx = (x) => v.offX + x * s;

    // far skyline
    for (const b of buildingsFar) {
      const x = bx(b.x);
      const bw = b.w * s;
      const bh = b.h * s;
      if (x + bw < -20 || x > w + 20) continue;
      ctx.fillStyle = b.s > 0.55 ? '#0a1129' : '#0c1430';
      ctx.fillRect(x, horizon - bh, bw, bh + 4 * s);
      ctx.fillStyle = 'rgba(96, 165, 230, 0.20)';
      for (let wy = horizon - bh + 10 * s; wy < horizon - 8 * s; wy += 13 * s) {
        for (let wx = x + 5 * s; wx < x + bw - 5 * s; wx += 11 * s) {
          if (((wx + wy) | 0) % 29 < 16) ctx.fillRect(wx, wy, 3 * s, 4 * s);
        }
      }
    }

    // mid skyline
    for (let i = 0; i < buildingsMid.length; i++) {
      const b = buildingsMid[i];
      const x = bx(b.x);
      const bw = b.w * s;
      const bh = b.h * s;
      if (x + bw < -40 || x > w + 40) continue;
      const grad = ctx.createLinearGradient(x, horizon - bh, x, horizon);
      grad.addColorStop(0, '#111b3f');
      grad.addColorStop(1, '#080d20');
      ctx.fillStyle = grad;
      ctx.fillRect(x, horizon - bh, bw, bh + 3 * s);

      // roof antenna
      if (b.s > 0.66) {
        ctx.strokeStyle = 'rgba(100, 180, 240, 0.3)';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(x + bw * 0.5, horizon - bh);
        ctx.lineTo(x + bw * 0.5, horizon - bh - 28 * s);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 50, 120, 0.9)';
        ctx.beginPath();
        ctx.arc(x + bw * 0.5, horizon - bh - 29 * s, 2.2 * s, 0, TAU);
        ctx.fill();
      }

      // windows
      ctx.fillStyle = 'rgba(255, 186, 92, 0.38)';
      for (let wy = horizon - bh + 16 * s; wy < horizon - 12 * s; wy += 17 * s) {
        for (let wx = x + 7 * s; wx < x + bw - 8 * s; wx += 14 * s) {
          const n = Math.sin(wx * 12.3 + wy * 2.1 + i) * 1000;
          if (n - Math.floor(n) > 0.54) ctx.fillRect(wx, wy, 4.5 * s, 6 * s);
        }
      }
      // neon building edge
      if (i % 3 === 0) {
        ctx.strokeStyle = i % 6 === 0 ? 'rgba(80, 230, 255, 0.5)' : 'rgba(255, 61, 158, 0.45)';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x + bw, horizon - bh + 10 * s);
        ctx.lineTo(x + bw, horizon);
        ctx.stroke();
      }
    }

    // hanging neon signs / billboards
    const signGlow = 0.7 + Math.sin(t * 6.5) * 0.08;
    ctx.save();
    ctx.shadowColor = '#54e6ff';
    ctx.shadowBlur = 24 * s;
    ctx.fillStyle = `rgba(54, 230, 255, ${0.22 * signGlow})`;
    const signX = w * 0.13 - (v.camX - 800) * s * 0.1;
    const signY = horizon * 0.55;
    ctx.fillRect(signX, signY, 38 * s, 120 * s);
    ctx.fillStyle = '#d4fdff';
    ctx.font = `700 ${19 * s}px "Rajdhani", sans-serif`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(signX + 19 * s, signY + 50 * s);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('BLADE', -32 * s, 6 * s);
    ctx.restore();
    ctx.restore();

    // magenta sign
    ctx.save();
    ctx.shadowColor = '#ff3d9e';
    ctx.shadowBlur = 20 * s;
    ctx.fillStyle = `rgba(255, 61, 158, ${0.26 * (0.75 + Math.sin(t * 3.1 + 2) * 0.1)})`;
    const s2x = w * 0.88 - (v.camX - 800) * s * 0.12;
    ctx.fillRect(s2x, horizon * 0.48, 26 * s, 88 * s);
    ctx.fillStyle = '#ffe0f1';
    ctx.font = `700 ${15 * s}px "Rajdhani", sans-serif`;
    ctx.fillText('09', s2x + 13 * s, horizon * 0.48 + 46 * s);
    ctx.restore();

    // rooftop floor
    const floor = ctx.createLinearGradient(0, gY, 0, h);
    floor.addColorStop(0, '#0c1126');
    floor.addColorStop(0.35, '#080b1a');
    floor.addColorStop(1, '#03040b');
    ctx.fillStyle = floor;
    ctx.fillRect(0, gY - 2 * s, w, h - gY + 2 * s);

    // glowing edge
    ctx.save();
    ctx.shadowColor = '#50e6ff';
    ctx.shadowBlur = 18 * s;
    ctx.strokeStyle = 'rgba(96, 234, 255, 0.9)';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, gY);
    ctx.lineTo(w, gY);
    ctx.stroke();
    ctx.restore();

    // floor perspective grid
    ctx.strokeStyle = 'rgba(70, 155, 220, 0.12)';
    ctx.lineWidth = 1;
    const vanish = w / 2 - (v.camX - 800) * s * 0.18;
    for (let i = 0; i < 12; i++) {
      const k = i / 12;
      const y = gY + Math.pow(k, 1.7) * (h - gY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = -9; i <= 9; i++) {
      ctx.beginPath();
      ctx.moveTo(vanish + i * 90 * s, gY);
      ctx.lineTo(vanish + i * 330 * s, h);
      ctx.stroke();
    }

    // magenta reflection streaks
    for (let i = 0; i < 5; i++) {
      const x = ((i * 0.23 + 0.08) * w + Math.sin(t * 0.2 + i) * 20 * s) - (v.camX - 800) * s * 0.25;
      const g = ctx.createLinearGradient(x, gY, x, h);
      g.addColorStop(0, 'rgba(255, 61, 158, 0.13)');
      g.addColorStop(0.6, 'rgba(255, 61, 158, 0.02)');
      g.addColorStop(1, 'rgba(255, 61, 158, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, gY, 34 * s, h - gY);
    }

    // distant rooftop clutter
    this.rooftopUnits(ctx, v, t);
  }

  rooftopUnits(ctx, v, t) {
    const s = v.scale, gY = v.groundY;
    const units = [
      { x: 0.06, w: 90, h: 45, glow: '#38cfe8' },
      { x: 0.91, w: 120, h: 58, glow: '#ff3d9e' },
    ];
    for (const u of units) {
      const x = u.x * v.w - (v.camX - 800) * s * 0.3;
      const w = u.w * s, h = u.h * s;
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(x, gY - h, w, h);
      ctx.strokeStyle = 'rgba(90, 180, 230, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, gY - h, w, h);
      ctx.fillStyle = 'rgba(80, 200, 235, 0.35)';
      ctx.fillRect(x + 6 * s, gY - h + 7 * s, w - 12 * s, 2 * s);
      ctx.fillStyle = u.glow;
      ctx.globalAlpha = 0.45 + Math.sin(t * 4 + x) * 0.15;
      ctx.fillRect(x + w * 0.7, gY - h + 12 * s, 3 * s, 3 * s);
      ctx.globalAlpha = 1;
    }
  }

  drawFrost(ctx, t, v) {
    const { w, h } = v;
    const gY = v.groundY;
    const s = v.scale;
    const horizon = v.horizon;

    for (const st of stars) {
      const tw = 0.3 + Math.sin(t * 1.1 + st.p) * 0.25;
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#d6f6ff';
      ctx.fillRect(st.x * w, st.y * horizon, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // aurora ribbons
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const yy = horizon * (0.2 + i * 0.09);
      const g = ctx.createLinearGradient(0, yy, w, yy + 80 * s);
      g.addColorStop(0, 'rgba(70, 255, 210, 0)');
      g.addColorStop(0.35, `rgba(${70 + i * 40}, 255, 210, ${0.08 + i * 0.025})`);
      g.addColorStop(0.6, `rgba(90, 150, 255, ${0.06 + i * 0.02})`);
      g.addColorStop(1, 'rgba(40, 80, 200, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-40, yy);
      for (let x = -40; x <= w + 40; x += 60) {
        const y = yy + Math.sin(x * 0.006 + t * 0.4 + i * 1.8) * 22 * s + Math.sin(x * 0.013 + i) * 10 * s;
        ctx.lineTo(x, y);
      }
      for (let x = w + 40; x >= -40; x -= 60) {
        const y = yy + 70 * s + Math.sin(x * 0.005 + t * 0.3 + i * 1.2) * 26 * s;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // moon
    const mx = w * 0.73;
    const my = horizon * 0.27;
    const mr = 72 * s;
    const mg = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 3);
    mg.addColorStop(0, 'rgba(190, 245, 255, 0.30)');
    mg.addColorStop(0.3, 'rgba(130, 210, 255, 0.1)');
    mg.addColorStop(1, 'rgba(70, 130, 220, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3, 0, TAU);
    ctx.fill();
    const moonG = ctx.createLinearGradient(mx, my - mr, mx, my + mr);
    moonG.addColorStop(0, '#ffffff');
    moonG.addColorStop(0.6, '#d9f4ff');
    moonG.addColorStop(1, '#9cc8e0');
    ctx.fillStyle = moonG;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 160, 190, 0.14)';
    ctx.beginPath();
    ctx.arc(mx - mr * 0.28, my + mr * 0.12, mr * 0.3, 0, TAU);
    ctx.arc(mx + mr * 0.35, my - mr * 0.3, mr * 0.17, 0, TAU);
    ctx.fill();

    // mountain layers
    const mountains = [
      { base: horizon + 12 * s, h: 260, c1: '#091a2d', c2: '#0b2138', snow: 'rgba(160, 220, 245, 0.22)' },
      { base: horizon + 34 * s, h: 190, c1: '#0b2234', c2: '#102c42', snow: 'rgba(180, 235, 255, 0.3)' },
    ];
    for (let m = 0; m < mountains.length; m++) {
      const mt = mountains[m];
      const off = (v.camX - 800) * s * (0.15 + m * 0.1);
      ctx.beginPath();
      ctx.moveTo(-100, mt.base);
      const step = 140 * s;
      for (let x = -100; x <= w + 120; x += step) {
        const peak = mt.base - (mt.h * (0.55 + 0.45 * Math.sin((x + off) * 0.005 + m * 2.7))) * s;
        ctx.lineTo(x + step * 0.45, peak);
        ctx.lineTo(x + step, mt.base - 30 * s);
      }
      ctx.lineTo(w + 120, mt.base);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, mt.base - mt.h * s, 0, mt.base);
      g.addColorStop(0, mt.c1);
      g.addColorStop(1, mt.c2);
      ctx.fillStyle = g;
      ctx.fill();
      // snow caps
      ctx.strokeStyle = mt.snow;
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      for (let x = -100; x <= w + 120; x += step) {
        const peak = mt.base - (mt.h * (0.55 + 0.45 * Math.sin((x + off) * 0.005 + m * 2.7))) * s;
        ctx.moveTo(x + step * 0.45, peak);
        ctx.lineTo(x + step * 0.32, peak + 28 * s);
        ctx.moveTo(x + step * 0.45, peak);
        ctx.lineTo(x + step * 0.58, peak + 24 * s);
      }
      ctx.stroke();
    }

    // pine forest
    const px = (x) => v.offX + x * s;
    for (let i = 0; i < 34; i++) {
      const x = px(-100 + i * 86 + Math.sin(i * 9.3) * 30);
      if (x < -80 || x > w + 80) continue;
      const ph = (90 + ((i * 37) % 110)) * s;
      const base = horizon + 20 * s;
      ctx.fillStyle = i % 3 === 0 ? '#071728' : '#0a1e32';
      ctx.beginPath();
      ctx.moveTo(x, base - ph);
      ctx.lineTo(x + 30 * s, base);
      ctx.lineTo(x - 30 * s, base);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, base - ph * 0.68);
      ctx.lineTo(x + 38 * s, base + 2 * s);
      ctx.lineTo(x - 38 * s, base + 2 * s);
      ctx.closePath();
      ctx.fill();
      // snow on pine
      ctx.strokeStyle = 'rgba(200, 240, 255, 0.35)';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(x - 18 * s, base - ph * 0.22);
      ctx.lineTo(x, base - ph * 0.42);
      ctx.lineTo(x + 18 * s, base - ph * 0.22);
      ctx.stroke();
    }

    // torii gate
    this.drawTorii(ctx, v, t, w * 0.28, horizon + 26 * s, 1.15 * s);
    this.drawTorii(ctx, v, t, w * 0.82, horizon + 30 * s, 0.72 * s);

    // snow floor
    const floor = ctx.createLinearGradient(0, gY - 4 * s, 0, h);
    floor.addColorStop(0, '#b9dce8');
    floor.addColorStop(0.12, '#82aec5');
    floor.addColorStop(0.4, '#314f6b');
    floor.addColorStop(1, '#091a2d');
    ctx.fillStyle = floor;
    ctx.fillRect(0, gY - 2 * s, w, h - gY + 2 * s);

    // snow drift edge
    ctx.beginPath();
    ctx.moveTo(0, gY + 2 * s);
    for (let x = 0; x <= w; x += 40) {
      ctx.lineTo(x, gY + 2 * s + Math.sin(x * 0.03 + t * 0.2) * 2 * s);
    }
    ctx.lineTo(w, gY + 18 * s);
    ctx.lineTo(0, gY + 18 * s);
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 248, 255, 0.78)';
    ctx.fill();

    // stone tiles
    ctx.strokeStyle = 'rgba(180, 225, 245, 0.16)';
    ctx.lineWidth = 1.2;
    const vanish = w / 2 - (v.camX - 800) * s * 0.18;
    for (let i = 0; i < 9; i++) {
      const k = i / 9;
      const y = gY + 18 * s + Math.pow(k, 1.6) * (h - gY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vanish + i * 90 * s, gY + 18 * s);
      ctx.lineTo(vanish + i * 320 * s, h);
      ctx.stroke();
    }

    // ice sheen
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = (0.15 + i * 0.24) * w + Math.sin(t * 0.3 + i) * 20;
      const g = ctx.createLinearGradient(x, gY, x, h);
      g.addColorStop(0, 'rgba(130, 230, 255, 0.14)');
      g.addColorStop(1, 'rgba(130, 230, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, gY, 22 * s, h - gY);
    }
    ctx.restore();
  }

  drawTorii(ctx, v, t, x, baseY, scale) {
    const c1 = '#2a0d14', c2 = '#54121c';
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(scale, scale);
    const g = ctx.createLinearGradient(0, -260, 0, 0);
    g.addColorStop(0, c2);
    g.addColorStop(1, c1);
    // pillars
    ctx.fillStyle = g;
    ctx.fillRect(-72, -220, 16, 220);
    ctx.fillRect(56, -220, 16, 220);
    // beams
    ctx.fillRect(-96, -232, 192, 13);
    ctx.fillRect(-82, -202, 164, 10);
    ctx.fillRect(-64, -180, 128, 7);
    // roof cap
    ctx.beginPath();
    ctx.moveTo(-120, -238);
    ctx.quadraticCurveTo(-20, -258, 0, -252);
    ctx.quadraticCurveTo(20, -258, 120, -238);
    ctx.lineTo(100, -248);
    ctx.quadraticCurveTo(0, -264, -100, -248);
    ctx.closePath();
    ctx.fillStyle = '#16070c';
    ctx.fill();
    // highlight
    ctx.strokeStyle = 'rgba(255, 120, 90, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-72, -220, 16, 220);
    ctx.strokeRect(56, -220, 16, 220);
    // lanterns
    for (const lx of [-92, 92]) {
      const glow = 0.5 + Math.sin(t * 2.2 + lx) * 0.15;
      ctx.save();
      ctx.shadowColor = '#ffb45c';
      ctx.shadowBlur = 18;
      ctx.fillStyle = `rgba(255, 180, 92, ${glow})`;
      ctx.beginPath();
      ctx.ellipse(lx, -180, 7, 10, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawFoundry(ctx, t, v) {
    const { w, h } = v;
    const gY = v.groundY;
    const s = v.scale;
    const horizon = v.horizon;
    const cam = (v.camX - 800) * s;

    // ---- furnace bloom wash
    const bloom = ctx.createRadialGradient(w * 0.28, horizon - 30 * s, 12 * s, w * 0.28, horizon - 30 * s, w * 0.62);
    bloom.addColorStop(0, 'rgba(255, 148, 52, 0.4)');
    bloom.addColorStop(0.34, 'rgba(208, 62, 18, 0.17)');
    bloom.addColorStop(0.72, 'rgba(92, 18, 10, 0.06)');
    bloom.addColorStop(1, 'rgba(30, 4, 4, 0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);

    // smoke-choked sun
    const sunX = w * 0.73;
    const sunY = horizon * 0.3;
    const sunR = 56 * s;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 4.4);
    sunGlow.addColorStop(0, 'rgba(255, 138, 58, 0.22)');
    sunGlow.addColorStop(0.35, 'rgba(210, 70, 24, 0.1)');
    sunGlow.addColorStop(1, 'rgba(120, 24, 10, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(sunX - sunR * 4.4, sunY - sunR * 4.4, sunR * 8.8, sunR * 8.8);
    const sunG = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunG.addColorStop(0, 'rgba(196, 74, 28, 0.9)');
    sunG.addColorStop(0.6, 'rgba(142, 42, 16, 0.75)');
    sunG.addColorStop(1, 'rgba(74, 16, 8, 0.5)');
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, TAU);
    ctx.fill();
    // smoke bands across the sun
    for (let i = 0; i < 4; i++) {
      const y = sunY - sunR * 0.55 + i * sunR * 0.4 + Math.sin(t * 0.1 + i) * 2 * s;
      ctx.fillStyle = `rgba(46, 12, 10, ${0.18 + (i % 2) * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(sunX + Math.sin(t * 0.08 + i) * 10 * s, y, sunR * (1.08 - i * 0.07), sunR * 0.07, 0, 0, TAU);
      ctx.fill();
    }

    // drifting smoke haze across the upper air
    for (let i = 0; i < 5; i++) {
      const x = w * (0.12 + i * 0.19) + Math.sin(t * 0.05 + i * 1.4) * 40 * s;
      const y = 30 * s + i * 44 * s;
      ctx.fillStyle = `rgba(96, 34, 22, ${0.05 + (i % 2) * 0.025})`;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.2, (26 + i * 4) * s, 0, 0, TAU);
      ctx.fill();
    }

    // ---- distant stacks above the wall
    const farStacks = [
      { x: 0.05, w: 46, h: 420 },
      { x: 0.15, w: 24, h: 320 },
      { x: 0.66, w: 22, h: 300 },
      { x: 0.8, w: 30, h: 360 },
      { x: 0.94, w: 58, h: 450 },
    ];
    for (let i = 0; i < farStacks.length; i++) {
      const st = farStacks[i];
      const x = st.x * w - cam * 0.035;
      const sw = st.w * s;
      const sh = st.h * s;
      const base = horizon + 14 * s;
      const g = ctx.createLinearGradient(x, base - sh, x, base);
      g.addColorStop(0, '#2a0b0a');
      g.addColorStop(0.7, '#1c0708');
      g.addColorStop(1, '#120405');
      ctx.fillStyle = g;
      ctx.fillRect(x, base - sh, sw, sh);
      ctx.fillStyle = 'rgba(255, 132, 62, 0.14)';
      ctx.fillRect(x + sw - 2.5 * s, base - sh, 2.5 * s, sh);
      ctx.fillStyle = 'rgba(255, 150, 70, 0.14)';
      for (let k = 1; k < 7; k++) ctx.fillRect(x, base - sh + (k / 7) * sh, sw, 1.6 * s);
      // beacon
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(t * 2.6 + i * 1.7) * 0.3;
      ctx.shadowColor = '#ff3a12';
      ctx.shadowBlur = 14 * s;
      ctx.fillStyle = '#ff6a2a';
      ctx.beginPath();
      ctx.arc(x + sw * 0.5, base - sh - 5 * s, 2.6 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // ---- riveted back wall
    const wallTop = horizon - 300 * s;
    const wall = ctx.createLinearGradient(0, wallTop, 0, gY);
    wall.addColorStop(0, '#220a0a');
    wall.addColorStop(0.45, '#2d0e0c');
    wall.addColorStop(1, '#1a0707');
    ctx.fillStyle = wall;
    ctx.fillRect(0, wallTop, w, gY - wallTop + 2 * s);

    const panel = 150 * s;
    const shift = ((cam * 0.06) % panel + panel) % panel;
    for (let x = -panel; x < w + panel; x += panel) {
      const xx = x - shift;
      ctx.fillStyle = 'rgba(8, 2, 3, 0.55)';
      ctx.fillRect(xx, wallTop, 10 * s, gY - wallTop + 2 * s);
      ctx.fillStyle = 'rgba(255, 120, 58, 0.07)';
      ctx.fillRect(xx + 10 * s, wallTop, 2 * s, gY - wallTop + 2 * s);
      ctx.fillStyle = 'rgba(255, 120, 58, 0.09)';
      for (let y = wallTop + 30 * s; y < gY - 8 * s; y += 44 * s) {
        ctx.beginPath();
        ctx.arc(xx + 19 * s, y, 1.7 * s, 0, TAU);
        ctx.fill();
      }
    }
    for (const by of [wallTop + 6 * s, wallTop + 148 * s, gY - 56 * s]) {
      ctx.fillStyle = 'rgba(12, 3, 4, 0.62)';
      ctx.fillRect(0, by, w, 9 * s);
      ctx.fillStyle = 'rgba(255, 118, 54, 0.07)';
      ctx.fillRect(0, by, w, 1.5 * s);
    }

    // support columns
    for (const cxr of [0.14, 0.56, 0.88]) {
      const cx = w * cxr - cam * 0.06;
      ctx.fillStyle = 'rgba(14, 4, 5, 0.85)';
      ctx.fillRect(cx - 11 * s, wallTop, 22 * s, gY - wallTop);
      ctx.fillStyle = 'rgba(255, 120, 58, 0.06)';
      ctx.fillRect(cx + 8 * s, wallTop, 2 * s, gY - wallTop);
      ctx.fillStyle = 'rgba(255, 130, 60, 0.1)';
      for (let y = wallTop + 36 * s; y < gY - 20 * s; y += 58 * s) {
        ctx.beginPath();
        ctx.arc(cx, y, 2 * s, 0, TAU);
        ctx.fill();
      }
    }

    // recessed brick bays
    for (let i = 0; i < 3; i++) {
      const bx = w * (0.45 + i * 0.13) - cam * 0.08;
      const bw = 72 * s;
      const by = horizon - 170 * s;
      ctx.fillStyle = '#140506';
      ctx.beginPath();
      ctx.moveTo(bx, gY - 62 * s);
      ctx.lineTo(bx, by + bw * 0.5);
      ctx.arc(bx + bw * 0.5, by + bw * 0.5, bw * 0.5, Math.PI, TAU);
      ctx.lineTo(bx + bw, gY - 62 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 120, 56, 0.06)';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();
      for (let k = 1; k < 7; k++) {
        ctx.strokeStyle = 'rgba(255, 120, 56, 0.035)';
        ctx.beginPath();
        ctx.moveTo(bx + 6 * s, gY - 62 * s - k * 34 * s);
        ctx.lineTo(bx + bw - 6 * s, gY - 62 * s - k * 34 * s);
        ctx.stroke();
      }
    }

    // warm wash from the furnace across the wall
    const wash = ctx.createRadialGradient(w * 0.27, gY - 90 * s, 24 * s, w * 0.27, gY - 90 * s, w * 0.56);
    wash.addColorStop(0, 'rgba(255, 128, 44, 0.17)');
    wash.addColorStop(0.45, 'rgba(230, 80, 24, 0.07)');
    wash.addColorStop(1, 'rgba(160, 34, 12, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, wallTop, w, gY - wallTop);
    // soot darkening at the top of the wall
    const soot = ctx.createLinearGradient(0, wallTop, 0, wallTop + 150 * s);
    soot.addColorStop(0, 'rgba(4, 1, 2, 0.45)');
    soot.addColorStop(1, 'rgba(4, 1, 2, 0)');
    ctx.fillStyle = soot;
    ctx.fillRect(0, wallTop, w, 150 * s);

    // ---- hanging work lamps
    for (let i = 0; i < 2; i++) {
      const lx = w * (i ? 0.935 : 0.065) - cam * 0.05;
      const ly = horizon - 244 * s;
      ctx.strokeStyle = 'rgba(18, 5, 6, 0.9)';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      // light cone
      const cone = ctx.createLinearGradient(0, ly + 10 * s, 0, ly + 220 * s);
      cone.addColorStop(0, 'rgba(255, 182, 96, 0.1)');
      cone.addColorStop(1, 'rgba(255, 140, 60, 0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lx - 8 * s, ly + 10 * s);
      ctx.lineTo(lx + 8 * s, ly + 10 * s);
      ctx.lineTo(lx + 82 * s, ly + 220 * s);
      ctx.lineTo(lx - 82 * s, ly + 220 * s);
      ctx.closePath();
      ctx.fill();
      // housing
      ctx.fillStyle = '#1a0708';
      ctx.beginPath();
      ctx.moveTo(lx - 16 * s, ly);
      ctx.lineTo(lx + 16 * s, ly);
      ctx.lineTo(lx + 10 * s, ly + 12 * s);
      ctx.lineTo(lx - 10 * s, ly + 12 * s);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.shadowColor = '#ffbe6c';
      ctx.shadowBlur = 26 * s;
      ctx.fillStyle = 'rgba(255, 226, 160, 0.95)';
      ctx.beginPath();
      ctx.arc(lx, ly + 13 * s, 3.2 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // ---- overhead ductwork
    const ductY = horizon - 268 * s;
    ctx.strokeStyle = 'rgba(13, 4, 5, 0.95)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 20 * s;
    ctx.beginPath();
    ctx.moveTo(-30, ductY);
    ctx.lineTo(w * 0.16, ductY);
    ctx.lineTo(w * 0.16, ductY + 74 * s);
    ctx.moveTo(w * 0.8, ductY);
    ctx.lineTo(w + 30, ductY);
    ctx.moveTo(w * 0.8, ductY);
    ctx.lineTo(w * 0.8, ductY + 62 * s);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 124, 56, 0.09)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-30, ductY - 7 * s);
    ctx.lineTo(w * 0.16, ductY - 7 * s);
    ctx.moveTo(w * 0.8, ductY - 7 * s);
    ctx.lineTo(w + 30, ductY - 7 * s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(40, 12, 12, 0.9)';
    for (const dx of [w * 0.3, w * 0.52, w * 0.68]) {
      ctx.fillRect(dx, ductY - 12 * s, 8 * s, 24 * s);
    }

    // ---- catwalk bridge (above the fighters)
    const cwy = horizon - 232 * s;
    ctx.fillStyle = 'rgba(10, 3, 4, 0.88)';
    ctx.fillRect(-4, cwy, w + 8, 7 * s);
    ctx.fillStyle = 'rgba(255, 130, 60, 0.11)';
    ctx.fillRect(-4, cwy, w + 8, 1.3 * s);
    ctx.strokeStyle = 'rgba(14, 4, 5, 0.78)';
    ctx.lineWidth = 2.4 * s;
    for (let x = 14 * s; x < w + 40 * s; x += 62 * s) {
      ctx.beginPath();
      ctx.moveTo(x, cwy);
      ctx.lineTo(x, cwy - 27 * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-4, cwy - 27 * s);
    ctx.lineTo(w + 4, cwy - 27 * s);
    ctx.stroke();
    ctx.lineWidth = 1.1 * s;
    for (let x = 14 * s; x < w + 40 * s; x += 186 * s) {
      ctx.beginPath();
      ctx.moveTo(x, cwy);
      ctx.lineTo(x + 62 * s, cwy - 27 * s);
      ctx.stroke();
    }
    // short chains hanging beneath the catwalk
    for (let i = 0; i < 3; i++) {
      const hx = w * (0.2 + i * 0.3) - cam * 0.1;
      ctx.strokeStyle = 'rgba(16, 5, 6, 0.8)';
      ctx.lineWidth = 1.5 * s;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(hx, cwy + (7 + k * 9) * s, 2.2 * s, 3.8 * s, 0, 0, TAU);
        ctx.stroke();
      }
    }

    // ---- main furnace
    const fx = w * 0.225 - cam * 0.12;
    const fy = gY - 64 * s;
    const fr = 78 * s;
    const halo = ctx.createRadialGradient(fx, fy, 8 * s, fx, fy, 230 * s);
    halo.addColorStop(0, 'rgba(255, 176, 78, 0.5)');
    halo.addColorStop(0.28, 'rgba(255, 104, 28, 0.24)');
    halo.addColorStop(0.6, 'rgba(180, 40, 14, 0.08)');
    halo.addColorStop(1, 'rgba(80, 10, 10, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(fx - 240 * s, fy - 240 * s, 480 * s, 480 * s);

    // furnace housing
    ctx.fillStyle = '#170506';
    ctx.beginPath();
    ctx.arc(fx, fy, fr + 34 * s, Math.PI, TAU);
    ctx.lineTo(fx + fr + 34 * s, gY + 2 * s);
    ctx.lineTo(fx - fr - 34 * s, gY + 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#341010';
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.arc(fx, fy, fr + 22 * s, Math.PI, TAU);
    ctx.stroke();

    // furnace interior
    const glow = ctx.createRadialGradient(fx, fy, 4 * s, fx, fy, fr);
    glow.addColorStop(0, 'rgba(255, 248, 206, 1)');
    glow.addColorStop(0.22, 'rgba(255, 206, 96, 0.98)');
    glow.addColorStop(0.55, 'rgba(255, 120, 30, 0.85)');
    glow.addColorStop(1, 'rgba(150, 30, 8, 0.15)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, Math.PI, TAU);
    ctx.lineTo(fx + fr, fy + 50 * s);
    ctx.lineTo(fx - fr, fy + 50 * s);
    ctx.closePath();
    ctx.fill();

    // grate bars
    ctx.fillStyle = 'rgba(16, 4, 5, 0.88)';
    for (let i = -2; i <= 2; i++) {
      const gx = fx + i * 24 * s;
      ctx.fillRect(gx - 3.5 * s, fy - 10 * s, 7 * s, 56 * s);
    }
    ctx.fillRect(fx - fr * 0.92, fy + 24 * s, fr * 1.84, 6 * s);

    // rivets around the arch
    ctx.fillStyle = 'rgba(255, 138, 66, 0.2)';
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * (fr + 23 * s), fy + Math.sin(a) * (fr + 23 * s), 2.2 * s, 0, TAU);
      ctx.fill();
    }

    // ---- boiler tank
    const bx = w * 0.77 - cam * 0.1;
    const bw = 150 * s;
    const bh = 296 * s;
    const by = gY + 4 * s;
    const tank = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    tank.addColorStop(0, '#140405');
    tank.addColorStop(0.32, '#3a1211');
    tank.addColorStop(0.55, '#2a0c0c');
    tank.addColorStop(1, '#0f0304');
    ctx.fillStyle = tank;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by - bh + bw * 0.32);
    ctx.quadraticCurveTo(bx + bw * 0.5, by - bh - bw * 0.18, bx + bw, by - bh + bw * 0.32);
    ctx.lineTo(bx + bw, by);
    ctx.closePath();
    ctx.fill();
    for (let k = 1; k <= 4; k++) {
      const yy = by - (k / 5) * bh;
      ctx.fillStyle = 'rgba(10, 2, 3, 0.65)';
      ctx.fillRect(bx, yy, bw, 5 * s);
      ctx.fillStyle = 'rgba(255, 128, 62, 0.1)';
      ctx.fillRect(bx, yy, bw, 1.2 * s);
    }
    // glowing pressure seam
    ctx.save();
    ctx.shadowColor = '#ff6a22';
    ctx.shadowBlur = 16 * s;
    ctx.strokeStyle = 'rgba(255, 118, 42, 0.55)';
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.5, by - 4 * s);
    ctx.lineTo(bx + bw * 0.5, by - bh + bw * 0.3);
    ctx.stroke();
    ctx.restore();
    // pressure gauge
    const gy2 = by - bh * 0.62;
    ctx.fillStyle = '#0c0303';
    ctx.beginPath();
    ctx.arc(bx + bw * 0.72, gy2, 15 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 176, 90, 0.5)';
    ctx.lineWidth = 1.6 * s;
    ctx.stroke();
    const needle = -0.6 + Math.sin(t * 1.5) * 0.25;
    ctx.strokeStyle = '#ffb45c';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.72, gy2);
    ctx.lineTo(bx + bw * 0.72 + Math.cos(needle) * 10 * s, gy2 + Math.sin(needle) * 10 * s);
    ctx.stroke();

    // ---- wall pipe bundle
    const pbx = w * 0.44 - cam * 0.1;
    for (let i = 0; i < 3; i++) {
      const px = pbx + i * 15 * s;
      ctx.strokeStyle = 'rgba(18, 6, 7, 0.9)';
      ctx.lineWidth = 8 * s;
      ctx.beginPath();
      ctx.moveTo(px, wallTop + 30 * s);
      ctx.lineTo(px, gY - 46 * s);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 120, 54, 0.08)';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(px - 2.5 * s, wallTop + 30 * s);
      ctx.lineTo(px - 2.5 * s, gY - 46 * s);
      ctx.stroke();
    }
    for (let yy = wallTop + 80 * s; yy < gY - 30 * s; yy += 96 * s) {
      ctx.fillStyle = 'rgba(34, 12, 12, 0.9)';
      ctx.fillRect(pbx - 5 * s, yy, 48 * s, 6 * s);
    }

    // ---- maintenance ladder
    const lx = w * 0.92 - cam * 0.1;
    const lTop = wallTop + 36 * s;
    ctx.strokeStyle = 'rgba(16, 5, 6, 0.85)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(lx, lTop);
    ctx.lineTo(lx, gY - 30 * s);
    ctx.moveTo(lx + 22 * s, lTop);
    ctx.lineTo(lx + 22 * s, gY - 30 * s);
    ctx.stroke();
    ctx.lineWidth = 2 * s;
    for (let yy = lTop + 12 * s; yy < gY - 30 * s; yy += 20 * s) {
      ctx.beginPath();
      ctx.moveTo(lx, yy);
      ctx.lineTo(lx + 22 * s, yy);
      ctx.stroke();
    }

    // ---- low console at the wall base
    const conX = w * 0.37 - cam * 0.13;
    const conW = w * 0.26;
    const conY = gY - 46 * s;
    ctx.fillStyle = '#150506';
    ctx.fillRect(conX, conY, conW, 46 * s);
    ctx.fillStyle = 'rgba(255, 110, 44, 0.12)';
    ctx.fillRect(conX, conY, conW, 2 * s);
    ctx.fillStyle = 'rgba(6, 2, 3, 0.7)';
    for (let i = 0; i < 5; i++) ctx.fillRect(conX + (0.08 + i * 0.17) * conW, conY + 10 * s, conW * 0.1, 24 * s);
    for (let i = 0; i < 6; i++) {
      const blink = 0.4 + Math.sin(t * 2 + i * 1.9) * 0.3;
      ctx.fillStyle = i % 3 === 0 ? `rgba(120, 230, 255, ${blink})` : `rgba(255, 150, 60, ${blink})`;
      ctx.beginPath();
      ctx.arc(conX + (0.1 + i * 0.15) * conW, conY + 6 * s, 1.6 * s, 0, TAU);
      ctx.fill();
    }

    // ---- barrels at the arena edges
    const props = [
      { x: 0.045, w: 30, h: 58 },
      { x: 0.075, w: 34, h: 66 },
      { x: 0.108, w: 28, h: 52 },
      { x: 0.955, w: 30, h: 58 },
      { x: 0.985, w: 34, h: 66 },
    ];
    for (const p of props) {
      const px = p.x * w - cam * 0.16;
      const pw = p.w * s;
      const ph = p.h * s;
      const py = gY - ph;
      const bg = ctx.createLinearGradient(px, 0, px + pw, 0);
      bg.addColorStop(0, '#3a1411');
      bg.addColorStop(0.45, '#1c0808');
      bg.addColorStop(1, '#0c0304');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(px + pw * 0.5, py + 3 * s, pw * 0.5, 4 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(px, py, pw, ph - 3 * s);
      ctx.fillStyle = 'rgba(255, 120, 56, 0.09)';
      ctx.fillRect(px, py + 8 * s, pw, 2 * s);
      ctx.fillRect(px, py + ph * 0.62, pw, 2 * s);
    }

    // ---- pipe run
    const pipeY = horizon - 84 * s;
    ctx.strokeStyle = 'rgba(20, 6, 7, 0.95)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 15 * s;
    ctx.beginPath();
    ctx.moveTo(fx + 40 * s, pipeY);
    ctx.lineTo(bx + bw * 0.3, pipeY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 130, 60, 0.1)';
    for (let px = fx + 100 * s; px < bx; px += 150 * s) {
      ctx.fillRect(px, pipeY - 10 * s, 6 * s, 20 * s);
      ctx.fillRect(px, pipeY - 10 * s, 1.8 * s, 20 * s);
    }
    // valve wheel
    const vx = w * 0.53;
    const vy = pipeY - 22 * s;
    ctx.strokeStyle = '#351010';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(vx, vy, 12 * s, 0, TAU);
    ctx.moveTo(vx, pipeY - 10 * s);
    ctx.lineTo(vx, vy - 12 * s);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 130, 60, 0.14)';
    ctx.lineWidth = 1.2 * s;
    for (let a = 0; a < 3; a++) {
      const ang = t * 0.15 + (a / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(vx + Math.cos(ang) * 11 * s, vy + Math.sin(ang) * 11 * s);
      ctx.lineTo(vx - Math.cos(ang) * 11 * s, vy - Math.sin(ang) * 11 * s);
      ctx.stroke();
    }

    // ---- metal floor
    const floor = ctx.createLinearGradient(0, gY - 2 * s, 0, h);
    floor.addColorStop(0, '#33130f');
    floor.addColorStop(0.12, '#200b0a');
    floor.addColorStop(0.55, '#120607');
    floor.addColorStop(1, '#050203');
    ctx.fillStyle = floor;
    ctx.fillRect(0, gY - 2 * s, w, h - gY + 2 * s);

    // dark steel apron just behind the fight line
    const apron = ctx.createLinearGradient(0, gY, 0, gY + 26 * s);
    apron.addColorStop(0, 'rgba(9, 3, 4, 0.7)');
    apron.addColorStop(1, 'rgba(9, 3, 4, 0)');
    ctx.fillStyle = apron;
    ctx.fillRect(0, gY, w, 26 * s);

    // furnace reflection pool
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(fx, gY + 34 * s);
    ctx.scale(1, 0.3);
    const pool = ctx.createRadialGradient(0, 0, 4, 0, 0, 250 * s);
    pool.addColorStop(0, 'rgba(255, 154, 64, 0.24)');
    pool.addColorStop(0.5, 'rgba(255, 110, 36, 0.08)');
    pool.addColorStop(1, 'rgba(255, 90, 22, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(0, 0, 250 * s, 0, TAU);
    ctx.fill();
    ctx.restore();

    // hot edge
    ctx.save();
    ctx.shadowColor = '#ff6a1e';
    ctx.shadowBlur = 22 * s;
    ctx.strokeStyle = 'rgba(255, 118, 40, 0.9)';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, gY);
    ctx.lineTo(w, gY);
    ctx.stroke();
    ctx.restore();

    // plate seams
    ctx.strokeStyle = 'rgba(255, 128, 60, 0.14)';
    ctx.lineWidth = 1.4;
    const vanish = w / 2 - cam * 0.18;
    for (let i = 0; i < 12; i++) {
      const k = i / 12;
      const y = gY + Math.pow(k, 1.55) * (h - gY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vanish + i * 110 * s, gY);
      ctx.lineTo(vanish + i * 380 * s, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 150, 80, 0.12)';
    for (let i = -7; i <= 7; i++) {
      const x0 = vanish + i * 110 * s;
      for (let k = 1; k < 4; k++) {
        const yy = gY + Math.pow(k / 4, 1.55) * (h - gY);
        const xx = x0 + (x0 - vanish) * (Math.pow(k / 4, 1.55) * (h - gY) / (h - gY) * 2.45);
        ctx.fillRect(xx - 1.2 * s, yy - 1.2 * s, 2.4 * s, 2.4 * s);
      }
    }

    // molten channels at the arena edges
    for (const side of [0, 1]) {
      const cx = side ? w - 62 * s : 62 * s;
      const cg = ctx.createLinearGradient(0, gY, 0, h);
      cg.addColorStop(0, 'rgba(255, 140, 44, 0.5)');
      cg.addColorStop(0.45, 'rgba(196, 52, 14, 0.24)');
      cg.addColorStop(1, 'rgba(90, 14, 6, 0)');
      ctx.fillStyle = cg;
      ctx.fillRect(cx - 34 * s, gY + 2 * s, 68 * s, h - gY);
      ctx.strokeStyle = 'rgba(8, 2, 3, 0.8)';
      ctx.lineWidth = 4 * s;
      for (let k = 0; k < 8; k++) {
        const yy = gY + 6 * s + Math.pow(k / 8, 1.3) * (h - gY) * 0.92;
        ctx.beginPath();
        ctx.moveTo(cx - 38 * s, yy);
        ctx.lineTo(cx + 38 * s, yy);
        ctx.stroke();
      }
    }

    // magma cracks
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const mx = ((i * 0.13 + 0.06) * w + Math.sin(t * 0.2 + i) * 16 * s) - cam * 0.2;
      const my = gY + (0.16 + (i % 3) * 0.2) * (h - gY);
      const len = (44 + (i % 4) * 40) * s;
      const flick = 0.72 + Math.sin(t * 2.2 + i * 1.3) * 0.18;
      ctx.strokeStyle = `rgba(255, 92, 22, ${(0.2 + (i % 3) * 0.07) * flick})`;
      ctx.lineWidth = (2 + (i % 2)) * s;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + len * 0.3, my - 6 * s);
      ctx.lineTo(mx + len * 0.55, my + 4 * s);
      ctx.lineTo(mx + len, my - 2 * s);
      ctx.stroke();
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(mx + len * 0.55, my + 4 * s);
      ctx.lineTo(mx + len * 0.68, my + 14 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArenaParticles(ctx, arena, t, v) {
    const { w, h } = v;
    const gY = v.groundY;
    if (arena.key === 'neon') {
      this.drawRain(ctx, t, v);
      // floating holographic dust
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#55e6ff';
      ctx.beginPath();
      for (const d of dust) {
        const x = ((d.x + t * d.sp) % 1) * w;
        const y = gY - ((d.y * 500 + Math.sin(t * 0.6 + d.sway) * 30) * v.scale) - 60 * v.scale;
        const r = d.r * v.scale;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (arena.key === 'frost') {
      this.drawSnow(ctx, t, v);
    } else {
      this.drawEmbers(ctx, t, v);
    }
  }

  drawRain(ctx, t, v) {
    const { w, h } = v;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;
    for (let band = 0; band < 2; band++) {
      ctx.strokeStyle = band ? 'rgba(150, 220, 255, 0.16)' : 'rgba(150, 220, 255, 0.07)';
      ctx.beginPath();
      for (const r of rain) {
        if ((r.a > 0.11 ? 1 : 0) !== band) continue;
        const x = ((r.x + t * 0.008) % 1) * w;
        const y = (((r.y + t * r.sp * 0.06) % 1)) * h;
        ctx.moveTo(x, y);
        ctx.lineTo(x - r.len * 0.15, y + r.len);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSnow(ctx, t, v) {
    const { w, h } = v;
    for (let band = 0; band < 3; band++) {
      ctx.globalAlpha = 0.2 + band * 0.16;
      ctx.fillStyle = '#e9fbff';
      ctx.beginPath();
      for (const s of snow) {
        const b = s.a > 0.5 ? 2 : s.a > 0.33 ? 1 : 0;
        if (b !== band) continue;
        const x = ((s.x + Math.sin(t * 0.4 + s.sway) * 0.03 + t * 0.004) % 1) * w;
        const y = ((s.y + t * s.sp * 6) % 1) * h;
        const r = s.r * v.scale * 0.9;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawEmbers(ctx, t, v) {
    const { w, h } = v;
    const pulse = 0.7 + Math.sin(t * 3) * 0.22;
    for (const color of ['#ff8a3c', '#ffc25c']) {
      ctx.globalAlpha = 0.38 * pulse;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (const e of embers) {
        if ((Math.sin(e.sway) > 0 ? '#ff8a3c' : '#ffc25c') !== color) continue;
        const x = ((e.x + Math.sin(t * 0.5 + e.sway) * 0.02 + t * 0.005) % 1) * w;
        const y = h - ((e.y + t * e.sp * 4) % 1) * (h - v.horizon * 0.4);
        const r = e.r * v.scale * 0.8;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
    }
    // sparks rising out of the furnace mouth
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const age = (t * 0.15 + i / 12) % 1;
      const x = v.w * 0.225 + Math.sin(age * 5 + i * 1.7) * (16 + age * 82) * v.scale;
      const y = (v.horizon + 34 * v.scale) - age * 210 * v.scale;
      ctx.globalAlpha = (1 - age) * 0.55;
      ctx.fillStyle = i % 3 === 0 ? '#ffe0a0' : '#ff9a3c';
      ctx.beginPath();
      ctx.arc(x, y, (1.3 + (1 - age) * 1.7) * v.scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawForeground(ctx, arena, t, v, scene) {
    const { w, h } = v;
    // bottom vignette fog
    const g = ctx.createLinearGradient(0, h * 0.72, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    if (arena.key === 'neon') {
      // foreground rain spatter
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const age = (t * 0.4 + i / 12) % 1;
        const x = ((i * 0.137 + 0.02) * w + Math.sin(t * 0.3 + i) * 8) % w;
        const y = v.groundY + age * (h - v.groundY) * 1.1;
        ctx.fillStyle = `rgba(90, 225, 255, ${(1 - age) * 0.14})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 18 * v.scale * (0.3 + age), 2.5 * v.scale, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    } else if (arena.key === 'frost') {
      // drifting foreground flakes
      for (let i = 0; i < 18; i++) {
        const x = ((i * 0.071 + t * 0.01) % 1) * w;
        const y = ((i * 0.043 + t * 0.03) % 1) * h;
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#eaffff';
        ctx.beginPath();
        ctx.arc(x, y, (1.2 + (i % 3)) * v.scale * 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // foreground embers / heat dust
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        const x = ((i * 0.09 + 0.02 + Math.sin(t * 0.6 + i) * 0.02) % 1) * w;
        const y = h - ((i * 0.12 + t * 0.04) % 1) * h * 0.7;
        ctx.fillStyle = `rgba(255, 122, 42, ${0.08 + (i % 3) * 0.04})`;
        ctx.beginPath();
        ctx.arc(x, y, (1.5 + (i % 4)) * v.scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawParticles(ctx, parts, t) {
    if (!parts.length) return;
    ctx.save();
    for (const p of parts) {
      const k = p.life / p.maxLife;
      if (k <= 0) continue;
      ctx.globalAlpha = clamp(k, 0, 1) * (p.alpha ?? 1);
      if (p.additive) ctx.globalCompositeOperation = 'lighter';
      else ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = p.color;
      if (p.shape === 'line') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
      } else if (p.shape === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawProjectiles(ctx, projectiles, t) {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.facing, 1);
      ctx.globalCompositeOperation = 'lighter';
      if (p.type === 'ice') {
        const r = p.radius;
        // aura
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 2.6);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.18, 'rgba(130,245,255,0.75)');
        g.addColorStop(0.5, 'rgba(50,180,255,0.24)');
        g.addColorStop(1, 'rgba(20,80,220,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.6, 0, TAU);
        ctx.fill();
        // rotating crescent blades
        for (let i = 0; i < 3; i++) {
          const rot = t * 8 + i * (TAU / 3);
          ctx.save();
          ctx.rotate(rot);
          ctx.strokeStyle = i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(120,240,255,0.8)';
          ctx.lineWidth = 4 - i * 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, r * (0.85 + i * 0.14), -1.15, 1.15);
          ctx.stroke();
          ctx.restore();
        }
        // core
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.42, r * 0.22, 0, 0, TAU);
        ctx.fill();
        // trailing spikes
        ctx.strokeStyle = 'rgba(160, 245, 255, 0.7)';
        ctx.lineWidth = 2.4;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          const len = r * (1.3 + Math.sin(t * 14 + i) * 0.2);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
          ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          ctx.stroke();
        }
      } else {
        const r = p.radius;
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 2.8);
        g.addColorStop(0, 'rgba(255,255,240,0.95)');
        g.addColorStop(0.18, 'rgba(255,200,90,0.8)');
        g.addColorStop(0.46, 'rgba(255,80,25,0.34)');
        g.addColorStop(1, 'rgba(255,30,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.7, 0, TAU);
        ctx.fill();
        // jagged fire ring
        ctx.rotate(t * 3);
        ctx.fillStyle = 'rgba(255, 120, 30, 0.72)';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          const rr = i % 2 === 0 ? r * 1.12 : r * 0.7;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 236, 170, 0.92)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.46, 0, TAU);
        ctx.fill();
        // flame tongues
        ctx.strokeStyle = 'rgba(255, 140, 40, 0.65)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + t * 2;
          const len = r * (1.5 + Math.sin(t * 12 + i * 2) * 0.3);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
          ctx.quadraticCurveTo(
            Math.cos(a + 0.3) * len, Math.sin(a + 0.3) * len,
            Math.cos(a) * len * 1.2, Math.sin(a) * len * 1.2
          );
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawEffects(ctx, effects, t) {
    for (const e of effects) {
      const k = clamp(e.life / e.maxLife, 0, 1);
      ctx.save();
      if (e.type === 'hit') {
        ctx.translate(e.x, e.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k;
        const size = e.size * (0.6 + (1 - k) * 0.9);
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 2);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.25, e.color || '#9ff6ff');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5 * k;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + (e.seed || 0);
          const len = size * (1.4 + (i % 2) * 0.7);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * size * 0.3, Math.sin(a) * size * 0.3);
          ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          ctx.stroke();
        }
      } else if (e.type === 'block') {
        ctx.translate(e.x, e.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k * 0.9;
        ctx.strokeStyle = e.color || '#9feaff';
        ctx.lineWidth = 5 * k;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * (1.2 - k * 0.5), -1.2, 1.2);
        ctx.stroke();
        ctx.lineWidth = 2 * k;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * (0.8 - k * 0.3), -1.3, 1.3);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = -1.2 + (i / 5) * 2.4;
          const len = e.size * (0.5 + (1 - k) * 0.9);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * e.size * 0.4, Math.sin(a) * e.size * 0.4);
          ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          ctx.stroke();
        }
      } else if (e.type === 'ring') {
        ctx.translate(e.x, e.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k * (e.alpha || 0.7);
        ctx.strokeStyle = e.color || '#9ff6ff';
        ctx.lineWidth = (e.width || 5) * k;
        ctx.beginPath();
        ctx.ellipse(0, 0, e.size * (1.2 - k), e.size * 0.3 * (1.2 - k), 0, 0, TAU);
        ctx.stroke();
      } else if (e.type === 'slash') {
        ctx.translate(e.x, e.y);
        ctx.scale(e.facing || 1, 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k;
        const p = 1 - k;
        const a0 = e.angle0 ?? -1.5;
        const a1 = e.angle1 ?? 0.9;
        const r = e.size || 140;
        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.3, e.color || '#bffaff');
        grad.addColorStop(0.7, '#ffffff');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = (e.width || 16) * (0.4 + k * 0.8);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, r * (e.radius || 1) * (0.8 + p * 0.35), a0 + p * 0.5, a1 + p * 0.2);
        ctx.stroke();
        ctx.lineWidth = Math.max(1, (e.width || 16) * 0.22 * k);
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * (e.radius || 1) * (0.8 + p * 0.35), a0 + p * 0.5, a1 + p * 0.2);
        ctx.stroke();
      } else if (e.type === 'shockwave') {
        ctx.translate(e.x, e.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k * 0.8;
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = i === 0 ? '#ffffff' : (e.color || '#9ff6ff');
          ctx.lineWidth = (4 - i) * k;
          ctx.beginPath();
          ctx.ellipse(0, 0, (e.size || 120) * (1.1 - k) * (1 + i * 0.32), (e.size || 120) * 0.24 * (1.1 - k), 0, 0, TAU);
          ctx.stroke();
        }
      } else if (e.type === 'charge') {
        ctx.translate(e.x, e.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k * 0.85;
        const r = (e.size || 110) * (0.6 + (1 - k) * 0.7);
        ctx.strokeStyle = e.color || '#9ff6ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 10; i++) {
          const a = t * 4 + (i / 10) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
          ctx.lineTo(Math.cos(a + 0.3) * r * 1.15, Math.sin(a + 0.3) * r * 1.15);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
