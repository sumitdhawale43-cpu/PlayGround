/* ============================================================
   Race session: car state, arcade drift physics, collisions,
   lap / position logic, drift scoring and nitro economy.
   ============================================================ */

import { PHYS, carSpec } from './config.js';
import { queryTrack } from './tracks.js';
import { effects } from './effects.js';
import { audio } from './audio.js';
import { aiControl, initAI } from './ai.js';
import { clamp, angleDiff, TAU, mulberry32 } from './utils.js';

const REAR_X = -PHYS.carLength * 0.42;
const REAR_Y = PHYS.carWidth * 0.40;
const FRONT_X = PHYS.carLength * 0.40;

export class Race {
  constructor({ track, entries, laps = 3, mode = 'race', playerIndex = 0 }) {
    this.track = track;
    this.laps = Math.max(1, laps);
    this.mode = mode;
    this.time = 0;
    this.phase = mode === 'demo' ? 'racing' : 'countdown';
    this.countdown = mode === 'demo' ? 0 : 3.0;
    this.raceStart = 0;
    this.goTimer = 0;
    this.beepMark = 4;
    this.endTimer = -1;
    this.cars = [];
    this.banner = null;
    this.bannerT = 0;
    this.wrongWay = false;
    this.wrongT = 0;
    this.rng = mulberry32(1337 + entries.length * 31);

    entries.forEach((e, i) => this.cars.push(this.makeCar(e, i)));
    this.playerIndex = playerIndex;
    this.player = this.cars[playerIndex] || this.cars[0];
    this.grid();

    this.finishOrder = [];
  }

  makeCar(e, i) {
    const spec = carSpec(e.carDef, e.upgrades);
    const c = {
      i,
      def: e.carDef,
      colors: e.colors,
      mapColor: e.mapColor || e.colors.body,
      name: e.name,
      isPlayer: !!e.isPlayer,
      spec,
      x: 0, y: 0, θ: 0, vx: 0, vy: 0, av: 0,
      idx: 0, frac: 0, lat: 0, prevFrac: 0,
      progress: -1, lap: 0, lapStart: 0, lapTimes: [],
      finished: false, finishTime: 0, place: i + 1,
      nitro: spec.nitroMax, boosting: false, nitroHold: 0, assist: 1,
      driftChain: 0, driftTimer: 0, totalDrift: 0, drifting: false, combo: 1,
      slip: 0, surf: 'road', recover: 0, hitCd: 0, bumpCd: 0,
      steerVis: 0, throttleVis: 0, brakeVis: 0, ai: null,
      prevL: null, prevR: null, speed: 0,
      skill: e.skill || 0.95,
    };
    if (!e.isPlayer || this.mode === 'demo') {
      initAI(c, (this.rng() - 0.5) * 16);
      c.ai.skill = e.skill || 0.95;
    }
    return c;
  }

  grid() {
    const s = this.track.samples;
    const n = this.track.count;
    const sp = this.track.spacing;
    const cols = [-34, 34];
    this.cars.forEach((c, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const behind = 34 + row * 68;
      const idx = ((n - Math.round(behind / sp)) % n + n) % n;
      const sm = s[idx];
      c.idx = idx;
      c.x = sm.x + sm.nx * cols[col];
      c.y = sm.y + sm.ny * cols[col];
      c.θ = Math.atan2(sm.ty, sm.tx);
      c.vx = c.vy = c.av = 0;
      const q = queryTrack(this.track, c.x, c.y, idx);
      c.idx = q.i;
      c.lat = q.lat;
      c.frac = q.frac;
      c.prevFrac = q.frac;
      c.progress = q.frac - n;        // the grid sits behind the start line
      c.lap = -1;
      c.lapStart = this.raceStart || 0;
      c.lapTimes = [];
      c.finished = false;
      c.prevL = null;
      c.prevR = null;
    });
  }

  setBanner(text, dur = 1.6) {
    this.banner = text;
    this.bannerT = dur;
  }

  /* ------------------------------------------------------------------ */
  update(dt, playerCtrl) {
    this.time += dt;
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.banner = null;
    }

