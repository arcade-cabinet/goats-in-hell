---
title: "Circle 3: Gluttony"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 3
sin: excess
boss: Vorago
act: 1
build_script: scripts/build-circle-3.ts
mechanic: poisoned-pickups
related:
  - docs/circles/00-player-journey.md
  - docs/circles/02-lust.md
  - docs/agents/level-editor-api.md
---

# Circle 3: Gluttony — Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Playability

| Metric | Target | Notes |
|--------|--------|-------|
| Target play time | 8–12 min | Organic maze slows exploration. Acid pools force routing detours. |
| Estimated play time | TBD (computed after build) | |
| Path distance | TBD | |
| Room count | 7 rooms + 1 boss | from Room Placement table |
| Enemy count | 15 enemies + boss | from enemy placement |

### Pacing Notes
Gluttony's maze-like Gullet and the acid walkways of the Bile Cistern naturally extend traversal time as players pick careful routes around hazards. Tension peaks at the Gut Arena's concentric ring combat with the inner ring shrinking. The poisoned pickup mechanic applies constant low-level pressure throughout — players who rush and spam health pickups will hurt themselves, slowing the pace further.

---

## Identity

**Circle:** 3 (Gluttony)
**Sin:** Excess
**Boss:** Vorago — grotesque mother, earth-devourer (Dainir female base + female anatomy)
**Dominant Mechanic:** Poisoned pickups (50% chance health pickups deal damage instead of healing)
**Dante Quote:** *"Grandine grossa, acqua tinta e neve per le tenebre si riversa..."* (Huge hail, tainted water, and snow pour through the murky air...)

**Feel:** The marble of Lust rots. The walls are meat — stretched leather over curved organic surfaces. The floor is slick with moisture. Everything glistens under sickly yellow-green light. Health pickups are everywhere, more than any circle before — but half of them poison you. This circle teaches: **abundance is a trap. Not everything that heals you is good for you.**

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Stretched leather, organic folds | Leather004, Leather017 | Meat-wall aesthetic, glistening |
| Floor | Wet moss over uneven stone | Moss002, Moss004 | Slick, organic, uneven surface |
| Raised walkways | Rough weathered stone | Rock027, Rock041 | Stable contrast to organic walls |
| Acid pools | Corroded concrete, green-tinted | Concrete022 | Beneath acid surface, visible at edges |
| Ceiling | Raw dripping organic mass | Ground037 | Low, oppressive, wet |
| Feast Hall table | Dark stained wood grain | Ground068 | The one "normal" surface — the table |
| Boss chamber | Pink-red fleshy interior | Leather028 over Rock041 | Stomach lining — the most organic room |
| Secret room (Pantry) | Dry clean stone (contrast) | Concrete003 | Relief from the organic horror |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Gullet | 0.04 | `#1a2211` | Faint sickly green haze |
| Feast Hall | 0.03 | `#1a2211` | Slightly clearer — see the food |
| Larder / Bile Cistern | 0.05 | `#112211` | Thicker, moisture in the air |
| Gut Arena | 0.04 | `#1a2211` | Clear enough to see the rings |
| Boss phase 2 | 0.06 | `#223311` | Acid vapors from fragmented floor |
| Boss phase 3 | 0.08 | `#223311` | Vorago's breath fogs the room |

### Lighting

- Ambient: `#88aa44` at intensity 0.18 (sickly yellow-green, organic)
- Point lights from gluttony-lantern-wall-green props (bilious green `#aacc44`, radius 4 cells)
- Acid pools emit `#44ff22` at intensity 0.3, radius 3 cells (toxic glow)
- Feast Hall: warmer overhead light `#ccaa66` from lust-chandelier — the food looks appetizing
- Boss chamber: pulsing red-pink `#cc4466` from walls, as if the room itself breathes

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Leaking001-003 | Wall surfaces, everywhere | Moisture, bile, organic seepage |
| Scratches003 | Floor near acid pools | Acid erosion on stone |

---

## Room Layout

### Overview (7 rooms)

```
                    ┌──────────┐
                    │  GULLET   │  (6×14, winding corridor, sortOrder=0)
                    │  Spawn ★  │  Throat-like. Narrows/widens.
                    │  ↕ uneven │  Ceiling height varies.
                    └─────┬────┘
                          │ widens (width=4)
                    ┌─────┴────────────┐
                    │   FEAST HALL     │  (14×10, exploration+trap, sortOrder=1)
                    │  long table      │  Poisoned pickups introduced.
                    │  HALF THE FOOD   │  50% of health = damage.
                    │  IS POISON       │
              ┌─────┴───┬──────────────┘
              │         │ corridor (width=3)
         ┌────┴────┐    │
         │ PANTRY  │┌───┴──────────┐
         │  (6×6)  ││   LARDER     │  (10×12, vertical, sortOrder=2)
         │ secret  ││  shelving ↓  │  Descend platforms. Elev 0→-2.
         │ safe hp ││  enemies at  │
         └─────────┘│  all heights │
                    └───┬──────────┘
                        │ corridor (width=3)
                    ┌───┴──────────┐
                    │BILE CISTERN  │  (12×10, flooded, sortOrder=3)
                    │ acid floor   │  Raised walkways over acid.
                    │ walkways     │  Poisoned pickups as lures.
                    └───┬──────────┘
                        │ corridor (width=3)
                    ┌───┴──────────┐
                    │  GUT ARENA   │  (12×12, arena, sortOrder=4)
                    │  3 rings     │  Concentric, acid between.
                    │  lock+wave   │  Inner ring shrinks.
                    └───┬──────────┘
                        │ passage (width=3)
                    ┌───┴──────────┐
                    │ VORAGO'S MAW │  (14×14, boss, sortOrder=5)
                    │  stomach     │  Acid floor. Central platform.
                    │  3 phases    │  Platform fragments in phase 2.
                    └──────────────┘
```

### Grid Dimensions

