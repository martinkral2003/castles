# Brimfall

A real-time conquest game for phones and browsers. You are a demon lord fighting for the thrones of Hell.
Castles breed minions for free; souls (from Souls-mode castles, kills, springs and loot) are the only currency and buy everything else.
Hold a road to muster an army, march on rival castles, draw research cards, hire a lord, and win by conquest or by opening the Hellgate.

(Formerly *Keepfall*, a medieval castle game. The redesign is described in `DESIGN.md`.)

## Quick start
```bash
npm run build      # src/* -> www/index.html and docs/index.html
open docs/index.html   # or just double-click it
```
Everything runs from one self-contained HTML file. No dependencies are needed to build or play.

## Tests and simulations (Node 18+)
```bash
npm test                 # full bot games across player counts and map types, plus focused mechanics checks
npm run sim:balance      # economic (Harvester) vs aggressive bots
npm run sim:research     # value of research cards for identical bots
npm run sim:length       # bigger games: length and stalls
npm run sim:usage        # what the bots build and earn, per personality
npm run test:p2p -- docs/index.html   # two headless pages play a game over WebRTC (needs Playwright)
```

## Layout
| Path | What it is |
|---|---|
| `src/core.js` | Game engine: map generation, simulation, soldiers, supply, souls, castle towers, cards, spells, lords, bots, sync encoding |
| `src/art.js` | Procedural castle (with tower rings), hovel, spring and Hellgate sprites, terrain builder |
| `src/units.js` | Procedural unit figures (minions, demons, lords) and corpses |
| `src/net.js` | Serverless multiplayer: WebRTC with invite/reply codes (works on GitHub Pages) |
| `src/head.js` | Menus, lobby, campaign, daily challenge, replays, online glue |
| `src/panel.js` | Commands, castle panel, research cards, spell bar, Send chips |
| `src/tail.js` | Canvas renderer, effects, fog, HUD, gestures |
| `src/shell.html`, `src/game.html`, `src/game.css` | Page shell and styles; `/*CORE*/`, `/*UI*/` and the game placeholders are filled by the build |
| `tests/` | Headless simulations and mechanics checks that load `src/core.js` |
| `tools/` | Dev helpers: headless screenshots (`shot.cjs`) and a flow smoke test (`smoke.cjs`); both need Playwright |
| `www/` | Build output used by the Android app (Capacitor) |
| `docs/` | Build output for GitHub Pages |

See `DESIGN.md` for the rules and contracts, `CLAUDE.md` for conventions and open work, and `PLAY_STORE.md` for publishing.
