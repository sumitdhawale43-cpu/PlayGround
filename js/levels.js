/* ============================================================
   SHADOW HEIST — facility data
   Tile coordinates, hand-authored routes, patrols and security.
   ============================================================ */
(() => {
  "use strict";

  const COLS = 40;
  const ROWS = 24;

  function blankGrid() {
    return Array.from({ length: ROWS }, (_, y) =>
      Array.from({ length: COLS }, (_, x) =>
        x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 ? "#" : "."
      )
    );
  }
  const put = (g, x, y, ch) => {
    if (x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1) g[y][x] = ch;
  };
  const open = (g, x, y) => put(g, x, y, ".");
  const hWall = (g, x1, x2, y) => {
    for (let x = x1; x <= x2; x++) put(g, x, y, "#");
  };
  const vWall = (g, x, y1, y2) => {
    for (let y = y1; y <= y2; y++) put(g, x, y, "#");
  };
  const wallRect = (g, x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(g, xx, yy, "#");
  };
  const ventRect = (g, x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(g, xx, yy, "V");
  };

  const THEMES = {
    gallery: {
      floor: "#111b22", floorAlt: "#152129", floorLine: "rgba(154,188,181,.045)",
      wall: "#172127", wallTop: "#233039", wallEdge: "#31454e",
      accent: "#ffc36a", accent2: "#74edd2", fog: "#03070a",
      light: "255,196,119", metal: "#28373a", mood: "WARM"
    },
    glass: {
      floor: "#0d1a23", floorAlt: "#11222c", floorLine: "rgba(133,190,214,.05)",
      wall: "#13202a", wallTop: "#1d3340", wallEdge: "#2b5264",
      accent: "#79d7ff", accent2: "#a9f5e4", fog: "#02070b",
      light: "132,212,255", metal: "#24353f", mood: "COLD"
    },
    blackout: {
      floor: "#0d1916", floorAlt: "#11211c", floorLine: "rgba(128,210,177,.045)",
      wall: "#121e1a", wallTop: "#1a2c26", wallEdge: "#2d5145",
      accent: "#71f7c1", accent2: "#d2ff82", fog: "#020706",
      light: "104,255,196", metal: "#20312d", mood: "GREEN"
    },
    docks: {
      floor: "#161819", floorAlt: "#1b1e1f", floorLine: "rgba(208,170,118,.045)",
      wall: "#211d18", wallTop: "#322a20", wallEdge: "#5b4730",
      accent: "#ffb75d", accent2: "#f8795d", fog: "#070505",
      light: "255,171,92", metal: "#3a2e22", mood: "AMBER"
    },
    crown: {
      floor: "#11131e", floorAlt: "#151827", floorLine: "rgba(164,153,229,.05)",
      wall: "#17182a", wallTop: "#252744", wallEdge: "#454477",
      accent: "#c7a8ff", accent2: "#6ff2d1", fog: "#03040a",
      light: "187,156,255", metal: "#2b2b44", mood: "VIOLET"
    }
  };

  /* ============================================================
     MISSION 01 — THE GILDED GALLERY
     ============================================================ */
  function galleryMap() {
    const g = blankGrid();
    // private collection wing
    hWall(g, 14, 29, 4);
    hWall(g, 14, 29, 18);
    vWall(g, 14, 4, 18);
    vWall(g, 29, 4, 18);
    open(g, 21, 4); open(g, 22, 18); open(g, 14, 9); open(g, 14, 15); open(g, 29, 8); open(g, 29, 14);
    wallRect(g, 18, 8, 2, 1);
    wallRect(g, 23, 14, 2, 1);
    // service room / start
    hWall(g, 1, 11, 17); vWall(g, 11, 17, 22); open(g, 11, 20);
    // secure office
    hWall(g, 1, 8, 7); vWall(g, 8, 2, 7); open(g, 8, 4);
    // vault
    vWall(g, 31, 1, 8); hWall(g, 31, 38, 8); open(g, 31, 5);
    // extraction room
    hWall(g, 30, 38, 17); vWall(g, 30, 17, 22); open(g, 30, 20);
    // small service baffles for cover
    hWall(g, 1, 9, 12); open(g, 5, 12);
    hWall(g, 2, 7, 15);
    // concealed crawlspace under the south wall
    ventRect(g, 12, 21, 10, 1);
    ventRect(g, 22, 19, 1, 3);
    ventRect(g, 8, 22, 3, 1);
    return {
      tiles: g,
      spawn: [5, 20],
      exit: [36, 21],
      objectives: [
        { x: 35, y: 3, name: "SAPPHIRE IDOL", short: "STEAL THE SAPPHIRE IDOL", kind: "gem" }
      ],
      loot: [
        { x: 21, y: 13, name: "Gilded Watch", value: 500 },
        { x: 2, y: 2, name: "Silver Candelabra", value: 350 }
      ],
      hiding: [
        { x: 2, y: 4, type: "locker" }, { x: 12, y: 20, type: "locker" },
        { x: 28, y: 16, type: "locker" }, { x: 34, y: 19, type: "locker" },
        { x: 37, y: 7, type: "cabinet" }
      ],
      terminals: [
        { x: 5, y: 4, disables: "cameras", label: "SECURITY TERMINAL" }
      ],
      cameras: [
        { x: 16, y: 5, angle: 0.72, sweep: 0.72, speed: 0.55, phase: 0.3, range: 255, fov: 1.18 }
      ],
      lasers: [],
      guards: [
        { name: "Gallery Patrol", path: [[17, 6], [27, 6], [27, 16], [17, 16]], speed: 39, range: 230, fov: 1.22 },
        { name: "East Watch", path: [[33, 10], [34, 14], [31, 15], [30, 10]], speed: 35, range: 220, fov: 1.16 }
      ],
      lights: [
        { x: 21, y: 11, r: 7.2, color: "255,194,112", intensity: 0.9 },
        { x: 35, y: 5, r: 5.2, color: "255,202,128", intensity: 0.8 },
        { x: 5, y: 4, r: 3.2, color: "111,242,209", intensity: 0.55 },
        { x: 21, y: 20, r: 5.5, color: "126,166,178", intensity: 0.5 },
        { x: 31, y: 2, r: 3.5, color: "126,166,178", intensity: 0.45 },
        { x: 6, y: 14, r: 4.5, color: "255,194,112", intensity: 0.5 },
        { x: 5, y: 20, r: 4.6, color: "255,194,112", intensity: 0.62 }
      ]
    };
  }

  /* ============================================================
     MISSION 02 — THE GLASS HOUSE
     ============================================================ */
  function glassMap() {
    const g = blankGrid();
    // central glass atrium
    hWall(g, 16, 25, 7); hWall(g, 16, 25, 16);
    vWall(g, 16, 7, 16); vWall(g, 25, 7, 16);
    open(g, 21, 7); open(g, 21, 16); open(g, 16, 11); open(g, 25, 11);
    wallRect(g, 18, 9, 2, 1);
    wallRect(g, 23, 9, 2, 1);
    wallRect(g, 18, 13, 2, 1);
    wallRect(g, 23, 13, 2, 1);
    // loading dock
    hWall(g, 14, 28, 17); vWall(g, 14, 17, 22); vWall(g, 28, 17, 22);
    open(g, 21, 17); open(g, 21, 16);
    // wing walls
    vWall(g, 13, 1, 17); open(g, 13, 5); open(g, 13, 12);
    vWall(g, 28, 1, 17); open(g, 28, 5); open(g, 28, 12);
    // lower rooms
    hWall(g, 1, 13, 17); vWall(g, 13, 17, 22); open(g, 6, 17); open(g, 13, 20);
    hWall(g, 29, 38, 17); vWall(g, 29, 17, 22); open(g, 29, 20);
    // display plinths
    wallRect(g, 5, 7, 2, 2);
    wallRect(g, 33, 7, 2, 2);
    // vent crawl beneath the whole east wing
    ventRect(g, 13, 22, 17, 1);
    ventRect(g, 2, 22, 8, 1);
    ventRect(g, 30, 22, 8, 1);
    ventRect(g, 21, 18, 1, 1);
    return {
      tiles: g,
      spawn: [21, 21],
      exit: [5, 21],
      objectives: [
        { x: 4, y: 3, name: "ROSE DIAMOND", short: "TAKE THE ROSE DIAMOND", kind: "gem" },
        { x: 35, y: 3, name: "MIRROR MASK", short: "TAKE THE MIRROR MASK", kind: "mask" }
      ],
      loot: [
        { x: 20, y: 3, name: "Curator's Key", value: 400 },
        { x: 10, y: 14, name: "Glass Swan", value: 650 }
      ],
      hiding: [
        { x: 2, y: 14, type: "locker" }, { x: 10, y: 3, type: "cabinet" },
        { x: 26, y: 14, type: "locker" }, { x: 36, y: 19, type: "locker" },
        { x: 30, y: 2, type: "cabinet" }, { x: 16, y: 21, type: "locker" }
      ],
      terminals: [
        { x: 32, y: 20, disables: "cameras", label: "CCTV HUB" },
        { x: 3, y: 2, disables: "lasers", label: "LASER RELAY" }
      ],
      cameras: [
        { x: 17, y: 8, angle: 0.5, sweep: 0.5, speed: 0.46, phase: 1.2, range: 250, fov: 1.2 },
        { x: 29, y: 3, angle: 2.45, sweep: 0.6, speed: 0.4, phase: 2.4, range: 240, fov: 1.12 }
      ],
      lasers: [
        { x1: 17, y1: 11, x2: 24, y2: 11, period: 4.2, phase: 0.8, duty: 0.55, low: false },
        { x1: 21, y1: 8, x2: 21, y2: 15, period: 5.4, phase: 3.2, duty: 0.62, low: false },
        { x1: 2, y1: 8, x2: 12, y2: 8, period: 3.6, phase: 0.2, duty: 0.5, low: true }
      ],
      guards: [
        { name: "West Curator", path: [[4, 13], [11, 13], [11, 5], [4, 5]], speed: 37, range: 220, fov: 1.2 },
        { name: "East Curator", path: [[35, 13], [29, 13], [29, 4], [36, 4]], speed: 39, range: 230, fov: 1.18 },
        { name: "Atrium Guard", path: [[21, 9], [24, 11], [21, 14], [17, 11]], speed: 35, range: 235, fov: 1.25 }
      ],
      lights: [
        { x: 20, y: 11, r: 8, color: "140,217,255", intensity: 0.9 },
        { x: 4, y: 4, r: 5, color: "120,201,246", intensity: 0.65 },
        { x: 35, y: 4, r: 5, color: "120,201,246", intensity: 0.65 },
        { x: 21, y: 20, r: 4.3, color: "160,196,208", intensity: 0.42 },
        { x: 6, y: 20, r: 3.5, color: "120,201,246", intensity: 0.38 }
      ]
    };
  }

  /* ============================================================
     MISSION 03 — BLACKOUT
     ============================================================ */
  function blackoutMap() {
    const g = blankGrid();
    // start service lockers
    hWall(g, 1, 11, 17); vWall(g, 11, 17, 22); open(g, 11, 20);
    // security control room
    hWall(g, 1, 9, 7); vWall(g, 9, 1, 7); open(g, 9, 4);
    // data vault
    vWall(g, 30, 1, 8); hWall(g, 30, 38, 8); open(g, 34, 8);
    // extraction room
    hWall(g, 30, 38, 17); vWall(g, 30, 17, 22); open(g, 30, 20);
    // server farm shell
    hWall(g, 14, 28, 5); hWall(g, 14, 28, 18);
    vWall(g, 14, 5, 18); vWall(g, 28, 5, 18);
    open(g, 19, 5); open(g, 21, 18); open(g, 14, 10); open(g, 14, 15); open(g, 28, 8); open(g, 28, 15);
    // server racks
    wallRect(g, 16, 7, 1, 4);
    wallRect(g, 20, 7, 2, 4);
    wallRect(g, 25, 7, 1, 4);
    wallRect(g, 16, 13, 1, 4);
    wallRect(g, 21, 12, 2, 4);
    wallRect(g, 25, 13, 1, 4);
    // partitions / cable trenches
    wallRect(g, 11, 9, 2, 1);
    wallRect(g, 29, 10, 1, 5);
    // vent shafts
    ventRect(g, 12, 22, 18, 1);
    ventRect(g, 2, 22, 9, 1);
    ventRect(g, 30, 22, 8, 1);
    ventRect(g, 13, 12, 1, 1);
    return {
      tiles: g,
      spawn: [4, 20],
      exit: [36, 21],
      objectives: [
        { x: 35, y: 3, name: "QUANTUM CORE", short: "EXTRACT THE QUANTUM CORE", kind: "core" }
      ],
      loot: [
        { x: 7, y: 2, name: "Encrypted Ledger", value: 700 },
        { x: 23, y: 10, name: "Blackbox Drive", value: 450 }
      ],
      hiding: [
        { x: 3, y: 4, type: "locker" }, { x: 12, y: 20, type: "locker" },
        { x: 15, y: 16, type: "cabinet" }, { x: 27, y: 17, type: "locker" },
        { x: 37, y: 7, type: "cabinet" }, { x: 33, y: 19, type: "locker" }
      ],
      terminals: [
        { x: 5, y: 4, disables: "lasers", label: "POWER RELAY" },
        { x: 23, y: 19, disables: "cameras", label: "SERVER CCTV" }
      ],
      cameras: [
        { x: 15, y: 6, angle: 0.62, sweep: 0.55, speed: 0.5, phase: 0.4, range: 245, fov: 1.16 },
        { x: 31, y: 10, angle: -0.6, sweep: 0.44, speed: 0.62, phase: 2.1, range: 240, fov: 1.1 },
        { x: 18, y: 19, angle: -1.8, sweep: 0.65, speed: 0.45, phase: 1.4, range: 220, fov: 1.13 }
      ],
      lasers: [
        { x1: 13, y1: 20, x2: 29, y2: 20, period: 4.6, phase: 0.4, duty: 0.55, low: true },
        { x1: 30, y1: 9, x2: 30, y2: 16, period: 3.9, phase: 1.8, duty: 0.5, low: false },
        { x1: 15, y1: 11, x2: 26, y2: 11, period: 5.2, phase: 3.1, duty: 0.45, low: false }
      ],
      guards: [
        { name: "Server Tech", path: [[17, 9], [27, 9], [27, 16], [17, 16]], speed: 38, range: 225, fov: 1.22 },
        { name: "Vault Sentry", path: [[35, 10], [33, 12], [36, 15], [38, 11]], speed: 34, range: 240, fov: 1.2 },
        { name: "South Rover", path: [[8, 20], [20, 20], [29, 20], [20, 15]], speed: 36, range: 215, fov: 1.18 }
      ],
      lights: [
        { x: 20, y: 11, r: 6.5, color: "98,255,192", intensity: 0.7 },
        { x: 34, y: 5, r: 5.4, color: "157,255,142", intensity: 0.7 },
        { x: 5, y: 4, r: 3.2, color: "98,255,192", intensity: 0.45 },
        { x: 21, y: 20, r: 5, color: "98,255,192", intensity: 0.4 },
        { x: 6, y: 14, r: 4, color: "98,255,192", intensity: 0.38 },
        { x: 5, y: 20, r: 4.4, color: "98,255,192", intensity: 0.5 }
      ]
    };
  }

  /* ============================================================
     MISSION 04 — THE LONG NIGHT
     ============================================================ */
  function docksMap() {
    const g = blankGrid();
    // west storage
    hWall(g, 1, 12, 17); vWall(g, 12, 17, 22); open(g, 12, 20);
    // east extraction
    hWall(g, 28, 38, 17); vWall(g, 28, 17, 22); open(g, 28, 20);
    // north offices
    hWall(g, 1, 9, 6); vWall(g, 9, 1, 6); open(g, 9, 3);
    hWall(g, 30, 38, 6); vWall(g, 30, 1, 6); open(g, 30, 3);
    // cargo stacks
    wallRect(g, 15, 8, 3, 2);
    wallRect(g, 23, 8, 3, 2);
    wallRect(g, 15, 13, 3, 2);
    wallRect(g, 23, 13, 3, 2);
    wallRect(g, 19, 9, 3, 4);
    wallRect(g, 10, 9, 1, 4);
    wallRect(g, 29, 9, 1, 4);
    // catwalk supports
    wallRect(g, 10, 5, 3, 1);
    wallRect(g, 27, 5, 3, 1);
    // loading lanes and vents
    ventRect(g, 13, 22, 15, 1);
    ventRect(g, 2, 22, 9, 1);
    ventRect(g, 30, 22, 8, 1);
    ventRect(g, 13, 17, 1, 3);
    return {
      tiles: g,
      spawn: [20, 21],
      exit: [36, 21],
      objectives: [
        { x: 4, y: 3, name: "IVORY FALCON", short: "SECURE THE IVORY FALCON", kind: "falcon" },
        { x: 35, y: 3, name: "BLACK PEARL", short: "SECURE THE BLACK PEARL", kind: "pearl" }
      ],
      loot: [
        { x: 20, y: 4, name: "Manifest Ledger", value: 600 },
        { x: 7, y: 14, name: "Gold Pocketwatch", value: 450 },
        { x: 33, y: 14, name: "Smuggler's Coin", value: 300 }
      ],
      hiding: [
        { x: 2, y: 4, type: "locker" }, { x: 11, y: 20, type: "locker" },
        { x: 14, y: 11, type: "cabinet" }, { x: 27, y: 16, type: "locker" },
        { x: 36, y: 4, type: "cabinet" }, { x: 36, y: 19, type: "locker" },
        { x: 35, y: 14, type: "locker" }
      ],
      terminals: [
        { x: 20, y: 6, disables: "cameras", label: "DOCK CCTV" },
        { x: 3, y: 20, disables: "lasers", label: "CARGO RELAY" }
      ],
      cameras: [
        { x: 13, y: 7, angle: 0.8, sweep: 0.7, speed: 0.44, phase: 0.5, range: 245, fov: 1.2 },
        { x: 28, y: 7, angle: 2.35, sweep: 0.58, speed: 0.52, phase: 1.8, range: 235, fov: 1.14 },
        { x: 20, y: 15, angle: -1.55, sweep: 0.8, speed: 0.37, phase: 2.6, range: 255, fov: 1.16 }
      ],
      lasers: [
        { x1: 14, y1: 16, x2: 27, y2: 16, period: 4.4, phase: 0.7, duty: 0.5, low: false },
        { x1: 10, y1: 6, x2: 10, y2: 14, period: 5.1, phase: 2.1, duty: 0.55, low: true },
        { x1: 30, y1: 6, x2: 30, y2: 14, period: 4.8, phase: 3.5, duty: 0.5, low: false }
      ],
      guards: [
        { name: "West Cargo Guard", path: [[3, 12], [11, 12], [11, 8], [3, 8]], speed: 36, range: 225, fov: 1.2 },
        { name: "Central Guard", path: [[14, 10], [18, 10], [18, 16], [14, 16]], speed: 40, range: 240, fov: 1.24 },
        { name: "East Cargo Guard", path: [[27, 10], [36, 10], [36, 15], [27, 15]], speed: 37, range: 230, fov: 1.18 },
        { name: "Dockmaster", path: [[19, 19], [26, 19], [33, 19], [26, 13]], speed: 34, range: 235, fov: 1.16 }
      ],
      lights: [
        { x: 8, y: 11, r: 6, color: "255,178,96", intensity: 0.72 },
        { x: 20, y: 11, r: 6.5, color: "255,164,84", intensity: 0.6 },
        { x: 32, y: 11, r: 6, color: "255,178,96", intensity: 0.68 },
        { x: 20, y: 20, r: 5.8, color: "255,142,90", intensity: 0.55 },
        { x: 35, y: 20, r: 4, color: "255,178,96", intensity: 0.48 },
        { x: 5, y: 3, r: 3.4, color: "255,178,96", intensity: 0.38 }
      ]
    };
  }

  /* ============================================================
     MISSION 05 — THE CROWN OF SHADOWS
     ============================================================ */
  function crownMap() {
    const g = blankGrid();
    // central rotunda
    hWall(g, 13, 27, 7); hWall(g, 13, 27, 16);
    vWall(g, 13, 7, 16); vWall(g, 27, 7, 16);
    open(g, 20, 7); open(g, 20, 16); open(g, 13, 11); open(g, 27, 11);
    wallRect(g, 16, 9, 1, 1);
    wallRect(g, 24, 9, 1, 1);
    wallRect(g, 16, 14, 1, 1);
    wallRect(g, 24, 14, 1, 1);
    // north vault
    hWall(g, 30, 38, 7); vWall(g, 30, 1, 7); open(g, 30, 4);
    // west salon
    hWall(g, 1, 9, 8); vWall(g, 9, 1, 8); open(g, 9, 4);
    // east archive
    hWall(g, 31, 38, 9); hWall(g, 31, 38, 16); vWall(g, 31, 9, 16); open(g, 31, 12);
    // south service rooms
    hWall(g, 1, 12, 17); vWall(g, 12, 17, 22); open(g, 12, 20);
    hWall(g, 28, 38, 17); vWall(g, 28, 17, 22); open(g, 28, 20);
    // display plinths
    wallRect(g, 5, 11, 2, 1);
    wallRect(g, 34, 13, 2, 1);
    // ventilation spine
    ventRect(g, 13, 22, 15, 1);
    ventRect(g, 2, 22, 9, 1);
    ventRect(g, 30, 22, 8, 1);
    ventRect(g, 12, 19, 1, 3);
    return {
      tiles: g,
      spawn: [20, 21],
      exit: [36, 21],
      objectives: [
        { x: 4, y: 4, name: "CROWN: THE BASE", short: "RECOVER THE CROWN BASE", kind: "crown" },
        { x: 35, y: 3, name: "CROWN: THE JEWELS", short: "RECOVER THE CROWN JEWELS", kind: "crown" },
        { x: 20, y: 11, name: "CROWN: THE HALO", short: "RECOVER THE CROWN HALO", kind: "crown" }
      ],
      loot: [
        { x: 20, y: 3, name: "Royal Seal", value: 800 },
        { x: 34, y: 14, name: "Obsidian Ring", value: 500 },
        { x: 7, y: 14, name: "Velvet Codex", value: 650 }
      ],
      hiding: [
        { x: 2, y: 4, type: "cabinet" }, { x: 11, y: 20, type: "locker" },
        { x: 14, y: 12, type: "locker" }, { x: 26, y: 15, type: "cabinet" },
        { x: 37, y: 8, type: "locker" }, { x: 33, y: 19, type: "locker" },
        { x: 7, y: 19, type: "locker" }
      ],
      terminals: [
        { x: 3, y: 20, disables: "lasers", label: "PALACE RELAY" },
        { x: 35, y: 18, disables: "cameras", label: "ROYAL CCTV" },
        { x: 7, y: 3, disables: "cameras", label: "ARCHIVE CCTV" }
      ],
      cameras: [
        { x: 14, y: 8, angle: 0.55, sweep: 0.55, speed: 0.5, phase: 0.2, range: 250, fov: 1.2 },
        { x: 29, y: 3, angle: 2.6, sweep: 0.58, speed: 0.46, phase: 1.8, range: 240, fov: 1.12 },
        { x: 30, y: 12, angle: 3.1, sweep: 0.7, speed: 0.4, phase: 3.2, range: 235, fov: 1.16 },
        { x: 18, y: 17, angle: -1.6, sweep: 0.72, speed: 0.55, phase: 0.8, range: 235, fov: 1.14 }
      ],
      lasers: [
        { x1: 14, y1: 9, x2: 26, y2: 9, period: 4.8, phase: 0.4, duty: 0.5, low: false },
        { x1: 14, y1: 14, x2: 26, y2: 14, period: 4.3, phase: 2.2, duty: 0.5, low: true },
        { x1: 30, y1: 10, x2: 30, y2: 15, period: 5.4, phase: 1.1, duty: 0.55, low: false },
        { x1: 13, y1: 20, x2: 27, y2: 20, period: 4.1, phase: 3.1, duty: 0.45, low: true }
      ],
      guards: [
        { name: "Halo Sentinel", path: [[14, 8], [18, 8], [18, 15], [14, 15]], speed: 37, range: 230, fov: 1.2 },
        { name: "Halo Sentinel II", path: [[26, 8], [22, 8], [22, 15], [26, 15]], speed: 39, range: 235, fov: 1.22 },
        { name: "Royal Guard", path: [[35, 10], [33, 12], [36, 15], [38, 11]], speed: 34, range: 245, fov: 1.2 },
        { name: "Vault Warden", path: [[34, 3], [37, 5], [34, 6], [32, 4]], speed: 32, range: 250, fov: 1.24 }
      ],
      lights: [
        { x: 20, y: 11, r: 7.8, color: "191,154,255", intensity: 0.9 },
        { x: 20, y: 20, r: 5.5, color: "124,114,188", intensity: 0.5 },
        { x: 4, y: 4, r: 4.6, color: "218,183,255", intensity: 0.55 },
        { x: 35, y: 3, r: 4.6, color: "218,183,255", intensity: 0.6 },
        { x: 35, y: 12, r: 4, color: "191,154,255", intensity: 0.4 },
        { x: 6, y: 20, r: 3.8, color: "124,114,188", intensity: 0.35 }
      ]
    };
  }

  const LEVELS = [
    {
      num: "01", name: "THE GILDED GALLERY", location: "PRAGUE · CZECHIA", district: "PRIVATE COLLECTION",
      risk: 1, riskLabel: "LOW RISK", par: 150, color: "#ffc36a", theme: "gallery",
      brief: "A private collection. One sapphire idol. Too many cameras. Get in through the service halls and vanish before the morning shift.",
      note: "Stay low. The guards are lazy; the cameras are not. The security office is a soft way in — if you can reach it.",
      build: galleryMap
    },
    {
      num: "02", name: "THE GLASS HOUSE", location: "VIENNA · AUSTRIA", district: "MUSEUM OF LIGHT",
      risk: 2, riskLabel: "ELEVATED", par: 210, color: "#79d7ff", theme: "glass",
      brief: "Two priceless pieces, one glass atrium, and a curator with a taste for overtime. The east and west wings are watched, but the vents beneath them are not.",
      note: "The atrium lasers are on a cycle. Watch the emitters; they blink before the beam returns.",
      build: glassMap
    },
    {
      num: "03", name: "BLACKOUT", location: "HELSINKI · FINLAND", district: "NEXUS DATA VAULT",
      risk: 3, riskLabel: "SEVERE", par: 240, color: "#71f7c1", theme: "blackout",
      brief: "A quantum core sits in a frozen server farm. The grid is deliberately unstable. Cut the power relay, thread the racks, and keep the core cold.",
      note: "Server aisles break sightlines. Use them. If the cameras wake up, the whole floor comes running.",
      build: blackoutMap
    },
    {
      num: "04", name: "THE LONG NIGHT", location: "ROTTERDAM · NETHERLANDS", district: "PIER 14 WAREHOUSE",
      risk: 4, riskLabel: "CRITICAL", par: 270, color: "#ffb75d", theme: "docks",
      brief: "Two stolen heirlooms are moving through a harbor warehouse at dawn. Four guards, three cameras, and more cargo than cover. Get both pieces before the ship sails.",
      note: "The dockmaster walks the south lane. The cargo relay on the west wall kills the laser grid for a handful of seconds.",
      build: docksMap
    },
    {
      num: "05", name: "THE CROWN OF SHADOWS", location: "LONDON · UNITED KINGDOM", district: "ROYAL OBSERVATORY",
      risk: 5, riskLabel: "SUICIDAL", par: 300, color: "#c7a8ff", theme: "crown",
      brief: "The crown has been split into three pieces and scattered across the observatory. Recover all three, survive the royal guard, and make the city disappear behind you.",
      note: "This is the one they said couldn't be done. Three pieces. Four guards. Every route is watched. Make one of them yours.",
      build: crownMap
    }
  ];

  // Lightweight sanity pass: keeps authored content honest in the console.
  const isFloorChar = (ch) => ch === "." || ch === "V";
  LEVELS.forEach((level) => {
    const built = level.build();
    const issues = [];
    const check = (x, y, label) => {
      if (!built.tiles[y] || !isFloorChar(built.tiles[y][x])) issues.push(`${label} (${x},${y}) is not floor`);
    };
    check(built.spawn[0], built.spawn[1], "spawn");
    check(built.exit[0], built.exit[1], "exit");
    built.objectives.forEach((o) => check(o.x, o.y, `objective ${o.name}`));
    built.loot.forEach((o) => check(o.x, o.y, `loot ${o.name}`));
    built.hiding.forEach((o) => check(o.x, o.y, `hiding spot`));
    built.terminals.forEach((o) => check(o.x, o.y, `terminal`));
    built.guards.forEach((g) => g.path.forEach(([x, y]) => check(x, y, `patrol ${g.name}`)));
    if (issues.length) console.warn(`[SHADOW HEIST] ${level.num} layout:`, issues);
  });

  window.LEVELS = LEVELS;
  window.SHADOW_THEMES = THEMES;
  window.SHADOW_GRID = { COLS, ROWS };
})();
