---
title: "Circle 1: Limbo — Design"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
plan_type: design
related:
  - docs/circles/01-limbo.md
  - docs/plans/2026-03-01-circle-1-limbo-implementation.md
---

# Circle 1: Limbo — Level Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

---

## Identity

**Circle:** 1 (Limbo)
**Sin:** Ignorance
**Boss:** Il Vecchio (The Old One) — ancient patriarch, gatekeeper
**Dominant Mechanic:** Dense fog (visibility ~8 cells)
**Dante Quote:** *"Per me si va ne la città dolente, per me si va ne l'etterno dolore, per me si va tra la perduta gente."* (Through me the way to the suffering city, through me the way to eternal pain, through me the way among the lost people.)

**Feel:** You've just fallen into Hell. You don't know where you are. The fog is thick. Sounds echo. Enemies are shapes in the mist. This circle teaches the player to listen and explore before it teaches them to fight.

---

## Visual Design

### PBR Material Palette (from AmbientCG)

| Surface | Description | AmbientCG Source | Notes |
|---------|-------------|------------------|-------|
| Primary walls | Rough hewn stone, gray-blue undertone | Rock022, Rock030 | Cold, ancient, damp |
| Floor | Worn stone paving, cracked | PavingStones040, Concrete015 | Centuries of wear |
| Column accents | Polished stone (Columns room only) | Marble003 | Contrast with rough walls |
| Boss chamber | Dark smooth granite | Granite005A | Darker, more imposing |
| Ceiling | Raw unworked rock | Rock035 | Cave-like overhead |
| Secret room | Mossy stone | Moss001 over Rock022 | Damp, hidden, forgotten |

### Fog Settings

| Phase | Fog Density | Fog Color | Notes |
|-------|-------------|-----------|-------|
| Vestibule | 0.04 | `#1a1a2e` | Light fog, atmospheric |
| Fog Hall onward | 0.08 | `#0d0d1a` | Dense, 8-cell visibility |
| After Columns clear | 0.04 | `#1a1a2e` | Brief relief |
| Boss phase 2 (HP<50%) | 0.12 | `#0a0a15` | Nearly blind |

### Lighting

- Ambient: `#2233aa` at intensity 0.15 (cold blue, very dim)
- Point lights ONLY from torch props (warm orange `#ff8844`, radius 4 cells)
- No directional light — underground, no sun
- Boss chamber: two wall torches at entrance, one behind boss (backlit silhouette)

### Props (from Fantasy Props MegaKit)

| Prop | Placement | Purpose |
|------|-----------|---------|
| Torch_Metal | Wall-mounted, 2-3 per room | Primary light source, navigation aid |
| Chain_Coil | Hanging from ceiling in Bone Pit | Atmosphere, vertical visual |
| Cage_Small | Empty, floor-standing, Fog Hall | Ominous decoration |
| Scroll_1, Scroll_2 | Wall/pedestal in Crypt, Vestibule | Lore delivery |
| Vase_Rubble | Scattered on floor | Ancient ruins feel |
| Barrel | Near supply pickups | Visual marker for loot |

### Decals (from AmbientCG)

| Decal | Placement | Purpose |
|-------|-----------|---------|
| Leaking001-003 | Wall surfaces near ceiling | Water seepage, dampness |

---

## Room Layout

### Overview (6 rooms)

```
                    ┌──────────┐
                    │ VESTIBULE│  (8×6, exploration, sortOrder=0)
                    │ Spawn ★  │  Player starts here. Safe.
                    └────┬─────┘
                         │ corridor (width=3)
                    ┌────┴─────┐
              ┌─────┤ FOG HALL │──secret──┐
              │     │ (12×10)  │          │
              │     │ 3 patrol │     ┌────┴────┐
              │     └────┬─────┘     │  CRYPT  │  (6×6, secret)
              │          │           │ Shotgun │  WALL_SECRET entrance
         ┌────┴────┐     │ corridor  │ + Lore  │
         │BONE PIT │     │ (width=2) └─────────┘
         │ (8×8)   │     │
         │ ambush  │┌────┴─────┐
         │ optional││ COLUMNS  │  (10×12, arena)
         └─────────┘│ lock+wave│
                    │ 2 waves  │
                    └────┬─────┘
                         │ stairs (elevation: 0→-1)
                    ┌────┴─────┐
                    │IL VECCHIO│  (12×12, boss)
                    │ CHAMBER  │  Boss fight. Fog surge at 50%.
                    └──────────┘
```

