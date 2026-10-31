const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.dry = null
    this.reverb = null
    this.reverbSend = null
    this.noiseBuffer = null
    this.started = false
    try {
      this.muted = localStorage.getItem('periphery-muted') === '1'
    } catch {
      this.muted = false
    }
    this.drone = null
    this.stareGain = null
    this.staticGain = null
    this.heartTimer = 0
    this.stepTimer = 0
    this.monsterStepTimer = 0
  }

  init() {
    if (this.ctx) {
      this.resume()
      return true
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return false
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.62
    const compressor = this.ctx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 18
    compressor.ratio.value = 4
    compressor.attack.value = 0.006
    compressor.release.value = 0.35
    this.master.connect(compressor)
    compressor.connect(this.ctx.destination)

    this.dry = this.ctx.createGain()
    this.dry.gain.value = 0.92
    this.dry.connect(this.master)

    this.reverb = this.ctx.createConvolver()
    this.reverb.buffer = this.makeImpulse(2.4, 2.8)
    this.reverbSend = this.ctx.createGain()
    this.reverbSend.gain.value = 0.28
    this.reverbSend.connect(this.reverb)
    this.reverb.connect(this.master)

    this.noiseBuffer = this.makeNoise(2.5)
    this.startAmbience()
    return true
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume()
  }

  makeNoise(seconds) {
    const rate = this.ctx.sampleRate
    const buffer = this.ctx.createBuffer(1, Math.floor(rate * seconds), rate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      last = last * 0.985 + white * 0.015
      data[i] = white * 0.55 + last * 1.4
    }
    return buffer
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate
    const length = Math.floor(rate * seconds)
    const buffer = this.ctx.createBuffer(2, length, rate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        const t = i / length
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * 0.55
      }
    }
    return buffer
  }

  connect(node, reverbAmount = 0.2) {
    node.connect(this.dry)
    const send = this.ctx.createGain()
    send.gain.value = reverbAmount
    node.connect(send)
    send.connect(this.reverbSend)
  }

  startAmbience() {
    if (this.started || !this.ctx) return
    this.started = true
    const t = this.ctx.currentTime

    // Sub-bass ventilation drone.
    const droneGain = this.ctx.createGain()
    droneGain.gain.value = 0.012
    const droneFilter = this.ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 120
    droneFilter.Q.value = 1.4
    droneGain.connect(droneFilter)
    droneFilter.connect(this.dry)
    const oscA = this.ctx.createOscillator()
    oscA.type = 'sine'
    oscA.frequency.value = 43.65
    const oscB = this.ctx.createOscillator()
    oscB.type = 'triangle'
    oscB.frequency.value = 55
    const oscGain = this.ctx.createGain()
    oscGain.gain.value = 0.5
    oscA.connect(oscGain)
    oscB.connect(oscGain)
    oscGain.connect(droneGain)
    oscA.start(t)
    oscB.start(t)
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.063
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 18
    lfo.connect(lfoGain)
    lfoGain.connect(droneFilter.frequency)
    lfo.start(t)
    this.drone = { gain: droneGain, filter: droneFilter, oscA, oscB, lfo }

    // Distant air.
    const air = this.ctx.createBufferSource()
    air.buffer = this.noiseBuffer
    air.loop = true
    const airFilter = this.ctx.createBiquadFilter()
    airFilter.type = 'bandpass'
    airFilter.frequency.value = 430
    airFilter.Q.value = 0.4
    const airGain = this.ctx.createGain()
    airGain.gain.value = 0.022
    air.connect(airFilter)
    airFilter.connect(airGain)
    airGain.connect(this.dry)
    air.start(t)
    this.air = { source: air, filter: airFilter, gain: airGain }

    // Tinnitus that blooms while something holds your gaze.
    this.stareGain = this.ctx.createGain()
    this.stareGain.gain.value = 0
    const stareFilter = this.ctx.createBiquadFilter()
    stareFilter.type = 'bandpass'
    stareFilter.frequency.value = 1200
    stareFilter.Q.value = 7
    const stareOsc = this.ctx.createOscillator()
    stareOsc.type = 'triangle'
    stareOsc.frequency.value = 1180
    const stareOsc2 = this.ctx.createOscillator()
    stareOsc2.type = 'sine'
    stareOsc2.frequency.value = 1776
    const stareMix = this.ctx.createGain()
    stareMix.gain.value = 0.4
    stareOsc.connect(stareMix)
    stareOsc2.connect(stareMix)
    stareMix.connect(stareFilter)
    stareFilter.connect(this.stareGain)
    this.stareGain.connect(this.dry)
    stareOsc.start(t)
    stareOsc2.start(t)
    this.stareNodes = { osc: stareOsc, osc2: stareOsc2, filter: stareFilter }

    // Static bed for corrupted reality.
    const staticSource = this.ctx.createBufferSource()
    staticSource.buffer = this.noiseBuffer
    staticSource.loop = true
    const staticFilter = this.ctx.createBiquadFilter()
    staticFilter.type = 'highpass'
    staticFilter.frequency.value = 2400
    this.staticGain = this.ctx.createGain()
    this.staticGain.gain.value = 0
    staticSource.connect(staticFilter)
    staticFilter.connect(this.staticGain)
    this.staticGain.connect(this.dry)
    staticSource.start(t)
    this.static = { source: staticSource, filter: staticFilter }
  }

  setMuted(muted) {
    this.muted = muted
    try {
      localStorage.setItem('periphery-muted', muted ? '1' : '0')
    } catch {
      // Storage can be unavailable in embedded or private contexts.
    }
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.setTargetAtTime(muted ? 0 : 0.62, this.ctx.currentTime, 0.05)
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted)
    return this.muted
  }

  setAtmosphere({ corruption, tension, stare }) {
    if (!this.ctx || !this.drone) return
    const t = this.ctx.currentTime
    const corr = clamp(corruption, 0, 1)
    const tense = clamp(tension, 0, 1)
    this.drone.gain.gain.setTargetAtTime(0.012 + tense * 0.025 + corr * 0.014, t, 0.3)
    this.drone.filter.frequency.setTargetAtTime(110 + tense * 135 + corr * 55, t, 0.4)
    this.air.gain.gain.setTargetAtTime(0.018 + corr * 0.012, t, 0.5)
    this.air.filter.frequency.setTargetAtTime(410 + corr * 180, t, 0.6)
    if (this.staticGain) {
      this.staticGain.gain.setTargetAtTime(corr * corr * 0.042, t, 0.12)
    }
    if (this.stareGain) {
      this.stareGain.gain.setTargetAtTime(stare ? 0.018 + corr * 0.028 : 0, t, 0.08)
      if (this.stareNodes) {
        this.stareNodes.osc.frequency.setTargetAtTime(1170 + corr * 110, t, 0.2)
        this.stareNodes.osc2.frequency.setTargetAtTime(1755 + corr * 180, t, 0.2)
      }
    }
  }

  footstep(pan = 0, intensity = 0.3, monster = false) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = monster ? 0.42 : 0.7
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = monster ? 180 : 320
    filter.Q.value = monster ? 2.1 : 1.2
    const gain = this.ctx.createGain()
    const dur = monster ? 0.28 : 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(intensity * (monster ? 0.75 : 0.4), t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    const panner = this.makePanner(pan)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(panner)
    this.connect(panner, monster ? 0.45 : 0.08)
    src.start(t, Math.random() * 1.5, dur + 0.03)
    src.stop(t + dur + 0.05)
  }

  heartbeat(intensity = 0.5, pan = 0) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const beat = (offset, level) => {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(64, t + offset)
      osc.frequency.exponentialRampToValueAtTime(39, t + offset + 0.13)
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t + offset)
      gain.gain.exponentialRampToValueAtTime(0.12 * level, t + offset + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18)
      const panner = this.makePanner(pan)
      osc.connect(gain)
      gain.connect(panner)
      this.connect(panner, 0.08)
      osc.start(t + offset)
      osc.stop(t + offset + 0.22)
    }
    const level = clamp(0.4 + intensity, 0, 1.4)
    beat(0, level)
    beat(0.22, level * 0.68)
  }

  whisper(pan = 0, level = 0.5) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = 0.8 + Math.random() * 0.8
    const f1 = this.ctx.createBiquadFilter()
    f1.type = 'bandpass'
    f1.frequency.value = 600 + Math.random() * 900
    f1.Q.value = 7 + Math.random() * 6
    const f2 = this.ctx.createBiquadFilter()
    f2.type = 'bandpass'
    f2.frequency.value = 1300 + Math.random() * 1400
    f2.Q.value = 9
    const gain = this.ctx.createGain()
    const dur = 0.65 + Math.random() * 0.7
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.028 * level, t + 0.16)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    const panNode = this.makePanner(pan)
    src.connect(f1)
    src.connect(f2)
    f1.connect(gain)
    f2.connect(gain)
    gain.connect(panNode)
    this.connect(panNode, 0.5)
    src.start(t, Math.random() * 1.2, dur + 0.1)
    src.stop(t + dur + 0.15)
  }

  pickup(index = 0) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const base = [523.25, 659.25, 783.99][index % 3]
    for (const [ratio, delay, level] of [[1, 0, 0.09], [1.5, 0.07, 0.045], [2.01, 0.13, 0.022]]) {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * ratio
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.0001, t + delay)
      gain.gain.exponentialRampToValueAtTime(level, t + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 1.6)
      osc.connect(gain)
      this.connect(gain, 0.7)
      osc.start(t + delay)
      osc.stop(t + delay + 1.7)
    }
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2400
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    src.connect(filter)
    filter.connect(gain)
    this.connect(gain, 0.5)
    src.start(t, 0, 0.55)
  }

  realityBreak() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = 0.8
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(130, t)
    filter.frequency.exponentialRampToValueAtTime(3400, t + 0.4)
    filter.Q.value = 1.4
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.11, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.62)
    src.connect(filter)
    filter.connect(gain)
    this.connect(gain, 0.45)
    src.start(t, 0, 0.7)

    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(244, t)
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.55)
    const og = this.ctx.createGain()
    og.gain.setValueAtTime(0.04, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    osc.connect(og)
    this.connect(og, 0.35)
    osc.start(t)
    osc.stop(t + 0.65)
  }

  door() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(72, t)
    osc.frequency.exponentialRampToValueAtTime(29, t + 0.9)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
    osc.connect(gain)
    this.connect(gain, 0.5)
    osc.start(t)
    osc.stop(t + 1.15)
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 620
    f.Q.value = 4
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t + 0.06)
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65)
    src.connect(f)
    f.connect(g)
    this.connect(g, 0.65)
    src.start(t + 0.05, 0, 0.7)
  }

  jumpscare() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    // Sub impact.
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, t)
    osc.frequency.exponentialRampToValueAtTime(24, t + 1.2)
    const og = this.ctx.createGain()
    og.gain.setValueAtTime(0.22, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 1.35)
    osc.connect(og)
    this.connect(og, 0.4)
    osc.start(t)
    osc.stop(t + 1.4)

    // Screaming filtered noise.
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.playbackRate.value = 1.8
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.setValueAtTime(900, t)
    f.frequency.exponentialRampToValueAtTime(3200, t + 0.18)
    f.Q.value = 3.2
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    src.connect(f)
    f.connect(g)
    this.connect(g, 0.6)
    src.start(t, 0, 0.65)

    // Metal shriek.
    const hi = this.ctx.createOscillator()
    hi.type = 'sawtooth'
    hi.frequency.setValueAtTime(1480, t)
    hi.frequency.exponentialRampToValueAtTime(560, t + 0.35)
    const hg = this.ctx.createGain()
    hg.gain.setValueAtTime(0.045, t)
    hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    hi.connect(hg)
    this.connect(hg, 0.35)
    hi.start(t)
    hi.stop(t + 0.5)
  }

  chimeWin() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const notes = [261.63, 392, 523.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const gain = this.ctx.createGain()
      const at = t + i * 0.19
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.055, at + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.4)
      osc.connect(gain)
      this.connect(gain, 0.8)
      osc.start(at)
      osc.stop(at + 2.5)
    })
  }

  makePanner(pan) {
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner()
      panner.pan.value = clamp(pan, -1, 1)
      return panner
    }
    const panner = this.ctx.createGain()
    panner.pan = { value: 0 }
    return panner
  }
}
