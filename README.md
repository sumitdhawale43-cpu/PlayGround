# CIRCUIT MASTER

A neon logic-puzzle game about building real circuits. Thirty hand-built levels take you from a single lamp and cell to gated networks with switches, shared rails, and driver-conflict checks.

![HTML](https://img.shields.io/badge/HTML-single%20page-54f3ff?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla%20ES%20modules-65ffad?style=flat-square)
![Tests](https://img.shields.io/badge/engine%20tests-10%20passing-ffc35f?style=flat-square)

## Play

The game is a static site with no build step. Serve the repository root:

```bash
python3 -m http.server 3000
# or
npx serve .
```

Open `http://localhost:3000`.

## What is inside

- **A real circuit simulation** — batteries create high and ground rails; wires and closed switches form conductive nets; logic gates evaluate inputs; LEDs conduct anode to cathode and only into ground. Shorts, floating drivers, and conflicting gate outputs are rejected.
- **Thirty authored levels** across five chapters: Foundations, Gate Logic, Signal Theory, Networks, and Mastery.
- **Any valid solution** — progress validates the circuit itself, not a fixed list of wires.
- **Drag or tap wiring** — drag terminal to terminal on desktop; tap terminal A then terminal B on touch screens.
- **Animated current** — live traces pulse around a neon PCB with component glow, sparks, and synthesized audio.
- **Scoring and hints** — start at 1,000 points, spend 140 per hint, and earn up to three stars. Progress is saved to `localStorage`.
- **Campaign map, manual, and completion flow** — level unlocking, replay, score records, keyboard shortcuts, and a responsive layout down to phone widths.

## Controls

| Action | Input |
| --- | --- |
| Connect terminals | Drag, or tap one terminal then another |
| Toggle a switch | Click / tap it |
| Hint | `H` or the Hint button |
| Undo | `U` or the Undo button |
| Reset level | `R` or the Reset button |
| Cut mode | Cut button, then click a wire |
| Close a dialog | `Esc` |

## Tests

The engine and all authored solutions can be verified without a browser:

```bash
node --test tests/engine.test.mjs
```

The suite checks the 30-level catalogue, every authored solution, required controls, short detection, switch behavior, gate truth tables, duplicate wiring, and port geometry.

## Project layout

```text
index.html          App shell, HUD, dialogs
styles.css          Neon PCB design system and responsive layouts
js/app.js           Game state, pointer wiring, scoring, persistence
js/engine.js        Circuit graph simulation and validation
js/board.js         Canvas renderer, animation, and hit testing
js/levels.js        30 levels plus authored solutions and hints
js/audio.js         Synthesized Web Audio effects
tests/engine.test.mjs
```

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/sumitdhawale43-cpu/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/sumitdhawale43-cpu/PlayGround)

- 🎮 [Open the project](https://omgithub.com/sumitdhawale43-cpu/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=sumitdhawale43-cpu%2FPlayGround).
- 💻 [Explore the source](https://github.com/sumitdhawale43-cpu/PlayGround).
- 🛠️ [Check build runs](https://github.com/sumitdhawale43-cpu/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/sumitdhawale43-cpu/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/sumitdhawale43-cpu).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->
