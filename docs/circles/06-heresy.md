---
title: "Circle 6: Heresy"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 6
sin: defiance
boss: Profano
act: 2
build_script: scripts/build-circle-6.ts
mechanic: illusion-walls
related:
  - docs/circles/00-player-journey.md
  - docs/circles/05-wrath.md
  - docs/agents/level-editor-api.md
---

# Circle 6: Heresy --- Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Identity

**Circle:** 6 (Heresy)
**Sin:** Defiance
**Boss:** Profano --- witch, heretical priestess (Dainir female base + female anatomy)
**Dominant Mechanic:** Illusion walls (WALL_SECRET cells look solid but are walkable; FLOOR_VOID cells look solid but collapse)
**Dante Quote:** *"Suo cimitero da questa parte hanno con Epicuro tutti suoi seguaci..."* (On this side, Epicurus and all his followers have their cemetery...)

**Feel:** You have entered a temple that was once sacred. Every surface remembers holiness but has been inverted. Crosses hang upside-down. Candles burn black. The architecture whispers "trust me" and the architecture lies. Walls you lean on dissolve. Floors you step on vanish. Enemies materialize from nowhere. This circle teaches the player to question everything --- to probe before committing, to distrust the obvious path, and to accept that perception is not reality.

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Cracked marble, once-white now stained gray-yellow | Marble006, Marble014 | Sacred architecture gone wrong |
| Floor (nave/chapel) | Ancient paving stones, worn smooth | PavingStones058, PavingStones072 | Centuries of heretical processions |
| Floor (catacombs) | Rough stone, darker | PavingStones131, Concrete033 | Underground, damp, claustrophobic |
| Columns/arches | Polished marble, veined | Marble003, Marble019 | Remnants of original grandeur |
| Secret walls | Identical to primary walls | Marble006 | Must look indistinguishable |
| Void floors | Identical to adjacent floor | PavingStones058 | Visual trick --- same texture over nothing |
| Boss chamber | Black-and-white checkered tile | Tiles046, Tiles087 | Ritual pentagram pattern |
| Ceiling/vaults | Plaster, crumbling | Plaster001, Plaster005 | Peeling, revealing stone beneath |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Narthex/Nave | 0.03 | `#1a1520` | Light purple haze, incense-like |
| Catacombs | 0.06 | `#120e18` | Thicker, underground claustrophobia |
| Trial Chamber | 0.04 | `#1a1520` | Moderate, arena needs visibility |
| Profano phase 2 (inversion) | 0.10 | `#201020` | Deep magenta fog, disorienting |
| Profano phase 3 (floor collapse) | 0.07 | `#180a20` | Clearing slightly so player can see floor |

### Lighting

- Ambient: `#6633aa` at intensity 0.12 (cold purple, dim, liturgical)
- Point lights from CandleStick_Triple props (pale violet `#aa88ff`, radius 3 cells)
- Torch_Metal in corridors and catacombs (sickly yellow-green `#aacc44`, radius 3 cells --- "black candle" tint)
- No directional light --- underground temple, no natural light
- Boss chamber: five CandleStick_Triple at pentagram points (violet), one Chandelier overhead (flickering, dims during phase transitions)

### Props (from Fantasy Props MegaKit)

| Prop | Placement | Purpose |
|------|-----------|---------|
| CandleStick_Triple | Floor-standing, 2-4 per room | Primary light source, liturgical atmosphere |
| Candle_1, Candle_2 | Wall niches, altar surfaces | Secondary light, "black candle" effect |
| Torch_Metal | Wall-mounted, catacombs and corridors | Navigation aid in dark passages |
| Banner_2 | Wall-mounted, inverted (rotated 180deg) | Inverted crosses, heretical decor |
| Bench | Rows in Nave of Lies | Church pews |
| Cabinet | Confessional booths | Confession booth structure |
| BookStand | Altar in chapel, Library | Holds heretical texts |
| Bookcase_2 | Heretic's Library walls | Forbidden knowledge |
| Book_5, Book_7 | Scattered on floors, shelves | Heretical tomes |
| Scroll_1, Scroll_2 | Pedestals, shelves | Lore delivery |
| Chalice | Altar surfaces | Defiled communion |
| Vase_2, Vase_4 | Floor decoration, alcoves | Funerary urns |
| Chandelier | Boss chamber ceiling | Central light, dramatic effect |
| Chain_Coil | Hanging in Ossuary | Bone-room atmosphere |

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Leaking001-003 | Wall surfaces near ceiling | Water seepage through ancient temple |
| Stain001 | Floor around FLOOR_VOID traps | Subtle discoloration hint (expert players notice) |

### WALL_SECRET Visual Tells

All WALL_SECRET cells in Circle 6 have a subtle visual tell: a faint shimmer effect (slight texture distortion, like heat haze). This shimmer is visible within 4 cells. Additionally, the wall surface color is 5% lighter than adjacent walls --- noticeable on close inspection but not obvious from across a room. These tells are consistent across all rooms so the player can develop pattern recognition.

---

## Room Layout

### Overview (8 rooms)

```
                          ┌───────────┐
                          │  NARTHEX  │  (8x6, exploration, sortOrder=0)
                          │  Spawn *  │  Temple entrance. One WALL_SECRET.
                          └─────┬─────┘
                                | corridor (width=3, arched)
                          ┌─────┴─────┐
                          │  NAVE OF  │  (14x10, exploration, sortOrder=1)
                          │   LIES    │  FLOOR_VOID trap on direct path.
                          │ pew rows  │  Real exit through illusory side wall.
                          └──┬──┬─────┘
                  ┌──────────┘  └──────────┐
            ┌─────┴──────┐           ┌─────┴─────┐
            │CONFESSIONAL│           │ CATACOMBS  │  (10x10, maze, sortOrder=3)
            │   (6x6)    │           │ illusory   │  2 WALL_SECRET shortcuts.
            │ 3 booths   │           │ walls+traps│  2 FLOOR_VOID traps.
            │ sortOrder=2│           └─────┬──────┘
            └─────┬──────┘                 |
                  │ corridor               | corridor (width=2)
                  │ (width=2)        ┌─────┴──────┐
                  └────────┐   ┌─────┤   TRIAL    │  (12x12, arena, sortOrder=4)
                           │   │     │  CHAMBER   │  Elevated judge's bench.
                           │   │     │ 2 waves    │  Illusory walls hide ramp.
                           └───┘     └──┬───┬─────┘
                                        │   └──secret──┐
                              corridor  │         ┌────┴─────┐
                              (width=2) │         │ HERETIC'S│  (6x8, secret, sortOrder=6)
                          ┌─────┴───┐   │         │ LIBRARY  │  WALL_SECRET entrance.
                          │ OSSUARY │   │         │ lore+ammo│  Forbidden knowledge.
                          │  (8x8)  │   │         └──────────┘
                          │ bones   │   │
                          │sortOrd=5│   │
                          └─────┬───┘   │
                                │       │
                          corridor (width=3, merging)
                                │
                          ┌─────┴───────┐
                          │  PROFANO'S  │  (14x14, boss, sortOrder=7)
                          │   CHAPEL    │  Circular ritual space.
                          │  pentagram  │  3 phases of illusion.
                          └─────────────┘
```

