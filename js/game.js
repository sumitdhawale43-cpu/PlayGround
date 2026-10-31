import {
  MAP_W,
  MAP_H,
  SPAWN,
  ECHO_SPOTS,
  EXIT_SPOT,
  MONSTER_START,
  MONSTER_SPAWNS,
  canStand,
  isWall,
  lineOfSight,
  findPath,
  zoneAt
} from './map.js'
import { createTextureSet } from './textures.js'
import { Renderer } from './raycaster.js'
import { AudioEngine } from './audio.js'

const $ = (id) => document.getElementById(id)

const dom = {
  world: $('world'),
  hud: $('hud'),
  titleScreen: $('title-screen'),
  pauseScreen: $('pause-screen'),
  endScreen: $('end-screen'),
  startBtn: $('start-btn'),
  resumeBtn: $('resume-btn'),
  restartBtn: $('restart-btn'),
  quitBtn: $('quit-btn'),
  againBtn: $('again-btn'),
  endTitleBtn: $('end-title-btn'),
  muteBtn: $('mute-btn'),
  muteLabel: $('mute-label'),
  zoneLabel: $('zone-label'),
  zoneToast: $('zone-toast'),
  subtitle: $('subtitle'),
  prompt: $('prompt'),
  promptText: $('prompt-text'),
  realityBlock: $('reality-block'),
  realityName: $('reality-name'),
  realityValue: $('reality-value'),
  realityFill: $('reality-fill'),
  realityState: $('reality-state'),
  echoPips: [...document.querySelectorAll('#echo-pips i')],
  echoPipsWrap: $('echo-pips'),
  gaze: $('gaze'),
  gazeProgress: $('gaze-progress'),
  gazeWord: $('gaze-word'),
  stamina: $('stamina'),
  staminaFill: $('stamina-fill'),
  minimap: $('minimap'),
  mapEchoCount: $('map-echo-count'),
  mapGate: $('map-gate'),
  controlsHint: $('controls-hint'),
  touchUi: $('touch-ui'),
  joystick: $('joystick'),
  joystickKnob: $('joystick-knob'),
  actionBtn: $('action-btn'),
  runBtn: $('run-btn'),
  pauseBtn: $('pause-btn'),
  flash: $('flash'),
  jumpscare: $('jumpscare'),
  face: document.querySelector('.jumpscare-face'),
  endKicker: $('end-kicker'),
  endTitle: $('end-title'),
  endCopy: $('end-copy'),
  statTime: $('stat-time'),
  statEchoes: $('stat-echoes'),
  statStare: $('stat-stare'),
  statReality: $('stat-reality'),
  rotateHint: $('rotate-hint')
}

const IS_TOUCH =
  window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FOV_HALF = (72 * Math.PI) / 360
const PLAYER_RADIUS = 0.24
const WALK_SPEED = 2.55
const SPRINT_SPEED = 4.35
const INTERACT_ECHO = 1.18
const INTERACT_EXIT = 1.55

const textures = createTextureSet()
const renderer = new Renderer(dom.world, textures)
const audio = new AudioEngine()

const ECHO_LINES = [
  'ECHO 01 RECOVERED — <span class="red">“It was never in the room with me.”</span>',
  'ECHO 02 RECOVERED — <span class="red">“The hallway moved while I was counting.”</span>',
  'ECHO 03 RECOVERED — <span class="red">“It knows when I close my eyes.”</span>'
]

const WHISPERS = [
  'Stop looking at it.',
  'The room is smaller than it was.',
  'You have already been here.',
  'There is a door behind you.',
  'It is learning your face.',
  'One of these echoes is lying.',
  'The light is not yours.',
  'You agreed to be watched.',
  'Do not trust the corners.',
  'It only moves when you look away.'
]

const STARE_WHISPERS = [
  "Don't blink.",
  'It is counting your heartbeats.',
  'Keep looking. Keep looking.',
  'The edges of the room are coming loose.',
  'You are making a hole in the world.'
]

const REALITY_LINES = [
  'THE ROOM FORGETS ITSELF.',
  'SOMETHING WALKED THROUGH THE WALL.',
  'YOU ARE STANDING SOMEWHERE ELSE.',
  'THE CORRIDOR IS ONE ROOM SHORTER.',
  'DO NOT TRUST THE DOOR.'
]

const state = {
  mode: 'title',
  time: 0,
  titleTime: 0,
  lastTime: 0,
  runTime: 0,
  player: {
    x: SPAWN.x + 0.5,
    y: SPAWN.y + 0.5,
    angle: -Math.PI / 2,
    pitch: 0,
    bob: 0
  },
  demo: {
    x: 17.5,
    y: 13.5,
    angle: -Math.PI / 2,
    pitch: 0,
    bob: 0
  },
  monster: {
    x: MONSTER_START.x,
    y: MONSTER_START.y,
    frame: 0,
    anim: 0,
    path: [],
    pathTimer: 0,
    heat: 0,
    stepDist: 0,
    attackTimer: 0,
    observed: false,
    visible: false,
    frozenTime: 0
  },
  echoes: [],
  exit: { x: EXIT_SPOT.x, y: EXIT_SPOT.y, unlocked: false },
  phantoms: [],
  reality: 100,
  corruption: 0,
  scars: 0,
  tier: -1,
  eventTier: -1,
  found: 0,
  stareTime: 0,
  gazeVisual: 0,
  totalGaze: 0,
  regenDelay: 0,
  observed: false,
  nearest: null,
  nearestKey: '',
  zone: '',
  stamina: 100,
  exhausted: false,
  stepAccum: 0,
  bobPhase: 0,
  exploreTimer: 0,
  mapTimer: 0,
  whisperTimer: 12,
  phantomTimer: 10,
  heartTimer: 0,
  shakeTime: 0,
  shakeAmount: 0,
  flash: 1,
  deathCause: '',
  deathTimer: 0,
  winTimer: 0,
  relocateIn: 0,
  explored: new Uint8Array(MAP_W * MAP_H),
  subtitleTimer: 0,
  toastTimer: 0,
  introTimer: 0,
  lastPrompt: '',
  endShown: false,
  debug: false
}

const input = {
  keys: new Set(),
  interactQueued: false,
  locked: false,
  dragging: false,
  touchX: 0,
  touchY: 0,
  touchSprint: false,
  joystickId: null,
  lookId: null,
  lastLookX: 0,
  lastLookY: 0
}

const mapCtx = dom.minimap.getContext('2d')
mapCtx.imageSmoothingEnabled = false
const FACE_URL = textures.sprites.face.toDataURL('image/png')
dom.face.style.backgroundImage = `url("${FACE_URL}")`

document.body.classList.toggle('touch', IS_TOUCH)
if (IS_TOUCH) dom.touchUi.setAttribute('aria-hidden', 'false')

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2
  while (angle < -Math.PI) angle += Math.PI * 2
  return angle
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function pick(list) {
  return list[(Math.random() * list.length) | 0]
}

