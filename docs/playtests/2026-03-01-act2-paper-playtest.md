---
title: "Act 2 Paper Playtest — Circles 4-6"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
playtest_type: paper
circles_tested: [4, 5, 6]
---

# Act 2 Paper Playtest -- Circles 4-6

**Date:** 2026-03-01
**Auditor:** Claude Opus 4.6 (paper playtest)
**Scope:** Design docs, build scripts, and full asset inventory cross-reference

---

## Executive Summary

Act 2 is the strongest conceptual arc in the game so far. Each circle has a clear mechanical thesis tied to its sin (hoarding/greed, escalation/wrath, illusion/heresy), and the boss fights are dramatically distinct. The design docs are excellent -- rich with environmental storytelling, clear spatial layouts, and thoughtful persona considerations.

**Biggest Wins:**
- Circle 5 (Wrath) is the standout -- 8 rooms with escalating intensity, each testing a different aspect of aggressive play. The Gauntlet running fight and the shrinking Colosseum are genuinely novel FPS encounters.
- Circle 6 (Heresy) has the most inventive navigation mechanic in the game. WALL_SECRET as a critical-path element (Narthex forces the player through one) is a brilliant teach.
- All three boss fights have 3-phase designs with distinct mechanics per phase, avoiding the "same thing but harder" trap.

**Biggest Gaps:**
- **Zero circle-specific Meshy props are actually placed in any build script.** The build scripts exclusively use Fantasy Props MegaKit names (Torch_Metal, Chest_Wood, etc.). The 60 circle-specific Meshy props (20 per circle) and the 62 general Meshy props are entirely absent from all three build scripts. Only 2 of 20 Greed Meshy props have manifests, 2 of 20 Wrath, and 3 of 20 Heresy -- and none of those have GLBs generated yet.
- **No "3D Spatial Design" section exists in any of the three design docs.** The prompt references this section, but it was never written.
- **Build scripts use prop names that do not match the Quaternius GLB filenames.** The scripts reference `Torch_Metal`, `Coin_Pile`, `Chest_Wood`, `CandleStick_Triple`, `Coin_Pile_2`, `Key_Gold`, `Column_Stone`, `Chalice`, `Cabinet`, `Barrel`, `Banner_1`, `Banner_2`, `Chain_Coil`, `Scroll_1`, `Scroll_2`, `Vase_2`, `Vase_4`, `Anvil`, `Cauldron`, `Cage_Small`, `WeaponStand`, `Shield_Wooden`, `Sword_Bronze`, `Lantern_Wall`, `Bench`, `Bucket_Metal`, `BookStand`, `Bookcase_2`, `Book_5`, `Book_7`, `Candle_2`, `Chandelier`. The actual Quaternius GLBs use `prop-` prefixed kebab-case names (e.g., `prop-torch-lit`, `prop-chest`, `prop-chalice`, `prop-barrel`, `prop-banner`). There is no mapping layer visible.
- **Prop density is extremely uneven** across rooms. Several rooms (Weight Room in C4, Gate of Dis in C5, Ossuary in C6) are functionally bare.

---

## Circle 4: Greed

### Asset Audit

**Build script uses (75 spawnProp calls, 14 unique prop types):**
| Prop Name | Count | Rooms |
|-----------|-------|-------|
| Torch_Metal | 10 | Vault(2), Treasury(4), Weight Room(2), Auction Hall(2) |
| Coin_Pile | 11 | Vault(3), Auction Hall(4), Boss(4) |
| Chest_Wood | 9 | Vault(1), Treasury(8) |
| Coin_Pile_2 | 6 | Treasury(6) |
| CandleStick_Triple | 10 | Treasury(4), Boss(6) |
| Vase_4 | 2 | Vault(2) |
| Chalice | 4 | Treasury(2), Reliquary(2) |
| Barrel | 2 | Treasury balcony(2) |
| Cabinet | 4 | Weight Room(4) |
| Key_Gold | 3 | Reliquary(3) |
| Scroll_1 | 1 | Reliquary(1) |
| Column_Stone | 4 | Auction Hall(4) |
| Banner_1 | 2 | Auction Hall(2) |
| Banner_2 | 2 | Boss(2) |
| Chain_Coil | 4 | Boss(4) |
| **TOTAL** | **74** | |

**Circle-specific Meshy props available (20):** coin-pile, golden-idol, greed-chest-pedestal, greed-coin-cascade, greed-diamond-plate-platform, greed-gear-mechanism, greed-gold-bar-stack, greed-gold-chain, greed-gold-pillar, greed-golden-banner, greed-golden-candelabra, greed-golden-chalice, greed-golden-key-display, greed-golden-throne, greed-golden-vase, greed-jeweled-pedestal, greed-pressure-plate, greed-safe-door, greed-treasure-chest, greed-vault-arch.

**Circle-specific Meshy props with manifests:** coin-pile, golden-idol (2 of 20). **None have GLBs.**

**Circle-specific Meshy props placed in build script:** ZERO.

**Quaternius props applicable but NOT used:**
- `prop-chest-gold` -- perfect for Treasury pedestals (more thematic than `Chest_Wood`)
- `prop-pedestal` / `prop-pedestal2` -- for display stands (Reliquary, Treasury)
- `prop-column` / `prop-column-broken` -- instead of `Column_Stone` which does not exist in Quaternius
- `prop-candelabrum-tall` -- could supplement CandleStick_Triple
- `prop-bones` / `prop-skull` -- for environmental storytelling (skeletal goat on sunken plate)

**Redundancies:**
- `Coin_Pile` in build script vs `coin-pile` Meshy prop -- direct duplicate concept
- `Chalice` (Quaternius) vs `greed-golden-chalice` (Meshy) -- same role, circle-specific version exists
- `Key_Gold` vs `greed-golden-key-display` -- Meshy version is purpose-built for Reliquary display
- `CandleStick_Triple` vs `greed-golden-candelabra` -- thematic upgrade available

**Missing from build script vs design doc:**
- Design doc specifies "pressure plate grid markings on floor" in Weight Room -- not placed as props
- Design doc specifies "railing geometry (structural)" for Treasury balcony -- not placed
- Design doc mentions "1x throne geometry (center-north, structural)" in Boss chamber -- no throne prop placed
- Design doc mentions Decals (Scratches004, Fingerprints002) -- no decal system exists in build scripts

### Room-by-Room Walkthrough

#### Room: Vault Entrance (8x6)

**First-Timer:** I see gold gleaming -- 3 coin piles, a chest, 2 vases, and 2 torches. Two ammo pickups are visible immediately. The room communicates "wealth" effectively. I know to go south. The room is small enough that nothing is confusing.
**Speedrunner:** 8x6 is tiny. Grab ammo, sprint south. No obstacles, no enemies, no reason to linger. Good.
**Explorer:** The room is adequate but not lavish. Only 8 props for a room meant to scream opulence. Missing: more coin scatter, golden gleam effects, the "dripping gold" feel described in the design doc.
**Verdict:** NEEDS WORK -- under-dressed for its narrative role as first impression of Greed
**Recommendations:**
- Add `prop-chest-gold` to replace `Chest_Wood` (gold chest, not wooden)
- Add 2-3 more coin piles or `greed-gold-bar-stack` when Meshy GLBs are ready
- Place `greed-vault-arch` at the south doorway when available

