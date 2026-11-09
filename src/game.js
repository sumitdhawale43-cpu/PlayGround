import * as THREE from 'three';
import { createWorld } from './world.js';
import { createHero, CHARACTERS } from './models.js';
import { AudioEngine, ParticleSystem, Input, clamp, damp, dist2 } from './engine.js';

const $ = id => document.getElementById(id);
const show = (id, on = true) => $(id)?.classList.toggle('hidden', !on);
const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
const SAVE_KEY = 'astra-rebirth-save-v1';
const canvas = $('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 900);
const gameWorld = createWorld(scene);
const particles = new ParticleSystem(scene, 1100);
const input = new Input(canvas);
const audio = new AudioEngine();
const clock = new THREE.Clock();
const state = {
  mode: 'title', charId: 'kael', hero: null, level: 1, xp: 0, gold: 40, shards: 0,
  hp: 150, stamina: 110, ultimate: 0, kills: 0, playTime: 0, quest: 0,
  inventory: { tonic: 2, starshard: 0, relic: 0 }, checkpoint: { x: 0, z: 2 },
  x: 0, z: 2, cameraYaw: 0, cameraPitch: 0.18, attackCd: 0, heavyCd: 0, abilityCd: 0, dodgeCd: 0,
  block: false, invuln: 0, combo: 0, comboTimer: 0, interactTarget: null,
  currentRegion: '', toastId: 0, dialogLines: [], dialogIndex: 0, elapsed: 0, day: 0.72,
  boss: gameWorld.bosses[0], endingSeen: false, fps: 0, fpsFrames: 0, fpsTime: 0, jumpV: 0, grounded: true,
  hitFlash: 0, actionAnim: 0, actionKind: '', autosave: 0, dodgeTime: 0, attackAnim: 0
};
let heroDef = CHARACTERS[state.charId];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function mountHero(id) {
  if (state.hero) scene.remove(state.hero.rock);
  state.charId = id; heroDef = CHARACTERS[id] || CHARACTERS.kael; state.hero = createHero(id);
  state.hero.rock.position.set(state.x ?? 0, 0, state.z ?? 2); scene.add(state.hero.rock);
  state.hp = Math.min(state.hp || heroDef.hp, heroDef.hp + (state.level - 1) * 12);
  state.stamina = Math.min(state.stamina || heroDef.stamina, heroDef.stamina + (state.level - 1) * 4);
  updateHeroLabels();
}
function updateHeroLabels() {
  setText('avatar-glyph', heroDef.glyph); setText('hud-char-name', heroDef.name); setText('hud-level', `Lv.${state.level}`);
  setText('hud-xp', state.xp); setText('hud-gold', state.gold); setText('hud-shards', state.shards);
}
function startJourney(id = 'kael', saved = null) {
  if (saved) {
    Object.assign(state, saved); state.inventory = { tonic: 2, starshard: 0, relic: 0, ...(saved.inventory || {}) };
    const collected = new Set(saved.collected || []); gameWorld.collectibles.forEach((c, i) => { c.active = !collected.has(i); c.mesh.visible = c.active; });
    const defeated = new Set(saved.defeated || []); gameWorld.enemies.forEach((e, i) => { e.dead = defeated.has(i); e.hp = e.dead ? 0 : e.maxHp; e.mesh.visible = !e.dead; });
    const boss = gameWorld.bosses[0]; boss.defeated = !!saved.bossDefeated; boss.hp = boss.defeated ? 0 : boss.maxHp; boss.mesh.visible = !boss.defeated; boss.active = false;
  } else {
    state.x = 0; state.z = 2; state.level = 1; state.xp = 0; state.gold = 40; state.shards = 0;
    state.hp = CHARACTERS[id].hp; state.stamina = CHARACTERS[id].stamina; state.ultimate = 0; state.kills = 0; state.quest = 0;
    state.inventory = { tonic: 2, starshard: 0, relic: 0 }; state.checkpoint = { x: 0, z: 2 }; state.endingSeen = false;
    state.boss = gameWorld.bosses[0]; state.boss.defeated = false; state.boss.hp = state.boss.maxHp; state.boss.active = false; state.boss.mesh.visible = true;
    gameWorld.collectibles.forEach(c => { c.active = true; c.mesh.visible = true; });
    gameWorld.enemies.forEach(e => { e.dead = false; e.hp = e.maxHp; e.mesh.visible = true; e.mesh.position.set(e.homeX, 0, e.homeZ); });
  }
  state.x ??= 0; state.z ??= 2; mountHero(saved?.charId || id); state.mode = 'playing';
  show('title-screen', false); show('char-select', false); show('hud'); show('mobile-controls', input.touchCapable);
  audio.init(); audio.setRegion?.('Aetheria'); setQuest(); toast(saved ? 'Journey restored' : 'A new journey begins', saved ? 'Your progress is ready.' : 'Find Elder Elara in the village.');
  updateHud(); saveGame(false);
}
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
}
addEventListener('resize', resize);