function distanceToMonster() {
  return Math.hypot(state.monster.x - state.player.x, state.monster.y - state.player.y)
}

function clearTimers() {
  state.subtitleTimer = 0
  state.toastTimer = 0
  state.introTimer = 0
  state.nearest = null
  state.nearestKey = ''
}

// ---------------------------------------------------------------------------
// Screens, prompts and HUD
// ---------------------------------------------------------------------------

function showSubtitle(html, duration = 4.5) {
  dom.subtitle.innerHTML = html
  dom.subtitle.classList.add('show')
  state.subtitleTimer = duration
}

function clearSubtitle() {
  dom.subtitle.classList.remove('show')
  state.subtitleTimer = 0
}

function showToast(text, duration = 2.2) {
  dom.zoneToast.textContent = text
  dom.zoneToast.classList.add('show')
  state.toastTimer = duration
}

function flashScreen(kind = 'fire') {
  dom.flash.classList.remove('fire', 'fire-dark', 'dark')
  // Force the animation to restart.
  void dom.flash.offsetWidth
  dom.flash.classList.add(kind)
}

function showScreen(screen) {
  screen.classList.remove('hidden')
}

function hideScreen(screen) {
  screen.classList.add('hidden')
}

function setMuted(muted) {
  audio.setMuted(muted)
  dom.muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false')
  dom.muteLabel.textContent = muted ? 'MUTED' : 'SOUND'
}

function toggleMute() {
  if (!audio.ctx) audio.init()
  setMuted(!audio.muted)
}

function resetHud() {
  dom.realityValue.textContent = '100'
  dom.realityFill.style.width = '100%'
  dom.realityState.textContent = 'STABLE'
  dom.realityName.textContent = 'REALITY'
  dom.realityBlock.classList.remove('danger', 'staring')
  dom.echoPips.forEach((pip) => pip.classList.remove('filled'))
  dom.echoPipsWrap.setAttribute('aria-label', '0 of 3 echoes recovered')
  dom.mapEchoCount.textContent = '0 / 3 ECHOES'
  dom.mapGate.textContent = 'GATE SEALED'
  dom.mapGate.classList.remove('open')
  dom.prompt.classList.add('hidden')
  dom.gazeProgress.style.strokeDashoffset = '169.65'
  dom.stamina.classList.remove('show', 'low')
  dom.staminaFill.style.transform = 'scaleX(1)'
  dom.zoneLabel.textContent = 'OBSERVATION SPINE'
  dom.actionBtn.textContent = 'TOUCH'
  clearSubtitle()
  dom.zoneToast.classList.remove('show')
  document.documentElement.style.setProperty('--alert', '0')
}

function updatePrompt() {
  const nearest = state.nearest
  let text = ''
  let action = 'TOUCH'
  if (nearest?.type === 'echo') {
    text = 'TAKE THE ECHO'
    action = 'TAKE'
  } else if (nearest?.type === 'exit') {
    if (state.exit.unlocked) {
      text = 'OPEN THE GATE'
      action = 'OPEN'
    } else {
      text = 'THE GATE IS SEALED'
      action = 'TOUCH'
    }
  }

  if (text !== state.lastPrompt) {
    state.lastPrompt = text
    if (text) {
      dom.promptText.textContent = text
      dom.prompt.classList.remove('hidden')
    } else {
      dom.prompt.classList.add('hidden')
    }
  }
  dom.actionBtn.textContent = action
}

// ---------------------------------------------------------------------------
// Run lifecycle
// ---------------------------------------------------------------------------

function resetRun() {
  state.player.x = SPAWN.x + 0.5
  state.player.y = SPAWN.y + 0.5
  state.player.angle = -Math.PI / 2
  state.player.pitch = 0
  state.player.bob = 0
  state.bobPhase = 0
  state.stepAccum = 0

  state.monster.x = MONSTER_START.x
  state.monster.y = MONSTER_START.y
  state.monster.frame = 0
  state.monster.anim = 0
  state.monster.path = []
  state.monster.pathTimer = 0
  state.monster.heat = 0
  state.monster.stepDist = 0
  state.monster.attackTimer = 0
  state.monster.observed = false
  state.monster.visible = true
  state.monster.frozenTime = 0

  state.echoes = ECHO_SPOTS.map((echo) => ({
    id: echo.id,
    x: echo.x,
    y: echo.y,
    name: echo.name,
    active: true,
    bob: Math.random() * Math.PI * 2
  }))
  state.exit = { x: EXIT_SPOT.x, y: EXIT_SPOT.y, unlocked: false }
  state.phantoms = []
  state.reality = 100
  state.corruption = 0
  state.scars = 0
  state.tier = -1
  state.eventTier = -1
  state.found = 0
  state.stareTime = 0
  state.gazeVisual = 0
  state.totalGaze = 0
  state.regenDelay = 0
  state.observed = false
  state.nearest = null
  state.nearestKey = ''
  state.zone = ''
  state.stamina = 100
  state.exhausted = false
  state.exploreTimer = 0
  state.mapTimer = 0
  state.whisperTimer = 12
  state.phantomTimer = 9
  state.heartTimer = 0
  state.shakeTime = 0
  state.shakeAmount = 0
  state.flash = 1
  state.deathCause = ''
  state.deathTimer = 0
  state.winTimer = 0
  state.relocateIn = 0
  state.runTime = 0
  state.lastPrompt = ''
  state.explored.fill(0)
  input.keys.clear()
  input.interactQueued = false
  input.dragging = false
  input.touchX = 0
  input.touchY = 0
  input.touchSprint = false
  input.locked = false
  dom.jumpscare.classList.remove('show', 'red')
  setMuted(audio.muted)
  resetHud()
  revealMap()
  updateZone(true)
  updateBodyClasses(true)
}

function beginRun({ fromTitle = false } = {}) {
  audio.init()
  audio.resume()
  resetRun()
  state.mode = 'playing'
  state.endShown = false
  hideScreen(dom.titleScreen)
  hideScreen(dom.pauseScreen)
  hideScreen(dom.endScreen)
  dom.hud.classList.remove('hidden')
  document.body.classList.remove('paused', 'dying', 'winning', 'ended', 'staring')
  document.body.classList.add('playing')
  dom.zoneLabel.textContent = state.zone || 'OBSERVATION SPINE'
  showToast('OBSERVATION SPINE', 2.4)
  showSubtitle('RECOVER THREE ECHOES. RETURN TO THE GATE.', 5)
  state.introTimer = 7.2
  if (!IS_TOUCH) requestPointerLock()
  audio.setAtmosphere({ corruption: 0, tension: 0.1, stare: false })
  if (fromTitle) state.runTime = 0
  // The first step is a good place for a quiet tutorial line.
}

function startFromTitle() {
  if (state.mode === 'playing') return
  beginRun({ fromTitle: true })
}

