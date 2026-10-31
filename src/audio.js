// ============================================================
// NEON OVERDRIVE — procedural audio engine
// All sounds are synthesized with WebAudio: no external assets.
// ============================================================

const MUTE_KEY = 'neon-overdrive.muted';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class NeonAudio {
  constructor() {
    this.ac = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.engineBus = null;
    this.noiseBuffer = null;
    this.engine = null;
    this.wind = null;
    this.nitro = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.nextNote = 0;
    this.musicWanted = false;
    this.engineOn = false;
    this.muted = false;
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  async unlock() {
    if (!this.ac) this.#init();
    if (!this.ac) return;
    if (this.ac.state === 'suspended') {
      try { await this.ac.resume(); } catch { /* gesture still pending */ }
    }
  }

  #init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ac = new AC({ latencyHint: 'interactive' });
      this.ac = ac;

      this.master = ac.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;

      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 20;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      this.master.connect(comp);
      comp.connect(ac.destination);

      this.sfxBus = ac.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);

      this.musicBus = ac.createGain();
      this.musicBus.gain.value = 0.0;
      this.musicBus.connect(this.master);

      this.engineBus = ac.createGain();
      this.engineBus.gain.value = 0.9;
      this.engineBus.connect(this.master);

      const length = Math.floor(ac.sampleRate * 2);
      const buffer = ac.createBuffer(1, length, ac.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.6 + white * 0.4;
        data[i] = last;
      }
      this.noiseBuffer = buffer;
    } catch {
      this.ac = null;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* private mode */ }
    if (this.master && this.ac) {
      const t = this.ac.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, t, 0.03);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) this.click();
    return this.muted;
  }

  get time() {
    return this.ac ? this.ac.currentTime : 0;
  }

  #noise(duration, { type = 'bandpass', freq = 1000, q = 0.8, gain = 0.2, attack = 0.004 } = {}) {
    if (!this.ac || !this.noiseBuffer) return null;
    const ac = this.ac;
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, ac.currentTime);
    filter.Q.value = q;
    const g = ac.createGain();
    const t = ac.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + duration + 0.05);
    return { src, filter, gain: g };
  }

  #ping(freq, { duration = 0.12, type = 'sine', gain = 0.16, slide = 1, delay = 0, dest = null } = {}) {
    if (!this.ac) return;
    const ac = this.ac;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), t0);
    if (slide !== 1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, freq * slide), t0 + duration);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + Math.min(0.015, duration * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(dest || this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  click() {
    this.#ping(240, { duration: 0.055, type: 'square', gain: 0.035, slide: 2.1 });
  }

  start() {
    this.#ping(120, { duration: 0.7, type: 'sawtooth', gain: 0.08, slide: 5 });
    this.#noise(0.65, { type: 'highpass', freq: 300, q: 0.5, gain: 0.05 });
    this.#ping(880, { duration: 0.55, type: 'triangle', gain: 0.07, slide: 1.8, delay: 0.14 });
  }

  countdown(final = false) {
    this.#ping(final ? 1046 : 523, {
      duration: final ? 0.38 : 0.1,
      type: 'square',
      gain: final ? 0.055 : 0.035,
    });
  }

  coin(chain = 1) {
    const base = 920 + Math.min(8, chain) * 55;
    this.#ping(base, { duration: 0.09, type: 'sine', gain: 0.1 });
    this.#ping(base * 1.5, { duration: 0.16, type: 'sine', gain: 0.07, delay: 0.055 });
  }

  orb() {
    this.#ping(320, { duration: 0.32, type: 'triangle', gain: 0.11, slide: 3.3 });
    this.#ping(760, { duration: 0.4, type: 'sine', gain: 0.06, slide: 1.6, delay: 0.03 });
    this.#noise(0.32, { type: 'bandpass', freq: 2600, q: 2, gain: 0.035 });
  }

  surge() {
    this.#ping(180, { duration: 0.6, type: 'sawtooth', gain: 0.09, slide: 5 });
    [523, 659, 784, 1046].forEach((f, i) => {
      this.#ping(f, { duration: 0.5, type: 'triangle', gain: 0.06, delay: i * 0.055 });
    });
  }

  nearMiss() {
    const n = this.#noise(0.38, { type: 'bandpass', freq: 2400, q: 1.4, gain: 0.1 });
    if (n) {
      const t = this.ac.currentTime;
      n.filter.frequency.exponentialRampToValueAtTime(360, t + 0.36);
    }
    this.#ping(1400, { duration: 0.13, type: 'sine', gain: 0.045, slide: 0.65, delay: 0.02 });
  }

  crash() {
    const n = this.#noise(0.55, { type: 'lowpass', freq: 1800, q: 0.7, gain: 0.26 });
    if (n) {
      const t = this.ac.currentTime;
      n.filter.frequency.exponentialRampToValueAtTime(180, t + 0.5);
    }
    this.#ping(120, { duration: 0.45, type: 'sawtooth', gain: 0.2, slide: 0.3 });
    this.#ping(70, { duration: 0.6, type: 'sine', gain: 0.28, slide: 0.55 });
    this.#noise(0.16, { type: 'highpass', freq: 4200, q: 0.7, gain: 0.08 });
  }

  explode() {
    this.#noise(1.2, { type: 'lowpass', freq: 1200, q: 0.5, gain: 0.32, attack: 0.006 });
    this.#ping(90, { duration: 1.1, type: 'sine', gain: 0.3, slide: 0.3 });
    this.#ping(160, { duration: 0.5, type: 'sawtooth', gain: 0.14, slide: 0.2 });
    this.#noise(0.5, { type: 'highpass', freq: 3000, gain: 0.06, attack: 0.15 });
  }

  levelUp() {
    [392, 523, 659, 784].forEach((f, i) => {
      this.#ping(f, { duration: 0.32, type: 'triangle', gain: 0.075, delay: i * 0.06 });
    });
  }

  gameOver() {
    if (!this.ac) return;
    this.stopEngine();
    this.stopMusic();
    this.#ping(330, { duration: 0.9, type: 'sawtooth', gain: 0.09, slide: 0.16 });
    this.#ping(165, { duration: 1.2, type: 'triangle', gain: 0.09, slide: 0.3, delay: 0.08 });
    this.#noise(1.0, { type: 'lowpass', freq: 700, q: 0.6, gain: 0.05, attack: 0.2 });
  }

  highScore() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      this.#ping(f, { duration: 0.5, type: 'triangle', gain: 0.07, delay: i * 0.085 });
    });
  }

  startEngine() {
    if (!this.ac || this.engineOn) return;
    const ac = this.ac;
    this.engineOn = true;

    const gain = ac.createGain();
    gain.gain.value = 0.0001;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 2.5;

    const o1 = ac.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = 58;
    const o2 = ac.createOscillator();
    o2.type = 'square';
    o2.frequency.value = 87;
    o2.detune.value = 9;
    const o3 = ac.createOscillator();
    o3.type = 'sawtooth';
    o3.frequency.value = 29;
    o3.detune.value = -7;

    const subGain = ac.createGain();
    subGain.gain.value = 0.35;
    const mix = ac.createGain();
    mix.gain.value = 0.5;

    o1.connect(mix);
    o2.connect(mix);
    o3.connect(subGain);
    subGain.connect(mix);
    mix.connect(filter);
    filter.connect(gain);
    gain.connect(this.engineBus);

    o1.start();
    o2.start();
    o3.start();
    gain.gain.setTargetAtTime(0.02, ac.currentTime, 0.15);

    // wind / tyre hiss
    const windSrc = ac.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    const windFilter = ac.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 1500;
    windFilter.Q.value = 0.45;
    const windGain = ac.createGain();
    windGain.gain.value = 0.0001;
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.engineBus);
    windSrc.start();

    // nitro thrust
    const nitroSrc = ac.createBufferSource();
    nitroSrc.buffer = this.noiseBuffer;
    nitroSrc.loop = true;
    const nitroFilter = ac.createBiquadFilter();
    nitroFilter.type = 'bandpass';
    nitroFilter.frequency.value = 850;
    nitroFilter.Q.value = 1.1;
    const nitroGain = ac.createGain();
    nitroGain.gain.value = 0.0001;
    nitroSrc.connect(nitroFilter);
    nitroFilter.connect(nitroGain);
    nitroGain.connect(this.engineBus);
    nitroSrc.start();

    this.engine = {
      gain, filter, o1, o2, o3, windGain, windFilter,
      nitroGain, nitroFilter, nitroSrc, windSrc,
    };
  }

  stopEngine() {
    if (!this.ac || !this.engineOn || !this.engine) return;
    const { gain, o1, o2, o3, windSrc, nitroSrc } = this.engine;
    const t = this.ac.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0.0001, t, 0.12);
    try {
      o1.stop(t + 0.5);
      o2.stop(t + 0.5);
      o3.stop(t + 0.5);
      windSrc.stop(t + 0.5);
      nitroSrc.stop(t + 0.5);
    } catch { /* already stopped */ }
    this.engine = null;
    this.engineOn = false;
    this.nitroActive = false;
  }

  setEngine(norm, boost = 0) {
    if (!this.engine || !this.ac) return;
    const t = this.ac.currentTime;
    const e = this.engine;
    const base = 48 + norm * 118 + boost * 34;
    e.o1.frequency.setTargetAtTime(base, t, 0.06);
    e.o2.frequency.setTargetAtTime(base * 1.503, t, 0.06);
    e.o3.frequency.setTargetAtTime(base * 0.5, t, 0.06);
    e.filter.frequency.setTargetAtTime(320 + norm * 720 + boost * 500, t, 0.1);
    e.gain.gain.setTargetAtTime(0.016 + norm * 0.012 + boost * 0.006, t, 0.08);
    e.windGain.gain.setTargetAtTime(0.006 + norm * 0.016, t, 0.12);
    e.windFilter.frequency.setTargetAtTime(900 + norm * 1800, t, 0.1);
  }

  setNitro(active) {
    if (!this.engine || !this.ac) return;
    if (this.nitroActive === active) return;
    this.nitroActive = active;
    const t = this.ac.currentTime;
    this.engine.nitroGain.gain.cancelScheduledValues(t);
    this.engine.nitroGain.gain.setTargetAtTime(active ? 0.065 : 0.0001, t, active ? 0.06 : 0.2);
    this.engine.nitroFilter.frequency.setTargetAtTime(active ? 1400 : 700, t, 0.15);
  }

  startMusic() {
    if (!this.ac || this.musicTimer) return;
    this.musicWanted = true;
    this.musicBus.gain.setTargetAtTime(0.42, this.ac.currentTime, 0.4);
    this.musicStep = 0;
    this.nextNote = this.ac.currentTime + 0.08;
    this.musicTimer = setInterval(() => this.#scheduleMusic(), 60);
    this.#scheduleMusic();
  }

  stopMusic() {
    this.musicWanted = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ac && this.musicBus) {
      this.musicBus.gain.setTargetAtTime(0.0001, this.ac.currentTime, 0.18);
    }
  }

  #scheduleMusic() {
    if (!this.ac || !this.musicWanted) return;
    const stepDur = 60 / 104 / 4;
    while (this.nextNote < this.ac.currentTime + 0.22) {
      this.#musicStep(this.musicStep, this.nextNote, stepDur);
      this.nextNote += stepDur;
      this.musicStep = (this.musicStep + 1) % 64;
    }
  }

  #musicStep(step, time, stepDur) {
    const ac = this.ac;
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const roots = [33, 29, 24, 31]; // A1, F1, C1, G1
    const root = roots[bar];
    const dest = this.musicBus;

    const scheduleGain = (gain, attack, hold, release, peak) => {
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(peak, time + attack);
      gain.gain.setValueAtTime(peak, time + attack + hold);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);
    };

    // kick
    if (inBar === 0 || inBar === 6 || inBar === 8 || inBar === 11) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(130, time);
      o.frequency.exponentialRampToValueAtTime(44, time + 0.15);
      scheduleGain(g, 0.004, 0.02, 0.2, 0.26);
      o.connect(g); g.connect(dest);
      o.start(time); o.stop(time + 0.3);
    }

    // snare
    if (inBar === 4 || inBar === 12) {
      const src = ac.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.9;
      const g = ac.createGain();
      scheduleGain(g, 0.003, 0.01, 0.14, 0.09);
      src.connect(f); f.connect(g); g.connect(dest);
      src.start(time); src.stop(time + 0.18);
    }

    // hats
    if (inBar % 2 === 0) {
      const src = ac.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 7000;
      const g = ac.createGain();
      scheduleGain(g, 0.002, 0.005, inBar % 4 === 0 ? 0.09 : 0.045, 0.035);
      src.connect(f); f.connect(g); g.connect(dest);
      src.start(time); src.stop(time + 0.12);
    }

    // bass pulse
    if ([0, 3, 6, 8, 11, 14].includes(inBar)) {
      const o = ac.createOscillator();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();
      o.type = 'sawtooth';
      const note = root + (inBar === 8 ? 12 : 0);
      o.frequency.value = midi(note + 12);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(260, time);
      f.frequency.exponentialRampToValueAtTime(1100, time + 0.05);
      f.frequency.exponentialRampToValueAtTime(240, time + 0.19);
      f.Q.value = 4;
      scheduleGain(g, 0.005, 0.03, 0.16, 0.075);
      o.connect(f); f.connect(g); g.connect(dest);
      o.start(time); o.stop(time + 0.22);
    }

    // arp
    if (inBar % 2 === 0) {
      const notes = [0, 7, 12, 15, 7, 19, 15, 12];
      const chord = [0, 3, 7, 10];
      const rel = notes[(inBar / 2) % notes.length] + chord[bar];
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = midi(root + 36 + rel);
      scheduleGain(g, 0.004, 0.01, 0.13, 0.022);
      o.connect(g); g.connect(dest);
      o.start(time); o.stop(time + 0.18);
    }

    // warm pad at bar start
    if (inBar === 0) {
      const chord = bar === 0 ? [0, 3, 7] : bar === 1 ? [0, 4, 7] : bar === 2 ? [0, 4, 7] : [0, 4, 7];
      chord.forEach((iv, i) => {
        const o = ac.createOscillator();
        const f = ac.createBiquadFilter();
        const g = ac.createGain();
        o.type = 'sawtooth';
        o.frequency.value = midi(root + 24 + iv);
        o.detune.value = (i - 1) * 6;
        f.type = 'lowpass';
        f.frequency.value = 1100;
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(0.007, time + 0.35);
        g.gain.setValueAtTime(0.007, time + 1.4);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 2.25);
        o.connect(f); f.connect(g); g.connect(dest);
        o.start(time); o.stop(time + 2.4);
      });
    }
  }
}
