# Act 3 Paper Playtest --- Circles 7-9

**Date:** 2026-03-01
**Auditor:** Claude (paper playtest, cross-referencing design docs vs. build scripts vs. asset inventory)
**Method:** Room-by-room walkthrough as 3 personas, full asset audit per circle

---

## Executive Summary

Act 3 is the strongest act in narrative design and mechanic escalation. The three circles each have a clear identity (bleeding/fire, deception/mimics, ice/reflection), strong boss encounters, and thoughtful pacing. The design docs are detailed and well-considered.

**Biggest wins:**
- Circle 7's bleeding mechanic creates genuine urgency --- the "murder is medicine" loop is brilliant
- Circle 8's mimic system and the honest secret room (Serenissima) are standout design
- Circle 9's Cocytus Bridge (36 cells of nothing) is the bravest design choice in the game
- The boss fights escalate perfectly: Il Macello (physical), Inganno (deception), Azazel (philosophical)
- Build scripts faithfully translate design docs --- rooms, connections, enemies, pickups all match

**Biggest gaps:**
- ALL THREE build scripts use only "Fantasy Props MegaKit" generic prop names (Torch_Metal, Chain_Coil, Barrel, etc.) --- ZERO circle-specific Meshy props are placed. All 69 circle-specific props (25 Violence, 22 Fraud, 22 Treachery) are absent from the build scripts.
- ZERO Quaternius props are used. The build scripts reference props like "Torch_Metal," "CandleStick_Triple," "Chandelier," "Chain_Coil" --- these are Fantasy Props MegaKit names, NOT Quaternius GLB names. The 62 Quaternius props that already have working GLBs and render in-game are completely unused.
- Several rooms are prop-sparse or empty (Burning Shore in C7, Cocytus Bridge in C9 --- the latter by design, the former not)
- No Meshy general props (arch-gothic, chain-hanging-single, hellfire-brazier, etc.) are placed anywhere

**Critical concern:** The 319-prop inventory exists on paper but exactly 0 of the Quaternius GLBs, 0 of the 62 Meshy general props, and 0 of the 69 circle-specific Meshy props appear in any build script. The build scripts use a parallel naming system ("Torch_Metal", "Chain_Coil", "Column_Stone") that does not map to any asset in the inventory. This is the single largest gap in Act 3.

---

## Circle 7: Violence

### Asset Audit

**Build script uses (unique prop names):**
Torch_Metal (x13), Rope_1 (x1), Rope_3 (x2), Cauldron (x3), Barrel (x5), CandleStick_Triple (x1), Chain_Coil (x17), Lantern_Wall (x5), Crate_Metal (x8), Workbench (x2), Anvil (x1), Bucket_Metal (x2), Chandelier (x1), Sword_Bronze (x2), Shield_Wooden (x2)
**Total: 65 prop instances, 15 unique prop types**

**Design doc describes (Props table):**
Identical to build script. The design doc specifies room-by-room props using the Fantasy Props MegaKit naming convention. The build script faithfully replicates every entry.

**Circle-specific Meshy props available (25 --- NONE placed):**
blood-trough, meat-hook, torture-rack, violence-blood-cauldron, violence-blood-gutter, violence-blood-pool, violence-blood-river-arch, violence-bone-grinder, violence-butcher-block, violence-chain-conveyor, violence-fire-geyser-vent, violence-grating-panel, violence-hook-rack, violence-industrial-arch, violence-industrial-cage, violence-iron-railing, violence-metal-crate-stack, violence-pier-overlook, violence-riveted-pipe-pillar, violence-rusted-anvil, violence-rusted-walkway-platform, violence-sawblade-decoration, violence-stone-altar, violence-thorn-column, violence-walkway-pillar

**Quaternius props applicable (already have GLBs, render in-game):**
- `prop-barrel` -> replaces "Barrel" (x5 instances)
- `prop-torch-lit` or `prop-torch-mounted` -> replaces "Torch_Metal" (x13 instances)
- `prop-column` or `prop-column-broken` -> walkway pillars
- `prop-spikes` or `prop-trap-spikes` -> thorn passage decoration
- `prop-skull` or `prop-rpg-skull` -> Blood River shoreline decoration
- `prop-bones` or `prop-bones2` -> scattered in Thornwood/Abattoir
- `prop-axe-wall` -> replaces "Sword_Bronze" on Abattoir south wall (thematically better --- butcher uses cleaver)
- `prop-shield-wall` -> replaces "Shield_Wooden" on walls
- `prop-chest` -> Butcher's Hook secret room
- `prop-firebasket` -> Burning Shore fire geyser decoration
- `prop-candelabrum-tall` -> replaces "CandleStick_Triple"
- `prop-chalice` -> could supplement Cauldron in shrine
- `prop-crate` -> replaces "Crate_Metal"
- `prop-pedestal` -> weapon altar base in Flamethrower Shrine
- `prop-scythe` -> wall decoration in Abattoir

**Redundancies:**
- "Cauldron" in build script could be `violence-blood-cauldron` (circle-specific, more thematic)
- "Anvil" could be `violence-rusted-anvil`
- "Crate_Metal" could be `violence-metal-crate-stack`
- "Chain_Coil" could be `violence-chain-conveyor` or `chain-hanging-cluster` (Meshy general)
- "Lantern_Wall" has no direct Quaternius equivalent, but `prop-torch-mounted` exists

**Missing from build script:**
ALL 25 circle-specific props. Most critically:
- `violence-blood-pool` / `violence-blood-river-arch` --- Blood River has NO props that sell the blood river visually beyond floor textures
- `violence-fire-geyser-vent` --- Burning Shore fire geysers are env zones only, no visual prop
- `violence-hook-rack` / `meat-hook` --- Slaughterhouse uses "Chain_Coil" instead of actual meat hooks
- `violence-thorn-column` --- Thornwood has NO visual thorn props; the thorns are described as wall textures only
- `violence-pier-overlook` / `violence-iron-railing` --- Pier has Rope_1 only, no industrial railing
- `violence-sawblade-decoration` --- not placed anywhere (perfect for Slaughterhouse)
- `violence-walkway-pillar` / `violence-riveted-pipe-pillar` --- Blood River walkway pillars are structural only, no prop

### Room-by-Room Walkthrough

#### Room: Pier (8x6, sortOrder 0)

**First-Timer:** I spawn on an elevated pier overlooking a vast red chamber below. Two torches, a blood-filled cauldron, a barrel, a rope. The bleeding mechanic starts immediately --- red pulsing HUD. I understand I need to move. The stairs descending south are obvious. **Good onboarding, clear direction.** But the room feels sparse for a circle opener --- 5 props in 48 cells.

**Speedrunner:** Wide open, no obstacles. Sprint to stairs, drop down. 3 seconds to clear. The rope on the railing is decoration --- does not block movement. Clean.

**Explorer:** Only an ammo pickup. No secrets, no visual reward for looking around. The Cauldron and Barrel feel generic. With `violence-pier-overlook` and `violence-iron-railing`, this could feel like a proper industrial overlook. Currently feels like a placeholder room with placeholder props.

**Verdict:** NEEDS WORK
**Recommendations:** Add `violence-pier-overlook` (structural), `violence-iron-railing` (along edge), replace `Barrel` with `prop-barrel`, replace `Cauldron` with `violence-blood-cauldron`. Add bones/skulls scattered on floor for dread.