#### Room: Treasury (14x12, two levels)

**First-Timer:** This is dense. 8 chests in two rows, 6 coin piles between them, 4 torches on walls, 2 chalices. I can see the balcony above with candelabras at the corners. Two goatKnights patrol the chest rows -- I understand I need to navigate the grid. Ammo on the balcony above is visible and tempting. The room communicates "overwhelming abundance" effectively.
**Speedrunner:** Chest rows create tight lanes -- not great for speed. The balcony ramps at corners provide elevation changes. With 2 goatKnights in the lanes, I need to decide: fight through lanes or sprint up a ramp and take the balcony route. Balcony ammo is a trap for speedrunners (hoarding penalty). Good design tension.
**Explorer:** Best-dressed room in Circle 4. Props are dense and purposeful. The balcony elevation creates visual depth. The chalice placement on table surfaces is a nice detail. Missing: the balcony railing geometry mentioned in the design doc is absent.
**Verdict:** GOOD -- the densest, most thematic room in this circle
**Recommendations:**
- Use `prop-chest-gold` instead of `Chest_Wood` for half the chests (visual variety)
- Add railing geometry for the balcony (structural safety, visual framing)
- Consider `greed-jeweled-pedestal` under each chest for elevated display

#### Room: Weight Room (10x10)

**First-Timer:** I see 4 cabinets on the walls and 2 torches. That is it. For a puzzle room about pressure plates and weight, the room feels empty. The "pressure plate grid markings on floor" mentioned in the design doc are missing. Where is the visual teach about what the plates do? Where is the skeletal goat on a sunken plate mentioned in the narrative?
**Speedrunner:** 10x10 is spacious. 1 goatKnight and 1 hellgoat. If the pressure plate mechanic works, I need to drop ammo. The room has enough space to maneuver. No prop clutter blocking movement -- arguably too empty.
**Explorer:** Barren. 6 total props in a 10x10 room. The design doc describes an environmental teach (skeletal goat, scattered ammo), pressure plate visual markings, and "metal groaning SFX." None of the visual elements are placed. This room relies entirely on trigger-based hints rather than environmental storytelling.
**Verdict:** EMPTY -- the most under-dressed room in Act 2
**Recommendations:**
- Add `greed-pressure-plate` props on the floor grid (when Meshy GLBs available)
- Add `prop-bones` + `prop-skull` for the skeletal goat environmental teach
- Add `greed-gear-mechanism` to walls (hinting at mechanical plates)
- Add floor-scattered ammo props (non-pickup, decorative) around the skeleton
- Add 2 more torches -- only 2 torches in a 10x10 room is too dim

#### Room: Reliquary (6x6, secret)

**First-Timer:** Small treasure room. 3 gold keys on the wall, 2 chalices, a scroll, and a chest. No enemies. The keys on the wall are decorative -- nice touch. The room feels like a hidden cache. Adequate.
**Speedrunner:** Secret room, not on critical path. Skip.
**Explorer:** Decent for its size. 7 props in a 6x6 room. Could use more visual richness -- this is supposed to be the reward for finding the secret. The lore scroll is a good touch.
**Verdict:** GOOD -- appropriately dressed for a small secret room
**Recommendations:**
- Add `greed-golden-key-display` when available (purpose-built for this room)
- Add `prop-pedestal` under the chest for elevation
- Consider `greed-golden-vase` instead of generic `Chalice`

#### Room: Auction Hall (12x12, arena)

**First-Timer:** 4 pillars with coin piles at their bases, 2 torches, 2 banners. The pillars are the tactical focus -- I understand they are cover. The room is readable as an arena. The banners add some atmosphere. Functional, but not as opulent as the Treasury.
**Speedrunner:** 4 cover points in a 12x12 arena. Good sightlines between pillars. Destructible pillars mean the room opens up mid-fight. No prop clutter blocking orbiting. The wide corridors N/S allow fast entry/exit after the lock clears.
**Explorer:** The room is functionally adequate but visually sparse for a 12x12 space. 12 props total (including 4 pillars that serve structural purposes). The floor between pillars has nothing. The walls have 2 torches and 2 banners for a 48-cell perimeter. The design doc says "Coin piles = cover, destroy = open" but there is no visual richness beyond the pillar-coin pattern.
**Verdict:** NEEDS WORK -- functional but visually sparse for its size
**Recommendations:**
- Add floor scatter: `prop-broken-pot`, debris, scattered coins at room edges
- `Column_Stone` is NOT a Quaternius prop -- replace with `prop-column`
- Add `greed-treasure-chest` props at room edges (non-destructible decoration)
- Add 2 more torches for better lighting coverage

#### Room: Aureo's Court (14x14, boss)

**First-Timer:** I descend stairs into a sunken room. 6 candelabras ring the perimeter -- good landmark visibility. 4 chains hang from the ceiling (golden). 2 banners flank where the throne should be. 4 coin piles on the floor. I can see Aureo at the north. The room reads as ceremonial. But where is the throne? The design doc calls for "1x throne geometry (center-north, structural)" -- it is completely absent.
**Speedrunner:** 14x14 is generous for a boss fight. Good room for dodging phase 1 coin storms. The candelabras mark safe zone positions. The chains are visual noise but do not obstruct movement. Ammo and health at the corners are accessible. No complaints on layout.
**Explorer:** The boss chamber is the climax of the circle, but the prop density (18 total) is modest for a 14x14 room. The missing throne is a critical gap -- Aureo is described as standing at her throne, but there is no throne. The coin piles on the floor are too few (4) to sell the "opulence" described. The walls are bare -- no wealth display, no golden surfaces besides the candelabras.
**Verdict:** NEEDS WORK -- missing the throne hero piece, under-dressed for a boss arena
**Recommendations:**
- Add `greed-golden-throne` (Meshy) when available -- this is the most critical missing prop
- Add `greed-gold-chain` for the hanging chains (more thematic than generic Chain_Coil)
- Add more floor coin scatter (8-10 coin piles, not 4)
- Add `greed-golden-banner` instead of generic Banner_2

### Gap Analysis

**Over-dressed rooms:** Treasury (good density, well-balanced)
**Under-dressed rooms:** Weight Room (critically empty), Aureo's Court (missing hero piece)
**Missing types:** No throne prop in boss room. No pressure plate visuals in puzzle room. No decorative bones/skeleton for environmental storytelling. No railing geometry for Treasury balcony.
**Prop name mismatches:** `Column_Stone` does not exist in Quaternius (use `prop-column`). `Coin_Pile_2` does not exist (only `coin-pile` Meshy manifest). `CandleStick_Triple` -- no exact Quaternius match (closest: `prop-candelabrum-tall`). `Vase_4`, `Vase_2` -- Quaternius has only `prop-vase` (one variant). `Key_Gold` -- Quaternius has `prop-key`. `Chest_Wood` -- Quaternius has `prop-chest` and `prop-chest-gold`.
**Balance:** 14 enemies + boss is appropriate for 6 rooms. Pickup distribution is generous (design-intentional for Greed). The hoarding penalty mechanic creates the intended tension.

