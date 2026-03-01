---
title: "Act III Playtest Report"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
related:
  - docs/circles/07-violence.md
  - docs/circles/08-fraud.md
  - docs/circles/09-treachery.md
  - docs/circles/00-player-journey.md
---

# Act III Playtest Report --- Circles 7-9

**Playtester persona:** "Midcore Mike" --- regular FPS player, Normal difficulty, explores but does not pixel-hunt, picks up everything, strafes and circles, expects 2-3 deaths per circle, hates unfair deaths, hates boredom.

**Date:** 2026-03-01

---

## Player State Entering Act III

After completing Acts I-II (Circles 1-6 + 12 procedural floors):

| Stat | Value |
|------|-------|
| HP | 100/100 |
| Hell Pistol | 60/60 |
| Brim Shotgun | 20/20 |
| Hellfire Cannon | 40/40 |
| Goat's Bane (Bazooka) | 10/10 |
| Deaths so far | ~15-18 |
| Time played | ~90-100 minutes |
| Confidence | HIGH |

**Skills learned across Circles 1-6:**
- Fog navigation, wind resistance, poison identification
- Vertical platforming, arena lock-in, hoarding management
- Escalation timing, illusion wall testing
- FLOOR_VOID awareness, shadowGoat detection
- Mimic awareness (from mid-game introductions)

**Mindset:** "I've seen it all." Mike is a veteran. He knows secret walls exist. He knows arenas lock. He knows to check corners. Act III must challenge him with NEW combinations of old mechanics, not just "the same but harder."

---

## Circle 7: Violence

### Room 1: Pier

**Entering:** HP 100 | Pistol 60 | Shotgun 20 | Cannon 40 | Bazooka 10 | Tension 5

**Experience:** Mike spawns on an elevated stone pier, elevation +2, looking down at a massive red expanse below. Two torches flank him. A cauldron overflows with blood. The scope of the Blood River is immediately visible --- it is huge. Then the HUD pulses red. *"Your blood remembers what you've done."* The bleeding starts. 1 HP/s. Mike sees the ammo near the barrel, grabs it. He looks down the stairs and sees the walkways stretching over the crimson liquid. Dread. He knows the clock is ticking.

**HP Math:**
- No enemies. No kills. Pure drain.
- Room traversal time: ~10-15 seconds (spawn, look around, grab ammo, head for stairs).
- HP lost: 10-15 HP.
- No HP restored (no kills).

**Exiting:** HP ~85-90 | Ammo: Pistol 60+pickup | Tension 7

**Issues:**
- [PACING] The Pier is a purely observational room with zero enemies. Under the bleeding mechanic, every second Mike spends absorbing the vista costs him HP. The design intent is "dread," but in practice Mike will rush through in 10 seconds, missing the environmental storytelling. The dread moment is undercut by the urgency.
- [RESOURCE] The ammo pickup here is wasted --- Mike enters with full ammo. Health would be more thematically appropriate (establishing the bleeding-as-resource pattern) or a small health pickup that teaches "kills will be your real sustenance."

---

### Room 2: Blood River

**Entering:** HP ~87 | Full weapons | Tension 8

**Experience:** Mike descends the stairs into the biggest room in the circle. 20x14 cells. Crimson blood everywhere, raised stone walkways forming a branching network. He sees Torch_Metal on pillars casting orange light. Three goatKnight (Dark) patrol the walkway intersections. Mike knows goatKnights are armored --- they take multiple hits. He is on walkways at +0.5 elevation. Touching blood = 2 DPS + 1 HP/s bleeding = 3 HP/s total drain. Mike STAYS on walkways.

He engages the first goatKnight at the nearest intersection. Shotgun at close range --- 3-4 shots. The goatKnight tries to wade through blood to flank. Mike strafes on the walkway. Kill 1: +10 HP. He pushes forward along the central walkway spine.

He sees the west branch leading to ammo on a dead-end platform, and the east branch to the Thorny Passage exit. Mike explores --- he's a midcore player who picks up everything. He takes the west dead-end. This costs ~10 seconds of bleeding for one ammo pickup. He encounters the second goatKnight near the central walkway. Shotgun/pistol combo. Kill 2: +10 HP.

He heads toward the east branch. Third goatKnight patrols there. Narrow 2-cell-wide walkway. Mike engages carefully. Kill 3: +10 HP.

Mike also sees the health pickup at walkway intersection (24, 20) and the ammo on the dead-end (35, 22). He grabs both.

Now he must decide: west to River Banks, or east to Thorny Passage. Mike takes the east exit toward Thorny Passage (it is closer to his current position after clearing east branch enemies).

**HP Math:**
- Room traversal time (full exploration + 3 fights): ~60-80 seconds.
- Bleeding drain: -60 to -80 HP.
- Kill restores: 3 kills x 10 HP = +30 HP.
- Health pickup: +25 HP (standard health pickup value).
- Net HP change: +30 +25 -70 (avg) = -15 HP.
- If Mike falls into blood at any point: additional 2 DPS contact for however long he is in it.

**Exiting:** HP ~72 | Ammo topped up | Tension 8

**Issues:**
- [SPATIAL] The room is 20x14 cells but the walkway network forces linear pathing. The "branching" is an illusion --- west branch is a dead-end for ammo, east branch is a dead-end to Thorny Passage exit. Mike's choice is really "which order do I visit exits?" not a meaningful route decision. The branching paths both reconnect at Burning Shore later, so the decision is deferred, not real.
- [DIFFICULTY] 3 goatKnights (armored) in the largest room of the circle, while bleeding at 1 HP/s. goatKnights take 5+ shotgun shots or 10+ pistol shots each. If each fight takes 15-20 seconds, that is 45-60 seconds of bleeding just for combat. The 3 kill restores (+30 HP) barely offset the bleed during combat alone, let alone traversal. Mike is likely at 70-75 HP exiting if he explores.
- [RESOURCE] The health pickup at the walkway intersection is critical but not visually distinct from ammo pickups. Under bleeding pressure, Mike needs to KNOW health is ahead. Consider a subtle visual cue (pulsing red glow) for health pickups in Circle 7 specifically.
- [MECHANICAL] goatKnights wading through blood at 60% speed but taking 0 DPS is thematically excellent but mechanically confusing. Mike sees them walk through blood that would kill him. The first time a goatKnight flanks through blood, Mike may try to follow --- taking 3 HP/s. This needs a clearer visual: maybe the blood parts around goatKnights, or Mike gets a warning tooltip the first time.

---

### Room 3: River Banks (if Mike takes west path first --- SKIPPED on this playthrough)

Mike took the east exit toward Thorny Passage. He will reach River Banks via the Burning Shore convergence later. This is fine --- the branching works. But this means Mike SKIPS the health pickup in River Banks (11, 24) for now. If Mike had gone west first, he would gain +25 HP and fight 1 fireGoat (+10 HP from kill) but lose ~20 seconds of bleeding (-20 HP). Net: +15 HP for the detour.

**Issues:**
- [PACING] If Mike goes east, Room 3 is skipped entirely and he hits Thorny Passage next --- a much harder room. The west-then-east ordering is safer (get health + easy fight, then tackle thorns), but the level design does not signal this. Mike's natural tendency (closer exit = faster = less bleed) sends him the harder way.

---

### Room 4: Thorny Passage

**Entering:** HP ~70 | Weapons mostly full | Tension 8

**Experience:** Mike enters a narrow 6x16 corridor. Only 2 cells wide safe path. Thorn walls on both sides (Rust003/007 texture, 5 damage on contact). The corridor rises and falls --- RAMP cells create elevation changes (0 to +1 to +2 to +1 to 0). Two fireGoats hold elevated positions and fire downhill.

Mike's movement style is strafing. In a 2-cell-wide corridor flanked by 5-damage thorn walls, strafing is DEATH. Mike must move forward in a straight line while dodging ranged attacks. He cannot circle-strafe. His entire combat vocabulary is negated.

He advances. First RAMP up to +1. Projectiles from above. He tries to dodge laterally --- bumps a thorn wall. -5 HP (plus bleeding). He learns: forward only, weaving slightly. He fights the first fireGoat at the +1 to +2 transition. Pistol at range (this is a long sightline). Kill 1: +10 HP.

He crests the hill at +2. Second fireGoat fires from the descending section. Mike engages. The elevated position means the fireGoat has clear sightline while Mike is silhouetted against the hill. Mike takes a ranged hit (-8 HP estimated from fireGoat damage). Kill 2: +10 HP.

He descends back to elevation 0. Grabs ammo pickup at midpoint (46, 30).

**HP Math:**
- Room traversal time: ~30-40 seconds (long corridor, elevation changes slow movement, combat at range).
- Bleeding drain: -30 to -40 HP.
- Kill restores: 2 kills x 10 HP = +20 HP.
- Thorn wall contact (estimate 1-2 bumps): -5 to -10 HP.
- fireGoat damage taken (estimate 1-2 hits): -8 to -16 HP.
- Net HP change: +20 -35 (avg bleed) -7 (avg thorn) -12 (avg combat damage) = -34 HP.

**Exiting:** HP ~36 | Tension 9

**Issues:**
- [DIFFICULTY] **CRITICAL.** Mike enters at ~70 HP and could exit at ~36 HP. The 2-cell-wide corridor with 5-damage thorn walls is extremely punishing for a strafe-heavy player. The corridor is 16 cells LONG --- that is 32 world units of narrow gauntlet. Combined with elevation changes, ranged enemies firing downhill, and bleeding, this room could easily kill Mike.
- [MECHANICAL] The thorn wall contact (5 damage) combined with bleeding (1 HP/s) means a single accidental wall touch while dodging a fireGoat projectile costs 6+ HP in one second. This feels cheap because the dodge was the right move --- the corridor just does not allow it. Mike will feel punished for playing correctly.
- [CLARITY] How does Mike know the walls are thorns? Rust003/007 texture is not inherently threatening. Previous circles have not established "rust = pain." If Mike is running forward under bleeding pressure, he may not notice the wall texture is different until he touches it. Recommendation: add a visible particle effect (sparks or red motes) emanating from thorn walls, or have the first contact trigger a distinct audio/visual flash with a tooltip "THORN WALLS --- CONTACT CAUSES DAMAGE."
- [SPATIAL] The 2-cell-wide safe path is extraordinarily tight for first-person navigation. With camera sway and imprecise analog stick input (gamepad players), keeping to the center of a 4-world-unit-wide corridor while platforming elevation changes is an ask more suited to a hardcore player, not Midcore Mike. Recommendation: widen to 3 cells minimum, or reduce thorn damage to 3.

---

### Room 5: Thornwood

**Entering:** HP ~36 | Tension 9

**Experience:** Mike is LOW. He enters a 14x12 room filled with irregular thorny columns. Every column is a 5-damage hazard with a 1-cell damage zone around it. He cannot use columns for cover because cover hurts. Three enemy types: 1 goatKnight (north), 1 hellgoat (center, charges), 1 fireGoat (south, ranged).

Mike's strafing combat style is partially restored --- the lanes between columns are 2-3 cells wide. But the damage zones around columns mean the effective safe fighting space is even narrower. Mike fights the goatKnight first (it is closest). Shotgun at close range. The goatKnight is armored --- takes multiple hits. Mike backpedals, clips a column. -5 HP. He is at ~31 HP.

Kill the goatKnight: +10 HP. HP: ~41 (accounting for bleeding during fight).

The hellgoat charges down a lane. Mike dodges laterally --- right into a column damage zone. -5 HP. He pivots, shoots the hellgoat. Pistol or cannon. Kill: +10 HP. HP: ~38.

fireGoat in the south. Mike advances through the column maze, peeking lanes. fireGoat projectiles ricochet off columns (this is noted as a mechanic). Mike uses cannon for the ranged fight. Kill: +10 HP. HP: ~40.

Grabs health pickup at center (42, 44): +25 HP. HP: ~60.

