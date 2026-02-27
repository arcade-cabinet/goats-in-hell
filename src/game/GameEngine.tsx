import {
  Color3,
  Color4,
  Mesh,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useScene} from 'reactylon';
import type {Entity, EntityType, WeaponId} from './entities/components';
import {world} from './entities/world';
import {COLORS} from '../constants';
import {
  CELL_SIZE,
  LevelGenerator,
  MapCell,
  WALL_HEIGHT,
} from './levels/LevelGenerator';
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
import {initAudio} from './systems/AudioSystem';
import {
  waveSystemUpdate,
  resetWaveSystem,
  getWaveInfo,
} from './systems/WaveSystem';
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
import {getEnemySpriteTexture} from './rendering/EnemySprites';
import {AIGovernor} from './systems/AIGovernor';
import {useGameStore, DIFFICULTY_PRESETS} from '../state/GameStore';

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
];

// Billboard mode ALL (X + Y + Z)
const BILLBOARD_ALL = 7;

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

/** Canonical enemy stats - single source of truth for spawning. */
export function getEnemyStats(
  type: EntityType,
): Omit<NonNullable<Entity['enemy']>, 'alert' | 'attackCooldown'> {
  switch (type) {
    case 'hellgoat':
      return {
        hp: 8,
        maxHp: 8,
        damage: 8,
        speed: 0.06,
        attackRange: 2,
        scoreValue: 250,
      };
    case 'fireGoat':
      return {
        hp: 6,
        maxHp: 6,
        damage: 4,
        speed: 0.03,
        attackRange: 2,
        scoreValue: 200,
        canShoot: true,
        shootCooldown: 90,
      };
    case 'shadowGoat':
      return {
        hp: 4,
        maxHp: 4,
        damage: 10,
        speed: 0.07,
        attackRange: 1.5,
        scoreValue: 300,
        isInvisible: true,
        visibilityAlpha: 0.15,
      };
    case 'goatKnight':
      return {
        hp: 15,
        maxHp: 15,
        damage: 12,
        speed: 0.03,
        attackRange: 2,
        scoreValue: 400,
        isArmored: true,
        armorHp: 5,
      };
    case 'archGoat':
      return {
        hp: 100,
        maxHp: 100,
        damage: 15,
        speed: 0.02,
        attackRange: 3,
        scoreValue: 1000,
        canShoot: true,
        shootCooldown: 120,
      };
    default:
      return {
        hp: 5,
        maxHp: 5,
        damage: 5,
        speed: 0.04,
        attackRange: 2,
        scoreValue: 100,
      };
  }
}

// Enemy sprite textures are now in ./rendering/EnemySprites.ts

// ---------------------------------------------------------------------------
// Main Game Engine
// ---------------------------------------------------------------------------

