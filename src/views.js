// Screen renderers for MONSTER MERGE.
import {
  MONSTERS, MONSTER_BY_ID, ELEMENTS, ELEMENT_ORDER, CAMPAIGN, EGGS,
  evolutionLine, nextEvolution, statsFor, powerOf, MAX_LEVEL
} from './data.js'
import * as S from './state.js'
import {
  monsterArt, elementGlyph, eggArt, icon, icons, esc, fmt, stars,
  stagePips, elementChip, elementVars
} from './dom.js'
import { enemyPowerFor } from './battle.js'

export const viewState = {
  filter: 'all',
  mergeId: null
}

function bestOwned() {
  return MONSTERS.filter(m => S.isOwned(m.id)).sort((a, b) => S.power(b.id) - S.power(a.id))[0] || null
}

function currencyIcon(currency) {
  return currency === 'gems' ? '<span class="gem-icon"></span>' : '<span class="coin-icon"></span>'
}

function teamMini(id) {
  const m = MONSTER_BY_ID[id]
  if (!m) return ''
  return `<span class="mini-mon" style="${elementVars(m.element)}">${monsterArt(m, { decorative: true })}</span>`
}

function dailyCard() {
  const available = S.dailyAvailable()
  return `<section class="daily-card ${available ? '' : 'claimed'}">
    <div class="daily-icon">${icons.gift}</div>
    <div class="daily-body">
      <span class="eyebrow gold">Daily gift</span>
      <h3>${available ? 'A gift from the grove' : 'Gift collected'}</h3>
      <p>${available ? `${S.DAILY_REWARD.coins} coins + ${S.DAILY_REWARD.gems} gems` : 'Return tomorrow for more treasure.'}</p>
    </div>
    ${available
      ? '<button class="btn btn-gold btn-sm" data-action="claim-daily">Claim</button>'
      : '<button class="btn btn-ghost btn-sm" disabled>Claimed</button>'}
  </section>`
}

