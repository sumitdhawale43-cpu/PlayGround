// MONSTER MERGE — persistent collection, merging and economy.
import {
  MONSTERS, MONSTER_BY_ID, EGGS, XP_FOR_LEVEL, MAX_LEVEL,
  powerOf, statsFor, nextEvolution
} from './data.js'

const SAVE_KEY = 'monster-merge-save-v1'

const emptyStack = () => ({ count: 0, level: 1, xp: 0, stars: 0 })

function initialState() {
  const monsters = {}
  for (const m of MONSTERS) monsters[m.id] = emptyStack()
  const starters = [
    ['cindlet', 2], ['dripling', 2], ['sproutle', 2], ['sparkwing', 2], ['wispy', 1]
  ]
  for (const [id, n] of starters) {
    monsters[id].count = n
  }
  return {
    version: 1,
    coins: 260,
    gems: 8,
    monsters,
    discovered: ['cindlet', 'dripling', 'sproutle', 'sparkwing', 'wispy'],
    team: ['cindlet', 'dripling', 'sproutle'],
    progress: { cleared: [], wins: 0, battles: 0, streak: 0, bestStreak: 0 },
    daily: { lastClaim: null },
    settings: { sound: true, autoBattle: false },
    lastView: 'home',
    seen: {}
  }
}

export const state = initialState()

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return state
    const saved = JSON.parse(raw)
    if (!saved || saved.version !== 1) return state
    Object.assign(state, saved)
    // Merge new monsters / missing fields from updates without wiping progress.
    for (const m of MONSTERS) {
      if (!state.monsters[m.id]) state.monsters[m.id] = emptyStack()
      else state.monsters[m.id] = { ...emptyStack(), ...state.monsters[m.id] }
    }
    state.settings = { sound: true, autoBattle: false, ...(state.settings || {}) }
    state.progress = { cleared: [], wins: 0, battles: 0, streak: 0, bestStreak: 0, ...(state.progress || {}) }
    state.daily = { lastClaim: null, ...(state.daily || {}) }
    state.discovered = Array.isArray(state.discovered) ? state.discovered : []
    if (!Array.isArray(state.team)) state.team = []
    repairTeam()
    return state
  } catch (error) {
    console.warn('Could not load save', error)
    return state
  }
}

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch (error) { console.warn('Save failed', error) }
}

export function stack(id) { return state.monsters[id] || emptyStack() }
export function owned(id) { return stack(id) }
export function species(id) { return MONSTER_BY_ID[id] }
export function isOwned(id) { return stack(id).count > 0 }
export function isDiscovered(id) { return state.discovered.includes(id) }
export function stats(id) { const s = stack(id); return statsFor(MONSTER_BY_ID[id], s.level, s.stars) }
export function power(id) { const s = stack(id); return powerOf(MONSTER_BY_ID[id], s.level, s.stars) }
export function teamPower() { return state.team.reduce((sum, id) => sum + power(id), 0) }
export function powerLabel(value) {
  if (value >= 10000) return (value / 1000).toFixed(1) + 'k'
  return String(value)
}

export function discover(id) {
  if (!state.discovered.includes(id)) state.discovered.push(id)
}

export function repairTeam() {
  state.team = [...new Set(state.team)].filter(id => MONSTER_BY_ID[id] && isOwned(id))
  if (state.team.length > 3) state.team = state.team.slice(0, 3)
  if (state.team.length < 3) {
    const candidates = MONSTERS
      .filter(m => isOwned(m.id) && !state.team.includes(m.id))
      .sort((a, b) => power(b.id) - power(a.id))
    for (const m of candidates) {
      if (state.team.length >= 3) break
      state.team.push(m.id)
    }
  }
  return state.team
}

export function toggleTeam(id) {
  const i = state.team.indexOf(id)
  if (i >= 0) {
    if (state.team.length === 1) return { ok: false, reason: 'Keep at least one monster on your team.' }
    state.team.splice(i, 1)
  } else {
    if (!isOwned(id)) return { ok: false, reason: 'You do not own this monster yet.' }
    if (state.team.length >= 3) return { ok: false, reason: 'Your battle squad is full. Remove one first.' }
    state.team.push(id)
  }
  save()
  return { ok: true }
}

