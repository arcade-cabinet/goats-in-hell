---
title: "Circle 7: Violence"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 7
sin: bloodshed
boss: Il Macello
act: 3
build_script: scripts/build-circle-7.ts
mechanic: bleeding
related:
  - docs/circles/00-player-journey.md
  - docs/circles/06-heresy.md
  - docs/agents/level-editor-api.md
---

# Circle 7: Violence --- Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Identity

**Circle:** 7 (Violence)
**Sin:** Bloodshed
**Boss:** Il Macello (The Butcher) --- brute Minotaur, clublike male anatomy (Dainir male base, maximum size)
**Dominant Mechanic:** Bleeding (constant 1 HP/second drain from level entry; each kill restores 10 HP)
**Dante Quote:** *"Or convien che Gerion si mova..."* (Now it is necessary that Geryon moves...)

**Feel:** You are dying from the moment you arrive. Your health ticks down --- one point per second, relentless, permanent. The only medicine is murder. Every kill restores 10 HP. Standing still is death. Hiding is death. Exploring cautiously is death. You must fight constantly, pushing forward through blood rivers, thorn forests, and burning sands. Dante's three sub-rings of violence are all here: violence against others (Blood River), violence against self (Thorny Passage/Thornwood), violence against God and nature (Burning Shore). This is the circle where the player receives the Brimstone Flamethrower --- the scapegoat's destiny weapon. From this point forward, combat transforms from peek-and-shoot to push-and-burn.

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Pier/walkway walls | Rough stone, dark gray with red veins | Rock034, Rock044 | Volcanic, blood-stained |
| Blood River floor | Deep crimson liquid surface | Lava004 (tinted deep red) | Waist-deep blood, 2 DPS contact |
| Raised walkways | Worn stone, blood-splattered | PavingStones092, Ground037 | Safe paths over blood |
| Thorny walls/columns | Corroded rust, sharp protrusions | Rust003, Rust007 | Contact = 5 damage |
| Burning Shore floor | Cracked sandstone, heat-warped | Ground054, Ground068 | Open expanse, fire geyser scorch marks |
| Flamethrower Shrine | Polished dark stone, altar | Rock062, MetalPlates009 | Sacred-industrial, altar feel |
| Slaughterhouse walls | Rusted industrial metal | Metal037, Metal046 | Abattoir, blood-stained |
| Slaughterhouse floor | Metal grating | MetalWalkway007, MetalWalkway012 | Industrial processing floor |
| Abattoir floor | Metal grating over void | MetalWalkway003, MetalWalkway014 | Retractable sections, void visible below |
| Abattoir walls | Heavy rusted plate | MetalPlates004, MetalPlates011 | Massive industrial walls |
| River Banks | Muddy shore, transition | Ground023, Leather008 | Wet earth, blood-soaked |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Pier/River/Banks | 0.05 | `#2a0808` | Deep red haze, blood mist |
| Thorny Passage/Thornwood | 0.07 | `#1a0505` | Darker, restricted visibility in thorns |
| Burning Shore | 0.03 | `#331505` | Thinner, heat shimmer, orange tint |
| Slaughterhouse | 0.06 | `#1a0808` | Industrial red haze |
| Il Macello's Abattoir | 0.04 | `#200505` | Dark, clear enough to see floor panels |
| Abattoir phase 3 (floor collapse) | 0.08 | `#2a0000` | Panic fog, pure red |

### Lighting

- Ambient: `#aa2200` at intensity 0.18 (deep crimson, warmer and brighter than previous circles --- violence is loud)
- Pier/River: Point lights from torch-sconce-ornate (hot orange `#ff5500`, radius 5 cells) on raised walkway pillars
- Thorny Passage/Thornwood: Sparse torch-sconce-ornate (dim red `#cc3300`, radius 3 cells) --- thorns obscure light
- Burning Shore: No fixed lights. Fire geyser eruptions provide periodic bright flashes (`#ffaa00`, radius 8 cells, 2s duration)
- Flamethrower Shrine: Single candelabrum-tall behind the altar (warm gold `#ffcc44`, radius 4 cells) --- reverent
- Slaughterhouse: Overhead torch-sconce-ornate props (industrial yellow `#ccaa33`, radius 4 cells)
- Abattoir: Four torch-sconce-ornate at room corners (deep orange `#dd4400`, radius 6 cells), one chandelier-iron overhead (dim, flickers during phase transitions)

### Props (Meshy AI + General Library)

All props use bespoke Meshy AI-generated models or general library assets. See **## 3D Spatial Design** for per-room placement details and **### Prop Manifest Inventory** for the full asset list.

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Leaking001-003 | Walls in Blood River, Slaughterhouse | Blood seepage, dripping |
| Stain001 | Floor surfaces in Slaughterhouse, Abattoir | Blood pools, scorch marks |

---

## Room Layout

### Overview (10 rooms)

```
                ┌─────────┐
                │  PIER   │  (8x6, exploration, sortOrder=0)
                │ Spawn * │  Elevated overlook of Blood River.
                │ elev +2 │
                └────┬────┘
                     | stairs down (elev +2 to 0)
                ┌────┴────────────┐
                │   BLOOD RIVER   │  (20x14, exploration, sortOrder=1)
                │   crimson floor │  Raised walkways cross the blood.
                │   goatKnights   │  Multiple branching paths.
                └──┬──────────┬───┘
          ┌────────┘          └────────┐
     ┌────┴────┐                  ┌────┴──────┐
     │  RIVER  │                  │  THORNY   │  (6x16, platforming, sortOrder=3)
     │  BANKS  │ (8x6,           │  PASSAGE  │  Narrow, thorn walls (5 dmg contact).
     │ sortOrd │  exploration,   │  elev 0-2 │  Elevation platforming.
     │   =2)   │  transitional)  └────┬──────┘
     └────┬────┘                      |
          │ corridor                  | corridor (width=2)
          │ (width=2)           ┌─────┴──────┐
          │                     │ THORNWOOD  │  (14x12, exploration, sortOrder=4)
          │                     │ thorn cols │  Dense thorny columns.
          │                     │ open lanes │  Can't hug walls for cover.
          │                     └─────┬──────┘
          │                           |
          └────────┐    ┌─────────────┘
                   │    │ corridor (width=3)
              ┌────┴────┴────┐
              │ BURNING SHORE│  (18x10, exploration, sortOrder=5)
              │  open expanse│  Fire geysers erupt periodically.
              │  no cover    │  fireGoats have clear sightlines.
              └──┬───────────┘
                 |
            ┌────┴─────┐
            │FLAMETHROW│  (6x6, exploration, sortOrder=6)
            │ER SHRINE │  Brimstone Flamethrower on altar.
            │ weapon!! │  "The wilderness gave you fire."
            └────┬─────┘
                 | corridor (width=3)
            ┌────┴──────────┐
            │ SLAUGHTERHOUSE│  (14x12, arena, sortOrder=7)
            │   meat hooks  │  3 waves. Flamethrower excels.
            │   3 waves     │  Hooks drop as hazards between waves.
            └──┬─────────[S]┘
               │         |
               │    ┌────┴─────┐
               │    │ BUTCHER'S│  (6x6, secret, sortOrder=8)
               │    │  HOOK    │  Hidden supply cache.
               │    └──────────┘
               | stairs down (elev 0 to -1)
            ┌──┴─────────────┐
            │  IL MACELLO'S  │  (16x16, boss, sortOrder=9)
            │   ABATTOIR     │  Metal grating over void.
            │  floor retracts│  3 phases. Arena shrinks.
            └────────────────┘
```

### Grid Dimensions

