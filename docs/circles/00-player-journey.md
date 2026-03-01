---
title: "The Player Journey"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 0
sin: n/a
boss: n/a
act: all
mechanic: narrative-arc
related:
  - docs/GAME-BIBLE.md
  - docs/circles/01-limbo.md
  - docs/circles/09-treachery.md
  - docs/circles/playtest-act1.md
  - docs/circles/playtest-act2.md
  - docs/circles/playtest-act3.md
---

# GOATS IN HELL — The Player Journey

> The complete game script. Every circle, every key moment, from the fall to the final revelation.
> Individual circle design docs (`01-limbo.md` through `09-treachery.md`) contain room-by-room layouts, material specs, and encounter details. This document is the narrative and mechanical arc.

---

## The Descent

### The Fall (Opening Cutscene)

No menu. The game opens mid-fall. The camera looks UP — a shrinking circle of light, the surface of the earth receding. Wind howling. The goat tumbles through darkness, through rock, through roots, through things that should not exist beneath the ground. Title card fades in:

**GOATS IN HELL**

Then: impact. Blackness. Silence. The screen brightens slowly to reveal a stone chamber.

---

## Act I: Ignorance (Circles 1–3)

The player knows nothing. The mechanics are cruel teachers.

### Circle 1 — LIMBO (Ignorance)

> *"Per me si va ne la città dolente..."*

**Sin:** Ignorance
**Boss:** Il Vecchio (The Old One) — ancient patriarch, gatekeeper
**Mechanic:** Dense fog (visibility ~8 cells)
**Weapon:** Hell Pistol only
**Trash Mobs:** hellgoat (Brown goatman)
**Rooms:** 6 — Vestibule → Fog Hall → Bone Pit (optional) / Crypt (secret) → Columns (arena) → Boss Chamber

**The Experience:**
You wake in the Vestibule. Dante's gate inscription is carved on the north wall. You can barely see. The fog is thick — shapes move at its edges. You move south into the Fog Hall, where three goatmen patrol in triangle loops. You hear them before you see them. This circle teaches: **listen first, then shoot.**

The Bone Pit is a side branch — a platforming room with an elevated perimeter walkway over a void center. Pickups lure you down. When you drop, three more goatmen ambush-spawn. The Crypt is hidden behind a secret wall — the Brim Shotgun waits inside. Players who explore are rewarded.

The Columns room locks its doors when you enter. Two waves of three goatmen each. Six stone columns break line-of-sight — you orbit them, peek, fire. When the last goat falls, the fog lifts briefly. You see the stairs descending. A breath of clarity before the boss.

Il Vecchio's Chamber is below ground. Two torches flank the entrance. One torch burns behind the boss — his silhouette. He speaks: *"You carry what is not yours, little goat."* Phase 1: methodical staff attacks, summons fog wisps. Phase 2 (below 50% HP): fog density surges to 0.12 — you're nearly blind. You fight by sound. When he falls, the way down opens.

**Title card:** *CIRCLE THE SECOND — LUST*

**→ 2 procedural floors (Lust theme foreshadowing)**

---

### Circle 2 — LUST (Desire)

> *"La bufera infernal, che mai non resta, mena li spirti con la sua rapina..."*
> (The hellish storm, which never rests, sweeps the spirits with its fury...)

**Sin:** Desire
**Boss:** Caprone — hermaphroditic Baphomet, inherently dual-gendered
**Mechanic:** Siren pulls (wind zones drag the player toward lava hazards)
**Weapon:** Hell Pistol → Brim Shotgun found in procedural floors before this circle
**Trash Mobs:** hellgoat (Brown) + fireGoat (Crimson)
**Rooms:** 7 — Antechamber → Wind Corridor → Lover's Gallery → Siren Pit → Tempest Hall (arena) → Boudoir (secret) → Caprone's Sanctum

**The Experience:**
The architecture shifts from cold stone to warm marble. The walls are polished, almost inviting. Warm amber light from wall-mounted candelabras. Then you notice the wind — a constant low pull toward the east wall. On the other side of that wall: lava.

The Wind Corridor is the tutorial. A long, narrow passage with lava channels on both sides and wind blowing crosswise. You learn to lean into the wind, time your movements between gusts. The wind zones have `timer_on/timer_off` — they pulse. Move during the lull.

The Lover's Gallery is wider — almost a museum. Marble columns, fabric banners. But fireGoats (Crimson) lurk here, the first ranged enemies. They shoot from across the room while the wind pushes you toward wall-mounted lava traps. You must use the columns for both cover from projectiles AND wind resistance.

