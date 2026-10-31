// MONSTER MERGE — turn-based battle engine and arena UI.
import {
  CAMPAIGN, MONSTER_BY_ID, ELEMENTS, STRONG_AGAINST,
  statsFor, powerOf
} from './data.js'
import * as S from './state.js'
import { audio } from './audio.js'
import {
  monsterArt, elementGlyph, icon, icons, esc, sleep, burstAt, confetti, toast
} from './dom.js'

let activeBattle = null

export function enemyPowerFor(stage) {
  return Math.round(stage.enemies.reduce((sum, e) => {
    const m = MONSTER_BY_ID[e.species]
    return sum + powerOf(m, e.level) * (e.boss ? 1.18 : 1)
  }, 0))
}

const uid = (() => { let n = 0; return prefix => `${prefix}${++n}` })()

function makeUnit({ species, level, stars = 0, side, slot, boss = false }) {
  let stats = statsFor(species, level, stars)
  if (boss) stats = { hp: Math.round(stats.hp * 1.28), atk: Math.round(stats.atk * 1.16), def: Math.round(stats.def * 1.12), spd: Math.round(stats.spd * 1.06) }
  return {
    uid: uid(side === 'player' ? 'p' : 'e'),
    species, level, stars, side, slot, boss,
    maxHp: stats.hp,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    shield: 0,
    shieldTurns: 0,
    statuses: {},
    abilityCd: 0,
    alive: true
  }
}

function statusActive(unit, type) { return Boolean(unit.statuses[type]) }

function effectiveAtk(unit) {
  const down = unit.statuses.atkDown
  return unit.atk * (1 - (down ? down.potency : 0))
}

function effectiveSpd(unit) {
  const up = unit.statuses.spdUp
  return unit.spd * (1 + (up ? up.potency : 0)) + Math.random() * 2.5
}

function elementMult(attacker, defender) {
  const a = attacker.species.element
  const d = defender.species.element
  if (STRONG_AGAINST[a] === d) return 1.3
  if (STRONG_AGAINST[d] === a) return 0.82
  return 1
}

function hpClass(pct) {
  if (pct <= 25) return 'low'
  if (pct <= 50) return 'warn'
  return ''
}

function unitEl(u) {
  return document.querySelector(`.battle-unit[data-uid="${u.uid}"]`)
}

function unitArtEl(u) {
  return document.querySelector(`.battle-unit[data-uid="${u.uid}"] .unit-art`)
}

function floatText(u, text, cls = '') {
  const el = unitEl(u)
  if (!el) return
  const layer = el.querySelector('.dmg-layer')
  if (!layer) return
  const node = document.createElement('div')
  node.className = `dmg-float ${cls}`
  node.textContent = text
  layer.appendChild(node)
  setTimeout(() => node.remove(), 1150)
}

function burstOn(u, color, count = 16, rays = false) {
  const el = unitArtEl(u)
  if (!el) return
  const rect = el.getBoundingClientRect()
  burstAt(rect.left + rect.width / 2, rect.top + rect.height * 0.45, { count, burst: true, colors: [color, '#fff6d1', color], spread: Math.max(55, rect.width * 0.55), rays })
}

function setUnitClass(u, cls, ms = 450) {
  const el = unitEl(u)
  if (!el) return
  el.classList.add(cls)
  setTimeout(() => el.classList.remove(cls), ms)
}

function updateUnitDOM(u) {
  const el = unitEl(u)
  if (!el) return
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100))
  const fill = el.querySelector('.hp-track i')
  if (fill) {
    fill.style.width = pct + '%'
    fill.className = hpClass(pct)
  }
  const txt = el.querySelector('.hp-text')
  if (txt) txt.textContent = `${Math.max(0, Math.ceil(u.hp))} / ${u.maxHp}`
  el.classList.toggle('ko', !u.alive)
  el.classList.toggle('has-shield', u.shield > 0)
  el.classList.toggle('stunned', Boolean(u.statuses.stun))
  const holder = el.querySelector('.unit-statuses')
  if (holder) {
    const order = ['burn', 'poison', 'stun', 'atkDown', 'spdUp', 'curse']
    holder.innerHTML = order.filter(t => u.statuses[t]).map(t => {
      const glyphs = { burn: '🔥', poison: '☠', stun: '⚡', atkDown: '▼', spdUp: '▲', curse: '✹' }
      const labels = { burn: 'Burning', poison: 'Poisoned', stun: 'Stunned', atkDown: 'Attack down', spdUp: 'Speed up', curse: 'Cursed' }
      const cls = { burn: 'burn', poison: 'poison', stun: 'stun', atkDown: 'atkdown', spdUp: 'spdup', curse: 'curse' }[t]
      return `<span class="status-chip ${cls}" title="${labels[t]}" aria-label="${labels[t]}">${glyphs[t]}</span>`
    }).join('')
  }
}

