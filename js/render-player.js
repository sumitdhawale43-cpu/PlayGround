/* The player's salvage submarine — a warm yellow light in a very large dark. */
import { TAU, clamp, rgba, mixColor } from './utils.js';

function playerPose(r, game) {
  const p = game.player;
  const [sx, sy] = r.screen(p.x, p.y);
  const bob = Math.sin(game.time * 1.6 + 0.8) * 1.8 * r.zoom;
  const speed = Math.max(60, p.speed || 240);
  const tilt = clamp(p.vy / speed, -1, 1) * 0.23 + Math.sin(game.time * 1.1) * 0.012;
  return { sx, sy: sy + bob, tilt };
}

export function drawHeadlight(r, game) {
  const p = game.player;
  if (!p.lightsOn) return;
  const ctx = r.ctx;
  const { sx, sy, tilt } = playerPose(r, game);
  const facing = p.facing || 1;
  const lamp = p.lampScale || 1;
  const depth = clamp((game.camera.y - 900) / 2600, 0, 1);
  const len = (300 + 160 * lamp) * r.zoom;
  const spread = (0.32 + 0.03 * lamp);
  const wob = Math.sin(game.time * 0.9) * 0.012;

  ctx.save();
  ctx.translate(sx + facing * 22 * r.zoom, sy - 1 * r.zoom);
  const angle = facing === 1 ? tilt * 0.55 + wob : Math.PI - tilt * 0.55 - wob;
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'screen';

  // Broad cone.
  const grad = ctx.createLinearGradient(0, 0, len, 0);
  const strength = 0.19 + depth * 0.16;
  grad.addColorStop(0, `rgba(255,244,186,${strength + 0.08})`);
  grad.addColorStop(0.22, `rgba(255,234,165,${strength * 0.78})`);
  grad.addColorStop(0.62, `rgba(255,222,142,${strength * 0.28})`);
  grad.addColorStop(1, 'rgba(255,216,130,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -14 * r.zoom);
  ctx.quadraticCurveTo(len * 0.36, -len * spread * 0.46, len, -len * spread);
  ctx.lineTo(len, len * spread);
  ctx.quadraticCurveTo(len * 0.36, len * spread * 0.46, 0, 14 * r.zoom);
  ctx.closePath();
  ctx.fill();

  // Hot inner cone.
  const inner = ctx.createLinearGradient(0, 0, len * 0.85, 0);
  inner.addColorStop(0, `rgba(255,251,220,${strength * 0.85})`);
  inner.addColorStop(0.4, `rgba(255,241,180,${strength * 0.2})`);
  inner.addColorStop(1, 'rgba(255,235,170,0)');
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.moveTo(0, -7 * r.zoom);
  ctx.quadraticCurveTo(len * 0.32, -len * spread * 0.2, len * 0.82, -len * spread * 0.44);
  ctx.lineTo(len * 0.82, len * spread * 0.44);
  ctx.quadraticCurveTo(len * 0.32, len * spread * 0.2, 0, 7 * r.zoom);
  ctx.closePath();
  ctx.fill();

  // Lamp bloom.
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 42 * r.zoom);
  glow.addColorStop(0, 'rgba(255,253,224,.7)');
  glow.addColorStop(0.3, 'rgba(255,234,160,.24)');
  glow.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 42 * r.zoom, 0, TAU); ctx.fill();
  ctx.restore();
}

