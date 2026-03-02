---
title: "Circle 5: Wrath"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 5
sin: rage
boss: Furia
act: 2
build_script: scripts/build-circle-5.ts
mechanic: escalation
related:
  - docs/circles/00-player-journey.md
  - docs/circles/04-greed.md
  - docs/agents/level-editor-api.md
---

# Circle 5: Wrath -- Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Identity

**Circle:** 5 (Wrath)
**Sin:** Rage
**Boss:** Furia -- hyper-masculine, exaggerated male anatomy, maximum rage (Dainir male base, maximum musculature morphs)
**Dominant Mechanic:** Escalation (enemy speed increases 10% every 5 seconds of active combat, capped at +60% maximum, reached after 30 seconds; the escalation timer resets to 0 after 3 seconds of no combat -- no enemies within 12 cells and no shots fired; visual indicator on escalated enemies: their eyes glow progressively brighter red, and at max escalation +60%, they emit a faint red particle trail)
**Dante Quote:** *"Fitti nel limo dicon: 'Tristi fummo...'"* (Fixed in the mud they say: 'We were sullen...')

**Feel:** Red. Furious, unrelenting red. Cracked concrete stained with old blood. Brick walls blackened by fire. Metal chains hanging from every ceiling. The ambient light has shifted from Limbo's cold blue through Greed's warm gold to a hot, angry orange-red. This circle does not wait. From the moment combat begins, a clock is ticking -- enemies get faster every 5 seconds. Hesitation kills. The lesson: **kill fast or be overwhelmed.** Wrath rewards aggression, punishes caution. The Goat's Bane (Bazooka) arrives here -- the weapon built for clearing rooms before escalation makes them lethal.

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Cracked concrete, blood-brown stain | Concrete034, Concrete041 | Rough, damaged, rage-worn |
| Accent walls | Dark fired brick | Bricks037, Bricks046 | Industrial, furnace-like |
| Floor (standard) | Rough concrete with cracks | Concrete015, Concrete022 | Uneven, stained dark red |
| Floor (marsh) | Muddy ground, submerged | Ground037, Ground058 | Wet, slow-movement zone |
| Floor (colosseum) | Packed sand | Ground082, Ground094 | Arena sand, gladiatorial |
| Ceiling | Rusted industrial metal | Metal042, Rust003 | Corroded, chains hang from it |
| Metal accents | Blackened iron, forge-hot | Metal019, Metal031 | Anvils, grates, structural |
| Secret room | Cooler stone, respite | Concrete008 | Deliberately muted -- the calm within rage |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Gate of Dis | 0.03 | `#1a0808` | Blood haze, thick heat shimmer |
| Blood Marsh | 0.05 | `#200a0a` | Steam rising from blood-marsh |
| Arena rooms | 0.02 | `#1a0505` | Clearer -- you need to see to kill fast |
| Gauntlet | 0.04 | `#220808` | Smoke from behind, horde approaching |
| Boss phase 3 | 0.06 | `#2a0000` | Pure red, walls closing |

### Lighting

- Ambient: `#ff4411` at intensity 0.22 (hot orange-red, aggressive)
- Point lights from torch-sconce-ornate props (deep red `#ff3300`, radius 4 cells, intensity 0.9)
- Lava glow from blood-marsh floor zones (crimson `#cc0000`, radius 3 cells, subtle pulse)
- Berserker Arena: overhead caged lights (wrath-caged-lantern, white-hot `#ff8866`, radius 6 cells)
- Boss colosseum: ring of torch-sconce-ornate around perimeter, sand-reflected warm bounce light
- No directional light -- sealed underground, lit by fire and fury

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Scratches007 | All concrete walls | Claw marks, rage-gouged surfaces |
| Rust001 | Metal surfaces near floor | Corroded by blood and heat |
| Leaking001 | Ceiling near chain anchor points | Blood seepage from above |

---

## Room Layout

### Overview (8 rooms)

```
              ┌────────────┐
              │  GATE OF   │  (10x6, exploration, sortOrder=0)
              │    DIS      │  Massive doorway. Anvils flank entrance.
              │  Spawn ★   │
              └─────┬──────┘
                    | corridor (width=3)
              ┌─────┴──────┐
              │   BLOOD    │  (16x14, exploration, sortOrder=1)
              │   MARSH    │  Waist-high blood. Raised islands.
              │  fireGoats │  Slow movement in marsh. Fast on islands.
              └──┬──────┬──┘
                 |      | corridor (width=2)
       corridor  |      |
       (width=2) | ┌────┴─────┐
                 | │ RAGE PIT │  (12x12, platforming, sortOrder=2)
                 | │ circular  │  Descending stone tiers. Fight upward.
                 | │  tiers   │
                 | └────┬─────┘
                 |      | corridor (width=2)
           ┌─────┴────┐|
           │ ARSENAL  ├┘  (12x6, exploration, sortOrder=3)
           │ narrow   │  Weapon displays. Goat's Bane at far end.
           │ run+grab │  Escalation punishes fighting here.
           └────┬─────┘
                | corridor (width=3)
           ┌────┴──────┐
           │ BERSERKER │  (14x14, arena, sortOrder=4)
           │  ARENA    │  3 rounds. Destructible barrels. Main fight.
           └──┬─────┬──┘
              |     | corridor (width=2)
    secret    |     |
  ┌───────────┘     |
  |           ┌─────┴──────┐
┌─┴────────┐  │  GAUNTLET  │  (6x20, corridor, sortOrder=5)
│ SHRINE   │  │  long hall  │  Enemies behind. Cannot stop. Forward.
│ OF FURY  │  │  ramps+elev │  Elevation changes. Shoot downhill.
│  (6x6)   │  └─────┬──────┘
│  secret  │        | corridor (width=3)
└──────────┘  ┌─────┴──────┐
              │  FURIA'S   │  (16x16, boss, sortOrder=7)
              │ COLOSSEUM  │  Open circular sand arena.
              │   boss     │  Chains from ceiling. Walls close in.
              └────────────┘
```

### Grid Dimensions

