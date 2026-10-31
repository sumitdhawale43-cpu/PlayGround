// MONSTER MERGE — navigation, modals, merge/summon flows and shell wiring.
import {
  CAMPAIGN, MONSTERS, MONSTER_BY_ID, ELEMENTS, EGGS,
  nextEvolution
} from './data.js'
import * as S from './state.js'
import * as V from './views.js'
import { startBattle } from './battle.js'
import { audio } from './audio.js'
import {
  icons, esc, fmt, stars, elementVars, elementGlyph,
  monsterArt, eggArt, sleep, toast, confetti, burstElement,
  openOverlay, closeOverlay, hasOverlay, modalShell
} from './dom.js'

const VIEWS = {
  home: V.homeView,
  collection: V.collectionView,
  merge: V.mergeView,
  battle: V.campaignView,
  nest: V.nestView
}

const TITLES = {
  home: 'MONSTER MERGE — Evolution Battle',
  collection: 'Monster Codex — MONSTER MERGE',
  merge: 'Merge Lab — MONSTER MERGE',
  battle: 'Evolution Trail — MONSTER MERGE',
  nest: 'The Nest — MONSTER MERGE'
}

let currentView = 'home'
let modalContext = null
let busy = false
let initialized = false

/* ── shell / routing ─────────────────────────────────────────────────────── */

function routeFromHash() {
  const raw = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return Object.prototype.hasOwnProperty.call(VIEWS, raw) ? raw : 'home'
}

function updateShell() {
  document.querySelectorAll('[data-coins]').forEach(node => { node.textContent = fmt(S.state.coins) })
  document.querySelectorAll('[data-gems]').forEach(node => { node.textContent = fmt(S.state.gems) })

  document.querySelectorAll('.nav-link, .bottom-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === currentView)
    if (link.dataset.view === currentView) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })

  const soundBtn = document.getElementById('sound-btn')
  if (soundBtn) {
    const on = S.state.settings.sound
    soundBtn.classList.toggle('muted', !on)
    soundBtn.setAttribute('aria-pressed', String(on))
    soundBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound')
    soundBtn.title = on ? 'Mute sound' : 'Enable sound'
  }
}

function bumpWallet(id) {
  const pill = document.getElementById(id)
  if (!pill) return
  pill.classList.remove('bump')
  void pill.offsetWidth
  pill.classList.add('bump')
  setTimeout(() => pill.classList.remove('bump'), 500)
}

export function render(view = currentView, { scroll = true } = {}) {
  const target = Object.prototype.hasOwnProperty.call(VIEWS, view) ? view : 'home'
  const root = document.getElementById('view-root')
  if (!root) return
  root.innerHTML = VIEWS[target]()
  currentView = target
  document.body.dataset.screen = target
  document.title = TITLES[target] || TITLES.home
  S.setView(target)
  updateShell()
  if (scroll) root.scrollTop = 0
  const inner = root.firstElementChild
  if (inner) inner.classList.add('view-enter')
}

export function navigate(view, { replace = false, scroll = true } = {}) {
  const target = Object.prototype.hasOwnProperty.call(VIEWS, view) ? view : 'home'
  const hash = `#/${target}`
  if (replace) history.replaceState({ view: target }, '', hash)
  else if (location.hash !== hash) history.pushState({ view: target }, '', hash)
  else history.replaceState({ view: target }, '', hash)
  render(target, { scroll })
}

function onPopState() {
  closeModal(false)
  render(routeFromHash())
}

/* ── modal plumbing ──────────────────────────────────────────────────────── */

function mountModal(inner, options = {}, context = null) {
  modalContext = context
  return openOverlay(inner, {
    ...options,
    onClose: () => {
      if (modalContext === context) modalContext = null
    }
  })
}

function replaceModal(inner, options = {}, context = null) {
  const wrap = document.querySelector('#modal-root .modal-backdrop')
  if (!wrap) {
    mountModal(inner, options, context)
    return
  }
  modalContext = context
  wrap.innerHTML = inner
}

export function closeModal(animate = true) {
  modalContext = null
  closeOverlay(animate)
}