    if (this.phase === 'countdown') {
      this.countdown -= dt;
      const mark = Math.ceil(this.countdown);
      if (mark < this.beepMark && mark > 0) {
        this.beepMark = mark;
        audio.beep(false);
      }
      if (this.countdown <= 0) {
        this.phase = 'racing';
        this.raceStart = this.time;
        for (const c of this.cars) c.lapStart = this.time;
        this.goTimer = 1.0;
        audio.beep(true);
        this.setBanner('GO!', 1.0);
      }
    } else if (this.goTimer > 0) {
      this.goTimer -= dt;
    }

    const racing = this.phase === 'racing';

    for (const c of this.cars) {
      let ctrl;
      if (!racing) {
        ctrl = { steer: c.isPlayer && this.mode !== 'demo' ? playerCtrl.steer : c.steerVis, throttle: 0, nitro: false, handbrake: false };
      } else if (c.isPlayer && this.mode !== 'demo') {
        ctrl = playerCtrl;
      } else {
        ctrl = aiControl(c, this, dt);
        c.assist += ((ctrl._assist ?? 1) - c.assist) * Math.min(1, dt * 2.5);
      }
      this.stepCar(c, ctrl, dt);
      c.throttleVis += ((ctrl.throttle || 0) - c.throttleVis) * Math.min(1, dt * 8);
      c.brakeVis = ctrl.throttle < -0.01 ? 1 : Math.max(0, c.brakeVis - dt * 5);
      this.postStep(c, ctrl, dt);
    }

    this.collide();
    this.rank();

