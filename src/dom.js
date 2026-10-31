// Shared UI utilities: icons, formatting, modals, toasts and particles.
import { monsterArt, elementGlyph, eggArt } from './art.js'
import { MONSTER_BY_ID, ELEMENTS } from './data.js'

export { monsterArt, elementGlyph, eggArt }

export const icons = {
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4 14.4 9l6.6 2.3-6.6 2.3L12 20.3l-2.4-6.7L3 11.3 9.6 9Z"/><circle cx="19.4" cy="5" r="1.6" opacity=".65"/><circle cx="4.6" cy="18.4" r="1.2" opacity=".65"/></svg>',
  sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 17.5 6.5M15 4l5 5-2 2-5-5Z"/><path d="M4 20l-1 1M6.5 14.5l3 3M19.5 19.5 21 21"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M14 6l6 6-6 6"/></svg>',
  arrowSm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7C9.5 7 8 5.5 8 4a2.2 2.2 0 0 1 4 0c0 1.5 0 3 0 3ZM12 7c2.5 0 4-1.5 4-3a2.2 2.2 0 0 0-4 0"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5l.5 3H9Z"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="7" cy="8" rx="2.4" ry="3.1" transform="rotate(-18 7 8)"/><ellipse cx="17" cy="8" rx="2.4" ry="3.1" transform="rotate(18 17 8)"/><ellipse cx="11" cy="5.6" rx="2.2" ry="2.8"/><ellipse cx="15" cy="14" rx="5.4" ry="4.3"/><ellipse cx="4.8" cy="13.6" rx="2.1" ry="2.7" transform="rotate(22 4.8 13.6)"/><ellipse cx="19.2" cy="13.6" rx="2.1" ry="2.7" transform="rotate(-22 19.2 13.6)"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.4-3.1 2.6-5 5.5-5s5.1 1.9 5.5 5"/><circle cx="17.5" cy="8" r="2.3"/><path d="M16 13.4c2.6-.4 4.6 1.4 4.9 4.1"/></svg>',
  egg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c4.4 0 7 5.4 7 9.2C19 16.7 16 20 12 20s-7-3.3-7-7.8C5 8.4 7.6 3 12 3Z"/><path d="M9 11.5c.8-2 1.8-3.4 3-4.5M15 13.5c-.6 2-1.6 3.4-3 4.4" stroke-linecap="round" opacity=".6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M12 11v6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2 6.4"/><path d="M20 4v7h-7"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-8-5-8-10.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 15 12 20 12 20Z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2 4-2 5-2 9a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 5 5 9a8 8 0 1 1-16 0c0-5 3-8 6-13z"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9Z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m16 9 5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
}

export function icon(name, cls = '') {
  return `<span class="ui-icon ${cls}" aria-hidden="true">${icons[name] || ''}</span>`
}

export function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

export function fmt(n) {
  return Number(n || 0).toLocaleString('en-US')
}

export function stars(count, max = 5) {
  let out = ''
  for (let i = 0; i < max; i++) out += `<span class="${i < count ? '' : 'off'}">★</span>`
  return `<span class="stars">${out}</span>`
}

export function stagePips(stage, max = 4) {
  let out = ''
  for (let i = 1; i <= max; i++) out += `<i class="${i <= stage ? 'on' : ''}"></i>`
  return `<span class="stage-pips">${out}</span>`
}

export function elementChip(elementId, text = '') {
  const el = ELEMENTS[elementId]
  if (!el) return ''
  return `<span class="chip el" style="--el:${el.color}">${elementGlyph(el.glyph)}${text || el.name}</span>`
}

export function statusChip(type) {
  const map = {
    burn: ['burn', '🔥', 'Burning'],
    poison: ['poison', '☠', 'Poisoned'],
    stun: ['stun', '⚡', 'Stunned'],
    atkDown: ['atkdown', '▼', 'Attack down'],
    spdUp: ['spdup', '▲', 'Speed up'],
    curse: ['curse', '✹', 'Cursed']
  }
  const [cls, glyph, label] = map[type] || ['', '?', type]
  return `<span class="status-chip ${cls}" title="${label}" aria-label="${label}">${glyph}</span>`
}

export function elementVars(elementId) {
  const el = ELEMENTS[elementId] || ELEMENTS.ember
  return `--el:${el.color};--el-deep:${el.deep};--el-light:${el.light}`
}

export function monsterCardArt(monster, className = '') {
  return monsterArt(monster, { className })
}

// ── Modal system ──────────────────────────────────────────────────────────
let activeOverlay = null

export function openOverlay(innerHtml, { className = '', closeOnBackdrop = true, onClose = null } = {}) {
  closeOverlay(false)
  const wrap = document.createElement('div')
  wrap.className = 'modal-backdrop'
  wrap.innerHTML = innerHtml
  document.getElementById('modal-root').appendChild(wrap)
  activeOverlay = { wrap, onClose }
  if (closeOnBackdrop) {
    wrap.addEventListener('click', event => {
      if (event.target === wrap) {
        closeOverlay()
      }
    })
  }
  return wrap
}