**40 wide × 96 deep** (80 × 192 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Gullet | 17 | 2 | 6 | 14 | gauntlet | 0 (varies ±0.5) | 0 |
| Feast Hall | 13 | 20 | 14 | 10 | exploration | 0 | 1 |
| Pantry | 3 | 32 | 6 | 6 | secret | 0 | 2 |
| Larder | 15 | 34 | 10 | 12 | platforming | 0 (bottom=-2) | 3 |
| Bile Cistern | 14 | 50 | 12 | 10 | exploration | 0 (acid=-0.5) | 4 |
| Gut Arena | 14 | 64 | 12 | 12 | arena | 0 | 5 |
| Vorago's Maw | 13 | 80 | 14 | 14 | boss | -1 (acid=-2) | 6 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Gullet | Feast Hall | widening corridor | 4 | Throat opens into hall |
| Feast Hall | Pantry | secret | 2 | WALL_SECRET on west wall. **Visual tell:** The Feast Hall's east wall shows clean stonework — a stark contrast to the organic walls. Vase props placed near the wall subtly frame the WALL_SECRET entrance. |
| Feast Hall | Larder | corridor | 3 | Main path continues south |
| Larder | Bile Cistern | corridor | 3 | Ascending from -2 back to 0 |
| Bile Cistern | Gut Arena | corridor | 3 | Straight south |
| Gut Arena | Vorago's Maw | passage | 3 | Descending to -1 |

---

## Rooms (Detailed)

### Room 1: Gullet

```
    N
    ↓ (player enters from Circle 2 descent)
  ┌──────────────┐   Wide section (6 cells)
  │ ○     ★    ○ │   ★ = Player spawn
  │              │   ○ = gluttony-lantern-wall-green
  └──┐        ┌──┘
     │ narrow │      Narrows to 3 cells — throat constricts
     │  ☿     │      ☿ = hellgoat (Green) in narrow section
     │        │
  ┌──┘        └──┐   Widens again — breathing room
  │    ◊    ♥    │   ◊ = ammo, ♥ = health (MAYBE poisoned)
  │ ○          ○ │
  └──┐        ┌──┘
     │ narrow │      Narrows again, ceiling drops (elev +0.5 overhead)
     │   ☿    │      ☿ = hellgoat (Green)
     │ ═══════│      ═ = FLOOR_RAISED (+0.5) — step up
  ┌──┘        └──┐
  │    ☿      ○  │   Final wide chamber before exit
  │              │   Floor dips to -0.5 then back to 0
  │  ◊    ♥     │   More pickups (trust issues begin)
  └──────┬───────┘
         ↓ S (widens to Feast Hall)
```

**Dimensions:** 6W × 14H, elevation varies
**Purpose:** Atmosphere introduction and first taste of poisoned pickups. The corridor narrows and widens like a throat swallowing — 6 cells wide, then 3, then 6, then 3, then 6 again. Ceiling height varies (visual only, achieved with overhead geometry). Floor has raised sections (FLOOR_RAISED, +0.5) and dipped sections (-0.5) creating uneven terrain. Green hellgoats wait in the wider chambers. Health pickups are present but some are poisoned — the player's first encounter with the mechanic.

**Elevation breakdown:**
- Entry wide section: 0
- First narrow: 0 (ceiling lower visually)
- Second wide: 0 (floor dip to -0.5 in center 2 cells)
- Second narrow: +0.5 (FLOOR_RAISED, step up)
- Exit wide: 0 (step back down)

**Props:**
- 2× gluttony-bloated-arch: (20,2) north entrance, (20,15) south exit — organic archways
- 2× gluttony-flesh-door-frame: (19,8) and (19,11), narrow-to-wide constrictions — throat points
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, (17,3), (22,3), (17,9), (22,12), `offsetY: 1.5` — sickly green light
- 2× gluttony-slop-bucket: floor at (18,5) and (21,10), wide sections — bile atmosphere
- 1× gluttony-rope-tendril: ceiling at (19,7), narrow section — organic tendril landmark
- 2× gluttony-stomach-wall-growth: wall surfaces (17,6) and (22,10) — organic wall bulges
- 2× gluttony-dripping-stalactite: ceiling at (19,4) and (20,11) — dripping from above
- 1× gluttony-mucus-web: (22,7) narrow section corner — biological webbing
- 1× gluttony-maggot-mound: (18,13) exit wide section floor — nauseating decoration

---

### Room 2: Feast Hall

```
              ↓ N (widens from Gullet)
  ┌──────────────────────────────────┐
  │ ○                            ○   │   Elevation 0
  │                                  │
  │   ☿    ┌══════════════════┐  ☿  │   ☿ = hellgoat (Green), patrol table
  │        │ feast-table      │      │   Table runs E-W center
  │   🍎🍺 │ 🍽  🫕  🍽  🍺 │ 🍎  │   🍎=gluttony-rotten-crate, 🍺=gluttony-overflowing-goblet
  │   ♥  ♥ │  ♥  ◊  ♥  ◊  │ ♥  ♥ │   ♥=health (HALF POISONED!), ◊=ammo
  │        │ 🍽  🫕  🍽  🫕 │      │   🫕=bile-cauldron, 🍽=gluttony-bone-plate
  │   ☿    └══════════════════┘  ☿  │
  │                                  │
  │ ○  ☽                       ○   │   ☽ = lust-chandelier (overhead)
  │                                  │
  └─┬──────────────────┬─────────────┘
    ↓ SW               ↓ S
  (secret:Pantry)    (to Larder)
```

**Dimensions:** 14W × 10H, elevation 0
**Purpose:** The poison mechanic showcase. A grand feast hall with a massive feast-table running east-west through the center (10 cells long, 2 cells deep). The table is loaded with food props: gluttony-rotting-barrel, gluttony-rotten-crate, gluttony-overflowing-goblet, gluttony-bone-plate, bile-cauldron. Health pickups are scattered on and around the table — **6 total, 3 are poisoned** (50% ratio, seeded random). Ammo pickups are mixed in. Green hellgoats patrol the aisles flanking the table.

The room is well-lit (lust-chandelier overhead) — the player can see everything clearly. The abundance is the trap. Taking every health pickup is punished. The player must learn to be selective or use the visual tell: safe health pickups glow warm red with a gentle pulse, while poisoned pickups glow sickly green with dripping particle effects. The distinction is subtle in the first room but becomes learnable. A brief tooltip on the first poisoned pickup encounter: *"Not all nourishment is safe."*

**Props:**
- 2× gluttony-bloated-arch: (20,20) north entrance, (20,29) south exit — organic archways
- 1× gluttony-flesh-door-frame: (13,27) west wall — near WALL_SECRET to Pantry
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, corners (13,20), (26,20), (13,29), (26,29), `offsetY: 1.5`
- 1× feast-table: center (17,24)-(25,26) — massive feast table loaded with rot
- 1× lust-chandelier: ceiling center at (20,24) — warm overhead, food looks appetizing
- 2× bile-cauldron: flanking table ends (16,25) and (26,25) — bubbling cauldrons
- 3× gluttony-rotting-barrel: north wall (14,21), (17,21), (25,21) — overflowing
- 2× gluttony-rotten-crate: near table ends (14,22) and (25,22) — spoiling
- 4× gluttony-overflowing-goblet: on table (18,25), (20,25), (22,25), (24,25) — scattered pewter, sludge
- 4× gluttony-bone-plate: on table (19,24), (21,24), (23,24), (19,26) — grotesque place settings
- 1× gluttony-swollen-cask: SW corner (14,28) — wine cask gone wrong
- 1× gluttony-slop-bucket: SE corner (26,28) — aftermath of excess
- 2× gluttony-fungus-pillar: flanking table center (14,24) and (26,24) — structural decay
- 1× gluttony-meat-carcass: hanging near table north (16,22) — the feast's source
- 1× gluttony-dripping-stalactite: ceiling at (20,21) — organic drip onto feast

---

### Room 3: Larder

```
              ↓ N (from Feast Hall)
  ┌────────────────────────┐  Elevation 0 (entry)
  │ ○ [SHELF] [SHELF]  ○  │  [SHELF] = gluttony-shelf-arch (wall-mounted)
  │  ▣  ▣  platform   ▣   │  ▣ = gluttony-rotting-barrel / gluttony-rotten-crate (on shelves)
  │ ════════════════════   │  ════ = platform edge, elev 0
  │         ↓ drop 1       │
  │ ┊   ☿   ┊   gap   ┊   │  Elevation -0.5
  │ ┊ [SHELF]┊ [SHELF] ┊  │  ┊ = gluttony-rope-tendril (hanging, marks safe path)
  │ ▣  ▣   platform  ▣ ▣  │
  │ ════════════════════   │
  │         ↓ drop 2       │
  │     ☿     ☿            │  Elevation -1.0
  │ ┊ [SHELF]┊ [SHELF] ┊  │  Enemies fire ACROSS the gap
  │  ▣  ▣   platform ▣ ▣  │  between shelf levels
  │ ════════════════════   │
  │         ↓ drop 3       │
  │  ◊    ♥     ☿      ○  │  Elevation -1.5
  │ [SHELF] [SHELF]        │
  │ ════════════════════   │
  │         ↓ drop 4       │  Elevation -2.0 (bottom)
  │  ◊    ♥              ○ │  Bottom — exit south
  └────────────┬───────────┘
               ↓ S (to Bile Cistern, ramp up)
```

**Dimensions:** 10W × 12H, elevation 0 (top) to -2 (bottom)
**Purpose:** Vertical descent through a larder carved into organic walls. Five platforms at different elevations (0, -0.5, -1.0, -1.5, -2.0) are connected by drops (no ramps — you jump down, you cannot go back up easily). gluttony-shelf-arch props line the walls at each level, stacked with gluttony-rotting-barrel and gluttony-rotten-crate. Enemies stand on different shelf levels and fire across the vertical gap at the player as they descend. gluttony-rope-tendril hang between levels — decorative but they visually mark safe landing zones.

Missing a platform edge means falling to the next level (or two levels), taking fall damage. The descent is one-way — commitment to each drop.

**Elevation breakdown:**
- Platform 1 (entry): elevation 0, full width (10 cells)
- Platform 2: elevation -0.5, 8 cells wide (1-cell gap on each side)
- Platform 3: elevation -1.0, 8 cells wide (offset from platform 2)
- Platform 4: elevation -1.5, 6 cells wide (narrowing)
- Platform 5 (bottom/exit): elevation -2.0, full width

**Props:**
- 2× gluttony-bloated-arch: (20,34) north entrance, (20,45) south exit — organic archways
- 8× gluttony-shelf-arch: `surfaceAnchor: 'wall'`, (15,35), (24,35), (15,38), (24,38), (15,41), (24,41), (15,44), (24,44), `offsetY: 0.5` — 2 per platform level
- 6× gluttony-rotting-barrel: on shelf surfaces, stacked — rotting provisions
- 6× gluttony-rotten-crate: on shelf surfaces, stacked — spoiled supply crates
- 3× gluttony-rope-tendril: hanging at (17,37), (20,40), (19,43) — safe landing zone markers
- 2× gluttony-rope-tendril: alternate paths at (22,38) and (21,42)
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, (15,36), (24,39), (15,42), (24,44), `offsetY: 1.0` — one per platform level
- 2× gluttony-overflowing-goblet: on shelves at (16,36) and (23,40) — bottles rolling off edges
- 2× gluttony-dripping-stalactite: ceiling at (19,35) and (21,41) — organic stalactites between levels
- 1× gluttony-meat-carcass: hanging from ceiling at (23,36) — larder contents

---

### Room 4: Bile Cistern

```
              ↓ N (ascending ramp from Larder)
  ┌────────────────────────────────┐
  │ ○  ═══╗         ╔═══  ○       │  Elevation 0 (walkways)
  │  walk ║  ACID   ║  walk       │  ═ / ║ = raised stone walkways (2 cells wide)
  │  ═══╗ ║  POOL   ║ ╔═══       │  ACID = FLOOR_LAVA (green acid, -0.5)
  │     ║ ║ (green) ║ ║          │
  │  ☿  ║ ╚════╗   ║ ║  ☿       │  ☿ = fireGoat on walkways
  │     ║      ║   ║ ║          │
  │     ╚══════╝   ║ ║          │  Walkways form a crisscross grid
  │         ♥*     ║ ║          │  ♥* = POISONED health on dead-end walkway
  │  ═══════════╗  ║ ║          │
  │  ☿          ║  ╚═╝  ☿      │
  │  ◊       ═══╝    ♥*  ◊     │  ♥* = another poisoned lure
  │ ○                        ○  │
  │    ═══════════════════      │  Main walkway to exit (safe path)
  │  ☿       ♥         ◊      │  ♥ = real health (on main path)
  └──────────────┬──────────────┘
                 ↓ S (to Gut Arena)
```

**Dimensions:** 12W × 10H, elevation 0 (walkways), -0.5 (acid)
**Purpose:** Flooded room. The entire floor is an acid pool (FLOOR_LAVA with green tint, 3 DPS on contact). Raised stone walkways (2 cells wide, elevation 0) form a crisscross grid above the acid. Enemies stand on different walkway segments. Dead-end walkways hold tempting health pickups that are guaranteed poisoned — lures for the greedy. The main path through the room is a walkway along the south wall. The player must decide: take the safe path with fewer pickups, or risk dead-end walkways that might poison you.

**Elevation:** Walkways at 0 (flush with room entry). Acid pool at -0.5. Walkway edges are sharp — one misstep puts you in acid.

**Props:**
- 2× gluttony-bloated-arch: (20,50) north entrance, (20,59) south exit — organic archways
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, corners (14,50), (25,50), (14,59), (25,59), `offsetY: 1.5` — reflected green in acid
- 3× gluttony-slop-bucket: on walkways (16,52), (22,55), (24,57) — tipped, bile into acid
- 2× gluttony-rotting-barrel: walkway intersections (18,53) and (23,56) — navigation markers
- 2× bile-cauldron: on walkways (16,52) and (22,56) — bubbling acid-adjacent
- 1× gluttony-acid-pool-edge: walkway edges throughout — corroded stone
- 1× gluttony-bile-pool-surface: acid floor areas between walkways — toxic surface detail
- 2× gluttony-mucus-web: walkway corners (15,54) and (24,53) — organic webbing
- 2× gluttony-stomach-wall-growth: wall surfaces (14,54) and (25,56) — organic wall bulges

---

### Room 5: Gut Arena

```
              ↓ N (from Bile Cistern)
  ┌──────────────────────────────┐
  │ ○                         ○  │   Elevation 0
  │    ╔═══════════════════╗     │
  │    ║ OUTER RING        ║     │   Outer ring: 2 cells wide
  │    ║ ╔══ ACID ══════╗  ║     │   Acid channel 1: 1 cell wide
  │    ║ ║ MIDDLE RING  ║  ║     │   Middle ring: 2 cells wide
  │    ║ ║ ╔═ ACID ══╗ ║  ║     │   Acid channel 2: 1 cell wide
  │    ║ ║ ║ INNER   ║ ║  ║     │   Inner ring: 2 cells wide
  │    ║ ║ ║ RING    ║ ║  ║     │   (shrinks wave 2: acid widens)
  │    ║ ║ ╚═════════╝ ║  ║     │
  │    ║ ╚══════════════╝  ║     │   Bridges: 2-cell-wide crossings
  │    ╚═══════════════════╝     │   at N, S, E, W connect rings
  │ ○                         ○  │
  └──────────────┬───────────────┘
                 ↓ S (to Vorago's Maw)

  Cross-section (rings and bridges):
        N bridge
          │
    ──── OUTER ── acid ── MIDDLE ── acid ── INNER ── acid ── MIDDLE ── acid ── OUTER ────
          │
        S bridge
```

**Dimensions:** 12W × 12H, elevation 0
**Purpose:** Arena encounter. Three concentric rings of walkable floor separated by 1-cell-wide acid channels. Four bridges (N, S, E, W, each 2 cells wide) connect all rings. Two waves of enemies on different rings. Between waves, the inner acid channel widens by 1 cell on each side — the inner ring shrinks from 2 cells to 0, becoming submerged. Players on the inner ring when acid rises must jump to the middle ring. Less space, more pressure.

Doors lock on entry. Wave 1: green hellgoats on outer and middle rings. Wave 2: mixed fireGoat + hellgoat, inner ring gone, fighting on outer and middle only.

**Elevation:** All rings at 0. Acid channels at -0.5. Bridges at 0 (flush with rings).

**Ring dimensions (approximate grid):**
- Outer ring: 2 cells wide, follows room perimeter (inset 1 cell from walls)
- Acid channel 1: 1 cell wide
- Middle ring: 2 cells wide
- Acid channel 2: 1 cell wide
- Inner ring: 2 cells wide (center area, 2×2)

**Props:**
- 2× gluttony-bloated-arch: (20,64) north entrance, (20,75) south exit — organic archways
- 4× gluttony-organic-column: outer corners (15,65), (25,65), (15,75), (25,75) — arena markers
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, (14,65), (25,65), (14,75), (25,75), `offsetY: 1.5`
- 4× gluttony-slop-bucket: outer ring, one per quadrant — acid spilling
- 2× bile-cauldron: middle ring bridges (20,67) and (20,73) — hazard markers
- 1× gluttony-acid-pool-edge: ring channel edges — corroded borders
- 1× gluttony-bile-pool-surface: acid channels between rings — surface detail
- 2× gluttony-maggot-mound: inner ring (18,69) and (22,69) — submerges wave 2
- 2× gluttony-fungus-pillar: middle ring (17,67) and (23,71) — sightline cover
- 3× gluttony-dripping-stalactite: ceiling (20,66), (20,74), (16,70) — organic horror overhead
- 2× gluttony-stomach-wall-growth: walls (14,68) and (25,72) — foreshadow boss room

---

### Room 6: Pantry (Secret)

```
  WALL_SECRET entrance from Feast Hall (E wall)
         →
  ┌──────────────┐
  │ ○         ○  │   Clean stone walls (contrast to organic)
  │              │
  │  ▣   📜      │   ▣ = Barrel (safe supplies)
  │              │   📜 = lore scroll on gluttony-shelf-arch
  │  ♥   ♥   ◊  │   ♥ = health (GUARANTEED non-poisoned)
  │              │   ◊ = ammo
  │  ▣   ◊   ▣  │
  │ ○         ○  │
  └──────────────┘
  No exit — return the way you came
```

**Dimensions:** 6W × 6H, elevation 0
**Purpose:** Secret reward room. Hidden behind WALL_SECRET on the west wall of Feast Hall. The walls here are clean dry stone — not organic. A relief from the meat-walls. Contains guaranteed non-poisoned health pickups (the only guaranteed-safe health in this circle outside the Pantry), ammo, and a lore scroll. No enemies. The player who explores is rewarded with trustworthy supplies.

**Props:**
- 1× gluttony-bloated-arch: (8,35) east entry from Feast Hall — frame WALL_SECRET entry
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, corners (3,32), (8,32), (3,37), (8,37), `offsetY: 1.5` — warmer light
- 3× gluttony-rotting-barrel: floor at (4,34), (4,36), (7,36) — clean sealed barrels
- 1× gluttony-shelf-arch: `surfaceAnchor: 'wall'`, north wall (5,32), `offsetY: 1.0` — holds lore scroll
- 1× gluttony-rotten-crate: floor at (6,34) — sealed supply crate, intact
- 1× gluttony-pantry-chest: floor at (6,36) — hero piece, treasure chest marks true reward

---

### Room 7: Vorago's Maw (Boss)

```
              ↓ N (passage from Gut Arena, descending)
  ┌──────────────────────────────────────┐
  │ ○                                 ○  │  Elevation -1 (entry ledge, 2 cells deep)
  │  ◊                            ◊     │  Entry ledge wraps N wall
  │──────────────────────────────────────│  ← edge: drop to acid floor (-2)
  │                                      │
  │  ACID POOL (green, full floor)       │  Acid floor: FLOOR_LAVA, elev -2
  │                                      │  3 DPS on contact
  │        ┌════════════════┐            │
  │        │ CENTRAL        │            │  Central platform: elev -1 (raised)
  │   ♥    │ PLATFORM       │    ♥      │  8×6 cells, stable in phase 1
  │        │                │            │  ♥ = health on floating debris
  │        │    ☠ VORAGO    │            │  ☠ = boss spawn (center of platform)
  │        │                │            │
  │   ◊    │                │    ◊      │  ◊ = ammo on small acid-edge platforms
  │        └════════════════┘            │
  │                                      │  Phase 2: platform fragments into
  │  [chunk] [chunk]  [chunk]  [chunk]   │  6 floating chunks (3×3 min each)
  │                                      │
  │  ♥                              ♥   │  Phase 3: wind pull toward Vorago
  │ ○                                 ○  │  Shoot into open mouth to kill
  └──────────────────────────────────────┘

  Side elevation view:
    entry ledge ────  platform ────  entry ledge
        -1        │     -1      │       -1
                  │ acid: -2    │
                  └─────────────┘
```

**Dimensions:** 14W × 14H, elevation -1 (entry ledge and platform), -2 (acid floor)
**Purpose:** Boss fight. The room is shaped like a stomach — curved organic walls (Leather028 texture). The floor is entirely acid (FLOOR_LAVA, green, 3 DPS). A central raised platform (8×6 cells, elevation -1) sits above the acid. A 2-cell-wide entry ledge wraps the north wall at elevation -1. Small debris platforms (2×2, elevation -1) float at the edges with pickups.

Vorago crouches on the central platform — immense, grotesque. The Dainir female base pushed to maximum corpulence. Bloated. Drooling acid.

**Boss Phases:**

**Phase 1 — Gorge (100%–50% HP):**
Vorago stays on the central platform and vomits arcing acid projectiles. Where they land on the platform, temporary acid pools form (2×2 cells, 3-second duration, 3 DPS). The platform gradually accumulates hazard zones — the player must dodge both the arcing projectiles (visible in flight) and the ground pools. Vorago also summons 2 green hellgoats that spawn on the entry ledge. The player fights on the central platform, stepping around acid pools.

**Phase 2 — Devour (50%–25% HP):**
Vorago slams the platform with both fists — ground pound. The platform fragments into 6 floating chunks (minimum 3x3 cells each) that bob and sink on staggered timers, drifting slowly on the acid. The stable floor is gone. The player must jump between chunks. Vorago continues vomiting projectiles from her chunk (the largest, 4×4). Some chunks slowly sink (telegraph: they bob lower for 3 seconds before submerging for 5 seconds, then resurface). The player must read the bob pattern and time their jumps. Falling into acid is 3 DPS — survivable briefly, but fatal if you can't reach a chunk.

**Phase 3 — Consume (25%–0% HP):**
Vorago inhales. A massive wind pull toward her open mouth (wind zone, intensity 0.8, direction: toward boss). The suction is powerful — the player slides toward her across the chunks. Vorago's mouth is open wide — shooting into the open mouth deals 3x damage (critical zone). The player must resist the suction enough to maintain distance (too close = melee bite, 25 damage) while accurately shooting the mouth. The chunks continue to bob and drift. Wind makes jumping between chunks harder — you slide on landing. Kill Vorago by dealing enough damage to the mouth. On death, she collapses into the acid, the acid drains, revealing solid floor beneath.

**Props:**
- 1× gluttony-flesh-door-frame: (20,80) north entrance — mouth-shaped entry to stomach
- 2× gluttony-organic-column: (14,82) and (26,82) flanking entry ledge — flesh columns
- 4× gluttony-lantern-wall-green: `surfaceAnchor: 'wall'`, (13,81), (26,81), (13,93), (26,93), `offsetY: 2.0` — high-mounted, pulsing pink-red
- 2× bile-cauldron: entry ledge (15,81) and (25,81) — bubbling acid at entrance
- 2× gluttony-rope-tendril: ceiling-hung (17,84) and (23,84) — organic tendons
- 1× gluttony-slop-bucket: central platform (19,84) — tipped bile bucket
- 4× gluttony-stomach-wall-growth: walls (13,85), (26,85), (13,89), (26,89) — stomach lining, pulsing
- 1× gluttony-acid-pool-edge: platform/ledge edges — corroded stone meeting acid
- 1× gluttony-bile-pool-surface: full acid floor between structures — toxic surface
- 3× gluttony-dripping-stalactite: ceiling (18,82), (22,82), (20,92) — organic drip into acid
- 2× gluttony-meat-carcass: wall-hung (14,88) and (26,88) — partially digested remains
- 2× gluttony-maggot-mound: small platforms (16,84) and (24,90) — organic matter
- 2× gluttony-mucus-web: wall-to-platform (15,86) and (25,86) — biological bridging
- 2× gluttony-rope-tendril: ceiling over platform (19,88) and (21,88) — stomach muscles
- 2× gluttony-organic-column: platform edges (18,85) and (22,85) — structural cover

---

## Entities

### Enemies (15 total + boss)

| Room | Type | Count | Behavior | Variant | Position Notes |
|------|------|-------|----------|---------|----------------|
| Gullet | hellgoat | 3 | Melee, wait in wide sections | Green (sickly) | First narrow (18, 7), second narrow (19, 11), exit wide (19, 14) |
| Feast Hall | hellgoat | 4 | Patrol table aisles, 2 per side | Green (sickly) | NW (14, 23), NE (25, 23), SW (14, 27), SE (25, 27) |
| Larder | fireGoat | 2 | Ranged, fire across vertical gap | Crimson | Platform 2 (17, 38), platform 3 (22, 41) |
| Larder | hellgoat | 1 | Melee, guards bottom | Green (sickly) | Platform 4 (19, 43) |
| Bile Cistern | fireGoat | 3 | Ranged from walkway segments | Crimson | NW walkway (16, 51), center (20, 54), SE walkway (24, 57) |
| Gut Arena wave 1 | hellgoat | 4 | Melee, outer + middle rings | Green (sickly) | Outer N (20, 65), outer S (20, 73), middle E (23, 69), middle W (17, 69) |
| Gut Arena wave 2 | fireGoat | 2 | Ranged from middle ring | Crimson | Middle N (20, 67), middle S (20, 71) |
| Gut Arena wave 2 | hellgoat | 2 | Melee, outer ring flanks | Green (sickly) | Outer E (24, 69), outer W (16, 69) |
| Boss chamber (phase 1 add) | hellgoat | 2 | Melee, spawn on entry ledge | Green (sickly) | Entry ledge (15, 81), (25, 81) |
| Boss chamber | Vorago | 1 | Boss AI, 3 phases | boss-vorago.glb | Central platform (20, 87), elev -1 |

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Gullet | ammo | (20, 6) | Early resupply — reliable ammo in first wide section |
| Gullet | health | (19, 8) | First wide section — may be poisoned (50%) |
| Gullet | ammo | (18, 8) | Reliable ammo near health |
| Gullet | health | (19, 13) | Second wide section — may be poisoned |
| Gullet | ammo | (20, 13) | Reliable ammo |
| Feast Hall | health × 6 | Table area: (17,25), (19,25), (21,25), (23,25), (18,26), (22,26) | **3 are poisoned** (seeded 50%) — the core mechanic |
| Feast Hall | ammo × 2 | (20, 24), (20, 27) | Flanking table, reliable |
| Larder | health | (18, 43) | Platform 4, may be poisoned |
| Larder | ammo | (21, 45) | Bottom level, reliable |
| Bile Cistern | health × 2 | Dead-end walkways: (15, 55), (24, 54) | **Both guaranteed poisoned** — lures |
| Bile Cistern | health | (20, 58) | Main walkway, may be poisoned (50%) |
| Bile Cistern | ammo × 2 | (18, 52), (23, 57) | On walkways, reliable |
| Bile Cistern | ammo | (20, 55) | Non-poisoned, on main walkway path — sustains three-weapon loadout |
| Pantry | health × 2 | (5, 36), (7, 36) | **Guaranteed non-poisoned** (secret reward) |
| Pantry | ammo | (7, 35) | Reliable ammo |
| Gut Arena (between waves) | ammo | (20, 65) | Outer ring N |
| Gut Arena (between waves) | health | (20, 73) | Outer ring S — may be poisoned |
| Boss chamber | ammo × 2 | (15, 81), (25, 81) | Entry ledge corners |
| Boss chamber | health × 2 | (15, 87), (25, 87) | Edge debris platforms — may be poisoned |
| Boss chamber | health × 2 | (14, 91), (26, 91) | S edge platforms — may be poisoned |

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Gullet | (17, 2, 6, 4) | `ambientChange` | `once: true` | `{ poisonPickupsActive: true, text: "The air is thick with the smell of rot and plenty..." }` |
| T2 | Feast Hall | (13, 20, 14, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'hellgoat', count:4, variant:'green'}] }` |
| T3 | Feast Hall | (13, 20, 14, 10) | `poisonSeed` | `once: true` | `{ ratio: 0.5, seed: 'feast-hall-poison' }` — marks 50% of health pickups as poisoned |
| T4 | Larder | (15, 34, 10, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'fireGoat', count:2}, {type:'hellgoat', count:1, variant:'green'}] }` |
| T5 | Bile Cistern | (14, 50, 12, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'fireGoat', count:3}] }` |
| T6 | Bile Cistern | (14, 50, 12, 10) | `poisonOverride` | `once: true` | `{ positions: [(15,55),(24,54)], forced: 'poison' }` — dead-end pickups always poison |
| T7 | Gut Arena | (16, 66, 8, 4) | `lockDoors` | `once: true` | — |
| T8 | Gut Arena | (16, 66, 8, 4) | `spawnWave` | `once: true` | `{ enemies: [{type:'hellgoat', count:4, variant:'green'}] }` |
| T9 | Gut Arena | — | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'fireGoat', count:2}, {type:'hellgoat', count:2, variant:'green'}] }` |
| T10 | Gut Arena | — | `acidRise` | On wave 1 clear | `{ innerChannel: 'widen', amount: 1, text: "The acid rises..." }` — inner ring submerges |
| T11 | Gut Arena | — | `unlockDoors` | On wave 2 clear | — |
| T12 | Vorago's Maw | (17, 81, 6, 2) | `bossIntro` | `once: true` | `{ text: "Hungry, little goat? Mother will feed you..." }` |
| T13 | Vorago's Maw | (17, 81, 6, 2) | `lockDoors` | `once: true, delay: 3` | — |
| T14 | Vorago's Maw | — | `bossPhase` | Boss HP < 50% | `{ phase: 2, action: 'fragmentPlatform', chunks: 6 }` |
| T15 | Vorago's Maw | — | `bossPhase` | Boss HP < 25% | `{ phase: 3, action: 'inhaleWind', windIntensity: 0.8, windDir: 'toward_boss' }` |
| T16 | Vorago's Maw | — | `ambientChange` | Boss HP < 50% | `{ fogDensity: 0.06 }` |
| T17 | Vorago's Maw | — | `ambientChange` | Boss HP < 25% | `{ fogDensity: 0.08 }` |

