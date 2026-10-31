import * as THREE from 'three';
import { createWorld } from './world.js';
import { createPlayerModel } from './character.js';
import { EnemyManager } from './enemies.js';
import { VFXManager } from './combat.js';
import { AudioEngine } from './audio.js';

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas');
const titleScreen = $('title-screen');
const hud = $('hud');
const loading = $('loading');
const pauseMenu = $('pause-menu');
const gameover = $('gameover');
const victory = $('victory');
const dialogue = $('dialogue');
const controlsModal = $('controls-modal');
const interactPrompt = $('interact-prompt');
const interactText = $('interact-text');
const fadeEl = $('fade');
const mobileControls = $('mobile-controls');
const mobileSprint = $('mobile-sprint');
const toasts = $('toasts');
const damageFlash = $('damage-flash');
const bossPanel = $('boss-panel');
const bossFill = $('boss-fill');
const bossPhaseEl = $('boss-phase');
const bossSub = $('boss-sub');
const compass = $('compass');
const compassArrow = $('compass-arrow');
const compassLabel = $('compass-label');
const compassDist = $('compass-dist');
const minimap = $('minimap');
const mctx = minimap.getContext('2d');

/* ------------------------------------------------------------------ */
/* renderer / scene                                                    */
/* ------------------------------------------------------------------ */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfefff);
scene.fog = new THREE.Fog(0xcfe8ef, 80, 300);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 700);
camera.position.set(0, 24, 62);

const hemi = new THREE.HemisphereLight(0xd8f2ff, 0x5d7a42, 1.25);
scene.add(hemi);
const ambient = new THREE.AmbientLight(0x9fc8ff, 0.18);
scene.add(ambient);
const sunLight = new THREE.DirectionalLight(0xfff1cf, 2.15);
sunLight.position.set(58, 92, 46);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -82;
sunLight.shadow.camera.right = 82;
sunLight.shadow.camera.top = 82;
sunLight.shadow.camera.bottom = -82;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 240;
sunLight.shadow.bias = -0.00025;
sunLight.shadow.normalBias = 0.035;
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight); scene.add(sunLight.target);
const fillLight = new THREE.DirectionalLight(0x9fd6ff, 0.35);
fillLight.position.set(-50, 35, -30);
scene.add(fillLight);

/* ------------------------------------------------------------------ */
/* world / player / systems                                            */
/* ------------------------------------------------------------------ */
const world = createWorld(scene);
const vfx = new VFXManager(scene);
const audio = new AudioEngine();

const spawnPoint = new THREE.Vector3(0, world.heightAt(0, 44), 44);
const player = {
  pos: spawnPoint.clone(),
  vel: new THREE.Vector3(),
  yaw: Math.PI,
  vy: 0,
  grounded: true,
  hp: 100, maxHp: 100,
  mana: 100, maxMana: 100,
  level: 1, xp: 0, xpNext: 120,
  coins: 0, crystals: 0, weaponLevel: 0,
  attack: null, lastCombo: -1, comboTimer: 0,
  dodgeTimer: 0, dodgeCd: 0, dodgeDir: new THREE.Vector3(),
  invuln: 0, hurtTimer: 0, lastDamage: 99,
  magicTimer: 0, magicCd: 0, magicDelay: 0, magicDir: new THREE.Vector3(0, 0, -1),
  dead: false, jumpRequested: false,
  enemiesDefeated: 0, bossesDefeated: 0,
};

const playerModel = createPlayerModel();
scene.add(playerModel.root);
playerModel.root.position.copy(player.pos);
playerModel.root.rotation.y = player.yaw;

const pickups = [];
const pickupGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.055, 12);
const pickupMat = new THREE.MeshToonMaterial({ color: 0xffd37a, emissive: 0xffa31a, emissiveIntensity: 0.75 });

const game = {
  mode: 'title',
  started: false,
  zone: 'island',
  playTime: 0,
  titleTime: 0,
  hudTimer: 0,
  minimapTimer: 0,
  shake: 0,
  hitStop: 0,
  hintTimer: 0,
  victoryTimer: 0,
  pendingVictory: false,
  respawn: { pos: new THREE.Vector3(6.2, world.heightAt(6.2, 31.5), 31.5), zone: 'island', name: 'Dawn Shrine' },
  respawnIsland: { pos: new THREE.Vector3(6.2, world.heightAt(6.2, 31.5), 31.5), zone: 'island', name: 'Dawn Shrine' },
  controlsReturn: 'title',
  currentInteract: null,
  coinSoundCooldown: 0,
};

const quests = [
  {
    id: 'crystals', title: 'Shards of Dawn', giver: 'Elder Mira',
    state: 'active', progress: 0, target: 5,
    reward: { coins: 120, xp: 260 },
    objective: 'Collect 5 dawn crystals',
    hint: 'Speak with Elder Mira',
  },
  {
    id: 'beasts', title: 'Beasts of the Vale', giver: 'Rook',
    state: 'locked', progress: 0, target: 6,
    reward: { coins: 180, xp: 340 },
    objective: 'Defeat 6 beasts of the isle',
    hint: 'Speak with Rook at the forge',
  },
  {
    id: 'king', title: 'The Hollow King', giver: 'Kael',
    state: 'locked', stage: 0, progress: 0, target: 3,
    reward: { coins: 500, xp: 1000 },
    objective: 'Light the Dawn Shrine at the temple',
    hint: 'Speak with Kael in the forest',
  },
];

/* ------------------------------------------------------------------ */
/* enemy manager callbacks                                             */
/* ------------------------------------------------------------------ */
const manager = new EnemyManager(scene, world, vfx, audio, {
  getZone: () => game.zone,
  onPlayerHit: (dmg, pos) => playerTakeDamage(dmg, pos),
  onEnemyDeath: (e) => {
    player.enemiesDefeated++;
    addXP(e.xp);
    spawnCoinBurst(e.group.position.clone(), e.coins, e.type === 'shade' ? 5 : 4);
    const q = quests.find(q => q.id === 'beasts');
    if (q.state === 'active') {
      q.progress = Math.min(q.target, q.progress + 1);
      if (q.progress >= q.target) completeQuest(q);
      else updateQuestUI();
    }
  },
  onBossStart: (boss) => {
    world.bossActive = true;
    world.fogWall.visible = true;
    bossPanel.classList.remove('hidden');
    bossPhaseEl.textContent = 'I';
    bossSub.textContent = 'Ancient sovereign of the deep';
    bossFill.style.width = '100%';
    audio.setMood('boss');
    game.shake = 0.65;
    toast('THE HOLLOW KING AWAKENS', 'purple', '☠', 5000);
    const q = quests.find(q => q.id === 'king');
    if (q.state === 'active' && q.stage < 2) {
      q.stage = 2; q.objective = 'Defeat the Hollow King'; updateQuestUI();
    }
    updateCompass();
  },
  onBossDamage: () => { updateBossBar(); },
  onBossPhase: () => {
    bossPhaseEl.textContent = 'II';
    bossSub.textContent = 'The seal is breaking — fury unbound';
    toast('The Hollow King enters his second phase', 'purple', '☠', 3800);
    game.shake = 0.7;
  },
  onBossSlam: () => { game.shake = Math.max(game.shake, 0.5); },
  onBossDefeated: () => {
    world.bossActive = false;
    world.bossDefeated = true;
    world.fogWall.visible = false;
    bossPanel.classList.add('hidden');
    player.bossesDefeated++;
    const q = quests.find(q => q.id === 'king');
    if (q.state === 'active') completeQuest(q, true);
    else if (q.state !== 'done') { q.state = 'done'; q.progress = q.target; updateQuestUI(); updateMarkers(); }
    addXP(700); addCoins(300);
    audio.setMood('dungeon');
    game.pendingVictory = true;
    game.victoryTimer = 3.0;
    toast('The Hollow King falls. The seal breaks.', 'gold', '✦', 4200);
    updateMarkers();
  },
});

/* ------------------------------------------------------------------ */
/* input state                                                         */
/* ------------------------------------------------------------------ */
const keys = new Set();
const joy = { x: 0, y: 0, active: false, pointerId: null };
let camYaw = 0;
let camPitch = 0.24;
let camDist = 7.8;
let cameraSnap = true;
let sprintToggle = false;
let controlsOpen = false;
let pointerDrag = null;
let lastJoyTap = 0;
let questUIStale = true;

const ATTACKS = {
  light: [
    { damage: 16, duration: 0.44, hitTime: 0.14, range: 2.9, arc: 2.0, knockback: 2.4, lunge: 1.2, heavy: false },
    { damage: 18, duration: 0.44, hitTime: 0.14, range: 3.0, arc: 2.1, knockback: 2.6, lunge: 1.2, heavy: false },
    { damage: 26, duration: 0.56, hitTime: 0.2, range: 3.3, arc: 2.5, knockback: 4.2, lunge: 1.8, heavy: false },
  ],
  heavy: { damage: 36, duration: 0.78, hitTime: 0.4, range: 3.3, arc: 2.2, knockback: 6.5, lunge: 2.4, heavy: true },
};

