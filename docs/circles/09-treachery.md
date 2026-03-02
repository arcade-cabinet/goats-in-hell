---
title: "Circle 9: Treachery"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 9
sin: betrayal
boss: Azazel
act: 3
build_script: scripts/build-circle-9.ts
mechanic: reflected-shots
related:
  - docs/circles/00-player-journey.md
  - docs/circles/playtest-act3.md
  - docs/agents/level-editor-api.md
---

# Circle 9: Treachery — Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Identity

**Circle:** 9 (Treachery — Cocytus)
**Sin:** Betrayal
**Boss:** Azazel — the fallen angel, the original scapegoat's destination (Dainir male base at most dignified — tall, antlered, calm. Not a monster. Presence.)
**Dominant Mechanic:** Reflected shots (missed projectiles bounce off walls back toward the player — flamethrower becomes essential since it cannot reflect)
**Dante Quote:** *"S'io avessi le rime aspre e chiocce, come si converrebbe al tristo buco sovra 'l qual pontan tutte l'altre rocce."* (If I had verses harsh and rough enough to fit the dismal hole upon which all the other rocks converge.)

**Feel:** The bottom of everything. Absolute zero. The fires of Violence and the warmth of Fraud are gone — replaced by ice so cold it burns. Your weapons betray you: every missed shot comes back. The flamethrower — the scapegoat's destiny weapon — is the only one that doesn't turn against you because fire cannot freeze and does not bounce. Blue goatKnights stand like frozen sentinels. The silence between fights is heavier than the fights themselves. This is where the scapegoat was always heading.

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Frozen stone, ice-crusted | Rock043 with Ice002 overlay | Ancient stone barely visible under ice |
| Floor — ice | Frozen lake surface, cracked | Ice001, Ice003 | Slippery, translucent, cracks visible |
| Floor — snow | Deep snow drifts | Snow003, Snow007 | Walkable but slow (0.7x speed) |
| Metal accents | Frost-covered iron | Metal037, Metal045 | Antenora fortress, chains, grating |
| Frozen stone | Glacial granite, blue-gray | Rock052, Rock027 | Structural pillars, stairs |
| Ceiling stalactites | Frozen drips, icicle formations | Ice004 over Rock052 | Hanging hazards in Giudecca |
| Boss chamber | Deep black ice, mirror-smooth | Ice002 (darkened variant) | The frozen lake at the bottom of Hell |
| Secret room | Frost over warm stone | Snow001 over Rock022 | Thin frost — warmth still beneath |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Glacial Stairs through Caina | 0.03 | `#0a0e1a` | Cold blue-black, clear enough to see far |
| Antenora corridors | 0.05 | `#080c16` | Denser in narrow fortress passages |
| Ptolomea | 0.04 | `#0a0e1a` | Low ceiling traps cold air |
| Giudecca arena | 0.02 | `#060a14` | Crystal clear — you see everything, including the void |
| Cocytus Bridge | 0.01 | `#040812` | Almost no fog — infinite void visible |
| Boss chamber | 0.02 | `#0a0e1a` | Clear — Azazel should be seen plainly |
| Boss phase 3 | 0.00 | — | No fog. Total clarity. The truth. |

### Lighting

- Ambient: `#2244aa` at intensity 0.10 (cold blue, dimmer than Limbo — the deepest cold)
- No point lights from torches — torches do not burn here. Light comes from the ice itself (faint blue bioluminescence, `#3366cc`, radius 6 cells, intensity 0.12)
- Caina/Giudecca: faint overhead light `#aabbdd` at intensity 0.05 simulating light through ice ceiling
- Cocytus Bridge: no light sources. Only the void glow from below (deep indigo `#110022`, intensity 0.03)
- Boss chamber: single overhead shaft of pale light `#ccddff` at intensity 0.15 on Azazel's position (spotlight). Rest of room lit by ice glow only.
- NO warm light anywhere in this circle. Everything is cold spectrum.

### Props (Meshy AI + General Library)

All props use bespoke Meshy AI-generated models or general library assets. See **## 3D Spatial Design** for per-room placement details and **### Prop Manifest Inventory** for the full asset list.

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Ice002 frost patches | All wall surfaces | Creeping frost, encroaching cold |
| Snow003 drift | Floor edges, corners, stair landings | Snow accumulation in still air |
| Concrete041 crack patterns | Ice floor surfaces (Giudecca, Boss) | Fracture lines in the frozen lake |

---

## Room Layout

### Overview (8 rooms)

```
                    ┌──────────────┐
                    │GLACIAL STAIRS│  (8×16, platforming, sortOrder=0)
                    │ Spawn ★      │  Steep icy descent. Sliding. Enemies on landings.
                    │ elev 0→-3    │
                    └──────┬───────┘
                           │ wide corridor (width=3)
                    ┌──────┴───────┐
                    │    CAINA     │  (16×14, exploration, sortOrder=1)
                    │ Frozen lake  │  Blue goatKnights break from ice.
                    │ elev -3      │  Ice pillars. Reflected shots.
                    └──┬───────────┘
                       │ corridor (width=3)
                    ┌──┴───────────┐
                    │   ANTENORA   │  (12×16, exploration, sortOrder=2)
                    │ Fortress     │  Narrow ice corridors. Reflections lethal.
                    │ elev -3      │  Flamethrower essential.
                    └──┬───────────┘
                       │ corridor (width=2)
                    ┌──┴───────────┐
                    │   PTOLOMEA   │  (14×10, exploration, sortOrder=3)
                    │ Frozen feast │  Low ceiling. Close quarters.
                    │ elev -4      │  Enemies thaw from table.
                    └──┬───────────┘
                       │ corridor (width=3)
                    ┌──┴───────────────┐
              ┌─────┤    GIUDECCA     │  (18×16, arena, sortOrder=4)
              │     │  Frozen chamber  │  3 waves. Waterfall cracks.
              │     │  elev -4 (void  │  Floor fragments over void.
              │     │  below at -6)   │
              │     └──┬──────────────┘
              │        │ corridor (width=2)
         ┌────┴────┐   │
         │ JUDAS   │   │
         │ TRAP    │   │  (6×6, secret, sortOrder=5)
         │ elev -4 │   │  WALL_SECRET from Giudecca W wall
         └─────────┘   │
                    ┌───┴──────────────┐
                    │  COCYTUS BRIDGE  │  (4×36, bridge, sortOrder=6)
                    │  elev -5         │  Narrow ice. Void below. No enemies.
                    │  The longest walk.│  Wind. Silence. Reflection.
                    └───┬──────────────┘
                        │ (bridge ends at door)
                    ┌───┴──────────────────┐
                    │  AZAZEL'S FROZEN     │  (20×20, boss, sortOrder=7)
                    │  THRONE              │  The largest boss room in the game.
                    │  elev -6 (deepest    │  Frozen lake. The bottom of Hell.
                    │  point in all 9      │
                    │  circles)            │
                    └──────────────────────┘
```

### Grid Dimensions

