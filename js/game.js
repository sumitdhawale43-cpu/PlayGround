/* ============================================================
   LAST KINGDOM – core game logic, rendering and states
   (loaded after js/data.js and js/engine.js)
   ============================================================ */
(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = WORLD.W;
  const H = WORLD.H;
  const CELL = 40;

  let DPR = 1;
  let lastTime = 0;
  let rafId = 0;

  /* ============================ STATE ============================ */
  const state = {
    screen: "menu", // menu | playing | between | victory | defeat
    mapKey: "fords",
    map: MAPS.fords,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    gold: WORLD.GOLD_START,
    wave: 0,
    maxWave: WORLD.MAX_WAVES,
    baseHp: WORLD.BASE_HP,
    kills: 0,
    startTime: 0,
    waveTimer: 0,
    spawnQueue: [],
    selectedTowerType: null,
    message: "",
    messageT: 0,
    upgradesBought: { archer: 0, spear: 0, mage: 0, ballista: 0 },
    stats: { wavesCleared: 0, kills: 0, goldEarned: 0, timeMs: 0 },
  };

  let nextId = 1;

  /* ============================ HELPERS ============================ */
  function dist(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function distTo(e, o) { return dist(e.x, e.y, o.x, o.y); }
  function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }

  function findEnemy(id) {
    for (const e of state.enemies) if (e.id === id) return e;
    return null;
  }

  function findTower(id) {
    for (const t of state.towers) if (t.id === id) return t;
    return null;
  }

  /* ============================ TOWER STATS ============================ */
  function towerStats(t) {
    const base = TOWER_TYPES[t.type];
    let dmg = base.damage, range = base.range, fireRate = base.fireRate, windup = 0.3;
    if (t.level >= 2) { dmg *= 1.5; range *= 1.15; }
    if (t.level >= 3) { dmg *= 1.5; range *= 1.15; fireRate *= 1.35; }
    if (base.projectile === null) windup = 0.25;
    else if (t.type === "ballista") windup = 1.0;
    return { dmg, range, fireRate, windup, radius: base.radius };
  }

  function projectileSpeed(kind) {
    if (kind === "arrow") return 330;
    if (kind === "fire") return 280;
    return 250; // bolt
  }

  /* ============================ WAVES ============================ */
  function buildWave(wave) {
    const out = [];
    const s = 1 + (wave - 1) * 0.14;
    const push = (typeKey, count, hpMul, dmgMul, goldMul) => {
      const t = ENEMY_TYPES[typeKey];
      for (let i = 0; i < count; i++) {
        out.push({
          type: typeKey,
          boss: typeKey === "boss",
          hp: Math.round(t.hp * s * hpMul),
          speed: t.speed,
          dmg: Math.max(1, Math.round(t.dmg * dmgMul)),
          gold: Math.max(1, Math.round(t.gold * goldMul * (1 + (wave - 1) * 0.1))),
          radius: t.radius,
          color: t.color,
          dark: t.dark,
          path: [],
        });
      }
    };
    const bossWave = BOSS_WAVES.indexOf(wave) >= 0;
    if (bossWave) {
      const bossHpMul = 1 + (wave - 5) * 0.6;
      push("boss", 1, bossHpMul, 1, 5);
      push("militia", Math.round(1.5 + (wave - 3) * 0.7), 1, 1, 1);
      push("spearman", Math.round(0.8 + (wave - 3) * 0.5), 1, 1, 1);
    } else {
      push("militia", Math.round((2 + wave * 1.8) * s), 1, 1, 1);
      push("spearman", Math.round(wave * 1.05 * s), 1, 1, 1);
      push("knight", Math.round(wave * 0.5 * s), 1, 1, 1);
      push("brute", wave >= 7 ? wave - 6 : 0, 1, 1, 1);
    }
    let cost = 0;
    for (const e of out) cost += e.gold;
    return { queue: out, cost: Math.max(20, Math.round(cost * 0.85)) };
  }

  function startWave(w) {
    const built = buildWave(w);
    state.wave = w;
    state.spawnQueue = built.queue;
    state.waveTimer = 0;
    state.screen = "playing";
    document.getElementById("treasury-next").textContent = w + 1;
    showScreen("playing");
  }

  function startGame(mapKey) {
    state.mapKey = mapKey;
    state.map = MAPS[mapKey] || MAPS.fords;
    state.towers = [];
    state.enemies = [];
    state.projectiles = [];
    state.particles = [];
    state.gold = WORLD.GOLD_START;
    state.wave = 0;
    state.baseHp = WORLD.BASE_HP;
    state.kills = 0;
    state.startTime = performance.now();
    state.waveTimer = 0;
    state.spawnQueue = [];
    state.selectedTowerType = null;
    state.message = "";
    state.messageT = 0;
    state.stats = { wavesCleared: 0, kills: 0, goldEarned: 0, timeMs: 0 };
    for (const k of Object.keys(state.upgradesBought)) state.upgradesBought[k] = 0;
    startWave(1);
    updateTowerBar();
    showScreen("playing");
  }

  function spawnEnemy(tpl) {
    const first = state.map.path && state.map.path.length ? state.map.path[0] : [240, 540];
    const e = {
      id: nextId++,
      type: tpl.type,
      boss: tpl.boss,
      x: first[0],
      y: first[1],
      hp: tpl.hp,
      maxHp: tpl.hp,
      speed: tpl.speed,
      dmg: tpl.dmg,
      gold: tpl.gold,
      radius: tpl.radius,
      color: tpl.color,
      dark: tpl.dark,
      path: (state.map.path || []).map((p) => ({ x: p[0], y: p[1] })),
      wi: 0,
      rage: false,
      flash: 0,
    };
    state.enemies.push(e);
    state.waveTimer = tpl.boss ? 2.6 : 0.8;
  }

  /* ============================ COMBAT ============================ */
  function doDamage(t, e) {
    const dmg = towerStats(t).dmg;
    e.hp -= dmg;
    e.flash = 0.12;
    if (e.hp <= 0) killEnemy(t, e);
  }

  function killEnemy(tower, e) {
    state.kills++;
    state.stats.kills++;
    const reward = e.boss ? Math.round(e.gold * 5) : e.gold;
    state.gold += reward;
    state.stats.goldEarned += reward;
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 140;
      state.particles.push({
        x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.4 + Math.random() * 0.4, max: 0.8, color: e.color, size: 2 + Math.random() * 3,
      });
    }
    state.enemies = state.enemies.filter((x) => x !== e);
  }

  function findTarget(t) {
    const ts = towerStats(t);
    let best = null, bestD = Infinity;
    for (const e of state.enemies) {
      const d = distTo(e, t);
      if (d <= ts.range) {
        if (d < bestD) { bestD = d; best = e; }
      }
    }
    return best;
  }

  /* ============================ END CONDITIONS ============================ */
  function checkEndConditions() {
    if (state.enemies.length === 0 && state.spawnQueue.length === 0) {
      state.stats.wavesCleared++;
      if (state.wave >= state.maxWave) {
        state.screen = "victory";
        state.stats.timeMs = performance.now() - state.startTime;
        document.getElementById("v-stats-waves").textContent = state.stats.wavesCleared;
        document.getElementById("v-stats-kills").textContent = state.stats.kills;
        document.getElementById("v-stats-gold").textContent = state.stats.goldEarned;
        document.getElementById("v-stats-time").textContent = Math.round(state.stats.timeMs / 1000) + "s";
      } else {
        state.screen = "between";
        document.getElementById("treasury-wave").textContent = state.wave;
        document.getElementById("treasury-next").textContent = state.wave + 1;
        document.getElementById("treasury-gold").textContent = state.gold;
      }
      renderUpgradeList();
      showScreen(state.screen);
    }
    if (state.baseHp <= 0) {
      state.screen = "defeat";
      state.stats.timeMs = performance.now() - state.startTime;
      document.getElementById("d-stats-waves").textContent = state.stats.wavesCleared;
      document.getElementById("d-stats-kills").textContent = state.stats.kills;
      document.getElementById("d-stats-gold").textContent = state.stats.goldEarned;
      document.getElementById("d-stats-time").textContent = Math.round(state.stats.timeMs / 1000) + "s";
      showScreen("defeat");
    }
  }

  function showScreen(name) {
    document.getElementById("menu-screen").classList.toggle("hidden", name !== "menu");
    document.getElementById("treasury-screen").classList.toggle("hidden", name !== "between");
    document.getElementById("victory-screen").classList.toggle("hidden", name !== "victory");
    document.getElementById("defeat-screen").classList.toggle("hidden", name !== "defeat");
    const bar = document.getElementById("tower-bar");
    if (name === "playing") bar.classList.remove("hidden");
    else bar.classList.add("hidden");
  }

  function updateTowerBar() {
    document.querySelectorAll(".tower-btn").forEach((btn) => {
      const type = btn.getAttribute("data-type");
      const placed = state.towers.filter((x) => x.type === type);
      const lvl = placed.length
        ? Math.max(...placed.map((x) => x.level))
        : Math.min(3, 1 + (state.upgradesBought[type] || 0));
      btn.querySelector(".tlevel").textContent = "Lv. " + lvl;
    });
  }

  /* ============================ MESSAGES ============================ */
  function setMessage(m) {
    state.message = m;
    state.messageT = 2.2;
  }

  /* ============================ INPUT ============================ */
  function pointerToWorld(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    return { x, y };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const p = pointerToWorld(e);
    if (state.screen !== "playing" || !state.selectedTowerType) return;
    const cx = Math.floor(p.x / CELL);
    const cy = Math.floor(p.y / CELL);
    const gx = cx * CELL + CELL / 2;
    const gy = cy * CELL + CELL / 2;
    if (cx < 0 || cx > 10 || cy < 0 || cy > 14) { setMessage("Out of bounds"); return; }
    for (const t of state.towers) {
      if (t.x === gx && t.y === gy) { setMessage("An iron fist already guards this spot"); return; }
    }
    const type = state.selectedTowerType;
    const cost = TOWER_TYPES[type].cost;
    if (state.gold < cost) { setMessage("Not enough gold — survive the wave!"); return; }
    state.gold -= cost;
    state.towers.push({
      id: nextId++, type, x: gx, y: gy,
      level: Math.min(3, 1 + (state.upgradesBought[type] || 0)),
      state: "idle", cooldown: 0, targetId: null, animT: 0, animDur: 0,
      armAng: -Math.PI / 2, swingAng: -Math.PI / 2,
    });
    updateTowerBar();
    setMessage(TOWER_TYPES[type].name + " set down in the kingdom");
  });

  document.querySelectorAll(".tower-btn").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const type = btn.getAttribute("data-type");
      if (state.screen !== "playing") return;
      if (state.selectedTowerType === type) state.selectedTowerType = null;
      else state.selectedTowerType = type;
      setMessage(state.selectedTowerType ? TOWER_TYPES[type].name + " — tap the field to place" : "");
    });
  });

  document.getElementById("start-btn").addEventListener("pointerdown", () => {
    startGame(state.mapKey);
  });

  document.querySelectorAll(".map-option").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      state.mapKey = btn.getAttribute("data-map");
      state.map = MAPS[state.mapKey] || MAPS.fords;
      document.getElementById("menu-screen").classList.add("hidden");
      setMessage("");
    });
  });

  document.getElementById("continue-btn").addEventListener("pointerdown", () => {
    if (state.screen !== "between") return;
    const next = state.wave + 1;
    if (next > state.maxWave) { state.screen = "victory"; return; }
    startWave(next);
  });

  document.getElementById("victory-restart-btn").addEventListener("pointerdown", () => {
    startGame(state.mapKey);
  });

  document.getElementById("defeat-restart-btn").addEventListener("pointerdown", () => {
    startGame(state.mapKey);
  });

  document.getElementById("menu-btn").addEventListener("pointerdown", () => {
    state.screen = "menu";
  });

  /* ============================ CANVAS SETUP ============================ */
  function fitCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
  }
  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  /* ============================ MAIN LOOP ============================ */
  function loop(t) {
    const now = t || performance.now();
    let dt = lastTime ? (now - lastTime) / 1000 : 0.016;
    lastTime = now;
    dt = Math.min(dt, 0.05);
    try {
      if (state.screen === "playing") update(dt);
    } catch (err) {
      console.error("update error", err);
    }
    try {
      if (state.messageT > 0) state.messageT -= dt;
      render();
    } catch (err) {
      console.error("render error", err);
    }
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  /* ============================ UPDATE ============================ */
  function update(dt) {
    if (state.waveTimer <= 0 && state.spawnQueue.length > 0) {
      const tpl = state.spawnQueue.shift();
      spawnEnemy(tpl);
    }

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (enemyStep(e, dt)) {
        state.baseHp -= e.dmg;
        state.particles.push({ x: e.x, y: e.y, vx: -60, vy: -40, life: 0.5, max: 0.5, color: "#e63946", size: 4 });
        state.enemies.splice(i, 1);
        setMessage(e.boss ? "The Last King breached the keep!" : "An enemy breached the keep!");
      }
      if (e.flash > 0) e.flash -= dt;
    }

    for (const t of state.towers) {
      const ts = towerStats(t);
      if (t.state === "attack") {
        t.animT += dt;
        if (t.animT >= t.animDur) {
          const target = t.targetId != null ? findEnemy(t.targetId) : null;
          if (TOWER_TYPES[t.type].projectile === null) {
            if (target) doDamage(t, target);
          } else if (target) {
            state.projectiles.push({
              id: nextId++, towerId: t.id, kind: TOWER_TYPES[t.type].projectile,
              x: t.x, y: t.y, tx: target.x, ty: target.y,
              speed: projectileSpeed(TOWER_TYPES[t.type].projectile), targetId: target.id, t: 0,
            });
          }
          t.state = "idle";
          t.cooldown = ts.fireRate;
        }
      } else {
        t.cooldown -= dt;
        if (t.cooldown <= 0) {
          const target = t.targetId != null ? findEnemy(t.targetId) : findTarget(t);
          if (target) {
            if (distTo(t, target) <= ts.range) {
              t.state = "attack";
              t.animT = 0;
              t.animDur = ts.windup;
              if (TOWER_TYPES[t.type].projectile !== null) {
                t.armAng = angleTo(t.x, t.y, target.x, target.y) + Math.PI * 0.55;
              }
              if (TOWER_TYPES[t.type].projectile === null) t.swingAng = angleTo(t.x, t.y, target.x, target.y);
            } else {
              t.cooldown = 0.08;
            }
          } else {
            t.state = "idle";
          }
        }
      }
      if (state.screen !== "playing") break;
    }

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      const e = findEnemy(p.targetId);
      if (!e) { state.projectiles.splice(i, 1); continue; }
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      const sp = p.speed * dt;
      if (d <= sp) {
        state.projectiles.splice(i, 1);
        const tower = findTower(p.towerId);
        if (tower) doDamage(tower, e);
      } else {
        const s = sp / d;
        p.x += (e.x - p.x) * s;
        p.y += (e.y - p.y) * s;
        p.t += dt;
        if (p.t > 6) state.projectiles.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 1 - 2.5 * dt;
      pt.vy *= 1 - 2.5 * dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }

    // rage scaling for bosses
    for (const e of state.enemies) {
      if (e.boss && e.hp < e.maxHp * 0.5) e.rage = true;
    }

    checkEndConditions();
  }

  /* ============================ RENDER HELPERS ============================ */
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#56a5e8");
    g.addColorStop(0.55, "#9ed2f2");
    g.addColorStop(1, "#c4e2b4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(74,122,66,0.5)";
    ctx.beginPath();
    ctx.ellipse(60, H - 40, 120, 90, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(430, H - 30, 140, 100, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5e8c4a";
    ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = "#4c743c";
    ctx.fillRect(0, H - 120, W, 8);
  }

  function drawGrid() {
    ctx.strokeStyle = "rgba(60,40,20,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= W; gx += CELL) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); }
    for (let gy = 0; gy <= H; gy += CELL) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); }
    ctx.stroke();
  }

  function drawPath() {
    const p = state.map.path;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#4a3826";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.stroke();
    ctx.strokeStyle = "#8a6b45";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.stroke();
  }

  function drawBase() {
    const bx = WORLD.BASE_POS.x, by = WORLD.BASE_POS.y;
    ctx.fillStyle = "#8494a6";
    rr(bx - 30, by - 44, 60, 44, 5);
    ctx.fill();
    ctx.strokeStyle = "#5d6b7c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#6b4f2a";
    ctx.beginPath();
    ctx.moveTo(bx - 40, by - 44);
    ctx.lineTo(bx, by - 82);
    ctx.lineTo(bx + 40, by - 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5d4630";
    for (let i = -1; i <= 1; i++) ctx.fillRect(bx - 40 + i * 20, by - 82, 10, 8);
    ctx.fillStyle = "#33291f";
    ctx.beginPath();
    ctx.arc(bx, by - 16, 9, Math.PI, 0);
    ctx.lineTo(bx, by - 7);
    ctx.lineTo(bx - 9, by - 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#33302b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by - 82);
    ctx.lineTo(bx, by - 116);
    ctx.stroke();
    ctx.fillStyle = "#b23a48";
    ctx.beginPath();
    ctx.moveTo(bx, by - 116);
    ctx.lineTo(bx + 18, by - 109);
    ctx.lineTo(bx, by - 102);
    ctx.closePath();
    ctx.fill();
  }

  function drawArcher(t, windup, target) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5d4a33";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(t.x - 2, t.y + 16);
    ctx.lineTo(t.x - 3, t.y + 26);
    ctx.moveTo(t.x + 2, t.y + 16);
    ctx.lineTo(t.x + 4, t.y + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 6);
    ctx.lineTo(t.x, t.y - 6);
    ctx.stroke();
    ctx.fillStyle = "#3a2f24";
    ctx.beginPath();
    ctx.arc(t.x, t.y - 9, 4, 0, Math.PI * 2);
    ctx.fill();
    const aim = target ? angleTo(t.x, t.y - 6, target.x, target.y) : -Math.PI / 2;
    let armAng = -Math.PI / 2;
    if (windup) armAng = aim + Math.PI * 0.62;
    else if (t.state === "attack") armAng = aim;
    const hx = t.x + Math.cos(armAng) * 11;
    const hy = t.y - 6 + Math.sin(armAng) * 11;
    ctx.strokeStyle = "#5d4a33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 6);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = "#8a6b45";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 6);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = "#d9c08a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(armAng) * 8, hy + Math.sin(armAng) * 8);
    ctx.stroke();
  }

  function drawSpear(t, windup, target) {
    const ty = TOWER_TYPES[t.type];
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 16, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ty.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ty.dark;
    ctx.beginPath();
    ctx.moveTo(t.x - 11, t.y + 2);
    ctx.lineTo(t.x, t.y - 10);
    ctx.lineTo(t.x + 11, t.y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ty.dark;
    ctx.fillRect(t.x - 13, t.y - 12, 26, 5);
    const aim = target ? angleTo(t.x, t.y + 6, target.x, target.y) : -Math.PI / 2;
    const swingAng = windup ? aim : -Math.PI / 2;
    const gx = t.x + Math.cos(swingAng) * 11;
    const gy = t.y + 6 + Math.sin(swingAng) * 11;
    ctx.strokeStyle = "#5d4a33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 6);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    ctx.strokeStyle = "#6b4a2f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(t.x + Math.cos(swingAng) * 6, t.y + 6 + Math.sin(swingAng) * 6);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    ctx.fillStyle = "#7f8c99";
    ctx.beginPath();
    ctx.moveTo(t.x - 5, t.y + 10);
    ctx.lineTo(t.x - 5, t.y + 4);
    ctx.lineTo(t.x - 2, t.y + 7);
    ctx.closePath();
    ctx.fill();
  }

  function drawMage(t, windup, animT, animDur) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a3f7d";
    ctx.beginPath();
    ctx.moveTo(t.x - 9, t.y + 16);
    ctx.lineTo(t.x - 9, t.y + 2);
    ctx.lineTo(t.x, t.y - 16);
    ctx.lineTo(t.x + 9, t.y + 2);
    ctx.lineTo(t.x + 9, t.y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#6b4a2f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 16);
    ctx.lineTo(t.x, t.y - 22);
    ctx.stroke();
    const pulse = windup ? 1 + (animT / Math.max(animDur, 0.001)) * 0.9 : 1;
    const orbR = 5 * pulse;
    const orbC = windup ? "#ff6b35" : "#ffb347";
    ctx.fillStyle = "rgba(255,120,40,0.35)";
    ctx.beginPath();
    ctx.arc(t.x, t.y - 24, orbR * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = orbC;
    ctx.beginPath();
    ctx.arc(t.x, t.y - 24, orbR, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBallista(t, windup, animT, animDur) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 16, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5d4a33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x - 8, t.y + 16);
    ctx.lineTo(t.x - 11, t.y - 2);
    ctx.moveTo(t.x + 8, t.y + 16);
    ctx.lineTo(t.x + 11, t.y - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t.x - 11, t.y - 2);
    ctx.lineTo(t.x + 11, t.y - 2);
    ctx.stroke();
    const pivot = { x: t.x, y: t.y - 2 };
    const restAng = Math.PI / 2;
    const target = t.targetId != null ? findEnemy(t.targetId) : null;
    const aim = target ? angleTo(pivot.x, pivot.y, target.x, target.y) : restAng;
    const rel = windup ? lerp(restAng, aim, easeOut(t.animT / Math.max(t.animDur, 0.001))) : aim;
    const hx = pivot.x + Math.cos(rel) * 16;
    const hy = pivot.y + Math.sin(rel) * 16;
    ctx.strokeStyle = "#5d4a33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = "#c9ced6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(rel) * 9, hy + Math.sin(rel) * 9);
    ctx.stroke();
  }

  function drawTower(t) {
    const ts = towerStats(t);
    const windup = t.state === "attack";
    const target = t.targetId != null ? findEnemy(t.targetId) : null;
    const r = ts.radius * (1 + 0.18 * (t.level - 1));
    if (t.type === "archer") drawArcher(t, windup, target);
    else if (t.type === "spear") drawSpear(t, windup, target);
    else if (t.type === "mage") drawMage(t, windup, t.animT, t.animDur);
    else if (t.type === "ballista") drawBallista(t, windup, t.animT, t.animDur);
    if (t.level > 1) {
      ctx.strokeStyle = "rgba(255,215,130,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemy(e) {
    const t = ENEMY_TYPES[e.type];
    const r = e.boss ? e.radius * 2.1 : e.radius;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 5, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    let ang = -Math.PI / 2;
    if (e.path && e.wi < e.path.length - 1) ang = Math.atan2(e.path[e.wi].y - e.y, e.path[e.wi].x - e.x);
    const fx = Math.cos(ang), fy = Math.sin(ang);
    const px = -fy, py = fx;
    ctx.fillStyle = e.flash > 0 ? "#eeeeee" : t.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
    ctx.fill();
    const er = r * 0.32;
    if (e.boss) {
      const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 0.9);
      glow.addColorStop(0, "rgba(255,60,40,0.55)");
      glow.addColorStop(1, "rgba(255,60,40,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b1a12";
      ctx.beginPath();
      ctx.arc(e.x - er, e.y - er * 0.5, r * 0.16, 0, Math.PI * 2);
      ctx.arc(e.x + er, e.y - er * 0.5, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8c468";
      ctx.beginPath();
      ctx.moveTo(e.x - r * 0.9, e.y - r * 0.95);
      ctx.lineTo(e.x - r * 0.35, e.y - r * 1.5);
      ctx.lineTo(e.x, e.y - r * 1.75);
      ctx.lineTo(e.x + r * 0.35, e.y - r * 1.5);
      ctx.lineTo(e.x + r * 0.9, e.y - r * 0.95);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = e.rage ? "#ff6b35" : "#2b1a12";
      ctx.beginPath();
      ctx.arc(e.x - er * fx - er * px * 0.7, e.y - er * fy - er * py * 0.7, er * 0.22, 0, Math.PI * 2);
      ctx.arc(e.x + er * fx - er * px * 0.7, e.y + er * fy - er * py * 0.7, er * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    if (e.type === "militia") {
      ctx.strokeStyle = t.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y - r * 0.2, r * 0.75, Math.PI, 0);
      ctx.stroke();
    } else if (e.type === "spearman") {
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x - 3, e.y - r - 3);
      ctx.lineTo(e.x - 3, e.y - r - 9);
      ctx.stroke();
      ctx.strokeStyle = "#8a6b45";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - r + 2);
      ctx.lineTo(e.x - 6, e.y - r - 12);
      ctx.stroke();
    } else if (e.type === "knight") {
      ctx.fillStyle = "#7f8c99";
      ctx.beginPath();
      ctx.moveTo(e.x - 6, e.y + 4);
      ctx.lineTo(e.x - 6, e.y - 2);
      ctx.lineTo(e.x - 2, e.y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = t.dark;
      ctx.beginPath();
      ctx.arc(e.x, e.y - r * 0.3, r * 0.55, Math.PI, 0);
      ctx.fill();
    } else if (e.type === "brute") {
      ctx.strokeStyle = "#3a1c10";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x - er - 2, e.y - er * 0.9);
      ctx.lineTo(e.x - er + 6, e.y - er * 0.6);
      ctx.moveTo(e.x + er - 2, e.y - er * 0.9);
      ctx.lineTo(e.x + er - 6, e.y - er * 0.6);
      ctx.stroke();
      ctx.strokeStyle = t.dark;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(e.x - r * 0.9, e.y - r * 0.2);
      ctx.lineTo(e.x - r * 1.5, e.y + r * 0.6);
      ctx.moveTo(e.x + r * 0.9, e.y - r * 0.2);
      ctx.lineTo(e.x + r * 1.5, e.y + r * 0.6);
      ctx.stroke();
    }
    const w = e.boss ? r * 3.4 : r * 2.1;
    const h = e.boss ? 7 : 5;
    const hx = e.x - w / 2;
    const hy = e.y - r - (e.boss ? 22 : 16);
    ctx.fillStyle = "#3a1414";
    ctx.fillRect(hx - 1, hy - 1, w + 2, h + 2);
    ctx.fillStyle = e.boss ? "#c0392b" : "#e63946";
    ctx.fillRect(hx, hy, w * clamp(e.hp / e.maxHp, 0, 1), h);
  }

  function drawProjectile(p) {
    if (p.kind === "arrow") {
      ctx.strokeStyle = "#d9c08a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (p.tx - p.x) * 0.08, p.y + (p.ty - p.y) * 0.08);
      ctx.stroke();
    } else if (p.kind === "fire") {
      ctx.fillStyle = "rgba(255,120,40,0.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8c42";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#c9ced6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (p.tx - p.x) * 0.08, p.y + (p.ty - p.y) * 0.08);
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (const pt of state.particles) {
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHeart(x, y, s, filled) {
    ctx.fillStyle = filled ? "#e63946" : "#6e2626";
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.3, x - s * 0.5, y - s * 0.9, x, y - s * 0.25);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.9, x + s * 0.9, y - s * 0.3, x, y + s * 0.35);
    ctx.fill();
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawBackground();
    drawGrid();
    drawPath();
    drawBase();
    for (const e of state.enemies) drawEnemy(e);
    for (const t of state.towers) drawTower(t);
    for (const pr of state.projectiles) drawProjectile(pr);
    drawParticles();

    // HUD
    for (let i = 0; i < 5; i++) {
      const filled = state.baseHp > i * 20 + 0.5;
      drawHeart(16 + i * 24, 12, 8, filled);
    }
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("WAVE " + state.wave + " / " + state.maxWave, W / 2, 22);
    ctx.fillText("WAVE " + state.wave + " / " + state.maxWave, W / 2, 22);
    ctx.font = '11px "Trebuchet MS", sans-serif';
    ctx.strokeText("enemies remaining: " + state.enemies.length, W / 2, 40);
    ctx.fillText("enemies remaining: " + state.enemies.length, W / 2, 40);
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = "right";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.fillStyle = "#7a4a00";
    ctx.strokeText("GOLD  " + state.gold, W - 10, 22);
    ctx.fillText("GOLD  " + state.gold, W - 10, 22);

    if (state.message && state.messageT > 0) {
      ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.strokeText(state.message, W / 2, H - 90);
      ctx.fillStyle = "#ffe9a8";
      ctx.fillText(state.message, W / 2, H - 90);
    }
  }

  /* ============================ UPGRADE LIST ============================ */
  function renderUpgradeList() {
    const box = document.getElementById("upgrade-options");
    if (!box) return;
    box.innerHTML = "";
    const typesWithTowers = ["archer", "spear", "mage", "ballista"].filter((t) => state.towers.some((x) => x.type === t));
    if (typesWithTowers.length === 0) {
      const b = document.createElement("div");
      b.className = "upgrade-none";
      b.textContent = "No towers yet — survive the first wave!";
      box.appendChild(b);
      return;
    }
    for (const t of typesWithTowers) {
      const placed = state.towers.filter((x) => x.type === t);
      const maxLvl = Math.max(...placed.map((x) => x.level));
      const tierIdx = maxLvl - 1;
      if (tierIdx < 0 || tierIdx >= UPGRADES[t].length) continue;
      const up = UPGRADES[t][tierIdx];
      const b = document.createElement("button");
      b.className = "upgrade-btn";
      b.id = "buy-" + t;
      b.innerHTML = "<div class='up-name'>" + up.name + "</div><div class='up-desc'>" + up.desc + "</div><div class='up-cost'>Gold " + up.cost + "</div>";
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (state.screen !== "between") return;
        if (state.gold < up.cost) { setMessage("Not enough gold for the royal decree"); return; }
        state.gold -= up.cost;
        state.upgradesBought[t] = Math.min(2, (state.upgradesBought[t] || 0) + 1);
        for (const tp of state.towers) {
          if (tp.type === t) tp.level = Math.min(3, 1 + (state.upgradesBought[t] || 0));
        }
        updateTowerBar();
        setMessage("The kingdom strengthens: " + t + " upgraded!");
        renderUpgradeList();
      });
      box.appendChild(b);
    }
  }

  /* ============================ INIT / BOOT ============================ */
  function init() {
    document.getElementById("treasury-next").textContent = state.wave + 1;
    renderUpgradeList();
    updateTowerBar();
    showScreen("menu");
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
  });

  window.LAST_KINGDOM = { state, startGame, startWave };
})();
