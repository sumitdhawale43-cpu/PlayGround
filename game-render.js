/* Kingdom Builder — canvas world, isometric renderer and map interaction. */
(function () {
  'use strict';
  const G = window.KBG;
  const KB = window.KBArt;
  const canvas = document.getElementById('world');
  let ctx = canvas.getContext('2d');
  const mapCanvas = document.getElementById('worldMap');
  const mapCtx = mapCanvas.getContext('2d');

  let DPR = 1, vw = 0, vh = 0, waterTile = null, waterPattern = null;
  let grainTile = null, mapGrain = null;
  let mapSig = '';
  const images = {};
  const ghostTints = {};
  const hitObjects = [];
  const particles = [];
  let lastFrame = 0, artLoaded = 0, artTotal = 0;

  G.camera = { userZoom: 1, panX: 0, panY: 0, scale: 1, base: 1, ox: 0, oy: 0, minZoom: .78, maxZoom: 1.7 };
  G.ui = { buildType: null, demolish: false, selected: null, hover: null, dragging: false };
  G.hitObjects = hitObjects;

  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let suppressTap = false;

  function loadSprite(key, svg) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        // Rasterise vector art once so the animated scene only blits bitmaps.
        const scale = 2;
        const bitmap = document.createElement('canvas');
        bitmap.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        bitmap.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
        const bx = bitmap.getContext('2d');
        bx.drawImage(img, 0, 0, bitmap.width, bitmap.height);
        images[key] = bitmap;
        artLoaded++;
        resolve(bitmap);
      };
      img.onerror = () => { artLoaded++; resolve(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  G.loadArt = function () {
    const entries = Object.entries(KB.sprites);
    artTotal = entries.length;
    return Promise.all(entries.map(([k, v]) => loadSprite(k, v)));
  };

  function buildWaterTile() {
    const c = document.createElement('canvas');
    c.width = 360; c.height = 360;
    const x = c.getContext('2d');
    const grad = x.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, '#1e4b53');
    grad.addColorStop(.5, '#245c63');
    grad.addColorStop(1, '#1b464f');
    x.fillStyle = grad;
    x.fillRect(0, 0, 360, 360);
    for (let i = 0; i < 70; i++) {
      const px = Math.random() * 360, py = Math.random() * 360;
      const len = 5 + Math.random() * 24;
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + len * .45, py - 2 - Math.random() * 2, px + len, py);
      x.strokeStyle = `rgba(159,211,205,${.025 + Math.random() * .075})`;
      x.lineWidth = .7 + Math.random() * .8;
      x.stroke();
    }
    for (let i = 0; i < 90; i++) {
      x.fillStyle = `rgba(2,25,27,${.04 + Math.random() * .08})`;
      x.beginPath();
      x.arc(Math.random() * 360, Math.random() * 360, .7 + Math.random() * 2.4, 0, Math.PI * 2);
      x.fill();
    }
    return c;
  }

  function buildGrainTile() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const img = x.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 40 + Math.random() * 150;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 30;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  function drawFinish(grain) {
    // Soft vignette, baked into the static layers so the compositor only
    // blends the lightweight animated canvas above it.
    ctx.save();
    ctx.translate(vw / 2, vh * .43);
    ctx.scale(vw * .62, vh * .62);
    const light = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    light.addColorStop(0, 'rgba(7,15,10,0)');
    light.addColorStop(.38, 'rgba(7,15,10,0)');
    light.addColorStop(.7, 'rgba(7,15,10,.20)');
    light.addColorStop(1, 'rgba(4,10,7,.65)');
    ctx.fillStyle = light;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();

    const shade = ctx.createLinearGradient(0, 0, 0, vh);
    shade.addColorStop(0, 'rgba(11,22,15,.40)');
    shade.addColorStop(.2, 'rgba(11,22,15,0)');
    shade.addColorStop(.75, 'rgba(8,15,11,0)');
    shade.addColorStop(1, 'rgba(8,15,11,.55)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, vw, vh);

    if (grain) {
      ctx.save();
      ctx.globalAlpha = .5;
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }
  }

  function updateCamera() {
    const small = vw < 760;
    const landscape = vh < 560;
    const fitW = (vw - 22) / 1250;
    const fitH = (vh - (small ? 118 : 188)) / 625;
    let base = Math.min(fitW, fitH);
    if (small) base = Math.max(base, .68);
    if (landscape) base = Math.min(base, .58);
    base = G.clamp(base, .38, 1.16);
    G.camera.base = base;
    G.camera.scale = base * G.camera.userZoom;
    const s = G.camera.scale;
    G.camera.ox = vw / 2 - 75 * s + G.camera.panX;
    G.camera.oy = (small ? vh * .475 : vh * .5) - 287.5 * s + G.camera.panY;
  }

  function clampPan() {
    const small = vw < 760;
    const maxX = small ? 360 : 170;
    const maxY = small ? 250 : 100;
    G.camera.panX = G.clamp(G.camera.panX, -maxX, maxX);
    G.camera.panY = G.clamp(G.camera.panY, -maxY, maxY);
  }

  function project(x, y) {
    const s = G.camera.scale;
    return {
      x: G.camera.ox + (x - y) * G.TW * .5 * s,
      y: G.camera.oy + (x + y) * G.TH * .5 * s
    };
  }

  G.screenToTile = function (sx, sy) {
    const s = G.camera.scale;
    const dx = (sx - G.camera.ox) / (G.TW * .5 * s);
    const dy = (sy - G.camera.oy) / (G.TH * .5 * s);
    const x = Math.round((dx + dy) / 2);
    const y = Math.round((dy - dx) / 2);
    return { x, y };
  };

  G.project = project;

  G.resizeWorld = function () {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    vw = window.innerWidth; vh = window.innerHeight;
    canvas.width = Math.floor(vw * DPR);
    canvas.height = Math.floor(vh * DPR);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    mapCanvas.width = canvas.width;
    mapCanvas.height = canvas.height;
    updateCamera();
    if (!waterTile) waterTile = buildWaterTile();
    rebuildCaches();
  };

  function diamond(cx, cy, w, h, inset = 0) {
    const halfW = Math.max(1, w / 2 - inset);
    const halfH = Math.max(1, h / 2 - inset);
    ctx.beginPath();
    ctx.moveTo(cx, cy - halfH);
    ctx.lineTo(cx + halfW, cy);
    ctx.lineTo(cx, cy + halfH);
    ctx.lineTo(cx - halfW, cy);
    ctx.closePath();
  }

  function drawWaterBase() {
    ctx.fillStyle = '#173f48';
    ctx.fillRect(0, 0, vw, vh);
    const bg = ctx.createLinearGradient(0, 0, 0, vh);
    bg.addColorStop(0, 'rgba(35,82,86,.72)');
    bg.addColorStop(.48, 'rgba(28,73,80,.26)');
    bg.addColorStop(1, 'rgba(11,39,45,.72)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, vw, vh);

    if (waterPattern) {
      ctx.save();
      ctx.fillStyle = waterPattern;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }

    // soft mist bands at the top and far edges
    const mist = ctx.createLinearGradient(0, 0, 0, vh * .34);
    mist.addColorStop(0, 'rgba(186,206,181,.10)');
    mist.addColorStop(1, 'rgba(186,206,181,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, vw, vh * .34);
  }

  function drawWaterGlints(t) {
    ctx.save();
    for (let i = 0; i < 27; i++) {
      const h = G.hash(i, 4, 9);
      const x = h * vw + Math.sin(t * .25 + i) * 8;
      const y = G.hash(i, 9, 3) * vh;
      const a = .07 + .10 * (Math.sin(t * .8 + i * 1.7) * .5 + .5);
      ctx.strokeStyle = `rgba(189,228,216,${a})`;
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.quadraticCurveTo(x, y - 2, x + 10, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const GRASS = [
    [123, 154, 79], [132, 163, 86], [116, 146, 75], [140, 168, 92], [127, 158, 82]
  ];

  function drawTile(x, y, t) {
    const tile = G.terrainAt(x, y);
    if (!tile) return;
    const p = project(x, y);
    const s = G.camera.scale;
    const tw = G.TW * s, th = G.TH * s;
    const isWater = tile.kind === 'water';

    if (isWater) {
      diamond(p.x, p.y, tw, th, 0);
      const wg = ctx.createLinearGradient(p.x, p.y - th / 2, p.x, p.y + th / 2);
      wg.addColorStop(0, 'rgba(51,111,112,.94)');
      wg.addColorStop(.55, 'rgba(34,89,98,.96)');
      wg.addColorStop(1, 'rgba(25,72,83,.98)');
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,50,52,.42)';
      ctx.lineWidth = Math.max(.6, 1 * s);
      ctx.stroke();
      ctx.save();
      diamond(p.x, p.y, tw, th, 0);
      ctx.clip();
      for (let i = 0; i < 3; i++) {
        const u = G.hash(x, y, i + 70), v = G.hash(x, y, i + 80);
        const px = p.x + (u - v) * tw * .33;
        const py = p.y + (u + v - 1) * th * .34;
        const wob = Math.sin(t * 1.2 + i * 2 + x) * 2 * s;
        ctx.strokeStyle = `rgba(190,226,216,${.12 + .06 * i})`;
        ctx.lineWidth = Math.max(.6, 1 * s);
        ctx.beginPath();
        ctx.moveTo(px - 6 * s + wob, py);
        ctx.quadraticCurveTo(px + wob, py - 1.8 * s, px + 6 * s + wob, py);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // cliff faces
    const side = 14 * s;
    ctx.fillStyle = '#665538';
    ctx.beginPath();
    ctx.moveTo(p.x - tw / 2, p.y);
    ctx.lineTo(p.x, p.y + th / 2);
    ctx.lineTo(p.x, p.y + th / 2 + side);
    ctx.lineTo(p.x - tw / 2, p.y + side);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4d402b';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + th / 2);
    ctx.lineTo(p.x + tw / 2, p.y);
    ctx.lineTo(p.x + tw / 2, p.y + side);
    ctx.lineTo(p.x, p.y + th / 2 + side);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(31,26,16,.26)';
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(p.x - tw / 2, p.y + side);
    ctx.lineTo(p.x, p.y + th / 2 + side);
    ctx.lineTo(p.x + tw / 2, p.y + side);
    ctx.stroke();

    const c = GRASS[(tile.variant + x + y) % GRASS.length];
    diamond(p.x, p.y, tw, th, 0);
    ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    ctx.fill();

    // subtle isometric light/shade
    ctx.save();
    diamond(p.x, p.y, tw, th, 0);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,248,203,.055)';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - th / 2);
    ctx.lineTo(p.x - tw / 2, p.y);
    ctx.lineTo(p.x, p.y + th / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(24,49,27,.045)';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - th / 2);
    ctx.lineTo(p.x + tw / 2, p.y);
    ctx.lineTo(p.x, p.y + th / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(45,68,35,.30)';
    ctx.lineWidth = Math.max(.55, .8 * s);
    diamond(p.x, p.y, tw, th, 0);
    ctx.stroke();

    // blades and flowers
    const detail = tile.kind === 'rock' ? 1 : 4;
    for (let i = 0; i < detail; i++) {
      const u = G.hash(x, y, i + 11), v = G.hash(x, y, i + 21);
      const px = p.x + (u - v) * tw * .34;
      const py = p.y + (u + v - 1) * th * .34;
      const hh = (2 + G.hash(x, y, i + 31) * 3) * s;
      ctx.strokeStyle = `rgba(53,82,37,${.24 + .18 * G.hash(x, y, i + 41)})`;
      ctx.lineWidth = Math.max(.5, .8 * s);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px - 1.4 * s, py - hh * .6, px - 2.4 * s, py - hh);
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 1.4 * s, py - hh * .6, px + 2.2 * s, py - hh * .9);
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      if (G.hash(x, y, i + 50) > .17) continue;
      const u = G.hash(x, y, i + 61), v = G.hash(x, y, i + 71);
      const px = p.x + (u - v) * tw * .27;
      const py = p.y + (u + v - 1) * th * .27;
      const colors = ['#e7c86e', '#e7b1a6', '#d4b1d1', '#f0dca0'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = .72;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(.8, 1.2 * s), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // shoreline foam
    const south = G.terrainAt(x + 1, y), east = G.terrainAt(x, y + 1);
    if (!south || south.kind === 'water' || !east || east.kind === 'water') {
      ctx.strokeStyle = 'rgba(225,237,207,.33)';
      ctx.lineWidth = Math.max(.7, 1.2 * s);
      ctx.beginPath();
      if (!south || south.kind === 'water') {
        ctx.moveTo(p.x - tw / 2, p.y);
        ctx.lineTo(p.x, p.y + th / 2);
        ctx.lineTo(p.x, p.y + th / 2 + 2 * s);
      }
      if (!east || east.kind === 'water') {
        if (!south || south.kind === 'water') ctx.moveTo(p.x, p.y + th / 2 + 2 * s);
        else ctx.moveTo(p.x, p.y + th / 2);
        ctx.lineTo(p.x + tw / 2, p.y);
      }
      ctx.stroke();
    }
  }

  function drawIslandShadow() {
    ctx.save();
    ctx.globalAlpha = .14;
    ctx.fillStyle = '#06120c';
    const s = G.camera.scale;
    const tw = G.TW * s, th = G.TH * s;
    for (let y = 0; y < G.MAP_H; y++) {
      for (let x = 0; x < G.MAP_W; x++) {
        const tile = G.terrainAt(x, y);
        if (!tile || tile.kind === 'water') continue;
        const p = project(x, y);
        diamond(p.x, p.y + 16 * s, tw, th, 0);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawTerrain(t) {
    for (let sum = 0; sum <= G.MAP_W + G.MAP_H - 2; sum++) {
      for (let x = 0; x < G.MAP_W; x++) {
        const y = sum - x;
        if (y >= 0 && y < G.MAP_H) drawTile(x, y, t);
      }
    }
  }

  function cacheSignature() {
    let scene = '';
    for (const b of G.state.buildings) {
      scene += b.id + b.type + b.level + b.x + '.' + b.y + ',';
    }
    return [vw, vh, DPR,
      G.camera.scale.toFixed(4),
      G.camera.ox.toFixed(2),
      G.camera.oy.toFixed(2),
      scene].join('|');
  }

  function rebuildCaches() {
    if (!vw || !vh) return;
    if (!grainTile) grainTile = buildGrainTile();

    const mainCtx = ctx;

    ctx = mapCtx;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    if (!waterPattern) waterPattern = ctx.createPattern(waterTile, 'repeat');
    if (!mapGrain) mapGrain = ctx.createPattern(grainTile, 'repeat');
    drawWaterBase();
    drawIslandShadow();
    drawTerrain(0);
    drawRoads();
    drawPondReeds(0);

    hitObjects.length = 0;
    const objs = [];
    for (const b of G.state.buildings) {
      if (b.type === 'road') continue;
      objs.push({ kind: 'building', b, depth: b.x + b.y + .01 });
    }
    for (const prop of G.scenery) {
      if (prop.decor && G.buildingAt(prop.x, prop.y)) continue;
      objs.push({ kind: 'scenery', prop, depth: sceneryDepth(prop) });
    }
    objs.sort((a, b) => a.depth - b.depth || (a.b?.x || 0) - (b.b?.x || 0));
    for (const o of objs) {
      if (o.kind === 'building') drawBuilding(o.b, 0);
      else drawScenery(o.prop, 0);
    }
    drawFinish(mapGrain);

    ctx = mainCtx;
    mapSig = cacheSignature();
  }

  function drawRoads() {
    const s = G.camera.scale;
    const tw = G.TW * s, th = G.TH * s;
    const roads = G.state.buildings.filter(b => b.type === 'road');
    for (const r of roads) {
      const p = project(r.x, r.y);
      diamond(p.x, p.y, tw, th, 1);
      ctx.fillStyle = '#a99a7e';
      ctx.fill();
      diamond(p.x, p.y, tw, th, 2.5 * s);
      ctx.fillStyle = '#8e8069';
      ctx.fill();
      // cobbles
      ctx.save();
      diamond(p.x, p.y, tw, th, 1);
      ctx.clip();
      for (let i = 0; i < 8; i++) {
        const u = G.hash(r.x, r.y, i + 1), v = G.hash(r.x, r.y, i + 7);
        const px = p.x + (u - v) * tw * .38;
        const py = p.y + (u + v - 1) * th * .38;
        const rw = (2.4 + G.hash(r.x, r.y, i + 10) * 3.6) * s;
        const rh = rw * .44;
        ctx.beginPath();
        ctx.ellipse(px, py, rw, rh, 0, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? 'rgba(184,169,139,.64)' : 'rgba(201,187,157,.52)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(92,79,58,.28)';
        ctx.lineWidth = .6;
        ctx.stroke();
      }
      // gently worn centre
      ctx.strokeStyle = 'rgba(92,75,52,.17)';
      ctx.lineWidth = Math.max(.7, 1 * s);
      ctx.beginPath();
      ctx.moveTo(p.x - tw * .22, p.y + th * .05);
      ctx.lineTo(p.x + tw * .18, p.y + th * .23);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSceneryShadow(prop, p, scale, size) {
    ctx.save();
    ctx.globalAlpha = .23;
    ctx.fillStyle = '#162b17';
    ctx.beginPath();
    ctx.ellipse(p.x + 3 * scale, p.y + 2 * scale, size * .34, size * .12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const sceneryBase = { oak1: 84, oak2: 88, pine1: 73, pine2: 66, poplar: 55, bush: 58, rock: 80, flowers: 56, fence: 72, boat: 75 };

  function drawScenery(prop, t) {
    if (prop.decor && G.buildingAt(prop.x, prop.y)) return;
    if (prop.water && G.buildingAt(prop.x, prop.y)) return;
    const img = images[prop.sprite];
    if (!img) return;
    const p = project(prop.x + (prop.dx || 0), prop.y + (prop.dy || 0));
    const s = G.camera.scale;
    const base = sceneryBase[prop.sprite] || 70;
    const w = base * prop.scale * s;
    const h = w * (img.height / img.width);
    const bottom = p.y + G.TH * .33 * s + (prop.sprite === 'bush' ? 4 * s : 0);
    drawSceneryShadow(prop, p, s, w);
    // gentle breezy sway
    const sway = Math.sin(t * .7 + prop.x * .9 + prop.y) * (.7 + .6 * prop.scale) * s;
    ctx.save();
    if (prop.sprite !== 'rock' && prop.sprite !== 'fence' && prop.sprite !== 'flowers') {
      ctx.translate(p.x, bottom);
      ctx.transform(1, 0, sway / (w * 6), 1, 0, 0);
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      ctx.drawImage(img, p.x - w / 2, bottom - h, w, h);
    }
    ctx.restore();
  }

  function spriteFor(b) {
    if (b.type === 'house') return 'house' + (((b.variant || 1) - 1) % 3 + 1);
    return b.type;
  }

  function tintedSprite(key, img, color) {
    const cacheKey = key + '|' + color;
    if (ghostTints[cacheKey]) return ghostTints[cacheKey];
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    ghostTints[cacheKey] = c;
    return c;
  }

  function drawBuilding(b, t) {
    const def = G.BUILDINGS[b.type];
    if (!def) return;
    const key = spriteFor(b);
    const img = images[key];
    const p = project(b.x, b.y);
    const s = G.camera.scale;
    const artW = (def.art?.w || 150) * s;
    const bottom = p.y + G.TH * .36 * s + (def.art?.dy || 0) * s;
    let w = artW;
    let h = img ? artW * (img.height / img.width) : artW * .9;

    ctx.save();
    ctx.globalAlpha = .26;
    ctx.fillStyle = '#172b18';
    ctx.beginPath();
    ctx.ellipse(p.x + 2 * s, p.y + G.TH * .18 * s, artW * .33, artW * .1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (img) ctx.drawImage(img, p.x - w / 2, bottom - h, w, h);
    else {
      // graceful fallback while art loads
      const g = ctx.createLinearGradient(p.x, bottom - h, p.x, bottom);
      g.addColorStop(0, '#c9b18a'); g.addColorStop(1, '#7f6242');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(p.x, bottom - h);
      ctx.lineTo(p.x + w * .4, bottom - h * .45);
      ctx.lineTo(p.x + w * .4, bottom);
      ctx.lineTo(p.x - w * .4, bottom);
      ctx.lineTo(p.x - w * .4, bottom - h * .45);
      ctx.closePath();
      ctx.fill();
    }

    const hit = { b, x: p.x - w / 2, y: bottom - h, w, h, depth: b.x + b.y };
    hitObjects.push(hit);

    if (b.level > 1) drawLevelPips(b, p, bottom - h, artW, s);
    return { p, w, h, bottom };
  }

  function drawLevelPips(b, p, top, w, s) {
    const n = b.level - 1;
    const y = top + 11 * s;
    for (let i = 0; i < n; i++) {
      const x = p.x + (i - (n - 1) / 2) * 9 * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#e5c269';
      ctx.strokeStyle = 'rgba(83,57,22,.8)';
      ctx.lineWidth = .8 * s;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * Math.PI * 2 / 5;
        const r = 3.2 * s;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function sceneryDepth(prop) {
    return prop.x + (prop.dx || 0) + prop.y + (prop.dy || 0) + (prop.sort || 0) * .12;
  }

  function drawPondReeds(t) {
    // small animated glints on the pond
    for (const [x, y] of [[2, 8], [3, 8], [2, 9], [3, 9]]) {
      const p = project(x, y);
      const s = G.camera.scale;
      for (let i = 0; i < 3; i++) {
        const px = p.x + (G.hash(x, y, i) - .5) * G.TW * .55 * s;
        const py = p.y + (G.hash(x, y, i + 10) - .5) * G.TH * .55 * s;
        ctx.strokeStyle = `rgba(208,235,220,${.12 + .07 * Math.sin(t + i)})`;
        ctx.lineWidth = .8 * s;
        ctx.beginPath();
        ctx.moveTo(px - 5 * s, py);
        ctx.quadraticCurveTo(px, py - 1.5 * s, px + 5 * s, py);
        ctx.stroke();
      }
    }
  }

  function drawCloudShadows(t) {
    const s = G.camera.scale;
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const x = ((t * (6 + i * 3) + i * 620) % (vw + 800)) - 240;
      const y = vh * (.28 + i * .28);
      const r = 220 + i * 90;
      const g = ctx.createRadialGradient(x, y, 5, x, y, r);
      g.addColorStop(0, 'rgba(17,41,24,.12)');
      g.addColorStop(.7, 'rgba(17,41,24,.055)');
      g.addColorStop(1, 'rgba(17,41,24,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.7, .58);
      ctx.translate(-x, -y);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBirds(t) {
    ctx.save();
    ctx.strokeStyle = 'rgba(28,43,30,.48)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 4; i++) {
      const speed = 7 + i * 2.6;
      const x = ((t * speed + i * 340) % (vw + 280)) - 140;
      const y = 118 + i * 27 + Math.sin(t * .6 + i * 2) * 6;
      const flap = Math.sin(t * 4 + i) * 2.4;
      ctx.beginPath();
      ctx.moveTo(x - 6, y + flap);
      ctx.quadraticCurveTo(x - 2, y - 2, x, y);
      ctx.quadraticCurveTo(x + 2, y - 2, x + 6, y + flap);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMotes(t) {
    ctx.save();
    for (let i = 0; i < 22; i++) {
      const h = G.hash(i, 3, 5), v = G.hash(i, 8, 2);
      const x = h * vw + Math.sin(t * .18 + i) * 20;
      const y = vh * .28 + v * vh * .48 + Math.cos(t * .22 + i * 1.3) * 13;
      const a = .08 + .16 * (Math.sin(t * .9 + i * 2.2) * .5 + .5);
      ctx.fillStyle = `rgba(245,220,153,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, .8 + h * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSelection(t) {
    if (!G.ui.selected) return;
    const b = G.state.buildings.find(x => x.id === G.ui.selected);
    if (!b) return;
    const p = project(b.x, b.y);
    const s = G.camera.scale;
    const tw = G.TW * s, th = G.TH * s;
    const pulse = .55 + .25 * Math.sin(t * 4);
    ctx.save();
    diamond(p.x, p.y, tw + 7 * s, th + 4 * s, 0);
    ctx.strokeStyle = `rgba(242,211,133,${pulse})`;
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56,36,16,.5)';
    ctx.lineWidth = .8 * s;
    diamond(p.x, p.y, tw + 2 * s, th + 1 * s, 0);
    ctx.stroke();
    // corner studs
    const points = [[p.x, p.y - th / 2], [p.x + tw / 2, p.y], [p.x, p.y + th / 2], [p.x - tw / 2, p.y]];
    for (const pt of points) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.2 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#efd085';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHoverAndGhost(t) {
    const hover = G.ui.hover;
    if (!hover || hover.x < 0 || hover.y < 0 || hover.x >= G.MAP_W || hover.y >= G.MAP_H) return;
    const p = project(hover.x, hover.y);
    const s = G.camera.scale;
    const tw = G.TW * s, th = G.TH * s;

    if (G.ui.demolish) {
      const b = G.buildingAt(hover.x, hover.y);
      if (b) {
        diamond(p.x, p.y, tw, th, 0);
        ctx.fillStyle = 'rgba(166,58,42,.24)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(228,126,103,.9)';
        ctx.lineWidth = 2 * s;
        ctx.stroke();
      }
      return;
    }

    if (!G.ui.buildType) {
      diamond(p.x, p.y, tw, th, 0);
      ctx.strokeStyle = 'rgba(242,215,147,.35)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();
      return;
    }

    const def = G.BUILDINGS[G.ui.buildType];
    if (!def) return;
    const check = G.canPlace(G.ui.buildType, hover.x, hover.y, true);
    const ok = check.ok;
    const img = images[spriteFor({ type: G.ui.buildType, variant: 1 })];
    diamond(p.x, p.y, tw, th, 0);
    ctx.fillStyle = ok ? 'rgba(153,194,101,.23)' : 'rgba(167,72,54,.25)';
    ctx.fill();
    ctx.strokeStyle = ok ? 'rgba(214,236,161,.9)' : 'rgba(234,130,107,.9)';
    ctx.lineWidth = 1.6 * s;
    ctx.stroke();

    if (G.ui.buildType !== 'road' && img) {
      const artW = (def.art?.w || 150) * s;
      const bottom = p.y + G.TH * .36 * s + (def.art?.dy || 0) * s;
      const h = artW * (img.height / img.width);
      ctx.save();
      ctx.globalAlpha = .5;
      const drawImg = ok ? img : tintedSprite(spriteFor({ type: G.ui.buildType, variant: 1 }), img, 'rgba(150,40,24,.33)');
      ctx.drawImage(drawImg, p.x - artW / 2, bottom - h, artW, h);
      ctx.restore();
    } else if (G.ui.buildType === 'road') {
      diamond(p.x, p.y, tw, th, 2);
      ctx.fillStyle = ok ? 'rgba(173,154,121,.78)' : 'rgba(138,66,49,.73)';
      ctx.fill();
    }
  }

  function drawBuildMarkers(t) {
    if (!G.ui.buildType) return;
    const s = G.camera.scale;
    const pulse = .35 + .2 * Math.sin(t * 2.8);
    for (let y = 0; y < G.MAP_H; y++) {
      for (let x = 0; x < G.MAP_W; x++) {
        const tile = G.terrainAt(x, y);
        if (!tile || tile.kind !== 'grass' || G.buildingAt(x, y)) continue;
        const p = project(x, y);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#f0d48a';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 2.2 * s);
        ctx.lineTo(p.x + 2.2 * s, p.y);
        ctx.lineTo(p.x, p.y + 2.2 * s);
        ctx.lineTo(p.x - 2.2 * s, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawDemolishMarks(t) {
    if (!G.ui.demolish) return;
    const s = G.camera.scale;
    for (const b of G.state.buildings) {
      if (b.type === 'keep') continue;
      const p = project(b.x, b.y);
      ctx.save();
      ctx.globalAlpha = .3 + .15 * Math.sin(t * 3);
      ctx.strokeStyle = '#dc8a70';
      ctx.lineWidth = 1.2 * s;
      const r = 5 * s;
      ctx.beginPath();
      ctx.moveTo(p.x - r, p.y - r); ctx.lineTo(p.x + r, p.y + r);
      ctx.moveTo(p.x + r, p.y - r); ctx.lineTo(p.x - r, p.y + r);
      ctx.stroke();
      ctx.restore();
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a * p.alpha;
      ctx.fillStyle = p.color;
      if (p.kind === 'spark') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-p.size * .5, -p.size * 1.4, p.size, p.size * 2.8);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.2 - a * .2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function spawnFx(detail) {
    const s = G.camera.scale;
    const kind = detail.kind;
    const tile = detail.x != null ? project(detail.x, detail.y) : project(6, 4);
    if (kind === 'build' || kind === 'upgrade' || kind === 'demolish') {
      const colors = kind === 'demolish' ? ['#b58155', '#8b6341', '#d2b17e'] : ['#e3c27b', '#c9a363', '#f0d995', '#b9a07b'];
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (20 + Math.random() * 70) * s;
        particles.push({
          kind: 'dust', x: tile.x + (Math.random() - .5) * 45 * s, y: tile.y + (Math.random() - .2) * 20 * s,
          vx: Math.cos(a) * sp, vy: -Math.abs(Math.sin(a)) * sp * .7 - 15 * s,
          gravity: 95 * s, life: .65 + Math.random() * .65, maxLife: 1.3,
          size: (1.5 + Math.random() * 3.5) * s, color: colors[i % colors.length], alpha: .5
        });
      }
    }
    if (kind === 'levelup' || kind === 'quest') {
      for (let i = 0; i < 34; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({
          kind: 'spark', x: tile.x + (Math.random() - .5) * 100 * s, y: tile.y - 30 * s,
          vx: Math.cos(a) * (20 + Math.random() * 80) * s, vy: -(30 + Math.random() * 90) * s,
          gravity: 40 * s, life: .9 + Math.random() * .9, maxLife: 1.8,
          size: (1.3 + Math.random() * 2) * s, color: i % 3 ? '#edd18a' : '#fff1c1', alpha: .8, rot: Math.random() * 6
        });
      }
    }
    if (kind === 'growth' || kind === 'festival') {
      for (let i = 0; i < 14; i++) {
        particles.push({
          kind: 'spark', x: tile.x + (Math.random() - .5) * 150 * s, y: tile.y - 40 * s,
          vx: (Math.random() - .5) * 20 * s, vy: -(20 + Math.random() * 45) * s,
          gravity: 8 * s, life: 1.1 + Math.random(), maxLife: 2.1,
          size: (1.1 + Math.random() * 1.6) * s, color: i % 2 ? '#f3da94' : '#d7b2d0', alpha: .8, rot: 0
        });
      }
    }
  }
  window.addEventListener('kb:fx', e => spawnFx(e.detail || {}));

  function drawSmoke(t) {
    if (!G.state) return;
    const s = G.camera.scale;
    for (const b of G.state.buildings) {
      if (!['house', 'tavern', 'factory', 'keep', 'lumber'].includes(b.type)) continue;
      if (b.type === 'lumber') continue;
      const def = G.BUILDINGS[b.type];
      const p = project(b.x, b.y);
      const artW = (def.art?.w || 150) * s;
      const bottom = p.y + G.TH * .36 * s + (def.art?.dy || 0) * s;
      const top = bottom - artW;
      const offset = b.type === 'keep' ? artW * .1 : (b.type === 'house' ? artW * .18 : -artW * .12);
      const baseX = p.x + offset;
      const baseY = b.type === 'keep' ? top + artW * .30 : top + artW * .43;
      for (let i = 0; i < 3; i++) {
        const age = ((t * .17 + i / 3 + G.hash(b.x, b.y, i) * .8) % 1);
        const y = baseY - age * 42 * s;
        const x = baseX + Math.sin(age * 6 + i * 2.2) * 5 * s + age * 7 * s;
        const a = .14 * (1 - age);
        ctx.fillStyle = `rgba(221,218,203,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, (1.4 + age * 4.4) * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function render(t) {
    const dt = lastFrame ? Math.min(.05, t - lastFrame) : .016;
    lastFrame = t;
    const D = G.debugRender || {};
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    if (cacheSignature() !== mapSig) rebuildCaches();
    if (D.glints !== false) drawWaterGlints(t);

    if (D.clouds !== false) drawCloudShadows(t);
    if (D.markers !== false) drawBuildMarkers(t);
    if (D.demolishMarks !== false) drawDemolishMarks(t);

    if (D.smoke !== false) drawSmoke(t);
    if (D.selection !== false) drawSelection(t);
    if (D.hover !== false) drawHoverAndGhost(t);
    if (D.motes !== false) drawMotes(t);
    if (D.birds !== false) drawBirds(t);
    if (D.particles !== false) { updateParticles(dt); drawParticles(); }

    requestAnimationFrame(render);
  }

  // ---------- interaction ----------
  function setModeUI() {
    const dock = document.getElementById('buildDock');
    const modeText = document.getElementById('modeText');
    const hint = document.getElementById('mapHint');
    const buildType = G.ui.buildType;
    const name = buildType ? G.BUILDINGS[buildType].name : '';
    dock.classList.toggle('building', !!(buildType || G.ui.demolish));
    canvas.classList.toggle('build-mode', !!buildType);
    canvas.classList.toggle('pointer', !buildType && !G.ui.demolish);
    if (buildType) {
      modeText.textContent = `Placing ${name} · tap a plot`;
      hint.innerHTML = `<span class="hint-key">✦</span><span>Tap a grassy plot to place ${name}. <b>Esc</b> to stop.</span>`;
      hint.classList.remove('hidden');
    } else if (G.ui.demolish) {
      modeText.textContent = 'Bulldoze selected';
      hint.innerHTML = `<span class="hint-key">✦</span><span>Tap a structure to salvage it. <b>Esc</b> to stop.</span>`;
      hint.classList.remove('hidden');
    } else {
      modeText.textContent = G.ui.selected ? 'Inspecting the realm' : 'Village view';
      hint.innerHTML = `<span class="hint-key">✦</span><span>Choose a building below, then tap a grassy plot.</span>`;
      hint.classList.remove('hidden');
    }
    window.dispatchEvent(new CustomEvent('kb:mode', { detail: { buildType, demolish: G.ui.demolish, selected: G.ui.selected } }));
  }

  G.setBuildMode = function (type) {
    if (!type) { G.cancelBuild(); return; }
    G.ui.buildType = type;
    G.ui.demolish = false;
    G.ui.selected = null;
    setModeUI();
    if (G.refreshUI) G.refreshUI();
  };

  G.setDemolishMode = function () {
    G.ui.demolish = !G.ui.demolish;
    G.ui.buildType = null;
    G.ui.selected = null;
    setModeUI();
    if (G.refreshUI) G.refreshUI();
  };

  G.cancelBuild = function () {
    G.ui.buildType = null;
    G.ui.demolish = false;
    G.ui.hover = null;
    setModeUI();
    if (G.refreshUI) G.refreshUI();
  };

  G.clearSelection = function () {
    G.ui.selected = null;
    G.ui.buildType = null;
    G.ui.demolish = false;
    setModeUI();
    window.dispatchEvent(new CustomEvent('kb:selection', { detail: null }));
    if (G.refreshUI) G.refreshUI();
  };

  G.selectBuilding = function (id) {
    G.ui.selected = id;
    G.ui.buildType = null;
    G.ui.demolish = false;
    setModeUI();
    window.dispatchEvent(new CustomEvent('kb:selection', { detail: { id } }));
    if (G.refreshUI) G.refreshUI();
  };

  function hitAt(sx, sy) {
    for (let i = hitObjects.length - 1; i >= 0; i--) {
      const h = hitObjects[i];
      if (sx >= h.x && sx <= h.x + h.w && sy >= h.y && sy <= h.y + h.h) return h;
    }
    return null;
  }

  function handleMapClick(sx, sy) {
    const hit = hitAt(sx, sy);
    const tile = G.screenToTile(sx, sy);

    if (G.ui.buildType) {
      const target = hit ? { x: hit.b.x, y: hit.b.y } : tile;
      if (G.buildingAt(target.x, target.y)) {
        G.toast('Plot occupied', 'Choose an empty grassy plot for your new building.', 'bad', '✕');
        return;
      }
      const res = G.place(G.ui.buildType, target.x, target.y);
      if (res.ok) {
        const def = G.BUILDINGS[G.ui.buildType];
        G.toast(`${def.name} raised`, `A fine addition to Valewood. +${def.xp} renown.`, 'good', '⚒');
        G.camera.panX += 0;
        if (G.refreshUI) G.refreshUI(true);
      } else if (res.missing) {
        const chip = document.querySelector(`.resource-chip[data-res="${res.missing}"]`);
        if (chip) { chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); }
      }
      return;
    }

    if (G.ui.demolish) {
      const b = hit?.b || G.buildingAt(tile.x, tile.y);
      if (!b) { G.toast('Nothing to remove', 'Tap a building or road to salvage it.', '', '⌫'); return; }
      G.demolish(b.id);
      G.ui.selected = null;
      if (G.refreshUI) G.refreshUI(true);
      return;
    }

    if (hit) {
      G.selectBuilding(hit.b.id);
      return;
    }
    const b = G.buildingAt(tile.x, tile.y);
    if (b) {
      G.selectBuilding(b.id);
      return;
    }
    if (G.terrainAt(tile.x, tile.y) && G.terrainAt(tile.x, tile.y).kind === 'water') {
      G.toast('The river', 'Boats and bridges will come another day.', '', '≈');
      return;
    }
    G.clearSelection();
  }

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function beginPinch() {
    const arr = Array.from(pointers.values());
    if (arr.length < 2) return;
    const dx = arr[0].x - arr[1].x, dy = arr[0].y - arr[1].y;
    pinch = { dist: Math.max(20, Math.hypot(dx, dy)), zoom: G.camera.userZoom };
    G.ui.dragging = true;
    suppressTap = true;
    drag = null;
  }

  canvas.addEventListener('pointerdown', e => {
    if (e.button === 2) { G.cancelBuild(); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pos = pointerPos(e);
    pointers.set(e.pointerId, { x: pos.x, y: pos.y, startX: pos.x, startY: pos.y, id: e.pointerId });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ }
    if (pointers.size === 2) beginPinch();
    else if (pointers.size === 1) {
      drag = { id: e.pointerId, x: pos.x, y: pos.y, startX: pos.x, startY: pos.y, moved: false, t: performance.now() };
      G.ui.hover = G.screenToTile(pos.x, pos.y);
    }
  });

  canvas.addEventListener('pointermove', e => {
    const pos = pointerPos(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { ...pointers.get(e.pointerId), x: pos.x, y: pos.y });

    if (pointers.size === 2 && pinch) {
      const arr = Array.from(pointers.values());
      const dist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      const z = G.clamp(pinch.zoom * (dist / pinch.dist), G.camera.minZoom, G.camera.maxZoom);
      G.camera.userZoom = z;
      updateCamera();
      clampPan();
      G.ui.dragging = true;
      return;
    }

    if (drag && pointers.size === 1 && e.pointerId === drag.id) {
      const dx = pos.x - drag.x, dy = pos.y - drag.y;
      if (Math.abs(pos.x - drag.startX) + Math.abs(pos.y - drag.startY) > 6) {
        drag.moved = true;
        G.ui.dragging = true;
      }
      if (drag.moved) {
        G.camera.panX += dx;
        G.camera.panY += dy;
        clampPan();
        updateCamera();
      }
      drag.x = pos.x; drag.y = pos.y;
      G.ui.hover = null;
      return;
    }

    if (e.pointerType === 'mouse') {
      const tile = G.screenToTile(pos.x, pos.y);
      G.ui.hover = tile;
      canvas.classList.toggle('pointer', !G.ui.buildType && !G.ui.demolish && !!G.buildingAt(tile.x, tile.y));
    }
  });

  function endPointer(e, cancelled = false) {
    const wasDrag = drag?.moved;
    const wasPinch = !!pinch;
    const pos = pointerPos(e);
    const onePointer = pointers.size === 1;
    if (!cancelled && onePointer && !wasDrag && !wasPinch && !suppressTap && drag && e.pointerId === drag.id) {
      handleMapClick(pos.x, pos.y);
    }
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      suppressTap = false;
      drag = null;
      G.ui.dragging = false;
    }
  }

  canvas.addEventListener('pointerup', e => endPointer(e));
  canvas.addEventListener('pointercancel', e => endPointer(e, true));
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const pos = pointerPos(e);
    const oldScale = G.camera.scale;
    const wx = (pos.x - G.camera.ox) / oldScale;
    const wy = (pos.y - G.camera.oy) / oldScale;
    const factor = Math.exp(-e.deltaY * .0012);
    G.camera.userZoom = G.clamp(G.camera.userZoom * factor, G.camera.minZoom, G.camera.maxZoom);
    const oldPanX = G.camera.panX, oldPanY = G.camera.panY;
    updateCamera();
    const newScale = G.camera.scale;
    G.camera.panX = pos.x - wx * newScale - (vw / 2 - 75 * newScale);
    G.camera.panY = pos.y - wy * newScale - ((vw < 760 ? vh * .475 : vh * .5) - 287.5 * newScale);
    clampPan();
    updateCamera();
  }, { passive: false });

  window.addEventListener('resize', () => {
    G.resizeWorld();
  });

  G.startWorld = function () {
    G.resizeWorld();
    requestAnimationFrame(t => {
      lastFrame = t;
      requestAnimationFrame(render);
    });
  };

  G.setModeUI = setModeUI;
})();
