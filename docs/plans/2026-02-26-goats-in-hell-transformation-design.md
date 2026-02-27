# Goats in Hell - Game Transformation Design

**Date:** 2026-02-26
**Approach:** Evolve In-Place (Approach A)
**Platform:** Cross-platform (Web + iOS + Android)
**Visual Style:** Modern Hellscape (PBR, dynamic lighting, post-processing)
**UI Layer:** 21st.dev Magic components for menus/HUD

## Summary

Transform the existing Reactylon Native + Babylon.js + Miniplex ECS game from a proof-of-concept into a fully playable, visually stunning FPS featuring goats in hell. Port best features from the standalone HTML raycaster. Add multiple game modes, expanded enemy types, weapon arsenal, and modern rendering pipeline.

## Architecture

### Tech Stack (existing, enhanced)

- **Reactylon 3.5.4** - Declarative Babylon.js JSX components
- **Babylon.js 8.53** - 3D rendering, physics, post-processing
- **React Native 0.74** - Cross-platform runtime
- **Miniplex 2.0** - Entity-Component-System
- **21st.dev Magic** - UI components for menus/HUD overlay
- **Havok** - Physics engine (to add)

### Project Structure

```
src/
  App.tsx                        # Entry - routes to game/menu
  game/
    GameEngine.tsx               # Main scene (evolved from existing)
    systems/
      AISystem.ts                # Enemy behavior + pathfinding
      CombatSystem.ts            # Damage, death, projectiles
      PickupSystem.ts            # Item collection
      WaveSystem.ts              # Arena mode wave spawning
      ProgressionSystem.ts       # Floor progression, difficulty
      PhysicsSystem.ts           # Havok integration
    entities/
      components.ts              # ECS types (expanded)
      world.ts                   # Miniplex world
      PlayerEntity.tsx           # Player rendering + controls
      EnemyEntity.tsx            # Enemy rendering + behavior
      ProjectileEntity.tsx       # Bullets, fireballs
      PickupEntity.tsx           # Health, ammo, power-ups
      DoorEntity.tsx             # Interactive doors
    levels/
      LevelGenerator.ts          # Enhanced procedural gen
      FloorThemes.ts             # Hell themes
      BossArenas.ts              # Boss room templates
      ArenaGenerator.ts          # Survival mode arenas
    weapons/
      WeaponSystem.ts            # Weapon state machine
      weapons.ts                 # Weapon definitions
      WeaponEffects.tsx          # Muzzle flash, tracers
    rendering/
      PostProcessing.ts          # Bloom, glow, vignette, shake
      Materials.ts               # PBR material definitions
      Lighting.ts                # Dynamic lights, shadows
      Particles.ts               # Fire, blood, smoke, lava
  ui/
    MainMenu.tsx                 # Title screen
    HUD.tsx                      # Health, ammo, minimap
    PauseMenu.tsx                # Pause/settings
    DeathScreen.tsx              # Game over + stats
    VictoryScreen.tsx            # Floor clear
    ModeSelect.tsx               # Game mode selection
  state/
    GameState.ts                 # Global state
    PlayerProgress.ts            # Persistent stats
  constants.ts                   # Colors, sizes, tuning
  EngineWrapper.tsx / .web.tsx   # Platform engine init (existing)
```

## Visual System

### Materials

Replace `StandardMaterial` with `PBRMetallicRoughnessMaterial` for all surfaces:

- **Stone walls:** Rough (0.9), dark gray, subtle normal variation
- **Flesh walls:** Medium roughness (0.6), red emissive pulsing, subsurface scattering look
- **Lava walls:** Low roughness (0.3), high emissive orange, animated emissive intensity
- **Obsidian walls:** Very low roughness (0.15), high metallic (0.9), dark purple reflections
- **Floor:** Dark stone, roughness 0.85
- **Ceiling:** Dark flesh, roughness 0.7, subtle red emissive

Use Babylon.js `DynamicTexture` or `ProceduralTexture` for variety without asset files.

### Lighting

- **Hemispheric light** (existing): Reddish ambient, intensity 0.4
- **Point lights** at lava walls: Orange-red, range 6, flickering via render observable
- **Player spotlight:** Subtle forward flashlight, shadow generator attached
- **Boss room lights:** Dramatic red/orange spots, fire glow

### Post-Processing