export function homeView() {
  const strongest = bestOwned() || MONSTERS[0]
  const el = ELEMENTS[strongest.element]
  const st = S.stack(strongest.id)
  const team = S.state.team.map(id => MONSTER_BY_ID[id]).filter(Boolean)
  const found = S.collectionProgress()
  const cleared = S.state.progress.cleared.length
  const mergeables = S.mergeable()
  const ready = mergeables.find(m => nextEvolution(m)) || mergeables[0]
  const nextStage = CAMPAIGN.find(s => !S.state.progress.cleared.includes(s.id)) || CAMPAIGN[CAMPAIGN.length - 1]
  const power = S.isOwned(strongest.id) ? S.power(strongest.id) : powerOf(strongest, 1)

  const squadHtml = Array.from({ length: 3 }, (_, i) => {
    const id = S.state.team[i]
    const m = id ? MONSTER_BY_ID[id] : null
    if (!m) {
      return `<button class="squad-slot squad-empty" data-action="open-team-editor" aria-label="Add a monster to your squad">
        <div class="ss-art"><span class="empty-plus">${icons.plus}</span></div>
        <div class="ss-name">Empty slot</div>
        <div class="ss-meta">Tap to add</div>
      </button>`
    }
    const s = S.stack(id)
    return `<button class="squad-slot" style="${elementVars(m.element)}" data-action="open-monster" data-monster="${m.id}">
      <div class="ss-art">${monsterArt(m, { decorative: true })}</div>
      <div class="ss-name">${esc(m.name)}</div>
      <div class="ss-meta"><span>Lv ${s.level}</span><b>${fmt(S.power(id))}</b></div>
    </button>`
  }).join('')

  const evoCard = ready
    ? (() => {
        const next = nextEvolution(ready)
        const target = next || ready
        return `<section class="next-evo panel panel-pad">
          <div class="panel-head" style="margin-bottom:10px">
            <div>
              <div class="eyebrow">Merge ready</div>
              <div class="panel-title" style="font-size:18px">${next ? 'Evolution waiting' : 'Star rank ready'}</div>
            </div>
            <span class="chip gold">${S.stack(ready.id).count} copies</span>
          </div>
          <div class="evo-mini">
            <div class="evo-mini-art" style="${elementVars(target.element)}">${monsterArt(target, { decorative: true })}</div>
            <div class="evo-mini-copy">
              <b>${esc(target.name)}${next ? '' : ' ★'}</b>
              <span>${next ? `2 ${esc(ready.name)} → ${esc(next.name)}` : 'Merge two for a star rank'}</span>
            </div>
            <button class="evo-arrow" data-action="go-merge" data-monster="${ready.id}" aria-label="Open merge lab">${icons.arrowSm}</button>
          </div>
        </section>`
      })()
    : `<section class="next-evo panel panel-pad">
        <div class="panel-head" style="margin-bottom:10px">
          <div><div class="eyebrow">Next evolution</div><div class="panel-title" style="font-size:18px">Find a duplicate</div></div>
        </div>
        <div class="evo-mini">
          <div class="evo-mini-art">${eggArt('#7ce495')}</div>
          <div class="evo-mini-copy">
            <b>Hatch a matching pair</b>
            <span>Win battles or visit the Nest to find duplicates.</span>
          </div>
          <button class="evo-arrow" data-view="nest" aria-label="Open the Nest">${icons.arrowSm}</button>
        </div>
      </section>`

  return `<div class="view-inner">
    <section class="home-hero" style="${elementVars(strongest.element)};--show-el:${el.color}">
      <div class="hero-copy">
        <span class="eyebrow">Welcome back, Tamer</span>
        <h1 class="hero-title">Grow.<br><em>Merge.</em><br><span class="hl">Evolve.</span></h1>
        <p class="hero-sub">Twenty creatures hide in the wild. Pair matching monsters, unlock four-stage evolutions and climb toward the Eclipse Throne.</p>
        <div class="hero-ctas">
          <button class="btn btn-primary cta-pulse" data-view="battle">${icons.sword} Enter Adventure</button>
          <button class="btn btn-ghost" data-view="merge">${icons.spark} Merge Lab</button>
        </div>
        <div class="hero-meta">
          <span class="chip">${icons.paw} ${found.found} / ${found.total} discovered</span>
          <span class="chip gold">${icons.trophy} ${cleared} / ${CAMPAIGN.length} cleared</span>
        </div>
      </div>
      <div class="hero-showcase">
        <div class="showcase-aura"></div>
        <div class="showcase-ring"></div>
        <div class="showcase-art">${monsterArt(strongest)}</div>
        <div class="showcase-platform"></div>
        <span class="showcase-tag"><span class="badge-dot"></span>Your strongest</span>
        <div class="showcase-card">
          <div class="sc-kicker">${esc(strongest.family)}</div>
          <div class="sc-name">${esc(strongest.name)} ${stars(st.stars)}</div>
          <div class="sc-meta">
            <span style="color:${el.color}">${elementGlyph(el.glyph)}</span>
            <span>Lv ${st.level}</span>
            <span>•</span>
            <span class="sc-power">${fmt(power)} PWR</span>
          </div>
        </div>
        <span class="hero-orb o1"></span><span class="hero-orb o2"></span><span class="hero-orb o3"></span>
      </div>
    </section>

    <div class="home-stats">
      <div class="stat-card">
        <div class="stat-icon">${icons.paw}</div>
        <div class="stat-body"><span>Monster codex</span><b>${found.found} <small style="display:inline;font-size:12px;color:var(--muted)">/ ${found.total}</small></b><small>${Math.round(found.found / found.total * 100)}% discovered</small></div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">${icons.map}</div>
        <div class="stat-body"><span>Adventure</span><b>${cleared} <small style="display:inline;font-size:12px;color:var(--muted)">/ ${CAMPAIGN.length}</small></b><small>Next: ${esc(nextStage.name)}</small></div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">${icons.bolt}</div>
        <div class="stat-body"><span>Squad power</span><b>${fmt(S.teamPower())}</b><small>${team.length} of 3 monsters ready</small></div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">${icons.trophy}</div>
        <div class="stat-body"><span>Battle wins</span><b>${fmt(S.state.progress.wins)}</b><small>Best streak: ${S.state.progress.bestStreak || 0}</small></div>
      </div>
    </div>

    <div class="home-grid">
      <section class="panel panel-pad">
        <div class="panel-head">
          <div>
            <div class="panel-title"><span class="pt-icon">${icons.team}</span>Battle squad</div>
            <div class="panel-sub">Your three strongest fighters enter the arena.</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="open-team-editor">Edit squad</button>
        </div>
        <div class="squad-slots">${squadHtml}</div>
        <div class="squad-summary">
          <div class="squad-power"><span>Squad power</span><b>${fmt(S.teamPower())}</b><em>PWR</em></div>
          <button class="btn btn-primary btn-sm" data-action="start-battle" data-stage="${nextStage.id}">${icons.sword} Fight next</button>
        </div>
      </section>
      <div class="home-side">
        ${dailyCard()}
        ${evoCard}
      </div>
    </div>

    <div class="tip-strip">
      <span class="tip-icon">${icons.info}</span>
      <span><b>Merge matching monsters</b> to unlock stronger evolutions. Need duplicates? Win battles or hatch eggs in the Nest. <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> work in battle.</span>
    </div>
  </div>`
}

