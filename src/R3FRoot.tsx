/**
 * R3FRoot — game loop orchestrator.
 *
 * Generates levels, spawns ECS entities, mounts all R3F rendering components,
 * and runs per-frame systems (AI, combat, pickups, particles, progression).
 */

import { useFrame, useThree } from '@react-three/fiber';
import { and, eq } from 'drizzle-orm';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CELL_SIZE } from './constants';
import type { DrizzleDb } from './db/connection';
import {
  type RuntimeDecal,
  type RuntimeEnvZone,
  toDecals,
  toEnvironmentZones,
  toLevelData,
  toTriggersAndEntities,
} from './db/LevelDbAdapter';
import * as schema from './db/schema';
import type { WeaponId } from './game/entities/components';
import { vec3 } from './game/entities/vec3';
import { world } from './game/entities/world';
import { BOSS_ARENA_SIZE, generateBossArena } from './game/levels/BossArenas';
import { getThemeForFloor } from './game/levels/FloorThemes';
import type { LevelData } from './game/levels/LevelData';
import { LevelGenerator, type MapCell } from './game/levels/LevelGenerator';
import { AIGovernor } from './game/systems/AIGovernor';
import { aiSystemReset, aiSystemUpdate } from './game/systems/AISystem';
import { doorSystemUpdate, resetDoorSystem } from './game/systems/DoorSystem';
import { spawnBoss, spawnLevelEntities } from './game/systems/EntitySpawner';
import { resetGameClock, tickGameClock } from './game/systems/GameClock';
import { hazardSystemUpdate, resetHazardSystem } from './game/systems/HazardSystem';
import { resetKillStreaks } from './game/systems/KillStreakSystem';
import { clearPlayerDamageBridge, setPlayerDamageBridge } from './game/systems/PlayerDamageBridge';
import { powerUpSystemUpdate, resetPowerUps } from './game/systems/PowerUpSystem';
import {
  advanceFloor,
  checkFloorComplete,
  resetFloorProgression,
} from './game/systems/ProgressionSystem';
import {
  initTriggerSystem,
  resetTriggerSystem,
  triggerSystemUpdate,
} from './game/systems/TriggerSystem';
import { initAmbientSound, updateAmbientSound } from './r3f/audio/AmbientSoundSystem';
import { getAudioContext, initAudio, loadAllSfx, setSfxBuffers } from './r3f/audio/AudioSystem';
import { initMusic, loadAllMusic, setMusicBuffers, updateMusic } from './r3f/audio/MusicSystem';
import {
  clearDamageNumbers,
  clearDamageNumbersSceneRef,
  DamageNumbers,
} from './r3f/entities/DamageNumbers';
import { EnemyColliders } from './r3f/entities/EnemyColliders';
import { EnemyRenderer } from './r3f/entities/EnemyMesh';
import { PickupRenderer } from './r3f/entities/PickupMesh';
import { inputManager } from './r3f/input/InputManager';
import { AIProvider } from './r3f/input/providers/AIProvider';
import { DecalSystem } from './r3f/level/DecalSystem';
import { DungeonProps } from './r3f/level/DungeonProps';
import { EnvironmentZones } from './r3f/level/EnvironmentZones';
import { extractColliderData, LevelColliders, LevelMeshes } from './r3f/level/LevelMeshes';
import { PlayerController } from './r3f/PlayerController';
import { R3FApp } from './r3f/R3FApp';
import { DynamicLighting } from './r3f/rendering/Lighting';
import { PostProcessingEffects, triggerFloorFadeIn } from './r3f/rendering/PostProcessing';
import {
  clearCombatScene,
  combatSystemUpdate,
  damageEnemy,
  damagePlayer,
  setCombatScene,
} from './r3f/systems/CombatSystem';
import { resetZoneEffects, updateZoneEffects } from './r3f/systems/EnvironmentZoneEffects';
import { disposeParticleResources, updateParticles } from './r3f/systems/ParticleEffects';
import { pickupSystemUpdate } from './r3f/systems/PickupSystem';
import { resetScreenShake } from './r3f/systems/ScreenShake';
import { FlamethrowerEffect } from './r3f/weapons/FlamethrowerEffect';
import { MuzzleFlashEffect } from './r3f/weapons/MuzzleFlash';
import {
  getProjectilePool,
  ProjectileManager,
  setDamageEnemyCallback,
} from './r3f/weapons/Projectile';
import {
  clearDots,
  initPlayerAmmo,
  resetFireCooldowns,
  setDotDamageCallback,
} from './r3f/weapons/WeaponSystem';
import { WeaponViewModel } from './r3f/weapons/WeaponViewModel';
import { DIFFICULTY_PRESETS, savePlayerSnapshot, useGameStore } from './state/GameStore';
import { FatalErrorModal } from './ui/FatalErrorModal';