function refreshModal() {
  const ctx = modalContext
  if (!ctx) return
  if (ctx.type === 'detail') {
    replaceModal(modalShell(V.detailView(ctx.id), { wide: true, className: 'detail-modal' }), {}, ctx)
  } else if (ctx.type === 'team') {
    replaceModal(modalShell(V.teamEditorView(), { small: true, className: 'team-modal' }), {}, ctx)
  } else if (ctx.type === 'stage') {
    const stage = CAMPAIGN.find(s => s.id === ctx.stageId)
    if (stage) replaceModal(modalShell(V.stagePreviewView(stage), { small: true, className: 'stage-modal' }), {}, ctx)
  } else if (ctx.type === 'help') {
    replaceModal(modalShell(helpInner(), { small: true, className: 'help-modal' }), {}, ctx)
  }
}

/* ── detail + team editor ────────────────────────────────────────────────── */

function openMonster(id) {
  if (!MONSTER_BY_ID[id]) return
  const ctx = { type: 'detail', id }
  mountModal(
    modalShell(V.detailView(id), { wide: true, className: 'detail-modal' }),
    {},
    ctx
  )
  audio.play('click')
}

function openTeamEditor() {
  const ctx = { type: 'team' }
  mountModal(modalShell(V.teamEditorView(), { small: true, className: 'team-modal' }), {}, ctx)
  audio.play('click')
}

function openStage(stageId) {
  const stage = CAMPAIGN.find(s => s.id === Number(stageId))
  if (!stage) return
  const ctx = { type: 'stage', stageId: stage.id }
  mountModal(modalShell(V.stagePreviewView(stage), { small: true, className: 'stage-modal' }), {}, ctx)
  audio.play('click')
}

/* ── merge flow ──────────────────────────────────────────────────────────── */

function mergeTargetOf(info) {
  return info.to || info.from
}

async function performMerge() {
  if (busy) return
  const id = V.viewState.mergeId
  if (!id || !S.canMerge(id)) {
    toast('That pair is not ready to merge.', { type: 'red', iconName: 'info' })
    audio.play('error')
    return
  }
  busy = true
  const lab = document.querySelector('.merge-lab')
  if (lab) lab.classList.add('merging')
  audio.play('merge')
  await sleep(760)

  const result = S.merge(id)
  busy = false
  if (!result.ok) {
    toast(result.reason || 'The merge failed.', { type: 'red', iconName: 'info' })
    audio.play('error')
    render('merge', { scroll: false })
    return
  }

  updateShell()
  bumpWallet('coin-pill')
  const target = mergeTargetOf(result.info)
  const remaining = S.mergeable()
  V.viewState.mergeId = remaining.find(m => m.id === target.id)?.id || remaining[0]?.id || null
  render('merge', { scroll: false })
  audio.play('evolve')
  showMergeReveal(result.info)
}

function showMergeReveal(info) {
  const target = mergeTargetOf(info)
  const st = S.stack(target.id)
  const evolve = info.kind === 'evolve'
  const next = nextEvolution(target)
  const el = ELEMENTS[target.element]

  const html = `<div class="summon-card revealed" style="${elementVars(target.element)}">
    <div class="reward-rays"></div>
    <button class="modal-close reward-close" data-action="close-modal" aria-label="Close">${icons.x}</button>
    <div class="reward-kicker">${evolve ? 'Evolution complete' : 'Star ascension'}</div>
    <div class="summon-stage" style="height:214px">
      <div class="summon-reveal"><div class="sr-inner">${monsterArt(target)}</div></div>
    </div>
    <div class="summon-title">${esc(target.name)}</div>
    <p class="summon-sub">${evolve ? `Stage ${target.stage} of 4 • ${esc(el.name)} lineage` : `${esc(el.name)} lineage • final form`}</p>
    <div class="summon-rarity">
      <span class="chip gold">Lv ${st.level}</span>
      <span class="chip">${fmt(S.power(target.id))} PWR</span>
      <span class="chip purple">${stars(st.stars, 5)}</span>
    </div>
    <div class="reward-grid" style="margin-top:14px">
      <div class="reward-item"><span class="ri-icon">${icons.paw}</span><span class="ri-copy"><span>Collection</span><b>${st.count} owned</b></span></div>
      <div class="reward-item"><span class="ri-icon">${icons.spark}</span><span class="ri-copy"><span>Next</span><b>${next ? esc(next.name) : 'Star ranks'}</b></span></div>
    </div>
    <button class="btn btn-gold" data-action="close-modal">Continue</button>
  </div>`

  mountModal(html, {}, { type: 'reveal' })
  setTimeout(() => {
    const art = document.querySelector('#modal-root .summon-card.revealed .sr-inner')
    if (art) burstElement(art, { rays: true, count: 30 })
    confetti({ count: 26 })
  }, 80)
}

