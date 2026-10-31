import { LEVELS, CHAPTERS, getLevel, LEVEL_COUNT } from './levels.js'
import {
  COMPONENT_SPECS,
  GATE_TYPES,
  componentLabel,
  duplicateWire,
  formatObjective,
  levelPorts,
  portPosition,
  validate,
} from './engine.js'
import { BoardRenderer, BOARD_WIDTH, BOARD_HEIGHT, createSparkBurst } from './board.js'
import { SoundBoard } from './audio.js'

/* -------------------------------------------------------------------------- */
/*  constants                                                                  */
/* -------------------------------------------------------------------------- */

const PROGRESS_KEY = 'circuit-master-progress-v2'
const SESSION_KEY = 'circuit-master-session-v2'
const HINT_PENALTY = 140
const CUT_MODE_CLASS = 'cut-mode'

const $ = (selector) => document.querySelector(selector)
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function pad(value, length = 2) {
  return String(value).padStart(length, '0')
}

function formatNumber(value) {
  return Math.round(value).toLocaleString('en-US')
}

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // A full or blocked storage area should never break the game.
  }
}

/* -------------------------------------------------------------------------- */
/*  persistent progress                                                        */
/* -------------------------------------------------------------------------- */

const progress = Object.assign(
  { completed: {}, lastLevel: 1, muted: false },
  loadJSON(PROGRESS_KEY, {}),
)
if (!progress.completed || typeof progress.completed !== 'object') progress.completed = {}

function completedCount() {
  return LEVELS.filter((item) => progress.completed[item.id]).length
}

function highestCompleted() {
  return Object.keys(progress.completed)
    .map(Number)
    .filter((id) => Number.isFinite(id) && progress.completed[id])
    .reduce((best, id) => Math.max(best, id), 0)
}

function highestUnlocked() {
  return Math.min(LEVEL_COUNT, highestCompleted() + 1)
}

function isUnlocked(id) {
  return id <= highestUnlocked()
}

function saveProgress() {
  saveJSON(PROGRESS_KEY, progress)
}

/* -------------------------------------------------------------------------- */
/*  dom                                                                        */
/* -------------------------------------------------------------------------- */

const canvas = $('#boardCanvas')
const board = new BoardRenderer(canvas)
const sound = new SoundBoard(progress.muted)

const elements = {
  levelTitle: $('#levelTitle'),
  levelBrief: $('#levelBrief'),
  levelTip: $('#levelTip'),
  chapterChip: $('#chapterChip'),
  topChapter: $('#topChapter'),
  topLevelNumber: $('#topLevelNumber'),
  topLevelTitle: $('#topLevelTitle'),
  topProgressBar: $('#topProgressBar'),
  levelsComplete: $('#levelsComplete'),
  hudAssembly: $('#hudAssembly'),
  componentCount: $('#componentCount'),
  missionClock: $('#missionClock'),
  objectiveList: $('#objectiveList'),
  scoreValue: $('#scoreValue'),
  scoreDelta: $('#scoreDelta'),
  possibleScore: $('#possibleScore'),
  scoreMeter: $('#scoreMeter'),
  starRow: $('#starRow'),
  boardStatusPill: $('#boardStatusPill'),
  boardStatus: $('#boardStatus'),
  captionIcon: $('#captionIcon'),
  captionTitle: $('#captionTitle'),
  captionDetail: $('#captionDetail'),
  loadStat: $('#loadStat'),
  wireStat: $('#wireStat'),
  hintBanner: $('#hintBanner'),
  hintText: $('#hintText'),
  hudRail: $('#hudRail'),
  hudRailLed: $('#hudRailLed'),
  diagMode: $('#diagMode'),
  diagPower: $('#diagPower'),
  diagLoad: $('#diagLoad'),
  diagLogic: $('#diagLogic'),
  diagSafety: $('#diagSafety'),
  undoButton: $('#undoButton'),
  cutButton: $('#cutButton'),
  cutButtonTop: $('#cutButtonTop'),
  hintButton: $('#hintButton'),
  resetButton: $('#resetButton'),
  nextLevelButton: $('#nextLevelButton'),
  nextLevelLabel: $('#nextLevelLabel'),
  levelsButton: $('#levelsButton'),
  helpButton: $('#helpButton'),
  soundButton: $('#soundButton'),
  levelModal: $('#levelModal'),
  completeModal: $('#completeModal'),
  helpModal: $('#helpModal'),
  levelGrid: $('#levelGrid'),
  modalProgressRing: $('#modalProgressRing'),
  modalProgressText: $('#modalProgressText'),
  modalCompleteText: $('#modalCompleteText'),
  resetProgressButton: $('#resetProgressButton'),
  completeSubtitle: $('#completeSubtitle'),
  completionStars: $('#completionStars'),
  completeScore: $('#completeScore'),
  completeBest: $('#completeBest'),
  completionNote: $('#completionNote'),
  nextButton: $('#nextButton'),
  replayButton: $('#replayButton'),
  completeMapButton: $('#completeMapButton'),
  toast: $('#toast'),
  toastText: $('#toastText'),
  canvasWrap: $('#canvasWrap'),
  interactionHint: $('#interactionHint span'),
}

/* -------------------------------------------------------------------------- */
/*  runtime state                                                              */
/* -------------------------------------------------------------------------- */

let level = LEVELS[0]
let state = { wires: [], switches: {} }
let history = []
let hintsUsed = 0
let validation = validate(level, state)
let completedThisAttempt = false
let completionTimer = 0
let startedAt = performance.now()
let frozenElapsed = null
let loadAt = performance.now()
let hoveredPort = null
let hoveredSwitch = null
let hoveredWire = null
let selectedWire = null
let cutMode = false
let armedPort = null
let drag = null
let hint = null
let hintTimer = 0
let toastTimer = 0
let celebration = null
let lastPointerType = 'mouse'
let modalReturnFocus = null

/* -------------------------------------------------------------------------- */
/*  small UI helpers                                                           */
/* -------------------------------------------------------------------------- */