**60 wide x 110 deep** (120 x 220 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Pier | 26 | 2 | 8 | 6 | exploration | +2 (raised) | 0 |
| Blood River | 20 | 12 | 20 | 14 | exploration | 0 (blood), walkways at +0.5 | 1 |
| River Banks | 8 | 20 | 8 | 6 | exploration | 0 | 2 |
| Thorny Passage | 44 | 18 | 6 | 16 | platforming | 0, 1, 2 (varies) | 3 |
| Thornwood | 36 | 38 | 14 | 12 | exploration | 0 | 4 |
| Burning Shore | 16 | 54 | 18 | 10 | exploration | 0 | 5 |
| Flamethrower Shrine | 22 | 68 | 6 | 6 | exploration | 0 | 6 |
| Slaughterhouse | 18 | 78 | 14 | 12 | arena | 0 | 7 |
| Butcher's Hook | 36 | 82 | 6 | 6 | secret | 0 | 8 |
| Il Macello's Abattoir | 17 | 94 | 16 | 16 | boss | -1 (below) | 9 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Pier | Blood River | stairs | 3 | Descending stairs, elev +2 to 0 |
| Blood River | River Banks | corridor | 3 | West exit, through blood to shore |
| Blood River | Thorny Passage | corridor | 2 | East exit, narrow transition |
| River Banks | Burning Shore | corridor | 2 | South, long connecting corridor |
| Thorny Passage | Thornwood | corridor | 2 | South, thorn-lined corridor |
| Thornwood | Burning Shore | corridor | 3 | Southwest, opens to expanse |
| Burning Shore | Flamethrower Shrine | corridor | 2 | South, descending to tomb |
| Flamethrower Shrine | Slaughterhouse | corridor | 3 | South, industrial transition |
| Slaughterhouse | Butcher's Hook | secret | 2 | WALL_SECRET at east boundary |
| Slaughterhouse | Il Macello's Abattoir | stairs | 3 | South, descending to -1 |

---

## Room Details

### Room 1: Pier

```
     N (ingress: player spawns here)
     |
     v
  +--------+
  |  TS TS |   TS = torch-sconce-ornate (wall-mounted, flanking)
  |   **   |   ** = player spawn (center, elevation +2)
  |        |
  | IR  BC |   IR = violence-iron-railing, BC = violence-blood-cauldron
  |  BT    |   BT = blood-trough (near stairs)
  +--SSSS--+   SSSS = stairs down (elev +2 to 0, 3 cells wide)
      |
      v S (egress: stairs descend to Blood River)
```

- **Dimensions:** 8w x 6h, elevation +2 (4 world units above Blood River floor)
- **Feel:** An elevated stone pier jutting out over the crimson expanse below. The player spawns at the highest point in the circle and looks DOWN at the Blood River stretching out ahead --- a massive room of deep red liquid crossed by narrow stone walkways. The scope of the challenge is immediately visible. Two torch-sconce-ornate on the walls provide warm orange light. A violence-blood-cauldron sits near the edge, overflowing with blood. violence-iron-railing lines the west edge. violence-industrial-arch frames the stair descent. violence-pier-overlook and violence-walkway-pillar provide structural framing.
- **Bleeding mechanic starts HERE.** The moment the player enters this room, the 1 HP/second drain begins. A UI indicator pulses red. The clock is ticking.
- **3D elements:** Elevation +2 (4 world units above base). RAMP cells form a 3-wide staircase descending the south face, transitioning from +2 to +1 to 0 over 4 cells of depth. The pier edge has no railing on the east side --- falling off deals 5 damage and drops the player into Blood River's crimson floor (2 DPS on contact).
- **Enemies:** None. Observation and dread only.

### Room 2: Blood River

```
     N (ingress: stairs from Pier)
     |
     v
  +----SSSS-----------+
  |bbbbbbbbbbbbbbbbbbbb|   b = blood floor (FLOOR_LAVA, deep red, 2 DPS)
  |bb+--walk--+bbbbbbb|   walk = raised stone walkway (elev +0.5)
  |bb| TS     |bbbbbbb|   TS = torch-sconce-ornate (on walkway pillars)
  |bb|    gK  +--+bbbb|   gK = goatKnight patrol position
  |bb+--+     bb |bbbb|   WP = violence-walkway-pillar (6 positions)
  |bbbbb| TS  bb |bbbb|
  |bb+--+     +--+bbbb|   Branching walkway network
  |bb|     gK      bbb|   BRA = violence-blood-river-arch (junction)
  |bb| TS  +----+bbbbb|   RWP = violence-rusted-walkway-platform (3)
  |bb+--+  |b a |bb+--+   a = ammo pickup (dead-end walkway)
  |bbbbb|  |bbbb|bb|  |   BP = violence-blood-pool (2)
  |bb+--+--+bbbb+--+  |   BG = violence-blood-gutter (2)
  |bb| TS   gK    TS bb|
  |bb+------+--+------+
  D                    D   D = doors (west to River Banks, east to Thorny Passage)
  +--------------------+
```

- **Dimensions:** 20w x 14h, elevation 0 (blood floor) with walkways at +0.5
- **Feel:** Massive chamber flooded with waist-deep crimson blood (FLOOR_LAVA cells tinted deep red). The liquid surface ripples. Raised stone walkways (PavingStones092, elevation +0.5 via FLOOR_RAISED) form a branching network across the room. torch-sconce-ornate props on violence-walkway-pillar supports cast orange light across the red surface. violence-blood-river-arch spans the main walkway junction as the room's visual hero piece. violence-rusted-walkway-platform mark dead-end loot positions. violence-blood-pool and violence-blood-gutter provide crimson atmosphere. The walkways branch and fork --- some paths lead to loot on dead-end platforms, others are the main route. Every dead-end costs bleeding time.
- **Blood mechanics:** FLOOR_LAVA cells deal 2 DPS on contact. Combined with the 1 HP/s bleeding, standing in blood drains 3 HP/s total. Players MUST stay on walkways. goatKnights (Dark) wade through the blood --- they are resistant (take 0 DPS from blood) but move at 60% speed in it.
- **Walkway network:** Main path runs roughly north-to-south with three branches:
  - West branch: leads to ammo pickup on dead-end platform, connects to west exit (River Banks)
  - Central spine: main route with goatKnight patrols
  - East branch: connects to east exit (Thorny Passage), narrow 2-cell-wide walkway
- **3D elements:** Walkways are FLOOR_RAISED (+0.5 elevation, 1 world unit above blood surface). violence-walkway-pillar (6 positions, rising from blood to walkway height) support the paths. torch-sconce-ornate mounted on these pillars at offsetY=1.5. The blood surface itself is at elevation 0.
- **Enemies:** 3x goatKnight (Dark) patrol walkway intersections. They can step off walkways into blood (slower, but they flank). The player cannot follow them into the blood without taking damage.

### Room 3: River Banks

```
     N
     |
  +--D-----+   D = door north (violence-industrial-arch framing entrance)
  |         |
  | TS   BC |   TS = torch-sconce-ornate, BC = violence-blood-cauldron
  |         |
  |  BP  fG |   BP = bone-pile (general), fG = fireGoat
  |         |
  | h    RS |   h = health pickup, RS = rubble-pile-small (general)
  +----D----+
       |
       v S (egress: corridor to Burning Shore)
```

- **Dimensions:** 8w x 6h, elevation 0
- **Feel:** Muddy shoreline. The transition from blood river to solid ground. Ground023 floor (wet earth), Rock034 walls. violence-industrial-arch frames the north entrance from the Blood River. A violence-blood-cauldron overflows with blood near the north entrance. bone-pile (general) debris washed up on the river bank. The room is small and transitional --- a brief respite (but bleeding continues). One fireGoat patrols here, punishing players who linger.
- **3D elements:** Floor slopes slightly upward from north to south (RAMP cells, 0 to +0.25) as the terrain rises from the blood shore. The ceiling is higher here (4 units) after the low walkway-and-blood claustrophobia of the river.
- **Enemies:** 1x fireGoat (Crimson) --- ranged attacks force the player to keep moving through this transitional space.

### Room 4: Thorny Passage

```
     N (ingress: from Blood River east exit)
     |
     v
  +--D---+
  |TT  TT|   TT = thorn walls (Rust003/007, 5 dmg contact)
  | path  |   path = 3-cell-wide safe corridor (center)
  |TT  TT|
  |  RAMP |   RAMP = elevation change (0 to +1)
  |TT  TT|
  | path  |   3-cell gap between thorn walls
  |TT  TT|
  |  RAMP |   RAMP = elevation change (+1 to +2)
  |TT  TT|
  | fG    |   fG = fireGoat on elevated section
  |TT  TT|
  |  RAMP |   RAMP = elevation change (+2 to +1)
  |TT  TT|
  | path  |
  |TT  TT|
  |  RAMP |   RAMP = elevation change (+1 to 0)
  |TT  TT|
  +--D----+
     |
     v S (egress: to Thornwood)
```

- **Dimensions:** 6w x 16h, elevation varies (0, +1, +2, +1, 0)
- **Feel:** A narrow gauntlet. The corridor is 3 cells wide (6 world units) --- narrow enough to feel claustrophobic but wide enough for the player to strafe and dodge without unavoidable wall contact. Flanked on both sides by thorn-covered walls (Rust003 texture on WALL_STONE cells). Touching any wall deals 5 damage. The passage weaves vertically --- RAMP cells create elevation changes at four points, forcing the player to platform upward and then back down. Miss a jump and you skid into thorn walls. The passage is long (16 cells deep) and claustrophobic.
- **Thorn wall mechanic:** All wall cells in this room use Rust003/Rust007 textures. Any player contact with these walls triggers 5 damage (environment zone). The safe path is 3 cells wide --- enough room to dodge projectiles laterally without guaranteed thorn contact.
- **Thorn wall audio/visual cues:** Thorn walls emit a faint scratching/crackling ambient sound. When the player is within 2 cells of a thorn wall, red particle effects (tiny sparks) drift from the surface. These visual and audio cues warn the player before contact damage occurs.
- **3D elements:** Four elevation changes via RAMP cells:
  - Z+2 to Z+5: elevation 0 to +1 (ascending)
  - Z+6 to Z+9: elevation +1 to +2 (ascending, highest point)
  - Z+10 to Z+11: elevation +2 to +1 (descending)
  - Z+14 to Z+15: elevation +1 to 0 (descending, exit level)
  The vertical profile creates a hill shape. At the peak (+2 elevation), a fireGoat has a commanding sightline down the corridor in both directions.
- **Enemies:** 2x fireGoat (Crimson) at the elevated sections. They fire downhill at the player who is navigating the narrow path. Dodging their projectiles laterally risks thorn wall contact.

### Room 5: Thornwood

```
     N (ingress: from Thorny Passage)
     |
     v
  +--D-----------+
  |TT  T  TT  T  |   T = thorny column (Rust007 structural, 1x1)
  |   gK      TT |   gK = goatKnight patrol
  | T   T  T     |   TT = thorn wall cluster (2-wide)
  |    lane    T  |   lane = open fighting lanes (2-3 cells wide)
  |TT     T   TT |
  |  T  hG   T   |   hG = hellgoat
  | T  T   TT    |
  |     lane   T  |
  | TT  T     TT |
  |  T   fG  T   |   fG = fireGoat
  |T    T  T     |
  +----------D---+
             |
             v S (egress: corridor to Burning Shore)
```

- **Dimensions:** 14w x 12h, elevation 0
- **Feel:** A dense forest of thorny columns. Structural columns (1x1 WALL_STONE with Rust007 texture) are placed irregularly throughout the room, creating narrow 2-3-cell-wide lanes between them. Every column is thorned --- 5 damage on contact, same as the passage walls. The player cannot hug cover because cover hurts. Combat must happen in the open lanes. Visibility is restricted by the column density (effective sight range ~6 cells). The bleeding mechanic punishes hesitation --- must push through.
- **Thorn column mechanic:** Each column cell is a WALL_STONE with Rust007 texture and a 1-cell damage zone around it (environment zone, 5 damage on contact). Players must maintain 1+ cell distance from all columns while fighting.
- **3D elements:** Columns rise to ceiling height (3.5 units). Some columns are 2-cell clusters (TT in diagram) creating wider obstacles. Floor is Ground054 (scorched earth). Ceiling is low (3.5 units) compared to temple rooms.
- **Enemies:** 1x goatKnight (Dark, patrolling north lanes), 1x hellgoat (Brown, center), 1x fireGoat (Crimson, south). Mixed enemy types force varied combat --- goatKnight must be engaged carefully (armored), fireGoat's ranged shots ricochet between columns, hellgoat charges down lanes.

### Room 6: Burning Shore

```
     N (ingress: from River Banks and Thornwood)
     |
     v
  +--DD-----------DD--+
  |                    |
  |  F     fG      F  |   F = fire geyser zone (2x2, periodic eruption)
  |                    |
  |     fG     F      |   fG = fireGoat (ranged, open sightlines)
  |                    |
  |  F     F      fG  |   Open expanse --- no cover, no walls to hide behind
  |                    |
  |     fG     F      |
  |                    |
  |  a     h       a  |   a = ammo, h = health
  +--------DD---------+
           |
           v S (egress: to Flamethrower Shrine)
```

- **Dimensions:** 18w x 10h, elevation 0
- **Feel:** A vast open expanse after the claustrophobic thorns. Ground054 (cracked sandstone) and Ground068 (heat-warped earth) floor. No walls within the room interior --- just open space stretching in every direction. The ceiling opens up (or is absent --- open to a cavern void above). The relief of open space is immediately undercut by fire geysers and fireGoats with clear sightlines across the entire room.
- **Fire geyser mechanic:** Six 2x2 fire geyser zones erupt on a staggered timer (timer_on: 3s, timer_off: 5s). Each eruption deals 8 damage and creates a 3-cell visual column of fire. The eruptions are staggered --- never all active simultaneously, but the player must constantly track which geysers are about to fire. The eruption positions are fixed and visible (scorch marks on floor via Stain001 decal).
- **Fire geyser audio/visual warning:** Each fire geyser has a 1-second audio warning before eruption: a rising hiss that crescendos into the burst. The ground beneath the geyser glows orange 1 second before eruption. Both cues give the player time to dodge.
- **3D elements:** Flat terrain. No elevation changes. The openness is the 3D element --- after cramped corridors and narrow walkways, the vast open space at ground level creates a fundamentally different spatial experience. The geyser eruptions are the vertical element --- 3-cell-high fire columns.
- **Enemies:** 4x fireGoat (Crimson) positioned across the expanse. They have unobstructed sightlines and fire from range. The player has no cover --- must close distance or dodge in the open. The bleeding mechanic means the player cannot kite indefinitely.

### Room 7: Flamethrower Shrine

```
     N (ingress: from Burning Shore)
     |
     v
  +--DD--+
  |      |
  | BC BC|   BC = bone-column (general, flanking entrance)
  |      |
  | [FT] |   [FT] = weapon pickup: BRIMSTONE FLAMETHROWER
  | altar |   altar = violence-stone-altar (FLOOR_RAISED +0.5)
  |      |
  | SC VC|   SC = skull-candelabra (general, behind altar), VC = violence-blood-cauldron
  +--DD--+
     |
     v S (egress: to Slaughterhouse)
```

- **Dimensions:** 6w x 6h, elevation 0
- **Feel:** A small, sacred space. Almost a tomb. The architecture shifts from rusted industrial to reverent stone (Rock062 walls, MetalPlates009 floor accents). violence-stone-altar (FLOOR_RAISED +0.5, 2x2 cells) holds the Brimstone Flamethrower --- the scapegoat's destiny weapon. A skull-candelabra (general) burns behind the altar with warm gold light (a stark contrast to the red-orange of the rest of the circle). Two torch-sconce-ornate (general) flank the entrance on the walls. bone-column (general) props flank the shrine entrance. A violence-blood-cauldron sits beside the altar, cold and empty (unlike the blood-filled ones elsewhere).
- **Weapon pickup:** The Brimstone Flamethrower. Continuous stream, short range (4 cells), DOT 2 dmg/s for 5 seconds. When picked up, the inscription appears: *"The wilderness gave you fire. Use it."*
- **Health pickup:** A health pickup sits on the floor beside the altar. The player heals before heading into the Slaughterhouse.
- **3D elements:** The altar is a 2x2 FLOOR_RAISED platform (+0.5 elevation, 1 world unit). The candelabrum-tall sits on the altar behind the weapon. The room has a vaulted ceiling (3.5 units) with a slight dome shape.
- **Enemies:** None. This is a moment of quiet. The bleeding continues but no enemies drain the player's attention. A breath before the Slaughterhouse.

### Room 8: Slaughterhouse

```
     N (ingress: from Flamethrower Shrine, violence-industrial-arch)
     |
     v
  +--DDD----------+
  |  MH    MH   MH |   MH = meat-hook (hanging, 3x3 grid)
  | TS          TS |   TS = torch-sconce-ornate (industrial lighting)
  |                |
  | MC  BB    MC   |   MC = violence-metal-crate-stack (partial cover)
  |     BG    RA   |   BB = violence-butcher-block, BG = violence-blood-gutter, RA = violence-rusted-anvil
  |  MH    MH      |   HR = violence-hook-rack, SD = violence-sawblade-decoration
  | TS          TS |   BN = violence-bone-grinder
  |                |   CC = violence-chain-conveyor (ceiling, 3 rows)
  | MC    BB   MC  |
  |                |
  |  MH    MH   MH |   Second row of hooks (drop as hazards wave 2-3)
  |                |
  | a    h     a   |   a = ammo, h = health (between waves)
  +--DDD-------[S]+   [S] = WALL_SECRET east (to Butcher's Hook)
       |
       v S (egress: stairs down to Il Macello's Abattoir)
```

- **Dimensions:** 14w x 12h, elevation 0
- **Feel:** Industrial abattoir. MetalWalkway007 floor (metal grating), Metal037 walls (rusted). meat-hook props hang from the ceiling at nine points in a 3x3 grid --- meat hooks swaying. violence-chain-conveyor overhead rails carry the hooks. torch-sconce-ornate props provide harsh industrial yellow lighting from four wall positions. violence-metal-crate-stack offer partial cover (waist-high, breakable). violence-butcher-block and violence-rusted-anvil establish the butchery theme. violence-bone-grinder, violence-blood-gutter, violence-hook-rack, and violence-sawblade-decoration complete the industrial abattoir identity. violence-industrial-arch frames the north entrance. This room is where the Flamethrower proves its worth --- close-quarters combat in a confined industrial space.
- **Arena mechanic:** Doors lock on entry (trigger T6). Three waves:
  - **Wave 1:** 3x goatKnight (Dark). Armored enemies in close quarters. Flamethrower DOT bypasses armor over time. violence-metal-crate-stack cover matters against their melee.
  - Health and ammo resupply spawns between wave 1 and wave 2 (not wave 2 and 3). The player needs HP recovery BEFORE the hardest wave, not after.
  - **Wave 2:** 3x fireGoat (Crimson). Ranged enemies. Between waves 1 and 2, three meat-hook hooks DROP from the ceiling to floor level, becoming 1x1 obstacles (and contact hazards, 3 damage). The room's layout changes.
  - **Wave 3:** 2x goatKnight + 2x hellgoat (Brown) + 1x fireGoat. All types simultaneously. Three MORE hooks drop. The room is increasingly cluttered with hanging and fallen hooks.
- **WALL_SECRET:** East wall at (31, 89) leads to Butcher's Hook secret room.
- **3D elements:** Ceiling at 4 units. meat-hook props hang from ceiling mounts (offsetY=-0.5 initially). When hooks "drop" between waves, they descend to floor level (offsetY=0), creating 1x1 ground obstacles. violence-metal-crate-stack stacks are 2 cells high (waist cover). The Workbench and Anvil are at ground level.

### Room 9: Butcher's Hook (Secret)

```
  +--[S]--+   [S] = WALL_SECRET entrance (from Slaughterhouse east wall)
  |        |
  | MC  MC |   MC = violence-metal-crate-stack
  |  a   a |   a = ammo x2
  |  h   h |   h = health x2
  | BG     |   BG = violence-blood-gutter (floor center)
  |        |
  +--------+
```

- **Dimensions:** 6w x 6h, elevation 0
- **Feel:** Hidden supply cache behind the Slaughterhouse's east wall. A small storage room with violence-metal-crate-stack at the corners and violence-blood-gutter in the floor center. Two ammo pickups and two health pickups --- critical supplies given the bleeding mechanic's constant drain. MetalWalkway012 floor, Metal046 walls. One torch-sconce-simple (general) provides dim light.
- **3D elements:** violence-metal-crate-stack at varying heights (1-3 cells) create a cramped storage feel. violence-blood-gutter in the floor adds atmosphere.
- **Enemies:** None. Pure reward for exploration.

### Room 10: Il Macello's Abattoir

```
     N (ingress: stairs down from Slaughterhouse, violence-industrial-arch)
     |
     v
  +--DDDD-----------+
  |  TS           TS |   TS = torch-sconce-ornate (4 corners, deep orange)
  |  IC           IC |   IC = violence-industrial-cage (north corners)
  |   MH      MH    |   MH = meat-hook (hanging, 8 positions)
  |        MH        |
  |  [G] [G] [G] [G] |   [G] = violence-grating-panel (4x4 grid, retractable)
  |  [G] [G] [G] [G] |
  |        MH        |   CC = violence-chain-conveyor (ceiling, N-S span)
  |   MH      MH    |   Floor is metal grating over FLOOR_VOID
  |  [G] [G] [G] [G] |
  |  [G] [G]  *M*[G] |   *M* = Il Macello spawn position
  |        MH        |
  |   MH      MH    |   BB = violence-butcher-block (west side)
  |  [G] [G] [G] [G] |   BN = violence-bone-grinder (SW corner)
  |  [G] [G] [G] [G] |   HR = violence-hook-rack (SE corner)
  |                  |   BG = violence-blood-gutter (center floor)
  |  TS  CH      TS  |   CH = chandelier-iron (ceiling), SD = violence-sawblade-decoration (south wall x2)
  |                  |   BP = violence-blood-pool (center cosmetic)
  | a  h   SD SD  a  |   a=ammo, h=health
  +------------------+
```

- **Dimensions:** 16w x 16h, elevation -1 (below main level)
- **Feel:** The final room. Massive. The floor is a metal grating (MetalWalkway003/014) suspended over a void (FLOOR_VOID visible through the grate --- the player can see the blackness below). The grating is divided into a 4x4 grid of violence-grating-panel (16 retractable 3x3 panels). meat-hook props hang from the ceiling at eight points --- meat hooks creating vertical obstacles. violence-chain-conveyor spans the ceiling. Four torch-sconce-ornate (general) at the corners provide deep orange light. A chandelier-iron (general) hangs from the center of the vaulted ceiling (5 units high). violence-industrial-cage flank the entrance. violence-sawblade-decoration mounted on the south wall as trophies. violence-butcher-block, violence-bone-grinder, violence-blood-gutter, violence-hook-rack, and violence-blood-pool complete the industrial abattoir. violence-industrial-arch frames the massive north entrance. MetalPlates004/011 walls.
- **Il Macello:** The Butcher. Dainir male base at maximum size. Wields a massive cleaver. The largest enemy model in the game.
- **Boss phases:**
  - **Phase 1 (100%-60% HP) --- Overhead Cleave:** Il Macello stands in the arena center and attacks with massive overhead cleave strikes. Each cleave targets the player's position and lands 1 second later (telegraph: shadow on floor). The cleave deals 25 damage in a 3x3 area. After a missed cleave, Il Macello's weapon gets STUCK in the metal grating for 2 seconds --- he is immobile and vulnerable. The player must bait cleaves, dodge, then punish. The Flamethrower's DOT is ideal during his 2-second stuck window.
  - **Phase 2 (60%-30% HP) --- Chain Grapple:** Il Macello rips a meat-hook from the ceiling and uses it as a grapple weapon. He fires the chain at the player (projectile, 2-cell width). If it connects, the player is DRAGGED toward Il Macello across the arena (forced movement, 1 cell/0.3s). During the drag, the player can still shoot (the flamethrower streams behind them). If pulled to melee range, Il Macello hits for 20 damage. The chain can be dodged by lateral movement. He throws the chain every 5 seconds.
  - **Between Phase 1 and Phase 2:** 2 hellgoats spawn from the arena edges. Killing them restores 20 HP (10 HP per kill). This buys the player time against the bleeding mechanic.
  - **Between Phase 2 and Phase 3:** 2 more hellgoats spawn. Another 20 HP restore. These mobs serve dual purpose: they sustain HP AND they provide brief combat variety between boss phases.
  - **Total boss fight HP sustain:** 4 mob kills = 40 HP restored + room health pickups (2 x 25 = 50 HP) = 90 HP restored during the fight. With ~180 seconds of bleeding (180 HP lost), the player exits at roughly 10-30 HP. TIGHT but survivable.
  - **Phase 3 (30%-0% HP) --- Processing Line:** Il Macello activates the "processing line." Floor grating panels begin retracting --- one 3x3 panel every 4 seconds, revealing FLOOR_VOID below. Panels retract from the edges inward. The arena literally shrinks. After 40 seconds, only a 6x6 center section remains. Il Macello becomes more aggressive --- faster cleaves (0.7s telegraph), shorter chain cooldown (3s). The player must kill him before running out of floor. Falling through a retracted panel deals 15 damage and teleports the player to a random remaining panel.
- **3D elements:** Floor at elevation -1 (2 world units below main level). The metal grating floor panels are FLOOR_RAISED cells that retract to FLOOR_VOID during phase 3. The void below is visible through the grating (dark, bottomless). meat-hook props hang from ceiling at 5-unit height. chandelier-iron at center ceiling. Wall-mounted violence-blood-gutter and violence-metal-crate-stack at offsetY=2.0.

---

## Entities

### Enemies (24 total + boss)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Blood River | goatKnight | 3 | Patrol walkway intersections, wade through blood to flank | Dark, armored |
| River Banks | fireGoat | 1 | Patrol small room, ranged harass | Crimson |
| Thorny Passage | fireGoat | 2 | Hold elevated positions, fire downhill | Crimson |
| Thornwood | goatKnight | 1 | Patrol north lanes | Dark, armored |
| Thornwood | hellgoat | 1 | Charge through center lanes | Brown |
| Thornwood | fireGoat | 1 | Ranged from south lanes | Crimson |
| Burning Shore | fireGoat | 4 | Spread across expanse, long-range fire | Crimson |
| Slaughterhouse wave 1 | goatKnight | 3 | Melee rush from north | Dark, armored |
| Slaughterhouse wave 2 | fireGoat | 3 | Ranged from corners | Crimson |
| Slaughterhouse wave 3 | goatKnight | 2 | Mixed assault | Dark, armored |
| Slaughterhouse wave 3 | hellgoat | 2 | Charge down center | Brown |
| Slaughterhouse wave 3 | fireGoat | 1 | Ranged support | Crimson |
| Il Macello's Abattoir | Il Macello | 1 | Boss AI, 3 phases | boss-il-macello.glb |

*Note: Enemy counts above list per-wave for the Slaughterhouse. Total unique spawns across the Slaughterhouse = 3+3+5 = 11. Grand total non-boss enemies = 3+1+2+3+4+11 = 24. With bleeding mechanic pressure, the player must kill efficiently to sustain HP.*

### Flamethrower Fuel Pickups

Flamethrower fuel pickups ("fuel" entity type) appear in every room from the Slaughterhouse onward. Fuel pickups restore 25 fuel (of 100 max capacity). The flamethrower burns at 5 fuel/second and passively regenerates at 1 fuel/second when not firing. With fuel pickups in each room, the player maintains 60-80% fuel on average.

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Pier | ammo | (29, 6) | Starting supplies, near Barrel |
| Blood River | ammo | (35, 22) | Dead-end walkway (east branch) |
| Blood River | health | (24, 20) | Walkway intersection (central) |
| River Banks | health | (11, 24) | Near south exit |
| Thorny Passage | ammo | (46, 30) | Midpoint, on +1 elevation platform |
| Thornwood | health | (42, 44) | Center of lanes |
| Burning Shore | ammo x2 | (18, 62), (32, 62) | South edge, flanking exit |
| Burning Shore | health | (25, 58) | Center of room |
| Flamethrower Shrine | weapon (flamethrower) | (25, 71) | On altar --- THE weapon |
| Flamethrower Shrine | health | (24, 72) | Beside altar, pre-arena healing |
| Slaughterhouse (between waves 1-2) | ammo x2 | (20, 88), (30, 88) | South edge, resupply before wave 2 |
| Slaughterhouse (between waves 1-2) | health | (25, 88) | Center south, resupply before wave 2 |
| Butcher's Hook | ammo x2 | (38, 84), (40, 84) | Secret cache |
| Butcher's Hook | health x2 | (38, 86), (40, 86) | Secret cache |
| Il Macello's Abattoir | ammo x2 | (19, 108), (31, 108) | South corners, symmetric |
| Il Macello's Abattoir | health x2 | (19, 96), (31, 96) | North corners, symmetric |
| Slaughterhouse | fuel | (25, 85) | Center, between waves --- flamethrower resupply |
| Butcher's Hook | fuel | (37, 83) | Near entrance --- secret room fuel |
| Il Macello's Abattoir | fuel x2 | (31, 95), (19, 107) | NE, SW corners --- boss arena fuel |

### Props (non-interactive, per room)

| Room | Props (count) | Key Assets |
|------|---------------|------------|
| Pier | 8 props | violence-industrial-arch, violence-pier-overlook, violence-walkway-pillar, violence-blood-cauldron, violence-iron-railing, blood-trough, torch-sconce-ornate x2 |
| Blood River | 15 props | violence-walkway-pillar x6, violence-blood-river-arch, violence-rusted-walkway-platform x3, violence-blood-pool x2, violence-iron-railing x2, blood-trough, bone-pile (general) x2 |
| River Banks | 5 props | violence-industrial-arch, violence-blood-cauldron, torch-sconce-ornate, bone-pile (general) x2 |
| Thorny Passage | 11 props | violence-thorn-column x8, violence-blood-pool, rope-hanging x2 |
| Thornwood | 10 props | violence-thorn-column (structural x18), violence-sawblade-decoration, violence-blood-pool, bone-pile (general) x4, dead-tree (general) x3, torch-sconce-simple |
| Burning Shore | 9 props | violence-fire-geyser-vent x6, fire-pit-small x2, rubble-pile-small |
| Flamethrower Shrine | 7 props | violence-stone-altar, violence-blood-cauldron, skull-candelabra, torch-sconce-ornate x2, bone-column x2 |
| Slaughterhouse | 18 props | meat-hook x9, violence-metal-crate-stack x4, violence-butcher-block, violence-rusted-anvil, violence-bone-grinder, violence-blood-gutter, violence-hook-rack, violence-sawblade-decoration, violence-chain-conveyor, violence-industrial-arch |
| Butcher's Hook | 5 props | violence-metal-crate-stack x2, violence-blood-gutter, torch-sconce-simple |
| Il Macello's Abattoir | 22 props | meat-hook x8, violence-grating-panel x16, violence-industrial-cage x2, violence-sawblade-decoration x2, violence-blood-pool, violence-bone-grinder, violence-chain-conveyor, violence-industrial-arch, chandelier-iron |
| **Total** | **~110 props** | **25 circle-specific + general library** |

### Bleeding Sustainability Math

**Bleeding sustainability math:** The player drains 1 HP/second. Each kill restores 10 HP. To break even, the player must average 1 kill per 10 seconds. Across the 10 rooms of Violence (excluding the boss), there are approximately 22 enemies. Average room time is 45-60 seconds. Average kills per room: 2.2. That's 1 kill per 22 seconds = net loss of 12 HP per room. With health pickups (approximately 7 across all rooms, +175 HP), the total economy is: 600 seconds x 1 HP/s = -600 HP drain, +220 HP from kills, +175 HP from pickups = net -205 HP. This means the player enters the boss at approximately 0 HP without health pickups and ~45 HP with all pickups. Adding the Shrine health pickup (+25 HP) and boss mob spawns (+40 HP) brings this to viable levels.

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Pier | (26,2,8,6) | `startBleeding` | `once: true` | `{ drainRate: 1, killRestore: 10 }` |
| T2 | Blood River | (20,12,20,14) | `ambientChange` | `once: true` | `{ fogDensity: 0.05, fogColor: '#2a0808' }` |
| T3 | Thorny Passage | (44,18,6,16) | `ambientChange` | `once: true` | `{ fogDensity: 0.07, fogColor: '#1a0505' }` |
| T4 | Burning Shore | (16,54,18,10) | `ambientChange` | `once: true` | `{ fogDensity: 0.03, fogColor: '#331505' }` |
| T5 | Flamethrower Shrine | (24,70,2,2) | `weaponPickup` | `once: true` | `{ weapon: 'flamethrower', text: "The wilderness gave you fire. Use it." }` |
| T6 | Slaughterhouse | (20,79,10,4) | `lockDoors` | `once: true` | --- |
| T7 | Slaughterhouse | (20,79,10,4) | `spawnWave` | `once: true` | `{ enemies: [{type:'goatKnight', count:3}] }` |
| T8 | Slaughterhouse | --- | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'fireGoat', count:3}], hookDrop: [{x:22,z:81},{x:28,z:83},{x:25,z:85}] }` |
| T9 | Slaughterhouse | --- | `spawnWave` | On wave 2 clear | `{ enemies: [{type:'goatKnight',count:2},{type:'hellgoat',count:2},{type:'fireGoat',count:1}], hookDrop: [{x:20,z:80},{x:30,z:84},{x:26,z:87}] }` |
| T10 | Slaughterhouse | --- | `unlockDoors` | On wave 3 clear | --- |
| T11 | Il Macello's Abattoir | (19,95,12,3) | `bossIntro` | `once: true` | `{ text: "Meat. That is all you are. Meat on hooks." }` |
| T12 | Il Macello's Abattoir | (19,95,12,3) | `lockDoors` | `once: true, delay: 3` | --- |
| T13 | Il Macello's Abattoir | --- | `bossPhase` | Boss HP < 60% | `{ phase: 2, enableChainGrapple: true }` |
| T14 | Il Macello's Abattoir | --- | `bossPhase` | Boss HP < 30% | `{ phase: 3, floorRetractInterval: 4000, floorRetractOrder: 'edges-inward', panelSize: 3, fogDensity: 0.08, fogColor: '#2a0000' }` |

---

## Environment Zones

| Zone | Type | Bounds (x,z,w,h) | Intensity | Notes |
|------|------|-------------------|-----------|-------|
| Global bleeding | `drain` | Full level (0,0,60,110) | 1 HP/s | Constant HP drain, active from entry |
| Blood River liquid | `damage` | Blood River floor cells (20,12,20,14) | 2 DPS | Contact with blood, excludes walkway cells |
| Thorn walls (passage) | `damage` | Wall-adjacent cells in (44,18,6,16) | 5 (contact) | 1-cell damage zone around Rust walls |
| Thorn columns (wood) | `damage` | Column-adjacent cells in (36,38,14,12) | 5 (contact) | 1-cell damage zone around each column |
| Fire geyser 1 | `fire` | (18,55,2,2) | 8 (eruption) | timer_on: 3s, timer_off: 5s, offset: 0s |
| Fire geyser 2 | `fire` | (28,55,2,2) | 8 (eruption) | timer_on: 3s, timer_off: 5s, offset: 1s |
| Fire geyser 3 | `fire` | (23,57,2,2) | 8 (eruption) | timer_on: 3s, timer_off: 5s, offset: 2s |
| Fire geyser 4 | `fire` | (18,59,2,2) | 8 (eruption) | timer_on: 3s, timer_off: 5s, offset: 3s |
| Fire geyser 5 | `fire` | (30,59,2,2) | 8 (eruption) | timer_on: 3s, timer_off: 5s, offset: 4s |
| Fire geyser 6 | `fire` | (24,61,2,2) | 8 (eruption) | timer_on: 3s, timer_off: 5s, offset: 5s |
| Meat hook hazards (wave 2) | `damage` | Individual 1x1 cells (see T8 data) | 3 (contact) | Dropped hooks become floor hazards |
| Meat hook hazards (wave 3) | `damage` | Individual 1x1 cells (see T9 data) | 3 (contact) | Additional dropped hooks |
| Abattoir void | `void` | Retracted floor panels | 15 (fall) | Teleport to random remaining panel |

---

## Player Spawn

- **Position:** (30, 5) --- center of Pier
- **Facing:** pi (south --- facing toward Blood River below)

---

## Theme Configuration

```typescript
editor.createTheme('circle-7-violence', {
  name: 'violence',
  displayName: 'VIOLENCE --- The Circle of Bloodshed',
  primaryWall: MapCell.WALL_STONE,
  accentWalls: [MapCell.WALL_LAVA, MapCell.WALL_OBSIDIAN],
  floorTypes: [MapCell.FLOOR_LAVA, MapCell.FLOOR_RAISED, MapCell.FLOOR_VOID],
  fogDensity: 0.05,
  fogColor: '#2a0808',
  ambientColor: '#aa2200',
  ambientIntensity: 0.18,
  skyColor: '#0a0000',
  particleEffect: 'blood',               // Red particle motes drifting upward
  enemyTypes: ['goatKnight', 'fireGoat', 'hellgoat'],
  enemyDensity: 1.4,                     // High --- all enemy types, dense encounters
  pickupDensity: 0.9,                    // Above average --- player needs HP from pickups AND kills
  specialMechanic: 'bleeding',           // 1 HP/s drain, 10 HP per kill
  bleedingDrainRate: 1,                  // HP/second
  bleedingKillRestore: 10,              // HP restored per kill
  weaponUnlock: 'flamethrower',         // Brimstone Flamethrower found in Shrine
  subZones: ['blood-river', 'thorns', 'burning-sands'],  // Dante's three sub-rings
});
```

---

## Narrative Beats

1. **Pier arrival --- bleeding begins:** The moment the player enters, a red pulsing border appears on the HUD. HP starts ticking down. A text flash: *"Your blood remembers what you've done."* The player looks down at the Blood River --- the scale of this circle is immediately apparent.
2. **Blood River descent:** The player descends from the elevated Pier into the crimson walkways. The goatKnights wade through blood they cannot touch. The disparity is visceral --- the enemies belong here. The player does not.
3. **Thorny Passage elevation:** The vertical platforming through thorn-covered walls creates a unique physical challenge. Every wall is a threat. The player must navigate precisely while bleeding, while enemies fire from above.
4. **Burning Shore relief and terror:** After the claustrophobic thorns, the open expanse is a physical relief. Then the fire geysers erupt. Then the fireGoats start shooting across 18 cells of open ground. The relief was a lie.
5. **Flamethrower Shrine --- the weapon:** *"The wilderness gave you fire. Use it."* The Brimstone Flamethrower changes the game. The scapegoat --- the one who carries sin into the wilderness --- now carries fire. The thematic resonance: the goat was always meant to burn.
6. **Slaughterhouse --- the flamethrower excels:** Close quarters, armored enemies, tight corridors. The flamethrower's DOT shreds goatKnights. The hooks dropping between waves reshape the arena. The player learns the weapon through use.
7. **Boss intro:** Il Macello speaks: *"Meat. That is all you are. Meat on hooks."* He hefts the cleaver. The metal grating floor vibrates.
8. **Boss phase 3 --- the floor vanishes:** Grating panels retract one by one. The arena shrinks. The bleeding continues. Every second is a decision. Kill him before the floor runs out.
9. **Boss defeat:** Il Macello's cleaver falls. He stumbles to the edge of a retracted panel and falls into the void. The remaining floor panels lock. The bleeding stops. A breath. The metal grating parts at the center, revealing stairs descending further. Title card: *"CIRCLE THE EIGHTH --- FRAUD"*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter --- renders in LevelMeshes.tsx with Rust/Metal/Ground PBR materials
2. All 10 rooms are reachable from spawn (DAG validation passes; Butcher's Hook reachable via WALL_SECRET)
3. Bleeding mechanic works --- constant 1 HP/s drain from level entry, 10 HP restored per kill, displayed on HUD
4. Blood River FLOOR_LAVA deals 2 DPS on player contact; raised walkways (FLOOR_RAISED) are safe
5. Thorn wall/column damage zones trigger 5 damage on player contact with Rust-textured walls
6. Fire geyser environment zones cycle on staggered timers (3s on, 5s off, 1s offset between geysers)
7. Brimstone Flamethrower pickup functions --- continuous stream, 4-cell range, 2 dmg/s DOT for 5 seconds
8. Slaughterhouse arena executes 3 waves with meat-hook hooks dropping between waves as new hazards
9. Il Macello boss fight executes all 3 phases (cleave+stuck, chain grapple, floor retraction)
10. Floor retraction in boss phase 3 works --- 3x3 panels retract from edges inward every 4 seconds
11. PlaytestRunner AI can navigate from spawn to boss, acquiring the Flamethrower and defeating Il Macello
12. PBR materials from AmbientCG render correctly (Rock034/044, Rust003/007, Ground054/068, Metal037/046, MetalWalkway003/007/012/014)
13. At least 6 Meshy props visible as GLB instances (meat-hook, violence-rusted-anvil, violence-metal-crate-stack, violence-bone-grinder, violence-hook-rack, violence-blood-gutter)
14. Each room feels distinct --- Pier (dread overlook), Blood River (wading danger), River Banks (brief transition), Thorny Passage (vertical gauntlet), Thornwood (column labyrinth), Burning Shore (open terror), Shrine (sacred pause), Slaughterhouse (industrial arena), Butcher's Hook (hidden reward), Abattoir (shrinking finale)

---

## What This Is NOT

- NOT a leisurely exploration circle. The bleeding mechanic means EVERY SECOND costs HP. Players who explore carefully will die. Players who kill efficiently will thrive. Pacifism is suicide.
- NOT a linear gauntlet. Despite the bleeding pressure, the room layout branches (Blood River has two exits, Burning Shore is reachable from two directions). The player chooses their route through Dante's three sub-rings.
- NOT the same difficulty as previous circles. This is Circle 7 of 9. The enemy density (1.4), the environmental hazards (blood, thorns, fire, hooks), and the constant drain create the hardest challenge yet. The Flamethrower is the player's reward for surviving.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models (circle-specific) or general library Meshy props + AmbientCG PBR textures.
- NOT a small circle. With 10 rooms and a 60x90 grid, this is the LARGEST circle in the game --- reflecting Dante's three sub-rings of violence and the weight of this sin.

---

## 3D Spatial Design

### Room: Pier (8x6, exploration, sortOrder=0)

**Player Experience:** You stand on a rust-stained stone platform jutting over a crimson abyss. The air is thick and hot, carrying the iron tang of blood. Below you, a vast chamber of deep red liquid stretches to the limits of visibility --- crossed by narrow walkways that look impossibly fragile. Your health is already ticking down. Every second you spend looking is a second you spend dying.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-industrial-arch | south door cells | 1.0 | face-south | Frame the descent stairway entrance |
| violence-pier-overlook | east/west edges | 1.0 | face-outward | Stone ledge railing at overlook edge |
| violence-walkway-pillar | south stair flanks | 0.8 | face-center | Pillar supports flanking the stair descent |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-blood-cauldron | (31, 4) floor | 1.0 | Overflowing blood vessel at pier edge |
| violence-iron-railing | (26, 5) west edge | 1.0 | Industrial railing along west pier edge |
| blood-trough | (28, 6) near stairs | 0.8 | Blood drainage at stair top |
| bone-pile (general) | (33, 3) NE corner | 0.6 | Scattered bones for dread atmosphere |
| rpg-skull (general) | (27, 3) near railing | 0.4 | Skull on pier edge --- someone fell before you |

**Lighting:** 2x torch-sconce-ornate (general) on east/west walls, hot orange `#ff5500`, radius 5 cells, offsetY=2.0. Warm directional light from south (illuminating Blood River below).
**Platforming:** Elevation +2. 3-wide RAMP staircase descends south face from +2 to 0 over 4 cells. No railing on east side --- fall risk.

