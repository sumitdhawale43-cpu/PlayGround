/* ============================================================
   WebAudio sound: synthesised engine, tyre squeal, nitro and
   one-shot cues. No external audio files required.
   ============================================================ */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ok = false;
    this.started = false;
    this.noiseBuf = null;
    this.engineGain = null;
    this.skidGain = null;
    this.boostGain = null;
    this.filter = null;
    this.osc1 = null;
    this.osc2 = null;
    this.master = null;
    this._skidSrc = null;
    this._boostSrc = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.85;
      this.master.connect(ctx.destination);

      // --- noise buffer (shared)
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;

      // --- engine: two oscillators -> lowpass
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 400;
      this.filter.Q.value = 7;

      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0;

      this.osc1 = ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.value = 60;
      this.osc2 = ctx.createOscillator();
      this.osc2.type = 'square';
      this.osc2.frequency.value = 30;
      const g2 = ctx.createGain();
      g2.gain.value = .5;
      this.osc1.connect(this.filter);
      this.osc2.connect(g2);
      g2.connect(this.filter);
      this.filter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.osc1.start();
      this.osc2.start();

      // --- tyre squeal
      const skidSrc = ctx.createBufferSource();
      skidSrc.buffer = buf;
      skidSrc.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1700;
      bp.Q.value = 1.6;
      this.skidGain = ctx.createGain();
      this.skidGain.gain.value = 0;
      skidSrc.connect(bp);
      bp.connect(this.skidGain);
      this.skidGain.connect(this.master);
      skidSrc.start();
      this._skidSrc = skidSrc;
      this._skidFilter = bp;

      // --- nitro hiss
      const boostSrc = ctx.createBufferSource();
      boostSrc.buffer = buf;
      boostSrc.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      this.boostGain = ctx.createGain();
      this.boostGain.gain.value = 0;
      boostSrc.connect(hp);
      hp.connect(this.boostGain);
      this.boostGain.connect(this.master);
      boostSrc.start();
      this._boostSrc = boostSrc;

      this.ok = true;
    } catch (e) {
      this.ok = false;
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(m) {
    this.muted = m;
    try {
      if (this.master) this.master.gain.value = m ? 0 : 0.85;
    } catch (e) { /* ignore */ }
  }

  /** continuous mix, called once per rendered frame */
  mix(s) {
    if (!this.ok || !this.ctx) return;
    const t = this.ctx.currentTime;
    const r = Math.min(1, s.speed / 620);
    try {
      this.osc1.frequency.setTargetAtTime(52 + r * 168 + s.throttle * 22, t, .05);
      this.osc2.frequency.setTargetAtTime((52 + r * 168) * .5, t, .05);
      this.filter.frequency.setTargetAtTime(340 + r * 2400 + (s.boost ? 900 : 0), t, .06);
      this.engineGain.gain.setTargetAtTime(s.active ? .055 + s.throttle * .055 + r * .03 : 0, t, .08);
      this.skidGain.gain.setTargetAtTime(s.active ? s.skid * .09 : 0, t, .05);
      if (this._skidFilter) this._skidFilter.frequency.setTargetAtTime(1300 + r * 1400, t, .08);
      this.boostGain.gain.setTargetAtTime(s.active && s.boost ? .075 : 0, t, .06);
    } catch (e) { /* ignore */ }
  }

  _tone(freq, dur, type = 'square', vol = .18, when = 0, slideTo = 0) {
    if (!this.ok || this.muted) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + .05);
    } catch (e) { /* ignore */ }
  }

  _noise(dur, vol = .3, freq = 900, type = 'bandpass', when = 0) {
    if (!this.ok || this.muted) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime + when;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.setValueAtTime(freq, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(80, freq * .35), t + dur);
      f.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + .05);
    } catch (e) { /* ignore */ }
  }

  click() { this._tone(660, .07, 'square', .12); }
  back() { this._tone(330, .08, 'square', .1); }
  beep(final = false) { final ? this._tone(880, .35, 'square', .22) : this._tone(520, .14, 'square', .2); }
  boost() { this._noise(.5, .22, 2600, 'highpass'); this._tone(180, .5, 'sawtooth', .1, 0, 760); }
  crash(strength = 1) {
    const v = Math.min(.55, .16 + strength * .4);
    this._noise(.32, v, 700, 'lowpass');
    this._tone(90, .28, 'triangle', v * .7, 0, 45);
  }
  wall(strength = 1) { this.crash(strength * .8); }
  bank(combo = 1) {
    const base = 520 + Math.min(combo, 8) * 70;
    this._tone(base, .1, 'triangle', .16);
    this._tone(base * 1.5, .14, 'triangle', .13, .07);
  }
  fanfare(win = true) {
    const notes = win ? [523, 659, 784, 1047] : [392, 466, 523];
    notes.forEach((f, i) => this._tone(f, .34, 'square', .16, i * .13));
  }
  lap() { this._tone(700, .1, 'triangle', .15); this._tone(950, .14, 'triangle', .13, .08); }
}

export const audio = new AudioEngine();