function pauseGame() {
  if (state.mode !== 'playing') return
  state.mode = 'paused'
  document.body.classList.add('paused')
  document.body.classList.remove('staring')
  dom.pauseScreen.classList.remove('hidden')
  input.keys.clear()
  input.touchX = 0
  input.touchY = 0
  input.touchSprint = false
  resetJoystick()
  if (document.pointerLockElement) document.exitPointerLock()
  audio.setAtmosphere({ corruption: state.corruption, tension: 0, stare: false })
}

function resumeGame() {
  if (state.mode !== 'paused') return
  state.mode = 'playing'
  document.body.classList.remove('paused')
  hideScreen(dom.pauseScreen)
  audio.resume()
  if (!IS_TOUCH) requestPointerLock()
  state.lastTime = performance.now()
}

function quitToTitle() {
  state.mode = 'title'
  state.titleTime = 0
  document.body.classList.remove('playing', 'paused', 'dying', 'winning', 'ended', 'staring')
  document.body.classList.remove('corr-1', 'corr-2', 'corr-3')
  state.tier = -1
  state.eventTier = -1
  hideScreen(dom.pauseScreen)
  hideScreen(dom.endScreen)
  dom.hud.classList.add('hidden')
  dom.jumpscare.classList.remove('show', 'red')
  showScreen(dom.titleScreen)
  if (document.pointerLockElement) document.exitPointerLock()
  input.keys.clear()
  audio.setAtmosphere({ corruption: 0.06, tension: 0, stare: false })
}

function finishRun(win) {
  if (state.endShown) return
  state.endShown = true
  state.mode = 'ended'
  state.runTime = Math.min(state.runTime, 60 * 60)
  document.body.classList.remove('playing', 'dying', 'winning', 'staring')
  document.body.classList.add('ended')
  document.body.classList.remove('corr-1', 'corr-2', 'corr-3')
  if (document.pointerLockElement) document.exitPointerLock()
  dom.jumpscare.classList.remove('show', 'red')
  dom.prompt.classList.add('hidden')
  dom.hud.classList.add('hidden')
  clearSubtitle()

  dom.statTime.textContent = formatTime(state.runTime)
  dom.statEchoes.textContent = `${state.found} / 3`
  dom.statStare.textContent = `${state.totalGaze.toFixed(1)}s`
  dom.statReality.textContent = `${Math.max(0, Math.round(state.reality))}%`

  if (win) {
    dom.endKicker.textContent = 'RECORDING ENDS'
    dom.endTitle.textContent = 'THE GATE REMEMBERS YOU.'
    dom.endCopy.innerHTML =
      'You step through. The hallway outside is the same hallway.<br />Somewhere behind you, something exhales.'
  } else if (state.deathCause === 'reality') {
    dom.endKicker.textContent = 'FEED TERMINATED / REALITY LOST'
    dom.endTitle.textContent = 'REALITY GAVE OUT.'
    dom.endCopy.innerHTML =
      'The room kept unfolding until there was no room left.<br />You are still staring.'
  } else {
    dom.endKicker.textContent = 'FEED TERMINATED / CONTACT'
    dom.endTitle.textContent = 'YOU WERE SEEN.'
    dom.endCopy.innerHTML =
      'It was in the room the whole time.<br />You only had to look away once.'
  }

  showScreen(dom.endScreen)
  audio.setAtmosphere({ corruption: 0.3, tension: 0, stare: false })
}

// ---------------------------------------------------------------------------
// Player + input
// ---------------------------------------------------------------------------

function requestPointerLock() {
  if (IS_TOUCH || !dom.world.requestPointerLock) return
  try {
    const result = dom.world.requestPointerLock()
    if (result && typeof result.catch === 'function') result.catch(() => {})
  } catch {
    // Click-drag looking remains available if the browser refuses the lock.
  }
}

function setJoystickFromEvent(event) {
  const rect = dom.joystick.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const radius = rect.width * 0.42
  let dx = (event.clientX - cx) / radius
  let dy = (event.clientY - cy) / radius
  const len = Math.hypot(dx, dy)
  if (len > 1) {
    dx /= len
    dy /= len
  }
  input.touchX = dx
  input.touchY = dy
  dom.joystickKnob.style.transform = `translate(calc(-50% + ${dx * radius}px), calc(-50% + ${dy * radius}px))`
  dom.joystickKnob.style.background =
    len > 0.08 ? 'rgba(217, 213, 198, .15)' : 'rgba(208, 205, 186, .07)'
}

function resetJoystick() {
  input.touchX = 0
  input.touchY = 0
  input.joystickId = null
  dom.joystickKnob.style.transform = 'translate(-50%, -50%)'
  dom.joystickKnob.style.background = 'rgba(208, 205, 186, .07)'
}

function updatePlayer(dt) {
  const player = state.player
  let forward = 0
  let strafe = 0

  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) forward += 1
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) forward -= 1
  if (input.keys.has('KeyD')) strafe += 1
  if (input.keys.has('KeyA')) strafe -= 1

  // Touch stick.
  forward += -input.touchY
  strafe += input.touchX

  const mag = Math.hypot(forward, strafe)
  if (mag > 1) {
    forward /= mag
    strafe /= mag
  }

  // Keyboard-only turning is available with the left/right arrows.
  let turn = 0
  if (input.keys.has('ArrowRight')) turn += 1
  if (input.keys.has('ArrowLeft')) turn -= 1
  if (turn) player.angle = normalizeAngle(player.angle + turn * 2.15 * dt)

  const wantsSprint =
    (input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') || input.touchSprint) &&
    mag > 0.15
  const sprinting = wantsSprint && state.stamina > 0 && !state.exhausted

  if (sprinting) {
    state.stamina = Math.max(0, state.stamina - 27 * dt)
    if (state.stamina <= 0) state.exhausted = true
  } else {
    if (state.exhausted && state.stamina > 25) state.exhausted = false
    state.stamina = Math.min(100, state.stamina + 17 * dt)
  }

  const speed = sprinting ? SPRINT_SPEED : WALK_SPEED
  let moved = 0
  if (mag > 0.03) {
    const dirX = Math.cos(player.angle)
    const dirY = Math.sin(player.angle)
    const rightX = -dirY
    const rightY = dirX
    const moveX = (dirX * forward + rightX * strafe) * speed * dt
    const moveY = (dirY * forward + rightY * strafe) * speed * dt
    const beforeX = player.x
    const beforeY = player.y

    if (canStand(player.x + moveX, player.y, PLAYER_RADIUS)) {
      player.x += moveX
    }
    if (canStand(player.x, player.y + moveY, PLAYER_RADIUS)) {
      player.y += moveY
    }

    moved = Math.hypot(player.x - beforeX, player.y - beforeY)
    state.bobPhase += moved * (sprinting ? 12 : 9)
    player.bob = Math.sin(state.bobPhase) * (sprinting ? 2.25 : 1.35)
    state.stepAccum += moved

    if (state.stepAccum > (sprinting ? 0.45 : 0.56)) {
      state.stepAccum = 0
      audio.footstep(0, sprinting ? 0.62 : 0.35)
    }
  } else {
    player.bob *= Math.max(0, 1 - dt * 9)
    state.stepAccum = 0
  }

  // The body is solid. If you stare it down, you can back away, not phase through it.
  const md = distanceToMonster()
  if (md < 0.58) {
    const awayX = player.x - state.monster.x
    const awayY = player.y - state.monster.y
    const awayLen = Math.hypot(awayX, awayY) || 1
    const push = 0.58 - md
    const nx = player.x + (awayX / awayLen) * push
    const ny = player.y + (awayY / awayLen) * push
    if (canStand(nx, ny, PLAYER_RADIUS)) {
      player.x = nx
      player.y = ny
    }
  }
}