function showToast(text, type = '', duration = 2600) {
  clearTimeout(toastTimer)
  elements.toastText.textContent = text
  elements.toast.classList.toggle('danger', type === 'danger')
  elements.toast.classList.add('visible')
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove('visible')
  }, duration)
}

function openDialog(dialog) {
  if (dialog.open) return
  modalReturnFocus = document.activeElement
  dialog.showModal()
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close()
  if (modalReturnFocus instanceof HTMLElement) modalReturnFocus.focus?.({ preventScroll: true })
}

function closeAllDialogs(except = null) {
  for (const dialog of [elements.levelModal, elements.completeModal, elements.helpModal]) {
    if (dialog !== except && dialog.open) dialog.close()
  }
}

function setSoundMuted(muted) {
  progress.muted = muted
  sound.setMuted(muted)
  document.body.classList.toggle('is-muted', muted)
  elements.soundButton.setAttribute('aria-pressed', String(!muted))
  elements.soundButton.setAttribute('aria-label', muted ? 'Enable sound' : 'Disable sound')
  saveProgress()
}

function componentDesignator(component) {
  const prefix = {
    battery: 'B',
    switch: 'SW',
    led: 'L',
    and: 'U',
    or: 'U',
    xor: 'U',
    not: 'U',
  }[component.type]
  const siblings = level.components.filter((entry) => entry.type === component.type)
  return `${prefix}${siblings.findIndex((entry) => entry.id === component.id) + 1}`
}

function componentById(id) {
  return level.components.find((component) => component.id === id)
}

function friendlyComponent(id) {
  const component = componentById(id)
  if (!component) return id
  if (GATE_TYPES.has(component.type)) {
    return `${component.type.toUpperCase()} ${componentDesignator(component)}`
  }
  return `${componentDesignator(component)} ${componentLabel(component)}`
}

function portLabel(ref) {
  const [componentId, portId] = ref.split(':')
  const component = componentById(componentId)
  if (!component) return ref
  const spec = COMPONENT_SPECS[component.type]
  const port = spec?.ports.find((entry) => entry.id === portId)
  const labels = { a: 'A', b: 'B', k: 'K', out: 'Y', pos: '+', neg: '−' }
  const label = labels[portId] || port?.label || portId.toUpperCase()
  return `${componentDesignator(component)} ${label}`
}

function wireExists(a, b) {
  return state.wires.some(
    (wire) => (wire.a === a && wire.b === b) || (wire.a === b && wire.b === a),
  )
}

function snapshot() {
  history.push({
    wires: state.wires.map((wire) => ({ ...wire })),
    switches: { ...state.switches },
  })
  if (history.length > 60) history.shift()
}

function restoreSnapshot(snapshotValue) {
  state = {
    wires: snapshotValue.wires.map((wire) => ({ ...wire })),
    switches: { ...snapshotValue.switches },
  }
  selectedWire = null
  armedPort = null
}

function elapsedSeconds() {
  if (frozenElapsed !== null) return frozenElapsed
  return Math.max(0, (performance.now() - startedAt) / 1000)
}