### Grid Dimensions

**50 wide x 70 deep** (100 x 140 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Narthex | 21 | 2 | 8 | 6 | exploration | 0 | 0 |
| Nave of Lies | 18 | 12 | 14 | 10 | exploration | 0 | 1 |
| Confessional | 8 | 16 | 6 | 6 | exploration | 0 | 2 |
| Catacombs | 36 | 14 | 10 | 10 | maze | -1 (below) | 3 |
| Trial Chamber | 19 | 32 | 12 | 12 | arena | 0 (bench at +1) | 4 |
| Ossuary | 10 | 40 | 8 | 8 | exploration | -1 (below) | 5 |
| Heretic's Library | 36 | 36 | 6 | 8 | secret | 0 | 6 |
| Profano's Chapel | 18 | 54 | 14 | 14 | boss | 0 | 7 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Narthex | Nave of Lies | corridor | 3 | Arched temple entrance, descending 2 steps |
| Nave of Lies | Confessional | corridor | 2 | West exit, through side aisle |
| Nave of Lies | Catacombs | corridor | 2 | East exit, stairs down (elevation 0 to -1) |
| Confessional | Trial Chamber | corridor | 2 | South, merges with Catacombs path |
| Catacombs | Trial Chamber | corridor | 2 | South, stairs up (elevation -1 to 0) |
| Trial Chamber | Ossuary | corridor | 2 | West, stairs down (elevation 0 to -1) |
| Trial Chamber | Heretic's Library | secret | 2 | WALL_SECRET at east boundary |
| Ossuary | Profano's Chapel | corridor | 3 | South, ascending ramp to boss |

---

## Room Details

### Room 1: Narthex

```
    N (ingress: player spawns here)
    |
    v
  +--------+
  |  V   V |   V = Vase_4 (funerary urns)
  |        |
  | Sc  CS |   Sc = Scroll_2 (inscription), CS = CandleStick_Triple
  |    **  |   ** = player spawn
  |        |
  | CS [S] |   [S] = WALL_SECRET (east wall, leads to shortcut alcove)
  +---DD---+   DD = door south to corridor
      |
      v S (egress: to Nave of Lies)
```

- **Dimensions:** 8w x 6h, elevation 0
- **Feel:** Temple vestibule. Vaulted ceiling (height 4 units). Marble006 walls, PavingStones058 floor. Two funerary urns flanking the entrance. A scroll on a pedestal near the north wall bears heretical text. One CandleStick_Triple provides pale violet light.
- **Critical path WALL_SECRET:** The Narthex FORCES the player through a WALL_SECRET on the critical path. The obvious door ahead is locked (DOOR cell, no key). The only exit is through the east wall, which shimmers faintly when the player is within 3 cells. A torch on the east wall flickers differently from other torches --- its flame bends toward the wall, as if drawn through it. This is the teach: "walls that shimmer are walkable."
- **First secret wall feedback:** When the player walks through their first WALL_SECRET, a brief audio cue plays (a hollow stone echo) and a tooltip appears: "Not all walls are what they seem."
- **WALL_SECRET:** East wall at (28, 5) --- a 2-cell section that looks like solid marble but is walkable. Leads to a small alcove with an ammo pickup, shortcuts to the eastern corridor.
- **3D elements:** Arched ceiling modeled with WALL_STONE above standard height. Two shallow steps (RAMP cells) descend toward the south exit.

### Room 2: Nave of Lies

```
     N (ingress: from Narthex)
     |
     v
  +---DD---------+
  | CS     CS    |   CS = CandleStick_Triple (x4, along walls)
  | BB BB BB BB  |   BB = Bench (pew rows, 4 rows of 4)
  | BB BB BB BB  |
  |      VV      |   VV = FLOOR_VOID trap (center aisle, 3x4 cells)
  | BB BB BB BB  |        Looks like PavingStones058, is nothing
  | BB BB BB BB  |
  | CS     CS    |
  |[S]          D|   [S] = WALL_SECRET (west wall, real path to Confessional)
  |              |   D = door east to Catacombs corridor
  +--------------+
        (no south door --- the "obvious" south exit is FLOOR_VOID)
```

- **Dimensions:** 14w x 10h, elevation 0
- **Feel:** Long church nave. Rows of stone pews (Bench props) line a central aisle. Marble019 columns at intervals support arched ceiling. CandleStick_Triple at four wall positions. The direct path south --- the center aisle --- is a FLOOR_VOID trap (cells 24-26, 17-20). Walking down the obvious center path drops the player into a void pit below (25 damage + teleport back to last safe position).
- **WALL_SECRET:** West wall at (18, 20) --- a 2-cell section. Walking through reveals the corridor to the Confessional. This is the real forward path.
- **FLOOR_VOID trap:** 3 cells wide x 4 cells deep in the center aisle. Covered visually with PavingStones058 texture. First major trust violation. FLOOR_VOID traps deal 25 damage and teleport the player back to the last safe floor position (the cell they were standing on before stepping onto FLOOR_VOID). This is painful but not lethal --- it teaches caution without punishing with a full death-and-reload cycle.
- **FLOOR_VOID visual tell:** The fake floor tiles have a 1-pixel gap at their edges (visible at close range) and do not produce footstep audio when the player is within 2 cells (the sound "drops out" --- absence of echo is the cue).
- **3D elements:** Pew rows create waist-high obstacles. Columns rise to ceiling (height 4 units). Ceiling is vaulted (Plaster001).
- **Enemies:** 2x fireGoat patrol between pew rows (east and west aisles)
- **shadowGoat detection teach:** The first shadowGoat encounter (Nave of Lies) is preceded by a visual cue: a faint cyan shimmer at the edge of the player's vision, accompanied by a whisper audio cue. This teaches the player to watch for shimmer + listen for whispers = invisible enemy nearby. After the first shadowGoat kill, a tooltip: "The pale ones hide in plain sight. Listen for the whisper."

### Room 3: Confessional

```
     N (ingress: from Nave of Lies via WALL_SECRET)
     |
     v
  +--DD--+
  |      |
  | [A]  |   [A] = Cabinet booth A (contains health pickup)
  |      |
  | [B]  |   [B] = Cabinet booth B (contains shadowGoat ambush)
  |      |
  | [C]  |   [C] = Cabinet booth C (back wall is WALL_SECRET = exit)
  |      |
  +------+
      |
      v S (egress: through booth C's WALL_SECRET to corridor)
```

- **Dimensions:** 6w x 6h, elevation 0
- **Feel:** Small chamber with three confessional booths built from Cabinet props, arranged in a column along the west wall. Each booth is a 2x2 cell enclosure with a front opening. The room is dim --- one Candle_2 on the east wall. The player must enter each booth to discover its contents.
- **Booth A (north):** Contains a health pickup on a small shelf.
- **Booth B (center):** Contains a shadowGoat (Gray) that ambushes when the player enters. Tight quarters, point-blank combat.
- **Booth C (south):** The back wall of this booth is WALL_SECRET. Walking through it reveals the corridor south to the Trial Chamber. The actual exit from this room.
- **3D elements:** Booths are elevated 0.5 units on raised stone platforms (FLOOR_RAISED cells). Entering requires stepping up.

### Room 4: Catacombs

```
     N (ingress: from Nave of Lies, stairs down)
     |
     v
  +--DD---------+
  |  .  W  .  . |   . = open corridor (2 cells wide)
  |  .  .  .  W |   W = wall segment
  |  W [S] .  . |   [S] = WALL_SECRET (shortcut)
  |  .  .  W  . |   [V] = FLOOR_VOID (trap)
  |  .  W  .  . |   T = Torch_Metal (safe path... usually)
  | T.  . [V] . |   Tt = Torch_Metal (TRAP --- adjacent floor is VOID)
  |  .  .  .  . |
  |  W  . [S] . |
  |  . [V] .  . |
  |  .  .  W  . |
  | Tt .  .  . T|
  |  .  W  .  . |
  |  .  .  .  . |
  +--------DD---+
              |
              v S (egress: to Trial Chamber, stairs up)
```

- **Dimensions:** 10w x 10h, elevation -1 (below main floor)
- **Feel:** Underground ossuary maze. Low ceiling (height 2.5 units --- claustrophobic). PavingStones131 floor, Concrete033 walls. The Catacombs contain exactly 2 WALL_SECRET shortcuts and 2 FLOOR_VOID traps (reduced from 3 of each). The maze paths are wider (3 cells, not 2) to prevent frustration. A torch marks each safe path intersection --- torches on trap paths are extinguished (dark = danger, lit = safe). The maximum time to navigate without finding shortcuts is 45 seconds.
- **WALL_SECRET locations:** Two illusory walls create shortcuts through the maze --- at (39, 17) and (44, 22). Experienced players who test walls find faster routes.
- **FLOOR_VOID traps:** Two trap floor sections at (44, 20) and (40, 23) (2x1 cells each). Same texture as surrounding floor. Falling deals 25 damage + teleport to last safe position.
- **Safe path markers:** Torches mark safe path intersections. Trap paths have no torches (extinguished) --- dark = danger, lit = safe.
- **3D elements:** Ceiling drops to 2.5 units (versus 4 units in temple rooms above). Some corridors step down another 0.5 units via RAMP cells. Vase_2 and Vase_4 props at dead ends (funerary urns).
- **Enemies:** 3x shadowGoat roam the corridors. Semi-invisible until 4 cells away. In the wider passages, encounters are sudden but survivable.

### Room 5: Trial Chamber

```
     N (ingress: from Confessional/Catacombs corridors)
     |
     v
  +--DD---------+
  |              |
  | CS        CS |   CS = CandleStick_Triple
  |              |
  |  +-bench-+   |   bench = elevated judge's platform (elev +1)
  |  | BB BB |   |   BB = Bench (judge seating)
  |  | BS    |   |   BS = BookStand (judge's podium)
  |  +--[S]--+   |   [S] = WALL_SECRET (back of bench, hides ramp)
  |     RAMP     |   RAMP = hidden ramp up to bench (behind illusory wall)
  |              |
  | spawn zone   |   Enemy spawn zone (ground level, elev 0)
  |  (floor)     |
  | CS        CS |
  |              |
  +D---------[S]+   D = door west to Ossuary
       |         [S] = WALL_SECRET east to Heretic's Library
       v S (egress: to Ossuary)
```

- **Dimensions:** 12w x 12h, elevation 0 (judge's bench at elevation +1)
- **Feel:** Church courtroom. The north half contains an elevated stone platform (FLOOR_RAISED, +1 elevation) serving as the judge's bench. Two Bench props and a BookStand form the judicial furniture. The south half is the open floor where the accused (player) stands. Four CandleStick_Triple provide violet light from the corners. Marble006 walls, PavingStones072 floor.
- **Arena mechanic:** Doors lock on entry (trigger T4). Wave 1: 3x fireGoat spawn on the elevated bench and fire downward. The player must find the WALL_SECRET at the back of the bench platform (center of the bench's south face) to access the hidden RAMP behind it, climbing to bench level to engage. Wave 2: 2x shadowGoat + 2x fireGoat. The shadowGoats walk THROUGH the illusory wall segments in the room, flanking the player from unexpected angles.
- **WALL_SECRET locations:** Back of bench platform at (25, 37) --- reveals ramp. East wall at (30, 43) --- leads to Heretic's Library.
- **3D elements:** Judge's bench is a 6x3 platform at elevation +1 (2 world units above floor). RAMP cells connect floor level to bench behind the illusory wall. Stone railings (WALL_STONE, half-height) border the platform edges.

### Room 6: Ossuary

```
     N (ingress: from Trial Chamber, stairs down)
     |
     v
  +--DD------+
  |  CC  CC  |   CC = Chain_Coil (hanging from ceiling)
  |          |
  | V4    V4 |   V4 = Vase_4 (bone urns, large)
  |    CC    |
  |  V2  V2 |   V2 = Vase_2 (bone urns, small)
  |          |
  | CC    CC |
  +----DD----+
       |
       v S (egress: to Profano's Chapel, ascending ramp)
```

- **Dimensions:** 8w x 8h, elevation -1 (below main floor)
- **Feel:** Bone storage chamber. The walls are lined with skeletal remains (structural texture: Concrete033 with Marble014 accents suggesting embedded bones). Chain_Coil props hang from the ceiling at five points, creating a curtain effect. Vase_2 and Vase_4 props scattered as funerary urns. The room is transitional --- a breath before the boss.
- **Enemies:** 2x shadowGoat lurk among the hanging chains, using the visual clutter for concealment.
- **3D elements:** Ceiling has exposed beam structures (WALL_STONE strips at height 3 units) from which Chain_Coil props hang. Floor is uneven --- some sections at -1, others at -0.5 (RAMP transitions). A shallow pit in the center (2x2, -1.5 elevation) contains bone prop clusters.

### Room 7: Heretic's Library (Secret)

```
     N
     |
  +--[S]--+   [S] = WALL_SECRET entrance (from Trial Chamber east wall)
  |        |
  | BC  BC |   BC = Bookcase_2 (tall, against walls)
  |        |
  | BS     |   BS = BookStand (central reading podium)
  | B5  B7 |   B5/B7 = Book_5, Book_7 (scattered on floor)
  |        |
  | SC  SC |   SC = Scroll_1, Scroll_2 (lore scrolls on shelves)
  |        |
  +--------+
```

- **Dimensions:** 6w x 8h, elevation 0
- **Feel:** Hidden forbidden library. Accessed only through WALL_SECRET in the Trial Chamber's east wall. Bookcase_2 props line all walls. A central BookStand holds a glowing scroll (lore delivery). Books and scrolls scattered across the floor suggest frantic study. One CandleStick_Triple provides dim violet light. Marble003 walls (polished, scholarly), PavingStones058 floor.
- **Contents:** Ammo x2 (on shelves), health x1 (on reading podium). Scroll_1 contains lore text about Profano's origin. This room rewards exploration and mastery of the illusion mechanic.
- **3D elements:** Bookcase_2 props rise to near-ceiling height (3.5 units). A small raised reading platform (FLOOR_RAISED, +0.5) holds the BookStand.

### Room 8: Profano's Chapel

```
     N (ingress: from Ossuary, ascending ramp)
     |
     v
  +----DDD--------+
  |   CS       CS  |   CS = CandleStick_Triple (5 total, pentagram points)
  |                |
  |     CS         |
  |        /----\  |   Pentagram floor pattern (Tiles046/087 inlay)
  |       /  BS  \ |   BS = BookStand (altar, center)
  |  CS  |  *P*  | |   *P* = Profano spawn position (center)
  |       \      / |
  |        \----/  |
  |     CS         |
  |                |
  |  CH            |   CH = Chandelier (ceiling, center)
  |                |
  |  a1  a2    a3  |   a1/a2/a3 = ammo pickup positions (edges)
  |  h1        h2  |   h1/h2 = health pickup positions (corners)
  +----------------+
```

- **Dimensions:** 14w x 14h, elevation 0
- **Feel:** Circular ritual space (rendered as 14x14 square with rounded corners via wall placement). The floor is inlaid with a pentagram pattern using Tiles046 (black) and Tiles087 (white checkered). Five CandleStick_Triple stand at the pentagram's points, burning violet. A BookStand serves as the central altar. Chandelier hangs from the vaulted ceiling (height 5 units). Marble014 walls, Plaster005 ceiling.
- **Boss phases:**
  - **Phase 1 (100%-60% HP) --- Illusion Copies:** Profano creates 3 illusory copies of herself. All four figures move around the pentagram. Only the REAL Profano fires projectiles that deal damage. Hitting a fake copy causes it to shatter (particle effect) and reform 5 seconds later. Player must observe which copy actually fires projectiles (fake copies animate casting but emit no projectile). The room is large enough (14x14) for the four figures to spread out. The 3 illusion copies are translucent (80% opacity vs 100% for the real Profano). At a glance, this is not obvious --- the player must look carefully. The REAL Profano is the only one whose projectiles produce impact effects (sparks on hit). The copies' projectiles pass through walls and deal 0 damage --- they are visual noise. A tooltip appears 5 seconds into Phase 1 if no illusion has been hit: "Only one is real. Watch for the sparks."
  - **Phase 2 (60%-30% HP) --- Inversion:** Camera effect rotates the view 180 degrees on the Z-axis (upside-down rendering). Movement controls invert for 5 seconds, then normalize, then invert again on a 10-second cycle. Profano becomes more aggressive --- faster projectiles, shorter intervals. Fog density surges to 0.10. The disorientation is the real enemy.
  - **Phase 3 (30%-0% HP) --- Collapsing Floor:** Random 2x2 tile sections of the floor become FLOOR_VOID for 3 seconds, then reform. Up to 4 sections void simultaneously. Profano hovers (immune to floor collapse). The pentagram's center remains stable --- the altar is safe ground. The edges of the room are unreliable. Player must fight while managing shrinking floor space.
- **3D elements:** Vaulted ceiling at 5 units. Pentagram is a floor-level inlay (no elevation change). The altar (BookStand) sits on a 2x2 FLOOR_RAISED platform (+0.5 elevation) at center. The five CandleStick_Triple sit on small circular stone pedestals (+0.25 elevation).

---

## Entities

### Enemies (16 total + boss)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Nave of Lies | fireGoat | 2 | Patrol pew aisles (east/west lanes) | Crimson |
| Confessional | shadowGoat | 1 | Ambush in booth B (trigger on entry) | Gray, cyan eyes |
| Catacombs | shadowGoat | 3 | Roam maze corridors, semi-invisible | Gray, cyan eyes |
| Trial Chamber wave 1 | fireGoat | 3 | Spawn on elevated bench, fire downward | Crimson |
| Trial Chamber wave 2 | shadowGoat | 2 | Flank through WALL_SECRET segments | Gray, cyan eyes |
| Trial Chamber wave 2 | fireGoat | 2 | Spawn on bench, covering fire | Crimson |
| Ossuary | shadowGoat | 2 | Lurk among hanging chains | Gray, cyan eyes |
| Profano's Chapel (pre-boss) | shadowGoat | 1 | Guard chapel entrance | Gray, cyan eyes |
| Profano's Chapel | Profano | 1 | Boss AI, 3 phases | boss-profano.glb |

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Narthex | ammo | (28, 5) | Behind WALL_SECRET alcove |
| Nave of Lies | health | (22, 14) | West aisle, near WALL_SECRET exit |
| Confessional | health | (10, 17) | Inside booth A |
| Catacombs | ammo | (40, 16) | Near first WALL_SECRET shortcut |
| Catacombs | health | (45, 25) | Deep in maze, dead end |
| Trial Chamber | ammo | (23, 36) | Center floor, between waves |
| Trial Chamber | health | (27, 40) | South, near exit |
| Heretic's Library | ammo x2 | (38, 39), (40, 41) | On bookshelves |
| Heretic's Library | health | (38, 41) | On reading podium |
| Profano's Chapel | ammo x3 | (20, 64), (25, 64), (30, 64) | South edge of room |
| Profano's Chapel | health x2 | (19, 55), (31, 55) | NW and NE corners |

### Props (non-interactive, per room)

| Room | Props | surfaceAnchor Details |
|------|-------|-----------------------|
| Narthex | 2x Vase_4 (floor, flanking entrance), 1x Scroll_2 (pedestal), 1x CandleStick_Triple (floor), 1x Banner_2 (wall, inverted) | Banner_2: north wall, face=S, offsetY=2.5 |
| Nave of Lies | 16x Bench (floor, 4 rows of 4), 4x CandleStick_Triple (floor, corners), 4x Banner_2 (walls, inverted) | Banner_2: 2x east wall face=W, 2x west wall face=E, offsetY=2.8 |
| Confessional | 3x Cabinet (floor, forming booths), 1x Candle_2 (wall) | Candle_2: east wall, face=W, offsetY=1.5 |
| Catacombs | 3x Torch_Metal (walls, safe path intersections --- lit), 2x Torch_Metal (wall, trap paths --- extinguished/dark), 4x Vase_2 (floor, dead ends), 3x Vase_4 (floor, intersections) | Torch_Metal: face=corridor, offsetY=2.0 |
| Trial Chamber | 2x Bench (elevated bench), 1x BookStand (bench podium), 4x CandleStick_Triple (floor, corners) | none (all floor-standing) |
| Ossuary | 5x Chain_Coil (ceiling-hung), 4x Vase_2 (floor), 2x Vase_4 (floor) | Chain_Coil: ceiling mount, offsetY=-0.5 (hanging) |
| Heretic's Library | 4x Bookcase_2 (walls), 1x BookStand (center), 3x Book_5 (floor), 2x Book_7 (floor), 2x Scroll_1 (shelves), 1x CandleStick_Triple (floor) | Bookcase_2: against walls, face=room center |
| Profano's Chapel | 5x CandleStick_Triple (floor, pentagram points), 1x BookStand (center altar), 1x Chandelier (ceiling), 2x Chalice (altar surface), 2x Banner_2 (walls, inverted) | Chandelier: ceiling, offsetY=-1.0; Banner_2: north wall face=S, south wall face=N, offsetY=3.0 |

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Nave of Lies | (23, 17, 3, 4) | `floorCollapse` | `once: true` | `{ cells: [{x:24,z:17},{x:24,z:18},{x:25,z:18},{x:25,z:19},{x:24,z:19},{x:24,z:20}], damage: 25 }` |
| T2 | Confessional | (9, 18, 2, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'shadowGoat', count:1, position:{x:10,z:18}}] }` |
| T3 | Catacombs | (37, 14, 10, 2) | `ambientChange` | `once: true` | `{ fogDensity: 0.06, fogColor: '#120e18' }` |
| T4 | Trial Chamber | (21, 34, 8, 4) | `lockDoors` | `once: true` | --- |
| T5 | Trial Chamber | (21, 34, 8, 4) | `spawnWave` | `once: true` | `{ enemies: [{type:'fireGoat', count:3, elevation:1}] }` |
| T6 | Trial Chamber | --- | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'shadowGoat', count:2}, {type:'fireGoat', count:2, elevation:1}] }` |
| T7 | Trial Chamber | --- | `unlockDoors` | On wave 2 clear | --- |
| T8 | Profano's Chapel | (20, 55, 10, 3) | `bossIntro` | `once: true` | `{ text: "Truth is the first heresy. I am its priestess." }` |
| T9 | Profano's Chapel | (20, 55, 10, 3) | `lockDoors` | `once: true, delay: 3` | --- |
| T10 | Profano's Chapel | --- | `bossPhase` | Boss HP < 60% | `{ phase: 2, effect: 'cameraInvert', fogDensity: 0.10, fogColor: '#201020' }` |
| T11 | Profano's Chapel | --- | `bossPhase` | Boss HP < 30% | `{ phase: 3, effect: 'floorCollapse', collapseInterval: 4000, collapseCount: 4, collapseDuration: 3000 }` |

---

## Environment Zones

| Zone | Type | Bounds (x,z,w,h) | Intensity | Notes |
|------|------|-------------------|-----------|-------|
| Temple fog | `fog` | Full level (0,0,50,70) | 0.3 | Baseline incense haze |
| Catacombs darkness | `fog` | Catacombs room (36,14,10,10) | 0.6 | Thicker underground fog |
| Nave void trap | `damage` | FLOOR_VOID cells (23,17,3,4) | 25 (instant) | Fall damage on void contact, teleport to last safe position |
| Catacomb void trap 1 | `damage` | (44,20,2,1) | 25 (instant) | Fall damage, teleport to last safe position |
| Catacomb void trap 2 | `damage` | (40,23,2,1) | 25 (instant) | Fall damage, teleport to last safe position |
| Chapel pentagram | `visual` | (22,58,6,6) | 1.0 | Purple particle effect on pentagram lines |

---

## Player Spawn

- **Position:** (25, 5) --- center of Narthex
- **Facing:** pi (south --- facing toward Nave of Lies)

---

## Theme Configuration

```typescript
editor.createTheme('circle-6-heresy', {
  name: 'heresy',
  displayName: 'HERESY --- The Circle of Defiance',
  primaryWall: MapCell.WALL_STONE,
  accentWalls: [MapCell.WALL_SECRET, MapCell.WALL_OBSIDIAN],
  floorTypes: [MapCell.FLOOR_RAISED, MapCell.FLOOR_VOID],
  fogDensity: 0.03,
  fogColor: '#1a1520',
  ambientColor: '#6633aa',
  ambientIntensity: 0.12,
  skyColor: '#080010',
  particleEffect: 'incense',             // Slow-drifting violet particles
  enemyTypes: ['shadowGoat', 'fireGoat'],
  enemyDensity: 1.0,                     // Standard density
  pickupDensity: 0.7,                    // Moderate --- rewards exploration
  specialMechanic: 'illusion',           // WALL_SECRET and FLOOR_VOID traps
  secretWallDensity: 0.15,              // 15% of eligible walls are illusory
  voidFloorDensity: 0.08,              // 8% of floor tiles are traps
});
```

---

## Narrative Beats

1. **Narthex inscription (Scroll_2):** *"The faithful entered here. The faithful were wrong."* --- establishes the heretical inversion of sacred space.
2. **Nave of Lies floor collapse:** Player walks the center aisle expecting a normal path, falls through FLOOR_VOID. The message: in this circle, the obvious path is the trap.
3. **Confessional discovery:** Three booths, three outcomes. The player learns that investigation (not aggression) is the survival tool here.
4. **Catacombs torchlight betrayal:** Player follows torch-lit paths, discovers one torch marks a FLOOR_VOID trap. Even guidance cannot be trusted.
5. **Trial Chamber revelation:** Enemies fire from the elevated bench. The player must discover the WALL_SECRET ramp --- the illusory wall mechanic used as a tool, not just a trap.
6. **Heretic's Library lore (Scroll_1):** *"Profano was the temple's high priestess. She did not fall from faith --- she saw through it. The veil between real and false is her domain. To fight her, you must see what is."* --- prepares the player for the boss mechanic.
7. **Boss intro:** Profano speaks from the altar: *"Truth is the first heresy. I am its priestess. Look upon me --- which of me is real?"*
8. **Boss defeat:** Profano's illusions shatter. The pentagram cracks. The floor stabilizes. She whispers: *"You chose correctly. That is the true sin."* The way down opens --- a chasm through the broken pentagram floor. Title card: *"CIRCLE THE SEVENTH --- VIOLENCE"*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter --- renders in LevelMeshes.tsx with Marble/PavingStones PBR materials
2. All 8 rooms are reachable from spawn (DAG validation passes; Heretic's Library reachable via WALL_SECRET)
3. WALL_SECRET mechanic works --- player can walk through illusory walls; walls render identically to solid walls
4. FLOOR_VOID mechanic works --- player falls through trap floors; floors render identically to solid floors
5. shadowGoat enemies render with semi-transparency, becoming visible within 4 cells (8 world units)
6. Profano boss fight executes all 3 phases (illusion copies, camera inversion, floor collapse)
7. PlaytestRunner AI can navigate from spawn to boss, discovering at least one WALL_SECRET path
8. PBR materials from AmbientCG render on walls/floors (Marble006/014, PavingStones058/072/131)
9. At least 5 Fantasy Props visible as GLB instances (CandleStick_Triple, Banner_2, Bench, Cabinet, BookStand)
10. Each room feels distinct --- Narthex (vestibule calm), Nave (betrayal), Confessional (choice), Catacombs (maze panic), Trial (vertical combat), Ossuary (dread), Library (reward), Chapel (ritual climax)

---

## What This Is NOT

- NOT a standard dungeon crawl. The illusion mechanic means the MAP ITSELF is unreliable. Players must develop a "probe-first" playstyle.
- NOT using procedural illusory wall placement. Every WALL_SECRET and FLOOR_VOID is hand-placed for specific design intent.
- NOT a puzzle game. The illusions create tension and surprise, not logic puzzles. The player never needs to "solve" anything --- they need to test everything.
- NOT using Kenney or KayKit assets. Fantasy Props MegaKit + AmbientCG PBR textures only.
- NOT the same layout philosophy as Limbo. Limbo had 6 rooms in a mostly linear chain. Heresy has 8 rooms with branching paths, a maze, and a secret room --- reflecting the theme of deception and hidden truth.

---

## 3D Spatial Design

### Room: Narthex (8x6, exploration)

**Player Experience:** You enter a temple vestibule. The ceiling vaults upward, marble walls close around you in quiet reverence. Two funerary urns flank the entrance like guardians of the dead. A scroll rests on a pedestal near the north wall, its text unsettling. A single candelabra provides pale violet light. The door ahead is locked. The east wall shimmers faintly when you approach it -- a torch on that wall flickers differently, its flame bending toward the stone as if drawn through it. You walk into the wall and pass through. The circle has taught you its first lesson.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| heresy-desecrated-arch | (25, 2) north entrance | 0.9 | face-south | Temple entrance frame |
| heresy-desecrated-arch | (25, 7) south door (locked) | 0.9 | face-south | Visible but locked exit |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-bone-urn | (22, 3) flanking entrance west | 0.8 | Funerary urn, atmosphere |
| heresy-bone-urn | (28, 3) flanking entrance east | 0.8 | Funerary urn, atmosphere |
| heresy-torn-scripture-slab | (24, 3) pedestal near north wall | 0.7 | Heretical inscription text |
| inverted-cross | (26, 4) near east WALL_SECRET | 0.6 | Marks the heretical zone |

**Lighting:**
- 1x CandleStick_Triple: (26, 5) floor-standing -- pale violet `#aa88ff`, radius 3 cells
- 1x Torch_Metal: (28, 5) east wall near WALL_SECRET -- sickly yellow-green `#aacc44`, radius 3 cells (flame bends toward wall, teach cue)

**Platforming:** Flat, elevation 0. Vaulted ceiling at height 4 units. Two shallow steps (RAMP cells) descend toward the south exit. WALL_SECRET at east wall (28, 5): 2-cell walkable section.

---

### Room: Nave of Lies (14x10, exploration)

**Player Experience:** A long church nave stretches before you. Stone pews line the central aisle in neat rows. Candelabras burn violet at the four corners. Inverted banners hang from the walls. The center aisle is the obvious path forward -- it is also a lie. Three cells wide, four cells deep, the floor is FLOOR_VOID: same texture as real stone, but nothing beneath. Walk the obvious path and you fall, taking 25 damage before teleporting back to safety. The real exit is a WALL_SECRET on the west wall. The lesson deepens: in this circle, the direct path is the trap.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| heresy-cracked-marble-pillar | (20, 13) NW column | 1.0 | none | Nave structural column |
| heresy-cracked-marble-pillar | (30, 13) NE column | 1.0 | none | Nave structural column |
| heresy-cracked-marble-pillar | (20, 19) SW column | 1.0 | none | Nave structural column |
| heresy-cracked-marble-pillar | (30, 19) SE column | 1.0 | none | Nave structural column |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-church-pew | 16 positions, 4 rows of 4 | 0.8 | Church pew seating rows |
| inverted-cross | (18, 14) west wall | 0.7 | Inverted banner, heretical decor |
| inverted-cross | (32, 14) east wall | 0.7 | Inverted banner, heretical decor |
| inverted-cross | (18, 19) west wall | 0.7 | Inverted banner, heretical decor |
| inverted-cross | (32, 19) east wall | 0.7 | Inverted banner, heretical decor |
| heresy-profane-symbol | (25, 12) north wall center | 0.8 | Profane medallion above entry |
| heresy-shattered-icon | (22, 21) near south wall | 0.5 | Broken statue debris, lore |

**Lighting:**
- 4x CandleStick_Triple: (19, 13) NW, (31, 13) NE, (19, 21) SW, (31, 21) SE -- pale violet `#aa88ff`, radius 3 cells
- FLOOR_VOID zone (24-26, 17-20): no light from below, darkness beneath the illusion

**Platforming:** Flat, elevation 0. FLOOR_VOID trap: 3 cells wide x 4 cells deep in center aisle (24-26, 17-20). Covered with PavingStones058 texture. Falls deal 25 damage + teleport to last safe position. WALL_SECRET at west wall (18, 20): 2-cell walkable section, real exit.

---

### Room: Confessional (6x6, exploration)

**Player Experience:** A small dim chamber with three confessional booths along the west wall, each a wooden enclosure with an opening. The room is lit by a single candle on the east wall. You must enter each booth to discover what it holds. Booth A: a health pickup on a shelf. Booth B: a shadowGoat lunges from the darkness, point-blank. Booth C: the back wall yields when you press against it -- another WALL_SECRET, the real exit southward. Three booths, three outcomes. Investigation, not aggression.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-confessional-booth | (9, 17) booth A, north | 0.9 | Confessional with health inside |
| heresy-confessional-booth | (9, 18) booth B, center | 0.9 | Confessional with shadowGoat ambush |
| heresy-confessional-booth | (9, 19) booth C, south | 0.9 | Confessional with WALL_SECRET exit |
| heresy-catacomb-torch | (13, 18) east wall candle | 0.6 | Single dim light source |

**Lighting:**
- 1x Candle_2: (13, 18) east wall -- sickly yellow-green `#aacc44`, radius 2 cells, intensity 0.4 (deliberately dim)

**Platforming:** Flat, elevation 0. Booths are on raised stone platforms (FLOOR_RAISED, +0.5). Stepping up into booths. WALL_SECRET at booth C back wall.

---

### Room: Catacombs (10x10, maze)

**Player Experience:** The stairs descend into darkness. The ceiling drops to claustrophobic height. The air is damp, cold, tinged with decay. Maze corridors branch in every direction. Torches mark safe intersections -- the lit paths. But one torch marks a FLOOR_VOID trap. Even guidance cannot be trusted. ShadowGoats roam the corridors, semi-invisible until four cells away. Funerary urns line dead ends. Two WALL_SECRET shortcuts exist for players who test walls. The maximum navigation time is 45 seconds.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-bone-urn | (37, 18) dead end NW | 0.6 | Funerary urn, dead end marker |
| heresy-bone-urn | (45, 17) dead end NE | 0.6 | Funerary urn, dead end marker |
| heresy-bone-urn | (38, 22) dead end center | 0.6 | Funerary urn, intersection |
| heresy-bone-urn | (43, 23) dead end SE | 0.6 | Funerary urn, dead end marker |
| heresy-catacomb-torch | (37, 16) safe intersection 1 | 0.7 | Safe path marker (lit) |
| heresy-catacomb-torch | (42, 18) safe intersection 2 | 0.7 | Safe path marker (lit) |
| heresy-catacomb-torch | (45, 23) safe intersection 3 | 0.7 | Safe path marker (lit) |
| heresy-catacomb-torch | (38, 20) TRAP path torch | 0.7 | Extinguished (dark = danger) |
| heresy-catacomb-torch | (43, 21) TRAP path torch | 0.7 | Extinguished (dark = danger) |
| heresy-corrupted-reliquary | (40, 20) maze niche | 0.5 | Atmosphere, lore object |

**Lighting:**
- 3x Torch_Metal (lit): safe intersections -- sickly yellow-green `#aacc44`, radius 3 cells
- 2x Torch_Metal (extinguished): trap path intersections -- no light (dark = danger)
- Fog density 0.06, color `#120e18` -- thicker underground claustrophobia

**Platforming:** Elevation -1 (below main floor). Ceiling drops to 2.5 units. Maze paths are 3 cells wide. WALL_SECRET shortcuts at (39, 17) and (44, 22). FLOOR_VOID traps at (44, 20) and (40, 23), 2x1 cells each. Some corridors step down another 0.5 via RAMP cells.

---

### Room: Trial Chamber (12x12, arena)

**Player Experience:** A church courtroom. The north half holds an elevated stone platform -- the judge's bench, rising a full level above the floor. Benches and a bookstand form the judicial furniture up there. FireGoats spawn on the bench and fire downward at you. The doors lock. You need to get up there, but there is no visible ramp. The back of the bench platform shimmers when you approach -- a WALL_SECRET hides the ramp. The illusion mechanic becomes your tool, not just your enemy. Wave 2 adds shadowGoats who walk through the illusory walls to flank you from impossible angles.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| heresy-cracked-marble-pillar | (20, 33) NW | 0.9 | none | Arena column |
| heresy-cracked-marble-pillar | (30, 33) NE | 0.9 | none | Arena column |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-church-pew | (23, 35) bench seating left | 0.7 | Judge's bench furniture |
| heresy-church-pew | (27, 35) bench seating right | 0.7 | Judge's bench furniture |
| heretic-tome | (25, 35) judge's podium | 0.8 | BookStand at judge's position |
| heresy-broken-stained-glass | (20, 38) west wall | 0.8 | Atmosphere, broken sacred art |
| heresy-broken-stained-glass | (30, 38) east wall | 0.8 | Atmosphere, broken sacred art |
| heresy-toppled-altar | (23, 42) south floor | 0.6 | Toppled stone, cover |

**Lighting:**
- 4x CandleStick_Triple: (20, 33) NW, (30, 33) NE, (20, 43) SW, (30, 43) SE -- pale violet `#aa88ff`, radius 3 cells
- Bench platform elevated light: slightly brighter at elevation +1

**Platforming:** Ground floor at elevation 0. Judge's bench is a 6x3 platform at elevation +1 (2 world units above floor). WALL_SECRET at (25, 37) -- back of bench, reveals RAMP connecting floor to bench level. Stone railings (half-height WALL_STONE) border platform edges. WALL_SECRET at east wall (30, 43) leads to Heretic's Library.

---

### Room: Ossuary (8x8, exploration)

**Player Experience:** You descend into a bone storage chamber. The walls suggest embedded skeletal remains beneath crumbling plaster. Chains hang from the ceiling at five points, creating a curtain that obscures your sight lines. Funerary urns scatter the floor. Two shadowGoats lurk among the hanging chains, using the visual clutter to conceal themselves until they are almost on top of you. This room is a breath of dread before the boss -- transitional, atmospheric, a reminder that what was once sacred has been thoroughly defiled.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-bone-urn | (12, 42) NW | 0.7 | Funerary urn, atmosphere |
| heresy-bone-urn | (16, 42) NE | 0.7 | Funerary urn, atmosphere |
| heresy-bone-urn | (11, 45) west | 0.6 | Smaller urn, variety |
| heresy-bone-urn | (17, 45) east | 0.6 | Smaller urn, variety |
| wrath-chain-curtain | (12, 41) ceiling hang 1 | 0.8 | Chain curtain, visual clutter |
| wrath-chain-curtain | (16, 41) ceiling hang 2 | 0.8 | Chain curtain, concealment |
| wrath-chain-curtain | (14, 43) ceiling hang 3 center | 0.9 | Chain curtain, central |
| wrath-chain-curtain | (12, 46) ceiling hang 4 | 0.8 | Chain curtain, concealment |
| wrath-chain-curtain | (16, 46) ceiling hang 5 | 0.8 | Chain curtain, concealment |
| heresy-corrupted-reliquary | (14, 44) center floor | 0.6 | Corrupted container, lore |

**Lighting:**
- 2x Torch_Metal: (11, 41) west wall, (17, 41) east wall -- sickly yellow-green `#aacc44`, radius 3 cells
- Dim ambient: `#6633aa` at 0.08 -- very low, chains cast deep shadows

**Platforming:** Elevation -1 (below main floor). Floor is uneven -- sections at -1 and -0.5 with RAMP transitions. Shallow pit in center (2x2, -1.5 elevation) with bone clusters. Exposed ceiling beams at height 3 units.

---

### Room: Heretic's Library (6x8, secret)

**Player Experience:** You step through the illusory wall into a hidden library of forbidden knowledge. Bookcases line every wall, stuffed with ancient leather-bound volumes. Some books are chained to their shelves. A central reading podium holds a glowing scroll. Books and scrolls litter the floor as if someone searched frantically through every text. One candelabra provides dim violet light. The scroll on the podium tells you about Profano -- who she was, what she saw through, why her domain is illusion. Ammo and health sit on shelves. This room rewards mastery of the mechanic that brought you here.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-forbidden-bookcase | (37, 37) north wall | 1.0 | Tall bookcase, forbidden texts |
| heresy-forbidden-bookcase | (41, 37) north wall | 1.0 | Tall bookcase, forbidden texts |
| heresy-forbidden-bookcase | (36, 40) west wall | 1.0 | Tall bookcase, wall-lining |
| heresy-forbidden-bookcase | (42, 40) east wall | 1.0 | Tall bookcase, wall-lining |
| heretic-tome | (39, 40) center reading podium | 0.9 | Central BookStand, lore delivery |
| heresy-torn-scripture-slab | (38, 42) floor, scattered | 0.4 | Scattered scripture fragment |
| heresy-torn-scripture-slab | (40, 43) floor, scattered | 0.4 | Scattered scripture fragment |

**Lighting:**
- 1x CandleStick_Triple: (39, 39) floor center -- pale violet `#aa88ff`, radius 3 cells, intensity 0.5

**Platforming:** Flat, elevation 0. Bookcase props rise to 3.5 units. Small raised reading platform (FLOOR_RAISED, +0.5) holds the BookStand at center. WALL_SECRET entrance from Trial Chamber east wall.

---

### Room: Profano's Chapel (14x14, boss)

**Player Experience:** You ascend into a ritual space that remembers holiness but has been utterly inverted. The floor is inlaid with a pentagram pattern in black and white tile. Five candelabras burn violet at each point of the star. A chandelier hangs from the vaulted ceiling, flickering. At the center altar, Profano stands -- witch, priestess, heretic. She speaks: "Truth is the first heresy. I am its priestess. Look upon me -- which of me is real?" Three copies of herself shimmer into existence. Phase 1: find the real one. Phase 2: your world turns upside down, literally. Phase 3: the floor begins to vanish beneath your feet.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| heresy-desecrated-arch | (25, 54) north entrance | 1.0 | face-south | Chapel entrance |
| heresy-cracked-marble-pillar | (19, 56) NW column | 0.9 | none | Chapel column |
| heresy-cracked-marble-pillar | (31, 56) NE column | 0.9 | none | Chapel column |
| heresy-cracked-marble-pillar | (19, 66) SW column | 0.9 | none | Chapel column |
| heresy-cracked-marble-pillar | (31, 66) SE column | 0.9 | none | Chapel column |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| heresy-pentagram-floor-tile | (22, 58) - (28, 64) center floor | 1.5 | Pentagram floor inlay pattern |
| heresy-ritual-chandelier | (25, 61) ceiling center | 1.2 | Central overhead ritual light |
| heretic-tome | (25, 61) center altar | 1.0 | Central altar BookStand |
| inverted-cross | (20, 55) north wall left | 0.8 | Inverted banner, heretical |
| inverted-cross | (30, 67) south wall right | 0.8 | Inverted banner, heretical |
| heresy-cracked-baptismal-font | (20, 66) SW corner | 0.7 | Cracked font, desecrated |
| heresy-cracked-baptismal-font | (30, 56) NE corner | 0.7 | Cracked font, desecrated |
| heresy-profane-symbol | (25, 55) north wall center | 1.0 | Large profane medallion |
| heresy-burning-pyre | (19, 61) west edge | 0.6 | Heretic burning pyre, atmosphere |

**Lighting:**
- 5x CandleStick_Triple at pentagram points: (22, 57), (28, 57), (20, 62), (30, 62), (25, 66) -- pale violet `#aa88ff`, radius 3 cells
- 1x Chandelier overhead: flickering violet-white, radius 6 cells, dims during phase transitions
- Pentagram groove emissive: faint purple `#6633aa` glow from floor inlay lines
- Phase 2 fog: density surges to 0.10, color `#201020` (deep magenta, disorienting)

**Platforming:** Flat at elevation 0 throughout. Pentagram is a floor-level inlay (no elevation change). Altar (BookStand) sits on a 2x2 FLOOR_RAISED platform (+0.5 elevation) at center. Five CandleStick_Triple on small circular stone pedestals (+0.25 elevation). Vaulted ceiling at 5 units. Phase 3: random 2x2 floor sections become FLOOR_VOID for 3 seconds then reform, up to 4 simultaneously. Pentagram center remains stable.
