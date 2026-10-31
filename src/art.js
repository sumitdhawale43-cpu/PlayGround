// MONSTER MERGE — bespoke inline SVG creature art.
// Every monster is drawn from layered gradients, shapes and animated groups.

let artCounter = 0

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function defs(m, id) {
  const p = m.art.palette
  return `<defs>
    <linearGradient id="${id}-body" x1=".2" y1="0" x2=".75" y2="1">
      <stop offset="0" stop-color="${p.light}"/>
      <stop offset=".42" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.dark}"/>
    </linearGradient>
    <linearGradient id="${id}-body2" x1=".1" y1=".1" x2=".8" y2="1">
      <stop offset="0" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.dark}"/>
    </linearGradient>
    <radialGradient id="${id}-belly" cx=".45" cy=".3" r=".85">
      <stop offset="0" stop-color="${p.belly}"/>
      <stop offset="1" stop-color="${p.light}"/>
    </radialGradient>
    <radialGradient id="${id}-iris" cx=".38" cy=".32" r=".8">
      <stop offset="0" stop-color="${p.light}"/>
      <stop offset=".45" stop-color="${p.eye}"/>
      <stop offset="1" stop-color="${p.dark}"/>
    </radialGradient>
    <radialGradient id="${id}-glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="${p.glow}" stop-opacity=".65"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.light}"/>
      <stop offset=".5" stop-color="${p.accent}"/>
      <stop offset="1" stop-color="${p.dark}"/>
    </linearGradient>
    <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
    <filter id="${id}-glowf" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`
}

function eye(cx, cy, m, id, fierce = false, scale = 1) {
  const p = m.art.palette
  const rx = (fierce ? 6.4 : 7.7) * scale
  const ry = (fierce ? 7.2 : 9.4) * scale
  const pupil = m.art.build === 'quad' && m.art.pose === 'drake'
    ? `<ellipse cx="${cx}" cy="${cy + 1}" rx="${2 * scale}" ry="${5.6 * scale}" fill="#1b0b2e" opacity=".75"/>`
    : `<ellipse cx="${cx}" cy="${cy + 1.4}" rx="${3 * scale}" ry="${4.6 * scale}" fill="#180d24" opacity=".8"/>`
  return `<g class="m-eyes">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx + 1.4}" ry="${ry + 1.4}" fill="#120a1c" opacity=".18"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-iris)"/>
    ${pupil}
    <circle cx="${cx - rx * 0.34}" cy="${cy - ry * 0.4}" r="${2.5 * scale}" fill="#fff" opacity=".95"/>
    <circle cx="${cx + rx * 0.4}" cy="${cy + ry * 0.35}" r="${1.25 * scale}" fill="#fff" opacity=".55"/>
    ${fierce
      ? `<path d="M${cx - rx - 1.6} ${cy - ry - 4.5} L${cx + rx + 1.4} ${cy - ry - 1.4}" stroke="${p.eye}" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`
      : `<path d="M${cx - rx * 0.8} ${cy - ry - 3.6} Q${cx} ${cy - ry - 5.4} ${cx + rx * 0.8} ${cy - ry - 3.6}" fill="none" stroke="${p.dark}" stroke-width="1.7" stroke-linecap="round" opacity=".45"/>`}
  </g>`
}

function cheek(cx, cy, m) {
  if (!m.art.cheek) return ''
  return `<ellipse cx="${cx}" cy="${cy}" rx="7.5" ry="4.2" fill="${m.art.palette.accent}" opacity=".36"/>`
}

function mouth(cx, cy, m, wide = false) {
  const p = m.art.palette
  const w = wide ? 17 : 12
  if (m.art.fierce) {
    return `<path d="M${cx - w} ${cy} Q${cx} ${cy + 7} ${cx + w} ${cy}" fill="none" stroke="${p.dark}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${cx - 10} ${cy + 1.5} l2.5 5 l2.5 -5 Z" fill="#fff8ea"/>
      <path d="M${cx + 5} ${cy + 1.5} l2.5 5 l2.5 -5 Z" fill="#fff8ea"/>`
  }
  return `<path d="M${cx - w * 0.55} ${cy} Q${cx} ${cy + 6} ${cx + w * 0.55} ${cy}" fill="none" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy + 1.4}" r="1.6" fill="${p.dark}" opacity=".7"/>`
}

function sparkles(id, coords = []) {
  return coords.map(([x, y, s = 1, o = .9], i) =>
    `<g class="m-spark" style="animation-delay:${i * .55}s" transform="translate(${x} ${y}) scale(${s})" opacity="${o}">
      <path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" fill="${'currentColor'}"/>
    </g>`).join('')
}

function orb(cx, cy, r, color, delay = 0, opacity = .9) {
  return `<g class="m-orb" style="animation-delay:${delay}s">
    <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${color}" opacity="${opacity * .18}" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>
    <circle cx="${cx - r * .3}" cy="${cy - r * .3}" r="${r * .32}" fill="#fff" opacity=".8"/>
  </g>`
}

