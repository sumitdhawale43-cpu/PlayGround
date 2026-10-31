// SHADOW NINJA — procedural audio (WebAudio, no asset downloads)

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.comp = null;
    this.noise = null;
    this.muted = false;
    this.mode = 'menu';
    this.step = 0;
    this.nextNote = 0;
    this.timer = null;
    this.running = false;
    this.paused = false;
    this.masterLevel = 0.62;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 18;
    this.comp.ratio.value = 5;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.24;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.masterLevel;

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.26;

    this.sfxBus.connect(this.master);
    this.musicBus.connect(this.master);
    this.master.connect(this.comp);
    this.comp.connect(ctx.destination);

    // shared noise buffer
    const len = Math.floor(ctx.sampleRate * 1.4);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;

    this.running = true;
    this.nextNote = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 90);
    this.startDrone();
  }

  setMasterLevel(v) {
    this.masterLevel = v;
    if (this.master && !this.muted) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.masterLevel, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  duck(on) {
    this.paused = on;
    if (!this.musicBus || !this.ctx) return;
    const target = on ? 0.07 : 0.26;
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.step = 0;
    if (this.ctx) this.nextNote = Math.max(this.nextNote, this.ctx.currentTime + 0.05);
  }

  // ---------- low level synth ----------
  env(gainNode, t0, attack, decay, peak, sustain = 0.0001) {
    const g = gainNode.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
    g.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t0 + attack + decay);
  }

  noiseBurst(t0, dur, { volume = 0.4, type = 'bandpass', freq = 1200, q = 1.2, sweep = 0, dest = null } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, t0);
    if (sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(60, sweep), t0 + dur);
    filt.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t0, 0.005, dur, volume);
    src.connect(filt).connect(g).connect(dest || this.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  tone(t0, dur, { type = 'sine', freq = 440, freqEnd = null, volume = 0.3, attack = 0.005, dest = null, detune = 0 } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    o.detune.value = detune;
    const g = ctx.createGain();
    this.env(g, t0, attack, dur, volume, 0.0001);
    o.connect(g).connect(dest || this.sfxBus);
    o.start(t0);
    o.stop(t0 + dur + 0.06);
  }

  // ---------- SFX ----------
  sfx(name, intensity = 1) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'slash':
        this.noiseBurst(t, 0.13, { volume: 0.22 * intensity, freq: 2400, sweep: 420, q: 2.4 });
        this.tone(t, 0.1, { type: 'triangle', freq: 620, freqEnd: 240, volume: 0.055 * intensity });
        break;
      case 'slashHeavy':
        this.noiseBurst(t, 0.22, { volume: 0.3, freq: 1800, sweep: 180, q: 1.8 });
        this.tone(t, 0.22, { type: 'sawtooth', freq: 180, freqEnd: 60, volume: 0.08 });
        break;
      case 'hit':
        this.noiseBurst(t, 0.09, { volume: 0.32, type: 'lowpass', freq: 900, sweep: 180, q: 0.8 });
        this.tone(t, 0.12, { type: 'sine', freq: 150, freqEnd: 52, volume: 0.34 });
        this.tone(t, 0.06, { type: 'square', freq: 780, freqEnd: 300, volume: 0.035 });
        break;
      case 'kill':
        this.tone(t, 0.3, { type: 'sine', freq: 120, freqEnd: 38, volume: 0.35 });
        this.noiseBurst(t, 0.28, { volume: 0.24, type: 'lowpass', freq: 1400, sweep: 120 });
        this.tone(t + 0.03, 0.2, { type: 'triangle', freq: 880, freqEnd: 1320, volume: 0.05 });
        break;
      case 'jump':
        this.tone(t, 0.14, { type: 'sine', freq: 280, freqEnd: 620, volume: 0.1 });
        this.noiseBurst(t, 0.1, { volume: 0.06, type: 'highpass', freq: 1200 });
        break;
      case 'doubleJump':
        this.tone(t, 0.18, { type: 'triangle', freq: 420, freqEnd: 900, volume: 0.1 });
        this.noiseBurst(t, 0.16, { volume: 0.09, type: 'bandpass', freq: 1800, sweep: 3000, q: 3 });
        break;
      case 'dash':
        this.noiseBurst(t, 0.24, { volume: 0.26, type: 'bandpass', freq: 900, sweep: 2600, q: 1.1 });
        this.tone(t, 0.16, { type: 'sine', freq: 90, freqEnd: 45, volume: 0.14 });
        break;
      case 'hurt':
        this.noiseBurst(t, 0.24, { volume: 0.34, type: 'lowpass', freq: 800, sweep: 90 });
        this.tone(t, 0.26, { type: 'sawtooth', freq: 220, freqEnd: 60, volume: 0.18 });
        this.tone(t + 0.02, 0.2, { type: 'square', freq: 110, freqEnd: 44, volume: 0.08 });
        break;
      case 'pickup':
        this.tone(t, 0.16, { type: 'sine', freq: 660, volume: 0.1 });
        this.tone(t + 0.07, 0.22, { type: 'sine', freq: 990, volume: 0.09 });
        break;
      case 'parry':
        this.tone(t, 0.18, { type: 'triangle', freq: 1900, freqEnd: 1400, volume: 0.14 });
        this.tone(t + 0.01, 0.26, { type: 'sine', freq: 2600, volume: 0.06 });
        this.noiseBurst(t, 0.08, { volume: 0.18, type: 'highpass', freq: 3400 });
        break;
      case 'burst':
        this.noiseBurst(t, 0.7, { volume: 0.4, type: 'bandpass', freq: 300, sweep: 4200, q: 0.8 });
        this.tone(t, 0.75, { type: 'sawtooth', freq: 60, freqEnd: 32, volume: 0.24 });
        this.tone(t + 0.06, 0.6, { type: 'triangle', freq: 320, freqEnd: 140, volume: 0.12 });
        break;
      case 'arrow':
        this.noiseBurst(t, 0.18, { volume: 0.13, type: 'bandpass', freq: 1800, sweep: 700, q: 4 });
        break;
      case 'slam':
        this.tone(t, 0.5, { type: 'sine', freq: 78, freqEnd: 26, volume: 0.45 });
        this.noiseBurst(t, 0.36, { volume: 0.35, type: 'lowpass', freq: 500, sweep: 60 });
        break;
      case 'roar':
        this.tone(t, 0.9, { type: 'sawtooth', freq: 90, freqEnd: 34, volume: 0.18 });
        this.tone(t + 0.05, 0.8, { type: 'square', freq: 64, freqEnd: 28, volume: 0.08 });
        this.noiseBurst(t, 0.9, { volume: 0.28, type: 'bandpass', freq: 420, sweep: 90, q: 1.2 });
        break;
      case 'wave':
        this.tone(t, 0.4, { type: 'sine', freq: 220, volume: 0.08 });
        this.tone(t + 0.16, 0.5, { type: 'sine', freq: 330, volume: 0.07 });
        this.tone(t + 0.32, 0.7, { type: 'sine', freq: 440, volume: 0.06 });
        break;
      case 'combo':
        this.tone(t, 0.1, { type: 'triangle', freq: 720 + Math.min(intensity, 8) * 70, volume: 0.045 });
        break;
      case 'click':
        this.tone(t, 0.05, { type: 'square', freq: 320, volume: 0.035 });
        break;
      case 'death':
        this.tone(t, 1.5, { type: 'sawtooth', freq: 140, freqEnd: 26, volume: 0.18 });
        this.tone(t, 1.6, { type: 'sine', freq: 60, freqEnd: 22, volume: 0.26 });
        this.noiseBurst(t, 1.2, { volume: 0.2, type: 'lowpass', freq: 600, sweep: 60 });
        break;
      case 'victory':
        [0, 0.18, 0.36, 0.7].forEach((d, i) => {
          this.tone(t + d, 0.9 - i * 0.1, { type: 'sine', freq: [262, 330, 392, 523][i], volume: 0.09 });
        });
        break;
    }
  }

  startDrone() {
    const ctx = this.ctx;
    if (!ctx || this.droneStarted) return;
    this.droneStarted = true;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 220;
    filt.Q.value = 2;
    const oscs = [55, 82.41, 110.2].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 7;
      o.connect(filt);
      o.start();
      return o;
    });
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(filt.frequency);
    lfo.start();
    filt.connect(g).connect(this.musicBus);
    g.gain.setTargetAtTime(0.06, ctx.currentTime, 2.5);
    this.drone = { g, oscs };
  }

  schedule() {
    if (!this.running || !this.ctx || this.paused) return;
    const ctx = this.ctx;
    if (this.nextNote < ctx.currentTime) this.nextNote = ctx.currentTime + 0.05;
    const tempo = this.mode === 'boss' ? 0.16 : this.mode === 'battle' ? 0.23 : 0.34;
    while (this.nextNote < ctx.currentTime + 0.5) {
      this.playStep(this.step, this.nextNote);
      this.step = (this.step + 1) % 32;
      this.nextNote += tempo;
    }
  }

  playStep(step, t) {
    const battle = this.mode === 'battle' || this.mode === 'boss';
    const boss = this.mode === 'boss';
    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

    // taiko heartbeat
    if (battle) {
      if (step % 8 === 0 || step % 8 === 3) {
        this.tone(t, 0.42, { type: 'sine', freq: boss ? 88 : 76, freqEnd: 34, volume: boss ? 0.2 : 0.13, dest: this.musicBus });
        this.noiseBurst(t, 0.14, { volume: 0.07, type: 'lowpass', freq: 320, sweep: 60, dest: this.musicBus });
      }
      if (boss && step % 4 === 2) {
        this.tone(t, 0.18, { type: 'sine', freq: 110, freqEnd: 50, volume: 0.1, dest: this.musicBus });
      }
    } else if (step % 16 === 0) {
      this.tone(t, 0.5, { type: 'sine', freq: 66, freqEnd: 32, volume: 0.09, dest: this.musicBus });
    }

    // koto / shamisen plucks
    const kotoPattern = battle
      ? [0, 3, 6, 10, 14, 18, 22, 26]
      : [2, 9, 17, 24, 28];
    if (kotoPattern.includes(step) && Math.random() < (battle ? 0.92 : 0.6)) {
      const note = scale[(step * 3 + (step % 5)) % scale.length] * (boss ? 0.5 : 1);
      this.koto(t, note, battle ? 0.055 : 0.04);
    }

    // sparse flute phrases
    if (battle && step === 18 && Math.random() < 0.5) {
      this.flute(t, scale[(Math.random() * scale.length) | 0] * 2, 1.4);
    }
    if (boss && step % 16 === 7) {
      this.koto(t, scale[step % scale.length] * 0.5, 0.075);
    }
  }

  koto(t, freq, vol) {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    o.type = 'triangle';
    o2.type = 'sine';
    o.frequency.value = freq;
    o2.frequency.value = freq * 2.01;
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(4200, t);
    filt.frequency.exponentialRampToValueAtTime(600, t + 0.45);
    this.env(g, t, 0.004, 0.55, vol);
    o.connect(filt);
    o2.connect(filt);
    filt.connect(g).connect(this.musicBus);
    o.start(t); o2.start(t);
    o.stop(t + 0.7); o2.stop(t + 0.7);
  }

  flute(t, freq, dur) {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    lfo.frequency.value = 5.2;
    lg.gain.value = 4;
    lfo.connect(lg).connect(o.frequency);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2200;
    this.env(g, t, 0.35, dur, 0.035);
    o.connect(filt).connect(g).connect(this.musicBus);
    o.start(t); lfo.start(t);
    o.stop(t + dur + 0.4); lfo.stop(t + dur + 0.4);
  }
}

export const sound = new SoundEngine();
