(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Afterimages
  // ---------------------------------------------------------------------------
  function drawGracefulGhost(e) {
    const a = (e.life / e.maxLife) * 0.42;
    if (a <= 0.01) return;
    const s = depthScale(e.z);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(e.x, e.y);
    ctx.scale(e.facing * s, s);
    const col = e.color || '#6fe7df';
    // scarf / motion echo
    ctx.strokeStyle = col;
    ctx.globalAlpha = a * 0.5;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -129);
    ctx.quadraticCurveTo(-39, -137, -83, -118);
    ctx.stroke();
    // body
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-20, -123);
    ctx.quadraticCurveTo(-24, -93, -13, -72);
    ctx.lineTo(14, -72);
    ctx.quadraticCurveTo(23, -98, 19, -123);
    ctx.quadraticCurveTo(0, -133, -20, -123);
    ctx.closePath(); ctx.fill();
    // head
    ctx.beginPath(); ctx.arc(5, -145, 13, 0, TAU); ctx.fill();
    // legs
    ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8, -72); ctx.lineTo(-23, -35); ctx.lineTo(-30, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -72); ctx.lineTo(24, -35); ctx.lineTo(33, -3); ctx.stroke();
    // blade sweep
    ctx.strokeStyle = '#e8fffc';
    ctx.globalAlpha = a * 1.3;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(22, -102);
    ctx.quadraticCurveTo(62, -76, 79, -43);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Sword arcs, rings
  // ---------------------------------------------------------------------------
  function drawArc(e, alpha) {
    const s = depthScale(e.z);
    const t = 1 - e.life / e.maxLife;
    const grow = 0.82 + easeOut(t) * 0.28;
    const radius = e.radius * grow;
    const reverse = e.to < e.from;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.facing * s, s);
    ctx.translate(0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    const fade = Math.sin(clamp(t, 0, 1) * Math.PI) * alpha;
    // wide soft bloom, then ghost arc
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = fade * 0.035;
    ctx.lineWidth = 62;
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.94, e.from, e.to, reverse); ctx.stroke();
    ctx.globalAlpha = fade * 0.1;
    ctx.lineWidth = 30;
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.94, e.from, e.to, reverse); ctx.stroke();

    // tapered ribbon, thick at the heart of the cut
    const segs = 26;
    ctx.lineCap = 'round';
    for (let i = 0; i < segs; i++) {
      const u0 = i / segs, u1 = (i + 1.08) / segs;
      const a0 = lerp(e.from, e.to, u0);
      const a1 = lerp(e.from, e.to, u1);
      const mid = Math.sin(Math.PI * (i + 0.5) / segs);
      ctx.globalAlpha = fade * (0.2 + mid * 0.5);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.5 + mid * 11;
      ctx.beginPath(); ctx.arc(0, 0, radius, a0, a1, reverse); ctx.stroke();
    }
    // bright edge
    for (let i = 0; i < segs; i++) {
      const u0 = i / segs, u1 = (i + 1.15) / segs;
      const a0 = lerp(e.from, e.to, u0);
      const a1 = lerp(e.from, e.to, u1);
      const mid = Math.sin(Math.PI * (i + 0.5) / segs);
      ctx.globalAlpha = fade * (0.35 + mid * 0.65);
      ctx.strokeStyle = e.type === 'eslash' ? '#ffd0ae' : '#fffdf0';
      ctx.lineWidth = 0.8 + mid * 2.1;
      ctx.beginPath(); ctx.arc(0, 0, radius * 1.008, a0, a1, reverse); ctx.stroke();
    }
    // inner echo
    ctx.globalAlpha = fade * 0.28;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.84, e.from + 0.18, e.to - 0.08, reverse); ctx.stroke();

    // speed flecks along the arc
    ctx.globalAlpha = fade * 0.8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = lerp(e.from, e.to, (i + 1) / 8) + Math.sin(i * 9.7) * 0.03;
      const r1 = radius * (0.72 + (i % 3) * 0.07);
      const r2 = radius * (0.96 + (i % 2) * 0.08);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRingEffect(e) {
    const t = 1 - e.life / e.maxLife;
    const alpha = (1 - t) * 0.6;
    const s = depthScale(e.z);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(s, s);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(0.8, e.width * (1 - t));
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r, e.r * 0.24, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.4;
    ctx.lineWidth = 9 * (1 - t);
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r * 0.96, e.r * 0.23, 0, 0, TAU);
    ctx.stroke();
    // vertical shock plane for bigger rings
    if (e.maxR > 150) {
      ctx.globalAlpha = alpha * 0.22;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, -e.r * 0.24, e.r * 0.52, e.r * 0.46, 0, Math.PI, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhosts() {
    for (const e of G.effects) {
      if (e.type === 'ghost') drawGracefulGhost(e);
    }
  }

  function drawEffectsFront() {
    for (const e of G.effects) {
      if (e.type === 'slash' || e.type === 'eslash') drawArc(e, 1);
      else if (e.type === 'ring') drawRingEffect(e);
    }
  }

  // ---------------------------------------------------------------------------
  // Projectiles
  // ---------------------------------------------------------------------------
  function drawProjectiles() {
    for (const p of G.projectiles) {
      const s = depthScale(p.z);
      const y = groundY(p.z) - 98 * s;
      ctx.save();
      ctx.translate(p.x, y);
      ctx.scale(s, s);
      if (p.kind === 'kunai') {
        ctx.save();
        ctx.rotate(p.spin);
        ctx.shadowColor = '#8ff9f1';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#dffffa';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = i / 4 * TAU;
          ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
          ctx.lineTo(Math.cos(a + TAU / 8) * 4.5, Math.sin(a + TAU / 8) * 4.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#7bd8d2';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
        ctx.restore();
        // trail
        ctx.strokeStyle = 'rgba(137,246,238,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.vx * 0.025, 0);
        ctx.lineTo(-p.vx * 0.008, 0);
        ctx.stroke();
      } else {
        const ang = Math.atan2((p.vz || 0) * GROUND_DEPTH * 0.4, p.vx);
        ctx.rotate(ang);
        ctx.strokeStyle = 'rgba(255,108,80,0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-8, 0); ctx.stroke();
        ctx.strokeStyle = '#d7c3a4';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(18, 0); ctx.stroke();
        ctx.fillStyle = '#d0c4ae';
        ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(14, -3.5); ctx.lineTo(14, 3.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#722021';
        ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-25, -4); ctx.lineTo(-22, 0); ctx.lineTo(-25, 4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Particles
  // ---------------------------------------------------------------------------
  function drawParticles() {
    for (const p of G.particles) {
      const life = clamp(p.life / p.maxLife, 0, 1);
      const s = depthScale(p.z);
      const size = p.size * s;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = life * (p.alpha ?? 1);
      if (p.kind === 'spark') {
        ctx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
        if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.6, size * 0.42);
        ctx.lineCap = 'round';
        const vx = p.vx * 0.018, vy = p.vy * 0.018;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-vx, -vy);
        ctx.stroke();
      } else if (p.kind === 'ink') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.62, p.rot, 0, TAU);
        ctx.fill();
      } else if (p.kind === 'petal') {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.quadraticCurveTo(0, -size * 0.9, size, 0);
        ctx.quadraticCurveTo(0, size * 0.45, -size, 0);
        ctx.fill();
      } else if (p.kind === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha *= 0.32;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, TAU);
        ctx.fill();
      } else {
        // dust
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawTexts() {
    for (const t of G.texts) {
      const life = clamp(t.life / t.maxLife, 0, 1);
      const s = depthScale(t.z);
      const pop = 1 + (1 - life) * 0.2;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(s * pop, s * pop);
      ctx.globalAlpha = Math.min(1, life * 2.2);
      ctx.font = `700 ${t.size}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(3,4,8,0.7)';
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Screen effects
  // ---------------------------------------------------------------------------
  function drawSpeedLines() {
    const p = G.player;
    if (!p) return;
    const special = p.state === 'special';
    const dash = p.state === 'dash';
    if (!special && !dash) return;
    const W = view.W, H = view.H;
    const cx = W / 2, cy = H * 0.58;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    const count = special ? 42 : 16;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + G.time * (special ? 2.4 : 0.7);
      const inner = (special ? 0.18 : 0.32) * Math.min(W, H) * (0.65 + ((i * 7) % 5) / 8);
      const outer = inner + (special ? 250 : 130) * (0.4 + ((i * 3) % 7) / 8);
      ctx.strokeStyle = special ? `rgba(130,255,245,${0.05 + (i % 5) * 0.01})` : 'rgba(139,233,228,0.08)';
      ctx.lineWidth = special ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
    if (dash) {
      const dir = p.dashDirX >= 0 ? 1 : -1;
      for (let i = 0; i < 8; i++) {
        const y = H * (0.25 + i * 0.075) + Math.sin(i * 4.1) * 15;
        ctx.strokeStyle = 'rgba(136,235,228,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W / 2 + dir * (60 + i * 15), y);
        ctx.lineTo(W / 2 + dir * (140 + i * 52), y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawSpecialOverlay() {
    const p = G.player;
    if (!p) return;
    const special = p.state === 'special';
    const bossDead = G.victoryTimer != null;
    if (!special && !bossDead) return;
    const W = view.W, H = view.H;
    ctx.save();
    if (special) {
      const g = ctx.createRadialGradient(W / 2, H * 0.5, 40, W / 2, H * 0.5, W * 0.65);
      g.addColorStop(0, 'rgba(8,18,24,0.02)');
      g.addColorStop(0.5, 'rgba(7,20,25,0.25)');
      g.addColorStop(1, 'rgba(1,5,10,0.68)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#5ce9e1';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function drawBossIntroGlow() {
    if (G.waveIndex !== 4) return;
  }

  Object.assign(window, {
    drawGhosts, drawEffectsFront, drawProjectiles, drawParticles, drawTexts,
    drawSpeedLines, drawSpecialOverlay, drawBossIntroGlow
  });
})();
