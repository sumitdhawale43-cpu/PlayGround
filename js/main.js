import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.installDebugApi();

// A tiny public surface for verification harnesses and curious chrononauts.
window.TIME_REWIND_VERSION = '5.0.1';
window.addEventListener('resize', () => game.resize());
window.addEventListener('orientationchange', () => setTimeout(() => game.resize(), 180));

// Copy link / context menu niceties
window.addEventListener('contextmenu', (e) => {
  if (e.target.closest('canvas, .touch-btn')) e.preventDefault();
});
