import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Procedural textures — no external assets, instant load
 * ------------------------------------------------------------------ */
function canvasTexture(size, draw, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  return tex;
}

function rand(a, b) { return a + Math.random() * (b - a); }

function asphaltTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#33363c'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const v = Math.floor(rand(32, 96));
      ctx.fillStyle = `rgba(${v},${v},${v + 3},${rand(0.15, 0.7)})`;
      const r = rand(0.4, 2.1);
      ctx.fillRect(rand(0, s), rand(0, s), r, r);
    }
    // cracks
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let x = rand(0, s), y = rand(0, s);
      ctx.moveTo(x, y);
      for (let j = 0; j < 9; j++) {
        x += rand(-26, 26); y += rand(-26, 26);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(9,10,12,${rand(0.3, 0.7)})`;
      ctx.lineWidth = rand(0.7, 2.2); ctx.stroke();
    }
    // oil patches
    for (let i = 0; i < 5; i++) {
      const x = rand(0, s), y = rand(0, s), r = rand(26, 80);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(5,6,8,0.5)'); g.addColorStop(1, 'rgba(5,6,8,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }, 18, 18);
}

function concreteTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#8b877c'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) {
      const v = Math.floor(rand(95, 160));
      ctx.fillStyle = `rgba(${v},${v - 2},${v - 7},${rand(0.06, 0.32)})`;
      ctx.fillRect(rand(0, s), rand(0, s), rand(1, 4), rand(1, 4));
    }
    // grime running down
    for (let i = 0; i < 26; i++) {
      const x = rand(0, s), w = rand(2, 14), h = rand(40, 220);
      const g = ctx.createLinearGradient(0, rand(0, s * 0.4), 0, 0 + h);
      g.addColorStop(0, 'rgba(30,28,24,0.22)'); g.addColorStop(1, 'rgba(30,28,24,0)');
      ctx.fillStyle = g; ctx.fillRect(x, rand(0, s * 0.5), w, h);
    }
    // panel seams
    ctx.strokeStyle = 'rgba(35,33,29,0.55)'; ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * s / 3, 0); ctx.lineTo(i * s / 3, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s / 3); ctx.lineTo(s, i * s / 3); ctx.stroke();
    }
    // chipped edges
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(180,175,160,${rand(0.05, 0.18)})`;
      ctx.beginPath(); ctx.arc(rand(0, s), rand(0, s), rand(1, 6), 0, Math.PI * 2); ctx.fill();
    }
  }, 2, 2);
}

