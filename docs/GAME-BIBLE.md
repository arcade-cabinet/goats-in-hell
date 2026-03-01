---
title: "Game Bible"
status: implemented
created: "2026-02-26"
updated: "2026-03-01"
domain: game-design
related:
  - docs/circles/00-player-journey.md
  - docs/plans/2026-03-01-open-questions-design.md
  - docs/boss-pipeline.md
  - docs/DAZ-PIPELINE.md
---

# GOATS IN HELL — Game Bible

> Canonical reference for all confirmed design decisions.
> Updated as brainstorming progresses. Unresolved questions at the bottom.

---

## Premise

You are the Scapegoat.

In Leviticus 16, two goats are brought before the altar on Yom Kippur. One is
sacrificed to God. The other — the scapegoat — is laden with the sins of the
community and cast into the wilderness toward Azazel. That goat is you.

You fell. Through the wilderness, through the earth, into Hell itself. Now you
descend through the Nine Circles, bearing sins that aren't yours, burning
everything in your path with fire that was never meant for purification — but
has become it anyway.

At the bottom waits Azazel. The fallen angel. The one you were sent to.

## Tone

**Allegorically serious, mechanically absurd.**

The Dante framework is played straight. The circles are faithful to the
Inferno's structure — contrapasso (the punishment fits the sin), the
theological weight of damnation, the descent toward absolute evil. The writing
takes this seriously.

But the protagonist is a goat with a flamethrower.

Comedy comes from the juxtaposition, never from jokes. The game never winks.
The goat doesn't know it's funny. The bosses monologue with genuine menace
about sins and punishment — to a goat. The player feels the absurdity without
anyone pointing at it.

Not DOOM with goats (too serious). Not Goat Simulator in hell (too stupid).
The middle path: a game that makes you feel something uncomfortable about
scapegoating while you shoot demonic goats with a brimstone shotgun.

## Theological Framework

Three traditions converge:

1. **Matthew 25:31-46** — The Parable of the Sheep and the Goats. At the Last
   Judgment, sheep go to paradise, goats to eternal fire. In Western theology,
   goats = the damned. Hell is ruled by goats because they were always destined
   for it.

2. **Leviticus 16** — The scapegoat ritual. One goat dies on the altar
   (sacrifice). The other carries all sin into the wilderness toward Azazel
   (exile). The player is the exiled goat, bearing everyone else's sins.

3. **Book of Enoch / Azazel** — Azazel is a fallen angel who taught humanity
   forbidden knowledge (metallurgy, cosmetics, warfare). God punished him by
   burial in the desert under jagged rocks. He waits at the bottom of Hell —
   the original scapegoat's destination.

Additional resonances:
- **Baphomet** — The goat-headed idol the Knights Templar were accused of
  worshipping. Sabbatic goat iconography.
- **Pan** — The Greek goat-god whose "death" was announced in the age of
  Christ. Pagan wildness vs. Christian order.

## The Nine Circles & Their Bosses

Each circle is ruled by a goat boss — a variant of the Dainir (Genesis 9)
base model. Male and female forms, anatomical elements, and DAZ morphs are
used to create visually and thematically distinct bosses. Gender assignments
follow historical art and Dante iconography, not arbitrary distribution.

| # | Circle    | Sin       | Boss Name      | Base  | Anatomy        | Art Reference                     |
|---|-----------|-----------|----------------|-------|----------------|-----------------------------------|
| 1 | Limbo     | Ignorance | **Il Vecchio** | Male  | None           | Ancient patriarch / gatekeeper    |
| 2 | Lust      | Desire    | **Caprone**    | Female| Both (herm.)   | Baphomet: inherently dual-gendered|
| 3 | Gluttony  | Excess    | **Vorago**     | Female| Female         | Grotesque mother / earth-devourer |
| 4 | Greed     | Avarice   | **Aureo**      | Female| None           | Vain adorned she-goat / Salome    |
| 5 | Wrath     | Rage      | **Furia**      | Male  | Exag. male     | Hyper-masculine / maximum rage    |
| 6 | Heresy    | Defiance  | **Profano**    | Female| Female         | Witch / heretical priestess       |
| 7 | Violence  | Bloodshed | **Il Macello** | Male  | Clublike male  | Brute Minotaur / the Butcher      |
| 8 | Fraud     | Deception | **Inganno**    | Female| Female         | Beautiful deceiver / Geryon face  |
| 9 | Treachery | Betrayal  | **Azazel**     | Male  | None           | The Scapegoat / fallen angel      |

