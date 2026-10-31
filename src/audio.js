export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.noise = null;
    this.started = false;
  }

  init() {
    if (this.ctx) { this.resume(); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.62 : 0;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.22;
    this.master.connect(comp).connect(this.ctx.destination);

    // pre-baked noise buffer
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.startAmbient();
    this.started = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.62 : 0, this.ctx.currentTime, 0.05);
  }

  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  startAmbient() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.045;
    // slow wind swell
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG).connect(g.gain);
    lfo.start();
    src.connect(lp).connect(g).connect(this.master);
    src.start();

    // low industrial drone
    for (const [freq, vol] of [[48, 0.014], [73.4, 0.008], [110, 0.0035]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
      const og = ctx.createGain(); og.gain.value = vol;
      const detune = ctx.createOscillator(); detune.frequency.value = 0.07;
      const dg = ctx.createGain(); dg.gain.value = freq * 0.004;
      detune.connect(dg).connect(o.detune); detune.start();
      o.connect(og).connect(this.master); o.start();
    }
  }

  _noiseBurst({ dur = 0.2, gain = 0.5, type = 'bandpass', freq = 900, q = 0.8, sweep = 0, attack = 0.002, lowpass = 0 }) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    src.playbackRate.value = 0.9 + Math.random() * 0.25;
    const filter = ctx.createBiquadFilter(); filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    if (sweep) filter.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = src.connect(filter);
    if (lowpass) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lowpass;
      node = node.connect(lp);
    }
    node.connect(g).connect(this.master);
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.05);
  }

  _thump({ start = 120, end = 42, dur = 0.18, gain = 0.5, type = 'sine', delay = 0 }) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(start, t);
    o.frequency.exponentialRampToValueAtTime(end, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  shot() {
    if (!this.ctx) return;
    this._noiseBurst({ dur: 0.16, gain: 0.62, freq: 1500, q: 0.55, sweep: -1150 });
    this._noiseBurst({ dur: 0.055, gain: 0.38, freq: 3400, q: 1.2 });
    this._thump({ start: 135, end: 38, dur: 0.15, gain: 0.5 });
    this._thump({ start: 78, end: 30, dur: 0.22, gain: 0.32, delay: 0.01 });
    // mechanical click
    this._noiseBurst({ dur: 0.03, gain: 0.09, freq: 4400, q: 2.4 });
  }

  enemyShot(distance = 20) {
    const v = Math.max(0.06, Math.min(0.42, 14 / Math.max(6, distance)));
    this._noiseBurst({ dur: 0.15, gain: v, freq: 720, q: 0.7, sweep: -460, lowpass: 2400 });
    this._thump({ start: 95, end: 38, dur: 0.13, gain: v * 0.6 });
  }

  dry() {
    this._noiseBurst({ dur: 0.035, gain: 0.18, freq: 2600, q: 2.4 });
  }

  reloadStart() {
    this._noiseBurst({ dur: 0.07, gain: 0.14, freq: 900, q: 1.4 });
    setTimeout(() => { this._noiseBurst({ dur: 0.09, gain: 0.2, freq: 600, q: 1.1 }); }, 380);
    setTimeout(() => { this._thump({ start: 220, end: 90, dur: 0.06, gain: 0.16 }); }, 760);
  }

  reloadEnd() {
    this._noiseBurst({ dur: 0.05, gain: 0.24, freq: 1800, q: 2.2 });
    this._thump({ start: 260, end: 110, dur: 0.07, gain: 0.2 });
    setTimeout(() => this._noiseBurst({ dur: 0.06, gain: 0.2, freq: 1200, q: 1.8 }), 90);
  }

  hit(headshot = false) {
    this._thump({ start: headshot ? 1750 : 1250, end: headshot ? 800 : 620, dur: 0.055, gain: 0.14, type: 'triangle' });
    this._noiseBurst({ dur: 0.035, gain: 0.07, freq: 3200, q: 2 });
  }

  kill() {
    this._thump({ start: 300, end: 80, dur: 0.18, gain: 0.18, type: 'triangle' });
  }

  footstep(running = false) {
    this._noiseBurst({ dur: 0.09, gain: running ? 0.11 : 0.07, freq: 380, q: 0.8, lowpass: 900 });
  }

  hurt() {
    this._thump({ start: 90, end: 42, dur: 0.3, gain: 0.35 });
    this._noiseBurst({ dur: 0.14, gain: 0.18, freq: 380, q: 0.8 });
  }

  explosion() {
    this._noiseBurst({ dur: 1.1, gain: 0.75, freq: 900, q: 0.5, sweep: -700, lowpass: 1800 });
    this._thump({ start: 70, end: 18, dur: 0.95, gain: 0.7 });
    this._noiseBurst({ dur: 0.25, gain: 0.4, freq: 2600, q: 0.7 });
  }

  wave() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (const [delay, base] of [[0, 340], [0.34, 435]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(base, t + delay);
      o.frequency.exponentialRampToValueAtTime(base * 1.5, t + delay + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.045, t + delay + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.8);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      o.connect(lp).connect(g).connect(this.master);
      o.start(t + delay); o.stop(t + delay + 0.9);
    }
  }

  pickup() {
    this._thump({ start: 620, end: 900, dur: 0.1, gain: 0.1, type: 'triangle' });
  }

  ui() {
    this._noiseBurst({ dur: 0.03, gain: 0.05, freq: 2000, q: 2 });
  }
}