/* ------------------------------------------------------------------ */
/* utility                                                             */
/* ------------------------------------------------------------------ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}
function dampAngle(current, target, lambda, dt) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * (1 - Math.exp(-lambda * dt));
}
function forwardFromYaw(yaw) { return new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); }
function damageMultiplier() { return (1 + 0.08 * (player.level - 1)) * (1 + 0.22 * player.weaponLevel); }

function toast(text, type = '', icon = '✦', duration = 3200) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const ic = document.createElement('span'); ic.className = 't-ico'; ic.textContent = icon;
  const tx = document.createElement('span'); tx.textContent = text;
  el.append(ic, tx);
  toasts.appendChild(el);
  while (toasts.children.length > 4) toasts.firstChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 380);
  }, duration);
}

function flashDamage() {
  damageFlash.classList.add('on');
  setTimeout(() => damageFlash.classList.remove('on'), 130);
}

function withFade(cb) {
  fadeEl.classList.add('on');
  setTimeout(() => {
    cb();
    setTimeout(() => fadeEl.classList.remove('on'), 90);
  }, 380);
}

/* ------------------------------------------------------------------ */
/* progression                                                         */
/* ------------------------------------------------------------------ */
function heroTitle() {
  const l = player.level;
  if (l >= 7) return 'Star Sovereign';
  if (l >= 5) return 'Dawnblade';
  if (l >= 3) return 'Starwarden';
  return 'Wanderer';
}

function addXP(amount) {
  player.xp += amount;
  let leveled = false;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.round(player.xpNext * 1.48 + 45);
    player.maxHp += 18;
    player.hp = player.maxHp;
    player.maxMana += 5;
    player.mana = player.maxMana;
    leveled = true;
  }
  if (leveled) {
    audio.levelUp();
    vfx.levelUp(player.pos.clone());
    toast(`LEVEL ${player.level} — ${heroTitle()}`, 'gold', '✦', 4200);
    $('hero-title').textContent = heroTitle();
  }
  updateHUD(0);
}

function addCoins(amount) {
  player.coins += amount;
  updateHUD(0);
}

function spawnCoinBurst(pos, totalValue, count = 5) {
  const per = Math.max(1, Math.round(totalValue / count));
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(pickupGeo, pickupMat);
    mesh.castShadow = true;
    const a = Math.random() * Math.PI * 2;
    const sp = 1.5 + Math.random() * 2.4;
    const p = pos.clone();
    p.y += 0.5;
    mesh.position.copy(p);
    scene.add(mesh);
    pickups.push({
      mesh, value: per, age: 0,
      vel: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 2, Math.sin(a) * sp),
      ground: game.zone === 'dungeon' ? 0.3 : world.heightAt(p.x, p.z),
    });
  }
}

function updatePickups(dt) {
  game.coinSoundCooldown = Math.max(0, game.coinSoundCooldown - dt);
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.age += dt;
    const target = player.pos.clone().add(new THREE.Vector3(0, 0.7, 0));
    const d = p.mesh.position.distanceTo(target);
    if (p.age > 0.25 && d < 7) {
      const dir = target.sub(p.mesh.position).normalize();
      p.vel.lerp(dir.multiplyScalar(11 + (7 - d) * 2.5), Math.min(1, dt * 7));
    } else {
      p.vel.y -= 18 * dt;
      if (p.mesh.position.y < p.ground + 0.15) {
        p.mesh.position.y = p.ground + 0.15;
        p.vel.y *= -0.35;
        p.vel.x *= 0.82; p.vel.z *= 0.82;
      }
    }
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.y += dt * 7;
    p.mesh.rotation.z = Math.PI / 2;
    if (p.age > 0.25 && d < 0.85) {
      addCoins(p.value);
      if (game.coinSoundCooldown <= 0) { audio.coin(); game.coinSoundCooldown = 0.08; }
      vfx.pickupBurst(p.mesh.position.clone(), 0xffd37a);
      scene.remove(p.mesh);
      pickups.splice(i, 1);
    } else if (p.age > 25) {
      scene.remove(p.mesh);
      pickups.splice(i, 1);
    }
  }
}

/* ------------------------------------------------------------------ */
/* quests                                                              */
/* ------------------------------------------------------------------ */
function updateQuestUI() {
  const list = $('quest-list');
  list.innerHTML = '';
  for (const q of quests) {
    const el = document.createElement('div');
    el.className = `quest-item ${q.state === 'active' ? 'active' : q.state === 'done' ? 'done' : 'locked'}`;
    const title = document.createElement('div');
    title.className = 'quest-title';
    const name = document.createElement('span');
    name.textContent = q.title;
    const small = document.createElement('small');
    small.textContent = q.state === 'done' ? 'COMPLETE' : q.state === 'active' ? 'ACTIVE' : 'LOCKED';
    title.append(name, small);
    const obj = document.createElement('div');
    obj.className = 'quest-obj';
    if (q.state === 'done') obj.textContent = 'Quest complete · reward claimed';
    else if (q.state === 'active') {
      if (q.id === 'king') obj.textContent = q.objective;
      else obj.textContent = `${q.objective} · ${q.progress}/${q.target}`;
    } else obj.textContent = q.hint;
    el.append(title, obj);
    if (q.state === 'active' && q.id !== 'king') {
      const bar = document.createElement('div'); bar.className = 'quest-progress';
      const fill = document.createElement('i'); fill.style.width = `${Math.min(100, q.progress / q.target * 100)}%`;
      bar.appendChild(fill); el.appendChild(bar);
    }
    list.appendChild(el);
  }
  questUIStale = false;
  updateMarkers();
  updateCompass();
}

function updateMarkers() {
  const q1 = quests[0], q2 = quests[1], q3 = quests[2];
  for (const n of world.npcs) {
    if (!n.marker) continue;
    if (n.id === 'mira') n.marker.visible = q1.state === 'active';
    if (n.id === 'rook') n.marker.visible = q2.state !== 'done';
    if (n.id === 'kael') n.marker.visible = q1.state === 'done' && q3.state !== 'done';
  }
}

function completeQuest(q, silent = false) {
  if (q.state === 'done') return;
  q.state = 'done';
  q.progress = q.target;
  addCoins(q.reward.coins);
  addXP(q.reward.xp);
  if (!silent) {
    toast(`QUEST COMPLETE · ${q.title}`, 'gold', '✦', 4600);
    toast(`Reward: ${q.reward.coins} coins · ${q.reward.xp} XP`, 'gold', '◈', 4000);
    audio.quest();
  }
  updateQuestUI();
  updateMarkers();
}

function questCrystalProgress() {
  const q = quests[0];
  if (q.state !== 'active') return;
  q.progress = Math.min(q.target, q.progress + 1);
  if (q.progress >= q.target) completeQuest(q);
  else updateQuestUI();
}

function quest3Advance(stage, objective) {
  const q = quests[2];
  if (q.state !== 'active') return;
  if (stage > q.stage) {
    q.stage = stage;
    q.objective = objective;
    updateQuestUI();
    if (stage === 1) toast('New objective: Enter the Shadow Gate', 'purple', '◈', 3800);
    if (stage === 2) toast('New objective: Defeat the Hollow King', 'purple', '☠', 3800);
  }
}