**60 wide × 154 deep** (120 × 308 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Glacial Stairs | 26 | 2 | 8 | 16 | platforming | 0 → -3 (descending) | 0 |
| Caina | 22 | 22 | 16 | 14 | exploration | -3 | 1 |
| Antenora | 24 | 40 | 12 | 16 | exploration | -3 | 2 |
| Ptolomea | 23 | 60 | 14 | 10 | exploration | -4 (step down) | 3 |
| Giudecca | 21 | 74 | 18 | 16 | arena | -4 (void at -6) | 4 |
| Judas Trap | 12 | 78 | 6 | 6 | secret | -4 | 5 |
| Cocytus Bridge | 28 | 94 | 4 | 36 | bridge | -5 | 6 |
| Azazel's Frozen Throne | 20 | 134 | 20 | 20 | boss | -6 (deepest) | 7 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Glacial Stairs | Caina | corridor | 3 | Base of stairs opens to frozen lake |
| Caina | Antenora | corridor | 3 | Lake edge to fortress entrance |
| Antenora | Ptolomea | corridor | 2 | Narrow fortress passage, step down |
| Ptolomea | Giudecca | corridor | 3 | Opens from feast hall to grand arena |
| Giudecca | Judas Trap | secret | 2 | WALL_SECRET on west wall |
| Giudecca | Cocytus Bridge | corridor | 2 | South exit to bridge |
| Cocytus Bridge | Azazel's Frozen Throne | door | 3 | Bridge terminates at massive door |

---

## Entities

### Enemies (20 total + boss)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Glacial Stairs | shadowGoat | 2 | Ambush from landing alcoves | Gray, frost-tinged |
| Glacial Stairs | fireGoat | 1 | Ranged from lower landing, fires upward | Dark variant, blue-white fire |
| Caina | goatKnight | 3 | Frozen in ice, break free on 4-cell proximity. Blue goatKnights have a unique attack: **Ice Charge** — a 2-second wind-up (frost particles gathering at hooves, audible ice-cracking sound), then a 5-cell linear charge that deals 15 damage and applies 2-second movement slow. The charge is telegraphed and dodgeable — the wind-up gives the player time to sidestep. The charge leaves an ice trail (cosmetic) on the ground. This differentiates Blue goatKnights mechanically, not just visually. | Blue, elite, armored |
| Caina | shadowGoat | 1 | Patrols behind ice pillars | Gray |
| Antenora | shadowGoat | 3 | Ambush from frozen alcoves in corridors | Gray |
| Antenora | fireGoat | 1 | Ranged from corridor intersection | Dark variant |
| Ptolomea | goatKnight | 2 | Frozen at banquet table, thaw on room entry | Blue, elite |
| Ptolomea | fireGoat | 1 | Frozen behind barrel, thaw after knights | Dark variant |
| Giudecca wave 1 | goatKnight | 2 | Spawn from frozen waterfall, march forward | Blue, elite |
| Giudecca wave 2 | shadowGoat | 2 | Spawn from floor cracks, flank | Gray |
| Giudecca wave 2 | fireGoat | 1 | Spawn on elevated ice chunk, ranged | Dark variant |
| Giudecca wave 3 | goatKnight | 1 | Final knight, center | Blue, elite |
| Giudecca wave 3 | shadowGoat | 1 | Flanker | Gray |
| Giudecca wave 3 | fireGoat | 1 | Ranged support | Dark variant |
| Cocytus Bridge | — | 0 | No enemies. Silence. | — |
| Boss chamber | Azazel | 1 | Boss AI, 3 phases | boss-azazel.glb |

### Reflected Shot Mechanics

The defining combat mechanic of Circle 9:
- **Projectile reflection:** Any projectile (pistol bullet, shotgun shell, cannon round, rocket) that strikes a wall bounces back along a reflected angle. Reflected projectiles deal 75% of original damage to the player if they connect.
- **Bounce limit:** 1 bounce per projectile (does not infinitely reflect).
- **Visual cue:** Reflected projectiles gain a blue-white trail (ice-tinged) to distinguish from player-fired shots.
- **Audio cue:** Distinct "zing" ricochet sound on wall impact.
- **Flamethrower immunity:** Flamethrower particles dissipate on wall contact — no reflection. Short range (3 cells) means they rarely reach walls. This makes the flamethrower the safest weapon.
- **Strategic implication:** In narrow corridors (Antenora), pistol/cannon shots bounce back and forth. The player must use flamethrower or position so reflected shots miss. In open rooms (Caina, Giudecca), reflected shots can be dodged more easily but still punish careless fire.
- **Enemy immunity:** Enemy projectiles do NOT reflect. Only the player's shots betray them.

### Pickups

| Room | Type | Position (grid) | Notes |
|------|------|-----------------|-------|
| Glacial Stairs (landing 2) | ammo | (29, 8) | On second landing, guarded by shadowGoat |
| Glacial Stairs (landing 4) | health | (28, 14) | On fourth landing, near bottom |
| Caina | ammo × 2 | (25, 26), (35, 32) | SW and NE of frozen lake |
| Caina | health | (30, 28) center | Center of lake, near ice pillars — risky (goatKnights nearby) |
| Antenora | ammo | (28, 46) | Mid-corridor, between alcoves |
| Antenora | health | (32, 52) | Near south exit, reward for surviving corridors |
| Ptolomea | ammo | (26, 64) | West side of banquet table |
| Ptolomea | health | (34, 62) | East side, behind frozen barrel |
| Giudecca | health | Near entrance (pre-lock) | Pre-arena buffer |
| Giudecca (between waves) | ammo × 2 | (24, 78), (36, 86) | NW and SE, resupply between waves |
| Giudecca (between waves) | health × 2 | (36, 78), (24, 86) | NE and SW, symmetric |
| Judas Trap | ammo × 2 | (14, 80), (16, 82) | Generous — reward for finding secret |
| Judas Trap | health × 2 | (13, 81), (17, 81) | Generous |
| Cocytus Bridge | — | — | No pickups. Nothing. |
| Boss chamber | ammo × 3 | (23, 138), (37, 138), (30, 150) | Triangle pattern — NW, NE, S |
| Boss chamber | health × 3 | (23, 150), (37, 150), (30, 138) | Inverse triangle — SW, SE, N |
| Glacial Stairs | fuel | Landing 3 | Early fuel |
| Caina | fuel | Near east pillar | Mid-room fuel |
| Antenora | fuel | Corridor midpoint | Corridor fuel |
| Giudecca | fuel x 2 | Between waves | Arena fuel resupply |
| Azazel's Frozen Throne | fuel x 2 | NE, SW quadrants | Boss arena fuel |

### Props (non-interactive, per room)

| Room | Props (count) | Key Assets |
|------|---------------|------------|
| Glacial Stairs | 13 props | treachery-ice-arch, treachery-frozen-stalactite x3, treachery-unlit-lantern x4, treachery-frozen-chain-cluster x2, treachery-snow-drift-mound x2, treachery-ice-crack-floor |
| Caina | 16 props | ice-pillar x6 (structural), treachery-ice-arch, treachery-betrayer-cage x3, treachery-frozen-sword x2, treachery-ice-crack-floor, treachery-snow-drift-mound x2, treachery-dark-ice-monolith |
| Antenora | 14 props | treachery-ice-arch x2, treachery-crystalline-spike-wall, treachery-frozen-banner x4, treachery-frozen-chain-cluster x2, treachery-snow-drift-mound x3, stalactite-cluster (general) x2 |
| Ptolomea | 11 props | treachery-ice-arch, treachery-frozen-feast-table, treachery-frost-chalice x2, treachery-snow-drift-mound, frozen-goat, broken-pot (general) x2, crystal (general) x2 |
| Giudecca | 22 props | treachery-frozen-waterfall, ice-pillar x6, treachery-frozen-stalactite x6, treachery-glacial-platform x4+, treachery-ice-crack-floor x4, treachery-frozen-chain-cluster x4 |
| Judas Trap | 6 props | treachery-betrayer-cage, frozen-goat, treachery-snow-drift-mound x2, treachery-ice-crack-floor, crystal (general) |
| Cocytus Bridge | 1 structural | treachery-ice-bridge-segment (repeating). No environmental props. |
| Azazel's Frozen Throne | 28 props | treachery-ice-formation, treachery-frozen-throne, treachery-dark-ice-monolith x4, treachery-frozen-chain-cluster x4, treachery-glacial-platform x12-15, treachery-ice-crack-floor, treachery-crystalline-spike-wall x4, treachery-frozen-stalactite x4 |
| **Total** | **~111 props** | **22 circle-specific + general library** |

---

## Room Details

### Room 1: Glacial Stairs (8×16)

```
     N
  ┌──────────────┐  elev 0
  │   ★ SPAWN    │
  │              │
  ├══════════════┤  landing 1 (elev -0.5)
  │  ~~ice~~     │  ← Slippery slope
  ├══════════════┤  landing 2 (elev -1)
  │ 👻sg  ♦ammo │  ← shadowGoat ambush + ammo
  ├══════════════┤  landing 3 (elev -1.5)
  │  ~~ice~~     │
  │      🔥fg    │  ← fireGoat fires upward from below
  ├══════════════┤  landing 4 (elev -2.5)
  │ 👻sg  ♦health│  ← shadowGoat + health
  ├══════════════┤  landing 5 (elev -3)
  │              │
  └──────┬───────┘
         ↓ corridor to Caina
```

- **Elevation:** Descends from 0 to -3 across 5 landings. Each landing is 2-3 cells deep, connected by icy ramps (RAMP cells, 4 cells long each).
- **Mechanic:** Ice floor on ramps = reduced friction. Player slides downward. Missing a landing means sliding to the next one (1-2 HP fall damage). Ramps are 4 cells wide (narrower than the 8-cell room width) — edges drop off to side alcoves where enemies hide.
- **3D elements:** treachery-frozen-stalactite hang from ceiling at landings 1/3/5 (1.5-2 cell height). treachery-unlit-lantern on alternating E/W walls mark each landing (4 positions, frost-covered, dead). treachery-frozen-chain-cluster frozen to ceiling at landings 2 and 4. treachery-ice-arch at top entrance. treachery-snow-drift-mound in landing alcove corners. treachery-ice-crack-floor on ramp surfaces. The vertical descent creates a strong sense of going deeper.
- **Combat:** 2 shadowGoats ambush from landing alcoves (side recesses, 2×2 cells). 1 fireGoat fires from landing 3 upward at the player descending — first encounter with the dark fireGoat variant (blue-white fire projectiles). Reflected shots are immediately relevant: shooting downward at the fireGoat means missed shots hit the landing floor/back wall and bounce back up.
- **Flow:** Ingress at top (spawn), egress at bottom to Caina.

### Room 2: Caina — Betrayers of Family (16×14)

```
               ↓ from Glacial Stairs
     N
  ┌────────────┴───────────────────────────┐
  │                                        │
  │    ╬pillar    ❄️gkB          ╬pillar   │  ← Blue goatKnights frozen in ice
  │                                        │
  │         🗡cage      ♦ammo             │  ← Sword frozen in pillar
  │                                        │
  │    ╬pillar     ♦health     ╬pillar    │  ← Center health (risky)
  │              (center lake)             │
  │    👻sg                               │  ← shadowGoat patrols behind pillars
  │                                        │
  │    ╬pillar    ❄️gkB    ♦ammo  ╬pillar │
  │                                        │
  │         🗡cage     ❄️gkB              │  ← Third goatKnight
  │                                        │
  └──┬─────────────────────────────────────┘
     ↓ corridor S to Antenora
```

- **Elevation:** -3 (flat frozen lake). Ice001 floor — slippery (0.8x friction). Ice pillars rise to full ceiling height.
- **Mechanic:** 3 Blue goatKnights stand frozen in the ice at intervals. They break free when the player enters 4-cell proximity — ice-shattering animation, 1-second stun, then they attack. The player can choose engagement order by controlling approach path. Ice pillars (6 total, 1×1 cell, full height) serve as cover but also as reflective surfaces — shots that hit pillars bounce. Strategic positioning: angle shots so reflected projectiles travel toward OTHER frozen goatKnights, pre-damaging them before they break free.
- **3D elements:** ice-pillar (6, arranged in 2 rows of 3, staggered, reflective surfaces). treachery-betrayer-cage (3 positions) embedded in ice floor (decorative, frozen betrayers below). treachery-frozen-sword (2 positions) frozen into pillar surfaces --- inaccessible, narrative. treachery-ice-arch at south corridor exit. treachery-ice-crack-floor across center lake area. treachery-snow-drift-mound in NW/SE corners. treachery-dark-ice-monolith as hero piece at center/north edge.
- **Combat:** HP 20 Blue goatKnights are devastating. Flamethrower is safest (no reflection risk, high DPS at close range). Using ranged weapons means managing bounce trajectories. shadowGoat (1) patrols behind pillars, flanking while player focuses on knights.
- **Flow:** Ingress from north (Glacial Stairs), egress south to Antenora.

### Room 3: Antenora — Betrayers of Country (12×16)

```
               ↓ from Caina
     N
  ┌────────────┴───────────────┐
  │    ╔══════════╗            │
  │    ║ corridor ║  🛡shield  │  ← Shield on E wall
  │    ║  👻sg    ║            │
  │    ╚════╦═════╝            │
  │         ║     🏳banner     │  ← Frozen banner on wall
  │    ╔════╩═════╗            │
  │    ║  ♦ammo   ║   👻sg    │  ← Ammo mid-corridor
  │    ║          ║            │
  │    ╚════╦═════╝            │
  │  🏳     ║     🔗chain     │  ← Chain frozen to ceiling
  │    ╔════╩═════╗            │
  │    ║   🔥fg   ║            │  ← fireGoat at intersection
  │    ║          ║   👻sg    │  ← shadowGoat in alcove
  │    ╚════╦═════╝            │
  │         ║     ♦health      │  ← Health near south exit
  │    ╔════╩═════╗            │
  │    ║          ║            │
  └────╨──────────┴────────────┘
       ↓ corridor to Ptolomea (step down -3→-4)
```

- **Elevation:** -3 (same as Caina). Metal037 walls with Ice002 frost overlay. Corridors are 3 cells wide, walls 1 cell thick.
- **Mechanic:** Narrow corridors make reflected shots LETHAL. A missed pistol/cannon shot travels down the corridor, hits the far wall, and bounces straight back along the corridor's length — directly at the player. The corridors are long enough (4-6 cells) that the reflected shot has significant travel time, but in the tight space, dodging is difficult. The flamethrower is ESSENTIAL here — its 3-cell range fills the corridor width without reaching the walls.
- **3D elements:** Corridors are 3 wide x 2.5 tall --- claustrophobic. treachery-frozen-banner (4 positions, N/S alternating walls, frozen stiff, offsetY: 2.0). treachery-ice-arch at north entrance and south exit. treachery-crystalline-spike-wall at corridor dead-end walls. treachery-frozen-chain-cluster frozen to ceiling at 2 corridor intersections. treachery-snow-drift-mound in 3 alcove recesses. stalactite-cluster (general, 2 positions) on corridor ceiling. The fortress feel is ice-encased military architecture.
- **Combat:** 3 shadowGoats hide in frozen alcoves (2×2 cell recesses in the corridor walls). They emerge when the player passes, attacking from behind. 1 fireGoat holds a corridor intersection, forcing the player to approach under fire. Corridor combat with reflected shots and ambush enemies from behind = maximum tension.
- **Flow:** Ingress from north (Caina), egress south to Ptolomea (elevation step down from -3 to -4, short staircase).

### Room 4: Ptolomea — Betrayers of Guests (14×10)

```
               ↓ from Antenora (step down to elev -4)
     N
  ┌────────────┴───────────────────────┐
  │                                    │
  │   🪑  🪑  🪑                      │  ← Chairs around table (frost-covered)
  │   ╔══════════════════╗             │
  │   ║  🍷 TABLE 🍷    ║ ♦ammo      │  ← treachery-frozen-feast-table with frozen feast
  │   ║  ❄️gkB  ❄️gkB   ║             │  ← 2 goatKnights frozen at table
  │   ╚══════════════════╝             │
  │   🪑  🪑  🪑      🔥fg           │  ← fireGoat behind barrel (E)
  │                    🛢barrel       │
  │                          ♦health  │
  └────────────┬───────────────────────┘
               ↓ corridor S to Giudecca
```

- **Elevation:** -4 (step down from Antenora). Low ceiling — 1.5 cells. Ice003 floor, Rock043 walls.
- **Mechanic:** The frozen feast. All enemies are frozen when the player enters — a moment of eerie stillness. Chairs knocked over, chalices mid-pour, frozen in time. The Blue goatKnights sit at the table. On entry trigger (T-zone at doorway), they thaw — ice cracking, standing, table pushed aside. The low ceiling means NO arcing shots — everything is flat trajectory, maximizing reflection danger. Close quarters with low ceiling = flamethrower dominance.
- **3D elements:** treachery-frozen-feast-table center (4x2 cells, 0.5 cell height). 6 chair (general) props around table (some knocked, some upright). treachery-frost-chalice x2 on table. broken-pot (general) x2 on table surface. treachery-ice-arch at north entrance (low-clearance). treachery-snow-drift-mound in SE corner. frozen-goat under table, partially visible (previous scapegoat). crystal (general) x2 near walls (ice crystal formations). Ceiling at 1.5 cells --- player cannot jump. Frost drips from ceiling.
- **Combat:** 2 Blue goatKnights (thaw simultaneously, 1-second stun, then attack). 1 fireGoat thaws 3 seconds after knights (delayed, attacks from range behind barrel while player engages knights). In the low-ceiling, close-quarters space, the reflected shot mechanic is at its most dangerous — every wall is close, every miss comes back fast.
- **Flow:** Ingress from north (Antenora), egress south to Giudecca.

### Room 5: Giudecca — Betrayers of Lords (18×16)

```
               ↓ from Ptolomea
     N
  ┌────────────┴───────────────────────────────┐
  │                                            │
  │ ♦ammo                          ♦health    │  ← NW and NE resupply
  │                                            │
  │         ╬ice    ╬ice    ╬ice              │  ← Ice pillars (structural)
  │                                            │
  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓           │
  │    ▓ FROZEN WATERFALL (back wall) ▓       │  ← 8-cell wide frozen waterfall
  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓           │
  │                                            │
  │    ████ void ████  ████ void ████         │  ← Floor sections that crack and fall
  │                                            │
  │ ♦health        ARENA         ♦ammo        │  ← SW and SE resupply
  │                FLOOR                       │
  │    ████ void ████  ████ void ████         │  ← More fragmenting floor
  │                                            │
  │         ╬ice    ╬ice    ╬ice              │
  │                                            │
  └──┬──────────────────────┬──────────────────┘
     │                      ↓ corridor S to Cocytus Bridge
     → WALL_SECRET W
     → to Judas Trap
```

- **Elevation:** -4 (floor). Void at -6 (2 cells below floor). Ice001 floor, Ice004 ceiling stalactites.
- **Pre-arena buffer:** A health pickup sits at the arena entrance, before the doors lock. This gives the player a buffer before the three waves begin — the player may be entering at sub-50 HP from Ptolomea.
- **Mechanic:** THE arena of Circle 9. Three waves with escalating threat composition. The environment deteriorates during the fight: the frozen waterfall cracks and drops ice chunks (area hazards, 10 damage, 2×2 cell impact zone), and floor sections crack and fall into the void below (FLOOR_VOID reveals, reducing traversable area). By wave 3, the arena is a fragmented field of ice platforms over nothingness.
- **Arena sequence:**
  - Trigger on entry: doors lock
  - Wave 1: 2 Blue goatKnights march from the frozen waterfall (north). Methodical, tanky.
  - Waterfall begins cracking. Ice chunks fall (2 chunks, random positions, every 8 seconds).
  - Wave 1 clear: resupply spawns. 15-second break.
  - Wave 2: 2 shadowGoats spawn from floor cracks (center), 1 fireGoat spawns on elevated ice chunk (+1 cell, created from waterfall debris). Mixed tactics.
  - Floor begins cracking. 4 floor sections (3×3 cells each) break and fall over 20 seconds.
  - Wave 2 clear: resupply refreshes. 10-second break.
  - Wave 3: 1 goatKnight + 1 shadowGoat + 1 fireGoat simultaneously. All types at once. Maximum reflected shot chaos.
  - Remaining floor continues fragmenting. Final fight on shrinking ice platforms.
  - Wave 3 clear: doors unlock. Waterfall stops cracking.
- **3D elements:** treachery-frozen-waterfall (structural hero piece, south wall, 8 cells wide, full height --- animated ice flow texture). ice-pillar (6 total, 2 rows of 3, cover + reflection). treachery-frozen-stalactite (6 ceiling positions, fall as hazards during waves). treachery-glacial-platform (4+ positions forming as floor collapses). treachery-ice-crack-floor (4 positions at future collapse points, visual warning). treachery-frozen-chain-cluster (4 ceiling positions over void sections, quadrant markers). treachery-dark-ice-monolith (2, flanking entrance). treachery-snow-drift-mound (2, south corners near waterfall base). Void below is visible through cracks --- deep indigo glow.
- **Flow:** Ingress from north (Ptolomea). Egress south to Cocytus Bridge. Secret west exit (WALL_SECRET) to Judas Trap.

### Room 6: Judas Trap — Secret Room (6×6)

```
     ← WALL_SECRET from Giudecca (E wall)
     E
  ┌──┴─────────────┐
  │                 │
  │ ♦health ♦health│  ← Generous health
  │                 │
  │ 📖book  🔗cage │  ← Frozen codex + caged figure
  │                 │
  │ ♦ammo   ♦ammo  │  ← Generous ammo
  │                 │
  │   💰  💰       │  ← Frost-covered coins (worthless)
  │                 │
  └─────────────────┘
     (dead end — return through secret wall)
```

- **Elevation:** -4 (same as Giudecca). Snow001 floor over Rock022 walls — thin frost over warmer stone. The warmth hasn't quite died here.
- **Mechanic:** Ironic betrayal theme. The frost-covered codex on the floor lists names --- "The traitors who built this place, and the traitor who reads this." The treachery-betrayer-cage contains a frozen-goat --- a previous scapegoat who made it this far and was trapped. The generous pickups are genuine --- the game does not betray the player who finds this room. But the narrative does: *you are not the first.*
- **3D elements:** Low-ceilinged (1.5 cells). treachery-snow-drift-mound (2 positions, corners). treachery-ice-crack-floor around cage --- the cage has been here a long time. crystal (general) near cage (ice crystal growth). treachery-betrayer-cage at floor level, ice encrusting the bars. frozen-goat inside cage.
- **Flow:** Ingress/egress via WALL_SECRET on east wall (back to Giudecca).

### Room 7: Cocytus Bridge (4×36)

```
               ↓ from Giudecca
     N
  ┌────┴────┐
  │         │
  │ ~~ice~~ │  ← Narrow ice bridge, 4 cells wide
  │         │
  │    .    │  ← Nothing. No props. No enemies.
  │    .    │
  │    .    │
  │ V O I D │  ← Void on both sides (FLOOR_VOID)
  │ on both │
  │  sides  │
  │    .    │
  │    .    │
  │    .    │  ← The longest walk without combat in the game
  │    .    │
  │    .    │     36 cells long = 72 world units
  │    .    │
  │    .    │
  │    .    │
  │    .    │
  │    .    │
  │    .    │
  │    .    │
  │    .    │
  │    .    │
  └────┬────┘
       ↓ door to Azazel's Frozen Throne
```

- **Elevation:** -5 (lower than Giudecca). Ice003 floor, 4 cells wide, 36 cells long (72 world units, ~18-20 seconds walk time). FLOOR_VOID on both sides — infinite void. No railings.
- **Mechanic:** NO enemies. NO pickups. NO props. Just the bridge, the void, and the wind. The ambient wind sound is the loudest in the game here. The bridge is slightly slippery (0.85x friction) — not enough to be a platforming challenge, just enough to feel precarious. The player walks for ~18-20 seconds in total silence (except wind) after the intensity of Giudecca. This is the game's breathing moment before the final boss. The player has time to think about everything they've done.
- **Environmental storytelling:** The bridge surface has faint inscriptions carved into the ice, readable if the player looks down while walking:
  - At 1/4: *"The first goat fell here 3,000 years ago."*
  - At 1/2: *"We carried what was not ours."*
  - At 3/4: *"The wilderness has no end."*
  Frozen silhouettes are visible in the ice below the bridge — previous scapegoats who fell. They are faint, ghostly, embedded in the void-ice. The player cannot interact with them. They are a mood.
- **3D elements:** The bridge is 4 cells wide — enough that you won't accidentally fall, narrow enough that you see the void on both sides. The void below has a faint deep indigo glow (`#110022`). No ceiling — open to darkness above. Wind particles (snow drift) blow across horizontally. The far end of the bridge is barely visible when you start — the door to Azazel's chamber materializes from the darkness as you approach.
- **Audio:** Ambient wind (0.8 intensity). No music. Heartbeat SFX at low volume. Player footsteps echo on ice.
- **Flow:** Ingress from north (Giudecca), egress south to Azazel's Frozen Throne. One-way feeling — the bridge behind you disappears into darkness.

### Room 8: Azazel's Frozen Throne — Boss Chamber (20×20)

```
               ↓ from Cocytus Bridge
     N
  ┌────────────┴───────────────────────────────────────┐
  │                                                    │
  │ ♦ammo                              ♦health        │  ← NW, NE
  │                                                    │
  │         🔗chain              🔗chain              │  ← Massive chains from ceiling
  │                                                    │
  │              ████ ice ████                         │
  │              ██         ██                         │
  │              ██ ❄️AZAZEL██                         │  ← Frozen waist-down, center
  │              ██  (calm) ██                         │
  │              ████ ice ████                         │
  │                                                    │
  │    ░░ cracking ░░      ░░ cracking ░░             │  ← Floor fracture lines
  │                                                    │
  │         🔗chain              🔗chain              │
  │                                                    │
  │ ♦health          ♦ammo              ♦ammo         │  ← SW, S, SE
  │                  (center S)                        │
  │                                                    │
  │ ♦health                                           │
  │                                                    │
  └────────────────────────────────────────────────────┘
     (no exit until boss defeated — or the player chooses)
```

- **Elevation:** -6 (the deepest point in all 9 circles). The absolute bottom of Hell. Ice002 (darkened) floor — mirror-smooth black ice. No walls in the traditional sense — the room's perimeter is a ring of ice rising from the frozen lake, fading into darkness above.
- **Dimensions:** 20×20 cells (40×40 world units) — the largest boss room in the game. Azazel's ice formation is center, 4×4 cells.

- **Boss Fight — Azazel:**

  **Intro:** Azazel stands frozen from the waist down in the center of the frozen lake. He is the Dainir male base at maximum dignity — tall, antlered, composed. He does not look like a monster. He looks like a king. A single shaft of pale light from above illuminates him. He speaks: *"You came."* Pause. *"I have been waiting since the first goat was cast out."*

  **Phase 1 — Sins Reflected (100%–50% HP):**
  Azazel does not attack with weapons. Instead, he REFLECTS the player's attacks. Every projectile the player fires at Azazel bounces back AMPLIFIED (1.5x damage, faster return speed). Azazel is IMMUNE to direct attacks. The flamethrower is exempt from Azazel's reflection — it deals 0 direct damage but melts ice sections. All OTHER weapons reflect at 1.5x damage. This maintains the flamethrower's established identity as the "honest weapon" in the Circle of Treachery while teaching the ice mechanic naturally.

  The only way to damage him: SHOOT THE ICE. The ice formation holding him (4×4 cell center) has destructible sections. Shooting the ice (not Azazel) deals environmental damage — ice cracks, he sinks deeper, takes damage from the breaking ice itself. Each ice section destroyed (8 sections total) deals 12.5% of phase 1 HP.

  Phase 1 has four layered teaching mechanisms for the "shoot the ice, not the boss" mechanic:

  1. **Visual weak points:** The 8 ice sections surrounding Azazel have warm orange cracks/veins running through them — visually distinct from the cold blue ambient. These glow like embers, drawing the eye.

  2. **Reflected shots hit ice incidentally:** When the player shoots Azazel and the shot reflects, the reflected projectile has a chance to strike the ice formation behind/beside the player. If it hits ice, the ice cracks visibly with a satisfying shatter sound. This creates the mental connection: "things that hit the ice damage the ice."

  3. **Flamethrower melts ice directly:** The flamethrower does NOT reflect off Azazel in Phase 1 (it is the one weapon exempted, maintaining its Circle 9 identity as the "safe weapon"). Instead, it deals 0 damage to Azazel but MELTS ice when aimed at the ice formation. Visible steam, dripping water, cracking. This is the most natural teach — the player tries the flamethrower (their go-to safe weapon), sees it melt ice, and understands.

  4. **Azazel taunts after 15 seconds:** If no ice section has been destroyed after 15 seconds, Azazel speaks: *"You cannot hurt me, little goat. But the chains that bind me..."* — he glances at the ice. A camera nudge (slight auto-look) toward the nearest ice weak point.

  As ice breaks, the floor beyond the center formation begins to fragment. Fracture lines appear 4 seconds before sections collapse into void. The arena slowly transforms from a solid 20×20 floor to a ring of ice platforms around the central formation. Platforming begins — the player must find stable ice to stand on while shooting the ice formation from different angles.

  Ice pillar fragments (from the broken formation) create temporary cover — 1×1 cell, 1 cell tall, persists for 15 seconds before shattering.

  **Phase 2 — Azazel Breaks Free (50%–10% HP):**
  The central ice formation shatters completely. Azazel rises to full height — immense. The ice shatters into 12-15 platforms of 3x3 to 4x4 cells each. Platform gaps are 1 cell wide maximum — the player can walk/run across them without jumping. No precision platforming. The challenge is spatial awareness (tracking Azazel's position, dodging attacks, avoiding shockwave pushback) NOT jump accuracy. Platform heights vary by 0.5 elevation units — small steps, not leaps.

  Azazel's attacks:
  - **Antler sweep:** Wide 180-degree melee attack (6 damage), 3-cell range. Telegraphed by 1-second wind-up (head lowers, antlers glow blue).
  - **Ground stamp:** Jumps and stamps an ice platform, cracking it (platform collapses in 3 seconds). 4-cell AoE, 10 damage. Creates shockwave that pushes player toward platform edges.
  - **Ice breath:** Cone attack, 5 cells range, 45-degree width, 8 damage + 2-second slow (0.5x speed). Telegraphed by frost particles gathering at mouth.

  The flamethrower remains the only weapon that doesn't reflect off Azazel — it deals 0 direct damage but is exempt from reflection, maintaining its established identity as the "honest weapon" in the Circle of Treachery. Fire is the scapegoat's gift, the one thing Hell gave it. Ranged weapons can be used but reflected shots in the fragmented arena are extremely dangerous — they bounce off ice platforms and return from unpredictable angles.

  Azazel moves between platforms by jumping (he's large enough to span 3-cell gaps). He does not fall. When a platform he's standing on is too small, he jumps to the largest remaining one. The player must lure him onto smaller platforms, then break them with ground stamps to reduce his mobility.

  **Phase 3 — The Revelation (10%–0% HP):**
  When Azazel reaches 10% HP:
  1. All player projectiles pass through Azazel and dissipate harmlessly. No reflection. No damage in either direction. The fight is mechanically OVER.
  2. The screen slowly dims to 60% brightness. Music cuts to silence. A heartbeat sound.
  3. Camera smoothly locks on Azazel over 2 seconds (cinematic control). The player loses movement input.
  4. Azazel speaks. Text appears center-screen, large font, slow character reveal:

  *"You were sent to me. The scapegoat, bearing the sins of others, cast into the wilderness toward Azazel. That is the ritual. You have completed it perfectly."*

  *"Every goat you killed, every circle you descended — you carried their sin deeper and deeper, and delivered it to me. I am the garbage dump of sin. You are the delivery mechanism."*

  *"The irony: by fighting through Hell, you fulfilled the scripture."*

  5. After the speech completes (approximately 15 seconds), a 3-second pause. Then camera control returns. Azazel sits. He cannot be interacted with.
  6. The ending sequence triggers based on the kill metric.
  7. **There is NO skip option.** This is the game's thesis statement. It plays once, in full.

  He does not die. He sits. The fog clears to 0.00. The void below glows faintly. Silence.

  **Post-fight:** The game evaluates the hidden kill metric:
  - **Skipped > 30% of optional enemies across all 9 circles → Ascent Ending:** Camera pulls upward through all 9 circles in reverse. Title card: *"The scapegoat returns to the wilderness."*
  - **Skipped < 30% → Remain Ending:** Camera holds on the goat sitting beside Azazel. Title card: *"Sin finds its level."*

  **Kill metric evaluation:** The binary ending evaluates the player's total optional kills across all 9 circles. "Optional" enemies are defined as: enemies in side rooms (Bone Pit, Boudoir, Reliquary, etc.), enemies that can be run past (corridor enemies with clear alternative paths), and ambush enemies in optional areas. Enemies in locked arenas, boss rooms, and Circle 7 bleeding-mandatory encounters are NOT counted as optional. The threshold (>30% optional enemies skipped) is achievable on a focused pacifist-leaning playthrough but requires conscious restraint.

- **3D elements:** treachery-ice-formation (central hero piece, 4x4 cells, 3 cells tall, 8 destructible sections with orange crack weak points). treachery-frozen-throne within ice formation (revealed phase 2). treachery-dark-ice-monolith x4 at arena quadrant markers (tallest vertical elements). treachery-crystalline-spike-wall x4 at perimeter ring (N/E/S/W edges, room boundary IS jagged ice). treachery-frozen-chain-cluster x4 hanging from ceiling at arena quadrant boundaries (massive, frozen). treachery-glacial-platform x12-15 floor fragment platforms (phase 2). treachery-ice-crack-floor around central formation (fracture lines, 4-cell ring). treachery-frozen-stalactite x4 on ceiling between chains. treachery-frozen-banner x2 near entrance. treachery-snow-drift-mound at entrance area. treachery-frozen-waterfall on west wall (smaller echo of Giudecca). Overhead light shaft (spotlight, `#ccddff`, narrow cone illuminating center). Void below with deep indigo glow. No walls visible --- room edges fade to darkness. The sense of infinite frozen space. 28+ props total --- the most visually dramatic space in all 9 circles.

- **Flow:** Ingress from north (Cocytus Bridge). No exit until Phase 3 completes. On completion: ending sequence triggers.

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Glacial Stairs | (27, 6, 6, 3) | `spawnAmbush` | `once: true` | `{ enemies: [{type:'shadowGoat', count:1, position:'landing2_alcove'}] }` |
| T2 | Glacial Stairs | (27, 12, 6, 3) | `spawnAmbush` | `once: true` | `{ enemies: [{type:'shadowGoat', count:1, position:'landing4_alcove'}] }` |
| T3 | Caina | (23, 23, 14, 12) | `thawEnemies` | `proximity: 4, repeating: true` | `{ enemyType: 'goatKnight', thawRadius: 4 }` |
| T4 | Antenora | (25, 42, 10, 4) | `spawnAmbush` | `once: true` | `{ enemies: [{type:'shadowGoat', count:1}] }` |
| T5 | Antenora | (25, 48, 10, 4) | `spawnAmbush` | `once: true` | `{ enemies: [{type:'shadowGoat', count:1}] }` |
| T6 | Antenora | (25, 52, 10, 4) | `spawnAmbush` | `once: true` | `{ enemies: [{type:'shadowGoat', count:1}] }` |
| T7 | Ptolomea | (24, 61, 12, 2) | `thawEnemies` | `once: true` | `{ enemies: [{type:'goatKnight', count:2, delay:0}, {type:'fireGoat', count:1, delay:3}] }` |
| T8 | Giudecca | (23, 76, 14, 4) | `lockDoors` | `once: true` | — |
| T9 | Giudecca | (23, 76, 14, 4) | `spawnWave` | `once: true` | `{ enemies: [{type:'goatKnight', count:2, spawn:'waterfall'}] }` |
| T10 | Giudecca | — | `environmentHazard` | On wave 1 start, `delay: 5` | `{ type: 'falling_ice', interval: 8, damage: 10, aoe: 2 }` |
| T11 | Giudecca | — | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'shadowGoat', count:2, spawn:'floor_crack'}, {type:'fireGoat', count:1, spawn:'elevated'}] }` |
| T12 | Giudecca | — | `floorCollapse` | On wave 2 start, `delay: 5` | `{ sections: 4, sectionSize: 3, collapseInterval: 5 }` |
| T13 | Giudecca | — | `spawnWave` | On wave 2 clear | `{ enemies: [{type:'goatKnight', count:1}, {type:'shadowGoat', count:1}, {type:'fireGoat', count:1}] }` |
| T14 | Giudecca | — | `floorCollapse` | On wave 3 start | `{ sections: 2, sectionSize: 2, collapseInterval: 8 }` |
| T15 | Giudecca | — | `unlockDoors` | On wave 3 clear | — |
| T16 | Boss chamber | (27, 136, 6, 2) | `bossIntro` | `once: true` | `{ text: "You came.", speaker: "Azazel", delay: 2, followUp: "I have been waiting since the first goat was cast out." }` |
| T17 | Boss chamber | (27, 136, 6, 2) | `lockDoors` | `once: true, delay: 5` | — |
| T18 | Boss chamber | — | `bossPhaseChange` | Boss HP < 50% | `{ phase: 2, action: 'shatterIce' }` |
| T19 | Boss chamber | — | `floorFragment` | On phase 2 start | `{ platforms: 15, minSize: 3, maxSize: 4, gapSize: 1, voidElevation: -8 }` |
| T20 | Boss chamber | — | `bossPhaseChange` | Boss HP < 10% | `{ phase: 3, action: 'revelation' }` |
| T21 | Boss chamber | — | `ambientChange` | Boss HP < 10% | `{ fogDensity: 0.00, music: 'silence', sfx: 'wind_low' }` |
| T22 | Boss chamber | — | `endingEvaluate` | On phase 3 speech complete | `{ metric: 'optionalKillPercentage', threshold: 0.30 }` |

---

## Environment Zones

| Zone | Type | Bounds | Intensity | Notes |
|------|------|--------|-----------|-------|
| Global freeze | `fog` | Full level (0,0,60,154) | 0.3 | Cold blue-black baseline |
| Ice floor friction | `friction` | All rooms except Bridge | 0.8 | Reduced traction on ice |
| Bridge friction | `friction` | Cocytus Bridge (28,94,4,36) | 0.85 | Slightly less slippery than rooms |
| Stair slide | `friction` | Glacial Stairs ramps only | 0.6 | Very slippery on descent ramps |
| Corridor reflection | `reflection` | Antenora corridors (25,41,10,14) | 1.0 | Maximum projectile reflection danger |
| Wind (bridge) | `wind` | Cocytus Bridge (28,94,4,36) | 0.6 | Crosswind, snow particle drift |
| Wind (boss) | `wind` | Boss chamber (20,134,20,20) | 0.2 | Gentle updraft from void below |
| Void glow | `ambient_light` | Below all rooms at elev < -4 | 0.03 | Deep indigo `#110022` glow from abyss |
| Boss spotlight | `spotlight` | Boss chamber center (28,144,4,4) | 0.15 | Pale shaft `#ccddff` on Azazel |

