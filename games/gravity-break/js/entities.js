/* ============================================================
   GRAVITY BREAK — entities & physics
   Player controller (AABB vs tile-grid + moving platforms),
   and moving platform update. Dependency-free.
   ============================================================ */
(function (root) {
  'use strict';

  var TILE = 32;
  var P = {
    W: 20, H: 30,
    MAX_SPEED: 330,
    ACCEL_GROUND: 2600,
    ACCEL_AIR: 1500,
    DECEL_GROUND: 2900,
    DECEL_AIR: 200,
    GRAVITY: 1500,
    MAX_FALL: 950,
    JUMP_V: 565,
    JUMP_CUT: 0.42,
    COYOTE: 0.1,
    BUFFER: 0.13
  };

  /* ---------- Moving platform ---------- */
  function Platform(def) {
    this.id = def.id;
    this.baseX = def.tx * TILE;
    this.baseY = def.ty * TILE;
    this.x = this.baseX; this.y = this.baseY;
    this.w = def.w; this.h = def.h;
    this.axis = def.axis;
    this.travel = def.travel;
    this.speed = def.speed;
    this.dir = 1;
    this.dx = 0; this.dy = 0;
  }

  Platform.prototype.rect = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };

  Platform.prototype.update = function (dt) {
    var px = this.x, py = this.y;
    var max = this.travel;
    if (this.axis === 'x') {
      this.x += this.speed * this.dir * dt;
      if (this.x > this.baseX + max) { this.x = this.baseX + max; this.dir = -1; }
      if (this.x < this.baseX) { this.x = this.baseX; this.dir = 1; }
      this.dx = this.x - px; this.dy = 0;
    } else {
      this.y += this.speed * this.dir * dt;
      if (this.y > this.baseY + max) { this.y = this.baseY + max; this.dir = -1; }
      if (this.y < this.baseY) { this.y = this.baseY; this.dir = 1; }
      this.dx = 0; this.dy = this.y - py;
    }
  };

  /* ---------- Player ---------- */
  function Player(startX, startY) {
    this.w = P.W; this.h = P.H;
    this.reset(startX, startY, 1);
  }

  Player.prototype.reset = function (x, y, gdir) {
    this.x = x - this.w / 2;
    this.y = y - this.h;
    this.vx = 0; this.vy = 0;
    this.gdir = gdir;                 // 1 = down, -1 = up
    this.grounded = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumpHeld = false;
    this.rider = null;
    this.face = 1;
    this.trail = [];
    this.trailT = 0;
    this.flipCd = 0;
    this.spawnVX = 0; this.spawnVY = 0;
  };

  Player.prototype.rect = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };

  /* tile solidity lookup callback provided by world:
     isSolid(px, py) -> bool, world is in pixels */
  Player.prototype.setWorld = function (world) {
    this.world = world; // { isSolidPx(px,py), plats: [...], onJump, onFlip, onLand }
  };

  function solidAt(world, px, py) {
    if (world.isSolidPx(px, py)) return true;
    for (var i = 0; i < world.plats.length; i++) {
      var p = world.plats[i];
      if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return true;
    }
    return false;
  }

  Player.prototype.update = function (dt, input) {
    var w = this.world;
    var left = input.left, right = input.right;

    // horizontal accel
    var dirIn = (right ? 1 : 0) - (left ? 1 : 0);
    if (dirIn !== 0) this.face = dirIn;
    var accel = this.grounded ? (dirIn !== 0 ? P.ACCEL_GROUND : P.DECEL_GROUND)
                              : (dirIn !== 0 ? P.ACCEL_AIR : P.DECEL_AIR);
    if (dirIn !== 0) {
      this.vx += dirIn * accel * dt;
      this.vx = Math.max(-P.MAX_SPEED, Math.min(P.MAX_SPEED, this.vx));
    } else {
      var s = Math.sign(this.vx);
      this.vx -= s * accel * dt;
      if (Math.sign(this.vx) !== s) this.vx = 0;
    }

    // gravity
    this.vy += P.GRAVITY * this.gdir * dt;
    var maxFall = P.MAX_FALL;
    if (this.vy * this.gdir > maxFall) this.vy = maxFall * this.gdir;

    // timers
    if (this.coyote > 0) this.coyote -= dt;
    if (this.jumpBuf > 0) this.jumpBuf -= dt;
    if (this.flipCd > 0) this.flipCd -= dt;

    // jump (buffered)
    if (input.jumpPressed) { this.jumpBuf = P.BUFFER; input.jumpPressed = false; }
    if (this.jumpBuf > 0 && (this.grounded || this.coyote > 0)) {
      this.vy = -P.JUMP_V * this.gdir;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.rider = null;
      if (w.onJump) w.onJump(this.x + this.w / 2, this.y + (this.gdir > 0 ? this.h : 0), this.gdir);
    }
    // variable jump height
    if (!input.jump && this.vy * this.gdir < 0) {
      this.vy *= Math.pow(P.JUMP_CUT, dt * 60 / 10);
    }

    // gravity flip
    if (input.flipPressed) {
      input.flipPressed = false;
      if (this.flipCd <= 0) {
        this.gdir *= -1;
        this.flipCd = 0.18;
        this.grounded = false;
        this.coyote = 0;
        this.rider = null;
        // small pop against new gravity for game feel
        this.vy = 120 * this.gdir;
        if (w.onFlip) w.onFlip(this.x + this.w / 2, this.y + this.h / 2, this.gdir);
      }
    }

    // ---- integrate & collide: X axis then Y axis ----
    var steps = Math.max(1, Math.ceil((Math.abs(this.vy) * dt) / (TILE * 0.8)));
    var sdt = dt / steps;
    for (var s = 0; s < steps; s++) {
      this.x += this.vx * sdt;
      this.collideX(w);
      var prevY = this.y;
      this.y += this.vy * sdt;
      this.collideY(w, prevY);
    }

    // trail
    this.trailT -= dt;
    if (this.trailT <= 0) {
      this.trailT = 0.028;
      this.trail.push({ x: this.x, y: this.y, g: this.gdir });
      if (this.trail.length > 10) this.trail.shift();
    }
  };

  Player.prototype.collideX = function (w) {
    var r = this.rect();
    if (this.vx > 0) {
      var edge = r.x + r.w;
      if (solidAt(w, edge, r.y + 2) || solidAt(w, edge, r.y + r.h / 2) || solidAt(w, edge, r.y + r.h - 2)) {
        this.x = Math.floor(edge / TILE) * TILE - r.w - 0.01;
        if (this.world.onWall) this.world.onWall();
        this.vx = 0;
      }
    } else if (this.vx < 0) {
      if (solidAt(w, r.x, r.y + 2) || solidAt(w, r.x, r.y + r.h / 2) || solidAt(w, r.x, r.y + r.h - 2)) {
        this.x = (Math.floor(r.x / TILE) + 1) * TILE + 0.01;
        if (this.world.onWall) this.world.onWall();
        this.vx = 0;
      }
    }
  };

  Player.prototype.collideY = function (w, prevY) {
    var r = this.rect();
    var wasGrounded = this.grounded;
    var movingDown = this.vy * this.gdir > 0;
    // sample bottom (in gravity direction) edge
    var footY = this.gdir > 0 ? r.y + r.h : r.y;
    var headY = this.gdir > 0 ? r.y : r.y + r.h;
    var landedTile = false;

    if (movingDown) {
      if (solidAt(w, r.x + 3, footY) || solidAt(w, r.x + r.w - 3, footY)) {
        var tileEdge = this.gdir > 0
          ? Math.floor(footY / TILE) * TILE          // top of solid tile
          : (Math.floor(footY / TILE) + 1) * TILE;   // bottom of solid tile (ceiling stand)
        if (this.gdir > 0) this.y = tileEdge - r.h - 0.01;
        else this.y = tileEdge + 0.01;
        this.land(w);
        landedTile = true;
      }
    } else {
      // moving against gravity (rising): bonk on whatever solid we cross
      if (solidAt(w, r.x + 3, headY) || solidAt(w, r.x + r.w - 3, headY)) {
        if (this.gdir > 0) this.y = (Math.floor(headY / TILE) + 1) * TILE + 0.01;   // top edge -> below tile
        else this.y = Math.floor(headY / TILE) * TILE - r.h - 0.01;                 // bottom edge -> above tile
        this.vy = 0;
        this.grounded = false;
      }
    }

    // moving platforms: swept landing on their faces (reliable for any speed)
    if (!landedTile) {
      for (var pi = 0; pi < w.plats.length; pi++) {
        var plat = w.plats[pi];
        if (r.x + r.w <= plat.x || r.x >= plat.x + plat.w) continue;
        if (this.gdir > 0 && movingDown) {
          var topFace = plat.y;
          var oldFoot = prevY + r.h, newFoot = r.y + r.h;
          if (oldFoot <= topFace + 0.6 && newFoot >= topFace) {
            this.y = topFace - r.h - 0.01;
            this.land(w);
            break;
          }
        } else if (this.gdir < 0 && movingDown) {
          var botFace = plat.y + plat.h;
          var oldHead = prevY, newHead = r.y;
          if (oldHead >= botFace - 0.6 && newHead <= botFace) {
            this.y = botFace + 0.01;
            this.land(w);
            break;
          }
        }
      }
    }

    if (!this.grounded) {
      // coyote: just left ground
      if (wasGrounded) this.coyote = P.COYOTE;
      // ground re-check: still supported?
      var supY = this.gdir > 0 ? r.y + r.h + 1 : r.y - 1;
      if (solidAt(w, r.x + 3, supY) || solidAt(w, r.x + r.w - 3, supY)) this.ground(w, true);
    }
  };

  Player.prototype.land = function (w) {
    if (this.vy * this.gdir > 260 && w.onLand) w.onLand(this.x + this.w / 2, this.gdir > 0 ? this.y + this.h : this.y, this.gdir, this.vy);
    this.vy = 0;
    this.ground(w, false);
  };

  Player.prototype.ground = function (w, soft) {
    this.grounded = true;
    this.coyote = 0;
    // check standing on a platform -> become rider
    this.rider = null;
    var r = this.rect();
    var footY = this.gdir > 0 ? r.y + r.h : r.y;
    for (var i = 0; i < w.plats.length; i++) {
      var p = w.plats[i];
      if (r.x + r.w > p.x && r.x < p.x + p.w) {
        if (this.gdir > 0 && Math.abs(footY - p.y) < 4) this.rider = p;
        if (this.gdir < 0 && Math.abs(footY - (p.y + p.h)) < 4) this.rider = p;
      }
    }
  };

  /* Push player out of platform bodies (called by world after platform move) */
  Player.prototype.resolvePlatforms = function (plats) {
    var r = this.rect();
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      if (r.x < p.x + p.w && r.x + r.w > p.x && r.y < p.y + p.h && r.y + r.h > p.y) {
        // overlap: push along smallest penetration axis
        var penL = (r.x + r.w) - p.x;          // push player left
        var penR = (p.x + p.w) - r.x;          // push player right
        var penT = (r.y + r.h) - p.y;          // push player up
        var penB = (p.y + p.h) - r.y;          // push player down
        var m = Math.min(penL, penR, penT, penB);
        if (m === penT) {
          this.y = p.y - r.h - 0.01;
          if (this.gdir > 0) { this.vy = Math.max(0, this.vy); this.ground(this.world, true); }
          else { this.vy = Math.min(0, this.vy); }
        } else if (m === penB) {
          this.y = p.y + p.h + 0.01;
          if (this.gdir < 0) { this.vy = Math.min(0, this.vy); this.ground(this.world, true); }
          else { this.vy = Math.max(0, this.vy); }
        } else if (m === penL) {
          this.x = p.x - r.w - 0.01;
          if (this.vx > 0) this.vx = 0;
        } else {
          this.x = p.x + p.w + 0.01;
          if (this.vx < 0) this.vx = 0;
        }
        r = this.rect();
      }
    }
  };

  /* pixel-space hurt box (slightly smaller than body) */
  Player.prototype.hurtRect = function () {
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 8 };
  };

  Player.prototype.centerX = function () { return this.x + this.w / 2; };
  Player.prototype.centerY = function () { return this.y + this.h / 2; };

  var api = {
    Player: Player,
    Platform: Platform,
    PHYS: P
  };
  root.GBEntities = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