// ── Quadruped: kits, wolves, bears, stags, drakes, seedlings ──────────────
function quad(m, id) {
  const a = m.art, p = a.palette, pose = a.pose, fierce = a.fierce || false
  const bear = pose === 'bear'
  const stag = pose === 'stag'
  const drake = pose === 'drake'
  const sprout = pose === 'sprout'
  const cat = pose === 'cat'
  const bodyRx = bear ? 55 : stag ? 47 : drake ? 51 : 47
  const bodyRy = bear ? 37 : 33
  const headR = bear ? 40 : drake ? 42 : stag ? 38 : 40
  const headY = bear ? 88 : 91
  const headX = 100
  const legY = 161
  const glow = a.palette.glow

  let back = ''
  // Tail (behind body)
  const tails = {
    flame: `<path d="M137 151 C166 154 181 131 169 108 C180 128 173 157 139 162 Z" fill="url(#${id}-accent)"/>
      <path d="M142 152 C160 151 170 137 163 119 C171 138 162 155 143 157 Z" fill="${p.light}" opacity=".8"/>`,
    'flame-double': `<g opacity=".95"><path d="M136 150 C160 151 173 135 165 114 C177 132 169 156 139 159 Z" fill="url(#${id}-accent)"/><path d="M144 154 C164 156 179 140 173 121 C183 142 170 162 145 162 Z" fill="${p.accent}" opacity=".8"/></g>`,
    leaf: `<g class="m-tail" style="transform-origin:140px 148px">
      <path d="M138 148 C156 150 164 136 164 124" fill="none" stroke="${p.dark}" stroke-width="4" stroke-linecap="round"/>
      <path d="M158 132 C166 116 180 116 185 124 C177 134 168 138 158 132 Z" fill="${p.base}"/>
      <path d="M154 138 C158 122 170 116 179 116 C174 126 166 136 154 138 Z" fill="${p.light}" opacity=".85"/>
      <path d="M161 129 C163 121 170 117 176 118" fill="none" stroke="${p.dark}" stroke-width="1.4" opacity=".6"/>
    </g>`,
    wisp: `<g class="m-tail" style="transform-origin:140px 150px">
      <path d="M138 150 C162 155 174 139 168 121 C182 137 174 163 138 160 Z" fill="url(#${id}-body2)" opacity=".85"/>
      <path d="M145 150 C159 150 166 141 163 130 C171 142 164 156 146 155 Z" fill="${p.accent}" opacity=".28" filter="url(#${id}-soft)"/>
    </g>`,
    'drake': `<g class="m-tail" style="transform-origin:140px 148px">
      <path d="M136 146 C167 152 182 126 172 102 C182 120 176 144 160 152 C150 157 142 157 136 156 Z" fill="url(#${id}-body2)"/>
      <path d="M162 111 l8 -9 l2 12 l10 -3 l-8 12 Z" fill="${p.accent}" opacity=".9"/>
    </g>`,
    thunder: `<g class="m-tail m-glow" style="transform-origin:142px 146px">
      <path d="M142 151 L169 138 L157 133 L181 111 L160 126 L168 129 L144 148 Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>
    </g>`,
    void: `<g class="m-tail" style="transform-origin:140px 148px">
      <path d="M138 150 C168 155 181 128 168 105 C184 120 180 149 156 158 C148 161 142 158 138 156 Z" fill="url(#${id}-body2)"/>
      <circle cx="172" cy="119" r="2.4" fill="${p.accent}"/><circle cx="161" cy="146" r="1.8" fill="${p.accent}"/><circle cx="179" cy="132" r="1.4" fill="#fff"/>
    </g>`
  }
  back += tails[a.tail] || tails.flame

  // Wings (behind)
  const wingShapes = {
    bat: `<path d="M98 106 C74 89 51 65 20 68 C34 84 35 95 26 111 C46 111 67 120 84 133 Z" fill="url(#${id}-body2)"/>
      <path d="M90 111 C66 101 45 86 29 78 C38 92 40 101 35 110 C52 111 69 119 82 128 Z" fill="${p.accent}" opacity=".32"/>
      <path d="M96 106 L52 72 M94 112 L43 87 M92 119 L35 104" stroke="${p.dark}" stroke-width="2.2" opacity=".55"/>`,
    water: `<path d="M98 108 C72 96 52 72 22 74 C38 89 39 101 29 116 C52 114 73 123 88 136 Z" fill="url(#${id}-body2)" opacity=".95"/>
      <path d="M91 111 C67 105 48 92 33 88 C42 99 43 107 38 114 C55 114 72 121 84 130 Z" fill="${p.accent}" opacity=".38"/>
      <path d="M96 106 C78 103 58 100 35 96 M93 114 C76 113 59 111 40 110" stroke="${p.light}" stroke-width="1.6" opacity=".55"/>`,
    leaf: `<path d="M97 107 C71 100 51 75 20 79 C35 92 37 103 28 118 C50 114 71 124 86 135 Z" fill="url(#${id}-body2)"/>
      <path d="M93 107 C69 104 49 93 31 88 C42 98 44 106 39 114 C57 113 74 120 86 129 Z" fill="${p.accent}" opacity=".36"/>
      <path d="M96 104 C74 99 54 92 33 86 M92 112 C72 110 54 108 37 108" stroke="${p.light}" stroke-width="1.8" opacity=".5"/>`,
    storm: `<path d="M98 107 C73 91 50 68 20 71 C35 86 36 97 27 113 C48 112 69 121 85 134 Z" fill="url(#${id}-body2)"/>
      <path d="M90 111 C66 103 46 90 31 83 C40 95 41 103 36 111 C53 112 70 120 83 128 Z" fill="${p.accent}" opacity=".4"/>
      <path d="M96 105 L54 76 M93 113 L43 92 M90 121 L34 110" stroke="${p.light}" stroke-width="1.6" opacity=".65"/>`,
    void: `<path d="M98 107 C73 89 49 67 18 72 C34 88 35 99 25 115 C47 113 69 122 85 135 Z" fill="url(#${id}-body2)"/>
      <path d="M90 111 C66 103 46 90 31 83 C40 95 41 103 36 111 C53 112 70 120 83 128 Z" fill="${p.accent}" opacity=".22"/>
      <circle cx="50" cy="86" r="1.6" fill="${p.accent}"/><circle cx="34" cy="101" r="1.2" fill="#fff"/><circle cx="66" cy="111" r="1.4" fill="${p.accent}"/>`
  }
  if (a.wings) {
    back = `<g class="m-wing-l" style="transform-origin:100px 108px">${wingShapes[a.wings]}</g>
      <g class="m-wing-r" style="transform-origin:100px 108px"><g transform="translate(200 0) scale(-1 1)">${wingShapes[a.wings]}</g></g>` + back
  }

  // Hind legs / feet
  const footColor = p.dark
  const legs = `
    <ellipse cx="${100 - bodyRx * .58}" cy="${legY}" rx="16" ry="12" fill="${footColor}"/>
    <ellipse cx="${100 + bodyRx * .58}" cy="${legY}" rx="16" ry="12" fill="${footColor}"/>
    <ellipse cx="${100 - bodyRx * .32}" cy="${legY + 5}" rx="13" ry="9" fill="${p.base}"/>
    <ellipse cx="${100 + bodyRx * .32}" cy="${legY + 5}" rx="13" ry="9" fill="${p.base}"/>
    <path d="M${100 - bodyRx * .72} ${legY + 3} v4 M${100 - bodyRx * .58} ${legY + 4} v4 M${100 - bodyRx * .44} ${legY + 3} v4" stroke="${p.dark}" stroke-width="1.3" opacity=".55"/>
    <path d="M${100 + bodyRx * .44} ${legY + 3} v4 M${100 + bodyRx * .58} ${legY + 4} v4 M${100 + bodyRx * .72} ${legY + 3} v4" stroke="${p.dark}" stroke-width="1.3" opacity=".55"/>
  `

  // Body
  let body = `<ellipse cx="100" cy="140" rx="${bodyRx}" ry="${bodyRy}" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="145" rx="${bodyRx * .62}" ry="${bodyRy * .58}" fill="url(#${id}-belly)" opacity=".92"/>`
  if (bear) {
    body += `<ellipse cx="58" cy="142" rx="19" ry="25" fill="url(#${id}-body2)"/>
      <ellipse cx="142" cy="142" rx="19" ry="25" fill="url(#${id}-body2)"/>
      <ellipse cx="55" cy="160" rx="12" ry="9" fill="${p.dark}"/>
      <ellipse cx="145" cy="160" rx="12" ry="9" fill="${p.dark}"/>`
  } else {
    body += `<ellipse cx="${100 - bodyRx * .66}" cy="151" rx="10" ry="14" fill="url(#${id}-body2)"/>
      <ellipse cx="${100 + bodyRx * .66}" cy="151" rx="10" ry="14" fill="url(#${id}-body2)"/>`
  }

  // Markings
  let mark = ''
  if (a.mark === 'lava' || a.mark === 'cracks') {
    mark = `<g opacity=".75" filter="url(#${id}-glowf)">
      <path d="M75 133 L86 140 L80 148 L91 153 M123 130 L114 137 L121 144 L111 149" fill="none" stroke="${p.accent}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M88 125 l4 4 l-3 4 M112 122 l-4 5 l4 4" fill="none" stroke="${p.light}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
    </g>`
  } else if (a.mark === 'stripes') {
    mark = `<g opacity=".45" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round">
      <path d="M69 137 q6 4 4 10 M132 135 q-6 4 -4 10 M64 146 q5 3 4 8 M136 144 q-5 3 -4 8"/>
    </g>`
  } else if (a.mark === 'spots') {
    mark = `<g opacity=".35" fill="${p.dark}">
      <circle cx="73" cy="138" r="3.4"/><circle cx="127" cy="133" r="2.8"/><circle cx="134" cy="147" r="2.2"/><circle cx="67" cy="150" r="2"/>
    </g>`
  } else if (a.mark === 'scales') {
    mark = `<g opacity=".4" fill="none" stroke="${p.light}" stroke-width="1.5">
      <path d="M68 140 q6 5 12 0 M83 132 q6 5 12 0 M99 140 q6 5 12 0 M116 130 q6 5 12 0 M122 144 q6 5 12 0"/>
    </g>`
  } else if (a.mark === 'moss') {
    mark = `<g opacity=".8">
      <ellipse cx="78" cy="131" rx="12" ry="6" fill="${p.moss || p.dark}"/>
      <ellipse cx="123" cy="145" rx="10" ry="5" fill="${p.moss || p.dark}"/>
      <circle cx="81" cy="127" r="2.4" fill="${p.light}"/><circle cx="119" cy="141" r="2" fill="${p.light}"/>
    </g>`
  } else if (a.mark === 'rune') {
    mark = `<g opacity=".65" stroke="${p.accent}" stroke-width="2" fill="none" filter="url(#${id}-glowf)">
      <path d="M82 137 l6 -7 l6 7 l-6 7 Z M109 145 l5 0 M111.5 142.5 v5"/>
    </g>`
  } else if (a.mark === 'zigzag') {
    mark = `<path d="M73 136 l7 5 l-6 5 l7 4 M126 134 l-7 5 l6 5 l-7 4" fill="none" stroke="${p.accent}" stroke-width="2" opacity=".6" filter="url(#${id}-glowf)"/>`
  } else if (a.mark === 'stars') {
    mark = `<g fill="${p.accent}" opacity=".7"><circle cx="73" cy="137" r="1.8"/><circle cx="128" cy="133" r="1.4"/><circle cx="120" cy="149" r="1.2"/><path d="M83 146 l1 2.6 l2.6 1 l-2.6 1 l-1 2.6 l-1 -2.6 l-2.6 -1 l2.6 -1 Z"/></g>`
  } else if (a.mark === 'bubbles') {
    mark = `<g fill="none" stroke="${p.light}" stroke-width="1.6" opacity=".55"><circle cx="76" cy="138" r="3"/><circle cx="126" cy="133" r="2.2"/><circle cx="120" cy="149" r="3.4"/></g>`
  }

  // Head
  const earY = headY - headR * .72
  let ears = ''
  const earFill = `url(#${id}-body2)`
  if (a.ears === 'fox' || a.ears === 'wolf' || a.ears === 'cat') {
    const sharp = a.ears === 'wolf'
    ears = `<path d="M${headX - 35} ${earY + 8} L${headX - 44} ${earY - (sharp ? 36 : 30)} Q${headX - 18} ${earY - 26} ${headX - 9} ${earY - 2} Z" fill="${earFill}"/>
      <path d="M${headX - 35} ${earY + 2} L${headX - 38} ${earY - 22} Q${headX - 22} ${earY - 16} ${headX - 18} ${earY - 1} Z" fill="${p.accent}" opacity=".55"/>
      <path d="M${headX + 35} ${earY + 8} L${headX + 44} ${earY - (sharp ? 36 : 30)} Q${headX + 18} ${earY - 26} ${headX + 9} ${earY - 2} Z" fill="${earFill}"/>
      <path d="M${headX + 35} ${earY + 2} L${headX + 38} ${earY - 22} Q${headX + 22} ${earY - 16} ${headX + 18} ${earY - 1} Z" fill="${p.accent}" opacity=".55"/>`
  } else if (a.ears === 'bear') {
    ears = `<circle cx="${headX - 30}" cy="${earY - 5}" r="15" fill="${earFill}"/><circle cx="${headX + 30}" cy="${earY - 5}" r="15" fill="${earFill}"/>
      <circle cx="${headX - 30}" cy="${earY - 5}" r="8" fill="${p.accent}" opacity=".35"/><circle cx="${headX + 30}" cy="${earY - 5}" r="8" fill="${p.accent}" opacity=".35"/>`
  } else if (a.ears === 'leaf') {
    ears = `<g class="m-leaf">
      <path d="M${headX - 30} ${headY - 25} C${headX - 58} ${headY - 58} ${headX - 68} ${headY - 28} ${headX - 34} ${headY - 12} Z" fill="${p.base}"/>
      <path d="M${headX - 31} ${headY - 26} C${headX - 52} ${headY - 47} ${headX - 58} ${headY - 32} ${headX - 37} ${headY - 18} Z" fill="${p.light}" opacity=".75"/>
      <path d="M${headX + 30} ${headY - 25} C${headX + 58} ${headY - 58} ${headX + 68} ${headY - 28} ${headX + 34} ${headY - 12} Z" fill="${p.base}"/>
      <path d="M${headX + 31} ${headY - 26} C${headX + 52} ${headY - 47} ${headX + 58} ${headY - 32} ${headX + 37} ${headY - 18} Z" fill="${p.light}" opacity=".75"/>
    </g>`
  } else if (a.ears === 'stag') {
    ears = `<ellipse cx="${headX - 37}" cy="${headY - 13}" rx="15" ry="8" transform="rotate(-28 ${headX - 37} ${headY - 13})" fill="${earFill}"/>
      <ellipse cx="${headX + 37}" cy="${headY - 13}" rx="15" ry="8" transform="rotate(28 ${headX + 37} ${headY - 13})" fill="${earFill}"/>`
  } else if (a.ears === 'dragon') {
    ears = `<path d="M${headX - 30} ${headY - 28} L${headX - 40} ${headY - 52} L${headX - 12} ${headY - 37} Z" fill="${p.dark}"/>
      <path d="M${headX + 30} ${headY - 28} L${headX + 40} ${headY - 52} L${headX + 12} ${headY - 37} Z" fill="${p.dark}"/>`
  }

  // Horns
  let horns = ''
  const hornColor = a.horns === 'crown' ? p.accent : a.horns === 'coral' ? p.accent : a.horns === 'antler' ? '#d8b56b' : p.accent
  if (a.horns === 'crown') {
    horns = `<g filter="url(#${id}-glowf)">
      <path d="M${headX - 36} ${headY - 25} C${headX - 58} ${headY - 50} ${headX - 60} ${headY - 74} ${headX - 48} ${headY - 82} C${headX - 44} ${headY - 62} ${headX - 30} ${headY - 50} ${headX - 22} ${headY - 38} Z" fill="${p.dark}"/>
      <path d="M${headX + 36} ${headY - 25} C${headX + 58} ${headY - 50} ${headX + 60} ${headY - 74} ${headX + 48} ${headY - 82} C${headX + 44} ${headY - 62} ${headX + 30} ${headY - 50} ${headX + 22} ${headY - 38} Z" fill="${p.dark}"/>
      <path d="M${headX - 48} ${headY - 75} l-5 -4 M${headX + 48} ${headY - 75} l5 -4" stroke="${p.accent}" stroke-width="3" stroke-linecap="round"/>
    </g>`
  } else if (a.horns === 'ember') {
    horns = `<path d="M${headX - 22} ${headY - 33} C${headX - 31} ${headY - 50} ${headX - 24} ${headY - 62} ${headX - 14} ${headY - 66} C${headX - 19} ${headY - 51} ${headX - 12} ${headY - 43} ${headX - 9} ${headY - 34} Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>
      <path d="M${headX + 22} ${headY - 33} C${headX + 31} ${headY - 50} ${headX + 24} ${headY - 62} ${headX + 14} ${headY - 66} C${headX + 19} ${headY - 51} ${headX + 12} ${headY - 43} ${headX + 9} ${headY - 34} Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>`
  } else if (a.horns === 'coral') {
    horns = `<g stroke="${hornColor}" stroke-width="4" fill="none" stroke-linecap="round">
      <path d="M${headX - 30} ${headY - 24} q-10 -16 -2 -28 M${headX - 31} ${headY - 43} q-12 -2 -14 -10"/>
      <path d="M${headX + 30} ${headY - 24} q10 -16 2 -28 M${headX + 31} ${headY - 43} q12 -2 14 -10"/>
    </g>`
  } else if (a.horns === 'antler' || a.horns === 'antler-small') {
    const scale = a.horns === 'antler' ? 1 : .55
    horns = `<g stroke="${hornColor}" stroke-width="${4 * scale}" fill="none" stroke-linecap="round" transform="translate(${headX} ${headY - 30})">
      <path d="M-22 0 q-18 -16 -22 -36 M-31 -19 q-13 -2 -18 -12 M-40 -30 q-9 2 -14 -4"/>
      <path d="M22 0 q18 -16 22 -36 M31 -19 q13 -2 18 -12 M40 -30 q9 2 14 -4"/>
    </g>`
  } else if (a.horns === 'crescent') {
    horns = `<g class="m-float" fill="${p.accent}" filter="url(#${id}-glowf)">
      <path d="M${headX - 40} ${headY - 43} a14 14 0 1 0 10 22 a11 11 0 1 1 -10 -22 Z" opacity=".9"/>
      <path d="M${headX + 40} ${headY - 43} a14 14 0 1 1 -10 22 a11 11 0 1 0 10 -22 Z" opacity=".9"/>
    </g>`
  } else if (a.horns === 'spark') {
    horns = `<g fill="${p.accent}" filter="url(#${id}-glowf)">
      <path d="M${headX - 28} ${headY - 30} l-8 -18 l10 5 l3 -15 l6 17 l9 -3 Z"/>
      <path d="M${headX + 28} ${headY - 30} l8 -18 l-10 5 l-3 -15 l-6 17 l-9 -3 Z"/>
    </g>`
  } else if (a.horns === 'void') {
    horns = `<g filter="url(#${id}-glowf)">
      <path d="M${headX - 32} ${headY - 28} C${headX - 56} ${headY - 49} ${headX - 55} ${headY - 70} ${headX - 42} ${headY - 77} C${headX - 41} ${headY - 58} ${headX - 26} ${headY - 48} ${headX - 18} ${headY - 35} Z" fill="${p.dark}"/>
      <path d="M${headX + 32} ${headY - 28} C${headX + 56} ${headY - 49} ${headX + 55} ${headY - 70} ${headX + 42} ${headY - 77} C${headX + 41} ${headY - 58} ${headX + 26} ${headY - 48} ${headX + 18} ${headY - 35} Z" fill="${p.dark}"/>
      <ellipse cx="${headX}" cy="${headY - 56}" rx="15" ry="5" fill="none" stroke="${p.accent}" stroke-width="2" transform="rotate(-12 ${headX} ${headY - 56})"/>
      <circle cx="${headX + 12}" cy="${headY - 58}" r="2.2" fill="${p.accent}"/>
    </g>`
  }

  // Manes behind head
  let mane = ''
  const maneColor = p.accent
  if (a.mane === 'flame' || a.mane === 'inferno') {
    const big = a.mane === 'inferno'
    mane = `<g filter="url(#${id}-glowf)" opacity=".95">
      <path d="M62 115 C44 98 47 78 58 66 C56 86 65 89 70 76 C72 94 84 92 88 80 C92 99 79 111 76 119 Z" fill="${p.accent}"/>
      <path d="M138 115 C156 98 153 78 142 66 C144 86 135 89 130 76 C128 94 116 92 112 80 C108 99 121 111 124 119 Z" fill="${p.accent}"/>
      ${big ? `<path d="M100 48 C88 28 92 12 100 4 C108 12 112 28 100 48 Z" fill="${p.light}" opacity=".9"/>
      <path d="M75 155 C56 150 45 136 48 120 C58 134 68 137 78 144 Z" fill="${p.accent}" opacity=".7"/>
      <path d="M125 155 C144 150 155 136 152 120 C142 134 132 137 122 144 Z" fill="${p.accent}" opacity=".7"/>` : ''}
    </g>`
  } else if (a.mane === 'spark') {
    mane = `<path d="M100 50 C92 36 94 22 100 14 C106 22 108 36 100 50 Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>`
  } else if (a.mane === 'wave') {
    mane = `<g fill="${p.accent}" opacity=".5">
      <path d="M62 116 C44 106 40 87 52 74 C54 91 66 95 72 89 C70 101 76 108 84 111 Z"/>
      <path d="M138 116 C156 106 160 87 148 74 C146 91 134 95 128 89 C130 101 124 108 116 111 Z"/>
    </g>`
  } else if (a.mane === 'leaf') {
    mane = `<g fill="${p.base}" opacity=".9">
      <path d="M68 119 C52 112 48 94 58 82 C62 96 72 100 78 96 C75 107 73 113 68 119 Z"/>
      <path d="M132 119 C148 112 152 94 142 82 C138 96 128 100 122 96 C125 107 127 113 132 119 Z"/>
    </g>`
  } else if (a.mane === 'moss') {
    mane = `<g fill="${p.moss || p.dark}" opacity=".9">
      <path d="M64 118 C52 108 54 90 66 82 C65 96 72 101 80 100 C74 108 70 114 64 118 Z"/>
      <path d="M136 118 C148 108 146 90 134 82 C135 96 128 101 120 100 C126 108 130 114 136 118 Z"/>
      <circle cx="68" cy="88" r="3" fill="${p.accent}"/><circle cx="132" cy="88" r="2.4" fill="${p.accent}"/>
    </g>`
  } else if (a.mane === 'storm') {
    mane = `<g fill="${p.accent}" filter="url(#${id}-glowf)">
      <path d="M62 110 l-16 -20 l13 3 l-5 -19 l18 20 l2 -14 l10 20 Z"/>
      <path d="M138 110 l16 -20 l-13 3 l5 -19 l-18 20 l-2 -14 l-10 20 Z"/>
    </g>`
  } else if (a.mane === 'wisp') {
    mane = `<g fill="${p.accent}" opacity=".3" filter="url(#${id}-soft)">
      <path d="M64 112 C50 94 56 76 70 70 C64 86 74 92 82 86 C78 100 72 107 64 112 Z"/>
      <path d="M136 112 C150 94 144 76 130 70 C136 86 126 92 118 86 C122 100 128 107 136 112 Z"/>
    </g>`
  } else if (a.mane === 'void') {
    mane = `<g fill="${p.accent}" opacity=".22" filter="url(#${id}-soft)">
      <path d="M60 114 C44 92 52 70 68 62 C58 82 72 90 82 82 C76 98 68 107 60 114 Z"/>
      <path d="M140 114 C156 92 148 70 132 62 C142 82 128 90 118 82 C124 98 132 107 140 114 Z"/>
    </g>`
  }

  // Sprout accessory
  let sproutTop = ''
  if (a.sprout || pose === 'sprout') {
    sproutTop = `<g class="m-leaf" transform="translate(100 ${headY - 36})">
      <path d="M0 0 C-4 -18 -18 -27 -32 -25 C-20 -13 -12 -4 0 0 Z" fill="${p.base}"/>
      <path d="M0 0 C4 -18 18 -27 32 -25 C20 -13 12 -4 0 0 Z" fill="${p.light}"/>
      <path d="M0 2 v-18" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>
    </g>`
  }

  // Head shapes and face
  const head = `<g class="m-head">
    ${horns}${ears}
    <ellipse cx="${headX}" cy="${headY + 2}" rx="${headR + 1.5}" ry="${headR + 1.5}" fill="${p.dark}" opacity=".25"/>
    <ellipse cx="${headX}" cy="${headY}" rx="${headR}" ry="${headR * .95}" fill="url(#${id}-body)"/>
    <ellipse cx="${headX}" cy="${headY + headR * .3}" rx="${headR * .62}" ry="${headR * .42}" fill="url(#${id}-belly)" opacity=".9"/>
    ${a.mark === 'diamond' ? `<path d="M100 ${headY - 34} l8 10 l-8 9 l-8 -9 Z" fill="${p.accent}" opacity=".8"/>` : ''}
    ${a.mark === 'zigzag' ? `<path d="M84 ${headY - 28} l6 4 l-4 4 M116 ${headY - 28} l-6 4 l4 4" stroke="${p.accent}" stroke-width="2" fill="none" opacity=".8"/>` : ''}
    ${a.mark === 'rune' ? `<path d="M100 ${headY - 33} l5 7 l-5 7 l-5 -7 Z" fill="none" stroke="${p.accent}" stroke-width="2" opacity=".85" filter="url(#${id}-glowf)"/>` : ''}
    ${a.mark === 'stars' ? `<path d="M100 ${headY - 31} l1.8 4.2 l4.2 1.8 l-4.2 1.8 l-1.8 4.2 l-1.8 -4.2 l-4.2 -1.8 l4.2 -1.8 Z" fill="${p.accent}" opacity=".9"/>` : ''}
    ${eye(headX - 17, headY - 2, m, id, fierce)}
    ${eye(headX + 17, headY - 2, m, id, fierce)}
    ${cheek(headX - 30, headY + 14, m)}
    ${cheek(headX + 30, headY + 14, m)}
    <path d="M${headX} ${headY + 11} q-5 4 0 5 q5 -1 0 -5 Z" fill="${p.dark}" opacity=".85"/>
    ${mouth(headX, headY + 20, m, bear || drake)}
    ${sproutTop}
  </g>`

  // Foreground effects / little details
  let fx = ''
  if (a.mark === 'bubbles' || pose === 'kit' && m.element === 'tide') {
    fx += orb(46, 112, 4.5, p.light, .2, .7) + orb(158, 92, 3.2, p.light, 1.1, .6)
  }
  if (a.wings === 'storm') fx += orb(160, 73, 3.5, p.accent, .4, .85)
  if (a.wings === 'void') fx += sparkles(id, [[160, 68, .9], [182, 112, .55], [48, 72, .6]])
  if (m.stage >= 4) fx += `<g opacity=".8">${sparkles(id, [[30, 96, .7], [172, 74, .8], [46, 54, .5], [158, 158, .5]])}</g>`

  return `<ellipse cx="100" cy="181" rx="53" ry="7" fill="#000" opacity=".3"/>
    <ellipse cx="100" cy="124" rx="72" ry="66" fill="url(#${id}-glow)" opacity=".45"/>
    <g class="m-idle">
      ${back}
      ${legs}
      ${body}
      ${mark}
      ${mane}
      ${head}
      ${fx}
    </g>`
}