function updateStare(dt) {
  const dist = distanceToMonster()
  const observed = state.observed

  if (observed) {
    state.stareTime += dt
    state.totalGaze += dt
    state.regenDelay = 1.4
    const proximity = clamp(1 - (dist - 1) / 12, 0.26, 1)
    const drain = 4.4 + proximity * 9.2 + state.corruption * 3.2
    state.reality = Math.max(0, state.reality - drain * dt)
    state.monster.heat = Math.max(0, state.monster.heat - dt * 1.55)
    state.monster.frozenTime += dt
  } else {
    state.stareTime = Math.max(0, state.stareTime - dt * 2.8)
    if (state.regenDelay > 0) state.regenDelay -= dt
    else state.reality = Math.min(100, state.reality + 2.25 * dt)
    state.monster.frozenTime = 0
  }

  state.gazeVisual += ((observed ? clamp(state.stareTime / 5.5, 0, 1) : 0) - state.gazeVisual) * Math.min(1, dt * 8)
  state.corruption = clamp(
    Math.max(1 - state.reality / 100, state.scars * 0.115),
    0,
    1
  )

  const tier = state.corruption >= 0.66 ? 3 : state.corruption >= 0.38 ? 2 : state.corruption >= 0.14 ? 1 : 0
  if (tier > state.eventTier) {
    if (tier >= 2) triggerRealityEvent(tier)
    state.eventTier = tier
  } else if (tier < state.eventTier) {
    state.eventTier = tier
  }

  if (state.reality <= 0) die('reality')
}

function checkObserved() {
  const player = state.player
  const monster = state.monster
  const dx = monster.x - player.x
  const dy = monster.y - player.y
  const dist = Math.hypot(dx, dy)
  if (dist > 30) return false
  const angle = Math.atan2(dy, dx)
  const diff = Math.abs(normalizeAngle(angle - player.angle))
  if (diff > FOV_HALF + 0.025) return false
  return lineOfSight(player.x, player.y, monster.x, monster.y)
}

function triggerRealityEvent(tier) {
  state.scars += 1
  state.shakeTime = 0.65
  state.shakeAmount = 2.6 + tier
  audio.realityBreak()
  flashScreen('fire-dark')
  showSubtitle(pick(REALITY_LINES), 4.2)
  spawnPhantom(true)
  if (tier >= 3) {
    state.monster.heat = Math.min(1, state.monster.heat + 0.25)
  }
}

// ---------------------------------------------------------------------------
// Monster
// ---------------------------------------------------------------------------

function updateMonster(dt) {
  const monster = state.monster
  const player = state.player
  const dist = distanceToMonster()
  const los = lineOfSight(monster.x, monster.y, player.x, player.y)

  if (monster.observed) {
    monster.attackTimer = 0
    return
  }

  monster.heat = Math.min(1, monster.heat + dt * 0.34)
  const speed =
    1.36 +
    monster.heat * 1.27 +
    state.found * 0.075 +
    state.corruption * 0.28

  monster.pathTimer -= dt
  if (monster.pathTimer <= 0) {
    monster.path = findPath(monster.x, monster.y, player.x, player.y)
    monster.pathTimer = 0.42 + Math.random() * 0.22
  }

  let targetX = player.x
  let targetY = player.y
  let direct = los && dist < 8.5

  if (!direct) {
    while (monster.path.length) {
      const node = monster.path[0]
      if (Math.hypot(node.x - monster.x, node.y - monster.y) < 0.18) monster.path.shift()
      else {
        targetX = node.x
        targetY = node.y
        break
      }
    }
    if (!monster.path.length) {
      targetX = player.x
      targetY = player.y
      direct = los
    }
  }

  const tx = targetX - monster.x
  const ty = targetY - monster.y
  const targetDist = Math.hypot(tx, ty)
  if (targetDist > 0.0001) {
    const step = Math.min(targetDist, speed * dt)
    const nx = monster.x + (tx / targetDist) * step
    const ny = monster.y + (ty / targetDist) * step
    if (canStand(nx, ny, 0.23)) {
      monster.x = nx
      monster.y = ny
      monster.anim += step
      monster.frame = Math.floor(monster.anim * 5.7) % 6
      monster.stepDist += step
    } else {
      monster.pathTimer = 0
    }
  }

  const rel = normalizeAngle(Math.atan2(player.y - monster.y, player.x - monster.x) - player.angle)
  const pan = clamp(Math.sin(rel), -1, 1) * 0.8
  if (monster.stepDist > 0.56) {
    monster.stepDist = 0
    if (distanceToMonster() < 12) {
      audio.footstep(pan, clamp(0.7 - dist / 25, 0.18, 0.75), true)
    }
  }

  // Measure again after moving: the monster may have just stepped into reach.
  const reach = distanceToMonster()
  const reachLos = lineOfSight(monster.x, monster.y, player.x, player.y)
  if (reach < 0.9 && reachLos) {
    // The last quarter second is a chance to catch it with your eyes.
    monster.attackTimer += dt
  } else {
    monster.attackTimer = 0
  }

  if (reach < 0.9 && reachLos && monster.attackTimer > 0.22) {
    die('monster')
  }
}

