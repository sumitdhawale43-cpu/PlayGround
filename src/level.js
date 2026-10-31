import { TAU, clamp, lerp, mulberry32, rand } from "./util.js";

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 620;
export const WORLD_W = 12200;

export const ZONES = [
  { id: 0, x0: 0, x1: 3260, name: "NEON DISTRICT", sub: "INFILTRATE THE SPIRE", label: "01", palette: { top: "#05020f", mid: "#1a0a34", glow: "#ff3fce", accent: "#5df7ff", haze: "#3d1b5e" } },
  { id: 1, x0: 3260, x1: 7480, name: "GHOST MARKET", sub: "CUT THROUGH THE MACHINES", label: "02", palette: { top: "#020a12", mid: "#062838", glow: "#5df7ff", accent: "#ff3fce", haze: "#0d4050" } },
  { id: 2, x0: 7480, x1: 10480, name: "SPIRE ASCENT", sub: "CLIMB TOWARD THE SIGNAL", label: "03", palette: { top: "#080414", mid: "#210b38", glow: "#8a5cff", accent: "#ffc36b", haze: "#341455" } },
  { id: 3, x0: 10480, x1: WORLD_W, name: "ZERO SPIRE", sub: "CUT THE HEAD OFF THE CITY", label: "04", palette: { top: "#0d0208", mid: "#2a0712", glow: "#ff3e62", accent: "#ffc36b", haze: "#4d0d19" } },
];

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function mixRgb(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return {
    r: Math.round(lerp(A.r, B.r, t)),
    g: Math.round(lerp(A.g, B.g, t)),
    b: Math.round(lerp(A.b, B.b, t)),
  };
}
function css(c, a = 1) { return `rgba(${c.r},${c.g},${c.b},${a})`; }

export class Background {
  constructor() {
    this.layers = [];
    this.time = 0;
    this.camera = 0;
    this.flash = 0;
    this.nextLightning = 9;
    this.cars = [];
    this.rain = [];
    this.stars = [];
    this.dust = [];
    this.billboards = [
      { x: 360, y: 228, w: 156, h: 210, text: "NEO KYOTO", color: "#ff3fce", speed: 0.31, vertical: true },
      { x: 1450, y: 190, w: 210, h: 120, text: "零 // ZERO", color: "#5df7ff", speed: 0.18, vertical: false },
      { x: 2400, y: 250, w: 120, h: 190, text: "RONIN", color: "#8a5cff", speed: 0.25, vertical: true },
    ];
    this.build();
    this.seedDynamic();
  }

  build() {
    const rng = mulberry32(0xC0FFEE);
    const make = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      return c;
    };
    const neonText = (g, text, x, y, size, color, alpha = 0.85, vertical = false) => {
      g.save();
      g.globalAlpha = alpha;
      g.font = `700 ${size}px "DejaVu Sans Mono", monospace`;
      g.fillStyle = color;
      g.shadowColor = color;
      g.shadowBlur = size * 0.9;
      if (vertical) {
        for (let i = 0; i < text.length; i++) g.fillText(text[i], x, y + i * (size + 3));
      } else {
        g.fillText(text, x, y);
      }
      g.globalAlpha = alpha * 0.55;
      g.fillStyle = "#ffffff";
      if (vertical) {
        for (let i = 0; i < text.length; i++) g.fillText(text[i], x, y + i * (size + 3));
      } else {
        g.fillText(text, x, y);
      }
      g.restore();
    };

    // FAR SKYLINE ---------------------------------------------------------
    const far = make(2000, 720);
    const f = far.getContext("2d");
    let x = -20;
    while (x < 2020) {
      const w = 32 + rng() * 96;
      const h = 100 + rng() * 250;
      const y = 720 - h;
      const fg = f.createLinearGradient(x, y, x, 720);
      fg.addColorStop(0, "#0a0720");
      fg.addColorStop(1, "#050411");
      f.fillStyle = fg;
      f.fillRect(x, y, w, h);
      if (rng() > 0.42) {
        f.fillStyle = "#08061a";
        f.fillRect(x + w * 0.45, y - 24 - rng() * 55, 2, 55 + rng() * 30);
        f.fillStyle = "rgba(255,80,120,0.5)";
        f.fillRect(x + w * 0.45 - 1, y - 26 - rng() * 20, 3, 2);
      }
      if (rng() > 0.7) {
        f.fillStyle = "rgba(138,92,255,0.14)";
        f.fillRect(x + 4, y + 8, w - 8, 2);
      }
      // faint elongated window rows
      for (let i = 0; i < 8; i++) {
        if (rng() > 0.7) {
          f.fillStyle = rng() > 0.5 ? "rgba(120,190,240,0.16)" : "rgba(230,90,190,0.11)";
          f.fillRect(x + 3 + rng() * (w - 6), y + 12 + rng() * (h - 20), 2, 2);
        }
      }
      x += w + 3 + rng() * 16;
    }
    this.layers.push({ canvas: far, factor: 0.035, y: 0 });

