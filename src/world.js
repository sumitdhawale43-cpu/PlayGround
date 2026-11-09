import * as THREE from 'three';
import { createNpc, createEnemyMesh, createBossMesh, createTorii, createLantern, createCrystal, createChest, createCrystalWaypoint, BOSS_DEFS } from './models.js';

const mat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness });
const regions = [
  { name: 'AETHERIA', sub: 'The Kingdom of Dawn', color: 0x83a96e, ground: 0x526d49, x: 0, z: 0 },
  { name: 'SAKURA', sub: 'Where petals remember', color: 0xc98eab, ground: 0x765264, x: -300, z: -130 },
  { name: 'EMBER', sub: 'The sunken firelands', color: 0xc78953, ground: 0x806044, x: 320, z: -150 },
  { name: 'FROSTFALL', sub: 'A kingdom held in stillness', color: 0x86b9cc, ground: 0x627d85, x: -145, z: 320 },
  { name: 'ABYSS', sub: 'Beyond the edge of starlight', color: 0x846bb0, ground: 0x423e60, x: 25, z: 410 }
];

export function createWorld(scene) {
  scene.background = new THREE.Color(0x9cb6cf);
  scene.fog = new THREE.FogExp2(0x9cb6cf, 0.00165);
  const hemi = new THREE.HemisphereLight(0xc9e6ff, 0x303341, 1.65); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdfb1, 2.8); sun.position.set(-80, 140, 70); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -100; sun.shadow.camera.right = 100; sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100; sun.shadow.bias = -0.0004; scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fc8ff, 0.65); fill.position.set(80, 45, -90); scene.add(fill);
  const world = new THREE.Group(); scene.add(world);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100), mat(0x526d49)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  const pathMat = mat(0x8c795d), stoneMat = mat(0x9da4a5), waterMat = new THREE.MeshStandardMaterial({ color: 0x487a88, roughness: 0.25, metalness: 0.1 });
  // Old road linking the village, shrine, and distant territories.
  const road = new THREE.Mesh(new THREE.PlaneGeometry(11, 360), pathMat); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.012, -122); world.add(road);
  const crossroad = new THREE.Mesh(new THREE.PlaneGeometry(250, 8), pathMat); crossroad.rotation.x = -Math.PI / 2; crossroad.position.set(0, 0.014, -122); world.add(crossroad);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(18, 1100), waterMat); river.rotation.x = -Math.PI / 2; river.rotation.z = 0.08; river.position.set(72, -0.08, 0); world.add(river);
  const props = [], npcs = [], enemies = [], collectibles = [], bosses = [];
  const addProp = (o, x, z, y = 0, rot = 0) => { o.position.set(x, y, z); o.rotation.y = rot; world.add(o); props.push(o); return o; };
  // Village plaza and shrine.
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(15, 48), stoneMat); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.025, 0); world.add(plaza);
  addProp(createTorii(1.25), 0, -13);
  const waypoint = addProp(createCrystalWaypoint(), 0, 0);
  collectibles.push({ kind: 'waypoint', mesh: waypoint, x: 0, z: 0, active: true, label: 'Aetheria Waypoint' });
  for (const [x, z] of [[-10,-9],[10,-9],[-10,9],[10,9],[-18,-20],[18,-20]]) addProp(createLantern(2), x, z);
  const elderMesh = createNpc(1, 1.15); addProp(elderMesh.root || elderMesh, -4, -5, 0, 0.4);
  npcs.push({ id: 'elder', name: 'ELDER ELARA', role: 'KEEPER OF AETHERIA', mesh: elderMesh.root || elderMesh, x: -4, z: -5, kind: 'elder' });
  const merchantMesh = createNpc(3, 1.05); addProp(merchantMesh.root || merchantMesh, 5, -4, 0, -0.6);
  npcs.push({ id: 'merchant', name: 'TRAVELING MERCHANT', role: 'WAYFARER', mesh: merchantMesh.root || merchantMesh, x: 5, z: -4, kind: 'merchant' });
  const chest = addProp(createChest(true), 7, 5, 0, -0.3);
  collectibles.push({ kind: 'chest', mesh: chest, x: 7, z: 5, active: true, label: 'Wayfarer’s Cache' });
  // Forest clusters: stylized trunks, layered canopies, rocks, flowers and luminous crystals.
  const trunkMat = mat(0x59483c), leafMats = [mat(0x41694d), mat(0x507b57), mat(0x64865a)], rockMat = mat(0x69746d);
  const treeGeo = new THREE.ConeGeometry(1, 1, 7), trunkGeo = new THREE.CylinderGeometry(0.16, 0.23, 1, 7), rockGeo = new THREE.DodecahedronGeometry(1, 0);
  let seed = 19371; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const forbidden = (x, z) => (Math.hypot(x, z) < 27) || (Math.abs(x) < 14 && z < -20 && z > -220);
  for (let i = 0; i < 245; i++) {
    const x = (random() - 0.5) * 280, z = (random() - 0.5) * 300;
    if (forbidden(x, z) || Math.hypot(x - 138, z + 78) < 35 || Math.abs(x - 72) < 15) continue;
    if (random() < 0.72) {
      const h = 2.8 + random() * 3.8, trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.position.set(x, h * 0.28, z); trunk.scale.setScalar(1); trunk.scale.y = h * 0.55; trunk.castShadow = true; world.add(trunk);
      for (let layer = 0; layer < 3; layer++) { const crown = new THREE.Mesh(treeGeo, leafMats[Math.floor(random() * leafMats.length)]); crown.position.set(x, h * (0.46 + layer * 0.19), z); crown.scale.set(1.15 + random() * 0.65, 1.5 + random() * 0.55, 1.15 + random() * 0.65); crown.castShadow = true; world.add(crown); }
    } else { const rock = new THREE.Mesh(rockGeo, rockMat); rock.position.set(x, 0.45, z); rock.scale.set(0.5 + random(), 0.35 + random() * 0.65, 0.5 + random()); rock.rotation.set(random(), random(), random()); rock.castShadow = true; world.add(rock); }
  }
  for (let i = 0; i < 34; i++) {
    const x = (random() - 0.5) * 200, z = -18 - random() * 245;
    if (Math.abs(x) < 16) continue;
    const crystal = addProp(createCrystal(i % 2 ? 0x70d9ff : 0xb18cff, 1.2 + random()), x, z);
    collectibles.push({ kind: 'shard', mesh: crystal, x, z, active: true, label: 'Starshard' });
  }
  // Enemy patrols with safe space around the starting village.
  const spawns = [
    ['soldier', 26, -30], ['raider', -27, -42], ['wisp', 37, -67], ['archer', -34, -92], ['brute', 32, -122], ['soldier', -38, -146], ['elite', 55, -176], ['wisp', -50, -190],
    ['raider', 96, -50], ['soldier', 102, -104], ['archer', 116, -145], ['brute', -76, -73], ['elite', -92, -126]
  ];
  for (const [type, x, z] of spawns) {
    const meshRig = createEnemyMesh(type, type === 'brute' ? 1.2 : 1);
    const mesh = meshRig.root; mesh.position.set(x, 0, z); world.add(mesh);
    enemies.push({ type, rig: meshRig, mesh, x, z, hp: type === 'elite' ? 130 : type === 'brute' ? 100 : type === 'wisp' ? 55 : 68, maxHp: type === 'elite' ? 130 : type === 'brute' ? 100 : type === 'wisp' ? 55 : 68, attack: type === 'elite' ? 16 : type === 'brute' ? 13 : 9, radius: type === 'brute' ? 1.15 : 0.75, aggro: 16, cooldown: 0, hitFlash: 0, dead: false, homeX: x, homeZ: z });
  }
  // First guardian sits beyond the forest, visibly framed by a ring of ancient stones.
  const bossDef = BOSS_DEFS.warden;
  const bossRig = createBossMesh('warden'); const bossMesh = bossRig.root; bossMesh.position.set(...bossDef.pos); world.add(bossMesh);
  const arena = new THREE.Mesh(new THREE.RingGeometry(16, 18, 48), new THREE.MeshBasicMaterial({ color: 0x7affbb, transparent: true, opacity: 0.22, side: THREE.DoubleSide })); arena.rotation.x = -Math.PI / 2; arena.position.set(bossDef.pos[0], 0.04, bossDef.pos[2]); world.add(arena);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 2.5 + (i % 3), 6), mat(0x536d57)); stone.position.set(bossDef.pos[0] + Math.cos(a) * 19, 1.2, bossDef.pos[2] + Math.sin(a) * 19); stone.castShadow = true; world.add(stone); }
  bosses.push({ id: 'warden', def: bossDef, rig: bossRig, mesh: bossMesh, x: bossDef.pos[0], z: bossDef.pos[2], hp: bossDef.hp, maxHp: bossDef.hp, radius: bossDef.radius, attack: 23, cooldown: 0, hitFlash: 0, active: false, defeated: false, phase: 1 });
  // A few unmistakable distant biomes establish the larger open world without costly geometry.
  const hills = mat(0x53614d);
  for (const [cx, cz, color] of [[-300,-130,0x765264],[320,-150,0x806044],[-145,320,0x627d85],[25,410,0x423e60]]) {
    const ridgeMat = mat(color);
    for (let i = 0; i < 13; i++) { const a = i / 13 * Math.PI * 2; const mountain = new THREE.Mesh(new THREE.ConeGeometry(30 + (i % 4) * 8, 35 + (i % 5) * 9, 7), ridgeMat); mountain.position.set(cx + Math.cos(a) * 66, 12, cz + Math.sin(a) * 66); mountain.castShadow = true; world.add(mountain); }
  }
  return { world, ground, npcs, enemies, bosses, collectibles, props, regions, sun, random, getRegion(x, z) {
    let nearest = regions[0], d = Infinity;
    for (const r of regions) { const dd = Math.hypot(x - r.x, z - r.z); if (dd < d) { d = dd; nearest = r; } }
    return nearest;
  }};
}