**HP Math:**
- Room traversal time: ~40-50 seconds (combat in confined lanes, careful navigation).
- Bleeding drain: -40 to -50 HP.
- Kill restores: 3 kills x 10 HP = +30 HP.
- Health pickup: +25 HP.
- Column contact (estimate 2-3 bumps): -10 to -15 HP.
- Combat damage taken: -5 to -15 HP.
- Net HP change: +30 +25 -45 (avg bleed) -12 (avg column) -10 (avg combat) = -12 HP.

**Exiting:** HP ~60 | Tension 8

**Issues:**
- [DIFFICULTY] Mike entered at ~36 HP. If he had not found the health pickup, he would have exited at ~35 HP or lower. The health pickup is the difference between life and death. It needs to be visible and reachable without excessive column-dodging.
- [MECHANICAL] "fireGoat's ranged shots ricochet between columns" --- is this the same mechanic as Circle 9's reflected shots, or a unique behavior? If fireGoat projectiles bounce in Circle 7 but player projectiles do not, Mike will be confused about the rules. If both bounce, Circle 7 already introduces the mechanic that is supposed to be Circle 9's identity. This needs clarification. Recommendation: fireGoat projectiles should NOT ricochet in Circle 7. Reserve shot reflection for Circle 9.
- [SPATIAL] "Visibility restricted to ~6 cells" in a room with 3 different enemy types forces sequential encounters. The goatKnight, hellgoat, and fireGoat will not be visible simultaneously. This is fine for pacing (encounter one at a time) but means Mike cannot plan engagement order. He fights what he stumbles into.

---

### Room 6: Burning Shore

**Entering:** HP ~60 | Tension 7 (relief from claustrophobia)

**Experience:** After the cramped Thorny Passage and Thornwood, Mike emerges into a vast 18x10 open expanse. No walls, no columns. The relief is instant. Then he sees the fire geysers. Six 2x2 zones on staggered timers (3s on, 5s off, 1s offset each). And 4 fireGoats spread across the open space with unobstructed sightlines.

Mike is in the open with no cover. 4 ranged enemies. Fire geysers erupting around him. And still bleeding. His instinct is to strafe and circle --- and here, he CAN. The open space restores his combat vocabulary. But 4 fireGoats firing simultaneously from different angles means he takes hits.

He pushes forward, engaging the nearest fireGoat. Kill: +10 HP. Dodges a geyser eruption (8 damage). Pushes to the next. Kill: +10 HP. A third fireGoat tags him (-8 HP). Kill it: +10 HP. The fourth is across the room. Mike sprints over, dodging a geyser (gets clipped for 8 damage). Kill: +10 HP.

Grabs ammo x2 at south edge (18, 62) and (32, 62), health at center (25, 58): +25 HP.

**HP Math:**
- Room traversal time: ~45-60 seconds (large room, 4 fights, geyser avoidance).
- Bleeding drain: -45 to -60 HP.
- Kill restores: 4 kills x 10 HP = +40 HP.
- Health pickup: +25 HP.
- Geyser damage (estimate 0-1 hit): 0 to -8 HP.
- Combat damage (estimate 2-3 fireGoat hits): -16 to -24 HP.
- Net HP change: +40 +25 -52 (avg bleed) -4 (avg geyser) -20 (avg combat) = -11 HP.

**Exiting:** HP ~49 | Tension 7

**Issues:**
- [PACING] This is the right room at the right time. The open space after claustrophobic thorns is a genuine relief, immediately undercut by the fire geysers and fireGoat sightlines. Well-designed emotional rhythm.
- [DIFFICULTY] 4 fireGoats in the open means Mike takes ranged hits. There is literally no cover. A midcore player will take 2-3 hits minimum. With bleeding + combat damage + potential geyser hit, Mike loses ~50 HP in this room even with 4 kills. The health pickup is essential.
- [CLARITY] Fire geysers erupt on staggered timers (3s on, 5s off, 1s offset). With 6 geysers, the pattern cycles over 6 seconds of offset. Under combat pressure with 4 fireGoats, Mike will NOT learn the geyser pattern. He will dodge reactively. The floor scorch marks (Stain001 decal) help, but only if Mike looks down --- unlikely during combat. Recommendation: add a brief audio cue (hissing) 1 second before eruption to give Mike a non-visual warning.
- [RESOURCE] Two ammo pickups at the south edge (near the exit) reward pushing through the room. Good placement.

---

### Room 7: Flamethrower Shrine

**Entering:** HP ~49 | Tension 3 (sacred space)

**Experience:** Mike enters a small 6x6 room. Stone altar. CandleStick_Triple with warm gold light. The contrast with the red-orange of the rest of the circle is stark. On the altar: the Brimstone Flamethrower. Mike picks it up. *"The wilderness gave you fire. Use it."*

No enemies. A moment of quiet. Mike examines the flamethrower: continuous stream, 4-cell range, 2 dmg/s DOT for 5 seconds. He has a new weapon. The bleeding continues --- this moment of peace still costs HP.

**HP Math:**
- Room traversal time: ~10-15 seconds.
- Bleeding drain: -10 to -15 HP.
- No kills.
- No pickups (besides weapon).

**Exiting:** HP ~37 | Now has Flamethrower (100 fuel) | Tension 3

**Issues:**
- [PACING] This is the correct breather room. After 6 rooms of bleeding pressure, Mike needs a pause. The warm gold light against the red haze is a masterful aesthetic choice. However, the bleeding mechanic undermines the intended contemplative moment. Mike should linger and savor this --- but every second costs HP. Recommendation: Consider pausing the bleeding for 5-10 seconds when the flamethrower is picked up (a "grace moment"). Thematically: the fire purifies the blood curse temporarily.
- [RESOURCE] Mike enters at ~49 HP with no health pickup in this room. He exits at ~37 HP heading into the Slaughterhouse (an arena). This is tight. The Shrine would benefit from a single health pickup to send Mike into the arena at a survivable threshold.
- [NARRATIVE] The inscription "The wilderness gave you fire. Use it." is excellent. The scapegoat thematic resonance is strong.

---

### Room 8: Slaughterhouse (Arena)

**Entering:** HP ~37 | All weapons + Flamethrower 100 | Tension 9

**Experience:** Doors lock. Industrial abattoir. Metal grating floor. Chain_Coil hooks hanging from the ceiling. Mike is here with the new flamethrower and ~37 HP. This is dangerous.

**Wave 1: 3x goatKnight (Dark).** Armored melee enemies in close quarters. Mike tests the flamethrower. Continuous stream, 4-cell range. The DOT stacks: 2 dmg/s for 5 seconds = 10 damage per burn application. goatKnights need sustained fire. Mike holds the trigger and sweeps. The flamethrower excels here --- close quarters, multiple enemies bunched. Crate_Metal provides partial cover against melee charges.

Kills: 3 x +10 HP = +30 HP. Wave 1 time: ~20-25 seconds. Bleed: -20 to -25 HP. Combat damage taken (melee hits from goatKnights): -10 to -20 HP (goatKnight melee at ~10 damage, Mike takes 1-2 hits while learning flamethrower range).

HP after wave 1: ~37 +30 -22 (bleed) -15 (combat) = ~30 HP.

Three hooks DROP from ceiling to floor, becoming obstacles (3 damage contact).

**Wave 2: 3x fireGoat (Crimson).** Ranged enemies. Mike uses flamethrower? No --- 4-cell range vs fireGoat ranged attacks. Mike switches to cannon or pistol for ranged engagement. Uses Crate_Metal and the new hook obstacles as cover.

Kills: 3 x +10 HP = +30 HP. Wave 2 time: ~20-25 seconds. Bleed: -20 to -25 HP. Combat damage: -8 to -16 HP (ranged hits).

HP after wave 2: ~30 +30 -22 (bleed) -12 (combat) = ~26 HP.

Three MORE hooks drop. Room increasingly cluttered.

Resupply appears: ammo x2, health x1. Mike grabs health: +25 HP. HP: ~51.

**Wave 3: 2x goatKnight + 2x hellgoat + 1x fireGoat.** All types simultaneously. 5 enemies. The room is cluttered with 6 dropped hooks (3 damage contact each). Mike uses flamethrower on the melee rush (goatKnights + hellgoats) while dodging fireGoat shots and hook obstacles.

Kills: 5 x +10 HP = +50 HP. Wave 3 time: ~30-40 seconds. Bleed: -30 to -40 HP. Combat damage: -20 to -35 HP (5 enemies, melee + ranged, cluttered room). Hook contacts: -3 to -9 HP.

HP after wave 3: ~51 +50 -35 (bleed) -27 (combat) -6 (hooks) = ~33 HP.

**HP Math (full arena):**
- Total time: ~80-100 seconds.
- Total bleed: -80 to -100 HP.
- Total kill restores: 11 kills x 10 HP = +110 HP.
- Health pickup: +25 HP.
- Combat damage: ~50-70 HP.
- Hook damage: ~6-12 HP.
- Net: Mike enters at ~37, exits at ~30-40 HP if he plays well.

**Exiting:** HP ~33 | Tension 10 (that was intense)

**Issues:**
- [DIFFICULTY] **CRITICAL.** Mike enters the arena at ~37 HP. This is the biggest combat encounter in the circle (11 enemies across 3 waves). The math works IF Mike kills efficiently --- 11 kills = +110 HP, which barely outpaces ~90 HP of bleed + ~60 HP of combat damage + ~9 HP of hook damage. But if Mike takes more than average damage, or has a slow wave, he dies. The margin is razor-thin.
- [DIFFICULTY] The wave-to-wave HP trajectory is brutal: 37 -> 30 -> 26 -> (health) -> 51 -> 33. Mike is below 30 HP after wave 2 BEFORE the health pickup appears. If the health pickup spawns in a corner Mike cannot reach safely (fireGoats still firing, hooks on the ground), he dies before wave 3. Recommendation: spawn the health pickup BETWEEN waves 1 and 2 instead of between waves 2 and 3, giving Mike a lifeline earlier.
- [DIFFICULTY] Wave 3 has 5 enemies simultaneously. With the room cluttered by 6 hook obstacles (3 damage contact), Mike's movement space is severely restricted. 2 goatKnights charging + 2 hellgoats charging + 1 fireGoat firing = overwhelming unless the flamethrower can crowd-control the melee rush. This is the "learn the flamethrower" room, but 5 simultaneous enemies is a harsh teacher. Recommendation: wave 3 should stagger slightly --- 2 goatKnights first (3-second delay), then hellgoats + fireGoat.
- [RESOURCE] The resupply (ammo x2, health x1) appears between waves at the south edge. If Mike is fighting in the north half of the room, he must cross the hook-littered floor to reach it. Under bleed pressure, this costs time. Consider placing resupply at room CENTER.
- **DEATH ESTIMATE:** Mike dies 1-2 times in the Slaughterhouse. Most likely cause: wave 3 overwhelm at low HP (30s of bleeding + 5 simultaneous enemies + hook obstacles = too many damage sources). This feels slightly unfair because the margin is so thin --- a "nearly survived" death.

---

### Room 9: Butcher's Hook (Secret)

**Entering:** HP ~33 (if Mike finds it) | Tension 2

**Experience:** Mike has been testing secret walls since Circle 2. He runs along the east wall of the Slaughterhouse after the arena clears. He finds the WALL_SECRET. Inside: 2 ammo pickups, 2 health pickups. Mike grabs everything. +50 HP (2x health), ammo refilled.

**HP Math:**
- Room traversal: ~10 seconds.
- Bleed: -10 HP.
- Pickups: +50 HP (2 health).

**Exiting:** HP ~73 | Fully resupplied | Tension 2

**Issues:**
- [RESOURCE] This secret room is ESSENTIAL for Mike's survival heading into the boss fight. Without it, Mike enters the boss at ~33 HP --- almost certainly a death. With it, he enters at ~73 HP --- viable. The problem: a player who does not find the secret wall enters the boss at ~33 HP. That is too low. Recommendation: either make the secret wall more discoverable (visual crack, slight texture difference, audio cue) or add a non-secret health pickup in the Slaughterhouse itself after the arena clears.
- [RESOURCE] 2 ammo + 2 health is generous. Correct for a secret room before the boss. Good design.

