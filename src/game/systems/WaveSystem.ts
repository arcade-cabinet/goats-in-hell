import {Vector3} from '@babylonjs/core';
import type {Entity, EntityType} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';
import {useGameStore, DIFFICULTY_PRESETS} from '../../state/GameStore';
import {getEnemyStats} from '../entities/enemyStats';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let currentWave = 0;
let waveActive = false;
let spawnTimer = 0;
let enemiesSpawnedThisWave = 0;
let totalEnemiesForWave = 0;
let killStreak = 0;
let lastKillTime = 0;
let scoreMultiplier = 1;
let lastKnownKills = 0;
let waveSpawnCounter = 0;
let arenaPickupCounter = 0;
let cachedArenaSize = 0;

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** Reset all wave system state to initial values. */
export function resetWaveSystem(): void {
  currentWave = 0;
  waveActive = false;
  spawnTimer = 0;
  enemiesSpawnedThisWave = 0;
  totalEnemiesForWave = 0;
  killStreak = 0;
  lastKillTime = 0;
  scoreMultiplier = 1;
  lastKnownKills = 0;
  waveSpawnCounter = 0;
  arenaPickupCounter = 0;
  cachedArenaSize = 0;
}

// ---------------------------------------------------------------------------
// Wave progression
// ---------------------------------------------------------------------------

/** Begin the next wave by incrementing the counter and preparing spawn state. */
export function startNextWave(): void {
  currentWave++;
  waveActive = true;
  spawnTimer = 0;
  enemiesSpawnedThisWave = 0;
  totalEnemiesForWave = Math.min(30, 3 + currentWave * 2);
}


// ---------------------------------------------------------------------------
// Enemy type selection
// ---------------------------------------------------------------------------

