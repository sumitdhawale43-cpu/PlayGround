/* ============================================================
   GRAVITY BREAK — level data & compiler
   Levels are declared as simple geometry; compile() expands
   them into a tile grid + entity lists. Pure data, no DOM —
   this file is also loaded by Node (test/validate.js).
   ============================================================ */
(function (root) {
  'use strict';

  var T = 32; // tile size in px

  /* Level object format:
     w           : width in tiles (h is always 17)
     start,goal  : [tx,ty] tiles (entity baseline tile)
     solid       : [x, y, w, h] rects of solid tiles
     spikes      : [x, y, n, dir]  dir 'up' (floor) | 'down' (ceiling)
     lasers      : [x, y, len, axis('v'|'h'), phase(0|1)]
     movers      : [tx, ty, axis, len(px), speed(px/s)]
     shards      : [tx, ty]
     checkpoints : [tx, ty]                                     */

  var LEVELS = [
    {
      name: 'FIRST CONTACT', accent: '#00e5ff', w: 64,
      start: [2, 14], goal: [58, 14],
      solid: [
        [0, 15, 14, 2], [18, 15, 14, 2], [37, 15, 27, 2],
        [25, 12, 3, 1], [46, 13, 4, 1], [51, 11, 3, 1]
      ],
      spikes: [],
      lasers: [],
      movers: [],
      shards: [[4, 13], [14, 11], [21, 12], [26, 10], [34, 11], [47, 11], [52, 9], [55, 13]],
      checkpoints: [[42, 14]]
    },
    {
      name: 'UPSIDE', accent: '#b26bff', w: 64,
      start: [2, 14], goal: [60, 14],
      solid: [
        [0, 0, 64, 1],            // ceiling
        [0, 15, 64, 2],           // floor
        [16, 4, 2, 11],           // wall 1 (must go over via ceiling)
        [38, 5, 2, 10]            // wall 2
      ],
      spikes: [
        [26, 14, 6, 'up'], [26, 1, 6, 'down'],   // kill both -> drop between walls
        [46, 14, 5, 'up']                        // floor trap -> ride ceiling above
      ],
      lasers: [],
      movers: [],
      shards: [[8, 13], [12, 2], [20, 2], [30, 13], [35, 3], [43, 2], [49, 2], [55, 13]],
      checkpoints: [[22, 14], [44, 14]]
    },
    {
      name: 'SPIKE ALLEY', accent: '#ff2d78', w: 72,
      start: [2, 14], goal: [69, 14],
      solid: [
        [0, 15, 20, 2], [25, 15, 15, 2], [45, 15, 27, 2],
        [21, 13, 4, 1], [41, 12, 3, 1],
        [50, 12, 8, 1],             // bridge over long spike field
        [60, 0, 10, 1]              // partial ceiling
      ],
      spikes: [
        [30, 14, 3, 'up'], [35, 14, 2, 'up'],
        [50, 14, 8, 'up'],
        [64, 1, 2, 'down']
      ],
      lasers: [],
      movers: [],
      shards: [[10, 13], [15, 11], [22, 11], [28, 12], [33, 11], [42, 10], [47, 13], [53, 10], [61, 2], [66, 12]],
      checkpoints: [[27, 14], [58, 14]]
    },
    {
      name: 'LASER GRID', accent: '#ffe14d', w: 72,
      start: [2, 14], goal: [68, 14],
      solid: [
        [0, 15, 72, 2]
      ],
      spikes: [],
      lasers: [
        [10, 7, 8, 'v', 0], [11, 7, 8, 'v', 0],
        [18, 7, 8, 'v', 1], [19, 7, 8, 'v', 1],
        [26, 7, 8, 'v', 0], [27, 7, 8, 'v', 0],
        [34, 7, 8, 'v', 1], [35, 7, 8, 'v', 1],
        [42, 7, 8, 'v', 0], [43, 7, 8, 'v', 0],
        [50, 7, 8, 'v', 1], [51, 7, 8, 'v', 1],
        [58, 13, 8, 'h', 0]
      ],
      movers: [],
      shards: [[6, 13], [14, 13], [22, 12], [30, 13], [38, 12], [46, 13], [55, 13], [62, 14]],
      checkpoints: [[36, 14]]
    },    {
      name: 'THE LIFT', accent: '#ffb347', w: 72,
      start: [2, 14], goal: [69, 14],
      solid: [
        [0, 15, 16, 2], [32, 15, 9, 2], [57, 15, 15, 2]
      ],
      spikes: [
        [34, 14, 3, 'up']
      ],
      lasers: [],
      movers: [
        [17, 13, 'x', 12 * T, 105],
        [43, 12, 'x', 10 * T, 120]
      ],
      shards: [[7, 13], [22, 10], [31, 11], [37, 12], [47, 9], [54, 11], [63, 13], [70, 13]],
      checkpoints: [[38, 14], [59, 14]]
    },
    {
      name: 'MIRROR RUN', accent: '#7c4dff', w: 80,
      start: [2, 14], goal: [77, 14],
      solid: [
        [0, 0, 80, 1],
        [0, 15, 80, 2],
        [14, 12, 2, 3],            // step wall (jumpable)
        [42, 4, 2, 11],            // tall wall -> ceiling route
        [70, 12, 2, 3]             // step wall
      ],
      spikes: [
        [24, 14, 8, 'up'], [24, 1, 8, 'down'],   // zone 1 -> mover across
        [52, 14, 6, 'up'], [52, 1, 6, 'down']    // zone 2 -> mover across
      ],
      lasers: [],
      movers: [
        [23, 12, 'x', 11 * T, 150],
        [51, 12, 'x', 8 * T, 150]
      ],
      shards: [[8, 13], [17, 11], [28, 10], [38, 13], [45, 2], [55, 10], [63, 11], [67, 13], [73, 11], [78, 13]],
      checkpoints: [[20, 14], [36, 14], [66, 14], [75, 14]]
    },
    {
      name: 'THE GAUNTLET', accent: '#ff5c39', w: 90,
      start: [2, 14], goal: [87, 14],
      solid: [
        [0, 15, 14, 2], [20, 15, 12, 2], [46, 15, 14, 2], [60, 15, 30, 2],
        [32, 13, 6, 1],
        [60, 0, 20, 1]             // ceiling stretch
      ],
      spikes: [
        [10, 14, 3, 'up'],
        [50, 14, 3, 'up'],
        [68, 14, 6, 'up'],
        [62, 1, 4, 'down']
      ],
      lasers: [
        [26, 7, 8, 'v', 0], [27, 7, 8, 'v', 0],
        [74, 7, 8, 'v', 1], [75, 7, 8, 'v', 1]
      ],
      movers: [
        [13, 13, 'x', 6 * T, 130],
        [32, 13, 'x', 9 * T, 140]
      ],
      shards: [[7, 12], [16, 10], [23, 13], [29, 12], [36, 10], [43, 12], [51, 10], [57, 13], [62, 13], [70, 2], [78, 13], [84, 13]],
      checkpoints: [[21, 14], [47, 14], [65, 14]]
    },
    {
      name: 'GRAVITY BREAK', accent: '#00ffd0', w: 100,
      start: [2, 14], goal: [96, 14],
      solid: [
        [0, 15, 10, 2], [16, 15, 16, 2], [36, 15, 20, 2],
        [56, 15, 20, 2], [80, 15, 20, 2],
        [36, 0, 20, 1], [80, 0, 20, 1],   // ceiling sections
        [86, 4, 2, 11],                    // final tall wall
        [43, 12, 8, 1]                     // bridge over mirror zone (static)
      ],
      spikes: [
        [20, 14, 4, 'up'],
        [44, 14, 6, 'up'], [44, 1, 6, 'down'],
        [70, 14, 3, 'up'],
        [91, 14, 4, 'up'], [91, 1, 4, 'down']
      ],
      lasers: [
        [26, 7, 8, 'v', 0], [27, 7, 8, 'v', 0],
        [64, 7, 8, 'v', 1], [65, 7, 8, 'v', 1]
      ],
      movers: [
        [10, 13, 'x', 5 * T, 130]
      ],
      shards: [[5, 13], [13, 10], [21, 11], [24, 13], [30, 12], [34, 11], [40, 13], [47, 10], [52, 10], [60, 13], [68, 12], [74, 12], [83, 2], [90, 12], [95, 2], [97, 13]],
      checkpoints: [[17, 14], [57, 14], [82, 14]]
    }
  ];

  /* ---------- Compiler ---------- */
  function compile(def, index) {
    var h = 17, w = def.w;
    var grid = new Uint8Array(w * h);          // 0 empty 1 solid 2 spike-up 3 spike-down
    var inBounds = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h; };

    // solid rects
    def.solid.forEach(function (r) {
      for (var y = r[1]; y < r[1] + r[3]; y++)
        for (var x = r[0]; x < r[0] + r[2]; x++)
          if (inBounds(x, y)) grid[y * w + x] = 1;
    });

    // spikes
    var spikes = [];
    def.spikes.forEach(function (s) {
      for (var i = 0; i < s[2]; i++) {
        var x = s[0] + i, y = s[1];
        if (!inBounds(x, y)) continue;
        // don't overwrite solid
        if (grid[y * w + x] !== 1) grid[y * w + x] = (s[3] === 'up') ? 2 : 3;
        spikes.push({ tx: x, ty: y, dir: s[3] });
      }
    });

    // lasers
    var lasers = def.lasers.map(function (l) {
      return { tx: l[0], ty: l[1], len: l[2], axis: l[3], phase: l[4] };
    });

    // movers
    var movers = def.movers.map(function (m, i) {
      return {
        id: i, tx: m[0], ty: m[1],
        axis: m[2], travel: m[3], speed: m[4],
        x: m[0] * T, y: m[1] * T,
        w: 3 * T, h: 14, dir: 1, u: 0, dx: 0, dy: 0
      };
    });

    var shards = def.shards.map(function (s, i) {
      return { id: i, x: s[0] * T + T / 2, y: s[1] * T + T / 2, tx: s[0], ty: s[1], taken: false };
    });

    var checkpoints = def.checkpoints.map(function (c, i) {
      return { id: i, x: c[0] * T + T / 2, y: c[1] * T, tx: c[0], ty: c[1], active: false };
    });

    return {
      index: index, def: def,
      name: def.name, accent: def.accent,
      w: w, h: h,
      grid: grid,
      spikes: spikes, lasers: lasers, movers: movers,
      shards: shards, checkpoints: checkpoints,
      start: { tx: def.start[0], ty: def.start[1] },
      goal: { tx: def.goal[0], ty: def.goal[1] }
    };
  }

  var api = {
    TILE: T,
    LEVEL_COUNT: LEVELS.length,
    LEVELS: LEVELS,
    compile: compile
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GBLevels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