function toast(title, detail = '', type = '') {
  const stack = $('toast-stack'); if (!stack) return;
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<span class="t-ico">${type === 'lvl' ? '✦' : type === 'ach' ? '◇' : '✧'}</span><span><b></b><small class="t-sub"></small></span>`;
  el.querySelector('b').textContent = title; el.querySelector('.t-sub').textContent = detail;
  stack.appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3200);
}
function setQuest() {
  const quests = [
    ['Echoes of Astra', 'Speak with Elder Elara in Aetheria.'],
    ['A Shard in the Wild', `Find 3 Starshards beyond the village. (${state.shards}/3)`],
    ['The Warden Stirs', 'Travel to the Verdant Warden’s arena.'],
    ['Rebirth Protocol', 'Defeat the Verdant Warden.'],
    ['A New Dawn', 'The realm is yours to explore.']
  ];
  const q = quests[Math.min(state.quest, quests.length - 1)];
  setText('quest-title', q[0]); setText('quest-objective', q[1]);
}
function saveGame(notify = true) {
  if (!state.hero) return;
  const data = {
    charId: state.charId, level: state.level, xp: state.xp, gold: state.gold, shards: state.shards,
    hp: state.hp, stamina: state.stamina, ultimate: state.ultimate, kills: state.kills, playTime: state.playTime,
    quest: state.quest, inventory: state.inventory, checkpoint: state.checkpoint, x: state.x, z: state.z,
    endingSeen: state.endingSeen, bossDefeated: !!state.boss?.defeated,
    collected: gameWorld.collectibles.map((c, i) => c.active ? -1 : i).filter(i => i >= 0),
    defeated: gameWorld.enemies.map((e, i) => e.dead ? i : -1).filter(i => i >= 0)
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); setText('continue-label', `Lv.${state.level} · ${state.charId.toUpperCase()}`); if (notify) toast('Journey saved', 'Your progress is safe.'); }
  catch { if (notify) toast('Save unavailable', 'Local storage could not be accessed.'); }
}
function updateHud() {
  if (!state.hero) return;
  const maxHp = heroDef.hp + (state.level - 1) * 12, maxStamina = heroDef.stamina + (state.level - 1) * 4;
  const bar = (id, value, max) => { const el = $(id); if (el) el.style.width = `${clamp(value / max * 100, 0, 100)}%`; };
  bar('hp-fill', state.hp, maxHp); bar('stamina-fill', state.stamina, maxStamina); bar('xp-fill', state.xp, 100 + (state.level - 1) * 35);
  setText('hp-text', `${Math.ceil(state.hp)} / ${maxHp}`); setText('stamina-text', `${Math.ceil(state.stamina)}`);
  setText('hud-xp', state.xp); setText('hud-gold', state.gold); setText('hud-shards', state.shards); setText('hud-level', `Lv.${state.level}`);
  setText('hud-time', `${String(Math.floor((state.elapsed * 0.12 + 18) % 24)).padStart(2, '0')}:${String(Math.floor(state.elapsed * 7 % 60)).padStart(2, '0')}`);
  const region = gameWorld.getRegion(state.x, state.z); setText('hud-region', region.name);
  if (region.name !== state.currentRegion) { state.currentRegion = region.name; audio.setRegion(region.name); if (state.elapsed > 1) { setText('region-banner-name', region.name); setText('region-banner-sub', region.sub); show('region-banner'); setTimeout(() => show('region-banner', false), 3000); } }
  const boss = state.boss; show('boss-wrap', !!boss?.active && !boss.defeated);
  if (boss) { const fill = $('boss-fill'); if (fill) fill.style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`; setText('boss-phase', `PHASE ${boss.phase || 1}`); }
  drawMinimap(); updateHeroLabels();
}
function drawMinimap() {
  const c = $('minimap'); if (!c) return;
  const ctx = c.getContext('2d'), w = c.width, h = c.height, scale = 0.52;
  ctx.clearRect(0, 0, w, h); ctx.save(); ctx.beginPath(); ctx.arc(w / 2, h / 2, w * .47, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(24,38,47,.88)'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(206,184,139,.24)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w / 2, h / 2 + state.z * scale); ctx.lineTo(w / 2, h / 2 + (state.z + 122) * scale); ctx.stroke();
  const dot = (x, z, color, radius = 3) => { const dx = w / 2 + (x - state.x) * scale, dy = h / 2 + (z - state.z) * scale; if (dx > 0 && dx < w && dy > 0 && dy < h) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(dx, dy, radius, 0, Math.PI * 2); ctx.fill(); } };
  gameWorld.collectibles.forEach(o => { if (o.active && o.kind !== 'waypoint') dot(o.x, o.z, '#66e5ff', 2); });
  gameWorld.npcs.forEach(n => dot(n.x, n.z, '#f3d37d', 3));
  gameWorld.enemies.forEach(e => { if (!e.dead) dot(e.mesh.position.x, e.mesh.position.z, '#ef6b69', 2); });
  if (!state.boss.defeated) dot(state.boss.x, state.boss.z, '#b58cff', 4);
  ctx.fillStyle = '#fff2c4'; ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 7); ctx.lineTo(w / 2 - 5, h / 2 + 5); ctx.lineTo(w / 2 + 5, h / 2 + 5); ctx.closePath(); ctx.fill(); ctx.restore();
}
function setMode(mode) { state.mode = mode; input.exitLock(); }
function openPause(tab = 'inventory') { if (state.mode !== 'playing') return; setMode('pause'); show('pause-menu'); show('mobile-controls', false); renderPauseTab(tab); }
function closePause() { show('pause-menu', false); show('mobile-controls', input.touchCapable); setMode('playing'); }
const pauseTabs = {
  inventory: ['INVENTORY', 'Relics, tonics and materials gathered across the realm.'], equipment: ['EQUIPMENT', 'Your vessel and current astral armament.'], skills: ['SKILL TREE', 'Spend levels earned through exploration and battle.'],
  quests: ['QUEST JOURNAL', 'The path of the Astra shard.'], map: ['WORLD MAP', 'Aetheria and the lands beyond.'], settings: ['SETTINGS', 'Adjust the journey to your preference.']
};
function renderPauseTab(tab) {
  document.querySelectorAll('#pause-nav [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const [title, subtitle] = pauseTabs[tab] || pauseTabs.inventory; setText('pause-title', title); setText('pause-subtitle', subtitle);
  setText('pause-level', `LV. ${state.level}`); setText('pause-gold', `◈ ${state.gold}`);
  const content = $('pause-content'); if (!content) return;
  if (tab === 'inventory') content.innerHTML = `<div class="inv-grid"><div class="inv-card"><b>✧ Starshard</b><span>${state.shards} · Resonant fragments</span></div><div class="inv-card"><b>♢ Healing Tonic</b><span>${state.inventory.tonic} · Restores 45% vitality</span><button data-use-tonic>USE</button></div><div class="inv-card"><b>◈ Gold</b><span>${state.gold} · Aetherian currency</span></div><div class="inv-card"><b>◇ Astra Relic</b><span>${state.inventory.relic} · Guardian-bound relics</span></div></div>`;
  else if (tab === 'equipment') content.innerHTML = `<div class="codex-card"><h3>${heroDef.name} · ${heroDef.role}</h3><p>${heroDef.weapon.toUpperCase()} · ${heroDef.element} element</p><p>Attack ${heroDef.attack + (state.level - 1) * 4} · Defense ${heroDef.defense + Math.floor((state.level - 1) * 1.5)} · Vitality ${Math.ceil(state.hp)} / ${heroDef.hp + (state.level - 1) * 12}</p><p>Switch vessels with 1 / 2 / 3. Their unique forms change your combat style.</p></div>`;
  else if (tab === 'skills') content.innerHTML = `<div class="codex-card"><h3>ASTRAL RESONANCE · ${state.level} / 20</h3><p>Each level raises your maximum vitality and attack power. Current progress: ${state.xp} / ${100 + (state.level - 1) * 35} XP.</p><p>Earn experience by exploring, finding Starshards, and defeating enemies.</p></div>`;
  else if (tab === 'quests') content.innerHTML = `<div class="codex-card"><h3>${$('quest-title')?.textContent}</h3><p>${$('quest-objective')?.textContent}</p><p>Starshards collected: ${state.shards} · Enemies defeated: ${state.kills}</p></div>`;
  else if (tab === 'map') content.innerHTML = `<div class="codex-card map-card"><h3>THE FIVE REALMS</h3><p>${gameWorld.regions.map(r => `◆ ${r.name} — ${r.sub}`).join('<br>')}</p><p>Your position: ${Math.round(state.x)}, ${Math.round(state.z)} · Waypoint: ${Math.round(state.checkpoint.x)}, ${Math.round(state.checkpoint.z)}</p></div>`;
  else content.innerHTML = `<div class="codex-card"><h3>GAMEPLAY</h3><p>WASD move · Mouse look · Space jump · Shift dodge · Q block · F interact · Esc pause</p><p><label><input id="fps-toggle" type="checkbox" ${$('fps-counter')?.classList.contains('hidden') ? '' : 'checked'}> Show performance counter</label></p><p>Audio is generated locally. Your save remains in this browser.</p></div>`;
}

function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= 100 + (state.level - 1) * 35 && state.level < 20) {
    state.xp -= 100 + (state.level - 1) * 35; state.level++;
    const maxHp = heroDef.hp + (state.level - 1) * 12;
    state.hp = Math.min(maxHp, state.hp + 25); state.stamina = heroDef.stamina + (state.level - 1) * 4;
    toast(`Level ${state.level}`, 'Your strength grows with the Astra shard.', 'lvl'); audio.play('heal');
  }
  updateHud();
}
function worldPos(obj, y = 1) { return V(obj.x, y, obj.z); }
function addBurst(pos, color, count = 18, spread = 0.6, speed = 3) {
  particles.emit({ pos, count, color, spread, speed, speedVar: 2, life: 0.8, size: 8, sizeVar: 5, gravity: -1.5, drag: 1.1 });
}
function setDialogue(npc) {
  const lines = npc.kind === 'elder'
    ? (state.quest === 0
      ? ['The Astra shard has awakened, bearer. A darkness stirs beyond the old road.', 'Gather three Starshards from the forest, then seek the Verdant Warden. The village waypoint will always guide you home.']
      : state.quest < 2
        ? [`You have found ${state.shards} of the three Starshards. Their light is strongest beyond the village.`]
        : ['The Warden’s arena lies far to the north-east. Follow the old road and trust the light.', 'May the first dawn shine upon your blade.'] )
    : ['Welcome, traveler. The road is long and the stars are generous to those prepared.'];
  state.dialogLines = lines; state.dialogIndex = 0; state.dialogNpc = npc;
  setText('dlg-name', npc.name); setText('dlg-role', npc.role); setText('dlg-glyph', npc.kind === 'elder' ? 'E' : 'M');
  setText('dlg-text', lines[0]); $('dlg-options').innerHTML = '';
  setMode('dialogue'); show('dialogue'); show('interaction-prompt', false);
}
function closeDialogue() {
  const npc = state.dialogNpc;
  show('dialogue', false); state.dialogNpc = null; setMode('playing');
  if (npc?.kind === 'elder' && state.quest === 0) { state.quest = 1; setQuest(); toast('Quest updated', 'Find three Starshards in the forest.'); }
}
function openShop() {
  setText('shop-gold', `◈ ${state.gold}`);
  $('shop-items').innerHTML = `<div class="shop-item"><div><b>Healing Tonic</b><small>Restore 45% of your vitality.</small></div><span>◈ 25</span><button data-buy="tonic">BUY</button></div><div class="shop-item"><div><b>Starshard</b><small>A fragment of the first dawn.</small></div><span>◈ 60</span><button data-buy="shard">BUY</button></div>`;
  setMode('shop'); show('shop-panel');
}
function closeShop() { show('shop-panel', false); setMode('playing'); }
function setInteractionTarget() {
  let nearest = null, best = 3.5;
  for (const n of gameWorld.npcs) { const d = Math.hypot(n.x - state.x, n.z - state.z); if (d < best) { best = d; nearest = { type: 'npc', value: n }; } }
  for (const c of gameWorld.collectibles) if (c.active) { const d = Math.hypot(c.x - state.x, c.z - state.z); if (d < best) { best = d; nearest = { type: 'collectible', value: c }; } }
  state.interactTarget = nearest;
  show('interaction-prompt', !!nearest);
  if (nearest) setText('interaction-text', nearest.type === 'npc' ? (nearest.value.kind === 'merchant' ? 'Trade with the Wayfarer' : 'Speak with Elder Elara') : nearest.value.kind === 'waypoint' ? 'Attune to Waypoint' : nearest.value.kind === 'chest' ? 'Open Wayfarer’s Cache' : 'Collect Starshard');
}
function interact() {
  const target = state.interactTarget; if (!target) return;
  if (target.type === 'npc') {
    if (target.value.kind === 'merchant') openShop(); else setDialogue(target.value);
    return;
  }
  const c = target.value; c.active = false; c.mesh.visible = false;
  if (c.kind === 'waypoint') {
    state.checkpoint = { x: c.x, z: c.z }; state.hp = heroDef.hp + (state.level - 1) * 12; state.stamina = heroDef.stamina + (state.level - 1) * 4;
    toast('Waypoint attuned', 'Vitality restored. Your return point is set.', 'ach'); audio.play('heal');
  } else if (c.kind === 'chest') {
    state.gold += 45; state.inventory.tonic++; state.xp += 35; gainXP(0);
    toast('Wayfarer’s Cache', '45 gold · 1 Healing Tonic · 35 XP', 'ach'); audio.play('pickup'); addBurst(worldPos(c), 0xffd77b, 35, 1, 4);
  } else {
    state.shards++; state.inventory.starshard++; state.gold += 8; gainXP(18); audio.play('shard'); addBurst(worldPos(c), 0x7cecff, 24, 0.8, 3.5);
    toast('Starshard recovered', `Resonance ${state.shards}${state.quest === 1 ? ' / 3' : ''}`, 'ach');
    if (state.quest === 1 && state.shards >= 3) { state.quest = 2; toast('Quest complete', 'The Warden’s arena is revealed.', 'lvl'); }
  }
  setQuest(); updateHud(); saveGame(false); setInteractionTarget();
}
function nearestEnemy(max = 5, angleLimit = 0.15) {
  const yaw = state.hero?.rock.rotation.y || Math.PI;
  const forward = V(Math.sin(yaw), 0, Math.cos(yaw)); let target = null, best = max;
  for (const e of [...gameWorld.enemies, ...(state.boss && !state.boss.defeated && state.boss.active ? [state.boss] : [])]) {
    if (e.dead || e.defeated || !e.mesh.visible) continue;
    const dx = e.mesh.position.x - state.x, dz = e.mesh.position.z - state.z, d = Math.hypot(dx, dz);
    if (d > best) continue;
    const dot = (dx * forward.x + dz * forward.z) / Math.max(d, 0.001);
    if (dot >= angleLimit) { best = d; target = e; }
  }
  return target;
}
function damageEnemy(enemy, damage, color = 0xffd080) {
  if (!enemy || enemy.dead || enemy.defeated) return;
  enemy.hp = Math.max(0, enemy.hp - damage); enemy.hitFlash = 0.18;
  const p = enemy.mesh.position.clone(); p.y += enemy === state.boss ? 3 : 1;
  addBurst(p, color, 12, 0.35, 2.5); audio.play('hit');
  if (enemy.hp <= 0) {
    if (enemy === state.boss) defeatBoss();
    else {
      enemy.dead = true; enemy.mesh.visible = false; state.kills++; state.gold += 12 + Math.floor(Math.random() * 9); state.ultimate = clamp(state.ultimate + 16, 0, 100);
      gainXP(enemy.type === 'elite' ? 65 : 35); toast('Enemy defeated', '+35 XP · Gold recovered'); audio.play('death');
    }
  }
  updateHud();
}
function attack(kind = 'light') {
  if (state.mode !== 'playing') return;
  const heavy = kind === 'heavy', ability = kind === 'ability', ultimate = kind === 'ultimate';
  if (heavy && (state.heavyCd > 0 || state.stamina < 24)) return;
  if (ability && (state.abilityCd > 0 || state.stamina < 18)) return;
  if (ultimate && state.ultimate < 100) { toast('Ultimate not ready', 'Defeat foes to build astral resonance.'); return; }
  if (!heavy && !ability && !ultimate && state.attackCd > 0) return;
  if (heavy) { state.heavyCd = 0.85; state.stamina -= 24; state.attackAnim = 0.48; state.actionKind = 'heavy'; audio.play('swing'); }
  else if (ability) { state.abilityCd = 5.2; state.stamina -= 18; state.attackAnim = 0.5; state.actionKind = 'ability'; audio.play('ult'); }
  else if (ultimate) { state.ultimate = 0; state.attackAnim = 0.8; state.actionKind = 'ultimate'; audio.play('ult'); }
  else { state.attackCd = heroDef.weapon === 'dual' ? 0.22 : 0.38; state.combo = (state.combo % 3) + 1; state.comboTimer = 0.8; state.attackAnim = 0.32; state.actionKind = 'attack'; audio.play('swing'); }
  const range = ultimate ? 12 : ability ? 9 : heavy ? 5.2 : 3.7;
  const target = nearestEnemy(range, ultimate || ability ? -0.5 : -0.05);
  if (ultimate) {
    const center = V(state.x, 0.5, state.z); addBurst(center, heroDef.element === 'Fire' ? 0xff723d : heroDef.element === 'Ice' ? 0x7bdcff : 0xffdf59, 90, 4, 7);
    for (const e of [...gameWorld.enemies, ...(state.boss.active && !state.boss.defeated ? [state.boss] : [])]) if (!e.dead && !e.defeated && Math.hypot(e.mesh.position.x - state.x, e.mesh.position.z - state.z) < range) damageEnemy(e, heroDef.attack * 5 + state.level * 9, 0xffe98a);
  } else if (ability) {
    const color = heroDef.element === 'Fire' ? 0xff673a : heroDef.element === 'Ice' ? 0x77ddff : 0xffe55b;
    const pos = V(state.x, 1.3, state.z); addBurst(pos, color, 48, 1.5, 6);
    for (const e of [...gameWorld.enemies, ...(state.boss.active && !state.boss.defeated ? [state.boss] : [])]) if (!e.dead && !e.defeated && Math.hypot(e.mesh.position.x - state.x, e.mesh.position.z - state.z) < range) damageEnemy(e, heroDef.attack * 2.1 + state.level * 3, color);
  } else if (target) {
    const crit = Math.random() < heroDef.crit, damage = (heroDef.attack + (state.level - 1) * 4) * (heavy ? 2.1 : 0.85 + state.combo * 0.18) * (crit ? heroDef.critMult : 1);
    damageEnemy(target, damage, heroDef.element === 'Fire' ? 0xff854e : heroDef.element === 'Ice' ? 0x7bdcff : 0xffe45e);
    if (crit) toast('Critical strike', `${Math.round(damage)} damage`);
  }
  updateHud();
}