// ── Bird / griffin / storm-bat ───────────────────────────────────────────
function bird(m, id) {
  const a = m.art, p = a.palette, griffin = a.pose === 'griffin', bat = a.pose === 'bat', fierce = a.fierce
  const bodyY = 130
  const headY = griffin ? 80 : 84
  const headR = griffin ? 31 : bat ? 31 : 30
  const glow = p.glow

  let tail = `<g class="m-tail" style="transform-origin:100px 155px">
    <path d="M82 154 L64 178 L85 171 L100 184 L115 171 L136 178 L118 154 Z" fill="url(#${id}-body2)"/>
    <path d="M91 158 L84 172 L100 166 L116 172 L109 158 Z" fill="${p.accent}" opacity=".45"/>
  </g>`
  if (a.tail === 'spark') {
    tail = `<g class="m-tail m-glow" style="transform-origin:100px 152px">
      <path d="M95 155 L78 178 L96 172 L104 188 L110 169 L128 177 L108 152 Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>
    </g>`
  } else if (a.tail === 'thunder') {
    tail = `<g class="m-tail m-glow" style="transform-origin:100px 152px">
      <path d="M90 155 L70 179 L93 172 L100 190 L108 170 L132 179 L112 151 Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>
      <path d="M86 162 L74 175 M114 162 L126 175" stroke="${p.light}" stroke-width="2" opacity=".8"/>
    </g>`
  }

  let wings = ''
  if (bat) {
    wings = `<g class="m-wing-l" style="transform-origin:72px 112px">
      <path d="M73 108 C52 92 30 76 12 82 C24 94 22 105 14 117 C33 115 53 123 66 136 Z" fill="${p.dark}"/>
      <path d="M66 110 C49 102 33 94 22 92 C30 101 29 108 25 114 C41 113 57 120 67 129 Z" fill="${p.accent}" opacity=".28"/>
      <path d="M69 109 L37 89 M68 115 L31 104" stroke="${p.base}" stroke-width="2" opacity=".7"/>
    </g>
    <g class="m-wing-r" style="transform-origin:128px 112px"><g transform="translate(200 0) scale(-1 1)">
      <path d="M73 108 C52 92 30 76 12 82 C24 94 22 105 14 117 C33 115 53 123 66 136 Z" fill="${p.dark}"/>
      <path d="M66 110 C49 102 33 94 22 92 C30 101 29 108 25 114 C41 113 57 120 67 129 Z" fill="${p.accent}" opacity=".28"/>
      <path d="M69 109 L37 89 M68 115 L31 104" stroke="${p.base}" stroke-width="2" opacity=".7"/>
    </g></g>`
  } else {
    wings = `<g class="m-wing-l" style="transform-origin:70px 122px">
      <path d="M74 116 C54 104 36 78 16 78 C26 92 24 103 15 118 C34 116 52 126 65 140 Z" fill="url(#${id}-body2)"/>
      <path d="M66 119 C50 112 38 100 27 94 C34 103 33 111 29 116 C43 115 55 121 64 129 Z" fill="${p.accent}" opacity=".35"/>
      <path d="M70 118 L38 92 M68 125 L31 108" stroke="${p.light}" stroke-width="1.8" opacity=".55"/>
    </g>
    <g class="m-wing-r" style="transform-origin:130px 122px"><g transform="translate(200 0) scale(-1 1)">
      <path d="M74 116 C54 104 36 78 16 78 C26 92 24 103 15 118 C34 116 52 126 65 140 Z" fill="url(#${id}-body2)"/>
      <path d="M66 119 C50 112 38 100 27 94 C34 103 33 111 29 116 C43 115 55 121 64 129 Z" fill="${p.accent}" opacity=".35"/>
      <path d="M70 118 L38 92 M68 125 L31 108" stroke="${p.light}" stroke-width="1.8" opacity=".55"/>
    </g></g>`
  }

  let crest = `<path d="M92 ${headY - 30} C88 ${headY - 44} 94 ${headY - 54} 100 ${headY - 58} C106 ${headY - 48} 110 ${headY - 38} 108 ${headY - 30} Z" fill="${p.accent}"/>`
  if (a.crest === 'bolt') crest = `<path d="M100 ${headY - 30} l-10 -18 l11 4 l-4 -20 l16 20 l-10 2 Z" fill="${p.accent}" filter="url(#${id}-glowf)"/>`
  else if (a.crest === 'spark') crest = `<g fill="${p.accent}" filter="url(#${id}-glowf)"><path d="M100 ${headY - 29} l-7 -15 l8 3 l1 -13 l6 12 l8 -2 Z"/></g>`
  else if (a.crest === 'moon') crest = `<g fill="${p.accent}" filter="url(#${id}-glowf)"><path d="M100 ${headY - 40} a15 15 0 1 0 0 26 a11 11 0 1 1 0 -26 Z" opacity=".9"/><circle cx="110" cy="${headY - 31}" r="2" fill="#fff"/></g>`
  else if (a.crest === 'feathers') crest = `<g fill="${p.accent}"><path d="M92 ${headY - 28} q-6 -18 2 -28 q6 12 4 28 Z"/><path d="M104 ${headY - 28} q6 -18 -2 -28 q-6 12 -4 28 Z" opacity=".8"/></g>`

  const horns = a.horns === 'spark' ? `<g fill="${p.accent}" filter="url(#${id}-glowf)">
    <path d="M72 ${headY - 18} l-9 -16 l10 5 l2 -12 l6 14 Z"/><path d="M128 ${headY - 18} l9 -16 l-10 5 l-2 -12 l-6 14 Z"/>
  </g>` : ''

  const feet = griffin ? `<g fill="${p.accent}">
    <path d="M82 168 l-6 12 l4 0 l2 7 l3 -7 l4 5 l1 -10 l7 3 Z"/>
    <path d="M118 168 l6 12 l-4 0 l-2 7 l-3 -7 l-4 5 l-1 -10 l-7 3 Z"/>
  </g>` : `<g stroke="${p.accent}" stroke-width="3.5" stroke-linecap="round">
    <path d="M89 166 v11 M86 177 l-6 5 M89 177 l0 6 M92 177 l6 5"/>
    <path d="M111 166 v11 M108 177 l-6 5 M111 177 l0 6 M114 177 l6 5"/>
  </g>`

  const body = `<ellipse cx="100" cy="${bodyY}" rx="${griffin ? 41 : 37}" ry="${griffin ? 43 : 40}" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="${bodyY + 8}" rx="${griffin ? 27 : 24}" ry="${griffin ? 31 : 29}" fill="url(#${id}-belly)" opacity=".9"/>
    ${a.mark === 'zigzag' ? `<path d="M78 ${bodyY + 2} l7 5 l-5 5 l7 4 M122 ${bodyY} l-7 5 l5 5 l-7 4" fill="none" stroke="${p.accent}" stroke-width="2" opacity=".55"/>` : ''}
    ${a.mark === 'stars' ? `<g fill="${p.accent}" opacity=".7"><circle cx="80" cy="${bodyY}" r="1.5"/><circle cx="122" cy="${bodyY + 10}" r="1.2"/></g>` : ''}
    ${a.wings === 'owl' ? '' : ''}
  </g>`

  const head = `<g class="m-head">
    ${horns}${crest}
    <ellipse cx="100" cy="${headY + 1}" rx="${headR + 1}" ry="${headR + 1}" fill="${p.dark}" opacity=".25"/>
    <ellipse cx="100" cy="${headY}" rx="${headR}" ry="${headR * .95}" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="${headY + 12}" rx="${headR * .56}" ry="${headR * .38}" fill="url(#${id}-belly)" opacity=".9"/>
    ${eye(100 - 14, headY - 2, m, id, fierce, .92)}
    ${eye(100 + 14, headY - 2, m, id, fierce, .92)}
    ${cheek(100 - 25, headY + 12, m)}
    ${cheek(100 + 25, headY + 12, m)}
    <path d="M100 ${headY + 12} l9 5 l-9 8 l-9 -8 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="1"/>
    <path d="M100 ${headY + 18} l0 4" stroke="${p.dark}" stroke-width="1.4" opacity=".7"/>
  </g>`

  return `<ellipse cx="100" cy="181" rx="46" ry="6.5" fill="#000" opacity=".3"/>
    <ellipse cx="100" cy="120" rx="66" ry="62" fill="url(#${id}-glow)" opacity=".45"/>
    <g class="m-idle">
      ${tail}${wings}${feet}${body}${head}
      ${a.tail === 'spark' || a.tail === 'thunder' ? orb(30, 90, 3.2, p.accent, .3, .8) : ''}
      ${m.stage >= 3 ? sparkles(id, [[168, 72, .8], [32, 116, .6]]) : ''}
    </g>`
}

