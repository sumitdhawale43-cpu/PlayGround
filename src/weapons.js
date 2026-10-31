import * as THREE from 'three';

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function cylinder(r1, r2, h, mat, x = 0, y = 0, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function muzzleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,235,1)');
  g.addColorStop(0.12, 'rgba(255,230,160,0.98)');
  g.addColorStop(0.38, 'rgba(255,150,50,0.55)');
  g.addColorStop(1, 'rgba(255,80,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  // star spikes
  ctx.translate(64, 64);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    const lg = ctx.createLinearGradient(0, 0, 62, 0);
    lg.addColorStop(0, 'rgba(255,240,190,0.85)');
    lg.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(62, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRifle() {
  const group = new THREE.Group();
  group.name = 'viewmodel';

  const tan = new THREE.MeshStandardMaterial({ color: 0x4a463a, roughness: 0.62, metalness: 0.25 });
  const tanDark = new THREE.MeshStandardMaterial({ color: 0x33312b, roughness: 0.7, metalness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x24272a, roughness: 0.36, metalness: 0.72 });
  const metalDark = new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.46, metalness: 0.7 });
  const glove = new THREE.MeshStandardMaterial({ color: 0x2a2b27, roughness: 0.85, metalness: 0.05 });
  const glovePad = new THREE.MeshStandardMaterial({ color: 0x4b4a40, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9a6c4b, roughness: 0.82 });

  // receiver
  const receiver = box(0.085, 0.13, 0.42, tan, 0, 0, -0.20);
  group.add(receiver);
  // upper rail
  group.add(box(0.055, 0.028, 0.52, metalDark, 0, 0.077, -0.23));
  // railing teeth
  for (let i = 0; i < 11; i++) {
    group.add(box(0.064, 0.012, 0.014, metal, 0, 0.094, -0.44 + i * 0.042));
  }
  // handguard
  group.add(box(0.092, 0.095, 0.33, tanDark, 0, 0.002, -0.56));
  for (let i = 0; i < 5; i++) {
    group.add(box(0.098, 0.012, 0.02, metalDark, 0, 0.045, -0.44 - i * 0.06));
  }
  // barrel
  group.add(cylinder(0.014, 0.014, 0.30, metal, 0, 0.012, -0.78, 12));
  // muzzle brake
  group.add(cylinder(0.026, 0.023, 0.075, metalDark, 0, 0.012, -0.935, 12));
  for (let i = 0; i < 3; i++) {
    group.add(box(0.055, 0.009, 0.012, metal, 0, 0.012, -0.915 - i * 0.022));
  }
  // gas block / front sight
  group.add(box(0.03, 0.05, 0.04, metalDark, 0, 0.05, -0.72));
  group.add(box(0.012, 0.035, 0.012, metal, 0, 0.083, -0.72));
  // magazine
  const mag = box(0.062, 0.19, 0.105, metal, 0, -0.15, -0.19);
  mag.rotation.x = -0.22;
  group.add(mag);
  // mag base
  const magBase = box(0.066, 0.02, 0.11, metalDark, 0, -0.238, -0.166);
  magBase.rotation.x = -0.22;
  group.add(magBase);
  // grip
  const grip = box(0.05, 0.15, 0.065, tanDark, 0, -0.135, 0.035);
  grip.rotation.x = 0.32;
  group.add(grip);
  // trigger guard
  group.add(box(0.058, 0.01, 0.09, metal, 0, -0.075, -0.03));
  // stock
  group.add(box(0.062, 0.085, 0.18, tanDark, 0, -0.005, 0.10));
  group.add(box(0.07, 0.12, 0.06, tan, 0, -0.012, 0.215));
  group.add(box(0.075, 0.14, 0.018, metalDark, 0, -0.012, 0.248));
  // cheek riser
  group.add(box(0.06, 0.032, 0.14, tanDark, 0, 0.055, 0.13));
  // charging handle
  group.add(box(0.02, 0.018, 0.07, metal, 0.06, 0.035, -0.10));

  // optic mount
  group.add(box(0.05, 0.035, 0.09, metalDark, 0, 0.11, -0.24));
  // holo sight frame
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 16), metalDark);
  frame.position.set(0, 0.148, -0.24);
  frame.scale.set(1, 1.2, 1);
  group.add(frame);
  // sight glass
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.029, 18),
    new THREE.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity: 0.075, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.position.set(0, 0.148, -0.24);
  glass.scale.set(1, 1.2, 1);
  group.add(glass);
  // glowing reticle dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3d2a, toneMapped: false }));
  dot.position.set(0, 0.148, -0.232);
  group.add(dot);

  // rear sight blocks
  group.add(box(0.032, 0.02, 0.03, metal, 0, 0.12, -0.05));

  // hands — right on grip, left on handguard
  const rightHand = new THREE.Group();
  const rPalm = box(0.085, 0.11, 0.10, glove, 0, -0.15, 0.045);
  rPalm.rotation.x = 0.3;
  rightHand.add(rPalm);
  const rThumb = box(0.028, 0.075, 0.032, glove, 0.042, -0.11, 0.012);
  rThumb.rotation.z = -0.3;
  rightHand.add(rThumb);
  rightHand.add(box(0.09, 0.03, 0.10, glovePad, 0, -0.19, 0.062));
  // forearm
  const rArm = box(0.085, 0.085, 0.28, new THREE.MeshStandardMaterial({ color: 0x3a3d33, roughness: 0.9 }), 0.035, -0.24, 0.20);
  rArm.rotation.x = 0.55;
  rightHand.add(rArm);
  group.add(rightHand);

  const leftHand = new THREE.Group();
  leftHand.add(box(0.10, 0.07, 0.13, glove, 0, -0.045, -0.55));
  leftHand.add(box(0.10, 0.055, 0.05, glovePad, 0, -0.085, -0.53));
  const lThumb = box(0.032, 0.03, 0.08, glove, -0.055, -0.035, -0.55);
  lThumb.rotation.z = 0.2;
  leftHand.add(lThumb);
  const lArm = box(0.08, 0.08, 0.30, new THREE.MeshStandardMaterial({ color: 0x3a3d33, roughness: 0.9 }), -0.055, -0.13, -0.36);
  lArm.rotation.x = -0.6;
  leftHand.add(lArm);
  group.add(leftHand);

  // muzzle anchor + flash
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.012, -0.985);
  group.add(muzzle);

  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: muzzleTexture(), color: 0xffd9a0, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0,
  }));
  flash.scale.set(0.58, 0.58, 1);
  flash.position.copy(muzzle.position);
  flash.renderOrder = 20;
  group.add(flash);

  const flashLight = new THREE.PointLight(0xffa24a, 0, 7, 2);
  flashLight.position.copy(muzzle.position);
  group.add(flashLight);

  // ejection port anchor
  const ejectPort = new THREE.Object3D();
  ejectPort.position.set(0.06, 0.03, -0.2);
  group.add(ejectPort);

  group.position.set(0.20, -0.165, -0.47);
