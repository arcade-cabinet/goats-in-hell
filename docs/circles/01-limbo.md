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

## Playability

| Metric | Target | Notes |
|--------|--------|-------|
| Target play time | 5–8 min | Tutorial pacing — players learn movement and combat. Short is intentional; later circles scale up. |
| Estimated play time | TBD (computed after build) | |
| Path distance | TBD | |
| Room count | 6 rooms + 1 boss | from Room Placement table |
| Enemy count | 12 enemies + boss | from enemy placement |

### Pacing Notes
Limbo is intentionally brief — the player is orienting, learning to move in fog, and discovering the shotgun in the Crypt. Tension peaks at the Columns arena when doors lock and waves spawn. The boss encounter is a dramatic payoff but not overlong. The entire circle should feel like a prologue: threatening enough to establish stakes, short enough to leave the player wanting more.

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
6. All Meshy props from the Prop Manifest Inventory render as GLB instances in scene
7. Each room feels distinct from the others visually and mechanically

---

## What This Is NOT

- NOT a template for other circles. Limbo has 6 rooms. Circle 7 might have 3 sub-zones with 15 rooms. Circle 9 might be one enormous frozen lake.
- NOT using the procedural generator's `explore → arena → boss` cycle. The pacing is authored.
- NOT using generic CC0 asset packs. All props are bespoke Meshy AI-generated models with circle-specific manifests + AmbientCG PBR textures for surfaces.

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
| limbo-rubble-scatter | (17,3) and (23,5) near walls | 0.6 | Fallen stone debris, age and collapse |
| limbo-cobweb-cluster | (23,2) NE corner ceiling | 0.5 | Paired with NW corner for symmetry |

**Lighting:** 2x wall torches at (16,3) and (23,3), color `#ff8844`, intensity 0.8, radius 4 cells. Cold blue ambient `#2233aa` at 0.15.
**Platforming:** Flat. FLOOR_RAISED step at south edge (+0.5) hints at elevation changes ahead.
**Prop density:** 9 assets in 48 cells (0.19 props/cell). Significantly improved from original 5 props -- the entrance to Hell now has weight.

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
| limbo-tombstone | (16,19) and (24,17) scattered in fog | 0.7 | Explorer rewards -- discoverable in fog |
| limbo-cobweb-cluster | (25,18) SE corner | 0.5 | Age and neglect in far corner |

**Lighting:** 2x wall torches at (14,13) and (25,13), color `#ff8844`, intensity 0.6, radius 4 cells. Fog density 0.08, color `#0d0d1a`.
**Platforming:** Flat at elevation 0. Fallen column creates visual cover but not physical barrier.
**Prop density:** 12 assets in 120 cells (0.10 props/cell). Improved from 7 -- tombstones and cobwebs give the explorer something to discover in the fog.

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
| limbo-skull-pile | (33,18) near sarcophagus | 0.5 | Remains near the burial |
| limbo-cobweb-cluster | (30,19) SW corner | 0.4 | More webbing -- sealed for ages |

**Lighting:** 1x wall torch at (31,15), color `#ff8844`, intensity 0.7, radius 3 cells. Moss-filtered light feels greener.
**Platforming:** Flat at elevation 0. No obstacles.
**Prop density:** 8 assets in 36 cells (0.22 props/cell). Dramatically improved from original 2 -- the secret room now rewards exploration with visual richness.

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
| limbo-spike-cluster | (3,20) and (8,16) pit edges | 0.7 | Hazard dressing, reinforces pit danger |
| limbo-bone-pile | (5,17) center floor | 1.0 | Larger bone cluster -- the pit's namesake |
| limbo-skull-pile | (7,19) near east wall | 0.5 | Skull concentration among the bones |

**Lighting:** 1x wall torch at (2,15), color `#ff8844`, intensity 0.5, radius 3 cells. Fog lantern at (7,14), pale glow `#aabb88`, intensity 0.3. Very dark room — the bones catch what little light there is.
**Platforming:** Floor at elevation 0. Edges at elevation 1 — the pit rim is raised. The center dips slightly, funneling toward the bone piles.
**Prop density:** 12 assets in 64 cells (0.19 props/cell). Now delivers on the "Bone Pit" promise with abundant bone scatter and hazard dressing.

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
| limbo-broken-pillar | (18,30) near row 1 | 0.9 | Age and battle damage -- broken column beside intact ones |
| limbo-rubble-scatter | (20,31) and (22,34) at column bases | 0.5 | Stone rubble from centuries of wear |