function formatClock(seconds) {
  const total = Math.floor(seconds)
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

function possibleScore(forLevel = level) {
  return 1000 + (forLevel.id - 1) * 20
}

function projectedScore() {
  return Math.max(150, possibleScore() - hintsUsed * HINT_PENALTY)
}

function projectedStars() {
  if (hintsUsed === 0) return 3
  if (hintsUsed === 1) return 2
  return 1
}

/* -------------------------------------------------------------------------- */
/*  level navigation and campaign map                                          */
/* -------------------------------------------------------------------------- */

function chapterFor(forLevel) {
  return CHAPTERS.find(
    (chapter) => forLevel.id >= chapter.range[0] && forLevel.id <= chapter.range[1],
  ) || CHAPTERS[0]
}

function renderLevelGrid() {
  const currentId = level.id
  elements.levelGrid.innerHTML = CHAPTERS.map((chapter) => {
    const chapterLevels = LEVELS.filter(
      (item) => item.id >= chapter.range[0] && item.id <= chapter.range[1],
    )
    const complete = chapterLevels.filter((item) => progress.completed[item.id]).length
    const cards = chapterLevels
      .map((item) => {
        const record = progress.completed[item.id]
        const unlocked = isUnlocked(item.id)
        const isCurrent = item.id === currentId
        const classes = [
          'level-card',
          record ? 'completed' : '',
          isCurrent ? 'current' : '',
          unlocked ? '' : 'locked',
        ]
          .filter(Boolean)
          .join(' ')
        const stars = [1, 2, 3]
          .map((star) => `<span class="${record && record.stars >= star ? 'on' : ''}">★</span>`)
          .join('')
        const dots = [1, 2, 3, 4, 5]
          .map((dot) => `<i class="${item.difficulty >= dot ? 'on' : ''}"></i>`)
          .join('')
        return `
          <button class="${classes}" type="button" data-level="${item.id}" ${
            unlocked ? '' : 'aria-disabled="true"'
          }>
            <div class="level-card-top">
              <span class="level-card-number">${pad(item.id)}</span>
              ${
                unlocked
                  ? record
                    ? '<svg class="level-card-lock" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m2.5 6 2.2 2.2L9.8 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                    : ''
                  : '<svg class="level-card-lock" viewBox="0 0 12 12" fill="none" aria-hidden="true"><rect x="2.3" y="5.2" width="7.4" height="5.2" rx="1" stroke="currentColor" stroke-width="1"/><path d="M4 5V3.8a2 2 0 0 1 4 0V5" stroke="currentColor" stroke-width="1"/></svg>'
              }
            </div>
            <h4>${item.title}</h4>
            <div class="level-card-foot">
              <span class="difficulty-dots" aria-label="Difficulty ${item.difficulty} of 5">${dots}</span>
              <span class="mini-stars" aria-label="${record ? `${record.stars} of 3 stars` : 'Not completed'}">${stars}</span>
            </div>
            <span class="card-node" aria-hidden="true"></span>
          </button>
        `
      })
      .join('')
    return `
      <section class="chapter-section">
        <div class="chapter-heading">
          <h3>${chapter.title}</h3>
          <span>CH ${pad(chapter.id)} · ${complete}/${chapterLevels.length}</span>
          <i></i>
          <span>${chapter.blurb}</span>
        </div>
        <div class="level-grid">${cards}</div>
      </section>
    `
  }).join('')
}

function updateCampaignUI() {
  const done = completedCount()
  const percent = Math.round((done / LEVEL_COUNT) * 100)
  elements.levelsComplete.textContent = `${done}/${LEVEL_COUNT}`
  elements.modalCompleteText.textContent = `${done} / ${LEVEL_COUNT}`
  elements.modalProgressText.textContent = `${percent}%`
  elements.modalProgressRing.style.setProperty('--progress', percent)
  elements.topProgressBar.style.width = `${(done / LEVEL_COUNT) * 100}%`
}

function setCurrentLevel(id, options = {}) {
  const { fresh = false, restore = true, saveCurrent = true } = options
  clearTimeout(completionTimer)
  completionTimer = 0
  const saved = !fresh ? loadJSON(SESSION_KEY, null) : null
  if (saveCurrent) saveSession()
  const nextLevel = getLevel(id)
  if (!nextLevel) return
  level = nextLevel
  state = { wires: [], switches: {} }
  history = []
  hintsUsed = 0
  completedThisAttempt = false
  frozenElapsed = null
  celebration = null
  hint = null
  clearTimeout(hintTimer)
  elements.hintBanner.classList.remove('visible')
  hoveredPort = null
  hoveredSwitch = null
  hoveredWire = null
  selectedWire = null
  armedPort = null
  drag = null
  cutMode = false
  if (!fresh && restore && saved && !saved.completed && Number(saved.levelId) === level.id) {
    const validPorts = new Set(levelPorts(level).map((port) => port.ref))
    state.wires = Array.isArray(saved.wires)
      ? saved.wires.filter(
          (wire) =>
            wire &&
            typeof wire.a === 'string' &&
            typeof wire.b === 'string' &&
            validPorts.has(wire.a) &&
            validPorts.has(wire.b) &&
            wire.a.split(':')[0] !== wire.b.split(':')[0],
        )
      : []
    state.switches = saved.switches && typeof saved.switches === 'object' ? saved.switches : {}
    hintsUsed = Number(saved.hintsUsed) || 0
    const elapsed = Number(saved.elapsed) || 0
    startedAt = performance.now() - elapsed * 1000
  } else {
    for (const component of level.components) {
      if (component.type === 'switch') state.switches[component.id] = Boolean(component.initial)
    }
    startedAt = performance.now()
  }
  for (const component of level.components) {
    if (component.type === 'switch' && state.switches[component.id] === undefined) {
      state.switches[component.id] = Boolean(component.initial)
    }
  }
  progress.lastLevel = level.id
  saveProgress()
  board.setLevel(level)
  loadAt = performance.now()
  validation = validate(level, state)
  renderStaticLevelUI()
  renderLevelGrid()
  updateCampaignUI()
  updateAllUI()
  saveSession()
  if (validation.solved && !completedThisAttempt && restore) scheduleCompletion()
}

function renderStaticLevelUI() {
  const chapter = chapterFor(level)
  elements.levelTitle.textContent = level.title
  elements.levelBrief.textContent = level.brief
  elements.levelTip.textContent = level.tip
  elements.chapterChip.textContent = `CH ${pad(chapter.id)}`
  elements.topChapter.textContent = chapter.title.toUpperCase()
  elements.topLevelNumber.textContent = `LEVEL ${pad(level.id)}`
  elements.topLevelTitle.textContent = level.title.toUpperCase()
  elements.hudAssembly.textContent = `CM-${pad(level.id, 3)}`
  elements.componentCount.textContent = pad(level.components.length)
  elements.possibleScore.textContent = formatNumber(possibleScore())
  elements.nextLevelLabel.textContent =
    level.id >= LEVEL_COUNT
      ? 'Campaign map'
      : isUnlocked(level.id + 1)
        ? getLevel(level.id + 1).title
        : `Level ${pad(level.id + 1)} locked`
  elements.interactionHint.textContent = 'Drag terminal to terminal'
  updateCampaignUI()
}

function updateNextLevelButton() {
  if (level.id >= LEVEL_COUNT) {
    elements.nextLevelLabel.textContent = 'Campaign map'
    return
  }
  const next = getLevel(level.id + 1)
  elements.nextLevelLabel.textContent = isUnlocked(next.id) ? next.title : `Level ${pad(next.id)} locked`
}

/* -------------------------------------------------------------------------- */
/*  live HUD                                                                  */
/* -------------------------------------------------------------------------- */

function objectiveMarkup(items) {
  elements.objectiveList.innerHTML = items
    .map(
      (item) => `
        <li class="${item.done ? 'done' : ''} ${item.failed ? 'failed' : ''}">
          <span class="objective-dot">✓</span>
          <span>${item.text}</span>
        </li>
      `,
    )
    .join('')
}

function updateObjectives() {
  const sim = validation.sim
  const goals = level.ledGoals || {}
  const targetLeds = level.components.filter(
    (component) => component.type === 'led' && (goals[component.id] || 'on') === 'on',
  )
  const offLeds = level.components.filter(
    (component) => component.type === 'led' && goals[component.id] === 'off',
  )
  const items = []
  const wrongIds = new Set(validation.wrongLeds.map((entry) => entry.id))
  const targetWrong = targetLeds.some((component) => wrongIds.has(component.id))
  const offWrong = offLeds.some((component) => wrongIds.has(component.id))
  const loadText = offLeds.length
    ? `${formatObjective(level)} — keep ${offLeds.map((component) => componentDesignator(component)).join(', ')} dark`
    : formatObjective(level)
  items.push({
    text: loadText,
    done: !targetWrong && !offWrong,
    failed: validation.sim.short && targetWrong,
  })

  if ((level.requiredControls || []).length) {
    const controls = level.requiredControls
    const ineffective = new Set(validation.ineffectiveControls)
    items.push({
      text: `Make all ${controls.length} switches and gates part of the live path`,
      done: ineffective.size === 0 && !validation.missingInputs.length && !validation.missingOutputs.length,
      failed: false,
    })
  }

  const gates = level.components.filter((component) => GATE_TYPES.has(component.type))
  if (gates.length) {
    items.push({
      text: `Wire every logic input and output (${gates.length} gate${gates.length > 1 ? 's' : ''})`,
      done: !validation.missingInputs.length && !validation.missingOutputs.length,
      failed: false,
    })
  }

  items.push({
    text: 'Keep the circuit free of shorts and driver conflicts',
    done: !sim.short && sim.conflicts.length === 0 && state.wires.length > 0,
    failed: sim.short || sim.conflicts.length > 0,
  })

  objectiveMarkup(items)
}

function updateStatus() {
  const sim = validation.sim
  const short = sim.short
  const conflict = sim.conflicts.length > 0
  const missingInput = validation.missingInputs.length > 0
  const missingOutput = validation.missingOutputs.length > 0
  const badControls = validation.ineffectiveControls.length > 0
  const wrong = validation.wrongLeds.length > 0
  const wired = state.wires.length > 0
  const pill = elements.boardStatusPill
  pill.className = 'board-status-pill'
  elements.captionIcon.className = 'caption-icon'
  let status = 'AWAITING CONNECTION'
  let title = 'READY TO WIRE'
  let detail = 'Drag from a metal terminal to another. A switch can be tapped to toggle it.'
  let pillState = ''
  let iconState = ''

  if (validation.solved) {
    status = 'CIRCUIT COMPLETE'
    title = 'PATH CLOSED'
    detail = 'Every load is driven, every control matters, and the return path is stable.'
    pillState = 'solved'
    iconState = 'ok'
  } else if (short) {
    status = 'SHORT CIRCUIT'
    title = 'SHORT DETECTED'
    detail = 'Power is reaching ground without crossing a load. Cut the direct route between the rails.'
    pillState = 'danger'
    iconState = 'bad'
  } else if (conflict) {
    status = 'SIGNAL CONFLICT'
    title = 'DRIVER CONFLICT'
    detail = 'Two outputs are fighting over the same net. Separate the gate outputs before continuing.'
    pillState = 'danger'
    iconState = 'bad'
  } else if (missingInput) {
    status = 'LOGIC INPUT FLOATING'
    title = 'FLOATING INPUT'
    detail = `Connect ${portLabel(validation.missingInputs[0].ref)} to a high or ground rail.`
    pillState = 'warning'
    iconState = 'warn'
  } else if (missingOutput) {
    status = 'GATE OUTPUT OPEN'
    title = 'OUTPUT UNWIRED'
    detail = `Connect ${portLabel(validation.missingOutputs[0].ref)} to a lamp or the next gate. Every output needs a path.`
    pillState = 'warning'
    iconState = 'warn'
  } else if (badControls) {
    status = 'CONTROL PATH OPEN'
    title = 'LOAD NOT CONTROLLED'
    detail = `${friendlyComponent(validation.ineffectiveControls[0])} does not affect any load. Route the load through it.`
    pillState = 'warning'
    iconState = 'warn'
  } else if (wired && wrong) {
    const targetCount = level.components.filter(
      (component) => component.type === 'led' && (level.ledGoals?.[component.id] || 'on') === 'on',
    ).length
    status = `${validation.litCount} / ${targetCount} LOADS ONLINE`
    title = 'PARTIAL POWER'
    detail =
      targetCount > validation.litCount
        ? `${targetCount - validation.litCount} target lamp${targetCount - validation.litCount === 1 ? '' : 's'} still dark. Trace the open path back to the cell.`
        : 'A lamp is lit that should be dark. Break the unintended route.'
    pillState = 'live'
    iconState = ''
  } else if (wired) {
    status = 'SIGNAL SCANNING'
    title = 'CHECK THE PATH'
    detail = 'Keep closing paths until every target load reports online.'
    pillState = 'live'
    iconState = ''
  }

  elements.boardStatus.textContent = status
  if (pillState) pill.classList.add(pillState)
  if (iconState) elements.captionIcon.classList.add(iconState)
  elements.captionTitle.textContent = title
  elements.captionDetail.textContent = detail
  elements.loadStat.textContent = `${validation.litCount} / ${validation.ledCount}`
  elements.wireStat.textContent = String(state.wires.length)
}

function updateDiagnostics() {
  const sim = validation.sim
  const wires = state.wires
  const railLive = wires.some(
    (wire) =>
      sim.netPower.get(wire.a) === 'high' ||
      sim.netPower.get(wire.b) === 'high',
  )
  const gates = level.components.filter((component) => GATE_TYPES.has(component.type))
  const highGates = sim.gateStates.filter((gateState) => gateState.out).length
  const powerValue = elements.diagPower.querySelector('b')
  const loadValue = elements.diagLoad.querySelector('b')
  const logicValue = elements.diagLogic.querySelector('b')
  const safetyValue = elements.diagSafety.querySelector('b')

  powerValue.textContent = railLive ? 'LIVE' : 'OPEN'
  powerValue.className = railLive ? 'ok' : ''
  loadValue.textContent = `${validation.litCount} / ${validation.ledCount}`
  loadValue.className =
    validation.wrongLeds.length === 0 ? 'ok' : validation.litCount > 0 ? 'warn' : ''
  if (!gates.length) {
    logicValue.textContent = 'NONE'
    logicValue.className = ''
  } else if (validation.missingInputs.length || validation.missingOutputs.length) {
    logicValue.textContent = 'FLOATING'
    logicValue.className = 'warn'
  } else {
    logicValue.textContent = `${highGates}/${gates.length} HIGH`
    logicValue.className = highGates ? 'ok' : ''
  }
  const conflict = sim.conflicts.length > 0
  safetyValue.textContent = sim.short ? 'SHORT!' : conflict ? 'CONFLICT' : 'CLEAR'
  safetyValue.className = sim.short || conflict ? 'bad' : 'ok'
  elements.diagMode.textContent = state.wires.length ? 'LIVE' : 'SCAN'
  elements.hudRail.textContent = railLive ? 'LIVE' : 'OFFLINE'
  elements.hudRailLed.classList.toggle('on', railLive)
}

function updateScoreUI() {
  const score = projectedScore()
  const stars = projectedStars()
  const max = possibleScore()
  elements.scoreValue.textContent = formatNumber(score)
  elements.scoreDelta.textContent = hintsUsed ? `−${formatNumber(hintsUsed * HINT_PENALTY)}` : 'MAX'
  elements.scoreDelta.classList.toggle('penalty', hintsUsed > 0)
  elements.possibleScore.textContent = formatNumber(max)
  const starNodes = elements.starRow.querySelectorAll('.star')
  starNodes.forEach((node, index) => node.classList.toggle('on', index < stars))
  elements.starRow.setAttribute('aria-label', `${stars} of three projected stars`)
  elements.scoreMeter.style.width = `${clamp((score / max) * 100, 6, 100)}%`
}

function updateClock() {
  elements.missionClock.textContent = formatClock(elapsedSeconds())
}

function updateUndoState() {
  elements.undoButton.disabled = history.length === 0
  elements.undoButton.setAttribute('aria-disabled', String(history.length === 0))
}

function updateCutModeUI() {
  elements.cutButton.classList.toggle('active', cutMode)
  elements.cutButton.setAttribute('aria-pressed', String(cutMode))
  elements.cutButtonTop.classList.toggle('active', cutMode)
  elements.canvasWrap.classList.toggle(CUT_MODE_CLASS, cutMode)
  elements.interactionHint.textContent = cutMode
    ? 'Tap a wire to cut it'
    : 'Drag terminal to terminal'
}

function updateAllUI() {
  updateObjectives()
  updateStatus()
  updateDiagnostics()
  updateScoreUI()
  updateClock()
  updateUndoState()
  updateCutModeUI()
  updateNextLevelButton()
  elements.nextLevelButton.disabled = level.id < LEVEL_COUNT && !isUnlocked(level.id + 1)
  elements.nextLevelButton.setAttribute(
    'aria-disabled',
    String(level.id < LEVEL_COUNT && !isUnlocked(level.id + 1)),
  )
}

/* -------------------------------------------------------------------------- */
/*  persistence                                                               */
/* -------------------------------------------------------------------------- */

function saveSession() {
  if (!level) return
  saveJSON(SESSION_KEY, {
    levelId: level.id,
    wires: state.wires,
    switches: state.switches,
    hintsUsed,
    elapsed: elapsedSeconds(),
    completed: completedThisAttempt,
  })
}

function showHint(text, options = {}) {
  clearTimeout(hintTimer)
  elements.hintText.textContent = text
  elements.hintBanner.classList.add('visible')
  hint = options
  hintTimer = window.setTimeout(() => {
    hint = null
    elements.hintBanner.classList.remove('visible')
  }, options.duration || 9500)
}

function clearHint() {
  clearTimeout(hintTimer)
  hint = null
  elements.hintBanner.classList.remove('visible')
}

/* -------------------------------------------------------------------------- */
/*  simulation & completion                                                    */
/* -------------------------------------------------------------------------- */

function refreshSimulation({ checkCompletion = true, persist = true } = {}) {
  validation = validate(level, state)
  updateAllUI()
  if (persist) saveSession()
  if (validation.solved && checkCompletion) {
    scheduleCompletion()
  } else if (!validation.solved) {
    clearTimeout(completionTimer)
    completionTimer = 0
  }
}

function scheduleCompletion() {
  if (completedThisAttempt || completionTimer) return
  completionTimer = window.setTimeout(() => {
    completionTimer = 0
    if (!validation.solved || completedThisAttempt) return
    finishLevel()
  }, 760)
}

function finishLevel() {
  if (completedThisAttempt) return
  completedThisAttempt = true
  frozenElapsed = elapsedSeconds()
  elements.missionClock.textContent = formatClock(frozenElapsed)
  const score = projectedScore()
  const stars = projectedStars()
  const previous = progress.completed[level.id]
  const isBest = !previous || score > previous.score
  progress.completed[level.id] = {
    score: Math.max(score, previous?.score || 0),
    stars: Math.max(stars, previous?.stars || 0),
    hints: previous ? Math.min(previous.hints ?? hintsUsed, hintsUsed) : hintsUsed,
    time: previous ? Math.min(previous.time ?? frozenElapsed, frozenElapsed) : frozenElapsed,
  }
  progress.lastLevel = Math.min(LEVEL_COUNT, level.id + 1)
  saveProgress()
  saveSession()
  updateCampaignUI()
  renderLevelGrid()
  updateNextLevelButton()
  celebration = createSparkBurst(level)
  sound.complete()
  openCompletion(score, stars, isBest, previous)
}

function openCompletion(score, stars, isBest, previous) {
  const lastLevel = level.id >= LEVEL_COUNT
  elements.completeSubtitle.textContent = lastLevel
    ? 'The master board is live. Every circuit in the lab is complete.'
    : 'Every path is closed. The board is singing.'
  elements.completionNote.textContent = hintsUsed
    ? `${hintsUsed} hint${hintsUsed === 1 ? '' : 's'} used · −${formatNumber(
        hintsUsed * HINT_PENALTY,
      )} rating points`
    : 'FLAWLESS BUILD · NO HINTS USED'
  elements.completeBest.textContent = isBest
    ? 'NEW PERSONAL BEST'
    : `PERSONAL BEST ${formatNumber(previous?.score || score)}`
  elements.nextButton.innerHTML = lastLevel
    ? 'Campaign map <span>→</span>'
    : 'Next circuit <span>→</span>'
  const starNodes = elements.completionStars.querySelectorAll('span')
  starNodes.forEach((node) => node.classList.remove('on'))
  elements.completionStars.setAttribute('aria-label', `${stars} of three stars`)

  const originalText = elements.completeScore.textContent
  elements.completeScore.textContent = '0'
  openDialog(elements.completeModal)
  let started = 0
  const countUp = (time) => {
    if (!started) started = time
    const progressValue = clamp((time - started) / 780, 0, 1)
    const eased = 1 - Math.pow(1 - progressValue, 3)
    elements.completeScore.textContent = formatNumber(score * eased)
    if (progressValue < 1) requestAnimationFrame(countUp)
  }
  requestAnimationFrame(countUp)
  window.setTimeout(() => {
    starNodes.forEach((node, index) => {
      if (index < stars) node.classList.add('on')
    })
  }, 260)
  if (originalText === 'NaN') elements.completeScore.textContent = formatNumber(score)
}

function resetCurrentLevel({ keepHints = true } = {}) {
  snapshot()
  const hints = hintsUsed
  state = { wires: [], switches: {} }
  for (const component of level.components) {
    if (component.type === 'switch') state.switches[component.id] = Boolean(component.initial)
  }
  hintsUsed = keepHints ? hints : 0
  completedThisAttempt = false
  frozenElapsed = null
  startedAt = performance.now()
  clearTimeout(completionTimer)
  completionTimer = 0
  clearHint()
  selectedWire = null
  armedPort = null
  drag = null
  hoveredPort = null
  hoveredWire = null
  loadAt = performance.now()
  refreshSimulation()
  showToast(keepHints && hints ? 'Board reset · hint penalty retained' : 'Board reset')
}

/* -------------------------------------------------------------------------- */
/*  hints                                                                      */
/* -------------------------------------------------------------------------- */

function useHint() {
  if (validation.solved) {
    showToast('This circuit is already complete')
    return
  }
  const missingWire = (level.solutionWires || []).find(
    (wire) => !wireExists(wire.a, wire.b),
  )
  if (missingWire) {
    hintsUsed += 1
    const text = `Trace ${portLabel(missingWire.a)} → ${portLabel(missingWire.b)}`
    showHint(text, { wire: missingWire })
    sound.hint()
    refreshSimulation({ checkCompletion: false, persist: true })
    showToast('Ghost wire shown · hint penalty applied', '', 2000)
    return
  }
  const switchEntries = Object.entries(level.solutionSwitches || {})
  const switchMismatch = switchEntries.find(
    ([id, value]) => Boolean(state.switches[id]) !== Boolean(value),
  )
  if (switchMismatch) {
    hintsUsed += 1
    const [id, value] = switchMismatch
    const switchComponent = componentById(id)
    showHint(
      `${componentDesignator(switchComponent)} should be ${value ? 'CLOSED' : 'OPEN'} for this build`,
      { switchId: id, duration: 7000 },
    )
    sound.hint()
    refreshSimulation({ checkCompletion: false, persist: true })
    return
  }
  if (validation.ineffectiveControls.length) {
    hintsUsed += 1
    const control = validation.ineffectiveControls[0]
    showHint(
      `${friendlyComponent(control)} is bypassed — route a load through it`,
      { switchId: componentById(control)?.type === 'switch' ? control : null, duration: 7000 },
    )
    sound.hint()
    refreshSimulation({ checkCompletion: false, persist: true })
    return
  }
  showToast('The authored route is complete — check the live diagnostics for the open branch')
}

/* -------------------------------------------------------------------------- */
/*  interaction                                                               */
/* -------------------------------------------------------------------------- */

function addWire(a, b) {
  if (!a || !b) return
  if (a === b) {
    showToast('A terminal cannot connect to itself', 'danger')
    sound.error()
    return
  }
  if (a.split(':')[0] === b.split(':')[0]) {
    showToast('Connect between different components', 'danger')
    sound.error()
    return
  }
  if (duplicateWire(state.wires, a, b)) {
    showToast('Those terminals are already wired')
    sound.click()
    return
  }
  snapshot()
  state.wires.push({ a, b })
  selectedWire = null
  armedPort = null
  clearHint()
  sound.connect()
  loadAt = 0
  refreshSimulation()
}

function removeWire(index, record = true) {
  if (index === null || index < 0 || index >= state.wires.length) return
  if (record) snapshot()
  state.wires.splice(index, 1)
  selectedWire = null
  armedPort = null
  clearHint()
  sound.cut()
  refreshSimulation()
}

function toggleSwitch(component) {
  if (!component || component.type !== 'switch') return
  snapshot()
  state.switches[component.id] = !state.switches[component.id]
  clearHint()
  sound.toggle(state.switches[component.id])
  refreshSimulation()
}

function undo() {
  if (!history.length) {
    showToast('Nothing to undo')
    return
  }
  restoreSnapshot(history.pop())
  clearHint()
  sound.click()
  refreshSimulation()
}

function toggleCutMode(force) {
  cutMode = typeof force === 'boolean' ? force : !cutMode
  armedPort = null
  selectedWire = null
  hoveredWire = null
  updateCutModeUI()
  sound.click()
}

function describeComponent(component) {
  const descriptions = {
    battery: 'CELL — supplies a high rail at + and ground at −. Both rails are needed for current.',
    switch: 'SWITCH — tap to open or close it. It must sit in the live path of a load.',
    led: 'LAMP — current must enter the A (anode) terminal and leave K (cathode) into ground.',
    and: 'AND GATE — output Y is high only when both A and B are high.',
    or: 'OR GATE — output Y is high when A, B, or both are high.',
    xor: 'XOR GATE — output Y is high only when A and B disagree.',
    not: 'NOT GATE — output Y is the inverse of input A.',
  }
  showToast(descriptions[component.type] || component.type.toUpperCase(), '', 4200)
}

/* -------------------------------------------------------------------------- */
/*  pointer wiring                                                            */
/* -------------------------------------------------------------------------- */

function pointerPosition(event) {
  return board.toVirtual(event.clientX, event.clientY)
}

function hoverAt(point) {
  hoveredPort = board.portAt(point.x, point.y, 31)?.ref || null
  hoveredSwitch = hoveredPort ? null : board.switchAt(point.x, point.y)?.id || null
  hoveredWire =
    hoveredPort || hoveredSwitch || drag ? null : board.wireAt(point.x, point.y, state.wires, 13)
  if (cutMode) {
    canvas.style.cursor = hoveredWire !== null ? 'cell' : 'crosshair'
  } else if (hoveredPort) {
    canvas.style.cursor = armedPort ? 'alias' : 'grab'
  } else if (hoveredSwitch) {
    canvas.style.cursor = 'pointer'
  } else if (hoveredWire !== null) {
    canvas.style.cursor = selectedWire === hoveredWire ? 'not-allowed' : 'pointer'
  } else {
    canvas.style.cursor = 'crosshair'
  }
}

function handlePointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  sound.ensure()
  lastPointerType = event.pointerType || 'mouse'
  const point = pointerPosition(event)
  const port = board.portAt(point.x, point.y, 33)

  if (cutMode) {
    const wireIndex = board.wireAt(point.x, point.y, state.wires, 16)
    if (wireIndex !== null) {
      removeWire(wireIndex)
      if (!state.wires.length) toggleCutMode(false)
    } else {
      toggleCutMode(false)
    }
    return
  }

  if (armedPort && port) {
    if (port.ref !== armedPort) {
      addWire(armedPort, port.ref)
    } else {
      armedPort = null
      showToast('Terminal disarmed')
      sound.click()
    }
    return
  }

  if (port) {
    selectedWire = null
    armedPort = null
    drag = {
      from: port.ref,
      point: { ...point },
      start: { ...point },
      moved: false,
      targetRef: null,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
    }
    hoveredPort = port.ref
    elements.canvasWrap.classList.add('dragging')
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is a progressive enhancement.
    }
    return
  }

  const switchComponent = board.switchAt(point.x, point.y)
  if (switchComponent) {
    armedPort = null
    selectedWire = null
    toggleSwitch(switchComponent)
    return
  }

  const wireIndex = board.wireAt(point.x, point.y, state.wires, 16)
  if (wireIndex !== null) {
    armedPort = null
    if (selectedWire === wireIndex) {
      removeWire(wireIndex)
      showToast('Wire cut')
    } else {
      selectedWire = wireIndex
      sound.click()
      showToast('Wire selected · tap it again to cut', '', 2400)
    }
    return
  }

  const component = board.componentAt(point.x, point.y)
  if (component) {
    armedPort = null
    selectedWire = null
    describeComponent(component)
    sound.click()
    return
  }

  selectedWire = null
  if (armedPort) {
    armedPort = null
    showToast('Terminal disarmed')
  }
}