---

## Environment Zones

| Zone | Type | Bounds (x,z,w,h) | Intensity | Notes |
|------|------|-------------------|-----------|-------|
| Feast Hall poison aura | `poison` | (13, 20, 14, 10) | 0.5 | 50% chance health pickups are poisoned (visual: sickly green glow + dripping particles; safe = warm red pulse) |
| Bile Cistern acid floor | `lava` | (14, 50, 12, 10) | 1.0 | Green acid, 3 DPS. Walkways are safe. |
| Gut Arena acid channels | `lava` | Ring-shaped, 1 cell wide between rings | 1.0 | Green acid, 3 DPS. Widens after wave 1. |
| Gut Arena inner ring acid (wave 2) | `lava` | Center 2×2 (expands to 4×4) | 1.0 | Inner ring submerges — acid replaces floor |
| Boss acid floor | `lava` | (13, 82, 14, 12) | 1.0 | Green acid, 3 DPS. Central platform and debris exempt. |
| Boss inhale wind (phase 3) | `wind` | (13, 80, 14, 14) | 0.8 | Direction: toward boss center. Phase 3 only. |
| Global moisture | `ambient` | Full level (0,0,40,90) | 0.4 | Wet surfaces, dripping sounds, slick feel |

---

## Player Spawn

- **Position:** (20, 4) — center of Gullet's first wide section
- **Facing:** π (south — facing toward Feast Hall)

