import * as THREE from 'three';

/* ================= SHARED TOON LOOK ================= */
function makeGradient(levels) {
  const data = new Uint8Array(levels.length * 4);
  levels.forEach((v, i) => { data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255; });
  const tex = new THREE.DataTexture(data, levels.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter; tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}
export const TOON_GRADIENT = makeGradient([42, 96, 160, 210, 255]);
export const TOON_GRADIENT_SOFT = makeGradient([80, 140, 195, 235]);

const matCache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${opts.emissive || 0}|${opts.side || 0}|${opts.transparent ? 1 : 0}|${opts.opacity ?? 1}`;
  if (matCache.has(key) && !opts.unique) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color, gradientMap: opts.soft ? TOON_GRADIENT_SOFT : TOON_GRADIENT,
    emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    side: opts.side || THREE.FrontSide, transparent: !!opts.transparent, opacity: opts.opacity ?? 1
  });
  if (!opts.unique) matCache.set(key, m);
  return m;
}
export function basic(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide, depthWrite: opts.depthWrite !== false, blending: opts.blending || THREE.NormalBlending });
}
const metal = new THREE.MeshStandardMaterial({ color: 0xdfe8f5, metalness: 0.85, roughness: 0.28 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x59637a, metalness: 0.8, roughness: 0.38 });
export const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x080a12, side: THREE.BackSide });
export const OUTLINE_MAT_SOFT = new THREE.MeshBasicMaterial({ color: 0x1a1626, side: THREE.BackSide, transparent: true, opacity: 0.6 });

const G = {
  sphere: new THREE.SphereGeometry(1, 14, 11),
  sphereLo: new THREE.SphereGeometry(1, 9, 7),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cylTaper: new THREE.CylinderGeometry(1, 1.25, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  octa: new THREE.OctahedronGeometry(1, 0),
  torus: new THREE.TorusGeometry(1, 0.08, 6, 24),
  plane: new THREE.PlaneGeometry(1, 1),
  capsule: new THREE.CapsuleGeometry(1, 1, 5, 10)
};
export { G };

function part(parent, geo, mat, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], outline = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = true; m.receiveShadow = false;
  parent.add(m);
  if (outline) {
    const o = new THREE.Mesh(geo, outline === 2 ? OUTLINE_MAT_SOFT : OUTLINE_MAT);
    o.scale.set(s[0] * (1 + outline * 0.018), s[1] * (1 + outline * 0.018), s[2] * (1 + outline * 0.018));
    o.position.copy(m.position); o.rotation.copy(m.rotation);
    o.castShadow = false; m.add(o);
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0);
  }
  return m;
}
function group(parent, p = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...p); parent.add(g); return g; }

function makeLabel(text, color = '#f0e2bd', sub = '', scale = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.textAlign = 'center';
  ctx.font = '600 40px Rajdhani, sans-serif';
  ctx.fillStyle = 'rgba(3,7,15,.55)';
  ctx.fillRect(36, 20, 440, 58);
  ctx.strokeStyle = 'rgba(233,205,138,.5)'; ctx.lineWidth = 2; ctx.strokeRect(36, 20, 440, 58);
  ctx.fillStyle = color; ctx.fillText(text, 256, 62);
  if (sub) { ctx.font = '400 22px Rajdhani, sans-serif'; ctx.fillStyle = 'rgba(200,215,240,.8)'; ctx.fillText(sub, 256, 104); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  sp.scale.set(4.2 * scale, 1.05 * scale, 1); sp.renderOrder = 20;
  return sp;
}
export { makeLabel };

/* ================= HEROES ================= */
export const CHARACTERS = {
  kael: {
    id: 'kael', name: 'KAEL', role: 'THE EMBERBLADE', glyph: 'K', element: 'Fire', weapon: 'greatsword',
    hp: 150, stamina: 110, attack: 30, defense: 12, speed: 5.5, crit: 0.12, critMult: 1.8,
    colors: { hair: 0xe8eef8, hair2: 0x9aa8c0, skin: 0xffd9c2, cloth: 0x1d2b4e, cloth2: 0x111a30, accent: 0xe25a3a, trim: 0xd7b46a, eye: 0xff8a4a },
    title: 'THE EMBERBLADE'
  },
  yumi: {
    id: 'yumi', name: 'YUMI', role: 'THE STORM DANCER', glyph: 'Y', element: 'Lightning', weapon: 'dual',
    hp: 115, stamina: 130, attack: 24, defense: 8, speed: 6.5, crit: 0.22, critMult: 1.9,
    colors: { hair: 0x2b2547, hair2: 0x8f7bd8, skin: 0xffe0cc, cloth: 0x35274d, cloth2: 0x19132b, accent: 0xffd84e, trim: 0xb7a4ff, eye: 0xffdd55 },
    title: 'THE STORM DANCER'
  },
  aria: {
    id: 'aria', name: 'ARIA', role: 'THE FROSTWEAVER', glyph: 'A', element: 'Ice', weapon: 'staff',
    hp: 125, stamina: 120, attack: 27, defense: 9, speed: 5.2, crit: 0.16, critMult: 2.0,
    colors: { hair: 0xd8ecff, hair2: 0x7cb8de, skin: 0xffe2d2, cloth: 0x1f3a5c, cloth2: 0x14263c, accent: 0x6fd8ff, trim: 0xc9b6ff, eye: 0x7bdcff },
    title: 'THE FROSTWEAVER'
  }
};

function eyes(head, col, y = 0.02, z = 0.195, size = 0.036) {
  for (const sx of [-1, 1]) {
    const white = part(head, G.sphereLo, basic(0xf5f7ff), [sx * 0.085, y, z], [size * 1.5, size * 1.25, size * 0.4]);
    part(head, G.sphereLo, basic(col), [sx * 0.085 + sx * 0.004, y, z + 0.012], [size * 0.75, size * 1.0, size * 0.3]);
    part(head, G.sphereLo, basic(0x0a0c14), [sx * 0.085, y, z + 0.02], [size * 0.32, size * 0.72, size * 0.2]);
  }
}

function buildWeapon(kind, colors, parent) {
  const g = new THREE.Group(); parent.add(g);
  const accent = toon(colors.accent, { emissive: colors.accent, emissiveIntensity: 0.35 });
  if (kind === 'greatsword') {
    part(g, G.cyl, toon(0x2c211c), [0, -0.08, 0], [0.035, 0.34, 0.035]);
    part(g, G.box, toon(colors.trim), [0, 0.12, 0], [0.26, 0.05, 0.07]);
    const blade = part(g, G.box, metal, [0, 0.92, 0], [0.15, 1.55, 0.035]);
    part(g, G.box, accent, [0, 0.92, 0.021], [0.035, 1.35, 0.012]);
    part(g, G.cone4, metal, [0, 1.73, 0], [0.105, 0.3, 0.025], [0, 0, 0]);
    part(g, G.octa, accent, [0, 0.13, 0.05], [0.055, 0.055, 0.055]);
    g.userData.blade = blade;
  } else if (kind === 'dual') {
    part(g, G.cyl, toon(0x241b2e), [0, -0.04, 0], [0.028, 0.2, 0.028]);
    part(g, G.box, darkMetal, [0, 0.1, 0], [0.18, 0.035, 0.05]);
    const b = part(g, G.box, metal, [0.02, 0.38, 0], [0.055, 0.5, 0.02], [0, 0, -0.12]);
    part(g, G.box, accent, [0.043, 0.4, 0.012], [0.016, 0.42, 0.006], [0, 0, -0.12]);
    g.userData.blade = b;
  } else {
    part(g, G.cyl, toon(0x2a2e45), [0, 0.2, 0], [0.032, 1.7, 0.032]);
    part(g, G.torus, accent, [0, 1.02, 0], [0.12, 0.12, 0.12], [Math.PI / 2, 0, 0]);
    const cry = part(g, G.octa, toon(colors.accent, { emissive: colors.accent, emissiveIntensity: 1.4 }), [0, 1.15, 0], [0.14, 0.23, 0.14]);
    part(g, G.octa, basic(0xffffff, { transparent: true, opacity: 0.5 }), [0, 1.15, 0], [0.065, 0.12, 0.065]);
    g.userData.crystal = cry;
  }
  g.userData.kind = kind;
  return g;
}

export function createHero(id) {
  const def = CHARACTERS[id];
  const C = def.colors;
  const root = new THREE.Group();
  const body = group(root);
  const rig = { rock: root, body, def };

  // pelvis and legs
  const pelvis = group(body, [0, 0.95, 0]);
  part(pelvis, G.box, toon(C.cloth2), [0, 0, 0], [0.34, 0.22, 0.22], [0, 0, 0], 2);
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = group(body, [sx * 0.13, 0.95, 0]);
    part(hip, G.capsule, toon(C.cloth), [0, -0.27, 0], [0.085, 0.32, 0.085], [0, 0, 0], 2);
    const knee = group(hip, [0, -0.52, 0]);
    part(knee, G.capsule, toon(C.cloth), [0, -0.23, 0], [0.075, 0.26, 0.075]);
    const boot = part(knee, G.box, toon(C.cloth2), [0, -0.44, 0.045], [0.15, 0.15, 0.33]);
    part(boot, G.box, toon(C.trim), [0, 0.05, 0.11], [1.02, 0.18, 0.28]);
    legs.push({ hip, knee, sx });
  }
  rig.legL = legs[0].hip; rig.legR = legs[1].hip; rig.kneeL = legs[0].knee; rig.kneeR = legs[1].knee;

  // torso
  const torso = group(body, [0, 1.06, 0]);
  part(torso, G.cylTaper, toon(C.cloth), [0, 0.28, 0], [0.28, 0.6, 0.19], [0, 0, 0], 2);
  part(torso, G.box, toon(C.cloth2), [0, 0.2, 0.135], [0.3, 0.34, 0.09], [0.06, 0, 0]);
  part(torso, G.box, toon(C.trim), [0, 0.02, 0.1], [0.36, 0.07, 0.12]);
  const gem = part(torso, G.octa, toon(C.accent, { emissive: C.accent, emissiveIntensity: 0.7 }), [0, 0.36, 0.19], [0.05, 0.075, 0.035]);
  rig.chestGem = gem;
  if (id === 'kael') {
    part(torso, G.box, toon(C.accent), [0, 0.34, -0.19], [0.34, 0.5, 0.06], [0, 0, 0]);
  }
  if (id === 'yumi') {
    part(torso, G.box, toon(C.trim), [0, 0.02, 0], [0.42, 0.11, 0.26]);
    part(torso, G.box, toon(C.accent), [-0.23, 0.12, -0.02], [0.12, 0.4, 0.09], [0, 0, 0.16]);
  }
  if (id === 'aria') {
    // robe skirt
    part(body, G.cone, toon(C.cloth), [0, 0.78, 0], [0.48, 0.72, 0.42], [0, 0, 0], 1);
    part(body, G.cone, toon(C.cloth2), [0, 0.72, 0], [0.52, 0.5, 0.46], [0, 0, 0]);
    part(body, G.torus, toon(C.trim), [0, 0.92, 0], [0.3, 0.3, 0.3], [Math.PI / 2, 0, 0]);
  }

  // head
  const neck = part(torso, G.cyl, toon(C.skin), [0, 0.65, 0], [0.07, 0.12, 0.07]);
  const head = group(torso, [0, 0.82, 0]);
  part(head, G.sphere, toon(C.skin), [0, 0, 0], [0.205, 0.225, 0.2], [0, 0, 0], 2);
  // jaw shape
  part(head, G.sphere, toon(C.skin), [0, -0.08, 0.03], [0.15, 0.15, 0.15]);
  eyes(head, C.eye);
  // brows
  for (const sx of [-1, 1]) part(head, G.box, toon(C.hair), [sx * 0.085, 0.085, 0.19], [0.075, 0.012, 0.01], [0, 0, sx * 0.12]);
  // mouth
  part(head, G.box, toon(0x8c4e55), [0, -0.105, 0.192], [0.05, 0.008, 0.01]);
  const hair = group(head, [0, 0.05, -0.02]);
  part(hair, G.sphere, toon(C.hair), [0, 0.03, -0.055], [0.225, 0.24, 0.21]);
  const hairPieces = [];
  if (id === 'kael') {
    for (let i = 0; i < 7; i++) {
      const a = -0.9 + i * 0.3;
      const h = part(hair, G.cone, toon(i % 2 ? C.hair : C.hair2), [Math.sin(a) * 0.16, 0.22, -0.03 + Math.cos(a) * 0.08], [0.07, 0.3 + Math.random() * 0.16, 0.07], [Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.55]);
      hairPieces.push(h);
    }
    part(hair, G.cone, toon(C.hair), [-0.16, 0.03, 0.16], [0.06, 0.22, 0.06], [0.1, 0, 0.5]);
    part(hair, G.cone, toon(C.hair), [0.17, 0.02, 0.14], [0.05, 0.2, 0.05], [0.1, 0, -0.55]);
    // scarf
    const scarf = group(torso, [0, 0.66, 0]);
    const sp = [];
    for (let i = 0; i < 3; i++) sp.push(part(scarf, G.box, toon(C.accent), [0.02 + i * 0.02, -0.12 - i * 0.13, -0.12 - i * 0.05], [0.16, 0.18, 0.05], [0.2 + i * 0.1, 0, 0.06]));
    rig.scarf = sp;
    part(scarf, G.torus, toon(C.accent), [0, 0.03, 0], [0.17, 0.17, 0.2], [Math.PI / 2, 0, 0]);
  } else if (id === 'yumi') {
    part(hair, G.cone, toon(C.hair), [0, 0.12, -0.16], [0.12, 0.34, 0.12], [-0.5, 0, 0]);
    const pony = group(hair, [0, 0.08, -0.2]);
    for (let i = 0; i < 3; i++) hairPieces.push(part(pony, G.sphere, toon(C.hair2), [0, -0.12 - i * 0.16, -0.03 - i * 0.06], [0.09 - i * 0.012, 0.18, 0.08 - i * 0.01], [0.1, 0, 0]));
    part(hair, G.box, toon(C.accent), [0, 0.13, -0.14], [0.16, 0.04, 0.04], [0, 0, 0.2]);
    part(hair, G.cone, toon(C.hair), [-0.17, -0.06, 0.09], [0.05, 0.27, 0.05], [0.1, 0, 0.18]);
    part(hair, G.cone, toon(C.hair), [0.17, -0.06, 0.09], [0.05, 0.27, 0.05], [0.1, 0, -0.18]);
    rig.pony = pony;
    // ribbon
    part(torso, G.box, toon(C.accent), [0, 0.05, -0.2], [0.22, 0.16, 0.04], [0, 0, 0.4]);
  } else {
    // long hair
    for (const sx of [-1, 1]) {
      const t = group(hair, [sx * 0.16, 0.02, -0.06]);
      for (let i = 0; i < 3; i++) hairPieces.push(part(t, G.sphere, toon(i === 2 ? C.hair2 : C.hair), [0, -0.16 - i * 0.2, -0.02 - i * 0.02], [0.075, 0.22, 0.07], [0.05, 0, 0]));
    }
    part(hair, G.sphere, toon(C.hair), [0, -0.18, -0.1], [0.16, 0.3, 0.1]);
    // circlet
    part(head, G.torus, toon(C.accent, { emissive: C.accent, emissiveIntensity: 0.7 }), [0, 0.07, 0], [0.2, 0.2, 0.2], [Math.PI / 2, 0, 0]);
    part(head, G.octa, toon(C.accent, { emissive: C.accent, emissiveIntensity: 1 }), [0, 0.11, 0.19], [0.035, 0.055, 0.02]);
  }
  rig.hair = hair; rig.hairPieces = hairPieces;

  // arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = group(torso, [sx * 0.34, 0.55, 0]);
    part(sh, G.sphere, toon(C.cloth), [0, 0, 0], [0.11, 0.11, 0.11], [0, 0, 0], 2);
    part(sh, G.capsule, toon(C.cloth), [0, -0.2, 0], [0.07, 0.22, 0.07], [0, 0, 0], 2);
    const el = group(sh, [0, -0.4, 0]);
    part(el, G.capsule, toon(id === 'aria' ? C.cloth : C.skin), [0, -0.18, 0], [0.06, 0.2, 0.06]);
    if (id === 'aria') part(el, G.cone, toon(C.cloth2), [0, -0.13, 0], [0.16, 0.36, 0.16], [0, 0, 0]);
    const hand = group(el, [0, -0.4, 0]);
    part(hand, G.sphere, toon(C.skin), [0, 0, 0], [0.06, 0.075, 0.06]);
    arms.push({ sh, el, hand, sx });
  }
  rig.armL = arms[0].sh; rig.armR = arms[1].sh; rig.elbowL = arms[0].el; rig.elbowR = arms[1].el; rig.handL = arms[0].hand; rig.handR = arms[1].hand;

  // weapon
  const weaponParent = id === 'aria' ? rig.handR : rig.handR;
  const weapon = buildWeapon(def.weapon, C, weaponParent);
  weapon.position.set(0, 0, 0);
  rig.weapon = weapon;
  if (id === 'yumi') {
    const w2 = buildWeapon('dual', { ...C, accent: C.trim }, rig.handL);
    w2.scale.setScalar(0.92);
    rig.weapon2 = w2;
  }
  if (id === 'aria') {
    weapon.rotation.z = 0.2;
    const orb = new THREE.Group(); body.add(orb);
    for (let i = 0; i < 3; i++) {
      const o = part(orb, G.octa, toon(C.accent, { emissive: C.accent, emissiveIntensity: 1.5 }), [0, 0, 0], [0.045, 0.08, 0.045]);
      o.userData.phase = i / 3 * Math.PI * 2;
      if (i === 0) rig.orbA = o; else if (i === 1) rig.orbB = o; else rig.orbC = o;
    }
  }
  // feet aura ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 32), new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; root.add(ring); rig.auraRing = ring;

  root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return rig;
}

/* ================= NPCS ================= */
const NPC_PALETTES = [
  { cloth: 0x3c5a6e, cloth2: 0x223344, accent: 0xe6c477, hair: 0xd9d2c0, skin: 0xf0c8a8 },
  { cloth: 0x6b3b55, cloth2: 0x3d2233, accent: 0x83e0cf, hair: 0x3a2a2a, skin: 0xe8bfa0 },
  { cloth: 0x4a5b35, cloth2: 0x2c3620, accent: 0xe8a55a, hair: 0x7a4a2a, skin: 0xf2cba8 }
];
export function createNpc(index = 0, scale = 1) {
  const P = NPC_PALETTES[index % NPC_PALETTES.length];
  const root = new THREE.Group();
  const body = group(root);
  const parts = { root, body };
  const robe = part(body, G.cone, toon(P.cloth), [0, 0.82, 0], [0.42, 1.5, 0.38], [0, 0, 0], 1);
  part(body, G.cone, toon(P.cloth2), [0, 0.6, 0], [0.46, 0.9, 0.42]);
  const torso = group(body, [0, 1.28, 0]);
  part(torso, G.cylTaper, toon(P.cloth), [0, 0.2, 0], [0.22, 0.44, 0.17], [0, 0, 0], 2);
  part(torso, G.box, toon(P.accent), [0, 0.08, 0.14], [0.26, 0.5, 0.04]);
  const head = group(torso, [0, 0.62, 0]);
  part(head, G.sphere, toon(P.skin), [0, 0, 0], [0.19, 0.21, 0.185], [0, 0, 0], 2);
  eyes(head, 0x2a2a35, 0.0, 0.18, 0.03);
  part(head, G.sphere, toon(P.hair), [0, 0.05, -0.05], [0.21, 0.2, 0.19]);
  part(head, G.cone, toon(P.hair), [0, 0.22, -0.08], [0.11, 0.3, 0.11], [-0.35, 0, 0]);
  parts.head = head;
  for (const sx of [-1, 1]) {
    const sh = group(torso, [sx * 0.28, 0.38, 0]);
    part(sh, G.capsule, toon(P.cloth), [0, -0.2, 0], [0.06, 0.24, 0.06], [0, 0, 0], 1);
    const hand = part(sh, G.sphere, toon(P.skin), [0, -0.42, 0], [0.055, 0.06, 0.055]);
    if (sx < 0) parts.armL = sh; else parts.armR = sh;
  }
  root.scale.setScalar(scale);
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return parts;
}

/* ================= ENEMIES ================= */
const ENEMY_PALETTES = {
  soldier: { armor: 0x3a4660, cloth: 0x232c40, trim: 0x7a849c, accent: 0xa93b4a, skin: 0x2a2d3a, eye: 0xff5544 },
  raider: { armor: 0x4b2c38, cloth: 0x2a1a22, trim: 0x8d5a6a, accent: 0xff6b4a, skin: 0x2b2230, eye: 0xff8844 },
  archer: { armor: 0x2f4439, cloth: 0x1d2a25, trim: 0x6f8d72, accent: 0x9ee8a0, skin: 0x26302b, eye: 0x8effa0 },
  brute: { armor: 0x5a4636, cloth: 0x362a20, trim: 0x9a8060, accent: 0xff9d3d, skin: 0x3a2f28, eye: 0xffaa33 },
  elite: { armor: 0x3a2a55, cloth: 0x211735, trim: 0x8f76c9, accent: 0xc477ff, skin: 0x2c2340, eye: 0xd68bff }
};

export function createEnemyMesh(type = 'soldier', scale = 1) {
  const P = ENEMY_PALETTES[type] || ENEMY_PALETTES.soldier;
  const root = new THREE.Group();
  const body = group(root);
  const rig = { root, body, type };
  if (type === 'wisp') {
    const core = part(body, G.octa, toon(P.accent, { emissive: P.accent, emissiveIntensity: 1.6 }), [0, 1.25, 0], [0.3, 0.42, 0.3]);
    part(body, G.sphereLo, basic(P.accent, { transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending }), [0, 1.25, 0], [0.48, 0.55, 0.48]);
    const wings = [];
    for (const sx of [-1, 1]) {
      const w = group(body, [sx * 0.2, 1.35, 0]);
      for (let i = 0; i < 3; i++) part(w, G.cone, toon(P.cloth), [sx * (0.25 + i * 0.12), 0.06 - i * 0.06, -0.05], [0.06, 0.42 - i * 0.08, 0.03], [0, 0, sx * (1.1 + i * 0.2)]);
      wings.push(w);
    }
    part(body, G.sphereLo, basic(P.eye), [0, 1.31, 0.26], [0.055, 0.04, 0.03]);
    rig.core = core; rig.wings = wings;
    root.scale.setScalar(scale);
    return rig;
  }
  const isBrute = type === 'brute' || type === 'elite';
  const broad = isBrute ? 1.35 : 1;
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = group(body, [sx * 0.14 * broad, 0.92, 0]);
    part(hip, G.capsule, toon(P.cloth), [0, -0.26, 0], [0.09 * broad, 0.3, 0.09], [0, 0, 0], 2);
    const knee = group(hip, [0, -0.5, 0]);
    part(knee, G.box, toon(P.armor), [0, -0.3, 0.02], [0.16 * broad, 0.34, 0.2]);
    part(knee, G.box, toon(P.trim), [0, -0.16, 0.08], [0.18 * broad, 0.06, 0.08]);
    legs.push({ hip, knee });
  }
  rig.legL = legs[0].hip; rig.legR = legs[1].hip; rig.kneeL = legs[0].knee; rig.kneeR = legs[1].knee;
  const torso = group(body, [0, 1.05, 0]);
  part(torso, G.cylTaper, toon(P.cloth), [0, 0.28, 0], [0.29 * broad, 0.56, 0.2 * broad], [0, 0, 0], 2);
  part(torso, G.box, toon(P.armor), [0, 0.32, 0.1], [0.4 * broad, 0.46, 0.14], [0.05, 0, 0]);
  part(torso, G.box, toon(P.accent), [0, 0.05, 0.18], [0.12, 0.16, 0.04]);
  if (isBrute) {
    part(torso, G.box, toon(P.trim), [0, 0.5, -0.14], [0.5, 0.2, 0.3]);
    for (const sx of [-1, 1]) part(torso, G.cone, toon(P.trim), [sx * 0.42, 0.52, 0], [0.09, 0.34, 0.09], [0, 0, sx * -0.4]);
  }
  const headY = type === 'elite' ? 0.78 : 0.72;
  const head = group(torso, [0, headY, 0]);
  part(head, G.sphere, toon(P.skin), [0, 0, 0], [0.18, 0.2, 0.18], [0, 0, 0], 2);
  // helmet
  part(head, G.sphere, toon(P.armor), [0, 0.05, -0.03], [0.195, 0.18, 0.19]);
  part(head, G.box, toon(P.trim), [0, 0.02, 0.15], [0.27, 0.07, 0.1]);
  part(head, G.sphereLo, basic(P.eye), [0, -0.01, 0.17], [0.08, 0.025, 0.03]);
  if (type === 'elite') {
    for (const sx of [-1, 1]) part(head, G.cone, toon(P.accent, { emissive: P.accent, emissiveIntensity: 0.6 }), [sx * 0.16, 0.2, 0], [0.06, 0.3, 0.06], [0, 0, sx * -0.5]);
  }
  if (type === 'archer') {
    part(head, G.cone, toon(P.cloth), [0, 0.16, -0.1], [0.2, 0.34, 0.22], [-0.3, 0, 0]);
  }
  rig.head = head;
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = group(torso, [sx * 0.36 * broad, 0.5, 0]);
    part(sh, G.sphere, toon(P.armor), [0, 0, 0], [0.12 * broad, 0.12, 0.12], [0, 0, 0], 2);
    part(sh, G.capsule, toon(P.cloth), [0, -0.2, 0], [0.075 * broad, 0.22, 0.075], [0, 0, 0], 1);
    const el = group(sh, [0, -0.4, 0]);
    part(el, G.capsule, toon(P.skin), [0, -0.18, 0], [0.06, 0.2, 0.06]);
    const hand = group(el, [0, -0.38, 0]);
    part(hand, G.sphere, toon(P.skin), [0, 0, 0], [0.06, 0.07, 0.06]);
    arms.push({ sh, el, hand, sx });
  }
  rig.armL = arms[0].sh; rig.armR = arms[1].sh; rig.handL = arms[0].hand; rig.handR = arms[1].hand;
  // weapons
  if (type === 'soldier' || type === 'brute' || type === 'elite') {
    const w = new THREE.Group(); rig.handR.add(w);
    part(w, G.cyl, toon(0x2a2018), [0, 0.05, 0], [0.03, 0.3, 0.03]);
    part(w, G.box, darkMetal, [0, 0.2, 0], [0.2, 0.04, 0.05]);
    part(w, G.box, metal, [0, (type === 'brute' ? 0.72 : 0.62), 0], [type === 'brute' ? 0.2 : 0.11, type === 'brute' ? 1.2 : 0.9, 0.03]);
    if (type === 'elite') part(w, G.box, toon(P.accent, { emissive: P.accent, emissiveIntensity: 0.8 }), [0, 0.62, 0.02], [0.03, 0.7, 0.01]);
    rig.weapon = w;
    if (type === 'soldier' || type === 'elite') {
      const shield = new THREE.Group(); rig.handL.add(shield);
      part(shield, G.box, toon(P.armor), [0, 0.2, 0.08], [0.5, 0.7, 0.07]);
      part(shield, G.octa, toon(P.accent), [0, 0.2, 0.13], [0.08, 0.11, 0.03]);
      rig.shield = shield;
    }
  } else if (type === 'archer') {
    const bow = new THREE.Group(); rig.handL.add(bow);
    part(bow, G.torus, toon(0x6b4a2e), [0, 0, 0], [0.34, 0.34, 0.34], [Math.PI / 2, 0, 0]);
    part(bow, G.box, basic(0xd8e8ff), [0, 0, 0.3], [0.008, 0.62, 0.008]);
    rig.weapon = bow;
  } else if (type === 'raider') {
    for (const [i, hand] of [[0, rig.handL], [1, rig.handR]]) {
      const w = new THREE.Group(); hand.add(w);
      part(w, G.cyl, toon(0x241a20), [0, 0.03, 0], [0.025, 0.18, 0.025]);
      part(w, G.box, metal, [0, 0.34, 0], [0.055, 0.55, 0.02], [0, 0, i ? 0.16 : -0.16]);
      part(w, G.box, toon(P.accent), [0, 0.34, 0.01], [0.016, 0.4, 0.01], [0, 0, i ? 0.16 : -0.16]);
      if (i === 0) rig.weapon = w; else rig.weapon2 = w;
    }
  }
  if (type === 'elite') {
    const aura = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.9, 28), new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    aura.rotation.x = -Math.PI / 2; aura.position.y = 0.04; root.add(aura); rig.aura = aura;
  }
  root.scale.setScalar(scale);
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return rig;
}

/* ================= BOSSES ================= */
export const BOSS_DEFS = {
  warden: {
    id: 'warden', name: 'VERDANT WARDEN', title: 'GUARDIAN OF THE FIRST SEED', hp: 950, level: 5, radius: 3.2,
    region: 'Aetheria', pos: [138, 0, -78], element: 'Wind', arena: 22
  },
  shogun: {
    id: 'shogun', name: 'SHOGUN OF FALLING PETALS', title: 'THE LAST BLADE', hp: 1250, level: 8, radius: 2.2,
    region: 'Sakura', pos: [-302, 0, -128], element: 'Lightning', arena: 20
  },
  wyrm: {
    id: 'wyrm', name: 'DUNE SOVEREIGN', title: 'DEVOURER OF CARAVANS', hp: 1550, level: 11, radius: 2.6,
    region: 'Ember', pos: [322, 0, -142], element: 'Fire', arena: 24
  },
  colossus: {
    id: 'colossus', name: 'GLACIER COLOSSUS', title: 'THE FROZEN TITAN', hp: 1900, level: 14, radius: 3.4,
    region: 'Frostfall', pos: [-142, 0, 322], element: 'Ice', arena: 23
  },
  seraph: {
    id: 'seraph', name: 'ABYSS SERAPH', title: 'HERALD OF THE VOID', hp: 2600, level: 18, radius: 3.0,
    region: 'Abyss', pos: [24, 0, 408], element: 'Shadow', arena: 26
  }
};

export function createBossMesh(id) {
  const def = BOSS_DEFS[id];
  const root = new THREE.Group();
  const body = group(root);
  const rig = { root, body, def };
  if (id === 'warden') {
    // tree guardian
    part(body, G.cylTaper, toon(0x4a3b2a), [0, 2.3, 0], [1.3, 3.0, 1.1], [0, 0, 0], 2);
    for (let i = 0; i < 5; i++) part(body, G.cyl, toon(0x3a2d20), [Math.sin(i * 1.8) * 1.1, 1.2 + i * 0.4, Math.cos(i * 1.8) * 1.0], [0.14, 1.1, 0.14], [0.3 * Math.sin(i), 0, 0.3 * Math.cos(i)]);
    const head = group(body, [0, 4.1, 0.1]);
    part(head, G.sphereLo, toon(0x54432e), [0, 0, 0], [0.72, 0.6, 0.62], [0, 0, 0], 2);
    part(head, G.box, toon(0x2a2118), [0, -0.08, 0.56], [0.55, 0.16, 0.12]);
    part(head, G.sphereLo, basic(0x9dff9a), [-0.24, 0.12, 0.55], [0.08, 0.05, 0.04]);
    part(head, G.sphereLo, basic(0x9dff9a), [0.24, 0.12, 0.55], [0.08, 0.05, 0.04]);
    for (const sx of [-1, 1]) {
      const branch = group(head, [sx * 0.5, 0.35, 0]);
      part(branch, G.cyl, toon(0x4a3b2a), [0, 0.4, 0], [0.1, 0.9, 0.1], [0, 0, sx * -0.5]);
      part(branch, G.cyl, toon(0x4a3b2a), [sx * 0.3, 0.8, 0], [0.06, 0.6, 0.06], [0, 0, sx * -0.2]);
      for (let i = 0; i < 3; i++) part(branch, G.sphereLo, toon(0x2f6b3f), [sx * (0.2 + i * 0.1), 0.9 + i * 0.2, 0], [0.28, 0.22, 0.25]);
    }
    const canopy = group(body, [0, 4.6, 0]);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      part(canopy, G.sphereLo, toon(i % 2 ? 0x2f6b3f : 0x3f8450), [Math.cos(a) * 1.3, Math.sin(i * 2.4) * 0.35, Math.sin(a) * 1.2], [1.1, 0.7, 1.0]);
    }
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = group(body, [sx * 1.5, 3.2, 0]);
      part(sh, G.cyl, toon(0x4a3b2a), [0, -0.6, 0], [0.26, 1.3, 0.26], [0, 0, sx * 0.18]);
      const el = group(sh, [0, -1.4, 0]);
      part(el, G.cyl, toon(0x54432e), [0, -0.5, 0], [0.32, 1.1, 0.32]);
      for (let i = 0; i < 3; i++) part(el, G.cone, toon(0x9d8b62), [sx * (-0.2 + i * 0.2), -1.15, i * 0.12], [0.07, 0.34, 0.07], [0.3, 0, 0]);
      arms.push({ sh, el });
    }
    rig.armL = arms[0].sh; rig.armR = arms[1].sh; rig.elbowL = arms[0].el; rig.elbowR = arms[1].el;
    rig.head = head; rig.canopy = canopy;
    const core = part(body, G.octa, toon(0x8dff8a, { emissive: 0x5dff66, emissiveIntensity: 1.5 }), [0, 2.9, 0.95], [0.3, 0.42, 0.16]);
    rig.core = core;
  } else if (id === 'shogun') {
    part(body, G.cylTaper, toon(0x2a2233), [0, 1.6, 0], [0.6, 1.9, 0.42], [0, 0, 0], 2);
    part(body, G.box, toon(0xb03a5a), [0, 1.55, 0.22], [0.65, 1.0, 0.12]);
    for (let i = 0; i < 4; i++) part(body, G.box, toon(0xd9a0b5), [0, 1.25 + i * 0.28, 0.31], [0.8 - i * 0.1, 0.05, 0.04]);
    // shoulder plates
    for (const sx of [-1, 1]) part(body, G.box, toon(0x3c2c47), [sx * 0.78, 2.25, 0], [0.72, 0.24, 0.7], [0, 0, sx * -0.22], 2);
    const head = group(body, [0, 2.62, 0.02]);
    part(head, G.sphereLo, toon(0x2c1f34), [0, 0, 0], [0.3, 0.33, 0.3], [0, 0, 0], 2);
    // mask
    part(head, G.box, toon(0xe6d8c8), [0, -0.04, 0.28], [0.34, 0.32, 0.07]);
    part(head, G.sphereLo, basic(0xff5577), [-0.09, 0.02, 0.33], [0.04, 0.025, 0.02]);
    part(head, G.sphereLo, basic(0xff5577), [0.09, 0.02, 0.33], [0.04, 0.025, 0.02]);
    for (const sx of [-1, 1]) part(head, G.cone, toon(0xd7b46a), [sx * 0.24, 0.4, 0], [0.06, 0.5, 0.06], [0, 0, sx * -0.5]);
    // hat
    part(head, G.cone4, toon(0x1c1524), [0, 0.42, 0], [0.75, 0.22, 0.75]);
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = group(body, [sx * 0.7, 2.2, 0]);
      part(sh, G.capsule, toon(0x2a2233), [0, -0.4, 0], [0.14, 0.5, 0.14], [0, 0, 0], 1);
      const el = group(sh, [0, -0.85, 0]);
      part(el, G.capsule, toon(0x3c2c47), [0, -0.4, 0], [0.12, 0.44, 0.12]);
      arms.push({ sh, el });
    }
    rig.armL = arms[0].sh; rig.armR = arms[1].sh; rig.head = head;
    const w = new THREE.Group(); arms[0].el.add(w); w.position.set(0, -0.8, 0);
    part(w, G.cyl, toon(0x241627), [0, 0.25, 0], [0.06, 1.1, 0.06]);
    part(w, G.box, toon(0xd7b46a), [0, 0.85, 0], [0.55, 0.06, 0.12]);
    part(w, G.box, metal, [0, 2.0, 0], [0.16, 2.2, 0.04], [0, 0, 0.06]);
    part(w, G.box, toon(0xff7fa8, { emissive: 0xff5f8f, emissiveIntensity: 0.7 }), [0, 2.0, 0.025], [0.04, 2.0, 0.01]);
    w.rotation.z = 0.35; w.rotation.x = 0.25;
    rig.weapon = w;
    rig.wings = [];
  } else if (id === 'wyrm') {
    const segments = [];
    for (let i = 0; i < 9; i++) {
      const seg = group(body, [0, 1.4 + Math.sin(i * 0.8) * 0.2, -i * 0.95]);
      const s = 0.85 - i * 0.055;
      part(seg, G.sphere, toon(i < 4 ? 0x8a5a36 : 0x6b4529), [0, 0, 0], [s, s * 0.85, s * 1.2], [0, 0, 0], 1);
      part(seg, G.cone, toon(0xd9c08a), [0, s * 0.8, 0], [0.16, 0.5, 0.16], [0.3, 0, 0]);
      segments.push(seg);
    }
    const head = group(body, [0, 1.9, 1.1]);
    part(head, G.sphere, toon(0x8a5a36), [0, 0, 0], [0.62, 0.55, 0.85], [0, 0, 0], 2);
    part(head, G.box, toon(0x3a2418), [0, -0.22, 0.6], [0.6, 0.18, 0.8]);
    for (const sx of [-1, 1]) part(head, G.sphereLo, basic(0xffc54a), [sx * 0.28, 0.18, 0.62], [0.09, 0.06, 0.06]);
    for (const sx of [-1, 1]) {
      part(head, G.cone, toon(0xe6d2a0), [sx * 0.38, 0.45, -0.2], [0.08, 0.9, 0.08], [-0.6, 0, sx * 0.4]);
      for (let i = 0; i < 3; i++) part(head, G.cone, toon(0xe6d2a0), [sx * (0.25 + i * 0.08), -0.2, 0.55 - i * 0.2], [0.05, 0.25, 0.05], [0, 0, Math.PI / 2 + sx * 0.2]);
    }
    rig.head = head; rig.segments = segments;
    // wings
    for (const sx of [-1, 1]) {
      const wing = group(body, [sx * 0.7, 2.2, -2]);
      for (let i = 0; i < 3; i++) part(wing, G.cone, toon(0x4a2e1a), [sx * (0.5 + i * 0.4), 0.1 - i * 0.15, 0], [0.12, 1.4 - i * 0.3, 0.3], [0, 0, sx * (1.3 + i * 0.15)]);
      rig['wing' + (sx < 0 ? 'L' : 'R')] = wing;
    }
  } else if (id === 'colossus') {
    part(body, G.cylTaper, toon(0x4b6f88), [0, 2.5, 0], [1.2, 3.0, 1.0], [0, 0, 0], 2);
    part(body, G.box, toon(0x2f4a5e), [0, 2.4, 0.6], [1.0, 1.6, 0.4]);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      part(body, G.octa, toon(0x9ee8ff, { emissive: 0x58cfff, emissiveIntensity: 0.8 }), [Math.cos(a) * 1.15, 2.8 + Math.sin(i * 2) * 0.7, Math.sin(a) * 0.95], [0.25, 0.7, 0.25], [0, 0, a]);
    }
    const head = group(body, [0, 4.3, 0.1]);
    part(head, G.sphereLo, toon(0x5b7f99), [0, 0, 0], [0.72, 0.68, 0.65], [0, 0, 0], 2);
    part(head, G.box, toon(0x22344a), [0, -0.08, 0.55], [0.7, 0.2, 0.2]);
    for (const sx of [-1, 1]) {
      part(head, G.sphereLo, basic(0x9ef0ff), [sx * 0.24, 0.1, 0.6], [0.09, 0.06, 0.05]);
      part(head, G.cone, toon(0x9ee8ff, { emissive: 0x58cfff, emissiveIntensity: 1.2 }), [sx * 0.5, 0.42, -0.1], [0.14, 0.9, 0.14], [-0.3, 0, sx * 0.5]);
    }
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = group(body, [sx * 1.55, 3.5, 0]);
      part(sh, G.cyl, toon(0x4b6f88), [0, -0.7, 0], [0.3, 1.5, 0.3], [0, 0, sx * 0.15], 2);
      const el = group(sh, [0, -1.6, 0]);
      part(el, G.sphere, toon(0x3f6076), [0, -0.2, 0], [0.5, 0.55, 0.5]);
      part(el, G.octa, toon(0x9ee8ff, { emissive: 0x58cfff, emissiveIntensity: 1 }), [0, -0.7, 0.2], [0.3, 0.45, 0.3]);
      arms.push({ sh, el });
    }
    rig.armL = arms[0].sh; rig.armR = arms[1].sh; rig.elbowL = arms[0].el; rig.elbowR = arms[1].el;
    rig.head = head;
    rig.legL = group(body, [-0.7, 1.2, 0]); rig.legR = group(body, [0.7, 1.2, 0]);
    for (const [sx, g] of [[-1, rig.legL], [1, rig.legR]]) part(g, G.cyl, toon(0x3f6076), [0, -0.6, 0], [0.35, 1.3, 0.35], [0, 0, 0], 2);
  } else if (id === 'seraph') {
    // floating dark angel
    part(body, G.cylTaper, toon(0x1b1428), [0, 2.5, 0], [0.7, 2.4, 0.5], [0, 0, 0], 2);
    part(body, G.box, toon(0x6f43a8), [0, 2.4, 0.25], [0.6, 1.4, 0.1]);
    for (let i = 0; i < 3; i++) part(body, G.octa, toon(0xc77bff, { emissive: 0xb05cff, emissiveIntensity: 1.4 }), [0, 2.1 + i * 0.45, 0.32], [0.12, 0.18, 0.06]);
    const head = group(body, [0, 4.0, 0.1]);
    part(head, G.sphereLo, toon(0xd8c8e8), [0, 0, 0], [0.3, 0.34, 0.29], [0, 0, 0], 2);
    part(head, G.sphereLo, toon(0x2a1b3a), [0, 0.04, -0.05], [0.32, 0.31, 0.28]);
    part(head, G.sphereLo, basic(0xc77bff), [-0.1, 0, 0.28], [0.045, 0.03, 0.03]);
    part(head, G.sphereLo, basic(0xc77bff), [0.1, 0, 0.28], [0.045, 0.03, 0.03]);
    const halo = part(head, G.torus, toon(0xc77bff, { emissive: 0xc77bff, emissiveIntensity: 1.5 }), [0, 0.55, -0.1], [0.4, 0.4, 0.4], [Math.PI / 2, 0, 0]);
    rig.halo = halo;
    const wings = [];
    for (const sx of [-1, 1]) {
      const wing = group(body, [sx * 0.5, 3.0, -0.4]);
      for (let i = 0; i < 3; i++) {
        const w = group(wing);
        part(w, G.cone, toon(i === 0 ? 0x2a1b3a : 0x3c2455), [sx * (0.7 + i * 0.5), 0.35 - i * 0.3, -0.1], [0.18, 2.2 - i * 0.45, 0.5], [0, 0, sx * (1.15 + i * 0.12)]);
        part(w, G.cone, toon(0x8f5ac9, { emissive: 0x6f35a8, emissiveIntensity: 0.4 }), [sx * (0.8 + i * 0.5), 0.35 - i * 0.3, 0.1], [0.06, 1.8 - i * 0.4, 0.06], [0, 0, sx * (1.15 + i * 0.12)]);
        wings.push(w);
      }
    }
    rig.wings = wings;
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = group(body, [sx * 0.72, 3.2, 0]);
      part(sh, G.capsule, toon(0x241635), [0, -0.4, 0], [0.1, 0.55, 0.1]);
      const el = group(sh, [0, -0.95, 0]);
      part(el, G.capsule, toon(0x2f1d47), [0, -0.35, 0], [0.08, 0.45, 0.08]);
      arms.push({ sh, el });
    }
    rig.armL = arms[0].sh; rig.armR = arms[1].sh;
    const w = new THREE.Group(); arms[0].el.add(w); w.position.set(0, -0.9, 0);
    part(w, G.cyl, toon(0x241635), [0, 0.6, 0], [0.05, 1.5, 0.05]);
    part(w, G.octa, toon(0xc77bff, { emissive: 0xb05cff, emissiveIntensity: 1.5 }), [0, 2.0, 0], [0.18, 0.35, 0.18]);
    w.rotation.z = 0.2;
    rig.weapon = w;
    // floating orbs
    rig.orbs = [];
    for (let i = 0; i < 4; i++) {
      const orb = part(body, G.octa, toon(0xc77bff, { emissive: 0xb05cff, emissiveIntensity: 1.6 }), [0, 0, 0], [0.16, 0.24, 0.16]);
      orb.userData.phase = i / 4 * Math.PI * 2;
      rig.orbs.push(orb);
    }
    rig.core = part(body, G.octa, toon(0xffffff, { emissive: 0xc77bff, emissiveIntensity: 2 }), [0, 2.6, 0.4], [0.2, 0.3, 0.1]);
  }
  return rig;
}

/* ================= WORLD PROP SHAPES ================= */
export function createTorii(scale = 1) {
  const g = new THREE.Group();
  const red = toon(0xb23a3a), dark = toon(0x2a1c1c);
  for (const sx of [-1, 1]) part(g, G.cyl, red, [sx * 1.6, 2.2, 0], [0.16, 4.4, 0.16], [0, 0, sx * 0.03], 1);
  part(g, G.box, red, [0, 3.6, 0], [4.3, 0.24, 0.3], [0, 0, 0], 1);
  part(g, G.box, red, [0, 4.25, 0], [5.0, 0.26, 0.4], [0, 0, 0], 1);
  part(g, G.box, dark, [0, 4.62, 0], [5.4, 0.14, 0.5]);
  part(g, G.box, dark, [0, 4.45, 0], [2.0, 0.3, 0.3]);
  g.scale.setScalar(scale);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createLantern(h = 2.2) {
  const g = new THREE.Group();
  const stone = toon(0x8a8f9a);
  part(g, G.box, stone, [0, 0.2, 0], [0.6, 0.4, 0.6]);
  part(g, G.cyl, stone, [0, h * 0.5, 0], [0.14, h, 0.14]);
  part(g, G.box, stone, [0, h, 0], [0.8, 0.16, 0.8]);
  part(g, G.box, basic(0xffc46a, { transparent: true, opacity: 0.85 }), [0, h + 0.25, 0], [0.42, 0.4, 0.42]);
  part(g, G.cone4, stone, [0, h + 0.6, 0], [0.75, 0.35, 0.75]);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createCrystal(color = 0x7bdcff, h = 1.5) {
  const g = new THREE.Group();
  const mat = toon(color, { emissive: color, emissiveIntensity: 1.1, transparent: true, opacity: 0.92 });
  part(g, G.octa, mat, [0, h * 0.55, 0], [h * 0.3, h * 0.8, h * 0.3]);
  part(g, G.octa, mat, [h * 0.2, h * 0.4, 0.1], [h * 0.13, h * 0.4, h * 0.13], [0, 0, 0.2]);
  part(g, G.octa, mat, [-h * 0.18, h * 0.45, -0.05], [h * 0.1, h * 0.3, h * 0.1], [0, 0, -0.25]);
  return g;
}

export function createChest(gold = false) {
  const g = new THREE.Group();
  const wood = toon(gold ? 0x6b4a24 : 0x4a3524), trim = toon(gold ? 0xe6c46a : 0x8f7a52);
  part(g, G.box, wood, [0, 0.28, 0], [0.85, 0.56, 0.55], [0, 0, 0], 1);
  const lid = group(g, [0, 0.56, 0]);
  part(lid, G.box, wood, [0, 0.12, 0], [0.9, 0.24, 0.58], [0, 0, 0], 1);
  part(lid, G.box, trim, [0, 0.12, 0.3], [0.92, 0.08, 0.04]);
  part(g, G.box, trim, [0, 0.3, 0.29], [0.1, 0.22, 0.04]);
  part(g, G.octa, toon(0xffd76a, { emissive: 0xffb43a, emissiveIntensity: 0.8 }), [0, 0.3, 0.33], [0.08, 0.11, 0.05]);
  g.userData.lid = lid;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function createCrystalWaypoint(color = 0x7bdcff) {
  const g = new THREE.Group();
  const base = toon(0x2a3550), trim = toon(0xc9d8f2);
  part(g, G.cyl, base, [0, 0.2, 0], [0.9, 0.4, 0.9], [0, 0, 0], 1);
  part(g, G.torus, trim, [0, 0.45, 0], [0.8, 0.8, 1.4], [Math.PI / 2, 0, 0]);
  const cry = part(g, G.octa, toon(color, { emissive: color, emissiveIntensity: 1.6 }), [0, 1.6, 0], [0.38, 1.2, 0.38]);
  part(g, G.octa, basic(0xffffff, { transparent: true, opacity: 0.4 }), [0, 1.6, 0], [0.16, 0.55, 0.16]);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  g.userData.crystal = cry; g.userData.ring = ring;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
