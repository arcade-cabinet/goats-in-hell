---
title: "Circle 4: Greed"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 4
sin: avarice
boss: Aureo
act: 2
build_script: scripts/build-circle-4.ts
mechanic: hoarding-penalty
related:
  - docs/circles/00-player-journey.md
  - docs/circles/03-gluttony.md
  - docs/agents/level-editor-api.md
---

# Circle 4: Greed -- Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Playability

| Metric | Target | Notes |
|--------|--------|-------|
| Target play time | 8–12 min | Hoarding penalty (overloaded ammo = slow) extends effective time. |
| Estimated play time | TBD (computed after build) | |
| Path distance | TBD | |
| Room count | 6 rooms + 1 boss | from Room Placement table |
| Enemy count | 14 enemies + boss | from enemy placement |

### Pacing Notes
Greed's hoarding mechanic is the primary pacing lever: players who collect all the tempting ammo pickups move at half speed, making hoarder encounters more dangerous and room traversal longer. The pressure plate Weight Room creates a deliberate pacing dip — a puzzle beat — before the Auction Hall arena ramps tension back up. The boss encounter's three phases (coins, steal, strip) provide a satisfying climax to the "want less" theme.

---

## Identity

**Circle:** 4 (Greed)
**Sin:** Avarice
**Boss:** Aureo -- vain adorned she-goat, Salome figure (Dainir female base, no anatomy, adorned in gold chains and crowns)
**Dominant Mechanic:** Hoarding penalty (ammo above 150% capacity halves movement speed)
**Dante Quote:** *"Or discendiam omai a maggior pieta..."* (Now let us descend to greater wretchedness...)

**Feel:** Opulence dripping from every surface. Gold, gleaming metal, coin piles on every pedestal. The game drowns you in abundance -- ammo pickups everywhere, more than any other circle. And then it punishes you for taking it. goatKnights appear for the first time: armored, tanky, slow. You need the bullets. Carrying them makes you slower than the things hunting you. The tension is exquisite: **want less, survive more.**

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Polished metal, warm gold undertone | Metal007, Metal012 | Reflective, opulent, warm-shifted |
| Floor (standard) | Diamond plate, industrial gold | DiamondPlate001, DiamondPlate004 | Catch torchlight reflections |
| Floor (boss) | Gold-veined marble | Marble006, Marble013 | Polished, mirror-like surface |
| Columns/pillars | Brushed metal plate | MetalPlates003, MetalPlates009 | Structural, imposing |
| Ceiling | Hammered bronze metal | Metal037 | Dark, cavern-like overhead |
| Secret room | Aged marble, cracked gold leaf | Marble021, Tiles078 | Hidden wealth, forgotten |
| Pressure plates | Worn steel plate | MetalPlates014 | Distinct from standard floor |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Vault Entrance | 0.02 | `#2a1f0a` | Light amber haze, wealth gleaming |
| Treasury onward | 0.03 | `#1f1a08` | Warm gold-brown, torchlit dust |
| Weight Room | 0.05 | `#1a1408` | Heavier, oppressive, weight of gold |
| Boss phase 2 | 0.04 | `#332200` | Golden storm clouds, coin projectiles |
| Boss phase 3 | 0.02 | `#0d0d0d` | Stripped bare, clarity through loss |

### Lighting

- Ambient: `#ffcc44` at intensity 0.20 (warm gold, rich but not bright)
- Point lights from torch-sconce-ornate props (warm amber `#ffaa33`, radius 5 cells)
- Spot light on coin pile pedestals in Treasury (focused `#ffe066`, radius 2 cells, intensity 0.8)
- Boss chamber: ring of 6 candelabrum-tall around perimeter, golden wash from floor
- No directional light -- underground vault, sealed from the world

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Scratches004 | Metal walls near floor | Desperate clawing, past hoarders |
| Fingerprints002 | Near coin-pile props, greed-treasure-chest | Countless hands grabbing |

---

## Room Layout

### Overview (6 rooms)

```
                ┌────────────┐
                │   VAULT    │  (8x6, exploration, sortOrder=0)
                │  ENTRANCE  │  Player starts here. Gold glimmers ahead.
                │  Spawn ★   │
                └─────┬──────┘
                      | corridor (width=3)
                ┌─────┴──────┐
                │  TREASURY  │  (14x12, exploration, sortOrder=1)
                │  2 LEVELS  │  Ground floor + mezzanine balcony.
                │  ramps L+R │  goatKnights patrol. Ammo lines balcony.
                └─────┬──────┘
                      | corridor (width=2)
                ┌─────┴──────┐
                │   WEIGHT   │  (10x10, puzzle, sortOrder=2)
                │    ROOM    │  Pressure plates. Heavy ammo = sinking floor.
                │  platforming│  Must drop ammo to cross.
                └──┬──────┬──┘
         secret    |      | corridor (width=2)
      ┌────────────┘      |
      |             ┌─────┴──────┐
 ┌────┴─────┐       │  AUCTION   │  (12x12, arena, sortOrder=3)
 │RELIQUARY │       │   HALL     │  4 destructible pillars. Mixed waves.
 │  (6x6)   │       │   arena    │  Coin piles = cover. Destroy = open.
 │  secret   │       └─────┬──────┘
 └──────────┘              | corridor (width=3)
                     ┌─────┴──────┐
                     │  AUREO'S   │  (14x14, boss, sortOrder=5)
                     │   COURT    │  Circular throne room.
                     │   boss     │  Gold marble, gleaming walls.
                     └────────────┘
```

### Grid Dimensions