export function closeOverlay(animate = true) {
  if (!activeOverlay) return
  const { wrap, onClose } = activeOverlay
  activeOverlay = null
  wrap.style.transition = 'opacity .18s ease'
  wrap.style.opacity = '0'
  const remove = () => {
    wrap.remove()
    if (onClose) onClose()
  }
  if (animate) setTimeout(remove, 160)
  else remove()
}

export function hasOverlay() { return Boolean(activeOverlay) }

export function modalShell(inner, { small = false, wide = false, closeLabel = 'Close', className = '', hideClose = false } = {}) {
  return `<div class="modal-card ${small ? 'small' : ''} ${wide ? 'wide' : ''} ${className}" role="dialog" aria-modal="true">
    ${hideClose ? '' : `<button class="modal-close" data-action="close-modal" aria-label="${closeLabel}">${icons.x}</button>`}
    ${inner}
  </div>`
}

// ── Toast ─────────────────────────────────────────────────────────────────
let toastId = 0
export function toast(message, { type = '', iconName = 'spark', duration = 2600 } = {}) {
  const root = document.getElementById('toast-root')
  if (!root) return
  const node = document.createElement('div')
  node.className = `toast ${type}`
  node.dataset.toastId = String(++toastId)
  node.innerHTML = `<span class="toast-icon">${icons[iconName] || icons.spark}</span><span>${message}</span>`
  root.appendChild(node)
  while (root.children.length > 3) root.firstElementChild.remove()
  setTimeout(() => {
    node.classList.add('out')
    setTimeout(() => node.remove(), 320)
  }, duration)
}

// ── Particle helpers ──────────────────────────────────────────────────────
const FX_COLORS = ['#ffd166', '#75f2bb', '#8fe8ff', '#ff91a9', '#c58bff', '#fff6d1']

export function burstAt(x, y, { count = 22, colors = FX_COLORS, spread = 120, size = 7, rays = false, gravity = true } = {}) {
  const root = document.getElementById('fx-root')
  if (!root) return
  if (rays) {
    for (let i = 0; i < 9; i++) {
      const ray = document.createElement('div')
      ray.className = 'ray'
      ray.style.setProperty('--x', `${x}px`)
      ray.style.setProperty('--y', `${y}px`)
      ray.style.setProperty('--r', `${i * 40 + Math.random() * 12}deg`)
      ray.style.setProperty('--len', `${50 + Math.random() * 60}px`)
      ray.style.setProperty('--c', colors[i % colors.length])
      root.appendChild(ray)
      setTimeout(() => ray.remove(), 900)
    }
  }
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div')
    piece.className = 'fx-piece'
    const angle = Math.random() * Math.PI * 2
    const dist = spread * (0.45 + Math.random() * 0.8)
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist + (gravity ? Math.random() * 40 : 0)
    piece.style.setProperty('--x', `${x}px`)
    piece.style.setProperty('--y', `${y}px`)
    piece.style.setProperty('--tx', `${tx}px`)
    piece.style.setProperty('--ty', `${ty}px`)
    piece.style.setProperty('--s', `${size * (0.5 + Math.random())}px`)
    piece.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)])
    piece.style.setProperty('--dur', `${0.6 + Math.random() * 0.7}s`)
    piece.style.setProperty('--sc', `${0.2 + Math.random() * 0.7}`)
    piece.style.setProperty('--rot', `${Math.random() * 360}deg`)
    if (Math.random() > 0.5) piece.style.setProperty('--br', '2px')
    root.appendChild(piece)
    setTimeout(() => piece.remove(), 1400)
  }
}

export function burstElement(element, { rays = true, count = 28 } = {}) {
  if (!element) return
  const rect = element.getBoundingClientRect()
  burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, { rays, count, spread: Math.max(rect.width, 100) * 0.8 })
}

export function confetti({ count = 50, colors = FX_COLORS } = {}) {
  const root = document.getElementById('fx-root')
  if (!root) return
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div')
    piece.className = 'fx-piece'
    piece.style.setProperty('--x', `${Math.random() * 100}%`)
    piece.style.setProperty('--y', `${-5 + Math.random() * 10}%`)
    piece.style.setProperty('--tx', `${(Math.random() - 0.5) * 260}px`)
    piece.style.setProperty('--ty', `${window.innerHeight * (0.5 + Math.random() * 0.6)}px`)
    piece.style.setProperty('--s', `${4 + Math.random() * 7}px`)
    piece.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)])
    piece.style.setProperty('--dur', `${1.2 + Math.random() * 1.4}s`)
    piece.style.setProperty('--sc', `${0.4 + Math.random()}`)
    piece.style.setProperty('--rot', `${Math.random() * 720}deg`)
    piece.style.setProperty('--br', Math.random() > 0.5 ? '2px' : '50%')
    root.appendChild(piece)
    setTimeout(() => piece.remove(), 2800)
  }
}

export function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

export function ageDuration(ms) {
  const s = Math.floor(ms / 1000)
  return `${s}s`
}

export function stageRewardText(stage, rewards) {
  const parts = []
  if (rewards?.coins) parts.push(`${rewards.coins} coins`)
  if (rewards?.gems) parts.push(`${rewards.gems} gems`)
  return parts.join(' • ')
}

export function speciesById(id) { return MONSTER_BY_ID[id] }