export function drawPlayer(r, game) {
  const ctx = r.ctx;
  const p = game.player;
  if (game.mode === 'title' && !game.titleSub) return;
  const { sx, sy, tilt } = playerPose(r, game);
  const facing = p.facing || 1;
  const invuln = p.invulnerable > 0;
  const flicker = invuln ? 0.55 + 0.45 * Math.abs(Math.sin(game.time * 18)) : 1;
  const boosting = p.boosting;

  const ctxGlow = ctx;
  ctxGlow.save();
  ctxGlow.globalAlpha = flicker;
  ctxGlow.translate(sx, sy);
  ctxGlow.scale(facing * r.zoom, r.zoom);
  ctxGlow.rotate(tilt);

  // Prop wash glow and exhaust.
  if (boosting) {
    const g = ctxGlow.createRadialGradient(-58, 2, 2, -58, 2, 42);
    g.addColorStop(0, 'rgba(255,241,190,.7)');
    g.addColorStop(0.3, 'rgba(255,193,92,.28)');
    g.addColorStop(1, 'rgba(255,166,50,0)');
    ctxGlow.fillStyle = g;
    ctxGlow.beginPath(); ctxGlow.arc(-58, 2, 42, 0, TAU); ctxGlow.fill();
    ctxGlow.fillStyle = 'rgba(255,221,140,.5)';
    ctxGlow.beginPath();
    ctxGlow.moveTo(-50, -4);
    ctxGlow.lineTo(-70 - Math.sin(game.time * 25) * 5, 2);
    ctxGlow.lineTo(-50, 8);
    ctxGlow.closePath();
    ctxGlow.fill();
  } else {
    const g = ctxGlow.createRadialGradient(-55, 2, 1, -55, 2, 22);
    g.addColorStop(0, 'rgba(255,232,160,.3)');
    g.addColorStop(1, 'rgba(255,210,120,0)');
    ctxGlow.fillStyle = g;
    ctxGlow.beginPath(); ctxGlow.arc(-55, 2, 22, 0, TAU); ctxGlow.fill();
  }

  // Propeller.
  const propSpin = game.time * (boosting ? 26 : 15);
  ctxGlow.save();
  ctxGlow.translate(-48, 1);
  const brass = ctxGlow.createLinearGradient(-4, -9, 4, 9);
  brass.addColorStop(0, '#f8dc8d');
  brass.addColorStop(0.5, '#b88023');
  brass.addColorStop(1, '#5c3a0e');
  ctxGlow.fillStyle = brass;
  ctxGlow.beginPath(); ctxGlow.arc(0, 0, 4, 0, TAU); ctxGlow.fill();
  for (let i = 0; i < 3; i++) {
    ctxGlow.save();
    ctxGlow.rotate(propSpin + i * TAU / 3);
    ctxGlow.beginPath();
    ctxGlow.ellipse(0, -8, 2.2, 7, 0.16, 0, TAU);
    ctxGlow.fillStyle = 'rgba(246,211,118,.72)';
    ctxGlow.fill();
    ctxGlow.restore();
  }
  ctxGlow.restore();

  // Tail fins.
  const finG = ctxGlow.createLinearGradient(-46, -18, -46, 18);
  finG.addColorStop(0, '#e0a62d');
  finG.addColorStop(1, '#8d5a10');
  ctxGlow.fillStyle = finG;
  ctxGlow.beginPath();
  ctxGlow.moveTo(-33, -13);
  ctxGlow.quadraticCurveTo(-49, -24, -53, -27);
  ctxGlow.quadraticCurveTo(-47, -10, -42, -5);
  ctxGlow.closePath();
  ctxGlow.fill();
  ctxGlow.beginPath();
  ctxGlow.moveTo(-33, 13);
  ctxGlow.quadraticCurveTo(-49, 24, -53, 27);
  ctxGlow.quadraticCurveTo(-47, 10, -42, 5);
  ctxGlow.closePath();
  ctxGlow.fill();

  // Hull.
  const hull = ctxGlow.createLinearGradient(0, -24, 0, 24);
  hull.addColorStop(0, '#fff0a1');
  hull.addColorStop(0.18, '#ffe078');
  hull.addColorStop(0.5, '#f5bb3d');
  hull.addColorStop(0.78, '#d48d20');
  hull.addColorStop(1, '#985c0d');
  ctxGlow.fillStyle = hull;
  ctxGlow.beginPath();
  ctxGlow.moveTo(47, 2);
  ctxGlow.bezierCurveTo(43, -15, 26, -23, 2, -23);
  ctxGlow.bezierCurveTo(-24, -23, -39, -15, -42, -4);
  ctxGlow.quadraticCurveTo(-45, 9, -34, 16);
  ctxGlow.bezierCurveTo(-13, 24, 24, 21, 40, 12);
  ctxGlow.quadraticCurveTo(46, 8, 47, 2);
  ctxGlow.closePath();
  ctxGlow.fill();
  ctxGlow.strokeStyle = 'rgba(54,32,3,.55)';
  ctxGlow.lineWidth = 1.2;
  ctxGlow.stroke();

  // Belly shadow / keel.
  const belly = ctxGlow.createLinearGradient(0, 0, 0, 22);
  belly.addColorStop(0, 'rgba(91,48,0,0)');
  belly.addColorStop(1, 'rgba(65,35,0,.42)');
  ctxGlow.fillStyle = belly;
  ctxGlow.beginPath();
  ctxGlow.moveTo(39, 12);
  ctxGlow.bezierCurveTo(19, 22, -14, 24, -33, 16);
  ctxGlow.bezierCurveTo(-16, 20, 12, 17, 31, 8);
  ctxGlow.closePath();
  ctxGlow.fill();
  ctxGlow.fillStyle = '#6b430c';
  ctxGlow.beginPath();
  ctxGlow.ellipse(4, 19, 27, 3.2, 0.02, 0, TAU);
  ctxGlow.fill();

  // Panel seams, rivets, white waterline.
  ctxGlow.strokeStyle = 'rgba(109,63,8,.28)';
  ctxGlow.lineWidth = 0.9;
  ctxGlow.beginPath();
  ctxGlow.moveTo(-36, -7);
  ctxGlow.quadraticCurveTo(-14, -19, 24, -17);
  ctxGlow.stroke();
  ctxGlow.beginPath();
  ctxGlow.moveTo(-31, 12);
  ctxGlow.quadraticCurveTo(-8, 6, 27, 8);
  ctxGlow.stroke();
  ctxGlow.strokeStyle = 'rgba(255,250,212,.4)';
  ctxGlow.lineWidth = 2;
  ctxGlow.beginPath();
  ctxGlow.moveTo(-28, 14);
  ctxGlow.quadraticCurveTo(-4, 20, 30, 13);
  ctxGlow.stroke();
  ctxGlow.fillStyle = 'rgba(103,59,4,.5)';
  for (const [x, y] of [[-30, -9], [-19, -13], [-19, 12], [-4, 15], [14, -16], [27, -8], [30, 9], [17, 16]]) {
    ctxGlow.beginPath(); ctxGlow.arc(x, y, 0.9, 0, TAU); ctxGlow.fill();
  }

  // Top skid / mast.
  ctxGlow.fillStyle = '#cd8f26';
  ctxGlow.beginPath();
  ctxGlow.moveTo(-20, -22); ctxGlow.lineTo(-17, -30); ctxGlow.lineTo(-11, -30); ctxGlow.lineTo(-9, -22); ctxGlow.closePath(); ctxGlow.fill();
  ctxGlow.strokeStyle = 'rgba(93,57,12,.85)';
  ctxGlow.lineWidth = 1.2;
  ctxGlow.beginPath(); ctxGlow.moveTo(-15, -29); ctxGlow.lineTo(-14, -42); ctxGlow.stroke();
  const mastLight = 0.7 + 0.3 * Math.sin(game.time * 3);
  ctxGlow.fillStyle = `rgba(112,255,235,${mastLight})`;
  ctxGlow.beginPath(); ctxGlow.arc(-14, -43, 1.7, 0, TAU); ctxGlow.fill();
  const mastGlow = ctxGlow.createRadialGradient(-14, -43, 0, -14, -43, 14);
  mastGlow.addColorStop(0, 'rgba(112,255,235,.35)');
  mastGlow.addColorStop(1, 'rgba(112,255,235,0)');
  ctxGlow.fillStyle = mastGlow;
  ctxGlow.beginPath(); ctxGlow.arc(-14, -43, 14, 0, TAU); ctxGlow.fill();

  // Sonar dish on top rear.
  ctxGlow.save();
  ctxGlow.translate(22, -22);
  ctxGlow.rotate(-0.3);
  ctxGlow.fillStyle = '#6f470c';
  ctxGlow.beginPath(); ctxGlow.ellipse(0, 0, 8, 2.6, 0, 0, TAU); ctxGlow.fill();
  ctxGlow.strokeStyle = 'rgba(255,231,150,.35)';
  ctxGlow.lineWidth = 0.8;
  ctxGlow.beginPath(); ctxGlow.ellipse(0, 0, 8, 2.6, 0, 0, TAU); ctxGlow.stroke();
  ctxGlow.restore();

  // Cockpit dome.
  const dome = ctxGlow.createRadialGradient(2, -25, 1, 8, -17, 18);
  dome.addColorStop(0, 'rgba(225,255,255,.92)');
  dome.addColorStop(0.3, 'rgba(121,238,243,.7)');
  dome.addColorStop(0.72, 'rgba(23,113,137,.86)');
  dome.addColorStop(1, 'rgba(6,52,75,.96)');
  ctxGlow.fillStyle = dome;
  ctxGlow.beginPath();
  ctxGlow.arc(8, -16, 14.5, Math.PI * 0.98, Math.PI * 2.08);
  ctxGlow.lineTo(22.2, -12);
  ctxGlow.arc(8, -16, 14.5, Math.PI * 0.04, Math.PI * 0.98);
  ctxGlow.closePath();
  ctxGlow.fill();
  ctxGlow.strokeStyle = '#dba52e';
  ctxGlow.lineWidth = 2.2;
  ctxGlow.stroke();
  // Dome highlight.
  ctxGlow.strokeStyle = 'rgba(240,255,255,.55)';
  ctxGlow.lineWidth = 1.1;
  ctxGlow.beginPath();
  ctxGlow.arc(5, -19, 9, Math.PI * 1.06, Math.PI * 1.62);
  ctxGlow.stroke();
  // Pilot silhouette.
  ctxGlow.fillStyle = 'rgba(2,24,34,.62)';
  ctxGlow.beginPath(); ctxGlow.arc(11, -17, 4.6, 0, TAU); ctxGlow.fill();
  ctxGlow.beginPath(); ctxGlow.ellipse(9, -8.5, 8, 4.4, -0.1, 0, Math.PI); ctxGlow.fill();

  // Side porthole.
  ctxGlow.fillStyle = '#082632';
  ctxGlow.beginPath(); ctxGlow.arc(-17, -4, 4.3, 0, TAU); ctxGlow.fill();
  ctxGlow.strokeStyle = 'rgba(248,209,112,.75)';
  ctxGlow.lineWidth = 1.4;
  ctxGlow.stroke();
  ctxGlow.fillStyle = 'rgba(167,248,255,.38)';
  ctxGlow.beginPath(); ctxGlow.arc(-18.3, -5.2, 1.3, 0, TAU); ctxGlow.fill();

  // Headlight housings.
  ctxGlow.fillStyle = '#6c450c';
  ctxGlow.beginPath(); ctxGlow.ellipse(43, 2, 3.8, 5, 0, 0, TAU); ctxGlow.fill();
  ctxGlow.fillStyle = '#fff9d6';
  ctxGlow.beginPath(); ctxGlow.arc(44, 2, 2.2, 0, TAU); ctxGlow.fill();
  const lens = ctxGlow.createRadialGradient(44, 2, 0, 44, 2, 15);
  lens.addColorStop(0, 'rgba(255,252,218,.8)');
  lens.addColorStop(1, 'rgba(255,241,170,0)');
  ctxGlow.fillStyle = lens;
  ctxGlow.beginPath(); ctxGlow.arc(44, 2, 15, 0, TAU); ctxGlow.fill();

  // Claw arm.
  ctxGlow.strokeStyle = '#c28a24';
  ctxGlow.lineWidth = 2.5;
  ctxGlow.lineCap = 'round';
  ctxGlow.beginPath();
  ctxGlow.moveTo(16, 18);
  ctxGlow.quadraticCurveTo(24, 27, 32, 24);
  ctxGlow.stroke();
  ctxGlow.strokeStyle = '#dcaa3a';
  ctxGlow.lineWidth = 1.7;
  ctxGlow.beginPath(); ctxGlow.moveTo(32, 24); ctxGlow.lineTo(37, 20); ctxGlow.moveTo(32, 24); ctxGlow.lineTo(37, 29); ctxGlow.stroke();
  ctxGlow.fillStyle = '#f6cf6a';
  ctxGlow.beginPath(); ctxGlow.arc(32, 24, 2, 0, TAU); ctxGlow.fill();

  // Warm rim light.
  ctxGlow.strokeStyle = 'rgba(255,252,211,.45)';
  ctxGlow.lineWidth = 1.2;
  ctxGlow.beginPath();
  ctxGlow.moveTo(30, -20);
  ctxGlow.quadraticCurveTo(45, -12, 46, 3);
  ctxGlow.stroke();

  // Damage smoke.
  if (p.health / p.healthMax < 0.35) {
    for (let i = 0; i < 2; i++) {
      const t = (game.time * 0.7 + i * 0.5) % 1;
      ctxGlow.globalAlpha = (1 - t) * 0.25;
      ctxGlow.fillStyle = '#07131a';
      ctxGlow.beginPath();
      ctxGlow.arc(-34 - t * 30, -8 - t * 22, 2 + t * 7, 0, TAU);
      ctxGlow.fill();
    }
    ctxGlow.globalAlpha = flicker;
  }
  ctxGlow.restore();
}
