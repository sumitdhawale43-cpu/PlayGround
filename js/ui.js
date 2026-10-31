import { clamp, formatClock, roman } from './util.js';
import { TRAIT_INFO, ADAPTATIONS, glyphForKind } from './memory.js';
import { RECIPES, TOOLS } from './config.js';
import { drawMinimap } from './render.js';

const ICONS = {
  wood: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 9.5l10-4 4 3.5-10 4z"/><path d="M5 9.5v5l4 2.5v-5"/><path d="M15 13l4-3.5"/><path d="M9 12v5"/></svg>',
  stone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M6 15l2-6 6-2 4 4-2 6-6 1z"/><path d="M8 9l4 3 6-1"/><path d="M12 12v6"/></svg>',
  fiber: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 19c2-5 1-9 6-14"/><path d="M11 19c1-4 3-8 8-9"/><path d="M8 14c2 0 4-1 5-3"/><path d="M13 9c1 2 2 3 4 3"/></svg>',
  berry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="14" r="3"/><circle cx="15" cy="15" r="2.6"/><circle cx="13" cy="9" r="2.4"/><path d="M13 7c1-2 3-3 5-2" stroke-linecap="round"/></svg>',
  meat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 5c3-1 6 1 6 4 0 4-5 8-9 8-3 0-4-2-3-4 1-3 2-7 6-8z"/><path d="M9 17l-4 4"/><circle cx="6" cy="20" r="1.6"/></svg>',
  cooked: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 5c3-1 6 1 6 4 0 4-5 8-9 8-3 0-4-2-3-4 1-3 2-7 6-8z"/><path d="M9 17l-4 4"/><path d="M12 8c1 1 1 2 0 3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 19L19 5"/><path d="M12 5h7v7"/><path d="M5 14l3 3"/></svg>',
  torch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 21l2-9"/><path d="M12 12c-3-2-2-6 1-8 0 3 4 4 3 8-1 2-3 2-4 0z"/><path d="M7 12l8-2"/></svg>',
  trap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2 2M15.7 15.7l2 2M17.7 6.3l-2 2M8.3 15.7l-2 2"/></svg>',
  bandage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-30 12 12)"/><path d="M11 10l2 4M14 10l-2 4"/></svg>',
  cloak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M9 4c2 1 4 1 6 0l3 6-2 10H8L6 10z"/><path d="M9 4l3 5 3-5"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3c4 4 6 6 6 10a6 6 0 01-12 0c0-3 2-4 3-7 1 3 3 4 3 4s-1-4 0-7z"/></svg>',
  axe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20l7-9"/><path d="M13 4c2 0 4 1 5 3l-4 3-3-2z"/><path d="M9 8l4 2"/></svg>',
  spear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L18 6"/><path d="M15 3l6 1-1 6-4-3z"/></svg>',
  bow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 4c4 4 4 12 0 16"/><path d="M6 4l9 8-9 8"/><path d="M6 12h11"/></svg>',
  ember: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 4c3 3 4 4 4 7a4 4 0 11-8 0c0-2 1-3 2-5 1 2 2 2 2 2s0-2 0-4z"/><path d="M4 20h16"/></svg>',
  eat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 3v7M10 3v7M8.5 10v11"/><path d="M16 3c2 2 2 5 0 7v11"/><path d="M14 3v7"/></svg>'
};

const ICON_COLOR = {
  bow: 'a9b77c', flame: 'e0763c', greed: 'b08d55', mercy: 'b9c99d', kill: 'c94f43',
  snare: 'c2a86a', shadow: '8f9bc4', cairn: 'f0b06a', explore: '8fa5b0', gather: '9aab72',
  build: 'd8b46a', death: 'c94f43', arrive: 'd8b46a', sleep: '8fa5b0'
};