---

## Theme Configuration

```typescript
editor.createTheme('circle-3-gluttony', {
  name: 'gluttony',
  displayName: 'GLUTTONY — The Circle of Excess',
  primaryWall: MapCell.WALL_FLESH,        // Organic meat walls
  accentWalls: [MapCell.WALL_STONE],      // Stone walkways/platforms as contrast
  fogDensity: 0.04,
  fogColor: '#1a2211',
  ambientColor: '#88aa44',
  ambientIntensity: 0.18,
  skyColor: '#0a0f05',
  particleEffect: 'drips',               // Green moisture dripping from ceiling
  enemyTypes: ['hellgoat', 'fireGoat'],
  enemyVariant: 'green',                  // Sickly green hellgoats
  enemyDensity: 1.0,                      // Standard density
  pickupDensity: 1.5,                     // HIGH — abundance is the trap
  poisonedPickupRatio: 0.5,              // 50% of health pickups deal damage
  poisonedPickupDamage: 10,              // Damage dealt by poisoned pickup
  poisonedPickupTint: '#44ff22',         // Sickly green glow + dripping particles (safe = warm red pulse)
});
```

---

## Narrative Beats

1. **Gullet entry:** The marble of Lust is gone. The walls are wet, textured like leather stretched over something alive. The corridor narrows — you feel swallowed. Title card: *"CIRCLE THE THIRD — GLUTTONY"*
2. **First poisoned pickup:** The player takes a health pickup. Instead of the heal sound, a sickly crunch. HP drops. The screen flashes green. The lesson lands: not everything that looks helpful IS helpful.
3. **Feast Hall abundance:** The table is loaded with food props and health pickups. The abundance is overwhelming after the scarcity of Limbo. The trap: greed makes you grab everything. Discipline makes you test first.
4. **Larder descent:** Looking down through the shelves into the depth below. Enemies firing from different levels. The ropes mark safe paths but you can't be sure. The vertical space is vertiginous.
5. **Bile Cistern dead-end lure:** A health pickup gleams at the end of a dead-end walkway over acid. The player walks out. The pickup poisons them. They're on a narrow walkway surrounded by acid, now hurt instead of healed. Gluttony punishes the greedy.
6. **Pantry scroll (secret):** *"The glutton reaches for everything and chokes on nothing. The wise eat little and live long. These supplies are clean — a gift for those who sought rather than seized."*
7. **Gut Arena acid rise:** Between waves, the inner ring submerges. Players standing on it must scramble outward. The space shrinks. The pressure increases. Excess leads to less.
8. **Boss intro:** Vorago speaks from the platform, her voice gurgling: *"Hungry, little goat? Mother will feed you..."* The acid bubbles.
9. **Boss phase 2 — platform fragments:** The ground shatters. The player is jumping between chunks of stone floating on acid. The stability is gone — just like the reliable floor in the Feast Hall was a lie. Nothing solid lasts in Gluttony.
10. **Boss phase 3 — the inhale:** Vorago opens her mouth impossibly wide. The wind pulls everything toward it. The player is being consumed. The only salvation: shooting back into the mouth that devours. Violence as self-defense against consumption.
11. **Boss defeat:** Vorago collapses into the acid. The acid drains. The floor is revealed — cold, hard stone. Clean. The organic nightmare peels away. Beneath gluttony: emptiness. Title card: *"CIRCLE THE FOURTH — GREED"*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter → renders in LevelMeshes.tsx
2. All 7 rooms are reachable from spawn (DAG validation passes); Pantry via WALL_SECRET
3. Poisoned pickup mechanic works — 50% of health pickups deal damage instead of healing, with seeded random per-room
4. Poisoned pickups have visual tell: sickly green glow with dripping particles vs. safe warm red pulse — subtle in first room, learnable over time. First poisoned pickup triggers tooltip: "Not all nourishment is safe."
5. WALL_FLESH primary wall type renders with Leather004/Leather017 PBR textures
6. Acid pools (green FLOOR_LAVA) deal 3 DPS and emit green light
7. Larder vertical descent supports 5 elevation levels with drop-down platforming
8. Bile Cistern walkways properly float above acid floor with dead-end lure paths
9. Gut Arena concentric rings work — acid channel widening after wave 1 submerges inner ring
10. Boss phase 2 platform fragmentation creates 6 jumpable chunks
11. Boss phase 3 wind pull (inhale) physically drags player toward Vorago
12. PlaytestRunner AI can navigate from spawn to boss and defeat Vorago
13. PBR materials from AmbientCG (Leather004, Leather017, Moss002, Rock027, Concrete022) render on surfaces
14. All Meshy props from the Prop Manifest Inventory render as GLB instances in scene
15. Each room feels distinct: atmosphere (Gullet), trap (Feast Hall), vertical (Larder), navigation (Cistern), arena (Gut), boss (Maw)

