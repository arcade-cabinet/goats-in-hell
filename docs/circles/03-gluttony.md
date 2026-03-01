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
- Point lights from Lantern_Wall props (bilious green `#aacc44`, radius 4 cells)
- Acid pools emit `#44ff22` at intensity 0.3, radius 3 cells (toxic glow)
- Feast Hall: warmer overhead light `#ccaa66` from Chandelier — the food looks appetizing
- Boss chamber: pulsing red-pink `#cc4466` from walls, as if the room itself breathes

### Props (from Fantasy Props MegaKit)

| Prop | Placement | Purpose |
|------|-----------|---------|
| Lantern_Wall | Wall-mounted, 2-3 per room | Primary green-tinted light source |
| Barrel_Apples | Floor, Feast Hall table | Food props — abundance |
| Pot_1 | Floor, Feast Hall table | Cooking vessel, feast decoration |
| Pot_Lid | Floor, Feast Hall table | Scattered lids, messy excess |
| SmallBottle, SmallBottles_1 | Floor/table, Feast Hall + Larder | Bottles everywhere — gluttony |
| Barrel | Floor, Larder shelving | Stacked storage |
| Crate_Wooden | Floor, Larder shelving | Stacked storage |
| FarmCrate_Apple | Floor, Larder + Feast Hall | Overflowing food crate |
| Shelf_Arch | Wall-mounted, Larder | Carved shelving in walls |
| Rope_1, Rope_2, Rope_3 | Hanging, Larder | Mark safe paths in vertical room |
| Cauldron | Floor, Feast Hall + Boss | Bubbling vats |
| Mug | Floor/table, Feast Hall | Scattered drinkware |
| Table_Large | Floor, Feast Hall center | The feast table |
| Table_Plate | On table, Feast Hall | Table settings |
| Table_Fork, Table_Knife, Table_Spoon | On table, Feast Hall | Cutlery scattered |
| Bucket_Wooden | Floor, scattered | Slop buckets |
| Scroll_2 | Pedestal, Pantry | Lore delivery |

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
  │              │   ○ = Lantern_Wall
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
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, faces: alternating E/W, `offsetY: 1.5` — green-tinted light
- 2× Bucket_Wooden: floor, in wide sections — slop/bile atmosphere
- 1× Rope_1: hanging from ceiling in narrow section, `offsetY: 2.0` — visual landmark

---

### Room 2: Feast Hall

```
              ↓ N (widens from Gullet)
  ┌──────────────────────────────────┐
  │ ○                            ○   │   Elevation 0
  │                                  │
  │   ☿    ┌══════════════════┐  ☿  │   ☿ = hellgoat (Green), patrol table
  │        │ TABLE_LARGE      │      │   Table runs E-W center
  │   🍎🍺 │ 🍽  🫕  🍽  🍺 │ 🍎  │   🍎=FarmCrate_Apple, 🍺=SmallBottles
  │   ♥  ♥ │  ♥  ◊  ♥  ◊  │ ♥  ♥ │   ♥=health (HALF POISONED!), ◊=ammo
  │        │ 🍽  🫕  🍽  🫕 │      │   🫕=Cauldron, 🍽=Table_Plate+cutlery
  │   ☿    └══════════════════┘  ☿  │
  │                                  │
  │ ○  ☽                       ○   │   ☽ = Chandelier (overhead)
  │                                  │
  └─┬──────────────────┬─────────────┘
    ↓ SW               ↓ S
  (secret:Pantry)    (to Larder)
```

**Dimensions:** 14W × 10H, elevation 0
**Purpose:** The poison mechanic showcase. A grand feast hall with a massive Table_Large running east-west through the center (10 cells long, 2 cells deep). The table is loaded with food props: Barrel_Apples, Pot_1, Pot_Lid, SmallBottles_1, FarmCrate_Apple, Table_Plate, Table_Fork, Table_Knife, Table_Spoon, Mug. Health pickups are scattered on and around the table — **6 total, 3 are poisoned** (50% ratio, seeded random). Ammo pickups are mixed in. Green hellgoats patrol the aisles flanking the table.