The Siren Pit is a vertical room — a circular pit with a spiraling ramp downward. Wind pulls inward and down. The pit center is lava. You descend the ramp while enemies fire from multiple elevations above and below you. Fall off the ramp = lava. This is the circle's signature 3D moment.

Tempest Hall is the arena. The room is divided by three lava channels running north-south. Bridges cross them but the wind periodically shifts direction, forcing you to different bridges. Two waves of mixed hellgoat/fireGoat. After clearing, the wind drops.

Caprone's Sanctum. The Baphomet sits on a throne of woven marble. Phase 1: seduction — wind pulls you toward the boss while Caprone fires slow-moving projectiles you must dodge laterally against the wind. Phase 2: the throne shatters, Caprone becomes mobile. Dual-armed attacks (left=melee, right=ranged simultaneously). The wind now rotates, changing pull direction every 10 seconds. Phase 3 (below 25%): the room's floor cracks, lava rises in the channels. Less floor = less space to dodge.

**Title card:** *CIRCLE THE THIRD — GLUTTONY*

**→ 2 procedural floors (Gluttony theme foreshadowing)**

---

### Circle 3 — GLUTTONY (Excess)

> *"Grandine grossa, acqua tinta e neve per le tenebre si riversa..."*
> (Huge hail, tainted water, and snow pour through the murky air...)

**Sin:** Excess
**Boss:** Vorago — grotesque mother, earth-devourer
**Mechanic:** Poisoned pickups (50% chance health pickups deal damage instead)
**Weapon:** Hellfire Cannon (AK-47) found in procedural floors before this circle
**Trash Mobs:** hellgoat (Green, sickly) + fireGoat (Crimson)
**Rooms:** 7 — Gullet → Feast Hall → Larder → Bile Cistern → Gut Arena → Pantry (secret) → Vorago's Maw

**The Experience:**
You descend into organic architecture. The walls are no longer stone — they're meat. Leather textures over curved surfaces. The floor is slick with moisture (moss textures). Everything glistens.

The Gullet is a winding corridor that narrows and widens like a throat swallowing. The ceiling drops in places — you crouch. The floor is uneven with raised and lowered sections. Green goatmen (sickly olive, red eyes) wait in the wider chambers.

The Feast Hall is a large rectangular room with a long stone table running its center. The table is covered with props (Barrel_Apples, Pot_1, SmallBottles). Health pickups are scattered everywhere — but half are poisoned. The player learns to be selective, to question abundance. Gluttony's lesson: **not everything that heals you is good for you.**

The Larder descends. A vertical room — shelving carved into the walls (Shelf_Arch props) stacked with barrels and crates. You descend on narrow platforms between shelves. Enemies on different shelf levels fire across the gap. One misstep = fall two stories. Ropes (Rope_1/2/3) hang between shelves — decorative but they mark safe paths.

The Bile Cistern is a flooded room. The floor is a pool of acid (FLOOR_LAVA reskinned with green tint). Raised stone walkways crisscross the pool. Enemies stand on different walkways. Poisoned pickups sit tantalizingly on dead-end walkways — lures for the greedy.

Gut Arena. The room is circular, the walls undulate (curved). The floor has three concentric rings separated by acid channels. You fight on the rings, jumping between them. Two waves of green goatmen. The inner ring shrinks as acid rises between waves — less space, more pressure.

Vorago's Maw. The room is shaped like a stomach. Curved walls, acid pool floor with a central raised platform. Vorago crouches on the platform, immense. Phase 1: vomit projectiles — arcing acid pools that create temporary floor hazards. Phase 2: ground pound — the platform fragments, creating floating chunks you must jump between. The stable floor is gone. Phase 3 (below 25%): Vorago inhales — a massive wind pull toward her mouth. You must shoot while resisting the suction. Kills Vorago by shooting into the open mouth.

**Title card:** *CIRCLE THE FOURTH — GREED*

**→ 2 procedural floors (Greed theme foreshadowing)**

---

## Act II: Temptation (Circles 4–6)

The player has weapons, knows the combat, understands the patterns. Now the game tests their discipline.

### Circle 4 — GREED (Avarice)

> *"Or discendiam omai a maggior pieta..."*
> (Now let us descend to greater wretchedness...)

**Sin:** Avarice
**Boss:** Aureo — vain adorned she-goat, Salome figure
**Mechanic:** Hoarding penalty (excess ammo above 150% capacity halves movement speed)
**Weapon:** All weapons through Hellfire Cannon
**Trash Mobs:** goatKnight (Dark, armored) + hellgoat (Brown)
**Rooms:** 6 — Vault Entrance → Treasury → Weight Room → Auction Hall (arena) → Reliquary (secret) → Aureo's Court

