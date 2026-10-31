import { Sound } from './audio.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { render } from './render.js';

const canvas = document.getElementById('game');

// Older mobile WebViews lack CanvasRenderingContext2D.roundRect.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r = 0) {
    const radius = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    return this;
  };
}
const ctx = canvas.getContext('2d', { alpha: false });
const sound = new Sound();
const game = new Game(canvas, sound);
const ui = new UI(game);

function resize() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  game.setViewport(w, h, dpr);
  if (game.mode === 'title' && game.player) {
    game.camera.x = game.player.x;
    game.camera.y = game.player.y;
  }
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));
resize();

let last = 0;
let first = true;

function frame(now) {
  const dt = first ? 0.016 : Math.min((now - last) / 1000, 0.05);
  first = false;
  last = now;

  game.update(dt);
  render(ctx, game);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Handy for debugging from the console, and for automated capture checks.
window.hollowmoor = { game, ui, sound };
