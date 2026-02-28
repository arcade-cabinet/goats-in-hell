import {
  Color3,
  Color4,
  FreeCamera,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useScene} from 'reactylon';
import type {Entity, EntityType, WeaponId} from './entities/components';
import {world} from './entities/world';
import {
  CELL_SIZE,
  LevelGenerator,
  MapCell,
} from './levels/LevelGenerator';
import type {FloorTheme} from './levels/FloorThemes';
import {getThemeForFloor} from './levels/FloorThemes';
import {generateArena, getArenaPlayerSpawn} from './levels/ArenaGenerator';
import {generateBossArena, BOSS_ARENA_SIZE} from './levels/BossArenas';
import {setActiveLevel, clearActiveLevel} from './levels/activeLevelRef';
import {GameState} from '../state/GameState';

// Systems
import {aiSystemUpdate, aiSystemReset} from './systems/AISystem';
import {combatSystemUpdate} from './systems/CombatSystem';
import {pickupSystemUpdate, setPickupScene} from './systems/PickupSystem';
import {
  checkFloorComplete,
  advanceFloor,
  checkPlayerDeath,
  triggerDeath,
} from './systems/ProgressionSystem';
import {initAudio, setMasterVolume, playSound as playSfx} from './systems/AudioSystem';
import {initMusic, setMusicMasterVolume, updateMusic, disposeMusic} from './systems/MusicSystem';
import {updateAmbientSound, disposeAmbientSound} from './systems/AmbientSoundSystem';
import {loadAllAssets} from './systems/AssetPipeline';
import {spawnLevelEntities, spawnBoss, ENEMY_TYPES} from './systems/EntitySpawner';
import {
  waveSystemUpdate,
  resetWaveSystem,
  getWaveInfo,
} from './systems/WaveSystem';
import {doorSystemUpdate, resetDoorSystem} from './systems/DoorSystem';
import {hazardSystemUpdate, resetHazardSystem, setHazardScene} from './systems/HazardSystem';
import {resetKillStreaks} from './systems/KillStreakSystem';
import {checkSecretWalls, resetSecrets, getSecretsFound} from './systems/SecretRoomSystem';
import {powerUpSystemUpdate, resetPowerUps, getSpeedMultiplier} from './systems/PowerUpSystem';
import {tickGameClock, resetGameClock, getGameTime} from './systems/GameClock';
import {disposeAllEnemyColliders, removeEnemyCollider} from './systems/PhysicsSetup';
import {
  tryShoot,
  tryReload,
  updateReload,
  switchWeapon,
  initPlayerAmmo,
  getShotStats,
  resetShotStats,
} from './weapons/WeaponSystem';

// Rendering
import {
  createWallMaterial,
  createFloorMaterial,
  createCeilingMaterial,
} from './rendering/Materials';
import {buildLevelMeshes, disposeLevelMeshes} from './rendering/LevelMeshBuilder';
import {
  createLavaLights,
  createMuzzleFlashLight,
  createPlayerSpotlight,
  disposeMuzzleFlash,
  updateFlickerLights,
  updateMuzzleFlash,
} from './rendering/Lighting';
import type {DynamicLight} from './rendering/Lighting';
import {
  setupPostProcessing,
  updateScreenEffects,
  disposePostProcessing,
  setSprinting,
  triggerFloorFadeIn,
} from './rendering/PostProcessing';
import {createDeathBurst, createMuzzleFlash, createLavaEmbers, createProjectileTrail, createSpawnEffect, createBiomeParticles} from './rendering/Particles';
import {placeGoreDecal, disposeAllDecals} from './rendering/GoreDecals';
import {
  createGoatMesh,
  disposeGoatMesh,
  disposeGoatCache,
} from './rendering/GoatMeshFactory';
import {clearLoreRegistry} from './rendering/LoreMessages';
import {AIGovernor} from './systems/AIGovernor';
import {BabylonHUD, resetBossPhase, triggerEnvKill, showFloorStats, isFloorStatsActive} from './ui/BabylonHUD';
import {BabylonScreens} from './ui/BabylonScreens';
import {DamageNumbers3D} from './ui/DamageNumbers3D';
import {WeaponViewModel, triggerLandingDip} from './ui/WeaponViewModel';
import {LoadingScreen} from './ui/LoadingScreen';
import {TouchControls, touchInput, resetTouchInput, isTouchDevice} from './ui/TouchControls';
import {useGameStore, DIFFICULTY_PRESETS, getLevelBonuses} from '../state/GameStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** WeakMap to store glow ring references on pickup meshes (avoids `as any` casts). */
const meshGlowRings = new WeakMap<Mesh, Mesh>();

/** WeakMap to store cleanup callbacks on cameras (avoids `as any` casts). */
const cameraCleanups = new WeakMap<UniversalCamera, () => void>();

/** Footstep distance threshold (world units). */
const FOOTSTEP_DISTANCE = 1.5;

// ---------------------------------------------------------------------------
// Level data interface (unifies LevelGenerator, ArenaGenerator, BossArenas)
// ---------------------------------------------------------------------------

export interface LevelData {
  width: number;
  depth: number;
  floor: number;
  grid: MapCell[][];
  playerSpawn: Vector3;
  spawns: Array<{type: string; x: number; z: number; weaponId?: string; rotation?: number}>;
  theme: FloorTheme;
}

// Re-export for backward compatibility
export {getEnemyStats} from './entities/enemyStats';

// ---------------------------------------------------------------------------
// Main Game Engine
// ---------------------------------------------------------------------------