**The Experience:**
Gold. Everything gleams. The walls are polished metal with gold accents (Metal textures with warm tint). DiamondPlate floors reflect torchlight. Coin_Pile props are scattered on every surface. The abundance is overwhelming. And the game punishes you for wanting it.

Ammo pickups are everywhere — far more than other circles. But every pickup beyond 150% capacity slows you. goatKnights (Dark, armored, slow) appear for the first time. They're tanky — you want every bullet. The tension: **you need ammo to kill the armored enemies, but carrying it slows you enough that they catch you.**

The Treasury is a vast room lined with Chest_Wood props on pedestals. goatKnights patrol between rows. The room has two levels — a ground floor and a mezzanine balcony accessed by ramps on each side. Ammo pickups line the balcony. Do you go up for the ammo (slow = exposed on the ramp) or stay lean on the ground?

The Weight Room is a puzzle-platforming room. The floor is divided into pressure plate sections. Walking on them with heavy ammo (high weight) causes them to sink — blocking the exit. You must DROP ammo to cross. But what you drop stays dropped. Greed's lesson: **let go.**

The Auction Hall arena. goatKnights and hellgoats in mixed waves. The room has four pillars with Coin_Pile props at their bases. Destroying the coin piles drops the pillars — opening sightlines but removing cover. The room reshapes itself as you fight.

Aureo's Court. A circular throne room. Gold marble floor, gleaming metal walls. Aureo stands in the center adorned in gold chains and crowns (modeled onto the Dainir female base). Phase 1: summons coin projectile storms — they spread in arcs, hard to dodge. Phase 2: she steals your current weapon — it vanishes, you switch to the next one. She uses your stolen weapon against you. Phase 3: she steals ALL weapons. You must use melee (running into her) or find the discarded weapons scattered at the room's edges. The player must become weightless — possessionless — to win.

**Title card:** *CIRCLE THE FIFTH — WRATH*

**→ 2 procedural floors (Wrath theme foreshadowing)**

---

### Circle 5 — WRATH (Rage)

> *"Fitti nel limo dicon: 'Tristi fummo...'"*
> (Fixed in the mud they say: 'We were sullen...')

**Sin:** Rage
**Boss:** Furia — hyper-masculine, exaggerated male anatomy, maximum rage
**Mechanic:** Escalation (enemy speed increases 10% every 5 seconds of active combat)
**Weapon:** Goat's Bane (Bazooka) found in this circle's arena
**Trash Mobs:** fireGoat (Crimson) + hellgoat (Brown) + goatKnight (Dark)
**Rooms:** 8 — Gate of Dis → Blood Marsh → Rage Pit → Arsenal → Berserker Arena → Gauntlet → Shrine of Fury (secret) → Furia's Colosseum

**The Experience:**
Red. Everything is red. Cracked concrete stained with blood (Concrete textures with red-brown tint). Brick walls (dark Bricks variants). Metal chains everywhere (Chain_Coil props). The ambient lighting shifts from blue (Limbo) to furious orange-red.

The escalation mechanic creates urgency. Every fight has a clock — the longer you take, the faster and more dangerous enemies become. The lesson: **kill fast or be overwhelmed.** This circle rewards aggression, punishes hesitation.

The Gate of Dis is a massive doorway flanked by Anvil props. Through it, the Blood Marsh — a large room with a waist-high liquid floor (water/blood). Movement is slow in the marsh. Raised stone islands provide normal-speed platforms. Crimson fireGoats fire from the islands while you wade between them. Speed matters here because the escalation timer is running.

The Rage Pit is a circular pit with descending stone tiers — an amphitheater. Enemies spawn on higher tiers and charge downward. You fight from the bottom up. Each tier cleared is a tier of elevation gained. The vertical combat tests spatial awareness.

The Arsenal is a long narrow room with weapon displays (WeaponStand props, Shield_Wooden, Sword_Bronze on walls). The Goat's Bane sits on a pedestal at the far end. Enemies guard it. This is the "run and grab" room — do you fight or sprint? Escalation punishes fighting here; sprinting to the Bane and then using it is the intended play.

The Berserker Arena is the main arena. Three rounds, escalating. Round 1: fireGoats. Round 2: goatKnights. Round 3: mixed + a mini-boss (larger hellgoat with 40HP). The Goat's Bane shines here — rockets clear groups before escalation ramps them to lethal speed. The arena has destructible Barrel props that explode for area damage.

The Gauntlet is a long corridor with enemies spawning behind you as you advance. You cannot stop — standing still means the escalated enemies behind you catch up. Forward, always forward. Ramps create elevation changes — you shoot downhill at enemies ahead while the horde chases from behind.

