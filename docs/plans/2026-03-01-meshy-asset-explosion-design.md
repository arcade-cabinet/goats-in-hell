---
title: "Meshy Asset Explosion — Comprehensive 3D Asset Generation Plan"
status: in-progress
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
plan_type: design
implements: null
related:
  - docs/circles/00-player-journey.md
  - docs/agents/level-editor-api.md
  - pipelines/definitions/prop-direct.pipeline.json
  - pipelines/definitions/enemy.pipeline.json
---

# Meshy Asset Explosion — Design Document

## Vision

Replace the generic Quaternius dungeon kit with circle-themed modular 3D building blocks generated via Meshy AI. Every circle should feel visually distinct — not "same dungeon, different wall texture" but "this is unmistakably Circle 7: Violence."

The 652 existing `spawnProp()` calls in build scripts all reference generic assets (`Column_Stone`, `Chain_Coil`, `Barrel`). This plan creates ~240 circle-themed Meshy assets AND updates the design docs + build scripts to use them.

## Core Principle: Solid Modular Building Blocks

Meshy generates **solid static meshes** (no fluids, no cloth sim, no animation). These are building blocks the procedural generator composes via scale, rotation, and placement:

- **Arches** frame doorways and passages
- **Pillars** support ceilings and mark corridors
- **Platforms/ramps/stairs** create verticality
- **Environmental pieces** (pools, vents, formations) dress rooms
- **Furniture** fills spaces with themed interactive-looking objects
- **Hazard visuals** represent gameplay hazards
- **Boss centerpieces** anchor climactic encounters

All use the `prop-direct` pipeline: text-to-3D-preview → text-to-3D-refine (PBR textured).

## Asset Manifest Location

Manifests live alongside their output GLBs:
```
assets/models/props/general/<id>/manifest.json  → refined.glb
assets/models/props/circle-N/<id>/manifest.json  → refined.glb
```

The content generator reads the manifest, runs the pipeline, and writes artifacts directly to the manifest's directory.

## LevelEditor Integration

The LevelEditor will be extended to expose available assets per circle:

```typescript
// New: discover available Meshy assets for a circle
editor.getAvailableProps(circleNumber: number): string[]
// Returns: general props + circle-N specific props

// Existing: place props with full control
editor.spawnProp(levelId, 'arch-violence-industrial', x, z, {
  roomId, elevation, facing,
  surfaceAnchor: { face, offsetX, offsetY, offsetZ, rotation, scale }
})
```

This means any agent building a circle automatically knows what themed assets are available.

---

## Phase 1: Room-by-Room Spatial Design (9 circles)

Update each circle's design doc (`docs/circles/0N-*.md`) with a new **"3D Spatial Design"** section per room:

### Per-Room Template

```markdown
### Room: <name> (<dimensions>, <type>)

**Player Experience:** What the player FEELS entering this room.

**Structural Assets:**
| Asset | Position | Scale | Rotation | Purpose |
|-------|----------|-------|----------|---------|
| arch-violence-industrial | door cells | 1.0 | face-door | Frame passage entrances |
| pillar-violence-pipe | (x,z) corners | 1.2 | 0 | Industrial column supports |

**Environmental Assets:**
| Asset | Position | Scale | Purpose |
|-------|----------|-------|---------|
| blood-pool-large | center floor | 2.0 | Central blood pool hazard |
| meat-hook-rack | wall-mounted | 0.8 | Atmosphere, sightline break |

**Lighting:** Torch positions, colors, intensities
**Sound:** Ambient layer, spatial audio triggers
**Platforming:** Elevation changes, ramps, jump routes
```

### Persona Playtest Per Room

For each room, write a 2-3 sentence first-person "player moment":

> *I step through the rusted industrial arch into the Blood River. Crimson liquid stretches wall to wall, with narrow raised walkways cutting through it. Meat hooks dangle from chains above. My health is ticking down. I need to find enemies fast.*

This drives the asset list — if the prose references "rusted industrial arch" and "meat hooks from chains," those become manifest requirements.

---

## Phase 2: Gap Analysis & Manifest Generation

After spatial design is complete for all 9 circles:

1. **Extract unique asset names** from all room designs
2. **Cross-reference** against existing Quaternius props and already-created Meshy manifests
3. **Generate manifests** only for assets that rooms actually reference
4. **Prompt-engineer** each manifest to match the circle's AmbientCG palette

### Asset Scope (estimated)

| Category | General | Per-Circle | Total |
|----------|---------|------------|-------|
| Structural (arches, pillars, doorframes, stairs, ramps, walls) | 18 | 63 (7/circle) | 81 |
| Environmental (pools, vents, formations, growths, chains) | 12 | 54 (6/circle) | 66 |
| Furniture (thrones, altars, tables, racks) | 0 | 36 (4/circle) | 36 |
| Hazards (spikes, fire, thorns, acid, ice) | 8 | 14 (select circles) | 22 |
| Ceiling (stalactites, beams, chandeliers, icicles) | 4 | 14 (1-2/circle) | 18 |
| Floor overlays (gratings, drains, tiles, rugs) | 4 | 0 | 4 |
| Boss centerpieces | 0 | 9 | 9 |
| **Total** | **46** | **190** | **~236** |