/** Pick a random enemy type from the pool available at the given wave. */
export function getEnemyTypeForWave(wave: number): EntityType {
  const pool: EntityType[] = ['goat'];

  if (wave >= 3) {
    pool.push('hellgoat');
  }
  if (wave >= 5) {
    pool.push('fireGoat');
  }
  if (wave >= 7) {
    pool.push('shadowGoat');
  }
  if (wave >= 9) {
    pool.push('goatKnight');
  }

  // Every 5th wave has a 10% chance for an archGoat
  if (wave % 5 === 0 && Math.random() < 0.1) {
    return 'archGoat';
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Arena pickups between waves
// ---------------------------------------------------------------------------

function spawnArenaPickups(arenaSize: number): void {
  const storeState = useGameStore.getState();
  const isNightmare = storeState.nightmareFlags.nightmare || storeState.nightmareFlags.ultraNightmare;

  // Spawn 2-3 ammo pickups
  const ammoCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < ammoCount; i++) {
    const sx = 3 + Math.floor(Math.random() * (arenaSize - 6));
    const sz = 3 + Math.floor(Math.random() * (arenaSize - 6));
    arenaPickupCounter++;
    world.add({
      id: `arena-pickup-${arenaPickupCounter}`,
      type: 'ammo',
      position: new Vector3(sx * 2, 0.5, sz * 2),
      pickup: {
        pickupType: 'ammo',
        value: 12,
        active: true,
      },
    });
  }

  // Spawn 1 health pickup (unless nightmare mode)
  if (!isNightmare) {
    const hx = 3 + Math.floor(Math.random() * (arenaSize - 6));
    const hz = 3 + Math.floor(Math.random() * (arenaSize - 6));
    arenaPickupCounter++;
    world.add({
      id: `arena-pickup-${arenaPickupCounter}`,
      type: 'health',
      position: new Vector3(hx * 2, 0.5, hz * 2),
      pickup: {
        pickupType: 'health',
        value: 25,
        active: true,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main update loop
// ---------------------------------------------------------------------------

/** Call once per frame to drive wave spawning and kill-streak tracking. */
export function waveSystemUpdate(deltaTime: number, arenaSize: number): void {
  const state = GameState.get();
  cachedArenaSize = arenaSize;

  // ------------------------------------------------------------------
  // Count remaining enemies
  // ------------------------------------------------------------------
  let enemyCount = 0;
  for (const entity of world.entities) {
    if (entity.enemy) {
      enemyCount++;
    }
  }

  // ------------------------------------------------------------------
  // If no enemies remain and the wave is not actively spawning, start next
  // ------------------------------------------------------------------
  if (enemyCount === 0 && !waveActive) {
    // Drop pickups between waves (every other wave)
    if (currentWave > 0 && currentWave % 2 === 0) {
      spawnArenaPickups(arenaSize);
    }
    startNextWave();
  }

  // ------------------------------------------------------------------
  // Spawn enemies while the wave is active
  // ------------------------------------------------------------------
  if (waveActive && enemiesSpawnedThisWave < totalEnemiesForWave) {
    const dtScale = deltaTime / 16;
    spawnTimer -= dtScale;

    if (spawnTimer <= 0) {
      // Pick a random edge spawn point
      const edge = Math.floor(Math.random() * 4);
      let sx: number;
      let sz: number;

      switch (edge) {
        case 0: // top edge
          sx = 2 + Math.floor(Math.random() * (arenaSize - 4));
          sz = 1;
          break;
        case 1: // bottom edge
          sx = 2 + Math.floor(Math.random() * (arenaSize - 4));
          sz = arenaSize - 2;
          break;
        case 2: // left edge
          sx = 1;
          sz = 2 + Math.floor(Math.random() * (arenaSize - 4));
          break;
        default: // right edge
          sx = arenaSize - 2;
          sz = 2 + Math.floor(Math.random() * (arenaSize - 4));
          break;
      }

      const enemyType = getEnemyTypeForWave(currentWave);
      const stats = getEnemyStats(enemyType);

      // Apply difficulty scaling
      const storeState = useGameStore.getState();
      const diffMods = DIFFICULTY_PRESETS[storeState.difficulty];
      const nightmareDmgMult =
        storeState.nightmareFlags.nightmare || storeState.nightmareFlags.ultraNightmare ? 2 : 1;

      waveSpawnCounter++;
      const entity: Entity = {
        id: `wave-${currentWave}-${waveSpawnCounter}`,
        type: enemyType,
        position: new Vector3(sx * 2, 1, sz * 2), // multiply by CELL_SIZE (2)
        enemy: {
          ...stats,
          hp: Math.ceil(stats.hp * diffMods.enemyHpMult),
          maxHp: Math.ceil(stats.maxHp * diffMods.enemyHpMult),
          damage: Math.ceil(stats.damage * diffMods.enemyDmgMult * nightmareDmgMult),
          speed: stats.speed * diffMods.enemySpeedMult,
          alert: true, // arena enemies are always alert
          attackCooldown: 0,
        },
      };

      world.add(entity);

      spawnTimer = 60; // one enemy per second at 60fps
      enemiesSpawnedThisWave++;
    }

    // All enemies for this wave have been spawned - let the player clear them
    if (enemiesSpawnedThisWave >= totalEnemiesForWave) {
      waveActive = false;
    }
  }

  // ------------------------------------------------------------------
  // Kill streak tracking
  // ------------------------------------------------------------------
  const currentKills = state.kills;
  const now = Date.now();

  if (currentKills > lastKnownKills) {
    // A kill just happened
    const newKills = currentKills - lastKnownKills;
    if (now - lastKillTime < 3000) {
      // Within 3 seconds of last kill - extend the streak
      killStreak += newKills;
      scoreMultiplier = Math.min(3, 1 + killStreak * 0.1);
    } else {
      // Streak broken - reset
      killStreak = 1;
      scoreMultiplier = 1;
    }

    // Apply score multiplier bonus for streak kills
    if (scoreMultiplier > 1) {
      const bonus = Math.floor(state.score * (scoreMultiplier - 1) * 0.01 * newKills);
      if (bonus > 0) {
        GameState.set({score: state.score + bonus});
      }
    }

    lastKillTime = now;
    lastKnownKills = currentKills;
  } else if (now - lastKillTime >= 3000 && killStreak > 0) {
    // No kills for 3 seconds - reset streak
    killStreak = 0;
    scoreMultiplier = 1;
  }
}

// ---------------------------------------------------------------------------
// HUD info
// ---------------------------------------------------------------------------

/** Return current wave state for HUD display and game logic. */
export function getWaveInfo(): {
  wave: number;
  multiplier: number;
  streak: number;
  waveActive: boolean;
  enemiesSpawnedThisWave: number;
} {
  return {
    wave: currentWave,
    multiplier: scoreMultiplier,
    streak: killStreak,
    waveActive,
    enemiesSpawnedThisWave,
  };
}
