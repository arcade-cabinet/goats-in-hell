# Act 1 Paper Playtest -- Circles 1-3

**Date:** 2026-03-01
**Evaluator:** Claude (paper playtest, no runtime)
**Scope:** Circles 1 (Limbo), 2 (Lust), 3 (Gluttony) -- design docs vs. build scripts vs. full asset inventory (319 props)

---

## Executive Summary

Act 1 has strong bones. Each circle has a distinct identity -- Limbo's fog-and-stone austerity, Lust's warm marble seduction, Gluttony's organic meat-wall horror -- and the build scripts faithfully implement the design docs' room layouts, enemy placements, triggers, and environment zones. The difficulty ramp from 12 enemies (Circle 1) to 15+boss (Circles 2 and 3), from one enemy type to two, and from a single mechanic (fog) to layered mechanics (wind + lava, then poison + acid + verticality) is well-paced for a first act.

However, the build scripts use **legacy Fantasy Props MegaKit** prop names (Torch_Metal, CandleStick_Triple, Cage_Small, Chain_Coil, BookStand, etc.) that do not exist in the current asset inventory. The 62 Quaternius props, 62 Meshy general props, and 66 circle-specific Meshy props (22 per circle) are the actual available assets, and **none of them are referenced in any build script**. This is the single biggest gap: the prop names in the code do not match any real GLB file. Every `spawnProp` call will either silently fail or render a placeholder. Additionally, the design docs do not contain a "3D Spatial Design" section -- that section was referenced in the task prompt but does not yet exist in any of the three docs. The props listed in the design docs' "Props" tables also use the old Fantasy Props MegaKit nomenclature.

The second major gap is prop density variance. Circle 1 is sparse by design (7 unique prop types, ~25 total placements), which works thematically but leaves the Vestibule and Crypt feeling barren. Circle 3's Feast Hall is the opposite extreme -- 39+ prop placements in a single room (Table_Large, 4 plates, 12 cutlery pieces, 6 mugs, 4 bottles, 3 barrel-apples, 2 cauldrons, 2 farm crates) which risks both visual clutter and rendering performance. Circle 2 hits the sweet spot with moderate prop density and good variety. Across all three circles, the boss rooms are well-staged but could use more atmospheric dressing to feel truly climactic.

---

## Circle 1: Limbo

### Asset Audit

**Build script uses (prop names in `spawnProp` calls):**
- Torch_Metal (x7 -- Vestibule x2, Fog Hall x2, Crypt x1, Columns x2, Boss x3)
- Scroll_2 (x1 -- Vestibule)
- Vase_Rubble (x5 -- Vestibule x2, Fog Hall x3)
- Cage_Small (x2 -- Fog Hall)
- BookStand (x1 -- Crypt)
- Chain_Coil (x3 -- Bone Pit)
- Barrel (x1 -- Bone Pit)
- Column_Stone (x6 -- Columns)
- Banner_1 (x2 -- Boss Chamber)

**Total: 9 unique prop types, ~28 placements**

**Design doc "Props" table claims:** Same as above (design doc and build script match for Circle 1).

**3D Spatial Design section:** Does not exist in `docs/circles/01-limbo.md`.

**Quaternius props applicable to Limbo's theme (cold stone, fog, ancient ruins):**
- prop-torch-lit, prop-torch-mounted (direct replacement for Torch_Metal)
- prop-column, prop-column-broken, prop-column-broken2 (replacement for Column_Stone, plus broken variants for atmosphere)
- prop-barrel (replacement for Barrel)
- prop-vase, prop-broken-pot (replacement for Vase_Rubble)
- prop-book-open (replacement for BookStand/Scroll)
- prop-bones, prop-bones2, prop-bone (bone scatter for Bone Pit)
- prop-skull, prop-rpg-skull, prop-rpg-skull2 (skulls for atmosphere)
- prop-cobweb, prop-cobweb2 (webbing for Crypt, Fog Hall)
- prop-chest, prop-chest-gold (for Crypt reward)
- prop-pedestal, prop-pedestal2 (for scroll/weapon display)
- prop-candelabrum-tall, prop-candle, prop-candle-multi, prop-candles (lighting alternatives)
- prop-banner, prop-banner-wall (replacement for Banner_1)
- prop-crate (general storage)
- prop-rock1, prop-rock2, prop-rock3 (rubble/debris)
- prop-wall-rocks (wall detail)
- prop-spikes, prop-trap-spikes, prop-bear-trap (hazard dressing for Bone Pit)
- prop-dead-tree (could work in Vestibule if outdoor feel desired)
- prop-carpet (Crypt floor)
- prop-window (Crypt wall detail)
- prop-scythe, prop-axe-wall, prop-sword-wall, prop-shield-wall (wall decoration for Boss Chamber)

**Circle 1 Meshy props (22 available, none used in build script):**
fog-lantern, limbo-ancient-pillar, limbo-banner-tattered, limbo-bone-pile, limbo-broken-altar, limbo-cage, limbo-chain-cluster, limbo-cobweb-cluster, limbo-cracked-floor-slab, limbo-crumbling-arch, limbo-dried-fountain, limbo-fallen-column, limbo-inscription-tablet, limbo-iron-gate, limbo-moss-growth, limbo-sarcophagus, limbo-stone-bench, limbo-stone-lectern, limbo-tombstone, limbo-torch-bracket, limbo-vase-rubble, limbo-wall-sconce

**Redundancies (circle-specific Meshy props that duplicate Quaternius):**
| Circle-specific prop | Quaternius equivalent | Recommendation |
|---|---|---|
| limbo-bone-pile | prop-bones, prop-bones2 | Use Quaternius; save Meshy credit |
| limbo-cage | prop-bars (close enough) | Keep limbo-cage (distinct style) |
| limbo-cobweb-cluster | prop-cobweb, prop-cobweb2 | Use Quaternius; save Meshy credit |
| limbo-vase-rubble | prop-vase, prop-broken-pot | Use Quaternius; save Meshy credit |
| limbo-torch-bracket | prop-torch-mounted | Use Quaternius; save Meshy credit |
| limbo-wall-sconce | prop-torch-mounted | Use Quaternius (identical function) |
| limbo-banner-tattered | prop-banner, prop-banner-wall | Use Quaternius; save Meshy credit |
| limbo-fallen-column | prop-column-broken, prop-column-broken2 | Use Quaternius; save Meshy credit |

**8 of 22 circle-specific props are redundant with Quaternius.** The remaining 14 are genuinely unique: fog-lantern, limbo-ancient-pillar, limbo-broken-altar, limbo-chain-cluster, limbo-cracked-floor-slab, limbo-crumbling-arch, limbo-dried-fountain, limbo-inscription-tablet, limbo-iron-gate, limbo-moss-growth, limbo-sarcophagus, limbo-stone-bench, limbo-stone-lectern, limbo-tombstone.

