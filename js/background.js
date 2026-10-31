/* ============================================================
   TIME REWIND — procedural skyline + parallax atmosphere
   ============================================================ */

const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export class Background {
  constructor(level) {
    this.level = level;
    this.palette = level.palette;
    this.seed = hashString(level.id);
    const rand = rng(this.seed);
    this.stars = Array.from({ length: 150 }, () => ({
      x: rand() * 1540 - 130,
      y: rand() * 470,
      r: rand() * 1.4 + 0.3,
      a: rand() * .55 + .15,
      tw: rand() * TAU,
      speed: rand() * 1.5 + .4
    }));
    this.motes = Array.from({ length: 45 }, () => ({
      x: rand() * 1560 - 140,
      y: rand() * 690,
      r: rand() * 2.2 + .4,
      a: rand() * .22 + .04,
      speed: rand() * 10 + 3,
      drift: rand() * 12 - 6,
      phase: rand() * TAU
    }));
    this.layers = [
      this.makeCity(rand, 'far', -160, 1560, 46, 112, 450, 120, 0.15),
      this.makeCity(rand, 'mid', -160, 1560, 70, 160, 390, 180, 0.28),
      this.makeCity(rand, 'near', -160, 1560, 90, 210, 500, 220, 0.45)
    ];
    this.neon = Array.from({ length: 16 }, () => ({
      x: rand() * 1400 - 60,
      y: 440 + rand() * 170,
      w: rand() * 38 + 9,
      h: rand() * 3 + 1,
      color: rand() > .55 ? this.palette.accent : this.palette.accent2,
      phase: rand() * TAU
    }));
    this.rays = Array.from({ length: 5 }, (_, i) => ({
      x: 180 + i * 255 + rand() * 70,
      w: 80 + rand() * 160,
      a: rand() * .035 + .012,
      phase: rand() * TAU
    }));
  }

  makeCity(rand, layer, from, to, minW, maxW, minTop, heightRange, parallax) {
    const buildings = [];
    let x = from;
    while (x < to) {
      const w = minW + rand() * (maxW - minW);
      const top = minTop + rand() * heightRange;
      const body = {
        x, w, top,
        h: 760 - top,
        depth: rand(),
        antenna: rand() > .62 ? 10 + rand() * 42 : 0,
        roof: rand() > .55 ? Math.floor(rand() * 3) : 0,
        windows: [],
        signs: []
      };
      const cols = Math.max(1, Math.floor(w / 15));
      const rows = Math.max(2, Math.floor((720 - top) / 19));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rand() > .68) continue;
          body.windows.push({
            x: 7 + c * (w - 12) / cols,
            y: 16 + r * 18,
            w: 2.5 + rand() * 2.4,
            h: 3 + rand() * 3,
            a: rand() * .55 + .15,
            color: rand() > .82 ? this.palette.accent2 : this.palette.window
          });
        }
      }
      if (rand() > .78) {
        body.signs.push({
          x: 5 + rand() * Math.max(1, w - 20),
          y: 28 + rand() * 70,
          h: 3 + rand() * 4,
          w: 10 + rand() * 17,
          color: rand() > .5 ? this.palette.accent : this.palette.accent2
        });
      }
      buildings.push(body);
      x += w + rand() * 10 + 2;
    }
    return { buildings, parallax, layer };
  }

  draw(ctx, camX, viewW, time, reduced = false) {
    const p = this.palette;
    const sky = ctx.createLinearGradient(0, 0, 0, 726);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(0.48, p.skyMid);
    sky.addColorStop(0.82, p.skyBottom);
    sky.addColorStop(1, '#03050c');
    ctx.fillStyle = sky;
    ctx.fillRect(camX - 140, -20, viewW + 300, 770);

    // soft nebula blooms
    const neb = ctx.createRadialGradient(930 - camX * .06, 240, 10, 930 - camX * .06, 240, 480);
    neb.addColorStop(0, p.haze);
    neb.addColorStop(.52, p.haze.replace(/[\d.]+\)$/, '.035)'));
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(camX - 200, -60, viewW + 400, 800);

    // stars
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const x = s.x + camX * .93;
      const a = s.a * (0.68 + Math.sin(time * s.speed + s.tw) * .32);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.r > 1.15 ? p.accent : '#dbe7ff';
      ctx.beginPath();
      ctx.arc(x, s.y, s.r, 0, TAU);
      ctx.fill();
      if (s.r > 1.1) {
        ctx.globalAlpha = a * .23;
        ctx.beginPath();
        ctx.arc(x, s.y, s.r * 4.2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    this.drawPlanet(ctx, camX, time);

    // aurora ribbons
    if (!reduced) this.drawAurora(ctx, camX, viewW, time);

    // distant light shafts
    for (const r of this.rays) {
      const x = r.x + camX * .96;
      const g = ctx.createLinearGradient(x, 0, x + r.w, 700);
      g.addColorStop(0, `rgba(141,176,255,${r.a * (.7 + Math.sin(time * .3 + r.phase) * .3)})`);
      g.addColorStop(1, 'rgba(60,120,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + r.w, 0);
      ctx.lineTo(x + r.w * 2.3, 700);
      ctx.lineTo(x + r.w * .4, 700);
      ctx.closePath();
      ctx.fill();
    }

    // layered city
    for (const layer of this.layers) this.drawLayer(ctx, layer, camX, time);

    // horizon glow + fog
    const horizon = ctx.createLinearGradient(0, 480, 0, 720);
    horizon.addColorStop(0, 'rgba(0,0,0,0)');
    horizon.addColorStop(.55, p.haze);
    horizon.addColorStop(1, 'rgba(3,5,12,.84)');
    ctx.fillStyle = horizon;
    ctx.fillRect(camX - 80, 440, viewW + 160, 300);

    // neon signs
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const n of this.neon) {
      const x = n.x + camX * .55;
      ctx.globalAlpha = .35 + Math.sin(time * 1.2 + n.phase) * .18;
      ctx.fillStyle = n.color;
      ctx.fillRect(x, n.y, n.w, n.h);
      ctx.globalAlpha = .09;
      ctx.fillRect(x - 3, n.y - 4, n.w + 6, n.h + 8);
    }
    ctx.restore();

    // floating dust motes
    ctx.save();
    for (const m of this.motes) {
      const x = m.x + camX * .9 + Math.sin(time * .18 + m.phase) * 13;
      const y = (m.y - time * m.speed * .25 + 720) % 740;
      ctx.globalAlpha = m.a * (.6 + Math.sin(time + m.phase) * .4);
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // foreground mist
    const mist = ctx.createLinearGradient(0, 590, 0, 740);
    mist.addColorStop(0, 'rgba(4,8,20,0)');
    mist.addColorStop(.7, 'rgba(4,8,20,.34)');
    mist.addColorStop(1, 'rgba(3,5,12,.72)');
    ctx.fillStyle = mist;
    ctx.fillRect(camX - 100, 580, viewW + 200, 170);
  }

  drawPlanet(ctx, camX, time) {
    const p = this.palette;
    const px = 1010 + camX * .93;
    const py = 146;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(px, py, 12, px, py, 160);
    halo.addColorStop(0, p.accent + '30');
    halo.addColorStop(.45, p.haze);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(px, py, 160, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    const grad = ctx.createLinearGradient(px - 70, py - 70, px + 80, py + 80);
    grad.addColorStop(0, '#d9edff');
    grad.addColorStop(.22, p.accent);
    grad.addColorStop(.6, '#3142a8');
    grad.addColorStop(1, '#0d1135');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 76, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = .28;
    ctx.fillStyle = p.accent2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(px - 10, py + (i - 1) * 25, 70, 13, -.2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = .42;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(px, py, 128, 25, -.33, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = .16;
    ctx.beginPath();
    ctx.ellipse(px, py, 154, 35, -.33, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  drawAurora(ctx, camX, viewW, time) {
    const p = this.palette;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let band = 0; band < 3; band++) {
      const y = 150 + band * 78 + Math.sin(time * .22 + band) * 19;
      const g = ctx.createLinearGradient(camX, y - 70, camX + viewW, y + 80);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(.3, p.accent + '10');
      g.addColorStop(.55, p.accent2 + '12');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 36 + band * 13;
      ctx.globalAlpha = .17;
      ctx.beginPath();
      for (let x = camX - 100; x <= camX + viewW + 100; x += 38) {
        const yy = y + Math.sin(x * .0032 + time * .34 + band * 1.7) * 42 + Math.sin(x * .0011 - time * .18) * 25;
        if (x === camX - 100) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLayer(ctx, layer, camX, time) {
    const p = this.palette;
    const colors = { far: p.far, mid: p.mid, near: p.near };
    const offset = camX * (1 - layer.parallax);
    ctx.save();
    ctx.translate(offset, 0);
    for (const b of layer.buildings) {
      ctx.fillStyle = colors[layer.layer];
      ctx.fillRect(b.x, b.top, b.w, b.h);
      ctx.fillStyle = layer.layer === 'far' ? 'rgba(160,190,255,.055)' : 'rgba(190,215,255,.09)';
      ctx.fillRect(b.x, b.top, b.w, 1);
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      ctx.fillRect(b.x + 2, b.top + 2, 1, b.h - 2);
      if (b.antenna) {
        ctx.fillStyle = colors[layer.layer];
        ctx.fillRect(b.x + b.w * .5, b.top - b.antenna, 1.5, b.antenna);
        ctx.fillStyle = p.accent2;
        ctx.globalAlpha = .45 + Math.sin(time * 2 + b.x) * .22;
        ctx.fillRect(b.x + b.w * .5 - 1, b.top - b.antenna, 3, 2);
        ctx.globalAlpha = 1;
      }
      if (b.roof === 1) {
        ctx.fillStyle = colors[layer.layer];
        ctx.fillRect(b.x + b.w * .18, b.top - 13, b.w * .28, 13);
      } else if (b.roof === 2) {
        ctx.fillStyle = colors[layer.layer];
        ctx.fillRect(b.x + b.w * .55, b.top - 20, 2, 20);
      }
      for (const w of b.windows) {
        ctx.globalAlpha = w.a * (layer.layer === 'near' ? .72 : .5);
        ctx.fillStyle = w.color;
        ctx.fillRect(b.x + w.x, b.top + w.y, w.w, w.h);
      }
      ctx.globalAlpha = 1;
      for (const s of b.signs) {
        ctx.globalAlpha = .35 + Math.sin(time * .8 + s.y) * .15;
        ctx.fillStyle = s.color;
        ctx.fillRect(b.x + s.x, b.top + s.y, s.w, s.h);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  /* Menu-only monument: a vast broken chrono ring on the horizon. */
  drawMenuMonument(ctx, time) {
    const cx = 960;
    const cy = 356;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 340);
    halo.addColorStop(0, 'rgba(87,242,255,.10)');
    halo.addColorStop(.55, 'rgba(109,96,255,.045)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, 340, 0, TAU); ctx.fill();
    for (let ring = 0; ring < 4; ring++) {
      ctx.strokeStyle = ring % 2 ? 'rgba(255,95,205,.16)' : 'rgba(87,242,255,.2)';
      ctx.lineWidth = ring === 0 ? 1.5 : 1;
      ctx.setLineDash(ring === 1 ? [2, 9] : ring === 2 ? [34, 16] : []);
      ctx.beginPath();
      ctx.arc(cx, cy, 180 + ring * 48, time * (.03 + ring * .012), time * (.03 + ring * .012) + TAU * (.68 + ring * .04));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // broken arch shards
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * TAU + time * .014;
      const r = 310 + Math.sin(i * 2.1) * 30;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * .58;
      ctx.globalAlpha = .12 + (i % 4) * .025;
      ctx.fillStyle = i % 3 ? '#8ddfff' : '#ff79d4';
      ctx.fillRect(x, y, 2, 9);
    }
    ctx.restore();
  }
}
