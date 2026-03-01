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
- Point lights from Torch_Metal props (warm amber `#ffaa33`, radius 5 cells)
- Spot light on Coin_Pile pedestals in Treasury (focused `#ffe066`, radius 2 cells, intensity 0.8)
- Boss chamber: ring of 6 CandleStick_Triple around perimeter, golden wash from floor
- No directional light -- underground vault, sealed from the world

### Props (from Fantasy Props MegaKit)

| Prop | Placement | Purpose |
|------|-----------|---------|
| Torch_Metal | Wall-mounted, 2-4 per room | Primary light, gold-tinted glow |
| Coin_Pile, Coin_Pile_2 | Pedestals, floor, shelves | Overwhelming abundance motif |
| Chest_Wood | Rows in Treasury, scattered elsewhere | Treasure containers, visual wealth |
| Chalice | Table surfaces, pedestals | Liturgical wealth, gold gleam |
| Key_Gold | Display cases in Reliquary | Symbolism: keys to nothing |
| Chain_Coil | Hanging in boss chamber, draped on walls | Aureo's golden chains motif |
| CandleStick_Triple | Boss chamber perimeter, Treasury balcony | Warm ceremonial lighting |
| Barrel | Near supply pickups | Visual marker for actual loot |
| Cabinet | Weight Room walls | Storage motif, hoarding imagery |
| Vase_2, Vase_4 | Floor corners, shelf tops | Decorative wealth |

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Scratches004 | Metal walls near floor | Desperate clawing, past hoarders |
| Fingerprints002 | Near Coin_Pile props, Chest_Wood | Countless hands grabbing |

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
| Treasury (ground) | goatKnight | 2 | Patrol between chest rows, slow sweep | Dark, armored |
| Treasury (balcony) | hellgoat | 2 | Guard balcony ramps, ranged positions | Brown goatman |
| Weight Room | goatKnight | 1 | Stationed on far platform, blocks exit | Dark, armored |
| Weight Room | hellgoat | 1 | Patrols pressure plate zone | Brown goatman |
| Auction Hall wave 1 | goatKnight | 2 | Spawn N and S, advance through pillars | Dark, armored |
| Auction Hall wave 1 | hellgoat | 2 | Spawn E and W, flank wide | Brown goatman |
| Auction Hall wave 2 | goatKnight | 2 | Spawn from corners, aggressive push | Dark, armored |
| Auction Hall wave 2 | hellgoat | 2 | Spawn from door-side, fast rush | Brown goatman |
| Boss chamber | Aureo | 1 | Boss AI, 3 phases (coins, steal, strip) | boss-aureo.glb |

**goatKnight Balance Note:** goatKnights have 15 HP + 5 armor = 20 effective HP. With the Hellfire Cannon (3 dmg, 150ms fire rate), they die in 7 shots (~1 second). With the Brim Shotgun at close range (28 dmg), they die in 1 shot. With the Hell Pistol (4 dmg per shot), they require 5 shots (~1.5 seconds). The armor makes them feel tanky without being bullet sponges.

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
| Vault Entrance | 2x Torch_Metal (walls, surfaceAnchor: N/S, offsetY: 1.5), 3x Coin_Pile (floor), 1x Chest_Wood (center pedestal), 2x Vase_4 (flanking entrance) |
| Treasury (ground) | 8x Chest_Wood (pedestals in 2 rows of 4), 6x Coin_Pile_2 (between chests), 4x Torch_Metal (walls, surfaceAnchor: E/W, offsetY: 1.8), 2x Chalice (table surfaces) |
| Treasury (balcony) | 4x CandleStick_Triple (balcony corners), 2x Barrel (near ramp tops), railing geometry (structural) |
| Weight Room | 4x Cabinet (walls, surfaceAnchor: N/S/E/W, offsetY: 0.0), 2x Torch_Metal (walls, surfaceAnchor: E/W, offsetY: 1.5), pressure plate grid markings on floor |
| Reliquary | 3x Key_Gold (wall display, surfaceAnchor: N, offsetY: 1.2), 2x Chalice (shelf), 1x Scroll_1 (pedestal), 1x Chest_Wood (center) |
| Auction Hall | 4x structural pillars (Coin_Pile at base of each, destructible), 2x Torch_Metal (walls, surfaceAnchor: E/W, offsetY: 1.8), 2x Banner_1 (walls, surfaceAnchor: N/S, offsetY: 2.0) |
| Boss chamber | 6x CandleStick_Triple (ring around perimeter), 4x Chain_Coil (hanging from ceiling, golden), 2x Banner_2 (flanking throne, surfaceAnchor: N, offsetY: 2.0), 1x throne geometry (center-north, structural), 4x Coin_Pile (floor scatter) |

