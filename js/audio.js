const TAU = Math.PI * 2;
const MUTE_KEY = "borrowed-seconds-muted";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.noise = null;
    this.muted = false;
    this.music = null;
    this.musicTimer = null;
    this.nextNoteAt = 0;
    this.step = 0;
    this.lastPlayed = Object.create(null);
    this.slowOn = false;
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      this.muted = false;
    }
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      const ctx = new AudioCtor();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0.0001 : 0.62;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 22;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.2;
      master.connect(compressor);
      compressor.connect(ctx.destination);

      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

      this.ctx = ctx;
      this.master = master;
      this.compressor = compressor;
      this.noise = noise;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0");
    } catch {
      /* storage is optional */
    }
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0.0001 : 0.62, now, 0.04);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setSlow(active) {
    if (this.slowOn === active) return;
    this.slowOn = active;
    if (!this.ctx || !this.music) return;
    const now = this.ctx.currentTime;
    const filter = this.music.filter;
    if (filter) filter.frequency.setTargetAtTime(active ? 380 : 1700, now, 0.22);
    const drone = this.music.droneGain;
    if (drone) drone.gain.setTargetAtTime(active ? 0.079 : 0.042, now, 0.3);
    if (active) this.sfx("slowIn");
    else this.sfx("slowOut");
  }

  /* ---------------------------------------------------------------- */
  /* Synthesised sound effects                                         */
  /* ---------------------------------------------------------------- */

  sfx(name, options = {}) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const minGap = name === "hit" ? 0.045 : name === "shoot" ? 0.035 : 0;
    if (minGap) {
      const last = this.lastPlayed[name] || 0;
      if (now - last < minGap) return;
      this.lastPlayed[name] = now;
    }
    try {
      switch (name) {
        case "shoot": {
          const over = Boolean(options.overclock);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = over ? "square" : "triangle";
          osc.frequency.setValueAtTime(over ? 1040 : 720, now);
          osc.frequency.exponentialRampToValueAtTime(over ? 330 : 260, now + 0.085);
          filter.type = "highpass";
          filter.frequency.value = over ? 320 : 180;
          gain.gain.setValueAtTime(over ? 0.055 : 0.038, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (over ? 0.13 : 0.09));
          osc.connect(filter).connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.15);
          if (over) this.noiseBurst(now, 0.045, 2600, 0.028, "bandpass");
          break;
        }
        case "hit":
          this.noiseBurst(now, 0.055, 1500 + Math.random() * 700, 0.05, "bandpass");
          break;
        case "kill": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220 + Math.random() * 50, now);
          osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1800, now);
          filter.frequency.exponentialRampToValueAtTime(240, now + 0.22);
          gain.gain.setValueAtTime(0.075, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
          osc.connect(filter).connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.28);
          this.noiseBurst(now, 0.18, 900, 0.055, "lowpass");
          break;
        }
        case "hurt": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.26);
          gain.gain.setValueAtTime(0.17, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          osc.connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.32);
          this.noiseBurst(now, 0.12, 620, 0.09, "lowpass");
          break;
        }
        case "dash": {
          const src = ctx.createBufferSource();
          src.buffer = this.noise;
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          filter.type = "bandpass";
          filter.Q.value = 1.6;
          filter.frequency.setValueAtTime(1500, now);
          filter.frequency.exponentialRampToValueAtTime(260, now + 0.2);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
          src.connect(filter).connect(gain).connect(this.master);
          src.start(now, Math.random() * 0.4, 0.26);
          break;
        }
        case "pickup": {
          [660, 990].forEach((freq, i) => {
            const t = now + i * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.045, t + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            osc.connect(gain).connect(this.master);
            osc.start(t);
            osc.stop(t + 0.32);
          });
          break;
        }
        case "tick": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(1380, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
          gain.gain.setValueAtTime(0.026, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
          osc.connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case "debt": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(88, now + 0.5);
          filter.type = "lowpass";
          filter.frequency.value = 700;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
          osc.connect(filter).connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.65);
          this.noiseBurst(now, 0.3, 500, 0.035, "lowpass");
          break;
        }
        case "collector": {
          const freqs = [146.8, 220, 311.1];
          freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.94, now + 1.1);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.042 - i * 0.008, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            osc.connect(gain).connect(this.master);
            osc.start(now);
            osc.stop(now + 1.25);
          });
          this.noiseBurst(now, 0.5, 2200, 0.028, "bandpass");
          break;
        }
        case "spawn": {
          this.noiseBurst(now, 0.26, 700, 0.045, "bandpass", 1400);
          break;
        }
        case "wave": {
          const freqs = [110, 164.8, 220, 277.2];
          freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = i === 3 ? "sine" : "sawtooth";
            osc.frequency.value = freq;
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(500, now);
            filter.frequency.exponentialRampToValueAtTime(3200, now + 0.3);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.028, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
            osc.connect(filter).connect(gain).connect(this.master);
            osc.start(now);
            osc.stop(now + 0.9);
          });
          break;
        }
        case "boss": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(58, now);
          osc.frequency.exponentialRampToValueAtTime(29, now + 1.1);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
          osc.connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 1.3);
          this.noiseBurst(now, 0.9, 300, 0.06, "lowpass");
          break;
        }
        case "slowIn": {
          this.noiseBurst(now, 0.5, 400, 0.075, "bandpass", 1800);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(92, now + 0.55);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
          osc.connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.65);
          break;
        }
        case "slowOut": {
          this.noiseBurst(now, 0.35, 1900, 0.04, "bandpass", 500);
          break;
        }
        case "victory": {
          const notes = [261.6, 329.6, 392, 523.3, 659.3];
          notes.forEach((freq, i) => {
            const t = now + i * 0.11;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "triangle";
            osc.frequency.value = freq;
            filter.type = "lowpass";
            filter.frequency.value = 3000;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4 - i * 0.08);
            osc.connect(filter).connect(gain).connect(this.master);
            osc.start(t);
            osc.stop(t + 1.45);
          });
          break;
        }
        case "defeat": {
          const notes = [196, 164.8, 130.8, 98, 65.4];
          notes.forEach((freq, i) => {
            const t = now + i * 0.2;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sawtooth";
            osc.frequency.value = freq;
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(900, t);
            filter.frequency.exponentialRampToValueAtTime(220, t + 0.5);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.055, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
            osc.connect(filter).connect(gain).connect(this.master);
            osc.start(t);
            osc.stop(t + 0.8);
          });
          break;
        }
        case "ui": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
          gain.gain.setValueAtTime(0.02, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
          osc.connect(gain).connect(this.master);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }
        default:
          break;
      }
    } catch {
      /* Never let audio take down the game. */
    }
  }

  noiseBurst(at, duration, frequency, volume, type = "bandpass", endFrequency = 0) {
    if (!this.ctx || !this.noise) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = this.noise;
    filter.type = type;
    filter.Q.value = type === "bandpass" ? 1.3 : 0.7;
    filter.frequency.setValueAtTime(frequency, at);
    if (endFrequency) filter.frequency.exponentialRampToValueAtTime(Math.max(60, endFrequency), at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(at, Math.random() * 0.5, duration + 0.05);
  }

  /* ---------------------------------------------------------------- */
  /* Generative score                                                  */
  /* ---------------------------------------------------------------- */

  startMusic() {
    this.init();
    if (!this.ctx || this.music) return;
    const ctx = this.ctx;
    try {
      const bus = ctx.createGain();
      bus.gain.value = 0.0001;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1700;
      filter.Q.value = 0.5;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.0001;
      droneGain.connect(filter);
      filter.connect(bus);
      bus.connect(this.master);

      const droneOscillators = [];
      [
        { type: "sine", freq: 55, gain: 0.9 },
        { type: "sine", freq: 82.41, gain: 0.32 },
        { type: "triangle", freq: 110, gain: 0.12 },
      ].forEach((spec) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = spec.type;
        osc.frequency.value = spec.freq;
        osc.detune.value = (Math.random() - 0.5) * 7;
        gain.gain.value = spec.gain;
        osc.connect(gain).connect(droneGain);
        osc.start();
        droneOscillators.push(osc);
      });

      const now = ctx.currentTime;
      bus.gain.setTargetAtTime(0.7, now, 0.7);
      droneGain.gain.setTargetAtTime(this.slowOn ? 0.079 : 0.042, now, 0.9);

      this.music = {
        bus,
        filter,
        droneGain,
        droneOscillators,
      };
      this.nextNoteAt = now + 0.15;
      this.step = 0;
      this.musicTimer = setInterval(() => this.scheduleMusic(), 110);
      this.scheduleMusic();
    } catch {
      this.music = null;
    }
  }

  scheduleMusic() {
    if (!this.ctx || !this.music) return;
    const ctx = this.ctx;
    const ahead = ctx.currentTime + 0.32;
    const scale = [0, 3, 5, 7, 10, 12, 15, 10, 7, 3];
    const stepDuration = 0.3;
    while (this.nextNoteAt < ahead) {
      const at = this.nextNoteAt;
      const step = this.step;
      const degree = scale[step % scale.length];
      const freq = 130.81 * Math.pow(2, degree / 12);
      if (step % 2 === 0 || step % 7 === 3) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(step % 4 === 0 ? 0.036 : 0.022, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.46);
        if (pan) {
          pan.pan.value = Math.sin(step * 0.7) * 0.35;
          osc.connect(gain).connect(pan).connect(this.music.filter);
        } else {
          osc.connect(gain).connect(this.music.filter);
        }
        osc.start(at);
        osc.stop(at + 0.5);
      }
      if (step % 8 === 0) {
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(55, at);
        sub.frequency.exponentialRampToValueAtTime(41, at + 0.32);
        subGain.gain.setValueAtTime(0.0001, at);
        subGain.gain.exponentialRampToValueAtTime(0.055, at + 0.02);
        subGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
        sub.connect(subGain).connect(this.music.filter);
        sub.start(at);
        sub.stop(at + 0.65);
      }
      this.nextNoteAt += stepDuration;
      this.step += 1;
    }
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (!this.ctx || !this.music) {
      this.music = null;
      return;
    }
    const music = this.music;
    this.music = null;
    const now = this.ctx.currentTime;
    try {
      music.bus.gain.cancelScheduledValues(now);
      music.bus.gain.setTargetAtTime(0.0001, now, 0.25);
      music.droneOscillators.forEach((osc) => {
        try {
          osc.stop(now + 1.2);
        } catch {
          /* already stopped */
        }
      });
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      try {
        music.bus.disconnect();
      } catch {
        /* ignore */
      }
    }, 1400);
  }

  setPaused(paused) {
    if (!this.ctx) return;
    if (paused) this.ctx.suspend().catch(() => {});
    else this.ctx.resume().catch(() => {});
  }
}

export { TAU, clamp };
