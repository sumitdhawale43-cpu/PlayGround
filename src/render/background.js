import { clamp, rgba, lerp } from '../utils.js';
import { WORLD, ZONES, ZONE_BY_ID, zoneAtY, waterColorAt, yToDepth } from '../world.js';

export function screenX(r, x) {
  return (x - r.cam.x) * r.zoom + r.w / 2;
}
export function screenY(r, y) {
  return (y - r.cam.y) * r.zoom + r.h / 2;
}

export function drawBackground(r, game) {
  const { ctx, w, h, cam, zoom } = r;
  const topY = cam.y - r.viewH / 2;
  const bottomY = cam.y + r.viewH / 2;
  ctx.setTransform(r.dpr, 0, 0, r.dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, waterColorAt(topY));
  grad.addColorStop(0.45, waterColorAt(lerp(topY, bottomY, 0.45)));
  grad.addColorStop(1, waterColorAt(bottomY));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const surface = screenY(r, 0);
  if (surface > -10) {
    // Pale sky above the waterline.
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(surface, 1));
    sky.addColorStop(0, '#9deef1');
    sky.addColorStop(0.5, '#7edee7');
    sky.addColorStop(1, '#b4f7f2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, Math.max(0, surface));

    // Sun haze.
    const sunX = w * 0.72;
    const sunY = surface - Math.min(340, h * 0.5);
    const sun = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, Math.max(220, h * 0.6));
    sun.addColorStop(0, 'rgba(255, 252, 226, 0.78)');
    sun.addColorStop(0.08, 'rgba(255, 246, 198, 0.34)');
    sun.addColorStop(0.35, 'rgba(205, 250, 241, 0.14)');
    sun.addColorStop(1, 'rgba(180, 245, 240, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, Math.max(0, surface));

    // Horizon haze.
    const haze = ctx.createLinearGradient(0, surface - 80, 0, surface + 30);
    haze.addColorStop(0, 'rgba(225, 255, 250, 0)');
    haze.addColorStop(0.7, 'rgba(219, 255, 251, 0.26)');
    haze.addColorStop(1, 'rgba(111, 235, 240, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, Math.max(0, surface - 80), w, 110);
  }

  // Surface caustics and god rays only near the top of the world.
  const depth = yToDepth(cam.y);
  if (depth < 460 && surface < h + 200) {
    drawGodRays(r, surface, depth);
    drawSurfaceCaustics(r, surface, depth);
  }

  drawFarSilhouettes(r, game);
}

function drawGodRays(r, surface, depth) {
  const { ctx, w, h, time } = r;
  if (surface > h + 160) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, Math.max(-10, surface), w, h - Math.max(-10, surface));
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  const fade = clamp(1 - depth / 460, 0, 1);
  const beams = 8;
  for (let i = 0; i < beams; i++) {
    const t = i / beams;
    const x = ((t * 1.3 + 0.06) * w + Math.sin(time * 0.06 + i * 1.7) * 80) % (w * 1.15);
    const width = 36 + (i % 3) * 24;
    const lean = 90 + Math.sin(time * 0.045 + i) * 50;
    const length = h * (0.55 + (i % 4) * 0.12);
    const g = ctx.createLinearGradient(x, surface, x + lean, surface + length);
    g.addColorStop(0, `rgba(193, 255, 250, ${0.11 * fade})`);
    g.addColorStop(0.4, `rgba(142, 246, 246, ${0.045 * fade})`);
    g.addColorStop(1, 'rgba(120, 235, 240, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, surface);
    ctx.lineTo(x + width / 2, surface);
    ctx.lineTo(x + width * 1.8 + lean, surface + length);
    ctx.lineTo(x - width * 0.9 + lean, surface + length);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSurfaceCaustics(r, surface, depth) {
  const { ctx, w, h, time } = r;
  if (surface > h) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, Math.max(0, surface), w, h - Math.max(0, surface));
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  const fade = clamp(1 - depth / 340, 0, 1) * 0.45;
  for (let i = 0; i < 7; i++) {
    const yy = surface + 24 + i * 34 + Math.sin(time * 0.5 + i) * 5;
    ctx.beginPath();
    for (let x = -40; x <= w + 40; x += 24) {
      const y = yy + Math.sin(x * 0.013 + time * (0.7 + i * 0.03) + i * 1.2) * 7 + Math.sin(x * 0.029 - time * 0.4) * 3;
      if (x === -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(198, 255, 250, ${0.035 * fade})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFarSilhouettes(r, game) {
  const { ctx, w, h, cam, zoom } = r;
  const px = 0.22;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < game.world.rocks.length; i += 2) {
    const rock = game.world.rocks[i];
    if (rock.r < 100 || rock.kind === 'wreck') continue;
    const sx = (rock.x - cam.x) * zoom * px + w / 2;
    const sy = (rock.y - cam.y) * zoom * px + h / 2;
    const rad = rock.r * zoom * 1.75;
    if (sx < -rad * 2 || sx > w + rad * 2 || sy < -rad * 2 || sy > h + rad * 2) continue;
    const zone = ZONE_BY_ID[rock.zone] || ZONES[0];
    const g = ctx.createRadialGradient(sx, sy, rad * 0.1, sx, sy, rad);
    g.addColorStop(0, rgba(zone.fog, 0.22));
    g.addColorStop(0.55, rgba(zone.fog, 0.13));
    g.addColorStop(1, rgba(zone.fog, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Marine snow / plankton ────────────────────────────────────────────
export function updateSnow(r, dt, game) {
  const { cam } = r;
  const left = cam.x - r.viewW / 2 - 100;
  const right = cam.x + r.viewW / 2 + 100;
  const top = cam.y - r.viewH / 2 - 100;
  const bottom = cam.y + r.viewH / 2 + 100;
  if (!r.snow.length) {
    for (let i = 0; i < 270; i++) {
      r.snow.push({
        x: left + Math.random() * (right - left),
        y: top + Math.random() * (bottom - top),
        z: 0.25 + Math.random() * 0.9,
        size: 0.5 + Math.random() * 2.1,
        speed: 5 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        glow: Math.random() < 0.13,
      });
    }
  }
  for (const p of r.snow) {
    p.phase += dt * 0.7;
    p.y += p.speed * dt;
    p.x += Math.sin(p.phase * 0.5) * 4 * dt;
    if (p.y > bottom) {
      p.y = top;
      p.x = left + Math.random() * (right - left);
    }
    if (p.x < left) p.x = right;
    if (p.x > right) p.x = left;
  }
}

export function drawSnow(r) {
  const { ctx, w, h, cam, zoom } = r;
  const zone = zoneAtY(cam.y);
  const deep = clamp(yToDepth(cam.y) / 700, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of r.snow) {
    const sx = (p.x - cam.x) * zoom * p.z + w / 2;
    const sy = (p.y - cam.y) * zoom * p.z + h / 2;
    if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;
    const alpha = (0.13 + deep * 0.32) * (0.45 + p.z * 0.55);
    if (p.glow && deep > 0.25) {
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * 5);
      g.addColorStop(0, rgba(zone.glow, alpha * 0.7));
      g.addColorStop(1, rgba(zone.glow, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(206, 251, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size * p.z, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Lighting pass ─────────────────────────────────────────────────────
export function drawLighting(r, game) {
  const { ctx, w, h, cam, zoom } = r;
  const player = game.player;
  const zone = zoneAtY(player.y);
  const sx = screenX(r, player.x);
  const sy = screenY(r, player.y);
  const lamp = 390 + (player.lampLevel || 0) * 105;
  const lightRadius = lamp * zoom;
  const darkness = clamp(zone.ambient + (game.surfaceAir ? -0.04 : 0), 0.02, 0.82);

  ctx.setTransform(r.dpr, 0, 0, r.dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  // Cold depth tint.
  ctx.fillStyle = rgba(zone.fog, 0.08 + darkness * 0.08);
  ctx.fillRect(0, 0, w, h);

  // Darkness closes in around the submersible.
  const dark = ctx.createRadialGradient(sx, sy, lightRadius * 0.22, sx, sy, Math.max(lightRadius * 1.65, Math.hypot(w, h) * 0.55));
  dark.addColorStop(0, 'rgba(0, 4, 12, 0)');
  dark.addColorStop(0.34, `rgba(0, 5, 14, ${darkness * 0.26})`);
  dark.addColorStop(0.68, `rgba(0, 4, 12, ${darkness * 0.72})`);
  dark.addColorStop(1, `rgba(0, 2, 8, ${darkness})`);
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);

  // Warm / cold headlamp cone.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(sx, sy);
  ctx.rotate(player.angle);
  const coneLen = (620 + (player.lampLevel || 0) * 150) * zoom;
  const half = 0.36;
  const cone = ctx.createLinearGradient(0, 0, coneLen, 0);
  cone.addColorStop(0, `rgba(180, 250, 255, ${0.13 + darkness * 0.1})`);
  cone.addColorStop(0.18, `rgba(128, 235, 250, ${0.065 + darkness * 0.06})`);
  cone.addColorStop(0.7, `rgba(100, 220, 240, ${0.018 + darkness * 0.018})`);
  cone.addColorStop(1, 'rgba(100, 220, 240, 0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(12 * zoom, 0);
  ctx.arc(0, 0, coneLen, -half, half);
  ctx.closePath();
  ctx.fill();

  // Soft bulb halo.
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 80 * zoom);
  halo.addColorStop(0, `rgba(208, 253, 255, ${0.25 + darkness * 0.15})`);
  halo.addColorStop(0.4, `rgba(128, 240, 255, ${0.06 + darkness * 0.04})`);
  halo.addColorStop(1, 'rgba(128, 240, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 80 * zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Vignette.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.76);
  vig.addColorStop(0, 'rgba(0, 4, 10, 0)');
  vig.addColorStop(0.7, 'rgba(0, 3, 9, 0.22)');
  vig.addColorStop(1, 'rgba(0, 2, 6, 0.66)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Oxygen / damage feedback.
  if (player.oxygen < 25) {
    const pulse = 0.12 + Math.sin(r.time * 3.2) * 0.06;
    const ox = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
    ox.addColorStop(0, 'rgba(30, 120, 160, 0)');
    ox.addColorStop(1, `rgba(10, 42, 66, ${0.2 + pulse})`);
    ctx.fillStyle = ox;
    ctx.fillRect(0, 0, w, h);
  }
  if (player.hitFlash > 0) {
    ctx.fillStyle = `rgba(150, 18, 26, ${clamp(player.hitFlash * 0.34, 0, 0.28)})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (game.pressureWarning) {
    const pulse = 0.06 + Math.sin(r.time * 4.4) * 0.03;
    ctx.fillStyle = `rgba(140, 30, 20, ${pulse})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (player.y < 150) {
    const surf = ctx.createLinearGradient(0, 0, 0, h * 0.35);
    surf.addColorStop(0, 'rgba(210, 255, 250, 0.12)');
    surf.addColorStop(1, 'rgba(210, 255, 250, 0)');
    ctx.fillStyle = surf;
    ctx.fillRect(0, 0, w, h * 0.35);
  }
}

// ── Sonar minimap ─────────────────────────────────────────────────────
export function drawMinimap(r, game, canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d5260');
  bg.addColorStop(0.45, '#072d45');
  bg.addColorStop(1, '#07050f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const pad = 7;
  const mapX = (x) => pad + (x / WORLD.width) * (W - pad * 2);
  const mapY = (y) => pad + (y / WORLD.height) * (H - pad * 2);

  // Zone bands.
  for (const z of ZONES) {
    const y0 = mapY(z.y0);
    const y1 = mapY(z.y1);
    ctx.fillStyle = rgba(z.top, 0.07);
    ctx.fillRect(pad, y0, W - pad * 2, y1 - y0);
    ctx.strokeStyle = rgba(z.top, 0.14);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y1);
    ctx.lineTo(W - pad, y1);
    ctx.stroke();
    ctx.fillStyle = rgba(z.top, 0.48);
    ctx.font = '600 5.5px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(z.short, pad + 3, y0 + 8);
  }

  // Grid.
  ctx.strokeStyle = 'rgba(132, 231, 250, 0.055)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const x = pad + (i / 5) * (W - pad * 2);
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, H - pad);
    ctx.stroke();
  }

  // Points of interest.
  const sonar = game.save.upgrades.sonar > 0;
  if (sonar) {
    for (const v of game.world.vents) {
      ctx.fillStyle = v.type === 'thermal' ? 'rgba(255, 142, 90, 0.8)' : 'rgba(125, 240, 207, 0.8)';
      ctx.beginPath();
      ctx.arc(mapX(v.x), mapY(v.y), 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of game.world.chests) {
      if (game.save.openedChests.includes(c.id)) continue;
      ctx.fillStyle = 'rgba(255, 202, 122, 0.9)';
      ctx.fillRect(mapX(c.x) - 1.6, mapY(c.y) - 1.6, 3.2, 3.2);
    }
  }

  // Relic signatures.
  for (const relic of game.world.relics) {
    if (game.save.relics.includes(relic.id)) continue;
    const x = mapX(relic.x);
    const y = mapY(relic.y);
    const pulse = 0.65 + Math.sin(r.time * 2.5 + relic.phase) * 0.25;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = `rgba(255, 202, 122, ${pulse})`;
    ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
    ctx.restore();
  }

  // Aurora base.
  const bx = mapX(WORLD.baseX);
  const by = mapY(130);
  ctx.fillStyle = 'rgba(125, 240, 207, 0.95)';
  ctx.beginPath();
  ctx.moveTo(bx, by - 3.5);
  ctx.lineTo(bx + 3.5, by);
  ctx.lineTo(bx + 2, by + 2.5);
  ctx.lineTo(bx - 2, by + 2.5);
  ctx.lineTo(bx - 3.5, by);
  ctx.closePath();
  ctx.fill();

  // Viewport rectangle.
  const vx = mapX(r.cam.x - r.viewW / 2);
  const vy = mapY(r.cam.y - r.viewH / 2);
  const vw = (r.viewW / WORLD.width) * (W - pad * 2);
  const vh = (r.viewH / WORLD.height) * (H - pad * 2);
  ctx.strokeStyle = 'rgba(180, 245, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(vx, vy, vw, vh);

  // Player.
  const px = mapX(game.player.x);
  const py = mapY(game.player.y);
  ctx.save();
  ctx.translate(px, py);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
  glow.addColorStop(0, 'rgba(120, 250, 255, 0.6)');
  glow.addColorStop(1, 'rgba(120, 250, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(game.player.angle + Math.PI / 2);
  ctx.fillStyle = '#b9fbff';
  ctx.beginPath();
  ctx.moveTo(0, -4.5);
  ctx.lineTo(3.2, 3.5);
  ctx.lineTo(0, 2);
  ctx.lineTo(-3.2, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
