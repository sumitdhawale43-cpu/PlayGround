(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Shared shape helpers
  // ---------------------------------------------------------------------------
  function shadow(x, y, s, r = 46, a = 0.5) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s * 0.24);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function limb(x1, y1, x2, y2, w, color, cap = 'round') {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = cap;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function joint(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  function boot(x, y, angle, s, color = '#090b12') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(6 * s, 1.4 * s, 12 * s, 4.3 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(210,195,166,0.12)';
    ctx.beginPath();
    ctx.ellipse(9 * s, -0.2 * s, 5 * s, 1.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function scarfWave(anim, speed, dash) {
    const base = Math.sin(anim * 2.1) * 4 + Math.sin(anim * 4.7) * 1.8;
    const len = dash ? 126 : speed ? 92 : 76;
    return { base, len };
  }

  function drawScarf(anim, speed, dash, color = '#b53a34', alpha = 1) {
    const { base, len } = scarfWave(anim, speed, dash);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    const points = [
      { x: -4, y: -132 },
      { x: -26, y: -135 + base * 0.6 },
      { x: -52, y: -124 + base },
      { x: -len, y: -112 + base * 1.8 + (dash ? 8 : 0) }
    ];
    const g = ctx.createLinearGradient(0, -132, -len, -100);
    g.addColorStop(0, color);
    g.addColorStop(0.6, '#8d2528');
    g.addColorStop(1, 'rgba(77,16,23,0.2)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    ctx.stroke();
    // lit upper edge
    ctx.strokeStyle = 'rgba(228,96,79,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -136);
    ctx.bezierCurveTo(-28, -140 + base * 0.6, -50, -129 + base, -len, -117 + base * 1.8);
    ctx.stroke();
    // torn second tail
    ctx.strokeStyle = 'rgba(95,22,27,0.7)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-4, -128);
    ctx.bezierCurveTo(-35, -120 + base, -58, -108 + base, -len * 0.78, -96 + base * 1.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawKatana(handX, handY, angle, length = 108, glow = 0, color = '#d9d6ca') {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const px = -dy, py = dx;
    const hx = handX - dx * 19, hy = handY - dy * 19;
    const tipX = handX + dx * length, tipY = handY + dy * length;

    // handle
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#171920';
    ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(handX + dx * 3, handY + dy * 3); ctx.stroke();
    ctx.strokeStyle = 'rgba(201,165,104,0.55)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(hx + dx * t * 20 - px * 3, hy + dy * t * 20 - py * 3);
      ctx.lineTo(hx + dx * t * 20 + px * 3, hy + dy * t * 20 + py * 3);
      ctx.stroke();
    }
    // guard
    ctx.strokeStyle = '#a88750';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(handX - px * 7, handY - py * 7);
    ctx.lineTo(handX + px * 7, handY + py * 7);
    ctx.stroke();

    // blade
    if (glow > 0) {
      ctx.shadowColor = 'rgba(182,255,248,0.9)';
      ctx.shadowBlur = 10 + glow * 16;
    }
    const grad = ctx.createLinearGradient(handX, handY, tipX, tipY);
    grad.addColorStop(0, '#7f8589');
    grad.addColorStop(0.25, color);
    grad.addColorStop(0.75, '#f2f3ee');
    grad.addColorStop(1, '#b9c4c6');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4.4;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(handX + dx * 4, handY + dy * 4);
    ctx.quadraticCurveTo(handX + dx * length * 0.55 + px * 2.7, handY + dy * length * 0.55 + py * 2.7, tipX, tipY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(handX + dx * 8 - px * 1.4, handY + dy * 8 - py * 1.4);
    ctx.quadraticCurveTo(handX + dx * length * 0.55 - px * 0.9, handY + dy * length * 0.55 - py * 0.9, tipX - dx * 2, tipY - dy * 2);
    ctx.stroke();
    // tsuba glint
    ctx.fillStyle = '#d7b477';
    ctx.beginPath(); ctx.arc(handX, handY, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSpear(handX, handY, angle, length, glow = 0) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const tipX = handX + dx * length, tipY = handY + dy * length;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2b1d19';
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(handX - dx * 55, handY - dy * 55); ctx.lineTo(tipX, tipY); ctx.stroke();
    if (glow > 0) {
      ctx.shadowColor = 'rgba(255,90,70,0.9)';
      ctx.shadowBlur = glow * 12;
    }
    ctx.fillStyle = '#d7d1c1';
    ctx.beginPath();
    ctx.moveTo(tipX + dx * 19, tipY + dy * 19);
    ctx.lineTo(tipX - dy * 4, tipY + dx * 4);
    ctx.lineTo(tipX + dx * 3, tipY + dy * 3);
    ctx.lineTo(tipX + dy * 4, tipY - dx * 4);
    ctx.closePath();
    ctx.fill();
    // red tassel
    ctx.strokeStyle = '#a7312f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(handX + dx * 12, handY + dy * 12);
    ctx.quadraticCurveTo(handX + dx * 2 - dy * 7, handY + dy * 2 + dx * 7, handX + dx * 36, handY + dy * 36);
    ctx.stroke();
    ctx.restore();
  }

  function drawClub(handX, handY, angle, s = 1, glow = 0) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const px = -dy, py = dx;
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(angle);
    if (glow > 0) {
      ctx.shadowColor = 'rgba(255,92,58,0.8)';
      ctx.shadowBlur = glow * 16;
    }
    ctx.fillStyle = '#1b1414';
    ctx.beginPath();
    ctx.moveTo(-42, -2.5);
    ctx.lineTo(10, -5);
    ctx.lineTo(74, -13);
    ctx.quadraticCurveTo(94, 0, 74, 13);
    ctx.lineTo(10, 5);
    ctx.lineTo(-42, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(153,108,72,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // spikes
    ctx.fillStyle = '#b0a38c';
    for (let i = 0; i < 4; i++) {
      const x = 24 + i * 15;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x + 6, -21);
      ctx.lineTo(x + 10, -9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBow(x, y, angle, pull, glow = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (glow > 0) {
      ctx.shadowColor = 'rgba(255,90,66,0.6)';
      ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = '#8b6b43';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(32, 0, 0, 34);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(228,215,190,0.65)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(-10 - pull * 12, 0);
    ctx.lineTo(0, 34);
    ctx.stroke();
    // arrow
    ctx.strokeStyle = '#d9cdb5';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14 - pull * 10, 0);
    ctx.lineTo(33, 0);
    ctx.stroke();
    ctx.fillStyle = '#b5aa96';
    ctx.beginPath();
    ctx.moveTo(38, 0); ctx.lineTo(28, -3.6); ctx.lineTo(28, 3.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------
  function drawPlayer(p) {
    if (!p) return;
    const s = depthScale(p.z);
    const fy = groundY(p.z);
    shadow(p.x, fy, s * 1.01, 55, 0.55);

    if (p.shadow >= 100 && !p.dead) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const aura = ctx.createRadialGradient(p.x, fy - 76 * s, 5, p.x, fy - 76 * s, 95 * s);
      aura.addColorStop(0, 'rgba(121,235,228,0.09)');
      aura.addColorStop(0.6, 'rgba(109,215,210,0.035)');
      aura.addColorStop(1, 'rgba(65,170,180,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(p.x, fy - 76 * s, 95 * s, 0, TAU); ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(p.x, fy);
    ctx.scale(p.facing * s, s);
    if (p.dead) {
      const t = clamp((G.deathTimer ?? 0) / 1.4, 0, 1);
      ctx.translate(-15 * t, 0);
      ctx.rotate(-0.75 * t);
    }

    const run = p.state === 'run';
    const dash = p.state === 'dash' || p.state === 'special';
    const attack = p.state === 'attack' ? ATTACKS[p.attackStep - 1] : null;
    const hurt = p.state === 'hurt';
    const kunai = p.state === 'kunai';
    const breathe = Math.sin(p.anim * 2.2) * 1.4;
    let lean = run ? 0.14 : 0.01;
    let crouch = 0;
    let swordAngle = 1.12;
    let swordGlow = 0;
    let armReach = 39;
    let bob = run ? Math.abs(Math.sin(p.runPhase)) * -3.2 : breathe * 0.55;

    if (attack) {
      const spec = attack;
      const q = clamp((p.timer - spec.startup * 0.22) / (spec.startup + spec.active * 0.95), 0, 1);
      const e = easeOut(q);
      if (p.attackStep === 1) swordAngle = lerp(-2.24, 0.92, e);
      else if (p.attackStep === 2) swordAngle = lerp(2.35, -1.18, e);
      else swordAngle = lerp(-2.9, 2.75, e);
      lean = p.attackStep === 3 ? 0.23 : 0.16;
      crouch = p.attackStep === 3 ? 5 : 1.5;
      swordGlow = p.attackStep === 3 ? 1 : 0.55;
      armReach = p.attackStep === 3 ? 48 : 44;
      bob = 0;
    } else if (dash) {
      lean = 0.4;
      crouch = 3;
      swordAngle = 1.48;
      armReach = 45;
      bob = 0;
    } else if (hurt) {
      lean = -0.2;
      swordAngle = 1.5;
      bob = 3;
    } else if (kunai) {
      lean = 0.11;
      swordAngle = 1.3;
      bob = 0;
    }

    const hipY = -70 + crouch;
    let feet;
    if (dash) {
      feet = { back: { x: -17, y: -13 }, front: { x: 37, y: -4 }, backKnee: { x: -25, y: -37 }, frontKnee: { x: 23, y: -35 } };
    } else if (attack) {
      feet = { back: { x: -35, y: 0 }, front: { x: 38, y: 0 }, backKnee: { x: -28, y: -33 }, frontKnee: { x: 32, y: -34 } };
    } else if (run) {
      const swing = Math.sin(p.runPhase) * 22;
      const liftB = Math.max(0, Math.cos(p.runPhase)) * 13;
      const liftF = Math.max(0, -Math.cos(p.runPhase)) * 13;
      feet = {
        back: { x: -18 - swing, y: -liftB },
        front: { x: 18 + swing, y: -liftF },
        backKnee: { x: (-16 - swing) * 0.52 - 5, y: -34 + liftB * 0.3 },
        frontKnee: { x: (16 + swing) * 0.55 + 6, y: -35 + liftF * 0.3 }
      };
    } else if (hurt) {
      feet = { back: { x: -38, y: 0 }, front: { x: 26, y: 0 }, backKnee: { x: -28, y: -34 }, frontKnee: { x: 23, y: -33 } };
    } else {
      const sway = Math.sin(p.anim * 1.15) * 0.8;
      feet = { back: { x: -27 + sway, y: 0 }, front: { x: 29 + sway, y: 0 }, backKnee: { x: -21, y: -35 }, frontKnee: { x: 25, y: -36 } };
    }

    // scarf + coat tails behind
    drawScarf(p.anim, run, dash, p.state === 'special' ? '#6ee5dc' : '#b43a34', p.dead ? 0.3 : 1);
    drawCoatTail(p, run, dash, attack);

    // back arm (behind torso)
    const shoulder = { x: 8, y: -118 + breathe };
    const backShoulder = { x: -12, y: -116 + breathe };
    let backElbow = { x: -25, y: -94 + Math.sin(p.anim * 2.4) * 2 };
    let backHand = { x: -21, y: -77 };
    if (run) {
      const sw = Math.sin(p.runPhase + Math.PI) * 12;
      backElbow = { x: -24 - sw * 0.5, y: -101 };
      backHand = { x: -19 - sw, y: -81 + sw * 0.1 };
    }
    drawSleevedArm(backShoulder, backElbow, backHand, '#0b0d15', '#171c29', 13, 9);

    // Legs
    drawLeg({ x: -9, y: hipY - 3 }, feet.backKnee, feet.back, 17, 13, '#090b12', '#141925');
    drawLeg({ x: 10, y: hipY - 3 }, feet.frontKnee, feet.front, 18, 14, '#0d1019', '#1b2130');
    boot(feet.back.x, feet.back.y, 0.08, 1, '#060810');
    boot(feet.front.x, feet.front.y, -0.03, 1, '#090b12');

    // Upper body, leaning around the hips
    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(lean);
    ctx.translate(0, -hipY + bob);

    drawTorso(p, run, hurt, breathe);
    drawHead(p, run, hurt, attack, breathe);

    // Front arm & katana
    let hand, elbow;
    if (kunai) {
      hand = { x: 36, y: -113 };
      elbow = { x: 27, y: -118 };
      swordAngle = 1.3;
    } else {
      hand = {
        x: shoulder.x + Math.cos(swordAngle) * armReach,
        y: shoulder.y + Math.sin(swordAngle) * armReach
      };
      const mx = (shoulder.x + hand.x) / 2;
      const my = (shoulder.y + hand.y) / 2;
      const dx = hand.x - shoulder.x, dy = hand.y - shoulder.y;
      const m = Math.hypot(dx, dy) || 1;
      elbow = { x: mx - dy / m * 7, y: my + dx / m * 7 };
    }
    drawSleevedArm(shoulder, elbow, hand, '#0b0e17', '#202738', 14, 10);
    ctx.fillStyle = '#b8aa91';
    ctx.beginPath(); ctx.arc(hand.x, hand.y, 3.4, 0, TAU); ctx.fill();
    drawKatana(hand.x, hand.y, swordAngle, attack ? 122 : 112, swordGlow);

    if (kunai) {
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(p.anim * 18);
      ctx.fillStyle = '#d9fbf6';
      ctx.shadowColor = '#7ce7e0';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU;
        ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
        ctx.lineTo(Math.cos(a + TAU / 8) * 3, Math.sin(a + TAU / 8) * 3);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // rim light
    ctx.strokeStyle = 'rgba(136,176,196,0.32)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-17, -137);
    ctx.quadraticCurveTo(-11, -158, 3, -162);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, -126);
    ctx.quadraticCurveTo(-27, -110, -21, -94);
    ctx.stroke();

    ctx.restore();
    ctx.restore();

    if (p.flash > 0.05 && !p.dead) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = p.flash * 0.18;
      ctx.fillStyle = '#ff7a6d';
      ctx.beginPath();
      ctx.ellipse(p.x, fy - 80 * s, 36 * s, 68 * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawLeg(hip, knee, foot, thighW, shinW, dark, light) {
    // CLOTH / shell
    limb(hip.x, hip.y, knee.x, knee.y, thighW, dark);
    limb(knee.x, knee.y, foot.x, foot.y, shinW, dark);
    // lit edge
    ctx.strokeStyle = light;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hip.x + 4, hip.y - 2);
    ctx.quadraticCurveTo(knee.x + 4, knee.y - 2, foot.x + 2, foot.y - 5);
    ctx.stroke();
    // shin wrap
    ctx.strokeStyle = 'rgba(197,177,143,0.22)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const t = i / 3;
      const x = lerp(knee.x, foot.x, t), y = lerp(knee.y, foot.y, t);
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 1); ctx.lineTo(x + 5, y + 2);
      ctx.stroke();
    }
  }

  function drawCoatTail(p, run, dash, attack) {
    const wave = Math.sin(p.anim * 2.8) * 4;
    const lean = run ? 10 : attack ? 6 : 0;
    ctx.save();
    ctx.fillStyle = '#11151f';
    ctx.beginPath();
    ctx.moveTo(-13, -91);
    ctx.quadraticCurveTo(-37 - lean, -58, -44 - lean, -16 + wave);
    ctx.lineTo(-27, -23 + wave);
    ctx.lineTo(-26, -3 + wave);
    ctx.lineTo(-8, -20);
    ctx.lineTo(5, -68);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(66,84,110,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-13, -88);
    ctx.quadraticCurveTo(-30 - lean, -56, -35 - lean, -20 + wave);
    ctx.stroke();
    ctx.restore();
  }

  function drawTorso(p, run, hurt, breathe) {
    const g = ctx.createLinearGradient(-24, -130, 26, -70);
    g.addColorStop(0, '#080a11');
    g.addColorStop(0.5, '#111621');
    g.addColorStop(1, '#1c2230');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-22, -127 + breathe);
    ctx.quadraticCurveTo(-28, -104, -17, -76);
    ctx.quadraticCurveTo(-9, -68, 2, -72);
    ctx.quadraticCurveTo(16, -70, 18, -82);
    ctx.quadraticCurveTo(27, -105, 22, -126 + breathe);
    ctx.quadraticCurveTo(9, -136 + breathe, -22, -127 + breathe);
    ctx.closePath();
    ctx.fill();

    // chest wrap
    ctx.fillStyle = 'rgba(58,69,90,0.28)';
    ctx.beginPath();
    ctx.moveTo(-23, -118);
    ctx.lineTo(20, -105);
    ctx.lineTo(16, -96);
    ctx.lineTo(-21, -109);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(159,179,196,0.2)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-23, -118); ctx.lineTo(20, -105); ctx.stroke();

    // shoulder guard
    ctx.fillStyle = '#161c28';
    ctx.strokeStyle = 'rgba(77,94,117,0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -129 + breathe);
    ctx.lineTo(29, -120 + breathe);
    ctx.lineTo(25, -109);
    ctx.lineTo(17, -116);
    ctx.lineTo(10, -116);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(201,165,104,0.35)';
    ctx.fillRect(14, -123 + breathe, 10, 1.2);

    // sash / belt
    ctx.fillStyle = '#701c23';
    ctx.beginPath();
    ctx.moveTo(-20, -86); ctx.lineTo(20, -82);
    ctx.lineTo(19, -75); ctx.lineTo(-19, -79);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(234,105,83,0.35)';
    ctx.beginPath(); ctx.moveTo(-20, -86); ctx.lineTo(20, -82); ctx.stroke();
    // knot
    ctx.fillStyle = '#9b2c2f';
    ctx.beginPath(); ctx.ellipse(14, -80, 4, 3, -0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#631a22';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(13, -77);
    ctx.quadraticCurveTo(18 + Math.sin(p.anim * 3) * 3, -59, 7, -46 + Math.sin(p.anim * 2.4) * 2);
    ctx.stroke();

    // armored ribs
    ctx.strokeStyle = 'rgba(88,104,125,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = -104 + i * 7;
      ctx.beginPath();
      ctx.moveTo(-14, y + 2);
      ctx.quadraticCurveTo(0, y + 5, 13, y);
      ctx.stroke();
    }

    // little hanging charm
    ctx.fillStyle = '#c9a568';
    ctx.beginPath(); ctx.arc(-10, -77, 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,104,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-10, -75); ctx.lineTo(-12, -62); ctx.stroke();
  }

  function drawHead(p, run, hurt, attack, breathe) {
    const hx = 2 + (run ? 3 : 0) + (attack ? 2 : 0);
    const hy = -147 + breathe + (hurt ? 4 : 0);
    // neck
    ctx.fillStyle = '#0a0c13';
    ctx.fillRect(-4, hy + 14, 10, 11);
    // hood shape
    const g = ctx.createLinearGradient(-13, hy - 14, 18, hy + 12);
    g.addColorStop(0, '#0b0e17');
    g.addColorStop(0.65, '#141a27');
    g.addColorStop(1, '#1e2638');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-9, hy + 7);
    ctx.quadraticCurveTo(-17, hy - 3, -9, hy - 15);
    ctx.quadraticCurveTo(1, hy - 23, 12, hy - 14);
    ctx.quadraticCurveTo(20, hy - 6, 17, hy + 4);
    ctx.quadraticCurveTo(11, hy + 15, -9, hy + 7);
    ctx.closePath();
    ctx.fill();
    // face wrap
    ctx.fillStyle = '#b4a58d';
    ctx.beginPath();
    ctx.moveTo(5, hy - 10);
    ctx.quadraticCurveTo(16, hy - 9, 17, hy + 1);
    ctx.quadraticCurveTo(15, hy + 8, 7, hy + 7);
    ctx.quadraticCurveTo(1, hy + 1, 5, hy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(36,30,31,0.28)';
    ctx.beginPath();
    ctx.moveTo(8, hy + 3);
    ctx.quadraticCurveTo(14, hy + 2, 16, hy + 1);
    ctx.lineTo(15, hy + 7);
    ctx.quadraticCurveTo(10, hy + 8, 8, hy + 4);
    ctx.fill();
    // eyes
    ctx.save();
    ctx.shadowColor = '#8ff8f0';
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#cffffb';
    ctx.beginPath(); ctx.ellipse(10, hy - 3, 2.5, 1.15, -0.12, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.ellipse(14.6, hy - 2.5, 1.2, 0.8, -0.12, 0, TAU); ctx.fill();
    ctx.restore();
    // headband
    ctx.strokeStyle = '#9c2d31';
    ctx.lineWidth = 3.3;
    ctx.beginPath();
    ctx.moveTo(-11, hy - 9);
    ctx.quadraticCurveTo(4, hy - 13, 15, hy - 9);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(219,78,64,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-13, hy - 10);
    ctx.quadraticCurveTo(-30, hy - 18 + Math.sin(p.anim * 3.4) * 4, -44, hy - 12 + Math.sin(p.anim * 3.1) * 3);
    ctx.stroke();
    // hood fold highlight
    ctx.strokeStyle = 'rgba(109,139,164,0.36)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-11, hy - 13);
    ctx.quadraticCurveTo(-2, hy - 22, 9, hy - 16);
    ctx.stroke();
    // shoulder cloth wrap
    ctx.strokeStyle = 'rgba(204,190,164,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(2, hy + 11); ctx.lineTo(13, hy + 16); ctx.stroke();
  }

  function drawSleevedArm(shoulder, elbow, hand, color, light, w1, w2) {
    limb(shoulder.x, shoulder.y, elbow.x, elbow.y, w1, color);
    limb(elbow.x, elbow.y, hand.x, hand.y, w2, color);
    // highlight
    ctx.strokeStyle = light;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(shoulder.x + 3, shoulder.y - 2);
    ctx.quadraticCurveTo(elbow.x + 3, elbow.y - 2, hand.x + 2, hand.y - 2);
    ctx.stroke();
    // bracer bands
    ctx.strokeStyle = 'rgba(201,165,104,0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      const t = 0.64 + i * 0.16;
      const x = lerp(elbow.x, hand.x, t), y = lerp(elbow.y, hand.y, t);
      ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 2); ctx.stroke();
    }
    joint(hand.x, hand.y, 3.2, '#a9977f');
  }

  // ---------------------------------------------------------------------------
  // Enemies
  // ---------------------------------------------------------------------------
  function drawEnemy(e) {
    if (!e) return;
    const s = depthScale(e.z) * e.cfg.scale;
    const fy = groundY(e.z);
    const deadT = e.dead ? clamp(e.timer / 1.05, 0, 1) : 0;
    const spawnT = e.state === 'spawn' ? clamp(e.timer / e.spawnDuration, 0, 1) : 1;
    const alpha = e.dead ? 1 - deadT * 0.95 : Math.min(1, spawnT * 1.5);
    if (alpha <= 0.01) return;

    shadow(e.x, fy, s, e.cfg.boss ? 74 : 44, 0.6 * alpha);

    if (e.dead) {
      for (let i = 0; i < 2; i++) {
        if (chance(0.1)) {
          spawnParticle({
            x: e.x + rand(20, -20), y: fy - rand(80, 10), z: e.z,
            vx: rand(15, -15), vy: rand(-8, -35), gravity: 10, life: 0.8,
            maxLife: 0.8, size: rand(18, 6), color: '#090b10', kind: 'smoke', alpha: 0.2
          });
        }
      }
    }

    if (e.type === 'archer' && e.state === 'windup') {
      const px = G.player.x, py = groundY(G.player.z) - 80 * depthScale(G.player.z);
      const ex = e.x, ey = fy - 105 * s;
      ctx.save();
      ctx.strokeStyle = `rgba(229,73,60,${0.15 + (e.timer / e.windupT) * 0.3})`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 8]);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(px, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, fy);
    ctx.scale(e.facing * s, s);
    if (e.dead) {
      ctx.rotate(-deadT * 1.25);
      ctx.translate(-deadT * 14, 0);
    } else if (e.state === 'spawn') {
      ctx.translate(0, (1 - spawnT) * 16);
    }

    if (e.type === 'archer') drawArcherBody(e);
    else if (e.type === 'brute') drawBruteBody(e, false);
    else if (e.type === 'boss') drawBruteBody(e, true);
    else drawRoninBody(e, e.type === 'spear');

    ctx.restore();

    // spawning smoke
    if (e.state === 'spawn') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const a = 1 - spawnT;
      const gr = ctx.createRadialGradient(e.x, fy - 30, 2, e.x, fy - 30, 80 * s);
      gr.addColorStop(0, `rgba(198,66,47,${0.12 * a})`);
      gr.addColorStop(1, 'rgba(65,20,25,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(e.x, fy - 20, 90 * s, 38 * s, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    if (!e.dead && e.hpBar > 0 && !e.cfg.boss) {
      const w = e.cfg.superArmor ? 64 : 44;
      const barY = fy - 195 * s;
      ctx.save();
      ctx.globalAlpha = clamp(e.hpBar, 0, 1);
      ctx.fillStyle = 'rgba(3,4,8,0.72)';
      ctx.fillRect(e.x - w / 2, barY, w, 3);
      ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#c44a3e' : '#ff624f';
      ctx.fillRect(e.x - w / 2, barY, w * (e.hp / e.maxHp), 3);
      ctx.restore();
    }

    if (!e.dead && e.state === 'windup') {
      const pulse = 0.65 + Math.sin(G.time * 12) * 0.25;
      const top = fy - (e.cfg.boss ? 310 : e.cfg.superArmor ? 240 : 218) * s;
      ctx.save();
      ctx.translate(e.x, top);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,85,62,${pulse})`;
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(6, 0); ctx.lineTo(0, 9); ctx.lineTo(-6, 0);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(0, 0, 16 + Math.sin(G.time * 8) * 3, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  function drawRoninBody(e, spear) {
    const walk = e.state === 'walk' || e.state === 'idle';
    const phase = e.runPhase;
    const swing = walk ? Math.sin(phase) * 14 : 0;
    const flinch = e.state === 'hurt' ? -0.13 : 0;
    let lean = e.state === 'windup' ? -0.12 : e.state === 'strike' ? 0.2 : 0.05 + flinch;
    const crouch = e.state === 'windup' ? 4 : 0;
    let weaponAngle = 1.25;
    let weaponGlow = 0;
    if (e.state === 'windup') {
      const t = clamp(e.timer / e.windupT, 0, 1);
      weaponAngle = lerp(1.15, -2.2, easeIn(t));
      weaponGlow = t * 0.7;
    } else if (e.state === 'strike') {
      const t = clamp(e.timer / (e.strikeT + 0.05), 0, 1);
      weaponAngle = lerp(-2.2, 1.1, easeOut(t));
      weaponGlow = 0.9;
    } else if (!walk) {
      weaponAngle = 1.15;
    } else {
      weaponAngle = 1.2 + Math.sin(phase) * 0.07;
    }

    const hip = -67 + crouch;
    const footB = { x: -16 - swing, y: 0 };
    const footF = { x: 20 + swing, y: 0 };
    const robeColor = e.flash > 0.04 ? '#f3dfc6' : '#2a1519';
    const robeLit = e.flash > 0.04 ? '#fff4df' : '#53242a';

    drawRaggedCoat(e, robeColor, robeLit, walk ? phase : 0);
    limb(-5, hip - 4, -19 - swing * 0.6, -32, 15, e.flash > 0.04 ? '#e7d3ba' : '#100d13');
    limb(-19 - swing * 0.6, -32, footB.x, footB.y, 10, '#151117');
    limb(7, hip - 4, 20 + swing * 0.65, -33, 16, e.flash > 0.04 ? '#f0dcc4' : '#171117');
    limb(20 + swing * 0.65, -33, footF.x, footF.y, 11, '#1b1318');
    boot(footB.x, footB.y, 0.04, 0.9, '#08070b');
    boot(footF.x, footF.y, -0.04, 0.9, '#0b090c');

    ctx.save();
    ctx.translate(0, hip);
    ctx.rotate(lean);
    ctx.translate(0, -hip);

    // torso
    const g = ctx.createLinearGradient(-20, -120, 20, -70);
    g.addColorStop(0, e.flash > 0.04 ? '#ead6bd' : '#1c1014');
    g.addColorStop(0.6, robeColor);
    g.addColorStop(1, e.flash > 0.04 ? '#fff1d8' : '#31171c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-21, -126);
    ctx.quadraticCurveTo(-27, -104, -16, -76);
    ctx.lineTo(15, -74);
    ctx.quadraticCurveTo(25, -103, 20, -126);
    ctx.quadraticCurveTo(0, -136, -21, -126);
    ctx.closePath();
    ctx.fill();

    // armor plates
    ctx.fillStyle = 'rgba(71,41,35,0.9)';
    ctx.beginPath();
    ctx.moveTo(-19, -116); ctx.lineTo(18, -110); ctx.lineTo(15, -100); ctx.lineTo(-18, -105); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,104,0.27)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-18, -114); ctx.lineTo(17, -108); ctx.stroke();

    // sash
    ctx.fillStyle = '#7e1e21';
    ctx.fillRect(-17, -84, 34, 5);
    ctx.fillStyle = 'rgba(219,94,70,0.45)';
    ctx.fillRect(-17, -84, 34, 1);

    // back arm
    drawSleevedArm({ x: -14, y: -115 }, { x: -28, y: -96 }, { x: -25, y: -78 }, '#140c11', '#3b1d22', 11, 8);

    // head + kasa
    ctx.fillStyle = e.flash > 0.04 ? '#efe1cc' : '#0d0a0e';
    ctx.beginPath(); ctx.arc(4, -146, 13, 0, TAU); ctx.fill();
    // mask
    ctx.fillStyle = e.flash > 0.04 ? '#fff5e2' : '#b8a38a';
    ctx.beginPath();
    ctx.moveTo(7, -152);
    ctx.quadraticCurveTo(17, -150, 17, -141);
    ctx.quadraticCurveTo(14, -134, 8, -136);
    ctx.quadraticCurveTo(3, -142, 7, -152);
    ctx.closePath(); ctx.fill();
    // eyes
    ctx.save();
    ctx.shadowColor = '#ff3f34'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff5d4a';
    ctx.beginPath(); ctx.ellipse(10, -146, 2.3, 1, -0.1, 0, TAU); ctx.fill();
    ctx.restore();
    // kasa hat
    const hatY = -158 + (e.state === 'windup' ? -2 : 0);
    ctx.fillStyle = e.flash > 0.04 ? '#e8d5ba' : '#31251d';
    ctx.beginPath();
    ctx.moveTo(0, hatY - 22);
    ctx.lineTo(-9, hatY - 7);
    ctx.quadraticCurveTo(-37, hatY - 1, -42, hatY + 4);
    ctx.quadraticCurveTo(-18, hatY + 11, 0, hatY + 9);
    ctx.quadraticCurveTo(18, hatY + 11, 42, hatY + 4);
    ctx.quadraticCurveTo(37, hatY - 1, 9, hatY - 7);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(182,143,99,0.32)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-40, hatY + 4); ctx.quadraticCurveTo(0, hatY + 10, 40, hatY + 4); ctx.stroke();
    // hat rim light
    ctx.strokeStyle = 'rgba(190,154,112,0.25)';
    ctx.beginPath(); ctx.moveTo(-29, hatY); ctx.quadraticCurveTo(0, hatY - 5, 29, hatY); ctx.stroke();

    // weapon arm
    const sh = { x: 11, y: -113 };
    const reach = spear ? 54 : 42;
    const hand = { x: sh.x + Math.cos(weaponAngle) * reach, y: sh.y + Math.sin(weaponAngle) * reach };
    const elbow = { x: (sh.x + hand.x) / 2 - 6, y: (sh.y + hand.y) / 2 + 6 };
    drawSleevedArm(sh, elbow, hand, '#1a1015', '#54282b', 12, 8);
    if (spear) drawSpear(hand.x, hand.y, weaponAngle, 176, weaponGlow);
    else drawKatana(hand.x, hand.y, weaponAngle, 102, weaponGlow, '#cfc8b8');

    // telegraph ember on blade
    if (weaponGlow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bx = hand.x + Math.cos(weaponAngle) * 70;
      const by = hand.y + Math.sin(weaponAngle) * 70;
      const gr = ctx.createRadialGradient(bx, by, 0, bx, by, 44);
      gr.addColorStop(0, `rgba(255,87,60,${0.32 * weaponGlow})`);
      gr.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(bx, by, 44, 0, TAU); ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawRaggedCoat(e, color, lit, phase) {
    const flutter = Math.sin(e.anim * 2.4 + phase * 0.4) * 3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-17, -100);
    ctx.quadraticCurveTo(-31, -57, -27 - flutter, -16);
    ctx.lineTo(-16, -25 + flutter);
    ctx.lineTo(-13, -7);
    ctx.lineTo(-3, -28);
    ctx.lineTo(8, -14 + flutter);
    ctx.lineTo(15, -56);
    ctx.lineTo(17, -92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = lit;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-17, -95); ctx.quadraticCurveTo(-27, -54, -23, -20); ctx.stroke();
  }

  function drawArcherBody(e) {
    const walk = e.state === 'walk' || e.state === 'idle';
    const phase = e.runPhase;
    const swing = walk ? Math.sin(phase) * 12 : 0;
    const pull = e.state === 'windup' ? clamp(e.timer / e.windupT, 0, 1) : e.state === 'strike' ? 1 : 0;
    const lean = e.state === 'windup' ? -0.08 : 0.08;
    const hip = -68;
    const flash = e.flash > 0.04;
    const dark = flash ? '#f1ddc2' : '#0c1313';
    const cloak = flash ? '#f7e6ce' : '#172221';

    limb(-5, hip, -22 - swing, -34, 13, dark);
    limb(7, hip, 20 + swing, -34, 14, dark);
    boot(-22 - swing, 0, 0.05, 0.9);
    boot(20 + swing, 0, -0.05, 0.9);
    // long cloak back
    ctx.fillStyle = flash ? '#f2dfc8' : '#111a1a';
    ctx.beginPath();
    ctx.moveTo(-17, -108);
    ctx.quadraticCurveTo(-33, -60, -26, -9 + Math.sin(e.anim * 2) * 3);
    ctx.lineTo(-10, -28);
    ctx.lineTo(4, -69);
    ctx.closePath(); ctx.fill();

    ctx.save();
    ctx.translate(0, hip);
    ctx.rotate(lean);
    ctx.translate(0, -hip);

    // body
    const g = ctx.createLinearGradient(-18, -126, 18, -70);
    g.addColorStop(0, flash ? '#e6d2b8' : '#101a19');
    g.addColorStop(0.7, cloak);
    g.addColorStop(1, flash ? '#fff4df' : '#243330');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-18, -124);
    ctx.quadraticCurveTo(-22, -103, -14, -78);
    ctx.lineTo(14, -77);
    ctx.quadraticCurveTo(21, -102, 17, -123);
    ctx.quadraticCurveTo(0, -132, -18, -124);
    ctx.closePath(); ctx.fill();
    // quiver
    ctx.save();
    ctx.rotate(-0.2);
    ctx.fillStyle = '#2e2119';
    ctx.fillRect(-28, -115, 9, 44);
    ctx.fillStyle = '#b09a78';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-26 + i * 2.5, -123, 1.4, 12);
    }
    ctx.restore();
    // sash
    ctx.fillStyle = '#69312e';
    ctx.fillRect(-16, -88, 32, 4);

    // head hood
    ctx.fillStyle = flash ? '#eedac1' : '#182220';
    ctx.beginPath();
    ctx.moveTo(-10, -136);
    ctx.quadraticCurveTo(-13, -157, 1, -164);
    ctx.quadraticCurveTo(17, -161, 18, -144);
    ctx.quadraticCurveTo(17, -134, 5, -132);
    ctx.closePath(); ctx.fill();
    // mask
    ctx.fillStyle = flash ? '#fff2dd' : '#b5a189';
    ctx.beginPath();
    ctx.moveTo(6, -152);
    ctx.quadraticCurveTo(15, -150, 16, -142);
    ctx.quadraticCurveTo(13, -136, 8, -138);
    ctx.quadraticCurveTo(4, -144, 6, -152);
    ctx.closePath(); ctx.fill();
    // eye
    ctx.save();
    ctx.shadowColor = '#ff5648'; ctx.shadowBlur = 7;
    ctx.fillStyle = '#ff725b';
    ctx.beginPath(); ctx.ellipse(10, -146, 2.2, 0.9, -0.1, 0, TAU); ctx.fill();
    ctx.restore();
    // hood rim
    ctx.strokeStyle = 'rgba(129,94,68,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-7, -150); ctx.quadraticCurveTo(4, -164, 16, -151); ctx.stroke();

    // bow arm
    const bowX = 34, bowY = -102;
    limb(8, -115, 20, -108, 10, dark);
    limb(20, -108, bowX + 4, bowY, 8, dark);
    drawBow(bowX + 10, bowY, -0.08 + (e.facing > 0 ? 0 : 0), pull, e.state === 'windup' ? 0.7 : 0);
    // back arm
    drawSleevedArm({ x: -12, y: -113 }, { x: -18, y: -101 }, { x: bowX - 2 - pull * 9, y: bowY }, dark, '#32413c', 9, 7);

    if (pull > 0.9 && e.state === 'windup') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(bowX + 20, bowY, 0, bowX + 20, bowY, 34);
      gr.addColorStop(0, 'rgba(255,102,74,0.35)');
      gr.addColorStop(1, 'rgba(255,72,55,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(bowX + 20, bowY, 34, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBruteBody(e, boss) {
    const walk = e.state === 'walk' || e.state === 'idle';
    const phase = e.runPhase;
    const swing = walk ? Math.sin(phase) * 8 : 0;
    const flash = e.flash > 0.04;
    const crouch = e.state === 'windup' ? 7 : 0;
    const hip = -77 + crouch;
    const scale = boss ? 1 : 1;
    let weaponAngle = boss ? 1.2 : 0.9;
    let weaponGlow = 0;

    if (e.state === 'windup') {
      const t = clamp(e.timer / e.windupT, 0, 1);
      weaponAngle = boss ? lerp(1.15, -2.6, easeIn(t)) : lerp(1, -2.5, easeIn(t));
      weaponGlow = t;
    } else if (e.state === 'strike') {
      const t = clamp(e.timer / (e.strikeT + 0.05), 0, 1);
      weaponAngle = boss ? lerp(-2.6, 1.4, easeOut(t)) : lerp(-2.5, 1.2, easeOut(t));
      weaponGlow = 0.9;
    }

    // aura for boss
    if (boss && e.enraged) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const aura = ctx.createRadialGradient(0, -90, 5, 0, -90, 120);
      aura.addColorStop(0, 'rgba(255,67,43,0.12)');
      aura.addColorStop(1, 'rgba(255,50,30,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(0, -90, 120, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // cape
    if (boss) {
      ctx.save();
      ctx.fillStyle = 'rgba(92,18,22,0.86)';
      ctx.beginPath();
      ctx.moveTo(-22, -120);
      ctx.quadraticCurveTo(-66 - Math.sin(e.anim * 1.7) * 10, -67, -55, -9);
      ctx.lineTo(-28, -30);
      ctx.lineTo(-12, -8);
      ctx.lineTo(8, -67);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(201,165,104,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-22, -113); ctx.quadraticCurveTo(-53, -65, -43, -18); ctx.stroke();
      ctx.restore();
    }

    // legs
    limb(-4, hip, -31 - swing, -36, boss ? 27 : 22, flash ? '#f2ddc2' : (boss ? '#1c1218' : '#181315'));
    limb(-31 - swing, -36, -40 - swing, 0, boss ? 18 : 15, flash ? '#ecd5b9' : '#221517');
    limb(6, hip, 32 + swing, -36, boss ? 28 : 23, flash ? '#f7e2c7' : (boss ? '#24151a' : '#1c1617'));
    limb(32 + swing, -36, 42 + swing, 0, boss ? 19 : 16, flash ? '#f1dac0' : '#28191a');
    boot(-40 - swing, 0, 0.04, boss ? 1.45 : 1.15, '#09070a');
    boot(42 + swing, 0, -0.04, boss ? 1.5 : 1.2, '#0c090b');

    ctx.save();
    ctx.translate(0, hip);
    ctx.rotate(e.state === 'windup' ? -0.1 : e.state === 'strike' ? 0.16 : 0.03);
    ctx.translate(0, -hip);

    // massive body
    const g = ctx.createLinearGradient(-35, -128, 35, -70);
    g.addColorStop(0, flash ? '#e8d3b8' : (boss ? '#1d1016' : '#1b1415'));
    g.addColorStop(0.55, flash ? '#f6e3cb' : (boss ? '#34171b' : '#2a1b1a'));
    g.addColorStop(1, flash ? '#fff2dc' : (boss ? '#4b2221' : '#3a2220'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-30, -130);
    ctx.quadraticCurveTo(-46, -104, -32, -72);
    ctx.lineTo(33, -70);
    ctx.quadraticCurveTo(46, -105, 29, -130);
    ctx.quadraticCurveTo(0, -143, -30, -130);
    ctx.closePath(); ctx.fill();

    // armor bands
    ctx.fillStyle = boss ? 'rgba(201,165,104,0.5)' : 'rgba(99,63,48,0.65)';
    ctx.fillRect(-30, -111, 61, 3);
    ctx.fillRect(-28, -98, 57, 2);
    ctx.strokeStyle = boss ? 'rgba(255,215,144,0.5)' : 'rgba(153,103,73,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-31, -111); ctx.lineTo(31, -111); ctx.stroke();
    // shoulder plates
    ctx.fillStyle = boss ? '#42201e' : '#2d1c1a';
    ctx.beginPath();
    ctx.moveTo(-30, -129); ctx.lineTo(-48, -119); ctx.lineTo(-39, -103); ctx.lineTo(-23, -114); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(28, -129); ctx.lineTo(48, -118); ctx.lineTo(38, -104); ctx.lineTo(22, -114); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = boss ? 'rgba(228,184,107,0.55)' : 'rgba(137,89,66,0.35)';
    ctx.stroke();
    // spikes
    ctx.fillStyle = '#c3b89e';
    for (const sx of [-41, 38]) {
      ctx.beginPath();
      ctx.moveTo(sx, -121); ctx.lineTo(sx + 5, -136); ctx.lineTo(sx + 9, -119); ctx.closePath(); ctx.fill();
    }

    // head / oni mask
    ctx.fillStyle = flash ? '#f6e3ca' : (boss ? '#170c11' : '#120c0f');
    ctx.beginPath(); ctx.arc(3, -146, boss ? 19 : 15, 0, TAU); ctx.fill();
    ctx.fillStyle = flash ? '#fff2df' : '#cbb69b';
    ctx.beginPath();
    ctx.moveTo(3, -160);
    ctx.quadraticCurveTo(22, -157, 23, -143);
    ctx.quadraticCurveTo(18, -132, 7, -136);
    ctx.quadraticCurveTo(-2, -145, 3, -160);
    ctx.closePath(); ctx.fill();
    // mask red markings
    ctx.strokeStyle = 'rgba(153,43,37,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(7, -153); ctx.lineTo(17, -145); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -146); ctx.lineTo(16, -139); ctx.stroke();
    // horns
    ctx.fillStyle = '#d6c9ad';
    ctx.beginPath();
    ctx.moveTo(-5, -158); ctx.quadraticCurveTo(-8, -188, 5, -196); ctx.quadraticCurveTo(2, -178, 5, -160); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -159); ctx.quadraticCurveTo(22, -184, 34, -186); ctx.quadraticCurveTo(24, -173, 23, -158); ctx.closePath(); ctx.fill();
    // eyes
    ctx.save();
    ctx.shadowColor = '#ff4433'; ctx.shadowBlur = boss ? 14 : 9;
    ctx.fillStyle = '#ff7256';
    ctx.beginPath(); ctx.ellipse(10, -147, 4, 1.6, -0.12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(18, -146, 2.5, 1.2, -0.12, 0, TAU); ctx.fill();
    ctx.restore();
    // boss crown / crest
    if (boss) {
      ctx.fillStyle = '#c9a568';
      ctx.beginPath();
      ctx.moveTo(-4, -166); ctx.lineTo(3, -180); ctx.lineTo(10, -166); ctx.lineTo(17, -180); ctx.lineTo(21, -163);
      ctx.closePath(); ctx.fill();
    }

    // weapon arm
    const sh = { x: 20, y: -113 };
    const hand = { x: sh.x + Math.cos(weaponAngle) * (boss ? 58 : 48), y: sh.y + Math.sin(weaponAngle) * (boss ? 58 : 48) };
    const elbow = { x: (sh.x + hand.x) / 2 + 7, y: (sh.y + hand.y) / 2 + 8 };
    drawSleevedArm(sh, elbow, hand, flash ? '#e9d4ba' : '#221317', '#5b2e2b', boss ? 17 : 14, boss ? 12 : 10);
    if (boss) drawKatana(hand.x, hand.y, weaponAngle, 154, weaponGlow, '#e5d8bb');
    else drawClub(hand.x, hand.y, weaponAngle, scale, weaponGlow);

    if (weaponGlow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bx = hand.x + Math.cos(weaponAngle) * (boss ? 95 : 65);
      const by = hand.y + Math.sin(weaponAngle) * (boss ? 95 : 65);
      const gr = ctx.createRadialGradient(bx, by, 0, bx, by, boss ? 70 : 50);
      gr.addColorStop(0, `rgba(255,91,57,${0.3 * weaponGlow})`);
      gr.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(bx, by, boss ? 70 : 50, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // back arm
    drawSleevedArm({ x: -20, y: -114 }, { x: -43, y: -99 }, { x: -38, y: -77 }, flash ? '#e7d0b5' : '#1a1013', '#4b2726', boss ? 16 : 13, boss ? 11 : 9);
    ctx.restore();
  }

  Object.assign(window, { drawPlayer, drawEnemy, drawShadow: shadow });
})();
