/* Procedural underwater ambience + tactile UI sounds. No audio files. */
import { clamp, rand } from './utils.js';

export class OceanAudio {
  constructor(muted = false) {
    this.muted = muted;
    this.ctx = null;
    this.started = false;
    this.depth = 0;
    this.whaleTimer = rand(18, 30);
    this.bubbleTimer = rand(2, 6);
    this.master = null;
    this.waterFilter = null;
    this.hissGain = null;
    this.rumbleGain = null;
    this.noiseBuffer = null;
  }

  init() {
    if (this.started) {
      if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.started = true;
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.34;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 22;
      comp.ratio.value = 5;
      comp.attack.value = 0.008;
      comp.release.value = 0.35;
      this.master.connect(comp).connect(ctx.destination);

      this.noiseBuffer = this._makeNoise(7);

      // Water body: filtered brown noise.
      const water = ctx.createBufferSource();
      water.buffer = this.noiseBuffer;
      water.loop = true;
      this.waterFilter = ctx.createBiquadFilter();
      this.waterFilter.type = 'lowpass';
      this.waterFilter.frequency.value = 420;
      this.waterFilter.Q.value = 0.4;
      this.rumbleGain = ctx.createGain();
      this.rumbleGain.gain.value = 0.16;
      water.connect(this.waterFilter).connect(this.rumbleGain).connect(this.master);

      // Moving surface hiss.
      const hiss = ctx.createBufferSource();
      hiss.buffer = this.noiseBuffer;
      hiss.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 1050;
      band.Q.value = 0.55;
      this.hissGain = ctx.createGain();
      this.hissGain.gain.value = 0.055;
      hiss.connect(band).connect(this.hissGain).connect(this.master);

      // Low submarine drone.
      this.drone = [];
      const droneSpecs = [[55, 'sine', 0.035], [82.41, 'triangle', 0.014], [110, 'sine', 0.008], [164.8, 'sine', 0.004]];
      for (const [freq, type, level] of droneSpecs) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.value = level;
        osc.connect(gain).connect(this.master);
        osc.start();
        this.drone.push({ osc, gain, base: level });
      }

      // Slow breathing filter for the drone bed.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.055;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 120;
      lfo.connect(lfoGain).connect(this.waterFilter.frequency);
      lfo.start();

      water.start();
      hiss.start();
      this.setDepth(this.depth, true);
    } catch (error) {
      console.warn('Deep Ocean: audio unavailable', error);
      this.ctx = null;
      this.started = false;
    }
  }

  _makeNoise(seconds) {
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 2.4 + white * 0.12;
    }
    return buffer;
  }

  setMuted(muted, instant = false) {
    this.muted = muted;
    if (!this.ctx) return;
    const target = muted ? 0 : 0.34;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, instant ? 0.01 : 0.12);
  }

  setDepth(depth, instant = false) {
    this.depth = depth;
    if (!this.ctx) return;
    const t = clamp(depth / 1800, 0, 1);
    const now = this.ctx.currentTime;
    const smooth = instant ? 0.01 : 1.4;
    if (this.waterFilter) this.waterFilter.frequency.setTargetAtTime(110 + 260 * (1 - t), now, smooth);
    if (this.hissGain) this.hissGain.gain.setTargetAtTime((0.012 + 0.06 * (1 - t)) * (this.muted ? 0 : 1), now, smooth);
    if (this.rumbleGain) this.rumbleGain.gain.setTargetAtTime(0.11 + 0.08 * t, now, smooth);
    if (this.drone) {
      for (const d of this.drone) {
        d.gain.gain.setTargetAtTime(d.base * (0.75 + t * 0.7), now, smooth);
        d.osc.frequency.setTargetAtTime(d.osc.frequency.value, now, 0.01);
      }
    }
  }

  update(dt, playing) {
    if (!this.ctx || !playing) return;
    this.whaleTimer -= dt;
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = rand(3.5, 9) * (1 - clamp(this.depth / 2600, 0, 0.55));
      this.bubble(rand(0.25, 0.55), rand(480, 1100));
    }
    if (this.whaleTimer <= 0) {
      this.whaleTimer = rand(26, 58);
      if (this.depth > 240) this.whale();
    }
  }

  _tone({ freq, endFreq = null, type = 'sine', dur = 0.2, gain = 0.12, attack = 0.008, delay = 0, filter = null }) {
    if (!this.ctx || this.muted) return null;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq || 800;
      f.Q.value = filter.q || 0.7;
      node.connect(f).connect(g);
    } else node.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return { osc, gain: g };
  }

  _noiseBurst(dur = 0.25, gain = 0.12, freq = 500, type = 'lowpass', delay = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 1;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  ui() { this._tone({ freq: 720, endFreq: 940, type: 'sine', dur: 0.07, gain: 0.045 }); }

  pickup(kind = 'scrap') {
    if (kind === 'oxygen') { this.bubble(0.8, 880); return; }
    if (kind === 'repair') {
      this._tone({ freq: 420, endFreq: 700, dur: 0.12, gain: 0.07 });
      this._tone({ freq: 620, endFreq: 920, dur: 0.16, gain: 0.05, delay: 0.06 });
      return;
    }
    const base = kind === 'crystal' ? 880 : kind === 'pearl' ? 660 : 520;
    this._tone({ freq: base, endFreq: base * 1.5, type: 'triangle', dur: 0.12, gain: 0.055 });
    this._tone({ freq: base * 2, endFreq: base * 2.25, type: 'sine', dur: 0.09, gain: 0.025, delay: 0.035 });
  }

  bubble(volume = 0.5, base = 700) {
    this._tone({ freq: base, endFreq: base * rand(1.5, 2.4), type: 'sine', dur: rand(0.06, 0.13), gain: 0.03 * volume, attack: 0.004 });
  }

  sonar() {
    if (!this.ctx) return;
    this._tone({ freq: 240, endFreq: 1650, type: 'sine', dur: 0.55, gain: 0.065, attack: 0.01 });
    this._tone({ freq: 1650, endFreq: 1200, type: 'sine', dur: 0.8, gain: 0.022, delay: 0.28 });
    this._noiseBurst(0.35, 0.025, 1800, 'bandpass');
  }

  chest() {
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.55, gain: 0.055, delay: i * 0.075, attack: 0.01 }));
    this._tone({ freq: 1568, type: 'sine', dur: 0.9, gain: 0.02, delay: 0.32 });
    this._noiseBurst(0.5, 0.018, 2400, 'highpass', 0.02);
  }

  upgrade() {
    [261.63, 329.63, 392, 523.25].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.7, gain: 0.045, delay: i * 0.06 }));
    this._tone({ freq: 1046.5, endFreq: 1318.5, type: 'sine', dur: 0.4, gain: 0.02, delay: 0.22 });
  }

  zone() {
    this._tone({ freq: 82.4, endFreq: 110, type: 'sine', dur: 2.4, gain: 0.07, attack: 0.5 });
    this._tone({ freq: 164.8, endFreq: 220, type: 'triangle', dur: 2.2, gain: 0.022, attack: 0.6 });
    this._noiseBurst(1.4, 0.02, 320, 'lowpass');
  }

  hurt() {
    this._noiseBurst(0.3, 0.13, 260, 'lowpass');
    this._tone({ freq: 110, endFreq: 42, type: 'sine', dur: 0.42, gain: 0.12 });
    this._tone({ freq: 320, endFreq: 180, type: 'square', dur: 0.12, gain: 0.022 });
  }

  warn() {
    this._tone({ freq: 540, endFreq: 540, type: 'square', dur: 0.15, gain: 0.018 });
    this._tone({ freq: 540, endFreq: 540, type: 'square', dur: 0.15, gain: 0.018, delay: 0.2 });
  }

  death() {
    this._tone({ freq: 220, endFreq: 30, type: 'sawtooth', dur: 2.4, gain: 0.06, attack: 0.05, filter: { type: 'lowpass', freq: 400 } });
    this._noiseBurst(1.8, 0.12, 180, 'lowpass');
  }

  whale() {
    if (!this.ctx) return;
    const base = rand(62, 110);
    const dur = rand(2.6, 4.2);
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, t0);
    osc.frequency.linearRampToValueAtTime(base * 1.65, t0 + dur * 0.35);
    osc.frequency.linearRampToValueAtTime(base * 0.82, t0 + dur * 0.72);
    osc.frequency.linearRampToValueAtTime(base * 1.1, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.028, t0 + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 480;
    osc.connect(f).connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.1);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(base * 2, t0);
    osc2.frequency.linearRampToValueAtTime(base * 1.8, t0 + dur);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.exponentialRampToValueAtTime(0.008, t0 + 0.9);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc2.connect(g2).connect(this.master);
    osc2.start(t0);
    osc2.stop(t0 + dur + 0.1);
  }
}