---

## Circle 5: Wrath

### Asset Audit

**Build script uses (107 spawnProp calls, 14 unique prop types):**
| Prop Name | Count | Rooms |
|-----------|-------|-------|
| Torch_Metal | 23 | Gate(3), Marsh(3), Pit(2), Arsenal(2), Arena(4), Shrine(2), Gauntlet(4), Boss(8) |
| Chain_Coil | 28 | Gate(4), Marsh(6), Pit(4), Arena(6), Gauntlet(4), Boss(8) |
| Banner_1 | 6 | Gate(1), Gauntlet(3), Boss(2) |
| Anvil | 6 | Gate(2), Boss(4) |
| Barrel | 8 | Arena(8) |
| Cage_Small | 6 | Marsh(3), Pit(3) |
| Cauldron | 2 | Marsh(2) |
| WeaponStand | 6 | Arsenal(6) |
| Shield_Wooden | 4 | Arsenal(4) |
| Sword_Bronze | 4 | Arsenal(4) |
| Lantern_Wall | 2 | Arena(2) |
| Scroll_2 | 1 | Shrine(1) |
| Bench | 1 | Shrine(1) |
| Bucket_Metal | 1 | Shrine(1) |
| **TOTAL** | **98** | |

**Circle-specific Meshy props available (20):** lava-altar, wrath-anger-graffiti-slab, wrath-anvil, wrath-blood-spattered-slab, wrath-caged-lantern, wrath-chain-curtain, wrath-corroded-pipe-pillar, wrath-dented-iron-door, wrath-explosive-barrel, wrath-iron-grate, wrath-jagged-arch, wrath-pit-tier-ring, wrath-punching-bag-chain, wrath-rage-furnace, wrath-rusted-cage, wrath-shattered-weapon-rack, wrath-smashed-barrier, wrath-stone-island, wrath-war-banner, wrath-weapon-pedestal.

**Circle-specific Meshy props with manifests:** lava-altar, wrath-anvil (2 of 20). **None have GLBs.**

**Circle-specific Meshy props placed in build script:** ZERO.

**Quaternius props applicable but NOT used:**
- `prop-spikes` / `prop-trap-spikes` -- would sell the danger of Wrath rooms
- `prop-skull` / `prop-rpg-skull` -- scattered skulls on the colosseum sand
- `prop-bones` / `prop-bones2` -- detritus from past combats
- `prop-axe-wall` / `prop-sword-wall` -- Arsenal walls (instead of nonexistent WeaponStand)
- `prop-shield-wall` -- Arsenal walls (instead of nonexistent Shield_Wooden)
- `prop-bear-trap` -- Blood Marsh islands, danger decoration
- `prop-column-broken` -- Rage Pit tier edges
- `prop-dead-tree` -- Blood Marsh atmosphere
- `prop-cobweb` / `prop-cobweb2` -- Shrine of Fury (cobwebs = neglected space)

**Redundancies:**
- `Anvil` (build script) vs `wrath-anvil` (Meshy) -- same concept
- `Barrel` vs `wrath-explosive-barrel` -- Meshy version is purpose-built for explosion
- `Cage_Small` vs `wrath-rusted-cage` -- Meshy has the thematic treatment
- `Banner_1` vs `wrath-war-banner` -- Meshy version has circle-specific design
- `Lantern_Wall` vs `wrath-caged-lantern` -- exact same concept
- `WeaponStand` vs `wrath-weapon-pedestal` / `wrath-shattered-weapon-rack` -- duplicated

**Missing from build script vs design doc:**
- Design doc mentions "5x raised stone islands (structural, elevation 0)" in Blood Marsh -- these are structural geometry, not props, but no island differentiation is visible in prop placement
- Design doc mentions "4x stone tiers (concentric)" in Rage Pit -- structural geometry only, no visual tier markers placed
- Design doc mentions "1x pedestal (far end, structural, for Goat's Bane)" in Arsenal -- no pedestal prop placed
- No props reference the Wrath-specific "cracked concrete stained with old blood" or "fired brick" aesthetic beyond PBR materials

### Room-by-Room Walkthrough

#### Room: Gate of Dis (10x6)

**First-Timer:** Two anvils flanking the entrance are a strong visual motif. 4 chains hanging from the ceiling establish the Wrath signature immediately. 3 torches and a banner over the door. I know this is a gateway -- the architecture communicates "entrance to something terrible." No enemies, just supplies and atmosphere. Good intro.
**Speedrunner:** Safe room, ammo and health at spawn. Grab both, sprint south. No reason to linger. 10x6 is quick to cross.
**Explorer:** 11 props in a 10x6 room -- decent density. The anvils are the hero pieces. Chains establish a visual language that persists through the entire circle. The banner is a nice touch.
**Verdict:** GOOD -- effective atmospheric intro room
**Recommendations:**
- When available, replace `Anvil` with `wrath-anvil` for thematic consistency
- Add `prop-skull` or `prop-rpg-skull` at the gate base (past victims)
- Consider `wrath-jagged-arch` for the gateway when Meshy GLBs arrive

#### Room: Blood Marsh (16x14)

**First-Timer:** This is the largest exploration room in Act 2. I wade through blood-marsh (slow movement). I can see stone islands rising above the liquid. 3 torches on islands tell me where the safe platforms are. 2 cauldrons bubble on central islands -- atmospheric. 3 cages on islands suggest imprisoned souls. 6 chains hang overhead. fireGoats on islands fire at me while I wade. The room reads well: islands = safety, marsh = danger, get to the islands.
**Speedrunner:** 16x14 with slow movement in the marsh is a time sink. Island-hopping is the key. The escalation timer means dawdling is death. I need to plot the shortest island-to-island route. Pickups on opposite islands force full traversal -- annoying for speedrunning but good design.
**Explorer:** 14 props for a 16x14 room is sparse. The islands are structural but have minimal dressing (1 prop each: torch, cauldron, or cage). Between the islands, the marsh is visually monotonous -- no floating debris, no submerged props, no dead trees. The ceiling chains help break up the vertical space but the room floor (the marsh itself) is empty.
**Verdict:** NEEDS WORK -- islands under-dressed, marsh visually monotonous
**Recommendations:**
- Add `prop-dead-tree` on 2-3 islands (silhouettes breaking the flat island tops)
- Add `wrath-stone-island` props when available (visual island differentiation)
- Add `prop-bones` floating in the marsh at island edges
- Add `prop-rock1`/`prop-rock2` partially submerged near islands
- One cauldron is good, two is enough -- add variety props instead

#### Room: Rage Pit (12x12)

