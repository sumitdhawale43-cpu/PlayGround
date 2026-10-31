export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.ready = false;
    this.musicPlaying = false;
    this.nextIntensity = 0;
    this.nextNoteTime = 0;
    this.step = 0;
    this.noise = null;
    this._lastSfx = new Map();
  }

  init() {
    if (this.ready) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 18;
    comp.ratio.value = 8;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(comp);
    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.master);

    this.noise = this._makeNoise(2);
    this.ready = true;
    this._buildPad();
  }

  _makeNoise(seconds) {
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(muted ? 0 : 0.85, t, 0.04);
    }
    try { localStorage.setItem("shadowstrike.muted", muted ? "1" : "0"); } catch {}
    return muted;
  }

  toggle() { return this.setMuted(!this.muted); }

  _env(node, gain, attack, decay, peak = 1) {
    const t = this.ctx.currentTime;
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * gain), t + attack);
    node.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  _tone(freq, dur, type = "sine", gain = 0.12, slide = 0, delay = 0) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.012, dur * 0.15));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  _noiseBurst(dur, filterType, freq, gain, slide = 0, q = 0.8, delay = 0) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, t);
    if (slide) filter.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  play(name, intensity = 1) {
    if (!this.ready || this.muted) return;
    const now = performance.now();
    const throttle = this._lastSfx.get(name) || 0;
    if (now - throttle < 28) return;
    this._lastSfx.set(name, now);
    switch (name) {
      case "ui":
        this._tone(720, 0.05, "square", 0.025);
        break;
      case "jump":
        this._tone(260, 0.16, "sine", 0.08, 640);
        this._noiseBurst(0.1, "highpass", 900, 0.018);
        break;
      case "doubleJump":
        this._tone(420, 0.18, "triangle", 0.07, 1000);
        this._noiseBurst(0.13, "highpass", 1400, 0.02);
        break;
      case "land":
        this._noiseBurst(0.08, "lowpass", 420, 0.05);
        break;
      case "dash":
        this._noiseBurst(0.3, "bandpass", 1800, 0.11, 260, 1.3);
        this._tone(190, 0.22, "sawtooth", 0.03, 70);
        break;
      case "slash":
        this._noiseBurst(0.14, "highpass", 2200, 0.095, 780, 0.7);
        this._tone(740, 0.1, "triangle", 0.028, 300);
        break;
      case "slash2":
        this._noiseBurst(0.16, "bandpass", 2900, 0.085, 900, 1.2);
        this._tone(920, 0.11, "triangle", 0.024, 410);
        break;
      case "slash3":
        this._noiseBurst(0.24, "highpass", 1800, 0.12, 420, 0.6);
        this._tone(320, 0.26, "sawtooth", 0.045, 90);
        break;
      case "hit":
        this._tone(160, 0.09, "square", 0.07, 54);
        this._noiseBurst(0.13, "bandpass", 1300, 0.11, 300, 1.1);
        break;
      case "heavy":
        this._tone(92, 0.22, "sine", 0.13, 38);
        this._noiseBurst(0.2, "lowpass", 800, 0.13, 140);
        break;
      case "hurt":
        this._tone(180, 0.25, "sawtooth", 0.09, 48);
        this._noiseBurst(0.2, "lowpass", 900, 0.08, 180);
        break;
      case "orb":
        this._tone(980, 0.12, "sine", 0.055, 1480);
        this._tone(1470, 0.14, "triangle", 0.025, 1960, 0.04);
        break;
      case "heal":
        this._tone(520, 0.3, "sine", 0.055, 780);
        this._tone(780, 0.4, "triangle", 0.03, 1040, 0.08);
        break;
      case "checkpoint":
        [392, 523.25, 659.25].forEach((f, i) => this._tone(f, 0.7, "sine", 0.045, 0, i * 0.07));
        this._noiseBurst(0.5, "highpass", 3000, 0.02);
        break;
      case "enemyDie":
        this._tone(120, 0.32, "square", 0.055, 38);
        this._noiseBurst(0.4, "lowpass", 1200, 0.12, 120);
        break;
      case "bossHit":
        this._tone(110, 0.16, "square", 0.05, 50);
        this._noiseBurst(0.18, "bandpass", 900, 0.07, 240);
        break;
      case "bossRoar":
        this._tone(70, 1.15, "sawtooth", 0.12, 34);
        this._tone(46, 1.3, "sine", 0.12, 28);
        this._noiseBurst(1.2, "lowpass", 500, 0.13, 90);
        break;
      case "shockwave":
        this._tone(54, 0.6, "sine", 0.18, 26);
        this._noiseBurst(0.5, "lowpass", 500, 0.16, 80);
        break;
      case "laser":
        this._tone(1100, 0.8, "sawtooth", 0.06, 130, 0.02);
        this._noiseBurst(0.75, "bandpass", 2400, 0.08, 400, 1.6, 0.05);
        break;
      case "parry":
        this._tone(1600, 0.12, "square", 0.04, 2400);
        this._noiseBurst(0.06, "highpass", 5000, 0.05);
        break;
      case "death":
        this._tone(140, 1.4, "sawtooth", 0.09, 30);
        this._noiseBurst(1.1, "lowpass", 900, 0.12, 60);
        break;
      case "victory":
        [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => {
          this._tone(f, 1.6, "triangle", 0.045, 0, i * 0.13);
          this._tone(f / 2, 2.0, "sine", 0.03, 0, i * 0.13);
        });
        break;
      case "bossDie":
        this._noiseBurst(1.8, "lowpass", 1400, 0.2, 60);
        this._tone(70, 1.6, "sawtooth", 0.12, 24);
        [0, 0.18, 0.4, 0.72, 1.1].forEach((d, i) => this._noiseBurst(0.35 + i * 0.08, "bandpass", 500 + i * 350, 0.13, 100, 0.9, d));
        break;
      default:
        break;
    }
  }

  _buildPad() {
    const ctx = this.ctx;
    const pad = ctx.createGain();
    pad.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 4;
    pad.connect(filter).connect(this.musicGain);
    const freqs = [55, 82.41, 110, 164.81];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sawtooth";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 7;
      const g = ctx.createGain();
      g.gain.value = i === 3 ? 0.035 : 0.055;
      o.connect(g).connect(pad);
      o.start();
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    this.padGain = pad;
    this.padFilter = filter;
    this.musicGain.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2);
    this.musicPlaying = true;
    this.nextNoteTime = ctx.currentTime + 0.2;
  }

  setIntensity(value) {
    this.nextIntensity = value;
    if (this.padFilter) this.padFilter.frequency.setTargetAtTime(360 + value * 340, this.ctx.currentTime, 1.5);
  }

  update(dt) {
    if (!this.ready || !this.musicPlaying || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (this.nextNoteTime < now) this.nextNoteTime = now + 0.02;
    const stepDur = 0.285;
    const bass = [55, 55, 65.41, 55, 73.42, 65.41, 49, 55];
    const high = [220, 261.63, 329.63, 261.63, 293.66, 349.23, 196, 220];
    let guard = 0;
    while (this.nextNoteTime < now + 0.12 && guard++ < 8) {
      const t = this.nextNoteTime;
      const step = this.step % 8;
      this._scheduleBass(bass[step], t, 0.26);
      if (this.nextIntensity > 0.15 || step % 2 === 0) {
        this._schedulePluck(high[step] * (this.nextIntensity > 0.6 ? 2 : 1), t, 0.18, 0.012 + this.nextIntensity * 0.018);
      }
      if (step === 0 || step === 4) this._scheduleKick(t);
      this.nextNoteTime += stepDur;
      this.step++;
    }
  }

  _scheduleBass(freq, t, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.value = freq;
    f.type = "lowpass";
    f.frequency.setValueAtTime(240, t);
    f.frequency.exponentialRampToValueAtTime(110, t + dur);
    f.Q.value = 5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  _schedulePluck(freq, t, dur, gain) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  _scheduleKick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.16);
    g.gain.setValueAtTime(0.10, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.22);
  }

  stopMusic() {
    if (!this.ready || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    this.musicPlaying = false;
  }

  resumeMusic() {
    if (!this.ready || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.5);
    this.musicPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
  }
}