**44 wide x 66 deep** (88 x 132 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Vault Entrance | 18 | 2 | 8 | 6 | exploration | 0 | 0 |
| Treasury | 15 | 12 | 14 | 12 | exploration | 0 (balcony=1) | 1 |
| Weight Room | 17 | 28 | 10 | 10 | puzzle | 0 (plates=-1 when sunk) | 2 |
| Reliquary | 2 | 32 | 6 | 6 | secret | 0 | 3 |
| Auction Hall | 16 | 42 | 12 | 12 | arena | 0 | 4 |
| Aureo's Court | 15 | 58 | 14 | 14 | boss | -1 (sunken throne) | 5 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Vault Entrance | Treasury | corridor | 3 | Wide, inviting, gold-lit |
| Treasury | Weight Room | corridor | 2 | Narrowing, oppressive |
| Weight Room | Reliquary | secret | 2 | WALL_SECRET on west wall |
| Weight Room | Auction Hall | corridor | 2 | Main path forward |
| Auction Hall | Aureo's Court | corridor | 3 | Descending stairs (elev 0 to -1) |

---

## Entities

### Enemies (14 total + boss)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Treasury (ground) | hoarder | 2 | Patrol between chest rows, slow sweep | Dark, armored |
| Treasury (balcony) | hoarder | 2 | Guard balcony ramps, ranged positions | Brown goatman |
| Weight Room | hoarder | 1 | Stationed on far platform, blocks exit | Dark, armored |
| Weight Room | hoarder | 1 | Patrols pressure plate zone | Brown goatman |
| Auction Hall wave 1 | hoarder | 2 | Spawn N and S, advance through pillars | Dark, armored |
| Auction Hall wave 1 | hoarder | 2 | Spawn E and W, flank wide | Brown goatman |
| Auction Hall wave 2 | hoarder | 2 | Spawn from corners, aggressive push | Dark, armored |
| Auction Hall wave 2 | hoarder | 2 | Spawn from door-side, fast rush | Brown goatman |
| Boss chamber | Aureo | 1 | Boss AI, 3 phases (coins, steal, strip) | boss-aureo.glb |

**hoarder Balance Note:** goatKnights have 15 HP + 5 armor = 20 effective HP. With the Hellfire Cannon (3 dmg, 150ms fire rate), they die in 7 shots (~1 second). With the Brim Shotgun at close range (28 dmg), they die in 1 shot. With the Hell Pistol (4 dmg per shot), they require 5 shots (~1.5 seconds). The armor makes them feel tanky without being bullet sponges.

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Vault Entrance | ammo | (21, 5) center | First taste of abundance |
| Vault Entrance | ammo | (24, 4) east wall | Extra -- temptation begins |
| Treasury (ground) | ammo x 3 | (17,15), (22,15), (27,18) | Scattered between chest rows |
| Treasury (balcony) | ammo x 4 | (16,13), (16,22), (28,13), (28,22) | Lines the balcony rails -- heavy temptation |
| Treasury (ground) | health | (22, 20) south center | Single heal, modest |
| Weight Room | ammo x 2 | (19, 30), (25, 30) | On far side of pressure plates -- bait |
| Weight Room | health | (22, 36) exit side | Reward for solving puzzle |
| Reliquary | ammo x 2 | (4, 34), (6, 36) | Rare ammo in secret room |
| Reliquary | health x 2 | (3, 36), (7, 34) | Generous heal reward |
| Auction Hall (between waves) | ammo | (22, 46) center | Resupply mid-fight |
| Auction Hall (between waves) | health | (20, 50) south | Healing between waves |
| Boss chamber | ammo x 2 | (16, 59), (28, 59) | NE, NW corners -- phase 3 weapon recovery |
| Boss chamber | ammo x 2 | (16, 70), (28, 70) | SE, SW corners -- scattered stolen weapons |
| Boss chamber | health x 2 | (22, 59), (22, 70) | N and S center edges |

### Props (non-interactive)

| Room | Props |
|------|-------|
| Vault Entrance | 2x greed-golden-vase (flanking entrance), 5x coin-pile (floor scatter), 2x greed-gold-bar-stack (near walls), 1x greed-chest-pedestal + 1x greed-treasure-chest (center pedestal), 2x greed-vault-arch (structural, north/south doors) |
| Treasury (ground) | 8x greed-chest-pedestal + 8x greed-treasure-chest (2 rows of 4), 6x coin-pile (between chests), 2x greed-golden-chalice (table surfaces), 4x greed-gold-pillar (structural, balcony anchors), 2x greed-diamond-plate-platform (structural, balcony sections) |
| Treasury (balcony) | 4x greed-golden-candelabra (balcony corners), railing geometry (structural) |
| Weight Room | 4x greed-gear-mechanism (walls), 2x greed-safe-door (structural, north/south entries), 16x greed-pressure-plate (4x4 grid floor), 2x greed-gold-bar-stack (far side bait), 1x greed-skeletal-goat + 2x greed-ammo-scatter (entrance teach), 2x coin-pile (floor atmosphere) |
| Reliquary | 1x greed-golden-key-display (north wall), 1x greed-jeweled-pedestal + 1x greed-treasure-chest (center), 2x greed-golden-chalice (shelves), 1x greed-vault-arch (structural, hidden entrance) |
| Auction Hall | 4x greed-gold-pillar (structural, destructible pillars), 4x coin-pile (at pillar bases, destructible), 2x greed-golden-banner (walls), 2x greed-treasure-chest (edge decoration), 2x coin-pile (floor scatter), 2x greed-golden-vase (corners) |
| Boss chamber | 6x greed-golden-candelabra (perimeter ring), 4x greed-gold-chain (ceiling hang), 2x greed-golden-banner (flanking throne), 1x greed-golden-throne (structural, center-north dais), 1x greed-vault-arch (structural, entrance), 8x coin-pile (floor scatter), 2x greed-coin-cascade (throne dais), 2x greed-golden-vase (perimeter) |

---

## Room Details

### Room 1: Vault Entrance (8x6)

```
  N
  ^
  |
  +----[vault-arch]----+
  | GV      |        |  GV = greed-golden-vase (flanking entrance)
  |    CP   | TC+CP  |  CP = coin-pile (floor scatter)
  |   GBS   |        |  TC = greed-treasure-chest + greed-chest-pedestal
  |   GV  [A] GV     |  GBS = greed-gold-bar-stack
  |         |        |  [A] = ammo pickup
  |    CP [A]  CP    |  ★ = player spawn
  |    ★              |
  +---[vault-arch]---+
       |         |
       v South (to Treasury)
```

**Elevation:** Flat, elevation 0. Stone threshold at south door descends half-step into Treasury corridor.

**Flow:** Player spawns facing south. Gold gleams from every surface. Two ammo pickups visible immediately -- the circle's temptation begins at spawn. Walk south through the wide corridor to Treasury.

---

### Room 2: Treasury (14x12, two levels)

```
  N (from Vault Entrance)
  |
  +--[===door===]--+
  |  BALCONY (greed-diamond-plate-platform, elev 1)  |
  | [A]..railing.GC..........GC.railing..[A] |
  |  |                                  |  |
  | RAMP                          RAMP  |
  |  |    TC  TC  TC  TC          |    |
  |  |    CP  CP  CP  CP          |    |
  |  |        CH                    |  |
  | [A]  TC  TC  TC  TC  [H] [A] |
  |       CP  CP  CP  CP   CH      |
  |  |                              |  |
  | RAMP                          RAMP  |
  | [A]..railing.GC..........GC.railing..[A] |
  |  BALCONY (greed-diamond-plate-platform, elev 1)  |
  +--[===door===]--+
  |
  v South (to Weight Room)

  TC = greed-treasure-chest on greed-chest-pedestal (8x, 2 rows of 4)
  CP = coin-pile (6x, between chests)
  CH = greed-golden-chalice (2x, table surfaces)
  GC = greed-golden-candelabra (4x, balcony corners)
  GP = greed-gold-pillar (4x structural, balcony anchors -- not shown for clarity)
  [A] = ammo pickup (balcony)    [H] = health pickup (ground)
  hoarder x2 patrol ground between chest rows
  hoarder x2 guard balcony ramp tops
```

**Elevation:** Ground floor at elevation 0. Mezzanine balcony (greed-diamond-plate-platform) at elevation 1 runs along east and west walls, connected by ramps at NE, NW, SE, SW corners. Balcony is 2 cells wide. Ramps are 2 cells wide, 3 cells long, slope from 0 to 1. Four greed-gold-pillar structural columns anchor the balcony at corners.

**Flow:** Enter from north. Ground floor is a grid of greed-treasure-chest on greed-chest-pedestal with coin-pile between them -- tight lanes. Two goatKnights patrol these lanes (slow, armored, deadly in confined space). Balcony above is lined with ammo pickups -- visible, tempting. Four greed-golden-candelabra mark the balcony corners. Two greed-golden-chalice sit on table surfaces. Ramps at all four corners access the balcony. Going up for ammo means: (a) exposed on the ramp, (b) carrying extra ammo slows you on the way back down. Two hellgoats guard the ramp tops. The tactical choice: stay lean on the ground and conserve, or load up and accept the penalty.

---

### Room 3: Weight Room (10x10)

```
  N (from Treasury)
  |
  +--[safe-door]--+
  |  GM       GM  |  PP = greed-pressure-plate (4x4 grid = 16x)
  | PP PP PP PP  |  GM = greed-gear-mechanism (walls)
  | ↓↓ ↓↓ ↓↓ ↓↓ |  ↓↓ = sinks when heavy player stands on it
  |  SG+AS       |  SG = greed-skeletal-goat (entrance teach)
  | PP PP PP PP  |  AS = greed-ammo-scatter (around skeleton)
  | ↓↓ ↓↓ ↓↓ ↓↓ |  GBS = greed-gold-bar-stack (far side bait)
  |  GM       GM  |  gK = hoarder (far platform)
  | PP PP PP PP  |  hg = hoarder (patrols plates)
  | ↓↓ ↓↓ ↓↓ ↓↓ |  CP = coin-pile (floor atmosphere)
  |               |
  | PP PP PP PP  |  [A] = ammo (bait, far side)
  |  GBS [A][A]GBS|  [H] = health (exit reward)
  |       gK     |
  +--[safe-door]--+--secret--[RELIQUARY]
  |       [H]
  v South (to Auction Hall)

  Plate behavior:
  - Player ammo <= 100%: plates hold, normal traversal
  - Player ammo 100-150%: plates creak, visual warning
  - Player ammo > 150%: plates SINK (elevation 0 -> -1), blocking path
  - Sunk plates form pits: must jump across or DROP AMMO to lighten
```

**Elevation:** Entry through greed-safe-door at north (elevation 0). Sixteen greed-pressure-plate in 4x4 grid at elevation 0 (sinks to -1 when player is burdened >150% ammo). Far platform at elevation 0. Exit through greed-safe-door at south. When a plate sinks, adjacent plates remain -- creating a checkerboard of pits and platforms. Four greed-gear-mechanism on walls hint at the mechanical plate system.

**Flow:** Enter from north. An inscription on the entrance wall reads: 'Only the unburdened may pass.' A greed-pressure-plate at the entrance visibly depresses under the player's weight, accompanied by a grinding stone sound. If the player steps onto the puzzle floor while burdened (>100% ammo), the plate sinks further and a stone barrier rises to block the exit.

A tooltip appears when the player first steps onto a greed-pressure-plate while burdened: 'Press [DROP KEY] to lighten your load.'

Environmental teach: a greed-skeletal-goat prop lies on a sunken plate near the entrance, surrounded by greed-ammo-scatter. The visual narrative: this goat couldn't let go.

The room is a grid of greed-pressure-plate sections. If the player has hoarded ammo (>150%), plates sink beneath them. To cross, the player must DROP ammo -- the game forces you to let go of what you've collected. The hoarder on the far platform fires while you navigate. The hoarder patrols the plates, adding pressure. Two greed-gold-bar-stack on the far side are visual bait. The WALL_SECRET on the west wall leads to the Reliquary.

---

### Room 4: Auction Hall (12x12, arena)

```
  N (from Weight Room)
  |
  +----[==door==]----+
  |  GV    BN        |  P1-P4 = greed-gold-pillar (destructible structural)
  |  P1         P2    |  CP = coin-pile at pillar base (destructible)
  |  CP         CP    |  BN = greed-golden-banner (walls)
  |    TC              |  TC = greed-treasure-chest (edge decoration)
  |       [A]         |  GV = greed-golden-vase (corners)
  |  CP         CP    |  [A] = ammo (center, between waves)
  |                   |
  |  P3         P4    |
  |  CP         CP    |
  |       [H]    TC  |  [H] = health (south center)
  |            BN  GV|
  +----[==door==]----+
  |
  v South (to Aureo's Court)

  Pillars: greed-gold-pillar with coin-pile at base
  - Destroying coin-pile (splash damage) = pillar COLLAPSES
  - Collapsed pillar: cover removed, sightline opened
  - Creates rubble (elevation +0.5 debris mound, partial cover)

  Wave 1: 2 hoarder (N, S) + 2 hoarder (E, W)
  Wave 2: 2 hoarder (corners) + 2 hoarder (door-side)
```

**Elevation:** Flat arena at elevation 0. Four greed-gold-pillar are 1x1 structural columns rising to full height. When destroyed, they leave rubble mounds at elevation 0.5 (partial cover, climbable). The room starts with four cover points and ends with four rubble mounds -- the tactical landscape inverts.

**Flow:** Enter from north, doors lock. Wave 1 spawns from all four cardinal directions. The four greed-gold-pillar provide cover -- orbiting them keeps you alive against goatKnights. But the coin-pile at each pillar base is destructible. Splash damage (Hellfire Cannon, explosions) destroys them, which topples the pillar. Cover gone. Sightlines open. The room becomes an open arena. Two greed-golden-banner hang on the north and south walls; two greed-treasure-chest sit at opposite edges as non-destructible decoration; two greed-golden-vase in the corners add visual wealth. Wave 2 spawns after wave 1 clears -- by now, some or all pillars may be destroyed depending on the player's collateral damage. The room literally reshapes based on how you fight.

---

### Room 5: Reliquary (6x6, secret)

```
  E (from Weight Room WALL_SECRET)
  |
  +--[vault-arch]--+
  |                 |
  | GKD            |  GKD = greed-golden-key-display (north wall)
  |                 |
  | [A] TC+JP [A] |  TC = greed-treasure-chest on greed-jeweled-pedestal
  |                 |  JP = greed-jeweled-pedestal
  | [H]  CH   [H] |  CH = greed-golden-chalice (2x, shelves)
  |       CH       |
  +-----------------+

  Small treasure room. No enemies. Pure reward for exploration.
```

**Elevation:** Flat, elevation 0. Recessed display alcoves in north wall at elevation 1.2 (greed-golden-key-display mounted). Entrance framed by greed-vault-arch.

**Flow:** Accessed through WALL_SECRET on west side of Weight Room. A hidden treasure chamber -- the only room in Circle 4 without enemies. A greed-golden-key-display lines the north wall (decorative, symbolizing keys to nothing -- the trappings of wealth without purpose). A greed-treasure-chest sits on a greed-jeweled-pedestal at center. Two greed-golden-chalice on shelves add liturgical wealth. Health and ammo pickups are generous here. The irony: the secret room rewards the player who was willing to explore rather than hoard.

---

### Room 6: Aureo's Court (14x14, boss)

```
  N (from Auction Hall, stairs down to elev -1)
  |
  +------[===vault-arch===]------+
  |  GV                     GV  |  GC = greed-golden-candelabra (6x perimeter ring)
  |  GC    GC    GC    GC      |  GCH = greed-gold-chain (4x ceiling hang)
  |                              |  BN = greed-golden-banner (2x flanking throne)
  |    GCH  BN THRONE BN GCH   |  THRONE = greed-golden-throne (structural, north dais)
  |         CC [AUREO] CC       |  CC = greed-coin-cascade (2x near throne)
  |                              |  GV = greed-golden-vase (2x perimeter)
  |    GCH              GCH    |  CP = coin-pile (8x floor scatter)
  |   CP                  CP   |
  |  GC    GC    GC    GC      |  [A] = ammo (corners, phase 3 weapon recovery)
  | [A]  CP          CP  [A]  |  [H] = health (N/S center edges)
  |          [H]              |
  | [A]  CP          CP  [A]  |
  |          [H]              |
  +------------------------------+

  Phase 1: Aureo at greed-golden-throne. Coin projectile storms (arcing spread).
           Dodge laterally. greed-golden-candelabra mark safe zones between arcs.

  Phase 2: Aureo STEALS current weapon. It vanishes. She wields it.
           Player auto-switches to next weapon in inventory.
           She steals again every 20s. Each stolen weapon appears at a
           random room edge (faint glow, retrievable).

  Phase 3: ALL weapons stolen. Player has NO ranged attack.
           When Aureo steals ALL weapons, a tooltip flashes: 'Sprint into her.'
           The player's ram attack deals 15 damage per hit with a 1-second cooldown.
           Aureo has 30% HP remaining in Phase 3 -- approximately 4-5 ram hits to kill.
           Aureo's stolen weapons are scattered at the room's four edges (NE, NW, SE, SW
           corners -- the [A] positions). The player can EITHER ram Aureo to death OR
           sprint to an edge and reclaim a weapon. Both strategies are viable.
           Phase 3 also reduces Aureo's speed by 40% -- she staggers from the stolen
           weapon weight, mirroring the hoarding penalty the player experienced.
           Thematic symmetry: greed slows her too.
```

**Elevation:** Sunken at elevation -1 (descend via stairs from Auction Hall, entrance framed by greed-vault-arch). The greed-golden-throne platform at north-center is elevation 0 (raised dais, 3x3). The rest of the floor is -1 (gold marble, reflective). Six greed-golden-candelabra at uniform spacing around perimeter, all at elevation -1 floor level. Four greed-gold-chain hang from the ceiling. Two greed-coin-cascade spill from the throne dais steps. Eight coin-pile scatter the floor. Two greed-golden-vase and two greed-golden-banner complete the perimeter.

**Flow:** Descend stairs into the sunken court. Aureo stands at her greed-golden-throne, draped in gold. The room is circular in feel (corners are decorative, fight happens in center). Phase 1 tests dodging -- coin projectile storms arc across the room in fan patterns. Phase 2 is the circle's thesis made mechanical: she takes your weapons. You feel the loss. Each theft forces adaptation to a different weapon. Phase 3 strips you bare. The player who hoarded ammo all circle now has nothing. A tooltip flashes: 'Sprint into her.' The player's ram attack deals 15 damage per hit with a 1-second cooldown. Aureo has 30% HP remaining -- approximately 4-5 ram hits to kill. Alternatively, stolen weapons are scattered at the room's four edges (NE, NW, SE, SW corners) and can be reclaimed. Both strategies are viable. Phase 3 also reduces Aureo's speed by 40% -- she staggers from the stolen weapon weight, mirroring the hoarding penalty the player experienced. Thematic symmetry: greed slows her too. The player who lets go and rams wins fastest.

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Treasury | (16, 13, 12, 2) | `showHint` | `once: true` | `{ text: "The balcony gleams with ammunition. But weight has consequence here." }` |
| T2 | Weight Room | (18, 29, 8, 8) | `activatePressurePlates` | `ammo > 150%` | `{ sinkRate: 0.5, sinkDepth: -1 }` |
| T3 | Weight Room | (18, 29, 8, 8) | `showHint` | `once: true, ammo > 150%` | `{ text: "The floor groans beneath your burden. Let go." }` |
| T4 | Auction Hall | (17, 43, 10, 2) | `lockDoors` | `once: true` | -- |
| T5 | Auction Hall | (17, 43, 10, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'hoarder', count:2}, {type:'hoarder', count:2}] }` |
| T6 | Auction Hall | -- | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'hoarder', count:2}, {type:'hoarder', count:2}] }` |
| T7 | Auction Hall | -- | `unlockDoors` | On wave 2 clear | -- |
| T8 | Auction Hall pillar | P1-P4 positions | `destroyPillar` | coin-pile destroyed | `{ pillarId: 1-4, rubbleElevation: 0.5 }` |
| T9 | Boss chamber | (16, 59, 12, 2) | `bossIntro` | `once: true` | `{ text: "Everything you carry was taken from another. I will take it from you." }` |
| T10 | Boss chamber | (16, 59, 12, 2) | `lockDoors` | `once: true, delay: 3` | -- |
| T11 | Boss chamber | -- | `bossPhase2` | Boss HP < 66% | `{ action: 'stealWeapon', interval: 20 }` |
| T12 | Boss chamber | -- | `bossPhase3` | Boss HP < 33% | `{ action: 'stealAllWeapons', scatterPositions: [[16,59],[28,59],[16,70],[28,70]] }` |