// ── Serpent ──────────────────────────────────────────────────────────────
function serpent(m, id) {
  const a = m.art, p = a.palette
  const bodyPath = 'M58 163 C30 139 45 108 78 112 C111 116 128 141 151 127 C168 117 166 98 154 89'
  const coil = `<path d="${bodyPath}" fill="none" stroke="${p.dark}" stroke-width="32" stroke-linecap="round" opacity=".9"/>
    <path d="${bodyPath}" fill="none" stroke="url(#${id}-body)" stroke-width="27" stroke-linecap="round"/>
    <path d="${bodyPath}" fill="none" stroke="${p.light}" stroke-width="7" stroke-linecap="round" opacity=".23"/>`
  const scales = `<path d="M48 148 q7 3 12 -2 M44 134 q7 3 12 -2 M58 120 q7 3 12 -2 M77 112 q7 3 12 -2 M96 117 q7 3 12 -2 M116 129 q7 3 12 -2 M136 127 q7 3 12 -2" fill="none" stroke="${p.accent}" stroke-width="1.8" opacity=".5"/>`
  const fins = `<g fill="${p.accent}" opacity=".55">
    <path d="M55 150 l-15 1 l11 9 Z"/><path d="M72 118 l-3 -17 l13 12 Z"/><path d="M126 135 l11 -12 l2 15 Z"/>
  </g>`
  const headY = 78
  const horns = `<g stroke="${p.accent}" stroke-width="3.6" fill="none" stroke-linecap="round">
    <path d="M86 ${headY - 20} q-10 -16 -4 -30 M81 ${headY - 39} q-10 0 -14 -8"/>
    <path d="M114 ${headY - 20} q10 -16 4 -30 M119 ${headY - 39} q10 0 14 -8"/>
  </g>`
  const head = `<g class="m-head">
    ${horns}
    <path d="M64 ${headY + 4} q-15 2 -18 -8 q15 -4 20 4 Z" fill="${p.base}"/>
    <path d="M136 ${headY + 4} q15 2 18 -8 q-15 -4 -20 4 Z" fill="${p.base}"/>
    <ellipse cx="100" cy="${headY + 12}" rx="42" ry="34" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="${headY + 22}" rx="27" ry="18" fill="url(#${id}-belly)" opacity=".9"/>
    ${eye(83, headY + 8, m, id, true)}
    ${eye(117, headY + 8, m, id, true)}
    <path d="M100 ${headY + 24} q-4 4 0 5 q4 -1 0 -5 Z" fill="${p.dark}"/>
    ${mouth(100, headY + 30, m, true)}
    <path d="M100 ${headY - 22} l7 9 l-7 8 l-7 -8 Z" fill="${p.accent}" opacity=".8"/>
  </g>`
  return `<ellipse cx="100" cy="181" rx="54" ry="7" fill="#000" opacity=".3"/>
    <ellipse cx="100" cy="125" rx="70" ry="64" fill="url(#${id}-glow)" opacity=".45"/>
    <g class="m-idle">
      ${coil}${scales}${fins}${head}
      ${orb(38, 94, 3.4, p.light, .2, .8)}${orb(162, 80, 2.8, p.light, 1.2, .7)}
      ${m.stage >= 3 ? sparkles(id, [[166, 138, .6], [28, 112, .5]]) : ''}
    </g>`
}

