# Brimfall — design and implementation contract (revision 2, 2026-10-03)

Brimfall is a real-time conquest game for phones (portrait-first) and browsers. Players are rival **demon lords** fighting for
the thrones of Hell. It is the former *Keepfall* re-themed around one idea:

> **Castles breed minions. Souls are the only currency, and fighting is the fastest way to earn them.**

Revision 2 simplifies revision 1 (which had too many systems and stalling games). **Status: implemented in `src/` (engine, bots, panel, renderer, art,
help/tutorial/campaign copy) and covered by `tests/`.** Constants are **tuned with the sims, not final**; the engine owns the real numbers (exported; the UI
reads them from the engine). Where this text and the code disagree, the code is right: fix the text.

Decisions made by the designer (do not reopen): demonic Hell civil war · souls are the single currency · castles breed minions free up to a
cap · levels 1–5 (Throne 6), no buildings · three castle **paths** at level 3 · research = **two** random cards per draw, gently rising price ·
**three spells**, all unlocked from the start, upgraded by cards · a **lord** is hired only in a Citadel, one per Citadel · Conquest and Hellgate
victories both stay · 15–20 minute matches · light-touch controls (hold a road to muster, slide to a castle for a route) · phone-first, free,
no sound · procedural graphics, single HTML file · 8 hand-tuned map types with an open, many-route graph · name **Brimfall**.

**Removed in revision 2**: promotion, train masks, Summon, altars, Sacrifice button, Offer mode and pilgrims, road spires (replaced by castle
towers), the five spell-learning cards, spell slots.

---------------------------------------------------------------------------------------------------------------------

## 1. Rules

### 1.1 Map and castles
* A map is a planar graph of **castles** joined by **roads**; soldiers are individual units walking on roads.
* Map types (index → name, theme, barrier): 0 *Rivers of fire* (ash, lava river) · 1 *Twin lava rivers* (ash) · 2 *Obsidian isles*
  (ash, lava river + lava sea, islands) · 3 *Bone highlands* (ash, ridge with passes) · 4 *Ash archipelago* (ash, lava seas) ·
  5 *Brimstone canyon* (ash, two ridges) · 6 *Cocytus* (frost, frozen river walkable anywhere) · 7 *Sulfur wastes* (sulfur, open).
  Themes `'ash'`, `'frost'`, `'sulfur'`. Barrier kinds `'w'` river (bridges), `'s'` wide sea (bridges), `'r'` ridge (passes), `'i'` ice.
* **Open graph**: average degree ≈ 3.4–4.2 on land maps, planar, connected, 2–4 crossings per barrier.
* Castle kinds (`c.kind`): `'c'` castle, `'v'` neutral **hovel**, `'f'` neutral **bone fortress** (walled, tower level 2), `'m'` **soul spring**
  (max level 3, never breeds, passive souls, cannot be switched to Souls mode).
* **Fair springs**: the map generator measures the road distance from every Throne (Dijkstra over the road graph) and turns the castles whose two
  nearest Thrones are most nearly equally far into springs: unfairness `(d2−d1)/d2` ≤ 12% first, then ≤ 25%, then ≤ 40% when the map has too few
  fair spots (any non-hovel neutral qualifies, walled ones too; no two springs are adjacent; about one per 1.5 players, at least two if possible; some
  maps get one or none). Springs start guarded by a neutral garrison (`SPRING_GUARD = 30`, 26–33) so taking one always costs a fight. Springs are the
  contested centre prize; each player's own income comes from the Souls mode and the Soul path (§1.4).
* Easy hovels near each Throne, a walled-fortress core, neutrals heal when not attacked (unchanged).
* Capital = **Throne** (`c.capital = slot`), level 1–5 (up to 6). Lose your Throne and you are out (team games: a team loses when all its Thrones fall).

### 1.2 Breeding, supply, cap
* Castles breed **minions free**: `growRate = LV[lv].g × mods` while the castle is below `capOf(c)` and the player is below `armyCap(G,s)`.
  Growth stops while building or plagued. Castles cut off from the Throne (`!c.sup`) grow at 50% and yield no passive souls.