---

## Environment Zones

| Zone | Type | Bounds | Intensity | Notes |
|------|------|--------|-----------|-------|
| Global warmth | `ambientTint` | Full level (0,0,44,66) | 0.6 | Gold-amber color shift on all surfaces |
| Treasury spotlight | `pointLight` | Each greed-chest-pedestal | 0.8 | Focused beams highlighting treasure |
| Weight Room creak | `sfx` | Pressure plate grid (18,29,8,8) | 0.5 | Metal groaning SFX when plates stressed |
| Boss coin storm | `particleZone` | Boss chamber (15,58,14,14) | varies | Gold coin particles during phase 1 |
| Hoarding penalty | `movementModifier` | Full level (0,0,44,66) | 0.5 | Speed x0.5 when ammo > 150% capacity |

### Hoarding Penalty HUD Feedback

When the player picks up ammo that pushes them above 150% capacity, the HUD displays a 'BURDENED' indicator with the player's current ammo weight percentage. The screen edges gain a faint gold vignette. Movement speed reduction is gradual, not instant -- crossing the threshold produces a brief 'heavy footstep' audio cue and the player's view bobs more pronouncedly.

The first time the hoarding penalty activates, a tooltip appears: 'Excess weighs you down. Drop what you don't need.'

---

## Player Spawn