// ── Wisp ─────────────────────────────────────────────────────────────────
function wisp(m, id) {
  const a = m.art, p = a.palette
  const body = `<path d="M100 58 C128 58 142 80 137 106 C134 122 142 136 133 151 C127 162 116 156 110 166 C105 175 98 175 93 166 C87 156 76 162 70 151 C61 136 69 122 66 106 C61 80 72 58 100 58 Z" fill="url(#${id}-body)" opacity=".96"/>
    <path d="M100 68 C120 68 129 85 125 106 C122 120 128 130 122 142 C116 152 108 148 103 156 C100 160 97 160 94 154 C89 147 81 152 76 142 C70 130 76 120 73 106 C69 85 80 68 100 68 Z" fill="${p.light}" opacity=".16"/>`
  const tendrils = `<g stroke="${p.accent}" stroke-width="2.5" fill="none" opacity=".4" stroke-linecap="round">
    <path d="M78 148 q-10 14 3 24 q10 7 5 14"/><path d="M122 148 q10 14 -3 24 q-10 7 -5 14"/></g>`
  const face = `<ellipse cx="100" cy="105" rx="29" ry="26" fill="${p.belly}" opacity=".95"/>
    ${eye(89, 101, m, id, false, .9)}${eye(111, 101, m, id, false, .9)}
    ${cheek(81, 114, m)}${cheek(119, 114, m)}
    ${mouth(100, 116, m)}
    <path d="M100 78 l5 7 l-5 6 l-5 -6 Z" fill="${p.accent}" opacity=".85"/>`
  const arms = `<path d="M68 111 q-12 4 -13 13 q10 2 17 -6 Z" fill="${p.base}"/>
    <path d="M132 111 q12 4 13 13 q-10 2 -17 -6 Z" fill="${p.base}"/>`
  return `<ellipse cx="100" cy="184" rx="36" ry="5" fill="#000" opacity=".2"/>
    <ellipse cx="100" cy="118" rx="58" ry="58" fill="url(#${id}-glow)" opacity=".6"/>
    <g class="m-idle m-float">
      ${body}${tendrils}${arms}${face}
      ${orb(40, 92, 3.6, p.accent, .2, .8)}${orb(160, 112, 2.8, p.light, .9, .7)}${orb(146, 62, 2.2, p.accent, 1.4, .6)}
      ${sparkles(id, [[54, 60, .6], [158, 142, .5], [40, 134, .45]])}
    </g>`
}

