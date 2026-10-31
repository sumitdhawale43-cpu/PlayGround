import * as THREE from 'three';
import { createWorld } from './world.js';
import { createRifle } from './weapons.js';
import { Enemy } from './enemies.js';
import { ui } from './ui.js';

const EYE = 1.7;
const CROUCH_EYE = 1.12;
const RADIUS = 0.42;
const MAG_SIZE = 30;
const RELOAD_TIME = 1.85;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const rand = (a, b) => a + Math.random() * (b - a);

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _tmp = new THREE.Vector3();

export class Game {
  constructor({ renderer, scene, camera, audio }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.audio = audio;
    this.world = createWorld(scene);

    this.rig = new THREE.Group();
    scene.add(this.rig);
    this.rig.add(camera);
    this.rig.position.set(0, EYE, 30);

    this.weapon = createRifle();
    this.weapon.group.visible = false;
    camera.add(this.weapon.group);

    this.flashlight = new THREE.SpotLight(0xd6e8ff, 0, 52, 0.52, 0.72, 2);
    this.flashlight.position.set(0.42, -0.015, -1.02);
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0.08, -0.2, -14);
    camera.add(lightTarget);
    this.flashlight.target = lightTarget;
    camera.add(this.flashlight);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 200;

    this.enemies = [];
    this.effects = [];
    this.decals = [];
    this.grenades = [];

    this.mode = 'menu';
    this.time = 0;
    this.menuTime = 0;
    this.aimT = 0;
    this.recoil = 0;
    this.recoilPitch = 0;
    this.flashT = 0;
    this.shake = 0;
    this.lookSwayX = 0;
    this.lookSwayY = 0;
    this.hudTimer = 0;
    this.radarTimer = 0;
    this.stepTimer = 0;
    this.grenadeCooldown = 0;
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.sensitivity = parseFloat(localStorage.getItem('nf-sens') || '1') || 1;
    this.invertY = localStorage.getItem('nf-invert') === '1';
    this.adsHeld = false;
    this.adsToggle = false;
    this.crouch = false;
    this.firing = false;
    this.touchMove = { x: 0, z: 0 };
    this.touchLook = null;
    this.joy = null;
    this.keys = {};

