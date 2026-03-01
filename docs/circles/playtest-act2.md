---
title: "Act II Playtest Report"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
related:
  - docs/circles/04-greed.md
  - docs/circles/05-wrath.md
  - docs/circles/06-heresy.md
  - docs/circles/00-player-journey.md
---

# Act II Playtest Report -- Circles 4-6

**Playtest Date:** 2026-03-01
**Playtester Persona:** Midcore Mike (Normal difficulty, regular FPS player, not competitive)
**Method:** Paper playtest, walking through every room sequentially, tracking game state and identifying design issues

---

## Reference Data (from codebase)

### Weapon Stats
| Weapon | Damage | Fire Rate | Effective DPS | Mag | Range | Notes |
|--------|--------|-----------|---------------|-----|-------|-------|
| Hell Pistol | 4 | 300ms | ~13 DPS | 12 | 50 | Hitscan, reliable |
| Brim Shotgun | 4x7=28 | 700ms | ~23 DPS | 6 | 12 | Point-blank only |
| Hellfire Cannon | 3 | 150ms | ~20 DPS | 30 | 30 | Projectile stream |
| Goat's Bane | 60 | 1500ms | ~40 DPS | 3 | 100 | AoE 5 cells, slow projectile |

### Enemy Stats
| Enemy | HP | Armor | Effective HP | Damage | Speed | Notes |
|-------|-----|-------|-------------|--------|-------|-------|
| hellgoat | 8 | 0 | 8 | 8 | 0.06 | Melee charger |
| fireGoat | 6 | 0 | 6 | 4 | 0.03 | Ranged, slow |
| goatKnight | 15 | 5 | 20 | 12 | 0.03 | Armored, slow, tanky |
| shadowGoat | 4 | 0 | 4 | 10 | 0.07 | Invisible until 4 cells, fast, glass cannon |