function buildScreen(stage, players, enemies) {
  const theme = stage.theme || 'glade'
  const orbs = Array.from({ length: 10 }, () => {
    const left = 4 + Math.random() * 92
    const dur = 11 + Math.random() * 12
    const delay = -Math.random() * 18
    return `<span class="arena-orb" style="--l:${left}%;--dur:${dur}s;--d:${delay}s"></span>`
  }).join('')
  const unitHtml = u => {
    const el = ELEMENTS[u.species.element]
    const statuses = ''
    return `<div class="battle-unit ${u.side} ${u.boss ? 'boss' : ''}" data-uid="${u.uid}" style="--el:${el.color};--el-deep:${el.deep}">
      <div class="unit-meta">
        <span class="unit-name">${esc(u.species.name)}${u.boss ? ' ♛' : ''}</span>
        <span class="unit-lv">Lv ${u.level}</span>
      </div>
      <div class="unit-visual">
        <div class="unit-ground"></div>
        <div class="unit-art">${monsterArt(u.species, { decorative: true })}</div>
        <div class="unit-ring"></div>
        <div class="shield-bubble"></div>
        <div class="unit-statuses">${statuses}</div>
        <div class="dmg-layer"></div>
      </div>
      <div class="unit-hp">
        <div class="hp-track"><i style="width:100%"></i><span class="hp-text">${u.hp} / ${u.maxHp}</span></div>
      </div>
    </div>`
  }
  return `<div class="battle-screen theme-${theme}" id="battle-screen">
    <div class="arena-bg" aria-hidden="true">
      <div class="arena-sun"></div>
      <div class="arena-hill hill-back"></div>
      <div class="arena-hill hill-mid"></div>
      <div class="arena-hill hill-front"></div>
      <div class="arena-platform"></div>
      ${orbs}
    </div>
    <header class="battle-topbar">
      <button class="b-exit" data-b-exit aria-label="Retreat from battle">${icons.x}</button>
      <div class="b-stage-info">
        <span>Stage ${String(stage.id).padStart(2, '0')}${stage.boss ? ' • Boss' : ''}</span>
        <b>${esc(stage.name)}</b>
      </div>
      <div class="b-round"><span>ROUND</span><b data-round>1</b></div>
      <button class="battle-auto" data-b-auto aria-label="Toggle auto battle">AUTO</button>
    </header>
    <div class="battle-field">
      <div class="battle-row enemy-row">${enemies.map(unitHtml).join('')}</div>
      <div class="battle-center">
        <span class="turn-label">Turn order</span>
        <div class="turn-queue" data-queue></div>
        <div class="battle-message" data-message>${esc(stage.name)} • ${enemies.length} foes await</div>
      </div>
      <div class="battle-row player-row">${players.map(unitHtml).join('')}</div>
      <div class="battle-start-banner" data-banner>BATTLE START</div>
      <div class="battle-intro">
        <div class="battle-intro-card">
          <div class="bi-kicker">${stage.boss ? 'Boss Encounter' : 'Wild Encounter'}</div>
          <h2>${esc(stage.name)}</h2>
          <p>${esc(stage.subtitle || '')}</p>
          <div class="bi-vs">
            ${monsterArt(players[0].species, { decorative: true })}
            <span>VS</span>
            ${monsterArt(enemies[0].species, { decorative: true })}
          </div>
          <div class="bi-rec">
            <span class="chip green">${elementGlyph('bolt')} ${S.powerLabel(S.teamPower())} power</span>
            <span class="chip">${enemies.length} foes</span>
            ${stage.enemies.some(e => e.boss) ? '<span class="chip red">Boss</span>' : ''}
          </div>
          <button class="btn btn-primary btn-lg" data-b-begin style="margin-top:18px">${icons.sword.replace('<svg', '<svg style="width:18px;height:18px"')} Begin Battle</button>
        </div>
      </div>
    </div>
    <div class="battle-actions">
      <div class="action-inner" data-actions></div>
    </div>
  </div>`
}

