export const WORLD_W = 1280;
export const WORLD_H = 720;
export const CELL = 2;
export const MW = WORLD_W / CELL;
export const MH = WORLD_H / CELL;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(a, b, t) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function flatten(h, x, center, radius, target) {
  const d = Math.abs(x - center) / radius;
  if (d >= 1) return h;
  const t = 1 - smoothstep(0, 1, d);
  return h * (1 - t) + target * t;
}

export class Terrain {
  constructor(seed = 1) {
    this.mask = new Uint8Array(MW * MH);
    this.open = new Uint8Array(MW * MH);
    this.top = new Int16Array(MW);
    this.canvas = document.createElement("canvas");
    this.canvas.width = MW;
    this.canvas.height = MH;
    this.ctx = this.canvas.getContext("2d");
    this.image = this.ctx.createImageData(MW, MH);
    this.seed = seed;
    this.generate(seed);
  }

  generate(seed = this.seed) {
    this.seed = seed;
    const rng = mulberry32(seed);
    const p1 = rng() * Math.PI * 2;
    const p2 = rng() * Math.PI * 2;
    const p3 = rng() * Math.PI * 2;
    this.mask.fill(0);
    this.top.fill(MH);

    const surface = new Float32Array(MW);
    for (let mx = 0; mx < MW; mx++) {
      const x = mx * CELL;
      let h = 508;
      h += 34 * Math.sin(x * 0.0068 + p1);
      h += 21 * Math.sin(x * 0.0155 + p2);
      h += 8 * Math.sin(x * 0.034 + p3);
      h += 18 * Math.exp(-Math.pow((x - 640) / 150, 2));
      h = flatten(h, x, 380, 150, 492);
      h = flatten(h, x, 900, 150, 512);
      h = Math.max(430, Math.min(570, h));
      surface[mx] = h;
      const start = Math.max(0, Math.floor(h / CELL));
      for (let my = start; my < MH; my++) this.mask[my * MW + mx] = 1;
    }

    // A floating slab of turf, Fortnite-style high ground.
    this.fillEllipse(640, 304, 112, 28);
    this.fillEllipse(632, 330, 76, 17);
    this.fillEllipse(602, 324, 48, 12);

    // Caves and pockets in the dirt.
    this.clearEllipse(496, 622, 96, 27);
    this.clearEllipse(824, 646, 84, 23);
    this.clearEllipse(1080, 620, 62, 18);
    this.clearEllipse(212, 638, 54, 16);

    this.refresh();
  }

  idx(mx, my) {
    return my * MW + mx;
  }

  solidMask(mx, my) {
    if (mx < 0 || mx >= MW) return false;
    if (my >= MH) return true;
    if (my < 0) return false;
    return this.mask[my * MW + mx] === 1;
  }

  solidWorld(x, y) {
    if (y >= WORLD_H) return true;
    if (y < 0) return false;
    if (x < 0 || x >= WORLD_W) return false;
    return this.solidMask(Math.floor(x / CELL), Math.floor(y / CELL));
  }

