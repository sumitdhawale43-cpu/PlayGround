import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* anime toon helpers                                                  */
/* ------------------------------------------------------------------ */
function gradient() {
  const data = new Uint8Array([80, 80, 80, 255, 145, 145, 145, 255, 210, 210, 210, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}
const GRAD = gradient();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...extra });
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = cast;
  return m;
}

export const HERO_COLORS = {
  skin: 0xffd9c4,
  hair: 0xeaf8ff,
  hairShade: 0xb9d9ef,
  outfit: 0x1d2c56,
  outfitLight: 0x2f477e,
  accent: 0x7df9ff,
  gold: 0xffd37a,
  scarf: 0xff5f7e,
  boot: 0x151d36,
  blade: 0xbffcff,
};

/* ------------------------------------------------------------------ */
/* player model                                                        */
/* ------------------------------------------------------------------ */
export function createPlayerModel() {
  const root = new THREE.Group();
  root.name = 'Astra';
  const model = new THREE.Group();
  model.position.y = 0.92;
  root.add(model);

  const skin = toon(HERO_COLORS.skin);
  const hair = toon(HERO_COLORS.hair);
  const hairShade = toon(HERO_COLORS.hairShade);
  const outfit = toon(HERO_COLORS.outfit);
  const outfitLight = toon(HERO_COLORS.outfitLight);
  const gold = toon(HERO_COLORS.gold, { emissive: 0x6d430c, emissiveIntensity: 0.35 });
  const scarfMat = toon(HERO_COLORS.scarf, { side: THREE.DoubleSide });
  const boot = toon(HERO_COLORS.boot);
  const bladeMat = toon(HERO_COLORS.blade, { emissive: 0x2bd3e6, emissiveIntensity: 0.9 });

  /* --- hips / torso --- */
  const hips = new THREE.Group();
  model.add(hips);

  const pelvis = mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.2, 8), outfit);
  pelvis.position.y = 0.0; hips.add(pelvis);
  const belt = mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.09, 8), gold);
  belt.position.y = 0.12; hips.add(belt);
  const buckle = mesh(new THREE.BoxGeometry(0.16, 0.13, 0.06), toon(0x9a6b1f));
  buckle.position.set(0, 0.12, 0.25); hips.add(buckle);
  const star = mesh(new THREE.OctahedronGeometry(0.055, 0), basic(0xfff3c0));
  star.position.set(0, 0.12, 0.29); hips.add(star);

  const torso = new THREE.Group();
  torso.position.y = 0.16; hips.add(torso);
  const chest = mesh(new THREE.CylinderGeometry(0.29, 0.23, 0.52, 8), outfit);
  chest.position.y = 0.24; torso.add(chest);
  const chestPlate = mesh(new THREE.BoxGeometry(0.32, 0.3, 0.12), outfitLight);
  chestPlate.position.set(0, 0.3, 0.22); torso.add(chestPlate);
  const collar = mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.14, 8), toon(0xf4f8ff));
  collar.position.y = 0.5; torso.add(collar);
  const emblem = mesh(new THREE.OctahedronGeometry(0.075, 0), basic(0x7df9ff));
  emblem.position.set(0, 0.31, 0.3); torso.add(emblem);
  const trim = mesh(new THREE.BoxGeometry(0.44, 0.05, 0.05), gold);
  trim.position.set(0, 0.08, 0.22); torso.add(trim);
  // shoulder pauldrons
  for (const sx of [-1, 1]) {
    const pauldron = mesh(new THREE.SphereGeometry(0.17, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), outfitLight);
    pauldron.scale.set(1.1, 0.75, 1.1);
    pauldron.position.set(sx * 0.3, 0.47, 0); torso.add(pauldron);
    const rim = mesh(new THREE.TorusGeometry(0.14, 0.025, 5, 12), gold);
    rim.rotation.x = Math.PI / 2; rim.position.set(sx * 0.3, 0.44, 0); torso.add(rim);
  }

  // skirt panels
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const panel = mesh(new THREE.PlaneGeometry(0.25, 0.42), toon(i % 2 ? HERO_COLORS.outfitLight : HERO_COLORS.outfit, { side: THREE.DoubleSide }));
    panel.position.set(Math.cos(a) * 0.2, -0.12, Math.sin(a) * 0.2);
    panel.rotation.y = -a + Math.PI / 2;
    panel.rotation.x = 0.08;
    hips.add(panel);
  }

  /* --- head --- */
  const head = new THREE.Group();
  head.position.y = 0.72; torso.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.235, 12, 10), skin);
  skull.scale.set(0.96, 1.04, 0.96); head.add(skull);
  const jaw = mesh(new THREE.SphereGeometry(0.16, 10, 8), skin);
  jaw.scale.set(0.82, 0.7, 0.9); jaw.position.set(0, -0.11, 0.06); head.add(jaw);
  const neck = mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.18, 6), skin);
  neck.position.y = -0.24; head.add(neck);
  // hair mass
  const hairBack = mesh(new THREE.SphereGeometry(0.26, 10, 8), hair);
  hairBack.scale.set(1.02, 1.02, 1.04); hairBack.position.set(0, 0.02, -0.035); head.add(hairBack);
  const fringe = mesh(new THREE.SphereGeometry(0.245, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), hair);
  fringe.scale.set(1.04, 1.0, 1.06); fringe.position.set(0, 0.04, 0.03); head.add(fringe);
  // bangs
  for (const [x, rot, len] of [[-0.13, 0.3, 0.22], [-0.04, 0.05, 0.25], [0.07, -0.12, 0.22], [0.16, -0.3, 0.18]]) {
    const bang = mesh(new THREE.ConeGeometry(0.055, len, 4), hairShade);
    bang.position.set(x, 0.13, 0.22); bang.rotation.z = rot; bang.rotation.x = 0.12; head.add(bang);
  }
  // side locks
  for (const sx of [-1, 1]) {
    const lock = mesh(new THREE.CapsuleGeometry(0.045, 0.34, 3, 6), hair);
    lock.position.set(sx * 0.21, -0.12, 0.03); lock.rotation.z = sx * 0.08; head.add(lock);
  }
  // long back hair
  const backHair = mesh(new THREE.ConeGeometry(0.22, 0.7, 6), hair);
  backHair.position.set(0, -0.23, -0.13); backHair.rotation.x = -0.1; head.add(backHair);
  // eyes
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.045, 8, 6), basic(0x15203b), false);
    eye.scale.set(0.8, 1.25, 0.35); eye.position.set(sx * 0.085, -0.015, 0.222); head.add(eye);
    const iris = mesh(new THREE.SphereGeometry(0.026, 8, 6), basic(0x7df9ff), false);
    iris.scale.set(0.9, 1.15, 0.3); iris.position.set(sx * 0.085, -0.012, 0.242); head.add(iris);
    const brow = mesh(new THREE.BoxGeometry(0.07, 0.014, 0.02), toon(0x8fb9d0), false);
    brow.position.set(sx * 0.085, 0.055, 0.226); brow.rotation.z = sx * -0.1; head.add(brow);
  }
  const mouth = mesh(new THREE.BoxGeometry(0.045, 0.008, 0.01), toon(0xc97d84), false);
  mouth.position.set(0, -0.09, 0.215); head.add(mouth);
  // headband / circlet
  const circlet = mesh(new THREE.TorusGeometry(0.225, 0.018, 5, 18), gold);
  circlet.rotation.x = Math.PI / 2; circlet.position.y = 0.1; head.add(circlet);
  const gem = mesh(new THREE.OctahedronGeometry(0.04, 0), basic(0x7df9ff));
  gem.position.set(0, 0.11, 0.24); head.add(gem);

  // scarf
  const scarf = mesh(new THREE.TorusGeometry(0.14, 0.05, 6, 12), scarfMat);
  scarf.rotation.x = Math.PI / 2; scarf.position.set(0, -0.23, 0); torso.add(scarf);
  const scarfTails = [];
  for (let i = 0; i < 3; i++) {
    const tail = mesh(new THREE.PlaneGeometry(0.2 - i * 0.035, 0.78 - i * 0.12), scarfMat, false);
    tail.position.set(-0.09 + i * 0.09, 0.26, -0.23 - i * 0.012);
    tail.rotation.x = 0.28; tail.rotation.z = 0.16 - i * 0.16;
    torso.add(tail); scarfTails.push(tail);
  }

  // split coat tails / short cape, with a bright lining
  const cape = new THREE.Group();
  cape.position.set(0, 0.42, -0.22);
  const capeMat = toon(0x18234a, { side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const panel = mesh(new THREE.PlaneGeometry(0.27, 0.88), capeMat, false);
    panel.position.set(sx * 0.14, -0.42, 0);
    panel.rotation.y = sx * 0.22;
    cape.add(panel);
    const lining = mesh(new THREE.PlaneGeometry(0.2, 0.76), toon(0x7df9ff, { side: THREE.DoubleSide, emissive: 0x1a6b7a, emissiveIntensity: 0.25 }), false);
    lining.position.set(sx * 0.145, -0.43, 0.012);
    lining.rotation.y = sx * 0.22;
    cape.add(lining);
  }
  torso.add(cape);

  // long anime ponytail
  const ponytail = new THREE.Group();
  ponytail.position.set(0, 0.02, -0.2);
  for (let i = 0; i < 3; i++) {
    const seg = mesh(new THREE.ConeGeometry(0.13 - i * 0.025, 0.38, 5), i === 2 ? hairShade : hair, false);
    seg.position.set(0, -0.16 - i * 0.26, -0.06 - i * 0.035);
    seg.rotation.x = -0.18 - i * 0.06;
    ponytail.add(seg);
  }
  const ribbon = mesh(new THREE.BoxGeometry(0.22, 0.08, 0.06), scarfMat, false);
  ribbon.position.set(0, -0.02, -0.04); ponytail.add(ribbon);
  head.add(ponytail);

  /* --- arms --- */
  function makeArm(sx) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.33, 0.44, 0);
    torso.add(shoulder);
    const upper = mesh(new THREE.CapsuleGeometry(0.07, 0.26, 4, 7), outfit);
    upper.position.y = -0.19; shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.38; shoulder.add(elbow);
    const fore = mesh(new THREE.CapsuleGeometry(0.06, 0.24, 4, 7), skin);
    fore.position.y = -0.17; elbow.add(fore);
    const bracer = mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.18, 6), outfitLight);
    bracer.position.y = -0.2; elbow.add(bracer);
    const hand = mesh(new THREE.SphereGeometry(0.065, 7, 6), skin);
    hand.position.y = -0.35; elbow.add(hand);
    return { shoulder, elbow, hand };
  }
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  /* --- legs --- */
  function makeLeg(sx) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.13, -0.06, 0);
    hips.add(hip);
    const thigh = mesh(new THREE.CapsuleGeometry(0.09, 0.3, 4, 7), outfit);
    thigh.position.y = -0.22; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
    const shin = mesh(new THREE.CapsuleGeometry(0.075, 0.27, 4, 7), outfit);
    shin.position.y = -0.18; knee.add(shin);
    const bootMesh = mesh(new THREE.BoxGeometry(0.16, 0.18, 0.28), boot);
    bootMesh.position.set(0, -0.38, 0.045); knee.add(bootMesh);
    const bootTrim = mesh(new THREE.BoxGeometry(0.17, 0.04, 0.29), gold);
    bootTrim.position.set(0, -0.3, 0.045); knee.add(bootTrim);
    return { hip, knee };
  }
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  /* --- sword --- */
  const sword = new THREE.Group();
  const grip = mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.22, 6), toon(0x2a1a18));
  grip.position.y = -0.08; sword.add(grip);
  const pommel = mesh(new THREE.OctahedronGeometry(0.045, 0), gold);
  pommel.position.y = -0.2; sword.add(pommel);
  const guard = mesh(new THREE.BoxGeometry(0.3, 0.045, 0.07), gold);
  guard.position.y = 0.03; sword.add(guard);
  const blade = mesh(new THREE.BoxGeometry(0.075, 1.0, 0.035), bladeMat);
  blade.position.y = -0.55; sword.add(blade);
  const tip = mesh(new THREE.ConeGeometry(0.052, 0.2, 4), bladeMat);
  tip.position.y = -1.13; tip.rotation.z = Math.PI; sword.add(tip);
  const fuller = mesh(new THREE.BoxGeometry(0.018, 0.85, 0.042), basic(0xffffff));
  fuller.position.y = -0.55; sword.add(fuller);
  const bladeGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7df9ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  bladeGlow.position.y = -0.6; bladeGlow.scale.set(0.5, 1.5, 1); sword.add(bladeGlow);
  sword.position.y = -0.34;
  sword.rotation.x = -0.15;
  rightArm.elbow.add(sword);

  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(125,249,255,.55)'); g.addColorStop(1, 'rgba(125,249,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // shadow blob under feet (soft grounding)
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x0a1520, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; root.add(shadow);

  const state = {
    name: 'idle', time: 0, speed: 0, grounded: true, phase: 0,
    lean: 0, hurt: 0,
  };

  const modelApi = {
    root, model, hips, torso, head, leftArm, rightArm, leftLeg, rightLeg, sword, scarfTails, cape, ponytail, shadow,
    state,
    setState(name) {
      if (state.name === name) return;
      state.name = name; state.time = 0;
    },
    setSwordLevel(level) {
      const colors = [0xbffcff, 0xbffcff, 0xd7c3ff, 0xffe4a8];
      const emis = [0x2bd3e6, 0x2bd3e6, 0x7b4dff, 0xff9a3c];
      blade.material.color.setHex(colors[level] || colors[0]);
      blade.material.emissive.setHex(emis[level] || emis[0]);
      tip.material.color.setHex(colors[level] || colors[0]);
      tip.material.emissive.setHex(emis[level] || emis[0]);
      bladeGlow.material.color.setHex(level >= 2 ? 0xb46bff : level >= 1 ? 0x7df9ff : 0x7df9ff);
    },
    update(dt, speed, grounded) {
      state.time += dt;
      state.speed = speed;
      state.grounded = grounded;
      const t = state.time;
      const name = state.name;
      const sp = Math.min(1, speed / 9);
      state.phase += dt * (3 + speed * 0.85);

      // reset base pose
      model.position.y = 0.92;
      model.rotation.x = 0; model.rotation.z = 0;
      torso.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
      leftArm.shoulder.rotation.set(0, 0, 0);
      rightArm.shoulder.rotation.set(0, 0, 0);
      leftArm.elbow.rotation.set(0, 0, 0);
      rightArm.elbow.rotation.set(0, 0, 0);
      leftLeg.hip.rotation.set(0, 0, 0);
      rightLeg.hip.rotation.set(0, 0, 0);
      leftLeg.knee.rotation.set(0, 0, 0);
      rightLeg.knee.rotation.set(0, 0, 0);
      scarfTails.forEach((s, i) => { s.rotation.x = 0.2; s.rotation.z = (i - 1) * 0.16; });
      cape.rotation.x = 0.04; cape.rotation.z = 0;
      ponytail.rotation.x = 0; ponytail.rotation.z = 0;

      const breathe = Math.sin(t * 2.1) * 0.015;
      const bob = Math.sin(state.phase * 2) * (0.02 + sp * 0.05);

      if (name === 'idle' || name === 'dialogue') {
        model.position.y = 0.92 + breathe;
        torso.rotation.x = -0.02 + breathe;
        head.rotation.y = Math.sin(t * 0.5) * 0.08;
        leftArm.shoulder.rotation.z = -0.08;
        rightArm.shoulder.rotation.z = 0.08;
        leftArm.elbow.rotation.x = -0.15;
        rightArm.elbow.rotation.x = -0.18;
        sword.rotation.x = -0.15;
        scarfTails.forEach((s, i) => { s.rotation.x = 0.2 + Math.sin(t * 2.3 + i) * 0.08; s.rotation.z = (i - 1) * 0.16 + Math.sin(t * 1.7 + i) * 0.05; });
        cape.rotation.x = 0.04 + Math.sin(t * 1.6) * 0.03;
        ponytail.rotation.x = 0.02 + Math.sin(t * 1.9) * 0.04; ponytail.rotation.z = Math.sin(t * 1.2) * 0.05;
      } else if (name === 'walk' || name === 'run') {
        const amp = 0.42 + sp * 0.38;
        const swing = Math.sin(state.phase) * amp;
        model.position.y = 0.92 + bob;
        torso.rotation.x = -0.06 - sp * 0.12;
        torso.rotation.y = Math.sin(state.phase) * 0.07;
        head.rotation.x = 0.04 + sp * 0.04;
        leftLeg.hip.rotation.x = swing;
        rightLeg.hip.rotation.x = -swing;
        leftLeg.knee.rotation.x = Math.max(0, -Math.sin(state.phase)) * (0.4 + sp * 0.5);
        rightLeg.knee.rotation.x = Math.max(0, Math.sin(state.phase)) * (0.4 + sp * 0.5);
        leftArm.shoulder.rotation.x = -swing * 0.8;
        rightArm.shoulder.rotation.x = swing * 0.6 - 0.15;
        leftArm.elbow.rotation.x = -0.25 - sp * 0.25;
        rightArm.elbow.rotation.x = -0.3;
        leftArm.shoulder.rotation.z = -0.05;
        rightArm.shoulder.rotation.z = 0.1;
        sword.rotation.x = -0.25;
        scarfTails.forEach((s, i) => {
          s.rotation.x = 0.55 + sp * 0.7 + Math.sin(t * 5 + i) * 0.15;
          s.rotation.z = (i - 1) * (0.16 + sp * 0.22);
        });
        cape.rotation.x = 0.08 + sp * 0.22 + Math.sin(t * 5) * 0.05;
        ponytail.rotation.x = 0.12 + sp * 0.3 + Math.sin(t * 5) * 0.08;
        ponytail.rotation.z = Math.sin(t * 3.4) * 0.1;
      } else if (name === 'jump') {
        model.position.y = 0.92 + 0.04;
        torso.rotation.x = -0.1;
        leftLeg.hip.rotation.x = 0.75; rightLeg.hip.rotation.x = -0.2;
        leftLeg.knee.rotation.x = 0.7; rightLeg.knee.rotation.x = 0.45;
        leftArm.shoulder.rotation.x = -0.7; rightArm.shoulder.rotation.x = 0.5;
        leftArm.shoulder.rotation.z = -0.6; rightArm.shoulder.rotation.z = 0.5;
        leftArm.elbow.rotation.x = -0.5; rightArm.elbow.rotation.x = -0.4;
        sword.rotation.x = -0.5;
        scarfTails.forEach((s, i) => { s.rotation.x = 0.9; s.rotation.z = (i - 1) * 0.2; });
      } else if (name === 'dodge') {
        const p = Math.min(1, t / 0.46);
        model.position.y = 0.92 - Math.sin(p * Math.PI) * 0.4;
        model.rotation.x = p * Math.PI * 2;
        torso.rotation.x = 0.35;
        leftLeg.hip.rotation.x = 1.0; rightLeg.hip.rotation.x = 1.0;
        leftLeg.knee.rotation.x = 1.4; rightLeg.knee.rotation.x = 1.4;
        leftArm.shoulder.rotation.x = 1.0; rightArm.shoulder.rotation.x = 0.8;
        leftArm.elbow.rotation.x = -1.2; rightArm.elbow.rotation.x = -1.2;
        sword.rotation.x = 0.5;
        scarfTails.forEach((s, i) => { s.rotation.x = 1.2; s.rotation.z = (i - 1) * 0.3; });
      } else if (name === 'hurt') {
        model.rotation.x = -0.15;
        torso.rotation.x = 0.25;
        head.rotation.x = 0.2;
        leftArm.shoulder.rotation.x = -0.5; rightArm.shoulder.rotation.x = -0.3;
        leftArm.shoulder.rotation.z = -0.5; rightArm.shoulder.rotation.z = 0.6;
        leftArm.elbow.rotation.x = -0.5; rightArm.elbow.rotation.x = -0.5;
      } else if (name.startsWith('attack')) {
        const combo = Number(name.slice(6)) || 0;
        const dur = combo === 2 ? 0.56 : 0.44;
        const p = Math.min(1, t / dur);
        const wind = Math.min(1, p / 0.3);
        const strike = p < 0.3 ? 0 : Math.min(1, (p - 0.3) / 0.3);
        const recover = Math.max(0, (p - 0.62) / 0.38);
        const ease = (x) => x * x * (3 - 2 * x);
        const sw = Math.sin(ease(strike) * Math.PI * 0.9) * (1 - recover * 0.7);
        model.position.y = 0.92 + Math.sin(p * Math.PI) * 0.04;
        torso.rotation.y = (combo === 1 ? 0.55 : -0.55) * wind - (combo === 1 ? 1.2 : -1.2) * sw;
        torso.rotation.x = -0.1 + sw * 0.2;
        head.rotation.y = -torso.rotation.y * 0.4;
        if (combo === 0) {
          rightArm.shoulder.rotation.x = -0.5 - sw * 1.5;
          rightArm.shoulder.rotation.z = 0.5 + sw * 0.5;
          rightArm.elbow.rotation.x = -0.4 - sw * 0.4;
          leftArm.shoulder.rotation.x = 0.3; leftArm.shoulder.rotation.z = -0.4;
          sword.rotation.x = -0.2 - sw * 0.7;
        } else if (combo === 1) {
          rightArm.shoulder.rotation.x = -1.5 + sw * 1.6;
          rightArm.shoulder.rotation.z = 0.2 - sw * 0.4;
          rightArm.elbow.rotation.x = -0.9 + sw * 0.6;
          leftArm.shoulder.rotation.x = -0.2; leftArm.shoulder.rotation.z = -0.5;
          sword.rotation.x = -0.8 + sw * 0.8;
        } else {
          rightArm.shoulder.rotation.x = -0.8 - sw * 0.8;
          rightArm.shoulder.rotation.z = -0.3 - sw * 1.2;
          rightArm.elbow.rotation.x = -0.5;
          leftArm.shoulder.rotation.x = -0.4; leftArm.shoulder.rotation.z = -0.7;
          sword.rotation.x = -0.5 - sw * 0.4;
          model.rotation.y = sw * 0.5;
        }
        scarfTails.forEach((s, i) => { s.rotation.x = 0.5 + sw * 0.5; s.rotation.z = (i - 1) * 0.25; });
      } else if (name === 'heavy') {
        const p = Math.min(1, t / 0.78);
        const wind = Math.min(1, p / 0.38);
        const strike = p < 0.38 ? 0 : Math.min(1, (p - 0.38) / 0.22);
        const rec = Math.max(0, (p - 0.6) / 0.4);
        const ease = (x) => x * x * (3 - 2 * x);
        model.position.y = 0.92 + Math.sin(p * Math.PI) * 0.05;
        torso.rotation.x = -0.15 - wind * 0.25 + strike * 0.55 - rec * 0.2;
        torso.rotation.y = -wind * 0.3;
        rightArm.shoulder.rotation.x = -2.6 * wind + 3.0 * ease(strike);
        rightArm.shoulder.rotation.z = 0.3;
        rightArm.elbow.rotation.x = -1.1 + wind * 0.4;
        leftArm.shoulder.rotation.x = -1.8 * wind + 2.2 * ease(strike);
        leftArm.shoulder.rotation.z = -0.2;
        leftArm.elbow.rotation.x = -0.8;
        sword.rotation.x = -0.8 + ease(strike) * 0.6;
        leftLeg.hip.rotation.x = 0.25; rightLeg.hip.rotation.x = -0.25;
        leftLeg.knee.rotation.x = 0.25; rightLeg.knee.rotation.x = 0.15;
        scarfTails.forEach((s, i) => { s.rotation.x = 0.9; s.rotation.z = (i - 1) * 0.25; });
      } else if (name === 'magic') {
        const p = Math.min(1, t / 0.9);
        const raise = Math.min(1, p / 0.4);
        model.position.y = 0.92 + Math.sin(p * Math.PI) * 0.1;
        torso.rotation.x = -0.2;
        head.rotation.x = -0.15;
        leftArm.shoulder.rotation.x = -2.5 * raise;
        leftArm.shoulder.rotation.z = -0.4;
        rightArm.shoulder.rotation.x = -1.2 * raise;
        rightArm.shoulder.rotation.z = 0.5;
        leftArm.elbow.rotation.x = -0.4;
        rightArm.elbow.rotation.x = -0.6;
        sword.rotation.x = -0.4;
        scarfTails.forEach((s, i) => { s.rotation.x = 0.8 + Math.sin(t * 6 + i) * 0.15; s.rotation.z = (i - 1) * 0.3; });
      } else if (name === 'dead') {
        model.rotation.z = Math.min(1.5, t * 2.2);
        model.position.y = 0.5;
      }

      // sword glow pulse
      bladeGlow.material.opacity = 0.35 + Math.sin(t * 4) * 0.1;
      shadow.material.opacity = grounded ? 0.22 : 0.08;
      shadow.scale.setScalar(grounded ? 1 : 0.7);
    },
    getSwordWorld() {
      const v = new THREE.Vector3();
      blade.getWorldPosition(v);
      return v;
    },
  };
  return modelApi;
}

