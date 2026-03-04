---
title: "Procedural Rendering Overhaul + Playability Metrics"
status: implemented
created: "2026-03-02"
updated: "2026-03-04"
domain: plans
plan_type: implementation
---

# Procedural Rendering Overhaul + Playability Metrics

## Problem

`EnvironmentZones.tsx` is an antipattern: it improvises colored-plane overlays from incomplete
level data instead of reading a complete rendering description. `DungeonProps.tsx` does the same
for static props. The level DB is the authority for gameplay but not for visuals.

Levels are also likely too short — no metrics exist to quantify playthrough duration.

## Solution

1. **Complete the level description**: add texture + fill-rule columns to `rooms` and `themes`;
   add `compiled_visual` JSON to `levels` produced by `compile()`.
2. **New `LevelRenderer.tsx`**: single R3F component that reads the complete compiled description
   and renders per-room PBR textures + procedural prop scatter + static props.
3. **Delete `EnvironmentZones.tsx`** (visual part — gameplay lives in `EnvironmentZoneEffects.ts`).
4. **Fold `DungeonProps.tsx`** into `LevelRenderer.tsx`.
5. **Extend `PlaytestRunner`** with play-time estimates; add Playability sections to all 9 circle docs.

---

## New Types (add to `src/db/LevelEditor.ts`)

```typescript
export type TextureId =
  | 'stone' | 'stone-dark' | 'brick' | 'concrete' | 'ground'
  | 'ice' | 'ice-deep'
  | 'lava' | 'lava-dark' | 'lava-cold'
  | 'leather' | 'marble' | 'metal' | 'metal-dark' | 'moss' | 'tiles';

export interface FillRule {
  type: 'scatter' | 'edge' | 'none';
  /** AssetRegistry prop keys WITHOUT the 'prop-' prefix */
  props: string[];
  /** 0.0–1.0: fraction of eligible floor cells that receive a prop */
  density: number;
  avoidSpawns?: boolean;
  randomRotation?: boolean;
}

export interface CompiledRoomVisual {
  id: string;
  name: string;
  bounds: { x: number; z: number; w: number; h: number };
  elevation: number;
  roomType: string;
  floorTexture: TextureId | null;
  wallTexture: TextureId | null;
  ceilingTexture: TextureId | null;
  fillRule: FillRule | null;
}

export interface CompiledVisual {
  version: 1;
  rooms: CompiledRoomVisual[];
  theme: {
    primaryWall: number;
    texturePalette: Partial<Record<string, TextureId>>;
    roomFillRules: Partial<Record<string, FillRule>>;
  };
}
```

---

## Schema Changes (`src/db/schema.ts` + `src/db/migrate.ts`)

### rooms table — new columns
```sql
floor_texture TEXT       -- nullable TextureId
wall_texture TEXT        -- nullable TextureId
ceiling_texture TEXT     -- nullable TextureId
fill_rule TEXT           -- nullable JSON FillRule
```

### themes table — new columns
```sql
texture_palette TEXT     -- nullable JSON: Record<roomType, TextureId>
room_fill_rules TEXT     -- nullable JSON: Record<roomType, FillRule>
```

### levels table — new column
```sql
compiled_visual TEXT     -- nullable JSON: CompiledVisual, populated by compile()
```

### migrate.ts pattern for new columns (idempotent):
```typescript
for (const stmt of [
  `ALTER TABLE rooms ADD COLUMN floor_texture TEXT`,
  `ALTER TABLE rooms ADD COLUMN wall_texture TEXT`,
  `ALTER TABLE rooms ADD COLUMN ceiling_texture TEXT`,
  `ALTER TABLE rooms ADD COLUMN fill_rule TEXT`,
  `ALTER TABLE themes ADD COLUMN texture_palette TEXT`,
  `ALTER TABLE themes ADD COLUMN room_fill_rules TEXT`,
  `ALTER TABLE levels ADD COLUMN compiled_visual TEXT`,
]) {
  try { db.run(sql.raw(stmt)); } catch { /* column already exists */ }
}
```

---

## LevelEditor API Changes (`src/db/LevelEditor.ts`)

### `room()` opts — new optional fields
```typescript
floorTexture?: TextureId;
wallTexture?: TextureId;
ceilingTexture?: TextureId;
fillRule?: FillRule;
```

### `createTheme()` opts — new optional fields
```typescript
texturePalette?: Partial<Record<string, TextureId>>;
roomFillRules?: Partial<Record<string, FillRule>>;
```

