/* DOM interface: HUD, fabrication bay, overlays, touch joystick. */
import { UPGRADES, upgradesAt, TOTAL_CHESTS, depthAt } from './world.js';
import { formatTime, formatNumber, clamp } from './utils.js';

const $ = id => document.getElementById(id);
const svg = (id, cls = 'icon') => `<svg class="${cls}"><use href="#${id}"/></svg>`;

export class Hud {
  constructor(game) {
    this.game = game;
    this.toastTimers = new Set();
    this.bannerTimer = null;
    this.titleTimer = null;
    this.joy = { active: false, id: null };
    this.last = { oxygen: -1, hull: -1, depth: -1, salvage: -1, relics: -1, chests: -1, zone: '' };
    this.el = {
      hud: $('hud'),
      oxygenRow: $('oxygen-row'),
      hullRow: $('hull-row'),
      oxygenFill: $('oxygen-fill'),
      hullFill: $('hull-fill'),
      oxygenValue: $('oxygen-value'),
      hullValue: $('hull-value'),
      zoneName: $('zone-name'),
      depthValue: $('depth-value'),
      salvage: $('salvage-value'),
      relics: $('relic-value'),
      chests: $('chest-value'),
      objectiveText: $('objective-text'),
      objectiveCount: $('objective-count'),
      objectiveFill: $('objective-fill'),
      pressureWarning: $('pressure-warning'),
      ratingText: $('rating-text'),
      gaugeMarker: $('gauge-marker'),
      gaugeLabel: $('gauge-marker-label'),
      gaugeRating: $('gauge-rating'),
      sonarBtn: $('sonar-btn'),
      sonarCooldown: $('sonar-cooldown'),
      touchSonar: $('touch-sonar'),
      touchSonarCooldown: $('touch-sonar-cooldown'),
      boostBtn: $('boost-btn'),
      touchBoost: $('touch-boost'),
      interactWrap: $('interact-wrap'),
      interactBtn: $('interact-btn'),
      interactName: document.querySelector('.interact-copy small'),
      interactLabel: document.querySelector('.interact-copy strong'),
      toastStack: $('toast-stack'),
      zoneBanner: $('zone-banner'),
      bannerTitle: $('zone-banner-title'),
      bannerSub: $('zone-banner-sub'),
      saveIndicator: $('save-indicator'),
      title: $('title-screen'),
      titleStart: $('start-btn'),
      titleNew: $('new-btn'),
      titleHint: $('title-hint'),
      saveSummary: $('save-summary'),
      saveDepth: $('save-depth'),
      saveSalvage: $('save-salvage'),
      saveChests: $('save-chests'),
      fab: $('fabricator'),
      fabSalvage: $('fab-salvage'),
      fabGrid: $('upgrade-grid'),
      fabOxygen: $('fab-stat-oxygen'),
      fabHull: $('fab-stat-hull'),
      fabSpeed: $('fab-stat-speed'),
      fabDepth: $('fab-stat-depth'),
      repairBtn: $('repair-btn'),
      repairCost: $('repair-cost'),
      pause: $('pause-screen'),
      pauseDepth: $('pause-depth'),
      pauseChests: $('pause-chests'),
      pauseTime: $('pause-time'),
      gameover: $('gameover-screen'),
      overDepth: $('over-depth'),
      overChests: $('over-chests'),
      overLost: $('over-lost'),
      victory: $('victory-screen'),
      victoryDepth: $('victory-depth'),
      victoryChests: $('victory-chests'),
      victorySalvage: $('victory-salvage'),
      soundBtn: $('sound-btn'),
      pauseBtn: $('pause-btn'),
      upgradeBtn: $('upgrade-btn'),
      touchUpgrade: $('touch-upgrade'),
      joystick: $('joystick'),
      joystickKnob: $('joystick-knob'),
    };
    this.bind();
    this.setMuted(game.muted);
  }

