import { activeTraits, traitById, forgetMemory, npcGiftFor } from './memory.js';
import { RECIPES } from './game.js';
import { roman, clamp } from './util.js';

const $ = (id) => document.getElementById(id);

const INV_META = {
  wood: { label: 'WOOD', color: '#a07a48' },
  stone: { label: 'STONE', color: '#8f8d80' },
  fiber: { label: 'FIBER', color: '#7d945c' },
  flint: { label: 'FLINT', color: '#b9b4a3' },
  berry: { label: 'BERRY', color: '#b45a4b' },
  meat: { label: 'MEAT', color: '#a85a4a' },
  bandage: { label: 'BIND', color: '#d8c6a4' },
  shard: { label: 'SHARD', color: '#f0c987' },
};

const TRAIT_ORDER = ['emberhide', 'longreach', 'feint', 'pursuit', 'nightborn', 'ashen', 'packmind', 'thickhide', 'apex', 'blooddebt'];

export class UI {
  constructor(memory, audio) {
    this.memory = memory;
    this.audio = audio;
    this.game = null;
    this.toastTimers = new Set();
    this.lastInv = '';
    this.touchMode = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.bindStatic();
  }

  bind(game) {
    this.game = game;
    if (this.touchMode) {
      $('touch').classList.remove('hidden');
      game.touch.active = true;
    }
  }

