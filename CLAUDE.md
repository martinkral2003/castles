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
- `tools/shot.cjs` (headless screenshot), `tools/smoke.cjs` (flow smoke test) and `tools/online-test.cjs` (two pages play through the public relay, needs internet) need Playwright; set `PLAYWRIGHT_DIR` to a playwright package if it is not found.
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
- **net.js**: online play through a free public MQTT-over-WebSocket broker (`MQROOM`: HiveMQ, falling back to EMQX; a tiny MQTT 3.1.1 client, no library, no account). It has the same shape as the
  claude.ai room API the game was written against (`join(name)` -> `presence(patch)`, `onPeers`, `peers`, `leave`; plus a public game list through retained ads cleared by the MQTT last-will),
  so `head.js` uses `ROOM` = the claude.ai room when it exists and `MQROOM` otherwise: 4-letter codes, public list, spectators. All traffic is relayed (no NAT problems, about 100 ms of extra latency),
  but it is not private (topics are `brimfall-v1/...`, anyone guessing a code can join, broker operators can read). An earlier serverless WebRTC version with pasted codes did not connect for the
  user on real networks and was removed. If the free brokers disappear, change `BROKERS` or host a Mosquitto/EMQX instance.
- Online model: the **host's device runs the simulation**; clients send commands and render snapshots (~10/s, about 4 KB each through the relay).

## Mechanics (revision 4, 2026-10-03; DESIGN.md has the numbers and the revision notes)
- Castles breed minions free up to a level cap and a global army cap, both counted in **supply** (minion 1, demon 2, lord 8). Souls are the only currency.
- Souls come from: a per-castle **Army / Souls** toggle (Souls mode stops breeding and mines souls), **kills** (small, victim gets 50% back, capped per 10 s),
  **soul springs** (fairly placed, guarded) and Soul Well castles, and capture loot. No altars, sacrifice, pilgrims, promotion or Summon.
- Units: Minion (any castle), Demon (**Spawner** castles only, counts as siege), Lord (hired one per **Citadel**, aura, cheaper than before). Unit slot 2 is retired but kept so indices stay stable.
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
2. **Multiplayer**: works through the free public brokers (tested from the dev machine with two headless pages; not tested on phones or over mobile data). Free brokers can rate-limit or vanish: watch for it.
3. **Sound** (portals and stores expect it; none so far).
4. **Name check**: "Soulfall" was dropped because it is taken (Hell-themed ARPG on Steam by King's Crown Studio, 2025; a 2015 board game; an itch.io title).
   "Brimfall" had no game/app hits in web searches on 2026-10-02 (a web search, not a trademark search). Confirm on Google Play, the App Store and the USPTO/EUIPO registers before launch.
5. Ideas not built: more spells, lord abilities, leaders as unlocks/meta-progression, faction asymmetry, ranked online.