  bind() {
    const g = this.game;
    this.el.titleStart.addEventListener('click', () => g.startGame());
    this.el.titleNew.addEventListener('click', () => g.newExpedition());
    this.el.soundBtn.addEventListener('click', () => g.toggleMute());
    this.el.pauseBtn.addEventListener('click', () => g.pauseGame());
    this.el.upgradeBtn.addEventListener('click', () => g.openFabricator());
    this.el.touchUpgrade.addEventListener('click', () => g.openFabricator());
    this.el.sonarBtn.addEventListener('click', () => g.triggerSonar());
    this.el.touchSonar.addEventListener('click', () => g.triggerSonar());
    this.el.interactBtn.addEventListener('click', () => g.interact());
    this.el.repairBtn.addEventListener('click', () => g.repairHull());

    const boostDown = e => { e.preventDefault(); g.setBoost(true); this.el.boostBtn.classList.add('active'); this.el.touchBoost.classList.add('active'); };
    const boostUp = () => { g.setBoost(false); this.el.boostBtn.classList.remove('active'); this.el.touchBoost.classList.remove('active'); };
    for (const btn of [this.el.boostBtn, this.el.touchBoost]) {
      btn.addEventListener('pointerdown', boostDown);
      btn.addEventListener('pointerup', boostUp);
      btn.addEventListener('pointercancel', boostUp);
      btn.addEventListener('pointerleave', boostUp);
    }
    window.addEventListener('pointerup', boostUp);

    this.el.fabGrid.addEventListener('click', e => {
      const btn = e.target.closest('[data-buy]');
      if (btn) g.buyUpgrade(btn.dataset.buy);
    });
    document.querySelectorAll('[data-close="fabricator"]').forEach(btn => btn.addEventListener('click', () => g.closeFabricator()));
    $('resume-btn').addEventListener('click', () => g.resumeGame());
    $('pause-save-btn').addEventListener('click', () => { g.saveGame(true); this.toast('Expedition saved', 'gold', 'i-anchor'); });
    $('pause-title-btn').addEventListener('click', () => g.returnToTitle());
    $('respawn-btn').addEventListener('click', () => g.respawn());
    $('victory-continue').addEventListener('click', () => g.continueExploring());
    $('victory-title').addEventListener('click', () => g.returnToTitle());

    // Joystick.
    const joy = this.el.joystick;
    const setFromPointer = e => {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (e.clientX - cx) / (rect.width * 0.35);
      let dy = (e.clientY - cy) / (rect.height * 0.35);
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      const dist = Math.min(1, len) * (rect.width * 0.28);
      const a = Math.atan2(dy, dx);
      const tx = Math.cos(a) * dist;
      const ty = Math.sin(a) * dist;
      this.el.joystickKnob.style.transform = `translate(${tx}px, ${ty}px)`;
      g.setJoystick(dx, dy);
    };
    joy.addEventListener('pointerdown', e => {
      if (this.joy.active) return;
      e.preventDefault();
      this.joy.active = true;
      this.joy.id = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      setFromPointer(e);
    });
    joy.addEventListener('pointermove', e => {
      if (!this.joy.active || e.pointerId !== this.joy.id) return;
      e.preventDefault();
      setFromPointer(e);
    });
    const release = e => {
      if (!this.joy.active || (e && e.pointerId !== this.joy.id)) return;
      this.joy.active = false;
      this.joy.id = null;
      this.el.joystickKnob.style.transform = 'translate(0px, 0px)';
      g.setJoystick(0, 0);
    };
    joy.addEventListener('pointerup', release);
    joy.addEventListener('pointercancel', release);
    window.addEventListener('pointerup', release);
    joy.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('contextmenu', e => {
      if (e.target.closest('#joystick, #touch-controls')) e.preventDefault();
    });
  }

  setMuted(muted) {
    document.body.classList.toggle('muted', muted);
  }

  showTitle(save) {
    this.el.title.classList.remove('gone');
    this.el.hud.classList.add('is-hidden');
    if (save) {
      this.el.titleNew.classList.remove('is-hidden');
      this.el.saveSummary.classList.remove('is-hidden');
      this.el.saveDepth.textContent = `${formatNumber(save.stats.bestDepth)} m`;
      this.el.saveSalvage.textContent = `${formatNumber(save.salvage)} scrap`;
      this.el.saveChests.textContent = `${save.opened.length} / ${TOTAL_CHESTS} caches`;
      this.el.titleHint.textContent = 'Press ENTER to resume the expedition';
    } else {
      this.el.titleNew.classList.add('is-hidden');
      this.el.saveSummary.classList.add('is-hidden');
      this.el.titleHint.textContent = 'Press ENTER to dive';
    }
  }

  hideTitle() {
    this.el.title.classList.add('gone');
    this.el.hud.classList.remove('is-hidden');
  }

  showHud() {
    this.el.hud.classList.remove('is-hidden');
  }

  hideHud() {
    this.el.hud.classList.add('is-hidden');
  }

