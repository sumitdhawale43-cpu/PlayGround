import { clamp, rgba, roundRect } from '../utils.js';

export function drawPlayer(r, game) {
  const { ctx, time } = r;
  const p = game.player;
  const bob = Math.sin(time * 2.2) * 1.6;
  const flicker = p.invuln > 0 && Math.floor(time * 18) % 2 === 0;

  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.rotate(p.angle);
  ctx.globalAlpha = flicker ? 0.55 : 1;

  // Thruster halo.
  ctx.globalCompositeOperation = 'lighter';
  const thrust = ctx.createRadialGradient(-40, 0, 0, -40, 0, p.boosting ? 54 : 32);
  thrust.addColorStop(0, `rgba(130, 240, 255, ${p.boosting ? 0.35 : 0.18})`);
  thrust.addColorStop(1, 'rgba(130, 240, 255, 0)');
  ctx.fillStyle = thrust;
  ctx.beginPath();
  ctx.arc(-40, 0, p.boosting ? 54 : 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Rear fins.
  ctx.fillStyle = '#143c46';
  ctx.beginPath();
  ctx.moveTo(-24, -12);
  ctx.lineTo(-42, -34);
  ctx.lineTo(-50, -10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-24, 12);
  ctx.lineTo(-42, 34);
  ctx.lineTo(-50, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 220, 220, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Main hull.
  const hull = ctx.createLinearGradient(0, -16, 0, 16);
  hull.addColorStop(0, '#d9f3f0');
  hull.addColorStop(0.22, '#8cb9b8');
  hull.addColorStop(0.55, '#3f7378');
  hull.addColorStop(1, '#12363f');
  ctx.fillStyle = hull;
  roundRect(ctx, -36, -14, 72, 28, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(8, 32, 39, 0.6)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Belly stripe.
  ctx.fillStyle = 'rgba(255, 184, 94, 0.85)';
  ctx.beginPath();
  ctx.moveTo(-20, 11);
  ctx.quadraticCurveTo(10, 15, 30, 8);
  ctx.lineTo(29, 11);
  ctx.quadraticCurveTo(8, 18, -20, 14);
  ctx.closePath();
  ctx.fill();

  // Panel lines and rivets.
  ctx.strokeStyle = 'rgba(9, 38, 44, 0.38)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-18, -13);
  ctx.lineTo(-18, 12);
  ctx.moveTo(18, -12);
  ctx.lineTo(18, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(220, 250, 248, 0.55)';
  for (const [x, y] of [[-24, -8], [-24, 7], [23, -7], [23, 8]]) {
    ctx.beginPath();
    ctx.arc(x, y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cockpit.
  const glass = ctx.createRadialGradient(9, -7, 1, 8, 0, 15);
  glass.addColorStop(0, 'rgba(222, 255, 255, 0.95)');
  glass.addColorStop(0.3, 'rgba(96, 228, 238, 0.8)');
  glass.addColorStop(0.75, 'rgba(17, 94, 113, 0.9)');
  glass.addColorStop(1, 'rgba(6, 39, 53, 0.95)');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.ellipse(9, 0, 13.5, 11.5, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(208, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Glass highlight.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(5, -5, 4.5, 2.4, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // Pilot silhouette.
  ctx.fillStyle = 'rgba(5, 33, 43, 0.5)';
  ctx.beginPath();
  ctx.ellipse(10, 2, 4, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Headlamp housing.
  ctx.fillStyle = '#1c4a52';
  roundRect(ctx, 30, -5.5, 9, 11, 2);
  ctx.fill();
  ctx.fillStyle = '#d8ffff';
  ctx.beginPath();
  ctx.arc(38, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  const lampGlow = ctx.createRadialGradient(39, 0, 0, 39, 0, 22);
  lampGlow.addColorStop(0, 'rgba(220, 255, 255, 0.6)');
  lampGlow.addColorStop(1, 'rgba(180, 250, 255, 0)');
  ctx.fillStyle = lampGlow;
  ctx.beginPath();
  ctx.arc(39, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Nose skid.
  ctx.strokeStyle = 'rgba(150, 220, 220, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(34, 8);
  ctx.quadraticCurveTo(44, 9, 50, 4);
  ctx.stroke();

  // Propeller.
  ctx.save();
  ctx.translate(-38, 0);
  const spin = time * (p.boosting ? 26 : 12);
  ctx.rotate(spin);
  ctx.fillStyle = 'rgba(160, 210, 210, 0.7)';
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i / 3) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, -7, 2.2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#8fb7b6';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hull number.
  ctx.save();
  ctx.translate(-4, 1);
  ctx.rotate(Math.PI / 2);
  ctx.font = '5.5px "Outfit", sans-serif';
  ctx.fillStyle = 'rgba(215, 250, 248, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('N–07', 0, 0);
  ctx.restore();

  // Damage flash.
  if (p.hitFlash > 0) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255, 60, 50, ${clamp(p.hitFlash * 0.5, 0, 0.45)})`;
    roundRect(ctx, -36, -14, 72, 28, 14);
    ctx.fill();
  }

  ctx.restore();

  // Bubble halo around the sub.
  if (p.boosting) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(180, 250, 255, 0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const t = (time * 2 + i * 0.33) % 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24 + t * 46, 0, Math.PI * 2);
      ctx.globalAlpha = (1 - t) * 0.4;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawParticles(r, game) {
  const { ctx } = r;
  ctx.save();
  for (const p of game.particles.items) {
    const life = clamp(p.life / p.maxLife, 0, 1);
    if (p.kind === 'bubble') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(190, 250, 255, ${0.4 * life * (p.alpha || 1)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(210, 255, 255, ${0.1 * life})`;
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * life})`;
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.28, p.y - p.size * 0.3, Math.max(0.4, p.size * 0.22), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(p.color, 0.85 * life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * life, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(p.color, 0.18 * life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3 * life, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawEffects(r, game) {
  const { ctx } = r;
  for (const e of game.effects) {
    const t = 1 - e.life / e.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (e.type === 'pulse') {
      const rad = e.radius * (0.15 + t * 0.95);
      const alpha = (1 - t) * 0.55;
      ctx.strokeStyle = `rgba(160, 250, 255, ${alpha})`;
      ctx.lineWidth = 3 * (1 - t) + 0.6;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(120, 220, 255, ${alpha * 0.45})`;
      ctx.lineWidth = 8 * (1 - t) + 0.4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(e.x, e.y, rad * 0.6, e.x, e.y, rad);
      g.addColorStop(0, 'rgba(120, 235, 255, 0)');
      g.addColorStop(0.8, `rgba(120, 235, 255, ${alpha * 0.15})`);
      g.addColorStop(1, 'rgba(120, 235, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'sonar') {
      const rad = e.radius * t;
      ctx.strokeStyle = `rgba(125, 240, 207, ${(1 - t) * 0.5})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(125, 240, 207, ${(1 - t) * 0.18})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rad * 0.65, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.type === 'pickup') {
      ctx.strokeStyle = rgba(e.color || '#9ffbff', (1 - t) * 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 12 + t * 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
