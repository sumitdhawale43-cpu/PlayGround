/* ============================================================
   TIME REWIND — frame compositor
   ============================================================ */

import {
  drawPlatform, drawLaser, drawSaw, drawCore, drawEnergy, drawCheckpoint,
  drawPortal, drawProjectile, drawSentinel, drawDrone, drawPlayer,
  drawTimeRings, glowCircle, rgba, roundRect
} from './draw.js';

const TAU = Math.PI * 2;

export class Renderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
  }

  render() {
    const g = this.game;
    const ctx = this.ctx;
    const dpr = g.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#03040b';
    ctx.fillRect(0, 0, g.cssW, g.cssH);

    if (g.mode === 'menu' || g.mode === 'levels' || g.mode === 'how' || g.mode === 'settings') {
      this.drawMenuScene(ctx);
      return;
    }
    this.drawGameScene(ctx);
  }

  drawMenuScene(ctx) {
    const g = this.game;
    const w = g.cssW, h = g.cssH;
    const scale = Math.max(w / 1280, h / 720) * 1.03;
    const camX = (1280 - 1280) * .5;
    ctx.save();
    ctx.translate(w * .5, h * .5);
    ctx.scale(scale, scale);
    ctx.translate(-690, -360);
    g.background.draw(ctx, 0, 1380, g.ambientTime, g.reducedMotion);
    g.background.drawMenuMonument(ctx, g.ambientTime);
    // floating city debris
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const t = g.ambientTime * (3 + i % 5) + i * 23;
      const x = 720 + ((i * 137) % 620);
      const y = 150 + ((i * 97) % 470) + Math.sin(t * .05) * 14;
      const a = .08 + (i % 4) * .025;
      ctx.globalAlpha = a;
      ctx.fillStyle = i % 3 ? '#7fe8ff' : '#c69bff';
      ctx.fillRect(x, y, 2, 7 + (i % 4) * 3);
    }
    ctx.restore();
    // slow sweeping scan light
    const sweep = (g.ambientTime * 30) % 1600;
    const sg = ctx.createLinearGradient(sweep, 0, sweep + 180, 0);
    sg.addColorStop(0, 'rgba(90,230,255,0)');
    sg.addColorStop(.5, 'rgba(90,230,255,.035)');
    sg.addColorStop(1, 'rgba(90,230,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, 1400, 720);
    ctx.restore();
  }

  drawGameScene(ctx) {
    const g = this.game;
    const viewW = g.viewW, viewH = g.viewH, scale = g.scale;
    const shake = this.computeShake();
    ctx.save();
    ctx.beginPath();
    ctx.rect(g.offsetX, g.offsetY, viewW * scale, viewH * scale);
    ctx.clip();
    ctx.translate(g.offsetX, g.offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-g.camera.x + shake.x, -shake.y);
    this.drawWorld(ctx);
    ctx.restore();
    this.drawScreenFx(ctx);
  }

  computeShake() {
    const g = this.game;
    if (g.reducedMotion) return { x: 0, y: 0 };
    if (g.camera.shake <= 0.05) return { x: 0, y: 0 };
    const s = g.camera.shake;
    return {
      x: Math.sin(g.time * 87) * s + Math.cos(g.time * 51) * s * .45,
      y: Math.cos(g.time * 73) * s * .64 + Math.sin(g.time * 41) * s * .35
    };
  }

  drawWorld(ctx) {
    const g = this.game;
    const palette = g.level ? g.level.palette : g.background.palette;
    const t = g.worldTime;
    const echoActive = g.echoTimer > 0;

    g.background.draw(ctx, g.camera.x, g.viewW, g.ambientTime, g.reducedMotion);

    // ambient / decorative depth geometry
    this.drawDepthGeometry(ctx, palette, t);

    // platforms + hazards
    for (const p of g.platforms) drawPlatform(ctx, p, t, palette, echoActive, g.reducedMotion);
    for (const h of g.hazards) {
      if (h.type === 'laser') drawLaser(ctx, h, t, palette);
      else if (h.type === 'saw') drawSaw(ctx, h, t, palette);
    }

    for (const c of g.checkpoints) drawCheckpoint(ctx, c, t, palette, g.activeCheckpoints.has(c.id));

    if (g.portal) drawPortal(ctx, g.portal.x, g.portal.y, t, palette);

    for (const c of g.cores) drawCore(ctx, c, t, palette);
    for (const e of g.energyOrbs) drawEnergy(ctx, e, t);

    // enemy + projectiles
    for (const e of g.enemies) {
      if (e.type === 'sentinel') drawSentinel(ctx, e, t, palette);
      else if (e.type === 'drone') drawDrone(ctx, e, t, palette);
    }
    for (const p of g.projectiles) drawProjectile(ctx, p, t);

    // player afterimages
    this.drawPlayerGhosts(ctx, palette, scaleOfTrail(g));

    if (!g.dead && g.player) {
      if (g.invuln > 0) g.player.invuln = g.invuln;
      drawPlayer(ctx, g.player, t, palette, {});
      if (g.echoTimer > 0) {
        drawTimeRings(ctx, g.player.x, g.player.y, t, '#ffd36e', .7);
      }
    }

    // rewind rings and field
    if (g.rewinding) {
      drawTimeRings(ctx, g.player.x, g.player.y, t, '#57f2ff', 1);
      this.drawRewindField(ctx);
    }

    g.particles.draw(ctx);

    // low foreground mist over ground
    const fog = ctx.createLinearGradient(0, 620, 0, 745);
    fog.addColorStop(0, 'rgba(5,10,23,0)');
    fog.addColorStop(1, 'rgba(5,10,23,.66)');
    ctx.fillStyle = fog;
    ctx.fillRect(g.camera.x - 20, 615, g.viewW + 40, 140);
  }

  drawDepthGeometry(ctx, palette, time) {
    const g = this.game;
    // distant floating rings in the playfield air
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = 230 + i * 390;
      const y = 170 + (i % 2) * 190;
      ctx.globalAlpha = .045 + (i % 2) * .015;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(x, y, 42 + i * 9, time * .05 + i, time * .05 + i + 2.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPlayerGhosts(ctx, palette, intensity) {
    const g = this.game;
    if (!g.player || !g.history.length) return;
    const count = g.rewinding ? 6 : intensity > 70 ? 3 : 0;
    if (!count) return;
    const base = g.rewinding ? g.rewindCursor : g.history.length - 1;
    for (let i = 1; i <= count; i++) {
      const idx = Math.floor(g.rewinding ? base + i * 4 : base - i * 3);
      if (idx < 0 || idx >= g.history.length) continue;
      const snap = g.history[idx];
      if (!snap || !snap.player) continue;
      ctx.save();
      ctx.globalAlpha = (g.rewinding ? .2 : .055) * (1 - i / (count + 1));
      const ghost = { ...snap.player, invuln: 0, squash: 1 };
      drawPlayer(ctx, ghost, snap.time, palette, { ghost: true });
      ctx.restore();
    }
  }

  drawRewindField(ctx) {
    const g = this.game;
    const t = g.ambientTime;
    const x = g.player.x, y = g.player.y - 26;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y, 10, x, y, 230);
    glow.addColorStop(0, 'rgba(87,242,255,.14)');
    glow.addColorStop(.4, 'rgba(87,242,255,.035)');
    glow.addColorStop(1, 'rgba(87,242,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, 230, 0, TAU); ctx.fill();
    // reverse rising ticks
    for (let i = 0; i < 16; i++) {
      const a = t * (1.2 + (i % 3) * .2) + i * 2.399;
      const r = 65 + ((t * 34 + i * 17) % 130);
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r * .72;
      ctx.globalAlpha = .16 * (1 - (r - 65) / 130);
      ctx.fillStyle = i % 2 ? '#57f2ff' : '#ffffff';
      ctx.fillRect(px, py, 1.5, 4);
    }
    // horizon scan
    ctx.globalAlpha = .11;
    ctx.fillStyle = '#57f2ff';
    for (let i = 0; i < 5; i++) {
      const yy = (t * 80 + i * 151) % 720;
      ctx.fillRect(g.camera.x, yy, g.viewW, 1);
    }
    ctx.restore();
  }

  drawScreenFx(ctx) {
    const g = this.game;
    const w = g.cssW, h = g.cssH;
    const dpr = g.dpr;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // death red wash
    if (g.dead) {
      const pulse = .08 + Math.sin(g.time * 5) * .025;
      const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .72);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(.7, `rgba(89,8,33,${pulse})`);
      v.addColorStop(1, 'rgba(20,2,9,.7)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    }

    if (g.rewinding && !g.reducedMotion) {
      const t = g.time;
      // cyan field
      const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .08, w / 2, h / 2, Math.max(w, h) * .66);
      v.addColorStop(0, 'rgba(87,242,255,0)');
      v.addColorStop(.72, 'rgba(64,181,255,.035)');
      v.addColorStop(1, 'rgba(20,78,135,.16)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
      // chromatic side bands
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const y = ((t * 260 + i * 137) % h);
        const x = (Math.sin(t * 3 + i) * .5 + .5) * w;
        ctx.globalAlpha = .045;
        ctx.fillStyle = i % 2 ? '#ff5fcd' : '#57f2ff';
        ctx.fillRect(x - w * .2, y, w * .4, 1.2);
      }
      ctx.globalAlpha = .12;
      ctx.strokeStyle = '#57f2ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(w * .5 - 62, h * .5 - 62, 124, 124);
      ctx.globalAlpha = 1;
      // clock mark
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(87,242,255,.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 53, -Math.PI / 2, -Math.PI / 2 + (1 - g.rewindCursor / Math.max(1, g.history.length - 1)) * TAU);
      ctx.stroke();
    }

    if (g.flash && g.flash.alpha > 0.002) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = g.flash.alpha;
      ctx.fillStyle = g.flash.color;
      ctx.fillRect(0, 0, w, h);
    }

    // top/bottom cinematic bars on narrow heights
    ctx.globalCompositeOperation = 'source-over';
    if (h < 560 && g.mode === 'playing') {
      ctx.fillStyle = 'rgba(2,4,11,.42)';
      ctx.fillRect(0, 0, w, 5);
      ctx.fillRect(0, h - 5, w, 5);
    }
    ctx.restore();
  }
}

function scaleOfTrail(g) {
  return Math.abs(g.player?.vx || 0);
}
