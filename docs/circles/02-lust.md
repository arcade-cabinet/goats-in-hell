---
title: "Circle 2: Lust"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 2
sin: desire
boss: Caprone
act: 1
build_script: scripts/build-circle-2.ts
mechanic: siren-pulls
related:
  - docs/circles/00-player-journey.md
  - docs/circles/01-limbo.md
  - docs/agents/level-editor-api.md
---

# Circle 2: Lust — Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Identity

**Circle:** 2 (Lust)
**Sin:** Desire
**Boss:** Caprone — hermaphroditic Baphomet, inherently dual-gendered (Dainir female base + both anatomies)
**Dominant Mechanic:** Siren pulls (wind zones drag the player toward lava hazards)
**Dante Quote:** *"La bufera infernal, che mai non resta, mena li spirti con la sua rapina..."* (The hellish storm, which never rests, sweeps the spirits with its fury...)

**Feel:** The cold stone of Limbo gives way to warm marble. The architecture is inviting — polished, beautiful, almost seductive. Amber candlelight, draped fabrics, perfumed air. Then you feel the wind. It tugs you gently at first, then insistently, always toward the lava. This circle teaches: **desire pulls you toward destruction, and resisting it is the fight.**

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Polished warm marble, cream with amber veins | Marble006, Marble012 | Inviting, luxurious |
| Floor | Smooth marble tile, rose-tinted | Tiles074, Tiles087 | Warm underfoot, reflective |
| Column accents | Deep veined onyx | Onyx003 | Dark contrast to warm walls |
| Lava channels | Cracked ember stone, glowing seams | Rock044 | Bordering lava hazards |
| Ceiling | Coffered marble with fabric insets | Marble019 | Ornate, cathedral-like |
| Wind Corridor | Rougher marble, wind-worn | Marble003 | Erosion from eternal wind |
| Boss chamber | Black marble with gold veins | Onyx006 | Regal, imposing |
| Secret room (Boudoir) | Plush fabric over marble | Fabric026 over Marble006 | Intimate, hidden luxury |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Antechamber | 0.02 | `#2e1a1a` | Faint warmth, clear visibility |
| Wind Corridor / Gallery | 0.03 | `#2e1a1a` | Slight haze from heat |
| Siren Pit | 0.05 | `#331515` | Rising heat from lava below |
| Tempest Hall (arena) | 0.04 | `#2e1a1a` | Standard — clarity needed for bridges |
| Boss phase 3 (HP<25%) | 0.06 | `#3d1111` | Heat shimmer as lava rises |

### Lighting

- Ambient: `#cc8844` at intensity 0.20 (warm amber, seductive)
- Point lights from CandleStick_Triple and Chandelier props (warm gold `#ffaa55`, radius 5 cells)
- Lava channels emit `#ff4400` at intensity 0.4, radius 3 cells (danger glow)
- Wind Corridor: flickering light from lava — `#ff6622` point lights at intervals
- Boss chamber: two Chandelier props overhead, dramatic throne backlighting `#ff8800`

### Props (from Fantasy Props MegaKit)

| Prop | Placement | Purpose |
|------|-----------|---------|
| CandleStick_Triple | Wall-mounted, 2-4 per room | Primary warm light source |
| Chandelier | Ceiling-hung, large rooms only | Dramatic overhead lighting |
| Banner_1 | Wall-mounted, Gallery + Sanctum | Fabric draping, luxury feel |
| Banner_2 | Wall-mounted, Wind Corridor | Visually show wind direction (they flutter) |
| Chalice | Floor/pedestal, Gallery + Boudoir | Decadent decoration |
| Bed_Twin1 | Floor, Boudoir only | Secret room thematic prop |
| Chair_1 | Floor, Gallery + Boudoir | Furnishing |
| Vase_2 | Floor/pedestal, Antechamber + Gallery | Elegant decoration |
| Vase_4 | Floor, scattered | Ornate vase, breakable feel |
| Scroll_1 | Pedestal, Boudoir | Lore delivery |
| Table_Large | Floor, Boudoir | Central furniture piece |

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Leaking001 | Near lava channel walls | Heat damage on stone |
| Scratches002 | Floor near wind zones | Wind erosion marks |

---

## Room Layout

### Overview (7 rooms)

```
                    ┌──────────────┐
                    │ ANTECHAMBER  │  (8×6, exploration, sortOrder=0)
                    │   Spawn ★    │  Warm marble. Introduction.
                    └──────┬───────┘
                           │ corridor (width=3)
                    ┌──────┴───────┐
                    │WIND CORRIDOR │  (5×16, gauntlet, sortOrder=1)
                    │  lava│ │lava │  Narrow. Wind pulses crosswise.
                    │      │→│     │  Move during lulls.
                    └──────┬───────┘
                           │ corridor (width=3)
                    ┌──────┴───────┐
              ┌─────┤LOVER'S       │  (14×10, exploration+combat, sortOrder=2)
              │     │ GALLERY      │  Columns, banners, fireGoats.
              │     │ first ranged │  Wind pushes toward E lava.
              │     └──────┬───────┘
              │            │ corridor (width=3)
         ┌────┴────┐ ┌────┴──────────┐
         │ BOUDOIR │ │  SIREN PIT    │  (12×12, platforming, sortOrder=3)
         │  (6×6)  │ │  spiral ramp  │  VERTICAL: descend ramp around
         │ secret  │ │  ↓ lava core  │  lava pit. Elevation 0→-2.
         │ ammo+hp │ │  ↓ enemies at │
         └─────────┘ │    all levels │
                     └────┬──────────┘
                          │ corridor (width=3, ascending ramp)
                     ┌────┴──────────┐
                     │ TEMPEST HALL  │  (14×12, arena, sortOrder=4)
                     │ 3 lava lanes  │  Wind shifts direction.
                     │ bridges cross │  2 waves mixed.
                     │ lock+wave     │
                     └────┬──────────┘
                          │ grand doorway (width=4)
                     ┌────┴──────────┐
                     │  CAPRONE'S    │  (14×14, boss, sortOrder=5)
                     │  SANCTUM      │  Throne. Wind rotates.
                     │  3 phases     │  Lava rises in phase 3.
                     └───────────────┘
```