- **Position:** (22, 5) -- center of Vault Entrance
- **Facing:** pi (south -- facing toward Treasury, gold gleaming ahead)

---

## Theme Configuration

```typescript
editor.createTheme('circle-4-greed', {
  name: 'greed',
  displayName: 'GREED -- The Circle of Avarice',
  primaryWall: MapCell.WALL_OBSIDIAN,         // Dark polished metal base
  accentWalls: [MapCell.WALL_STONE],          // Stone accents for variety
  fogDensity: 0.03,
  fogColor: '#1f1a08',
  ambientColor: '#ffcc44',
  ambientIntensity: 0.20,
  skyColor: '#0a0800',
  particleEffect: 'goldDust',                 // Floating gold motes in air
  enemyTypes: ['hoarder', 'hoarder'],
  enemyDensity: 1.0,                          // Standard density
  pickupDensity: 2.5,                         // VERY high -- abundance is the trap
  circleSpecific: {
    hoardingThreshold: 1.5,                   // 150% ammo capacity
    hoardingSpeedMultiplier: 0.5,             // Halved movement speed
    pressurePlateEnabled: true,               // Weight Room mechanic
    destructiblePillars: true,                // Auction Hall mechanic
    weaponTheft: true,                        // Boss phase 2+3
  },
});
```