/* ------------------------------------------------------------------ */
/* combat                                                              */
/* ------------------------------------------------------------------ */
function nearestEnemyWithin(radius) {
  let best = null, bd = radius;
  for (const e of manager.enemies) {
    if (e.dead) continue;
    if (e.inDungeon && game.zone !== 'dungeon') continue;
    if (!e.inDungeon && game.zone !== 'island') continue;
    const d = Math.hypot(e.group.position.x - player.pos.x, e.group.position.z - player.pos.z);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function startAttack(type = 'light', forcedCombo = null) {
  if (game.mode !== 'playing' || player.dead || player.dodgeTimer > 0) return;
  if (player.attack) {
    if (type === 'light' && player.attack.type === 'light' && player.attack.comboIndex < 2 && !player.attack.queued) {
      player.attack.queued = true;
      player.attack.queueAt = player.attack.time;
    }
    return;
  }
  let comboIndex = 0;
  if (forcedCombo !== null) comboIndex = forcedCombo;
  else if (type === 'light' && player.comboTimer > 0) comboIndex = (player.lastCombo + 1) % 3;
  const def = type === 'heavy' ? ATTACKS.heavy : ATTACKS.light[comboIndex];
  player.attack = { type, comboIndex, def, time: 0, hitDone: false, queued: false, queueAt: 0 };
  player.comboTimer = 0;
  const near = nearestEnemyWithin(4.6);
  if (near && !player.attack?.moving) {
    player.yaw = Math.atan2(near.group.position.x - player.pos.x, near.group.position.z - player.pos.z);
  }
  const fwd = forwardFromYaw(player.yaw);
  player.vel.addScaledVector(fwd, def.lunge);
  audio.swing(type === 'heavy');
  vfx.slash(player.pos.clone().add(new THREE.Vector3(0, 1.0, 0)).addScaledVector(fwd, 0.55), player.yaw, type === 'heavy', type === 'heavy' ? 0xffd37a : 0x9ffcff);
  if (type === 'heavy') game.shake = Math.max(game.shake, 0.18);
  updateHUD(0);
}

function performAttackHit(attack) {
  const def = attack.def;
  const dmg = def.damage * damageMultiplier();
  const hits = manager.enemiesInArc(player.pos, player.yaw, def.range, def.arc);
  let hitAny = false;
  for (const e of hits) {
    const dir = new THREE.Vector3(e.group.position.x - player.pos.x, 0, e.group.position.z - player.pos.z).normalize();
    if (manager.damage(e, dmg, dir, def.knockback, def.heavy, 'sword')) {
      hitAny = true;
      player.mana = Math.min(player.maxMana, player.mana + 5);
    }
  }
  if (hitAny) {
    game.hitStop = 0.04;
    game.shake = Math.max(game.shake, def.heavy ? 0.42 : 0.2);
  }
  const fwd = forwardFromYaw(player.yaw);
  vfx.slash(player.pos.clone().add(new THREE.Vector3(0, def.heavy ? 1.2 : 1.0, 0)).addScaledVector(fwd, 0.75), player.yaw + (attack.comboIndex === 2 ? 0.3 : 0), def.heavy, def.heavy ? 0xffd37a : 0x9ffcff);
}

function castMagic() {
  if (game.mode !== 'playing' || player.dead || player.magicCd > 0) return;
  if (player.mana < 40) {
    player.magicCd = 0.5;
    toast('Not enough starlight', '', '✦', 1400);
    return;
  }
  player.mana -= 40;
  player.magicCd = 1.1;
  player.magicTimer = 0.9;
  player.magicDelay = 0.24;
  const near = nearestEnemyWithin(7);
  if (near) player.yaw = Math.atan2(near.group.position.x - player.pos.x, near.group.position.z - player.pos.z);
  player.magicDir = forwardFromYaw(player.yaw);
  playerModel.setState('magic');
  audio.magic();
  vfx.shockwave(player.pos.clone(), 1.4, 0x7df9ff, 0.5);
  game.shake = Math.max(game.shake, 0.12);
  updateHUD(0);
}

function spawnMagicBolt() {
  const origin = player.pos.clone().add(new THREE.Vector3(0, 1.25, 0)).addScaledVector(player.magicDir, 0.9);
  vfx.magicBolt(origin, player.magicDir,
    (pos) => manager.enemiesInRadius(pos, 1.15).length > 0,
    (pos) => {
      const hits = manager.enemiesInRadius(pos, 4.4);
      const dmg = 52 * damageMultiplier();
      for (const e of hits) {
        const dir = new THREE.Vector3(e.group.position.x - pos.x, 0, e.group.position.z - pos.z).normalize();
        manager.damage(e, dmg, dir, 4, true, 'magic');
      }
      game.shake = 0.55;
      game.hitStop = 0.06;
    }, 0x7df9ff);
}

function playerTakeDamage(amount, sourcePos) {
  if (player.invuln > 0 || player.dead || game.mode !== 'playing') return;
  player.hp = Math.max(0, player.hp - amount);
  player.invuln = 0.85;
  player.hurtTimer = 0.35;
  player.lastDamage = 0;
  const dir = player.pos.clone().sub(sourcePos).setY(0);
  if (dir.lengthSq() > 0.001) player.vel.addScaledVector(dir.normalize(), 4.8);
  playerModel.setState('hurt');
  audio.hurt();
  vfx.damageNumber(player.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), amount, 'white');
  flashDamage();
  game.shake = Math.max(game.shake, 0.5);
  updateHUD(0);
  if (player.hp <= 0) playerDie();
}

function playerDie() {
  if (player.dead) return;
  player.dead = true;
  playerModel.setState('dead');
  audio.enemyDeath(true);
  game.mode = 'dying';
  interactPrompt.classList.add('hidden');
  setTimeout(() => {
    if (game.mode !== 'dying') return;
    game.mode = 'gameover';
    gameover.classList.remove('hidden');
  }, 1350);
}

function retryFromCheckpoint() {
  gameover.classList.add('hidden');
  withFade(() => {
    const r = game.respawn;
    game.zone = r.zone;
    world.setZone(r.zone, scene);
    if (r.zone === 'dungeon') {
      manager.resetBoss();
      world.fogWall.visible = false;
      world.bossActive = false;
      bossPanel.classList.add('hidden');
      audio.setMood('dungeon');
      hemi.intensity = 0.3; sunLight.intensity = 0.4; ambient.intensity = 0.05; fillLight.intensity = 0.08;
    } else {
      manager.resetMinions();
      audio.setMood('island');
      hemi.intensity = 1.25; sunLight.intensity = 2.15; ambient.intensity = 0.18; fillLight.intensity = 0.35;
    }
    manager.resetBoss();
    player.pos.copy(r.pos);
    player.vel.set(0, 0, 0);
    player.vy = 0;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    player.dead = false;
    player.invuln = 1.6;
    player.attack = null;
    player.dodgeTimer = 0;
    player.magicTimer = 0;
    player.yaw = r.zone === 'dungeon' ? Math.PI : Math.PI;
    camYaw = 0; camPitch = 0.24; camDist = 7.8; cameraSnap = true;
    playerModel.root.position.copy(player.pos);
    playerModel.setState('idle');
    game.mode = 'playing';
    toast(`Revived at ${r.name}`, 'gold', '✦', 3200);
    updateHUD(0);
  });
}

/* ------------------------------------------------------------------ */
/* player update                                                       */
/* ------------------------------------------------------------------ */
function groundY() {
  return game.zone === 'dungeon' ? 0.3 : world.heightAt(player.pos.x, player.pos.z);
}

function resolvePlayerCollisions() {
  const cols = game.zone === 'dungeon' ? world.dungeonColliders : world.colliders;
  const pr = 0.42;
  for (const c of cols) {
    const dx = player.pos.x - c.x;
    const dz = player.pos.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + pr;
    if (d < min && d > 0.0001) {
      player.pos.x = c.x + dx / d * min;
      player.pos.z = c.z + dz / d * min;
    }
  }
  if (game.zone === 'dungeon') {
    player.pos.x = clamp(player.pos.x, -14.5, 14.5);
    player.pos.z = clamp(player.pos.z, -246, -199.2);
  } else {
    const d = Math.hypot(player.pos.x, player.pos.z);
    if (d > 94) { player.pos.x *= 94 / d; player.pos.z *= 94 / d; }
    if (world.heightAt(player.pos.x, player.pos.z) < -0.85) {
      // keep the player on the shore rather than swimming through the lake
      player.pos.x -= player.vel.x * 0.02;
      player.pos.z -= player.vel.z * 0.02;
    }
  }
}

function updatePlayer(dt) {
  if (player.dead) return;
  player.invuln = Math.max(0, player.invuln - dt);
  player.dodgeCd = Math.max(0, player.dodgeCd - dt);
  player.magicCd = Math.max(0, player.magicCd - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.comboTimer = Math.max(0, player.comboTimer - dt);
  player.lastDamage += dt;
  player.mana = Math.min(player.maxMana, player.mana + dt * 9);
  if (player.lastDamage > 9 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + dt * 2.5);
  }

  // attack progression
  if (player.attack) {
    const a = player.attack;
    a.time += dt;
    if (!a.hitDone && a.time >= a.def.hitTime) {
      a.hitDone = true;
      performAttackHit(a);
    }
    if (a.time >= a.def.duration) {
      const combo = a.comboIndex;
      const queued = a.queued;
      const type = a.type;
      player.attack = null;
      player.comboTimer = 0.92;
      player.lastCombo = combo;
      if (queued && type === 'light' && combo < 2) {
        startAttack('light', combo + 1);
      }
    }
  }

  if (player.magicDelay > 0) {
    player.magicDelay -= dt;
    if (player.magicDelay <= 0) spawnMagicBolt();
  }
  player.magicTimer = Math.max(0, player.magicTimer - dt);

  // input direction relative to camera
  let mx = 0, mz = 0;
  if (keys.has('KeyD')) mx += 1;
  if (keys.has('KeyA')) mx -= 1;
  if (keys.has('KeyW')) mz += 1;
  if (keys.has('KeyS')) mz -= 1;
  mx += joy.x;
  mz -= joy.y;
  const inputLen = Math.hypot(mx, mz);
  if (inputLen > 1) { mx /= inputLen; mz /= inputLen; }
  const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
  const moveDir = new THREE.Vector3().addScaledVector(forward, mz).addScaledVector(right, mx);
  if (moveDir.lengthSq() > 1) moveDir.normalize();
  const moving = moveDir.lengthSq() > 0.01;

  const sprinting = (keys.has('ShiftLeft') || keys.has('ShiftRight') || sprintToggle) && moving && !player.attack && player.magicTimer <= 0;
  let speed = sprinting ? 9.2 : 5.7;
  if (player.attack) speed *= 0.28;
  if (player.magicTimer > 0) speed *= 0.5;
  if (!player.grounded) speed *= 0.92;

  if (player.dodgeTimer > 0) {
    player.dodgeTimer -= dt;
    const k = clamp(player.dodgeTimer / 0.42, 0, 1);
    player.vel.x = player.dodgeDir.x * 13.5 * (0.55 + k * 0.45);
    player.vel.z = player.dodgeDir.z * 13.5 * (0.55 + k * 0.45);
    if (player.dodgeTimer <= 0) {
      player.vel.multiplyScalar(0.25);
      player.invuln = Math.max(player.invuln, 0.08);
    }
  } else {
    player.vel.x = damp(player.vel.x, moving ? moveDir.x * speed : 0, moving ? 13 : 9, dt);
    player.vel.z = damp(player.vel.z, moving ? moveDir.z * speed : 0, moving ? 13 : 9, dt);
  }

  // face movement / combat
  if (moving && !player.attack && player.dodgeTimer <= 0 && player.hurtTimer <= 0) {
    player.yaw = dampAngle(player.yaw, Math.atan2(moveDir.x, moveDir.z), 14, dt);
  }

  const prevX = player.pos.x, prevZ = player.pos.z;
  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;
  resolvePlayerCollisions();
  if (game.zone === 'island' && world.heightAt(player.pos.x, player.pos.z) < -0.9) {
    player.pos.x = prevX; player.pos.z = prevZ;
    player.vel.x *= 0.2; player.vel.z *= 0.2;
  }

  // jump / gravity
  if (player.jumpRequested && player.grounded) {
    player.vy = 8.6;
    player.grounded = false;
    audio.jump();
    vfx.hitSpark(player.pos.clone().add(new THREE.Vector3(0, 0.1, 0)), 0xbffcff, 8, 0.7, 0.35);
    player.jumpRequested = false;
  }
  player.jumpRequested = false;
  const ground = groundY();
  if (!player.grounded || player.pos.y > ground + 0.06) {
    player.vy -= 25.5 * dt;
    player.pos.y += player.vy * dt;
    player.grounded = false;
    if (player.pos.y <= ground) {
      if (player.vy < -6) {
        game.shake = Math.max(game.shake, 0.12);
        vfx.hitSpark(player.pos.clone().add(new THREE.Vector3(0, 0.1, 0)), 0xcfe8ef, 10, 0.7, 0.35);
      }
      player.pos.y = ground;
      player.vy = 0;
      player.grounded = true;
    }
  } else {
    player.pos.y = ground;
    player.vy = 0;
    player.grounded = true;
  }

  // pickup crystals
  for (const c of world.crystals) {
    if (c.collected) continue;
    if (Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z) < 1.5 && Math.abs(c.pos.y - player.pos.y) < 2.4) {
      collectCrystal(c);
    }
  }

  // state + model
  let state = 'idle';
  if (player.dead) state = 'dead';
  else if (player.hurtTimer > 0) state = 'hurt';
  else if (player.dodgeTimer > 0) state = 'dodge';
  else if (player.attack) state = player.attack.type === 'heavy' ? 'heavy' : `attack${player.attack.comboIndex}`;
  else if (player.magicTimer > 0) state = 'magic';
  else if (!player.grounded) state = 'jump';
  else if (moving) state = sprinting ? 'run' : 'walk';
  playerModel.setState(state);
  playerModel.root.position.copy(player.pos);
  playerModel.root.rotation.y = player.yaw;
  const horizSpeed = Math.hypot(player.vel.x, player.vel.z);
  playerModel.update(dt, player.attack || player.dodgeTimer > 0 ? 0 : horizSpeed, player.grounded);

  if (player.hp <= 0) playerDie();
  updateHUD(dt);
}