* `LV = [null,{cap:40,g:.35},{cap:70,g:.55},{cap:100,g:.8},{cap:130,g:1.0},{cap:160,g:1.2},{cap:190,g:1.4}]`.
* **Supply is weighted** (this is what stops "go straight to greater demons"): each unit has a *supply weight* `UNIT.sup` = minion 1,
  lesser 2, greater 5, lord 8. `armyCap` and `capOf` are measured in supply weight, not heads (`load(c)` = weighted garrison size;
  `G.tot[s]` = weighted total). `armyCap = 120 + 80·capitalLevel` (200 at Throne lv1, 600 at lv6; raised from revision 1 because lessers/greaters
  weigh more) `× (1+.25·cards.acap)`. Castles still keep `c.u = [minions, lesser, greater]`.
* A unit's **growth cost** is how much breeding it eats: minion 1, lesser 2.2, greater 7.

### 1.3 Units
| u | Name | hp | speed | dmg | wall dmg | supply | growth cost | where |
|---|------|----|-------|-----|----------|--------|-------------|-------|
| 0 | Minion | .75 | 1.0 | .27 | 1.0 | 1 | 1 | every castle |
| 1 | Lesser demon | 1.45 | 1.0 | .40 | 1.1 | 2 | 2.2 | **Spawner** castles, level ≥ 3 |
| 2 | Greater demon | 2.2 | 1.5 (winged) | .62 | 1.8 | 5 | 7 | **Spawner** castles, level 5 or 6 only |
| 3 | Lord | 14 | .9 | 1.15 | 2.2 | 8 | — | hired in a Citadel |

* Greater demons charge (first hit ×2), deal ×1.5 to minions, swing round lesser demons to reach softer targets, and count as siege.
* **No training choices, no promotion, no souls for units.** Only Spawner castles make lessers and greaters; the mix is automatic:
  growth is spent in fixed shares by Spawner level: lv3 `75% minion / 25% lesser`, lv4 `70 / 30`, lv5 `55 / 30 / 15`, lv6 (Throne) `45 / 35 / 20`
  (shares of growth spent). Greater demons are rare because they only exist at Spawner level 5+ (a long, expensive climb) and weigh 5 supply;
  there is no cheaper route to them.
* Veterans (ranks from kills, +20% hp/damage per rank) stay; ranks are remembered in castles (`c.vp`).

### 1.4 Souls (the economy)
**Souls** (`p.souls`) buy: castle levels, paths, towers, research cards, spells, lords, Hellgate stages. Units never cost souls. Sources:
1. **Castle mode** (`c.mode`: 0 Army / 1 Souls, `setMode`): in Souls mode a castle spends its breeding on souls instead of troops:
   `souls/s = LV[lv].g × SOUL_YIELD` (`SOUL_YIELD = 3.0`, ×1.5 for a Soul Well, ×(1+.15·cards.tithe); the Spawner and Soul Well breeding
   factors do not apply, and a breeding castle in Army mode stops while under assault). Its garrison stays and defends but does
   not grow; it is not limited by the army cap; no pilgrims, nothing to walk, no altar. Not available on springs, and a Spawner in Souls mode
   makes only souls. Cut-off castles (`!sup`) yield half. Throne may use it.
2. **Kills** (`killSouls`): every unit that dies pays the **killer's owner** `KILL_V = 0.8 × (hp/.75)` souls (minion .8, lesser 1.55, greater 2.35,
   lord 15), ×(1+.15·cards.tithe). The **victim's owner** gets `KILL_BACK = 50%` of that as consolation. Neutral deaths pay nothing (loot covers
   them). Cap: `KILL_CAP = 45` souls per player per 10 s window, kills and consolation together (so one mega-battle cannot swing the game). Kills by
   towers, garrisons and Hellfire count. Payouts are batched into one `soul` event per second per player.
   *Anti-snowball*: if the sims show runaway wins add a catch-up multiplier `clamp(avgEarned/yourEarned, .7, 1.3)` on kill payouts (`CATCHUP`, off by default).