### Grid Dimensions

**45 wide × 95 deep** (90 × 190 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Antechamber | 18 | 2 | 8 | 6 | exploration | 0 | 0 |
| Wind Corridor | 20 | 12 | 5 | 16 | gauntlet | 0 | 1 |
| Lover's Gallery | 15 | 32 | 14 | 10 | exploration | 0 | 2 |
| Boudoir | 3 | 34 | 6 | 6 | secret | 0 | 3 |
| Siren Pit | 16 | 46 | 12 | 12 | platforming | 0 (center=-2) | 4 |
| Tempest Hall | 15 | 62 | 14 | 12 | arena | -1 | 5 |
| Caprone's Sanctum | 15 | 78 | 14 | 14 | boss | -1 | 6 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Antechamber | Wind Corridor | corridor | 3 | Transition to narrow gauntlet |
| Wind Corridor | Lover's Gallery | corridor | 3 | Opens up into wider space |
| Lover's Gallery | Boudoir | secret | 2 | WALL_SECRET on west wall. **Visual tell:** A faint draft and slight discoloration in the stone marks the secret entrance. Candle flames near the wall flicker toward it. |
| Lover's Gallery | Siren Pit | corridor | 3 | Main path continues south |
| Siren Pit | Tempest Hall | corridor+ramp | 3 | Ascending from -2 back to -1 |
| Tempest Hall | Caprone's Sanctum | grand doorway | 4 | Wide ceremonial entrance |

---

## Rooms (Detailed)

### Room 1: Antechamber

```
    N
    ↓ (player enters from Circle 1 descent)
  ┌────────────────┐
  │ ○           ○  │   ○ = CandleStick_Triple (wall, offsetY=1.5)
  │    ◇     ◇     │   ◇ = Vase_2 (floor pedestal)
  │                │
  │      ★         │   ★ = Player spawn
  │                │
  │ ○    ═════  ○  │   ═ = FLOOR_RAISED step (elevation +0.5)
  │      ↓exit     │
  └──────┬─────────┘
         ↓ S (to Wind Corridor)
```

**Dimensions:** 8W × 6H, elevation 0
**Purpose:** Safe introduction. The player sees warm marble for the first time. The FLOOR_RAISED step at the south hints at the elevation changes to come. A gentle breeze blows from the south exit — foreshadowing the wind mechanic.

**Props:**
- 4× CandleStick_Triple: `surfaceAnchor: 'wall'`, faces: N(×2), S(×2), `offsetY: 1.5`
- 2× Vase_2: floor at (20, 4) and (23, 4), decorative
- 1× Banner_1: `surfaceAnchor: 'wall'`, face: N, `offsetY: 2.0` — draped over entrance

---

### Room 2: Wind Corridor

```
         ↓ N (from Antechamber)
  ┌──┬──────┬──┐
  │▓▓│      │▓▓│   ▓▓ = FLOOR_LAVA (lava channels, 1 cell wide each side)
  │▓▓│  ←←  │▓▓│   ←← = wind zone (blows W→E, pushes toward E lava)
  │▓▓│      │▓▓│
  │▓▓│ ←OFF │▓▓│   Wind pulses: 3s ON → 2s OFF → 3s ON...
  │▓▓│      │▓▓│
  │▓▓│  ←←  │▓▓│   Safe walkway is 3 cells wide (center)
  │▓▓│      │▓▓│
  │▓▓│ ←OFF │▓▓│   4 wind zone segments alternate
  │▓▓│      │▓▓│
  │▓▓│  ←←  │▓▓│
  │▓▓│      │▓▓│
  │▓▓│ ←OFF │▓▓│
  │▓▓│      │▓▓│
  │▓▓│  ←←  │▓▓│
  │▓▓│      │▓▓│
  │▓▓│      │▓▓│
  └──┴──┬───┴──┘
        ↓ S (to Lover's Gallery)
```

**Dimensions:** 5W × 16H, elevation 0
**Purpose:** Wind mechanic tutorial. Player must traverse a marble walkway (3 cells wide) flanked by lava channels (1 cell wide on each side). Wind blows crosswise (west to east) in alternating segments — 3 seconds on, 2 seconds off. During gusts, the player is pushed toward the east lava channel. Move during lulls. No enemies — pure mechanic teaching.

**Elevation:** Walkway at 0. Lava channels at -0.5 (sunken into floor).

**Props:**
- 4× Banner_2: `surfaceAnchor: 'wall'`, face: W, `offsetY: 2.0` — flutter toward east, visually indicating wind direction
- 2× CandleStick_Triple: `surfaceAnchor: 'wall'`, face: E, `offsetY: 1.5` — flames lean with wind

---

### Room 3: Lover's Gallery

```
              ↓ N (from Wind Corridor)
  ┌──────────────────────────────┐
  │ ○  ▌     ▌     ▌     ▌  ○  │   ○ = CandleStick_Triple (wall)
  │    ▌     ▌     ▌     ▌     │   ▌ = Onyx column (structural, LOS break)
  │                             │
  │  ☿   ▌      ◊      ▌   ☿  │   ☿ = fireGoat spawn
  │      ▌             ▌      ▓│   ◊ = ammo pickup
  │                            ▓│   ▓ = FLOOR_LAVA trap (E wall, 1-cell strip)
  │  ☿   ▌      ♥      ▌     ▓│   ♥ = health pickup
  │      ▌             ▌      ▓│   → = wind push direction (toward E lava)
  │            →→→→→→→→→→→→→→→▓│
  │ ○  ▌     ▌     ▌     ▌  ○ │
  └─┬────────────────┬─────────┘
    ↓ SW             ↓ S
  (secret:Boudoir) (to Siren Pit)
```

**Dimensions:** 14W × 10H, elevation 0
**Purpose:** First real combat in Circle 2. fireGoats (ranged enemies, first appearance) shoot from behind columns while steady wind pushes the player toward lava traps on the east wall. Marble columns provide cover from projectiles AND wind resistance (breaking LOS with a column blocks wind push). The player learns to use geometry defensively.

**Elevation:** Main floor at 0. East lava strip at -0.5. A FLOOR_RAISED viewing balcony (elevation +1) runs along the north wall (2 cells deep) — fireGoats start here with height advantage.

**Props:**
- 8× Onyx columns: structural, arranged in 2 rows of 4, spaced evenly
- 4× CandleStick_Triple: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5`
- 4× Banner_1: `surfaceAnchor: 'wall'`, face: N and S alternating, `offsetY: 2.5` — fabric drapes between columns
- 2× Chair_1: floor, near columns, knocked over (aftermath feel)
- 2× Chalice: floor, scattered near chairs
- 2× Vase_4: floor, (17, 35) and (25, 39)

---

### Room 4: Siren Pit

```
              ↓ N (from Lover's Gallery)
  ┌────────────────────────────┐  Elevation 0 (entry ledge)
  │ ○  ramp starts here        │
  │  ╔═══╗                     │
  │  ║   ║    ☿               ○│  ☿ = fireGoat (elevation 0, fires across)
  │  ║ ▓▓║══╗     ramp descends│
  │  ║ ▓▓║  ║         -0.5    │  Ramp spirals clockwise around
  │  ║ ▓▓║  ║  ☿              │  central lava pit (▓▓)
  │  ║ ▓▓║  ╚═══╗     -1.0   │
  │  ║ ▓▓║      ║             │  Wind pulls INWARD + DOWN
  │  ║ ▓▓║  ☿   ║     -1.5   │  toward lava center
  │  ║ ▓▓║      ╚═══╗ -2.0   │
  │  ║ ▓▓║    ◊  ♥  ║ bottom  │  ◊ = ammo, ♥ = health (at bottom)
  │  ╚═══╝══════════╝ exit    │
  └────────────────────┬───────┘
                       ↓ S (to Tempest Hall, ramp up from -2 to -1)
```

**Dimensions:** 12W × 12H, elevation 0 (entry) to -2 (bottom)
**Purpose:** Signature vertical moment. A circular pit with a 4×4 FLOOR_LAVA core. A 3-cell-wide spiral ramp descends clockwise from elevation 0 to -2 around the lava. Wind pulls inward and downward — constant siren pull toward the burning center. Enemies fire from multiple elevations on the ramp and from ledges cut into the outer wall. Falling off the ramp means landing in lava. The player must descend carefully, fighting while resisting the pull.

**Elevation breakdown:**
- Entry ledge (N): elevation 0, 2 cells deep
- Ramp segment 1 (E wall): 0 to -0.5
- Ramp segment 2 (S wall): -0.5 to -1.0
- Ramp segment 3 (W wall): -1.0 to -1.5
- Ramp segment 4 (N wall, inner): -1.5 to -2.0
- Bottom landing: -2.0, exit corridor south

**Props:**
- 2× CandleStick_Triple: `surfaceAnchor: 'wall'`, face: E and W, `offsetY: 2.0` — high on walls, light the descent
- 3× Chain_Coil: hanging from ceiling over lava pit, `offsetY: 3.0` — vertical visual marking danger zone
- 1× Chandelier: ceiling center, directly over lava — dramatic lighting of the pit

---

### Room 5: Tempest Hall (Arena)

```
              ↓ N (from Siren Pit, ascending ramp)
  ┌──────────────────────────────────┐
  │ ○      bridge1      bridge2   ○  │  Elevation -1 (platforms)
  │    ┌──┐  ┌─┐   ┌──┐  ┌─┐      │
  │ P  │▓▓│  │═│   │▓▓│  │═│   P  │  P = raised platform (-0.5)
  │ L  │▓▓│  │═│   │▓▓│  │═│   L  │  ▓▓ = FLOOR_LAVA channel (3 N-S)
  │ A  │▓▓│  │═│   │▓▓│  │═│   A  │  ═ = bridge (3 cells wide)
  │ T  │▓▓│  │═│   │▓▓│  │═│   T  │  → = wind direction (shifts!)
  │    │▓▓│  │═│   │▓▓│  │═│      │
  │ →→ │▓▓│→→│═│→→ │▓▓│→→│═│ →→  │  Wind blows W→E, then shifts
  │    │▓▓│  │═│   │▓▓│  │═│      │  to E→W every 8 seconds
  │ P  │▓▓│  │═│   │▓▓│  │═│   P  │
  │ L  │▓▓│  │ │   │▓▓│  │═│   L  │  bridge3 is lower (elev -1.5)
  │ A  │▓▓│  │ │   │▓▓│  │═│   A  │  — wind can push you off it
  │ T  │▓▓│  │ │   │▓▓│  │═│   T  │
  │ ○  └──┘  └─┘   └──┘  └─┘   ○  │
  └──────────────────┬───────────────┘
                     ↓ S (to Caprone's Sanctum)
```

**Dimensions:** 14W × 12H, elevation -1
**Purpose:** Arena encounter. The room is divided into 4 north-south lanes by 3 lava channels (each 1 cell wide). Two bridges per channel cross the lava (3 cells wide each, at different Z positions). The wind shifts direction every 8 seconds — W-to-E, then E-to-W — forcing the player to use different bridges as the wind changes. Raised stone platforms (elevation -0.5) at the east and west extremes provide refuge from wind. Two waves of mixed hellgoat + fireGoat. Doors lock on entry.

**Elevation:** Main lanes at -1. Lava channels at -1.5 (sunken). Bridges at -1 (flush with lanes). East/West raised platforms at -0.5. Third bridge (SW) at -1.5 — risky path, wind can push you off.

**Props:**
- 4× CandleStick_Triple: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5`
- 2× Banner_1: `surfaceAnchor: 'wall'`, face: N and S, `offsetY: 2.5` — flutter with wind direction changes
- 2× Barrel: floor, on raised platforms, visual marker for safe zones

---

### Room 6: Boudoir (Secret)

```
  WALL_SECRET entrance from Lover's Gallery (E wall)
         →
  ┌──────────────┐
  │ ○    ☽    ○  │   ☽ = Chandelier (ceiling)
  │              │
  │  🛏   📜  ♥  │   🛏 = Bed_Twin1, 📜 = Scroll_1 on Table_Large
  │              │   ♥ = health pickup (guaranteed safe)
  │  ◊    ◊      │   ◊ = ammo pickups (×2)
  │              │
  │ ○  ⌂     ○  │   ⌂ = Chalice on pedestal
  └──────────────┘
  No exit — return the way you came
```

**Dimensions:** 6W × 6H, elevation 0
**Purpose:** Secret reward room. Hidden behind WALL_SECRET on the west wall of Lover's Gallery. A luxurious chamber — the only room in Hell that feels comfortable. Contains guaranteed-safe health and ammo pickups, plus a lore scroll. No enemies. No wind. A breath of calm before the descent into the Siren Pit.

**Props:**
- 4× CandleStick_Triple: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5` — warm, intimate light
- 1× Chandelier: ceiling center
- 1× Bed_Twin1: floor, (4, 36)
- 1× Table_Large: floor, (6, 36), holds Scroll_1
- 1× Scroll_1: on table — lore delivery
- 1× Chalice: floor pedestal, (5, 38)
- 2× Vase_2: floor, flanking bed

---

### Room 7: Caprone's Sanctum (Boss)

```
              ↓ N (grand doorway from Tempest Hall, width=4)
  ┌────────────────────────────────────┐
  │ ○                               ○  │   Elevation -1 (main floor)
  │                                    │
  │  ◊                           ◊    │   ◊ = ammo (NW, NE corners)
  │                                    │
  │      ┌───────────────────┐         │   Raised throne dais (elev -0.5)
  │      │   THRONE DAIS     │         │   Phase 1: Caprone sits here
  │      │                   │         │
  │ ♥    │    ☠ CAPRONE      │    ♥    │   ☠ = boss spawn
  │      │                   │         │   ♥ = health (W, E alcoves)
  │      └───────────────────┘         │
  │                                    │
  │  ▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓       │   ▓ = FLOOR_LAVA channels
  │  ▓▓▓▓▓     ▓▓▓▓▓     ▓▓▓▓▓       │   (phase 3: lava rises, channels widen)
  │                                    │
  │  ◊          ═══          ◊        │   ═ = bridge over center channel
  │                                    │   Wind rotates: N→E→S→W every 10s
  │ ○                               ○  │
  └────────────────────────────────────┘

  WIND ROTATION (phase 2+):
  T=0s:  ↓ (N→S)     T=10s: → (W→E)
  T=20s: ↑ (S→N)     T=30s: ← (E→W)    (repeats)
```

**Dimensions:** 14W × 14H, elevation -1
**Purpose:** Boss fight. Caprone sits on a raised marble throne dais (elevation -0.5, 8×4 cells) at the room's north-center. Three lava channels run east-west across the southern half. A single bridge crosses the center channel. Ammo in the four corners, health in east/west alcoves near the dais.

**Elevation:** Main floor at -1. Throne dais at -0.5. Lava channels at -1.5 (widen in phase 3). Four corner pillars at floor level provide minimal cover.

**Boss Phases:**

**Phase 1 — Seduction (100%–50% HP):**
Wind pulls steadily toward Caprone (north). The boss fires slow-moving pink-orange projectiles in sweeping arcs. Player must dodge laterally while fighting the northward pull. Caprone stays seated on the throne. Projectile speed: slow (player can side-step), but wind makes lateral movement harder.

**Phase 2 — Fury (50%–25% HP):**
Throne shatters (debris particles). Caprone becomes mobile. Dual-armed attacks: left arm melee swipe (close range, 120-degree arc, 15 damage), right arm ranged projectile (faster than phase 1, 10 damage). Wind begins rotating — direction changes every 10 seconds (N→E→S→W cycle). Player must constantly re-orient their movement relative to wind. Caprone charges between platforms.

**Phase 3 — Inferno (25%–0% HP):**
Floor cracks. Lava channels widen by 1 cell on each side (total 3 cells wide each). Safe floor area reduced by ~40%. The bridge over the center channel collapses. Player must jump across or stay on one side. Wind rotation accelerates to every 6 seconds. Caprone's projectiles leave lingering fire patches (3-second duration, 1-cell radius). The room becomes a shrinking arena of safe ground.

**Props:**
- 4× CandleStick_Triple: `surfaceAnchor: 'wall'`, corners, `offsetY: 1.5`
- 2× Chandelier: ceiling, flanking throne dais
- 2× Banner_1: `surfaceAnchor: 'wall'`, face: N, flanking entrance, `offsetY: 3.0`
- 4× Onyx columns: floor, marking corners of dais (structural, minor cover)
- 1× Throne (Chest_Wood reskinned as throne): floor, center of dais — shatters in phase 2

---

## Entities

### Enemies (15 total + boss)

| Room | Type | Count | Behavior | Variant | Position Notes |
|------|------|-------|----------|---------|----------------|
| Lover's Gallery | fireGoat | 3 | Ranged, fire from behind columns | Crimson | N balcony (18,33), center column (22,36), SE corner (27,40) |
| Lover's Gallery | hellgoat | 2 | Melee patrol between columns | Brown | W side (17,37), E side (26,37) |
| Siren Pit | fireGoat | 2 | Ranged from ledge niches | Crimson | E ledge elev -0.5 (26,49), W ledge elev -1.5 (18,54) |
| Siren Pit | hellgoat | 1 | Melee, bottom landing | Brown | Bottom (22,56), elev -2.0 |
| Tempest Hall wave 1 | hellgoat | 3 | Melee, charge across bridges | Brown | NW platform (16,63), center lane (22,67), SE platform (27,71) |
| Tempest Hall wave 2 | fireGoat | 2 | Ranged from elevated platforms | Crimson | W platform (16,69), E platform (27,65) |
| Tempest Hall wave 2 | hellgoat | 2 | Melee, mixed with ranged | Brown | Center N (22,63), center S (22,71) |
| Boss chamber | Caprone | 1 | Boss AI, 3 phases | boss-caprone.glb | Throne dais (22,83), elev -0.5 |

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Antechamber | ammo | (22, 5) | Starting supply |
| Wind Corridor | health | (22, 20) | Midway through corridor — reward for surviving half |
| Lover's Gallery | ammo | (22, 36) | Center of room, risky (wind exposure) |
| Lover's Gallery | health | (22, 39) | South center, near exit |
| Siren Pit | ammo | (25, 56) | Bottom landing, near exit |
| Siren Pit | health | (23, 56) | Bottom landing, reward for descent |
| Boudoir | health | (7, 36) | Guaranteed safe |
| Boudoir | ammo × 2 | (5, 38), (7, 38) | Generous secret reward |
| Tempest Hall (between waves) | ammo | (16, 67) | W platform, safe from wind |
| Tempest Hall (between waves) | health | (27, 67) | E platform, safe from wind |
| Boss chamber | ammo × 2 | (17, 80), (27, 80) | NW and NE corners |
| Boss chamber | health × 2 | (17, 88), (27, 88) | SW and SE corners — far from boss |

### Props (non-interactive, summary per room)

| Room | Props |
|------|-------|
| Antechamber | 4× CandleStick_Triple (walls), 2× Vase_2 (floor), 1× Banner_1 (N wall) |
| Wind Corridor | 4× Banner_2 (W wall, show wind), 2× CandleStick_Triple (E wall) |
| Lover's Gallery | 8× Onyx columns (structural), 4× CandleStick_Triple (walls), 4× Banner_1 (walls), 2× Chair_1, 2× Chalice, 2× Vase_4 |
| Siren Pit | 2× CandleStick_Triple (walls), 3× Chain_Coil (ceiling), 1× Chandelier (ceiling) |
| Tempest Hall | 4× CandleStick_Triple (walls), 2× Banner_1 (walls), 2× Barrel (platforms) |
| Boudoir | 4× CandleStick_Triple (walls), 1× Chandelier, 1× Bed_Twin1, 1× Table_Large, 1× Scroll_1, 1× Chalice, 2× Vase_2 |
| Caprone's Sanctum | 4× CandleStick_Triple (walls), 2× Chandelier (ceiling), 2× Banner_1 (walls), 4× Onyx columns, 1× throne |

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Wind Corridor | (20, 12, 5, 4) | `ambientChange` | `once: true` | `{ windActive: true, windDir: 'E', text: "The wind tugs at you..." }` |
| T2 | Lover's Gallery | (15, 32, 14, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'fireGoat', count:3}, {type:'hellgoat', count:2}] }` |
| T3 | Siren Pit | (16, 46, 12, 2) | `spawnWave` | `once: true` | `{ enemies: [{type:'fireGoat', count:2}, {type:'hellgoat', count:1}] }` |
| T4 | Siren Pit | (16, 46, 12, 2) | `ambientChange` | `once: true` | `{ windDir: 'inward', windIntensity: 0.6 }` |
| T5 | Tempest Hall | (17, 64, 10, 4) | `lockDoors` | `once: true` | — |
| T6 | Tempest Hall | (17, 64, 10, 4) | `spawnWave` | `once: true` | `{ enemies: [{type:'hellgoat', count:3}] }` |
| T7 | Tempest Hall | — | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'fireGoat', count:2}, {type:'hellgoat', count:2}] }` |
| T8 | Tempest Hall | — | `unlockDoors` | On wave 2 clear | — |
| T9 | Tempest Hall | — | `ambientChange` | On wave 2 clear | `{ windActive: false, text: "The wind dies..." }` |
| T10 | Caprone's Sanctum | (17, 79, 10, 2) | `bossIntro` | `once: true` | `{ text: "Come closer, little goat. Everyone comes closer eventually." }` |
| T11 | Caprone's Sanctum | (17, 79, 10, 2) | `lockDoors` | `once: true, delay: 3` | — |
| T12 | Caprone's Sanctum | — | `ambientChange` | Boss HP < 50% | `{ windMode: 'rotating', windPeriod: 10 }` |
| T13 | Caprone's Sanctum | — | `ambientChange` | Boss HP < 25% | `{ lavaRise: true, fogDensity: 0.06, windPeriod: 6 }` |

---

## Environment Zones

| Zone | Type | Bounds (x,z,w,h) | Intensity | Notes |
|------|------|-------------------|-----------|-------|
| Wind Corridor crosswind | `wind` | (20, 12, 5, 16) | 0.5 | Direction: W→E, timer_on: 3s, timer_off: 2s |
| Lover's Gallery wind | `wind` | (15, 32, 14, 10) | 0.35 | Direction: W→E, constant (steady push) |
| Siren Pit inward pull | `wind` | (16, 46, 12, 12) | 0.6 | Direction: inward (toward center) + down, constant |
| Tempest Hall shifting wind | `wind` | (15, 62, 14, 12) | 0.4 | Direction: alternates W→E / E→W, period: 8s |
| Boss chamber siren pull (P1) | `wind` | (15, 78, 14, 14) | 0.5 | Direction: toward boss (N), phase 1 only |
| Boss chamber rotating (P2) | `wind` | (15, 78, 14, 14) | 0.5 | Direction: rotates N→E→S→W, period: 10s, phase 2+ |
| Lava channel E (Gallery) | `lava` | (28, 32, 1, 10) | 1.0 | 5 DPS on contact |
| Lava channels (Wind Corridor) | `lava` | (20, 12, 1, 16) + (23, 12, 1, 16) | 1.0 | 5 DPS each side |
| Siren Pit lava core | `lava` | (20, 50, 4, 4) | 1.0 | 10 DPS — instant death territory |
| Lava channels (Tempest Hall) | `lava` | (19, 62, 1, 12) + (22, 62, 1, 12) + (25, 62, 1, 12) | 1.0 | 5 DPS each, 3 channels N-S |
| Lava channels (Boss) | `lava` | (17, 86, 3, 1) + (21, 86, 3, 1) + (25, 86, 3, 1) | 1.0 | Phase 3: widen by 1 cell each side |

---

## Player Spawn

- **Position:** (22, 4) — center of Antechamber
- **Facing:** π (south — facing toward Wind Corridor exit)

---

## Theme Configuration

```typescript
editor.createTheme('circle-2-lust', {
  name: 'lust',
  displayName: 'LUST — The Circle of Desire',
  primaryWall: MapCell.WALL_STONE,        // Marble-textured stone
  accentWalls: [MapCell.WALL_LAVA],       // Lava borders as accent
  fogDensity: 0.03,
  fogColor: '#2e1a1a',
  ambientColor: '#cc8844',
  ambientIntensity: 0.20,
  skyColor: '#1a0a0a',
  particleEffect: 'embers',              // Floating ember particles from lava
  enemyTypes: ['hellgoat', 'fireGoat'],
  enemyDensity: 1.0,                     // Standard density
  pickupDensity: 0.7,                    // Moderate — not scarce, not generous
  windEnabled: true,
  windBaseIntensity: 0.35,
  windDirection: 'variable',             // Changes per room/zone
});
```

---

## Narrative Beats

1. **Antechamber transition:** The marble is warm to the touch. The air smells of incense and something burning. A breeze stirs from the south. Title card fades: *"CIRCLE THE SECOND — LUST"*
2. **Wind Corridor first gust:** The wind catches the player mid-step. Banners snap taut. The lava on either side roils. The lesson is immediate: resist or burn.
3. **Lover's Gallery — first fireGoat:** A crimson projectile streaks past the player's face. The first ranged enemy. Combat changes here — cover matters now, and the wind won't let you stand still.
4. **Siren Pit descent:** The player looks down into the spiraling pit and sees lava glowing at the bottom. The wind pulls inward. Enemies fire from above and below. This is the moment the player understands verticality.
5. **Boudoir scroll (secret):** A scroll rests on the chaise lounge: *"The wind carries desire. Desire carried me to the edge. I could not let go."* — Inscription from the damned
6. **Tempest Hall wind death:** The wind shifts mid-bridge. A player caught on a bridge during a direction change is swept toward lava. The arena teaches: anticipate the shift, don't commit to a crossing until the wind allows it.
7. **Boss intro:** Caprone speaks from the throne: *"Come closer, little goat. Everyone comes closer eventually."* The wind pulls. The player approaches involuntarily unless they resist.
8. **Boss phase 2 — throne shatters:** Marble debris explodes outward. Caprone rises, dual-armed, furious. The wind begins to rotate. The fight transforms from "resist the pull" to "adapt to the spin."
9. **Boss defeat:** Caprone collapses. The wind stops instantly — total silence after constant noise. The marble walls crack. Through the cracks: organic tissue. The architecture of Gluttony is already growing through. Title card: *"CIRCLE THE THIRD — GLUTTONY"*

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter → renders in LevelMeshes.tsx
2. All 7 rooms are reachable from spawn (DAG validation passes); Boudoir via WALL_SECRET
3. Wind zones function correctly — player is physically pushed by environment zones with timer_on/timer_off
4. Lava channels deal damage on contact (5 DPS standard, 10 DPS Siren Pit core)
5. fireGoat enemies fire ranged projectiles — first ranged encounter in the game
6. Siren Pit spiral ramp supports multi-elevation gameplay (enemies at different heights)
7. Tempest Hall wind direction shift forces different bridge usage per cycle
8. Boss fight wind rotation works across all 3 phases with correct period changes
9. PlaytestRunner AI can navigate from spawn to boss and defeat Caprone
10. PBR materials from AmbientCG (Marble006, Marble012, Tiles074, Onyx003) render on surfaces
11. At least 5 Fantasy Props visible as GLB instances (CandleStick_Triple, Banner, Chandelier, etc.)
12. Each room feels distinct: tutorial (Corridor), cover combat (Gallery), vertical descent (Pit), arena (Hall), boss (Sanctum)

---

## What This Is NOT

- NOT a repeat of Circle 1's fog mechanic. Visibility is generally good here — the threat is physical (wind), not perceptual (fog).
- NOT symmetrical wind. Each room uses wind differently: pulsing (Corridor), steady (Gallery), inward (Pit), shifting (Hall), rotating (Boss). The mechanic evolves.
- NOT a simple flat layout. The Siren Pit descends 2 full elevation units. The Tempest Hall has raised platforms. The boss room has a dais. Verticality is a core part of this circle.
- NOT using Kenney or KayKit assets. Fantasy Props MegaKit + AmbientCG PBR textures only.
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored: tutorial → combat introduction → vertical challenge → arena → boss.

---

## 3D Spatial Design

### Room: Antechamber (8x6, exploration)

**Player Experience:** The cold gray of Limbo is gone. You step into warmth — polished marble catches amber candlelight and throws it back softened. The air smells faintly of incense and something burning underneath. Elegant vases flank the path. A banner drapes the entrance behind you. For the first time in Hell, you feel welcomed. A gentle breeze stirs from the south exit. You do not yet know that the breeze is the first warning.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-ornate-arch | (22,2) north entrance | 1.0 | face-south | Grand marble entrance from Circle 1 descent |
| lust-ornate-arch | (22,7) south exit | 1.0 | face-south | Frame transition to Wind Corridor |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-candelabra | (18,3), (25,3), (18,7), (25,7) wall-mounted | 1.0 | Warm amber lighting, 4 sources |
| lust-marble-vase | (20,4) and (23,4) floor pedestals | 0.9 | Elegant decoration, foreshadow luxury |
| lust-velvet-drape | (22,2) above north entrance | 1.0 | Fabric drape over entry — welcoming |
| lust-coffered-ceiling-tile | ceiling grid pattern | 0.8 | Ornate overhead, cathedral feel |
| lust-rose-thorn-cluster | (18,6) near floor by south exit | 0.5 | First subtle hint — beauty has thorns |

**Lighting:** 4x candelabra at corners, color `#ffaa55`, intensity 0.7, radius 5 cells. Warm amber ambient `#cc8844` at 0.20. Faint fog density 0.02, color `#2e1a1a`.
**Platforming:** Flat at elevation 0. FLOOR_RAISED step (+0.5) at south edge hints at elevation changes to come.

