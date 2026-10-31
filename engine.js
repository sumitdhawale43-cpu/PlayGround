/*
 * GOD COMPLEX — combat engine
 * Pure state machine, no DOM. Loaded by the page and by balance tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GodComplex = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PLAYER_BASE = { maxHp: 60, strike: 6, energy: 3, guard: 9 };
  const HP_PER_GIFT = 5;

  const ABILITIES = {
    cinder: {
      id: 'cinder', name: 'Cinder Palm', source: 'THE EMBER MONK',
      color: '#ff7c42', cost: 2, cd: 2,
      desc: 'Deal 10. Apply 4 Burn for 3 turns.',
      flavor: 'He burned you down to the wick. The flame stayed.'
    },
    frost: {
      id: 'frost', name: 'Glacier Shell', source: 'THE FROST HERALD',
      color: '#6fe0ff', cost: 2, cd: 2,
      desc: 'Gain 16 Block. Weaken the enemy for 2 turns.',
      flavor: 'She froze you at the moment of dying. You kept the cold.'
    },
    chain: {
      id: 'chain', name: 'Chain Lightning', source: 'THE STORM DUELIST',
      color: '#b9a0ff', cost: 2, cd: 2,
      desc: 'Deal 6 three times. +2 per hit against Burning foes.',
      flavor: 'He was faster. For one whole second. Then you were.'
    },
    blood: {
      id: 'blood', name: 'Sanguine Pact', source: 'THE BLOOD SAINT',
      color: '#ff4d6d', cost: 2, cd: 3,
      desc: 'Pay 8 HP. Deal 26. Heal half the damage dealt.',
      flavor: 'His god asked for blood. You learned to make change.'
    },
    mirror: {
      id: 'mirror', name: 'Mirror Ward', source: 'THE MIRROR ORACLE',
      color: '#bff8e7', cost: 2, cd: 3,
      desc: 'Gain 12 Block. Thorns 8 for 2 turns.',
      flavor: 'It showed you yourself. You took the looking glass.'
    },
    singularity: {
      id: 'singularity', name: 'Singularity', source: 'THE VOID WEAVER',
      color: '#a184ff', cost: 3, cd: 4,
      desc: 'Deal 18. Stun the enemy for 1 turn.',
      flavor: 'It unmade your future. You kept the empty place where it was.'
    },
    corona: {
      id: 'corona', name: 'Corona', source: 'THE SOLAR TYRANT',
      color: '#ffcf5c', cost: 3, cd: 4,
      desc: 'Deal 22. Gain 4 Strength for the rest of the fight.',
      flavor: 'A sun demanded worship. You walked out wearing it.'
    },
    godhood: {
      id: 'godhood', name: 'Godhood', source: 'THE GOD COMPLEX',
      color: '#f6e7b6', cost: 0, cd: 99,
      desc: 'The only gift that cannot be taken by winning.',
      flavor: 'It defeated you. Finally, something worth keeping.'
    }
  };

  const BOSSES = [
    {
      id: 'ember', index: 0, name: 'THE EMBER MONK', short: 'Ember Monk',
      epithet: 'First Flame of the Ash Order', color: '#ff7c42',
      hp: 95, ability: 'cinder',
      sigil: { sides: 3, rot: 12, rings: 2 },
      intro: '"You climbed this far to burn?"',
      taunt: '"Ash learns nothing."',
      lastWords: '"A spark is all it takes."',
      passive: null,
      moves: [
        { name: 'Cinder Jab', damage: 10, text: 'A quick, contemptuous strike.' },
        { name: 'Ash Guard', block: 8, strength: 2, text: 'Wraps itself in smoldering ash.' },
        { name: 'Flame Palm', damage: 16, burn: { dmg: 3, turns: 2 }, text: 'A slow, open-handed blow that sets you alight.' }
      ]
    },
    {
      id: 'frost', index: 1, name: 'THE FROST HERALD', short: 'Frost Herald',
      epithet: 'Keeper of the Last Winter', color: '#6fe0ff',
      hp: 122, ability: 'frost',
      sigil: { sides: 6, rot: 30, rings: 3 },
      intro: '"I have frozen better men than you."',
      taunt: '"Stay still. It only hurts at the end."',
      lastWords: '"Cold... is a kind of mercy."',
      passive: null,
      moves: [
        { name: 'Rime Slash', damage: 12, weak: 2, text: 'A blade of black ice. Weakens you.' },
        { name: 'Glacier Wall', block: 16, weak: 1, text: 'Raises a wall of frozen centuries.' },
        { name: 'Absolute Zero', damage: 23, text: 'A silence so complete it cracks bone.' }
      ]
    },
    {
      id: 'storm', index: 2, name: 'THE STORM DUELIST', short: 'Storm Duelist',
      epithet: 'Undefeated in Nine Thousand Duels', color: '#b9a0ff',
      hp: 148, ability: 'chain',
      sigil: { sides: 5, rot: 72, rings: 2 },
      intro: '"Nine thousand duels. Nine thousand corpses."',
      taunt: '"Try to make this one interesting."',
      lastWords: '"...good. Again."',
      passive: { id: 'momentum', name: 'Momentum', text: 'Gains 1 Strength whenever it hits you.' },
      moves: [
        { name: 'Static Cut', damage: 7, hits: 2, text: 'Two cuts, faster than thunder.' },
        { name: 'Charge', strength: 3, block: 6, text: 'The air around it begins to hum.' },
        { name: 'Static Cut', damage: 7, hits: 2, text: 'Two cuts, faster than thunder.' },
        { name: 'Thunderfall', damage: 26, text: 'The sky arrives all at once.' }
      ]
    },
    {
      id: 'blood', index: 3, name: 'THE BLOOD SAINT', short: 'Blood Saint',
      epithet: 'Martyr of the Open Wound', color: '#ff4d6d',
      hp: 172, ability: 'blood',
      sigil: { sides: 4, rot: 45, rings: 2 },
      intro: '"Pain is a liturgy. You are the offering."',
      taunt: '"Bleed beautifully for me."',
      lastWords: '"At last... a worthy hymn."',
      passive: { id: 'lifesteal', name: 'Communion', text: 'Heals 4 whenever it damages you.' },
      moves: [
        { name: 'Bloodletting', damage: 12, heal: 10, text: 'Opens a wound and drinks deep.' },
        { name: 'Crimson Rite', damage: 8, burn: { dmg: 4, turns: 3 }, text: 'Paints a burning sigil in your blood.' },
        { name: 'Martyr\u2019s Wrath', damage: 27, selfDamage: 5, text: 'Turns its own agony outward.' }
      ]
    },
    {
      id: 'mirror', index: 4, name: 'THE MIRROR ORACLE', short: 'Mirror Oracle',
      epithet: 'It Has No Face of Its Own', color: '#bff8e7',
      hp: 178, ability: 'mirror',
      sigil: { sides: 8, rot: 22, rings: 3 },
      intro: '"Look. This is what will kill you."',
      taunt: '"Every blow you land is a confession."',
      lastWords: '"Now there are two of us."',
      passive: { id: 'thorns', name: 'Reflection', text: 'Whenever you hit it, you take 2.' },
      moves: [
        { name: 'Fracture', damage: 8, vulnerable: 2, text: 'Splits your reflection into something hungry.' },
        { name: 'Echo Blade', damage: 16, text: 'Your own best strike, returned improved.' },
        { name: 'Mirror Guard', block: 18, thorns: { dmg: 6, turns: 2 }, text: 'The glass hardens and waits for you.' },
        { name: 'Echo Blade', damage: 16, text: 'Your own best strike, returned improved.' }
      ]
    },
    {
      id: 'void', index: 5, name: 'THE VOID WEAVER', short: 'Void Weaver',
      epithet: 'It Unthreads What Has Not Happened', color: '#a184ff',
      hp: 198, ability: 'singularity',
      sigil: { sides: 7, rot: 51, rings: 4 },
      intro: '"I have seen the end of you. It is very close."',
      taunt: '"Your future is a short thread."',
      lastWords: '"...impossible. I cut that thread."',
      passive: { id: 'voidarmor', name: 'Hunger', text: 'Gains 5 Block at the start of each of its turns.' },
      moves: [
        { name: 'Null Lance', damage: 19, drain: 1, text: 'Pins your future to the floor. Drains 1 Energy next turn.' },
        { name: 'Event Horizon', damage: 13, weak: 2, text: 'A gravity that unmakes momentum.' },
        { name: 'Null Lance', damage: 19, drain: 1, text: 'Pins your future to the floor. Drains 1 Energy next turn.' },
        { name: 'Unmake', damage: 33, text: 'It deletes the part of you that was standing.' }
      ]
    },
    {
      id: 'solar', index: 6, name: 'THE SOLAR TYRANT', short: 'Solar Tyrant',
      epithet: 'A Sun That Demands Worship', color: '#ffcf5c',
      hp: 218, ability: 'corona',
      sigil: { sides: 10, rot: 18, rings: 2 },
      intro: '"Kneel, or evaporate. I am flexible."',
      taunt: '"You are a shadow with ambition."',
      lastWords: '"You cannot... wear a sun..."',
      passive: { id: 'aura', name: 'Radiant Aura', text: 'You take 3 damage at the end of each of your turns.' },
      moves: [
        { name: 'Solar Flare', damage: 16, burn: { dmg: 4, turns: 2 }, text: 'A tongue of fire that leaves a second sun inside you.' },
        { name: 'Corona', strength: 5, heal: 8, text: 'Crowns itself in fresh fire.' },
        { name: 'Judgment', damage: 37, text: 'A verdict delivered at the speed of light.' }
      ]
    },
    {
      id: 'god', index: 7, name: 'THE GOD COMPLEX', short: 'God Complex',
      epithet: 'The Voice That Says You Deserve This', color: '#f6e7b6',
      hp: 280, ability: 'godhood',
      sigil: { sides: 12, rot: 0, rings: 4 },
      intro: '"You made it. You think that means something."',
      taunt: '"We are the same. That is the problem."',
      lastWords: '"...take it, then."',
      passive: { id: 'eternal', name: 'Eternal', text: 'Heals 6 at the start of each of its turns. Starts with 2 Strength.' },
      moves: [
        { name: 'Genesis', damage: 20, text: 'A beginning, delivered as a wound.' },
        { name: 'Omniscience', damage: 12, vulnerable: 2, weak: 2, text: 'It knows exactly where you are weakest.' },
        { name: 'Genesis', damage: 20, text: 'A beginning, delivered as a wound.' },
        { name: 'Ruin', damage: 41, text: 'The end of a universe, aimed at one person.' },
        { name: 'Silence', block: 24, heal: 12, text: 'It refuses to be witnessed for a moment.' }
      ]
    }
  ];

  const byAbility = {};
  for (const boss of BOSSES) byAbility[boss.ability] = boss;

  function cloneStatuses() {
    return { burn: { dmg: 0, turns: 0 }, weak: 0, vulnerable: 0, stun: 0, strength: 0, thorns: { dmg: 0, turns: 0 } };
  }

  function max(a, b) { return a > b ? a : b; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function createBattle(opts) {
    const boss = BOSSES.find((b) => b.id === opts.bossId);
    if (!boss) throw new Error('Unknown boss: ' + opts.bossId);
    const equipped = (opts.equipped || []).filter((id) => ABILITIES[id] && id !== 'godhood').slice(0, 3);
    const maxHp = opts.maxHp || PLAYER_BASE.maxHp;
    const strikeDamage = opts.strike || PLAYER_BASE.strike;
    const player = Object.assign({
      hp: maxHp, maxHp, block: 0,
      energy: PLAYER_BASE.energy, maxEnergy: PLAYER_BASE.energy,
      cooldowns: {}
    }, cloneStatuses());
    const enemy = Object.assign({
      hp: boss.hp, maxHp: boss.hp, block: 0, intent: 0,
      exposed: false
    }, cloneStatuses());
    if (boss.id === 'god') enemy.strength = 2;
    const battle = {
      boss, player, enemy, equipped,
      strikeDamage, guard: PLAYER_BASE.guard,
      turn: 1, phase: 'player',
      log: [], pendingEnergy: 0,
      stats: { damageDealt: 0, damageTaken: 0, turns: 0, abilitiesUsed: 0 },
      events: []
    };
    pushLog(battle, boss.intro, 'narrator');
    return battle;
  }

  function pushLog(battle, text, cls) {
    battle.log.push({ text, cls: cls || '', turn: battle.turn });
    if (battle.log.length > 80) battle.log.shift();
  }

  function intent(battle) {
    const moves = battle.boss.moves;
    return moves[battle.enemy.intent % moves.length];
  }

  function enemyWeakFactor(battle) {
    return battle.enemy.weak > 0 ? 0.7 : 1;
  }

  function damagePreview(battle) {
    const move = intent(battle);
    if (!move || !move.damage) return null;
    if (battle.enemy.stun > 0) return null;
    let per = move.damage + battle.enemy.strength;
    if (battle.enemy.weak > 0) per = Math.floor(per * 0.7);
    if (battle.player.vulnerable > 0) per = Math.floor(per * 1.5);
    return { per, hits: move.hits || 1, total: per * (move.hits || 1) };
  }

  function describeIntent(battle) {
    const move = intent(battle);
    if (!move) return '';
    if (battle.enemy.stun > 0) return 'STUNNED — it will lose its next turn';
    const parts = [];
    const preview = damagePreview(battle);
    if (preview) parts.push((preview.hits > 1 ? preview.per + '\u00d7' + preview.hits : preview.total) + ' damage');
    if (move.block) parts.push('gain ' + move.block + ' block');
    if (move.heal) parts.push('heal ' + move.heal);
    if (move.strength) parts.push('+' + move.strength + ' strength');
    if (move.burn) parts.push('burn ' + move.burn.dmg + ' (' + move.burn.turns + ')');
    if (move.weak) parts.push('weaken ' + move.weak);
    if (move.vulnerable) parts.push('expose ' + move.vulnerable);
    if (move.drain) parts.push('drain ' + move.drain + ' energy');
    if (move.selfDamage) parts.push('self-damage ' + move.selfDamage);
    return parts.join(' \u00b7 ');
  }

  function canUse(battle, id) {
    if (battle.phase !== 'player') return false;
    if (id === 'strike' || id === 'guard') return battle.player.energy >= 1;
    const ab = ABILITIES[id];
    if (!ab || id === 'godhood' || !battle.equipped.includes(id)) return false;
    return battle.player.energy >= ab.cost && (battle.player.cooldowns[id] || 0) <= 0;
  }

  function damagePlayerDirect(battle, amount, source) {
    if (amount <= 0 || battle.phase !== 'player') return 0;
    const dealt = Math.min(amount, battle.player.hp);
    battle.player.hp -= dealt;
    battle.stats.damageTaken += dealt;
    battle.events.push({ type: 'playerBypass', amount: dealt, source });
    if (battle.player.hp <= 0) lose(battle);
    return dealt;
  }

  function damageEnemyDirect(battle, amount, source) {
    if (amount <= 0 || battle.phase !== 'player') return 0;
    const dealt = Math.min(amount, battle.enemy.hp);
    battle.enemy.hp -= dealt;
    battle.stats.damageDealt += dealt;
    battle.events.push({ type: 'enemyBypass', amount: dealt, source });
    if (battle.enemy.hp <= 0) win(battle);
    return dealt;
  }

  function hitEnemy(battle, base, opts) {
    opts = opts || {};
    const hits = opts.hits || 1;
    let total = 0;
    let blocked = 0;
    for (let i = 0; i < hits; i++) {
      if (battle.phase !== 'player') break;
      let raw = base + battle.player.strength;
      if (battle.enemy.vulnerable > 0) raw = Math.round(raw * 1.5);
      const absorbed = Math.min(battle.enemy.block, raw);
      battle.enemy.block -= absorbed;
      const dealt = raw - absorbed;
      battle.enemy.hp = Math.max(0, battle.enemy.hp - dealt);
      total += dealt;
      blocked += absorbed;
      battle.stats.damageDealt += dealt;
      battle.events.push({ type: 'enemyHit', amount: dealt, blocked: absorbed, hits: 1 });
      if (battle.enemy.thorns.dmg > 0 && !opts.ignoreThorns) {
        damagePlayerDirect(battle, battle.enemy.thorns.dmg, 'thorns');
      }
      if (battle.enemy.hp <= 0) { win(battle); break; }
      if (battle.phase !== 'player') break;
    }
    return { total, blocked };
  }

  function healPlayer(battle, amount) {
    const before = battle.player.hp;
    battle.player.hp = Math.min(battle.player.maxHp, battle.player.hp + amount);
    const healed = battle.player.hp - before;
    if (healed > 0) battle.events.push({ type: 'playerHeal', amount: healed });
    return healed;
  }

  function healEnemy(battle, amount) {
    const before = battle.enemy.hp;
    battle.enemy.hp = Math.min(battle.enemy.maxHp, battle.enemy.hp + amount);
    const healed = battle.enemy.hp - before;
    if (healed > 0) battle.events.push({ type: 'enemyHeal', amount: healed });
    return healed;
  }

  function applyEnemyBurn(battle, dmg, turns) {
    battle.enemy.burn.dmg += dmg;
    battle.enemy.burn.turns = max(battle.enemy.burn.turns, turns);
  }

  function applyPlayerBurn(battle, dmg, turns) {
    battle.player.burn.dmg += dmg;
    battle.player.burn.turns = max(battle.player.burn.turns, turns);
  }

  function win(battle) {
    if (battle.phase !== 'player') return;
    battle.phase = 'won';
    battle.stats.turns = battle.turn;
    battle.events.push({ type: 'win' });
    pushLog(battle, battle.boss.lastWords, 'boss');
  }

  function lose(battle) {
    if (battle.phase !== 'player') return;
    battle.phase = 'lost';
    battle.stats.turns = battle.turn;
    battle.events.push({ type: 'lose' });
  }

  function playerAction(battle, id) {
    if (!canUse(battle, id)) return { ok: false, reason: 'unavailable', events: [] };
    battle.events = [];
    const p = battle.player;
    let label = '';
    let detail = '';

    if (id === 'strike') {
      p.energy -= 1;
      const res = hitEnemy(battle, battle.strikeDamage);
      label = 'You strike';
      detail = res.total + ' damage' + (res.blocked ? ' (' + res.blocked + ' blocked)' : '');
    } else if (id === 'guard') {
      p.energy -= 1;
      p.block += battle.guard;
      p.energy = p.energy;
      battle.events.push({ type: 'playerBlock', amount: battle.guard });
      label = 'You guard';
      detail = '+' + battle.guard + ' block';
    } else {
      const ab = ABILITIES[id];
      p.energy -= ab.cost;
      p.cooldowns[id] = ab.cd;
      battle.stats.abilitiesUsed += 1;
      label = ab.name;
      if (id === 'cinder') {
        const res = hitEnemy(battle, 10);
        applyEnemyBurn(battle, 4, 3);
        detail = res.total + ' damage \u00b7 4 burn';
      } else if (id === 'frost') {
        p.block += 16;
        battle.enemy.weak = max(battle.enemy.weak, 2);
        battle.events.push({ type: 'playerBlock', amount: 16 });
        detail = '+16 block \u00b7 enemy weakened';
      } else if (id === 'chain') {
        const bonus = battle.enemy.burn.turns > 0 ? 2 : 0;
        const res = hitEnemy(battle, 6 + bonus, { hits: 3 });
        detail = res.total + ' damage' + (bonus ? ' \u00b7 burn bonus' : '');
      } else if (id === 'blood') {
        damagePlayerDirect(battle, 8, 'pact');
        const res = hitEnemy(battle, 26);
        const healed = healPlayer(battle, Math.floor(res.total / 2));
        detail = res.total + ' damage \u00b7 -8 HP \u00b7 +' + healed + ' HP';
      } else if (id === 'mirror') {
        p.block += 12;
        p.thorns.dmg = max(p.thorns.dmg, 8);
        p.thorns.turns = max(p.thorns.turns, 2);
        battle.events.push({ type: 'playerBlock', amount: 12 });
        detail = '+12 block \u00b7 thorns 8';
      } else if (id === 'singularity') {
        const res = hitEnemy(battle, 18);
        battle.enemy.stun += 1;
        detail = res.total + ' damage \u00b7 stunned';
      } else if (id === 'corona') {
        const res = hitEnemy(battle, 22);
        p.strength += 4;
        detail = res.total + ' damage \u00b7 +4 strength';
      }
      pushLog(battle, label + ' \u2014 ' + detail, 'player');
      return { ok: true, events: battle.events.slice(), detail };
    }

    pushLog(battle, label + ' \u2014 ' + detail, 'player');
    return { ok: true, events: battle.events.slice(), detail };
  }

  function tickPlayerStart(battle) {
    const p = battle.player;
    p.block = 0;
    // burn
    if (p.burn.turns > 0 && p.burn.dmg > 0) {
      const dmg = p.burn.dmg;
      p.burn.turns -= 1;
      damagePlayerDirect(battle, dmg, 'burn');
      pushLog(battle, 'You burn for ' + dmg + '.', 'bad');
      if (battle.phase !== 'player') return;
      if (p.burn.turns <= 0) p.burn.dmg = 0;
    }
    // cooldowns
    for (const key of Object.keys(p.cooldowns)) {
      if (p.cooldowns[key] > 0) p.cooldowns[key] -= 1;
    }
    // thorns duration
    if (p.thorns.turns > 0) {
      p.thorns.turns -= 1;
      if (p.thorns.turns <= 0) p.thorns.dmg = 0;
    }
    p.energy = Math.max(0, p.maxEnergy - battle.pendingEnergy);
    if (battle.pendingEnergy > 0) {
      pushLog(battle, 'The void takes ' + battle.pendingEnergy + ' energy.', 'bad');
      battle.pendingEnergy = 0;
    }
  }

  function enemyTurn(battle) {
    const e = battle.enemy;
    const passive = battle.boss.passive || {};

    // Burn ticks before it can act.
    if (e.burn.turns > 0 && e.burn.dmg > 0) {
      const dmg = e.burn.dmg;
      e.burn.turns -= 1;
      damageEnemyDirect(battle, dmg, 'burn');
      pushLog(battle, battle.boss.short + ' burns for ' + dmg + '.', 'good');
      if (e.burn.turns <= 0) e.burn.dmg = 0;
      if (battle.phase !== 'player') return;
    }

    e.block = 0;
    if (passive.id === 'voidarmor') {
      e.block += 5;
      battle.events.push({ type: 'enemyBlock', amount: 5 });
    }
    if (passive.id === 'eternal') {
      healEnemy(battle, 6);
      pushLog(battle, 'The God Complex knits itself back together.', 'bad');
    }

    if (e.stun > 0) {
      e.stun -= 1;
      pushLog(battle, battle.boss.short + ' is suspended in nothing. It loses its turn.', 'good');
      battle.events.push({ type: 'enemyStunned' });
      if (e.weak > 0) e.weak -= 1;
      if (e.thorns.turns > 0) { e.thorns.turns -= 1; if (e.thorns.turns <= 0) e.thorns.dmg = 0; }
      return;
    }

    const move = intent(battle);
    const hits = move.hits || 1;
    let totalDealt = 0;
    let totalBlocked = 0;

    if (move.block) {
      e.block += move.block;
      battle.events.push({ type: 'enemyBlock', amount: move.block });
    }
    if (move.heal) {
      const healed = healEnemy(battle, move.heal);
      if (healed) pushLog(battle, battle.boss.short + ' heals ' + healed + '.', 'bad');
    }
    if (move.strength) {
      e.strength += move.strength;
      battle.events.push({ type: 'enemyBuff', amount: move.strength });
    }
    if (move.thorns) {
      e.thorns.dmg = max(e.thorns.dmg, move.thorns.dmg);
      e.thorns.turns = max(e.thorns.turns, move.thorns.turns);
    }

    if (move.damage) {
      for (let i = 0; i < hits; i++) {
        if (battle.phase !== 'player') break;
        let raw = move.damage + e.strength;
        if (e.weak > 0) raw = Math.floor(raw * 0.7);
        if (battle.player.vulnerable > 0) raw = Math.floor(raw * 1.5);
        const absorbed = Math.min(battle.player.block, raw);
        battle.player.block -= absorbed;
        const dealt = raw - absorbed;
        battle.player.hp = Math.max(0, battle.player.hp - dealt);
        battle.stats.damageTaken += dealt;
        totalDealt += dealt;
        totalBlocked += absorbed;
        battle.events.push({ type: 'playerHit', amount: dealt, blocked: absorbed });
        if (passive.id === 'lifesteal' && dealt > 0) healEnemy(battle, 4);
        if (battle.player.thorns.dmg > 0 && dealt > 0) damageEnemyDirect(battle, battle.player.thorns.dmg, 'thorns');
        if (battle.player.hp <= 0) { lose(battle); break; }
        if (battle.phase !== 'player') break;
      }
      if (battle.phase === 'player' && passive.id === 'momentum' && totalDealt > 0) {
        e.strength += 1;
      }
    }

    if (battle.phase === 'player') {
      if (move.burn) applyPlayerBurn(battle, move.burn.dmg, move.burn.turns);
      if (move.weak) battle.player.weak = max(battle.player.weak, move.weak);
      if (move.vulnerable) battle.player.vulnerable = max(battle.player.vulnerable, move.vulnerable);
      if (move.drain) battle.pendingEnergy += move.drain;
      if (move.selfDamage) {
        e.hp = Math.max(0, e.hp - move.selfDamage);
        battle.events.push({ type: 'enemyBypass', amount: move.selfDamage, source: 'self' });
        if (e.hp <= 0) win(battle);
      }
    }

    if (totalDealt || totalBlocked) {
      pushLog(battle, battle.boss.short + ' uses ' + move.name + ' \u2014 ' + totalDealt + ' damage' + (totalBlocked ? ' (' + totalBlocked + ' blocked)' : '') + '.', 'boss');
    } else {
      pushLog(battle, battle.boss.short + ' uses ' + move.name + '.', 'boss');
    }

    if (battle.phase !== 'player') return;

    if (e.weak > 0) e.weak -= 1;
    if (e.thorns.turns > 0) { e.thorns.turns -= 1; if (e.thorns.turns <= 0) e.thorns.dmg = 0; }
    e.intent = (e.intent + 1) % battle.boss.moves.length;
  }

  function endTurn(battle) {
    if (battle.phase !== 'player') return { ok: false, events: [] };
    battle.events = [];
    const passive = battle.boss.passive || {};

    if (passive.id === 'aura') {
      damagePlayerDirect(battle, 3, 'aura');
      pushLog(battle, 'The Solar Tyrant\u2019s light scours you for 3.', 'bad');
      if (battle.phase !== 'player') return { ok: true, events: battle.events.slice() };
    }

    if (battle.player.weak > 0) battle.player.weak -= 1;
    if (battle.player.vulnerable > 0) battle.player.vulnerable -= 1;

    enemyTurn(battle);
    if (battle.phase !== 'player') return { ok: true, events: battle.events.slice() };

    battle.turn += 1;
    tickPlayerStart(battle);
    if (battle.phase !== 'player') return { ok: true, events: battle.events.slice() };
    return { ok: true, events: battle.events.slice() };
  }

  function yieldBattle(battle) {
    if (battle.phase !== 'player') return { ok: false };
    battle.player.hp = 0;
    lose(battle);
    battle.events.push({ type: 'yield' });
    return { ok: true };
  }

  function playerStats(stolenCount) {
    return {
      maxHp: PLAYER_BASE.maxHp + stolenCount * HP_PER_GIFT,
      strike: PLAYER_BASE.strike + stolenCount,
      energy: PLAYER_BASE.energy,
      guard: PLAYER_BASE.guard
    };
  }

  return {
    PLAYER_BASE, HP_PER_GIFT, ABILITIES, BOSSES,
    createBattle, playerAction, endTurn, yieldBattle,
    intent, damagePreview, describeIntent, canUse, playerStats,
    max
  };
});
