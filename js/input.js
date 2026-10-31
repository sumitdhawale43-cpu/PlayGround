// Keyboard, mouse and dual-stick touch input.
import { clamp } from './utils.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, down: false };
    this.mouseJustDown = false;
    this.moveStick = { x: 0, y: 0, mag: 0, active: false };
    this.aimStick = { x: 0, y: 0, mag: 0, active: false };
    this.reloadQueued = false;
    this.dashQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;
    this.switchTo = null;
    this.cycleQueued = 0;
    this.isTouch = false;
    this._bindKeyboard();
    this._bindMouse();
    this._bindTouchUI();
    this.detectTouch();
  }

  detectTouch() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.isTouch = coarse || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    document.body.classList.toggle('touch', this.isTouch);
    document.body.classList.toggle('desktop', !this.isTouch);
  }

  _bindKeyboard() {
    const gameKeys = new Set([
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Space', 'KeyR', 'KeyQ', 'KeyE', 'Digit1', 'Digit2', 'Digit3', 'Escape', 'KeyP', 'KeyM',
    ]);
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (gameKeys.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.repeat) return;
      if (e.code === 'KeyR') this.reloadQueued = true;
      if (e.code === 'Space') this.dashQueued = true;
      if (e.code === 'Escape' || e.code === 'KeyP') this.pauseQueued = true;
      if (e.code === 'KeyM') this.muteQueued = true;
      if (e.code === 'Digit1') this.switchTo = 0;
      if (e.code === 'Digit2') this.switchTo = 1;
      if (e.code === 'Digit3') this.switchTo = 2;
      if (e.code === 'KeyQ') this.cycleQueued -= 1;
      if (e.code === 'KeyE') this.cycleQueued += 1;
    }, { passive: false });

    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
      this.resetSticks();
    });
  }

  _bindMouse() {
    const move = (e) => {
      if (e.pointerType === 'touch') return;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    window.addEventListener('pointermove', move, { passive: true });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      this.mouse.down = true;
      this.mouseJustDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this._markTouch();
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button === 0) this.mouse.down = false;
    });
    window.addEventListener('pointercancel', () => { this.mouse.down = false; });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cycleQueued += e.deltaY > 0 ? 1 : -1;
    }, { passive: false });
  }

  _markTouch() {
    if (!this.isTouch) {
      this.isTouch = true;
      document.body.classList.add('touch');
      document.body.classList.remove('desktop');
    }
  }

  _bindTouchUI() {
    document.querySelectorAll('.joystick').forEach((el) => {
      const base = el.querySelector('.stick-base');
      const knob = el.querySelector('.stick-knob');
      const stick = el.dataset.stick === 'move' ? this.moveStick : this.aimStick;
      let pointerId = null;
      let cx = 0;
      let cy = 0;
      const radius = 40;

      const setFromEvent = (e) => {
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const len = Math.hypot(dx, dy);
        const cl = len > radius ? radius / len : 1;
        const ox = dx * cl;
        const oy = dy * cl;
        const nx = ox / radius;
        const ny = oy / radius;
        const mag = Math.hypot(nx, ny);
        stick.x = nx;
        stick.y = ny;
        stick.mag = mag;
        stick.active = mag > 0.12;
        knob.style.transform = `translate(${ox}px, ${oy}px)`;
      };

      const reset = () => {
        pointerId = null;
        stick.x = 0;
        stick.y = 0;
        stick.mag = 0;
        stick.active = false;
        knob.style.transform = 'translate(0px, 0px)';
        el.classList.remove('engaged');
      };

      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        this._markTouch();
        if (pointerId !== null) return;
        pointerId = e.pointerId;
        const r = base.getBoundingClientRect();
        cx = r.left + r.width / 2;
        cy = r.top + r.height / 2;
        el.classList.add('engaged');
        try { el.setPointerCapture(e.pointerId); } catch { /* ignored */ }
        setFromEvent(e);
      });
      el.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pointerId) return;
        e.preventDefault();
        setFromEvent(e);
      });
      const end = (e) => {
        if (e.pointerId !== pointerId) return;
        reset();
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('lostpointercapture', end);
    });

    document.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const action = el.dataset.action;
        if (action === 'reload') this.reloadQueued = true;
        if (action === 'dash') this.dashQueued = true;
        el.classList.add('pressed');
        setTimeout(() => el.classList.remove('pressed'), 110);
        if (window.navigator.vibrate) window.navigator.vibrate(8);
      });
    });
  }

  resetSticks() {
    this.moveStick.x = this.moveStick.y = this.moveStick.mag = 0;
    this.moveStick.active = false;
    this.aimStick.x = this.aimStick.y = this.aimStick.mag = 0;
    this.aimStick.active = false;
    document.querySelectorAll('.stick-knob').forEach((k) => { k.style.transform = 'translate(0px,0px)'; });
  }

  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (x !== 0 || y !== 0) {
      const l = Math.hypot(x, y);
      return { x: x / l, y: y / l, mag: 1, source: 'key' };
    }
    if (this.moveStick.active) {
      return { x: this.moveStick.x, y: this.moveStick.y, mag: clamp(this.moveStick.mag, 0, 1), source: 'stick' };
    }
    return { x: 0, y: 0, mag: 0, source: 'none' };
  }

  get aimsWithStick() { return this.aimStick.active && this.aimStick.mag > 0.2; }
  get firing() { return this.mouse.down || this.aimsWithStick; }

  endFrame() {
    this.reloadQueued = false;
    this.dashQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;
    this.switchTo = null;
    this.cycleQueued = 0;
    this.mouseJustDown = false;
  }
}