```
DefaultRenderingPipeline:
  bloomEnabled: true, weight: 0.4
  fxaaEnabled: true
  glowLayerEnabled: true, intensity: 0.8
  imageProcessing:
    vignetteEnabled: true, weight: 2.5
    contrast: 1.3
    exposure: 0.9

Custom effects:
  Screen shake: Camera position offset on hit/shoot (decay over 200ms)
  Damage vignette: Red overlay opacity mapped to (1 - hp/maxHp)
  Death transition: Grayscale + blur ramp
```

### Particle Systems

- **Lava walls:** Rising ember particles (lifetime 2s, upward velocity)
- **Enemy death:** Red burst (50 particles, spread, fade over 0.5s)
- **Muzzle flash:** Orange burst (20 particles, forward cone, 100ms)
- **Boss ambient:** Fire ring (continuous, radius 3)
- **Pickup glow:** Rotating sparkle particles

## Gameplay Systems

### Weapons (4 total)

| Weapon | Damage | Ammo | Fire Rate | Range | Special |
|--------|--------|------|-----------|-------|---------|
| Hell Pistol | 3 | 8 mag | Medium | Long | Starting weapon, reliable |
| Brimstone Shotgun | 2x6 pellets | 4 mag | Slow | Short | Spread, devastating close |
| Hellfire Cannon | 2 | 40 mag | Fast | Medium | Rapid fire, projectile |
| Goat's Bane | 50 | 3 mag | Very slow | All | AoE explosion, rare ammo |

Weapon switching via 1-4 keys (web) or virtual buttons (mobile).

### Enemy Types (6 total)

| Type | HP | Speed | Damage | Behavior |
|------|-----|-------|--------|----------|
| Goat | 5 | 0.04 | 5 | Basic melee, direct chase |
| Hell Goat | 8 | 0.06 | 8 | Faster, charge attack |
| Fire Goat | 6 | 0.03 | 4/shot | Ranged fireball, maintains distance |
| Shadow Goat | 4 | 0.07 | 10 | Semi-invisible, ambush |
| Goat Knight | 15 | 0.03 | 12 | Armored, blocks first hits |
| Arch-Goat (Boss) | 100 | 0.02 | 15 | Multi-phase, summons, AoE |

### Game Modes

**Roguelike (Primary):**
- Procedurally generated floors of increasing size/difficulty
- Boss every 5 floors
- Permadeath with persistent unlocks
- Weapon pickups between floors

**Arena Survival:**
- Single procedural arena
- Escalating waves
- Score multiplier for streaks
- Local leaderboard

**Campaign (Stretch Goal):**
- 9 themed "Circles of Hell" levels
- Hand-designed boss encounters
- Story beats between levels

### Level Generation Enhancements

Upgrade the existing Drunkard's Walk:

- **Floor themes:** Each floor gets a theme (Fire Pits, Flesh Caverns, Obsidian Fortress, The Void) affecting wall types, lighting, and enemy distribution
- **Room types:** Combat rooms, treasure rooms, boss arenas, corridors
- **Guaranteed connectivity:** Ensure player can reach all rooms
- **Difficulty scaling:** More enemies, tougher types, less ammo on higher floors
- **Boss arenas:** Special large room with pillars for cover, spawned at floor 5/10/15/etc.

## UI (21st.dev Magic)

### HUD

- **Health bar:** Bottom-left, red gradient, pulses below 25%
- **Ammo counter:** Bottom-right, magazine dots + total count
- **Minimap:** Top-right, fog-of-war, explored areas visible
- **Crosshair:** Center, expands on movement
- **Floor indicator:** Top-left, "FLOOR 3 - FLESH PITS"
- **Kill/score counter:** Top-center

### Menus

- **Main menu:** Animated title, fire particle BG, mode buttons
- **Pause menu:** Translucent overlay, resume/settings/quit
- **Death screen:** Stats (kills, accuracy, floors), restart
- **Victory screen:** Floor clear animation, continue

## Controls

### Web
- WASD: Move
- Mouse: Look
- Left click: Shoot
- R: Reload
- 1-4: Weapon switch
- Shift: Sprint
- Escape: Pause

### Mobile
- Left joystick: Move
- Right swipe: Look
- Tap right side: Shoot
- Virtual buttons: Weapon switch, reload

## Features Ported from HTML Version

- Screen shake on hit/shoot
- Gun flash effect as muzzle flash particles
- Minimap display
- Level progression with stat tracking
- Damage vignette effect
- 3 hand-crafted level layouts as campaign templates