---

### Room: Wind Corridor (5x16, gauntlet)

**Player Experience:** The marble walkway stretches ahead, narrow — three cells wide. Lava glows on both sides, sunken channels of molten rock. Then the wind hits. It shoves you sideways, toward the east lava channel. Banners on the west wall snap taut, pointing where the wind wants to take you. You lean into it and push forward. The wind stops. You have two seconds before it starts again. Move now.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-ornate-arch | (22,12) north entrance | 0.9 | face-south | Entry from Antechamber |
| lust-ornate-arch | (22,27) south exit | 0.9 | face-south | Exit to Lover's Gallery |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-wind-banner | (20,14), (20,18), (20,22), (20,26) west wall | 0.8 | Wind direction indicators, flutter east |
| lust-candelabra | (24,16) and (24,24) east wall | 0.9 | Flames lean with wind |
| lust-lava-rock-border | (20,12)-(20,27) and (24,12)-(24,27) channel edges | 0.6 | Border the lava channels |
| lust-ember-brazier | (22,12) walkway north end | 0.8 | Warmth marker at safe zone |

**Lighting:** 2x candelabra on east wall, color `#ffaa55`, intensity 0.5. Lava channels emit `#ff4400` at intensity 0.4, radius 3 cells per side. Flickering `#ff6622` point lights at (21,15), (21,19), (21,23) from lava.
**Platforming:** Walkway at elevation 0 (3 cells wide center). Lava channels at -0.5 on both sides (1 cell wide each). Wind blows W-to-E in alternating segments: 3s on, 2s off.