function dodgeRoll() {
  if (game.mode !== 'playing' || player.dead || player.dodgeCd > 0 || player.attack) return;
  let dir = new THREE.Vector3();
  const mx = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + joy.x;
  const mz = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) - joy.y;
  const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
  dir.addScaledVector(forward, mz).addScaledVector(right, mx);
  if (dir.lengthSq() < 0.01) dir = forwardFromYaw(player.yaw);
  player.dodgeDir.copy(dir.normalize());
  player.yaw = Math.atan2(player.dodgeDir.x, player.dodgeDir.z);
  player.dodgeTimer = 0.42;
  player.dodgeCd = 1.05;
  player.invuln = 0.55;
  player.attack = null;
  audio.dodge();
  vfx.hitSpark(player.pos.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xbffcff, 12, 0.9, 0.45);
}

/* ------------------------------------------------------------------ */
/* interactions                                                        */
/* ------------------------------------------------------------------ */
function findNearestInteractable() {
  let best = null, bd = 3.7;
  for (const it of world.interactables) {
    if (it.inDungeon && game.zone !== 'dungeon') continue;
    if (it.inIsland && game.zone !== 'island') continue;
    if (!it.inDungeon && game.zone === 'dungeon') continue;
    if (it.type === 'chest' && it.opened) continue;
    if (it.type === 'dungeon-exit' && game.zone !== 'dungeon') continue;
    const d = Math.hypot(it.pos.x - player.pos.x, it.pos.z - player.pos.z);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

function interactLabel(it) {
  if (!it) return '';
  if (it.type === 'npc') return `Talk to ${it.name}`;
  if (it.type === 'chest') return 'Open Treasure Chest';
  if (it.type === 'shrine') return it.active ? `Rest at ${it.name}` : `Activate ${it.name}`;
  if (it.type === 'temple') return world.templeLit ? 'Dawn Shrine (rest)' : 'Light the Dawn Shrine';
  if (it.type === 'dungeon-gate') return world.templeLit ? 'Enter the Shadow Gate' : 'Sealed Shadow Gate';
  if (it.type === 'dungeon-exit') return manager.bossActive ? 'Sealed by the Hollow King' : 'Return to the Isle';
  return it.name;
}

function updateInteraction() {
  if (game.mode !== 'playing') { interactPrompt.classList.add('hidden'); game.currentInteract = null; return; }
  const it = findNearestInteractable();
  game.currentInteract = it;
  if (it) {
    interactPrompt.classList.remove('hidden');
    interactText.textContent = interactLabel(it);
  } else {
    interactPrompt.classList.add('hidden');
  }
}

function interact() {
  if (game.mode !== 'playing') return;
  const it = game.currentInteract || findNearestInteractable();
  if (!it) return;
  if (it.type === 'npc') openDialogue(it);
  else if (it.type === 'chest') openChest(it);
  else if (it.type === 'shrine') activateShrine(it);
  else if (it.type === 'temple') lightTemple();
  else if (it.type === 'dungeon-gate') tryEnterDungeon();
  else if (it.type === 'dungeon-exit') tryExitDungeon();
}

function openChest(chest) {
  if (chest.opened) return;
  chest.opened = true;
  chest.lid.rotation.x = -1.35;
  chest.glow.visible = false;
  addCoins(chest.reward);
  addXP(Math.round(chest.reward * 0.6));
  audio.chest();
  vfx.pickupBurst(chest.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xffd37a);
  vfx.shockwave(chest.pos.clone(), 1.8, 0xffd37a, 0.7);
  toast(`Treasure found · ${chest.reward} coins`, 'gold', '◈', 3600);
  updateHUD(0);
}

function activateShrine(shrine) {
  const wasActive = shrine.active;
  shrine.active = true;
  if (shrine.crystal) shrine.crystal.material = world.mats.gold;
  if (shrine.glow) shrine.glow.material.color.setHex(0xffd37a);
  if (shrine.ring) shrine.ring.material.color.setHex(0xffd37a);
  player.hp = player.maxHp;
  player.mana = player.maxMana;
  player.lastDamage = 99;
  const respawn = { pos: shrine.pos.clone(), zone: shrine.inDungeon ? 'dungeon' : 'island', name: shrine.name };
  game.respawn = respawn;
  if (respawn.zone === 'island') game.respawnIsland = respawn;
  audio.checkpoint();
  vfx.heal(player.pos.clone());
  toast(`${shrine.name} ${wasActive ? 'restores' : 'awakens'} — checkpoint set`, 'gold', '✦', 3600);
  updateHUD(0);
}

function lightTemple() {
  if (!world.templeLit) {
    world.activateTemple();
    world.templeLit = true;
    const templeShrine = world.checkpoints.find(c => c.id === 'temple');
    if (templeShrine) {
      templeShrine.active = true;
      templeShrine.crystal.material = world.mats.gold;
      templeShrine.glow.material.color.setHex(0xffd37a);
      templeShrine.ring.material.color.setHex(0xffd37a);
      game.respawnIsland = { pos: new THREE.Vector3(0, 11, -55), zone: 'island', name: 'Temple Shrine' };
      game.respawn = game.respawnIsland;
    }
    player.hp = player.maxHp; player.mana = player.maxMana;
    audio.checkpoint();
    vfx.shockwave(new THREE.Vector3(0, 11.2, -64), 5, 0xffd37a, 1.1);
    vfx.heal(player.pos.clone());
    toast('THE DAWN SHRINE AWAKENS — the Shadow Gate is open', 'gold', '✦', 4800);
    quest3Advance(1, 'Enter the Shadow Gate');
    updateQuestUI();
  } else {
    player.hp = player.maxHp; player.mana = player.maxMana;
    audio.heal();
    vfx.heal(player.pos.clone());
    toast('The shrine\'s light restores you', 'gold', '✦', 2400);
  }
  updateHUD(0);
}

function tryEnterDungeon() {
  if (!world.templeLit) {
    toast('A dark seal bars the way. Light the Dawn Shrine at the temple.', 'purple', '☠', 4200);
    return;
  }
  withFade(() => {
    game.zone = 'dungeon';
    world.setZone('dungeon', scene);
    world.dungeonEntered = true;
    hemi.intensity = 0.3; sunLight.intensity = 0.4; ambient.intensity = 0.05; fillLight.intensity = 0.08;
    player.pos.set(0, 0.3, -205.5);
    player.vel.set(0, 0, 0);
    player.vy = 0;
    player.yaw = Math.PI;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    camYaw = 0; camPitch = 0.22; camDist = 7.4; cameraSnap = true;
    playerModel.root.position.copy(player.pos);
    playerModel.setState('idle');
    world.dungeonShrine.active = true;
    if (world.dungeonShrine.crystal) world.dungeonShrine.crystal.material = world.mats.gold;
    if (world.dungeonShrine.glow) world.dungeonShrine.glow.material.color.setHex(0xffd37a);
    game.respawn = { pos: new THREE.Vector3(5.5, 0.3, -202.5), zone: 'dungeon', name: 'Echo Shrine' };
    manager.resetBoss();
    manager.bossActive = false;
    world.bossActive = false;
    world.fogWall.visible = false;
    bossPanel.classList.add('hidden');
    audio.setMood('dungeon');
    quest3Advance(2, 'Defeat the Hollow King');
    updateQuestUI();
    toast('THE SHADOW DUNGEON — the Hollow King waits below', 'purple', '☠', 4600);
    updateHUD(0);
  });
}

function tryExitDungeon() {
  if (manager.bossActive) {
    toast('The Hollow King\'s seal holds the gate. Defeat him.', 'purple', '☠', 3200);
    return;
  }
  withFade(() => {
    game.zone = 'island';
    world.setZone('island', scene);
    hemi.intensity = 1.25; sunLight.intensity = 2.15; ambient.intensity = 0.18; fillLight.intensity = 0.35;
    const r = game.respawnIsland;
    player.pos.copy(r.pos);
    player.vel.set(0, 0, 0); player.vy = 0;
    player.yaw = Math.PI;
    player.hp = player.maxHp; player.mana = player.maxMana;
    camYaw = 0; camPitch = 0.24; camDist = 7.8; cameraSnap = true;
    playerModel.root.position.copy(player.pos);
    game.respawn = r;
    manager.resetBoss();
    bossPanel.classList.add('hidden');
    audio.setMood('island');
    toast('Back on the Isle of Echoes', 'gold', '✦', 2800);
    updateHUD(0);
  });
}

/* ------------------------------------------------------------------ */
/* NPC dialogue                                                        */
/* ------------------------------------------------------------------ */
function addDialogueAction(label, fn, cls = '') {
  const btn = document.createElement('button');
  btn.textContent = label;
  if (cls) btn.className = cls;
  btn.addEventListener('click', () => { audio.click(); fn(); });
  $('dlg-actions').appendChild(btn);
  return btn;
}

function openDialogue(npc) {
  game.mode = 'dialogue';
  dialogue.classList.remove('hidden');
  interactPrompt.classList.add('hidden');
  playerModel.setState('dialogue');
  renderDialogue(npc);
}

function closeDialogue() {
  dialogue.classList.add('hidden');
  game.mode = 'playing';
  playerModel.setState('idle');
}

function renderDialogue(npc) {
  const q1 = quests[0], q2 = quests[1], q3 = quests[2];
  const name = $('dlg-name');
  const text = $('dlg-text');
  const actions = $('dlg-actions');
  const portrait = $('dlg-portrait');
  actions.innerHTML = '';
  name.textContent = npc.name;
  portrait.textContent = npc.name.charAt(0);
  const add = (l, f, c) => addDialogueAction(l, f, c);
  add('Farewell', closeDialogue);

  if (npc.id === 'mira') {
    if (q1.state === 'active') {
      portrait.style.color = '#7df9ff';
      text.textContent = `Astra, the dawn crystals have scattered across the isle. Their light keeps the old seal sleeping. Gather five of them — the compass will guide you. The temple lies north, beyond the village path.`;
      add('I will find them', closeDialogue, 'primary');
    } else if (q1.state === 'done' && !world.templeLit) {
      text.textContent = `You carry the dawn again. Now climb to the ancient temple in the north and light its shrine. Only then will the Shadow Gate open.`;
      add('To the temple, then', closeDialogue, 'primary');
    } else if (world.templeLit && !manager.bossDefeated) {
      text.textContent = `The shrine burns, and the Shadow Gate stirs at the western edge of the isle. Kael knows the old paths. Go carefully — the Hollow King does not forgive.`;
      add('I am ready', closeDialogue, 'primary');
    } else {
      text.textContent = `The dawn remembers you, Astra. The isle is free because you were brave enough to walk into the dark.`;
    }
  } else if (npc.id === 'rook') {
    portrait.style.color = '#ffd37a';
    if (q2.state === 'locked') {
      text.textContent = `Beasts have been bold since the crystals fell. Six of them prowl the vale. Thin the herd and I'll pay you well — and I can temper that blade of yours.`;
      add('Accept quest: Beasts of the Vale', () => {
        q2.state = 'active';
        toast('QUEST STARTED · Beasts of the Vale', 'gold', '✦', 3600);
        audio.quest(); updateQuestUI(); renderDialogue(npc);
      }, 'gold');
    } else if (q2.state === 'active') {
      text.textContent = `The vale is quieter already. ${q2.progress} of ${q2.target} beasts felled. Keep that blade moving.`;
    } else {
      text.textContent = `The vale sleeps easy now. You've earned every coin, Astra.`;
    }
    if (player.weaponLevel < 3) {
      const cost = [120, 240, 400][player.weaponLevel];
      add(`Temper blade · ${cost} coins`, () => {
        if (player.coins < cost) { toast('Not enough coins', 'gold', '◈', 1800); return; }
        player.coins -= cost;
        player.weaponLevel++;
        playerModel.setSwordLevel(player.weaponLevel);
        audio.quest();
        vfx.levelUp(player.pos.clone());
        toast(`Blade tempered — +22% damage`, 'gold', '⚔', 3600);
        updateHUD(0); renderDialogue(npc);
      }, player.coins >= cost ? 'primary' : '');
    } else {
      add('Blade is already legendary', () => {}, '');
    }
    if (player.hp < player.maxHp) {
      add('Restore health · 30 coins', () => {
        if (player.coins < 30) { toast('Not enough coins', 'gold', '◈', 1800); return; }
        player.coins -= 30;
        player.hp = player.maxHp;
        audio.heal(); vfx.heal(player.pos.clone());
        updateHUD(0); renderDialogue(npc);
      }, '');
    }
  } else if (npc.id === 'kael') {
    portrait.style.color = '#9dffcf';
    if (q1.state !== 'done') {
      text.textContent = `The temple will not answer while the dawn crystals lie scattered. Gather them first, and I will show you the way to the Shadow Gate.`;
    } else if (q3.state === 'locked') {
      text.textContent = `You carry the dawn now. Light the shrine at the temple — then the Shadow Gate can be opened. Beyond it waits the Hollow King. I will mark the path.`;
      add('Accept quest: The Hollow King', () => {
        q3.state = 'active';
        q3.stage = 0;
        q3.objective = 'Light the Dawn Shrine at the temple';
        toast('QUEST STARTED · The Hollow King', 'purple', '☠', 3800);
        audio.quest(); updateQuestUI(); renderDialogue(npc);
      }, 'gold');
    } else if (q3.state === 'active' && q3.stage === 0) {
      text.textContent = `The temple stands north of the village. Light the shrine at its heart, and the way below will open.`;
    } else if (q3.state === 'active' && q3.stage === 1) {
      text.textContent = `The Shadow Gate is open at the west edge of the isle. Take a breath at the shrine before you descend.`;
    } else if (q3.state === 'active') {
      text.textContent = `The Hollow King waits in the dark. Strike true, and do not let him corner you.`;
    } else {
      text.textContent = `You did it. The vale has never been brighter.`;
    }
  }
  if (actions.children.length === 0) add('Close', closeDialogue, 'primary');
}

/* ------------------------------------------------------------------ */
/* zone / camera                                                       */
/* ------------------------------------------------------------------ */
function cameraCollision(target, desired) {
  const cols = game.zone === 'dungeon' ? world.dungeonColliders : world.colliders;
  const dx = desired.x - target.x;
  const dz = desired.z - target.z;
  const len2 = dx * dx + dz * dz;
  if (len2 < 0.001) return;
  let tMin = 1;
  for (const c of cols) {
    if (c.r < 1.0) continue;
    const fx = target.x - c.x;
    const fz = target.z - c.z;
    const rr = c.r + 0.42;
    const a = len2;
    const b = 2 * (fx * dx + fz * dz);
    const cc = fx * fx + fz * fz - rr * rr;
    const disc = b * b - 4 * a * cc;
    if (disc < 0) continue;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    if (t > 0.06 && t < tMin) tMin = t;
  }
  if (tMin < 1) {
    const t = Math.max(0.14, tMin - 0.04);
    desired.x = target.x + dx * t;
    desired.z = target.z + dz * t;
    desired.y = target.y + (desired.y - target.y) * t;
    if (game.zone === 'island') {
      const gh = world.heightAt(desired.x, desired.z);
      if (desired.y < gh + 0.55) desired.y = gh + 0.55;
    } else {
      desired.y = Math.max(desired.y, 1.0);
    }
  }
}

function updateCamera(dt) {
  const target = player.pos.clone().add(new THREE.Vector3(0, 1.45, 0));
  const cosP = Math.cos(camPitch);
  const desired = target.clone().add(new THREE.Vector3(
    Math.sin(camYaw) * cosP * camDist,
    Math.sin(camPitch) * camDist,
    Math.cos(camYaw) * cosP * camDist
  ));
  if (game.zone === 'island') {
    const gh = world.heightAt(desired.x, desired.z);
    if (desired.y < gh + 0.6) desired.y = gh + 0.6;
    const d = Math.hypot(desired.x, desired.z);
    if (d > 120) { desired.x *= 120 / d; desired.z *= 120 / d; }
  } else {
    desired.x = clamp(desired.x, -14.2, 14.2);
    desired.z = clamp(desired.z, -244.5, -198.2);
    desired.y = clamp(desired.y, 1.1, 15.5);
  }
  cameraCollision(target, desired);
  if (cameraSnap) {
    camera.position.copy(desired);
    cameraSnap = false;
  } else {
    camera.position.lerp(desired, 1 - Math.exp(-9 * dt));
  }
  if (game.shake > 0.001) {
    const s = game.shake;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s * 0.7;
    camera.position.z += (Math.random() - 0.5) * s;
    game.shake *= Math.exp(-8 * dt);
  }
  const look = target.clone().add(new THREE.Vector3(0, 0.15, 0));
  camera.lookAt(look);
}

function updateTitleCamera(dt) {
  game.titleTime += dt;
  const a = game.titleTime * 0.1 + 0.6;
  const r = 60;
  camera.position.set(Math.sin(a) * r, 23 + Math.sin(a * 0.7) * 4, Math.cos(a) * r);
  camera.lookAt(0, 5, 0);
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */
function updateBossBar() {
  if (!manager.boss || manager.bossDefeated) return;
  const ratio = clamp(manager.boss.hp / manager.boss.maxHp, 0, 1);
  bossFill.style.width = `${ratio * 100}%`;
  bossPhaseEl.textContent = manager.boss.phase === 2 ? 'II' : 'I';
}

function getObjective() {
  const q1 = quests[0], q2 = quests[1], q3 = quests[2];
  if (q1.state === 'active') {
    let best = null, bd = Infinity;
    for (const c of world.crystals) {
      if (c.collected) continue;
      const d = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) return { pos: best.pos, label: 'Dawn Crystal' };
    return { pos: world.npcs.find(n => n.id === 'mira').pos, label: 'Elder Mira' };
  }
  if (q2.state === 'active') {
    let best = null, bd = Infinity;
    for (const e of manager.enemies) {
      if (e.dead || e.type === 'boss') continue;
      const d = Math.hypot(e.group.position.x - player.pos.x, e.group.position.z - player.pos.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) return { pos: best.group.position, label: 'Vale Beast' };
    return { pos: world.npcs.find(n => n.id === 'rook').pos, label: 'Rook' };
  }
  if (q3.state === 'active') {
    if (q3.stage === 0) return { pos: new THREE.Vector3(0, 12, -64), label: 'Dawn Shrine' };
    if (q3.stage === 1) return { pos: new THREE.Vector3(-48, 5, -46), label: 'Shadow Gate' };
    if (q3.stage === 2) {
      const boss = manager.boss;
      return { pos: boss ? boss.group.position : new THREE.Vector3(0, 1, -232), label: 'Hollow King' };
    }
  }
  if (q1.state === 'done' && q2.state === 'locked') return { pos: world.npcs.find(n => n.id === 'rook').pos, label: 'Rook' };
  if (q2.state === 'done' && q3.state === 'locked') return { pos: world.npcs.find(n => n.id === 'kael').pos, label: 'Kael' };
  return null;
}

function updateCompass() {
  const obj = getObjective();
  if (!obj) { compass.classList.add('hidden'); return; }
  compass.classList.remove('hidden');
  compassLabel.textContent = obj.label;
  const dx = obj.pos.x - player.pos.x;
  const dz = obj.pos.z - player.pos.z;
  const d = Math.hypot(dx, dz);
  compassDist.textContent = `${Math.round(d)}m`;
  const targetAngle = Math.atan2(dx, dz);
  let rel = targetAngle - (camYaw + Math.PI);
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  compassArrow.style.transform = `rotate(${rel * 180 / Math.PI - 90}deg)`;
}

function updateHUD(dt) {
  game.hudTimer -= dt;
  if (game.hudTimer > 0) return;
  game.hudTimer = 0.1;
  $('hp-fill').style.width = `${clamp(player.hp / player.maxHp, 0, 1) * 100}%`;
  $('mana-fill').style.width = `${clamp(player.mana / player.maxMana, 0, 1) * 100}%`;
  $('xp-fill').style.width = `${clamp(player.xp / player.xpNext, 0, 1) * 100}%`;
  $('hp-text').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  $('mana-text').textContent = `${Math.ceil(player.mana)} / ${player.maxMana}`;
  $('xp-text').textContent = `Lv ${player.level} · ${Math.floor(player.xp)} / ${player.xpNext} XP`;
  $('level-badge').textContent = player.level;
  $('coin-count').textContent = player.coins;
  $('crystal-count').textContent = `${player.crystals} / ${world.crystals.length}`;
  $('hero-title').textContent = heroTitle();
  if (questUIStale) updateQuestUI();
  updateCompass();
  updateBossBar();
  if (manager.bossActive && manager.boss && !manager.bossDefeated) bossPanel.classList.remove('hidden');
  game.minimapTimer -= 0.1;
  if (game.minimapTimer <= 0) { game.minimapTimer = 0.18; drawMinimap(); }
  if (game.started && game.hintTimer < 30) {
    game.hintTimer += 0.1;
    if (game.hintTimer >= 30) $('hud-hint').style.opacity = '0';
  }
}

function drawMinimap() {
  const w = minimap.width, h = minimap.height;
  mctx.clearRect(0, 0, w, h);
  mctx.save();
  mctx.beginPath(); mctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2); mctx.clip();
  const bg = mctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
  bg.addColorStop(0, '#122a3a'); bg.addColorStop(1, '#07121f');
  mctx.fillStyle = bg; mctx.fillRect(0, 0, w, h);
  if (game.zone === 'island') {
    const scale = 1.32;
    const cx = w / 2, cy = h / 2;
    const px = (x) => cx + x * scale;
    const py = (z) => cy + z * scale;
    // island
    mctx.fillStyle = '#315a43';
    mctx.beginPath(); mctx.arc(cx, cy, 96 * scale, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = 'rgba(150,220,200,.25)'; mctx.lineWidth = 2; mctx.stroke();
    // forest patches
    mctx.fillStyle = 'rgba(42,102,66,.9)';
    for (const [x, z, r] of [[-38, -16, 32], [-22, -52, 24], [56, -34, 22], [-45, 20, 20]]) {
      mctx.beginPath(); mctx.arc(px(x), py(z), r * scale, 0, Math.PI * 2); mctx.fill();
    }
    // lake
    mctx.fillStyle = '#1b8da8';
    mctx.beginPath(); mctx.arc(px(52), py(14), 24 * scale, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = 'rgba(160,240,255,.4)'; mctx.lineWidth = 1.5; mctx.stroke();
    // paths
    mctx.strokeStyle = 'rgba(210,190,140,.38)'; mctx.lineWidth = 4;
    mctx.beginPath(); mctx.moveTo(px(0), py(50)); mctx.lineTo(px(0), py(38)); mctx.lineTo(px(3), py(10)); mctx.lineTo(px(0), py(-20)); mctx.lineTo(px(0), py(-52)); mctx.stroke();
    mctx.beginPath(); mctx.moveTo(px(3), py(10)); mctx.lineTo(px(-28), py(-10)); mctx.lineTo(px(-44), py(-34)); mctx.lineTo(px(-48), py(-46)); mctx.stroke();
    // village
    mctx.fillStyle = 'rgba(255,211,122,.85)';
    mctx.beginPath(); mctx.arc(px(0), py(38), 9 * scale, 0, Math.PI * 2); mctx.fill();
    // temple
    mctx.fillStyle = 'rgba(190,170,255,.9)';
    mctx.beginPath(); mctx.arc(px(0), py(-64), 5 * scale, 0, Math.PI * 2); mctx.fill();
    // gate
    mctx.fillStyle = '#a45cff';
    mctx.beginPath(); mctx.arc(px(-48), py(-46), 4 * scale, 0, Math.PI * 2); mctx.fill();
    // crystals
    for (const c of world.crystals) {
      if (c.collected) continue;
      mctx.fillStyle = '#7df9ff';
      mctx.beginPath(); mctx.arc(px(c.pos.x), py(c.pos.z), 2.4, 0, Math.PI * 2); mctx.fill();
    }
    // npcs
    for (const n of world.npcs) {
      mctx.fillStyle = '#ffd37a';
      mctx.beginPath(); mctx.arc(px(n.pos.x), py(n.pos.z), 2.8, 0, Math.PI * 2); mctx.fill();
    }
    // enemies
    for (const e of manager.enemies) {
      if (e.dead || e.inDungeon) continue;
      mctx.fillStyle = e.type === 'shade' ? '#d78bff' : '#ff6f91';
      mctx.beginPath(); mctx.arc(px(e.group.position.x), py(e.group.position.z), 2.6, 0, Math.PI * 2); mctx.fill();
    }
    // player
    mctx.save();
    mctx.translate(px(player.pos.x), py(player.pos.z));
    mctx.rotate(Math.PI - player.yaw);
    mctx.fillStyle = '#ffffff';
    mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(5.5, 6); mctx.lineTo(0, 3); mctx.lineTo(-5.5, 6); mctx.closePath(); mctx.fill();
    mctx.restore();
  } else {
    // dungeon room
    const cx = w / 2, cy = h / 2;
    const px = (x) => cx + x * 7.2;
    const py = (z) => cy + (z + 223) * 4.6;
    mctx.fillStyle = '#241431';
    mctx.fillRect(px(-17), py(-196), 34 * 7.2, 54 * 4.6);
    mctx.strokeStyle = 'rgba(180,105,255,.4)'; mctx.lineWidth = 3; mctx.strokeRect(px(-17), py(-196), 34 * 7.2, 54 * 4.6);
    mctx.fillStyle = 'rgba(180,105,255,.18)';
    mctx.beginPath(); mctx.arc(px(0), py(-232), 9 * 7.2, 0, Math.PI * 2); mctx.fill();
    mctx.fillStyle = '#b46bff';
    if (manager.boss && !manager.boss.dead) { mctx.beginPath(); mctx.arc(px(manager.boss.group.position.x), py(manager.boss.group.position.z), 7, 0, Math.PI * 2); mctx.fill(); }
    mctx.fillStyle = '#7df9ff';
    mctx.beginPath(); mctx.arc(px(5.5), py(-202.5), 4, 0, Math.PI * 2); mctx.fill();
    mctx.fillStyle = 'rgba(255,211,122,.8)';
    mctx.beginPath(); mctx.arc(px(0), py(-200), 3, 0, Math.PI * 2); mctx.fill();
    mctx.save();
    mctx.translate(px(player.pos.x), py(player.pos.z));
    mctx.rotate(Math.PI - player.yaw);
    mctx.fillStyle = '#ffffff';
    mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(5.5, 6); mctx.lineTo(0, 3); mctx.lineTo(-5.5, 6); mctx.closePath(); mctx.fill();
    mctx.restore();
  }
  // compass ring
  mctx.restore();
  mctx.strokeStyle = 'rgba(180,230,255,.18)'; mctx.lineWidth = 2;
  mctx.beginPath(); mctx.arc(w / 2, h / 2, w / 2 - 5, 0, Math.PI * 2); mctx.stroke();
  mctx.fillStyle = 'rgba(220,245,255,.75)';
  mctx.font = 'bold 14px "Trebuchet MS", sans-serif'; mctx.textAlign = 'center';
  mctx.fillText('N', w / 2, 20);
}

/* ------------------------------------------------------------------ */
/* crystals                                                            */
/* ------------------------------------------------------------------ */
function collectCrystal(c) {
  if (c.collected) return;
  c.collected = true;
  c.group.visible = false;
  player.crystals++;
  addCoins(15);
  addXP(38);
  player.hp = Math.min(player.maxHp, player.hp + 6);
  audio.pickup();
  vfx.pickupBurst(c.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x7df9ff);
  vfx.shockwave(c.pos.clone(), 1.6, 0x7df9ff, 0.55);
  toast(`Dawn Crystal · ${player.crystals} / ${world.crystals.length}`, 'gold', '◆', 2400);
  questCrystalProgress();
  updateHUD(0);
}

/* ------------------------------------------------------------------ */
/* game state screens                                                  */
/* ------------------------------------------------------------------ */
function startGame() {
  if (game.started) return;
  game.started = true;
  game.mode = 'playing';
  audio.init(); audio.resume(); audio.setMood('island'); audio.click();
  titleScreen.classList.add('gone');
  hud.classList.remove('hidden');
  mobileControls.classList.remove('hidden');
  player.pos.copy(spawnPoint);
  player.yaw = Math.PI;
  playerModel.root.position.copy(player.pos);
  playerModel.root.rotation.y = player.yaw;
  playerModel.setState('idle');
  camYaw = 0; camPitch = 0.24; camDist = 7.8; cameraSnap = true;
  game.respawn = { pos: new THREE.Vector3(6.2, world.heightAt(6.2, 31.5), 31.5), zone: 'island', name: 'Dawn Shrine' };
  game.respawnIsland = game.respawn;
  updateQuestUI();
  updateHUD(0);
  updateMarkers();
  updateInteraction();
  toast('Elder Mira: Astra, the dawn crystals have scattered across the isle.', 'gold', '✦', 6200);
  setTimeout(() => { if (game.mode !== 'title') toast('Quest started · Shards of Dawn', '', '◈', 3800); }, 1300);
}

function pauseGame() {
  if (game.mode !== 'playing') return;
  game.mode = 'paused';
  pauseMenu.classList.remove('hidden');
  $('pause-level').textContent = player.level;
  $('pause-coins').textContent = player.coins;
  $('pause-crystals').textContent = `${player.crystals} / ${world.crystals.length}`;
  $('pause-quests').textContent = `${quests.filter(q => q.state === 'done').length} / 3`;
  interactPrompt.classList.add('hidden');
  audio.click();
}

function resumeGame() {
  if (game.mode !== 'paused') return;
  game.mode = 'playing';
  pauseMenu.classList.add('hidden');
  controlsModal.classList.add('hidden');
  controlsOpen = false;
  audio.click();
}

function showVictory() {
  game.mode = 'victory';
  game.pendingVictory = false;
  victory.classList.remove('hidden');
  interactPrompt.classList.add('hidden');
  bossPanel.classList.add('hidden');
  audio.victory();
  $('victory-stats').innerHTML = '';
  const stats = [
    ['Level', player.level],
    ['Coins', player.coins],
    ['Crystals', `${player.crystals}/${world.crystals.length}`],
    ['Time', `${Math.floor(game.playTime / 60)}:${String(Math.floor(game.playTime % 60)).padStart(2, '0')}`],
  ];
  for (const [label, val] of stats) {
    const d = document.createElement('div');
    const s = document.createElement('span'); s.textContent = label;
    const b = document.createElement('b'); b.textContent = val;
    d.append(s, b); $('victory-stats').appendChild(d);
  }
}

/* ------------------------------------------------------------------ */
/* UI events                                                           */
/* ------------------------------------------------------------------ */
$('play-btn').addEventListener('click', startGame);
$('controls-btn').addEventListener('click', () => {
  game.controlsReturn = 'title';
  controlsOpen = true;
  controlsModal.classList.remove('hidden');
  audio.click();
});
$('controls-close').addEventListener('click', () => {
  controlsModal.classList.add('hidden');
  controlsOpen = false;
  if (game.controlsReturn === 'pause') pauseMenu.classList.remove('hidden');
  audio.click();
});
$('resume-btn').addEventListener('click', resumeGame);
$('pause-controls-btn').addEventListener('click', () => {
  game.controlsReturn = 'pause';
  controlsOpen = true;
  pauseMenu.classList.add('hidden');
  controlsModal.classList.remove('hidden');
  audio.click();
});
$('mute-btn').addEventListener('click', () => {
  audio.setMuted(!audio.muted);
  $('mute-btn').textContent = `Sound: ${audio.muted ? 'Off' : 'On'}`;
  audio.click();
});
$('menu-btn').addEventListener('click', () => location.reload());
$('retry-btn').addEventListener('click', retryFromCheckpoint);
$('gameover-menu-btn').addEventListener('click', () => location.reload());
$('continue-btn').addEventListener('click', () => {
  victory.classList.add('hidden');
  game.mode = 'playing';
  audio.setMood(game.zone === 'dungeon' ? 'dungeon' : 'island');
  toast('The isle is yours to explore', 'gold', '✦', 3200);
  audio.click();
});
$('victory-menu-btn').addEventListener('click', () => location.reload());
$('quest-collapse').addEventListener('click', () => {
  $('quest-tracker').classList.toggle('collapsed');
  $('quest-collapse').textContent = $('quest-tracker').classList.contains('collapsed') ? '+' : '–';
  audio.click();
});

/* ------------------------------------------------------------------ */
/* keyboard                                                            */
/* ------------------------------------------------------------------ */
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'Escape') {
    if (controlsOpen) {
      controlsModal.classList.add('hidden'); controlsOpen = false;
      if (game.controlsReturn === 'pause' && game.mode === 'paused') pauseMenu.classList.remove('hidden');
      return;
    }
    if (game.mode === 'dialogue') { closeDialogue(); return; }
    if (game.mode === 'paused') { resumeGame(); return; }
    if (game.mode === 'playing') { pauseGame(); return; }
  }
  if (e.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    $('mute-btn').textContent = `Sound: ${audio.muted ? 'Off' : 'On'}`;
    return;
  }
  if (game.mode !== 'playing') return;
  if (e.repeat) return;
  if (e.code === 'Space') { player.jumpRequested = true; }
  if (e.code === 'KeyC') dodgeRoll();
  if (e.code === 'KeyQ') castMagic();
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyJ') startAttack('light');
  if (e.code === 'KeyK') startAttack('heavy');
  if (e.code === 'ArrowLeft') camYaw += 0.18;
  if (e.code === 'ArrowRight') camYaw -= 0.18;
  if (e.code === 'ArrowUp') camPitch = clamp(camPitch + 0.1, -0.12, 1.15);
  if (e.code === 'ArrowDown') camPitch = clamp(camPitch - 0.1, -0.12, 1.15);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

/* ------------------------------------------------------------------ */
/* mouse / touch camera                                                */
/* ------------------------------------------------------------------ */
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  if (game.mode !== 'playing') return;
  if (e.pointerType === 'mouse' && e.button === 2) { startAttack('heavy'); return; }
  pointerDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, type: e.pointerType };
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointerDrag || pointerDrag.id !== e.pointerId) return;
  const dx = e.clientX - pointerDrag.x;
  const dy = e.clientY - pointerDrag.y;
  pointerDrag.x = e.clientX; pointerDrag.y = e.clientY;
  if (Math.abs(e.clientX - pointerDrag.sx) + Math.abs(e.clientY - pointerDrag.sy) > 5) pointerDrag.moved = true;
  camYaw -= dx * 0.0055;
  camPitch = clamp(camPitch + dy * 0.0042, -0.12, 1.15);
});
canvas.addEventListener('pointerup', (e) => {
  if (!pointerDrag || pointerDrag.id !== e.pointerId) return;
  if (!pointerDrag.moved && pointerDrag.type === 'mouse' && e.button === 0) startAttack('light');
  pointerDrag = null;
});
canvas.addEventListener('pointercancel', () => { pointerDrag = null; });
canvas.addEventListener('wheel', (e) => {
  if (game.mode !== 'playing') return;
  camDist = clamp(camDist + e.deltaY * 0.007, 4.2, 13.5);
}, { passive: true });

