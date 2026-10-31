import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Game } from './game.js';
import { AudioEngine } from './audio.js';
import { ui } from './ui.js';

const $ = (id) => document.getElementById(id);
const isMobile = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(76, window.innerWidth / window.innerHeight, 0.04, 320);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.46, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const audio = new AudioEngine();
ui.init();
ui.loader(0.15);

const game = new Game({ renderer, scene, camera, audio });
ui.loader(0.7);

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
const settings = {
  sensitivity: parseFloat(localStorage.getItem('nf-sens') || '1') || 1,
  invert: localStorage.getItem('nf-invert') === '1',
  quality: localStorage.getItem('nf-quality') || (isMobile ? 'medium' : 'high'),
  sound: localStorage.getItem('nf-sound') !== '0',
};

function applyQuality(q) {
  settings.quality = q;
  localStorage.setItem('nf-quality', q);
  const cap = q === 'high' ? (isMobile ? 1.6 : 2) : q === 'medium' ? 1.35 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = q !== 'low';
  bloom.enabled = q === 'high';
  const sun = game?.world?.sunLight;
  if (sun) {
    const size = q === 'low' ? 512 : q === 'medium' ? 1024 : 2048;
    if (sun.shadow.mapSize.x !== size) {
      sun.shadow.mapSize.set(size, size);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
  }
}

function applySettingsToUI() {
  $('set-sens').value = settings.sensitivity;
  $('set-sens-val').textContent = settings.sensitivity.toFixed(2).replace(/0$/, '');
  $('set-quality').value = settings.quality;
  $('set-invert').checked = settings.invert;
  $('set-audio').checked = settings.sound;
  game.sensitivity = settings.sensitivity;
  game.invertY = settings.invert;
  audio.setEnabled(settings.sound);
}

applyQuality(settings.quality);
applySettingsToUI();

$('set-sens').addEventListener('input', (e) => {
  settings.sensitivity = parseFloat(e.target.value);
  localStorage.setItem('nf-sens', settings.sensitivity);
  game.sensitivity = settings.sensitivity;
  $('set-sens-val').textContent = settings.sensitivity.toFixed(2).replace(/0$/, '');
});
$('set-quality').addEventListener('change', (e) => applyQuality(e.target.value));
$('set-invert').addEventListener('change', (e) => {
  settings.invert = e.target.checked;
  localStorage.setItem('nf-invert', settings.invert ? '1' : '0');
  game.invertY = settings.invert;
});
$('set-audio').addEventListener('change', (e) => {
  settings.sound = e.target.checked;
  localStorage.setItem('nf-sound', settings.sound ? '1' : '0');
  audio.setEnabled(settings.sound);
});

/* ------------------------------------------------------------------ */
/* Menus                                                               */
/* ------------------------------------------------------------------ */
function deploy() {
  audio.init();
  audio.resume();
  audio.setEnabled(settings.sound);
  audio.ui();
  game.start();
}

$('btn-deploy').addEventListener('click', deploy);
$('btn-settings').addEventListener('click', () => { ui.showSettings(); });
$('btn-settings-close').addEventListener('click', () => { ui.closeSettings(); audio.ui(); });
$('btn-briefing').addEventListener('click', () => { ui.showBriefing(); });
$('btn-briefing-close').addEventListener('click', () => { ui.closeBriefing(); audio.ui(); });
$('btn-pause-settings').addEventListener('click', () => { ui.showSettings(); });
$('btn-resume').addEventListener('click', () => { audio.resume(); game.resume(); });
$('btn-restart').addEventListener('click', () => { audio.init(); audio.resume(); game.start(); });
$('btn-quit').addEventListener('click', () => { game.toMenu(); });
$('btn-retry').addEventListener('click', () => { audio.init(); audio.resume(); game.start(); });
$('btn-over-menu').addEventListener('click', () => { game.toMenu(); });

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  const settingsOpen = !$('screen-settings').classList.contains('hidden');
  const briefingOpen = !$('screen-briefing').classList.contains('hidden');
  if (settingsOpen) { ui.closeSettings(); return; }
  if (briefingOpen) { ui.closeBriefing(); return; }
});

// init audio after any first interaction so menu ambience can start
window.addEventListener('pointerdown', () => {
  if (!audio.ctx) {
    audio.init();
    audio.setEnabled(settings.sound);
  }
}, { once: true });

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */
const clock = new THREE.Clock();
let firstFrame = true;
let elapsed = 0;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.mode === 'playing') game.pause();
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  game.update(dt);
  composer.render();
  if (firstFrame) {
    firstFrame = false;
    ui.loader(1);
    setTimeout(() => ui.hideLoader(), 550);
  }
}

ui.loader(1);
animate();

// debugging hook used by automated visual checks
window.__nightfall = { game, renderer, scene, camera, composer };