---

### Room: Lover's Gallery (14x10, exploration+combat)

**Player Experience:** The corridor opens and you breathe — briefly. Onyx columns stretch in two rows ahead, their polished black surfaces reflecting candlelight. Banners drape between them, crimson and gold. Then a streak of fire passes your face — a crimson projectile from behind the far columns. The first ranged enemy. You duck behind an onyx column and feel the wind pressing you east, toward the lava strip on the far wall. The columns block the wind as well as the projectiles. You fight from cover to cover, learning that geometry is your ally.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-onyx-column | (17,33), (20,33), (23,33), (26,33) row 1 | 1.2 | — | Structural, LOS + wind blockers |
| lust-onyx-column | (17,38), (20,38), (23,38), (26,38) row 2 | 1.2 | — | Structural, LOS + wind blockers |
| lust-ornate-arch | (22,32) north entrance | 1.0 | face-south | Entry from Wind Corridor |
| lust-ornate-arch | (22,41) south exit to Siren Pit | 1.0 | face-south | Main path continues |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-candelabra | (15,32), (28,32), (15,41), (28,41) corners | 1.0 | Corner lighting |
| lust-velvet-drape | (16,34), (27,34), (16,39), (27,39) walls | 1.0 | Fabric between columns, luxury |
| lust-fallen-chair | (18,36) and (25,37) floor | 0.9 | Knocked over — something happened here |
| lust-golden-chalice | (19,36) and (24,38) floor near chairs | 0.6 | Scattered, aftermath of violence |
| lust-marble-vase | (17,35) and (25,39) floor pedestals | 0.8 | Elegant decoration |
| lust-cracked-statue | (15,36) west wall alcove | 1.0 | Embracing goat-headed couple, cracked |
| lust-lava-rock-border | (28,32)-(28,41) east wall | 0.6 | Border the east lava strip |
| lust-rose-thorn-cluster | (16,40) near secret wall | 0.6 | Visual tell near Boudoir entrance |