**First-Timer:** Descending tiers like an amphitheater. I can see enemies below. 2 torches on the rim walls and 3 cages on tier edges are the only decoration. 4 chains hang from the ceiling center. The tiered structure is interesting but the visual dressing is minimal -- stone steps with almost nothing on them. It reads as "big empty pit with enemies."
**Speedrunner:** Vertical combat is unique. Drop tier by tier, clear fast. The open center means good sightlines downward. The escalation timer punishes slow descent -- drop and shoot. No prop clutter at all. Very clean arena.
**Explorer:** 9 props in a 12x12 room -- sparse. The concentric tier structure is architectural interest, but the tiers themselves have nothing on them. No debris from past fights, no broken columns on the tier edges, no ritual markings. The cages are good but 3 is not enough for a room this size. The chains in the center above the pit help but do not compensate for empty tier surfaces.
**Verdict:** NEEDS WORK -- structural geometry is interesting but surfaces are barren
**Recommendations:**
- Add `prop-column-broken` on 2-3 tier edges (past destruction)
- Add `prop-bones`/`prop-skull` scattered on lower tiers
- Add `wrath-pit-tier-ring` on each tier when Meshy GLBs arrive
- Add `prop-spikes` at the bottom of the pit center (visual danger)

#### Room: Arsenal (12x6)

**First-Timer:** Walls lined with weapon displays -- 6 WeaponStands, 4 shields, 4 swords. 2 torches near the entrance. The Goat's Bane sits at the far end on a pedestal. A goatKnight guards it. The room reads as an armory, clearly. I know to get to the shining weapon at the end.
**Speedrunner:** 12x6 is a sprint corridor. The weapon displays on walls do not block movement. 2 enemies: fireGoat near entrance, goatKnight near pedestal. Design says sprint past both, grab Bane. The narrow width (6) means limited lateral dodge. Good pressure design.
**Explorer:** This is the most prop-dense room per-square-cell in Circle 5. 20 wall-mounted props create a genuine armory atmosphere. The issue: `WeaponStand`, `Shield_Wooden`, and `Sword_Bronze` do not exist in the Quaternius library. The Quaternius equivalents are `prop-sword-wall`, `prop-shield-wall`, and `prop-axe-wall`. These ARE available. Also: the pedestal for the Goat's Bane is mentioned in the design doc but not placed as a prop.
**Verdict:** GOOD (density) / NEEDS WORK (prop names)
**Recommendations:**
- Replace `WeaponStand` with actual Quaternius `prop-sword-wall` or `prop-sword-mount`
- Replace `Shield_Wooden` with `prop-shield-wall`
- Replace `Sword_Bronze` with `prop-axe-wall` (variety) or `prop-sword-wall`
- Add `prop-pedestal` at (20,50) for the Goat's Bane display
- Add `wrath-weapon-pedestal` when Meshy GLBs arrive

#### Room: Berserker Arena (14x14, arena)

**First-Timer:** 8 barrels in a ring around the center. 4 torches on the walls. 6 chains hanging from the ceiling. 2 overhead lanterns. The barrels are the stars -- they are clearly destructible cover/weapon. The room reads as an industrial fight pit. Chains overhead add visual density. The barrel ring pattern tells me "use these."
**Speedrunner:** 8 barrels = 8 potential area damage sources. Round 1 (3 fireGoats): one Goat's Bane rocket near barrels can chain-kill. Round 2 (2 goatKnights): barrel explosion timing is key. Round 3 (mini-boss + 2): save at least 2 barrels for the big one. Barrel management IS the speedrun strat. The room is well-designed for this.
**Explorer:** 22 props -- good density for a 14x14 arena. The barrels, chains, torches, and lanterns create a layered visual. My concern: the barrel ring is evenly distributed (4 on west, 4 mixed), which reads as mechanically placed rather than environmentally organic. Stagger the placement slightly. Also, no floor debris -- after 3 rounds of combat, the room should feel battered.
**Verdict:** GOOD -- the best arena room in Act 2
**Recommendations:**
- Replace `Barrel` with `wrath-explosive-barrel` when available (visual distinction from generic barrels)
- Add `prop-broken-pot` or debris scatter at room edges
- Offset barrel positions slightly from perfect grid alignment for organic feel
- Add `wrath-iron-grate` on the floor center when available

#### Room: Shrine of Fury (6x6, secret)

**First-Timer:** Small, quiet room. 2 torches, a scroll, a bench, a bucket. Deliberately sparse -- the design doc says "the eye of the storm." The contrast with the arena outside is effective. The bench communicates "rest here."
**Speedrunner:** Secret room, off critical path. Good supply dump (2 health, 2 ammo). Skip unless running low.
**Explorer:** 5 props in a 6x6 room. For a secret room, this is appropriate. The design doc explicitly calls for muted, plain decoration. The Bench as a symbol of peace in the Circle of Wrath is a good thematic touch. The Scroll_2 provides lore.
**Verdict:** GOOD -- appropriately minimal for its role
**Recommendations:**
- Add `prop-cobweb` in corners (neglected, forgotten space)
- When available, add `wrath-caged-lantern` (a calmer version of the arena lighting)

#### Room: Gauntlet (6x20, corridor)

**First-Timer:** Long, narrow corridor. 4 torches alternate on E/W walls at intervals. 3 tattered war banners. 4 chains hanging at intervals. Enemies spawn behind me as I advance. The visual rhythm (torch-chain-banner-torch-chain-banner) creates forward momentum. I can see the ramp descents. The room communicates "do not stop."
**Speedrunner:** 6-wide is tight. Ramps create elevation changes. Enemies behind means I fire backward while running forward. The alternating torch/banner placement on alternating walls provides visual checkpoints. Pickup placement at 1/3 and 2/3 marks is ideal.
**Explorer:** 11 props for a 6x20 room. The elongated shape means props are spread thin (roughly 1 per 11 cells). The visual rhythm works but the corridor between checkpoints feels empty. The ramp geometry (structural) provides interest but the ramp surfaces have no props.
**Verdict:** NEEDS WORK -- rhythm is good but density is thin for a 120-cell room
**Recommendations:**
- Add `prop-bones` or `prop-skull` at ramp transitions (past victims)
- Add `wrath-smashed-barrier` at ramp tops when available (destroyed obstacles)
- Add 2 more chains in the gaps between existing chains
- Add `wrath-blood-spattered-slab` on walls when available

#### Room: Furia's Colosseum (16x16, boss)

**First-Timer:** Grand arena. 8 torches ring the perimeter. 8 chains hang from the ceiling (Furia will rip these in phase 2). 2 banners flank the entrance. 4 anvils at cardinal points. Sand floor (texture-based). Furia in the center. The room reads as a gladiatorial arena -- appropriate. The chains overhead are critical to the phase 2 narrative (whip weapons).
**Speedrunner:** 16x16 is the largest boss arena in Act 2. Plenty of dodge space for phase 1 charges. Phase 2 chain whip has 4-cell range -- stay beyond 4 cells, fire Goat's Bane. Phase 3 walls close -- DPS check. Anvils at cardinal points are position landmarks. No prop clutter in the open center. Clean fight.
**Explorer:** 22 props for a 16x16 room. Good perimeter coverage with torches and chains. The anvils at cardinal points are excellent landmarks. The chains from the ceiling serve a dual purpose (decoration + phase 2 weapon source). The issue: the sand floor (256 cells) has zero props. It reads as a featureless flat plane with things only on the walls and ceiling.
**Verdict:** GOOD -- well-designed for boss mechanics, could use floor interest
**Recommendations:**
- Add `prop-skull`/`prop-rpg-skull` scattered on the sand (past gladiators)
- Add `prop-bones` at arena edges (half-buried in sand)
- When available, add `wrath-stone-island` as small raised platforms on the sand
- The chains are critical gameplay elements -- ensure they are tagged as interactive

