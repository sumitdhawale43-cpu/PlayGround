import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
function gradient() {
  const data = new Uint8Array([70, 70, 70, 255, 135, 135, 135, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}
const GRAD = gradient();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...extra });
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(190,120,255,.5)'); g.addColorStop(1, 'rgba(190,120,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTexture();

/* ------------------------------------------------------------------ */
/* models                                                              */
/* ------------------------------------------------------------------ */
function makeMossling() {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);
  const bodyMat = toon(0x6ab04c, { flatShading: true });
  const bodyDark = toon(0x3f7f42, { flatShading: true });
  const body = mesh(new THREE.IcosahedronGeometry(0.62, 1), bodyMat);
  body.scale.set(1, 0.92, 0.95); body.position.y = 0.62; bodyGroup.add(body);
  const belly = mesh(new THREE.IcosahedronGeometry(0.42, 1), toon(0x9bd06b, { flatShading: true }));
  belly.scale.set(0.8, 0.7, 0.5); belly.position.set(0, 0.52, 0.36); bodyGroup.add(belly);
  // leaf crown
  for (let i = 0; i < 5; i++) {
    const leaf = mesh(new THREE.ConeGeometry(0.13, 0.55, 4), i % 2 ? toon(0x7fc95a) : toon(0x4f9a48));
    const a = i / 5 * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.26, 1.1, Math.sin(a) * 0.26);
    leaf.rotation.z = Math.cos(a) * 0.5; leaf.rotation.x = -Math.sin(a) * 0.5;
    bodyGroup.add(leaf);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.35, 4), toon(0x3f7f42));
  stem.position.y = 1.2; bodyGroup.add(stem);
  // eyes
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.1, 8, 6), basic(0xfff6dc));
    eye.scale.set(0.9, 1.15, 0.55); eye.position.set(sx * 0.18, 0.72, 0.52); bodyGroup.add(eye);
    const pupil = mesh(new THREE.SphereGeometry(0.048, 7, 5), basic(0x172033));
    pupil.position.set(sx * 0.18, 0.72, 0.6); bodyGroup.add(pupil);
  }
  const mouth = mesh(new THREE.BoxGeometry(0.16, 0.035, 0.03), basic(0x1e3a25));
  mouth.position.set(0, 0.52, 0.59); bodyGroup.add(mouth);
  // feet
  for (const sx of [-1, 1]) {
    const foot = mesh(new THREE.SphereGeometry(0.16, 6, 5), bodyDark);
    foot.scale.set(1.1, 0.5, 1.3); foot.position.set(sx * 0.25, 0.08, 0.05); bodyGroup.add(foot);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: 0x071410, transparent: true, opacity: 0.25, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.015; group.add(shadow);
  return { group, body: bodyGroup, height: 1.35, radius: 0.55 };
}

