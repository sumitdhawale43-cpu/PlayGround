/* ============================================================
   TIME REWIND — procedural audio engine (WebAudio, no assets)
   ============================================================ */

const CHORDS = [
  [55.0, 110.0, 164.81, 220.0, 246.94],
  [49.0, 98.0, 146.83, 196.0, 246.94],
  [43.65, 87.31, 130.81, 174.61, 220.0],
  [48.99, 97.99, 146.83, 196.0, 233.08]
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.enabled = true;
    this.ready = false;
    this.level = 0;
    this.chord = 0;
    this.nextChordAt = 0;
    this.nextPulseAt = 0;
    this.rewindNodes = null;
    this.paused = false;
    this._unlock = this.unlock.bind(this);
    window.addEventListener('pointerdown', this._unlock, { passive: true });
    window.addEventListener('keydown', this._unlock);
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.62 : 0;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 22;
      comp.ratio.value = 5;
      comp.attack.value = 0.006;
      comp.release.value = 0.26;
      this.master.connect(comp).connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.17;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.5;
      this.sfxBus.connect(this.master);

      this.reverb = this.ctx.createConvolver();
      const len = this.ctx.sampleRate * 2.2;
      const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const data = impulse.getChannelData(c);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
        }
      }
      this.reverb.buffer = impulse;
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.16;
      this.reverb.connect(this.reverbGain).connect(this.master);

      this.ready = true;
      this.nextChordAt = this.ctx.currentTime + 0.12;
      this.nextPulseAt = this.ctx.currentTime + 0.4;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(on ? 0.62 : 0, this.ctx.currentTime + 0.14);
    }
  }

  setPaused(paused) {
    this.paused = paused;
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.linearRampToValueAtTime(paused ? 0.06 : 0.17, t + 0.4);
  }

  setLevel(index) {
    this.level = index;
    this.chord = index % CHORDS.length;
  }

  update() {
    if (!this.ready || !this.enabled || this.ctx.state !== 'running' || this.paused) return;
    const t = this.ctx.currentTime;
    while (this.nextChordAt < t + 0.3) {
      this.scheduleChord(this.nextChordAt);
      this.nextChordAt += 4.2;
    }
    while (this.nextPulseAt < t + 0.12) {
      if (Math.random() > 0.28) this.pulse(this.nextPulseAt);
      this.nextPulseAt += 0.5;
    }
  }

  scheduleChord(at) {
    const chord = CHORDS[(this.chord + Math.floor(at / 16.8)) % CHORDS.length];
    const filterFreq = 620 + (this.level % 5) * 90;
    for (let i = 0; i < chord.length; i++) {
      const freq = chord[i] * (i === 4 ? 1.5 : 1);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = i < 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, at);
      filter.frequency.linearRampToValueAtTime(filterFreq * 1.8, at + 1.6);
      filter.frequency.linearRampToValueAtTime(filterFreq * 0.7, at + 4.4);
      filter.Q.value = 1.4;
      const vol = i === 0 ? 0.017 : 0.012 / Math.max(1, i * 0.45);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(vol, at + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 4.5);
      osc.connect(filter).connect(gain);
      gain.connect(this.musicBus);
      gain.connect(this.reverb);
      osc.start(at);
      osc.stop(at + 4.6);
    }
    // Airy high shimmer
    const shimmer = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(chord[4] * 2, at);
    shimmer.frequency.linearRampToValueAtTime(chord[4] * 2.02, at + 4);
    sg.gain.setValueAtTime(0.0001, at);
    sg.gain.exponentialRampToValueAtTime(0.005, at + 1.2);
    sg.gain.exponentialRampToValueAtTime(0.0001, at + 4.1);
    shimmer.connect(sg).connect(this.musicBus);
    shimmer.start(at);
    shimmer.stop(at + 4.2);
  }

  pulse(at) {
    const chord = CHORDS[(this.chord + Math.floor(at / 16.8)) % CHORDS.length];
    const freq = chord[3] * 2;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, at + 0.32);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.013, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.36);
    osc.connect(gain).connect(this.musicBus);
    gain.connect(this.reverb);
    osc.start(at);
    osc.stop(at + 0.38);
  }

  tone(freq, dur = 0.15, type = 'sine', vol = 0.08, slide = null, delay = 0) {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    gain.connect(this.reverb);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur = 0.2, vol = 0.05, freq = 900, delay = 0, type = 'lowpass') {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.35), t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain);
    gain.connect(this.sfxBus);
    src.start(t);
  }

  click() {
    this.tone(880, 0.05, 'square', 0.026, 660);
  }

  jump() {
    this.tone(310, 0.13, 'triangle', 0.06, 560);
    this.noise(0.08, 0.016, 1600);
  }

  land() {
    this.tone(110, 0.09, 'sine', 0.045, 60);
    this.noise(0.07, 0.02, 420);
  }

  core() {
    const base = 660;
    [0, 0.07, 0.14, 0.24].forEach((d, i) => this.tone(base * [1, 1.25, 1.5, 2][i], 0.3, 'sine', 0.055, null, d));
  }

  energy() {
    this.tone(420, 0.15, 'square', 0.03, 840);
    this.tone(840, 0.2, 'sine', 0.04, 1100, 0.05);
  }

  checkpoint() {
    [220, 330, 440, 660].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.04, null, i * 0.08));
    this.noise(0.4, 0.012, 2400);
  }

  death() {
    this.tone(220, 0.6, 'sawtooth', 0.06, 42);
    this.tone(95, 0.8, 'sine', 0.07, 34);
    this.noise(0.7, 0.08, 900);
  }

  portal() {
    [330, 440, 554, 660, 880, 1100].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.04, null, i * 0.075));
    this.noise(0.9, 0.02, 3200);
  }

  unlockSfx() {
    [440, 660, 880, 1320].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.035, null, i * 0.09));
  }

  rewindStart() {
    if (!this.ready || !this.enabled) return;
    if (this.rewindNodes) this.rewindStop(true);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(72, t + 1.8);
    osc2.frequency.setValueAtTime(360, t);
    osc2.frequency.exponentialRampToValueAtTime(144, t + 1.8);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.linearRampToValueAtTime(260, t + 2);
    filter.Q.value = 5;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035, t + 0.12);
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    gain.connect(this.reverb);
    osc.start(t); osc2.start(t);
    this.rewindNodes = { osc, osc2, gain };
    this.noise(1.2, 0.026, 2800, 0, 'bandpass');
  }

  rewindStop(instant = false) {
    if (!this.rewindNodes || !this.ctx) return;
    const { osc, osc2, gain } = this.rewindNodes;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (instant ? 0.01 : 0.18));
    try { osc.stop(t + 0.22); osc2.stop(t + 0.22); } catch { /* already stopped */ }
    this.rewindNodes = null;
    if (!instant) this.tone(160, 0.25, 'triangle', 0.045, 520);
  }

  rewindTick(progress) {
    if (!this.ready || !this.enabled || Math.random() > 0.28) return;
    this.tone(420 + progress * 380, 0.03, 'square', 0.008, null);
  }
}