**48 wide x 96 deep** (96 x 192 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Gate of Dis | 19 | 2 | 10 | 6 | exploration | 0 | 0 |
| Blood Marsh | 16 | 12 | 16 | 14 | exploration | 0 (marsh=-0.5, islands=0) | 1 |
| Rage Pit | 22 | 30 | 12 | 12 | platforming | -2 (center) to 0 (rim) | 2 |
| Arsenal | 14 | 46 | 12 | 6 | exploration | 0 | 3 |
| Berserker Arena | 15 | 56 | 14 | 14 | arena | 0 | 4 |
| Shrine of Fury | 2 | 74 | 6 | 6 | secret | 0 | 5 |
| Gauntlet | 21 | 74 | 6 | 20 | corridor | 0 to -1 (descending ramps) | 6 |
| Furia's Colosseum | 16 | 98 | 16 | 16 | boss | 0 (sand floor, walls retract) | 7 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Gate of Dis | Blood Marsh | corridor | 3 | Wide, descent into marsh |
| Blood Marsh | Rage Pit | corridor | 2 | East-side exit, elevated path over marsh |
| Blood Marsh | Arsenal | corridor | 2 | West-side path, optional order |
| Rage Pit | Arsenal | corridor | 2 | South exit from pit rim |
| Arsenal | Berserker Arena | corridor | 3 | Wide, arena entrance |
| Berserker Arena | Shrine of Fury | secret | 2 | WALL_SECRET on west wall |
| Berserker Arena | Gauntlet | corridor | 2 | East exit, the gauntlet begins |
| Gauntlet | Furia's Colosseum | corridor | 3 | Final approach, widening |

---

## Entities

### Enemies (20 total + boss)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Blood Marsh | fireGoat | 3 | Stationed on raised islands, ranged fire | Crimson |
| Blood Marsh | hellgoat | 2 | Wade through marsh toward player | Brown goatman |
| Rage Pit (tier 1) | hellgoat | 2 | Hold lowest tier, charge upward | Brown goatman |
| Rage Pit (tier 2) | fireGoat | 2 | Ranged fire from middle tier | Crimson |
| Arsenal | goatKnight | 1 | Guards Goat's Bane pedestal | Dark, armored |
| Arsenal | fireGoat | 1 | Ranged support from weapon displays | Crimson |
| Berserker Arena R1 | fireGoat | 3 | Spawn from edges, ranged assault | Crimson |
| Berserker Arena R2 | goatKnight | 2 | Spawn N and S, armored advance | Dark, armored |
| Berserker Arena R3 | hellgoat (mini-boss) | 1 | Large variant, 80 HP, center spawn. Ground pound attack (3-cell AoE, 15 damage). Takes 2 direct Goat's Bane rockets to kill. | Brown, oversized |
| Berserker Arena R3 | fireGoat | 1 | Support spawn, ranged flanking | Crimson |
| Berserker Arena R3 | goatKnight | 1 | Tank spawn, blocks retreat | Dark, armored |
| Gauntlet | hellgoat | 3 | Spawn behind player as they advance | Brown goatman |
| Gauntlet | fireGoat | 2 | Spawn ahead on elevated sections | Crimson |
| Boss colosseum | Furia | 1 | Boss AI, 300 HP, 3 phases (charge, whip, berserker) | boss-furia.glb |

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Gate of Dis | ammo | (23, 5) center-east | Starting supplies |
| Gate of Dis | health | (21, 5) center-west | Full heal before marsh |
| Blood Marsh (island NW) | ammo | (18, 14) | On raised island, safe ground |
| Blood Marsh (island NE) | ammo | (29, 14) | Opposite island, forces crossing |
| Blood Marsh (island SE) | health | (28, 22) | Healing on far island |
| Blood Marsh (island SW) | ammo | (19, 23) | Near south exit |
| Rage Pit (tier 2) | health | (28, 34) | Mid-tier reward for clearing |
| Rage Pit (rim) | ammo | (24, 30) | Rim-level resupply |
| Arsenal | weapon (Goat's Bane) | (20, 51) far end pedestal | THE weapon pickup -- Bazooka |
| Arsenal | health | (21, 51) next to Goat's Bane pedestal | Reward for reaching the pedestal |
| Arsenal | ammo | (16, 48) near entrance | Quick grab before sprint |
| Berserker Arena (R1 clear) | ammo | (22, 62) center | Between rounds resupply |
| Berserker Arena (R2 clear) | health | (22, 60) center-north | Healing before round 3 |
| Berserker Arena (R2 clear) | ammo | (22, 68) center-south | Rocket ammo for round 3 |
| Gauntlet (1/3 mark) | health | (23, 81) | First survival pickup, on main path |
| Gauntlet (1/3 mark) | ammo | (22, 80) | Keep firing while running |
| Gauntlet (2/3 mark) | health | (23, 87) | Second survival pickup, on main path |
| Shrine of Fury | health x 2 | (4, 76), (6, 78) | Generous rest area |
| Shrine of Fury | ammo x 2 | (3, 78), (7, 76) | Full resupply |
| Boss colosseum | ammo x 3 | (18, 100), (30, 100), (24, 112) | Triangle spread, edge positions |
| Boss colosseum | health x 2 | (18, 112), (30, 112) | South corners, far from boss |

### Props (non-interactive)

| Room | Props |
|------|-------|
| Gate of Dis | 2x wrath-anvil (flanking entrance, floor), 4x wrath-chain-curtain (hanging from ceiling, 2 per side), 1x wrath-war-banner (above gate), 1x wrath-anger-graffiti-slab (west wall), 1x wrath-jagged-arch + 1x wrath-dented-iron-door (structural, north/south entries) |
| Blood Marsh | 5x wrath-stone-island (structural, elevation 0), 3x wrath-rusted-cage (on islands), 2x wrath-rage-furnace (on islands), 6x wrath-chain-curtain (hanging from ceiling), 2x wrath-blood-spattered-slab (walls), 2x wrath-corroded-pipe-pillar (on/near islands), 1x wrath-smashed-barrier (on ISL2), 1x wrath-iron-grate (ISL3 center floor) |
| Rage Pit | 4x wrath-pit-tier-ring (structural, concentric tiers), 3x wrath-rusted-cage (tier edges), 4x wrath-chain-curtain (hanging from ceiling), 2x wrath-smashed-barrier (tier debris), 1x wrath-blood-spattered-slab (lower tier), 2x wrath-corroded-pipe-pillar (rim), 1x wrath-iron-grate (pit center), 1x wrath-punching-bag-chain (tier 2 edge) |
| Arsenal | 4x wrath-shattered-weapon-rack (walls, 2 per side), 1x wrath-smashed-barrier (floor debris), 1x wrath-anger-graffiti-slab (west wall), 1x wrath-blood-spattered-slab (east wall), 1x wrath-jagged-arch + 1x wrath-weapon-pedestal (structural, entry/pedestal) |
| Berserker Arena | 8x wrath-explosive-barrel (destructible, ring around center), 6x wrath-chain-curtain (hanging from ceiling, industrial), 2x wrath-caged-lantern (east/west walls overhead), 1x wrath-jagged-arch + 1x wrath-dented-iron-door (structural, entry/exit) |
| Shrine of Fury | 1x wrath-smashed-barrier (west corner), 1x wrath-iron-grate (floor center), 1x wrath-caged-lantern (ceiling center) |
| Gauntlet | 6x wrath-chain-curtain (hanging from ceiling at intervals), 3x wrath-war-banner (walls, tattered), 2x wrath-smashed-barrier (ramp tops), 2x wrath-blood-spattered-slab (walls near ramps), 2x wrath-jagged-arch (structural, north/south entries) |
| Boss colosseum | 4x wrath-anvil (perimeter at cardinal points), 8x wrath-chain-curtain (hanging from ceiling in ring, Furia rips in phase 2), 2x wrath-war-banner (entrance flanking), 2x wrath-blood-spattered-slab (sand floor), 2x wrath-smashed-barrier (sand floor), 1x wrath-iron-grate (center floor), 1x wrath-jagged-arch (structural, entrance) |

---

## Room Details

### Room 1: Gate of Dis (10x6)

```
  N
  ^
  |
  +-----[jagged-arch]-----+
  |  AV  WB          AV  |  AV = wrath-anvil (flanking gate)
  |       CC    CC        |  CC = wrath-chain-curtain (hanging)
  |                        |  WB = wrath-war-banner (above gate)
  |   [H]    ★    [A]     |  AG = wrath-anger-graffiti-slab (west wall)
  |       CC    CC        |  ★ = player spawn
  |   AG                   |  [A] = ammo, [H] = health
  +---[dented-iron-door]--+
       |             |
       v South (to Blood Marsh)
```

**Elevation:** Flat, elevation 0. The wrath-jagged-arch at the north wall is a massive 6-cell-wide structural archway rising to full ceiling height. Exit via wrath-dented-iron-door at south. Decorative only -- the entrance from the procedural floors above.

**Flow:** The player arrives through the Gate of Dis -- Dante's landmark, the entrance to Lower Hell. Two wrath-anvil flank the arch like sentinels. Four wrath-chain-curtain hang from the ceiling. A wrath-war-banner hangs above the gate; a wrath-anger-graffiti-slab marks the west wall with rage-scratched concrete. The room is safe -- no enemies, just atmosphere and supplies. The gate behind seals shut. The only way is forward, into the Blood Marsh. This room is the calm before the storm, the last moment of peace.

---

### Room 2: Blood Marsh (16x14)

```
  N (from Gate of Dis)
  |
  +---[===door===]---+
  |  ~~~~MARSH~~~~   |  ~~~~ = marsh floor (elev -0.5, slow movement)
  | ~~ISL1~~ISL2~~~  |  ISL = wrath-stone-island (5x structural, elev 0)
  | ~[A]RF~fG~RC~~  |  fG = fireGoat (on islands)
  | ~~~CC~~~~CC~~~~  |  hg = hellgoat (wading in marsh)
  | ~~hg~~~~~~~~~hg  |  RF = wrath-rage-furnace (on islands)
  | ~~~~ISL3~~CP~~~  |  RC = wrath-rusted-cage (on islands)
  | ~~~RC~RF~fG~~~  |  CC = wrath-chain-curtain (hanging)
  | ~~IG~~~~~~~~~[H] |  BS = wrath-blood-spattered-slab (walls)
  | ~~~ISL4~~ISL5~~  |  CP = wrath-corroded-pipe-pillar
  | ~[A]~fG~~RC~~~  |  IG = wrath-iron-grate (ISL3 center)
  | ~~BS~MARSH~BS~  |  SB = wrath-smashed-barrier (on ISL2)
  +--[door]---[door]-+  [A] = ammo, [H] = health
     |           |
     v West      v East
  (to Arsenal)  (to Rage Pit)

  5 stone islands: ISL1(18,14,3x3), ISL2(24,14,3x3),
  ISL3(22,19,4x3), ISL4(18,23,3x3), ISL5(26,23,3x3)
  Marsh = everything between islands at elevation -0.5
```

**Elevation:** Marsh floor at elevation -0.5 (waist-high blood/liquid, movement speed reduced to 60%). Five wrath-stone-island (structural) at elevation 0 (normal movement, safe platforms). Islands are irregular shapes, 3x3 to 4x3 cells each, scattered across the room.

**Flow:** Enter from north. The floor drops immediately into the marsh -- thick, red, slow. Five wrath-stone-island rise above the liquid, populated with wrath-rusted-cage (3x) and wrath-rage-furnace (2x) for atmosphere. Six wrath-chain-curtain hang from the ceiling. Two wrath-blood-spattered-slab mark opposite walls; two wrath-corroded-pipe-pillar rise from islands and marsh edge; one wrath-smashed-barrier sits on ISL2; one wrath-iron-grate covers ISL3's center. fireGoats (3) stand on the islands, firing from safety while the player wades at reduced speed. hellgoats (2) wade toward the player through the marsh -- they are slow too, but the escalation timer is running. Every second in the marsh makes enemies faster. The player must island-hop: sprint to an island, clear the fireGoat, use it as a safe platform, then wade to the next. Pickups are distributed across different islands -- forcing full traversal. Two exits: east leads to Rage Pit, west leads toward Arsenal. The marsh teaches the escalation mechanic: if you dawdle, the wading hellgoats behind you become dangerously fast.

---

### Room 3: Rage Pit (12x12)

```
           N (from Blood Marsh)
           |
  +--------[door]--------+
  |  RIM (elev 0)  CP    |  PTR = wrath-pit-tier-ring (4x structural tiers)
  |  +---TIER 1 (elev -0.5)---+ |  RC = wrath-rusted-cage (3x tier edges)
  |  | +--TIER 2 (elev -1)--+ | |  CC = wrath-chain-curtain (4x ceiling center)
  |  | | +-TIER 3 (elev -1.5)+ | |  SB = wrath-smashed-barrier (2x tier debris)
  |  | | |  PIT (elev -2)   | | |  BS = wrath-blood-spattered-slab (lower tier)
  |  | | |   hg    hg  IG  | | |  CP = wrath-corroded-pipe-pillar (2x rim)
  |  | | |         CC CC   | | |  IG = wrath-iron-grate (pit center)
  |  | | +--fG---SB-fG----+ | |  PB = wrath-punching-bag-chain (tier 2 edge)
  |  | +---[H]--BS-[A]-----+ |
  |  +--RC--SB--RC--PB-RC-+  |  hg = hellgoat (tier 3)
  |  CP                  CP  |  fG = fireGoat (tier 2)
  +--------[door]--------+      [H] = health, [A] = ammo
           |
           v South (to Arsenal)

  Tier layout (concentric wrath-pit-tier-ring):
  - Rim: 1-cell wide, elev 0 (safe perimeter)
  - Tier 1: 1-cell wide, elev -0.5
  - Tier 2: 2-cell wide, elev -1
  - Tier 3: 2-cell wide, elev -1.5
  - Pit center: 4x4, elev -2 (deepest)
```

**Elevation:** The room descends in concentric wrath-pit-tier-ring (4x structural) like an amphitheater. Rim at elevation 0, then -0.5, -1, -1.5, center pit at -2. Each tier is a step down, 1-2 cells wide. The tiers are connected by the step-down itself -- no ramps needed, just drop down (or fight upward).

**Flow:** Enter from north at the rim (elevation 0). Looking down, the pit descends in four tiers. Three wrath-rusted-cage sit at tier edges; four wrath-chain-curtain hang from the ceiling adding visual clutter; two wrath-smashed-barrier provide partial cover on tiers; a wrath-blood-spattered-slab marks a lower tier; two wrath-corroded-pipe-pillar stand on the rim; a wrath-iron-grate covers the pit center; and a wrath-punching-bag-chain dangles from a broken anchor at tier 2. hellgoats (2) lurk at the bottom (tier 3/pit). fireGoats (2) hold tier 2, firing upward at the player on the rim. The player must descend to fight -- dropping tier by tier. The escalation mechanic punishes slow descent -- jump down fast, clear fast, get out. Pickups are on tier 2 (midway) to reward aggressive play.

---

### Room 4: Arsenal (12x6)

```
  N (from Rage Pit or Blood Marsh)
  |
  +---[jagged-arch]---+
  |  WR  AG      WR  |  WR = wrath-shattered-weapon-rack (4x walls)
  |                    |  AG = wrath-anger-graffiti-slab (west wall)
  | [A]   SB         |  BS = wrath-blood-spattered-slab (east wall)
  |  WR    BS   WR   |  SB = wrath-smashed-barrier (floor debris)
  |                    |  fG = fireGoat (near entrance)
  |  fG        gK     |  gK = goatKnight (guards pedestal)
  |                    |
  |                    |  [GB] = Goat's Bane on wrath-weapon-pedestal
  |       [A]         |  [H] = health next to pedestal
  |     [H][GB]       |  PEDESTAL at far south end
  +--------+-----------+
            |
            v South (to Berserker Arena)

  Design intent: SPRINT to Goat's Bane.
  Escalation punishes fighting here -- the longer you engage
  the gK and fG, the faster they get. Grab the Bane, then fight.
```

**Elevation:** Flat, elevation 0. Entrance framed by wrath-jagged-arch. Four wrath-shattered-weapon-rack line both east and west walls. The Goat's Bane sits on wrath-weapon-pedestal at the far south end, elevated 0.5 (raised stone slab, 2x2 cells).

**Flow:** A long, narrow armory. Four wrath-shattered-weapon-rack line the walls, creating the feel of a ransacked arsenal. A wrath-anger-graffiti-slab marks the west wall near the entry; a wrath-blood-spattered-slab marks the east; a wrath-smashed-barrier provides floor debris for partial cover. The Goat's Bane (Bazooka) sits on wrath-weapon-pedestal at the far end, glowing with pickup light. A goatKnight guards it; a fireGoat provides ranged support from near the entrance. The intended play: SPRINT past the fireGoat, dodge the goatKnight, grab the Bane, then use it to clear both enemies. The escalation mechanic makes fighting them first a losing proposition -- by the time you reach the weapon, they are dangerously fast. This room teaches the player that the Bazooka exists and rewards decisive action over cautious clearing.

If the player fights enemies in the Arsenal (instead of sprinting to the Goat's Bane), the escalation mechanic creates pressure but does NOT make the room impossible. The 4 enemies in the room can be cleared in 15-20 seconds with efficient combat. Escalation reaches +30% in that time -- challenging but survivable. The wrath-weapon-pedestal also has a health pickup next to it as a reward for reaching it.

---

### Room 5: Berserker Arena (14x14, arena)

```
  N (from Arsenal)
  |
  +-----[jagged-arch]-----+
  |                         |
  |  EB    CC    CC   EB   |  EB = wrath-explosive-barrel (8x, destructible)
  |     CL            CL  |  CL = wrath-caged-lantern (2x overhead)
  |  EB              EB   |  CC = wrath-chain-curtain (6x hanging)
  |        [A]             |  [A] = ammo (between rounds)
  |  CC              CC   |  [H] = health (between rounds)
  |                         |
  |  EB   [H]   [A]  EB   |
  |                         |
  |  CC              CC   |
  |  EB    CC    CC   EB   |
  |                         |
  +--[dented-iron-door]-[secret]+
     |                  |
     v East             v West (WALL_SECRET to Shrine)
  (to Gauntlet)

  8 wrath-explosive-barrel in ring around center: DESTRUCTIBLE
  - Shoot barrel = explosion (radius 2 cells, 15 damage)
  - Kills nearby enemies, clears barrel from arena
  - Strategic: use barrels to nuke escalated enemies

  Round 1: 3 fireGoats (spawn E, W, N edges)
  Round 2: 2 goatKnights (spawn N, S)
  Round 3: 1 mini-boss hellgoat (80HP, center, ground pound 3-cell AoE) + 1 fireGoat + 1 goatKnight
```

**Elevation:** Flat arena at elevation 0. Entrance via wrath-jagged-arch, exit via wrath-dented-iron-door. Eight wrath-explosive-barrel at floor level. Two wrath-caged-lantern at elevation 2.0 on east and west walls (overhead industrial lights). Six wrath-chain-curtain hang from ceiling (elevation 3+ to 1.5, decorative).

**Flow:** The main arena of Circle 5. Doors lock on entry. The room is ringed with 8 wrath-explosive-barrel -- the key tactical element. Each barrel explodes when shot (radius 2 cells, 15 damage), killing or severely damaging nearby enemies. Round 1: fireGoats -- use the Goat's Bane to clear groups before escalation ramps their speed. Round 2: goatKnights -- armored, slow initially, but escalation makes them terrifyingly fast. Use barrels to burst them down. Round 3: the mini-boss is a larger hellgoat variant with 80 HP -- it takes 2 direct Goat's Bane rockets to kill. It also has a ground pound attack (3-cell AoE, 15 damage) that the standard hellgoat doesn't have. Flanked by a fireGoat and goatKnight. By round 3, any remaining barrels are precious. The room teaches barrel management -- waste them early and round 3 is brutal. Save them and round 3 is manageable. Pickups spawn between rounds for resupply.

---

### Room 6: Shrine of Fury (6x6, secret)

```
  E (from Berserker Arena WALL_SECRET)
  |
  +--[secret]--+
  |              |
  |  SB    CL   |  SB = wrath-smashed-barrier (west corner)
  |              |  CL = wrath-caged-lantern (ceiling center)
  | [H]      [H]|  IG = wrath-iron-grate (floor center)
  |     IG       |  [H] = health
  | [A]      [A]|  [A] = ammo
  |              |
  +--------------+

  No enemies. Rest area. The eye of the storm.
```

**Elevation:** Flat, elevation 0. Deliberately plain -- cooler concrete (Concrete008), muted lighting. A deliberate contrast to the fury everywhere else.

**Flow:** Hidden behind WALL_SECRET on the west wall of the Berserker Arena. The Shrine of Fury is the one quiet room in this circle. No enemies. Muted lighting. Cooler concrete. A wrath-smashed-barrier in the west corner is minimal debris; a wrath-iron-grate covers the floor center; a wrath-caged-lantern hangs from the ceiling -- a calmer version of the arena overhead lights. Generous health and ammo pickups. The irony: in the circle of Wrath, the secret room is peace. The player who stops raging long enough to find this hidden respite is rewarded. The escalation timer does not run here because there are no enemies in combat range.

---

### Room 7: Gauntlet (6x20, corridor)

```
  N (from Berserker Arena)
  |
  +--[jagged-arch]--+
  |  CC         |  CC = wrath-chain-curtain (6x ceiling intervals)
  |             |  WB = wrath-war-banner (3x walls)
  |  hg→       |  SB = wrath-smashed-barrier (2x ramp tops)
  |    RAMP↓   |  BS = wrath-blood-spattered-slab (2x walls)
  |  elev-0.5  |  hg = hellgoat (spawn behind at Z+4)
  |  WB  BS    |  fG = fireGoat (spawn ahead on lower sections)
  | fG         |
  | [H][A] CC  |  health + ammo at 1/3 mark
  |    RAMP↓ SB|  RAMP = elevation change
  |  elev-1.0  |
  |  hg→       |  hg spawn behind at Z+8
  |  CC   WB   |
  |   BS       |
  | [H]  CC    |  health at 2/3 mark
  |  fG        |
  |    RAMP↓ SB|
  |  elev-0.5  |
  |  hg→       |  hg spawn behind at Z+14
  |  CC   WB   |
  |  elev 0    |
  +--[jagged-arch]--+
  |
  v South (to Furia's Colosseum)

  CANNOT STOP. Enemies spawn behind. Escalation running.
  Forward always forward. Shoot downhill at enemies ahead.
  Ramps create elevation advantage when shooting forward/down.
```

**Elevation:** Entry and exit framed by wrath-jagged-arch (2x structural). The gauntlet descends and rises: starts at elevation 0, ramps down to -0.5, then -1.0 at the midpoint, then ramps back up to -0.5 and finally 0 at the exit. Three ramp sections (2 cells long each, RAMP cells). The descent/ascent creates shooting angles -- the player can fire downhill at enemies ahead while elevated enemies behind fire downhill at the player.

**Flow:** A long, narrow corridor of pure forward momentum. Six wrath-chain-curtain hang from the ceiling at intervals as pacing markers. Three wrath-war-banner hang on alternating walls. Two wrath-smashed-barrier mark ramp transition points; two wrath-blood-spattered-slab stain the walls near ramps. Enemies spawn BEHIND the player as they advance -- hellgoats (3, staggered spawns at Z+4, Z+8, Z+14 relative to player progress). fireGoats (2) spawn AHEAD on lower elevation sections, blocking forward progress. The player cannot stop -- the escalating hellgoats behind grow faster every 5 seconds. The ramps create tactical elevation: shooting downhill at fireGoats ahead is easier, but turning to shoot uphill at pursuing hellgoats is harder. Two health pickups are placed at the 1/3 and 2/3 marks of the Gauntlet's length, on the main path. The player does not need to deviate to reach them. The gauntlet is a running fight -- the embodiment of Wrath's lesson that standing still means death.

---

### Room 8: Furia's Colosseum (16x16, boss)

```
  N (from Gauntlet)
  |
  +-------[jagged-arch]-------+
  |  AV   WB  CC   CC  WB AV  |  AV = wrath-anvil (4x cardinal points)
  |                             |  CC = wrath-chain-curtain (8x ceiling ring)
  |  CC    SB             CC   |  WB = wrath-war-banner (2x entrance flanking)
  |                             |  BS = wrath-blood-spattered-slab (2x sand floor)
  |       SAND FLOOR            |  SB = wrath-smashed-barrier (2x sand floor)
  |                             |  IG = wrath-iron-grate (center floor)
  |  AV       [FURIA]  IG  AV  |  Furia starts center
  |        BS               BS |
  |                             |
  |  CC    SB             CC   |
  |                             |
  | [A]                    [A] |  [A] = ammo (edges)
  |                             |  [H] = health (south corners)
  | [H]    [A]          [H]   |
  |     AV   CC   CC   AV      |
  +-----------------------------+

  Phase 1 (300-180 HP, 40%) — CHARGE: Furia bull-rushes, antlers lowered.
    Dodge sideways. He hits wall → stunned 2s. Attack during stun.
    Phase 1 stun window: 2 seconds (reduced from 3). Furia recovers faster
    as the fight progresses.
    8 charges then transition to phase 2 or at HP < 60% (180 HP).

  Phase 2 (180-75 HP, 35%) — WHIP: Furia rips a chain from the ceiling.
    Swings as whip weapons. 4-cell range. Sweeping arcs.
    Must stay far (>4 cells). Goat's Bane range advantage.
    Chains ripped from ceiling = fewer hanging chains (visual).

  Phase 3 (75-0 HP, 25%) — BERSERKER: Furia faster than player.
    Arena walls START CLOSING IN — room shrinks 1 cell/5s.
    16x16 → lethal 4x4 in 30 seconds.
    Wall closure = concrete slabs slide inward (WALL_STONE).
    Furia has 75 HP in Phase 3 -- the player must deal approximately
    2.5 DPS to outpace the closure.
    The walls close with a grinding stone SFX and visible cracks
    propagating inward. The floor shakes (camera shake, subtle) with
    each contraction.
    Must kill before arena crushes you both.
    Pickups at edges become inaccessible as walls close.
```

**Elevation:** Flat sand floor at elevation 0. Entrance via wrath-jagged-arch (structural). Four wrath-anvil at cardinal wall points at elevation 0 (floor-standing). Eight wrath-chain-curtain hang from ceiling at elevation 3 -- Furia physically rips them down in phase 2. Two wrath-war-banner flank the entrance. Two wrath-blood-spattered-slab and two wrath-smashed-barrier lie half-buried in the sand. One wrath-iron-grate at center. The closing walls in phase 3 are WALL_STONE cells that slide inward from all four edges.

**Flow:** Enter the colosseum. Sand floor, wrath-chain-curtain overhead, torches around the perimeter. Furia stands in the center -- massive, the Dainir male base at maximum musculature. He roars. The fight begins.

**Phase 1 (300-180 HP, 40%): The Charge.** Furia lowers his antlers and bull-rushes the player. The charge is fast, linear, telegraphed by a 1-second wind-up animation. Dodge sideways -- he slams into the wall and is stunned for 2 seconds (reduced from 3 -- Furia recovers faster as the fight progresses). Attack during the stun window. Miss the dodge and take massive damage. The sand arena is open -- plenty of room to sidestep. The wrath-anvil at the walls serve as landmarks for positioning. 8 charges maximum before phase 2, or immediate transition at 180 HP.

**Phase 2 (180-75 HP, 35%): The Whip.** Furia reaches up and rips a wrath-chain-curtain from the ceiling. He swings it as a whip -- 4-cell range, wide sweeping arcs. The player must stay beyond 4 cells. The Goat's Bane excels here: rockets at range while dodging whip sweeps. Each chain ripped from the ceiling is one fewer hanging chain in the room (visual destruction, the arena degrades). He rips new chains as old ones are dropped.

**Phase 3 (75-0 HP, 25%): The Berserker.** Furia enters berserker mode. His movement speed exceeds the player's. He cannot be kited. Simultaneously, the arena walls begin closing in -- concrete slabs slide inward from all four edges, 1 cell every 5 seconds (accelerated from 10 seconds). The 16x16 arena reaches lethal 4x4 in 30 seconds. Furia has 75 HP in Phase 3 -- the player must deal approximately 2.5 DPS to outpace the closure. The walls close with a grinding stone SFX and visible cracks propagating inward. The floor shakes (camera shake, subtle) with each contraction. Pickups at the room edges become trapped behind the advancing walls -- resources dwindle as space does. The player must commit fully to aggressive offense. Wrath's final lesson: controlled fury, total commitment.

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Gate of Dis | (20, 6, 8, 2) | `showHint` | `once: true` | `{ text: "Beyond this gate, rage festers. Speed is survival." }` |
| T2 | Blood Marsh | (17, 13, 14, 12) | `startEscalation` | On first enemy combat | `{ speedIncrease: 0.10, interval: 5, cap: 0.60 }` |
| T3 | Rage Pit | (23, 31, 10, 10) | `startEscalation` | On first enemy combat | `{ speedIncrease: 0.10, interval: 5, cap: 0.60 }` |
| T4 | Arsenal | (15, 47, 10, 4) | `startEscalation` | On first enemy combat | `{ speedIncrease: 0.10, interval: 5, cap: 0.60 }` |
| T5 | Arsenal | (19, 50, 3, 2) | `showHint` | `once: true, pickup: 'goatsBane'` | `{ text: "The Goat's Bane. For when one bullet is not enough." }` |
| T6 | Berserker Arena | (16, 57, 12, 2) | `lockDoors` | `once: true` | -- |
| T7 | Berserker Arena | (16, 57, 12, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'fireGoat', count:3}] }` |
| T8 | Berserker Arena | -- | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'goatKnight', count:2}] }` |
| T9 | Berserker Arena | -- | `spawnWave` | On wave 2 clear | `{ enemies: [{type:'hellgoat', count:1, variant:'miniboss', hp:80, groundPound:{radius:3, damage:15}}, {type:'fireGoat', count:1}, {type:'goatKnight', count:1}] }` |
| T10 | Berserker Arena | -- | `unlockDoors` | On wave 3 clear | -- |
| T11 | Berserker Arena barrel | Barrel positions | `explodeBarrel` | On barrel damage | `{ radius: 2, damage: 15 }` |
| T12 | Gauntlet | (22, 78, 4, 2) | `spawnBehind` | Player Z > 78 | `{ type: 'hellgoat', count: 1, spawnZ: 76 }` |
| T13 | Gauntlet | (22, 82, 4, 2) | `spawnBehind` | Player Z > 82 | `{ type: 'hellgoat', count: 1, spawnZ: 78 }` |
| T14 | Gauntlet | (22, 88, 4, 2) | `spawnBehind` | Player Z > 88 | `{ type: 'hellgoat', count: 1, spawnZ: 84 }` |
| T15 | Gauntlet | (22, 76, 4, 2) | `spawnAhead` | Player Z > 76 | `{ type: 'fireGoat', count: 1, spawnZ: 80 }` |
| T16 | Gauntlet | (22, 86, 4, 2) | `spawnAhead` | Player Z > 86 | `{ type: 'fireGoat', count: 1, spawnZ: 90 }` |
| T17 | Boss colosseum | (17, 99, 14, 2) | `bossIntro` | `once: true` | `{ text: "RAGE. RAGE UNTIL THERE IS NOTHING LEFT." }` |
| T18 | Boss colosseum | (17, 99, 14, 2) | `lockDoors` | `once: true, delay: 3` | -- |
| T19 | Boss colosseum | -- | `bossPhase2` | Boss HP < 60% (180 HP) | `{ action: 'ripChains', whipRange: 4 }` |
| T20 | Boss colosseum | -- | `bossPhase3` | Boss HP < 25% (75 HP) | `{ action: 'berserkerMode', wallCloseRate: 1, wallCloseInterval: 5, minSize: 4 }` |
| T21 | Boss colosseum | -- | `ambientChange` | Boss HP < 25% | `{ fogDensity: 0.06, fogColor: '#2a0000' }` |

---

## Environment Zones

| Zone | Type | Bounds | Intensity | Notes |
|------|------|--------|-----------|-------|
| Global rage | `ambientTint` | Full level (0,0,48,96) | 0.7 | Red-orange color shift, hot anger |
| Blood Marsh liquid | `slowZone` | Marsh floor (17,13,14,12) excl. islands | 0.6 | Movement reduced to 60% in marsh |
| Blood Marsh steam | `particleZone` | Marsh surface | 0.3 | Red steam wisps rising from blood |
| Rage Pit downdraft | `wind` | Center pit (25,33,6,6) | 0.2 | Subtle pull downward into pit |
| Berserker Arena heat | `ambientTint` | Arena (15,56,14,14) | 0.8 | Extra red intensity during combat |
| Gauntlet chase | `sfx` | Behind player in Gauntlet | 0.9 | Horde footsteps, growing louder |
| Colosseum sand | `particleZone` | Boss arena (16,98,16,16) | 0.4 | Sand kicked up during charges |
| Escalation global | `combatModifier` | All rooms except Gate/Shrine | varies | +10% enemy speed per 5s in combat, capped at +60% |

### Escalation Visual Feedback

Escalation visual feedback: enemy eye glow intensity scales with escalation level (dim at +10%, blazing at +60%). At +40% and above, enemies leave faint red speed lines. At max +60%, a low rumbling audio cue plays. The HUD shows a 'RAGE' meter that fills as escalation increases.

---

## Player Spawn

- **Position:** (24, 5) -- center of Gate of Dis
- **Facing:** pi (south -- facing the sealed gate to Blood Marsh)

---

## Theme Configuration

```typescript
editor.createTheme('circle-5-wrath', {
  name: 'wrath',
  displayName: 'WRATH -- The Circle of Rage',
  primaryWall: MapCell.WALL_STONE,            // Cracked concrete base
  accentWalls: [MapCell.WALL_OBSIDIAN],       // Dark brick accents
  fogDensity: 0.03,
  fogColor: '#1a0808',
  ambientColor: '#ff4411',
  ambientIntensity: 0.22,
  skyColor: '#0a0000',
  particleEffect: 'embers',                   // Floating embers, sparks in air
  enemyTypes: ['fireGoat', 'hellgoat', 'goatKnight'],
  enemyDensity: 1.4,                          // Above average -- this circle is aggressive
  pickupDensity: 1.0,                         // Standard -- no abundance, no scarcity
  circleSpecific: {
    escalationRate: 0.10,                      // 10% speed increase
    escalationInterval: 5,                     // Every 5 seconds of combat
    escalationCap: 0.60,                       // Maximum +60% speed (reached at 30s)
    escalationReset: 3,                        // 3s out of combat (no enemies within 12 cells, no shots fired) to reset
    destructibleBarrels: true,                 // Berserker Arena barrel explosions
    marshSlowFactor: 0.6,                      // 60% movement in Blood Marsh
    wallClosureEnabled: true,                  // Boss phase 3 arena shrink
    wallClosureRate: 1,                        // 1 cell per interval
    wallClosureInterval: 5,                    // Every 5 seconds (accelerated)
    wallClosureMinSize: 4,                     // Minimum 4x4 before lethal (30s to reach)
  },
});
```

---

## Narrative Beats

1. **Gate of Dis:** The player passes through Dante's landmark -- the boundary between Upper and Lower Hell. The inscription above the gate: *"Lasciate ogne speranza, voi ch'intrate."* (Abandon all hope, ye who enter here.) The gate seals behind you. There is no going back.
2. **Blood Marsh wading:** The first experience of the escalation mechanic. Enemies get faster while you wade through blood. The frustration is intentional -- wrath builds in the player too. The circle infects you.
3. **Rage Pit descent:** Fighting downward into the amphitheater. Each tier conquered is progress. The vertical combat is unique to this room -- Wrath pushes you into the pit, forces you to claw back up.
4. **Arsenal sprint:** The Goat's Bane on its pedestal. The player who fights their way to it slowly watches the enemies escalate to lethal speed. The player who sprints, dodges, and grabs it is rewarded. Wrath rewards decisive action, not careful planning.
5. **Berserker Arena -- round 3 mini-boss:** The oversized hellgoat with 80 HP and a ground pound attack. The first mini-boss in the game. Takes 2 direct Goat's Bane rockets to kill. The Goat's Bane rockets are the answer -- explosive area damage before escalation makes the crowd unmanageable. Barrel explosions clear groups. The room is a symphony of destruction.
6. **Gauntlet flight:** The purest expression of forward momentum in the game. Enemies behind, enemies ahead, ramps up and down. The player who hesitates is overtaken. The player who charges forward survives. Wrath's lesson crystallized into pure movement.
7. **Furia intro:** He roars: *"RAGE. RAGE UNTIL THERE IS NOTHING LEFT."* No eloquence. No subtlety. Pure fury. The fight begins.
8. **Furia phase 2 -- chain rip:** The moment Furia tears chains from the ceiling and swings them as weapons. The arena visually degrades around you -- chains fall, the colosseum crumbles. Wrath destroys its own stage.
9. **Furia phase 3 -- walls closing:** The arena shrinks. The space to dodge vanishes. The player must attack relentlessly -- there is no defensive option. Kill or be crushed. Wrath's ultimate lesson: rage unchecked destroys everything, including the one who rages.
10. **Furia's defeat:** He falls. The walls stop. The colosseum is half its original size, rubble everywhere, chains littering the sand. Silence after fury. Title card: *CIRCLE THE SIXTH -- HERESY*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter and renders in LevelMeshes.tsx
2. All 8 rooms are reachable from spawn (DAG validation passes)
3. Escalation mechanic works (10% enemy speed increase per 5s combat, capped at +60% after 30s, resets at 3s idle with no enemies within 12 cells and no shots fired)
4. Blood Marsh slow zone reduces player movement to 60%
5. Raised islands in Blood Marsh provide normal-speed platforms at correct elevation
6. Rage Pit concentric tiers render at correct elevations (-2 to 0)
7. Goat's Bane weapon pickup functions in Arsenal room
8. Destructible barrels in Berserker Arena explode on damage (radius 2, 15 damage)
9. Gauntlet spawns enemies behind the player based on positional triggers
10. Boss phase 1 charge/stun cycle works (dodge sideways, 2s stun on wall impact)
11. Boss phase 2 chain whip has 4-cell range sweep attack
12. Boss phase 3 wall closure shrinks arena from 16x16 to lethal 4x4 at rate 1 cell/5s (30 seconds)
13. PlaytestRunner AI can navigate from spawn to boss and defeat Furia
14. PBR materials from AmbientCG render correctly (Concrete034, Bricks037, Ground082, Rust003)
15. At least 6 distinct Meshy props visible (wrath-chain-curtain, wrath-anvil, wrath-explosive-barrel, wrath-shattered-weapon-rack, wrath-rusted-cage, wrath-war-banner)
16. Each room feels distinct: Gate (atmosphere), Marsh (slow traversal), Pit (vertical), Arsenal (sprint), Arena (destructible), Gauntlet (chase), Colosseum (shrinking boss fight)

---

## What This Is NOT

- NOT a slow, cautious circle. Wrath punishes hesitation mechanically through escalation. The player should feel rushed, pressured, angry.
- NOT front-loaded with one big arena. The 8 rooms create varied pacing: atmospheric entry, slow marsh, vertical pit, sprint grab, multi-round arena, chase corridor, boss fight. Each room tests a different aspect of aggressive play.
- NOT a circle where exploration is rewarded equally. The Shrine of Fury (secret) is a deliberate contrast -- peace hidden within fury -- but the main path demands constant forward momentum.
- NOT using the procedural generator's `explore -> arena -> boss` cycle. The room sequence is authored for escalating intensity.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models + AmbientCG PBR textures.
- NOT a rehash of earlier circles' red palettes. While Lust had warm marble and Gluttony had sickly green-over-flesh, Wrath is industrial -- cracked concrete, fired brick, rusted metal. The red here is anger, not warmth.

---

## 3D Spatial Design

### Room: Gate of Dis (10x6, exploration)

**Player Experience:** You pass through a towering archway of jagged iron into the entry chamber. Two massive anvils flank the gate like sentinels of brute force. Chains hang from the ceiling in every direction, swaying in some unfelt wind. The light is deep red, angry. Everything metal, everything corroded. A single ammo pickup and health kit sit on the floor -- supplies before the storm. The gate behind you grinds shut. Forward is the only option.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-jagged-arch | (24, 2) north wall gate | 1.2 | face-south | Massive Gate of Dis entrance |
| wrath-dented-iron-door | (24, 7) south door | 1.0 | face-south | Exit to Blood Marsh |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-anvil | (20, 3) flanking gate west | 1.0 | Forge sentinel, brute force motif |
| wrath-anvil | (28, 3) flanking gate east | 1.0 | Forge sentinel, brute force motif |
| wrath-chain-curtain | (22, 3) ceiling hang NW | 0.8 | Hanging chains, atmosphere |
| wrath-chain-curtain | (26, 3) ceiling hang NE | 0.8 | Hanging chains, atmosphere |
| wrath-chain-curtain | (22, 6) ceiling hang SW | 0.8 | Hanging chains, atmosphere |
| wrath-chain-curtain | (26, 6) ceiling hang SE | 0.8 | Hanging chains, atmosphere |
| wrath-war-banner | (24, 2) above gate | 1.0 | War banner, tattered |
| wrath-anger-graffiti-slab | (20, 6) west wall | 0.7 | Rage-scratched concrete |

**Lighting:**
- 3x torch-sconce-ornate: (20, 4) north wall, (19, 6) west wall, (29, 6) east wall -- deep red `#ff3300`, radius 4 cells, intensity 0.9

**Platforming:** Flat, elevation 0. The gate arch at the north wall rises to full ceiling height. Decorative only.

---

### Room: Blood Marsh (16x14, exploration)

**Player Experience:** The floor drops out from under you into thick, dark red liquid. Waist-deep, viscous, slow. Every step is a struggle. Five stone islands rise above the blood like teeth in a jaw. FireGoats stand on them, firing from safety while you wade helplessly. The escalation timer is already ticking -- the longer you linger, the faster the hellgoats behind you become. Island-hop. Clear and move. Do not stop.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-stone-island | (18, 14) ISL1 NW, 3x3 | 1.0 | none | Raised safe platform |
| wrath-stone-island | (24, 14) ISL2 NE, 3x3 | 1.0 | none | Raised safe platform |
| wrath-stone-island | (22, 19) ISL3 center, 4x3 | 1.2 | none | Raised safe platform, largest |
| wrath-stone-island | (18, 23) ISL4 SW, 3x3 | 1.0 | none | Raised safe platform |
| wrath-stone-island | (26, 23) ISL5 SE, 3x3 | 1.0 | none | Raised safe platform |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-rusted-cage | (19, 15) on ISL1 | 0.7 | Caged prisoner atmosphere |
| wrath-rusted-cage | (24, 20) on ISL3 | 0.7 | Caged prisoner atmosphere |
| wrath-rusted-cage | (27, 24) on ISL5 | 0.7 | Caged prisoner atmosphere |
| wrath-rage-furnace | (23, 19) on ISL3 center | 0.8 | Bubbling cauldron replacement |
| wrath-rage-furnace | (19, 15) on ISL1 edge | 0.6 | Bubbling heat source |
| wrath-chain-curtain | (20, 15) ceiling above ISL1 | 1.0 | Hanging chain atmosphere |
| wrath-chain-curtain | (25, 15) ceiling above ISL2 | 1.0 | Hanging chain atmosphere |
| wrath-chain-curtain | (22, 18) ceiling center | 1.0 | Hanging chain atmosphere |
| wrath-chain-curtain | (20, 22) ceiling above ISL4 | 1.0 | Hanging chain atmosphere |
| wrath-chain-curtain | (26, 22) ceiling above ISL5 | 1.0 | Hanging chain atmosphere |
| wrath-chain-curtain | (23, 21) ceiling south-center | 1.0 | Hanging chain atmosphere |
| wrath-blood-spattered-slab | (17, 18) west wall | 0.6 | Blood-stained wall panel |
| wrath-blood-spattered-slab | (31, 22) east wall | 0.6 | Blood-stained wall panel |
| wrath-corroded-pipe-pillar | (20, 19) ISL3 west edge | 0.6 | Rusted pipe rising from island |
| wrath-corroded-pipe-pillar | (17, 14) near ISL1 marsh edge | 0.5 | Partially submerged pipe |
| wrath-smashed-barrier | (26, 15) on ISL2 | 0.4 | Broken concrete on island |
| wrath-iron-grate | (22, 20) on ISL3 center floor | 0.5 | Drain grate, industrial detail on main island |

**Lighting:**
- 3x torch-sconce-ornate: on ISL1 (19, 16), ISL3 (23, 20), ISL5 (27, 24) -- deep red `#ff3300`, radius 4 cells, floor-standing
- Lava glow from marsh floor: crimson `#cc0000`, radius 3 cells, subtle pulse at 0.5Hz

**Platforming:** Marsh floor at elevation -0.5 (movement speed 60%). Five stone islands at elevation 0 (normal movement). Islands are 3x3 to 4x3 cells. Player must island-hop across the room.

**Playtest Note:** Blood Marsh had only 14 props for a 16x14 room (224 cells). Islands had at most 1 prop each. Added corroded pipes and smashed barriers to differentiate island tops, blood-spattered slabs on opposite walls, and an iron grate on the central island. Target: 20 environmental props plus 5 structural island props.

---

### Room: Rage Pit (12x12, platforming)

**Player Experience:** You stand at the rim of a descending amphitheater. Four concentric tiers drop into darkness -- the pit center is deep below you. HellGoats lurk at the bottom, their eyes glinting red. FireGoats hold the middle tier, firing upward. You must descend tier by tier, fighting your way down while the escalation timer turns every hesitation into a death sentence. The pit swallows you.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-pit-tier-ring | (23, 31) rim tier, elev 0 | 1.0 | none | Top tier, 1-cell wide |
| wrath-pit-tier-ring | (24, 32) tier 1, elev -0.5 | 0.9 | none | Second tier |
| wrath-pit-tier-ring | (25, 33) tier 2, elev -1 | 0.8 | none | Third tier, 2-cell wide |
| wrath-pit-tier-ring | (26, 34) tier 3, elev -1.5 | 0.7 | none | Fourth tier, 2-cell wide |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-rusted-cage | (23, 31) rim NW edge | 0.6 | Caged prisoner, tier edge |
| wrath-rusted-cage | (33, 31) rim NE edge | 0.6 | Caged prisoner, tier edge |
| wrath-rusted-cage | (28, 38) tier 2 edge | 0.6 | Caged prisoner, mid-tier |
| wrath-chain-curtain | (27, 35) ceiling center | 1.2 | Hanging chains, visual clutter |
| wrath-chain-curtain | (29, 35) ceiling center | 1.2 | Hanging chains, visual clutter |
| wrath-chain-curtain | (27, 37) ceiling center | 1.2 | Hanging chains, visual clutter |
| wrath-chain-curtain | (29, 37) ceiling center | 1.2 | Hanging chains, visual clutter |
| wrath-smashed-barrier | (24, 36) tier 2 debris | 0.5 | Broken concrete, cover |
| wrath-smashed-barrier | (30, 34) tier 1 debris | 0.4 | Broken concrete, tier edge |
| wrath-blood-spattered-slab | (25, 39) tier 3 edge | 0.4 | Blood-stained slab on lower tier |
| wrath-corroded-pipe-pillar | (23, 31) rim NW | 0.5 | Rusted pipe, broken column stand-in |
| wrath-corroded-pipe-pillar | (33, 41) rim SE | 0.5 | Rusted pipe, broken column stand-in |
| wrath-iron-grate | (27, 37) pit center | 0.6 | Floor grate at pit bottom |
| wrath-punching-bag-chain | (28, 36) tier 2 edge | 0.4 | Dangling chain from broken anchor |

**Lighting:**
- 2x torch-sconce-ornate: (22, 32) west wall, (34, 32) east wall -- deep red `#ff3300`, radius 4 cells
- Dim ambient glow from pit floor: `#cc0000`, radius 2 cells, intensity 0.3

**Platforming:** Concentric descending tiers. Rim at elevation 0, tier 1 at -0.5, tier 2 at -1, tier 3 at -1.5, pit center (4x4) at -2. Each tier is a step-down -- no ramps, just drop down. Climbing back up requires jumping.

**Playtest Note:** Rage Pit had only 9 props for a 12x12 room. Tier surfaces were barren. Added broken barriers and blood-spattered slabs on tier edges, corroded pipes as broken column stand-ins on the rim, an iron grate at the pit center, and a dangling chain for visual variety. Target: 16 environmental props for 144 cells.

---

### Room: Arsenal (12x6, exploration)

**Player Experience:** A long narrow armory. Weapon displays line both walls -- racks of swords, shields, bronze blades arranged in ceremonial crossed pairs. At the far end, a raised stone pedestal glows with pickup light. The Goat's Bane -- the Bazooka. A goatKnight stands guard before it. The escalation timer is your enemy: fight your way there slowly and the enemies accelerate to lethal speed. Sprint. Dodge. Grab. Then turn the weapon on everything behind you.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-jagged-arch | (20, 46) north entry | 0.8 | face-south | Arsenal entrance frame |
| wrath-weapon-pedestal | (20, 51) far south end | 1.0 | none | Goat's Bane display pedestal |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-shattered-weapon-rack | (15, 48) west wall | 0.8 | Weapon display, armory feel |
| wrath-shattered-weapon-rack | (25, 48) east wall | 0.8 | Weapon display, armory feel |
| wrath-shattered-weapon-rack | (15, 50) west wall | 0.8 | Weapon display, armory feel |
| wrath-shattered-weapon-rack | (25, 50) east wall | 0.8 | Weapon display, armory feel |
| wrath-smashed-barrier | (16, 49) floor debris | 0.4 | Partial cover, atmosphere |
| wrath-anger-graffiti-slab | (15, 47) west wall near entry | 0.6 | Rage-scratched concrete |
| wrath-blood-spattered-slab | (25, 47) east wall near entry | 0.6 | Blood-stained wall panel |

**Lighting:**
- 2x torch-sconce-ornate: (15, 47) north entry west, (25, 47) north entry east -- deep red `#ff3300`, radius 4 cells
- Pedestal glow: warm white `#ff8866`, radius 2 cells, intensity 1.0 on Goat's Bane

**Platforming:** Flat, elevation 0. Goat's Bane pedestal raised 0.5 (2x2 stone slab at south end).

---

### Room: Berserker Arena (14x14, arena)

**Player Experience:** The doors slam shut. Eight barrels ring the center of a vast industrial arena, each one a promise of explosive destruction. Caged lanterns blaze overhead, chains hang from the ceiling like a factory of pain. Round 1: fireGoats pour in from the edges. You reach for the Bazooka. Round 2: goatKnights in armor advance from north and south. Round 3: a massive hellgoat spawns in the center -- twice normal size, ground-pound attack shaking the floor. The barrels are your nuclear option. Use them wisely.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-jagged-arch | (22, 56) north entry | 1.0 | face-south | Arena entrance |
| wrath-dented-iron-door | (16, 69) south exit east | 0.9 | face-south | Exit to Gauntlet |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-explosive-barrel | (17, 58) ring position 1 | 1.0 | Destructible, explosive, 15 damage |
| wrath-explosive-barrel | (27, 58) ring position 2 | 1.0 | Destructible, explosive |
| wrath-explosive-barrel | (17, 62) ring position 3 | 1.0 | Destructible, explosive |
| wrath-explosive-barrel | (27, 62) ring position 4 | 1.0 | Destructible, explosive |
| wrath-explosive-barrel | (17, 66) ring position 5 | 1.0 | Destructible, explosive |
| wrath-explosive-barrel | (27, 66) ring position 6 | 1.0 | Destructible, explosive |
| wrath-explosive-barrel | (20, 58) ring position 7 | 1.0 | Destructible, explosive |
| wrath-explosive-barrel | (24, 66) ring position 8 | 1.0 | Destructible, explosive |
| wrath-chain-curtain | (19, 59) ceiling hang | 1.0 | Industrial chains, atmosphere |
| wrath-chain-curtain | (25, 59) ceiling hang | 1.0 | Industrial chains, atmosphere |
| wrath-chain-curtain | (19, 65) ceiling hang | 1.0 | Industrial chains, atmosphere |
| wrath-chain-curtain | (25, 65) ceiling hang | 1.0 | Industrial chains, atmosphere |
| wrath-chain-curtain | (22, 59) ceiling center N | 1.0 | Industrial chains |
| wrath-chain-curtain | (22, 65) ceiling center S | 1.0 | Industrial chains |
| wrath-caged-lantern | (15, 60) east wall overhead | 0.8 | Industrial overhead light |
| wrath-caged-lantern | (29, 60) west wall overhead | 0.8 | Industrial overhead light |

**Lighting:**
- 4x torch-sconce-ornate: (15, 57) N wall, (29, 57) N wall, (15, 69) S wall, (29, 69) S wall -- deep red `#ff3300`, radius 4 cells
- 2x wrath-caged-lantern overhead: white-hot `#ff8866`, radius 6 cells, intensity 0.9
- Barrel glow: faint red-orange `#ff4400` from cracks, radius 1 cell

**Platforming:** Flat arena at elevation 0. Barrels at floor level. Lanterns at elevation 2.0. Chains hang from ceiling elevation 3+.

---

### Room: Shrine of Fury (6x6, secret)

**Player Experience:** You push through the false wall and the red drains away. Cooler concrete. Muted light. A bench sits in the center -- a deliberate absurdity in a circle of rage. A scroll rests on the wall. Two torches burn at barely half the intensity of every other room. Health and ammo pickups sit generously on the floor. The escalation timer does not run here. In the circle of Wrath, the secret room is peace.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-smashed-barrier | (3, 75) west corner, small | 0.3 | Minimal debris, contrast to rage |
| wrath-iron-grate | (5, 77) floor center | 0.6 | Drain grate, industrial detail |
| wrath-caged-lantern | (5, 76) ceiling center | 0.4 | Calmer version of arena lighting |

**Lighting:**
- 2x torch-sconce-ornate: (3, 75) west wall, (7, 75) east wall -- muted amber `#aa7733`, radius 3 cells, intensity 0.4 (deliberately dim)
- 1x caged lantern overhead: warm `#aa7733`, radius 2 cells, intensity 0.3

**Platforming:** Flat, elevation 0. Deliberately plain -- cooler concrete, muted lighting. No elevation changes.

**Playtest Note:** Added a caged lantern as a calmer version of the arena overhead lights per playtest recommendation. Room remains intentionally minimal -- 3 props is appropriate for a 6x6 rest area meant to contrast with the fury elsewhere.

---

### Room: Gauntlet (6x20, corridor)

**Player Experience:** A long, narrow tunnel of pure forward momentum. The moment you step in, hellgoats spawn behind you. Their footsteps grow louder, faster -- the escalation timer is running. Ahead, the corridor descends via ramps, then rises again. FireGoats wait on the lower sections, blocking your path downhill. You fire downhill at them while sprinting. Behind you, the horde accelerates. Health pickups appear at the one-third and two-third marks like lifelines. You cannot stop. Forward, always forward.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-jagged-arch | (23, 74) north entry | 0.7 | face-south | Gauntlet entrance |
| wrath-jagged-arch | (23, 93) south exit | 0.7 | face-south | Exit to Colosseum |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-chain-curtain | (22, 76) ceiling interval 1 | 0.7 | Hanging chains, pacing marker |
| wrath-chain-curtain | (22, 82) ceiling interval 2 | 0.7 | Hanging chains, pacing marker |
| wrath-chain-curtain | (22, 88) ceiling interval 3 | 0.7 | Hanging chains, pacing marker |
| wrath-chain-curtain | (22, 92) ceiling interval 4 | 0.7 | Hanging chains, pacing marker |
| wrath-war-banner | (21, 78) east wall | 0.7 | Tattered war banner |
| wrath-war-banner | (25, 84) west wall | 0.7 | Tattered war banner |
| wrath-war-banner | (21, 90) east wall | 0.7 | Tattered war banner |
| wrath-smashed-barrier | (23, 79) ramp 1 top | 0.4 | Destroyed obstacle at ramp transition |
| wrath-smashed-barrier | (23, 85) ramp 2 top | 0.4 | Destroyed obstacle at ramp transition |
| wrath-blood-spattered-slab | (22, 80) east wall near ramp 1 | 0.5 | Blood-stained wall panel |
| wrath-blood-spattered-slab | (24, 88) west wall near ramp 3 | 0.5 | Blood-stained wall panel |
| wrath-chain-curtain | (24, 80) ceiling interval extra | 0.6 | Additional hanging chains |
| wrath-chain-curtain | (24, 86) ceiling interval extra | 0.6 | Additional hanging chains |

**Lighting:**
- 4x torch-sconce-ornate: (21, 77) east wall, (25, 81) west wall, (21, 85) east wall, (25, 89) west wall -- deep red `#ff3300`, radius 4 cells, alternating sides

**Platforming:** Starts at elevation 0, ramp down to -0.5 (2-cell ramp), level at -0.5, ramp down to -1.0 (2-cell ramp), level at -1.0 (midpoint), ramp up to -0.5 (2-cell ramp), ramp up to 0 (2-cell ramp). Three ramp sections create shooting angles for downhill advantage.

**Playtest Note:** Gauntlet had 11 props for a 6x20 room (120 cells). Added smashed barriers at ramp tops, blood-spattered wall slabs, and 2 more chain curtains to fill gaps in the visual rhythm. Target: 17 environmental props for 120 cells.

---

### Room: Furia's Colosseum (16x16, boss)

**Player Experience:** You descend into a vast circular arena of packed sand. Torches ring the perimeter. Chains hang from the ceiling in a ring. Four anvils mark the cardinal points like compass needles. And there, in the center -- Furia. Massive. The largest enemy you have faced. He lowers his horns and charges. The sand explodes where he impacts the wall. You dodge sideways. In phase 2, he rips a chain from the ceiling and swings it as a whip. In phase 3, the walls begin to close. Concrete slabs slide inward. The arena shrinks. Kill or be crushed.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| wrath-jagged-arch | (24, 98) north entrance | 1.2 | face-south | Colosseum entrance arch |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| wrath-anvil | (16, 106) west cardinal point | 1.2 | Wall landmark, positioning aid |
| wrath-anvil | (32, 106) east cardinal point | 1.2 | Wall landmark, positioning aid |
| wrath-anvil | (24, 98) north cardinal point | 1.0 | Wall landmark, positioning aid |
| wrath-anvil | (24, 114) south cardinal point | 1.0 | Wall landmark, positioning aid |
| wrath-chain-curtain | (20, 101) ceiling ring NW | 1.2 | Chains -- Furia rips in phase 2 |
| wrath-chain-curtain | (28, 101) ceiling ring NE | 1.2 | Chains -- Furia rips in phase 2 |
| wrath-chain-curtain | (18, 106) ceiling ring W | 1.2 | Chains, phase 2 weapons |
| wrath-chain-curtain | (30, 106) ceiling ring E | 1.2 | Chains, phase 2 weapons |
| wrath-chain-curtain | (20, 111) ceiling ring SW | 1.2 | Chains, phase 2 weapons |
| wrath-chain-curtain | (28, 111) ceiling ring SE | 1.2 | Chains, phase 2 weapons |
| wrath-chain-curtain | (24, 101) ceiling ring N | 1.2 | Chains, visual |
| wrath-chain-curtain | (24, 111) ceiling ring S | 1.2 | Chains, visual |
| wrath-war-banner | (22, 98) entrance flank left | 1.0 | War banner |
| wrath-war-banner | (26, 98) entrance flank right | 1.0 | War banner |
| wrath-blood-spattered-slab | (20, 104) sand floor NW | 0.3 | Half-buried in sand, past combats |
| wrath-blood-spattered-slab | (28, 108) sand floor SE | 0.3 | Half-buried in sand, past combats |
| wrath-smashed-barrier | (19, 110) sand floor SW | 0.3 | Arena rubble, half-buried |
| wrath-smashed-barrier | (29, 102) sand floor NE | 0.3 | Arena rubble, half-buried |
| wrath-iron-grate | (24, 106) center floor | 0.5 | Central drain grate under sand |

**Lighting:**
- 8x torch-sconce-ornate perimeter ring: (18, 100), (24, 99), (30, 100), (32, 104), (32, 108), (30, 112), (24, 113), (18, 112) -- deep red `#ff3300`, radius 4 cells, floor-standing on sand
- Sand-reflected warm bounce light: ambient `#ff4411`, intensity 0.22
- Phase 3: fog density surges to 0.06, color shifts to `#2a0000`

**Platforming:** Flat sand floor at elevation 0 throughout. Anvils at floor level. Chains hang from ceiling at elevation 3 (Furia rips them down in phase 2). Phase 3: WALL_STONE cells slide inward from all four edges, 1 cell every 5 seconds, 16x16 to lethal 4x4 in 30 seconds.

**Playtest Note:** Colosseum sand floor (256 cells) had zero props. Added blood-spattered slabs and smashed barriers partially buried in the sand for past-combat atmosphere, and a central drain grate. Props are small-scale (0.3) to avoid obstructing boss fight movement. Target: 19 environmental props for a 16x16 boss arena.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Notes |
|---------|------|----------|-------|
| lava-altar | Lava Altar | ✅ exists | Available for placement if needed |
| wrath-anger-graffiti-slab | Rage Graffiti Slab | ✅ exists | Used in Gate of Dis, Arsenal |
| wrath-anvil | Wrath Anvil | ✅ exists | Used in Gate of Dis (2x), Colosseum (4x) |
| wrath-blood-spattered-slab | Blood-Spattered Slab | ✅ exists | Used in Blood Marsh, Arsenal, Rage Pit, Gauntlet, Colosseum |
| wrath-caged-lantern | Caged Lantern | ✅ exists | Used in Berserker Arena (2x), Shrine (1x) |
| wrath-chain-curtain | Chain Curtain | ✅ exists | Used in all rooms -- Wrath signature prop |
| wrath-corroded-pipe-pillar | Corroded Pipe Pillar | ✅ exists | Used in Blood Marsh (2x), Rage Pit (2x) |
| wrath-dented-iron-door | Dented Iron Door | ✅ exists | Used in Gate of Dis, Berserker Arena |
| wrath-explosive-barrel | Explosive Barrel | ✅ exists | Used in Berserker Arena (8x, destructible) |
| wrath-iron-grate | Iron Floor Grate | ✅ exists | Used in Shrine, Blood Marsh, Rage Pit, Colosseum |
| wrath-jagged-arch | Jagged Iron Arch | ✅ exists | Used in Gate of Dis, Arsenal, Berserker Arena, Gauntlet, Colosseum |
| wrath-pit-tier-ring | Pit Tier Ring | ✅ exists | Used in Rage Pit (4x structural tiers) |
| wrath-punching-bag-chain | Punching Bag Chain | ✅ exists | Used in Rage Pit |
| wrath-rage-furnace | Rage Furnace | ✅ exists | Used in Blood Marsh (2x) |
| wrath-rusted-cage | Rusted Cage | ✅ exists | Used in Blood Marsh (3x), Rage Pit (3x) |
| wrath-shattered-weapon-rack | Shattered Weapon Rack | ✅ exists | Used in Arsenal (4x) |
| wrath-smashed-barrier | Smashed Barrier | ✅ exists | Used in Rage Pit, Arsenal, Shrine, Gauntlet, Colosseum |
| wrath-stone-island | Stone Island | ✅ exists | Used in Blood Marsh (5x structural) |
| wrath-war-banner | War Banner | ✅ exists | Used in Gate of Dis, Gauntlet (3x), Colosseum (2x) |
| wrath-weapon-pedestal | Weapon Pedestal | ✅ exists | Used in Arsenal (Goat's Bane display) |
