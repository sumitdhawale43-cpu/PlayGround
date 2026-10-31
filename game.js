/* ══════════════════════════════════════════════════════════════
   GOD COMPLEX — game controller
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const E = window.GodComplex;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const state = {
    screen: 'title',
    beaten: new Set(),
    stolen: new Set(),
    equipped: [],
    defeats: 0,
    fights: 0,
    battle: null,
    busy: false,
    finishing: false,
    modalLocked: false,
    seenRules: false,
    muted: false,
    soundOn: false
  };

  try { state.muted = localStorage.getItem('god-complex-muted') === '1'; } catch (e) { /* private mode */ }

  const el = {};

  /* ── helpers ─────────────────────────────────────────────── */

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function hexRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const num = parseInt(full, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function setMood(color) {
    const rgb = hexRgb(color || '#d9b978');
    document.documentElement.style.setProperty('--mood-rgb', rgb.join(', '));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#06060b');
  }

  function bossById(id) { return E.BOSSES.find((b) => b.id === id); }
  function abilityOf(boss) { return E.ABILITIES[boss.ability]; }

  function currentIndex() {
    for (let i = 0; i < 7; i++) if (!state.beaten.has(E.BOSSES[i].id)) return i;
    return 7;
  }

  function finalUnlocked() {
    return E.BOSSES.slice(0, 7).every((b) => state.beaten.has(b.id));
  }

  function playerTitle() {
    const n = state.defeats;
    if (n === 0) return 'THE UNBROKEN';
    if (n === 1) return 'THE ONCE-BROKEN';
    if (n === 2) return 'THE TWICE-BROKEN';
    if (n === 3) return 'THE THRICE-BROKEN';
    if (n === 4) return 'THE FOURFOLD BROKEN';
    if (n === 5) return 'THE FIVEFOLD BROKEN';
    return 'THE MANY-BROKEN';
  }

  function statLine() {
    return E.playerStats(state.stolen.size);
  }

  function toast(message, ms) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.toast.classList.remove('show'), ms || 2400);
  }

  /* ── sigils ──────────────────────────────────────────────── */

  let sigilSeq = 0;

  function polar(cx, cy, r, deg) {
    const rad = (deg * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  }

  function polygon(sides, radius, rotation, cx, cy) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const p = polar(cx || 100, cy || 100, radius, (360 / sides) * i + rotation);
      pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1));
    }
    return pts.join(' ');
  }

  function sigil(data, color, opts) {
    opts = opts || {};
    const sides = data.sides || 6;
    const rot = data.rot || 0;
    const rings = data.rings || 2;
    const mini = !!opts.mini;
    const sw = mini ? 2.6 : 0.9;
    const rw = mini ? 1.7 : 0.7;
    const id = 'gc-sigil-' + (++sigilSeq);
    const ray = [];
    for (let i = 0; i < sides; i++) {
      const a = (360 / sides) * i + rot;
      const p1 = polar(100, 100, 59, a);
      const p2 = polar(100, 100, 76, a);
      ray.push(`<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="${color}" stroke-opacity=".4" stroke-width="${rw}"/>`);
    }
    const ringMarks = [];
    for (let i = 1; i <= rings; i++) {
      const r = 87 - (i - 1) * 8;
      ringMarks.push(`<circle cx="100" cy="100" r="${r}" fill="none" stroke="${color}" stroke-opacity="${0.23 - i * 0.03}" stroke-width="${rw}" stroke-dasharray="${i === 1 ? '1 7' : '18 5'}"/>`);
    }
    const crown = opts.crown
      ? `<path d="M74 49 L86 62 L100 43 L114 62 L126 49" fill="none" stroke="${color}" stroke-width="${mini ? 5 : 1.2}" stroke-linejoin="round" stroke-opacity=".85"/>`
      : '';
    const diamond = opts.crown
      ? `<path d="M100 78 L108 92 L100 106 L92 92 Z" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="${mini ? 2 : 0.8}" stroke-opacity=".7"/>`
      : '';
    return `<svg viewBox="0 0 200 200" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="${opts.crown ? 0.26 : 0.2}"/>
          <stop offset="62%" stop-color="${color}" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill="url(#${id})"/>
      <g class="sigil-rings">${ringMarks.join('')}</g>
      <g class="sigil-rings sigil-rings-alt">
        <circle cx="100" cy="100" r="82" fill="none" stroke="${color}" stroke-opacity=".14" stroke-width="${rw}" stroke-dasharray="2 12"/>
      </g>
      ${ray.join('')}
      <g class="sigil-shape">
        <polygon points="${polygon(sides, 52, rot)}" fill="${color}" fill-opacity="${mini ? 0.13 : 0.045}" stroke="${color}" stroke-opacity=".7" stroke-width="${sw}"/>
        <polygon points="${polygon(sides, 31, -rot * 0.55 + 9)}" fill="none" stroke="${color}" stroke-opacity=".34" stroke-width="${mini ? 2 : 0.7}"/>
      </g>
      ${crown}
      <g class="sigil-eye">
        ${diamond}
        <path d="M57 100 Q100 75 143 100 Q100 125 57 100 Z" fill="${color}" fill-opacity="${mini ? 0.1 : 0.055}" stroke="${color}" stroke-opacity=".85" stroke-width="${mini ? 4 : 1.1}"/>
        <circle cx="100" cy="100" r="8.5" fill="${color}" fill-opacity=".22" stroke="${color}" stroke-opacity=".9" stroke-width="${mini ? 2 : 0.8}"/>
        <circle cx="100" cy="100" r="3.2" fill="${color}"/>
        <circle cx="97.6" cy="97.4" r="1.1" fill="#fff" fill-opacity=".8"/>
      </g>
      <circle cx="100" cy="100" r="96" fill="none" stroke="${color}" stroke-opacity=".12" stroke-width="${rw}"/>
    </svg>`;
  }

  function bossSigil(boss, opts) {
    return sigil(boss.sigil, boss.color, opts);
  }

  function playerSigil(opts) {
    return sigil({ sides: 4, rot: 45, rings: 3 }, '#d9b978', Object.assign({ crown: true }, opts));
  }

  /* ── sound ───────────────────────────────────────────────── */

  const Sound = (function () {
    let ctx = null;
    let muted = state.muted;

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      return ctx;
    }

    function tone(freq, dur, opts) {
      opts = opts || {};
      const c = ensure();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      const t = c.currentTime + (opts.delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opts.gain || 0.03, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.06);
    }

    function noise(dur, gain, cutoff) {
      const c = ensure();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
      const src = c.createBufferSource();
      src.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff || 1400;
      const g = c.createGain();
      g.gain.value = gain || 0.035;
      src.connect(filter).connect(g).connect(c.destination);
      src.start();
    }

    function play(name) {
      if (muted) return;
      switch (name) {
        case 'click':
          tone(700, 0.05, { to: 880, type: 'square', gain: 0.012 });
          break;
        case 'hit':
          noise(0.12, 0.045);
          tone(120, 0.18, { to: 42, type: 'sawtooth', gain: 0.045 });
          break;
        case 'hurt':
          noise(0.17, 0.05, 900);
          tone(88, 0.24, { to: 34, type: 'sawtooth', gain: 0.05 });
          break;
        case 'guard':
          tone(300, 0.18, { type: 'triangle', gain: 0.025 });
          tone(452, 0.2, { type: 'triangle', gain: 0.018, delay: 0.035 });
          break;
        case 'ability':
          tone(320, 0.16, { to: 560, type: 'sine', gain: 0.025 });
          tone(640, 0.22, { type: 'sine', gain: 0.012, delay: 0.05 });
          break;
        case 'heal':
          tone(440, 0.2, { type: 'sine', gain: 0.026 });
          tone(660, 0.26, { type: 'sine', gain: 0.02, delay: 0.07 });
          break;
        case 'steal':
          [220, 277, 330, 440].forEach((f, i) => tone(f, 0.26, { type: 'triangle', gain: 0.032, delay: i * 0.09 }));
          break;
        case 'win':
          [261, 329, 392, 523].forEach((f, i) => tone(f, 0.9, { type: 'sine', gain: 0.026, delay: i * 0.11 }));
          break;
        case 'lose':
          [180, 144, 108].forEach((f, i) => tone(f, 0.7, { type: 'sine', gain: 0.035, delay: i * 0.15 }));
          break;
        case 'turn':
          tone(150, 0.18, { to: 110, type: 'sine', gain: 0.02 });
          break;
        case 'stun':
          tone(780, 0.3, { to: 220, type: 'sine', gain: 0.03 });
          break;
        case 'start':
          tone(196, 0.5, { type: 'sine', gain: 0.02 });
          tone(294, 0.6, { type: 'sine', gain: 0.015, delay: 0.12 });
          break;
        default:
          break;
      }
    }

    return {
      play,
      setMuted(value) { muted = value; },
      isMuted() { return muted; }
    };
  })();

  function updateSoundButton() {
    el.mute.textContent = state.muted ? 'SOUND OFF' : 'SOUND ON';
    el.mute.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
  }

  /* ── stars ───────────────────────────────────────────────── */

  const Stars = (function () {
    const canvas = $('#cosmos');
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = 1, stars = [], started = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      makeStars();
    }

    function makeStars() {
      const count = Math.max(60, Math.min(200, Math.floor((width * height) / 10500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.25 + 0.15,
        z: Math.random(),
        phase: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.007 + 0.002
      }));
    }

    function frame(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        if (!reduced) {
          s.y -= s.drift;
          if (s.y < -4) { s.y = height + 4; s.x = Math.random() * width; }
        }
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.0007 + s.phase);
        const alpha = (0.12 + s.z * 0.55) * twinkle;
        const gold = s.z > 0.82;
        ctx.beginPath();
        ctx.fillStyle = gold ? `rgba(232, 201, 134, ${alpha})` : `rgba(228, 226, 236, ${alpha})`;
        ctx.arc(s.x, s.y, s.r * (gold ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    return {
      start() {
        if (started) return;
        started = true;
        resize();
        window.addEventListener('resize', resize, { passive: true });
        if (reduced) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, width, height);
          for (const s of stars) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(228, 226, 236, ${0.15 + s.z * 0.45})`;
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          requestAnimationFrame(frame);
        }
      }
    };
  })();

  /* ── screens & modals ────────────────────────────────────── */

  function showScreen(name) {
    state.screen = name;
    document.body.dataset.screen = name;
    $$('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === 'screen-' + name));
    if (name === 'ladder') {
      renderLadder();
      const screen = $('#screen-ladder');
      if (screen) screen.scrollTop = 0;
    }
    if (name === 'title') setMood('#d9b978');
  }

  function openModal(html, opts) {
    opts = opts || {};
    state.modalLocked = !!opts.locked;
    el.modalPanel.className = 'modal-panel' + (opts.wide ? ' wide' : '');
    el.modalBody.innerHTML = html;
    el.modal.classList.add('open');
    el.modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const focusable = el.modalBody.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus({ preventScroll: true });
    }, 60);
  }

  function closeModal() {
    el.modal.classList.remove('open');
    el.modal.setAttribute('aria-hidden', 'true');
    state.modalLocked = false;
  }

  function modalOpen() {
    return el.modal.classList.contains('open');
  }

  function rulesModal() {
    openModal(`
      <p class="modal-kicker">THE ONLY RULE</p>
      <h2 class="modal-title" id="modalTitle">YOU CANNOT STEAL<br>FROM ANYONE<br>YOU DEFEAT.</h2>
      <p class="modal-copy">Only a god who breaks you leaves something behind. Their gift becomes yours &mdash; permanently.</p>
      <ol class="rules-list">
        <li><strong>Fight the ladder.</strong> Eight rings. Seven gods between you and the summit.</li>
        <li><strong>Lose to take.</strong> When a god defeats you, you absorb their gift. Yield at any time. Losing is the mechanic.</li>
        <li><strong>Return stronger.</strong> Every stolen gift raises your vitality and strike. Equip three gifts at a time.</li>
        <li><strong>Decide what you are.</strong> The God Complex waits at the top. You cannot steal what you defeat.</li>
      </ol>
      <p class="modal-copy small">A win takes nothing. A loss takes everything they had. Choose accordingly.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-act="close"><span>I UNDERSTAND</span><span class="btn-arrow">→</span></button>
      </div>
    `, { locked: false, wide: true });
  }

  /* ── ladder rendering ────────────────────────────────────── */

  function renderLadder() {
    const cur = currentIndex();
    const stats = statLine();
    const final = finalUnlocked();
    const rows = E.BOSSES.map((boss, i) => {
      const isFinal = i === 7;
      const beaten = state.beaten.has(boss.id);
      const stolen = state.stolen.has(boss.ability);
      const locked = isFinal ? !final : i > cur;
      const current = i === cur;
      const ability = abilityOf(boss);
      const giftLabel = isFinal ? 'GODHOOD' : ability.name;
      let action;
      if (locked) {
        action = `<button class="fight-btn sealed" type="button" disabled>SEALED</button>`;
      } else if (isFinal) {
        action = `<button class="fight-btn ${beaten ? 'rematch' : ''}" type="button" data-fight="${boss.id}">${beaten ? 'REMATCH' : 'FACE GOD'}</button>`;
      } else if (beaten) {
        action = `<button class="fight-btn rematch" type="button" data-fight="${boss.id}">REMATCH</button>`;
      } else {
        action = `<button class="fight-btn" type="button" data-fight="${boss.id}">CHALLENGE</button>`;
      }
      const tags = [];
      if (!locked || isFinal) {
        tags.push(`<span class="tag gift">${isFinal ? 'GIFT: GODHOOD' : 'GIFT: ' + esc(giftLabel)}</span>`);
      }
      if (beaten) tags.push(`<span class="tag stolen">VANQUISHED</span>`);
      if (stolen) tags.push(`<span class="tag stolen">STOLEN</span>`);
      else if (beaten && !isFinal) tags.push(`<span class="tag unclaimed">UNCLAIMED</span>`);
      if (locked && !isFinal) tags.push(`<span class="tag sealed">SEALED</span>`);

      return `
        <article class="ladder-row ${current ? 'current' : ''} ${locked ? 'locked' : ''} ${isFinal ? 'final-row' : ''}" style="--boss:${boss.color}">
          <span class="row-index">${String(i + 1).padStart(2, '0')}</span>
          <div class="row-sigil">${bossSigil(boss, { mini: true })}</div>
          <div class="row-main">
            <h3 class="row-name">${esc(boss.name)}</h3>
            <p class="row-epithet">${esc(boss.epithet)}</p>
            <div class="row-tags">${tags.join('')}</div>
          </div>
          <div class="row-action">${action}</div>
        </article>`;
    }).join('');

    el.ladderList.innerHTML = rows;
    el.ladderProgress.textContent = state.stolen.size + ' / 7 GIFTS';
    el.giftCount.textContent = state.stolen.size + ' / 7';
    el.headLosses.textContent = 'DEFEATS ' + state.defeats;
    el.statHp.textContent = stats.maxHp;
    el.statStrike.textContent = stats.strike;
    el.statGifts.textContent = state.stolen.size;
    el.ladderNote.textContent = final
      ? 'The summit is open. You cannot steal from what you defeat.'
      : 'Losing is not failure. It is the only way up.';
    renderArsenal();
  }

  function renderArsenal() {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const id = state.equipped[i];
      if (id) {
        const ability = E.ABILITIES[id];
        const srcBoss = E.BOSSES.find((b) => b.ability === id);
        slots.push(`
          <button class="slot filled" type="button" data-gift="${id}" style="--gift:${ability.color}" aria-label="Unequip ${esc(ability.name)}">
            <span class="slot-remove">×</span>
            <span class="slot-icon">${srcBoss ? bossSigil(srcBoss, { mini: true }) : ''}</span>
            <span class="slot-name">${esc(ability.name)}</span>
          </button>`);
      } else {
        slots.push(`
          <div class="slot empty" aria-label="Empty loadout slot">
            <span class="slot-empty-mark">◇</span>
            <span class="slot-empty-text">EMPTY</span>
          </div>`);
      }
    }
    el.loadoutSlots.innerHTML = slots.join('');

    const owned = E.BOSSES.filter((boss) => bootstrapAbility(boss) && state.stolen.has(boss.ability));
    if (!owned.length) {
      el.giftGrid.innerHTML = `<div class="gift-empty">No gifts yet.<br>Let a god defeat you. Take what they used.</div>`;
    } else {
      el.giftGrid.innerHTML = owned.map((boss) => {
        const ability = E.ABILITIES[boss.ability];
        const equipped = state.equipped.includes(ability.id);
        return `
          <button class="gift-chip ${equipped ? 'equipped' : ''}" type="button" data-gift="${ability.id}" style="--gift:${ability.color}" aria-pressed="${equipped}">
            <span class="mini">${bossSigil(boss, { mini: true })}</span>
            <span class="chip-text">
              <span class="chip-name">${esc(ability.name)}</span>
              <span class="chip-source">${esc(ability.source)}</span>
            </span>
            <span class="chip-state">${equipped ? 'ON' : 'OFF'}</span>
          </button>`;
      }).join('');
    }

    el.arsenalHint.textContent = state.stolen.size
      ? 'Tap a stolen gift to equip or unequip it. Three gifts travel with you; all of them make you stronger.'
      : 'Every gift you steal raises your vitality and strike. First, you have to lose.';
  }

  function bootstrapAbility(boss) {
    return !!boss.ability;
  }

  function toggleGift(id) {
    if (!state.stolen.has(id)) return;
    const index = state.equipped.indexOf(id);
    if (index >= 0) {
      state.equipped.splice(index, 1);
      Sound.play('click');
      renderLadder();
      return;
    }
    if (state.equipped.length >= 3) {
      toast('LOADOUT FULL — TAP AN EQUIPPED GIFT TO REMOVE IT');
      Sound.play('click');
      return;
    }
    state.equipped.push(id);
    Sound.play('click');
    renderLadder();
  }

  function attentionArsenal() {
    renderLadder();
    setTimeout(() => {
      el.arsenal.classList.remove('attention');
      void el.arsenal.offsetWidth;
      el.arsenal.classList.add('attention');
      el.arsenal.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.arsenal.classList.remove('attention'), 4200);
    }, 80);
  }

  /* ── battle setup ────────────────────────────────────────── */

  function startBattle(bossId) {
    const boss = bossById(bossId);
    if (!boss) return;
    closeModal();
    const stats = statLine();
    state.battle = E.createBattle({
      bossId: boss.id,
      equipped: state.equipped,
      maxHp: stats.maxHp,
      strike: stats.strike
    });
    state.fights += 1;
    state.busy = false;
    state.finishing = false;
    setMood(boss.color);
    showScreen('battle');
    el.arena.style.setProperty('--boss', boss.color);
    el.enemyCard.classList.remove('defeated');
    el.playerCard.classList.remove('defeated');
    el.battleBossName.textContent = boss.name;
    el.battleRound.textContent = boss.index === 7 ? 'THE SUMMIT' : 'RING ' + ROMAN[boss.index];
    el.arenaRing.textContent = ROMAN[boss.index];
    el.enemyName.textContent = boss.name;
    el.enemyEpithet.textContent = boss.epithet;
    el.enemyPortrait.style.setProperty('--boss', boss.color);
    el.enemyCard.style.setProperty('--boss', boss.color);
    el.enemyPortrait.innerHTML = bossSigil(boss);
    el.playerPortrait.innerHTML = playerSigil();
    el.playerSub.textContent = playerTitle();
    renderBattle();
    el.actionRow.scrollLeft = 0;
    Sound.play('start');
    battleIntro(boss);
  }

  function battleIntro(boss) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const node = document.createElement('div');
    node.className = 'battle-intro';
    node.style.setProperty('--boss', boss.color);
    node.innerHTML = `<span>${boss.index === 7 ? 'THE SUMMIT' : 'RING ' + ROMAN[boss.index]}</span><strong>${esc(boss.name)}</strong><em>${esc(boss.intro)}</em>`;
    el.arena.appendChild(node);
    setTimeout(() => node.remove(), 2300);
  }

  /* ── battle rendering ────────────────────────────────────── */

  function statusChips(actor, isEnemy) {
    const out = [];
    if (actor.burn.turns > 0 && actor.burn.dmg > 0) out.push(`<span class="status burn"><i></i>BURN ${actor.burn.dmg} · ${actor.burn.turns}</span>`);
    if (actor.weak > 0) out.push(`<span class="status weak"><i></i>WEAK ${actor.weak}</span>`);
    if (actor.vulnerable > 0) out.push(`<span class="status vulnerable"><i></i>EXPOSED ${actor.vulnerable}</span>`);
    if (actor.strength > 0) out.push(`<span class="status strength"><i></i>STR +${actor.strength}</span>`);
    if (actor.thorns.dmg > 0 && actor.thorns.turns > 0) out.push(`<span class="status thorns"><i></i>THORNS ${actor.thorns.dmg} · ${actor.thorns.turns}</span>`);
    if (isEnemy && actor.stun > 0) out.push(`<span class="status stun"><i></i>STUNNED ${actor.stun}</span>`);
    return out.join('');
  }

  function renderBattle() {
    const battle = state.battle;
    if (!battle) return;
    const p = battle.player;
    const e = battle.enemy;
    const boss = battle.boss;

    el.playerHpText.textContent = p.hp + ' / ' + p.maxHp;
    el.enemyHpText.textContent = e.hp + ' / ' + e.maxHp;
    const pPct = Math.max(0, (p.hp / p.maxHp) * 100);
    const ePct = Math.max(0, (e.hp / e.maxHp) * 100);
    el.playerHpBar.style.width = pPct + '%';
    el.enemyHpBar.style.width = ePct + '%';
    el.playerHpGhost.style.width = pPct + '%';
    el.playerHpBar.classList.toggle('danger', pPct <= 30);

    el.playerBlock.hidden = !p.block;
    el.enemyBlock.hidden = !e.block;
    el.playerBlock.querySelector('b').textContent = p.block;
    el.enemyBlock.querySelector('b').textContent = e.block;

    el.playerStatuses.innerHTML = statusChips(p, false);
    el.enemyStatuses.innerHTML = statusChips(e, true);
    el.playerSub.textContent = playerTitle();

    const passive = boss.passive;
    el.enemyPassive.innerHTML = passive
      ? `<b>${esc(passive.name)}</b> — ${esc(passive.text)}`
      : '';

    const move = E.intent(battle);
    if (move) {
      el.intentName.textContent = move.name;
      el.intentBody.textContent = E.describeIntent(battle);
      el.intentCard.classList.toggle('stunned', e.stun > 0);
    }

    el.turnBadge.textContent = 'TURN ' + String(battle.turn).padStart(2, '0');
    el.energyPips.innerHTML = Array.from({ length: p.maxEnergy }, (_, i) => `<span class="pip ${i < p.energy ? 'full' : ''}"></span>`).join('');
    renderLog(battle);
    renderActions(battle);

    el.endBtn.disabled = state.busy || battle.phase !== 'player';
    el.yieldBtn.disabled = state.busy || battle.phase !== 'player';
    el.yieldBtn.textContent = boss.id === 'god' ? 'YIELD TO GOD' : 'YIELD';
  }

  function renderLog(battle) {
    const entries = battle.log.slice(-5);
    el.battleLog.innerHTML = entries.map((entry) => `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`).join('');
  }

  function renderActions(battle) {
    const p = battle.player;
    const cards = [];

    cards.push(actionCard({
      id: 'strike', name: 'Strike', cost: 1, state: 'READY', desc: 'Deal ' + battle.strikeDamage + ' damage.',
      color: '#d9b978', key: '1', simple: true
    }));
    cards.push(actionCard({
      id: 'guard', name: 'Guard', cost: 1, state: 'READY', desc: 'Gain ' + battle.guard + ' block until your next turn.',
      color: '#9fb8c8', key: '2', simple: true
    }));

    battle.equipped.forEach((id, i) => {
      const ability = E.ABILITIES[id];
      if (!ability) return;
      const cd = p.cooldowns[id] || 0;
      let status = 'READY';
      if (cd > 0) status = cd + (cd > 1 ? ' TURNS' : ' TURN');
      else if (p.energy < ability.cost) status = 'NEED ' + ability.cost;
      cards.push(actionCard({
        id, name: ability.name, cost: ability.cost, state: status,
        desc: ability.desc, color: ability.color, key: String(3 + i), cd
      }));
    });

    el.actionRow.innerHTML = cards.join('');
    $$('.action-card', el.actionRow).forEach((button) => {
      const id = button.dataset.action;
      const usable = E.canUse(battle, id);
      button.disabled = state.busy || !usable;
      if (!usable && !state.busy) {
        button.classList.add('unaffordable');
        const cd = button.dataset.cd ? Number(button.dataset.cd) : 0;
        if (cd > 0 && button.dataset.reason !== 'cooldown') button.title = 'On cooldown';
      }
    });
  }

  function actionCard(opts) {
    return `
      <button class="action-card ${opts.simple ? 'simple' : ''}" type="button" data-action="${opts.id}" data-cd="${opts.cd || 0}" style="--gift:${opts.color}">
        <span class="card-top">
          <span class="card-cost"><span>${opts.cost}</span></span>
          <span class="card-state ${opts.state === 'READY' ? 'ready' : ''}">${opts.state}</span>
        </span>
        <span class="card-name">${esc(opts.name)}</span>
        <span class="card-desc">${esc(opts.desc)}</span>
        <span class="card-key">${opts.key || ''}</span>
      </button>`;
  }

  /* ── animations ──────────────────────────────────────────── */

  function spawnFloater(target, text, cls, offset) {
    const arena = el.arena;
    const node = target === 'enemy' ? el.enemyPortrait : el.playerPortrait;
    if (!node || !arena) return;
    const ar = arena.getBoundingClientRect();
    const tr = node.getBoundingClientRect();
    if (!tr.width) return;
    const floater = document.createElement('div');
    floater.className = 'floater ' + (cls || '');
    floater.textContent = text;
    const jitter = offset || 0;
    floater.style.left = (tr.left - ar.left + tr.width / 2 + jitter) + 'px';
    floater.style.top = (tr.top - ar.top + tr.height * 0.44) + 'px';
    el.floaters.appendChild(floater);
    setTimeout(() => floater.remove(), 1000);
  }

  function shake(node) {
    if (!node) return;
    node.classList.remove('is-hit');
    void node.offsetWidth;
    node.classList.add('is-hit');
    setTimeout(() => node.classList.remove('is-hit'), 460);
  }

  function slash() {
    const node = el.slash;
    node.classList.remove('cut');
    void node.offsetWidth;
    node.classList.add('cut');
    setTimeout(() => node.classList.remove('cut'), 340);
  }

  function shakeArena() {
    el.arena.classList.remove('is-shaking');
    void el.arena.offsetWidth;
    el.arena.classList.add('is-shaking');
    setTimeout(() => el.arena.classList.remove('is-shaking'), 430);
  }

  function playEvents(events, action) {
    let enemyDamage = 0;
    let playerDamage = 0;
    let playerHeal = 0;
    let enemyHeal = 0;
    let playerBlock = 0;
    let enemyBlock = 0;
    let enemyBuff = 0;
    let stunned = false;

    for (const event of events) {
      switch (event.type) {
        case 'enemyHit':
          enemyDamage += event.amount;
          enemyBlock += event.blocked;
          break;
        case 'enemyBypass':
          enemyDamage += event.amount;
          break;
        case 'playerHit':
          playerDamage += event.amount;
          break;
        case 'playerBypass':
          if (event.source === 'thorns') {
            playerDamage += event.amount;
            spawnFloater('player', '−' + event.amount, 'thorns', 16);
          } else {
            playerDamage += event.amount;
          }
          break;
        case 'playerHeal':
          playerHeal += event.amount;
          break;
        case 'enemyHeal':
          enemyHeal += event.amount;
          break;
        case 'playerBlock':
          playerBlock += event.amount;
          break;
        case 'enemyBlock':
          enemyBlock += event.amount;
          break;
        case 'enemyBuff':
          enemyBuff += event.amount;
          break;
        case 'enemyStunned':
          stunned = true;
          break;
        default:
          break;
      }
    }

    if (enemyDamage > 0) {
      spawnFloater('enemy', '−' + enemyDamage, 'enemy');
      if (action === 'guard' || action === 'frost') Sound.play('guard');
      else Sound.play('hit');
      shake(el.enemyPortrait);
      if (action === 'strike' || action === 'chain' || action === 'singularity' || action === 'blood') slash();
    }
    if (enemyBlock > 0 && action === 'enemy') {
      spawnFloater('enemy', '+' + enemyBlock + ' ◇', 'block', -28);
    }
    if (playerDamage > 0) {
      spawnFloater('player', '−' + playerDamage, 'player');
      shake(el.playerPortrait);
      shakeArena();
      Sound.play('hurt');
    }
    if (playerBlock > 0) {
      spawnFloater('player', '+' + playerBlock + ' BLOCK', 'block', 22);
      Sound.play('guard');
    }
    if (playerHeal > 0) {
      spawnFloater('player', '+' + playerHeal, 'heal', -22);
      el.playerPortrait.classList.add('is-healing');
      setTimeout(() => el.playerPortrait.classList.remove('is-healing'), 620);
      Sound.play('heal');
    }
    if (enemyHeal > 0) {
      spawnFloater('enemy', '+' + enemyHeal, 'heal', 22);
      el.enemyPortrait.classList.add('is-healing');
      setTimeout(() => el.enemyPortrait.classList.remove('is-healing'), 620);
    }
    if (enemyBuff > 0) {
      spawnFloater('enemy', '+' + enemyBuff + ' STR', 'heal', -26);
    }
    if (stunned) {
      spawnFloater('enemy', 'STUNNED', 'block');
      Sound.play('stun');
    }
  }

  /* ── turn flow ───────────────────────────────────────────── */

  async function act(action) {
    const battle = state.battle;
    if (!battle || state.busy || battle.phase !== 'player') return;
    if (!E.canUse(battle, action)) {
      Sound.play('click');
      return;
    }
    state.busy = true;
    const result = E.playerAction(battle, action);
    if (!result.ok) {
      state.busy = false;
      return;
    }
    renderBattle();
    playEvents(result.events, action);
    if (battle.phase === 'won' || battle.phase === 'lost') {
      await wait(900);
      finishBattle(battle.phase);
      return;
    }
    await wait(100);
    state.busy = false;
    renderBattle();
  }

  async function endTurn() {
    const battle = state.battle;
    if (!battle || state.busy || battle.phase !== 'player') return;
    state.busy = true;
    renderBattle();
    Sound.play('turn');
    await wait(260);
    if (!state.battle || state.battle !== battle || battle.phase !== 'player') return;
    const result = E.endTurn(battle);
    renderBattle();
    playEvents(result.events, 'enemy');
    if (battle.phase === 'won' || battle.phase === 'lost') {
      await wait(950);
      finishBattle(battle.phase);
      return;
    }
    await wait(520);
    state.busy = false;
    renderBattle();
  }

  function confirmYield() {
    const battle = state.battle;
    if (!battle || state.busy || battle.phase !== 'player') return;
    const boss = battle.boss;
    const isFinal = boss.id === 'god';
    const hasGift = state.stolen.has(boss.ability) || isFinal;
    const ability = isFinal ? E.ABILITIES.godhood : E.ABILITIES[boss.ability];
    const copy = isFinal
      ? 'It will defeat you. That is the only door left. You cannot steal from a god you defeat &mdash; only from the one who breaks you.'
      : hasGift
        ? 'You already carry their gift. Yielding will end the fight, but nothing new will be taken.'
        : `They will defeat you, and you will take <strong>${esc(ability.name)}</strong>. The fight ends. The gift stays.`;
    openModal(`
      <p class="modal-kicker">${isFinal ? 'THE LAST DOOR' : 'THE RULE, APPLIED'}</p>
      <h2 class="modal-title" id="modalTitle">${isFinal ? 'YIELD TO<br>THE GOD COMPLEX?' : 'YIELD TO<br>' + esc(boss.name) + '?'}</h2>
      <p class="modal-copy">${copy}</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-act="yield-confirm"><span>${isFinal ? 'LET IT WIN' : 'YIELD'}</span><span class="btn-arrow">→</span></button>
        <button class="btn btn-ghost" type="button" data-act="close">KEEP FIGHTING</button>
      </div>
    `, { locked: false });
  }

  async function doYield() {
    const battle = state.battle;
    if (!battle || battle.phase !== 'player') return;
    closeModal();
    state.busy = true;
    E.yieldBattle(battle);
    renderBattle();
    Sound.play('lose');
    await wait(700);
    finishBattle('lost');
  }

  function finishBattle(outcome) {
    if (state.finishing) return;
    state.finishing = true;
    state.busy = true;
    const battle = state.battle;
    if (!battle) return;
    const boss = battle.boss;

    if (outcome === 'won') {
      Sound.play('win');
      el.enemyCard.classList.add('defeated');
      state.beaten.add(boss.id);
      if (boss.id === 'god') {
        setTimeout(() => showEnding('hollow'), 700);
        return;
      }
      setTimeout(() => showVictory(boss), 760);
      return;
    }

    Sound.play('lose');
    if (boss.id === 'god') {
      state.defeats += 1;
      setTimeout(() => showEnding('true'), 500);
      return;
    }

    const ability = E.ABILITIES[boss.ability];
    const isNew = !state.stolen.has(boss.ability);
    state.defeats += 1;
    if (isNew) {
      state.stolen.add(boss.ability);
      if (state.equipped.length < 3) state.equipped.push(boss.ability);
      Sound.play('steal');
      setTimeout(() => showDefeat(boss, ability, true), 520);
    } else {
      setTimeout(() => showDefeat(boss, ability, false), 520);
    }
    renderLadder();
  }

  /* ── result modals ───────────────────────────────────────── */

  function giftReveal(boss, locked) {
    const ability = E.ABILITIES[boss.ability] || E.ABILITIES.godhood;
    return `
      <div class="gift-reveal ${locked ? 'gift-locked' : ''}" style="--gift:${ability.color}">
        <div class="reveal-sigil">${bossSigil(boss, { mini: true })}</div>
        <div>
          <div class="reveal-label">${locked ? 'GIFT UNCLAIMED' : 'GIFT ABSORBED'}</div>
          <h3>${esc(ability.name)}</h3>
          <p>${esc(ability.desc)}</p>
          <div class="gift-meta">${locked ? 'ONLY DEFEAT TRANSFERS IT' : '+5 VITALITY · +1 STRIKE · YOURS FOREVER'}</div>
        </div>
      </div>`;
  }

  function showVictory(boss) {
    const stolen = state.stolen.has(boss.ability);
    const next = currentIndex() < 7 ? E.BOSSES[currentIndex()] : finalUnlocked() ? E.BOSSES[7] : null;
    const nextLabel = next ? (next.id === 'god' ? 'FACE THE GOD COMPLEX' : 'FACE ' + next.name) : 'RETURN TO THE LADDER';
    const rematch = !stolen
      ? `<button class="btn btn-primary" type="button" data-act="start" data-boss="${boss.id}"><span>REMATCH — TAKE THE GIFT</span><span class="btn-arrow">→</span></button>
         <button class="btn btn-ghost" type="button" data-act="start" data-boss="${next ? next.id : boss.id}">${esc(nextLabel)}</button>`
      : `<button class="btn btn-primary" type="button" data-act="start" data-boss="${next ? next.id : boss.id}"><span>${esc(nextLabel)}</span><span class="btn-arrow">→</span></button>
         <button class="btn btn-ghost" type="button" data-act="ladder">THE LADDER</button>`;
    openModal(`
      <p class="modal-kicker">${boss.index === 7 ? 'THE SUMMIT' : 'RING ' + ROMAN[boss.index] + ' CLEARED'} · VICTORY</p>
      <h2 class="modal-title" id="modalTitle">THEY FELL.</h2>
      <p class="modal-copy">${stolen
        ? `You already carry what ${esc(boss.short)} had. Winning twice does not make you more.`
        : `You beat ${esc(boss.short)}. Which means you took nothing. The rule is exact: only defeat transfers a gift.`}</p>
      ${stolen ? '' : giftReveal(boss, true)}
      <p class="modal-copy small">${stolen
        ? 'Their gift is already in your arsenal. The ladder does not care how many times you win.'
        : `If you want <span class="gold">${esc(E.ABILITIES[boss.ability].name)}</span>, you will have to let them defeat you. Challenge them again. Yield. Take it.`}</p>
      <div class="modal-actions">${rematch}</div>
    `, { locked: true, wide: false });
  }

  function showDefeat(boss, ability, isNew) {
    const stats = statLine();
    const full = state.equipped.length >= 3 && isNew;
    openModal(`
      <p class="modal-kicker">${isNew ? 'DEFEAT · GIFT ABSORBED' : 'DEFEAT · NOTHING NEW'}</p>
      <h2 class="modal-title ${isNew ? 'gold' : ''}" id="modalTitle">${isNew ? 'YOU LOST.<br>SOMETHING STAYED.' : 'YOU LOST.'}</h2>
      <p class="modal-copy">${isNew
        ? `${esc(boss.name)} broke you. That is the only door. What they used to do it is yours now.`
        : `Their gift is already yours. This defeat bought you nothing but the knowledge that you can lose the same way twice.`}</p>
      ${isNew ? giftReveal(boss, false) : ''}
      <p class="modal-copy small">${isNew
        ? `Your body remembers. <span class="gold">Vitality ${stats.maxHp}</span>. <span class="gold">Strike ${stats.strike}</span>. ${state.defeats === 1 ? 'This is how you win. Lose. Take. Return.' : 'The ladder is a staircase made of your own defeats.'}`
        : 'You are no stronger than you were before this fight. But you are still standing in the only place that matters.'}</p>
      ${full ? '<p class="modal-copy small"><span class="gold">Your three slots are full.</span> Manage your loadout before you challenge them again.</p>' : ''}
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-act="${full ? 'manage' : 'ladder'}"><span>${full ? 'MANAGE LOADOUT' : 'RISE AGAIN'}</span><span class="btn-arrow">→</span></button>
        <button class="btn btn-ghost" type="button" data-act="start" data-boss="${boss.id}">REMATCH</button>
      </div>
    `, { locked: true, wide: false });
  }

  function showEnding(kind) {
    const trueEnding = kind === 'true';
    const rings = state.beaten.size;
    const title = trueEnding ? 'APOTHEOSIS' : 'THE THRONE OF NOTHING';
    const kicker = trueEnding ? 'THE SUMMIT · TRUE ENDING' : 'THE SUMMIT · HOLLOW ENDING';
    const mark = sigil({ sides: 12, rot: 0, rings: 4 }, trueEnding ? '#f6e7b6' : '#8a8698', { crown: true });
    const body = trueEnding
      ? `It defeats you. You take the only thing it had left.<br><br>Godhood fits you better than it ever fit him. The ladder was never upward. It was a way down into yourself.`
      : `You win. There is no one left who can defeat you.<br><br>No one left to make you more. You sit on the throne and wait to become someone else's gift.`;
    const stats = `
      <div class="ending-stats">
        <div class="ending-stat"><span>DEFEATS</span><strong>${state.defeats}</strong></div>
        <div class="ending-stat"><span>GIFTS</span><strong>${state.stolen.size}</strong></div>
        <div class="ending-stat"><span>DUELS</span><strong>${state.fights}</strong></div>
      </div>`;
    const actions = trueEnding
      ? `<button class="btn btn-primary" type="button" data-act="restart"><span>BEGIN AGAIN</span><span class="btn-arrow">→</span></button>
         <button class="btn btn-ghost" type="button" data-act="ladder">WALK THE LADDER</button>`
      : `<button class="btn btn-primary" type="button" data-act="retry-final"><span>RETURN TO THE MOMENT</span><span class="btn-arrow">→</span></button>
         <button class="btn btn-ghost" type="button" data-act="restart">BEGIN AGAIN</button>`;
    openModal(`
      <p class="modal-kicker">${kicker}</p>
      <div class="ending">
        <div class="ending-mark">${mark}</div>
        <h2 class="modal-title ${trueEnding ? 'gold' : ''}" id="modalTitle">${title}</h2>
        <p class="modal-copy ending-copy">${body}</p>
        ${stats}
        ${trueEnding ? '<p class="modal-copy small">You wanted to be a god. You never asked what a god is for.</p>' : '<p class="modal-copy small">There is still a way to lose. It is the only thing you have not tried.</p>'}
        <div class="modal-actions">${actions}</div>
      </div>
    `, { locked: true, wide: true });
  }

  /* ── reset ───────────────────────────────────────────────── */

  function resetGame() {
    state.beaten.clear();
    state.stolen.clear();
    state.equipped = [];
    state.defeats = 0;
    state.fights = 0;
    state.battle = null;
    state.busy = false;
    state.finishing = false;
    closeModal();
    showScreen('title');
    setMood('#d9b978');
    updateStartLabel();
    renderLadder();
  }

  function updateStartLabel() {
    const played = state.beaten.size > 0 || state.stolen.size > 0 || state.defeats > 0;
    const label = played ? 'RETURN TO THE LADDER' : 'ENTER THE LADDER';
    el.start.querySelector('span').textContent = label;
  }

  /* ── events ──────────────────────────────────────────────── */

  function bind() {
    el.start.addEventListener('click', () => {
      Sound.play('click');
      showScreen('ladder');
      if (!state.seenRules) {
        state.seenRules = true;
        setTimeout(rulesModal, 380);
      }
    });

    el.how.addEventListener('click', () => { Sound.play('click'); rulesModal(); });
    el.rules.addEventListener('click', () => { Sound.play('click'); rulesModal(); });
    el.arsenalJump.addEventListener('click', () => { Sound.play('click'); attentionArsenal(); });
    el.home.addEventListener('click', () => { Sound.play('click'); showScreen('title'); updateStartLabel(); });
    el.battleMenu.addEventListener('click', () => { /* battle is a commitment */ });

    el.mute.addEventListener('click', () => {
      state.muted = !state.muted;
      Sound.setMuted(state.muted);
      updateSoundButton();
      try { localStorage.setItem('god-complex-muted', state.muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (!state.muted) Sound.play('click');
    });

    el.ladderList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-fight]');
      if (!button) return;
      Sound.play('click');
      startBattle(button.dataset.fight);
    });

    el.arsenal.addEventListener('click', (event) => {
      const button = event.target.closest('[data-gift]');
      if (!button) return;
      toggleGift(button.dataset.gift);
    });

    el.actionRow.addEventListener('click', (event) => {
      const card = event.target.closest('[data-action]');
      if (!card) return;
      act(card.dataset.action);
    });

    el.endBtn.addEventListener('click', endTurn);
    el.yieldBtn.addEventListener('click', confirmYield);

    el.modalBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const actName = button.dataset.act;
      if (!actName) return;
      if (actName !== 'yield-confirm') Sound.play('click');
      switch (actName) {
        case 'close':
          closeModal();
          break;
        case 'start':
          startBattle(button.dataset.boss);
          break;
        case 'ladder':
          closeModal();
          showScreen('ladder');
          break;
        case 'manage':
          closeModal();
          showScreen('ladder');
          attentionArsenal();
          break;
        case 'restart':
          resetGame();
          break;
        case 'retry-final':
          closeModal();
          startBattle('god');
          break;
        case 'yield-confirm':
          doYield();
          break;
        default:
          break;
      }
    });

    el.modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      if (!state.modalLocked) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (modalOpen()) {
        if (event.key === 'Escape' && !state.modalLocked) closeModal();
        if (event.key === 'Tab') trapFocus(event);
        return;
      }
      if (state.screen === 'battle' && state.battle && !state.busy && state.battle.phase === 'player') {
        if (event.key === '1') { event.preventDefault(); act('strike'); }
        else if (event.key === '2') { event.preventDefault(); act('guard'); }
        else if (event.key === 'e' || event.key === 'E') { event.preventDefault(); endTurn(); }
        else if (event.key === 'y' || event.key === 'Y') { event.preventDefault(); confirmYield(); }
        else if (['3', '4', '5'].includes(event.key)) {
          const id = state.battle.equipped[Number(event.key) - 3];
          if (id) { event.preventDefault(); act(id); }
        }
      } else if (state.screen === 'title' && event.key === 'Enter') {
        el.start.click();
      }
    });

    window.addEventListener('resize', () => {
      if (state.screen === 'battle') renderBattle();
    }, { passive: true });
  }

  function trapFocus(event) {
    const focusables = $$('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el.modalBody);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ── boot ────────────────────────────────────────────────── */

  function init() {
    el.start = $('#btn-start');
    el.how = $('#btn-how');
    el.rules = $('#btn-rules');
    el.arsenalJump = $('#btn-arsenal-jump');
    el.home = $('#btn-home');
    el.ladderList = $('#ladderList');
    el.ladderNote = $('#ladderNote');
    el.ladderProgress = $('#ladderProgress');
    el.giftCount = $('#giftCount');
    el.headLosses = $('#headLosses');
    el.statHp = $('#statHp');
    el.statStrike = $('#statStrike');
    el.statGifts = $('#statGifts');
    el.loadoutSlots = $('#loadoutSlots');
    el.giftGrid = $('#giftGrid');
    el.arsenal = $('#arsenal');
    el.arsenalHint = $('#arsenalHint');
    el.modal = $('#modal');
    el.modalBody = $('#modalBody');
    el.modalPanel = $('.modal-panel', el.modal);
    el.toast = $('#toast');
    el.arena = $('#arena');
    el.arenaRing = $('#arenaRing');
    el.playerCard = $('#playerCard');
    el.enemyCard = $('#enemyCard');
    el.playerPortrait = $('#playerPortrait');
    el.enemyPortrait = $('#enemyPortrait');
    el.playerSub = $('#playerSub');
    el.enemyName = $('#enemyName');
    el.enemyEpithet = $('#enemyEpithet');
    el.enemyPassive = $('#enemyPassive');
    el.playerHpText = $('#playerHpText');
    el.enemyHpText = $('#enemyHpText');
    el.playerHpBar = $('#playerHpBar');
    el.enemyHpBar = $('#enemyHpBar');
    el.playerHpGhost = $('#playerHpGhost');
    el.playerBlock = $('#playerBlock');
    el.enemyBlock = $('#enemyBlock');
    el.playerStatuses = $('#playerStatuses');
    el.enemyStatuses = $('#enemyStatuses');
    el.intentCard = $('#intentCard');
    el.intentName = $('#intentName');
    el.intentBody = $('#intentBody');
    el.battleLog = $('#battleLog');
    el.turnBadge = $('#turnBadge');
    el.energyPips = $('#energyPips');
    el.actionRow = $('#actionRow');
    el.endBtn = $('#btn-end');
    el.yieldBtn = $('#btn-yield');
    el.battleMenu = $('#btn-battle-menu');
    el.battleBossName = $('#battleBossName');
    el.battleRound = $('#battleRound');
    el.mute = $('#btn-mute');
    el.floaters = $('#floaters');
    el.slash = $('#slash');
    el.titleOrbit = $('#titleOrbit');
    el.cosmos = $('#cosmos');

    el.titleOrbit.innerHTML = sigil({ sides: 8, rot: 22, rings: 4 }, '#d9b978');
    el.playerPortrait.innerHTML = playerSigil();
    setMood('#d9b978');
    updateSoundButton();
    renderLadder();
    updateStartLabel();
    Stars.start();
    bind();

    if (location.hash === '#dev') {
      window.__gc = {
        state, startBattle, showEnding, showVictory, showDefeat,
        renderLadder, showScreen, setMood
      };
    }
  }

  init();
})();
