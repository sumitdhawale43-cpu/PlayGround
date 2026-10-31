const $ = (id) => document.getElementById(id);

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const ui = {
  el: {},
  prevScreen: 'menu',
  bannerTimer: 0,
  damageTimer: 0,

  init() {
    const el = this.el;
    for (const id of [
      'hud', 'screen-menu', 'screen-briefing', 'screen-settings', 'screen-pause', 'screen-over',
      'hud-wave', 'hud-remaining', 'hud-score', 'hud-health', 'hud-health-state', 'health-fill',
      'hud-ammo', 'hud-reserve', 'hud-grenades', 'hud-weapon', 'compass-heading', 'compass-ticks',
      'killfeed', 'banner', 'banner-title', 'banner-sub', 'banner-kicker', 'hitmarker', 'crosshair',
      'reload-hint', 'reload-fill', 'radar', 'damage-arrow', 'pause-wave', 'pause-score',
      'over-wave', 'over-kills', 'over-acc', 'over-score', 'over-flavour', 'loader', 'loader-fill',
    ]) el[id] = $(id);
    el.compassTicks = document.querySelector('.compass-ticks');
    el.bannerKicker = document.querySelector('.banner-kicker');

    // dynamic damage flash layer
    this.flash = document.createElement('div');
    this.flash.id = 'damage-flash';
    document.body.appendChild(this.flash);

    this.radarCtx = el.radar.getContext('2d');
    this.radarSweep = 0;
    this.lastCompass = 999;
  },

  setMobile(touch) { document.body.classList.toggle('touch', !!touch); },

  resetRun() {
    this.el['killfeed'].innerHTML = '';
    this.el.banner.classList.remove('show');
    this.el['damage-arrow'].style.opacity = '0';
    this.flash.style.opacity = '0';
    this.el['reload-hint'].classList.remove('show');
    document.body.classList.remove('low-health');
  },

  hideAllScreens() {
    for (const id of ['screen-menu', 'screen-briefing', 'screen-settings', 'screen-pause', 'screen-over']) {
      this.el[id].classList.add('hidden');
    }
  },

  showMenu() {
    document.body.classList.remove('playing');
    this.hideAllScreens();
    this.el['screen-menu'].classList.remove('hidden');
    this.el.hud.classList.add('hidden');
    document.body.classList.remove('low-health', 'hit');
    this.el['damage-arrow'].style.opacity = '0';
    this.el['killfeed'].innerHTML = '';
    this.el.banner.classList.remove('show');
  },

  showHUD() {
    document.body.classList.add('playing');
    this.hideAllScreens();
    this.el.hud.classList.remove('hidden');
  },

  showPause(wave, score) {
    document.body.classList.remove('playing');
    this.el['pause-wave'].textContent = String(wave).padStart(2, '0');
    this.el['pause-score'].textContent = String(score);
    this.hideAllScreens();
    this.el['screen-pause'].classList.remove('hidden');
  },

  showBriefing() {
    this.prevScreen = this.el['screen-menu'].classList.contains('hidden') ? 'pause' : 'menu';
    this.hideAllScreens();
    this.el['screen-briefing'].classList.remove('hidden');
  },

  closeBriefing() {
    this.hideAllScreens();
    this.el[`screen-${this.prevScreen}`].classList.remove('hidden');
  },

  showSettings() {
    this.prevScreen = this.el['screen-menu'].classList.contains('hidden') ? 'pause' : 'menu';
    this.hideAllScreens();
    this.el['screen-settings'].classList.remove('hidden');
  },

  closeSettings() {
    this.hideAllScreens();
    this.el[`screen-${this.prevScreen}`].classList.remove('hidden');
  },

  showGameOver(stats) {
    document.body.classList.remove('playing');
    this.hideAllScreens();
    this.el['over-wave'].textContent = stats.waves;
    this.el['over-kills'].textContent = stats.kills;
    this.el['over-acc'].textContent = `${stats.accuracy}%`;
    this.el['over-score'].textContent = String(stats.score);
    const lines = [
      'The perimeter has fallen. Regroup and try again.',
      'Extraction was not secured. The zone belongs to them now.',
      'You held the line. It was not enough. Not yet.',
    ];
    this.el['over-flavour'].textContent = lines[stats.waves % lines.length];
    this.el['screen-over'].classList.remove('hidden');
    this.el.hud.classList.add('hidden');
  },

  loader(progress) {
    if (this.el['loader-fill']) this.el['loader-fill'].style.width = `${Math.round(progress * 100)}%`;
  },
  hideLoader() { this.el.loader?.classList.add('done'); },

  updateHUD(s) {
    const el = this.el;
    el['hud-health'].textContent = Math.max(0, Math.ceil(s.health));
    el['health-fill'].style.width = `${Math.max(0, Math.min(100, s.health))}%`;
    el['hud-ammo'].textContent = String(s.ammo).padStart(2, '0');
    el['hud-reserve'].textContent = String(s.reserve);
    el['hud-grenades'].textContent = s.grenades;
    el['hud-wave'].textContent = `WAVE ${String(s.wave).padStart(2, '0')}`;
    el['hud-remaining'].textContent = `HOSTILES ${String(s.remaining).padStart(2, '0')}`;
    el['hud-score'].textContent = String(s.score).padStart(6, '0');
    const state = s.health > 65 ? 'STABLE' : s.health > 30 ? 'WOUNDED' : 'CRITICAL';
    el['hud-health-state'].textContent = state;
    document.body.classList.toggle('low-health', s.health <= 30 && s.health > 0);
    el['reload-hint'].classList.toggle('show', !!s.reloading);
    el['reload-fill'].style.width = `${Math.round((s.reloadProgress || 0) * 100)}%`;
    el['hud-ammo'].style.color = s.ammo === 0 ? '#ff6459' : s.ammo <= 6 ? '#ffbd6e' : '';
    if (s.ammo === 0) el['hud-ammo'].style.textShadow = '0 0 18px rgba(255,70,60,0.45)';
    else el['hud-ammo'].style.textShadow = '';
  },

  setCrosshair(spreadPx, ads) {
    this.el.crosshair.style.setProperty('--spread', `${spreadPx.toFixed(1)}px`);
    this.el.crosshair.classList.toggle('ads', !!ads);
  },

  hitmarker(kill) {
    const h = this.el.hitmarker;
    h.classList.remove('show', 'kill');
    void h.offsetWidth;
    if (kill) h.classList.add('kill');
    h.classList.add('show');
  },

  killfeed(headshot) {
    const item = document.createElement('div');
    item.className = 'feed-item' + (headshot ? ' head' : '');
    item.innerHTML = headshot ? '<b>CRITICAL</b> HOSTILE NEUTRALIZED' : 'HOSTILE NEUTRALIZED';
    this.el['killfeed'].prepend(item);
    while (this.el['killfeed'].children.length > 5) this.el['killfeed'].lastChild.remove();
    setTimeout(() => item.remove(), 3200);
  },

  banner(kicker, title, sub, duration = 2400) {
    const { banner } = this.el;
    this.el.bannerKicker.textContent = kicker;
    this.el['banner-title'].textContent = title;
    this.el['banner-sub'].textContent = sub;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => banner.classList.remove('show'), duration);
  },

  damage(angleDeg) {
    const a = this.el['damage-arrow'];
    a.style.transition = 'none';
    a.style.transform = `rotate(${angleDeg}deg)`;
    a.style.opacity = '0.95';
    this.flash.style.transition = 'none';
    this.flash.style.opacity = '0.48';
    clearTimeout(this.damageTimer);
    this.damageTimer = setTimeout(() => {
      a.style.transition = 'opacity 0.55s ease';
      a.style.opacity = '0';
      this.flash.style.transition = 'opacity 0.5s ease';
      this.flash.style.opacity = '0';
    }, 90);
  },

  updateCompass(yaw) {
    const heading = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
    if (Math.abs(heading - this.lastCompass) < 0.25) return;
    this.lastCompass = heading;
    const idx = Math.round(heading / 45) % 8;
    this.el['compass-heading'].textContent = `${DIRS[idx]}  ${String(Math.round(heading)).padStart(3, '0')}`;
    this.el.compassTicks.style.backgroundPositionX = `${-heading * 2.4}px`;
  },

  radar(enemies, pos, yaw, dt) {
    const ctx = this.radarCtx;
    const w = 168, c = w / 2, R = 80;
    this.radarSweep += dt * 1.6;
    ctx.clearRect(0, 0, w, w);
    ctx.save();
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(4, 10, 13, 0.52)'; ctx.fillRect(0, 0, w, w);
    // rings
    ctx.strokeStyle = 'rgba(120, 220, 240, 0.13)'; ctx.lineWidth = 1;
    for (const r of [27, 54, 80]) { ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, w); ctx.moveTo(0, c); ctx.lineTo(w, c); ctx.stroke();
    // sweep
    const g = ctx.createConicGradient ? ctx.createConicGradient(this.radarSweep, c, c) : null;
    if (g) {
      g.addColorStop(0, 'rgba(130, 240, 255, 0.18)');
      g.addColorStop(0.12, 'rgba(130, 240, 255, 0.02)');
      g.addColorStop(1, 'rgba(130, 240, 255, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();
    }
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const scale = 2.35;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.position.x - pos.x, dz = e.position.z - pos.z;
      const rx = dx * cos - dz * sin;
      const ry = dx * sin + dz * cos;
      const d = Math.hypot(rx, ry);
      if (d * scale > R - 3) continue;
      const x = c + rx * scale, y = c + ry * scale;
      ctx.fillStyle = '#ff5a46';
      ctx.shadowColor = '#ff3a20'; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // player
    ctx.fillStyle = '#ffd58c'; ctx.shadowColor = '#f0a02a'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(c, c - 5.5); ctx.lineTo(c + 4, c + 4); ctx.lineTo(c, c + 2.2); ctx.lineTo(c - 4, c + 4); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  },
};