export function addMonster(id, n = 1) {
  const isNew = !isDiscovered(id)
  const s = stack(id)
  s.count += n
  discover(id)
  repairTeam()
  save()
  return { ...s, isNew }
}

function removeMonster(id, n = 1) {
  const s = stack(id)
  s.count = Math.max(0, s.count - n)
  repairTeam()
}

export function canMerge(id) { return isOwned(id) && stack(id).count >= 2 }
export function mergeable() {
  return MONSTERS.filter(m => canMerge(m.id)).sort((a, b) => b.stage - a.stage || a.name.localeCompare(b.name))
}

export function mergeInfo(id) {
  const m = MONSTER_BY_ID[id]
  if (!m) return null
  const next = nextEvolution(m)
  const s = stack(id)
  if (next) {
    return {
      kind: 'evolve', from: m, to: next, stars: Math.min(3, s.stars),
      level: Math.min(MAX_LEVEL, s.level + 1),
      title: `Evolve into ${next.name}`,
      detail: `Consumes 2 ${m.name} • evolves at Lv ${Math.min(MAX_LEVEL, s.level + 1)}`
    }
  }
  return {
    kind: 'ascend', from: m, to: null,
    stars: Math.min(5, s.stars + 1), level: Math.min(MAX_LEVEL, s.level + 1),
    title: `${m.name} ascends`,
    detail: s.stars >= 5 ? 'Maximum star rank reached' : `Consumes 2 ${m.name} • gains a star rank`
  }
}

export function merge(id) {
  const m = MONSTER_BY_ID[id]
  if (!m) return { ok: false, reason: 'Unknown monster.' }
  if (!canMerge(id)) return { ok: false, reason: `You need 2 copies of ${m.name} to merge.` }
  const s = stack(id)
  const info = mergeInfo(id)
  s.count -= 2
  if (info.kind === 'evolve') {
    const target = stack(info.to.id)
    target.count += 1
    target.level = Math.max(target.level, info.level)
    target.stars = info.stars
    target.xp = 0
    discover(info.to.id)
    if (state.team.includes(id) && s.count === 0) {
      const idx = state.team.indexOf(id)
      state.team[idx] = info.to.id
    } else if (isOwned(info.to.id) && state.team.length < 3) {
      state.team.push(info.to.id)
    }
  } else {
    s.stars = info.stars
    s.level = info.level
  }
  repairTeam()
  save()
  return { ok: true, info }
}

export function autoMerge() {
  const log = []
  let guard = 0
  while (guard++ < 40) {
    const options = mergeable()
    if (!options.length) break
    const target = options[0]
    const result = merge(target.id)
    if (!result.ok) break
    log.push(result.info)
  }
  return log
}

export function addXp(id, amount) {
  const s = stack(id)
  if (!isOwned(id)) return { levels: 0 }
  s.xp += amount
  let levels = 0
  while (s.level < MAX_LEVEL && s.xp >= XP_FOR_LEVEL(s.level)) {
    s.xp -= XP_FOR_LEVEL(s.level)
    s.level += 1
    levels += 1
  }
  if (s.level >= MAX_LEVEL) s.xp = 0
  return { levels, level: s.level }
}

export function trainCost(id) {
  const s = stack(id)
  return Math.round(42 + s.level * 22 + s.stars * 30)
}

export function train(id) {
  if (!isOwned(id)) return { ok: false, reason: 'This monster is not in your collection.' }
  const cost = trainCost(id)
  if (state.coins < cost) return { ok: false, reason: `You need ${cost - state.coins} more coins.` }
  if (stack(id).level >= MAX_LEVEL) return { ok: false, reason: 'This monster is already at max level.' }
  state.coins -= cost
  const result = addXp(id, Math.round(34 + stack(id).level * 11 + stack(id).stars * 14))
  save()
  return { ok: true, ...result, cost }
}

function weightedPick(pool) {
  const total = pool.reduce((sum, p) => sum + p.weight, 0)
  let roll = Math.random() * total
  for (const p of pool) {
    roll -= p.weight
    if (roll <= 0) return p.stage
  }
  return pool[pool.length - 1].stage
}