> **Playtest note:** Pier had 5 generic props in 48 cells. Now 8 circle-specific + general props. The industrial railing and overlook sell the "industrial pier" identity.

---

### Room: Blood River (20x14, exploration, sortOrder=1)

**Player Experience:** You descend into a cathedral of blood. The crimson floor undulates below raised stone walkways that branch and fork like veins. Torches on thick pillars cast orange pools across the red surface. Dark armored shapes wade through the liquid between walkways --- goatKnights who belong here. You do not. Every dead-end walkway costs precious bleeding time.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-walkway-pillar | 6 locations along walkways | 1.0 | face-walkway | Support pillars rising from blood to walkway height |
| violence-blood-river-arch | (30, 14) walkway junction | 1.2 | face-south | Archway over main walkway intersection |
| violence-rusted-walkway-platform | 3 dead-end platforms | 1.0 | varies | Elevated loot platforms at walkway termini |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-blood-pool | floor between walkways, 2 positions | 2.0 | Crimson blood surface pools at river edges |
| violence-iron-railing | walkway edges (select), 2 positions | 0.8 | Partial railings on main walkway sections |
| blood-trough | (24, 18) walkway edge | 0.8 | Blood drainage from walkway to river |
| violence-blood-gutter | (26, 20), (32, 16) | 0.8 | Blood drainage channels between walkway segments |
| bone-pile (general) | (35, 22) dead-end walkway | 0.6 | Bones at dead-end platform --- signals "reward here" |
| rpg-skull (general) | (22, 14) blood river edge | 0.4 | Skull at blood surface level |

