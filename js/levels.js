/* ============================================================
   TIME REWIND — sector data
   All levels are authored for a 1280 × 720 temporal stage.
   ============================================================ */

const PALETTES = {
  violet: {
    skyTop: '#04060f', skyMid: '#0b1237', skyBottom: '#31194f',
    accent: '#57f2ff', accent2: '#ff5fcd', gold: '#ffd36e',
    far: '#070b1c', mid: '#0a1026', near: '#0c0c22',
    window: '#5d8cff', haze: 'rgba(117,84,255,.13)'
  },
  solar: {
    skyTop: '#060710', skyMid: '#1a1027', skyBottom: '#52242f',
    accent: '#ffb75e', accent2: '#4fe6ff', gold: '#ffe08a',
    far: '#0b0b1c', mid: '#160e24', near: '#130c1c',
    window: '#ff915c', haze: 'rgba(255,122,75,.12)'
  },
  aurora: {
    skyTop: '#030b12', skyMid: '#07232e', skyBottom: '#0c4c4b',
    accent: '#5bffd5', accent2: '#8d7dff', gold: '#f9f49a',
    far: '#051019', mid: '#061a22', near: '#05121b',
    window: '#3ef5c7', haze: 'rgba(47,255,197,.09)'
  },
  crimson: {
    skyTop: '#09050b', skyMid: '#210915', skyBottom: '#4b1424',
    accent: '#ff6b88', accent2: '#6eb7ff', gold: '#ffcf7b',
    far: '#0e0812', mid: '#180a16', near: '#150813',
    window: '#ff5d7e', haze: 'rgba(255,58,104,.12)'
  },
  prism: {
    skyTop: '#070511', skyMid: '#161239', skyBottom: '#2a205d',
    accent: '#c48cff', accent2: '#5effc1', gold: '#ffe17b',
    far: '#09081c', mid: '#101029', near: '#0e0b20',
    window: '#b187ff', haze: 'rgba(176,112,255,.11)'
  },
  vault: {
    skyTop: '#06101a', skyMid: '#0b2334', skyBottom: '#233953',
    accent: '#ffd36e', accent2: '#65d7ff', gold: '#ffe6a4',
    far: '#07111d', mid: '#0a1928', near: '#091420',
    window: '#ffc55c', haze: 'rgba(255,204,91,.09)'
  },
  falls: {
    skyTop: '#08040f', skyMid: '#1a0d31', skyBottom: '#3b1b55',
    accent: '#ff72cf', accent2: '#5cecff', gold: '#ffdd85',
    far: '#0a0718', mid: '#130a24', near: '#10081d',
    window: '#ff69c8', haze: 'rgba(255,83,198,.1)'
  },
  garden: {
    skyTop: '#030b0a', skyMid: '#08251f', skyBottom: '#124037',
    accent: '#72ffbf', accent2: '#e1ff67', gold: '#ffe990',
    far: '#05110f', mid: '#071b17', near: '#061511',
    window: '#6fffc0', haze: 'rgba(91,255,180,.08)'
  },
  fracture: {
    skyTop: '#0b0404', skyMid: '#270b10', skyBottom: '#521b1a',
    accent: '#ff8a5c', accent2: '#5ee8ff', gold: '#ffe08a',
    far: '#100606', mid: '#1b0909', near: '#160707',
    window: '#ff8052', haze: 'rgba(255,104,66,.13)'
  },
  zero: {
    skyTop: '#02050d', skyMid: '#0a1332', skyBottom: '#231b4c',
    accent: '#9ffcff', accent2: '#b793ff', gold: '#ffeaaa',
    far: '#050916', mid: '#081020', near: '#070b19',
    window: '#b9eaff', haze: 'rgba(150,211,255,.1)'
  }
};

const level = (data) => ({
  hints: [],
  checkpoints: [],
  cores: [],
  energy: [],
  enemies: [],
  hazards: [],
  ...data
});

