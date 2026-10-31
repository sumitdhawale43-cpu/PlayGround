import { clamp } from '../utils.js';
import {
  drawBackground, drawLighting, drawSnow, updateSnow, drawMinimap,
} from './background.js';
import {
  drawSeabed, drawRocks, drawLandmarks, drawVents, drawSurfaceAndBoat,
} from './terrain.js';
import { drawDecorations, drawPickups } from './flora.js';
import { drawSchools, drawCreatures } from './creatures.js';
import { drawPlayer, drawParticles, drawEffects } from './player.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.w = 1;
    this.h = 1;
    this.dpr = 1;
    this.zoom = 1;
    this.viewW = 1440;
    this.viewH = 810;
    this.cam = { x: 0, y: 0 };
    this.snow = [];
    this.time = 0;
    this.rockShapes = new WeakMap();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    const area = w * h;
    this.zoom = clamp(Math.sqrt(area / (1440 * 810)), 0.68, 1.16);
    this.viewW = w / this.zoom;
    this.viewH = h / this.zoom;
  }

  render(game, dt) {
    const { ctx } = this;
    this.time = game.time;
    this.cam = game.camera;
    this.viewW = this.w / this.zoom;
    this.viewH = this.h / this.zoom;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.w, this.h);

    drawBackground(this, game);

    // World-space layer.
    const s = this.dpr * this.zoom;
    const shake = game.shake || 0;
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.setTransform(s, 0, 0, s, this.dpr * (this.w / 2 - this.cam.x * this.zoom + shakeX), this.dpr * (this.h / 2 - this.cam.y * this.zoom + shakeY));
    drawSeabed(this, game);
    drawRocks(this, game);
    drawLandmarks(this, game);
    drawDecorations(this, game);
    drawVents(this, game);
    drawSurfaceAndBoat(this, game);
    drawPickups(this, game);
    drawSchools(this, game);
    drawCreatures(this, game);
    drawEffects(this, game);
    drawParticles(this, game);
    drawPlayer(this, game);
    ctx.restore();

    updateSnow(this, dt, game);
    drawSnow(this);
    drawLighting(this, game);
  }

  drawMinimap(game, canvas) {
    drawMinimap(this, game, canvas);
  }
}