function handlePointerMove(event) {
  const point = pointerPosition(event)
  if (drag) {
    drag.point = point
    drag.moved =
      drag.moved || Math.hypot(point.x - drag.start.x, point.y - drag.start.y) > 8
    const target = board.portAt(point.x, point.y, 36)
    const valid =
      target &&
      target.ref !== drag.from &&
      target.component.id !== drag.from.split(':')[0]
    drag.targetRef = valid ? target.ref : null
    hoveredPort = drag.targetRef || drag.from
    hoveredSwitch = null
    hoveredWire = null
    return
  }
  hoverAt(point)
}

function finishPointerDrag(event, cancelled = false) {
  if (!drag) return
  const dragValue = drag
  const target = dragValue.targetRef
    ? board.portByRef.get(dragValue.targetRef)
    : board.portAt(dragValue.point.x, dragValue.point.y, 36)
  drag = null
  elements.canvasWrap.classList.remove('dragging')
  try {
    canvas.releasePointerCapture(event.pointerId)
  } catch {
    // Ignore browsers that already released the pointer.
  }
  if (cancelled) {
    armedPort = null
    return
  }
  if (
    target &&
    target.ref !== dragValue.from &&
    target.component.id !== dragValue.from.split(':')[0]
  ) {
    addWire(dragValue.from, target.ref)
    return
  }
  if (!dragValue.moved) {
    if (armedPort === dragValue.from) {
      armedPort = null
      showToast('Terminal disarmed')
      sound.click()
    } else {
      armedPort = dragValue.from
      sound.click()
      showToast('Terminal armed · tap another terminal to connect', '', 3000)
    }
  }
  hoveredPort = null
}

