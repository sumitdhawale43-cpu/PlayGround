// MONSTER MERGE — tiny WebAudio sound engine. No external audio files needed.
class SoundEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.muted = false
    this.last = 0
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
      return this.ctx
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    this.ctx = new Ctx()
    const comp = this.ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 22
    comp.ratio.value = 8
    comp.attack.value = 0.003
    comp.release.value = 0.25
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.42
    this.master.connect(comp)
    comp.connect(this.ctx.destination)
    return this.ctx
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.ctx.currentTime, 0.03)
    }
  }

  tone({ freq = 440, freqEnd = null, dur = 0.14, type = 'sine', vol = 0.22, when = 0, attack = 0.005, release = null }) {
    const ctx = this.init()
    if (!ctx || this.muted) return
    const t = ctx.currentTime + when
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(vol, t + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (release || dur))
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.03)
  }

  noise({ dur = 0.12, vol = 0.2, when = 0, freq = 1200, q = 0.8, type = 'bandpass', sweep = null }) {
    const ctx = this.init()
    if (!ctx || this.muted) return
    const t = ctx.currentTime + when
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(freq, t)
    if (sweep) filter.frequency.exponentialRampToValueAtTime(sweep, t + dur)
    filter.Q.value = q
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start(t)
  }

  play(name) {
    const ctx = this.init()
    if (!ctx || this.muted) return
    const now = performance.now()
    if (now - this.last < 24 && ['click', 'turn'].includes(name)) return
    this.last = now
    switch (name) {
      case 'click':
        this.tone({ freq: 640, freqEnd: 820, dur: 0.06, type: 'triangle', vol: 0.09 })
        break
      case 'tap':
        this.tone({ freq: 420, freqEnd: 300, dur: 0.09, type: 'sine', vol: 0.14 })
        break
      case 'back':
        this.tone({ freq: 380, freqEnd: 260, dur: 0.1, type: 'sine', vol: 0.12 })
        break
      case 'merge':
        [392, 494, 587, 784].forEach((f, i) => this.tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.13, when: i * 0.06 }))
        this.noise({ dur: 0.3, vol: 0.06, freq: 2600, sweep: 4800, when: 0.1 })
        break
      case 'evolve':
        this.noise({ dur: 0.6, vol: 0.08, freq: 900, sweep: 5200, type: 'highpass' })
        ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone({ freq: f, dur: 0.6, type: 'sine', vol: 0.12, when: i * 0.085 }))
        this.tone({ freq: 261.6, dur: 0.8, type: 'triangle', vol: 0.08, when: 0.05 })
        break
      case 'summon':
        [660, 880, 990, 1320].forEach((f, i) => this.tone({ freq: f, dur: 0.18, type: 'sine', vol: 0.08, when: i * 0.05 }))
        break
      case 'crack':
        this.noise({ dur: 0.14, vol: 0.18, freq: 1800, q: 2 })
        this.tone({ freq: 180, freqEnd: 90, dur: 0.18, type: 'square', vol: 0.08 })
        break
      case 'hit':
        this.noise({ dur: 0.16, vol: 0.16, freq: 900, sweep: 220, type: 'lowpass' })
        this.tone({ freq: 150, freqEnd: 60, dur: 0.16, type: 'sine', vol: 0.18 })
        break
      case 'crit':
        this.noise({ dur: 0.22, vol: 0.2, freq: 1600, sweep: 240, type: 'lowpass' })
        this.tone({ freq: 220, freqEnd: 70, dur: 0.22, type: 'sawtooth', vol: 0.12 })
        this.tone({ freq: 1200, dur: 0.12, type: 'triangle', vol: 0.09, when: 0.02 })
        break
      case 'magic':
        this.tone({ freq: 320, freqEnd: 900, dur: 0.28, type: 'sine', vol: 0.1 })
        this.noise({ dur: 0.25, vol: 0.05, freq: 2200, sweep: 4200, type: 'bandpass' })
        break
      case 'heal':
        [523, 659, 880].forEach((f, i) => this.tone({ freq: f, dur: 0.34, type: 'sine', vol: 0.09, when: i * 0.06 }))
        break
      case 'shield':
        this.tone({ freq: 300, freqEnd: 620, dur: 0.25, type: 'triangle', vol: 0.1 })
        this.tone({ freq: 900, dur: 0.18, type: 'sine', vol: 0.05, when: 0.06 })
        break
      case 'burn':
        this.noise({ dur: 0.24, vol: 0.07, freq: 3000, sweep: 700, type: 'bandpass' })
        break
      case 'poison':
        [220, 180, 140].forEach((f, i) => this.tone({ freq: f, dur: 0.16, type: 'sine', vol: 0.08, when: i * 0.08 }))
        break
      case 'stun':
        this.tone({ freq: 1400, freqEnd: 300, dur: 0.16, type: 'sawtooth', vol: 0.07 })
        this.noise({ dur: 0.14, vol: 0.08, freq: 3800, q: 2 })
        break
      case 'ko':
        this.tone({ freq: 300, freqEnd: 70, dur: 0.42, type: 'sawtooth', vol: 0.09 })
        this.noise({ dur: 0.3, vol: 0.06, freq: 700, sweep: 120, type: 'lowpass' })
        break
      case 'victory':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone({ freq: f, dur: 0.4, type: 'triangle', vol: 0.12, when: i * 0.11 }))
        this.tone({ freq: 261.63, dur: 1.1, type: 'sine', vol: 0.08, when: 0.1 })
        this.tone({ freq: 392, dur: 1.1, type: 'sine', vol: 0.07, when: 0.1 })
        break
      case 'defeat':
        [392, 349, 293, 220].forEach((f, i) => this.tone({ freq: f, dur: 0.4, type: 'sine', vol: 0.1, when: i * 0.14 }))
        break
      case 'levelup':
        [659, 784, 1046, 1318].forEach((f, i) => this.tone({ freq: f, dur: 0.3, type: 'sine', vol: 0.09, when: i * 0.07 }))
        break
      case 'reward':
        this.tone({ freq: 1046, dur: 0.09, type: 'triangle', vol: 0.1 })
        this.tone({ freq: 1568, dur: 0.18, type: 'triangle', vol: 0.08, when: 0.07 })
        break
      case 'coin':
        this.tone({ freq: 1320, dur: 0.06, type: 'square', vol: 0.05 })
        this.tone({ freq: 1760, dur: 0.1, type: 'square', vol: 0.04, when: 0.05 })
        break
      case 'battleStart':
        this.tone({ freq: 110, freqEnd: 70, dur: 0.5, type: 'sawtooth', vol: 0.12 })
        this.noise({ dur: 0.5, vol: 0.1, freq: 400, sweep: 2400, type: 'bandpass' })
        this.tone({ freq: 392, dur: 0.25, type: 'triangle', vol: 0.1, when: 0.3 })
        this.tone({ freq: 523, dur: 0.35, type: 'triangle', vol: 0.1, when: 0.42 })
        break
      case 'turn':
        this.tone({ freq: 740, dur: 0.05, type: 'sine', vol: 0.045 })
        break
      case 'error':
        this.tone({ freq: 150, freqEnd: 110, dur: 0.18, type: 'square', vol: 0.07 })
        break
      case 'unlock':
        this.tone({ freq: 440, dur: 0.18, type: 'triangle', vol: 0.1 })
        this.tone({ freq: 660, dur: 0.3, type: 'triangle', vol: 0.1, when: 0.1 })
        break
      default:
        this.tone({ freq: 600, dur: 0.06, type: 'sine', vol: 0.07 })
    }
  }
}

export const audio = new SoundEngine()