**Gender split:** 5 female-base (incl. hermaphroditic Caprone), 4 male-base.
Each feminine boss has strong art-historical precedent — Fraud is classically
depicted as a beautiful woman with a serpent's tail, Heresy draws from witch
iconography and the Sabbat, Gluttony as grotesque mother inverts the nurturing
archetype.

### Boss Naming Convention

Italian/Latin nomenclature rooted in Dante's language. Each name is a word,
not a random fantasy name — it means what the boss is.

---

## Asset Pipeline

### Trash Mobs — Goatman (ms03_05_Goatman)

6 texture variants of a humanoid goat with axe. Upright, muscular, bestial.
Red/amber eye glow. 11 animations per variant.

| Variant | File              | Visual                    | Suggested Circle Assignment |
|---------|-------------------|---------------------------|-----------------------------|
| Brown   | goatman-brown.glb | Earthy brown, red eye     | Circle 1 (Limbo)           |
| Blue    | goatman-blue.glb  | Steel blue/slate, amber   | Circle 9 (Treachery/ice)   |
| Crimson | goatman-crimson.glb| Red-brown, purple eye     | Circle 5 (Wrath)           |
| Green   | goatman-green.glb | Sickly olive, red eye     | Circle 3 (Gluttony)        |
| Gray    | goatman-gray.glb  | Pale ghostly, cyan eye    | Circle 8 (Fraud/illusion)  |
| Dark    | goatman-dark.glb  | Dark olive/shadow, amber  | Circle 7 (Violence)        |

**Animations (all 11):** idle, walk, run, attack_01, attack_02, attack_03,
damage_01, damage_02, die, getup, stunned

### Bosses — Dainir for Genesis 9 (RawArt)

Fantasy deerfolk/goatfolk character (Genesis 9 rig). Male and female forms with
antlers, digitigrade goat legs, hooves, fur, and goatee. Full DAZ morph system
for body customization. 231+ bones, ~25K verts base, 105+ shape keys.

**Base templates saved:**
- `assets/models/bosses/dainir-male-base.blend` — Male form + male anatomy
- `assets/models/bosses/dainir-female-base.blend` — Female form + both anatomies

**Anatomy pipeline:** DAZ Genesis 9 Anatomical Elements (Male/Female) imported
via Diffeomorphic DAZ Importer addon in Blender 5.0.1. Geografts merge into
base mesh. Dainir-specific genital textures (`G9Dainir_Gen-m_*`, `G9Dainir_Gen-f_*`)
applied for skin-matching. UV fix required: copy from secondary UV layers to
main UDIM layer with -1.0 U offset for male anatomy.

**Parts:** Antlers (1,776 verts), Hooves (1,430 verts), Leg Fur (24,775 verts,
hair strands — stripped for game export), Hoof Fur (4,164 verts, stripped),
Goatee (hair strands — stripped).

**Game export pipeline:**
1. Load base template (.blend) for the boss's gender
2. Apply DAZ morphs for body shape (musculature, proportions)
3. Add/remove anatomy as needed per boss
4. Add armor/props/effects per circle theme
5. Strip hair strand meshes (fur, goatee) — bake into body texture
6. Decimate to ~8,000-10,000 verts
7. Bake texture atlas (single material)
8. Export GLB with Draco compression

**Boss animations:** To be created. Options: Mixamo retarget to G9 skeleton,
procedural animation in Three.js, or hand-keyed in Blender.

### Weapons (Stylized Guns 3D Models PRO)

| Weapon        | Model             | In-game name    |
|---------------|-------------------|-----------------|
| MAC-10        | weapon-pistol.glb | Hell Pistol     |
| Shotgun       | weapon-shotgun.glb| Brim Shotgun    |
| AK-47         | weapon-cannon.glb | Hellfire Cannon |
| Bazooka       | weapon-launcher.glb| Goat's Bane    |
| Flamethrower  | (available, not wired) | TBD        |

---

## Technical Architecture (Implemented)