---

#### Room: Blood River (20x14, sortOrder 1)

**First-Timer:** Massive room. Red floor, raised walkways. Three goatKnights patrol. Six torches on walkway pillars give me landmarks. I understand walkway = safe, blood = death. The branching paths create genuine choices. This room delivers on the design doc's promise of "wading danger." But the blood surface is a floor texture only --- no arching bridge props, no blood waterfalls, no gutter channels. It reads as "red floor."

**Speedrunner:** Multiple routes to both exits. West exit (to River Banks) and east exit (to Thorny Passage) are clear. Walkways are wide enough (2-3 cells) to sprint past goatKnights. Good.

**Explorer:** Dead-end walkway with ammo (35,22) rewards exploration. But there is NO visual distinction between the dead-end and the main path --- just more of the same walkway. A prop (chest, crate, skull pile) at the dead end would signal "this path has a reward."

**Verdict:** NEEDS WORK
**Recommendations:** Place `violence-blood-river-arch` at walkway intersections, `violence-walkway-pillar` under walkways, `violence-blood-pool` at blood surface edges, `prop-bones`/`prop-skull` at dead ends. Add 2-3 `violence-blood-gutter` where blood drains between walkway segments. The room is large (280 cells) with only 6 torches --- it needs 8-12 more props to feel like a built environment rather than a colored floor.

---

#### Room: River Banks (8x6, sortOrder 2)

**First-Timer:** Small transitional room. Torch, barrels, cauldron, one fireGoat. Feels like a brief corridor room --- exactly what it should be. The elevation rise (0 to +0.25) is subtle but welcome.

**Speedrunner:** Tiny room, sprint through. One fireGoat is a speedbump. Clear in 5 seconds.

**Explorer:** Nothing to find. Health pickup near south exit is visible on entry. No secrets, no secondary paths. Acceptable for a transitional space.

**Verdict:** GOOD
**Recommendations:** Minor: replace `Barrel` with `prop-barrel`, add a `prop-bones` pile for flavor. No major changes needed --- this room earns its brevity.

---

#### Room: Thorny Passage (6x16, sortOrder 3)

**First-Timer:** Narrow vertical gauntlet. Thorn walls on both sides (5 damage on contact). Elevation ramps up and down. Two fireGoats shoot from above. The design concept is superb --- claustrophobic, lethal, tense. But there are only 2 props (Rope_3 hanging markers). 96 cells, 2 props. The thorn walls are communicated entirely through damage zones and wall textures --- there are zero `violence-thorn-column` props to visually sell "these walls are thorned."

**Speedrunner:** Sprint through center, 3 cells wide. Enough space to dodge fireGoat projectiles laterally. The ramps create mild slowdown but do not block speed. Clear in 8-10 seconds.

**Explorer:** Nothing to explore --- linear corridor by design. The two hanging Rope_3 are the only landmarks. No pickups except ammo at (46,30) midpoint.

**Verdict:** NEEDS WORK
**Recommendations:** Place `violence-thorn-column` at 4-6 points along the thorn walls to visually sell the hazard. Use `prop-spikes` at ramp transitions. The Rope_3 markings are good but insufficient --- the passage needs visual variety to prevent monotony across 16 cells of depth.

---

#### Room: Thornwood (14x12, sortOrder 4)

**First-Timer:** Dense forest of thorny columns creating 2-3 cell lanes. Good concept. But only 1 prop (Torch_Metal on south wall). 168 cells, 1 prop. The thorny columns are described as "1x1 WALL_STONE with Rust007 texture" --- structural cells, not prop instances. This means the room's visual identity depends entirely on wall textures. No `violence-thorn-column` props, no `prop-dead-tree` (would fit a "thornwood" perfectly), no bone piles.

**Speedrunner:** Lanes allow direct south route. Enemies can be bypassed by weaving between columns. Mixed enemy types (goatKnight, hellgoat, fireGoat) mean no single threat blocks the path.

**Explorer:** Health pickup at (42,44) center. No secrets. The column density should create interesting sight lines and hidden corners, but there is nothing IN those corners. Every dead end between columns is empty.

**Verdict:** NEEDS WORK
**Recommendations:** Add `violence-thorn-column` at 4-6 positions between structural columns. Place `prop-dead-tree` (x2-3) for the "thornwood" name to be literal. Add `prop-bones` at dead-end column clusters. Place `prop-skull` or `prop-rpg-skull` at lane intersections as breadcrumbs. This room's concept is strong but its prop density is the worst in the circle.

---

#### Room: Burning Shore (18x10, sortOrder 5)

**First-Timer:** Vast open expanse after claustrophobic thorns. Four fireGoats with long sightlines. Six fire geysers. The openness is terrifying --- no cover. But there are ZERO props. The design doc says "none (deliberate emptiness)" and the build script matches. However, the 6 fire geyser zones have no visual prop --- they are pure damage zones. Without `violence-fire-geyser-vent` at each geyser position, the player has no visual reference for where eruptions happen until they get hit.

**Speedrunner:** Sprint diagonally from north entry to south exit. Geysers are on timers (3s on, 5s off, staggered) --- predictable once mapped. Wide open, no obstacles. The 4 fireGoats are the only threat. Clear in 10-12 seconds.

**Explorer:** Pickups (2 ammo, 1 health) are at the south edge. The room offers nothing to find --- the emptiness is the point. But 180 cells with 0 props is too empty even for deliberate emptiness.

**Verdict:** NEEDS WORK
**Recommendations:** Place `violence-fire-geyser-vent` at each of the 6 geyser positions (critical --- visual landmark for damage zones). Keep the rest empty but add 2-3 `prop-rock1`/`prop-rock2`/`prop-rock3` as scattered boulders for minimal visual break. The deliberate emptiness concept is good but "0 props" is not "deliberate emptiness" --- it is "unfinished."

---

#### Room: Flamethrower Shrine (6x6, sortOrder 6)

**First-Timer:** Small, sacred space. CandleStick_Triple behind the altar, two wall-mounted Torch_Metal, a Cauldron on the floor. The flamethrower pickup is THE moment --- the scapegoat's destiny weapon. 36 cells, 4 props. Feels intimate and intentional. The design doc describes it as "almost a tomb" and it delivers.

**Speedrunner:** Grab weapon, grab health, exit south. 3 seconds.

**Explorer:** The dialogue trigger ("The wilderness gave you fire. Use it.") rewards attention. The Cauldron here is "cold and empty" per the design doc --- narrative contrast with the blood-filled ones elsewhere. Smart.

**Verdict:** GOOD
**Recommendations:** Minor: replace `Cauldron` with `violence-stone-altar` for the altar prop itself. Add `prop-pedestal` under the weapon pickup. Consider `prop-candle` (x2) flanking the altar for more warmth.

---

#### Room: Slaughterhouse (14x12, sortOrder 7)

**First-Timer:** This room DELIVERS. 9 Chain_Coil from the ceiling (meat hooks), 4 Lantern_Wall, 4 Crate_Metal for cover, 2 Workbench, 1 Anvil, 2 Bucket_Metal. 22 props in 168 cells --- the densest room in Circle 7. The industrial abattoir feel is strong. Three waves of enemies with hooks dropping between waves reshape the arena.

**Speedrunner:** Arena lock means you cannot skip. Three waves is significant time investment (~90 seconds minimum). Crate_Metal cover positions are predictable --- speedrunners will memorize optimal positions. Hook drops adding floor hazards is good anti-cheese.

