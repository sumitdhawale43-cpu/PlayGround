import { loadMemory } from './memory.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';
import { Game } from './game.js';

const memory = loadMemory();
const audio = new Audio(memory);
const ui = new UI(memory, audio);
const canvas = document.getElementById('game');
const game = new Game(canvas, ui, memory, audio);
ui.showTitle(memory);

if (memory.settings?.muted) {
  document.getElementById('btn-mute').textContent = '×';
  document.getElementById('btn-mute').style.opacity = '0.5';
}

window.__game = game;
window.__memory = memory;