/* ------------------------------------------------------------------ */
/* mobile controls                                                     */
/* ------------------------------------------------------------------ */
const joyEl = $('joystick');
const joyKnob = $('joystick-knob');
function setJoyFromEvent(e) {
  const r = joyEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const max = r.width * 0.32;
  const d = Math.hypot(dx, dy);
  if (d > max) { dx *= max / d; dy *= max / d; }
  joy.x = dx / max; joy.y = dy / max;
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}
function resetJoy() {
  joy.x = 0; joy.y = 0; joy.active = false; joy.pointerId = null;
  joyKnob.style.transform = 'translate(0px, 0px)';
}
joyEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const now = performance.now();
  if (now - lastJoyTap < 320) {
    sprintToggle = !sprintToggle;
    mobileSprint.classList.toggle('on', sprintToggle);
  }
  lastJoyTap = now;
  joy.active = true; joy.pointerId = e.pointerId;
  joyEl.setPointerCapture?.(e.pointerId);
  setJoyFromEvent(e);
});
joyEl.addEventListener('pointermove', (e) => {
  if (!joy.active || joy.pointerId !== e.pointerId) return;
  setJoyFromEvent(e);
});
joyEl.addEventListener('pointerup', resetJoy);
joyEl.addEventListener('pointercancel', resetJoy);
mobileSprint.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sprintToggle = !sprintToggle;
  mobileSprint.classList.toggle('on', sprintToggle);
});
document.querySelectorAll('.mbtn').forEach(btn => {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (game.mode !== 'playing') return;
    const action = btn.dataset.action;
    if (action === 'attack') startAttack('light');
    if (action === 'heavy') startAttack('heavy');
    if (action === 'jump') player.jumpRequested = true;
    if (action === 'dodge') dodgeRoll();
    if (action === 'magic') castMagic();
    if (action === 'interact') interact();
  });
});

