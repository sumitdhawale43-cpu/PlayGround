export class OceanAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.muted = false;
    this.ready = false;
    this.bubbleTimer = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ctx.destination);
    this.buildAmbient();
    this.ready = true;
  }

  buildAmbient() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Deep filtered noise bed.
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 2.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 420;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.055;
    noise.connect(noiseFilter).connect(noiseGain).connect(this.master);
    noise.start();

    // Slow pressure drone.
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.026;
    droneGain.connect(this.master);
    [55, 82.4, 110.2].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.22 : 0.55;
      osc.connect(g).connect(droneGain);
      osc.start();
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.045 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
    });

    // Distant water movement.
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.07;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.018;
    swell.connect(swellGain).connect(noiseGain.gain);
    swell.start();

    this.ambient = { noise, noiseGain, droneGain };
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime + 0.25);
    }
  }

  tone(freq, duration, type = 'sine', volume = 0.1, slide = 0, delay = 0) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + duration);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noiseBurst(duration = 0.2, volume = 0.08, cutoff = 700) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
  }

  collect(type) {
    if (type === 'crystal') {
      this.tone(740, 0.25, 'sine', 0.07, 240);
      this.tone(1180, 0.3, 'sine', 0.035, 160, 0.05);
    } else if (type === 'pearl') {
      this.tone(620, 0.22, 'triangle', 0.07, 180);
      this.tone(930, 0.26, 'sine', 0.035, 120, 0.04);
    } else if (type === 'repair') {
      this.tone(420, 0.14, 'square', 0.04, 180);
      this.tone(640, 0.24, 'sine', 0.05, 120, 0.08);
    } else {
      this.tone(520, 0.12, 'triangle', 0.055, 90);
      this.tone(780, 0.16, 'sine', 0.03, 60, 0.03);
    }
  }

  chest() {
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.55, 'sine', 0.055, 0, i * 0.09));
    this.noiseBurst(0.5, 0.03, 1200);
  }

  relic() {
    [261.6, 392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 1.3, 'sine', 0.045, 0, i * 0.11));
    this.tone(65, 2.2, 'sine', 0.06, 15);
  }

  damage() {
    this.noiseBurst(0.32, 0.16, 320);
    this.tone(70, 0.4, 'sine', 0.13, -24);
  }

  pulse() {
    this.tone(220, 0.55, 'sine', 0.1, 420);
    this.tone(440, 0.4, 'triangle', 0.045, 220, 0.03);
    this.noiseBurst(0.25, 0.04, 1500);
  }

  bubble() {
    this.tone(300 + Math.random() * 500, 0.1, 'sine', 0.018, 260);
  }

  upgrade() {
    [330, 440, 554, 660].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.055, 0, i * 0.08));
  }

  zone() {
    this.tone(196, 1.8, 'sine', 0.045, 12);
    this.tone(294, 1.4, 'sine', 0.025, 8, 0.2);
  }

  victory() {
    [261.6, 329.6, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 2.4, 'sine', 0.05, 0, i * 0.14));
    this.tone(65, 3, 'sine', 0.07, 12);
  }

  death() {
    this.tone(120, 1.4, 'sine', 0.12, -60);
    this.noiseBurst(1.2, 0.1, 260);
  }

  sonar() {
    this.tone(880, 0.7, 'sine', 0.05, -620);
    this.tone(1320, 0.4, 'sine', 0.02, -800, 0.04);
  }
}
