/**
 * Small synthesized sound palette. No external audio assets required.
 */
export class SoundBoard {
  constructor(muted = false) {
    this.muted = muted
    this.context = null
    this.master = null
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume().catch(() => {})
      return
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    this.context = new AudioContext()
    this.master = this.context.createGain()
    this.master.gain.value = 0.14
    this.master.connect(this.context.destination)
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) this.master.gain.value = muted ? 0 : 0.14
  }

  tone(frequency, duration = 0.1, options = {}) {
    if (this.muted) return
    this.ensure()
    if (!this.context || !this.master) return
    const {
      type = 'sine',
      gain = 0.5,
      when = 0,
      slide = 0,
      attack = 0.008,
      release = duration,
    } = options
    const now = this.context.currentTime + when
    const oscillator = this.context.createOscillator()
    const envelope = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    if (slide) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(30, frequency + slide),
        now + duration,
      )
    }
    envelope.gain.setValueAtTime(0.0001, now)
    envelope.gain.exponentialRampToValueAtTime(gain, now + attack)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(attack + 0.01, release))
    oscillator.connect(envelope)
    envelope.connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.03)
  }

  click() {
    this.tone(420, 0.045, { type: 'square', gain: 0.12, slide: -80 })
  }

  connect() {
    this.tone(520, 0.07, { type: 'sine', gain: 0.28, slide: 260 })
    this.tone(880, 0.08, { type: 'sine', gain: 0.18, when: 0.045 })
  }

  cut() {
    this.tone(300, 0.08, { type: 'sawtooth', gain: 0.12, slide: -160 })
  }

  toggle(closed) {
    this.tone(closed ? 360 : 230, 0.055, { type: 'square', gain: 0.1, slide: closed ? 90 : -60 })
    this.tone(closed ? 720 : 460, 0.04, { type: 'sine', gain: 0.08, when: 0.04 })
  }

  error() {
    this.tone(170, 0.16, { type: 'sawtooth', gain: 0.12, slide: -50 })
    this.tone(140, 0.18, { type: 'triangle', gain: 0.1, when: 0.02, slide: -30 })
  }

  hint() {
    this.tone(660, 0.08, { type: 'sine', gain: 0.2 })
    this.tone(990, 0.13, { type: 'sine', gain: 0.16, when: 0.07 })
  }

  complete() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((frequency, index) => {
      this.tone(frequency, 0.55 - index * 0.04, {
        type: 'sine',
        gain: 0.24 - index * 0.025,
        when: index * 0.11,
        attack: 0.02,
      })
      this.tone(frequency / 2, 0.5, {
        type: 'triangle',
        gain: 0.08,
        when: index * 0.11,
      })
    })
  }

  unlock() {
    this.tone(784, 0.16, { type: 'triangle', gain: 0.16 })
    this.tone(1174, 0.22, { type: 'sine', gain: 0.12, when: 0.1 })
  }
}
