---
title: "Act I Playtest Report"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
related:
  - docs/circles/01-limbo.md
  - docs/circles/02-lust.md
  - docs/circles/03-gluttony.md
  - docs/circles/00-player-journey.md
---

# Act I Playtest Report -- Circles 1-3

## Player Persona: Midcore Mike

Mike plays FPS games regularly but is not competitive. He plays on Normal difficulty, explores side rooms if he notices them but does not pixel-hunt walls, picks up everything he sees, fights enemies he encounters but does not seek optional fights, strafes and circles enemies, expects to die 2-3 times per circle, gets frustrated by unfair deaths, and gets bored if 60+ seconds pass without something happening.

---

## Circle 1: Limbo

### Room 1: Vestibule (Spawn Room)

**Entering:** HP 100 | Pistol 30/60 | Weapons: Hell Pistol | Knowledge: None | Deaths: 0 | Tension: 3 | Time: ~0:00

**Experience:** Mike spawns in a small stone chamber, facing south. The room is dim -- cold blue ambient light, two wall torches giving warm orange pools. Fog is light (0.04 density), so he can see the whole room. He reads the Dante inscription on the wall scroll -- or more likely, glances at the subtitle and moves on within 3-5 seconds. He sees vases (decoration, not interactive), the two torches, and the corridor leading south. There is nothing to pick up here and no enemies. Mike walks south toward the Fog Hall.

**Exiting:** HP 100 | Pistol 30/60 | Tension: 3 | Time: ~0:30

**Issues:**
- [PACING] The Vestibule is empty. No pickup, no hazard, no interaction beyond reading a wall inscription. For a player who skims narrative, this room is 15-30 seconds of walking through an empty room. It does set atmosphere, but Mike's clock is ticking. Recommendation: Place a single ammo pickup or a breakable vase that drops something to give Mike a reason to engage with the space.
- [RESOURCE] No starting ammo pickup. Mike has 30 pistol rounds, which is fine for now, but a small pickup here would reinforce the "barrels = loot" visual language before it matters. The Fog Hall has one, but that is also the first combat room.

---

### Room 2: Fog Hall

**Entering:** HP 100 | Pistol 30/60 | Tension: 4 | Time: ~0:30

**Experience:** Mike enters and the fog slams in -- density jumps from 0.04 to 0.08. Visibility drops to roughly 8 cells. The room is 12x10, so Mike can see maybe two-thirds of it at once, but the far corners are murky. He sees torches, cages on the floor, and then -- shapes moving in the fog. Three hellgoats patrol in a triangle loop.

Mike's first combat encounter. He has never fought anything in this game before. The hellgoats are melee enemies, so they need to close distance. In the fog, Mike might not see all three at once. He likely engages the first one he spots, fires 5-8 pistol rounds to kill it (assuming 2-3 hits per kill at this range with some misses), then hears/sees the other two converging.

Mike strafes and circles. The room is 12x10 -- plenty of space for a melee vs. ranged kiting game. He picks up the ammo in the center during or after combat. Total ammo spent: ~15-20 rounds. Ammo pickup restores some.

Mike notices three exits: the corridor south (main path), the corridor west (to Bone Pit), and... the secret wall to the Crypt. Mike will NOT find the WALL_SECRET. The doc says it is a "WALL_SECRET at boundary" -- Mike does not pixel-hunt walls. He walks right past it.

**Exiting:** HP 85-95 (took a hit or two from melee goats) | Pistol 20-25/60 (after pickup) | Tension: 6 | Time: ~2:00

**Issues:**
- [CLARITY] This is Mike's first ever combat encounter. There is no tutorial prompt, no "press LMB to fire" hint, no damage number feedback described. The design relies on FPS genre literacy, which Mike has, so this works -- but if the game targets any non-FPS audience, this is a gap.
- [MECHANICAL] The fog at 0.08 density combined with the patrol triangle means Mike might get flanked by a hellgoat he cannot see. For a FIRST combat encounter, being hit from behind by an enemy you did not know was there feels unfair. Recommendation: Reduce to 2 hellgoats in the Fog Hall, or start them stationary (aggro on sight) rather than patrolling, so Mike encounters them one at a time.
- [SPATIAL] Three exits from this room with no signposting about which is "forward." Mike might go west to Bone Pit first (it is listed as a side branch), east to the Crypt (if he finds it), or south to Columns. This is fine for exploration but could lead to confusion in the fog. The torches should guide the eye toward the south corridor.

---

### Room 3: Bone Pit (Optional Side Branch)

**Entering:** HP 85-95 | Pistol 20-25/60 | Tension: 5 | Time: ~2:00

**Experience:** Mike might or might not go here. The persona says he will explore side rooms "if he notices them." The corridor west from Fog Hall is width-2, which is narrow and might read as "side path" rather than "main path." Let us say Mike notices it and goes in.

He enters an 8x8 room with chains hanging from the ceiling, a barrel, and bones scattered around. Subtle updraft wind (0.3 intensity) from below. The room has edges at elevation 1 and center at 0 -- a pit shape. He sees ammo (x2) and health at the bottom. Mike descends (or rather, walks into the lower area).

TRIGGER: The ambush spawns 3 hellgoats. Mike is now in the pit with enemies spawning around him. He has less room to kite (8x8 is tight for 3 melee enemies), elevation disadvantage if enemies spawn on the edges, and he is surprised.

Mike probably takes 15-25 damage here. He picks up the health pickup to recover. Spends another 15-20 pistol rounds. Gets the two ammo pickups.

**Exiting:** HP 75-90 (after health pickup) | Pistol 15-25/60 (after pickups) | Tension: 7 (ambush spike) dropping to 5 | Time: ~3:30

**Issues:**
- [DIFFICULTY] An ambush room as the SECOND combat encounter (or third if counting Fog Hall as two engagements) is a difficulty spike. Mike just learned to fight, and now he is surrounded in a pit. If he took significant damage in the Fog Hall, he could die here.
- [RESOURCE] The ammo and health are placed at the bottom of the pit as "lure for ambush" -- but the health is positioned in the CENTER of the pit. When the ambush triggers, Mike is standing on top of the health pickup and likely already picked it up BEFORE the ambush spawns. The heal that was supposed to help him survive the ambush was consumed before the ambush started. Recommendation: Place the health pickup in a corner or on an elevated edge, not in the ambush trigger zone.
- [PACING] If Mike skips this room (which he might), he misses 2 ammo pickups and 1 health pickup. The main path has no health between Fog Hall and Columns. This makes the Bone Pit feel less "optional" and more "mandatory if you want resources." Optional side content should be a bonus, not a necessity.
- **Likely Death #1:** If Mike entered at low HP from a bad Fog Hall fight and the ambush catches him off guard, he dies here. Probability: 20-30%.

---

### Room 4: Crypt (Secret Room)

**Entering:** N/A -- Mike does not find this room.

**Experience:** Mike walks past the WALL_SECRET in the Fog Hall. He never sees it. The fog is at 0.08 density, making wall texture differences even harder to notice. The Crypt contains the Brim Shotgun (first weapon unlock), shotgun ammo, and a lore scroll.

**Issues:**
- [CLARITY] The Brim Shotgun is in a secret room. This is the FIRST weapon unlock in the game. Hiding a critical progression item in a secret room that most players will miss on their first playthrough is a significant design risk. Mike completes all of Circle 1 with only the Hell Pistol. If the shotgun is essential for later encounters, this is a problem. If it is intended as a bonus, the game needs to be balanced for pistol-only clears of Circle 1.
- [MECHANICAL] The doc says the Brim Shotgun is found in the Crypt (Circle 1 secret). But the "Between Circles" brief says Mike finds the shotgun in the procedural floors between Circle 1 and Circle 2. This creates an inconsistency: if the shotgun is available in both places, finding it in the Crypt is just "early access." If it is ONLY in the Crypt, most players miss it until the procedural floors hand it to them. The design intent needs clarification. For this playtest, I assume Mike gets the shotgun in the procedural floors.
- [NARRATIVE] The lore scroll ("The scapegoat carries what is not his...") is in a room most players never see. Lore should be on the critical path OR in conspicuous optional areas, not behind invisible walls in fog.

---

### Room 5: Columns (Arena)

**Entering:** HP 75-90 | Pistol 15-25/60 | Tension: 5 | Time: ~3:30 (or ~2:30 if skipped Bone Pit)

**Experience:** Mike enters a 10x12 room with 6 stone columns and two torches. It feels different from the fog corridors -- more structured, more intentional. As he moves in, TRIGGER: doors lock, wave 1 spawns (3 hellgoats from edges converging).

Mike now fights in a columned arena. The columns break line of sight, which is interesting for melee enemies -- Mike can use them as obstacles to separate the pack. He kites around columns, spending 12-15 rounds on wave 1.

Wave 1 clears. Ammo pickup spawns north, health pickup spawns south. Mike grabs both. Good pacing -- the between-wave resupply teaches "survive the wave, get rewarded."

