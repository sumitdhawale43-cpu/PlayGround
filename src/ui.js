// ── The Remembering — HUD, journal, dialogue and overlays ────────────────────
import { DOCTRINES } from './memory.js';
import { formatClock, clamp, seedLabel } from './util.js';

const TOOL_NAMES = ['Spear', 'Bow', 'Torch', 'Snare'];

export class UI {
  constructor(game) {
    this.game = game;
    this.$ = (id) => document.getElementById(id);
    this.hud = this.$('hud');
    this.minimap = this.$('minimap');
    this.toastWrap = this.$('toasts');
    this.bannerEl = this.$('banner');
    this.promptEl = this.$('interact-prompt');
    this.toastTimers = [];
    this.lastHud = 0;
    this.bannerTimer = 0;
    this.activePanel = null;
    this.bind();
    this.buildHotbar();
  }

  bind() {
    const click = (id, fn) => {
      const el = this.$(id);
      if (el) el.addEventListener('click', (e) => { e.preventDefault(); fn(); });
    };
    click('btn-journal', () => this.game.togglePanel('journal'));
    click('btn-craft', () => this.game.togglePanel('craft'));
    click('btn-pause', () => this.game.togglePanel('pause'));
    click('btn-mute', () => this.game.toggleMute());
    click('btn-help', () => this.game.togglePanel('pause'));
    click('btn-enter', () => this.game.enterWorld());
    click('btn-new-world-title', () => this.game.newWorldFromTitle());
    click('btn-resume', () => this.game.closePanels());
    click('btn-pause-close', () => this.game.closePanels());
    click('btn-pause-journal', () => this.game.togglePanel('journal'));
    click('btn-pause-craft', () => this.game.togglePanel('craft'));
    click('btn-pause-new', () => this.game.confirmNewWorld());
    click('btn-pause-touch', () => this.game.toggleTouch());
    click('btn-pause-mute', () => this.game.toggleMute());
    click('btn-death-wake', () => this.game.respawn());
    click('btn-death-new', () => this.game.confirmNewWorld());
    click('btn-craft-close', () => this.game.closePanels());
    click('btn-journal-close', () => this.game.closePanels());
    click('btn-dialogue-close', () => this.game.closePanels());

    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) this.game.closePanels();
      });
    });

    const craftList = this.$('craft-list');
    craftList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-craft]');
      if (!btn) return;
      this.game.craft(btn.dataset.craft);
      this.renderCraft();
    });

    this.$('dialogue-options').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-option]');
      if (!btn) return;
      const idx = Number(btn.dataset.option);
      this.game.chooseDialogue(idx);
    });

    document.querySelectorAll('.slot').forEach(slot => {
      slot.addEventListener('click', () => this.game.selectTool(Number(slot.dataset.slot)));
    });

    document.querySelectorAll('.vital').forEach(v => {
      v.addEventListener('click', () => this.game.useVital(v.dataset.vital));
    });

    window.addEventListener('resize', () => this.game.renderer?.resize());
  }

  buildHotbar() {
    const icons = [
      '<svg viewBox="0 0 24 24"><path d="M12 2 9 15h6L12 2Z" fill="currentColor"/><path d="M12 14v8" stroke="currentColor" stroke-width="2"/><path d="m9 16-2 2m8-2 2 2" stroke="currentColor" stroke-width="1.4"/></svg>',
      '<svg viewBox="0 0 24 24"><path d="M5 3c6 4 9 9 9 18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 3 14 21" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 8h10" stroke="currentColor" stroke-width="1.2"/></svg>',
      '<svg viewBox="0 0 24 24"><path d="M11 21 13 8" stroke="currentColor" stroke-width="2.4"/><path d="M13 9c-4-2-5-6-2-8 3 1 5 4 5 8 0 2-2 4-3 4Z" fill="currentColor"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="13" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 3v4M6 6l2 2m10-2-2 2" stroke="currentColor" stroke-width="1.4"/></svg>',
    ];
    document.querySelectorAll('.slot').forEach((slot, i) => {
      slot.innerHTML = `
        <span class="slot-key">${i + 1}</span>
        <span class="slot-icon">${icons[i]}</span>
        <span class="slot-name">${TOOL_NAMES[i]}</span>
        <span class="slot-count"></span>
        <span class="slot-lock">locked</span>`;
      slot.addEventListener('click', () => this.game.selectTool(i));
    });
  }

  showHUD(show) {
    this.hud.classList.toggle('hidden', !show);
  }

  update(dt, game) {
    this.lastHud += dt;
    if (this.lastHud < 0.08) return;
    this.lastHud = 0;
    const p = game.player;
    this.setBar('hp', p.hp, p.maxHp, Math.round(p.hp));
    this.setBar('stam', p.stam, p.maxStam, Math.round(p.stam));
    this.setBar('hunger', p.hunger, 100, Math.round(p.hunger));
    this.setBar('thirst', p.thirst, 100, Math.round(p.thirst));
    this.setBar('warmth', p.warmth, 100, Math.round(p.warmth));

    this.$('clock-day').textContent = `Day ${game.memory.day}`;
    this.$('clock-time').textContent = formatClock(game.dayFraction);
    this.$('weather-label').textContent = game.weather === 'clear' ? 'clear' : game.weather;
    const region = game.world.regionAt(p.x, p.y);
    this.$('region-name').textContent = region.name;
    this.$('memory-count').textContent = game.memory.entries.length;
    this.$('legend-count').textContent = Math.round(game.memory.legend);

    document.querySelectorAll('.slot').forEach((slot, i) => {
      slot.classList.toggle('active', p.tool === i);
      slot.classList.toggle('locked', !p.tools[i]);
      const count = slot.querySelector('.slot-count');
      if (i === 1) count.textContent = p.tools[1] ? p.arrows : '';
      else if (i === 3) count.textContent = p.tools[3] ? p.snares : '';
      else count.textContent = '';
    });

    this.updateQuest(game);
    this.updatePrompt(game);

    const lowHp = p.hp / p.maxHp < 0.3;
    this.hud.classList.toggle('danger', lowHp);
    const night = game.nightFactor > 0.35;
    this.hud.classList.toggle('night', night);
  }

  setBar(key, value, max, label) {
    const el = document.querySelector(`.vital[data-vital="${key}"]`);
    if (!el) return;
    const fill = el.querySelector('.v-fill');
    const val = el.querySelector('.v-val');
    fill.style.width = `${clamp(value / max * 100, 0, 100)}%`;
    val.textContent = label;
    el.classList.toggle('low', value / max < 0.25);
  }

  updateQuest(game) {
    const q = game.quest;
    if (!q) return;
    this.$('quest-eyebrow').textContent = q.eyebrow || 'WHISPERS';
    this.$('quest-title').textContent = q.title;
    this.$('quest-text').textContent = q.text;
    this.$('quest-progress').textContent = q.progress || '';
  }

  updatePrompt(game) {
    const target = game.interactTarget;
    if (!target) {
      this.promptEl.classList.add('hidden');
      return;
    }
    this.promptEl.classList.remove('hidden');
    this.promptEl.innerHTML = `<span class="key">E</span> ${target.prompt}`;
  }

  toast(text, kind = 'info', ttl = 4200) {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `<span class="toast-mark"></span><span>${escapeHTML(text)}</span>`;
    this.toastWrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    while (this.toastWrap.children.length > 4) this.toastWrap.firstElementChild.remove();
    const timer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, ttl);
    this.toastTimers.push(timer);
  }

  banner(kicker, title, sub = '', kind = '') {
    this.bannerEl.className = `banner ${kind}`;
    this.bannerEl.querySelector('.banner-kicker').textContent = kicker;
    this.bannerEl.querySelector('.banner-title').textContent = title;
    this.bannerEl.querySelector('.banner-sub').textContent = sub;
    this.bannerEl.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.bannerEl.classList.remove('show'), 5200);
  }

  panel(name) {
    this.activePanel = name;
    const ids = ['journal-panel', 'craft-panel', 'pause-panel', 'dialogue-panel'];
    for (const id of ids) this.$(id).classList.toggle('open', id === `${name}-panel`);
    document.body.classList.toggle('panel-open', !!name);
  }

  closeAll() {
    this.panel(null);
    this.$( 'death-panel').classList.remove('open');
  }

  showTitle({ hasSave, seed, dead }) {
    const t = this.$('title-screen');
    t.classList.add('open');
    this.$('seed-input').value = seedLabel(seed);
    this.$('btn-enter').textContent = hasSave ? 'Continue the story' : 'Enter the valley';
    this.$('btn-new-world-title').classList.toggle('hidden', !hasSave);
    this.$('title-note').textContent = dead
      ? 'The valley is still keeping score.'
      : hasSave ? 'Your ledger is still open.' : 'A new valley. It has not met you yet.';
  }

  hideTitle() {
    this.$('title-screen').classList.remove('open');
  }

  showDeath(recap) {
    this.$('death-name').textContent = recap.name;
    this.$('death-cause').textContent = `Taken by ${recap.cause} on day ${recap.day}.`;
    this.$('death-legacy').textContent = recap.legacyLine;
    const list = this.$('death-memories');
    list.innerHTML = recap.memories.map(m => `
      <li><span class="mem-day">Day ${m.day}</span><span>${escapeHTML(m.text)}</span></li>
    `).join('') || '<li><span>The valley has nothing to say yet.</span></li>';
    this.$('death-panel').classList.add('open');
    document.body.classList.add('panel-open');
  }

  hideDeath() {
    this.$('death-panel').classList.remove('open');
    document.body.classList.remove('panel-open');
  }

  showDialogue(npc, line, options) {
    this.$('dlg-name').textContent = npc.name;
    this.$('dlg-role').textContent = npc.role;
    this.$('dlg-initial').textContent = npc.name.slice(0, 1);
    this.$('dlg-text').textContent = line;
    const wrap = this.$('dialogue-options');
    wrap.innerHTML = options.map((o, i) => `
      <button class="dialogue-option" data-option="${i}" ${o.disabled ? 'disabled' : ''}>
        <span>${escapeHTML(o.label)}</span>
        ${o.hint ? `<small>${escapeHTML(o.hint)}</small>` : ''}
      </button>
    `).join('');
    this.panel('dialogue');
  }

  renderCraft() {
    const game = this.game;
    const p = game.player;
    const recipes = game.getRecipes();
    this.$('craft-inv').innerHTML = `
      <span><b>${p.inv.wood}</b> wood</span>
      <span><b>${p.inv.stone}</b> stone</span>
      <span><b>${p.inv.fiber}</b> fiber</span>
      <span><b>${p.inv.berry}</b> berry</span>
      <span><b>${p.inv.meat}</b> meat</span>
      <span><b>${p.inv.hide}</b> hide</span>
      <span><b>${p.arrows}</b> arrows</span>
      <span><b>${p.snares}</b> snares</span>`;
    this.$('craft-list').innerHTML = recipes.map(r => `
      <div class="recipe ${r.can ? '' : 'disabled'}">
        <div class="recipe-head">
          <div>
            <h3>${r.name}</h3>
            <p>${r.desc}</p>
          </div>
          <span class="recipe-owned">${r.owned || ''}</span>
        </div>
        <div class="recipe-foot">
          <span class="cost">${r.costText}</span>
          <button class="btn small" data-craft="${r.id}" ${r.can ? '' : 'disabled'}>${r.action || 'Craft'}</button>
        </div>
      </div>
    `).join('');
  }

  renderJournal() {
    const game = this.game;
    const m = game.memory;
    const entries = m.recent(28);
    const docs = m.doctrineList();
    const regions = game.world.regions;
    const reps = game.world.settlements;
    const dead = m.dead;

    const entryHTML = entries.map(e => `
      <li class="journal-entry ${e.type}">
        <div class="entry-top"><span>Day ${e.day} · ${formatClock(e.time)}</span><span>${escapeHTML(e.region || 'the valley')}</span></div>
        <p>${escapeHTML(e.text)}</p>
        ${e.witnesses?.length ? `<small>seen by ${e.witnesses.map(escapeHTML).join(', ')}</small>` : ''}
      </li>
    `).join('') || '<li class="journal-empty">Nothing yet. The ledger is waiting.</li>';

    const docHTML = docs.map(d => {
      const pct = clamp(d.progress / d.threshold * 100, 0, 100);
      return `<div class="doctrine ${d.unlocked ? 'unlocked' : ''}">
        <div class="doc-head"><span class="doc-icon">${d.icon}</span><span>${d.name}</span><span class="doc-state">${d.unlocked ? 'ADAPTED' : `${d.progress}/${d.threshold}`}</span></div>
        <p>${d.desc}</p>
        <div class="doc-bar"><i style="width:${d.unlocked ? 100 : pct}%"></i></div>
      </div>`;
    }).join('');

    const repHTML = reps.map(s => {
      const rep = m.reputation(s.name);
      const pct = (rep + 100) / 2;
      return `<div class="rep-row">
        <span>${s.name}</span>
        <div class="rep-bar"><i style="width:${pct}%"></i></div>
        <b>${rep > 0 ? '+' : ''}${rep}</b>
      </div>`;
    }).join('');

    const stateHTML = regions.filter(r => r.states.length).map(r =>
      `<li><b>${r.name}</b> — ${r.states.join(', ')}</li>`
    ).join('') || '<li>The valley is unmarked.</li>';

    const deadHTML = dead.slice(-4).reverse().map(d =>
      `<li><b>${escapeHTML(d.name)}</b> — day ${d.day}, ${escapeHTML(d.cause)}<br><small>${escapeHTML(d.epitaph)}</small></li>`
    ).join('') || '<li>No names yet. Yours will be the first.</li>';

    const stats = m.stats;
    this.$('journal-body').innerHTML = `
      <div class="journal-col">
        <section>
          <h3>What you have done <span>${m.entries.length} entries · ${Math.round(m.legend)} legend</span></h3>
          <ul class="timeline">${entryHTML}</ul>
        </section>
      </div>
      <div class="journal-col">
        <section>
          <h3>What the Hollow learned</h3>
          <div class="doctrines">${docHTML}</div>
        </section>
        <section>
          <h3>Who remembers you</h3>
          <div class="reps">${repHTML}</div>
        </section>
        <section>
          <h3>Scars on the land</h3>
          <ul class="plain">${stateHTML}</ul>
        </section>
        <section>
          <h3>Those who came before</h3>
          <ul class="plain dead-list">${deadHTML}</ul>
        </section>
        <section class="stat-line">
          ${stats.kills} kills · ${stats.hunts} hunts · ${stats.gifts} gifts · ${stats.crafts} crafts · ${stats.shrines} shrines
        </section>
      </div>`;
  }

  showPanel(name) {
    if (name === 'journal') this.renderJournal();
    if (name === 'craft') this.renderCraft();
    if (name === 'pause') {
      this.$('pause-touch-label').textContent = this.game.touchMode ? 'Touch controls: on' : 'Touch controls: off';
      this.$('pause-mute-label').textContent = this.game.muted ? 'Sound: off' : 'Sound: on';
    }
    this.panel(name);
  }

  setTouch(on) {
    document.body.classList.toggle('touch', on);
  }

  setMuted(muted) {
    this.$('btn-mute').classList.toggle('muted', muted);
    const label = this.$('pause-mute-label');
    if (label) label.textContent = muted ? 'Sound: off' : 'Sound: on';
  }

  flashPrompt(text) {
    this.toast(text, 'info', 2400);
  }
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