Final count may vary based on what spatial design reveals.

---

## Phase 3: LevelEditor Wiring

### 3a. Asset Registry Discovery

Add a function that scans `assets/models/props/` manifest files at build time:

```typescript
function discoverMeshyAssets(): Map<string, string[]> {
  // Scan assets/models/props/{general,circle-1..9}/*/manifest.json
  // Return map: circleKey → available prop type names
  // "general" assets available to all circles
}
```

### 3b. LevelEditor API Extension

```typescript
class LevelEditor {
  // Existing
  spawnProp(levelId, type, x, z, opts?)

  // New: circle-aware asset discovery
  getAvailableProps(circle: number): string[]
  getAvailableEnemies(circle: number): string[]

  // New: batch prop placement (reduce boilerplate in build scripts)
  decorateRoom(levelId: string, roomId: string, decorations: PropPlacement[]): void
}

interface PropPlacement {
  type: string;
  x: number;
  z: number;
  elevation?: number;
  facing?: number;
  scale?: number;
  surfaceAnchor?: SurfaceAnchor;
}
```

### 3c. AssetRegistry Auto-Generation

Script that reads all manifest.json files and generates `PROP_MODEL_ASSETS` entries:

```bash
# Auto-generates AssetRegistry entries from manifest.json + refined.glb
node scripts/sync-asset-registry.mjs
```

---

## Phase 4: Build Script Updates

Update all 9 `scripts/build-circle-N.ts` to:

1. Use circle-themed Meshy assets instead of generic Quaternius names
2. Add structural assets (arches at doors, themed pillars, stairs/ramps)
3. Add environmental set dressing per room
4. Add boss room centerpieces
5. Add hazard visuals at hazard positions

### Example Transformation (Circle 7, Blood River room)

**Before:**
```typescript
editor.spawnProp(LEVEL_ID, 'Column_Stone', 10, 15, { roomId: bloodRiverId });
editor.spawnProp(LEVEL_ID, 'Chain_Coil', 12, 18, { roomId: bloodRiverId });
editor.spawnProp(LEVEL_ID, 'Barrel', 8, 20, { roomId: bloodRiverId });
```

**After:**
```typescript
// Structural: industrial arches at room entrances
editor.spawnProp(LEVEL_ID, 'arch-violence-industrial', 10, 10, {
  roomId: bloodRiverId, facing: Math.PI
});
// Environmental: blood pools and meat hooks
editor.spawnProp(LEVEL_ID, 'blood-pool-large', 15, 20, {
  roomId: bloodRiverId, elevation: 0
});
editor.spawnProp(LEVEL_ID, 'meat-hook-rack', 12, 18, {
  roomId: bloodRiverId,
  surfaceAnchor: { face: 'north', offsetX: 0, offsetY: 2, offsetZ: 0, rotation: [0,0,0], scale: 0.8 }
});
// Hazard: blood gutter channels
editor.spawnProp(LEVEL_ID, 'blood-gutter-channel', 10, 15, { roomId: bloodRiverId });
```

---

## Phase 5: Paper Playtest

Run a full paper playtest (all 9 circles) from the perspective of 3 player personas:

1. **"First-timer"** — Never played a boomer shooter. Notices environmental storytelling.
2. **"Speedrunner"** — Blasts through. Do structural assets create interesting movement?
3. **"Explorer"** — Checks every corner. Do rooms reward exploration with visual richness?

For each persona, walk through every room noting:
- Does the visual environment communicate the circle's sin?
- Do structural assets create interesting sightlines and movement choices?
- Do environmental assets tell a story?
- Are there dead/empty areas that need more dressing?
- Does the boss room feel climactic?

---

## Execution Order

1. **Phase 1** — Room-by-room spatial design for all 9 circles (parallel: 9 agents)
2. **Phase 2** — Gap analysis → manifest generation (parallel: general + 9 circle agents)
3. **Phase 3** — LevelEditor wiring (sequential: schema changes, API, auto-gen script)
4. **Phase 4** — Build script updates (parallel: 9 agents)
5. **Phase 5** — Paper playtest + iteration

Phases 1+2 can overlap: as each circle's spatial design completes, its manifests can be generated immediately. Phase 3 can start as soon as any manifests exist. Phase 4 requires both Phase 1 (spatial design) and Phase 3 (editor API) to complete.

---

## Prompt Engineering Guidelines

All Meshy prompts must:

1. **Specify "game asset"** — e.g., "dark fantasy game prop"
2. **Specify isolation** — "isolated object, dark background"
3. **Match the circle's palette** — Reference the AmbientCG material colors
4. **Specify purpose** — "archway frame for doorways" vs "decorative floor piece"
5. **Specify orientation** — "front-facing", "wall-mounted", "floor-placed"
6. **NO fluid/cloth** — Everything is solid. Pools are solid sculpted surfaces. Drapes are rigid.
7. **Low-mid poly** — 3000-8000 polycount for props, 8000-12000 for structural

### Example Prompt (Circle 7 arch):
```
A rusted industrial metal archway frame for a dark fantasy game, heavy riveted iron plates with visible bolts, blood-stained rust patina, sharp angular design like a meat processing plant doorway, isolated object on dark background, game asset, front-facing view
```