### Grid Dimensions

**40 wide × 50 deep** (80 × 100 world units at CELL_SIZE=2)

### Room Placement (grid coordinates)

| Room | X | Z | W | H | Type | Elevation | sortOrder |
|------|---|---|---|---|------|-----------|-----------|
| Vestibule | 16 | 2 | 8 | 6 | exploration | 0 | 0 |
| Fog Hall | 14 | 12 | 12 | 10 | exploration | 0 | 1 |
| Crypt | 30 | 14 | 6 | 6 | secret | 0 | 2 |
| Bone Pit | 2 | 14 | 8 | 8 | platforming | 0 (edges=1) | 3 |
| Columns | 15 | 26 | 10 | 12 | arena | 0 | 4 |
| Il Vecchio's Chamber | 14 | 42 | 12 | 12 | boss | -1 (below) | 5 |

### Connections

| From | To | Type | Width | Notes |
|------|----|------|-------|-------|
| Vestibule | Fog Hall | corridor | 3 | Wide, welcoming |
| Fog Hall | Crypt | secret | 2 | WALL_SECRET at boundary |
| Fog Hall | Bone Pit | corridor | 2 | Side branch (optional) |
| Fog Hall | Columns | corridor | 2 | Main path forward |
| Columns | Il Vecchio's Chamber | stairs | 3 | Descending stairs |

---

## Entities

### Enemies (12 total + boss)

| Room | Type | Count | Behavior | Variant |
|------|------|-------|----------|---------|
| Fog Hall | hellgoat | 3 | Patrol waypoints (triangle loop) | Brown goatman |
| Bone Pit | hellgoat | 3 | Ambush spawn (trigger) | Brown goatman |
| Columns wave 1 | hellgoat | 3 | Spawn from edges, converge | Brown goatman |
| Columns wave 2 | hellgoat | 3 | Spawn from corners, aggressive | Brown goatman |
| Boss chamber | Il Vecchio | 1 | Boss AI, phase 2 at 50% HP | boss-il-vecchio.glb |

### Pickups

| Room | Type | Position | Notes |
|------|------|----------|-------|
| Fog Hall | ammo | Center | First ammo refill |
| Crypt | weapon (shotgun) | Center | Brim Shotgun — first weapon unlock |
| Crypt | ammo | Near scroll | Shotgun ammo |
| Bone Pit (bottom) | ammo × 2 | Spread | Lure for ambush |
| Bone Pit (bottom) | health | Center | Healing for ambush damage |
| Columns (between waves) | ammo | North | Resupply |
| Columns (between waves) | health | South | Healing |
| Boss chamber | ammo × 2 | NE, SW corners | Symmetric |
| Boss chamber | health × 2 | NW, SE corners | Symmetric |

### Props (non-interactive)

| Room | Props |
|------|-------|
| Vestibule | 2× Torch_Metal (walls), 1× Scroll_2 (inscription), 2× Vase_Rubble |
| Fog Hall | 2× Torch_Metal, 2× Cage_Small, 3× Vase_Rubble |
| Crypt | 1× Torch_Metal, 1× BookStand (for scroll), moss on walls |
| Bone Pit | 3× Chain_Coil (hanging), 1× Barrel, bones scattered |
| Columns | 6× stone columns (structural, break LOS), 2× Torch_Metal |
| Boss chamber | 3× Torch_Metal (2 entrance, 1 behind boss), 2× Banner_1 |