// ── Owl ──────────────────────────────────────────────────────────────────
function owl(m, id) {
  const a = m.art, p = a.palette
  const body = `<path d="M56 143 C50 111 70 90 100 90 C130 90 150 111 144 143 C141 165 123 176 100 176 C77 176 59 165 56 143 Z" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="140" rx="28" ry="30" fill="url(#${id}-belly)" opacity=".85"/>
    <g fill="none" stroke="${p.dark}" stroke-width="1.6" opacity=".35">
      <path d="M82 140 q6 6 12 0 M106 140 q6 6 12 0 M88 153 q6 6 12 0 M100 153 q6 6 12 0 M94 165 q6 6 12 0"/>
    </g>
    <g fill="${p.accent}" opacity=".6"><circle cx="79" cy="121" r="1.7"/><circle cx="124" cy="132" r="1.4"/><circle cx="107" cy="112" r="1.2"/></g>`
  const wings = `<g class="m-wing-l" style="transform-origin:62px 126px">
      <path d="M60 120 C44 113 33 122 34 140 C35 157 48 166 61 165 C52 150 53 133 60 120 Z" fill="url(#${id}-body2)"/>
      <path d="M55 130 q-8 10 -5 24" stroke="${p.accent}" stroke-width="1.8" fill="none" opacity=".5"/>
    </g>
    <g class="m-wing-r" style="transform-origin:138px 126px"><g transform="translate(200 0) scale(-1 1)">
      <path d="M60 120 C44 113 33 122 34 140 C35 157 48 166 61 165 C52 150 53 133 60 120 Z" fill="url(#${id}-body2)"/>
      <path d="M55 130 q-8 10 -5 24" stroke="${p.accent}" stroke-width="1.8" fill="none" opacity=".5"/>
    </g></g>`
  const tufts = `<path d="M68 80 L58 53 L83 67 Z" fill="${p.dark}"/><path d="M132 80 L142 53 L117 67 Z" fill="${p.dark}"/>`
  const crest = `<g fill="${p.accent}" filter="url(#${id}-glowf)"><path d="M100 58 a14 14 0 1 0 0 24 a10 10 0 1 1 0 -24 Z" opacity=".95"/><circle cx="111" cy="68" r="1.8" fill="#fff"/></g>`
  const head = `<g class="m-head">${tufts}${crest}
    <ellipse cx="100" cy="100" rx="36" ry="32" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="110" rx="22" ry="20" fill="url(#${id}-belly)" opacity=".85"/>
    <ellipse cx="86" cy="98" rx="12" ry="12" fill="${p.light}" opacity=".28"/>
    <ellipse cx="114" cy="98" rx="12" ry="12" fill="${p.light}" opacity=".28"/>
    ${eye(86, 98, m, id, true, .9)}${eye(114, 98, m, id, true, .9)}
    <path d="M100 106 l7 5 l-7 9 l-7 -9 Z" fill="${p.accent}"/>
    <path d="M100 113 v5" stroke="${p.dark}" stroke-width="1.5" opacity=".7"/>
  </g>`
  const talons = `<g stroke="${p.accent}" stroke-width="3.2" stroke-linecap="round" fill="none">
    <path d="M87 174 v5 M83 181 l-6 4 M87 181 v6 M91 181 l6 4"/>
    <path d="M113 174 v5 M109 181 l-6 4 M113 181 v6 M117 181 l6 4"/>
  </g>`
  return `<ellipse cx="100" cy="184" rx="42" ry="5.5" fill="#000" opacity=".28"/>
    <ellipse cx="100" cy="126" rx="64" ry="60" fill="url(#${id}-glow)" opacity=".5"/>
    <g class="m-idle m-float-soft">
      ${wings}${talons}${body}${head}
      ${orb(38, 84, 3, p.accent, .2, .8)}${orb(164, 108, 2.4, p.accent, 1, .7)}
      ${sparkles(id, [[48, 56, .45], [156, 62, .55], [172, 150, .4]])}
    </g>`
}