function performAutoMerge() {
  if (busy) return
  const ready = S.mergeable()
  if (!ready.length) {
    toast('No matching pairs are ready yet.', { type: 'icon', iconName: 'info' })
    audio.play('error')
    return
  }
  audio.play('merge')
  const log = S.autoMerge()
  if (!log.length) return
  updateShell()
  bumpWallet('coin-pill')
  const remaining = S.mergeable()
  V.viewState.mergeId = remaining[0]?.id || null
  render('merge', { scroll: false })
  audio.play('evolve')
  showAutoMerge(log)
  setTimeout(() => confetti({ count: 34 }), 100)
}

function showAutoMerge(log) {
  const items = log.map((info, index) => {
    const target = mergeTargetOf(info)
    const evolved = info.kind === 'evolve'
    return `<div class="reward-item" style="${elementVars(target.element)};animation-delay:${index * 0.04}s">
      <span class="ri-icon" style="background:color-mix(in srgb, var(--el) 12%, transparent)">${monsterArt(target, { decorative: true })}</span>
      <span class="ri-copy"><span>${evolved ? 'Evolved' : 'Star rank'}</span><b>${esc(target.name)}${evolved ? '' : ' ★'}</b></span>
    </div>`
  }).join('')

  const html = `<div class="reward-card">
    <div class="reward-rays"></div>
    <button class="modal-close reward-close" data-action="close-modal" aria-label="Close">${icons.x}</button>
    <div class="reward-kicker">Auto merge complete</div>
    <div class="reward-title">Fused!</div>
    <p class="reward-sub">${log.length} merge${log.length === 1 ? '' : 's'} completed. Your strongest forms are waiting.</p>
    <div class="reward-grid" style="margin-top:16px">${items}</div>
    <div class="reward-actions">
      <button class="btn btn-gold" data-action="close-modal">Continue</button>
    </div>
  </div>`

  mountModal(html, {}, { type: 'auto-merge' })
}

/* ── training + team ─────────────────────────────────────────────────────── */

function trainMonster(id) {
  const m = MONSTER_BY_ID[id]
  if (!m) return
  const result = S.train(id)
  if (!result.ok) {
    toast(result.reason || 'Training failed.', { type: 'red', iconName: 'info' })
    audio.play('error')
    return
  }
  updateShell()
  bumpWallet('coin-pill')
  audio.play(result.levels ? 'levelup' : 'coin')
  toast(
    result.levels
      ? `${esc(m.name)} reached Lv ${result.level}!`
      : `${esc(m.name)} gained XP.`,
    { type: result.levels ? 'gold' : '', iconName: result.levels ? 'chart' : 'bolt' }
  )
  refreshModal()
  if (modalContext?.type !== 'detail') render(currentView, { scroll: false })
}

function toggleTeam(id) {
  const result = S.toggleTeam(id)
  if (!result.ok) {
    toast(result.reason, { type: 'red', iconName: 'info' })
    audio.play('error')
    return
  }
  updateShell()
  refreshModal()
  render(currentView, { scroll: false })
  audio.play('click')
}

/* ── battle ──────────────────────────────────────────────────────────────── */

function startBattleAction(stageId) {
  const stage = CAMPAIGN.find(s => s.id === Number(stageId))
  if (!stage) {
    toast('That stage could not be found.', { type: 'red', iconName: 'info' })
    return
  }
  if (!S.isUnlocked(stage.id)) {
    toast('Clear the previous stage first.', { type: 'red', iconName: 'lock' })
    audio.play('error')
    return
  }
  closeModal(false)
  navigate('battle', { scroll: false })
  audio.play('click')
  startBattle(stage.id, {
    onVictory: (rewards, clearedStage) => {
      updateShell()
      bumpWallet('coin-pill')
      bumpWallet('gem-pill')
      render('battle', { scroll: false })
      showBattleRewards(rewards, clearedStage)
    },
    onExit: () => {
      updateShell()
      render('battle', { scroll: false })
    }
  })
}

