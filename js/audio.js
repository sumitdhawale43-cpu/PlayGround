/* =========================================================
   PORTAL RUNNER — generative score + synthesized SFX
   Everything is created with the Web Audio API, no assets.
   ========================================================= */

const LIGHT_SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19];
const DARK_SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19];
const LIGHT_CHORDS = [
  [220.0, 277.18, 329.63, 440.0],
  [196.0, 246.94, 293.66, 392.0],
  [174.61, 220.0, 261.63, 349.23],
  [246.94, 311.13, 369.99, 493.88]
];
const DARK_CHORDS = [
  [174.61, 207.65, 261.63, 349.23],
  [155.56, 185.0, 233.08, 311.13],
  [130.81, 164.81, 196.0, 261.63],
  [146.83, 174.61, 220.0, 293.66]
];

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.reverb = null;
    this.noiseBuffer = null;
    this.layer = 'light';
    this.nextNote = 0;
    this.nextChord = 0;
    this.started = false;
    this.timer = 0;
    this.padOsc = [];
    this.padGain = null;
    this.ambientNoise = null;
    this.ambientGain = null;
    this.noteIndex = 3;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.settings.music ? 0.5 : 0;
      this.musicBus.connect(this.master);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfx ? 0.85 : 0;
      this.sfxBus.connect(this.master);

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 22;
      comp.ratio.value = 5;
      comp.attack.value = 0.005;
      comp.release.value = 0.24;
      comp.connect(this.master);
      this.musicBus.disconnect();
      this.sfxBus.disconnect();
      this.musicBus.connect(comp);
      this.sfxBus.connect(comp);

      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(2.6, 2.2);
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      this.reverb.connect(wet);
      wet.connect(comp);

      this.noiseBuffer = this.makeNoise(2.0);
      this.makeAmbient();
      this.startScheduler();
      this.started = true;
    } catch {
      this.ctx = null;
    }
  }

  makeImpulse(seconds, decay) {
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const buffer = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.72 + white * 0.28;
        data[i] = last * Math.pow(1 - i / len, decay);
      }
    }
    return buffer;
  }

  makeNoise(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = last * 0.94 + (Math.random() * 2 - 1) * 0.06;
      data[i] = last * 4.2;
    }
    return buffer;
  }

  makeAmbient() {
    const ctx = this.ctx;
    // warm drifting air
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 480;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);
    src.start();
    lfo.start();
    this.ambientNoise = { src, filter, gain, lfo };

    // slow pad
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.055;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 720;
    padFilter.Q.value = 0.6;
    this.padGain.connect(padFilter);
    padFilter.connect(this.musicBus);
    padFilter.connect(this.reverb);
    const freqs = LIGHT_CHORDS[0];
    for (let i = 0; i < freqs.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = freqs[i] * (i % 2 ? 0.5 : 1);
      osc.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.16 / freqs.length;
      osc.connect(g);
      g.connect(this.padGain);
      osc.start();
      this.padOsc.push({ osc, gain: g, base: freqs[i] });
    }
    this.padFilter = padFilter;
  }

  startScheduler() {
    const tick = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (now >= this.nextChord) {
        this.nextChord = now + 7.5;
        this.playChord();
      }
      if (now >= this.nextNote) {
        this.playSparkle();
      }
      this.timer = window.setTimeout(tick, 220);
    };
    this.nextChord = this.ctx.currentTime + 0.8;
    this.nextNote = this.ctx.currentTime + 1.6;
    tick();
  }

  playChord() {
    if (!this.ctx || !this.padOsc.length) return;
    const chords = this.layer === 'dark' ? DARK_CHORDS : LIGHT_CHORDS;
    const chord = chords[Math.floor(Math.random() * chords.length)];
    const now = this.ctx.currentTime;
    this.padOsc.forEach((p, i) => {
      const base = chord[i % chord.length];
      const target = base * (i % 2 ? 0.5 : 1);
      p.osc.frequency.cancelScheduledValues(now);
      p.osc.frequency.setValueAtTime(p.osc.frequency.value, now);
      p.osc.frequency.exponentialRampToValueAtTime(Math.max(30, target), now + 3.2);
    });
    this.padFilter.frequency.cancelScheduledValues(now);
    this.padFilter.frequency.setValueAtTime(this.padFilter.frequency.value, now);
    this.padFilter.frequency.linearRampToValueAtTime(this.layer === 'dark' ? 420 : 780, now + 3.4);
  }

  playSparkle() {
    if (!this.ctx) return;
    const scale = this.layer === 'dark' ? DARK_SCALE : LIGHT_SCALE;
    const root = this.layer === 'dark' ? 130.81 : 196.0;
    this.noteIndex = (this.noteIndex + 1 + Math.floor(Math.random() * 3)) % scale.length;
    const freq = root * Math.pow(2, scale[this.noteIndex] / 12) * (Math.random() < 0.25 ? 2 : 1);
    const t = this.ctx.currentTime + 0.02;
    const gain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    osc.type = this.layer === 'dark' ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 8;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.032, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (this.layer === 'dark' ? 2.4 : 1.9));
    osc.connect(gain);
    gain.connect(this.musicBus);
    gain.connect(this.reverb);
    osc.start(t);
    osc.stop(t + 2.6);
    this.nextNote = this.ctx.currentTime + 0.55 + Math.random() * 1.75;
  }

  setLayer(layer) {
    if (this.layer === layer) return;
    this.layer = layer;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = layer === 'dark' ? DARK_CHORDS : LIGHT_CHORDS;
    const chord = chords[0];
    this.padOsc.forEach((p, i) => {
      const base = chord[i % chord.length];
      const target = base * (i % 2 ? 0.5 : 1);
      p.osc.frequency.cancelScheduledValues(now);
      p.osc.frequency.setValueAtTime(p.osc.frequency.value, now);
      p.osc.frequency.exponentialRampToValueAtTime(Math.max(30, target), now + 0.9);
    });
    this.padFilter.frequency.cancelScheduledValues(now);
    this.padFilter.frequency.setValueAtTime(this.padFilter.frequency.value, now);
    this.padFilter.frequency.exponentialRampToValueAtTime(layer === 'dark' ? 380 : 760, now + 1.1);
    if (this.ambientGain && false) { /* reserved */ }
  }

  setMusic(on) {
    this.settings.music = on;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.15);
  }

  setSfx(on) {
    this.settings.sfx = on;
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(on ? 0.85 : 0, this.ctx.currentTime, 0.08);
  }

  stopAll() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = 0;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  /* ---------- primitive SFX ---------- */
  tone({ freq = 440, to = null, dur = 0.15, type = 'sine', gain = 0.2, delay = 0, reverb = 0.18, detune = 0 }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    if (reverb > 0) {
      const r = ctx.createGain();
      r.gain.value = reverb;
      g.connect(r);
      r.connect(this.reverb);
    }
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noise({ dur = 0.2, gain = 0.15, freq = 1200, q = 0.9, delay = 0, type = 'bandpass', reverb = 0.12, sweepTo = null }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    if (reverb > 0) {
      const r = ctx.createGain();
      r.gain.value = reverb;
      g.connect(r);
      r.connect(this.reverb);
    }
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.05);
  }

  sfx(name) {
    if (!this.ctx || !this.settings.sfx) return;
    switch (name) {
      case 'jump':
        this.tone({ freq: 290, to: 620, dur: 0.15, type: 'triangle', gain: 0.17, reverb: 0.14 });
        this.noise({ dur: 0.09, gain: 0.035, freq: 2400, sweepTo: 800 });
        break;
      case 'double':
        this.tone({ freq: 440, to: 880, dur: 0.17, type: 'triangle', gain: 0.13, reverb: 0.2 });
        this.tone({ freq: 660, to: 1320, dur: 0.13, type: 'sine', gain: 0.06, delay: 0.03 });
        break;
      case 'land':
        this.noise({ dur: 0.14, gain: 0.1, freq: 280, q: 0.7, type: 'lowpass', reverb: 0.06 });
        this.tone({ freq: 130, to: 70, dur: 0.12, type: 'sine', gain: 0.09 });
        break;
      case 'dash':
        this.noise({ dur: 0.28, gain: 0.14, freq: 900, sweepTo: 4200, q: 0.7, reverb: 0.24 });
        this.tone({ freq: 220, to: 90, dur: 0.18, type: 'sawtooth', gain: 0.05, reverb: 0.1 });
        break;
      case 'portal':
        this.tone({ freq: 180, to: 720, dur: 0.7, type: 'sine', gain: 0.16, reverb: 0.5 });
        this.tone({ freq: 270, to: 1080, dur: 0.62, type: 'triangle', gain: 0.07, delay: 0.05, reverb: 0.5 });
        this.noise({ dur: 0.6, gain: 0.07, freq: 320, sweepTo: 3200, q: 0.6, reverb: 0.4 });
        break;
      case 'collect':
        this.tone({ freq: 880, dur: 0.14, type: 'sine', gain: 0.1, reverb: 0.2 });
        this.tone({ freq: 1320, dur: 0.16, type: 'sine', gain: 0.065, delay: 0.055, reverb: 0.2 });
        break;
      case 'key':
        this.tone({ freq: 523.25, dur: 0.3, type: 'triangle', gain: 0.12, reverb: 0.35 });
        this.tone({ freq: 783.99, dur: 0.32, type: 'triangle', gain: 0.1, delay: 0.09, reverb: 0.35 });
        this.tone({ freq: 1046.5, dur: 0.4, type: 'sine', gain: 0.09, delay: 0.18, reverb: 0.45 });
        break;
      case 'death':
        this.tone({ freq: 320, to: 55, dur: 0.65, type: 'sawtooth', gain: 0.14, reverb: 0.3 });
        this.noise({ dur: 0.5, gain: 0.08, freq: 900, sweepTo: 120, q: 0.8 });
        break;
      case 'stomp':
        this.tone({ freq: 150, to: 60, dur: 0.16, type: 'square', gain: 0.11, reverb: 0.1 });
        this.noise({ dur: 0.14, gain: 0.1, freq: 700, q: 0.8 });
        break;
      case 'checkpoint':
        this.tone({ freq: 392, dur: 0.5, type: 'sine', gain: 0.1, reverb: 0.5 });
        this.tone({ freq: 587.33, dur: 0.6, type: 'sine', gain: 0.08, delay: 0.12, reverb: 0.5 });
        break;
      case 'bridge':
        this.tone({ freq: 261.63, dur: 0.55, type: 'triangle', gain: 0.08, reverb: 0.4 });
        this.tone({ freq: 392, dur: 0.6, type: 'sine', gain: 0.06, delay: 0.08, reverb: 0.4 });
        this.noise({ dur: 0.4, gain: 0.03, freq: 1800, sweepTo: 400 });
        break;
      case 'complete':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone({ freq: f, dur: 0.9, type: 'triangle', gain: 0.1, delay: i * 0.13, reverb: 0.55 }));
        this.tone({ freq: 1318.5, dur: 1.6, type: 'sine', gain: 0.07, delay: 0.55, reverb: 0.6 });
        break;
      case 'click':
        this.tone({ freq: 640, to: 820, dur: 0.07, type: 'triangle', gain: 0.05, reverb: 0.05 });
        break;
      case 'denied':
        this.tone({ freq: 220, to: 170, dur: 0.18, type: 'square', gain: 0.04, reverb: 0.05 });
        break;
      case 'secret':
        this.tone({ freq: 740, dur: 0.4, type: 'sine', gain: 0.09, reverb: 0.45 });
        this.tone({ freq: 1108, dur: 0.5, type: 'sine', gain: 0.07, delay: 0.1, reverb: 0.45 });
        break;
      default:
        break;
    }
  }
}
