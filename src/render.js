import { WORLD_W, WORLD_H } from "./terrain.js";
import { WEAPONS, simulateShot } from "./physics.js";

const MATS = {
  wood: { base: "#b9793f", light: "#e0a666", dark: "#7c4a22", edge: "#5a3316", line: "#8e5a2c" },
  brick: { base: "#b95747", light: "#e58a72", dark: "#7d3329", edge: "#5a211a", line: "#e3b39f" },
  metal: { base: "#8298ad", light: "#c3d4e3", dark: "#52667a", edge: "#334454", line: "#dbe8f3" },
};

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cw = 0;
    this.ch = 0;
    this.dpr = 1;
    this.shakeX = 0;
    this.shakeY = 0;
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: hash(i * 3.1) * 1700,
        y: 0.04 + hash(i * 7.7) * 0.26,
        s: 0.55 + hash(i * 2.3) * 0.8,
        speed: 4 + hash(i * 5.9) * 9,
        alpha: 0.32 + hash(i * 9.2) * 0.4,
      });
    }
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.cw = w;
    this.ch = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  toScreenX(wx, state) {
    return this.cw / 2 + (wx - state.cam.x) * state.cam.scale + this.shakeX;
  }

  toScreenY(wy, state) {
    return this.ch / 2 + (wy - state.cam.y) * state.cam.scale + this.shakeY;
  }

  draw(state) {
    const ctx = this.ctx;
    const { cw, ch } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    this.shakeX = Math.sin(state.time * 93) * state.shake;
    this.shakeY = Math.cos(state.time * 77) * state.shake * 0.65;

    this.drawBackground(state);

    ctx.save();
    ctx.translate(cw / 2 + this.shakeX, ch / 2 + this.shakeY);
    ctx.scale(state.cam.scale, state.cam.scale);
    ctx.translate(-state.cam.x, -state.cam.y);

    this.drawWorld(state);

    ctx.restore();

    this.drawScreenFx(state);
  }

  drawBackground(state) {
    const ctx = this.ctx;
    const { cw, ch } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, "#5fb7ef");
    sky.addColorStop(0.42, "#9ad8f8");
    sky.addColorStop(0.75, "#d9f2fb");
    sky.addColorStop(1, "#f0e4c8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    const parX = (state.cam.x - WORLD_W / 2) * 0.16;
    const parY = (state.cam.y - WORLD_H / 2) * 0.08;

    // Sun
    const sunX = cw * 0.79 - parX * 0.4;
    const sunY = ch * 0.17 - parY;
    const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.max(110, cw * 0.13));
    glow.addColorStop(0, "rgba(255, 244, 196, 0.9)");
    glow.addColorStop(0.35, "rgba(255, 229, 150, 0.28)");
    glow.addColorStop(1, "rgba(255, 220, 140, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - cw * 0.2, sunY - cw * 0.2, cw * 0.4, cw * 0.4);
    ctx.fillStyle = "#fff6cf";
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.max(22, cw * 0.023), 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    for (const c of this.clouds) {
      const span = cw + 420;
      let x = ((c.x - state.time * c.speed - parX * 0.7) % span + span) % span - 210;
      const y = ch * c.y - parY * 0.7;
      const s = c.s * Math.max(0.7, cw / 1200);
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x, y, 46 * s, 15 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 30 * s, y + 4 * s, 26 * s, 11 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 34 * s, y + 5 * s, 30 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 6 * s, y - 10 * s, 26 * s, 15 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Birds
    ctx.strokeStyle = "rgba(35, 62, 82, 0.4)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const bx = ((state.time * (11 + i * 4) + i * 260) % (cw + 200)) - 100;
      const by = ch * 0.2 + i * 26 + Math.sin(state.time * 0.7 + i) * 6;
      const flap = Math.sin(state.time * 4 + i * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + flap);
      ctx.quadraticCurveTo(bx - 2, by - 2, bx, by);
      ctx.quadraticCurveTo(bx + 2, by - 2, bx + 6, by + flap);
      ctx.stroke();
    }

    // Wind streaks
    const wind = state.wind || 0;
    if (Math.abs(wind) > 18) {
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + Math.min(0.1, Math.abs(wind) / 900)})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) {
        const sx = ((state.time * (40 + Math.abs(wind) * 1.6) * Math.sign(wind) + i * 190) % (cw + 300) + cw + 300) % (cw + 300) - 150;
        const sy = ch * 0.1 + hash(i * 4.7) * ch * 0.42;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.sign(wind) * (24 + hash(i) * 34), sy - 3);
        ctx.stroke();
      }
    }

    // Distant hills
    const horizon = this.toScreenY(492, state);
    this.drawHills(state, horizon + 24, "#a8d6b4", 0.55, 0.55, 92);
    this.drawHills(state, horizon + 54, "#7cb998", 0.72, 0.85, 66);

    // Underground extension when the camera shows past the world floor
    const floorY = this.toScreenY(WORLD_H, state);
    if (floorY < ch) {
      const g = ctx.createLinearGradient(0, floorY, 0, ch);
      g.addColorStop(0, "#4a3123");
      g.addColorStop(0.35, "#332218");
      g.addColorStop(1, "#1c120d");
      ctx.fillStyle = g;
      ctx.fillRect(0, floorY, cw, ch - floorY);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let i = 0; i < 40; i++) {
        const x = hash(i * 3.3) * cw;
        const y = floorY + hash(i * 9.1) * (ch - floorY);
        ctx.beginPath();
        ctx.arc(x, y, 1 + hash(i) * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawHills(state, baseY, color, alpha, parallax, amp) {
    const ctx = this.ctx;
    const { cw } = this;
    const offset = (state.cam.x - WORLD_W / 2) * parallax;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-40, baseY + 200);
    for (let x = -40; x <= cw + 40; x += 16) {
      const wx = x + offset;
      const y = baseY - Math.sin(wx * 0.0042 + 1.2) * amp * 0.45 - Math.sin(wx * 0.011 + 0.4) * amp * 0.22;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(cw + 40, baseY + 200);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawWorld(state) {
    const ctx = this.ctx;
    const terrain = state.terrain;

    terrain.draw(ctx);

    // tombstone markers
    for (const w of state.worms) {
      if (!w.alive) this.drawGrave(ctx, w);
    }

    terrain.drawTufts(ctx, state.time);

    // structures & crates
    for (const s of state.structures) this.drawStructure(ctx, s, state);

    // aim preview behind the worm
    if (state.phase === "input" && !state.buildMode && state.active && state.active.alive && state.scene === "play" && state.aim.active) {
      this.drawAim(ctx, state);
    }

    // projectiles
    for (const p of state.projectiles) this.drawProjectile(ctx, p, state);

    // worms
    for (const w of state.worms) if (w.alive) this.drawWorm(ctx, w, state);

    // particles
    this.drawParticles(ctx, state);

    // floating texts
    this.drawFloaters(ctx, state);

    // build ghost
    if (state.buildMode && state.ghost) this.drawBuildGhost(ctx, state);

    // damage flash tint
    if (state.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${state.hitFlash * 0.12})`;
      ctx.fillRect(state.cam.x - 2000, state.cam.y - 2000, 4000, 4000);
    }
  }

  /* ---------------- structures ---------------- */
  drawStructure(ctx, s, state) {
    if (s.type === "crate") { this.drawCrate(ctx, s, state); return; }
    const c = MATS[s.mat] || MATS.wood;
    const t = Math.min(1, (state.time - s.born) * 8);
    const pop = 0.75 + 0.25 * (1 - Math.pow(1 - t, 3));
    const cx = s.cellX + 22;
    const cy = s.cellY + 22;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pop, pop);
    ctx.translate(-cx, -cy);

    if (s.type === "wall") {
      const x = s.cellX + 3, y = s.cellY + 3, w = 38, h = 38;
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, c.light);
      g.addColorStop(0.55, c.base);
      g.addColorStop(1, c.dark);
      ctx.fillStyle = g;
      rr(ctx, x, y, w, h, 3);
      ctx.fill();
      ctx.strokeStyle = c.edge;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      rr(ctx, x + 2, y + 2, w - 4, h - 4, 2);
      ctx.clip();
      if (s.mat === "wood") {
        ctx.strokeStyle = "rgba(90,51,22,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + w - 4, y + h - 4);
        ctx.moveTo(x + w - 4, y + 4); ctx.lineTo(x + 4, y + h - 4);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,220,170,0.22)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 4, y + i * 10 + 2);
          ctx.lineTo(x + w - 4, y + i * 10 + 2);
          ctx.stroke();
        }
      } else if (s.mat === "brick") {
        ctx.strokeStyle = "rgba(255,220,200,0.32)";
        ctx.lineWidth = 1.4;
        for (let row = 0; row < 4; row++) {
          const yy = y + 4 + row * 8;
          ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy); ctx.stroke();
          const off = row % 2 ? 9 : 0;
          for (let col = 0; col < 3; col++) {
            const xx = x + 6 + off + col * 15;
            if (xx < x + w - 3) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 8); ctx.stroke(); }
          }
        }
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(x + 3, y + 7 + i * 8); ctx.lineTo(x + w - 3, y + 7 + i * 8); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (const [nx, ny] of [[7, 7], [w - 7, 7], [7, h - 7], [w - 7, h - 7]]) {
          ctx.beginPath(); ctx.arc(x + nx, y + ny, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();

      // top highlight
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x + 4, y + 3, w - 8, 2);
    } else if (s.type === "floor") {
      const x = s.cellX + 1, y = s.cellY + 17, w = 42, h = 11;
      ctx.fillStyle = c.edge;
      rr(ctx, x - 1, y - 1, w + 2, h + 2, 3);
      ctx.fill();
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, c.light);
      g.addColorStop(0.4, c.base);
      g.addColorStop(1, c.dark);
      ctx.fillStyle = g;
      rr(ctx, x, y, w, h, 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 10.5, y + 1); ctx.lineTo(x + i * 10.5, y + h - 1); ctx.stroke();
      }
      // supports
      ctx.strokeStyle = c.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + h); ctx.lineTo(x + 12, y + 22);
      ctx.moveTo(x + w - 6, y + h); ctx.lineTo(x + w - 12, y + 22);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(x + 2, y + 1, w - 4, 1.5);
    } else if (s.type === "ramp") {
      const x = s.cellX, y = s.cellY;
      ctx.beginPath();
      if (s.dir >= 0) {
        ctx.moveTo(x, y + 44);
        ctx.lineTo(x + 44, y + 44);
        ctx.lineTo(x + 44, y);
      } else {
        ctx.moveTo(x, y + 44);
        ctx.lineTo(x + 44, y + 44);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(x, y + 44, x + 44, y);
      g.addColorStop(0, c.dark);
      g.addColorStop(0.5, c.base);
      g.addColorStop(1, c.light);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = c.edge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = s.mat === "metal" ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1.6;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        if (s.dir >= 0) { ctx.moveTo(x, y + 44 - i * 7); ctx.lineTo(x + 44, y + 44 - i * 7 - 44 + 2); }
        else { ctx.moveTo(x + 44, y + 44 - i * 7); ctx.lineTo(x, y + 44 - i * 7 - 44 + 2); }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (s.dir >= 0) { ctx.moveTo(x + 1, y + 43); ctx.lineTo(x + 43, y + 1); }
      else { ctx.moveTo(x + 43, y + 43); ctx.lineTo(x + 1, y + 1); }
      ctx.stroke();
    }

    // team accent
    ctx.fillStyle = s.team === 0 ? "rgba(69,182,255,0.7)" : "rgba(255,93,108,0.7)";
    if (s.type === "wall") ctx.fillRect(s.cellX + 6, s.cellY + 39, 32, 2);
    else if (s.type === "floor") ctx.fillRect(s.cellX + 4, s.cellY + 26, 36, 2);

    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, s.flash)})`;
      if (s.type === "wall") ctx.fillRect(s.cellX + 3, s.cellY + 3, 38, 38);
      else if (s.type === "floor") ctx.fillRect(s.cellX + 1, s.cellY + 17, 42, 11);
      else { ctx.beginPath(); ctx.moveTo(s.cellX, s.cellY + 44); ctx.lineTo(s.cellX + 44, s.cellY + 44); ctx.lineTo(s.dir >= 0 ? s.cellX + 44 : s.cellX, s.cellY); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();

    if (s.hp < s.maxHp) this.drawHpBar(ctx, s.cellX + 7, s.cellY - 7, 30, s.hp / s.maxHp, s.team);
  }

  drawCrate(ctx, s, state) {
    const r = s.rects[0];
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 3.4 + r.x);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.save();
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 40);
    glow.addColorStop(0, `rgba(255,220,90,${0.18 + pulse * 0.18})`);
    glow.addColorStop(1, "rgba(255,220,90,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#7c4a22";
    rr(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 4);
    ctx.fill();
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, "#e3a961");
    g.addColorStop(1, "#a86a31");
    ctx.fillStyle = g;
    rr(ctx, r.x, r.y, r.w, r.h, 3);
    ctx.fill();
    ctx.strokeStyle = "#5a3316";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,240,190,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x + 3, r.y + r.h - 4); ctx.lineTo(r.x + r.w - 3, r.y + 4);
    ctx.stroke();
    ctx.fillStyle = "#5a3316";
    ctx.fillRect(r.x + 4, r.y + r.h * 0.32, r.w - 8, 3);
    ctx.fillRect(r.x + 4, r.y + r.h * 0.66, r.w - 8, 3);
    ctx.fillStyle = `rgba(255,230,120,${0.7 + pulse * 0.3})`;
    ctx.font = "900 16px Bungee, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", cx, cy + 1);
    ctx.restore();
    if (s.hp < s.maxHp) this.drawHpBar(ctx, r.x + 2, r.y - 7, r.w - 4, s.hp / s.maxHp, -1);
  }

  drawHpBar(ctx, x, y, w, ratio, team) {
    ctx.fillStyle = "rgba(8,14,24,0.75)";
    rr(ctx, x - 1, y - 1, w + 2, 6, 3);
    ctx.fill();
    ctx.fillStyle = ratio > 0.55 ? "#65d98b" : ratio > 0.28 ? "#ffd447" : "#ff5d6c";
    rr(ctx, x, y, Math.max(2, w * Math.max(0, ratio)), 4, 2);
    ctx.fill();
  }

  drawGrave(ctx, w) {
    const x = w.deathX ?? w.x;
    const y = (w.deathY ?? w.y) + 8;
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#6f7c8a";
    rr(ctx, x - 7, y - 18, 14, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#4b5662";
    ctx.fillRect(x - 7, y - 4, 14, 3);
    ctx.fillStyle = "rgba(30,40,50,0.55)";
    ctx.font = "900 8px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RIP", x, y - 8);
    ctx.restore();
  }

  /* ---------------- worms ---------------- */
  drawWorm(ctx, w, state) {
    const active = state.active === w && state.phase !== "over";
    const bob = Math.sin(state.time * (active ? 4.2 : 2.1) + w.bob) * (active ? 1.4 : 0.7);
    const x = w.x;
    const y = w.y + bob;
    const facing = w.facing || 1;
    const teamDark = w.team === 0 ? "#2b7fb8" : "#b83048";
    const teamLight = w.team === 0 ? "#6ec8f4" : "#f47d92";
    const bodyDark = "#c96b86";
    const bodyLight = "#ffc3d2";

    if (w.onGround) {
      ctx.fillStyle = "rgba(20, 30, 20, 0.25)";
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(state.time * 4);
      ctx.strokeStyle = w.team === 0 ? `rgba(90,205,255,${0.35 + pulse * 0.3})` : `rgba(255,110,125,${0.35 + pulse * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 13, 17 + pulse * 2, 6 + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      const arrowY = y - 42 - Math.sin(state.time * 3.2) * 2.5;
      ctx.fillStyle = w.team === 0 ? "#7fd6ff" : "#ff9aa5";
      ctx.beginPath();
      ctx.moveTo(x, arrowY + 7);
      ctx.lineTo(x - 5, arrowY);
      ctx.lineTo(x + 5, arrowY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.translate(x, y);
    const tilt = Math.max(-0.22, Math.min(0.22, w.vx * 0.0016));
    ctx.rotate(tilt);

    // tail
    ctx.strokeStyle = bodyDark;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-facing * 6, 8);
    ctx.quadraticCurveTo(-facing * 14, 11, -facing * 15, 5);
    ctx.stroke();

    // body
    const bg = ctx.createLinearGradient(-10, -6, 10, 16);
    bg.addColorStop(0, bodyLight);
    bg.addColorStop(0.6, "#f39ab2");
    bg.addColorStop(1, bodyDark);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 3, 10.5, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120, 40, 65, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // belly stripes
    ctx.strokeStyle = "rgba(255, 220, 228, 0.5)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(facing * 1.5, 4 + i * 3.2, 6.4, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    // head
    const hg = ctx.createRadialGradient(-3, -15, 1, 0, -10, 12);
    hg.addColorStop(0, "#ffe0e7");
    hg.addColorStop(0.55, "#f6a4b9");
    hg.addColorStop(1, "#d06b87");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(0, -10, 9.6, 0, Math.PI * 2);
    ctx.fill();

    // helmet
    ctx.fillStyle = teamDark;
    ctx.beginPath();
    ctx.arc(0, -12, 10.2, Math.PI * 1.02, Math.PI * 1.98);
    ctx.lineTo(9.6, -12.5);
    ctx.lineTo(-9.6, -12.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = teamLight;
    ctx.beginPath();
    ctx.arc(-1.6, -14, 6.6, Math.PI * 1.05, Math.PI * 1.8);
    ctx.fill();
    ctx.fillStyle = teamDark;
    ctx.fillRect(-11.4, -13.5, 22.8, 3.4);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(3.6, -16.2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    const blink = Math.sin(state.time * 1.7 + w.bob * 3) > 0.985 ? 0.15 : 1;
    for (const side of [-1, 1]) {
      const ex = side * 3.4 + facing * 1.4;
      ctx.fillStyle = "#fffdf8";
      ctx.beginPath();
      ctx.ellipse(ex, -10.2, 2.7, 3.1 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a1622";
      ctx.beginPath();
      ctx.ellipse(ex + facing * 0.9, -9.9, 1.3, 1.7 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // cheeks + mouth
    ctx.fillStyle = "rgba(255, 120, 150, 0.4)";
    ctx.beginPath(); ctx.arc(-6.2, -6.5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6.2, -6.5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8d3c52";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(facing * 1, -5.5, 2.4, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // weapon
    const aimAngle = active && state.phase === "input" ? state.aim.angle : (facing > 0 ? -0.5 : Math.PI + 0.5);
    ctx.save();
    ctx.translate(facing * 5, -1);
    ctx.rotate(aimAngle);
    ctx.fillStyle = "#3a4a5c";
    ctx.strokeStyle = "#202c3a";
    ctx.lineWidth = 1.2;
    if (state.weapon === "grenade" && active) {
      ctx.fillStyle = "#5b7a4a";
      ctx.beginPath();
      ctx.arc(10, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#9fb37a";
      ctx.fillRect(7.4, -5.8, 5.2, 2.4);
    } else {
      rr(ctx, 1, -2.6, 17, 5.2, 2.4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd447";
      ctx.fillRect(1, -2.6, 4, 5.2);
      ctx.fillStyle = "#6f8194";
      ctx.beginPath();
      ctx.moveTo(18, -2.6);
      ctx.lineTo(23, 0);
      ctx.lineTo(18, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#202c3a";
      ctx.fillRect(6, 2.4, 3.4, 3.2);
    }
    ctx.restore();

    // little arm
    ctx.strokeStyle = bodyDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(facing * 4, 1);
    ctx.lineTo(facing * 8, 3);
    ctx.stroke();

    if (w.flash > 0) {
      ctx.globalAlpha = Math.min(0.85, w.flash);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // health bar
    const ratio = Math.max(0, w.hp / w.maxHp);
    if (active || ratio < 1) {
      const bx = x - 16;
      const by = y - 33;
      ctx.fillStyle = "rgba(8,14,24,0.72)";
      rr(ctx, bx - 1, by - 1, 34, 6, 3);
      ctx.fill();
      ctx.fillStyle = ratio > 0.55 ? "#65d98b" : ratio > 0.28 ? "#ffd447" : "#ff5d6c";
      rr(ctx, bx, by, Math.max(2, 32 * ratio), 4, 2);
      ctx.fill();
    }
    if (active) {
      ctx.font = "900 8px Bungee, Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = w.team === 0 ? "#c8ecff" : "#ffd0d5";
      ctx.strokeStyle = "rgba(8,14,24,0.7)";
      ctx.lineWidth = 3;
      const label = w.name;
      ctx.strokeText(label, x, y + 27);
      ctx.fillText(label, x, y + 27);
    }
  }

  /* ---------------- projectiles ---------------- */
  drawProjectile(ctx, p, state) {
    // trail
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const a = Math.max(0, t.life / t.maxLife);
      const r = (p.weapon === "grenade" ? 2.4 : 3.6) * (0.4 + a * 0.9);
      ctx.globalAlpha = a * 0.4;
      ctx.fillStyle = p.weapon === "grenade" ? "#d8f0ff" : "#ffe3b0";
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.weapon === "grenade") {
      ctx.rotate(p.spin || 0);
      ctx.fillStyle = "#526b3d";
      ctx.strokeStyle = "#26351d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 5.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(190,220,150,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4.6, -2.6); ctx.lineTo(4.6, -2.6);
      ctx.moveTo(-4.6, 0); ctx.lineTo(4.6, 0);
      ctx.moveTo(-4.6, 2.6); ctx.lineTo(4.6, 2.6);
      ctx.stroke();
      ctx.fillStyle = "#c6d6a2";
      ctx.fillRect(-2, -7.6, 4, 3);
      ctx.strokeStyle = "#c6d6a2";
      ctx.beginPath();
      ctx.arc(4, -7, 2.4, -0.4, Math.PI * 0.7);
      ctx.stroke();
    } else {
      const ang = Math.atan2(p.vy, p.vx);
      ctx.rotate(ang);
      const flame = 3 + Math.sin(state.time * 60) * 2;
      const fg = ctx.createLinearGradient(-16 - flame, 0, -8, 0);
      fg.addColorStop(0, "rgba(255,120,40,0)");
      fg.addColorStop(0.6, "rgba(255,170,60,0.8)");
      fg.addColorStop(1, "#fff2b0");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-8, -2.6);
      ctx.lineTo(-16 - flame, 0);
      ctx.lineTo(-8, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dfe9f2";
      ctx.strokeStyle = "#46586b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -3);
      ctx.lineTo(6, -3);
      ctx.lineTo(11, 0);
      ctx.lineTo(6, 3);
      ctx.lineTo(-9, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff5d6c";
      ctx.beginPath();
      ctx.moveTo(6, -3); ctx.lineTo(11, 0); ctx.lineTo(6, 3); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#46586b";
      ctx.beginPath();
      ctx.moveTo(-9, -3); ctx.lineTo(-12, -6); ctx.lineTo(-6, -3); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-9, 3); ctx.lineTo(-12, 6); ctx.lineTo(-6, 3); ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------- particles & floaters ---------------- */
  drawParticles(ctx, state) {
    for (const p of state.particles) {
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));
      if (p.kind === "smoke") {
        ctx.globalAlpha = a * (p.alpha ?? 0.45);
        ctx.fillStyle = p.color || "#6b625c";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "spark") {
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color || "#ffd447";
        ctx.lineWidth = p.size || 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
        ctx.stroke();
      } else if (p.kind === "ring") {
        ctx.globalAlpha = a * 0.7;
        ctx.strokeStyle = p.color || "#fff2b0";
        ctx.lineWidth = Math.max(1, 4 * a);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.8 - a), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "flash") {
        ctx.globalAlpha = a * 0.75;
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.size);
        g.addColorStop(0, "#fffbe0");
        g.addColorStop(0.4, "rgba(255,200,90,0.8)");
        g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color || "#8a5a3b";
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.tall ? 1.5 : 1));
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawFloaters(ctx, state) {
    for (const f of state.floaters) {
      const a = Math.max(0, Math.min(1, f.life / f.maxLife));
      ctx.globalAlpha = a;
      ctx.font = `900 ${f.size || 16}px Bungee, Arial Black, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(8,14,24,0.8)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color || "#fff";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- aiming ---------------- */
  drawAim(ctx, state) {
    const w = state.active;
    if (!w) return;
    const spec = WEAPONS[state.weapon];
    const angle = state.aim.angle;
    const power = state.aim.power;
    const mx = w.x + Math.cos(angle) * 24;
    const my = w.y - 2 + Math.sin(angle) * 24;
    const sim = simulateShot({
      x: mx, y: my, angle, power, weapon: state.weapon, wind: state.wind,
      terrain: state.terrain, structures: state.structures, worms: state.worms,
      ignoreWormId: w.id, ownerTeam: w.team, maxTime: 6.5,
    });

    const hot = state.aim.active;
    const pts = sim.points;
    for (let i = 2; i < pts.length; i += 3) {
      const t = i / Math.max(1, pts.length);
      const a = (hot ? 0.65 : 0.34) * (1 - t * 0.55);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fff6d8";
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, hot ? 2.3 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const imp = sim.impact;
    if (imp && imp.type !== "miss" && imp.type !== "timeout") {
      const hitWorm = sim.hitWorm;
      const color = hitWorm ? (hitWorm.team === w.team ? "#ffb3ba" : "#ff8b96") : "#ffd447";
      ctx.save();
      ctx.globalAlpha = hot ? 0.85 : 0.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(imp.x, imp.y, spec.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(imp.x - 6, imp.y); ctx.lineTo(imp.x + 6, imp.y);
      ctx.moveTo(imp.x, imp.y - 6); ctx.lineTo(imp.x, imp.y + 6);
      ctx.stroke();
      ctx.restore();
    }

    // power / angle badge
    const deg = Math.round((angle * 180) / Math.PI);
    const norm = ((deg % 360) + 360) % 360;
    const shown = norm > 180 ? norm - 360 : norm;
    ctx.save();
    ctx.globalAlpha = hot ? 1 : 0.7;
    ctx.font = "900 9px Bungee, Arial Black, sans-serif";
    ctx.textAlign = "center";
    const bx = w.x;
    const by = w.y - 51;
    const text = `${Math.round(power * 100)}%  ·  ${shown}°`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(8,14,24,0.7)";
    rr(ctx, bx - tw / 2 - 6, by - 9, tw + 12, 15, 5);
    ctx.fill();
    ctx.fillStyle = hot ? "#fff3bf" : "rgba(255,243,191,0.8)";
    ctx.fillText(text, bx, by + 2);
    ctx.restore();
  }

  drawBuildGhost(ctx, state) {
    const w = state.active;
    if (!w) return;
    const g = state.ghost;
    const range = 290;
    // build grid
    ctx.save();
    ctx.strokeStyle = "rgba(150, 255, 190, 0.07)";
    ctx.lineWidth = 1;
    const minX = Math.floor((w.x - range) / 44) * 44;
    const maxX = Math.ceil((w.x + range) / 44) * 44;
    const minY = Math.floor((w.y - range) / 44) * 44;
    const maxY = Math.ceil((w.y + range) / 44) * 44;
    for (let x = minX; x <= maxX; x += 44) {
      ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, maxY); ctx.stroke();
    }
    for (let y = minY; y <= maxY; y += 44) {
      ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke();
    }
    // range ring
    ctx.strokeStyle = "rgba(150, 255, 190, 0.13)";
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.arc(w.x, w.y, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (!g) return;
    const c = MATS[state.selectedMat] || MATS.wood;
    const good = g.valid;
    const x = g.cellX, y = g.cellY;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = good ? c.base : "#ff5d6c";
    if (state.selectedPiece === "wall") {
      rr(ctx, x + 3, y + 3, 38, 38, 3); ctx.fill();
    } else if (state.selectedPiece === "floor") {
      rr(ctx, x + 1, y + 17, 42, 11, 2); ctx.fill();
    } else {
      ctx.beginPath();
      if (state.rampDir >= 0) { ctx.moveTo(x, y + 44); ctx.lineTo(x + 44, y + 44); ctx.lineTo(x + 44, y); }
      else { ctx.moveTo(x, y + 44); ctx.lineTo(x + 44, y + 44); ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = good ? "#8bffb6" : "#ff6b7b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + 1, y + 1, 42, 42);
    ctx.setLineDash([]);
    ctx.fillStyle = good ? "rgba(139,255,182,0.95)" : "rgba(255,107,123,0.95)";
    ctx.font = "900 9px Bungee, Arial Black, sans-serif";
    ctx.textAlign = "center";
    const cost = state.buildCost ?? 0;
    ctx.fillText(good ? `${cost} ${state.selectedMat.toUpperCase()}` : "NO ROOM", x + 22, y - 6);
    ctx.restore();
  }

  /* ---------------- screen overlays ---------------- */
  drawScreenFx(state) {
    const ctx = this.ctx;
    const { cw, ch } = this;

    // vignette
    const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(4,8,16,0.42)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cw, ch);

    // off-screen markers
    for (const w of state.worms) {
      if (!w.alive) continue;
      const sx = this.toScreenX(w.x, state);
      const sy = this.toScreenY(w.y, state);
      if (sx > 24 && sx < cw - 24 && sy > 24 && sy < ch - 24) continue;
      const cx = Math.max(30, Math.min(cw - 30, sx));
      const cy = Math.max(30, Math.min(ch - 30, sy));
      const ang = Math.atan2(sy - ch / 2, sx - cw / 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.fillStyle = w.team === 0 ? "rgba(69,182,255,0.9)" : "rgba(255,93,108,0.9)";
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.font = "900 8px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fillText(w.name, cx, cy + 15);
    }

    if (state.projectiles.length) {
      const p = state.projectiles[0];
      const sx = this.toScreenX(p.x, state);
      const sy = this.toScreenY(p.y, state);
      if (sx < 10 || sx > cw - 10 || sy < 10 || sy > ch - 10) {
        const cx = Math.max(18, Math.min(cw - 18, sx));
        const cy = Math.max(18, Math.min(ch - 18, sy));
        ctx.fillStyle = "rgba(255,212,71,0.9)";
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