function showBattleRewards(rewards, stage) {
  const egg = rewards.egg
  const levelUps = Object.entries(rewards.levels || {}).map(([id, result]) => {
    const m = MONSTER_BY_ID[id]
    return m ? `${esc(m.name)} Lv ${result.level}` : ''
  }).filter(Boolean)

  const eggHtml = egg ? `<div class="reward-egg" style="${elementVars(egg.monster.element)}">
      <span class="re-art">${monsterArt(egg.monster, { decorative: true })}</span>
      <span class="re-copy">
        <span>Egg hatched</span>
        <b>${esc(egg.monster.name)}</b>
        <small>Stage ${egg.stage} • ${egg.isNew ? 'New species discovered!' : 'Duplicate added to collection'}</small>
      </span>
    </div>` : ''

  const html = `<div class="reward-card">
    <div class="reward-rays"></div>
    <button class="modal-close reward-close" data-action="close-modal" aria-label="Close">${icons.x}</button>
    <div class="reward-kicker">${rewards.first ? 'First clear' : 'Victory rewards'}</div>
    <div class="reward-title">${rewards.first ? 'Cleared!' : 'Victory!'}</div>
    <p class="reward-sub">${esc(stage.name)} • ${rewards.first ? 'A new path opens.' : 'Replay reward earned.'}</p>
    <div class="reward-grid">
      <div class="reward-item"><span class="ri-icon"><span class="coin-icon"></span></span><span class="ri-copy"><span>Coins</span><b>+${fmt(rewards.coins)}</b></span></div>
      <div class="reward-item"><span class="ri-icon"><span class="gem-icon"></span></span><span class="ri-copy"><span>Gems</span><b>+${fmt(rewards.gems)}</b></span></div>
      <div class="reward-item"><span class="ri-icon">${icons.bolt}</span><span class="ri-copy"><span>Team XP</span><b>+${fmt(rewards.xp)}</b></span></div>
      <div class="reward-item"><span class="ri-icon">${icons.egg}</span><span class="ri-copy"><span>Egg</span><b>${egg ? esc(egg.monster.name) : 'Replay bonus'}</b></span></div>
    </div>
    ${eggHtml}
    ${levelUps.length ? `<div class="levelup-note">Level up: ${levelUps.join(' • ')}</div>` : ''}
    <div class="reward-actions">
      <button class="btn btn-ghost" data-action="start-battle" data-stage="${stage.id}">Fight again</button>
      <button class="btn btn-gold" data-action="close-modal">Continue</button>
    </div>
  </div>`

  mountModal(html, {}, { type: 'reward' })
  audio.play('reward')
  setTimeout(() => {
    confetti({ count: 34 })
    const art = document.querySelector('#modal-root .reward-egg .re-art')
    if (art) burstElement(art, { rays: false, count: 16 })
  }, 90)
}

/* ── nest / rewards ──────────────────────────────────────────────────────── */

function buyEgg(eggId) {
  const egg = EGGS[eggId]
  if (!egg) return
  const result = S.summonEgg(eggId)
  if (!result.ok) {
    toast(result.reason || 'The egg would not hatch.', { type: 'red', iconName: 'info' })
    audio.play('error')
    return
  }
  updateShell()
  bumpWallet(egg.currency === 'coins' ? 'coin-pill' : 'gem-pill')
  render(currentView, { scroll: false })
  showSummon(egg, result)
}