  sync() {
    const g = this.game, p = g.player, el = this.el;
    const o2 = Math.round(p.oxygen);
    const hp = Math.round(p.health);
    const depth = depthAt(p.y);
    if (o2 !== this.last.oxygen) {
      el.oxygenValue.textContent = o2;
      el.oxygenFill.style.width = `${clamp(p.oxygen / p.oxygenMax, 0, 1) * 100}%`;
      el.oxygenRow.classList.toggle('low', p.oxygen / p.oxygenMax < 0.32);
      el.oxygenRow.classList.toggle('critical', p.oxygen / p.oxygenMax < 0.14);
      this.last.oxygen = o2;
    }
    if (hp !== this.last.hull) {
      el.hullValue.textContent = hp;
      el.hullFill.style.width = `${clamp(p.health / p.healthMax, 0, 1) * 100}%`;
      el.hullRow.classList.toggle('low', p.health / p.healthMax < 0.34);
      el.hullRow.classList.toggle('critical', p.health / p.healthMax < 0.18);
      this.last.hull = hp;
    }
    if (depth !== this.last.depth) {
      el.depthValue.textContent = `${depth} m`;
      const pct = clamp(depth / 1850, 0, 1) * 100;
      el.gaugeMarker.style.top = `${pct}%`;
      el.gaugeLabel.textContent = `${depth}m`;
      this.last.depth = depth;
    }
    const zone = g.currentZone;
    if (zone && zone.id !== this.last.zone) {
      el.zoneName.textContent = zone.name.toUpperCase();
      const pip = document.querySelector('.zone-pip');
      if (pip) {
        pip.style.background = zone.palette.accent;
        pip.style.boxShadow = `0 0 8px ${zone.palette.accent}`;
      }
      this.last.zone = zone.id;
    }
    const sal = Math.round(g.salvage);
    if (sal !== this.last.salvage) { el.salvage.textContent = formatNumber(sal); this.last.salvage = sal; }
    if (g.relics !== this.last.relics) { el.relics.textContent = formatNumber(g.relics); this.last.relics = g.relics; }
    if (g.openedChests.size !== this.last.chests) {
      el.chests.textContent = `${g.openedChests.size}/${TOTAL_CHESTS}`;
      this.last.chests = g.openedChests.size;
    }

    const ratingPct = clamp(p.ratedDepth / 1850, 0, 1) * 100;
    el.gaugeRating.style.top = `${ratingPct}%`;
    el.pressureWarning.classList.toggle('is-hidden', !g.pressureOver || g.mode !== 'playing');
    if (g.pressureOver) el.ratingText.textContent = `Rated to ${p.ratedDepth} m · ascend now`;

    const cool = g.sonarCooldown > 0 ? g.sonarCooldown / g.sonarMax : 0;
    for (const [btn, cd] of [[el.sonarBtn, el.sonarCooldown], [el.touchSonar, el.touchSonarCooldown]]) {
      btn.classList.toggle('cooling', cool > 0);
      btn.style.setProperty('--cool', String(cool));
      if (cd) cd.style.setProperty('--cool', String(cool));
      btn.title = cool > 0 ? `Sonar recharging ${Math.ceil(g.sonarCooldown)}s` : 'Sonar pulse [Space]';
    }
  }

  setObjective(text, count, progress) {
    this.el.objectiveText.textContent = text;
    this.el.objectiveCount.textContent = count ?? `${this.game.openedChests.size} / ${TOTAL_CHESTS}`;
    this.el.objectiveFill.style.width = `${clamp(progress ?? (this.game.openedChests.size / TOTAL_CHESTS), 0, 1) * 100}%`;
  }

  setInteract(chest) {
    if (!chest) {
      this.el.interactWrap.classList.add('is-hidden');
      return;
    }
    this.el.interactName.textContent = chest.name.toUpperCase();
    this.el.interactLabel.textContent = 'Open chest';
    this.el.interactWrap.classList.remove('is-hidden');
  }

  bumpResource(kind) {
    const target = kind === 'relic' ? this.el.relics.parentElement : kind === 'chest' ? this.el.chests.parentElement : this.el.salvage.parentElement;
    if (!target) return;
    target.classList.remove('bump');
    void target.offsetWidth;
    target.classList.add('bump');
  }

  toast(text, kind = '', icon = 'i-relic') {
    const div = document.createElement('div');
    div.className = `toast ${kind}`;
    div.innerHTML = `${svg(icon)}<span>${text}</span>`;
    this.el.toastStack.appendChild(div);
    const t = setTimeout(() => {
      div.classList.add('out');
      setTimeout(() => { div.remove(); this.toastTimers.delete(t); }, 420);
    }, 3200);
    this.toastTimers.add(t);
    while (this.el.toastStack.children.length > 4) this.el.toastStack.firstElementChild.remove();
  }