  bindStatic() {
    $('btn-begin').addEventListener('click', () => {
      this.audio.unlock();
      this.game.startRun();
    });
    $('btn-title-memory').addEventListener('click', () => this.openMemory(this.memory));
    $('btn-mute').addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      $('btn-mute').textContent = muted ? '×' : '♪';
      $('btn-mute').style.opacity = muted ? '0.5' : '1';
    });
    $('btn-memory').addEventListener('click', () => this.toggleMemory(this.memory));
    $('btn-respawn').addEventListener('click', () => this.game.newCycle());
    $('btn-next-cycle').addEventListener('click', () => this.game.newCycle());
    $('btn-forget').addEventListener('click', () => {
      if (!confirm('Forget every death, every lesson, every scar? This cannot be undone.')) return;
      forgetMemory();
      location.reload();
    });
    for (const el of document.querySelectorAll('[data-close]')) {
      el.addEventListener('click', () => this.closeAll());
    }
    $('recipe-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.recipe');
      if (!card) return;
      const id = card.dataset.id;
      if (this.game && this.game.state === 'playing') {
        this.game.craft(id);
        this.openCraft(this.game, true);
      }
    });
    $('weapons').addEventListener('click', (e) => {
      const slot = e.target.closest('.wslot');
      if (slot && this.game) this.game.equip(slot.dataset.w);
    });
    $('dlg-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.dlg-opt');
      if (btn && btn.dataset.act) {
        const fn = this._dlgActions?.[Number(btn.dataset.act)];
        if (fn) fn();
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAll();
    });
    this.bindTouch();
  }

  bindTouch() {
    const stick = $('stick');
    const knob = $('stick-knob');
    let id = null;
    const setStick = (e) => {
      const r = stick.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const max = r.width / 2 - 14;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      if (this.game) {
        this.game.touch.dx = dx / max;
        this.game.touch.dy = dy / max;
        this.game.touch.active = true;
      }
    };
    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      stick.setPointerCapture(id);
      setStick(e);
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      e.preventDefault();
      setStick(e);
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      knob.style.transform = '';
      if (this.game) { this.game.touch.dx = 0; this.game.touch.dy = 0; }
    };
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);

    for (const btn of document.querySelectorAll('[data-touch]')) {
      const act = btn.dataset.touch;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.unlock();
        if (!this.game) return;
        if (act === 'attack') this.game.touch.attack = true;
        else if (act === 'dodge') this.game.input.dodge = true;
        else if (act === 'interact') this.game.interact();
        else if (act === 'craft') this.toggleCraft(this.game);
        else if (act === 'memory') this.toggleMemory(this.memory);
        else if (act === 'eat') this.game.eat();
      });
      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (act === 'attack' && this.game) this.game.touch.attack = false;
      });
      btn.addEventListener('pointercancel', () => { if (act === 'attack' && this.game) this.game.touch.attack = false; });
    }
  }

  /* ---------------- screens ---------------- */

  showTitle(memory) {
    const traits = activeTraits(memory);
    const c = memory.counters;
    const deaths = memory.graves.length;
    const titleMemory = $('title-memory');
    if (memory.cycles === 0 && deaths === 0) {
      titleMemory.innerHTML = 'The valley has not learned you yet. <b>Nothing here remembers your name.</b><br>That will change.';
    } else {
      const traitNames = traits.length
        ? traits.map((t) => `<span class="tm-trait">${traitById(t).name}</span>`).join(', ')
        : 'nothing yet';
      titleMemory.innerHTML = `Cycle <b>${roman(memory.cycles + 1)}</b> · <b>${deaths}</b> past ${deaths === 1 ? 'life' : 'lives'} · <b>${c.kills}</b> things killed<br>The valley has learned ${traitNames}.`;
    }
    const chron = $('title-chronicle');
    chron.innerHTML = this.chronicleHTML(memory, 5);
    $('title-seed').textContent = `The valley is listening · seed ${(memory.seedSalt % 9973).toString().padStart(4, '0')}`;
    $('title').classList.remove('hidden');
    $('hud').classList.add('hidden');
    $('touch').classList.add('hidden');
  }

  hideTitle() { $('title').classList.add('hidden'); }
  showHud() {
    $('hud').classList.remove('hidden');
    if (this.touchMode) $('touch').classList.remove('hidden');
  }
  hideEnd() { $('death').classList.add('hidden'); $('victory').classList.add('hidden'); }

  showDeath(summary) {
    $('hud').classList.add('hidden');
    $('touch').classList.add('hidden');
    $('death-cause').textContent = `${summary.cause}. Day ${summary.day}, cycle ${roman(summary.cycle)}.`;
    this.renderTraits($('death-traits'), summary.gained, true);
    $('death-line').textContent = summary.line;
    $('death').classList.remove('hidden');
  }

  showVictory(summary) {
    $('hud').classList.add('hidden');
    $('touch').classList.add('hidden');
    $('victory-text').textContent = `You carried three shards out of the dark and woke the Worldroot on day ${summary.day}. ${summary.kills} things died along the way. The valley watched all of it.`;
    this.renderTraits($('victory-traits'), summary.gained.length ? summary.gained : summary.traits, true);
    $('victory').classList.remove('hidden');
  }

  /* ---------------- panels ---------------- */

  isModalOpen() {
    return ['panel-memory', 'panel-craft', 'dialogue'].some((id) => !$(id).classList.contains('hidden'));
  }

  closeAll() {
    for (const id of ['panel-memory', 'panel-craft', 'dialogue']) $(id).classList.add('hidden');
    if (this.game && this.game.state === 'playing') this.game.paused = false;
  }

  toggleMemory(memory) {
    if (!$('panel-memory').classList.contains('hidden')) { this.closeAll(); return; }
    if (this.game && !['playing', 'title', 'dead', 'victory'].includes(this.game.state)) return;
    this.openMemory(memory);
  }

  openMemory(memory) {
    $('panel-craft').classList.add('hidden');
    $('dialogue').classList.add('hidden');
    const traits = activeTraits(memory);
    this.renderTraits($('trait-grid'), traits, false);
    const graves = $('grave-list');
    if (!memory.graves.length) {
      graves.innerHTML = '<p class="chronicle-empty">No cairns yet. The valley is still deciding what you are.</p>';
    } else {
      graves.innerHTML = memory.graves.map((g) => `
        <div class="grave"><b>${g.taken ? 'Cairn emptied' : 'Cairn intact'} · cycle ${roman(g.cycle)}</b><span>DAY ${g.day}</span></div>
        <div class="grave" style="border-top:none;padding-top:0;color:var(--faint)">${g.cause}${g.loot?.weapon ? ' · ' + g.loot.weapon.toUpperCase() + ' left behind' : ''}</div>
      `).join('');
    }
    $('memory-chronicle').innerHTML = this.chronicleHTML(memory, 40);
    const c = memory.counters;
    const stats = [
      ['Cycles lived', memory.cycles],
      ['Best day', memory.bestDay],
      ['Deaths', c.deaths],
      ['Things killed', c.kills],
      ['Wolves killed', c.wolfKills],
      ['Kills at night', c.nightKills],
      ['Shards taken', c.shards],
      ['Fires lit', c.campfireLit],
      ['Trees burned', memory.burns.length],
      ['Crafts made', c.crafted],
      ['Times fled', c.flees],
      ['Dodges', c.dodges],
      ['Maren trust', memory.npcs.maren.trust],
      ['Sable trust', memory.npcs.sable.trust],
      ['Blood spilled', c.npcKills],
      ['Gifts waiting', ['maren', 'sable', 'pell'].filter((k) => npcGiftFor(memory, k)).length],
    ];
    $('memory-stats').innerHTML = stats.map(([k, v]) => `<div class="stat-cell"><span>${k}</span><b>${v}</b></div>`).join('');
    $('panel-memory').classList.remove('hidden');
    if (this.game && this.game.state === 'playing') this.game.paused = true;
  }

  toggleCraft(game) {
    if (!$('panel-craft').classList.contains('hidden')) { this.closeAll(); return; }
    if (!game || game.state !== 'playing') return;
    this.openCraft(game);
  }

  openCraft(game, keepOpen = false) {
    $('panel-memory').classList.add('hidden');
    $('dialogue').classList.add('hidden');
    const inv = game.player.inventory;
    $('recipe-grid').innerHTML = RECIPES.map((r) => {
      const can = Object.entries(r.cost).every(([k, v]) => (inv[k] || 0) >= v);
      const cost = Object.entries(r.cost).map(([k, v]) => `<span class="${(inv[k] || 0) >= v ? 'ok' : 'no'}">${v} ${k}</span>`).join('');
      const owned = r.id !== 'bandage' && r.id !== 'campfire' && game.player.owned[r.id];
      return `<div class="recipe ${can ? '' : 'locked'}" data-id="${r.id}">
        <span class="r-key">${owned ? 'OWNED' : ''}</span>
        <span class="r-glyph">${r.glyph}</span>
        <div class="r-name">${r.name}</div>
        <div class="r-desc">${r.desc}</div>
        <div class="r-cost">${cost}</div>
      </div>`;
    }).join('');
    $('panel-craft').classList.remove('hidden');
    game.paused = true;
    if (keepOpen) game.paused = true;
  }

  /* ---------------- dialogue ---------------- */

  openDialogue(npc, game) {
    this.game = game;
    game.paused = true;
    this._dlgNpc = npc;
    this.renderDialogue(npc, game);
    $('dialogue').classList.remove('hidden');
    this.audio.sfx('talk');
  }

  renderDialogue(npc, game, overrideText) {
    const memory = game.memory;
    const inv = game.player.inventory;
    const c = memory.counters;
    const trust = memory.npcs[npc.key]?.trust || 0;
    $('dlg-portrait').textContent = npc.name[0];
    $('dlg-name').textContent = npc.name;
    const options = [];
    const actions = [];
    const add = (label, disabled, fn) => { options.push({ label, disabled }); actions.push(fn); };

    let text = overrideText;
    if (npc.key === 'maren') {
      if (!text) {
        if (trust >= 40) text = 'You again. The fire is yours. The valley talks about you, you know. Not kindly, always, but it talks.';
        else if (c.deaths > 0) text = 'You have the look of someone the valley has already buried. It kept your things, didn\'t it? It always keeps the things.';
        else text = 'First warm body in a while. Sit. Don\'t waste the fire. The dark out there is older than the ruins.';
      }
      add(`Give 3 berries (${inv.berry || 0}/3)`, (inv.berry || 0) < 3, () => {
        inv.berry -= 3;
        memory.npcs.maren.trust = Math.min(100, trust + 14);
        memory.npcs.maren.quests.berries = true;
        inv.bandage = (inv.bandage || 0) + 2;
        game.toast('Maren takes the berries and presses two bandages into your hand.', 'good');
        game.audio.sfx('talk');
        this.renderDialogue(npc, game, 'The valley gives little and takes much. You gave first. I will remember that, and so will it.');
        this.updateHUD(game, true);
      });
      add('Ask about the beacon', false, () => {
        this.renderDialogue(npc, game, 'The Worldroot was a beacon once. Three ember shards were taken to the ruins — east, north, south of here — and the dark got in. Bring them home and the tree will burn again. The valley will see you do it.');
      });
      add('Ask what the valley remembers', false, () => {
        const traits = activeTraits(memory);
        const list = traits.length ? traits.map((t) => traitById(t).name).join(', ') : 'nothing yet. It is still deciding.';
        this.renderDialogue(npc, game, `It remembers ${list}. Every swing, every fire, every time you ran. It is not cruel. It is only thorough.`);
      });
      add('Leave', false, () => this.closeAll());
    } else if (npc.key === 'sable') {
      if (!text) {
        if (trust >= 40) text = 'The pack circles wider when you are near. They remember your smell. So do I. That is not a bad thing.';
        else if (c.wolfKills > 3) text = `You have killed ${c.wolfKills} of them. They know your weight now. Walk quieter, or walk with fire.`;
        else text = 'You walk loud. The wolves already know how much you weigh. Learn to be less.';
      }
      add(`Give 2 meat (${inv.meat || 0}/2)`, (inv.meat || 0) < 2, () => {
        inv.meat -= 2;
        memory.npcs.sable.trust = Math.min(100, trust + 14);
        memory.npcs.sable.quests.meat = true;
        inv.flint = (inv.flint || 0) + 2;
        game.toast('Sable trades two flint for the meat without a word.', 'good');
        game.audio.sfx('talk');
        this.renderDialogue(npc, game, 'Good. Flint is honest. Meat is honest. Most everything else in this valley lies.');
        this.updateHUD(game, true);
      });
      add('Ask about the pack', false, () => {
        const traits = activeTraits(memory);
        let hint;
        if (traits.includes('emberhide')) hint = 'They roll in the ash now. Your fire bites shallower. Use the spear, or use the dark.';
        else if (traits.includes('thickhide')) hint = 'They are thicker through the shoulder. The axe catches. The spear still finds a way in.';
        else if (traits.includes('feint')) hint = 'They wait for your roll now. Do not roll where you mean to land.';
        else hint = 'They watch your feet more than your hands. Change the rhythm. Hit once, move, hit again.';
        this.renderDialogue(npc, game, hint);
      });
      add('Ask where the shards sleep', false, () => {
        const ruins = game.world.ruins;
        const dirs = ruins.map((r) => {
          const dx = r.x - game.world.camp.x, dy = r.y - game.world.camp.y;
          const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'south' : 'north');
          return `${d}${r.pedestal?.shard ? '' : ' (taken)'}`;
        });
        this.renderDialogue(npc, game, `One sleeps ${dirs[0]}, one ${dirs[1]}, one ${dirs[2]}. Wardens keep them. Wardens do not sleep.`);
      });
      add('Leave', false, () => this.closeAll());
    } else {
      if (!text) {
        if (trust >= 30) text = 'I drew you again. You keep coming back with a different face. I keep the old drawings under my mat.';
        else if (c.deaths > 0) text = `I saw where you fell. There is a cairn there now. I put a stone on it. You were heavier than you look.`;
        else text = 'You are new. I can tell because the valley has not started copying you yet. It will. It copies everyone.';
      }
      add('Ask for a story', false, () => {
        const g = memory.graves[0];
        const t = activeTraits(memory);
        let s;
        if (g) s = `Once you died ${g.cause.toLowerCase()} on day ${g.day}. The valley kept your ${g.loot?.weapon ? g.loot.weapon : 'bones'} and grew a cairn. I visit it when the fire gets low.`;
        else if (t.length) s = `It knows ${traitById(t[0]).name.toLowerCase()} now. That was you. Every lesson has a shape, and the shape is always a person.`;
        else s = 'No story yet. You are still the first page. Try not to end on a cliff.';
        this.renderDialogue(npc, game, s);
      });
      add(`Share 2 berries (${inv.berry || 0}/2)`, (inv.berry || 0) < 2, () => {
        inv.berry -= 2;
        memory.npcs.pell.trust = Math.min(100, trust + 10);
        game.toast('Pell eats both berries at once and laughs with his mouth full.', 'good');
        this.renderDialogue(npc, game, 'You are all right. If the valley eats you, I will draw you with a bigger hat.');
        this.updateHUD(game, true);
      });
      add('Leave', false, () => this.closeAll());
    }

    $('dlg-text').textContent = text;
    this._dlgActions = actions;
    $('dlg-options').innerHTML = options.map((o, i) => `<button class="dlg-opt" data-act="${i}" ${o.disabled ? 'disabled' : ''}>${o.label}</button>`).join('');
  }

  /* ---------------- hud ---------------- */

  updateHUD(game, force = false) {
    const p = game.player;
    const m = game.memory;
    $('cycle-tag').textContent = `CYCLE ${roman(m.cycles + 1)}`;
    $('bar-hp').style.width = `${clamp(p.hp / p.maxHp, 0, 1) * 100}%`;
    $('bar-hunger').style.width = `${clamp(p.hunger / 100, 0, 1) * 100}%`;
    $('bar-stamina').style.width = `${clamp(p.stamina / p.maxStamina, 0, 1) * 100}%`;
    $('hp-text').textContent = Math.max(0, Math.ceil(p.hp));
    $('hunger-text').textContent = Math.ceil(p.hunger);
    $('stamina-text').textContent = Math.ceil(p.stamina);

    $('day-label').textContent = `DAY ${game.day}`;
    $('phase-label').textContent = game.phase;
    $('clock-fill').style.width = `${game.timeOfDay * 100}%`;

    const pips = $('shard-pips').children;
    for (let i = 0; i < 3; i++) pips[i].classList.toggle('on', i < game.shards);
    $('objective-text').textContent = game.shards >= 3
      ? 'Return to the Worldroot and kindle the beacon'
      : `Recover ${3 - game.shards} more ember shard${3 - game.shards === 1 ? '' : 's'} from the ruins`;

    const inv = p.inventory;
    const invKey = Object.keys(INV_META).map((k) => `${k}:${inv[k] || 0}`).join('|');
    if (force || invKey !== this.lastInv) {
      this.lastInv = invKey;
      $('inventory').innerHTML = Object.entries(INV_META)
        .filter(([k]) => (inv[k] || 0) > 0 || ['wood', 'stone', 'fiber'].includes(k))
        .map(([k, meta]) => `<div class="inv-item"><span class="inv-dot" style="background:${meta.color};color:${meta.color}"></span>${meta.label} <b>${inv[k] || 0}</b></div>`)
        .join('');
    }

    const slots = [['axe', '1'], ['spear', '2'], ['torch', '3']];
    $('weapons').innerHTML = slots.map(([w, key]) => {
      const owned = p.owned[w];
      const active = p.weapon === w;
      return `<div class="wslot ${active ? 'active' : ''}" data-w="${w}" style="${owned ? '' : 'opacity:.35'}"><span class="key">${key}</span>${w.toUpperCase()}</div>`;
    }).join('') + `<div class="wslot" style="cursor:default"><span class="key">4</span>EAT</div><div class="wslot" style="cursor:default"><span class="key">5</span>BIND</div>`;

    this.drawMinimap(game);
  }

  setPrompt(text, visible) {
    const el = $('prompt');
    if (!visible) { el.classList.add('hidden'); return; }
    el.innerHTML = `<b>E</b>${text}`;
    el.classList.remove('hidden');
  }

  setAdapt(level, visible) {
    const el = $('adapt');
    if (!visible || level <= 0.02) { el.classList.remove('on'); return; }
    el.classList.add('on');
    $('adapt-fill').style.width = `${clamp(level, 0, 1) * 100}%`;
  }

  toast(text, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    $('toasts').appendChild(el);
    const t1 = setTimeout(() => {
      el.classList.add('out');
      const t2 = setTimeout(() => { el.remove(); this.toastTimers.delete(t2); }, 520);
      this.toastTimers.add(t2);
      this.toastTimers.delete(t1);
    }, 3200);
    this.toastTimers.add(t1);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  }

  renderTraits(container, ids, gainedOnly) {
    if (!ids || !ids.length) {
      container.innerHTML = `<div class="trait empty"><div class="t-name">${gainedOnly ? 'Nothing new. It already knew you.' : 'Nothing yet.'}</div><div class="t-desc">${gainedOnly ? 'The valley simply repeats what it has already learned.' : 'Survive, and it will start taking notes.'}</div></div>`;
      return;
    }
    const sorted = [...ids].sort((a, b) => TRAIT_ORDER.indexOf(a) - TRAIT_ORDER.indexOf(b));
    container.innerHTML = sorted.map((id) => {
      const t = traitById(id);
      return `<div class="trait"><div class="t-name">${t.name}</div><div class="t-desc">${t.desc}</div></div>`;
    }).join('');
  }

  chronicleHTML(memory, limit) {
    const entries = memory.chronicle.slice(-limit).reverse();
    if (!entries.length) return '<p class="chronicle-empty">No one has died here yet. That will change.</p>';
    return entries.map((e, i) => `<div class="chronicle-entry"><span class="ce-idx">${roman(e.cycle)}</span><span class="ce-main">${e.text}<span class="ce-sub">Day ${e.day} · ${e.kind}</span></span></div>`).join('');
  }

  drawMinimap(game) {
    const c = $('minimap');
    if (!c || !game.world.minimap) return;
    const ctx = c.getContext('2d');
    const W = c.width;
    ctx.clearRect(0, 0, W, W);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(game.world.minimap, 0, 0, W, W);
    const s = W / (game.world.size * 48);
    const dot = (x, y, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * s, y * s, r, 0, Math.PI * 2);
      ctx.fill();
    };
    // camp
    const camp = game.world.camp;
    ctx.fillStyle = '#e3b46b';
    ctx.save();
    ctx.translate(camp.x * s, camp.y * s);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();
    for (const r of game.world.ruins) {
      dot(r.x, r.y, 2.6, r.pedestal?.shard ? '#c9604d' : 'rgba(160,150,130,.5)');
    }
    for (const g of game.memory.graves) dot(g.x, g.y, 1.8, g.taken ? 'rgba(200,190,170,.4)' : '#ece5d3');
    for (const n of game.npcs) dot(n.x, n.y, 1.8, '#8fae7a');
    for (const e of game.enemies) {
      if (Math.abs(e.x - game.player.x) < 1100 && Math.abs(e.y - game.player.y) < 1100) dot(e.x, e.y, 1.6, '#c9604d');
    }
    // player arrow
    ctx.save();
    ctx.translate(game.player.x * s, game.player.y * s);
    ctx.rotate(game.player.facing);
    ctx.fillStyle = '#fff6e2';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3, 3);
    ctx.lineTo(-3, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