Wave 2 spawns: 3 hellgoats from corners, described as "aggressive." These are still melee enemies (all hellgoats in Circle 1 are Brown goatman), so the challenge escalation is behavioral, not enemy-type. Mike may not notice a difference between "converging" and "aggressive" AI unless the speed or damage is visibly different.

Wave 2 clears. Fog lifts from 0.08 to 0.04 -- Mike sees the descent ahead. This is a good narrative beat. Doors unlock.

**Exiting:** HP 65-85 (after between-wave health) | Pistol 15-25/60 (after between-wave ammo) | Tension: 7 during waves, drops to 4 after | Time: ~6:00

**Issues:**
- [DIFFICULTY] Six hellgoats total across two waves with only the Hell Pistol. This is the highest enemy count so far. If Mike's aim is mediocre (50% accuracy), he needs 30-40 rounds for this room. If he entered with 15 rounds from a rough Bone Pit fight, he runs out of ammo mid-wave-2. Recommendation: Ensure the ammo pickup in the Fog Hall is generous (15+ rounds) or add an ammo pickup at the Columns entrance.
- [PACING] Wave 1 (3 hellgoats) into wave 2 (3 hellgoats) with only a brief resupply break is good arena design. The between-wave pickups are well-placed. This room works.
- [RESOURCE] If Mike skipped the Bone Pit, he has fewer resources entering this room. The design punishes the player who took the intended "main path" and rewards the player who explored the side branch. This is backwards -- the main path should be survivable without side content.
- **Likely Death #2:** Ammo starvation in wave 2. Mike is clicking on empty, hellgoats close in, he dies. Probability: 25-35% (higher if Bone Pit was skipped).

---

### Room 6: Il Vecchio's Chamber (Boss)

**Entering:** HP 65-85 | Pistol 15-25/60 | Tension: 6 | Time: ~6:00

**Experience:** Mike descends stairs (elevation 0 to -1). The room is 12x12, larger than anything before. Three torches: two at entrance (warm orange), one behind the boss (backlit silhouette). Mike sees Il Vecchio standing in the room.

TRIGGER: Boss intro text: "You carry what is not yours, little goat..." Mike reads it (3 seconds). Then doors lock (3-second delay). Boss fight begins.

**Phase 1 (100%-50% HP):** Mike fights Il Vecchio with the Hell Pistol only. The boss is not described in detail in the doc -- no attack patterns, no damage values, no movement speed. This is a significant gap. Assuming standard boss behavior: Il Vecchio is a melee boss who advances on Mike, Mike kites backward while shooting.

The room has ammo (x2) in NE/SW corners and health (x2) in NW/SE corners -- symmetric layout. Mike needs to kite across the room to reach pickups while avoiding the boss.

At 50% HP, TRIGGER: fog surges to 0.12 density. Mike can barely see. This is the phase 2 transition.

**Phase 2 (50%-0% HP):** Fog is nearly blinding. Mike is fighting by audio cues and muzzle flash illumination. If Il Vecchio has melee attacks, Mike cannot see them coming until the boss is practically on top of him.

Mike dies here. The fog at 0.12 density in a boss fight against a boss whose attack patterns were not taught anywhere is punishing. Mike cannot see the health pickups in the corners. He does not know where the boss is. He panics, runs into a wall, gets hit, dies.

**Death:** Mike respawns (presumably at the boss room entrance with some resources restored). Second attempt: Mike now knows the fog surge is coming. He grabs health/ammo from corners early in phase 1 while he can still see. Phase 2 is still hard but survivable because Mike is now playing more cautiously.

**Exiting (second attempt):** HP 30-50 | Pistol 5-15/60 | Tension: 9 during fight, drops to 3 (relief) | Time: ~10:00 (including death and retry)

**Issues:**
- [DIFFICULTY] The boss fight with only the Hell Pistol is a sustained DPS check. With 60 max pistol ammo and pickups providing more, Mike should have enough -- but only if he can HIT the boss in 0.12 fog. If the boss has a large hitbox, this is fine. If the boss is a standard humanoid-sized target, hitting him in near-zero visibility with a pistol is extremely frustrating.
- [CLARITY] The boss has no described attack patterns, telegraphs, or phase 2 behavior changes beyond "fog surge." What does Il Vecchio actually DO differently at 50% HP? If the answer is "nothing, just foggier," then the phase transition is purely a visibility nerf with no new gameplay. If the boss gains new attacks, they need telegraphing that works in fog (audio cues, ground effects, particle trails).
- [MECHANICAL] Fog at 0.12 density punishes the player's primary skill (aiming) without offering a counterplay mechanic. "Listen for the boss" requires positional audio to be well-implemented. "Watch for glowing eyes" requires the boss model to have emissive elements visible through fog. Neither is specified in the design. Recommendation: Give Il Vecchio glowing eyes or a visible lantern that pierces fog, creating a "shoot the light" targeting mechanic.
- [RESOURCE] 2 ammo pickups and 2 health pickups in the boss room is adequate. The symmetric placement is smart -- Mike can circuit the room edges to resupply. But in 0.12 fog, he cannot SEE the pickups. Recommendation: Make pickups glow or pulse in the fog.
- [NARRATIVE] The boss intro text is good. The defeat transition (fog clears, way down opens, title card) is a strong moment. But Il Vecchio's personality is barely established -- one line of dialogue. For the first boss of the game, Mike should feel like he defeated a CHARACTER, not just an HP bar.
- **Likely Death #3:** Phase 2 fog surge. First time guaranteed. Second attempt: 40% chance of dying again. Third attempt: should clear.

---

### Circle 1 Summary

**Deaths:** 2-3 (Bone Pit ambush 20-30%, Columns ammo starvation 25-35%, Boss phase 2 fog ~80% first attempt)

**Time:** ~10-12 minutes (including 1-2 deaths)

**Verdict:**

What works:
- The fog as an identity mechanic is strong. Limbo FEELS different from what the other circles promise.
- The Columns arena is well-designed: columns as LOS blockers, two waves with resupply, fog lifting on clear.
- The atmosphere is excellent -- cold blue light, stone, torches, stillness.

What does not work:
- **Weapon progression is broken.** The only new weapon (Brim Shotgun) is in a secret room most players will miss. Mike fights the entire circle -- including the boss -- with only the Hell Pistol. This is not "rewarding exploration" -- it is "punishing the normal path."
- **The boss fight has a visibility wall, not a skill wall.** Fog at 0.12 does not test combat skill; it tests patience. The boss needs attack patterns that work WITH the fog (telegraphed by sound/glow), not patterns that are simply hidden by it.
- **Resource scarcity is too tight.** Pickup density 0.5 is described as "scarce -- teaches resource awareness." In practice, it means Mike enters the boss fight with barely enough ammo if he did not explore every side room. "Resource awareness" should mean "make choices about which pickups to prioritize," not "run out because there were not enough."

**Recommendations:**
1. Move the Brim Shotgun to the Fog Hall or Columns (between waves). Place the Crypt's reward as bonus shotgun ammo + lore instead.
2. Give Il Vecchio glowing emissive eyes/markings visible through fog. Add a "roar" audio cue before each attack. Phase 2 should introduce a new attack (ranged projectile? ground slam?) not just "same but foggier."
3. Add one more ammo pickup on the main path (either in the Fog Hall or the corridor between Fog Hall and Columns).
4. Consider reducing Bone Pit to 2 ambush hellgoats (3 in a small pit is harsh for the second encounter).

---

## Between Circle 1 and Circle 2: Procedural Floors

**Entering:** HP 30-50 | Pistol 5-15/60 | No Shotgun | Tension: 3

**Experience:** Mike plays 2 Lust-themed procedural floors. Each takes ~5 minutes with ~10 enemies. Mike finds the Brim Shotgun here (this is where he actually gets it, not the Crypt). He gains ~20 pistol ammo and ~5 shotgun ammo.

**Exiting:** HP 80-100 (healed up) | Pistol 25-35/60 | Shotgun 5/20 | Weapons: Hell Pistol + Brim Shotgun | Tension: 3

**Issues:**
- [PACING] Two procedural floors between authored circles is a significant time investment (~10 minutes) of content that is, by definition, less authored and less interesting than the circles. Mike might feel "are we there yet?" Recommendation: Consider 1 procedural floor instead of 2, or make procedural floors shorter (3 minutes each).
- [RESOURCE] Mike enters Circle 2 with only 5 shotgun ammo. The Brim Shotgun is his new toy but he barely has ammo for it. He will use 2-3 shotgun shells and then be back to pistol for most of Circle 2.

---

## Circle 2: Lust

### Room 1: Antechamber

**Entering:** HP 80-100 | Pistol 25-35/60 | Shotgun 5/20 | Tension: 3 | Time: ~0:00

**Experience:** Mike enters warm marble. The shift from Limbo's cold stone is immediate and effective -- amber candlelight, polished surfaces, vases, banners. The fog is barely there (0.02 density). Mike can see everything. A gentle breeze blows from the south exit.

There is an ammo pickup at (22, 5). Mike grabs it. There is a FLOOR_RAISED step at the south hinting at elevation changes. Mike walks over it and heads south.

**Exiting:** HP 80-100 | Pistol 30-40/60 (after pickup) | Shotgun 5/20 | Tension: 3 | Time: ~0:20