**Lighting:** 6x torch-sconce-ornate (general) on walkway pillars, hot orange `#ff5500`, radius 5 cells, offsetY=1.5. Red ambient fog `#2a0808` density 0.05.
**Platforming:** Blood floor at elevation 0 (FLOOR_LAVA, 2 DPS). Walkways at +0.5 (FLOOR_RAISED). Three branching paths with dead-end loot platforms.

> **Playtest note:** Blood River had 6 torches in 280 cells --- visually sparse. Now 15 props including walkway pillars, blood arches, blood pools, gutters, and bones. The blood river arch at the main junction is the room's visual hero piece.

---

### Room: River Banks (8x6, exploration, sortOrder=2)

**Player Experience:** Muddy shoreline. You climb out of the blood onto wet earth and breathe --- but the bleeding does not stop. The room is small, transitional, a brief gasp between horrors. A fireGoat patrols here, punishing hesitation. Two barrels mark supplies.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-industrial-arch | north door | 0.8 | face-north | Arch framing blood river entrance |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-blood-cauldron | (10, 21) near north entrance | 0.8 | Blood-filled cauldron overflowing from river |
| bone-pile (general) | (14, 23) south half | 0.5 | Bones washed up on river bank |
| rubble-pile-small (general) | (8, 22) west side | 0.4 | Stone debris at shore edge |

