// ============================================================
// NEON OVERDRIVE — boot
// ============================================================

import { Game } from './game.js';

const canvas = document.getElementById('game');
const boot = document.getElementById('boot-flash');

function bootGame() {
  // The game uses procedural canvas art, so it does not need to wait for
  // webfonts before becoming playable. Booting immediately keeps the start
  // control responsive as soon as the module runs.
  const game = new Game(canvas);
  window.__NEON__ = game;
  window.__NEON_READY__ = true;

  if (boot) {
    boot.classList.add('fire');
    window.setTimeout(() => boot.remove(), 900);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame, { once: true });
} else {
  bootGame();
}