export function GameEngine() {
  const scene = useScene();
  const [level, setLevel] = useState<LevelData | null>(null);
  const lavaLightsRef = useRef<DynamicLight[]>([]);
  const spotlightRef = useRef<{
    light: import('@babylonjs/core').SpotLight;
    shadowGen: import('@babylonjs/core').ShadowGenerator;
  } | null>(null);
  const gameInitialized = useRef(false);
  const lavaTickRef = useRef<number | null>(null);
  const footstepAccum = useRef(0);
  const lastFootstepPos = useRef(Vector3.Zero());
  const propMeshesRef = useRef<Mesh[]>([]);
  const levelMeshesRef = useRef<Mesh[]>([]);
  const assetsLoadedRef = useRef(false);
  const [reinitCounter, setReinitCounter] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadLabel, setLoadLabel] = useState('Initializing...');
  const loadingScreenRef = useRef<LoadingScreen | null>(null);

  // Listen for screen transitions to 'playing' to regenerate the level
  useEffect(() => {
    let prevScreen = '';
    return GameState.subscribe(state => {
      // Detect transitions INTO 'playing' from victory/bossIntro screens
      if (state.screen === 'playing' && gameInitialized.current) {
        if (prevScreen === 'victory' || prevScreen === 'bossIntro' || prevScreen === 'menu') {
          gameInitialized.current = false;
          setReinitCounter(n => n + 1);
        }
      }
      prevScreen = state.screen;
    });
  }, []);

  // Manage loading screen lifecycle
  useEffect(() => {
    if (!scene) return;
    if (assetsReady) {
      // Dispose loading screen when done
      if (loadingScreenRef.current) {
        loadingScreenRef.current.dispose();
        loadingScreenRef.current = null;
      }
    } else {
      // Create or update loading screen
      if (!loadingScreenRef.current) {
        loadingScreenRef.current = new LoadingScreen(scene);
      }
      loadingScreenRef.current.update(loadProgress, loadLabel);
    }
  }, [scene, assetsReady, loadProgress, loadLabel]);

  // Load all 3D models, textures, and audio assets on first mount
  useEffect(() => {
    if (assetsLoadedRef.current) return;
    assetsLoadedRef.current = true;

    (async () => {
      try {
        await loadAllAssets(scene, (pct, label) => {
          setLoadProgress(pct);
          setLoadLabel(label);
        });
        setAssetsReady(true);
      } catch (err) {
        console.error('Asset loading FAILED:', err);
        throw err;
      }
    })();
  }, [scene]);

  // Initialize level and spawn entities — only after assets finish loading
  useEffect(() => {
    if (!assetsReady) return;
    if (gameInitialized.current) return;
    gameInitialized.current = true;

    initAudio();
    setMasterVolume(useGameStore.getState().masterVolume);
    initMusic();
    setMusicMasterVolume(useGameStore.getState().masterVolume);

    const initState = GameState.get();
    const storeState = useGameStore.getState();
    const floor = initState.floor;
    const encounterType = storeState.stage.encounterType;
    const diffMods = DIFFICULTY_PRESETS[storeState.difficulty];
    const nightmareDmgMult =
      storeState.nightmareFlags.nightmare || storeState.nightmareFlags.ultraNightmare ? 2 : 1;
    const theme = getThemeForFloor(floor);

    // --- Generate level data based on encounter type ---
    let levelData: LevelData;

    if (encounterType === 'arena') {
      const ARENA_SIZE = 24;
      const arenaGrid = generateArena(ARENA_SIZE, floor) as MapCell[][];
      const spawn = getArenaPlayerSpawn(ARENA_SIZE);
      levelData = {
        width: ARENA_SIZE,
        depth: ARENA_SIZE,
        floor,
        grid: arenaGrid,
        playerSpawn: new Vector3(spawn.x * CELL_SIZE, 1, spawn.z * CELL_SIZE),
        spawns: [], // WaveSystem handles enemy spawning
        theme,
      };
    } else if (encounterType === 'boss') {
      const bossId = storeState.stage.bossId ?? 'archGoat';
      const bossTypeForArena: EntityType = ENEMY_TYPES.includes(bossId as EntityType) ? (bossId as EntityType) : 'archGoat';
      const bossGrid = generateBossArena(bossTypeForArena) as MapCell[][];
      levelData = {
        width: BOSS_ARENA_SIZE,
        depth: BOSS_ARENA_SIZE,
        floor,
        grid: bossGrid,
        playerSpawn: new Vector3(
          Math.floor(BOSS_ARENA_SIZE / 2) * CELL_SIZE,
          1,
          2 * CELL_SIZE,
        ),
        spawns: [], // Boss spawned manually below
        theme,
      };
    } else {
      const gen = new LevelGenerator(30, 30, floor);
      gen.generate();
      levelData = {
        width: gen.width,
        depth: gen.depth,
        floor,
        grid: gen.grid,
        playerSpawn: gen.playerSpawn.clone(),
        spawns: gen.spawns,
        theme: gen.theme,
      };
    }

    setLevel(levelData);
    setActiveLevel(levelData.grid, levelData.width, levelData.depth);

    // Reset game chronometer for each floor (game time is per-floor)
    resetGameClock();

    // Reset wave system for arena encounters
    if (encounterType === 'arena') {
      resetWaveSystem();
    }

    // Reset door states for new floor
    resetDoorSystem();
    resetHazardSystem();
    resetKillStreaks();
    resetPowerUps();
    resetBossPhase();
    clearLoreRegistry();
    resetSecrets();
    disposeAllDecals();
    setHazardScene(scene);
    setPickupScene(scene);

    // --- Preserve player HP across floors ---
    let preservedHp: number | null = null;
    let preservedWeapons: WeaponId[] | null = null;
    let preservedAmmo: Record<WeaponId, {current: number; reserve: number; magSize: number}> | null = null;
    if (floor > 1) {
      const prevPlayer = world.entities.find((e: Entity) => e.type === 'player');
      if (prevPlayer?.player) {
        preservedHp = prevPlayer.player.hp;
        preservedWeapons = [...prevPlayer.player.weapons];
      }
      if (prevPlayer?.ammo) {
        preservedAmmo = JSON.parse(JSON.stringify(prevPlayer.ammo));
      }
    }

    // Clear existing entities and YUKA state from previous floor
    aiSystemReset();
    while (world.entities.length > 0) {
      world.remove(world.entities[0]);
    }

    // Spawn player
    const maxHp = diffMods.playerStartHp;
    const startHp = preservedHp !== null ? Math.max(1, preservedHp) : maxHp;
    const startWeapons = preservedWeapons ?? ['hellPistol'] as WeaponId[];
    const startAmmo = preservedAmmo ?? initPlayerAmmo();

    world.add({
      id: 'player-1',
      type: 'player',
      position: levelData.playerSpawn.clone(),
      rotation: Vector3.Zero(),
      player: {
        hp: startHp,
        maxHp,
        speed: 0.1,
        sprintMult: 1.5,
        currentWeapon: startWeapons[startWeapons.length - 1],
        weapons: startWeapons,
        isReloading: false,
        reloadStart: 0,
      },
      ammo: startAmmo,
    });

    // --- Spawn entities from level data (with difficulty scaling) ---
    const isNightmare = storeState.nightmareFlags.nightmare || storeState.nightmareFlags.ultraNightmare;
    const spawnedPropMeshes = spawnLevelEntities(levelData, diffMods, nightmareDmgMult, isNightmare, scene);
    propMeshesRef.current.push(...spawnedPropMeshes);

    // --- Spawn boss entity for boss encounters ---
    if (encounterType === 'boss') {
      const bossId = storeState.stage.bossId ?? 'archGoat';
      spawnBoss(bossId, levelData, diffMods, nightmareDmgMult, isNightmare);
    }

    // Set up post-processing - retry until camera exists
    let postProcSetup = false;
    const trySetupPostProc = () => {
      if (postProcSetup) return;
      if (scene.activeCamera) {
        setupPostProcessing(scene, scene.activeCamera);
        postProcSetup = true;
      }
    };
    // Try immediately, then on each render until successful
    trySetupPostProc();
    const postProcObserver = scene.onBeforeRenderObservable.add(() => {
      if (!postProcSetup) trySetupPostProc();
    });

    // Set up lava lights
    lavaLightsRef.current = createLavaLights(
      levelData.grid.map(row => row.map(c => c as number)),
      CELL_SIZE,
      scene,
    );

    // Spawn lava ember particles at light positions
    const lavaParticles: import('@babylonjs/core').ParticleSystem[] = [];
    for (const dl of lavaLightsRef.current) {
      lavaParticles.push(createLavaEmbers(dl.light.position.clone(), scene));
    }

    // Biome ambient particles — follow camera for always-visible atmosphere
    const biomeParticleSystem = createBiomeParticles(levelData.theme.name, scene);

    // Set up player spotlight with dynamic shadows
    spotlightRef.current = createPlayerSpotlight(scene);

    // Create muzzle flash dynamic light
    createMuzzleFlashLight(scene);

    // Create Babylon.js GUI HUD, 3D damage numbers, weapon viewmodel, and screen overlays
    const hud = new BabylonHUD(scene);
    const screens = new BabylonScreens(scene);
    const dmgNumbers = new DamageNumbers3D(scene);
    const viewmodel = new WeaponViewModel(scene);

    // Store previous enemy count for death burst detection
    let prevEnemyIds = new Set(
      world.entities.filter(e => e.enemy).map(e => e.id),
    );

    // Grace period: 2 seconds of invulnerability at floor start
    const GRACE_PERIOD_MS = 2000;
    const graceEnd = performance.now() + GRACE_PERIOD_MS;

    // Cinematic fade-from-black when entering a new floor
    triggerFloorFadeIn();

    // Boss mid-fight resupply flag (spawn extra ammo when boss hits 50% HP)
    // Declared here in the effect closure — resets on each floor init which is correct.
    // Using a closure variable is fine because reinitCounter triggers a full cleanup + re-run.
    let bossResupplyTriggered = false;
    // Note: if the effect re-runs mid-boss (shouldn't happen, but guard anyway),
    // the old game loop is unsubscribed by the cleanup return, so no double-spawns.

    // Death slow-mo state — when player dies, slow time for dramatic effect
    const DEATH_SLOWMO_DURATION = 1200; // ms of slow-mo before death screen
    const DEATH_SLOWMO_SCALE = 0.25;    // 25% speed during death
    let deathSlowMoTimer = 0;           // 0 = not dying, >0 = ms remaining
    let deathSlowMoActive = false;

    // Floor completion stats — show briefly before transitioning
    let floorCompleteTriggered = false;
    let floorStartTime = getGameTime();

    function triggerFloorComplete(): void {
      if (floorCompleteTriggered) return;
      floorCompleteTriggered = true;

      const shotStats = getShotStats();
      const accuracy = shotStats.fired > 0
        ? Math.round((shotStats.hit / shotStats.fired) * 100)
        : 0;
      const elapsed = Math.round((getGameTime() - floorStartTime) / 1000);

      showFloorStats({
        kills: useGameStore.getState().kills,
        accuracy,
        secrets: getSecretsFound(),
        timeSeconds: elapsed,
      });
    }

    // Main game loop
    let lastTime = performance.now();
    const gameLoop = () => {
      const gs = GameState.get();

      // Music track auto-switching based on game state
      updateMusic();
      updateAmbientSound();

      // Screen overlays (death, victory, pause, etc.) must update every frame
      screens.update();

      if (gs.screen !== 'playing') return;

      const now = performance.now();
      let dt = now - lastTime;
      lastTime = now;

      // Death slow-mo: scale dt and tilt camera during dying phase
      if (deathSlowMoActive) {
        const rawDt = dt;
        dt *= DEATH_SLOWMO_SCALE;
        deathSlowMoTimer -= rawDt; // countdown uses real time

        // Camera death tilt — slowly lean to the right and look down
        const cam = scene.activeCamera as FreeCamera;
        if (cam) {
          const progress = 1 - Math.max(0, deathSlowMoTimer / DEATH_SLOWMO_DURATION);
          cam.rotation.z += progress * 0.002; // gradual roll
          cam.position.y -= progress * 0.003; // sink toward ground
        }

        if (deathSlowMoTimer <= 0) {
          deathSlowMoActive = false;
          // Reset camera roll before death screen
          const cam2 = scene.activeCamera as FreeCamera;
          if (cam2) cam2.rotation.z = 0;
          triggerDeath();
          return;
        }
      }

      // Advance the game chronometer (only ticks during active gameplay)
      tickGameClock(dt);

      // Find player
      const player = world.entities.find((e: Entity) => e.type === 'player');
      if (!player) return;

      // Apply level-up bonuses to player max HP (damage mult is in WeaponSystem)
      if (player.player) {
        const bonuses = getLevelBonuses(useGameStore.getState().leveling.level);
        player.player.maxHp = maxHp + bonuses.maxHpBonus;
        // Speed multiplier applied via camera in PlayerController
      }

      const inGracePeriod = now < graceEnd;

      // 1. AI update (skip during grace period so enemies don't attack)
      if (!inGracePeriod) {
        aiSystemUpdate(dt);
      }

      // 2. Combat (projectile movement + collision) - skip during grace
      if (!inGracePeriod) {
        combatSystemUpdate(dt);
      }

      // 2b. Environmental hazards (spikes, barrels)
      if (!inGracePeriod) {
        hazardSystemUpdate();
      }

      // 3. Pickups
      pickupSystemUpdate();

      // 3c. Power-up buff timers
      powerUpSystemUpdate();

      // 3b. Door proximity check and animation
      doorSystemUpdate(scene, levelData.grid, dt);

      // 3c. Secret wall discovery
      if (player.position) {
        checkSecretWalls(scene, player.position, levelData, levelMeshesRef.current);
      }

      // 4. Weapon reload
      updateReload(player);

      // 5. Screen effects (shake, flash, etc.)
      updateScreenEffects(scene, dt);

      // 6. Flicker lava lights + muzzle flash + biome particles
      updateFlickerLights(lavaLightsRef.current, now * 0.001);
      if (scene.activeCamera) {
        updateMuzzleFlash(scene.activeCamera, player.player?.currentWeapon);
        // Move biome particles to follow camera
        if (biomeParticleSystem) {
          (biomeParticleSystem.emitter as Vector3).copyFrom(scene.activeCamera.position);
        }
      }

      // 7. Update player spotlight position to follow camera
      if (spotlightRef.current && scene.activeCamera) {
        const cam = scene.activeCamera as import('@babylonjs/core').UniversalCamera;
        spotlightRef.current.light.position = cam.position.clone();
        spotlightRef.current.light.direction = cam.getForwardRay().direction;
      }

      // 8. Detect enemy deaths and spawn death burst particles
      const currentEnemyIds = new Set(
        world.entities.filter(e => e.enemy).map(e => e.id),
      );
      for (const id of prevEnemyIds) {
        if (!currentEnemyIds.has(id)) {
          // Enemy died - find where they were (approximate from last known position)
          // We use the scene to find the mesh if it still exists briefly
          const mesh = scene.getMeshByName(`mesh-enemy-${id}`);
          if (mesh) {
            const isBoss = ['infernoGoat', 'voidGoat', 'ironGoat', 'archGoat'].some(bt => id?.includes(bt));
            // Extract enemy type from entity id (format: "boss-{type}-{floor}" or "{type}-{idx}")
            const enemyType = id?.split('-').find(s => s.match(/[A-Z]/)) ?? undefined;
            createDeathBurst(mesh.position.clone(), scene, isBoss, enemyType);
            placeGoreDecal(mesh.position.clone(), scene, isBoss, enemyType);
          }
        }
      }
      prevEnemyIds = currentEnemyIds;

      // 8b. Environmental hazards: lava floor damage (1 dmg per 300ms)
      if (!inGracePeriod && player.player && player.position) {
        const cellX = Math.round(player.position.x / CELL_SIZE);
        const cellZ = Math.round(player.position.z / CELL_SIZE);
        if (
          cellX >= 0 && cellX < levelData.width &&
          cellZ >= 0 && cellZ < levelData.depth &&
          levelData.grid[cellZ]?.[cellX] === MapCell.FLOOR_LAVA
        ) {
          // Tick damage every 300ms by checking frame time
          if (!lavaTickRef.current || now - lavaTickRef.current >= 300) {
            lavaTickRef.current = now;
            player.player.hp -= 2;
            GameState.set({damageFlash: 0.3});
          }
        }
      }

      // 8b2. Void pit instant kill
      if (!inGracePeriod && player.player && player.position) {
        const cellX = Math.round(player.position.x / CELL_SIZE);
        const cellZ = Math.round(player.position.z / CELL_SIZE);
        if (
          cellX >= 0 && cellX < levelData.width &&
          cellZ >= 0 && cellZ < levelData.depth &&
          levelData.grid[cellZ]?.[cellX] === MapCell.FLOOR_VOID
        ) {
          player.player.hp = 0; // instant death
          GameState.set({damageFlash: 1.0, screenShake: 15});
        }

        // Void pits also kill enemies that walk over them
        for (const enemy of world.entities) {
          if (!enemy.enemy || !enemy.position) continue;
          const ex = Math.round(enemy.position.x / CELL_SIZE);
          const ez = Math.round(enemy.position.z / CELL_SIZE);
          if (
            ex >= 0 && ex < levelData.width &&
            ez >= 0 && ez < levelData.depth &&
            levelData.grid[ez]?.[ex] === MapCell.FLOOR_VOID
          ) {
            if (enemy.enemy.hp > 0) triggerEnvKill('void');
            enemy.enemy.hp = 0;
          }
        }
      }

      // 8c. Footstep audio tied to player movement
      if (player.position) {
        const dist = Vector3.Distance(player.position, lastFootstepPos.current);
        footstepAccum.current += dist;
        lastFootstepPos.current = player.position.clone();
        if (footstepAccum.current >= FOOTSTEP_DISTANCE) {
          footstepAccum.current = 0;
          playSfx('footstep');
        }
      }

      // 9. Check win/death conditions (skip during grace period —
      //    enemies need time to register and the player is invulnerable)
      if (!inGracePeriod && !deathSlowMoActive) {
        if (checkPlayerDeath()) {
          // Start death slow-mo instead of immediate death screen
          deathSlowMoActive = true;
          deathSlowMoTimer = DEATH_SLOWMO_DURATION;
          GameState.set({screenShake: 12});
        } else if (encounterType === 'arena') {
          // Arena: drive wave spawning; complete after 5+ waves cleared
          waveSystemUpdate(dt, levelData.width);
          const waveInfo = getWaveInfo();
          const enemyCount = world.entities.filter(e => e.enemy).length;
          if (waveInfo.wave >= 5 && enemyCount === 0 && !waveInfo.waveActive && waveInfo.enemiesSpawnedThisWave > 0) {
            triggerFloorComplete();
          }
        } else if (encounterType === 'boss') {
          // Boss: complete when no boss entity remains
          const bossTypes: EntityType[] = ['archGoat', 'infernoGoat', 'voidGoat', 'ironGoat'];
          const bossEntity = world.entities.find(
            e => e.type != null && bossTypes.includes(e.type) && e.enemy,
          );
          // Mid-fight resupply: spawn 2 ammo pickups when boss drops to 50% HP
          if (bossEntity?.enemy && !bossResupplyTriggered) {
            if (bossEntity.enemy.hp <= bossEntity.enemy.maxHp * 0.5) {
              bossResupplyTriggered = true;
              for (let ri = 0; ri < 2; ri++) {
                const seededRng = useGameStore.getState().rng;
                const rx = 3 + Math.floor(seededRng() * (levelData.width - 6));
                const rz = 3 + Math.floor(seededRng() * (levelData.depth - 6));
                world.add({
                  id: `boss-resupply-${getGameTime().toFixed(0)}-${ri}`,
                  type: 'ammo',
                  position: new Vector3(rx * CELL_SIZE, 0.5, rz * CELL_SIZE),
                  pickup: {pickupType: 'ammo', value: 18, active: true},
                });
              }
            }
          }
          const bossAlive = !!bossEntity;
          if (!bossAlive && checkFloorComplete()) {
            const bossId = useGameStore.getState().stage.bossId;
            if (bossId) {
              useGameStore.getState().defeatBoss(bossId);
              playSfx('boss_defeat');
            }
            triggerFloorComplete();
          }
        } else {
          // Explore: standard floor-complete check
          if (checkFloorComplete()) {
            triggerFloorComplete();
          }
        }
      }

      // 9b. Floor completion stats delay — transition after stats display finishes
      if (floorCompleteTriggered && !isFloorStatsActive()) {
        floorCompleteTriggered = false;
        resetShotStats();
        advanceFloor();
      }

      // 10. Update Babylon.js GUI HUD, 3D damage numbers, and weapon viewmodel
      hud.update();
      dmgNumbers.update();
      viewmodel.update();
    };

    scene.onBeforeRenderObservable.add(gameLoop);

    return () => {
      scene.onBeforeRenderObservable.remove(postProcObserver);
      scene.onBeforeRenderObservable.removeCallback(gameLoop);
      disposePostProcessing();
      disposeMusic();
      disposeAmbientSound();
      hud.dispose();
      screens.dispose();
      dmgNumbers.dispose();
      viewmodel.dispose();
      clearActiveLevel();
      lavaLightsRef.current.forEach(dl => dl.light.dispose());
      lavaParticles.forEach(p => p.dispose());
      if (biomeParticleSystem) biomeParticleSystem.dispose();
      propMeshesRef.current.forEach(m => {
        m.getChildMeshes(false).forEach(c => c.dispose());
        m.dispose();
      });
      propMeshesRef.current = [];
      if (spotlightRef.current) {
        spotlightRef.current.shadowGen.dispose();
        spotlightRef.current.light.dispose();
      }
      disposeMuzzleFlash();
    };
  }, [scene, reinitCounter, assetsReady]);

  // Shared PBR materials (one per type, reused across all walls)
  const materials = useMemo(() => {
    if (!scene) return null;
    return {
      stone: createWallMaterial('wallMat-stone', 'stone', scene),
      flesh: createWallMaterial('wallMat-flesh', 'flesh', scene),
      lava: createWallMaterial('wallMat-lava', 'lava', scene),
      obsidian: createWallMaterial('wallMat-obsidian', 'obsidian', scene),
      door: createWallMaterial('wallMat-door', 'door', scene),
      floor: createFloorMaterial(scene),
      ceiling: createCeilingMaterial(scene),
    };
  }, [scene]);

  // Build level geometry imperatively (walls, floor, ceiling).
  // Using imperative creation avoids Reactylon reconciler crashes when
  // meshes are disposed during floor transitions.
  useEffect(() => {
    if (!level || !materials || !scene) return;

    levelMeshesRef.current = buildLevelMeshes(level, materials, scene);

    return () => {
      disposeLevelMeshes(levelMeshesRef.current);
      levelMeshesRef.current = [];
    };
  }, [level, materials, scene]);

  if (!level || !materials) return null;

  const ambientColor = level.theme.ambientColor;

  return (
    <transformNode name="game-root">
      {/* Environment Light - tinted by floor theme */}
      <hemisphericLight
        name="ambient"
        intensity={0.55}
        direction={new Vector3(0, 1, 0)}
        diffuse={Color3.FromHexString(ambientColor)}
        groundColor={Color3.FromHexString('#1a0505')}
      />

      {/* Floor, ceiling, and walls created imperatively via useEffect */}

      {/* Player camera + controls */}
      <PlayerController level={level} />

      {/* Enemy rendering */}
      <EnemyRenderer />

      {/* Projectile rendering */}
      <ProjectileRenderer />

      {/* Pickup rendering */}
      <PickupRenderer />

      {/* Environmental hazards */}
      <HazardRenderer />
    </transformNode>
  );
}