**Explorer:** WALL_SECRET east wall leads to Butcher's Hook secret room. The props sell the industrial theme. The mix of cover, landmarks, and hazards makes the room readable.

**Verdict:** GOOD
**Recommendations:** Replace `Chain_Coil` with `violence-hook-rack` or `meat-hook` (circle-specific, more thematic). Replace `Crate_Metal` with `violence-metal-crate-stack`. Add `violence-sawblade-decoration` on walls. The generic props work but the circle-specific ones would be better.

---

#### Room: Butcher's Hook --- Secret (6x6, sortOrder 8)

**First-Timer:** Hidden behind WALL_SECRET. Packed with Crate_Metal and Barrels. 4 Crate_Metal, 2 Barrel, 1 Lantern_Wall. Generous pickups (2 ammo, 2 health, 1 fuel). This is a pure reward room --- correct for a secret.

**Speedrunner:** Optional. Skip unless fuel is needed.

**Explorer:** The Lantern_Wall on the north wall is the only light source --- the dim lighting sells "hidden cache." Pickups are generous as designed. No enemies.

**Verdict:** GOOD
**Recommendations:** Minor: add `prop-chest` for the ammo/health, replace `Crate_Metal` with `violence-metal-crate-stack`.

---

#### Room: Il Macello's Abattoir --- Boss (16x16, sortOrder 9)

**First-Timer:** Massive. 8 Chain_Coil from ceiling, 4 Torch_Metal at corners, 1 Chandelier center, 2 Sword_Bronze and 2 Shield_Wooden on south wall. The retractable floor grating mechanic (phase 3) is the visual and mechanical climax. The boss has 3 distinct phases with clear escalation. 256 cells, 17 props.

**Speedrunner:** Boss fight is mandatory. Phase 3 floor retraction creates time pressure. Optimal strategy: flamethrower during phase 1 stuck windows, dodge chain grapple in phase 2, burn hard before floor runs out in phase 3.

**Explorer:** Symmetric pickup placement (ammo and health in all 4 corners) allows flexible routing during the fight. Sword_Bronze and Shield_Wooden on the south wall are narrative trophies --- thematically strong.

**Verdict:** GOOD
**Recommendations:** Replace `Chain_Coil` with `meat-hook` for thematic specificity. Add `violence-grating-panel` as visual indicator for retractable floor sections. Add `violence-industrial-cage` in a corner for visual weight. The boss room is well-propped but could use 2-3 more circle-specific props to distinguish it from a generic industrial space.

---

### Circle 7 Gap Analysis

**Over-dressed rooms:** Slaughterhouse (22 props) --- correct for an arena, no issue.
**Under-dressed rooms:** Thornwood (1 prop in 168 cells), Burning Shore (0 props in 180 cells), Blood River (6 props in 280 cells), Thorny Passage (2 props in 96 cells).
**Missing prop types:** Zero circle-specific Meshy props placed. Zero Quaternius GLBs used. All props are Fantasy Props MegaKit names.
**Balance:** The circle has a front-heavy emptiness problem. The first 5 rooms (Pier through Burning Shore) average 3.4 props each. The last 5 rooms (Shrine through Abattoir) average 10.2 props each. The player spends the first half of Violence in visually sparse environments and the second half in dense ones. This is somewhat intentional (the bleakness of the sub-rings) but the transition is too stark.
**Prop count:** 65 total instances. For a 10-room circle with 60x110 grid (the largest in the game), this is LOW. Target: 100-120 props.

---

## Circle 8: Fraud

### Asset Audit

**Build script uses (unique prop names):**
Chandelier (x3), CandleStick_Triple (x12), Banner_1 (x4), Banner_2 (x2), Vase_4 (x4), Vase_2 (x2), Table_Large (x2), Chalice (x4), Scroll_1 (x1), Coin_Pile (x5), Chest_Wood (x3), Torch_Metal (x6), Vase_Rubble (x4), Column_Stone (x2), Barrel (x1), Cauldron (x1), BookStand (x1), Candle_1 (x2), Potion_4 (x1), Bookcase_2 (x2), Chair_1 (x1)
**Total: 63 prop instances, 21 unique prop types**

**Design doc describes (Props table):**
Identical. The design doc's room-by-room props table specifies the same Fantasy Props MegaKit names. Build script is a faithful translation.

**Circle-specific Meshy props available (22 --- NONE placed):**
false-door, fraud-broken-chandelier, fraud-coin-pile, fraud-cracked-mosaic-floor, fraud-crumbling-facade, fraud-fake-column, fraud-forked-tongue-relief, fraud-gambling-table, fraud-golden-banner, fraud-marble-debris, fraud-marble-pedestal, fraud-mirror-shard, fraud-onyx-wall-panel, fraud-ornate-arch, fraud-ornate-railing, fraud-ramp-platform, fraud-shifting-wall-segment, fraud-silhouette-prop, fraud-stage-curtain, fraud-theatrical-column, fraud-two-faced-bust, trick-chest

**Quaternius props applicable (already have GLBs):**
- `prop-banner` / `prop-banner-wall` -> replaces "Banner_1" / "Banner_2"
- `prop-candelabrum-tall` -> replaces "CandleStick_Triple"
- `prop-chalice` -> replaces "Chalice"
- `prop-chest` / `prop-chest-gold` -> replaces "Chest_Wood" (and `prop-chest-gold` could be the Serenissima chest)
- `prop-chair` -> replaces "Chair_1"
- `prop-table` / `prop-table-small` -> replaces "Table_Large"
- `prop-vase` -> replaces "Vase_2" / "Vase_4"
- `prop-bookcase` -> replaces "Bookcase_2"
- `prop-book-open` -> supplement BookStand
- `prop-column` -> replaces "Column_Stone"
- `prop-barrel` -> replaces "Barrel"
- `prop-torch-mounted` -> replaces "Torch_Metal"
- `prop-candle` / `prop-candle-multi` / `prop-candles` -> replaces "Candle_1"
- `prop-carpet` -> Portico, boss chamber floor decoration
- `prop-potion` -> replaces "Potion_4"
- `prop-cobweb` / `prop-cobweb2` -> hidden corners, behind banners

**Redundancies:**
- "Chandelier" (generic) vs `fraud-broken-chandelier` (circle-specific --- better for "beauty decaying")
- "Coin_Pile" vs `fraud-coin-pile` (circle-specific, false wealth theme)
- "Column_Stone" vs `fraud-fake-column` / `fraud-theatrical-column` (circle-specific, mimics)
- "Chair_1" (generic) could supplement `fraud-gambling-table`

**Missing from build script:**
ALL 22 circle-specific props. Most critically:
- `fraud-silhouette-prop` --- the design doc describes 4 "friendly silhouette" NPCs in Bolgia of Flatterers, but no prop is placed. The silhouettes are enemies ("hellgoat disguised as friendly") but there should also be visual props
- `fraud-mirror-shard` --- Hall of Mirrors has no reflective prop placed; onyx wall panels are described as "reflective material, structural" but no prop sells this
- `fraud-onyx-wall-panel` --- designed specifically for this room, not placed
- `fraud-shifting-wall-segment` --- Shifting Maze describes moveable walls but uses structural WALL_STONE, no prop
- `fraud-fake-column` --- Counterfeit Arena's 6 "columns" (4 are mimics) should use this prop, not "Column_Stone"
- `fraud-two-faced-bust` --- not placed anywhere (perfect for corridors)
- `fraud-ornate-arch` --- not placed at room entrances
- `fraud-golden-banner` --- not placed (design doc specifies Fabric026/045 draping)
- `fraud-marble-pedestal` --- not placed (design doc references pedestals)
- `false-door` --- not placed anywhere (deception theme, could decorate dead ends)
- `trick-chest` --- not placed (perfect for Bolgia of Thieves)
- `fraud-stage-curtain` --- not placed (boss chamber, hides phase 3 reveal)
- `fraud-ramp-platform` --- Counterfeit Arena RAMP segments described but no prop