function actionBarHtml(battle, active) {
  if (battle.phase !== 'player' || battle.ended) {
    const ending = battle.phase === 'ended'
    return `<div class="action-head">
        <span class="action-hint ${active && active.side === 'enemy' ? 'enemy' : ''}">${ending ? 'Battle over' : active && active.side === 'enemy' ? `<b>${esc(active.species.name)}</b> is taking its turn…` : 'Preparing the next turn…'}</span>
      </div>
      <div class="action-buttons">
        <button class="action-btn attack" disabled><span class="ab-icon">${icons.sword}</span><span class="ab-copy"><span class="ab-title">Strike</span><span class="ab-sub">Basic attack</span></span></button>
        <button class="action-btn ability" disabled><span class="ab-icon">${icon('spark')}</span><span class="ab-copy"><span class="ab-title">Ability</span><span class="ab-sub">On cooldown</span></span></button>
        <button class="action-btn guard" disabled><span class="ab-icon">${icons.shield}</span><span class="ab-copy"><span class="ab-title">Guard</span><span class="ab-sub">Brace</span></span></button>
      </div>`
  }
  const u = active
  const ability = u.species.ability
  const ready = u.abilityCd <= 0
  const el = ELEMENTS[u.species.element]
  const target = battle.targetUid ? battle.units.find(x => x.uid === battle.targetUid) : null
  const targetLabel = ability.target === 'all' ? 'All foes' : target ? target.species.name : 'Choose a foe'
  return `<div class="action-head">
      <span class="action-hint">Your turn • <b>${esc(u.species.name)}</b> • ${targetLabel}</span>
      <span class="action-cd-note">${ability.target === 'all' ? 'Hits every foe' : 'Tap a foe to target'}</span>
    </div>
    <div class="action-buttons">
      <button class="action-btn attack" data-b-action="strike">
        <span class="ab-icon">${icons.sword}</span>
        <span class="ab-copy"><span class="ab-title">Strike</span><span class="ab-sub">100% • no cooldown</span></span>
      </button>
      <button class="action-btn ability ${ready ? 'ready' : ''}" data-b-action="ability" ${ready ? '' : 'disabled'} style="--ability-color:${el.color}">
        <span class="ab-icon">${elementGlyph(el.glyph)}</span>
        <span class="ab-copy"><span class="ab-title">${esc(ability.name)}</span><span class="ab-sub">${ability.target === 'all' ? 'All foes' : ability.target === 'team' ? 'Your team' : `${Math.round(ability.power * 100)}% power`} • CD ${ability.cooldown}</span></span>
        ${ready ? '' : `<span class="cd-badge">${u.abilityCd} turn${u.abilityCd > 1 ? 's' : ''}</span>`}
      </button>
      <button class="action-btn guard" data-b-action="guard">
        <span class="ab-icon">${icons.shield}</span>
        <span class="ab-copy"><span class="ab-title">Guard</span><span class="ab-sub">Shield + CD -1</span></span>
      </button>
    </div>
    <div class="battle-tip">Tip: <b>Guard</b> absorbs damage and speeds up your ability cooldown.</div>`
}

