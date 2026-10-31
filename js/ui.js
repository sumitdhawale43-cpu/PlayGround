/* ============================================================
   DOM screens: menu, garage, race select, pause, results.
   ============================================================ */

import { CARS, UPGRADES, TRACKS, carSpec, EMPTY_UPGRADES } from './config.js';
import { catmullRomClosed, fmtTime, ordinal, clamp } from './utils.js';
import { makeCarSprite } from './sprites.js';
import { THEMES } from './tracks.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

export class UI {
  constructor(bus) {
    this.bus = bus;
    this.save = bus.save;
    this.current = 'scr-menu';
    this.selectedCar = this.save.car;
    this.selectedTrack = this.save.track;
    this.laps = this.save.laps || 3;
    this.wire();
    this.refreshCoins();
    this.buildGarage();
    this.buildTracks();
    this.updateSoundLabels();
    this.updateMenuInfo();
  }

  /* ----------------------------- plumbing ----------------------------- */
  show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    this.current = id;
    if (id === 'scr-menu') this.updateMenuInfo();
    if (id === 'scr-garage') this.buildGarage();
    if (id === 'scr-tracks') this.buildTracks();
  }

  isVisible(id) {
    const el = document.getElementById(id);
    return !!el && el.classList.contains('active');
  }

  refreshCoins() {
    $$('[data-coins]').forEach((el) => { el.textContent = String(this.save.coins); });
  }

  updateMenuInfo() {
    const car = CARS.find((c) => c.id === this.save.car) || CARS[0];
    $('#menu-loadout').textContent = car.name;
    const best = this.save.best[this.save.track];
    $('#menu-best').textContent = best ? `BEST ${fmtTime(best)}` : 'BEST --:--.---';
    this.refreshCoins();
  }

  updateSoundLabels() {
    const txt = `Sound: ${this.save.sound ? 'On' : 'Off'}`;
    $('#btn-sound').textContent = txt;
    $('#btn-sound2').textContent = txt;
  }

  wire() {
    const b = this.bus;
    $('#btn-start').addEventListener('click', () => b.onStart());
    $('#btn-garage').addEventListener('click', () => { b.click(); this.show('scr-garage'); });
    $('#btn-races').addEventListener('click', () => { b.click(); this.show('scr-tracks'); });
    $('#btn-help').addEventListener('click', () => { b.click(); this.show('scr-help'); });
    $$('[data-back]').forEach((el) => el.addEventListener('click', () => { b.back(); this.show(el.dataset.back); }));

    $('#btn-equip').addEventListener('click', () => b.onEquip(this.selectedCar, () => { this.buildGarage(); this.updateMenuInfo(); }));
    $('#btn-start-race').addEventListener('click', () => b.onStartRace(this.selectedTrack, this.laps));
    $$('[data-laps]').forEach((el) => el.addEventListener('click', () => {
      b.click();
      this.laps = Number(el.dataset.laps);
      this.save.laps = this.laps;
      $$('[data-laps]').forEach((c) => c.classList.toggle('active', c === el));
    }));

    $('#btn-resume').addEventListener('click', () => b.onResume());
    $('#btn-restart').addEventListener('click', () => b.onRestart());
    $('#btn-quit').addEventListener('click', () => b.onQuit());
    $('#btn-sound').addEventListener('click', () => { b.onSoundToggle(); this.updateSoundLabels(); });
    $('#btn-sound2').addEventListener('click', () => { b.onSoundToggle(); this.updateSoundLabels(); });
    $('#btn-reset-save').addEventListener('click', () => b.onResetSave(() => {
      this.refreshCoins(); this.buildGarage(); this.buildTracks(); this.updateMenuInfo();
    }));

    $('#btn-again').addEventListener('click', () => b.onRestart());
    $('#btn-next').addEventListener('click', () => b.onNext());
    $('#btn-menu2').addEventListener('click', () => b.onQuit());
  }

  /* ----------------------------- garage ----------------------------- */
  buildGarage() {
    if (this.selectedCar !== this.save.car && !this.save.owned.includes(this.selectedCar)) {
      this.selectedCar = this.save.car;
    }
    const list = $('#car-list');
    list.innerHTML = '';
    for (const car of CARS) {
      const owned = this.save.owned.includes(car.id);
      const card = document.createElement('div');
      card.className = 'car-card' + (car.id === this.selectedCar ? ' active' : '') + (owned ? '' : ' locked');
      const cv = document.createElement('canvas');
      cv.width = 148;
      cv.height = 80;
      drawCarThumb(cv, car);
      const info = document.createElement('div');
      info.className = 'cc';
      info.innerHTML = `<b>${car.name}</b><span>${car.cls}</span>`;
      const right = document.createElement('div');
      if (car.id === this.save.car) {
        right.innerHTML = '<div class="equipped">IN USE</div>';
      } else if (owned) {
        right.innerHTML = '<div class="owned">OWNED</div>';
      } else {
        right.innerHTML = `<div class="price">${car.price.toLocaleString()}</div>`;
      }
      card.append(cv, info, right);
      card.addEventListener('click', () => { this.bus.click(); this.selectedCar = car.id; this.buildGarage(); });
      list.appendChild(card);
    }

    const car = CARS.find((c) => c.id === this.selectedCar) || CARS[0];
    const owned = this.save.owned.includes(car.id);
    const up = this.save.upgrades[car.id] || { ...EMPTY_UPGRADES };

    $('#car-name').textContent = car.name;
    $('#car-class').textContent = car.cls.toUpperCase();
    $('#car-desc').textContent = car.desc;
    drawCarPreview($('#car-preview'), car);

    const bonus = { engine: ['speed', .06], tires: ['grip', .07], nitro: ['speed', .015], chassis: ['handling', .06] };
    const stats = [
      ['TOP SPEED', clamp(car.stats.speed + (up.engine || 0) * .06 + (up.nitro || 0) * .012, 0, 1)],
      ['ACCELERATION', clamp(car.stats.accel + (up.engine || 0) * .07, 0, 1)],
      ['GRIP', clamp(car.stats.grip + (up.tires || 0) * .07, 0, 1)],
      ['HANDLING', clamp(car.stats.handling + (up.chassis || 0) * .06, 0, 1)],
    ];
    $('#car-stats').innerHTML = stats.map(([n, v]) =>
      `<div class="stat"><span>${n}</span><div class="bar"><i style="width:${Math.round(v * 100)}%"></i></div></div>`).join('');

    let totalLv = 0;
    const rows = Object.keys(UPGRADES).map((key) => {
      const def = UPGRADES[key];
      const lvl = up[key] || 0;
      totalLv += lvl;
      const maxed = lvl >= def.max;
      const cost = def.cost(lvl);
      const can = owned && !maxed && this.save.coins >= cost;
      const pips = Array.from({ length: def.max }, (_, i) => `<span class="pip${i < lvl ? ' on' : ''}"></span>`).join('');
      const label = !owned ? 'LOCKED' : maxed ? 'MAX' : `${cost.toLocaleString()}`;
      return `<div class="upg">
        <span class="u-name">${def.name}</span>
        <span class="pips">${pips}</span>
        <button data-upg="${key}" ${can ? '' : 'disabled'}>${label}</button>
      </div>`;
    }).join('');
    $('#car-upgrades').innerHTML = rows;
    $('#upg-count').textContent = `${totalLv}/${Object.keys(UPGRADES).length * 5}`;
    $$('#car-upgrades [data-upg]').forEach((btn) => btn.addEventListener('click', () => {
      this.bus.onUpgrade(car.id, btn.dataset.upg, () => { this.buildGarage(); this.refreshCoins(); });
    }));

    const equip = $('#btn-equip');
    if (!owned) {
      equip.textContent = `Buy for ${car.price.toLocaleString()} coins`;
      equip.disabled = this.save.coins < car.price;
    } else if (car.id === this.save.car) {
      equip.textContent = 'Selected';
      equip.disabled = true;
    } else {
      equip.textContent = 'Select Car';
      equip.disabled = false;
    }
  }

  /* ----------------------------- race select ----------------------------- */
  buildTracks() {
    const wrap = $('#track-list');
    wrap.innerHTML = '';
    for (const def of TRACKS) {
      const card = document.createElement('div');
      card.className = 'track-card' + (def.id === this.selectedTrack ? ' active' : '');
      const cv = document.createElement('canvas');
      cv.width = 440;
      cv.height = 260;
      drawTrackPreview(cv, def);
      const stars = '★'.repeat(def.difficulty) + '☆'.repeat(3 - def.difficulty);
      const best = this.save.best[def.id];
      const meta = document.createElement('div');
      meta.className = 'tc-meta';
      meta.innerHTML = `<span class="stars">${stars}</span>
        <span class="pill">${def.theme.toUpperCase()}</span>
        <span class="pill">${best ? `BEST ${fmtTime(best)}` : 'NO RECORD'}</span>`;
      const p = document.createElement('p');
      p.textContent = def.blurb;
      const h = document.createElement('h3');
      h.textContent = def.name;
      card.append(cv, h, p, meta);
      if (def.id === this.save.track) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = 'SELECTED';
        card.appendChild(badge);
      }
      card.addEventListener('click', () => {
        this.bus.click();
        this.selectedTrack = def.id;
        this.save.track = def.id;
        this.buildTracks();
      });
      wrap.appendChild(card);
    }
    $$('[data-laps]').forEach((c) => c.classList.toggle('active', Number(c.dataset.laps) === this.laps));
  }

  /* ----------------------------- pause / results ----------------------------- */
  openPause(stats) {
    $('#pause-stats').innerHTML = stats;
    this.show('scr-pause');
  }

  fillResults(res, coins, isRecord) {
    $('#res-pos').textContent = ordinal(res.pos);
    $('#res-track').textContent = TRACKS.find((t) => t.id === res.trackId).name;
    $('#res-headline').textContent =
      res.pos === 1 ? 'VICTORY!' : res.pos <= 3 ? 'PODIUM FINISH' : 'FINISH!';
    $('#res-total').textContent = fmtTime(res.total);
    $('#res-best').textContent = res.best ? fmtTime(res.best) : '--:--.---';
    $('#res-drift').textContent = res.drift.toLocaleString();
    $('#res-coins').textContent = `+${coins.toLocaleString()}`;
    $('#res-table').innerHTML =
      `<tr><th>POS</th><th>DRIVER</th><th>CAR</th><th>TIME</th></tr>` +
      res.rows.map((r) => `<tr class="${r.isPlayer ? 'me' : ''}">
        <td class="pos">${r.pos}</td>
        <td>${r.name}</td>
        <td>${r.car}</td>
        <td>${r.time ? fmtTime(r.time) : `L${r.laps} · DNF`}</td>
      </tr>`).join('');
    const rec = document.createElement('div');
    rec.className = 'pill';
    rec.style.cssText = 'align-self:center';
    rec.innerHTML = isRecord ? '&#127942; NEW LAP RECORD' : `&nbsp;`;
    const old = $('#scr-results .pill.dyn');
    if (old) old.remove();
    rec.classList.add('dyn');
    rec.style.opacity = isRecord ? '1' : '0';
    $('#scr-results .res-actions').before(rec);
    this.show('scr-results');
  }
}