The room is well-lit (Chandelier overhead) — the player can see everything clearly. The abundance is the trap. Taking every health pickup is punished. The player must learn to be selective or use the visual tell: safe health pickups glow warm red with a gentle pulse, while poisoned pickups glow sickly green with dripping particle effects. The distinction is subtle in the first room but becomes learnable. A brief tooltip on the first poisoned pickup encounter: *"Not all nourishment is safe."*

**Props:**
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5`
- 1× Chandelier: ceiling center — warm light makes the food look appealing
- 1× Table_Large: floor, (17, 24) to (25, 26), central axis
- 4× Table_Plate: on table surface, evenly spaced
- 4× Table_Fork + 4× Table_Knife + 4× Table_Spoon: on table, place settings
- 2× Cauldron: floor, flanking table ends (16, 25) and (26, 25) — bubbling
- 2× FarmCrate_Apple: floor, NW (14, 21) and NE (25, 21)
- 3× Barrel_Apples: floor, along N wall
- 4× SmallBottles_1: on table and scattered on floor
- 6× Mug: scattered on table and floor — excess, messy, glutton's aftermath

---

### Room 3: Larder

```
              ↓ N (from Feast Hall)
  ┌────────────────────────┐  Elevation 0 (entry)
  │ ○ [SHELF] [SHELF]  ○  │  [SHELF] = Shelf_Arch (wall-mounted)
  │  ▣  ▣  platform   ▣   │  ▣ = Barrel / Crate_Wooden (on shelves)
  │ ════════════════════   │  ════ = platform edge, elev 0
  │         ↓ drop 1       │
  │ ┊   ☿   ┊   gap   ┊   │  Elevation -0.5
  │ ┊ [SHELF]┊ [SHELF] ┊  │  ┊ = Rope_1/2 (hanging, marks safe path)
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
**Purpose:** Vertical descent through a larder carved into organic walls. Five platforms at different elevations (0, -0.5, -1.0, -1.5, -2.0) are connected by drops (no ramps — you jump down, you cannot go back up easily). Shelf_Arch props line the walls at each level, stacked with Barrels and Crate_Wooden. Enemies stand on different shelf levels and fire across the vertical gap at the player as they descend. Ropes (Rope_1, Rope_2, Rope_3) hang between levels — decorative but they visually mark safe landing zones.

Missing a platform edge means falling to the next level (or two levels), taking fall damage. The descent is one-way — commitment to each drop.

**Elevation breakdown:**
- Platform 1 (entry): elevation 0, full width (10 cells)
- Platform 2: elevation -0.5, 8 cells wide (1-cell gap on each side)
- Platform 3: elevation -1.0, 8 cells wide (offset from platform 2)
- Platform 4: elevation -1.5, 6 cells wide (narrowing)
- Platform 5 (bottom/exit): elevation -2.0, full width

