/* ============================================================
   TIME REWIND — vector draw routines
   ============================================================ */

const TAU = Math.PI * 2;

export function rgba(hex, a) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function glowCircle(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, .55 * alpha));
  g.addColorStop(.38, rgba(color, .17 * alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function drawPlatform(ctx, p, time, palette, echoActive, reduced) {
  if (p.kind === 'crumble' && p.state === 2) {
    return;
  }
  const active = p.kind !== 'phase' || p.phaseActive;
  const echo = p.kind === 'echo';
  const echoOn = echoActive;
  let alpha = 1;
  if (p.kind === 'phase') alpha = active ? 1 : 0.17;
  if (echo) alpha = echoOn ? 1 : 0.38;
  const x = p.curX + (p.kind === 'crumble' && p.state === 1 ? Math.sin(time * 68) * 2.2 : 0);
  const y = p.curY + (p.kind === 'crumble' ? p.fall || 0 : 0);
  const w = p.w, h = p.h;
  const accent = p.kind === 'crumble' ? '#ffb15f' : p.kind === 'phase' ? '#a68cff' : echo ? '#ffd36e' : palette.accent;
  ctx.save();
  ctx.globalAlpha = alpha;

  // underglow / support
  if (w < 300) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y + h, x, y + h + 42);
    g.addColorStop(0, rgba(accent, echoOn ? .18 : .08));
    g.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x + w * .12, y + h, w * .76, 42);
    ctx.restore();
  }

  // body
  const grad = ctx.createLinearGradient(x, y, x, y + Math.min(h, 120));
  grad.addColorStop(0, p.kind === 'crumble' ? '#251d2c' : echo ? '#242039' : '#111a35');
  grad.addColorStop(.2, '#0a1024');
  grad.addColorStop(1, '#060a17');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, h > 40 ? 5 : 3);
  ctx.fill();

  // inner face etching
  ctx.strokeStyle = rgba(accent, .11);
  ctx.lineWidth = 1;
  if (w > 40) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + Math.min(h - 4, 18));
    ctx.lineTo(x + w - 8, y + Math.min(h - 4, 18));
    ctx.stroke();
  }
  if (h > 50) {
    for (let i = 1; i < Math.min(4, Math.floor(w / 90)); i++) {
      ctx.beginPath();
      ctx.moveTo(x + w * i / 4, y + 20);
      ctx.lineTo(x + w * i / 4, y + h - 8);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x + w - 17, y + 17, 3, 0, TAU);
    ctx.strokeStyle = rgba(accent, .25);
    ctx.stroke();
  }

  // top edge
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(accent, echoOn || active ? .9 : .3);
  ctx.fillRect(x + 2, y, w - 4, 1.6);
  ctx.fillStyle = rgba(accent, echoOn || active ? .17 : .05);
  ctx.fillRect(x + 2, y - 3, w - 4, 7);
  ctx.restore();

  // corner brackets
  ctx.strokeStyle = rgba(accent, .65);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 12); ctx.lineTo(x, y); ctx.lineTo(x + 12, y);
  ctx.moveTo(x + w - 12, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + 12);
  ctx.stroke();

  if (p.kind === 'crumble') {
    ctx.strokeStyle = rgba('#ffb15f', .35);
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.moveTo(x + w * .22, y + 2);
    ctx.lineTo(x + w * .32, y + 8);
    ctx.lineTo(x + w * .27, y + h * .6);
    ctx.moveTo(x + w * .62, y);
    ctx.lineTo(x + w * .56, y + 7);
    ctx.lineTo(x + w * .7, y + h * .45);
    ctx.moveTo(x + w * .76, y + 2);
    ctx.lineTo(x + w * .82, y + h * .7);
    ctx.stroke();
  }

  if (p.kind === 'phase') {
    const period = p.period || 3;
    const duty = p.duty || .6;
    const cyc = ((time + (p.phase || 0)) % period) / period;
    const remain = (duty - cyc) * period;
    const soon = active && remain < .45;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = rgba(active ? '#c3b5ff' : '#8a79c9', active ? .48 : .34);
    ctx.lineWidth = 1;
    roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (soon) {
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = rgba('#ff8bc9', .55 + .35 * Math.sin(time * 32));
      ctx.lineWidth = 1.4;
      roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 3);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!active) {
      ctx.fillStyle = rgba('#beaaff', .16);
      for (let i = 0; i < w; i += 19) {
        const hh = 2 + (Math.sin(time * 2 + i) + 1) * 1.5;
        ctx.fillRect(x + i, y + h / 2 - hh / 2, 10, hh);
      }
    }
  }

  if (echo) {
    ctx.setLineDash(echoOn ? [] : [3, 6]);
    ctx.strokeStyle = rgba('#ffd36e', echoOn ? .5 : .5);
    ctx.lineWidth = 1;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!echoOn) {
      const pulse = .5 + .5 * Math.sin(time * 3.4 + p.id * 1.7);
      ctx.fillStyle = rgba('#ffd36e', .07 + pulse * .055);
      roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 2);
      ctx.fill();
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 8px "DejaVu Sans Mono", monospace';
      ctx.fillStyle = rgba('#ffd36e', .58 + pulse * .22);
      ctx.shadowColor = 'rgba(255,211,110,.65)';
      ctx.shadowBlur = 7;
      ctx.fillText('ECHO', x + w / 2, y + h / 2 + .5);
      ctx.restore();
    }
  }

  // moving thrusters
  if (p.move) {
    const bob = Math.sin(time * 5 + p.id) * 1.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const tx = x + w * (.25 + i * .25);
      const tg = ctx.createRadialGradient(tx, y + h + 3, 0, tx, y + h + 3, 13 + bob);
      tg.addColorStop(0, rgba(accent, .55));
      tg.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.arc(tx, y + h + 3, 13 + bob, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // faint circuit scratches
  ctx.globalAlpha = alpha * .25;
  ctx.strokeStyle = rgba(accent, .5);
  for (let i = 0; i < Math.min(3, Math.floor(w / 55)); i++) {
    const sx = x + 16 + i * 55;
    ctx.beginPath();
    ctx.moveTo(sx, y + Math.min(h - 5, 24));
    ctx.lineTo(sx + 10, y + Math.min(h - 5, 24));
    ctx.lineTo(sx + 14, y + Math.min(h - 5, 18));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLaser(ctx, h, time, palette) {
  const x = h.x, y = h.y, w = h.w, hh = h.h;
  const cyc = ((time + (h.phase || 0)) % h.period) / h.period;
  const active = cyc < h.duty;
  const warning = !active && cyc > .86;
  const vertical = hh > w;
  const pulse = .72 + Math.sin(time * 22) * .28;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // emitters
  const er = 5;
  const pts = vertical ? [[x + w / 2, y], [x + w / 2, y + hh]] : [[x, y + hh / 2], [x + w, y + hh / 2]];
  for (const [ex, ey] of pts) {
    glowCircle(ctx, ex, ey, 19, active ? '#ff4f7b' : '#ff9c7b', active ? .65 : .26);
    ctx.fillStyle = active ? '#ffd9e2' : '#8b7086';
    ctx.beginPath(); ctx.arc(ex, ey, 3.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#ff4f7b', active ? .7 : .25);
    ctx.beginPath(); ctx.arc(ex, ey, 7.5, 0, TAU); ctx.stroke();
  }
  if (active) {
    const g = vertical
      ? ctx.createLinearGradient(x, y, x + w, y)
      : ctx.createLinearGradient(x, y, x, y + hh);
    g.addColorStop(0, 'rgba(255,79,123,.12)');
    g.addColorStop(.5, 'rgba(255,79,123,.5)');
    g.addColorStop(1, 'rgba(255,79,123,.12)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 5, y, w + 10, hh);
    ctx.fillStyle = rgba('#ff4f7b', .24 * pulse);
    if (vertical) ctx.fillRect(x - 14, y, w + 28, hh);
    else ctx.fillRect(x, y - 14, w, hh + 28);
    ctx.fillStyle = '#fff3f5';
    if (vertical) ctx.fillRect(x + w / 2 - .9, y, 1.8, hh);
    else ctx.fillRect(x, y + hh / 2 - .9, w, 1.8);
    // travelling energy ticks
    ctx.fillStyle = rgba('#ffd9e2', .75);
    const t = (time * 150) % 60;
    if (vertical) {
      ctx.fillRect(x + w / 2 - 1.3, y + t, 2.6, 11);
      ctx.fillRect(x + w / 2 - 1.3, y + hh - t, 2.6, 8);
    } else {
      ctx.fillRect(x + t, y + hh / 2 - 1.3, 11, 2.6);
      ctx.fillRect(x + w - t, y + hh / 2 - 1.3, 8, 2.6);
    }
  } else {
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = rgba('#ff8c9f', warning ? .6 : .18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (vertical) { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + hh); }
    else { ctx.moveTo(x, y + hh / 2); ctx.lineTo(x + w, y + hh / 2); }
    ctx.stroke();
    ctx.setLineDash([]);
    if (warning) {
      ctx.globalAlpha = .3 + Math.sin(time * 30) * .25;
      ctx.fillStyle = '#ff9caf';
      if (vertical) ctx.fillRect(x - 1, y, w + 2, hh);
      else ctx.fillRect(x, y - 1, w, hh + 2);
    }
  }
  ctx.restore();
}

export function drawSaw(ctx, s, time, palette) {
  const cyc = ((time + (s.phase || 0)) % s.period) / s.period;
  const e = .5 - .5 * Math.cos(cyc * TAU);
  const x = s.x + (s.moveX || 0) * e;
  const y = s.y + (s.moveY || 0) * e;
  const r = s.r || 18;
  ctx.save();
  if (s.moveX || s.moveY) {
    ctx.strokeStyle = rgba('#ffb15f', .1);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + (s.moveX || 0), s.y + (s.moveY || 0)); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, x, y, r * 2.2, '#ff9e57', .25);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 5.8 + (s.phase || 0) * 8);
  ctx.fillStyle = '#2b2331';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    const rr = r + (i % 2 ? 4.5 : 0);
    const ax = Math.cos(a) * rr, ay = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba('#ffb15f', .85);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#120e17';
  ctx.beginPath(); ctx.arc(0, 0, r - 4, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba('#ffb15f', .25);
  ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#ffb15f';
  ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.fill();
  ctx.restore();
}

export function drawCore(ctx, c, time, palette) {
  if (c.collected) return;
  const bob = Math.sin(time * 2.3 + c.x * .02) * 4;
  const x = c.x, y = c.y + bob;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, x, y, 29, '#ffd36e', .58);
  ctx.translate(x, y);
  ctx.rotate(time * 1.4);
  ctx.fillStyle = '#ffe8a6';
  ctx.beginPath();
  ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a4c10';
  ctx.beginPath();
  ctx.moveTo(0, -4.4); ctx.lineTo(3.5, 0); ctx.lineTo(0, 4.4); ctx.lineTo(-3.5, 0); ctx.closePath();
  ctx.fill();
  ctx.rotate(-time * 1.4);
  ctx.strokeStyle = rgba('#ffd36e', .42);
  ctx.lineWidth = .9;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 5, time * .8, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

export function drawEnergy(ctx, e, time) {
  if (e.collected) return;
  const bob = Math.sin(time * 2.8 + e.x * .03) * 3;
  const x = e.x, y = e.y + bob;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, x, y, 24, '#57f2ff', .42);
  ctx.translate(x, y);
  ctx.strokeStyle = rgba('#d7fdff', .9);
  ctx.lineWidth = 1.2;
  ctx.fillStyle = rgba('#0d3142', .8);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU - Math.PI / 2;
    const px = Math.cos(a) * 9, py = Math.sin(a) * 11;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#a8fbff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(-3, 1); ctx.lineTo(1, 1); ctx.lineTo(-1, 7); ctx.lineTo(4, -1); ctx.lineTo(0, -1); ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawCheckpoint(ctx, c, time, palette, active) {
  const x = c.x, y = c.y;
  ctx.save();
  if (active) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y - 120, x, y);
    g.addColorStop(0, rgba('#57f2ff', 0));
    g.addColorStop(.65, rgba('#57f2ff', .09));
    g.addColorStop(1, rgba('#57f2ff', .22));
    ctx.fillStyle = g;
    ctx.fillRect(x - 10, y - 120, 20, 120);
    ctx.strokeStyle = rgba('#57f2ff', .28);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      ctx.moveTo(x - 14, y - 14 - i * 28 - (time * 18 % 28));
      ctx.lineTo(x + 14, y - 14 - i * 28 - (time * 18 % 28));
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = '#060c19';
  ctx.strokeStyle = active ? rgba('#57f2ff', .8) : 'rgba(134,157,201,.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, x - 25, y - 4, 50, 5, 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = active ? '#57f2ff' : '#4c5978';
  ctx.fillRect(x - 1, y - 17, 2, 13);
  ctx.beginPath(); ctx.arc(x, y - 19, 3, 0, TAU); ctx.fill();
  ctx.restore();
}

export function drawPortal(ctx, x, y, time, palette) {
  const bob = Math.sin(time * 1.6) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  // base
  ctx.fillStyle = 'rgba(5,10,22,.9)';
  ctx.strokeStyle = rgba(palette.accent, .55);
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 8, 0, 0, TAU);
  ctx.fill(); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, 0, -55, 80, palette.accent, .6);
  const g = ctx.createRadialGradient(0, -55, 2, 0, -55, 33);
  g.addColorStop(0, 'rgba(255,255,255,.95)');
  g.addColorStop(.22, rgba(palette.accent, .75));
  g.addColorStop(.6, rgba(palette.accent2, .18));
  g.addColorStop(1, rgba(palette.accent, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -55, 27, 46, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = rgba(i === 1 ? palette.accent2 : palette.accent, .5 - i * .11);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, -55, 31 + i * 7, 52 + i * 9, time * .3 + i * .6, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba('#ffffff', .72);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -55, 24, 43, -time * .4, .3, 2.5);
  ctx.stroke();
  ctx.restore();
  // exit label
  ctx.save();
  ctx.globalAlpha = .55;
  ctx.fillStyle = rgba(palette.accent, .85);
  ctx.font = '700 8px "DejaVu Sans Mono", monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText('EXIT', x, y - 116);
  ctx.restore();
}

export function drawProjectile(ctx, p, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, p.x, p.y, 17, '#ff5f7e', .55);
  ctx.strokeStyle = rgba('#ff8ba4', .35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - p.vx * .045, p.y - p.vy * .045);
  ctx.stroke();
  ctx.fillStyle = '#fff1f5';
  ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, TAU); ctx.fill();
  ctx.restore();
}

