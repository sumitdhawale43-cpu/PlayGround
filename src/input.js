const KEY_ACTIONS = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowDown: "down", KeyS: "down",
  ArrowUp: "jump", KeyW: "jump", Space: "jump",
  KeyJ: "attack", KeyZ: "attack", KeyX: "attack",
  ShiftLeft: "dash", ShiftRight: "dash", KeyK: "dash",
};

const PREVENT = new Set([
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
  "KeyA", "KeyD", "KeyW", "KeyS", "KeyJ", "KeyZ", "KeyX", "KeyK",
  "ShiftLeft", "ShiftRight",
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = { left: false, right: false, down: false, jump: false, attack: false, dash: false };
    this.pressed = { left: false, right: false, down: false, jump: false, attack: false, dash: false, pause: false, mute: false };
    this.touch = { left: false, right: false };
    this.touchAxis = 0;
    this.touchActive = false;
    this.onPause = null;
    this.onMute = null;
    this.stickPointer = null;
    this.stickCenter = { x: 0, y: 0 };
    this.stickRadius = 44;
    this._bindKeyboard();
    this._bindTouch();
    this._bindMouse();
  }

  _bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        if (!e.repeat) {
          this.pressed.pause = true;
          this.onPause?.();
        }
        e.preventDefault();
        return;
      }
      if (e.code === "KeyM") {
        if (!e.repeat) this.onMute?.();
        return;
      }
      if (e.code === "KeyR") {
        if (!e.repeat) this.pressed.retry = true;
      }
      const action = KEY_ACTIONS[e.code];
      if (action) {
        if (PREVENT.has(e.code)) e.preventDefault();
        if (!e.repeat) this._press(action);
        else this.held[action] = true;
      }
    }, { passive: false });

    window.addEventListener("keyup", (e) => {
      const action = KEY_ACTIONS[e.code];
      if (action) this.held[action] = false;
    });

    window.addEventListener("blur", () => this.releaseAll());
  }

  _bindMouse() {
    this.canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      if (e.button === 0) this._press("attack");
    });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  _bindTouch() {
    const controls = document.getElementById("touch-controls");
    const stick = document.getElementById("stick");
    const knob = document.getElementById("stick-knob");
    if (!controls || !stick || !knob) return;

    const coarse = window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    this.isCoarse = !!coarse;
    if (!coarse) return;

    const updateStick = (e) => {
      const dx = e.clientX - this.stickCenter.x;
      const dy = e.clientY - this.stickCenter.y;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, this.stickRadius);
      const nx = (dx / len) * clamped;
      const ny = (dy / len) * clamped;
      knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      let axis = nx / this.stickRadius;
      if (Math.abs(axis) < 0.16) axis = 0;
      this.touchAxis = Math.max(-1, Math.min(1, axis * 1.25));
      this.touch.left = this.touchAxis < -0.05;
      this.touch.right = this.touchAxis > 0.05;
      if (Math.abs(this.touchAxis) > 0.55) {
        if (!this._stickDashSent && e.pointerId === this.stickPointer) {
          this._stickDashSent = false;
        }
      }
    };

    stick.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.stickPointer = e.pointerId;
      stick.setPointerCapture?.(e.pointerId);
      const r = stick.getBoundingClientRect();
      this.stickCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      this.stickRadius = r.width * 0.38;
      updateStick(e);
    });
    stick.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.stickPointer) return;
      e.preventDefault();
      updateStick(e);
    });
    const endStick = (e) => {
      if (e.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.touchAxis = 0;
      this.touch.left = this.touch.right = false;
      knob.style.transform = "translate(-50%, -50%)";
    };
    stick.addEventListener("pointerup", endStick);
    stick.addEventListener("pointercancel", endStick);
    stick.addEventListener("lostpointercapture", endStick);

    const bindButton = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      let pid = null;
      const down = (e) => {
        e.preventDefault();
        pid = e.pointerId;
        el.setPointerCapture?.(e.pointerId);
        el.classList.add("pressed");
        this._press(action);
      };
      const up = (e) => {
        if (pid !== null && e.pointerId !== pid) return;
        pid = null;
        el.classList.remove("pressed");
        this.held[action] = false;
      };
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("lostpointercapture", up);
    };
    bindButton("touch-jump", "jump");
    bindButton("touch-attack", "attack");
    bindButton("touch-dash", "dash");
  }

  setTouchVisible(visible) {
    this.touchActive = visible;
    const el = document.getElementById("touch-controls");
    if (el) el.classList.toggle("active", visible && !!this.isCoarse);
  }

  _press(action) {
    if (!(action in this.held)) return;
    this.pressed[action] = true;
    this.held[action] = true;
    if (action === "jump") this.pressed.jumpAt = performance.now();
  }

  consume(action) {
    if (this.pressed[action]) {
      this.pressed[action] = false;
      return true;
    }
    return false;
  }

  releaseAll() {
    for (const k of Object.keys(this.held)) this.held[k] = false;
    this.touchAxis = 0;
    this.touch.left = this.touch.right = false;
  }

  get axis() {
    let a = 0;
    if (this.held.left) a -= 1;
    if (this.held.right) a += 1;
    if (this.touch.left) a -= Math.abs(this.touchAxis);
    if (this.touch.right) a += Math.abs(this.touchAxis);
    return Math.max(-1, Math.min(1, a));
  }

  get jumpHeld() { return this.held.jump; }
  get attackHeld() { return this.held.attack; }
  get dashHeld() { return this.held.dash; }

  clearFramePresses() {
    for (const key of Object.keys(this.pressed)) {
      if (key !== "pause" && key !== "retry") this.pressed[key] = false;
    }
    this.pressed.pause = false;
    this.pressed.retry = false;
  }
}