  showBanner(zone) {
    this.el.bannerTitle.textContent = zone.name;
    this.el.bannerSub.textContent = `${zone.range} · ${zone.short}`;
    this.el.zoneBanner.classList.remove('is-hidden');
    requestAnimationFrame(() => this.el.zoneBanner.classList.add('is-visible'));
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.el.zoneBanner.classList.remove('is-visible');
      setTimeout(() => this.el.zoneBanner.classList.add('is-hidden'), 420);
    }, 3400);
  }

  flashSave() {
    const el = this.el.saveIndicator;
    el.classList.add('show');
    clearTimeout(this.titleTimer);
    this.titleTimer = setTimeout(() => el.classList.remove('show'), 1300);
  }

  openFabricator() {
    this.el.fab.classList.remove('is-hidden');
    this.renderFabricator();
  }

  closeFabricator() {
    this.el.fab.classList.add('is-hidden');
  }

  openPause() {
    this.el.pause.classList.remove('is-hidden');
  }

  closePause() {
    this.el.pause.classList.add('is-hidden');
  }

  showGameOver({ depth, lost }) {
    this.el.gameover.classList.remove('is-hidden');
    this.el.overDepth.textContent = `${formatNumber(depth)} m`;
    this.el.overChests.textContent = `${this.game.openedChests.size} / ${TOTAL_CHESTS}`;
    this.el.overLost.textContent = `${formatNumber(lost)} scrap`;
  }

  hideGameOver() {
    this.el.gameover.classList.add('is-hidden');
  }

  showVictory({ depth }) {
    this.el.victory.classList.remove('is-hidden');
    this.el.victoryDepth.textContent = `${formatNumber(depth)} m`;
    this.el.victoryChests.textContent = `${this.game.openedChests.size} / ${TOTAL_CHESTS}`;
    this.el.victorySalvage.textContent = formatNumber(this.game.salvage);
  }

  hideVictory() {
    this.el.victory.classList.add('is-hidden');
  }

  setPauseStats() {
    const g = this.game;
    this.el.pauseDepth.textContent = `${formatNumber(depthAt(g.player.y))} m`;
    this.el.pauseChests.textContent = `${g.openedChests.size} / ${TOTAL_CHESTS}`;
    this.el.pauseTime.textContent = formatTime(g.stats.time);
  }

  renderFabricator() {
    const g = this.game;
    const el = this.el;
    el.fabSalvage.textContent = formatNumber(g.salvage);
    const stats = upgradesAt(g.upgrades);
    el.fabOxygen.textContent = `${stats.oxygen}`;
    el.fabHull.textContent = `${stats.health}`;
    el.fabSpeed.textContent = `${stats.speed}`;
    el.fabDepth.textContent = `${stats.pressure} m`;
    const repairCost = 20;
    const canRepair = g.player.health < g.player.healthMax && g.salvage >= repairCost;
    el.repairBtn.disabled = !canRepair;
    el.repairCost.textContent = g.player.health >= g.player.healthMax
      ? 'Hull at full integrity'
      : `${repairCost} scrap · +50 hull`;

    el.fabGrid.innerHTML = UPGRADES.map(up => {
      const level = g.upgrades[up.id] || 0;
      const maxed = level >= up.max;
      const cost = maxed ? 0 : up.costs[level];
      const affordable = !maxed && g.salvage >= cost;
      const current = up.values[Math.min(level, up.values.length - 1)];
      const next = up.values[Math.min(level + 1, up.values.length - 1)];
      const effect = maxed
        ? `${up.effect(current, current)} · maximum`
        : up.effect(current, next);
      const pips = Array.from({ length: up.max }, (_, i) => `<i class="${i < level ? 'on' : ''}"></i>`).join('');
      const buy = maxed
        ? `<button class="buy-btn" disabled>MAX</button>`
        : `<button class="buy-btn" data-buy="${up.id}" ${affordable ? '' : 'disabled'}>${svg('i-salvage')}${cost}</button>`;
      return `<article class="upgrade-card ${maxed ? 'maxed' : ''}">
        <div class="upgrade-head">
          <span class="upgrade-icon">${svg(up.icon)}</span>
          <div class="upgrade-title"><small>${up.code}</small><h3>${up.name}</h3></div>
          <span class="level-tag">LV ${level}/${up.max}</span>
        </div>
        <p class="upgrade-desc">${up.desc}</p>
        <div class="pips">${pips}</div>
        <div class="upgrade-foot">
          <span class="upgrade-effect">${effect}</span>
          ${buy}
        </div>
      </article>`;
    }).join('');
  }
}