// ---------------------------------------------------------------------------
// Player Controller
// ---------------------------------------------------------------------------

const PlayerController = ({level}: {level: LevelData}) => {
  const scene = useScene();
  const autoplay = useGameStore(s => s.autoplay);

  useEffect(() => {
    // Create camera imperatively to avoid Reactylon reconciler race condition.
    const camera = new UniversalCamera(
      'playerCam',
      new Vector3(0, 2, 0),
      scene,
    );
    scene.activeCamera = camera;

    let governor: AIGovernor | null = null;

    // Wait for the player entity to be spawned by GameEngine's init effect
    const waitForPlayer = scene.onBeforeRenderObservable.add(() => {
      const playerEntity = world.entities.find(
        (e: Entity) => e.type === 'player',
      );
      if (!playerEntity?.position) return;
      scene.onBeforeRenderObservable.remove(waitForPlayer);

      // Camera setup (shared between manual and autoplay)
      camera.position = playerEntity.position.clone();
      camera.minZ = 0.1;
      camera.checkCollisions = !autoplay;
      camera.applyGravity = !autoplay;
      camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      camera.speed = 0.3;
      // Map sensitivity (0.1-1.0) → angularSensibility (4000-800, inverse)
      const sens = useGameStore.getState().mouseSensitivity;
      camera.angularSensibility = 4000 - sens * 3200;
      camera.inertia = 0.7;

      scene.gravity = new Vector3(0, -9.81 / 60, 0);
      scene.collisionsEnabled = true;

      // Sprint and jump state (manual mode only)
      let isSprinting = false;
      let jumpVelocity = 0;
      let isGrounded = true;
      const JUMP_FORCE = 0.22;
      const GROUND_Y = camera.position.y; // baseline floor Y
      let touchControls: TouchControls | null = null;
      const isTouch = isTouchDevice();

      // --- Autoplay: create Yuka AI governor ---
      if (autoplay) {
        governor = new AIGovernor(
          camera,
          scene,
          playerEntity,
          level.grid,
          CELL_SIZE,
        );

        // Expose governor on window for debug overlay access
        if (typeof window !== 'undefined') {
          (window as any).__aiGovernor = governor;
        }
      } else if (isTouch) {
        // --- Touch device: create virtual controls overlay ---
        touchControls = new TouchControls(scene);
        // No pointer lock on touch — camera look handled by touch drag
      } else {
        // --- Desktop: attach keyboard/mouse controls ---
        camera.attachControl(true);

        const canvas = scene.getEngine().getRenderingCanvas();
        if (canvas) {
          canvas.addEventListener('click', () => {
            const gs = GameState.get();
            if (gs.screen === 'playing') {
              canvas.requestPointerLock?.();
            }
          });
        }
      }

      // Sync camera to ECS each frame
      let lastGovTime = performance.now();
      const syncLoop = () => {
        if (!playerEntity.position) return;

        if (autoplay && governor) {
          const now = performance.now();
          const dt = now - lastGovTime;
          lastGovTime = now;
          governor.update(dt);
        }

        // Camera position → player entity position
        playerEntity.position = camera.position.clone();

        // Manual mode: sprint speed with level bonus + jump physics
        if (!autoplay) {
          const bonuses = getLevelBonuses(useGameStore.getState().leveling.level);
          const baseSpeed = isSprinting ? 0.45 : 0.3;
          camera.speed = baseSpeed * bonuses.speedMult * getSpeedMultiplier();

          // Jump physics: apply velocity and detect landing
          if (jumpVelocity !== 0) {
            camera.cameraDirection.y += jumpVelocity;
            jumpVelocity -= 0.012; // gravity acceleration per frame
            // Detect landing: camera stops falling when gravity collision kicks in
            if (jumpVelocity < 0 && camera.position.y <= GROUND_Y + 0.1) {
              // Landing impact — shake proportional to fall speed
              const impactForce = Math.abs(jumpVelocity);
              if (impactForce > 0.04) {
                GameState.set({screenShake: Math.min(15, impactForce * 80)});
                triggerLandingDip(Math.min(1, impactForce * 5));
              }
              jumpVelocity = 0;
              isGrounded = true;
            }
          }
        }

        // --- Touch input processing ---
        if (isTouch && touchControls && !autoplay) {
          const gs = GameState.get();
          if (gs.screen === 'playing') {
            touchControls.update();

            // NaN guard: corrupt touch coords could freeze player movement
            if (Number.isNaN(touchInput.moveX)) touchInput.moveX = 0;
            if (Number.isNaN(touchInput.moveZ)) touchInput.moveZ = 0;

            // Movement: feed joystick into cameraDirection so Babylon's
            // collision pipeline handles wall clipping (same as keyboard mode)
            if (Math.abs(touchInput.moveX) > 0.05 || Math.abs(touchInput.moveZ) > 0.05) {
              const forward = camera.getForwardRay().direction;
              forward.y = 0;
              forward.normalize();
              const right = Vector3.Cross(Vector3.Up(), forward).normalize();
              const moveSpeed = 0.15;
              const move = forward.scale(touchInput.moveZ * moveSpeed)
                .add(right.scale(-touchInput.moveX * moveSpeed));
              camera.cameraDirection.addInPlace(move);
            }

            // Look: apply touch drag to camera rotation
            if (touchInput.lookDeltaX !== 0 || touchInput.lookDeltaY !== 0) {
              camera.rotation.y += touchInput.lookDeltaX;
              camera.rotation.x += touchInput.lookDeltaY;
              // Clamp vertical look
              camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camera.rotation.x));
            }

            // Fire
            if (touchInput.fire) {
              const fired = tryShoot(scene, playerEntity);
              if (fired && scene.activeCamera) {
                const dir = scene.activeCamera.getForwardRay().direction;
                createMuzzleFlash(camera.position.add(dir.scale(0.5)), dir, scene);
                camera.rotation.x -= 0.02;
              }
            }

            // Reload
            if (touchInput.reload) {
              tryReload(playerEntity);
            }

            // Weapon switch
            if (touchInput.weaponSwitch > 0) {
              const weaponMap: Record<number, WeaponId> = {
                1: 'hellPistol', 2: 'brimShotgun',
                3: 'hellfireCannon', 4: 'goatsBane',
              };
              const wid = weaponMap[touchInput.weaponSwitch];
              if (wid) switchWeapon(playerEntity, wid);
            }

            // Jump
            if (touchInput.jump && isGrounded) {
              jumpVelocity = JUMP_FORCE;
              isGrounded = false;
            }

            // Pause
            if (touchInput.pause) {
              useGameStore.getState().patch({screen: 'paused'});
            }

            resetTouchInput();
          }
        }

        // Bounds checking
        if (camera.position.y < -10) {
          camera.position = new Vector3(
            playerEntity.position.x,
            2,
            playerEntity.position.z,
          );
        }
      };

      // Manual-mode shooting with muzzle flash + recoil kick (desktop only)
      const handlePointerDown = () => {
        if (autoplay || isTouch) return;
        const gs = GameState.get();
        if (gs.screen !== 'playing') return;
        const fired = tryShoot(scene, playerEntity);
        if (fired && scene.activeCamera) {
          const dir = scene.activeCamera.getForwardRay().direction;
          createMuzzleFlash(
            camera.position.add(dir.scale(0.5)),
            dir,
            scene,
          );
          // Recoil kick: slight upward camera rotation
          camera.rotation.x -= 0.02;
        }
      };

      // Manual-mode keyboard input
      const handleKeyDown = (e: KeyboardEvent) => {
        if (autoplay) return;
        const gs = GameState.get();
        if (gs.screen !== 'playing') return;

        switch (e.key) {
          case 'r':
          case 'R':
            tryReload(playerEntity);
            break;
          case '1':
            switchWeapon(playerEntity, 'hellPistol');
            break;
          case '2':
            switchWeapon(playerEntity, 'brimShotgun');
            break;
          case '3':
            switchWeapon(playerEntity, 'hellfireCannon');
            break;
          case '4':
            switchWeapon(playerEntity, 'goatsBane');
            break;
          case 'Shift':
            isSprinting = true;
            setSprinting(true);
            break;
          case ' ':
            // Jump: apply upward velocity if grounded
            if (isGrounded) {
              jumpVelocity = JUMP_FORCE;
              isGrounded = false;
            }
            e.preventDefault(); // prevent page scroll
            break;
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Shift') {
          isSprinting = false;
          setSprinting(false);
        }
      };

      scene.onBeforeRenderObservable.add(syncLoop);
      scene.onPointerDown = handlePointerDown;

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
      }

      cameraCleanups.set(camera, () => {
        scene.onBeforeRenderObservable.removeCallback(syncLoop);
        scene.onPointerDown = undefined;
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          delete (window as any).__aiGovernor;
        }
        if (governor) {
          governor.dispose();
        }
        if (touchControls) {
          touchControls.dispose();
        }
      });
    });

    return () => {
      scene.onBeforeRenderObservable.remove(waitForPlayer);
      const cleanup = cameraCleanups.get(camera);
      if (cleanup) {
        cleanup();
        cameraCleanups.delete(camera);
      }
      camera.detachControl();
      camera.dispose();
    };
  }, [scene, autoplay, level]);

  return null;
};