export function collectionView() {
  const filter = viewState.filter
  const list = MONSTERS
    .filter(m => filter === 'all' || m.element === filter)
    .sort((a, b) => ELEMENT_ORDER.indexOf(a.element) - ELEMENT_ORDER.indexOf(b.element) || a.stage - b.stage)
  const found = S.collectionProgress()

  const filters = `<button class="filter-chip ${filter === 'all' ? 'active' : ''}" data-action="filter-collection" data-element="all">
      All <span class="fc-count">${found.found}/${found.total}</span>
    </button>` + ELEMENT_ORDER.map(id => {
    const el = ELEMENTS[id]
    const discovered = MONSTERS.filter(m => m.element === id && S.isDiscovered(m.id)).length
    return `<button class="filter-chip ${filter === id ? 'active' : ''}" data-action="filter-collection" data-element="${id}" style="--el:${el.color}">
      ${elementGlyph(el.glyph)} ${el.name} <span class="fc-count">${discovered}/4</span>
    </button>`
  }).join('')

  const cards = list.map(m => {
    const discovered = S.isDiscovered(m.id)
    const st = S.stack(m.id)
    const owned = st.count > 0
    const el = ELEMENTS[m.element]
    const inTeam = S.state.team.includes(m.id)
    if (!discovered) {
      return `<button class="monster-card locked" data-action="open-monster" data-monster="${m.id}" style="${elementVars(m.element)}" aria-label="Undiscovered ${el.name} monster, stage ${m.stage}">
        <div class="mc-top"><span class="mc-stage">Stage ${m.stage} • ${el.name}</span><span class="mc-count zero">?</span></div>
        <div class="mc-art">
          <div class="silhouette">${monsterArt(m, { decorative: true })}</div>
          <span class="lock-badge">${icons.lock}</span>
        </div>
        <div class="mc-info"><h3>???</h3><div class="mc-sub">${el.name} lineage</div></div>
        <div class="mc-foot"><span class="mc-power">UNDISCOVERED</span><span class="mc-ability">Merge or hatch</span></div>
      </button>`
    }
    return `<button class="monster-card ${owned ? '' : 'depleted'}" data-action="open-monster" data-monster="${m.id}" style="${elementVars(m.element)}" aria-label="${m.name}, level ${st.level}, ${st.count} owned">
      <div class="mc-top">
        <span class="mc-stage">Stage ${m.stage} • ${el.name}</span>
        <span class="mc-count ${owned ? '' : 'zero'}">×${st.count}</span>
      </div>
      <div class="mc-art">
        ${monsterArt(m, { decorative: true })}
        ${inTeam ? '<span class="mc-team-tag">IN SQUAD</span>' : ''}
      </div>
      <div class="mc-info">
        <h3>${esc(m.name)}</h3>
        <div class="mc-sub">${elementGlyph(el.glyph)}<span>Lv ${st.level}</span><span class="sep"></span><span>${stars(st.stars, 5)}</span></div>
      </div>
      <div class="mc-foot">
        <span class="mc-power">${fmt(owned ? S.power(m.id) : powerOf(m, 1))} PWR</span>
        <span class="mc-ability">${esc(m.ability.name)}</span>
      </div>
    </button>`
  }).join('')

  return `<div class="view-inner">
    <div class="view-head">
      <div>
        <span class="eyebrow">Collection</span>
        <h1>Monster <em>Codex</em></h1>
        <p>Every creature belongs to a four-stage evolution line. Find, merge and raise all twenty.</p>
      </div>
      <button class="btn btn-primary btn-sm" data-view="merge">${icons.spark} Merge Lab</button>
    </div>
    <div class="codex-toolbar">
      <div class="filter-row">${filters}</div>
      <div class="codex-progress">
        <span class="cp-text"><b>${found.found}</b> / ${found.total} found</span>
        <div class="progress"><i style="width:${found.found / found.total * 100}%"></i></div>
      </div>
    </div>
    <div class="monster-grid">${cards}</div>
  </div>`
}