function relocateMonster() {
  const player = state.player
  let best = MONSTER_SPAWNS[0]
  let bestDist = -1
  for (const spawn of MONSTER_SPAWNS) {
    const d = Math.hypot(spawn.x - player.x, spawn.y - player.y)
    if (d > bestDist) {
      bestDist = d
      best = spawn
    }
  }
  // Add a little uncertainty, but never put it in the player's lap.
  const candidates = MONSTER_SPAWNS.filter(
    (spawn) => Math.hypot(spawn.x - player.x, spawn.y - player.y) > bestDist - 5.5
  )
  const chosen = Math.random() < 0.42 ? pick(candidates) : best
  state.monster.x = chosen.x
  state.monster.y = chosen.y
  state.monster.path = []
  state.monster.pathTimer = 0
  state.monster.heat = 0
  state.monster.attackTimer = 0
  state.monster.anim = 0
  state.monster.frame = 0
  audio.footstep(0, 0.45, true)
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

function updateInteractions() {
  let nearest = null
  let best = Infinity
  for (const echo of state.echoes) {
    if (!echo.active) continue
    const d = Math.hypot(echo.x - state.player.x, echo.y - state.player.y)
    if (d < INTERACT_ECHO && d < best) {
      best = d
      nearest = { type: 'echo', ref: echo }
    }
  }
  const exitDist = Math.hypot(
    state.exit.x - state.player.x,
    state.exit.y - state.player.y
  )
  if (exitDist < INTERACT_EXIT && exitDist < best) {
    nearest = { type: 'exit', ref: state.exit }
  }

  if (nearest?.type !== state.nearest?.type || nearest?.ref?.id !== state.nearest?.ref?.id) {
    state.nearest = nearest
    updatePrompt()
  }
}

function interact() {
  if (state.mode !== 'playing') return
  if (!state.nearest) return
  if (state.nearest.type === 'echo') {
    collectEcho(state.nearest.ref)
  } else if (state.nearest.type === 'exit') {
    if (state.exit.unlocked) {
      winRun()
    } else {
      audio.door()
      showSubtitle(`THE GATE IS SEALED. <span class="red">${3 - state.found} ECHO${3 - state.found === 1 ? '' : 'S'} REMAIN.</span>`, 3.2)
    }
  }
}

function collectEcho(echo) {
  if (!echo.active) return
  echo.active = false
  state.found += 1
  state.reality = Math.max(1, state.reality - 7)
  audio.pickup(state.found - 1)
  flashScreen('fire')
  state.shakeTime = 0.36
  state.shakeAmount = 1.4
  dom.echoPips.forEach((pip, index) => pip.classList.toggle('filled', index < state.found))
  dom.echoPipsWrap.setAttribute('aria-label', `${state.found} of 3 echoes recovered`)
  dom.mapEchoCount.textContent = `${state.found} / 3 ECHOES`
  showSubtitle(ECHO_LINES[state.found - 1], 5)
  state.nearest = null
  state.lastPrompt = ''
  updatePrompt()
  state.relocateIn = 0.42

  if (state.found >= 3) {
    state.exit.unlocked = true
    dom.mapGate.textContent = 'GATE OPEN'
    dom.mapGate.classList.add('open')
    audio.door()
    showSubtitle(
      'THE GATE IS AWAKE. <span class="red">RETURN TO THE SOUTH-EAST ROOM.</span>',
      5.5
    )
    state.monster.heat = Math.min(1, state.monster.heat + 0.3)
  }
  revealMap()
}

function winRun() {
  if (state.mode !== 'playing') return
  state.mode = 'winning'
  state.winTimer = 2.5
  document.body.classList.add('winning')
  document.body.classList.remove('staring')
  dom.prompt.classList.add('hidden')
  dom.jumpscare.classList.remove('show')
  audio.chimeWin()
  flashScreen('fire')
  showSubtitle('THE GATE OPENS. <span class="red">FOR A MOMENT, THE HALL BEHIND YOU IS EMPTY.</span>', 4)
  if (document.pointerLockElement) document.exitPointerLock()
}

function die(cause) {
  if (state.mode !== 'playing') return
  state.mode = 'dying'
  state.deathCause = cause
  state.deathTimer = 1.62
  document.body.classList.add('dying')
  document.body.classList.remove('playing', 'staring')
  dom.prompt.classList.add('hidden')
  dom.jumpscare.classList.toggle('red', cause === 'reality')
  dom.jumpscare.classList.add('show')
  input.keys.clear()
  input.touchX = 0
  input.touchY = 0
  input.touchSprint = false
  resetJoystick()
  if (document.pointerLockElement) document.exitPointerLock()
  audio.jumpscare()
  flashScreen('fire-dark')
  state.shakeTime = 1.2
  state.shakeAmount = 5
}

// ---------------------------------------------------------------------------
// Phantoms, whispers and atmosphere
// ---------------------------------------------------------------------------

function spawnPhantom(force = false) {
  if (!force && state.corruption < 0.22) return
  for (let attempt = 0; attempt < 12; attempt++) {
    const side = Math.random() < 0.5 ? -1 : 1
    const angle = state.player.angle + side * randomBetween(0.44, 0.63)
    const dist = randomBetween(3.6, 8.5)
    const x = state.player.x + Math.cos(angle) * dist
    const y = state.player.y + Math.sin(angle) * dist
    if (!canStand(x, y, 0.1)) continue
    if (!lineOfSight(state.player.x, state.player.y, x, y)) continue
    if (Math.hypot(x - state.monster.x, y - state.monster.y) < 2.2) continue
    state.phantoms.push({
      x,
      y,
      age: 0,
      ttl: randomBetween(1.7, 3.4),
      alpha: randomBetween(0.36, 0.78),
      frame: Math.random() < 0.5 ? 0 : 1,
      fade: 1
    })
    return
  }
}

function updatePhantoms(dt) {
  state.phantomTimer -= dt
  if (state.phantomTimer <= 0) {
    if (state.corruption > 0.28) spawnPhantom()
    state.phantomTimer = randomBetween(8, 16) * (1.1 - state.corruption * 0.4)
  }

  for (const phantom of state.phantoms) {
    phantom.age += dt
    phantom.ttl -= dt
    const angleTo = Math.atan2(phantom.y - state.player.y, phantom.x - state.player.x)
    const centered = Math.abs(normalizeAngle(angleTo - state.player.angle)) < 0.18
    if (centered) phantom.fade = Math.max(0, phantom.fade - dt * 4)
    else phantom.fade = Math.min(1, phantom.fade + dt * 1.7)
    phantom.renderAlpha = phantom.alpha * phantom.fade * clamp(phantom.age * 3, 0, 1) * clamp(phantom.ttl * 2, 0, 1)
  }
  state.phantoms = state.phantoms.filter((p) => p.ttl > 0 && p.renderAlpha > 0.01)
}

function updateWhispers(dt) {
  if (state.introTimer > 0) {
    state.introTimer -= dt
    if (state.introTimer <= 0) {
      showSubtitle('IT ONLY MOVES WHEN YOU STOP LOOKING.', 4.5)
    }
  }

  if (state.observed && state.stareTime > 2.8 && Math.random() < dt * 0.12) {
    audio.whisper(randomBetween(-0.7, 0.7), 0.6)
  }

  state.whisperTimer -= dt
  if (state.whisperTimer <= 0) {
    const close = distanceToMonster() < 5.5
    if (state.corruption > 0.26 || close) {
      const line = state.observed && Math.random() < 0.5 ? pick(STARE_WHISPERS) : pick(WHISPERS)
      showSubtitle(line, 4)
      audio.whisper(randomBetween(-0.8, 0.8), 0.7)
      if (Math.random() < 0.45) spawnPhantom()
    }
    state.whisperTimer = randomBetween(8, 17) * (1 - state.corruption * 0.45)
  }
}

function updateAudio(dt) {
  const dist = distanceToMonster()
  const tension = clamp(1 - dist / 14, 0, 1)
  audio.setAtmosphere({
    corruption: state.corruption,
    tension,
    stare: state.observed
  })

  if (dist < 11 || state.corruption > 0.42) {
    state.heartTimer -= dt
    if (state.heartTimer <= 0) {
      const bpm = clamp(48 + (1 - dist / 13) * 63 + state.corruption * 25 + (state.observed ? 16 : 0), 48, 150)
      state.heartTimer = 60 / bpm
      const rel = normalizeAngle(Math.atan2(state.monster.y - state.player.y, state.monster.x - state.player.x) - state.player.angle)
      audio.heartbeat(clamp((11 - dist) / 11, 0.12, 0.9), clamp(Math.sin(rel) * 0.55, -0.6, 0.6))
    }
  } else {
    state.heartTimer = Math.min(state.heartTimer, 0.4)
  }
}

function updateEffects(dt) {
  const dist = distanceToMonster()
  const alert = state.mode === 'playing' && !state.observed ? clamp((8.5 - dist) / 8.5, 0, 1) * 0.72 : 0
  document.documentElement.style.setProperty('--alert', alert.toFixed(3))

  state.shakeTime = Math.max(0, state.shakeTime - dt)
  let amp =
    (state.shakeTime > 0 ? state.shakeAmount : 0.35) +
    (state.observed ? 0.32 + state.corruption * 0.55 : 0) +
    state.corruption * 0.34
  if (REDUCED_MOTION) amp *= 0.18
  const rx = (Math.random() * 2 - 1) * amp
  const ry = (Math.random() * 2 - 1) * amp
  const rr = (Math.random() * 2 - 1) * amp * 0.035
  document.documentElement.style.setProperty('--shake-x', `${rx.toFixed(2)}px`)
  document.documentElement.style.setProperty('--shake-y', `${ry.toFixed(2)}px`)
  document.documentElement.style.setProperty('--shake-r', `${rr.toFixed(3)}deg`)

  let flashlight =
    0.92 +
    Math.sin(state.time * 1.9) * 0.028 +
    Math.sin(state.time * 13.7) * 0.012 +
    (state.observed ? Math.sin(state.time * 9.1) * 0.045 : 0)
  if (state.corruption > 0.24) {
    const threshold = 0.93 - state.corruption * 0.14
    const flicker = Math.sin(state.time * 21.7 + Math.sin(state.time * 3.1) * 4)
    if (flicker > threshold) flashlight *= 0.5
    if (Math.sin(state.time * 6.3) > 0.996) flashlight *= 1.3
  }
  state.flash = clamp(flashlight, 0.28, 1.35)
  renderer.flash = state.flash

  if (state.subtitleTimer > 0) {
    state.subtitleTimer -= dt
    if (state.subtitleTimer <= 0) clearSubtitle()
  }
  if (state.toastTimer > 0) {
    state.toastTimer -= dt
    if (state.toastTimer <= 0) dom.zoneToast.classList.remove('show')
  }
  if (state.relocateIn > 0) {
    state.relocateIn -= dt
    if (state.relocateIn <= 0 && state.mode === 'playing') {
      // Never teleport while the player has it in view: that breaks the rule.
      if (state.observed) {
        state.relocateIn = 0.3
      } else {
        relocateMonster()
        flashScreen('fire-dark')
      }
    }
  }
}

function updateBodyClasses(force = false) {
  const tier = state.corruption >= 0.66 ? 3 : state.corruption >= 0.38 ? 2 : state.corruption >= 0.14 ? 1 : 0
  if (force || tier !== state.tier) {
    document.body.classList.remove('corr-1', 'corr-2', 'corr-3')
    if (tier === 1) document.body.classList.add('corr-1')
    if (tier === 2) document.body.classList.add('corr-2')
    if (tier === 3) document.body.classList.add('corr-3')
    state.tier = tier
  }
  document.body.classList.toggle('staring', state.observed && state.mode === 'playing')
}

function updateZone(initial = false) {
  const zone = zoneAt(state.player.x, state.player.y)
  if (initial || zone !== state.zone) {
    state.zone = zone
    dom.zoneLabel.textContent = zone
    if (!initial && state.mode === 'playing') showToast(zone, 2.4)
  }
}

function updateHud(dt) {
  const reality = state.reality
  const display = Math.max(0, Math.min(100, reality))
  dom.realityFill.style.width = `${display.toFixed(1)}%`
  const rounded = Math.round(display)
  if (dom.realityValue.textContent !== String(rounded)) dom.realityValue.textContent = String(rounded)

  let label = 'STABLE'
  if (display <= 0) label = 'COLLAPSED'
  else if (display < 25) label = 'UNRAVELLING'
  else if (display < 45) label = 'FRACTURING'
  else if (display < 70) label = 'DRIFTING'
  if (state.observed && label !== 'COLLAPSED') label = `${label} / HELD`
  if (dom.realityState.textContent !== label) dom.realityState.textContent = label
  dom.realityBlock.classList.toggle('danger', display < 32)
  dom.realityBlock.classList.toggle('staring', state.observed)
  dom.gazeProgress.style.strokeDashoffset = `${(169.65 * (1 - state.gazeVisual)).toFixed(1)}`
  dom.gazeWord.textContent = state.stareTime > 4 ? "DON'T BLINK" : 'HELD'

  const staminaScale = state.stamina / 100
  dom.staminaFill.style.transform = `scaleX(${staminaScale.toFixed(3)})`
  const showStamina = state.stamina < 99.5 || input.touchSprint
  dom.stamina.classList.toggle('show', showStamina && state.mode === 'playing')
  dom.stamina.classList.toggle('low', state.stamina < 24)

  state.mapTimer -= dt
  if (state.mapTimer <= 0) {
    state.mapTimer = 0.12
    updateMinimap()
  }
}

// ---------------------------------------------------------------------------
// Minimap
// ---------------------------------------------------------------------------

function revealMap() {
  const px = state.player.x
  const py = state.player.y
  const startX = Math.floor(px)
  const startY = Math.floor(py)
  const mark = (x, y) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return
    state.explored[y * MAP_W + x] = 1
  }

  for (let y = startY - 2; y <= startY + 2; y++) {
    for (let x = startX - 2; x <= startX + 2; x++) {
      if (Math.hypot(x + 0.5 - px, y + 0.5 - py) < 3.2) mark(x, y)
    }
  }

  const rays = 144
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    for (let d = 0.25; d < 9; d += 0.35) {
      const x = Math.floor(px + dx * d)
      const y = Math.floor(py + dy * d)
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) break
      mark(x, y)
      if (isWall(x + 0.5, y + 0.5)) break
    }
  }
}