**Lighting:** 4x candelabra at corners, color `#ffaa55`, intensity 0.7, radius 5 cells. East lava strip emits `#ff4400`, intensity 0.4, radius 3 cells. Steady W-to-E wind at 0.35 intensity pushes toward lava.
**Platforming:** Main floor at elevation 0. North wall has FLOOR_RAISED balcony (+1, 2 cells deep) where fireGoats start with height advantage. East lava strip at -0.5.

---

### Room: Siren Pit (12x12, platforming)

**Player Experience:** You look down and your stomach drops. A spiral ramp descends clockwise around a glowing lava core. The heat rises. The wind pulls inward and down — toward the center, toward the fire. Enemies fire from ledges cut into the outer wall at different heights. You descend carefully, each step a negotiation between forward progress and the constant inward tug. The chains hanging over the lava pit mark the danger zone. The chandelier far above lights the descent with mocking beauty.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-ornate-arch | (22,46) north entry ledge | 1.0 | face-south | Entry from Gallery |
| lust-bridge-railing | Ramp outer edge, spiral path | 0.8 | follow-ramp | Safety railing, partial — some sections missing |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-candelabra | (16,47) and (27,47) high on walls | 1.0 | Upper level lighting |
| lust-chandelier | (22,52) ceiling center over lava | 1.2 | Dramatic pit lighting from above |
| lust-lava-rock-border | (20,50)-(23,53) around lava core | 0.7 | Border the 4x4 lava pit |
| limbo-chain-cluster | (21,51), (23,51), (22,53) over lava | 1.0 | Vertical danger zone markers |
| lust-ember-brazier | (17,48) ramp segment 1 start | 0.7 | Warmth marker, ramp start |
| lust-cracked-statue | (26,50) east wall niche | 0.8 | Decorative in enemy ledge niche |