export function detailView(id) {
  const m = MONSTER_BY_ID[id]
  if (!m) return ''
  const el = ELEMENTS[m.element]
  const discovered = S.isDiscovered(id)
  const st = S.stack(id)
  const owned = st.count > 0
  const stat = owned ? S.stats(id) : statsFor(m, 1)
  const pwr = owned ? S.power(id) : powerOf(m, 1)
  const xp = S.xpProgress(id)
  const inTeam = S.state.team.includes(id)
  const next = nextEvolution(m)
  const line = evolutionLine(m)
  const maxes = { hp: 330, atk: 66, def: 44, spd: 40 }
  const ability = m.ability
  const targetText = ability.target === 'all' ? 'All foes' : ability.target === 'team' ? 'Your team' : 'One foe'
  const mergeReady = owned && st.count >= 2

  const statRows = ['hp', 'atk', 'def', 'spd'].map(k => {
    const label = { hp: 'Health', atk: 'Attack', def: 'Defense', spd: 'Speed' }[k]
    const pct = Math.min(100, Math.round(stat[k] / maxes[k] * 100))
    return `<div class="dstat"><div class="ds-top"><span>${label}</span><b>${stat[k]}</b></div><div class="ds-bar"><i style="width:${pct}%"></i></div></div>`
  }).join('')

  const evoNodes = line.map(node => {
    const nOwned = S.isOwned(node.id)
    const nFound = S.isDiscovered(node.id)
    const current = node.id === id
    return `<button class="evo-node ${current ? 'current' : ''} ${nOwned ? 'owned' : ''}" data-action="open-monster" data-monster="${node.id}" aria-label="${nFound ? node.name : 'Undiscovered monster'}">
      <span class="en-art">${nFound ? monsterArt(node, { decorative: true }) : `<span style="opacity:.25;display:block;width:40px;height:40px">${monsterArt(node, { decorative: true })}</span>`}</span>
      <span>${nFound ? esc(node.name) : '???'}</span>
    </button>`
  }).join('<span class="evo-sep"></span>')

  const actions = discovered
    ? `<button class="btn btn-primary" data-action="train-monster" data-monster="${id}" ${owned && st.level < MAX_LEVEL ? '' : 'disabled'}>
        ${icons.bolt} ${st.level >= MAX_LEVEL ? 'Max level' : `Train · ${S.trainCost(id)}`}
      </button>
      <button class="btn btn-gold" data-action="go-merge" data-monster="${id}" ${mergeReady ? '' : 'disabled'}>
        ${icons.spark} ${mergeReady ? 'Merge' : 'Need 2'}
      </button>
      <button class="btn btn-ghost btn-icon-only" data-action="toggle-team" data-monster="${id}" title="${inTeam ? 'Remove from squad' : 'Add to squad'}" ${owned ? '' : 'disabled'}>
        ${inTeam ? icons.check : icons.plus}
      </button>`
    : `<button class="btn btn-primary" data-view="merge">${icons.spark} Open Merge Lab</button>
       <button class="btn btn-gold" data-view="nest">${icons.egg} Hatch eggs</button>`

  return `<div class="detail-layout" style="${elementVars(m.element)}">
    <div class="detail-art-panel">
      <span class="detail-stage-label">STAGE ${m.stage} • ${el.name.toUpperCase()}</span>
      <div class="detail-art-inner">${discovered ? monsterArt(m) : `<div class="silhouette" style="opacity:.22;filter:grayscale(1) brightness(0);width:100%;height:100%">${monsterArt(m, { decorative: true })}</div>`}</div>
      <div class="detail-power-badge"><span>Power</span><b>${fmt(pwr)}</b></div>
      <div class="detail-element-mark">${elementGlyph(el.glyph)}</div>
    </div>
    <div class="detail-body">
      <div class="detail-topline">
        ${elementChip(m.element)}
        <span class="chip">${stagePips(m.stage)} Stage ${m.stage}</span>
        <span class="chip gold">${stars(st.stars, 5)}</span>
      </div>
      <h2 class="detail-name">${discovered ? esc(m.name) : '???'}</h2>
      <p class="detail-lore">${discovered ? esc(m.lore) : `A mysterious ${el.name.toLowerCase()} creature of the ${esc(m.family)} line. Merge matching monsters or hatch eggs to discover it.`}</p>

      ${discovered ? `
      <div class="detail-level-row">
        <div class="level-ring" style="--xp:${xp.pct}"><b>${st.level}</b><small>LV</small></div>
        <div class="level-info">
          <div class="li-top"><span>Level progress</span><b>${st.level >= MAX_LEVEL ? 'MAX' : `${xp.current} / ${xp.needed} XP`}</b></div>
          <div class="progress"><i style="width:${xp.pct}%"></i></div>
          <div class="li-top" style="margin-top:5px"><span>${owned ? `${st.count} owned` : 'No copies owned'}</span><span>${inTeam ? 'In squad' : 'Reserve'}</span></div>
        </div>
      </div>
      <div class="detail-stats">${statRows}</div>
      <div class="ability-card">
        <div class="ac-head">
          <span class="ac-icon">${elementGlyph(el.glyph)}</span>
          <b>${esc(ability.name)}</b>
          <span class="ac-cd">${targetText} • CD ${ability.cooldown}</span>
        </div>
        <p>${esc(ability.desc)}</p>
      </div>
      ` : `
      <div class="detail-level-row">
        <div class="level-ring" style="--xp:0"><b>?</b><small>LV</small></div>
        <div class="level-info">
          <div class="li-top"><span>Undiscovered</span><b>0 / 1 found</b></div>
          <div class="progress"><i style="width:0%"></i></div>
          <div class="li-top" style="margin-top:5px"><span>${el.name} lineage</span><span>Stage ${m.stage} of 4</span></div>
        </div>
      </div>
      <div class="ability-card">
        <div class="ac-head"><span class="ac-icon">${icons.lock}</span><b>Ability unknown</b><span class="ac-cd">Discover to reveal</span></div>
        <p>This creature's ability and stats will be revealed once you add it to your collection.</p>
      </div>
      `}

      <div class="evo-line">${evoNodes}</div>
      <div class="detail-actions">${actions}</div>
    </div>
  </div>`
}

