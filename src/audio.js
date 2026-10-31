const STORE_KEY = "trench-royale-muted";

export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.muted = localStorage.getItem(STORE_KEY) === "1";
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);

    const len = Math.floor(this.ctx.sampleRate * 1.2);
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  setMuted(m) {
    this.muted = m;
    localStorage.setItem(STORE_KEY, m ? "1" : "0");
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  tone({ freq = 440, endFreq = null, dur = 0.2, type = "sine", gain = 0.2, delay = 0, attack = 0.006 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (endFreq != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.3, gain = 0.2, filter = 900, q = 0.7, type = "lowpass", delay = 0, sweepTo = null }) {
    if (!this.ctx || this.muted || !this.noiseBuf) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(filter, t0);
    if (sweepTo != null) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.001, gain), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  click() {
    this.tone({ freq: 620, endFreq: 780, dur: 0.055, type: "triangle", gain: 0.08 });
  }

  select() {
    this.tone({ freq: 460, endFreq: 620, dur: 0.08, type: "triangle", gain: 0.09 });
  }

  error() {
    this.tone({ freq: 190, endFreq: 120, dur: 0.16, type: "square", gain: 0.06 });
  }

  shoot(weapon = "bazooka") {
    this.resume();
    if (weapon === "grenade") {
      this.noise({ dur: 0.18, gain: 0.16, filter: 1800, sweepTo: 500 });
      this.tone({ freq: 260, endFreq: 120, dur: 0.18, type: "triangle", gain: 0.14 });
    } else {
      this.noise({ dur: 0.28, gain: 0.24, filter: 2600, sweepTo: 300 });
      this.tone({ freq: 320, endFreq: 70, dur: 0.26, type: "sawtooth", gain: 0.15 });
      this.tone({ freq: 110, endFreq: 45, dur: 0.32, type: "sine", gain: 0.2 });
    }
  }

  explosion(weapon = "bazooka") {
    this.resume();
    const big = weapon === "grenade" ? 1.25 : 1;
    this.noise({ dur: 0.55 * big, gain: 0.34, filter: 1100, sweepTo: 70 });
    this.tone({ freq: 120, endFreq: 32, dur: 0.5 * big, type: "sine", gain: 0.34 });
    this.tone({ freq: 70, endFreq: 24, dur: 0.65 * big, type: "triangle", gain: 0.2, delay: 0.02 });
    this.noise({ dur: 0.2, gain: 0.12, filter: 3400, type: "highpass", delay: 0.02 });
  }

  build(mat = "wood") {
    this.resume();
    const base = mat === "metal" ? 240 : mat === "brick" ? 160 : 120;
    this.noise({ dur: 0.09, gain: 0.13, filter: mat === "metal" ? 3200 : 1200, type: mat === "metal" ? "highpass" : "bandpass", q: 1.4 });
    this.tone({ freq: base * 2.2, endFreq: base, dur: 0.11, type: "triangle", gain: 0.14 });
    if (mat === "metal") this.tone({ freq: 920, endFreq: 700, dur: 0.16, type: "sine", gain: 0.07, delay: 0.02 });
  }

  jump() {
    this.tone({ freq: 220, endFreq: 460, dur: 0.12, type: "sine", gain: 0.07 });
  }

  hit() {
    this.noise({ dur: 0.12, gain: 0.12, filter: 800, sweepTo: 200 });
    this.tone({ freq: 150, endFreq: 70, dur: 0.16, type: "square", gain: 0.08 });
  }

  reaction() {
    this.resume();
    this.noise({ dur: 0.16, gain: 0.2, filter: 4200, sweepTo: 700, type: "highpass" });
    this.tone({ freq: 300, endFreq: 900, dur: 0.18, type: "square", gain: 0.1 });
    this.tone({ freq: 900, endFreq: 500, dur: 0.22, type: "triangle", gain: 0.1, delay: 0.05 });
  }

  death() {
    this.resume();
    this.tone({ freq: 400, endFreq: 90, dur: 0.5, type: "sawtooth", gain: 0.12 });
    this.tone({ freq: 200, endFreq: 50, dur: 0.7, type: "triangle", gain: 0.1, delay: 0.06 });
    this.noise({ dur: 0.4, gain: 0.1, filter: 500, sweepTo: 100 });
  }

  crate() {
    this.resume();
    this.tone({ freq: 660, endFreq: 990, dur: 0.1, type: "triangle", gain: 0.1 });
    this.tone({ freq: 990, endFreq: 1320, dur: 0.12, type: "sine", gain: 0.08, delay: 0.08 });
  }

  turn() {
    this.tone({ freq: 520, endFreq: 660, dur: 0.09, type: "triangle", gain: 0.06 });
    this.tone({ freq: 780, endFreq: 780, dur: 0.07, type: "sine", gain: 0.04, delay: 0.08 });
  }

  win() {
    this.resume();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.3, type: "triangle", gain: 0.12, delay: i * 0.11 });
      this.tone({ freq: f / 2, dur: 0.34, type: "sine", gain: 0.06, delay: i * 0.11 });
    });
    this.tone({ freq: 1046.5, dur: 0.8, type: "sine", gain: 0.07, delay: 0.55 });
  }
}
