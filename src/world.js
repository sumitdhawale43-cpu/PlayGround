import * as THREE from 'three';
import { createNPC } from './character.js';

/* ------------------------------------------------------------------ */
/* deterministic helpers                                               */
/* ------------------------------------------------------------------ */
export function rng(seed = 1337) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
const dist2 = (x, z, cx, cz) => Math.hypot(x - cx, z - cz);
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* palette + shared materials                                          */
/* ------------------------------------------------------------------ */
export const PALETTE = {
  skyTop: 0x4fb9f0,
  skyHorizon: 0xffd9e8,
  skyBottom: 0xbfefff,
  grass: 0x6fae4c,
  grassLight: 0x9bcf62,
  grassDark: 0x3f7f42,
  sand: 0xd9c08b,
  stone: 0x9a9d9c,
  stoneDark: 0x5b636d,
  wood: 0x6b4a33,
  woodDark: 0x3e2a20,
  roof: 0x275c68,
  roofLight: 0x3a7c84,
  plaster: 0xf2e3c6,
  gold: 0xffd37a,
  cyan: 0x7df9ff,
  purple: 0x9b5cff,
  darkPurple: 0x2a143f,
  water: 0x2fb6cf,
};

function gradientMap() {
  const data = new Uint8Array([95, 95, 95, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function makeMats(gradient) {
  const m = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
  return {
    gradient,
    grass: m(0xffffff, { vertexColors: true }),
    trunk: m(PALETTE.woodDark),
    trunkLight: m(PALETTE.wood),
    leaf: m(0xffffff, { flatShading: true }),
    leaf2: m(0x7dc35c, { flatShading: true }),
    pine: m(0xffffff, { flatShading: true }),
    rock: m(0x8d959c, { flatShading: true }),
    rockDark: m(0x5c6570, { flatShading: true }),
    sand: m(PALETTE.sand),
    stone: m(PALETTE.stone, { flatShading: true }),
    stoneDark: m(PALETTE.stoneDark, { flatShading: true }),
    plaster: m(PALETTE.plaster),
    wood: m(PALETTE.wood),
    woodDark: m(PALETTE.woodDark),
    roof: m(PALETTE.roof, { flatShading: true }),
    roofLight: m(PALETTE.roofLight, { flatShading: true }),
    red: m(0xb8444b, { flatShading: true }),
    gold: m(PALETTE.gold, { emissive: 0x8a5a12, emissiveIntensity: 0.35 }),
    cyan: m(0x9ffbff, { emissive: 0x2bd3e6, emissiveIntensity: 0.9 }),
    purple: m(0x9b5cff, { emissive: 0x4b1d8a, emissiveIntensity: 0.8 }),
    dark: m(0x1d2030, { flatShading: true }),
    flame: m(0xffb347, { emissive: 0xff6a00, emissiveIntensity: 1.6 }),
  };
}

/* ------------------------------------------------------------------ */
/* canvas textures                                                     */
/* ------------------------------------------------------------------ */
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cloudTexture() {
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const blobs = [[70, 95, 58], [125, 70, 66], [185, 92, 52], [110, 105, 72], [160, 108, 46]];
    for (const [x, y, r] of blobs) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,.95)');
      g.addColorStop(0.55, 'rgba(244,251,255,.72)');
      g.addColorStop(1, 'rgba(220,242,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  });
}

function glowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(235,253,255,.85)');
    g.addColorStop(0.55, 'rgba(190,240,255,.28)');
    g.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

function markerTexture(char = '!', color = '#ffd37a') {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.shadowColor = color; ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    ctx.font = 'bold 92px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(char, w / 2, h / 2 + 4);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(10,16,38,.6)'; ctx.lineWidth = 3;
    ctx.strokeText(char, w / 2, h / 2 + 4);
  });
}

function runeTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#171022'; ctx.fillRect(0, 0, w, h);
    // stone noise
    for (let i = 0; i < 2600; i++) {
      const a = Math.random() * 0.1;
      ctx.fillStyle = `rgba(${120 + Math.random() * 60},${90 + Math.random() * 50},${150 + Math.random() * 60},${a})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 9, 2 + Math.random() * 9);
    }
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = 'rgba(180,105,255,.55)'; ctx.lineWidth = 5;
    ctx.shadowColor = '#b46bff'; ctx.shadowBlur = 18;
    for (const r of [78, 122, 190]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy, 155, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const x1 = cx + Math.cos(a) * 122, y1 = cy + Math.sin(a) * 122;
      const x2 = cx + Math.cos(a + 0.26) * 190, y2 = cy + Math.sin(a + 0.26) * 190;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + 0.2;
      const x = cx + Math.cos(a) * 78, y = cy + Math.sin(a) * 78;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, -12); ctx.lineTo(9, 0); ctx.lineTo(0, 12); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  });
}

/* ------------------------------------------------------------------ */
/* main world                                                          */
/* ------------------------------------------------------------------ */
export function createWorld(scene) {
  const gradient = gradientMap();
  const mats = makeMats(gradient);
  const R = rng(20261031);
  const colliders = [];
  const island = new THREE.Group();
  island.name = 'island';
  scene.add(island);

  const VILLAGE = { x: 0, z: 38 };
  const TEMPLE = { x: 0, z: -64 };
  const LAKE = { x: 52, z: 14 };
  const GATE = { x: -48, z: -46 };
  const DUNGEON_ORIGIN = new THREE.Vector3(0, 0, -220);

  /* ---------------- terrain ---------------- */
  const terrainSize = 250;
  const seg = 118;
  function baseHeight(x, z) {
    let h = 1.55 * Math.sin(x * 0.054) * Math.cos(z * 0.048)
      + 0.9 * Math.sin((x + z) * 0.108)
      + 0.5 * Math.cos(x * 0.155 - z * 0.09);
    h += 4.2 * Math.exp(-((x + 38) ** 2 + (z + 20) ** 2) / 950);
    h += 5.8 * Math.exp(-((x - 66) ** 2 + (z + 38) ** 2) / 820);
    h += 2.8 * Math.exp(-((x - 20) ** 2 + (z - 72) ** 2) / 900);
    // village clearing
    h = lerp(h, 2.45, 1 - smoothstep(16, 30, dist2(x, z, VILLAGE.x, VILLAGE.z)));
    // temple plateau
    h = lerp(h, 11.0, 1 - smoothstep(12, 25, dist2(x, z, TEMPLE.x, TEMPLE.z)));
    // lake bowl
    h = lerp(h, -3.4, 1 - smoothstep(9, 26, dist2(x, z, LAKE.x, LAKE.z)));
    // dungeon gate clearing
    h = lerp(h, 4.4, 1 - smoothstep(10, 21, dist2(x, z, GATE.x, GATE.z)));
    // island rim lifts into cliffs
    const d = Math.hypot(x, z);
    h += smoothstep(97, 126, d) * 25;
    return h;
  }
  const heightAt = (x, z) => baseHeight(x, z);

  const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cGrass = new THREE.Color(PALETTE.grass);
  const cLight = new THREE.Color(PALETTE.grassLight);
  const cDark = new THREE.Color(PALETTE.grassDark);
  const cSand = new THREE.Color(PALETTE.sand);
  const cStone = new THREE.Color(0x8d908f);
  const cRock = new THREE.Color(0x6a7079);
  const cPath = new THREE.Color(0xc6a97a);
  const cCorrupt = new THREE.Color(0x4a2f63);
  const tmpC = new THREE.Color();

  const pathSegments = [
    [0, 48, 0, 38], [0, 38, 3, 10], [3, 10, 0, -20], [0, -20, 0, -48],
    [0, 38, 22, 30], [22, 30, 40, 20], [0, 38, -24, 32], [-24, 32, -40, 4],
    [3, 10, -28, -10], [-28, -10, -44, -34], [-44, -34, -48, -46],
  ];
  function distToPaths(x, z) {
    let best = 1e9;
    for (const [x1, z1, x2, z2] of pathSegments) {
      const dx = x2 - x1, dz = z2 - z1;
      const t = clamp(((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz), 0, 1);
      best = Math.min(best, Math.hypot(x - (x1 + dx * t), z - (z1 + dz * t)));
    }
    return best;
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = baseHeight(x, z);
    pos.setY(i, h);
    const slope = Math.abs(baseHeight(x + 1.2, z) - h) + Math.abs(baseHeight(x, z + 1.2) - h);
    const dVillage = dist2(x, z, VILLAGE.x, VILLAGE.z);
    const dTemple = dist2(x, z, TEMPLE.x, TEMPLE.z);
    const dLake = dist2(x, z, LAKE.x, LAKE.z);
    const dGate = dist2(x, z, GATE.x, GATE.z);
    const pathD = distToPaths(x, z);
    const n = Math.sin(x * 0.32) * Math.cos(z * 0.27) * 0.5 + 0.5;
    tmpC.copy(cGrass).lerp(cLight, n * 0.55);
    if (dLake < 30 && h < 1.4) tmpC.lerp(cSand, smoothstep(1.4, -0.4, h) * 0.9);
    if (dTemple < 15 || (pathD < 2.3 && dVillage < 36)) tmpC.lerp(cStone, dTemple < 15 ? 0.72 : 0.4);
    if (pathD < 1.9) tmpC.lerp(cPath, 0.65);
    if (slope > 1.1 || h > 16) tmpC.lerp(cRock, clamp((slope - 0.8) * 0.7 + (h - 16) * 0.04, 0, 0.8));
    if (dGate < 17) tmpC.lerp(cCorrupt, (1 - smoothstep(8, 17, dGate)) * 0.78);
    if (h < -1.2) tmpC.lerp(cDark, 0.35);
    const shade = 0.92 + n * 0.12;
    colors[i * 3] = tmpC.r * shade;
    colors[i * 3 + 1] = tmpC.g * shade;
    colors[i * 3 + 2] = tmpC.b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, mats.grass);
  terrain.receiveShadow = true;
  terrain.name = 'terrain';
  island.add(terrain);

  /* ---------------- sky, sun, clouds, mountains ---------------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(380, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x4fb9f0) },
        horizon: { value: new THREE.Color(0xffdce9) },
        bottom: { value: new THREE.Color(0xbfefff) },
        sunDir: { value: new THREE.Vector3(0.55, 0.45, -0.7).normalize() },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          float h = normalize(vDir).y;
          vec3 col = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.62)) : mix(horizon, bottom, pow(clamp(-h,0.0,1.0), 0.7));
          float sun = pow(max(dot(normalize(vDir), sunDir), 0.0), 220.0);
          float halo = pow(max(dot(normalize(vDir), sunDir), 0.0), 9.0);
          col += vec3(1.0,0.82,0.62) * sun * 1.4;
          col += vec3(1.0,0.72,0.55) * halo * 0.18;
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  sky.name = 'sky';
  sky.renderOrder = -20;
  scene.add(sky);

  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,238,190,1)'), color: 0xfff2d0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sun.position.set(170, 150, -240);
  sun.scale.set(80, 80, 1);
  scene.add(sun);

  const cloudMat = new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, opacity: 0.62, depthWrite: false, fog: false });
  const clouds = [];
  for (let i = 0; i < 20; i++) {
    const s = new THREE.Sprite(cloudMat.clone());
    const a = R() * TAU;
    const rad = 80 + R() * 120;
    s.position.set(Math.cos(a) * rad, 38 + R() * 36, Math.sin(a) * rad);
    const sc = 24 + R() * 40;
    s.scale.set(sc, sc * (0.45 + R() * 0.2), 1);
    s.material.opacity = 0.28 + R() * 0.4;
    s.userData.speed = 0.35 + R() * 0.5;
    scene.add(s);
    clouds.push(s);
  }

  const farMats = [new THREE.MeshToonMaterial({ color: 0x89a9c8, gradientMap: gradient, fog: true }), new THREE.MeshToonMaterial({ color: 0x9fbbd4, gradientMap: gradient, fog: true })];
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * TAU + R() * 0.12;
    const rad = 150 + R() * 60;
    const height = 22 + R() * 36;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(16 + R() * 22, height, 5 + (i % 3)), farMats[i % 2]);
    cone.position.set(Math.cos(a) * rad, height * 0.35, Math.sin(a) * rad);
    cone.rotation.y = R() * TAU;
    island.add(cone);
  }

  /* ---------------- water ---------------- */
  const waterUniforms = { time: { value: 0 }, deep: { value: new THREE.Color(0x116d8c) }, shallow: { value: new THREE.Color(0x5fe3e8) } };
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: waterUniforms,
    vertexShader: `
      uniform float time; varying vec2 vUv; varying float vWave;
      void main(){ vUv = uv; vec3 p = position;
        float w = sin(p.x*0.6 + time*1.4)*0.12 + cos(p.y*0.5 + time*1.1)*0.1;
        p.z += w; vWave = w;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }`,
    fragmentShader: `
      uniform float time; uniform vec3 deep; uniform vec3 shallow; varying vec2 vUv; varying float vWave;
      void main(){
        vec2 c = vUv - 0.5; float r = length(c)*2.0;
        vec3 col = mix(shallow, deep, smoothstep(0.15,1.0,r));
        float ripple = sin((vUv.x+vUv.y)*70.0 + time*2.0)*0.5+0.5;
        col += vec3(0.16,0.2,0.2) * pow(ripple,6.0) * 0.5;
        float edge = smoothstep(0.82,1.0,r);
        col = mix(col, vec3(0.85,0.97,1.0), edge*0.55);
        gl_FragColor = vec4(col, 0.78 + edge*0.18);
      }`,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(25.5, 72), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(LAKE.x, -0.55, LAKE.z);
  water.renderOrder = 3;
  island.add(water);

  const foam = new THREE.Mesh(new THREE.RingGeometry(24.1, 25.6, 72), new THREE.MeshBasicMaterial({ color: 0xe9ffff, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(LAKE.x, -0.5, LAKE.z);
  island.add(foam);

  /* ---------------- waterfall + cliffs ---------------- */
  const cliffGroup = new THREE.Group();
  cliffGroup.position.set(58, 0, -22);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 11; i++) {
    const rock = new THREE.Mesh(rockGeo, i % 3 ? mats.rock : mats.rockDark);
    const sc = 4 + R() * 7;
    rock.scale.set(sc, sc * (0.7 + R() * 0.7), sc);
    rock.position.set((R() - 0.5) * 15, 1 + R() * 8, (R() - 0.5) * 12);
    rock.rotation.set(R() * 2, R() * 2, R() * 2);
    rock.castShadow = true; rock.receiveShadow = true;
    cliffGroup.add(rock);
  }
  island.add(cliffGroup);

  const fallUniforms = { time: { value: 0 } };
  const waterfallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: fallUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float time; varying vec2 vUv;
      void main(){
        float streak = sin(vUv.y*42.0 - time*7.0 + sin(vUv.x*18.0)*2.0)*0.5+0.5;
        streak = pow(streak, 1.7);
        vec3 col = mix(vec3(0.42,0.85,0.95), vec3(0.95,1.0,1.0), streak);
        float edge = smoothstep(0.0,0.16,vUv.x)*smoothstep(1.0,0.84,vUv.x);
        gl_FragColor = vec4(col, (0.42+streak*0.5)*edge);
      }`,
  });
  const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 13, 1, 8), waterfallMat);
  waterfall.position.set(51.5, 5.0, -5.8);
  waterfall.rotation.y = -0.12;
  island.add(waterfall);
  const fallBase = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xdfffff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  fallBase.position.set(51.5, -0.3, -5.4); fallBase.scale.set(9, 4, 1);
  island.add(fallBase);

  // little pond stream from waterfall
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 16), new THREE.MeshBasicMaterial({ color: 0x4fd3df, transparent: true, opacity: 0.55, depthWrite: false }));
  stream.rotation.x = -Math.PI / 2; stream.position.set(51.6, -0.35, 2); island.add(stream);

  /* ---------------- forests & grass ---------------- */
  const treePositions = [];
  const pinePositions = [];
  const avoid = (x, z) => {
    if (Math.hypot(x, z) > 96) return true;
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < 26) return true;
    if (dist2(x, z, TEMPLE.x, TEMPLE.z) < 18) return true;
    if (dist2(x, z, LAKE.x, LAKE.z) < 29) return true;
    if (dist2(x, z, GATE.x, GATE.z) < 17) return true;
    if (distToPaths(x, z) < 4.2) return true;
    if (baseHeight(x, z) < 0.2 || baseHeight(x, z) > 17) return true;
    return false;
  };
  let guard = 0;
  while (treePositions.length < 118 && guard++ < 3000) {
    const x = (R() - 0.5) * 190, z = (R() - 0.5) * 190;
    if (avoid(x, z)) continue;
    // prefer forest zones
    const forest = Math.exp(-((x + 40) ** 2 + (z + 12) ** 2) / 1800) + Math.exp(-((x + 20) ** 2 + (z + 60) ** 2) / 1400) + 0.35;
    if (R() > forest) continue;
    treePositions.push({ x, z, y: baseHeight(x, z), s: 0.75 + R() * 0.75, r: R() * TAU });
  }
  guard = 0;
  while (pinePositions.length < 66 && guard++ < 2500) {
    const x = (R() - 0.5) * 185, z = (R() - 0.5) * 185;
    if (avoid(x, z)) continue;
    const pineZone = Math.exp(-((x - 58) ** 2 + (z + 30) ** 2) / 1300) + Math.exp(-((x + 56) ** 2 + (z + 42) ** 2) / 1000) + 0.18;
    if (R() > pineZone) continue;
    pinePositions.push({ x, z, y: baseHeight(x, z), s: 0.7 + R() * 0.85, r: R() * TAU });
  }

  function buildTreeInstances(list, pine = false) {
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 2.4, 6);
    trunkGeo.translate(0, 1.2, 0);
    const trunk = new THREE.InstancedMesh(trunkGeo, mats.trunk, list.length);
    trunk.castShadow = true; trunk.receiveShadow = true;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const col = new THREE.Color();
    list.forEach((t, i) => {
      p.set(t.x, t.y, t.z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.r); s.set(t.s, t.s, t.s);
      m.compose(p, q, s); trunk.setMatrixAt(i, m);
      colliders.push({ x: t.x, z: t.z, r: 0.5 * t.s, type: 'tree' });
    });
    island.add(trunk);
    if (pine) {
      const crownGeo = new THREE.ConeGeometry(1.45, 3.0, 7);
      const crown = new THREE.InstancedMesh(crownGeo, mats.pine, list.length * 3);
      crown.castShadow = true; crown.receiveShadow = true;
      let idx = 0;
      list.forEach((t) => {
        for (let l = 0; l < 3; l++) {
          p.set(t.x, t.y + (1.8 + l * 1.25) * t.s, t.z);
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.r + l);
          const sc = (1.2 - l * 0.24) * t.s;
          s.set(sc, (0.95 - l * 0.1) * t.s, sc);
          m.compose(p, q, s); crown.setMatrixAt(idx, m);
          col.setHex([0x2f7355, 0x3b8a63, 0x4f9f70][l]); crown.setColorAt(idx, col);
          idx++;
        }
      });
      crown.instanceColor.needsUpdate = true;
      island.add(crown);
    } else {
      const crownGeo = new THREE.IcosahedronGeometry(1.35, 0);
      const crown = new THREE.InstancedMesh(crownGeo, mats.leaf, list.length * 2);
      crown.castShadow = true; crown.receiveShadow = true;
      let idx = 0;
      list.forEach((t) => {
        for (let l = 0; l < 2; l++) {
          p.set(t.x + (l ? 0.35 : -0.2) * t.s, t.y + (2.5 + l * 1.0) * t.s, t.z + (l ? -0.2 : 0.25) * t.s);
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.r + l);
          const sc = (1.0 - l * 0.18) * t.s;
          s.set(sc, sc * (0.9 + R() * 0.2), sc);
          m.compose(p, q, s); crown.setMatrixAt(idx, m);
          col.setHex(l ? 0x7dc35c : 0x5c9f4a); col.offsetHSL(R() * 0.03, 0, (R() - 0.5) * 0.08);
          crown.setColorAt(idx, col);
          idx++;
        }
      });
      crown.instanceColor.needsUpdate = true;
      island.add(crown);
    }
  }
  buildTreeInstances(treePositions);
  buildTreeInstances(pinePositions, true);

  // grass tufts
  function buildGrass(count, color) {
    const g = new THREE.ConeGeometry(0.09, 0.55, 3);
    g.translate(0, 0.27, 0);
    const mesh = new THREE.InstancedMesh(g, new THREE.MeshToonMaterial({ color, gradientMap: gradient, flatShading: true }), count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    let i = 0, tries = 0;
    while (i < count && tries++ < count * 12) {
      const x = (R() - 0.5) * 185, z = (R() - 0.5) * 185;
      if (Math.hypot(x, z) > 92) continue;
      const h = baseHeight(x, z);
      if (h < 0.2 || h > 16) continue;
      if (dist2(x, z, VILLAGE.x, VILLAGE.z) < 10 || distToPaths(x, z) < 1.4) continue;
      if (dist2(x, z, LAKE.x, LAKE.z) < 22 || dist2(x, z, GATE.x, GATE.z) < 10) continue;
      p.set(x, h, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * TAU);
      const sc = 0.7 + R() * 1.3; s.set(sc, 0.7 + R() * 1.2, sc);
      m.compose(p, q, s); mesh.setMatrixAt(i++, m);
    }
    mesh.count = i;
    island.add(mesh);
  }
  buildGrass(1900, 0x74b354);
  buildGrass(900, 0x8fca66);

  // flowers
  const flowerGeo = new THREE.OctahedronGeometry(0.11, 0);
  const flowerColors = [0xffc1dd, 0xfff0b0, 0xd4c4ff, 0xffffff];
  for (let c = 0; c < 4; c++) {
    const count = 95;
    const mesh = new THREE.InstancedMesh(flowerGeo, new THREE.MeshToonMaterial({ color: flowerColors[c], gradientMap: gradient, emissive: flowerColors[c], emissiveIntensity: 0.12 }), count);
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    let i = 0, tries = 0;
    while (i < count && tries++ < count * 20) {
      const x = (R() - 0.5) * 170, z = (R() - 0.5) * 170;
      if (Math.hypot(x, z) > 88) continue;
      const h = baseHeight(x, z);
      if (h < 0.3 || h > 14 || dist2(x, z, LAKE.x, LAKE.z) < 22 || dist2(x, z, GATE.x, GATE.z) < 11) continue;
      if (distToPaths(x, z) < 1.6 || dist2(x, z, VILLAGE.x, VILLAGE.z) < 9) continue;
      p.set(x, h + 0.3, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * TAU);
      const sc = 0.7 + R() * 1.1; s.set(sc, sc, sc); m.compose(p, q, s); mesh.setMatrixAt(i++, m);
    }
    mesh.count = i; island.add(mesh);
  }

  // rocks
  const rockInst = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mats.rock, 70);
  {
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    let i = 0, tries = 0;
    while (i < 70 && tries++ < 900) {
      const x = (R() - 0.5) * 180, z = (R() - 0.5) * 180;
      if (Math.hypot(x, z) > 94) continue;
      const h = baseHeight(x, z);
      if (h < 0.4 || dist2(x, z, VILLAGE.x, VILLAGE.z) < 18 || dist2(x, z, TEMPLE.x, TEMPLE.z) < 13 || dist2(x, z, GATE.x, GATE.z) < 12) continue;
      if (distToPaths(x, z) < 3) continue;
      const sc = 0.5 + R() * 1.7;
      p.set(x, h + sc * 0.2, z); q.setFromEuler(new THREE.Euler(R(), R() * TAU, R() * 0.4));
      s.set(sc, sc * (0.6 + R() * 0.5), sc); m.compose(p, q, s); rockInst.setMatrixAt(i++, m);
      if (sc > 1.0) colliders.push({ x, z, r: sc * 0.8, type: 'rock' });
    }
    rockInst.count = i; rockInst.castShadow = true; rockInst.receiveShadow = true; island.add(rockInst);
  }

  /* ---------------- floating pollen ---------------- */
  const pollenGeo = new THREE.BufferGeometry();
  const pollenCount = 620;
  const pollenPos = new Float32Array(pollenCount * 3);
  for (let i = 0; i < pollenCount; i++) {
    const a = R() * TAU, r = R() * 100;
    pollenPos[i * 3] = Math.cos(a) * r;
    pollenPos[i * 3 + 1] = 2 + R() * 18;
    pollenPos[i * 3 + 2] = Math.sin(a) * r;
  }
  pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPos, 3));
  const pollen = new THREE.Points(pollenGeo, new THREE.PointsMaterial({ color: 0xfff4c8, size: 0.22, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }));
  island.add(pollen);

  /* ---------------- village ---------------- */
  const village = new THREE.Group();
  village.position.set(VILLAGE.x, 0, VILLAGE.z);
  island.add(village);
  const houseMats = mats;

  function house(x, z, rot, w, d, h, twoStory = false) {
    const g = new THREE.Group();
    const y = baseHeight(VILLAGE.x + x, VILLAGE.z + z);
    g.position.set(x, y, z); g.rotation.y = rot;
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseMats.plaster);
    base.position.y = h / 2; base.castShadow = true; base.receiveShadow = true; g.add(base);
    // timber frame
    const beamMat = houseMats.woodDark;
    for (const sx of [-w / 2 + 0.12, w / 2 - 0.12]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), beamMat);
      b.position.set(sx, h / 2, d / 2 + 0.01); g.add(b);
    }
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.18, 0.18), beamMat);
    topBeam.position.set(0, h - 0.25, d / 2 + 0.01); g.add(topBeam);
    const midBeam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.12, 0.12), beamMat);
    midBeam.position.set(0, h * 0.55, d / 2 + 0.01); g.add(midBeam);
    // roof (4-sided pyramid)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 2.5, 4), houseMats.roof);
    roof.position.y = h + 1.1; roof.rotation.y = Math.PI / 4; roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
    const trim = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.9, 0.3, 4), houseMats.roofLight);
    trim.position.y = h + 0.1; trim.rotation.y = Math.PI / 4; g.add(trim);
    // door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.9, 0.12), houseMats.woodDark);
    door.position.set(0, 0.95, d / 2 + 0.06); g.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), houseMats.gold);
    knob.position.set(0.32, 1.0, d / 2 + 0.14); g.add(knob);
    // windows
    for (const sx of [-w * 0.3, w * 0.3]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), new THREE.MeshBasicMaterial({ color: 0xffd58a }));
      win.position.set(sx, h * 0.58, d / 2 + 0.07); g.add(win);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), houseMats.woodDark);
      frame.position.set(sx, h * 0.58, d / 2 + 0.02); g.add(frame);
      win.renderOrder = 1;
    }
    if (twoStory) {
      const upper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 2.1, d * 0.72), houseMats.plaster);
      upper.position.y = h + 2.0; upper.castShadow = true; g.add(upper);
      const roof2 = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.6, 1.8, 4), houseMats.roofLight);
      roof2.position.y = h + 3.9; roof2.rotation.y = Math.PI / 4; roof2.castShadow = true; g.add(roof2);
    }
    // chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), houseMats.stoneDark);
    chimney.position.set(w * 0.28, h + 1.7, -d * 0.15); g.add(chimney);
    village.add(g);
    colliders.push({ x: VILLAGE.x + x, z: VILLAGE.z + z, r: Math.max(w, d) * 0.58, type: 'house' });
    return g;
  }

  house(-13.5, -2, 0.12, 6.2, 5.2, 3.2);
  house(13.0, 0, -0.2, 5.8, 5.0, 3.0);
  house(-11.5, 9.5, 1.55, 5.6, 4.8, 3.0);
  house(12.2, 10.0, -1.55, 6.0, 5.0, 3.2, true);
  house(0, 16.5, Math.PI, 7.0, 5.4, 3.4);
  house(-22, 15, 2.2, 5.2, 4.6, 2.8);

  // well
  {
    const g = new THREE.Group(); const y = baseHeight(VILLAGE.x, VILLAGE.z);
    g.position.set(0, y, 0);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.9, 12), houseMats.stone);
    ring.position.y = 0.45; ring.castShadow = true; g.add(ring);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.95, 16), new THREE.MeshBasicMaterial({ color: 0x1a5b6e }));
    inner.rotation.x = -Math.PI / 2; inner.position.y = 0.86; g.add(inner);
    for (const sx of [-0.85, 0.85]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.1, 0.16), houseMats.woodDark);
      post.position.set(sx, 1.5, 0); g.add(post);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 4), houseMats.roof);
    roof.position.y = 2.75; roof.rotation.y = Math.PI / 4; g.add(roof);
    village.add(g);
    colliders.push({ x: VILLAGE.x, z: VILLAGE.z, r: 1.35, type: 'well' });
  }

  // forge
  {
    const g = new THREE.Group();
    const y = baseHeight(VILLAGE.x + 8.5, VILLAGE.z + 12.5);
    g.position.set(8.5, y, 12.5); g.rotation.y = -0.7;
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 2.6), houseMats.stoneDark);
    base.position.y = 0.25; base.receiveShadow = true; g.add(base);
    const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.5), houseMats.woodDark);
    anvilBase.position.set(0, 0.72, 0); g.add(anvilBase);
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.5), new THREE.MeshToonMaterial({ color: 0x3c4650, gradientMap: gradient, metalness: 0.1 }));
    anvil.position.set(0, 1.1, 0); g.add(anvil);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), houseMats.flame);
    fire.position.set(-1.2, 0.75, -0.6); fire.scale.y = 1.5; g.add(fire);
    const fireGlow = new THREE.PointLight(0xff8a3c, 7, 8, 2); fireGlow.position.copy(fire.position); g.add(fireGlow);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.18), houseMats.woodDark);
    post.position.set(1.4, 1.4, -1.1); g.add(post);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.7), new THREE.MeshBasicMaterial({ color: 0xb8444b, side: THREE.DoubleSide }));
    banner.position.set(1.4, 2.0, -1.0); g.add(banner);
    village.add(g);
    colliders.push({ x: VILLAGE.x + 8.5, z: VILLAGE.z + 12.5, r: 2.0, type: 'forge' });
    village.userData.forgeFire = fire;
    village.userData.forgeLight = fireGlow;
  }

  // market stalls + fences + lanterns
  function stall(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, baseHeight(VILLAGE.x + x, VILLAGE.z + z), z); g.rotation.y = rot;
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.5), houseMats.red);
    top.position.y = 2.1; top.rotation.z = 0.04; g.add(top);
    for (const sx of [-1.0, 1.0]) for (const sz of [-0.55, 0.55]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 0.1), houseMats.woodDark);
      post.position.set(sx, 1.05, sz); g.add(post);
    }
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.1), houseMats.wood);
    table.position.y = 0.9; g.add(table);
    for (let i = 0; i < 5; i++) {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshToonMaterial({ color: [0xff9a76, 0xffd37a, 0x9dffcf][i % 3], gradientMap: gradient }));
      fruit.position.set(-0.7 + i * 0.35, 1.05, 0); g.add(fruit);
    }
    village.add(g);
  }
  stall(-6.5, 3.5, 0.25);
  stall(6.5, 4.2, -0.3);

  const fenceGeo = new THREE.BoxGeometry(0.12, 1.1, 0.12);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    const rr = 19.5;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (z > 8 && Math.abs(x) < 4) continue;
    const y = baseHeight(VILLAGE.x + x, VILLAGE.z + z);
    const post = new THREE.Mesh(fenceGeo, houseMats.woodDark);
    post.position.set(VILLAGE.x + x, y + 0.55, VILLAGE.z + z); island.add(post);
    if (i % 2 === 0) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.09, 0.09), houseMats.wood);
      rail.position.set(VILLAGE.x + x, y + 0.75, VILLAGE.z + z);
      rail.rotation.y = -a + Math.PI / 2; island.add(rail);
    }
  }

  // lanterns
  const lanternLights = [];
  const lanternSpots = [[-4.5, -4], [4.5, -4], [-4.5, 12], [4.5, 12], [-15, 5], [15, 6]];
  for (const [x, z] of lanternSpots) {
    const y = baseHeight(VILLAGE.x + x, VILLAGE.z + z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.5, 5), houseMats.woodDark);
    post.position.set(VILLAGE.x + x, y + 1.25, VILLAGE.z + z); island.add(post);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xffcf7a }));
    lamp.position.set(VILLAGE.x + x, y + 2.55, VILLAGE.z + z); island.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffbe5a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.copy(lamp.position); glow.scale.set(1.4, 1.4, 1); island.add(glow);
    lanternLights.push({ glow, phase: R() * TAU });
  }

  // village banners
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    const x = Math.cos(a) * 10, z = Math.sin(a) * 10;
    const y = baseHeight(VILLAGE.x + x, VILLAGE.z + z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 5), houseMats.woodDark);
    pole.position.set(VILLAGE.x + x, y + 2.1, VILLAGE.z + z); island.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2f7d8a : 0xb8444b, side: THREE.DoubleSide }));
    flag.position.set(VILLAGE.x + x + 0.6, y + 3.9, VILLAGE.z + z); island.add(flag);
  }

  /* ---------------- temple ---------------- */
  const temple = new THREE.Group();
  temple.position.set(TEMPLE.x, 0, TEMPLE.z);
  island.add(temple);
  const TY = 11.0;

  // plateau stone
  {
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 14.5, 0.8, 8), mats.stone);
    plat.position.y = TY - 0.4; plat.receiveShadow = true; plat.castShadow = true; temple.add(plat);
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(7.2 - i * 0.4, 0.35, 1.25), mats.stone);
      step.position.set(0, TY - 0.15 - i * 0.34, 13.5 + i * 1.15); step.receiveShadow = true; temple.add(step);
    }
    // moss patches
    for (let i = 0; i < 14; i++) {
      const a = R() * TAU, r = 4 + R() * 9;
      const moss = new THREE.Mesh(new THREE.CircleGeometry(0.6 + R() * 1.4, 7), new THREE.MeshBasicMaterial({ color: 0x4f8a4a, transparent: true, opacity: 0.6 }));
      moss.rotation.x = -Math.PI / 2; moss.position.set(Math.cos(a) * r, TY + 0.26, Math.sin(a) * r); temple.add(moss);
    }
  }

  // torii gate
  {
    const g = new THREE.Group(); g.position.set(0, TY + 0.25, 15.5);
    for (const sx of [-4.1, 4.1]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 7.2, 8), mats.red);
      pillar.position.set(sx, 3.6, 0); pillar.castShadow = true; g.add(pillar);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.5, 8), mats.stoneDark);
      base.position.set(sx, 0.25, 0); g.add(base);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(11, 0.55, 0.75), mats.red);
    top.position.y = 7.15; g.add(top);
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.35, 0.55), mats.red);
    top2.position.y = 6.55; g.add(top2);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.24, 0.9), mats.woodDark);
    cap.position.y = 7.5; g.add(cap);
    temple.add(g);
    colliders.push({ x: TEMPLE.x - 4.1, z: TEMPLE.z + 15.5, r: 0.7, type: 'temple' });
    colliders.push({ x: TEMPLE.x + 4.1, z: TEMPLE.z + 15.5, r: 0.7, type: 'temple' });
  }

  // columns
  for (const [x, z] of [[-7, 6], [7, 6], [-7, -4], [7, -4], [-9.5, 1], [9.5, 1]]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 6.6, 8), mats.stone);
    col.position.set(x, TY + 3.3, z); col.castShadow = true; col.receiveShadow = true; temple.add(col);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), mats.stoneDark);
    cap.position.set(x, TY + 6.65, z); temple.add(cap);
    colliders.push({ x: TEMPLE.x + x, z: TEMPLE.z + z, r: 0.75, type: 'temple' });
  }

  // shrine
  const shrineOrb = new THREE.Group();
  shrineOrb.position.set(0, TY + 3.3, -7);
  {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.2, 1.1, 8), mats.stoneDark);
    pedestal.position.y = TY + 0.55; pedestal.castShadow = true; temple.add(pedestal);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.16, 8, 24), mats.gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = TY + 1.15; temple.add(ring);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), mats.cyan);
    orb.position.copy(shrineOrb.position); temple.add(orb);
    shrineOrb.userData.orb = orb;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7df9ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.copy(shrineOrb.position); glow.scale.set(5, 5, 1); temple.add(glow);
    shrineOrb.userData.glow = glow;
    const light = new THREE.PointLight(0x7df9ff, 10, 16, 2); light.position.copy(shrineOrb.position); temple.add(light);
    shrineOrb.userData.light = light;
    temple.add(shrineOrb);
    colliders.push({ x: TEMPLE.x, z: TEMPLE.z - 7, r: 2.0, type: 'temple' });
  }
  // braziers
  const braziers = [];
  for (const sx of [-5.4, 5.4]) {
    const g = new THREE.Group(); g.position.set(sx, TY + 0.25, -4);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.5, 8), mats.stoneDark);
    bowl.position.y = 0.9; g.add(bowl);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.9, 6), mats.stoneDark);
    stem.position.y = 0.45; g.add(stem);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mats.flame);
    fire.position.y = 1.35; fire.scale.y = 1.6; g.add(fire);
    const light = new THREE.PointLight(0xff9a4c, 6, 9, 2); light.position.y = 1.5; g.add(light);
    temple.add(g);
    braziers.push({ fire, light, phase: R() * TAU });
  }

  // floating debris / motes around shrine
  const templeMotes = [];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 + R() * 0.1, 0), new THREE.MeshBasicMaterial({ color: 0x9ffbff, transparent: true, opacity: 0.8 }));
    m.position.set(TEMPLE.x + (R() - 0.5) * 12, TY + 2 + R() * 5, TEMPLE.z + (R() - 0.5) * 12);
    m.userData.phase = R() * TAU; m.userData.base = m.position.clone();
    island.add(m); templeMotes.push(m);
  }

  /* ---------------- dungeon gate on island ---------------- */
  const gate = new THREE.Group();
  gate.position.set(GATE.x, 0, GATE.z);
  island.add(gate);
  const GY = baseHeight(GATE.x, GATE.z);
  {
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 0.7, 8), mats.stoneDark);
    platform.position.y = GY + 0.1; platform.receiveShadow = true; gate.add(platform);
    for (const sx of [-3.5, 3.5]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 7.5, 1.5), mats.stoneDark);
      pillar.position.set(sx, 3.9, 0); pillar.rotation.z = sx < 0 ? 0.05 : -0.05; pillar.castShadow = true; gate.add(pillar);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 5), mats.stoneDark);
      spike.position.set(sx, 8.7, 0); gate.add(spike);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(9, 1.0, 1.8), mats.stoneDark);
    lintel.position.y = 7.0; gate.add(lintel);
    // portal
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 6.4), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float time; varying vec2 vUv;
        void main(){ vec2 c=vUv-0.5; float r=length(c)*2.0;
          float swirl=sin(atan(c.y,c.x)*5.0 + r*10.0 - time*2.5)*0.5+0.5;
          vec3 col=mix(vec3(0.08,0.01,0.14),vec3(0.55,0.18,0.95),swirl);
          col += vec3(0.5,0.2,1.0)*pow(1.0-r,3.0)*0.8;
          gl_FragColor=vec4(col, smoothstep(1.0,0.75,r)*0.92);
        }`,
    }));
    portal.position.set(0, 3.7, 0.1); gate.add(portal);
    gate.userData.portal = portal;
    const glow = new THREE.PointLight(0x9b5cff, 14, 20, 2); glow.position.set(0, 3.8, 1.5); gate.add(glow);
    gate.userData.glow = glow;
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.35 + R() * 0.5, 0), mats.purple);
      c.position.set((R() - 0.5) * 11, 0.6 + R() * 2.5, (R() - 0.5) * 9); gate.add(c);
    }
    colliders.push({ x: GATE.x - 3.5, z: GATE.z, r: 1.1, type: 'gate' });
    colliders.push({ x: GATE.x + 3.5, z: GATE.z, r: 1.1, type: 'gate' });
  }

  /* ---------------- NPCs ---------------- */
  const npcs = [];
  function addNPC(id, name, role, x, z, opts, marker) {
    const y = baseHeight(x, z);
    const model = createNPC({ ...opts, name });
    model.group.position.set(x, y, z);
    model.group.rotation.y = opts.rot ?? 0;
    island.add(model.group);
    let markerSprite = null;
    if (marker) {
      markerSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(marker, opts.markerColor || '#ffd37a'), transparent: true, depthWrite: false, depthTest: false }));
      markerSprite.position.set(x, y + 2.6, z); markerSprite.scale.set(0.65, 0.65, 1); markerSprite.renderOrder = 5;
      island.add(markerSprite);
    }
    const npc = { type: 'npc', id, name, role, pos: new THREE.Vector3(x, y, z), model, marker: markerSprite, baseY: y, phase: R() * TAU };
    npcs.push(npc);
    colliders.push({ x, z, r: 0.55, type: 'npc' });
    return npc;
  }

  addNPC('mira', 'Elder Mira', 'Keeper of Dawn', VILLAGE.x - 3.8, VILLAGE.z - 3.5, { robe: 0x2c6a78, hair: 0xd9e6ea, accent: 0xffd37a, staff: true, rot: 0.3 }, '!');
  addNPC('rook', 'Rook', 'Island Blacksmith', VILLAGE.x + 8.2, VILLAGE.z + 14.6, { robe: 0x6b3a2a, hair: 0x2b1a13, accent: 0xff9a4c, apron: true, rot: -2.5 }, '!');
  addNPC('kael', 'Kael', 'Scout of the Vale', -26, 3, { robe: 0x3a5c3e, hair: 0x7a4d2b, accent: 0x9dffcf, hood: true, bow: true, rot: 1.2 }, '!');

  /* ---------------- checkpoints ---------------- */
  const checkpoints = [];
  function addShrine(id, name, x, z, active = false) {
    const y = baseHeight(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.45, 8), mats.stoneDark);
    base.position.y = 0.22; base.receiveShadow = true; g.add(base);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 1.5, 6), mats.stone);
    pedestal.position.y = 1.1; g.add(pedestal);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), active ? mats.gold : mats.cyan);
    crystal.position.y = 2.15; g.add(crystal);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: active ? 0xffd37a : 0x7df9ff, transparent: true, opacity: active ? 0.8 : 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.y = 2.15; glow.scale.set(3, 3, 1); g.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 24), new THREE.MeshBasicMaterial({ color: active ? 0xffd37a : 0x7df9ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.47; g.add(ring);
    island.add(g);
    const cp = { type: 'shrine', id, name, pos: new THREE.Vector3(x, y, z), group: g, crystal, glow, ring, active, phase: R() * TAU };
    checkpoints.push(cp);
    colliders.push({ x, z, r: 0.7, type: 'shrine' });
    return cp;
  }
  addShrine('village', 'Dawn Shrine', 6.2, 31.5, true);
  addShrine('forest', 'Verdant Shrine', -31, -9);
  addShrine('temple', 'Temple Shrine', 10.5, -58);
  addShrine('gate', 'Sealed Shrine', -42, -40);

  /* ---------------- collectible crystals ---------------- */
  const crystalPositions = [
    [4.5, 27.5], [-17, 20], [-31, -2], [-41, -27], [-21, -42], [19, -29],
    [37, -6], [30, 23], [62, -2], [16, -52], [-57, -59], [66, -26],
  ];
  const crystals = [];
  const crystalGeo = new THREE.OctahedronGeometry(0.46, 0);
  const crystalMat = new THREE.MeshToonMaterial({ color: 0xa9ffff, gradientMap: gradient, emissive: 0x2bd3e6, emissiveIntensity: 1.1 });
  const crystalGlowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7df9ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  crystalPositions.forEach(([x, z], i) => {
    const y = baseHeight(x, z);
    const g = new THREE.Group(); g.position.set(x, y + 1.15, z);
    const mesh = new THREE.Mesh(crystalGeo, crystalMat);
    mesh.castShadow = true; g.add(mesh);
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    g.add(inner);
    const glow = new THREE.Sprite(crystalGlowMat.clone()); glow.scale.set(2.2, 2.2, 1); g.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.85, 16), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.95; g.add(ring);
    island.add(g);
    crystals.push({ id: `crystal${i}`, pos: new THREE.Vector3(x, y, z), group: g, mesh, glow, ring, collected: false, phase: R() * TAU });
  });

  /* ---------------- treasure chests ---------------- */
  const chests = [];
  function addChest(id, x, z, reward = 60, hidden = false) {
    const y = baseHeight(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.65, 0.8), mats.wood);
    base.position.y = 0.32; base.castShadow = true; g.add(base);
    const lid = new THREE.Group(); lid.position.set(0, 0.66, -0.4);
    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.85), mats.woodDark);
    lidMesh.position.set(0, 0.1, 0.4); lidMesh.castShadow = true; lid.add(lidMesh);
    g.add(lid);
    for (const sx of [-0.4, 0.4]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.86), mats.gold);
      band.position.set(sx, 0.34, 0); g.add(band);
    }
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.1), mats.gold);
    lock.position.set(0, 0.5, 0.44); g.add(lock);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd37a, transparent: true, opacity: hidden ? 0.3 : 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.set(0, 1.0, 0); glow.scale.set(2.4, 2.4, 1); g.add(glow);
    island.add(g);
    const chest = { type: 'chest', id, pos: new THREE.Vector3(x, y, z), group: g, lid, glow, opened: false, reward, phase: R() * TAU };
    chests.push(chest);
    colliders.push({ x, z, r: 0.8, type: 'chest' });
    return chest;
  }
  addChest('chest-village', -20, 48, 80);
  addChest('chest-forest', -42, 14, 100);
  addChest('chest-temple', 17, -72, 140);
  addChest('chest-waterfall', 61, -9, 120);
  addChest('chest-gate', -60, -58, 180);

  /* ---------------- dungeon ---------------- */
  const dungeon = new THREE.Group();
  dungeon.position.copy(DUNGEON_ORIGIN);
  dungeon.name = 'dungeon';
  scene.add(dungeon);
  const dungeonColliders = [];
  const dungeonLights = [];
  const torchFires = [];

  // floor with runes
  {
    const floorMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradient, map: runeTexture() });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 54), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -223); floor.receiveShadow = true; dungeon.add(floor);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(38, 58), new THREE.MeshToonMaterial({ color: 0x140d20, gradientMap: gradient }));
    ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 17, -223); dungeon.add(ceiling);
    // walls
    const wallMat = new THREE.MeshToonMaterial({ color: 0x241a33, gradientMap: gradient, flatShading: true });
    for (const sx of [-17, 17]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 17, 56), wallMat);
      wall.position.set(sx, 8.5, -223); wall.receiveShadow = true; dungeon.add(wall);
      dungeonColliders.push({ x: sx, z: -223, r: 1.4, type: 'wall' });
    }
    const back = new THREE.Mesh(new THREE.BoxGeometry(36, 17, 1.6), wallMat);
    back.position.set(0, 8.5, -250); dungeon.add(back);
    const front = new THREE.Mesh(new THREE.BoxGeometry(36, 17, 1.6), wallMat);
    front.position.set(0, 8.5, -196); dungeon.add(front);
    // floor edge strips
    for (const sx of [-16.4, 16.4]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 54), new THREE.MeshBasicMaterial({ color: 0x8b4de0 }));
      strip.position.set(sx, 0.1, -223); dungeon.add(strip);
    }
  }

  // entrance arch
  {
    const arch = new THREE.Group(); arch.position.set(0, 0, -199.5);
    for (const sx of [-3.2, 3.2]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 1.2), mats.stoneDark);
      p.position.set(sx, 4, 0); arch.add(p);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.4), mats.stoneDark);
    top.position.y = 8; arch.add(top);
    dungeon.add(arch);
    const exitPortal = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    exitPortal.position.set(0, 3.2, -198.7); dungeon.add(exitPortal);
    dungeon.userData.exitPortal = exitPortal;
  }

  // pillars + chains + crystals
  const pillarMat = new THREE.MeshToonMaterial({ color: 0x312342, gradientMap: gradient, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -204 - Math.floor(i / 2) * 12;
    const h = 7 + (i % 3) * 2.2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, h, 6), pillarMat);
    p.position.set(side * 11.5, h / 2, z); p.castShadow = true; dungeon.add(p);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), pillarMat);
    cap.position.set(side * 11.5, h + 0.25, z); dungeon.add(cap);
    dungeonColliders.push({ x: side * 11.5, z, r: 1.2, type: 'pillar' });
    if (i % 2 === 0) {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5, 4), new THREE.MeshToonMaterial({ color: 0x4d4358, gradientMap: gradient }));
      chain.position.set(side * 8, 12, z + 4); dungeon.add(chain);
    }
  }
  // boss throne
  {
    const g = new THREE.Group(); g.position.set(0, 0, -244);
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 5), pillarMat); base.position.y = 0.6; g.add(base);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 1.6), pillarMat); seat.position.set(0, 3.2, -1.5); g.add(seat);
    for (const sx of [-2.9, 2.9]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 3.8), pillarMat); arm.position.set(sx, 2, -0.4); g.add(arm);
    }
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.2, 4), mats.purple); crown.position.set(0, 7, -1.5); g.add(crown);
    dungeon.add(g);
    dungeonColliders.push({ x: 0, z: -244, r: 3.2, type: 'throne' });
  }
  // purple crystals clusters
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.4 + R() * 0.9, 0), mats.purple);
    c.position.set(side * (12 + R() * 3), 0.6 + R() * 2.2, -202 - R() * 44);
    c.scale.y = 1.5 + R() * 1.8; c.rotation.z = (R() - 0.5) * 0.4; dungeon.add(c);
  }
  // torches
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -203 - Math.floor(i / 2) * 14;
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), mats.woodDark);
    sconce.position.set(side * 15.7, 6, z); dungeon.add(sconce);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), mats.flame);
    fire.position.set(side * 15.4, 6.5, z); fire.scale.y = 1.5; dungeon.add(fire);
    const light = new THREE.PointLight(0xff8a3c, 16, 22, 2);
    light.position.set(side * 14.8, 6.5, z); dungeon.add(light);
    dungeonLights.push(light); torchFires.push({ fire, light, phase: R() * TAU });
  }
  const bossLight = new THREE.PointLight(0x9b5cff, 40, 36, 2); bossLight.position.set(0, 9, -236); dungeon.add(bossLight);
  const entryLight = new THREE.PointLight(0x7df9ff, 18, 20, 2); entryLight.position.set(0, 6, -199); dungeon.add(entryLight);
  // moon shaft
  {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 22, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x9b7cff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    shaft.position.set(0, 10, -232); dungeon.add(shaft);
  }
  // fog wall
  const fogWall = new THREE.Mesh(new THREE.PlaneGeometry(32, 16), new THREE.MeshBasicMaterial({ color: 0x7a2ad8, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  fogWall.position.set(0, 8, -209); fogWall.visible = false; dungeon.add(fogWall);
  // dungeon particles
  const dungeonParticlesGeo = new THREE.BufferGeometry();
  const dpCount = 220;
  const dp = new Float32Array(dpCount * 3);
  for (let i = 0; i < dpCount; i++) {
    dp[i * 3] = (R() - 0.5) * 30; dp[i * 3 + 1] = R() * 14; dp[i * 3 + 2] = -200 - R() * 46;
  }
  dungeonParticlesGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dungeonParticles = new THREE.Points(dungeonParticlesGeo, new THREE.PointsMaterial({ color: 0xb46bff, size: 0.18, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
  dungeon.add(dungeonParticles);

  // dungeon checkpoint
  const dungeonShrine = { type: 'shrine', id: 'dungeon', name: 'Echo Shrine', pos: new THREE.Vector3(5.5, 0, -202.5), active: false, inDungeon: true };
  {
    const g = new THREE.Group(); g.position.set(5.5, 0, -202.5);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 8), mats.stoneDark); base.position.y = 0.2; g.add(base);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), mats.cyan); crystal.position.y = 1.4; g.add(crystal);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7df9ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.y = 1.4; glow.scale.set(2.5, 2.5, 1); g.add(glow);
    dungeon.add(g);
    dungeonShrine.group = g; dungeonShrine.crystal = crystal; dungeonShrine.glow = glow; dungeonShrine.phase = 1;
  }
  checkpoints.push(dungeonShrine);
  dungeonColliders.push({ x: 5.5, z: -202.5, r: 0.6, type: 'shrine' });

  /* ---------------- interaction descriptors ---------------- */
  const interactables = [];
  npcs.forEach(n => interactables.push(n));
  chests.forEach(c => interactables.push(c));
  checkpoints.forEach(c => interactables.push(c));
  interactables.push({ type: 'temple', id: 'temple-orb', name: 'Dawn Shrine', pos: new THREE.Vector3(TEMPLE.x, TY + 1.4, TEMPLE.z - 7), inTemple: true });
  interactables.push({ type: 'dungeon-gate', id: 'dungeon-gate', name: 'Shadow Gate', pos: new THREE.Vector3(GATE.x, GY + 1, GATE.z + 2), inIsland: true });
  interactables.push({ type: 'dungeon-exit', id: 'dungeon-exit', name: 'Return to the Isle', pos: new THREE.Vector3(0, 0, -200.5), inDungeon: true });

  /* ---------------- animations ---------------- */
  let t = 0;
  const world = {
    heightAt,
    terrain,
    island,
    colliders,
    interactables,
    crystals,
    chests,
    checkpoints,
    npcs,
    gate,
    temple,
    shrineOrb,
    dungeon,
    dungeonColliders,
    dungeonOrigin: DUNGEON_ORIGIN.clone(),
    dungeonShrine,
    bossLight,
    fogWall,
    dungeonLights,
    waterfall,
    water,
    mats,
    gradient,
    zone: 'island',
    templeLit: false,
    dungeonEntered: false,
    bossActive: false,
    bossDefeated: false,
    update(dt) {
      t += dt;
      waterUniforms.time.value = t;
      fallUniforms.time.value = t;
      if (gate.userData.portal) gate.userData.portal.material.uniforms.time.value = t;
      // clouds
      for (const c of clouds) {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 220) c.position.x = -220;
      }
      // crystals
      for (const c of crystals) {
        if (c.collected) continue;
        c.group.position.y = c.pos.y + 1.15 + Math.sin(t * 1.7 + c.phase) * 0.18;
        c.mesh.rotation.y += dt * 1.4;
        c.ring.rotation.z += dt * 0.7;
        const s = 0.9 + Math.sin(t * 2.4 + c.phase) * 0.12;
        c.glow.scale.set(2.2 * s, 2.2 * s, 1);
      }
      // shrine orb
      if (shrineOrb.userData.orb) {
        shrineOrb.userData.orb.rotation.y += dt * 0.9;
        shrineOrb.userData.orb.position.y = TY + 3.3 + Math.sin(t * 1.5) * 0.16;
        shrineOrb.userData.glow.position.y = shrineOrb.userData.orb.position.y;
        shrineOrb.userData.glow.material.opacity = world.templeLit ? 0.95 : 0.5 + Math.sin(t * 2) * 0.1;
        shrineOrb.userData.light.intensity = (world.templeLit ? 18 : 8) + Math.sin(t * 2.2) * 2;
      }
      // braziers
      for (const b of braziers) {
        b.fire.scale.y = 1.3 + Math.sin(t * 9 + b.phase) * 0.25;
        b.light.intensity = 5 + Math.sin(t * 8 + b.phase) * 1.2;
      }
      // lanterns
      for (const l of lanternLights) l.glow.material.opacity = 0.4 + Math.sin(t * 2 + l.phase) * 0.1;
      // forge
      if (village.userData.forgeLight) village.userData.forgeLight.intensity = 6 + Math.sin(t * 9) * 1.5;
      // npc idle
      for (const n of npcs) {
        n.model.group.position.y = n.baseY + Math.sin(t * 1.6 + n.phase) * 0.025;
        if (n.marker) {
          n.marker.position.y = n.baseY + 2.65 + Math.sin(t * 2 + n.phase) * 0.12;
          n.marker.material.rotation = Math.sin(t * 1.2 + n.phase) * 0.06;
        }
        if (n.model.update) n.model.update(dt, t);
      }
      // checkpoints
      for (const c of checkpoints) {
        if (c.crystal) c.crystal.rotation.y += dt * 0.8;
        if (c.glow) c.glow.material.opacity = (c.active ? 0.85 : 0.45) + Math.sin(t * 2.2 + (c.phase || 0)) * 0.1;
      }
      // chest glows
      for (const c of chests) {
        if (c.opened) continue;
        c.glow.material.opacity = 0.16 + Math.sin(t * 1.8 + c.phase) * 0.06;
      }
      // gate portal
      if (gate.userData.glow) gate.userData.glow.intensity = 12 + Math.sin(t * 3) * 4;
      // pollen
      pollen.rotation.y += dt * 0.012;
      pollen.position.y = Math.sin(t * 0.4) * 0.4;
      // temple motes
      for (const m of templeMotes) {
        m.position.y = m.userData.base.y + Math.sin(t * 0.8 + m.userData.phase) * 0.35;
        m.rotation.y += dt * 1.2;
      }
      // dungeon
      for (const f of torchFires) {
        f.fire.scale.y = 1.3 + Math.sin(t * 10 + f.phase) * 0.28;
        f.light.intensity = 14 + Math.sin(t * 9 + f.phase) * 4;
      }
      bossLight.intensity = 30 + Math.sin(t * 1.6) * 8;
      fogWall.material.opacity = 0.18 + Math.sin(t * 1.4) * 0.05;
      if (world.bossActive) fogWall.visible = true;
      dungeonParticles.rotation.y += dt * 0.01;
      if (dungeon.userData.exitPortal) dungeon.userData.exitPortal.material.opacity = 0.18 + Math.sin(t * 2) * 0.06;
      // waterfall glow
      fallBase.material.opacity = 0.28 + Math.sin(t * 2.3) * 0.08;
    },
    setZone(zone, sceneObj) {
      world.zone = zone;
      if (zone === 'dungeon') {
        sceneObj.fog.color.setHex(0x170d24);
        sceneObj.fog.near = 8; sceneObj.fog.far = 60;
        sceneObj.background = new THREE.Color(0x0c0714);
        world.island.visible = false;
        world.dungeon.visible = true;
        sun.visible = false;
        sky.visible = false;
        clouds.forEach(c => c.visible = false);
      } else {
        sceneObj.fog.color.setHex(0xcfe8ef);
        sceneObj.fog.near = 80; sceneObj.fog.far = 300;
        sceneObj.background = new THREE.Color(0xbfefff);
        world.island.visible = true;
        world.dungeon.visible = true;
        sun.visible = true;
        sky.visible = true;
        clouds.forEach(c => c.visible = true);
      }
    },
    activateTemple() {
      world.templeLit = true;
      world.shrineOrb.userData.orb.material = mats.gold;
      world.shrineOrb.userData.glow.material.map = glowTexture('rgba(255,211,122,1)');
      world.shrineOrb.userData.glow.material.needsUpdate = true;
      world.shrineOrb.userData.light.color.setHex(0xffd37a);
    },
  };

  // set initial zone state
  world.setZone('island', scene);
  world.dungeon.visible = true;
  return world;
}