export class UI {
  constructor(game) {
    this.game = game;
    game.ui = this;
    this.touchMode = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || window.innerWidth < 760;
    game.isTouch = this.touchMode;
    if (this.touchMode) document.body.classList.add('touch-mode');

    this.el = {};
    for (const id of [
      'hud', 'title', 'ledger', 'craft', 'dialogue', 'death', 'ending', 'touch', 'game',
      'cycleLabel', 'phase', 'clock', 'objText', 'objPips', 'barHealth', 'barStamina', 'barHunger',
      'barWarmth', 'minimap', 'learnedList', 'resources', 'hotbar', 'prompt', 'promptText',
      'ledgerBtn', 'craftBtn', 'ledgerClose', 'craftClose', 'ledgerEvents', 'ledgerCount',
      'adaptList', 'adaptCount', 'traitList', 'recipeList', 'dialoguePortrait', 'dialogueName',
      'dialogueRole', 'dialogueText', 'dialogueTag', 'dialogueNext', 'deathText', 'riseBtn',
      'endingStats', 'againBtn', 'playBtn', 'titleCycle', 'toasts', 'controlsHint', 'toolChip',
      'toolChipName', 'stick', 'stickKnob', 'btnAttack', 'btnInteract', 'btnDodge', 'btnEmber',
      'btnTrap', 'btnTool', 'cursor', 'minimapWrap', 'vitals', 'objective', 'ledgerTitle', 'craftTitle'
    ]) this.el[id] = document.getElementById(id);

    this.cursor = this.el.cursor;
    this.accum = 0;
    this.miniAccum = 0;
    this.promptValue = null;
    this.toastTimers = [];
    this.dialogueData = null;
    this.hotbarBuilt = false;
    this.resourceEls = {};
    this.holdInterval = null;

    this.wireEvents();
    this.buildResources();
    this.buildHotbar();
    this.setTitleCycle();
    this.addSoundButton();
    if (this.touchMode) {
      this.el.ledgerClose.textContent = '×';
      this.el.craftClose.textContent = '×';
      this.el.dialogueNext.textContent = 'Close';
      document.querySelectorAll('.panel-foot .muted').forEach((el) => { el.textContent = 'Tap × to close'; });
    }
  }