**Lighting:** 1x torch-sconce-ornate (general) on north wall, orange `#ff5500`, radius 5 cells, offsetY=2.0. Higher ceiling (4 units) after claustrophobic river.
**Platforming:** Floor slopes upward north-to-south via RAMP cells, 0 to +0.25. Gentle rise from blood shore.

> **Playtest note:** River Banks is a transitional room --- brevity is correct. Added bones and rubble for shore atmosphere. 5 props in 48 cells is appropriate for a brief gasp between horrors.

---

### Room: Thorny Passage (6x16, platforming, sortOrder=3)

**Player Experience:** A narrow gauntlet of pain. Rust-red thorn walls press in from both sides, leaving a 3-cell-wide corridor. Every wall is a hazard --- 5 damage on contact. The passage weaves upward and then back down through four elevation changes. Missing a dodge means skidding into thorns. Two fireGoats hold the high ground, firing downhill.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-thorn-column | along both walls, 8 positions | 1.0 | face-inward | Thorn-covered wall protrusions, Rust003/007 texture |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-blood-pool | (46, 22) base of first ramp | 0.6 | Small blood puddle at thorn base |
| rope-hanging (general) | (47, 25), (47, 29) ceiling | 0.5 | Hanging rope markers at passage midpoints |
| spike-bed-small (general) | (45, 20), (45, 32) ramp transitions | 0.6 | Spike clusters at ramp elevation changes |

