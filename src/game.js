import {
  clamp, damp, dist, formatTime, angleTo,
} from './utils.js';
import {
  WORLD, ZONES, ZONE_BY_ID, RESOURCE_META, UPGRADES,
  zoneAtY, yToDepth, upgradeCost,
} from './world.js';
import { Player, Particles, createCreatures, updateCreatures, repelCreatures } from './entities.js';
import { Renderer } from './render/index.js';
import { defaultSave, loadSave, writeSave, clearSave } from './save.js';

const KEY_ACTIONS = new Set(['KeyE', 'KeyQ', 'KeyF', 'KeyU', 'Escape', 'Space']);

export class Game {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.audio = audio;
    this.renderer = new Renderer(canvas);
    this.save = loadSave() || defaultSave();
    this.player = new Player();
    this.world = null;
    this.creatures = [];
    this.particles = new Particles();
    this.effects = [];
    this.camera = { x: WORLD.baseX, y: 420 };
    this.state = 'menu';
    this.time = 0;
    this.zone = ZONES[0];
    this.input = { x: 0, y: 0, boost: false };
    this.joystick = { x: 0, y: 0 };
    this.mobileBoost = false;
    this.keys = {};
    this.nearestInteract = null;
    this.pulseCooldown = 0;
    this.sonarCooldown = 0;
    this.autosave = 0;
    this.uiTimer = 0;
    this.shake = 0;
    this.pressureWarning = false;
    this.surfaceAir = false;
    this.inVent = false;
    this.lowO2Warned = false;
    this.lowHullWarned = false;
    this.pressureWarned = new Set();
    this.ventBubbleTimer = 0;
    this.deathInfo = null;
    this.ui = null;
    this.sessionStart = 0;
    this.menuTime = 0;
    this.completedToast = false;
    this.init();
  }

  init() {
    this.world = this.world || null;
    // createWorld is deterministic, but import lazily to keep constructor order clear.
    this.world = this.createWorld();
    this.player.applyUpgrades(this.save.upgrades);
    const p = this.save.player || { x: WORLD.baseX, y: 280, oxygen: this.player.maxOxygen, hull: this.player.maxHull };
    this.player.placeAt(
      clamp(p.x || WORLD.baseX, 80, WORLD.width - 80),
      clamp(p.y || 280, 40, WORLD.height - 120),
      p.oxygen || this.player.maxOxygen,
      p.hull || this.player.maxHull,
    );
    this.zone = zoneAtY(this.player.y);
    this.creatures = createCreatures(this.world);
    this.camera.x = clamp(this.player.x, this.renderer.viewW / 2, WORLD.width - this.renderer.viewW / 2);
    this.camera.y = clamp(this.player.y, this.renderer.viewH / 2 - 260, WORLD.height - this.renderer.viewH / 2);
    this.bindInput();
    window.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.persist();
    });
    window.addEventListener('beforeunload', () => {
      if (this.save.started) this.persist();
    });
  }

  createWorld() {
    // Imported here via a dynamic require-like static reference keeps the build simple.
    return createWorldCached();
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (KEY_ACTIONS.has(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.keys[e.code] = true;
      if (e.repeat) return;
      if (this.state === 'playing') {
        if (e.code === 'KeyE') this.interact();
        else if (e.code === 'KeyQ' || e.code === 'Space') this.pulse();
        else if (e.code === 'KeyF') this.sonarPing();
        else if (e.code === 'KeyU') this.openUpgrades();
        else if (e.code === 'Escape') this.pause();
      } else if (this.state === 'paused') {
        if (e.code === 'Escape') this.resume();
      } else if (this.state === 'upgrades') {
        if (e.code === 'Escape' || e.code === 'KeyU') this.closeUpgrades();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    window.addEventListener('blur', () => {
      this.keys = {};
      this.mobileBoost = false;
      this.joystick = { x: 0, y: 0 };
    });
  }

  setJoystick(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  setMobileBoost(v) {
    this.mobileBoost = !!v;
  }

  showMenu() {
    this.state = 'menu';
    this.menuTime = 0;
    this.nearestInteract = null;
    this.ui.showMenu(this.save);
  }

  startDive(resume = true) {
    this.audio.init();
    this.audio.setMuted(this.save.muted);
    this.player.applyUpgrades(this.save.upgrades);

    if (this.save.started && resume) {
      const p = this.save.player || {};
      const x = clamp(p.x || WORLD.baseX, 80, WORLD.width - 80);
      const y = clamp(p.y || 280, 40, WORLD.height - 120);
      this.player.placeAt(x, y, p.oxygen || this.player.maxOxygen, p.hull || this.player.maxHull);
    } else {
      this.player.placeAt(WORLD.baseX, 280, this.player.maxOxygen, this.player.maxHull);
      this.save.started = true;
      this.save.player = { x: WORLD.baseX, y: 280, oxygen: this.player.maxOxygen, hull: this.player.maxHull };
      this.save.stats.dives = (this.save.stats.dives || 0) + 1;
    }

    if (this.player.hull <= 0 || this.player.oxygen <= 0) {
      this.player.placeAt(WORLD.baseX, 280, this.player.maxOxygen, this.player.maxHull);
    }

    this.zone = zoneAtY(this.player.y);
    if (!this.save.discoveredZones.includes(this.zone.id)) this.save.discoveredZones.push(this.zone.id);
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.state = 'playing';
    this.sessionStart = performance.now();
    this.lowO2Warned = false;
    this.lowHullWarned = false;
    this.pressureWarned.clear();
    this.nearestInteract = null;
    this.ui.showGame(this);
    this.ui.updateHUD(this, true);
    this.persist();
    this.audio.zone();
    this.ui.toast('Dive commenced. Keep an eye on your oxygen.', { icon: 'info' });
    if (this.save.relics.length >= 3 && !this.save.completed) {
      this.ui.toast('All relic shards aboard. Return to the Aurora at the surface.', { icon: 'relic', tone: 'gold' });
    }
  }

  newExpedition() {
    clearSave();
    this.save = defaultSave();
    this.save.started = true;
    this.save.stats.dives = 1;
    this.player.applyUpgrades(this.save.upgrades);
    this.player.placeAt(WORLD.baseX, 280, this.player.maxOxygen, this.player.maxHull);
    this.creatures = createCreatures(this.world);
    this.particles.items.length = 0;
    this.effects.length = 0;
    this.zone = ZONES[0];
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.lowO2Warned = false;
    this.lowHullWarned = false;
    this.pressureWarned.clear();
    this.state = 'playing';
    this.ui.showGame(this);
    this.ui.updateHUD(this, true);
    this.persist();
    this.audio.init();
    this.audio.setMuted(this.save.muted);
    this.audio.zone();
    this.ui.toast('New expedition logged. The Aurora is waiting.', { icon: 'info' });
  }

  resume() {
    if (this.state !== 'paused' && this.state !== 'upgrades') return;
    this.state = 'playing';
    this.ui.hideScreens();
    this.ui.updateHUD(this, true);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.persist();
    this.ui.openPause(this);
  }

  openUpgrades() {
    if (this.state === 'menu' || this.state === 'dead' || this.state === 'victory') return;
    this.state = 'upgrades';
    this.ui.openUpgrades(this);
  }

  closeUpgrades() {
    if (this.state !== 'upgrades') return;
    this.state = 'playing';
    this.ui.hideScreens();
    this.ui.updateHUD(this, true);
  }

  buyUpgrade(id) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const lvl = this.save.upgrades[id] || 0;
    if (lvl >= def.max) return;
    const cost = def.cost(lvl);
    if (!cost) return;
    for (const [res, amount] of Object.entries(cost)) {
      if ((this.save.resources[res] || 0) < amount) return;
    }
    for (const [res, amount] of Object.entries(cost)) this.save.resources[res] -= amount;
    this.save.upgrades[id] = lvl + 1;
    this.player.applyUpgrades(this.save.upgrades);
    if (id === 'hull') this.player.hull = Math.min(this.player.maxHull, this.player.hull + 25);
    this.audio.upgrade();
    this.ui.toast(`${def.name} upgraded to Mk.${lvl + 1}.`, { icon: 'upgrade', tone: 'gold' });
    this.ui.refreshUpgrades(this);
    this.ui.updateHUD(this, true);
    this.persist();
  }

  returnToMenu() {
    this.persist();
    this.state = 'menu';
    this.ui.showMenu(this.save);
    this.audio.setMuted(this.save.muted);
  }

  resetToMenu() {
    clearSave();
    this.save = defaultSave();
    this.player.applyUpgrades(this.save.upgrades);
    this.player.placeAt(WORLD.baseX, 280, this.player.maxOxygen, this.player.maxHull);
    this.creatures = createCreatures(this.world);
    this.particles.items.length = 0;
    this.effects.length = 0;
    this.zone = ZONES[0];
    this.camera.x = WORLD.baseX;
    this.camera.y = 470;
    this.state = 'menu';
    this.ui.showMenu(this.save);
  }

  toggleMute() {
    this.save.muted = !this.save.muted;
    this.audio.setMuted(this.save.muted);
    this.ui.setMuted(this.save.muted);
    this.persist();
  }

  getInput() {
    let x = 0;
    let y = 0;
    if (this.keys.KeyA || this.keys.ArrowLeft) x -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) x += 1;
    if (this.keys.KeyW || this.keys.ArrowUp) y -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) y += 1;
    if (Math.abs(this.joystick.x) > 0.08 || Math.abs(this.joystick.y) > 0.08) {
      x = this.joystick.x;
      y = this.joystick.y;
    }
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return {
      x,
      y,
      boost: !!(this.keys.ShiftLeft || this.keys.ShiftRight || this.mobileBoost),
    };
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'menu') {
      this.updateMenu(dt);
      return;
    }
    if (this.state !== 'playing') {
      this.updateEffects(dt);
      this.particles.update(dt);
      this.shake = damp(this.shake, 0, 6, dt);
      return;
    }

    const input = this.getInput();
    this.player.update(dt, input, this.world, this);

    this.updateOxygen(dt, input);
    if (this.state !== 'playing') return;
    this.updatePressure(dt);
    if (this.state !== 'playing') return;
    this.updateVents(dt);
    this.updateCreatures(dt);
    this.updateSchools(dt);
    this.updatePickups();
    this.updateEffects(dt);
    this.particles.update(dt);
    this.updateCooldowns(dt);
    this.updateCamera(dt);
    this.updateZone();

    this.save.stats.time += dt;
    this.save.stats.maxDepth = Math.max(this.save.stats.maxDepth || 0, yToDepth(this.player.y));

    this.autosave += dt;
    if (this.autosave > 5) {
      this.autosave = 0;
      this.persist();
    }

    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.uiTimer = 0.075;
      this.ui.updateHUD(this);
    }

    if (this.player.hull <= 0 && this.state === 'playing') this.die();
    this.checkVictory();
  }

  updateMenu(dt) {
    this.menuTime += dt;
    this.time += 0;
    this.camera.x = WORLD.baseX + Math.sin(this.menuTime * 0.055) * 280;
    this.camera.y = 470 + Math.sin(this.menuTime * 0.08) * 130;
    this.particles.update(dt);
    if (Math.random() < dt * 2.2) {
      this.particles.bubble(
        this.camera.x + (Math.random() - 0.5) * 700,
        this.camera.y + (Math.random() - 0.5) * 500,
        { size: Math.random() * 3 + 1, rise: 20 + Math.random() * 50, life: 2 + Math.random() * 3 },
      );
    }
    this.shake = damp(this.shake, 0, 6, dt);
  }

  updateOxygen(dt, input) {
    const p = this.player;
    const zone = this.zone;
    this.surfaceAir = p.y < 120;
    this.inVent = false;
    let ventRefill = false;
    for (const vent of this.world.vents) {
      if (Math.abs(p.x - vent.x) < 108 && p.y > vent.y - 540 && p.y < vent.y + 70) {
        this.inVent = true;
        ventRefill = true;
        break;
      }
    }
    if (this.surfaceAir) {
      p.oxygen = Math.min(p.maxOxygen, p.oxygen + 28 * dt);
    } else if (ventRefill) {
      p.oxygen = Math.min(p.maxOxygen, p.oxygen + 19 * dt);
    } else {
      const depthPenalty = 1 + clamp((p.y - zone.y0) / 9000, 0, 0.25);
      const boostDrain = p.boosting ? 1.65 : 0;
      p.oxygen = Math.max(0, p.oxygen - (zone.drain * depthPenalty + boostDrain) * dt);
    }

    if (p.oxygen <= 0) {
      this.environmentDamage(4.6 * dt, 'oxygen starvation');
      if (!this.lowO2Warned) {
        this.lowO2Warned = true;
        this.ui.toast('Oxygen depleted. Hull is taking damage.', { icon: 'danger', tone: 'danger' });
      }
    } else if (p.oxygen < 24 && !this.lowO2Warned) {
      this.lowO2Warned = true;
      this.ui.toast('Low oxygen. Surface or find a bubble vent.', { icon: 'oxygen', tone: 'danger' });
      this.audio.tone(220, 0.25, 'square', 0.03, 80);
    } else if (p.oxygen > 40) {
      this.lowO2Warned = false;
    }
  }

  updatePressure(dt) {
    const deficit = Math.max(0, this.zone.pressure - this.player.hullLevel);
    if (deficit > 0) {
      this.pressureWarning = true;
      this.environmentDamage(1.75 * deficit * dt, 'pressure');
      if (!this.pressureWarned.has(this.zone.id)) {
        this.pressureWarned.add(this.zone.id);
        this.ui.toast(`Pressure exceeds hull rating in ${this.zone.name}. Upgrade hull plating or ascend.`, { icon: 'danger', tone: 'danger' });
        this.audio.tone(70, 0.7, 'sine', 0.05, -20);
      }
    } else {
      this.pressureWarning = false;
    }
    if (this.player.hull < this.player.maxHull * 0.28 && !this.lowHullWarned) {
      this.lowHullWarned = true;
      this.ui.toast('Hull integrity critical. Find a repair kit or return to the Aurora.', { icon: 'danger', tone: 'danger' });
    }
    if (this.player.hull > this.player.maxHull * 0.45) this.lowHullWarned = false;
  }

  updateVents(dt) {
    this.ventBubbleTimer -= dt;
    if (this.ventBubbleTimer > 0) return;
    this.ventBubbleTimer = 0.2;
    for (const vent of this.world.vents) {
      if (Math.abs(vent.x - this.player.x) > 1800 || Math.abs(vent.y - this.player.y) > 1300) continue;
      this.particles.bubble(
        vent.x + (Math.random() - 0.5) * 60,
        vent.y - Math.random() * 180,
        { size: 2 + Math.random() * 4, rise: 28 + Math.random() * 40, life: 2.5 + Math.random() * 2, alpha: 0.55 },
      );
    }
  }

  updateCreatures(dt) {
    updateCreatures(this.creatures, this.player, dt, this);
  }

  updateSchools(dt) {
    for (const s of this.world.schools) {
      const d = dist(s.x, s.y, this.player.x, this.player.y);
      let speed = s.speed;
      if (d < 250) {
        s.dir = this.player.x < s.x ? 1 : -1;
        speed = s.speed * 2.4;
        s.y += (s.y > this.player.y ? 1 : -1) * 24 * dt;
      }
      s.x += s.dir * speed * dt;
      s.y += Math.sin(this.time * 0.8 + s.phase) * 3 * dt;
      const zone = ZONE_BY_ID[s.zone] || ZONES[0];
      s.y = clamp(s.y, zone.y0 + 90, zone.y1 - 90);
      if (s.x < 100) {
        s.x = 100;
        s.dir = 1;
      } else if (s.x > WORLD.width - 100) {
        s.x = WORLD.width - 100;
        s.dir = -1;
      }
    }
  }

  updatePickups() {
    let best = null;
    let bestD = Infinity;
    const p = this.player;
    const consider = (kind, obj, radius) => {
      const d = dist(p.x, p.y, obj.x, obj.y);
      if (d < radius && d < bestD) {
        bestD = d;
        best = { kind, id: obj.id, x: obj.x, y: obj.y, data: obj };
      }
    };
    for (const node of this.world.nodes) {
      if (this.save.collectedNodes.includes(node.id)) continue;
      consider('node', node, 82);
    }
    for (const chest of this.world.chests) {
      if (this.save.openedChests.includes(chest.id)) continue;
      consider('chest', chest, 106);
    }
    for (const relic of this.world.relics) {
      if (this.save.relics.includes(relic.id)) continue;
      consider('relic', relic, 108);
    }
    if (!this.save.leviathanPearl) consider('pearl', this.world.leviathanPearl, 118);
    this.nearestInteract = best;
    this.ui.updatePrompt(this);
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.life <= 0) this.effects.splice(i, 1);
    }
    this.shake = damp(this.shake, 0, 6, dt);
  }

  updateCooldowns(dt) {
    this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
    this.sonarCooldown = Math.max(0, this.sonarCooldown - dt);
  }

  updateCamera(dt) {
    const leadX = clamp(this.player.vx * 0.32, -150, 150);
    const leadY = clamp(this.player.vy * 0.22, -100, 100);
    const halfW = this.renderer.viewW / 2;
    const halfH = this.renderer.viewH / 2;
    const minX = Math.min(halfW, WORLD.width / 2);
    const maxX = Math.max(WORLD.width - halfW, WORLD.width / 2);
    const minY = halfH - 280;
    const maxY = WORLD.height - halfH;
    const tx = clamp(this.player.x + leadX, minX, maxX);
    const ty = clamp(this.player.y + leadY, minY, maxY);
    this.camera.x = damp(this.camera.x, tx, 3.6, dt);
    this.camera.y = damp(this.camera.y, ty, 3.4, dt);
  }

  updateZone() {
    const zone = zoneAtY(this.player.y);
    if (zone.id !== this.zone.id) {
      this.zone = zone;
      const newDiscovery = !this.save.discoveredZones.includes(zone.id);
      if (newDiscovery) {
        this.save.discoveredZones.push(zone.id);
        this.ui.toast(`${zone.name} — ${zone.desc}`, { icon: 'zone', tone: 'gold' });
        this.persist();
      } else {
        this.ui.toast(`Entering ${zone.name}.`, { icon: 'zone' });
      }
      this.audio.zone();
      this.ui.updateHUD(this, true);
    }
  }

  checkVictory() {
    if (this.state !== 'playing') return;
    if (this.save.relics.length < 3 || this.save.completed) return;
    if (this.player.y < 170 && dist(this.player.x, this.player.y, WORLD.baseX, 90) < 520) {
      this.save.completed = true;
      this.save.stats.maxDepth = Math.max(this.save.stats.maxDepth, yToDepth(this.player.y));
      this.state = 'victory';
      this.persist();
      this.audio.victory();
      this.ui.showVictory(this);
    }
  }

  interact() {
    if (this.state !== 'playing') return;
    const target = this.nearestInteract;
    if (!target) return;
    if (target.kind === 'node') {
      const node = target.data;
      this.save.collectedNodes.push(node.id);
      if (node.type === 'repair') {
        this.player.hull = Math.min(this.player.maxHull, this.player.hull + 38);
        this.ui.toast('Repair kit installed — hull +38.', { icon: 'repair', tone: 'gold' });
      } else {
        this.addResource(node.type, node.amount);
        this.ui.toast(`+${node.amount} ${RESOURCE_META[node.type].name}`, { icon: node.type });
      }
      this.particles.burst(node.x, node.y, RESOURCE_META[node.type].glow, 14, 120);
      this.effects.push({ type: 'pickup', x: node.x, y: node.y, life: 0.6, maxLife: 0.6, color: RESOURCE_META[node.type].glow });
      this.audio.collect(node.type);
      this.nearestInteract = null;
      this.ui.updateHUD(this, true);
      this.persist();
    } else if (target.kind === 'chest') {
      const chest = target.data;
      this.save.openedChests.push(chest.id);
      const loot = chest.loot;
      for (const [res, amount] of Object.entries(loot)) if (amount > 0) this.addResource(res, amount, true);
      this.save.stats.chests = (this.save.stats.chests || 0) + 1;
      const bits = [];
      if (loot.scrap) bits.push(`${loot.scrap} salvage`);
      if (loot.pearl) bits.push(`${loot.pearl} pearls`);
      if (loot.crystal) bits.push(`${loot.crystal} crystals`);
      this.ui.toast(`${chest.label ? chest.label + ' — ' : ''}supply chest: ${bits.join(', ')}`, { icon: 'chest', tone: 'gold' });
      this.particles.burst(chest.x, chest.y, '#ffd08a', 24, 180);
      this.effects.push({ type: 'pickup', x: chest.x, y: chest.y, life: 0.8, maxLife: 0.8, color: '#ffd08a' });
      this.audio.chest();
      this.nearestInteract = null;
      this.ui.updateHUD(this, true);
      this.persist();
    } else if (target.kind === 'relic') {
      const relic = target.data;
      if (this.save.relics.includes(relic.id)) return;
      this.save.relics.push(relic.id);
      this.particles.burst(relic.x, relic.y, '#ffe2a4', 34, 240);
      this.effects.push({ type: 'pickup', x: relic.x, y: relic.y, life: 1.2, maxLife: 1.2, color: '#ffe2a4' });
      this.audio.relic();
      this.shake = 8;
      const count = this.save.relics.length;
      this.ui.toast(`${relic.name} recovered — ${count} / 3. ${relic.lore}`, { icon: 'relic', tone: 'gold' });
      if (count >= 3) {
        this.ui.toast('All three relic shards are aboard. Return to the Aurora at the surface.', { icon: 'relic', tone: 'gold' });
      }
      this.nearestInteract = null;
      this.ui.updateHUD(this, true);
      this.persist();
    } else if (target.kind === 'pearl') {
      this.save.leviathanPearl = true;
      this.addResource('crystal', 15, true);
      this.addResource('pearl', 10, true);
      this.addResource('scrap', 10, true);
      this.particles.burst(target.x, target.y, '#ffe8b8', 42, 260);
      this.audio.victory();
      this.shake = 10;
      this.ui.toast('The Leviathan Pearl is yours. A legendary find.', { icon: 'relic', tone: 'gold' });
      this.nearestInteract = null;
      this.ui.updateHUD(this, true);
      this.persist();
    }
  }

  addResource(type, amount, silent = false) {
    if (!RESOURCE_META[type] || type === 'repair') return;
    this.save.resources[type] = (this.save.resources[type] || 0) + amount;
    this.save.stats[type] = (this.save.stats[type] || 0) + amount;
    this.save.stats.nodes = (this.save.stats.nodes || 0) + 1;
    if (!silent) this.ui.updateHUD(this, true);
  }

  pulse() {
    if (this.state !== 'playing' || this.pulseCooldown > 0) return;
    const lvl = this.save.upgrades.pulse || 0;
    const radius = 260 + lvl * 45;
    this.pulseCooldown = 9 - lvl * 1.2;
    this.effects.push({ type: 'pulse', x: this.player.x, y: this.player.y, radius, life: 0.85, maxLife: 0.85 });
    repelCreatures(this.creatures, this.player.x, this.player.y, radius, this.player);
    this.particles.burst(this.player.x, this.player.y, '#aefcff', 26, 260);
    this.shake = 6;
    this.audio.pulse();
    this.ui.updateHUD(this, true);
  }

  sonarPing() {
    if (this.state !== 'playing' || this.sonarCooldown > 0) return;
    this.sonarCooldown = 14;
    this.effects.push({ type: 'sonar', x: this.player.x, y: this.player.y, radius: 1900, life: 1.7, maxLife: 1.7 });
    this.audio.sonar();
    let found = null;
    let best = Infinity;
    for (const relic of this.world.relics) {
      if (this.save.relics.includes(relic.id)) continue;
      const d = dist(this.player.x, this.player.y, relic.x, relic.y);
      if (d < 2200 && d < best) {
        best = d;
        found = relic;
      }
    }
    if (found) {
      const dx = found.x - this.player.x;
      const dy = found.y - this.player.y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'below' : 'above');
      this.ui.toast(`Relic signature detected ${dir} — ${Math.round(best / 10)} m.`, { icon: 'sonar', tone: 'gold' });
    } else {
      this.ui.toast('Sonar sweep complete. No relic signature in range.', { icon: 'sonar' });
    }
    this.ui.updateHUD(this, true);
  }

  damage(amount, source) {
    if (this.state !== 'playing' || this.player.invuln > 0) return;
    this.player.hull = Math.max(0, this.player.hull - amount);
    this.player.invuln = 1.15;
    this.player.hitFlash = 0.55;
    this.shake = Math.min(14, 5 + amount * 0.45);
    this.particles.damage(this.player.x, this.player.y);
    this.audio.damage();
    this.ui.flashDamage();
    this.ui.updateHUD(this, true);
    if (this.player.hull <= 0) this.die();
  }

  environmentDamage(amount, source) {
    if (this.state !== 'playing') return;
    this.player.hull = Math.max(0, this.player.hull - amount);
    if (amount > 0.12) this.player.hitFlash = Math.max(this.player.hitFlash, Math.min(0.35, amount * 0.15));
    if (this.player.hull <= 0) this.die();
  }

  die() {
    if (this.state !== 'playing') return;
    this.state = 'dead';
    this.save.stats.deaths = (this.save.stats.deaths || 0) + 1;
    const lost = {};
    for (const key of ['scrap', 'pearl', 'crystal']) {
      const amount = Math.floor((this.save.resources[key] || 0) * 0.2);
      if (amount > 0) {
        lost[key] = amount;
        this.save.resources[key] -= amount;
      }
    }
    this.deathInfo = {
      depth: Math.round(yToDepth(this.player.y)),
      zone: this.zone.name,
      lost,
    };
    this.save.player = { x: WORLD.baseX, y: 280, oxygen: this.player.maxOxygen, hull: this.player.maxHull };
    this.player.hitFlash = 0;
    this.audio.death();
    this.shake = 18;
    this.ui.showDeath(this);
    this.persist();
  }

  respawn() {
    this.player.placeAt(WORLD.baseX, 280, this.player.maxOxygen, this.player.maxHull);
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.zone = ZONES[0];
    this.state = 'playing';
    this.lowO2Warned = false;
    this.lowHullWarned = false;
    this.pressureWarned.clear();
    this.save.stats.dives = (this.save.stats.dives || 0) + 1;
    this.save.player = { x: WORLD.baseX, y: 280, oxygen: this.player.maxOxygen, hull: this.player.maxHull };
    this.ui.showGame(this);
    this.ui.updateHUD(this, true);
    this.ui.toast('Escape pod recovered. The Aurora patched you up.', { icon: 'repair', tone: 'gold' });
    this.audio.zone();
    this.persist();
  }

  continueAfterVictory() {
    this.state = 'playing';
    this.ui.showGame(this);
    this.ui.updateHUD(this, true);
    this.ui.toast('Free exploration enabled. The deep is still open.', { icon: 'info' });
  }

  persist() {
    if (!this.save.started) return;
    if (this.state !== 'dead') {
      this.save.player = {
        x: this.player.x,
        y: this.player.y,
        oxygen: this.player.oxygen,
        hull: this.player.hull,
      };
    }
    this.save.stats.maxDepth = Math.max(this.save.stats.maxDepth || 0, yToDepth(this.player.y));
    writeSave(this.save);
  }

  getObjective() {
    if (this.save.completed) return 'Expedition complete. Explore freely.';
    if (this.save.relics.length >= 3) return 'Return to the Aurora at the surface to complete the expedition.';
    if (this.save.relics.length === 2) return 'One relic shard remains. Sonar pings can locate the last signature.';
    if (this.save.relics.length === 1) return 'Two relic shards remain. Descend deeper and scan for signatures.';
    return 'Recover the three lost relic shards from the deep zones.';
  }

  getPrompt() {
    const t = this.nearestInteract;
    if (!t) return null;
    if (t.kind === 'node') {
      if (t.data.type === 'repair') return 'Install repair kit';
      return `Collect ${RESOURCE_META[t.data.type].name} ×${t.data.amount}`;
    }
    if (t.kind === 'chest') return t.data.label ? `Open ${t.data.label}` : 'Open supply chest';
    if (t.kind === 'relic') return `Recover ${t.data.name}`;
    if (t.kind === 'pearl') return 'Take the Leviathan Pearl';
    return null;
  }

  render(dt) {
    this.renderer.render(this, dt);
  }
}

// Keep a single deterministic world instance per page.
let cachedWorld = null;
function createWorldCached() {
  if (!cachedWorld) {
    // eslint-disable-next-line global-require
    cachedWorld = createWorldImport();
  }
  return cachedWorld;
}

import { createWorld as createWorldImport } from './world.js';
