import { clamp, rgba, mulberry32, roundRect, shade } from '../utils.js';
import { WORLD, ZONE_BY_ID, ZONES, zoneAtY, seabedY, yToDepth } from '../world.js';

const ROCK_PALETTE = {
  shallows: { dark: '#042a36', mid: '#0a5260', light: '#237f89', rim: '#8ce9e3', moss: '#2d9c76' },
  kelp: { dark: '#03272e', mid: '#07524f', light: '#1a8175', rim: '#8ae3bc', moss: '#4aa25e' },
  twilight: { dark: '#031329', mid: '#071f3b', light: '#124364', rim: '#7aa9d6', moss: '#2e6b79' },
  abyss: { dark: '#020814', mid: '#040f22', light: '#0a2039', rim: '#477ba0', moss: '#1a5361' },
  rift: { dark: '#090408', mid: '#17090f', light: '#34171a', rim: '#b0624a', moss: '#5c302a' },
};

function visible(r, x, y, pad = 180) {
  return x > r.cam.x - r.viewW / 2 - pad && x < r.cam.x + r.viewW / 2 + pad
    && y > r.cam.y - r.viewH / 2 - pad && y < r.cam.y + r.viewH / 2 + pad;
}

function rockShape(rock, r) {
  let shape = r.rockShapes.get(rock);
  if (shape) return shape;
  const rng = mulberry32(rock.seed || 1);
  const count = 13 + Math.floor(rng() * 6);
  shape = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const rad = rock.r * (0.76 + rng() * 0.34);
    shape.push([Math.cos(a) * rad, Math.sin(a) * rad * (0.86 + rng() * 0.22)]);
  }
  r.rockShapes.set(rock, shape);
  return shape;
}