// ---------------------------------------------------------------------------
// Enemy Renderer — imperative 3D procedural goat meshes
// ---------------------------------------------------------------------------

/** Death animation: knockback + fade + shrink over ~1s. */
interface DeathAnim {
  mesh: Mesh;
  vx: number;
  vz: number;
  vy: number;
  life: number;
  maxLife: number;
}

const SPAWN_ANIM_FRAMES = 18; // ~0.3s at 60fps

// Enemy health bar: small billboard bar above damaged enemies
interface EnemyHealthBar {
  bg: Mesh;
  fill: Mesh;
  fillMat: StandardMaterial;
  showTimer: number; // frames remaining to show (fades out)
}

const EnemyRenderer = () => {
  const scene = useScene();
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());
  const deathAnimsRef = useRef<DeathAnim[]>([]);
  const spawnAnimsRef = useRef<Map<string, number>>(new Map());
  const healthBarsRef = useRef<Map<string, EnemyHealthBar>>(new Map());
  const lastHpRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const meshMap = meshMapRef.current;
    const deathAnims = deathAnimsRef.current;
    const spawnAnims = spawnAnimsRef.current;
    const healthBars = healthBarsRef.current;
    const lastHp = lastHpRef.current;

    const update = () => {
      const currentEnemies = world.entities.filter(
        (e: Entity) => !!e.enemy,
      );
      const currentIds = new Set(currentEnemies.map(e => e.id));

      // Find player (used for knockback direction + look-at rotation)
      const playerEntity = world.entities.find((e: Entity) => e.type === 'player');

      // Detect dead enemies — transfer mesh to death animation instead of disposing
      for (const [id, mesh] of meshMap) {
        if (!currentIds.has(id)) {
          // Calculate knockback direction (away from player)
          let vx = 0, vz = 0;
          if (playerEntity?.position) {
            const dx = mesh.position.x - playerEntity.position.x;
            const dz = mesh.position.z - playerEntity.position.z;
            const len = Math.sqrt(dx * dx + dz * dz) || 1;
            const force = 0.15;
            vx = (dx / len) * force;
            vz = (dz / len) * force;
          }
          // Remove physics collider before animation (avoid stale collisions)
          removeEnemyCollider(mesh.metadata?.entityId);
          deathAnims.push({
            mesh,
            vx,
            vz,
            vy: 0.08, // slight upward launch
            life: 40,
            maxLife: 40,
          });
          meshMap.delete(id);
          spawnAnims.delete(id);
        }
      }

      // Animate dying enemies
      for (let i = deathAnims.length - 1; i >= 0; i--) {
        const anim = deathAnims[i];
        anim.life--;
        const t = 1 - anim.life / anim.maxLife; // 0 → 1

        // Apply velocity
        anim.mesh.position.x += anim.vx;
        anim.mesh.position.z += anim.vz;
        anim.mesh.position.y += anim.vy;
        anim.vy -= 0.004; // gravity

        // Shrink and fade
        const scale = Math.max(0, 1 - t * 1.2);
        anim.mesh.scaling.setAll(scale);
        anim.mesh.visibility = Math.max(0, 1 - t);

        // Tilt backward (dramatic death fall)
        anim.mesh.rotation.x = t * 1.2;

        if (anim.life <= 0) {
          anim.mesh.dispose();
          deathAnims.splice(i, 1);
        }
      }

      // Create/update meshes for living enemies
      for (const enemy of currentEnemies) {
        if (!enemy.id || !enemy.position) continue;

        let mesh = meshMap.get(enemy.id);
        if (!mesh) {
          mesh = createGoatMesh(
            enemy.id,
            enemy.type!,
            scene,
          );
          meshMap.set(enemy.id, mesh);
          // Start spawn-in animation
          spawnAnims.set(enemy.id, 0);
          mesh.scaling.setAll(0);
          createSpawnEffect(enemy.position.clone(), scene);
        }

        // Position (mesh origin is at hooves, y=0)
        mesh.position.set(enemy.position.x, 0, enemy.position.z);

        // Face toward player
        if (playerEntity?.position) {
          const dx = playerEntity.position.x - mesh.position.x;
          const dz = playerEntity.position.z - mesh.position.z;
          mesh.rotation.y = Math.atan2(dx, dz);
        }

        // Spawn-in scale animation (elastic ease-out: pops in and settles)
        const spawnFrame = spawnAnims.get(enemy.id);
        if (spawnFrame !== undefined) {
          const next = spawnFrame + 1;
          const t = Math.min(1, next / SPAWN_ANIM_FRAMES);
          // Overshoot by 15% then settle to 1.0
          const ease = 1 - Math.pow(1 - t, 3) * (1 - t);
          const overshoot = ease * (1 + 0.15 * Math.sin(t * Math.PI));
          const baseScale = mesh.metadata?.baseScale ?? 1;
          mesh.scaling.setAll(overshoot * baseScale);
          if (next >= SPAWN_ANIM_FRAMES) {
            spawnAnims.delete(enemy.id);
            mesh.scaling.setAll(baseScale);
          } else {
            spawnAnims.set(enemy.id, next);
          }
        }

        // Visibility (shadowGoat transparency)
        mesh.visibility = enemy.enemy?.visibilityAlpha ?? 1;

        // Enemy health bar — show when damaged, hide after a few seconds
        if (enemy.enemy) {
          const {hp, maxHp} = enemy.enemy;
          const prevHp = lastHp.get(enemy.id) ?? maxHp;
          const damaged = hp < maxHp;
          const justHit = hp < prevHp;
          lastHp.set(enemy.id, hp);

          let bar = healthBars.get(enemy.id);

          if (damaged && !bar) {
            // Create health bar billboard
            const bgMesh = MeshBuilder.CreatePlane(`hpBg-${enemy.id}`, {width: 0.8, height: 0.08}, scene);
            bgMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
            bgMesh.isPickable = false;
            const bgMat = new StandardMaterial(`hpBgMat-${enemy.id}`, scene);
            bgMat.diffuseColor = new Color3(0.1, 0, 0);
            bgMat.emissiveColor = new Color3(0.1, 0, 0);
            bgMat.disableLighting = true;
            bgMesh.material = bgMat;

            const fillMesh = MeshBuilder.CreatePlane(`hpFill-${enemy.id}`, {width: 0.76, height: 0.05}, scene);
            fillMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
            fillMesh.isPickable = false;
            const fillMat = new StandardMaterial(`hpFillMat-${enemy.id}`, scene);
            fillMat.diffuseColor = new Color3(0.8, 0, 0);
            fillMat.emissiveColor = new Color3(0.8, 0, 0);
            fillMat.disableLighting = true;
            fillMesh.material = fillMat;

            bar = {bg: bgMesh, fill: fillMesh, fillMat, showTimer: 180};
            healthBars.set(enemy.id, bar);
          }

          if (bar) {
            if (justHit) bar.showTimer = 180; // refresh on hit

            const ratio = maxHp > 0 ? hp / maxHp : 0;
            const barHeight = (mesh.metadata?.baseScale ?? 1) * 1.7;

            // Position above enemy
            bar.bg.position.set(mesh.position.x, barHeight, mesh.position.z);
            bar.fill.position.set(
              mesh.position.x - 0.38 * (1 - ratio),
              barHeight,
              mesh.position.z,
            );
            bar.fill.scaling.x = Math.max(0.01, ratio);

            // Color: green → yellow → red
            const r = ratio > 0.5 ? (1 - ratio) * 2 : 1;
            const g = ratio > 0.5 ? 1 : ratio * 2;
            bar.fillMat.emissiveColor = new Color3(r, g, 0);
            bar.fillMat.diffuseColor = new Color3(r, g, 0);

            // Fade timer
            bar.showTimer--;
            const alpha = bar.showTimer > 30 ? 1 : Math.max(0, bar.showTimer / 30);
            bar.bg.visibility = alpha * 0.7;
            bar.fill.visibility = alpha;

            if (bar.showTimer <= 0) {
              bar.bg.dispose();
              bar.fill.dispose();
              bar.fillMat.dispose();
              healthBars.delete(enemy.id);
            }
          }
        }
      }

      // Clean up health bars for dead enemies
      for (const [id, bar] of healthBars) {
        if (!currentIds.has(id)) {
          bar.bg.dispose();
          bar.fill.dispose();
          bar.fillMat.dispose();
          healthBars.delete(id);
          lastHp.delete(id);
        }
      }
    };

    const obs = scene.onBeforeRenderObservable.add(update);

    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      for (const mesh of meshMap.values()) {
        disposeGoatMesh(mesh);
      }
      meshMap.clear();
      // Clean up health bars
      for (const [, bar] of healthBars) {
        bar.bg.dispose();
        bar.fill.dispose();
        bar.fillMat.dispose();
      }
      healthBars.clear();
      lastHp.clear();
      // Clean up any in-progress death animations
      for (const anim of deathAnims) {
        anim.mesh.dispose();
      }
      deathAnims.length = 0;
      spawnAnims.clear();
      disposeGoatCache();
      disposeAllEnemyColliders();
    };
  }, [scene]);

  return null;
};