---

### Room 10: Il Macello's Abattoir (Boss)

**Entering:** HP ~73 (with secret) or ~33 (without) | All weapons | Tension 10

**Experience:** Mike descends stairs to elevation -1. The room is 16x16 --- massive. Metal grating floor over FLOOR_VOID. He can see the blackness below through the grate. Chain_Coil hooks hang from the ceiling. Four torch_Metal at corners. Chandelier overhead.

Il Macello stands in the center. *"Meat. That is all you are. Meat on hooks."* He hefts a massive cleaver. Doors lock.

**Phase 1 (100%-60% HP) --- Overhead Cleave:**
Il Macello performs overhead cleave strikes targeting Mike's position, landing 1 second after telegraph (shadow on floor). 25 damage in 3x3 area. After a missed cleave, his weapon gets STUCK for 2 seconds.

Mike learns the pattern: bait cleave, dodge, punish during 2-second window. The flamethrower's DOT is ideal during the stuck window --- 2 seconds of stream + DOT continuing = significant damage. Mike also uses the cannon during stuck windows for burst.

Time: ~60-90 seconds. Mike takes 1-2 cleave hits (-25 to -50 HP) while learning the pattern. Bleeding drains -60 to -90 HP. The boss is not a "kill" for bleeding HP restore --- presumably killing the boss restores HP or ends the bleed.

**Phase 2 (60%-30% HP) --- Chain Grapple:**
Il Macello rips a chain from the ceiling. Fires it at Mike every 5 seconds (2-cell width projectile). If it connects, Mike is DRAGGED toward Il Macello (forced movement). Mike can still shoot during drag. If pulled to melee range: -20 HP.

Mike dodges laterally. The chain has a 2-cell width --- he needs 3+ cells of lateral clearance. In a 16x16 room this is manageable. Mike learns to predict the 5-second cooldown and pre-position. He uses the flamethrower while being dragged (the "still shoot" mechanic is clever).

Time: ~60-90 seconds additional. Mike takes 1-2 chain hits + forced melee (-20 to -40 HP). Bleeding: -60 to -90 HP.

**Phase 3 (30%-0% HP) --- Processing Line:**
Floor grating panels retract one 3x3 panel every 4 seconds, edges inward. After 40 seconds, only a 6x6 center remains. Cleaves telegraph faster (0.7s), chain cooldown shorter (3s). Mike must kill Il Macello before the floor runs out.

16 panels total in a 4x4 grid. Retracting one every 4 seconds = 64 seconds to retract all, but only 6x6 center (4 panels) remains after 48 seconds (12 panels retracted). Mike has ~48 seconds.

Falling through a retracted panel: -15 HP + teleport to random remaining panel.

This phase is a DPS race. Mike unloads everything: flamethrower at close range, cannon, shotgun. If Il Macello has ~30% HP left and this phase takes ~40 seconds, Mike needs sustained damage output.

Time: ~40-50 seconds. Bleeding: -40 to -50 HP. Falls: -15 to -30 HP (1-2 falls). Combat damage: -15 to -30 HP (faster attacks).

**HP Math (full boss fight):**
- Total time: ~160-230 seconds (2.5-4 minutes).
- Total bleed: -160 to -230 HP.
- No kill HP restores (boss is one enemy, presumably +10 HP on kill --- at the end).
- Combat damage: -60 to -120 HP.
- Falls: -15 to -30 HP.
- Starting HP: 73 (with secret), 33 (without secret).
- **Mike CANNOT survive this boss with bleeding active.** Even at 73 HP, 160+ HP of bleeding alone kills him.

**CRITICAL ISSUE: The boss fight is IMPOSSIBLE with bleeding active as described.**

At 73 HP entering, with 1 HP/s drain and a 2.5-4 minute boss fight, Mike loses 150-240 HP to bleeding alone. He has no way to recover: there are no enemies to kill for the +10 HP (it is a solo boss), and the health pickups in the room (2 at north corners, 2 at south corners) provide +100 HP total. Even with all 4 health pickups, Mike's net bleed is still -60 to -140 HP over the fight duration. Plus combat damage.

**Exiting:** HP 0 (DEAD). Repeatedly.

**Issues:**
- [DIFFICULTY] **GAME-BREAKING.** The bleeding mechanic (1 HP/s) combined with a multi-minute boss fight with no mob kills for HP restore creates an impossible resource equation. Mike enters with ~73 HP (best case), has 4 health pickups (+100 HP total), and faces 150-240 HP of bleed drain plus 60-120 HP of combat damage. Even a flawless run (zero hits, all pickups) results in a net deficit of -50 to -140 HP from bleeding alone across a 3-minute fight. **The boss needs at least one of these fixes:**
  1. **Stop the bleeding during the boss fight** (boss arena purifies the blood curse --- thematic: you are below the Blood River now, at elevation -1).
  2. **Add bleeding-cure kills** during the boss (boss summons 2-3 goatKnight adds between phases, providing kill HP restore).
  3. **Reduce bleed to 0.5 HP/s** during the boss phase.
  4. **Significantly increase health pickup count** in the boss arena (current 2 healths are insufficient).
  Recommendation: Option 2 is the best design choice. Il Macello summons 2 goatKnights between phases 1-2 and 2-3. This gives Mike 4 kills (+40 HP) and creates a mini-arena moment that also serves as a teaching tool (use flamethrower on adds, then refocus boss).
- [MECHANICAL] Phase 3's floor retraction creates a DPS race, which is exciting. But combined with bleeding, it is a timer on top of a timer on top of a timer (bleed timer + floor timer + HP timer). Three simultaneous death clocks is overwhelming. Pick two.
- [CLARITY] Phase 1 telegraph: "shadow on floor" for the cleave landing zone. On a metal grating floor with a void visible below, shadows may not render clearly. Recommendation: use a glowing red circle on the floor (like a targeting reticle) instead of a shadow.
- [MECHANICAL] Phase 2 chain grapple: "player can still shoot during drag." This is a cool mechanic but needs clear communication. Mike's instinct when grabbed will be to mash buttons to escape, not to deliberately aim and fire. A brief tooltip or slowed drag speed on first grab would help.
- **DEATH ESTIMATE:** Without the bleeding fix, Mike dies 3-5 times to the boss. With the fix (adds between phases or bleed pause), Mike dies 1-2 times. The cleave pattern is learnable, the chain is dodgeable, and the floor retraction is a strong finale mechanic. The boss design is GOOD --- it is only the bleeding math that breaks it.

---

### Circle 7 Summary

**HP Survival Analysis:**

| Room | Enter HP | Exit HP | Kills | Kill HP | Pickups HP | Bleed | Damage |
|------|----------|---------|-------|---------|------------|-------|--------|
| Pier | 100 | 87 | 0 | 0 | 0 | -13 | 0 |
| Blood River | 87 | 72 | 3 | +30 | +25 | -70 | 0 |
| Thorny Passage | 72 | 36 | 2 | +20 | 0 | -35 | -21 |
| Thornwood | 36 | 60 | 3 | +30 | +25 | -45 | -22 |
| Burning Shore | 60 | 49 | 4 | +40 | +25 | -52 | -24 |
| Shrine | 49 | 37 | 0 | 0 | 0 | -12 | 0 |
| Slaughterhouse | 37 | 33 | 11 | +110 | +25 | -90 | -49 |
| Butcher's Hook | 33 | 73 | 0 | 0 | +50 | -10 | 0 |
| Boss | 73 | **DEAD** | 1 | +10 | +100 | -200 | -90 |

**Total non-boss:** 23 kills x 10 HP = +230 HP restored from kills. ~325 HP lost to bleeding (non-boss). +150 HP from non-boss health pickups. ~116 HP lost to environmental/combat damage (non-boss).

**Conclusion:** The non-boss rooms are BARELY survivable. Mike's HP yo-yos between 30-75 through the entire circle. The margin is thin but functional --- this creates the intended "every second matters" tension. The BOSS breaks the math because it is a long single-target fight with no mob kills.

**Deaths:**
- Probable death 1: Slaughterhouse wave 3 (overwhelm at low HP).
- Probable death 2-4: Boss fight (bleeding drain exceeds recoverable HP).
- Total Circle 7 deaths: 3-5 (2-3 if boss bleeding is fixed).

**Flamethrower Impact:**
The flamethrower arrives at room 7 of 10 (Shrine). Before the Shrine, Mike has the pistol, shotgun, cannon, and bazooka. These are adequate for the first 6 rooms but not ideal --- the goatKnights in Blood River and Thornwood are armored and tanky, which punishes the pistol/shotgun.

After the Shrine, the flamethrower dominates. The Slaughterhouse wave 1 (3 goatKnights in close quarters) is the PERFECT teaching scenario --- the flamethrower's DOT shreds armor over time. The weapon transforms combat from "stand back and shoot" to "push forward and burn."

The flamethrower placement is excellent. The weapon is the reward for surviving 6 rooms of bleeding hell.

**Recommendations:**
1. **FIX THE BOSS BLEEDING.** The boss fight is mathematically impossible with active 1 HP/s drain. Add mob spawns between phases or pause bleeding in the boss arena.
2. **Widen the Thorny Passage** from 2 to 3 cells. The current width is too punishing for strafe-oriented players.
3. **Add audio/visual cue for thorn walls.** Rust texture alone is not sufficient to communicate "contact = 5 damage."
4. **Move health pickup spawn** in Slaughterhouse from between waves 2-3 to between waves 1-2.
5. **Add a small health pickup to the Shrine** (sacred space provides brief healing).
6. **Consider a 5-10 second bleeding grace period** on Flamethrower pickup.

---

## Procedural Floors: Circle 7 to Circle 8 Transition

Mike completes Circle 7 and enters Fraud-themed procedural floors. He gains approximately:
- ~20 mixed ammo
- Some health pickups (assume +50 HP total)
- No new weapons
- 2-3 procedural floor encounters

**Entering Circle 8:** HP 100 (healed during procedural floors) | All weapons + Flamethrower ~80 fuel | Ammo partially refilled.

---

## Circle 8: Fraud

### Room 1: Portico

**Entering:** HP 100 | Full weapons + Flamethrower | Tension 3

**Experience:** Mike enters a grand foyer. Two chandeliers overhead. Candlesticks. Banners. Polished marble floor. Warm golden light. After Circle 7's bleeding red horror, this feels like RELIEF. The palace welcomes him. Safe ammo and health pickups on the floor. Mike grabs both. Trust established.

This is the setup for betrayal. Mike does not know it yet.

**HP Math:** No enemies. No hazards. ~10 seconds. No HP change.

**Exiting:** HP 100 | Ammo topped up | Tension 2

**Issues:**
- [PACING] The Portico's safety is the POINT. It builds false trust. After Circle 7's unrelenting bleeding, the relief is palpable. This is correct.
- [NARRATIVE] The warm golden aesthetic after crimson red is a masterful tonal shift. Mike genuinely feels safe. The betrayal ahead will land harder because of this room.

---

### Room 2: Hall of Mirrors

**Entering:** HP 100 | Tension 4

**Experience:** Polished onyx wall panels. Reflections. Mike sees... something in the walls. ShadowGoats --- but visible only as reflections. The actual enemy is on the OPPOSITE side of the room from its reflection. Mike must shoot the real position, not the reflection.

Mike has experience with shadowGoats from previous circles. He knows they are sneaky. But the reflection mechanic is NEW. His instinct is to shoot at what he sees in the onyx panel. He fires at a reflection. The shot hits the onyx panel and bounces (1 bounce, reduced damage). The ricochet might hit Mike or nothing.

He realizes: the reflection is a lie. He looks AWAY from the panel, scans the room. Sees the real shadowGoat in his peripheral vision (or just on the opposite side). He engages. Kill 1. Grabs ammo pickup at center. Engages the second shadowGoat (now understanding the reflection mechanic). Kill 2. The third shadowGoat is hiding better. Mike takes a hit before locating it. Kill 3.

