// ── The Remembering — tiny synthesised soundscape ───────────────────────────
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.windGain = null;
    this.droneGain = null;
    this.ready = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.34;
      this.master.connect(this.ctx.destination);

      // wind bed
      const len = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 2.4;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.5;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.14;
      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      this.windGain = gain;

      // low drone
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = 0.018;
      this.droneGain.connect(this.master);
      for (const [freq, detune] of [[55, -4], [82.5, 3], [110, -7]]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const g = this.ctx.createGain();
        g.gain.value = 0.5;
        osc.connect(g).connect(this.droneGain);
        osc.start();
      }
      this.ready = true;
    } catch { /* silence is acceptable */ }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.34, this.ctx.currentTime, 0.08);
    }
  }

  setMood(night, weather) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const wind = 0.1 + (weather === 'rain' ? 0.13 : weather === 'fog' ? 0.04 : 0.02) + night * 0.04;
    this.windGain.gain.setTargetAtTime(wind, t, 0.5);
    this.droneGain.gain.setTargetAtTime(0.012 + night * 0.028, t, 0.8);
  }

  tone(freq, dur, type = 'sine', gain = 0.14, slide = 0, delay = 0) {
    if (!this.ready || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, freq = 800, gain = 0.1, q = 1) {
    if (!this.ready || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  play(name) {
    if (!this.ready || this.muted) return;
    switch (name) {
      case 'swing': this.noise(0.12, 1500, 0.05, 0.8); break;
      case 'hit': this.tone(110, 0.16, 'triangle', 0.16, -50); this.noise(0.1, 280, 0.1, 0.7); break;
      case 'hurt': this.tone(90, 0.3, 'sawtooth', 0.12, -30); break;
      case 'bow': this.tone(420, 0.12, 'triangle', 0.07, -260); this.noise(0.08, 2200, 0.05, 1.2); break;
      case 'pickup': this.tone(520, 0.1, 'sine', 0.06, 90); break;
      case 'craft': this.tone(330, 0.16, 'triangle', 0.07); this.tone(495, 0.22, 'sine', 0.05, 30, 0.08); break;
      case 'ui': this.tone(660, 0.06, 'sine', 0.04); break;
      case 'memory': this.tone(392, 0.5, 'sine', 0.05); this.tone(587, 0.7, 'sine', 0.035, 0, 0.12); break;
      case 'adapt': this.tone(146, 0.9, 'sawtooth', 0.055, -30); this.tone(220, 1.1, 'sine', 0.045, 20, 0.1); break;
      case 'drink': this.noise(0.25, 500, 0.05, 0.5); break;
      case 'eat': this.noise(0.18, 400, 0.06, 0.6); break;
      case 'trap': this.noise(0.16, 900, 0.12, 1.5); this.tone(160, 0.12, 'square', 0.07, -40); break;
      case 'block': this.tone(880, 0.1, 'square', 0.05, -300); this.noise(0.08, 3000, 0.04, 2); break;
      case 'death': this.tone(196, 1.8, 'sine', 0.08, -80); this.tone(146, 2.2, 'sine', 0.06, -40, 0.2); break;
      case 'shrine': this.tone(523, 0.8, 'sine', 0.05); this.tone(784, 1.1, 'sine', 0.04, 0, 0.15); this.tone(1046, 1.4, 'sine', 0.03, 0, 0.3); break;
      case 'fire': this.noise(0.4, 260, 0.04, 0.4); break;
      default: break;
    }
  }
}