function makeShade() {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group(); bodyGroup.position.y = 0.65; group.add(bodyGroup);
  const dark = toon(0x251a3d, { flatShading: true });
  const dark2 = toon(0x3b2860, { flatShading: true });
  const cloak = mesh(new THREE.ConeGeometry(0.48, 1.45, 7, 1, true), dark);
  cloak.position.y = 0.1; cloak.rotation.y = 0.2; bodyGroup.add(cloak);
  const hood = mesh(new THREE.SphereGeometry(0.3, 8, 7, 0, Math.PI * 2, 0, Math.PI * 0.75), dark2);
  hood.position.y = 0.62; hood.rotation.x = -0.2; bodyGroup.add(hood);
  const face = mesh(new THREE.SphereGeometry(0.2, 8, 6), toon(0x0e0a18));
  face.scale.set(0.9, 1, 0.5); face.position.set(0, 0.58, 0.2); bodyGroup.add(face);
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.045, 6, 5), basic(0xff4d7d));
    eye.scale.set(1.1, 0.7, 0.5); eye.position.set(sx * 0.08, 0.61, 0.34); bodyGroup.add(eye);
    const horn = mesh(new THREE.ConeGeometry(0.055, 0.38, 5), toon(0x6f4c95));
    horn.position.set(sx * 0.2, 0.82, 0); horn.rotation.z = sx * -0.5; horn.rotation.x = -0.3; bodyGroup.add(horn);
    const arm = mesh(new THREE.ConeGeometry(0.09, 0.55, 5), dark2);
    arm.position.set(sx * 0.34, 0.2, 0.1); arm.rotation.z = sx * 0.6; arm.rotation.x = 0.2; bodyGroup.add(arm);
    const claw = mesh(new THREE.ConeGeometry(0.04, 0.16, 4), toon(0xd9b6ff));
    claw.position.set(sx * 0.48, -0.02, 0.18); claw.rotation.z = sx * 0.2; bodyGroup.add(claw);
  }
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  aura.scale.set(2.0, 2.2, 1); aura.position.y = 0.4; bodyGroup.add(aura);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshBasicMaterial({ color: 0x06030c, transparent: true, opacity: 0.2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; group.add(shadow);
  return { group, body: bodyGroup, height: 1.9, radius: 0.5, aura };
}

function makeBoss() {
  const group = new THREE.Group();
  const model = new THREE.Group(); group.add(model);
  const armor = toon(0x2a1b3f, { flatShading: true });
  const armorLight = toon(0x4b2d6b, { flatShading: true });
  const trim = toon(0x8f5bd6, { emissive: 0x4b1d8a, emissiveIntensity: 0.55 });
  const bone = toon(0xc7b9d6, { flatShading: true });

  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sx * 0.55, 1.2, 0); model.add(leg);
    const thigh = mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.05, 6), armor);
    thigh.position.y = -0.5; leg.add(thigh);
    const shin = mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.95, 6), armorLight);
    shin.position.y = -1.35; leg.add(shin);
    const foot = mesh(new THREE.BoxGeometry(0.7, 0.35, 1.0), armor);
    foot.position.set(0, -1.85, 0.18); leg.add(foot);
    legs.push(leg);
  }
  const hips = mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.7, 6), armor);
  hips.position.y = 1.5; model.add(hips);
  const torso = mesh(new THREE.CylinderGeometry(0.95, 0.65, 1.5, 6), armorLight);
  torso.position.y = 2.35; model.add(torso);
  const chest = mesh(new THREE.BoxGeometry(1.5, 1.0, 0.6), armor);
  chest.position.set(0, 2.55, 0.55); model.add(chest);
  const core = mesh(new THREE.OctahedronGeometry(0.3, 0), trim);
  core.position.set(0, 2.55, 0.9); model.add(core);
  const coreLight = new THREE.PointLight(0xb46bff, 14, 8, 2); coreLight.position.set(0, 2.6, 1.1); model.add(coreLight);

  // shoulders + spikes
  for (const sx of [-1, 1]) {
    const pauldron = mesh(new THREE.SphereGeometry(0.55, 7, 6, 0, Math.PI * 2, 0, Math.PI / 2), armor);
    pauldron.scale.set(1.2, 0.8, 1.1); pauldron.position.set(sx * 1.05, 2.95, 0); model.add(pauldron);
    for (let i = 0; i < 3; i++) {
      const spike = mesh(new THREE.ConeGeometry(0.12, 0.65 + i * 0.1, 4), bone);
      spike.position.set(sx * (0.85 + i * 0.22), 3.35, -0.15 + i * 0.15);
      spike.rotation.z = sx * (0.2 + i * 0.1); model.add(spike);
    }
  }
  // arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(sx * 1.3, 2.85, 0); model.add(arm);
    const upper = mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.0, 6), armor);
    upper.position.y = -0.5; arm.add(upper);
    const fore = mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.9, 6), armorLight);
    fore.position.y = -1.25; arm.add(fore);
    const hand = mesh(new THREE.SphereGeometry(0.24, 6, 5), bone);
    hand.position.y = -1.75; arm.add(hand);
    arms.push({ arm, hand, sx });
  }
  // head
  const head = new THREE.Group(); head.position.y = 3.35; model.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.48, 8, 7), bone);
  skull.scale.set(1, 1.05, 0.92); head.add(skull);
  const jaw = mesh(new THREE.BoxGeometry(0.5, 0.22, 0.42), bone);
  jaw.position.set(0, -0.36, 0.08); head.add(jaw);
  for (const sx of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.09, 7, 5), basic(0xc46bff));
    eye.scale.set(1.1, 0.8, 0.5); eye.position.set(sx * 0.18, 0.06, 0.42); head.add(eye);
  }
  // crown
  const crown = mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.22, 8, 1, true), trim);
  crown.position.y = 0.5; head.add(crown);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const spike = mesh(new THREE.ConeGeometry(0.09, 0.55, 4), trim);
    spike.position.set(Math.cos(a) * 0.45, 0.75, Math.sin(a) * 0.45); head.add(spike);
  }
  // cape
  const cape = mesh(new THREE.PlaneGeometry(2.2, 2.9), toon(0x1a1029, { side: THREE.DoubleSide }));
  cape.position.set(0, 2.25, -0.7); cape.rotation.x = 0.12; model.add(cape);
  // greatsword
  const sword = new THREE.Group();
  const grip = mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.6, 6), toon(0x2a1a18));
  sword.add(grip);
  const guard = mesh(new THREE.BoxGeometry(0.7, 0.12, 0.16), trim);
  guard.position.y = 0.28; sword.add(guard);
  const blade = mesh(new THREE.BoxGeometry(0.3, 2.3, 0.09), toon(0x3a2a4a, { emissive: 0x2a0f44, emissiveIntensity: 0.4 }));
  blade.position.y = -1.15; sword.add(blade);
  const bladeTip = mesh(new THREE.ConeGeometry(0.18, 0.5, 4), toon(0x3a2a4a));
  bladeTip.position.y = -2.5; bladeTip.rotation.z = Math.PI; sword.add(bladeTip);
  const edge = mesh(new THREE.BoxGeometry(0.045, 2.1, 0.11), basic(0xb46bff));
  edge.position.set(0.14, -1.15, 0); sword.add(edge);
  sword.position.set(0, -1.7, 0); sword.rotation.x = 0.2;
  arms[1].arm.add(sword);
  // aura
  const aura = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.0, 32), new THREE.MeshBasicMaterial({ color: 0x9b5cff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  aura.rotation.x = -Math.PI / 2; aura.position.y = 0.06; group.add(aura);
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  auraSprite.position.y = 2.4; auraSprite.scale.set(7, 7, 1); group.add(auraSprite);

  return { group, model, legs, arms, head, sword, core, coreLight, aura, auraSprite, height: 4.2, radius: 1.6 };
}

/* ------------------------------------------------------------------ */
/* health bars                                                         */
/* ------------------------------------------------------------------ */
function makeHealthBar(width = 1.15) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 24;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(width, width * 0.1875, 1);
  sprite.renderOrder = 8;
  return { sprite, canvas, ctx: canvas.getContext('2d'), tex, width };
}
function drawHealthBar(bar, ratio, boss = false) {
  const { ctx, canvas, tex } = bar;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(4,6,14,.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = boss ? 'rgba(190,120,255,.9)' : 'rgba(220,240,255,.65)';
  ctx.lineWidth = 2; ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
  if (boss) { g.addColorStop(0, '#7c2bc4'); g.addColorStop(1, '#e2a5ff'); }
  else { g.addColorStop(0, '#ff4668'); g.addColorStop(0.7, '#ff8a9e'); g.addColorStop(1, '#ffc0c9'); }
  ctx.fillStyle = g;
  ctx.fillRect(4, 4, (canvas.width - 8) * clamp(ratio, 0, 1), canvas.height - 8);
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.fillRect(4, 4, (canvas.width - 8) * clamp(ratio, 0, 1), 3);
  tex.needsUpdate = true;
}

/* ------------------------------------------------------------------ */
/* enemy manager                                                       */
/* ------------------------------------------------------------------ */
export class EnemyManager {
  constructor(scene, world, vfx, audio, callbacks = {}) {
    this.scene = scene;
    this.world = world;
    this.vfx = vfx;
    this.audio = audio;
    this.callbacks = callbacks;
    this.enemies = [];
    this.boss = null;
    this.bossActive = false;
    this.bossDefeated = false;
    this.spawnTimer = 0;
    this.spawns = [];
    this.dungeonSpawns = [];
    this.resetTimer = 0;
    this._createSpawns();
    this._spawnInitial();
  }

  _createSpawns() {
    const H = (x, z) => this.world.heightAt(x, z);
    const moss = [
      [-25, -5], [-34, -19], [-19, -29], [18, 10], [31, -15], [25, -40],
      [26, 4], [10, -27], [-8, -47], [28, 40], [-45, 22], [58, -18],
    ];
    const shade = [
      [-46, -16], [48, -31], [24, -52], [-20, -46], [82, 2], [22, 42], [-33, 30],
    ];
    for (const [x, z] of moss) this.spawns.push({ type: 'moss', x, z, y: H(x, z), timer: 0, alive: false });
    for (const [x, z] of shade) this.spawns.push({ type: 'shade', x, z, y: H(x, z), timer: 0, alive: false });
  }

  _spawnInitial() {
    for (const s of this.spawns) this.spawnFromSpawn(s);
  }

  spawnFromSpawn(spawn) {
    const e = spawn.type === 'moss' ? this._createMoss(spawn) : this._createShade(spawn);
    spawn.alive = true;
    spawn.enemy = e;
    this.enemies.push(e);
    return e;
  }

  _base(type, spawn, model, stats) {
    model.group.position.set(spawn.x, spawn.y, spawn.z);
    model.group.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(model.group);
    const bar = makeHealthBar(type === 'boss' ? 4 : 1.15);
    bar.sprite.position.y = model.height + 0.35;
    model.group.add(bar.sprite);
    drawHealthBar(bar, 1, type === 'boss');
    bar.sprite.visible = false;
    const e = {
      type, spawn, group: model.group, model, bar,
      hp: stats.hp, maxHp: stats.hp, speed: stats.speed, damage: stats.damage,
      aggro: stats.aggro, attackRange: stats.attackRange, attackCooldown: stats.attackCooldown,
      xp: stats.xp, coins: stats.coins,
      state: 'idle', stateTime: 0, cooldown: Math.random() * 1.5,
      stun: 0, invuln: 0, flash: 0, dead: false, deathTime: 0,
      kb: new THREE.Vector3(), wander: new THREE.Vector3(), wanderTimer: Math.random() * 2,
      home: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
      engaged: false, hurtTimer: 0, phase: 1, inDungeon: false,
      radius: model.radius, height: model.height, name: stats.name,
    };
    e.wander.copy(e.home);
    return e;
  }

  _createMoss(spawn) {
    const model = makeMossling();
    const e = this._base('moss', spawn, model, { hp: 58, speed: 3.4, damage: 9, aggro: 14, attackRange: 1.7, attackCooldown: 1.5, xp: 28, coins: 8, name: 'Mossling' });
    return e;
  }

  _createShade(spawn) {
    const model = makeShade();
    const e = this._base('shade', spawn, model, { hp: 42, speed: 6.2, damage: 7, aggro: 18, attackRange: 2.0, attackCooldown: 1.0, xp: 40, coins: 13, name: 'Shade Fang' });
    return e;
  }

  spawnBoss() {
    if (this.boss) return this.boss;
    const spawn = { type: 'boss', x: 0, y: 0.3, z: -232 };
    const model = makeBoss();
    const e = this._base('boss', spawn, model, { hp: 620, speed: 3.0, damage: 20, aggro: 30, attackRange: 4.0, attackCooldown: 2.2, xp: 700, coins: 500, name: 'The Hollow King' });
    e.inDungeon = true;
    e.home.set(0, 0.3, -232);
    e.wander.copy(e.home);
    e.bar.sprite.visible = false;
    e.model.group.scale.setScalar(1.05);
    this.boss = e;
    this.enemies.push(e);
    return e;
  }

  startBoss() {
    if (this.bossActive || this.bossDefeated) return;
    const boss = this.spawnBoss();
    this.bossActive = true;
    boss.engaged = true;
    boss.state = 'roar'; boss.stateTime = 0;
    this.callbacks.onBossStart?.(boss);
    this.audio?.bossRoar();
    this.vfx?.shockwave(boss.group.position, 6, 0x9b5cff, 1.0);
  }

  enemyZone(e) {
    return e.inDungeon ? 'dungeon' : 'island';
  }

  get zone() { return this.callbacks.getZone?.() ?? 'island'; }

  _damagePlayer(e) {
    const dmg = e.damage + (e.type === 'boss' && e.phase === 2 ? 5 : 0);
    this.callbacks.onPlayerHit?.(dmg, e.group.position, e);
    if (e.type === 'boss') this.vfx?.shockwave(e.group.position, 5.2, 0x9b5cff, 0.8);
    else this.vfx?.hitSpark(new THREE.Vector3(e.group.position.x, e.group.position.y + 0.8, e.group.position.z), 0xff5577, 10);
  }

  update(dt, playerPos, playerInvuln = false) {
    // the Hollow King wakes when the player crosses the throne threshold
    if (this.zone === 'dungeon' && !this.bossActive && !this.bossDefeated && playerPos.z < -213) {
      this.startBoss();
    }

    // respawns
    this.spawnTimer += dt;
    for (const s of this.spawns) {
      if (s.alive) continue;
      s.timer -= dt;
      if (s.timer <= 0 && this.zone === 'island') {
        const d = Math.hypot(playerPos.x - s.x, playerPos.z - s.z);
        if (d > 18) this.spawnFromSpawn(s);
        else s.timer = 3;
      }
    }

    for (const e of [...this.enemies]) {
      if (e.dead) {
        e.deathTime += dt;
        const t = Math.min(1, e.deathTime / 1.1);
        e.group.rotation.z = t * 1.2;
        e.group.position.y = e.spawn.y - t * 0.8;
        e.group.scale.setScalar(1 - t * 0.55);
        e.bar.sprite.visible = false;
        if (e.deathTime > 1.25) {
          this.scene.remove(e.group);
          const i = this.enemies.indexOf(e); if (i >= 0) this.enemies.splice(i, 1);
          if (e.spawn) e.spawn.alive = false;
        }
        continue;
      }
      if (e.inDungeon && this.zone !== 'dungeon') continue;
      if (!e.inDungeon && this.zone !== 'island') continue;

      this._updateEnemy(e, dt, playerPos, playerInvuln);
    }

    // simple separation
    const list = this.enemies.filter(e => !e.dead);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const dx = b.group.position.x - a.group.position.x;
        const dz = b.group.position.z - a.group.position.z;
        const d = Math.hypot(dx, dz);
        const min = (a.radius + b.radius) * 0.75;
        if (d > 0.001 && d < min) {
          const push = (min - d) * 0.5;
          a.group.position.x -= dx / d * push; a.group.position.z -= dz / d * push;
          b.group.position.x += dx / d * push; b.group.position.z += dz / d * push;
        }
      }
    }
  }

  _updateEnemy(e, dt, playerPos, playerInvuln) {
    const p = e.group.position;
    const dx = playerPos.x - p.x;
    const dz = playerPos.z - p.z;
    const dist = Math.hypot(dx, dz);
    const toPlayer = Math.atan2(dx, dz);
    e.stateTime += dt;
    e.cooldown = Math.max(0, e.cooldown - dt);
    e.stun = Math.max(0, e.stun - dt);
    e.invuln = Math.max(0, e.invuln - dt);
    e.flash = Math.max(0, e.flash - dt);
    if (e.flash <= 0 && e._flashed) this._setFlash(e, false);

    // knockback
    if (e.kb.lengthSq() > 0.0001) {
      p.x += e.kb.x * dt; p.z += e.kb.z * dt;
      e.kb.multiplyScalar(Math.max(0, 1 - dt * 8));
      this._collide(e);
    }

    // face / animate
    const m = e.model;
    if (e.type === 'moss') {
      const t = performance.now() * 0.003 + e.home.x;
      m.body.position.y = Math.abs(Math.sin(t * 2)) * 0.12;
      m.body.rotation.z = Math.sin(t) * 0.04;
    } else if (e.type === 'shade') {
      const t = performance.now() * 0.003 + e.home.z;
      m.body.position.y = 0.72 + Math.sin(t * 1.6) * 0.12;
      m.body.rotation.y += dt * 0.3;
      m.aura.material.opacity = 0.22 + Math.sin(t * 2.4) * 0.08;
    } else if (e.type === 'boss') {
      const t = performance.now() * 0.001;
      m.core.rotation.y += dt * 1.1;
      m.aura.rotation.z += dt * 0.35;
      m.aura.material.opacity = e.phase === 2 ? 0.4 + Math.sin(t * 3) * 0.15 : 0.26 + Math.sin(t * 2) * 0.08;
      m.coreLight.intensity = (e.phase === 2 ? 24 : 12) + Math.sin(t * 4) * 3;
      if (e.state === 'idle' || e.state === 'chase') {
        m.model.position.y = Math.sin(t * 2.2) * 0.06;
        m.arms[0].arm.rotation.x = Math.sin(t * 1.5) * 0.06;
        m.arms[1].arm.rotation.x = -0.2 + Math.sin(t * 1.5) * 0.06;
        m.legs[0].rotation.x = 0; m.legs[1].rotation.x = 0;
      }
    }

    if (e.stun > 0) {
      if (e.type === 'boss') m.model.rotation.x = Math.sin(e.stun * 25) * 0.03;
      return;
    }
    if (e.state === 'hurt') {
      e.state = 'chase';
      e.stateTime = 0;
      if (e.type === 'moss') m.body.scale.y = 1;
    }

    if (e.type === 'boss' && !e.engaged) {
      // idle until player crosses threshold
      if (this.zone === 'dungeon' && playerPos.z < -213) this.startBoss();
      return;
    }

    // state machine
    if (e.state === 'idle') {
      e.wanderTimer -= dt;
      if (e.wanderTimer <= 0) {
        e.wanderTimer = 2 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        e.wander.set(e.home.x + Math.cos(a) * 3, e.home.y, e.home.z + Math.sin(a) * 3);
      }
      const wx = e.wander.x - p.x, wz = e.wander.z - p.z;
      const wd = Math.hypot(wx, wz);
      if (wd > 0.4) {
        p.x += wx / wd * e.speed * 0.28 * dt;
        p.z += wz / wd * e.speed * 0.28 * dt;
        e.group.rotation.y = Math.atan2(wx, wz);
      }
      if (e.type === 'moss') m.body.rotation.y = Math.sin(performance.now() * 0.002 + e.home.x) * 0.2;
      if (dist < e.aggro && !playerInvuln) {
        e.state = 'chase'; e.stateTime = 0; e.engaged = true;
        e.bar.sprite.visible = true;
        if (e.type === 'boss') this.callbacks.onBossEngage?.(e);
      }
    } else if (e.state === 'chase') {
      e.group.rotation.y = toPlayer;
      const speed = e.speed * (e.type === 'boss' && e.phase === 2 ? 1.35 : 1);
      if (dist > e.attackRange * 0.85) {
        p.x += Math.sin(toPlayer) * speed * dt;
        p.z += Math.cos(toPlayer) * speed * dt;
        this._collide(e);
        if (e.type === 'boss') {
          m.legs[0].rotation.x = Math.sin(performance.now() * 0.006) * 0.28;
          m.legs[1].rotation.x = -Math.sin(performance.now() * 0.006) * 0.28;
          m.model.position.y = Math.abs(Math.sin(performance.now() * 0.006)) * 0.1;
        } else if (e.type === 'shade') {
          m.body.rotation.z = Math.sin(performance.now() * 0.006) * 0.12;
        }
      }
      if (e.cooldown <= 0 && dist < e.attackRange) {
        e.state = 'windup'; e.stateTime = 0;
        e.attackKind = e.type === 'boss' ? (dist < 4.5 ? 'slam' : 'cleave') : 'melee';
        this.vfx?.telegraph(new THREE.Vector3(p.x, p.y + 0.05, p.z), e.type === 'boss' ? 5.0 : e.attackRange + 0.6, e.type === 'boss' ? 0xff3c8a : 0xff5c72, e.type === 'boss' ? 0.85 : 0.42);
        if (e.type === 'boss') {
          this.audio?.bossGrowl();
          m.arms[1].arm.rotation.x = -2.6;
        } else {
          this.audio?.enemyWindup();
        }
      }
    } else if (e.state === 'windup') {
      e.group.rotation.y = toPlayer;
      const windDur = e.type === 'boss' ? 0.85 : 0.42;
      const t = e.stateTime / windDur;
      if (e.type === 'boss') {
        m.arms[1].arm.rotation.x = -2.6 + t * 1.2;
        m.model.rotation.x = -0.1 * Math.sin(t * Math.PI);
      } else if (e.type === 'moss') {
        m.body.scale.y = 1 + Math.sin(t * Math.PI) * 0.25;
      } else {
        m.body.position.y = 0.65 + t * 0.3;
      }
      if (e.stateTime >= windDur) {
        // strike
        if (dist < e.attackRange + (e.type === 'boss' ? 2.0 : 1.1)) {
          this._damagePlayer(e);
        }
        if (e.type === 'boss') {
          this.vfx?.shockwave(new THREE.Vector3(p.x, p.y + 0.2, p.z), 5.4, 0x9b5cff, 0.9);
          this.vfx?.slash(new THREE.Vector3(p.x, p.y + 1.4, p.z), e.group.rotation.y, true, 0xb46bff);
          this.callbacks.onBossSlam?.(e);
          m.arms[1].arm.rotation.x = 0.6;
        } else {
          this.vfx?.slash(new THREE.Vector3(p.x, p.y + 0.8, p.z), e.group.rotation.y, false, e.type === 'shade' ? 0xff4d7d : 0x9dff8a);
        }
        this.audio?.enemyAttack();
        e.state = 'recover'; e.stateTime = 0;
        e.cooldown = e.attackCooldown * (0.75 + Math.random() * 0.5);
      }
    } else if (e.state === 'recover') {
      if (e.stateTime > 0.35) {
        e.state = 'chase'; e.stateTime = 0;
        if (e.type === 'moss') m.body.scale.y = 1;
      }
    } else if (e.state === 'roar') {
      if (e.stateTime > 1.2) { e.state = 'chase'; e.stateTime = 0; e.cooldown = 0.8; }
    }

    // boss phase 2
    if (e.type === 'boss' && e.phase === 1 && e.hp < e.maxHp * 0.5) {
      e.phase = 2;
      e.speed *= 1.2;
      e.attackCooldown *= 0.75;
      this.callbacks.onBossPhase?.(e);
      this.audio?.bossRoar();
      this.vfx?.shockwave(new THREE.Vector3(p.x, p.y + 0.3, p.z), 8, 0xd78bff, 1.2);
      this.vfx?.hitSpark(new THREE.Vector3(p.x, p.y + 2.5, p.z), 0xd78bff, 28);
      e.group.scale.setScalar(1.1);
    }

    // health bar follow + visibility
    e.bar.sprite.visible = e.engaged || e.hp < e.maxHp;
    if (e.bar.sprite.visible) {
      e.bar.sprite.position.y = e.height + 0.35;
    }
  }

  _collide(e) {
    const p = e.group.position;
    const cols = e.inDungeon ? this.world.dungeonColliders : this.world.colliders;
    for (const c of cols) {
      const dx = p.x - c.x, dz = p.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + e.radius * 0.55;
      if (d < min && d > 0.001) {
        p.x = c.x + dx / d * min;
        p.z = c.z + dz / d * min;
      }
    }
    if (e.inDungeon) {
      p.x = clamp(p.x, -14.5, 14.5);
      p.z = clamp(p.z, -246, -199);
    } else {
      const d = Math.hypot(p.x, p.z);
      if (d > 94) { p.x *= 94 / d; p.z *= 94 / d; }
    }
    p.y = e.inDungeon ? 0.3 : this.world.heightAt(p.x, p.z);
  }

  _setFlash(e, on) {
    e._flashed = on;
    e.group.traverse(obj => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat.emissive) continue;
        if (on) {
          if (!mat.userData._origEmissive) {
            mat.userData._origEmissive = mat.emissive.getHex();
            mat.userData._origIntensity = mat.emissiveIntensity ?? 1;
          }
          mat.emissive.setHex(0xffffff);
          mat.emissiveIntensity = 1.4;
        } else if (mat.userData._origEmissive !== undefined) {
          mat.emissive.setHex(mat.userData._origEmissive);
          mat.emissiveIntensity = mat.userData._origIntensity;
        }
      }
    });
  }

  damage(e, amount, dir, knockback = 2, heavy = false, source = 'sword') {
    if (!e || e.dead || e.invuln > 0) return false;
    e.hp -= amount;
    e.engaged = true;
    e.invuln = 0.06;
    e.flash = 0.13;
    e._flashed = false;
    this._setFlash(e, true);
    e.stun = heavy ? 0.42 : 0.2;
    e.state = 'hurt'; e.stateTime = 0;
    if (e.type !== 'boss') {
      e.kb.set(dir.x, 0, dir.z).normalize().multiplyScalar(knockback);
      e.bar.sprite.visible = true;
    } else {
      e.kb.set(dir.x, 0, dir.z).normalize().multiplyScalar(knockback * 0.08);
    }
    drawHealthBar(e.bar, Math.max(0, e.hp / e.maxHp), e.type === 'boss');
    const hitPos = new THREE.Vector3(e.group.position.x, e.group.position.y + e.height * 0.6, e.group.position.z);
    this.vfx?.hitSpark(hitPos, heavy ? 0xffd37a : 0xbffcff, heavy ? 22 : 13);
    this.vfx?.damageNumber(hitPos, Math.round(amount), heavy ? 'gold' : 'white');
    this.audio?.hit(heavy);
    if (e.type === 'boss') this.callbacks.onBossDamage?.(e, amount);
    if (e.hp <= 0) this._kill(e);
    return true;
  }

  _kill(e) {
    e.dead = true;
    e.hp = 0;
    e.deathTime = 0;
    e.kb.set(0, 0, 0);
    this.vfx?.deathBurst(e.group.position.clone().add(new THREE.Vector3(0, e.height * 0.5, 0)), e.type === 'boss' ? 0xd78bff : e.type === 'shade' ? 0xb46bff : 0x9dff8a);
    this.audio?.enemyDeath(e.type === 'boss');
    if (e.type === 'boss') {
      this.bossActive = false;
      this.bossDefeated = true;
      this.callbacks.onBossDefeated?.(e);
    } else {
      this.callbacks.onEnemyDeath?.(e);
      if (e.spawn) e.spawn.timer = 26 + Math.random() * 8;
    }
  }

  enemiesInArc(origin, yaw, range, arc) {
    const hits = [];
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.inDungeon && this.zone !== 'dungeon') continue;
      if (!e.inDungeon && this.zone !== 'island') continue;
      const dx = e.group.position.x - origin.x;
      const dz = e.group.position.z - origin.z;
      const d = Math.hypot(dx, dz);
      if (d > range + e.radius) continue;
      const ang = Math.atan2(dx, dz);
      let diff = Math.abs(ang - yaw);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (diff > arc * 0.5) continue;
      hits.push(e);
    }
    return hits;
  }

  enemiesInRadius(center, radius) {
    return this.enemies.filter(e => {
      if (e.dead) return false;
      if (e.inDungeon && this.zone !== 'dungeon') return false;
      if (!e.inDungeon && this.zone !== 'island') return false;
      return Math.hypot(e.group.position.x - center.x, e.group.position.z - center.z) < radius + e.radius;
    });
  }

  resetBoss() {
    if (!this.boss || this.bossDefeated) return;
    const b = this.boss;
    b.hp = b.maxHp; b.dead = false; b.engaged = false; b.state = 'idle'; b.phase = 1;
    b.group.position.set(0, 0.3, -232); b.group.scale.setScalar(1.05);
    b.group.rotation.set(0, 0, 0);
    b.bar.sprite.visible = false;
    drawHealthBar(b.bar, 1, true);
    this.bossActive = false;
  }

  resetMinions() {
    for (const e of this.enemies) {
      if (e.type === 'boss' || e.dead) continue;
      e.hp = e.maxHp; e.state = 'idle'; e.engaged = false;
      e.group.position.copy(e.home);
      e.group.rotation.set(0, 0, 0);
      e.bar.sprite.visible = false;
      drawHealthBar(e.bar, 1, false);
    }
  }
}