export function drawSentinel(ctx, e, time, palette) {
  const x = e.x, y = e.y;
  const alert = e.state === 'chase';
  const walk = e.step || 0;
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(x, y, 22, 5, 0, 0, TAU); ctx.fill();

  // legs
  ctx.strokeStyle = alert ? 'rgba(255,91,116,.8)' : 'rgba(146,166,205,.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const side = i - 1;
    const swing = Math.sin(walk + i * 2.2) * 4;
    ctx.beginPath();
    ctx.moveTo(x + side * 8, y - 18);
    ctx.lineTo(x + side * 12 + swing, y - 8);
    ctx.lineTo(x + side * 16 + swing, y);
    ctx.stroke();
  }
  // body
  const g = ctx.createLinearGradient(x, y - 36, x, y - 6);
  g.addColorStop(0, alert ? '#3d1a2a' : '#1a223c');
  g.addColorStop(1, '#090d1c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y - 22, 16, 13, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = alert ? 'rgba(255,79,123,.8)' : 'rgba(126,154,211,.4)';
  ctx.stroke();
  // visor
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, x + (alert ? e.dir * 2 : 0), y - 24, 14, alert ? '#ff4f7b' : '#ffb15f', .55);
  ctx.fillStyle = alert ? '#ff7d96' : '#ffbe6b';
  ctx.beginPath();
  ctx.ellipse(x + e.dir * 2, y - 24, 5, 2.2, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // antenna
  ctx.strokeStyle = 'rgba(143,172,227,.5)';
  ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x, y - 42); ctx.stroke();
  ctx.fillStyle = alert ? '#ff4f7b' : '#6880ad';
  ctx.beginPath(); ctx.arc(x, y - 44, 2, 0, TAU); ctx.fill();
  if (alert) {
    ctx.globalAlpha = .45 + Math.sin(time * 8) * .25;
    ctx.strokeStyle = '#ff4f7b';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y - 24, 23 + Math.sin(time * 4) * 3, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

export function drawDrone(ctx, e, time, palette) {
  const x = e.x, y = e.y + Math.sin(time * 2 + e.phase) * (e.alert ? 1 : 5);
  const alert = e.alert;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, x, y + 6, 32, alert ? '#ff4f7b' : '#5fc6ff', .2);
  ctx.restore();

  // rotors
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(157,184,238,.42)';
  ctx.lineWidth = 1;
  const spin = time * 18;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 16, -4);
    ctx.rotate(spin * side);
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  // wings
  ctx.fillStyle = 'rgba(18,28,52,.9)';
  ctx.strokeStyle = alert ? 'rgba(255,79,123,.4)' : 'rgba(116,166,240,.35)';
  ctx.beginPath();
  ctx.moveTo(-21, -4); ctx.lineTo(-9, 0); ctx.lineTo(-9, 7); ctx.lineTo(-23, 4); ctx.closePath();
  ctx.moveTo(21, -4); ctx.lineTo(9, 0); ctx.lineTo(9, 7); ctx.lineTo(23, 4); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // core diamond
  ctx.rotate(Math.PI / 4);
  const g = ctx.createLinearGradient(-8, -8, 8, 8);
  g.addColorStop(0, alert ? '#5d162a' : '#142846');
  g.addColorStop(1, '#070b17');
  ctx.fillStyle = g;
  ctx.fillRect(-9, -9, 18, 18);
  ctx.strokeStyle = alert ? 'rgba(255,79,123,.85)' : 'rgba(106,211,255,.55)';
  ctx.strokeRect(-9, -9, 18, 18);
  ctx.rotate(-Math.PI / 4);
  // eye
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, 0, 0, 13, alert ? '#ff4f7b' : '#6ed5ff', .7);
  ctx.fillStyle = alert ? '#ff8fa4' : '#b7f4ff';
  ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
  if (alert) {
    ctx.strokeStyle = 'rgba(255,79,123,.32)';
    ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(time * 5) * 2, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function drawPlayer(ctx, player, time, palette, options = {}) {
  const { x, y, vx, vy, facing, runPhase, onGround, squash, invuln } = player;
  const dir = facing || 1;
  const moving = Math.abs(vx) > 22;
  const air = !onGround;
  const body = options.ghost ? 'rgba(87,242,255,.35)' : '#eaf5ff';
  const suit = options.ghost ? 'rgba(87,242,255,.23)' : '#273d63';
  const accent = options.ghost ? 'rgba(87,242,255,.4)' : palette.accent;
  if (invuln > 0 && !options.ghost && Math.floor(time * 22) % 2 === 0) ctx.globalAlpha = .55;
  ctx.save();
  // shadow
  if (!options.ghost) {
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 17, 4, 0, 0, TAU); ctx.fill();
  }
  // speed trail
  if (moving && !air && !options.ghost) {
    ctx.strokeStyle = rgba(accent, .18);
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x - dir * (8 + i * 6), y - 13 + i * 7);
      ctx.lineTo(x - dir * (22 + i * 9), y - 13 + i * 7);
      ctx.stroke();
    }
  }
  ctx.translate(x, y);
  ctx.scale(dir, squash || 1);
  const swing = moving ? Math.sin(runPhase) : 0;
  const swing2 = moving ? Math.sin(runPhase + Math.PI) : 0;
  const legLift = air ? 6 : 0;
  // legs
  ctx.lineCap = 'round';
  ctx.strokeStyle = suit;
  ctx.lineWidth = 5.4;
  ctx.beginPath();
  if (air) {
    ctx.moveTo(-4, -20); ctx.lineTo(-8, -9); ctx.lineTo(-10, -legLift);
    ctx.moveTo(5, -20); ctx.lineTo(8, -10); ctx.lineTo(10, -4);
  } else {
    ctx.moveTo(-4, -20); ctx.lineTo(-5 + swing * 7, -10); ctx.lineTo(-8 + swing * 11, 0);
    ctx.moveTo(5, -20); ctx.lineTo(6 + swing2 * 7, -10); ctx.lineTo(9 + swing2 * 11, 0);
  }
  ctx.stroke();
  // boots / knees
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (air) {
    ctx.moveTo(-11, -legLift); ctx.lineTo(-5, -legLift);
    ctx.moveTo(8, -4); ctx.lineTo(13, -4);
  } else {
    ctx.moveTo(-10 + swing * 11, 0); ctx.lineTo(-3 + swing * 11, 0);
    ctx.moveTo(7 + swing2 * 11, 0); ctx.lineTo(13 + swing2 * 11, 0);
  }
  ctx.stroke();
  // scarf / back ribbon
  ctx.save();
  ctx.strokeStyle = options.ghost ? 'rgba(87,242,255,.3)' : 'rgba(87,242,255,.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-2, -41);
  const wind = -dir * (14 + Math.abs(vx) * .045);
  ctx.quadraticCurveTo(wind * .5, -39 + Math.sin(time * 5) * 2, wind, -32 + Math.sin(time * 4.4) * 4);
  ctx.stroke();
  ctx.restore();
  // torso
  const torso = ctx.createLinearGradient(0, -47, 0, -16);
  torso.addColorStop(0, body);
  torso.addColorStop(.38, options.ghost ? 'rgba(87,242,255,.28)' : '#9bb3d4');
  torso.addColorStop(1, suit);
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-8, -44);
  ctx.quadraticCurveTo(-12, -34, -7, -18);
  ctx.lineTo(7, -18);
  ctx.quadraticCurveTo(12, -34, 8, -44);
  ctx.quadraticCurveTo(0, -49, -8, -44);
  ctx.closePath();
  ctx.fill();
  // chest core
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, 2, -33, 8, accent, .65);
  ctx.fillStyle = '#eaffff';
  ctx.beginPath(); ctx.arc(2, -33, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
  // arms
  ctx.strokeStyle = suit;
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  if (air) {
    ctx.moveTo(-7, -39); ctx.lineTo(-14, -30); ctx.lineTo(-17, -22);
    ctx.moveTo(7, -39); ctx.lineTo(14, -30); ctx.lineTo(12, -21);
  } else {
    ctx.moveTo(-7, -39); ctx.lineTo(-12 - swing * 4, -28); ctx.lineTo(-13 - swing2 * 5, -18);
    ctx.moveTo(7, -39); ctx.lineTo(12 + swing2 * 4, -28); ctx.lineTo(12 + swing * 5, -18);
  }
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15 - swing2 * 5, -18); ctx.lineTo(-11 - swing2 * 5, -18);
  ctx.moveTo(10 + swing * 5, -18); ctx.lineTo(14 + swing * 5, -18);
  ctx.stroke();
  // head
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(1, -51, 8.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = suit;
  ctx.beginPath();
  ctx.arc(3, -51, 8.4, -.7, 1.7);
  ctx.fill();
  // visor
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowCircle(ctx, 4, -52, 12, accent, .5);
  ctx.fillStyle = '#b7fcff';
  ctx.beginPath();
  ctx.ellipse(4, -52, 5.1, 2.7, -.1, 0, TAU);
  ctx.fill();
  ctx.restore();
  // shoulder light
  ctx.fillStyle = accent;
  ctx.fillRect(-8, -41, 2, 4);
  ctx.restore();
}

export function drawTimeRings(ctx, x, y, time, color, amount = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const rr = 28 + Math.sin(time * 3) * 3;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = rgba(color, .22 - i * .055);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.beginPath();
    ctx.arc(x, y - 28, rr + i * 18, time * (1.1 + i * .2), time * (1.1 + i * .2) + TAU * .78);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // clock marks
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + time * .12;
    ctx.globalAlpha = .15 + .14 * amount;
    ctx.fillStyle = color;
    const r1 = rr + 48, r2 = rr + 51;
    ctx.fillRect(x + Math.cos(a) * r1, y - 28 + Math.sin(a) * r1, 1.4, 1.4);
  }
  ctx.restore();
}
