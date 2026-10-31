// SHADOW NINJA — unified keyboard, touch, and gamepad input

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump',
  KeyJ: 'attack', KeyX: 'attack',
  KeyK: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash',
  KeyL: 'burst', KeyE: 'burst',
  Escape: 'pause', KeyP: 'pause',
  KeyM: 'mute',
  KeyR: 'restart',
  Enter: 'confirm',
};

export class Input {
  constructor() {
    this.keys = new Set();
    this.actions = new Set();
    this.edges = new Set();
    this.touch = false;
    this.joyX = 0;
    this.joyY = 0;
    this.joyActive = false;
    this.gamepad = null;
    this.padPrev = [];
    this.enabled = true;
    this._bindKeyboard();
    this._bindGamepad();
    this._bindTouch();
    this._bindMouse();
  }

  get coarse() {
    return (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      if (
        ['jump', 'attack', 'dash', 'burst', 'left', 'right', 'up', 'down', 'pause'].includes(action)
      ) {
        e.preventDefault();
      }
      if (e.repeat) return;
      this.keys.add(action);
      this.actions.add(action);
      this.edges.add(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      this.keys.delete(action);
      this.actions.delete(action);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.actions.clear();
    });
  }

  _bindGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepad = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
    });
  }

  _bindMouse() {
    window.addEventListener('mousedown', (e) => {
      if (e.target && e.target.id === 'game' && e.button === 0) {
        this.actions.add('attack');
        this.edges.add('attack');
      }
    });
  }

  _bindTouch() {
    this.touch = this.coarse;
    const base = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    if (!base || !knob) return;
    const max = 44;
    let id = null;
    let ox = 0, oy = 0;

    const apply = (e) => {
      let dx = e.clientX - ox;
      let dy = e.clientY - oy;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const nx = dx / max;
      const ny = dy / max;
      this.joyX = Math.abs(nx) > 0.16 ? nx : 0;
      this.joyY = Math.abs(ny) > 0.2 ? ny : 0;
      if (this.joyX !== 0 || this.joyY !== 0) this.joyActive = true;
    };

    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      base.setPointerCapture(id);
      const r = base.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top + r.height / 2;
      base.classList.add('active');
      apply(e);
    });
    base.addEventListener('pointermove', (e) => {
      if (id !== e.pointerId) return;
      e.preventDefault();
      apply(e);
    });
    const end = (e) => {
      if (id !== e.pointerId) return;
      id = null;
      this.joyX = 0;
      this.joyY = 0;
      this.joyActive = false;
      knob.style.transform = 'translate(0px, 0px)';
      base.classList.remove('active');
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
    base.addEventListener('lostpointercapture', end);

    document.querySelectorAll('[data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      let pressed = false;
      const down = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pressed) return;
        pressed = true;
        try { btn.setPointerCapture(e.pointerId); } catch {}
        this.actions.add(action);
        this.edges.add(action);
        btn.classList.add('pressed');
      };
      const up = (e) => {
        if (!pressed) return;
        e.preventDefault();
        pressed = false;
        this.actions.delete(action);
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  pollGamepad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let pad = null;
    for (const p of pads) {
      if (p && p.connected) { pad = p; break; }
    }
    if (!pad) return;
    const axis = pad.axes[0] || 0;
    if (Math.abs(axis) > 0.22) {
      this.joyX = axis;
      if (axis < -0.4 && !this.padPrev[14]) { this.actions.add('left'); this.edges.add('left'); }
      if (axis > 0.4 && !this.padPrev[15]) { this.actions.add('right'); this.edges.add('right'); }
    }
    const btnMap = { 0: 'jump', 2: 'attack', 1: 'dash', 3: 'burst', 9: 'pause' };
    for (const [idx, action] of Object.entries(btnMap)) {
      const b = pad.buttons[idx];
      const down = b && (b.pressed || b.value > 0.4);
      if (down && !this.padPrev[idx]) {
        this.edges.add(action);
        this.actions.add(action);
      }
      if (!down && this.padPrev[idx]) this.actions.delete(action);
      this.padPrev[idx] = down;
    }
  }

  beginFrame() {
    this.pollGamepad();
  }

  down(action) {
    if (this.keys.has(action) || this.actions.has(action)) return true;
    if (action === 'left' && this.joyX < -0.2) return true;
    if (action === 'right' && this.joyX > 0.2) return true;
    if (action === 'up' && this.joyY < -0.35) return true;
    if (action === 'down' && this.joyY > 0.35) return true;
    return false;
  }

  pressed(action) {
    return this.edges.has(action);
  }

  endFrame() {
    this.edges.clear();
  }

  moveX() {
    let x = this.joyX;
    if (this.down('left')) x -= 1;
    if (this.down('right')) x += 1;
    return Math.max(-1, Math.min(1, x));
  }

  moveY() {
    let y = this.joyY;
    if (this.down('up')) y -= 1;
    if (this.down('down')) y += 1;
    return Math.max(-1, Math.min(1, y));
  }

  rumble(strength = 0.4) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (p && p.vibrationActuator) {
        try {
          p.vibrationActuator.playEffect('dual-rumble', {
            duration: 90,
            strongMagnitude: strength,
            weakMagnitude: strength * 0.5,
          });
        } catch {}
      }
    }
  }
}