### Room-by-Room Walkthrough

#### Room: Portico (10x6, sortOrder 0)

**First-Timer:** Grand entrance. 2 Chandeliers overhead, 4 CandleStick_Triple on walls, 2 Banner_1 draping E/W walls, 2 Vase_4 flanking entrance. Warm amber light. Safe pickups (ammo + health + fuel). After 7 circles of hell, this feels like relief. The palatial deception starts immediately. 60 cells, 10 props. Well-dressed.

**Speedrunner:** Grab pickups, sprint south through corridor. No enemies, no obstacles. 3 seconds.

**Explorer:** Two safe pickups and fuel establish false trust. The vases flanking the entrance are a nice visual frame. The Banners on the walls are the first "hide something" props --- the design doc mentions Banner_1 concealing WALL_SECRET entrances in later rooms.

**Verdict:** GOOD
**Recommendations:** Add `fraud-ornate-arch` at the entrance. Replace `Chandelier` with one normal + one `fraud-broken-chandelier` (subtle first hint of decay). Add `prop-carpet` on the floor (palatial). Replace `Vase_4` with `prop-vase` (Quaternius, has GLB).

---

#### Room: Hall of Mirrors (14x10, sortOrder 1)

**First-Timer:** 4 CandleStick_Triple on walls, 2 Vase_2 near columns. The "onyx wall panels" described in the design doc are structural (wall material) --- no props visually sell the reflective surfaces. 3 shadowGoats patrol near walls, visible "only in reflections." 140 cells, 6 props. This room's concept is "polished onyx creates reflections" but no `fraud-onyx-wall-panel` or `fraud-mirror-shard` is placed. The reflective mechanic is communicated through the reflection system, not through visual props.

**Speedrunner:** Two exits (west to Flatterers, east to Thieves). Choose the shorter path. shadowGoats can be avoided if you don't approach walls. Wide room, clear sightlines to both exits.

**Explorer:** Ammo at center (28,16) is the only pickup. The room is large and under-dressed. The 6 props are all wall-mounted --- nothing on the floor between the walls except the 2 vases.

**Verdict:** NEEDS WORK
**Recommendations:** Place `fraud-onyx-wall-panel` (x4-6) protruding 0.5 cells from walls as described in design doc's 3D elements. Add `fraud-mirror-shard` (x2-3) on floor near walls. Add `fraud-marble-pedestal` (x2) with `prop-chalice` on top. This room needs visual density to match its thematic importance as the "reflection room."

---

#### Room: Bolgia of Flatterers (12x8, sortOrder 2)

**First-Timer:** Table_Large center with 3 Chalice + Scroll_1. 2 Banner_2 on north wall. 2 CandleStick_Triple on E/W walls. The design doc describes "4 silhouette props (far end, deceptive NPC shapes)" --- these are absent. The 2 hellgoats (disguised as friendly) and 2 mimics are enemies, not props. There should be 4 `fraud-silhouette-prop` at the far north end to sell the "friendly NPC" deception visually.

**Speedrunner:** Mimic ambush at center is unavoidable if you take the direct path. Can sprint around the edge to reach the south exit. First-time players cannot avoid the trap.

**Explorer:** Real ammo (10,28) hidden behind Banner_2 on west wall --- excellent "look behind the banner" teach. Scroll on table has lore text. The room rewards attention.

**Verdict:** NEEDS WORK
**Recommendations:** Add 4x `fraud-silhouette-prop` at north end (critical --- the "friendly NPCs beckoning" is a key narrative moment). Add `fraud-two-faced-bust` on a pedestal. The table scene is well-composed --- no changes needed there.

---

#### Room: Bolgia of Thieves (10x8, sortOrder 3)

**First-Timer:** 3 Coin_Pile (floor, decoy), 2 Chest_Wood (floor), 2 CandleStick_Triple (walls), 1 Chalice (pedestal). The "items vanish on approach" mechanic is conveyed through trigger zones. The Chest_Wood opening to reveal nothing/enemies is good physical comedy.

**Speedrunner:** Sprint through, ignore shifting items. East exit to Shifting Maze is clear.

**Explorer:** The shuffling pickup mechanic rewards patience and observation. Coin_Pile decoys on the floor add visual clutter intentionally.

**Verdict:** GOOD
**Recommendations:** Replace `Chest_Wood` with `trick-chest` (circle-specific, designed for this). Replace `Coin_Pile` with `fraud-coin-pile`. Add `false-door` on one wall (deception theme reinforcement).

---

#### Room: Shifting Maze (14x14, sortOrder 4)

**First-Timer:** 2 Torch_Metal on outer walls (fixed landmarks, as designed). 4 Vase_Rubble on floor (breadcrumbs that shift). The maze walls are structural WALL_STONE --- no `fraud-shifting-wall-segment` props. The room is 196 cells with 6 props. The maze mechanic (walls shift when not observed) is clever, but the visual selling is entirely structural.

**Speedrunner:** Maze always maintains one valid path. With practice, 30-40 seconds to solve. 7 enemies (4 shadowGoat, 3 hellgoat) are spread out --- can be avoided in the maze corridors.

**Explorer:** Ammo at center (38,44) and health near exit (42,50) reward maze completion. The Vase_Rubble breadcrumbs shifting too is a cruel touch.

**Verdict:** NEEDS WORK
**Recommendations:** Replace structural maze walls with `fraud-shifting-wall-segment` props (visual distinction from permanent walls). Add `fraud-cracked-mosaic-floor` at maze dead ends (visual "you went the wrong way" marker). The Torch_Metal fixed landmarks are good --- keep those.

---

#### Room: Counterfeit Arena (12x12, sortOrder 5)

**First-Timer:** 2 Column_Stone (real), 4 mimics (fake columns), 2 Torch_Metal, 1 Barrel. The "callback to Circle 1 Columns room" concept is strong but the columns are "Column_Stone" --- generic. Should be `fraud-fake-column` or `fraud-theatrical-column` for the fake ones. The RAMP segments for real cover are described in the design doc but not placed as props.

**Speedrunner:** Arena lock. Two waves + 4 mimics. Cannot skip. The ramp platforms (+1 elevation) provide the only safe cover once mimics activate. ~60 seconds minimum.

**Explorer:** The 2 real columns vs 4 mimic columns creates a guessing game. Learning that ramps (ugly, utilitarian) are safe and columns (elegant) are deadly inverts expectations. Good design.

**Verdict:** NEEDS WORK
**Recommendations:** Replace `Column_Stone` (x2 real) with `fraud-theatrical-column`. Use `fraud-fake-column` for the 4 mimic hosts. Add `fraud-ramp-platform` (x2) as the RAMP cover segments. Add 1 `fraud-crumbling-facade` near the entrance (visual callback decay). The room works mechanically but its props do not distinguish "fake" from "real."