function defeatBoss() {
  const boss = state.boss;
  boss.hp = 0; boss.defeated = true; boss.active = false; boss.mesh.visible = false;
  state.quest = 4; state.inventory.relic++; state.gold += 250; state.ultimate = 100;
  gainXP(300); setQuest();
  setText('victory-name', boss.def.name); setText('victory-rewards', '250 Gold · Astra Relic · 300 XP');
  setMode('victory'); show('victory-screen'); audio.play('victory');
  addBurst(boss.mesh.position.clone().add(V(0, 3, 0)), 0x9dff9a, 110, 4, 8);
  saveGame(false);
}
function modal(title, body) {
  setText('modal-title', title);
  const el = $('modal-body'); if (el) el.innerHTML = body;
  show('modal');
}
function toTitle() {
  ['pause-menu', 'dialogue', 'shop-panel', 'death-screen', 'victory-screen', 'ending-screen', 'char-select', 'hud', 'mobile-controls'].forEach(id => show(id, false));
  show('title-screen'); setMode('title');
}
function useTonic() {
  if (!state.inventory.tonic) { toast('No tonics remaining', 'Visit the Wayfarer to stock up.'); return; }
  const max = heroDef.hp + (state.level - 1) * 12;
  if (state.hp >= max) { toast('Vitality full', 'Save the tonic for later.'); return; }
  state.inventory.tonic--; state.hp = Math.min(max, state.hp + Math.ceil(max * 0.45));
  audio.play('heal'); updateHud(); renderPauseTab('inventory'); saveGame(false);
}
function buyItem(item) {
  const price = item === 'tonic' ? 25 : 60;
  if (state.gold < price) { toast('Not enough gold', `You need ${price} gold.`); return; }
  state.gold -= price;
  if (item === 'tonic') state.inventory.tonic++;
  else {
    state.shards++; state.inventory.starshard++; gainXP(12);
    if (state.quest === 1 && state.shards >= 3) state.quest = 2;
    setQuest();
  }
  audio.play('pickup'); openShop(); updateHud(); saveGame(false);
}
function advanceDialogue() {
  if (state.mode !== 'dialogue') return;
  state.dialogIndex++;
  if (state.dialogIndex >= state.dialogLines.length) closeDialogue();
  else setText('dlg-text', state.dialogLines[state.dialogIndex]);
}
function switchHero(id) {
  if (!CHARACTERS[id] || id === state.charId || !state.hero) return;
  const old = state.hero.rock; scene.remove(old); mountHero(id); audio.play('shard');
  setText('cc-name', heroDef.name); setText('cc-role', heroDef.role); show('class-card');
  setTimeout(() => show('class-card', false), 1700); updateHud();
}
function bindUI() {
  $('btn-new-game')?.addEventListener('click', () => { show('title-screen', false); show('char-select'); });
  $('btn-continue')?.addEventListener('click', () => {
    try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (saved) startJourney(saved.charId || 'kael', saved); else toast('No saved journey', 'Begin a new journey first.'); }
    catch { toast('Save unavailable', 'A new journey can still be started.'); }
  });
  $('btn-how')?.addEventListener('click', () => modal('HOW TO PLAY', '<p>WASD to move · Mouse to look · Left click / J to attack · Right click / K for a heavy strike.</p><p>Space jumps · Shift dodges · Q blocks · E casts an ability · R unleashes your ultimate · F interacts · Esc pauses.</p><p>On touchscreens, use the joystick and action buttons. Find Elder Elara, gather Starshards, then face the Verdant Warden.</p>'));
  $('btn-credits')?.addEventListener('click', () => modal('CREDITS', '<p>ASTRA: REBIRTH</p><p>An original Three.js action-RPG vertical slice. World, characters, effects, and audio are generated locally.</p>'));
  $('modal-close')?.addEventListener('click', () => show('modal', false));
  $('cs-back')?.addEventListener('click', () => { show('char-select', false); show('title-screen'); });
  document.querySelectorAll('[data-char]').forEach(card => card.addEventListener('click', () => startJourney(card.dataset.char)));
  document.querySelectorAll('#pause-nav [data-tab]').forEach(btn => btn.addEventListener('click', () => renderPauseTab(btn.dataset.tab)));
  $('pause-close')?.addEventListener('click', closePause);
  $('btn-save')?.addEventListener('click', () => saveGame());
  $('btn-title')?.addEventListener('click', () => { saveGame(false); toTitle(); });
  $('shop-close')?.addEventListener('click', closeShop);
  $('dialogue')?.addEventListener('click', advanceDialogue);
  $('victory-continue')?.addEventListener('click', () => { show('victory-screen', false); setMode('playing'); state.boss.active = false; saveGame(false); });
  $('ending-continue')?.addEventListener('click', () => { show('ending-screen', false); setMode('playing'); });
  $('btn-respawn')?.addEventListener('click', () => {
    state.x = state.checkpoint.x; state.z = state.checkpoint.z;
    state.hp = heroDef.hp + (state.level - 1) * 12; state.stamina = heroDef.stamina + (state.level - 1) * 4;
    state.invuln = 2; state.hero.rock.position.set(state.x, 0, state.z);
    show('death-screen', false); setMode('playing'); updateHud();
  });
  $('btn-death-title')?.addEventListener('click', toTitle);
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'Escape') {
      if (state.mode === 'playing') openPause();
      else if (state.mode === 'pause') closePause();
      else if (state.mode === 'dialogue') closeDialogue();
      else if (state.mode === 'shop') closeShop();
    } else if (state.mode === 'dialogue' && ['Space', 'KeyJ', 'Enter'].includes(e.code)) {
      e.preventDefault(); advanceDialogue();
    }
  });
  $('mobile-menu')?.addEventListener('click', () => openPause());
  $('pause-content')?.addEventListener('click', e => { if (e.target.closest('[data-use-tonic]')) useTonic(); });
  $('shop-items')?.addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b) buyItem(b.dataset.buy); });
  $('pause-content')?.addEventListener('change', e => { if (e.target.id === 'fps-toggle') show('fps-counter', e.target.checked); });
}
bindUI();
try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (saved) setText('continue-label', `Lv.${saved.level || 1} · ${(saved.charId || 'kael').toUpperCase()}`);
} catch { /* storage may be disabled */ }