/* ----------------------------- drawing helpers ----------------------------- */
function drawCarThumb(cv, car) {
  const x = cv.getContext('2d');
  const spr = makeCarSprite(car.shape, { body: car.body, body2: car.body2, accent: car.accent }, car.glass, 4);
  x.clearRect(0, 0, cv.width, cv.height);
  x.save();
  const s = Math.min((cv.width - 16) / spr.w, (cv.height - 14) / spr.h);
  x.translate(cv.width / 2, cv.height / 2);
  x.scale(s, s);
  x.drawImage(spr.canvas, -spr.w / 2, -spr.h / 2, spr.w, spr.h);
  x.restore();
}

function drawCarPreview(cv, car) {
  const x = cv.getContext('2d');
  const w = cv.width;
  const h = cv.height;
  x.clearRect(0, 0, w, h);
  const g = x.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h / 2, w * 0.55);
  g.addColorStop(0, 'rgba(255,255,255,.10)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  // floor grid
  x.strokeStyle = 'rgba(255,255,255,.05)';
  x.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    x.beginPath();
    x.moveTo((i / 14) * w, h * 0.62);
    x.lineTo((i / 14) * w - 30, h);
    x.stroke();
  }
  x.beginPath();
  x.moveTo(0, h * 0.66);
  x.lineTo(w, h * 0.66);
  x.stroke();

  const spr = makeCarSprite(car.shape, { body: car.body, body2: car.body2, accent: car.accent }, car.glass, 5);
  const s = Math.min((w - 60) / spr.w, (h - 50) / spr.h);
  x.save();
  x.translate(w / 2, h / 2 + 8);
  x.scale(s, s);
  x.fillStyle = 'rgba(0,0,0,.55)';
  x.beginPath();
  x.ellipse(6, 14, spr.w * 0.5, spr.h * 0.4, 0, 0, Math.PI * 2);
  x.fill();
  x.drawImage(spr.canvas, -spr.w / 2, -spr.h / 2, spr.w, spr.h);
  x.restore();

  x.font = `900 italic 26px "Arial Narrow", Impact, sans-serif`;
  x.textAlign = 'left';
  x.fillStyle = 'rgba(255,255,255,.16)';
  x.fillText(car.name, 16, h - 18);
}