    // MID SKYLINE ---------------------------------------------------------
    const mid = make(2400, 720);
    const m = mid.getContext("2d");
    x = -40;
    while (x < 2420) {
      const w = 72 + rng() * 155;
      const h = 160 + rng() * 300;
      const y = 720 - h;
      const bg = m.createLinearGradient(x, y, x + w * 0.4, 720);
      bg.addColorStop(0, "#0c0924");
      bg.addColorStop(0.55, "#090720");
      bg.addColorStop(1, "#060414");
      m.fillStyle = bg;
      m.fillRect(x, y, w, h);
      m.fillStyle = "rgba(151,132,255,0.16)";
      m.fillRect(x, y, w, 2);
      m.fillStyle = "rgba(5,4,16,0.7)";
      m.fillRect(x + w - 4, y, 4, h);
      // rooftop structures
      if (rng() > 0.28) {
        const rw = w * (0.18 + rng() * 0.32);
        const rh = 12 + rng() * 28;
        m.fillStyle = "#08061a";
        m.fillRect(x + w * 0.2, y - rh, rw, rh + 2);
        m.fillStyle = "rgba(93,247,255,0.15)";
        m.fillRect(x + w * 0.2, y - rh, rw, 1);
      }
      if (rng() > 0.42) {
        m.fillStyle = "#0e0b26";
        m.fillRect(x + w * 0.65, y - 42 - rng() * 52, 2.5, 100);
        m.fillStyle = "rgba(255,62,98,0.75)";
        m.fillRect(x + w * 0.65 - 1, y - 44 - rng() * 24, 4.5, 2.5);
      }
      // skybridge
      if (rng() > 0.8) {
        const by = y + 40 + rng() * 90;
        m.fillStyle = "rgba(6,5,17,0.85)";
        m.fillRect(x + w, by, 100 + rng() * 120, 8);
        m.fillStyle = "rgba(255,195,107,0.18)";
        m.fillRect(x + w, by, 100, 1);
      }
      // vertical neon strips
      if (rng() > 0.5) {
        m.fillStyle = rng() > 0.5 ? "rgba(93,247,255,0.28)" : "rgba(255,63,206,0.24)";
        m.fillRect(x + 5, y + 14, 2, h * 0.42);
      }
      // windows
      if (rng() > 0.32) {
        const cols = Math.max(2, Math.floor(w / 17));
        const rows = Math.max(3, Math.floor(h / 23));
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if (rng() > 0.62) {
              const warm = rng();
              m.fillStyle = warm > 0.84 ? "rgba(255,195,107,0.42)" : warm > 0.5 ? "rgba(93,247,255,0.28)" : "rgba(255,63,206,0.22)";
              m.fillRect(x + 8 + c * ((w - 14) / cols), y + 12 + r * ((h - 20) / rows), 2.4, 3.2);
            }
          }
        }
      }
      // rooftop sign
      if (rng() > 0.6) {
        const sc = rng() > 0.5 ? "#ff3fce" : "#5df7ff";
        neonText(m, ["BAR", "24H", "NEO", "SYNTH", "HOTEL", "OPEN"][Math.floor(rng() * 6)], x + 8, y - 22, 12 + rng() * 8, sc, 0.32 + rng() * 0.2);
      }
      x += w + 8 + rng() * 22;
    }
    // baked signs
    const signs = [
      { x: 300, y: 470, text: "RAMEN", col: "#ff3fce", size: 20 },
      { x: 1120, y: 390, text: "NIGHT//CITY", col: "#5df7ff", size: 17 },
      { x: 1690, y: 510, text: "CYBER", col: "#ffc36b", size: 24 },
      { x: 2120, y: 430, text: "OPEN", col: "#ff3fce", size: 15 },
    ];
    for (const s of signs) {
      m.save();
      m.translate(s.x, s.y);
      m.font = `700 ${s.size}px "DejaVu Sans Mono", monospace`;
      m.fillStyle = "rgba(4,3,12,0.9)";
      m.fillRect(-8, -s.size, s.text.length * s.size * 0.63 + 16, s.size * 1.55);
      m.strokeStyle = s.col + "55";
      m.strokeRect(-8, -s.size, s.text.length * s.size * 0.63 + 16, s.size * 1.55);
      m.shadowColor = s.col;
      m.shadowBlur = 18;
      m.fillStyle = s.col;
      m.fillText(s.text, 0, 0);
      m.globalAlpha = 0.7;
      m.fillStyle = "#fff";
      m.fillText(s.text, 0, 0);
      m.restore();
    }
    this.layers.push({ canvas: mid, factor: 0.11, y: 0 });

    // STREET-LEVEL STOREFRONTS -------------------------------------------
    const street = make(2400, 720);
    const st = street.getContext("2d");
    x = -20;
    while (x < 2420) {
      const w = 130 + rng() * 130;
      const top = 470 + rng() * 80;
      const g = st.createLinearGradient(x, top, x, 720);
      g.addColorStop(0, "#080612");
      g.addColorStop(1, "#030208");
      st.fillStyle = g;
      st.fillRect(x, top, w, 720 - top);
      // top trim
      st.fillStyle = rng() > 0.5 ? "rgba(93,247,255,0.28)" : "rgba(255,63,206,0.25)";
      st.fillRect(x, top, w, 2);
      // windows / shopfront
      const lit = rng() > 0.25;
      const wc = lit ? (rng() > 0.5 ? "#ffc36b" : "#5df7ff") : "#21142e";
      const wy = top + 38 + rng() * 18;
      st.fillStyle = "rgba(4,3,12,0.9)";
      st.fillRect(x + 14, wy, w - 28, 52 + rng() * 20);
      st.fillStyle = wc;
      st.globalAlpha = lit ? 0.16 + rng() * 0.13 : 0.06;
      st.fillRect(x + 18, wy + 4, w - 36, 44 + rng() * 16);
      st.globalAlpha = 1;
      st.strokeStyle = wc + "44";
      st.strokeRect(x + 14, wy, w - 28, 52);
      // window mullions
      for (let k = 1; k < 4; k++) {
        st.fillStyle = "rgba(3,2,8,0.75)";
        st.fillRect(x + 14 + k * (w - 28) / 4, wy, 2, 52);
      }
      // awning
      const ac = rng() > 0.5 ? "#ff3fce" : "#5df7ff";
      st.fillStyle = "rgba(5,4,12,0.92)";
      st.beginPath();
      st.moveTo(x + 6, wy - 10);
      st.lineTo(x + w - 6, wy - 10);
      st.lineTo(x + w - 16, wy);
      st.lineTo(x + 16, wy);
      st.closePath();
      st.fill();
      st.fillStyle = ac;
      st.globalAlpha = 0.5;
      st.fillRect(x + 16, wy - 3, w - 32, 2);
      st.globalAlpha = 1;
      // hanging lanterns
      if (rng() > 0.45) {
        for (let k = 0; k < 2 + Math.floor(rng() * 3); k++) {
          const lx = x + 24 + k * ((w - 48) / 3);
          st.strokeStyle = "rgba(10,8,20,0.8)";
          st.beginPath(); st.moveTo(lx, wy - 10); st.lineTo(lx, wy + 2); st.stroke();
          st.globalAlpha = 0.5;
          st.shadowColor = ac;
          st.shadowBlur = 12;
          st.fillStyle = ac;
          st.beginPath(); st.arc(lx, wy + 6, 3.2, 0, TAU); st.fill();
          st.shadowBlur = 0;
          st.globalAlpha = 1;
        }
      }
      // vertical sign
      if (rng() > 0.45) {
        const txt = ["BAR", "HOTEL", "NOODLE", "SYNTH", "DOJO", "24H"][Math.floor(rng() * 6)];
        const sc = rng() > 0.5 ? "#ff3fce" : "#5df7ff";
        st.fillStyle = "rgba(5,3,12,0.9)";
        st.fillRect(x + w - 26, top + 60, 18, txt.length * 15 + 12);
        st.strokeStyle = sc + "66";
        st.strokeRect(x + w - 26, top + 60, 18, txt.length * 15 + 12);
        neonText(st, txt, x + w - 22, top + 78, 10, sc, 0.8, true);
      }
      // doorway
      st.fillStyle = "#030208";
      st.fillRect(x + w * 0.5 - 14, 600, 28, 24);
      st.fillStyle = "rgba(255,195,107,0.35)";
      st.fillRect(x + w * 0.5 - 14, 600, 28, 1);
      x += w + 22 + rng() * 58;
    }
    this.layers.push({ canvas: street, factor: 0.19, y: 0, alpha: 0.9 });

    // NEAR SKYLINE --------------------------------------------------------
    const near = make(2600, 720);
    const n = near.getContext("2d");
    x = -60;
    while (x < 2620) {
      const w = 145 + rng() * 210;
      const h = 190 + rng() * 330;
      const y = 720 - h;
      const g = n.createLinearGradient(x, y, x + w, 720);
      g.addColorStop(0, "#090718");
      g.addColorStop(0.4, "#060513");
      g.addColorStop(1, "#030208");
      n.fillStyle = g;
      n.fillRect(x, y, w, h);
      // facade panel lines
      n.strokeStyle = "rgba(120,100,190,0.07)";
      n.lineWidth = 1;
      n.strokeRect(x + 3, y + 3, w - 6, h);
      for (let row = 0; row < Math.floor(h / 54); row++) {
        n.fillStyle = "rgba(4,3,12,0.45)";
        n.fillRect(x, y + 30 + row * 54, w, 1);
      }
      // top edge + rooftop lights
      n.fillStyle = "rgba(93,247,255,0.13)";
      n.fillRect(x, y, w, 1.5);
      if (rng() > 0.4) {
        n.fillStyle = "#0b0919";
        n.fillRect(x + w * 0.15, y - 18 - rng() * 20, w * 0.25, 20 + rng() * 20);
        n.fillStyle = "rgba(255,63,206,0.4)";
        n.fillRect(x + w * 0.16, y - 19 - rng() * 0, 5, 2);
      }
      // windows dense
      const cols = Math.max(3, Math.floor(w / 24));
      const rows = Math.max(4, Math.floor(h / 34));
      for (let c = 0; c < cols; c++) {
        for (let r = 1; r < rows; r++) {
          if (rng() > 0.58) {
            const warm = rng();
            n.fillStyle = warm > 0.85 ? "rgba(255,195,107,0.4)" : warm > 0.55 ? "rgba(93,247,255,0.22)" : warm > 0.3 ? "rgba(255,63,206,0.19)" : "rgba(70,60,120,0.14)";
            const ww = 3 + rng() * 4;
            n.fillRect(x + 10 + c * ((w - 20) / cols), y + 16 + r * ((h - 30) / rows), ww, 2.5 + rng() * 2);
          }
        }
      }
      // vertical neon strip / giant sign
      if (rng() > 0.46) {
        const sc = rng() > 0.5 ? "#ff3fce" : "#5df7ff";
        n.fillStyle = "rgba(3,2,8,0.75)";
        n.fillRect(x + w * 0.75, y + 35, 24, Math.min(230, h * 0.55));
        n.strokeStyle = sc + "55";
        n.strokeRect(x + w * 0.75, y + 35, 24, Math.min(230, h * 0.55));
        neonText(n, ["影", "NEO", "斬", "RONIN", "夜", "ZERO"][Math.floor(rng() * 6)], x + w * 0.75 + 5, y + 58, 13, sc, 0.7, true);
      }
      // billboard block
      if (rng() > 0.55) {
        const bw = w * 0.45, bh = 50 + rng() * 40;
        const bx = x + 12, by = y + 70 + rng() * 60;
        n.fillStyle = "rgba(7,5,18,0.9)";
        n.fillRect(bx, by, bw, bh);
        n.globalAlpha = 0.13;
        n.fillStyle = rng() > 0.5 ? "#5df7ff" : "#ff3fce";
        n.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
        n.globalAlpha = 1;
        n.strokeStyle = "rgba(93,247,255,0.14)";
        n.strokeRect(bx, by, bw, bh);
      }
      // ledges
      for (let k = 1; k < 4; k++) {
        const ly = y + (h / 4) * k;
        n.fillStyle = "rgba(4,3,10,0.9)";
        n.fillRect(x + w * 0.55, ly, w * 0.45, 4);
        n.fillStyle = "rgba(93,247,255,0.1)";
        n.fillRect(x + w * 0.55, ly, w * 0.45, 1);
      }
      x += w + 38 + rng() * 60;
    }
    this.layers.push({ canvas: near, factor: 0.3, y: 0, alpha: 0.92 });

    // FOREGROUND SILHOUETTES (low, edges) --------------------------------
    const fg = make(2000, 720);
    const g = fg.getContext("2d");
    g.fillStyle = "#030208";
    x = -50;
    while (x < 2050) {
      const w = 120 + rng() * 220;
      const h = 80 + rng() * 120;
      g.fillStyle = "#020106";
      g.fillRect(x, 720 - h, w, h);
      g.fillStyle = "rgba(2,1,6,0.85)";
      g.fillRect(x - 20, 720 - h + 20, w + 40, h);
      g.fillStyle = "rgba(93,247,255,0.1)";
      g.fillRect(x - 20, 720 - h + 20, w + 40, 1);
      x += w + 260 + rng() * 280;
    }
    this.layers.push({ canvas: fg, factor: 0.62, y: 0, alpha: 0.55 });
  }

  seedDynamic() {
    const rng = mulberry32(0xBEEF);
    for (let i = 0; i < 150; i++) {
      this.rain.push({
        x: rng() * VIEW_W, y: rng() * VIEW_H,
        len: 8 + rng() * 18, speed: 680 + rng() * 620, alpha: 0.06 + rng() * 0.2,
        layer: rng(),
      });
    }
    for (let i = 0; i < 90; i++) {
      this.stars.push({ x: rng() * 2400, y: rng() * 300, s: rng() * 1.4 + 0.3, p: rng() * TAU });
    }
    for (let i = 0; i < 5; i++) {
      this.cars.push({
        x: rng() * VIEW_W, y: 120 + rng() * 220, speed: 18 + rng() * 46,
        dir: rng() > 0.5 ? 1 : -1, size: 8 + rng() * 9, hue: rng() > 0.5 ? "#ff3fce" : "#5df7ff", trail: 0,
      });
    }
    for (let i = 0; i < 30; i++) {
      this.dust.push({
        x: rng() * VIEW_W, y: rng() * VIEW_H, s: rng() * 1.7 + 0.4,
        speed: 6 + rng() * 14, drift: rng() * 8 - 4, alpha: rng() * 0.22 + 0.05,
        color: rng() > 0.5 ? "#5df7ff" : "#ff3fce",
      });
    }
  }

  update(dt, cameraX) {
    this.time += dt;
    this.camera = cameraX;
    for (const d of this.rain) {
      d.y += d.speed * dt;
      d.x -= d.speed * 0.16 * dt;
      if (d.y > VIEW_H + 24) { d.y = -20; d.x = Math.random() * VIEW_W + 220; }
      if (d.x < -40) d.x += VIEW_W + 80;
    }
    for (const c of this.cars) {
      c.x += c.speed * c.dir * dt;
      if (c.x > VIEW_W + 160) c.x = -120;
      if (c.x < -160) c.x = VIEW_W + 120;
    }
    for (const d of this.dust) {
      d.y -= d.speed * dt;
      d.x += Math.sin(this.time * 0.3 + d.y * 0.01) * d.drift * dt;
      if (d.y < -20) { d.y = VIEW_H + 10; d.x = Math.random() * VIEW_W; }
    }
    this.nextLightning -= dt;
    if (this.nextLightning <= 0) {
      this.nextLightning = 9 + Math.random() * 14;
      this.flash = 0.55 + Math.random() * 0.35;
    }
    this.flash = Math.max(0, this.flash - dt * 2.2);
  }

  paletteFor(x) {
    const zi = Math.max(0, Math.min(ZONES.length - 1, ZONES.findIndex(z => x >= z.x0 && x < z.x1)));
    const i = zi === -1 ? ZONES.length - 1 : zi;
    const z = ZONES[i];
    const next = ZONES[Math.min(ZONES.length - 1, i + 1)];
    const blend = clamp((x - (z.x1 - 380)) / 380, 0, 1);
    const a = z.palette, b = next.palette;
    return {
      top: css(mixRgb(a.top, b.top, blend)),
      mid: css(mixRgb(a.mid, b.mid, blend)),
      glow: css(mixRgb(a.glow, b.glow, blend)),
      accent: css(mixRgb(a.accent, b.accent, blend)),
      haze: css(mixRgb(a.haze, b.haze, blend)),
      glowRaw: mixRgb(a.glow, b.glow, blend),
      accentRaw: mixRgb(a.accent, b.accent, blend),
    };
  }

  draw(ctx, cameraX, menu = false) {
    const pal = this.paletteFor(menu ? 420 : cameraX);
    const W = VIEW_W, H = VIEW_H;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, pal.top);
    sky.addColorStop(0.48, pal.mid);
    sky.addColorStop(0.78, pal.haze);
    sky.addColorStop(1, "#05030d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // horizon glow
    const hg = ctx.createRadialGradient(W * 0.56, H * 0.7, 20, W * 0.56, H * 0.7, W * 0.7);
    hg.addColorStop(0, `rgba(${pal.glowRaw.r},${pal.glowRaw.g},${pal.glowRaw.b},0.22)`);
    hg.addColorStop(0.4, `rgba(${pal.glowRaw.r},${pal.glowRaw.g},${pal.glowRaw.b},0.07)`);
    hg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.save();
    const starOff = (cameraX * 0.015) % 2400;
    for (const s of this.stars) {
      let sx = s.x - starOff;
      if (sx < -10) sx += 2400;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(this.time * 0.8 + s.p));
      ctx.globalAlpha = tw * 0.8;
      ctx.fillStyle = "#d9fbff";
      ctx.fillRect(sx, s.y, s.s, s.s);
    }
    ctx.restore();

    // moon / ringed planet
    const moonX = 1010 - (cameraX * 0.012 % 600);
    const moonY = 136;
    ctx.save();
    const halo = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 190);
    halo.addColorStop(0, "rgba(255,150,220,0.22)");
    halo.addColorStop(0.35, "rgba(150,120,255,0.10)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(moonX, moonY, 190, 0, TAU); ctx.fill();
    ctx.translate(moonX, moonY);
    ctx.rotate(-0.22);
    ctx.strokeStyle = "rgba(191,154,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 130, 28, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(255,114,210,0.18)";
    ctx.beginPath(); ctx.ellipse(0, 0, 150, 34, 0, 0, TAU); ctx.stroke();
    const body = ctx.createLinearGradient(-44, -44, 44, 44);
    body.addColorStop(0, "#f4d9ff");
    body.addColorStop(0.4, "#c48de0");
    body.addColorStop(0.7, "#6b4c99");
    body.addColorStop(1, "#26173f");
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, 53, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#2b1748";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(Math.sin(i * 2.1) * 26, Math.cos(i * 1.7) * 22, 5 + (i % 3) * 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // parallax skyline layers
    for (const layer of this.layers) {
      const lw = layer.canvas.width;
      const offset = ((cameraX * layer.factor) % lw + lw) % lw;
      ctx.save();
      ctx.globalAlpha = layer.alpha ?? 1;
      for (let i = -1; i < Math.ceil(W / lw) + 1; i++) {
        ctx.drawImage(layer.canvas, Math.round(-offset + i * lw), layer.y);
      }
      if (layer.factor < 0.3) {
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = pal.glow;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // holographic billboards
    for (const b of this.billboards) {
      let bx = b.x - ((cameraX * b.speed + this.time * 7) % 2900);
      if (bx < -300) bx += 2900;
      bx = ((bx + 300) % 2900) - 300;
      if (bx > W + 260) continue;
      this.drawBillboard(ctx, bx, b);
    }

    // flying cars
    for (const c of this.cars) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createLinearGradient(c.x - c.dir * 90, c.y, c.x, c.y);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, c.hue === "#ff3fce" ? "rgba(255,63,206,0.32)" : "rgba(93,247,255,0.32)");
      ctx.fillStyle = grad;
      ctx.fillRect(c.x - (c.dir > 0 ? 90 : -10), c.y - 1, 90, 2);
      ctx.shadowBlur = 14;
      ctx.shadowColor = c.hue;
      ctx.fillStyle = c.hue;
      ctx.fillRect(c.x - c.size / 2, c.y - 2, c.size, 2.5);
      ctx.fillStyle = "#fff";
      ctx.fillRect(c.x + c.dir * (c.size / 2) - 1, c.y - 1.5, 2, 1.5);
      ctx.restore();
    }

    // lightning flash
    if (this.flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = this.flash * 0.22;
      ctx.fillStyle = "#cfeaff";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // low fog bands
    ctx.save();
    const fog = ctx.createLinearGradient(0, 500, 0, 720);
    fog.addColorStop(0, "rgba(20,12,40,0)");
    fog.addColorStop(0.6, "rgba(20,12,40,0.32)");
    fog.addColorStop(1, "rgba(8,5,18,0.6)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 470, W, 250);
    ctx.restore();

    // floating embers
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const d of this.dust) {
      ctx.globalAlpha = d.alpha * (0.6 + 0.4 * Math.sin(this.time + d.y));
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // rain
    ctx.save();
    ctx.lineCap = "round";
    for (const d of this.rain) {
      ctx.globalAlpha = d.alpha;
      ctx.strokeStyle = d.layer > 0.7 ? "#b9d9ff" : "#6f9bb8";
      ctx.lineWidth = d.layer > 0.7 ? 1.15 : 0.7;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.18, d.y + d.len);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBillboard(ctx, x, b) {
    const glitch = Math.sin(this.time * 2.1 + b.x) > 0.96 ? 5 : 0;
    ctx.save();
    ctx.translate(x, b.y);
    ctx.globalAlpha = 0.82;
    // frame
    ctx.fillStyle = "rgba(5,4,15,0.55)";
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.strokeStyle = "rgba(93,247,255,0.16)";
    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    // scanlines
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = b.color;
    for (let y = -b.h / 2 + 4; y < b.h / 2; y += 5) ctx.fillRect(-b.w / 2 + 4, y, b.w - 8, 1);
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = b.color;
    if (b.vertical) {
      ctx.translate(-b.w / 2 + 28, -b.h / 2 + 22);
      ctx.font = '700 19px "DejaVu Sans Mono", monospace';
      const chars = b.text.split("");
      for (let i = 0; i < chars.length; i++) ctx.fillText(chars[i], (i % 2) * 14 + (i === 0 ? glitch : 0), i * 23);
    } else {
      ctx.textAlign = "center";
      ctx.font = '700 22px "DejaVu Sans Mono", monospace';
      ctx.fillText(b.text, glitch, 4);
      ctx.globalAlpha = 0.5;
      ctx.font = '400 8px "DejaVu Sans Mono", monospace';
      ctx.fillText("SIGNAL // ACTIVE", 0, 26);
    }
    ctx.restore();
  }
}

function makePlatform(x, y, w, h = 14, opts = {}) {
  return {
    x, y, w, h, baseX: x, baseY: y,
    type: opts.type ?? (h > 40 ? "ground" : "platform"),
    oneWay: opts.oneWay ?? h <= 20,
    moving: opts.moving ?? null,
    dx: 0, dy: 0,
    id: opts.id ?? Math.random().toString(36).slice(2),
  };
}

export class World {
  constructor() {
    this.time = 0;
    this.groundY = GROUND_Y;
    this.width = WORLD_W;
    this.respawn = { x: 150, y: GROUND_Y - 64 };
    this.platforms = [];
    this.hazards = [];
    this.orbs = [];
    this.checkpoints = [];
    this.enemies = [];
    this.arena = { x0: 10490, x1: 12160, trigger: 10650, center: 11325, active: false };
    this.gateOpen = false;
    this.build();
  }

  build() {
    // ground segments (safe concrete)
    const groundSegs = [
      [0, 1500], [1680, 3260], [3420, 5320], [5500, 7480], [7650, 10480], [10640, 12200],
    ];
    for (const [x0, x1] of groundSegs) {
      this.platforms.push(makePlatform(x0, GROUND_Y, x1 - x0, 140, { type: "ground" }));
    }
    // floating platforms
    const ps = [
      [520, 500, 180], [760, 410, 150], [1040, 500, 190],
      [1720, 495, 200], [2000, 400, 160], [2260, 510, 170], [2600, 430, 200],
      [3350, 500, 160], [3620, 410, 180], [3970, 500, 160], [4350, 440, 220],
      [4720, 340, 180], [5000, 470, 200],
      [5600, 500, 180], [5880, 400, 150],
      [6250, 480, 170], [6510, 380, 150], [6850, 500, 200], [7180, 420, 160],
      [7500, 330, 180], [7820, 470, 180],
      [8250, 500, 190], [8550, 400, 160], [8850, 500, 170], [9150, 420, 200], [9450, 340, 180],
      [10720, 500, 170], [11250, 450, 220], [11780, 500, 170],
    ];
    for (const [x, y, w] of ps) this.platforms.push(makePlatform(x, y, w, 14));
    // moving platforms
    this.platforms.push(makePlatform(5310, 525, 140, 14, {
      moving: { axis: "x", dist: 55, speed: 1.05, phase: 0 }, id: "mover1",
    }));
    this.platforms.push(makePlatform(6980, 460, 150, 14, {
      moving: { axis: "y", dist: 72, speed: 1.15, phase: 1.2 }, id: "mover2",
    }));

    this.hazards = [
      { type: "laser", x: 5650, y: 594, w: 120, h: 24, period: 2.3, onTime: 1.05, offset: 0.2, damage: 16 },
      { type: "laser", x: 8990, y: 594, w: 130, h: 24, period: 2.7, onTime: 1.15, offset: 1.5, damage: 18 },
      { type: "laser", x: 10920, y: 594, w: 100, h: 24, period: 3.2, onTime: 1.3, offset: 0.8, damage: 18 },
    ];

    // checkpoints
    this.checkpoints = [
      { id: 0, x: 2800, y: GROUND_Y, active: false },
      { id: 1, x: 6160, y: GROUND_Y, active: false },
      { id: 2, x: 8050, y: GROUND_Y, active: false },
      { id: 3, x: 9800, y: GROUND_Y, active: false },
      { id: 4, x: 10430, y: GROUND_Y, active: false },
    ];

    // collectible orbs (first wave + platform rewards + arena)
    const orbPositions = [
      [420, 555], [560, 452], [800, 362], [1080, 452], [1230, 555],
      [1760, 555], [2060, 352], [2320, 462], [2660, 382], [3010, 555],
      [3400, 555], [3680, 362], [4020, 452], [4460, 392], [4780, 292],
      [5060, 422], [5640, 452], [5940, 352],
      [6350, 555], [6560, 332], [6910, 452], [7240, 372], [7560, 282],
      [7870, 422], [8300, 452], [8600, 352], [8910, 452], [9210, 372], [9510, 292],
      [9880, 555], [10290, 555], [10830, 555], [11350, 402], [11830, 555],
    ];
    this.orbs = orbPositions.map(([x, y], i) => ({ x, y, r: 10, collected: false, phase: i * 0.7 }));
    this.orbTotal = this.orbs.length;

    // enemy roster
    this.enemies = [
      { type: "drone", x: 900, y: 315, zone: 0 },
      { type: "melee", x: 1270, y: GROUND_Y, zone: 0 },
      { type: "drone", x: 1940, y: 305, zone: 0 },
      { type: "melee", x: 2290, y: GROUND_Y, zone: 0 },
      { type: "gunner", x: 2670, y: 430, zone: 0 },
      { type: "melee", x: 3380, y: GROUND_Y, zone: 1 },
      { type: "drone", x: 3720, y: 300, zone: 1 },
      { type: "gunner", x: 4050, y: GROUND_Y, zone: 1 },
      { type: "melee", x: 4520, y: GROUND_Y, zone: 1 },
      { type: "drone", x: 4830, y: 300, zone: 1 },
      { type: "gunner", x: 5180, y: GROUND_Y, zone: 1 },
      { type: "melee", x: 5730, y: GROUND_Y, zone: 1 },
      { type: "melee", x: 6320, y: GROUND_Y, zone: 2 },
      { type: "drone", x: 6650, y: 290, zone: 2 },
      { type: "gunner", x: 6960, y: GROUND_Y, zone: 2 },
      { type: "melee", x: 7370, y: 420, zone: 2 },
      { type: "drone", x: 7720, y: 280, zone: 2 },
      { type: "gunner", x: 7990, y: GROUND_Y, zone: 2 },
      { type: "melee", x: 8400, y: GROUND_Y, zone: 2 },
      { type: "drone", x: 8720, y: 290, zone: 2 },
      { type: "gunner", x: 9020, y: GROUND_Y, zone: 2 },
      { type: "melee", x: 9340, y: GROUND_Y, zone: 2 },
      { type: "drone", x: 9660, y: 300, zone: 2 },
      { type: "melee", x: 9970, y: GROUND_Y, zone: 2, elite: true },
    ];
  }

  getZone(x) {
    if (x >= this.arena.x0) return ZONES[3];
    for (let i = ZONES.length - 1; i >= 0; i--) if (x >= ZONES[i].x0) return ZONES[i];
    return ZONES[0];
  }

  checkpointAt(x) {
    for (const cp of this.checkpoints) {
      if (!cp.active && Math.abs(x - cp.x) < 70) return cp;
    }
    return null;
  }

  activateCheckpoint(cp) {
    cp.active = true;
    this.respawn = { x: cp.x - 30, y: GROUND_Y - 64 };
  }

  update(dt) {
    this.time += dt;
    for (const p of this.platforms) {
      p.dx = 0; p.dy = 0;
      if (p.moving) {
        const oldX = p.x, oldY = p.y;
        const t = this.time * p.moving.speed + p.moving.phase;
        if (p.moving.axis === "x") p.x = p.baseX + Math.sin(t) * p.moving.dist;
        else p.y = p.baseY + Math.sin(t) * p.moving.dist;
        p.dx = p.x - oldX;
        p.dy = p.y - oldY;
      }
    }
  }

  hazardActive(h) {
    const t = (this.time + h.offset) % h.period;
    return t < h.onTime;
  }

  drawSkylineAccents(ctx, cameraX) {
    // giant faint glyph wall in the last sector
    const wx = 11000 - cameraX;
    if (wx > -400 && wx < VIEW_W + 400) {
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "#ff3e62";
      ctx.font = '900 300px "DejaVu Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("零", wx + 300, 520);
      ctx.restore();
    }
  }
}

// -------------------------------------------------------------------------
// Platform / environment rendering helpers
// -------------------------------------------------------------------------
const groundCache = new Map();

function getSurfacePattern(ctx, p, palette) {
  const key = `${p.id}-${p.w}`;
  if (groundCache.has(key)) return groundCache.get(key);
  const c = document.createElement("canvas");
  const scale = 1;
  c.width = Math.max(1, Math.ceil(p.w * scale));
  c.height = p.type === "ground" ? 140 : p.h;
  const g = c.getContext("2d");
  const rng = mulberry32(p.w * 17 + p.x * 3 + 11);
  if (p.type === "ground") {
    // wet asphalt body
    const grd = g.createLinearGradient(0, 0, 0, c.height);
    grd.addColorStop(0, "#232742");
    grd.addColorStop(0.08, "#171a2e");
    grd.addColorStop(0.26, "#101223");
    grd.addColorStop(0.62, "#0a0a17");
    grd.addColorStop(1, "#05040c");
    g.fillStyle = grd;
    g.fillRect(0, 0, c.width, c.height);

    // raised curb / walkway band
    const curb = g.createLinearGradient(0, 0, 0, 24);
    curb.addColorStop(0, "#2b3050");
    curb.addColorStop(0.35, "#1d2138");
    curb.addColorStop(1, "#121427");
    g.fillStyle = curb;
    g.fillRect(0, 0, c.width, 24);
    g.fillStyle = "rgba(190,240,255,0.34)";
    g.fillRect(0, 0, c.width, 1.4);
    g.fillStyle = "rgba(4,4,12,0.7)";
    g.fillRect(0, 23, c.width, 2);

    // curb expansion joints + bolts
    for (let x = 24; x < c.width; x += 68) {
      g.fillStyle = "rgba(4,5,14,0.55)";
      g.fillRect(x, 3, 1.4, 20);
      g.fillStyle = "rgba(93,247,255,0.16)";
      g.fillRect(x + 10, 9, 3, 1.4);
      g.fillStyle = "rgba(255,195,107,0.10)";
      g.fillRect(x + 44, 15, 12, 1.2);
    }

    // soft neon reflections bleeding down the wet surface
    g.save();
    g.globalCompositeOperation = "lighter";
    const tones = ["93,247,255", "255,63,206", "255,195,107", "138,92,255"];
    const streaks = Math.max(4, Math.floor(c.width / 105));
    for (let i = 0; i < streaks; i++) {
      const sx = 20 + rng() * (c.width - 40);
      const sw = 10 + rng() * 34;
      const sh = 34 + rng() * 84;
      const tone = tones[Math.floor(rng() * tones.length)];
      const sg = g.createLinearGradient(sx, 24, sx, 24 + sh);
      sg.addColorStop(0, `rgba(${tone},${0.13 + rng() * 0.09})`);
      sg.addColorStop(0.5, `rgba(${tone},${0.045 + rng() * 0.035})`);
      sg.addColorStop(1, `rgba(${tone},0)`);
      g.fillStyle = sg;
      g.fillRect(sx, 24, sw, sh);
    }
    g.restore();

    // puddles with rim light
    for (let i = 0; i < Math.max(1, Math.floor(c.width / 260)); i++) {
      const px = 20 + rng() * (c.width - 40);
      const py = 32 + rng() * 34;
      const pr = 22 + rng() * 42;
      const pg = g.createRadialGradient(px, py, 1, px, py, pr);
      pg.addColorStop(0, "rgba(150,220,255,0.13)");
      pg.addColorStop(0.55, "rgba(90,140,200,0.06)");
      pg.addColorStop(1, "rgba(40,60,110,0)");
      g.fillStyle = pg;
      g.beginPath();
      g.ellipse(px, py, pr, pr * 0.2, 0, 0, TAU);
      g.fill();
      g.strokeStyle = "rgba(155,230,255,0.13)";
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(px, py, pr * 0.72, pr * 0.148, 0, 0, TAU);
      g.stroke();
    }

    // dashed lane marking further down
    g.fillStyle = "rgba(255,195,107,0.11)";
    for (let x = 10; x < c.width; x += 78) g.fillRect(x, 82, 38, 2.4);
    g.fillStyle = "rgba(93,247,255,0.07)";
    for (let x = 40; x < c.width; x += 78) g.fillRect(x, 96, 22, 1.2);

    // panel seams
    g.strokeStyle = "rgba(120,170,210,0.075)";
    g.lineWidth = 1;
    const step = 86;
    for (let x = 0; x < c.width; x += step) {
      g.beginPath(); g.moveTo(x, 24); g.lineTo(x - 8, c.height); g.stroke();
    }
    for (let y = 45; y < c.height; y += 42) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke();
    }

    // tech grates / utility plates
    for (let i = 0; i < Math.floor(c.width / 80); i++) {
      const gx = rng() * (c.width - 74), gy = 40 + rng() * 58;
      const gw = 30 + rng() * 44;
      g.fillStyle = "rgba(3,4,10,0.72)";
      g.fillRect(gx, gy, gw, 10);
      g.strokeStyle = "rgba(93,247,255,0.09)";
      g.strokeRect(gx + 0.5, gy + 0.5, gw, 9);
      g.fillStyle = "rgba(93,247,255,0.10)";
      for (let k = 0; k < 5; k++) g.fillRect(gx + 4 + k * 7, gy + 2.5, 2, 5);
    }

    // specular grit
    for (let i = 0; i < Math.floor(c.width / 24); i++) {
      g.fillStyle = rng() > 0.6 ? "rgba(190,235,255,0.10)" : "rgba(255,63,206,0.06)";
      g.fillRect(rng() * c.width, 26 + rng() * 90, 1 + rng() * 2, 1);
    }
  }
  groundCache.set(key, c);
  return c;
}

export function drawPlatform(ctx, p, time, palette) {
  if (p.type === "ground") {
    const pattern = getSurfacePattern(ctx, p, palette);
    ctx.drawImage(pattern, p.x, p.y);

    // ambient bloom rising off the wet street
    const bloom = ctx.createLinearGradient(0, p.y - 26, 0, p.y + 34);
    bloom.addColorStop(0, "rgba(0,0,0,0)");
    bloom.addColorStop(0.42, palette.glowRaw ? `rgba(${palette.glowRaw.r},${palette.glowRaw.g},${palette.glowRaw.b},0.09)` : "rgba(93,247,255,0.08)");
    bloom.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(p.x, p.y - 26, p.w, 60);

    // top neon trim
    const trim = palette.glow;
    const trim2 = palette.accent;
    ctx.save();
    ctx.shadowColor = trim;
    ctx.shadowBlur = 20;
    const tg = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    tg.addColorStop(0, trim);
    tg.addColorStop(0.5, trim2);
    tg.addColorStop(1, trim);
    ctx.fillStyle = tg;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(p.x, p.y - 2, p.w, 2);
    ctx.globalAlpha = 0.22;
    ctx.fillRect(p.x, p.y + 2, p.w, 6);
    ctx.restore();

    // travelling wet sheen along the curb
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, 34);
    ctx.clip();
    const sweepX = p.x + ((time * 120) % (p.w + 520)) - 260;
    const sheen = ctx.createLinearGradient(sweepX, 0, sweepX + 240, 0);
    sheen.addColorStop(0, "rgba(180,245,255,0)");
    sheen.addColorStop(0.5, "rgba(190,250,255,0.09)");
    sheen.addColorStop(1, "rgba(180,245,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(sweepX, p.y + 3, 240, 26);
    ctx.restore();

    // curb face shadow under the lip
    ctx.fillStyle = "rgba(2,2,8,0.45)";
    ctx.fillRect(p.x, p.y + 24, p.w, 3);

    // edge caps
    ctx.fillStyle = "#0a0917";
    ctx.fillRect(p.x - 8, p.y, 8, 40);
    ctx.fillRect(p.x + p.w, p.y, 8, 40);
    ctx.strokeStyle = "rgba(93,247,255,0.24)";
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y); ctx.lineTo(p.x - 8, p.y + 40);
    ctx.moveTo(p.x + p.w + 8, p.y); ctx.lineTo(p.x + p.w + 8, p.y + 40);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,63,206,0.5)";
    ctx.fillRect(p.x - 8, p.y, 3, 2);
    ctx.fillRect(p.x + p.w + 5, p.y, 3, 2);
  } else {
    // floating platform
    ctx.save();
    ctx.translate(p.x, p.y);
    const h = Math.max(14, p.h);
    const grd = ctx.createLinearGradient(0, 0, 0, h + 22);
    grd.addColorStop(0, "#1a1b33");
    grd.addColorStop(0.5, "#0d0d1d");
    grd.addColorStop(1, "#05040c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, p.w, h + 14);
    // angled underside
    ctx.fillStyle = "#07060f";
    ctx.beginPath();
    ctx.moveTo(8, h + 14);
    ctx.lineTo(p.w - 8, h + 14);
    ctx.lineTo(p.w - 34, h + 32);
    ctx.lineTo(34, h + 32);
    ctx.closePath();
    ctx.fill();
    // top edge
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, p.w, 1.5);
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 2, p.w, 3);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    // panel details
    ctx.strokeStyle = "rgba(93,247,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(12, 5); ctx.lineTo(p.w - 12, 5);
    ctx.stroke();
    const lights = Math.max(2, Math.floor(p.w / 55));
    for (let i = 0; i < lights; i++) {
      const lx = 20 + i * ((p.w - 40) / Math.max(1, lights - 1));
      const glow = 0.35 + 0.25 * Math.sin(time * 2 + i * 1.7 + p.x);
      ctx.fillStyle = i % 3 === 0 ? "#ff3fce" : palette.accent;
      ctx.globalAlpha = glow;
      ctx.fillRect(lx, h + 5, 3, 2);
    }
    // side brackets
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#101126";
    ctx.fillRect(-3, 3, 4, h + 10);
    ctx.fillRect(p.w - 1, 3, 4, h + 10);
    ctx.restore();
  }
}

