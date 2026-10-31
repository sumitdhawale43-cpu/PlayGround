/* ============================================================
   Camera, world compositing and the canvas HUD.
   ============================================================ */

import { PHYS } from './config.js';
import { THEMES, drawMinimap } from './tracks.js';
import { effects } from './effects.js';
import { makeCarSprite, drawWheel, glowSprite, makeShadowSprite } from './sprites.js';
import { clamp, lerp, damp, TAU, fmtTime, ordinal } from './utils.js';

function rrect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const FONT = '"Arial Narrow", "Segoe UI", Impact, sans-serif';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.w = 1;
    this.h = 1;
    this.dpr = 1;
    this.cam = { x: 0, y: 0, zoom: 1, init: false };
    this.sprites = new Map();
    this.shadow = makeShadowSprite();
    this.headlight = makeHeadlight();
    this.track = null;
    this.groundPattern = null;
    this.speedo = { needle: 0 };
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap || 2);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(320, window.innerHeight);
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.baseZoom = clamp(Math.min(w / 1180, h / 780), 0.55, 1.5);
    this.cam.init = false;
  }

  setTrack(track) {
    this.track = track;
    this.groundPattern = null;
  }

  spriteFor(car) {
    const key = car.def.id + '|' + car.colors.body + '|' + car.colors.accent;
    let s = this.sprites.get(key);
    if (!s) {
      s = makeCarSprite(car.def.shape, car.colors, car.def.glass, key.length + 3);
      this.sprites.set(key, s);
    }
    return s;
  }

  /* ------------------------------ camera ------------------------------ */
  frameCamera(target, dt, race) {
    const speed = target.speed || 0;
    const sf = clamp(speed / 620, 0, 1);
    const lead = 0.20 + sf * 0.16;
    const tx = target.x + target.vx * lead;
    const ty = target.y + target.vy * lead;
    if (!this.cam.init) {
      this.cam.x = tx;
      this.cam.y = ty;
      this.cam.init = true;
    } else {
      this.cam.x = damp(this.cam.x, tx, 6.5, dt);
      this.cam.y = damp(this.cam.y, ty, 6.5, dt);
    }
    const targetZoom = this.baseZoom * (1 - sf * 0.07);
    this.cam.zoom = damp(this.cam.zoom || targetZoom, targetZoom, 3, dt);
    this.speedo.needle = damp(this.speedo.needle, speed, 9, dt);
  }

  /* ------------------------------ world ------------------------------ */
  drawWorld(race, dt) {
    const ctx = this.ctx;
    const { w, h, dpr, cam } = this;
    const theme = race.track.theme;
    const zoom = cam.zoom;
    const [shx, shy] = effects.shakeOffset();
    const viewW = w / zoom;
    const viewH = h / zoom;
    const left = cam.x - viewW / 2;
    const top = cam.y - viewH / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + shx, h / 2 + shy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cam.x, -cam.y);

    const layer = race.track.layer;
    if (layer) {
      // ground outside the prerendered strip
      if (!this.groundPattern) {
        this.groundPattern = ctx.createPattern(race.track.groundTile, 'repeat');
      }
      const inside = left >= layer.ox && top >= layer.oy &&
        left + viewW <= layer.ox + layer.w && top + viewH <= layer.oy + layer.h;
      if (!inside && this.groundPattern) {
        ctx.fillStyle = this.groundPattern;
        ctx.fillRect(left - 4, top - 4, viewW + 8, viewH + 8);
      }
      // blit only the visible slice
      const sx = Math.max(0, Math.floor(left - layer.ox));
      const sy = Math.max(0, Math.floor(top - layer.oy));
      const ex = Math.min(layer.w, Math.ceil(left + viewW - layer.ox));
      const ey = Math.min(layer.h, Math.ceil(top + viewH - layer.oy));
      if (ex > sx && ey > sy) {
        ctx.drawImage(layer.canvas, sx, sy, ex - sx, ey - sy, layer.ox + sx, layer.oy + sy, ex - sx, ey - sy);
      }
    }

    effects.drawUnder(ctx);

    // cars, back to front for a hint of overlap depth
    const order = race.cars.slice().sort((a, b) => a.y - b.y);
    for (const c of order) this.drawCar(ctx, c, race);

    effects.drawParticles(ctx);
    effects.drawTexts(ctx);

    ctx.restore();

    // ---- screen space polish
    this.postEffects(race, sf(race));
  }

  drawCar(ctx, c, race) {
    const spr = this.spriteFor(c);
    const night = race.track.theme.night;
    const L = PHYS.carLength;
    const W = PHYS.carWidth;

    // headlight cones at night
    if (night) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.θ);
      ctx.drawImage(this.headlight, L * 0.35, -78, 240, 156);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // shadow
    ctx.save();
    ctx.translate(c.x + 5, c.y + 7);
    ctx.rotate(c.θ);
    ctx.drawImage(this.shadow, -74, -54, 148, 108);
    ctx.restore();

    // wheels
    const steer = c.steerVis * 0.42;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.θ);
    const wx = L * 0.33;
    const wy = W * 0.44;
    drawWheel(ctx, wx, -wy, 0, steer, true);
    drawWheel(ctx, wx, wy, 0, steer, true);
    drawWheel(ctx, -wx, -wy, 0, 0, false);
    drawWheel(ctx, -wx, wy, 0, 0, false);

    // body
    ctx.drawImage(spr.canvas, -spr.w / 2, -spr.h / 2, spr.w, spr.h);

    // brake lights
    if (c.brakeVis > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + c.brakeVis * 0.5;
      const g = glowSprite('#ff2d4a');
      ctx.drawImage(g, -L * 0.62 - 26, -W * 0.7, 52, 34);
      ctx.drawImage(g, -L * 0.62 - 26, W * 0.7 - 34, 52, 34);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // nitro glow
    if (c.boosting) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = glowSprite('#7cdcff');
      ctx.globalAlpha = .75 + Math.random() * .25;
      ctx.drawImage(g, -L * 0.75 - 34, -34, 78, 68);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  postEffects(race, speedFactor) {
    const ctx = this.ctx;
    const { w, h, dpr } = this;
    const theme = race.track.theme;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const p = race.player;
    const boosting = p && p.boosting;

    // speed streaks
    if (boosting) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const t = performance.now() * 0.001;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.hypot(w, h) * 0.5;
      ctx.strokeStyle = 'rgba(150,230,255,.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * TAU + t * 0.9;
        const phase = (t * 1.6 + i * 0.137) % 1;
        const r0 = R * (0.35 + phase * 0.75);
        const len = 40 + phase * 130;
        ctx.globalAlpha = 0.5 * (1 - phase) * 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len));
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // colour grade
    if (theme.grade) {
      ctx.fillStyle = theme.grade;
      ctx.fillRect(0, 0, w, h);
    }

    // vignette
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.32, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, theme.night ? 'rgba(0,0,10,.62)' : 'rgba(0,0,8,.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // impact flash
    if (effects.flash > 0) {
      ctx.fillStyle = effects.flashColor;
      ctx.globalAlpha = effects.flash;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------ HUD ------------------------------ */
  drawHUD(race, opts) {
    const ctx = this.ctx;
    const { w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hud = race.hudFor(race.player);
    const pad = 14;
    const scale = clamp(Math.min(w, h) / 720, 0.72, 1.25);

    if (race.mode === 'demo') return this.drawDemoTag(ctx, w, h, scale);

    /* ---- top left: position + lap ---- */
    const posW = 132 * scale;
    const posH = 62 * scale;
    ctx.save();
    ctx.translate(pad, pad);
    rrect(ctx, 0, 0, posW, posH, 14 * scale);
    ctx.fillStyle = 'rgba(6,10,17,.66)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `900 italic ${40 * scale}px ${FONT}`;
    const posTxt = String(hud.place);
    const grad = ctx.createLinearGradient(0, 0, posW, 0);
    grad.addColorStop(0, hud.place === 1 ? '#ffd166' : '#ffffff');
    grad.addColorStop(1, hud.place === 1 ? '#ff8a1f' : '#9fb0c6');
    ctx.fillStyle = grad;
    ctx.fillText(posTxt, 12 * scale, posH * 0.44);
    const posW2 = ctx.measureText(posTxt).width;
    ctx.font = `700 ${13 * scale}px ${FONT}`;
    ctx.fillStyle = 'rgba(200,214,232,.85)';
    ctx.fillText(ordinal(hud.place).replace(String(hud.place), ''), 14 * scale + posW2, posH * 0.34);
    ctx.fillStyle = 'rgba(140,158,182,.9)';
    ctx.font = `700 ${14 * scale}px ${FONT}`;
    ctx.fillText(`/ ${race.cars.length}`, 14 * scale + posW2, posH * 0.66);

    ctx.textAlign = 'right';
    ctx.font = `900 italic ${17 * scale}px ${FONT}`;
    ctx.fillStyle = '#25d7ff';
    ctx.fillText(`LAP ${hud.lap}`, posW - 12 * scale, posH * 0.33);
    ctx.font = `700 ${13 * scale}px ${FONT}`;
    ctx.fillStyle = 'rgba(200,214,232,.8)';
    ctx.fillText(`OF ${race.laps}`, posW - 12 * scale, posH * 0.66);
    ctx.restore();

    /* ---- top centre: timers ---- */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const cx = w / 2;
    ctx.font = `900 italic ${44 * scale}px ${FONT}`;
    ctx.lineWidth = 6 * scale;
    ctx.strokeStyle = 'rgba(0,0,0,.65)';
    const tStr = fmtTime(hud.lapTime);
    ctx.strokeText(tStr, cx, pad + 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(tStr, cx, pad + 4);

    ctx.font = `700 ${13 * scale}px ${FONT}`;
    ctx.fillStyle = 'rgba(160,178,202,.95)';
    const best = opts.best;
    ctx.fillText(`TOTAL ${fmtTime(hud.total)}   ·   BEST ${fmtTime(best)}`, cx, pad + 4 + 46 * scale);

    /* ---- minimap ---- */
    const mapW = Math.min(210, w * 0.34) * 1;
    const mapH = mapW * 0.74;
    const mapX = w - mapW - pad;
    const mapY = pad + 56 * scale;
    ctx.save();
    rrect(ctx, mapX, mapY, mapW, mapH, 12);
    ctx.fillStyle = 'rgba(6,10,17,.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.stroke();
    ctx.beginPath();
    rrect(ctx, mapX + 4, mapY + 4, mapW - 8, mapH - 8, 9);
    ctx.clip();
    drawMinimap(ctx, race.track, race.cars, mapX + 4, mapY + 4, mapW - 8, mapH - 8, race.playerIndex);
    ctx.restore();

    /* ---- bottom centre: speedometer + nitro ---- */
    const touch = opts.touch;
    const sx = w / 2;
    const r = Math.min(96, w * 0.13) * scale;
    const sy = h - r - (touch ? 128 : 14) * scale;
    const nitroY = sy - r - 52 * scale;
    this.drawSpeedo(ctx, sx, sy, r, hud.speed, race.player.spec.topSpeed, scale);
    this.drawNitro(ctx, sx, nitroY, Math.min(300, w * 0.54) * scale, 15 * scale, hud.nitro, race.player.boosting, scale);

    if (hud.drifting && hud.chain > 60) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = `900 italic ${26 * scale}px ${FONT}`;
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillText(`${hud.chain}`, sx + 2, nitroY - 14 * scale + 2);
      ctx.fillStyle = hud.combo > 1 ? '#ffd166' : '#25d7ff';
      ctx.fillText(`${hud.chain}  x${hud.combo}`, sx, nitroY - 14 * scale);
    }

    /* ---- countdown state text is DOM driven; add race-phase hints ---- */
    if (race.phase === 'countdown') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = `900 italic ${15 * scale}px ${FONT}`;
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillText('HOLD YOUR LINE', sx + 1.5, nitroY - 40 * scale + 1.5);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillText('HOLD YOUR LINE', sx, nitroY - 40 * scale);
    }
  }

  drawDemoTag(ctx, w, h, scale) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 italic ${13 * scale}px ${FONT}`;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillText('ATTRACT MODE — AI EXHIBITION', w / 2 + 1, 12 * scale + 1);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillText('ATTRACT MODE — AI EXHIBITION', w / 2, 12 * scale);
    ctx.restore();
  }

  drawSpeedo(ctx, cx, cy, r, speed, topSpeed, scale) {
    const start = Math.PI * 0.76;
    const sweep = Math.PI * 1.48;
    const t = clamp(speed / (topSpeed * 1.1), 0, 1);
    const needle = this.speedo.needle;
    const nt = clamp(needle / (topSpeed * 1.1), 0, 1);

    // dial
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = 'rgba(6,10,17,.62)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.stroke();

    // ticks
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const a = start + (i / steps) * sweep;
      const major = i % 5 === 0;
      const r0 = r * (major ? 0.76 : 0.84);
      const r1 = r * 0.94;
      const frac = i / steps;
      ctx.strokeStyle = frac > 0.82 ? '#ff3b57' : frac > 0.62 ? '#ff8a1f' : '#9dff4d';
      ctx.globalAlpha = major ? 0.95 : 0.4;
      ctx.lineWidth = major ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // sweep arc
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.66, start, start + sweep * nt);
    ctx.strokeStyle = 'rgba(37,215,255,.85)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // needle
    const a = start + sweep * nt;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * r * 0.16, cy - Math.sin(a) * r * 0.16);
    ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    ctx.strokeStyle = '#ff6a13';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // readout
    const kmh = Math.round(speed * 0.56);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 italic ${r * 0.52}px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(String(kmh), cx, cy + r * 0.30);
    ctx.font = `700 ${r * 0.16}px ${FONT}`;
    ctx.fillStyle = 'rgba(150,170,196,.9)';
    ctx.fillText('KM/H', cx, cy + r * 0.62);
    ctx.restore();
  }

  drawNitro(ctx, cx, cy, w, h, amount, boosting, scale) {
    const x = cx - w / 2;
    ctx.save();
    rrect(ctx, x, cy, w, h, h / 2);
    ctx.fillStyle = 'rgba(6,10,17,.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const fillW = (w - 4) * clamp(amount, 0, 1);
    if (fillW > 2) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, boosting ? '#ffffff' : '#25d7ff');
      g.addColorStop(1, boosting ? '#9dff4d' : '#4f7dff');
      rrect(ctx, x + 2, cy + 2, fillW, h - 4, (h - 4) / 2);
      ctx.fillStyle = g;
      ctx.fill();
      if (boosting) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = .55;
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        rrect(ctx, x + 2, cy + 2, fillW, h - 4, (h - 4) / 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    // segment ticks
    ctx.strokeStyle = 'rgba(6,10,17,.85)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 10; i++) {
      const px = x + (w * i) / 10;
      ctx.beginPath();
      ctx.moveTo(px, cy + 1.5);
      ctx.lineTo(px, cy + h - 1.5);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = `900 ${11 * scale}px ${FONT}`;
    ctx.fillStyle = amount > 0.98 ? '#9dff4d' : 'rgba(37,215,255,.95)';
    ctx.fillText(amount > 0.98 ? 'NITRO READY' : 'NITRO', x, cy - 5);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(150,170,196,.8)';
    ctx.fillText(`${Math.round(clamp(amount, 0, 1) * 100)}%`, x + w, cy - 5);
    ctx.restore();
  }
}

function sf(race) {
  const p = race.player;
  return p ? clamp(p.speed / 620, 0, 1) : 0;
}

function makeHeadlight() {
  const w = 240;
  const h = 156;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, h / 2, w, h / 2);
  g.addColorStop(0, 'rgba(255,244,205,.85)');
  g.addColorStop(0.35, 'rgba(255,238,190,.34)');
  g.addColorStop(1, 'rgba(255,235,180,0)');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, h / 2 - 14);
  x.quadraticCurveTo(w * 0.5, 8, w, 0);
  x.lineTo(w, h);
  x.quadraticCurveTo(w * 0.5, h - 8, 0, h / 2 + 14);
  x.closePath();
  x.fill();
  return c;
}
