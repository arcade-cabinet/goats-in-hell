/**
 * R3FRoot — game loop orchestrator.
 *
 * Generates levels, spawns ECS entities, mounts all R3F rendering components,
 * and runs per-frame systems (AI, combat, pickups, particles, progression).
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CELL_SIZE } from './constants';
import type { WeaponId } from './game/entities/components';
import { vec3 } from './game/entities/vec3';
import { world } from './game/entities/world';
import { generateArena, getArenaPlayerSpawn } from './game/levels/ArenaGenerator';
import { BOSS_ARENA_SIZE, generateBossArena } from './game/levels/BossArenas';
import { getThemeForFloor } from './game/levels/FloorThemes';
import type { LevelData } from './game/levels/LevelData';
import { LevelGenerator, type MapCell } from './game/levels/LevelGenerator';
import { aiSystemReset, aiSystemUpdate } from './game/systems/AISystem';
import { spawnBoss, spawnLevelEntities } from './game/systems/EntitySpawner';
import { advanceFloor, checkFloorComplete } from './game/systems/ProgressionSystem';
import { initAudio } from './r3f/audio/AudioSystem';
import { EnemyColliders } from './r3f/entities/EnemyColliders';
import { EnemyRenderer } from './r3f/entities/EnemyMesh';
import { PickupRenderer } from './r3f/entities/PickupMesh';
import { extractColliderData, LevelColliders, LevelMeshes } from './r3f/level/LevelMeshes';
import { PlayerController } from './r3f/PlayerController';
import { R3FApp } from './r3f/R3FApp';
import { DynamicLighting } from './r3f/rendering/Lighting';
import { PostProcessingEffects, triggerFloorFadeIn } from './r3f/rendering/PostProcessing';
import { clearCombatScene, combatSystemUpdate, setCombatScene } from './r3f/systems/CombatSystem';
import { updateParticles } from './r3f/systems/ParticleEffects';
import { pickupSystemUpdate } from './r3f/systems/PickupSystem';
import { MuzzleFlashEffect } from './r3f/weapons/MuzzleFlash';
import { ProjectileManager } from './r3f/weapons/Projectile';
import { WeaponViewModel } from './r3f/weapons/WeaponViewModel';
import { DIFFICULTY_PRESETS, useGameStore } from './state/GameStore';

// ---------------------------------------------------------------------------
// Level generation
// ---------------------------------------------------------------------------

function generateLevelData(
  encounterType: 'explore' | 'arena' | 'boss',
  floor: number,
  bossId: string | null,
): LevelData {
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

  if (encounterType === 'arena') {
    const size = 24;
    const grid = generateArena(size, floor) as MapCell[][];
    const spawn = getArenaPlayerSpawn(size);
    return {
      width: size,
      depth: size,
      floor,
      grid,
      playerSpawn: vec3(spawn.x * CELL_SIZE, 1, spawn.z * CELL_SIZE),
      spawns: [], // arena mode uses WaveSystem for dynamic spawning
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
  const levelDataRef = useRef<LevelData | null>(null);
  const graceTimerRef = useRef(0);
  const floorKeyRef = useRef(0);

  // Subscribe to store
  const stage = useGameStore((s) => s.stage);
  const difficulty = useGameStore((s) => s.difficulty);
  const nightmareFlags = useGameStore((s) => s.nightmareFlags);

  const diffMods = DIFFICULTY_PRESETS[difficulty];
  const nightmareDmgMult = nightmareFlags.nightmare || nightmareFlags.ultraNightmare ? 2 : 1;

  // Generate level when floor/encounterType changes
  const levelData = useMemo(
    () => generateLevelData(stage.encounterType, stage.floor, stage.bossId),
    [stage.encounterType, stage.floor, stage.bossId],
  );

  // Extract collider data
  const colliderData = useMemo(
    () => extractColliderData(levelData.grid, levelData.theme, levelData.width, levelData.depth),
    [levelData],
  );

  // Convert player spawn to Three.js coordinates (negate Z)
  const spawnPosition = useMemo<[number, number, number]>(
    () => [levelData.playerSpawn.x, levelData.playerSpawn.y, -levelData.playerSpawn.z],
    [levelData.playerSpawn],
  );

  // Spawn entities + player on level change
  useEffect(() => {
    // Reset AI system before clearing entities
    aiSystemReset();

    // Clear all existing entities
    const existing = [...world.entities];
    for (const e of existing) {
      world.remove(e);
    }

    // Create player entity
    const store = useGameStore.getState();
    const restored = store.restoredPlayerState;
    const playerHp = restored?.playerHp ?? diffMods.playerStartHp;
    const playerMaxHp = diffMods.playerStartHp;
    world.add({
      id: 'player',
      type: 'player',
      position: { ...levelData.playerSpawn },
      player: {
        hp: playerHp,
        maxHp: playerMaxHp,
        speed: 5,
        sprintMult: 1.5,
        currentWeapon: (restored?.currentWeapon as WeaponId) ?? 'hellPistol',
        weapons: [(restored?.currentWeapon as WeaponId) ?? 'hellPistol'],
        isReloading: false,
        reloadStart: 0,
      },
      ammo: {
        hellPistol: { current: 12, reserve: 48, magSize: 12 },
        brimShotgun: { current: 0, reserve: 0, magSize: 6 },
        hellfireCannon: { current: 0, reserve: 0, magSize: 30 },
        goatsBane: { current: 0, reserve: 0, magSize: 3 },
      },
    });

    // Spawn level entities
    if (stage.encounterType === 'explore') {
      spawnLevelEntities(levelData, diffMods, nightmareDmgMult, nightmareFlags.nightmare);
    } else if (stage.encounterType === 'boss' && stage.bossId) {
      spawnBoss(stage.bossId, levelData, diffMods, nightmareDmgMult, nightmareFlags.nightmare);
    }
    // Arena mode uses WaveSystem for dynamic spawning

    // Set grace period and trigger floor fade-in
    graceTimerRef.current = 2000; // 2 seconds
    triggerFloorFadeIn();

    // Update floor key to force re-render of mesh components
    floorKeyRef.current++;
    levelDataRef.current = levelData;

    // Init audio on first interaction
    initAudio();
  }, [levelData, stage, diffMods, nightmareDmgMult, nightmareFlags]);

  // Wire combat scene ref
  useEffect(() => {
    setCombatScene(scene);
    return () => clearCombatScene();
  }, [scene]);

  // Per-frame game loop
  useFrame((_state, delta) => {
    const deltaMs = delta * 1000;
    const screen = useGameStore.getState().screen;
    if (screen !== 'playing') return;

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
    updateParticles(deltaMs);

    // Progression check — floor cleared?
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
      <DynamicLighting theme={levelData.theme} />
      <PostProcessingEffects />
    </>
  );
}

// ---------------------------------------------------------------------------
// Top-level export
// ---------------------------------------------------------------------------

export default function R3FRoot() {
  return (
    <R3FApp>
      <GameScene />
    </R3FApp>
  );
}