/* -------------------------------------------------------------------------- */
/*  keyboard shortcuts                                                        */
/* -------------------------------------------------------------------------- */

function handleKeydown(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
  const key = event.key.toLowerCase()
  if (key === 'escape') {
    if (drag) {
      drag = null
      elements.canvasWrap.classList.remove('dragging')
      return
    }
    if (armedPort) {
      armedPort = null
      return
    }
    if (cutMode) {
      toggleCutMode(false)
      return
    }
    if (document.querySelector('dialog[open]')) return
    selectedWire = null
    return
  }
  if (document.querySelector('dialog[open]')) return
  if (key === 'h' && !event.metaKey && !event.ctrlKey) {
    event.preventDefault()
    useHint()
  } else if (key === 'u' && !event.metaKey && !event.ctrlKey) {
    event.preventDefault()
    undo()
  } else if (key === 'r' && !event.metaKey && !event.ctrlKey) {
    event.preventDefault()
    resetCurrentLevel()
  } else if ((key === 'delete' || key === 'backspace') && selectedWire !== null) {
    event.preventDefault()
    removeWire(selectedWire)
  } else if (key === 'c' && !event.metaKey && !event.ctrlKey) {
    toggleCutMode()
  }
}

/* -------------------------------------------------------------------------- */
/*  canvas loop                                                               */
/* -------------------------------------------------------------------------- */

