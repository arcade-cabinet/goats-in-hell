/**
 * R3FRoot — game loop orchestrator.
 *
 * Generates levels, spawns ECS entities, mounts all R3F rendering components,
 * and runs per-frame systems (AI, combat, pickups, particles, progression).
 */

import { useFrame, useThree } from '@react-three/fiber';
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
import {
  createNewRun,
  initSaveSystem,
  loadLatestRun,
  markRoomVisited,
  saveCurrentState,
} from './db/GameSaveManager';
import type { RuntimeDecal, RuntimeEnvZone } from './db/LevelDbAdapter';
import type { EntityType, WeaponId } from './game/entities/components';
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
import { getCircleLevel } from './levels';
import { initAmbientSound, updateAmbientSound } from './r3f/audio/AmbientSoundSystem';
import { getAudioContext, initAudio, loadAllSfx, setSfxBuffers } from './r3f/audio/AudioSystem';
import { initMusic, loadAllMusic, setMusicBuffers, updateMusic } from './r3f/audio/MusicSystem';
import { setSceneForDevBridge } from './r3f/debug/GameDevBridge';
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
import { extractColliderData, LevelColliders, LevelMeshes } from './r3f/level/LevelMeshes';
import { LevelRenderer } from './r3f/level/LevelRenderer';
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
import {
  DIFFICULTY_PRESETS,
  type GameScreen,
  getPlayerSnapshot,
  savePlayerSnapshot,
  useGameStore,
} from './state/GameStore';
import { FatalErrorModal } from './ui/FatalErrorModal';
import { PropErrorModal } from './ui/PropErrorModal';

// ---------------------------------------------------------------------------
// Fatal error context — propagates init failures from inside Canvas to R3FRoot
// ---------------------------------------------------------------------------

const FatalErrorContext = createContext<(err: Error | string) => void>(() => {});

// ---------------------------------------------------------------------------
// Prop errors context — propagates missing-asset errors from DungeonProps to R3FRoot
// ---------------------------------------------------------------------------

const PropErrorsContext = createContext<(errors: string[]) => void>(() => {});

// ---------------------------------------------------------------------------
// Level generation (JSON-backed with procedural fallback)
// ---------------------------------------------------------------------------