function showSummon(egg, result) {
  const m = result.monster
  const el = ELEMENTS[m.element]
  const html = `<div class="summon-card" data-summon-card style="${elementVars(m.element)}">
    <div class="reward-rays"></div>
    <button class="modal-close reward-close" data-action="close-modal" aria-label="Close">${icons.x}</button>
    <div class="reward-kicker" style="display:block;text-align:center">A new arrival</div>
    <div class="summon-stage">
      <div class="summon-egg">${eggArt(egg.color)}</div>
      <div class="summon-reveal"><div class="sr-inner">${monsterArt(m)}</div></div>
    </div>
    <div class="summon-title" data-summon-title>Cracking…</div>
    <p class="summon-sub" data-summon-sub>${esc(egg.name)} glows in the nest.</p>
    <div class="summon-rarity" data-summon-rarity></div>
    <button class="btn btn-gold" data-summon-btn disabled>Hatching…</button>
  </div>`

  const wrap = mountModal(html, {}, { type: 'summon' })
  const card = wrap.querySelector('[data-summon-card]')
  audio.play('summon')

  setTimeout(() => {
    if (!card) return
    card.classList.add('cracking')
    audio.play('crack')
    const stageEl = card.querySelector('.summon-stage')
    if (stageEl) burstElement(stageEl, { rays: false, count: 18 })
  }, 780)

  setTimeout(() => {
    if (!card) return
    card.classList.add('revealed')
    const title = card.querySelector('[data-summon-title]')
    const sub = card.querySelector('[data-summon-sub]')
    const rarity = card.querySelector('[data-summon-rarity]')
    const btn = card.querySelector('[data-summon-btn]')
    if (title) title.textContent = m.name
    if (sub) sub.textContent = `Stage ${result.stage} • ${el.name} lineage • ${result.isNew ? 'New species discovered!' : 'Duplicate added to your collection'}`
    if (rarity) rarity.innerHTML = `<span class="chip gold">${fmt(S.power(m.id))} PWR</span><span class="chip">${result.isNew ? 'NEW' : '×' + S.stack(m.id).count + ' owned'}</span>`
    if (btn) {
      btn.disabled = false
      btn.dataset.action = 'close-modal'
      btn.textContent = result.isNew ? 'Welcome to the grove' : 'Add to collection'
    }
    audio.play(result.isNew ? 'evolve' : 'reward')
    const art = card.querySelector('.sr-inner')
    if (art) burstElement(art, { rays: true, count: 28 })
    confetti({ count: 26 })
  }, 1900)
}

function claimDaily() {
  const result = S.claimDaily()
  if (!result.ok) {
    toast(result.reason, { type: 'red', iconName: 'info' })
    audio.play('error')
    return
  }
  updateShell()
  bumpWallet('coin-pill')
  bumpWallet('gem-pill')
  render(currentView, { scroll: false })
  audio.play('reward')
  toast(`Daily gift collected — +${result.coins} coins and +${result.gems} gems!`, { type: 'gold', iconName: 'gift' })
  setTimeout(() => {
    const pill = document.getElementById('coin-pill')
    if (pill) burstElement(pill, { rays: false, count: 14 })
  }, 40)
}

/* ── help / settings ─────────────────────────────────────────────────────── */

