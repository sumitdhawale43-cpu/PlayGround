import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(210,250,255,.8)');
  g.addColorStop(0.55, 'rgba(125,249,255,.25)');
  g.addColorStop(1, 'rgba(125,249,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTexture();
const sparkGeo = new THREE.OctahedronGeometry(0.07, 0);
const ringGeo = new THREE.RingGeometry(0.8, 1, 40);

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.effects = [];
    this.projectiles = [];
    this.time = 0;
  }

  _add(mesh, life, update) {
    this.scene.add(mesh);
    const e = { mesh, life, age: 0, update };
    this.effects.push(e);
    return e;
  }

  update(dt) {
    this.time += dt;
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.age += dt;
      const t = e.age / e.life;
      if (t >= 1) {
        this.scene.remove(e.mesh);
        e.mesh.traverse?.(o => {
          if (o.geometry && o.geometry !== ringGeo && o.geometry !== sparkGeo) o.geometry.dispose?.();
          if (o.material) {
            if (o.material.map && o.material.map !== GLOW) o.material.map.dispose?.();
            o.material.dispose?.();
          }
        });
        this.effects.splice(i, 1);
        continue;
      }
      e.update?.(t, e, dt);
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.pos.addScaledVector(p.dir, p.speed * dt);
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.y += dt * 6;
      if (p.light) p.light.position.copy(p.pos);
      // trail
      p.trailTimer -= dt;
      if (p.trailTimer <= 0) {
        p.trailTimer = 0.035;
        this.hitSpark(p.pos.clone(), p.color, 3, 0.3, 0.6);
      }
      const hit = p.hitTest?.(p.pos);
      if (hit || p.age > p.life || p.pos.y < -1) {
        this.explode(p.pos.clone(), p.color, p.onExplode);
        this.scene.remove(p.mesh);
        if (p.light) this.scene.remove(p.light);
        p.mesh.traverse?.(o => { o.material?.dispose?.(); });
        this.projectiles.splice(i, 1);
      }
    }
  }

  slash(pos, yaw, heavy = false, color = 0x7df9ff) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = yaw;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: heavy ? 0.95 : 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.75, 26, 1, Math.PI / 2 - 1.0, 2.0), mat);
    arc.rotation.x = Math.PI / 2;
    group.add(arc);
    if (heavy) {
      const arc2 = new THREE.Mesh(new THREE.RingGeometry(1.15, 2.2, 26, 1, Math.PI / 2 - 1.2, 2.4), mat.clone());
      arc2.material.opacity = 0.45; arc2.rotation.x = Math.PI / 2; arc2.rotation.z = 0.1; group.add(arc2);
    }
    this._add(group, heavy ? 0.38 : 0.26, (t, e) => {
      const s = 0.75 + t * (heavy ? 0.9 : 0.65);
      group.scale.set(s, s, s);
      group.rotation.y = yaw + (heavy ? 0 : (t - 0.5) * 0.4);
      group.position.y = pos.y + Math.sin(t * Math.PI) * 0.06;
      group.traverse(o => { if (o.material && o.material.opacity !== undefined) o.material.opacity = (heavy ? 0.95 : 0.8) * (1 - t) ** 1.4; });
    });
  }

  hitSpark(pos, color = 0xffffff, count = 12, size = 1, life = 0.55) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x; positions[i * 3 + 1] = pos.y; positions[i * 3 + 2] = pos.z;
      const a = Math.random() * TAU, e = Math.random() * Math.PI - Math.PI / 2;
      const sp = (1.5 + Math.random() * 4) * size;
      velocities.push(new THREE.Vector3(Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 1, Math.sin(a) * Math.cos(e) * sp));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.12 * size, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    const origin = pos.clone();
    this._add(points, life, (t) => {
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const v = velocities[i];
        arr[i * 3] = origin.x + v.x * t * life;
        arr[i * 3 + 1] = origin.y + (v.y - 3.5 * t * life) * t * life;
        arr[i * 3 + 2] = origin.z + v.z * t * life;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 1 - t;
      mat.size = 0.12 * size * (1 - t * 0.5);
    });
  }

  shockwave(pos, radius = 4, color = 0x7df9ff, life = 0.7) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y += 0.08;
    this._add(ring, life, (t) => {
      const s = 0.3 + t * radius;
      ring.scale.set(s, s, s);
      mat.opacity = 0.75 * (1 - t) ** 1.5;
    });
    // vertical light column
    const colMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 3, 12, 1, true), colMat);
    col.position.copy(pos); col.position.y += 1.5;
    this._add(col, life * 0.7, (t) => {
      col.scale.set(1 + t * radius * 0.35, 1, 1 + t * radius * 0.35);
      colMat.opacity = 0.25 * (1 - t);
    });
  }

  telegraph(pos, radius, color = 0xff4668, life = 0.5) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 1, 40), mat);
    ring.rotation.x = -Math.PI / 2; ring.position.copy(pos); ring.position.y += 0.04;
    this._add(ring, life, (t) => {
      const s = radius * (0.3 + t * 0.7);
      ring.scale.set(s, s, s);
      mat.opacity = 0.25 + Math.sin(t * Math.PI * 5) * 0.2 + t * 0.15;
    });
    const discMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 32), discMat);
    disc.rotation.x = -Math.PI / 2; disc.position.copy(pos); disc.position.y += 0.03;
    this._add(disc, life, (t) => { const s = radius * t; disc.scale.set(s, s, s); discMat.opacity = 0.16 * (1 - t); });
  }

  damageNumber(pos, amount, style = 'white') {
    const color = style === 'gold' ? '#ffd37a' : style === 'heal' ? '#9dffcf' : '#e9fbff';
    const c = document.createElement('canvas'); c.width = 160; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 54px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(4,8,20,.85)';
    ctx.strokeText(String(amount), 80, 42);
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.fillText(String(amount), 80, 42);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.position.copy(pos); sp.position.y += 0.7;
    sp.scale.set(1.2, 0.6, 1); sp.renderOrder = 20;
    const start = sp.position.clone();
    this._add(sp, 0.85, (t) => {
      sp.position.y = start.y + t * 1.1;
      sp.position.x = start.x + Math.sin(t * 8) * 0.08;
      sp.material.opacity = 1 - t * t;
      const s = 1.2 * (0.7 + Math.min(0.5, t * 2));
      sp.scale.set(s, s * 0.5, 1);
    });
  }

  deathBurst(pos, color = 0x9dff8a) {
    this.shockwave(pos, 2.4, color, 0.6);
    this.hitSpark(pos, color, 26, 1.4, 0.9);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const soul = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), mat);
    soul.position.copy(pos);
    this._add(soul, 0.9, (t) => {
      soul.position.y = pos.y + t * 2.2;
      soul.scale.setScalar(1 + t * 0.8);
      mat.opacity = 0.8 * (1 - t);
    });
  }

  pickupBurst(pos, color = 0xffd37a) {
    this.hitSpark(pos, color, 12, 0.8, 0.6);
  }

  heal(pos) {
    this.shockwave(pos, 2.2, 0x9dffcf, 0.8);
    this.hitSpark(pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x9dffcf, 18, 0.9, 0.9);
  }

  levelUp(pos) {
    this.shockwave(pos, 4.5, 0xffd37a, 1.0);
    this.hitSpark(pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xffe7a9, 34, 1.4, 1.2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd37a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 32, 1, true), mat);
    ring.position.copy(pos); ring.position.y += 0.4;
    this._add(ring, 1.0, (t) => {
      ring.position.y = pos.y + 0.3 + t * 2.4;
      ring.scale.set(1 + t * 0.8, 1, 1 + t * 0.8);
      mat.opacity = 0.8 * (1 - t);
    });
  }

  magicBolt(origin, dir, hitTest, onExplode, color = 0x7df9ff) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    group.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(1.8, 1.8, 1); group.add(halo);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 6, 18), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = Math.PI / 2; group.add(ring);
    const light = new THREE.PointLight(color, 18, 12, 2);
    group.position.copy(origin); light.position.copy(origin);
    this.scene.add(group); this.scene.add(light);
    this.projectiles.push({
      mesh: group, light, pos: origin.clone(), dir: dir.clone().normalize(),
      speed: 23, age: 0, life: 1.6, trailTimer: 0, color, hitTest, onExplode,
    });
  }

  explode(pos, color = 0x7df9ff, onExplode) {
    this.shockwave(pos, 5.0, color, 0.8);
    this.hitSpark(pos, color, 34, 1.6, 0.9);
    const light = new THREE.PointLight(color, 35, 16, 2);
    light.position.copy(pos); this.scene.add(light);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mat);
    sphere.position.copy(pos);
    this._add(sphere, 0.5, (t) => {
      sphere.scale.setScalar(1 + t * 9);
      mat.opacity = 1 - t;
      light.intensity = 35 * (1 - t);
      if (t > 0.9) this.scene.remove(light);
    });
    onExplode?.(pos);
  }

  swordTrail(pos, yaw, color = 0x7df9ff) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.45, 18, 1, Math.PI / 2 - 0.65, 1.3), mat);
    arc.rotation.x = Math.PI / 2; arc.rotation.y = yaw;
    arc.position.copy(pos); arc.position.y += 1.05;
    this._add(arc, 0.18, (t) => { mat.opacity = 0.5 * (1 - t); arc.scale.setScalar(1 + t * 0.4); });
  }
}