**HP Math:**
- Time: ~40-50 seconds.
- Damage taken: -8 to -16 HP (shadowGoat attacks, ricochet self-damage from panel).
- No healing (only ammo pickup).

**Exiting:** HP ~88 | Tension 6

**Issues:**
- [CLARITY] **SIGNIFICANT.** "Shoot where the real enemy would be standing, not the reflection" is a logic puzzle, not an FPS mechanic. Mike's muscle memory from 2+ hours of gameplay says "shoot what you see." The reflection mechanic asks him to shoot what he DOES NOT see. How does the game teach this?
  - The onyx panel inscription *"What you see is never what is"* is too cryptic under combat pressure. Mike is being attacked by invisible enemies --- he is not reading wall inscriptions.
  - Recommendation: The FIRST shadowGoat should be positioned so that its reflection and its real position are both visible simultaneously (near a corner where two onyx panels meet). Mike sees the reflection AND the real enemy. He learns the relationship. The second and third can be harder.
- [MECHANICAL] "Shots that hit onyx panels bounce (1 bounce, reduced damage)." This is a proto-version of Circle 9's reflected shots. It serves as a gentle introduction to the concept. Good design --- the bounced shots here are low-damage and in a large room with space to dodge. But the doc does not specify the reduced damage amount. If it is 75% (same as Circle 9), a reflected cannon round could hurt significantly. Recommendation: 25% damage on onyx bounces in Circle 8 (much lower than Circle 9's 75%), clearly differentiating the two circles.
- [SPATIAL] Two exits: west to Flatterers, east to Thieves. Both paths converge at Counterfeit Arena. Mike can choose. He goes west (Flatterers) because it is the first exit he encounters.

---

### Room 3: Bolgia of Flatterers

**Entering:** HP ~88 | Tension 6

**Experience:** Mike enters from the north. He sees "friendly" silhouettes at the far end --- they wave and beckon. In the center: two pickups (health, ammo). Mike approaches the pickups (he picks up everything).

At 2-cell proximity, the pickups ATTACK. The health and ammo are MIMICS. Spider-like legs unfold. 15 damage burst. Mike takes a hit from the first mimic: -15 HP. HP: 73.

Simultaneously, the friendly silhouettes at the far end charge --- they are 2 hellgoats. Mike is being attacked from both sides. Mimics in front, hellgoats charging from the north platform.

Mike fights. Mimics have only 6 HP --- a few shots each. Kill 2 mimics. The hellgoats are tougher. Mike uses shotgun or flamethrower. Kill 2 hellgoats.

He also finds the real ammo pickup hidden behind the Banner_2 on the west wall (10, 28). Scroll on the table: *"Flattery is the currency of the damned."*

**HP Math:**
- Time: ~30-40 seconds.
- Mimic damage: -15 to -30 HP (1-2 mimic hits).
- Hellgoat damage: -10 to -20 HP.
- No health pickup in this room.

**Exiting:** HP ~48-63 | Tension 8

**Issues:**
- [DIFFICULTY] Mimics deal 15 damage --- that is more than a fireGoat ranged hit. The first mimic encounter is GUARANTEED to hit Mike because he has no reason to suspect pickups are enemies. This is intentional (the "lesson" of Fraud) but the 15 damage is steep. Mike went from 88 HP to ~48-63 HP in one room with no way to heal. Recommendation: first mimic encounter should deal 10 damage (reduced from 15) to punish without devastating. Later mimics can deal full 15.
- [CLARITY] How does Mike distinguish mimics from real pickups going forward? The doc says "Flamethrower AoE triggers mimics at safe distance (3-cell range > 2-cell trigger range)." But this counterplay is not taught here. Mike must discover it independently. Recommendation: after the ambush, have a UI tooltip or Scroll text hint: *"Fire reveals truth. Sweep before you touch."*
- [MECHANICAL] If Mike's response to the mimic surprise is to STOP picking up items, the game's resource economy collapses. He needs health pickups to survive. If he fears every pickup, he starves. The flamethrower-sweep counterplay must be clearly communicated.
- **FIRST DEATH CANDIDATE:** If Mike entered this room below 50 HP (possible if he took hits in Hall of Mirrors), the mimic burst (15 damage) + hellgoat charge (10 damage) could kill him. This would feel unfair --- he was picking up a health pickup and it killed him.

---

### Room 4: Bolgia of Thieves

**Entering:** HP ~55 (avg) | Tension 7

**Experience:** Items in this room vanish on approach and reappear elsewhere. Mike approaches the health pickup at (38, 28). It despawns. A shadowGoat or empty space appears. Mike turns around --- remaining pickups shuffle positions.

This is disorienting. Mike spends time chasing pickups that keep moving. He encounters 2 shadowGoats (spawn when pickups vanish) and 1 hellgoat. Combat in a room where loot teleports.

**HP Math:**
- Time: ~35-45 seconds (chasing items adds time).
- Kill restores: N/A (no bleeding in Circle 8).
- Damage taken: -15 to -25 HP.
- Pickups: The 2 ammo pickups shuffle but can eventually be grabbed. Health pickup at (38, 28) might be grabbable if Mike anticipates the shuffle. Assume +25 HP if he gets the health.

**Exiting:** HP ~55-65 | Tension 7

**Issues:**
- [PACING] This room SLOWS Mike down. Chasing vanishing pickups is the opposite of "push-forward FPS" design. Mike is a midcore player who picks up everything --- vanishing items will frustrate him. He will spend 20+ seconds chasing loot that keeps moving, during which enemies are attacking him.
- [MECHANICAL] "When the player turns around (facing direction > 90 degrees from pickup), remaining pickups shuffle positions." This requires Mike to KNOW that turning triggers the shuffle. He does not know this. He will just see items randomly teleporting. The mechanic needs a clearer communication --- perhaps an audio cue (soft laughter, items clinking) when a shuffle occurs.
- [CLARITY] Chest_Wood props that "open to reveal nothing --- or a shadowGoat." This is functionally another mimic type but disguised as environmental interaction rather than pickup. Mike will learn to distrust ALL interactable objects, not just pickups. Is that the intent?

---

### Room 5: Shifting Maze

**Entering:** HP ~55-65 | Tension 7

**Experience:** A 14x14 maze. Walls shift when Mike is not looking at them. Vase_Rubble props as unreliable breadcrumbs (they shift too). 2 shadowGoats and 2 hellgoats patrol.

Mike enters and starts navigating. He turns a corner. He turns back --- the path he came from is blocked. The wall moved. He cannot retrace his steps. He must keep going forward.

The maze is disorienting by design. Mike relies on Torch_Metal on fixed outer walls as landmarks. He fights enemies in narrow corridors (shadowGoats ambush from shifted walls, hellgoats guard junctions near pickups).

He finds ammo at (38, 44) and health at (42, 50).

**HP Math:**
- Time: ~60-90 seconds (maze navigation + combat).
- Damage taken: -15 to -30 HP.
- Health pickup: +25 HP.

**Exiting:** HP ~50-60 | Tension 7

**Issues:**
- [PACING] **SIGNIFICANT.** This is a 60-90 second maze in a game that punishes boredom after 60 seconds without action. With only 4 enemies spread across a 14x14 space, Mike may go 30-40 seconds between encounters. The maze navigation itself is not "action" --- it is walking into walls.
- [MECHANICAL] "Walls slide 1-2 cells laterally, opening and closing paths. The player cannot memorize the maze." This is clever thematically (lies shift) but mechanically frustrating. If a wall Mike just passed through becomes solid, trapping him, he needs a guaranteed escape route. The doc says Torch_Metal on fixed outer walls are landmarks, but it does not guarantee that the maze is always solvable. Recommendation: implement a "max shift" rule --- any wall configuration must maintain at least one path to the exit. If no path exists, force a wall to open.
- [DIFFICULTY] shadowGoats exploiting wall shifts to ambush is terrifying. Mike turns to face a dead end. Turns back. A wall opened behind him and a shadowGoat is RIGHT THERE. This is excellent horror design but may cause actual jump scares that break Mike's flow.
- [SPATIAL] A 14x14 maze with 2-cell-high walls and fog density 0.06 means visibility is ~6 cells. Mike cannot see over walls (no raised floor positions available). He is blind in a shifting labyrinth. Combined with wall-shift disorientation, this could feel lost rather than tense. Recommendation: add 1 raised floor section (FLOOR_RAISED +1) that Mike can use as an orientation point.

---

### Room 6: Counterfeit Arena

**Entering:** HP ~55 | Tension 8

**Experience:** Both paths converge here. The room looks familiar --- "Wait, this looks like Circle 1's Columns room." Six columns arranged in a familiar pattern. Two RAMP segments in the center. Mike recognizes the layout. Comfort of the known.

Doors lock. Wave 1: 3 hellgoats from edges. Mike moves toward a column for cover. The column ATTACKS. It is a mimic. 15 damage.

4 of 6 columns are mimics. Mike is surrounded: hellgoats converging from edges, columns exploding into mimic enemies around him. The familiar layout is a trap.

He retreats to the RAMP segments (real cover, +1 elevation). From the raised position, he can shoot down at hellgoats and mimics. Flamethrower sweeps catch multiple enemies. Kill hellgoats (3), kill mimics (4). Between-wave resupply. Wave 2: 2 shadowGoats flank from ramp sides. Mike fights from the ramp.

**HP Math:**
- Time: ~50-70 seconds.
- Mimic damage: -15 to -30 HP (1-2 mimic column hits).
- Hellgoat damage: -10 to -20 HP.
- shadowGoat damage: -8 to -16 HP.
- Health pickup between waves: +25 HP.
- Ammo x2: ammo refill.

**Exiting:** HP ~30-55 | Tension 9

**Issues:**
- [PACING] The Circle 1 callback is brilliant. The recognition-then-betrayal is the core of Fraud's design. This is the best-designed room in Circle 8.
- [DIFFICULTY] 3 hellgoats + 4 mimics in wave 1 = 7 enemies simultaneously. The mimics at 6 HP die quickly, but 4 of them exploding at 15 damage each while 3 hellgoats converge is OVERWHELMING. Mike will panic and retreat to the ramps. This is the intended play. But if Mike does not immediately recognize the ramps as safe cover (they are "ugly, utilitarian" --- not visually distinct cover), he may circle the room looking for safety while taking hits. Recommendation: make the ramps visually distinct --- a different color or texture than the surrounding floor.
- [MECHANICAL] The wave sequence is: Wave 1 (hellgoats + mimic columns) -> Wave 2 (shadowGoats). The mimics trigger when Mike approaches columns for cover during wave 1. But what if Mike does not approach any columns? If he stays in the open and fights hellgoats at range, the mimics may never trigger. The doc says mimics trigger "on approach" --- if Mike never approaches, do the columns stay inert forever? Recommendation: have wave 1 clear trigger force-reveal remaining mimics.

---

### Room 7: Mimic's Den

**Entering:** HP ~40 | Tension 8

**Experience:** 8 pickups scattered across the room: 4 health, 4 ammo. Of these, 4 are randomly mimics. 50/50 chance on each pickup.

Mike has now learned (painfully) that pickups can be mimics. He knows the flamethrower range (4 cells, though doc says 3 for mimic counter) exceeds the mimic trigger range (2 cells). He sweeps the flamethrower before each pickup. The flame triggers mimics at safe distance.

He systematically sweeps and collects. 4 mimics trigger (identified by flame), 4 real pickups grabbed. The Cauldron in the center is an honest landmark.

**HP Math:**
- Time: ~40-50 seconds (systematic sweep).
- Mimic damage: 0 to -15 HP (flamethrower counterplay should prevent hits, but Mike may miss 1).
- Real pickups: 2 health (+50 HP), 2 ammo.

**Exiting:** HP ~75-90 | Tension 6

