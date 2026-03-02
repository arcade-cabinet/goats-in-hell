---
title: "Circle 1: Limbo"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: circles
circle_number: 1
sin: ignorance
boss: Il Vecchio
act: 1
build_script: scripts/build-circle-1.ts
mechanic: fog-of-war
related:
  - docs/circles/00-player-journey.md
  - docs/plans/2026-03-01-circle-1-limbo-design.md
  - docs/plans/2026-03-01-circle-1-limbo-implementation.md
  - docs/agents/level-editor-api.md
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
| Vestibule | ammo | Near south exit | First pickup — teaches interaction |
| Fog Hall | ammo | Center | First ammo refill |
| Crypt | weapon (shotgun) | Center | Brim Shotgun — first weapon unlock |
| Crypt | ammo | Near scroll | Shotgun ammo |
| Bone Pit (bottom) | ammo × 2 | Spread | Lure for ambush |
| Bone Pit (bottom) | health | Center | Healing for ambush damage |
| Columns (between waves) | ammo | North | Resupply |
| Columns (between waves) | health | South | Healing |
| Boss chamber | ammo × 2 | NE, SW corners | Symmetric |
| Boss chamber | health × 2 | NW, SE corners | Symmetric |

> **Balance note:** The Brim Shotgun in the Crypt is a bonus reward. The circle is balanced for Hell Pistol-only play. Players who miss the Crypt will find the Brim Shotgun in the procedural floors before Circle 2.

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

> **Design note:** If the player misses the Crypt entirely, the Brim Shotgun is guaranteed in the procedural floors between Circle 1 and Circle 2. The Crypt is an early reward, not a required find.

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

---

## 3D Spatial Design

### Room: Vestibule (8x6, exploration)

**Player Experience:** You step through the gate inscription and the cold hits you immediately. The air is still and heavy. Dim torchlight flickers off ancient stone walls that disappear into fog above. Two shattered vases frame a worn path south — the only direction that feels intentional. You are alone, and the silence is louder than it should be.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| limbo-crumbling-arch | (16,2) north entry | 1.0 | face-south | Frame the entrance from above |
| limbo-inscription-tablet | (20,2) north wall center | 0.8 | face-south | Dante's gate inscription |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| limbo-torch-bracket | (16,3) and (23,3) west/east walls | 1.0 | Primary light sources, warm orange glow |
| limbo-vase-rubble | (18,4) and (22,4) flanking center | 0.7 | Ancient ruins atmosphere |
| limbo-stone-bench | (17,6) near south exit | 0.9 | Resting place nobody uses anymore |
| limbo-cobweb-cluster | (16,2) NW corner ceiling | 0.6 | Abandonment, untouched for centuries |
| limbo-cracked-floor-slab | (19,5) center floor | 1.0 | Uneven terrain, centuries of wear |

**Lighting:** 2x wall torches at (16,3) and (23,3), color `#ff8844`, intensity 0.8, radius 4 cells. Cold blue ambient `#2233aa` at 0.15.
**Platforming:** Flat. FLOOR_RAISED step at south edge (+0.5) hints at elevation changes ahead.

---

### Room: Fog Hall (12x10, exploration)

**Player Experience:** The corridor opens and the fog thickens. You can see maybe eight cells ahead before shapes dissolve into gray-blue nothing. The torches here are fewer and farther apart. Something is moving in the mist — you hear hooves on stone before you see anything. The cages on the floor are empty, but they were not always empty.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| limbo-ancient-pillar | (16,14) and (23,14) flanking entrance | 1.0 | — | Frame the entry from Vestibule |
| limbo-iron-gate | (14,21) west corridor to Bone Pit | 1.0 | face-east | Mark the optional branch |
| limbo-crumbling-arch | (19,21) south corridor to Columns | 1.0 | face-south | Main path forward |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| limbo-torch-bracket | (14,13) and (25,13) north wall | 1.0 | Sparse lighting, long shadows |
| limbo-cage | (17,16) and (21,18) floor-standing | 0.8 | Ominous empty cages in the fog |
| limbo-vase-rubble | (15,15), (20,17), (24,19) scattered | 0.6 | Ancient ruins scattered on floor |
| limbo-fallen-column | (22,15) lying on floor | 1.0 | Obstacle, partial LOS block |
| limbo-moss-growth | (14,18) along west wall base | 0.8 | Dampness, organic decay |
| limbo-bone-pile | (18,20) near south corridor | 0.7 | Something died here |

