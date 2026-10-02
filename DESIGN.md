# Brimfall — design and implementation contract

Brimfall is a real-time conquest game for phones (portrait-first) and browsers. Players are rival **demon lords** fighting for
the thrones of Hell. It is the former *Keepfall* (a medieval castle game) re-themed and re-built around one idea:

> **Every minion is either a soldier or a soul.** Castles breed minions for free. Sacrificing them at altars is the *only*
> source of souls, and souls buy everything else.

This document is the single source of truth for the redesign: rules, numbers, the engine/UI API, DOM ids, art direction and
file ownership. Constants below are **starting values**; the engine owns the real numbers (they are exported, the UI must
read them from the engine and never hard-code them in text where avoidable).

Decisions already made by the designer (do not reopen): demonic Hell civil war · minion → lesser demon → greater demon ·
souls are the single currency (no gold, no passive income except soul-collecting castles) · minions walk to altars to be
sacrificed · castles breed minions free up to a level cap · levels 1–5 (capital 6) with a level-3 **path**, **no buildings** ·
research = three random cards per draw, each draw costs more · two spell slots · a **lord** is a special unit hired only in a
**Dark Tower** castle, one per tower · Conquest and Wonder victories both stay · 15–20 minute matches · light-touch controls
(hold a road to muster, slide to a castle for a route) · phone-first, free, no sound · procedural graphics, single HTML file,
no external assets · the 8 hand-tuned map types stay, but as a more open graph with many routes · name: **Brimfall**.

---------------------------------------------------------------------------------------------------------------------

## 1. Rules

### 1.1 Map and castles
* A map is a planar graph of **castles** joined by **roads**; soldiers are individual units walking on roads (unchanged engine).
* Map types (index → name, theme, barrier): 0 *Rivers of fire* (ash, lava river) · 1 *Twin lava rivers* (ash) · 2 *Obsidian isles*
  (ash, lava river + lava sea, islands) · 3 *Bone highlands* (ash, ridge with passes) · 4 *Ash archipelago* (ash, lava seas) ·
  5 *Brimstone canyon* (ash, two ridges) · 6 *Cocytus* (frost, frozen river walkable anywhere) · 7 *Sulfur wastes* (sulfur, open).
  Themes: `'ash'` (charred basalt + embers), `'frost'` (the frozen ninth circle), `'sulfur'` (yellow-red wastes).
  Barrier kinds are unchanged: `'w'` river (bridges), `'s'` wide sea (bridges), `'r'` ridge (passes), `'i'` ice.
  Water is **lava** (ash/sulfur) or black ice-water (frost).
* **Open graph**: roads must be denser than Keepfall: aim for average degree ≈ 3.4–4.2 on land maps, still planar (no crossing
  roads), still connected, still 2–4 crossings per barrier. Flanking and raiding should matter more than holding one line.
* Castle kinds (`c.kind`): `'c'` castle (owned or captured), `'v'` neutral **hovel**, `'f'` neutral **bone fortress** (walled,
  guarded by spires), `'m'` **soul spring** (max level 3, never breeds, passive souls, contested resource point, cannot be an altar).
* Neutral setup is as before: easy hovels near each capital, a walled-fortress core, springs at contested spots; neutrals heal when
  not attacked.
* Capital = **Throne** (`c.capital = slot`). Level 1–5, capital up to 6. Lose your Throne and you are out (team games: a team
  loses when all its Thrones have fallen).

### 1.2 Breeding, cap, supply
* Castles breed **minions for free**: `growRate = LV[lv].g × mods` while the castle is below its `capOf(c)` and the player's total
  troops (castles + soldiers in the field) is below `armyCap(G,s)`. Growth stops while building/plagued.
* `LV = [null,{cap:40,g:.35},{cap:70,g:.55},{cap:100,g:.8},{cap:130,g:1.0},{cap:160,g:1.2},{cap:190,g:1.4}]`.
* `armyCap = 60 + 60·capitalLevel + 30·cards.acap`. Castles cut off from the Throne (`!c.sup`) grow at 50% and yield no passive souls.
* Troops in a castle: `c.u = [minions, lesser, greater]`, `c.size` = their sum (lords are separate, see 1.8).

