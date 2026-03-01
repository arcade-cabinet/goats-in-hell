---
title: "Dante's 9 Circles Level System — Design"
status: implemented
created: "2026-02-28"
updated: "2026-02-28"
domain: plans
plan_type: design
related:
  - docs/plans/2026-02-28-dante-circles-implementation-plan.md
  - docs/circles/00-player-journey.md
---

# Dante's 9 Circles Level System — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

## Vision

Replace procedural BSP dungeon generation with **9 hand-crafted levels**, one per circle of Dante's Inferno. Each circle is a self-contained, authored experience with unique environmental mechanics, a guardian goat boss, themed fodder enemies, and intentional encounter design.

**Inspiration:** Doom's WAD format — levels as data, engine as runtime. The game becomes a **descent through Hell** with authored pacing, platforming, secrets, and narrative.

---

## Game Structure

### Progression

Linear descent: Circle 1 (Limbo) → Circle 2 (Lust) → ... → Circle 9 (Treachery).

Each circle is a single level with:
- **A guaranteed critical path** from entrance to boss arena
- **Optional branches** for secrets, extra loot, lore
- **3D platforming** — multi-level rooms, vertical traversal, jumping puzzles
- **Encounter pacing** — quiet exploration → ambush → arena fight → boss
- **Environmental mechanics** unique to the circle's sin

### The 9 Circles

| Circle | Sin | Guardian Goat | Theme | Core Mechanic |
|--------|-----|---------------|-------|---------------|
| 1 | Limbo | `goat` | Gray stone, blue fog | Dense fog, disorientation |
| 2 | Lust | `fireGoat` | Red/pink, storm FX | Wind pushes player + projectiles |
| 3 | Gluttony | `hellgoat` | Blue-green, ice | Ice floors (slippery), slush (slow) |
| 4 | Greed | `goatKnight` | Gold/dark iron | Crushing walls, trap treasures |
| 5 | Anger | `shadowGoat` | Dark red/black, water | Dark water, submerged enemies |
| 6 | Heresy | `archGoat` | Orange/brown, fire | Flame jets, timed fire traps |
| 7 | Violence | `infernoGoat` | Crimson/green/yellow | 3 sub-zones (blood, thorns, fire) |
| 8 | Fraud | `voidGoat` | Purple/dark, shimmer | Illusion walls, fake floors |
| 9 | Treachery | `ironGoat` | White/blue, frost | Frozen ground, freeze aura |

---

## Level Design Principles

### 1. Guaranteed Critical Path

Every circle has an unambiguous main route:
- **Entrance** (safe, atmospheric intro)
- **Exploration zone** (2-3 rooms with light combat, pickups, environmental introduction)
- **Challenge zone** (platforming, environmental puzzles, harder encounters)
- **Boss approach** (lore, tension building, final supply cache)
- **Boss arena** (doors lock, guardian fight)

Secrets branch off the critical path but NEVER block it. The player can always reach the boss.

### 2. Three-Dimensional Exploration

Levels are NOT flat 2D grids. Each circle uses vertical space:

- **Multi-level rooms**: Upper walkways, lower pits, mezzanines
- **Platforming sequences**: Jump across gaps, climb ledges, descend into depths
- **Vertical secrets**: Look up to find hidden platforms, drop down to find secret rooms
- **Height-based gameplay**: High ground = sniping advantage, low ground = ambush vulnerability

**Height system:**
- Ground level: elevation 0
- Platforms: elevation 1 (PLATFORM_HEIGHT = 2 units)
- High platforms: elevation 2 (2 × PLATFORM_HEIGHT = 4 units)
- Ramps/stairs connect levels smoothly
- Jump pads for dramatic vertical traversal

The grid system supports this via `FLOOR_RAISED` at multiple heights and `RAMP` cells. New: `FLOOR_RAISED_HIGH` for 2nd-tier platforms. Each grid cell stores an elevation value rather than just binary raised/not-raised.

### 3. Coherent Platforming