**Lighting:** 2x wall torches at (14,13) and (25,13), color `#ff8844`, intensity 0.6, radius 4 cells. Fog density 0.08, color `#0d0d1a`.
**Platforming:** Flat at elevation 0. Fallen column creates visual cover but not physical barrier.

---

### Room: Crypt (6x6, secret)

**Player Experience:** You push through the hidden wall and the air changes — damper, cooler, with the faint smell of earth and moss. A single torch illuminates a small chamber. A book stand holds an ancient scroll. And there, resting on a stone pedestal in the center: the Brim Shotgun. Your first real weapon. The walls here are covered in moss — this place has been forgotten by Hell itself.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| limbo-crumbling-arch | (30,14) secret entrance frame | 0.8 | face-west | Frame the WALL_SECRET entry |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| limbo-torch-bracket | (31,15) east wall | 1.0 | Single light source, intimate |
| limbo-stone-lectern | (33,16) against north wall | 0.9 | Holds the lore scroll |
| limbo-moss-growth | (30,16), (34,18) walls and floor | 1.0 | Thick moss — forgotten, damp |
| limbo-sarcophagus | (32,18) south side | 0.9 | Ancient burial, atmosphere |
| limbo-cobweb-cluster | (35,14) NE corner | 0.5 | Undisturbed for ages |

**Lighting:** 1x wall torch at (31,15), color `#ff8844`, intensity 0.7, radius 3 cells. Moss-filtered light feels greener.
**Platforming:** Flat at elevation 0. No obstacles.

---

### Room: Bone Pit (8x8, platforming)

**Player Experience:** You hear the wind before you see the room — a low updraft from below carrying the smell of old death. The floor is littered with bones. Chains hang from the darkness above, swaying slightly in the updraft. You step in and the walls seem to close. Then the shapes in the corners start moving. The ambush was waiting for you.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| limbo-crumbling-arch | (2,14) west entrance | 0.9 | face-east | Entry frame from Fog Hall |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| limbo-chain-cluster | (4,15), (7,17), (5,19) ceiling-hung | 1.2 | Vertical visual, atmosphere |
| limbo-bone-pile | (3,16), (6,18), (8,20) scattered | 0.8 | Floor covering, the pit's purpose |
| limbo-torch-bracket | (2,15) near entrance | 1.0 | Single light — the rest is dark |
| limbo-tombstone | (9,15) and (9,19) along east wall | 0.7 | Something was buried here |
| limbo-broken-altar | (5,21) south center | 0.9 | Ritual site in the bone pit |
| fog-lantern | (7,14) ceiling-hung near entrance | 0.8 | Eerie pale glow marking entry |

**Lighting:** 1x wall torch at (2,15), color `#ff8844`, intensity 0.5, radius 3 cells. Fog lantern at (7,14), pale glow `#aabb88`, intensity 0.3. Very dark room — the bones catch what little light there is.
**Platforming:** Floor at elevation 0. Edges at elevation 1 — the pit rim is raised. The center dips slightly, funneling toward the bone piles.

---

### Room: Columns (10x12, arena)