3. **Soul Springs** (owned, kind `'m'`): `1.2·(1+.6·(lv−1))` souls/s (×`1+.25·cards.well`), levels 1–3, need supply.
4. **Soul Well path** (§1.5): `0.30 + 0.10·lv` souls/s passive.
5. **Capture loot**: `round(8·oldLevel + (wasWalled?60:0))` souls.
* Start: `opts.souls` (Standard 40 / Rich 200 / Lavish 500). `p.earned`, `p.inc` (smoothed souls/s) as before.
* Costs (souls): level-ups `LVCOST=[0,50,100,160,230,320]`, path `PATH_COST=120`, towers `TOWER_COST=[60,110,170]` (level 1/2/3), research
  `round(40·1.12^p.rn)`, spells see §1.7, lord `140+70·p.lh`, Hellgate stage 650. Thrift cards cut level/path/tower costs.

### 1.5 Castle paths (level ≥ 3, permanent, `PATH_COST` souls, `PATH_T=15` s, not on springs)
1. **Soul Well** — passive souls `0.30+0.10·lv`/s, Souls-mode yield ×1.5, breeds 30% slower.
2. **Citadel** (defence + lord) — counts as *walled* (attackers without siege do ×0.35), defence ×1.6, holds 25% more, sees far (vision 460),
   tower costs −30%, and can hire a **lord** (§1.8). Not for the Throne (the Throne already has defence ×1.3 and its own lord rules below).
3. **Spawner** (barracks) — breeds 40% faster and is the only castle that makes lesser/greater demons (§1.3).
`PATHS = [null,{name,desc},…]`. Capturing a castle keeps its level −1 and drops the path unless level < 3. The Throne may take Soul Well or Spawner;
a Throne cannot hire lords (lords need a Citadel).

### 1.6 Research = two cards
* `researchCost(G,s) = round(40 · 1.12^p.rn)`. `drawResearch` pays and sets `p.offer = [id,id]` (two distinct eligible cards, weighted random from
  `G.rng`); with a pending offer it does nothing. `pickCard(G,s,i)` takes `p.offer[i]`, clears the offer, applies it. A pending offer persists.
* **Card power rule**: every card must feel like a real upgrade, roughly "+½ to +1 unit tier" on one axis. **No stat bonus below +15% per pick**, stacks are
  few (max 3, rarely 2) and cards that are too small alone are merged. Compare cards by value: +20% damage ≈ +20% health ≈ +20% breeding ≈ +20% souls.
* **Cards** (`CARDS[id] = {id,key,name,desc,tag,max,w}`; `tag` ∈ `'soul'|'war'|'lord'|'magic'`; stackable up to `max`):
  `0 grow` Fecund Pits (+15% breeding of troops, Souls mode does not use it, 3) · `1 tithe` Blood Tithe (+15% Souls-mode and kill souls, 3) · `2 well` Deep Wells (+40% from Wells & Springs, 3) ·
  `3 thrift` Pact of Thrift (−15% level/path/tower cost, 3) · `4 acap` Legion Writ (+25% army cap and castle capacity, 3) · `5 dmg` Razor Claws (+15% damage, 3) ·
  `6 hp` Thick Hides (+15% health, 3) · `7 march` Forced March (+20% march speed and +25% muster limit, 2) · `8 def` Brimstone Walls (+20% castle defence, 3) ·
  `9 siege` Siegebreakers (full damage vs walls, unique) · `10 blood` Blood Oath (units leave castles with +15% health and damage, unique) ·
  `11 tower` Tower Mastery (+40% tower fire, half that for range, 3) · `12 laura` Tyrant's Aura (lord aura +30%, 3; only with a Citadel or lord) ·
  `13 lhp` Unbroken Will (lords +30% hp, 3; same) · `14 lcost` Infernal Contract (lords −25% cost, 2; same) ·
  `15 horde` Horde Mastery (Horde Boost +40% strength and duration, −20% cost, 3) · `16 spy` Spymaster (Spies +30% radius and duration, −15% cost, 3) ·
  `17 hfire` Hellfire Mastery (Hellfire +40% damage and radius, −20% cost, 3).
  Weights `w`: soul 3, war 3, lord 1.5, magic 2. No card is offered at max stacks. Aggregates cached in `p.mod`. Tune card values in the sims
  (`tests/research-value.cjs`): every card's win-rate gain should be within a similar band.

