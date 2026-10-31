/* ============================================================
   GRAVITY BREAK — input manager
   Keyboard (desktop) + multi-touch on-screen pad (mobile).
   Exposes a shared input state object read by the player.
   ============================================================ */
(function (root) {
  'use strict';

  var state = {
    left: false, right: false,
    jump: false, jumpPressed: false,
    flipPressed: false
  };

  var cb = { onPause: null, onRestart: null, onSound: null, anyKey: null };
  var touchFlags = { left: false, right: false, jump: false };

  function jumpPress() { state.jumpPressed = true; state.jump = true; }
  function jumpRelease() { state.jump = false; }
  function flipPress() { state.flipPressed = true; }

  function compute() {
    state.left = key.left || touchFlags.left;
    state.right = key.right || touchFlags.right;
  }

  var key = { left: false, right: false };

  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
    ShiftLeft: 'flip', ShiftRight: 'flip', KeyX: 'flip', KeyK: 'flip',
    Escape: 'pause', KeyP: 'pause',
    KeyR: 'restart', KeyM: 'sound'
  };

  function handleKey(e, down) {
    var action = KEYMAP[e.code];
    if (!action) return;
    if (down && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    if (action === 'left') { key.left = down; compute(); }
    else if (action === 'right') { key.right = down; compute(); }
    else if (action === 'jump') { if (down && !state.jump) jumpPress(); if (!down) jumpRelease(); }
    else if (action === 'flip') { if (down) flipPress(); }
    else if (down && action === 'pause' && cb.onPause) cb.onPause();
    else if (down && action === 'restart' && cb.onRestart) cb.onRestart();
    else if (down && action === 'sound' && cb.onSound) cb.onSound();

    if (down && cb.anyKey) cb.anyKey();
  }

  document.addEventListener('keydown', function (e) { handleKey(e, true); }, { passive: false });
  document.addEventListener('keyup', function (e) { handleKey(e, false); });

  /* ----- touch pad ----- */
  function bindHold(el, on, off) {
    if (!el) return;
    var active = false;
    var start = function (e) {
      e.preventDefault();
      if (active) return;
      active = true;
      el.classList.add('pressed');
      on();
      if (cb.anyKey) cb.anyKey();
    };
    var end = function (e) {
      if (!active) return;
      e.preventDefault();
      active = false;
      el.classList.remove('pressed');
      off();
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindTap(el, fn) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      fn();
      if (cb.anyKey) cb.anyKey();
    });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function initTouch() {
    bindHold(document.getElementById('tc-left'), function () { touchFlags.left = true; compute(); }, function () { touchFlags.left = false; compute(); });
    bindHold(document.getElementById('tc-right'), function () { touchFlags.right = true; compute(); }, function () { touchFlags.right = false; compute(); });
    bindHold(document.getElementById('tc-jump'), jumpPress, jumpRelease);
    bindTap(document.getElementById('tc-flip'), flipPress);
  }

  function isTouchDevice() {
    return ('ontouchstart' in root) ||
      (navigator.maxTouchPoints > 0) ||
      (root.matchMedia && matchMedia('(pointer: coarse)').matches);
  }

  root.GBInput = {
    state: state,
    cb: cb,
    initTouch: initTouch,
    isTouchDevice: isTouchDevice,
    jumpPress: jumpPress,
    flipPress: flipPress,
    _key: key
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GBInput;
})(typeof globalThis !== 'undefined' ? globalThis : this);