**Player Experience:** Six stone columns rise from the floor into the fog above. For a moment the fog thins and you can see clearly — pillars casting long shadows in torchlight. Then the doors slam shut behind you. Shapes pour in from the edges. The columns are your only cover. You fight between them, using the geometry to break line of sight, pivoting around stone as hellgoats converge. When the last one falls, the fog lifts briefly and you see the stairs descending ahead. Something waits below.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| limbo-ancient-pillar | (17,28), (20,28), (23,28) row 1 | 1.2 | — | Structural columns, LOS blockers |
| limbo-ancient-pillar | (17,33), (20,33), (23,33) row 2 | 1.2 | — | Structural columns, LOS blockers |
| limbo-crumbling-arch | (19,37) south exit to stairs | 1.0 | face-south | Frame descent to boss |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| limbo-torch-bracket | (15,27) and (24,27) north wall | 1.0 | Arena lighting, north side |
| limbo-torch-bracket | (15,36) and (24,36) south wall | 1.0 | Arena lighting, south side |
| limbo-banner-tattered | (15,30) and (24,30) east/west walls | 0.9 | Tattered fabric between pillars |
| limbo-cracked-floor-slab | (19,31) center floor | 1.2 | Worn arena floor |
| limbo-vase-rubble | (16,29) and (23,35) corners | 0.6 | Scattered debris |
| limbo-stone-bench | (24,28) east wall alcove | 0.8 | Spectator seating — grim |

**Lighting:** 4x wall torches at corners, color `#ff8844`, intensity 0.7, radius 4 cells. After wave 2 clear: fog drops to 0.04, revealing the room fully.
**Platforming:** Flat at elevation 0. Columns provide cover. South exit leads to descending stairs (elevation 0 to -1).

---

### Room: Il Vecchio's Chamber (12x12, boss)

**Player Experience:** The stairs end and you step into a vast dark chamber. The ceiling is lost in shadow. Two torches flank the entrance, casting your shadow long across the granite floor. At the far end, backlit by a single torch, a massive silhouette sits motionless. Il Vecchio. He speaks before you can raise your weapon. His voice is old — older than the stone. "You carry what is not yours, little goat." At half health the fog surges to near-blindness. You are fighting a voice in the dark, firing at sound and shadow.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| limbo-crumbling-arch | (19,42) north entrance | 1.2 | face-south | Grand entrance frame |
| limbo-ancient-pillar | (15,44), (24,44) flanking entrance | 1.3 | — | Imposing entrance pillars |
| limbo-ancient-pillar | (15,51), (24,51) mid-room | 1.3 | — | Minimal cover pillars |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| limbo-torch-bracket | (15,43) and (24,43) entrance wall | 1.0 | Entrance lighting, dramatic |
| limbo-torch-bracket | (19,52) behind boss position | 1.0 | Backlight — boss silhouette |
| limbo-banner-tattered | (16,43) and (23,43) flanking entrance | 1.1 | Ceremonial entrance dressing |
| limbo-sarcophagus | (16,50) and (23,50) alcoves | 1.0 | Ancient burials — Il Vecchio's predecessors |
| limbo-broken-altar | (20,48) center floor | 1.0 | Ritual altar before the boss |
| limbo-tombstone | (17,52) and (22,52) near boss | 0.8 | Graves at the gatekeeper's feet |
| limbo-dried-fountain | (20,44) near entrance | 0.9 | Dried up — nothing flows here |
| limbo-bone-pile | (25,52) SE corner | 0.7 | Remains of those who failed |
| limbo-wall-sconce | (14,47) and (25,47) side walls | 0.9 | Dim side lighting |

**Lighting:** 2x entrance torches at (15,43) and (24,43), color `#ff8844`, intensity 0.8. 1x backlight torch at (19,52), color `#ff8844`, intensity 0.6. 2x wall sconces at (14,47) and (25,47), color `#ff6633`, intensity 0.4. Boss phase 2 (HP<50%): fog surges to 0.12, color `#0a0a15`.
**Platforming:** Entire chamber at elevation -1 (descended via stairs). Flat boss arena. Sarcophagi provide minor cover along the walls.
