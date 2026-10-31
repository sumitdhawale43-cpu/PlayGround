/* ============================================================
   GRAVITY BREAK — audio engine
   All SFX are synthesized with WebAudio (no assets needed).
   Includes a lightweight procedurally-scheduled music loop.
   ============================================================ */
(function (root) {
  'use strict';

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.enabled = true;
    this.musicOn = true;
    this._musicTimer = null;
    this._step = 0;
    this._nextTime = 0;
    this.bpm = 116;
  }

  AudioEngine.prototype._ensure = function () {
    if (this.ctx) return true;
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
      return true;
    } catch (e) { return false; }
  };

  AudioEngine.prototype.resume = function () {
    if (this._ensure() && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(function () {});
    }
  };

  AudioEngine.prototype.setSound = function (on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.55 : 0;
  };

  /* Basic tone helper */
  AudioEngine.prototype._tone = function (opt) {
    if (!this._ensure() || !this.enabled) return;
    var t0 = this.ctx.currentTime + (opt.delay || 0);
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = opt.type || 'square';
    osc.frequency.setValueAtTime(opt.f0 || 440, t0);
    if (opt.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opt.f1), t0 + (opt.slide || 0.1));
    var v = opt.vol || 0.2;
    var a = opt.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (opt.dur || 0.15));
    var dest = opt.music ? this.musicGain : this.master;
    osc.connect(g); g.connect(dest);
    osc.start(t0); osc.stop(t0 + (opt.dur || 0.15) + 0.05);
  };

  AudioEngine.prototype._noise = function (opt) {
    if (!this._ensure() || !this.enabled) return;
    var t0 = this.ctx.currentTime + (opt.delay || 0);
    var len = Math.max(1, Math.floor(this.ctx.sampleRate * (opt.dur || 0.2)));
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var g = this.ctx.createGain();
    g.gain.value = opt.vol || 0.2;
    var f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = opt.freq || 1200;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  };

  /* ----- SFX ----- */
  AudioEngine.prototype.jump = function () {
    this._tone({ type: 'square', f0: 260, f1: 620, slide: 0.12, dur: 0.16, vol: 0.14 });
  };
  AudioEngine.prototype.flip = function () {
    this._tone({ type: 'sawtooth', f0: 700, f1: 180, slide: 0.16, dur: 0.2, vol: 0.16 });
    this._tone({ type: 'sine', f0: 140, f1: 560, slide: 0.16, dur: 0.2, vol: 0.1, delay: 0.02 });
  };
  AudioEngine.prototype.land = function () {
    this._noise({ dur: 0.06, vol: 0.10, freq: 500 });
  };
  AudioEngine.prototype.collect = function () {
    this._tone({ type: 'sine', f0: 720, dur: 0.09, vol: 0.16 });
    this._tone({ type: 'sine', f0: 1080, dur: 0.14, vol: 0.16, delay: 0.07 });
  };
  AudioEngine.prototype.checkpoint = function () {
    this._tone({ type: 'triangle', f0: 520, dur: 0.12, vol: 0.16 });
    this._tone({ type: 'triangle', f0: 660, dur: 0.12, vol: 0.16, delay: 0.09 });
    this._tone({ type: 'triangle', f0: 880, dur: 0.2, vol: 0.16, delay: 0.18 });
  };
  AudioEngine.prototype.death = function () {
    this._noise({ dur: 0.4, vol: 0.28, freq: 900 });
    this._tone({ type: 'sawtooth', f0: 420, f1: 60, slide: 0.35, dur: 0.4, vol: 0.2 });
  };
  AudioEngine.prototype.zap = function () {
    this._noise({ dur: 0.08, vol: 0.12, freq: 2500 });
  };
  AudioEngine.prototype.click = function () {
    this._tone({ type: 'square', f0: 880, dur: 0.05, vol: 0.10 });
  };
  AudioEngine.prototype.win = function () {
    var self = this;
    [523, 659, 784, 1047, 1319].forEach(function (f, i) {
      self._tone({ type: 'triangle', f0: f, dur: 0.28, vol: 0.18, delay: i * 0.11 });
    });
  };
  AudioEngine.prototype.complete = function () {
    var self = this;
    [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) {
      self._tone({ type: 'triangle', f0: f, dur: 0.3, vol: 0.16, delay: i * 0.13 });
    });
  };

  /* ----- Music: 16-step loop over a 4-chord loop ----- */
  var CHORDS = [
    [45, 48, 52],   // A minor
    [41, 45, 48],   // F major
    [48, 52, 55],   // C major
    [43, 47, 50]    // G major
  ];
  var ARP = [0, 1, 2, 1, 0, 2, 1, 2];

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  AudioEngine.prototype._schedule = function () {
    if (!this.ctx || !this.enabled || !this.musicOn) return;
    var stepDur = 60 / this.bpm / 4; // 16th notes
    while (this._nextTime < this.ctx.currentTime + 0.25) {
      var s = this._step % 16;
      var chord = CHORDS[Math.floor(this._step / 16) % 4];
      var t0 = this._nextTime;
      // arp lead
      if (s % 2 === 0) {
        var note = chord[ARP[(s / 2) % 8] % 3] + 24;
        this._tone({ type: 'triangle', f0: mtof(note), dur: 0.12, vol: 0.05, delay: t0 - this.ctx.currentTime, music: true });
        // move _tone to absolute time instead:
      }
      // bass
      if (s % 8 === 0) {
        this._tone({ type: 'sawtooth', f0: mtof(chord[0] - 12), dur: 0.34, vol: 0.07, delay: t0 - this.ctx.currentTime, music: true });
      }
      // hat
      if (s % 4 === 2) {
        this._tone({ type: 'square', f0: 6000, dur: 0.03, vol: 0.012, delay: t0 - this.ctx.currentTime, music: true });
      }
      this._step++;
      this._nextTime += stepDur;
    }
  };

  AudioEngine.prototype.startMusic = function () {
    if (!this._ensure() || this._musicTimer) return;
    this._nextTime = this.ctx.currentTime + 0.1;
    var self = this;
    this._musicTimer = setInterval(function () { self._schedule(); }, 80);
  };

  AudioEngine.prototype.stopMusic = function () {
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
  };

  AudioEngine.prototype.setMusic = function (on) {
    this.musicOn = on;
    if (on) this.startMusic(); else this.stopMusic();
  };

  root.GBAudio = new AudioEngine();
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GBAudio;
})(typeof globalThis !== 'undefined' ? globalThis : this);