export function GameEngine() {
  const scene = useScene();
  const [level, setLevel] = useState<LevelGenerator | null>(null);
  const lavaLightsRef = useRef<DynamicLight[]>([]);
  const spotlightRef = useRef<{
    light: import('@babylonjs/core').SpotLight;
    shadowGen: import('@babylonjs/core').ShadowGenerator;
  } | null>(null);
  const gameInitialized = useRef(false);
  const [reinitCounter, setReinitCounter] = useState(0);

  // Listen for floor changes (victory → playing transition) to regenerate
  useEffect(() => {
    return GameState.subscribe(state => {
      if (state.screen === 'playing' && gameInitialized.current) {
        // Check if we need to regenerate the level (floor changed or new game)
        const currentLevel = level;
        if (currentLevel && state.floor !== currentLevel.floor) {
          gameInitialized.current = false;
          setReinitCounter(n => n + 1);
        }
      }
    });
  }, [level]);

  // Initialize level and spawn entities
  useEffect(() => {
    if (gameInitialized.current) return;
    gameInitialized.current = true;

    initAudio();

    const gs = GameState.get();
    const storeState = useGameStore.getState();
    const floor = gs.floor;
    const encounterType = storeState.stage.encounterType;
    const diffMods = DIFFICULTY_PRESETS[storeState.difficulty];
    const newLevel = new LevelGenerator(30, 30, floor);
    newLevel.generate();
    setLevel(newLevel);

    // Reset wave system for arena encounters
    if (encounterType === 'arena') {
      resetWaveSystem();
    }

    // Clear existing entities and YUKA state from previous floor
    aiSystemReset();
    while (world.entities.length > 0) {
      world.remove(world.entities[0]);
    }

    // Preserve player HP across floors (or start fresh on floor 1)
    const maxHp = diffMods.playerStartHp;
    const existingHp = floor > 1 ? Math.max(30, maxHp) : maxHp;

    // Spawn player
    world.add({
      id: 'player-1',
      type: 'player',
      position: newLevel.playerSpawn.clone(),
      rotation: Vector3.Zero(),
      player: {
        hp: existingHp,
        maxHp,
        speed: 0.1,
        sprintMult: 1.5,
        currentWeapon: 'hellPistol',
        weapons: ['hellPistol'],
        isReloading: false,
        reloadStart: 0,
      },
      ammo: initPlayerAmmo(),
    });

    // Spawn entities from level data (with difficulty scaling)
    newLevel.spawns.forEach((spawn, idx) => {
      const entityType = spawn.type as EntityType;
      if (ENEMY_TYPES.includes(entityType)) {
        const stats = getEnemyStats(entityType);
        const scaledHp = Math.ceil(stats.hp * diffMods.enemyHpMult);
        const scaledMaxHp = Math.ceil(stats.maxHp * diffMods.enemyHpMult);
        const scaledDmg = Math.ceil(stats.damage * diffMods.enemyDmgMult);
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
        world.add({
          id: `pickup-${idx}`,
          type: spawn.type as EntityType,
          position: new Vector3(spawn.x, 0.5, spawn.z),
          pickup: {
            pickupType: spawn.type as 'health' | 'ammo',
            value: spawn.type === 'health' ? 25 : 8,
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
      }
    });

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
      newLevel.grid.map(row => row.map(c => c as number)),
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

    // Store previous enemy count for death burst detection
    let prevEnemyIds = new Set(
      world.entities.filter(e => e.enemy).map(e => e.id),
    );

    // Grace period: 2 seconds of invulnerability at floor start
    const GRACE_PERIOD_MS = 2000;
    const graceEnd = performance.now() + GRACE_PERIOD_MS;

    // Main game loop
    let lastTime = performance.now();
    const gameLoop = () => {
      const gs = GameState.get();
      if (gs.screen !== 'playing') return;

      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      // Find player
      const player = world.entities.find((e: Entity) => e.type === 'player');
      if (!player) return;

      const inGracePeriod = now < graceEnd;

      // 1. AI update (skip during grace period so enemies don't attack)
      if (!inGracePeriod) {
        aiSystemUpdate(dt);
      }

      // 2. Combat (projectile movement + collision) - skip during grace
      if (!inGracePeriod) {
        combatSystemUpdate(dt);
      }

      // 3. Pickups
      pickupSystemUpdate();

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
            const isBoss = id?.includes('archGoat') || false;
            createDeathBurst(mesh.position.clone(), scene, isBoss);
          }
        }
      }
      prevEnemyIds = currentEnemyIds;

      // 9. Check win/death conditions (skip during grace period —
      //    enemies need time to register and the player is invulnerable)
      if (!inGracePeriod) {
        if (checkPlayerDeath()) {
          triggerDeath();
        } else if (encounterType === 'arena') {
          // Arena: drive wave spawning; complete after 5+ waves cleared
          waveSystemUpdate(dt, newLevel.width);
          const waveInfo = getWaveInfo();
          const enemyCount = world.entities.filter(e => e.enemy).length;
          if (waveInfo.wave >= 5 && enemyCount === 0) {
            advanceFloor();
          }
        } else if (encounterType === 'boss') {
          // Boss: complete when no archGoat/boss entity remains
          const bossAlive = world.entities.some(
            e => e.type === 'archGoat' && e.enemy,
          );
          if (!bossAlive && checkFloorComplete()) {
            const bossId = storeState.stage.bossId;
            if (bossId) {
              useGameStore.getState().defeatBoss(bossId);
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
    };

    scene.onBeforeRenderObservable.add(gameLoop);

    return () => {
      scene.onBeforeRenderObservable.remove(postProcObserver);
      scene.onBeforeRenderObservable.removeCallback(gameLoop);
      disposePostProcessing();
      lavaLightsRef.current.forEach(dl => dl.light.dispose());
      lavaParticles.forEach(p => p.dispose());
      if (spotlightRef.current) {
        spotlightRef.current.shadowGen.dispose();
        spotlightRef.current.light.dispose();
      }
    };
  }, [scene, reinitCounter]);

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

  // Build wall meshes with shared materials + enable collision for AI
  const wallMeshes = useMemo(() => {
    if (!level || !materials) return null;
    const meshes: JSX.Element[] = [];

    for (let z = 0; z < level.depth; z++) {
      for (let x = 0; x < level.width; x++) {
        const cell = level.grid[z][x];
        const wallType = mapCellToWallType(cell);
        if (!wallType) continue;

        const mat = materials[wallType];
        meshes.push(
          <box
            key={`wall-${x}-${z}`}
            name={`wall-${x}-${z}`}
            options={{width: CELL_SIZE, height: WALL_HEIGHT, depth: CELL_SIZE}}
            position={
              new Vector3(x * CELL_SIZE, WALL_HEIGHT / 2, z * CELL_SIZE)
            }
            receiveShadows
            checkCollisions
            material={mat}
          />,
        );
      }
    }
    return meshes;
  }, [level, materials]);

  if (!level || !materials) return null;

  const ambientColor = level.theme?.ambientColor || '#ff8888';

  return (
    <transformNode name="game-root">
      {/* Environment Light - tinted by floor theme */}
      <hemisphericLight
        name="ambient"
        intensity={0.35}
        direction={new Vector3(0, 1, 0)}
        diffuse={Color3.FromHexString(ambientColor)}
        groundColor={Color3.FromHexString('#110000')}
      />

      {/* Floor */}
      <ground
        name="floor"
        options={{
          width: level.width * CELL_SIZE,
          height: level.depth * CELL_SIZE,
        }}
        position={
          new Vector3(
            (level.width * CELL_SIZE) / 2,
            0,
            (level.depth * CELL_SIZE) / 2,
          )
        }
        receiveShadows
        checkCollisions
        material={materials.floor}
      />

      {/* Ceiling */}
      <ground
        name="ceiling"
        options={{
          width: level.width * CELL_SIZE,
          height: level.depth * CELL_SIZE,
        }}
        position={
          new Vector3(
            (level.width * CELL_SIZE) / 2,
            WALL_HEIGHT,
            (level.depth * CELL_SIZE) / 2,
          )
        }
        rotation={new Vector3(Math.PI, 0, 0)}
        material={materials.ceiling}
      />

      {/* Walls */}
      {wallMeshes}

      {/* Player camera + controls */}
      <PlayerController level={level} />

      {/* Enemy rendering */}
      <EnemyRenderer />

      {/* Pickup rendering */}
      <PickupRenderer />
    </transformNode>
  );
}

// ---------------------------------------------------------------------------
// Player Controller
// ---------------------------------------------------------------------------

const PlayerController = ({level}: {level: LevelGenerator}) => {
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
      camera.checkCollisions = !autoplay; // AI handles its own collision
      camera.applyGravity = !autoplay;
      camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      camera.speed = 0.3;
      camera.angularSensibility = 2000;
      camera.inertia = 0.7;

      scene.gravity = new Vector3(0, -9.81 / 60, 0);
      scene.collisionsEnabled = true;

      // Sprint state (manual mode only)
      let isSprinting = false;

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
      } else {
        // --- Manual: attach keyboard/mouse controls ---
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

        // Manual mode: sprint speed
        if (!autoplay) {
          camera.speed = isSprinting ? 0.45 : 0.3;
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

      // Manual-mode shooting with muzzle flash
      const handlePointerDown = () => {
        if (autoplay) return;
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
// Enemy Renderer - uses procedural sprite textures
// ---------------------------------------------------------------------------

const EnemyRenderer = () => {
  const scene = useScene();
  const [enemies, setEnemies] = useState<Entity[]>(
    world.entities.filter((e: Entity) => !!e.enemy),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setEnemies([...world.entities.filter((e: Entity) => !!e.enemy)]);
    }, 50); // 50ms for smoother updates
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {enemies.map((enemy: Entity) => {
        if (!enemy.position) return null;

        let scale = 2;
        let emissiveHex = '#330000';
        switch (enemy.type) {
          case 'hellgoat':
            emissiveHex = '#441100';
            break;
          case 'archGoat':
            emissiveHex = '#440022';
            scale = 3.5;
            break;
          case 'fireGoat':
            emissiveHex = '#663300';
            break;
          case 'shadowGoat':
            emissiveHex = '#110022';
            break;
          case 'goatKnight':
            emissiveHex = '#223344';
            scale = 2.5;
            break;
        }

        const alpha = enemy.enemy?.visibilityAlpha ?? 1;

        // Damage flash: briefly turn white when recently hit
        const hpRatio = enemy.enemy
          ? enemy.enemy.hp / enemy.enemy.maxHp
          : 1;

        return (
          <plane
            key={enemy.id}
            name={`mesh-enemy-${enemy.id}`}
            options={{size: scale}}
            billboardMode={BILLBOARD_ALL}
            position={
              new Vector3(enemy.position.x, scale / 2, enemy.position.z)
            }>
            <standardMaterial
              name={`mat-${enemy.id}`}
              diffuseTexture={getEnemySpriteTexture(
                enemy.type as EntityType,
                scene,
              )}
              emissiveColor={Color3.FromHexString(emissiveHex)}
              useAlphaFromDiffuseTexture
              alpha={alpha}
              backFaceCulling={false}
            />
          </plane>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Pickup Renderer - bobbing + glowing
// ---------------------------------------------------------------------------

const PickupRenderer = () => {
  const [pickups, setPickups] = useState<Entity[]>(
    world.entities.filter((e: Entity) => e.pickup?.active),
  );
  const [bobOffset, setBobOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPickups([...world.entities.filter((e: Entity) => e.pickup?.active)]);
      setBobOffset(Math.sin(Date.now() * 0.003) * 0.15);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {pickups.map((pickup: Entity) => {
        if (!pickup.position) return null;

        const isHealth = pickup.pickup?.pickupType === 'health';
        const isWeapon = pickup.pickup?.pickupType === 'weapon';
        const color = isHealth
          ? '#44ff44'
          : isWeapon
            ? '#ff44ff'
            : '#ffaa00';
        const emissive = isHealth
          ? '#115511'
          : isWeapon
            ? '#441144'
            : '#443300';
        const diameter = isWeapon ? 0.7 : 0.5;

        return (
          <sphere
            key={pickup.id}
            name={`mesh-pickup-${pickup.id}`}
            options={{diameter, segments: 12}}
            position={
              new Vector3(
                pickup.position.x,
                0.5 + bobOffset,
                pickup.position.z,
              )
            }>
            <standardMaterial
              name={`pickupMat-${pickup.id}`}
              emissiveColor={Color3.FromHexString(color)}
              diffuseColor={Color3.FromHexString(emissive)}
              alpha={0.85}
            />
          </sphere>
        );
      })}
    </>
  );
};
