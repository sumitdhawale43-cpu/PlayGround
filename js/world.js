(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Scenery
  // ---------------------------------------------------------------------------
  let scenery = null;
  let ambient = null;

  function buildScenery() {
    const r = mulberry32(1874);
    const W = view.W, H = view.H, S = view.scale;
    const stars = [];
    const starCount = Math.round(Math.min(150, Math.max(35, W / 12)));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        nx: r(), ny: r() * 0.52, size: 0.35 + r() * 1.25,
        a: 0.15 + r() * 0.6, phase: r() * TAU
      });
    }
    const clouds = [];
    for (let i = 0; i < 9; i++) {
      clouds.push({
        nx: r() * 1.25 - 0.1, ny: 0.1 + r() * 0.36,
        w: 0.18 + r() * 0.38, h: 0.012 + r() * 0.035,
        a: 0.035 + r() * 0.08, speed: 0.0025 + r() * 0.005, phase: r() * 10
      });
    }
    const farPeaks = [];
    const midPeaks = [];
    for (let i = 0; i <= 22; i++) {
      farPeaks.push({ x: -0.12 + i * 0.058, y: 0.49 + (r() - 0.5) * 0.065 });
      midPeaks.push({ x: -0.1 + i * 0.052, y: 0.535 + (r() - 0.5) * 0.048 });
    }
    const bamboo = [];
    for (let i = 0; i < 42; i++) {
      bamboo.push({
        nx: r() * 1.5 - 0.25, h: 0.24 + r() * 0.39, w: 0.8 + r() * 2.5,
        lean: (r() - 0.5) * 0.08, phase: r() * TAU, tone: r(), leaf: 2 + Math.floor(r() * 4)
      });
    }
    const foregroundBamboo = [];
    for (let i = 0; i < 12; i++) {
      foregroundBamboo.push({
        nx: i % 2 === 0 ? -0.02 + r() * 0.12 : 0.9 + r() * 0.15,
        h: 0.65 + r() * 0.55, w: 4 + r() * 9, lean: (r() - 0.5) * 0.05,
        phase: r() * TAU, leaves: 3 + Math.floor(r() * 4)
      });
    }
    const stones = [];
    for (let i = 0; i < 150; i++) {
      stones.push({
        x: -350 + r() * (ARENA_W + 700), z: 0.04 + r() * 0.96,
        w: 16 + r() * 58, h: 4 + r() * 13, rot: (r() - 0.5) * 0.22,
        tone: r()
      });
    }
    stones.sort((a, b) => a.z - b.z);
    const paving = [];
    for (let zi = 0; zi < 14; zi++) {
      const z = 0.035 + zi * 0.072;
      const stagger = zi % 2 ? 0.5 : 0;
      for (let xi = 0; xi < 31; xi++) {
        paving.push({
          x: -290 + (xi + stagger) * 104 + (r() - 0.5) * 16,
          z, w: 84 + r() * 28, d: 0.06 + r() * 0.022,
          tone: r()
        });
      }
    }
    const grass = [];
    for (let i = 0; i < 85; i++) {
      grass.push({
        x: -250 + r() * (ARENA_W + 650), z: 0.03 + r() * 0.97,
        h: 8 + r() * 24, blades: 2 + Math.floor(r() * 3), phase: r() * TAU, tone: r()
      });
    }
    const leaves = [];
    for (let i = 0; i < 70; i++) {
      leaves.push({
        x: -250 + r() * (ARENA_W + 650), z: 0.05 + r() * 0.95,
        size: 2 + r() * 5, rot: r() * TAU, tone: r()
      });
    }
    const foregroundReeds = [];
    for (let i = 0; i < 46; i++) {
      const edge = i < 16 || i > 30;
      foregroundReeds.push({
        nx: r(), h: (edge ? 74 : 42) + r() * (edge ? 86 : 48),
        blades: 2 + Math.floor(r() * 4), phase: r() * TAU,
        tone: r(), lean: (r() - 0.5) * 0.34, width: 0.8 + r() * 1.7
      });
    }
    foregroundReeds.sort((a, b) => a.h - b.h);
    const puddles = [
      { x: 760, z: 0.71, w: 145, h: 21, a: 0.24 },
      { x: 1470, z: 0.36, w: 110, h: 13, a: 0.16 },
      { x: 2050, z: 0.8, w: 180, h: 25, a: 0.21 }
    ];
    scenery = { stars, clouds, farPeaks, midPeaks, bamboo, foregroundBamboo, stones, paving, grass, leaves, foregroundReeds, puddles };

    ambient = {
      petals: [], fireflies: [], embers: []
    };
    const petalCount = W < 700 ? 26 : 48;
    for (let i = 0; i < petalCount; i++) {
      ambient.petals.push(makePetal(true));
    }
    const ffCount = W < 700 ? 6 : 11;
    for (let i = 0; i < ffCount; i++) {
      ambient.fireflies.push({
        x: rand(W), y: rand(H * 0.85, H * 0.3), phase: rand(TAU),
        speed: rand(14, 4), drift: rand(9, 2), size: rand(1.8, 0.7)
      });
    }
    const emberCount = W < 700 ? 8 : 16;
    for (let i = 0; i < emberCount; i++) {
      ambient.embers.push({
        x: rand(W), y: rand(H * 0.9, H * 0.5), vy: rand(26, 9),
        vx: rand(8, -8), life: rand(1), size: rand(2.1, 0.6)
      });
    }
  }

  function makePetal(initial = false) {
    const front = chance(0.35);
    return {
      x: rand(view.W + 80, -80),
      y: initial ? rand(view.H * 0.96, -30) : rand(-40, -140),
      vx: rand(24, -42), vy: rand(39, 13), sway: rand(22, 5),
      phase: rand(TAU), size: front ? rand(8, 3.2) : rand(5.5, 2),
      spin: rand(2.3, -2.3), rot: rand(TAU), front,
      color: chance(0.3) ? '#c54a3d' : chance(0.5) ? '#8f2e2c' : '#6d2831'
    };
  }

  // ---------------------------------------------------------------------------
  // Ambient
  // ---------------------------------------------------------------------------
  function updateScenery(dt) {
    if (!ambient) buildScenery();
    const W = view.W, H = view.H;
    for (const p of ambient.petals) {
      p.phase += dt * 1.2;
      p.x += (p.vx + Math.sin(p.phase) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (p.y > H + 30 || p.x < -110 || p.x > W + 110) Object.assign(p, makePetal(false));
    }
    for (const f of ambient.fireflies) {
      f.phase += dt * 1.6;
      f.x += Math.cos(f.phase * 0.7) * f.drift * dt;
      f.y += Math.sin(f.phase) * f.speed * dt;
      if (f.x < -20) f.x = W + 20;
      if (f.x > W + 20) f.x = -20;
      if (f.y < H * 0.25) f.y = H * 0.85;
      if (f.y > H * 0.94) f.y = H * 0.3;
    }
    for (const e of ambient.embers) {
      e.life -= dt * 0.18;
      e.x += e.vx * dt;
      e.y -= e.vy * dt;
      if (e.life <= 0 || e.y < H * 0.25) {
        e.x = rand(W); e.y = H * rand(0.92, 0.55); e.life = rand(1, 0.5);
      }
    }
  }

  function drawPetal(p, scale = 1) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(scale, scale * 0.58);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.front ? 0.5 : 0.34;
    ctx.beginPath();
    ctx.moveTo(-p.size * 0.5, 0);
    ctx.quadraticCurveTo(0, -p.size * 0.55, p.size * 0.55, 0);
    ctx.quadraticCurveTo(0, p.size * 0.35, -p.size * 0.5, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawAmbient(front = false) {
    if (!ambient) return;
    for (const p of ambient.petals) {
      if (p.front === front) drawPetal(p, p.front ? 1.25 : 0.9);
    }
    if (!front) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const f of ambient.fireflies) {
        const pulse = 0.3 + Math.max(0, Math.sin(f.phase * 1.8)) * 0.7;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 9);
        g.addColorStop(0, `rgba(160,255,215,${0.28 * pulse})`);
        g.addColorStop(1, 'rgba(80,200,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.size * 9, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(210,255,228,${0.65 * pulse})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.size * 0.65, 0, TAU); ctx.fill();
      }
      for (const e of ambient.embers) {
        const a = clamp(e.life, 0, 1) * 0.45;
        ctx.fillStyle = `rgba(255,166,88,${a})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,96,46,${a * 0.28})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 4.5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Sky, moon, mountains
  // ---------------------------------------------------------------------------
  function drawSky() {
    const W = view.W, H = view.H, S = view.scale;
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    sky.addColorStop(0, '#03050b');
    sky.addColorStop(0.38, '#090914');
    sky.addColorStop(0.72, '#17101b');
    sky.addColorStop(1, '#2a151d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const s of scenery.stars) {
      const tw = 0.55 + Math.sin(G.time * 0.75 + s.phase) * 0.45;
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = '#e8e5dd';
      ctx.beginPath();
      ctx.arc(s.nx * W, s.ny * H, s.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Aurora-like dust band
    ctx.save();
    const band = ctx.createLinearGradient(0, H * 0.13, W, H * 0.34);
    band.addColorStop(0, 'rgba(88,42,64,0)');
    band.addColorStop(0.45, 'rgba(113,49,62,0.055)');
    band.addColorStop(1, 'rgba(45,50,80,0)');
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.2);
    ctx.bezierCurveTo(W * 0.3, H * 0.11, W * 0.5, H * 0.3, W, H * 0.18);
    ctx.lineTo(W, H * 0.31);
    ctx.bezierCurveTo(W * 0.55, H * 0.4, W * 0.3, H * 0.2, 0, H * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawMoon(W, H, S);

    // Clouds
    for (const c of scenery.clouds) {
      const drift = ((c.nx + G.time * c.speed) % 1.35) - 0.16;
      const x = drift * W;
      const y = c.ny * H + Math.sin(G.time * 0.04 + c.phase) * 5 * S;
      const cw = c.w * W, ch = c.h * H;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ch / cw);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, cw);
      g.addColorStop(0, `rgba(113,103,121,${c.a})`);
      g.addColorStop(0.55, `rgba(68,63,80,${c.a * 0.7})`);
      g.addColorStop(1, 'rgba(35,34,47,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, cw, 0, TAU); ctx.fill();
      ctx.restore();
    }

    drawMountains(W, H, S);
  }

  function drawMoon(W, H, S) {
    const mx = W * (W < 700 ? 0.73 : 0.715);
    const my = H * (W < 700 ? 0.215 : 0.235);
    const R = Math.min(W, H) * (W < 700 ? 0.16 : 0.17);
    const pulse = 1 + Math.sin(G.time * 0.33) * 0.012;

    ctx.save();
    const halo = ctx.createRadialGradient(mx, my, R * 0.2, mx, my, R * 4.2);
    halo.addColorStop(0, 'rgba(219,91,67,0.27)');
    halo.addColorStop(0.28, 'rgba(174,57,52,0.12)');
    halo.addColorStop(0.68, 'rgba(79,36,58,0.045)');
    halo.addColorStop(1, 'rgba(20,20,42,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(mx, my, R * 4.2, 0, TAU); ctx.fill();

    // outer eclipse ring
    ctx.strokeStyle = 'rgba(255,142,103,0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(mx, my, R * 1.21, 0, TAU); ctx.stroke();

    const moon = ctx.createRadialGradient(mx - R * 0.32, my - R * 0.34, R * 0.1, mx, my, R * pulse);
    moon.addColorStop(0, '#ffd9a4');
    moon.addColorStop(0.34, '#f6a36e');
    moon.addColorStop(0.7, '#dc5b49');
    moon.addColorStop(1, '#a6333a');
    ctx.fillStyle = moon;
    ctx.beginPath(); ctx.arc(mx, my, R * pulse, 0, TAU); ctx.fill();

    // craters
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.clip();
    const craters = [
      [-0.36, -0.22, 0.24, 0.18], [0.14, -0.38, 0.14, 0.13],
      [0.28, 0.16, 0.27, 0.22], [-0.18, 0.34, 0.16, 0.12],
      [-0.61, 0.2, 0.1, 0.08], [0.48, -0.16, 0.08, 0.06]
    ];
    for (const [x, y, rx, ry] of craters) {
      const g = ctx.createRadialGradient(mx + x * R, my + y * R, 0, mx + x * R, my + y * R, rx * R);
      g.addColorStop(0, 'rgba(115,40,45,0.22)');
      g.addColorStop(0.75, 'rgba(150,52,47,0.11)');
      g.addColorStop(1, 'rgba(255,190,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(mx + x * R, my + y * R, rx * R, ry * R, 0.35, 0, TAU);
      ctx.fill();
    }
    // veil clouds across moon
    const veil = ctx.createLinearGradient(0, my - R * 0.15, 0, my + R * 0.7);
    veil.addColorStop(0, 'rgba(32,27,39,0)');
    veil.addColorStop(0.52, 'rgba(34,28,40,0.38)');
    veil.addColorStop(1, 'rgba(22,20,32,0.62)');
    ctx.fillStyle = veil;
    ctx.beginPath();
    ctx.moveTo(mx - R, my + R * 0.12);
    ctx.bezierCurveTo(mx - R * 0.4, my - R * 0.08, mx + R * 0.2, my + R * 0.3, mx + R, my + R * 0.04);
    ctx.lineTo(mx + R, my + R); ctx.lineTo(mx - R, my + R);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawMountains(W, H, S) {
    const horizon = HORIZON * S;
    const offset = -G.cam.x * 0.035 * S;
    ctx.save();
    ctx.translate(offset, 0);

    const drawRidge = (peaks, color, scaleY, lift) => {
      ctx.beginPath();
      ctx.moveTo(-W * 0.25, horizon + 100 * S);
      for (const p of peaks) {
        const x = p.x * W;
        const y = (p.y * H) * 0.92 - lift * S;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W * 1.4, horizon + 110 * S);
      ctx.lineTo(W * 1.4, horizon + 170 * S);
      ctx.lineTo(-W * 0.25, horizon + 170 * S);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawRidge(scenery.farPeaks, '#0e0d19', 1, 58);
    const haze = ctx.createLinearGradient(0, horizon * 0.82, 0, horizon + 30 * S);
    haze.addColorStop(0, 'rgba(104,74,91,0)');
    haze.addColorStop(0.7, 'rgba(110,70,83,0.1)');
    haze.addColorStop(1, 'rgba(78,57,74,0.2)');
    ctx.fillStyle = haze;
    ctx.fillRect(-W * 0.3, horizon * 0.8, W * 1.8, horizon * 0.26);

    drawRidge(scenery.midPeaks, '#080a11', 1, 12);

    // far temple roof silhouette
    drawShrineSilhouette(W * 0.16 + offset * 0.35, horizon + 25 * S, S * 0.7);
    // the gate is the visual anchor
    drawTorii(W * 0.815 + offset * 0.85, horizon + 58 * S, S * 0.98);
    ctx.restore();
  }

  function drawShrineSilhouette(x, base, s) {
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(s, s);
    const fill = '#090b10';
    ctx.fillStyle = fill;
    ctx.fillRect(-120, -40, 250, 42);
    ctx.fillRect(-96, -150, 15, 116);
    ctx.fillRect(72, -150, 15, 116);
    ctx.fillRect(-70, -145, 10, 111);
    ctx.fillRect(50, -145, 10, 111);
    // eaves
    for (let i = 0; i < 3; i++) {
      const y = -150 - i * 62, w = 175 - i * 28;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.quadraticCurveTo(-w * 0.55, y - 24, 0, y - 30);
      ctx.quadraticCurveTo(w * 0.55, y - 24, w, y);
      ctx.lineTo(w * 0.92, y + 10);
      ctx.quadraticCurveTo(0, y - 11, -w * 0.92, y + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(168,95,62,0.42)';
    ctx.fillRect(-92, -126, 7, 24);
    ctx.fillRect(59, -126, 7, 24);
    ctx.restore();
  }

  function drawTorii(x, base, s) {
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(s, s);
    const top = -412;
    // glow behind gate
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, -238, 20, 0, -238, 230);
    glow.addColorStop(0, 'rgba(191,61,49,0.11)');
    glow.addColorStop(1, 'rgba(151,38,42,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-260, -520, 520, 530);
    ctx.restore();

    ctx.fillStyle = '#190d11';
    ctx.strokeStyle = 'rgba(144,49,49,0.55)';
    ctx.lineWidth = 1.2;

    // pillars
    for (const px of [-112, 112]) {
      ctx.beginPath();
      ctx.moveTo(px - 16, 0);
      ctx.lineTo(px - 11, top + 68);
      ctx.quadraticCurveTo(px - 9, top + 44, px - 14, top + 38);
      ctx.lineTo(px + 14, top + 38);
      ctx.quadraticCurveTo(px + 9, top + 44, px + 11, top + 68);
      ctx.lineTo(px + 16, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    // top beam, curved
    ctx.beginPath();
    ctx.moveTo(-192, top + 42);
    ctx.quadraticCurveTo(-140, top + 24, -72, top + 28);
    ctx.lineTo(72, top + 28);
    ctx.quadraticCurveTo(140, top + 24, 192, top + 42);
    ctx.lineTo(180, top + 58);
    ctx.quadraticCurveTo(120, top + 42, 70, top + 44);
    ctx.lineTo(-70, top + 44);
    ctx.quadraticCurveTo(-120, top + 42, -180, top + 58);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // roof cap
    ctx.fillStyle = '#0d090c';
    ctx.beginPath();
    ctx.moveTo(-206, top + 30);
    ctx.quadraticCurveTo(-150, top + 10, -60, top + 16);
    ctx.lineTo(60, top + 16);
    ctx.quadraticCurveTo(150, top + 10, 206, top + 30);
    ctx.lineTo(197, top + 39);
    ctx.quadraticCurveTo(140, top + 23, 62, top + 27);
    ctx.lineTo(-62, top + 27);
    ctx.quadraticCurveTo(-140, top + 23, -197, top + 39);
    ctx.closePath();
    ctx.fill();

    // second beam
    ctx.fillStyle = '#1d0e12';
    ctx.fillRect(-142, top + 105, 284, 15);
    ctx.strokeRect(-142, top + 105, 284, 15);
    ctx.fillRect(-9, top + 42, 18, 66);

    // plaque
    ctx.fillStyle = '#0c090b';
    ctx.fillRect(-30, top + 70, 60, 50);
    ctx.strokeStyle = 'rgba(201,165,104,0.5)';
    ctx.strokeRect(-30, top + 70, 60, 50);
    ctx.fillStyle = 'rgba(201,165,104,0.75)';
    ctx.font = '31px "Noto Serif JP", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('影', 0, top + 97);

    // rope and shide
    ctx.strokeStyle = 'rgba(184,163,126,0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-130, top + 126);
    ctx.bezierCurveTo(-70, top + 142, 20, top + 114, 92, top + 130);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const sx = -104 + i * 53, sy = top + 135 + Math.sin(i) * 4;
      ctx.strokeStyle = 'rgba(211,195,164,0.4)';
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(sx + 3, sy + 20);
      ctx.lineTo(sx - 4, sy + 28); ctx.lineTo(sx + 2, sy + 38);
      ctx.stroke();
    }

    // hanging tattered banners
    ctx.fillStyle = 'rgba(91,19,24,0.58)';
    ctx.beginPath();
    ctx.moveTo(-78, top + 122);
    ctx.lineTo(-56, top + 123);
    ctx.lineTo(-58, top + 222);
    ctx.lineTo(-70, top + 208);
    ctx.lineTo(-76, top + 226);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(117,26,29,0.38)';
    ctx.fillRect(62, top + 124, 16, 83);

    // base stones
    ctx.fillStyle = '#07080b';
    ctx.beginPath(); ctx.ellipse(-112, 3, 34, 9, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(112, 3, 34, 9, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Midground bamboo
  // ---------------------------------------------------------------------------
  function drawBamboo(screenSpace = false) {
    if (screenSpace && view.W < 760) return;
    const W = view.W, H = view.H, S = view.scale;
    const horizon = HORIZON * S;
    const list = screenSpace ? scenery.foregroundBamboo : scenery.bamboo;
    const offset = -G.cam.x * (screenSpace ? 0.085 : 0.03) * S;
    for (const b of list) {
      const x = ((b.nx * W + offset) % (W * 1.35) + W * 1.35) % (W * 1.35) - W * 0.1;
      if (x < -80 || x > W + 80) continue;
      const height = b.h * H;
      const sway = Math.sin(G.time * 0.35 + b.phase) * (screenSpace ? 7 : 4) * S;
      ctx.save();
      ctx.translate(x, horizon + 35 * S);
      ctx.rotate(b.lean);
      const w = b.w * (screenSpace ? S * 1.8 : S);
      const col = screenSpace ? '#030607' : (b.tone > 0.65 ? '#071310' : '#050d0b');
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(sway * 0.3, -height * 0.4, sway, -height * 0.75, sway * 1.8, -height);
      ctx.stroke();
      // node highlights
      if (!screenSpace) {
        ctx.strokeStyle = 'rgba(62,98,78,0.22)';
        ctx.lineWidth = Math.max(0.5, w * 0.18);
        for (let i = 1; i < 6; i++) {
          const yy = -height * (i / 6.4);
          const xx = sway * (i / 6.4) * 1.1;
          ctx.beginPath();
          ctx.moveTo(xx - w * 0.7, yy); ctx.lineTo(xx + w * 0.7, yy);
          ctx.stroke();
        }
      }
      // leaves
      const lc = screenSpace ? '#020405' : 'rgba(10,28,21,0.9)';
      ctx.fillStyle = lc;
      for (let i = 0; i < b.leaf; i++) {
        const t = 0.42 + i * 0.09;
        const lx = sway * t * 1.6;
        const ly = -height * t;
        const dir = i % 2 ? 1 : -1;
        const len = (screenSpace ? 35 : 18) * S * (0.7 + (i % 3) * 0.2);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(dir * (0.35 + i * 0.22) + Math.sin(G.time + b.phase + i) * 0.03);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(dir * len * 0.65, -len * 0.28, dir * len, 0);
        ctx.quadraticCurveTo(dir * len * 0.6, len * 0.1, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Ground
  // ---------------------------------------------------------------------------
  function drawGround() {
    const S = view.scale, W = view.W, H = view.H;
    ctx.save();
    worldTransform(1, 0.7);
    const top = HORIZON;
    const g = ctx.createLinearGradient(0, top, 0, 900);
    g.addColorStop(0, '#0d1113');
    g.addColorStop(0.18, '#121518');
    g.addColorStop(0.55, '#090c0f');
    g.addColorStop(1, '#040609');
    ctx.fillStyle = g;
    ctx.fillRect(-1800, top - 8, 6200, 1000);

    // faint stone path boundary
    ctx.fillStyle = 'rgba(84,69,61,0.06)';
    ctx.beginPath();
    ctx.moveTo(-1800, top + 2);
    ctx.lineTo(4400, top + 2);
    ctx.lineTo(4400, top + 18);
    ctx.lineTo(-1800, top + 18);
    ctx.closePath(); ctx.fill();

    // red moon reflection on the wet courtyard
    const reflectX = G.cam.x + (W * 0.715 - W / 2) / S;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rg = ctx.createRadialGradient(reflectX, top + 120, 2, reflectX, top + 120, 480);
    rg.addColorStop(0, 'rgba(204,96,67,0.13)');
    rg.addColorStop(0.32, 'rgba(136,57,57,0.07)');
    rg.addColorStop(1, 'rgba(73,37,58,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.ellipse(reflectX, top + 138, 520, 210, 0, 0, TAU); ctx.fill();
    ctx.restore();

    // worn flagstones
    for (const pv of scenery.paving) {
      if (pv.x < G.cam.x - view.half - 120 || pv.x > G.cam.x + view.half + 120) continue;
      const y1 = groundY(pv.z);
      const y2 = groundY(pv.z + pv.d);
      if (y2 - y1 < 1) continue;
      const ds1 = depthScale(pv.z), ds2 = depthScale(pv.z + pv.d);
      const w1 = pv.w * ds1 * 0.5, w2 = pv.w * ds2 * 0.5;
      ctx.beginPath();
      ctx.moveTo(pv.x - w1, y1);
      ctx.lineTo(pv.x + w1, y1);
      ctx.lineTo(pv.x + w2, y2);
      ctx.lineTo(pv.x - w2, y2);
      ctx.closePath();
      ctx.fillStyle = pv.tone > 0.68
        ? 'rgba(72,82,76,0.038)'
        : 'rgba(30,39,40,0.055)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(147,150,131,0.032)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // stones
    for (const st of scenery.stones) {
      const y = groundY(st.z);
      if (st.x < G.cam.x - view.half - 110 || st.x > G.cam.x + view.half + 110) continue;
      const ds = depthScale(st.z);
      ctx.save();
      ctx.translate(st.x, y + 1);
      ctx.rotate(st.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, st.w * ds * 0.5, st.h * ds * 0.36, 0, 0, TAU);
      ctx.fillStyle = st.tone > 0.75 ? 'rgba(84,78,69,0.13)' : 'rgba(46,47,45,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(156,143,121,0.045)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }

    // puddles
    for (const p of scenery.puddles) {
      if (p.x < G.cam.x - view.half - 250 || p.x > G.cam.x + view.half + 250) continue;
      const y = groundY(p.z), ds = depthScale(p.z);
      ctx.save();
      ctx.translate(p.x, y + 2);
      ctx.scale(1, 0.18);
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, p.w * ds);
      pg.addColorStop(0, `rgba(155,76,62,${p.a * 0.65})`);
      pg.addColorStop(0.55, `rgba(65,69,76,${p.a})`);
      pg.addColorStop(1, 'rgba(24,29,34,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(0, 0, p.w * ds, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(197,137,107,0.07)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, p.w * ds * 0.6, 0.2, 2.4); ctx.stroke();
      ctx.restore();
    }

    // fallen leaves
    for (const l of scenery.leaves) {
      if (l.x < G.cam.x - view.half - 80 || l.x > G.cam.x + view.half + 80) continue;
      const y = groundY(l.z);
      ctx.save();
      ctx.translate(l.x, y);
      ctx.rotate(l.rot);
      ctx.fillStyle = l.tone > 0.5 ? 'rgba(135,43,42,0.44)' : 'rgba(95,39,43,0.32)';
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size, l.size * 0.35, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // grass tufts
    for (const gr of scenery.grass) {
      if (gr.x < G.cam.x - view.half - 100 || gr.x > G.cam.x + view.half + 100) continue;
      const y = groundY(gr.z), ds = depthScale(gr.z);
      ctx.save();
      ctx.translate(gr.x, y);
      ctx.strokeStyle = gr.tone > 0.6 ? 'rgba(50,68,46,0.5)' : 'rgba(31,48,38,0.55)';
      ctx.lineWidth = 1.2 * ds;
      for (let i = 0; i < gr.blades; i++) {
        const angle = -1.55 + (i - gr.blades / 2) * 0.3 + Math.sin(G.time * 0.7 + gr.phase + i) * 0.04;
        const leng = gr.h * ds;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(angle) * leng * 0.3, -leng * 0.55, Math.cos(angle) * leng * 0.75, -leng);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Lanterns and their glow
    for (const l of [{ x: 330, z: 0.9 }, { x: 1490, z: 0.92 }, { x: 2280, z: 0.86 }]) {
      if (l.x < G.cam.x - view.half - 200 || l.x > G.cam.x + view.half + 200) continue;
      drawLantern(l.x, l.z);
    }

    // low courtyard haze
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const fogX = G.cam.x;
    const fog = ctx.createLinearGradient(-500, top + 3, 2000, top + 40);
    fog.addColorStop(0, 'rgba(96,111,120,0)');
    fog.addColorStop(0.45, 'rgba(107,119,129,0.055)');
    fog.addColorStop(1, 'rgba(83,96,110,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(fogX - view.half, top + 2, view.w, 38);
    ctx.restore();

    ctx.restore();
  }

  function drawLantern(x, z) {
    const y = groundY(z), ds = depthScale(z);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(ds * 1.05, ds * 1.05);

    // ground light
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const groundGlow = ctx.createRadialGradient(0, -18, 1, 0, -18, 100);
    groundGlow.addColorStop(0, 'rgba(255,157,76,0.15)');
    groundGlow.addColorStop(1, 'rgba(210,87,43,0)');
    ctx.fillStyle = groundGlow;
    ctx.beginPath(); ctx.ellipse(0, 0, 100, 25, 0, 0, TAU); ctx.fill();

    const glow = ctx.createRadialGradient(0, -85, 1, 0, -85, 85);
    glow.addColorStop(0, 'rgba(255,194,110,0.45)');
    glow.addColorStop(0.4, 'rgba(255,117,55,0.12)');
    glow.addColorStop(1, 'rgba(255,80,30,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, -85, 85, 0, TAU); ctx.fill();
    ctx.restore();

    // base
    ctx.fillStyle = '#0b0d0e';
    ctx.beginPath();
    ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(14, -13); ctx.lineTo(-14, -13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#151819';
    ctx.fillRect(-8, -53, 16, 41);
    ctx.fillStyle = '#0d1011';
    ctx.fillRect(-15, -61, 30, 9);
    // light chamber
    ctx.fillStyle = '#181818';
    ctx.fillRect(-18, -96, 36, 32);
    ctx.fillStyle = 'rgba(255,171,82,0.85)';
    ctx.fillRect(-11, -90, 22, 20);
    ctx.fillStyle = 'rgba(255,229,171,0.9)';
    ctx.fillRect(-5, -88, 10, 16);
    // cap
    ctx.fillStyle = '#0b0d0e';
    ctx.beginPath();
    ctx.moveTo(-30, -100); ctx.quadraticCurveTo(0, -122, 30, -100);
    ctx.lineTo(23, -91); ctx.quadraticCurveTo(0, -106, -23, -91); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#212325';
    ctx.beginPath(); ctx.arc(0, -124, 4, 0, TAU); ctx.fill();
    // warm flicker
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const t = G.time * 4 + x;
    const f = 0.7 + Math.sin(t) * 0.12 + Math.sin(t * 2.3) * 0.08;
    ctx.fillStyle = `rgba(255,203,123,${0.22 * f})`;
    ctx.beginPath(); ctx.arc(0, -80, 17, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Foreground
  // ---------------------------------------------------------------------------
  function drawForegroundFoliage() {
    if (!scenery) return;
    const W = view.W, H = view.H, S = view.scale;
    const span = W * 1.18;
    ctx.save();
    // Grounding shade so the courtyard settles into the frame.
    const base = ctx.createLinearGradient(0, H * 0.8, 0, H);
    base.addColorStop(0, 'rgba(2,5,7,0)');
    base.addColorStop(0.6, 'rgba(2,5,7,0.18)');
    base.addColorStop(1, 'rgba(1,3,5,0.6)');
    ctx.fillStyle = base;
    ctx.fillRect(0, H * 0.8, W, H * 0.2);

    for (const r of scenery.foregroundReeds) {
      const x = ((r.nx * span - G.cam.x * 0.045 * S) % span + span) % span - W * 0.09;
      if (x < -90 || x > W + 90) continue;
      const h = r.h * S;
      const sway = Math.sin(G.time * 0.5 + r.phase) * 6 * S;
      ctx.save();
      ctx.translate(x, H + 6);
      ctx.rotate(r.lean * 0.12);
      ctx.lineCap = 'round';
      for (let i = 0; i < r.blades; i++) {
        const spread = (i - (r.blades - 1) / 2) * 9 * S;
        const bh = h * (0.62 + ((i * 7) % 5) * 0.09);
        const bend = spread * 0.5 + sway * (0.5 + (i % 3) * 0.28);
        ctx.strokeStyle = i === 0 ? 'rgba(37,65,48,0.5)' : 'rgba(3,8,7,0.92)';
        ctx.lineWidth = (i === 0 ? 0.7 : r.width) * S;
        ctx.beginPath();
        ctx.moveTo(spread * 0.25, 2);
        ctx.quadraticCurveTo(spread * 0.2 + bend * 0.35, -bh * 0.55, bend, -bh);
        ctx.stroke();
        if (i === 0) {
          ctx.strokeStyle = 'rgba(104,139,104,0.14)';
          ctx.lineWidth = 0.7 * S;
          ctx.beginPath();
          ctx.moveTo(spread * 0.25, 0);
          ctx.quadraticCurveTo(spread * 0.2 + bend * 0.35, -bh * 0.55, bend, -bh);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // near-black stones that frame the lower corners
    const stones = [
      { x: W * 0.035, y: H * 0.965, rx: 115, ry: 30 },
      { x: W * 0.97, y: H * 0.99, rx: 145, ry: 38 },
      { x: W * 0.12, y: H * 0.995, rx: 180, ry: 42 }
    ];
    for (const s of stones) {
      ctx.save();
      ctx.translate(s.x, s.y);
      const g = ctx.createLinearGradient(0, -s.ry, 0, s.ry * 0.4);
      g.addColorStop(0, '#05090a');
      g.addColorStop(1, '#020405');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(93,111,106,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, -2, s.rx * 0.96, s.ry * 0.7, 0, Math.PI * 1.06, Math.PI * 1.88);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawForegroundFog() {
    const W = view.W, H = view.H, S = view.scale;
    ctx.save();
    const g = ctx.createLinearGradient(0, H * 0.72, 0, H);
    g.addColorStop(0, 'rgba(7,12,16,0)');
    g.addColorStop(0.55, 'rgba(6,10,13,0.22)');
    g.addColorStop(1, 'rgba(3,5,8,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const x = ((G.time * (8 + i * 4) + i * 360) % (W + 700)) - 350;
      const y = H * (0.67 + i * 0.07);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 300 * S);
      gr.addColorStop(0, 'rgba(100,123,132,0.025)');
      gr.addColorStop(1, 'rgba(70,91,106,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(x, y, 300 * S, 60 * S, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------
  Object.assign(window, {
    buildScenery, updateScenery, drawSky, drawGround, drawBamboo,
    drawForegroundFoliage, drawForegroundFog, drawAmbient, drawLantern
  });
})();