---

## Player Spawn

- **Position:** (30, 3) — top of Glacial Stairs
- **Facing:** pi (south — facing down the descent into the frozen depths)

---

## Theme Configuration

```typescript
editor.createTheme('circle-9-treachery', {
  name: 'treachery',
  displayName: 'TREACHERY — The Circle of Betrayal',
  primaryWall: MapCell.WALL_OBSIDIAN,    // Dark ice-covered stone
  accentWalls: [MapCell.WALL_STONE],     // Frost-covered granite accents
  fogDensity: 0.03,
  fogColor: '#0a0e1a',
  ambientColor: '#2244aa',
  ambientIntensity: 0.10,
  skyColor: '#000005',                   // Near-black — the deepest point
  particleEffect: 'snow_drift',          // Horizontal snow particles, slow
  enemyTypes: ['goatKnight', 'shadowGoat', 'fireGoat'],
  enemyDensity: 1.2,                     // High — the finale
  pickupDensity: 0.8,                    // Moderate — enough to survive, not to hoard
  reflectedShots: {
    enabled: true,
    bounceLimit: 1,
    damageMultiplier: 0.75,
    exemptWeapons: ['flamethrower'],
    visualTrail: '#aaccff',              // Blue-white reflected projectile trail
    ricochetSfx: 'ricochet_ice',
  },
  iceFriction: 0.8,                      // Global ice friction multiplier
  bossConfig: {
    phase1IceSections: 8,
    phase2PlatformCount: 15,
    phase3Invulnerable: true,
    endingMetric: 'optionalKillPercentage',
    endingThreshold: 0.30,
  },
});
```

