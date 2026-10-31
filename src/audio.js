/* Tiny procedural soundtrack + SFX engine (WebAudio, no assets). */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this.muted = false;
    this.mood = 'island';
    this.nextChord = 0;
    this.nextArp = 0;
    this.nextBass = 0;
    this.chordIndex = 0;
    this.arpIndex = 0;
    this.ready = false;
    this.timer = 0;
    this.combatHeat = 0;
  }

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    this.musicGain.connect(lp); lp.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.32;
    this.sfxGain.connect(this.master);

    // gentle delay for the bells
    this.delay = this.ctx.createDelay(1.2);
    this.delay.delayTime.value = 0.34;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.28;
    this.delayWet = this.ctx.createGain();
    this.delayWet.gain.value = 0.3;
    this.delay.connect(this.delayFeedback); this.delayFeedback.connect(this.delay);
    this.delay.connect(this.delayWet); this.delayWet.connect(this.musicGain);

    const len = this.ctx.sampleRate * 1.2;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.nextChord = this.ctx.currentTime + 0.2;
    this.nextArp = this.ctx.currentTime + 1.2;
    this.nextBass = this.ctx.currentTime + 0.2;
    this.ready = true;
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  setMood(mood) {
    if (this.mood === mood) return;
    this.mood = mood;
    this.chordIndex = 0;
    this.nextChord = this.ctx ? this.ctx.currentTime + 0.1 : 0;
    this.nextArp = this.ctx ? this.ctx.currentTime + 0.8 : 0;
  }

  _note(freq, dur, type = 'sine', gain = 0.1, when = 0, dest = null, attack = 0.03, release = 0.3, detune = 0) {
    if (!this.ready) return;
    const t = when || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq; osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.05, dur));
    osc.connect(g); g.connect(dest || this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.08);
    return g;
  }

  _noise(dur, gain = 0.2, when = 0, filterFreq = 1800, q = 1, type = 'bandpass') {
    if (!this.ready) return;
    const t = when || this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = filterFreq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }

  update(dt) {
    if (!this.ready) return;
    this.timer += dt;
    const now = this.ctx.currentTime;
    const boss = this.mood === 'boss';
    const dungeon = this.mood === 'dungeon';
    // chords
    if (now >= this.nextChord) {
      const island = [
        [146.83, 220.0, 293.66, 369.99],
        [130.81, 196.0, 261.63, 329.63],
        [174.61, 261.63, 349.23, 440.0],
        [164.81, 246.94, 329.63, 415.3],
      ];
      const dark = [
        [110.0, 164.81, 220.0, 261.63],
        [98.0, 146.83, 196.0, 233.08],
        [87.31, 130.81, 174.61, 220.0],
        [103.83, 155.56, 207.65, 246.94],
      ];
      const prog = boss || dungeon ? dark : island;
      const chord = prog[this.chordIndex % prog.length];
      this.chordIndex++;
      const dur = boss ? 3.2 : 4.4;
      chord.forEach((f, i) => {
        this._note(f, dur, i === 0 ? 'triangle' : 'sine', i === 0 ? 0.055 : 0.035, now, null, 0.8, dur * 0.8, i % 2 ? 3 : -3);
      });
      // airy pad high
      this._note(chord[2] * 2, dur * 0.9, 'sine', 0.018, now + 0.2, null, 1.2, dur);
      this.nextChord = now + dur;
    }
    // arpeggio bells
    if (now >= this.nextArp) {
      const scale = boss ? [220, 261.63, 311.13, 369.99, 440, 523.25] : [293.66, 369.99, 440, 523.25, 587.33, 739.99, 880];
      const f = scale[(this.arpIndex * 3 + this.chordIndex) % scale.length];
      const g = this._note(f, boss ? 0.5 : 0.9, 'sine', boss ? 0.035 : 0.045, now, null, 0.005, boss ? 0.4 : 0.8);
      if (g) { g.connect(this.delay); }
      this.arpIndex++;
      this.nextArp = now + (boss ? 0.46 : dungeon ? 1.1 : 0.72);
    }
    // bass pulse
    if (now >= this.nextBass) {
      const root = boss ? 55 : dungeon ? 73.42 : 73.42;
      this._note(root, boss ? 0.55 : 1.6, boss ? 'sawtooth' : 'triangle', boss ? 0.03 : 0.045, now, null, 0.02, boss ? 0.5 : 1.4);
      this.nextBass = now + (boss ? 0.75 : 2.8);
    }
    // distant wind / cave rumble
    if (this.timer > 7) {
      this.timer = 0;
      this._noise(dungeon || boss ? 3.2 : 4.5, 0.012, now, dungeon ? 260 : 900, 0.6, 'lowpass');
    }
  }

  /* ---------------- SFX ---------------- */
  swing(heavy = false) {
    if (!this.ready) return;
    this._noise(heavy ? 0.32 : 0.18, heavy ? 0.25 : 0.16, 0, heavy ? 700 : 1400, 1.4);
    const f = heavy ? 180 : 320;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.2);
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t + 0.25);
  }

  hit(heavy = false) {
    if (!this.ready) return;
    this._noise(heavy ? 0.16 : 0.09, heavy ? 0.3 : 0.2, 0, heavy ? 500 : 1100, 0.9);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(heavy ? 120 : 200, t); osc.frequency.exponentialRampToValueAtTime(55, t + 0.16);
    g.gain.setValueAtTime(heavy ? 0.24 : 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t + 0.2);
  }

  enemyWindup() { this._noise(0.14, 0.06, 0, 420, 2.5); }
  enemyAttack() { this._noise(0.14, 0.12, 0, 900, 1.2); }
  enemyDeath(boss = false) {
    this._noise(boss ? 1.4 : 0.4, boss ? 0.3 : 0.14, 0, boss ? 200 : 600, 0.7, 'lowpass');
    const t = this.ctx?.currentTime;
    if (!t) return;
    const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(boss ? 90 : 260, t); osc.frequency.exponentialRampToValueAtTime(boss ? 35 : 90, t + (boss ? 1.2 : 0.3));
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + (boss ? 1.3 : 0.35));
    osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t + (boss ? 1.4 : 0.4));
  }

  magic() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(240 + i * 80, t);
      osc.frequency.exponentialRampToValueAtTime(960 + i * 240, t + 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t + 0.75);
    }
    this._noise(0.5, 0.12, 0, 2600, 0.8);
  }

  pickup() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [880, 1174.66, 1567.98].forEach((f, i) => {
      this._note(f, 0.35, 'sine', 0.09, t + i * 0.06, this.sfxGain, 0.005, 0.3);
    });
  }

  coin() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._note(1318.5, 0.12, 'triangle', 0.05, t, this.sfxGain, 0.005, 0.1);
    this._note(1760, 0.18, 'triangle', 0.04, t + 0.05, this.sfxGain, 0.005, 0.14);
  }

  chest() {
    if (!this.ready) return;
    this._noise(0.3, 0.16, 0, 500, 0.8);
    const t = this.ctx.currentTime;
    [392, 523.25, 659.25, 783.99].forEach((f, i) => this._note(f, 0.5, 'sine', 0.08, t + 0.08 + i * 0.08, this.sfxGain, 0.01, 0.4));
  }

  quest() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._note(f, 0.7, 'triangle', 0.1, t + i * 0.12, this.sfxGain, 0.01, 0.55));
  }

  levelUp() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this._note(f, 0.9, 'sine', 0.1, t + i * 0.09, this.sfxGain, 0.01, 0.8);
      this._note(f * 2, 0.6, 'sine', 0.03, t + i * 0.09, this.sfxGain, 0.01, 0.5);
    });
  }

  jump() { this._noise(0.16, 0.08, 0, 1200, 1.5); }
  dodge() { this._noise(0.24, 0.12, 0, 700, 1.2); }
  hurt() {
    if (!this.ready) return;
    this._noise(0.24, 0.22, 0, 500, 0.7, 'lowpass');
    this._note(120, 0.3, 'sawtooth', 0.08, 0, this.sfxGain, 0.005, 0.25);
  }

  heal() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 880].forEach((f, i) => this._note(f, 0.6, 'sine', 0.07, t + i * 0.1, this.sfxGain, 0.02, 0.5));
  }

  checkpoint() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((f, i) => this._note(f, 1.1, 'sine', 0.08, t + i * 0.14, this.sfxGain, 0.02, 0.9));
  }

  click() {
    if (!this.ready) return;
    this._note(620, 0.09, 'triangle', 0.06, 0, this.sfxGain, 0.003, 0.07);
  }

  bossRoar() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._noise(1.6, 0.4, t, 180, 0.8, 'lowpass');
    [55, 73.42, 110].forEach((f, i) => {
      const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 1.4);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.2); g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t + 1.6);
    });
  }

  bossGrowl() {
    if (!this.ready) return;
    this._noise(0.5, 0.16, 0, 220, 1.0, 'lowpass');
    this._note(82, 0.45, 'sawtooth', 0.06, 0, this.sfxGain, 0.02, 0.4);
  }

  victory() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this._note(f, 1.8, 'triangle', 0.1, t + i * 0.16, this.sfxGain, 0.02, 1.5);
      this._note(f * 0.5, 1.8, 'sine', 0.05, t + i * 0.16, this.sfxGain, 0.05, 1.4);
    });
  }
}