Platforming is integral, not decorative:
- Circle 3 (Gluttony): Ice platforms over slush pits — precision jumping required
- Circle 5 (Anger): Styx river crossings on narrow stone bridges
- Circle 7 (Violence): Ascending the burning cliffs via ledges and jump pads
- Circle 8 (Fraud): Platforms that look solid but are illusions — learn to spot them
- Circle 9 (Treachery): Crumbling ice platforms over Cocytus

### 4. Encounter Design

No more random enemy scatter. Every enemy placement is intentional:

- **Patrol routes**: Enemies walk authored paths (waypoints)
- **Ambush triggers**: Enemies spawn when player enters a zone
- **Lock-and-clear**: Arena rooms lock doors, spawn waves, unlock when cleared
- **Boss telegraphing**: Environmental hints before the boss arena (larger architecture, boss sounds)
- **Circle-specific tactics**: Wind affects combat in Lust, ice changes movement in Gluttony, etc.

---

## Data Format: CircleLevel

### Core Interface

```typescript
interface CircleLevel {
  metadata: CircleMetadata;
  grid: number[][];
  width: number;
  height: number;
  playerSpawn: { x: number; z: number; facing: number };
  entities: CircleEntity[];
  triggers: CircleTrigger[];
  rooms: CircleRoom[];
  environmentZones: EnvironmentZone[];
}

interface CircleMetadata {
  circle: number;
  name: string;
  sin: string;
  guardian: string;
  theme: CircleTheme;
  music: string;
  ambientSound: string;
}

interface CircleTheme {
  primaryWall: number;
  accentWalls: number[];
  fogDensity: number;
  fogColor: string;
  ambientColor: string;
  ambientIntensity: number;
  skyColor: string;
  particleEffect?: 'storm' | 'snow' | 'ash' | 'embers' | 'frost';
}

interface CircleEntity {
  type: string;
  x: number;
  z: number;
  elevation?: number;
  patrol?: { x: number; z: number }[];
  triggerId?: string;
  overrides?: Record<string, number | boolean | string>;
  facing?: number;
}

interface CircleTrigger {
  id: string;
  zone: { x: number; z: number; w: number; h: number };
  action: 'spawnWave' | 'lockDoors' | 'unlockDoors' | 'dialogue'
        | 'ambientChange' | 'bossIntro' | 'secretReveal' | 'platformMove';
  wave?: { type: string; x: number; z: number }[];
  once: boolean;
  text?: string;
  delay?: number;
}

interface CircleRoom {
  name: string;
  bounds: { x: number; z: number; w: number; h: number };
  type: 'corridor' | 'arena' | 'puzzle' | 'secret' | 'boss' | 'hub'
      | 'platforming' | 'exploration';
  elevation?: number;
}

interface EnvironmentZone {
  type: 'wind' | 'ice' | 'water' | 'fire' | 'fog' | 'frost'
      | 'void' | 'blood' | 'illusion' | 'crushing';
  bounds: { x: number; z: number; w: number; h: number };
  intensity: number;
  direction?: { x: number; z: number };
  timer?: { on: number; off: number };
}
```

### New MapCell Types

```typescript
enum MapCell {
  // Existing (keep all)
  EMPTY = 0,
  WALL_STONE = 1,
  WALL_FLESH = 2,
  WALL_LAVA = 3,
  WALL_OBSIDIAN = 4,
  DOOR = 5,
  FLOOR_LAVA = 6,
  FLOOR_RAISED = 7,
  RAMP = 8,
  WALL_SECRET = 9,
  FLOOR_VOID = 10,

  // New circle-specific tiles
  FLOOR_ICE = 11,          // Slippery movement (Circle 3: Gluttony)
  FLOOR_SLUSH = 12,        // 50% movement slow (Circle 3)
  FLOOR_WATER = 13,        // 30% movement slow (Circle 5: Anger)
  FLOOR_WATER_DEEP = 14,   // Instant death — River Styx (Circle 5)
  FLOOR_BLOOD = 15,        // Damage over time (Circle 7: Violence)
  FLOOR_SAND_BURNING = 16, // Slow + DoT (Circle 7)
  FLOOR_FROST = 17,        // Slippery + slow DoT (Circle 9: Treachery)
  WALL_ICE = 18,           // Breakable with weapons (Circle 9)
  WALL_ILLUSION = 19,      // Renders as wall, walkable (Circle 8: Fraud)
  FLOOR_ILLUSION = 20,     // Renders as floor, fall through (Circle 8)
  WALL_GOLD = 21,          // Decorative (Circle 4: Greed)
  FLOOR_CRUSHING = 22,     // Timed crushing zone (Circle 4)
  FLOOR_RAISED_HIGH = 23,  // 2nd tier platform (2x PLATFORM_HEIGHT)
  RAMP_HIGH = 24,          // Ramp to 2nd tier
  JUMP_PAD = 25,           // Launches player upward
  FLOOR_VINES = 26,        // Entangling, slows (Circle 7 ring 2)
}
```