**Lighting:** 2x candelabra high on walls, color `#ffaa55`, intensity 0.6. 1x chandelier over center, color `#ffaa55`, intensity 0.8. Lava core emits `#ff4400`, intensity 0.6, radius 4 cells. Intensifies with descent.
**Platforming:** Entry ledge at elevation 0 (N, 2 cells deep). Ramp spirals: segment 1 E wall (0 to -0.5), segment 2 S wall (-0.5 to -1.0), segment 3 W wall (-1.0 to -1.5), segment 4 N inner (-1.5 to -2.0). Bottom landing at -2.0. 4x4 lava core at center. Wind pulls inward + down constantly at intensity 0.6.

---

### Room: Tempest Hall (14x12, arena)

**Player Experience:** Four lanes divided by three lava channels. Bridges cross the lava at different points. The wind blows west to east — then stops — then east to west. Every eight seconds it shifts. You are on a bridge when it changes and the sudden reversal nearly throws you into the lava. You learn to time your crossings. Enemies charge across bridges from both sides. The raised platforms at the east and west walls are refuge — the wind cannot push you off stone that high. You fight in the gaps between wind shifts.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-ornate-arch | (22,62) north entrance from ramp | 1.0 | face-south | Entry from Siren Pit ascent |
| lust-ornate-arch | (22,73) south grand doorway | 1.2 | face-south | Wide ceremonial exit to boss |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-candelabra | (15,62), (28,62), (15,73), (28,73) corners | 1.0 | Corner lighting |
| lust-wind-banner | (16,66) and (27,66) N/S walls | 1.0 | Flutter with wind direction changes |
| lust-lava-rock-border | Channel edges (19,62-73), (22,62-73), (25,62-73) | 0.6 | Border the 3 lava channels |
| lust-bridge-railing | Bridge edges at crossings | 0.7 | Low railings on bridge sides |
| lust-ember-brazier | (15,66) and (28,66) on raised platforms | 0.8 | Safe zone markers, warmth |
| ornate-mirror | (16,63) west platform alcove | 0.9 | Reflects lava light — disorienting |