### `compile()` — also build CompiledVisual
After compiling the grid BLOB (unchanged), also:
1. Query rooms with new texture/fillRule columns
2. Build `CompiledVisual` object
3. Store as `levels.compiled_visual = JSON.stringify(compiledVisual)`

---

## LevelDbAdapter Changes (`src/db/LevelDbAdapter.ts`)

- Parse `level.compiledVisual` as `CompiledVisual | null`
- Expose it on `RuntimeLevel` or as a separate getter
- Export type `RuntimeCompiledVisual = CompiledVisual`

---

## Texture ID → AmbientCG File Mapping

Used in `src/r3f/level/Materials.ts`:

| TextureId   | Color                    | Normal                      | Roughness                    | Emission               |
|-------------|--------------------------|-----------------------------|-----------------------------|------------------------|
| stone       | Rock001_Color.jpg        | Rock001_NormalGL.jpg        | Rock001_Roughness.jpg        | —                      |
| stone-dark  | Rock022_Color.jpg        | Rock022_NormalGL.jpg        | Rock022_Roughness.jpg        | —                      |
| brick       | Bricks006_Color.jpg      | Bricks006_NormalGL.jpg      | Bricks006_Roughness.jpg      | —                      |
| concrete    | Concrete020_Color.jpg    | Concrete020_NormalGL.jpg    | Concrete020_Roughness.jpg    | —                      |
| ground      | Ground001_Color.jpg      | Ground001_NormalGL.jpg      | Ground001_Roughness.jpg      | —                      |
| ice         | Ice002_Color.jpg         | Ice002_NormalGL.jpg         | Ice002_Roughness.jpg         | —                      |
| ice-deep    | Ice004_Color.jpg         | Ice004_NormalGL.jpg         | Ice004_Roughness.jpg         | —                      |
| lava        | Lava001_Color.jpg        | Lava001_NormalGL.jpg        | Lava001_Roughness.jpg        | Lava001_Emission.jpg   |
| lava-dark   | Lava003_Color.jpg        | Lava003_NormalGL.jpg        | Lava003_Roughness.jpg        | —                      |
| lava-cold   | Lava004_Color.jpg        | Lava004_NormalGL.jpg        | Lava004_Roughness.jpg        | —                      |
| leather     | Leather026_Color.jpg     | Leather026_NormalGL.jpg     | Leather026_Roughness.jpg     | —                      |
| marble      | Marble006_Color.jpg      | Marble006_NormalGL.jpg      | Marble006_Roughness.jpg      | —                      |
| metal       | Metal001_Color.jpg       | Metal001_NormalGL.jpg       | Metal001_Roughness.jpg       | —                      |
| metal-dark  | Metal034_Color.jpg       | Metal034_NormalGL.jpg       | Metal034_Roughness.jpg       | —                      |
| moss        | Moss001_Color.jpg        | Moss001_NormalGL.jpg        | Moss001_Roughness.jpg        | —                      |
| tiles       | Tiles074_Color.jpg       | Tiles074_NormalGL.jpg       | Tiles074_Roughness.jpg       | —                      |

Textures are in `assets/textures/`. Load via `require()` inline (Expo bundler).
Tiling: walls 2×4, floors 4×4, ceilings 2×2.

---

## Per-Circle Texture + Fill Assignments

### Circle 1 — Limbo
Theme palette: `{ exploration: 'stone', arena: 'stone-dark', boss: 'stone-dark', secret: 'stone' }`
Room overrides:
- Vestibule: floor=stone, wall=brick
- Fog Hall: floor=moss, wall=stone, fill={scatter, ['limbo-tombstone','limbo-bone-pile','limbo-vase-rubble'], 0.08}
- Sepulcher: floor=stone, wall=brick, fill={scatter, ['limbo-sarcophagus','limbo-cracked-floor-slab'], 0.06}
- Shadow Pit: floor=stone-dark, wall=stone-dark, fill={scatter, ['limbo-inscription-tablet','limbo-fallen-column'], 0.12}
- Limbo Gate: floor=stone, wall=brick
- Boss (Minos): floor=stone-dark, wall=stone-dark

