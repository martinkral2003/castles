# Brimfall — notes for Claude

Real-time demon-lord conquest for phones (portrait-first) and browsers. Re-themed and rebuilt (Oct 2026) from *Keepfall*, a medieval
castle game that began as a claude.ai artifact ("Holdfast", v1–v19). Single self-contained HTML output; keep it that way
(no external assets, no CDNs, no web fonts, no sound yet). `DESIGN.md` is the design record and the API/DOM contract: read it before
changing rules, the engine API or the UI structure.

## Workflow
- Edit files in `src/`, then `npm run build`. Never hand-edit `www/` or `docs/`. `node build.mjs --out <dir>` builds elsewhere (scratch builds).
- After engine changes run `npm test`; after balance changes also `npm run sim:balance` and `npm run sim:length`.
- `src/core.js` must stay loadable in Node (tests `require` it) and in the browser.
- Keep the sync encoding (`encode`/`decodeInto`, soldier 6-char base64 packing) backward-consistent within a release; replays use it too.
- `tools/shot.cjs` (headless screenshot) and `tools/smoke.cjs` (flow smoke test) need Playwright; set `PLAYWRIGHT_DIR` to a playwright package if it is not found.
  Look at the pictures when you change art or UI.
- The repo lives in WSL. From a Windows shell run Node through `wsl.exe -d Ubuntu-24.04 -e bash -lc 'cd ~/coding/keepfall && …'`.

## Architecture
- **core.js**: `newGame(cfg)`, `step(G, dt)`, castles/edges graph (planar, dense, many routes), soldiers (individual units on roads with a spatial grid),
  supply, Souls mode, kill souls, castle towers, research cards, spells, lords, Hellgate, bots (`botThink`, fog-limited via `botView`), encoding for online sync.
- **art.js**: cached castle/hovel/spring sprites (two resolutions, with the castle tower ring), terrain builder with themes (ash/frost/sulfur), Hellgate, banners.
- **units.js**: unit figures (minion, lesser demon, greater demon, lord), corpses.
- **head.js**: screens, setup options, campaign (6 missions + tutorial), daily challenge, replays, online lobby, game over.
- **panel.js** (+ `game.html`, `game.css`): commands, Send chips, spell bar (3 spells + Research), two-card overlay, castle panel (Army/Souls toggle, towers, paths).
- **tail.js**: canvas renderer, effects, fog, HUD update, gestures, alerts, stats.
- Online model: the **host's device runs the simulation**; clients send commands and render snapshots (~10/s).
  Transport is currently the claude.ai artifact room API (`ROOM.presence`, `peers`), which does not exist outside Claude.
  To ship online play, write a small adapter with the same shape on top of a WebSocket relay (game logic stays on the host).

## Mechanics (revision 2, 2026-10-03; DESIGN.md has the numbers)
- Castles breed minions free up to a level cap and a global army cap, both counted in **supply** (minion 1, lesser 2, greater 5, lord 8). Souls are the only currency.
- Souls come from: a per-castle **Army / Souls** toggle (Souls mode stops breeding and mines souls), **kills** (small, victim gets 50% back, capped per 10 s),
  **soul springs** (fairly placed, guarded) and Soul Well castles, and capture loot. No altars, sacrifice, pilgrims, promotion or Summon.
- Units: Minion (any castle), Lesser and Greater demon (**Spawner** castles only, greater are rare), Lord (hired one per **Citadel**, aura).
- Castles: **three levels** (Throne too); a level-3 **path**: Soul Well / Citadel (walled, defence, lord) / Spawner (fast breeding, demons). **Castle towers** (`c.tl` 0-3,
  one purchase builds a ring that shoots nearby enemies) replace road spires.
- Research: one tap draws two cards (price `40*1.12^n`), 17 cards; card power is tiered by draws taken (weak early, strong late). Two spells from the start: Horde Boost (global), Spies.
- Combat: veterans, walls need siege (greater demons, lords, Siegebreakers card), muster limit 30+30/level.
- Map: 8 types, easy hovels near Thrones and a walled-fortress core (towers level 2), fair guarded springs, day/night, fog.
- Victory: take every rival Throne, or finish the Hellgate (5 stages) and hold the Throne 4 minutes (option can disable).

## Tests and sims (all Node, no deps; they `require` src/core.js)
- `npm test`: `tests/mechanics.cjs` (scripted rule checks) then `tests/games.cjs` (8 bot games: no NaN, garrison sums, encode size).
- `npm run sim:length` (32 bot games, finish rate and median), `sim:balance` (Harvester vs Aggressive duels, N=60), `sim:usage` (what bots build, per personality),
  `sim:research` (win rate of a bot that starts with 2 stacks of each card; parallel). `TUNE='{"SY":3,...}'` overrides engine constants for sweeps (see DESIGN.md §2).
- Run long sims through `bash -lc` in the background: they take 1-3 minutes.

## Status and open work
1. **Balance** (2026-10-03 pass, final defaults): 32 bot games with 4-6 players: 0 unfinished, median about 19 min, about half end by Hellgate. Harvester vs Aggressive duels split
   25-26 over 60 games (three-level revision), but about 10% of duels still stall at 30 min (mutual Hellgate turtling). Cards sit in a 59-69% win-rate band (`sim:research`, control 56%); lord, tower and spell cards
   read lower because bots rarely use those systems. Not replayed by hand: campaign missions and the tutorial (only started by the smoke test). Bots rarely hire lords or build Spawners.
2. **Multiplayer relay** for builds outside Claude (see Architecture).
3. **Sound** (portals and stores expect it; none so far).
4. **Name check**: "Soulfall" was dropped because it is taken (Hell-themed ARPG on Steam by King's Crown Studio, 2025; a 2015 board game; an itch.io title).
   "Brimfall" had no game/app hits in web searches on 2026-10-02 (a web search, not a trademark search). Confirm on Google Play, the App Store and the USPTO/EUIPO registers before launch.
5. Ideas not built: more spells, lord abilities, leaders as unlocks/meta-progression, faction asymmetry, ranked online.
