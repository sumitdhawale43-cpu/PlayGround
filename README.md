# GRAVITY BREAK

A neon 2D anti-gravity platformer. Run, jump, and **reverse gravity** to walk on
floors and ceilings — dodge lasers, traps and moving hazards across **8
hand-designed levels** with checkpoints, collectibles and a fully polished
presentation layer.

## Play

Open `index.html` in any modern browser — no build step, no server required.
(Optionally serve it: `python3 -m http.server` inside this folder.)

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Run | `A` / `D` or `◀ ▶` | ◀ ▶ buttons |
| Jump | `W` / `↑` / `Space` / `Z` | ▲ button |
| Flip gravity | `Shift` / `X` / `K` | ⇵ button |
| Pause | `Esc` / `P` | ❚❚ button |
| Restart level | `R` | — |
| Toggle sound | `M` | pause menu |

**Tips**

- ◆ Collect energy shards for 100% runs; ⌂ pylons save checkpoints.
- Flip gravity *in mid-air* to fly from floor to ceiling and back.
- Laser walls blink red just before firing — time your runs.
- Ride moving platforms; you keep your footing while they travel.

## Architecture

```
games/gravity-break/
├── index.html          boot + DOM overlays (menus/HUD/touch pad)
├── css/style.css       neon UI styling
├── js/levels.js        declarative level data + tile compiler (DOM-free)
├── js/entities.js      player physics (AABB vs tile grid + platforms)
├── js/particles.js     pooled particle system
├── js/audio.js         WebAudio synth SFX + procedural music
├── js/input.js         keyboard + multi-touch controls
├── js/game.js          engine: loop, camera, renderer, states, saving
└── test/
    ├── validate.js     static checks, reachability BFS, physics smoke
    └── boot-test.js    headless integration test of the real game
```

## Tests

```
node test/validate.js    # level integrity + physics invariants
node test/boot-test.js   # full state-machine playthrough simulation
```

`validate.js` verifies, for every level: entity bounds, spike anchoring, no
unreachable goal/checkpoint/shard (a conservative BFS models walking, jumping
with real reach limits, gravity flips and moving-platform rides), plus a
randomized 1800-frame physics simulation per level (no NaN, no tunneling).