**Lighting:** 4x candelabra at corners, color `#ffaa55`, intensity 0.7. 3x lava channels emit `#ff4400`, intensity 0.4, radius 3 cells each. Wind shifts W-to-E / E-to-W every 8 seconds.
**Platforming:** Main lanes at elevation -1. Lava channels at -1.5 (sunken, 1 cell wide each). Bridges at -1 (flush with lanes, 3 cells wide). East/West raised platforms at -0.5 (refuge). Third bridge (SW) at -1.5 — risky, wind can push you off.

---

### Room: Boudoir (6x6, secret)

**Player Experience:** You push through the hidden wall and the wind stops. Silence. Warmth. Candlelight from four wall-mounted candelabra and a chandelier overhead bathes a small chamber in golden light. A bed with crimson sheets. A table with a scroll. A chalice on a pedestal. This is the only comfortable room in all of Hell. No enemies. No wind. Just supplies and a moment of peace. You read the scroll: "The wind carries desire. Desire carried me to the edge. I could not let go."

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-ornate-arch | (8,36) east entry from Gallery | 0.8 | face-west | Frame the WALL_SECRET entry |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-candelabra | (3,34), (8,34), (3,39), (8,39) corners | 0.8 | Warm intimate lighting |
| lust-chandelier | (5,36) ceiling center | 0.9 | Overhead golden glow |
| lust-ornate-bed-wrecked | (4,36) floor | 1.0 | Luxurious bed — intact unlike the wrecked variant |
| lust-golden-chalice | (5,38) pedestal | 0.7 | Decadent decoration |
| lust-marble-vase | (3,36) and (7,36) flanking bed | 0.7 | Elegant vases |
| silk-curtain | (4,34) near north wall | 0.8 | Intimate drapery |
| lust-velvet-drape | (8,37) framing entry inside | 0.9 | Welcoming fabric |