function helpInner() {
  const sound = S.state.settings.sound
  const auto = S.state.settings.autoBattle
  return `<div class="modal-pad">
    <div class="modal-head">
      <span class="eyebrow">Field guide</span>
      <h2 class="modal-title">How to play</h2>
      <p class="modal-sub">Grow a squad, fuse matching monsters, and climb the Evolution Trail.</p>
    </div>
    <div class="howto">
      <div class="how-step"><span class="hs-num">1</span><div><h3>Collect monsters</h3><p>Win battles, claim first-clear eggs and hatch new species in the Nest. All twenty creatures belong to five four-stage evolution lines.</p></div></div>
      <div class="how-step"><span class="hs-num">2</span><div><h3>Merge matching pairs</h3><p>Two copies of the same monster fuse in the Merge Lab. Stages 1–3 evolve into the next species; stage 4 gains a permanent star rank.</p></div></div>
      <div class="how-step"><span class="hs-num">3</span><div><h3>Build the right squad</h3><p>Pick up to three fighters. Speed sets turn order, elements deal bonus damage, and every monster has a unique cooldown ability.</p></div></div>
      <div class="how-step"><span class="hs-num">4</span><div><h3>Climb the trail</h3><p>Clear twelve stages and four bosses. Use Strike, your ability and Guard — or switch on AUTO and watch the squad fight.</p></div></div>
    </div>
    <div class="rules-grid">
      <span class="rule-pill" style="color:${ELEMENTS.ember.color}">${elementGlyph('flame')} Ember beats Verdant</span>
      <span class="rule-pill" style="color:${ELEMENTS.verdant.color}">${elementGlyph('leaf')} Verdant beats Storm</span>
      <span class="rule-pill" style="color:${ELEMENTS.storm.color}">${elementGlyph('bolt')} Storm beats Tide</span>
      <span class="rule-pill" style="color:${ELEMENTS.tide.color}">${elementGlyph('drop')} Tide beats Ember</span>
    </div>
    <div class="settings-list">
      <button class="setting-row" data-action="toggle-sound">
        <span class="sr-copy"><b>Sound effects</b><span>Synthesized battle and merge audio</span></span>
        <span class="toggle ${sound ? 'on' : ''}" aria-hidden="true"></span>
      </button>
      <button class="setting-row" data-action="toggle-auto">
        <span class="sr-copy"><b>Auto battle</b><span>Start every battle with automatic turns</span></span>
        <span class="toggle ${auto ? 'on' : ''}" aria-hidden="true"></span>
      </button>
    </div>
    <button class="btn btn-ghost" data-action="reset-progress" style="width:100%;margin-top:14px">Reset all progress</button>
    <div class="row mt-16" style="justify-content:flex-end">
      <button class="btn btn-primary" data-action="close-modal">${icons.check} Got it</button>
    </div>
  </div>`
}

function openHelp() {
  const ctx = { type: 'help' }
  mountModal(modalShell(helpInner(), { small: true, className: 'help-modal' }), {}, ctx)
  audio.play('click')
}

function toggleSound() {
  const next = !S.state.settings.sound
  S.state.settings.sound = next
  audio.setMuted(!next)
  S.save()
  updateShell()
  refreshModal()
  if (next) setTimeout(() => audio.play('click'), 30)
  toast(next ? 'Sound effects on.' : 'Sound effects muted.', { iconName: next ? 'sound' : 'soundOff' })
}

function toggleAuto() {
  const next = !S.state.settings.autoBattle
  S.state.settings.autoBattle = next
  S.save()
  refreshModal()
  toast(next ? 'Battles will start in AUTO mode.' : 'AUTO battle disabled by default.', { iconName: 'bolt' })
  audio.play('click')
}

function confirmReset() {
  const html = `<div class="modal-pad">
    <div class="modal-head">
      <span class="eyebrow" style="color:var(--danger)">Danger zone</span>
      <h2 class="modal-title">Reset everything?</h2>
      <p class="modal-sub">This erases your collection, merges, coins, gems and adventure progress. It cannot be undone.</p>
    </div>
    <div class="reward-grid">
      <div class="reward-item"><span class="ri-icon">${icons.paw}</span><span class="ri-copy"><span>Codex</span><b>${S.collectionProgress().found} / ${MONSTERS.length}</b></span></div>
      <div class="reward-item"><span class="ri-icon">${icons.trophy}</span><span class="ri-copy"><span>Cleared</span><b>${S.state.progress.cleared.length} / ${CAMPAIGN.length}</b></span></div>
    </div>
    <div class="row mt-16" style="justify-content:flex-end;gap:8px">
      <button class="btn btn-ghost" data-action="close-modal">Keep my save</button>
      <button class="btn btn-danger" data-action="reset-confirm">${icons.refresh} Reset</button>
    </div>
  </div>`
  mountModal(modalShell(html, { small: true }), {}, { type: 'reset' })
  audio.play('back')
}

function doReset() {
  S.resetProgress()
  V.viewState.filter = 'all'
  V.viewState.mergeId = null
  audio.setMuted(!S.state.settings.sound)
  closeModal(false)
  updateShell()
  navigate('home', { replace: true })
  audio.play('unlock')
  toast('A fresh adventure begins. Welcome, Tamer!', { type: 'gold', iconName: 'spark' })
}

/* ── event wiring ────────────────────────────────────────────────────────── */