function corrugatedTexture(base, rust = '#6d3822') {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 16) {
      const g = ctx.createLinearGradient(x, 0, x + 16, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.30)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.02)');
      g.addColorStop(1, 'rgba(0,0,0,0.34)');
      ctx.fillStyle = g; ctx.fillRect(x, 0, 16, s);
    }
    for (let i = 0; i < 55; i++) {
      const x = rand(0, s), y = rand(0, s), r = rand(4, 32);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rust); g.addColorStop(1, 'rgba(70,35,20,0)');
      ctx.globalAlpha = rand(0.12, 0.45); ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(20,18,15,${rand(0.1, 0.35)})`;
      ctx.fillRect(rand(0, s), rand(0, s), rand(1, 3), rand(10, 90));
    }
  }, 1, 1);
}

function crateTexture() {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#6b5236'; ctx.fillRect(0, 0, s, s);
    const pw = s / 5;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(${Math.floor(rand(95, 125))},${Math.floor(rand(70, 95))},${Math.floor(rand(42, 60))},0.75)`;
      ctx.fillRect(0, i * pw + 2, s, pw - 4);
      ctx.fillStyle = 'rgba(30,20,12,0.5)';
      ctx.fillRect(0, i * pw, s, 2);
    }
    // diagonal brace
    ctx.strokeStyle = 'rgba(45,32,20,0.6)'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(4, s - 4); ctx.lineTo(s - 4, 4); ctx.stroke();
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(30,22,14,${rand(0.05, 0.25)})`;
      ctx.fillRect(rand(0, s), rand(0, s), rand(1, 3), rand(1, 9));
    }
    ctx.strokeStyle = 'rgba(25,18,10,0.55)'; ctx.lineWidth = 5; ctx.strokeRect(2, 2, s - 4, s - 4);
  }, 1, 1);
}

function windowTexture() {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#080b10'; ctx.fillRect(0, 0, s, s);
    const cols = 10, rows = 16;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.random() < 0.36) {
          const warm = Math.random() < 0.74;
          ctx.fillStyle = warm
            ? `rgba(255,${Math.floor(rand(150, 205))},${Math.floor(rand(70, 130))},${rand(0.5, 1)})`
            : `rgba(${Math.floor(rand(120, 180))},${Math.floor(rand(200, 240))},255,${rand(0.3, 0.8)})`;
          ctx.fillRect(x * (s / cols) + 4, y * (s / rows) + 4, s / cols - 8, s / rows - 9);
        }
      }
    }
  }, 1, 1);
}

/* ------------------------------------------------------------------ */

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = [];
  const solidMeshes = [];
  const animated = [];

  const asphalt = asphaltTexture();
  const concrete = concreteTexture();
  const crateTex = crateTexture();
  const windows = windowTexture();

  // materials
  const groundMat = new THREE.MeshStandardMaterial({ map: asphalt, color: 0xd2d3d5, roughness: 0.9, metalness: 0.06 });
  const wallMat = new THREE.MeshStandardMaterial({ map: concrete, color: 0xc9c2b3, roughness: 0.88, metalness: 0.03 });
  const darkWallMat = new THREE.MeshStandardMaterial({ map: concrete, color: 0x8d887d, roughness: 0.92 });
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, color: 0xe0c08b, roughness: 0.84, metalness: 0.03 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x3d4a42, roughness: 0.55, metalness: 0.65 });
  const rustyMat = new THREE.MeshStandardMaterial({ color: 0x7a3a21, roughness: 0.72, metalness: 0.45 });
  const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf0a02a, emissive: 0xf0a02a, emissiveIntensity: 0.55, roughness: 0.45 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.4, metalness: 0.85 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.5, metalness: 0.8 });

  const addSolid = (mesh) => {
    mesh.userData.solid = true;
    solidMeshes.push(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  const addCollider = (x, z, sx, sz, rot = 0, y = 0, sy = 3) => {
    const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot));
    const ex = (sx * c + sz * s) / 2;
    const ez = (sx * s + sz * c) / 2;
    colliders.push({
      min: new THREE.Vector3(x - ex, y, z - ez),
      max: new THREE.Vector3(x + ex, y + sy, z + ez),
    });
  };

  /* ---------------- ground ---------------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(170, 170, 1, 1), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.userData.solid = true;
  solidMeshes.push(ground);
  group.add(ground);

  // concrete apron near spawn
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(26, 70), new THREE.MeshStandardMaterial({ color: 0x5a5852, roughness: 0.95 }));
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.012, 18); apron.receiveShadow = true;
  group.add(apron);

  // hazard lane stripes
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xb48a2e, transparent: true, opacity: 0.12 });
  for (const x of [-13.5, -8.1, 8.1, 13.5]) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 58), stripeMat);
    stripe.rotation.x = -Math.PI / 2; stripe.position.set(x, 0.02, 20);
    group.add(stripe);
  }

  /* ---------------- perimeter ---------------- */
  const wallH = 7, wallT = 1.2, half = 48;
  const walls = [
    [0, wallH / 2, -half, 2 * half + wallT, wallH, wallT],
    [0, wallH / 2, half, 2 * half + wallT, wallH, wallT],
    [-half, wallH / 2, 0, wallT, wallH, 2 * half],
    [half, wallH / 2, 0, wallT, wallH, 2 * half],
  ];
  for (const [x, y, z, sx, sy, sz] of walls) {
    const m = addSolid(new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat));
    m.position.set(x, y, z);
    addCollider(x, z, sx, sz, 0, 0, sy);
  }
  // wall cap trim
  for (const [x, y, z, sx, sy, sz] of walls) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.15, 0.22, sz + 0.15), darkMetal);
    trim.position.set(x, sy + 0.1, z);
    group.add(trim);
  }

  /* ---------------- containers ---------------- */
  const containerSpecs = [
    { x: -17, z: 4, w: 3, h: 2.7, d: 8, rot: 0.10, color: 0x2d5866, tex: '#2b5563' },
    { x: 16, z: -6, w: 3, h: 2.7, d: 8, rot: -0.34, color: 0x7d3b2c, tex: '#76392b' },
    { x: -5, z: -26, w: 8, h: 2.7, d: 3, rot: 0.02, color: 0x3f5637, tex: '#3e5237' },
    { x: 25, z: 17, w: 3, h: 2.7, d: 8, rot: 0.52, color: 0x8a6627, tex: '#856329' },
    { x: 31, z: -30, w: 7, h: 2.7, d: 3, rot: -0.08, color: 0x4d4f60, tex: '#4a4c5c' },
  ];
  for (const c of containerSpecs) {
    const tex = corrugatedTexture(c.tex);
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: c.color, roughness: 0.62, metalness: 0.5 });
    const mesh = addSolid(new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), mat));
    mesh.position.set(c.x, c.h / 2 + 0.01, c.z);
    mesh.rotation.y = c.rot;
    addCollider(c.x, c.z, c.w, c.d, c.rot, 0, c.h);
    // door end caps
    const capMat = new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.7, metalness: 0.48 });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(c.w + 0.08, c.h - 0.12, 0.12), capMat);
    cap.position.set(0, 0, c.d / 2 + 0.02);
    cap.castShadow = true;
    mesh.add(cap);
    // corner posts
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, c.h, 0.13), darkMetal);
      post.position.set(sx * (c.w / 2 - 0.03), 0, sz * (c.d / 2 - 0.03));
      post.castShadow = true;
      mesh.add(post);
    }
  }

  // stacked container highlight
  const stackTex = corrugatedTexture('#4b3f57');
  const stackMat = new THREE.MeshStandardMaterial({ map: stackTex, color: 0x4b3f57, roughness: 0.6, metalness: 0.5 });
  const stacked = addSolid(new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.7, 3), stackMat));
  stacked.position.set(-17, 4.06, 4); stacked.rotation.y = 0.10;
  addCollider(-17, 4, 6.2, 3, 0.10, 2.71, 2.7);
  // supports
  for (const sx of [-2.6, 2.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.7, 0.2), darkMetal);
    leg.position.set(sx, -1.35, 0); stacked.add(leg);
  }

  /* ---------------- crates ---------------- */
  const cratePositions = [
    [-23, 15, 1.2], [-24.3, 15.9, 1.2], [-22.4, 16.4, 0.85], [-23.2, 15.6, 2.5],
    [9, 15, 1.2], [10.3, 15.2, 1.2], [9.6, 15.1, 2.45],
    [21, -24, 1.2], [22.3, -24.3, 1.2], [21.6, -23.6, 2.45], [20.2, -25.2, 0.8],
    [-4, -14, 1.2], [-5.2, -14.6, 1.0],
    [35, 4, 1.2], [34, 5.2, 1.1],
  ];
  for (const [x, z, y] of cratePositions) {
    const s = rand(1.05, 1.35);
    const mesh = addSolid(new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crateMat));
    mesh.rotation.y = rand(-0.4, 0.4);
    // y > 1.5 marks a stacked crate sitting on the one below
    mesh.position.set(x, y > 1.5 ? 1.2 + s / 2 : s / 2, z);
    addCollider(x, z, s + 0.1, s + 0.1, 0, 0, y > 1.5 ? 2.4 : 1.3);
  }

  /* ---------------- jersey barriers ---------------- */
  const barrierShape = new THREE.Shape();
  barrierShape.moveTo(-0.48, 0); barrierShape.lineTo(0.48, 0);
  barrierShape.lineTo(0.36, 0.86); barrierShape.lineTo(-0.36, 0.86); barrierShape.closePath();
  const barrierGeo = new THREE.ExtrudeGeometry(barrierShape, { depth: 2.8, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045, bevelSegments: 1 });
  barrierGeo.translate(0, 0, -1.4);
  const barrierSpecs = [
    [-2, 5, 0.15], [3.4, 1.2, 1.42], [-5, -3, 0.5], [12, 8, -0.3],
    [-12, -14, 1.1], [8, -18, 0.1], [26, -8, 1.5], [-27, -2, 0.3],
  ];
  for (const [x, z, rot] of barrierSpecs) {
    const m = addSolid(new THREE.Mesh(barrierGeo, wallMat));
    m.position.set(x, 0, z); m.rotation.y = rot;
    addCollider(x, z, 1.0, 2.9, rot, 0, 0.9);
  }

  /* ---------------- barrels ---------------- */
  const barrelGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 14);
  const barrelSpots = [];
  const clusters = [[-27, -9, 4], [7, -21, 3], [29, 6, 2], [-30, 24, 3], [14, 27, 2]];
  for (const [cx, cz, n] of clusters) {
    for (let i = 0; i < n; i++) {
      const x = cx + rand(-1.1, 1.1), z = cz + rand(-1.1, 1.1);
      barrelSpots.push([x, z, Math.random() < 0.3]);
    }
  }
  for (const [x, z, burning] of barrelSpots) {
    const m = addSolid(new THREE.Mesh(barrelGeo, burning ? rustyMat : barrelMat));
    m.position.set(x, 0.55, z);
    m.rotation.y = rand(0, Math.PI);
    addCollider(x, z, 0.9, 0.9, 0, 0, 1.1);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 5, 16), metalMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; m.add(ring);
    const ring2 = ring.clone(); ring2.position.y = -0.25; m.add(ring2);
    if (burning) {
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), new THREE.MeshBasicMaterial({ color: 0xff7b22, transparent: true, opacity: 0.9 }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.56; m.add(glow);
    }
  }

  /* ---------------- burning barrel centrepiece ---------------- */
  const brazier = new THREE.Mesh(barrelGeo, rustyMat);
  brazier.position.set(-3.5, 0.55, -7.5);
  brazier.castShadow = true; brazier.receiveShadow = true; group.add(brazier);
  addCollider(-3.5, -7.5, 0.9, 0.9, 0, 0, 1.1);
  const fireLight = new THREE.PointLight(0xff7a2a, 85, 26, 2);
  fireLight.position.set(-3.5, 1.65, -7.5); group.add(fireLight);
  const fireGlow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18), new THREE.MeshBasicMaterial({ color: 0xffa23a, transparent: true, opacity: 0.92 }));
  fireGlow.rotation.x = -Math.PI / 2; fireGlow.position.set(-3.5, 1.12, -7.5); group.add(fireGlow);
  // flame sprites
  const flames = [];
  const flameTex = canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s * 0.62, 2, s / 2, s * 0.62, s * 0.48);
    g.addColorStop(0, 'rgba(255,245,190,1)'); g.addColorStop(0.32, 'rgba(255,170,50,0.95)');
    g.addColorStop(0.7, 'rgba(220,70,15,0.5)'); g.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  });
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.SpriteMaterial({ map: flameTex, color: i === 0 ? 0xffe6a0 : 0xff8a30, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.position.set(-3.5 + rand(-0.12, 0.12), 1.5, -7.5 + rand(-0.12, 0.12));
    sp.scale.set(1.1, 2.0, 1);
    sp.userData.phase = rand(0, 10);
    group.add(sp); flames.push(sp);
  }
  animated.push((t) => {
    fireLight.intensity = 76 + Math.sin(t * 11) * 12 + Math.sin(t * 27.3) * 8 + Math.random() * 7;
    fireGlow.scale.setScalar(1 + Math.sin(t * 9) * 0.07);
    for (const sp of flames) {
      const p = sp.userData.phase;
      sp.scale.x = 1.0 + Math.sin(t * 7 + p) * 0.2;
      sp.scale.y = 1.8 + Math.sin(t * 9.5 + p) * 0.35;
      sp.position.x = -3.5 + Math.sin(t * 3.1 + p) * 0.08;
      sp.material.opacity = 0.62 + Math.sin(t * 13 + p) * 0.22;
    }
  });

  /* ---------------- lamp posts ---------------- */
  const lampPositions = [[-34, 32], [34, 32], [-34, -30], [34, -30]];
  const lampLights = [];
  for (const [x, z] of lampPositions) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 7, 8), metalMat);
    pole.position.set(x, 3.5, z); pole.castShadow = true; group.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), metalMat);
    arm.position.set(x + (x < 0 ? 0.55 : -0.55), 6.95, z); group.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.3), darkMetal);
    head.position.set(x + (x < 0 ? 1.1 : -1.1), 6.88, z); group.add(head);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.22), new THREE.MeshBasicMaterial({ color: 0xffd28a }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(x + (x < 0 ? 1.1 : -1.1), 6.77, z); group.add(lens);
    addCollider(x, z, 0.5, 0.5, 0, 0, 7);
    const light = new THREE.PointLight(0xffb765, 95, 30, 2);
    light.position.set(x + (x < 0 ? 1.1 : -1.1), 6.4, z);
    group.add(light);
    lampLights.push(light);
  }
  animated.push((t) => {
    for (let i = 0; i < lampLights.length; i++) {
      lampLights[i].intensity = 88 + Math.sin(t * 2.3 + i * 2) * 7;
    }
  });

  /* ---------------- watchtower ---------------- */
  const tower = new THREE.Group();
  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 5.2, 4.4), darkWallMat);
  towerBase.position.y = 2.6; towerBase.castShadow = true; towerBase.receiveShadow = true; tower.add(towerBase);
  const towerTop = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.35, 5.4), wallMat);
  towerTop.position.y = 5.35; towerTop.castShadow = true; tower.add(towerTop);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), metalMat);
    post.position.set(sx * 2.45, 6.6, sz * 2.45); tower.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 5.6), darkMetal);
  roof.position.y = 7.75; roof.castShadow = true; tower.add(roof);
  tower.position.set(33, 0, -33); group.add(tower);
  addCollider(33, -33, 5.4, 5.4, 0, 0, 8);
  solidMeshes.push(towerBase, towerTop);
  towerBase.userData.solid = true; towerTop.userData.solid = true;

  // red aircraft beacon
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2211 });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), beaconMat);
  beacon.position.set(33, 8.0, -33); group.add(beacon);
  animated.push((t) => {
    const on = Math.sin(t * 3.2) > 0.2;
    beaconMat.color.setHex(on ? 0xff2211 : 0x330604);
    beacon.scale.setScalar(on ? 1.3 : 0.9);
  });

  /* ---------------- distant city ---------------- */
  const cityMat = new THREE.MeshStandardMaterial({
    map: windows, emissiveMap: windows, emissive: 0xffb066, emissiveIntensity: 1.2,
    color: 0x171b22, roughness: 0.92, metalness: 0.05,
  });
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + rand(-0.05, 0.05);
    const r = rand(72, 118);
    const w = rand(6, 17), d = rand(6, 15), h = rand(9, 38);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cityMat);
    b.position.set(Math.cos(a) * r, h / 2 - 0.5, Math.sin(a) * r);
    b.rotation.y = rand(0, Math.PI);
    group.add(b);
  }
  // ground haze ring
  const haze = new THREE.Mesh(
    new THREE.RingGeometry(55, 150, 48),
    new THREE.MeshBasicMaterial({ color: 0x2a1d18, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  );
  haze.rotation.x = -Math.PI / 2; haze.position.y = 0.03; group.add(haze);

  /* ---------------- rubble ---------------- */
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3c3a36, roughness: 0.97 });
  for (let i = 0; i < 46; i++) {
    const a = rand(0, Math.PI * 2), r = rand(22, 46);
    const size = rand(0.12, 0.6);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat);
    rock.position.set(Math.cos(a) * r, size * 0.35, Math.sin(a) * r);
    rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    rock.castShadow = true; rock.receiveShadow = true;
    group.add(rock);
  }

  /* ---------------- sky ---------------- */
  const sunDir = new THREE.Vector3(-0.62, 0.19, -0.76).normalize();
  const skyGeo = new THREE.SphereGeometry(260, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x0a1024) },
      midColor: { value: new THREE.Color(0x34405e) },
      horizonColor: { value: new THREE.Color(0xd86831) },
      groundColor: { value: new THREE.Color(0x191612) },
      sunDir: { value: sunDir },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 topColor, midColor, horizonColor, groundColor, sunDir;
      void main() {
        float h = vDir.y;
        vec3 col = mix(horizonColor, midColor, smoothstep(-0.01, 0.24, h));
        col = mix(col, topColor, smoothstep(0.18, 0.7, h));
        col = mix(groundColor, col, smoothstep(-0.16, 0.005, h));
        float sun = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        col += vec3(1.0, 0.52, 0.2) * pow(sun, 22.0) * 0.65;
        col += vec3(1.0, 0.7, 0.38) * pow(sun, 4.0) * 0.10;
        // subtle banding break
        float dither = fract(sin(dot(vDir.xy, vec2(12.9898, 78.233))) * 43758.5453);
        col += (dither - 0.5) * 0.008;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // sun sprite
  const sunTex = canvasTexture(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,248,220,1)');
    g.addColorStop(0.1, 'rgba(255,220,150,0.95)');
    g.addColorStop(0.4, 'rgba(255,150,70,0.35)');
    g.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  sun.position.copy(sunDir).multiplyScalar(235); sun.scale.setScalar(58);
  scene.add(sun);

  // stars
  const starPos = [];
  for (let i = 0; i < 520; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(245);
    if (v.y > 8) starPos.push(v.x, v.y, v.z);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbfd6ff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
  scene.add(stars);

  /* ---------------- lighting ---------------- */
  const hemi = new THREE.HemisphereLight(0x6d84b2, 0x3b2a1d, 1.55);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xffb87a, 3.25);
  sunLight.position.copy(sunDir).multiplyScalar(70);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -52;
  sunLight.shadow.camera.right = 52;
  sunLight.shadow.camera.top = 52;
  sunLight.shadow.camera.bottom = -52;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 170;
  sunLight.shadow.bias = -0.0006;
  sunLight.shadow.normalBias = 0.02;
  sunLight.target.position.set(0, 0, 0);
  scene.add(sunLight, sunLight.target);

  const rim = new THREE.DirectionalLight(0x7d9cff, 1.15);
  rim.position.set(40, 24, 30);
  scene.add(rim);

  // soft frontal fill from the player side keeps silhouettes readable
  const fill = new THREE.DirectionalLight(0x9db8e8, 0.62);
  fill.position.set(6, 15, 42);
  fill.target.position.set(0, 1, 0);
  scene.add(fill, fill.target);

  const ambient = new THREE.AmbientLight(0x4a5262, 0.85);
  scene.add(ambient);

  scene.fog = new THREE.FogExp2(0x352724, 0.0085);

  /* ---------------- dust motes ---------------- */
  const dustCount = 800;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = rand(-52, 52);
    dustPos[i * 3 + 1] = rand(0.2, 12);
    dustPos[i * 3 + 2] = rand(-52, 52);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xffd2a0, size: 0.055, transparent: true, opacity: 0.42,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  group.add(dust);
  animated.push((t) => {
    dust.rotation.y = t * 0.006;
    dust.position.y = Math.sin(t * 0.22) * 0.5;
  });

  /* ---------------- spawn points ---------------- */
  const spawnPoints = [
    new THREE.Vector3(-40, 0, -39), new THREE.Vector3(40, 0, -40),
    new THREE.Vector3(-42, 0, -8), new THREE.Vector3(42, 0, 4),
    new THREE.Vector3(-27, 0, -21), new THREE.Vector3(30, 0, -20),
    new THREE.Vector3(-38, 0, 32), new THREE.Vector3(38, 0, 35),
    new THREE.Vector3(-11, 0, -42), new THREE.Vector3(16, 0, -41),
    new THREE.Vector3(0, 0, -43), new THREE.Vector3(-33, 0, 12),
  ];

  // muzzle flashes for ambient reflections on props
  const clockStart = performance.now();
  const update = (dt, time) => {
    for (const fn of animated) fn(time);
    // gentle dust vertical drift
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3 + 1] += dt * (0.06 + (i % 7) * 0.012);
      if (arr[i * 3 + 1] > 13) arr[i * 3 + 1] = 0.2;
      arr[i * 3] += Math.sin(time * 0.5 + i) * dt * 0.03;
    }
    dustGeo.attributes.position.needsUpdate = true;
  };

  return {
    group, colliders, solidMeshes, spawnPoints, sunDir, update,
    sunLight, sky, fireLight,
  };
}
