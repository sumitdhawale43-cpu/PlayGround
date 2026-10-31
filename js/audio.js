// Tiny procedural WebAudio sound engine — no external assets.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
    this.arena = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.master);
    return this.ctx;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.03);
  }

  tone(freq, dur, type = 'sine', gain = 0.15, endFreq = null, delay = 0, destination = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(destination || this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noise(dur, gain = 0.15, freq = 1200, type = 'bandpass', delay = 0, q = 1) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  play(name, opts = {}) {
    if (!this.ctx || this.muted) {
      if (!this.ctx) this.ensure();
      if (this.muted) return;
    }
    switch (name) {
      case 'whoosh':
        this.noise(opts.special ? 0.28 : 0.13, opts.special ? 0.16 : 0.08, opts.heavy ? 380 : 900, 'bandpass', 0, 0.8);
        if (opts.special) this.tone(180, 0.26, 'sawtooth', 0.05, 620);
        break;
      case 'punch':
        this.tone(105, 0.11, 'sine', 0.22, 52);
        this.noise(0.085, 0.12, 900, 'lowpass');
        break;
      case 'kick':
        this.tone(82, 0.16, 'sine', 0.28, 38);
        this.noise(0.12, 0.15, 620, 'lowpass');
        break;
      case 'hit':
        this.noise(opts.heavy ? 0.18 : 0.1, opts.heavy ? 0.22 : 0.15, opts.heavy ? 600 : 1200, 'bandpass', 0, 0.7);
        this.tone(opts.heavy ? 120 : 160, 0.14, 'triangle', 0.18, 48);
        break;
      case 'counter':
        this.noise(0.16, 0.22, 900, 'bandpass', 0, 0.8);
        this.tone(240, 0.18, 'square', 0.08, 90);
        break;
      case 'block':
        this.tone(820, 0.09, 'square', 0.07, 640);
        this.tone(1230, 0.07, 'sine', 0.06, 980, 0.005);
        this.noise(0.06, 0.08, 2800, 'highpass');
        break;
      case 'special':
        this.tone(130, 0.55, 'sawtooth', 0.12, 740);
        this.tone(70, 0.5, 'sine', 0.16, 42);
        this.noise(0.45, 0.12, 600, 'bandpass', 0, 0.7);
        break;
      case 'charge':
        this.tone(180, 0.32, 'sine', 0.07, 780);
        this.tone(90, 0.32, 'triangle', 0.05, 220);
        break;
      case 'clash':
        this.noise(0.3, 0.24, 700, 'bandpass', 0, 0.6);
        this.tone(220, 0.4, 'sawtooth', 0.12, 80);
        this.tone(880, 0.25, 'square', 0.04, 300);
        break;
      case 'ko':
        this.tone(70, 0.9, 'sine', 0.32, 30);
        this.tone(140, 0.7, 'triangle', 0.1, 45);
        this.noise(0.7, 0.18, 300, 'lowpass');
        break;
      case 'jump':
        this.tone(260, 0.1, 'sine', 0.04, 390);
        break;
      case 'combo':
        this.tone(560 + (opts.count || 2) * 60, 0.09, 'square', 0.045, 700 + (opts.count || 2) * 70);
        break;
      case 'select':
        this.tone(420, 0.06, 'square', 0.04, 560);
        break;
      case 'confirm':
        this.tone(300, 0.08, 'square', 0.05, 520);
        this.tone(600, 0.12, 'sine', 0.05, 900, 0.05);
        break;
      case 'deny':
        this.tone(150, 0.12, 'square', 0.05, 100);
        break;
      case 'round':
        this.tone(110, 0.35, 'triangle', 0.12, 150);
        this.tone(440, 0.2, 'sine', 0.04, 440, 0.12);
        break;
      case 'fight':
        this.tone(220, 0.5, 'sawtooth', 0.08, 440);
        this.tone(330, 0.5, 'triangle', 0.06, 660, 0.05);
        this.noise(0.3, 0.1, 1800, 'highpass', 0.05);
        break;
      case 'win':
        [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.06, f, i * 0.12));
        break;
      case 'timeup':
        this.tone(300, 0.7, 'sawtooth', 0.08, 100);
        this.tone(150, 0.7, 'triangle', 0.08, 60);
        break;
      case 'intro':
        this.tone(65, 1.1, 'sine', 0.14, 80);
        this.noise(0.5, 0.04, 400, 'lowpass', 0.1);
        break;
      default:
        break;
    }
  }

  startMusic(arena = 0) {
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    this.arena = arena;
    const roots = [
      [55, 65.4, 73.4, 82.4, 65.4, 73.4, 98, 82.4],
      [49, 58.3, 65.4, 73.4, 58.3, 87.3, 65.4, 73.4],
      [46.2, 55, 61.7, 73.4, 55, 82.4, 61.7, 69.3],
    ];
    const root = roots[arena % roots.length];
    this.step = 0;
    const tick = () => {
      if (!this.ctx || this.muted) return;
      const s = this.step % 16;
      const t = this.ctx.currentTime;
      if (s % 4 === 0) {
        this.tone(52, 0.16, 'sine', 0.16, 32, 0, this.musicGain);
      }
      if (s % 2 === 1) this.noise(0.045, 0.02, 5000, 'highpass');
      if (s % 8 === 4) this.noise(0.12, 0.045, 1600, 'bandpass');
      const note = root[Math.floor(s / 2) % root.length] * (s >= 8 ? 2 : 1);
      if (s % 2 === 0) this.tone(note, 0.2, 'sawtooth', 0.035, note * 1.002, 0, this.musicGain);
      if (s === 6 || s === 14) this.tone(note * 4, 0.18, 'triangle', 0.018, note * 4, 0, this.musicGain);
      this.step++;
    };
    this.musicGain.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.3);
    tick();
    this.musicTimer = setInterval(tick, 145);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
  }

  duckMusic(on) {
    if (!this.musicGain || !this.ctx) return;
    this.musicGain.gain.setTargetAtTime(on ? 0.15 : 0.5, this.ctx.currentTime, 0.2);
  }
}