  /* ============================================================
     WIRING
     ============================================================ */
  wireEvents() {
    const g = this.game;
    this.el.playBtn.addEventListener('click', () => {
      g.audio.init();
      g.start();
    });
    this.el.ledgerBtn.addEventListener('click', () => g.openLedger());
    this.el.craftBtn.addEventListener('click', () => g.openCraft());
    this.el.ledgerClose.addEventListener('click', () => g.closePanels());
    this.el.craftClose.addEventListener('click', () => g.closePanels());
    this.el.dialogueNext.addEventListener('click', () => g.closeDialogue());
    this.el.riseBtn.addEventListener('click', () => g.respawn());
    this.el.againBtn.addEventListener('click', () => g.newCycle());

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && g.mode === 'title') { g.audio.init(); g.start(); }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.cursor) return;
      this.cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
    window.addEventListener('resize', () => {
      const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || window.innerWidth < 760;
      if (touch !== this.touchMode) {
        this.touchMode = touch;
        g.isTouch = touch;
        document.body.classList.toggle('touch-mode', touch);
      }
    });

    this.setupTouch();
  }

  addSoundButton() {
    const actions = document.querySelector('.side-actions');
    if (!actions) return;
    const b = document.createElement('button');
    b.className = 'ghost-btn';
    b.id = 'soundBtn';
    b.type = 'button';
    b.setAttribute('aria-label', 'Toggle sound');
    b.innerHTML = 'Sound <span aria-hidden="true">◉</span>';
    b.addEventListener('click', () => {
      const muted = !this.game.audio.muted;
      this.game.audio.setMuted(muted);
      b.innerHTML = muted ? 'Muted <span aria-hidden="true">○</span>' : 'Sound <span aria-hidden="true">◉</span>';
      b.classList.toggle('muted', muted);
    });
    actions.appendChild(b);
  }

  setupTouch() {
    const g = this.game;
    const stick = this.el.stick;
    const knob = this.el.stickKnob;
    let activeId = null;
    let cx = 0, cy = 0;
    const radius = 42;

    const reset = () => {
      activeId = null;
      g.stick.x = 0; g.stick.y = 0; g.stick.active = false;
      knob.style.transform = 'translate(0px, 0px)';
    };

    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      stick.setPointerCapture(e.pointerId);
      activeId = e.pointerId;
      const r = stick.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      g.stick.active = true;
      this.moveStick(e.clientX, e.clientY, cx, cy, radius, knob, g);
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== activeId) return;
      this.moveStick(e.clientX, e.clientY, cx, cy, radius, knob, g);
    });
    stick.addEventListener('pointerup', reset);
    stick.addEventListener('pointercancel', reset);
    stick.addEventListener('pointerleave', (e) => {
      if (e.pointerId === activeId) reset();
    });

    this.el.btnAttack.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      g.attack();
      if (this.holdInterval) clearInterval(this.holdInterval);
      this.holdInterval = setInterval(() => g.attack(), 230);
    });
    const stopHold = () => {
      if (this.holdInterval) clearInterval(this.holdInterval);
      this.holdInterval = null;
    };
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
      this.el.btnAttack.addEventListener(ev, stopHold);
    }
    this.el.btnInteract.addEventListener('pointerdown', (e) => { e.preventDefault(); g.interact(); });
    this.el.btnDodge.addEventListener('pointerdown', (e) => { e.preventDefault(); g.dodge(); });
    this.el.btnEmber.addEventListener('pointerdown', (e) => { e.preventDefault(); g.ember(); });
    this.el.btnTrap.addEventListener('pointerdown', (e) => { e.preventDefault(); g.placeTrap(); });
    this.el.btnTool.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      g.cycleTool();
      this.el.btnTool.textContent = TOOLS[g.player.tool].name.toUpperCase();
      this.el.toolChipName.textContent = TOOLS[g.player.tool].name;
    });
  }

  moveStick(px, py, cx, cy, radius, knob, game) {
    let dx = px - cx, dy = py - cy;
    const d = Math.hypot(dx, dy);
    if (d > radius) { dx = (dx / d) * radius; dy = (dy / d) * radius; }
    game.stick.x = dx / radius;
    game.stick.y = dy / radius;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  /* ============================================================
     START
     ============================================================ */
  begin(game) {
    this.el.title.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
    if (this.touchMode) this.el.touch.classList.remove('hidden');
    document.body.classList.add('playing');
    this.setPrompt(null);
    this.updateResources(game);
    this.updateHotbar(game);
    this.syncLearnings(game.chronicle);
    this.el.learnedList.classList.remove('hidden');
    this.setTitleCycle();
    setTimeout(() => this.el.controlsHint.classList.add('fade'), 13000);
    setTimeout(() => {
      if (this.touchMode) this.el.toolChip.classList.remove('hidden');
    }, 900);
    if (this.el.btnTool) this.el.btnTool.textContent = TOOLS[game.player.tool].name.toUpperCase();
  }

  setTitleCycle() {
    const c = this.game.chronicle;
    const cycle = roman(c.cycle);
    if (this.el.cycleLabel) this.el.cycleLabel.textContent = `CYCLE ${cycle}`;
    if (this.el.titleCycle) {
      this.el.titleCycle.textContent = c.cycle > 1
        ? `CYCLE ${cycle} · THE VALLEY REMEMBERS YOU · ${c.unlocked.length} LESSONS KEPT`
        : 'CYCLE I · THE VALLEY IS NEW TO YOU';
    }
  }

  /* ============================================================
     FRAME UPDATE
     ============================================================ */
  update(game, dt) {
    this.accum += dt;
    this.miniAccum += dt;
    if (this.accum >= 0.07) {
      this.accum = 0;
      this.updateHud(game);
    }
    if (this.miniAccum >= 0.16) {
      this.miniAccum = 0;
      if (game.mode === 'play' || game.mode === 'title') drawMinimap(this.el.minimap, game);
    }
    if (this.cursor) {
      const playing = game.mode === 'play';
      this.cursor.classList.toggle('active', playing && !this.touchMode);
      this.cursor.classList.toggle('hot', playing && !!game.currentInteract);
    }
  }

  updateHud(game) {
    const p = game.player;
    this.el.barHealth.style.width = `${clamp(p.hp / p.maxHp, 0, 1) * 100}%`;
    this.el.barStamina.style.width = `${clamp(p.stamina / p.maxStamina, 0, 1) * 100}%`;
    this.el.barHunger.style.width = `${clamp(p.hunger / p.maxHunger, 0, 1) * 100}%`;
    this.el.barWarmth.style.width = `${clamp(p.warmth / p.maxWarmth, 0, 1) * 100}%`;
    this.el.barHealth.parentElement.parentElement.classList.toggle('low', p.hp < 30);
    this.el.barStamina.parentElement.parentElement.classList.toggle('low', p.stamina < 18);
    this.el.barHunger.parentElement.parentElement.classList.toggle('low', p.hunger < 22);
    this.el.barWarmth.parentElement.parentElement.classList.toggle('low', p.warmth < 22);

    const phase = game.phaseInfo();
    this.el.phase.textContent = phase.label;
    this.el.phase.className = `phase ${phase.cls || ''}`;
    this.el.clock.textContent = `DAY ${game.time.day} · ${formatClock(game.time.minutes)}`;

    const obj = game.objective();
    this.el.objText.textContent = obj.lit >= obj.total ? 'The way is open' : `Light the cairns · ${obj.lit} of ${obj.total}`;
    const pips = this.el.objPips.children;
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < obj.lit);
    }

    const loc = game.locationName();
    const label = document.querySelector('.minimap-label');
    if (label && label.textContent !== loc.toUpperCase()) label.textContent = loc.toUpperCase();

    if (this.touchMode && this.el.toolChipName) this.el.toolChipName.textContent = TOOLS[p.tool].name;
    const arrows = this.resourceEls.arrows;
    if (arrows) arrows.textContent = p.arrows;
    const traps = this.resourceEls.traps;
    if (traps) traps.textContent = p.traps;
    const food = this.resourceEls.eat;
    if (food) food.textContent = p.cooked + p.berry + p.meat;
    this.updateHotbarState(game);
    if (this.el.btnEmber) this.el.btnEmber.classList.toggle('cooling', p.emberCd > 0);
    if (this.el.btnDodge) this.el.btnDodge.classList.toggle('cooling', p.dashCd > 0);
  }

  /* ============================================================
     HOTBAR / RESOURCES
     ============================================================ */
  buildResources() {
    const order = [
      ['wood', 'Wood'], ['stone', 'Stone'], ['fiber', 'Fibre'], ['berry', 'Berries'],
      ['meat', 'Meat'], ['cooked', 'Cooked'], ['arrows', 'Arrows'], ['torches', 'Torches'],
      ['traps', 'Snares'], ['bandage', 'Bandage']
    ];
    this.el.resources.innerHTML = '';
    this.resourceEls = {};
    for (const [key, label] of order) {
      const div = document.createElement('div');
      div.className = 'res';
      div.title = label;
      div.innerHTML = `${ICONS[key] || ''}<span class="amount">0</span>`;
      this.el.resources.appendChild(div);
      this.resourceEls[key] = div.querySelector('.amount');
      div.dataset.key = key;
      div._amountEl = div.querySelector('.amount');
      this.resourceEls[key]._holder = div;
    }
  }

  updateResources(game) {
    const p = game.player;
    for (const [key, amountEl] of Object.entries(this.resourceEls)) {
      if (!amountEl) continue;
      const value = p[key] || 0;
      if (amountEl.textContent !== String(value)) {
        amountEl.textContent = value;
        const holder = amountEl._holder;
        if (holder) {
          holder.classList.toggle('empty', value <= 0);
          holder.classList.remove('bump');
          void holder.offsetWidth;
          holder.classList.add('bump');
        }
      }
      if (amountEl._holder) amountEl._holder.classList.toggle('empty', value <= 0);
    }
  }

  buildHotbar() {
    const items = [
      { type: 'tool', index: 0, icon: 'axe', key: '1', name: 'Axe' },
      { type: 'tool', index: 1, icon: 'spear', key: '2', name: 'Spear' },
      { type: 'tool', index: 2, icon: 'bow', key: '3', name: 'Bow', count: 'arrows' },
      { divider: true },
      { type: 'trap', icon: 'trap', key: 'Q', name: 'Snare', count: 'traps' },
      { type: 'ember', icon: 'ember', key: 'F', name: 'Ember' },
      { type: 'eat', icon: 'eat', key: 'R', name: 'Eat', count: 'eat' }
    ];
    this.el.hotbar.innerHTML = '';
    this.hotbarSlots = [];
    for (const item of items) {
      if (item.divider) {
        const d = document.createElement('span');
        d.className = 'divider';
        this.el.hotbar.appendChild(d);
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot ${item.type === 'tool' ? '' : 'ability'}`;
      btn.title = item.name;
      btn.setAttribute('aria-label', item.name);
      btn.innerHTML = `
        <span class="key">${item.key}</span>
        ${ICONS[item.icon]}
        ${item.type !== 'tool' ? `<span class="label">${item.name.toUpperCase()}</span>` : ''}
        ${item.count ? '<span class="count">0</span>' : ''}
      `;
      if (item.type === 'tool') btn.addEventListener('click', () => this.game.selectTool(item.index));
      if (item.type === 'trap') btn.addEventListener('click', () => this.game.placeTrap());
      if (item.type === 'ember') btn.addEventListener('click', () => this.game.ember());
      if (item.type === 'eat') btn.addEventListener('click', () => this.game.eat());
      this.el.hotbar.appendChild(btn);
      this.hotbarSlots.push({ ...item, el: btn, countEl: btn.querySelector('.count') });
    }
    this.hotbarBuilt = true;
    this.updateHotbarState(this.game);
  }

  updateHotbar(game) {
    if (!this.hotbarBuilt) return;
    this.updateHotbarState(game);
    for (const s of this.hotbarSlots) {
      if (!s.countEl) continue;
      if (s.count === 'arrows') s.countEl.textContent = game.player.arrows;
      if (s.count === 'traps') s.countEl.textContent = game.player.traps;
      if (s.count === 'eat') s.countEl.textContent = game.player.cooked + game.player.berry + game.player.meat;
    }
  }

  updateHotbarState(game) {
    if (!this.hotbarSlots) return;
    for (const s of this.hotbarSlots) {
      if (s.type === 'tool') s.el.classList.toggle('active', game.player.tool === s.index);
      if (s.countEl) {
        if (s.count === 'arrows') s.countEl.textContent = game.player.arrows;
        if (s.count === 'traps') s.countEl.textContent = game.player.traps;
        if (s.count === 'eat') s.countEl.textContent = game.player.cooked + game.player.berry + game.player.meat;
      }
      if (s.type === 'trap') s.el.classList.toggle('cooling', game.player.traps <= 0);
      if (s.type === 'ember') s.el.classList.toggle('cooling', game.player.emberCd > 0);
    }
  }

  /* ============================================================
     PROMPT / TOASTS / LEARNINGS
     ============================================================ */
  setPrompt(text, danger = false) {
    if (text === this.promptValue) {
      if (text) this.el.prompt.classList.toggle('danger', danger);
      return;
    }
    this.promptValue = text;
    if (!text) {
      this.el.prompt.classList.add('hidden');
      return;
    }
    this.el.promptText.textContent = text;
    this.el.prompt.classList.remove('hidden');
    this.el.prompt.classList.toggle('danger', danger);
  }

  toast(text, cls = '', ms = 3200) {
    if (cls === 'learn') {
      // learning toasts are also appended to the running ticker elsewhere
    }
    const div = document.createElement('div');
    div.className = `toast ${cls}`;
    div.textContent = text;
    this.el.toasts.appendChild(div);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
    const timer = setTimeout(() => {
      div.classList.add('out');
      setTimeout(() => div.remove(), 520);
    }, ms);
    this.toastTimers.push(timer);
    if (this.toastTimers.length > 30) this.toastTimers.shift();
  }

  addLearning(a) {
    const empty = this.el.learnedList.querySelector('.learned-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'learned-item';
    div.innerHTML = `<span class="glyph">${a.glyph}</span><span>${a.short}<span class="src">THEY ADAPTED</span></span>`;
    this.el.learnedList.prepend(div);
    while (this.el.learnedList.children.length > 3) this.el.learnedList.lastChild.remove();
  }

  syncLearnings(chronicle) {
    this.el.learnedList.innerHTML = '';
    const list = ADAPTATIONS.filter(a => chronicle.has(a.id)).slice(-3).reverse();
    if (!list.length) {
      const p = document.createElement('p');
      p.className = 'learned-empty';
      p.textContent = 'It is still deciding what you are.';
      this.el.learnedList.appendChild(p);
      return;
    }
    for (const a of list) {
      const div = document.createElement('div');
      div.className = 'learned-item';
      div.innerHTML = `<span class="glyph">${a.glyph}</span><span>${a.short}<span class="src">THEY ADAPTED</span></span>`;
      this.el.learnedList.appendChild(div);
    }
  }

  /* ============================================================
     LEDGER
     ============================================================ */
  openLedger(game) {
    this.renderLedger(game);
    this.el.ledger.classList.remove('hidden');
    this.setPrompt(null);
  }

  closePanels() {
    this.el.ledger.classList.add('hidden');
    this.el.craft.classList.add('hidden');
  }

  renderLedger(game) {
    const ch = game.chronicle;
    const events = ch.events.slice().reverse();
    this.el.ledgerEvents.innerHTML = '';
    this.el.ledgerCount.textContent = `${events.length} ${events.length === 1 ? 'entry' : 'entries'}`;
    if (!events.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = 'The page is blank. The valley is waiting to see what kind of person you are.';
      this.el.ledgerEvents.appendChild(p);
    } else {
      for (const e of events) {
        const div = document.createElement('div');
        div.className = 'event';
        const color = ICON_COLOR[e.kind] || 'd8b46a';
        div.innerHTML = `
          <span class="stamp">D${e.day} · ${formatClock(e.time || 0)}</span>
          <span class="eicon" style="color:#${color}">${glyphForKind(e.kind)}</span>
          <span>${e.text}<span class="tagline">${e.kind}</span></span>
        `;
        this.el.ledgerEvents.appendChild(div);
      }
    }

    this.el.adaptList.innerHTML = '';
    const unlocked = ch.unlocked.length;
    this.el.adaptCount.textContent = `${unlocked} / ${ADAPTATIONS.length}`;
    for (const a of ADAPTATIONS) {
      const on = ch.has(a.id);
      const div = document.createElement('div');
      div.className = `adapt ${on ? 'on' : ''}`;
      div.innerHTML = `
        <span class="glyph">${a.glyph}</span>
        <div>
          <h4>${a.name}</h4>
          <p>${on ? a.detail : 'The valley has not learned this yet.'}</p>
        </div>
      `;
      this.el.adaptList.appendChild(div);
    }

    this.el.traitList.innerHTML = '';
    const max = Math.max(5, ...TRAIT_INFO.map(t => ch.traits[t.key] || 0));
    for (const t of TRAIT_INFO) {
      const v = Math.round(ch.traits[t.key] || 0);
      const row = document.createElement('div');
      row.className = 'trait-row';
      row.innerHTML = `
        <span>${t.label}</span>
        <span class="trait-track"><i style="width:${clamp(v / max, 0, 1) * 100}%;background:linear-gradient(90deg,#5d6b46,${t.color})"></i></span>
        <span>${v}</span>
      `;
      this.el.traitList.appendChild(row);
    }
  }

  /* ============================================================
     CRAFT
     ============================================================ */
  openCraft(game) {
    this.renderCraft(game);
    this.el.craft.classList.remove('hidden');
    this.setPrompt(null);
  }

  refreshCraft(game) {
    if (!this.el.craft.classList.contains('hidden')) this.renderCraft(game);
  }

  renderCraft(game) {
    const p = game.player;
    this.el.recipeList.innerHTML = '';
    for (const r of RECIPES) {
      const check = game.canCraft(r.id);
      const owned = r.once && p.cloak;
      const div = document.createElement('div');
      div.className = `recipe ${owned ? 'owned' : ''}`;
      const costHtml = Object.entries(r.cost).map(([key, need]) => {
        const have = p[key] || 0;
        return `<span class="cost-chip ${have < need ? 'lack' : ''}">${ICONS[key] || ''}${need}</span>`;
      }).join('');
      div.innerHTML = `
        <div class="r-icon">${ICONS[r.icon] || ''}</div>
        <div>
          <h4>${r.name}${r.qty ? ` <span class="muted" style="font-size:10px">${r.qty}</span>` : ''}</h4>
          <div class="r-desc">${r.desc}</div>
          <div class="cost">${costHtml}</div>
        </div>
        <button class="craft-btn" ${check.ok ? '' : 'disabled'} data-recipe="${r.id}">${owned ? 'Made' : r.id === 'cook' ? 'Cook' : 'Craft'}</button>
      `;
      this.el.recipeList.appendChild(div);
      const btn = div.querySelector('.craft-btn');
      if (btn && !owned) {
        btn.addEventListener('click', () => {
          if (game.craft(r.id)) this.renderCraft(game);
          else this.renderCraft(game);
        });
      }
    }
  }

  /* ============================================================
     DIALOGUE
     ============================================================ */
  showDialogue(data) {
    this.dialogueData = data;
    this.el.dialoguePortrait.textContent = data.initial || '?';
    this.el.dialoguePortrait.style.background = `radial-gradient(circle at 35% 30%, ${data.color || '#cbb98e'}, #4a3b2a)`;
    this.el.dialogueName.textContent = data.name;
    this.el.dialogueRole.textContent = data.role;
    this.el.dialogueText.textContent = data.text;
    this.el.dialogueTag.textContent = data.tag || '';
    this.el.dialogue.classList.remove('hidden');
    this.setPrompt(null);
  }

  hideDialogue() {
    this.el.dialogue.classList.add('hidden');
  }

  /* ============================================================
     DEATH / ENDING
     ============================================================ */
  showDeath(text) {
    this.el.deathText.textContent = text;
    this.el.death.classList.remove('hidden');
    this.setPrompt(null);
  }

  hideDeath() {
    this.el.death.classList.add('hidden');
  }

  showEnding(summary) {
    this.el.endingStats.innerHTML = `
      <div class="ending-stat"><b>${summary.days}</b><span>DAYS SURVIVED</span></div>
      <div class="ending-stat"><b>${summary.deeds}</b><span>DEEDS WRITTEN</span></div>
      <div class="ending-stat"><b>${summary.adaptations}</b><span>LESSONS LEARNED</span></div>
    `;
    const note = document.querySelector('.ending-note');
    if (note) {
      note.textContent = `The valley read you as ${summary.top}. Standing: ${summary.rep}. Cycle ${roman(summary.cycle)} begins when you are ready.`;
    }
    this.el.ending.classList.remove('hidden');
    this.setPrompt(null);
  }

  hideEnding() {
    this.el.ending.classList.add('hidden');
  }
}