function updateMinimap() {
  const ctx = mapCtx
  const w = dom.minimap.width
  const h = dom.minimap.height
  const cell = w / MAP_W
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#020403'
  ctx.fillRect(0, 0, w, h)

  // Walls that have been seen, and remembered floor.
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!state.explored[y * MAP_W + x]) continue
      const wx = x + 0.5
      const wy = y + 0.5
      if (isWall(wx, wy)) {
        ctx.fillStyle = 'rgba(142, 146, 124, .26)'
        ctx.fillRect(x * cell, y * cell, cell, cell)
      } else {
        ctx.fillStyle = 'rgba(85, 97, 81, .28)'
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    }
  }

  // Echo markers are faint across the whole schematic, like remembered coordinates.
  for (const echo of state.echoes) {
    const ex = echo.x * cell
    const ey = echo.y * cell
    const discovered = state.explored[Math.floor(echo.y) * MAP_W + Math.floor(echo.x)]
    const active = echo.active
    ctx.save()
    ctx.translate(ex, ey)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = active
      ? discovered
        ? 'rgba(139, 229, 189, .95)'
        : 'rgba(139, 229, 189, .38)'
      : 'rgba(90, 97, 83, .4)'
    ctx.fillStyle = active
      ? discovered
        ? 'rgba(139, 229, 189, .28)'
        : 'rgba(139, 229, 189, .06)'
      : 'transparent'
    const s = active ? 4.3 : 2.2
    ctx.fillRect(-s / 2, -s / 2, s, s)
    ctx.lineWidth = 1
    ctx.strokeRect(-s / 2, -s / 2, s, s)
    ctx.restore()
  }

  // The gate is a vertical bar in its room.
  const exitX = state.exit.x * cell
  const exitY = state.exit.y * cell
  const exitSeen = state.explored[Math.floor(state.exit.y) * MAP_W + Math.floor(state.exit.x)]
  ctx.fillStyle = state.exit.unlocked
    ? 'rgba(139, 229, 189, .9)'
    : exitSeen
      ? 'rgba(181, 60, 49, .85)'
      : 'rgba(181, 60, 49, .35)'
  ctx.fillRect(exitX - 2.5, exitY - 5, 5, 10)
  ctx.strokeStyle = state.exit.unlocked ? 'rgba(139, 229, 189, .35)' : 'rgba(181, 60, 49, .3)'
  ctx.lineWidth = 1
  ctx.strokeRect(exitX - 4, exitY - 6.5, 8, 13)

  // Player arrow.
  const px = state.player.x * cell
  const py = state.player.y * cell
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(state.player.angle)
  ctx.beginPath()
  ctx.moveTo(7, 0)
  ctx.lineTo(-4.5, 4.2)
  ctx.lineTo(-2.2, 0)
  ctx.lineTo(-4.5, -4.2)
  ctx.closePath()
  ctx.fillStyle = 'rgba(229, 225, 203, .96)'
  ctx.shadowColor = 'rgba(229, 225, 203, .5)'
  ctx.shadowBlur = 4
  ctx.fill()
  ctx.restore()

  // A tiny scan line helps it read as a machine output.
  const scan = ((state.time * 22) % (h + 30)) - 15
  ctx.fillStyle = 'rgba(139, 229, 189, .045)'
  ctx.fillRect(0, scan, w, 1)
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

