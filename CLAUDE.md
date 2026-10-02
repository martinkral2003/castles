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
  souls/altars/offer mode and pilgrims, research cards, spells, lords, Hellgate, bots (`botThink`, fog-limited via `botView`), encoding for online sync.
- **art.js**: cached castle/hovel/spring sprites (two resolutions), terrain builder with themes (ash/frost/sulfur), spires, Hellgate, banners.
- **units.js**: unit figures (minion, lesser demon, greater demon, lord), corpses.
- **head.js**: screens, setup options, campaign (6 missions + tutorial), daily challenge, replays, online lobby, game over.
- **panel.js** (+ `game.html`, `game.css`): commands, Send chips, spell bar, research card overlay, castle panel.
- **tail.js**: canvas renderer, effects, fog, HUD update, gestures, alerts, stats.
- Online model: the **host's device runs the simulation**; clients send commands and render snapshots (~10/s).
  Transport is currently the claude.ai artifact room API (`ROOM.presence`, `peers`), which does not exist outside Claude.
  To ship online play, write a small adapter with the same shape on top of a WebSocket relay (game logic stays on the host).

## Mechanics (current; details and numbers in DESIGN.md)
- Every minion is a soldier or a soul. Castles breed minions free up to a level cap (and a global army cap); souls are the only currency.
- Souls come from sacrifice at altars (Throne, Soul Wells): instant Sacrifice button, or Offer mode where surplus minions walk as pilgrims to the nearest altar.
  Passive souls only from Soul Wells and Soul Springs; capture loot.
- Units: Minion (free), Lesser demon (level 2+), Greater demon (Hellforge or level 4+; charges, breaks walls), Lord (hired in a Dark Tower, one per tower, aura).
  Promotion converts garrison units for souls.
- Castles: levels 1–5 (Throne 6), no buildings; a level-3 path decides the role: Bastion / Soul Well / Dark Tower / Hellforge.
- Research: draw three random cards (price rises each draw), pick one. Two spell slots: Hellfire, Shatter, Eye of Hell, Frenzy, Plague (learned through cards).
- Combat: veterans, walls need siege (greater demons, lords, Siegebreakers card, Shatter), road spires, muster limit 30+30/level.
- Map: 8 types (lava rivers, isles, bone highlands, canyon, Cocytus, sulfur wastes…), easy hovels near Thrones and a walled-fortress core, soul springs, day/night, fog.
- Victory: take every rival Throne, or finish the Hellgate and hold the Throne 4 minutes (option can disable).

## Status and open work
1. **Balance / known gaps (2026-10-02 handoff)**: the game builds, runs and passes `tools/smoke.cjs`, but the engine work was cut short by a budget limit.
   About half of the bot-only sim games (`node tests/games.cjs`) do not finish within 40 minutes (stalls), bots rarely train/promote greater demons, and
   `tests/mechanics.cjs` (promised in DESIGN.md) was never written; `npm test` only runs `games.cjs`. Next steps: fix the stalls in `botThink`/constants, re-run
   `sim:length` and `sim:balance` (targets: harvester vs aggressive ≈ 50/50, 4–6 player games 15–20 min), write the mechanics test.
   The unit art (`units.js`) and panel agents were interrupted mid-polish: check lord/greater-demon visuals and panel layout at 390×844 with `tools/shot.cjs`.
2. **Multiplayer relay** for builds outside Claude (see Architecture).
3. **Sound** (portals and stores expect it; none so far).
4. **Name check**: "Soulfall" was dropped because it is taken (Hell-themed ARPG on Steam by King's Crown Studio, 2025; a 2015 board game; an itch.io title).
   "Brimfall" had no game/app hits in web searches on 2026-10-02 (a web search, not a trademark search). Confirm on Google Play, the App Store and the USPTO/EUIPO registers before launch.
5. Ideas not built: more spells, lord abilities, leaders as unlocks/meta-progression, faction asymmetry, ranked online.