**Lighting:** 4x wall torches at corners, color `#ff8844`, intensity 0.7, radius 4 cells. After wave 2 clear: fog drops to 0.04, revealing the room fully.
**Platforming:** Flat at elevation 0. Columns provide cover. South exit leads to descending stairs (elevation 0 to -1).
**Prop density:** 16 assets in 120 cells (0.13 props/cell). The broken pillar and rubble add age to the arena and give the room texture after the fog lifts.

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
| limbo-inscription-tablet | (16,42) near entrance | 0.7 | Additional lore — warnings from predecessors |
| limbo-skull-pile | (14,50) and (25,50) base of side pillars | 0.5 | Skulls gathered at the gatekeeper's posts |
| limbo-ritual-circle | (20,47) center floor | 1.2 | Floor marking -- ritual site, adds ceremony |
| limbo-rubble-scatter | (17,45) and (22,45) near entrance pillars | 0.5 | Stone debris, age and past battles |

**Lighting:** 2x entrance torches at (15,43) and (24,43), color `#ff8844`, intensity 0.8. 1x backlight torch at (19,52), color `#ff8844`, intensity 0.6. 2x wall sconces at (14,47) and (25,47), color `#ff6633`, intensity 0.4. Boss phase 2 (HP<50%): fog surges to 0.12, color `#0a0a15`.
**Platforming:** Entire chamber at elevation -1 (descended via stairs). Flat boss arena. Sarcophagi provide minor cover along the walls.
**Prop density:** 17 assets in 144 cells (0.12 props/cell). The first boss encounter now has gravitas: inscription tablet, ritual circle, skull piles, and flanking sarcophagi create a gatekeeper's throne room.

---

### Prop Manifest Inventory

| Prop ID | Name | Manifest | Notes |
|---------|------|----------|-------|
| fog-lantern | Fog Lantern | ✅ exists | Bone Pit ceiling |
| limbo-ancient-pillar | Ancient Stone Pillar | ✅ exists | Fog Hall entrance, Columns structural, Boss Chamber |
| limbo-banner-tattered | Tattered Banner | ✅ exists | Columns walls, Boss Chamber entrance |
| limbo-bone-pile | Bone Pile | ✅ exists | Fog Hall, Bone Pit (x2), Boss Chamber |
| limbo-broken-altar | Broken Stone Altar | ✅ exists | Bone Pit, Boss Chamber center |
| limbo-broken-pillar | Broken Stone Pillar | ❌ needs creation | Columns -- age/battle damage variant |
| limbo-cage | Iron Cage | ✅ exists | Fog Hall floor |
| limbo-chain-cluster | Chain Cluster | ✅ exists | Bone Pit ceiling |
| limbo-cobweb-cluster | Cobweb Cluster | ✅ exists | Vestibule corners, Fog Hall, Crypt |
| limbo-cracked-floor-slab | Cracked Floor Slab | ✅ exists | Vestibule, Columns center |
| limbo-crumbling-arch | Crumbling Stone Arch | ✅ exists | Vestibule entry, Fog Hall exits, Bone Pit, Columns, Boss Chamber |
| limbo-dried-fountain | Dried Stone Fountain | ✅ exists | Boss Chamber near entrance |
| limbo-fallen-column | Fallen Column | ✅ exists | Fog Hall obstacle |
| limbo-inscription-tablet | Inscription Tablet | ✅ exists | Vestibule wall, Boss Chamber |
| limbo-iron-gate | Iron Gate | ✅ exists | Fog Hall west corridor |
| limbo-moss-growth | Moss Growth | ✅ exists | Fog Hall, Crypt walls |
| limbo-ritual-circle | Floor Ritual Circle | ❌ needs creation | Boss Chamber center floor marking |
| limbo-rubble-scatter | Stone Rubble Scatter | ❌ needs creation | Vestibule, Columns bases, Boss Chamber |
| limbo-sarcophagus | Stone Sarcophagus | ✅ exists | Crypt, Boss Chamber alcoves |
| limbo-skull-pile | Skull Pile | ❌ needs creation | Crypt near sarcophagus, Bone Pit, Boss Chamber |
| limbo-spike-cluster | Iron Spike Cluster | ❌ needs creation | Bone Pit edges -- hazard dressing |
| limbo-stone-bench | Stone Bench | ✅ exists | Vestibule, Columns alcove |
| limbo-stone-lectern | Stone Lectern | ✅ exists | Crypt scroll display |
| limbo-tombstone | Tombstone | ✅ exists | Fog Hall, Bone Pit, Boss Chamber |
| limbo-torch-bracket | Wall Torch Bracket | ✅ exists | All rooms -- primary light source |
| limbo-vase-rubble | Shattered Vase | ✅ exists | Vestibule, Fog Hall, Columns |
| limbo-wall-sconce | Wall Sconce | ✅ exists | Boss Chamber side walls |

**Summary:** 27 unique props. 22 have manifests, 5 need creation (limbo-broken-pillar, limbo-ritual-circle, limbo-rubble-scatter, limbo-skull-pile, limbo-spike-cluster).