---

## What This Is NOT

- NOT a repeat of Circle 2's wind mechanic. Wind appears ONLY in the boss fight phase 3 (Vorago's inhale). The dominant mechanic here is poisoned pickups — trust, not physics.
- NOT stingy with pickups. This circle has MORE health pickups than any other — the trap is that half of them hurt you. Abundance is the theme.
- NOT visually similar to any previous circle. Limbo was gray stone. Lust was warm marble. Gluttony is organic meat-walls and green acid. The palette is completely different.
- NOT a flat layout. The Gullet undulates vertically. The Larder descends 2 full elevations. The Bile Cistern has walkways over a sunken acid floor. The boss room has a raised platform over acid that fragments into floating chunks.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models with circle-specific manifests + AmbientCG PBR textures for surfaces.
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored: atmosphere → trap introduction → vertical challenge → navigation puzzle → arena → boss.

---

## 3D Spatial Design

### Room: Gullet (6x14, gauntlet)

**Player Experience:** The marble of Lust is gone. The walls are wet, stretched like leather over something alive. The corridor narrows and you feel swallowed — the throat of something enormous closing around you. The floor is uneven, rising and falling beneath your feet. Green lanterns cast a sickly light that makes everything glisten. A health pickup gleams ahead. You take it. Your HP drops. The screen flashes green. Not everything that heals you is good for you. Welcome to Gluttony.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-bloated-arch | (20,2) north entrance | 0.9 | face-south | Organic entry from Circle 2 descent |
| gluttony-flesh-door-frame | (19,8) first narrow-to-wide | 0.8 | face-south | Throat constriction point |
| gluttony-flesh-door-frame | (19,11) second narrow-to-wide | 0.8 | face-south | Second constriction |
| gluttony-bloated-arch | (20,15) south exit widens | 1.0 | face-south | Opens to Feast Hall |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| gluttony-lantern-wall-green | (17,3), (22,3), (17,9), (22,12) walls | 0.9 | Sickly green lighting |
| gluttony-slop-bucket | (18,5) and (21,10) wide sections | 0.8 | Bile/slop atmosphere |
| gluttony-rope-tendril | (19,7) ceiling in narrow section | 1.0 | Organic tendril, landmark |
| gluttony-stomach-wall-growth | (17,6) and (22,10) wall surfaces | 0.7 | Organic wall bulges |
| gluttony-dripping-stalactite | (19,4) and (20,11) ceiling | 0.8 | Dripping from above |
| gluttony-mucus-web | (22,7) narrow section corner | 0.5 | Biological webbing |
| gluttony-maggot-mound | (18,13) exit wide section floor | 0.6 | Floor decoration, nauseating |