**Issues:**
- [PACING] Another empty intro room with just an ammo pickup. Mike spends 15-20 seconds here. The breeze foreshadowing is subtle -- Mike probably does not notice it (there is no visual indicator in an FPS unless particles are flying). The room does its atmospheric job quickly. Acceptable, but barely.
- [NARRATIVE] The title card "CIRCLE THE SECOND -- LUST" should appear here or during the transition. The warm marble is a strong contrast to Limbo. This works.

---

### Room 2: Wind Corridor

**Entering:** HP 80-100 | Pistol 30-40/60 | Shotgun 5/20 | Tension: 4 | Time: ~0:20

**Experience:** Mike enters a narrow corridor (4 cells wide, 16 cells long). Lava channels run along both sides (1 cell wide each), leaving a 2-cell-wide safe walkway in the center. Banners on the west wall flutter eastward. Candle flames lean with the wind.

The wind blows west to east in alternating segments: 3 seconds on, 2 seconds off. Mike feels the push -- he slides toward the east lava channel. During his first gust, he probably drifts 0.5-1 cell toward lava before correcting. If the wind intensity (0.5) is strong enough to push him into lava in a single gust, Mike takes 5 DPS lava damage and panics. If the wind is moderate (push but not lethal in one gust), Mike learns the pattern: wait for the lull, move forward, brace for the next gust.

No enemies. This is a pure mechanic tutorial. Mike traverses the corridor in 30-60 seconds, maybe taking one lava tick.

The health pickup at (22, 20) -- midway -- is a smart reward for surviving half the corridor.

**Exiting:** HP 75-100 (might have touched lava once) | Pistol 30-40/60 | Shotgun 5/20 | Tension: 6 | Time: ~1:00

**Issues:**
- [MECHANICAL] The walkway is 2 cells wide (4 world units). The wind pushes east. A 2-cell walkway with 0.5 intensity wind means the player has about 1-cell of drift room before hitting lava. This is tight. If Mike is strafing or moving diagonally (as FPS players naturally do), the wind interaction with movement could push him into lava more easily than intended. The corridor is 16 cells long -- that is a long time to maintain precise lateral positioning. Recommendation: Widen the safe walkway to 3 cells, or reduce wind intensity to 0.35 for this tutorial section.
- [CLARITY] The pulsing wind pattern (3s on, 2s off) needs a clear visual/audio tell when it is about to activate. The banners fluttering are good but Mike is looking straight ahead (south) while banners are on the west wall. A particle effect (dust/embers blowing across the screen) during active wind would help.
- [SPATIAL] The corridor is 4W x 16H at CELL_SIZE=2, so 8x32 world units. That is VERY narrow (8 units wide) and VERY long (32 units). The aspect ratio is 1:4. Walking through this will feel claustrophobic, which may be intentional, but combined with lava flanking and wind pushing, it is potentially more stressful than a first-time mechanic tutorial should be.
- **Likely Death #1 (small chance):** Mike walks forward during a gust, gets pushed into lava, takes 5 DPS, panics, stays in lava for 2 seconds, dies at low HP. Probability: 10-15% (depends on HP entering).

---

### Room 3: Lover's Gallery

**Entering:** HP 75-100 | Pistol 30-40/60 | Shotgun 5/20 | Tension: 5 | Time: ~1:00

**Experience:** The corridor opens into a large room (14x10). Onyx columns in two rows. Banners draping. Warm light. Mike feels relief from the narrow corridor. Then -- a crimson projectile streaks past his face.

FIRST RANGED ENEMY. fireGoats shoot from behind columns while steady wind pushes Mike toward lava on the east wall. This is a compound challenge: dodge projectiles + resist wind + use columns as cover from both.

Mike has 3 fireGoats (ranged, on the north balcony with height advantage) and 2 hellgoats (melee, patrolling aisles). The ranged/melee mix forces Mike to manage threat from two directions -- he cannot just kite backward from melee because ranged enemies are shooting him.

Mike uses columns to block projectiles and as wind breaks (the doc says columns block wind push). This is smart design -- the cover mechanic does double duty. Mike probably prioritizes the fireGoats (ranged = more annoying) while dodging hellgoats.

Ammo pickup in center (risky, wind-exposed). Health pickup south (near exit). Mike fights, grabs pickups, and moves south.

Mike notices the exit south (to Siren Pit) and a corridor southwest. The southwest path leads to the Boudoir secret -- a WALL_SECRET. Mike probably does not find it unless the entrance is visually distinct. The doc says it is on the "west wall" of the Gallery with a corridor leading to it. If there is a visible corridor opening, Mike might explore it. If it is a WALL_SECRET with no visible opening, Mike misses it.

**Exiting:** HP 55-80 (took ranged hits) | Pistol 15-30/60 | Shotgun 2-5/20 (tried shotgun on clustered enemies) | Tension: 7 | Time: ~3:00

**Issues:**
- [DIFFICULTY] This is a significant difficulty spike. Mike faces ranged enemies for the FIRST TIME combined with wind, lava traps, and melee enemies simultaneously. Any one of these would be a fair new challenge. All four at once is potentially overwhelming. The fireGoats have height advantage from the north balcony, and the steady wind (0.35 intensity, constant) is pushing Mike toward the east lava strip the entire time.
- [MECHANICAL] The design says "hiding behind a column blocks wind push." This needs to be obvious to the player. Mike will figure out columns block projectiles (FPS instinct), but "columns block wind" is not intuitive. If Mike does not discover this, the wind pushes him relentlessly toward lava while he tries to fight 5 enemies. Recommendation: Add a visual cue when behind a column (wind particles stop, dust settles) or have a brief moment before enemies spawn where the wind pushes Mike toward a column so he can feel the block effect.
- [SPATIAL] The east lava strip is only 1 cell wide, but the wind is constant. If Mike is fighting on the east side of the room, every missed dodge could push him into lava. The west side is safer (wind pushes him AWAY from lava toward center), but enemies are spread across the room. Mike will naturally gravitate west, which creates a one-sided combat arena.
- [RESOURCE] Mike is now using shotgun ammo on melee hellgoats that close to point-blank. With only 5 shotgun shells, he will burn through them in this room and be back to pistol-only for the Siren Pit.
- **Likely Death #2:** Caught in wind-exposed position while fireGoat lands a shot, knockback pushes Mike into east lava, takes damage from both. Probability: 30-40%.

---

### Room 4: Boudoir (Secret Room)

**Entering:** N/A -- Mike probably does not find this room.

**Experience:** If Mike notices the southwest corridor from the Gallery and investigates, he finds the WALL_SECRET and enters a luxurious bedroom. No enemies, no wind. Health, 2x ammo, and a lore scroll. This is the only safe haven in Circle 2.

The lore scroll reads: "The storm carries those who surrendered their reason to desire..." -- thematically rich, but Mike is not here. He is in the Siren Pit getting shot.

**Issues:**
- [CLARITY] Same problem as Circle 1's Crypt. Critical supplies are behind a WALL_SECRET in a room most players will not find. The Boudoir has guaranteed-safe health and 2 ammo pickups -- resources Mike desperately needs. Hiding them behind a secret wall punishes the majority of players.
- [PACING] If Mike DOES find the Boudoir, it is a perfect pace-break: a calm room between the intense Gallery and the intense Siren Pit. This is exactly where a breather should be. Too bad most players will not experience it.

---

### Room 5: Siren Pit

**Entering:** HP 55-80 | Pistol 15-30/60 | Shotgun 0-3/20 | Tension: 6 | Time: ~3:00

**Experience:** Mike looks down into a spiraling pit. A 4x4 lava core glows at the center. A 2-cell-wide spiral ramp descends clockwise from elevation 0 to -2. Wind pulls inward and downward (toward the lava center, intensity 0.6 -- the strongest wind Mike has faced).

Enemies fire from multiple elevations: 2 fireGoats on ledges at -0.5 and -1.5, plus 1 hellgoat at the bottom (-2.0).

Mike has to descend a narrow ramp while being pulled toward a lava pit and shot at from multiple angles. This is the hardest room in Circle 2 so far (possibly harder than the boss for a first-time player).

The wind at 0.6 intensity pulling inward means Mike has to constantly fight the pull while navigating the ramp. If he stops to aim at a fireGoat, the wind slides him toward the lava core. The ramp is 2 cells wide -- that is 4 world units. With 0.6 wind pulling inward, Mike might have less than 1 second of drift time before falling off the inner edge into lava.

Ammo and health at the bottom (-2.0) reward completing the descent.

**Exiting:** HP 35-65 (took ranged hits + possible lava damage) | Pistol 10-25/60 | Shotgun 0-3/20 | Tension: 9 | Time: ~5:00