---

## Room Details

### Room 1: Vault Entrance (8x6)

```
  N
  ^
  |
  +---------+--------+
  | T       |        |  T = Torch_Metal (wall)
  |    CP   |  CW    |  CP = Coin_Pile
  |         |        |  CW = Chest_Wood
  |   V4  [A] V4     |  A = ammo pickup
  |         |        |  V4 = Vase_4
  |    CP [A]  CP    |  [A] = ammo pickup
  |    ★              |  ★ = player spawn
  +---[===door===]---+
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
  |  BALCONY (elev 1)            BALCONY (elev 1)  |
  | [A]..railing..............railing..[A] |
  |  |                                  |  |
  | RAMP                          RAMP  |
  |  |    CW  CW  CW  CW          |    |
  |  |    CP  CP  CP  CP          |    |
  |  |                              |  |
  | [A]  CW  CW  CW  CW  [H] [A] |
  |       CP  CP  CP  CP           |
  |  |                              |  |
  | RAMP                          RAMP  |
  | [A]..railing..............railing..[A] |
  |  BALCONY (elev 1)            BALCONY (elev 1)  |
  +--[===door===]--+
  |
  v South (to Weight Room)

  CW = Chest_Wood on pedestal    CP = Coin_Pile_2
  [A] = ammo pickup (balcony)    [H] = health pickup (ground)
  T = Torch_Metal (on E/W walls, not shown for clarity)
  goatKnight x2 patrol ground between chest rows
  hellgoat x2 guard balcony ramp tops
```

**Elevation:** Ground floor at elevation 0. Mezzanine balcony at elevation 1 runs along east and west walls, connected by ramps at NE, NW, SE, SW corners. Balcony is 2 cells wide. Ramps are 2 cells wide, 3 cells long, slope from 0 to 1.

**Flow:** Enter from north. Ground floor is a grid of Chest_Wood pedestals with Coin_Pile_2 between them -- tight lanes. Two goatKnights patrol these lanes (slow, armored, deadly in confined space). Balcony above is lined with ammo pickups -- visible, tempting. Ramps at all four corners access the balcony. Going up for ammo means: (a) exposed on the ramp, (b) carrying extra ammo slows you on the way back down. Two hellgoats guard the ramp tops. The tactical choice: stay lean on the ground and conserve, or load up and accept the penalty.

---

### Room 3: Weight Room (10x10)

```
  N (from Treasury)
  |
  +--[==door==]--+
  |               |
  | PP PP PP PP  |  PP = pressure plate section (3x3 each)
  | ↓↓ ↓↓ ↓↓ ↓↓ |  ↓↓ = sinks when heavy player stands on it
  |               |
  | PP PP PP PP  |  4x4 grid of plates = 16 sections
  | ↓↓ ↓↓ ↓↓ ↓↓ |
  |               |
  | PP PP PP PP  |  gK = goatKnight (far platform)
  | ↓↓ ↓↓ ↓↓ ↓↓ |  hg = hellgoat (patrols plates)
  |               |
  | PP PP PP PP  |  [A] = ammo (bait, far side)
  |      [A] [A] |  [H] = health (exit reward)
  |       gK     |
  +--[==door==]--+--secret--[RELIQUARY]
  |       [H]
  v South (to Auction Hall)

  Plate behavior:
  - Player ammo <= 100%: plates hold, normal traversal
  - Player ammo 100-150%: plates creak, visual warning
  - Player ammo > 150%: plates SINK (elevation 0 -> -1), blocking path
  - Sunk plates form pits: must jump across or DROP AMMO to lighten
```

**Elevation:** Entry platform at elevation 0. Pressure plate grid at elevation 0 (sinks to -1 when player is heavy). Far platform at elevation 0. Exit at elevation 0. When a plate sinks, adjacent plates remain -- creating a checkerboard of pits and platforms.

**Flow:** Enter from north. An inscription on the entrance wall reads: 'Only the unburdened may pass.' A pressure plate at the entrance visibly depresses under the player's weight, accompanied by a grinding stone sound. If the player steps onto the puzzle floor while burdened (>100% ammo), the plate sinks further and a stone barrier rises to block the exit.

A tooltip appears when the player first steps onto a pressure plate while burdened: 'Press [DROP KEY] to lighten your load.'

Environmental teach: a skeletal goat prop lies on a sunken plate near the entrance, surrounded by scattered ammo pickups. The visual narrative: this goat couldn't let go.