**Lighting:** 4x green lanterns, color `#aacc44`, intensity 0.5, radius 4 cells. Fog density 0.04, color `#1a2211`. Sickly ambiance throughout.
**Platforming:** Entry wide section at elevation 0. First narrow at 0 (ceiling lower visually). Second wide at 0 with center dip to -0.5. Second narrow has FLOOR_RAISED step (+0.5). Exit wide returns to 0.
**Prop density:** 15 assets in 84 cells (0.18 props/cell). The organic horror is immediate -- stalactites, mucus, maggots, and wall growths sell the throat-swallowing experience.

---

### Room: Feast Hall (14x10, exploration+trap)

**Player Experience:** The throat opens into a grand hall. A massive table runs through the center, loaded with food — or what was once food. Barrels of rotting apples. Cauldrons of bubbling something. Goblets overflowing with sludge. And health pickups. So many health pickups, scattered on and around the table. After the scarcity of Limbo and the danger of Lust, the abundance is overwhelming. You grab one. It heals. You grab another. It poisons. The screen flashes green. Three of the six health pickups on this table will hurt you. The lesson: abundance is a trap.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-bloated-arch | (20,20) north entrance | 1.0 | face-south | Entry from Gullet |
| gluttony-bloated-arch | (20,29) south exit to Larder | 1.0 | face-south | Main path continues |
| gluttony-flesh-door-frame | (13,27) west wall secret | 0.9 | face-east | Near WALL_SECRET to Pantry |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| feast-table | (17,24)-(25,26) center | 1.2 | Massive feast table, loaded with rot |
| bile-cauldron | (16,25) and (26,25) flanking table | 1.0 | Bubbling cauldrons at table ends |
| gluttony-lantern-wall-green | (13,20), (26,20), (13,29), (26,29) corners | 1.0 | Green-tinted room lighting |
| lust-chandelier | (20,24) ceiling center | 1.0 | Warm overhead — food looks appetizing |
| gluttony-rotting-barrel | (14,21), (17,21), (25,21) north wall | 0.9 | Overflowing with rotting apples |
| gluttony-rotten-crate | (14,22) and (25,22) near table ends | 0.8 | Spoiling fruit crate |
| gluttony-overflowing-goblet | (18,25), (20,25), (22,25), (24,25) on table | 0.5 | Scattered pewter goblets, sludge |
| gluttony-bone-plate | (19,24), (21,24), (23,24), (19,26) on table | 0.4 | Grotesque place settings |
| gluttony-swollen-cask | (14,28) SW corner | 0.9 | Wine cask gone wrong |
| gluttony-slop-bucket | (26,28) SE corner | 0.7 | Aftermath of excess |
| gluttony-fungus-pillar | (14,24) and (26,24) flanking table center | 1.0 | Structural, decay consuming stone |
| gluttony-meat-carcass | (16,22) hanging near table north | 0.8 | Hanging meat -- the feast's source material |
| gluttony-dripping-stalactite | (20,21) ceiling above table | 0.7 | Organic drip from above onto the feast |