// ── Shark ────────────────────────────────────────────────────────────────
function shark(m, id) {
  const a = m.art, p = a.palette
  const body = `<path d="M100 52 C137 65 151 100 144 132 C139 158 124 171 100 175 C76 171 61 158 56 132 C49 100 63 65 100 52 Z" fill="url(#${id}-body)"/>
    <path d="M100 70 C126 81 136 108 131 133 C126 153 116 161 100 164 C84 161 74 153 69 133 C64 108 74 81 100 70 Z" fill="url(#${id}-belly)" opacity=".92"/>
    <path d="M67 96 q-10 3 -15 0 M68 106 q-10 3 -15 0 M69 116 q-10 3 -15 0" stroke="${p.dark}" stroke-width="2" opacity=".4" fill="none"/>`
  const fins = `<path d="M58 126 C38 122 28 132 30 148 C41 142 53 141 62 145 Z" fill="url(#${id}-body2)"/>
    <path d="M142 126 C162 122 172 132 170 148 C159 142 147 141 138 145 Z" fill="url(#${id}-body2)"/>
    <path d="M100 44 C92 27 91 17 100 8 C109 17 108 27 100 44 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="1.5"/>`
  const tail = `<g class="m-tail" style="transform-origin:100px 168px">
    <path d="M100 164 C84 176 62 184 52 178 C68 170 76 160 82 150 Z" fill="${p.dark}"/>
    <path d="M100 164 C116 176 138 184 148 178 C132 170 124 160 118 150 Z" fill="${p.dark}"/>
  </g>`
  const face = `${eye(84, 96, m, id, false, 1)}${eye(116, 96, m, id, false, 1)}
    <path d="M86 116 q14 10 28 0 q-14 4 -28 0 Z" fill="${p.dark}" opacity=".8"/>
    <path d="M90 117 l3 5 l3 -5 l3 5 l3 -5 l3 5 l3 -5 l3 5 l3 -5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    ${cheek(76, 110, m)}${cheek(124, 110, m)}`
  return `<ellipse cx="100" cy="182" rx="44" ry="6" fill="#000" opacity=".28"/>
    <ellipse cx="100" cy="124" rx="62" ry="60" fill="url(#${id}-glow)" opacity=".45"/>
    <g class="m-idle m-float-soft">
      ${tail}${fins}${body}${face}
      ${orb(46, 80, 4, p.light, .2, .6)}${orb(156, 64, 2.8, p.light, .9, .55)}${orb(166, 104, 3.4, p.light, 1.5, .45)}
    </g>`
}