/* ------------------------------------------------------------------ */
/* main loop                                                           */
/* ------------------------------------------------------------------ */
const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const raw = Math.min(clock.getDelta(), 0.05);
  let dt = raw;
  if (game.hitStop > 0) { game.hitStop -= raw; dt *= 0.16; }
  elapsed += raw;

  world.update(raw);
  audio.update(raw);

  if (game.mode === 'playing') {
    game.playTime += raw;
    updatePlayer(dt);
    manager.update(dt, player.pos, player.invuln > 0);
    updatePickups(dt);
    updateInteraction();
    updateCamera(dt);
    updateHUD(raw);
    if (game.pendingVictory) {
      game.victoryTimer -= raw;
      if (game.victoryTimer <= 0) showVictory();
    }
  } else if (game.mode === 'title') {
    updateTitleCamera(raw);
    playerModel.root.position.copy(player.pos);
    playerModel.update(raw, 0, true);
    updateCompass();
  } else if (game.mode === 'dying') {
    playerModel.update(raw, 0, player.grounded);
    if (game.shake > 0) game.shake *= Math.exp(-4 * raw);
  } else if (game.mode === 'dialogue') {
    playerModel.update(raw, 0, player.grounded);
  } else if (game.mode === 'gameover' || game.mode === 'victory') {
    playerModel.update(raw, 0, player.grounded);
  }

  vfx.update(dt);
  renderer.render(scene, camera);
}