**Issues:**
- [PACING] If Mike has learned the flamethrower-sweep counterplay, this room is methodical rather than tense. Sweep, collect, sweep, collect. It becomes a chore. If he has NOT learned the counterplay, it is 50/50 whether each pickup helps or hurts --- which is engaging but potentially lethal.
- [RESOURCE] The random mimic assignment means Mike might get lucky (all 4 mimics are ammo, all 4 health are real) or unlucky (all 4 mimics are health, all 4 ammo are real). In the unlucky case, Mike gets zero health in a room where he needs it before the boss. Recommendation: guarantee at least 1 real health pickup by making the mimic assignment semi-random (max 2 of 4 health pickups can be mimics).
- [MECHANICAL] The flamethrower-sweep counterplay trivializes mimics. Once Mike knows "flamethrower first, then grab," mimics are a non-threat. They become a tedious mandatory step rather than a threat. Recommendation: some mimics should be IMMUNE to flamethrower reveal (they only trigger on direct touch), keeping the paranoia alive. Mark these as "hardened mimics" that look slightly different (a faint shimmer).

---

### Room 8: Serenissima (Secret)

**Entering:** HP ~80 (if Mike finds it) | Tension 2

**Experience:** Mike checks the east wall of Mimic's Den (he knows secret walls exist). WALL_SECRET found. Inside: raw unfinished marble walls. 2 health, 2 ammo. ALL real. Zero mimics. BookStand: *"Truth hides where no one looks."*

Mike sweeps with flamethrower anyway (paranoia). Nothing triggers. He grabs everything. The irony: the only honest room in Circle 8.

**HP Math:**
- Pickups: +50 HP (2 health).
- Time: ~15 seconds.

**Exiting:** HP 100 (capped) | Full ammo | Tension 1

