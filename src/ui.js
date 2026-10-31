import { clamp, formatTime } from './utils.js';
import { ZONES, RESOURCE_META, UPGRADES, WORLD, yToDepth, zoneAtY } from './world.js';

const RES_ICON = {
  scrap: '<path d="M14.7 4.2a4.6 4.6 0 0 0-5.9 5.9l-4.6 4.6a1.6 1.6 0 0 0 0 2.3l2.8 2.8a1.6 1.6 0 0 0 2.3 0l4.6-4.6a4.6 4.6 0 0 0 5.9-5.9l-2.8 2.8-2.6-.7-.7-2.6 2.8-2.8Z"/>',
  pearl: '<path d="M4.5 8.5c3.3-2.2 11.7-2.2 15 0v5.4c0 3.3-3.4 5.6-7.5 5.6s-7.5-2.3-7.5-5.6V8.5Z"/><circle cx="12" cy="12" r="3.6"/>',
  crystal: '<path d="m12 2.5 6.2 7.2L12 21.5 5.8 9.7 12 2.5Z"/><path d="M5.8 9.7h12.4M12 2.5v19"/>',
  repair: '<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="M12 8v8M8 12h8"/>',
  chest: '<path d="M4 9h16v11H4V9Z"/><path d="M3 9a9 9 0 0 1 18 0"/><path d="M12 9v11M8 9V7a4 4 0 0 1 8 0v2"/>',
  relic: '<path d="m12 2 7 10-7 10-7-10 7-10Z"/><path d="M12 5v14M9 9h6"/>',
  danger: '<path d="M12 3 22 21H2L12 3Z"/><path d="M12 9v5M12 17.2v.2"/>',
  oxygen: '<path d="M12 2.5c3.2 4.4 6 8 6 11.2A6 6 0 0 1 6 13.7c0-3.2 2.8-6.8 6-11.2Z"/><path d="M9.2 14.2a2.8 2.8 0 0 0 2.8 2.8"/>',
  zone: '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 5-5 2 2-5 5-2Z"/>',
  sonar: '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
  upgrade: '<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="M12 12v9M4 7.5l8 4.5 8-4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.2v.2"/>',
};

const UPGRADE_ICON = {
  oxygen: '<path d="M12 2.5c3.2 4.4 6 8 6 11.2A6 6 0 0 1 6 13.7c0-3.2 2.8-6.8 6-11.2Z"/><path d="M9.2 14.2a2.8 2.8 0 0 0 2.8 2.8"/>',
  thruster: '<path d="M3 12h12M12 7l6 5-6 5"/><path d="M18 8v8M21 9v6"/>',
  hull: '<path d="M12 2.8 20 6v6.1c0 4.6-3.2 7.8-8 9.1-4.8-1.3-8-4.5-8-9.1V6l8-3.2Z"/><path d="M8.5 12h2.2l1.2-2.6 1.6 5 1.2-2.4h1.8"/>',
  lamp: '<path d="M9 4h6l2 6H7L9 4Z"/><path d="M8 10h8l1 7H7l1-7Z"/><path d="M12 17v4M9 21h6"/>',
  sonar: '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
  pulse: '<circle cx="12" cy="12" r="2.2"/><path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8M5 5a9.8 9.8 0 0 0 0 14M19 5a9.8 9.8 0 0 1 0 14"/>',
};

const COST_ICON = {
  scrap: '<i class="cost-scrap"></i>',
  pearl: '<i class="cost-pearl"></i>',
  crystal: '<i class="cost-crystal"></i>',
};

function iconSvg(paths, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24">${paths}</svg>`;
}

export class UI {
  constructor(game) {
    this.game = game;
    this.el = {};
    this.confirmCallback = null;
    this.joyActive = false;
    this.joyPointer = null;
    this.railBuilt = false;
    this.cacheEls();
    this.buildRail();
    this.bind();
    this.setMuted(game.save.muted);
    this.updateMenu(game.save);
    this.hideScreens();
    this.el.hud.classList.add('is-hidden');
    this.el.menu.classList.remove('is-hidden');
  }