---

## Narrative Beats

1. **Glacial Stairs descent:** The temperature drops. The player's breath is visible (frost particle effect near camera). Unlit lanterns line the walls — nothing burns this deep. The descent is steep and slippery. The game says: you are going where no warmth survives.
2. **Caina — frozen knights:** Blue goatKnights stand motionless in the ice. As you approach, the ice cracks and they break free. They were betrayers of family — frozen mid-stride, mid-plea, mid-lie. treachery-betrayer-cage props in the floor hold smaller frozen figures. treachery-frozen-sword frozen into pillars — weapons of betrayal, forever inaccessible.
3. **Antenora — the fortress:** Frozen banners of nations that betrayed their own. Shields on walls that protected no one. The corridors echo with the player's own reflected shots — your violence returns to you. In a circle of betrayal, even your weapons betray you.
4. **Ptolomea — the frozen feast:** A banquet table set for guests who will never eat. treachery-frost-chalice raised in toasts that will never be drunk. The enemies were guests at this table — or hosts who poisoned it. They thaw and attack. The hospitality was always a lie.
5. **Giudecca — the arena:** The greatest traitors. The frozen waterfall cracks. The floor cracks. Everything is breaking — the final structure of Hell itself cannot hold. Three waves of everything the game has thrown at the player. The culmination of combat.
6. **Judas Trap discovery:** A frozen codex lists names. A frozen goat in a cage — a previous scapegoat. *"You are not the first."* The pickups are generous. The game does not betray you here. But the knowledge does.
7. **Cocytus Bridge — the walk:** No enemies. No pickups. No props. Just ice, void, and wind. The longest non-combat sequence in the game. The player walks and thinks. About every goat they killed. About every circle they descended. About what waits at the other end. The wind sounds like breathing.
8. **Azazel speaks:** *"You came."* Two words. No hostility. No fear. Just acknowledgment. He has been waiting. Not for this goat specifically — for any scapegoat. For THE scapegoat. The ritual demands it.
9. **Phase 1 — the reflection:** You cannot hurt Azazel directly. Everything you throw at him comes back. The only way to damage him is to destroy the ice around him — environmental, indirect. The lesson: direct confrontation with the final truth is futile. You must change the ground he stands on.
10. **Phase 2 — the broken ice:** Azazel is free. The floor is shattered. You fight on fragments over the abyss. The flamethrower — fire, the scapegoat's one true gift — is the only weapon that works honestly here. Everything else betrays you. Fire does not lie.
11. **Phase 3 — the revelation:** Azazel stops. He tells you what you are. A delivery mechanism. Every sin you carried through 9 circles, you delivered to him. You fulfilled the ritual perfectly. The irony is complete. He sits. The fight is over. Not because he died — because the truth was spoken.
12. **The ending:** The game watches. Were you violent because you had to be, or because you wanted to be? The answer determines whether you ascend or remain.

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter — renders in LevelMeshes.tsx
2. All 8 rooms are reachable from spawn (DAG validation passes, including secret room via WALL_SECRET)
3. Reflected shots mechanic works (projectile bounce off walls, 75% damage to player, blue-white trail, ricochet SFX)
4. Flamethrower correctly exempted from reflection (particles dissipate on wall contact)
5. Ice friction affects player movement (0.8x on ice floors, 0.6x on stair ramps)
6. Blue goatKnight thaw mechanic works (frozen state, proximity trigger, ice-shatter animation, 1-second stun)
7. Giudecca arena floor collapse works (sections crack with visible warning, fall to void, reduce traversable area)
8. Boss phase 1: attacks reflected back at player, ice formation destructible in 8 sections
9. Boss phase 2: floor fragments into 12-15 floating platforms, Azazel melee AI works (sweep, stamp, breath)
10. Boss phase 3: Azazel becomes invulnerable at 10% HP, speech triggers, ending evaluation runs
11. Cocytus Bridge renders correctly — 4-cell wide ice over void, no enemies, wind particles, no props
12. Ending metric evaluates optional kill percentage across all 9 circles, triggers correct ending
13. PlaytestRunner AI can navigate from spawn to boss and complete all 3 phases
14. PBR materials from AmbientCG render on walls/floors (Ice, Snow, Rock, Metal)
15. At least 4 Meshy props visible as GLB instances in scene (treachery-frozen-throne, treachery-ice-pillar, treachery-frozen-traitor, treachery-ice-cage)
16. Azazel's Frozen Throne is the largest boss room in the game (20×20 cells = 40×40 world units)
17. This circle feels like the FINALE — desolate, epic, and emotionally resonant

