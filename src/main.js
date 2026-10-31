import { Game } from './game.js';
import { UI } from './ui.js';
import { OceanAudio } from './audio.js';
import { zoneAtY } from './world.js';

const canvas = document.getElementById('game');
const audio = new OceanAudio();
const game = new Game(canvas, audio);
const ui = new UI(game);
game.ui = ui;

// Debug / verification handle. Harmless in normal play.
window.__DEEP_OCEAN__ = {
  game,
  ui,
  audio,
  start: () => game.startDive(true),
  newExpedition: () => game.newExpedition(),
  teleport: (x, y, oxygen, hull) => {
    game.player.placeAt(x, y, oxygen ?? game.player.maxOxygen, hull ?? game.player.maxHull);
    game.camera.x = x;
    game.camera.y = y;
    game.zone = zoneAtY(y);
    game.ui.updateHUD(game, true);
  },
  grant: (resource, amount) => {
    game.addResource(resource, amount, true);
    game.ui.updateHUD(game, true);
  },
  setOxygen: (value) => {
    game.player.oxygen = Math.max(0, Math.min(game.player.maxOxygen, value));
    game.ui.updateHUD(game, true);
  },
  setHull: (value) => {
    game.player.hull = Math.max(0, Math.min(game.player.maxHull, value));
    game.ui.updateHUD(game, true);
  },
  openUpgrades: () => game.openUpgrades(),
  state: () => ({
    state: game.state,
    depth: Math.round(game.player.y / 10),
    zone: game.zone.id,
    oxygen: game.player.oxygen,
    hull: game.player.hull,
    relics: game.save.relics.length,
    resources: { ...game.save.resources },
    upgrades: { ...game.save.upgrades },
    nearest: game.nearestInteract ? game.nearestInteract.kind : null,
  }),
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  game.update(dt);
  game.render(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