function buildScene() {
  if (state.mode === 'title') {
    return {
      player: state.demo,
      monster: { ...state.monster, visible: false },
      echoes: [],
      exit: { ...state.exit, unlocked: false },
      corruption: 0.055,
      time: state.time,
      phantoms: []
    }
  }
  return {
    player: state.player,
    monster: state.monster,
    echoes: state.echoes,
    exit: state.exit,
    corruption: state.corruption,
    time: state.time,
    phantoms: state.phantoms
  }
}

function updateTitle(dt) {
  state.titleTime += dt
  state.demo.angle = -Math.PI / 2 + Math.sin(state.titleTime * 0.1) * 0.035
  state.demo.pitch = Math.sin(state.titleTime * 0.17) * 2.5
  state.demo.bob = Math.sin(state.titleTime * 0.7) * 0.35
}

function updateDying(dt) {
  state.deathTimer -= dt
  if (state.deathTimer <= 0) {
    dom.jumpscare.classList.remove('show', 'red')
    finishRun(false)
  }
}

function updateWinning(dt) {
  state.winTimer -= dt
  const toward = Math.atan2(state.exit.y - state.player.y, state.exit.x - state.player.x)
  state.player.angle = normalizeAngle(
    state.player.angle + normalizeAngle(toward - state.player.angle) * Math.min(1, dt * 2.4)
  )
  if (state.winTimer <= 0) {
    finishRun(true)
  }
}

function update(dt) {
  state.runTime += dt
  updatePlayer(dt)
  state.observed = checkObserved()
  state.monster.observed = state.observed
  updateStare(dt)
  if (state.mode !== 'playing') return
  updateMonster(dt)
  if (state.mode !== 'playing') return
  updatePhantoms(dt)
  updateWhispers(dt)
  updateInteractions()
  updateAudio(dt)
  updateEffects(dt)
  updateZone()
  updateBodyClasses()
  updateHud(dt)
  if (input.interactQueued) {
    input.interactQueued = false
    interact()
  }
  if (state.exploreTimer > 0) {
    state.exploreTimer -= dt
  } else {
    state.exploreTimer = 0.16
    revealMap()
  }
  updatePrompt()
}

function frame(now) {
  const rawDelta = state.lastTime ? (now - state.lastTime) / 1000 : 0.016
  state.lastTime = now
  const dt = clamp(rawDelta, 0.001, 0.05)
  state.time += dt

  if (state.mode === 'title') {
    updateTitle(dt)
  } else if (state.mode === 'playing') {
    update(dt)
  } else if (state.mode === 'dying') {
    updateDying(dt)
    document.documentElement.style.setProperty('--shake-x', `${(Math.random() * 2 - 1) * 5}px`)
    document.documentElement.style.setProperty('--shake-y', `${(Math.random() * 2 - 1) * 5}px`)
  } else if (state.mode === 'winning') {
    updateWinning(dt)
  } else if (state.mode === 'paused') {
    updateEffects(dt)
  }

  try {
    renderer.render(buildScene())
  } catch (error) {
    console.error('Render failure', error)
  }

  if (state.mode === 'ended') {
    // Keep the end screen atmosphere alive without updating the simulation.
  }

  requestAnimationFrame(frame)
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function onKeyDown(event) {
  const code = event.code
  if (code === 'KeyM') {
    if (!event.repeat) toggleMute()
    return
  }
  if (state.mode === 'title') {
    if (code === 'Enter' || code === 'Space') {
      event.preventDefault()
      startFromTitle()
    }
    return
  }
  if (state.mode === 'ended') {
    if (code === 'Enter') {
      event.preventDefault()
      beginRun()
    }
    return
  }
  if (code === 'Escape') {
    if (state.mode === 'playing') pauseGame()
    else if (state.mode === 'paused') resumeGame()
    return
  }
  if (state.mode === 'paused') return
  if (state.mode !== 'playing') return

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
    event.preventDefault()
  }
  input.keys.add(code)
  if (code === 'KeyE' && !event.repeat) input.interactQueued = true
}