// ---------------------------------------------------------------------------
// Projectile Renderer — glowing spheres for fireballs, rockets, etc.
// ---------------------------------------------------------------------------

const ProjectileRenderer = () => {
  const scene = useScene();
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());
  const trailMapRef = useRef<Map<string, import('@babylonjs/core').ParticleSystem>>(new Map());

  useEffect(() => {
    const meshMap = meshMapRef.current;
    const trailMap = trailMapRef.current;

    // Shared materials: create once, reuse for all projectiles
    const playerMat = new StandardMaterial('projMat-player', scene);
    playerMat.emissiveColor = Color3.FromHexString('#ff8800');
    playerMat.diffuseColor = Color3.FromHexString('#ffcc44');
    playerMat.alpha = 0.9;

    const enemyMat = new StandardMaterial('projMat-enemy', scene);
    enemyMat.emissiveColor = Color3.FromHexString('#ff2200');
    enemyMat.diffuseColor = Color3.FromHexString('#ff4400');
    enemyMat.alpha = 0.9;

    // Trail colors per owner
    const playerTrailColor = new Color4(1.0, 0.6, 0.1, 0.8);
    const enemyTrailColor = new Color4(1.0, 0.2, 0.0, 0.8);

    const update = () => {
      const projectiles = world.entities.filter(
        (e: Entity) => !!e.projectile && !!e.position,
      );
      const currentIds = new Set(
        projectiles.map(e => e.id).filter(Boolean),
      );

      // Remove meshes + trails for expired projectiles
      for (const [id, mesh] of meshMap) {
        if (!currentIds.has(id)) {
          mesh.dispose();
          meshMap.delete(id);
          const trail = trailMap.get(id);
          if (trail) {
            trail.stop();
            trailMap.delete(id);
          }
        }
      }

      // Create/update meshes for active projectiles
      for (const proj of projectiles) {
        if (!proj.id || !proj.position || !proj.projectile) continue;

        let mesh = meshMap.get(proj.id);
        if (!mesh) {
          const isPlayer = proj.projectile.owner === 'player';
          const diameter = isPlayer ? 0.3 : 0.25;
          mesh = MeshBuilder.CreateSphere(
            `mesh-proj-${proj.id}`,
            {diameter, segments: 8},
            scene,
          );
          mesh.isPickable = false;
          mesh.material = isPlayer ? playerMat : enemyMat;
          meshMap.set(proj.id, mesh);

          // Attach particle trail to projectile mesh
          const isRocket = isPlayer && (proj.projectile.aoe ?? 0) > 0;
          const trailColor = isPlayer ? playerTrailColor : enemyTrailColor;
          const trail = createProjectileTrail(scene, trailColor);
          trail.emitter = mesh;
          if (isRocket) {
            // Thicker smoke trail for rockets
            trail.minSize = 0.1;
            trail.maxSize = 0.25;
            trail.emitRate = 60;
            trail.minLifeTime = 0.2;
            trail.maxLifeTime = 0.5;
            // Add smoke color component
            trail.color2 = new Color4(0.4, 0.3, 0.2, 0.6);
            trail.colorDead = new Color4(0.2, 0.15, 0.1, 0);
          }
          trail.start();
          trailMap.set(proj.id, trail);
        }

        mesh.position.copyFrom(proj.position);
      }
    };

    const obs = scene.onBeforeRenderObservable.add(update);

    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      for (const mesh of meshMap.values()) {
        mesh.dispose();
      }
      for (const trail of trailMap.values()) {
        trail.stop();
        trail.dispose();
      }
      meshMap.clear();
      trailMap.clear();
      playerMat.dispose();
      enemyMat.dispose();
    };
  }, [scene]);

  return null;
};