export function mergeView() {
  const options = S.mergeable()
  let selected = options.find(m => m.id === viewState.mergeId) || options[0] || null
  if (selected) viewState.mergeId = selected.id

  let machine = ''
  let title = ''
  let detail = ''
  let resultName = ''
  let info = null

  if (selected) {
    info = S.mergeInfo(selected.id)
    const target = info.to || selected
    const el = ELEMENTS[selected.element]
    const count = S.stack(selected.id).count
    resultName = target.name
    const gained = Math.max(0, powerOf(target, info.level, info.stars) - S.power(selected.id))
    title = info.kind === 'evolve'
      ? `Evolve into <em>${esc(target.name)}</em>`
      : `${esc(selected.name)} <em>ascends</em>`
    detail = info.kind === 'evolve'
      ? `2 × ${esc(selected.name)} become 1 × ${esc(target.name)} • Lv ${info.level} • +${fmt(gained)} power`
      : `2 × ${esc(selected.name)} become one ${esc(selected.name)} with +${info.stars} star rank • +${fmt(gained)} power`
    machine = `<div class="merge-slot source" style="${elementVars(selected.element)}">
        <span class="ms-count">×2</span>
        ${monsterArt(selected, { decorative: true })}
        <span class="ms-label">${esc(selected.name)}</span>
      </div>
      <span class="merge-plus">${icons.plus}</span>
      <div class="merge-slot source" style="${elementVars(selected.element)}">
        <span class="ms-count">×2</span>
        ${monsterArt(selected, { decorative: true })}
        <span class="ms-label">${esc(selected.name)}</span>
      </div>
      <span class="merge-arrow">
        <svg viewBox="0 0 40 26" fill="none" aria-hidden="true"><path d="M2 13h30M24 4l10 9-10 9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <div class="merge-slot result" style="${elementVars(target.element)}">
        <span class="ms-count">${info.kind === 'evolve' ? 'NEW' : `★${info.stars}`}</span>
        ${monsterArt(target, { decorative: true })}
        <span class="ms-label">${info.kind === 'evolve' ? 'EVOLVED' : 'STAR RANK'}</span>
      </div>`
  } else {
    machine = `<div class="merge-slot"><span class="empty-q">?</span><span class="ms-label">Pair</span></div>
      <span class="merge-plus">${icons.plus}</span>
      <div class="merge-slot"><span class="empty-q">?</span><span class="ms-label">Pair</span></div>
      <span class="merge-arrow"><svg viewBox="0 0 40 26" fill="none" aria-hidden="true"><path d="M2 13h30M24 4l10 9-10 9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <div class="merge-slot result empty"><span class="empty-q">?</span><span class="ms-label">Evolve</span></div>`
    title = 'No pairs ready'
    detail = 'Collect two copies of the same monster to begin merging.'
  }

  const rows = options.map(m => {
    const n = nextEvolution(m)
    const target = n || m
    const cnt = S.stack(m.id).count
    return `<button class="merge-row ${viewState.mergeId === m.id ? 'active' : ''}" data-action="merge-select" data-monster="${m.id}" style="${elementVars(m.element)}">
      <span class="mr-art">${monsterArt(m, { decorative: true })}</span>
      <span class="mr-info">
        <b>${esc(m.name)}</b>
        <span>×${cnt} • ${n ? `evolves into <em>${esc(n.name)}</em>` : 'gains a <em>star rank</em>'}</span>
      </span>
      <span class="mr-right"><span class="mr-count">${n ? 'EVOLVE' : 'ASCEND'}</span>${icons.arrowSm}</span>
    </button>`
  }).join('')

  return `<div class="view-inner">
    <div class="view-head">
      <div>
        <span class="eyebrow">Evolution lab</span>
        <h1>Merge <em>Lab</em></h1>
        <p>Two matching monsters fuse into one stronger form. Final-stage monsters gain star ranks instead.</p>
      </div>
      <button class="btn btn-ghost btn-sm" data-action="auto-merge" ${options.length ? '' : 'disabled'}>${icons.spark} Merge all pairs</button>
    </div>
    <div class="merge-layout">
      <section class="panel merge-lab" style="${selected ? elementVars(selected.element) : ''}">
        <div class="merge-flash"></div>
        <div class="panel-head" style="margin-bottom:0">
          <div>
            <div class="panel-title"><span class="pt-icon">${icons.spark}</span>Merge chamber</div>
            <div class="panel-sub">${options.length} evolution${options.length === 1 ? '' : 's'} ready</div>
          </div>
          <span class="chip gold">${options.length} ready</span>
        </div>
        <div class="merge-machine">${machine}</div>
        <div class="merge-copy">
          <div class="mc-title">${title}</div>
          <div class="mc-detail">${detail}</div>
        </div>
        <div class="merge-actions">
          <button class="btn btn-primary btn-lg" data-action="do-merge" ${selected && S.canMerge(selected.id) ? '' : 'disabled'}>
            ${icons.spark} ${selected ? (info?.kind === 'evolve' ? 'Merge & Evolve' : 'Merge & Ascend') : 'Select a pair'}
          </button>
          <button class="btn btn-ghost" data-action="auto-merge" ${options.length ? '' : 'disabled'}>Auto merge</button>
        </div>
        <div class="merge-hint">Merging consumes 2 copies. Evolved monsters keep the higher level.</div>
      </section>
      <section class="panel merge-side">
        <div class="panel-head">
          <div>
            <div class="panel-title"><span class="pt-icon">${icons.paw}</span>Ready to merge</div>
            <div class="panel-sub">Pick a pair to preview</div>
          </div>
          <span class="chip">${options.length}</span>
        </div>
        ${options.length ? `<div class="merge-list">${rows}</div>` : `<div class="empty-state" style="padding:22px 10px">
          <div class="empty-icon">${icons.egg}</div>
          <h3>No matching pairs yet</h3>
          <p>Win battles or hatch eggs to find duplicates. Every monster can evolve three times.</p>
          <div class="row" style="justify-content:center">
            <button class="btn btn-primary btn-sm" data-view="battle">${icons.sword} Battle</button>
            <button class="btn btn-gold btn-sm" data-view="nest">${icons.egg} Nest</button>
          </div>
        </div>`}
      </section>
    </div>
  </div>`
}