function onKeyUp(event) {
  input.keys.delete(event.code)
}

function onMouseMove(event) {
  if (state.mode !== 'playing') return
  if (!input.locked && !input.dragging) return
  const movementX = clamp(event.movementX || 0, -150, 150)
  const movementY = clamp(event.movementY || 0, -150, 150)
  state.player.angle = normalizeAngle(state.player.angle + movementX * 0.00225)
  state.player.pitch = clamp(state.player.pitch - movementY * 0.92, -175, 175)
}

function onWindowBlur() {
  input.keys.clear()
  input.touchX = 0
  input.touchY = 0
  input.touchSprint = false
  resetJoystick()
  if (state.mode === 'playing') pauseGame()
}

function bindEvents() {
  dom.startBtn.addEventListener('click', startFromTitle)
  dom.againBtn.addEventListener('click', () => beginRun())
  dom.endTitleBtn.addEventListener('click', quitToTitle)
  dom.resumeBtn.addEventListener('click', resumeGame)
  dom.restartBtn.addEventListener('click', () => {
    hideScreen(dom.pauseScreen)
    document.body.classList.remove('paused')
    beginRun()
  })
  dom.quitBtn.addEventListener('click', quitToTitle)
  dom.muteBtn.addEventListener('click', toggleMute)

  window.addEventListener('resize', () => renderer.resize())
  window.addEventListener('keydown', onKeyDown, { passive: false })
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onWindowBlur)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'playing') pauseGame()
  })

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('pointerlockchange', () => {
    input.locked = document.pointerLockElement === dom.world
  })
  document.addEventListener('mousedown', (event) => {
    if (state.mode !== 'playing') return
    if (event.target === dom.world) {
      input.dragging = true
      if (!IS_TOUCH && !input.locked) requestPointerLock()
    }
  })
  document.addEventListener('mouseup', () => {
    input.dragging = false
  })
  dom.world.addEventListener('contextmenu', (event) => event.preventDefault())
  dom.world.addEventListener('click', () => {
    if (state.mode === 'playing' && !IS_TOUCH && !input.locked) requestPointerLock()
  })

  if (IS_TOUCH) {
    dom.joystick.addEventListener('pointerdown', (event) => {
      if (state.mode !== 'playing') return
      event.preventDefault()
      input.joystickId = event.pointerId
      dom.joystick.setPointerCapture(event.pointerId)
      setJoystickFromEvent(event)
    })
    dom.joystick.addEventListener('pointermove', (event) => {
      if (input.joystickId !== event.pointerId) return
      event.preventDefault()
      setJoystickFromEvent(event)
    })
    const endJoystick = (event) => {
      if (input.joystickId !== event.pointerId) return
      resetJoystick()
    }
    dom.joystick.addEventListener('pointerup', endJoystick)
    dom.joystick.addEventListener('pointercancel', endJoystick)

    dom.world.addEventListener('pointerdown', (event) => {
      if (state.mode !== 'playing' || event.pointerType !== 'touch') return
      if (input.lookId !== null) return
      input.lookId = event.pointerId
      input.lastLookX = event.clientX
      input.lastLookY = event.clientY
      dom.world.setPointerCapture(event.pointerId)
    })
    dom.world.addEventListener('pointermove', (event) => {
      if (input.lookId !== event.pointerId) return
      event.preventDefault()
      const dx = event.clientX - input.lastLookX
      const dy = event.clientY - input.lastLookY
      input.lastLookX = event.clientX
      input.lastLookY = event.clientY
      state.player.angle = normalizeAngle(state.player.angle + dx * 0.0038)
      state.player.pitch = clamp(state.player.pitch - dy * 1.15, -175, 175)
    })
    const endLook = (event) => {
      if (input.lookId === event.pointerId) input.lookId = null
    }
    dom.world.addEventListener('pointerup', endLook)
    dom.world.addEventListener('pointercancel', endLook)

    dom.actionBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      if (state.mode === 'playing') input.interactQueued = true
    })
    dom.runBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      input.touchSprint = true
      dom.runBtn.classList.add('active')
    })
    const stopRun = (event) => {
      event.preventDefault()
      input.touchSprint = false
      dom.runBtn.classList.remove('active')
    }
    dom.runBtn.addEventListener('pointerup', stopRun)
    dom.runBtn.addEventListener('pointercancel', stopRun)
    dom.runBtn.addEventListener('pointerleave', () => {
      input.touchSprint = false
      dom.runBtn.classList.remove('active')
    })
    dom.pauseBtn.addEventListener('click', (event) => {
      event.preventDefault()
      pauseGame()
    })
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

resetRun()
state.mode = 'title'
state.monster.visible = false
document.body.classList.remove('playing', 'paused', 'dying', 'winning', 'ended', 'staring')
dom.hud.classList.add('hidden')
showScreen(dom.titleScreen)
setMuted(audio.muted)
revealMap()
updateMinimap()
bindEvents()
requestAnimationFrame(frame)

// A small, deliberate hook for automated verification and curious players.
window.__PERIPHERY__ = {
  version: '1.0.0',
  getState() {
    return {
      mode: state.mode,
      reality: Number(state.reality.toFixed(2)),
      corruption: Number(state.corruption.toFixed(3)),
      found: state.found,
      observed: state.observed,
      stareTime: Number(state.stareTime.toFixed(2)),
      totalGaze: Number(state.totalGaze.toFixed(2)),
      player: { x: state.player.x, y: state.player.y, angle: state.player.angle },
      monster: {
        x: state.monster.x,
        y: state.monster.y,
        heat: Number(state.monster.heat.toFixed(3)),
        visible: state.monster.visible
      },
      echoes: state.echoes.map((echo) => ({ id: echo.id, active: echo.active, x: echo.x, y: echo.y })),
      exit: { ...state.exit },
      nearest: state.nearest?.type || null,
      zone: state.zone
    }
  },
  start() {
    startFromTitle()
  },
  teleport(x, y, angle = state.player.angle) {
    state.player.x = x
    state.player.y = y
    state.player.angle = angle
    revealMap()
    updateMinimap()
  },
  teleportMonster(x, y) {
    state.monster.x = x
    state.monster.y = y
    state.monster.path = []
    state.monster.pathTimer = 0
  },
  setReality(value) {
    state.reality = clamp(value, 0, 100)
  },
  collectAll() {
    for (const echo of state.echoes) {
      if (echo.active) collectEcho(echo)
    }
    return this.getState()
  },
  die: (cause = 'monster') => die(cause)
}