---

## LevelBuilder API

### Builder Class

TypeScript builder for ergonomic level authoring:

```typescript
class LevelBuilder {
  constructor(width: number, height: number, circle: number, name: string);

  // === Geometry ===
  room(name: string, x: number, z: number, w: number, h: number, opts?: {
    type?: CircleRoom['type'];
    elevation?: number; // 0 = ground, 1 = raised, 2 = high
    cell?: MapCell;
  }): this;

  corridor(fromRoom: string, toRoom: string, width?: number): this;
  stairs(x: number, z: number, fromElevation: number, toElevation: number,
         direction: 'n' | 's' | 'e' | 'w', length?: number): this;
  platform(x: number, z: number, w: number, h: number, elevation?: number): this;
  jumpPad(x: number, z: number): this;
  lavaPool(x: number, z: number, w: number, h: number): this;
  waterPool(x: number, z: number, w: number, h: number, deep?: boolean): this;
  secretRoom(wallX: number, wallZ: number, dir: 'n' | 's' | 'e' | 'w',
             w?: number, h?: number): this;
  door(x: number, z: number): this;
  bridge(x1: number, z1: number, x2: number, z2: number, width?: number): this;

  // === Entities ===
  spawnEnemy(type: string, x: number, z: number, opts?: {
    patrol?: { x: number; z: number }[];
    triggerId?: string;
    elevation?: number;
    overrides?: Record<string, any>;
  }): this;
  spawnBoss(type: string, x: number, z: number): this;
  spawnPickup(type: string, x: number, z: number, opts?: { weaponId?: string }): this;
  spawnProp(type: string, x: number, z: number, opts?: { rotation?: number }): this;

  // === Scripting ===
  trigger(id: string, zone: Rect, action: string, opts?: TriggerOpts): this;
  ambush(id: string, zone: Rect, enemies: { type: string; x: number; z: number }[]): this;
  lockOnEntry(roomName: string): this;
  dialogue(id: string, zone: Rect, text: string): this;

  // === Environment ===
  envZone(type: string, bounds: Rect, intensity: number, opts?: {
    direction?: { x: number; z: number };
    timer?: { on: number; off: number };
  }): this;
  setTheme(theme: Partial<CircleTheme>): this;
  setMetadata(meta: Partial<CircleMetadata>): this;

  // === Output ===
  build(): CircleLevel;
  toJSON(): string;
}
```

### Authoring Workflow

1. Create `src/game/levels/circles/circle{N}-{name}.ts` for each circle
2. Export a `buildCircle{N}(): CircleLevel` function
3. Use `LevelBuilder` helpers for geometry, entities, triggers
4. Register in `src/game/levels/CircleRegistry.ts` mapping circle number → builder
5. Runtime calls `getCircleLevel(n)` to get the `CircleLevel` data

---

## New Enemy Types (Circle Fodder)

Each circle gets 2-3 fodder demon types. These use existing rendering infrastructure (GLB model + fallback capsule) with new entity types:

| Circle | Fodder | HP | Speed | Special | Visual |
|--------|--------|-----|-------|---------|--------|
| 1 | `shade` | 3 | 0.02 | Passive until attacked | Translucent gray |
| 1 | `wanderer` | 4 | 0.03 | Wanders, slow melee | Hooded gray figure |
| 2 | `stormWraith` | 5 | 0.08 | Erratic wind-boosted move | Red wisp |
| 2 | `windDemon` | 6 | 0.06 | Ranged wind projectiles | Blown-about figure |
| 3 | `bloater` | 10 | 0.02 | AoE explosion on death | Fat green ooze |
| 3 | `slimeDemon` | 4 | 0.04 | Leaves slush trail | Oozing blob |
| 4 | `hoarder` | 8 | 0.03 | Drops fake gold (trap) | Gold-crusted |
| 4 | `goldGolem` | 12 | 0.02 | Armored, slow melee | Golden figure |
| 5 | `rager` | 6 | 0.05 | Berserk below 50% HP (2x speed) | Veiny red/black |
| 5 | `styxDweller` | 5 | 0.04 | Hides in water, ambush | Dark water creature |
| 6 | `tombGuard` | 7 | 0.03 | Ranged fire attack | Bandaged + fiery |
| 6 | `flameSpirit` | 4 | 0.06 | Fast, fire trail | Floating flame |
| 7 | `bloodFiend` | 8 | 0.05 | Heals in blood pools | Crimson beast |
| 7 | `thornBeast` | 6 | 0.03 | Slows player on hit | Vine creature |
| 7 | `sandWorm` | 10 | 0.04 | Burrows, emerges to attack | Segmented worm |
| 8 | `doppelganger` | 5 | 0.04 | Creates illusion clone on hit | Mimic |
| 8 | `trickster` | 3 | 0.06 | Fake death, revives once | Shimmer figure |
| 9 | `frostWraith` | 6 | 0.05 | Freeze on hit (1s stun) | Blue crystal |
| 9 | `iceGolem` | 15 | 0.015 | Heavy, shatter AoE on death | Ice statue |

---

## Guardian Goat Boss Upgrades

All 9 goats become proper bosses with phase transitions:

### Circle 1: Goat of Limbo (Guardian of the Lost)
- **Phase 1**: Summons fog clouds that block vision. Moves silently.
- **Phase 2** (50% HP): Splits into 3 fog clones (only one real, clones have 1 HP).
- **Arena**: Stone amphitheater with columns for cover, fog zones.

### Circle 2: Fire Goat of Lust (Storm Rider)
- **Phase 1**: Wind-boosted speed. Projectiles ride wind currents.
- **Phase 2** (50% HP): Creates tornado that pulls player toward center.
- **Arena**: Open storm-swept arena with scattered cover pillars.

### Circle 3: Hell Goat of Gluttony (The Bloated)
- **Phase 1**: Absorbs damage → grows bigger → devastating AoE belly slam.
- **Phase 2** (50% HP): Vomit projectile stream. Leaves slush pools on impact.
- **Arena**: Ice rink with slush pools around edges. Pillars as cover.

### Circle 4: Goat Knight of Greed (Golden Tyrant)
- **Phase 1**: Ultra-heavy gold armor. Throws gold boulders.
- **Phase 2** (50% HP): Summons gold golems. Crushing walls activate in arena.
- **Arena**: Treasure vault with crushing wall segments on timers.

### Circle 5: Shadow Goat of Anger (Wrath of the Styx)
- **Phase 1**: Permanent berserk — faster, stronger, relentless.
- **Phase 2** (50% HP): River Styx floods arena edges. Water rises over time.
- **Arena**: Circular arena over River Styx. Narrow bridges to center.

### Circle 6: Arch Goat of Heresy (The Flame Prophet)
- **Phase 1**: Casts fire from behind tomb walls. Retreats between attacks.
- **Phase 2** (50% HP): Tombs open, releasing flame spirits. Floor grates erupt.
- **Arena**: Tomb chamber with flaming coffins around perimeter.

