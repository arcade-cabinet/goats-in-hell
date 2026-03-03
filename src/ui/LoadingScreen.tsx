/**
 * LoadingScreen — blocking per-circle asset preload before gameplay.
 *
 * Mounts when `screen === 'loading'`. Runs `preloadAllTextures()` and
 * `loadModels()` for every enemy, weapon, and projectile model in parallel.
 * Displays a progress counter, then patches `screen → 'playing'` when done.
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
import { preloadAllTextures } from '../r3f/level/Materials';
import { loadModels } from '../r3f/systems/ModelLoader';
import { useGameStore } from '../state/GameStore';

// All model entries to preload, in one flat list.
const ALL_MODEL_ENTRIES: [string, string][] = [
  ...(Object.entries(ENEMY_MODEL_ASSETS) as [string, string][]),
  ...(Object.entries(BOSS_MODEL_ASSETS) as [string, string][]),
  ...(Object.entries(WEAPON_MODEL_ASSETS) as [string, string][]),
  ...(Object.entries(PROJECTILE_MODEL_ASSETS) as [string, string][]),
];

// Total assets to load: models + textures (counted separately to drive progress).
// Textures are loaded as a batch — we count them as a single "task" for simplicity.
const TOTAL_TASKS = ALL_MODEL_ENTRIES.length + 1; // +1 for the texture batch

export const LoadingScreen: React.FC = () => {
  const patch = useGameStore((s) => s.patch);
  const [loaded, setLoaded] = useState(0);
  const [loadingText, setLoadingText] = useState('Preparing...');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let completed = 0;

    const onOne = () => {
      completed += 1;
      setLoaded(completed);
    };

    // Kick off models individually so the counter ticks as each finishes.
    const modelPromises = ALL_MODEL_ENTRIES.map(([key, subpath]) =>
      loadModels([[key, subpath]]).then(onOne),
    );

    // Kick off texture preload as a single batch.
    const texturePromise = preloadAllTextures().then(() => {
      onOne();
      setLoadingText('Descending...');
    });

    Promise.all([...modelPromises, texturePromise]).then(() => {
      // Brief delay so the "Descending..." text is visible before screen change.
      const t = setTimeout(() => {
        patch({ screen: 'playing', startTime: Date.now() });
      }, 400);
      return () => clearTimeout(t);
    });
  }, [patch]);

  const pct = Math.round((loaded / TOTAL_TASKS) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DESCENDING INTO HELL</Text>
      <Text style={styles.subtitle}>{loadingText}</Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any }]} />
      </View>

      <Text style={styles.counter}>
        {loaded} / {TOTAL_TASKS} assets
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