export function drawSeabed(r, game) {
  const { ctx, cam } = r;
  const left = cam.x - r.viewW / 2 - 120;
  const right = cam.x + r.viewW / 2 + 120;
  const centerFloor = seabedY(cam.x);
  if (cam.y + r.viewH / 2 < centerFloor - 120) return;

  ctx.beginPath();
  ctx.moveTo(left, seabedY(left));
  for (let x = left; x <= right; x += 48) ctx.lineTo(x, seabedY(x));
  ctx.lineTo(right, WORLD.height + 300);
  ctx.lineTo(left, WORLD.height + 300);
  ctx.closePath();

  const g = ctx.createLinearGradient(0, centerFloor - 120, 0, WORLD.height);
  g.addColorStop(0, '#2a1618');
  g.addColorStop(0.18, '#170d12');
  g.addColorStop(0.6, '#0a0508');
  g.addColorStop(1, '#050204');
  ctx.fillStyle = g;
  ctx.fill();

  // Sand ripples and warm fissures.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 154, 92, 0.07)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const yy = centerFloor + 18 + i * 17;
    ctx.beginPath();
    for (let x = left; x <= right; x += 30) {
      const y = yy + Math.sin(x * 0.018 + i * 1.4) * 7;
      if (x === left) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 120, 60, 0.28)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const x = left + ((i * 311 + 170) % Math.max(1, right - left));
    ctx.beginPath();
    ctx.moveTo(x, centerFloor + 20);
    ctx.lineTo(x + 18, centerFloor + 44);
    ctx.lineTo(x + 4, centerFloor + 67);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRocks(r, game) {
  const { ctx } = r;
  for (const rock of game.world.rocks) {
    if (rock.kind === 'wreck') continue;
    if (!visible(r, rock.x, rock.y, rock.r + 100)) continue;
    const pal = ROCK_PALETTE[rock.zone] || ROCK_PALETTE.shallows;
    const shape = rockShape(rock, r);
    ctx.save();
    ctx.translate(rock.x, rock.y);

    if (rock.kind === 'ruin') {
      ctx.fillStyle = rgba(pal.dark, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 8, rock.r * 1.5, rock.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    const grad = ctx.createRadialGradient(-rock.r * 0.3, -rock.r * 0.38, rock.r * 0.06, 0, 0, rock.r * 1.25);
    grad.addColorStop(0, rock.kind === 'dark' ? pal.mid : pal.light);
    grad.addColorStop(0.42, pal.mid);
    grad.addColorStop(1, pal.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    shape.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Rim light.
    ctx.strokeStyle = rgba(pal.rim, rock.kind === 'vent' ? 0.1 : 0.2);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Speckles and cracks.
    const rng = mulberry32((rock.seed || 1) + 17);
    for (let i = 0; i < 6; i++) {
      const a = rng() * Math.PI * 2;
      const rr = rng() * rock.r * 0.7;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      ctx.fillStyle = i % 2 ? rgba(pal.rim, 0.08) : rgba(pal.dark, 0.28);
      ctx.beginPath();
      ctx.arc(x, y, 1 + rng() * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(pal.dark, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-rock.r * 0.55, -rock.r * 0.2);
    ctx.lineTo(-rock.r * 0.1, rock.r * 0.1);
    ctx.lineTo(-rock.r * 0.24, rock.r * 0.5);
    ctx.stroke();

    // Moss or bioluminescent growth on top.
    if (rock.kind === 'moss' || (rock.zone === 'shallows' || rock.zone === 'kelp') && (rock.seed || 0) % 3 === 0) {
      ctx.fillStyle = rgba(pal.moss, 0.36);
      ctx.beginPath();
      ctx.ellipse(-rock.r * 0.1, -rock.r * 0.58, rock.r * 0.58, rock.r * 0.2, -0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(pal.moss, 0.22);
      ctx.beginPath();
      ctx.ellipse(rock.r * 0.35, -rock.r * 0.42, rock.r * 0.3, rock.r * 0.13, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (rock.zone === 'abyss' || rock.zone === 'rift') {
      const rng2 = mulberry32((rock.seed || 3) + 71);
      for (let i = 0; i < 3; i++) {
        const x = (rng2() - 0.5) * rock.r * 1.2;
        const y = (rng2() - 0.5) * rock.r * 0.9;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, rgba(rock.zone === 'rift' ? '#ff8a4d' : '#54e8ff', 0.45));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

export function drawSurfaceAndBoat(r, game) {
  const { ctx, cam, time } = r;
  if (cam.y - r.viewH / 2 > 220) return;
  const left = cam.x - r.viewW / 2 - 60;
  const right = cam.x + r.viewW / 2 + 60;

  // Boat at the Aurora.
  drawBoat(r, game, time);

  // Waterline.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, 2);
  for (let x = left; x <= right; x += 18) {
    ctx.lineTo(x, Math.sin(x * 0.012 + time * 0.9) * 4 + Math.sin(x * 0.031 - time * 0.6) * 1.8);
  }
  ctx.strokeStyle = 'rgba(197, 255, 252, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.globalCompositeOperation = 'lighter';
  const sheen = ctx.createLinearGradient(0, -10, 0, 80);
  sheen.addColorStop(0, 'rgba(190, 255, 252, 0.13)');
  sheen.addColorStop(1, 'rgba(190, 255, 252, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(left, -6, right - left, 90);
  ctx.restore();
}

function drawBoat(r, game, time) {
  const { ctx } = r;
  const x = WORLD.baseX;
  const y = -32 + Math.sin(time * 1.1) * 3;
  if (!visible(r, x, y, 340)) return;
  ctx.save();
  ctx.translate(x, y);

  // Searchlight cone into the water.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cone = ctx.createLinearGradient(0, 18, 70, 300);
  cone.addColorStop(0, 'rgba(255, 239, 190, 0.2)');
  cone.addColorStop(1, 'rgba(255, 239, 190, 0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(-12, 18);
  ctx.lineTo(14, 18);
  ctx.lineTo(130, 310);
  ctx.lineTo(-50, 310);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Hull.
  const hull = ctx.createLinearGradient(0, -12, 0, 42);
  hull.addColorStop(0, '#e7f3ef');
  hull.addColorStop(0.55, '#b7cbc8');
  hull.addColorStop(1, '#5a7474');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-170, -10);
  ctx.lineTo(150, -10);
  ctx.quadraticCurveTo(198, -2, 176, 28);
  ctx.lineTo(108, 38);
  ctx.lineTo(-132, 38);
  ctx.quadraticCurveTo(-184, 22, -170, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 48, 56, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Orange waterline stripe.
  ctx.fillStyle = '#e67f45';
  ctx.beginPath();
  ctx.moveTo(-154, 20);
  ctx.lineTo(162, 20);
  ctx.lineTo(150, 27);
  ctx.lineTo(-142, 27);
  ctx.closePath();
  ctx.fill();

  // Cabin.
  const cabin = ctx.createLinearGradient(0, -58, 0, -6);
  cabin.addColorStop(0, '#f3fbf8');
  cabin.addColorStop(1, '#9fb9b7');
  ctx.fillStyle = cabin;
  roundRect(ctx, -74, -58, 132, 50, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 45, 53, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Windows.
  ctx.fillStyle = 'rgba(255, 215, 136, 0.85)';
  for (let i = 0; i < 4; i++) {
    roundRect(ctx, -60 + i * 28, -47, 18, 15, 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(19, 49, 55, 0.9)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-47 + i * 28, -47, 1.6, 15);
  }

  // Mast and antenna.
  ctx.strokeStyle = 'rgba(221, 241, 238, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -58);
  ctx.lineTo(-30, -126);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-30, -108);
  ctx.lineTo(16, -92);
  ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(-30, -128, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  const mastGlow = ctx.createRadialGradient(-30, -128, 0, -30, -128, 20);
  mastGlow.addColorStop(0, 'rgba(255, 217, 138, 0.65)');
  mastGlow.addColorStop(1, 'rgba(255, 217, 138, 0)');
  ctx.fillStyle = mastGlow;
  ctx.beginPath();
  ctx.arc(-30, -128, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Deck details.
  ctx.fillStyle = 'rgba(42, 74, 76, 0.5)';
  ctx.fillRect(-150, -12, 310, 3);
  ctx.font = '8px "Bebas Neue", sans-serif';
  ctx.fillStyle = 'rgba(19, 50, 56, 0.75)';
  ctx.textAlign = 'center';
  ctx.fillText('AURORA', 108, 15);

  // Ladder and mooring rope.
  ctx.strokeStyle = 'rgba(207, 232, 228, 0.55)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-128, 30 + i * 10);
    ctx.lineTo(-116, 30 + i * 10);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-124, 30);
  ctx.lineTo(-124, 96);
  ctx.moveTo(-116, 30);
  ctx.lineTo(-116, 96);
  ctx.stroke();

  // Life ring.
  ctx.strokeStyle = '#f0a35f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(82, 4, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawLandmarks(r, game) {
  drawWreck(r, game);
  drawRuins(r, game);
  drawBones(r, game);
  drawLeviathanPearl(r, game);
}

function drawWreck(r, game) {
  const w = game.world.wreck;
  if (!visible(r, w.x, w.y, 320)) return;
  const { ctx } = r;
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.rotate(w.angle);
  ctx.scale(w.scale, w.scale);

  // Silt.
  ctx.fillStyle = 'rgba(4, 24, 30, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 96, 230, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // Broken hull.
  const hull = ctx.createLinearGradient(0, -80, 0, 90);
  hull.addColorStop(0, '#4a3d34');
  hull.addColorStop(0.35, '#2f2b27');
  hull.addColorStop(1, '#151c1d');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-190, 12);
  ctx.quadraticCurveTo(-174, -58, -88, -68);
  ctx.lineTo(100, -60);
  ctx.quadraticCurveTo(186, -46, 196, 20);
  ctx.quadraticCurveTo(160, 84, 62, 90);
  ctx.lineTo(-92, 86);
  ctx.quadraticCurveTo(-186, 74, -190, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(131, 169, 160, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Torn opening.
  ctx.fillStyle = '#050b0d';
  ctx.beginPath();
  ctx.moveTo(-46, -62);
  ctx.quadraticCurveTo(18, -84, 88, -56);
  ctx.lineTo(72, 18);
  ctx.quadraticCurveTo(14, 40, -38, 18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(132, 100, 70, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Ribs.
  ctx.strokeStyle = 'rgba(106, 84, 66, 0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const x = -130 + i * 38;
    ctx.beginPath();
    ctx.moveTo(x, -64 + Math.abs(i - 2) * 2);
    ctx.quadraticCurveTo(x + 8, 0, x - 4, 78);
    ctx.stroke();
  }

  // Deck rail.
  ctx.strokeStyle = 'rgba(74, 110, 104, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-150, -50);
  ctx.lineTo(-70, -58);
  ctx.stroke();

  // Portholes.
  for (let i = 0; i < 4; i++) {
    const x = -126 + i * 62;
    ctx.fillStyle = 'rgba(8, 26, 29, 0.9)';
    ctx.beginPath();
    ctx.arc(x, -8, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(119, 159, 149, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 203, 130, 0.09)';
    ctx.beginPath();
    ctx.arc(x, -8, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Broken mast.
  ctx.save();
  ctx.translate(-84, -58);
  ctx.rotate(-0.72);
  ctx.fillStyle = '#3b2c24';
  ctx.fillRect(-5, -110, 10, 118);
  ctx.strokeStyle = 'rgba(135, 105, 79, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-5, -110, 10, 118);
  ctx.restore();

  // Seaweed on the hull.
  ctx.strokeStyle = 'rgba(50, 130, 95, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x = -150 + i * 67;
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.quadraticCurveTo(x + 14, 46, x + 4, 14);
    ctx.stroke();
  }

  // Name plate.
  ctx.save();
  ctx.rotate(0.01);
  ctx.font = '11px "Bebas Neue", sans-serif';
  ctx.fillStyle = 'rgba(190, 160, 115, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('C A L Y P S O', 112, 54);
  ctx.restore();
  ctx.restore();
}

function drawRuins(r, game) {
  const { ctx } = r;
  for (const site of game.world.ruins) {
    if (!visible(r, site.x, site.y, 380)) continue;
    // Ambient glow behind the ruins.
    const aura = ctx.createRadialGradient(site.x, site.y - 60, 20, site.x, site.y - 60, 340);
    aura.addColorStop(0, 'rgba(90, 220, 255, 0.055)');
    aura.addColorStop(1, 'rgba(90, 220, 255, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(site.x - 340, site.y - 400, 680, 560);

    for (let ci = 0; ci < site.columns.length; ci++) {
      const c = site.columns[ci];
      const col = ctx.createLinearGradient(c.x - c.w / 2, 0, c.x + c.w / 2, 0);
      col.addColorStop(0, '#0a1a2a');
      col.addColorStop(0.45, '#173a50');
      col.addColorStop(1, '#07111f');
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(c.x - c.w / 2, c.y);
      ctx.lineTo(c.x - c.w / 2, c.y - c.h + (c.broken ? 16 : 0));
      if (c.broken) {
        ctx.lineTo(c.x - c.w * 0.16, c.y - c.h - 8);
        ctx.lineTo(c.x + c.w * 0.12, c.y - c.h + 10);
      }
      ctx.lineTo(c.x + c.w / 2, c.y - c.h + (c.broken ? 20 : 0));
      ctx.lineTo(c.x + c.w / 2, c.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(116, 204, 216, 0.16)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Capital.
      if (!c.broken) {
        ctx.fillStyle = '#1c4355';
        ctx.fillRect(c.x - c.w * 0.72, c.y - c.h - 8, c.w * 1.44, 9);
        ctx.strokeStyle = 'rgba(120, 220, 230, 0.16)';
        ctx.strokeRect(c.x - c.w * 0.72, c.y - c.h - 8, c.w * 1.44, 9);
      }

      // Glowing runes.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let g = 0; g < 3; g++) {
        const gy = c.y - 34 - g * 46;
        if (gy < c.y - c.h + 12) break;
        const a = 0.22 + Math.sin(r.time * 1.4 + ci * 2 + g) * 0.12;
        ctx.fillStyle = `rgba(94, 235, 255, ${a})`;
        ctx.fillRect(c.x - 3, gy, 6, 2);
        ctx.fillRect(c.x - 1.5, gy + 4, 3, 5);
      }
      ctx.restore();
    }

    // Fallen blocks.
    ctx.fillStyle = 'rgba(10, 27, 42, 0.9)';
    for (let i = 0; i < 5; i++) {
      const bx = site.x - 200 + i * 97;
      const by = site.y + 28 + (i % 2) * 14;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate((i % 3 - 1) * 0.14);
      ctx.fillRect(-16, -9, 32, 18);
      ctx.strokeStyle = 'rgba(100, 180, 200, 0.12)';
      ctx.strokeRect(-16, -9, 32, 18);
      ctx.restore();
    }
  }
}

function drawBones(r, game) {
  const b = game.world.bones;
  if (!visible(r, b.x, b.y, 340)) return;
  const { ctx } = r;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);
  ctx.scale(b.scale, b.scale);
  const bone = 'rgba(190, 212, 200, 0.46)';
  const boneDark = 'rgba(98, 129, 121, 0.38)';

  // Skull.
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.ellipse(132, -12, 55, 27, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(172, -20);
  ctx.lineTo(228, -5);
  ctx.lineTo(170, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(4, 18, 22, 0.65)';
  ctx.beginPath();
  ctx.arc(146, -14, 7, 0, Math.PI * 2);
  ctx.fill();

  // Spine.
  ctx.strokeStyle = bone;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-178, 0);
  ctx.quadraticCurveTo(-20, -24, 108, -8);
  ctx.stroke();

  // Ribs.
  ctx.strokeStyle = boneDark;
  ctx.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    const x = -150 + i * 31;
    const y = -4 + Math.sin(i * 0.4) * 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 8, y - 62 - i * 2, x + 16, y - 96);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 4, y + 54, x - 12, y + 82);
    ctx.stroke();
  }

  // Moss.
  ctx.strokeStyle = 'rgba(74, 162, 94, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const x = -100 + i * 56;
    ctx.beginPath();
    ctx.moveTo(x, -20);
    ctx.quadraticCurveTo(x + 12, -48, x + 2, -72);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLeviathanPearl(r, game) {
  if (game.save.leviathanPearl) return;
  const p = game.world.leviathanPearl;
  if (!visible(r, p.x, p.y, 360)) return;
  const { ctx } = r;
  const bob = Math.sin(r.time * 1.1 + p.phase) * 8;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 210);
  glow.addColorStop(0, 'rgba(255, 236, 188, 0.38)');
  glow.addColorStop(0.3, 'rgba(255, 198, 120, 0.16)');
  glow.addColorStop(1, 'rgba(255, 170, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 210, 0, Math.PI * 2);
  ctx.fill();

  // Rings.
  ctx.strokeStyle = 'rgba(255, 218, 160, 0.35)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const rr = 78 + i * 26 + Math.sin(r.time * 0.9 + i) * 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.34, r.time * 0.08 + i * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  const orb = ctx.createRadialGradient(-18, -20, 4, 0, 0, 72);
  orb.addColorStop(0, '#fffdf0');
  orb.addColorStop(0.35, '#ffe8b8');
  orb.addColorStop(0.75, '#d9a45c');
  orb.addColorStop(1, '#6a3d1d');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(0, 0, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(-22, -24, 15, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawVents(r, game) {
  const { ctx, time } = r;
  for (const vent of game.world.vents) {
    if (!visible(r, vent.x, vent.y, 320)) continue;
    const thermal = vent.type === 'thermal';
    const color = thermal ? '#ff8a4d' : '#7df0cf';
    const height = thermal ? 420 : 520;
    const bob = Math.sin(time * 0.8 + vent.phase) * 4;

    ctx.save();
    ctx.translate(vent.x, vent.y + bob);

    // Glow column.
    ctx.globalCompositeOperation = 'lighter';
    const col = ctx.createLinearGradient(0, 60, 0, -height);
    col.addColorStop(0, rgba(color, thermal ? 0.2 : 0.15));
    col.addColorStop(0.3, rgba(color, thermal ? 0.1 : 0.07));
    col.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-46, 70);
    ctx.quadraticCurveTo(-60, -height * 0.55, -26, -height);
    ctx.lineTo(30, -height);
    ctx.quadraticCurveTo(66, -height * 0.5, 46, 70);
    ctx.closePath();
    ctx.fill();

    // Mouth light.
    const mouth = ctx.createRadialGradient(0, 20, 0, 0, 20, 80);
    mouth.addColorStop(0, rgba(color, 0.3));
    mouth.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = mouth;
    ctx.beginPath();
    ctx.arc(0, 20, 80, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles.
    for (let i = 0; i < 14; i++) {
      const speed = thermal ? 56 : 44;
      const t = ((time * speed + i * 47 + vent.phase * 30) % height);
      const y = 20 - t;
      const x = Math.sin(t * 0.022 + i * 1.7 + time * 0.4) * (12 + i * 1.6);
      const size = 1.5 + (i % 4) * 1.2;
      ctx.fillStyle = rgba(thermal ? '#ffd2a2' : '#d6fffa', 0.26 + (1 - t / height) * 0.35);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      if (i % 3 === 0) {
        ctx.strokeStyle = rgba(color, 0.3);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