### 1.7 Spells (three, all unlocked from the start)
`p.cd = [readyAt0, readyAt1, readyAt2]` (in `G.gt` time). `useSpell(G,slot,k,x,y)` casts spell `k` (0..2); `SPELLS[id] = {id,name,desc,cost,cd,kind}`.
0 **Horde Boost** (global, **expensive**: 110 souls, cd 90): for 15 s all your soldiers in the field get +30% damage and +20% speed.
  (No targeting, no breeding bonus.)
1 **Spies** (point, **cheap**: 20 souls, cd 25): reveals radius 200 around the point for 20 s (units, castle sizes, towers, lords).
2 **Hellfire** (point, 70 souls, cd 55): after 1.6 s damages every enemy soldier within r 45 (~1.0 hp) — counts as kills for soul payouts.
`spellCost/spellCd/spellR/spellDur(G,s,id)` apply the three Mastery cards. (Shatter, Eye of Hell, Frenzy and Plague of revision 1 are removed;
Shatter's wall-breaching is gone, so walls need siege units or the Siegebreakers card.)

### 1.8 Lords
* Hired in a **Citadel** (`path===2`, not building, no living lord with `home===ci`, recovery over `c.lordCd`, souls ≥ `lordPrice =
  (140+70·p.lh)·(1−.25·cards.lcost)`). One per Citadel; `c.lords = [{id,home,hp,max,rk,xp,nm}]`, `max = 14·(1+.3·cards.lhp)`.
* Garrisoned lord heals (+0.4 hp/s) and boosts the castle (defence ×1.15). With the Send mix lord bit (bit 3) and a block ≥ 6 troops, the lord
  leaves first as soldier `u=3`. Routes never carry lords.
* **Aura** (radius 85): friendly soldiers near a lord get +20% damage and +8% speed (×(1+.25·cards.laura)); the best aura applies, they don't stack.
* Lord dies → event `lorddie`, record removed, `c.lordCd = 40` s at home. Capturing a castle with lords kills them. The lord is the only named unit.

### 1.9 Combat, towers, fog, Hellgate
* Combat, formations, veteran ranks, muster (`musterCap = 30+30·lv`, ×(1+.25·cards.march)), fog, day/night (`nightLevel`), supply, hills (+30% defence)
  are unchanged from revision 1 except: garrison and tower fire use `FIRE = 0.115` (revision 1: .155; castles were too hard to crack), neutral walled
  fortresses defend ×1.2 (was ×1.4).
* **Castle towers** (replace road spires). `c.tl` = tower level 0–3. One purchase per level, `fortify(G,slot,ci)`, `TOWER_COST`, build time `TOWER_T=8` s.
  The towers surround the castle (art: 4 towers at level 1 growing taller/bigger per level) and fire at enemy soldiers within
  `TW_R=[0,80,90,100]` (×(1+.25·cards.tower) via range) of the castle with `TW_FIRE=[0,5,9,14]` (same fire units the old spire and garrison used),
  only while the castle holds at least one troop. They are not separately destructible and add `+6%·tl` castle defence. A captured castle drops
  one tower level. Neutral bone fortresses have `tl = 2`. Towers fall silent in a breach (no Shatter now: they fall silent only if the castle has no troops).
* **Walls**: neutral fortresses (`c.nw`) and Citadel castles are *walled*: attackers do ×`WALL_MUL = 0.55` unless they have siege (Siegebreakers card,
  greater demons, lords).
* **Hellgate** (the Wonder): needs the Throne at level ≥ 3; five stages, each `WONDER_COST=650` souls and `WONDER_T=45` s; then hold the Throne
  `WONDER_HOLD=240` s (attacks roll the timer back); everyone is warned. `opts.wonder` can disable it. Cost is tunable once the new economy is simmed.
* Victory: take every rival Throne, or finish and hold the Hellgate.

### 1.10 Bots
Personalities `PERS = ['Balanced','Aggressive','Turtle','Harvester']`, difficulties `d` 0/1/2, fog-limited via `botView`. They must use: Army/Souls mode
(Souls on safe rear castles, Army on the front; Harvester more Souls castles, Aggressive fewer), levels, paths (Spawner for Aggressive/Balanced,
Soul Well for Harvester, Citadel for Turtle), towers on exposed castles, card choice by personality, all three spells (Horde Boost before a big
engagement, Spies on fogged targets, Hellfire on clusters), lords in Citadels, the Hellgate. Targets for the sims: aggressive vs harvester ≈ 50/50,
4–6 player games median ≈ 15–20 minutes, almost no stalls (kill souls and fair springs are the pace mechanisms; there is no soft clock, fix stalls with rules and bots).
Bots that go several thinks without a worthwhile target get bolder (their attack estimate shrinks up to 35%), which is what breaks mutual-turtle duels.

---------------------------------------------------------------------------------------------------------------------

## 2. Engine API contract (src/core.js)

Everything top-level (global in the browser) and in `module.exports` for Node tests. Keep loadable in Node and the browser. `newGame(cfg)`, `step(G,dt)`,
`encode(G,budget)`, `decodeInto(G,g)`, `decSol(str)` keep their shapes (the freed `sac` soldier bit may be reused; keep `decSol` output shape minus `sac`).

**Data**: `COLORS`, `NEUTRAL=9`, `LV`, `LVCOST`, `maxLv(c)`, `UNIT` (4 entries, fields `name,short,hp,spd,dmg,wall,sup,gcost,req`), `NU=3`, `PATHS` (3),
`PATH_COST`, `PATH_T`, `CARDS`, `SPELLS` (3), `LORD_NAMES`, `PERS`, `MAPTYPES`, `MAPTHEME`, `WONDER_COST/STAGES/T/HOLD`, `TOWER_COST/T`, `TW_R/TW_FIRE`,
`SOUL_YIELD`, `KILL_V/KILL_BACK/KILL_CAP`, `SPRING_GUARD`, `MAX_SOL`, `SPEED_S`, `ROUTE_IV/PKT`, `FIRE`, `HIT_W/CD_W`, `DAY_LEN`.

**State shapes**: castle `c`: `x,y,owner,size,u[3],lv,kind,path(0..3),mode(0|1),tl(0..3),route,build{k,t,dur}|null (k=0 level up, 1 tower, 20+path),hill,nw,br,sab,
capital,sup,assault,base,lords[]`. Soldier host shape as before minus `sac,alt`. Player `p=G.pl[s]`: `souls,earned,inc,cards[],offer[2]|null,rn,mod{},cd[3],mix(0..15),
pour,out,taken,kills,peak,lh`. Events: `die{x,y,o,u}` `shot{x,y,tx,ty,tc}` (castle tower shots) `fire{x,y}` `rank` `cap{c,by,loot,drop}` `elim` `wonder` `wstage` `wdone`
`up{c}` `built{c}` `soul{x,y,s,n,why}` (kill/mode/loot payouts for floating "+n" text; `why` 0 kill, 1 mode, 2 loot) `card{s,id}` `offer{s}` `lord{s,c}` `lorddie`
`spell{s,id}` `horde{s}` `spy{x,y,s}`. (`cards.acap` also scales `capOf`; the old `cap`, `spd` and `muster` cards are merged into `acap` and `march`.)

**Commands** (all `(G,slot,…)`, return bool, validate ownership; numeric ids in `runCmd`):
| id | call | meaning |
|----|------|---------|
| 1 | `squad(G,slot,from,to)` | small squad along a road |
| 2 | `setRoute(G,slot,from,to)` | `to<0` stops |
| 3 | `upgrade(G,slot,ci)` | next castle level |
| 4 | `setMode(G,slot,ci,v)` | Army (0) / Souls (1) |
| 5 | `drawResearch(G,slot)` | pay, get 2 cards |
| 6 | `useSpell(G,slot,k,x,y)` | cast spell k |
| 9 | `setMix(G,slot,mask)` | Send chips (minion, lesser, greater, lord) |
| 11 | `fortify(G,slot,ci)` | buy / upgrade the castle's towers |
| 12 | `choosePath(G,slot,ci,path)` | path 1–3 |
| 13 | `pickCard(G,slot,i)` | choose offered card i (0–1) |
| 14 | `buildWonder(G,slot)` | next Hellgate stage |
| 17 | `hireLord(G,slot,ci)` | |
Plus `dispatch(G,slot,from,to,n,mask)`, `setPour(G,slot,from,to)`. (Ids 8, 10, 15, 16 are retired.)

**Sync encoding** (`encode`/`decodeInto`): castle word `lv|route<<3|mode<<9|capital<<10|sup<<14|kind<<15|assault<<17|tl<<18|nw<<21|path<<22|lords<<25`; build kind in the
unit word (`1` level, `2..4` paths, `5` towers); `ct` = `[castle,lordCd]` pairs; player block of 17 numbers `[slot,souls,earned,inc×10,cards,offer(2),rn,cd2,cd0,cd1,wonder,out|taken<<1,
kills,hordeSecs|hordeStrength×100<<8,lords,peak,supply]`; soldiers keep the 6-character packing (the pilgrim bit is gone, `decSol` no longer returns `sac`).

**Queries for the UI**: `capOf(c)`, `load(c)`, `armyCap(G,s)`, `musterCap(c)`, `growRate(G,c)`, `soulRate(G,c)` (passive + Souls mode souls/s, for the castle panel),
`killSouls(u)`, `defMul(G,c)`, `isWalled(c)`, `unitOk(c,t)` (can this castle breed type t), `upCost`, `pathCost(G,s)`, `towerCost(G,s,c)`, `towerMax`, `researchCost(G,s)`,
`cardCount`, `cardEffect(id,n)`, `spellCost/spellCd/spellR/spellDur(G,s,id)`, `lordStatus(G,slot,ci)→{can,price,why,lord}`, `lordPrice`, `castleVision(c)`, `nightLevel(t)`,
`teamOf`, `aliveTeams`, `mod(G,s,key)`.

**Config**: `newGame({seed,slots,W,H,ms,sp,mt,botDelay,opts})`, `opts = {wonder:1,souls:40,fog:1,neut:1}`. Slots keep their shape plus bot flags `noRes`, `noArmy`, `wonderFirst`
and the test hook `cards:{key:n}` (start with cards; not stored in `G.cfg`). In Node, the env var `TUNE='{"SY":3,"KV":0.8,"KC":45,"FIRE":0.115,"WALL":0.55,"WG":650,"WH":240,"AG":0.85,"HV":0.5}'`
overrides those constants for sweeps (`tests/*.cjs`); the browser build never reads it.
`G.cfg` must let `newGame({...G.cfg})` rebuild an identical world.

---------------------------------------------------------------------------------------------------------------------

## 3. UI contract

**Files**: `head.js` (menus, setup, campaign, tutorial, daily, replays, networking glue, game over) · `panel.js` (commands, Send chips, spell bar, research overlay, castle
panel) · `tail.js` (camera, fog, effects, renderer, HUD, stats, gestures). Load order head → panel → tail.

**DOM ids** scripts may rely on: menu/setup/lobby ids unchanged (`#name #b-camp … #missions`, `.seg[data-opt=ms|wonder|souls|fog|neut|sp]`); game screen: `#s-game`, `.hud`
with `#b-pause #souls #inc #troops #tcap #castles #b-pp #b-spd #dn #clock`; `#power`; `#stage` with `#cv #toast #wbanner #pausetag #panel #tut …` and zoom buttons;
replay bar; Send bar `#mix` with four `[data-u]` chips and `#b-units`; action bar `.ab[data-ab="0|1|2"]` (the three spells, each `<b>`, `<small>`, `<i class="cdv">`)
and `#b-res`. localStorage prefix `bf-`.

**Castle panel (owned castle)**: title + status + chips · **Army / Souls toggle** showing the projected `+x souls/s` (not on springs) · build progress · Hellgate section (Throne) ·
path choice (level ≥ 3, no path) · lord section (Citadel) · level-up · **Towers** row (level pips, "Fortify · N souls") · route row · pings. The Send bar tooltip shows supply
weights. Enemy/neutral castle: info chips (level, tower level, path if seen). **Research overlay**: **two** large cards. **Spell bar**: three buttons; Horde Boost has no target,
Spies and Hellfire use a point. **HUD**: troops shows weighted supply `tot/cap`. Floating "+n" soul text on kills, Souls-mode ticks (small, throttled) and loot.

---------------------------------------------------------------------------------------------------------------------

## 4. Art direction (procedural canvas only, no external assets, no fonts or CDNs)

**Look** unchanged: dark fantasy, readable silhouettes at tiny scale, painterly vectors, ember glow; **soul light is cold blue-white**. Player colours
`#ff4b4b #4aa3ff #46d68c #ffc83d #b277ff #ff8a3d #35d4d4 #ff6eb4`, neutral `#8a8478`.
**Castles** (`art.js`, keep sizes/anchors): footprint radii `RX=[0,70,98,128]`, `RY=[0,46,62,82]`, `ART=0.36`. Lv1 den · Lv2 lair · Lv3 citadel · Lv4 wall ring · Lv5 crown of fire ·
Lv6 Throne. Paths must be visible: **Soul Well** glowing blue soul-pit with rising wisps (no altar slab); **Citadel** thick spiked ramparts and a tall black tower with a violet eye-flame;
**Spawner** chimneys, glowing anvil/breeding pit, sparks. **Towers**: a ring of 4 bone-and-iron towers around the castle footprint, level 1 short, level 2 taller with braziers, level 3 tall with
fire; drawn per `c.tl`. A Souls-mode castle shows a faint blue soul-light haze. Springs: cracked pool with a soul-geyser (unchanged). Remove the road spire art; fortresses use the same towers.
**Units** (`units.js`): minion, lesser, greater, lord as before; **pilgrims are removed** (drop the `sac` argument). Corpses dissolve to ash; kill payouts show a tiny blue wisp rising from the corpse.

---------------------------------------------------------------------------------------------------------------------

## 5. Files, ownership and process

| File | Notes |
|------|-------|
| `src/core.js`, `tests/*.cjs` | rules, map gen (fair springs), sim, commands, bots, encoding, tests/sims |
| `src/art.js`, `src/units.js` | castle towers, path art, unit art without pilgrims |
| `src/panel.js`, `src/game.html`, `src/game.css` | Army/Souls toggle, Towers row, three-spell bar, two-card overlay |
| `src/tail.js` | renderer (towers, soul wisps, floating text), HUD supply |
| `src/shell.html`, `src/head.js` | copy, help, tutorial and campaign updated for the new rules |
| `build.mjs`, `tools/*`, `DESIGN.md` | |

* Build to a scratch dir with `node build.mjs --out <dir>` while iterating; `npm run build` overwrites `www/` and `docs/`.
* The repo lives in WSL: run Node via `wsl.exe -d Ubuntu-24.04 -e bash -lc 'cd ~/coding/keepfall && <cmd>'` (Node 18).
* Look at your work: `node tools/shot.cjs <page.html> <out.png> [--w 390 --h 844 --dpr 2 --eval "js" --script file.cjs]`, then open the PNG. Iterate visually.
* Code style: match the surrounding code (dense, short names, comments only for non-obvious intent). No external assets. `src/core.js` must not touch `document`/`window` unguarded.

**Implementation order**: (1) engine: supply weights, Army/Souls mode, kill souls, towers, paths, cards, spells, fair springs, bots, then `npm test` / `sim:length` / `sim:balance`
and tune; (2) panel + HUD; (3) art (towers, paths); (4) copy, tutorial and campaign pass. **Definition of done** — engine: tests and sims pass with finishing games, no NaN, encode round-trips,
bots use all systems. UI/art: screenshots at 390×844 and desktop, no console errors, no leftover removed terms (sacrifice, altar, pilgrim, offer, promote, summon, spire, Shatter, Frenzy, Plague, Eye of Hell).