**Props:**
- 8× Shelf_Arch: `surfaceAnchor: 'wall'`, faces: E and W alternating, `offsetY: 0.5` per level — 2 per platform level
- 6× Barrel: on shelf surfaces, stacked
- 6× Crate_Wooden: on shelf surfaces, stacked
- 4× FarmCrate_Apple: on shelves, overflowing
- 3× Rope_1: hanging between levels at (17, 37), (20, 40), (19, 43) — safe path markers
- 2× Rope_2: hanging at (22, 38), (21, 42) — alternate paths
- 1× Rope_3: coiled on bottom platform — decoration
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, one per platform level, `offsetY: 1.0`
- 4× SmallBottle: scattered on shelves — bottles rolling off edges

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
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5` — reflected green in acid
- 3× Bucket_Wooden: on walkways, tipped over — bile dripping into acid
- 2× Barrel: on walkway intersections — visual markers for navigation
- 2× Cauldron: floor (on walkways), (16, 52) and (22, 56) — bubbling acid-adjacent

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
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, N/S/E/W, `offsetY: 1.5`
- 4× Bucket_Wooden: on outer ring, one per quadrant — acid is spilling
- 2× Cauldron: on middle ring, N and S bridges — hazard markers

---

### Room 6: Pantry (Secret)

```
  WALL_SECRET entrance from Feast Hall (E wall)
         →
  ┌──────────────┐
  │ ○         ○  │   Clean stone walls (contrast to organic)
  │              │
  │  ▣   📜      │   ▣ = Barrel (safe supplies)
  │              │   📜 = Scroll_2 on Shelf_Small
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
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5`
- 3× Barrel: floor, (4, 34), (4, 36), (7, 36) — clean, sealed
- 1× Shelf_Arch: `surfaceAnchor: 'wall'`, face: N, `offsetY: 1.0` — holds Scroll_2
- 1× Scroll_2: on shelf — lore delivery
- 1× Crate_Wooden: floor, (6, 34) — sealed supply crate

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
- 4× Lantern_Wall: `surfaceAnchor: 'wall'`, N/S/E/W, `offsetY: 2.0` — high-mounted, pulsing pink-red
- 2× Cauldron: on entry ledge, flanking entrance — bubbling acid
- 2× Chain_Coil: hanging from ceiling, (17, 84) and (23, 84) — organic tendon-like
- 1× Bucket_Wooden: on central platform — tipped, bile

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

### Props (non-interactive, summary per room)

| Room | Props |
|------|-------|
| Gullet | 4× Lantern_Wall (walls), 2× Bucket_Wooden (floor), 1× Rope_1 (ceiling) |
| Feast Hall | 4× Lantern_Wall (walls), 1× Chandelier (ceiling), 1× Table_Large, 4× Table_Plate, 12× cutlery (Fork/Knife/Spoon), 2× Cauldron, 2× FarmCrate_Apple, 3× Barrel_Apples, 4× SmallBottles_1, 6× Mug |
| Larder | 4× Lantern_Wall (walls), 8× Shelf_Arch (walls), 6× Barrel, 6× Crate_Wooden, 4× FarmCrate_Apple, 3× Rope_1 + 2× Rope_2 + 1× Rope_3, 4× SmallBottle |
| Bile Cistern | 4× Lantern_Wall (walls), 3× Bucket_Wooden, 2× Barrel, 2× Cauldron |
| Gut Arena | 4× Lantern_Wall (walls), 4× Bucket_Wooden, 2× Cauldron |
| Pantry | 4× Lantern_Wall (walls), 3× Barrel, 1× Shelf_Arch, 1× Scroll_2, 1× Crate_Wooden |
| Vorago's Maw | 4× Lantern_Wall (walls), 2× Cauldron, 2× Chain_Coil (ceiling), 1× Bucket_Wooden |

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
14. At least 8 Fantasy Props visible as GLB instances (Lantern_Wall, Table_Large, Shelf_Arch, Barrel, Cauldron, Rope, etc.)
15. Each room feels distinct: atmosphere (Gullet), trap (Feast Hall), vertical (Larder), navigation (Cistern), arena (Gut), boss (Maw)

---

## What This Is NOT

- NOT a repeat of Circle 2's wind mechanic. Wind appears ONLY in the boss fight phase 3 (Vorago's inhale). The dominant mechanic here is poisoned pickups — trust, not physics.
- NOT stingy with pickups. This circle has MORE health pickups than any other — the trap is that half of them hurt you. Abundance is the theme.
- NOT visually similar to any previous circle. Limbo was gray stone. Lust was warm marble. Gluttony is organic meat-walls and green acid. The palette is completely different.
- NOT a flat layout. The Gullet undulates vertically. The Larder descends 2 full elevations. The Bile Cistern has walkways over a sunken acid floor. The boss room has a raised platform over acid that fragments into floating chunks.
- NOT using Kenney or KayKit assets. Fantasy Props MegaKit + AmbientCG PBR textures only.
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored: atmosphere → trap introduction → vertical challenge → navigation puzzle → arena → boss.