### Gap Analysis

**Over-dressed rooms:** Arsenal (20 wall props -- good), Berserker Arena (22 props -- good)
**Under-dressed rooms:** Blood Marsh (14 props for 224 cells), Rage Pit (9 props for 144 cells)
**Missing types:** No pedestal for Goat's Bane weapon display. No floor debris/bones in the Colosseum sand. Many prop names do not exist in Quaternius library (WeaponStand, Shield_Wooden, Sword_Bronze, Anvil, Cauldron, Cage_Small, Lantern_Wall, Bucket_Metal).
**Prop name concerns:** Of the 14 unique prop types used, approximately 8 do not have matching Quaternius GLBs: `Anvil`, `Cauldron`, `Cage_Small`, `WeaponStand`, `Shield_Wooden`, `Sword_Bronze`, `Lantern_Wall`, `Bucket_Metal`. These need either a name mapping layer or replacement with actual Quaternius names.
**Balance:** 20 enemies + boss across 8 rooms. 3-round arena with a mini-boss (80 HP) at round 3 is a good difficulty spike. Escalation mechanic pressure is well-distributed. The Gauntlet is the intensity climax before the boss -- good pacing.

---

## Circle 6: Heresy

### Asset Audit

**Build script uses (72 spawnProp calls, 16 unique prop types):**
| Prop Name | Count | Rooms |
|-----------|-------|-------|
| CandleStick_Triple | 14 | Narthex(1), Nave(4), Trial(4), Library(1), Chapel(5) |
| Banner_2 | 7 | Narthex(1), Nave(4), Chapel(2) |
| Bench | 18 | Nave(16), Trial(2) |
| Vase_2 | 8 | Catacombs(4), Ossuary(4) |
| Vase_4 | 7 | Narthex(2), Catacombs(3), Ossuary(2) |
| Torch_Metal | 5 | Catacombs(5) |
| Chain_Coil | 5 | Ossuary(5) |
| Cabinet | 3 | Confessional(3) |
| Scroll_2 | 1 | Narthex(1) |
| BookStand | 3 | Trial(1), Library(1), Chapel(1) |
| Bookcase_2 | 4 | Library(4) |
| Book_5 | 3 | Library(3) |
| Book_7 | 2 | Library(2) |
| Scroll_1 | 2 | Library(2) |
| Candle_2 | 1 | Confessional(1) |
| Chalice | 2 | Chapel(2) |
| Chandelier | 1 | Chapel(1) |
| **TOTAL** | **86** | (Bench x16 inflates the count) |

**Circle-specific Meshy props available (20):** demon-throne, heresy-bone-urn, heresy-broken-stained-glass, heresy-burning-pyre, heresy-catacomb-torch, heresy-church-pew, heresy-confessional-booth, heresy-corrupted-reliquary, heresy-cracked-baptismal-font, heresy-cracked-marble-pillar, heresy-desecrated-arch, heresy-forbidden-bookcase, heresy-pentagram-floor-tile, heresy-profane-symbol, heresy-ritual-chandelier, heresy-shattered-icon, heresy-toppled-altar, heresy-torn-scripture-slab, heretic-tome, inverted-cross.

**Circle-specific Meshy props with manifests:** demon-throne, heretic-tome, inverted-cross (3 of 20). **None have GLBs.**

**Circle-specific Meshy props placed in build script:** ZERO.

**Quaternius props applicable but NOT used:**
- `prop-book-open` -- for Nave pews, Heretic's Library floor scatter
- `prop-cobweb` / `prop-cobweb2` -- for Catacombs atmosphere
- `prop-bones` / `prop-bone` -- for Ossuary (it is a bone storage room!)
- `prop-skull` / `prop-rpg-skull` -- for Ossuary, Catacombs
- `prop-column` / `prop-column-broken` -- for Nave columns (design doc describes "Marble019 columns at intervals")
- `prop-broken-pot` -- for Catacombs dead ends
- `prop-candelabrum-tall` -- supplement CandleStick_Triple
- `prop-carpet` -- for Chapel pentagram center / Nave aisle
- `prop-pedestal` -- for Chapel altar, Library reading podium

**Redundancies:**
- `Bench` (build script) vs `heresy-church-pew` (Meshy) -- direct duplicate
- `Cabinet` vs `heresy-confessional-booth` (Meshy) -- Meshy version is purpose-built
- `Bookcase_2` vs `heresy-forbidden-bookcase` (Meshy) -- same role, themed version exists
- `Banner_2` (used as inverted cross) vs `inverted-cross` (Meshy) -- the Meshy version is literally the prop described
- `CandleStick_Triple` vs `heresy-ritual-chandelier` (for Chapel specifically)
- `Chandelier` vs `heresy-ritual-chandelier` -- same concept, themed version exists
- `BookStand` as altar vs `heresy-toppled-altar` -- Meshy has the actual altar prop
- `Chalice` vs `heresy-cracked-baptismal-font` -- different roles but related liturgical items

**Missing from build script vs design doc:**
- Nave of Lies: design doc describes "Marble019 columns at intervals support arched ceiling" -- NO column props placed
- Narthex: design doc says "arched ceiling modeled with WALL_STONE above standard height" -- structural only
- Narthex: design doc says "A torch on the east wall flickers differently" near WALL_SECRET -- no torch placed near east wall
- Confessional: "raised stone platforms (FLOOR_RAISED cells)" for booths -- structural only
- Catacombs: design doc says "walls are lined with skeletal remains" -- no bone/skull props in a bone-storage maze
- Ossuary: "walls are lined with skeletal remains" -- only Chain_Coil and Vase props. ZERO bone/skull props in an OSSUARY (bone storage room)
- Chapel: pentagram floor pattern is environmental zone only -- no `heresy-pentagram-floor-tile` placed
- No inverted cross props placed anywhere despite the design doc repeatedly mentioning them
- No `heresy-profane-symbol` or `heresy-shattered-icon` placed despite design doc referencing heretical imagery throughout

### Room-by-Room Walkthrough

#### Room: Narthex (8x6)

