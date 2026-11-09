import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const angleLerp = (a, b, t) => {
  let d = ((b - a + Math.PI * 3) % TAU) - Math.PI;
  return a + d * t;
};
export const hashSeed = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const ELEMENT_COLORS = {
  Fire: 0xff6a2a, Ice: 0x74dcff, Lightning: 0xffe14e, Wind: 0x66ffc2, Shadow: 0xb06cff
};
export const ELEMENT_CSS = {
  Fire: '#ff7a3c', Ice: '#7bdcff', Lightning: '#ffe45e', Wind: '#77ffc6', Shadow: '#c07bff'
};

/* ================= AUDIO ================= */
export class AudioEngine {
  constructor() {
    this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    this.region = 'Aetheria'; this.boss = false; this.volume = 0.55; this.musicVolume = 0.5;
    this.nextNote = 0; this.step = 0; this.timer = null; this.ambient = null;
    this.scales = {
      Aetheria: { root: 220, mode: [0, 2, 4, 7, 9, 12, 14], bpm: 66 },
      Sakura: { root: 246.94, mode: [0, 2, 3, 7, 8, 12, 15], bpm: 60 },
      Ember: { root: 196, mode: [0, 1, 4, 6, 7, 10, 12], bpm: 74 },
      Frostfall: { root: 261.63, mode: [0, 2, 3, 7, 10, 12, 14], bpm: 54 },
      Celestial: { root: 293.66, mode: [0, 2, 4, 6, 9, 11, 14], bpm: 70 },
      Abyss: { root: 164.81, mode: [0, 1, 3, 6, 8, 11, 13], bpm: 58 }
    };
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.22 * this.musicVolume; this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.55; this.sfxGain.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.startMusic();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  setMusicVolume(v) { this.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = 0.22 * v; }
  setRegion(r) { this.region = r; }
  setBoss(b) { this.boss = b; }
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextNote = this.ctx.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.schedule(), 90);
  }
  schedule() {
    if (!this.ctx) return;
    const sc = this.scales[this.region] || this.scales.Aetheria;
    const bpm = this.boss ? sc.bpm + 26 : sc.bpm;
    const beat = 60 / bpm;
    while (this.nextNote < this.ctx.currentTime + 0.4) {
      this.playStep(this.step, this.nextNote, sc, beat);
      this.nextNote += beat / 2;
      this.step++;
      if (this.step > 63) this.step = 0;
    }
  }
  playStep(step, t, sc, beat) {
    const bar = Math.floor(step / 8) % 4;
    const roots = [0, 0, -3, 2];
    const chordRoot = sc.root * Math.pow(2, (roots[bar] + (this.boss ? 0 : 0)) / 12);
    if (step % 8 === 0) {
      const chord = [0, this.boss ? 3 : 4, 7, this.boss ? 10 : 12];
      chord.forEach((iv, i) => this.pad(t, chordRoot * Math.pow(2, iv / 12), beat * 4.1, i === 0 ? 0.11 : 0.06, i));
      this.pluck(t, chordRoot / 2, beat * 2, 0.12, 'sine');
      if (this.boss) this.drum(t, 0.16, 46);
    }
    if (step % 2 === 0) {
      const idx = (step / 2 + bar * 2) % sc.mode.length;
      const oct = step % 16 < 8 ? 1 : 2;
      const f = sc.root * Math.pow(2, sc.mode[idx] / 12) * oct;
      this.pluck(t + beat * 0.02, f, beat * 0.7, this.boss ? 0.06 : 0.045, 'triangle');
    }
    if (this.boss && step % 4 === 2) this.drum(t, 0.09, 70);
    if (this.boss && step % 8 === 4) this.hat(t, 0.05);
    if (!this.boss && step % 16 === 12) this.hat(t, 0.022);
  }
  pad(t, f, dur, vol, detune) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f2 = this.ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (detune - 1) * 7;
    f2.type = 'lowpass'; f2.frequency.value = 700; f2.Q.value = 0.7;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f2); f2.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + dur + 0.05);
  }
  pluck(t, f, dur, vol, type) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + dur + 0.02);
  }
  drum(t, vol, f) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.25);
  }
  hat(t, vol) {
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    s.buffer = this.noiseBuf; f.type = 'highpass'; f.frequency.value = 6500;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f); f.connect(g); g.connect(this.musicGain); s.start(t); s.stop(t + 0.08);
  }
  noise(t, dur, vol, type, f0, f1, q = 1) {
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(), fl = this.ctx.createBiquadFilter();
    s.buffer = this.noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur); fl.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.015, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.sfxGain); s.start(t); s.stop(t + dur + 0.03);
  }
  tone(t, dur, vol, type, f0, f1, dest) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain); o.start(t); o.stop(t + dur + 0.03);
  }
  play(name, opt = {}) {
    if (!this.ctx || this.master.gain.value <= 0.001) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'swing': this.noise(t, 0.14, 0.16, 'bandpass', 2400, 500, 1.4); break;
      case 'swing_heavy': this.noise(t, 0.3, 0.22, 'bandpass', 1600, 300, 1.1); this.tone(t, 0.2, 0.08, 'sawtooth', 140, 70); break;
      case 'hit': this.tone(t, 0.13, 0.22, 'square', 180, 60); this.noise(t, 0.09, 0.14, 'lowpass', 900, 200); break;
      case 'crit': this.tone(t, 0.2, 0.26, 'square', 260, 50); this.noise(t, 0.16, 0.2, 'bandpass', 1800, 300, 2); break;
      case 'block': this.noise(t, 0.16, 0.14, 'highpass', 2400, 1200); this.tone(t, 0.18, 0.1, 'triangle', 520, 380); break;
      case 'parry': this.tone(t, 0.5, 0.18, 'sine', 1800, 2400); this.tone(t, 0.4, 0.1, 'triangle', 2600, 3200); this.noise(t, 0.2, 0.12, 'highpass', 5000, 2000); break;
      case 'jump': this.tone(t, 0.18, 0.09, 'sine', 260, 620); break;
      case 'double': this.tone(t, 0.24, 0.1, 'sine', 420, 980); this.noise(t, 0.2, 0.06, 'bandpass', 1200, 2400); break;
      case 'dodge': this.noise(t, 0.22, 0.12, 'bandpass', 1800, 400, 1.5); break;
      case 'fire': this.noise(t, 0.55, 0.22, 'lowpass', 1600, 240, 0.8); this.tone(t, 0.4, 0.12, 'sawtooth', 120, 42); break;
      case 'ice': this.tone(t, 0.55, 0.1, 'sine', 1400, 2200); this.tone(t + 0.05, 0.45, 0.08, 'sine', 2200, 3100); this.noise(t, 0.35, 0.06, 'highpass', 5000, 8000); break;
      case 'lightning': this.noise(t, 0.3, 0.24, 'highpass', 6000, 1800); this.tone(t, 0.22, 0.15, 'sawtooth', 1800, 120); break;
      case 'wind': this.noise(t, 0.42, 0.16, 'bandpass', 700, 2800, 0.9); break;
      case 'shadow': this.tone(t, 0.5, 0.12, 'sine', 900, 90); this.noise(t, 0.4, 0.08, 'lowpass', 500, 100); break;
      case 'heal': [523, 659, 784].forEach((f, i) => this.tone(t + i * 0.07, 0.5, 0.07, 'sine', f, f * 1.01)); break;
      case 'pickup': this.tone(t, 0.22, 0.1, 'sine', 880, 1320); this.tone(t + 0.06, 0.3, 0.07, 'sine', 1320, 1760); break;
      case 'shard': [660, 880, 1100, 1320].forEach((f, i) => this.tone(t + i * 0.05, 0.4, 0.055, 'sine', f, f)); break;
      case 'level': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.09, 0.6, 0.09, 'triangle', f, f)); break;
      case 'ui': this.tone(t, 0.07, 0.05, 'sine', 620, 760); break;
      case 'chest': this.noise(t, 0.3, 0.08, 'bandpass', 1200, 500); this.tone(t + 0.12, 0.5, 0.08, 'sine', 660, 990); this.tone(t + 0.2, 0.6, 0.06, 'sine', 990, 1480); break;
      case 'roar': this.tone(t, 1.0, 0.22, 'sawtooth', 90, 38); this.noise(t, 1.0, 0.2, 'lowpass', 700, 120); break;
      case 'ult': this.noise(t, 1.2, 0.14, 'bandpass', 300, 4000, 0.7); this.tone(t, 1.1, 0.16, 'sawtooth', 80, 240); [523, 659, 784, 1046].forEach((f, i) => this.tone(t + 0.2 + i * 0.08, 1.1, 0.05, 'triangle', f, f)); break;
      case 'death': this.tone(t, 0.9, 0.16, 'sawtooth', 220, 40); this.noise(t, 0.8, 0.1, 'lowpass', 800, 100); break;
      case 'victory': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(t + i * 0.12, 1.4, 0.08, 'triangle', f, f)); break;
      case 'error': this.tone(t, 0.15, 0.07, 'square', 220, 160); break;
      case 'quest': [659, 880, 1046].forEach((f, i) => this.tone(t + i * 0.09, 0.5, 0.07, 'sine', f, f)); break;
      case 'seal': this.tone(t, 0.8, 0.09, 'sine', 440, 880); this.noise(t, 0.6, 0.05, 'highpass', 3000, 8000); break;
      case 'travel': this.noise(t, 0.8, 0.12, 'bandpass', 400, 4000, 0.6); [392, 587, 880].forEach((f, i) => this.tone(t + i * 0.1, 0.8, 0.055, 'sine', f, f)); break;
      default: break;
    }
  }
}