  cacheEls() {
    const ids = [
      'menu', 'hud', 'btnDive', 'diveLabel', 'btnNewDive', 'saveStatus', 'cardStatus', 'cardDepth',
      'cardRelics', 'cardScrap', 'cardPearl', 'cardCrystal', 'cardZones', 'btnMenuMute',
      'zoneName', 'zoneDepth', 'zoneDanger', 'zonePressure', 'o2Text', 'o2Fill', 'hullText', 'hullFill',
      'o2Warn', 'hullWarn', 'chipScrap', 'chipPearl', 'chipCrystal', 'btnSonar', 'btnUpgrade', 'btnMute',
      'btnPause', 'railBody', 'depthMarker', 'markerDepth', 'objectiveText', 'relicPips', 'baseCompass',
      'prompt', 'promptText', 'pulseState', 'btnPulseWidget', 'minimap', 'miniZone',
      'joystick', 'joystickKnob', 'btnMobileBoost', 'btnMobilePulse', 'btnMobileInteract',
      'pause', 'pauseSummary', 'btnResume', 'btnPauseUpgrade', 'btnSaveNow', 'btnHelp', 'btnReset',
      'helpPanel', 'pauseClock', 'upgrades', 'upScrap', 'upPearl', 'upCrystal', 'upgradeGrid',
      'btnCloseUpgrades', 'death', 'deathSummary', 'deathStats', 'btnRespawn', 'btnDeathMenu', 'deathDepth',
      'victory', 'victoryRelics', 'victoryStats', 'btnContinueDive', 'btnVictoryMenu',
      'confirm', 'confirmTitle', 'confirmText', 'btnConfirmYes', 'btnConfirmNo', 'toasts', 'rotateHint',
    ];
    for (const id of ids) this.el[id] = document.getElementById(id);
    this.el.o2Vital = document.querySelector('.vital.oxygen');
    this.el.hullVital = document.querySelector('.vital.hull');
  }

  buildRail() {
    if (this.railBuilt) return;
    const body = this.el.railBody;
    body.innerHTML = '';
    const total = ZONES[ZONES.length - 1].y1;
    for (const z of ZONES) {
      const div = document.createElement('div');
      div.className = 'rail-zone';
      div.style.top = `${(z.y0 / total) * 100}%`;
      div.style.height = `${((z.y1 - z.y0) / total) * 100}%`;
      div.style.background = `linear-gradient(90deg, ${z.top}22, ${z.bottom}66)`;
      div.innerHTML = `<span>${z.short}</span>`;
      body.appendChild(div);
    }
    this.railBuilt = true;
  }