/* ------------------------------------------------------------------ */
/* resize + boot                                                       */
/* ------------------------------------------------------------------ */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateQuestUI();
updateHUD(0);
drawMinimap();
animate();
setTimeout(() => loading.classList.add('gone'), 420);
setTimeout(() => loading.remove(), 1300);

/* ------------------------------------------------------------------ */
/* debug / test API                                                    */
/* ------------------------------------------------------------------ */
window.__ASTRA__ = {
  player, world, quests, manager, vfx, game,
  api: {
    startGame,
    startAttack,
    castMagic,
    interact,
    dodgeRoll,
    teleport(x, z, zone = 'island') {
      game.zone = zone;
      world.setZone(zone, scene);
      player.pos.set(x, zone === 'dungeon' ? 0.3 : world.heightAt(x, z), z);
      player.vel.set(0, 0, 0);
      player.vy = 0;
      camYaw = 0; cameraSnap = true;
      playerModel.root.position.copy(player.pos);
      if (zone === 'dungeon') { hemi.intensity = 0.3; sunLight.intensity = 0.4; ambient.intensity = 0.05; fillLight.intensity = 0.08; }
      else { hemi.intensity = 1.25; sunLight.intensity = 2.15; ambient.intensity = 0.18; fillLight.intensity = 0.35; }
    },
    enterDungeon: tryEnterDungeon,
    exitDungeon: tryExitDungeon,
    lightTemple,
    startBoss() { manager.startBoss(); },
    damageBoss(n = 100) {
      if (!manager.boss) manager.startBoss();
      if (manager.boss) manager.damage(manager.boss, n, new THREE.Vector3(0, 0, 1), 0, true, 'debug');
    },
    damageNearest(n = 50) {
      const e = nearestEnemyWithin(50);
      if (e) manager.damage(e, n, new THREE.Vector3(0, 0, 1), 2, true, 'debug');
    },
    killAllMinions() {
      for (const e of [...manager.enemies]) if (e.type !== 'boss' && !e.dead) manager.damage(e, 9999, new THREE.Vector3(0, 0, 1), 2, true, 'debug');
    },
    collectCrystal(i = 0) { if (world.crystals[i]) collectCrystal(world.crystals[i]); },
    collectCrystals(n = 5) {
      for (const c of world.crystals) { if (n <= 0) break; if (!c.collected) { collectCrystal(c); n--; } }
    },
    completeQuest(id) { const q = quests.find(q => q.id === id); if (q) completeQuest(q); },
    giveCoins(n) { addCoins(n); },
    addXP(n) { addXP(n); },
    setHp(n) { player.hp = clamp(n, 0, player.maxHp); updateHUD(0); },
    setMana(n) { player.mana = clamp(n, 0, player.maxMana); updateHUD(0); },
    heal() { player.hp = player.maxHp; player.mana = player.maxMana; updateHUD(0); },
    pause: pauseGame,
    resume: resumeGame,
    showVictory,
    orbit(delta = 0, pitch = 0, dist = null) {
      camYaw += delta;
      camPitch = clamp(camPitch + pitch, -0.12, 1.15);
      if (dist != null) camDist = clamp(dist, 4.2, 13.5);
      cameraSnap = true;
    },
    setCamera(opts = {}) {
      if (opts.yaw != null) camYaw = opts.yaw;
      if (opts.pitch != null) camPitch = clamp(opts.pitch, -0.12, 1.15);
      if (opts.dist != null) camDist = clamp(opts.dist, 4.2, 13.5);
      if (opts.fov != null) { camera.fov = opts.fov; camera.updateProjectionMatrix(); }
      cameraSnap = true;
    },
    getState() {
      return {
        mode: game.mode,
        zone: game.zone,
        started: game.started,
        hp: player.hp,
        maxHp: player.maxHp,
        mana: player.mana,
        level: player.level,
        xp: player.xp,
        coins: player.coins,
        crystals: player.crystals,
        weaponLevel: player.weaponLevel,
        pos: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
        yaw: player.yaw,
        camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: camYaw, dist: camDist },
        quests: quests.map(q => ({ id: q.id, state: q.state, progress: q.progress, stage: q.stage })),
        enemies: manager.enemies.filter(e => !e.dead).length,
        bossHp: manager.boss ? manager.boss.hp : null,
        bossActive: manager.bossActive,
        bossDefeated: manager.bossDefeated,
        templeLit: world.templeLit,
        respawn: game.respawn.name,
        controls: { mobile: !mobileControls.classList.contains('hidden'), joystick: { x: joy.x, y: joy.y } },
      };
    },
  },
};
