# Keepfall

A real-time castle strategy game for phones and browsers. Hold a road to muster an army, march on rival castles,
research, build, and win by conquest or by finishing a Wonder.

## Quick start
```bash
npm run build      # src/* -> www/index.html and docs/index.html
open docs/index.html   # or just double-click it
```
Everything runs from one self-contained HTML file. No dependencies are needed to build or play.

## Tests and simulations (Node 18+)
```bash
npm test                 # 8 full bot games across player counts and map types
npm run sim:balance      # 60 games: economic vs aggressive bots
npm run sim:research     # value of research for identical bots
npm run sim:length       # 32 bigger games: length and stalls
```

## Layout
| Path | What it is |
|---|---|
| `src/core.js` | Game engine: map generation, simulation, soldiers, bots, research, sync encoding |
| `src/art.js` | Illustrated sprites and terrain, drawn with canvas |
| `src/head.js` | Menus, lobby, campaign, daily challenge, replays, online glue |
| `src/tail.js` | Renderer, input, castle panel, effects, research screen |
| `src/shell.html` | Page shell and CSS; `/*CORE*/` and `/*UI*/` are replaced by the build |
| `tests/` | Headless simulations that load `src/core.js` |
| `www/` | Build output used by the Android app (Capacitor) |
| `docs/` | Build output for GitHub Pages |

See `CLAUDE.md` for the design, mechanics and open work, and `PLAY_STORE.md` for publishing.