    this.resetStats();
    this.bindInput();
    this.setMenuCamera();
    ui.setMobile(this.touch);
  }

  resetStats() {
    this.player = {
      pos: new THREE.Vector3(0, 0, 30),
      vel: new THREE.Vector3(),
      velY: 0,
      yaw: 0,
      pitch: 0,
      health: 100,
      ammo: MAG_SIZE,
      reserve: 150,
      reloading: false,
      reloadT: 0,
      grounded: true,
      sprinting: false,
      lastDamage: -99,
      eye: EYE,
    };
    this.wave = 0;
    this.score = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.grenadesLeft = 3;
    this.waveState = { phase: 'idle', toSpawn: 0, alive: 0, spawnTimer: 0, intermission: 0 };
    this.aimT = 0;
    this.recoil = 0;
    this.recoilPitch = 0;
    this.flashT = 0;
    this.shake = 0;
  }

  clearEntities() {
    for (const e of this.enemies) {
      this.scene.remove(e.root);
      e.dispose();
    }
    this.enemies.length = 0;
    for (const fx of this.effects) fx.dispose?.();
    this.effects.length = 0;
    for (const d of this.decals) {
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose(); d.mesh.material.dispose();
    }
    this.decals.length = 0;
    for (const g of this.grenades) {
      this.scene.remove(g.mesh);
      g.mesh.geometry.dispose(); g.mesh.material.dispose();
    }
    this.grenades.length = 0;
  }

  setMenuCamera() {
    this.rig.position.set(0, 4.4, 34);
    this.rig.rotation.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.camera.fov = 62;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 2.2, 0);
    this.weapon.group.visible = false;
    this.flashlight.intensity = 0;
  }

  start() {
    this.clearEntities();
    this.resetStats();
    this.player.pos.set(0, 0, 30);
    this.player.yaw = 0;
    this.player.pitch = -0.02;
    this.rig.position.set(0, EYE, 30);
    this.rig.rotation.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.camera.fov = 76;
    this.camera.updateProjectionMatrix();
    this.weapon.group.visible = true;
    this.weapon.group.position.set(0.20, -0.165, -0.47);
    this.flashlight.intensity = 130;
    this.weapon.group.rotation.set(0, 0.035, -0.015);
    this.mode = 'playing';
    this.firing = false;
    this.adsHeld = false;
    this.adsToggle = false;
    this.crouch = false;
    this.wave = 0;
    ui.showHUD();
    ui.resetRun();
    ui.banner('OPERATION BLACKOUT', 'HOLD THE ZONE', 'CLEAR EVERY WAVE', 2600);
    this.startWave();
    if (!this.touch) this.requestLock();
  }

  restart() { this.start(); }

  requestLock() {
    if (this.touch) return;
    const canvas = this.renderer.domElement;
    if (document.pointerLockElement !== canvas) {
      try {
        const p = canvas.requestPointerLock?.();
        if (p && p.catch) p.catch(() => {});
      } catch {}
    }
  }

  toMenu() {
    this.mode = 'menu';
    this.firing = false;
    this.clearEntities();
    this.resetStats();
    this.weapon.group.visible = false;
    this.flashlight.intensity = 0;
    ui.showMenu();
    this.setMenuCamera();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  pause() {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.firing = false;
    this.adsHeld = false;
    this.keys = {};
    this.touchMove.x = this.touchMove.z = 0;
    if (this.touchLook) { this.touchLook = null; this.resetJoystick(); }
    ui.showPause(this.wave, this.score);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  resume() {
    if (this.mode !== 'paused') return;
    this.mode = 'playing';
    ui.showHUD();
    this.requestLock();
  }

  gameOver() {
    if (this.mode !== 'playing') return;
    this.mode = 'over';
    this.firing = false;
    const accuracy = this.shotsFired ? Math.round(this.shotsHit / this.shotsFired * 100) : 0;
    ui.showGameOver({
      waves: Math.max(0, this.wave - 1),
      kills: this.kills,
      accuracy,
      score: this.score,
    });
    if (document.pointerLockElement) document.exitPointerLock();
    this.audio.hurt();
  }

  /* ------------------------------------------------------------------ */
  bindInput() {
    const canvas = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;
      if (e.code === 'Escape') {
        const modalOpen = ['screen-settings', 'screen-briefing']
          .some(id => !document.getElementById(id).classList.contains('hidden'));
        if (modalOpen) return;
        if (this.mode === 'playing') this.pause();
        else if (this.mode === 'paused') this.resume();
        return;
      }
      if (this.mode !== 'playing') return;
      if (e.code === 'KeyR') this.reload();
      if (e.code === 'KeyG') this.throwGrenade();
      if (e.code === 'KeyC') this.crouch = !this.crouch;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => {
      this.keys = {};
      this.firing = false;
      this.adsHeld = false;
      if (this.mode === 'playing') this.pause();
    });

    canvas.addEventListener('mousedown', (e) => {
      if (this.touch || this.mode !== 'playing') return;
      if (document.pointerLockElement !== canvas) {
        this.requestLock();
        return;
      }
      if (e.button === 0) this.firing = true;
      if (e.button === 2) this.adsHeld = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.firing = false;
      if (e.button === 2) this.adsHeld = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.touch || this.mode !== 'playing') return;
      if (document.pointerLockElement !== canvas) return;
      const s = 0.0021 * this.sensitivity;
      this.player.yaw -= e.movementX * s;
      this.player.pitch -= e.movementY * s * (this.invertY ? -1 : 1);
      this.player.pitch = clamp(this.player.pitch, -1.42, 1.42);
      this.lookSwayX = clamp(this.lookSwayX - e.movementX * 0.0005, -0.04, 0.04);
      this.lookSwayY = clamp(this.lookSwayY - e.movementY * 0.0004, -0.03, 0.03);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.mode === 'playing' && !this.touch) this.pause();
    });
    document.addEventListener('pointerlockerror', () => {
      // Some embedded browsers reject pointer lock; keep the game playable via click-drag.
    });

    /* ---------------- touch ---------------- */
    const joyBase = document.getElementById('joy-base');
    const joyKnob = document.getElementById('joy-knob');
    if (joyBase) {
      const setJoy = (e) => {
        const r = joyBase.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const max = r.width / 2 - 12;
        const len = Math.hypot(dx, dy);
        if (len > max) { dx = dx / len * max; dy = dy / len * max; }
        joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.touchMove.x = dx / max;
        this.touchMove.z = -dy / max;
      };
      joyBase.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        this.joy = e.pointerId;
        try { joyBase.setPointerCapture(e.pointerId); } catch {}
        setJoy(e);
      });
      joyBase.addEventListener('pointermove', (e) => {
        if (this.joy !== e.pointerId) return;
        e.preventDefault(); setJoy(e);
      });
      const endJoy = (e) => {
        if (this.joy !== e.pointerId) return;
        this.joy = null; this.resetJoystick();
      };
      joyBase.addEventListener('pointerup', endJoy);
      joyBase.addEventListener('pointercancel', endJoy);
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.touch || this.mode !== 'playing' || e.pointerType === 'mouse') return;
      if (this.touchLook) return;
      this.touchLook = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.touch || !this.touchLook || this.touchLook.id !== e.pointerId) return;
      const dx = e.clientX - this.touchLook.x;
      const dy = e.clientY - this.touchLook.y;
      this.touchLook.x = e.clientX;
      this.touchLook.y = e.clientY;
      const s = 0.0048 * this.sensitivity;
      this.player.yaw -= dx * s;
      this.player.pitch -= dy * s * (this.invertY ? -1 : 1);
      this.player.pitch = clamp(this.player.pitch, -1.42, 1.42);
    });
    const endLook = (e) => {
      if (this.touchLook && this.touchLook.id === e.pointerId) this.touchLook = null;
    };
    canvas.addEventListener('pointerup', endLook);
    canvas.addEventListener('pointercancel', endLook);

    this.bindTouchButton('btn-touch-fire', (down) => { this.firing = down; }, true);
    this.bindTouchButton('btn-touch-ads', (down) => { this.adsToggle = down; this.adsHeld = down; }, true);
    this.bindTouchButton('btn-touch-reload', () => this.reload(), false, true);
    this.bindTouchButton('btn-touch-jump', () => { if (this.player.grounded) this.player.velY = 5.4; }, false, true);
    this.bindTouchButton('btn-touch-grenade', () => this.throwGrenade(), false, true);
  }

  bindTouchButton(id, fn, hold = false, tap = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      el.classList.add('pressed');
      if (tap) { fn(true); setTimeout(() => el.classList.remove('pressed'), 140); return; }
      fn(true);
      if (hold) {
        try { el.setPointerCapture(e.pointerId); } catch {}
        const up = () => {
          el.classList.remove('pressed');
          fn(false);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
        };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      } else {
        setTimeout(() => el.classList.remove('pressed'), 140);
      }
    });
  }

  resetJoystick() {
    this.touchMove.x = 0; this.touchMove.z = 0;
    const knob = document.getElementById('joy-knob');
    if (knob) knob.style.transform = 'translate(0px, 0px)';
  }

  /* ------------------------------------------------------------------ */
  update(dt) {
    this.time += dt;
    this.world.update(dt, this.time);

    if (this.mode === 'menu') {
      this.updateMenuCamera(dt);
      this.updateEffects(dt);
      return;
    }
    if (this.mode === 'paused' || this.mode === 'over') {
      this.updateEffects(dt * 0.15);
      return;
    }

    this.updatePlayer(dt);
    this.updateWeapon(dt);
    this.updateEnemies(dt);
    this.updateGrenades(dt);
    this.updateEffects(dt);
    this.updateWaves(dt);
    this.updateAim(dt);
    this.updateCamera(dt);
    this.updateHud(dt);
  }

  updateMenuCamera(dt) {
    this.menuTime += dt;
    const a = this.menuTime * 0.045;
    this.rig.position.set(Math.sin(a) * 26, 4.2 + Math.sin(a * 1.7) * 0.9, Math.cos(a) * 26);
    this.rig.rotation.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.camera.lookAt(Math.sin(a * 0.7) * 6, 2.1 + Math.sin(a * 1.3) * 0.4, Math.cos(a * 0.7) * 6 - 5);
  }

  updatePlayer(dt) {
    const p = this.player;
    const k = this.keys;
    let ix = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + this.touchMove.x;
    let iz = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0) + this.touchMove.z;
    const ilen = Math.hypot(ix, iz);
    if (ilen > 1) { ix /= ilen; iz /= ilen; }

    const aimHeld = this.adsHeld || this.adsToggle;
    const sprint = (k.ShiftLeft || k.ShiftRight) && iz > 0.35 && !aimHeld && !this.firing;
    p.sprinting = sprint;
    const speed = this.crouch ? 3.1 : sprint ? 8.3 : aimHeld ? 3.8 : 5.5;

    _forward.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    _right.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const wx = (_forward.x * iz + _right.x * ix) * speed;
    const wz = (_forward.z * iz + _right.z * ix) * speed;

    p.vel.x = damp(p.vel.x, wx, p.grounded ? 13 : 3.5, dt);
    p.vel.z = damp(p.vel.z, wz, p.grounded ? 13 : 3.5, dt);

    if (k.Space && p.grounded) {
      p.velY = 5.3;
      p.grounded = false;
      k.Space = false;
      this.audio.footstep(true);
    }
    if (!p.grounded) {
      p.velY -= 16.5 * dt;
      p.pos.y += p.velY * dt;
      if (p.pos.y <= 0) {
        p.pos.y = 0; p.velY = 0; p.grounded = true;
        this.audio.footstep(this.touchMove.z > 0.2);
      }
    }

    const moved = this.moveEntity(p.pos, p.vel.x * dt, p.vel.z * dt, RADIUS);
    if (moved < 0.001) { p.vel.x *= 0.8; p.vel.z *= 0.8; }

    const horiz = Math.hypot(p.vel.x, p.vel.z);
    this.stepTimer -= dt;
    if (p.grounded && horiz > 1.2 && this.stepTimer <= 0) {
      this.stepTimer = sprint ? 0.32 : 0.48;
      this.audio.footstep(sprint);
    }

    // crouch eye height
    const targetEye = this.crouch ? CROUCH_EYE : EYE;
    p.eye = damp(p.eye, targetEye, 12, dt);
    const bob = p.grounded ? Math.sin(this.time * (sprint ? 14 : 10)) * Math.min(0.045, horiz * 0.008) : 0;
    const sideBob = p.grounded ? Math.cos(this.time * (sprint ? 7 : 5)) * Math.min(0.02, horiz * 0.003) : 0;
    this.rig.position.set(p.pos.x + sideBob * 0.3, p.pos.y + p.eye + bob, p.pos.z);

    // regeneration
    if (this.time - p.lastDamage > 5.5 && p.health < 100 && p.health > 0) {
      p.health = Math.min(100, p.health + 7.5 * dt);
    }
    if (p.reloading) {
      p.reloadT += dt;
      if (p.reloadT >= RELOAD_TIME) {
        const need = MAG_SIZE - p.ammo;
        const take = Math.min(need, p.reserve);
        p.ammo += take;
        p.reserve -= take;
        p.reloading = false;
        p.reloadT = 0;
        this.audio.reloadEnd();
      }
    }
  }

  updateAim(dt) {
    const target = (this.adsHeld || this.adsToggle) ? 1 : 0;
    this.aimT = damp(this.aimT, target, 14, dt);
  }

  updateCamera(dt) {
    const p = this.player;
    this.rig.rotation.y = p.yaw;
    this.recoilPitch = damp(this.recoilPitch, 0, 7.5, dt);
    this.shake = damp(this.shake, 0, 8, dt);
    const sh = this.shake;
    this.camera.rotation.x = p.pitch + this.recoilPitch + (Math.random() - 0.5) * sh * 0.055;
    this.camera.rotation.z = -this.touchMove.x * 0.012 + (Math.random() - 0.5) * sh * 0.07;
    this.camera.position.y = (Math.random() - 0.5) * sh * 0.04;
    const aspect = window.innerWidth / window.innerHeight;
    const baseFov = this.touch && aspect < 1 ? 88 : 76;
    const fov = baseFov - this.aimT * 22 + (p.sprinting ? 5 : 0);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.lookSwayX = damp(this.lookSwayX, 0, 9, dt);
    this.lookSwayY = damp(this.lookSwayY, 0, 9, dt);
  }

  updateWeapon(dt) {
    const p = this.player;
    const g = this.weapon.group;
    if (!g.visible) return;

    const aim = this.aimT;
    const hip = { x: 0.20, y: -0.165, z: -0.47 };
    const ads = { x: 0, y: -0.0829, z: -0.50 };
    const speed = Math.hypot(p.vel.x, p.vel.z);
    const bobScale = (1 - aim * 0.82) * (p.grounded ? 1 : 0.25);
    const bobX = Math.sin(this.time * 9) * 0.008 * Math.min(1, speed / 5) * bobScale;
    const bobY = Math.abs(Math.cos(this.time * 9)) * 0.008 * Math.min(1, speed / 5) * bobScale;
    const sprintDrop = p.sprinting ? 1 : 0;

    const reloadBend = p.reloading ? Math.sin(Math.min(1, p.reloadT / RELOAD_TIME) * Math.PI) : 0;

    g.position.x = damp(g.position.x, hip.x + (ads.x - hip.x) * aim + bobX + this.lookSwayX, 16, dt);
    g.position.y = damp(g.position.y, hip.y + (ads.y - hip.y) * aim - bobY + this.lookSwayY - sprintDrop * 0.055 - reloadBend * 0.09, 16, dt);
    g.position.z = damp(g.position.z, hip.z + (ads.z - hip.z) * aim + this.recoil * 0.035, 16, dt);
    g.rotation.x = damp(g.rotation.x, this.recoil * 0.08 + reloadBend * 0.32, 14, dt);
    g.rotation.y = damp(g.rotation.y, 0.035 * (1 - aim) + this.lookSwayX * 0.5, 14, dt);
    g.rotation.z = damp(g.rotation.z, -0.015 * (1 - aim) - this.lookSwayX * 0.8 + reloadBend * 0.25, 14, dt);

    this.recoil = damp(this.recoil, 0, 13, dt);

    // firing
    if (this.firing && !p.reloading) {
      if (p.ammo > 0) {
        this.tryFire();
      } else if (p.reserve > 0) {
        this.reload();
      } else if (this.time > (this._dryTime || 0)) {
        this._dryTime = this.time + 0.35;
        this.audio.dry();
      }
    }

    // muzzle flash decay
    if (this.flashT > 0) {
      this.flashT -= dt;
      const f = Math.max(0, this.flashT / 0.05);
      this.weapon.flash.material.opacity = f;
      this.weapon.flashLight.intensity = f * 14;
    } else {
      this.weapon.flash.material.opacity = 0;
      this.weapon.flashLight.intensity = 0;
    }

    // crosshair
    const spread = 7 + Math.min(10, speed * 0.55) + (p.grounded ? 0 : 6) + this.recoil * 5 - aim * 4.5;
    ui.setCrosshair(spread, aim > 0.55);
  }

  tryFire() {
    const p = this.player;
    if (this.time < (this.nextShot || 0)) return;
    if (p.ammo <= 0) return;
    this.nextShot = this.time + 0.088;
    p.ammo--;
    this.shotsFired++;

    const moving = Math.hypot(p.vel.x, p.vel.z) > 1;
    const spread = (this.aimT > 0.6 ? 0.0022 : 0.007) + (moving ? 0.009 : 0) + (p.grounded ? 0 : 0.02) + this.recoil * 0.006;
    this.camera.getWorldPosition(_origin);
    _dir.set(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()));
    _dir.x += rand(-spread, spread);
    _dir.y += rand(-spread, spread);
    _dir.z += rand(-spread, spread) * 0.3;
    _dir.normalize();

    this.raycaster.set(_origin, _dir);
    this.raycaster.far = 200;
    const targets = this.world.solidMeshes.slice();
    for (const e of this.enemies) if (e.alive) targets.push(...e.hitMeshes);
    const hits = this.raycaster.intersectObjects(targets, false);

    const muzzleWorld = this.weapon.muzzle.getWorldPosition(new THREE.Vector3());
    let end = null;
    let hitEnemy = false;

    if (hits.length) {
      const hit = hits[0];
      end = hit.point.clone();
      if (hit.object.userData.enemy && hit.object.userData.enemy.alive) {
        const enemy = hit.object.userData.enemy;
        const mult = hit.object.userData.hitMult || 1;
        const headshot = mult >= 3;
        const dmg = 34 * mult;
        const killed = enemy.takeDamage(dmg, hit.point.clone(), headshot);
        this.shotsHit++;
        ui.hitmarker(killed);
        hitEnemy = true;
      } else {
        const normal = hit.face
          ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
          : _dir.clone().negate();
        this.addImpact(hit.point, normal, hit.object.userData.solid);
      }
    } else {
      end = _origin.clone().addScaledVector(_dir, 120);
    }

    if (!hitEnemy) {
      const tracerEnd = end || _origin.clone().addScaledVector(_dir, 60);
      this.addTracer(muzzleWorld, tracerEnd, 0xffd79a, 0.055);
    } else {
      this.addTracer(muzzleWorld, end, 0xffe2b0, 0.045);
    }

    // muzzle flash + recoil
    this.flashT = 0.05;
    const mat = this.weapon.flash.material;
    mat.rotation = Math.random() * Math.PI * 2;
    mat.opacity = 1;
    this.weapon.flash.scale.setScalar(0.44 + Math.random() * 0.2);
    this.weapon.flashLight.intensity = 16;
    this.audio.shot();
    this.recoil = Math.min(1.9, this.recoil + 0.75);
    const kick = (this.aimT > 0.6 ? 0.0042 : 0.0085) * (0.85 + Math.random() * 0.3);
    this.player.pitch = clamp(this.player.pitch + kick, -1.42, 1.42);
    this.shake = Math.min(1, this.shake + 0.035);
    this.ejectShell();

    // ammo empty → auto reload after brief delay
    if (p.ammo === 0 && p.reserve > 0) {
      setTimeout(() => { if (this.mode === 'playing' && !this.player.reloading && this.player.ammo === 0) this.reload(); }, 260);
    }
  }

  reload() {
    const p = this.player;
    if (p.reloading || p.ammo >= MAG_SIZE || p.reserve <= 0 || this.mode !== 'playing') return;
    p.reloading = true;
    p.reloadT = 0;
    this.audio.reloadStart();
  }

  throwGrenade() {
    if (this.mode !== 'playing' || this.grenadesLeft <= 0 || this.grenadeCooldown > 0) return;
    this.grenadesLeft--;
    this.grenadeCooldown = 0.6;
    const camPos = this.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()));
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x27302a, roughness: 0.6, metalness: 0.4, emissive: 0xff2e18, emissiveIntensity: 0.22 })
    );
    mesh.position.copy(camPos).addScaledVector(dir, 0.7);
    mesh.castShadow = true;
    this.scene.add(mesh);
    const vel = dir.clone().multiplyScalar(15).add(new THREE.Vector3(0, 3.2, 0)).add(this.player.vel.clone().multiplyScalar(0.5));
    this.grenades.push({ mesh, vel, fuse: 2.35 });
    this.audio.footstep(true);
  }

  updateGrenades(dt) {
    this.grenadeCooldown = Math.max(0, this.grenadeCooldown - dt);
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuse -= dt;
      g.vel.y -= 17 * dt;
      g.mesh.position.addScaledVector(g.vel, dt);
      g.mesh.rotation.x += dt * 6;
      g.mesh.rotation.z += dt * 4;
      if (g.mesh.position.y < 0.1) {
        g.mesh.position.y = 0.1;
        g.vel.y *= -0.4;
        g.vel.x *= 0.72; g.vel.z *= 0.72;
        if (Math.abs(g.vel.y) < 0.5) g.vel.y = 0;
      }
      if (Math.abs(g.mesh.position.x) > 46) { g.mesh.position.x = clamp(g.mesh.position.x, -46, 46); g.vel.x *= -0.5; }
      if (Math.abs(g.mesh.position.z) > 46) { g.mesh.position.z = clamp(g.mesh.position.z, -46, 46); g.vel.z *= -0.5; }
      // bounce off crates
      for (const c of this.world.colliders) {
        const p = g.mesh.position;
        if (p.x > c.min.x - 0.1 && p.x < c.max.x + 0.1 && p.z > c.min.z - 0.1 && p.z < c.max.z + 0.1 && p.y < c.max.y + 0.1) {
          if (p.y > c.min.y + 0.05) {
            p.y = c.max.y + 0.12;
            g.vel.y = Math.abs(g.vel.y) * 0.35;
          }
        }
      }
      if (g.fuse <= 0) {
        this.explode(g.mesh.position.clone());
        this.scene.remove(g.mesh);
        g.mesh.geometry.dispose(); g.mesh.material.dispose();
        this.grenades.splice(i, 1);
      }
    }
  }

  explode(pos) {
    this.audio.explosion();
    const flashGeo = new THREE.SphereGeometry(0.6, 16, 12);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos); this.scene.add(flash);
    const light = new THREE.PointLight(0xff8a3a, 120, 30, 2);
    light.position.copy(pos).add(new THREE.Vector3(0, 0.6, 0)); this.scene.add(light);
    let t = 0;
    this.addEffect({
      update: (dt) => {
        t += dt;
        flash.scale.setScalar(1 + t * 9);
        flashMat.opacity = Math.max(0, 1 - t * 2.4);
        light.intensity = Math.max(0, 120 * (1 - t * 3));
        if (t > 0.55) { light.intensity = 0; return false; }
        return true;
      },
      dispose: () => { this.scene.remove(flash); this.scene.remove(light); flashGeo.dispose(); flashMat.dispose(); },
    });
    this.addSparks(pos, 46, 0xffa54a, 10, 0.018);
    this.addSmoke(pos, 16, 0x2a2622, 1.0);

    // damage
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = e.position.distanceTo(pos);
      if (d < 8) {
        const dmg = 170 * (1 - d / 8) + 25;
        const killed = e.takeDamage(dmg, e.position.clone().add(new THREE.Vector3(0, 1.2, 0)), false);
        if (killed) ui.hitmarker(true);
      }
    }
    const pd = new THREE.Vector3(this.player.pos.x, 0, this.player.pos.z).distanceTo(pos);
    if (pd < 5.4) this.damagePlayer(38 * (1 - pd / 5.4), pos);
    this.shake = Math.min(1.3, this.shake + 0.9);
  }

  /* ------------------------------------------------------------------ */
  updateEnemies(dt) {
    for (const e of this.enemies) e.update(dt, this.time);
    // keep array tidy
    if (this.enemies.length > 24) {
      this.enemies = this.enemies.filter(e => !e.removed);
    }
  }

  updateWaves(dt) {
    const ws = this.waveState;
    if (ws.phase === 'idle') return;

    if (ws.phase === 'intermission') {
      ws.intermission -= dt;
      if (ws.intermission <= 0) this.startWave();
      return;
    }

    if (ws.phase === 'active') {
      if (ws.toSpawn > 0) {
        ws.spawnTimer -= dt;
        if (ws.spawnTimer <= 0) {
          const maxAlive = Math.min(4 + Math.floor(this.wave / 2), 10);
          if (ws.alive < maxAlive) {
            this.spawnEnemy();
            ws.toSpawn--;
            ws.alive++;
            ws.spawnTimer = Math.max(0.45, 1.45 - this.wave * 0.05) * (0.8 + Math.random() * 0.4);
          } else {
            ws.spawnTimer = 0.35;
          }
        }
      }
      if (ws.toSpawn <= 0 && ws.alive <= 0) {
        const bonus = 250 * this.wave;
        this.score += bonus;
        ws.phase = 'intermission';
        ws.intermission = 5.2;
        this.player.reserve = Math.min(300, this.player.reserve + 90);
        this.grenadesLeft = Math.min(4, this.grenadesLeft + 2);
        ui.banner('SECTOR CLEAR', `WAVE ${String(this.wave).padStart(2, '0')} CLEARED`, `+${bonus} · REARMING`, 2600);
        this.audio.wave();
      }
    }
  }

  startWave() {
    this.wave++;
    const count = Math.min(18, 4 + Math.ceil(this.wave * 1.6));
    this.waveState = {
      phase: 'active',
      toSpawn: count,
      alive: 0,
      spawnTimer: 0.5,
      intermission: 0,
    };
    ui.banner('INCOMING', `WAVE ${String(this.wave).padStart(2, '0')}`, `${count} HOSTILES · HOLD POSITION`, 2400);
    this.audio.wave();
  }

  spawnEnemy() {
    const p = this.player.pos;
    const candidates = this.world.spawnPoints.filter(sp => Math.hypot(sp.x - p.x, sp.z - p.z) > 15);
    let pos = (candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : this.world.spawnPoints[0]).clone();
    // avoid overlapping other enemies
    for (let attempt = 0; attempt < 6; attempt++) {
      const close = this.enemies.some(e => e.alive && e.position.distanceTo(pos) < 2.2);
      if (!close) break;
      pos = this.world.spawnPoints[Math.floor(Math.random() * this.world.spawnPoints.length)].clone();
    }
    const tier = 1 + Math.floor((this.wave - 1) / 2);
    const enemy = new Enemy(this, pos, tier);
    this.enemies.push(enemy);
    this.addSparks(pos.clone().add(new THREE.Vector3(0, 1, 0)), 18, 0xff4a20, 4, 0.03);
    this.addSmoke(pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 6, 0x3a2018, 0.7);
  }

  moveEntity(pos, dx, dz, radius) {
    const sx = pos.x, sz = pos.z;
    pos.x += dx;
    pos.z += dz;
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.world.colliders) {
        const cx = clamp(pos.x, c.min.x, c.max.x);
        const cz = clamp(pos.z, c.min.z, c.max.z);
        let ox = pos.x - cx, oz = pos.z - cz;
        let d = Math.hypot(ox, oz);
        if (d < radius) {
          if (d < 0.0001) {
            // inside — push out along the shortest axis
            const left = Math.abs(pos.x - c.min.x), rightA = Math.abs(c.max.x - pos.x);
            const back = Math.abs(pos.z - c.min.z), front = Math.abs(c.max.z - pos.z);
            const m = Math.min(left, rightA, back, front);
            if (m === left) pos.x = c.min.x - radius;
            else if (m === rightA) pos.x = c.max.x + radius;
            else if (m === back) pos.z = c.min.z - radius;
            else pos.z = c.max.z + radius;
          } else {
            const push = (radius - d) / d;
            pos.x += ox * push;
            pos.z += oz * push;
          }
        }
      }
    }
    pos.x = clamp(pos.x, -46.4, 46.4);
    pos.z = clamp(pos.z, -46.4, 46.4);
    return Math.hypot(pos.x - sx, pos.z - sz);
  }

  lineOfSight(from, to) {
    _tmp.copy(to).sub(from);
    const dist = _tmp.length();
    if (dist < 0.01) return true;
    _tmp.multiplyScalar(1 / dist);
    this.raycaster.set(from, _tmp);
    this.raycaster.far = Math.max(0.1, dist - 0.25);
    const hits = this.raycaster.intersectObjects(this.world.solidMeshes, false);
    return hits.length === 0;
  }

  damagePlayer(amount, source) {
    const p = this.player;
    if (this.mode !== 'playing' || p.health <= 0) return;
    p.health -= amount;
    p.lastDamage = this.time;
    this.shake = Math.min(1.2, this.shake + amount * 0.018);

    const dx = source.x - p.pos.x, dz = source.z - p.pos.z;
    _forward.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    _right.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const angle = Math.atan2(dx * _right.x + dz * _right.z, dx * _forward.x + dz * _forward.z) * 180 / Math.PI;
    ui.damage(angle);
    this.audio.hurt();
    if (p.health <= 0) {
      p.health = 0;
      this.gameOver();
    }
  }

  onEnemyKilled(enemy, headshot) {
    this.waveState.alive = Math.max(0, this.waveState.alive - 1);
    this.kills++;
    this.score += 100 + (headshot ? 75 : 0) + this.wave * 10;
    ui.killfeed(headshot);
    ui.hitmarker(true);
    this.audio.kill();
    this.addSparks(enemy.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 20, 0x9a1c12, 4, 0.035);
  }

  updateHud(dt) {
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.09;
      ui.updateHUD({
        health: this.player.health,
        ammo: this.player.ammo,
        reserve: this.player.reserve,
        grenades: this.grenadesLeft,
        wave: this.wave,
        score: this.score,
        remaining: this.waveState.toSpawn + this.waveState.alive,
        reloading: this.player.reloading,
        reloadProgress: this.player.reloadT / RELOAD_TIME,
      });
    }
    this.radarTimer -= dt;
    if (this.radarTimer <= 0) {
      this.radarTimer = 0.07;
      ui.radar(this.enemies, this.player.pos, this.player.yaw, 0.07);
    }
    ui.updateCompass(this.player.yaw);
  }

  /* ------------------------------------------------------------------ */
  addEffect(effect) { this.effects.push(effect); }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      let alive = true;
      try { alive = fx.update(dt) !== false; } catch { alive = false; }
      if (!alive) {
        fx.dispose?.();
        this.effects.splice(i, 1);
      }
    }

    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.life -= dt;
      if (d.life < 3) d.mesh.material.opacity = Math.max(0, d.life / 3 * d.opacity);
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        this.decals.splice(i, 1);
      }
    }
  }

  addTracer(start, end, color = 0xffd58a, life = 0.06) {
    const geo = new THREE.BufferGeometry().setFromPoints([start.clone(), end.clone()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    this.scene.add(line);
    let t = 0;
    this.addEffect({
      update: (dt) => {
        t += dt;
        mat.opacity = Math.max(0, 0.9 * (1 - t / life));
        return t < life;
      },
      dispose: () => { this.scene.remove(line); geo.dispose(); mat.dispose(); },
    });
  }

  addImpact(point, normal, isWorld = true) {
    this.addSparks(point, isWorld ? 7 : 4, 0xffc07a, 3.2, 0.014);
    // decal
    const geo = new THREE.CircleGeometry(0.055 + Math.random() * 0.03, 7);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0b0a09, transparent: true, opacity: 0.82,
      polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false,
    });
    const decal = new THREE.Mesh(geo, mat);
    decal.position.copy(point).addScaledVector(normal, 0.012);
    decal.lookAt(point.clone().add(normal));
    decal.rotateZ(Math.random() * Math.PI * 2);
    this.scene.add(decal);
    this.decals.push({ mesh: decal, life: 13, opacity: 0.82 });
    if (this.decals.length > 55) {
      const old = this.decals.shift();
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose(); old.mesh.material.dispose();
    }
  }

  addImpactRay(origin, target) {
    _tmp.copy(target).sub(origin);
    const dist = _tmp.length();
    _tmp.multiplyScalar(1 / dist);
    this.raycaster.set(origin, _tmp);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(this.world.solidMeshes, false);
    if (hits.length) {
      const h = hits[0];
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : _tmp.clone().negate();
      this.addSparks(h.point, 4, 0xffb060, 2.6, 0.013);
    }
  }

  addSparks(pos, count, color, speed = 4, size = 0.02) {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x; positions[i * 3 + 1] = pos.y; positions[i * 3 + 2] = pos.z;
      const v = new THREE.Vector3(rand(-1, 1), rand(-0.2, 1), rand(-1, 1)).normalize().multiplyScalar(speed * (0.25 + Math.random()));
      velocities.push(v);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    let t = 0;
    const life = 0.4 + Math.random() * 0.25;
    this.addEffect({
      update: (dt) => {
        t += dt;
        const arr = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
          velocities[i].y -= 9 * dt;
          arr[i * 3] += velocities[i].x * dt;
          arr[i * 3 + 1] += velocities[i].y * dt;
          arr[i * 3 + 2] += velocities[i].z * dt;
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = Math.max(0, 1 - t / life);
        return t < life;
      },
      dispose: () => { this.scene.remove(pts); geo.dispose(); mat.dispose(); },
    });
  }

  addSmoke(pos, count, color, spread = 1, size = 0.5) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x + rand(-spread, spread) * 0.35;
      positions[i * 3 + 1] = pos.y + rand(0, spread);
      positions[i * 3 + 2] = pos.z + rand(-spread, spread) * 0.35;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.35, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    let t = 0;
    const life = 1.6;
    this.addEffect({
      update: (dt) => {
        t += dt;
        const arr = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
          arr[i * 3 + 1] += dt * (0.5 + i % 4 * 0.18);
          arr[i * 3] += Math.sin(t + i) * dt * 0.15;
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = Math.max(0, 0.35 * (1 - t / life));
        mat.size = size * (1 + t * 0.9);
        return t < life;
      },
      dispose: () => { this.scene.remove(pts); geo.dispose(); mat.dispose(); },
    });
  }

  spawnBlood(pos, headshot) {
    this.addSparks(pos, headshot ? 18 : 9, headshot ? 0xff3b2a : 0xaa2218, headshot ? 5 : 3.2, 0.026);
  }

  ejectShell() {
    const geo = new THREE.CylinderGeometry(0.008, 0.008, 0.032, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0xc39a3d, roughness: 0.35, metalness: 0.8 });
    const shell = new THREE.Mesh(geo, mat);
    this.weapon.ejectPort.getWorldPosition(shell.position);
    const vel = new THREE.Vector3(rand(1.2, 2.4), rand(0.8, 1.6), rand(-0.4, 0.4));
    vel.applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()));
    this.scene.add(shell);
    let t = 0;
    this.addEffect({
      update: (dt) => {
        t += dt;
        vel.y -= 13 * dt;
        shell.position.addScaledVector(vel, dt);
        shell.rotation.x += dt * 12;
        shell.rotation.z += dt * 7;
        if (shell.position.y < 0.02) { shell.position.y = 0.02; vel.y *= -0.25; vel.x *= 0.5; vel.z *= 0.5; }
        return t < 1.6;
      },
      dispose: () => { this.scene.remove(shell); geo.dispose(); mat.dispose(); },
    });
  }
}