**Lighting:** 4x green lanterns at corners, color `#aacc44`, intensity 0.6. 1x chandelier center, color `#ccaa66`, intensity 0.7 (warmer — makes food look appetizing). Fog density 0.03. The clearest room — you need to see the food to be tempted.
**Platforming:** Flat at elevation 0. Table is a non-walkable obstacle (2 cells deep, 10 cells long). Aisles on both sides.
**Prop density:** 19 unique assets in 140 cells (0.14 props/cell). The feast table and surrounding rot create the signature Gluttony moment -- abundance as horror.

---

### Room: Larder (10x12, platforming)

**Player Experience:** You look down through shelves carved into organic walls, stacked with rotting barrels and crates, descending into darkness. Ropes hang between levels — they mark safe landing zones but you cannot climb them. Enemies fire across the vertical gap from different shelf levels. You drop to the first platform. Then the next. Each drop is commitment — there is no going back up. The shelves narrow as you descend. At the bottom, supplies and an exit south.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-bloated-arch | (20,34) north entrance | 0.9 | face-south | Entry from Feast Hall |
| gluttony-bloated-arch | (20,45) south exit | 0.9 | face-south | Exit to Bile Cistern ramp |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| gluttony-shelf-arch | (15,35), (24,35) level 1 walls | 1.0 | Wall-mounted shelving, stacked goods |
| gluttony-shelf-arch | (15,38), (24,38) level 2 walls | 1.0 | Shelving with barrels |
| gluttony-shelf-arch | (15,41), (24,41) level 3 walls | 1.0 | Shelving with crates |
| gluttony-shelf-arch | (15,44), (24,44) level 4 walls | 1.0 | Bottom level shelving |
| gluttony-rotting-barrel | shelf surfaces, 6 total stacked | 0.7 | Stored provisions, rotting |
| gluttony-rotten-crate | shelf surfaces, 6 total stacked | 0.7 | Supply crates, spoiled |
| gluttony-rope-tendril | (17,37), (20,40), (19,43) hanging | 1.2 | Safe landing zone markers |
| gluttony-rope-tendril | (22,38) and (21,42) hanging | 1.0 | Alternate path markers |
| gluttony-lantern-wall-green | (15,36), (24,39), (15,42), (24,44) | 0.9 | One per platform level, green glow |
| gluttony-overflowing-goblet | (16,36) and (23,40) on shelves | 0.5 | Bottles rolling off edges |
| gluttony-dripping-stalactite | (19,35) and (21,41) ceiling at upper levels | 0.7 | Organic stalactites between levels |
| gluttony-meat-carcass | (23,36) hanging from ceiling | 0.8 | Larder contents — hanging meat |

**Lighting:** 4x green lanterns, one per platform level, color `#aacc44`, intensity 0.5. Light decreases with depth. Fog density 0.05. The bottom is the darkest.
**Platforming:** Platform 1 (entry): elevation 0, full width. Platform 2: elevation -0.5, 8 cells (1-cell gap each side). Platform 3: elevation -1.0, 8 cells (offset). Platform 4: elevation -1.5, 6 cells (narrowing). Platform 5 (bottom): elevation -2.0, full width. One-way drops between all platforms.

---

### Room: Bile Cistern (12x10, flooded)

**Player Experience:** The entire floor is acid — sickly green, bubbling, emitting a toxic glow. Raised stone walkways form a crisscross grid above the pool. You are safe on the walkways but one misstep means acid. Enemies fire from distant walkway segments. And there — at the end of a dead-end walkway — a health pickup. It gleams. You walk out to get it. It poisons you. You are on a narrow walkway surrounded by acid, now hurt instead of healed. Gluttony punishes the greedy.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-bloated-arch | (20,50) north entrance | 1.0 | face-south | Entry from Larder ascent |
| gluttony-bloated-arch | (20,59) south exit | 1.0 | face-south | Exit to Gut Arena |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| gluttony-lantern-wall-green | (14,50), (25,50), (14,59), (25,59) corners | 1.0 | Reflected green in acid surface |
| gluttony-acid-pool-edge | Walkway edges throughout | 0.5 | Corroded stone edges, acid erosion |
| gluttony-slop-bucket | (16,52), (22,55), (24,57) on walkways | 0.7 | Tipped buckets, bile dripping into acid |
| gluttony-rotting-barrel | (18,53) and (23,56) walkway intersections | 0.8 | Navigation markers |
| bile-cauldron | (16,52) and (22,56) on walkways | 0.9 | Bubbling acid-adjacent cauldrons |
| gluttony-bile-pool-surface | Acid floor areas between walkways | 1.0 | Toxic pool surface detail |
| gluttony-mucus-web | (15,54) and (24,53) walkway corners | 0.5 | Organic webbing on supports |
| gluttony-stomach-wall-growth | (14,54) and (25,56) wall surfaces | 0.8 | Organic wall bulges |

**Lighting:** 4x green lanterns at corners, color `#aacc44`, intensity 0.6. Acid floor emits `#44ff22` at intensity 0.3, radius 3 cells. The green underlight reflects off everything. Fog density 0.05 — moisture in the air.
**Platforming:** Walkways at elevation 0 (2 cells wide, crisscross grid). Acid pool at -0.5. Sharp walkway edges — one misstep into acid (3 DPS). Dead-end walkways hold guaranteed-poisoned health pickups as lures.
**Prop density:** 14 assets in 120 cells (0.12 props/cell). Acid-pool edges, bile surfaces, and wall growths break the visual monotony of walkway-acid-walkway.

---

### Room: Gut Arena (12x12, arena)

**Player Experience:** Three concentric rings separated by acid channels. Four bridges connect them at the cardinal points. The doors slam shut. Enemies charge across bridges from the outer ring. You fight ring to ring, bridge to bridge. Then between waves, the acid rises. The inner ring submerges. Players standing on it scramble outward as green acid bubbles up through the stone. Less space. More enemies. The arena shrinks around you like a digestive tract.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-bloated-arch | (20,64) north entrance | 1.0 | face-south | Entry from Bile Cistern |
| gluttony-bloated-arch | (20,75) south exit | 1.0 | face-south | Exit to Vorago's Maw |
| gluttony-organic-column | (15,65), (25,65), (15,75), (25,75) outer corners | 1.0 | Arena corner markers |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| gluttony-lantern-wall-green | (14,65), (25,65), (14,75), (25,75) N/S/E/W | 1.0 | Arena lighting per quadrant |
| gluttony-slop-bucket | Outer ring, one per quadrant (4 total) | 0.7 | Acid spilling onto ring |
| bile-cauldron | (20,67) and (20,73) middle ring bridges | 0.8 | Hazard markers on N/S bridges |
| gluttony-acid-pool-edge | Ring channel edges | 0.5 | Corroded channel borders |
| gluttony-bile-pool-surface | Acid channels between rings | 0.8 | Channel surface detail |
| gluttony-maggot-mound | (18,69) and (22,69) inner ring | 0.5 | Inner ring decoration — submerges wave 2 |
| gluttony-fungus-pillar | (17,67) and (23,71) middle ring | 0.9 | Structural -- break sightlines, add cover |
| gluttony-dripping-stalactite | (20,66), (20,74), (16,70) ceiling | 0.8 | Vertical detail -- organic horror overhead |
| gluttony-stomach-wall-growth | (14,68) and (25,72) walls | 0.7 | Foreshadow the boss room's organic theme |

**Lighting:** 4x green lanterns at walls, color `#aacc44`, intensity 0.7. Acid channels emit `#44ff22`, intensity 0.3 (intensifies after wave 1 acid rise). Fog density 0.04.
**Platforming:** All rings at elevation 0. Acid channels at -0.5 (1 cell wide). Bridges at 0 (flush with rings, 2 cells wide, N/S/E/W). After wave 1 clear: inner acid channels widen by 1 cell each side, inner ring (2x2 center) submerges to -0.5. Arena shrinks.
**Prop density:** 17 assets in 144 cells (0.12 props/cell). Fungus pillars provide cover and sightline breaks. Stalactites and wall growths foreshadow the boss room.

---

### Room: Pantry (6x6, secret)