**Issues:**
- [NARRATIVE] This is one of the best-designed rooms in the game. The thematic payoff (honesty in a circle of lies) is perfect. The BookStand inscription is resonant. The raw marble texture versus the polished marble of every other room communicates authenticity without words.
- [RESOURCE] Without this room, Mike enters the boss at ~80 HP. With it, he enters at 100. The secret room is a significant advantage but not a survival requirement (unlike the Butcher's Hook in Circle 7). This is the correct balance for a secret room.

---

### Room 9: Inganno's Parlor (Boss)

**Entering:** HP 100 (with secret) or ~80 (without) | All weapons | Tension 10

**Experience:** Mike descends to elevation -1. Elegant sitting room. Bookcases, chandelier, banners. Inganno sits in a chair. *"Welcome, little goat. You must be so tired. Sit. Rest."*

Mike approaches (he must get within 3 cells to trigger the fight). Inganno stands. 4 mimic pickups appear across the room and unfold into enemies. She fires slow charm projectiles (homing, pink, 8 damage).

**Phase 1 (100%-60% HP) --- The Hostess:**
Mike fights 4 mimics (6 HP each, fast) while dodging Inganno's charm projectiles. Mimics die quickly to flamethrower sweep. Then Mike focuses on Inganno, hitting her with ranged weapons while dodging charm projectiles.

Time: ~40-50 seconds. Damage taken: -15 to -30 HP (mimics + charm projectiles).

**Phase 2 (60%-30% HP) --- The Mirror:**
Inganno creates a mirror clone of Mike. Same weapon, same speed, same HP percentage. The clone mirrors Mike's movement from 3 seconds ago (delayed replay). This is FASCINATING. Mike fights himself while dodging Inganno's continued charm projectiles.

The delayed replay means the clone is predictable if Mike recognizes the pattern: "it does what I did 3 seconds ago." Mike can exploit this by moving erratically, then positioning so the clone moves into his line of fire 3 seconds later.

Time: ~50-70 seconds. Damage taken: -20 to -40 HP (clone attacks + charm projectiles). The clone has Mike's weapons --- if Mike has been using the flamethrower, the clone flamethrowers him. If Mike has been using the cannon, the clone cannons him.

**Phase 3 (30%-0% HP) --- The Truth:**
The beautiful room SHATTERS. Marble becomes rust. Tiles become rust. Silk becomes concrete. The chandelier shifts from warm gold to cold blue. Fog clears. Inganno's true form: serpentine lower body (Geryon reference). She lunges across the room (charge attack, 20 damage, 2-second recovery window).

Mike must dodge lunges and punish during recovery. Flamethrower during recovery windows. The visual transformation is stunning --- the entire room changes.

Time: ~40-60 seconds. Damage taken: -20 to -40 HP (lunges, 1-2 hits at 20 damage each).

**HP Math (full boss):**
- Total time: ~130-180 seconds.
- Total damage: -55 to -110 HP.
- Health pickups: 2 in room (+50 HP).
- Mike enters at 100, exits alive at ~40-95 HP.

**Exiting:** HP ~50-80 | ALIVE | Tension 10 -> 2 (relief)

**Issues:**
- [DIFFICULTY] This boss is well-balanced. Three distinct phases, clear mechanics, escalating threat. Mike dies 1-2 times maximum, most likely to the Phase 3 lunge (20 damage charge is punishing if Mike does not expect the speed increase after the transformation).
- [MECHANICAL] Phase 2 mirror clone: "A clone with the SAME weapons as Mike is potentially harder than the boss herself." This is true. If Mike has the flamethrower + cannon, the clone has flamethrower + cannon. The clone deals Mike's own damage output back at him. However, the 3-second delay makes the clone predictable. The real danger is the clone + Inganno's charm projectiles simultaneously. **Key question:** What weapon does the clone use? Mike's CURRENT weapon? His BEST weapon? Random selection from his arsenal? The doc says "player's current weapon" --- but Mike switches weapons. Does the clone switch too (3 seconds delayed)? Recommendation: clone uses the weapon Mike was using when Phase 2 triggered. It does not switch. This makes the clone predictable and rewards players who notice.
- [CLARITY] Phase 3 texture swap (Marble -> Rust): this is visually spectacular but gameplay-irrelevant. The visual shock is the point. However, the floor texture change might cause Mike to think the floor is now hazardous (Rust003 was THORN DAMAGE in Circle 7). If Mike hesitates to touch the floor, he will die. Recommendation: brief text flash "THE FLOOR IS SAFE --- THE FACADE HAS FALLEN" or simply: the floor does NOT become a damage zone despite the texture change.
- [NARRATIVE] *"All beauty is a mask."* The reveal is emotionally impactful. The serpentine form is the truth. The cold blue light is excellent. This is a strong boss fight narratively.

---

### Circle 8 Summary

**Deaths:** 1-3 total.
- Probable death 1: Bolgia of Flatterers (first mimic surprise, especially if below 50 HP).
- Probable death 2: Counterfeit Arena (column-mimic + hellgoat overwhelm).
- Probable death 3: Boss Phase 3 lunge (20 damage charge, speed increase surprise).

**Mimic Impact Analysis:**
- Mimics are introduced in Bolgia of Flatterers (Room 3). By Room 6 (Counterfeit Arena), Mike should understand the flamethrower counterplay. By Room 7 (Mimic's Den), mimics are a solvable puzzle.
- The mimic learning curve is: surprise (Room 3) -> paranoia (Room 4-5) -> counterplay discovery (Room 6-7) -> mastery (Room 7-8). This is a good progression.
- Risk: if Mike never discovers flamethrower sweeping as counterplay, he remains paranoid throughout. The game needs to teach this mechanic explicitly.

**Pacing Concerns:**
- Circle 8 has 9 rooms with no bleeding mechanic. The pacing is significantly slower than Circle 7. After the relentless time pressure of Violence, Fraud's cautious paranoia is a sharp contrast.
- The Shifting Maze (Room 5) is the weakest room for pacing. 60-90 seconds in a maze with sparse enemies risks boredom.
- The Bolgia of Thieves (Room 4) also slows the pace with vanishing items. Two consecutive "frustration" rooms (Thieves + Maze) without a satisfying combat encounter could test Mike's patience.

**Recommendations:**
1. **Teach flamethrower-sweep counterplay explicitly** after the first mimic encounter. UI tooltip or scroll text.
2. **Reduce first mimic damage** from 15 to 10. Later mimics can deal 15.
3. **Guarantee solvability** of the Shifting Maze --- always maintain at least one path to exit.
4. **Add 1-2 enemies** to the Shifting Maze to reduce gaps between encounters.
5. **Clarify that Phase 3 rust floor is not a damage zone** (visual/tooltip cue to prevent Circle 7 association).
6. **Specify mirror clone weapon behavior** (uses weapon active at Phase 2 start, does not switch).

---

## Procedural Floors: Circle 8 to Circle 9 Transition

Mike completes Circle 8 and enters Treachery-themed procedural floors. He gains approximately:
- ~20 mixed ammo
- Some health pickups (assume +50 HP total, heal to 100)
- No new weapons
- 2-3 procedural floor encounters

**Entering Circle 9:** HP 100 | All weapons + Flamethrower ~60 fuel | Ammo partially refilled. Mike is a veteran. He expects the worst. He is correct.

---

## Circle 9: Treachery

### Room 1: Glacial Stairs

**Entering:** HP 100 | All weapons + Flamethrower | Tension 6

**Experience:** The temperature drops. Mike's breath frosts. Unlit lanterns on walls --- nothing burns this deep. An 8x16 room descending from elevation 0 to -3 across 5 landings. Icy ramps between landings (0.6x friction --- very slippery). Ramps are 4 cells wide in an 8-cell room --- edges drop to side alcoves.

Mike starts descending. First ramp: he slides. The ice friction is immediately felt. He overshoots landing 1. At landing 2: a shadowGoat ambushes from an alcove. Mike shoots --- and the missed shot hits the far wall and BOUNCES BACK at him. First encounter with reflected shots. -75% of bullet damage.

Mike takes the reflected pistol shot: -7 HP (pistol damage ~10, reflected at 75% = ~7.5). He also takes shadowGoat damage: -8 HP. He kills the shadowGoat. Grabs ammo.

He continues descending. At landing 3, a fireGoat fires UP at him from below (blue-white fire variant). Mike returns fire downward. Missed shots hit the landing floor and bounce up --- at him. He takes another reflected hit.

At landing 4: second shadowGoat ambush. Mike engages. Takes another hit. Grabs health pickup.

He reaches the bottom at elevation -3.

**HP Math:**
- Time: ~40-50 seconds.
- Reflected shot self-damage: -7 to -15 HP (1-2 reflected hits).
- Enemy damage: -16 to -24 HP (2 shadowGoats + 1 fireGoat).
- Health pickup: +25 HP.

**Exiting:** HP ~86-92 | Tension 7

**Issues:**
- [MECHANICAL] **The reflected shots mechanic is introduced perfectly.** The first reflected hit is Mike's OWN pistol shot bouncing back from a wall he missed. The cause-and-effect is clear: "I shot, I missed, it came back." The visual cue (blue-white trail) and audio cue ("zing" ricochet) reinforce the lesson. The Glacial Stairs are a controlled environment for learning: long sightlines, few enemies, the reflected shots are noticeable. Excellent design.
- [CLARITY] However, the doc does not specify whether the PLAYER knows WHY the shot bounced. Mike sees his shot bounce back with a new trail color and ricochet sound. Does a UI tooltip appear? ("WARNING: Reflected shots bounce off walls in this circle.") Without explicit communication, Mike might think it was an enemy projectile he did not see. Recommendation: brief first-time tooltip on first reflected shot.
- [DIFFICULTY] The ice friction (0.6x) on ramps is aggressive. If Mike slides off a landing, he takes 1-2 HP fall damage AND lands in an alcove with a shadowGoat. The slide is a positioning mechanic, not a death sentence --- this is good.

---

### Room 2: Caina --- Betrayers of Family

**Entering:** HP ~89 | Tension 7

**Experience:** A 16x14 frozen lake. Ice pillars (6 total). 3 Blue goatKnights frozen in ice at intervals. 1 shadowGoat patrolling behind pillars. Ice001 floor (0.8x friction --- slippery).

Mike approaches. At 4-cell proximity, the first Blue goatKnight SHATTERS from the ice. 1-second stun. Then it attacks. HP 20 --- these are TANKY.

Mike opens with the flamethrower (no reflection risk). DOT: 2 dmg/s x 5s = 10 per burn. Two full burn applications needed to kill a Blue goatKnight. At 4-cell range, Mike is in melee danger. The goatKnight swings. Mike retreats behind an ice pillar --- but the pillar REFLECTS his shots if he uses ranged weapons. He sticks with flamethrower.

Kill 1. He approaches the second goatKnight. Breaks from ice. Same pattern. Kill 2. The shadowGoat flanks from behind pillars while Mike focuses on the third goatKnight. Kill 3 (goatKnight). Kill 4 (shadowGoat).

Grabs ammo x2 and health at center (risky, near goatKnight positions).

**HP Math:**
- Time: ~60-80 seconds.
- goatKnight damage: -20 to -40 HP (3 goatKnights, melee range during flamethrower combat).
- shadowGoat damage: -8 to -12 HP.
- Reflected shot self-damage: -0 to -15 HP (depends on weapon choice --- flamethrower = 0 reflected).
- Health pickup: +25 HP.

**Exiting:** HP ~52-76 | Tension 8

**Issues:**
- [DIFFICULTY] Blue goatKnights at 20 HP are very tanky. With flamethrower DOT (2 dmg/s x 5s = 10 per application), each knight needs 2 full 5-second burn cycles = 10 seconds of sustained flamethrower contact per knight. During those 10 seconds, Mike must stay within 4-cell range of a melee enemy on slippery ice. If Mike uses ranged weapons instead, reflected shots punish misses. The flamethrower is the ONLY viable weapon, and it forces close-range combat against tanky melee enemies. This is fair but demands precision.
- [DIFFICULTY] With pistol: 20 HP / ~5 damage per shot (estimated) = 4 shots per knight. At a reasonable hit rate of 60% (reflected shots account for 40% misses becoming self-damage), that is ~7 shots fired, 3 reflected back at ~3.75 damage each = ~11 HP self-damage per knight engagement. Three knights = ~33 HP self-damage. This is BRUTAL if Mike does not use the flamethrower. The game MUST communicate that the flamethrower is the safest weapon in Circle 9.
- [MECHANICAL] "Strategic positioning: angle shots so reflected projectiles travel toward OTHER frozen goatKnights, pre-damaging them." This is a depth mechanic that rewards skilled play. However, Midcore Mike will NOT discover this on a first playthrough. It requires understanding of reflection angles under combat pressure. This is fine as an optional depth layer.
- [SPATIAL] 6 ice pillars provide cover but also reflection surfaces. Mike's instinct to duck behind pillars is correct (blocks melee) but creates reflection hazards (ranged shots bounce off pillars). This creates a genuine tension between cover and shooting --- excellent spatial design.

---

### Room 3: Antenora --- Betrayers of Country

**Entering:** HP ~64 | Tension 8

**Experience:** Narrow corridors. 3 cells wide, 1 cell thick walls. Frozen banners and shields on walls. Chain_Coil frozen to ceiling. The corridors are LONG (12x16 room with winding passages).

The reflected shot mechanic is LETHAL here. A missed pistol shot travels down the corridor, hits the far wall, and bounces STRAIGHT BACK along the corridor length. In a 3-cell-wide corridor, there is almost no room to dodge the reflected shot. Mike learns this the hard way.

3 shadowGoats hide in frozen alcoves. They emerge BEHIND Mike after he passes. He turns around --- a shadowGoat is right there, and he instinctively fires the pistol. The shot hits the shadowGoat (good) but if he misses, the shot continues down the corridor behind the shadowGoat, hits the wall, and comes back (bad). Flamethrower is essential. Its 3-cell range fills the corridor width without reaching the walls.

1 fireGoat at a corridor intersection. Mike cannot fight it at range without reflected shots punishing him. He must close to flamethrower range.

**HP Math:**
- Time: ~50-70 seconds.
- shadowGoat damage: -12 to -24 HP (ambushes from behind).
- fireGoat damage: -8 to -16 HP.
- Reflected shot self-damage: -10 to -25 HP (narrow corridors guarantee some reflected hits).
- Health pickup near south exit: +25 HP.

**Exiting:** HP ~39-59 | Tension 9

**Issues:**
- [DIFFICULTY] The narrow corridors make reflected shots nearly unavoidable for any ranged weapon. Flamethrower is the ONLY safe option. If Mike's flamethrower fuel is running low (he has been using it since Circle 7), he is forced to use ranged weapons and eat reflected shots. **How does flamethrower fuel regenerate?** The doc says "100 fuel, regenerates slowly or found in pickups." If fuel is limited and no flamethrower ammo pickups exist in Circle 9, Mike may run out. The level-wide pickup list for Circle 9 only shows "ammo" pickups --- is flamethrower fuel included in "ammo"? This needs clarification.
- [DIFFICULTY] shadowGoats ambushing from BEHIND in narrow corridors is terrifying. Mike's instinct to shoot backward will create reflected shots coming from the direction he was previously walking. The spatial awareness required is high.
- [MECHANICAL] The flamethrower's 3-cell range exactly filling 3-cell-wide corridors is a brilliant design constraint. It means Mike can use the flamethrower without hitting walls, but ONLY in corridors of 3+ cell width. If any corridor is narrower (2 cells), even the flamethrower might clip walls. The doc says all corridors here are 3 wide --- verify this constraint.

---

### Room 4: Ptolomea --- Betrayers of Guests

**Entering:** HP ~49 | Tension 8

**Experience:** A 14x10 room with a LOW ceiling (1.5 cells). A frozen feast table in the center. Chairs around it, chalices mid-pour. 2 Blue goatKnights frozen at the table. 1 fireGoat frozen behind a barrel.

Mike enters. The thaw trigger activates. Ice cracks. The 2 goatKnights stand, pushing the table aside. 3 seconds later, the fireGoat thaws. Low ceiling = no arcing shots, everything is flat trajectory, maximizing reflection danger. Close quarters with low ceiling = flamethrower dominance.

Mike uses flamethrower on the goatKnights. At 20 HP each, they take 10 seconds of sustained fire each. The low ceiling makes the room feel claustrophobic. The fireGoat starts firing from behind the barrel 3 seconds after the knights.

**HP Math:**
- Time: ~40-50 seconds.
- goatKnight damage: -15 to -30 HP (2 melee goatKnights in close quarters).
- fireGoat damage: -8 to -16 HP (fires from cover).
- Reflected shot self-damage: -5 to -15 HP (low ceiling + close walls).
- Health pickup: +25 HP.
- Ammo pickup: refill.

**Exiting:** HP ~24-49 | Tension 9

**Issues:**
- [DIFFICULTY] 2 Blue goatKnights (20 HP each) in a low-ceiling room with reflection hazards. This is tough but fair --- the flamethrower can handle both, and the 3-second delay before the fireGoat thaws gives Mike time to focus. However, Mike may be entering this room at ~49 HP, and losing 20-45 HP here puts him at 24-29 HP heading into Giudecca (the ARENA). This is dangerously low.
- [CLARITY] The frozen feast is excellent environmental storytelling. Chalices mid-pour, chairs knocked over. The thematic resonance (betrayers of guests at a poisoned feast) is immediately legible. However, the GAMEPLAY impact is "enemies frozen, they thaw, fight." The narrative dressing adds atmosphere but does not change the mechanical experience from Caina's "approach, they break free, fight." Recommendation: add a unique Ptolomea mechanic --- the table itself is an obstacle that can be PUSHED (environmental interaction). Mike can shove the table into goatKnights, staggering them for 2 seconds. This makes the room feel distinct and rewards environmental awareness.
- [SPATIAL] The Barrel in the SE corner provides "minimal cover" --- but the fireGoat uses it as cover too. Mike and the fireGoat are both using the same piece of cover from opposite sides. This creates an awkward peek-and-shoot dynamic at very close range with reflected shots. Fun, but cramped.

---

### Room 5: Giudecca --- Betrayers of Lords (Arena)

**Entering:** HP ~36 | Tension 10

**Experience:** THE arena. 18x16. Frozen waterfall on the back wall. Ice pillars. Doors lock. This is the climactic combat encounter of Circle 9 (before the boss).

**Wave 1: 2 Blue goatKnights from the frozen waterfall.** Methodical, tanky. Mike uses flamethrower. The waterfall begins cracking --- ice chunks fall (2 chunks, 10 damage each, every 8 seconds, random positions). Mike must dodge falling ice while fighting goatKnights.

Kills: 2 x goatKnights. HP restored: N/A (no bleeding mechanic in Circle 9). Time: ~20-30 seconds. Damage: -15 to -30 HP + ice chunk risk (-10 per hit, 0-1 hits).

15-second break. Resupply spawns: ammo x2, health x2. Mike grabs health. HP recovery: +50 HP (2 health).

**Wave 2: 2 shadowGoats + 1 fireGoat (elevated).** Floor begins cracking --- 4 floor sections (3x3 cells) break and fall over 20 seconds. The traversable area shrinks. shadowGoats spawn from floor cracks (center), fireGoat on elevated ice chunk.

Mike fights on fragmenting ice. He must track: shadowGoats flanking, fireGoat sniping from elevation, floor sections cracking (visible fracture lines 3 seconds before collapse). Reflected shots bounce off ice platforms and pillars.

Kills: 3 enemies. Time: ~25-35 seconds. Damage: -15 to -30 HP.

10-second break. Resupply refreshes.

**Wave 3: 1 goatKnight + 1 shadowGoat + 1 fireGoat.** All types simultaneously on fragmented ice platforms. Floor continues cracking. Maximum reflected shot chaos.

Kills: 3 enemies. Time: ~20-30 seconds. Damage: -15 to -30 HP.

**HP Math (full arena):**
- Starting: ~36 HP.
- Wave 1: 36 - 22 (combat) - 5 (ice) = ~9 HP.
- Resupply: 9 + 50 (2x health) = ~59 HP.
- Wave 2: 59 - 22 (combat) = ~37 HP.
- Resupply: 37 + 50 (refresh) = ~87 HP.
- Wave 3: 87 - 22 (combat) = ~65 HP.

**Exiting:** HP ~55-75 | Tension 10 -> 6

**Issues:**
- [DIFFICULTY] Mike enters at ~36 HP. Wave 1's 2 goatKnights could kill him before the resupply spawns. The 15-second break and generous resupply (2 health per break) save him --- but ONLY if he survives wave 1 at sub-40 HP. This is the highest-stakes moment: Mike must play perfectly through wave 1 at the lowest HP he has had in Circle 9.
  - Recommendation: add a single health pickup at the START of the room (on entry, before doors lock) to give Mike a buffer. Even +25 HP makes the difference between "barely possible" and "fair challenge."
- [DIFFICULTY] The floor collapse mechanic (4 sections in wave 2, 2 more in wave 3 = 6 total 3x3 sections lost from an 18x16 room) is dramatic but may not severely reduce traversable area. 6 x 3x3 = 54 cells lost from a 288-cell room = 19% reduction. This is noticeable but not claustrophobic. The visual impact (seeing void below) is scarier than the mechanical impact. Consider increasing to 8 sections (28% reduction) for more pressure, OR make remaining platforms unevenly distributed so some areas become isolated islands.
- [MECHANICAL] Falling ice chunks (10 damage, 2x2 area, every 8 seconds) combined with floor collapse combined with reflected shots combined with 3 enemy types = maximum cognitive load. Mike must track 5 distinct threat vectors simultaneously. This is appropriate for the penultimate encounter of the game, but it is EXHAUSTING. The 15-second and 10-second breaks between waves are essential. Do NOT reduce them.
- [PACING] Wave composition is excellent: Wave 1 (tanky, slow, methodical), Wave 2 (mixed, dynamic, floor breaking), Wave 3 (everything at once, chaos). The escalation curve within the arena mirrors the escalation across all 9 circles.

---

### Room 6: Judas Trap (Secret)

**Entering:** HP ~65 (if Mike finds it) | Tension 2

**Experience:** Mike checks the west wall of Giudecca after the arena. WALL_SECRET. Inside: small room. Generous pickups (2 health, 2 ammo). A frozen codex listing traitor names --- "The traitors who built this place, and the traitor who reads this." A Cage_Small with a frozen goat inside --- a previous scapegoat.

*"You are not the first."*

Mike grabs the pickups. The narrative hit is quiet but devastating.

**HP Math:**
- Pickups: +50 HP (2 health). HP: capped at 100.

**Exiting:** HP 100 | Full ammo | Tension 3

**Issues:**
- [NARRATIVE] The frozen previous scapegoat is the best narrative beat in the entire game. It recontextualizes everything. Mike has been the hero. Now he learns he is one in a LINE of scapegoats. The sacrifice is not unique --- it is institutional. This is deeply unsettling.
- [RESOURCE] The generous pickups before the final boss are correct. Mike needs to enter Azazel's chamber at 100 HP.

---

### Room 7: Cocytus Bridge

**Entering:** HP 100 (with secret) or ~65 (without) | Tension 6 -> 3

**Experience:** Mike exits Giudecca and steps onto a narrow ice bridge. 4 cells wide. 24 cells long. Void on both sides. No enemies. No pickups. No props. Just ice, wind, and silence.

After the intensity of Giudecca, the silence is DEAFENING. Mike walks forward. The wind is loud --- the loudest in the game. Snow drifts horizontally. His footsteps echo on ice. A faint heartbeat SFX. The far end of the bridge is barely visible.

He walks for ~15 seconds. Nothing happens. The void below has a faint indigo glow. No ceiling --- open to darkness above. The bridge behind disappears into darkness.

The door to Azazel's chamber materializes ahead.

**HP Math:**
- No enemies. No damage. No pickups. ~15 seconds of walking.

**Exiting:** HP 100 (unchanged) | Tension 8 (building anticipation)

**Issues:**
- [PACING] **CRITICAL DESIGN QUESTION.** The bridge is 24 cells = 48 world units. At normal walk speed (~4 units/second with ice friction), this is ~12 seconds of walking. Mike's persona says "gets bored if more than 60 seconds pass without something happening." 12 seconds is well under that threshold. The bridge WORKS as a contemplative beat.
  - HOWEVER: the bridge feels SHORT for its narrative ambition. "The longest non-combat sequence in the game" needs to feel LONG to land emotionally. 12 seconds is not long --- it is a corridor. Recommendation: increase bridge to 36 cells (72 world units, ~18-20 seconds walk). Add subtle environmental storytelling: frozen silhouettes in the ice below (previous scapegoats who fell?), inscriptions carved into the bridge surface (readable if Mike looks down), and a gradual shift from wind noise to silence as Mike approaches the door. The silence at the end should be total.
- [SPATIAL] 4 cells wide with 0.85x friction is safe --- Mike will not accidentally fall. This is correct. The bridge should NOT be a platforming challenge. It is a mood.
- [NARRATIVE] The absence of gameplay IS the gameplay. After 2+ hours of constant combat, the sudden silence is more unsettling than any enemy. This is the game's most confident design choice. Do not add enemies, hazards, or pickups to the bridge. The emptiness is the point.

---

### Room 8: Azazel's Frozen Throne (Boss)

**Entering:** HP 100 | All weapons | Tension 10

**Experience:** 20x20 cells --- the largest boss room in the game. Black ice floor. Azazel stands frozen waist-down in a 4x4 ice formation at center. A single shaft of pale light illuminates him. Chain_Coil hang from the ceiling marking arena quadrants.

*"You came."* Pause. *"I have been waiting since the first goat was cast out."*

**Phase 1 --- Sins Reflected (100%-50% HP):**

Mike shoots Azazel. The shot bounces back AMPLIFIED (1.5x damage, faster). Mike takes his own cannon round at 1.5x damage: devastating. He tries the flamethrower. The fire turns blue-white and arcs back in a cone. Even the flamethrower reflects here.

Mike is confused. How do I damage this boss? He empties more ammo into Azazel. More reflected shots. More self-damage.

**THIS IS THE CRITICAL TEACH FAILURE.**

The doc says: "The only way to damage him: SHOOT THE ICE." But how does Mike KNOW this? Nothing in the game has taught "shoot the environment, not the boss." For 2+ hours, Mike has been shooting enemies to kill them. Now every shot at the boss hurts Mike. His instinct is to try different weapons. When all weapons reflect, he may assume the boss is invincible and that he is missing a mechanic --- but the mechanic (shoot the ice formation) is not communicated.

**Design question:** What visual cue tells Mike to shoot the ice? Options:
- The ice formation has cracks/weak points that glow (visual target).
- When Mike's reflected shot hits the ICE (not Azazel), the ice cracks visibly. Mike notices this and deliberately targets ice.
- A text prompt: *"His power flows through the ice. Break it."*
- Azazel himself taunts: *"Strike me? Your violence only feeds me. Strike the chains that bind us both."*

Without a clear teach, Mike will die 2-3 times to self-reflected damage before realizing the mechanic. Each death is FRUSTRATING because the cause (his own shots) feels unfair.

Assuming Mike learns the mechanic (target the ice):
- 8 ice sections, each destroyed deals 12.5% of Phase 1 HP.
- Mike shoots ice sections while dodging reflected shots that hit Azazel (they bounce toward the ice formation too, potentially hitting other sections).
- Floor fragments as ice breaks. Platforming begins.

Time: ~60-90 seconds. Self-reflected damage: -30 to -60 HP (learning period). Ice falling: -10 to -20 HP.

**Phase 2 --- Azazel Breaks Free (50%-10% HP):**

Ice shatters. Azazel rises to full height. Floor fragments into 12-15 floating platforms over void. Mike fights on platforms, jumping between them.

Azazel's attacks:
- Antler sweep: 180-degree, 3-cell range, 6 damage. 1-second telegraph.
- Ground stamp: 4-cell AoE, 10 damage, platform collapse in 3 seconds. Shockwave pushes Mike.
- Ice breath: 5-cell cone, 45-degree, 8 damage + slow.

Flamethrower works normally on Azazel now (no longer immune to direct damage). Other weapons still reflect off remaining ice surfaces (platforms). Mike uses flamethrower at close range while dodging attacks.

The platform-jumping combat is UNIQUE in the game. Mike has never fought a boss on fragmented terrain over void. The platforming is the challenge: staying on platforms, dodging AoE, finding footing after shockwave pushback.

Time: ~90-120 seconds. Damage taken: -40 to -80 HP. Falls: -15 to -30 HP (falling through void = teleport back).

Health pickups: 3 health in the room (+75 HP). Mike needs all of them.

**Phase 3 --- The Revelation (10%-0% HP):**

Azazel stops fighting. Drops his arms. Does not fall. Stands on the largest remaining platform.

*"You were sent to me. The scapegoat, bearing the sins of others, cast into the wilderness toward Azazel. That is the ritual. You have completed it perfectly."*

*"Every goat you killed, every circle you descended --- you carried their sin deeper and deeper, and delivered it to me. I am the garbage dump of sin. You are the delivery mechanism."*

*"The irony: by fighting through Hell, you fulfilled the scripture."*

He sits. Fog clears. Silence.

Azazel cannot be killed. He takes no damage. Mike can try. Nothing happens.

**HP Math (full boss):**
- Phase 1: 100 - 45 (reflected) - 15 (ice) = ~40 HP. Grab 1 health: ~65 HP.
- Phase 2: 65 - 60 (combat) - 20 (falls) = ~-15 HP. Grab 2 health: ~+35 HP = ~35 HP.
- Total boss: Mike enters at 100, uses 3 health pickups (+75), takes ~140 damage. Exits at ~35 HP.
- Survivable, but TIGHT. If Mike takes extra self-damage in Phase 1 (learning period), he dies.

**Exiting:** Game complete. Ending triggers.

**Issues:**
- [CLARITY] **CRITICAL.** Phase 1's "shoot the ice, not the boss" mechanic has NO clear teach. Mike will shoot Azazel (because that is what you do to bosses), take reflected damage, and die. He will repeat this 2-3 times before either:
  (a) Accidentally hitting the ice and noticing the crack/damage.
  (b) Giving up and searching online.
  (c) Getting a hint from the UI.
  **Option (a) is unreliable.** If Mike is focused on Azazel (the obvious target), stray shots hitting the ice are incidental. He may not notice the ice cracking.
  **Recommendation:** Multiple layered hints:
  1. Azazel's reflected shots that miss Mike and hit the ICE cause visible cracks. The connection: "things that hit the ice damage the ice."
  2. After 15 seconds of Phase 1 (if no ice sections destroyed), Azazel taunts: *"You cannot hurt me. But the ice... the ice remembers every blow."*
  3. The ice formation has 8 glowing weak points (different color from the ambient blue --- perhaps warm orange cracks, suggesting fire/impact).
  4. The flamethrower specifically should create visible melting effects on the ice when aimed near it, even before Phase 1 starts.

- [MECHANICAL] **Phase 1 flamethrower reflection.** The doc says "Flamethrower's fire turns blue-white and arcs back in a cone." But the flamethrower was the ONLY weapon immune to reflection everywhere else in Circle 9. If it suddenly reflects off Azazel, Mike loses his ONE safe weapon. This is thematically interesting (Azazel is beyond even fire's honesty) but mechanically devastating. Mike has been trained for 8 rooms that "flamethrower = safe." Now it is not. This is a betrayal in the Circle of Betrayal --- thematically perfect, but the gameplay cost is HIGH.
  **Recommendation:** Let the flamethrower be partially effective in Phase 1 --- it does not reflect, but it deals 0 damage to Azazel directly and DOES melt ice. This teaches the mechanic: "flamethrower melts ice but doesn't hurt him directly." Mike uses flamethrower on ice = learns the ice mechanic naturally.

- [MECHANICAL] **Phase 2 platforms.** 12-15 platforms of 2x2 to 3x3 cells at varying heights. Jumping between them with ice friction (0.8x) is platforming in a game that has not been a platformer. Mike's controls are FPS-oriented. First-person platforming over void is notoriously frustrating in FPS games. If the platform gaps require precise jumps, Mike will fall repeatedly.
  **Recommendation:** Make platforms close enough that walking/running (no jump required) transitions between them. The "jumping" should be small hops over 1-cell gaps, not leaps over 3-cell chasms. Azazel's ground stamp creating forced platform changes is enough spatial challenge without precision platforming.

- [MECHANICAL] Phase 3 invulnerability: "Azazel cannot be killed in phase 3 --- he takes no damage. The player can try. Nothing happens." If Mike keeps shooting during the speech, do reflected shots still damage Mike? If yes, Mike is punished for not realizing the fight is over. If no, the reflected shots mechanic inconsistently turns off.
  **Recommendation:** Phase 3 should disable ALL projectile damage (player's shots pass through Azazel and dissipate, no reflection). This communicates: "the fight is over" without punishing the player.

- [NARRATIVE] **The Revelation speech.** This is the thematic climax of the entire game. The realization that the scapegoat's journey through Hell WAS the ritual. Mike has been the delivery mechanism for sin. The speech needs to LAND. But Mike is in a boss fight. His adrenaline is high. His instinct is to keep shooting. Reading dialogue boxes during combat is not what FPS players do.
  **Recommendation:** Phase 3 transition should be unmissable:
  1. Screen dims. Music cuts to silence.
  2. Camera LOCKS on Azazel (brief cinematic control, 5 seconds).
  3. Speech text appears centered, large font, slow reveal.
  4. Player controls return after the full speech. NO skip option. This is the most important moment in the game.
  If Mike can skip or talk over the speech by shooting, the emotional impact is lost.

- [NARRATIVE] **Binary ending.** Mike has NO IDEA the kill metric exists. He has been playing the game as designed: killing enemies to survive (especially in Circle 7 where NOT killing = death from bleeding). The "skipped >30% optional enemies" threshold feels arbitrary. How many enemies are truly "optional" when Circle 7's bleeding mechanic REQUIRES kills for HP sustain?
  **Recommendation:**
  1. Seed subtle hints throughout the game that killing is being tracked: occasional text flashes ("Another sin carried deeper," "The weight grows," "Blood remembered").
  2. The 30% threshold should be evaluated against truly OPTIONAL enemies only (not enemies in arenas or bosses). If Circle 7's bleeding makes all enemies effectively mandatory, the threshold needs to account for this.
  3. Consider: BOTH endings should feel earned. The Remain ending should not feel like punishment. The text "Sin finds its level" is ambiguous (good). But Mike may feel he "failed" if he gets the Remain ending after playing well. Recommendation: the Remain ending should include a note of dignity: *"Sin finds its level. And you have carried it to the bottom, where it cannot fall further. Rest."*

---

### Circle 9 Summary

**Deaths:** 2-4 total.
- Probable death 1: Boss Phase 1 (shooting Azazel, reflected damage kills Mike before he learns the ice mechanic). 1-3 attempts.
- Probable death 2: Boss Phase 2 (platform falls, combat damage accumulation on fragmented terrain). 0-1 attempts.
- Possible death: Giudecca wave 1 (entering at low HP from Ptolomea). Depends on prior rooms.

**Reflected Shot Impact Analysis:**
- The mechanic forces flamethrower usage. In rooms 1-4 (Stairs through Ptolomea), the flamethrower is the safest weapon. In room 5 (Giudecca), reflected shots add chaos to the arena but are manageable in the large space.
- The mechanic peaks in Antenora (narrow corridors = inescapable reflections) and the Boss Phase 1 (amplified reflections).
- **Flamethrower fuel is the critical resource.** If Mike runs out of fuel, he must use ranged weapons and accept reflection damage. The doc does not specify flamethrower fuel economy across 8 rooms + boss. Assuming 100 fuel and 5 fuel/second burn rate, Mike has 20 seconds of total flamethrower use. That is NOT ENOUGH for 20 enemies + a boss fight. Fuel regeneration or fuel pickups are ESSENTIAL.

**Recommendations:**
1. **Teach Phase 1 ice mechanic explicitly.** Multiple layered hints: Azazel taunt, visible ice weak points, flamethrower-melts-ice interaction.
2. **Flamethrower should NOT reflect off Azazel in Phase 1.** Let it deal 0 direct damage but melt ice, teaching the mechanic naturally.
3. **Disable all projectile damage in Phase 3.** No reflected shots during the speech.
4. **Lock camera during the Revelation speech.** 5-second cinematic with no skip. The speech must land.
5. **Add flamethrower fuel pickups** throughout Circle 9. Without them, the fuel economy does not support the mechanic.
6. **Reduce platform gaps in Phase 2.** Make transitions walkable, not jump-required. First-person platforming over void is frustrating.
7. **Lengthen Cocytus Bridge** from 24 to 36 cells. Add environmental storytelling (frozen silhouettes, inscriptions).
8. **Seed kill-metric hints** throughout all circles. Mike should have SOME awareness that his violence level matters.

---

## Act III Summary

### The Final 30 Minutes

Assuming Mike enters Circle 9 at the ~120 minute mark and spends:
- Glacial Stairs through Ptolomea: ~15 minutes (4 rooms, moderate combat, learning reflected shots).
- Giudecca arena: ~5 minutes (3 waves, resupply breaks, intense).
- Cocytus Bridge: ~15 seconds of walking. Feels like 2 minutes emotionally.
- Azazel boss: ~8-12 minutes (including 2-3 death retries).
- Total Circle 9: ~30-35 minutes.

The pacing of the final 30 minutes:

```
Tension:  7 -- 8 -- 8 -- 9 -- 10 -- 2(secret) -- 3(bridge) -- 10(boss) -- 0(revelation)
          |    |    |    |     |       |            |             |            |
        Stairs Caina Ant. Ptol. Giud.  Judas       Bridge       Azazel       End
```

**The difficulty DOES peak at Giudecca and then DROPS** for Cocytus Bridge before rising again for Azazel. This is the correct structure: climax -> breath -> final climax -> resolution. The bridge is the critical hinge. Without it, Giudecca flows directly into Azazel and there is no emotional reset. WITH it, Mike has 15 seconds to process the arena and prepare for the finale.

**Does the Azazel fight mechanically interest or just gimmick?**
Phase 1 (shoot the ice) is a gimmick if the teach fails. With proper communication (see recommendations above), it is a powerful subversion of boss fight expectations. Phase 2 (fragmented platforms + Azazel free) is genuinely engaging --- the best traditional combat in the game. Phase 3 (speech) is narratively essential and mechanically nothing (invulnerable, no combat). The fight follows a curve: gimmick -> real combat -> narrative payoff.

**Does the Revelation speech land?**
IF the camera locks and Mike cannot skip: YES. The speech is well-written, the thematic revelation is genuine, and the recontextualization of the entire game is powerful. The "delivery mechanism" line is the game's thesis statement.

IF Mike can shoot through the speech: NO. He will be mashing buttons, looking for the next phase, missing the text. **The camera lock is non-negotiable.**

**Does the binary ending feel earned?**
NO --- not without hints throughout the game. Mike has killed everything in his path because the game rewarded and required it (especially Circle 7 bleeding). Being judged for violence he was mechanically incentivized to commit feels hypocritical unless the game acknowledges the tension. The Remain ending must not feel like punishment. The Ascent ending must feel achievable on a replay, not a first playthrough.

### Difficulty Curve

```
Difficulty:  8 -------- 9 ------- 7 -------- 8 ------- 9 -------- 10
             Circle 7    Circle 7   Circle 8    Circle 8   Circle 9    Boss
             (bleed      (boss)     (mimics     (boss)     (reflected  (Azazel)
             pressure)              + fraud)               shots)
```

Circle 7 is the hardest circle due to the bleeding mechanic (ASSUMING the boss is fixed). Circle 8 drops in raw difficulty but introduces cognitive challenge (paranoia, deception). Circle 9 escalates to the highest mechanical difficulty (reflected shots + ice friction + elite enemies + boss). The curve is correct: hard -> moderate-but-novel -> hardest.

### Emotional Arc

```
Emotion:  Dread -> Relief+Betrayal -> Tension -> Exhaustion -> Silence -> Revelation
          Circle 7  Circle 8          Circle 9   Giudecca      Bridge    Azazel P3
```

Mike's emotional journey in Act III:
1. **Circle 7:** Desperate survival. The bleeding mechanic creates constant anxiety. The flamethrower reward is cathartic. The boss is a DPS race against the clock.
2. **Circle 8:** Paranoia. Beauty masking danger. Mike cannot trust anything. The boss revelation (beauty crumbles) is satisfying.
3. **Circle 9:** Resignation and awe. The ice, the silence, the reflected shots. Mike's weapons betray him. The Cocytus Bridge is the emotional nadir --- total emptiness. Then Azazel speaks and reframes everything.

The emotional arc is strong. IF the mechanical issues are fixed (boss bleeding in Circle 7, Phase 1 teach in Circle 9, camera lock on Revelation), this is a powerful endgame.

### Cross-Circle Issues

1. **Flamethrower fuel economy across Act III.** The flamethrower is found in Circle 7 and is essential through Circle 9. Total usage across 3 circles + procedural floors could exhaust fuel reserves unless regeneration or fuel pickups are clearly defined. **This is the single most important systemic issue in Act III.** If Mike runs out of flamethrower fuel in Circle 9, the reflected shots mechanic becomes unsurvivable.

2. **Reflected shot mechanic evolution.** Circle 8 introduces shot reflection on onyx panels (low damage, large room). Circle 9 escalates to full wall reflection (75% damage, tight corridors). This is a good progression. However, the two circles are separated by procedural floors that do NOT have reflected shots. Mike may forget the mechanic exists by the time he reaches Circle 9. Recommendation: procedural floors between Circle 8 and 9 should include 1-2 ice-themed rooms with reflected shots to maintain awareness.

3. **Thorn damage texture (Rust003/007) reuse.** Rust003/007 is "thorn damage" in Circle 7, "revealed truth" in Circle 8 (Phase 3 texture swap), and NOT a damage surface in Circle 8. Mike may fear walking on Rust003 floors in Circle 8's boss Phase 3 because he learned "rust = pain" in Circle 7. Clarify through gameplay (no damage when Mike touches the rust floor in Circle 8) or change Circle 8's reveal texture to something distinct.

4. **Enemy variety stagnation.** goatKnights, hellgoats, fireGoats, and shadowGoats appear in all three circles. Blue goatKnights (Circle 9) and mimics (Circle 8) are the only new types. After 9 circles, the core 4 enemy types may feel repetitive even with different behaviors. The variant coloring (Dark, Crimson, Brown, Gray, Blue) helps visually, but the MECHANICS of fighting each type have not changed since Circle 1. Recommendation: give Circle 9 goatKnights a new attack (ice charge, ground slam, etc.) to keep the core enemy type feeling fresh.

5. **Health pickup dependency.** Across all three circles, health pickups are the ONLY way to sustain Mike's HP (beyond Circle 7's kill-restore mechanic). The placement of health pickups determines whether Mike survives each room. A single misplaced or missed health pickup can cascade into death 2-3 rooms later. The design should audit every room transition to ensure Mike can survive the NEXT room at the HP he exits the CURRENT room (worst case, assuming he misses optional pickups).

### Recommendations (Priority Order)

**Must Fix (game-breaking or severely unfun):**

1. **Circle 7 Boss bleeding.** Add mob spawns between phases OR pause bleeding in boss arena. The current math makes the fight impossible.
2. **Circle 9 Boss Phase 1 teach.** Add multiple layered hints for "shoot the ice" mechanic. Azazel taunt, visible weak points, flamethrower-melts-ice.
3. **Circle 9 Phase 3 camera lock.** The Revelation speech MUST have a brief cinematic with no skip. This is the game's thesis.
4. **Flamethrower fuel economy.** Define fuel regeneration rate and fuel pickup frequency across Circles 7-9. Without this, the reflected shots mechanic in Circle 9 is unsurvivable.

**Should Fix (significant quality-of-life):**

5. **Circle 7 Thorny Passage width.** Widen from 2 to 3 cells. Too punishing for strafe players.
6. **Circle 7 Slaughterhouse health timing.** Move health resupply from between waves 2-3 to between waves 1-2.
7. **Circle 8 mimic counterplay teach.** Explicit flamethrower-sweep hint after first mimic encounter.
8. **Circle 8 Shifting Maze solvability guarantee.** Always maintain at least one path to exit.
9. **Circle 9 Phase 2 platform spacing.** Walkable transitions, not jump-required. No precision platforming.
10. **Circle 9 Phase 3 reflected shot disable.** Shots pass through Azazel during speech.
11. **Circle 7 Shrine health pickup.** Add one health pickup to send Mike into the Slaughterhouse at viable HP.

**Nice to Have (polish and depth):**

12. **Cocytus Bridge extension.** 36 cells with environmental storytelling (frozen silhouettes, inscriptions).
13. **Kill-metric hints seeded throughout all circles.** Subtle text flashes tracking violence level.
14. **Circle 8 first mimic damage reduction.** 10 damage (down from 15) for the first encounter.
15. **Audio cue for fire geysers** in Burning Shore (1-second hiss before eruption).
16. **Audio/visual cue for thorn walls** in Thorny Passage (particles or distinct sound on approach).
17. **Circle 9 procedural floor ice rooms** with reflected shots to maintain mechanic awareness.
18. **Phase 1 flamethrower behavior.** Let flamethrower melt ice (0 boss damage, teaches mechanic) rather than reflecting.
19. **Ptolomea table push mechanic.** Environmental interaction to differentiate from Caina thaw combat.
20. **Circle 9 Blue goatKnight new attack.** Ice charge or ground slam to differentiate from standard goatKnights mechanically, not just in HP/color.

---

*End of Act III Playtest Report.*

*Total estimated playtime for Act III: 60-75 minutes (including deaths and retries).*
*Total estimated deaths in Act III: 7-12 (3-5 in Circle 7, 1-3 in Circle 8, 2-4 in Circle 9).*
*Total game deaths (all 9 circles): ~25-30. For Midcore Mike on Normal, this is within acceptable range.*