---

#### Room: Mimic's Den (8x8, sortOrder 6)

**First-Timer:** 2 Torch_Metal (walls), 1 Cauldron (center landmark), 2 Coin_Pile (floor). 64 cells, 5 props. The "8 pickups, 4 are mimics" mechanic is the room's identity. The Cauldron center is "the one honest object." Props are minimal, which is correct --- the pickups ARE the visual content.

**Speedrunner:** Use flamethrower to sweep before collecting. 4 mimics at known positions once learned. Clear in 20-30 seconds.

**Explorer:** The randomized mimic placement (4 of 8 pickups) creates replayability. The Cauldron as the honest landmark is a nice touch.

**Verdict:** GOOD
**Recommendations:** Minor: replace `Cauldron` with a unique prop. Add `fraud-forked-tongue-relief` on one wall (decorative, thematic).

---

#### Room: Serenissima --- Secret (6x6, sortOrder 7)

**First-Timer:** 1 Chest_Wood (center), 1 BookStand (with lore scroll), 2 Candle_1 (flanking chest), 1 Potion_4 (shelf). 36 cells, 5 props. ALL pickups are genuine. The "only honest room in the circle" concept is perfectly executed. Raw unfinished marble walls (Marble001).

**Speedrunner:** Optional secret. All-real pickups make it worth finding. 5 seconds to collect and leave.

**Explorer:** THIS is the explorer's payoff. The lore scroll ("Truth hides where no one looks"), the honest pickups, the raw walls. The Candle_1 flanking the chest is a visual composition. The Potion_4 on a shelf adds vertical interest.

**Verdict:** GOOD
**Recommendations:** Replace `Chest_Wood` with `prop-chest-gold` (Quaternius --- the genuine treasure chest should look valuable). Add `prop-carpet` on the floor (the honest room should feel warm).

---

#### Room: Inganno's Parlor --- Boss (14x14, sortOrder 8)