Furia's Colosseum. An open circular arena with a sand floor (Ground textures). Chains hang from the ceiling (Chain_Coil). Furia is enormous — the Dainir male base pushed to maximum musculature morphs. Phase 1: bull-rush charges with antlers lowered. Dodge sideways — he hits the wall, stunned for 3 seconds. Phase 2: he rips chains from the ceiling and swings them as whip weapons. Wider attack range, must stay far. Phase 3 (below 25%): berserker mode. He's faster than you. The arena walls start closing in (literal — the room shrinks). You must kill him before the arena crushes you both.

**Title card:** *CIRCLE THE SIXTH — HERESY*

**→ 2 procedural floors (Heresy theme foreshadowing)**

---

### Circle 6 — HERESY (Defiance)

> *"Suo cimitero da questa parte hanno con Epicuro tutti suoi seguaci..."*
> (On this side, Epicurus and all his followers have their cemetery...)

**Sin:** Defiance
**Boss:** Profano — witch, heretical priestess
**Mechanic:** Illusion walls (some walls are walkable, some floors are traps)
**Weapon:** All weapons through Goat's Bane
**Trash Mobs:** shadowGoat (Gray, invisible until close) + fireGoat (Crimson)
**Rooms:** 8 — Narthex → Nave of Lies → Confessional → Catacombs → Trial Chamber (arena) → Ossuary → Heretic's Library (secret) → Profano's Chapel

**The Experience:**
A defiled temple. PavingStones floors (ancient), Marble walls with sections cracked and stained. The architecture looks sacred — arched doorways, vaulted ceilings — but everything is inverted. Crosses hang upside-down (Banner_2 props). Candles burn black.

The illusion mechanic: WALL_SECRET cells are scattered throughout. Some walls that LOOK solid are walkable — you discover passages by walking into walls. Some FLOORS that look solid are FLOOR_VOID covered by a visual trick — step on them and you fall. The player must test everything. Trust nothing.

shadowGoats (Gray, pale, cyan eyes) appear for the first time. They're semi-invisible until within 4 cells. In a circle about illusion, the enemies themselves are illusions until they strike. Low HP (4) but they're glass cannons — high damage, surprise attacks.

The Nave of Lies is a long church nave with rows of pews (Bench props). The direct path forward is a trap — FLOOR_VOID disguised. The real path goes through an illusory side wall. The player learns: the obvious path is always wrong here.

The Confessional is a small room with three booths (cabinet-like enclosures). One contains a pickup. One contains a shadowGoat. One contains the actual exit (illusory back wall). Which booth do you enter?

The Catacombs are a maze. Low ceilings, narrow corridors, skull props. Multiple illusory walls create shortcuts. Multiple trap floors create dead ends. The map is unreliable — what you see is not what exists. Torches mark safe paths but some torches are traps too.

The Trial Chamber arena. A church courtroom. The judge's bench is elevated — enemies spawn on the high platform and fire down. To reach them, you must find the illusory walls that lead to the ramp behind the bench. Two waves — the second wave includes shadowGoats that appear INSIDE illusory walls, walking through them to flank you.

Profano's Chapel. A circular ritual space with a pentagram on the floor (Tile pattern). Profano stands at the altar (BookStand + Candle props). Phase 1: she creates 3 illusion copies of herself. Only one is real — hitting a fake does nothing. The real one attacks. You must find her by watching which one casts actual projectiles. Phase 2: she inverts the room — the visual flips upside down (camera rotation effect). You're disoriented. Controls reverse briefly. Phase 3: the floor itself becomes unreliable — random tiles become FLOOR_VOID for 3 seconds, then reform. The ground cannot be trusted.

**Title card:** *CIRCLE THE SEVENTH — VIOLENCE*

**→ 2 procedural floors (Violence theme foreshadowing)**

---

## Act III: Descent (Circles 7–9)

The player is hardened. The game stops teaching and starts punishing.

### Circle 7 — VIOLENCE (Bloodshed)

> *"Or convien che Gerion si mova..."*
> (Now it is necessary that Geryon moves...)

**Sin:** Bloodshed
**Boss:** Il Macello (The Butcher) — brute Minotaur, clublike male anatomy
**Mechanic:** Bleeding (constant 1 HP/second drain; each kill restores 10 HP)
**Weapon:** **Brimstone Flamethrower** found here — the scapegoat's destiny weapon
**Trash Mobs:** goatKnight (Dark) + fireGoat (Crimson) + hellgoat (Brown)
**Rooms:** 10 — Pier → Blood River → River Banks → Thorny Passage → Thornwood → Burning Shore → Flamethrower Shrine → Slaughterhouse (arena) → Butcher's Hook (secret) → Il Macello's Abattoir