---

## Narrative Beats

1. **Vault Entrance arrival:** The air is thick with warmth. Gold everywhere. After the organic horror of Gluttony, this feels almost welcoming. The inscription near the door reads: *"Aurum clamat -- et qui audit, perit."* (Gold calls -- and he who listens, perishes.)
2. **Treasury discovery:** The player sees the mezzanine balcony lined with ammo. The first goatKnights appear -- armored, slow, tanky. The tension crystallizes: you need ammo to kill them, but ammo weighs you down. The lesson begins.
3. **Weight Room epiphany:** The floor sinks. The game literally will not let you pass while burdened. The player must DROP ammo pickups to lighten their load. What you drop stays dropped. The floor rises. You pass through lighter than you entered. Greed's lesson delivered through level geometry.
4. **Auction Hall destruction:** The pillars fall. The room you fight in reshapes around you. The coin-pile props you thought were decoration become the fulcrum of tactical decisions. Destroy cover to open sightlines? Keep it for safety? The room teaches: wealth structures can be torn down.
5. **Aureo intro:** She speaks from her throne: *"Everything you carry was taken from another. I will take it from you."* Phase 1 begins. Golden coin storms fill the air.
6. **Weapon theft (phase 2):** Your weapon vanishes mid-fight. The shock. She wields it against you. You scramble to adapt. Then she takes the next one. The player experiences loss -- mechanical, tangible loss.
7. **Stripped bare (phase 3):** All weapons gone. Nothing left. A tooltip flashes: 'Sprint into her.' The player's ram attack deals 15 damage per hit (4-5 rams to kill). Or sprint to a corner and reclaim a stolen weapon -- both paths are viable. Aureo staggers at 40% reduced speed, weighed down by stolen weapons. The scapegoat, stripped of everything, is at its most powerful. The player who lets go and rams wins fastest.
8. **Aureo's defeat:** She crumbles into gold dust. The coins, the chains, the crowns -- all dissolve. The room is bare marble. Beautiful in its emptiness. Title card: *CIRCLE THE FIFTH -- WRATH*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter and renders in LevelMeshes.tsx
2. All 6 rooms are reachable from spawn (DAG validation passes)
3. Hoarding penalty mechanic works (speed reduction above 150% ammo capacity)
4. Pressure plate system in Weight Room functions (sink at >150%, hold at <=100%)
5. Destructible pillars in Auction Hall respond to splash damage and collapse
6. Boss weapon-theft phases function (steal current weapon, scatter at edges)
7. PlaytestRunner AI can navigate from spawn to boss and defeat Aureo
8. PBR materials from AmbientCG render on walls/floors (Metal007, DiamondPlate001, Marble006)
9. Treasury mezzanine balcony is traversable (ramps connect ground to elevation 1)
10. At least 5 distinct Meshy props visible as GLB instances (coin-pile, greed-treasure-chest, greed-golden-chalice, greed-golden-key-display, greed-golden-candelabra)
11. Each room feels distinct: Vault (opulent entry), Treasury (vertical choice), Weight Room (puzzle), Auction Hall (destructible arena), Reliquary (secret reward), Court (boss strip)

---