function difficultyFor(teamPower, enemyPower) {
  const ratio = teamPower / Math.max(1, enemyPower)
  if (ratio >= 1.45) return { label: 'Easy', cls: 'green' }
  if (ratio >= 1.02) return { label: 'Fair', cls: 'gold' }
  if (ratio >= 0.78) return { label: 'Hard', cls: 'red' }
  return { label: 'Deadly', cls: 'red' }
}

export function campaignView() {
  const cleared = new Set(S.state.progress.cleared)
  const nextStage = CAMPAIGN.find(s => !cleared.has(s.id)) || CAMPAIGN[CAMPAIGN.length - 1]
  const ep = enemyPowerFor(nextStage)
  const difficulty = difficultyFor(S.teamPower(), ep)
  const team = S.state.team.map(id => MONSTER_BY_ID[id]).filter(Boolean)
  const allClear = cleared.size >= CAMPAIGN.length
  const clearedCount = cleared.size

  const enemyPreview = nextStage.enemies.map(e => {
    const m = MONSTER_BY_ID[e.species]
    return `<div class="ch-enemy ${e.boss ? 'boss' : ''}" style="${elementVars(m.element)}" title="${m.name} Lv ${e.level}">
      ${e.boss ? '<span class="boss-crown">♛</span>' : ''}
      ${monsterArt(m, { decorative: true })}
    </div>`
  }).join('')

  const stageCards = CAMPAIGN.map(stage => {
    const isCleared = cleared.has(stage.id)
    const unlocked = S.isUnlocked(stage.id)
    const current = !isCleared && unlocked && stage.id === nextStage.id
    const stageEnemies = stage.enemies.map(e => {
      const m = MONSTER_BY_ID[e.species]
      return `<span class="se-mini" style="${elementVars(m.element)}">${monsterArt(m, { decorative: true })}</span>`
    }).join('')
    return `<button class="stage-card ${isCleared ? 'cleared' : ''} ${current ? 'current' : ''} ${unlocked ? '' : 'locked'}" data-action="open-stage" data-stage="${stage.id}" ${unlocked ? '' : 'disabled'} aria-label="Stage ${stage.id}, ${stage.name}">
      <span class="stage-num">${String(stage.id).padStart(2, '0')}<small>STAGE</small></span>
      <span class="stage-main">
        <h3>${esc(stage.name)} ${stage.boss ? '<span class="boss-tag">BOSS</span>' : ''}</h3>
        <span class="stage-sub">${esc(stage.subtitle)}</span>
        <span class="stage-enemies">${stageEnemies}</span>
      </span>
      <span class="stage-side">
        <span class="stage-status">${isCleared ? 'Cleared' : unlocked ? (current ? 'Current' : 'Ready') : 'Locked'}</span>
        <span class="stage-reward"><span class="coin-icon"></span>${stage.rewards?.coins || 0}</span>
      </span>
    </button>`
  }).join('')

  const teamBar = team.map(m => teamMini(m.id)).join('') || '<span class="tiny muted">No squad selected</span>'

  return `<div class="view-inner">
    <div class="view-head">
      <div>
        <span class="eyebrow">Adventure</span>
        <h1>Evolution <em>Trail</em></h1>
        <p>Twelve encounters stand between your squad and the Eclipse Throne. Each victory brings coins, gems and monster eggs.</p>
      </div>
      <button class="btn btn-ghost btn-sm" data-action="open-team-editor">${icons.team} Edit squad</button>
    </div>

    <section class="campaign-hero ${nextStage.boss ? 'boss' : ''}">
      <div class="ch-copy">
        <span class="eyebrow ${nextStage.boss ? 'gold' : ''}">${allClear ? 'Adventure complete • Replay' : nextStage.boss ? 'Boss encounter' : 'Next encounter'}</span>
        <h2 class="ch-title">Stage ${String(nextStage.id).padStart(2, '0')}: <em>${esc(nextStage.name)}</em></h2>
        <p class="ch-sub">${esc(nextStage.subtitle)}. ${allClear ? 'The Eclipse Throne has fallen, but the wild still calls.' : 'Win to unlock the next stage and claim first-clear rewards.'}</p>
        <div class="ch-meta">
          <span class="chip ${difficulty.cls}">${difficulty.label} match</span>
          <span class="chip">${icons.bolt} ${fmt(S.teamPower())} squad power</span>
          <span class="chip gold">${fmt(ep)} enemy power</span>
          ${nextStage.boss ? '<span class="chip red">Boss</span>' : ''}
        </div>
        <div class="ch-actions">
          <button class="btn btn-primary btn-lg" data-action="start-battle" data-stage="${nextStage.id}">${icons.sword} Start battle</button>
          <button class="btn btn-ghost" data-action="open-team-editor">Adjust squad</button>
        </div>
      </div>
      <div class="ch-side">
        <div class="ch-enemies">${enemyPreview}</div>
        <div class="ch-rec"><span>Enemy team</span><b>${nextStage.enemies.length} foes</b><small>${nextStage.enemies.map(e => `Lv ${e.level}`).join(' • ')}</small></div>
      </div>
    </section>

    <div class="campaign-toolbar">
      <div class="ct-squad">${teamBar}<span class="ct-power">Squad <b>${fmt(S.teamPower())}</b> PWR</span></div>
      <div class="row" style="gap:8px">
        <span class="chip green">${clearedCount} / ${CAMPAIGN.length} cleared</span>
        <div class="progress" style="width:90px"><i style="width:${clearedCount / CAMPAIGN.length * 100}%"></i></div>
      </div>
    </div>

    <div class="stage-grid">${stageCards}</div>
  </div>`
}

