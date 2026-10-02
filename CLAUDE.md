# Keepfall — notes for Claude

Real-time castle strategy for phones (portrait-first) and browsers. Originally prototyped as a claude.ai artifact
("Holdfast", v1–v19). Single self-contained HTML output; keep it that way (no external assets, no CDNs).

## Workflow
- Edit files in `src/`, then `npm run build`. Never hand-edit `www/` or `docs/`.
- After engine changes run `npm test`; after balance changes also `npm run sim:balance` and `npm run sim:length`.
- `src/core.js` must stay loadable in Node (tests `require` it) and in the browser.
- Keep the sync encoding (`encode`/`decodeInto`, soldier 6-char base64 packing) backward-consistent within a release.

## Architecture
- **core.js**: `newGame(cfg)`, `step(G, dt)`, castles/edges graph, soldiers (individual units on roads with a spatial grid),
  bots (`botThink`, fog-limited via `botView`), research, spells, Wonder, encoding for online sync.
- **art.js**: cached castle sprites (two resolutions), terrain builder with themes (grass/winter/desert), unit drawing.
- **head.js**: screens, setup options, campaign (6 missions + tutorial), daily challenge, replays (recorded snapshots), online lobby.
- **tail.js**: canvas renderer, gestures (hold a road to muster, slide to a castle for a route), castle panel, research screen, alerts.
- Online model: the **host's device runs the simulation**; clients send commands and render snapshots (~10/s).
  Transport is currently the claude.ai artifact room API (`ROOM.presence`, `peers`), which does not exist outside Claude.
  To ship online play, write a small adapter with the same shape on top of a WebSocket relay (game logic stays on the host).

## Mechanics (current)
- Units: Militia (free), Spearmen (Barracks, 2 gold), Knights (Stables, 5 gold, charge, +50% vs militia, flank around spears).
- Castles: levels 1–5 (capital 6), building slots by level, paths at level 3 (Bastion / Trade city / Barracks town; capitals can't be Bastion).
- Buildings: Moat walls, Barracks, Market, Watchtower, Stables, Granary, Workshop, Mercenary Camp.
- Economy: castle gold, tax mode (6× gold, slower growth), mines (levels 1–3), Markets, trade routes between linked Markets.
- Gold sinks: research (instant option at 2× / finish-now), Mastery (endless, after a capstone), hiring anywhere (rising price), Wonder.
- Research: War, Crown, Realm, Army (unit upgrades), Arcane (spells), each with a capstone.
- Spells: Fire Rain, Breach, Scout (unlocked through Arcane).
- Combat: veterans (ranks from kills), walls need siege (Siegecraft or Workshop) or attackers do ~1/3 damage, road towers, muster limit 30+30/level.
- Map: 8 types, easy villages near capitals and a walled-fortress core, day/night (night shrinks vision), fog of war.
- Victory: take every rival capital, or finish a Wonder and hold the capital 4 minutes (option can disable).

## Status and open work
1. **Rebalance** (postponed by the designer): economic bots beat aggressive ~30–24 to 2:1 depending on version; 4–6 player games median ~25 min with some stalls. Target ~50/50 and ~15–20 min.
2. **Multiplayer relay** for builds outside Claude (see Architecture).
3. Sound (portals and stores expect it; designer chose none so far).
4. Pending design questionnaire on fundamentals (troop source, resources, factions, victory types…).
5. Rename check: "Keepfall" looked free in a quick search; confirm on Google Play and trademark registers before launch.