  fillEllipse(cx, cy, rx, ry) {
    const x0 = Math.max(0, Math.floor((cx - rx) / CELL));
    const x1 = Math.min(MW - 1, Math.ceil((cx + rx) / CELL));
    const y0 = Math.max(0, Math.floor((cy - ry) / CELL));
    const y1 = Math.min(MH - 1, Math.ceil((cy + ry) / CELL));
    for (let my = y0; my <= y1; my++) {
      for (let mx = x0; mx <= x1; mx++) {
        const dx = (mx * CELL - cx) / rx;
        const dy = (my * CELL - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.mask[my * MW + mx] = 1;
      }
    }
  }

  clearEllipse(cx, cy, rx, ry) {
    const x0 = Math.max(0, Math.floor((cx - rx) / CELL));
    const x1 = Math.min(MW - 1, Math.ceil((cx + rx) / CELL));
    const y0 = Math.max(0, Math.floor((cy - ry) / CELL));
    const y1 = Math.min(MH - 1, Math.ceil((cy + ry) / CELL));
    for (let my = y0; my <= y1; my++) {
      for (let mx = x0; mx <= x1; mx++) {
        const dx = (mx * CELL - cx) / rx;
        const dy = (my * CELL - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.mask[my * MW + mx] = 0;
      }
    }
  }

  carve(cx, cy, r) {
    const r2 = r * r;
    const x0 = Math.max(0, Math.floor((cx - r) / CELL));
    const x1 = Math.min(MW - 1, Math.ceil((cx + r) / CELL));
    const y0 = Math.max(0, Math.floor((cy - r) / CELL));
    const y1 = Math.min(MH - 1, Math.ceil((cy + r) / CELL));
    let removed = 0;
    for (let my = y0; my <= y1; my++) {
      const wy = my * CELL + 1;
      for (let mx = x0; mx <= x1; mx++) {
        const i = my * MW + mx;
        if (!this.mask[i]) continue;
        const wx = mx * CELL + 1;
        const dx = wx - cx;
        const dy = wy - cy;
        if (dx * dx + dy * dy <= r2) {
          this.mask[i] = 0;
          removed++;
        }
      }
    }
    if (removed) this.refresh();
    return removed;
  }

  surfaceAt(x) {
    const mx = Math.max(0, Math.min(MW - 1, Math.floor(x / CELL)));
    const my = this.top[mx];
    if (my >= MH) return WORLD_H;
    return my * CELL;
  }

  refresh() {
    for (let mx = 0; mx < MW; mx++) {
      let top = MH;
      for (let my = 0; my < MH; my++) {
        if (this.mask[my * MW + mx]) { top = my; break; }
      }
      this.top[mx] = top;
    }

    // Flood-fill the sky so enclosed pockets (caves, sealed craters) can be
    // painted as dark caverns instead of letting the background show through.
    const open = this.open;
    open.fill(0);
    const stack = [];
    for (let mx = 0; mx < MW; mx++) {
      if (!this.mask[mx]) { open[mx] = 1; stack.push(mx); }
    }
    while (stack.length) {
      const i = stack.pop();
      const mx = i % MW;
      const my = (i / MW) | 0;
      if (mx > 0) { const j = i - 1; if (!this.mask[j] && !open[j]) { open[j] = 1; stack.push(j); } }
      if (mx < MW - 1) { const j = i + 1; if (!this.mask[j] && !open[j]) { open[j] = 1; stack.push(j); } }
      if (my > 0) { const j = i - MW; if (!this.mask[j] && !open[j]) { open[j] = 1; stack.push(j); } }
      if (my < MH - 1) { const j = i + MW; if (!this.mask[j] && !open[j]) { open[j] = 1; stack.push(j); } }
    }

    const data = this.image.data;
    for (let my = 0; my < MH; my++) {
      for (let mx = 0; mx < MW; mx++) {
        const i = my * MW + mx;
        const o = i * 4;
        if (!this.mask[i]) {
          if (open[i]) {
            data[o + 3] = 0;
          } else {
            const n = hash2(mx, my);
            data[o] = 42 + n * 16;
            data[o + 1] = 30 + n * 12;
            data[o + 2] = 24 + n * 10;
            data[o + 3] = 255;
          }
          continue;
        }
        const depth = my - this.top[mx];
        const n = hash2(mx, my);
        let r, g, b;

        if (depth <= 1) {
          r = 132 + n * 20; g = 205 + n * 20; b = 94 + n * 14;
        } else if (depth <= 3) {
          r = 92 + n * 16; g = 166 + n * 16; b = 68 + n * 12;
        } else if (depth <= 5) {
          r = 62 + n * 10; g = 124 + n * 12; b = 52 + n * 8;
        } else {
          const d = Math.min(1, (depth - 5) / 95);
          r = 143 - d * 64;
          g = 99 - d * 44;
          b = 67 - d * 31;
          const strata = Math.sin(my * 0.42 + mx * 0.045) * 6;
          const speck = (n - 0.5) * 15;
          r += strata + speck;
          g += strata * 0.8 + speck * 0.7;
          b += strata * 0.55 + speck * 0.5;
          if (depth > 70 && n > 0.82) {
            r = r * 0.62 + 70; g = g * 0.62 + 72; b = b * 0.62 + 78;
          }
          if (depth < 14) {
            r = r * 0.8 + 122 * 0.2;
            g = g * 0.8 + 92 * 0.2;
            b = b * 0.8 + 60 * 0.2;
          }
        }
        data[o] = Math.max(0, Math.min(255, r));
        data[o + 1] = Math.max(0, Math.min(255, g));
        data[o + 2] = Math.max(0, Math.min(255, b));
        data[o + 3] = 255;
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  draw(ctx) {
    ctx.drawImage(this.canvas, 0, 0, WORLD_W, WORLD_H);
  }

  drawTufts(ctx, time) {
    for (let mx = 6; mx < MW - 6; mx += 9) {
      const my = this.top[mx];
      if (my >= MH || my <= 0) continue;
      if (!this.mask[my * MW + mx]) continue;
      const n = hash2(mx, 71);
      if (n > 0.72) continue;
      const x = mx * CELL;
      const y = my * CELL;
      const sway = Math.sin(time * 1.4 + mx * 0.35) * 1.6;
      if (n > 0.52) {
        ctx.strokeStyle = n > 0.62 ? "#5fbf55" : "#4da348";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y + 1);
        ctx.quadraticCurveTo(x - 2 + sway, y - 5, x - 3 + sway, y - 9);
        ctx.moveTo(x + 1, y + 1);
        ctx.quadraticCurveTo(x + 3 + sway, y - 4, x + 3 + sway, y - 8);
        ctx.stroke();
      } else if (n > 0.4) {
        ctx.fillStyle = n > 0.46 ? "#ffd85e" : "#ff9fb5";
        ctx.beginPath();
        ctx.arc(x + sway * 0.4, y - 5, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3f8f3a";
        ctx.fillRect(x - 0.6, y - 4, 1.2, 4);
      } else {
        ctx.fillStyle = "rgba(60, 78, 60, 0.45)";
        ctx.beginPath();
        ctx.ellipse(x, y - 1, 3.2, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