function frame(time) {
  board.draw({
    time,
    state,
    sim: validation.sim,
    loadAt,
    hoveredPort,
    hoveredSwitch,
    hoveredWire,
    selectedWire,
    drag,
    armedPort,
    hint,
    celebration,
  })
  requestAnimationFrame(frame)
}

/* -------------------------------------------------------------------------- */
/*  level-modal reset                                                         */
/* -------------------------------------------------------------------------- */

let resetProgressArmed = false
let resetProgressTimer = 0

function resetCampaign() {
  if (!resetProgressArmed) {
    resetProgressArmed = true
    elements.resetProgressButton.textContent = 'Confirm reset — this clears all progress'
    clearTimeout(resetProgressTimer)
    resetProgressTimer = window.setTimeout(() => {
      resetProgressArmed = false
      elements.resetProgressButton.textContent = 'Reset campaign'
    }, 4200)
    return
  }
  clearTimeout(resetProgressTimer)
  resetProgressArmed = false
  progress.completed = {}
  progress.lastLevel = 1
  saveProgress()
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore unavailable storage.
  }
  elements.resetProgressButton.textContent = 'Campaign reset'
  elements.levelModal.close()
  setCurrentLevel(1, { fresh: true, saveCurrent: false })
  showToast('Campaign reset · restarting from level 01', '', 3200)
}

