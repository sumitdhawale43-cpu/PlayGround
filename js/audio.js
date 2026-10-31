import { saveMemory } from './memory.js';

export class Audio {
  constructor(memory) {
    this.memory = memory;
    this.muted = !!memory.settings?.muted;
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.droneGain = null;
    this.filter = null;
    this.night = 0;
    this.started = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.buildAmbient();
  }

  buildAmbient() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = 520;
    this.filter = bp;
    const wind = ctx.createGain();
    wind.gain.value = 0.14;
    src.connect(bp).connect(wind);
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0;
    wind.connect(this.ambientGain).connect(this.master);
    src.start();

    const drone = ctx.createGain();
    drone.gain.value = 0;
    this.droneGain = drone;
    for (const [f, g] of [[55, 0.5], [82.5, 0.3], [110, 0.12]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      osc.connect(og).connect(drone);
      osc.start();
    }
    drone.connect(this.master);
  }

  startAmbient() {
    this.unlock();
    if (!this.ctx) return;
    this.started = true;
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 3);
    this.droneGain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 4);
  }

  stopAmbient() {
    if (!this.ctx) return;
    this.started = false;
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
  }

  setNight(dark) {
    this.night = dark;
    if (!this.ctx || !this.started) return;
    const t = this.ctx.currentTime;
    if (this.filter) this.filter.frequency.setTargetAtTime(300 + (1 - dark) * 900, t, 1.5);
    if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.02 + dark * 0.05, t, 2);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
    this.memory.settings = this.memory.settings || {};
    this.memory.settings.muted = this.muted;
    saveMemory(this.memory);
    return this.muted;
  }

  noise(dur, freq = 900, gain = 0.18, type = 'bandpass') {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master);
    src.start();
  }

  tone(freq, dur, type = 'sine', gain = 0.1, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'swing': this.noise(0.1, 1500, 0.1); break;
      case 'axe': this.noise(0.12, 900, 0.13); this.tone(180, 0.08, 'triangle', 0.03, 120); break;
      case 'spear': this.noise(0.14, 2400, 0.09); break;
      case 'torch': this.noise(0.16, 700, 0.12); break;
      case 'hit': this.tone(150, 0.12, 'sine', 0.16, 55); this.noise(0.08, 300, 0.12); break;
      case 'kill': this.tone(90, 0.28, 'sine', 0.15, 35); this.noise(0.18, 220, 0.14); break;
      case 'hurt': this.noise(0.18, 260, 0.2); this.tone(120, 0.18, 'sawtooth', 0.07, 60); break;
      case 'death': this.tone(110, 2.2, 'sine', 0.18, 28); this.noise(1.2, 180, 0.1); break;
      case 'gather': this.tone(520, 0.09, 'triangle', 0.05); this.tone(780, 0.08, 'triangle', 0.03); break;
      case 'craft': this.tone(320, 0.12, 'triangle', 0.06); setTimeout(() => this.tone(480, 0.14, 'triangle', 0.05), 90); break;
      case 'eat': this.tone(200, 0.1, 'sine', 0.07, 150); break;
      case 'heal': this.tone(440, 0.2, 'sine', 0.05, 660); break;
      case 'dodge': this.noise(0.14, 600, 0.08); break;
      case 'equip': this.tone(660, 0.05, 'square', 0.03); break;
      case 'shard': this.tone(880, 0.5, 'sine', 0.09); setTimeout(() => this.tone(1320, 0.6, 'sine', 0.06), 120); break;
      case 'fire': this.noise(0.4, 1200, 0.1); break;
      case 'douse': this.noise(0.7, 2200, 0.12, 'highpass'); break;
      case 'talk': this.tone(300, 0.06, 'triangle', 0.03); break;
      case 'spawn': this.tone(70, 0.5, 'sine', 0.05, 50); break;
      case 'snarl': this.tone(140, 0.22, 'sawtooth', 0.035, 90); break;
      case 'growl': this.tone(90, 0.4, 'sawtooth', 0.045, 60); break;
      case 'warden': this.tone(55, 1.1, 'sine', 0.12, 42); this.tone(82, 1.0, 'triangle', 0.05, 60); break;
      case 'learn': this.tone(220, 0.9, 'sine', 0.06, 208); this.tone(233, 0.9, 'sine', 0.05, 220); break;
      case 'dawn': this.tone(523, 0.8, 'sine', 0.04); setTimeout(() => this.tone(659, 0.9, 'sine', 0.035), 180); break;
      case 'victory':
        [262, 330, 392, 523].forEach((f, i) => setTimeout(() => this.tone(f, 1.6, 'sine', 0.07), i * 160));
        break;
    }
  }
}