export function nestView() {
  const eggCards = Object.values(EGGS).map(egg => {
    const odds = egg.pool.map(p => `<span>Stage ${p.stage} • ${p.weight}%</span>`).join('')
    const balance = egg.currency === 'coins' ? S.state.coins : S.state.gems
    const can = balance >= egg.price
    return `<article class="egg-card" style="--egg:${egg.color}">
      <div class="egg-card-art">${eggArt(egg.color)}</div>
      <div class="egg-wrap-mobile">
        <h3>${esc(egg.name)}</h3>
        <p>${esc(egg.desc)}</p>
        <div class="egg-odds">${odds}</div>
        <button class="btn ${can ? 'btn-gold' : 'btn-ghost'}" data-action="buy-egg" data-egg="${egg.id}">
          ${currencyIcon(egg.currency)} ${fmt(egg.price)} ${egg.currency === 'coins' ? 'coins' : 'gems'}
        </button>
      </div>
    </article>`
  }).join('')

  return `<div class="view-inner">
    <div class="view-head">
      <div>
        <span class="eyebrow">Summoning nest</span>
        <h1>The <em>Nest</em></h1>
        <p>Spend coins from battles or rare gems to hatch new monsters. Every egg helps complete an evolution line.</p>
      </div>
      <button class="btn btn-primary btn-sm" data-view="merge">${icons.spark} Merge Lab</button>
    </div>
    <section class="nest-hero">
      <div class="nest-egg-wrap">${eggArt('#ffca6a')}</div>
      <div class="nest-copy">
        <span class="eyebrow gold">Hatch something wonderful</span>
        <h2>Every egg holds a <em>new friend</em></h2>
        <p>Eggs can contain monsters from any of the five elemental families. Duplicates are valuable — they fuel your next evolution.</p>
        <div class="nest-chances">
          <span class="chip green">${icons.egg} 20 species</span>
          <span class="chip gold">${icons.spark} 4-stage evolutions</span>
          <span class="chip purple">${icons.star} Rare stage 4 chance</span>
        </div>
      </div>
    </section>
    <div class="egg-grid">${eggCards}</div>
    <div class="tip-strip" style="margin-top:14px">
      <span class="tip-icon">${icons.info}</span>
      <span><b>First-clear rewards</b> from adventure stages include eggs. Every battle also earns coins and XP for your squad.</span>
    </div>
    ${dailyCard()}
  </div>`
}