export function randomMonsterForStage(stage) {
  const pool = MONSTERS.filter(m => m.stage === stage)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function summonEgg(eggId) {
  const egg = EGGS[eggId]
  if (!egg) return { ok: false, reason: 'Unknown egg.' }
  const balance = egg.currency === 'coins' ? state.coins : state.gems
  if (balance < egg.price) {
    return { ok: false, reason: `You need ${egg.price - balance} more ${egg.currency}.` }
  }
  if (egg.currency === 'coins') state.coins -= egg.price
  else state.gems -= egg.price
  const stage = weightedPick(egg.pool)
  const monster = randomMonsterForStage(stage)
  const added = addMonster(monster.id, 1)
  save()
  return { ok: true, monster, stage, isNew: added.isNew }
}

export function grantEgg(eggId, forcedStage = null) {
  const egg = EGGS[eggId] || EGGS.common
  const stage = forcedStage || weightedPick(egg.pool)
  const monster = randomMonsterForStage(stage)
  const added = addMonster(monster.id, 1)
  save()
  return { monster, stage, isNew: added.isNew }
}

export const DAILY_REWARD = { coins: 90, gems: 4 }

export function dailyAvailable() {
  return state.daily.lastClaim !== new Date().toISOString().slice(0, 10)
}

export function claimDaily() {
  if (!dailyAvailable()) return { ok: false, reason: 'Today\'s gift has already been claimed.' }
  state.daily.lastClaim = new Date().toISOString().slice(0, 10)
  state.coins += DAILY_REWARD.coins
  state.gems += DAILY_REWARD.gems
  save()
  return { ok: true, ...DAILY_REWARD }
}

export function battleRewards(stageNumber, firstClear) {
  const cleared = new Set(state.progress.cleared)
  const first = firstClear && !cleared.has(stageNumber)
  const quest = {
    1: { coins: 55, gems: 2, xp: 30, egg: 'common' },
    2: { coins: 75, gems: 2, xp: 42, egg: 'common' },
    3: { coins: 120, gems: 4, xp: 65, egg: 'common' },
    4: { coins: 105, gems: 3, xp: 58, egg: 'wild' },
    5: { coins: 125, gems: 3, xp: 72, egg: 'wild' },
    6: { coins: 180, gems: 5, xp: 100, egg: 'wild' },
    7: { coins: 155, gems: 4, xp: 88, egg: 'wild' },
    8: { coins: 175, gems: 4, xp: 104, egg: 'wild' },
    9: { coins: 240, gems: 7, xp: 140, egg: 'radiant' },
    10: { coins: 220, gems: 5, xp: 130, egg: 'radiant' },
    11: { coins: 260, gems: 6, xp: 155, egg: 'radiant' },
    12: { coins: 500, gems: 15, xp: 260, egg: 'radiant' }
  }[stageNumber]
  const multiplier = first ? 1 : 0.55
  const coins = Math.round(quest.coins * multiplier)
  const gems = first ? quest.gems : 0
  const xp = Math.round(quest.xp * (first ? 1 : 0.7))
  state.coins += coins
  state.gems += gems
  state.progress.battles++
  state.progress.wins++
  state.progress.streak++
  state.progress.bestStreak = Math.max(state.progress.bestStreak, state.progress.streak)
  if (first) state.progress.cleared.push(stageNumber)
  const levels = {}
  for (const id of state.team) {
    const res = addXp(id, xp)
    if (res.levels) levels[id] = res
  }
  let egg = null
  if (first) egg = grantEgg(quest.egg)
  save()
  return { coins, gems, xp, first, egg, levels, quest }
}

export function recordDefeat() {
  state.progress.battles++
  state.progress.streak = 0
  save()
}

export function isUnlocked(stageNumber) {
  return stageNumber === 1 || state.progress.cleared.includes(stageNumber - 1)
}

export function setView(view) { state.lastView = view; save() }

export function resetProgress() {
  const fresh = initialState()
  Object.assign(state, fresh)
  try { localStorage.removeItem(SAVE_KEY) } catch {}
  save()
}

export function markSeen(key) {
  if (state.seen[key]) return false
  state.seen[key] = true
  save()
  return true
}

export function xpProgress(id) {
  const s = stack(id)
  if (s.level >= MAX_LEVEL) return { current: 1, needed: 1, pct: 100 }
  const needed = XP_FOR_LEVEL(s.level)
  return { current: s.xp, needed, pct: Math.min(100, Math.round((s.xp / needed) * 100)) }
}

export function collectionProgress() {
  return { found: state.discovered.length, total: MONSTERS.length }
}