    if (this.mode !== 'demo') {
      const p = this.player;
      if (!p.finished) {
        const rate = p.progress - (this._lastProgress ?? p.progress);
        this._lastProgress = p.progress;
        if (rate < -dt * 12) this.wrongT += dt;
        else if (rate > 0) this.wrongT = Math.max(0, this.wrongT - dt * 2);
        this.wrongWay = this.wrongT > 1.0;
      } else {
        this.wrongWay = false;
      }

      if (p.finished && this.endTimer < 0) {
        this.endTimer = 1.15;
        audio.fanfare(p.place === 1);
      }
      if (this.endTimer >= 0) {
        this.endTimer -= dt;
        if (this.endTimer <= 0) this.phase = 'finished';
      }
    }
  }

  /* --------------------------- physics --------------------------- */
  stepCar(c, ctrl, dt) {
    const spec = c.spec;
    const cos = Math.cos(c.θ);
    const sin = Math.sin(c.θ);
    let vf = c.vx * cos + c.vy * sin;
    let vl = -c.vx * sin + c.vy * cos;

    const speed = Math.hypot(c.vx, c.vy);
    c.speed = speed;
    const offRoad = Math.abs(c.lat) > PHYS.roadHalf;
    c.surf = offRoad ? 'off' : 'road';

    // steering -> yaw rate (bicycle model with weighty response)
    const steerMax = clamp(0.60 - speed * 0.00082, 0.135, 0.60) * spec.steerFactor;
    const delta = clamp(ctrl.steer, -1, 1) * steerMax;
    const yawTarget = vf * Math.tan(delta) / PHYS.wheelbase;
    c.av += (yawTarget - c.av) * Math.min(1, spec.yawResponse * dt);
    c.av = clamp(c.av, -4.4, 4.4);
    c.θ += c.av * dt;

    // nitro
    const canBoost = !!ctrl.nitro && c.nitro > 0 && c.recover <= 0 && !ctrl.handbrake;
    if (canBoost && !c.boosting) audio.boost();
    c.boosting = canBoost;
    if (canBoost) c.nitro = Math.max(0, c.nitro - spec.nitroDrain * dt);

    const assist = c.assist || 1;
    const topSpeed = spec.topSpeed * (canBoost ? 1.22 : 1) * (offRoad ? 0.74 : 1) * assist;
    const force = spec.accel * (canBoost ? 1.30 : 1) * (offRoad ? 0.52 + spec.offroad * 0.55 : 1) * assist;

    if (ctrl.throttle > 0) {
      const k = 1 - clamp(vf / Math.max(80, topSpeed), 0, 1);
      vf += force * ctrl.throttle * k * dt;
    } else if (ctrl.throttle < 0) {
      if (vf > 8) vf += ctrl.throttle * spec.brake * dt;
      else {
        vf += ctrl.throttle * spec.accel * 0.5 * dt;
        if (vf < -170) vf = -170;
      }
    }
    if (canBoost) {
      const k = 1 - clamp(vf / (topSpeed * 1.05), 0, 1);
      vf += spec.nitroPower * k * dt;
    }

    // rolling resistance / off-road drag
    const drag = (ctrl.throttle < 0 ? 0.055 : 0.02) + (offRoad ? 1.55 - spec.offroad * 2.0 : 0);
    vf -= vf * drag * dt;

    // lateral grip: handbrake breaks traction, big angles regain some grip
    let gripK = spec.grip * (offRoad ? 0.45 + spec.offroad * 0.55 : 1);
    if (ctrl.handbrake) gripK *= 0.17;
    const slipAngle = Math.atan2(vl, Math.max(12, Math.abs(vf)));
    gripK *= 1 + Math.min(Math.abs(slipAngle) / 0.55, 1) * 0.5;
    if (ctrl.handbrake) vf -= vf * 1.15 * dt;
    vl *= Math.exp(-gripK * dt);

    c.slip = Math.atan2(vl, Math.max(12, Math.abs(vf)));

    // rebuild world velocity on the same basis we decomposed with,
    // so the chassis can rotate away from the velocity vector (that is the drift)
    c.vx = cos * vf - sin * vl;
    c.vy = sin * vf + cos * vl;
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    // steering visual
    const targetVis = clamp(ctrl.steer, -1, 1);
    c.steerVis += (targetVis - c.steerVis) * Math.min(1, dt * 16);

    if (c.recover > 0) c.recover -= dt;
    if (c.hitCd > 0) c.hitCd -= dt;
    if (c.bumpCd > 0) c.bumpCd -= dt;
  }

  /* ------------ post-integration: track query, wall, laps, fx ------------ */
  postStep(c, ctrl, dt) {
    const track = this.track;
    const q = queryTrack(track, c.x, c.y, c.idx);
    c.idx = q.i;
    c.lat = q.lat;

    // progress along the lap (handles wrap + driving backwards)
    let delta = q.frac - c.prevFrac;
    const n = track.count;
    if (delta > n / 2) delta -= n;
    else if (delta < -n / 2) delta += n;
    c.prevFrac = q.frac;
    c.frac = q.frac;
    c.progress += delta;

    // hard barrier
    const absLat = Math.abs(q.lat);
    if (absLat > PHYS.wallLat) this.wallHit(c, q, absLat);

    // laps
    if (!c.finished) {
      const lap = Math.floor(c.progress / n);
      if (lap > c.lap) {
        for (let l = c.lap + 1; l <= lap; l++) this.completeLap(c, l);
      } else if (lap < c.lap) {
        c.lap = lap;    // drove backwards over the line
      }
      if (c.progress >= this.laps * n) this.crossFinish(c);
    }

    this.carEffects(c, ctrl, dt);
  }

  wallHit(c, q, absLat) {
    const n = this.track.count;
    const s0 = this.track.samples[q.i];
    const s1 = this.track.samples[(q.i + 1) % n];
    const t = clamp(q.frac - q.i, 0, 1);
    const cx = s0.x + (s1.x - s0.x) * t;
    const cy = s0.y + (s1.y - s0.y) * t;
    const sgn = q.lat > 0 ? 1 : -1;
    const nx = s0.nx * sgn;
    const ny = s0.ny * sgn;
    c.x = cx + nx * PHYS.wallLat;
    c.y = cy + ny * PHYS.wallLat;

    const vn = c.vx * nx + c.vy * ny;
    if (vn > 0) {
      const tx = -ny;
      const ty = nx;
      const vt = c.vx * tx + c.vy * ty;
      const impact = vn;
      /* scrape rather than bounce: stop the inward motion, keep the slide.
         A lively bounce pins nose-first cars against the barrier forever. */
      const nvn = -vn * 0.06 - 12;
      const nvt = vt * 0.94;
      c.vx = nx * nvn + tx * nvt;
      c.vy = ny * nvn + ty * nvt;

      /* steer the nose back onto the wall line so throttle drives the car
         along the barrier instead of grinding straight into it */
      const cos = Math.cos(c.θ);
      const sin = Math.sin(c.θ);
      const intoWall = cos * nx + sin * ny;          // >0 = nose points at wall
      if (intoWall > 0.02) {
        const along = cos * tx + sin * ty;
        const dir = along >= 0 ? 1 : -1;
        const wallAng = Math.atan2(ty * dir, tx * dir);
        c.θ += angleDiff(wallAng, c.θ) * clamp(intoWall, 0, 1) * 0.34;
        c.av *= 0.5;
      }

      if (impact > 55) {
        const px = c.x - nx * 14;
        const py = c.y - ny * 14;
        effects.spark(px, py, c.vx * 0.4, c.vy * 0.4, Math.min(16, 4 + impact * 0.05), '#ffd9a0');
        effects.addShake(Math.min(9, impact * 0.02));
        if (c.hitCd <= 0) {
          c.hitCd = 0.18;
          audio.wall(Math.min(1, impact / 420));
          if (c.isPlayer && this.mode !== 'demo') {
            c.nitro = Math.max(0, c.nitro - 6);
          }
        }
      } else if (impact > 20 && Math.random() < 0.4) {
        effects.spark(c.x - nx * 14, c.y - ny * 14, 0, 0, 2, '#ffd9a0');
      }
    }
  }

  completeLap(c, lap) {
    c.lap = lap;
    const t = this.time - c.lapStart;
    c.lapStart = this.time;
    if (t > 3 && lap >= 1 && lap <= this.laps) c.lapTimes.push(t);
    if (!c.isPlayer || this.mode === 'demo') return;

    if (t > 3 && c.lapTimes.length) {
      const last = c.lapTimes[c.lapTimes.length - 1];
      effects.text(c.x, c.y - 40, `LAP ${fmtLap(last)}`, '#9dff4d', 24, 1.4);
      audio.lap();
    }
    if (lap >= this.laps) return;              // the chequered flag handles this one
    if (lap >= 1 && lap === this.laps - 1) this.setBanner('FINAL LAP!', 2.2);
    else this.setBanner(`LAP ${lap + 1}/${this.laps}`, 1.6);
  }

  crossFinish(c) {
    c.finished = true;
    c.finishTime = this.time;
    this.finishOrder.push(c);
    if (c.isPlayer && this.mode !== 'demo') {
      const gained = Math.round(c.driftChain * c.combo);
      if (gained > 0) this.bankDrift(c, gained, true);
      effects.text(c.x, c.y - 46, 'FINISH!', '#ffd166', 40, 1.6);
      this.setBanner('FINISH!', 1.6);
    }
  }

  /* --------------------------- collisions --------------------------- */
  collide() {
    const cars = this.cars;
    const R = PHYS.carRadius;
    const D = R * 2;
    for (let i = 0; i < cars.length; i++) {
      const a = cars[i];
      for (let j = i + 1; j < cars.length; j++) {
        const b = cars[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= D * D || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const overlap = D - d;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          const jimp = -(1 + 0.22) * vn * 0.5;
          a.vx -= jimp * nx;
          a.vy -= jimp * ny;
          b.vx += jimp * nx;
          b.vy += jimp * ny;

          const tx = -ny;
          const ty = nx;
          const vt = rvx * tx + rvy * ty;
          a.av += vt * 0.004;
          b.av -= vt * 0.004;
          a.av *= 0.86;
          b.av *= 0.86;
          a.vx *= 0.985; a.vy *= 0.985;
          b.vx *= 0.985; b.vy *= 0.985;

          const impact = -vn;
          if (impact > 45) {
            const px = (a.x + b.x) * 0.5;
            const py = (a.y + b.y) * 0.5;
            effects.spark(px, py, rvx * 0.3, rvy * 0.3, Math.min(14, 3 + impact * 0.05), '#ffe08a');
            effects.debris(px, py, Math.min(5, 1 + impact * 0.02), '#cfd6e2');
            const involvesPlayer = (a.isPlayer || b.isPlayer) && this.mode !== 'demo';
            if (involvesPlayer) effects.addShake(Math.min(10, impact * 0.024));
            const notify = a.bumpCd <= 0 || b.bumpCd <= 0;
            a.bumpCd = b.bumpCd = 0.24;
            if (notify) {
              audio.crash(Math.min(1, impact / 380));
              if (involvesPlayer) {
                const c = a.isPlayer ? a : b;
                c.nitro = Math.max(0, c.nitro - 3);
                effects.text(c.x, c.y - 34, 'BUMP!', '#ff8ea0', 20, .8);
              }
            }
          }
        }
      }
    }
  }

  /* --------------------------- positions --------------------------- */
  rank() {
    const arr = this.cars;
    arr.sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    for (let i = 0; i < arr.length; i++) arr[i].place = i + 1;
  }

  standings() { return this.cars.slice(); }

  /* --------------------------- drift / nitro --------------------------- */
  bankDrift(c, gained, silentCombo) {
    c.totalDrift += gained;
    c.driftChain = 0;
    c.driftTimer = 0;
    c.combo = 1;
    if (!c.isPlayer || this.mode === 'demo') return;
    c.nitro = Math.min(c.spec.nitroMax, c.nitro + Math.min(46, 8 + gained * 0.06));
    audio.bank(Math.min(8, Math.round(gained / 300) + 1));
    effects.text(c.x, c.y - 52, `+${gained}`, '#25d7ff', 30, 1.25);
  }

  updateDrift(c, dt) {
    const n = Math.abs(c.slip);
    const speed = c.speed;
    const sliding = n > 0.17 && speed > 105 && c.surf === 'road';
    c.drifting = sliding;
    if (sliding) {
      const rate = speed * (n - 0.13) * dt;
      c.driftChain += rate;
      c.driftTimer = 0.8;
      c.combo = Math.min(10, 1 + Math.floor(c.driftChain / 340));
      if (c.isPlayer && this.mode !== 'demo') {
        c.nitro = Math.min(c.spec.nitroMax, c.nitro + rate * 0.035);
      }
    } else {
      c.driftTimer -= dt;
      if (c.driftTimer <= 0 && c.driftChain > 0) {
        this.bankDrift(c, Math.round(c.driftChain * c.combo));
      }
    }
  }

  /* --------------------------- per car visuals --------------------------- */
  carEffects(c, ctrl, dt) {
    this.updateDrift(c, dt);

    const cos = Math.cos(c.θ);
    const sin = Math.sin(c.θ);
    const speed = c.speed;
    const at = (lx, ly) => [c.x + cos * lx - sin * ly, c.y + sin * lx + cos * ly];
    const rl = at(REAR_X, -REAR_Y);
    const rr = at(REAR_X, REAR_Y);
    const fl = at(FRONT_X, -REAR_Y);
    const fr = at(FRONT_X, REAR_Y);

    const slip = Math.abs(c.slip);
    const wantsSkid = speed > 55 && (slip > 0.13 || ctrl.handbrake || (ctrl.throttle < 0 && speed > 170));

    if (c.prevL) {
      if (wantsSkid) {
        const a = clamp((slip - 0.08) * 2.4, 0.14, 0.85);
        effects.skid(c.prevL[0], c.prevL[1], rl[0], rl[1], a, 5, c.surf === 'road' ? 1 : 1);
        effects.skid(c.prevR[0], c.prevR[1], rr[0], rr[1], a, 5, 1);
      }
      if (slip > 0.2 && speed > 95 && this.rng() < 0.85) {
        const col = c.surf === 'road' ? 'rgba(236,241,250,1)' : this.dustColor();
        effects.smoke(rl[0], rl[1], c.vx * .3, c.vy * .3, 1, col, 1);
        effects.smoke(rr[0], rr[1], c.vx * .3, c.vy * .3, 1, col, 1);
      }
    }
    c.prevL = rl;
    c.prevR = rr;

    // off-road rooster tails
    if (c.surf === 'off' && speed > 60) {
      const col = this.dustColor();
      effects.dust(rl[0], rl[1], c.vx * .2, c.vy * .2, 1, col);
      effects.dust(rr[0], rr[1], c.vx * .2, c.vy * .2, 1, col);
      if (speed > 200 && this.rng() < 0.5) effects.dust(fl[0], fl[1], c.vx * .1, c.vy * .1, 1, col);
    }

    // nitro plume
    if (c.boosting) {
      const bx = c.x + cos * (-PHYS.carLength * 0.56);
      const by = c.y + sin * (-PHYS.carLength * 0.56);
      for (const off of [-6, 6]) {
        const px = bx - sin * off;
        const py = by + cos * off;
        effects.flame(px, py, -cos * 260 + (Math.random() - .5) * 60, -sin * 260 + (Math.random() - .5) * 60,
          Math.random() < .5 ? '#8fe6ff' : '#e6f9ff');
      }
      if (this.rng() < .5) effects.smoke(bx, by, -cos * 90, -sin * 90, 1, 'rgba(210,235,255,1)', .7);
    }

    // brake dust
    if (ctrl.throttle < -0.5 && speed > 150 && slip < 0.2 && this.rng() < .25) {
      effects.smoke(fl[0], fl[1], c.vx * .2, c.vy * .2, 1, 'rgba(225,232,242,1)', .55);
      effects.smoke(fr[0], fr[1], c.vx * .2, c.vy * .2, 1, 'rgba(225,232,242,1)', .55);
    }
  }

  dustColor() {
    const t = this.track.def.theme;
    if (t === 'alpine') return 'rgba(240,247,255,1)';
    if (t === 'neon') return 'rgba(150,160,190,1)';
    return 'rgba(206,178,124,1)';
  }

  /* --------------------------- player helpers --------------------------- */
  recoverCar(c) {
    const s = this.track.samples[c.idx];
    c.x = s.x;
    c.y = s.y;
    c.θ = Math.atan2(s.ty, s.tx);
    c.vx = c.vy = c.av = 0;
    c.prevFrac = c.frac;
    c.slip = 0;
    effects.smoke(c.x, c.y, 0, 0, 8, 'rgba(236,241,250,1)', 1.2);
  }

  buildResult() {
    const order = this.standings();
    const p = this.player;
    const rows = order.map((c, i) => ({
      pos: i + 1,
      name: c.name,
      car: c.def.name,
      color: c.mapColor,
      isPlayer: c.isPlayer,
      time: c.finished ? c.finishTime : null,
      laps: c.lap,
    }));
    const best = p.lapTimes.length ? Math.min(...p.lapTimes) : Infinity;
    return {
      pos: p.place,
      total: (p.finished ? p.finishTime : this.time) - this.raceStart,
      best: isFinite(best) ? best : null,
      laps: p.lapTimes.slice(),
      drift: p.totalDrift,
      rows,
      trackId: this.track.def.id,
      lapsCount: this.laps,
    };
  }

  /* live HUD numbers for one car */
  hudFor(c) {
    const counting = this.phase !== 'countdown';
    return {
      lap: clamp(Math.floor(c.progress / this.track.count) + 1, 1, this.laps),
      place: c.place,
      lapTime: counting ? Math.max(0, this.time - c.lapStart) : 0,
      total: counting ? Math.max(0, this.time - this.raceStart) : 0,
      nitro: c.nitro / c.spec.nitroMax,
      speed: c.speed,
      drifting: c.drifting,
      chain: Math.round(c.driftChain * c.combo),
      combo: c.combo,
      finished: c.finished,
    };
  }
}

function fmtLap(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return m ? `${m}:${s.toFixed(2).padStart(5, '0')}` : s.toFixed(2);
}
