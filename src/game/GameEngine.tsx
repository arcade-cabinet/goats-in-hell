import {
  Color3,
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
import {getEnemyStats} from './entities/enemyStats';
import {
  CELL_SIZE,
  LevelGenerator,
  MapCell,
  PLATFORM_HEIGHT,
  WALL_HEIGHT,
} from './levels/LevelGenerator';
import type {FloorTheme} from './levels/FloorThemes';
import {getThemeForFloor} from './levels/FloorThemes';
import {generateArena, getArenaPlayerSpawn} from './levels/ArenaGenerator';
import {generateBossArena, BOSS_ARENA_PICKUP_POSITIONS, BOSS_ARENA_SIZE} from './levels/BossArenas';
import {setActiveLevel, clearActiveLevel} from './levels/activeLevelRef';
import {GameState} from '../state/GameState';

// Systems
import {aiSystemUpdate, aiSystemReset} from './systems/AISystem';
import {combatSystemUpdate} from './systems/CombatSystem';
import {pickupSystemUpdate} from './systems/PickupSystem';
import {
  checkFloorComplete,
  advanceFloor,
  checkPlayerDeath,
  triggerDeath,
} from './systems/ProgressionSystem';
import {initAudio, setMasterVolume, playSound as playSfx, setSfxBuffers} from './systems/AudioSystem';
import {initMusic, setMusicMasterVolume, updateMusic, disposeMusic, setMusicBuffers} from './systems/MusicSystem';
import {loadAllMusic, loadAllSfx} from './systems/AssetLoader';
import {
  waveSystemUpdate,
  resetWaveSystem,
  getWaveInfo,
} from './systems/WaveSystem';
import {doorSystemUpdate, resetDoorSystem} from './systems/DoorSystem';
import {hazardSystemUpdate, resetHazardSystem} from './systems/HazardSystem';
import {tickGameClock, resetGameClock, getGameTime} from './systems/GameClock';
import {initPhysics, disposeAllEnemyColliders} from './systems/PhysicsSetup';
import {
  tryShoot,
  tryReload,
  updateReload,
  switchWeapon,
  initPlayerAmmo,
} from './weapons/WeaponSystem';

// Rendering
import {
  createWallMaterial,
  createFloorMaterial,
  createCeilingMaterial,
} from './rendering/Materials';
import type {WallType} from './rendering/Materials';
import {
  createLavaLights,
  createPlayerSpotlight,
  updateFlickerLights,
} from './rendering/Lighting';
import type {DynamicLight} from './rendering/Lighting';
import {
  setupPostProcessing,
  updateScreenEffects,
  disposePostProcessing,
} from './rendering/PostProcessing';
import {createDeathBurst, createMuzzleFlash, createLavaEmbers} from './rendering/Particles';
import {
  createGoatMesh,
  disposeGoatMesh,
  disposeGoatCache,
  loadAllEnemyTemplates,
} from './rendering/GoatMeshFactory';
import {
  createProp,
  loadAllProps,
} from './rendering/DungeonProps';
import type {PropType} from './rendering/DungeonProps';
import {AIGovernor} from './systems/AIGovernor';
import {BabylonHUD} from './ui/BabylonHUD';
import {BabylonScreens} from './ui/BabylonScreens';
import {DamageNumbers3D} from './ui/DamageNumbers3D';
import {WeaponViewModel, loadAllWeapons} from './ui/WeaponViewModel';
import {LoadingScreen} from './ui/LoadingScreen';
import {TouchControls, touchInput, resetTouchInput, isTouchDevice} from './ui/TouchControls';
import {useGameStore, DIFFICULTY_PRESETS, getLevelBonuses} from '../state/GameStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENEMY_TYPES: EntityType[] = [
  'goat',
  'hellgoat',
  'fireGoat',
  'shadowGoat',
  'goatKnight',
  'archGoat',
  'infernoGoat',
  'voidGoat',
  'ironGoat',
];

const PROP_TYPES = new Set([
  'prop_firebasket', 'prop_candle', 'prop_candle_multi', 'prop_altar',
  'prop_coffin', 'prop_column', 'prop_chalice', 'prop_bowl',
]);

/** Footstep distance threshold (world units). */
const FOOTSTEP_DISTANCE = 1.5;

// ---------------------------------------------------------------------------
// Level data interface (unifies LevelGenerator, ArenaGenerator, BossArenas)
// ---------------------------------------------------------------------------

