---
title: "Open Questions Design Document"
status: in-progress
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
plan_type: design
related:
  - docs/GAME-BIBLE.md
  - docs/circles/00-player-journey.md
---

# Goats in Hell — Open Questions Design Document

> Recommendations for all 10 open design questions from GAME-BIBLE.md.
> Each section states the question, recommends an approach, and explains why.

---

## 1. Silent Protagonist or Inner Monologue?

**Recommendation: Silent protagonist.**

The goat doesn't speak, doesn't think in text, doesn't narrate. The player projects
onto the goat. This is critical for the tone described in the Game Bible: "The goat
doesn't know it's funny." If the goat speaks, it becomes self-aware. Self-awareness
kills the juxtaposition.

**How lore is communicated instead:**
- Boss monologues (text overlays during boss intros — they speak TO the goat)
- Environmental inscriptions (wall text in Dante's Italian, translated in a subtitle bar)
- Circle title cards on descent ("CIRCLE THE THIRD — GLUTTONY" with the relevant
  Inferno canto quote)

**Implementation cost:** Near zero. The protagonist is already silent. This is a
decision to NOT build something.

---

## 2. Ending Structure (What Happens at Azazel?)

**Recommendation: Three-beat ending.**

1. **Boss fight** — Azazel is the final boss, Circle 9. Standard boss encounter with
   unique mechanics (he doesn't attack with weapons — he uses the sins you've been
   carrying, turning your own fire against you).

2. **The Revelation** — After defeating Azazel, a non-interactive cutscene. Azazel
   speaks: he was waiting for you, the scapegoat. You were sent to carry sin to him,
   and you did. He is the garbage dump of sin. You are the delivery mechanism. The
   irony: by fighting through Hell, you completed the ritual perfectly.

3. **Ascent or Descent** — Two endings based on a single tracked metric: **how many
   enemies you DIDN'T kill.** If you skipped optional encounters and ran past enemies
   when possible, you refused to participate in violence (contrapasso inverted — the
   scapegoat chose peace). You ascend. If you killed everything, you embraced the sin
   you were carrying. You stay.

   - **Ascent ending:** Camera pulls up through the circles in reverse. Title card:
     "The scapegoat returns to the wilderness."
   - **Remain ending:** Camera holds on the goat sitting beside Azazel. Title card:
     "Sin finds its level."

**Implementation cost:** Moderate. Requires:
- Kill counter is already tracked (`enemiesKilled` in PlaytestRunner, CombatSystem)
- Boss-specific attack pattern for Azazel
- Two ending cutscene sequences (can be simple camera movements + text)
- Metric: optional enemies skipped (count entities NOT killed vs total spawned)

---

## 3. Lore Delivery Mechanism

**Recommendation: Environmental + Boss Monologues (no NPC guide).**

A Virgil NPC guide would be powerful narratively but expensive to implement (companion
AI, pathfinding, dialogue trees, voice/text system). Instead, use what the engine
already supports:

- **Circle title cards** — Full-screen text on entering each circle. Dante canto
  quote + circle name + sin. Already fits the `dialogue` trigger action in the DB
  schema.

- **Boss monologues** — Text overlay during `bossIntro` trigger phase. Boss speaks
  2-3 sentences about the sin they embody. Player can skip by shooting. The bosses
  ARE the lore delivery — each one explains their circle.

- **Environmental inscriptions** — Props placed via entity system. Stone tablets,
  wall carvings, floor inscriptions. `entityType: 'prop_inscription'` with text in
  `overrides.text`. Player walks near, text appears. Already supportable via the
  trigger system (`action: 'dialogue'`).

**What NOT to build:**
- No collectible lore items (too gamey, breaks tone)
- No audio logs (no voice acting budget)
- No Virgil NPC (too expensive for the payoff)

---

## 4. Linear Descent or Hub Structure?

**Recommendation: Strictly linear descent with optional backtracking denied.**

Dante's Inferno is a descent. You go down. You don't go back up. Each circle is
lower than the last. This is both narratively correct and mechanically simpler.

**Structure:**
```
Circle 1 (Limbo)
  → [2-3 procedural floors]
Circle 2 (Lust)
  → [2-3 procedural floors]
Circle 3 (Gluttony)
  ...
Circle 9 (Treachery) → Azazel → Ending
```

Each circle is a hand-crafted level (via LevelEditor). Between circles, 2-3
procedural floors provide pacing variety and resource acquisition. The procedural
floors use the NEXT circle's theme (foreshadowing).

**No hub.** No level select. No going back. When you descend, you descend. This
mirrors the theological reality — there is no escape from Hell. It also simplifies
save/checkpoint design: you save at circle boundaries.

**Each circle is a bespoke hand-crafted level** with its own room count, layout,
and pacing tailored to its sin and mechanics. There is NO template — Circle 1
might have 6 rooms with fog disorientation, Circle 7 might have 3 sub-zones.
The old `explore → arena → boss` cycle applies ONLY to procedural filler floors
between circles, NOT to the circles themselves.

---

## 5. Weapon Progression

**Recommendation: One new weapon per descent stage, not per circle.**

The current weapon system has 4 weapons with clear roles:

| Weapon | Role | DPS | Range | Unlock |
|--------|------|-----|-------|--------|
| Hell Pistol | Starter, reliable | ~13 | Long | Start |
| Brim Shotgun | Close quarters | ~23 | Short | Circle 1-2 |
| Hellfire Cannon | Sustained DPS | ~20 | Medium | Circle 3-4 |
| Goat's Bane | Crowd clear/boss | ~40 | Any | Circle 5-6 |

The existing `minFloor` system in `LevelGenerator.ts` (line 646-648) already gates
weapons by floor. Map this to circles:

- **Circles 1-2:** Hell Pistol only. Learning the game. Shotgun found mid-Circle 2.
- **Circles 3-4:** Shotgun + Hellfire Cannon found mid-Circle 3.
- **Circles 5-6:** All conventional weapons. Goat's Bane found in Circle 5 arena.
- **Circles 7-9:** The Flamethrower (see question 7).

**No upgrades system.** Weapons don't level up. The goat doesn't craft. You find
weapons as pickups and they work immediately. Simplicity serves the tone — this is
an animal with guns, not an RPG protagonist optimizing builds.

**Ammo economy:** Ammo is scarce enough that weapon switching matters. The AI
Governor already handles weapon selection by range (AIGovernor.ts:706-715).

---

## 6. Per-Circle Gameplay Identity

**Recommendation: Each circle introduces one dominant mechanic modifier.**

The sin of each circle should change HOW you play, not just what you see. One
new mechanic per circle, layered on top of the core shoot-and-move gameplay:

| Circle | Sin | Gameplay Modifier | Implementation |
|--------|-----|-------------------|----------------|
| 1 Limbo | Ignorance | **Fog of war** — visibility radius 8 cells, enemies lurk beyond | `fogDensity: 0.08` + reduced enemy `alert` range |
| 2 Lust | Desire | **Siren pulls** — environmental zones pull player toward hazards | `env_type: 'wind'` with `direction_x/z` toward lava |
| 3 Gluttony | Excess | **Resource corruption** — health pickups can poison (50/50) | Override in PickupSystem: random poisoned pickups |
| 4 Greed | Avarice | **Hoarding penalty** — carrying too much ammo slows movement | Speed modifier based on total ammo count |
| 5 Wrath | Rage | **Escalation** — enemies get faster the longer combat lasts | Timer-based speed multiplier on enemies |
| 6 Heresy | Defiance | **Illusion walls** — some walls are fake, some paths are traps | `WALL_SECRET` and `FLOOR_TRAP` cells |
| 7 Violence | Bloodshed | **Bleeding** — player loses HP over time, kills restore HP | Constant drain + kill healing (vampiric) |
| 8 Fraud | Deception | **Mimic enemies** — some pickups are enemies in disguise | Entity type that looks like pickup until proximity |
| 9 Treachery | Betrayal | **Friendly fire reflected** — missed shots bounce back | Projectile reflection on wall hits |

Each modifier uses existing systems (environment zones, entity overrides, fog
settings) rather than requiring new engine features.

---

## 7. The Flamethrower

**Recommendation: The Flamethrower is the Circle 7+ signature weapon — the goat's
canonical weapon from the Game Bible premise.**

"But the protagonist is a goat with a flamethrower." The flamethrower is THE weapon.
It should feel earned, not given.

**Unlock:** Found in Circle 7 (Violence), the circle of bloodshed. Thematically,
this is where the scapegoat accepts the fire it was born to carry. The goat was
sent "toward Azazel" with fire — now it has a flamethrower.

**Mechanics:**
- Continuous stream, not projectile-based (unique among all weapons)
- Short range (3-4 cells), wide cone (45°)
- High DPS but burns through fuel fast
- Enemies hit are set on fire (DOT: 2 damage/second for 5 seconds)
- Visual: particle stream from weapon model, screen tint shift to orange

**Implementation:** Requires a new weapon type in `weapons.ts` with:
```typescript
flamethrower: {
  name: 'Brimstone Flamethrower',
  damage: 2,        // per tick
  fireRate: 50,     // continuous stream
  ammo: 200,        // fuel units (burns fast)
  projectileSpeed: 0, // not projectile-based
  // Custom: cone damage, DOT application
}
```

The flamethrower asset GLB is already available (mentioned in GAME-BIBLE.md weapon
table). WeaponId type needs extension.

**Why Circle 7 and not earlier:** Circles 1-6 use conventional weapons. The
flamethrower transforms the gameplay for the final descent (7-8-9). It IS the
scapegoat's destiny weapon. Getting it too early removes the payoff.

---

## 8. Enemy Type → Goatman Variant Mapping

**Recommendation: Map enemy types to goatman color variants by visual logic.**

6 goatman GLB variants × 8 enemy types. Each circle uses 2-3 enemy types from its
theme. The goatman visual variant matches the circle's aesthetic.

| EntityType | Stats | Goatman Variant | Primary Circle(s) |
|------------|-------|-----------------|-------------------|
| `hellgoat` | 8HP, melee, fast | **Brown** | 1 (Limbo), 2 (Lust) |
| `fireGoat` | 6HP, ranged, slow | **Crimson** | 5 (Wrath), 7 (Violence) |
| `shadowGoat` | 4HP, invis, glass cannon | **Gray** | 8 (Fraud), 6 (Heresy) |
| `goatKnight` | 15HP, armored, slow | **Dark** | 7 (Violence), 9 (Treachery) |
| `archGoat` (boss-tier) | 100HP, ranged | **Brown** (boss-sized) | Boss encounters |
| `infernoGoat` (boss-tier) | 80HP, rapid fire | **Crimson** (boss-sized) | Boss encounters |
| `voidGoat` (boss-tier) | 60HP, invis | **Gray** (boss-sized) | Boss encounters |
| `ironGoat` (boss-tier) | 150HP, heavy armor | **Dark** (boss-sized) | Boss encounters |

**Per-circle enemy composition** (using `theme.enemyTypes` from DB schema):

| Circle | Enemy Types | Goatman Variants |
|--------|-------------|-----------------|
| 1 Limbo | hellgoat | Brown |
| 2 Lust | hellgoat, fireGoat | Brown, Crimson |
| 3 Gluttony | hellgoat, fireGoat | Green, Crimson |
| 4 Greed | goatKnight, hellgoat | Dark, Brown |
| 5 Wrath | fireGoat, hellgoat, goatKnight | Crimson, Brown, Dark |
| 6 Heresy | shadowGoat, fireGoat | Gray, Crimson |
| 7 Violence | goatKnight, fireGoat, hellgoat | Dark, Crimson, Brown |
| 8 Fraud | shadowGoat, hellgoat | Gray, Green |
| 9 Treachery | goatKnight, shadowGoat, fireGoat | Blue, Gray, Dark |

**Blue goatman** reserved for Circle 9 (Treachery/ice) as the elite variant.
**Green goatman** used for Gluttony and Fraud (sickly/deceptive coloring).

The `AssetRegistry.ts` already maps goatman variants to GLB paths. The `enemyTypes`
field in the themes DB table controls which types spawn per circle.

---

## 9. Boss Animations

**Recommendation: Mixamo retarget for base animations, hand-keyed for signature
attacks.**

Three tiers of animation quality, matched to cost:

1. **Mixamo base set (immediate):** idle, walk, run, attack_melee, hit_reaction, death.
   Retarget from Mixamo's humanoid animations to the Genesis 9 skeleton. This works
   because G9 is a standard humanoid rig — Mixamo auto-rigging handles bipedal
   skeletons well. Digitigrade legs will need foot IK adjustment.

2. **Procedural in Three.js (medium-term):** Breathing idle (sine on chest bone),
   head tracking (look-at player), antler sway (spring physics on antler bones).
   These are cheap procedural overlays on top of Mixamo base anims.

3. **Hand-keyed signature attacks (per-boss, later):** Each boss needs 1-2 unique
   attack animations that match their sin:
   - Il Vecchio: slow staff sweep
   - Caprone: dual-arm embrace (lust pull mechanic)
   - Vorago: ground pound / vomit attack
   - Furia: charge/headbutt with antlers
   - Il Macello: overhead cleave

**Priority:** Get Mixamo base set working for ALL bosses first. That makes them
playable. Signature animations are polish, not MVP.

**Implementation path:**
1. Export G9 skeleton as FBX from Blender
2. Upload to Mixamo, download animation packs
3. Retarget in Blender using the Rokoko or Mixamo retarget addon
4. Export animation-only GLBs (shared across all bosses, different meshes)

---

## 10. Procedural Floors Between Circles

**Recommendation: Procedural floors are "the descent" — mechanical palette
cleansers that foreshadow the next circle.**

**Narrative role:** Between each circle, you descend. The procedural floors are
literally the space between sins. They use the NEXT circle's theme (fog, colors,
enemy types) as foreshadowing. You start seeing ice enemies before you reach
Treachery. You smell blood before Violence.