**Player Experience:** You push through the hidden wall and the organic horror stops. Clean dry stone. No moisture. No meat-walls. The relief is physical — you exhale. Lanterns give warm light. Sealed barrels hold real supplies. A shelf holds a scroll: "The glutton reaches for everything and chokes on nothing. The wise eat little and live long." The health pickups here glow warm red — guaranteed safe. The only trustworthy healing in all of Gluttony.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-bloated-arch | (8,35) east entry from Feast Hall | 0.8 | face-west | Frame the WALL_SECRET entry |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| gluttony-lantern-wall-green | (3,32), (8,32), (3,37), (8,37) corners | 0.8 | Warmer light here — less sickly |
| gluttony-rotting-barrel | (4,34), (4,36), (7,36) floor — actually clean barrels | 0.8 | Sealed, untainted supplies |
| gluttony-shelf-arch | (5,32) north wall | 0.9 | Holds the lore scroll |
| gluttony-rotten-crate | (6,34) — actually a sealed clean crate | 0.8 | Supply crate, intact |
| gluttony-pantry-chest | (6,36) floor | 0.9 | Hero piece -- treasure chest marks this as a true reward |

**Lighting:** 4x lanterns at corners, color `#aacc44` but intensity 0.7 (brighter, warmer). Clean stone walls reflect light cleanly. No fog. Relief from the organic darkness.
**Platforming:** Flat at elevation 0. No hazards. No enemies. Pure reward room. Guaranteed non-poisoned health pickups.
**Prop density:** 8 assets in 36 cells (0.22 props/cell). Clean stone contrasts sharply with organic horror. The chest hero piece signals genuine reward.

---

### Room: Vorago's Maw (14x14, boss)

**Player Experience:** You descend into a stomach. The walls are pink-red flesh, pulsing faintly. The floor is entirely acid — sickly green, bubbling. A central platform of stone rises above the acid, and crouching on it: Vorago. Immense. Grotesque. Bloated beyond reason. She speaks in a gurgling voice: "Hungry, little goat? Mother will feed you..." In phase 1, she vomits acid that pools on your platform. In phase 2, she shatters the platform into floating chunks that bob on the acid. In phase 3, she inhales — a massive wind pulling everything toward her open mouth. You shoot into the maw that would consume you.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| gluttony-flesh-door-frame | (20,80) north entrance | 1.2 | face-south | Mouth-shaped entry to the stomach |
| gluttony-organic-column | (14,82) and (26,82) flanking entry ledge | 1.0 | Flesh columns framing descent |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| gluttony-lantern-wall-green | (13,81), (26,81), (13,93), (26,93) N/S/E/W high | 1.0 | High-mounted, pulsing pink-red recolor |
| bile-cauldron | (15,81) and (25,81) entry ledge | 1.0 | Bubbling acid at entrance |
| gluttony-rope-tendril | (17,84) and (23,84) ceiling-hung | 1.2 | Organic tendons hanging from ceiling |
| gluttony-slop-bucket | (19,84) central platform | 0.7 | Tipped bile bucket on platform |
| gluttony-stomach-wall-growth | (13,85), (26,85), (13,89), (26,89) walls | 1.0 | Stomach lining growths, pulsing |
| gluttony-acid-pool-edge | Platform edges and entry ledge edges | 0.6 | Corroded stone where acid meets platform |
| gluttony-bile-pool-surface | Full acid floor between structures | 1.2 | Toxic surface detail |
| gluttony-dripping-stalactite | (18,82), (22,82), (20,92) ceiling | 1.0 | Organic stalactites dripping into acid |
| gluttony-meat-carcass | (14,88) and (26,88) wall-hung | 0.9 | Partially digested remains on walls |
| gluttony-maggot-mound | (16,84) and (24,90) small platforms | 0.6 | Organic matter on debris platforms |
| gluttony-mucus-web | (15,86) and (25,86) wall-to-platform bridging | 0.8 | Biological webbing connecting walls to platform |
| gluttony-rope-tendril | (19,88) and (21,88) ceiling-hung over platform | 1.0 | Additional organic tendrils -- the stomach's muscles |
| gluttony-organic-column | (18,85) and (22,85) central platform edges | 0.9 | Structural cover on main platform |

**Lighting:** 4x lanterns high on walls, color `#cc4466` (pink-red, pulsing), intensity 0.6. Acid floor emits `#44ff22`, intensity 0.4, radius covers entire room. Entry ledge lit from above. Central platform catches both acid green underlight and pink-red wall light. Phase 2 (HP<50%): fog 0.06, acid vapor. Phase 3 (HP<25%): fog 0.08, wind pull intensity 0.8 toward boss center, Vorago's breath fogs the room.
**Platforming:** Entry ledge at elevation -1 (N wall, 2 cells deep, wraps wall). Acid floor at -2 (3 DPS). Central platform at -1 (8x6 cells, stable phase 1). Small debris platforms at -1 (2x2 each, at edges with pickups). Phase 2: central platform fragments into 6 chunks (3x3 minimum), bob on staggered timers. Phase 3: wind pull toward boss center (intensity 0.8). Chunks drift and sink/resurface on 3s/5s cycles.
**Prop density:** 17 assets in 196 cells (0.09 props/cell). The Act 1 finale now sells the stomach fantasy: wall growths, mucus webs, dripping stalactites, and organic columns make this unmistakably visceral.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Notes |
|---------|------|----------|-------|
| bile-cauldron | Bile Cauldron | ✅ exists | Feast Hall, Bile Cistern, Gut Arena, Vorago's Maw |
| feast-table | Feast Table | ✅ exists | Feast Hall center |
| gluttony-acid-pool-edge | Acid Pool Edge | ✅ exists | Bile Cistern, Gut Arena, Vorago's Maw |
| gluttony-bile-pool-surface | Bile Pool Surface | ✅ exists | Bile Cistern, Gut Arena, Vorago's Maw |
| gluttony-bloated-arch | Bloated Organic Arch | ✅ exists | All room entrances/exits, Pantry |
| gluttony-bone-plate | Bone Plate | ✅ exists | Feast Hall table settings |
| gluttony-dripping-stalactite | Dripping Stalactite | ✅ exists | Gullet, Feast Hall, Larder, Gut Arena, Vorago's Maw |
| gluttony-flesh-door-frame | Flesh Door Frame | ✅ exists | Gullet constrictions, Feast Hall secret, Vorago's Maw |
| gluttony-fungus-pillar | Fungus-Encrusted Pillar | ✅ exists | Feast Hall, Gut Arena |
| gluttony-lantern-wall-green | Green Wall Lantern | ✅ exists | All rooms -- primary light source |
| gluttony-maggot-mound | Maggot Mound | ✅ exists | Gullet, Gut Arena, Vorago's Maw |
| gluttony-meat-carcass | Hanging Meat Carcass | ✅ exists | Feast Hall, Larder, Vorago's Maw |
| gluttony-mucus-web | Mucus Web | ✅ exists | Gullet, Bile Cistern, Vorago's Maw |
| gluttony-organic-column | Organic Column | ✅ exists | Gut Arena corners, Vorago's Maw platform |
| gluttony-overflowing-goblet | Overflowing Goblet | ✅ exists | Feast Hall, Larder |
| gluttony-pantry-chest | Pantry Chest | ❌ needs creation | Pantry hero piece |
| gluttony-rope-tendril | Rope Tendril | ✅ exists | Gullet, Larder, Vorago's Maw |
| gluttony-rotten-crate | Rotten Crate | ✅ exists | Feast Hall, Larder, Pantry |
| gluttony-rotting-barrel | Rotting Barrel | ✅ exists | Feast Hall, Larder, Bile Cistern |
| gluttony-shelf-arch | Shelf Arch | ✅ exists | Larder, Pantry |
| gluttony-slop-bucket | Slop Bucket | ✅ exists | Gullet, Feast Hall, Gut Arena, Vorago's Maw |
| gluttony-stomach-wall-growth | Stomach Wall Growth | ✅ exists | Gullet, Bile Cistern, Gut Arena, Vorago's Maw |
| gluttony-swollen-cask | Swollen Cask | ✅ exists | Feast Hall SW corner |
| lust-chandelier | Crystal Chandelier (from C2) | ✅ exists | Feast Hall -- reused for warm overhead light |

**Summary:** 24 unique props. 23 have manifests, 1 needs creation (gluttony-pantry-chest).