### Circle 7: Inferno Goat of Violence (Triple Threat)
- **Phase 1** (Blood): Blood rain DoT + melee charges through blood.
- **Phase 2** (Thorns): Vine traps root player. Fights from vine cover.
- **Phase 3** (Fire): Full inferno — fire ring + projectile storm.
- **Arena**: Three-section arena representing the 3 rings of violence.

### Circle 8: Void Goat of Fraud (The Grand Deceiver)
- **Phase 1**: Illusion copies everywhere. Player must find the real one.
- **Phase 2** (50% HP): Arena shifts — walls appear and vanish dynamically.
- **Arena**: Maze-like arena with shifting illusion walls.

### Circle 9: Iron Goat of Treachery (Frozen Tyrant)
- **Phase 1**: Freeze aura slows nearby player. Heavy melee, ice armor.
- **Phase 2** (50% HP): Ice shatters, revealing expanded arena.
- **Phase 3** (25% HP): Cocytus erupts — frost everywhere, ice golems spawn.
- **Arena**: Frozen lake (Cocytus) with breakable ice platforms.

---

## Architecture Changes

### What Gets Replaced

| Old | New |
|-----|-----|
| `LevelGenerator.ts` (BSP procedural gen) | `CircleRegistry.ts` + 9 circle builder files |
| `FloorThemes.ts` (4 rotating themes) | `CircleTheme` per circle in level data |
| `BossArenas.ts` (4 boss arenas) | Boss arenas embedded in circle level data |
| `GameStore.stage` (explore/arena/boss sequencing) | Circle number (1-9) replaces stage system |
| `WaveSystem.ts` (arena wave spawning) | Trigger-based wave spawning in level data |

### What Stays (unchanged)

- `LevelMeshes.tsx` — reads `grid[][]`, renders geometry (same interface)
- `EnemyMesh.tsx` / `EnemySystem.ts` — reads entity data (same interface)
- `DungeonProps.tsx` — reads spawn data (same interface)
- `WeaponSystem.ts`, `CombatSystem.ts`, `ProjectilePool.ts` — unchanged
- `PlayerController.tsx` — unchanged (but needs env zone effects)
- `R3FApp.tsx`, `R3FScene.tsx` — unchanged
- `AudioSystem.ts`, `MusicSystem.ts` — new tracks per circle

### New Systems Needed

1. **TriggerSystem** — checks player position against trigger zones, fires actions
2. **EnvironmentZoneSystem** — applies zone effects (wind, ice, water) to player movement
3. **PatrolSystem** — moves enemies along authored patrol routes
4. **CircleLoader** — loads CircleLevel data, creates ECS entities, sets up triggers
5. **FloorEffects** — renders zone-specific floor effects (ice shimmer, water ripples, blood glow)

### File Structure

```
src/game/levels/
  CircleLevel.ts          — CircleLevel interface + types
  CircleRegistry.ts       — Maps circle number → level builder
  LevelBuilder.ts         — Builder class for authoring
  circles/
    circle1-limbo.ts
    circle2-lust.ts
    circle3-gluttony.ts
    circle4-greed.ts
    circle5-anger.ts
    circle6-heresy.ts
    circle7-violence.ts
    circle8-fraud.ts
    circle9-treachery.ts

src/game/systems/
  TriggerSystem.ts        — Trigger zone detection + action execution
  EnvironmentZoneSystem.ts — Zone effects on player movement
  PatrolSystem.ts         — Enemy patrol route following
  CircleLoader.ts         — Level loading + entity spawning
```

---

## Verification

1. Each circle level loads and renders correctly (grid + props + enemies visible)
2. Critical path is completable in every circle (entrance → boss → win)
3. Environmental mechanics work (ice slippery, wind pushes, water slows)
4. Trigger zones fire correctly (ambushes, door locks, boss intros)
5. All 9 guardian goat boss fights have phase transitions
6. Platforming sections are playable (jump across gaps, climb platforms)
7. Secrets are discoverable but optional
8. AI governor can complete at least Circle 1 via autoplay
9. Performance: 60fps on web with full circle level loaded
