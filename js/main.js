/* Bootstrap: build the renderer + game, then run the single animation loop. */
import { OceanRenderer } from './renderer.js';
import { Game } from './game.js';

const root = document.documentElement;
const canvas = document.getElementById('scene');
const renderer = new OceanRenderer(canvas);
const game = new Game(renderer);

/* Software rasterisers (SwiftShader, llvmpipe) choke on large backdrop blurs.
   Probe once so slow machines get the clean, fast HUD from the first frame. */
function softwareGraphics() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    return /swiftshader|llvmpipe|softpipe|software|angle \(google/i.test(name);
  } catch {
    return true;
  }
}

function enableLowFx() {
  if (root.classList.contains('low-fx')) return;
  root.classList.add('low-fx');
  renderer.resize();
}

if (softwareGraphics()) enableLowFx();

let last = performance.now();
let frames = 0;
let fpsTime = 0;
let slowTime = 0;

function frame(now) {
  const elapsed = Math.max(0, (now - last) / 1000);
  last = now;
  frames += 1;
  fpsTime += Math.min(0.05, elapsed);
  if (fpsTime > 2) {
    game.fps = Math.round(frames / fpsTime);
    frames = 0;
    fpsTime = 0;
  }
  if (!root.classList.contains('low-fx')) {
    slowTime = elapsed > 0.06 ? slowTime + elapsed : Math.max(0, slowTime - elapsed * 0.5);
    if (slowTime > 1.2) enableLowFx();
  }
  // Keep the simulation near real time on slow machines by stepping the
  // world in small slices, even when a frame takes hundreds of milliseconds.
  let remaining = Math.min(0.4, elapsed);
  let guard = 0;
  while (remaining > 0.0001 && guard++ < 24) {
    const step = Math.min(0.05, remaining);
    game.update(step);
    remaining -= step;
  }
  renderer.render(game);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => renderer.resize(), { passive: true });
window.addEventListener('orientationchange', () => setTimeout(() => renderer.resize(), 180));

// Useful for debugging and for automated smoke checks.
window.deepOcean = game;
window.__DEEP_OCEAN__ = game;
window.__DEEP_OCEAN_READY__ = true;

requestAnimationFrame(frame);