**Missing from build script (props that SHOULD be placed but are not):**
- Zero Quaternius props are referenced (all 28 placements use Fantasy Props MegaKit names)
- Zero circle-specific Meshy props are referenced
- No cobwebs placed anywhere (Crypt should have them)
- No bone scatter in Bone Pit (only Chain_Coil and Barrel)
- No sarcophagus in Crypt (thematically essential)
- No inscription tablet in Vestibule (narrative beat #1 needs it)
- No iron gate at any door/connection

### Room-by-Room Walkthrough

#### Room: Vestibule (8x6, exploration, sortOrder=0)

**First-Timer:** I spawn facing south. I see two wall torches providing warm orange light against cold stone. There is a scroll on the floor and two vases near the south exit. The room is small and safe -- no enemies. The torchlight draws me toward the exit. But the room feels *empty*. An 8x6 room with only 5 props (2 torches, 1 scroll, 2 vases) means most of the floor is bare stone. I do not feel like I have entered a significant place. The Dante inscription (narrative beat #1) is on a Scroll_2 placed on the floor -- not on a lectern or tablet, which undercuts the gravity of "Abandon all hope."

**Speedrunner:** Fine. Small room, one exit south, nothing blocking my path. I can cross it in under 2 seconds. No props in the movement line. Good.

**Explorer:** Disappointing. Four walls, five props. Nothing rewards close inspection. The vases are near the exit, not in corners. There is no visual storytelling -- no crumbled architecture, no moss, no cobwebs suggesting age. For the literal entrance to Hell, this room should have more presence.

**Verdict:** NEEDS WORK

**Recommendations:**
1. Replace Scroll_2 with `limbo-inscription-tablet` or `limbo-stone-lectern` + `prop-book-open` -- the gate inscription deserves a hero prop
2. Add `prop-cobweb` or `prop-cobweb2` in corners (2 placements)
3. Add `prop-rock1` or `prop-rock2` as rubble near walls (2 placements)
4. Add `limbo-cracked-floor-slab` to hint at decay underfoot
5. Replace Torch_Metal with `prop-torch-mounted` (actual GLB)
6. Replace Vase_Rubble with `prop-broken-pot` (actual GLB)

---

#### Room: Fog Hall (12x10, exploration, sortOrder=1)

**First-Timer:** The fog closes in. I can barely see. Two torches on the walls provide the only reference points. I hear enemies but cannot see them (3 hellgoats on patrol). Two cages on the floor and three vases are scattered about. The cages are ominous -- good environmental storytelling ("something was kept here"). But the room is 12x10 = 120 cells and has only 7 props. In dense fog, I might not even notice the cages. The room communicates "empty void in fog" which may be intentional but could also read as "unfinished."

**Speedrunner:** The 12x10 space is open enough to circle-strafe the 3 hellgoats easily. No structural props block movement. The two torches mark the walls, and I can use them for orientation in the fog. No obstructions. Too easy to kite enemies in open space -- columns or pillar props would create more interesting movement.

**Explorer:** Three exits (south to Columns, west to Bone Pit, east-secret to Crypt) but no visual cues distinguishing them. The cages are the most interesting objects. There are no bones, no rubble, no wall details. The fog does most of the atmospheric work, but without props to silhouette against, the fog has nothing to hide or reveal.

**Verdict:** NEEDS WORK

**Recommendations:**
1. Add 2-3 `prop-column` or `limbo-ancient-pillar` placements to break sightlines and create fog silhouettes
2. Add `prop-bones` scatter (2-3 placements) for floor detail
3. Add `limbo-tombstone` (1-2) to give the explorer something to discover in the fog
4. Add `prop-cobweb` or `limbo-cobweb-cluster` in one corner
5. Replace Cage_Small with `limbo-cage` (actual asset)
6. Replace Torch_Metal with `prop-torch-mounted` or `fog-lantern`

---

#### Room: Crypt (6x6, secret, sortOrder=2)

**First-Timer:** I found the secret! I enter through a hidden wall and see... one torch and a bookstand. The room is 6x6 = 36 cells with 2 props. The shotgun pickup is the real reward, but the environment does not frame it. There is no visual ceremony for finding the first weapon upgrade. The design doc calls for "moss on walls" but no moss prop is placed.

**Speedrunner:** Quick detour. Grab shotgun, grab ammo, leave. The room is small enough that I cannot miss anything. Fine.

**Explorer:** This is deeply unsatisfying as a secret room. Secret rooms should feel like a hidden treasure trove. Two props in 36 cells is barren. Where is the sarcophagus? The moss? The cobwebs suggesting this room has been sealed for centuries? The bookstand holding the scroll is a nice touch but needs a better prop (a lectern, a pedestal).

**Verdict:** EMPTY

**Recommendations:**
1. Add `limbo-sarcophagus` as the room's hero piece (center or against a wall)
2. Add `limbo-moss-growth` on 1-2 walls
3. Add `prop-cobweb` in corners (2 placements)
4. Add `prop-pedestal` or `limbo-stone-lectern` to hold the weapon pickup
5. Replace BookStand with `prop-book-open` on a `prop-pedestal`
6. Add `prop-skull` or `prop-rpg-skull` on the floor near sarcophagus
7. Add `limbo-cobweb-cluster` across the entrance to signal "undisturbed for ages"

---

#### Room: Bone Pit (8x8, platforming, sortOrder=3)

**First-Timer:** An optional side room. I enter and see three chains hanging from the ceiling and a barrel. The "bone pit" name promises bones, but there are none -- just chains and a barrel. The ambush trigger spawns 3 hellgoats when I enter the lower section. The chains provide good vertical visual, but the floor is empty. I expected a pit full of bones.

**Speedrunner:** Skip this room entirely. It is optional and the rewards (2 ammo + 1 health) are not worth the 3-enemy ambush. If I do enter, the 8x8 open space lets me kite easily.

**Explorer:** The chains are atmospheric but the room name overpromises. Where are the bones? The design doc says "bones scattered" but the build script places zero bone props. The barrel near the pickups is a nice visual marker. The wind zone (subtle updraft) is a nice touch but invisible without particle effects.

**Verdict:** NEEDS WORK

**Recommendations:**
1. Add `prop-bones`, `prop-bones2`, `prop-bone` scatter (4-6 placements) -- this is the *Bone Pit*
2. Add `prop-skull` or `prop-rpg-skull` (2-3 placements)
3. Add `limbo-bone-pile` as a larger cluster (1 placement, center)
4. Add `prop-spikes` or `prop-trap-spikes` near edges to reinforce the "pit" danger
5. Consider adding `limbo-iron-gate` at the entrance to make the optional branch feel more discovered

---

#### Room: Columns (10x12, arena, sortOrder=4)

**First-Timer:** This is the arena encounter. 6 stone columns in a 2x3 grid break the space. Two torches on opposite walls. The columns create cover and sightlines for the 2-wave fight. The room feels functional. When the fog lifts after clearing wave 2, I can see the descent ahead -- a good narrative beat.

**Speedrunner:** The columns create interesting movement. I can weave between them to break enemy LOS. The 2x3 grid means I always have a column within 2-3 cells for cover. Wave 1 spawns from edges, wave 2 from corners -- I need to re-orient. Good arena design. Column placement is the best prop usage in Circle 1.

**Explorer:** The columns are the first structural props that genuinely change how the room plays. But beyond the columns and 2 torches, the room is bare. No rubble at column bases, no banners on walls, no floor detail. The 120-cell room has 8 props (6 columns + 2 torches). After the fog lifts, the stark emptiness is even more noticeable.

**Verdict:** GOOD (mechanically), NEEDS WORK (decoration)

**Recommendations:**
1. Add `prop-column-broken` or `prop-column-broken2` (1-2 placements) near the intact columns -- suggests age and battle damage
2. Add `prop-rock1`/`prop-rock2` rubble at column bases (2-3 placements)
3. Add `prop-banner-wall` or `limbo-banner-tattered` on N and S walls (2 placements)
4. Replace Column_Stone with `prop-column` (actual Quaternius GLB)

---

#### Room: Il Vecchio's Chamber (12x12, boss, sortOrder=5)

**First-Timer:** I descend stairs into a larger, darker room. Three torches provide backlighting: two at the entrance framing my entry, one behind the boss creating a silhouette. Two banners flank the far wall. Il Vecchio stands center. The boss intro dialogue plays. At 50% HP, fog surges to near-blindness (0.12 density). The room is 144 cells with 5 props (3 torches + 2 banners). The backlighting silhouette is a strong visual beat, but the floor is completely empty -- no rubble, no debris, no ritual markings. For the first boss encounter, this needs more ceremony.

**Speedrunner:** The 12x12 room is wide open. No cover. No structural props. I can kite Il Vecchio in circles endlessly. The fog surge at 50% HP is the only wrinkle -- it limits my visibility. Ammo and health are symmetrically placed in corners. Simple to navigate, just circle and shoot.

**Explorer:** The banners behind the boss are a nice touch but there is nothing else to see. No throne for the "ancient patriarch gatekeeper." No ritual circle. No inscription. The four corner pickups are functional but the room lacks grandeur. The first boss fight in the game should feel like entering a cathedral or a throne room, not an empty basement with torches.

**Verdict:** NEEDS WORK

**Recommendations:**
1. Add `limbo-broken-altar` or `prop-altar` at room center (behind boss spawn) as a hero piece
2. Add `prop-column` or `limbo-ancient-pillar` at 4 corners or flanking the entrance (structural cover + grandeur)
3. Add `limbo-inscription-tablet` near entrance (more lore)
4. Add `prop-skull` or `limbo-tombstone` near walls (2-4 placements)
5. Add `prop-candelabrum-tall` flanking the altar (2 placements)
6. Replace Banner_1 with `prop-banner-wall` or `limbo-banner-tattered` (actual GLBs)

---

### Circle 1 Gap Analysis

**Over-dressed rooms:** None. Every room is under-dressed.

**Under-dressed rooms:**
- Crypt (2 props in 36 cells = 0.06 props/cell) -- CRITICAL
- Vestibule (5 props in 48 cells = 0.10 props/cell)
- Boss Chamber (5 props in 144 cells = 0.03 props/cell) -- CRITICAL
- Bone Pit (4 props in 64 cells = 0.06 props/cell)
- Fog Hall (7 props in 120 cells = 0.06 props/cell)

**Missing asset types:**
- Bones and skulls (zero placed, yet "Bone Pit" is a room name)
- Cobwebs (zero placed, Crypt and Fog Hall need them)
- Rubble/rocks (zero placed, every room could use floor debris)
- Sarcophagus (zero placed, Crypt demands one)
- Inscription/lectern (zero placed, Dante's gate inscription has no proper display)
- Structural broken elements (no broken columns despite aged theme)

**Redundant assets to cut (from circle-specific Meshy set):**
- limbo-bone-pile, limbo-cobweb-cluster, limbo-vase-rubble, limbo-torch-bracket, limbo-wall-sconce, limbo-banner-tattered, limbo-fallen-column (7 props) -- all have Quaternius equivalents

**Balance issues:**
- Enemy density is appropriate (sparse, deliberate, matches 0.8 enemyDensity)
- Prop density is far too low to sell the "ancient ruins" atmosphere
- Boss room has zero cover -- trivial to kite; needs 2-4 pillars or column props for partial cover
- Bone Pit lacks bones -- the primary visual promise of the room is undelivered

---

## Circle 2: Lust

### Asset Audit

**Build script uses (prop names in `spawnProp` calls):**
- CandleStick_Triple (x22 -- Antechamber x4, Wind Corridor x2, Gallery x4, Siren Pit x2, Tempest Hall x4, Boudoir x4, Sanctum x4)
- Vase_2 (x4 -- Antechamber x2, Boudoir x2)
- Banner_1 (x9 -- Antechamber x1, Gallery x4, Tempest Hall x2, Sanctum x2)
- Banner_2 (x4 -- Wind Corridor)
- Column_Onyx (x12 -- Gallery x8, Sanctum x4)
- Chair_1 (x2 -- Gallery)
- Chalice (x3 -- Gallery x2, Boudoir x1)
- Vase_4 (x2 -- Gallery)
- Chain_Coil (x3 -- Siren Pit)
- Chandelier (x4 -- Siren Pit x1, Boudoir x1, Sanctum x2)
- Barrel (x2 -- Tempest Hall)
- Bed_Twin1 (x1 -- Boudoir)
- Table_Large (x1 -- Boudoir)
- Scroll_1 (x1 -- Boudoir)
- Chest_Wood (x1 -- Sanctum, used as throne)

**Total: 15 unique prop types, ~71 placements**

**Quaternius props applicable to Lust's theme (warm marble, luxury, wind, lava):**
- prop-candelabrum-tall, prop-candle-multi, prop-candles (luxury lighting)
- prop-column (marble columns -- though Column_Onyx is more specific)
- prop-banner, prop-banner-wall (fabric/draping)
- prop-chalice (direct match)
- prop-chair (direct match for Chair_1)
- prop-barrel (direct match)
- prop-table, prop-table-small (furniture)
- prop-chest (could serve as throne)
- prop-carpet (floor luxury)
- prop-vase (decoration)
- prop-firebasket (lava-adjacent warmth)
- prop-crystal, prop-crystal2 (luxury accents)
- prop-bowl (tableware)

**Circle 2 Meshy props (22 available, none used in build script):**
lust-bridge-railing, lust-candelabra, lust-chandelier, lust-coffered-ceiling-tile, lust-cracked-statue, lust-ember-brazier, lust-fallen-chair, lust-gilded-pillar, lust-golden-chalice, lust-lava-rock-border, lust-marble-throne, lust-marble-vase, lust-onyx-column, lust-ornate-arch, lust-ornate-bed-wrecked, lust-perfume-censer, lust-rose-thorn-cluster, lust-shattered-goblet, lust-velvet-drape, lust-wind-banner, ornate-mirror, silk-curtain

**Redundancies (circle-specific Meshy props that duplicate Quaternius):**
| Circle-specific prop | Quaternius equivalent | Recommendation |
|---|---|---|
| lust-candelabra | prop-candelabrum-tall | Use Quaternius; save Meshy credit |
| lust-golden-chalice | prop-chalice | Use Quaternius (close enough) |
| lust-marble-vase | prop-vase | Use Quaternius; save Meshy credit |
| lust-fallen-chair | prop-chair | Use Quaternius; save Meshy credit |
| lust-onyx-column | prop-column | Keep circle-specific (onyx texture matters) |
| lust-chandelier | prop-candelabrum-tall (not exact) | Keep circle-specific (chandelier is distinct) |

**5 of 22 are redundant.** The remaining 17 are genuinely unique: lust-bridge-railing, lust-coffered-ceiling-tile, lust-cracked-statue, lust-ember-brazier, lust-gilded-pillar, lust-lava-rock-border, lust-marble-throne, lust-ornate-arch, lust-ornate-bed-wrecked, lust-perfume-censer, lust-rose-thorn-cluster, lust-shattered-goblet, lust-velvet-drape, lust-wind-banner, ornate-mirror, silk-curtain, lust-chandelier.

**Missing from build script:**
- Zero Quaternius props referenced
- Zero circle-specific Meshy props referenced
- lust-marble-throne exists but Chest_Wood is used as throne stand-in
- lust-ornate-arch exists but no arches placed at any doorway
- lust-lava-rock-border exists but lava channels have no border props
- lust-velvet-drape and silk-curtain exist but no fabric draping placed
- lust-ember-brazier exists but no braziers near lava zones
- lust-cracked-statue exists but no statues placed anywhere
- lust-perfume-censer exists but not placed (atmospheric prop for Gallery/Boudoir)
- ornate-mirror exists but not placed in Boudoir (thematically perfect)

### Room-by-Room Walkthrough

#### Room: Antechamber (8x6, exploration, sortOrder=0)

**First-Timer:** I enter from Circle 1's descent. Warm amber light from 4 candlesticks on the walls -- immediately different from Limbo's cold blue. Two elegant vases and a banner over the entrance. The room communicates "luxury" clearly. A raised step at the south hints at elevation changes. 7 props in 48 cells (0.15 props/cell) -- better than any Limbo room.

**Speedrunner:** Small room, one exit south. No obstacles. Quick transition. The raised step is a minor speed bump.

**Explorer:** The vases and banner reward a glance but there is nothing to discover. No mirror, no perfume censer, no cracked statue suggesting past glory. The room is pleasant but not rich.

**Verdict:** GOOD

**Recommendations:**
1. Add `lust-perfume-censer` or `lust-ember-brazier` (1 placement) for atmosphere
2. Add `prop-carpet` on the floor between entrance and exit (luxury underfoot)
3. Replace CandleStick_Triple with `lust-candelabra` or `prop-candelabrum-tall`

---

#### Room: Wind Corridor (5x16, gauntlet, sortOrder=1)

**First-Timer:** Narrow. Lava on both sides (1 cell each). Wind pushes me east toward the lava. Banners on the west wall snap taut, showing wind direction -- excellent environmental communication. Two candle lights on the east wall. No enemies -- pure mechanic tutorial. The corridor is 80 cells with 6 props (0.075 props/cell), but the narrowness makes it feel adequately dressed. The lava glow provides ambient light and danger cues.

**Speedrunner:** 16 cells long, 3 cells of safe walkway. Wind pulses 3s on / 2s off. I can sprint through during lulls. The corridor is purely linear -- no branching, no skip opportunity. Fine as a tutorial gate.

**Explorer:** Nothing to find here -- it is a gauntlet, not an exploration space. The banners are the only interesting visual. The corridor could use lava-rock borders or bridge railings to break the visual monotony of 16 cells of the same pattern.

**Verdict:** GOOD (functional)

**Recommendations:**
1. Add `lust-lava-rock-border` along lava channel edges (2-4 placements) -- visual interest and danger framing
2. Add `lust-wind-banner` (replace or supplement Banner_2 with actual asset)

---

#### Room: Lover's Gallery (14x10, exploration+combat, sortOrder=2)

**First-Timer:** This is where Lust becomes real. 8 onyx columns create a grand colonnade. Banners hang between them. Candles in corners. Chairs and chalices scattered among the columns suggest a ruined feast or gathering. Wind pushes east toward lava on the east wall. fireGoats (first ranged enemies) shoot from behind columns. The space is dense with geometry and prop placement -- 22 props in 140 cells (0.16 props/cell). I use columns for cover against both projectiles and wind. Strong room.

**Speedrunner:** The 2 rows of 4 columns create excellent weaving corridors. I can break LOS with every column while maintaining forward momentum. The wind toward the east wall adds risk to the east-side route. Multiple valid paths through the room. Best combat space in Act 1 so far.

**Explorer:** The chairs and chalices tell a story of interrupted revelry. The vases provide floor detail. The secret exit to the Boudoir is on the west wall -- the design doc mentions a visual tell (draft, discoloration, candle flicker) but no prop marks it. A placed prop near the secret would reward observant players.

**Verdict:** GOOD

**Recommendations:**
1. Add `lust-cracked-statue` near the secret wall entrance (visual tell for explorers)
2. Add `lust-rose-thorn-cluster` (1-2) in corners (thematic: beauty with thorns)
3. Add `lust-shattered-goblet` near chairs (more scattered debauchery)
4. Replace Column_Onyx with `lust-onyx-column` (actual circle-specific asset)

---

#### Room: Siren Pit (12x12, platforming, sortOrder=4)

**First-Timer:** Vertigo. I look down and see a spiral ramp descending around a lava core. Chains hang from the ceiling over the pit. A chandelier illuminates the center. Enemies fire from different elevations. The wind pulls me inward and down. This is the signature moment of Circle 2 -- the vertical descent into danger. 6 props in 144 cells (0.04 props/cell) but the geometry of the ramp itself carries the visual weight.

**Speedrunner:** The spiral ramp forces commitment -- I cannot skip sections. The inward wind pull means I must fight it on every step. The ramp width (3 cells) leaves room to dodge projectiles but not much. Falling off means lava. Tense, skill-testing traversal. Good pacing break from the flat Gallery.

**Explorer:** The chains and chandelier are well-placed but the ramp itself is bare. No railings, no edge detail, no visual markers for elevation changes. The design doc mentions "2 CandleStick_Triple on walls" and "3 Chain_Coil over lava" but no props mark the ramp segments or ledge niches where enemies stand.

**Verdict:** GOOD (mechanically), NEEDS WORK (ramp dressing)

**Recommendations:**
1. Add `lust-bridge-railing` along the ramp's outer edge (3-4 placements) -- visual safety and spatial reference
2. Add `lust-ember-brazier` on each ramp segment (4 placements) -- light marking elevation changes
3. Add `prop-firebasket` near enemy ledge niches (2 placements)

---

#### Room: Tempest Hall (14x12, arena, sortOrder=5)

**First-Timer:** The arena. Three lava channels run north-south, crossed by bridges. Wind shifts direction every 8 seconds. Candle lights in corners, banners on N/S walls, barrels on raised platforms marking safe zones. The lava channels and bridges create forced pathing. 8 props in 168 cells (0.05 props/cell) -- sparse, but the lava geometry does the heavy lifting.

**Speedrunner:** Bridge positioning is key. Wind shift timing determines which bridges are safe. The raised platforms at east/west edges are refuge points -- the barrels visually mark them. During wave 2 (mixed fireGoat + hellgoat), I need to be on bridges or platforms, not in lava lanes. The third bridge at lower elevation (-1.5) is a high-risk shortcut. Good risk/reward.

**Explorer:** The barrels on platforms are the only non-lighting props. The room is functional but visually repetitive -- lava channel, bridge, lava channel, bridge. No rubble, no statues, no ceremony. For the room just before the boss, it should escalate the visual grandeur.

**Verdict:** GOOD (mechanically), NEEDS WORK (decoration)

**Recommendations:**
1. Add `lust-gilded-pillar` or `lust-ornate-arch` at the bridge entrances (4-6 placements) -- frame the crossing points
2. Add `lust-cracked-statue` on raised platforms (2 placements) -- hero pieces
3. Add `lust-lava-rock-border` along channel edges (4-6 placements)

---

#### Room: Boudoir (6x6, secret, sortOrder=3)

**First-Timer:** The secret room. Hidden luxury. Chandelier overhead, candles in corners, a bed, a table with a scroll, a chalice, two vases flanking the bed. 11 props in 36 cells (0.31 props/cell) -- the densest room in Act 1. It feels intimate, safe, rewarding. Health and ammo pickups. No enemies. No wind. A genuine breath of calm.

**Speedrunner:** Quick grab-and-go. Small room, easy to sweep. 3 pickups (1 health, 2 ammo). Worth the detour.

**Explorer:** This is the best-dressed room in Act 1. The bed, table, scroll, and chalice create a lived-in space. The vases add elegance. The chandelier overhead provides warm light. The only missing element: an `ornate-mirror` prop (which exists in the Meshy set and is thematically perfect for a Lust-circle boudoir). A silk curtain or velvet drape would complete the intimacy.

**Verdict:** GOOD

**Recommendations:**
1. Add `ornate-mirror` on one wall (perfect thematic fit)
2. Add `silk-curtain` or `lust-velvet-drape` flanking the entrance (1-2 placements)
3. Replace Bed_Twin1, Table_Large, Scroll_1 with actual asset names

---

#### Room: Caprone's Sanctum (14x14, boss, sortOrder=6)

**First-Timer:** Grand doorway from Tempest Hall (width 4). Candles in corners, chandeliers flanking the throne dais, banners on the north wall. 4 onyx columns mark the dais corners. A Chest_Wood stands in as the throne. Lava channels in the southern half. The wind pulls me north toward the boss. The room is 196 cells with 13 props (0.07 props/cell). The backlighting from candles and the chandelier pair create drama. The throne-shattering phase 2 moment is strong. But the south half (lava channels + bridge area) is barren.

**Speedrunner:** Phase 1: strafe laterally against northward pull. Phase 2: use dais columns for cover, adapt to rotating wind. Phase 3: lava widens, bridge collapses -- limited safe floor. The 4 corner columns are the only cover. More structural props would create better movement options.

**Explorer:** The throne dais with onyx columns is a good set piece. The chandeliers provide dramatic overhead light. But the south half of the room -- where most of the combat happens in phases 2-3 -- has only lava channels and a bridge. No debris, no fallen masonry, no ritual markings. The room should feel like a defiled temple, not a warehouse with lava gutters.

**Verdict:** NEEDS WORK

**Recommendations:**
1. Replace Chest_Wood with `lust-marble-throne` (the actual asset exists and is essential)
2. Add `lust-ornate-arch` flanking the grand doorway entrance (2 placements)
3. Add `lust-cracked-statue` in the south half (2 placements) -- debris from the temple's glory days
4. Add `prop-carpet` on the dais (luxury floor dressing)
5. Add `lust-ember-brazier` flanking the throne (2 placements) -- backlight enhancement
6. Replace Column_Onyx with `lust-onyx-column` (actual asset)

---

### Circle 2 Gap Analysis

**Over-dressed rooms:** Boudoir is at the density ceiling (0.31 props/cell) but earns it as a secret reward room.

**Under-dressed rooms:**
- Siren Pit (6 props in 144 cells = 0.04 props/cell) -- ramp needs edge detail
- Tempest Hall (8 props in 168 cells = 0.05 props/cell) -- needs grandeur before boss
- Caprone's Sanctum south half (sparse below the dais)

**Missing asset types:**
- Marble throne (lust-marble-throne exists, not used)
- Ornate arches (lust-ornate-arch exists, not used at any doorway)
- Lava rock borders (lust-lava-rock-border exists, not framing any lava)
- Velvet drapes / silk curtains (exist, not placed)
- Statues (lust-cracked-statue exists, not placed)
- Mirrors (ornate-mirror exists, not placed)
- Bridge railings (lust-bridge-railing exists, not used on bridges or ramps)
- Perfume censers (lust-perfume-censer exists, not placed)
- Rose thorns (lust-rose-thorn-cluster exists, not placed)

**Redundant assets to cut:**
- lust-candelabra (use prop-candelabrum-tall), lust-golden-chalice (use prop-chalice), lust-marble-vase (use prop-vase), lust-fallen-chair (use prop-chair) -- 4 props

**Balance issues:**
- Enemy density is appropriate (15 + boss, two types)
- Wind mechanic evolves well: pulsing (Corridor) -> steady (Gallery) -> inward (Pit) -> shifting (Hall) -> rotating (Boss)
- Lava channels provide good spatial danger but lack visual framing props (borders, railings)
- Sanctum needs lust-marble-throne desperately -- Chest_Wood is a placeholder

---

## Circle 3: Gluttony

### Asset Audit

**Build script uses (prop names in `spawnProp` calls):**
- Lantern_Wall (x24 -- Gullet x4, Feast Hall x4, Larder x4, Bile Cistern x4, Gut Arena x4, Pantry x4, Vorago's Maw x4)
- Bucket_Wooden (x8 -- Gullet x2, Bile Cistern x3, Gut Arena x4 [wait -- actually Gut Arena has 4 + 2 cauldrons, see below])
- Rope_1 (x4 -- Gullet x1, Larder x3)
- Chandelier (x1 -- Feast Hall)
- Table_Large (x1 -- Feast Hall)
- Table_Plate (x4 -- Feast Hall)
- Table_Fork (x4 -- Feast Hall)
- Table_Knife (x4 -- Feast Hall)
- Table_Spoon (x4 -- Feast Hall)
- Cauldron (x8 -- Feast Hall x2, Bile Cistern x2, Gut Arena x2, Vorago's Maw x2)
- FarmCrate_Apple (x6 -- Feast Hall x2, Larder x4)
- Barrel_Apples (x3 -- Feast Hall)
- SmallBottles_1 (x4 -- Feast Hall)
- Mug (x6 -- Feast Hall)
- Shelf_Arch (x9 -- Larder x8, Pantry x1)
- Barrel (x11 -- Larder x6, Bile Cistern x2, Pantry x3)
- Crate_Wooden (x7 -- Larder x6, Pantry x1)
- Rope_2 (x2 -- Larder)
- Rope_3 (x1 -- Larder)
- SmallBottle (x4 -- Larder)
- Scroll_2 (x1 -- Pantry)
- Chain_Coil (x2 -- Vorago's Maw)
- Bucket_Wooden (x1 -- Vorago's Maw) [total across all rooms: 10]

**Total: 23 unique prop types, ~135 placements**

**Quaternius props applicable to Gluttony's theme (organic, rot, excess, acid):**
- prop-barrel (direct match, replaces Barrel)
- prop-crate (replaces Crate_Wooden)
- prop-bowl (tableware, replaces Mug concept)
- prop-chalice (goblet, adds to feast)
- prop-table, prop-table-small (replaces Table_Large)
- prop-bones, prop-bones2 (organic decay scatter)
- prop-skull, prop-rpg-skull (death imagery)
- prop-cobweb, prop-cobweb2 (rot and neglect)
- prop-broken-pot (scattered waste)
- prop-bucket (replaces Bucket_Wooden)

**Circle 3 Meshy props (22 available, none used in build script):**
bile-cauldron, feast-table, gluttony-acid-pool-edge, gluttony-bile-pool-surface, gluttony-bloated-arch, gluttony-bone-plate, gluttony-dripping-stalactite, gluttony-flesh-door-frame, gluttony-fungus-pillar, gluttony-lantern-wall-green, gluttony-maggot-mound, gluttony-meat-carcass, gluttony-mucus-web, gluttony-organic-column, gluttony-overflowing-goblet, gluttony-rope-tendril, gluttony-rotten-crate, gluttony-rotting-barrel, gluttony-shelf-arch, gluttony-slop-bucket, gluttony-stomach-wall-growth, gluttony-swollen-cask

**Redundancies (circle-specific Meshy props that duplicate Quaternius):**
| Circle-specific prop | Quaternius equivalent | Recommendation |
|---|---|---|
| gluttony-rotting-barrel | prop-barrel | Keep circle-specific (rotting texture matters for theme) |
| gluttony-rotten-crate | prop-crate | Keep circle-specific (rotting texture matters) |
| gluttony-slop-bucket | prop-bucket | Keep circle-specific (bile content matters) |
| bile-cauldron | prop-bowl (not really) | Keep circle-specific (distinct) |
| feast-table | prop-table | Keep circle-specific (feast theme) |
| gluttony-shelf-arch | prop-bookcase (loosely) | Keep circle-specific (shelving is distinct) |

**Fewer redundancies here -- 0-2 at most.** The Gluttony Meshy props are mostly unique organic/horror variants that Quaternius does not cover. This is the circle where custom props matter most.

**Missing from build script:**
- Zero Quaternius props referenced
- Zero circle-specific Meshy props referenced
- gluttony-flesh-door-frame exists but no doorframes placed (every connection should have one)
- gluttony-fungus-pillar exists but no pillar/column props placed in ANY room (severe gap)
- gluttony-organic-column exists but no columns placed (Bile Cistern and Gut Arena need structural breaks)
- gluttony-dripping-stalactite exists but no stalactites placed (ceiling detail for every room)
- gluttony-maggot-mound exists but not placed (floor horror detail)
- gluttony-mucus-web exists but not placed (replaces cobwebs for organic theme)
- gluttony-meat-carcass exists but not placed (hanging meat in Larder/Feast Hall)
- gluttony-stomach-wall-growth exists but not placed (essential for Vorago's Maw)
- gluttony-acid-pool-edge exists but acid pools have no edge props
- gluttony-bile-pool-surface exists but not placed
- gluttony-bloated-arch exists but no arches at doorways
- gluttony-bone-plate exists but not placed (feast table setting)
- gluttony-overflowing-goblet exists but not placed (feast excess)

### Room-by-Room Walkthrough

#### Room: Gullet (6x14, gauntlet, sortOrder=0)

**First-Timer:** The marble is gone. The walls are meat. The corridor narrows and widens like a throat. Lanterns provide sickly green light. Buckets on the floor suggest bile. A rope hangs in the narrow section. Hellgoats wait in the wider chambers. Health pickups appear -- but some poison me. The first taste of the mechanic lands immediately. 7 props in 84 cells (0.08 props/cell) -- sparse but the narrowing geometry carries the feel.

**Speedrunner:** Linear, no branches. 3 hellgoats in predictable positions (wide sections after narrows). I can see them coming. The narrow sections funnel me but are only 3-4 cells long. Sprint through narrows, fight in wides. Simple.

**Explorer:** The buckets and rope are atmospheric but the walls themselves should do more. No stalactites dripping from the ceiling. No mucus webs. No maggot mounds on the floor. The "organic horror" relies entirely on the WALL_FLESH material texture; the props are all mundane (lanterns, buckets, rope).

**Verdict:** NEEDS WORK

**Recommendations:**
1. Add `gluttony-dripping-stalactite` in narrow sections (2 placements) -- ceiling horror
2. Add `gluttony-mucus-web` bridging the narrow sections (1-2 placements)
3. Add `gluttony-maggot-mound` in a wide section (1 placement) -- floor horror
4. Replace Lantern_Wall with `gluttony-lantern-wall-green` (actual circle asset)
5. Replace Bucket_Wooden with `gluttony-slop-bucket` (actual circle asset)

---

#### Room: Feast Hall (14x10, exploration+trap, sortOrder=1)

**First-Timer:** The feast. A massive table runs through the center, loaded with plates, cutlery, mugs, bottles, cauldrons, apple crates, apple barrels. Health pickups are everywhere -- 6 on the table, 3 of which are poisoned. The chandelier overhead makes the food look appetizing. 4 hellgoats patrol the aisles. This room nails the Gluttony theme: abundance as a trap. The prop density is very high -- 39+ props in 140 cells (0.28 props/cell).

**Speedrunner:** The table bisects the room, forcing me to go around it via the north or south aisles. The 4 hellgoats patrol these aisles. The health pickups are a trap -- I skip most of them. The table is a large obstacle I cannot cross. Two exits: secret west to Pantry, south to Larder. Grab ammo from the reliable spots (20,24 and 20,27), skip health, fight through.

**Explorer:** This is the showpiece room of Circle 3. The feast table is loaded with props telling a story of gluttonous excess. The scattered mugs and bottles on the floor suggest a party that went very wrong. The poisoned health mechanic adds a layer of paranoia to every pickup. However, all the props are Fantasy MegaKit names -- none render. If they did, this room would be spectacular. The `gluttony-overflowing-goblet`, `gluttony-bone-plate`, and `gluttony-meat-carcass` props would add even more horror to the feast.

**Verdict:** GOOD (design intent), CRITICAL (prop names do not resolve)

**Recommendations:**
1. Replace Table_Large with `feast-table` (actual circle asset)
2. Replace Barrel_Apples with `gluttony-rotting-barrel` or `prop-barrel`
3. Add `gluttony-overflowing-goblet` (2-3 placements) on/near table
4. Add `gluttony-bone-plate` replacing some Table_Plate instances
5. Add `gluttony-meat-carcass` hanging near the table (1 placement)
6. Consider reducing total cutlery placements from 12 to 8 (performance)
7. Replace Chandelier with `lust-chandelier` or a general Meshy chandelier (name resolution)

---

#### Room: Larder (10x12, platforming, sortOrder=3)

**First-Timer:** Vertical descent through shelving. 5 platform levels. Shelves line the walls stacked with barrels, crates, and apple crates. Ropes hang between levels marking safe landing zones. Enemies fire across the vertical gap. Small bottles roll on shelves. Lanterns light each level. This room has 45+ props in 120 cells (0.38 props/cell) -- the densest room in the entire act. The shelving creates a storeroom feel. The descent is tense. But props might block platforming -- barrels and crates near platform edges could interfere with jump landing.

**Speedrunner:** Drops are one-way. I need to land each platform cleanly. The Barrel and Crate_Wooden props on shelves could clip my landing zone. Rope_1/2/3 are visual markers, not obstacles. The fireGoats at different elevations force me to fight while descending. Tight, skill-testing. My concern: if barrel collision boxes are active, they could block platform landings.

**Explorer:** Visually rich. The shelving, stacked goods, ropes, and small bottles create a convincing larder. The FarmCrate_Apple overflowing on shelves reinforces gluttony's excess. Each platform level has distinct prop arrangements. This room rewards looking around at each level before dropping to the next.

**Verdict:** GOOD (best-dressed room in Act 1)

**Recommendations:**
1. Verify barrel/crate collision boxes do not interfere with platforming landings
2. Replace Shelf_Arch with `gluttony-shelf-arch` (actual circle asset)
3. Replace Barrel with `gluttony-rotting-barrel` (theme consistency)
4. Replace Crate_Wooden with `gluttony-rotten-crate` (theme consistency)
5. Add `gluttony-dripping-stalactite` at ceiling between levels (2 placements)
6. Add `gluttony-meat-carcass` hanging from a shelf hook (1 placement, visual horror)

---

#### Room: Bile Cistern (12x10, flooded, sortOrder=4)

**First-Timer:** The entire floor is acid. Raised stone walkways form a grid above it. I can see the acid glowing green below. Enemies stand on different walkway segments. Dead-end walkways hold tempting health pickups that are guaranteed poison -- lures. Lanterns in corners, buckets tipped on walkways, barrels at intersections, cauldrons bubbling near acid. 11 props in 120 cells (0.09 props/cell) -- moderate.

**Speedrunner:** I need to identify the main path (south wall walkway) and stick to it. Dead-end walkways are traps. The crisscross grid creates some route choice. 3 fireGoats on walkways require me to clear sightlines. The walkways are 2 cells wide -- enough to dodge but not to strafe comfortably. Tight movement.

**Explorer:** The dead-end lure mechanic is brilliant game design. The poison pickups on dead-end walkways punish greed -- perfectly on-theme. But the walkways themselves are visually monotone -- stone paths over acid, same texture everywhere. No organic growths on the walkway edges, no acid-pool edge props, no stalactites dripping into the acid.

**Verdict:** GOOD (mechanically), NEEDS WORK (visual variety)

**Recommendations:**
1. Add `gluttony-acid-pool-edge` along walkway edges (4-6 placements) -- frame the acid
2. Add `gluttony-bile-pool-surface` in the acid (2-3 placements) -- surface detail
3. Add `gluttony-dripping-stalactite` from ceiling over acid (2 placements)
4. Add `gluttony-fungus-pillar` on one walkway intersection (1 placement) -- structural hero piece
5. Replace Cauldron with `bile-cauldron` (actual circle asset)

---

#### Room: Gut Arena (12x12, arena, sortOrder=5)

**First-Timer:** Concentric rings separated by acid channels. Bridges at N/S/E/W connect the rings. The inner ring shrinks after wave 1 (acid rises). Lanterns on walls, buckets on outer ring, cauldrons on middle ring bridges. The ring geometry is strong but the props are sparse -- 10 props in 144 cells (0.07 props/cell). The room reads as "acid puzzle arena" which is correct but could be more visually threatening.

**Speedrunner:** Bridge positioning is critical. The 4 bridges are my transit points between rings. Wave 1 on outer+middle, wave 2 with inner ring gone. I need to be on middle or outer ring when acid rises. Bridge crossings are 2 cells wide -- safe enough. The ring layout creates circular chase routes, good for kiting.

**Explorer:** The concentric ring pattern is visually interesting from above but at ground level, I see flat walkways and acid channels. No columns, no pillars, no structural breaks. The cauldrons on bridges are the only notable props. The room needs something to look UP at -- the ceiling and walls are unaddressed.

**Verdict:** NEEDS WORK

**Recommendations:**
1. Add `gluttony-organic-column` at the 4 bridge entry points on the outer ring (4 placements) -- frame the bridges
2. Add `gluttony-fungus-pillar` on the middle ring (2 placements) -- break sightlines, add cover
3. Add `gluttony-dripping-stalactite` from ceiling (2-3 placements) -- vertical detail
4. Add `gluttony-stomach-wall-growth` on walls (2 placements) -- foreshadow the boss room

---

#### Room: Pantry (6x6, secret, sortOrder=2)

**First-Timer:** Secret room. Clean stone walls -- relief from the organic horror. Lanterns in corners. Barrels, a shelf with a scroll, a supply crate. Guaranteed non-poisoned health pickups. Safe. 10 props in 36 cells (0.28 props/cell) -- well-dressed.

**Speedrunner:** Quick detour. Grab the guaranteed-safe health and ammo. The Pantry's main value is trust: in a circle where everything might poison you, this room guarantees safety.

**Explorer:** The contrast between organic meat-walls outside and clean stone inside is effective. The scroll on the shelf delivers lore. The barrels and crate suggest preserved supplies. However, the room could use one more detail -- a locked chest, a special prop that marks it as truly hidden and valuable.

**Verdict:** GOOD

**Recommendations:**
1. Add `prop-chest` or `prop-chest-gold` as a hero piece (1 placement)
2. Replace Scroll_2 with `prop-book-open` on the shelf
3. Replace Barrel with `prop-barrel` (Quaternius, matches clean stone theme better than rotting)

---

#### Room: Vorago's Maw (14x14, boss, sortOrder=6)

**First-Timer:** I descend into a stomach. Curved organic walls. The entire floor is acid except for an entry ledge and a central platform. Vorago crouches on the platform. Lanterns on walls pulse pink-red. Cauldrons flank the entrance. Chains hang from the ceiling like tendons. A tipped bucket on the platform. 9 props in 196 cells (0.05 props/cell) -- the sparsest boss room in Act 1. The acid floor and platform geometry carry the visual, but the walls are undressed.

**Speedrunner:** Phase 1: stay on central platform, dodge acid pools. Phase 2: platform fragments -- jump between chunks, ride the bob pattern. Phase 3: wind pull toward boss's mouth, shoot the crit zone. The entry ledge provides a fallback position. Pickup platforms at edges require acid traversal. Tight and punishing. Good boss design.

**Explorer:** The chains-as-tendons concept is strong but only 2 are placed. The walls should be covered in `gluttony-stomach-wall-growth`. The ceiling should drip stalactites. The entry ledge has cauldrons but no organic horror. This is supposed to be the inside of a stomach -- it should be the most viscerally disgusting room in the game so far. Currently it reads as "acid room with some chains."

**Verdict:** NEEDS WORK

**Recommendations:**
1. Add `gluttony-stomach-wall-growth` extensively (4-6 placements on walls) -- this is the stomach
2. Add `gluttony-dripping-stalactite` from ceiling (3-4 placements)
3. Add `gluttony-mucus-web` bridging walls to central platform (2 placements)
4. Add `gluttony-flesh-door-frame` at the entrance (1 placement) -- you are entering the body
5. Add `gluttony-maggot-mound` on the entry ledge (1 placement) -- floor horror
6. Add `gluttony-organic-column` on the central platform edges (2-4 placements) -- structural/cover
7. Increase Chain_Coil/tendril count from 2 to 4-6

---

### Circle 3 Gap Analysis

**Over-dressed rooms:**
- Feast Hall (39+ props, 0.28 props/cell) -- borderline, but thematically justified
- Larder (45+ props, 0.38 props/cell) -- highest density in Act 1, verify performance

**Under-dressed rooms:**
- Vorago's Maw (9 props in 196 cells = 0.05 props/cell) -- CRITICAL for a boss room
- Gullet (7 props in 84 cells = 0.08 props/cell)
- Gut Arena (10 props in 144 cells = 0.07 props/cell)

**Missing asset types:**
- Organic structural elements (gluttony-fungus-pillar, gluttony-organic-column -- zero placed in ANY room)
- Ceiling detail (gluttony-dripping-stalactite -- zero placed)
- Wall growths (gluttony-stomach-wall-growth -- zero placed, critical for Vorago's Maw)
- Horror scatter (gluttony-maggot-mound, gluttony-mucus-web -- zero placed)
- Doorframes (gluttony-flesh-door-frame, gluttony-bloated-arch -- zero placed)
- Acid pool edges (gluttony-acid-pool-edge -- zero placed despite 3 acid rooms)
- Meat carcasses (gluttony-meat-carcass -- zero placed despite a Feast Hall and Larder)

**Redundant assets to cut:**
- Very few. Gluttony's Meshy props are largely unique and essential. At most, `gluttony-slop-bucket` could be replaced by `prop-bucket` if budget is tight.

**Balance issues:**
- Enemy density is appropriate (15 + boss, mixed types, green variant)
- Poisoned pickup mechanic is well-distributed (Gullet introduces, Feast Hall showcases, Bile Cistern weaponizes, Boss room maintains)
- The Feast Hall may have too many individual small prop instances (12 cutlery pieces) that could strain rendering; consider reducing or using instancing
- Vorago's Maw needs significantly more dressing to sell the "stomach" fantasy
- No structural cover in Gut Arena or Vorago's Maw -- both need columns/pillars

---

## Cross-Circle Analysis

### Palette Transitions

**Circle 1 -> Circle 2:** Strong. Cold blue-gray stone (fog, torches) to warm amber marble (candles, lava). The shift in ambient color (#2233aa -> #cc8844), fog color (#0d0d1a -> #2e1a1a), and material palette is dramatic and immediate. The Antechamber's warm marble after Limbo's cold stone is an effective sensory reset.

**Circle 2 -> Circle 3:** Strong. Warm marble to sickly green organic flesh. The ambient color shift (#cc8844 -> #88aa44), the introduction of WALL_FLESH, and the acid-green lighting create an entirely different atmosphere. The Gullet's narrowing throat geometry reinforces the transition -- you are being swallowed.

**Overall:** The palette transitions are Act 1's strongest design element. Each circle is visually distinct at a glance.

### Difficulty Ramp

| Metric | Circle 1 | Circle 2 | Circle 3 |
|---|---|---|---|
| Rooms | 6 | 7 | 7 |
| Enemies (non-boss) | 12 | 15 | 15 |
| Enemy types | 1 (hellgoat) | 2 (hellgoat + fireGoat) | 2 (hellgoat + fireGoat) |
| Primary mechanic | Fog (perception) | Wind + Lava (physics) | Poison + Acid (trust) |
| Vertical range | Flat (0 to -1) | 0 to -2 (Siren Pit) | 0 to -2 (Larder) |
| Arena waves | 2 | 2 | 2 |
| Boss phases | 2 (fog surge) | 3 (wind rotation, lava rise) | 3 (platform fragment, inhale) |
| Prop density | Low | Medium | Medium-High |

The difficulty ramp is well-calibrated. Circle 1 teaches basic combat in fog. Circle 2 adds environmental hazards (wind, lava) and ranged enemies. Circle 3 layers resource management (poison) onto the established foundation. Boss complexity increases from 2 phases to 3 phases.

The one concern is that Circles 2 and 3 both have 15 non-boss enemies. Circle 3 might benefit from slightly higher count (17-18) or more challenging enemy behaviors to maintain the escalation.

### Prop Complexity Increase

| Circle | Unique prop types | Total placements | Avg props/room |
|---|---|---|---|
| 1 | 9 | ~28 | 4.7 |
| 2 | 15 | ~71 | 10.1 |
| 3 | 23 | ~135 | 19.3 |

The prop density escalation is dramatic and thematically appropriate: Limbo is sparse and empty, Lust is moderately adorned, Gluttony overflows with excess. However, Circle 1 is TOO sparse -- even for a "stillness" theme, the rooms need more environmental storytelling.

### Reuse Opportunities: Quaternius Props Across Circles

These Quaternius props should be used MORE across all three circles:

1. **prop-column, prop-column-broken, prop-column-broken2** -- structural cover in arena and boss rooms (all 3 circles need these)
2. **prop-torch-mounted, prop-torch-lit** -- primary light source (replaces Torch_Metal in C1)
3. **prop-barrel** -- universal storage/marker prop (used conceptually in all 3 but not with actual asset name)
4. **prop-bones, prop-bones2, prop-skull, prop-rpg-skull** -- death/decay scatter (C1 Bone Pit, C3 Feast Hall and Vorago's Maw)
5. **prop-cobweb, prop-cobweb2** -- age/neglect (C1 Crypt and Fog Hall, C3 could use mucus-web instead)
6. **prop-rock1, prop-rock2, prop-rock3** -- rubble/debris (every circle could use floor debris)
7. **prop-candelabrum-tall** -- alternative to circle-specific candle props
8. **prop-chest, prop-chest-gold** -- reward framing in secret rooms (C1 Crypt, C2 Boudoir, C3 Pantry)
9. **prop-pedestal, prop-pedestal2** -- weapon/pickup display stands
10. **prop-firebasket** -- warm light near lava zones in C2

### Boss Room Comparison

| Boss Room | Size | Props | Props/cell | Hero Pieces | Cover | Verdict |
|---|---|---|---|---|---|---|
| Il Vecchio's Chamber | 12x12 (144) | 5 | 0.03 | Banner x2 (weak) | None | WEAKEST |
| Caprone's Sanctum | 14x14 (196) | 13 | 0.07 | Throne dais + columns | 4 columns | BEST |
| Vorago's Maw | 14x14 (196) | 9 | 0.05 | Chains x2 (weak) | None on platform | NEEDS WORK |

**All three boss rooms need more work, but Il Vecchio's Chamber is the most critical.** It is the player's first boss encounter and currently has zero cover and almost no props. Caprone's Sanctum has the strongest foundation with the dais/column set piece. Vorago's Maw has the strongest concept (stomach) but the weakest execution (9 props in 196 cells).

---

## Action Items (Priority Ordered)

1. **CRITICAL: Fix prop name resolution.** Every `spawnProp` call in all 3 build scripts uses Fantasy Props MegaKit names (Torch_Metal, CandleStick_Triple, Column_Stone, etc.) that do not exist in the asset inventory. Map each to the closest Quaternius or Meshy prop, or create a name-aliasing layer. Without this, zero props render.

2. **CRITICAL: Dress Vorago's Maw (C3 boss room).** Add stomach-wall-growth, dripping-stalactites, flesh-door-frame, mucus-web, organic-column, and maggot-mound. This room is the Act 1 finale and currently reads as "acid room with chains."

3. **CRITICAL: Dress Il Vecchio's Chamber (C1 boss room).** Add altar, columns for cover, inscription tablet, skull scatter, candelabra. The first boss encounter needs gravitas and at least partial cover.

4. **HIGH: Add structural columns/pillars to all arena and boss rooms.** Columns provide cover, break sightlines, create movement corridors, and add visual grandeur. Currently missing from: Fog Hall, Il Vecchio's Chamber, Gut Arena, Vorago's Maw, and Tempest Hall (partial -- only at doorways, not within the combat space).

5. **HIGH: Add acid-pool-edge and lava-rock-border props to all hazard boundaries.** Every lava channel (C2: 5 rooms with lava) and acid pool (C3: 3 rooms with acid) lacks edge props. These frame the hazard visually and warn players of danger.

6. **HIGH: Dress the Crypt (C1 secret room).** Currently 2 props in 36 cells. Add sarcophagus, moss, cobwebs, pedestal for weapon display, skulls. Secret rooms should feel like hidden treasure chambers.

7. **HIGH: Add bone scatter to the Bone Pit (C1).** Zero bones in the Bone Pit. Add prop-bones, prop-bones2, prop-skull, limbo-bone-pile.

8. **MEDIUM: Add ceiling detail (stalactites, chandeliers) to C3 rooms.** The gluttony-dripping-stalactite prop exists and is not placed in any room. Every C3 room should have 2-3 stalactite placements for vertical visual interest.

9. **MEDIUM: Replace Chest_Wood with lust-marble-throne in Caprone's Sanctum.** The actual throne asset exists and the placeholder is immersion-breaking.

10. **MEDIUM: Add ornate-mirror to Boudoir (C2 secret room).** The prop exists, the room is Lust-themed, and a mirror is thematically perfect.

11. **MEDIUM: Add flesh-door-frame and bloated-arch to C3 room connections.** Every doorway in Gluttony should feel organic, not like standard stone corridors.

12. **MEDIUM: Reduce Feast Hall cutlery count.** 12 individual fork/knife/spoon placements may cause rendering overhead. Consider reducing to 8 or using instanced prop groups.

13. **LOW: Cut 8 redundant C1 Meshy props.** limbo-bone-pile, limbo-cobweb-cluster, limbo-vase-rubble, limbo-torch-bracket, limbo-wall-sconce, limbo-banner-tattered, limbo-fallen-column all have Quaternius equivalents. Save Meshy credits for unique assets.

14. **LOW: Add prop-carpet to Boudoir and Caprone's Sanctum dais.** Luxury flooring detail for Lust-themed rooms.

15. **LOW: Consider adding 2-3 more enemies to Circle 3** (17-18 total non-boss) to maintain the difficulty escalation from Circle 2's 15.