function key(code) { return input.pressed(code); }
function action(name) { return input.actionPressed(name); }
function updatePlayer(dt) {
  const h = state.hero, root = h.rock;
  const look = input.consumeLook();
  if (input.locked || input.dragging) {
    state.cameraYaw -= look.x * 0.0025;
    state.cameraPitch = clamp(state.cameraPitch + look.y * 0.0018, -0.15, 0.72);
  }
  const joy = input.joystick;
  const forward = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) - (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0) - (joy.active ? joy.y : 0);
  const strafe = (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0) - (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0) + (joy.active ? joy.x : 0);
  const moveLen = Math.hypot(forward, strafe), moving = moveLen > 0.08;
  if (moving) {
    const f = forward / Math.max(1, moveLen), s = strafe / Math.max(1, moveLen);
    const dx = Math.sin(state.cameraYaw) * f + Math.cos(state.cameraYaw) * s;
    const dz = Math.cos(state.cameraYaw) * f - Math.sin(state.cameraYaw) * s;
    const speed = heroDef.speed * (state.dodgeTime > 0 ? 2.8 : 1) * (state.block ? 0.43 : 1);
    state.x += dx * speed * dt; state.z += dz * speed * dt;
    root.rotation.y = Math.atan2(dx, dz);
  }
  state.x = clamp(state.x, -510, 510); state.z = clamp(state.z, -510, 510);
  if ((key('Space') || action('jump')) && state.grounded) { state.jumpV = 6.7; state.grounded = false; }
  if ((key('ShiftLeft') || key('ShiftRight') || action('dodge')) && state.dodgeCd <= 0 && state.stamina >= 18) {
    state.dodgeCd = 0.85; state.dodgeTime = 0.22; state.stamina -= 18; state.invuln = Math.max(state.invuln, 0.35);
    if (!moving) root.rotation.y = state.cameraYaw;
    addBurst(V(state.x, 0.7, state.z), 0x9ceeff, 9, 0.45, 3);
  }
  state.block = input.down('KeyQ') || input.actionDown('block');
  if (key('KeyF') || action('interact')) { if (state.mode === 'dialogue') advanceDialogue(); else if (state.mode === 'playing') interact(); }
  if (state.mode !== 'playing') return;
  if (key('Digit1')) switchHero('kael'); if (key('Digit2')) switchHero('yumi'); if (key('Digit3')) switchHero('aria');
  if (action('switch')) switchHero(state.charId === 'kael' ? 'yumi' : state.charId === 'yumi' ? 'aria' : 'kael');
  if (key('KeyJ') || input.mousePressed(0) || action('attack')) attack('light');
  if (key('KeyK') || input.mousePressed(2) || action('heavy')) attack('heavy');
  if (key('KeyE') || action('ability')) attack('ability');
  if (key('KeyR') || action('ultimate')) attack('ultimate');
  state.jumpV -= 17 * dt; root.position.y = Math.max(0, root.position.y + state.jumpV * dt);
  if (root.position.y <= 0) { root.position.y = 0; state.jumpV = 0; state.grounded = true; }
  state.dodgeTime = Math.max(0, state.dodgeTime - dt);
  state.stamina = Math.min(heroDef.stamina + (state.level - 1) * 4, state.stamina + (state.block ? 2 : 13) * dt);
  state.attackCd = Math.max(0, state.attackCd - dt); state.heavyCd = Math.max(0, state.heavyCd - dt);
  state.abilityCd = Math.max(0, state.abilityCd - dt); state.dodgeCd = Math.max(0, state.dodgeCd - dt);
  state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0;
  state.invuln = Math.max(0, state.invuln - dt); state.attackAnim = Math.max(0, state.attackAnim - dt);
  const gait = moving ? Math.sin(state.elapsed * 11) * 0.62 : Math.sin(state.elapsed * 2.1) * 0.035;
  h.legL.rotation.x = gait; h.legR.rotation.x = -gait;
  h.kneeL.rotation.x = Math.max(0, -gait) * 0.7; h.kneeR.rotation.x = Math.max(0, gait) * 0.7;
  const swing = state.attackAnim > 0 ? Math.sin((1 - state.attackAnim / 0.5) * Math.PI) : 0;
  h.armR.rotation.x = -swing * (state.actionKind === 'heavy' ? 1.8 : 1.15); h.armR.rotation.z = -swing * 0.75;
  h.body.position.y = moving ? Math.abs(gait) * 0.045 : 0;
  if (state.attackAnim <= 0) h.armR.rotation.set(0, 0, 0);
  root.position.x = state.x; root.position.z = state.z;
}
function hurtPlayer(amount) {
  if (state.invuln > 0 || state.mode !== 'playing') return;
  const damage = Math.max(1, amount - heroDef.defense * 0.35) * (state.block ? 0.28 : 1);
  state.hp = Math.max(0, state.hp - damage); state.invuln = 0.55;
  audio.play('hit'); show('damage-layer'); setTimeout(() => show('damage-layer', false), 180); updateHud();
  if (state.hp <= 0) { setMode('death'); show('death-screen'); audio.play('death'); }
}
function updateEnemies(dt) {
  for (const e of gameWorld.enemies) {
    if (e.dead) continue;
    e.cooldown = Math.max(0, e.cooldown - dt);
    const dx = state.x - e.mesh.position.x, dz = state.z - e.mesh.position.z, d = Math.hypot(dx, dz);
    if (d < e.aggro && d > 1.8) {
      e.mesh.position.x += dx / d * Math.min(d - 1.65, (e.type === 'wisp' ? 3.2 : 2.25) * dt);
      e.mesh.position.z += dz / d * Math.min(d - 1.65, (e.type === 'wisp' ? 3.2 : 2.25) * dt);
      e.mesh.rotation.y = Math.atan2(dx, dz);
    } else if (d > e.aggro) {
      const hx = e.homeX - e.mesh.position.x, hz = e.homeZ - e.mesh.position.z, hd = Math.hypot(hx, hz);
      if (hd > 0.3) { e.mesh.position.x += hx / hd * Math.min(hd, dt * 0.55); e.mesh.position.z += hz / hd * Math.min(hd, dt * 0.55); }
    }
    if (d < 2.45 && e.cooldown <= 0) { e.cooldown = e.type === 'elite' ? 1.3 : 1.65; hurtPlayer(e.attack); }
    if (e.rig?.body) e.rig.body.position.y = Math.sin(state.elapsed * 5 + e.homeX) * 0.04;
  }
  const b = state.boss;
  if (!b || b.defeated) return;
  const d = Math.hypot(state.x - b.x, state.z - b.z);
  if (!b.active && d < b.def.arena + 12 && state.quest >= 2) { b.active = true; show('boss-intro'); setText('boss-intro-name', b.def.name); setTimeout(() => show('boss-intro', false), 2800); audio.play('roar'); }
  if (!b.active) return;
  b.cooldown = Math.max(0, b.cooldown - dt); b.phase = b.hp < b.maxHp * 0.5 ? 2 : 1;
  const dx = state.x - b.mesh.position.x, dz = state.z - b.mesh.position.z, length = Math.hypot(dx, dz);
  if (length > 4.1) { b.mesh.position.x += dx / length * 1.25 * dt; b.mesh.position.z += dz / length * 1.25 * dt; b.mesh.rotation.y = Math.atan2(dx, dz); }
  if (length < 5.2 && b.cooldown <= 0) { b.cooldown = b.phase === 2 ? 1.15 : 1.7; hurtPlayer(b.attack * (b.phase === 2 ? 1.25 : 1)); addBurst(V(state.x, 0.8, state.z), 0x9dff9a, 16, 1, 4); }
  if (b.rig.core) { b.rig.core.rotation.y += dt * 1.8; b.rig.core.scale.setScalar(1 + Math.sin(state.elapsed * 4) * 0.08); }
}
function updateCamera(dt) {
  if (!state.hero) return;
  const target = V(state.x, 1.15 + state.hero.rock.position.y, state.z);
  const distance = 8.6, pitch = state.cameraPitch, horizontal = Math.cos(pitch) * distance;
  const desired = V(state.x - Math.sin(state.cameraYaw) * horizontal, target.y + 2.3 + Math.sin(pitch) * distance, state.z - Math.cos(state.cameraYaw) * horizontal);
  camera.position.lerp(desired, 1 - Math.exp(-7 * dt)); camera.lookAt(target);
}
function updateQuestDistance() {
  const target = state.quest <= 1 ? gameWorld.npcs.find(n => n.kind === 'elder') : state.boss;
  const el = $('quest-distance');
  if (el && target) el.textContent = `${Math.round(Math.hypot(target.x - state.x, target.z - state.z))}m`;
}
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05); state.elapsed += dt;
  if (state.mode === 'playing') {
    state.playTime += dt; updatePlayer(dt); updateEnemies(dt); setInteractionTarget();
    state.autosave += dt; if (state.autosave > 35) { state.autosave = 0; saveGame(false); }
    updateQuestDistance(); updateHud();
  } else if (state.mode === 'title' && state.hero) updatePlayer(dt);
  updateCamera(dt); particles.update(dt);
  state.fpsTime += dt; state.fpsFrames++;
  if (state.fpsTime > 0.5) { setText('fps-counter', `${Math.round(state.fpsFrames / state.fpsTime)} FPS`); state.fpsTime = 0; state.fpsFrames = 0; }
  renderer.render(scene, camera); input.endFrame();
}
setTimeout(() => show('loading', false), 450);
frame();