/* -------------------------------------------------------------------------- */
/*  init & events                                                             */
/* -------------------------------------------------------------------------- */

function bindEvents() {
  canvas.addEventListener('pointerdown', handlePointerDown)
  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerup', (event) => finishPointerDrag(event, false))
  canvas.addEventListener('pointercancel', (event) => finishPointerDrag(event, true))
  canvas.addEventListener('pointerleave', () => {
    if (!drag) {
      hoveredPort = null
      hoveredSwitch = null
      hoveredWire = null
    }
  })
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault()
    const point = pointerPosition(event)
    const wireIndex = board.wireAt(point.x, point.y, state.wires, 16)
    if (wireIndex !== null) {
      removeWire(wireIndex)
      showToast('Wire cut')
    }
  })

  elements.levelsButton.addEventListener('click', () => {
    sound.click()
    renderLevelGrid()
    updateCampaignUI()
    openDialog(elements.levelModal)
  })

  elements.helpButton.addEventListener('click', () => {
    sound.click()
    openDialog(elements.helpModal)
  })

  elements.soundButton.addEventListener('click', () => {
    sound.ensure()
    setSoundMuted(!progress.muted)
    if (!progress.muted) sound.unlock()
  })

  elements.hintButton.addEventListener('click', useHint)
  elements.undoButton.addEventListener('click', undo)
  elements.cutButton.addEventListener('click', () => toggleCutMode())
  elements.cutButtonTop.addEventListener('click', () => toggleCutMode())
  elements.resetButton.addEventListener('click', () => resetCurrentLevel())
  elements.nextLevelButton.addEventListener('click', () => {
    if (level.id >= LEVEL_COUNT) {
      openDialog(elements.levelModal)
      renderLevelGrid()
      return
    }
    if (!isUnlocked(level.id + 1)) {
      showToast(`Complete level ${pad(level.id)} to unlock level ${pad(level.id + 1)}`, 'danger')
      return
    }
    sound.click()
    setCurrentLevel(level.id + 1)
  })

  elements.levelModal.addEventListener('click', (event) => {
    const card = event.target.closest('.level-card')
    if (card) {
      const id = Number(card.dataset.level)
      if (!isUnlocked(id)) {
        showToast(`Level ${pad(id)} is locked · complete level ${pad(id - 1)} first`, 'danger')
        sound.error()
        return
      }
      sound.click()
      elements.levelModal.close()
      setCurrentLevel(id)
      if (window.matchMedia('(max-width: 980px)').matches) {
        window.setTimeout(() => {
          elements.canvasWrap.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 90)
      }
      return
    }
    if (event.target === elements.levelModal) elements.levelModal.close()
  })

  elements.helpModal.addEventListener('click', (event) => {
    if (event.target === elements.helpModal) elements.helpModal.close()
  })
  elements.completeModal.addEventListener('click', (event) => {
    if (event.target === elements.completeModal) elements.completeModal.close()
  })

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('dialog')
      if (dialog) closeDialog(dialog)
    })
  })

  elements.resetProgressButton.addEventListener('click', resetCampaign)

  elements.nextButton.addEventListener('click', () => {
    elements.completeModal.close()
    if (level.id >= LEVEL_COUNT) {
      renderLevelGrid()
      updateCampaignUI()
      openDialog(elements.levelModal)
      return
    }
    setCurrentLevel(level.id + 1, { fresh: true })
    sound.click()
  })

  elements.replayButton.addEventListener('click', () => {
    elements.completeModal.close()
    setCurrentLevel(level.id, { fresh: true })
    sound.click()
  })

  elements.completeMapButton.addEventListener('click', () => {
    elements.completeModal.close()
    renderLevelGrid()
    updateCampaignUI()
    openDialog(elements.levelModal)
  })

  document.addEventListener('keydown', handleKeydown)

  window.addEventListener('pagehide', () => {
    saveSession()
    saveProgress()
  })

  window.addEventListener('resize', () => board.resize())

  // Native dialogs close with Escape, and the browser restores focus itself.
  elements.completeModal.addEventListener('close', () => {
    if (!completedThisAttempt) return
    saveSession()
  })
}

function boot() {
  setSoundMuted(progress.muted)
  bindEvents()
  const saved = loadJSON(SESSION_KEY, null)
  const savedLevel = Number(saved?.levelId)
  const savedCompleted = Boolean(saved?.completed)
  let launch = Number(progress.lastLevel) || 1
  if (
    saved &&
    Number.isInteger(savedLevel) &&
    savedLevel >= 1 &&
    savedLevel <= LEVEL_COUNT &&
    !savedCompleted &&
    isUnlocked(savedLevel)
  ) {
    launch = savedLevel
  }
  if (!isUnlocked(launch)) launch = highestUnlocked()
  setCurrentLevel(launch, { restore: !savedCompleted, saveCurrent: false })
  requestAnimationFrame(frame)
  window.setInterval(updateClock, 500)
  updateCampaignUI()
  renderLevelGrid()
}

boot()