**Lighting:** Sparse --- 2x torch-sconce-simple (general) at passage entry and exit only, dim red `#cc3300`, radius 3 cells. Thorns obscure light.
**Platforming:** Four RAMP elevation changes: 0->+1, +1->+2 (peak), +2->+1, +1->0. Hill-shaped profile. fireGoat at peak (+2) has commanding sightline. 3-cell-wide safe corridor throughout.

> **Playtest note:** Thorny Passage had 2 rope props in 96 cells. Now 11 props: 8 thorn-column wall protrusions (structural) visually sell the hazard, plus spikes at ramp transitions and blood puddles. The thorn columns are the key addition --- they communicate "these walls are dangerous" before the player touches them.

---

### Room: Thornwood (14x12, exploration, sortOrder=4)

**Player Experience:** A dense forest of thorny columns. You cannot see more than 6 cells in any direction. The columns are everywhere --- irregular, 1-2 cell clusters, all thorned, all lethal on contact. You cannot hug cover because cover hurts. Combat happens in the narrow lanes between columns. The bleeding clock never stops.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-thorn-column | 18 positions (irregular grid) | 1.0 | varies | Thorny structural columns creating lane network |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-blood-pool | (40, 42) center lane intersection | 0.5 | Small blood puddle at lane crossroads |
| violence-sawblade-decoration | (37, 39) north wall | 0.8 | Wall-mounted sawblade near entrance |
| dead-tree (general) | (38, 40), (42, 46), (36, 48) | 0.8 | Dead thorn-trees --- the "thornwood" name made literal |
| bone-pile (general) | (39, 43), (44, 41), (37, 47), (43, 49) | 0.5 | Bones at dead-end column clusters |
| rpg-skull (general) | (41, 44), (38, 48) | 0.4 | Skull breadcrumbs at lane intersections |