interface LevelData {
  width: number;
  depth: number;
  floor: number;
  grid: MapCell[][];
  playerSpawn: Vector3;
  spawns: Array<{type: string; x: number; z: number; weaponId?: string; rotation?: number}>;
  theme: FloorTheme;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapCellToWallType(cell: MapCell): WallType | null {
  switch (cell) {
    case MapCell.WALL_STONE:
      return 'stone';
    case MapCell.WALL_FLESH:
      return 'flesh';
    case MapCell.WALL_LAVA:
      return 'lava';
    case MapCell.WALL_OBSIDIAN:
      return 'obsidian';
    case MapCell.DOOR:
      return 'door';
    default:
      return null;
  }
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

    initAudio();
    initMusic();

    (async () => {
      try {
        let loaded = 0;
        const total = 6;
        const tick = (label: string) => {
          loaded++;
          setLoadProgress(loaded / total);
          setLoadLabel(label);
        };

        // Initialize Havok physics engine (WASM load)
        setLoadLabel('Initializing physics...');
        await initPhysics(scene);
        tick('Forging weapons...');

        // Load asset categories sequentially so progress bar advances visibly
        const audioCtx = new AudioContext();

        await loadAllWeapons(scene);
        tick('Summoning enemies...');

        await loadAllEnemyTemplates(scene);
        tick('Placing props...');

        await loadAllProps(scene);
        tick('Loading music...');

        const musicBuffers = await loadAllMusic(audioCtx);
        tick('Loading sounds...');

        const sfxBufferMap = await loadAllSfx(audioCtx);
        tick('Ready.');

        // Wire the decoded audio buffers into the playback systems
        setMusicBuffers(musicBuffers);
        setSfxBuffers(sfxBufferMap);
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
      const bossTypeForArena = (ENEMY_TYPES.includes(bossId as EntityType) ? bossId : 'archGoat') as EntityType;
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
    levelData.spawns.forEach((spawn, idx) => {
      // Nightmare mode: skip health pickups entirely
      if (isNightmare && spawn.type === 'health') return;

      const entityType = spawn.type as EntityType;
      if (ENEMY_TYPES.includes(entityType)) {
        const stats = getEnemyStats(entityType);
        const scaledHp = Math.ceil(stats.hp * diffMods.enemyHpMult);
        const scaledMaxHp = Math.ceil(stats.maxHp * diffMods.enemyHpMult);
        const scaledDmg = Math.ceil(stats.damage * diffMods.enemyDmgMult * nightmareDmgMult);
        const scaledSpeed = stats.speed * diffMods.enemySpeedMult;
        world.add({
          id: `enemy-${idx}`,
          type: entityType,
          position: new Vector3(spawn.x, 1, spawn.z),
          enemy: {
            ...stats,
            hp: scaledHp,
            maxHp: scaledMaxHp,
            damage: scaledDmg,
            speed: scaledSpeed,
            alert: false,
            attackCooldown: 0,
          },
        });
      } else if (spawn.type === 'health' || spawn.type === 'ammo') {
        // Apply pickup density multiplier — skip some pickups on lower density
        if (diffMods.pickupDensityMult < 1 && useGameStore.getState().rng() > diffMods.pickupDensityMult) return;
        const baseValue = spawn.type === 'health' ? 25 : 8;
        // On easy, pickups give more; on hard, less
        const scaledValue = Math.max(1, Math.round(baseValue * Math.min(1.5, diffMods.pickupDensityMult)));
        world.add({
          id: `pickup-${idx}`,
          type: spawn.type as EntityType,
          position: new Vector3(spawn.x, 0.5, spawn.z),
          pickup: {
            pickupType: spawn.type as 'health' | 'ammo',
            value: scaledValue,
            active: true,
          },
        });
      } else if (spawn.type === 'weaponPickup' && spawn.weaponId) {
        world.add({
          id: `weapon-${idx}`,
          type: 'weaponPickup',
          position: new Vector3(spawn.x, 0.5, spawn.z),
          pickup: {
            pickupType: 'weapon',
            value: 0,
            active: true,
            weaponId: spawn.weaponId as WeaponId,
          },
        });
      } else if (spawn.type === 'hazard_spikes') {
        // Spike trap: uses spike GLB, deals damage when player walks over
        world.add({
          id: `hazard-spike-${idx}`,
          type: 'hazard_spikes' as EntityType,
          position: new Vector3(spawn.x, 0, spawn.z),
          hazard: {hazardType: 'spikes', damage: 10, cooldown: 0},
        });
      } else if (spawn.type === 'hazard_barrel') {
        // Explosive barrel: shoots to explode, damages nearby enemies + player
        world.add({
          id: `hazard-barrel-${idx}`,
          type: 'hazard_barrel' as EntityType,
          position: new Vector3(spawn.x, 0.5, spawn.z),
          hazard: {hazardType: 'barrel', damage: 50, cooldown: 0, hp: 20},
        });
      } else if (PROP_TYPES.has(spawn.type)) {
        const propMesh = createProp(
          spawn.type as PropType,
          new Vector3(spawn.x, 0, spawn.z),
          spawn.rotation ?? 0,
          scene,
        );
        if (propMesh) {
          propMeshesRef.current.push(propMesh);
        }
      }
    });

    // --- Spawn boss entity for boss encounters ---
    if (encounterType === 'boss') {
      const bossId = storeState.stage.bossId ?? 'archGoat';
      const bossType = (ENEMY_TYPES.includes(bossId as EntityType) ? bossId : 'archGoat') as EntityType;
      const bossStats = getEnemyStats(bossType);
      const scaledBossHp = Math.ceil(bossStats.hp * diffMods.enemyHpMult * 1.5);
      const scaledBossMaxHp = Math.ceil(bossStats.maxHp * diffMods.enemyHpMult * 1.5);
      const scaledBossDmg = Math.ceil(bossStats.damage * diffMods.enemyDmgMult * nightmareDmgMult);
      world.add({
        id: `boss-${bossType}-${floor}`,
        type: bossType,
        position: new Vector3(
          Math.floor(levelData.width / 2) * CELL_SIZE,
          1,
          Math.floor(levelData.depth / 2) * CELL_SIZE,
        ),
        enemy: {
          ...bossStats,
          hp: scaledBossHp,
          maxHp: scaledBossMaxHp,
          damage: scaledBossDmg,
          speed: bossStats.speed * diffMods.enemySpeedMult,
          alert: true,
          attackCooldown: 0,
        },
      });

      // Spawn initial pickups in boss arena at corner positions
      const bossPickups: {type: 'ammo' | 'health'; value: number}[] = [
        {type: 'ammo', value: 18},
        {type: 'ammo', value: 18},
        {type: 'ammo', value: 18},
        {type: 'health', value: 30},
      ];
      BOSS_ARENA_PICKUP_POSITIONS.forEach((pos, i) => {
        const [px, pz] = pos;
        const spec = bossPickups[i];
        // Skip health pickup in nightmare mode
        if (spec.type === 'health' && isNightmare) return;
        world.add({
          id: `boss-pickup-${i}`,
          type: spec.type as EntityType,
          position: new Vector3(px * CELL_SIZE, 0.5, pz * CELL_SIZE),
          pickup: {
            pickupType: spec.type,
            value: spec.value,
            active: true,
          },
        });
      });
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

    // Set up player spotlight with dynamic shadows
    spotlightRef.current = createPlayerSpotlight(scene);

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

    // Boss mid-fight resupply flag (spawn extra ammo when boss hits 50% HP)
    // Declared here in the effect closure — resets on each floor init which is correct.
    // Using a closure variable is fine because reinitCounter triggers a full cleanup + re-run.
    let bossResupplyTriggered = false;
    // Note: if the effect re-runs mid-boss (shouldn't happen, but guard anyway),
    // the old game loop is unsubscribed by the cleanup return, so no double-spawns.

    // Main game loop
    let lastTime = performance.now();
    const gameLoop = () => {
      const gs = GameState.get();

      // Music track auto-switching based on game state
      updateMusic();

      // Screen overlays (death, victory, pause, etc.) must update every frame
      screens.update();

      if (gs.screen !== 'playing') return;

      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

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

      // 3b. Door proximity check and animation
      doorSystemUpdate(scene, levelData.grid, dt);

      // 4. Weapon reload
      updateReload(player);

      // 5. Screen effects (shake, flash, etc.)
      updateScreenEffects(scene, dt);

      // 6. Flicker lava lights
      updateFlickerLights(lavaLightsRef.current, now * 0.001);

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
            createDeathBurst(mesh.position.clone(), scene, isBoss);
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
      if (!inGracePeriod) {
        if (checkPlayerDeath()) {
          triggerDeath();
        } else if (encounterType === 'arena') {
          // Arena: drive wave spawning; complete after 5+ waves cleared
          waveSystemUpdate(dt, levelData.width);
          const waveInfo = getWaveInfo();
          const enemyCount = world.entities.filter(e => e.enemy).length;
          if (waveInfo.wave >= 5 && enemyCount === 0 && !waveInfo.waveActive && waveInfo.enemiesSpawnedThisWave > 0) {
            advanceFloor();
          }
        } else if (encounterType === 'boss') {
          // Boss: complete when no boss entity remains
          const bossTypes: EntityType[] = ['archGoat', 'infernoGoat', 'voidGoat', 'ironGoat'];
          const bossEntity = world.entities.find(
            e => bossTypes.includes(e.type as EntityType) && e.enemy,
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
            advanceFloor();
          }
        } else {
          // Explore: standard floor-complete check
          if (checkFloorComplete()) {
            advanceFloor();
          }
        }
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
      hud.dispose();
      screens.dispose();
      dmgNumbers.dispose();
      viewmodel.dispose();
      clearActiveLevel();
      lavaLightsRef.current.forEach(dl => dl.light.dispose());
      lavaParticles.forEach(p => p.dispose());
      propMeshesRef.current.forEach(m => {
        m.getChildMeshes(false).forEach(c => c.dispose());
        m.dispose();
      });
      propMeshesRef.current = [];
      if (spotlightRef.current) {
        spotlightRef.current.shadowGen.dispose();
        spotlightRef.current.light.dispose();
      }
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

    const created: Mesh[] = [];

    // Floor
    const floorMesh = MeshBuilder.CreateGround(
      'floor',
      {width: level.width * CELL_SIZE, height: level.depth * CELL_SIZE},
      scene,
    );
    floorMesh.position = new Vector3(
      (level.width * CELL_SIZE) / 2, 0, (level.depth * CELL_SIZE) / 2,
    );
    floorMesh.receiveShadows = true;
    floorMesh.checkCollisions = true;
    floorMesh.material = materials.floor;
    created.push(floorMesh);

    // Ceiling
    const ceilingMesh = MeshBuilder.CreateGround(
      'ceiling',
      {width: level.width * CELL_SIZE, height: level.depth * CELL_SIZE},
      scene,
    );
    ceilingMesh.position = new Vector3(
      (level.width * CELL_SIZE) / 2, WALL_HEIGHT, (level.depth * CELL_SIZE) / 2,
    );
    ceilingMesh.rotation = new Vector3(Math.PI, 0, 0);
    ceilingMesh.material = materials.ceiling;
    created.push(ceilingMesh);

    // Walls + lava floor tiles
    for (let z = 0; z < level.depth; z++) {
      for (let x = 0; x < level.width; x++) {
        const cell = level.grid[z][x];

        if (cell === MapCell.FLOOR_LAVA) {
          const lava = MeshBuilder.CreateBox(
            `lava-${x}-${z}`,
            {width: CELL_SIZE, height: 0.05, depth: CELL_SIZE},
            scene,
          );
          lava.position = new Vector3(x * CELL_SIZE, 0.03, z * CELL_SIZE);
          lava.receiveShadows = false;
          lava.material = materials.lava;
          created.push(lava);
          continue;
        }

        // Raised platform: solid block at ground level for elevation
        if (cell === MapCell.FLOOR_RAISED) {
          const platform = MeshBuilder.CreateBox(
            `platform-${x}-${z}`,
            {width: CELL_SIZE, height: PLATFORM_HEIGHT, depth: CELL_SIZE},
            scene,
          );
          platform.position = new Vector3(x * CELL_SIZE, PLATFORM_HEIGHT / 2, z * CELL_SIZE);
          platform.receiveShadows = true;
          platform.checkCollisions = true;
          platform.material = materials.obsidian;
          created.push(platform);
          continue;
        }

        // Ramp: angled surface connecting ground to raised platform
        if (cell === MapCell.RAMP) {
          const ramp = MeshBuilder.CreateBox(
            `ramp-${x}-${z}`,
            {width: CELL_SIZE, height: PLATFORM_HEIGHT * 0.5, depth: CELL_SIZE},
            scene,
          );
          ramp.position = new Vector3(x * CELL_SIZE, PLATFORM_HEIGHT * 0.25, z * CELL_SIZE);
          ramp.receiveShadows = true;
          ramp.checkCollisions = true;
          ramp.material = materials.stone;
          created.push(ramp);
          continue;
        }

        const wallType = mapCellToWallType(cell);
        if (!wallType) continue;

        const wall = MeshBuilder.CreateBox(
          `wall-${x}-${z}`,
          {width: CELL_SIZE, height: WALL_HEIGHT, depth: CELL_SIZE},
          scene,
        );
        wall.position = new Vector3(x * CELL_SIZE, WALL_HEIGHT / 2, z * CELL_SIZE);
        wall.receiveShadows = true;
        wall.checkCollisions = true;
        wall.material = materials[wallType];
        created.push(wall);
      }
    }

    levelMeshesRef.current = created;

    return () => {
      for (const m of levelMeshesRef.current) {
        m.dispose();
      }
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
          camera.speed = baseSpeed * bonuses.speedMult;

          // Jump physics: apply velocity and detect landing
          if (jumpVelocity !== 0) {
            camera.cameraDirection.y += jumpVelocity;
            jumpVelocity -= 0.012; // gravity acceleration per frame
            // Detect landing: camera stops falling when gravity collision kicks in
            if (jumpVelocity < 0 && camera.position.y <= GROUND_Y + 0.1) {
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
        }
      };

      scene.onBeforeRenderObservable.add(syncLoop);
      scene.onPointerDown = handlePointerDown;

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
      }

      (camera as any).__cleanup = () => {
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
      };
    });

    return () => {
      scene.onBeforeRenderObservable.remove(waitForPlayer);
      if ((camera as any).__cleanup) {
        (camera as any).__cleanup();
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

const EnemyRenderer = () => {
  const scene = useScene();
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());

  useEffect(() => {
    const meshMap = meshMapRef.current;

    const update = () => {
      const currentEnemies = world.entities.filter(
        (e: Entity) => !!e.enemy,
      );
      const currentIds = new Set(currentEnemies.map(e => e.id));

      // Remove meshes for dead enemies
      for (const [id, mesh] of meshMap) {
        if (!currentIds.has(id)) {
          disposeGoatMesh(mesh);
          meshMap.delete(id);
        }
      }

      // Find player for look-at rotation
      const player = world.entities.find(
        (e: Entity) => e.type === 'player',
      );

      // Create/update meshes for living enemies
      for (const enemy of currentEnemies) {
        if (!enemy.id || !enemy.position) continue;

        let mesh = meshMap.get(enemy.id);
        if (!mesh) {
          mesh = createGoatMesh(
            enemy.id,
            enemy.type as EntityType,
            scene,
          );
          meshMap.set(enemy.id, mesh);
        }

        // Position (mesh origin is at hooves, y=0)
        mesh.position.set(enemy.position.x, 0, enemy.position.z);

        // Face toward player
        if (player?.position) {
          const dx = player.position.x - mesh.position.x;
          const dz = player.position.z - mesh.position.z;
          mesh.rotation.y = Math.atan2(dx, dz);
        }

        // Visibility (shadowGoat transparency)
        mesh.visibility = enemy.enemy?.visibilityAlpha ?? 1;
      }
    };

    const obs = scene.onBeforeRenderObservable.add(update);

    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      for (const mesh of meshMap.values()) {
        disposeGoatMesh(mesh);
      }
      meshMap.clear();
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

  useEffect(() => {
    const meshMap = meshMapRef.current;

    // Shared materials: create once, reuse for all projectiles
    const playerMat = new StandardMaterial('projMat-player', scene);
    playerMat.emissiveColor = Color3.FromHexString('#ff8800');
    playerMat.diffuseColor = Color3.FromHexString('#ffcc44');
    playerMat.alpha = 0.9;

    const enemyMat = new StandardMaterial('projMat-enemy', scene);
    enemyMat.emissiveColor = Color3.FromHexString('#ff2200');
    enemyMat.diffuseColor = Color3.FromHexString('#ff4400');
    enemyMat.alpha = 0.9;

    const update = () => {
      const projectiles = world.entities.filter(
        (e: Entity) => !!e.projectile && !!e.position,
      );
      const currentIds = new Set(
        projectiles.map(e => e.id).filter(Boolean),
      );

      // Remove meshes for expired projectiles
      for (const [id, mesh] of meshMap) {
        if (!currentIds.has(id)) {
          mesh.dispose();
          meshMap.delete(id);
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
      meshMap.clear();
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
        const diameter = isWeapon ? 0.7 : 0.5;

        let mesh = meshMap.get(id);
        if (!mesh) {
          mesh = MeshBuilder.CreateSphere(
            `mesh-pickup-${id}`,
            {diameter, segments: 12},
            scene,
          );
          const mat = new StandardMaterial(`pickupMat-${id}`, scene);
          const color = isHealth ? '#44ff44' : isWeapon ? '#ff44ff' : '#ffaa00';
          const emissive = isHealth ? '#115511' : isWeapon ? '#441144' : '#443300';
          mat.emissiveColor = Color3.FromHexString(color);
          mat.diffuseColor = Color3.FromHexString(emissive);
          mat.alpha = 0.85;
          mesh.material = mat;
          meshMap.set(id, mesh);
        }

        mesh.position.x = pickup.position.x;
        mesh.position.y = 0.5 + bobOffset;
        mesh.position.z = pickup.position.z;
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