**First-Timer:** Grand boss chamber. 1 Chandelier (ceiling), 2 Bookcase_2 (E/W walls), 1 Chair_1 (Inganno's seat), 1 Table_Large (beside chair), 4 CandleStick_Triple (all wall faces), 2 Banner_1 (north wall), 2 Vase_4 (flanking entrance). 196 cells, 15 props. The "elegant sitting room that transforms into serpentine horror" concept is strong. The phase 3 texture swap (Marble to Rust) is the climactic reveal.

**Speedrunner:** Boss fight is mandatory. 3 phases. Phase 1: trigger at 3-cell proximity, dodge charm projectiles + 4 mimics. Phase 2: fight mirror clone. Phase 3: dodge serpentine charges. ~120-180 seconds total.

**Explorer:** 4 corner pickups (ammo/health symmetric). The Chair_1 as Inganno's seat is the room's visual anchor. The Bookcase_2 and Banner_1 create a palatial setting that will crumble in phase 3.

**Verdict:** GOOD
**Recommendations:** Add `fraud-stage-curtain` (x2) flanking the entrance or on the south wall (phase 3 reveal: curtains fall). Add `fraud-marble-debris` to floor during phase 3 (crumbling facade). Add `fraud-ornate-railing` around the raised platform. Replace generic `Chandelier` with initial `Chandelier` that becomes `fraud-broken-chandelier` in phase 3.

---

### Circle 8 Gap Analysis

**Over-dressed rooms:** Portico (10 props in 60 cells), Boss chamber (15 props in 196 cells) --- both appropriate.
**Under-dressed rooms:** Hall of Mirrors (6 props in 140 cells --- the thematically most important room is among the sparsest), Shifting Maze (6 props in 196 cells).
**Missing prop types:** Zero circle-specific Meshy props placed. Zero Quaternius GLBs used. Most critically: `fraud-silhouette-prop` (key narrative element absent), `fraud-onyx-wall-panel` (Hall of Mirrors identity absent), `fraud-mirror-shard` (reflection theme unsupported visually), `fraud-fake-column` (Counterfeit Arena's core mechanic needs visual distinction).
**Balance:** Prop distribution is reasonably even across the 9 rooms (average 7 per room), but the WRONG rooms are sparse. The Hall of Mirrors should be the most visually rich room in the circle --- it is the player's introduction to deception. Instead it has fewer props than the Portico foyer.
**Prop count:** 63 total instances across 9 rooms. For a deception-themed circle, this is adequate in quantity but poor in quality --- generic props do not sell the fraud theme. Target: 80-100 props with circle-specific replacements.

---

## Circle 9: Treachery

### Asset Audit

**Build script uses (unique prop names):**
Lantern_Wall (x4), Chain_Coil (x12), Column_Stone (x6), Cage_Small (x4), Sword_Bronze (x2), Banner_1 (x4), Shield_Wooden (x3), Table_Large (x1), Chair_1 (x6), Chalice (x2), SmallBottle (x2), Barrel (x1), Book_7 (x1), Coin_Pile (x2)
**Total: 50 prop instances, 14 unique prop types**

**Design doc describes (Props table):**
Matches, with two notable additions in the design doc that are NOT in the build script:
- "Ice stalactites (structural, ceiling)" in Glacial Stairs and Giudecca --- described as structural, not props, so absence is acceptable
- "Frozen waterfall (structural, back/south wall)" in Giudecca --- described as structural
- "Ice formation (structural, center, Azazel frozen within)" in boss chamber --- structural

**Circle-specific Meshy props available (22 --- NONE placed):**
frozen-goat, ice-pillar, soul-cage, treachery-betrayer-cage, treachery-crystalline-spike-wall, treachery-dark-ice-monolith, treachery-frost-chalice, treachery-frost-shattered-column, treachery-frozen-banner, treachery-frozen-chain-cluster, treachery-frozen-feast-table, treachery-frozen-stalactite, treachery-frozen-sword, treachery-frozen-throne, treachery-frozen-waterfall, treachery-glacial-platform, treachery-ice-arch, treachery-ice-bridge-segment, treachery-ice-crack-floor, treachery-ice-formation, treachery-snow-drift-mound, treachery-unlit-lantern

**Quaternius props applicable (already have GLBs):**
- `prop-column` / `prop-column-broken` -> replaces "Column_Stone" in Caina
- `prop-banner` / `prop-banner-wall` -> replaces "Banner_1" in Antenora
- `prop-shield-wall` -> replaces "Shield_Wooden"
- `prop-sword-wall` / `prop-sword-mount` -> replaces "Sword_Bronze"
- `prop-chair` -> replaces "Chair_1" in Ptolomea
- `prop-table` -> replaces "Table_Large"
- `prop-chalice` -> replaces "Chalice"
- `prop-barrel` -> replaces "Barrel"
- `prop-crystal` / `prop-crystal2` -> ice crystal substitutes
- `prop-bones` -> frozen figures in Caina
- `prop-cobweb` -> frost-covered variants
- `prop-broken-pot` -> Ptolomea table detritus

**Redundancies:**
- "Column_Stone" in Caina vs `ice-pillar` (circle-specific, designed for frozen lake)
- "Cage_Small" vs `soul-cage` or `treachery-betrayer-cage` (circle-specific)
- "Lantern_Wall" vs `treachery-unlit-lantern` (circle-specific, UNLIT --- dead, frost-covered)
- "Banner_1" vs `treachery-frozen-banner` (circle-specific, frozen stiff)
- "Chalice" vs `treachery-frost-chalice` (circle-specific, frozen contents)
- "Table_Large" vs `treachery-frozen-feast-table` (circle-specific)
- "Chain_Coil" vs `treachery-frozen-chain-cluster` (circle-specific)
- "Sword_Bronze" vs `treachery-frozen-sword` (circle-specific)

**Missing from build script:**
ALL 22 circle-specific props. Most critically:
- `ice-pillar` --- Caina uses "Column_Stone" instead (wrong material, wrong visual)
- `treachery-frozen-waterfall` --- Giudecca's frozen waterfall is described as "structural" but no visual prop. This is the room's centerpiece.
- `treachery-ice-formation` --- Azazel's central ice formation is described as structural but should be a prop
- `treachery-frozen-throne` --- not placed anywhere (perfect for boss chamber, Azazel's seat)
- `frozen-goat` --- not placed (previous scapegoat figures described in Judas Trap narrative)
- `treachery-ice-bridge-segment` --- Cocytus Bridge has NO props (36 cells of nothing, by design --- but `treachery-ice-bridge-segment` could form the bridge itself)
- `treachery-frozen-stalactite` --- Glacial Stairs and Giudecca describe ceiling stalactites as structural
- `treachery-snow-drift-mound` --- not placed anywhere (could fill empty corners in Caina, Ptolomea)
- `treachery-ice-crack-floor` --- not placed (Giudecca floor cracking mechanic)
- `treachery-dark-ice-monolith` --- not placed (could be a hero piece in Caina or boss chamber)
- `treachery-glacial-platform` --- not placed (boss phase 2 fragmenting platforms)
- `treachery-ice-arch` --- not placed at room entrances

### Room-by-Room Walkthrough

#### Room: Glacial Stairs (8x16, sortOrder 0)

**First-Timer:** Descending staircase. 4 Lantern_Wall (UNLIT, frost-covered), 2 Chain_Coil (frozen to ceiling). The design doc describes "ice stalactites (structural, ceiling)" but these are not in the build script. 128 cells, 6 props. The vertical descent (0 to -3 across 5 landings) creates a strong "going deeper" sensation. The unlit lanterns are narratively powerful --- "nothing burns this deep."

**Speedrunner:** Slide down ramps. Ice friction (0.6x) means faster descent but less control. 2 shadowGoat ambushes and 1 fireGoat. Can speed through in 10-15 seconds.

**Explorer:** Ammo at landing 2 (29,8), health at landing 4 (28,14), fuel at landing 3. The pickups are well-spaced across the descent. Each landing is a micro-moment of safety.

**Verdict:** NEEDS WORK
**Recommendations:** Replace `Lantern_Wall` with `treachery-unlit-lantern` (circle-specific). Add `treachery-frozen-stalactite` (x3-4) on ceiling between landings. Add `treachery-snow-drift-mound` (x2) on wider landings. The descent concept is excellent but 6 props across 128 cells is too sparse.

---

#### Room: Caina --- Betrayers of Family (16x14, sortOrder 1)

**First-Timer:** Frozen lake. 6 Column_Stone (ice pillars, 2 rows of 3), 3 Cage_Small (embedded in ice), 2 Sword_Bronze (frozen into pillars). 224 cells, 11 props. The frozen goatKnights breaking free on proximity is a strong mechanic. The cages with frozen betrayers beneath the ice are excellent environmental storytelling. But the "ice pillars" are generic "Column_Stone" --- they should be `ice-pillar` with Ice003 material.

**Speedrunner:** 3 goatKnights thaw on 4-cell proximity. Can potentially trigger only 1-2 by taking an edge path. shadowGoat patrol is avoidable. Sprint to south exit in 15-20 seconds.

**Explorer:** Ammo x2 at opposite corners, health at center (risky near goatKnights). The Cage_Small embedded in ice + Sword_Bronze frozen in pillars reward observation. The room tells a story: frozen betrayers, frozen weapons, frozen everything.

**Verdict:** NEEDS WORK
**Recommendations:** Replace `Column_Stone` (x6) with `ice-pillar`. Replace `Cage_Small` (x3) with `treachery-betrayer-cage` or `soul-cage`. Replace `Sword_Bronze` with `treachery-frozen-sword`. Add `treachery-dark-ice-monolith` (x1) as a hero piece (center or north edge). Add `treachery-snow-drift-mound` (x2) at room edges. The room's storytelling is strong but it needs its own visual vocabulary.

---

#### Room: Antenora --- Betrayers of Country (12x16, sortOrder 2)

**First-Timer:** Frozen fortress corridors. 4 Banner_1 (frozen stiff on walls), 3 Shield_Wooden (wall-mounted), 2 Chain_Coil (ceiling). 192 cells, 9 props. The reflected shot mechanic is LETHAL here --- 3-cell wide corridors mean every miss comes back. Frozen banners and shields on walls tell the story of failed nations. Good.

**Speedrunner:** 3 shadowGoat ambushes in alcoves + 1 fireGoat at intersection. Corridors are narrow --- cannot easily bypass enemies. Must fight or take damage running through. ~20-30 seconds.

**Explorer:** Ammo at mid-corridor (28,46), health near south exit (32,52), fuel at corridor midpoint (29,48). Well-distributed for a long room.

**Verdict:** GOOD
**Recommendations:** Replace `Banner_1` with `treachery-frozen-banner`. Replace `Shield_Wooden` with equivalent with frost overlay. Add `treachery-ice-arch` (x2) at corridor entrances. Add `treachery-crystalline-spike-wall` (x1) at a dead-end alcove. Minor additions needed.

---

#### Room: Ptolomea --- Betrayers of Guests (14x10, sortOrder 3)

**First-Timer:** The frozen feast. 1 Table_Large (center), 6 Chair_1 (around table), 2 Chalice (on table), 2 SmallBottle (on table), 1 Barrel. 140 cells, 12 props. This room is the best-propped in Circle 9. The frozen banquet scene --- chairs knocked over, chalices mid-pour --- is powerful visual storytelling. The 2 goatKnights frozen at the table thawing on entry is a standout encounter.

**Speedrunner:** Enemies thaw on entry trigger --- cannot avoid the fight. Low ceiling (1.5 cells) prevents arcing shots. Close quarters favor flamethrower. ~20 seconds.

**Explorer:** Ammo west of table (26,64), health east behind barrel (34,62). The barrel as minimal cover is the only "safe" position. The room rewards observing the scene before triggering the thaw.

**Verdict:** GOOD
**Recommendations:** Replace `Table_Large` with `treachery-frozen-feast-table`. Replace `Chalice` with `treachery-frost-chalice`. Add `frozen-goat` (x1) frozen under the table (previous scapegoat at the feast). The scene is already strong --- these replacements add circle-specific identity.

---

#### Room: Giudecca --- Arena (18x16, sortOrder 4)

**First-Timer:** THE arena. 4 Chain_Coil (ceiling, over void sections). That is it. 288 cells, 4 props. The design doc describes a "frozen waterfall (structural, back wall, 8 cells wide, full height)" and "ice stalactites (ceiling)" --- both structural, not props. The room's visual centerpiece (the frozen waterfall) has no prop representation. The floor collapse mechanic (3x3 sections falling into void) is powerful but has no visual prop (`treachery-ice-crack-floor` exists but is not placed).

**Speedrunner:** Arena lock, 3 waves. Falling ice hazards + floor collapse create chaos. Cannot skip. ~90-120 seconds.

**Explorer:** Pre-arena health near entrance (30,75). Between-wave resupply at all 4 corners. Generous economy. WALL_SECRET west to Judas Trap.

**Verdict:** NEEDS WORK
**Recommendations:** Add `treachery-frozen-waterfall` (x1, massive, south wall). Add `treachery-frozen-stalactite` (x4-6) on ceiling. Add `treachery-ice-crack-floor` (x4) at the positions where floor sections will collapse (visual warning BEFORE the trigger fires). Add `ice-pillar` (x4-6) as structural cover. The room is the largest arena in the game (288 cells) and has 4 props. This is Act 3's climactic arena --- it needs visual weight.

---

#### Room: Judas Trap --- Secret (6x6, sortOrder 5)

**First-Timer:** 1 Book_7, 1 Cage_Small (containing frozen figure), 2 Coin_Pile (frost-covered). 36 cells, 4 props. The frozen codex listing names, the caged previous scapegoat --- excellent narrative. Generous pickups (2 ammo, 2 health). The design doc says the Cage_Small contains "a goat --- a previous scapegoat." The `frozen-goat` prop exists for exactly this purpose and is not placed.

**Speedrunner:** Optional. Generous pickups worth finding. 5 seconds.

**Explorer:** The narrative payoff ("you are not the first") is the real reward. The frost-covered coins (worthless) are a nice detail.

**Verdict:** NEEDS WORK
**Recommendations:** Replace `Cage_Small` with `frozen-goat` or `soul-cage` containing `frozen-goat`. Replace `Coin_Pile` with frost-covered variant. Add `treachery-snow-drift-mound` (x1) in a corner. Small changes with large narrative impact.

---

#### Room: Cocytus Bridge (4x36, sortOrder 6)

**First-Timer:** Nothing. No props, no enemies, no pickups. 144 cells. Just ice, void on both sides, and wind. This is the bravest design choice in the game. The ~18-20 second walk in total silence after the intensity of Giudecca is a breathing moment before the final boss. The inscriptions in the ice ("The first goat fell here 3,000 years ago") are triggered text, not props.

**Speedrunner:** Sprint across. 8-10 seconds. The 0.85x friction slightly slows but doesn't threaten.

**Explorer:** The inscriptions at 1/4, 1/2, and 3/4 reward slow walking and looking down. Frozen silhouettes visible below the bridge. This is the game's most meditative moment.

**Verdict:** GOOD (by design)
**Recommendations:** This room SHOULD be empty. The emptiness is the design. Adding props would undermine it. The only possible addition: `treachery-ice-bridge-segment` as the bridge surface itself (structural, not decorative). But this is structural, not a gap.

---

#### Room: Azazel's Frozen Throne --- Boss (20x20, sortOrder 7)

**First-Timer:** 4 Chain_Coil (ceiling, marking arena quadrants). 400 cells, 4 props. The largest boss room in the game has 4 props. The design doc describes the central ice formation (4x4, Azazel frozen within), the cracking floor, the overhead spotlight --- all structural/environmental. No `treachery-frozen-throne`, no `treachery-ice-formation`, no `treachery-dark-ice-monolith`. The boss chamber relies entirely on environmental effects (fog, lighting, ice mechanics) and Azazel's model for visual impact.

**Speedrunner:** Phase 1: shoot ice sections (8 total). Phase 2: dodge antler sweep, ground stamp, ice breath on fragmenting platforms. Phase 3: cinematic, cannot skip. ~180-240 seconds total. The longest fight in the game.

**Explorer:** Pickups in triangle/inverse triangle pattern (3 ammo, 3 health, 2 fuel). Symmetric, allowing flexible routing during phase 2. The 4 Chain_Coil mark quadrant boundaries.

**Verdict:** NEEDS WORK
**Recommendations:** Add `treachery-frozen-throne` (x1) at center (Azazel's ice formation base). Add `treachery-ice-formation` (x1) as the destructible ice surrounding Azazel. Add `treachery-dark-ice-monolith` (x2) flanking the entrance (massive, setting the tone). Add `treachery-crystalline-spike-wall` (x2-4) at room edges. The final boss room of the entire game has 4 generic chain props. It should be the most visually dramatic space in all 9 circles. It currently is not.

---

### Circle 9 Gap Analysis

**Over-dressed rooms:** Ptolomea (12 props in 140 cells) --- the only room that feels complete.
**Under-dressed rooms:** Giudecca (4 props in 288 cells), Azazel's Frozen Throne (4 props in 400 cells), Glacial Stairs (6 props in 128 cells). The two MOST IMPORTANT rooms (the arena and the final boss) are the two emptiest.
**Missing prop types:** Zero circle-specific Meshy props placed. Zero Quaternius GLBs used. Most critically: `treachery-frozen-waterfall` (Giudecca centerpiece, absent), `treachery-frozen-throne` / `treachery-ice-formation` (boss chamber visual anchor, absent), `ice-pillar` (Caina uses generic Column_Stone), `frozen-goat` (narrative prop, perfect for Judas Trap).
**Balance:** Prop distribution is inverted from what it should be. The transitional room (Ptolomea, 12 props) has 3x the props of the climactic arena (Giudecca, 4 props) and the final boss (Azazel, 4 props). The most important rooms should be the most visually rich.
**Prop count:** 50 total instances across 8 rooms. For the FINAL circle of the game --- the climax of all 9 circles --- this is the LOWEST prop count of any act. The bridge's intentional emptiness accounts for 144 zero-prop cells, but even excluding that, the remaining 7 rooms average 7.1 props each. Target: 80-100 props with circle-specific replacements. The boss room alone needs 10-15 props minimum.

---

## Cross-Circle Analysis

### Palette Transitions

The three circles have strong thematic progression:
- **C7 (Violence):** Red/orange/rust. Hot. Blood and fire.
- **C8 (Fraud):** Gold/amber/warm marble. Beautiful. Deceptive warmth.
- **C9 (Treachery):** Blue/black/ice. Cold. The heat has died.

This thermal descent (hot -> warm -> cold) is excellent. The boss phase 3 reveal in C8 (marble to rust) bridges the transition: Fraud's beauty crumbles to reveal Violence's rust beneath. Then C9's ice replaces even the rust.

**Gap:** The transitions between circles are title cards only. There are no transition corridors. The player defeats Il Macello, title card, spawns at Portico. Defeats Inganno, south wall crumbles, cold air, title card, spawns at Glacial Stairs. Consider a brief (3-5 cell) transition corridor with mixed materials between circles.

### Difficulty Ramp

| Metric | C7 | C8 | C9 |
|--------|----|----|-----|
| Rooms | 10 | 9 | 8 |
| Grid cells | 60x110 = 6,600 | 60x90 = 5,400 | 60x154 = 9,240 |
| Non-boss enemies | 24 | ~30 (21 + mimics) | ~22 |
| Boss phases | 3 | 3 | 3 (+ cinematic) |
| Special mechanic | Bleeding (constant drain) | Mimics (trust nothing) | Reflected shots (weapons betray) |
| Arena waves | 3 | 2 + mimics | 3 |
| Secret rooms | 1 (Butcher's Hook) | 1 (Serenissima) | 1 (Judas Trap) |
| Props placed | 65 | 63 | 50 |

The difficulty ramp is well-designed mechanically:
- C7 teaches urgency (bleeding) and introduces the flamethrower
- C8 teaches distrust (mimics) and uses the flamethrower as a detection tool
- C9 teaches weapon discipline (reflected shots) and makes the flamethrower essential

**Gap:** Circle 9 has the lowest prop count despite having the largest grid and being the final circle. The visual richness should INCREASE, not decrease, as the player approaches the game's climax.

### Prop Count Comparison

| Circle | Props | Grid Cells | Props/100 Cells | Rating |
|--------|-------|-----------|-----------------|--------|
| 7 | 65 | ~1,680 (room area) | 3.9 | LOW |
| 8 | 63 | ~1,260 (room area) | 5.0 | MODERATE |
| 9 | 50 | ~1,560 (room area) | 3.2 | VERY LOW |

All three circles are under-propped for their ambition. The design docs describe rich, detailed environments. The build scripts place generic props at minimum density.

### Reuse Opportunities

**Cross-circle Quaternius props that work in ALL three circles:**
- `prop-column` / `prop-column-broken` / `prop-column-broken2` (structural in every circle)
- `prop-bones` / `prop-bones2` / `prop-skull` / `prop-rpg-skull` (hell is full of bones)
- `prop-torch-lit` / `prop-torch-mounted` (lighting in C7/C8; UNLIT variant in C9)
- `prop-barrel` (supplies everywhere)
- `prop-cobweb` / `prop-cobweb2` (C7 corridors, C8 hidden rooms, C9 frozen)
- `prop-crystal` / `prop-crystal2` (ice crystal variant in C9, fire crystal in C7)
- `prop-rock1` / `prop-rock2` / `prop-rock3` (everywhere)
- `prop-wall-rocks` (rubble/debris in all circles)

**Meshy general props applicable across circles:**
- `chain-hanging-single` / `chain-hanging-cluster` -> replaces "Chain_Coil" everywhere
- `pillar-broken` / `pillar-twisted` -> damaged pillars in arenas
- `rubble-pile-large` / `rubble-pile-small` -> post-combat debris
- `debris-scatter` -> floor clutter
- `stalactite-cluster` -> C9 ceiling
- `hellfire-brazier` -> C7 fire rooms
- `fire-pit-large` / `fire-pit-small` -> C7 Burning Shore
- `spike-bed-large` / `spike-bed-small` -> C7 Thorny Passage
- `gate-iron-bars` -> arena door frames
- `torch-sconce-ornate` / `torch-sconce-simple` -> wall-mounted lighting

### Boss Rooms

| Boss | Room Size | Props | Rating |
|------|-----------|-------|--------|
| Il Macello's Abattoir | 16x16 (256 cells) | 17 | ADEQUATE |
| Inganno's Parlor | 14x14 (196 cells) | 15 | ADEQUATE |
| Azazel's Frozen Throne | 20x20 (400 cells) | 4 | CRITICALLY LOW |

The final boss room of the entire game has 1 prop per 100 cells. The first boss room (Il Macello) has 6.6 props per 100 cells. This is backwards. Azazel's chamber should be the most visually spectacular room in all 9 circles.

---

## Action Items (Priority Ordered)

### P0 --- Critical (game shipped without these would be incomplete)

1. **Wire circle-specific Meshy props into build scripts.** All 69 props across three circles (25 + 22 + 22) exist as manifests but zero are placed. At minimum, each circle should use 8-12 of its unique props. Start with hero pieces: `violence-blood-river-arch`, `fraud-onyx-wall-panel`, `treachery-frozen-waterfall`, `treachery-frozen-throne`.

2. **Resolve the naming mismatch.** Build scripts use "Torch_Metal", "Chain_Coil", "CandleStick_Triple" etc. (Fantasy Props MegaKit names). The renderer needs to map these to actual GLB files. Either: (a) create GLBs for every Fantasy Props MegaKit name, (b) rename all build script refs to Quaternius prop names, or (c) create a lookup table. This is a systemic issue across all 3 circles.

3. **Dress Azazel's Frozen Throne.** 4 props in 400 cells for the final boss of the game. Add `treachery-frozen-throne`, `treachery-ice-formation`, `treachery-dark-ice-monolith` (x2), `treachery-crystalline-spike-wall` (x4). Target: 15-20 props.

4. **Dress Giudecca arena.** 4 props in 288 cells for the Act 3 climactic arena. Add `treachery-frozen-waterfall`, `treachery-frozen-stalactite` (x6), `ice-pillar` (x6), `treachery-ice-crack-floor` (x4). Target: 20-25 props.

### P1 --- High (significantly improves player experience)

5. **Place `violence-fire-geyser-vent` at all 6 geyser positions in Burning Shore.** Players need visual landmarks for damage zones. Currently geysers are invisible-until-eruption.

6. **Place `fraud-silhouette-prop` (x4) in Bolgia of Flatterers.** The "friendly NPCs beckoning" is a key narrative moment with no visual selling.

7. **Replace generic props with Quaternius GLBs.** The 62 Quaternius props already have GLBs and render in-game. Mapping: Barrel -> prop-barrel, Column_Stone -> prop-column, Chair_1 -> prop-chair, Table_Large -> prop-table, Chalice -> prop-chalice, Chest_Wood -> prop-chest, etc. This gives immediate visual quality with zero asset generation needed.

8. **Increase Thornwood and Blood River prop density.** Thornwood: add `violence-thorn-column` (x6), `prop-dead-tree` (x3), `prop-bones` (x4). Blood River: add `violence-blood-river-arch` (x2), `violence-walkway-pillar` (x4), `violence-blood-pool` (x3).

### P2 --- Medium (polish and differentiation)

9. **Replace Caina's Column_Stone (x6) with ice-pillar.** The frozen lake's visual identity depends on ice-specific props.

10. **Replace Ptolomea's generic table/chair/chalice with circle-specific frozen variants.** `treachery-frozen-feast-table`, `treachery-frost-chalice`.

11. **Add `fraud-mirror-shard` (x3) and `fraud-onyx-wall-panel` (x6) to Hall of Mirrors.** The circle's introduction room needs its signature visual.

12. **Add `fraud-fake-column` to Counterfeit Arena mimics, `fraud-theatrical-column` for real columns.** Visual distinction between "fake" and "real" cover.

13. **Add transition props between circle-specific areas.** Where corridors connect rooms with different sub-themes (e.g., Blood River to Thorny Passage), place 1-2 transitional props.

### P3 --- Low (nice-to-have, Explorer persona satisfaction)

14. **Add `prop-bones`/`prop-skull` scatter across all circles.** This is Hell --- bones everywhere. 2-3 per large room, 1 per small room.

15. **Add `false-door` and `trick-chest` to Fraud rooms.** Deception theme reinforcement.

16. **Add `treachery-snow-drift-mound` to empty corners in Circle 9.** Minimal visual fill.

17. **Add `prop-cobweb`/`prop-cobweb2` to hidden corners across all circles.** Environmental detail.

18. **Add `fraud-two-faced-bust` to Fraud corridors.** Narrative decoration.

19. **Consider Meshy general props for architectural framing.** `arch-gothic` at room entrances, `pillar-twisted` as accent columns, `gate-iron-bars` at arena lockdown doors.