The room is a grid of pressure-sensitive floor sections. If the player has hoarded ammo (>150%), plates sink beneath them. To cross, the player must DROP ammo -- the game forces you to let go of what you've collected. The goatKnight on the far platform fires while you navigate. The hellgoat patrols the plates, adding pressure. Ammo pickups on the far side are bait -- picking them up makes the return trip heavier. The WALL_SECRET on the west wall leads to the Reliquary.

---

### Room 4: Auction Hall (12x12, arena)

```
  N (from Weight Room)
  |
  +----[==door==]----+
  |                   |
  |  P1         P2    |  P1-P4 = destructible pillars
  |  CP         CP    |  CP = Coin_Pile at pillar base
  |                   |
  |       [A]         |  [A] = ammo (center, between waves)
  |                   |
  |                   |
  |  P3         P4    |
  |  CP         CP    |
  |       [H]         |  [H] = health (south center)
  |                   |
  +----[==door==]----+
  |
  v South (to Aureo's Court)

  Pillars: structural columns with Coin_Pile at base
  - Destroying Coin_Pile (splash damage) = pillar COLLAPSES
  - Collapsed pillar: cover removed, sightline opened
  - Creates rubble (elevation +0.5 debris mound, partial cover)

  Wave 1: 2 goatKnight (N, S) + 2 hellgoat (E, W)
  Wave 2: 2 goatKnight (corners) + 2 hellgoat (door-side)
```

**Elevation:** Flat arena at elevation 0. Four pillars are 1x1 structural columns rising to full height. When destroyed, they leave rubble mounds at elevation 0.5 (partial cover, climbable). The room starts with four cover points and ends with four rubble mounds -- the tactical landscape inverts.

**Flow:** Enter from north, doors lock. Wave 1 spawns from all four cardinal directions. The four pillars provide cover -- orbiting them keeps you alive against goatKnights. But the Coin_Pile props at each pillar base are destructible. Splash damage (Hellfire Cannon, explosions) destroys them, which topples the pillar. Cover gone. Sightlines open. The room becomes an open arena. Wave 2 spawns after wave 1 clears -- by now, some or all pillars may be destroyed depending on the player's collateral damage. The room literally reshapes based on how you fight.

---

### Room 5: Reliquary (6x6, secret)

```
  E (from Weight Room WALL_SECRET)
  |
  +--[secret]--+
  |              |
  | KG  KG  KG  |  KG = Key_Gold (wall display)
  |              |
  | [A]  CW [A] |  CW = Chest_Wood (center)
  |     SC       |  SC = Scroll_1
  | [H] CH  [H] |  CH = Chalice
  |              |
  +--------------+

  Small treasure room. No enemies. Pure reward for exploration.
```

**Elevation:** Flat, elevation 0. Recessed display alcoves in north wall at elevation 1.2 (Key_Gold mounted).

**Flow:** Accessed through WALL_SECRET on west side of Weight Room. A hidden treasure chamber -- the only room in Circle 4 without enemies. Key_Gold props line the wall (decorative, symbolizing keys to nothing -- the trappings of wealth without purpose). Health and ammo pickups are generous here. The irony: the secret room rewards the player who was willing to explore rather than hoard. Scroll_1 on pedestal contains lore text.

---

### Room 6: Aureo's Court (14x14, boss)

