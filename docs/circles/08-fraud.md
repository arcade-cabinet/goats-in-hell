---
title: "Circle 8: Fraud"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 8
sin: deception
boss: Inganno
act: 3
build_script: scripts/build-circle-8.ts
mechanic: mimic-enemies
related:
  - docs/circles/00-player-journey.md
  - docs/circles/playtest-act3.md
  - docs/agents/level-editor-api.md
---

# Circle 8: Fraud — Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Playability

| Metric | Target | Notes |
|--------|--------|-------|
| Target play time | 12–18 min | Shifting walls and illusion maze can disorient, extending exploration. |
| Estimated play time | TBD (computed after build) | |
| Path distance | TBD | |
| Room count | 9 rooms + 1 boss | from Room Placement table |
| Enemy count | 21 enemies + boss + mimics | from enemy placement |

### Pacing Notes
Fraud's mimic mechanic introduces a new layer of caution — players must sweep pickups with the flamethrower before collecting, adding time to every room. The Shifting Maze is the primary pacing wildcard: disoriented players can loop back through previously cleared rooms, significantly extending play time. Tension peaks at the Hall of Mirrors arena and at the False Treasury where every prop is potentially a mimic. The boss fight with Inganno's phase-shift deception serves as a fitting climax to a circle built on betrayed expectations.

---

## Identity

**Circle:** 8 (Fraud — Malebolge)
**Sin:** Deception
**Boss:** Inganno — beautiful deceiver, Geryon-faced (Dainir female base, intentionally appealing exterior concealing serpentine true form)
**Dominant Mechanic:** Mimic enemies (some pickups are enemies in disguise, attack on proximity within 2 cells)
**Dante Quote:** *"Luogo è in inferno detto Malebolge, tutto di pietra di color ferrigno, come la cerchia che dintorno il volge."* (There is a place in Hell called Malebolge, all of stone and of an iron color, as is the cliff that circles round about it.)

**Feel:** Beauty is a weapon. The palace dazzles — marble floors, silk banners, candlelit warmth. Then the health pickup bites your face off. Every object, every ally, every path is potentially a lie. The flamethrower becomes a dowsing rod — sweep before you touch, burn before you trust. This circle teaches: **nothing is what it seems.**

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Polished white marble, veined | Marble006, Marble012 | Palatial, deceptively beautiful |
| Floor | Ornate stone tile, warm cream | Tiles074, Tiles092 | Elegant paving, geometric patterns |
| Fabric draping | Rich silk in deep red/gold | Fabric026, Fabric045 | Wall-mounted banner textures |
| Revealed truth | Corroded rust beneath marble | Rust003, Rust007 | Boss phase 3 texture swap target |
| Column accents | Dark onyx, mirror-polished | Onyx002, Onyx008 | Reflective surfaces (Hall of Mirrors) |
| Ceiling | Coffered marble, gilded edges | Marble019 | Ornate overhead |
| Secret room | Unfinished rough marble | Marble001 over Tiles074 | Raw, honest — the only genuine room |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Portico through Hall of Mirrors | 0.02 | `#2a1a0e` | Warm amber haze, luxurious |
| Bolgia rooms | 0.03 | `#221810` | Slightly thicker, golden murk |
| Shifting Maze | 0.06 | `#1a1208` | Disorienting, can't see far |
| Boss phase 3 reveal | 0.01 | `#0d0805` | Fog clears — truth is visible |

### Lighting

- Ambient: `#ffcc88` at intensity 0.20 (warm gold, inviting — a lie)
- Point lights from blood-candle, candelabrum-tall, chandelier-iron props (warm `#ffaa44`, radius 5 cells)
- Soft directional fill from above at intensity 0.08 (simulates palace skylights)
- Boss chamber: chandelier-iron overhead (warm), shifts to cold blue `#4466cc` in phase 3 reveal
- Hall of Mirrors: additional specular highlights from Onyx walls, intensity 0.25

### Props (Meshy AI + General Library)

All props use bespoke Meshy AI-generated models or general library assets. See **## 3D Spatial Design** for per-room placement details and **### Prop Manifest Inventory** for the full asset list.

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Rust003 patches | Beneath marble seams (subtle) | Truth bleeding through the facade |
| Leaking001 | Ceiling corners in Bolgia rooms | Moisture from above — the lie sweats |

---

## Room Layout

### Overview (9 rooms)

```
         ┌──────────┐
         │ PORTICO  │  (10×6, exploration, sortOrder=0)
         │ Spawn ★  │  Beautiful entrance. Safe... for now.
         └────┬─────┘
              │ corridor (width=3, marble-lined)
         ┌────┴──────────┐
         │ HALL OF MIRRORS│  (14×10, exploration, sortOrder=1)
         │ Reflections    │  Polished onyx walls. shadowGoats in reflections.
         └──┬─────────┬──┘
            │         │ corridor (width=2)
   ┌────────┴──┐  ┌───┴──────────┐
   │ BOLGIA OF │  │ BOLGIA OF    │
   │ FLATTERERS│  │ THIEVES      │  (10×8, exploration, sortOrder=3)
   │ (12×8)    │  │ Items vanish │
   │ sortOrd=2 │  └───┬──────────┘
   └────┬──────┘      │ corridor (width=2)
        │         ┌───┴──────────┐
        │         │ SHIFTING MAZE│  (14×14, exploration, sortOrder=4)
        │         │ Walls move   │
        │         └───┬──────────┘
        │ corridor    │ corridor (width=2)
        │ (width=2)   │
        └──────┬──────┘
          ┌────┴──────────┐
          │ COUNTERFEIT   │  (12×12, arena, sortOrder=5)
          │ ARENA         │  Columns = mimics. Ramps = real cover.
          └────┬──────────┘
               │ corridor (width=2)
          ┌────┴──────┐──secret──┐
          │ MIMIC'S   │          │
          │ DEN (8×8) │     ┌────┴────────┐
          │ sortOrd=6 │     │ SERENISSIMA │ (6×6, secret, sortOrder=7)
          └────┬──────┘     │ Real loot   │ WALL_SECRET entrance
               │            └─────────────┘
               │ stairs (elevation: 0→-1)
          ┌────┴──────────┐
          │ INGANNO'S     │  (14×14, boss, sortOrder=8)
          │ PARLOR        │  Elegant sitting room → serpentine horror.
          └───────────────┘
```

### Grid Dimensions