export function teamEditorView() {
  const slots = Array.from({ length: 3 }, (_, i) => {
    const id = S.state.team[i]
    const m = id ? MONSTER_BY_ID[id] : null
    if (!m) return `<div class="te-slot"><span class="te-empty">${icons.plus}<br>Empty slot</span></div>`
    const st = S.stack(id)
    return `<div class="te-slot filled" style="${elementVars(m.element)}">
      <button class="te-remove" data-action="team-toggle" data-monster="${id}" aria-label="Remove ${m.name}">${icons.x}</button>
      <div class="te-art">${monsterArt(m, { decorative: true })}</div>
      <b>${esc(m.name)}</b>
      <span>Lv ${st.level} • ${fmt(S.power(id))} PWR</span>
    </div>`
  }).join('')

  const owned = MONSTERS.filter(m => S.isOwned(m.id)).sort((a, b) => S.power(b.id) - S.power(a.id))
  const pool = owned.map(m => {
    const selected = S.state.team.includes(m.id)
    const st = S.stack(m.id)
    return `<button class="te-card ${selected ? 'selected' : ''}" data-action="team-toggle" data-monster="${m.id}" style="${elementVars(m.element)}">
      <span class="tc-art">${monsterArt(m, { decorative: true })}</span>
      <span class="tc-copy"><b>${esc(m.name)}</b><span>Lv ${st.level} • ${fmt(S.power(m.id))} PWR</span></span>
      <span class="tc-check">${icons.check}</span>
    </button>`
  }).join('')

  return `<div class="modal-pad">
    <div class="modal-head">
      <span class="eyebrow">Battle squad</span>
      <h2 class="modal-title">Choose your fighters</h2>
      <p class="modal-sub">Pick up to three monsters. Speed decides turn order.</p>
    </div>
    <div class="team-edit-slots">${slots}</div>
    <div class="spread" style="margin-bottom:8px">
      <span class="small" style="font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--muted-2)">Your collection</span>
      <span class="chip green">${S.teamPower()} squad PWR</span>
    </div>
    ${owned.length ? `<div class="te-pool">${pool}</div>` : `<div class="empty-state" style="padding:18px"><p>No monsters yet.</p></div>`}
    <div class="row mt-16" style="justify-content:flex-end">
      <button class="btn btn-primary" data-action="close-modal">${icons.check} Done</button>
    </div>
  </div>`
}

export function stagePreviewView(stage) {
  const ep = enemyPowerFor(stage)
  const difficulty = difficultyFor(S.teamPower(), ep)
  const cleared = S.state.progress.cleared.includes(stage.id)
  const enemies = stage.enemies.map(e => {
    const m = MONSTER_BY_ID[e.species]
    const stats = statsFor(m, e.level)
    return `<div class="reward-item" style="${elementVars(m.element)}">
      <span class="ri-icon" style="background:color-mix(in srgb, ${ELEMENTS[m.element].color} 12%, transparent)">${monsterArt(m, { decorative: true })}</span>
      <span class="ri-copy">
        <span>${e.boss ? 'Boss' : 'Enemy'} • ${ELEMENTS[m.element].name}</span>
        <b>${esc(m.name)} <span style="font-size:11px;color:var(--muted)">Lv ${e.level}</span></b>
        <span style="display:block;font-size:9px;color:var(--muted);font-weight:700">${stats.hp} HP • ${stats.atk} ATK • ${stats.spd} SPD</span>
      </span>
    </div>`
  }).join('')
  return `<div class="modal-pad">
    <div class="modal-head">
      <span class="eyebrow ${stage.boss ? 'gold' : ''}">Stage ${String(stage.id).padStart(2, '0')}${stage.boss ? ' • Boss' : ''}</span>
      <h2 class="modal-title">${esc(stage.name)}</h2>
      <p class="modal-sub">${esc(stage.subtitle)}</p>
    </div>
    <div class="row wrap" style="margin-bottom:14px">
      <span class="chip ${difficulty.cls}">${difficulty.label} match</span>
      <span class="chip">${icons.bolt} ${fmt(S.teamPower())} your power</span>
      <span class="chip gold">${fmt(ep)} enemy power</span>
      ${cleared ? '<span class="chip green">Already cleared</span>' : ''}
    </div>
    <div class="reward-grid" style="grid-template-columns:1fr;margin-top:0">${enemies}</div>
    <div class="reward-grid" style="margin-top:10px">
      <div class="reward-item"><span class="ri-icon"><span class="coin-icon"></span></span><span class="ri-copy"><span>Reward</span><b>${stage.rewards?.coins || 0} coins</b></span></div>
      <div class="reward-item"><span class="ri-icon"><span class="gem-icon"></span></span><span class="ri-copy"><span>Reward</span><b>${stage.rewards?.gems || 0} gems</b></span></div>
      <div class="reward-item"><span class="ri-icon">${icons.bolt}</span><span class="ri-copy"><span>Team XP</span><b>${stage.rewards?.xp || 0} XP</b></span></div>
      <div class="reward-item"><span class="ri-icon">${icons.egg}</span><span class="ri-copy"><span>First clear</span><b>${cleared ? 'Collected' : 'Monster egg'}</b></span></div>
    </div>
    <div class="row mt-16" style="gap:8px">
      <button class="btn btn-primary btn-lg" style="flex:1" data-action="start-battle" data-stage="${stage.id}">${icons.sword} Fight</button>
      <button class="btn btn-ghost" data-action="close-modal">Back</button>
    </div>
  </div>`
}

export function elementMeta(id) { return ELEMENTS[id] }
export function stageById(id) { return CAMPAIGN.find(s => s.id === Number(id)) }
export function monsterById(id) { return MONSTER_BY_ID[id] }