// ── Axolotl ──────────────────────────────────────────────────────────────
function axolotl(m, id) {
  const a = m.art, p = a.palette
  const gill = (side) => {
    const flip = side === 'l'
    const x = flip ? 68 : 132
    const dir = flip ? -1 : 1
    return `<g stroke="${p.accent}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".9">
      <path d="M${x} 87 q${dir * 18} -8 ${dir * 24} -18"/>
      <path d="M${x} 96 q${dir * 22} -2 ${dir * 30} -6"/>
      <path d="M${x} 105 q${dir * 20} 4 ${dir * 26} 12"/>
    </g>
    <g fill="${p.accent}" opacity=".65">
      <circle cx="${x + dir * 24}" cy="69" r="4"/><circle cx="${x + dir * 30}" cy="90" r="3.6"/><circle cx="${x + dir * 26}" cy="117" r="4"/>
    </g>`
  }
  const tail = `<g class="m-tail" style="transform-origin:100px 158px">
    <path d="M100 158 C80 172 62 176 50 168 C68 164 80 154 86 146 Z" fill="${p.base}"/>
    <path d="M100 160 C120 174 138 178 150 170 C132 166 120 156 114 148 Z" fill="${p.base}"/>
    <path d="M90 158 q-2 8 -10 12 M110 158 q2 8 10 12" stroke="${p.light}" stroke-width="1.5" opacity=".5"/>`
  const body = `<ellipse cx="100" cy="131" rx="34" ry="37" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="139" rx="22" ry="25" fill="url(#${id}-belly)" opacity=".92"/>
    <path d="M100 102 C108 102 112 112 110 124 C108 132 100 136 100 136 C100 136 92 132 90 124 C88 112 92 102 100 102 Z" fill="${p.light}" opacity=".18"/>`
  const crest = `<path d="M86 70 q14 -18 28 0 q-4 8 -14 8 q-10 0 -14 -8 Z" fill="${p.accent}" opacity=".75"/>`
  const head = `<g class="m-head">${crest}
    <ellipse cx="100" cy="89" rx="38" ry="32" fill="url(#${id}-body)"/>
    <ellipse cx="100" cy="98" rx="25" ry="18" fill="url(#${id}-belly)" opacity=".9"/>
    ${eye(83, 87, m, id, false, 1)}${eye(117, 87, m, id, false, 1)}
    ${cheek(73, 99, m)}${cheek(127, 99, m)}
    <path d="M92 104 q8 7 16 0" fill="none" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="100" cy="102" r="1.4" fill="${p.dark}" opacity=".7"/>
  </g>`
  const arms = `<ellipse cx="70" cy="137" rx="8" ry="13" transform="rotate(-18 70 137)" fill="${p.base}"/>
    <ellipse cx="130" cy="137" rx="8" ry="13" transform="rotate(18 130 137)" fill="${p.base}"/>
    <ellipse cx="68" cy="174" rx="12" ry="6" fill="${p.base}"/>
    <ellipse cx="132" cy="174" rx="12" ry="6" fill="${p.base}"/>`
  return `<ellipse cx="100" cy="182" rx="40" ry="6" fill="#000" opacity=".25"/>
    <ellipse cx="100" cy="122" rx="64" ry="60" fill="url(#${id}-glow)" opacity=".45"/>
    <g class="m-idle">
      ${tail}${gill('l')}${gill('r')}${arms}${body}${head}
      ${orb(42, 72, 3.6, p.light, .2, .7)}${orb(160, 112, 2.8, p.light, .9, .6)}
    </g>`
}

// ── Public renderer ──────────────────────────────────────────────────────
export function monsterArt(monster, { className = '', decorative = false } = {}) {
  const id = `ma${++artCounter}`
  const m = monster
  let inner
  switch (m.art.build) {
    case 'bird': inner = bird(m, id); break
    case 'serpent': inner = serpent(m, id); break
    case 'wisp': inner = wisp(m, id); break
    case 'owl': inner = owl(m, id); break
    case 'shark': inner = shark(m, id); break
    case 'axolotl': inner = axolotl(m, id); break
    default: inner = quad(m, id); break
  }
  const label = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${m.name} the ${m.element} monster"`
  return `<svg class="monster-art ${className}" viewBox="0 0 200 200" ${label} xmlns="http://www.w3.org/2000/svg">${defs(m, id)}${inner}</svg>`
}

export function silhouetteArt(monster, { className = '' } = {}) {
  return `<div class="silhouette ${className}" aria-hidden="true">${monsterArt(monster, { decorative: true })}</div>`
}

export function elementGlyph(element, className = '') {
  const paths = {
    flame: '<path d="M12 2c2 4-2 5-2 9a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 5 5 9a8 8 0 1 1-16 0c0-5 3-8 6-13z"/>',
    drop: '<path d="M12 2C8 8 4 11 4 15a8 8 0 0 0 16 0c0-4-4-7-8-13z"/>',
    leaf: '<path d="M20 4C10 4 4 9 4 16c0 2 1 4 2 5 2-7 7-10 12-12-4 3-7 7-8 13 9 1 14-6 14-14 0-2-1-4-2-4z"/>',
    bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
    moon: '<path d="M16 3a9 9 0 1 0 5 16A8 8 0 0 1 16 3z"/>'
  }
  return `<svg class="element-glyph ${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${paths[paths[element]] || paths[element] || ''}</svg>`
}

export function eggArt(color = '#7ce495', className = '') {
  const id = `egg${++artCounter}`
  return `<svg class="egg-art ${className}" viewBox="0 0 120 150" aria-hidden="true">
    <defs>
      <radialGradient id="${id}" cx=".35" cy=".25" r=".9">
        <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
        <stop offset=".35" stop-color="${color}"/>
        <stop offset="1" stop-color="#1d2340"/>
      </radialGradient>
      <linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="140" rx="34" ry="6" fill="#000" opacity=".25"/>
    <path d="M60 8C88 8 108 55 108 88c0 31-21 50-48 50S12 119 12 88C12 55 32 8 60 8Z" fill="${color}" opacity=".18" filter="blur(6px)"/>
    <path d="M60 12C85 12 103 56 103 88c0 29-19 46-43 46S17 117 17 88C17 56 35 12 60 12Z" fill="url(#${id})" stroke="${color}" stroke-width="2"/>
    <path d="M60 18C78 18 94 58 94 87c0 24-15 38-34 38S26 111 26 87C26 58 42 18 60 18Z" fill="${color}" opacity=".25"/>
    <path d="M35 55c-4 20-3 42 6 56" stroke="#fff" stroke-width="5" fill="none" opacity=".28" stroke-linecap="round"/>
    <g fill="#fff" opacity=".35"><circle cx="72" cy="52" r="3"/><circle cx="84" cy="78" r="2"/><circle cx="48" cy="94" r="2.5"/><circle cx="65" cy="112" r="2"/></g>
  </svg>`
}