**Issues:**
- [DIFFICULTY] This room is brutally hard. 0.6 intensity inward wind on a 2-cell-wide spiral ramp with ranged enemies shooting from multiple elevations. Mike is fighting the controls (wind), the geometry (narrow ramp, instant-death lava core), and enemies simultaneously. This is Souls-like difficulty in a game where Mike expects Normal FPS difficulty.
- [SPATIAL] The spiral ramp at 2 cells wide is too narrow for the wind intensity. A 3-cell-wide ramp would give Mike breathing room. Or reduce the inward wind to 0.4 intensity -- the concept of "pull toward center" is scary even at lower intensity.
- [MECHANICAL] The wind pulls inward AND downward. "Downward" on a descending ramp means what exactly? Does it accelerate Mike's descent? Make him slide down the ramp faster? The design is unclear. If "downward" means "toward lava core" (which is below), then the wind is only inward. If it literally pushes down, it makes the ramp a slide, which could be fun OR fatal depending on implementation.
- [RESOURCE] 10 DPS from the Siren Pit lava core (listed in environment zones) vs. 5 DPS from other lava. Falling into the center is 10 DPS -- that is death in 5-10 seconds for Mike's current HP. If he falls off the ramp, can he recover? There is no described mechanism to get back on the ramp from the lava. If the lava is instant death (no recovery), that is too harsh. If there are grab ledges or a teleport-to-last-safe-ground, it is more fair.
- **Likely Death #3:** Falls off ramp into lava core, cannot recover, dies. Probability: 40-50% on first attempt. This is the highest-probability death in Act I outside of boss fights.

---

### Room 6: Tempest Hall (Arena)

**Entering:** HP 35-65 (or 100 if just respawned from Siren Pit death) | Pistol 10-25/60 | Shotgun 0-3/20 | Tension: 7 | Time: ~5:00 (or ~7:00 with death)

**Experience:** Mike ascends a ramp from -2 back to -1. He enters a wide room (14x12) divided into 4 north-south lanes by 3 lava channels (1 cell wide each). Two bridges per channel cross the lava. Wind shifts direction every 8 seconds (W-to-E, then E-to-W).

Doors lock. Wave 1: 3 hellgoats (melee, charge across bridges). Mike fights on the lanes and bridges. The shifting wind adds a timing element -- Mike needs to cross bridges when the wind is not pushing him sideways into lava.

Wave 1 clears. Ammo on west platform, health on east platform. Mike resupplies.

Wave 2: 2 fireGoats (ranged, elevated platforms) + 2 hellgoats (melee, mixed). Now Mike is dealing with ranged enemies on platforms while trying to reach them across wind-swept bridges with lava between.

The third bridge (SW) is at -1.5 elevation -- wind can push you off. This is a trap for players who try to use it. Mike will probably avoid it (or learn the hard way).

Wave 2 clears. Wind dies. Doors unlock.

**Exiting:** HP 40-70 (after between-wave health) | Pistol 10-25/60 (after between-wave ammo) | Shotgun 0-3/20 | Tension: 8 during waves, drops to 5 | Time: ~8:00

**Issues:**
- [PACING] Siren Pit (intense platforming combat) directly into Tempest Hall (locked arena with 2 waves) with no downtime between. Mike has been in high-tension gameplay for 5+ minutes straight. After the Siren Pit, he needs a breathing room -- a short corridor with some ammo, a visual reward, something. Going from one intense room directly into another causes fatigue.
- [DIFFICULTY] Wave 2 with fireGoats on elevated platforms and shifting wind is complex. Mike needs to: (1) dodge ranged fire, (2) track wind direction, (3) time bridge crossings, (4) close distance on ranged enemies on platforms. This is the most mechanically demanding encounter in Act I so far, and it comes right after the Siren Pit. Consider wave 1 as hellgoats only (as designed) and wave 2 as hellgoats + 1 fireGoat (reduce from 2 fireGoats).
- [SPATIAL] The lane layout with 3 lava channels and 2 bridges per channel creates 4 lanes and 6 bridges. This is a lot of geometry to parse while fighting. Mike might not realize the bridges have different elevation values or that one is a trap. Clear visual signposting (the lower bridge should look damaged/crumbling) would help.
- [RESOURCE] Between-wave pickups are on the raised platforms at east/west extremes. These are described as "safe from wind" (elevated at -0.5 vs -1 main floor). This is good -- safe zones exist and they have rewards. But Mike has to KNOW these platforms are safe. If he is in the middle of the lanes, he might not think to go to the platform edges.
- **Likely Death #4:** Blown off a bridge by shifting wind mid-crossing into lava. Probability: 25-35%.

---

### Room 7: Caprone's Sanctum (Boss)

**Entering:** HP 40-70 | Pistol 10-25/60 | Shotgun 0-3/20 | Tension: 7 | Time: ~8:00

**Experience:** Mike enters through a wide doorway (width 4). The room is grand: 14x14, two chandeliers, banners, a raised throne dais. Caprone sits on the throne. Three lava channels run east-west across the southern half. A bridge crosses the center channel.

Boss intro: "Come closer, little goat. Everyone comes closer eventually." The wind pulls northward (toward Caprone). Mike involuntarily slides toward the boss. Doors lock.

**Phase 1 -- Seduction (100%-50%):** Wind pulls toward Caprone (steady northward). Slow pink-orange projectiles in sweeping arcs. Mike dodges laterally while fighting the northward pull. The columns near the dais provide minor cover.

Mike has ammo in NW/NE corners, health in SW/SE corners (far from boss). The resource placement forces Mike to choose: stay near the boss to deal damage, or retreat south to grab health (fighting the wind on the way back).

This phase is a good "learn the boss" segment. Slow projectiles, steady wind, predictable patterns. Mike adapts.

**Phase 2 -- Fury (50%-25%):** Throne shatters (dramatic). Caprone becomes mobile. Dual attacks: melee swipe (120 degrees, 15 damage) and faster ranged projectile (10 damage). Wind begins rotating (N, E, S, W every 10 seconds).

The wind rotation is the key challenge here. Mike's movement direction relative to the room changes every 10 seconds. He has to constantly re-orient. Caprone charges between platforms. Mike is dodging both the boss and the wind.

**Phase 3 -- Inferno (25%-0%):** Lava channels widen. Safe floor shrinks by 40%. Bridge collapses. Wind rotation accelerates to 6 seconds. Lingering fire patches from projectiles (3-second, 1-cell radius).

The room becomes a shrinking arena. Mike is jumping between safe patches, dodging projectiles and fire patches, fighting accelerating wind, and trying to land shots on a mobile boss. This is the most complex combat encounter in Act I.

**Exiting (after likely 1-2 deaths):** HP variable | Ammo variable | Tension: 10 during fight, 2 (relief/exhaustion) after | Time: ~14:00 total for Circle 2

**Issues:**
- [DIFFICULTY] Phase 3 is exceptionally punishing. Shrinking safe floor + collapsing bridge + accelerating wind + lingering fire patches + mobile boss = too many simultaneous threats. Any ONE of these escalations would make phase 3 harder than phase 2. All of them together creates a difficulty wall. Recommendation: Pick 2 escalation mechanics for phase 3 (lava widening + wind acceleration is enough). Remove lingering fire patches OR bridge collapse, not both.
- [CLARITY] Phase transitions need dramatic telegraphing. The throne shattering (phase 2) is excellent. The lava widening (phase 3) needs an equivalent dramatic moment -- ground cracking with a 2-3 second warning before the lava expands. If the bridge just disappears mid-crossing, that is an unfair death.
- [RESOURCE] Mike enters this fight with 0-3 shotgun shells and 10-25 pistol rounds. For a 3-phase boss fight, this is critically low. The boss room has 2 ammo pickups (NW/NE) -- but these are in the "corner" positions that become increasingly dangerous in phase 3 as lava widens. If Mike cannot safely reach ammo in phase 3, the fight becomes impossible. Recommendation: Add a third ammo pickup in the center or near the bridge.
- [MECHANICAL] The wind rotation in phase 2 (10s period) and phase 3 (6s period) is the signature mechanic. At 6-second rotation, the wind changes direction before Mike can fully adjust to the current direction. This might feel less like "adapt" and more like "random buffeting." Consider 8 seconds for phase 3 instead of 6.
- [NARRATIVE] The boss personality is well-established. "Come closer, little goat" followed by the throne shattering in fury is a strong 2-act progression. Phase 3 does not have a narrative beat -- consider Caprone shouting something as the lava rises.
- **Likely Deaths #5-6:** Phase 2 first encounter (~60% probability -- wind rotation catches Mike off guard). Phase 3 shrinking arena (~50% probability even on retry -- too many simultaneous hazards).

---

### Circle 2 Summary

**Deaths:** 3-4 (Wind Corridor 10-15%, Gallery 30-40%, Siren Pit 40-50%, Tempest Hall 25-35%, Boss phases 2-3 multiple attempts)

**Time:** ~14-18 minutes (including 2-3 deaths)

**Verdict:**

What works:
- The wind mechanic evolves across every room: pulsing (Corridor), steady (Gallery), inward (Pit), shifting (Hall), rotating (Boss). Each room feels distinct. This is excellent systemic design.
- The visual shift from Limbo's cold stone to Lust's warm marble is immediately striking. The "seductive architecture" theme works.
- The Gallery's dual-use columns (projectile cover + wind break) is the best designed combat space in Act I so far.
- Caprone's 3-phase boss fight is the most narratively coherent boss. The throne shattering is a great moment.

