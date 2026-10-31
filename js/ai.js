/* ============================================================
   AI opponents: racing-line lookahead, corner-speed planning,
   obstacle avoidance, nitro usage and stuck recovery.
   ============================================================ */

import { PHYS } from './config.js';
import { queryTrack } from './tracks.js';
import { clamp, angleDiff, sign } from './utils.js';

const LOOK_MIN = 5;
const LOOK_MAX = 44;

export function aiControl(car, race, dt) {
  const track = race.track;
  const s = track.samples;
  const n = track.count;
  const spec = car.spec;
  const ai = car.ai;

  const vx = car.vx;
  const vy = car.vy;
  const speed = Math.hypot(vx, vy);
  const cos = Math.cos(car.θ);
  const sin = Math.sin(car.θ);

  /* ---------- look-ahead distances ---------- */
  const la = clamp(Math.round((18 + speed * 0.36) / track.spacing), LOOK_MIN, LOOK_MAX);
  const cornerSpan = clamp(Math.round(260 / track.spacing), 6, 26);

  /* ---------- curvature of the road ahead ---------- */
  let kSum = 0;
  let maxK = 0;
  for (let k = 1; k <= cornerSpan; k++) {
    const sm = s[(car.idx + k) % n];
    kSum += sm.k;
    const a = Math.abs(sm.k);
    if (a > maxK) maxK = a;
  }
  const kAvg = kSum / cornerSpan;

  /* ---------- racing-line lateral target ---------- */
  const cutAmount = clamp((Math.abs(kAvg) - 0.0012) * 640, 0, 1);
  let latTarget = sign(kAvg) * cutAmount * 42 + ai.lineBias;

  /* ---------- avoid cars ahead ---------- */
  let throttleScale = 1;
  let brakeTap = 0;
  for (const o of race.cars) {
    if (o === car) continue;
    const dx = o.x - car.x;
    const dy = o.y - car.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 150 * 150 || d2 < 1) continue;
    const fwd = dx * cos + dy * sin;
    const side = -dx * sin + dy * cos;
    if (fwd > 4 && fwd < 108 && Math.abs(side) < 34) {
      // choose the side with more room relative to the centre line
      const room = PHYS.roadHalf - 44;
      const away = sign(side || (car.lat || 1)) ;
      const candidate = clamp(latTarget + away * 38, -room, room);
      latTarget = candidate;
      if (fwd < 58 && Math.hypot(o.vx, o.vy) < speed - 10) brakeTap = 0.4;
      throttleScale = fwd < 80 ? 0.75 : throttleScale;
    }
  }
  latTarget = clamp(latTarget, -(PHYS.roadHalf - 42), PHYS.roadHalf - 42);

  /* ---------- steering (PD on heading error) ---------- */
  const ti = (car.idx + la) % n;
  const sm = s[ti];
  const tx = sm.x + sm.nx * latTarget;
  const ty = sm.y + sm.ny * latTarget;
  const desired = Math.atan2(ty - car.y, tx - car.x);
  const err = angleDiff(desired, car.θ);
  let steer = clamp(err * 2.5 - car.av * 0.28, -1, 1);

  /* ---------- speed planning ---------- */
  const skillLat = spec.latAccel * (0.90 + ai.skill * 0.10);
  const cornerSpeed = maxK > 1e-5
    ? Math.min(spec.topSpeed, Math.sqrt(skillLat / maxK))
    : spec.topSpeed;
  const hardCorner = cornerSpeed * 0.92;

  let throttle = 0;
  let handbrake = false;

  if (speed < hardCorner) {
    throttle = clamp((hardCorner - speed) / 70 + 0.35, 0, 1) * throttleScale;
  } else if (speed > cornerSpeed * 1.03) {
    throttle = -clamp((speed - cornerSpeed) / 90, 0, 1);
  } else {
    throttle = 0.35 * throttleScale;
  }
  if (brakeTap) throttle = Math.min(throttle, -brakeTap);

  // rotate the car with the handbrake when it is badly out of shape
  ai.hbCd -= dt;
  if (Math.abs(err) > 0.95 && speed > 210 && ai.hbCd <= 0) {
    handbrake = true;
    if (Math.abs(err) < 0.45) ai.hbCd = 1.6;
  }
  if (Math.abs(err) > 1.5 && speed > 160) {
    throttle = Math.min(throttle, 0.1);
  }

  /* ---------- stuck / wrong-way recovery ---------- */
  const tangentErr = Math.abs(angleDiff(Math.atan2(s[car.idx].ty, s[car.idx].tx), car.θ));
  if (speed < 16) ai.stuck += dt; else ai.stuck = Math.max(0, ai.stuck - dt * 0.6);
  ai.wrongT = tangentErr > 2.1 ? ai.wrongT + dt : 0;
  if (ai.stuck > 1.0 || ai.wrongT > 1.1) {
    car.recover = Math.max(car.recover, 1.1);
    ai.stuck = 0;
    ai.wrongT = 0;
  }

  if (car.recover > 0) {
    car.recover -= dt;
    const back = s[(car.idx - 6 + n) % n];
    const toTrack = angleDiff(Math.atan2(back.y - car.y, back.x - car.x), car.θ);
    steer = clamp(-toTrack * 2.2, -1, 1);
    throttle = -0.85;
    handbrake = false;
  }

  /* ---------- nitro on the straights ---------- */
  ai.nitroT -= dt;
  if (!handbrake && car.nitro > 22 && ai.nitroT <= 0 && maxK < 0.0021 &&
      speed > spec.topSpeed * 0.5 && speed < spec.topSpeed * 0.96) {
    car.nitroHold = 1.3 + Math.random() * 0.9;
    ai.nitroT = 3.5 + Math.random() * 3.5;
  }
  let nitro = false;
  if (car.nitroHold > 0) {
    car.nitroHold -= dt;
    if (car.nitro > 0 && !handbrake) nitro = true;
    else car.nitroHold = 0;
  }

  /* ---------- gentle rubber banding (fair, never obvious) ---------- */
  const gap = car.progress - race.player.progress;
  let assist = 1;
  if (gap < -260) assist = 1.035;          // AI is ahead of the pack leader? keep honest
  if (gap > 420) assist = 0.975;           // player far behind -> ease off a touch
  if (race.mode === 'demo') assist = 1;

  car.steerVis += (clamp(steer, -1, 1) - car.steerVis) * Math.min(1, dt * 14);

  return { steer, throttle, nitro, handbrake, _assist: assist };
}

export function initAI(car, lineBias) {
  car.ai = {
    skill: 0.95,
    stuck: 0,
    wrongT: 0,
    hbCd: Math.random() * 2,
    nitroT: 1 + Math.random() * 3,
    lineBias: lineBias || 0,
  };
  car.nitroHold = 0;
}