  bind() {
    const on = (el, event, fn) => {
      if (el) el.addEventListener(event, fn);
    };

    on(this.el.btnDive, 'click', () => this.game.startDive(true));
    on(this.el.btnNewDive, 'click', () => {
      this.showConfirm('START A NEW EXPEDITION?', 'Your current log, resources and upgrades will be erased.', () => {
        this.game.newExpedition();
      });
    });
    on(this.el.btnMenuMute, 'click', () => this.game.toggleMute());
    on(this.el.btnMute, 'click', () => this.game.toggleMute());
    on(this.el.btnUpgrade, 'click', () => this.game.openUpgrades());
    on(this.el.btnPause, 'click', () => this.game.pause());
    on(this.el.btnSonar, 'click', () => this.game.sonarPing());
    on(this.el.btnPulseWidget, 'click', () => this.game.pulse());

    on(this.el.btnResume, 'click', () => this.game.resume());
    on(this.el.btnPauseUpgrade, 'click', () => this.game.openUpgrades());
    on(this.el.btnSaveNow, 'click', () => {
      this.game.persist();
      this.toast('Progress saved to the expedition log.', { icon: 'info' });
    });
    on(this.el.btnHelp, 'click', () => this.el.helpPanel.classList.toggle('is-hidden'));
    on(this.el.btnReset, 'click', () => {
      this.showConfirm('RESET EXPEDITION?', 'All progress, resources, upgrades and relic shards will be erased.', () => {
        this.game.resetToMenu();
      });
    });
    on(this.el.btnCloseUpgrades, 'click', () => this.game.closeUpgrades());
    on(this.el.btnRespawn, 'click', () => this.game.respawn());
    on(this.el.btnDeathMenu, 'click', () => this.game.returnToMenu());
    on(this.el.btnContinueDive, 'click', () => this.game.continueAfterVictory());
    on(this.el.btnVictoryMenu, 'click', () => this.game.returnToMenu());
    on(this.el.btnConfirmNo, 'click', () => this.hideConfirm());
    on(this.el.btnConfirmYes, 'click', () => {
      const cb = this.confirmCallback;
      this.hideConfirm();
      if (cb) cb();
    });

    on(this.el.upgradeGrid, 'click', (e) => {
      const btn = e.target.closest('[data-upgrade]');
      if (btn && !btn.disabled) this.game.buyUpgrade(btn.dataset.upgrade);
    });

    on(this.el.btnMobilePulse, 'click', () => this.game.pulse());
    on(this.el.btnMobileInteract, 'click', () => this.game.interact());

    // Virtual joystick.
    const joy = this.el.joystick;
    if (joy) {
      const update = (e) => {
        const rect = joy.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const max = rect.width * 0.31;
        const m = Math.hypot(dx, dy);
        if (m > max) {
          dx = (dx / m) * max;
          dy = (dy / m) * max;
        }
        this.el.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.game.setJoystick(dx / max, dy / max);
      };
      joy.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.joyActive = true;
        this.joyPointer = e.pointerId;
        joy.setPointerCapture(e.pointerId);
        update(e);
      });
      joy.addEventListener('pointermove', (e) => {
        if (!this.joyActive || e.pointerId !== this.joyPointer) return;
        e.preventDefault();
        update(e);
      });
      const end = (e) => {
        if (e.pointerId !== this.joyPointer) return;
        this.joyActive = false;
        this.joyPointer = null;
        this.el.joystickKnob.style.transform = 'translate(0px, 0px)';
        this.game.setJoystick(0, 0);
      };
      joy.addEventListener('pointerup', end);
      joy.addEventListener('pointercancel', end);
      joy.addEventListener('lostpointercapture', end);
    }

    const boost = this.el.btnMobileBoost;
    if (boost) {
      const start = (e) => {
        e.preventDefault();
        this.game.setMobileBoost(true);
      };
      const stop = (e) => {
        if (e) e.preventDefault();
        this.game.setMobileBoost(false);
      };
      boost.addEventListener('pointerdown', start);
      boost.addEventListener('pointerup', stop);
      boost.addEventListener('pointerleave', stop);
      boost.addEventListener('pointercancel', stop);
    }

    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('#mobileControls')) e.preventDefault();
    });
  }

  showMenu(save) {
    this.updateMenu(save);
    this.el.menu.classList.remove('is-hidden');
    this.el.hud.classList.add('is-hidden');
    this.hideScreens();
    this.el.rotateHint.classList.add('is-hidden');
  }

  showGame(game) {
    this.el.menu.classList.add('is-hidden');
    this.el.hud.classList.remove('is-hidden');
    this.hideScreens();
    this.updateHUD(game, true);
  }

  hideScreens() {
    for (const key of ['pause', 'upgrades', 'death', 'victory', 'confirm']) {
      if (this.el[key]) this.el[key].classList.add('is-hidden');
    }
  }

  openPause(game) {
    this.el.pause.classList.remove('is-hidden');
    this.el.pauseSummary.textContent = `Depth ${Math.round(yToDepth(game.player.y))} m · ${game.zone.name}`;
    this.el.pauseClock.textContent = formatTime(game.save.stats.time || 0);
    this.el.helpPanel.classList.add('is-hidden');
    this.updateHUD(game, true);
  }

  openUpgrades(game) {
    this.el.pause.classList.add('is-hidden');
    this.el.death.classList.add('is-hidden');
    this.el.victory.classList.add('is-hidden');
    this.el.upgrades.classList.remove('is-hidden');
    this.refreshUpgrades(game);
    this.updateHUD(game, true);
  }

  closeUpgradesScreen() {
    this.el.upgrades.classList.add('is-hidden');
  }

  showDeath(game) {
    const info = game.deathInfo || { depth: 0, zone: 'Unknown', lost: {} };
    const lostTotal = Object.values(info.lost).reduce((a, b) => a + b, 0);
    this.el.deathSummary.textContent = `The pressure was too much at ${info.zone}. The Aurora recovered your escape pod.`;
    this.el.deathStats.innerHTML = `
      <div><span>DEPTH</span><b>${info.depth} m</b></div>
      <div><span>ZONE</span><b>${info.zone.replace('Sunlit ', '').replace('Hydrothermal ', '')}</b></div>
      <div><span>CARGO LOST</span><b>${lostTotal}</b></div>
      <div><span>HULL BREACHES</span><b>${game.save.stats.deaths || 1}</b></div>`;
    this.el.deathDepth.textContent = `${info.depth} m`;
    this.el.death.classList.remove('is-hidden');
  }

  showVictory(game) {
    const relics = game.world.relics;
    this.el.victoryRelics.innerHTML = relics.map((r) => `
      <div class="victory-relic" title="${r.name}">${iconSvg('<path d="m12 2 7 10-7 10-7-10 7-10Z"/><path d="M12 5v14M9 9h6"/>')}</div>
    `).join('');
    const stats = game.save.stats;
    this.el.victoryStats.innerHTML = `
      <div><span>EXPEDITION TIME</span><b>${formatTime(stats.time || 0)}</b></div>
      <div><span>DEEPEST DIVE</span><b>${Math.round(stats.maxDepth || 0)} m</b></div>
      <div><span>CHESTS OPENED</span><b>${stats.chests || 0}</b></div>
      <div><span>HULL BREACHES</span><b>${stats.deaths || 0}</b></div>`;
    this.el.victory.classList.remove('is-hidden');
  }

  showConfirm(title, text, onYes) {
    this.el.confirmTitle.textContent = title;
    this.el.confirmText.textContent = text;
    this.confirmCallback = onYes;
    this.el.confirm.classList.remove('is-hidden');
  }

  hideConfirm() {
    this.el.confirm.classList.add('is-hidden');
    this.confirmCallback = null;
  }

  updateMenu(save) {
    const started = !!save.started;
    const complete = !!save.completed;
    this.el.diveLabel.textContent = started ? (complete ? 'CONTINUE EXPEDITION' : 'CONTINUE DIVE') : 'BEGIN DIVE';
    this.el.btnNewDive.classList.toggle('is-hidden', !started);
    this.el.cardStatus.textContent = complete ? 'COMPLETE' : started ? 'ACTIVE' : 'STANDBY';
    this.el.cardStatus.classList.toggle('offline', !started);
    this.el.cardDepth.innerHTML = `${Math.round(save.stats.maxDepth || 0)}<span>m</span>`;
    this.el.cardRelics.textContent = `${save.relics.length} / 3`;
    this.el.cardScrap.textContent = save.resources.scrap || 0;
    this.el.cardPearl.textContent = save.resources.pearl || 0;
    this.el.cardCrystal.textContent = save.resources.crystal || 0;
    this.el.saveStatus.textContent = started ? this.savedLabel(save) : 'NO EXPEDITION LOG FOUND';
    this.el.btnMenuMute.textContent = `SOUND: ${save.muted ? 'OFF' : 'ON'}`;

    this.el.cardZones.innerHTML = ZONES.map((z) => {
      const seen = save.discoveredZones.includes(z.id);
      return `<div class="card-zone-row">
        <span>${z.name.toUpperCase()}</span><b>${seen ? `${z.min}–${z.max} M` : 'UNEXPLORED'}</b>
        <div class="card-zone-bar"><i style="width:${seen ? 100 : 0}%;background:linear-gradient(90deg, ${z.top}, ${z.bottom})"></i></div>
      </div>`;
    }).join('');
  }

  savedLabel(save) {
    if (!save.savedAt) return 'EXPEDITION LOG READY';
    const diff = Math.max(0, Date.now() - save.savedAt);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'EXPEDITION LOG · SAVED JUST NOW';
    if (mins < 60) return `EXPEDITION LOG · SAVED ${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `EXPEDITION LOG · SAVED ${hours}H AGO`;
    return `EXPEDITION LOG · SAVED ${Math.floor(hours / 24)}D AGO`;
  }

  updateHUD(game, force = false) {
    const p = game.player;
    const zone = zoneAtY(p.y);
    const depth = Math.round(yToDepth(p.y));
    const o2Pct = clamp((p.oxygen / p.maxOxygen) * 100, 0, 100);
    const hullPct = clamp((p.hull / p.maxHull) * 100, 0, 100);
    const deficit = Math.max(0, zone.pressure - (game.save.upgrades.hull || 0));

    this.el.zoneName.textContent = zone.name;
    this.el.zoneDepth.textContent = `${depth} m`;
    this.el.zoneDanger.textContent = `${zone.risk} RISK`;
    this.el.zoneDanger.dataset.risk = zone.risk.toLowerCase();
    this.el.zonePressure.textContent = deficit > 0 ? 'PRESSURE CRITICAL' : 'PRESSURE OK';
    this.el.zonePressure.className = `pressure-chip ${deficit > 0 ? 'bad' : 'good'}`;

    this.el.o2Text.textContent = `${Math.round(o2Pct)}%`;
    this.el.hullText.textContent = `${Math.round(hullPct)}%`;
    this.el.o2Fill.style.width = `${o2Pct}%`;
    this.el.hullFill.style.width = `${hullPct}%`;
    this.el.o2Vital.classList.toggle('low', o2Pct <= 40 && o2Pct > 20);
    this.el.o2Vital.classList.toggle('critical', o2Pct <= 20);
    this.el.hullVital.classList.toggle('low', hullPct <= 45 && hullPct > 22);
    this.el.hullVital.classList.toggle('critical', hullPct <= 22);

    this.el.chipScrap.textContent = game.save.resources.scrap || 0;
    this.el.chipPearl.textContent = game.save.resources.pearl || 0;
    this.el.chipCrystal.textContent = game.save.resources.crystal || 0;

    this.el.objectiveText.textContent = game.getObjective();
    const pips = this.el.relicPips.children;
    for (let i = 0; i < pips.length; i++) pips[i].classList.toggle('filled', i < game.save.relics.length);
    const showCompass = game.save.relics.length >= 3 && !game.save.completed;
    this.el.baseCompass.classList.toggle('show', showCompass);
    if (showCompass) {
      const angle = Math.atan2(90 - p.y, WORLD.baseX - p.x);
      const arrow = this.el.baseCompass.querySelector('.compass-arrow');
      arrow.style.transform = `rotate(${angle + Math.PI / 2}rad)`;
    }

    const markerPct = clamp((depth / 1020) * 100, 0, 100);
    const body = this.el.railBody;
    const markerTop = body.offsetTop + (markerPct / 100) * body.offsetHeight;
    this.el.depthMarker.style.top = `${markerTop}px`;
    this.el.markerDepth.textContent = `${depth} m`;
    this.el.miniZone.textContent = zone.short;

    const pulseMax = 9 - (game.save.upgrades.pulse || 0) * 1.2;
    this.el.pulseState.textContent = game.pulseCooldown > 0 ? `${Math.ceil(game.pulseCooldown)}s` : 'READY';
    this.el.btnPulseWidget.classList.toggle('cooling', game.pulseCooldown > 0);
    this.el.btnSonar.classList.toggle('cooling', game.sonarCooldown > 0);

    this.el.btnMobileInteract.classList.toggle('pulse-ready', !!game.nearestInteract);

    if (this.el.minimap) game.renderer.drawMinimap(game, this.el.minimap);

    if (force) this.updatePrompt(game);
    this.setMuted(game.save.muted);
  }

  updatePrompt(game) {
    const prompt = game.getPrompt();
    if (!prompt) {
      this.el.prompt.classList.add('is-hidden');
      return;
    }
    this.el.prompt.classList.remove('is-hidden');
    this.el.promptText.textContent = prompt;
  }

  refreshUpgrades(game) {
    const r = game.save.resources;
    this.el.upScrap.textContent = r.scrap || 0;
    this.el.upPearl.textContent = r.pearl || 0;
    this.el.upCrystal.textContent = r.crystal || 0;

    this.el.upgradeGrid.innerHTML = UPGRADES.map((u) => {
      const lvl = game.save.upgrades[u.id] || 0;
      const maxed = lvl >= u.max;
      const cost = maxed ? null : u.cost(lvl);
      const affordable = cost && Object.entries(cost).every(([res, amount]) => (r[res] || 0) >= amount);
      const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      const costHtml = cost
        ? Object.entries(cost).filter(([, amount]) => amount > 0).map(([res, amount]) => {
          const short = (r[res] || 0) < amount;
          return `<span class="cost-chip ${short ? 'short' : ''}">${COST_ICON[res]}${amount}</span>`;
        }).join('')
        : '<span class="cost-chip">MAX LEVEL</span>';
      return `<article class="upgrade-item ${maxed ? 'maxed' : ''}">
        <div class="upgrade-top">
          <div class="upgrade-icon">${iconSvg(UPGRADE_ICON[u.icon] || UPGRADE_ICON.hull)}</div>
          <div class="upgrade-name">
            <h3>${u.name}</h3>
            <div class="upgrade-level">${pips}<b>${lvl} / ${u.max}</b></div>
          </div>
        </div>
        <p class="upgrade-desc">${u.desc(lvl)}</p>
        <div class="upgrade-buy-row">
          <div class="upgrade-cost">${costHtml}</div>
          <button class="buy-btn" data-upgrade="${u.id}" ${maxed || !affordable ? 'disabled' : ''}>${maxed ? 'MAXED' : 'FIT'}</button>
        </div>
      </article>`;
    }).join('');
  }

  setMuted(muted) {
    this.el.btnMute.classList.toggle('muted', muted);
    if (this.el.btnMenuMute) this.el.btnMenuMute.textContent = `SOUND: ${muted ? 'OFF' : 'ON'}`;
  }

  toast(html, opts = {}) {
    const el = document.createElement('div');
    el.className = `toast ${opts.tone === 'gold' ? 'gold' : opts.tone === 'danger' ? 'danger' : ''}`;
    const icon = RES_ICON[opts.icon] || RES_ICON.info;
    el.innerHTML = `<span class="toast-icon">${iconSvg(icon)}</span><span>${html}</span>`;
    this.el.toasts.appendChild(el);
    const max = 4;
    while (this.el.toasts.children.length > max) this.el.toasts.firstElementChild.remove();
    const life = opts.life || (String(html).length > 80 ? 6800 : 4600);
    window.setTimeout(() => {
      el.classList.add('out');
      window.setTimeout(() => el.remove(), 400);
    }, life);
  }

  flashDamage() {
    if (!this.damageEl) {
      this.damageEl = document.createElement('div');
      this.damageEl.className = 'damage-flash';
      document.getElementById('game-shell').appendChild(this.damageEl);
    }
    this.damageEl.classList.remove('active');
    void this.damageEl.offsetWidth;
    this.damageEl.classList.add('active');
  }
}