export function drawHazard(ctx, h, active, time) {
  ctx.save();
  ctx.translate(h.x, h.y);
  // emitter posts
  ctx.fillStyle = "#0e0b1a";
  ctx.fillRect(-10, -3, 10, h.h + 6);
  ctx.fillRect(h.w, -3, 10, h.h + 6);
  ctx.strokeStyle = "rgba(255,62,98,0.4)";
  ctx.strokeRect(-10, -3, 10, h.h + 6);
  ctx.strokeRect(h.w, -3, 10, h.h + 6);
  ctx.fillStyle = "#ff3e62";
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 8);
  ctx.fillRect(-8, h.h / 2 - 2, 3, 4);
  ctx.fillRect(h.w + 5, h.h / 2 - 2, 3, 4);
  ctx.globalAlpha = 1;
  if (active) {
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#ff3e62";
    ctx.shadowBlur = 22;
    const g = ctx.createLinearGradient(0, 0, 0, h.h);
    g.addColorStop(0, "rgba(255,80,110,0.1)");
    g.addColorStop(0.3, "rgba(255,80,110,0.85)");
    g.addColorStop(0.5, "rgba(255,255,255,0.95)");
    g.addColorStop(0.7, "rgba(255,80,110,0.85)");
    g.addColorStop(1, "rgba(255,80,110,0.1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, h.w, h.h);
    ctx.fillStyle = "rgba(255,130,150,0.3)";
    ctx.fillRect(-4, h.h / 2 - 1, h.w + 8, 2);
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.strokeStyle = "rgba(255,62,98,0.35)";
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(0, h.h / 2); ctx.lineTo(h.w, h.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // warning chevrons
    ctx.globalAlpha = 0.3 + 0.1 * Math.sin(time * 5);
    ctx.fillStyle = "#ff3e62";
    for (let x = 8; x < h.w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, h.h / 2 - 7);
      ctx.lineTo(x + 8, h.h / 2);
      ctx.lineTo(x, h.h / 2 + 7);
      ctx.strokeStyle = "#ff3e62";
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawOrb(ctx, orb, time) {
  if (orb.collected) return;
  const bob = Math.sin(time * 2.4 + orb.phase) * 7;
  const x = orb.x, y = orb.y + bob;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, 38);
  g.addColorStop(0, "rgba(190,255,255,0.55)");
  g.addColorStop(0.3, "rgba(93,247,255,0.22)");
  g.addColorStop(1, "rgba(93,247,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, 38, 0, TAU); ctx.fill();
  ctx.translate(x, y);
  ctx.rotate(time * 1.2 + orb.phase);
  ctx.shadowColor = "#5df7ff";
  ctx.shadowBlur = 14;
  ctx.strokeStyle = "rgba(205,255,255,0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -11); ctx.lineTo(6, 0); ctx.lineTo(0, 11); ctx.lineTo(-6, 0); ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#d9ffff";
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(3.5, 0); ctx.lineTo(0, 6); ctx.lineTo(-3.5, 0); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCheckpoint(ctx, cp, time) {
  const x = cp.x, y = cp.y;
  ctx.save();
  ctx.translate(x, y);
  // base
  ctx.fillStyle = "#0b0a18";
  ctx.fillRect(-18, -8, 36, 8);
  ctx.strokeStyle = cp.active ? "rgba(93,247,255,0.5)" : "rgba(120,120,150,0.25)";
  ctx.strokeRect(-18, -8, 36, 8);
  // beam
  if (cp.active) {
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(0, -260, 0, 0);
    g.addColorStop(0, "rgba(93,247,255,0)");
    g.addColorStop(0.7, "rgba(93,247,255,0.05)");
    g.addColorStop(1, "rgba(93,247,255,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(-18, -260, 36, 260);
    ctx.globalCompositeOperation = "source-over";
  }
  // diamond
  const bob = Math.sin(time * 2 + cp.id) * 4;
  ctx.translate(0, -58 + bob);
  ctx.rotate(time * 0.7);
  ctx.strokeStyle = cp.active ? "#5df7ff" : "#4a4a63";
  ctx.fillStyle = cp.active ? "rgba(93,247,255,0.18)" : "rgba(30,30,45,0.4)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = cp.active ? "#5df7ff" : "transparent";
  ctx.shadowBlur = cp.active ? 18 : 0;
  ctx.beginPath();
  ctx.moveTo(0, -17); ctx.lineTo(12, 0); ctx.lineTo(0, 17); ctx.lineTo(-12, 0); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.rotate(-time * 0.7);
  ctx.fillStyle = cp.active ? "#eaffff" : "#77778f";
  ctx.fillRect(-2, -6, 4, 12);
  ctx.fillRect(-6, -2, 12, 4);
  ctx.restore();
  // label
  ctx.save();
  ctx.translate(x, y);
  ctx.textAlign = "center";
  ctx.font = '700 8px "DejaVu Sans Mono", monospace';
  ctx.fillStyle = cp.active ? "rgba(93,247,255,0.8)" : "rgba(120,120,150,0.4)";
  ctx.fillText(cp.active ? "LINK STABLE" : "CHECKPOINT", 0, -142);
  ctx.restore();
}

export function drawArenaGate(ctx, x, time, open) {
  ctx.save();
  ctx.translate(x, 0);
  const h = 360;
  // pillars
  ctx.fillStyle = "#090714";
  ctx.fillRect(-34, GROUND_Y - h, 30, h);
  ctx.fillRect(4, GROUND_Y - h, 30, h);
  ctx.strokeStyle = "rgba(255,62,98,0.35)";
  ctx.strokeRect(-34, GROUND_Y - h, 30, h);
  ctx.strokeRect(4, GROUND_Y - h, 30, h);
  if (!open) {
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(0, GROUND_Y - h, 0, GROUND_Y);
    g.addColorStop(0, "rgba(255,62,98,0.03)");
    g.addColorStop(0.5, "rgba(255,62,98,0.22)");
    g.addColorStop(1, "rgba(255,62,98,0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(-4, GROUND_Y - h, 8, h);
    ctx.fillStyle = "rgba(255,120,140,0.5)";
    for (let y = GROUND_Y - h + 20; y < GROUND_Y; y += 34) {
      ctx.fillRect(-3, y + Math.sin(time * 3 + y) * 2, 6, 14);
    }
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.textAlign = "center";
  ctx.font = '700 9px "DejaVu Sans Mono", monospace';
  ctx.fillStyle = "rgba(255,62,98,0.65)";
  ctx.fillText(open ? "LOCKDOWN" : "SEALED // BOSS", 0, GROUND_Y - h - 14);
  ctx.restore();
}