function onClick(event) {
  const viewEl = event.target.closest('[data-view]')
  if (viewEl && viewEl !== document.body && !viewEl.disabled) {
    closeModal(false)
    audio.play('click')
    navigate(viewEl.dataset.view)
    return
  }

  const actionEl = event.target.closest('[data-action]')
  if (!actionEl || actionEl.disabled) return

  const action = actionEl.dataset.action
  if (action !== 'toggle-sound' && action !== 'reset-confirm') audio.play('click')

  switch (action) {
    case 'close-modal':
      audio.play('back')
      closeModal()
      break
    case 'open-monster':
      openMonster(actionEl.dataset.monster)
      break
    case 'filter-collection':
      V.viewState.filter = actionEl.dataset.element || 'all'
      render('collection', { scroll: false })
      audio.play('click')
      break
    case 'go-merge':
      V.viewState.mergeId = actionEl.dataset.monster || null
      closeModal(false)
      navigate('merge')
      break
    case 'merge-select':
      V.viewState.mergeId = actionEl.dataset.monster || null
      render('merge', { scroll: false })
      break
    case 'do-merge':
      performMerge()
      break
    case 'auto-merge':
      performAutoMerge()
      break
    case 'train-monster':
      trainMonster(actionEl.dataset.monster)
      break
    case 'toggle-team':
    case 'team-toggle':
      toggleTeam(actionEl.dataset.monster)
      break
    case 'open-team-editor':
      openTeamEditor()
      break
    case 'start-battle':
      startBattleAction(actionEl.dataset.stage)
      break
    case 'open-stage':
      openStage(actionEl.dataset.stage)
      break
    case 'buy-egg':
      buyEgg(actionEl.dataset.egg)
      break
    case 'claim-daily':
      claimDaily()
      break
    case 'toggle-sound':
      toggleSound()
      break
    case 'toggle-auto':
      toggleAuto()
      break
    case 'reset-progress':
      confirmReset()
      break
    case 'reset-confirm':
      doReset()
      break
    default:
      break
  }
}

function onKeyDown(event) {
  if (event.key === 'Escape' && !document.querySelector('.battle-screen') && hasOverlay()) {
    audio.play('back')
    closeModal()
  }
}

/* ── ambient background ──────────────────────────────────────────────────── */

export function startAmbient() {
  const host = document.getElementById('world-motes')
  if (!host) return
  const colors = ['#8affd4', '#ffd166', '#8fe8ff', '#c58bff', '#ff91a9']
  const count = window.matchMedia('(max-width: 720px)').matches ? 16 : 30
  const frag = document.createDocumentFragment()
  for (let i = 0; i < count; i++) {
    const mote = document.createElement('span')
    mote.className = 'mote'
    mote.style.setProperty('--left', `${Math.random() * 100}%`)
    mote.style.setProperty('--dur', `${10 + Math.random() * 16}s`)
    mote.style.setProperty('--delay', `${-Math.random() * 22}s`)
    mote.style.setProperty('--mote-color', colors[i % colors.length])
    if (Math.random() > 0.72) {
      mote.style.width = '6px'
      mote.style.height = '6px'
    }
    frag.appendChild(mote)
  }
  host.appendChild(frag)
}

/* ── boot ────────────────────────────────────────────────────────────────── */

export function init() {
  if (initialized) return
  initialized = true
  S.load()
  audio.setMuted(!S.state.settings.sound)
  startAmbient()

  if (!location.hash) history.replaceState({ view: routeFromHash() }, '', `#/${routeFromHash()}`)
  render(routeFromHash(), { scroll: false })
  updateShell()

  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('popstate', onPopState)

  document.getElementById('sound-btn')?.addEventListener('click', event => {
    event.stopPropagation()
    toggleSound()
  })
  document.getElementById('help-btn')?.addEventListener('click', event => {
    event.stopPropagation()
    openHelp()
  })

  // Small debug surface for the playground capture harness.
  window.__MM__ = {
    state: S.state,
    get view() { return currentView },
    navigate,
    render: () => render(currentView, { scroll: false }),
    merge: performMerge,
    autoMerge: performAutoMerge,
    summon: buyEgg,
    battle: startBattleAction,
    openMonster,
    reset: doReset
  }

  // Let the wallet settle if a save was loaded with large values.
  setTimeout(updateShell, 60)
}