### 1.3 Units
| u | Name | hp | speed | dmg | wall dmg | breed cost (growth) | souls to train | available when |
|---|------|----|-------|-----|----------|---------------------|----------------|----------------|
| 0 | Minion | .75 | 1.0 | .27 | 1.0 | 1.0 | free | always |
| 1 | Lesser demon | 1.45 | 1.0 | .40 | 1.1 | 1.15 | 2 | castle level ≥ 2 |
| 2 | Greater demon | 2.2 | 1.5 (winged) | .62 | 1.8 | 1.9 | 6 | Hellforge path, or level ≥ 4 |
| 3 | Lord | 14 | .9 | 1.15 | 2.2 | — | hired (1.8) | Dark Tower only |

* Greater demons charge (first hit ×2), deal ×1.5 to minions, swing round lesser demons on the way to softer targets (Keepfall's
  knight rules) **and count as siege** (they smash walls at full strength). Lesser demons are the sturdy line.
* Veterans (ranks from kills, +20% hp/damage per rank) stay as they are. Ranks are remembered in castles (`c.vp`).
* Training: each castle has a train mask `c.tr` (bit0 minion always on, bit1 lesser, bit2 greater). While breeding, growth is split
  across enabled & available types; non-minion types are paid in souls per unit; if the player is out of souls that share falls back
  to minions (as Keepfall did with gold).
* **Promotion** (the way to get stronger once capped): `promote(G,slot,ci,tier)` converts up to `PROMO_N=10` units *in the garrison*:
  tier 1 minion→lesser (3 souls each), tier 2 lesser→greater (8 each; needs the greater requirement). Hellforge ×0.6. Instant.

### 1.4 Souls, altars, offering (the economy)
* **Souls** (`p.souls`) are the only currency. There is **no passive income** except: Soul Well castles, owned Soul Springs, and
  capture loot.
* **Altar** = the Throne, or a castle with the **Soul Well** path (`isAltar(c)`).
* **Sacrifice now** (`sacrifice(G,slot,ci)`): at an altar you own, instantly convert up to `SAC_N=10` *minions* of its garrison into
  souls. Yield per minion = `1 × (1+.2·rank) × (1+.10·cards.tithe) × (Soul Well altar: 1.5)`.