**Lighting:** 4x candelabra at corners, color `#ffaa55`, intensity 0.8. 1x chandelier center, color `#ffaa55`, intensity 0.9. Warmest lighting in the entire circle. No fog. No wind.
**Platforming:** Flat at elevation 0. No hazards. Pure reward room.

---

### Room: Caprone's Sanctum (14x14, boss)

**Player Experience:** The grand doorway opens onto black marble veined with gold. Ahead, on a raised dais of polished stone, Caprone sits on a throne — immense, hermaphroditic, utterly still. Two chandeliers hang overhead. Four onyx columns mark the dais corners. Then Caprone speaks: "Come closer, little goat. Everyone comes closer eventually." The wind pulls you forward. You resist. The fight begins. When the throne shatters in phase 2, the debris scatters across black marble slick with heat. When the lava rises in phase 3, the safe ground shrinks and the wind spins faster. This is where desire devours itself.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| lust-ornate-arch | (22,78) north grand entrance | 1.3 | face-south | Ceremonial boss entry |
| lust-onyx-column | (18,82), (26,82), (18,86), (26,86) dais corners | 1.3 | — | Dais corner markers, minor cover |
| lust-marble-throne | (22,83) center of raised dais | 1.2 | face-south | Caprone's throne — shatters phase 2 |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| lust-candelabra | (15,78), (28,78), (15,91), (28,91) corners | 1.0 | Corner lighting |
| lust-chandelier | (20,82) and (24,82) ceiling flanking dais | 1.2 | Dramatic overhead throne lighting |
| lust-velvet-drape | (16,78) and (27,78) flanking entrance | 1.1 | Ceremonial entrance fabric |
| lust-lava-rock-border | (17,86), (21,86), (25,86) channel edges | 0.7 | Border the 3 lava channels south |
| lust-bridge-railing | (22,86) center channel bridge | 0.7 | Bridge railing — collapses phase 3 |
| lust-cracked-statue | (16,80) and (27,80) entrance alcoves | 1.0 | Flanking entrance, cracked embracing figures |
| lust-rose-thorn-cluster | (17,90) and (26,90) south corners | 0.8 | Thorns growing from lava-heated cracks |
| lust-perfume-censer | (19,79) and (25,79) near entrance | 0.7 | Incense — the scent of seduction |

**Lighting:** 4x candelabra at corners, color `#ffaa55`, intensity 0.7. 2x chandeliers over dais, color `#ffaa55`, intensity 0.9. Throne backlight `#ff8800`, intensity 0.5. Lava channels emit `#ff4400`, intensity 0.4 (increase in phase 3). Phase 2: wind rotates N-E-S-W every 10s. Phase 3: fog rises to 0.06, lava widens, wind period drops to 6s.
**Platforming:** Main floor at elevation -1. Throne dais at -0.5 (8x4 cells, north-center). Lava channels at -1.5 (widen in phase 3 from 1 to 3 cells each). Bridge over center channel at -1 (collapses phase 3). Four corner pillars at floor level provide minimal cover.