// ---------------------------------------------------------------------------
// Fatal error context — propagates init failures from inside Canvas to R3FRoot
// ---------------------------------------------------------------------------

const FatalErrorContext = createContext<(err: Error | string) => void>(() => {});

// ---------------------------------------------------------------------------
// Level database — lazy singleton
// ---------------------------------------------------------------------------

let _levelDb: DrizzleDb | null = null;

/**
 * Initialize the level database lazily, run migrations/seeds, and set
 * the GameStore.dbReady flag. Safe to call multiple times — only the
 * first call does work.
 */
async function ensureLevelDb(): Promise<DrizzleDb> {
  if (_levelDb) return _levelDb;
  const { getDb } = await import('./db/connection');
  const { migrateAndSeed } = await import('./db/migrate');
  const db = await getDb();
  await migrateAndSeed(db);
  _levelDb = db;
  useGameStore.getState().setDbReady(true);
  return _levelDb;
}

/**
 * Try to load a level from the database matching the given encounter/circle.
 * For circle levels: matches by circleNumber (1-9) with a compiled grid.
 * For other encounter types: falls back to floor-based matching.
 * Returns null if no matching level is found or the DB is unavailable.
 */
function tryLoadFromDb(
  db: DrizzleDb,
  encounterType: 'explore' | 'boss',
  floor: number,
  bossId: string | null,
  circleNumber: number,
): LevelData | null {
  let rows: (typeof schema.levels.$inferSelect)[];

  if (encounterType === 'explore') {
    // First try to find a circle level matching the current circleNumber
    rows = db
      .select()
      .from(schema.levels)
      .where(eq(schema.levels.circleNumber, circleNumber))
      .all()
      .filter(
        (l) =>
          (l.levelType === 'procedural' || l.levelType === 'circle') && l.compiledGrid !== null,
      );

    // Fall back to floor-based matching if no circle match
    if (rows.length === 0) {
      rows = db
        .select()
        .from(schema.levels)
        .where(eq(schema.levels.floor, floor))
        .all()
        .filter(
          (l) =>
            (l.levelType === 'procedural' || l.levelType === 'circle') && l.compiledGrid !== null,
        );
    }
  } else {
    // For boss encounters, try circleNumber first, then fall back to floor
    rows = db
      .select()
      .from(schema.levels)
      .where(
        and(
          eq(schema.levels.levelType, encounterType),
          eq(schema.levels.circleNumber, circleNumber),
        ),
      )
      .all()
      .filter((l) => l.compiledGrid !== null);

    if (rows.length === 0) {
      rows = db
        .select()
        .from(schema.levels)
        .where(and(eq(schema.levels.levelType, encounterType), eq(schema.levels.floor, floor)))
        .all()
        .filter((l) => l.compiledGrid !== null);
    }
  }

  if (rows.length === 0) return null;

  // For boss encounters, prefer a level matching the specific bossId via guardian field
  let levelId: string;
  if (encounterType === 'boss' && bossId) {
    const bossMatch = rows.find((l) => l.guardian === bossId);
    levelId = bossMatch ? bossMatch.id : rows[0].id;
  } else {
    // Pick a random matching level (supports multiple hand-crafted variants)
    levelId = rows[Math.floor(Math.random() * rows.length)].id;
  }

  try {
    return toLevelData(db, levelId);
  } catch (err) {
    console.warn(`[R3FRoot] Failed to load level ${levelId} from DB:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Level generation (DB-backed with in-memory fallback)
// ---------------------------------------------------------------------------

/**
 * Load a single level from the database by ID.
 * Returns null if the level is missing or the query fails.
 */
function _generateLevelDataFromDb(db: DrizzleDb, levelId: string): LevelData | null {
  try {
    return toLevelData(db, levelId);
  } catch {
    return null;
  }
}

function generateLevelData(
  encounterType: 'explore' | 'boss',
  floor: number,
  bossId: string | null,
): LevelData {
  // Try DB first if levelSource is 'database' and DB is ready
  const { levelSource, dbReady, circleNumber } = useGameStore.getState();
  if (levelSource === 'database' && dbReady && _levelDb) {
    const dbLevel = tryLoadFromDb(_levelDb, encounterType, floor, bossId, circleNumber);
    if (dbLevel) return dbLevel;
  }

  // Fallback: in-memory procedural generation
  const theme = getThemeForFloor(floor);

  if (encounterType === 'explore') {
    const gen = new LevelGenerator(24, 24, floor);
    gen.generate();
    return {
      width: gen.width,
      depth: gen.depth,
      floor,
      grid: gen.grid,
      playerSpawn: gen.playerSpawn,
      spawns: gen.spawns,
      theme,
    };
  }

  // Boss
  const grid = generateBossArena(bossId as any) as MapCell[][];
  const size = BOSS_ARENA_SIZE;
  return {
    width: size,
    depth: size,
    floor,
    grid,
    playerSpawn: vec3(Math.floor(size / 2) * CELL_SIZE, 1, (size - 3) * CELL_SIZE),
    spawns: [],
    theme,
  };
}

// ---------------------------------------------------------------------------
// Inner scene component (must be inside Canvas + Physics)
// ---------------------------------------------------------------------------

function GameScene() {
  const scene = useThree((s) => s.scene);
  const reportFatalError = useContext(FatalErrorContext);
  const levelDataRef = useRef<LevelData | null>(null);
  const _envZonesRef = useRef<RuntimeEnvZone[]>([]);
  const graceTimerRef = useRef(2000); // Start active to prevent race with entity spawn useEffect
  const floorKeyRef = useRef(0);
  const snapshotTimerRef = useRef(0); // Throttle savePlayerSnapshot to once per second

  // Subscribe to store
  const stage = useGameStore((s) => s.stage);
  const difficulty = useGameStore((s) => s.difficulty);
  const nightmareFlags = useGameStore((s) => s.nightmareFlags);
  const dbReady = useGameStore((s) => s.dbReady);
  const levelSource = useGameStore((s) => s.levelSource);
  const circleNumber = useGameStore((s) => s.circleNumber);

  const diffMods = DIFFICULTY_PRESETS[difficulty];
  const nightmareDmgMult = nightmareFlags.nightmare || nightmareFlags.ultraNightmare ? 2 : 1;

  // Kick off lazy DB initialization on mount — errors surface as fatal modal
  useEffect(() => {
    let cancelled = false;
    async function initDb() {
      try {
        await ensureLevelDb();
      } catch (err) {
        if (cancelled) return;
        reportFatalError(
          err instanceof Error ? err : new Error(`DB initialization failed: ${String(err)}`),
        );
      }
    }
    initDb();
    return () => {
      cancelled = true;
    };
  }, [reportFatalError]);

  // Generate level when floor/encounterType/circleNumber changes, when DB
  // becomes ready, or when levelSource changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: dbReady, levelSource, circleNumber trigger re-gen from DB
  const levelData = useMemo(
    () => generateLevelData(stage.encounterType, stage.floor, stage.bossId),
    [stage.encounterType, stage.floor, stage.bossId, dbReady, levelSource, circleNumber],
  );

  // After DB becomes ready, verify a level was actually loaded from it.
  // If dbReady=true but levelData has no levelId the DB level is missing.
  useEffect(() => {
    if (!dbReady || levelSource !== 'database') return;
    if (!levelData.levelId) {
      reportFatalError(
        new Error(
          `No level found in database for circle ${circleNumber}, floor ${stage.floor}, ` +
            `type "${stage.encounterType}". Run the build-circle script for this circle ` +
            `or check that assets/levels.db is up to date.`,
        ),
      );
    }
  }, [
    dbReady,
    levelData.levelId,
    circleNumber,
    stage.floor,
    stage.encounterType,
    levelSource,
    reportFatalError,
  ]);

  // Load environment zones from DB (empty array for procedural levels)
  // biome-ignore lint/correctness/useExhaustiveDependencies: same deps as levelData memo
  const envZones = useMemo<RuntimeEnvZone[]>(() => {
    if (!_levelDb || !levelData.levelId) return [];
    try {
      return toEnvironmentZones(_levelDb, levelData.levelId);
    } catch {
      return [];
    }
  }, [
    stage.encounterType,
    stage.floor,
    stage.bossId,
    dbReady,
    levelSource,
    circleNumber,
    levelData.levelId,
  ]);

  // Load decals from DB (empty array for procedural levels)
  // biome-ignore lint/correctness/useExhaustiveDependencies: same deps as levelData memo
  const levelDecals = useMemo<RuntimeDecal[]>(() => {
    if (!_levelDb || !levelData.levelId) return [];
    try {
      return toDecals(_levelDb, levelData.levelId);
    } catch {
      return [];
    }
  }, [
    stage.encounterType,
    stage.floor,
    stage.bossId,
    dbReady,
    levelSource,
    circleNumber,
    levelData.levelId,
  ]);

  // Extract collider data
  const colliderData = useMemo(
    () => extractColliderData(levelData.grid, levelData.theme, levelData.width, levelData.depth),
    [levelData],
  );

  // Extract prop spawns for dungeon decoration rendering
  const propSpawns = useMemo(
    () => levelData.spawns.filter((s) => s.type.startsWith('prop_')),
    [levelData.spawns],
  );

  // Convert player spawn to Three.js coordinates (negate Z)
  const spawnPosition = useMemo<[number, number, number]>(
    () => [levelData.playerSpawn.x, levelData.playerSpawn.y, -levelData.playerSpawn.z],
    [levelData.playerSpawn],
  );

  // Spawn entities + player on level change
  useEffect(() => {
    // --- Capture player state BEFORE clearing entities ---
    // This preserves HP, weapons, and ammo across floor transitions.
    // IMPORTANT: Only carry over from a LIVING player (hp > 0).
    // A dead player's 0 HP must NOT be carried over to a new game,
    // because `0 ?? fallback` = 0 (nullish coalescing skips 0).
    const oldPlayer = world.entities.find((e) => e.type === 'player' && e.player);
    const isAlive = (oldPlayer?.player?.hp ?? 0) > 0;
    const carryoverHp = isAlive ? oldPlayer?.player?.hp : undefined;
    const carryoverMaxHp = isAlive ? oldPlayer?.player?.maxHp : undefined;
    const carryoverWeapon = isAlive ? oldPlayer?.player?.currentWeapon : undefined;
    const carryoverWeapons = isAlive ? oldPlayer?.player?.weapons : undefined;
    const carryoverAmmo = isAlive ? oldPlayer?.ammo : undefined;

    // Reset all systems before clearing entities
    aiSystemReset();
    resetGameClock();
    resetHazardSystem();
    resetDoorSystem();
    resetPowerUps();
    resetKillStreaks();
    resetFloorProgression();
    resetTriggerSystem();
    resetZoneEffects();
    clearDamageNumbers();
    resetScreenShake();
    resetFireCooldowns();
    clearDots();

    // Release all active projectiles (stale meshes from previous floor)
    getProjectilePool()?.releaseAll();

    // Clear all existing entities
    const existing = [...world.entities];
    for (const e of existing) {
      world.remove(e);
    }

    // Create player entity — carry over state from previous floor or restore from save
    const store = useGameStore.getState();
    const restored = store.restoredPlayerState;
    const playerMaxHp = carryoverMaxHp ?? diffMods.playerStartHp;
    const playerHp = carryoverHp ?? restored?.playerHp ?? diffMods.playerStartHp;
    const currentWeapon = (carryoverWeapon ?? restored?.currentWeapon ?? 'hellPistol') as WeaponId;
    const weapons = carryoverWeapons ?? [currentWeapon];
    const ammo = carryoverAmmo ?? initPlayerAmmo();
    world.add({
      id: 'player',
      type: 'player',
      position: { ...levelData.playerSpawn },
      player: {
        hp: playerHp,
        maxHp: playerMaxHp,
        speed: 5,
        sprintMult: 1.5,
        currentWeapon: currentWeapon,
        weapons: [...weapons],
        isReloading: false,
        reloadStart: 0,
        fuel: 100,
        fuelMax: 100,
      },
      ammo,
    });

    // Spawn level entities
    if (stage.encounterType === 'explore') {
      spawnLevelEntities(levelData, diffMods, nightmareDmgMult, nightmareFlags.nightmare);
    } else if (stage.encounterType === 'boss' && stage.bossId) {
      spawnBoss(stage.bossId, levelData, diffMods, nightmareDmgMult, nightmareFlags.nightmare);
    }
    // Initialize trigger system from DB if this level has a DB levelId
    if (levelData.levelId && _levelDb) {
      try {
        const { triggers, triggeredEntities } = toTriggersAndEntities(_levelDb, levelData.levelId);
        initTriggerSystem(triggers, triggeredEntities, levelData.grid);
      } catch (err) {
        console.warn('[R3FRoot] Failed to load triggers:', err);
      }
    }

    // Set grace period and trigger floor fade-in
    graceTimerRef.current = 2000; // 2 seconds
    triggerFloorFadeIn();

    // Update floor key to force re-render of mesh components
    floorKeyRef.current++;
    levelDataRef.current = levelData;

    // Init all audio subsystems on first interaction
    initAudio();
    initMusic();
    initAmbientSound();

    // Trigger music/ambient update for the new level
    updateMusic();
    updateAmbientSound();
  }, [levelData, stage, diffMods, nightmareDmgMult, nightmareFlags]);

  // Autoplay: register AI provider with AIGovernor for each level
  const autoplay = useGameStore((s) => s.autoplay);
  useEffect(() => {
    if (!autoplay) return;

    // Find the player entity (just created in the effect above)
    const player = world.entities.find((e) => e.type === 'player');
    if (!player) return;

    // Create a proxy camera that reads from the player's ECS position
    const aiCamera = {
      position: player.position ?? { x: 0, y: 1.6, z: 0 },
      rotation: { x: 0, y: 0 },
    };

    const governor = new AIGovernor(aiCamera, player, levelData.grid, CELL_SIZE);
    const aiProvider = new AIProvider(governor);
    inputManager.register(aiProvider);

    return () => {
      inputManager.unregister(aiProvider);
      aiProvider.dispose();
    };
  }, [autoplay, levelData]);

  // Wire combat scene ref + damage callbacks
  useEffect(() => {
    setCombatScene(scene);
    setDamageEnemyCallback((entityId, damage, _isAoe) => {
      damageEnemy(entityId, damage);
    });
    // Wire DOT damage callback (flamethrower burns)
    setDotDamageCallback((entityId, damage) => {
      damageEnemy(entityId, damage);
    });
    // Bridge for engine-agnostic AI melee → centralized damagePlayer()
    setPlayerDamageBridge((damage) => {
      return damagePlayer(damage);
    });
    return () => {
      clearCombatScene();
      setDamageEnemyCallback(() => {});
      setDotDamageCallback(() => {});
      clearDots();
      clearPlayerDamageBridge();
    };
  }, [scene]);

  // Full teardown on unmount — dispose all imperative Three.js resources
  useEffect(() => {
    return () => {
      clearDamageNumbers();
      clearDamageNumbersSceneRef();
      disposeParticleResources();
    };
  }, []);

  // One-time: load SFX + music audio buffers asynchronously
  useEffect(() => {
    let cancelled = false;
    async function loadAudioBuffers() {
      try {
        initAudio();
        initMusic();
        const ctx = getAudioContext();
        const [sfxMap, musicMap] = await Promise.all([loadAllSfx(ctx), loadAllMusic(ctx)]);
        if (cancelled) return;
        setSfxBuffers(sfxMap);
        setMusicBuffers(musicMap);
        // Now that buffers are loaded, trigger music for the current state
        updateMusic();
      } catch (err) {
        console.warn('[R3FRoot] Audio buffer loading failed:', err);
      }
    }
    loadAudioBuffers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update music + ambient when screen changes (menu, death, victory, etc.)
  // `screen` is an intentional trigger — these functions read from the store
  // but we need the effect to re-fire whenever screen transitions occur.
  const screen = useGameStore((s) => s.screen);
  // biome-ignore lint/correctness/useExhaustiveDependencies: screen is an intentional trigger
  useEffect(() => {
    updateMusic();
    updateAmbientSound();
  }, [screen]);

  // Per-frame game loop
  useFrame((_state, delta) => {
    const deltaMs = delta * 1000;
    const screen = useGameStore.getState().screen;
    if (screen !== 'playing') return;

    // Advance game clock — MUST be first, all systems depend on getGameTime()
    tickGameClock(deltaMs);

    // Grace period — skip AI/combat/progression checks
    if (graceTimerRef.current > 0) {
      graceTimerRef.current -= deltaMs;
      updateParticles(deltaMs); // particles still animate during grace
      return;
    }

    // ECS systems
    aiSystemUpdate(deltaMs);
    combatSystemUpdate(deltaMs);
    pickupSystemUpdate();
    hazardSystemUpdate();
    powerUpSystemUpdate();
    doorSystemUpdate(levelData.grid, deltaMs);
    updateParticles(deltaMs);

    // Trigger system — check player position against trigger zones
    const playerEntity = world.entities.find((e) => e.type === 'player');
    if (playerEntity?.position) {
      triggerSystemUpdate(playerEntity.position.x, playerEntity.position.z, deltaMs);
      // Environment zone effects — damage, speed mods, wind
      updateZoneEffects(playerEntity.position.x, playerEntity.position.z, envZones, deltaMs);
    }

    // Snapshot player state for save system — throttled to once per second
    // to avoid per-frame Object.fromEntries/Object.entries allocation overhead
    snapshotTimerRef.current += deltaMs;
    if (snapshotTimerRef.current >= 1000) {
      snapshotTimerRef.current = 0;
      const playerEntity = world.entities.find((e) => e.type === 'player' && e.player);
      if (playerEntity?.player && playerEntity.ammo) {
        savePlayerSnapshot({
          playerHp: playerEntity.player.hp,
          currentWeapon: playerEntity.player.currentWeapon,
          ammoReserves: Object.fromEntries(
            Object.entries(playerEntity.ammo).map(([k, v]) => [k, v.reserve]),
          ),
        });
      }
    }

    // Progression check — floor cleared when all enemies are defeated
    if (checkFloorComplete()) {
      advanceFloor();
    }
  });

  return (
    <>
      <LevelMeshes
        key={`mesh-${floorKeyRef.current}`}
        grid={levelData.grid}
        theme={levelData.theme}
        width={levelData.width}
        depth={levelData.depth}
      />
      <DungeonProps key={`props-${floorKeyRef.current}`} spawns={propSpawns} />
      <EnvironmentZones key={`envzones-${floorKeyRef.current}`} zones={envZones} />
      <DecalSystem key={`decals-${floorKeyRef.current}`} decals={levelDecals} />
      <LevelColliders
        key={`col-${floorKeyRef.current}`}
        wallPositions={colliderData.wallPositions}
        doorPositions={colliderData.doorPositions}
        platformPositions={colliderData.platformPositions}
        rampPositions={colliderData.rampPositions}
        floorWidth={colliderData.floorWidth}
        floorDepth={colliderData.floorDepth}
        floorCenterX={colliderData.floorCenterX}
        floorCenterZ={colliderData.floorCenterZ}
      />
      <PlayerController spawnPosition={spawnPosition} />
      <EnemyRenderer />
      <EnemyColliders />
      <PickupRenderer />
      <ProjectileManager />
      <WeaponViewModel />
      <MuzzleFlashEffect />
      <FlamethrowerEffect />
      <DamageNumbers />
      <DynamicLighting
        theme={levelData.theme}
        grid={levelData.grid}
        width={levelData.width}
        depth={levelData.depth}
      />
      <PostProcessingEffects />
    </>
  );
}

// ---------------------------------------------------------------------------
// Top-level export
// ---------------------------------------------------------------------------

export default function R3FRoot() {
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const reportFatalError = useCallback((err: Error | string) => {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[R3FRoot] Fatal error:', e);
    setFatalError(e);
  }, []);

  return (
    <FatalErrorContext.Provider value={reportFatalError}>
      <R3FApp>
        <GameScene />
      </R3FApp>
      {fatalError && <FatalErrorModal error={fatalError} />}
    </FatalErrorContext.Provider>
  );
}