**60 wide × 90 deep** (120 × 180 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Portico | 25 | 2 | 10 | 6 | exploration | 0 | 0 |
| Hall of Mirrors | 23 | 12 | 14 | 10 | exploration | 0 | 1 |
| Bolgia of Flatterers | 8 | 26 | 12 | 8 | exploration | 0 | 2 |
| Bolgia of Thieves | 34 | 26 | 10 | 8 | exploration | 0 | 3 |
| Shifting Maze | 32 | 38 | 14 | 14 | exploration | 0 | 4 |
| Counterfeit Arena | 22 | 56 | 12 | 12 | arena | 0 (center raised +1) | 5 |
| Mimic's Den | 24 | 72 | 8 | 8 | exploration | 0 | 6 |
| Serenissima | 36 | 72 | 6 | 6 | secret | 0 | 7 |
| Inganno's Parlor | 21 | 84 | 14 | 14 | boss | -1 (below) | 8 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Portico | Hall of Mirrors | corridor | 3 | Grand entrance, marble-lined |
| Hall of Mirrors | Bolgia of Flatterers | corridor | 2 | West branch |
| Hall of Mirrors | Bolgia of Thieves | corridor | 2 | East branch |
| Bolgia of Flatterers | Counterfeit Arena | corridor | 2 | Reconnects west path to main |
| Bolgia of Thieves | Shifting Maze | corridor | 2 | East path continues |
| Shifting Maze | Counterfeit Arena | corridor | 2 | Maze exit to arena |
| Counterfeit Arena | Mimic's Den | corridor | 2 | Descent begins |
| Mimic's Den | Serenissima | secret | 2 | WALL_SECRET on east wall |
| Mimic's Den | Inganno's Parlor | stairs | 3 | Descending stairs, ornate banister |

---

## Entities

### Enemies (21 total + boss + mimics)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Hall of Mirrors | mimic | 3 | Patrol near walls; visible only in "reflections" until 4-cell range | Gray, cyan eyes |
| Bolgia of Flatterers | mimic | 2 | Disguised as friendly silhouettes at far end, attack when player reaches center | Green, deceptive |
| Bolgia of Flatterers | mimic | 2 | Pickup disguise (health), attack within 2 cells | Pickup-shaped |
| Bolgia of Thieves | mimic | 2 | Appear when pickups "vanish," replace stolen items | Gray, cyan eyes |
| Bolgia of Thieves | mimic | 1 | Patrol among shifting items | Green |
| Shifting Maze | mimic | 4 | Patrol corridors, exploit maze shifts, prevent dead time during navigation | Gray |
| Shifting Maze | mimic | 3 | Guard key junctions, prevent dead time during navigation | Green |
| Counterfeit Arena wave 1 | mimic | 3 | Spawn from edges, converge | Green |
| Counterfeit Arena wave 2 | mimic | 2 | Spawn during wave 2, flank from ramps | Gray |
| Counterfeit Arena mimics | mimic | 4 | Disguised as 4 of 6 "columns," attack on approach | Column-shaped |
| Mimic's Den | mimic | 4 | Mixed among 8 real pickups — 50% are mimics | Pickup-shaped |
| Boss chamber | Inganno | 1 | Boss AI, 3 phases | boss-inganno.glb |

### Mimic Mechanics

Mimics are a special enemy type unique to Circle 8:
- **Appearance:** Identical to health, ammo, or coin pickups until player enters 2-cell radius
- **Reveal:** Pop animation — pickup model shatters, mimic enemy unfolds (spider-like legs from beneath)
- **Stats:** HP 6, speed 1.5x mimic. First mimic encounter: 10 damage. All subsequent mimics: 15 damage.
- **Counter:** Flamethrower AoE triggers mimics at safe distance (3-cell flame range > 2-cell trigger range)
- **Total mimics in level:** 10 (2 Flatterers + 4 Arena + 4 Den)

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Portico | ammo | (29, 5) | Safe — establishes false trust |
| Portico | health | (27, 4) | Safe — the palace provides |
| Hall of Mirrors | ammo | (28, 16) center | Real pickup among reflections |
| Bolgia of Flatterers | health | (12, 30) NE | MIMIC — attacks on approach |
| Bolgia of Flatterers | ammo | (16, 32) SE | MIMIC — attacks on approach |
| Bolgia of Flatterers | ammo | (10, 28) NW | Real, hidden behind banner |
| Bolgia of Thieves | health | (38, 28) N | Vanishes on approach, reappears elsewhere |
| Bolgia of Thieves | ammo × 2 | (36, 32), (40, 30) | Shuffle positions when player turns away |
| Shifting Maze | ammo | (38, 44) center | Real, at maze solution midpoint |
| Shifting Maze | health | (42, 50) near exit | Real, reward for solving maze |
| Counterfeit Arena | ammo × 2 | (25, 60), (31, 64) | Between waves, real |
| Counterfeit Arena | health | (28, 58) N center | Between waves, real |
| Mimic's Den | health × 4 | (25,73), (27,75), (29,77), (31,73) | 2 real, 2 MIMIC (random per run) |
| Mimic's Den | ammo × 4 | (26,74), (28,76), (30,74), (25,78) | 2 real, 2 MIMIC (random per run) |
| Serenissima | health × 2 | (38, 74), (40, 76) | ALL real — irony of the secret room |
| Serenissima | ammo × 2 | (39, 73), (39, 77) | ALL real |
| Boss chamber | ammo × 2 | (23, 86), (33, 96) | NW, SE corners |
| Boss chamber | health × 2 | (33, 86), (23, 96) | NE, SW corners |
| Portico | fuel | Near exit | Starting fuel |
| Counterfeit Arena | fuel | Center, between waves | Arena resupply |
| Inganno's Parlor | fuel | NE corner | Boss arena fuel |

### Props (non-interactive, per room)

| Room | Props (count) | Key Assets |
|------|---------------|------------|
| Portico | 12 props | fraud-ornate-arch, fraud-ornate-railing, fraud-two-faced-bust, fraud-golden-banner x2, fraud-marble-pedestal x2, chandelier-iron (general) x2, candelabrum-tall (general) x4 |
| Hall of Mirrors | 14 props | fraud-onyx-wall-panel x6 (structural), fraud-ornate-arch x2, fraud-mirror-shard x3, fraud-marble-pedestal x2, candelabrum-tall (general) x4 |
| Bolgia of Flatterers | 12 props | fraud-ornate-arch, fraud-ramp-platform, fraud-silhouette-prop x4, fraud-golden-banner x2, fraud-forked-tongue-relief, fraud-coin-pile, candelabrum-tall (general) x2 |
| Bolgia of Thieves | 10 props | fraud-ornate-arch, fraud-coin-pile x3, fraud-marble-pedestal, trick-chest x2, false-door, candelabrum-tall (general) x2 |
| Shifting Maze | 12 props | fraud-shifting-wall-segment x6 (structural), fraud-cracked-mosaic-floor x4, torch-sconce-ornate (general) x2 |
| Counterfeit Arena | 11 props | fraud-fake-column x6 (4 mimic hosts), fraud-ramp-platform x2, fraud-ornate-arch x2, fraud-cracked-mosaic-floor, fraud-crumbling-facade |
| Mimic's Den | 7 props | fraud-coin-pile x2, fraud-forked-tongue-relief, fraud-gambling-table, torch-sconce-ornate (general) x2 |
| Serenissima | 7 props | chest-gold (general), carpet (general), book-open (general), candle (general) x2, cobweb (general) x2 |
| Inganno's Parlor | 19 props | fraud-ornate-arch, fraud-ornate-railing, fraud-broken-chandelier, fraud-golden-banner x2, fraud-two-faced-bust, fraud-crumbling-facade, fraud-marble-debris x2, fraud-stage-curtain x2, fraud-forked-tongue-relief, bookcase (general) x2, candelabrum-tall (general) x4 |
| **Total** | **~104 props** | **22 circle-specific + general library** |

---

## Room Details

### Room 1: Portico (10×6)

```
     N
  ┌──────────────────┐
  │ ☆Vase     ☆Vase  │
  │                   │
  │  ♦ammo   ♦health │
  │                   │
  │     ★ SPAWN      │  ← Player starts center, facing N
  │                   │
  └────────┬──────────┘
           ↓ corridor S (width=3)
           ↓ to Hall of Mirrors
```

- **Elevation:** Flat (0). Polished Tiles074 floor.
- **Feel:** Grand foyer. fraud-ornate-arch frames the south entrance. Two chandelier-iron (general) overhead cast warm pools of light. candelabrum-tall (general) line the walls. fraud-golden-banner drape from east and west walls. fraud-two-faced-bust on a marble pedestal is the first subtle hint of deception. fraud-marble-pedestal display positions flank the entrance. fraud-ornate-railing provides decorative marble balustrade. Everything is beautiful. Safe pickups build false trust --- the palace welcomes you.
- **3D elements:** Tall ceiling (3 cells high), chandeliers hang at 2.5 cell height. Pedestals at 0.3 cell height.

### Room 2: Hall of Mirrors (14×10)

```
           ↓ from Portico
     N
  ┌────────┴─────────────────────┐
  │ ◇onyx   ◇onyx   ◇onyx      │  ← Polished onyx wall panels (reflective)
  │                              │
  │   👻sg          👻sg         │  ← shadowGoats patrol near walls
  │                              │
  │            ♦ammo             │  ← Real pickup, center
  │                              │
  │   👻sg                       │  ← Third mimic
  │                              │
  │ ◇onyx   ◇onyx   ◇onyx      │
  └──┬───────────────────────┬───┘
     ↓ corridor W             ↓ corridor E
     ↓ to Flatterers          ↓ to Thieves
```

- **Elevation:** Flat (0). Marble006 floor, Onyx002 wall panels.
- **Mechanic:** fraud-onyx-wall-panel (6 positions along N/S walls) create "reflections." shadowGoats are visible only as reflections on the wall panels --- the actual enemy is on the opposite side of the room from its reflection. Player must shoot the real position, not the reflection. Shots that hit the reflective onyx panels bounce at 50% damage (lower than Circle 9's 75%). fraud-ornate-arch frames the west/east exit corridors. fraud-mirror-shard clusters between onyx panels provide specular highlights. fraud-marble-pedestal near columns display positions. This is a gentler introduction to the reflected shots mechanic that fully manifests in Circle 9. A tooltip on the first reflected shot: *"These walls turn your weapons against you."*
- **3D elements:** fraud-onyx-wall-panel protrude 0.5 cells from walls, creating shallow alcoves between them. Ceiling at 2.5 cells. candelabrum-tall (general, 4 positions) light reflects off onyx creating specular highlights.
- **Flow:** Two exits — west to Bolgia of Flatterers, east to Bolgia of Thieves. Both paths eventually reconnect at the Counterfeit Arena.

### Room 3: Bolgia of Flatterers (12×8)

```
           ↓ from Hall of Mirrors (W exit)
     N
  ┌────────┴─────────────────┐
  │ 🎭🎭🎭🎭                │  ← "Friendly" silhouettes (enemies) at far N
  │                          │
  │   ☠mimic(hp) ☠mimic(am) │  ← Mimic pickups in center/E
  │                          │
  │ ♦ammo                   │  ← Real ammo, hidden behind fraud-silk-drape on W wall
  │     (behind banner)      │
  │                          │
  │   📜scroll   🍷chalice   │  ← fraud-gilded-throne with props
  └────┬─────────────────────┘
       ↓ corridor S to Counterfeit Arena
       │
  ← WALL_SECRET on S wall (real exit behind you)
```

- **Elevation:** Flat (0), slight step-up (+0.5) at north end where silhouettes stand.
- **Mechanic:** Four fraud-silhouette-prop "friendly NPC" cutouts at the far end wave and beckon. fraud-ornate-arch frames the north entrance. fraud-ramp-platform creates the +0.5 elevation north platform. As the player approaches center, the mimic pickups attack and the silhouettes reveal as mimic enemies charging. The real exit is behind --- a WALL_SECRET on the south wall that the player walked past on entry. The lesson: what invited you in wants to kill you; the way out is where you came from.
- **Flamethrower counterplay teach:** After the player's first mimic encounter, a tooltip appears: *"The Flamethrower reveals what is hidden. Sweep before you reach."* The flamethrower's 3-cell range exceeds the mimic trigger radius (2 cells), allowing the player to safely expose mimics from outside their attack range.
- **First mimic damage reduction:** The first mimic deals 10 damage (reduced from 15). Subsequent mimics deal 15 damage. This gives the player a survivable first surprise.
- **3D elements:** fraud-ramp-platform at north end (+0.5 cells elevation) where fraud-silhouette-prop stand. fraud-golden-banner on N wall (2 positions), one concealing the real ammo pickup. fraud-forked-tongue-relief on south wall. fraud-coin-pile near table. candelabrum-tall (general) on E/W walls for warm gold lighting.
- **Flow:** Ingress from north (Hall of Mirrors), egress via south corridor to Counterfeit Arena OR back through WALL_SECRET.

### Room 4: Bolgia of Thieves (10×8)

```
           ↓ from Hall of Mirrors (E exit)
     N
  ┌────────┴─────────────┐
  │ 💰pile  ♦health      │  ← Pickup that vanishes on approach
  │                      │
  │     🔀 SHUFFLE ZONE  │  ← Items swap positions when player turns
  │                      │
  │ ♦ammo    💰pile      │  ← Decoy positions
  │                      │
  │   👻sg     🐐hg      │  ← Enemies appear where pickups were
  │     👻sg             │
  └──────────┬───────────┘
             ↓ corridor S to Shifting Maze
```

- **Elevation:** Flat (0). trick-chest props on low pedestals (0.3 cells).
- **Mechanic:** Trigger-based entity swapping. When the player approaches a pickup location, the pickup despawns and an enemy or empty space appears. When the player turns around (facing direction > 90 degrees from pickup), remaining pickups shuffle positions. trick-chest props open to reveal nothing --- or a mimic. fraud-ornate-arch frames the north entrance. false-door on east wall reinforces the deception theme.
- **3D elements:** Three fraud-coin-pile props on floor at varying heights on small raised platforms (0, 0.3, 0.5 cells). fraud-marble-pedestal at center for display. candelabrum-tall (general) on N/S walls for lighting.
- **Flow:** Ingress from north (Hall of Mirrors), egress south to Shifting Maze.

### Room 5: Shifting Maze (14×14)

```
             ↓ from Bolgia of Thieves
     N
  ┌──────────┴───────────────────────┐
  │ ╔═══╗       ╔═══╗               │
  │ ║   ║  👻sg ║   ║   🐐hg       │
  │ ║   ╠═══════╣   ║              │
  │ ║   ║       ║   ╠════╗         │
  │ ╚═══╝  ♦ammo╚═══╝    ║         │  ← Walls shift when not observed
  │              🐐hg    ║         │
  │ ╔═══╗       ╔═══╗    ║         │
  │ ║   ║  👻sg ║   ║    ║         │
  │ ║   ╠═══════╣   ╠════╝         │
  │ ║   ║ ♦health║   ║              │
  │ ╚═══╝       ╚═══╝              │
  └──────────────────────┬──────────┘
                         ↓ corridor S to Counterfeit Arena
```

- **Elevation:** Flat (0). Maze walls are WALL_STONE (1 cell thick, 2 cells high).
- **Mechanic:** fraud-shifting-wall-segment (6 moveable wall sections) shift position when the player is not looking at them (facing direction check per wall segment). Walls slide 1-2 cells laterally, opening and closing paths. The player cannot memorize the maze. fraud-cracked-mosaic-floor on the floor serve as unreliable breadcrumbs (they shift too). torch-sconce-ornate (general) on fixed outer walls are the only reliable landmarks.
- **Solvability guarantee:** The maze always maintains at least one valid path from entrance to exit. Walls shift positions when the player is not observing them (facing away), but the exit wall and entrance wall NEVER shift. A maximum of 3 walls shift per observation break. The maze has a maximum solve time of 60 seconds with direct pathing.
- **3D elements:** Maze walls are full-height (2 cells). Some walls have gaps at the top (1.5 cells high) allowing the player to see over them from FLOOR_RAISED positions, but there are no raised floors in this room — the height gap is a tease.
- **Enemies:** 4 shadowGoats patrol corridors, exploit wall shifts to ambush. 3 hellgoats guard key junctions (near pickups). Additional enemies prevent dead time during maze navigation.
- **Flow:** Ingress from north (Bolgia of Thieves), egress south to Counterfeit Arena.

### Room 6: Counterfeit Arena (12×12)

```
     ↓ from Flatterers (W path)    ↓ from Maze (E path)
     N
  ┌──┴──────────────────────────┴──┐
  │                                │
  │  ╱╲col  ╱╲col    ╱╲col       │  ← 6 "columns" — 4 are MIMICS
  │ ╱  ╲   ╱  ╲    ╱  ╲         │
  │            ♦ammo              │  ← Between-wave resupply
  │  ▓▓RAMP▓▓    ▓▓RAMP▓▓       │  ← Real cover (elevation +1)
  │  ▓▓▓▓▓▓▓▓    ▓▓▓▓▓▓▓▓       │
  │       ♦health                 │
  │  ╱╲col  ╱╲col    ╱╲col       │  ← More fake columns
  │ ╱  ╲   ╱  ╲    ╱  ╲         │
  │                ♦ammo          │
  │                                │
  └────────────┬───────────────────┘
               ↓ corridor S to Mimic's Den
```

- **Elevation:** Floor at 0. Two fraud-ramp-platform segments in center create raised platforms at +1 cell elevation. These are the ONLY real cover --- fraud-fake-column (6 positions) are mimic hosts.
- **Mechanic:** Deliberate visual callback to Circle 1's Columns room. Six fraud-fake-column arranged in familiar pattern. But 4 of the 6 are mimic enemies. Approaching for cover triggers them. fraud-ornate-arch frames the twin north entrances. fraud-cracked-mosaic-floor ornate floor pattern at center (callback to Circle 1). fraud-crumbling-facade near entrance shows marble decay. torch-sconce-ornate (general) on N/S walls. The player must learn that the ramps/platforms (ugly, utilitarian) are the true cover, not the elegant columns.
- **Arena sequence:**
  - Trigger on entry: doors lock
  - Wave 1: 3 hellgoats spawn from edges
  - Player discovers columns are mimics when seeking cover
  - Wave 1 clear + mimics defeated: resupply spawns
  - Wave 2: 2 shadowGoats spawn from ramp sides, flank
  - Wave 2 clear: doors unlock
- **3D elements:** Two ramp platforms (+1 cell, 3×2 cells each) in center. Columns are 0.5×0.5 cells, full height (2 cells). Player can stand on ramps to shoot over enemies.
- **Flow:** Ingress from north (two paths converge), egress south to Mimic's Den.

### Room 7: Mimic's Den (8×8)

```
               ↓ from Counterfeit Arena
     N
  ┌────────────┴───────────┐
  │ ♦/☠  ♦/☠              │  ← Each pickup: 50% real, 50% mimic
  │                        │
  │       🔥cauldron       │  ← Cauldron (center landmark)
  │ ♦/☠         ♦/☠       │
  │                        │
  │ ♦/☠  ♦/☠              │
  │              ♦/☠  ♦/☠ │
  │                        │
  └────┬───────────┬───────┘
       ↓ stairs    → WALL_SECRET E
       ↓ to Boss   → to Serenissima
```

- **Elevation:** Flat (0). torch-sconce-ornate (general) on east and west walls.
- **Mechanic:** 8 pickups scattered across the room (4 health, 4 ammo). On each run, 4 are randomly selected as mimics. The player must use flamethrower sweeps to safely identify which are real. The fraud-gambling-table in the center is a fixed landmark --- the one honest object. fraud-coin-pile (2 positions) scattered with pickups. fraud-forked-tongue-relief on north wall.
- **3D elements:** fraud-gambling-table sits on a slightly raised stone base (0.2 cells). torch-sconce-ornate (general) on walls at 1.8 cell height.
- **Flow:** Ingress from north (Counterfeit Arena), egress via stairs south to Inganno's Parlor, or secret east wall to Serenissima.

### Room 8: Serenissima — Secret Room (6×6)

```
     ← WALL_SECRET from Mimic's Den (W wall)
     W
  ┌──┴─────────────┐
  │ 🕯  📦chest 🕯 │  ← Genuine treasure chest, flanked by candles
  │                 │
  │ ♦health ♦health│  ← ALL real pickups — zero mimics
  │                 │
  │ ♦ammo   ♦ammo  │  ← ALL real
  │                 │
  │   📖bookstand   │  ← Lore scroll
  └─────────────────┘
     (dead end — return through secret wall)
```

- **Elevation:** Flat (0). Marble001 walls --- unfinished, rough, honest.
- **Mechanic:** The irony of Circle 8. The secret room is the ONLY room where nothing is a lie. All pickups are genuine. The chest-gold (general) contains bonus ammo. The book-open (general) holds a scroll: *"Truth hides where no one looks."* carpet (general) on floor under the chest. cobweb (general) in upper corners --- undisturbed, no one comes here. The room's raw, unfinished marble is the only honest surface in the entire circle.
- **3D elements:** Low ceiling (1.5 cells) --- intimate, cave-like. candle (general) on floor flanking chest (0 height). book-open at 1.0 cell height.
- **Flow:** Ingress/egress via WALL_SECRET on west wall (back to Mimic's Den).

### Room 9: Inganno's Parlor — Boss Chamber (14×14)

```
               ↓ stairs from Mimic's Den (elevation 0→-1)
     N
  ┌────────────┴───────────────────────┐
  │ 📚bookcase              📚bookcase│  ← Bookcases on E/W walls
  │                                    │
  │ ♦ammo              ♦health        │  ← NW, NE corners
  │                                    │
  │     🎀banner    🎀banner          │  ← Banners on N wall
  │                                    │
  │         🪑 INGANNO                │  ← Sits in fraud-gilded-throne, center-N
  │         (fraud-gilded-throne + table)│
  │                                    │
  │    🕯candle    🕯candle    🕯candle│  ← candelabrum-tall ring
  │                                    │
  │ 🕯candle                  🕯candle│
  │                                    │
  │ ♦health              ♦ammo        │  ← SW, SE corners
  │                                    │
  │         💎chandelier              │  ← Grand chandelier overhead
  └────────────────────────────────────┘
     (no exit until boss defeated)
```

- **Elevation:** -1 (descended via stairs). Floor is Tiles092. Ceiling at 3 cells (grand height).
- **Props:** fraud-ornate-arch and fraud-ornate-railing frame the north stair descent. fraud-broken-chandelier overhead (intact initially, damaged phase 3). fraud-golden-banner (N wall, 2 positions) flanking Inganno's seat. fraud-two-faced-bust near entrance. fraud-crumbling-facade on walls (phase 3 reveal). fraud-marble-debris on floor scatter (phase 3 obstacles). fraud-stage-curtain on E/W walls behind bookcases. fraud-forked-tongue-relief behind Inganno's seat. bookcase (general) on E/W walls. candelabrum-tall (general, 4 positions) on walls.
- **Boss Fight:**
  - **Phase 1 --- The Hostess (100%--60% HP):** Inganno sits in her chair. She speaks pleasantly: *"Welcome, little goat. You must be so tired. Sit. Rest."* She does not attack. Walking within 3 cells triggers the fight. She stands, summons 4 mimic pickups across the room that unfold into enemies. She fires slow charm projectiles (homing, pink glow, 8 damage) while mimics swarm.
  - **Phase 2 — The Mirror (60%–30% HP):** Inganno creates a mirror clone of the player. The clone has the player's current weapon, same movement speed, same HP percentage. Player must fight themselves while Inganno continues firing charm projectiles. The clone mirrors the player's movement from 3 seconds prior (delayed replay). This makes the clone predictable: the player can exploit the delay by moving erratically, then positioning so the clone moves into their line of fire.
  - **Mirror clone weapon behavior:** The mirror clone uses whatever weapon the player was actively holding when Phase 2 triggered. The clone does NOT switch weapons — it commits to the weapon it was spawned with. If the player switches weapons during Phase 2, only THEIR weapon changes. The clone keeps its original weapon. Strategic play: trigger Phase 2 with the pistol (clone gets pistol, low DPS), then switch to flamethrower.
  - **Phase 3 — The Truth (30%–0% HP):** Inganno's beautiful form cracks. Serpentine lower body unfolds (Geryon reference). Room textures swap: Marble006 → Rust003, Tiles092 → Rust007, Fabric026 → exposed Concrete015. chandelier-iron light shifts from warm `#ffaa44` to cold `#4466cc`. Fog clears to 0.01. She becomes fast — serpentine lunges across the room (charge attack, 20 damage). Vulnerable during charge recovery (2 seconds). The truth is ugly but killable.
  - **Rust floor clarification:** When the room's facade crumbles and Marble textures swap to Rust textures, the floor does NOT become a damage zone. A brief text flash: *"The beauty falls away. The truth remains."* The rust floor is cosmetic — players who learned "rust = pain" in Circle 7 (Thorny Passage) may hesitate, but contact damage is absent. The change signals narrative truth, not mechanical danger.
- **3D elements:** Chair on raised platform (+0.5 cells) center-north. Table beside chair. bookcase (general) against E/W walls (full height, 2 cells). fraud-broken-chandelier at 2.5 cell height (intact initially, cracks phase 3). In Phase 3, fraud-marble-debris from fraud-crumbling-facade creates floor obstacles (0.3 cell height rubble). fraud-stage-curtain panels fall from behind bookcases.
- **Flow:** Ingress from north stairs. No exit until boss defeated. On defeat: south wall crumbles, revealing descent to Circle 9. Title card: *CIRCLE THE NINTH — TREACHERY*

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Bolgia of Flatterers | (10, 28, 8, 4) | `revealMimics` | `once: true` | `{ mimicIds: ['mimic-flat-1','mimic-flat-2'] }` |
| T2 | Bolgia of Flatterers | (10, 26, 8, 2) | `revealEnemies` | `once: true` | `{ enemies: [{type:'mimic', count:2, position:'north_platform'}] }` |
| T3 | Bolgia of Thieves | (35, 27, 8, 6) | `shufflePickups` | `repeating: true, cooldown: 5` | `{ pickupIds: ['thief-hp-1','thief-am-1','thief-am-2'] }` |
| T4 | Bolgia of Thieves | (36, 28, 4, 2) | `spawnEnemy` | `once: true` | `{ enemies: [{type:'mimic', count:2}] }` |
| T5 | Shifting Maze | (33, 39, 12, 12) | `shiftWalls` | `repeating: true, cooldown: 8` | `{ wallSegments: 6, maxShift: 2 }` |
| T6 | Counterfeit Arena | (24, 58, 8, 8) | `lockDoors` | `once: true` | — |
| T7 | Counterfeit Arena | (24, 58, 8, 8) | `spawnWave` | `once: true` | `{ enemies: [{type:'mimic', count:3}] }` |
| T8 | Counterfeit Arena | — | `revealMimics` | On wave 1 clear | `{ mimicIds: ['col-mimic-1','col-mimic-2','col-mimic-3','col-mimic-4'] }` |
| T9 | Counterfeit Arena | — | `spawnWave` | On mimics clear | `{ enemies: [{type:'mimic', count:2}] }` |
| T10 | Counterfeit Arena | — | `unlockDoors` | On wave 2 clear | — |
| T11 | Mimic's Den | (25, 73, 6, 6) | `randomizeMimics` | `once: true` | `{ totalPickups: 8, mimicCount: 4 }` |
| T12 | Boss chamber | (25, 87, 6, 2) | `bossIntro` | `once: true` | `{ text: "Welcome, little goat. You must be so tired. Sit. Rest.", speaker: "Inganno" }` |
| T13 | Boss chamber | (26, 88, 4, 3) | `bossActivate` | `once: true, proximityToBoss: 3` | `{ phase: 1 }` |
| T14 | Boss chamber | — | `lockDoors` | On bossActivate, `delay: 2` | — |
| T15 | Boss chamber | — | `bossPhaseChange` | Boss HP < 60% | `{ phase: 2, action: 'spawnMirrorClone' }` |
| T16 | Boss chamber | — | `bossPhaseChange` | Boss HP < 30% | `{ phase: 3, action: 'revealTrueForm' }` |
| T17 | Boss chamber | — | `ambientChange` | Boss HP < 30% | `{ textures: 'swap_marble_rust', lightColor: '#4466cc', fogDensity: 0.01 }` |

---

## Environment Zones

| Zone | Type | Bounds | Intensity | Notes |
|------|------|--------|-----------|-------|
| Global warm haze | `fog` | Full level (0,0,60,90) | 0.3 | Baseline warm amber fog |
| Hall reflections | `specular` | Hall of Mirrors (23,12,14,10) | 0.6 | Enhanced reflections on onyx surfaces |
| Maze disorientation | `fog` | Shifting Maze (32,38,14,14) | 0.6 | Thicker fog, reduced visibility to 6 cells |
| Boss reveal | `fog_clear` | Boss chamber (21,84,14,14) | 0.0 | Activated at phase 3 — fog drops to near-zero |
| Mimic proximity | `danger` | Mimic's Den (24,72,8,8) | 0.8 | Subtle audio tension cue, heartbeat SFX |

---

## Player Spawn

- **Position:** (30, 5) — center of Portico
- **Facing:** 0 (north — facing into the beautiful palace)

---

## Theme Configuration

```typescript
editor.createTheme('circle-8-fraud', {
  name: 'fraud',
  displayName: 'FRAUD — The Circle of Deception',
  primaryWall: MapCell.WALL_STONE,        // Marble-textured stone
  accentWalls: [MapCell.WALL_OBSIDIAN],   // Onyx accent panels
  fogDensity: 0.03,
  fogColor: '#221810',
  ambientColor: '#ffcc88',
  ambientIntensity: 0.20,
  skyColor: '#1a0e05',
  particleEffect: 'dust_motes',           // Floating golden particles — beautiful, deceptive
  enemyTypes: ['mimic', 'mimic', 'mimic'],
  enemyDensity: 1.0,                      // Average density — mimics supplement
  pickupDensity: 1.5,                     // HIGH — abundance is the deception
  mimicRatio: 0.3,                        // 30% of pickups may be mimics
  bossTextureSwap: {
    from: ['Marble006', 'Marble012', 'Tiles092', 'Fabric026'],
    to: ['Rust003', 'Rust007', 'Rust003', 'Concrete015'],
  },
});
```

---

## Narrative Beats

1. **Portico arrival:** The palace is beautiful. Warm light, polished floors. After 7 circles of horror, this feels like relief. The deception begins with comfort.
2. **Hall of Mirrors inscription:** Faint text on onyx panel: *"What you see is never what is."*
3. **Bolgia of Flatterers trap:** The "friendly" silhouettes beckon. Approaching triggers the ambush. The scroll on the table reads: *"Flattery is the currency of the damned. They told you what you wanted to hear."*
4. **Bolgia of Thieves frustration:** Items vanish. The player learns that desire for loot is itself a trap.
5. **Shifting Maze disorientation:** The walls move. Nothing is stable. A metaphor for lies — the ground shifts beneath every certainty.
6. **Counterfeit Arena callback:** "Wait, this looks like Circle 1..." The recognition, then the betrayal. The familiar made hostile.
7. **Serenissima discovery:** The secret room is honest. Raw marble, real pickups, no tricks. *"Truth hides where no one looks."* The only genuine space in the circle.
8. **Boss intro — Inganno speaks:** *"Welcome, little goat. You must be so tired. Sit. Rest. I am not like the others. I would never hurt you."* She smiles. She means none of it.
9. **Boss phase 2 — mirror clone:** You fight yourself. Your weapons, your speed. The deepest fraud: the lie you tell yourself.
10. **Boss phase 3 — the reveal:** The beautiful room crumbles. Rust beneath marble. Concrete beneath silk. The Geryon serpent beneath the smile. *"All beauty is a mask."*
11. **Boss defeat:** Inganno's true form dissolves. The south wall crumbles. Cold air rushes in from below — ice. Title card: *CIRCLE THE NINTH — TREACHERY*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter — renders in LevelMeshes.tsx
2. All 9 rooms are reachable from spawn (DAG validation passes, including secret room via WALL_SECRET)
3. Mimic mechanic works (pickup appearance, 2-cell proximity trigger, reveal animation, combat)
4. Flamethrower AoE correctly triggers mimics at safe distance (3-cell range > 2-cell trigger)
5. Hall of Mirrors reflection system renders mimic "reflections" on onyx panels
6. Shifting Maze walls physically reposition when player facing direction changes
7. Counterfeit Arena correctly mimics Circle 1 Columns room layout, then subverts it
8. Boss phase 2 mirror clone replicates player weapon and delayed movement
9. Boss phase 3 texture swap (Marble → Rust) renders correctly at runtime
10. PlaytestRunner AI can navigate from spawn to boss and defeat Inganno
11. PBR materials from AmbientCG render on walls/floors (Marble, Onyx, Tiles, Fabric, Rust)
12. At least 6 Meshy props visible as GLB instances in scene (fraud-golden-lectern, fraud-mask-display, fraud-crystal-ball, fraud-counterfeit-coin-pile, fraud-forged-scroll-stack, fraud-broken-chandelier)
13. Serenissima secret room is discoverable and contains genuine (non-mimic) pickups

---

## What This Is NOT

- NOT a horror circle. Fraud is BEAUTIFUL — the horror comes from betrayal of trust, not from ugly things. The aesthetic is palatial, warm, inviting. The fear is that anything you trust might attack you.
- NOT random mimic placement in every room. Mimics are concentrated in specific rooms (Flatterers, Arena, Den). Other rooms use different deception mechanics (reflections, vanishing items, shifting walls).
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored with two converging paths (west through Flatterers, east through Thieves/Maze) that merge at the Counterfeit Arena.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models (circle-specific) or general library Meshy props + AmbientCG PBR textures.
- NOT a reuse of the reflection mechanic from Circle 9. The Hall of Mirrors uses visual reflections for enemy deception. Circle 9 uses projectile reflection as a combat hazard. Different mechanics, thematic continuity.

---

## 3D Spatial Design

### Room: Portico (10x6, exploration, sortOrder=0)

**Player Experience:** You step into warmth for the first time in seven circles. The marble floor gleams. Two chandeliers overhead cast golden pools of light. Silk banners drape from the walls. Vases flank the entrance on low pedestals. After so much horror, this feels like relief. You trust it. That is the mistake.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-ornate-arch | south corridor entrance | 1.0 | face-south | Grand marble archway to Hall of Mirrors |
| fraud-ornate-railing | flanking entrance N wall | 0.8 | face-south | Decorative marble balustrade near spawn |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-two-faced-bust | (27, 3) pedestal, NW | 0.7 | Janus bust on marble pedestal --- the first hint |
| fraud-golden-banner | east/west walls, 2 positions | 1.0 | Rich silk banners, palatial atmosphere |
| fraud-marble-pedestal | (26, 3), (34, 3) flanking entrance | 0.8 | Low pedestals for vase display |

**Lighting:** 2x chandelier-iron (general, ceiling, 2.5 cell height), warm gold `#ffaa44`, radius 6 cells --- one normal, one subtly cracked (fraud-broken-chandelier swap candidate). 4x candelabrum-tall (general, walls, N/S, offsetY=1.5), warm gold, radius 3 cells. Tall ceiling (3 cells high).
**Platforming:** Flat (elevation 0). Polished Tiles074 floor. No elevation changes.

> **Playtest note:** Portico was well-dressed at 10 props in 60 cells. Added fraud-ornate-arch at entrance, fraud-two-faced-bust as first subtle hint of deception, carpet (general) on floor for palatial warmth. Now 12 props. One chandelier is subtly cracked --- the first hint of decay.

---

### Room: Hall of Mirrors (14x10, exploration, sortOrder=1)

**Player Experience:** The walls are black glass. Polished onyx panels protrude from every surface, creating shallow alcoves between them. You see movement in the reflections --- shapes that look like enemies but are not where they appear. The real shadowGoats are on the opposite side of the room from their reflections. You shoot at a reflection and the bullet bounces back at you. These walls turn your weapons against you.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-onyx-wall-panel | 6 positions along N/S walls | 1.0 | face-inward | Polished onyx reflective panels, protrude 0.5 cells from walls |
| fraud-ornate-arch | west/east exit corridors | 0.9 | face-exit | Archways framing twin exits |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-mirror-shard | 3 positions, between onyx panels | 0.6 | Reflective shard clusters for specular highlights and visual depth |
| fraud-marble-pedestal | (25, 14), (35, 14) near columns | 0.7 | Pedestals for vase/chalice display |
| cobweb (general) | (20, 10), (39, 10) upper corners | 0.3 | Subtle decay behind reflective surfaces |

**Lighting:** 4x candelabrum-tall (general, walls, all faces, offsetY=1.5), warm gold `#ffaa44`, radius 3 cells. Specular highlights reflect off onyx creating shimmer effect. Enhanced reflections intensity 0.6 in env zone.
**Platforming:** Flat (elevation 0). Marble006 floor. Onyx panels protrude 0.5 cells creating shallow alcoves. Ceiling at 2.5 cells.

> **Playtest note:** Hall of Mirrors had only 6 props in 140 cells --- the thematically most important room was among the sparsest. Now 14 props: 6 onyx wall panels (structural, the room's identity), 3 mirror shards (reflective floor clusters), 2 pedestals, 2 archways, and cobwebs in corners. The onyx panels are the critical addition --- they sell the "polished black glass" reflective mechanic visually.

---

### Room: Bolgia of Flatterers (12x8, exploration, sortOrder=2)

**Player Experience:** Four friendly silhouettes at the far end wave and beckon. The room is warm, inviting. A large table in the center holds chalices and a scroll. You walk toward the welcoming figures. The pickups at your feet suddenly bite --- mimics. The silhouettes charge, revealing themselves as hellgoats. The real exit is behind you, a secret wall you walked past on entry. Everything that invited you in wants to kill you.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-ornate-arch | north entrance | 0.9 | face-north | Archway from Hall of Mirrors |
| fraud-ramp-platform | (10, 26) north end | 0.6 | flat | +0.5 elevation platform where silhouettes stand |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-silhouette-prop | 4 positions at north platform | 1.0 | Deceptive "friendly NPC" cutouts |
| fraud-golden-banner | N wall, 2 positions | 1.0 | Wall banners, one conceals real ammo pickup |
| fraud-forked-tongue-relief | (10, 30) south wall | 0.8 | Forked tongue relief --- deception symbol |
| fraud-coin-pile | (14, 29) near table | 0.6 | Scattered coins, false wealth |

**Lighting:** 2x candelabrum-tall (general, E/W walls, offsetY=1.5), warm gold, radius 3 cells. North platform slightly dimmer to obscure silhouette details.
**Platforming:** Slight step-up (+0.5) at north end where silhouettes stand. WALL_SECRET on south wall --- real exit behind the player.

> **Playtest note:** The 4x fraud-silhouette-prop at the north platform is the critical narrative addition --- these "friendly NPC" cutouts are the key deception moment. Without them, the room has no visual selling of the "welcoming figures beckoning." Added fraud-two-faced-bust on a pedestal and forked tongue relief. Now 12 props.

---

### Room: Bolgia of Thieves (10x8, exploration, sortOrder=3)

**Player Experience:** Items vanish when you approach. Coin piles sit on raised platforms, but the moment you step close, the pickups despawn and enemies appear in their place. You turn around and the remaining pickups have shuffled positions. Chests open to reveal nothing --- or a mimic. The lesson: desire for loot is itself a trap.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-ornate-arch | north entrance | 0.9 | face-north | Archway from Hall of Mirrors |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-coin-pile | 3 positions (floor, varying heights) | 0.7 | Decoy coin piles on small raised platforms |
| fraud-marble-pedestal | (38, 30) center | 0.8 | Pedestal for chalice display |
| trick-chest | (36, 28), (40, 32) floor | 0.8 | Chests designed for this room --- some open to nothing, some to enemies |
| false-door | (42, 30) east wall | 0.9 | Fake door on wall --- deception theme reinforcement |

**Lighting:** 2x candelabrum-tall (general, N/S walls, offsetY=1.5), warm gold, radius 3 cells. trick-chest on low pedestals (0.3 cells).
**Platforming:** Flat (elevation 0). Three small raised platforms (0, 0.3, 0.5 cells) for coin pile display. Ceiling higher (4 units) than bolgia rooms.

> **Playtest note:** trick-chest (circle-specific, designed for deception) for chests. fraud-coin-pile for coin displays. Added false-door on east wall for deception reinforcement. Now 10 props.

---

### Room: Shifting Maze (14x14, exploration, sortOrder=4)

**Player Experience:** The walls move when you are not looking. You turn a corner and the path behind you is gone. The corridor you came from has closed. A new passage has opened to the left. Rubble props on the floor serve as unreliable breadcrumbs --- they shift too. Only the fixed torches on the outer walls are reliable landmarks. Seven enemies patrol the maze, exploiting the shifts to ambush. The bleeding clock from Circle 7 is gone, but the disorientation is its own form of torture.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-shifting-wall-segment | 6 moveable wall sections | 1.0 | varies | Maze walls on hidden sliding tracks, 1 cell thick, 2 cells high |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-cracked-mosaic-floor | 4 positions (scattered) | 0.8 | Breadcrumb floor tiles that shift with walls |

**Lighting:** 2x torch-sconce-ornate (general, fixed outer walls, offsetY=1.8), warm orange, radius 4 cells --- the ONLY reliable landmarks. Thick fog `#1a1208` density 0.06.
**Platforming:** Flat (elevation 0). Maze walls are fraud-shifting-wall-segment (visually distinct from permanent walls), 1 cell thick, 2 cells high. Some walls have gaps at 1.5 cells high (tease --- no raised floors to exploit them). Maximum 3 walls shift per observation break.

> **Playtest note:** Shifting Maze had 6 props in 196 cells. The key addition is replacing structural WALL_STONE with fraud-shifting-wall-segment props for visual distinction from permanent walls. Added fraud-cracked-mosaic-floor at dead ends as "wrong way" markers. Now 12 props. The 2 fixed torches remain the ONLY reliable landmarks --- this is intentional.

---

### Room: Counterfeit Arena (12x12, arena, sortOrder=5)

**Player Experience:** "Wait --- this looks like Circle 1." Six elegant columns arranged in a familiar pattern. But when you approach one for cover, it splits open and a mimic unfolds. Four of the six columns are traps. The only real cover is two ugly, utilitarian ramp platforms in the center. The beautiful columns betray you. The ugly ramps save your life. The lesson of Fraud.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-fake-column | 6 positions (2 rows of 3) | 1.0 | varies | Elegant columns --- 4 are mimic hosts, 2 are real |
| fraud-ramp-platform | 2 center positions | 1.0 | flat | Raised platforms (+1 cell) --- real cover |
| fraud-ornate-arch | north entrances (2, converging paths) | 0.9 | face-north | Twin archways where west/east paths merge |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-cracked-mosaic-floor | center floor | 1.2 | Ornate floor pattern (callback to Circle 1) |
| fraud-crumbling-facade | (22, 37) near entrance | 0.8 | Marble crumbling to reveal truth --- visual decay callback |

**Lighting:** 2x torch-sconce-ornate (general, N/S walls, offsetY=1.8), warm orange, radius 4 cells. Arena lighting brighter than maze.
**Platforming:** Floor at 0. Two RAMP segments (fraud-ramp-platform) create raised platforms at +1 cell elevation (3x2 cells each). Columns are fraud-fake-column (0.5x0.5 cells, full height, 2 cells). Player can stand on ramps to shoot over enemies.

> **Playtest note:** The critical change: fraud-fake-column for mimic hosts and fraud-theatrical-column for real columns. Visual distinction between "fake" and "real" cover. Added fraud-ramp-platform for RAMP segments and fraud-crumbling-facade near entrance. Now 11 props. The columns' visual identity teaches the Fraud lesson: beautiful things betray, ugly things save.

---

### Room: Mimic's Den (8x8, exploration, sortOrder=6)

**Player Experience:** Eight pickups scattered across a dim room. Half are real. Half are mimics. You do not know which. The Cauldron in the center is the only honest object. You sweep with the flamethrower before touching anything. The flames reveal the truth --- mimics flinch and unfold before you are in their attack range. Trust nothing. Burn everything.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| (none) | --- | --- | --- | Sparse room --- pickups ARE the architecture |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-coin-pile | 2 positions (floor, mixed with pickups) | 0.5 | Coin scatter, atmosphere |
| fraud-forked-tongue-relief | (50, 58) north wall | 0.7 | Forked tongue relief --- deception symbol, wall decoration |
| fraud-gambling-table | (48, 60) center | 0.8 | The "one honest object" --- gambling table as center landmark replacing generic Cauldron |

**Lighting:** 2x torch-sconce-ornate (general, E/W walls, offsetY=1.8), warm orange, radius 4 cells. Subtle audio tension cue, heartbeat SFX (danger env zone 0.8).
**Platforming:** Flat (elevation 0). fraud-gambling-table on slightly raised stone base (0.2 cells). WALL_SECRET on east wall leads to Serenissima.

> **Playtest note:** Replaced generic Cauldron with fraud-gambling-table as center landmark (more thematic --- gambling with fate). Added fraud-forked-tongue-relief on wall. Now 7 props in 64 cells. The sparse design is correct --- the pickups ARE the visual content.

---

### Room: Serenissima (6x6, secret, sortOrder=7)

**Player Experience:** The irony of Circle 8. This is the only room where nothing is a lie. The walls are raw, unfinished marble --- the only honest surface in the entire circle. All pickups are genuine. The chest contains real loot. The scroll reads: "Truth hides where no one looks." The low ceiling (1.5 cells) creates an intimate, cave-like refuge. After rooms of deception, this unadorned honesty is the most surprising thing in the circle.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| (none) | --- | --- | --- | Deliberately unadorned --- raw Marble001 walls |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| chest-gold (general) | center floor | 0.8 | The genuine treasure chest --- golden, honest, valuable |
| book-open (general) | beside chest | 0.5 | Lore scroll: "Truth hides where no one looks" |
| carpet (general) | floor, under chest | 1.0 | Warm carpet --- the honest room feels warm |
| cobweb (general) | (52, 66), (56, 66) upper corners | 0.3 | Old, undisturbed cobwebs --- no one comes here |

**Lighting:** 2x candle (general, floor, flanking chest), very warm `#ffcc88`, radius 2 cells. Low ceiling (1.5 cells). Intimate and dim.
**Platforming:** Flat (elevation 0). Dead end --- return through WALL_SECRET.

> **Playtest note:** Replaced generic chest with chest-gold (general library). Added carpet on floor and cobwebs in corners. The unadorned Marble001 walls remain --- the raw honesty is the design. Now 7 props in 36 cells.

---

### Room: Inganno's Parlor (14x14, boss, sortOrder=8)

**Player Experience:** You descend stairs into elegance. A grand sitting room: chandeliers, bookcases, silk banners, candlelight. Inganno sits in a chair at center-north, beautiful and still. She speaks pleasantly. She does not attack. Then you step too close. Phase 1: mimics unfold across the room. Phase 2: a mirror clone of yourself attacks with your own weapon. Phase 3: the beautiful room crumbles --- marble becomes rust, silk becomes concrete, the chandelier shifts from warm gold to cold blue. The Geryon serpent uncoils beneath the smile. "All beauty is a mask."

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| fraud-ornate-arch | north entrance (stairs) | 1.2 | face-south | Grand archway framing boss chamber descent |
| fraud-ornate-railing | north stair descent | 1.0 | face-south | Ornate marble balustrade along stairway |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| fraud-broken-chandelier | center ceiling | 1.5 | Grand chandelier (intact initially, damaged phase 3) |
| fraud-golden-banner | N wall, 2 positions | 1.2 | Rich silk banners flanking Inganno's seat |
| fraud-two-faced-bust | (22, 85) near entrance | 0.8 | Two-faced bust --- thematic foreshadowing |
| fraud-crumbling-facade | walls (phase 3 reveal) | 1.0 | Marble crumbling away to reveal rust beneath |
| fraud-marble-debris | floor scatter (phase 3) | 0.6 | Fallen marble chunks creating floor obstacles (0.3 cell height) |
| fraud-stage-curtain | E/W walls behind bookcases | 1.0 | Rigid silk curtain panels, theatrical backing |
| fraud-forked-tongue-relief | (28, 85) near chair | 0.6 | Forked tongue relief behind Inganno's seat |

**Lighting:** 1x fraud-broken-chandelier overhead (starts intact, damages in phase 3), warm `#ffaa44`, radius 8 cells --- shifts to cold blue `#4466cc` in phase 3. 4x candelabrum-tall (general, walls, all faces, offsetY=1.5). Phase 3: fog clears to 0.01, light color shifts.
**Platforming:** Elevation -1 (descended via stairs). Chair on raised platform (+0.5 cells) center-north. Ceiling at 3 cells (grand height). Phase 3: fraud-marble-debris creates 0.3-cell-height floor obstacles.

> **Playtest note:** Boss room was adequate at 15 props in 196 cells. Added fraud-stage-curtain flanking entrance (phase 3: curtains fall), fraud-crumbling-facade on walls (phase 3 marble-to-rust reveal), fraud-marble-debris on floor (phase 3 obstacles), and fraud-forked-tongue-relief behind Inganno's seat. Now 19 props, all circle-specific Meshy models. The phase 3 transformation is the visual climax: chandelier cracks, curtains fall, marble crumbles to reveal rust.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Used In |
|---------|------|----------|---------|
| false-door | False Door | exists | Bolgia of Thieves |
| fraud-broken-chandelier | Broken Chandelier | exists | Inganno's Parlor (phase 3) |
| fraud-coin-pile | Coin Pile | exists | Flatterers, Thieves, Mimic's Den |
| fraud-cracked-mosaic-floor | Cracked Mosaic Floor | exists | Shifting Maze x4, Counterfeit Arena |
| fraud-crumbling-facade | Crumbling Facade | exists | Counterfeit Arena, Inganno's Parlor (phase 3) |
| fraud-fake-column | Fake Column | exists | Counterfeit Arena x6 (4 mimic hosts) |
| fraud-forked-tongue-relief | Forked Tongue Relief | exists | Flatterers, Mimic's Den, Inganno's Parlor |
| fraud-gambling-table | Gambling Table | exists | Mimic's Den (center landmark) |
| fraud-golden-banner | Golden Banner | exists | Portico, Flatterers, Inganno's Parlor |
| fraud-marble-debris | Marble Debris | exists | Inganno's Parlor (phase 3 floor obstacles) |
| fraud-marble-pedestal | Marble Pedestal | exists | Portico, Hall of Mirrors, Thieves |
| fraud-mirror-shard | Mirror Shard Cluster | exists | Hall of Mirrors x3 |
| fraud-onyx-wall-panel | Onyx Wall Panel | exists | Hall of Mirrors x6 (structural) |
| fraud-ornate-arch | Ornate Arch | exists | Portico, Hall of Mirrors, Flatterers, Thieves, Counterfeit Arena, Inganno's Parlor |
| fraud-ornate-railing | Ornate Railing | exists | Portico, Inganno's Parlor |
| fraud-ramp-platform | Ramp Platform | exists | Flatterers, Counterfeit Arena |
| fraud-shifting-wall-segment | Shifting Wall Segment | exists | Shifting Maze x6 (structural) |
| fraud-silhouette-prop | Silhouette Prop | exists | Bolgia of Flatterers x4 (narrative critical) |
| fraud-stage-curtain | Stage Curtain | exists | Inganno's Parlor (phase 3 reveal) |
| fraud-theatrical-column | Theatrical Column | exists | (available for Counterfeit Arena real columns) |
| fraud-two-faced-bust | Two-Faced Bust | exists | Portico, Inganno's Parlor |
| trick-chest | Trick Chest | exists | Bolgia of Thieves x2 |

**General library props used in this circle:**

| Prop ID | Name | Manifest | Used In |
|---------|------|----------|---------|
| book-open | Open Book | exists | Serenissima |
| bookcase | Bookcase | exists | Inganno's Parlor x2 |
| candelabrum-tall | Tall Candelabrum | exists | Portico, Hall of Mirrors, Flatterers, Thieves, Inganno's Parlor |
| candle | Candle | exists | Serenissima x2 |
| carpet | Carpet | exists | Serenissima |
| chandelier-iron | Iron Chandelier | exists | Portico x2 |
| chest-gold | Gold Chest | exists | Serenissima |
| cobweb | Cobweb | exists | Hall of Mirrors, Serenissima |
| torch-sconce-ornate | Ornate Torch Sconce | exists | Shifting Maze, Counterfeit Arena, Mimic's Den |

**Summary:** All 22 circle-specific Meshy props have existing manifests. All general library props have existing manifests. No new manifests needed for Circle 8.
