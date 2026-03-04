/**
 * LoadingScreen — per-circle asset preload gate before gameplay.
 *
 * Mounts when `screen === 'loading'`. Reads the current circle's level JSON
 * to determine exactly which textures and models are needed — no hardcoded
 * lookup tables. The JSON is the authoritative source of what to load.
 *
 * Loading order:
 *   1. Circle textures from `level.requiredTextureKeys` (computed at export time)
 *   2. Enemy + boss models derived from `spawns[].spawnCategory` in the JSON
 *   3. All weapon + projectile models (always needed for combat)
 *
 * R3FRoot (and the Canvas) still mounts alongside this overlay so the physics
 * world and 3D context initialise concurrently — the player enters gameplay
 * with everything ready the instant the loading gate opens.
 */
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BOSS_MODEL_ASSETS,
  ENEMY_MODEL_ASSETS,
  PROJECTILE_MODEL_ASSETS,
  WEAPON_MODEL_ASSETS,
} from '../game/systems/AssetRegistry';
import { getCircleLevel } from '../levels';
import type { CompiledLevel } from '../levels/LevelSchema';
import { preloadTextureKeys } from '../r3f/level/Materials';
import { loadModels } from '../r3f/systems/ModelLoader';
import { useGameStore } from '../state/GameStore';

// ---------------------------------------------------------------------------
// Model key derivation — from JSON data, no hardcoded lookup tables
// ---------------------------------------------------------------------------

/**
 * Collect enemy and boss model keys from the level JSON.
 * Uses spawnCategory exported by export-levels.ts so no runtime table lookups.
 * Falls back gracefully for old exports without spawnCategory.
 */
function deriveEnemyBossModelEntries(level: CompiledLevel): [string, string][] {
  const entries = new Map<string, string>();

  const addEntityType = (entityType: string, category: string) => {
    if (category === 'enemy') {
      const key = `enemy-${entityType}`;
      const path = ENEMY_MODEL_ASSETS[key as keyof typeof ENEMY_MODEL_ASSETS];
      if (path) entries.set(key, path);
    } else if (category === 'boss') {
      // Boss entity types in JSON are 'il-vecchio', keys in BOSS_MODEL_ASSETS are 'boss-il-vecchio'
      const key = `boss-${entityType}` as keyof typeof BOSS_MODEL_ASSETS;
      const path = BOSS_MODEL_ASSETS[key];
      if (path) entries.set(key, path);
    }
  };

  for (const spawn of level.spawns) {
    if (spawn.spawnCategory) {
      addEntityType(spawn.type, spawn.spawnCategory);
    }
  }

  for (const e of level.triggeredEntities ?? []) {
    if (e.spawnCategory) {
      addEntityType(e.entityType, e.spawnCategory);
    }
  }

  return [...entries.entries()];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LoadingScreen: React.FC = () => {
  const patch = useGameStore((s) => s.patch);
  const circleNumber = useGameStore((s) => s.circleNumber);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(1);
  const [loadingText, setLoadingText] = useState('Preparing...');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    let completed = 0;

    const onOne = () => {
      completed += 1;
      setLoaded(completed);
    };

    // ── Resolve which assets are needed from the level JSON ──────────────
    let level: CompiledLevel | null = null;
    try {
      level = getCircleLevel(circleNumber);
    } catch (_e) {
      console.warn(`[LoadingScreen] Could not get level for circle ${circleNumber}, loading all`);
    }

    // Texture keys come directly from the JSON — no runtime lookup table
    const textureKeys: string[] = level?.requiredTextureKeys ?? [];

    // Enemy/boss models derived from spawnCategory in JSON; fall back to all on error
    const enemyBossEntries = level
      ? deriveEnemyBossModelEntries(level)
      : ([...Object.entries(ENEMY_MODEL_ASSETS), ...Object.entries(BOSS_MODEL_ASSETS)] as [
          string,
          string,
        ][]);

    // Weapons + projectiles always needed for combat
    const alwaysEntries: [string, string][] = [
      ...(Object.entries(WEAPON_MODEL_ASSETS) as [string, string][]),
      ...(Object.entries(PROJECTILE_MODEL_ASSETS) as [string, string][]),
    ];

    const allModelEntries = [...enemyBossEntries, ...alwaysEntries];

    // Total = 1 (texture batch) + individual model count
    const totalTasks = 1 + allModelEntries.length;
    setTotal(totalTasks);

    // ── Kick off loads ───────────────────────────────────────────────────

    // Texture batch — load exactly this circle's required textures
    const texturePromise = preloadTextureKeys(textureKeys)
      .then(() => {
        onOne();
        setLoadingText('Descending...');
      })
      .catch(onOne);

    // Models individually so the counter ticks as each finishes
    const modelPromises = allModelEntries.map(([key, subpath]) =>
      loadModels([[key, subpath]])
        .then(onOne)
        .catch(onOne),
    );

    // allSettled — one bad asset never deadlocks the loading gate
    Promise.allSettled([texturePromise, ...modelPromises]).then(() => {
      if (cancelled) return;
      transitionTimer = setTimeout(() => {
        patch({ screen: 'playing', startTime: Date.now() });
      }, 400);
    });

    return () => {
      cancelled = true;
      if (transitionTimer !== null) clearTimeout(transitionTimer);
    };
  }, [patch, circleNumber]);

  const pct = Math.round((loaded / total) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DESCENDING INTO HELL</Text>
      <Text style={styles.subtitle}>{loadingText}</Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any }]} />
      </View>

      <Text style={styles.counter}>
        {loaded} / {total} assets
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a0808',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  title: {
    color: '#ff4400',
    fontSize: 24,
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginBottom: 16,
  },
  subtitle: {
    color: '#ff6622',
    fontSize: 14,
    fontFamily: 'monospace',
    opacity: 0.7,
    marginBottom: 32,
  },
  barTrack: {
    width: 300,
    height: 6,
    backgroundColor: '#3a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#ff4400',
    borderRadius: 3,
  },
  counter: {
    color: '#ff4400',
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.5,
    marginTop: 12,
  },
});