### Circle 2 — Lust
Theme palette: `{ exploration: 'marble', arena: 'marble', boss: 'tiles', secret: 'marble' }`
Room overrides:
- Palace Entry: floor=marble, wall=tiles
- Pleasure Hall: floor=marble, wall=marble, fill={scatter, ['lust-marble-vase','lust-rose-thorn-cluster','silk-curtain'], 0.08}
- Storm Gallery: floor=tiles, wall=marble
- Seduction Chamber: floor=marble, fill={scatter, ['lust-ornate-bed-wrecked','lust-velvet-drape','ornate-mirror'], 0.1}
- Wind Corridor: floor=tiles, wall=marble, fill={scatter, ['lust-wind-banner','lust-bridge-railing'], 0.1}
- Secret Bower: floor=marble, fill={scatter, ['silk-curtain','lust-golden-chalice'], 0.12}
- Boss: floor=tiles, wall=marble

### Circle 3 — Gluttony
Theme palette: `{ exploration: 'leather', arena: 'leather', boss: 'ground', secret: 'leather' }`
Room overrides:
- Entry Maw: floor=leather, wall=ground
- Gorge Hall: floor=leather, wall=leather, fill={scatter, ['gluttony-stomach-wall-growth','gluttony-maggot-mound','gluttony-mucus-web'], 0.1}
- Acid Pits: floor=ground, wall=leather, fill={scatter, ['gluttony-acid-pool-edge','gluttony-fungus-pillar'], 0.12}
- Feast Crypt: floor=ground, wall=leather, fill={scatter, ['feast-table','gluttony-rotten-crate','gluttony-rotting-barrel','gluttony-slop-bucket'], 0.08}
- Bile Lake: floor=leather, fill={scatter, ['gluttony-bile-pool-surface','bile-cauldron'], 0.07}
- Pantry: floor=ground, fill={scatter, ['gluttony-rotten-crate','gluttony-swollen-cask'], 0.15}
- Boss (Cerberus): floor=ground, wall=leather

### Circle 4 — Greed
Theme palette: `{ exploration: 'tiles', arena: 'marble', boss: 'tiles', secret: 'marble' }`
Room overrides:
- Treasury Atrium: floor=tiles, wall=marble, fill={scatter, ['coin-pile','greed-golden-vase','greed-treasure-chest'], 0.08}
- Counting Hall: floor=marble, wall=tiles, fill={scatter, ['greed-gold-bar-stack','greed-coin-cascade','coin-pile'], 0.1}
- Vault Corridor: floor=tiles, wall=marble, fill={scatter, ['greed-safe-door','greed-golden-key-display'], 0.06}
- Idol Chamber: floor=marble, fill={scatter, ['golden-idol','greed-jeweled-pedestal','greed-golden-chalice'], 0.08}
- Gear Hall: floor=metal, wall=marble, fill={scatter, ['greed-gear-mechanism','greed-gold-chain'], 0.1}
- Secret Hoard: floor=tiles, fill={scatter, ['greed-treasure-chest','greed-chest-pedestal','coin-pile'], 0.2}
- Boss (Plutus): floor=tiles, wall=tiles

### Circle 5 — Wrath
Theme palette: `{ exploration: 'concrete', arena: 'metal', boss: 'metal-dark', secret: 'concrete' }`
Room overrides:
- Iron Gate: floor=concrete, wall=metal
- Rage Pits: floor=concrete, wall=concrete, fill={scatter, ['wrath-explosive-barrel','wrath-smashed-barrier','wrath-anger-graffiti-slab'], 0.1}
- Lava Shelf: floor=lava, wall=concrete, fill={scatter, ['lava-altar','wrath-stone-island'], 0.06}
- War Hall: floor=metal, wall=concrete, fill={scatter, ['wrath-shattered-weapon-rack','wrath-war-banner','wrath-weapon-pedestal'], 0.08}
- Punishment Ring: floor=concrete, wall=metal, fill={scatter, ['wrath-rusted-cage','wrath-punching-bag-chain','wrath-chain-curtain'], 0.1}
- Forge: floor=metal, wall=metal, fill={scatter, ['wrath-anvil','wrath-rage-furnace','wrath-dented-iron-door'], 0.1}
- Watchtower: floor=concrete
- Boss (Phlegyas): floor=metal-dark, wall=metal-dark