/* ================= PARTICLES ================= */
const particleVert = `
attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
varying vec3 vColor; varying float vAlpha;
uniform float uScale;
void main(){
  vColor = aColor; vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const particleFrag = `
varying vec3 vColor; varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  if(d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}`;

export class ParticleSystem {
  constructor(scene, max = 1800) {
    this.max = max; this.cursor = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    this.geo.setDrawRange(0, max);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: particleVert, fragmentShader: particleFrag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uScale: { value: 380 } }
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.colors = new THREE.Color();
  }
  emit(o = {}) {
    const {
      pos = new THREE.Vector3(), count = 8, color = 0xffffff, spread = 0.4,
      speed = 2, speedVar = 1, life = 0.7, lifeVar = 0.3, size = 6, sizeVar = 3,
      gravity = 0, drag = 1.5, ring = false, dir = null, cone = 0
    } = o;
    const col = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const idx = this.cursor; this.cursor = (this.cursor + 1) % this.max;
      const i3 = idx * 3;
      let dx, dy, dz;
      if (ring) {
        const a = Math.random() * TAU;
        dx = Math.cos(a); dz = Math.sin(a); dy = (Math.random() - 0.5) * 0.2;
      } else {
        dx = (Math.random() * 2 - 1); dy = (Math.random() * 2 - 1); dz = (Math.random() * 2 - 1);
        const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      }
      this.pos[i3] = pos.x + dx * spread * Math.random(); this.pos[i3 + 1] = pos.y + dy * spread * Math.random(); this.pos[i3 + 2] = pos.z + dz * spread * Math.random();
      const sp = speed + (Math.random() - 0.5) * speedVar;
      if (dir) {
        const angle = cone ? (Math.random() - 0.5) * cone : 0;
        const ca = Math.cos(angle), sa = Math.sin(angle);
        this.vel[i3] = (dir.x * ca - dir.z * sa) * sp;
        this.vel[i3 + 1] = (dir.y + (Math.random() - 0.5) * (cone ? 0.5 : 0.3)) * sp;
        this.vel[i3 + 2] = (dir.x * sa + dir.z * ca) * sp;
      } else {
        this.vel[i3] = dx * sp; this.vel[i3 + 1] = dy * sp + (o.up || 0); this.vel[i3 + 2] = dz * sp;
      }
      const lf = life + (Math.random() - 0.5) * lifeVar;
      this.life[idx] = lf; this.maxLife[idx] = lf;
      this.grav[idx] = gravity; this.drag[idx] = drag;
      this.baseSize[idx] = size + (Math.random() - 0.5) * sizeVar;
      this.size[idx] = this.baseSize[idx];
      const c2 = col.clone();
      if (o.color2) c2.lerp(new THREE.Color(o.color2), Math.random());
      c2.multiplyScalar(0.85 + Math.random() * 0.5);
      this.col[i3] = c2.r; this.col[i3 + 1] = c2.g; this.col[i3 + 2] = c2.b;
      this.alpha[idx] = 1;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { if (this.alpha[i] !== 0) this.alpha[i] = 0; continue; }
      this.life[i] -= dt;
      const t = Math.max(0, this.life[i] / this.maxLife[i]);
      this.alpha[i] = t * t;
      this.size[i] = this.baseSize[i] * (0.35 + t * 0.9);
      const i3 = i * 3;
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i3] *= dr; this.vel[i3 + 1] = this.vel[i3 + 1] * dr + this.grav[i] * dt; this.vel[i3 + 2] *= dr;
      this.pos[i3] += this.vel[i3] * dt; this.pos[i3 + 1] += this.vel[i3 + 1] * dt; this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
  }
}

/* ================= INPUT ================= */
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set(); this.just = new Set();
    this.buttons = new Set(); this.buttonsJust = new Set();
    this.mouseButtons = new Set(); this.mouseJust = new Set();
    this.look = { x: 0, y: 0 };
    this.locked = false;
    this.joystick = { x: 0, y: 0, active: false };
    this.touchActions = new Set(); this.touchJust = new Set();
    this.touchCapable = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.bind();
  }
  bind() {
    addEventListener('keydown', e => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && e.target === document.body) e.preventDefault();
      if (!this.keys.has(e.code)) this.just.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouseButtons.clear(); this.joystick.active = false; this.joystick.x = 0; this.joystick.y = 0; });
    addEventListener('mousemove', e => {
      if (this.locked) { this.look.x += e.movementX; this.look.y += e.movementY; }
      else if (this.dragging) { this.look.x += e.movementX; this.look.y += e.movementY; }
    });
    this.canvas.addEventListener('mousedown', e => {
      if (e.button === 0 && !this.locked && !this.touchCapable) this.requestLock();
      this.dragging = true;
      this.mouseButtons.add(e.button); this.mouseJust.add(e.button);
    });
    addEventListener('mouseup', e => { this.dragging = false; this.mouseButtons.delete(e.button); });
    addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === this.canvas; });
    // touch joystick
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    if (zone) {
      const rect = () => zone.getBoundingClientRect();
      let pid = null;
      const update = e => {
        const r = rect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const max = r.width * 0.34; const l = Math.hypot(dx, dy);
        if (l > max) { dx = dx / l * max; dy = dy / l * max; }
        this.joystick.x = dx / max; this.joystick.y = dy / max; this.joystick.active = true;
        if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      };
      zone.addEventListener('pointerdown', e => { pid = e.pointerId; zone.setPointerCapture(pid); update(e); });
      zone.addEventListener('pointermove', e => { if (e.pointerId === pid) update(e); });
      const end = e => { if (e.pointerId === pid) { pid = null; this.joystick.active = false; this.joystick.x = 0; this.joystick.y = 0; if (knob) knob.style.transform = 'translate(-50%,-50%)'; } };
      zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
    }
    document.querySelectorAll('[data-action]').forEach(btn => {
      const act = btn.dataset.action;
      btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.touchActions.add(act); this.touchJust.add(act); });
      const rel = e => { e.preventDefault(); this.touchActions.delete(act); };
      btn.addEventListener('pointerup', rel); btn.addEventListener('pointercancel', rel); btn.addEventListener('pointerleave', rel);
    });
  }
  requestLock() {
    if (this.touchCapable) return;
    try { this.canvas.requestPointerLock?.(); } catch (e) { /* noop */ }
  }
  exitLock() { if (document.pointerLockElement) document.exitPointerLock?.(); }
  down(code) { return this.keys.has(code); }
  pressed(code) { return this.just.has(code); }
  mouseDown(b = 0) { return this.mouseButtons.has(b); }
  mousePressed(b = 0) { return this.mouseJust.has(b); }
  consumeLook() { const l = { x: this.look.x, y: this.look.y }; this.look.x = 0; this.look.y = 0; return l; }
  actionDown(a) { return this.touchActions.has(a); }
  actionPressed(a) { return this.touchJust.has(a); }
  endFrame() { this.just.clear(); this.mouseJust.clear(); this.touchJust.clear(); }
}
