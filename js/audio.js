/** Tiny synthesized soundscape — no assets, no network. */
export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.wind = null;
    this.muted = false;
    this.night = 0;
    this.started = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.buildAmbient();
      this.started = true;
    } catch { /* audio is a luxury */ }
  }

  buildAmbient() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const len = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 2.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.4;
    const gain = ctx.createGain();
    gain.gain.value = 0.11;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    this.ambient = { src, filter, gain };

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // A low valley drone.
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = 58;
    droneGain.gain.value = 0.018;
    drone.connect(droneGain);
    droneGain.connect(this.master);
    drone.start();
    this.wind = { drone, droneGain, filter, gain };
  }

  setNight(f) {
    this.night = f;
    if (!this.ctx || !this.ambient) return;
    const t = this.ctx.currentTime;
    try {
      this.ambient.filter.frequency.setTargetAtTime(420 - f * 160, t, 1.2);
      this.ambient.gain.gain.setTargetAtTime(0.11 + f * 0.05, t, 1.2);
      if (this.wind) {
        this.wind.droneGain.gain.setTargetAtTime(0.018 + f * 0.02, t, 1.4);
        this.wind.drone.frequency.setTargetAtTime(58 - f * 12, t, 1.6);
      }
    } catch { /* noop */ }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.08);
    }
  }

  tone({ freq = 220, to = null, dur = 0.2, type = 'sine', gain = 0.1, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur = 0.15, gain = 0.06, freq = 900, q = 0.8, type = 'bandpass') {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'ui':
        this.tone({ freq: 420, dur: 0.05, type: 'triangle', gain: 0.045 });
        break;
      case 'swing':
        this.noise(0.11, 0.05, 1500, 1.4, 'bandpass');
        break;
      case 'hit':
        this.tone({ freq: 130, to: 62, dur: 0.15, type: 'sine', gain: 0.16 });
        this.noise(0.08, 0.05, 700, 0.7, 'lowpass');
        break;
      case 'hurt':
        this.tone({ freq: 190, to: 90, dur: 0.22, type: 'sawtooth', gain: 0.07 });
        break;
      case 'bow':
        this.tone({ freq: 330, to: 180, dur: 0.1, type: 'triangle', gain: 0.08 });
        this.noise(0.09, 0.03, 2200, 1.2);
        break;
      case 'arrowhit':
        this.noise(0.07, 0.06, 1200, 1.2);
        break;
      case 'pickup':
        this.tone({ freq: 520, dur: 0.09, type: 'triangle', gain: 0.06 });
        this.tone({ freq: 780, dur: 0.12, type: 'triangle', gain: 0.04, delay: 0.05 });
        break;
      case 'craft':
        this.tone({ freq: 260, dur: 0.12, type: 'triangle', gain: 0.07 });
        this.tone({ freq: 390, dur: 0.16, type: 'triangle', gain: 0.06, delay: 0.1 });
        this.tone({ freq: 520, dur: 0.22, type: 'sine', gain: 0.05, delay: 0.2 });
        break;
      case 'learn':
        this.tone({ freq: 110, dur: 1.2, type: 'sine', gain: 0.1 });
        this.tone({ freq: 165, dur: 1.6, type: 'sine', gain: 0.06, delay: 0.08 });
        this.tone({ freq: 220, dur: 1.8, type: 'triangle', gain: 0.035, delay: 0.16 });
        break;
      case 'ember':
        this.noise(0.4, 0.09, 900, 0.5, 'lowpass');
        this.tone({ freq: 680, to: 240, dur: 0.4, type: 'sawtooth', gain: 0.035 });
        break;
      case 'trap':
        this.noise(0.12, 0.08, 1800, 2);
        this.tone({ freq: 90, to: 50, dur: 0.18, type: 'square', gain: 0.05 });
        break;
      case 'death':
        this.tone({ freq: 220, to: 55, dur: 1.6, type: 'sine', gain: 0.15 });
        this.tone({ freq: 110, to: 40, dur: 2.2, type: 'triangle', gain: 0.08, delay: 0.2 });
        break;
      case 'cairn':
        this.tone({ freq: 196, dur: 2.4, type: 'sine', gain: 0.1 });
        this.tone({ freq: 294, dur: 2.8, type: 'sine', gain: 0.07, delay: 0.12 });
        this.tone({ freq: 392, dur: 3.2, type: 'triangle', gain: 0.05, delay: 0.24 });
        this.tone({ freq: 588, dur: 3.4, type: 'sine', gain: 0.03, delay: 0.36 });
        break;
      case 'night':
        this.tone({ freq: 73, dur: 2.5, type: 'sine', gain: 0.09 });
        this.tone({ freq: 146, dur: 2.8, type: 'sine', gain: 0.04, delay: 0.3 });
        break;
      case 'dawn':
        this.tone({ freq: 392, dur: 1.4, type: 'sine', gain: 0.05 });
        this.tone({ freq: 523, dur: 1.8, type: 'sine', gain: 0.04, delay: 0.18 });
        this.tone({ freq: 659, dur: 2.2, type: 'sine', gain: 0.025, delay: 0.36 });
        break;
      case 'talk':
        this.tone({ freq: 300 + Math.random() * 80, dur: 0.04, type: 'triangle', gain: 0.03 });
        break;
      default:
        break;
    }
  }
}