**Lighting:** 1x torch-sconce-simple (general) at south exit only, dim red `#cc3300`, radius 3 cells, offsetY=2.0. Columns create deep shadows. Low ceiling (3.5 units).
**Platforming:** Flat (elevation 0). No elevation changes. The spatial challenge is navigating the column maze, not vertical platforming.

> **Playtest note:** Thornwood had the worst prop density in Circle 7 --- 1 torch in 168 cells. Now 10+ props: dead trees make the "thornwood" name literal, bone piles at dead-end clusters reward/punish exploration, and skull breadcrumbs at intersections give subtle navigation cues. The structural thorn columns (18 positions) provide the core visual identity.

---

### Room: Burning Shore (18x10, exploration, sortOrder=5)

**Player Experience:** After the claustrophobic thorns, the expanse is physical relief --- for one second. Then a fire geyser erupts 3 cells away. Then four fireGoats start shooting across 18 cells of open ground. There is no cover. No walls to hide behind. No columns to duck around. Just you, open cracked sandstone, and fire from every direction.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| (none) | --- | --- | --- | Deliberate emptiness --- no structural cover |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-fire-geyser-vent | 6 positions (2x2 zones matching env fire zones) | 1.0 | Scorched floor vents marking geyser eruption points --- CRITICAL visual landmark for damage zones |
| fire-pit-small (general) | (20, 56), (26, 60) | 0.6 | Small fire pits between geyser zones |
| rubble-pile-small (general) | (22, 58) | 0.5 | Scattered boulders for minimal visual break |

**Lighting:** No fixed lights. Fire geyser eruptions provide periodic flashes (`#ffaa00`, radius 8 cells, 2s duration). Open cavern void above.
**Platforming:** Flat (elevation 0). No elevation changes. The openness IS the spatial element after cramped corridors.

> **Playtest P0:** Burning Shore had 0 props in 180 cells --- the emptiness was described as "deliberate" but without `violence-fire-geyser-vent` at geyser positions, players have NO visual reference for where eruptions happen until they take damage. The 6 geyser vents are critical gameplay-impacting props. A few scattered fire pits and rocks provide minimal visual break without undermining the deliberate emptiness concept.

---

### Room: Flamethrower Shrine (6x6, exploration, sortOrder=6)

**Player Experience:** A small sacred space. Almost a tomb. The architecture shifts from rusted industrial to reverent stone. A single warm gold light burns behind a stone altar holding the Brimstone Flamethrower. This is the only warm light in the entire circle. The Cauldron beside the altar is cold and empty --- a first. You pick up the weapon and read: "The wilderness gave you fire. Use it."

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-stone-altar | (24, 71) center | 1.0 | face-north | 2x2 FLOOR_RAISED altar slab for weapon display |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-blood-cauldron | (23, 72) beside altar | 0.7 | Cold, empty cauldron --- contrast to blood-filled ones |
| bone-column (general) | (23, 69), (25, 69) flanking entrance | 0.7 | Bone columns flanking shrine entrance |
| skull-candelabra (general) | (24, 70) behind altar | 0.8 | Skull-mounted candelabra behind weapon display |

**Lighting:** 1x skull-candelabra (general) behind altar, warm gold `#ffcc44`, radius 4 cells. 2x torch-sconce-ornate (general) flanking entrance, warm gold. Stark contrast to red-orange palette elsewhere.
**Platforming:** Altar is 2x2 FLOOR_RAISED (+0.5 elevation). Vaulted ceiling (3.5 units) with slight dome shape.

> **Playtest note:** Shrine was already good at 4 props in 36 cells. Added bone columns flanking entrance and skull candelabra behind altar for reverent atmosphere. The shrine is intimate by design --- now 7 props.

---

### Room: Slaughterhouse (14x12, arena, sortOrder=7)

