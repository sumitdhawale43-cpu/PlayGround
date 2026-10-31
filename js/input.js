/* ============================================================
   Keyboard + multi-touch input with smoothed steering output.
   ============================================================ */

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'throttle', KeyW: 'throttle',
  ArrowDown: 'brake', KeyS: 'brake',
  Space: 'handbrake',
  ShiftLeft: 'nitro', ShiftRight: 'nitro', KeyN: 'nitro',
};

export class Input {
  constructor() {
    this.keys = new Set();
    this.pointers = new Map();     // pointerId -> control name
    this.touchHeld = {};
    this.steer = 0;
    this.onKey = null;             // callback(code, event)
    this.usedTouch = false;
  }

  attach(root, touchRoot) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) {
        if (KEYMAP[e.code] || e.code === 'Space') e.preventDefault();
        return;
      }
      this.keys.add(e.code);
      if (KEYMAP[e.code]) e.preventDefault();
      if (this.onKey) this.onKey(e.code, e);
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (KEYMAP[e.code]) e.preventDefault();
    }, { passive: false });

    window.addEventListener('blur', () => this.releaseAll());

    if (touchRoot) {
      const buttons = touchRoot.querySelectorAll('[data-ctl]');
      buttons.forEach((btn) => {
        const ctl = btn.dataset.ctl;
        const press = (e) => {
          e.preventDefault();
          this.usedTouch = true;
          try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          this.pointers.set(e.pointerId, ctl);
          this.touchHeld[ctl] = true;
          btn.classList.add('on');
          if (this.onTouchStart) this.onTouchStart(ctl);
        };
        const release = (e) => {
          const held = this.pointers.get(e.pointerId);
          if (!held) return;
          this.pointers.delete(e.pointerId);
          let still = false;
          for (const v of this.pointers.values()) if (v === held) still = true;
          if (!still) this.touchHeld[held] = false;
          btn.classList.remove('on');
        };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
      });
      window.addEventListener('pointerup', (e) => {
        if (this.pointers.has(e.pointerId)) {
          const ctl = this.pointers.get(e.pointerId);
          this.pointers.delete(e.pointerId);
          let still = false;
          for (const v of this.pointers.values()) if (v === ctl) still = true;
          if (!still) this.touchHeld[ctl] = false;
          const el = touchRoot.querySelector(`[data-ctl="${ctl}"]`);
          if (el) el.classList.remove('on');
        }
      });
    }
  }

  releaseAll() {
    this.keys.clear();
    this.pointers.clear();
    for (const k of Object.keys(this.touchHeld)) this.touchHeld[k] = false;
    document.querySelectorAll('.tbtn.on').forEach((b) => b.classList.remove('on'));
  }

  held(name) {
    if (this.touchHeld[name]) return true;
    for (const code in KEYMAP) {
      if (KEYMAP[code] === name && this.keys.has(code)) return true;
    }
    return false;
  }

  /** smoothed controller output for the player's car */
  control(dt) {
    const target = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    const rate = target === 0 ? 9.5 : 7.2;
    const d = target - this.steer;
    const step = rate * dt;
    this.steer += Math.max(-step, Math.min(step, d));

    let throttle = 0;
    if (this.held('throttle')) throttle = 1;
    else if (this.held('brake')) throttle = -1;

    return {
      steer: this.steer,
      throttle,
      nitro: this.held('nitro'),
      handbrake: this.held('handbrake'),
    };
  }

  resetSteer() { this.steer = 0; }
}