export function startBattle(stageId, { onVictory = () => {}, onExit = () => {} } = {}) {
  if (activeBattle) activeBattle.destroy()
  const stage = CAMPAIGN.find(s => s.id === stageId)
  if (!stage) return toast('That stage could not be found.', { type: 'red', iconName: 'info' })
  S.repairTeam()
  const team = S.state.team.filter(id => S.isOwned(id))
  if (!team.length) return toast('Add a monster to your squad first.', { type: 'red', iconName: 'power' })

  const players = team.map((id, i) => {
    const st = S.stack(id)
    return makeUnit({ species: MONSTER_BY_ID[id], level: st.level, stars: st.stars, side: 'player', slot: i })
  })
  const enemies = stage.enemies.map((e, i) => makeUnit({
    species: MONSTER_BY_ID[e.species], level: e.level, side: 'enemy', slot: i, boss: Boolean(e.boss)
  }))

  const battle = {
    stage, players, enemies, units: [...players, ...enemies],
    round: 1, queue: [], activeIndex: 0, active: null,
    phase: 'intro', ended: false, auto: S.state.settings.autoBattle,
    targetUid: null, resolveAction: null, autoTimer: null,
    log: [], onVictory, onExit, destroyed: false, defeatRecorded: false
  }
  activeBattle = battle

  const wrap = document.createElement('div')
  wrap.innerHTML = buildScreen(stage, players, enemies)
  const screen = wrap.firstElementChild
  document.body.appendChild(screen)

  const state = {
    get phase() { return battle.phase }
  }

  const q = sel => screen.querySelector(sel)

  function renderQueue() {
    const holder = q('[data-queue]')
    if (!holder) return
    const upcoming = []
    for (let i = battle.activeIndex; i < battle.queue.length; i++) {
      const u = battle.queue[i]
      if (u && u.alive) upcoming.push(u)
    }
    if (!upcoming.length) upcoming.push(...battle.units.filter(u => u.alive))
    holder.innerHTML = upcoming.slice(0, 6).map((u, i) => `<div class="turn-portrait ${u.side === 'enemy' ? 'enemy' : ''} ${i === 0 ? 'current' : ''} ${u.alive ? '' : 'dead'}" title="${esc(u.species.name)}">${monsterArt(u.species, { decorative: true })}</div>`).join('')
  }

  function setActive(unit) {
    battle.active = unit
    screen.querySelectorAll('.battle-unit').forEach(el => el.classList.toggle('is-active', el.dataset.uid === unit?.uid))
    renderQueue()
  }

  function setMessage(html, enemy = false) {
    const el = q('[data-message]')
    if (!el) return
    el.innerHTML = html
    el.classList.toggle('enemy', enemy)
  }

  function renderActions() {
    const holder = q('[data-actions]')
    if (!holder) return
    holder.innerHTML = actionBarHtml(battle, battle.active)
    screen.classList.toggle('player-turn', battle.phase === 'player')
    screen.querySelectorAll('.battle-unit.targetable').forEach(el => el.classList.remove('targetable'))
    if (battle.phase === 'player' && battle.active) {
      screen.querySelectorAll('.battle-unit.enemy:not(.ko)').forEach(el => el.classList.add('targetable'))
      updateTargetHighlight()
    }
  }

  function updateTargetHighlight() {
    screen.querySelectorAll('.battle-unit').forEach(el => {
      el.classList.toggle('targeted', el.dataset.uid === battle.targetUid && battle.phase === 'player')
    })
  }

  function pickDefaultTarget() {
    const alive = battle.enemies.filter(u => u.alive)
    const current = alive.find(u => u.uid === battle.targetUid)
    if (current) return current
    const target = alive.sort((a, b) => a.hp - b.hp)[0] || null
    battle.targetUid = target?.uid || null
    return target
  }

  function setAutoButton() {
    const btn = q('[data-b-auto]')
    if (!btn) return
    btn.classList.toggle('on', battle.auto)
    btn.textContent = battle.auto ? 'AUTO ON' : 'AUTO'
  }

  function clearAuto() {
    if (battle.autoTimer) clearTimeout(battle.autoTimer)
    battle.autoTimer = null
  }

  function scheduleAuto() {
    clearAuto()
    if (!battle.auto || battle.phase !== 'player' || battle.ended) return
    battle.autoTimer = setTimeout(() => {
      if (battle.phase !== 'player' || battle.ended) return
      const unit = battle.active
      const ability = unit.species.ability
      pickDefaultTarget()
      const useAbility = unit.abilityCd <= 0 && Math.random() < 0.78
      resolvePlayerAction(useAbility ? 'ability' : 'strike')
    }, 650)
  }

  function resolvePlayerAction(kind) {
    if (battle.phase !== 'player' || battle.ended) return
    const unit = battle.active
    if (!unit || unit.side !== 'player') return
    if (kind === 'ability' && unit.abilityCd > 0) {
      audio.play('error')
      return
    }
    if (kind !== 'guard') {
      const target = pickDefaultTarget()
      if (!target) return
      battle.targetUid = target.uid
    }
    battle.phase = 'busy'
    renderActions()
    const resolve = battle.resolveAction
    battle.resolveAction = null
    if (resolve) resolve({ kind })
  }

  async function applyDamage(source, target, amount, { crit = false, isDot = false, dotType = '', bypassShield = false, element = true } = {}) {
    if (!target.alive) return 0
    let dmg = Math.max(1, Math.round(amount))
    if (target.shield > 0 && !bypassShield) {
      const absorbed = Math.min(target.shield, dmg)
      target.shield -= absorbed
      dmg -= absorbed
      if (absorbed > 0) floatText(target, `⛨ ${absorbed}`, 'shield')
      if (target.shield <= 0) {
        target.shield = 0
        target.shieldTurns = 0
      }
    }
    if (dmg <= 0) {
      updateUnitDOM(target)
      return 0
    }
    target.hp = Math.max(0, target.hp - dmg)
    floatText(target, `-${dmg}${crit ? '!' : ''}`, crit ? 'crit' : dotType ? 'status' : '')
    setUnitClass(target, 'hit', 420)
    burstOn(target, dotType === 'burn' ? '#ff8a4a' : dotType === 'poison' ? '#8be26f' : crit ? '#ffd166' : '#ff91a9', crit ? 24 : 14)
    if (element) audio.play(crit ? 'crit' : 'hit')
    updateUnitDOM(target)
    if (target.hp <= 0) {
      target.alive = false
      audio.play('ko')
      setMessage(`<b>${esc(target.species.name)}</b> is knocked out!`, target.side === 'player')
      setTimeout(() => {
        const el = unitEl(target)
        if (el) el.classList.add('ko')
        renderQueue()
      }, 340)
    }
    return dmg
  }

  function healUnit(target, amount, sourceName = '') {
    if (!target.alive) return
    const heal = Math.max(1, Math.round(amount))
    target.hp = Math.min(target.maxHp, target.hp + heal)
    floatText(target, `+${heal}`, 'heal')
    setUnitClass(target, 'heal', 600)
    burstOn(target, '#75f2bb', 18)
    audio.play('heal')
    updateUnitDOM(target)
  }

  function applyEffect(target, effect, source) {
    if (!target.alive) return
    switch (effect.type) {
      case 'burn':
      case 'poison':
        target.statuses[effect.type] = {
          turns: effect.turns || 2,
          potency: Math.max(2, Math.round(effectiveAtk(source) * (effect.potency || 0.2)))
        }
        floatText(target, effect.type === 'burn' ? 'BURN' : 'POISON', 'status')
        audio.play(effect.type)
        break
      case 'stun':
        if (Math.random() < (effect.chance ?? 1)) {
          target.statuses.stun = { turns: effect.turns || 1 }
          floatText(target, 'STUN', 'status')
          audio.play('stun')
        }
        break
      case 'atkDown':
        target.statuses.atkDown = { turns: effect.turns || 2, potency: effect.potency || 0.2 }
        floatText(target, 'ATK ▼', 'status')
        break
      case 'curse':
        target.statuses.curse = { turns: effect.turns || 2, potency: effect.potency || 0.2 }
        floatText(target, 'CURSE', 'status')
        break
      case 'shieldSelf':
        target.shield += Math.round(target.maxHp * (effect.potency || 0.15))
        target.shieldTurns = Math.max(target.shieldTurns, effect.turns || 2)
        floatText(target, 'SHIELD', 'shield')
        audio.play('shield')
        break
      case 'shieldTeam':
        source.side === 'player' ? battle.players.forEach(a => { if (a.alive) { a.shield += Math.round(a.maxHp * (effect.potency || 0.12)); a.shieldTurns = Math.max(a.shieldTurns, effect.turns || 2) } }) : battle.enemies.forEach(a => { if (a.alive) { a.shield += Math.round(a.maxHp * (effect.potency || 0.12)); a.shieldTurns = Math.max(a.shieldTurns, effect.turns || 2) } })
        battle.units.forEach(u => { if (u.alive) { floatText(u, 'SHIELD', 'shield'); updateUnitDOM(u) } })
        audio.play('shield')
        break
      case 'healTeam': {
        const allies = source.side === 'player' ? battle.players : battle.enemies
        allies.forEach(a => { if (a.alive) healUnit(a, a.maxHp * (effect.potency || 0.1)) })
        break
      }
      case 'cleanseTeam': {
        const allies = source.side === 'player' ? battle.players : battle.enemies
        allies.forEach(a => {
          if (!a.alive) return
          for (const key of ['burn', 'poison', 'stun', 'curse', 'atkDown']) delete a.statuses[key]
          floatText(a, 'CLEANSE', 'heal')
          updateUnitDOM(a)
        })
        audio.play('heal')
        break
      }
      case 'spdUpTeam': {
        const allies = source.side === 'player' ? battle.players : battle.enemies
        allies.forEach(a => { if (a.alive) a.statuses.spdUp = { turns: effect.turns || 3, potency: effect.potency || 0.2 } })
        audio.play('magic')
        break
      }
    }
  }

  function chanceCrit(extra = 0) { return Math.random() < 0.1 + extra }

  async function doAction(unit, action) {
    if (battle.ended) return
    clearAuto()
    const ability = unit.species.ability
    const isPlayer = unit.side === 'player'
    const foes = isPlayer ? battle.enemies : battle.players
    const allies = isPlayer ? battle.players : battle.enemies

    if (action.kind === 'guard') {
      const shield = Math.round(unit.maxHp * 0.18)
      unit.shield += shield
      unit.shieldTurns = Math.max(unit.shieldTurns, 2)
      if (unit.abilityCd > 0) unit.abilityCd = Math.max(0, unit.abilityCd - 1)
      setMessage(`<b>${esc(unit.species.name)}</b> braces for impact.`, !isPlayer)
      floatText(unit, `⛨ ${shield}`, 'shield')
      setUnitClass(unit, 'heal', 500)
      burstOn(unit, '#8fe8ff', 14)
      audio.play('shield')
      updateUnitDOM(unit)
      await sleep(650)
      return
    }

    const used = action.kind === 'strike'
      ? { name: 'Strike', power: 1, target: 'one', cooldown: 0, hits: 1, effects: [], icon: 'sword' }
      : ability
    if (!used) return
    if (action.kind === 'ability') unit.abilityCd = used.cooldown

    const enraged = unit.statuses.curse ? (1 - unit.statuses.curse.potency) : 1
    const targets = used.target === 'all'
      ? foes.filter(u => u.alive)
      : used.target === 'team'
        ? [unit]
        : [foes.find(u => u.uid === (action.targetUid || battle.targetUid)) || foes.filter(u => u.alive).sort((a, b) => a.hp - b.hp)[0]].filter(Boolean)

    setMessage(`<b>${esc(unit.species.name)}</b> uses <b>${esc(used.name)}</b>!`, !isPlayer)
    setUnitClass(unit, isPlayer ? 'attack-up' : 'attack-down', 460)
    if (action.kind === 'ability') {
      audio.play('magic')
      burstOn(unit, ELEMENTS[unit.species.element].color, 16, true)
    } else {
      audio.play('tap')
    }
    await sleep(260)

    let totalDamage = 0
    const hitCount = used.hits || 1
    const supportTypes = new Set(['healTeam', 'cleanseTeam', 'spdUpTeam', 'shieldTeam', 'shieldSelf'])
    const targetEffects = (used.effects || []).filter(e => !supportTypes.has(e.type))
    const supportEffects = (used.effects || []).filter(e => supportTypes.has(e.type))
    for (let h = 0; h < hitCount; h++) {
      for (const target of targets) {
        if (!target.alive) continue
        if (used.power > 0) {
          const crit = chanceCrit(used.critBonus || 0)
          const mult = elementMult(unit, target)
          const defense = target.def * (1 - (used.ignoreDef || 0))
          let dmg = effectiveAtk(unit) * used.power * enraged * mult * (0.92 + Math.random() * 0.16)
          dmg = dmg * (100 / (100 + defense * 1.1))
          if (crit) dmg *= 1.6
          if (mult > 1) dmg *= 1.04
          const dealt = await applyDamage(unit, target, dmg, { crit, element: true })
          totalDamage += dealt
          if (mult > 1.2 && h === 0) setMessage(`Super effective! <b>${esc(unit.species.name)}</b>'s ${esc(used.name)} hits <b>${esc(target.species.name)}</b>.`, !isPlayer)
        }
        for (const effect of targetEffects) applyEffect(target, effect, unit)
      }
      if (h < hitCount - 1) await sleep(170)
    }

    if (used.lifesteal && totalDamage > 0) {
      const amount = Math.round(totalDamage * used.lifesteal)
      healUnit(unit, amount)
    }
    // Support effects always resolve on the caster's side, once per action.
    for (const effect of supportEffects) applyEffect(effect.type === 'shieldSelf' ? unit : unit, effect, unit)
    battle.units.forEach(updateUnitDOM)
    await sleep(420)
    checkEnd()
  }

  function chooseEnemyAction(unit) {
    const ability = unit.species.ability
    const ready = unit.abilityCd <= 0
    const foes = battle.players.filter(p => p.alive)
    const allies = battle.enemies.filter(e => e.alive)
    const lowest = [...foes].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    const target = Math.random() < 0.6 ? lowest : foes[Math.floor(Math.random() * foes.length)]
    const isSupport = ability.target === 'team' || (ability.effects || []).some(e => ['healTeam', 'cleanseTeam'].includes(e.type))
    const needsSupport = allies.some(a => a.hp / a.maxHp < 0.68) || allies.some(a => a.statuses.burn || a.statuses.poison)
    if (ready && (isSupport ? needsSupport : Math.random() < 0.62)) {
      return { kind: 'ability', targetUid: target?.uid }
    }
    return { kind: 'strike', targetUid: target?.uid }
  }

  function checkEnd() {
    if (battle.ended) return true
    if (battle.enemies.every(u => !u.alive)) {
      finishBattle('victory')
      return true
    }
    if (battle.players.every(u => !u.alive)) {
      finishBattle('defeat')
      return true
    }
    return false
  }

  function decrementStatuses(unit) {
    for (const key of Object.keys(unit.statuses)) {
      const st = unit.statuses[key]
      if (!st) continue
      st.turns -= 1
      if (st.turns <= 0) delete unit.statuses[key]
    }
    if (unit.shieldTurns > 0) {
      unit.shieldTurns -= 1
      if (unit.shieldTurns <= 0) unit.shield = 0
    }
  }

  async function startTurn(unit) {
    setActive(unit)
    if (!unit.alive) return false
    if (unit.abilityCd > 0) unit.abilityCd -= 1
    updateUnitDOM(unit)
    renderActions()
    renderQueue()
    if (unit.statuses.stun) {
      setMessage(`<b>${esc(unit.species.name)}</b> is stunned and loses its turn!`, unit.side === 'enemy')
      floatText(unit, 'STUNNED', 'status')
      audio.play('stun')
      await sleep(750)
      delete unit.statuses.stun
      updateUnitDOM(unit)
      return false
    }
    let dotTotal = 0
    for (const type of ['burn', 'poison']) {
      const st = unit.statuses[type]
      if (!st) continue
      dotTotal += await applyDamage(unit, unit, st.potency, { isDot: true, dotType: type, bypassShield: true, element: false })
      await sleep(120)
    }
    if (dotTotal > 0) {
      setMessage(`<b>${esc(unit.species.name)}</b> suffers ${dotTotal} ${unit.statuses.burn ? 'burn' : 'poison'} damage.`, unit.side === 'player')
      await sleep(450)
    }
    if (!unit.alive) { checkEnd(); return false }
    return true
  }

  function newRound() {
    battle.round += 1
    q('[data-round]').textContent = String(battle.round)
    battle.queue = battle.units.filter(u => u.alive).sort((a, b) => effectiveSpd(b) - effectiveSpd(a))
    battle.activeIndex = 0
    if (!battle.queue.length) return
    renderQueue()
  }

  function advance() {
    battle.activeIndex += 1
    if (battle.activeIndex >= battle.queue.length) newRound()
    renderQueue()
  }

  function playerWait() {
    battle.phase = 'player'
    pickDefaultTarget()
    renderActions()
    if (battle.auto) scheduleAuto()
    return new Promise(resolve => { battle.resolveAction = resolve })
  }

  async function loop() {
    while (!battle.ended) {
      if (!battle.queue.length) newRound()
      const unit = battle.queue[battle.activeIndex]
      if (!unit) { newRound(); continue }
      if (!unit.alive) { advance(); continue }
      const alive = await startTurn(unit)
      if (battle.ended) break
      if (!alive) {
        decrementStatuses(unit)
        updateUnitDOM(unit)
        advance()
        await sleep(300)
        continue
      }
      if (unit.side === 'player') {
        const action = await playerWait()
        if (battle.ended) break
        await doAction(unit, action)
      } else {
        battle.phase = 'busy'
        renderActions()
        await sleep(720)
        const action = chooseEnemyAction(unit)
        await doAction(unit, action)
      }
      if (battle.ended) break
      decrementStatuses(unit)
      updateUnitDOM(unit)
      advance()
      await sleep(360)
    }
  }

  async function finishBattle(result) {
    if (battle.ended) return
    battle.ended = true
    battle.phase = 'ended'
    clearAuto()
    screen.querySelectorAll('.battle-unit').forEach(el => el.classList.remove('targetable', 'targeted', 'is-active'))
    await sleep(700)
    if (result === 'victory') {
      audio.play('victory')
      confetti({ count: 45 })
      const coins = Math.round(stateReward(stage).coins)
      const gems = Math.round(stateReward(stage).gems)
      const first = !S.state.progress.cleared.includes(stage.id)
      showOverlay(`<div class="result-card">
        <div class="rc-kicker">Victory</div>
        <h2 class="rc-title">Stage Cleared!</h2>
        <p>${esc(stage.name)} is safe once more.</p>
        <div class="bi-rec" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:16px">
          <span class="chip gold">${coins} coins</span>
          <span class="chip purple">${gems} gems</span>
          <span class="chip green">+${stateReward(stage).xp} XP</span>
          ${first ? '<span class="chip gold">First-clear egg</span>' : ''}
        </div>
        <button class="btn btn-gold btn-lg" data-b-claim style="margin-top:20px">Claim Rewards</button>
      </div>`)
    } else {
      if (!battle.defeatRecorded) {
        battle.defeatRecorded = true
        S.recordDefeat()
      }
      audio.play('defeat')
      showOverlay(`<div class="result-card defeat">
        <div class="rc-kicker" style="color:#ff91a9">Defeat</div>
        <h2 class="rc-title">Retreat...</h2>
        <p>Your team fought bravely. Train, merge and try again.</p>
        <div class="battle-defeat-actions" style="display:flex;gap:8px;justify-content:center;margin-top:20px;flex-wrap:wrap">
          <button class="btn btn-primary" data-b-retry>Try Again</button>
          <button class="btn btn-ghost" data-b-retreat>Return to Map</button>
        </div>
      </div>`)
    }
  }

  function stateReward(s) {
    const map = {
      1: { coins: 55, gems: 2, xp: 30 }, 2: { coins: 75, gems: 2, xp: 42 }, 3: { coins: 120, gems: 4, xp: 65 },
      4: { coins: 105, gems: 3, xp: 58 }, 5: { coins: 125, gems: 3, xp: 72 }, 6: { coins: 180, gems: 5, xp: 100 },
      7: { coins: 155, gems: 4, xp: 88 }, 8: { coins: 175, gems: 4, xp: 104 }, 9: { coins: 240, gems: 7, xp: 140 },
      10: { coins: 220, gems: 5, xp: 130 }, 11: { coins: 260, gems: 6, xp: 155 }, 12: { coins: 500, gems: 15, xp: 260 }
    }
    return map[s.id]
  }

  function showOverlay(html) {
    screen.querySelectorAll('.battle-result-overlay,.battle-confirm-overlay').forEach(n => n.remove())
    const overlay = document.createElement('div')
    overlay.className = 'battle-result-overlay'
    overlay.innerHTML = html
    screen.appendChild(overlay)
  }

  function confirmRetreat() {
    if (battle.phase === 'ended') return
    showOverlay(`<div class="result-card" style="padding:24px">
      <div class="rc-kicker">Leave Battle?</div>
      <h2 style="font-family:var(--font-display);font-size:34px;line-height:1;margin-top:6px">Retreat</h2>
      <p>Your progress in this battle will be lost.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:18px;flex-wrap:wrap">
        <button class="btn btn-danger" data-b-confirm-retreat>Retreat</button>
        <button class="btn btn-ghost" data-b-resume>Keep Fighting</button>
      </div>
    </div>`)
  }

  function destroy() {
    if (battle.destroyed) return
    battle.destroyed = true
    battle.ended = true
    clearAuto()
    if (battle.resolveAction) {
      const resolve = battle.resolveAction
      battle.resolveAction = null
      resolve({ kind: 'guard' })
    }
    screen.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKey)
    screen.remove()
    if (activeBattle === battle) activeBattle = null
  }

  function claimRewards() {
    const rewards = S.battleRewards(stage.id, true)
    destroy()
    battle.onVictory(rewards, stage)
  }

  function retry() {
    destroy()
    startBattle(stage.id, { onVictory: battle.onVictory, onExit: battle.onExit })
  }

  function retreat() {
    destroy()
    toast('You retreated from battle.', { iconName: 'shield' })
    battle.onExit()
  }

  function begin() {
    const intro = screen.querySelector('.battle-intro')
    if (intro) intro.remove()
    audio.play('battleStart')
    const banner = screen.querySelector('[data-banner]')
    if (banner) {
      banner.classList.add('show')
      setTimeout(() => banner.classList.remove('show'), 1400)
    }
    battle.queue = battle.units.filter(u => u.alive).sort((a, b) => effectiveSpd(b) - effectiveSpd(a))
    battle.activeIndex = 0
    renderQueue()
    setMessage('Choose an action. Tap a foe to change target.')
    setAutoButton()
    setTimeout(() => { loop() }, 650)
  }

  function onClick(event) {
    const actionBtn = event.target.closest('[data-b-action]')
    if (actionBtn) {
      audio.play('click')
      resolvePlayerAction(actionBtn.dataset.bAction)
      return
    }
    const targetEl = event.target.closest('.battle-unit.enemy')
    if (targetEl && battle.phase === 'player') {
      const unit = battle.enemies.find(u => u.uid === targetEl.dataset.uid)
      if (unit?.alive) {
        battle.targetUid = unit.uid
        updateTargetHighlight()
        audio.play('click')
        renderActions()
      }
      return
    }
    if (event.target.closest('[data-b-begin]')) { audio.play('click'); begin(); return }
    if (event.target.closest('[data-b-auto]')) {
      battle.auto = !battle.auto
      S.state.settings.autoBattle = battle.auto
      S.save()
      setAutoButton()
      audio.play('click')
      if (battle.auto && battle.phase === 'player') scheduleAuto()
      else clearAuto()
      return
    }
    if (event.target.closest('[data-b-exit]')) { audio.play('back'); confirmRetreat(); return }
    if (event.target.closest('[data-b-resume]')) {
      const overlay = screen.querySelector('.battle-result-overlay')
      if (overlay) overlay.remove()
      audio.play('click')
      return
    }
    if (event.target.closest('[data-b-confirm-retreat]')) { audio.play('back'); retreat(); return }
    if (event.target.closest('[data-b-retreat]')) { audio.play('back'); retreat(); return }
    if (event.target.closest('[data-b-retry]')) { audio.play('unlock'); retry(); return }
    if (event.target.closest('[data-b-claim]')) { audio.play('reward'); claimRewards(); return }
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      if (battle.phase === 'ended') return
      confirmRetreat()
    }
    if (battle.phase !== 'player') return
    if (event.key === '1') resolvePlayerAction('strike')
    if (event.key === '2') resolvePlayerAction('ability')
    if (event.key === '3') resolvePlayerAction('guard')
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const alive = battle.enemies.filter(u => u.alive)
      if (!alive.length) return
      let i = alive.findIndex(u => u.uid === battle.targetUid)
      i = (i + (event.key === 'ArrowRight' ? 1 : -1) + alive.length) % alive.length
      battle.targetUid = alive[i].uid
      updateTargetHighlight()
      renderActions()
    }
  }

  screen.addEventListener('click', onClick)
  document.addEventListener('keydown', onKey)
  renderActions()
  setAutoButton()

  return {
    destroy,
    stage,
    get battle() { return battle }
  }
}

export function activeBattleScreen() { return activeBattle }
