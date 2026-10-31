/* ============================================================
   Synthesised sound. No samples, no downloads — just a small
   modular rig for drones, whimpers and things in the dark.
   ============================================================ */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.muted = false;
    this.reduced = false;
    this.master = null;
    this.reverbIn = null;
    this.ambientGain = null;
    this.monsterGain = null;
    this.monsterPan = null;
    this.breathGain = null;
    this.whineGain = null;
    this.heartTimer = 0;
    this.heartInterval = 1.2;
    this.whisperTimer = 4;
    this.footPan = 1;
  }

  noiseBuffer(seconds = 2) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      lp = lp * 0.98 + white * 0.02;
      d[i] = white * 0.6 + lp * 2.2;
    }
    // fade the loop edges
    const fade = Math.min(2000, len >> 2);
    for (let i = 0; i < fade; i++) {
      const f = i / fade;
      d[i] *= f;
      d[len - 1 - i] *= f;
    }
    return buf;
  }

  makeReverb() {
    const ctx = this.ctx;
    const seconds = 2.4;
    const len = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    conv.connect(wet).connect(this.master);
    return conv;
  }

  async start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const ctx = this.ctx;

      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.62;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 18;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.25;
      this.master.connect(comp).connect(ctx.destination);

      this.reverbIn = this.makeReverb();

      // --- ambient bed ---
      const amb = ctx.createGain();
      amb.gain.value = 0;
      amb.connect(this.master);
      amb.gain.setTargetAtTime(0.5, ctx.currentTime, 2.2);
      this.ambientGain = amb;

      const ambFilter = ctx.createBiquadFilter();
      ambFilter.type = 'lowpass';
      ambFilter.frequency.value = 220;
      ambFilter.Q.value = 0.6;
      ambFilter.connect(amb);

      const droneA = ctx.createOscillator();
      droneA.type = 'sine';
      droneA.frequency.value = 41;
      const ga = ctx.createGain(); ga.gain.value = 0.16;
      droneA.connect(ga).connect(ambFilter);

      const droneB = ctx.createOscillator();
      droneB.type = 'triangle';
      droneB.frequency.value = 61.7;
      const gb = ctx.createGain(); gb.gain.value = 0.055;
      droneB.connect(gb).connect(ambFilter);

      const wind = ctx.createBufferSource();
      wind.buffer = this.noiseBuffer(4);
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 420;
      const gw = ctx.createGain(); gw.gain.value = 0.09;
      wind.connect(windFilter).connect(gw).connect(amb);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 70;
      lfo.connect(lfoGain).connect(ambFilter.frequency);

      droneA.start(); droneB.start(); wind.start(); lfo.start();

      // --- monster presence ---
      const monGain = ctx.createGain();
      monGain.gain.value = 0;
      const monPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (monPan) {
        monGain.connect(monPan).connect(this.master);
      } else {
        monGain.connect(this.master);
      }
      this.monsterGain = monGain;
      this.monsterPan = monPan;

      const growl = ctx.createOscillator();
      growl.type = 'sawtooth';
      growl.frequency.value = 43;
      const growlFilter = ctx.createBiquadFilter();
      growlFilter.type = 'lowpass';
      growlFilter.frequency.value = 130;
      growlFilter.Q.value = 4;
      const growlGain = ctx.createGain();
      growlGain.gain.value = 0.25;
      growl.connect(growlFilter).connect(growlGain).connect(monGain);

      const moist = ctx.createBufferSource();
      moist.buffer = this.noiseBuffer(3);
      moist.loop = true;
      const moistFilter = ctx.createBiquadFilter();
      moistFilter.type = 'bandpass';
      moistFilter.frequency.value = 340;
      moistFilter.Q.value = 1.6;
      const breath = ctx.createGain();
      breath.gain.value = 0.11;
      this.breathGain = breath;
      moist.connect(moistFilter).connect(breath).connect(monGain);

      const breathLfo = ctx.createOscillator();
      breathLfo.type = 'sine';
      breathLfo.frequency.value = 0.35;
      const breathDepth = ctx.createGain();
      breathDepth.gain.value = 0.08;
      breathLfo.connect(breathDepth).connect(breath.gain);

      growl.start(); moist.start(); breathLfo.start();

      // --- gaze whine ---
      const whine = ctx.createOscillator();
      whine.type = 'sine';
      whine.frequency.value = 1720;
      const whine2 = ctx.createOscillator();
      whine2.type = 'sine';
      whine2.frequency.value = 1731;
      const whineGain = ctx.createGain();
      whineGain.gain.value = 0;
      const whineFilter = ctx.createBiquadFilter();
      whineFilter.type = 'bandpass';
      whineFilter.frequency.value = 1750;
      whineFilter.Q.value = 6;
      whine.connect(whineFilter);
      whine2.connect(whineFilter);
      whineFilter.connect(whineGain).connect(this.master);
      this.whineGain = whineGain;
      whine.start(); whine2.start();

      // --- fragile ringing layer ---
      const ring = ctx.createOscillator();
      ring.type = 'sine';
      ring.frequency.value = 96;
      const ringGain = ctx.createGain();
      ringGain.gain.value = 0.015;
      ring.connect(ringGain).connect(this.reverbIn);
      ring.start();
    }
    try { await this.ctx.resume(); } catch { /* ignored */ }
    this.started = true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.62, this.ctx.currentTime, 0.1);
  }

  setReduced(reduced) {
    this.reduced = reduced;
  }

  setAmbient(level, fade = 1.5) {
    if (!this.ctx) return;
    this.ambientGain.gain.setTargetAtTime(level, this.ctx.currentTime, fade);
  }

  update(dt, s) {
    if (!this.ctx || !this.started) return;
    const ctx = this.ctx, now = ctx.currentTime;

    // Monster presence grows as it closes in.
    const close = Math.max(0, 1 - s.distance / 12);
    const presence = Math.min(1, close * close * 1.7 + (s.observed ? 0.2 : 0) + s.breakLevel * 0.12);
    if (this.monsterGain) {
      this.monsterGain.gain.setTargetAtTime(presence * (this.reduced ? 0.14 : 0.24), now, 0.22);
    }
    if (this.monsterPan) {
      this.monsterPan.pan.setTargetAtTime(Math.max(-1, Math.min(1, s.pan || 0)), now, 0.18);
    }
    if (this.whineGain) {
      const target = this.reduced ? 0 : Math.pow(s.gaze, 2.4) * 0.032;
      this.whineGain.gain.setTargetAtTime(target, now, 0.15);
    }

    // Heartbeat rate rises with proximity and with staring.
    const tension = Math.max(close, s.gaze * 0.85);
    const interval = 1.28 - tension * 0.86;
    this.heartInterval = Math.max(0.33, interval);
    this.heartTimer -= dt;
    if (this.heartTimer <= 0) {
      this.heartTimer = this.heartInterval;
      this.heartbeat(0.5 + tension * 0.85);
    }

    // Whispers while staring.
    this.whisperTimer -= dt;
    if (this.whisperTimer <= 0) {
      this.whisperTimer = 4.5 + Math.random() * 6 - s.gaze * 2;
      if (s.gaze > 0.28 && !this.reduced) this.whisper(s.gaze, s.pan || 0);
    }

    // Breathing layer louder when observed / close.
    if (this.breathGain) {
      this.breathGain.gain.setTargetAtTime(0.05 + presence * 0.18, now, 0.3);
    }
  }

  heartbeat(vol = 1) {
    const ctx = this.ctx, now = ctx.currentTime;
    const thump = (t, gain) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(64, t);
      o.frequency.exponentialRampToValueAtTime(32, t + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      o.connect(g);
      g.connect(this.master);
      g.connect(this.reverbIn);
      o.start(t); o.stop(t + 0.22);
    };
    thump(now, 0.22 * vol);
    thump(now + 0.17, 0.13 * vol);
  }

  whisper(intensity, pan) {
    const ctx = this.ctx, now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(1.4);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    const f = 620 + Math.random() * 1400;
    bp.frequency.setValueAtTime(f, now);
    bp.frequency.linearRampToValueAtTime(f * (0.55 + Math.random() * 0.5), now + 0.9);
    bp.Q.value = 8 + Math.random() * 8;
    const g = ctx.createGain();
    const level = 0.012 + intensity * 0.03;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(level, now + 0.18);
    g.gain.linearRampToValueAtTime(level * 0.6, now + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(bp).connect(g);
    if (p) { p.pan.value = pan * 0.8 + (Math.random() - 0.5) * 0.4; g.connect(p).connect(this.master); }
    else g.connect(this.master);
    g.connect(this.reverbIn);
    src.start(now); src.stop(now + 1.3);
  }

  footstep(speed = 1) {
    if (!this.ctx || !this.started) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 160 + Math.random() * 190;
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.07 * Math.min(1.4, speed), now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(bp).connect(g);
    if (p) {
      this.footPan = -this.footPan;
      p.pan.value = this.footPan * 0.22;
      g.connect(p).connect(this.master);
    } else g.connect(this.master);
    g.connect(this.reverbIn);
    src.start(now); src.stop(now + 0.2);
  }

  sigil() {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const freqs = [392, 587.33, 784, 1174.66];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 3 ? 'triangle' : 'sine';
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.006);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.055 / (i * 0.5 + 1), now + 0.02 + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + i * 0.25);
      o.connect(g);
      g.connect(this.master);
      g.connect(this.reverbIn);
      o.start(now + i * 0.045); o.stop(now + 2.4);
    });
    this.noiseBurst(0.6, 0.035, 900, 'highpass');
  }

  noiseBurst(duration = 0.5, volume = 0.2, freq = 800, type = 'bandpass') {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(duration + 0.1);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(f).connect(g);
    g.connect(this.master);
    g.connect(this.reverbIn);
    src.start(now); src.stop(now + duration + 0.05);
  }

  fracture() {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    this.noiseBurst(0.9, this.reduced ? 0.12 : 0.3, 2600, 'highpass');
    this.noiseBurst(0.5, 0.22, 180, 'lowpass');

    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(620, now);
    o.frequency.exponentialRampToValueAtTime(46, now + 1.1);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, now);
    f.frequency.exponentialRampToValueAtTime(160, now + 1.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(this.reduced ? 0.08 : 0.2, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    o.connect(f).connect(g);
    g.connect(this.master);
    g.connect(this.reverbIn);
    o.start(now); o.stop(now + 1.4);

    const ring = ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = 2380;
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.0001, now);
    rg.gain.exponentialRampToValueAtTime(0.025, now + 0.05);
    rg.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    ring.connect(rg).connect(this.master);
    rg.connect(this.reverbIn);
    ring.start(now); ring.stop(now + 2.4);
  }

  death() {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    this.noiseBurst(1.6, this.reduced ? 0.16 : 0.36, 3200, 'highpass');
    this.noiseBurst(1.2, 0.3, 120, 'lowpass');

    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(x * 7);
    }
    shaper.curve = curve;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1480, now);
    o.frequency.exponentialRampToValueAtTime(92, now + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(this.reduced ? 0.12 : 0.3, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    o.connect(shaper).connect(g);
    g.connect(this.master);
    g.connect(this.reverbIn);
    o.start(now); o.stop(now + 1.8);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(70, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 1.8);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, now);
    sg.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 2);
    sub.connect(sg).connect(this.master);
    sub.start(now); sub.stop(now + 2.1);
  }

  win() {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const freqs = [196, 246.94, 329.63, 392];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.05 / (i + 1), now + 0.8);
      g.gain.linearRampToValueAtTime(0.0001, now + 4.5);
      o.connect(g);
      g.connect(this.master);
      g.connect(this.reverbIn);
      o.start(now); o.stop(now + 4.8);
    });
  }

  listenPulse() {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(240, now);
    o.frequency.exponentialRampToValueAtTime(880, now + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.reverbIn);
    o.start(now); o.stop(now + 1.2);
    this.noiseBurst(0.8, 0.03, 600, 'bandpass');
  }

  click() {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.03, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    o.connect(g).connect(this.master);
    o.start(now); o.stop(now + 0.1);
  }
}