* **Offer mode** (`c.off = 1`, replaces Keepfall's Tax toggle, set with `setOffer`): the castle keeps breeding at the normal rate,
  but every `PILG_IV≈1.4s` it releases **pilgrims** — up to `PILG_N=4` minions above a standing garrison of `max(5, 20% of cap)` —
  that walk the roads (through your own castles without stopping) to the **nearest altar of your team** (BFS over friendly castles)
  and are sacrificed on arrival. If the castle is itself an altar the sacrifice is in place. If no altar is reachable the castle
  simply holds its troops. Pilgrims are ordinary soldiers flagged `sac` (they fight if attacked, can be raided, count as army).
  Never offer lesser/greater demons or lords.
* **Soul Well** path: passive `0.30 + 0.10·lv` souls/s (×`1+.25·cards.well`), is an altar, breeds 30% slower.
* **Soul Spring** (kind `'m'`) owned: passive `1.2·(1+.6·(lv−1))` souls/s (×well card), levels 1–3, not an altar, needs supply.
* **Loot**: capturing a castle pays `round(8·oldLevel + (wasWalled?60:0))` souls (×3 if the player has a plunder effect — none now).
* **Summon** (`summon(G,slot,ci)`, was Hire): 10 minions into a castle for `SUMMON_BASE=35 × p.hm` souls; `p.hm` ×1.12 per summon,
  eases back −0.008/s. Costs more than a minion yields as a sacrifice, so it can never be farmed.
* Start: `opts.souls` (Standard 40 / Rich 200 / Lavish 500). `G.pl[s].souls`, `earned` (total gained), `inc` (smoothed souls/s, for the HUD).
* Cost table (souls): level-ups `LVCOST=[0,50,100,160,230,320]` (level n→n+1, `upCost`), path `PATH_COST=120`, spire 45, promotion 3/8 per
  unit, research `45·1.28^p.rn`, spells 30–70, lord `140+70·p.lh`, Hellgate stage 700. Thrift cards reduce level/path/promotion/spire costs.

### 1.5 Castle paths (level ≥ 3, permanent, `PATH_COST` souls, `PATH_T=15`s, not on soul springs)
1. **Bastion** — defence ×1.8 and counts as *walled* (attackers without siege do ×0.35 to it), holds 25% more. Not for the Throne.
2. **Soul Well** — altar, passive souls, 1.5× sacrifice yield, breeds 30% slower. (The "soul collection" specialization.)
3. **Dark Tower** — can hire a **lord**; sees far (vision 460 instead of 210–255); garrison fires +50% (Keepfall's watchtower).
4. **Hellforge** — breeds 50% faster; training and promotion cost ×0.6; unlocks greater demons at level 3.
`PATHS = [null,{name,desc},…]` with those four. Capturing a castle keeps its level −1 and drops the path unless level < 3 (as Keepfall:
level −1, path lost) — keep Keepfall's `capture()` logic minus buildings and the Vanguard effect.

### 1.6 Research = cards
* `researchCost(G,s) = round(45 · 1.28^p.rn)` souls (`rn` = cards picked so far). `drawResearch(G,s)` pays and sets `p.offer = [id,id,id]`
  (three distinct eligible card ids, weighted random from the host's `G.rng`); with a pending offer it does nothing.
  `pickCard(G,s,i)` takes `p.offer[i]`, adds it to `p.cards[id]`, increments `rn`, clears the offer, applies effects immediately.
  A pending offer persists (the player may close the overlay and come back). First two draws must contain a spell card while a spell slot
  is free.
* **Cards** (`CARDS[id] = {id,key,name,desc,tag,max,w}`; `tag` ∈ `'soul'|'war'|'lord'|'magic'`; stackable up to `max`):
  `0 grow` Fecund Pits (+10% breeding, 6) · `1 tithe` Blood Tithe (+10% sacrifice yield, 6) · `2 pilgrim` Swift Pilgrims (pilgrims +25% speed, 3) ·
  `3 well` Deep Wells (+25% from Soul Wells & Springs, 4) · `4 thrift` Pact of Thrift (−8% level/path/promotion/spire cost, 4) ·
  `5 cap` Wider Dens (+10% castle capacity, 5) · `6 acap` Legion Writ (+30 army cap, 5) · `7 dmg` Razor Claws (+6% damage, 6) ·
  `8 hp` Thick Hides (+8% health, 5) · `9 spd` Hellwind Haste (+8% march speed, 4) · `10 def` Brimstone Walls (+8% castle defence, 5) ·
  `11 siege` Siegebreakers (full damage vs walls, unique) · `12 blood` Blood Oath (units leave castles as rank-1 veterans, unique) ·
  `13 muster` Dread Levy (+25% muster limit, bigger route packets, 3) · `14 spire` Spire Mastery (spires +25% hp & fire rate, 3) ·
  `15 laura` Tyrant's Aura (lord aura +25%, 3; only offered with a Dark Tower or a lord) · `16 lhp` Unbroken Will (lords +30% hp, 3; same) ·
  `17 lcost` Infernal Contract (lords −25% cost, 2; same) · `18..22 learn0..learn4` Learn Hellfire / Shatter / Eye of Hell / Frenzy / Plague
  (unique each; only offered while a spell slot is free) · `23 spellpow` Arcane Pact (spells −12% cost & cooldown, 3; needs ≥1 spell) ·
  `24 reach` Far Reach (+15% spell area/duration, 3; needs ≥1 spell).
  Weights `w`: soul 3, war 3, lord 1.5, learn 3, spellpow/reach 2. No stat card may be offered at max stacks.
  Aggregate effects are cached in `p.mod` (recomputed on pick and on `decodeInto`).

### 1.7 Spells (two slots)
`p.spells = [id|-1, id|-1]` (a learned spell takes the first free slot), `p.cd = [readyAt0, readyAt1]` (in `G.gt` time). Cast with
`useSpell(G,slot,k,x,y)` where `k` is the *slot* (0/1); `x` is a castle index for castle spells, `x,y` world coords for point spells.
`SPELLS[id] = {id,name,desc,cost,cd,kind:'point'|'castle',…}`:
0 **Hellfire** (point, 70 souls, cd 55): after 1.6 s damages every enemy soldier within r 45 (~1.0 hp) and spires (−6) in 1.4r.
1 **Shatter** (castle, 60, cd 70): breaches the walls for 22 s (defence ×0.8, no wall penalty) and kills 10% of the garrison.
2 **Eye of Hell** (point, 30, cd 40): reveals radius 330 for 15 s.
3 **Frenzy** (point, 50, cd 60): your soldiers within r 90 get +40% damage and +20% speed for 12 s (`s.fz = until`).
4 **Plague** (castle enemy/neutral, 65, cd 75): for 25 s its growth stops (`c.sab`) and its garrison loses 1.2%/s (min 1 troop).
`spellCost(G,s,id)`, `spellCd(G,s,id)`, `spellR(G,s,id)` apply `spellpow`/`reach`.

### 1.8 Lords
* `canLord/lordStatus(G,slot,ci)`: castle is yours, `path===3`, not building, no living lord whose `home===ci`, recovery over
  (`c.lordCd`), souls ≥ `lordPrice = (140+70·p.lh)·(1−.25·cards.lcost)`.
* `hireLord` puts a lord record in the castle: `c.lords = [{id,home,hp,max,rk,xp,nm}]` (names from `LORD_NAMES`). One per tower; several
  towers → several lords. Stats in 1.3; `max = 14·(1+.3·cards.lhp)`.
* A lord garrisons, heals (+0.4 hp/s), and boosts the castle (defence ×1.15, fire +6). When you muster/squad/dispatch from a castle with a lord
  and the Send mix has the **Lord** bit (bit 3), and the block is ≥ 6 troops, the lord leaves first, at the head of the block, as a soldier
  `u=3` (`s.lord` = his record). Routes (castle auto-streams) and pilgrims never carry lords.
* **Aura** (radius 85): friendly soldiers near a lord get +20% damage and +8% speed (×(1+.25·cards.laura)); stacking from several lords does not
  stack (best one applies).
* A lord entering a friendly castle garrisons there (record moved to that castle's `lords`, hp kept). If his soldier dies:
  event `lorddie`, record removed, `c.lordCd = 40 s` at his home tower (if still yours). A castle holding lords that is captured kills them.
* The lord is the only unit with a name; the UI shows "Lord Malvek" etc.

### 1.9 Combat, spires, fog, Hellgate
* Combat, targeting, formations, veteran ranks, muster (`musterCap = 30+30·lv`, ×1.25^cards.muster), spires on roads (45 souls: they shoot,
  heal, can be broken), fog of war, day/night (night shrinks vision; keep `nightLevel`), supply, hills (+30% defence) are **unchanged** from
  Keepfall except naming and the removals below.
* Walls: neutral fortresses (`c.nw`) and Bastion castles are *walled*: attackers do ×0.35 to them unless they have siege (card Siegebreakers,
  greater demons, lords, or the castle is breached by Shatter).
* **Removed**: all buildings (Moat, Barracks, Market, Watchtower, Stables, Granary, Workshop, Mercenary Camp), Markets/trade routes, Tax mode,
  Mastery, the five research branches, mines-as-gold, Mercenary hires, Engineers/Logistics effects.
* **Hellgate** (the Wonder, same state machine): needs the Throne at level ≥ 3; five stages, each `WONDER_COST=700` souls and `WONDER_T=45` s;
  after the fifth, hold the Throne `WONDER_HOLD=240` s (attacks on it roll the timer back); everyone is warned. `opts.wonder` can disable it.
  Events `wonder`, `wstage`, `wdone` keep their names.
* Victory: take every rival Throne, or finish and hold the Hellgate.

### 1.10 Bots
Four personalities (indexes unchanged): `PERS = ['Balanced','Aggressive','Turtle','Harvester']`. Three difficulties (`d` 0/1/2). They must
use every new system sensibly: offer mode on safe rear castles, altars (capital/Soul Wells), paths, promotions/training, research draws and
card choice by personality, lords (hire when a Dark Tower is idle and souls allow; lords go out with attack blocks), spells (Hellfire on
clusters, Shatter on walled targets, Frenzy before a big engagement, Plague on a Wonder capital), spires, Hellgate. Fog-limited via `botView`.
Targets for the sims: aggressive vs harvester bots ≈ 50/50, 4–6 player games median ≈ 15–20 minutes, almost no stalls.

---------------------------------------------------------------------------------------------------------------------

## 2. Engine API contract (src/core.js)

Everything is a top-level declaration (global in the browser) and also listed in `module.exports` for the Node tests.
Keep the file loadable in Node and in the browser. `newGame(cfg)`, `step(G,dt)`, `encode(G,budget)`, `decodeInto(G,g)`, `decSol(str)` keep their shapes.

**Data**: `COLORS` (8 banner colours, see §4), `NEUTRAL=9`, `LV`, `LVCOST`, `maxLv(c)`, `UNIT` (4 entries, fields `name,short,hp,spd,dmg,wall,cost,souls,req`),
`NU=3`, `PATHS`, `PATH_COST`, `PATH_T`, `CARDS`, `SPELLS`, `MAXSPELL=2`, `LORD_NAMES`, `PERS`, `MAPTYPES`, `MAPTHEME`, `WONDER_COST/STAGES/T/HOLD`,
`TOWER_COST/HP/R/T`, `SUMMON_N/BASE`, `PROMO_N`, `SAC_N`, `PILG_N/IV`, `MAX_SOL`, `SPEED_S`, `ROUTE_IV/PKT`, `FIRE`, `HIT_W/CD_W`, `DAY_LEN`.

**State shapes** (what the UI may read; all must survive `encode`/`decodeInto` for client/replay views):
* `G`: `W,H,castles,edges,adj,edgeKey,bars,starts,home,capIdx,slots,sp,sol,time,gt,over,winner,winBy,pl,tw,fires,scouts,events,names(set by UI),
  theme('ash'|'frost'|'sulfur'),weather('clear'|'embers'|'ash'|'wind'|'snow'),opts{wonder,souls,fog,neut},cfg,terrainSeed,mt,tot[],nAct`.
* castle `c`: `x,y,owner,size,u[3],lv,kind,path(0..4),off(0|1),tr(mask),route,build{k,t,dur}|null (k=0 level up, k=20+path),hill,nw,br,sab,capital,sup,
  assault,base,lords[]`.
* soldier `s` (host): `id,o,x,y,px,py,hx,hy,st(0 walk,1 fight,2 attack castle,3 muster),u(0..3),rk,hp,g,sac(0|1),alt(altar idx),lord(record|null),fz`.
  Client/replay `G.csol[]`: `x,y,o,hx,hy,st,u,vr,rk,sac` (decoded from the 6-char packing; the engine agent may re-pack, e.g. 10-bit half-resolution
  coordinates, to fit the new `sac` bit; keep `decSol` output shape).
* player `p=G.pl[s]`: `souls,earned,inc,cards[],offer[]|null,rn,mod{},spells[2],cd[2],mix(0..15, default 15),pour,out,taken,kills,peak,ws,wb,wh,hm,lh`.
* events (`G.events`, UI consumes and clears): `die{x,y,o,u}` `shot{x,y,tx,ty}` `fire{x,y}`(Hellfire hit) `breach{c}`(Shatter) `plague{c}` `frenzy{x,y,r,s}`
  `eye{x,y,s}` `tdie{x,y,o}` `rank{x,y,o,rk}` `cap{c,by,loot,drop}` `elim{s,by}` `wonder{s,stage}` `wstage{s,stage}` `wdone{s,stage}` `up{c}` `built{c}`
  `summon{c}` `sac{x,y,s,n,souls,c}`(souls gained at an altar) `promote{c,n,tier}` `card{s,id}` `offer{s}` `lord{s,c}` `lorddie{x,y,s}` `spell{s,id,slot}`.

**Commands** (all take `(G,slot,…)`, return bool, validate ownership; the UI maps them to numeric command ids in `runCmd`):
| id | call | meaning |
|----|------|---------|
| 1 | `squad(G,slot,from,to)` | small squad along a road |
| 2 | `setRoute(G,slot,from,to)` | `to<0` stops |
| 3 | `upgrade(G,slot,ci)` | next castle level (`upCost(G,slot,c)`, Infinity when impossible) |
| 4 | `setOffer(G,slot,ci,v)` | breed (0) / offer (1) |
| 5 | `drawResearch(G,slot)` | pay, get 3 cards |
| 6 | `useSpell(G,slot,k,x,y)` | cast spell slot k |
| 8 | `summon(G,slot,ci)` | buy 10 minions |
| 9 | `setMix(G,slot,mask)` | Send chips, 4 bits (minion, lesser, greater, lord) |
| 10 | `setTrain(G,slot,ci,mask)` | train mask |
| 11 | `buildTower(G,slot,ci,to)` | spire on a road |
| 12 | `choosePath(G,slot,ci,path)` | path 1–4 |
| 13 | `pickCard(G,slot,i)` | choose offered card i (0–2) |
| 14 | `buildWonder(G,slot)` | next Hellgate stage |
| 15 | `promote(G,slot,ci,tier)` | tier 1 or 2 |
| 16 | `sacrifice(G,slot,ci)` | instant sacrifice at an altar |
| 17 | `hireLord(G,slot,ci)` | |
Plus `dispatch(G,slot,from,to,n,mask)`, `setPour(G,slot,from,to)` (hold-to-muster, mask = `p.mix`).

**Queries for the UI**: `capOf(c)`, `armyCap(G,s)`, `musterCap(c)`, `growRate(G,c)`, `soulRate(G,c)` (passive souls/s), `defMul(G,c)`, `breached(G,c)`, `isAltar(c)`,
`isWalled(c)`, `unitOk(c,t)`, `trainMask(c)`, `upCost(G,slot,c)`, `pathCost(G,s)`, `promoCost(G,slot,c,tier)` (per unit), `promoCount(G,slot,c,tier)` (how many would convert),
`sacPreview(G,slot,c)→{n,souls}`, `summonPrice(G,s,c)`, `towerCost(G,s)`, `researchCost(G,s)`, `cardCount(G,s,id)`, `cardEffect(id,n)→string` (e.g. "+30%"),
`spellCost/spellCd/spellR(G,s,id)`, `lordStatus(G,slot,ci)→{can,price,why,lord}`, `lordPrice(G,s)`, `castleVision(c)` (radius before the night factor), `nightLevel(t)`,
`teamOf(G,o)`, `aliveTeams(G)`, `has`-style helper `mod(G,s,key)`.

**Config**: `newGame({seed,slots,W,H,ms,sp,mt,botDelay,opts})`, `opts = {wonder:1,souls:40,fog:1,neut:1}`. Slots keep the shape `{k:'h'|'b'|'x'|'o', n, t, d, pe, p}` plus bot flags
`noRes` (never draws cards) and `noArmy` (ignores war cards/promotions) and `wonderFirst` for the sims. `G.cfg` must let `newGame({...G.cfg})` rebuild an identical world (replays).

---------------------------------------------------------------------------------------------------------------------

## 3. UI contract

**Files**: `head.js` (menus, setup, campaign, tutorial, daily, replays, networking glue, game over) · `panel.js` (names, commands, Send chips, spell bar,
research overlay, castle panel) · `tail.js` (camera, fog, effects, renderer, HUD update, stats, gestures). Load order: head → panel → tail (functions are hoisted;
top-level `const/let` must not be *used* at load time before definition in a later file).

**Command numbers** are exactly the ids in the table above (`runCmd(slot,[seq,type,a,b,c])`, `issue(type,a,b,c)`).

**DOM ids** that scripts may rely on (the owner of the HTML keeps them):
* Menu/setup/lobby (shell.html): `#name #b-camp #b-daily #b-local #b-host #b-join #net-note #b-replay #b-help`, `#setup-title #code-box #code #slots #mt #setup-msg #b-start`,
  `.seg[data-opt=ms|wonder|souls|fog|neut|sp]` (note `souls`, not `gold`), `#games #code-in #b-code #join-msg`, `#wait-title #wait-slots #wait-msg`, `#missions`,
  overlay `#ov` / `#ov-card`, `[data-back]` buttons.
* Game screen (game.html): `#s-game` (class `replay` toggled), `.hud` with `#b-pause #souls #inc #troops #tcap #castles #b-pp #b-spd #dn #clock`; `#power`;
  `#stage` containing `#cv #toast #wbanner #pausetag #panel #tut #tut-h #tut-p #tut-skip` and the zoom buttons `#z-in #z-out #z-fit`;
  replay bar `#rp-play #rp-speed #rp-range #rp-time #rp-exit`; Send bar `#mix` with four `[data-u="0|1|2|3"]` chips (minion, lesser, greater, lord) and `#b-units`;
  action bar `.ab[data-ab="0"]`, `.ab[data-ab="1"]` (the two spell slots; each contains `<b>`, `<small>` and `<i class="cdv">`) and `#b-res` (with `#res-sub`, `#res-prog`).
* localStorage keys use the prefix `bf-` (`bf-name bf-camp bf-replay bf-daily-<key>`). Online rooms are `bf-<code>`.

**Castle panel (owned castle, top to bottom)**: title + status line + chips · Breed/Offer toggle (not on springs) · *Sacrifice N → +X souls* button (altars) ·
Trains chips · Promote buttons (tier 1 / tier 2, "10 × cost") · build progress · Hellgate section (Throne) · path choice (level ≥ 3, no path) · lord section
(Dark Tower) · level-up button · spires per road · Summon row · route row · pings. Enemy/neutral castle: info chips only (+ pings in team games).
**Research overlay**: if `p.offer`, three large cards (tag colour stripe, name, effect text, "level a → b of max", or "New spell"); tapping picks and closes with a toast.
Otherwise a *Draw three cards · N souls* button, the owned cards with counts, and the two spell slots. The Research button in the action bar pulses "Choose a card" when an
offer is pending and shows the next price otherwise. The overlay re-renders while open.
**Send bar**: four chips Minion / Lesser / Greater / Lord; the lord chip is disabled with a hint when you have no lord.
**HUD**: souls icon (a glowing blue-white wisp, not a coin), `+x.x/s` from `p.inc`, army/cap, castle count, clock, ☾/☀ night indicator.
Alerts, pings, wonder banner (call it the Hellgate banner), power bar, replay, daily challenge, tutorial, campaign: keep behaviour, change copy and visuals.

---------------------------------------------------------------------------------------------------------------------

## 4. Art direction (procedural canvas only, no external assets, no fonts or CDNs)

**Look**: dark fantasy with readable silhouettes at tiny scale. Painterly vector style with gradients, rim light and ember glow — like a polished mobile strategy game, not
pixel art. Warm ember reds/oranges and sickly sulfur against basalt blacks and charcoal; **soul light is cold blue-white** (the one cool accent: altars, pilgrims, wells, springs).
Each player's colour must read instantly: banners, a glowing rune-circle sigil on the ground under every owned castle, cloth/armour accents on units, eyes/horn glow.
Neutrals are ash-grey/bone with a pale hostile glow. Night = a blood-moon tint (reddish dark), castles glow brighter.

**Player colours** (`COLORS`): `#ff4b4b #4aa3ff #46d68c #ffc83d #b277ff #ff8a3d #35d4d4 #ff6eb4`. Neutral colour `#8a8478`.

**Castles** (`art.js`, keep sizes/anchors so gameplay hit areas stay valid): footprint radii `RX=[0,70,98,128]`, `RY=[0,46,62,82]` art units, `ART=0.36` art→world scale,
canvas `size`, `ox,oy` anchor, `plaque` y offset, `flags[]` banner anchors, `smoke[]` chimney/vent anchors.
Lv1 *den*: bone-and-iron palisade, stump tower, brazier. Lv2 *lair*: towers + keep. Lv3 *citadel*: six spires, glowing windows, rune circle. Lv4: outer wall ring.
Lv5: huge spires, crown of fire. Lv6 *Throne*: soaring central spire, hellmouth gate. Throne marker = crowned-skull sigil (`drawSigil`, alias `drawStar`).
Paths must be visible: **Bastion** thick spiked ramparts, **Soul Well** a glowing blue soul-pit with an altar slab and rising wisps, **Dark Tower** a tall black tower with a violet eye-flame,
**Hellforge** chimneys, glowing anvil, sparks. Altars (Throne, Soul Well) show an altar slab with blue soul-fire. Neutral hovel = crude hide/bone huts with braziers inside a spiked fence;
bone fortress = black walls, red eyes, spires; soul spring = cracked pool with a blue soul-geyser, crystals and carts; lv2/3 add scaffolds and a smelter-like ring.
Spire (road tower), Hellgate (stages 1–5 then a swirling portal), banners, scorch marks, bridges (bone/iron over lava), passes (obsidian crags), hills (basalt mounds with rune rings).
**Terrain** (`buildTerrainArt`): ash = charred basalt, glowing cracks, ember specks, dead trees, bone piles, lava rivers/seas with crust and glow; frost = pale blue-grey ice
plains, snow-dusted dead pines, frozen river, soul-blue lights; sulfur = ochre/yellow sand, red rock, fumaroles, dry thorn. Roads = packed ash/bone-dust paths.

**Units** (`units.js`, signature `drawUnit(x,px,py,k,col,t,dir,u,bearer,act,v,sac)`; `t` animation phase, `dir` ±1 facing, `bearer` banner carrier, `act` fighting, `v` 0–15 variant,
`sac` pilgrim): minion = small skinny imp with horns, tattered loincloth/sash in player colour, club or pitchfork (~24 art units tall); lesser demon = bulky horned brute with
a spiked axe/club and shoulder plates (~30); greater demon = tall winged demon with a flaming blade, hovers and flaps (~42, soft ground shadow); lord = huge crowned demon with
a cape in the player colour, burning aura, banner (~50, drawn with a glow so it stands out). Pilgrims: minions with a faint blue-white soul glow and a short trail. Corpses
(`drawCorpse(x,px,py,k,col,u,flip)`) dissolve to ash/ember piles. Many units on screen at once (hundreds): keep the per-unit draw cheap or cache sprite frames per (type, colour, variant).

---------------------------------------------------------------------------------------------------------------------

## 5. Files, ownership and process

| File | Owner | Notes |
|------|-------|-------|
| `src/core.js`, `tests/*.cjs` | engine | rules, map gen, sim, commands, bots, encoding, tests/sims |
| `src/art.js` | art-world | castles, hovels, fortress, spring, spire, Hellgate, banners, sigil, terrain, props |
| `src/units.js` | art-units | unit figures, corpses |
| `src/panel.js`, `src/game.html`, `src/game.css` | ui-panel | commands, Send bar, spell bar, research cards, castle panel, HUD/game-screen markup |
| `src/tail.js` | ui-render | renderer, effects, weather, fog, HUD update, stats, gestures |
| `src/shell.html`, `src/head.js` | ui-shell | theme variables, menus, setup, help copy, campaign, tutorial, game over, networking glue |
| `build.mjs`, `tools/*`, `DESIGN.md`, docs | lead | |

* Only edit your own files. If you need something from another file, write it down in your final report (and code defensively). Do **not** commit, push, or run `npm run build`
  (it overwrites `www/` and `docs/`); build to a scratch dir with `node build.mjs --out <dir>`.
* The repo lives on WSL; the shell may be Git Bash on Windows. Run Node via WSL: `wsl.exe -d Ubuntu-24.04 -e bash -lc 'cd ~/coding/keepfall && <cmd>'` (Node 18).
  Scratch dir (writable from both sides): Windows `C:\Users\marti\AppData\Local\Temp\claude\--wsl-localhost-Ubuntu-24-04-home-martin-coding-keepfall\9bf40d5a-1195-407a-9363-73d7b28c2720\scratchpad`,
  WSL `/mnt/c/Users/marti/AppData/Local/Temp/claude/--wsl-localhost-Ubuntu-24-04-home-martin-coding-keepfall/9bf40d5a-1195-407a-9363-73d7b28c2720/scratchpad`.
* Look at your work: `node tools/shot.cjs <page.html> <out.png> [--w 390 --h 844 --dpr 2 --eval "js" --script file.cjs]` (headless Chromium via Playwright) and open the PNG with the
  Read tool. Iterate visually; do not guess. Page errors are printed and fail the run.
* Code style: match the surrounding code (dense, compact, short names, no comments except where intent is non-obvious). No external assets, fonts, or CDNs. No sound.
* `src/core.js` must stay loadable in Node (tests `require` it) and in the browser; nothing in it may touch `document`/`window` unguarded.

**Definition of done** — engine: `npm test`, `npm run sim:length` pass with finishing games, no NaN, `badGarrison 0`, encode round-trips, bots use all systems.
Art: screenshots reviewed by you at several zooms and every theme/level/path; no console errors. UI: runs against the real engine without console errors on
phone portrait (390×844) and desktop, panel and research flows work, copy has no leftover Keepfall terms (gold, buildings, tax, knights, spearmen, militia, market, wonder → souls,
paths, offer, greater demons, minions, Hellgate).