**First-Timer:** Temple entrance. 2 funerary urns, a scroll, a candelabra, and an inverted banner. Small, atmospheric. I see the south door... but the design doc says it is locked. I need to find the WALL_SECRET on the east wall. The shimmer visual tell should guide me. BUT -- the design doc says "a torch on the east wall flickers differently" as a teach for the secret wall, and no torch is placed near the east wall in the build script. The teach is broken.
**Speedrunner:** 8x6, find the WALL_SECRET, move on. If I know the location (east wall), this is 2 seconds. If I do not, the shimmer tell saves time.
**Explorer:** 5 props for an 8x6 room. The Banner_2 (inverted) is the first heretical visual -- good. The scroll provides lore. The missing east-wall torch is a critical omission for the WALL_SECRET teach.
**Verdict:** NEEDS WORK -- missing the torch visual teach for the critical-path WALL_SECRET
**Recommendations:**
- Add `Torch_Metal` on the east wall near (27, 5) with special flickering to teach WALL_SECRET
- Add `inverted-cross` prop when Meshy GLBs arrive (the circle's signature)
- Add `heresy-cracked-marble-pillar` flanking the south door when available

#### Room: Nave of Lies (14x10)

**First-Timer:** Church nave with 16 pew benches in a 4x4 grid, 4 candelabras in corners, 4 inverted banners on walls. The FLOOR_VOID trap is in the center aisle -- I cannot see it because it looks like normal floor. If I walk the obvious center path, I fall (25 damage + teleport back). The WALL_SECRET on the west wall is the real exit. The room teaches "do not trust the obvious path." 2 fireGoats patrol the aisles.
**Speedrunner:** Avoid center aisle, hug a side wall. Find the west WALL_SECRET quickly. The pew rows create lanes -- not ideal for speed but navigable. The fireGoats are between the pews, predictable patrol.
**Explorer:** 24 props (16 benches + 4 candelabras + 4 banners). The bench grid dominates. However, the design doc describes "Marble019 columns at intervals support arched ceiling" -- there are NO columns placed. In a Gothic nave, columns are the defining architectural feature. Their absence makes the room feel flat. Also missing: no floor variation, no carpet down the center aisle (which would also serve as a visual cue around the FLOOR_VOID).
**Verdict:** NEEDS WORK -- missing columns (the defining feature of a nave)
**Recommendations:**
- Add `prop-column` at 4-6 positions along the nave sides (every 2-3 cells)
- Add `prop-carpet` down the center aisle up to the FLOOR_VOID edge (visual cue)
- Add `heresy-broken-stained-glass` on walls when available
- Add `heresy-profane-symbol` on the south wall when available (where the "obvious" exit should be)

#### Room: Confessional (6x6)

**First-Timer:** 3 cabinet booths in a column. 1 candle on the east wall -- very dim. I need to enter each booth. Booth A has health, Booth B has a shadowGoat ambush, Booth C's back wall is WALL_SECRET (exit). The room is deliberately claustrophobic and dim. The 3 cabinets establish the 3-choice pattern effectively.
**Speedrunner:** Skip booth A and B if you know the layout. Go straight to Booth C, walk through WALL_SECRET. If blind, the room is a 30-second exploration with one jump scare.
**Explorer:** 4 props in a 6x6 room. Minimal, but the room is meant to be a small chamber. The 3 Cabinets serve as functional booth structures. The single Candle_2 is the only light. The room works, but it would benefit from more liturgical detail -- a prayer kneeler, religious text, etc.
**Verdict:** GOOD -- appropriately sparse for its intimate scale
**Recommendations:**
- Add `heresy-confessional-booth` instead of generic `Cabinet` when available
- Add `prop-book-open` on the shelf in Booth A (prayer book)
- Add `prop-candle` inside each booth (ritual candles)

#### Room: Catacombs (10x10)

**First-Timer:** Underground maze. 5 torches (3 lit at safe intersections, 2 dark on trap paths) and 7 vases (4 small, 3 large). The torches as navigation aids are a good mechanic -- lit = safe, dark = danger. The vases at dead ends and intersections provide landmarks. 3 shadowGoats roam the corridors (semi-invisible). The low ceiling (2.5 units) should feel claustrophobic. BUT: this is meant to be an ossuary-style catacomb with "walls lined with skeletal remains." There are ZERO bone/skull props. Not a single one. The room reads as "stone maze with vases" rather than "bone catacombs."
**Speedrunner:** Maze rooms are speedrunner nightmares. The WALL_SECRET shortcuts (2) help. The lit-torch safe path reduces navigation time. 3 shadowGoats in wider passages (3 cells) are manageable.
**Explorer:** 12 props for a 10x10 maze. The vases serve as landmarks, which is good design. But the complete absence of bone/skull/skeleton props in a catacomb is a major thematic failure. The room should be DRIPPING with bones.
**Verdict:** NEEDS WORK -- completely missing the bone/skeletal theme that defines a catacomb
**Recommendations:**
- Add `prop-bones`, `prop-bones2`, `prop-bone` at 6-8 positions along corridors
- Add `prop-skull`, `prop-rpg-skull`, `prop-rpg-skull2` at dead ends
- Add `prop-cobweb`/`prop-cobweb2` in corners and on ceiling
- When available, add `heresy-catacomb-torch` to replace generic torches
- When available, add `heresy-bone-urn` to replace generic Vase_2/Vase_4
- Consider `prop-wall-rocks` for crumbling catacomb walls

#### Room: Trial Chamber (12x12, arena)

**First-Timer:** Church courtroom. 2 benches and a bookstand form the judge's platform at the north (elevated). 4 candelabras in corners. The arena concept is clear: enemies fire from the elevated bench, I am on the floor below. I need to find the WALL_SECRET ramp behind the bench. 2 waves of enemies.
**Speedrunner:** Wave 1 (3 fireGoats on elevated bench) -- I need elevation access. Finding the WALL_SECRET behind the bench is required. Once on the bench, I have high-ground advantage for Wave 2. The 12x12 floor provides good dodge space.
**Explorer:** 7 non-bench props for a 12x12 room. The bench/bookstand ensemble on the elevated platform is the hero piece -- it reads well. But the floor below the bench is completely empty except for the 4 corner candelabras. A 12x12 arena with nothing on the floor except edge lighting is sparse. The walls are bare. No ecclesiastical decoration.
**Verdict:** NEEDS WORK -- floor and walls too empty for a courtroom arena
**Recommendations:**
- Add `prop-column` at 2-4 positions flanking the bench platform (courtroom architecture)
- Add `prop-carpet` on the floor leading from the entrance to the bench (processional aisle)
- Add `heresy-cracked-marble-pillar` when available
- Add `heresy-profane-symbol` on the walls when available
- Add `heresy-torn-scripture-slab` on the bench surface when available

#### Room: Ossuary (8x8)

**First-Timer:** 5 chains hanging from the ceiling. 4 small vases and 2 large vases. 2 shadowGoats lurk among the chains. The design doc says this is a "bone storage chamber" with "walls lined with skeletal remains." There are ZERO bones, ZERO skulls, ZERO skeletal props. The room reads as "chain room with pottery" not "ossuary." This is the most egregious thematic disconnect in Act 2.
**Speedrunner:** 8x8 transitional room. 2 shadowGoats to clear. Chain clutter on ceiling may obscure shadowGoat shimmer effects. Quick fight, move to boss.
**Explorer:** 11 props for an 8x8 room -- adequate density. But ALL the props are wrong. An ossuary should be dominated by bones, skulls, and skeletal remains. Instead, we have chains (5) and vases (6). The chains are the Wrath signature, not the Heresy signature. The vases are generic. Nothing in this room says "bone storage."
**Verdict:** EMPTY (thematically) -- props present but completely wrong for the room's identity
**Recommendations:**
- Add `prop-bones`, `prop-bones2` on shelves along all walls (8-12 placements)
- Add `prop-skull`, `prop-rpg-skull` at eye level in wall niches (4-6 placements)
- Add `prop-bone` scattered on the floor (4-6 placements)
- Replace Vase_2/Vase_4 with `heresy-bone-urn` when available
- Keep some Chain_Coil (2-3) but reduce from 5 -- this is not Wrath
- Add `prop-cobweb` in corners

#### Room: Heretic's Library (6x8, secret)

**First-Timer:** Bookcases lining the walls. A central reading podium. Books and scrolls scattered on the floor. 1 candelabra for dim light. The room reads clearly as a forbidden library -- the props sell it. This is the most thematically coherent room in Circle 6.
**Speedrunner:** Secret room, off critical path. Ammo x2 and health x1. Good supply dump for those who find the WALL_SECRET in the Trial Chamber.
**Explorer:** 17 props in a 6x8 room -- the highest density in Circle 6. 4 bookcases, 1 bookstand, 3 books, 2 books, 2 scrolls, 1 candelabra. Every prop serves the library theme. The floor scatter of books suggests frantic study. Excellent.
**Verdict:** GOOD -- the best-dressed room in Circle 6
**Recommendations:**
- Replace `Bookcase_2` with `heresy-forbidden-bookcase` when available
- Add `heretic-tome` prop on the central bookstand when available
- Add `prop-candle` on bookshelf surfaces (reading light)
- Add `prop-cobweb` on top bookcase shelves (old, neglected)

#### Room: Profano's Chapel (14x14, boss)

**First-Timer:** Ritual space. 5 candelabras at pentagram points -- I can see the pentagram shape from their placement. Central bookstand as altar. Chandelier overhead. 2 chalices on the altar. 2 inverted banners on walls. Profano stands at center. The room reads as a dark ritual chamber. The pentagram is communicated through candelabra placement alone -- no pentagram floor prop is placed.
**Speedrunner:** 14x14 is spacious. Phase 1 (illusion copies): need to identify the real Profano by watching for projectile sparks. Phase 2 (camera inversion): disorienting but manageable in a large room. Phase 3 (collapsing floor): stay near center altar (safe ground). Pickups at south edge are accessible early but become unreachable during phase 3.
**Explorer:** 12 props for a 14x14 room. The pentagram pattern via candelabra placement is clever but the floor itself has no pentagram marking. The altar (bookstand + chalices) is the centerpiece but it is just a bookstand -- not a proper altar. The chandelier overhead is atmospheric but there is only one. The walls have 2 banners and nothing else. A boss arena this size needs more visual density.
**Verdict:** NEEDS WORK -- missing pentagram floor prop, altar is undersold, walls are bare
**Recommendations:**
- Add `heresy-pentagram-floor-tile` at center when Meshy GLBs arrive (critical)
- Replace `BookStand` altar with `heresy-toppled-altar` when available
- Replace `Chandelier` with `heresy-ritual-chandelier` when available
- Add `inverted-cross` on walls (2-4 placements) when available
- Add `heresy-profane-symbol` on the floor or walls
- Add `prop-candle` scattered around pentagram points
- Add `heresy-cracked-marble-pillar` at room corners when available
- Add `prop-column` at 4 positions (temple architecture)

### Gap Analysis

**Over-dressed rooms:** Heretic's Library (17 props / 48 cells = 0.35 props/cell -- excellent)
**Under-dressed rooms:** Trial Chamber (7 props for 144 cells), Ossuary (11 props but thematically wrong), Chapel (12 props for 196 cells)
**Missing types:**
- BONES: Zero bone/skull props in the entire circle. An Ossuary with no bones. A Catacomb with no bones. This is the single biggest thematic failure in Act 2.
- INVERTED CROSSES: Design doc mentions them repeatedly, Banner_2 is used as a stand-in (rotated 180deg), but `inverted-cross` Meshy prop has a manifest and is purpose-built.
- COLUMNS: The Nave of Lies has no columns despite the design doc describing them.
- PENTAGRAM: No pentagram floor prop in the Chapel.
- ALTAR: The boss altar is a BookStand.
**Prop name concerns:** `CandleStick_Triple`, `BookStand`, `Bookcase_2`, `Book_5`, `Book_7`, `Candle_2`, `Chandelier` -- none of these match Quaternius GLB filenames. Many of these map to Quaternius equivalents: `Bookcase_2` -> `prop-bookcase`, `Candle_2` -> `prop-candle`, but the naming mismatch needs a resolution layer.
**Balance:** 16 enemies + boss across 8 rooms. The shadowGoat as a new enemy type is well-introduced (Confessional ambush is the teach). The WALL_SECRET/FLOOR_VOID mechanics create the intended tension. Difficulty is more about navigation awareness than combat pressure.

---

## Cross-Circle Analysis

### Palette Transitions

| Aspect | Circle 4 (Greed) | Circle 5 (Wrath) | Circle 6 (Heresy) |
|--------|-------------------|-------------------|---------------------|
| Primary color | Gold/amber `#ffcc44` | Orange-red `#ff4411` | Cold purple `#6633aa` |
| Fog color | `#1f1a08` warm brown | `#1a0808` blood red | `#1a1520` incense purple |
| Ambient intensity | 0.20 (rich, warm) | 0.22 (aggressive) | 0.12 (dim, liturgical) |
| Feel | Opulent vault | Industrial rage | Decayed temple |

The palette transitions are excellent: warm gold -> hot red -> cold purple. Each circle has a distinct color identity. The intensity progression (0.20 -> 0.22 -> 0.12) creates a deliberate dimming into Heresy that matches the theme of hidden truth.

### Difficulty Ramp

| Metric | Circle 4 | Circle 5 | Circle 6 |
|--------|----------|----------|----------|
| Rooms | 6 | 8 | 8 |
| Enemies (non-boss) | 14 | 20 | 16 |
| Enemy types | 2 (goatKnight, hellgoat) | 3 (fireGoat, hellgoat, goatKnight) | 2 (shadowGoat, fireGoat) |
| New enemy | goatKnight (armored) | fireGoat (ranged fire) | shadowGoat (invisible) |
| New weapon | -- | Goat's Bane (Bazooka) | -- |
| Mechanic complexity | Medium (hoarding penalty) | High (escalation + barrel mgmt) | High (illusion walls + void traps) |
| Arena waves | 2 | 3 | 2 |
| Secret room | Yes (Reliquary) | Yes (Shrine of Fury) | Yes (Heretic's Library) |

The ramp is well-structured: Circle 4 introduces armored enemies and a resource management puzzle, Circle 5 escalates aggression with a time-pressure mechanic and adds the Bazooka to compensate, Circle 6 shifts from combat pressure to environmental deception. The difficulty is not purely numeric -- it changes in character from circle to circle.

### Reuse Opportunities

**Cross-circle prop sharing:**
- `Chain_Coil` appears in all 3 circles (4 in C4, 28 in C5, 5 in C6). In C5 it is thematic (Wrath's chains), but in C4 and C6 it feels like a default filler. Consider reducing in C4/C6 and using circle-specific alternatives.
- `Torch_Metal` appears in all 3 circles as the primary light source. This is appropriate -- torches are universal in underground environments.
- `Banner_1` / `Banner_2` appear across circles. `Banner_1` is generic (C4 Auction Hall, C5 everywhere), `Banner_2` is used as "inverted cross" in C6 -- this should be replaced with the actual `inverted-cross` prop.

**Quaternius props available but unused in ALL three circles:**
- `prop-cobweb` / `prop-cobweb2` (atmospheric, universal)
- `prop-bones` / `prop-bones2` / `prop-bone` (environmental storytelling)
- `prop-skull` / `prop-rpg-skull` / `prop-rpg-skull2` (death motif, universal)
- `prop-broken-pot` (debris)
- `prop-column` / `prop-column-broken` / `prop-column-broken2` (architecture)
- `prop-rock1` / `prop-rock2` / `prop-rock3` (environmental scatter)
- `prop-pedestal` / `prop-pedestal2` (display stands)
- `prop-carpet` (floor variety)
- `prop-book-open` (lore, atmosphere)
- `prop-candelabrum-tall` (lighting variety)

That is 18 Quaternius props with existing GLBs that are not used in any Act 2 build script.

### Boss Rooms Compared

| Aspect | Aureo's Court (C4) | Furia's Colosseum (C5) | Profano's Chapel (C6) |
|--------|---------------------|-------------------------|------------------------|
| Size | 14x14 | 16x16 | 14x14 |
| Props | 18 | 22 | 12 |
| Props/cell | 0.092 | 0.086 | 0.061 |
| Hero piece | MISSING (throne) | Chains (phase 2 weapon) | MISSING (pentagram floor) |
| Phase mechanics | Coins, steal, strip | Charge, whip, berserker | Illusions, inversion, collapse |

Profano's Chapel is the most under-dressed boss room. Aureo's Court is missing its signature throne. Furia's Colosseum is the most complete because its props are mechanically relevant (chains become weapons in phase 2).

---

## Action Items (Priority Ordered)

### P0 -- Critical (breaks theme or gameplay teach)

1. **Create prop name mapping layer.** The build scripts use ~32 Fantasy Props MegaKit names that do not match the 62 Quaternius GLB filenames (kebab-case with `prop-` prefix). Until this mapping exists, no props will render. This blocks ALL visual content in Act 2.

2. **Add bones/skulls to Circle 6 Ossuary and Catacombs.** An ossuary with zero bones is a fundamental thematic failure. Add `prop-bones`, `prop-bones2`, `prop-skull`, `prop-rpg-skull` (10-15 placements across both rooms). These GLBs exist and are ready.

3. **Add torch near Narthex east WALL_SECRET (Circle 6).** The design doc specifies a flickering torch as the visual teach for the first WALL_SECRET in the game. Without it, players may not discover the mechanic. This is a single `spawnProp` call.

4. **Add columns to Nave of Lies (Circle 6).** The design doc describes "Marble019 columns at intervals" as the defining architecture of the nave. `prop-column` GLBs exist. Add 4-6 column placements.

### P1 -- High (major visual gaps)

5. **Add throne prop to Aureo's Court (Circle 4).** The boss is described as standing at her throne. No throne exists. Use `greed-golden-throne` when Meshy GLB is generated, or use `prop-chair` as temporary stand-in.

6. **Dress the Weight Room (Circle 4).** Currently 6 props in a 10x10 room. Add: pressure plate visuals, skeletal goat environmental teach (bones + skull + scattered ammo), 2 more torches. 8-10 new prop placements needed.

7. **Add pentagram floor to Profano's Chapel (Circle 6).** The pentagram is communicated only through candelabra placement. Add `heresy-pentagram-floor-tile` when Meshy GLB is generated, or add `prop-carpet` in pentagram pattern as stand-in.

8. **Dress the Blood Marsh islands (Circle 5).** Each island has at most 1 prop. Add `prop-dead-tree`, `prop-rock1`/`prop-rock2`, `prop-bones` to make islands visually distinct from each other.

9. **Replace `Column_Stone` in Auction Hall (Circle 4).** This prop name does not exist in any asset library. Replace with `prop-column` (Quaternius, has GLB).

### P2 -- Medium (visual polish)

10. **Generate Meshy GLBs for circle-specific props.** Only 7 of 60 circle-specific props have manifests (2 for C4, 2 for C5, 3 for C6). None have GLBs. When generated, these should replace their generic Quaternius equivalents in the build scripts:
    - C4: `greed-golden-throne`, `greed-pressure-plate`, `greed-golden-candelabra`, `greed-vault-arch`
    - C5: `wrath-explosive-barrel`, `wrath-war-banner`, `wrath-pit-tier-ring`, `wrath-weapon-pedestal`
    - C6: `inverted-cross`, `heresy-pentagram-floor-tile`, `heresy-bone-urn`, `heresy-forbidden-bookcase`

11. **Add environmental scatter to all arena rooms.** The Auction Hall (C4), Berserker Arena (C5), and Trial Chamber (C6) all lack floor debris. Add `prop-broken-pot`, `prop-rock1`, `prop-bones` at room edges.

12. **Write the "3D Spatial Design" section for each design doc.** This section was referenced but never created. It should document spatial relationships, sightlines, vertical gameplay, and prop placement intent per room.

13. **Add `prop-cobweb`/`prop-cobweb2` to secret rooms.** Cobwebs signal "hidden, neglected space" and reinforce that the player found something off the beaten path. Add to Reliquary (C4), Shrine of Fury (C5), and Heretic's Library (C6).

14. **Reduce Chain_Coil in Circle 6.** Chain_Coil is the signature prop of Circle 5 (Wrath). Using it as the primary prop in Circle 6's Ossuary creates thematic bleed. Replace with bone/skull props.

### P3 -- Low (nice-to-have)

15. **Add `inverted-cross` Meshy prop throughout Circle 6.** The design doc describes inverted crosses as a key visual motif. Banner_2 (rotated) is a workaround. The Meshy manifest exists -- generate the GLB and place 6-8 instances across Nave, Trial Chamber, and Chapel.

16. **Add floor variety (carpets, rugs).** `prop-carpet` is available. Place in Nave of Lies center aisle (C6), Chapel processional, and Aureo's Court (C4) for floor visual variety.

17. **Add Decal system support.** All three design docs specify decals (Scratches, Fingerprints, Rust, Leaking, Stain) but no build script implements decals. This may require engine-side support.

18. **Stagger barrel placement in Berserker Arena (C5).** The 8 barrels are in a near-perfect geometric ring. Offset by 0.5-1 cell for a more organic feel.

19. **Add `prop-pedestal` under Goat's Bane display (C5 Arsenal).** The design doc specifies a pedestal for the weapon pickup. `prop-pedestal` GLB exists.

20. **Audit pickup-at-boundary coordinates.** Several pickups and props were adjusted in the build scripts because design doc coordinates fell on room boundaries (e.g., (7,34) -> (6,34) in Reliquary, (28,70) -> (27,70) in Boss chamber). Verify all adjusted coordinates are correct.