### Circle 6 — Heresy
Theme palette: `{ exploration: 'brick', arena: 'stone-dark', boss: 'tiles', secret: 'brick' }`
Room overrides:
- Catacombs: floor=brick, wall=brick, fill={scatter, ['heresy-catacomb-torch','heresy-bone-urn','heresy-cracked-marble-pillar'], 0.1}
- Heretic Hall: floor=stone-dark, wall=brick, fill={scatter, ['heresy-church-pew','heresy-confessional-booth','heresy-torn-scripture-slab'], 0.08}
- Burning Nave: floor=tiles, wall=stone-dark, fill={scatter, ['heresy-burning-pyre','heresy-toppled-altar','heresy-shattered-icon'], 0.08}
- Forbidden Library: floor=stone-dark, wall=brick, fill={scatter, ['heresy-forbidden-bookcase','heresy-profane-symbol','heresy-corrupted-reliquary'], 0.12}
- Ritual Circle: floor=tiles, wall=stone-dark, fill={scatter, ['heresy-pentagram-floor-tile','heresy-broken-stained-glass'], 0.1}
- Secret Reliquary: floor=stone-dark, fill={scatter, ['heresy-corrupted-reliquary','heretic-tome','inverted-cross'], 0.15}
- Boss (Farinata): floor=tiles, wall=tiles

### Circle 7 — Violence
Theme palette: `{ exploration: 'metal', arena: 'metal-dark', boss: 'metal-dark', secret: 'metal' }`
Room overrides:
- Pier: floor=concrete, wall=metal
- Blood River: floor=lava-dark, wall=metal, fill={scatter, ['violence-blood-pool','violence-blood-gutter','blood-trough'], 0.08}
- River Banks: floor=concrete, wall=metal, fill={scatter, ['violence-iron-railing','violence-walkway-pillar'], 0.1}
- Thorny Passage: floor=concrete, wall=concrete, fill={scatter, ['violence-thorn-column','thorn-cluster-large'], 0.12}
- Thornwood: floor=concrete, wall=metal, fill={scatter, ['violence-thorn-column','violence-rusted-anvil','wrath-iron-grate'], 0.1}
- Burning Shore: floor=lava, wall=concrete, fill={scatter, ['violence-fire-geyser-vent','violence-stone-altar'], 0.08}
- Flamethrower Shrine: floor=metal, wall=metal
- Slaughterhouse: floor=metal-dark, wall=metal-dark, fill={scatter, ['violence-chain-conveyor','violence-hook-rack','meat-hook','torture-rack'], 0.08}
- Butcher's Hook: floor=metal-dark, fill={scatter, ['meat-hook','blood-trough'], 0.15}
- Boss (Il Macello): floor=metal-dark, wall=metal-dark

### Circle 8 — Fraud
Theme palette: `{ exploration: 'marble', arena: 'tiles', boss: 'marble', secret: 'stone-dark' }`
Room overrides:
- Grand Foyer: floor=marble, wall=tiles
- Hall of Mirrors: floor=marble, wall=marble, fill={scatter, ['fraud-mirror-shard','fraud-two-faced-bust','fraud-fake-column'], 0.1}
- Stage: floor=tiles, wall=marble, fill={scatter, ['fraud-stage-curtain','fraud-theatrical-column','fraud-silhouette-prop'], 0.08}
- Broker's Den: floor=marble, wall=tiles, fill={scatter, ['fraud-gambling-table','fraud-coin-pile','trick-chest'], 0.1}
- Shifting Maze: floor=stone-dark, wall=marble, fill={scatter, ['fraud-shifting-wall-segment','fraud-crumbling-facade','fraud-fake-column'], 0.12}
- False Treasury: floor=marble, fill={scatter, ['fraud-marble-debris','fraud-cracked-mosaic-floor'], 0.1}
- Confession Box: floor=stone-dark, fill={scatter, ['false-door','fraud-forked-tongue-relief'], 0.1}
- Hidden Sanctum: floor=stone-dark, fill={scatter, ['fraud-onyx-wall-panel','fraud-marble-pedestal'], 0.12}
- Boss (Geryon): floor=marble, wall=marble

### Circle 9 — Treachery
Theme palette: `{ exploration: 'ice', arena: 'ice-deep', boss: 'ice-deep', secret: 'ice' }`
Room overrides:
- Frozen Shore: floor=ice, wall=stone-dark
- Caina: floor=ice, wall=ice, fill={scatter, ['treachery-ice-formation','treachery-frozen-chain-cluster','treachery-betrayer-cage'], 0.1}
- Antenora: floor=ice-deep, wall=ice, fill={scatter, ['treachery-dark-ice-monolith','treachery-crystalline-spike-wall','ice-pillar'], 0.1}
- Ptolomaea: floor=ice, wall=stone-dark, fill={scatter, ['treachery-frozen-feast-table','treachery-frost-chalice','soul-cage'], 0.08}
- Judecca: floor=ice-deep, wall=ice-deep, fill={scatter, ['treachery-frozen-throne','treachery-frozen-sword','treachery-glacial-platform'], 0.08}
- Frozen Lake Crossing: floor=ice, fill={scatter, ['treachery-ice-bridge-segment','treachery-ice-crack-floor','treachery-snow-drift-mound'], 0.1}
- Devil's Keep: floor=ice-deep, fill={scatter, ['treachery-frozen-waterfall','treachery-frozen-stalactite'], 0.06}
- Boss (Lucifer): floor=ice-deep, wall=ice-deep