/* ------------------------------------------------------------------ */
/* villager / NPC models                                               */
/* ------------------------------------------------------------------ */
export function createNPC(opts = {}) {
  const group = new THREE.Group();
  const model = new THREE.Group();
  model.position.y = 0.9;
  group.add(model);

  const robe = toon(opts.robe ?? 0x3b5d7a);
  const robeDark = toon(0x263a54);
  const skin = toon(0xffd6bd);
  const hair = toon(opts.hair ?? 0x3a2a24);
  const accent = toon(opts.accent ?? 0xffd37a, { emissive: opts.accent ?? 0xffd37a, emissiveIntensity: 0.2 });

  const body = mesh(new THREE.ConeGeometry(0.36, 1.05, 8), robe);
  body.position.y = 0.12; model.add(body);
  const shoulders = mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.26, 8), robeDark);
  shoulders.position.y = 0.66; model.add(shoulders);
  const belt = mesh(new THREE.TorusGeometry(0.24, 0.035, 5, 14), accent);
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.18; model.add(belt);

  const head = new THREE.Group(); head.position.y = 1.03; model.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.19, 10, 8), skin);
  skull.scale.set(0.95, 1.03, 0.95); head.add(skull);
  const hairMass = mesh(new THREE.SphereGeometry(0.205, 10, 8), hair);
  hairMass.scale.set(1, 1.02, 1.04); hairMass.position.set(0, 0.03, -0.03); head.add(hairMass);
  if (opts.hood) {
    const hood = mesh(new THREE.SphereGeometry(0.25, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.7), robe);
    hood.position.set(0, 0.03, -0.03); head.add(hood);
    const hoodTip = mesh(new THREE.ConeGeometry(0.13, 0.4, 6), robe);
    hoodTip.position.set(0, 0.22, -0.15); hoodTip.rotation.x = -0.6; head.add(hoodTip);
  }
  // eyes
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.027, 6, 5), basic(0x1b2438), false);
    eye.scale.set(0.8, 1.2, 0.4); eye.position.set(sx * 0.07, 0, 0.175); head.add(eye);
  }
  // beard for Rook
  if (opts.apron) {
    const beard = mesh(new THREE.ConeGeometry(0.12, 0.28, 5), hair);
    beard.position.set(0, -0.16, 0.12); head.add(beard);
  }
  // arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(sx * 0.25, 0.6, 0); model.add(arm);
    const upper = mesh(new THREE.CapsuleGeometry(0.055, 0.32, 3, 6), robe);
    upper.position.y = -0.2; arm.add(upper);
    const hand = mesh(new THREE.SphereGeometry(0.055, 6, 5), skin);
    hand.position.y = -0.42; arm.add(hand);
    arms.push({ arm, hand, sx });
  }
  // apron
  if (opts.apron) {
    const apron = mesh(new THREE.PlaneGeometry(0.42, 0.7), toon(0x5b3a2a, { side: THREE.DoubleSide }));
    apron.position.set(0, 0.05, 0.28); model.add(apron);
    const hammer = new THREE.Group();
    const shaft = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 5), toon(0x6b4a33));
    hammer.add(shaft);
    const hh = mesh(new THREE.BoxGeometry(0.22, 0.12, 0.12), toon(0x5b6570));
    hh.position.y = 0.3; hammer.add(hh);
    hammer.position.set(0.34, 0.35, 0.15); hammer.rotation.z = -0.3; model.add(hammer);
  }
  // staff
  let orb = null;
  if (opts.staff) {
    const staff = new THREE.Group();
    const shaft = mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.8, 5), toon(0x5a3c28));
    shaft.position.y = 0.2; staff.add(shaft);
    orb = mesh(new THREE.OctahedronGeometry(0.09, 0), basic(0xffd37a));
    orb.position.y = 1.15; staff.add(orb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: npcGlow(), color: 0xffd37a, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.position.y = 1.15; halo.scale.set(0.8, 0.8, 1); staff.add(halo);
    staff.position.set(-0.38, 0.15, 0.05); model.add(staff);
  }
  // bow
  if (opts.bow) {
    const bow = new THREE.Group();
    const curve = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 4, 14, Math.PI * 1.1), toon(0x7a4d2b));
    curve.rotation.z = Math.PI * 0.45; bow.add(curve);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 3), basic(0xd9e6ea));
    string.position.x = 0.16; bow.add(string);
    bow.position.set(0, 0.55, -0.28); bow.rotation.y = 0.2; model.add(bow);
  }
  // feet
  for (const sx of [-1, 1]) {
    const foot = mesh(new THREE.BoxGeometry(0.13, 0.12, 0.2), robeDark);
    foot.position.set(sx * 0.11, -0.76, 0.03); model.add(foot);
  }

  const phase = Math.random() * 10;
  return {
    group,
    update(dt, t) {
      model.position.y = 0.9 + Math.sin(t * 1.4 + phase) * 0.012;
      head.rotation.y = Math.sin(t * 0.5 + phase) * 0.12;
      arms[0].arm.rotation.z = -0.06 + Math.sin(t * 1.2 + phase) * 0.02;
      arms[1].arm.rotation.z = 0.06;
      if (orb) {
        orb.rotation.y += dt * 1.2;
        orb.position.y = 1.15 + Math.sin(t * 1.8 + phase) * 0.04;
      }
    },
  };
}

function npcGlow() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,211,122,.6)'); g.addColorStop(1, 'rgba(255,211,122,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
