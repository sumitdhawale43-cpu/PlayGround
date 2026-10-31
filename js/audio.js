// Tiny WebAudio synthesizer — every sound is generated at runtime.
import { rand, clamp } from './utils.js';
import { STORAGE_KEYS } from './data.js';

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = false;
    try { this.muted = localStorage.getItem(STORAGE_KEYS.muted) === '1'; } catch { /* ignored */ }
    this.ambience = null;
    this.lastGroan = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 16;
      comp.ratio.value = 7;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);

      const len = Math.floor(this.ctx.sampleRate * 1.2);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  unlock() { return this.ensure(); }

  setMuted(v) {
    this.muted = !!v;
    try { localStorage.setItem(STORAGE_KEYS.muted, this.muted ? '1' : '0'); } catch { /* ignored */ }
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime + 0.08);
    }
    return this.muted;
  }

  toggleMuted() { return this.setMuted(!this.muted); }

  ok() { return !this.muted && this.ensure(); }
  now() { return this.ctx.currentTime; }

  tone({ type = 'sine', freq = 440, to = null, dur = 0.2, gain = 0.2, attack = 0.005, delay = 0, detune = 0 }) {
    if (!this.ok()) return;
    const t0 = this.now() + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.15, gain = 0.2, filter = 1200, type = 'lowpass', q = 0.8, delay = 0, attack = 0.002 }) {
    if (!this.ok()) return;
    const t0 = this.now() + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(filter, t0);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ---------------- weapons ----------------
  shoot(kind = 'pistol') {
    if (!this.ok()) return;
    if (kind === 'pistol') {
      this.noise({ dur: 0.09, gain: 0.28, filter: 2600, type: 'highpass' });
      this.tone({ type: 'square', freq: rand(150, 180), to: 60, dur: 0.1, gain: 0.12 });
      this.tone({ type: 'triangle', freq: rand(620, 680), to: 180, dur: 0.05, gain: 0.05 });
    } else if (kind === 'shotgun') {
      this.noise({ dur: 0.3, gain: 0.5, filter: 950, type: 'lowpass' });
      this.noise({ dur: 0.09, gain: 0.2, filter: 3200, type: 'highpass' });
      this.tone({ type: 'sine', freq: 120, to: 38, dur: 0.28, gain: 0.33 });
    } else {
      this.noise({ dur: 0.055, gain: 0.2, filter: 3400, type: 'highpass' });
      this.tone({ type: 'square', freq: rand(210, 240), to: 90, dur: 0.055, gain: 0.08 });
    }
  }

  empty() {
    this.noise({ dur: 0.025, gain: 0.16, filter: 4200, type: 'highpass' });
    this.tone({ type: 'square', freq: 380, dur: 0.03, gain: 0.04 });
  }

  reload(step = 0) {
    if (!this.ok()) return;
    if (step === 0) {
      this.noise({ dur: 0.05, gain: 0.14, filter: 1800, type: 'bandpass', q: 2 });
      this.tone({ type: 'square', freq: 240, dur: 0.04, gain: 0.03 });
      this.noise({ dur: 0.06, gain: 0.12, filter: 1200, type: 'bandpass', q: 2, delay: 0.18 });
    } else {
      this.noise({ dur: 0.04, gain: 0.18, filter: 2400, type: 'bandpass', q: 3 });
      this.tone({ type: 'square', freq: 520, to: 380, dur: 0.05, gain: 0.045 });
    }
  }

  swap() {
    this.noise({ dur: 0.045, gain: 0.1, filter: 2000, type: 'bandpass', q: 2 });
    this.tone({ type: 'triangle', freq: 300, to: 440, dur: 0.06, gain: 0.04 });
  }

  // ---------------- combat ----------------
  hit(crit = false) {
    if (!this.ok()) return;
    this.noise({ dur: 0.075, gain: crit ? 0.24 : 0.15, filter: crit ? 600 : 900, type: 'lowpass' });
    this.tone({ type: crit ? 'triangle' : 'sine', freq: crit ? 880 : 260, to: crit ? 520 : 140, dur: 0.08, gain: crit ? 0.08 : 0.055 });
  }

  kill() {
    if (!this.ok()) return;
    this.noise({ dur: 0.3, gain: 0.23, filter: 700, type: 'lowpass' });
    this.tone({ type: 'sawtooth', freq: rand(90, 140), to: 38, dur: 0.3, gain: 0.06 });
  }

  hurt() {
    if (!this.ok()) return;
    this.tone({ type: 'sawtooth', freq: 180, to: 42, dur: 0.32, gain: 0.14 });
    this.noise({ dur: 0.18, gain: 0.2, filter: 500, type: 'lowpass' });
  }

  shieldHit() {
    this.tone({ type: 'sine', freq: 900, to: 320, dur: 0.22, gain: 0.1 });
    this.noise({ dur: 0.12, gain: 0.14, filter: 2400, type: 'bandpass', q: 1.5 });
  }

  pickup() {
    this.tone({ type: 'sine', freq: 760, to: 1180, dur: 0.09, gain: 0.07 });
  }

  coin() {
    this.tone({ type: 'square', freq: rand(880, 980), dur: 0.035, gain: 0.025 });
    this.tone({ type: 'sine', freq: 1320, dur: 0.06, gain: 0.045, delay: 0.025 });
  }

  powerup() {
    if (!this.ok()) return;
    [523, 659, 784, 1046].forEach((f, i) => {
      this.tone({ type: 'triangle', freq: f, dur: 0.22, gain: 0.075, delay: i * 0.055 });
    });
  }

  upgrade() {
    if (!this.ok()) return;
    [392, 523, 659].forEach((f, i) => this.tone({ type: 'square', freq: f, dur: 0.18, gain: 0.04, delay: i * 0.06 }));
    this.noise({ dur: 0.2, gain: 0.1, filter: 1800, type: 'bandpass', q: 1.2, delay: 0.05 });
  }

  wave() {
    if (!this.ok()) return;
    this.tone({ type: 'sawtooth', freq: 92, to: 70, dur: 1.1, gain: 0.14 });
    this.tone({ type: 'sawtooth', freq: 138, to: 104, dur: 1.1, gain: 0.07, detune: 8 });
    this.noise({ dur: 0.7, gain: 0.1, filter: 420, type: 'lowpass' });
  }

  boss() {
    if (!this.ok()) return;
    this.tone({ type: 'sawtooth', freq: 55, to: 36, dur: 1.6, gain: 0.26 });
    this.tone({ type: 'square', freq: 82, to: 52, dur: 1.6, gain: 0.1, detune: -14 });
    this.noise({ dur: 1.1, gain: 0.2, filter: 320, type: 'lowpass' });
  }

  growl(intensity = 1) {
    if (!this.ok()) return;
    if (this.ctx.currentTime - this.lastGroan < 0.18) return;
    this.lastGroan = this.ctx.currentTime;
    const base = rand(58, 84) / intensity;
    this.tone({ type: 'sawtooth', freq: base, to: base * 0.75, dur: rand(0.3, 0.6), gain: 0.035 });
    this.tone({ type: 'triangle', freq: base * 2.03, to: base * 1.4, dur: 0.35, gain: 0.018 });
  }

  explosion() {
    if (!this.ok()) return;
    this.noise({ dur: 0.8, gain: 0.55, filter: 620, type: 'lowpass' });
    this.tone({ type: 'sine', freq: 90, to: 24, dur: 0.7, gain: 0.4 });
    this.noise({ dur: 0.2, gain: 0.22, filter: 3200, type: 'highpass', delay: 0.02 });
  }

  dash() {
    this.noise({ dur: 0.22, gain: 0.16, filter: 1400, type: 'bandpass', q: 0.8 });
    this.tone({ type: 'sine', freq: 240, to: 720, dur: 0.16, gain: 0.04 });
  }

  click() {
    this.noise({ dur: 0.035, gain: 0.08, filter: 2200, type: 'bandpass', q: 2 });
  }

  spit() {
    this.noise({ dur: 0.16, gain: 0.13, filter: 700, type: 'bandpass', q: 1 });
    this.tone({ type: 'sine', freq: 220, to: 90, dur: 0.16, gain: 0.06 });
  }

  slam() {
    if (!this.ok()) return;
    this.tone({ type: 'sine', freq: 70, to: 30, dur: 0.5, gain: 0.35 });
    this.noise({ dur: 0.4, gain: 0.3, filter: 500, type: 'lowpass' });
  }

  heartbeat(strength = 1) {
    if (!this.ok()) return;
    this.tone({ type: 'sine', freq: 58, to: 40, dur: 0.13, gain: 0.11 * strength });
    this.tone({ type: 'sine', freq: 52, to: 36, dur: 0.12, gain: 0.07 * strength, delay: 0.19 });
  }

  startAmbience() {
    if (!this.ok() || this.ambience) return;
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.0001;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    filter.Q.value = 3;
    const oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.value = 42;
    const oscB = ctx.createOscillator();
    oscB.type = 'sawtooth';
    oscB.frequency.value = 42.7;
    const oscC = ctx.createOscillator();
    oscC.type = 'sine';
    oscC.frequency.value = 84.2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    oscA.connect(filter);
    oscB.connect(filter);
    oscC.connect(filter);
    filter.connect(out);
    out.connect(this.master);
    oscA.start();
    oscB.start();
    oscC.start();
    lfo.start();
    out.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 4);
    this.ambience = { out, oscA, oscB, oscC, lfo };
  }

  stopAmbience() {
    if (!this.ambience || !this.ctx) return;
    const a = this.ambience;
    this.ambience = null;
    const t = this.ctx.currentTime;
    try {
      a.out.gain.cancelScheduledValues(t);
      a.out.gain.setValueAtTime(a.out.gain.value, t);
      a.out.gain.linearRampToValueAtTime(0.0001, t + 0.8);
      [a.oscA, a.oscB, a.oscC, a.lfo].forEach((o) => o.stop(t + 0.9));
    } catch { /* ignored */ }
  }
}
