# PERIPHERY

A first-person browser horror game built around one rule: **it only moves when you are not looking at it.**

You are inside SITE 07's abandoned observation wing. Recover three echoes, then return to the gate. The thing in the halls freezes whenever it enters your view — but holding its gaze tears reality apart. The longer you stare, the more the room glitches, whispers, bends, and eventually collapses.

## Play

There is no build step and no dependency install. Serve the folder over HTTP:

```bash
./start.sh
# or
python3 -m http.server 8080
```

Then open the printed URL. Audio starts after your first interaction; headphones are recommended.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | `WASD` / arrow keys | left stick |
| Look | mouse (click to capture) | drag the world |
| Touch / interact | `E` | `TOUCH` |
| Run | `Shift` | `RUN` |
| Pause | `Esc` | `II` |
| Mute | `M` | sound button |

## The rules

1. The monster cannot move while you can see it.
2. Staring drains REALITY. Looking away lets it slowly recover.
3. Low reality corrupts the facility and can kill you outright.
4. Collect all three echoes to unlock the gate, then reach it.

## Tech

- Canvas raycaster with procedural textures and sprites
- A* pathfinding for the stalker
- Web Audio ambience and effects synthesized at runtime
- Responsive layout with pointer-lock and touch controls
- Vanilla ES modules, no framework or network assets

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
