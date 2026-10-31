/* Kingdom Builder — interface, onboarding, audio and game loop. */
(function () {
  'use strict';
  const G = window.KBG;
  const KB = window.KBArt;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  let lastEco = null;
  let cardsSignature = '';
  let lastSheetHTML = '';
  let lastQuestsHTML = '';
  let lastLedgerHTML = '';
  let audioCtx = null;
  let lastTick = performance.now();
  let booted = false;
  let modalKind = null;

  const RES_LABEL = { wood: 'Wood', stone: 'Stone', food: 'Food', gold: 'Gold' };

  // ---------- sound ----------
  function ensureAudio() {
    if (!G.state?.soundOn) return null;
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function tone(freq, dur, type = 'sine', volume = .025, delay = 0) {
    const ac = ensureAudio();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + .012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + .03);
  }

  function playFx(kind) {
    if (!G.state?.soundOn) return;
    if (kind === 'build') {
      tone(196, .10, 'triangle', .035);
      tone(293.7, .16, 'triangle', .028, .06);
      tone(392, .26, 'sine', .018, .12);
    } else if (kind === 'upgrade') {
      tone(261.6, .1, 'triangle', .03);
      tone(392, .14, 'triangle', .025, .07);
      tone(523.3, .3, 'sine', .022, .14);
    } else if (kind === 'levelup' || kind === 'quest') {
      [392, 493.9, 587.3, 784].forEach((f, i) => tone(f, .32, 'sine', .025, i * .09));
    } else if (kind === 'growth') {
      tone(523.3, .12, 'sine', .018);
      tone(659.3, .18, 'sine', .014, .07);
    } else if (kind === 'demolish') {
      tone(130.8, .2, 'sawtooth', .018);
      tone(98, .25, 'triangle', .02, .08);
    } else if (kind === 'festival') {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, .4, 'triangle', .022, i * .07));
    } else if (kind === 'tax') {
      tone(330, .08, 'triangle', .018);
      tone(440, .1, 'triangle', .016, .06);
    }
  }

  // ---------- toasts ----------
  function toast(title, msg, kind = '', icon = '✦') {
    const stack = $('#toastStack');
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = `<span class="toast-icon">${icon}</span><div><strong>${title}</strong>${msg ? `<small>${msg}</small>` : ''}</div>`;
    stack.appendChild(el);
    while (stack.children.length > 4) stack.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 320);
    }, kind === 'bad' ? 2800 : 3600);
  }
  window.addEventListener('kb:toast', e => {
    const d = e.detail || {};
    toast(d.title || '', d.msg || '', d.kind || '', d.icon || '✦');
  });

  window.addEventListener('kb:fx', e => playFx((e.detail || {}).kind));

  // ---------- resource bar ----------
  function makeResourceBar() {
    const bar = $('#resourceBar');
    bar.innerHTML = '';
    const order = [
      ['wood', 'Wood'], ['stone', 'Stone'], ['food', 'Food'], ['gold', 'Gold'],
      ['pop', 'People'], ['happy', 'Contentment']
    ];
    for (const [key, label] of order) {
      const chip = document.createElement('div');
      chip.className = 'resource-chip';
      chip.dataset.res = key;
      chip.title = label;
      const icon = key === 'pop' ? KB.resIcons.pop : key === 'happy' ? KB.resIcons.happy : KB.resIcons[key];
      chip.innerHTML = `
        <div class="resource-icon">${icon}</div>
        <div class="resource-meta">
          <span class="resource-value" id="res-${key}">—</span>
          <span class="resource-rate" id="rate-${key}">—</span>
        </div>`;
      bar.appendChild(chip);
    }
  }

  function flashResource(res) {
    const chip = document.querySelector(`.resource-chip[data-res="${res}"]`);
    if (!chip) return;
    chip.classList.remove('pulse');
    void chip.offsetWidth;
    chip.classList.add('pulse');
  }

  // ---------- HUD refresh ----------
  function updateResources() {
    const s = G.state;
    for (const key of G.RESOURCES) {
      const value = $('#res-' + key);
      if (value) value.textContent = G.fmt(s.resources[key]);
      const rate = $('#rate-' + key);
      if (rate) {
        rate.textContent = G.perMin(lastEco.net[key]) + '/m';
        rate.classList.toggle('negative', lastEco.net[key] < -.001);
      }
      const chip = document.querySelector(`.resource-chip[data-res="${key}"]`);
      if (chip) chip.classList.toggle('low', s.resources[key] < 12);
    }
    $('#res-pop').textContent = `${s.pop}`;
    $('#rate-pop').textContent = `of ${lastEco.capacity}`;
    $('#res-happy').textContent = `${Math.round(lastEco.happiness)}%`;
    let happyLabel = 'Content';
    if (lastEco.foodShortage) happyLabel = 'Starving';
    else if (lastEco.happiness >= 86) happyLabel = 'Joyful';
    else if (lastEco.happiness < 35) happyLabel = 'Unhappy';
    else if (lastEco.happiness < 55) happyLabel = 'Uneasy';
    $('#rate-happy').textContent = happyLabel;
    const happyChip = document.querySelector('.resource-chip[data-res="happy"]');
    if (happyChip) happyChip.classList.toggle('low', lastEco.happiness < 38);
  }

  function updateLevel() {
    const s = G.state;
    const lv = G.levelData(s.level);
    const prog = G.levelProgress();
    $('#levelNum').textContent = roman(s.level);
    $('#settlementName').textContent = lv.title;
    $('#levelTag').textContent = `Level ${s.level}`;
    $('#xpFill').style.width = prog.pct + '%';
    $('#xpText').textContent = prog.text;
    $('#nextLevelText').textContent = prog.next;
    $('#dayLabel').textContent = `Day ${G.day(s)}`;
    $('#seasonLabel').textContent = G.season(s);
    $('#buildSubtitle').textContent = `${s.buildings.length} structures · ${lv.title}`;
  }

  function roman(n) {
    return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][G.clamp(n, 1, 7) - 1] || String(n);
  }

  function updateHappiness() {
    const eco = lastEco;
    $('#happyValue').textContent = `${Math.round(eco.happiness)}%`;
    $('#happyValue').style.color = eco.happiness < 45 ? '#9c4b35' : eco.happiness > 75 ? '#4e6a3a' : '#7f6837';
    $('#happyFill').style.width = `${G.clamp(eco.happiness, 2, 100)}%`;
    $('#happyFill').style.background = eco.happiness < 40
      ? 'linear-gradient(90deg,#9c4a38,#c17b4a)'
      : eco.happiness < 62
        ? 'linear-gradient(90deg,#ad6a3c,#d0a04f)'
        : 'linear-gradient(90deg,#a65a3c,#cf9b4b 45%,#688747)';
    const face = $('#happyFace');
    face.textContent = eco.happiness >= 72 ? '☺' : eco.happiness >= 48 ? '•‿•' : '☹';
    face.style.color = eco.happiness >= 72 ? '#56723e' : eco.happiness >= 48 ? '#8a6d2f' : '#9a4e38';
    face.style.right = `${G.clamp(eco.happiness, 2, 100) - 4}%`;
    $('#happyNote').textContent = G.happyNote(eco);
    for (const btn of $$('#taxControl button')) btn.classList.toggle('active', btn.dataset.tax === G.state.tax);
    const fest = $('#festivalBtn');
    if (fest) {
      fest.disabled = G.state.festival > 0 || G.state.resources.food < 30 || G.state.resources.gold < 25;
      const small = fest.querySelector('small');
      if (G.state.festival > 0) small.textContent = `Merrymaking for ${Math.ceil(G.state.festival)}s`;
      else small.textContent = '30 food · 25 gold';
    }
  }

  function questHTML() {
    const active = G.activeQuests();
    if (G.state.completedQuests.length >= G.QUESTS.length) {
      return `<div class="ledger-empty">Every royal decree is fulfilled.<br>Valewood shines as a beacon of the valley.</div>`;
    }
    if (!active.length) return `<div class="ledger-empty">New decrees will be issued as your realm grows.</div>`;
    return active.map((q, i) => `
      <div class="quest" title="${q.desc}">
        <span class="quest-bullet">${i + 1}</span>
        <div class="quest-body">
          <div class="quest-name">${q.title}</div>
          <div class="quest-desc">${q.desc}</div>
        </div>
        <span class="quest-reward">${G.questProgress(q)}</span>
      </div>`).join('');
  }

  function updateQuests() {
    const html = questHTML();
    if (html !== lastQuestsHTML) {
      lastQuestsHTML = html;
      $('#questList').innerHTML = html;
    }
  }

  function cardCostHTML(type) {
    const def = G.BUILDINGS[type];
    return Object.entries(def.cost).map(([k, v]) => `
      <span class="cost" data-res="${k}">${KB.resIcons[k]}<span>${v}</span></span>`).join('');
  }

  function cardsSignatureNow() {
    return `${G.state.level}|${G.ui.buildType}|${G.state.built.monument || 0}|${G.state.buildings.length}|${G.state.completedQuests.length}`;
  }

  function renderCards(force = false) {
    const sig = cardsSignatureNow();
    if (!force && sig === cardsSignature) {
      syncCards();
      return;
    }
    cardsSignature = sig;
    const wrap = $('#buildCards');
    let html = '';
    for (const type of G.BUILD_ORDER) {
      const def = G.BUILDINGS[type];
      const locked = G.state.level < def.unlock;
      const builtUnique = def.unique && (G.state.built[type] || 0) > 0;
      const isNew = !locked && G.state.level === def.unlock && (G.state.built[type] || 0) === 0;
      const icon = KB.cardIcons[type] || KB.cardIcons.house;
      html += `
        <button class="build-card ${locked || builtUnique ? 'locked' : ''}" data-build="${type}" title="${def.desc}">
          ${locked ? `<span class="lock-badge">Lv ${def.unlock}</span>` : builtUnique ? `<span class="lock-badge">Built</span>` : isNew ? `<span class="new-badge">New</span>` : ''}
          <span class="build-img">${icon}</span>
          <span class="build-name">${def.name}</span>
          <span class="build-cost">${cardCostHTML(type)}</span>
        </button>`;
    }
    html += `
      <button class="build-card bulldoze" data-build="__demolish" title="Salvage 40% of a building's cost">
        <span class="build-img">${KB.cardIcons.bulldoze}</span>
        <span class="build-name">Bulldoze</span>
        <span class="build-cost" style="opacity:.7">salvage</span>
      </button>`;
    wrap.innerHTML = html;
    syncCards();
  }

  function syncCards() {
    const wrap = $('#buildCards');
    if (!wrap) return;
    for (const card of wrap.querySelectorAll('.build-card')) {
      const type = card.dataset.build;
      const def = type === '__demolish' ? null : G.BUILDINGS[type];
      const locked = def ? (G.state.level < def.unlock || (def.unique && (G.state.built[type] || 0) > 0)) : false;
      card.classList.toggle('selected', type === '__demolish' ? G.ui.demolish : G.ui.buildType === type);
      if (locked) continue;
      for (const cost of card.querySelectorAll('.cost')) {
        const res = cost.dataset.res;
        cost.classList.toggle('missing', (G.state.resources[res] || 0) < (def.cost[res] || 0));
      }
    }
  }

  function ledgerHTML(eco) {
    const s = G.state;
    const connected = s.buildings.filter(b => b.type !== 'road' && G.BUILDINGS[b.type] && G.connected(b)).length;
    const rows = G.RESOURCES.map(k => {
      const n = eco.net[k];
      return `<div class="ledger-row"><span><i class="ledger-dot" style="color:${resourceColor(k)}"></i>${RES_LABEL[k]}</span><b class="${n < -.001 ? 'neg' : ''}">${G.perMin(n)}/min</b></div>`;
    }).join('');
    const counts = {};
    for (const b of s.buildings) counts[b.type] = (counts[b.type] || 0) + 1;
    const chips = G.BUILD_ORDER.filter(t => counts[t]).map(t => `<span class="ledger-building">${G.BUILDINGS[t].name} <b>${counts[t]}</b></span>`).join('');
    return `
      <h3 class="ledger-title">The ${G.levelData(s.level).title} of Valewood</h3>
      <p class="ledger-sub">${G.happyNote(eco)}</p>
      <div class="ledger-rates">${rows}</div>
      <div class="ledger-summary">
        <div class="ledger-stat"><small>Subjects</small><strong>${s.pop} <em>/ ${eco.capacity}</em></strong></div>
        <div class="ledger-stat"><small>Workers</small><strong>${eco.employed} <em>/ ${eco.jobs}</em></strong></div>
        <div class="ledger-stat"><small>Roads</small><strong>${eco.roadCount} <em>linked</em></strong></div>
        <div class="ledger-stat"><small>Defence</small><strong>${eco.defence} <em>guards</em></strong></div>
      </div>
      <div class="ledger-note">${eco.foodShortage ? 'Granaries are empty. Farms and taverns need attention.' : eco.unemployment > .2 ? 'There are more workers than jobs. Raise workshops and markets.' : connected < s.buildings.length - 1 ? 'Some buildings are not linked by road. Connected buildings produce 20% more.' : 'Every road leads to the Keep. Production is flowing freely.'}</div>
      <div class="ledger-section"><h4>Standing structures</h4><div class="ledger-buildings">${chips || '<span class="ledger-building">Only the Keep</span>'}</div></div>`;
  }

  function resourceColor(k) {
    return { wood: '#8c6034', stone: '#77796f', food: '#b38935', gold: '#c39a3c' }[k];
  }

  function updateLedger(eco) {
    const html = ledgerHTML(eco);
    if (html !== lastLedgerHTML) {
      lastLedgerHTML = html;
      $('#ledgerContent').innerHTML = html;
    }
  }

  function sheetHTML(b, eco) {
    const def = G.BUILDINGS[b.type];
    const e = G.effective(b);
    const connected = G.connected(b);
    const isRoad = b.type === 'road';
    const icon = KB.cardIcons[b.type] || KB.cardIcons.house;
    let statRows = '';
    if (isRoad) {
      statRows = `
        <div class="sheet-stat"><small>Link</small><b>${connected ? 'Connected' : 'Unlinked'}</b></div>
        <div class="sheet-stat"><small>Bonus</small><b>+20% output</b></div>`;
    } else {
      const outputs = Object.entries(e.production).map(([k, v]) => `${G.perMin(v * eco.productivity * eco.staffFactor * (connected ? 1.2 : 1))} ${RES_LABEL[k]}`).join(' · ');
      let stats = '';
      if (e.capacity) stats += `<div class="sheet-stat"><small>Housing</small><b>+${e.capacity}</b></div>`;
      if (e.jobs) stats += `<div class="sheet-stat"><small>Workers</small><b>${e.jobs}</b></div>`;
      if (outputs) stats += `<div class="sheet-stat"><small>Output</small><b>${outputs}/min</b></div>`;
      if (e.happiness) stats += `<div class="sheet-stat"><small>Contentment</small><b>${e.happiness > 0 ? '+' : ''}${e.happiness}</b></div>`;
      if (e.defence) stats += `<div class="sheet-stat"><small>Defence</small><b>+${e.defence * b.level}</b></div>`;
      if (!stats) stats = `<div class="sheet-stat"><small>Role</small><b>Civic</b></div>`;
      statRows = stats;
    }
    const up = G.canUpgrade(b);
    const upCost = G.upgradeCost(b);
    const costHTML = Object.entries(upCost).map(([k, v]) => `${v} ${k}`).join(' · ');
    const maxed = (b.level || 1) >= (def.maxLevel || 1);
    return `
      <button class="sheet-close" data-action="close-sheet" aria-label="Close">×</button>
      <div class="sheet-heading">
        <span class="sheet-icon">${icon}</span>
        <div class="sheet-title"><h3>${def.name}</h3><span>Level ${b.level || 1} · ${def.category}</span></div>
      </div>
      <p class="sheet-desc">${def.desc}</p>
      <div class="sheet-stats">${statRows}</div>
      ${isRoad ? '' : `<div class="sheet-status ${connected ? '' : 'bad'}"><i class="status-dot"></i>${connected ? 'Linked to the Keep' : 'Not linked by road — build a road alongside'}</div>`}
      <div class="sheet-actions">
        ${b.type === 'keep' ? '' : `<button class="parchment-btn primary" data-action="upgrade" data-id="${b.id}" ${up.ok ? '' : 'disabled'} title="${up.reason || ''}">${maxed ? 'Fully upgraded' : `Upgrade · ${costHTML}`}</button>
        <button class="parchment-btn danger" data-action="demolish-building" data-id="${b.id}">Remove</button>`}
      </div>
      <div class="sheet-hint">${b.type === 'keep' ? 'The Keep cannot be removed or upgraded.' : maxed ? 'This building is at its finest.' : up.ok ? 'Upgrading increases output, capacity and workforce.' : up.reason || ''}</div>`;
  }

  function updateSelection() {
    const sheet = $('#selectionSheet');
    const b = G.ui.selected ? G.state.buildings.find(x => x.id === G.ui.selected) : null;
    if (!b) {
      sheet.classList.remove('open');
      sheet.innerHTML = '';
      lastSheetHTML = '';
      $('#rightPanel').style.display = '';
      return;
    }
    sheet.classList.add('open');
    $('#rightPanel').style.display = 'none';
    const html = sheetHTML(b, lastEco);
    if (html !== lastSheetHTML) {
      lastSheetHTML = html;
      sheet.innerHTML = html;
    }
  }

  function updateSaveStatus() {
    const at = G.state.lastSaved;
    if (!at) { $('#saveStatus').textContent = 'The chronicle is safe'; return; }
    const sec = Math.max(0, Math.round((Date.now() - at) / 1000));
    $('#saveStatus').textContent = sec < 8 ? 'Chronicle saved just now' : sec < 60 ? `Chronicle saved ${sec}s ago` : 'Chronicle is safe';
  }

  function updateModalIfOpen() {
    if (modalKind === 'realm' && !$('#modalBackdrop').hidden) openRealm(true);
  }

  function refreshUI(force = false) {
    if (!G.state) return;
    lastEco = G.snapshot();
    G.state.happiness = lastEco.happiness;
    G.state.capacity = lastEco.capacity;
    G.state.jobs = lastEco.jobs;
    updateResources();
    updateLevel();
    updateHappiness();
    updateQuests();
    renderCards(force);
    updateLedger(lastEco);
    updateSelection();
    updateSaveStatus();
    if (modalKind === 'realm') updateModalIfOpen();
  }
  G.refreshUI = refreshUI;

  // ---------- modal ----------
  function openModal(html, kind = '') {
    modalKind = kind;
    $('#modalContent').innerHTML = html;
    $('#modalBackdrop').hidden = false;
  }

  function closeModal() {
    $('#modalBackdrop').hidden = true;
    modalKind = null;
    $('#modalContent').innerHTML = '';
  }

  function menuHTML() {
    return `
      <div class="modal-kicker">The Royal Chancery</div>
      <h2>Game Menu</h2>
      <p>Your chronicle is kept safe in this browser. The realm continues to grow while you tend to it.</p>
      <div class="modal-rule"></div>
      <div class="modal-menu">
        <button data-action="continue"><span class="menu-icon">▶</span><span><strong>Continue Ruling</strong><small>Return to the kingdom map</small></span></button>
        <button data-action="save"><span class="menu-icon">✎</span><span><strong>Save Chronicle</strong><small>Record resources, subjects and progress</small></span></button>
        <button data-action="load"><span class="menu-icon">↺</span><span><strong>Load Chronicle</strong><small>Restore your last saved kingdom</small></span></button>
        <button data-action="realm"><span class="menu-icon">♛</span><span><strong>Realm Overview</strong><small>Taxes, decrees and the contentment of your people</small></span></button>
        <button data-action="help"><span class="menu-icon">?</span><span><strong>How to Play</strong><small>Building, roads, workers and happiness</small></span></button>
        <button data-action="new"><span class="menu-icon">✦</span><span><strong>New Kingdom</strong><small>Begin a fresh chronicle in Valewood</small></span></button>
      </div>
      <div class="modal-actions"><button class="parchment-btn" data-action="close">Close</button></div>`;
  }

  function helpHTML() {
    return `
      <div class="modal-kicker">A Guide for the Crown</div>
      <h2>How to Play</h2>
      <p>Valewood begins as a humble hamlet. Build wisely, keep your people fed and content, and your realm will become a kingdom of legend.</p>
      <div class="help-grid">
        <div class="help-item"><strong>Build</strong><span>Choose a card in the Build dock, then tap a grassy plot. Tap as many plots as you wish; press Esc or Cancel to stop.</span></div>
        <div class="help-item"><strong>Resources</strong><span>Wood, stone and food are produced by buildings. Gold comes from taxes, markets and factories. Every building needs workers.</span></div>
        <div class="help-item"><strong>Roads</strong><span>Link a building to the Keep with adjacent road tiles. Connected producers earn a 20% bonus.</span></div>
        <div class="help-item"><strong>People</strong><span>Houses add housing. New subjects arrive when there is room, food and contentment. Jobs keep them busy.</span></div>
        <div class="help-item"><strong>Happiness</strong><span>Roads, wells, gardens, chapels and festivals raise contentment. High taxes, hunger, crowding and factories lower it.</span></div>
        <div class="help-item"><strong>Progress</strong><span>Building and growing earns renown. New levels unlock quarries, factories, markets, chapels and greater structures.</span></div>
        <div class="help-item"><strong>Upgrade</strong><span>Tap any building to inspect it. Upgrades increase output and housing, but cost materials.</span></div>
        <div class="help-item"><strong>Save</strong><span>The chronicle saves automatically every few seconds. Use the save button or menu to save or load manually.</span></div>
      </div>
      <p style="font-size:11.5px;color:#8a7148;font-style:italic">Mobile: drag the map to explore, pinch to zoom, and use the build dock at the bottom of the screen.</p>
      <div class="modal-actions"><button class="parchment-btn primary" data-action="close">Back to Valewood</button></div>`;
  }

  function realmHTML() {
    const eco = lastEco || G.snapshot();
    const s = G.state;
    const active = G.activeQuests();
    const quests = active.length ? active.map(q => `
      <div class="quest" style="margin-bottom:5px">
        <span class="quest-bullet">✦</span>
        <div class="quest-body"><div class="quest-name">${q.title}</div><div class="quest-desc">${q.desc}</div></div>
        <span class="quest-reward">${G.questProgress(q)}</span>
      </div>`).join('') : `<div class="ledger-empty">All decrees fulfilled.</div>`;
    return `
      <div class="modal-kicker">The Realm of Valewood</div>
      <h2>${G.levelData(s.level).title} Chronicle</h2>
      <p style="margin-bottom:5px">${G.happyNote(eco)}</p>
      <div class="ledger-summary" style="margin-top:10px">
        <div class="ledger-stat"><small>Renown</small><strong>Level ${s.level} <em>${Math.floor(s.xp)} xp</em></strong></div>
        <div class="ledger-stat"><small>Subjects</small><strong>${s.pop} <em>/ ${eco.capacity}</em></strong></div>
        <div class="ledger-stat"><small>Contentment</small><strong>${Math.round(eco.happiness)}% <em>${eco.happiness >= 68 ? 'content' : 'uneasy'}</em></strong></div>
        <div class="ledger-stat"><small>Workers</small><strong>${eco.employed} <em>/ ${eco.jobs} jobs</em></strong></div>
      </div>
      <div class="modal-rule"></div>
      <div class="section-title" style="padding-top:0"><span>Royal Decrees</span><strong>${s.completedQuests.length}/${G.QUESTS.length}</strong></div>
      ${quests}
      <div class="modal-rule"></div>
      <div class="tax-row" style="margin-bottom:6px"><span>Taxation</span>
        <div class="segmented" id="modalTax">
          <button data-tax="low" class="${s.tax === 'low' ? 'active' : ''}">Low</button>
          <button data-tax="normal" class="${s.tax === 'normal' ? 'active' : ''}">Fair</button>
          <button data-tax="high" class="${s.tax === 'high' ? 'active' : ''}">High</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 2px">
        <button class="parchment-btn" data-action="festival">${s.festival > 0 ? `Festival · ${Math.ceil(s.festival)}s` : 'Hold festival · 30 food · 25 gold'}</button>
        <button class="parchment-btn" data-action="save">Save</button>
        <button class="parchment-btn" data-action="load">Load</button>
        <button class="parchment-btn" data-action="center-map">Centre map</button>
      </div>
      <div class="modal-actions"><button class="parchment-btn primary" data-action="close">Return to map</button></div>`;
  }

  function openRealm(keepOpen = false) {
    openModal(realmHTML(), 'realm');
  }

  function newGameHTML() {
    return `
      <div class="modal-kicker">A New Chronicle</div>
      <h2>Begin Anew?</h2>
      <p>This will set aside your current kingdom and start again as a small hamlet. Your existing saved chronicle will be replaced.</p>
      <p class="new-game-confirm">This cannot be undone.</p>
      <div class="modal-actions">
        <button class="parchment-btn" data-action="close">Keep my kingdom</button>
        <button class="parchment-btn danger" data-action="new-confirm">Start fresh</button>
      </div>`;
  }

  // ---------- click delegation ----------
  document.addEventListener('click', e => {
    const taxBtn = e.target.closest('#taxControl [data-tax], #modalTax [data-tax]');
    if (taxBtn) {
      G.setTax(taxBtn.dataset.tax);
      flashResource('gold');
      refreshUI();
      return;
    }
    const buildCard = e.target.closest('[data-build]');
    if (buildCard) {
      const type = buildCard.dataset.build;
      if (type === '__demolish') {
        G.setDemolishMode();
        return;
      }
      const def = G.BUILDINGS[type];
      if (!def) return;
      if (G.state.level < def.unlock) {
        toast('Not yet unlocked', `${def.name} becomes available at renown level ${def.unlock}.`, 'bad', '⚿');
        return;
      }
      if (def.unique && (G.state.built[type] || 0) > 0) {
        toast('Already raised', `Only one ${def.name} may stand in Valewood.`, '', '✦');
        return;
      }
      G.setBuildMode(type);
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'close-sheet') { G.clearSelection(); return; }
      if (action === 'upgrade') {
        const id = actionEl.dataset.id;
        if (G.upgrade(id)) { flashResource('wood'); refreshUI(true); }
        return;
      }
      if (action === 'demolish-building') {
        const id = actionEl.dataset.id;
        G.demolish(id);
        G.clearSelection();
        refreshUI(true);
        return;
      }
      if (action === 'save') { G.saveGame(true); updateSaveStatus(); return; }
      if (action === 'load') {
        if (!G.hasSave()) { toast('No chronicle found', 'There is no saved kingdom in this browser yet.', 'bad', '✕'); return; }
        const ok = G.loadGame();
        if (ok) {
          closeModal();
          G.ui.selected = null; G.ui.buildType = null; G.ui.demolish = false;
          G.setModeUI();
          G.camera.panX = 0; G.camera.panY = 0; G.camera.userZoom = 1;
          G.resizeWorld();
          refreshUI(true);
          toast('Chronicle restored', 'Your kingdom has been returned to you.', 'good', '↺');
        } else toast('Could not load', 'The chronicle appears to be damaged.', 'bad', '✕');
        return;
      }
      if (action === 'new') { openModal(newGameHTML(), 'new'); return; }
      if (action === 'new-confirm') {
        G.deleteSave();
        G.newGame();
        G.ui.selected = null; G.ui.buildType = null; G.ui.demolish = false;
        G.camera.panX = 0; G.camera.panY = 0; G.camera.userZoom = 1;
        G.resizeWorld();
        G.saveGame(false);
        cardsSignature = '';
        lastQuestsHTML = ''; lastLedgerHTML = ''; lastSheetHTML = '';
        G.setModeUI();
        refreshUI(true);
        closeModal();
        toast('A new chronicle', 'Valewood begins again as a humble hamlet.', 'good', '✦');
        return;
      }
      if (action === 'help') { openModal(helpHTML(), 'help'); return; }
      if (action === 'realm') { openRealm(); return; }
      if (action === 'festival') { if (G.holdFestival()) refreshUI(); return; }
      if (action === 'center-map') {
        G.camera.panX = 0; G.camera.panY = 0; G.camera.userZoom = 1; G.resizeWorld();
        closeModal();
        return;
      }
      if (action === 'continue' || action === 'close') { closeModal(); return; }
    }
  });

  $('#saveBtn').addEventListener('click', () => { G.saveGame(true); updateSaveStatus(); });
  $('#menuBtn').addEventListener('click', () => openModal(menuHTML(), 'menu'));
  $('#realmBtn').addEventListener('click', () => openRealm());
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', e => { if (e.target === $('#modalBackdrop')) closeModal(); });
  $('#cancelBuild').addEventListener('click', () => G.cancelBuild());
  $('#festivalBtn').addEventListener('click', () => { if (G.holdFestival()) refreshUI(); });
  $('#soundBtn').addEventListener('click', () => {
    G.state.soundOn = !G.state.soundOn;
    document.body.classList.toggle('muted', !G.state.soundOn);
    G.state.dirty = true;
    if (G.state.soundOn) { ensureAudio(); tone(523.3, .14, 'sine', .02); }
    toast(G.state.soundOn ? 'Sound on' : 'Sound off', G.state.soundOn ? 'The minstrels return.' : 'The hall falls quiet.', '', G.state.soundOn ? '♪' : '·');
  });

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      G.saveGame(true);
      return;
    }
    if (e.key === 'Escape') {
      if (!$('#modalBackdrop').hidden) closeModal();
      else if (G.ui.buildType || G.ui.demolish) G.cancelBuild();
      else if (G.ui.selected) G.clearSelection();
    }
  });

  window.addEventListener('beforeunload', () => { try { G.saveGame(false); } catch { /* noop */ } });

  // ---------- boot ----------
  function startSimulation() {
    lastTick = performance.now();
    setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, (now - lastTick) / 1000);
      lastTick = now;
      if (!document.hidden) G.simulate(dt);
    }, 250);

    setInterval(() => refreshUI(), 500);

    setInterval(() => {
      if (G.state.dirty) {
        G.saveGame(false);
        updateSaveStatus();
      }
    }, 12000);
  }

  // restore or begin
  function primeState() {
    let restored = false;
    if (G.hasSave()) restored = G.loadGame();
    if (!restored) G.newGame();
    document.body.classList.toggle('muted', !G.state.soundOn);
    G.ui.selected = null;
    G.ui.buildType = null;
    G.ui.demolish = false;
    if (G.setModeUI) G.setModeUI();
    return restored;
  }

  async function boot() {
    if (booted) return;
    booted = true;
    makeResourceBar();
    const minVisible = new Promise(r => setTimeout(r, 620));
    const art = G.loadArt ? G.loadArt() : Promise.resolve();
    await Promise.all([art, minVisible, document.fonts ? document.fonts.ready : Promise.resolve()]);
    const restored = primeState();
    G.resizeWorld();
    G.startWorld();
    refreshUI(true);
    startSimulation();
    setTimeout(() => {
      $('#loadingVeil').classList.add('done');
      setTimeout(() => { const veil = $('#loadingVeil'); if (veil) veil.remove(); }, 800);
    }, 150);
    if (restored) {
      setTimeout(() => toast('Chronicle restored', 'Valewood welcomes back its sovereign.', 'good', '↺'), 750);
    } else {
      setTimeout(() => toast('Welcome to Valewood', 'Your first decree awaits in the Royal Chronicle.', 'good', '♛'), 750);
    }
  }

  window.addEventListener('load', boot);
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', () => { /* load event handles it */ });
})();
