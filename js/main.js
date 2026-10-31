/* =========================================================
   PORTAL RUNNER — entry point
   ========================================================= */
import { Game } from './game.js';

const game = new Game();
window.__portalRunner = game;

// Let the shell know the canvas is alive even before a key is pressed.
window.addEventListener('portal-runner-ready', () => {}, { once: true });
game.canvas.setAttribute('data-ready', 'true');