What does not work:
- **The Siren Pit is too hard.** 0.6 intensity inward wind on a 2-cell-wide ramp with ranged enemies firing from multiple elevations is Souls-level difficulty. Mike will die here, and the death will feel unfair because the wind pushed him off a narrow path. The room needs a wider ramp (3 cells) or lower wind (0.4) or fewer enemies (remove the bottom hellgoat -- the fireGoats are enough).
- **No downtime between Siren Pit and Tempest Hall.** Two back-to-back intense combat/platforming rooms cause fatigue. Add a short connecting corridor with a single ammo/health pickup and some visual storytelling.
- **Phase 3 of Caprone has too many escalation mechanics stacked.** Lava widening + bridge collapse + accelerating wind + lingering fire patches = four simultaneous difficulty increases. Pick two.
- **Resource starvation continues from Circle 1.** Mike is chronically low on ammo and has essentially no shotgun ammo. The weapon he found in the procedural floors is unusable because there is not enough ammo for it. If shotgun ammo is rare in Circle 2, the shotgun is a decorative slot.

**Recommendations:**
1. Widen the Siren Pit ramp to 3 cells and reduce inward wind to 0.4. Remove the bottom hellgoat (keep 2 fireGoats as the challenge).
2. Add a short breather corridor between Siren Pit exit and Tempest Hall entrance with 1 ammo + 1 health pickup.
3. In Caprone phase 3, keep lava widening + wind acceleration. Remove EITHER lingering fire patches OR bridge collapse. Increase wind period to 8s.
4. Add more shotgun ammo drops in the Gallery and Tempest Hall. Mike should have 8-10 shotgun shells for the boss fight.
5. Make the Boudoir secret entrance more discoverable -- a visible alcove or cracked wall, not a pure WALL_SECRET.

---

## Between Circle 2 and Circle 3: Procedural Floors

**Entering:** HP variable (post-boss) | Pistol 5-20/60 | Shotgun 0-5/20 | Tension: 2

**Experience:** Mike plays 2 Gluttony-themed procedural floors. He finds the Hellfire Cannon. He gains ~30 mixed ammo.

**Exiting:** HP 80-100 | Pistol 25-40/60 | Shotgun 5-10/20 | Hellfire Cannon 10-15/40 | Weapons: Pistol + Shotgun + Cannon | Tension: 3

**Issues:**
- [RESOURCE] Three weapons now, with ammo split across them. 30 "mixed ammo" split 3 ways gives roughly 10 per weapon. Mike has a growing arsenal but shallow ammo pools for each weapon. This is a design choice (encourage weapon switching) but Mike tends to main one weapon and only switch when empty.
- [PACING] Same concern as before -- 2 procedural floors (~10 minutes) is a lot of less-authored content. Mike is now ~25-30 minutes into the game and has spent ~20 of those in authored circles. The 10 minutes of procedural floors feel like filler.

---

## Circle 3: Gluttony

### Room 1: Gullet

**Entering:** HP 80-100 | Pistol 25-40/60 | Shotgun 5-10/20 | Cannon 10-15/40 | Tension: 3 | Time: ~0:00

**Experience:** The marble is gone. The walls are meat -- stretched leather over organic curves. The floor is wet moss. Everything glistens under sickly yellow-green light. The corridor narrows and widens like a throat swallowing (6 cells, then 3, then 6, then 3, then 6). Ceiling height varies. Floor has raised and dipped sections.

Mike is immediately unsettled by the visual shift. Three green hellgoats wait in the wider chambers. The narrow sections (3 cells wide) create chokepoints where Mike meets enemies at close range.

The first health pickup is in the second wide section at (19, 8). Mike grabs it. It might be poisoned (50% chance). If it IS poisoned, Mike takes damage instead of healing. The screen flashes green. Mike is confused -- "Did I just get hurt by a health pack?"

This is the FIRST time the poisoned pickup mechanic activates. The design doc says there is a "faint green tint" visual tell, but Mike was not looking for it. He grabbed the pickup automatically (his persona: "picks up everything he sees"). The first poisoned pickup will feel like a bug, not a mechanic, unless the feedback is extremely clear.

Second health pickup at (19, 13) in the exit wide section -- also 50% chance of poison. Mike is now suspicious. He might hesitate. Or he might grab it anyway because he is hurt from the first poisoned one. Vicious cycle.

Three hellgoats across the wider chambers. Tight combat in narrow sections. Mike uses pistol/shotgun at close range.

**Exiting:** HP 55-90 (variable depending on poison luck) | Pistol 20-35/60 | Shotgun 3-8/20 | Cannon 10-15/40 | Tension: 5 | Time: ~2:00