```
  N (from Auction Hall, stairs down to elev -1)
  |
  +------[===stairs===]------+
  |                           |
  |  CT    CT    CT    CT     |  CT = CandleStick_Triple (perimeter ring)
  |                           |
  |    CC         CC          |  CC = Chain_Coil (hanging, golden)
  |                           |
  |         THRONE            |  THRONE = structural (north-center)
  |        [AUREO]            |  Aureo starts at throne
  |                           |
  |    CC         CC          |
  |                           |
  |  CT    CT    CT    CT     |  [A] = ammo (corners, phase 3 weapon recovery)
  | [A]                  [A]  |  [H] = health (N/S center edges)
  |          [H]              |
  | [A]                  [A]  |
  |          [H]              |
  +---------------------------+

  Phase 1: Aureo at throne. Coin projectile storms (arcing spread).
           Dodge laterally. CandleStick_Triple mark safe zones between arcs.

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

**Elevation:** Sunken at elevation -1 (descend via stairs from Auction Hall). The throne platform at north-center is elevation 0 (raised dais, 3x3). The rest of the floor is -1 (gold marble, reflective). Six CandleStick_Triple at uniform spacing around perimeter, all at elevation -1 floor level.

**Flow:** Descend stairs into the sunken court. Aureo stands at her throne, draped in gold. The room is circular in feel (corners are decorative, fight happens in center). Phase 1 tests dodging -- coin projectile storms arc across the room in fan patterns. Phase 2 is the circle's thesis made mechanical: she takes your weapons. You feel the loss. Each theft forces adaptation to a different weapon. Phase 3 strips you bare. The player who hoarded ammo all circle now has nothing. A tooltip flashes: 'Sprint into her.' The player's ram attack deals 15 damage per hit with a 1-second cooldown. Aureo has 30% HP remaining -- approximately 4-5 ram hits to kill. Alternatively, stolen weapons are scattered at the room's four edges (NE, NW, SE, SW corners) and can be reclaimed. Both strategies are viable. Phase 3 also reduces Aureo's speed by 40% -- she staggers from the stolen weapon weight, mirroring the hoarding penalty the player experienced. Thematic symmetry: greed slows her too. The player who lets go and rams wins fastest.

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Treasury | (16, 13, 12, 2) | `showHint` | `once: true` | `{ text: "The balcony gleams with ammunition. But weight has consequence here." }` |
| T2 | Weight Room | (18, 29, 8, 8) | `activatePressurePlates` | `ammo > 150%` | `{ sinkRate: 0.5, sinkDepth: -1 }` |
| T3 | Weight Room | (18, 29, 8, 8) | `showHint` | `once: true, ammo > 150%` | `{ text: "The floor groans beneath your burden. Let go." }` |
| T4 | Auction Hall | (17, 43, 10, 2) | `lockDoors` | `once: true` | -- |
| T5 | Auction Hall | (17, 43, 10, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'goatKnight', count:2}, {type:'hellgoat', count:2}] }` |
| T6 | Auction Hall | -- | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'goatKnight', count:2}, {type:'hellgoat', count:2}] }` |
| T7 | Auction Hall | -- | `unlockDoors` | On wave 2 clear | -- |
| T8 | Auction Hall pillar | P1-P4 positions | `destroyPillar` | Coin_Pile destroyed | `{ pillarId: 1-4, rubbleElevation: 0.5 }` |
| T9 | Boss chamber | (16, 59, 12, 2) | `bossIntro` | `once: true` | `{ text: "Everything you carry was taken from another. I will take it from you." }` |
| T10 | Boss chamber | (16, 59, 12, 2) | `lockDoors` | `once: true, delay: 3` | -- |
| T11 | Boss chamber | -- | `bossPhase2` | Boss HP < 66% | `{ action: 'stealWeapon', interval: 20 }` |
| T12 | Boss chamber | -- | `bossPhase3` | Boss HP < 33% | `{ action: 'stealAllWeapons', scatterPositions: [[16,59],[28,59],[16,70],[28,70]] }` |

---

## Environment Zones

| Zone | Type | Bounds | Intensity | Notes |
|------|------|--------|-----------|-------|
| Global warmth | `ambientTint` | Full level (0,0,44,66) | 0.6 | Gold-amber color shift on all surfaces |
| Treasury spotlight | `pointLight` | Each Chest_Wood pedestal | 0.8 | Focused beams highlighting treasure |
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
  enemyTypes: ['goatKnight', 'hellgoat'],
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
4. **Auction Hall destruction:** The pillars fall. The room you fight in reshapes around you. The Coin_Piles you thought were decoration become the fulcrum of tactical decisions. Destroy cover to open sightlines? Keep it for safety? The room teaches: wealth structures can be torn down.
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
10. At least 5 distinct Fantasy Props visible as GLB instances (Coin_Pile, Chest_Wood, Chalice, Key_Gold, CandleStick_Triple)
11. Each room feels distinct: Vault (opulent entry), Treasury (vertical choice), Weight Room (puzzle), Auction Hall (destructible arena), Reliquary (secret reward), Court (boss strip)

---

## What This Is NOT

- NOT a dungeon crawl. Greed is a vault, a treasury, a place of accumulated wealth. The architecture is ordered, symmetrical, designed to display.
- NOT generous despite appearances. The ammo abundance is the trap. The circle gives to take away.
- NOT using the procedural generator's `explore -> arena -> boss` cycle. The Weight Room puzzle breaks combat pacing deliberately.
- NOT using Kenney or KayKit assets. Fantasy Props MegaKit + AmbientCG PBR textures only.
- NOT a repeat of earlier circles' color palette. Gold/amber/bronze replaces the blue-gray of Limbo, the warm marble of Lust, and the sickly green of Gluttony.