---

## PlaytestResult Extension (`src/db/PlaytestRunner.ts`)

Add to `PlaytestResult`:
```typescript
/** Total A* path length across all room-to-room traversals, in grid cells. */
pathDistanceCells: number;
/** Walk time estimate: pathDistanceCells / 3.0 (WALK_SPEED=6 units/s ÷ CELL_SIZE=2 = 3 cells/s) */
estimatedWalkTimeSec: number;
/** Combat time estimate: enemiesTotal × 8 seconds average per enemy */
estimatedCombatTimeSec: number;
/** Total estimated playtime with 15% exploration buffer */
estimatedTotalTimeSec: number;
/** estimatedTotalTimeSec / 60, rounded to 1 decimal */
estimatedPlayTimeMin: number;
```

Also add `pathDistanceCells` tracking inside `PlaytestRunner.run()` — sum path lengths from
all A* calls made during the simulation.

---

## Target Play Times per Circle

| Circle | Name | Target | Rationale |
|--------|------|--------|-----------|
| 1 | Limbo | 5–8 min | Tutorial — shorter is OK |
| 2 | Lust | 7–11 min | Mid-early |
| 3 | Gluttony | 8–12 min | Mid |
| 4 | Greed | 8–12 min | Mid |
| 5 | Wrath | 10–15 min | Mid-late |
| 6 | Heresy | 10–15 min | Mid-late |
| 7 | Violence | 12–18 min | Late act |
| 8 | Fraud | 12–18 min | Late act |
| 9 | Treachery | 15–22 min | Climax |

---

## LevelRenderer.tsx Architecture (`src/r3f/level/LevelRenderer.tsx`)

```
LevelRenderer
  props: { compiledVisual: CompiledVisual; propSpawns: RuntimePropSpawn[]; zones: RuntimeEnvZone[] }

  For each room in compiledVisual.rooms:
    1. Render floor plane (PlaneGeometry, size=bounds.w×bounds.h, PBR material from floorTexture)
    2. Apply fillRule: scatter props procedurally across walkable floor cells

  For each propSpawn in propSpawns (static, from DB entities):
    3. Render GLB at specific position (current DungeonProps.tsx behavior)

  NO env zone visual rendering — that's deleted entirely
```

**Procedural fill algorithm:**
- Seed deterministic PRNG with `levelId + roomId` (use existing `seedrandom`)
- Generate N = floor(bounds.w × bounds.h × density) positions
- Reject positions within 1.5 cells of any entity spawn
- Place GLB props from `fillRule.props` array (cycle through if > 1 prop)
- If `randomRotation`: random Y rotation 0–2π
- Use `useGLTF` + clone pattern (same as existing DungeonProps)

---

## R3FRoot.tsx Changes

- Remove: `<EnvironmentZones zones={envZones} />`
- Remove: `<DungeonProps spawns={propSpawns} />`
- Add: `<LevelRenderer compiledVisual={compiledVisual} propSpawns={propSpawns} zones={envZones} />`
- Remove: import of `EnvironmentZones`
- Remove: import of `DungeonProps`

Files to delete after migration:
- `src/r3f/level/EnvironmentZones.tsx` — visual rendering deleted; gameplay is in EnvironmentZoneEffects.ts

---

## Agent Workstreams

### Phase 1 (parallel)
- `schema-leditor`: schema.ts, migrate.ts, LevelEditor.ts, GridCompiler.ts, LevelDbAdapter.ts
- `playtest-metrics`: PlaytestRunner.ts, build-all-circles.ts, all 9 docs/circles/0N-*.md

### Phase 2 (parallel, after schema-leditor)
- `materials-renderer`: Materials.ts + NEW LevelRenderer.tsx + R3FRoot.tsx + delete EnvironmentZones.tsx
- `build-1-5`: build-circle-1.ts through build-circle-5.ts
- `build-6-9`: build-circle-6.ts through build-circle-9.ts

### Phase 3 (after Phase 2)
- `integration`: npx tsx scripts/build-all-circles.ts → pnpm test → fix issues → verify