---

## What This Is NOT

- NOT a fire circle. Despite the presence of the flamethrower, Circle 9 is ICE. The flamethrower works here because fire is the scapegoat's true gift — it's thematically correct, not environmentally matched. Fire in ice is the point.
- NOT a reuse of Circle 8's reflection mechanic. Circle 8 uses visual reflections for enemy deception (mirror images). Circle 9 uses projectile reflection as a combat hazard (your shots bounce back). Different systems, thematic continuity.
- NOT a difficulty spike through enemy spam. Circle 9 has 20 enemies total (fewer than Circle 7's 22). The difficulty comes from the reflected shots mechanic, the ice friction, the elite Blue goatKnights, and the environmental hazards. Quality over quantity.
- NOT a hopeless ending. Both endings are valid. The Ascent ending rewards restraint — the player who found ways around violence. The Remain ending acknowledges the player who embraced it. Neither is "wrong." The game does not judge. It observes.
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored: descent (Stairs) → exploration (Caina, Antenora, Ptolomea) → arena (Giudecca) → contemplation (Bridge) → boss (Azazel). The Bridge is the key structural innovation — the deliberate absence of gameplay before the climax.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models (circle-specific) or general library Meshy props + AmbientCG PBR textures.

---

## 3D Spatial Design

### Room: Glacial Stairs (8x16, platforming, sortOrder=0)

**Player Experience:** The temperature drops. Your breath is visible. Unlit lanterns line the walls --- nothing burns this deep. The descent is steep and slippery. Five landings connected by icy ramps. You slide downward, missing a landing means fall damage. Enemies ambush from side alcoves. A fireGoat below fires upward with blue-white flames. Your reflected shots bounce off the landing floor and come back up. You are going where no warmth survives.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| treachery-ice-arch | top entrance (spawn) | 1.0 | face-south | Frozen archway at stair entrance |
| treachery-frozen-stalactite | ceiling, landings 1/3/5 | 1.0 | hanging | Ice stalactite clusters (1.5-2 cell height) |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-unlit-lantern | 4 positions, E/W alternating walls | 0.8 | Frost-covered dead lanterns marking each landing |
| treachery-frozen-chain-cluster | ceiling, landings 2/4 | 0.8 | Frozen chains hanging from ceiling |
| treachery-snow-drift-mound | landing alcove corners | 0.6 | Snow accumulation in still air recesses |
| treachery-ice-crack-floor | ramp surfaces | 0.8 | Ice crack patterns on slippery ramp sections |

**Lighting:** No warm light. Faint blue bioluminescence from ice (`#3366cc`, radius 6 cells, intensity 0.12). Faint overhead `#aabbdd` at intensity 0.05. Unlit lanterns provide NO light.
**Platforming:** Descends from elevation 0 to -3 across 5 landings. Icy ramps (4 cells long, 0.6x friction). Ramps are 4 cells wide (narrower than 8-cell room) --- edges drop to 2x2 side alcoves where enemies hide.

> **Playtest note:** Glacial Stairs had 6 props in 128 cells. Now 13 props: unlit-lantern (circle-specific dead lanterns), frozen-stalactite ceiling clusters at landings 1/3/5, frozen-chain-cluster at landings 2/4, snow-drift-mound in alcove corners, and ice-crack-floor on ramp surfaces. The descent concept is excellent --- these additions sell the "going where no warmth survives" atmosphere.

---

### Room: Caina --- Betrayers of Family (16x14, exploration, sortOrder=1)

**Player Experience:** A vast frozen lake stretches before you. Six ice pillars rise from the floor to the ceiling. Blue goatKnights stand motionless in the ice, frozen mid-stride. You approach and the ice cracks --- they break free, devastating and relentless. Cage props embedded in the floor hold smaller frozen figures. Swords frozen into pillar surfaces are inaccessible weapons of betrayal. The reflected shots mechanic is in full effect: shots that hit pillars bounce, and you can angle them to pre-damage still-frozen goatKnights.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| ice-pillar | 6 positions (2 rows of 3, staggered) | 1.2 | varies | Full-height ice pillars, reflective surfaces |
| treachery-ice-arch | south corridor exit | 1.0 | face-south | Frozen archway to Antenora |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-betrayer-cage | 3 positions (embedded in floor ice) | 0.8 | Frozen betrayer cages below ice surface |
| treachery-frozen-sword | 2 positions (pillar surfaces) | 0.7 | Bronze swords frozen into pillar --- inaccessible, narrative |
| treachery-ice-crack-floor | center lake area | 1.5 | Cracked ice floor texture across frozen lake |
| treachery-snow-drift-mound | NW/SE corners | 0.7 | Snow drift accumulation against walls |

**Lighting:** Faint blue bioluminescence from ice itself (`#3366cc`, radius 6 cells, intensity 0.12). Faint overhead `#aabbdd` at 0.05. Cold blue ambient `#2244aa` at 0.10. No warm light sources.
**Platforming:** Flat at elevation -3. Ice001 floor (0.8x friction, slippery). Ice pillars (1x1 cell, full height) serve as cover AND reflective surfaces.

> **Playtest note:** Caina had 11 generic props in 224 cells. Now 16 circle-specific props. Key changes: ice-pillar (x6, circle-specific, reflective surfaces), treachery-betrayer-cage (x3), treachery-frozen-sword (x2). Added treachery-dark-ice-monolith (x1) as hero piece at center/north edge, treachery-snow-drift-mound (x2) at room edges, and treachery-ice-crack-floor for the frozen lake surface.

---

### Room: Antenora --- Betrayers of Country (12x16, exploration, sortOrder=2)

**Player Experience:** Narrow fortress corridors. Ice-encased military architecture. Frozen banners hang stiff from walls. Shields sit useless and frost-covered. The corridors are 3 cells wide and 2.5 cells tall --- claustrophobic. A missed shot travels the corridor length, hits the far wall, and bounces straight back at you. The flamethrower is essential --- its 3-cell range fills the corridor without reaching the walls. ShadowGoats emerge from frozen alcoves behind you. A fireGoat holds the intersection ahead.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| treachery-ice-arch | north entrance, south exit | 0.9 | face-transit | Frozen archways at corridor termini |
| treachery-crystalline-spike-wall | corridor dead-end walls | 0.8 | face-corridor | Ice spike hazard walls at corridor ends |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-frozen-banner | 4 positions, N/S alternating walls | 0.8 | Frozen-stiff national banners (betrayers of country) |
| treachery-frozen-chain-cluster | 2 corridor intersections (ceiling) | 0.7 | Frozen chains at corridor crossings |
| treachery-snow-drift-mound | alcove recesses (3 positions) | 0.5 | Snow drift in ambush recesses |
| stalactite-cluster (general) | 2 positions, corridor ceiling | 0.6 | Ice stalactites hanging from corridor ceiling |

**Lighting:** No torch light. Faint blue bioluminescence from ice walls (`#3366cc`, radius 6 cells, intensity 0.12). Denser fog `#080c16` at 0.05. Corridor reflection env zone intensity 1.0.
**Platforming:** Flat at elevation -3. Corridors are 3 wide x 2.5 tall. 2x2 cell alcove recesses in corridor walls (3 total, ambush points). Step-down stairs at south exit (-3 to -4).

> **Playtest note:** Antenora was already good at 9 props in 192 cells. Now 14 props: treachery-frozen-banner for banners, frost overlay equivalent for shields. Added treachery-ice-arch at corridor entrances, treachery-crystalline-spike-wall at dead-end alcove, and stalactite-cluster on corridor ceiling. The narrow corridors (3 cells wide) mean even modest prop additions significantly improve visual density.

---

### Room: Ptolomea --- Betrayers of Guests (14x10, exploration, sortOrder=3)

**Player Experience:** A frozen feast. A large banquet table set for guests who will never eat. treachery-frost-chalice raised in toasts that will never be drunk. Chairs are knocked over, some upright, all frost-covered. Two Blue goatKnights sit at the table, frozen. They thaw when you enter --- ice cracking, standing, table pushed aside. The low ceiling (1.5 cells) means no arcing shots. Everything is flat trajectory. Every wall is close. Every miss comes back fast. Close quarters with low ceiling: flamethrower dominance.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| treachery-ice-arch | north entrance | 0.8 | face-north | Low-clearance frozen archway |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-frozen-feast-table | center (4x2 cells, 0.5 cell height) | 1.0 | Frost-covered banquet table with frozen feast |
| treachery-frost-chalice | 2 positions on table | 0.5 | Frozen chalices --- poisoned cups of betrayal |
| treachery-snow-drift-mound | SE corner | 0.5 | Snow drift around frozen barrel |
| frozen-goat | under table, partially visible | 0.5 | Previous scapegoat frozen at the feast --- narrative callback |
| broken-pot (general) | table surface, 2 positions | 0.3 | Frozen crockery, shattered by ice expansion |
| crystal (general) | (26, 62), (34, 64) near walls | 0.4 | Ice crystal formations growing from floor |

**Lighting:** No torch light. Ice bioluminescence only (`#3366cc`, intensity 0.12). Low ceiling traps cold air --- fog density 0.04. Ceiling at 1.5 cells --- player cannot jump.
**Platforming:** Flat at elevation -4 (step down from Antenora). treachery-frozen-feast-table center (4x2 cells, 0.5 cell height). 6x chair (general, around table). Barrel in SE corner. Low ceiling (1.5 cells).

> **Playtest note:** Ptolomea was the best-propped room in Circle 9 at 12 props in 140 cells. Now 11 circle-specific props plus general. Key changes: treachery-frozen-feast-table for the banquet table, treachery-frost-chalice for chalices. Added frozen-goat under the table (previous scapegoat at the feast --- "you are not the first") and ice crystals growing from the floor. The frozen banquet scene is already powerful visual storytelling.

---

### Room: Giudecca --- Betrayers of Lords (18x16, arena, sortOrder=4)

**Player Experience:** THE arena of Circle 9. You enter and the doors lock. Two Blue goatKnights march from a massive frozen waterfall on the back wall. The waterfall begins cracking --- ice chunks crash down. Between waves, the floor itself begins to crack and fall into the void below. By wave 3, you fight on fragmented ice platforms over nothingness. Three waves of everything the game has thrown at you. The culmination of combat.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| treachery-frozen-waterfall | south/back wall (8 cells wide, full height) | 2.0 | face-north | HERO PIECE: Massive frozen waterfall backdrop --- cracks during arena, room visual centerpiece |
| ice-pillar | 6 positions (2 rows of 3, staggered) | 1.2 | varies | Ice pillars for cover and reflection, key tactical elements |
| treachery-frozen-stalactite | ceiling, 6 positions (increased from 4) | 1.2 | hanging | Stalactites that fall as hazards during waves --- visual warning before drop |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-glacial-platform | 4+ positions (form as floor collapses) | 1.0 | Fragmenting floor sections over void |
| treachery-ice-crack-floor | 4 positions at future collapse points | 1.5 | Visible crack patterns at positions where floor sections will collapse --- visual warning BEFORE trigger fires |
| treachery-frozen-chain-cluster | ceiling, 4 positions (over void sections) | 1.2 | Massive frozen chains hanging over void --- quadrant markers |
| treachery-dark-ice-monolith | (18, 74), (38, 74) flanking entrance | 1.5 | Tall dark ice pillars framing arena entry --- sets the visual tone |
| treachery-snow-drift-mound | (18, 86), (38, 86) south corners | 0.6 | Snow accumulation near frozen waterfall base |

**Lighting:** Faint overhead `#aabbdd` at 0.05. Crystal clear fog density 0.02. Ice bioluminescence `#3366cc`. Void below at -6 glows deep indigo `#110022`. Frozen waterfall surface has faint specular `#88aaff`.
**Platforming:** Floor at elevation -4. Void at -6 (2 cells below). Floor sections (3x3 cells each) crack and fall during waves --- 4 sections in wave 2 (over 20 seconds), 2 more in wave 3. WALL_SECRET on west wall to Judas Trap. Frozen waterfall is 8 cells wide, full height, animated cracking.

> **Playtest P0:** Giudecca had 4 generic chain props in 288 cells. This is Act 3's climactic arena and it was visually empty. Now 22+ props: treachery-frozen-waterfall (hero piece, room visual centerpiece), 6 ice pillars (cover + reflection), 6 frozen stalactites (hazards with visual warning), 4 ice-crack-floor markers (warn of collapse positions BEFORE triggers fire), 4 frozen chains (quadrant markers), 2 dark ice monoliths flanking entrance. The largest arena in the game now has the visual weight it deserves.

---

### Room: Judas Trap --- Secret Room (6x6, secret, sortOrder=5)

**Player Experience:** Ironic betrayal theme. A frozen codex on the floor lists names --- "The traitors who built this place, and the traitor who reads this." A cage contains a frozen goat --- a previous scapegoat. The generous pickups are genuine. Frost-covered coins are worthless. The room does not betray you. But the knowledge does: you are not the first.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| (none) | --- | --- | --- | Small secret room, minimal structure |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-betrayer-cage | (14, 81) floor | 0.7 | Cage containing frozen goat figure |
| frozen-goat | inside cage | 0.6 | Previous scapegoat frozen in ice --- "you are not the first" |
| treachery-snow-drift-mound | (12, 79), (16, 83) corners | 0.4 | Thin snow covering |
| treachery-ice-crack-floor | (13, 80) floor | 0.5 | Cracked ice around cage --- the cage has been here a long time |
| crystal (general) | (15, 80) near cage | 0.3 | Ice crystal growth near frozen figure |

**Lighting:** Faint ice glow only. Low-ceilinged (1.5 cells). Snow001 floor over Rock022 walls --- thin frost, warmth still beneath.
**Platforming:** Flat at elevation -4. Dead end --- return through WALL_SECRET.

> **Playtest note:** Judas Trap had 4 props. Now 6. Small changes with large narrative impact: the frozen-goat inside treachery-betrayer-cage is the room's emotional core ("you are not the first"), ice cracks around the cage show how long this figure has been frozen, and the crystal growth suggests the ice is slowly consuming everything. Frost-covered coin variant --- worthless coins reinforcing the betrayal theme.

---

### Room: Cocytus Bridge (4x36, bridge, sortOrder=6)

**Player Experience:** No enemies. No pickups. No props. Just ice, void, and wind. The bridge is 4 cells wide and 36 cells long --- 72 world units, 18-20 seconds of walking in total silence except wind. The longest non-combat sequence in the game. Faint inscriptions in the ice: "The first goat fell here 3,000 years ago." Frozen silhouettes of previous scapegoats are visible deep below. The far end of the bridge materializes from darkness as you approach. You walk and think about everything.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| treachery-ice-bridge-segment | bridge surface (repeating) | 1.0 | face-south | Narrow ice walkway sections over void |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| (none) | --- | --- | NOTHING. Empty ice. Void below. Wind only. |

**Lighting:** No light sources. Only void glow from below (deep indigo `#110022`, intensity 0.03). No ceiling --- open to darkness above. Almost no fog (0.01). Wind particles (snow drift) blow horizontally.
**Platforming:** Flat at elevation -5. 4 cells wide, 36 cells long. FLOOR_VOID on both sides. No railings. Slightly slippery (0.85x friction). Not a platforming challenge --- just precarious.

> **Playtest note:** This room SHOULD be empty. The emptiness IS the design. The only structural element is treachery-ice-bridge-segment as the bridge surface itself. The 18-20 second walk in total silence after Giudecca's intensity is the game's most meditative moment. Adding decorative props would undermine it.

---

### Room: Azazel's Frozen Throne (20x20, boss, sortOrder=7)

**Player Experience:** The largest boss room in the game. The absolute bottom of Hell. Mirror-smooth black ice floor. No walls in the traditional sense --- the room's perimeter is a ring of ice fading into darkness. Four massive frozen chains hang from above, marking arena quadrants. A single shaft of pale light illuminates the center, where Azazel stands frozen from the waist down in a massive ice formation. He is tall, antlered, calm. Not a monster. A king. He speaks: "You came. I have been waiting since the first goat was cast out." Phase 1: you cannot hurt him directly --- shoot the ice around him. Phase 2: the ice shatters, the floor fragments into platforms over the abyss. Phase 3: he tells you what you are. The fight ends. Not because he died.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| treachery-ice-formation | center (4x4 cells, 3 cells tall) | 2.0 | centered | HERO PIECE: Central ice prison containing Azazel, 8 destructible sections with orange crack weak points visible through translucent ice |
| treachery-dark-ice-monolith | 4 arena quadrant markers | 1.8 | face-center | Tall dark ice obelisks at quadrant boundaries --- the tallest vertical elements in the room, framing the central formation |
| treachery-frozen-throne | within ice formation (revealed phase 2) | 1.2 | face-north | Azazel's seat of power, revealed when ice shatters --- the visual payoff of Phase 1 |
| treachery-crystalline-spike-wall | perimeter ring, 4 positions (N/E/S/W edges) | 1.2 | face-center | Room edge ice formations rising from darkness, no traditional walls --- the room boundary IS jagged ice |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| treachery-frozen-chain-cluster | 4 ceiling positions (quadrant boundaries) | 1.5 | Massive frozen chains descending from infinite darkness above --- the largest chain props in the game |
| treachery-glacial-platform | 12-15 positions (phase 2 floor fragments) | 1.0 | Floor fragment platforms (3x3 to 4x4 cells) over void --- the arena itself transforms |
| treachery-ice-crack-floor | around central formation, 4-cell ring | 2.0 | Fracture lines radiating from Azazel's prison --- appear 4 seconds before collapse |
| treachery-frozen-stalactite | ceiling, 4 positions (between chains) | 1.5 | Ice stalactite clusters hanging from the darkness above |
| treachery-frozen-banner | 2 positions, near entrance | 0.8 | Frozen banners from a forgotten age --- this was once a hall of judgment |
| treachery-snow-drift-mound | entrance area (28, 94) | 0.5 | Snow blown in from Cocytus Bridge |
| treachery-frozen-waterfall | west wall fragment | 1.0 | Smaller frozen cascade, echo of Giudecca's centerpiece |

**Lighting:** Single overhead shaft of pale light `#ccddff` at intensity 0.15, narrow cone on Azazel (spotlight). Ice bioluminescence `#3366cc` at 0.12. Void below with deep indigo glow `#110022`. Phase 3: fog clears to 0.00. Total clarity. No warm light anywhere. The single spotlight is the room's signature --- everything radiates from and returns to the figure at center.
**Platforming:** Floor at elevation -6 (deepest point in all 9 circles). Central ice formation 4x4 cells, 3 cells tall. Phase 1: floor beyond formation fragments --- fracture lines appear 4s before collapse. Phase 2: floor shatters into 12-15 floating platforms (3x3 to 4x4 cells, 1-cell max gaps, walkable without jumping, 0.5 elevation variation). Void below at -8.

> **Playtest P0 --- CRITICAL:** Azazel's Frozen Throne had 4 generic chain props in 400 cells. The FINAL BOSS ROOM of the entire game had 1 prop per 100 cells. This is now 28+ props and the most visually dramatic space in all 9 circles. The treachery-ice-formation (central prison, hero piece, 2x scale) is the room's anchor. 4 treachery-dark-ice-monolith obelisks frame the arena. 4 treachery-crystalline-spike-wall formations define the room edge (no traditional walls --- the boundary IS jagged ice fading to darkness). 4 massive treachery-frozen-chain-cluster descend from infinite darkness above. 12-15 treachery-glacial-platform fragments form in Phase 2. Ice crack patterns warn of collapse. The treachery-frozen-throne within the formation is the Phase 2 visual payoff. This room is the destination of 9 circles of descent --- it must feel like it.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Used In |
|---------|------|----------|---------|
| frozen-goat | Frozen Goat | exists | Ptolomea (under table), Judas Trap (in cage) |
| ice-pillar | Ice Pillar | exists | Caina x6, Giudecca x6 |
| soul-cage | Soul Cage | exists | (available, not currently placed) |
| treachery-betrayer-cage | Betrayer Cage | exists | Caina x3, Judas Trap |
| treachery-crystalline-spike-wall | Crystalline Spike Wall | exists | Antenora, Azazel's Throne x4 |
| treachery-dark-ice-monolith | Dark Ice Monolith | exists | Caina, Giudecca x2, Azazel's Throne x4 |
| treachery-frost-chalice | Frost Chalice | exists | Ptolomea x2 |
| treachery-frost-shattered-column | Frost Shattered Column | exists | (available, not currently placed) |
| treachery-frozen-banner | Frozen Banner | exists | Antenora x4, Azazel's Throne x2 |
| treachery-frozen-chain-cluster | Frozen Chain Cluster | exists | Glacial Stairs x2, Antenora x2, Giudecca x4, Azazel's Throne x4 |
| treachery-frozen-feast-table | Frozen Feast Table | exists | Ptolomea |
| treachery-frozen-stalactite | Frozen Stalactite | exists | Glacial Stairs x3, Giudecca x6, Azazel's Throne x4 |
| treachery-frozen-sword | Frozen Sword | exists | Caina x2 |
| treachery-frozen-throne | Frozen Throne | exists | Azazel's Throne (Phase 2 reveal) |
| treachery-frozen-waterfall | Frozen Waterfall | exists | Giudecca (hero piece), Azazel's Throne (echo) |
| treachery-glacial-platform | Glacial Platform | exists | Giudecca x4+, Azazel's Throne x12-15 |
| treachery-ice-arch | Ice Arch | exists | Glacial Stairs, Caina, Antenora x2, Ptolomea |
| treachery-ice-bridge-segment | Ice Bridge Segment | exists | Cocytus Bridge (structural) |
| treachery-ice-crack-floor | Ice Crack Floor | exists | Glacial Stairs, Caina, Giudecca x4, Judas Trap, Azazel's Throne |
| treachery-ice-formation | Ice Formation | exists | Azazel's Throne (hero piece, central prison) |
| treachery-snow-drift-mound | Snow Drift Mound | exists | Glacial Stairs x2, Caina x2, Antenora x3, Ptolomea, Judas Trap x2, Azazel's Throne |
| treachery-unlit-lantern | Unlit Lantern | exists | Glacial Stairs x4 |

**General library props used in this circle:**

| Prop ID | Name | Manifest | Used In |
|---------|------|----------|---------|
| broken-pot | Broken Pot | exists | Ptolomea x2 |
| crystal | Crystal | exists | Ptolomea x2, Judas Trap |
| stalactite-cluster | Stalactite Cluster | exists | Antenora x2 |

**Summary:** All 22 circle-specific Meshy props have existing manifests. All general library props have existing manifests. No new manifests needed for Circle 9. Two circle-specific props (soul-cage, treachery-frost-shattered-column) have manifests but are not currently placed --- available for future additions if density needs increase.
