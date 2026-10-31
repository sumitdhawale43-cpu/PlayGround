import * as THREE from 'three';
import { createEnemyRifle } from './weapons.js';

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function createSoldier(hitMeshes, tier) {
  const uniform = new THREE.MeshStandardMaterial({ color: tier > 2 ? 0x353b44 : 0x454d3f, roughness: 0.9, metalness: 0.04 });
  const uniform2 = new THREE.MeshStandardMaterial({ color: 0x272b26, roughness: 0.92 });
  const vest = new THREE.MeshStandardMaterial({ color: 0x20241f, roughness: 0.78, metalness: 0.12 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0x303630, roughness: 0.72, metalness: 0.15 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x8c5d3f, roughness: 0.86 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x121312, roughness: 0.95 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x330b05, emissive: 0xff3418, emissiveIntensity: 2.4, roughness: 0.25, metalness: 0.4,
  });
  const patch = new THREE.MeshStandardMaterial({ color: 0x8a3c27, roughness: 0.8 });

  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);

  const tag = (mesh, mult) => {
    mesh.userData.hitMult = mult;
    hitMeshes.push(mesh);
    return mesh;
  };

  // legs
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.13, 0.96, 0);
    const thigh = box(0.175, 0.44, 0.19, uniform, 0, -0.21, 0);
    tag(thigh, 0.72);
    hip.add(thigh);
    const kneePad = box(0.16, 0.12, 0.055, vest, 0, -0.4, -0.11);
    hip.add(kneePad);
    const shin = new THREE.Group();
    shin.position.set(0, -0.42, 0);
    const calf = box(0.15, 0.4, 0.165, uniform, 0, -0.2, 0);
    tag(calf, 0.72);
    shin.add(calf);
    const boot = box(0.16, 0.15, 0.27, rubber, 0, -0.42, -0.035);
    tag(boot, 0.72);
    shin.add(boot);
    hip.add(shin);
    model.add(hip);
    legs.push({ hip, shin, phase: side > 0 ? 0 : Math.PI });
  }

  // pelvis + belt
  const pelvis = box(0.42, 0.24, 0.26, uniform2, 0, 0.98, 0);
  tag(pelvis, 1);
  model.add(pelvis);
  model.add(box(0.45, 0.09, 0.29, vest, 0, 1.08, 0));
  for (let i = -1; i <= 1; i++) model.add(box(0.1, 0.11, 0.05, uniform2, i * 0.14, 1.0, -0.15));

  // torso
  const torso = box(0.5, 0.55, 0.28, uniform, 0, 1.35, 0);
  tag(torso, 1);
  model.add(torso);
  // plate carrier
  const carrier = box(0.55, 0.4, 0.34, vest, 0, 1.37, 0);
  tag(carrier, 1);
  model.add(carrier);
  // pouches
  for (let i = -1; i <= 1; i++) {
    model.add(box(0.13, 0.15, 0.08, uniform2, i * 0.15, 1.24, -0.19));
  }
  // shoulder pads
  for (const side of [-1, 1]) {
    const pad = box(0.17, 0.13, 0.28, vest, side * 0.31, 1.55, 0);
    pad.rotation.z = side * -0.2;
    model.add(pad);
  }
  // backpack
  model.add(box(0.36, 0.38, 0.17, vest, 0, 1.38, 0.19));
  model.add(box(0.1, 0.2, 0.06, patch, 0.08, 1.55, 0.28));

  // arms
  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.35, 1.53, 0);
    const upper = box(0.14, 0.36, 0.16, uniform, 0, -0.17, 0);
    tag(upper, 0.7);
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.35, 0);
    const fore = box(0.125, 0.34, 0.14, uniform2, 0, -0.16, 0);
    tag(fore, 0.7);
    elbow.add(fore);
    const glove = box(0.13, 0.13, 0.17, rubber, 0, -0.35, -0.02);
    tag(glove, 0.7);
    elbow.add(glove);
    shoulder.add(elbow);
    model.add(shoulder);
    arms.push({ shoulder, elbow, side });
  }
  // pose arms toward rifle
  const right = arms.find(a => a.side > 0);
  const left = arms.find(a => a.side < 0);
  right.shoulder.rotation.set(-1.12, 0, -0.18);
  right.elbow.rotation.set(-0.5, 0.12, 0);
  left.shoulder.rotation.set(-1.32, 0, 0.55);
  left.elbow.rotation.set(-0.35, -0.1, 0);

  // head
  const neck = box(0.15, 0.12, 0.15, skin, 0, 1.66, 0);
  tag(neck, 2);
  model.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), skin);
  head.position.set(0, 1.77, 0); head.scale.set(0.95, 1.05, 0.95);
  head.castShadow = true;
  tag(head, 3);
  model.add(head);
  // helmet dome
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), helmetMat);
  helmet.position.set(0, 1.79, 0); helmet.scale.set(1, 0.9, 1.04);
  helmet.castShadow = true;
  tag(helmet, 3);
  model.add(helmet);
  // helmet rim + side rails
  model.add(box(0.36, 0.05, 0.3, helmetMat, 0, 1.75, 0.01));
  for (const side of [-1, 1]) model.add(box(0.035, 0.06, 0.17, helmetMat, side * 0.18, 1.8, 0));
  // visor / night optics
  const visor = box(0.24, 0.065, 0.06, visorMat, 0, 1.77, -0.145);
  model.add(visor);
  const optic = box(0.07, 0.07, 0.13, vest, 0, 1.73, -0.2);
  model.add(optic);
  const opticLens = box(0.055, 0.055, 0.015, visorMat, 0, 1.73, -0.268);
  model.add(opticLens);
  // jaw mask
  model.add(box(0.19, 0.1, 0.05, rubber, 0, 1.68, -0.13));

  // invisible, generous hitboxes for reliable hit registration
  const torsoHit = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.46), new THREE.MeshBasicMaterial({ visible: false }));
  torsoHit.position.set(0, 1.28, 0);
  tag(torsoHit, 1);
  model.add(torsoHit);
  const headHit = new THREE.Mesh(new THREE.SphereGeometry(0.225, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  headHit.position.set(0, 1.78, 0);
  tag(headHit, 3);
  model.add(headHit);
  const legHit = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.0, 0.42), new THREE.MeshBasicMaterial({ visible: false }));
  legHit.position.set(0, 0.52, 0);
  tag(legHit, 0.75);
  model.add(legHit);

  // rifle
  const rifle = createEnemyRifle();
  rifle.group.position.set(0.17, 1.33, -0.3);
  rifle.group.rotation.y = 0.03;
  model.add(rifle.group);
  const muzzle = rifle.muzzle;
  const flash = rifle.flash;

  model.scale.setScalar(1.0);

  // underglow unit marker (subtle)
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.26, 16),
    new THREE.MeshBasicMaterial({ color: 0xff2e18, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.025;
  root.add(marker);

  return { root, model, legs, arms, muzzle, flash, marker, visorMat };
}

export class Enemy {
  constructor(game, pos, tier = 1) {
    this.game = game;
    this.position = pos.clone();
    this.position.y = 0;
    this.tier = tier;
    this.maxHealth = 95 + tier * 14;
    this.health = this.maxHealth;
    this.alive = true;
    this.deadT = 0;
    this.removed = false;
    this.spawnDelay = 0.75;
    this.walkPhase = Math.random() * 10;
    this.speed = 1.75 + tier * 0.16 + Math.random() * 0.45;
    this.hitMeshes = [];
    this.nextShot = 0.7 + Math.random() * 0.8;
    this.losTimer = 0;
    this.los = false;
    this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    this.strafeTimer = 1 + Math.random() * 2;
    this.avoidTimer = 0;
    this.moving = false;

    const parts = createSoldier(this.hitMeshes, tier);
    this.parts = parts;
    this.root = parts.root;
    this.root.position.copy(this.position);
    this.root.rotation.y = Math.random() * Math.PI * 2;
    for (const m of this.hitMeshes) m.userData.enemy = this;
    game.scene.add(this.root);

    this.muzzleWorld = new THREE.Vector3();
    this.flashT = 0;
  }

  get aimPoint() {
    return _v1.set(this.position.x, 1.35, this.position.z);
  }

  update(dt, time) {
    if (this.removed) return;
    if (!this.alive) {
      this.deadT += dt;
      const fall = Math.min(1, this.deadT * 3.1);
      this.root.rotation.x = fall * 1.5;
      this.root.rotation.z = Math.sin(this.deadT * 2) * 0.08 * fall;
      this.root.position.y = this.deadT > 2.4 ? -(this.deadT - 2.4) * 0.55 : 0;
      if (this.deadT > 4.4 && !this.removed) {
        this.removed = true;
        this.game.scene.remove(this.root);
        this.dispose();
      }
      if (this.parts.flash.material.opacity > 0) this.parts.flash.material.opacity = 0;
      return;
    }

    const player = this.game.player;
    const px = player.pos.x, pz = player.pos.z;
    let dx = px - this.position.x, dz = pz - this.position.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    dx /= dist; dz /= dist;

    this.spawnDelay -= dt;

    // Line of sight checks are throttled.
    this.losTimer -= dt;
    if (this.losTimer <= 0) {
      this.losTimer = 0.22 + Math.random() * 0.12;
      this.los = this.game.lineOfSight(
        _v2.set(this.position.x, 1.42, this.position.z),
        new THREE.Vector3(player.pos.x, player.pos.y + player.eye - 0.25, player.pos.z)
      );
    }

    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeTimer = 1.2 + Math.random() * 2.2;
      this.strafeDir *= -1;
    }

    // face the player
    const targetYaw = Math.atan2(-dx, -dz);
    let dy = targetYaw - this.root.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.root.rotation.y += dy * Math.min(1, dt * 7);

    // desired movement
    let mx = 0, mz = 0;
    if (this.spawnDelay <= 0) {
      if (!this.los || dist > 17) {
        mx = dx; mz = dz;
      } else if (dist < 7) {
        mx = -dx; mz = -dz;
      } else {
        // strafe with slight approach bias
        mx = -dz * this.strafeDir + dx * 0.15;
        mz = dx * this.strafeDir + dz * 0.15;
      }
      // obstacle avoidance — steer perpendicular when blocked
      if (this.avoidTimer > 0) {
        this.avoidTimer -= dt;
        mx = -dz * this.strafeDir; mz = dx * this.strafeDir;
      }
      const len = Math.hypot(mx, mz) || 1;
      mx = mx / len * this.speed * dt;
      mz = mz / len * this.speed * dt;

      // separation from other enemies
      for (const other of this.game.enemies) {
        if (other === this || !other.alive) continue;
        const ox = this.position.x - other.position.x;
        const oz = this.position.z - other.position.z;
        const od = Math.hypot(ox, oz);
        if (od > 0.001 && od < 1.15) {
          mx += (ox / od) * dt * 1.8;
          mz += (oz / od) * dt * 1.8;
        }
      }

      const moved = this.game.moveEntity(this.position, mx, mz, 0.44);
      this.moving = moved > 0.0005;
      if (this.moving && moved < Math.hypot(mx, mz) * 0.45 && this.avoidTimer <= 0) {
        this.avoidTimer = 0.5 + Math.random() * 0.7;
        this.strafeDir *= -1;
      }
      this.walkPhase += dt * (this.moving ? 7.5 : 2.0);
    }

    // animation
    const swing = this.moving ? Math.sin(this.walkPhase) * 0.62 : Math.sin(this.walkPhase) * 0.05;
    for (const leg of this.parts.legs) {
      leg.hip.rotation.x = swing * (leg.phase ? -1 : 1);
      leg.shin.rotation.x = Math.max(0, -swing * (leg.phase ? -1 : 1)) * 0.7;
    }
    this.parts.model.position.y = this.moving ? Math.abs(Math.sin(this.walkPhase)) * 0.045 : 0;
    this.parts.model.rotation.z = this.moving ? Math.sin(this.walkPhase) * 0.025 : 0;
    this.parts.marker.material.opacity = 0.12 + Math.sin(time * 3 + this.walkPhase) * 0.06;

    // attack
    if (this.spawnDelay <= 0 && this.los && dist < 34) {
      this.nextShot -= dt;
      if (this.nextShot <= 0) {
        this.nextShot = Math.max(0.32, (0.95 - this.tier * 0.055)) * (0.75 + Math.random() * 0.6);
        this.shoot(dist);
      }
    }

    if (this.flashT > 0) {
      this.flashT -= dt;
      this.parts.flash.material.opacity = Math.max(0, this.flashT * 22);
      if (this.flashT <= 0) this.parts.flash.material.opacity = 0;
    }
  }

  shoot(dist) {
    const game = this.game;
    const player = game.player;
    this.parts.muzzle.getWorldPosition(this.muzzleWorld);
    this.parts.flash.material.rotation = Math.random() * Math.PI;
    this.parts.flash.material.opacity = 0.95;
    this.parts.flash.scale.setScalar(0.55 + Math.random() * 0.35);
    this.flashT = 0.055;

    // hit chance based on range, tier and player movement
    let chance = 0.62 - dist * 0.012 + this.tier * 0.028;
    if (player.sprinting) chance -= 0.12;
    chance = Math.max(0.1, Math.min(0.62, chance));
    const hit = Math.random() < chance;

    const aim = new THREE.Vector3(player.pos.x, player.pos.y + player.eye - 0.3, player.pos.z);
    if (!hit) {
      aim.x += (Math.random() - 0.5) * 2.4;
      aim.y += (Math.random() - 0.5) * 1.5;
      aim.z += (Math.random() - 0.5) * 2.4;
    }
    game.addTracer(this.muzzleWorld, aim, 0xff7b3a, 0.055);
    game.audio.enemyShot(dist);

    if (hit) {
      const dmg = (4.8 + this.tier * 1.0) * (0.8 + Math.random() * 0.4);
      game.damagePlayer(dmg, this.position);
    }
    // small impact where the round lands
    if (!hit) {
      const dir = aim.clone().sub(this.muzzleWorld).normalize();
      const target = this.muzzleWorld.clone().addScaledVector(dir, 60);
      game.addImpactRay(this.muzzleWorld, target);
    }
  }

  takeDamage(amount, point, headshot) {
    if (!this.alive) return false;
    this.health -= amount;
    this.game.spawnBlood(point, headshot);
    this.game.audio.hit(headshot);
    if (this.health <= 0) {
      this.die(headshot);
      return true;
    }
    return false;
  }

  die(headshot) {
    this.alive = false;
    this.deadT = 0;
    // drop the rifle
    const rifle = this.parts.muzzle.parent;
    if (rifle) {
      rifle.visible = false;
    }
    this.parts.flash.material.opacity = 0;
    this.game.onEnemyKilled(this, headshot);
  }

  dispose() {
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  }
}