function generateLevelData(
  encounterType: 'explore' | 'boss',
  floor: number,
  bossId: string | null,
): LevelData {
  const { circleNumber } = useGameStore.getState();

  if (encounterType === 'explore') {
    // Load from pre-compiled JSON (circles 1-9)
    try {
      const compiled = getCircleLevel(circleNumber);
      return {
        width: compiled.width,
        depth: compiled.depth,
        floor: compiled.floor,
        grid: compiled.grid as MapCell[][],
        playerSpawn: compiled.playerSpawn,
        spawns: compiled.spawns,
        theme: {
          ...compiled.theme,
          enemyTypes: compiled.theme.enemyTypes as EntityType[],
        },
        levelId: compiled.id,
      };
    } catch {
      // Fallback: procedural generation if JSON is missing
      const theme = getThemeForFloor(floor);
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
  }

  // Boss — continue using in-memory arena generator
  const theme = getThemeForFloor(floor);
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
  const levelDataRef = useRef<LevelData | null>(null);
  const graceTimerRef = useRef(2000); // Start active to prevent race with entity spawn useEffect
  const floorKeyRef = useRef(0);
  const snapshotTimerRef = useRef(0); // Throttle savePlayerSnapshot to once per second
  const runIdRef = useRef<string | null>(null); // Current game.db run ID
  const prevScreenRef = useRef<GameScreen>('mainMenu'); // Track screen transitions for run lifecycle

  // Subscribe to store
  const stage = useGameStore((s) => s.stage);
  const difficulty = useGameStore((s) => s.difficulty);
  const nightmareFlags = useGameStore((s) => s.nightmareFlags);
  const circleNumber = useGameStore((s) => s.circleNumber);

  const diffMods = DIFFICULTY_PRESETS[difficulty];
  const nightmareDmgMult = nightmareFlags.nightmare || nightmareFlags.ultraNightmare ? 2 : 1;

  const setLevelDisplayName = useGameStore((s) => s.setLevelDisplayName);
  const reportPropErrors = useContext(PropErrorsContext);

  // Generate level from pre-compiled JSON (circles 1-9)
  // biome-ignore lint/correctness/useExhaustiveDependencies: circleNumber triggers re-gen
  const levelData = useMemo(
    () => generateLevelData(stage.encounterType, stage.floor, stage.bossId),
    [stage.encounterType, stage.floor, stage.bossId, circleNumber],
  );

  // Sync the level theme display name to the store so HUD can show it
  useEffect(() => {
    setLevelDisplayName(levelData.theme.displayName);
  }, [levelData.theme.displayName, setLevelDisplayName]);

  // Load environment zones from compiled JSON (empty for procedural/boss levels)
  const envZones = useMemo<RuntimeEnvZone[]>(() => {
    if (!levelData.levelId) return [];
    try {
      const compiled = getCircleLevel(circleNumber);
      return compiled.envZones ?? [];
    } catch {
      return [];
    }
  }, [levelData.levelId, circleNumber]);

  // Load decals from compiled JSON (empty for procedural/boss levels)
  const levelDecals = useMemo<RuntimeDecal[]>(() => {
    if (!levelData.levelId) return [];
    try {
      const compiled = getCircleLevel(circleNumber);
      return compiled.decals ?? [];
    } catch {
      return [];
    }
  }, [levelData.levelId, circleNumber]);

  // Extract collider data
  const colliderData = useMemo(
    () => extractColliderData(levelData.grid, levelData.theme, levelData.width, levelData.depth),
    [levelData],
  );

  // Pass all spawns to DungeonProps — it filters internally via isSupportedPropType
  // (handles both old `prop_*` and Meshy `circle-N-propname` spawn types)
  const propSpawns = levelData.spawns;

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
    // Initialize trigger system from compiled JSON
    if (levelData.levelId) {
      try {
        const compiled = getCircleLevel(circleNumber);
        const triggers = compiled.triggers ?? [];
        const triggeredEntities = compiled.triggeredEntities ?? [];
        initTriggerSystem(triggers, triggeredEntities, levelData.grid);
      } catch (err) {
        console.warn('[R3FRoot] Failed to load triggers:', err);
      }
    }

    // Mark explore level as visited in game.db + in-memory store
    if (runIdRef.current && stage.encounterType === 'explore') {
      const roomId = levelData.levelId ?? `stage-${stage.stageNumber}`;
      markRoomVisited(runIdRef.current, circleNumber, roomId);
      useGameStore.getState().addVisitedRoom(circleNumber, roomId);
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
  }, [levelData, stage, diffMods, nightmareDmgMult, nightmareFlags, circleNumber]);

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

  // Wire combat scene ref + damage callbacks + dev bridge
  useEffect(() => {
    setCombatScene(scene);
    setSceneForDevBridge(scene);
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

  // Sync game.db with run lifecycle.
  // DB init is deferred to the moment the player commits to New Game or Continue —
  // not at app startup — so we know which DB state to open.
  // `screen` is the only dep — prevScreenRef mutation is intentional, not reactive state.
  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    prevScreenRef.current = screen;
    const store = useGameStore.getState();

    // New game: init save DB fresh, then create a new run.
    // Triggered on 'loading' (which is now the transition from 'newGame')
    // so the DB is ready before gameplay begins.
    if (screen === 'loading' && prevScreen === 'newGame') {
      initSaveSystem()
        .then(() =>
          createNewRun({
            seed: store.seed,
            difficulty: store.difficulty,
            nightmareFlags: store.nightmareFlags,
          }),
        )
        .then((id) => {
          runIdRef.current = id;
        })
        .catch(() => {});
    }

    // Continue (mainMenu → loading → playing): init save DB and restore the active run.
    if (screen === 'loading' && prevScreen === 'mainMenu') {
      initSaveSystem()
        .then(() => loadLatestRun())
        .then((save) => {
          if (save) runIdRef.current = save.runId;
        })
        .catch(() => {});
    }

    // Stage complete: save progress to game.db (fire-and-forget).
    if ((screen === 'victory' || screen === 'bossIntro') && runIdRef.current) {
      const snapshot = getPlayerSnapshot();
      const diffMods = DIFFICULTY_PRESETS[store.difficulty];
      saveCurrentState({
        runId: runIdRef.current,
        seed: store.seed,
        difficulty: store.difficulty,
        nightmareFlags: store.nightmareFlags,
        stage: {
          circleNumber: store.circleNumber,
          stageNumber: store.stage.stageNumber,
          floor: store.stage.floor,
          encounterType: store.stage.encounterType,
          bossId: store.stage.bossId,
        },
        player: {
          hp: snapshot.playerHp ?? diffMods.playerStartHp,
          maxHp: diffMods.playerStartHp,
          currentWeapon: snapshot.currentWeapon ?? 'hellPistol',
          level: store.leveling.level,
          xp: store.leveling.xp,
          xpToNext: store.leveling.xpToNext,
          score: store.score,
          kills: store.kills,
          totalKills: store.totalKills,
          mandatoryKills: store.mandatoryKills,
          optionalKills: store.optionalKills,
        },
        ammo: snapshot.ammoReserves ?? {},
        bossesDefeated: store.bossesDefeated,
        visitedRooms: store.visitedRooms,
        settings: {
          masterVolume: store.masterVolume,
          mouseSensitivity: store.mouseSensitivity,
          touchLookSensitivity: store.touchLookSensitivity,
          gamepadLookSensitivity: store.gamepadLookSensitivity,
          gamepadDeadzone: store.gamepadDeadzone,
          gyroSensitivity: store.gyroSensitivity,
          gyroEnabled: store.gyroEnabled,
          hapticsEnabled: store.hapticsEnabled,
        },
      }).catch(() => {});
    }
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
      <LevelRenderer
        key={`renderer-${floorKeyRef.current}`}
        compiledVisual={levelData.compiledVisual ?? null}
        propSpawns={propSpawns}
        onPropErrors={reportPropErrors}
      />
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

  const [propErrors, setPropErrors] = useState<string[]>([]);
  const reportPropErrors = useCallback((errors: string[]) => {
    for (const e of errors) console.error('[DungeonProps] Asset not registered:', e);
    setPropErrors(errors);
  }, []);

  // game.db is initialized lazily when the player starts or continues a game,
  // not at app startup. See the screen-transition effect in GameScene.

  return (
    <FatalErrorContext.Provider value={reportFatalError}>
      <PropErrorsContext.Provider value={reportPropErrors}>
        <R3FApp>
          <GameScene />
        </R3FApp>
        {fatalError && <FatalErrorModal error={fatalError} />}
        {propErrors.length > 0 && (
          <PropErrorModal errors={propErrors} onDismiss={() => setPropErrors([])} />
        )}
      </PropErrorsContext.Provider>
    </FatalErrorContext.Provider>
  );
}