- **SQLite/Drizzle ORM** level database (PR #20, merged)
- **LevelEditor API** for hand-crafting each circle individually
- **DAG room graph** — rooms as nodes, connections as edges
- **GridCompiler** — rooms + connections → MapCell[][] BLOB
- **PlaytestRunner** — headless YUKA AI simulation validates completability
- **Themes created per-circle** via LevelEditor, NOT from a seed file

Each circle is a **bespoke level** — its own room count, layout, pacing, and visual
identity. There is NO template or formula. Circle 1 might be 6 rooms focused on
fog and disorientation; Circle 7 might be 3 sub-zones (blood river, thorny forest,
burning sands). Each room serves the circle's specific sin and mechanics.

Each circle will be:
1. Designed in markdown (narrative, boss, encounters, room layout)
2. Built individually using LevelEditor API with unique PBR materials per circle
3. Playtested via PlaytestRunner
4. Iterated until it plays well

### Asset Library

Each circle draws from a rich asset library for visual uniqueness:

- **PBR Materials** (`/Volumes/home/assets/AmbientCG/Assets/MATERIAL/`) — 500+ textures:
  Rock, Lava, Ice, Marble, Metal, Rust, Concrete, PavingStones, Moss, Snow, Granite
- **Decals** (`/Volumes/home/assets/AmbientCG/Assets/DECAL/`) — leaking stains, damage marks
- **HDRI** (`/Volumes/home/assets/AmbientCG/Assets/HDRI/`) — environment lighting
- **Fantasy Props** (`/Volumes/home/assets/Fantasy Props MegaKit/`) — 95+ FBX props:
  Torch, Chain, Cage, Barrel, Cauldron, Candle, Scroll, Potion, Shield, Sword, Chest, Banner
- **PSX Pack** (`/Volumes/home/assets/PSX Mega Pack II/`) — retro-style props
- **NO Kenney or KayKit** — too cute for the tone

---

## Confirmed Design Decisions

> Full analysis with implementation details: `docs/plans/2026-03-01-open-questions-design.md`

### Protagonist & Narrative

- **Silent protagonist.** The goat never speaks or thinks in text. Players project
  onto the goat. Self-awareness would kill the juxtaposition.

- **Lore delivery via environment + bosses.** Circle title cards (Dante canto quotes),
  boss monologues (2-3 sentences during `bossIntro` trigger), environmental inscriptions
  (`entityType: 'prop_inscription'` with text in `overrides.text`). No Virgil NPC,
  no collectible lore, no audio logs.

- **Strictly linear descent.** No hub, no level select, no backtracking. You descend
  through 9 circles with 2 procedural floors between each. ~25 levels total, ~2 hours.

### Ending

- **Three-beat structure:** Boss fight (Azazel uses your sins against you), Revelation
  (non-interactive — Azazel explains you completed the scapegoat ritual), Binary ending
  based on optional enemies skipped (ascent = peace, remain = violence embraced).

### Combat & Progression

- **Weapon unlock schedule:**
  - Circles 1-2: Hell Pistol only → Brim Shotgun found mid-Circle 2
  - Circle 3: Hellfire Cannon found
  - Circle 5: Goat's Bane found in arena
  - Circle 7: **Brimstone Flamethrower** — continuous stream, DOT (2 dmg/s × 5s),
    short range, wide cone. The scapegoat's destiny weapon.

- **Per-circle gameplay modifiers** (one mechanic per circle, not just visual):
  1. Limbo: **Fog of war** (visibility 8 cells)
  2. Lust: **Siren pulls** (wind zones toward hazards)
  3. Gluttony: **Poisoned pickups** (50/50 health/poison)
  4. Greed: **Hoarding penalty** (excess ammo slows movement)
  5. Wrath: **Escalation** (enemies speed up over combat duration)
  6. Heresy: **Illusion walls** (fake walls, trap paths)
  7. Violence: **Bleeding** (constant HP drain, kills restore HP)
  8. Fraud: **Mimic enemies** (pickups that attack on proximity)
  9. Treachery: **Reflected shots** (missed projectiles bounce back)

- **Enemy → goatman variant mapping:**
  - Brown: hellgoat (Limbo, Lust, general)
  - Crimson: fireGoat (Wrath, Violence)
  - Gray: shadowGoat (Fraud, Heresy)
  - Dark: goatKnight (Violence, Treachery)
  - Green: hellgoat variant (Gluttony, Fraud)
  - Blue: goatKnight variant (Treachery — elite, reserved for Circle 9)

### Procedural Floors

- **2 procedural floors between each circle** (16 total). They use the NEXT circle's
  theme as foreshadowing. Higher pickup density for resource recovery. New weapons
  found here, not in circle levels.

### Boss Animations

- **Tier 1 (immediate):** Mixamo retarget to G9 skeleton — idle, walk, attack, hit, death
- **Tier 2 (medium-term):** Procedural overlays in Three.js — breathing, head tracking, antler sway
- **Tier 3 (per-boss, later):** Hand-keyed signature attacks (staff sweep, charge, ground pound)