**Player Experience:** Industrial abattoir. Metal grating floor. Meat hooks swaying from the ceiling in a 3x3 grid. Harsh yellow industrial light. Crates for partial cover. The door locks behind you. Three waves of enemies. The Flamethrower proves its worth here --- close quarters, armored enemies, tight corridors. Between waves, hooks DROP from the ceiling, becoming floor obstacles. The room reshapes itself.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-industrial-arch | north entrance | 1.0 | face-south | Industrial archway framing arena entry |
| violence-chain-conveyor | ceiling, 3 rows N-S | 1.2 | face-east | Overhead conveyor rails for hanging hooks |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| meat-hook | 9 ceiling positions (3x3 grid) | 1.0 | Hanging meat hooks (drop as hazards waves 2-3) |
| violence-metal-crate-stack | 4 positions, walls | 1.0 | Waist-high partial cover (breakable) |
| violence-butcher-block | (25, 83) center | 1.0 | Butchery work surface, atmosphere |
| violence-rusted-anvil | (19, 79) NW corner | 1.0 | Industrial butchery tool |
| violence-bone-grinder | (30, 85) SE area | 1.0 | Bone processing machine, atmosphere |
| violence-blood-gutter | (22, 86) center south | 1.0 | Floor drainage channel |
| violence-hook-rack | (25, 80) north center | 1.0 | Secondary hook display rack |
| violence-sawblade-decoration | (18, 82) west wall | 0.8 | Wall-mounted sawblade |

**Lighting:** 4x torch-sconce-ornate (general) on walls, industrial yellow `#ccaa33`, radius 4 cells, offsetY=2.5. Ceiling at 4 units.
**Platforming:** Flat (elevation 0). Hooks drop from ceiling (offsetY=-0.5 to 0) between waves, creating 1x1 ground obstacles (3 damage contact).

> **Playtest note:** Slaughterhouse was already the densest room in Circle 7 (22 props in 168 cells). Now uses circle-specific Meshy props: meat-hook, violence-metal-crate-stack, violence-rusted-anvil, violence-bone-grinder, violence-blood-gutter, violence-hook-rack, violence-sawblade-decoration, violence-chain-conveyor, and violence-industrial-arch for full industrial abattoir identity.

---

### Room: Butcher's Hook (6x6, secret, sortOrder=8)

**Player Experience:** Hidden supply cache. A cramped storage room packed with metal crates and barrels. Two ammo pickups, two health pickups --- critical supplies given the constant bleeding. A dim lantern provides the only light. The reward for exploring behind the Slaughterhouse wall.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| (none) | --- | --- | --- | Small room, no structural props needed |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| violence-metal-crate-stack | (37, 83), (40, 83) corners | 1.0 | Storage crates at varying heights |
| violence-blood-gutter | (38, 85) floor center | 0.6 | Blood drain in storage floor |

**Lighting:** 1x torch-sconce-simple (general) on north wall, dim yellow `#ccaa33`, radius 3 cells, offsetY=2.5.
**Platforming:** Flat (elevation 0). Crate stacks at varying heights (1-3 cells) create cramped storage feel.

> **Playtest note:** Added blood gutter to floor for atmosphere. Uses torch-sconce-simple for lighting. 5 props in 36 cells is appropriate for a secret cache room.

---

### Room: Il Macello's Abattoir (16x16, boss, sortOrder=9)

**Player Experience:** The final room. Massive. The floor is a metal grating suspended over absolute void --- you can see the blackness below through the grate. The grating is divided into a 4x4 grid of retractable panels. Eight meat hooks hang from the ceiling. Four deep orange torches mark the corners. A massive chandelier hangs from the center of a vaulted 5-unit ceiling. Wall-mounted swords and shields --- trophies of defeated warriors. And in the center, Il Macello. The Butcher. The largest enemy you have ever seen. He speaks: "Meat. That is all you are. Meat on hooks."

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| violence-industrial-arch | north entrance | 1.2 | face-south | Massive archway framing boss arena entry |
| violence-grating-panel | 16 positions (4x4 grid, 3x3 each) | 1.0 | flat | Retractable floor panels over void |
| violence-chain-conveyor | ceiling, spanning N-S | 1.5 | face-east | Overhead conveyor rail (boss rips chain from this) |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| meat-hook | 8 ceiling positions | 1.2 | Hanging meat hooks, vertical obstacles |
| violence-industrial-cage | (19, 96), (31, 96) north corners | 1.0 | Industrial cages flanking entrance |
| violence-sawblade-decoration | south wall, 2 positions | 1.0 | Wall-mounted sawblades as trophies |
| violence-blood-pool | center floor (cosmetic) | 1.5 | Blood stain on grating surface |
| violence-bone-grinder | (19, 108) SW corner | 0.8 | Processing equipment, atmosphere |
| violence-blood-gutter | (25, 100) center floor | 0.8 | Blood drain channel across grating |
| violence-hook-rack | (31, 108) SE corner | 0.8 | Secondary hook display rack |
| violence-butcher-block | (19, 103) west side | 0.8 | Butchery work surface, atmosphere |

**Lighting:** 4x torch-sconce-ornate (general) at corners, deep orange `#dd4400`, radius 6 cells, offsetY=2.5. 1x chandelier-iron (general) center ceiling, dim, flickers during phase transitions, offsetY=-1.0. Ceiling at 5 units (grand height).
**Platforming:** Floor at elevation -1 (below main level). 4x4 grid of 3x3 retractable panels. Phase 3: panels retract edges-inward every 4 seconds, revealing FLOOR_VOID. After 40 seconds, only 6x6 center remains. Falling through = 15 damage + teleport to random remaining panel.

> **Playtest note:** Boss room was adequate at 17 props in 256 cells. Added blood gutter, hook rack, and butcher block for 22 total props. All props use circle-specific Meshy models. The grating panels (violence-grating-panel x16, structural) serve double duty as visual indicators for the retractable floor mechanic.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Used In |
|---------|------|----------|---------|
| blood-trough | Blood Trough | exists | Pier, Blood River |
| meat-hook | Meat Hook | exists | Slaughterhouse, Abattoir |
| torture-rack | Torture Rack | exists | (available, not currently placed) |
| violence-blood-cauldron | Blood Cauldron | exists | Pier, River Banks, Shrine |
| violence-blood-gutter | Blood Gutter | exists | Slaughterhouse, Butcher's Hook, Abattoir |
| violence-blood-pool | Blood Pool | exists | Blood River, Thorny Passage, Thornwood, Abattoir |
| violence-blood-river-arch | Blood River Arch | exists | Blood River (hero piece) |
| violence-bone-grinder | Bone Grinder | exists | Slaughterhouse, Abattoir |
| violence-butcher-block | Butcher Block | exists | Slaughterhouse, Abattoir |
| violence-chain-conveyor | Chain Conveyor | exists | Slaughterhouse, Abattoir |
| violence-fire-geyser-vent | Fire Geyser Vent | exists | Burning Shore x6 (P0 critical) |
| violence-grating-panel | Grating Panel | exists | Abattoir (structural, x16) |
| violence-hook-rack | Hook Rack | exists | Slaughterhouse, Abattoir |
| violence-industrial-arch | Industrial Arch | exists | Pier, River Banks, Slaughterhouse, Abattoir |
| violence-industrial-cage | Industrial Cage | exists | Abattoir |
| violence-iron-railing | Iron Railing | exists | Pier, Blood River |
| violence-metal-crate-stack | Metal Crate Stack | exists | Slaughterhouse, Butcher's Hook |
| violence-pier-overlook | Pier Overlook | exists | Pier |
| violence-riveted-pipe-pillar | Riveted Pipe Pillar | exists | (available, not currently placed) |
| violence-rusted-anvil | Rusted Anvil | exists | Slaughterhouse |
| violence-rusted-walkway-platform | Rusted Walkway Platform | exists | Blood River (dead-end platforms) |
| violence-sawblade-decoration | Sawblade Decoration | exists | Thornwood, Slaughterhouse, Abattoir |
| violence-stone-altar | Stone Altar | exists | Flamethrower Shrine |
| violence-thorn-column | Thorn Column | exists | Thorny Passage x8, Thornwood x18 |
| violence-walkway-pillar | Walkway Pillar | exists | Pier, Blood River x6 |

**General library props used in this circle:**

| Prop ID | Name | Manifest | Used In |
|---------|------|----------|---------|
| bone-column | Bone Column | exists | Shrine |
| bone-pile | Bone Pile | exists | Pier, Blood River, River Banks, Thornwood |
| chandelier-iron | Iron Chandelier | exists | Abattoir |
| dead-tree | Dead Tree | exists | Thornwood x3 |
| fire-pit-small | Small Fire Pit | exists | Burning Shore x2 |
| rope-hanging | Hanging Rope | exists | Thorny Passage x2 |
| rpg-skull | RPG Skull | exists | Pier, Blood River, Thornwood |
| rubble-pile-small | Small Rubble Pile | exists | River Banks, Burning Shore |
| skull-candelabra | Skull Candelabra | exists | Shrine |
| spike-bed-small | Small Spike Bed | exists | Thorny Passage x2 |
| torch-sconce-ornate | Ornate Torch Sconce | exists | Pier, Blood River, River Banks, Shrine, Slaughterhouse, Abattoir |
| torch-sconce-simple | Simple Torch Sconce | exists | Thornwood, Butcher's Hook |

**Summary:** All 25 circle-specific Meshy props have existing manifests. All general library props have existing manifests. No new manifests needed for Circle 7.
