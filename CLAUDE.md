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
- `tools/shot.cjs` (headless screenshot), `tools/smoke.cjs` (flow smoke test) and `tools/p2p-test.cjs` (two pages play over WebRTC) need Playwright; set `PLAYWRIGHT_DIR` to a playwright package if it is not found.
  Look at the pictures when you change art or UI.
- The repo lives in WSL. From a Windows shell run Node through `wsl.exe -d Ubuntu-24.04 -e bash -lc 'cd ~/coding/keepfall && …'`.

## Architecture
- **core.js**: `newGame(cfg)`, `step(G, dt)`, castles/edges graph (planar, dense, many routes), soldiers (individual units on roads with a spatial grid),
  supply, Souls mode, kill souls, castle towers, research cards, spells, lords, Hellgate, bots (`botThink`, fog-limited via `botView`), encoding for online sync.
- **art.js**: cached castle/hovel/spring sprites (two resolutions, with the castle tower ring), terrain builder with themes (ash/frost/sulfur), Hellgate, banners.
- **units.js**: unit figures (minion, lesser demon, greater demon, lord), corpses.
- **head.js**: screens, setup options, campaign (6 missions + tutorial), daily challenge, replays, online lobby, game over.
- **panel.js** (+ `game.html`, `game.css`): commands, Send chips, spell bar (2 spells + Research), two-card overlay, castle panel (Army/Souls toggle, upgrade or specialise, lord, Hellgate).
- **tail.js**: canvas renderer, effects, fog, HUD update, gestures, alerts, stats.
- **net.js**: serverless multiplayer (`P2P`): WebRTC data channels in a star around the host, with invite/reply codes pasted by hand instead of a signalling server,
  so it works on GitHub Pages. It has the same shape as the claude.ai room API (`presence(patch)`, `onPeers`, `peers`, `leave`); presence patches are merged and relayed by the host.
- Online model: the **host's device runs the simulation**; clients send commands and render snapshots (~10/s). `head.js` uses the claude.ai room (`ROOM`) when it exists
  (lobby list, 4-letter codes, spectators) and `P2P` otherwise (host makes one invite per friend, no spectators, up to 3 guests by default). Invite codes are about 650 characters;
  the only outside service is a public STUN lookup (`stun.l.google.com`) for NAT traversal. A WebSocket relay with room codes would be a nicer join flow but needs a server.

## Mechanics (revision 4, 2026-10-03; DESIGN.md has the numbers and the revision notes)
- Castles breed minions free up to a level cap and a global army cap, both counted in **supply** (minion 1, lesser 2, greater 5, lord 8). Souls are the only currency.
- Souls come from: a per-castle **Army / Souls** toggle (Souls mode stops breeding and mines souls), **kills** (small, victim gets 50% back, capped per 10 s),
  **soul springs** (fairly placed, guarded) and Soul Well castles, and capture loot. No altars, sacrifice, pilgrims, promotion or Summon.
- Units: Minion (any castle), Lesser and Greater demon (**Spawner** castles only, greater are rare), Lord (hired one per **Citadel**, aura).
- Castles: **three levels** (Throne too); the level-3 upgrade is also the **specialisation**: Soul Well / Citadel (walled, defence, lord) / Spawner (fast breeding, demons).
  Upgrades cost 10% more per castle owned. **Castle towers** (`c.tl`) come automatically with the level; a castle's only actions are Army/Souls and upgrade (plus lord, Hellgate).
- Research: one tap draws two cards (price `40*1.15^n`), 17 cards; card power is tiered by draws taken (weak early, strong late). Two spells from the start: Horde Boost (global), Spies.
- Combat: veterans, walls need siege (greater demons, lords, Siegebreakers card), muster limit 30+30/level.
- Map: 8 types, easy hovels near Thrones and a walled-fortress core (towers level 2), fair guarded springs, day/night, fog.
- Victory: take every rival Throne, or finish the Hellgate (5 stages) and hold the Throne 4 minutes (option can disable).

## Tests and sims (all Node, no deps; they `require` src/core.js)
- `npm test`: `tests/mechanics.cjs` (scripted rule checks) then `tests/games.cjs` (8 bot games: no NaN, garrison sums, encode size).
- `npm run sim:length` (32 bot games, finish rate and median), `sim:balance` (Harvester vs Aggressive duels, N=60), `sim:usage` (what bots build, per personality),
  `sim:research` (win rate of a bot that starts with 2 stacks of each card; parallel). `TUNE='{"SY":3,...}'` overrides engine constants for sweeps (see DESIGN.md §2).
- Run long sims through `bash -lc` in the background: they take 1-3 minutes.

## Status and open work
1. **Balance** (2026-10-03, revision 4 defaults): Harvester vs Aggressive duels about even (31-28 over 80), 32 bot games with 4-6 players: 1 unfinished, median about 26 min (longer than the 15-20
   target; the rush-and-snowball complaint made slower acceptable), about 60% end by Hellgate. About 25% of duels still stall at 30 min (mutual turtling). Run `sim:research` after any card change.
   Not replayed by hand: campaign missions and the tutorial (only started by the smoke test). Bots rarely hire lords or build Spawners.
2. **Multiplayer**: P2P with pasted codes works but is clumsy; a relay with short room codes, spectators and a public game list would be better. Untested across real NATs (only loopback in `tools/p2p-test.cjs`).
3. **Sound** (portals and stores expect it; none so far).
4. **Name check**: "Soulfall" was dropped because it is taken (Hell-themed ARPG on Steam by King's Crown Studio, 2025; a 2015 board game; an itch.io title).
   "Brimfall" had no game/app hits in web searches on 2026-10-02 (a web search, not a trademark search). Confirm on Google Play, the App Store and the USPTO/EUIPO registers before launch.
5. Ideas not built: more spells, lord abilities, leaders as unlocks/meta-progression, faction asymmetry, ranked online.
