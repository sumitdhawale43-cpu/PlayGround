// ============================================================
// MYSTERY HOUSE – Escape Puzzle
// Single-file HTML5 Canvas game engine
// All graphics drawn with Canvas API; all sound synthesized
// with Web Audio API. No external assets.
// ============================================================

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Constants
  // ------------------------------------------------------------------
  const LOGICAL_W = 960;
  const LOGICAL_H = 640;

  const ITEM_MAX = 8;

  // ------------------------------------------------------------------
  // Canvas setup (letterboxed to logical resolution)
  // ------------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  let dispW = 0, dispH = 0, scale = 1, offX = 0, offY = 0;

  function resize() {
    dispW = canvas.parentElement.clientWidth || window.innerWidth;
    dispH = canvas.parentElement.clientHeight || window.innerHeight;
    // keep a sane minimum
    const sW = Math.max(dispW, 320);
    const sH = Math.max(dispH, 480);
    scale = Math.min(sW / LOGICAL_W, sH / LOGICAL_H);
    offX = (sW - LOGICAL_W * scale) / 2;
    offY = (sH - LOGICAL_H * scale) / 2;
    canvas.width = sW;
    canvas.height = sH;
    // fill background so letterbox area is dark
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, sW, sH);
  }
  window.addEventListener('resize', resize);
  resize();

  function toLogical(px, py) {
    return { x: (px - offX) / scale, y: (py - offY) / scale };
  }

  // ------------------------------------------------------------------
  // Audio engine (Web Audio API synth)
  // ------------------------------------------------------------------
  const AudioEngine = (function () {
    let ctx = null;
    let enabled = true;
    let master = null;

    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { enabled = false; return; }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.12;
      master.connect(ctx.destination);
    }

    function tone(freq, type, duration, vol = 1, when = null) {
      if (!enabled || !ctx) return;
      ensure();
      const t = when === null ? ctx.currentTime : when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + duration);
    }

    function click() {
      tone(900, 'square', 0.04, 0.3);
    }

    function click2() {
      tone(1400, 'square', 0.03, 0.25);
    }

    function pickup() {
      tone(1100, 'sine', 0.12, 0.4);
      setTimeout(() => tone(1650, 'sine', 0.12, 0.4), 80);
    }

    function unlock() {
      [520, 660, 880].forEach((f, i) => tone(f, 'sine', 0.16, 0.35, ctx ? ctx.currentTime + i * 0.06 : 0));
    }

    function doorOpen() {
      tone(180, 'sawtooth', 0.35, 0.35);
      setTimeout(() => tone(300, 'sine', 0.2, 0.25), 150);
    }

    function safeOpen() {
      [600, 900, 1200, 1500].forEach((f, i) => tone(f, 'square', 0.15, 0.3, ctx ? ctx.currentTime + i * 0.05 : 0));
    }

    function combine() {
      tone(700, 'sine', 0.1, 0.4);
      setTimeout(() => tone(1100, 'sine', 0.25, 0.5), 90);
    }

    function deny() {
      tone(140, 'sawtooth', 0.25, 0.4);
      setTimeout(() => tone(110, 'sawtooth', 0.25, 0.4), 120);
    }

    function ambientStart() {
      if (!enabled || !ctx) return;
      // low drone loop
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 110;
      const gain = ctx.createGain();
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      ambientStart.osc = osc;
    }

    function ambientStop() {
      if (ambientStart.osc) { ambientStart.osc.stop(); ambientStart.osc = null; }
    }

    function endingTone(kind) {
      if (!enabled || !ctx) return;
      const t = ctx.currentTime;
      if (kind === 'good') {
        [520, 660, 780, 1040].forEach((f, i) => tone(f, 'sine', 0.3, 0.4, t + i * 0.12));
      } else if (kind === 'ok') {
        [400, 520, 650].forEach((f, i) => tone(f, 'sine', 0.25, 0.35, t + i * 0.1));
      } else {
        [180, 130, 100].forEach((f, i) => tone(f, 'sawtooth', 0.4, 0.4, t + i * 0.15));
      }
    }

    return {
      get enabled() { return enabled; },
      set enabled(v) { enabled = v; },
      init() { ensure(); },
      click, click2, pickup, unlock, doorOpen, safeOpen, combine, deny,
      ambientStart, ambientStop, endingTone,
    };
  })();

  // ------------------------------------------------------------------
  // Game data
  // ------------------------------------------------------------------
  const ITEMS = {
    rusty_key:    { id: 'rusty_key',    name: 'Rusty Key',    glyph: '🗝️',  stack: false },
    torn_note:    { id: 'torn_note',    name: 'Torn Note',    glyph: '📄',  stack: false },
    iron_key:     { id: 'iron_key',     name: 'Iron Key',     glyph: '🔑',  stack: false },
    brass_key:    { id: 'brass_key',    name: 'Brass Key',    glyph: '🗝️',  stack: false },
    candle:       { id: 'candle',       name: 'Candle',       glyph: '🕯️',  stack: false },
    matchbox:     { id: 'matchbox',     name: 'Matchbox',     glyph: '🔥',  stack: false },
    attic_key:    { id: 'attic_key',    name: 'Attic Key',    glyph: '🔑',  stack: false },
    broken_watch: { id: 'broken_watch', name: 'Broken Watch', glyph: '⌚',  stack: false },
    watch_battery:{ id: 'watch_battery',name: 'Watch Battery',glyph: '🔋',  stack: false },
    watch:        { id: 'watch',        name: 'Fixed Watch',  glyph: '⌚',  stack: false },
    rope:         { id: 'rope',         name: 'Rope',         glyph: '🪢',  stack: false },
    master_key:   { id: 'master_key',   name: 'Master Key',   glyph: '🗝️',  stack: false },
  };

  // Combination recipes: [itemA, itemB] -> resultId
  const COMBINES = {
    'broken_watch|watch_battery': 'watch',
    'watch_battery|broken_watch': 'watch',
    'candle|matchbox': 'candle_lit',
    'matchbox|candle': 'candle_lit',
  };

  // Hint database: puzzleId -> staged hints
  const HINTS = {
    foyer_door: [
      'The library door is locked. Look for a key nearby.',
      'Check beneath the rug in the foyer — something sticks out.',
      'Use the Rusty Key on the library door to enter.',
    ],
    study_safe: [
      'The study safe needs a three-digit code.',
      "The Torn Note mentions the study safe combination.",
      'The combination is 4-1-7. Enter it on the safe dial.',
    ],
    attic_door: [
      'The attic door is locked from this side.',
      'Search the study safe — it holds more than just papers.',
      'Use the Attic Key on the door to the attic.',
    ],
    watch_repair: [
      'The broken watch needs a power source.',
      'Look for a battery in the dining room sideboard.',
      'Combine the Broken Watch with the Watch Battery in your inventory.',
    ],
    attic_escape: [
      'The attic is dark. You need light to see the exit clearly.',
      'Combine the Candle with the Matchbox, then light it in the attic.',
      'With a lit candle and the Rope, you can escape through the attic window.',
    ],
  };

  const HINT_STAGE = {}; // puzzleId -> stage index

  // ------------------------------------------------------------------
  // Rooms & objects
  // ------------------------------------------------------------------
  // object: {id, name, x, y, w, h, type, glyph, desc, onExamine, onUse(itemId), take, locked, key, required, state}
  const ROOMS = {
    foyer: {
      name: 'FOYER',
      desc: 'A dusty entry hall. A heavy front door stands shut, and a door leads to the library.',
      color: '#2a2220',
      exits: [
        { id: 'exit_library', x: 820, y: 240, w: 130, h: 260, label: 'LIBRARY', target: 'library', locked: true, key: 'rusty_key', name: 'Library Door' },
        { id: 'exit_front', x: 40, y: 200, w: 150, h: 320, label: 'FRONT DOOR', target: null, locked: true, key: 'master_key', name: 'Front Door' },
      ],
      objects: [
        { id: 'rug', x: 300, y: 420, w: 220, h: 110, glyph: '🪞', name: 'Rug',
          desc: 'A threadbare rug. The corner is loose.',
          examine: 'You lift the corner of the rug and find a Rusty Key.',
          take: 'rusty_key', once: true },
        { id: 'coat', x: 60, y: 360, w: 110, h: 180, glyph: '🧥', name: 'Coat',
          desc: 'A heavy coat hangs on the rack. A pocket feels heavy.',
          examine: 'Inside the pocket you find a Torn Note. It mentions a study safe.',
          take: 'torn_note', once: true },
      ],
      drawFlourish: drawFoyer,
    },
    library: {
      name: 'LIBRARY',
      desc: 'Walls of old books. A grandfather clock ticks in the corner.',
      color: '#22282a',
      exits: [
        { id: 'exit_foyer', x: 0, y: 240, w: 130, h: 260, label: 'FOYER', target: 'foyer' },
        { id: 'exit_study', x: 820, y: 180, w: 130, h: 320, label: 'STUDY', target: 'study', locked: true, key: 'iron_key', name: 'Study Door' },
      ],
      objects: [
        { id: 'bookshelf', x: 260, y: 120, w: 300, h: 360, glyph: '📚', name: 'Bookshelf',
          desc: 'Rows of leather-bound books. One feels loose.',
          examine: 'Behind a loose book you find an Iron Key.',
          take: 'iron_key', once: true },
        { id: 'clock', x: 50, y: 140, w: 150, h: 260, glyph: '🕒', name: 'Grandfather Clock',
          desc: 'The clock reads 11:15. Something is scratched on the back panel.',
          examine: 'Scratched on the back: "Safe: 4-1-7".', once: true },
      ],
      drawFlourish: drawLibrary,
    },
    study: {
      name: 'STUDY',
      desc: 'A quiet study with a desk and a wall safe.',
      color: '#242a22',
      exits: [
        { id: 'exit_library', x: 0, y: 180, w: 130, h: 320, label: 'LIBRARY', target: 'library' },
        { id: 'exit_dining', x: 820, y: 220, w: 130, h: 280, label: 'DINING', target: 'dining' },
      ],
      objects: [
        { id: 'safe', x: 640, y: 180, w: 140, h: 200, glyph: '🛡️', name: 'Wall Safe',
          desc: 'A dial safe built into the wall.',
          examine: function () {
            if (game.flags.safeOpened) return 'The safe stands open and empty.';
            return 'The safe is locked with a three-digit combination.';
          },
          onClick: openSafe,
        },
        { id: 'desk', x: 200, y: 300, w: 260, h: 220, glyph: '🖋️', name: 'Desk',
          desc: 'A wooden desk. The top drawer stands open.',
          examine: 'Inside the drawer you find a Candle and a Matchbox.',
          takeMulti: ['candle', 'matchbox'], once: true },
      ],
      drawFlourish: drawStudy,
    },
    dining: {
      name: 'DINING ROOM',
      desc: 'A long dining table and a sideboard cabinet.',
      color: '#2a2224',
      exits: [
        { id: 'exit_study', x: 0, y: 220, w: 130, h: 280, label: 'STUDY', target: 'study' },
        { id: 'exit_attic', x: 820, y: 140, w: 130, h: 360, label: 'ATTIC', target: 'attic', locked: true, key: 'attic_key', name: 'Attic Door' },
      ],
      objects: [
        { id: 'cabinet', x: 280, y: 140, w: 260, h: 260, glyph: '🪑', name: 'Cabinet',
          desc: 'A display cabinet with glass doors.',
          examine: 'Inside rests a Broken Watch.',
          take: 'broken_watch', once: true },
        { id: 'sideboard', x: 50, y: 340, w: 220, h: 200, glyph: '🗄️', name: 'Sideboard',
          desc: 'A sideboard. The lower drawer is slightly ajar.',
          examine: 'You find a Watch Battery in the drawer.',
          take: 'watch_battery', once: true },
      ],
      drawFlourish: drawDining,
    },
    attic: {
      name: 'ATTIC',
      desc: 'A dusty attic. A trunk sits beneath a small window.',
      color: '#2a2822',
      dark: true,
      exits: [
        { id: 'exit_dining', x: 0, y: 140, w: 130, h: 360, label: 'DINING', target: 'dining' },
      ],
      objects: [
        { id: 'trunk', x: 540, y: 300, w: 260, h: 180, glyph: '📦', name: 'Trunk',
          desc: 'An old wooden trunk.',
          examine: function () {
            const hasRope = game.hasItem('rope');
            const hasMaster = game.hasItem('master_key');
            if (hasRope && hasMaster) return 'The trunk is empty — you already took the Rope and Master Key.';
            if (hasRope) return 'The trunk is empty — you already took the Rope.';
            if (hasMaster) return 'The trunk is empty — you already took the Master Key.';
            return 'Inside you find a coil of Rope and a Master Key.';
          },
          takeMulti: ['rope', 'master_key'], once: true },
        { id: 'window', x: 720, y: 120, w: 160, h: 260, glyph: '🪟', name: 'Attic Window',
          desc: 'A small window looking out to freedom.',
          onClick: tryWindowEscape,
        },
      ],
      drawFlourish: drawAttic,
    },
  };

  // ------------------------------------------------------------------
  // Game state
  // ------------------------------------------------------------------
  const game = {
    room: 'foyer',
    previousRoom: null,
    inventory: [],          // array of item ids
    selectedItem: null,     // id of selected inventory item
    flags: {
      safeOpened: false,
      candleLit: false,
      watchedTime: false,
    },
    safeDial: [0, 0, 0],
    endingsSeen: [],
    justTook: null,
    takenObjs: {},   // object id -> true, so we don't re-take
    t: 0,
    sound: true,

    hasItem(id) { return this.inventory.includes(id); },
    addItem(id) {
      if (this.inventory.includes(id)) return false;
      if (this.inventory.length >= ITEM_MAX) {
        showMessage('Your inventory is full. Use or drop an item first.');
        return false;
      }
      this.inventory.push(id);
      this.justTook = id;
      AudioEngine.pickup();
      renderInventory();
      return true;
    },
    removeItem(id) {
      const i = this.inventory.indexOf(id);
      if (i >= 0) this.inventory.splice(i, 1);
    },
    selectItem(id) {
      this.selectedItem = (this.selectedItem === id) ? null : id;
      renderInventory();
    },
    go(targetRoom) {
      const room = ROOMS[this.room];
      const exit = room.exits.find(e => e.target === targetRoom);

      // Front door has no target room -> escaping the mansion
      if (!targetRoom) {
        if (exit && exit.locked) {
          if (!game.hasItem(exit.key)) {
            showMessage(`${exit.name} is locked. You need a key.`);
            AudioEngine.deny();
            return;
          }
          exit.locked = false;
          AudioEngine.unlock();
          showMessage(`You unlock the ${exit.name.toLowerCase()} with the ${ITEM_NAMES[exit.key]}.`);
        }
        if (exit && !exit.locked) {
          AudioEngine.doorOpen();
          triggerEnding('quiet');
        }
        return;
      }

      if (exit && exit.locked) {
        if (!game.hasItem(exit.key)) {
          showMessage(`${exit.name} is locked. You need a key.`);
          AudioEngine.deny();
          return;
        }
        // unlock on entry
        exit.locked = false;
        AudioEngine.unlock();
        showMessage(`You unlock the ${exit.name.toLowerCase()} with the ${ITEM_NAMES[exit.key]}.`);
      }
      AudioEngine.doorOpen();
      this.previousRoom = this.room;
      this.room = targetRoom;
      renderInventory();
      updateHUD();
    },

    useSelectedOnObject(obj) {
      const sel = this.selectedItem;
      if (!sel) { this.examine(obj); return; }
      // combine in inventory handled elsewhere
      const result = tryUse(sel, obj);
      if (!result) {
        AudioEngine.click2();
        showMessage(`The ${ITEM_NAMES[sel]} doesn't seem to work on the ${obj.name}.`);
      }
    },

    examine(obj) {
      const text = typeof obj.examine === 'function' ? obj.examine() : obj.examine;
      showMessage(text);
      // auto-acquire items
      if (obj.take && !this.takenObjs[obj.id]) {
        this.takenObjs[obj.id] = true;
        this.addItem(obj.take);
      } else if (obj.takeMulti && !this.takenObjs[obj.id]) {
        this.takenObjs[obj.id] = true;
        obj.takeMulti.forEach(id => this.addItem(id));
      }
      AudioEngine.click2();
    },
  };

  function ITEM_NAMES(id) { return (ITEMS[id] && ITEMS[id].name) || id; }

  // ------------------------------------------------------------------
  // Puzzle: combination safe overlay
  // ------------------------------------------------------------------
  let safeOverlay = null;

  function openSafe() {
    const study = ROOMS.study;
    const safe = study.objects.find(o => o.id === 'safe');
    if (game.flags.safeOpened) {
      showMessage('The safe stands open and empty.');
      return;
    }
    // Build a dial overlay
    if (safeOverlay) safeOverlay.remove();
    safeOverlay = document.createElement('div');
    safeOverlay.className = 'panel';
    safeOverlay.style.zIndex = '60';
    safeOverlay.innerHTML = `
      <div class="panel-title">WALL SAFE</div>
      <div style="margin:0.6rem 0; font-size:1.1rem; color:#e8e8ea;">
        ${game.hasItem('torn_note') ? 'The Torn Note reads: <b>4-1-7</b>' : 'Find a clue for the combination.'}
      </div>
      <div style="display:flex;gap:0.4rem;justify-content:center;margin:0.8rem 0;">
        <div class="dial">0<div class="dial-ctrl"><div class="dial-up">▲</div><div class="dial-down">▼</div></div></div>
        <div class="dial">0<div class="dial-ctrl"><div class="dial-up">▲</div><div class="dial-down">▼</div></div></div>
        <div class="dial">0<div class="dial-ctrl"><div class="dial-up">▲</div><div class="dial-down">▼</div></div></div>
      </div>
      <div style="display:flex;gap:0.6rem;justify-content:center;">
        <button id="safe-open" class="big-btn">Open</button>
        <button id="safe-close" class="big-btn ghost">Close</button>
      </div>
    `;
    document.getElementById('game-container').appendChild(safeOverlay);
    const digits = safeOverlay.querySelectorAll('.dial');
    const state = game.safeDial;
    function renderDial() {
      digits.forEach((d, i) => {
        d.children[0].textContent = state[i];
      });
    }
    digits.forEach((d, i) => {
      const up = d.querySelector('.dial-up');
      const down = d.querySelector('.dial-down');
      up.addEventListener('click', (e) => { e.stopPropagation(); state[i] = (state[i] + 1) % 10; AudioEngine.click2(); renderDial(); });
      down.addEventListener('click', (e) => { e.stopPropagation(); state[i] = (state[i] + 9) % 10; AudioEngine.click2(); renderDial(); });
    });
    document.getElementById('safe-close').addEventListener('click', () => closeSafe());
    document.getElementById('safe-open').addEventListener('click', () => {
      if (state[0] === 4 && state[1] === 1 && state[2] === 7) {
        AudioEngine.safeOpen();
        game.flags.safeOpened = true;
        game.addItem('attic_key');
        showMessage('The safe clicks open. Inside is an Attic Key.');
        closeSafe();
      } else {
        AudioEngine.deny();
        showMessage('The dial refuses to turn. Wrong combination.');
      }
    });
    renderDial();
  }

  function closeSafe() {
    if (safeOverlay) { safeOverlay.remove(); safeOverlay = null; }
  }

  // ------------------------------------------------------------------
  // Item use logic
  // ------------------------------------------------------------------
  function tryUse(itemId, obj) {
    const sel = ITEMS[itemId];
    // Door unlocks
    if (obj.type === 'exit' && obj.locked && obj.key === itemId) {
      obj.locked = false;
      AudioEngine.unlock();
      showMessage(`You unlock the ${obj.name.toLowerCase()} with the ${sel.name}.`);
      return true;
    }
    // Front door with master key -> escape (quiet ending)
    if (obj.id === 'exit_front' && itemId === 'master_key') {
      obj.locked = false;
      AudioEngine.unlock();
      triggerEnding('quiet');
      return true;
    }
    // Window escape
    if (obj.id === 'window') {
      if (itemId === 'rope' || itemId === 'candle_lit') {
        return tryWindowEscapeVia(itemId);
      }
    }
    // Candle + matchbox => candle_lit (light in attic)
    if ((itemId === 'candle' && obj.id === 'matchbox') ||
        (itemId === 'matchbox' && obj.id === 'candle')) {
      // handled by inventory combine
    }
    // Use matchbox on candle in attic to light
    if (itemId === 'matchbox' && obj.id === 'candle' && game.room === 'attic') {
      if (!game.flags.candleLit) {
        game.flags.candleLit = true;
        AudioEngine.unlock();
        showMessage('You strike a match and light the candle. The attic brightens.');
        return true;
      }
      showMessage('The candle is already lit.');
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // Window escape / endings
  // ------------------------------------------------------------------
  function tryWindowEscape() {
    const hasRope = game.hasItem('rope');
    const hasLit = game.flags.candleLit;
    const hasMaster = game.hasItem('master_key');
    if (!hasRope && !hasMaster) {
      showMessage('The window is high up. You need a way down.');
      AudioEngine.deny();
      return;
    }
    if (hasRope && hasLit) {
      triggerEnding('good');
    } else if (hasRope) {
      triggerEnding('dark');
    } else if (hasMaster) {
      // can't use master key on window
      showMessage('The key does not fit the window.');
      AudioEngine.deny();
    }
  }
  function tryWindowEscapeVia(itemId) {
    if (itemId === 'rope') return tryWindowEscape();
    showMessage("That won't help you climb out.");
    AudioEngine.deny();
  }

  // ------------------------------------------------------------------
  // Endings
  // ------------------------------------------------------------------
  const ENDINGS = {
    good: {
      title: 'TRUE ESCAPE',
      text: 'With the candle lit and the rope in hand, you climb out the attic window and drop safely to the ground. You have escaped MYSTERY HOUSE — and uncovered its secrets.',
    },
    dark: {
      title: 'DARK ESCAPE',
      text: 'In the pitch-black attic you tie the rope and climb down blindly. You make it to the ground, shaken but free. A little light would have made it easier.',
    },
    quiet: {
      title: 'QUIET EXIT',
      text: 'You use the Master Key to slip out the front door. You are free, but you leave the mansion\'s secrets locked behind you.',
    },
  };

  function triggerEnding(kind) {
    if (game.endingsSeen.includes(kind)) return;
    game.endingsSeen.push(kind);
    AudioEngine.endingTone(kind === 'good' ? 'good' : kind === 'dark' ? 'ok' : 'ok');
    const e = ENDINGS[kind];
    document.getElementById('ending-title').textContent = e.title;
    document.getElementById('ending-text').textContent = e.text;
    showPanel('panel-ending');
    updateHUD();
  }

  // ------------------------------------------------------------------
  // Inventory combine (select A then click B)
  // ------------------------------------------------------------------
  function attemptCombine(aId, bId) {
    const key = `${aId}|${bId}`;
    const result = COMBINES[key];
    if (!result) return false;
    game.removeItem(aId);
    game.removeItem(bId);
    if (result === 'candle_lit') {
      // lighting a candle consumes the items; no new inventory entry
      game.flags.candleLit = true;
      AudioEngine.combine();
      showMessage('You light the candle. It will help in the dark attic.');
      game.selectItem(null);
      renderInventory();
      return true;
    }
    game.addItem(result);
    AudioEngine.combine();
    game.selectItem(null);
    if (result === 'watch') {
      showMessage('The watch ticks to life. The hands point to 9:00.');
      game.flags.watchedTime = true;
    }
    return true;
  }

  // ------------------------------------------------------------------
  // Hint system
  // ------------------------------------------------------------------
  function currentPuzzle() {
    // map room/state to a relevant puzzle id
    const r = game.room;
    if (r === 'foyer') return 'foyer_door';
    if (r === 'study') return 'study_safe';
    if (r === 'dining') return 'watch_repair';
    if (r === 'attic') return 'attic_escape';
    return null;
  }

  function showHint() {
    const pid = currentPuzzle();
    if (!pid) { showMessage('There is no active puzzle hint here.'); AudioEngine.click2(); return; }
    const stage = HINT_STAGE[pid] === undefined ? 0 : HINT_STAGE[pid];
    const hints = HINTS[pid];
    if (stage >= hints.length) {
      showMessage('You already know everything about this puzzle.');
      AudioEngine.click2();
      return;
    }
    showPanel('panel-hint');
    document.getElementById('panel-hint-text').textContent = hints[stage];
    document.getElementById('btn-hint-next').onclick = (ev) => {
      ev.stopPropagation();
      HINT_STAGE[pid] = stage + 1;
      showHint();
    };
    AudioEngine.click2();
  }

  // ------------------------------------------------------------------
  // UI panels & messages
  // ------------------------------------------------------------------
  function showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  }

  function showMessage(text, callback) {
    document.getElementById('panel-message-text').textContent = text;
    const ok = document.getElementById('btn-message-ok');
    const old = ok.onclick;
    ok.onclick = (ev) => {
      ev.stopPropagation();
      hideMessage();
      if (callback) callback();
    };
    showPanel('panel-message');
    AudioEngine.click2();
  }

  function hideMessage() {
    showPanel(null); // hides all panels
    // re-show any that should stay? we use exclusive panels; fine
  }
  // showPanel(null) would throw; handle:
  const _showPanel = showPanel;
  showPanel = (id) => {
    if (!id) { document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden')); return; }
    _showPanel(id);
  };

  document.getElementById('btn-message-ok').addEventListener('click', (ev) => { ev.stopPropagation(); hideMessage(); });
  document.getElementById('btn-hint-close').addEventListener('click', (ev) => { ev.stopPropagation(); hideMessage(); });
  document.getElementById('btn-hint').addEventListener('click', showHint);

  // Menu
  document.getElementById('btn-menu').addEventListener('click', () => {
    document.getElementById('btn-sound-menu').textContent = `Sound: ${game.sound ? 'ON' : 'OFF'}`;
    showPanel('panel-menu');
  });
  document.getElementById('btn-resume').addEventListener('click', hideMessage);
  document.getElementById('btn-restart').addEventListener('click', () => {
    hideMessage();
    location.reload();
  });
  document.getElementById('btn-sound-menu').addEventListener('click', () => {
    game.sound = !game.sound;
    AudioEngine.enabled = game.sound;
    document.getElementById('btn-sound-menu').textContent = `Sound: ${game.sound ? 'ON' : 'OFF'}`;
    document.getElementById('btn-sound').textContent = game.sound ? '🔊' : '🔇';
    if (game.sound) AudioEngine.ambientStart(); else AudioEngine.ambientStop();
  });
  document.getElementById('btn-sound').addEventListener('click', () => {
    game.sound = !game.sound;
    AudioEngine.enabled = game.sound;
    document.getElementById('btn-sound').textContent = game.sound ? '🔊' : '🔇';
    if (game.sound) AudioEngine.ambientStart(); else AudioEngine.ambientStop();
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    AudioEngine.init();
    AudioEngine.ambientStart();
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    updateHUD();
    renderInventory();
  });

  function updateHUD() {
    const room = ROOMS[game.room];
    document.getElementById('room-name').textContent = room.name;
    document.getElementById('room-desc').textContent = room.desc;
  }

  function renderInventory() {
    const slots = document.getElementById('inventory-slots');
    slots.innerHTML = '';
    game.inventory.forEach(id => {
      const item = ITEMS[id];
      const div = document.createElement('div');
      div.className = `inv-slot${game.selectedItem === id ? ' selected' : ''}`;
      div.title = item.name;
      div.innerHTML = `<div style="font-size:1.4rem;">${item.glyph}</div><div class="inv-name">${item.name}</div>`;
      div.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (game.selectedItem && game.selectedItem !== id) {
          // try combine
          if (attemptCombine(game.selectedItem, id)) { renderInventory(); return; }
        }
        game.selectItem(id);
      });
      slots.appendChild(div);
    });
  }

  // ------------------------------------------------------------------
  // Pointer input
  // ------------------------------------------------------------------
  function pointerDown(ev) {
    ev.preventDefault();
    const { x, y } = toLogical(ev.clientX, ev.clientY);
    const room = ROOMS[game.room];

    // Check exits first
    for (const ex of room.exits) {
      if (pointIn(x, y, ex.x, ex.y, ex.w, ex.h)) {
        game.go(ex.target);
        return;
      }
    }
    // Check objects
    for (const obj of room.objects) {
      if (pointIn(x, y, obj.x, obj.y, obj.w, obj.h)) {
        if (obj.onClick) { obj.onClick(); return; }
        // if locked door-like object
        if (obj.locked) {
          game.useSelectedOnObject(obj);
          return;
        }
        game.useSelectedOnObject(obj);
        return;
      }
    }
    // Clicking empty space deselects
    game.selectItem(null);
  }

  function pointIn(x, y, ox, oy, w, h) {
    return x >= ox && x <= ox + w && y >= oy && y <= oy + h;
  }

  canvas.addEventListener('mousedown', pointerDown);
  canvas.addEventListener('touchstart', (ev) => {
    ev.preventDefault();
    const t = ev.changedTouches[0];
    pointerDown({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {} });
  }, { passive: false });

  // Close panels when clicking canvas outside
  canvas.addEventListener('click', () => {
    if (!document.querySelector('.panel:not(.hidden)')) return;
    // allow panels to handle their own clicks; don't auto-close
  });

  // ------------------------------------------------------------------
  // Room drawing helpers
  // ------------------------------------------------------------------
  function drawRect(x, y, w, h, color, line) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h);
    ctx.fill();
    if (line) {
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawObj(obj, hover, usable) {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    const base = usable ? '#e8e8ea' : (hover ? '#d4a017' : '#b08d2e');
    drawRect(0, 0, obj.w, obj.h, base, '#4a3800');
    // glyph
    ctx.fillStyle = '#0b0c14';
    ctx.font = `${Math.min(obj.w, obj.h) * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obj.glyph || '?', obj.w / 2, obj.h / 2 - 4);
    // label
    ctx.fillStyle = '#0b0c14';
    ctx.font = '10px Courier New';
    ctx.fillText(obj.name, obj.w / 2, obj.h - 10);
    if (usable) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(2, 2, obj.w - 4, obj.h - 4, 6) : ctx.rect(2, 2, obj.w - 4, obj.h - 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Pointer hover tracking
  let hoverObj = null;
  canvas.addEventListener('mousemove', (ev) => {
    const { x, y } = toLogical(ev.clientX, ev.clientY);
    const room = ROOMS[game.room];
    hoverObj = null;
    for (const ex of room.exits) { if (pointIn(x, y, ex.x, ex.y, ex.w, ex.h)) { hoverObj = ex; break; } }
    if (!hoverObj) {
      for (const obj of room.objects) {
        if (pointIn(x, y, obj.x, obj.y, obj.w, obj.h)) { hoverObj = obj; break; }
      }
    }
  });
  canvas.addEventListener('mouseleave', () => { hoverObj = null; });

  // ------------------------------------------------------------------
  // Room flourishes
  // ------------------------------------------------------------------
  function drawFoyer() {
    // walls
    drawRect(0, 0, LOGICAL_W, LOGICAL_H, '#2a2220');
    drawRect(0, 0, LOGICAL_W, 60, '#3a2e2b'); // crown
    drawRect(0, LOGICAL_H - 60, LOGICAL_W, 60, '#3a2e2b'); // baseboard
    // door arches drawn via exits; draw front door
    ctx.fillStyle = '#3d2e2a';
    ctx.fillRect(40, 200, 150, 320);
    ctx.fillStyle = '#8a6d5b';
    ctx.fillRect(150, 340, 20, 40); // door handle
    // rug
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath(); ctx.ellipse(410, 475, 110, 55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2a1a';
    ctx.beginPath(); ctx.ellipse(410, 475, 95, 42, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function drawLibrary() {
    drawRect(0, 0, LOGICAL_W, LOGICAL_H, '#22282a');
    drawRect(0, 0, LOGICAL_W, 60, '#30383a');
    drawRect(0, LOGICAL_H - 60, LOGICAL_W, 60, '#30383a');
    // bookshelf books
    ctx.fillStyle = '#3a2e2a';
    for (let i = 0; i < 14; i++) {
      const bx = 260 + i * 22;
      ctx.fillRect(bx, 140, 16, 220);
      ctx.fillStyle = i % 3 === 0 ? '#5a3a2a' : (i % 3 === 1 ? '#3a4a3a' : '#3a3a4a');
      ctx.fillRect(bx + 2, 142, 12, 12);
      ctx.fillStyle = '#3a2e2a';
    }
    // clock face
    ctx.fillStyle = '#e8e8ea';
    ctx.beginPath(); ctx.ellipse(125, 260, 55, 65, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0c14';
    ctx.beginPath(); ctx.arc(125, 260, 4, 0, Math.PI * 2); ctx.fill(); // center
    const pend = Math.sin(game.t * 2) * 6;
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(125, 325); ctx.lineTo(125 + pend, 390); ctx.stroke();
    ctx.fillRect(120, 390, 10, 14);
  }

  function drawStudy() {
    drawRect(0, 0, LOGICAL_W, LOGICAL_H, '#242a22');
    drawRect(0, 0, LOGICAL_W, 60, '#323a32');
    drawRect(0, LOGICAL_H - 60, LOGICAL_W, 60, '#323a32');
    // safe dial
    ctx.fillStyle = '#5a4a3a';
    ctx.beginPath(); ctx.arc(710, 230, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0c14';
    ctx.beginPath(); ctx.arc(710, 230, 6, 0, Math.PI * 2); ctx.fill();
  }

  function drawDining() {
    drawRect(0, 0, LOGICAL_W, LOGICAL_H, '#2a2224');
    drawRect(0, 0, LOGICAL_W, 60, '#382e30');
    drawRect(0, LOGICAL_H - 60, LOGICAL_W, 60, '#382e30');
    // table
    ctx.fillStyle = '#4a342a';
    ctx.fillRect(320, 300, 340, 20);
    ctx.fillStyle = '#3a261e';
    ctx.fillRect(430, 320, 20, 120);
    ctx.fillRect(610, 320, 20, 120);
  }

  function drawAttic() {
    drawRect(0, 0, LOGICAL_W, LOGICAL_H, '#2a2822');
    drawRect(0, 0, LOGICAL_W, 60, '#38342a');
    drawRect(0, LOGICAL_H - 60, LOGICAL_W, 60, '#38342a');
    // window
    ctx.fillStyle = '#d8e0e8';
    ctx.fillRect(720, 120, 160, 260);
    ctx.fillStyle = '#b0c0c8';
    ctx.fillRect(720, 120, 160, 8); 
    ctx.fillRect(720, 120, 8, 260);
    ctx.fillRect(720, 372, 160, 8);
    ctx.fillRect(872, 120, 8, 260);
    // trunk
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(540, 300, 260, 180, 10) : ctx.rect(540, 300, 260, 180);
    ctx.fill();
    ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 3; ctx.stroke();
    // candle light glow if lit
    if (game.flags.candleLit) {
      const g = ctx.createRadialGradient(670, 330, 2, 670, 330, 220);
      g.addColorStop(0, 'rgba(255,220,140,0.35)');
      g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      // flicker
      ctx.fillStyle = `rgba(255,200,90,${0.6 + 0.2 * Math.sin(game.t * 10)})`;
      ctx.beginPath(); ctx.arc(670, 330, 8 + Math.sin(game.t * 13) * 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------
  let lastHoverTime = 0;

  function render() {
    const t = game.t;
    ctx.save();
    // clear with room color
    const room = ROOMS[game.room];
    ctx.fillStyle = room.color;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    room.drawFlourish();

    // Draw exits (doors)
    room.exits.forEach(ex => {
      const hovered = hoverObj === ex;
      const locked = ex.locked;
      const hasKey = locked && game.hasItem(ex.key);
      const usable = (!locked || hasKey) && (game.selectedItem === null || game.selectedItem === ex.key);
      ctx.save();
      ctx.translate(ex.x, ex.y);
      drawRect(0, 0, ex.w, ex.h, locked ? '#3d2e2a' : (hovered ? '#c9a227' : '#8a6d5b'), '#4a3800');
      ctx.fillStyle = '#0b0c14';
      ctx.font = '11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(ex.label, ex.w / 2, ex.h / 2 + 4);
      if (locked) {
        ctx.fillStyle = '#b34545';
        ctx.font = '10px Courier New';
        ctx.fillText('LOCKED', ex.w / 2, ex.h / 2 + 22);
        if (hasKey) {
          ctx.fillStyle = '#c9a227';
          ctx.fillText('use key', ex.w / 2, ex.h / 2 + 38);
        }
      }
      ctx.restore();
    });

    // Draw objects
    room.objects.forEach(obj => {
      const hovered = hoverObj === obj;
      let usable = false;
      if (game.selectedItem) {
        usable = tryUsePreview(game.selectedItem, obj);
      }
      drawObj(obj, hovered, usable || hovered);
    });

    // Lighting vignette (always)
    const vignette = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W * 0.35, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W * 0.95);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Attic darkness override
    if (room.dark && !game.flags.candleLit) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }

    // floating particles (dust)
    ctx.fillStyle = 'rgba(200,180,140,0.15)';
    for (let i = 0; i < 18; i++) {
      const p = (t * 0.15 + i) * 37;
      const px = ((p * 53) % LOGICAL_W);
      const py = ((p * 97) % LOGICAL_H);
      const alpha = 0.3 + 0.4 * Math.sin(t + i);
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    game.t += 0.02;
    requestAnimationFrame(render);
  }

  // Preview: does selected item work on obj (for hover highlight only)
  function tryUsePreview(itemId, obj) {
    if (obj.type === 'exit') return false;
    if (obj.locked && obj.key === itemId) return true;
    if (obj.id === 'window' && itemId === 'rope') return true;
    if (itemId === 'matchbox' && obj.id === 'candle' && game.room === 'attic') return true;
    return false;
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  render();

  // Expose for debugging / testing
  window.MYSTERY_HOUSE = { game, AudioEngine, ITEMS, ROOMS, openSafe, closeSafe, tryUse, attemptCombine };

})();