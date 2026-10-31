# NIGHTFALL // Sector 7

A tactical first-person survival shooter that runs entirely in the browser. Built with **Three.js**, procedural textures and synthesized audio — no external art or sound assets.

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

## Play

Hold the port perimeter against escalating waves of hostiles. Headshots deal critical damage, the rifle auto-reloads when empty, and ammunition plus frag charges are restocked between waves. Use containers, crates and barriers for cover — health regenerates after a short break in contact.

### Desktop controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| Mouse | Look / aim |
| `Left mouse` | Fire |
| `Right mouse` | Aim down sights |
| `Shift` | Sprint |
| `Space` | Jump |
| `C` | Toggle crouch |
| `R` | Reload |
| `G` | Throw frag grenade |
| `Esc` | Pause |

### Mobile

- Left thumbstick to move.
- Drag anywhere on the scene to look and aim.
- **FIRE** is automatic while held. Use **ADS**, **R**, **↑** and **◈** for aim, reload, jump and grenades.
- Safe-area insets are respected on notched phones. Best played in landscape.

## Tech

- Three.js WebGL renderer with ACES tone mapping, soft shadows, bloom post-processing and a procedural dusk sky.
- Procedural asphalt, concrete, corrugated steel, wood and window textures generated at load time.
- Stylized soldier models with animated limbs, hitboxes, line-of-sight checks, cover-aware steering and wave scaling.
- Rifle viewmodel with ADS alignment, recoil, sway, muzzle flash, tracers, shell ejection, impact decals and sparks.
- Synthesized Web Audio: gunfire, reloads, hitmarkers, footsteps, explosions, ambience, siren cues.
- Responsive HUD with radar, compass, kill feed, damage direction and touch controls.
- Quality settings (high/medium/low) persisted in `localStorage`.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview
```

The OMGithub runtime runs `start.sh`, which installs dependencies, builds with a relative base and serves `dist/`.