## What This Is NOT

- NOT a dungeon crawl. Greed is a vault, a treasury, a place of accumulated wealth. The architecture is ordered, symmetrical, designed to display.
- NOT generous despite appearances. The ammo abundance is the trap. The circle gives to take away.
- NOT using the procedural generator's `explore -> arena -> boss` cycle. The Weight Room puzzle breaks combat pacing deliberately.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models + AmbientCG PBR textures.
- NOT a repeat of earlier circles' color palette. Gold/amber/bronze replaces the blue-gray of Limbo, the warm marble of Lust, and the sickly green of Gluttony.

---

## 3D Spatial Design

### Room: Vault Entrance (8x6, exploration)

**Player Experience:** You step into an airlock of wealth. Gold gleams from every surface -- warm, inviting, suffocating. The room is small enough to feel intimate but tall enough that torch-light fades into darkness above. Two vases frame the entrance like sentinels of excess. You can already see ammo glinting on the floor and the chest on its pedestal. The temptation starts before you take a single step.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| greed-vault-arch | (22, 2) north wall, door cells | 1.0 | face-south | Frame the vault entrance |
| greed-vault-arch | (22, 7) south door | 1.0 | face-south | Frame exit to Treasury corridor |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| greed-golden-vase | (19, 4) west of entrance | 0.8 | Flanking entrance, opulence motif |
| greed-golden-vase | (25, 4) east of entrance | 0.8 | Flanking entrance, opulence motif |
| coin-pile | (20, 3) NW floor | 0.7 | Scattered wealth, atmosphere |
| coin-pile | (21, 6) center-south floor | 0.7 | Abundance motif near ammo |
| coin-pile | (24, 5) east floor | 0.6 | Third pile, reinforcing excess |
| coin-pile | (19, 6) SW floor | 0.5 | Additional scatter, sells opulence |
| coin-pile | (25, 3) NE floor near wall | 0.5 | Corner wealth, no surface left bare |
| greed-gold-bar-stack | (20, 4) near west wall | 0.6 | Stacked gold bars, heavy wealth motif |
| greed-gold-bar-stack | (24, 3) near north wall | 0.5 | Additional gold stacking |
| greed-chest-pedestal | (23, 4) center pedestal | 1.0 | Display stand for treasure chest |
| greed-treasure-chest | (23, 4) on pedestal | 0.9 | Central wealth centerpiece |

**Lighting:**
- 2x torch-sconce-ornate: (19, 3) north wall face-E, (25, 3) north wall face-W -- warm amber `#ffaa33`, radius 5 cells, intensity 0.7
- Spot light on chest pedestal: `#ffe066`, radius 2 cells, intensity 0.8

**Platforming:** Flat. Two shallow steps (RAMP cells) descend at the south exit toward the Treasury corridor. Elevation drop of 0.25 units across 2 cells.

**Playtest Note:** The Vault Entrance is the first impression of Greed and must scream opulence. The additional coin piles and gold bar stacks address the playtest finding that 8 props were insufficient for a room meant to "drip gold." Target: 13 environmental props for an 8x6 room.

---

### Room: Treasury (14x12, exploration)

**Player Experience:** The room opens up dramatically. Below you, rows of treasure chests sit on illuminated pedestals -- a museum of greed. Above, a mezzanine balcony rings the room, its rails lined with ammo pickups that glow like a promise. Ramps at all four corners lead up. You hear the heavy footfalls of armored goatKnights patrolling the chest lanes below. The choice crystallizes: grab what you can see, or stay lean and survive.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| greed-gold-pillar | (16, 13) NW column | 1.0 | none | Structural support, balcony anchor |
| greed-gold-pillar | (28, 13) NE column | 1.0 | none | Structural support, balcony anchor |
| greed-gold-pillar | (16, 22) SW column | 1.0 | none | Structural support, balcony anchor |
| greed-gold-pillar | (28, 22) SE column | 1.0 | none | Structural support, balcony anchor |
| greed-diamond-plate-platform | (16, 13) - (17, 22) west balcony | 1.0 | none | Mezzanine balcony, elevation 1 |
| greed-diamond-plate-platform | (27, 13) - (28, 22) east balcony | 1.0 | none | Mezzanine balcony, elevation 1 |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| greed-chest-pedestal | 8 positions, 2 rows of 4 in center | 0.8 | Display stands for treasure chests |
| greed-treasure-chest | 8 positions on pedestals | 0.8 | Overwhelming abundance of treasure |
| coin-pile | 6 positions between chests | 0.6 | Fill gaps with scattered coins |
| greed-golden-chalice | (20, 16) table surface | 0.6 | Liturgical wealth detail |
| greed-golden-chalice | (24, 19) table surface | 0.6 | Liturgical wealth detail |
| greed-golden-candelabra | (16, 13) balcony NW corner | 1.0 | Balcony corner lighting |
| greed-golden-candelabra | (28, 13) balcony NE corner | 1.0 | Balcony corner lighting |
| greed-golden-candelabra | (16, 22) balcony SW corner | 1.0 | Balcony corner lighting |
| greed-golden-candelabra | (28, 22) balcony SE corner | 1.0 | Balcony corner lighting |

**Lighting:**
- 4x torch-sconce-ornate: east and west walls at (15, 15), (29, 15), (15, 20), (29, 20) -- amber `#ffaa33`, radius 5 cells
- Spot lights on each chest pedestal: `#ffe066`, radius 2 cells, intensity 0.8
- 4x candelabrum-tall on balcony corners: `#ffcc44`, radius 3 cells

**Platforming:** Ground floor at elevation 0. Mezzanine balcony at elevation 1, 2 cells wide along east and west walls. Ramps at NE, NW, SE, SW corners: 2 cells wide, 3 cells long, slope from 0 to 1.

---

### Room: Weight Room (10x10, puzzle)

