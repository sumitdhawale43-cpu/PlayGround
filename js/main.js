// SHADOW NINJA — bootstrap and frame loop

import { Game } from './game.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { sound } from './audio.js';

const params = new URLSearchParams(window.location.search);
const canvas = document.getElementById('game');
const input = new Input();
const game = new Game(canvas, input, sound);
const ui = new UI(game, sound);
game.ui = ui;
// exposed for automated smoke tests / debugging only
window.__ninja = { game, ui, input, sound };

const forceTouch = params.get('touch') === '1' || params.get('mobile') === '1';
if (input.coarse || forceTouch) document.body.classList.add('touch');

ui.showMenu();
ui.updateBest(game.best);

function updateOrientation() {
  const portrait = window.innerHeight > window.innerWidth * 1.02;
  document.body.classList.toggle('portrait', portrait);
  if (portrait && document.body.classList.contains('touch') && game.state === 'playing') {
    game.pause(true);
  }
}
updateOrientation();

let debugEl = null;
if (params.get('debug') === '1') {
  debugEl = document.createElement('div');
  debugEl.style.cssText =
    'position:absolute;left:8px;bottom:8px;z-index:80;font:10px/1.5 monospace;color:#9ef7ff;' +
    'background:rgba(0,0,0,.6);padding:6px 8px;pointer-events:none;white-space:pre;';
  document.getElementById('app').appendChild(debugEl);
}

// first gesture unlocks WebAudio
const unlock = () => sound.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

window.addEventListener('resize', () => {
  game.resize();
  updateOrientation();
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => { game.resize(); updateOrientation(); }, 120);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') game.pause(true);
});
window.addEventListener('blur', () => {
  if (game.state === 'playing') game.pause(true);
});

window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (code === 'Enter' && game.state === 'menu' && !e.repeat) {
    e.preventDefault();
    sound.unlock();
    sound.sfx('click');
    ui.bootFlash();
    game.startGame();
  } else if (code === 'KeyR' && ['gameover', 'victory', 'paused'].includes(game.state)) {
    e.preventDefault();
    game.restart();
  } else if (code === 'Escape' || code === 'KeyP') {
    if (game.state === 'playing') { e.preventDefault(); game.pause(); }
    else if (game.state === 'paused') { e.preventDefault(); game.resume(); }
  } else if (code === 'KeyM') {
    ui.toggleMute();
  }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// pause/screen fade classes
let last = performance.now();
let fpsAccum = 0;
let fpsFrames = 0;
let displayFps = 0;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum > 0.5) {
    displayFps = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
  }

  input.beginFrame();
  game.update(dt);
  game.syncUI();
  game.render();
  input.endFrame();

  if (debugEl) {
    debugEl.textContent =
      `${displayFps} fps  ${game.state}\n` +
      `wave ${game.wave}  enemies ${game.enemies.filter((e) => !e.dead).length}\n` +
      `particles ${game.fx.particles.length}  proj ${game.projectiles.length}\n` +
      `player ${Math.round(game.player.x)},${Math.round(game.player.y)} hp ${Math.round(game.player.health)}`;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame((t) => {
  last = t;
  frame(t);
});
