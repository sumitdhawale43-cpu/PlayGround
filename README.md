# The Remembering

A playable, no-build browser survival prototype built around one idea: **the world remembers everything you do.**

The valley is procedurally generated from a seed. You gather, hunt, craft, trade, and fight — and every deed is written into a persistent ledger. NPCs repeat what they have heard, settlements change their opinion of you, regions carry scars, and the Hollow adapt their tactics to the way you fight. When you die, the ledger does not close: a new wanderer inherits the world the last one made.

## Play

Open the project through OMGithub, or serve the folder with any static file server and visit it in a browser:

```bash
python3 -m http.server 3002
```

Then open `http://localhost:3002/`. No build step, framework, or external asset is required.

## Controls

| Input | Action |
| --- | --- |
| `WASD` / arrows | Move |
| Mouse | Aim |
| Left click | Strike / fire |
| `E` | Interact, gather, talk, loot |
| `1`–`4` | Select tool |
| `C` | Craft |
| `J` | Open the ledger |
| `Shift` | Crouch |
| `Space` | Dodge |
| `Q` | Eat |
| `Esc` | Close panels / pause |

Phones and tablets get a virtual joystick and touch action buttons; touch mode can also be toggled from the pause menu.

## What remembers

- **Deeds** — every kill, gift, craft, shrine, theft, and death is timestamped and attributed to a region.
- **Witnesses** — nearby NPCs carry word of what they saw.
- **Reputation** — each settlement tracks how it feels about you.
- **Regional scars** — scorched ground, hunted-out woods, Hollow hunting grounds.
- **Doctrines** — six enemy adaptations unlock from your habits: Shieldwall (ranged), Slipstep (melee), Sappers (traps), Lantern Wardens (stealth), Scent Hounds (escapes), and Ashwalkers (fire).
- **Legacy** — dead wanderers stay in the ledger, and a new character inherits world memory plus a small max-health bonus at higher legend tiers.

Progress is stored in `localStorage` under `the-remembering-save-v1`.

## Source map

- `index.html` — HUD, overlays, title, touch controls
- `styles.css` — responsive layout and visual design
- `src/game.js` — game loop, combat, crafting, quest, persistence
- `src/world.js` — seeded terrain, regions, points of interest, resources
- `src/memory.js` — persistent ledger, reputation, doctrines, rumors
- `src/entities.js` — player, enemies, animals, NPCs, adaptive AI
- `src/render.js` — painterly canvas renderer, lighting, weather, minimap
- `src/ui.js` — DOM panels, toasts, journal, dialogue, death screen
- `src/audio.js` — synthesized ambience and effects
- `src/util.js` — RNG, noise, math, palette helpers

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