---

## Triggers

| ID | Room | Zone (x,z,w,h) | Action | Conditions | Data |
|----|------|-----------------|--------|------------|------|
| T1 | Bone Pit | (3, 16, 6, 4) | `spawnWave` | `once: true` | `{ enemies: [{type:'hellgoat', count:3}] }` |
| T2 | Columns | (17, 28, 6, 6) | `lockDoors` | `once: true` | — |
| T3 | Columns | (17, 28, 6, 6) | `spawnWave` | `once: true` | `{ enemies: [{type:'hellgoat', count:3}] }` |
| T4 | Columns | — | `spawnWave` | On wave 1 clear | `{ enemies: [{type:'hellgoat', count:3}] }` |
| T5 | Columns | — | `unlockDoors` | On wave 2 clear | — |
| T6 | Columns | — | `ambientChange` | On wave 2 clear | `{ fogDensity: 0.04 }` |
| T7 | Boss chamber | (15, 43, 10, 2) | `bossIntro` | `once: true` | `{ text: "You carry what is not yours..." }` |
| T8 | Boss chamber | (15, 43, 10, 2) | `lockDoors` | `once: true, delay: 3` | — |
| T9 | Boss chamber | — | `ambientChange` | Boss HP < 50% | `{ fogDensity: 0.12 }` |

---

## Environment Zones

| Zone | Type | Bounds | Intensity | Notes |
|------|------|--------|-----------|-------|
| Global fog | `fog` | Full level (0,0,40,50) | 0.8 | Baseline fog |
| Bone Pit wind | `wind` | Bone Pit room | 0.3 | Subtle updraft from below |

---

## Player Spawn

- **Position:** (20, 5) — center of Vestibule
- **Facing:** π (south — facing toward Fog Hall)

---

## Theme Configuration

```typescript
editor.createTheme('circle-1-limbo', {
  name: 'limbo',
  displayName: 'LIMBO — The Circle of Ignorance',
  primaryWall: MapCell.WALL_STONE,
  accentWalls: [MapCell.WALL_STONE],  // No accent variation — monotone
  fogDensity: 0.08,
  fogColor: '#0d0d1a',
  ambientColor: '#2233aa',
  ambientIntensity: 0.15,
  skyColor: '#000000',
  particleEffect: null,               // No particles — stillness
  enemyTypes: ['hellgoat'],
  enemyDensity: 0.8,                  // Below average — sparse, deliberate
  pickupDensity: 0.5,                 // Scarce — first circle teaches resource awareness
});
```

---

## Narrative Beats

1. **Vestibule inscription:** Dante's gate inscription (Italian + subtitle translation)
2. **Crypt scroll:** "The scapegoat carries what is not his. The wilderness awaits."
3. **Columns clear:** Fog lifts briefly — player sees the descent ahead
4. **Boss intro:** Il Vecchio speaks: "You carry what is not yours, little goat. I have watched the gate since before memory. All who pass carry sin. You carry more than most."
5. **Boss defeat:** Il Vecchio fades. The way down opens. Title card: "CIRCLE THE SECOND — LUST"

---

## Success Criteria

1. Level loads from SQLite via LevelDbAdapter → renders in LevelMeshes.tsx
2. All 6 rooms are reachable from spawn (DAG validation passes)
3. Fog mechanic works (visibility restriction, density changes via triggers)
4. PlaytestRunner AI can navigate from spawn to boss and defeat Il Vecchio
5. PBR materials from AmbientCG render on walls/floors (not the current flat colors)
6. At least 3 Fantasy Props visible as GLB instances in scene
7. Each room feels distinct from the others visually and mechanically

---

## What This Is NOT

- NOT a template for other circles. Limbo has 6 rooms. Circle 7 might have 3 sub-zones with 15 rooms. Circle 9 might be one enormous frozen lake.
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored.
- NOT using Kenney or KayKit assets. Fantasy Props MegaKit + AmbientCG PBR textures only.