function drawTrackPreview(cv, def) {
  const x = cv.getContext('2d');
  const w = cv.width;
  const h = cv.height;
  const theme = THEMES[def.theme];
  x.fillStyle = theme.ground;
  x.fillRect(0, 0, w, h);

  // texture
  for (let i = 0; i < 240; i++) {
    x.globalAlpha = 0.12 + Math.random() * 0.2;
    x.fillStyle = theme.speck[(Math.random() * theme.speck.length) | 0];
    x.fillRect(Math.random() * w, Math.random() * h, 3, 3);
  }
  x.globalAlpha = 1;

  const pts = catmullRomClosed(def.points, 14);
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const p of pts) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  const pad = 34;
  const sc = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY));
  const ox = (w - (maxX - minX) * sc) / 2 - minX * sc;
  const oy = (h - (maxY - minY) * sc) / 2 - minY * sc;

  x.save();
  x.translate(ox, oy);
  x.scale(sc, sc);
  const path = new Path2D();
  pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
  path.closePath();

  x.lineJoin = 'round';
  x.lineCap = 'round';
  x.strokeStyle = 'rgba(0,0,0,.5)';
  x.lineWidth = 96;
  x.stroke(path);
  x.strokeStyle = theme.asphalt;
  x.lineWidth = 84;
  x.stroke(path);
  x.strokeStyle = 'rgba(255,255,255,.28)';
  x.lineWidth = 66;
  x.setLineDash([22, 30]);
  x.stroke(path);
  x.setLineDash([]);

  const s0 = pts[0];
  const s1 = pts[1];
  const a = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
  x.save();
  x.translate(s0[0], s0[1]);
  x.rotate(a);
  x.fillStyle = '#fff';
  for (let r = 0; r < 2; r++) {
    for (let c = -4; c < 4; c++) {
      if ((r + c) & 1) continue;
      x.fillRect(r * 16 - 8, c * 16, 16, 16);
    }
  }
  x.restore();
  x.restore();

  // corner label
  x.font = `900 italic 30px "Arial Narrow", Impact, sans-serif`;
  x.textAlign = 'right';
  x.fillStyle = 'rgba(0,0,0,.55)';
  x.fillText(def.name, w - 14, h - 14);
}