// ---------------------------------------------------------------------------
// Pickup Renderer - bobbing + glowing
// ---------------------------------------------------------------------------

const PickupRenderer = () => {
  const scene = useScene();
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());

  useEffect(() => {
    if (!scene) return;
    const meshMap = meshMapRef.current;

    const interval = setInterval(() => {
      const activePickups = world.entities.filter(
        (e: Entity) => e.pickup?.active,
      );
      const bobOffset = Math.sin(getGameTime() * 0.003) * 0.15;
      const activeIds = new Set(activePickups.map(p => p.id).filter(Boolean));

      // Remove meshes for despawned pickups
      for (const [id, mesh] of meshMap) {
        if (!activeIds.has(id)) {
          // Clean up glow ring if present
          const ring = meshGlowRings.get(mesh);
          if (ring) {
            ring.material?.dispose();
            ring.dispose();
            meshGlowRings.delete(mesh);
          }
          mesh.material?.dispose();
          mesh.dispose();
          meshMap.delete(id);
        }
      }

      // Create/update meshes for active pickups
      for (const pickup of activePickups) {
        if (!pickup.position || !pickup.id) continue;
        const id = pickup.id;

        const isHealth = pickup.pickup?.pickupType === 'health';
        const isWeapon = pickup.pickup?.pickupType === 'weapon';
        const isPowerUp = pickup.pickup?.pickupType === 'powerup';
        const diameter = isPowerUp ? 0.9 : isWeapon ? 0.7 : 0.5;

        let mesh = meshMap.get(id);
        if (!mesh) {
          mesh = MeshBuilder.CreateSphere(
            `mesh-pickup-${id}`,
            {diameter, segments: 12},
            scene,
          );
          const mat = new StandardMaterial(`pickupMat-${id}`, scene);
          let color: string;
          let emissive: string;
          if (isPowerUp) {
            // Power-up color by type
            const pType = pickup.pickup?.powerUpType;
            color = pType === 'quadDamage' ? '#ff2200' : pType === 'hellSpeed' ? '#2266ff' : '#ffcc00';
            emissive = pType === 'quadDamage' ? '#661100' : pType === 'hellSpeed' ? '#112266' : '#664400';
          } else {
            color = isHealth ? '#44ff44' : isWeapon ? '#ff44ff' : '#ffaa00';
            emissive = isHealth ? '#115511' : isWeapon ? '#441144' : '#443300';
          }
          mat.emissiveColor = Color3.FromHexString(color);
          mat.diffuseColor = Color3.FromHexString(emissive);
          mat.alpha = isPowerUp ? 0.95 : 0.85;
          mesh.material = mat;
          meshMap.set(id, mesh);

          // Weapon pickups: glow ring on the ground
          if (isWeapon && pickup.position) {
            const ring = MeshBuilder.CreateTorus(
              `mesh-pickup-ring-${id}`,
              {diameter: 1.2, thickness: 0.04, tessellation: 24},
              scene,
            );
            const ringMat = new StandardMaterial(`pickupRingMat-${id}`, scene);
            ringMat.emissiveColor = Color3.FromHexString('#ff44ff');
            ringMat.diffuseColor = Color3.FromHexString('#441144');
            ringMat.alpha = 0.5;
            ring.material = ringMat;
            ring.position.set(pickup.position.x, 0.05, pickup.position.z);
            ring.isPickable = false;
            // Store ring reference on the mesh for cleanup
            meshGlowRings.set(mesh, ring);
          }
        }

        mesh.position.x = pickup.position.x;
        // Weapon pickups: higher + slower bob; power-ups: highest
        const yBase = isPowerUp ? 0.8 : isWeapon ? 0.7 : 0.5;
        const weaponBob = isWeapon ? Math.sin(getGameTime() * 0.002) * 0.2 : bobOffset;
        mesh.position.y = yBase + (isWeapon ? weaponBob : bobOffset);
        mesh.position.z = pickup.position.z;

        // Weapon pickups: slow rotation for visibility
        if (isWeapon) {
          mesh.rotation.y = getGameTime() * 0.002;
        }

        // Power-ups pulse in size for emphasis
        if (isPowerUp) {
          const pulse = 1 + Math.sin(getGameTime() * 0.005) * 0.15;
          mesh.scaling.setAll(pulse);
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
      for (const mesh of meshMap.values()) {
        const ring = meshGlowRings.get(mesh);
        if (ring) {
          ring.material?.dispose();
          ring.dispose();
          meshGlowRings.delete(mesh);
        }
        mesh.material?.dispose();
        mesh.dispose();
      }
      meshMap.clear();
    };
  }, [scene]);

  return null;
};

// ---------------------------------------------------------------------------
// Hazard Renderer - spikes (floor mesh) and barrels (cylinder)
// ---------------------------------------------------------------------------

const HazardRenderer = () => {
  const scene = useScene();

  useEffect(() => {
    if (!scene) return;
    const meshMap = new Map<string, Mesh>();

    const interval = setInterval(() => {
      const hazards = world.entities.filter(
        (e: Entity) => e.hazard && e.position,
      );
      const activeIds = new Set(hazards.map(h => h.id).filter(Boolean));

      // Remove meshes for despawned hazards
      for (const [id, mesh] of meshMap) {
        if (!activeIds.has(id)) {
          mesh.material?.dispose();
          mesh.dispose();
          meshMap.delete(id);
        }
      }

      // Create/update meshes for active hazards
      for (const hazard of hazards) {
        if (!hazard.position || !hazard.id) continue;
        const id = hazard.id;
        const hz = hazard.hazard!;

        let mesh = meshMap.get(id);
        if (!mesh) {
          if (hz.hazardType === 'spikes') {
            mesh = MeshBuilder.CreateBox(
              `mesh-hazard-${id}`,
              {width: 1.5, height: 0.3, depth: 1.5},
              scene,
            );
            const mat = new StandardMaterial(`spikeMat-${id}`, scene);
            mat.diffuseColor = Color3.FromHexString('#555555');
            mat.emissiveColor = Color3.FromHexString('#331111');
            mat.specularPower = 64;
            mesh.material = mat;
          } else {
            // Barrel
            mesh = MeshBuilder.CreateCylinder(
              `mesh-hazard-${id}`,
              {height: 1.2, diameter: 0.8, tessellation: 12},
              scene,
            );
            const mat = new StandardMaterial(`barrelMat-${id}`, scene);
            mat.diffuseColor = Color3.FromHexString('#8B4513');
            mat.emissiveColor = Color3.FromHexString('#441100');
            mesh.material = mat;
          }
          mesh.checkCollisions = true;
          meshMap.set(id, mesh);
        }

        mesh.position.x = hazard.position.x;
        mesh.position.y = hz.hazardType === 'spikes' ? 0.15 : 0.6;
        mesh.position.z = hazard.position.z;
      }
    }, 50);

    return () => {
      clearInterval(interval);
      for (const mesh of meshMap.values()) {
        mesh.material?.dispose();
        mesh.dispose();
      }
      meshMap.clear();
    };
  }, [scene]);

  return null;
};