**Player Experience:** The warmth drains. The air feels heavier here. Cabinets line the walls like a hoarder's den. The floor ahead is a grid of steel plates, each stamped with a weight symbol. A skeletal goat lies on a sunken plate near the entrance, surrounded by ammo it refused to release. The inscription on the wall reads: "Only the unburdened may pass." You look at your ammo count and feel a knot in your stomach.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| greed-safe-door | (22, 28) north entry | 0.9 | face-south | Heavy vault door at entry |
| greed-safe-door | (22, 37) south exit | 0.9 | face-south | Heavy vault door at exit |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| greed-pressure-plate | 16 positions in 4x4 grid, (18-25, 29-36) | 1.0 | Pressure-sensitive floor sections |
| greed-gear-mechanism | (17, 30) west wall | 1.2 | Vault mechanism, visual weight motif |
| greed-gear-mechanism | (27, 30) east wall | 1.2 | Vault mechanism, visual weight motif |
| greed-gear-mechanism | (17, 34) west wall south | 1.0 | Additional mechanism, reinforces puzzle theme |
| greed-gear-mechanism | (27, 34) east wall south | 1.0 | Additional mechanism, reinforces puzzle theme |
| greed-gold-bar-stack | (19, 30) far side bait | 0.7 | Visual ammo marker -- bait |
| greed-gold-bar-stack | (25, 30) far side bait | 0.7 | Visual ammo marker -- bait |
| greed-skeletal-goat | (20, 29) near entrance on sunken plate | 1.0 | Environmental teach: this goat couldn't let go |
| greed-ammo-scatter | (20, 29) around skeletal goat | 0.5 | Decorative scattered ammo (non-pickup) around skeleton |
| greed-ammo-scatter | (21, 30) around skeletal goat | 0.5 | More decorative scattered ammo near skeleton |
| coin-pile | (18, 33) SW floor near plate | 0.4 | Wealth detritus, atmosphere |
| coin-pile | (25, 36) SE floor near exit | 0.4 | Wealth detritus, atmosphere |

**Lighting:**
- 4x torch-sconce-ornate: (17, 29) NW wall, (27, 29) NE wall, (17, 36) SW wall, (27, 36) SE wall -- dimmer amber `#ffaa33`, radius 4 cells, intensity 0.5
- Floor plates have subtle warm glow when active: `#ffcc00`, radius 1 cell

**Platforming:** Entry platform at elevation 0. Pressure plate grid at elevation 0 (sinks to -1 when player is burdened >150% ammo). Far platform at elevation 0. When plates sink, adjacent plates remain, creating a checkerboard of pits and platforms.

**Playtest Note (P0):** The playtest identified the Weight Room as the most under-dressed room in Act 2 -- only 6 props in a 10x10 room. The additions above address: (a) the missing skeletal goat environmental teach described in the narrative, (b) pressure plate visual presence via 16 plate props, (c) gear mechanisms on all four wall sections hinting at mechanical plates, (d) two more torches for better coverage (4 total, one per quadrant), (e) decorative coin scatter for atmosphere. Target: 18 environmental props for a 10x10 room.

---

### Room: Reliquary (6x6, secret)

**Player Experience:** You push through the false wall and the air changes -- cooler, quieter, tinged with the smell of old marble. Golden keys hang on the north wall in recessed display alcoves, glinting in candlelight. Keys to nothing. A chest sits in the center beside a scroll. Health and ammo sit generously on shelves. This room rewards the curious, not the greedy.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| greed-vault-arch | (2, 35) east entry (WALL_SECRET) | 0.7 | face-west | Hidden entrance frame |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| greed-golden-key-display | (4, 33) north wall | 0.8 | Three golden keys in display |
| greed-jeweled-pedestal | (4, 35) center | 0.8 | Display pedestal for chest |
| greed-treasure-chest | (4, 35) on pedestal | 0.7 | Central treasure piece |
| greed-golden-chalice | (3, 36) south shelf | 0.5 | Liturgical wealth detail |
| greed-golden-chalice | (6, 36) south shelf | 0.5 | Liturgical wealth detail |

**Lighting:**
- 1x candelabrum-tall: (5, 34) center floor -- pale gold `#ffdd66`, radius 3 cells
- Spot lights on greed-golden-key-display: `#ffe066`, radius 1 cell, intensity 0.6

**Platforming:** Flat, elevation 0. Recessed display alcoves in north wall at elevation 1.2 (golden keys mounted). No jumps required.

---

### Room: Auction Hall (12x12, arena)

**Player Experience:** A grand hall with four structural pillars rising to the ceiling, each with a pile of coins at its base. The pillars create lanes and cover -- you instinctively plan your orbit paths. Then the doors slam shut and enemies pour in from every direction. The first rocket you fire clips a coin pile and the entire pillar collapses in a cascade of stone and gold dust. Cover gone. Sightline opened. The room reshapes around your violence.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| greed-gold-pillar | (19, 45) P1 NW | 1.2 | none | Destructible structural pillar |
| greed-gold-pillar | (25, 45) P2 NE | 1.2 | none | Destructible structural pillar |
| greed-gold-pillar | (19, 51) P3 SW | 1.2 | none | Destructible structural pillar |
| greed-gold-pillar | (25, 51) P4 SE | 1.2 | none | Destructible structural pillar |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| coin-pile | (19, 45) at P1 base | 0.8 | Destructible trigger for pillar collapse |
| coin-pile | (25, 45) at P2 base | 0.8 | Destructible trigger for pillar collapse |
| coin-pile | (19, 51) at P3 base | 0.8 | Destructible trigger for pillar collapse |
| coin-pile | (25, 51) at P4 base | 0.8 | Destructible trigger for pillar collapse |
| greed-golden-banner | (17, 43) north wall | 0.9 | War banner, atmosphere |
| greed-golden-banner | (27, 53) south wall | 0.9 | War banner, atmosphere |
| greed-treasure-chest | (17, 51) SW edge | 0.6 | Non-destructible decoration, visual wealth |
| greed-treasure-chest | (27, 45) NE edge | 0.6 | Non-destructible decoration, visual wealth |
| coin-pile | (17, 48) west edge floor | 0.4 | Floor scatter, fills empty space |
| coin-pile | (27, 48) east edge floor | 0.4 | Floor scatter, fills empty space |
| greed-golden-vase | (16, 43) NW corner | 0.5 | Corner decoration |
| greed-golden-vase | (28, 53) SE corner | 0.5 | Corner decoration |

**Lighting:**
- 4x torch-sconce-ornate: (16, 44) NW wall, (28, 44) NE wall, (16, 52) SW wall, (28, 52) SE wall -- amber `#ffaa33`, radius 5 cells
- After pillar collapse: rubble mounds cast scattered shadow, sightlines open

**Platforming:** Flat arena at elevation 0. Four 1x1 pillars rise to full ceiling height. When destroyed, they leave rubble mounds at elevation 0.5 (partial cover, climbable).

**Playtest Note:** Auction Hall was functional but visually sparse for a 12x12 space. Added treasure chests at edges (non-destructible decoration), floor coin scatter, corner vases, and increased torches from 2 to 4 for better lighting coverage. Target: 16 environmental props for a 12x12 arena.