export const LEVELS = [
  level({
    id: 'first-echo',
    number: '01',
    name: 'FIRST ECHO',
    tag: 'ENTRY VECTOR',
    sub: 'Reach the exit gate.',
    introKicker: 'SECTOR 01 // TEMPORAL ENTRY',
    palette: PALETTES.violet,
    spawn: { x: 92, y: 620 },
    portal: { x: 1190, y: 590 },
    platforms: [
      { x: 0, y: 620, w: 360, h: 100 },
      { x: 470, y: 620, w: 250, h: 100 },
      { x: 836, y: 590, w: 444, h: 130 },
      { x: 748, y: 506, w: 92, h: 17, kind: 'crumble' }
    ],
    hazards: [
      { type: 'laser', x: 642, y: 425, w: 12, h: 195, period: 2.8, phase: 0.2, duty: 0.48 }
    ],
    checkpoints: [{ x: 505, y: 620, id: 0 }],
    cores: [
      { x: 566, y: 552 }, { x: 906, y: 514 }, { x: 1086, y: 514 }
    ],
    energy: [{ x: 382, y: 558 }, { x: 784, y: 466 }],
    hints: [
      { triggerX: 0, text: 'Move with <kbd>A</kbd> <kbd>D</kbd> or the arrow keys. Jump with <kbd>SPACE</kbd>. Reach the gate.' },
      { triggerX: 520, text: 'Hold <kbd>R</kbd> or <kbd>SHIFT</kbd> to rewind the last <strong>five seconds</strong>. Release to commit the new timeline.' },
      { triggerX: 760, text: 'Lasers, enemies and crumbling architecture are recorded too. Rewind to undo a fatal mistake.' }
    ]
  }),

  level({
    id: 'split-second',
    number: '02',
    name: 'SPLIT SECOND',
    tag: 'MOVING GEOMETRY',
    sub: 'Ride the drift. Reach the gate.',
    introKicker: 'SECTOR 02 // KINETIC TRANSIT',
    palette: PALETTES.solar,
    spawn: { x: 78, y: 620 },
    portal: { x: 1212, y: 580 },
    platforms: [
      { x: 0, y: 620, w: 300, h: 100 },
      { x: 358, y: 532, w: 128, h: 18, move: { dx: 170, dy: 0, period: 4.2, phase: 0 } },
      { x: 586, y: 600, w: 282, h: 120 },
      { x: 978, y: 580, w: 302, h: 140 },
      { x: 892, y: 502, w: 76, h: 16, kind: 'phase', period: 3.2, phase: 0.15, duty: 0.56 }
    ],
    hazards: [
      { type: 'laser', x: 796, y: 424, w: 12, h: 176, period: 3.4, phase: 0.65, duty: 0.53 },
      { type: 'saw', x: 318, y: 588, r: 19, moveX: 0, moveY: -48, period: 2.6, phase: 0.2 }
    ],
    enemies: [
      { type: 'drone', x: 840, y: 356, range: 330, fireRate: 2.4 }
    ],
    checkpoints: [{ x: 648, y: 600, id: 0 }],
    cores: [
      { x: 462, y: 468 }, { x: 892, y: 458 }, { x: 1122, y: 518 }
    ],
    energy: [{ x: 612, y: 546 }, { x: 1006, y: 526 }],
    hints: [
      { triggerX: 0, text: 'The carrier platform never stops. Jump with its momentum, or rewind to catch a missed ride.' },
      { triggerX: 610, text: 'That sentinel drone fires chrono bolts. Rewind and the bolts return to their chamber.' }
    ]
  }),

  level({
    id: 'pulse-garden',
    number: '03',
    name: 'PULSE GARDEN',
    tag: 'PHASE BLOOM',
    sub: 'Cross the breathing garden.',
    introKicker: 'SECTOR 03 // OSCILLATION FIELD',
    palette: PALETTES.aurora,
    spawn: { x: 74, y: 620 },
    portal: { x: 1204, y: 600 },
    platforms: [
      { x: 0, y: 620, w: 278, h: 100 },
      { x: 330, y: 560, w: 100, h: 17, kind: 'phase', period: 3.4, phase: 0.05, duty: 0.65 },
      { x: 490, y: 520, w: 100, h: 17, kind: 'phase', period: 3.4, phase: 0.40, duty: 0.65 },
      { x: 650, y: 560, w: 100, h: 17, kind: 'phase', period: 3.4, phase: 0.80, duty: 0.65 },
      { x: 810, y: 520, w: 100, h: 17, kind: 'phase', period: 3.4, phase: 0.18, duty: 0.65 },
      { x: 970, y: 560, w: 100, h: 17, kind: 'phase', period: 3.4, phase: 0.58, duty: 0.65 },
      { x: 1076, y: 600, w: 204, h: 120 }
    ],
    hazards: [
      { type: 'laser', x: 912, y: 432, w: 12, h: 168, period: 2.5, phase: 0.1, duty: 0.42 }
    ],
    enemies: [
      { type: 'drone', x: 770, y: 350, range: 390, fireRate: 2.7 }
    ],
    checkpoints: [{ x: 168, y: 620, id: 0 }],
    cores: [
      { x: 366, y: 500 }, { x: 700, y: 460 }, { x: 1012, y: 500 }
    ],
    energy: [{ x: 538, y: 462 }, { x: 1096, y: 540 }],
    hints: [
      { triggerX: 0, text: 'Phase platforms breathe in and out of existence. They are part of the timeline — rewind to restore one beneath your feet.' },
      { triggerX: 460, text: 'Watch the pulse. When a platform brightens, it is about to return.' }
    ]
  }),

  level({
    id: 'sentinel-run',
    number: '04',
    name: 'SENTINEL RUN',
    tag: 'HOSTILE PATROL',
    sub: 'Break through the sentinel line.',
    introKicker: 'SECTOR 04 // SECURITY PERIMETER',
    palette: PALETTES.crimson,
    spawn: { x: 88, y: 620 },
    portal: { x: 1206, y: 580 },
    platforms: [
      { x: 0, y: 620, w: 380, h: 100 },
      { x: 420, y: 526, w: 92, h: 16, kind: 'crumble' },
      { x: 500, y: 600, w: 300, h: 120 },
      { x: 782, y: 486, w: 96, h: 17, kind: 'phase', period: 3, phase: 0.2, duty: 0.6 },
      { x: 900, y: 580, w: 380, h: 140 }
    ],
    hazards: [
      { type: 'laser', x: 844, y: 398, w: 12, h: 182, period: 3, phase: 0.5, duty: 0.46 },
      { type: 'saw', x: 402, y: 566, r: 18, moveX: 0, moveY: -34, period: 2.2, phase: 0.1 }
    ],
    enemies: [
      { type: 'sentinel', x: 640, y: 600, minX: 530, maxX: 770, speed: 68 },
      { type: 'sentinel', x: 1080, y: 580, minX: 940, maxX: 1232, speed: 74 },
      { type: 'drone', x: 884, y: 310, range: 380, fireRate: 2.5 }
    ],
    checkpoints: [{ x: 230, y: 620, id: 0 }, { x: 624, y: 600, id: 1 }],
    cores: [
      { x: 672, y: 512 }, { x: 812, y: 428 }, { x: 1132, y: 508 }
    ],
    energy: [{ x: 246, y: 552 }, { x: 934, y: 512 }],
    hints: [
      { triggerX: 0, text: 'Sentinels patrol until their eye turns red. Do not let them box you in — rewind their patrol and slip through.' },
      { triggerX: 500, text: 'The crossing is watched from above. Use the phase slab, or time a clean jump.' }
    ]
  }),

  level({
    id: 'prism-drift',
    number: '05',
    name: 'PRISM DRIFT',
    tag: 'ECHO PROTOCOL',
    sub: 'Materialize the impossible bridge.',
    introKicker: 'SECTOR 05 // ECHO MATERIALIZATION',
    palette: PALETTES.prism,
    spawn: { x: 74, y: 620 },
    portal: { x: 1207, y: 580 },
    platforms: [
      { x: 0, y: 620, w: 300, h: 100 },
      { x: 332, y: 560, w: 100, h: 16, kind: 'echo' },
      { x: 458, y: 534, w: 100, h: 16, kind: 'echo' },
      { x: 582, y: 508, w: 84, h: 16, kind: 'echo' },
      { x: 650, y: 600, w: 252, h: 120 },
      { x: 970, y: 580, w: 310, h: 140 },
      { x: 842, y: 486, w: 92, h: 16, kind: 'crumble' }
    ],
    hazards: [
      { type: 'laser', x: 924, y: 424, w: 12, h: 166, period: 2.9, phase: 0.35, duty: 0.5 },
      { type: 'saw', x: 810, y: 540, r: 17, moveX: 95, moveY: -25, period: 3.4, phase: 0.4 }
    ],
    enemies: [
      { type: 'drone', x: 800, y: 322, range: 390, fireRate: 2.6 }
    ],
    checkpoints: [{ x: 218, y: 620, id: 0 }, { x: 708, y: 600, id: 1 }],
    cores: [
      { x: 384, y: 500 }, { x: 514, y: 474 }, { x: 1138, y: 508 }
    ],
    energy: [{ x: 180, y: 552 }, { x: 730, y: 540 }],
    hints: [
      { triggerX: 0, text: 'Echo platforms exist only in the wake of a rewind. <strong>Hold R briefly, then run</strong> — they solidify for four seconds.' },
      { triggerX: 620, text: 'The echo fades. If you fall short, rewind and try the crossing again.' }
    ]
  }),

  level({
    id: 'chrono-vault',
    number: '06',
    name: 'CHRONO VAULT',
    tag: 'SEALED ARCHIVE',
    sub: 'Crack the vault without a key.',
    introKicker: 'SECTOR 06 // RESTRICTED ARCHIVE',
    palette: PALETTES.vault,
    spawn: { x: 72, y: 620 },
    portal: { x: 1228, y: 590 },
    platforms: [
      { x: 0, y: 620, w: 252, h: 100 },
      { x: 306, y: 560, w: 90, h: 16, kind: 'phase', period: 3.1, phase: 0.1, duty: 0.65 },
      { x: 430, y: 538, w: 112, h: 18, move: { dx: 138, dy: 0, period: 3.8, phase: 0.2 } },
      { x: 648, y: 600, w: 222, h: 120 },
      { x: 922, y: 538, w: 100, h: 16, kind: 'echo' },
      { x: 1062, y: 558, w: 74, h: 16, kind: 'echo' },
      { x: 1120, y: 590, w: 160, h: 130 }
    ],
    hazards: [
      { type: 'laser', x: 812, y: 418, w: 12, h: 182, period: 3.2, phase: 0.1, duty: 0.5 },
      { type: 'saw', x: 866, y: 500, r: 18, moveX: 0, moveY: 78, period: 3, phase: 0.25 }
    ],
    checkpoints: [{ x: 130, y: 620, id: 0 }, { x: 708, y: 600, id: 1 }],
    cores: [
      { x: 356, y: 506 }, { x: 740, y: 500 }, { x: 1186, y: 518 }
    ],
    energy: [{ x: 676, y: 538 }, { x: 1002, y: 480 }],
    hints: [
      { triggerX: 0, text: 'The archive has no bridge. Rewind to wake the echo stones, then cross before the afterglow decays.' },
      { triggerX: 640, text: 'Two echo stones. One window. Do not hesitate.' }
    ]
  }),

  level({
    id: 'neon-falls',
    number: '07',
    name: 'NEON FALLS',
    tag: 'VERTICAL DESCENT',
    sub: 'Descend through the ruptured skyline.',
    introKicker: 'SECTOR 07 // THE DROP',
    palette: PALETTES.falls,
    spawn: { x: 120, y: 180 },
    portal: { x: 1215, y: 620 },
    platforms: [
      { x: 40, y: 180, w: 220, h: 22 },
      { x: 336, y: 258, w: 154, h: 20, kind: 'crumble' },
      { x: 556, y: 328, w: 154, h: 20 },
      { x: 786, y: 398, w: 178, h: 22 },
      { x: 560, y: 470, w: 152, h: 20, kind: 'move', move: { dx: 0, dy: 28, period: 3.7, phase: 0.1 } },
      { x: 330, y: 540, w: 164, h: 20 },
      { x: 60, y: 610, w: 208, h: 22 },
      { x: 352, y: 610, w: 164, h: 22 },
      { x: 620, y: 610, w: 184, h: 24 },
      { x: 900, y: 620, w: 380, h: 100 }
    ],
    hazards: [
      { type: 'laser', x: 466, y: 230, w: 12, h: 158, period: 3.1, phase: 0.4, duty: 0.45 },
      { type: 'laser', x: 900, y: 482, w: 220, h: 11, period: 2.6, phase: 0.05, duty: 0.42 },
      { type: 'saw', x: 700, y: 548, r: 19, moveX: 76, moveY: 0, period: 3.2, phase: 0.2 }
    ],
    enemies: [
      { type: 'drone', x: 880, y: 300, range: 400, fireRate: 2.2 },
      { type: 'sentinel', x: 1080, y: 620, minX: 940, maxX: 1250, speed: 70 }
    ],
    checkpoints: [{ x: 872, y: 398, id: 0 }, { x: 120, y: 610, id: 1 }],
    cores: [
      { x: 402, y: 198 }, { x: 788, y: 328 }, { x: 660, y: 550 }
    ],
    energy: [{ x: 604, y: 268 }, { x: 684, y: 550 }],
    hints: [
      { triggerX: 0, text: 'Gravity is not your enemy. Panic is. Descend with intent — and rewind when the skyline fractures.' },
      { triggerX: 380, text: 'The falling platform drifts. It is still recorded. Rewind to reposition it.' }
    ]
  }),

  level({
    id: 'glass-garden',
    number: '08',
    name: 'GLASS GARDEN',
    tag: 'FRAGILE CROSSING',
    sub: 'Run the glass before it remembers breaking.',
    introKicker: 'SECTOR 08 // FRACTURE GARDEN',
    palette: PALETTES.garden,
    spawn: { x: 76, y: 620 },
    portal: { x: 1205, y: 620 },
    platforms: [
      { x: 0, y: 620, w: 300, h: 100 },
      { x: 360, y: 570, w: 112, h: 16, kind: 'crumble' },
      { x: 512, y: 518, w: 112, h: 16, kind: 'crumble' },
      { x: 664, y: 466, w: 112, h: 16, kind: 'crumble' },
      { x: 816, y: 518, w: 112, h: 16, kind: 'crumble' },
      { x: 968, y: 570, w: 112, h: 16, kind: 'crumble' },
      { x: 1080, y: 620, w: 200, h: 100 }
    ],
    hazards: [
      { type: 'laser', x: 930, y: 402, w: 11, h: 168, period: 2.8, phase: 0.15, duty: 0.48 },
      { type: 'saw', x: 610, y: 430, r: 17, moveX: 120, moveY: 0, period: 3.5, phase: 0.2 }
    ],
    enemies: [
      { type: 'drone', x: 700, y: 330, range: 420, fireRate: 2.8 }
    ],
    checkpoints: [{ x: 160, y: 620, id: 0 }],
    cores: [
      { x: 412, y: 510 }, { x: 720, y: 406 }, { x: 1124, y: 558 }
    ],
    energy: [{ x: 568, y: 458 }, { x: 872, y: 458 }],
    hints: [
      { triggerX: 0, text: 'Glass platforms shatter a moment after you land. Keep moving — or rewind to make them whole again.' },
      { triggerX: 520, text: 'The rewind restores the architecture and your position. Use it to steal back a lost stride.' }
    ]
  }),

  level({
    id: 'fracture-core',
    number: '09',
    name: 'FRACTURE CORE',
    tag: 'HOSTILE CORE',
    sub: 'Push through the reactor breach.',
    introKicker: 'SECTOR 09 // CORE BREACH',
    palette: PALETTES.fracture,
    spawn: { x: 86, y: 620 },
    portal: { x: 1212, y: 590 },
    platforms: [
      { x: 0, y: 620, w: 282, h: 100 },
      { x: 338, y: 560, w: 122, h: 18, move: { dx: 166, dy: 0, period: 3.3, phase: 0.15 } },
      { x: 620, y: 600, w: 202, h: 120 },
      { x: 866, y: 538, w: 100, h: 16, kind: 'phase', period: 2.7, phase: 0.05, duty: 0.6 },
      { x: 1020, y: 590, w: 260, h: 130 }
    ],
    hazards: [
      { type: 'laser', x: 764, y: 416, w: 12, h: 184, period: 2.5, phase: 0.2, duty: 0.46 },
      { type: 'laser', x: 1002, y: 452, w: 10, h: 138, period: 3.1, phase: 0.55, duty: 0.5 },
      { type: 'saw', x: 570, y: 544, r: 18, moveX: 0, moveY: 68, period: 2.8, phase: 0.35 }
    ],
    enemies: [
      { type: 'sentinel', x: 706, y: 600, minX: 636, maxX: 800, speed: 76 },
      { type: 'drone', x: 842, y: 330, range: 410, fireRate: 2.1 }
    ],
    checkpoints: [{ x: 160, y: 620, id: 0 }, { x: 676, y: 600, id: 1 }],
    cores: [
      { x: 418, y: 494 }, { x: 698, y: 510 }, { x: 1164, y: 518 }
    ],
    energy: [{ x: 306, y: 552 }, { x: 1072, y: 528 }],
    hints: [
      { triggerX: 0, text: 'The core is collapsing in both directions. Use the moving relay, then rewind the reactor pulse if it catches you.' },
      { triggerX: 620, text: 'A sentinel and a drone. Two threats, one timeline. Make them share the mistake.' }
    ]
  }),

  level({
    id: 'zero-hour',
    number: '10',
    name: 'ZERO HOUR',
    tag: 'FINAL RECURSION',
    sub: 'Close the fracture. Rewrite the end.',
    introKicker: 'SECTOR 10 // ZERO HOUR',
    palette: PALETTES.zero,
    spawn: { x: 80, y: 620 },
    portal: { x: 1210, y: 590 },
    platforms: [
      { x: 0, y: 620, w: 260, h: 100 },
      { x: 302, y: 570, w: 94, h: 16, kind: 'echo' },
      { x: 424, y: 542, w: 92, h: 16, kind: 'echo' },
      { x: 540, y: 590, w: 220, h: 120 },
      { x: 802, y: 540, w: 90, h: 16, kind: 'phase', period: 2.7, phase: 0.2, duty: 0.58 },
      { x: 932, y: 500, w: 102, h: 18, move: { dx: 0, dy: 88, period: 3.4, phase: 0.1 } },
      { x: 1080, y: 590, w: 200, h: 130 },
      { x: 830, y: 430, w: 90, h: 16, kind: 'crumble' }
    ],
    hazards: [
      { type: 'laser', x: 756, y: 422, w: 11, h: 172, period: 2.4, phase: 0.35, duty: 0.44 },
      { type: 'laser', x: 1018, y: 420, w: 10, h: 170, period: 3.2, phase: 0.7, duty: 0.45 },
      { type: 'saw', x: 660, y: 520, r: 18, moveX: 96, moveY: 0, period: 3.1, phase: 0.15 },
      { type: 'saw', x: 892, y: 468, r: 15, moveX: 0, moveY: 48, period: 2.2, phase: 0.55 }
    ],
    enemies: [
      { type: 'sentinel', x: 690, y: 590, minX: 552, maxX: 740, speed: 80 },
      { type: 'drone', x: 860, y: 300, range: 460, fireRate: 1.95 },
      { type: 'drone', x: 1090, y: 360, range: 380, fireRate: 2.6 }
    ],
    checkpoints: [{ x: 118, y: 620, id: 0 }, { x: 620, y: 590, id: 1 }],
    cores: [
      { x: 370, y: 510 }, { x: 844, y: 478 }, { x: 1176, y: 518 }
    ],
    energy: [{ x: 200, y: 552 }, { x: 590, y: 528 }, { x: 980, y: 430 }],
    hints: [
      { triggerX: 0, text: 'Everything you have learned, at once. Echo the bridge, ride the pulse, and take back the last five seconds.' },
      { triggerX: 560, text: 'The final breach. No second chances — only rewinds.' }
    ]
  })
];

export const TOTAL_CORES = LEVELS.reduce((n, l) => n + l.cores.length, 0);
export const SAVE_KEY = 'time-rewind-save-v1';