group.scale.setScalar(0.56);
  group.rotation.set(0, 0.035, -0.015);

  // viewmodel-specific lighting so it reads in shadow
  const vmL = new THREE.PointLight(0xffd2a0, 0.9, 2.6, 2);
  vmL.position.set(0.5, 0.6, 0.2);
  group.add(vmL);

  return { group, muzzle, ejectPort, flash, flashLight, sightHeight: 0.148 };
}

export function createEnemyRifle() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x1d1f21, roughness: 0.42, metalness: 0.65 });
  const body = new THREE.MeshStandardMaterial({ color: 0x2c2b26, roughness: 0.7, metalness: 0.2 });
  g.add(box(0.055, 0.075, 0.36, body, 0, 0, -0.1));
  g.add(cylinder(0.011, 0.011, 0.34, metal, 0, 0.008, -0.45, 8));
  g.add(box(0.045, 0.11, 0.07, metal, 0, -0.09, -0.07));
  g.add(box(0.04, 0.07, 0.13, body, 0, -0.005, 0.14));
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.008, -0.63);
  g.add(muzzle);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: muzzleTexture(), color: 0xffc070, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
  }));
  flash.scale.set(0.5, 0.5, 1);
  flash.position.copy(muzzle.position);
  g.add(flash);
  return { group: g, muzzle, flash };
}

export const muzzleFlashTexture = muzzleTexture;