**Mechanical role:**
- **Resource recovery** — higher pickup density than circle levels
- **Weapon discovery** — new weapons are found in procedural floors, not circles
- **Difficulty ramp** — each procedural floor is slightly harder than the last,
  ramping toward the next circle's baseline
- **Pacing breath** — after a tense boss fight, 2-3 explore floors let the player
  decompress before the next circle's unique mechanic kicks in

**Implementation:** The procedural generator (`LevelGenerator.ts`) already produces
these floors. They use `levelType: 'procedural'` in the DB. The theme should be
set to the upcoming circle's theme via the progression system.

**Count:** 2 procedural floors between each circle = 16 procedural floors total +
9 circle levels = 25 levels. At ~5 minutes per floor, that's ~2 hours of gameplay.

---

## Summary of Recommendations

| Question | Decision | Cost |
|----------|----------|------|
| 1. Protagonist voice | Silent | Zero |
| 2. Ending | Three-beat: fight, revelation, binary ending | Moderate |
| 3. Lore delivery | Environmental + boss monologues | Low |
| 4. Structure | Strictly linear descent | Zero (already implemented) |
| 5. Weapon progression | One per descent stage, 4 existing + flamethrower | Low |
| 6. Per-circle identity | One gameplay modifier per circle | Medium (9 modifiers) |
| 7. Flamethrower | Circle 7 unlock, continuous stream weapon | Medium |
| 8. Enemy mapping | Color variants matched to circles by visual logic | Low |
| 9. Boss animations | Mixamo base + procedural overlay + hand-keyed signatures | Medium |
| 10. Procedural floors | Descent foreshadowing with next circle's theme | Low |