---

### Room: Aureo's Court (14x14, boss)

**Player Experience:** You descend stairs into a sunken chamber of gold marble. The walls gleam. Six candelabras ring the perimeter in a ceremonial circle. Golden chains hang from the ceiling like curtains of wealth. At the far end, on a raised dais, sits a golden throne -- and Aureo upon it, draped in chains and crowns. She speaks: "Everything you carry was taken from another. I will take it from you." The first volley of golden coins arcs through the air like a storm of tiny suns.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| greed-golden-throne | (22, 59) north-center dais | 1.5 | face-south | Boss throne, Aureo's seat |
| greed-vault-arch | (22, 58) entrance from stairs | 1.0 | face-south | Grand entrance frame |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| greed-golden-candelabra | (17, 60) perimeter NW | 1.2 | Ceremonial ring lighting |
| greed-golden-candelabra | (27, 60) perimeter NE | 1.2 | Ceremonial ring lighting |
| greed-golden-candelabra | (17, 65) perimeter W | 1.2 | Ceremonial ring lighting |
| greed-golden-candelabra | (27, 65) perimeter E | 1.2 | Ceremonial ring lighting |
| greed-golden-candelabra | (17, 70) perimeter SW | 1.2 | Ceremonial ring lighting |
| greed-golden-candelabra | (27, 70) perimeter SE | 1.2 | Ceremonial ring lighting |
| greed-gold-chain | (19, 61) ceiling hang NW | 1.0 | Golden chains, Aureo's motif |
| greed-gold-chain | (25, 61) ceiling hang NE | 1.0 | Golden chains, Aureo's motif |
| greed-gold-chain | (19, 69) ceiling hang SW | 1.0 | Golden chains, Aureo's motif |
| greed-gold-chain | (25, 69) ceiling hang SE | 1.0 | Golden chains, Aureo's motif |
| greed-golden-banner | (20, 59) flanking throne N | 1.0 | Wealth banner, throne decoration |
| greed-golden-banner | (24, 59) flanking throne N | 1.0 | Wealth banner, throne decoration |
| coin-pile | (18, 63) floor scatter NW | 0.5 | Floor decoration |
| coin-pile | (26, 63) floor scatter NE | 0.5 | Floor decoration |
| coin-pile | (18, 68) floor scatter SW | 0.5 | Floor decoration |
| coin-pile | (26, 68) floor scatter SE | 0.5 | Floor decoration |
| coin-pile | (22, 62) floor center-north | 0.6 | Additional floor scatter |
| coin-pile | (22, 67) floor center-south | 0.6 | Additional floor scatter |
| coin-pile | (19, 65) floor west midline | 0.4 | Additional scatter, opulence |
| coin-pile | (25, 65) floor east midline | 0.4 | Additional scatter, opulence |
| greed-coin-cascade | (21, 59) near throne dais | 0.8 | Coins spilling from throne steps |
| greed-coin-cascade | (23, 59) near throne dais | 0.8 | Coins spilling from throne steps |
| greed-golden-vase | (17, 60) NW perimeter | 0.6 | Perimeter decoration |
| greed-golden-vase | (27, 60) NE perimeter | 0.6 | Perimeter decoration |

**Lighting:**
- 6x candelabrum-tall perimeter ring: warm gold `#ffcc44`, radius 4 cells, intensity 0.7
- Throne spot light: `#ffe066`, radius 3 cells, intensity 1.0, aimed at throne
- Floor golden wash: ambient `#ffcc44` at intensity 0.3 from reflective gold marble

**Platforming:** Sunken at elevation -1 (descend stairs from Auction Hall). Throne platform at north-center: 3x3, elevation 0 (raised dais). Rest of floor at -1 (gold marble, reflective). Six candelabrum-tall at floor level (-1).

**Playtest Note:** Boss chamber had only 18 props for a 14x14 room. Added coin cascade props near the throne dais, additional floor coin scatter (from 4 to 8 piles), and perimeter vases. The throne (greed-golden-throne) was already present in structural assets. Target: 28 environmental props for a 14x14 boss arena.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Notes |
|---------|------|----------|-------|
| coin-pile | Gold Coin Pile | ✅ exists | Used in Vault, Treasury, Auction Hall, Boss |
| golden-idol | Golden Idol | ✅ exists | Decorative, optional placement |
| greed-chest-pedestal | Treasure Chest Pedestal | ✅ exists | Used in Vault, Treasury, Reliquary |
| greed-coin-cascade | Gold Coin Cascade | ✅ exists | Used in Boss (throne dais) |
| greed-diamond-plate-platform | Diamond Plate Platform | ✅ exists | Used in Treasury balcony |
| greed-gear-mechanism | Vault Gear Mechanism | ✅ exists | Used in Weight Room (4x) |
| greed-gold-bar-stack | Gold Bar Stack | ✅ exists | Used in Vault, Weight Room |
| greed-gold-chain | Hanging Gold Chain | ✅ exists | Used in Boss (4x ceiling) |
| greed-gold-pillar | Gold-Veined Pillar | ✅ exists | Used in Treasury, Auction Hall |
| greed-golden-banner | Golden War Banner | ✅ exists | Used in Auction Hall, Boss |
| greed-golden-candelabra | Golden Candelabra | ✅ exists | Used in Treasury balcony, Boss perimeter |
| greed-golden-chalice | Golden Chalice | ✅ exists | Used in Treasury |
| greed-golden-key-display | Golden Key Display | ✅ exists | Used in Reliquary |
| greed-golden-throne | Golden Throne | ✅ exists | Used in Boss (hero piece) |
| greed-golden-vase | Golden Vase | ✅ exists | Used in Vault, Auction Hall, Boss |
| greed-jeweled-pedestal | Jeweled Pedestal | ✅ exists | Used in Reliquary |
| greed-pressure-plate | Pressure Plate | ✅ exists | Used in Weight Room (16x grid) |
| greed-safe-door | Vault Safe Door | ✅ exists | Used in Weight Room |
| greed-treasure-chest | Treasure Chest | ✅ exists | Used in Vault, Treasury, Auction Hall, Reliquary |
| greed-vault-arch | Vault Archway | ✅ exists | Used in Vault, Reliquary, Boss |
| greed-skeletal-goat | Skeletal Goat Remains | ✅ exists | Playtest P1: Weight Room environmental teach |
| greed-ammo-scatter | Decorative Ammo Scatter | ✅ exists | Playtest P1: Weight Room skeleton context |