**The Experience:**
Dante's Circle 7 has three sub-rings: violence against others (Blood River), violence against self (Thorny Forest), violence against God/nature (Burning Sands). This circle mirrors all three.

The bleeding mechanic is terrifying. From the moment you enter, you're dying. Your HP ticks down. The only healing is killing. You cannot explore leisurely. You cannot hide. You must fight to live. Violence's lesson: **in this circle, pacifism is suicide.**

The Pier is a short entrance overlooking the Blood River — a massive room with a waist-deep crimson liquid floor (FLOOR_LAVA with deep red tint). Raised stone walkways cross it. goatKnights wade in the blood, slower but tankier. From the Pier's elevation, you see the whole room laid out below.

The Blood River. You descend to the walkways. The blood does 2 DPS if you touch it. Enemies wade through it (they're resistant). You must stay on the narrow stone paths. The paths branch — multiple routes to the far side. Some dead-end at loot. Your HP is bleeding, so lingering on dead ends is costly.

The Thorny Passage transitions from the river to the forest. A narrow corridor with thorn-covered walls (Rust textures, sharp geometry). Contact with walls deals 5 damage. The corridor weaves — you must navigate precisely while enemies chase. Platforming: the corridor has sections at different elevations, connected by short jumps. Miss the jump = thorn wall contact.

The Thornwood is a larger room with dense columns of thorny growth (structural columns with Rust texture + surface imperfections). Enemies hide among the columns. You can't hug walls for cover — the walls hurt. You must fight in the open lanes between thorns. Visibility is restricted. The bleeding accelerates your urgency.

The Burning Shore is an open expanse — sandstone floor (Ground textures), fire geysers erupting periodically (fire env zones with timer_on/off). The openness is a relief from the thorny claustrophobia. But fire geysers are lethal and the enemies here (fireGoats) have ranged attacks across the open space. No cover, no walls, just distance and timing.

The Flamethrower Shrine. A small room, almost a tomb. The Brimstone Flamethrower sits on a stone altar. When you pick it up, the inscription reads: *"The wilderness gave you fire. Use it."* This is THE weapon — the one from the game's premise. The goat with the flamethrower. It changes everything: continuous stream, short range, sets enemies on fire (DOT). From here on, combat shifts from peek-and-shoot to push-and-burn.

The Slaughterhouse arena. An industrial space — meat hooks (Chain_Coil hanging from ceiling), metal grating floors (Metal textures), rusted walls. Three waves: goatKnights, then fireGoats, then both. The flamethrower excels here — the close quarters are its domain. Between waves, meat hooks drop from the ceiling as new hazards.

Il Macello's Abattoir. A massive room — the floor is a metal grating over a void (FLOOR_VOID visible through grate). Meat hooks hang at intervals. Il Macello is enormous — the Dainir male base at maximum size, wielding a cleaver. Phase 1: overhead cleave attacks. Dodge sideways. He gets stuck in the grating for 2 seconds after missing. Phase 2: he hooks a Chain_Coil and uses it as a grapple — pulls you toward him across the arena. You must shoot while being dragged. Phase 3: he activates the "processing line" — sections of the floor grating retract, revealing the void below. The arena literally shrinks as floor panels disappear. Final stand on the remaining floor.

**Title card:** *CIRCLE THE EIGHTH — FRAUD*

**→ 2 procedural floors (Fraud theme foreshadowing)**

---

### Circle 8 — FRAUD (Deception)

> *"Luogo è in inferno detto Malebolge..."*
> (There is a place in Hell called Malebolge...)

**Sin:** Deception
**Boss:** Inganno — beautiful deceiver, Geryon face
**Mechanic:** Mimic enemies (some pickups are enemies in disguise, attack on proximity)
**Weapon:** All weapons including Flamethrower
**Trash Mobs:** shadowGoat (Gray) + hellgoat (Green, deceptive)
**Rooms:** 9 — Portico → Hall of Mirrors → Bolgia of Flatterers → Bolgia of Thieves → Shifting Maze → Counterfeit Arena → Mimic's Den → Serenissima (secret) → Inganno's Parlor

**The Experience:**
Beautiful. That's the first impression. Polished marble floors, silk-draped walls (Fabric textures), soft candlelight (Candle, CandleStick_Triple props). It looks like a palace. It's all a lie.

Mimic enemies look exactly like health/ammo pickups until you're within 2 cells. Then they attack — high damage, fast. The player must be paranoid. Every pickup is suspicious. The flamethrower's area-of-effect becomes defensive — sweep an area before approaching pickups to trigger mimics at safe distance.

The Hall of Mirrors is a rectangular room with polished marble walls that "reflect" (a visual effect). Your shots bounce off the walls (reflected shots mechanic foreshadowing Circle 9). shadowGoats (invisible) lurk in the reflections — you see their reflection but not the real enemy. Shoot the reflection to damage the real one? No — shoot where the real one WOULD be standing opposite the reflection.

Bolgia of Flatterers. A long room with seemingly friendly NPC silhouettes at the far end. They wave. They beckon. As you approach — mimic attack. The entire room is a trap. The "friendly" NPCs are all enemies. The real exit is behind you, through a wall you walked past.

Bolgia of Thieves. A treasure room where items vanish if you look away. Pickups that you see from across the room are gone when you reach them — and something else is in their place. The room reshuffles when you turn around (trigger-based entity swaps). Navigation is unreliable.

The Shifting Maze. Walls move. Not illusion walls — walls that physically shift position when you're not looking at them. The maze layout changes. You must find the path by testing walls, marking your route (props as breadcrumbs?), or simply pushing through enemies. shadowGoats and green hellgoats in the corridors.

The Counterfeit Arena. Looks like a previous arena (Columns from Circle 1 — deliberate callback). But the columns are mimics. When you approach for cover, they attack. The real cover is the floor elevation changes — ramps and platforms. Two waves of mixed enemies + mimics. Nothing is what it appears.

Inganno's Parlor. An elegant sitting room with chaise lounges and bookshelves (Bookcase_2, Chair_1, Table_Large). Inganno sits in a chair, beautiful (Dainir female base, minimal horror — intentionally appealing). Phase 1: she speaks pleasantly, doesn't attack. Walking too close triggers the fight. She summons mimic pickups throughout the room — they explode into enemies. Phase 2: she creates a mirror clone of the player. You fight yourself — same weapons, same speed. Phase 3: Inganno reveals her true form — Geryon-like, serpentine lower body. The room's elegant facade crumbles (Marble → Rust texture swap visual). The truth beneath the beauty.

**Title card:** *CIRCLE THE NINTH — TREACHERY*

**→ 2 procedural floors (Treachery theme foreshadowing)**

---

### Circle 9 — TREACHERY (Betrayal)

> *"S'io avessi le rime aspre e chiocce, come si converrebbe al tristo buco..."*
> (If I had verses harsh and rough enough to fit the dismal hole...)

**Sin:** Betrayal
**Boss:** Azazel — the fallen angel, the original scapegoat's destination
**Mechanic:** Reflected shots (missed projectiles bounce off walls back toward the player)
**Weapon:** All weapons (but reflected shots make ranged combat dangerous)
**Trash Mobs:** goatKnight (Blue, elite) + shadowGoat (Gray) + fireGoat (Dark variant)
**Rooms:** 8 — Glacial Stairs → Caina → Antenora → Ptolomea → Giudecca (arena) → Judas Trap (secret) → Cocytus Bridge → Azazel's Frozen Throne

**The Experience:**
Ice. Everything is ice. The walls are Ice textures, the floor is Snow, the ceiling drips frozen stalactites. The temperature has dropped from the fires of Violence through the deception of Fraud to absolute zero. Cocytus — the frozen lake at Hell's bottom.

The reflected shots mechanic is the final punishment. Every missed projectile bounces off walls and comes back. The flamethrower's short range becomes a blessing — it can't reflect because it doesn't reach walls. The player must choose: accuracy at range (pistol, cannon) with the risk of self-damage, or close-range flamethrower where reflected shots aren't a factor. The lesson: **your own violence turns against you.**

Blue goatKnights appear for the first time — the elite variant. High HP (20), armored, slow but devastating. They're the final evolution of the trash mob, reserved for this circle alone. Paired with shadowGoats (who can sneak behind you while you focus on the knights) and dark fireGoats (ranged + cold-themed).

The Glacial Stairs descend steeply. Ice floor means reduced friction — you slide. The stairs have landings with enemies on each. Platforming challenge: the stairs are narrow, missing a landing means sliding down to the next (taking fall damage) or off the edge entirely.

Caina (betrayers of family). A frozen lake room. The floor is slippery ice. Blue goatKnights stand frozen in the ice at regular intervals — they break free as you approach. The room is open with ice pillars (tall, structural). Your shots bounce off the pillars. Fighting here means managing reflected projectile trajectories — position so bounced shots hit OTHER enemies, not you.

Antenora (betrayers of country). A fortress interior — ice-covered stone walls, Metal textures with frost overlay. Narrow corridors. The reflected shots make corridor combat lethal — bullets bounce back and forth down the length. The flamethrower is essential here. shadowGoats ambush from frozen alcoves.

Ptolomea (betrayers of guests). A banquet hall encased in ice. A frozen feast table (Table_Large, chairs, plates — all frost-covered). Enemies frozen at the table thaw and attack when you enter. The ceiling is low — no room for arcing shots. Everything reflects. Pure close-quarters combat.

Giudecca (betrayers of lords — Judas, Brutus, Cassius). The arena. A vast frozen chamber with a frozen waterfall on the back wall. Three waves: Blue goatKnights, then mixed shadowGoat+fireGoat, then ALL types simultaneously. The waterfall cracks during the fight — chunks of ice fall as hazards. The floor cracks too — some sections break, revealing the void below Cocytus. Platforming + combat on fragmenting ice.

Cocytus Bridge. A narrow ice bridge spanning a void. Below: nothing. The final approach to Azazel. No enemies. Just the bridge, the void, and the wind. The longest walk in the game without combat. The player has time to think about everything they've done.

**Azazel's Frozen Throne.**

---

## The Final Boss: Azazel

The room is circular. An immense frozen lake — the bottom of Hell. Azazel stands in the center, frozen from the waist down. He is not a goat-monster. He is the Dainir male base at its most dignified — tall, antlered, calm. No rage. No deception. Just presence.

He speaks: *"You came."*

### Phase 1: Sins Reflected

Azazel does not attack with weapons. He reflects the player's attacks. Every projectile you fire returns amplified. The flamethrower's fire turns blue-white and arcs back. The only way to damage him: environmental — break the ice around him. Shoot the ice, not the boss. As the ice breaks, he sinks deeper. The floor fragments. Platforming on ice chunks.

### Phase 2: Azazel Breaks Free

The ice shatters. Azazel rises to full height. He moves. His attacks are melee — sweeping antler strikes, ground stamps that crack the remaining ice. The arena is now a field of floating ice platforms over the void. You fight on the platforms, jumping between them, burning him with the flamethrower (the only weapon that doesn't reflect — it's fire, and fire is what the scapegoat was given).

### Phase 3: The Revelation

At 10% HP, Azazel stops fighting. He drops his arms. He speaks the truth:

*"You were sent to me. The scapegoat, bearing the sins of others, cast into the wilderness toward Azazel. That is the ritual. You have completed it perfectly. Every goat you killed, every circle you descended — you carried their sin deeper and deeper, and delivered it to me. I am the garbage dump of sin. You are the delivery mechanism. The irony: by fighting through Hell, you fulfilled the scripture."*

He does not die. He sits. The fight is over.

---

## The Ending

### The Binary Choice

The game tracks one hidden metric: **how many optional enemies the player skipped.** Every circle has optional encounters (Bone Pit ambush, side rooms with enemies, enemies you can run past). The total possible vs. actual kills determines the ending.

**Skipped > 30% of optional kills → Ascent Ending:**

The camera pulls up. Through each circle in reverse. The frozen lake, the deception, the violence, the wrath, the greed, the gluttony, the lust, the fog. Up through the earth, through the roots, through the rock. The circle of light grows larger. The surface. The wilderness.

Title card: *"The scapegoat returns to the wilderness."*

**Skipped < 30% → Remain Ending:**

The camera holds on the goat. It sits beside Azazel. Two figures at the bottom of the world. The goat has embraced the violence it was supposed to only carry. It belongs here now.

Title card: *"Sin finds its level. You have carried it to the bottom, where it cannot fall further. Rest."*

### Kill Metric Hints

The kill metric is hidden, but not unannounced. Subtle hints seed the player's awareness throughout the journey:

- **Every 10th optional enemy killed:** A lower-third text flash appears: *"Another sin carried deeper"* — fades after 2 seconds
- **On entering each new circle, if >70% of optional enemies killed so far:** *"The weight grows"* — lower-third, 2-second fade
- **On killing the first truly optional enemy in each circle** (Bone Pit ambush in Circle 1, side-room enemies in later circles): *"Blood remembered"* — lower-third, 2-second fade
- **Presentation:** These hints are subtle — lower-third text, small font, fade after 2 seconds, not intrusive. They should feel like the game whispering, not shouting.
- **Circle 7 exception:** Enemies killed under Circle 7's bleeding mechanic (constant HP drain forcing kills for survival) count as "mandatory" kills, not "optional." The Remain ending threshold accounts for this — the player is not penalized for violence that the circle demands.

---

## Pacing Summary

| Segment | Rooms | Enemies | New Weapon | Mechanic | Duration |
|---------|-------|---------|------------|----------|----------|
| Circle 1: Limbo | 6 | 12+boss | Hell Pistol (start) | Fog | ~8 min |
| Procedural ×2 | — | ~10 each | — | Lust preview | ~5 min |
| Circle 2: Lust | 7 | 15+boss | Brim Shotgun | Siren pulls | ~10 min |
| Procedural ×2 | — | ~10 each | — | Gluttony preview | ~5 min |
| Circle 3: Gluttony | 7 | 15+boss | Hellfire Cannon | Poison pickups | ~10 min |
| Procedural ×2 | — | ~12 each | — | Greed preview | ~5 min |
| Circle 4: Greed | 6 | 14+boss | — | Hoarding penalty | ~10 min |
| Procedural ×2 | — | ~12 each | — | Wrath preview | ~5 min |
| Circle 5: Wrath | 8 | 20+boss | Goat's Bane | Escalation | ~12 min |
| Procedural ×2 | — | ~14 each | — | Heresy preview | ~5 min |
| Circle 6: Heresy | 8 | 16+boss | — | Illusion walls | ~12 min |
| Procedural ×2 | — | ~14 each | — | Violence preview | ~5 min |
| Circle 7: Violence | 10 | 22+boss | **Flamethrower** | Bleeding | ~15 min |
| Procedural ×2 | — | ~16 each | — | Fraud preview | ~5 min |
| Circle 8: Fraud | 9 | 18+boss | — | Mimic enemies | ~12 min |
| Procedural ×2 | — | ~16 each | — | Treachery preview | ~5 min |
| Circle 9: Treachery | 8 | 20+boss | — | Reflected shots | ~15 min |
| **TOTAL** | **69 circle rooms + ~32 proc** | **~300** | **5 weapons** | **9 unique** | **~2.5 hours** |

> **Flamethrower fuel economy:** The Brimstone Flamethrower (found Circle 7) uses 5 fuel/second with 100 max capacity. Passive regeneration (1 fuel/s when not firing) prevents total depletion. Fuel pickups (25 fuel each) appear 2-3 per room in Circles 7-9. Players should average 60-80% fuel entering each room.

---

## Weapon Unlock Schedule

| Weapon | Where Found | Notes |
|--------|-------------|-------|
| Hell Pistol | Start | Reliable, long range, low DPS |
| Brim Shotgun | Procedural floors before Circle 2 | Close range, high burst |
| Hellfire Cannon | Procedural floors before Circle 3 | Sustained DPS, medium range |
| Goat's Bane | Circle 5 Arsenal room | Rockets, area damage, slow fire rate |
| Brimstone Flamethrower | Circle 7 Shrine room | Continuous stream, short range, DOT, the destiny weapon. **Fuel:** 100 max capacity, burns 5 fuel/sec (20s continuous). Fuel pickups restore 25 fuel. Passive regen: 1 fuel/sec when not firing. Fuel pickups appear in Circles 7, 8, 9 and procedural floors between them. |

### Melee Attack

All circles: the player can ram enemies by sprinting into them.

- **Ram damage:** 15 HP (enough to one-shot hellgoats and shadowGoats)
- **Cooldown:** 1 second between rams
- **Introduction:** Circle 4's Weight Room — when all ammo is dropped, ramming is the only remaining option
- **Design intent:** This is NOT a primary combat tool. It is a last resort and a puzzle mechanic. The player should never need to ram outside of Circle 4's Weight Room unless they are completely out of ammo.

### Ammo Management

Players can drop ammo via a dedicated button (mapped to a key).

- **Dropped ammo** appears as a pickup entity at the player's feet
- **Persistence:** Dropped ammo persists until the room is left
- **First use:** Circle 4's Weight Room puzzle (pressure plates sink under ammo weight — drop ammo to cross)
- **Teaching moment:** A tooltip appears when entering the Weight Room: *"You can drop ammo with [key]"*
- This mechanic enables the Weight Room puzzle and provides a fallback for players who over-collect

---

## Enemy Progression

| Circle | Primary Mob | Secondary Mob | New Introduction |
|--------|------------|---------------|-----------------|
| 1 Limbo | hellgoat (Brown) | — | Base enemy |
| 2 Lust | hellgoat (Brown) | fireGoat (Crimson) | First ranged enemy |
| 3 Gluttony | hellgoat (Green) | fireGoat (Crimson) | Reskinned hellgoat |
| 4 Greed | goatKnight (Dark) | hellgoat (Brown) | First armored enemy |
| 5 Wrath | fireGoat (Crimson) | goatKnight (Dark) | Mixed compositions |
| 6 Heresy | shadowGoat (Gray) | fireGoat (Crimson) | First invisible enemy |
| 7 Violence | goatKnight (Dark) | fireGoat (Crimson) + hellgoat | All types available |
| 8 Fraud | shadowGoat (Gray) | hellgoat (Green) | Mimic pickups |
| 9 Treachery | goatKnight (Blue) | shadowGoat + fireGoat (Dark) | Elite variant |