### Pickup Values
- Health pickup: 25 HP
- Ammo pickup: 8 reserve rounds (for current weapon)
- Weapon pickup (Goat's Bane): grants 12 reserve rockets

### Key TTK (Time To Kill) Calculations
- **goatKnight vs. Pistol:** 20 effective HP / 4 dmg = 5 shots, at 300ms = 1.5s (perfect aim, no reload). With 12-round mag, can kill 2 per mag.
- **goatKnight vs. Shotgun:** 20 HP / 28 dmg = 1 shot at point-blank. But goatKnights deal 12 dmg in melee -- getting that close is risky.
- **goatKnight vs. Cannon:** 20 HP / 3 dmg = 7 shots, at 150ms = 1.05s. Comfortable mid-range weapon.
- **goatKnight vs. Goat's Bane:** 20 HP / 60 dmg = 1 rocket, with 5-cell AoE (crowd clear).
- **Mini-boss (40 HP) vs. Goat's Bane:** 40 / 60 = 1 rocket. INSTANT KILL. (See issue below.)

---

## Player State Entering Act II

After completing Act I (Circles 1-3 + 6 procedural floors):
- **HP:** 100/100 (full, healed between circles)
- **Weapons:** Hell Pistol, Brim Shotgun, Hellfire Cannon (3 weapons)
- **Ammo:** Pistol 60, Shotgun 20, Cannon 40 (approximate totals, mag + reserve)
- **Skills learned:** Fog navigation, wind resistance timing, poison pickup identification, vertical platforming, arena lock-in encounters
- **Deaths so far:** ~6-8 total across Act I
- **Confidence:** Medium-high. Mike knows the game. Competent with all three weapons.
- **Time played:** ~45-50 minutes
- **Knowledge:** Mike understands arena lock-ins, has fought hellgoats and fireGoats. Has NOT encountered goatKnights, shadowGoats, pressure plates, destructible environments, weapon theft, escalation timers, illusion walls, or void floors.

---

## Circle 4: Greed

### Room 1: Vault Entrance (8x6, exploration)

**Entering:** HP 100 | Pistol 60 | Shotgun 20 | Cannon 40 | Tension 3/10
**Time estimate:** 30-45 seconds

**Experience:** Mike spawns facing south. Gold everywhere -- a sharp contrast to whatever preceded it. Two ammo pickups are immediately visible. Mike grabs both without thinking (it is his nature). He reads the inscription near the door: *"Aurum clamat -- et qui audit, perit."* He does not know Latin. The English meaning is not provided. He walks south.

The trigger T1 fires in the Treasury approach with the hint: *"The balcony gleams with ammunition. But weight has consequence here."* This is the player's first and only explicit warning about the hoarding mechanic.

**Exiting:** HP 100 | Pistol 60+16 | Shotgun 20 | Cannon 40 | Tension 3/10

**Issues:**
- [CLARITY] The Latin inscription has no English translation. Mike ignores it. Every other inscriptions in the game should be accessible to English-speaking players, or paired with a translation.
- [RESOURCE] Two ammo pickups at spawn immediately push Mike above his starting state. If ammo pickups give +8 reserve to the current weapon, and Mike is holding the pistol (mag 12 + 48 reserve = 60), he now has 60+16 = 76 total pistol ammo. This is not yet at 150% (which would be 90). The hoarding hasn't started biting yet. Good -- the temptation ramp is gradual.
- [CLARITY] The hint text says "weight has consequence" but does not specify the mechanic. It does not say "carrying too much ammo slows you down." A player might interpret "consequence" as anything -- damage, locked doors, enemy spawns. The hint should be more specific without being gamey.

---

### Room 2: Treasury (14x12, exploration, two levels)

**Entering:** HP 100 | Pistol 76 | Shotgun 20 | Cannon 40 | Tension 5/10
**Time estimate:** 2-3 minutes

**Experience:** Mike enters from the north. Ground floor is tight lanes between Chest_Wood pedestals. He immediately sees two goatKnights patrolling -- these are new enemies. They are dark, armored, slow. Mike's first instinct is to shoot.

**First goatKnight encounter (critical moment):** Mike opens fire with the pistol. The goatKnight has 20 effective HP (15 HP + 5 armor). At 4 dmg per shot, Mike needs 5 shots to break armor + kill. At 300ms fire rate, that is 1.5 seconds of sustained fire. The goatKnight moves at speed 0.03 (same as fireGoat -- slow). In the tight lanes between chests, the goatKnight closes distance. Mike strafes around a pedestal. The goatKnight deals 12 damage per hit -- that is significant. If Mike gets cornered in the tight lanes, one hit takes him to 88 HP.

Mike kills the first goatKnight after about 2 seconds of real engagement (accounting for movement and missed shots). Midcore Mike hits about 60-70% of his shots, so call it 7-8 shots = 2.1-2.4 seconds. The second goatKnight is nearby. Mike kills it too. He has spent about 12-16 pistol rounds on the two ground goatKnights.

**Balcony decision:** Mike sees ammo on the balcony (4 pickups). He also sees 2 hellgoats guarding the ramp tops. Mike takes the ramp because he sees loot. He fights the hellgoats on the ramp -- hellgoats are familiar from Act I. 8 HP each, quick kills. Mike now picks up 4 ammo pickups on the balcony. That is +32 reserve ammo for his current weapon.

**Ground floor cleanup:** Mike grabs the 3 ground ammo pickups (+24 more) and the health pickup.

**Ammo status check:** Starting pistol ammo was 76. He spent ~16 on goatKnights and ~8 on hellgoats (24 total). He picked up 7 ammo pickups (+56). Net: 76 - 24 + 56 = 108 reserve pistol ammo. Pistol capacity is 60 (12 mag + 48 reserve). 108/60 = 180%. **Mike is now above the 150% threshold and has NO IDEA.**

**The hoarding penalty activates.** Mike's movement speed is halved. He suddenly feels sluggish. There is NO on-screen indicator, NO audio cue, NO visual effect mentioned in the design doc. The speed reduction just... happens.

Mike thinks the game is lagging, or that there is a new movement zone. He does not connect this to ammo hoarding because nobody told him the specific threshold or consequence.

**Exiting:** HP 100 (healed with pickup) | Pistol ~108 | Shotgun 20 | Cannon 40 | Tension 6/10 | **Movement halved (Mike does not know why)**

**Issues:**
- [CLARITY] **CRITICAL.** The hoarding penalty activates with NO explicit player feedback. The hint in Room 1 said "weight has consequence" but did not explain the mechanic. Mike's first experience of the core circle mechanic is unexplained sluggishness. This will read as a bug, not a design choice. **RECOMMENDATION:** Add a HUD indicator (weight bar, ammo percentage display, or at minimum a clear on-screen text warning: "OVERBURDENED -- Drop ammo to restore speed" when crossing the 150% threshold). Add a distinct audio cue (metallic clinking, coins weighing down). Add a visual effect (gold particle chains dragging from player, vignette, FOV reduction).
- [CLARITY] **How does Mike DROP ammo?** The design doc references "DROP ammo" multiple times but never specifies the player action. Is there a drop button? Does the player open an inventory? Is it automatic? This mechanic does not appear to exist in the current codebase (no drop ammo function found). **RECOMMENDATION:** Implement a "drop ammo" keybind (e.g., holding G drops 8 rounds of current weapon). Display the keybind in the first hint. Without this, the Weight Room puzzle is unsolvable.
- [DIFFICULTY] The 4 hellgoats + 2 goatKnights in one room is the densest encounter so far. But goatKnights at speed 0.03 in the tight chest lanes are manageable. The two-level structure gives Mike vertical retreat options. Difficulty is appropriate.
- [SPATIAL] The balcony ramps at all four corners are generous -- Mike can always reach the balcony. But the tight ground-floor lanes between chests might cause navigation frustration. Ensure chest pedestals have clear collision boundaries.
- [RESOURCE] 7 ammo pickups in one room is extreme. Even if the design intent is "abundance as trap," the player who picks up everything (like Mike) overshoots 150% capacity with no recourse. The trap should have a visible threshold warning BEFORE it activates, not after.

---

### Room 3: Weight Room (10x10, puzzle)

**Entering:** HP 100 | Pistol ~108 | Shotgun 20 | Cannon 40 | Tension 7/10 | **Overburdened, confused about speed**
**Time estimate:** 2-4 minutes (first attempt), possibly 1 death

**Experience:** Mike enters from the north. He is still moving at half speed. He steps onto the pressure plate grid. Trigger T2 fires: *"The floor groans beneath your burden. Let go."*

The plates SINK because Mike's ammo exceeds 150%. He falls into a pit (elevation -1). He does not understand what happened. The hint says "let go" but Mike does not know how to drop ammo. There is no UI for it. There is no keybind for it.

**Mike dies here.** Not from enemies -- from the puzzle. The goatKnight on the far platform fires at him while he is stuck in a sunken plate pit at half movement speed. 12 damage per hit. The hellgoat wading through the plates adds pressure. Mike takes 2-3 hits, panicking because he cannot move properly and does not understand the mechanic. He dies with full ammo and no idea what the puzzle wanted.

**Second attempt:** Mike respawns (presumably at room entrance or checkpoint). He is still overburdened. He tries the plates again. Same result. He has no way to reduce his ammo below 150% because there is no drop mechanic. He cannot shoot enough ammo fast enough (wasting ammo by firing at walls?) to get below threshold before the enemies kill him.

**This is a softlock.** If the player enters the Weight Room with >150% ammo and cannot drop ammo, and the plates sink whenever they stand on them, the player cannot cross the room. They can retreat to the Treasury, but there is nothing to do there -- the enemies are dead, and picking up more ammo makes it worse. The only option is to waste ammo by firing at walls, which is unintuitive and not communicated.

**Assuming Mike figures out wall-shooting or a drop mechanic exists:** He eventually lightens his load, crosses the pressure plates, and fights the goatKnight on the far platform. The goatKnight is stationary, making it an easier fight. Mike kills it, grabs the health pickup at the exit.

**The ammo bait on the far side:** Mike sees 2 ammo pickups past the plates. If he picks them up, he will be overburdened again and the return trip (if needed) becomes impossible. This is clever IF the mechanic is properly communicated. Without clear communication, it is just punishing.

**Exiting:** HP ~75 (after taking some hits) | Pistol ~80 (after wasting some) | Shotgun 20 | Cannon 40 | Tension 8/10 | **1 death (possibly 2)**

**Issues:**
- [MECHANICAL] **CRITICAL BLOCKER.** There is no "drop ammo" mechanic in the codebase. The Weight Room puzzle requires the player to reduce ammo below 150%. Without a drop function, this puzzle is unsolvable by design. **RECOMMENDATION:** Implement ammo dropping immediately. Options: (a) Hold a key to drop ammo in discrete chunks; (b) Interact with a "tithe plate" prop that takes ammo; (c) Auto-drop when stepping on pressure plates with a visual/audio of ammo clattering away. Option (c) is the most thematically resonant -- the room FORCES you to give up what you carry.
- [CLARITY] **CRITICAL.** The hint "let go" is poetic but not actionable. Mike does not know WHAT to let go of, or HOW. A two-part hint system would work: first trigger says "The floor groans beneath your burden" (atmospheric), second trigger (after first plate sink) says "DROP AMMO [G key] to lighten your load" (mechanical). The game must teach the mechanic before punishing failure.
- [DIFFICULTY] The goatKnight firing from across the room while Mike solves a puzzle he does not understand is too punishing. **RECOMMENDATION:** Make the Weight Room goatKnight spawn AFTER the first successful crossing, or have it patrol the exit corridor rather than the platform overlooking the puzzle. The puzzle should teach before the combat pressure intensifies.
- [PACING] This room is a full stop in momentum. Mike went from the fast-paced Treasury fight to a puzzle with no clear solution. The pacing valley is intentional (puzzle room), but the frustration of the unsolvable/unexplained mechanic turns a pacing dip into a pacing wall.

---

### Room 4 (optional): Reliquary (6x6, secret)

**Entering:** HP ~75 | Pistol ~80 | Shotgun 20 | Cannon 40 | Tension 4/10
**Time estimate:** 30 seconds (if found)

**Experience:** The Reliquary is accessed through a WALL_SECRET on the west wall of the Weight Room. Mike is the type who "explores if he notices" but does not pixel-hunt. The WALL_SECRET mechanic has not been introduced yet (that is Circle 6's thing). There is no visual cue mentioned in the design doc -- the secret wall looks identical to other walls.

**Mike does NOT find the Reliquary.** He has no reason to walk into walls. The secret room is a reward for exploration, but the exploration technique (walking into walls) has not been taught yet. In Circle 6, illusion walls are the core mechanic with explicit teaching moments. Here in Circle 4, it is just a hidden secret with no breadcrumb.

**If Mike did find it:** 2 ammo + 2 health pickups, no enemies. A generous reward. But the irony the design doc describes (rewarding the non-hoarder) is lost because Mike IS a hoarder and picking up more ammo would re-trigger the penalty he just escaped.

**Exiting:** Same as entering (Mike did not find it)

**Issues:**
- [SPATIAL] The WALL_SECRET has no visual hint (crack, draft particle, discoloration, sound cue). Since illusory walls are not introduced until Circle 6, placing a secret wall in Circle 4 with zero telegraphing means <5% of players will find it on first playthrough. **RECOMMENDATION:** Add a subtle visual cue: a slight texture seam, a Coin_Pile placed suspiciously close to a wall (drawing the player's eye), or a faint golden glow leaking from behind the wall.
- [NARRATIVE] The Scroll_1 lore in the Reliquary is wasted on almost no one. If the lore is important, it should be in a mandatory room.

---

### Room 5: Auction Hall (12x12, arena)

**Entering:** HP ~75 | Pistol ~80 | Shotgun 20 | Cannon 40 | Tension 7/10
**Time estimate:** 2-3 minutes

**Experience:** Mike enters from the north. Doors lock (arena encounter -- he knows this pattern from Act I). The room has 4 pillars with Coin_Piles at the base. Mike recognizes cover when he sees it.

**Wave 1:** 2 goatKnights (N, S) + 2 hellgoats (E, W). Mike orbits a pillar, using it as cover against the goatKnights. He fights the hellgoats first (familiar, faster, lower HP). Then he turns to the goatKnights, using the pillar to break line of sight. If Mike uses the Hellfire Cannon, the splash damage might accidentally hit a Coin_Pile and destroy a pillar. The design doc says splash damage destroys Coin_Piles which topple pillars. Mike might lose cover without intending to.

**Between waves:** Mike picks up the ammo and health pickup in the center. He has a moment to breathe.

**Wave 2:** 2 goatKnights (corners) + 2 hellgoats (door-side). By now, Mike has possibly destroyed 1-2 pillars through collateral Cannon fire. The room is more open. The second wave is roughly the same composition as the first. Mike fights through it.

**Total enemies:** 4 goatKnights + 4 hellgoats in this room alone. That is 4x20 + 4x8 = 112 effective HP to chew through across two waves. At ~15-20 DPS sustained with missed shots and movement, this is roughly 6-8 seconds of pure damage time spread across a 2-3 minute fight. Manageable but intense.

**Ammo expenditure:** Rough estimate: ~30 pistol rounds and/or equivalent on goatKnights, ~16 on hellgoats. Mike will need the between-wave ammo pickup.

**Exiting:** HP ~60 (some hits from goatKnights at 12 dmg each) | Pistol ~60 | Shotgun ~16 | Cannon ~30 | Tension 5/10 (post-combat relief)

**Issues:**
- [MECHANICAL] The destructible pillar mechanic is cool but poorly telegraphed. If Mike uses the Cannon and accidentally destroys his own cover, he will feel cheated. **RECOMMENDATION:** Make the first pillar destruction triggered by enemy action (a goatKnight charge that clips a Coin_Pile) so the player sees the mechanic demonstrated before they accidentally trigger it. Alternatively, add a "pillar crumbling" warning sound/visual for 1 second before collapse.
- [DIFFICULTY] 8 enemies across 2 waves (4 goatKnights total) is fair for this point in the game. The between-wave resupply is well-placed. No issues.
- [PACING] This is the climactic combat room before the boss. It delivers. The escalating destruction of the room (pillars falling, cover disappearing) creates emergent drama. This room works well.

---

### Room 6: Aureo's Court (14x14, boss)

**Entering:** HP ~60 | Pistol ~60 | Shotgun ~16 | Cannon ~30 | Tension 9/10
**Time estimate:** 3-5 minutes, 1-2 deaths likely

**Experience:** Mike descends stairs into the sunken court. Aureo speaks: *"Everything you carry was taken from another. I will take it from you."* This is excellent -- the boss telegraphs the weapon theft mechanic.

**Phase 1 (100-66% HP): Coin projectile storms.** Aureo fires arcing coin spreads. Mike dodges laterally. The room is 14x14 -- plenty of space. The CandleStick_Triple props mark safe zones between arcs (good visual language). Mike shoots Aureo while dodging. Boss HP is not specified in the design doc for these custom bosses. Assuming Aureo uses archGoat stats (100 HP, as the default boss type) with the 1.5x boss multiplier from EntitySpawner, that is 150 HP total.

At ~15 DPS (pistol, accounting for dodging time reducing aim time), Phase 1 takes about 3.3 seconds of shooting to remove 34% HP (50 HP). In practice, with dodging, this is probably 15-20 seconds. Reasonable.

**Phase 2 (66-33% HP): Weapon theft.** Aureo steals Mike's current weapon. His pistol vanishes. He auto-switches to the shotgun. This is a shock moment -- well designed. She wields the pistol against him. 20 seconds later, she steals the shotgun. Mike is on the Cannon. The stolen weapons appear at room edges with a faint glow.

Mike has to decide: retrieve stolen weapons or keep fighting with what he has. The Cannon is his highest sustained DPS weapon, so losing it last is the worst case. 20 seconds between thefts means Mike has 40 seconds before losing all three weapons. At ~15 DPS with mixed weapons and dodging, he deals about 30-40 HP in those 40 seconds. He is now in Phase 3 territory.

**Phase 3 (<33% HP): ALL weapons stolen.** Mike has NO ranged weapons. The design says he must "use melee charge (ram into boss)" and that melee deals 3x damage.

**CRITICAL QUESTION: Does melee exist?** The codebase has no player melee attack system. The enemy AI has `meleeHitPlayer` functions, but there is no player melee keybind, no ram mechanic, no collision-damage-to-boss system. The design doc says "ram into boss" but this is not implemented.

If melee DOES exist and deals some base damage x3: Mike runs at Aureo and rams her. With 50 HP remaining on the boss and 3x melee multiplier, if base melee is ~5 damage, that is 15 per ram = 3-4 rams to kill. Reasonable but tense.

If melee DOES NOT exist: **Mike is softlocked.** He has no weapons and no way to deal damage. He must retrieve weapons from the room corners (the [A] positions). The stolen weapons are scattered at the 4 corner positions. Mike runs to a corner, picks up a weapon, fires at Aureo, weapon gets stolen again. This creates an infinite loop unless retrieving a weapon lets him keep it for a period. The design does not clarify this.

**Exiting (assuming eventual success):** HP ~30 | Weapons recovered | Tension 10/10 | 1-2 deaths

**Issues:**
- [MECHANICAL] **CRITICAL.** Player melee attack does not exist in the codebase. The Phase 3 "intended path" (ram boss for 3x damage) requires a mechanic that is not implemented. **RECOMMENDATION:** Either (a) implement a player melee/ram attack (sprint + collide with boss = damage) with a keybind/tutorial, or (b) redesign Phase 3 so that retrieving weapons from corners gives you a temporary window before re-theft (e.g., 10 seconds of immunity after pickup), or (c) have Phase 3 scatter ammo instead of weapons, and Aureo drops your weapons on death.
- [CLARITY] The Phase 2 weapon theft is well-telegraphed by the boss intro dialogue. Good.
- [DIFFICULTY] Phase 1 is straightforward dodge-and-shoot. Phase 2 forces weapon adaptation -- interesting and fair. Phase 3 is potentially broken (see melee issue). If melee works, the concept is brilliant (shed possessions to win). If it does not work, this fight is unwinnable without weapon retrieval, which the design does not fully specify.
- [RESOURCE] The boss chamber has 4 ammo + 2 health pickups at edges. But the health pickups are critical because Mike enters at ~60 HP and takes coin storm damage. The 2 health pickups (+50 HP total) are sufficient. The ammo pickups are moot if weapons get stolen anyway. **RECOMMENDATION:** Consider making the health pickups spawn mid-fight (between phases) rather than being pre-placed. Pre-placed edge pickups are easy to grab before the fight starts, reducing Phase 1 tension.
- [NARRATIVE] The thematic payoff of Phase 3 is outstanding on paper. Being stripped of everything and having to charge with nothing is Greed's lesson made mechanical. This is the best boss concept in Act II if the melee mechanic works.

---

### Circle 4: Greed -- Summary

**Deaths:** 1-3 (Weight Room puzzle death is near-guaranteed; boss Phase 3 may cause 1-2 more)
**Time:** ~12-15 minutes
**Room count:** 6 (5 mandatory + 1 secret)

**What works:**
- The visual identity is strong. Gold, opulence, warmth -- a clear departure from Act I.
- The Treasury two-level design creates genuine tactical choices (balcony ammo vs. safety).
- The Auction Hall destructible pillars are a standout mechanic. Emergent gameplay from environmental destruction.
- Aureo's weapon theft is thematically perfect and mechanically interesting (Phase 2).
- The narrative arc (abundance -> burden -> loss -> freedom) is coherent and well-paced.

**What does not work:**
- The hoarding penalty has NO player-facing communication. No HUD element, no clear audio/visual feedback. First experience reads as a bug.
- The "drop ammo" mechanic does not exist. The Weight Room puzzle is unsolvable without it.
- Player melee does not exist. The boss Phase 3 intended path is unimplementable.
- The Reliquary secret room uses Circle 6's illusion wall mechanic before it is introduced, with no hints. Almost no one finds it.

**Recommendations (Priority Order):**
1. **Implement ammo drop mechanic** -- required for Weight Room puzzle to function.
2. **Implement player melee attack** -- required for boss Phase 3 to function as designed.
3. **Add hoarding penalty HUD indicator** -- weight bar, ammo percentage, and/or overburdened status icon.
4. **Add clear tutorial text** when hoarding penalty first activates: "OVERBURDENED. Movement speed halved. Drop ammo [G] or spend it to lighten your load."
5. **Add Reliquary secret room hint** -- subtle visual cue near the WALL_SECRET.
6. **Make Weight Room enemies spawn AFTER puzzle solution** -- teach before punishing.

---

## Between Circles: Greed -> Wrath Procedural Floors

Mike gains ~20 mixed ammo and some health from 2 procedural floors. He enters Circle 5 at roughly:
- **HP:** 100 (healed between circles)
- **Weapons:** Hell Pistol, Brim Shotgun, Hellfire Cannon
- **Ammo:** ~70 Pistol, ~20 Shotgun, ~35 Cannon (approximate after Greed expenditure + procedural resupply)
- **Confidence:** Medium. The Weight Room frustrated him. The boss impressed him.

---

## Circle 5: Wrath

### Room 1: Gate of Dis (10x6, exploration)

**Entering:** HP 100 | Pistol ~70 | Shotgun ~20 | Cannon ~35 | Tension 4/10
**Time estimate:** 20-30 seconds

**Experience:** Mike arrives at the Gate of Dis. The inscription: *"Lasciate ogne speranza, voi ch'intrate."* This one he might recognize -- it is the most famous Dante quote. The room is atmospheric: anvils, chains, red lighting. No enemies. He picks up the ammo and health pickup. The hint fires: *"Beyond this gate, rage festers. Speed is survival."*

This is a good rest beat. Mike collects supplies, absorbs atmosphere, and prepares for what is ahead.

**Exiting:** HP 100 | Pistol ~78 | Shotgun ~20 | Cannon ~35 | Tension 4/10

**Issues:**
- [PACING] Good pacing. A calm room before the storm. The hint about speed foreshadows escalation. No issues.

---

### Room 2: Blood Marsh (16x14, exploration)

**Entering:** HP 100 | Pistol ~78 | Shotgun ~20 | Cannon ~35 | Tension 6/10
**Time estimate:** 2-3 minutes

**Experience:** Mike steps into the marsh. His movement drops to 60%. This is distinct from the hoarding penalty (50%) and should feel different. He sees 5 stone islands and 3 fireGoats perched on them.

**Escalation begins.** When Mike engages the first fireGoat, the escalation timer starts: +10% enemy speed every 5 seconds. Mike does not know this is happening because the mechanic has not been communicated beyond the vague "speed is survival" hint.

**Let's do the escalation math:**
- 0s: Base enemy speed (fireGoat 0.03, hellgoat 0.06)
- 5s: +10% (fireGoat 0.033, hellgoat 0.066)
- 10s: +20%
- 15s: +30%
- 20s: +40%
- 25s: +50%
- 30s: +60% (hellgoat now at 0.096 -- faster than shadowGoat base)
- 35s: +70%
- 40s: +80%
- 45s: +90%
- 50s: +100% (hellgoat now at 0.12 -- DOUBLE speed)

**The escalation is ADDITIVE, not exponential.** +10% of BASE speed per interval. This is linear, not compounding. At 30 seconds of combat, hellgoats are at 0.096. At 50 seconds, they are at 0.12. The design doc said "exponential" in the task prompt, but the actual mechanic is linear (+10% base per 5s). This is more manageable.

**Mike's experience in the marsh:** He wades (60% speed) to the first island, kills the fireGoat (6 HP, 2 pistol shots). Wades to the next. By the time he is on island 3, maybe 30 seconds have passed. The 2 hellgoats wading toward him are now at +60% speed. In the marsh (which also slows them), their effective speed is 0.096 * 0.6 = 0.058 -- still slower than Mike on an island. The marsh equalizer means escalation is somewhat muted here. On islands, hellgoats at +60% are 0.096 -- fast but dodgeable.

**The escalation resets after 3 seconds with no enemies in combat range.** If Mike kills all enemies on one island and has 3 seconds of peace before the next island's enemies engage, the timer resets. This is generous and means the escalation mostly affects individual encounters, not the whole room. Mike island-hops with brief pauses. The timer resets between islands.

Mike picks up ammo from various islands. He takes some fireGoat chip damage (4 dmg each).

**Exiting:** HP ~85 | Pistol ~70 | Shotgun ~20 | Cannon ~35 | Tension 6/10

**Issues:**
- [CLARITY] The escalation mechanic is not communicated to the player. The hint says "speed is survival" but does not explain that enemies accelerate over time. **RECOMMENDATION:** Add a visual timer/indicator when escalation is active. A pulsing red border on the HUD, or enemy glow intensifying as they speed up, or a tempo-increasing heartbeat SFX.
- [MECHANICAL] The 3-second reset is very generous. In practice, island-hopping in the marsh means the escalation resets frequently. The intended tension ("escalation punishes dawdling") is undermined by the room's natural pacing of isolated encounters. **RECOMMENDATION:** Consider a longer reset (5 seconds) or a partial reset (drops by 20% instead of full reset) for the marsh specifically.
- [DIFFICULTY] 3 fireGoats + 2 hellgoats is appropriate for this room. The marsh slow creates interesting tactical decisions. The room works as an introduction to the escalation concept even if the mechanic itself is under-communicated.
- [SPATIAL] Two exits (east to Rage Pit, west to Arsenal) create a branching path. The design doc connects both Blood Marsh to Rage Pit and Blood Marsh to Arsenal. Mike goes east first (more visible exit). The branch is welcome variety.

---

### Room 3: Rage Pit (12x12, platforming)

**Entering:** HP ~85 | Pistol ~70 | Shotgun ~20 | Cannon ~35 | Tension 7/10
**Time estimate:** 1.5-2 minutes

**Experience:** Mike enters at the rim (elevation 0) and looks down into concentric descending tiers. hellgoats at the bottom, fireGoats at tier 2. The fireGoats shoot upward at Mike.

**Vertical combat dynamics:** Mike has the high ground. Shooting downward at fireGoats is favorable. But to clear the hellgoats at the bottom, he must descend. Each tier drops 0.5 units. Mike drops down tier by tier.

The escalation timer runs during the descent fight. With 2 hellgoats + 2 fireGoats, the fight should take ~30 seconds. At +60% speed, the hellgoats (base 0.06) are at 0.096 -- fast but Mike has the elevation advantage. The concentric ring layout means Mike can circle-strafe on each tier.

Mike clears the pit, grabs the health on tier 2, and exits south.

**Exiting:** HP ~80 | Pistol ~60 | Shotgun ~18 | Cannon ~35 | Tension 6/10

**Issues:**
- [SPATIAL] The concentric tier layout is unique and interesting. However, the description says the player must "fight upward" to get back out after clearing the pit. If the exit is at the bottom (south from the rim), Mike does not need to climb back up. But if the exit is at the rim level, the climb back up after descending could be tedious with no enemies left. **Clarify:** The south door appears to be at the rim. The design should ensure there is a ramp or stair on the south side so Mike does not have to platform back up empty tiers.
- [PACING] Vertical combat is a nice change of pace. The descent creates natural tension escalation. Good room.

---

### Room 4: Arsenal (12x6, exploration)

**Entering:** HP ~80 | Pistol ~60 | Shotgun ~18 | Cannon ~35 | Tension 7/10
**Time estimate:** 30-60 seconds

**Experience:** Mike enters a long narrow armory. Weapon displays line the walls. At the far end, the Goat's Bane sits on a pedestal, glowing. A goatKnight guards it; a fireGoat near the entrance provides covering fire.

**The design intent is "sprint past, grab the Bane."** But Mike is a midcore player who fights enemies he encounters. He will NOT sprint past the goatKnight. He will engage.

**If Mike fights first:** He shoots the fireGoat near the entrance (quick kill). Then he engages the goatKnight at range with the pistol. The room is 12x6 -- narrow. The goatKnight advances. Escalation is running. If the fight takes 15 seconds, the goatKnight is at +30% speed (0.039) -- still slow. Mike kills it, walks to the pedestal, grabs the Goat's Bane.

**The punishment for fighting is mild.** The design says "escalation makes them dangerously fast" but +30% on a 0.03 base speed enemy in a 15-second fight is not dangerous. The goatKnight goes from 0.03 to 0.039. That is barely noticeable. The intended "sprint or die" tension does not materialize because the enemies start too slow.

**Mike gets the Goat's Bane.** The hint fires: *"The Goat's Bane. For when one bullet is not enough."* Good flavor text. Mike now has 4 weapons: Pistol, Shotgun, Cannon, and Goat's Bane (3 rockets in mag + 12 reserve from weapon pickup = 15 total rockets).

**Exiting:** HP ~75 | Pistol ~50 | Shotgun ~18 | Cannon ~35 | Bane 15 rockets | Tension 6/10

**Issues:**
- [DIFFICULTY] The "sprint or die" intent fails because goatKnight base speed (0.03) is too low for escalation to matter in a 15-20 second encounter. At 30 seconds, a goatKnight is at 0.039. At 60 seconds, 0.066. The punishment for fighting is not "dangerous" -- it is barely perceptible. **RECOMMENDATION:** Either (a) add more enemies (3-4 fast hellgoats instead of 1 goatKnight) so escalation creates overwhelming numbers, or (b) start the Arsenal escalation at a higher base (e.g., pre-stacked +30% from previous room combat), or (c) reduce the room length so the sprint is trivial but the fight is compressed.
- [PACING] The Arsenal is a brief, focused room. As a weapon acquisition moment, it works. The narrow corridor creates tension. But the design intent (rewarding sprinting over fighting) does not land with midcore players who default to "clear the room."

---

### Room 5: Berserker Arena (14x14, arena)

**Entering:** HP ~75 | Pistol ~50 | Shotgun ~18 | Cannon ~35 | Bane 15 rockets | Tension 8/10
**Time estimate:** 3-4 minutes, possible death in Round 3

**Experience:** Doors lock. The room has 8 destructible barrels arranged in a ring around the center. Each barrel explodes for 15 damage in a 2-cell radius.

**Round 1:** 3 fireGoats spawn from edges. Mike uses the Cannon for mid-range stream fire. fireGoats have 6 HP -- 2 Cannon shots each. Mike might accidentally shoot a barrel if a fireGoat is near one. If a barrel explodes near a fireGoat, it deals 15 damage, instant-killing the fireGoat (6 HP). Mike discovers barrel explosions are powerful. Escalation runs: at 15 seconds, fireGoats are +30% speed. Still manageable.

**Between rounds:** Ammo and health pickups spawn in center. Mike resupplies.

**Round 2:** 2 goatKnights from N and S. Mike has the Goat's Bane now. One rocket (60 damage + 5-cell AoE) will one-shot a goatKnight (20 effective HP) AND potentially chain-kill anything nearby. If both goatKnights are advancing from opposite sides, Mike rockets one, pivots, rockets the other. 2 rockets spent. Round 2 cleared in under 10 seconds.

**Between rounds:** More pickups. Ammo spawn.

**Round 3:** 1 mini-boss hellgoat (40 HP) + 1 fireGoat + 1 goatKnight.

**The mini-boss problem:** The design doc says the mini-boss has 40 HP. The Goat's Bane does 60 damage per rocket with 5-cell AoE. One rocket kills the mini-boss outright. The "first mini-boss in the game" dies before it can attack. This is anticlimactic.

Even without the Bane, the mini-boss has 40 HP. Pistol at 13 DPS = 3 seconds. Cannon at 20 DPS = 2 seconds. The mini-boss is not tanky enough to be a meaningful threat.

**Barrel strategy:** If Mike saved barrels for Round 3, he can detonate one near the mini-boss (15 damage) and finish with weapons (25 HP remaining = 2 seconds of pistol fire). But with the Bane, barrels are irrelevant.

**Exiting:** HP ~65 | Pistol ~45 | Shotgun ~18 | Cannon ~25 | Bane ~12 rockets | Tension 5/10

**Issues:**
- [DIFFICULTY] **The mini-boss is trivially easy with the Goat's Bane.** 40 HP vs. 60 damage rocket = one-shot kill. The "first mini-boss" has less impact than a goatKnight. **RECOMMENDATION:** Either (a) increase mini-boss HP to 80-100 (requires 2 rockets or sustained fire), or (b) give the mini-boss armor (20 armor + 40 HP = 60 effective, surviving one Bane rocket by a sliver), or (c) make the mini-boss resistant to explosions (half damage from AoE). The mini-boss MUST survive at least one Bane rocket to have narrative weight.
- [MECHANICAL] The 8 barrels are a great tactical resource but 8 is too many. With 15 damage each and 2-cell radius, that is 120 total AoE damage available plus the Goat's Bane. The total enemy HP in all 3 rounds is: R1 (3x6=18) + R2 (2x20=40) + R3 (40+6+20=66) = 124 HP. The barrels alone could theoretically kill everything. **RECOMMENDATION:** Reduce to 4-5 barrels. This forces the player to use them strategically rather than spamming.
- [PACING] Round structure with resupply between rounds is well-designed. The escalation timer resets between rounds (3 seconds of no combat). This means each round starts fresh. Consider having escalation NOT reset between rounds to create mounting pressure across the full arena encounter.

---

### Room 6 (optional): Shrine of Fury (6x6, secret)

**Entering:** HP ~65 | Pistol ~45 | Shotgun ~18 | Cannon ~25 | Bane ~12 | Tension 4/10
**Time estimate:** 20 seconds (if found)

**Experience:** Same issue as the Reliquary in Circle 4 -- WALL_SECRET with no visual hint. Mike is the type who explores if he notices things, but two secret rooms using illusion walls in circles before illusory walls are introduced (Circle 6) is asking a lot.

**Probability Mike finds it:** ~10-15%. Slightly higher than the Reliquary because the Berserker Arena is a room Mike spends more time in (3-4 minutes of arena combat, more time to notice walls).

**If found:** 2 health + 2 ammo pickups and a rest area. The escalation timer does not run here (no enemies). Thematic contrast (peace within fury) is lovely. The Scroll_2 lore is a nice touch.

**Exiting:** Same as entering (Mike did not find it, most likely)

**Issues:**
- [SPATIAL] Same as Reliquary -- no visual breadcrumb for the WALL_SECRET. **RECOMMENDATION:** Place a barrel near the secret wall that, when destroyed, reveals a draft/crack visual effect on the wall behind it.
- [PACING] A rest area between the Arena and the Gauntlet would be valuable. Shame it is hidden.

---

### Room 7: Gauntlet (6x20, corridor)

**Entering:** HP ~65 | Pistol ~45 | Shotgun ~18 | Cannon ~25 | Bane ~12 | Tension 8/10
**Time estimate:** 1-2 minutes

**Experience:** Mike enters a long narrow corridor. He advances south. At Z+4, a hellgoat spawns BEHIND him. Mike does not expect this. He spins, shoots it (8 HP, quick kill). He continues. A fireGoat appears ahead on a lower section. He shoots it downhill (easy angle). Another hellgoat spawns behind at Z+8. More fireGoat ahead at Z+10.

**The Gauntlet is a running fight.** The design intent is clear: forward momentum. Mike alternates between shooting ahead and spinning to deal with pursuers. The elevation changes create natural shooting angles.

**Escalation during the Gauntlet:** The timer runs continuously because enemies are always in combat range (spawning behind and ahead). By the time Mike is halfway through (~30 seconds), enemies are at +60% speed. Hellgoats behind him at 0.096 speed are closing fast. Mike must keep moving.

**The Gauntlet math works.** The pressure ramps naturally. The spawns behind create urgency without being unfair (hellgoats at 8 HP die quickly). The fireGoats ahead at 6 HP are dispatched from elevation advantage. The midpoint pickups (health + ammo) are well-placed.

**Exiting:** HP ~50 (took some hits from behind-spawns he reacted to slowly) | Pistol ~35 | Shotgun ~16 | Cannon ~20 | Bane ~10 | Tension 9/10

**Issues:**
- [PACING] The Gauntlet is excellent. Pure forward momentum, enemies from both directions, escalation creates mounting dread. This is the best room in Circle 5.
- [DIFFICULTY] 3 hellgoats + 2 fireGoats in a narrow corridor with escalation is challenging but fair. The elevation advantage when shooting forward compensates for the rear pressure. Well-balanced.
- [SPATIAL] The 6-cell width is narrow enough to feel claustrophobic but wide enough to strafe. Good proportions. The ramp up-down-up elevation profile adds visual and tactical variety.

---

### Room 8: Furia's Colosseum (16x16, boss)

**Entering:** HP ~50 | Pistol ~35 | Shotgun ~16 | Cannon ~20 | Bane ~10 | Tension 10/10
**Time estimate:** 3-5 minutes, 1-2 deaths likely

**Experience:** Mike enters the sand arena. Furia roars: *"RAGE. RAGE UNTIL THERE IS NOTHING LEFT."* No subtlety. Mike appreciates this after Aureo's cunning.

**Boss HP:** Assuming Furia uses archGoat stats (100 HP) x1.5 boss multiplier = 150 HP.

**Phase 1 (100-66% HP, ~50 HP to remove): The Charge.**
Furia bull-rushes with 1-second telegraph. Mike dodges sideways. The 16x16 arena is spacious -- plenty of room to sidestep. Furia hits the wall, stunned for 3 seconds. Mike unloads: 3 seconds of Cannon fire = ~60 damage. That is more than the Phase 1 HP threshold in one stun cycle. Mike might skip Phase 1 in 2 charges.

**Problem: The stun window is too generous.** 3 seconds of free damage against a stationary target with the Cannon (20 DPS) or Bane (one rocket for 60 damage) means Mike melts through Phase 1 in 1-2 stun cycles. With the Goat's Bane, one rocket during stun = 60 damage. Two charges + two rockets = Phase 1 done.

**Phase 2 (66-25% HP, ~62 HP to remove): The Whip.**
Furia rips chains from the ceiling. 4-cell range sweeping arcs. Mike must stay beyond 4 cells. The Goat's Bane has 100-cell range -- perfect for this. Mike circles the arena, firing rockets from distance. At 60 dmg per rocket and ~62 HP to remove, Mike needs 2 rockets (one rocket gets him to Phase 3 threshold with 2 HP of HP to spare). Phase 2 could be over in 2 shots.

**The Goat's Bane trivializes Phase 2.** The weapon was introduced THIS CIRCLE specifically for the player to use. But its 60 damage per shot means boss phases fall in 1-2 hits. 150 HP boss / 60 damage per rocket = 2.5 rockets to kill. The entire boss fight could be 3 rockets.

**Phase 3 (<25% HP, ~38 HP remaining): Berserker + Closing Walls.**
Furia is faster than the player. Walls close at 1 cell/10 seconds. Mike has ~38 HP of boss to burn through. With the Cannon (20 DPS), that is 2 seconds of firing. With rockets, one more hit finishes it.

**Wall closure math:**
- 0s: 16x16
- 10s: 14x14
- 20s: 12x12
- 30s: 10x10
- 40s: 8x8 (lethal)

Mike has 40 seconds before the arena becomes lethal. But he only needs 2-3 seconds of damage to finish the boss. Phase 3 ends almost immediately.

**The problem is the Goat's Bane.** It makes this boss trivial. The entire fight can be completed in ~30 seconds with 3-4 rockets.

**Without the Bane (pistol/cannon only):** Phase 1 takes 3-4 stun cycles (~40 seconds). Phase 2 requires sustained mid-range fire while dodging whip arcs (~30 seconds). Phase 3 race against walls (~20 seconds). Total: ~90 seconds. This is a good fight. The Bane shortens it to ~30 seconds.

**Exiting:** HP ~30 | Ammo depleted across weapons | Tension 10/10 dropping to 2/10 (relief)

**Issues:**
- [DIFFICULTY] **The Goat's Bane trivializes the boss.** 60 damage per rocket vs. 150 HP boss = 3 rockets to kill. The boss has 3 distinct phases designed for a multi-minute fight, but the Bane allows skipping them in seconds. **RECOMMENDATION:** Either (a) increase Furia's HP significantly (300+ HP) to account for the Bane, (b) make Furia resistant to explosives (half AoE damage), (c) limit Bane ammo before the fight (ensure Mike has 3 or fewer rockets entering the boss), or (d) have Furia charge so frequently in Phase 1 that the player cannot safely fire rockets (the charge windmill leaves no 1.5-second windows for rocket fire).
- [DIFFICULTY] The Phase 1 stun window (3 seconds) is too long. At 20 DPS Cannon or 40 DPS Bane, 3 seconds is 60-120 damage. Phase 1 requires only 50 HP of damage. One stun cycle can end Phase 1. **RECOMMENDATION:** Reduce stun to 1.5-2 seconds, or have Furia recover faster with each successive wall hit (3s, 2.5s, 2s, 1.5s...).
- [MECHANICAL] The Phase 3 closing walls are a great concept but the timing is off. Mike needs ~2 seconds to finish the boss but has 40 seconds before lethal compression. The walls never actually threaten him. **RECOMMENDATION:** Either (a) start walls closing at Phase 2, not Phase 3, so the space is already reduced when berserker mode activates, or (b) start Phase 3 arena at 12x12 (pre-closed) and close to 8x8 in 20 seconds, halving the available time.
- [PACING] The 3-phase design is well-structured on paper. Charge -> Whip -> Berserker is a clear escalation. But the numeric balance allows players with the Bane to skip the entire progression. Bosses should be balanced against the player's BEST available weapon, not their average.

---

### Circle 5: Wrath -- Summary

**Deaths:** 0-2 (Gauntlet might catch Mike off guard; boss is potentially too easy with Bane)
**Time:** ~15-18 minutes
**Room count:** 8 (7 mandatory + 1 secret)

**What works:**
- The escalation mechanic is thematically perfect for Wrath. Speed = survival.
- The Gauntlet is the best room in Act II. Pure forward momentum, natural escalation pressure, excellent pacing.
- The Blood Marsh island-hopping creates interesting tactical choices.
- The Gate of Dis is an effective atmospheric breather.
- Getting the Goat's Bane feels GREAT -- powerful weapon acquisition is a highlight.
- The Berserker Arena barrel strategy adds tactical depth.

**What does not work:**
- 8 rooms is the most in any circle so far. However, none feel redundant. The Rage Pit is the weakest room (vertical combat is interesting but not narratively essential). If one room must be cut, cut the Rage Pit and move its enemies into the Blood Marsh.
- The escalation mechanic is under-communicated. No visual indicator.
- The Arsenal's "sprint-or-die" intent fails because goatKnight base speed is too low for escalation to matter in short fights.
- The Goat's Bane trivializes the Berserker Arena mini-boss (one-shot) AND the boss fight (3 rockets total).
- The boss Phase 3 wall closure never threatens because the damage window is too short.

**Recommendations (Priority Order):**
1. **Rebalance Furia's HP to 300-400** to account for Goat's Bane availability.
2. **Increase mini-boss HP to 80-100** so it survives at least one Bane rocket.
3. **Add escalation visual indicator** (pulsing red HUD border, enemy glow increase, heartbeat SFX).
4. **Start wall closure at Phase 2** (not Phase 3) so it builds gradually.
5. **Reduce Phase 1 stun window** from 3s to 2s (or decreasing with each charge).
6. **Reduce Berserker Arena barrels** from 8 to 4-5.
7. **Consider cutting or merging Rage Pit** into Blood Marsh if playtime runs long.

---

## Between Circles: Wrath -> Heresy Procedural Floors

Mike gains ~20 mixed ammo and some health from 2 procedural floors. He enters Circle 6 at roughly:
- **HP:** 100 (healed between circles)
- **Weapons:** Hell Pistol, Brim Shotgun, Hellfire Cannon, Goat's Bane
- **Ammo:** ~50 Pistol, ~16 Shotgun, ~25 Cannon, ~6 Bane rockets
- **Confidence:** High. Wrath felt manageable. Mike has 4 weapons. He feels powerful.

---

## Circle 6: Heresy

### Room 1: Narthex (8x6, exploration)

**Entering:** HP 100 | Pistol ~50 | Shotgun ~16 | Cannon ~25 | Bane ~6 | Tension 3/10
**Time estimate:** 30-45 seconds

**Experience:** Mike spawns in a temple vestibule. Purple lighting, funerary urns, a scroll with heretical text. The atmosphere is strikingly different from Wrath's red fury -- cold, dim, liturgical. No enemies. Mike reads the scroll: *"The faithful entered here. The faithful were wrong."*

There is a WALL_SECRET on the east wall at (28, 5). This is the first illusory wall in Circle 6. Mike has no reason to walk into walls. He walks past it to the south door.

**Exiting:** HP 100 | Ammo unchanged | Tension 3/10

**Issues:**
- [CLARITY] The Narthex WALL_SECRET is a missed teaching opportunity. This is where the circle's core mechanic should be introduced gently. The secret wall leads to "a small alcove with an ammo pickup." A modest reward. But Mike will never find it because nothing teaches him to check walls. **RECOMMENDATION:** Place the WALL_SECRET directly on the critical path. Make the south door appear locked/blocked, and the only way forward is through the illusory east wall. This teaches the mechanic in a safe, consequence-free room before the stakes escalate. Alternatively, have an NPC/lore message explicitly say: "The walls here are not what they seem. Test them."
- [PACING] As a calm introduction to a new circle, this works. But the missed teaching moment is costly because every subsequent room assumes the player knows about illusory walls.

---

### Room 2: Nave of Lies (14x10, exploration)

**Entering:** HP 100 | Pistol ~50 | Shotgun ~16 | Cannon ~25 | Bane ~6 | Tension 5/10
**Time estimate:** 1-2 minutes, likely 1 death

**Experience:** Mike enters a church nave with pew rows and a central aisle. Two fireGoats patrol the east and west aisles. He fights them (familiar enemies, 6 HP each, quick kills). Then he looks for the exit.

**The FLOOR_VOID trap:** The center aisle -- the obvious forward path -- is a FLOOR_VOID trap (3x4 cells). The floor looks identical to surrounding floor (PavingStones058). Mike walks straight down the center aisle because that is what you do in a church nave. He falls through. 5 damage + teleport back to room entrance.

**Mike's reaction:** Confusion and mild frustration. He lost 5 HP and got teleported. He now knows the floor can be fake, but he does not know how to identify it. The design doc mentions a subtle "Stain001" decal near FLOOR_VOID traps, but this is described as something "expert players notice." Mike is not an expert player. He does not notice stains on stone floors.

**Finding the real exit:** Mike now needs to find the WALL_SECRET on the west wall. He has just learned (the hard way) that floors can be fake. But nobody told him walls can also be fake. He might try the east door (visible) which leads to the Catacombs. He might wander the pew rows looking for another door. Eventually, he either finds the west WALL_SECRET by accident (walking along the west wall) or goes east to the Catacombs.

**If Mike goes east to Catacombs instead of finding the Confessional:** He skips a room. The Confessional is not on the critical path -- both the Confessional route and the Catacombs route lead to the Trial Chamber. This is fine from a progression standpoint but Mike misses the Confessional's teaching moments.

**Exiting:** HP 95 (5 dmg from void fall) | Ammo slightly reduced (fireGoat fights) | Tension 7/10

**Issues:**
- [CLARITY] **CRITICAL.** The FLOOR_VOID trap is the player's first encounter with fake floors, and it happens with zero warning. The subtle Stain001 decal is not sufficient for midcore players. The fall deals 5 damage (minor) and teleports to room entrance (annoying but not punishing), so the CONSEQUENCE is mild. But the FEELING is frustrating because the player had no agency -- they could not have known. **RECOMMENDATION:** Add a stronger visual tell. Options: (a) A skeleton/corpse prop near the void edge (someone fell before you), (b) small pebbles visually falling into the void (subtle but observable), (c) a creaking sound when the player is 1 cell away from void, (d) the void floor tiles shimmer/flicker subtly compared to solid ones.
- [CLARITY] The WALL_SECRET exit is not hinted. The room's "real" west exit requires walking through a wall. If Mike has not learned about illusory walls (and the Narthex does not teach this), he will default to the visible east door to the Catacombs. **RECOMMENDATION:** Place a prop near the WALL_SECRET that draws the player's eye -- a CandleStick_Triple casting light that appears to extend through the wall, or a blood trail on the floor leading into the wall.
- [DIFFICULTY] 2 fireGoats in a large room with pew cover is easy. Appropriate for an exploration room. No issues.

---

### Room 3: Confessional (6x6, exploration)

**Entering:** HP ~95 | Pistol ~48 | Shotgun ~16 | Cannon ~25 | Bane ~6 | Tension 6/10
**Time estimate:** 1-2 minutes (only if Mike found the WALL_SECRET exit in the Nave)

**Experience:** Mike enters through the WALL_SECRET (if he found it). Three confessional booths. The room is dim -- one candle.

**Booth A (north):** Mike enters. Health pickup inside. Nice.

**Booth B (center):** Mike enters. A shadowGoat ambushes him. This is Mike's FIRST shadowGoat encounter. shadowGoats are invisible until 4 cells away. In a 2x2 booth, Mike is already within 4 cells when he enters. The shadowGoat appears suddenly and attacks.

**shadowGoat stats:** 4 HP, 10 damage, speed 0.07. In a 2x2 booth, Mike cannot dodge. He takes 10 damage. Then he shoots the shadowGoat (4 HP = 1 pistol shot). The ambush is over in 1-2 seconds. Mike is at 85 HP.

**The ambush is effective as a jump scare** but the tight quarters mean Mike has no counterplay. He takes the hit regardless of skill. This is acceptable for a 10 damage hit, but it would be frustrating if damage were higher.

**Booth C (south):** The back wall is WALL_SECRET. Mike might not check it (he was just ambushed and is cautious). If he does walk through, he finds the corridor to the Trial Chamber. If he does not, he is stuck in a dead-end room with no visible exit except back to the Nave. This could cause confusion.

**Exiting:** HP ~85 | Pistol ~47 | Shotgun ~16 | Cannon ~25 | Bane ~6 | Tension 7/10

**Issues:**
- [CLARITY] If Mike cannot find the Booth C WALL_SECRET exit, he is stuck in a room with no visible exit except backwards. **RECOMMENDATION:** After the Booth B ambush, have a lore message appear: "Confession reveals the hidden path" or have the shadowGoat's death trigger the Booth C wall to flicker/shimmer for 3 seconds, revealing the exit.
- [MECHANICAL] The shadowGoat ambush in a 2x2 space gives zero counterplay. The damage (10 HP) is acceptable, but the design should acknowledge this is a scripted hit, not a skill check. If future shadowGoat encounters are also in tight spaces, the pattern becomes "take unavoidable damage," which is frustrating.
- [PACING] Three booths with three outcomes (reward, ambush, exit) is a clever micro-puzzle. The room is small and focused. Good design if the exit is findable.

---

### Room 4: Catacombs (12x14, maze)

**Entering:** HP ~85 (or 95 if Mike skipped Confessional) | Pistol ~48 | Shotgun ~16 | Cannon ~25 | Bane ~6 | Tension 8/10
**Time estimate:** 3-5 minutes (maze navigation), possible 1-2 deaths

**Experience:** Mike descends stairs into a claustrophobic underground maze. Low ceiling (2.5 units). Narrow 2-cell corridors. Fog thickens. Torch_Metal props mark some pathways.

**3 shadowGoats roam the corridors.** shadowGoats are invisible until 4 cells away. In 2-cell-wide corridors, 4 cells of visibility means Mike sees them roughly 8 world units ahead (4 cells x CELL_SIZE 2). That is a short warning distance in a narrow corridor. shadowGoats move at 0.07 speed -- FAST. They close the 4-cell gap in seconds.

**shadowGoat encounters in tight corridors:** Mike turns a corner. A shadowGoat materializes 4 cells ahead. He has maybe 1-2 seconds to react. shadowGoats have 4 HP -- one shotgun blast or one pistol shot kills them. But the surprise factor means Mike takes at least one hit (10 damage) in about half of encounters. With 3 shadowGoats in the maze, Mike takes ~15-20 damage from jumpscares alone.

**FLOOR_VOID traps:** Three trap floors scattered in the maze. One is next to a torch (the "trap torch"). Mike has learned from the Nave that floors can be fake. But the torch placement INVITES him to walk toward what should be a safe path marker. Falling deals 5 damage + teleport to maze entrance. If Mike hits 2 of the 3 traps, that is 10 damage + having to re-navigate the maze from the start TWICE.

**WALL_SECRET shortcuts:** Two illusory walls create shortcuts. By now, Mike MAY have learned to test walls (if he found the Confessional exit). If not, he navigates the maze the long way.

**Total maze time:** A maze in an FPS is inherently risky. If the maze is solvable in 2-3 minutes, it is tense but acceptable. If Mike hits multiple void traps and gets teleported back to the entrance, the maze could take 5+ minutes. That crosses the 60-second boredom threshold multiple times during re-traversal of already-cleared corridors.

**Exiting:** HP ~60 (shadowGoat hits + void falls) | Pistol ~40 | Shotgun ~14 | Cannon ~25 | Bane ~6 | Tension 9/10

**Issues:**
- [PACING] **CRITICAL.** Mazes in FPS games are almost universally unfun. The Catacombs combines a maze, invisible enemies, fake floors, and a teleport-to-start punishment. Each FLOOR_VOID fall resets Mike to the maze entrance. If he has already cleared shadowGoats on his first pass, the re-traversal is EMPTY corridors with no enemies and no content -- just dead air. **RECOMMENDATION:** (a) Limit FLOOR_VOID teleport-to-start to ONE occurrence. Subsequent falls deal damage but do not teleport. (b) Have shadowGoats respawn after void-fall reset so the maze is not empty on retry. (c) Add a persistent trail mechanic (blood footprints on the floor) so Mike can see where he has already been. (d) Consider shrinking the maze from 12x14 to 8x10 -- the current size is excessive for a 2-cell-wide corridor maze.
- [DIFFICULTY] shadowGoats + illusory walls + void floors is THREE deception mechanics stacked simultaneously. Each one individually is interesting. All three at once in a claustrophobic maze is overwhelming. **RECOMMENDATION:** Introduce them sequentially. Room 2 (Nave) teaches void floors. Room 3 (Confessional) teaches illusory walls and shadowGoats. Room 4 (Catacombs) should then combine void floors + illusory walls, but reduce shadowGoats to 1-2 instead of 3 to prevent the overlap from being exhausting.
- [CLARITY] The "trap torch" next to a FLOOR_VOID is genuinely unfair on first encounter. The game has taught Mike that torches mark safe paths. Subverting that expectation is the POINT of Heresy, but it should happen ONCE, not be indistinguishable from the other torches. **RECOMMENDATION:** Make the trap torch visually distinct -- a different flame color (greenish), or flickering erratically, or placed at a different height. The subversion should be noticeable in hindsight ("oh, that torch looked different").
- [SPATIAL] The maze has no minimap, no breadcrumb system, and no way to orient. In a 12x14 grid with 2-cell corridors, there are roughly 40+ corridor cells. Mike can easily get lost. **RECOMMENDATION:** Add subtle directional cues -- a faint draft from the correct direction, distant sounds from the exit, or increasingly bright lighting toward the exit.

---

### Room 5: Trial Chamber (12x12, arena)

**Entering:** HP ~60 | Pistol ~40 | Shotgun ~14 | Cannon ~25 | Bane ~6 | Tension 8/10
**Time estimate:** 2-3 minutes

**Experience:** Mike enters a church courtroom. The north half has an elevated judge's platform (+1 elevation). Doors lock.

**Wave 1:** 3 fireGoats spawn ON the elevated bench and fire downward at Mike. Mike is on the ground floor. The fireGoats have elevation advantage. Mike cannot easily reach them because the ramp to the bench is hidden behind a WALL_SECRET.

**This is a critical teaching moment.** The game has used WALL_SECRET as obstacles/secrets so far. Now it uses one as a TOOL -- the player must discover the illusory wall to access the ramp and fight the elevated enemies. If Mike has learned about illusory walls, he tests the bench's south face and finds the ramp. If not, he stands below and trades fire with the fireGoats at a disadvantage.

**Fighting from below:** fireGoats have 6 HP, 4 damage, and fire from elevation. Mike has cover (the bench edge itself provides some protection). He can shoot upward with the pistol (hitscan, range 50 -- no problem). The fireGoats are stationary targets on the bench. Mike kills them from below in ~10-15 seconds. He does not NEED to find the ramp.

**Wave 2:** 2 shadowGoats + 2 fireGoats. The shadowGoats walk THROUGH illusory wall segments. This is terrifying and effective -- enemies appearing through walls demonstrates the mechanic from the enemy's perspective. The fireGoats spawn on the bench again. Mike fights a multi-directional battle.

The shadowGoats (4 HP, 10 damage, speed 0.07) are dangerous in the open arena. Mike must deal with them quickly. Two shotgun blasts eliminate both. The fireGoats on the bench are less threatening now that Mike knows the layout.

**Exiting:** HP ~45 | Pistol ~30 | Shotgun ~10 | Cannon ~22 | Bane ~6 | Tension 6/10

**Issues:**
- [CLARITY] The WALL_SECRET ramp is a good use of the mechanic as a player tool. However, the fireGoats can be killed from below without finding the ramp, undermining the teaching moment. **RECOMMENDATION:** Give the bench fireGoats partial cover (the bench edge blocks projectiles from below). This forces Mike to find the ramp or accept a very slow fight. The mechanic becomes necessary, not optional.
- [DIFFICULTY] Wave 2's shadowGoats walking through walls is excellent. This is the best use of the shadowGoat + illusory wall combination in the circle.
- [PACING] The arena lock-in is a familiar pattern from earlier circles. The Trial Chamber adds the elevation and illusion twist. Well-paced within the circle's structure.

---

### Room 6: Ossuary (8x8, exploration)

**Entering:** HP ~45 | Pistol ~30 | Shotgun ~10 | Cannon ~22 | Bane ~6 | Tension 7/10
**Time estimate:** 1-2 minutes

**Experience:** Mike descends stairs into a bone storage chamber. Chain_Coil hanging from the ceiling creates visual clutter. 2 shadowGoats lurk among the chains.

**The chain visual clutter + invisible enemies:** This is cruel. The shadowGoats (invisible until 4 cells) are hidden among hanging chains that already obscure vision. When a shadowGoat materializes, it is hard to distinguish from the chains in the first fraction of a second. Mike takes at least one hit (10 damage).

Mike clears the 2 shadowGoats. The room is transitional -- no puzzle, moderate combat, atmospheric. He moves to the exit.

**Exiting:** HP ~35 | Pistol ~28 | Shotgun ~10 | Cannon ~22 | Bane ~6 | Tension 7/10

**Issues:**
- [DIFFICULTY] Mike is entering the boss at ~35 HP. He has taken cumulative damage from shadowGoat ambushes, void falls, and arena combat. The Ossuary's 2 shadowGoats deal another ~10-20 damage. Health pickups in this circle are scarce -- the last health pickup Mike found was in the Trial Chamber. **RECOMMENDATION:** Add a health pickup to the Ossuary. The room is transitional and a pre-boss resupply point would help. Mike is entering the boss at dangerously low HP.
- [PACING] The Ossuary feels like filler. It has no unique mechanic (just shadowGoats + chains, already seen). It exists as a "breath before the boss" but does not provide new content. **RECOMMENDATION:** Either add a health resupply here or merge this room into the corridor leading to the boss.

---

### Room 7 (optional): Heretic's Library (6x8, secret)

**Entering:** Same as pre-Trial Chamber (if found via WALL_SECRET in Trial Chamber east wall)
**Time estimate:** 30 seconds (if found)

**Experience:** Accessed through WALL_SECRET in the Trial Chamber. Bookshelves, a reading podium, lore scrolls. 2 ammo + 1 health pickup. The Scroll_1 contains lore about Profano: *"Profano was the temple's high priestess. She did not fall from faith -- she saw through it. The veil between real and false is her domain. To fight her, you must see what is."*

This lore is valuable boss preparation. It tells Mike that Profano creates illusions and that identifying the real one is the key. If Mike finds this room, the boss fight is significantly less confusing.

**Probability Mike finds it:** 15-20%. The Trial Chamber east wall WALL_SECRET has no specific breadcrumb. However, by this point in Circle 6, Mike may have started testing walls out of paranoia. The shadowGoats walking through walls in Wave 2 might prompt him to try the same.

**Exiting:** HP improved (+25 from health) | Ammo slightly improved | Knowledge: "The boss uses illusions"

**Issues:**
- [NARRATIVE] The Profano lore in this room is too important to be hidden behind a secret wall. If only 15-20% of players find it, 80% of players enter the boss fight blind to the illusion mechanic. **RECOMMENDATION:** Move the lore to a mandatory room (the Ossuary scroll, or a trigger in the boss chamber entrance) and keep the Library as a bonus resource room.

---

### Room 8: Profano's Chapel (14x14, boss)

**Entering:** HP ~35 (without Library) or ~55 (with Library) | Pistol ~28 | Shotgun ~10 | Cannon ~22 | Bane ~6 | Tension 10/10
**Time estimate:** 3-6 minutes, 1-3 deaths likely

**Experience:** Mike ascends the ramp into the chapel. Pentagram floor, violet candles, a chandelier overhead. Profano speaks: *"Truth is the first heresy. I am its priestess. Look upon me -- which of me is real?"*

**Boss HP:** Assuming archGoat stats (100 HP) x1.5 = 150 HP.

**Phase 1 (100-60% HP, ~60 HP to remove): Illusion Copies.**
Profano creates 3 illusory copies. All 4 figures move around the pentagram. Only the REAL Profano fires damaging projectiles. Fake copies animate casting but emit no projectile.

**How does Mike identify the real one?** He must observe which copy actually fires projectiles. This requires watching all 4 figures simultaneously in a 14x14 room. With Mike's FOV (~90 degrees in a standard FPS), he can see roughly 1/4 of the room at once. He must pan quickly to catch which copy fires a real projectile.

**The tell is good but requires patience.** Mike takes hits while observing. Profano's damage is not specified for the custom boss. Assuming 15 damage per projectile (archGoat stats), Mike at 35 HP can take 2 hits before dying. He does NOT have the luxury of observation. He will likely die here at least once while trying to figure out the mechanic.

**If Mike did not find the Library lore,** he does not know the copies are illusory. He shoots the first figure he sees. It shatters (particle effect) and reforms 5 seconds later. He wastes ammo on fakes. Each fake wastes 4-8 rounds. With limited ammo, this is punishing.

**After 1-2 deaths, Mike understands:** Only the copy that fires real projectiles is real. He watches for incoming fire, tracks the source, and shoots that one. He still wastes some ammo on fakes but eventually brings Profano to 60%.

**Phase 2 (60-30% HP): Inversion.**
Camera rotates 180 degrees on Z-axis (upside-down). Movement controls invert for 5 seconds, normalize for 5 seconds, cycling on a 10-second period. Profano fires faster projectiles.

**This phase will be extremely disorienting.** Upside-down camera + inverted controls is a classic disorientation mechanic. Mike will struggle to move and aim. If Profano fires at 15 damage per projectile with shorter intervals, Mike is taking hits. At 35 HP (after dying and respawning), Mike might die again here.

**The inversion cycle (5s inverted, 5s normal):** Mike learns to fight during the normal windows and dodge/survive during the inverted windows. This is learnable but demands patience. The 10-second cycle means ~50% of the time controls are wrong. Combined with dense fog (0.10), this phase is punishing.

**Phase 3 (30-0% HP): Collapsing Floor.**
Random 2x2 tile sections become FLOOR_VOID for 3 seconds, then reform. Up to 4 sections void simultaneously. Profano hovers. The altar center is safe. Mike must fight while standing on the stable center platform.

**The safe zone (altar at center):** The altar is a 2x2 FLOOR_RAISED platform. Mike can stand here and fire at Profano. But Profano is hovering and firing projectiles. If Mike camps the altar, he is a stationary target. He must dodge projectiles while managing collapsing floor tiles around him.

**The 2x2 safe zone in a 14x14 room:** 4 cells of safe ground out of 196 total cells. With 4x 2x2 void sections active (16 cells void), that leaves 180 cells of floor minus 4 safe cells = 176 cells of unreliable ground. Mike must constantly move while tracking which tiles are about to collapse.

**Fall damage:** FLOOR_VOID falls deal 5 damage + teleport. In the boss fight, teleporting back to the room entrance mid-combat would be devastating. Does the boss fight FLOOR_VOID teleport to entrance or just to a nearby safe cell? This is not specified. If it teleports to entrance, the phase is broken. If it just deals 5 damage and drops Mike to a lower level, it is harsh but survivable.

**Exiting (assuming eventual success):** HP ~15 | Ammo mostly depleted | Tension 10/10 | 2-3 deaths total in this fight

**Issues:**
- [DIFFICULTY] **Mike enters this boss at ~35 HP with limited ammo.** The cumulative damage from Catacombs + Ossuary leaves him under-resourced. The boss has 3 complex phases. This is the hardest boss in Act II by far, and Mike arrives in the worst condition. **RECOMMENDATION:** Add health and ammo pickups in the Ossuary or the corridor between Ossuary and Chapel. The boss should test skill, not punish resource scarcity from the maze.
- [CLARITY] Phase 1 illusion copies: The tell (real one fires projectiles) is learnable but requires observation time. At 35 HP, Mike cannot afford observation time. **RECOMMENDATION:** Add a secondary tell: the real Profano casts a faint shadow, or her candle's flame is a different color, or she makes a distinct sound when moving. Give the player a way to identify the real boss that does not require eating projectile damage.
- [MECHANICAL] Phase 2 camera inversion is divisive. Some players find it fun; many find it nauseating. Upside-down rendering combined with inverted controls for extended periods can cause motion sickness. **RECOMMENDATION:** Add an accessibility option to disable camera inversion (keep only the control inversion, which is disorienting without being sickness-inducing). At minimum, add a very brief warning before each inversion ("Reality shifts..." text flash).
- [DIFFICULTY] Phase 3 collapsing floor with 4 simultaneous void sections is chaotic. The 3-second collapse/reform cycle combined with 4-second intervals means the floor is in constant flux. Combined with projectile dodging, this is extremely demanding. For Midcore Mike, this is 2-3 death territory. **RECOMMENDATION:** Start with 2 simultaneous collapses and increase to 4 as Profano's HP drops, creating a ramp within the phase.
- [MECHANICAL] **FLOOR_VOID fall destination in boss fight is unspecified.** If falling through void teleports to room entrance (as in Nave/Catacombs), the boss fight is broken -- Mike is teleported out of the locked arena. **CRITICAL:** Boss fight FLOOR_VOID must deal damage only (no teleport) or teleport to a safe cell within the room. This needs explicit specification.
- [RESOURCE] 3 ammo + 2 health pickups in the chapel. The health pickups are at the NW and NE corners. During Phase 3 floor collapse, these corners may be void when Mike needs them. **RECOMMENDATION:** Place at least one health pickup on the central altar platform (safe ground) so it is always accessible.

---

### Circle 6: Heresy -- Summary

**Deaths:** 2-4 (Catacombs void falls 1, Boss phases 1-3 deaths 1-3)
**Time:** ~15-20 minutes
**Room count:** 8 (6 mandatory + Confessional optional route + 1 secret)

**What works:**
- The thematic concept is excellent. A temple of lies where nothing is trustworthy. The shift from Wrath's honesty (speed = survival) to Heresy's deception is jarring in a good way.
- The Trial Chamber's use of WALL_SECRET as a player TOOL (not just a trap) is the best design idea in this circle.
- shadowGoats walking through illusory walls in Wave 2 is a standout moment.
- The Confessional three-booth structure is a clever micro-puzzle.
- Profano's 3-phase design is the most mechanically complex boss in Act II.

**What does not work:**
- The illusion wall mechanic is NEVER explicitly taught. The first encounter (Narthex WALL_SECRET) is an optional hidden alcove. The second (Nave exit) is required but has no hint. Mike may go the entire circle without understanding that walls can be walked through unless he accidentally bumps into one.
- The Catacombs maze is too large and too punishing. Void-fall-to-entrance resets combined with invisible enemies in empty corridors on retry is the definition of unfun.
- The cumulative health drain across the circle leaves Mike under-resourced for the boss. Health pickups are too scarce.
- Phase 2 camera inversion risks motion sickness.
- Phase 3 FLOOR_VOID behavior in boss fight is unspecified (teleport destination).
- The Heretic's Library lore (boss preparation) is hidden behind a secret wall.

**Recommendations (Priority Order):**
1. **Teach illusory walls in the Narthex** by placing one on the critical path (block the obvious door, make the wall the only exit).
2. **Specify boss FLOOR_VOID behavior** as damage-only (no teleport) during boss fight.
3. **Add health pickups** to the Ossuary and the boss arena center platform.
4. **Shrink the Catacombs** from 12x14 to 8x10. Limit void-fall teleport to ONE occurrence.
5. **Move Profano lore** from the hidden Library to a mandatory room.
6. **Add accessibility option** for Phase 2 camera inversion (disable camera flip, keep only control inversion).
7. **Add visual breadcrumbs** for WALL_SECRET exits (light leaking through, draft particles, blood trails).
8. **Reduce Catacombs shadowGoats** from 3 to 2.

---

## Act II Summary

### Cross-Circle Issues

1. **Two unimplemented mechanics block core gameplay:**
   - **Ammo drop** (required for Circle 4 Weight Room puzzle) -- does not exist in codebase.
   - **Player melee/ram attack** (required for Circle 4 boss Phase 3) -- does not exist in codebase.
   These are not balance issues. They are missing features. Circle 4 cannot be played as designed without them.

2. **Secret rooms use Circle 6's illusion wall mechanic in Circles 4 and 5** before the mechanic is introduced. The Reliquary (C4) and Shrine of Fury (C5) both use WALL_SECRET with no visual hint. <5% of players will find them. Either add visual breadcrumbs or accept they are for replay/completionist only.

3. **No new weapon in procedural floors between circles.** Mike enters each circle with the same loadout. The Goat's Bane pickup in Circle 5 is the only weapon gain in Act II. This is fine -- 4 weapons is a solid arsenal -- but it means the circle-specific mechanics must carry the novelty burden alone.

4. **Health pickup scarcity in Circle 6** contrasts sharply with Circle 4's ammo abundance and Circle 5's balanced resupply. Mike arrives at the Circle 6 boss at 35 HP. This is not a difficulty choice -- it is resource starvation from the maze + shadowGoat ambushes with insufficient healing.

### Difficulty Curve

| Circle | Deaths (estimated) | Difficulty Feel | Player Frustration |
|--------|-------------------|-----------------|-------------------|
| 4 (Greed) | 1-3 | Medium-High | High (unexplained mechanics) |
| 5 (Wrath) | 0-2 | Medium | Low (Goat's Bane is powerful) |
| 6 (Heresy) | 2-4 | High | High (maze + boss + resource scarcity) |

**The curve dips in Circle 5.** The Goat's Bane makes Wrath feel easier than Greed despite being a later circle. The intended escalation pressure is undermined by the weapon's power. Circle 6 then spikes sharply -- not because the mechanics are harder, but because the player is under-resourced and the teaching is insufficient.

**Ideal curve:** Greed (medium) -> Wrath (medium-high) -> Heresy (high). To achieve this:
- Fix Greed's clarity issues (the difficulty should come from tactical choices, not confusion).
- Rebalance Wrath's boss and mini-boss against Goat's Bane availability.
- Improve Heresy's resource economy and mechanic teaching so difficulty comes from mastery, not frustration.

### New Mechanic Clarity Scorecard

| Mechanic | Circle | How Taught | Grade |
|----------|--------|-----------|-------|
| Hoarding penalty | 4 | Vague hint text, no HUD indicator | F |
| Ammo dropping | 4 | Not taught (not implemented) | F |
| Pressure plates | 4 | Discovered by failure, hint text "let go" | D |
| Destructible pillars | 4 | Accidental discovery via splash damage | C |
| Weapon theft | 4 | Boss dialogue telegraphs it | A |
| Melee charge | 4 | Not taught (not implemented) | F |
| Escalation (speed ramp) | 5 | Vague hint "speed is survival" | D |
| Destructible barrels | 5 | Likely discovered by accidental explosion | B |
| New weapon (Goat's Bane) | 5 | Pickup with hint text | A |
| Illusory walls (WALL_SECRET) | 6 | Never explicitly taught | F |
| Void floors (FLOOR_VOID) | 6 | Discovered by falling through | D |
| shadowGoat invisibility | 6 | Discovered by ambush | C |
| Boss illusion copies | 6 | Observable (which fires real projectiles) | B- |
| Camera inversion | 6 | No warning | D |
| Collapsing floor (boss) | 6 | Builds on void floor knowledge | C |

**5 out of 15 mechanics receive a D or F for clarity.** This is too many unexplained or unimplemented mechanics for a midcore audience. Hardcore players will enjoy the discovery; midcore players will feel cheated.

### Top 10 Recommendations for Act II (Priority Order)

1. **Implement ammo drop mechanic** -- Circle 4 is unplayable without it.
2. **Implement player melee attack** -- Circle 4 boss Phase 3 requires it.
3. **Add hoarding penalty HUD indicator** -- weight bar, ammo %, overburdened icon + clear text.
4. **Teach illusory walls in Narthex** -- put one on the critical path.
5. **Rebalance Furia (Circle 5 boss) HP to 300+** to account for Goat's Bane.
6. **Increase mini-boss HP to 80-100** -- must survive one Bane rocket.
7. **Shrink Catacombs maze** and limit void-fall teleport frequency.
8. **Add health pickups to Circle 6** -- Ossuary, boss arena center.
9. **Add escalation visual indicator** -- pulsing HUD border, enemy glow.
10. **Specify boss FLOOR_VOID** as damage-only (no teleport) during Profano fight.

### Time Budget

| Section | Estimated Time | Target | Status |
|---------|---------------|--------|--------|
| Circle 4: Greed | 12-15 min | 10-15 min | On target |
| Procedural 4->5 | 5-7 min | 5-7 min | On target |
| Circle 5: Wrath | 15-18 min | 12-15 min | Slightly long |
| Procedural 5->6 | 5-7 min | 5-7 min | On target |
| Circle 6: Heresy | 15-20 min | 12-15 min | Over budget (maze) |
| **Act II Total** | **52-67 min** | **44-59 min** | **Heresy runs long** |

The Catacombs maze is the primary time sink pushing Circle 6 over budget. Shrinking it from 12x14 to 8x10 and limiting void-fall resets should save 3-5 minutes.

### Final Verdict

Act II has strong thematic design and excellent variety between its three circles. Greed's inversion of abundance, Wrath's escalation urgency, and Heresy's trust destruction form a coherent emotional arc. The problems are almost entirely in **communication** and **numeric balance**, not in concept. Fix the missing mechanics (ammo drop, melee), add player-facing indicators for the new systems, rebalance against the Goat's Bane, and Act II will be a standout section of the game.