**Issues:**
- [CLARITY] The poisoned pickup mechanic is introduced with NO warning. The trigger T1 text ("The air is thick with the smell of rot and plenty...") is atmospheric but does not say "health pickups might hurt you." The visual tell ("faint green tint") is described in the theme configuration but the player has no way to know what the green tint means until AFTER they have been poisoned. This is a "gotcha" mechanic -- the player is punished for doing what every FPS has trained them to do (pick up health packs). Recommendation: The first poisoned pickup should be GUARANTEED to be safe -- let Mike grab one successfully to establish the baseline. The SECOND pickup should be guaranteed poisoned. This teaches the pattern through experience: "health packs work... except when they don't."
- [CLARITY] What is the visual tell exactly? A "faint green tint" on a green-tinted floor in a room with green ambient light (#88aa44) and green-tinted lanterns (#aacc44) is nearly invisible. The tell needs to be MORE distinct in this circle specifically because the entire color palette is green. Recommendation: Make poisoned pickups pulse or have visible particle effects (dripping, bubbling). A static color shift in a monochromatic green environment is not sufficient.
- [DIFFICULTY] Three hellgoats in narrow corridor sections where Mike cannot kite effectively. The 3-cell-wide sections force close-quarters combat. This is fine for individual engagements but could be overwhelming if Mike enters a narrow section and a hellgoat is right there.
- [SPATIAL] The undulating floor (0 to -0.5 to +0.5 to 0) in a narrow corridor creates vertical visual noise that could hide enemies or pickups in the floor dips.

---

### Room 2: Feast Hall

**Entering:** HP 55-90 | Pistol 20-35/60 | Shotgun 3-8/20 | Cannon 10-15/40 | Tension: 5 | Time: ~2:00

**Experience:** Mike enters a grand hall (14x10) with a massive table running east-west, loaded with food props. The room is well-lit (Chandelier overhead). 4 green hellgoats patrol the aisles flanking the table.

The table has 6 health pickups on and around it. 3 are poisoned (50% ratio, seeded). 2 ammo pickups flank the table. There are also Cauldrons, FarmCrate_Apples, Barrel_Apples, SmallBottles, Mugs -- the visual abundance is overwhelming.

Mike fights the 4 hellgoats in the aisles. The table acts as a physical barrier between the north and south aisles -- enemies have to go around it. This creates natural lane combat. Mike can shoot down the aisles using the table as soft cover.

After combat, Mike approaches the table. He sees health pickups. After the Gullet experience, he might be cautious... or he might grab them all because he is hurt. If he grabs all 6:
- 3 heal him (let us say +15 HP each = +45)
- 3 poison him (let us say -10 HP each = -30)
- Net: +15 HP

This is an interesting risk/reward calculation -- but Mike does not KNOW the ratio. He has a sample size of 1-2 from the Gullet. He might think "some pickups are bad" without knowing it is 50%.

Mike notices the corridor south (main path) and possibly the corridor southwest (secret entrance to Pantry).

**Exiting:** HP 55-85 (combat damage + poison variance) | Pistol 15-30/60 | Shotgun 1-6/20 | Cannon 10-15/40 | Tension: 6 | Time: ~4:00

**Issues:**
- [MECHANICAL] The poison mechanic creates an interesting decision... but only if Mike can make an INFORMED decision. The "faint green tint" visual tell is the only way to distinguish safe from poisoned. If Mike cannot reliably distinguish them, the mechanic is pure random chance, not a skill check. In a green-tinted room, the distinction needs to be stark -- not subtle. Recommendation: Safe pickups should glow warm red/orange. Poisoned pickups should glow sickly green. The colors should be distinct even in the green ambient lighting.
- [RESOURCE] 6 health pickups on the table but Mike has to gamble on each one. If Mike is at 60 HP and grabs a poisoned one, he drops to 50. If he then grabs a safe one, he goes to 65. The variance is high. A run where Mike hits 3 poisons in a row could drop him to 30 HP entering the Larder. This feels unfair because the seeded random is invisible to the player. Recommendation: Cluster the poisoned pickups on one end of the table and safe ones on the other, so observant players can learn the pattern. Or make the visual tell unmistakable.
- [PACING] 4 hellgoats + table navigation + pickup decisions = a room that could take 2-3 minutes. This is a well-paced exploration/combat room. The abundance theme is strong.
- [NARRATIVE] The Feast Hall is the thematic core of Circle 3. The loaded table, the excess, the poison -- this is Gluttony manifest. The design communicates the theme through mechanics, which is excellent.

---

### Room 3: Pantry (Secret Room)

**Entering:** N/A -- Mike probably does not find this room (again, WALL_SECRET).

**Experience:** If found, the Pantry has clean dry stone walls (contrast to meat walls), guaranteed non-poisoned health (x2), ammo, and a lore scroll. The only guaranteed-safe health in the circle.

**Issues:**
- [CLARITY] For the THIRD time, a critical resource cache is behind a WALL_SECRET. In this circle specifically, guaranteed-safe health is enormously valuable because the poison mechanic makes every other health pickup a gamble. Hiding the ONLY reliable healing in a secret room means Mike's experience of Circle 3 is "50% of health hurts me and I have no way to get safe health." This is significantly worse than the intended experience. Recommendation: Place 1-2 guaranteed-safe health pickups on the critical path (in the corridor between Feast Hall and Larder, or at the Larder entrance). The Pantry can still have extra safe health as a bonus reward.
- [NARRATIVE] The Pantry scroll ("The glutton reaches for everything and chokes on nothing. The wise eat little and live long. These supplies are clean...") is the most important narrative beat for the mechanic -- it TELLS the player that the Pantry supplies are safe. But most players never read it.

---

### Room 4: Larder

**Entering:** HP 55-85 | Pistol 15-30/60 | Shotgun 1-6/20 | Cannon 10-15/40 | Tension: 6 | Time: ~4:00

**Experience:** Mike enters a vertical descent through a larder. Five platforms at different elevations (0, -0.5, -1.0, -1.5, -2.0). He drops down between them (one-way -- no going back up). Shelves line the walls with Barrels and Crates. Ropes hang between levels marking safe landing zones.

2 fireGoats on platforms 2 and 3 fire across the vertical gaps. 1 hellgoat guards platform 4. Mike has to drop down while being shot at by enemies at different elevations.

The descent is one-way and committed. If Mike drops to platform 2 and realizes a fireGoat is right there, he cannot retreat to platform 1. He has to fight from wherever he lands.

Health on platform 4 (may be poisoned). Ammo at the bottom. Mike descends, fights, collects.

**Exiting:** HP 40-75 (combat + possible fall damage + possible poison) | Pistol 12-28/60 | Shotgun 0-5/20 | Cannon 8-13/40 | Tension: 7 | Time: ~6:00

**Issues:**
- [SPATIAL] Five platforms with drops between them in a 10x12 room. Each platform is 6-10 cells wide. The drops from one to the next are 0.5 elevation units (1 world unit at CELL_SIZE=2). Is this a visible edge that Mike can see clearly, or is it subtle? In a green-lit organic environment, platform edges might blend into the walls. Ropes mark safe landing zones -- but "safe" means what? Do they mark where to stand, or where to land? This needs clearer visual language.
- [DIFFICULTY] One-way drops combined with ranged enemies at different elevations. If Mike drops to a platform and immediately takes fire from a fireGoat on the same platform, he is in a close-range fight with no retreat option. The commitment design is interesting but could feel like a trap if the enemy placement is not visible from above before dropping.
- [MECHANICAL] "Missing a platform edge means falling to the next level (or two levels), taking fall damage." What is the fall damage value? A 2-level fall (-1.0 elevation change) dealing 20+ damage would be devastating at Mike's current HP. If fall damage is low (5-10), the risk/reward is more manageable. This value is not specified.
- [PACING] This room should take 2-3 minutes. The vertical descent is engaging -- each drop is a micro-decision. Good pacing within the room.

---

### Room 5: Bile Cistern

**Entering:** HP 40-75 | Pistol 12-28/60 | Shotgun 0-5/20 | Cannon 8-13/40 | Tension: 6 | Time: ~6:00

**Experience:** Mike ascends a ramp back to elevation 0 and enters a flooded room. The entire floor is green acid (3 DPS). Raised stone walkways (2 cells wide) form a crisscross grid above the acid. 3 fireGoats stand on different walkway segments.

Mike navigates the walkways, fighting fireGoats at range. The walkways are narrow (2 cells = 4 world units). Combat on a narrow walkway means Mike cannot strafe wide -- his preferred combat style (circle and strafe) is neutered. He can only move forward/backward on the walkway or turn at intersections.

Dead-end walkways hold tempting health pickups -- but both dead-end pickups are GUARANTEED poisoned. The main-path health pickup at (20, 58) is still 50/50. Mike, if he has learned the poison lesson, might skip the off-path pickups. If he has not learned (or is desperate for HP), he walks out to a dead end, gets poisoned, and is stuck on a narrow walkway over acid, now hurt instead of healed.

The Bile Cistern dead-end lure is the cruelest moment in Act I. It is thematically perfect (gluttony punishes the greedy) but mechanically frustrating because:
1. The player is already navigating hazardous terrain (acid below, narrow walkways)
2. The visual tell for poison is unreliable in this green environment
3. The punishment for being wrong (lose HP + still on narrow walkway with enemies) is severe

**Exiting:** HP 30-65 (combat + possible poison + possible acid tick) | Pistol 10-25/60 | Shotgun 0-4/20 | Cannon 6-12/40 | Tension: 7 | Time: ~8:00

**Issues:**
- [DIFFICULTY] 3 fireGoats on narrow walkways over acid. Mike cannot strafe. The walkways are 2 cells wide, the same as the Siren Pit ramp that was already identified as too narrow. Ranged combat on a 2-cell-wide walkway is a DPS race -- whoever gets hit staggers toward the acid edge.
- [MECHANICAL] If Mike falls off a walkway into acid (3 DPS), can he climb back up? The walkways are at elevation 0, acid at -0.5. A 0.5 elevation difference should be climbable (it is essentially a step). If so, falling in acid is scary but recoverable (take a few ticks, step back up). If the edge is un-climbable, falling in is a death sentence (3 DPS with no escape). This matters enormously and is not specified.
- [CLARITY] The guaranteed-poisoned dead-end pickups are a trap. Traps are fine in game design when the player has the information to avoid them. Here, the information is a "faint green tint" in a green room. If the visual tell is not reliable, this trap is unfair. Recommendation: Make the dead-end walkways visually distinct -- crumbling, discolored, or with explicit "danger" markings (more acid splatter, bubbling at the edges). Let the environment communicate "this path is suspicious" even if the pickup itself looks normal.
- [PACING] This room is tense but not frantic. The walkway navigation creates a measured pace that contrasts with the hectic combat of the Larder and upcoming Gut Arena. Good pacing placement.
- **Likely Death #5:** Poisoned on dead-end walkway, panics, sidesteps into acid, takes acid + combat damage, dies. Probability: 25-35%.

---

### Room 6: Gut Arena

**Entering:** HP 30-65 | Pistol 10-25/60 | Shotgun 0-4/20 | Cannon 6-12/40 | Tension: 7 | Time: ~8:00

**Experience:** Mike enters a room with three concentric rings of walkable floor separated by 1-cell-wide acid channels. Four bridges (N/S/E/W) connect the rings. Doors lock.

Wave 1: 4 green hellgoats on outer and middle rings. Mike fights melee enemies on the ring structure. Bridges are 2 cells wide -- tight for combat but functional. Mike kites around the rings, using the circular geometry to maintain distance.

Wave 1 clears. The inner acid channel widens -- the inner ring submerges into acid. If Mike was standing on the inner ring, he must scramble outward within the warning period (3 seconds? Not specified). The acid rise is a dramatic moment.

Ammo on outer ring north. Health on outer ring south (may be poisoned -- still 50/50 here).

Wave 2: 2 fireGoats on middle ring + 2 hellgoats on outer ring. Reduced space (no inner ring). Mixed enemy types. Mike has to deal with ranged and melee simultaneously on a narrower playfield.

Wave 2 clears. Doors unlock.

**Exiting:** HP 25-55 (after combat + between-wave pickup) | Pistol 8-22/60 | Shotgun 0-3/20 | Cannon 4-10/40 | Tension: 8 during waves, drops to 6 | Time: ~11:00

**Issues:**
- [DIFFICULTY] 4 hellgoats in wave 1 followed by 4 mixed enemies in wave 2 = 8 total enemies in an arena where the playfield SHRINKS between waves. Mike's ammo is running low across all three weapons. If he has 8 pistol + 3 shotgun + 4 cannon = 15 total rounds for 8 enemies, he needs 100% accuracy to clear. This is resource starvation.
- [RESOURCE] Single ammo pickup between waves (outer ring north) is not enough. Mike has THREE weapons now but the total ammo economy has not scaled to match. The Gut Arena needs 2 ammo pickups between waves minimum.
- [MECHANICAL] The inner ring submerging is a great setpiece moment -- but the timing matters. If Mike is mid-combat on the inner ring when the acid rises, how much warning does he get? The doc says acid "widens by 1 cell on each side" between waves. Is this instant? A 3-second animation? A gradual rise? If it is instant, players on the inner ring die unfairly. If it is a 3-5 second animation with a sound cue, players can react.
- [SPATIAL] The concentric ring layout with bridges creates a complex navigation space. Mike needs to constantly assess which ring he is on and which bridge to cross to avoid enemies. For a player who is also tracking ammo, health, and poison risk, this is high cognitive load. The circular geometry is novel and interesting but could be overwhelming.
- [PACING] Two waves with a terrain change between is good arena design. The shrinking playfield escalates pressure naturally. This room's STRUCTURE is well-designed even if the numbers need tuning.
- **Likely Death #6:** Ammo starvation in wave 2. Mike is clicking empty with enemies closing in on a narrow ring over acid. Probability: 30-40%.

---

### Room 7: Vorago's Maw (Boss)

**Entering:** HP 25-55 | Pistol 8-22/60 | Shotgun 0-3/20 | Cannon 4-10/40 | Tension: 8 | Time: ~11:00

**Experience:** Mike descends to elevation -1. He enters a stomach-shaped room. The floor is entirely acid (3 DPS). A central raised platform (8x6 cells) sits above the acid. A 2-cell-wide entry ledge wraps the north wall. Vorago crouches on the platform -- bloated, grotesque.

Boss intro: "Hungry, little goat? Mother will feed you..." Doors lock.

Mike jumps from the entry ledge to the central platform.

**Phase 1 -- Gorge (100%-50%):** Vorago vomits arcing acid projectiles that create temporary acid pools on the platform (2x2 cells, 3s duration, 3 DPS). The platform accumulates hazard zones. Vorago also summons 2 hellgoat adds on the entry ledge.

Mike fights on the platform, dodging ground pools while shooting Vorago. The adds on the entry ledge are annoying -- Mike has to either ignore them (they throw at him from ledge) or leave the platform to deal with them (risk acid).

The platform is 8x6 = 48 cells. Each acid pool covers 4 cells for 3 seconds. If Vorago fires every 2-3 seconds, the platform could have 2-3 active acid pools at once, covering 8-12 cells. That is 17-25% of the platform as hazard. Manageable but tight.

**Phase 2 -- Devour (50%-25%):** Platform fragments into 6 chunks (2x2 each = 24 total safe cells, down from 48). Chunks drift on acid. Some bob and submerge (3s warning, 5s submerged, resurface). Mike must jump between chunks.

This is the Siren Pit problem again but worse: small platforms over hazardous liquid with a boss attacking. The chunks are 2x2 = 4x4 world units. That is tiny. Mike has to stand on a 4x4 platform, dodge projectiles, and time jumps to other 4x4 platforms that might be submerging.

The jumping mechanic itself might be technically challenging -- does the game have reliable jump + land on small platform? In an FPS with physics-based movement, landing on a 4x4 world unit platform while a chunk is drifting is precision platforming in an action game. This is a genre mismatch.

**Phase 3 -- Consume (25%-0%):** Wind pulls toward Vorago's mouth (0.8 intensity -- the strongest wind in Act I). Shooting into the open mouth deals 3x damage. Mike must resist suction, maintain distance (melee bite = 25 damage), and land shots on the mouth hitbox.

The 3x damage mechanic is smart -- it rewards accurate shooting during the most chaotic phase. But Mike needs ammo to exploit it. If he is nearly empty (likely), phase 3 is a resource crisis.

Health pickups on debris platforms around the edges -- but they may be poisoned (50%). In the boss fight, with acid below, on tiny floating platforms, Mike has to GAMBLE on health pickups. This is either the peak expression of the Gluttony theme or the most frustrating moment in the game. Likely both.

**Exiting (after 2-3 deaths):** HP variable | Ammo variable | Tension: 10 during fight, 1 (exhaustion) after | Time: ~16:00 total for Circle 3

**Issues:**
- [DIFFICULTY] Phase 2 is the hardest boss phase in Act I. Jumping between 2x2 drifting, bobbing platforms while fighting a boss who vomits acid is precision platforming in a game that has been an FPS until now. Mike's persona ("strafes and circles enemies") is completely negated -- there is no room to strafe on a 2x2 platform. This phase either needs larger chunks (3x3 minimum) or fewer of them (4 chunks instead of 6, each 3x3 = 36 cells, closer to the original 48).
- [MECHANICAL] The bobbing/submerging mechanic on floating chunks is complex. "3-second telegraph (bob lower) then 5 seconds submerged then resurface." Mike needs to track which chunks are about to submerge while also tracking Vorago's attacks, his own position, jump timing, and ammo. Cognitive overload. Recommendation: Have only 2 chunks submerge at a time (out of 6), with a very clear visual (the chunk turns red/glowing before submerging).
- [RESOURCE] Boss chamber has 2 ammo pickups on the entry ledge, 2 health pickups on debris platforms (may be poisoned), and 2 more health on south edge platforms (may be poisoned). Mike enters with depleted ammo. The ammo is on the entry ledge -- once Mike jumps to the central platform in phase 1, going BACK to the ledge for ammo means crossing acid. In phase 2, the entry ledge is the only stable ground. The resource placement forces Mike to make trips back and forth across acid to resupply. Recommendation: Put ammo pickups ON the central platform or on the larger boss chunk.
- [MECHANICAL] The poisoned pickup mechanic in the boss fight is the peak risk. Mike is at low HP, on a tiny platform, taking wind + projectile damage, and the health pickup he grabs MIGHT HURT HIM INSTEAD. If this happens at 20 HP, Mike dies to a health pack during a boss fight. This will feel like the game robbed him. Recommendation: Boss room health pickups should be guaranteed non-poisoned. The Gluttony theme has been taught across 5 rooms already -- the boss fight should test COMBAT skills, not pickup gambling.
- [CLARITY] The "shoot into the open mouth for 3x damage" mechanic in phase 3 needs a clear visual indicator. Vorago's mouth opening wide should be dramatically visible, with an inner glow or pulsing target. If the mouth hitbox is small and the chunks are drifting, hitting it consistently requires sniper-level accuracy on a platform game engine. Make the hitbox generous.
- [NARRATIVE] "Hungry, little goat? Mother will feed you..." is a great boss intro. The thematic coherence of the fight (being consumed, fighting inside a stomach) is the strongest narrative integration of any boss in Act I. The defeat sequence (acid drains, solid floor revealed, organic walls peel away) is a satisfying resolution. Vorago is the best-written boss.
- **Likely Deaths #7-9:** Phase 2 platform jumping (~70% first attempt -- this is where most players will die multiple times). Phase 3 wind + resource crisis (~40% on retry). Poisoned health pickup at critical HP (~20% chance, feels terrible when it happens).

---

### Circle 3 Summary

**Deaths:** 3-5 (Bile Cistern dead-end poison trap 25-35%, Gut Arena ammo starvation 30-40%, Boss phase 2 platforming 70%+, Boss phase 3 40%)

**Time:** ~16-22 minutes (including 3-4 deaths)

**Verdict:**

What works:
- **The poison mechanic is the best circle-specific mechanic in Act I.** It changes how the player interacts with the most fundamental FPS system (health pickups). The theme (abundance = trap) is communicated through gameplay, not cutscenes.
- **The visual design is outstanding.** Meat walls, green acid, glistening surfaces -- Gluttony looks disgusting and distinct. The shift from Lust's warm marble is shocking.
- **The Feast Hall is the best-designed room in Act I.** A grand table loaded with food/pickups, enemies patrolling aisles, the mechanic showcase in a well-lit readable space. It is thematically perfect.
- **Vorago is the most narratively coherent boss.** The stomach arena, the acid vomit, the inhale mechanic -- every phase reinforces "you are being consumed."

What does not work:
- **The visual tell for poisoned pickups does not work.** A "faint green tint" in a room that is ENTIRELY green is invisible. Mike cannot make informed decisions about pickups, turning a skill/knowledge check into a coin flip. The tell needs to be color-contrasted against the environment, not blended into it.
- **Boss phase 2 platforming is a genre violation.** This is an FPS. Jumping between drifting 2x2 platforms while fighting a boss is precision platforming. These two genres do not combine well at this scale. Enlarge the chunks or reduce the number of submerging ones.
- **Resource starvation is the worst in Act I.** Three weapons with shallow ammo pools, poison reducing effective health recovery, and high enemy counts = Mike is constantly running on empty. The "abundance is a trap" theme should apply to HEALTH pickups, not to AMMO. Give Mike enough ammo to fight. The tension should come from health decisions, not from empty magazines.
- **Three consecutive secret rooms across three circles that Mike never finds.** The Crypt, Boudoir, and Pantry all use WALL_SECRET. They all contain critical resources. Mike finds zero of them. The game needs a more discoverable secret mechanism or needs to be balanced assuming secrets are never found.

**Recommendations:**
1. Overhaul the poison visual tell: safe pickups glow red/warm with a soft pulse. Poisoned pickups glow green with visible drip/bubble particles. The contrast must work in green ambient light.
2. Boss room health pickups must be guaranteed non-poisoned. Test the theme in exploration rooms, not in boss fights.
3. Enlarge phase 2 chunks to 3x3 minimum. Reduce submerging chunks to 2 at a time (not all 6 can submerge). Vorago's boss chunk should be 4x4.
4. Add ammo pickups on the central platform and the boss chunk. Mike should not have to cross acid to resupply.
5. Add 1-2 guaranteed-safe health pickups on the critical path (Feast Hall exit corridor or Larder entrance).
6. Increase ammo drops throughout the circle -- 30% more ammo pickups on the critical path.

---

## Act I Summary

### Cross-Circle Issues

**1. Secret Room Design is Fundamentally Broken**

All three circles hide critical resources behind WALL_SECRET entrances:
- Circle 1 Crypt: Brim Shotgun (first weapon upgrade) + lore
- Circle 2 Boudoir: Safe health + ammo + lore
- Circle 3 Pantry: Guaranteed non-poisoned health (the ONLY reliable healing in the circle) + lore

Mike found zero of these rooms. The game must be balanced for the player who never finds a secret. Currently, it is not: Circle 1 is pistol-only without the Crypt, Circle 2 has no safe healing room without the Boudoir, Circle 3 has no reliable health without the Pantry.

**Fix:** Either make WALL_SECRET entrances more visible (a cracked wall, a draft, a faintly different texture that is noticeable at normal FPS movement speed) OR move critical items to the main path and put bonus items in secrets. Secrets should be "nice to have," not "need to have."

**2. Resource Economy Does Not Scale With Weapon Count**

Mike starts with 1 weapon (pistol, 30/60 ammo). By Circle 3, he has 3 weapons (pistol 60, shotgun 20, cannon 40 = 120 total max ammo). But pickup density does not triple to match. Each "ammo" pickup gives ammo for one weapon type (presumably). Mike is always short on whatever weapon he wants to use.

The total ammo economy is:
- Circle 1: Pickup density 0.5 (scarce). Pistol only. Barely enough.
- Circle 2: Pickup density 0.7 (moderate). Two weapons. Still tight.
- Circle 3: Pickup density 1.5 (high) BUT 50% of health is poisoned. Three weapons. The high pickup density is health-focused (to showcase poison), not ammo-focused. Mike is ammo-starved.

**Fix:** Separate health and ammo pickup density in the theme configuration. Circle 3 should have high health pickup density (for the poison mechanic) AND normal-to-high ammo density (to support three weapons). Currently, "pickupDensity: 1.5" seems to mean "lots of health pickups" which does not help ammo.

**3. Narrow Walkway Syndrome**

Multiple rooms across Act I use 2-cell-wide walkways/ramps as combat arenas:
- Circle 2 Wind Corridor: 2-cell walkway with wind
- Circle 2 Siren Pit: 2-cell ramp with inward wind
- Circle 3 Bile Cistern: 2-cell walkways over acid
- Circle 3 Boss Phase 2: 2x2 floating chunks

Two cells = 4 world units. At CELL_SIZE=2, that is 4 meters of walkable space. In an FPS where the player's preferred movement is strafing and circling, 4 meters of width is restrictive. When you add wind, lava, acid, and enemies, 4 meters is claustrophobic and punishing.

**Fix:** Increase critical walkways to 3 cells (6 world units) for any walkway where combat occurs. Keep 2-cell walkways for pure traversal (no enemies). The Wind Corridor (no enemies) can stay at 2. The Siren Pit, Bile Cistern, and boss chunks need to be wider.

**4. No Mechanic Tutorialization Before Testing**

Each circle introduces a mechanic and tests it in the same room:
- Circle 1: Fog is introduced in Fog Hall, which is also the first combat room. Player fights in fog before learning what fog does to visibility.
- Circle 2: Wind is introduced in the Wind Corridor (good tutorial -- no enemies), but wind+combat is introduced in the Gallery with 5 enemies and lava simultaneously (too many new things at once).
- Circle 3: Poison is introduced via a pickup that MIGHT poison you -- no warning, no tutorial, just "grab it and find out."

**Fix:**
- Circle 1: Fine as-is (fog is passive; the player naturally learns by experiencing it).
- Circle 2: The Gallery should have 2-3 enemies (not 5) the first time wind+combat combine. Save the 5-enemy fight for a room after the player has practiced.
- Circle 3: The first health pickup in the Gullet should be guaranteed safe. The second should be guaranteed poisoned (with a dramatic visual/audio cue). After that, randomize. Teach the pattern before testing it.

### Difficulty Curve

```
Tension/Difficulty over time:

Circle 1:
  Vestibule [2] -> Fog Hall [5] -> Bone Pit [7] -> Columns [7] -> Boss [9]
                    (first combat)   (ambush spike)  (arena OK)    (fog wall)

Procedural [3-4]

Circle 2:
  Antechamber [2] -> Wind Corridor [6] -> Gallery [7] -> Siren Pit [9]
                     (mechanic OK)        (too much)      (TOO HARD)

  -> Tempest Hall [8] -> Boss [10]
     (arena, tired)      (3 phases, exhausting)

Procedural [3-4]

Circle 3:
  Gullet [5] -> Feast Hall [6] -> Larder [7] -> Bile Cistern [7]
  (poison intro) (mechanic core)  (vertical)    (navigation)

  -> Gut Arena [8] -> Boss [10]
     (arena, tight)   (platforming + boss)
```

The curve has two major problems:

1. **Circle 2 has a difficulty spike in the middle (Siren Pit) that exceeds the boss difficulty.** The Siren Pit is harder than any individual boss phase. This is backwards -- the boss should be the hardest part of each circle.

2. **There is no downtime after high-tension moments.** The Siren Pit flows directly into Tempest Hall. The Gut Arena flows directly into Vorago's Maw. Mike is exhausted before he reaches the climax.

### Weapon Progression

| Point in Game | Weapons Available | Ammo Status | Notes |
|---|---|---|---|
| Circle 1 Start | Pistol | 30/60 | Adequate for first rooms |
| Circle 1 Boss | Pistol | 15-25/60 | Tight. Boss is pistol-only for most players |
| Procedural 1-2 | Pistol + Shotgun | Mixed, low | Shotgun found but barely usable |
| Circle 2 Start | Pistol + Shotgun | 30-40 pistol, 5 shotgun | Shotgun is decorative |
| Circle 2 Boss | Pistol + Shotgun | 10-25 pistol, 0-3 shotgun | Essentially pistol-only boss fight again |
| Procedural 3-4 | Pistol + Shotgun + Cannon | Mixed, low | Third weapon found |
| Circle 3 Start | All three | 25-40 / 5-10 / 10-15 | Split ammo, each pool shallow |
| Circle 3 Boss | All three | ~8 / ~2 / ~6 = 16 total | Critical resource crisis |

**The weapon progression gives Mike new guns but never enough ammo to USE them.** By Circle 3's boss, Mike has 16 total rounds across 3 weapons. The shotgun has been essentially decorative since he found it -- 5-10 shells at any given time is 2-3 shots before switching back to pistol.

**Fix:** Double shotgun ammo drops in Circles 2-3. Ensure each arena room's between-wave pickup includes ammo for the most recent weapon acquired. The Hellfire Cannon should come with 20-25 rounds, not 10-15.

### Top 10 Recommendations (Priority Order)

1. **Fix the poison visual tell.** Red glow = safe, green glow + particle drip = poison. Must be visible in green ambient lighting. This is the single highest-impact fix.

2. **Move critical items off WALL_SECRET rooms.** Shotgun to Columns (between waves). Guaranteed-safe health to Circle 3 critical path. Keep lore and bonus ammo in secrets.

3. **Widen combat walkways to 3 cells.** Siren Pit ramp, Bile Cistern walkways, boss phase 2 chunks (3x3 minimum).

4. **Add breather rooms/corridors between intense rooms.** Between Siren Pit and Tempest Hall. Between Gut Arena and Vorago's Maw. 10-15 seconds of walking with a pickup.

5. **Reduce Caprone phase 3 to 2 escalation mechanics** (lava widening + wind acceleration). Remove lingering fire patches OR bridge collapse.

6. **Guarantee boss room health pickups are non-poisoned** in Circle 3. The theme was taught across 5 rooms. The boss should test combat, not pickup gambling.

7. **Scale ammo drops with weapon count.** Double shotgun ammo in Circle 2+. Give 20-25 Cannon ammo on first find. Ensure each arena has multi-weapon ammo drops between waves.

8. **Give Il Vecchio (Circle 1 boss) emissive/glowing elements** visible through fog. Phase 2 needs a gameplay change, not just a visibility nerf. Add a new attack pattern.

9. **Reduce Gallery encounter to 3 enemies** (2 fireGoat + 1 hellgoat) for the first wind+combat room. Full 5-enemy encounter is too much for a mechanic introduction.

10. **Enlarge Vorago's boss chunks to 3x3.** Limit simultaneous submerging chunks to 2 of 6. Add ammo to the boss chunk. The fight should test FPS skill, not platforming precision.

---

*Playtest conducted as Midcore Mike. Total estimated Act I playtime: 40-55 minutes including deaths. Expected total deaths: 8-12. Mike's verdict: "The atmosphere is incredible and each circle feels completely different. But I keep running out of ammo, the boss fights are exhausting, and I died to a health pack during a boss fight. That last one made me alt-F4."*
