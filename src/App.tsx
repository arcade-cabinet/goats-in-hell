/**
 * App -- top-level application shell and screen router.
 *
 * Reads the current `screen` state from the Zustand store and conditionally
 * renders the appropriate overlay (MainMenu, HUD, PauseMenu, DeathScreen,
 * VictoryScreen, BossIntroScreen, GameCompleteScreen) on top of the R3F
 * canvas. Also handles autoplay mode (auto-start, auto-restart on death,
 * auto-advance through victory/boss-intro/game-complete) and ESC key
 * pause toggling for manual play.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import R3FRoot from './R3FRoot';
import { DevOverlay } from './r3f/debug/DevOverlay';
import { installGameDevBridge } from './r3f/debug/GameDevBridge';
import { TouchOverlay } from './r3f/input/providers/TouchProvider';
import type { Difficulty } from './state/GameStore';
import { generateSeedPhrase, useGameStore } from './state/GameStore';
import { BossIntroScreen } from './ui/BossIntroScreen';
import { DeathScreen } from './ui/DeathScreen';
import { GameCompleteScreen } from './ui/GameCompleteScreen';
import { HUD } from './ui/HUD';
import { LoadingScreen } from './ui/LoadingScreen';
import { MainMenu } from './ui/MainMenu';
import { PauseMenu } from './ui/PauseMenu';
import { VictoryScreen } from './ui/VictoryScreen';

// Show touch controls on any touch-capable device (phones, tablets, foldables).
// Evaluated once at module load — screen size may change on foldables but we
// add a ResizeObserver at component level to re-check on fold/unfold.
const hasTouchInput =
  typeof window !== 'undefined' && 'ontouchstart' in window && navigator.maxTouchPoints > 0;

// Detect ?devmode URL param once at module init (stable for lifetime of the page)
const isDevMode =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('devmode');

const App = () => {
  const screen = useGameStore((s) => s.screen);
  const patch = useGameStore((s) => s.patch);
  const autoplay = useGameStore((s) => s.autoplay);
  const startNewGame = useGameStore((s) => s.startNewGame);

  // Re-detect touch on fold/unfold (foldable phones like OnePlus Open).
  // ResizeObserver fires when the viewport changes (e.g. the phone is unfolded),
  // so the touch overlay appears/disappears without a page reload.
  const [touchActive, setTouchActive] = useState(hasTouchInput);
  useEffect(() => {
    if (!hasTouchInput) return;
    const obs = new ResizeObserver(() => {
      setTouchActive('ontouchstart' in window && navigator.maxTouchPoints > 0);
    });
    obs.observe(document.documentElement);
    return () => obs.disconnect();
  }, []);

  // Install window.__game dev bridge once on mount (only when ?devmode is active)
  useEffect(() => {
    if (isDevMode) installGameDevBridge();
  }, []);

  // Autoplay: auto-start a game on mount, optionally at a specific difficulty
  // URL: ?autoplay or ?autoplay=easy or ?autoplay=hard
  useEffect(() => {
    if (!autoplay) return;
    if (useGameStore.getState().screen !== 'mainMenu') return;

    let difficulty: Difficulty = 'normal';
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('autoplay');
      if (param === 'easy') difficulty = 'easy';
      else if (param === 'hard') difficulty = 'hard';
    }

    // Short delay so the engine wrapper mounts first
    const timer = setTimeout(() => {
      startNewGame(
        difficulty,
        { nightmare: false, permadeath: false, ultraNightmare: false },
        generateSeedPhrase(),
      );
    }, 100);
    return () => clearTimeout(timer);
  }, [autoplay, startNewGame]);

  // Autoplay: auto-restart on death
  useEffect(() => {
    if (!autoplay) return;
    if (screen !== 'dead') return;

    const timer = setTimeout(() => {
      const s = useGameStore.getState();
      startNewGame(s.difficulty, s.nightmareFlags, generateSeedPhrase());
    }, 3000); // 3-second pause on death screen before restarting
    return () => clearTimeout(timer);
  }, [autoplay, screen, startNewGame]);

  // Autoplay: auto-advance on victory / bossIntro / gameComplete
  const advanceStage = useGameStore((s) => s.advanceStage);
  useEffect(() => {
    if (!autoplay) return;
    if (screen === 'victory') {
      const timer = setTimeout(() => {
        advanceStage();
        const nextScreen = useGameStore.getState().screen;
        if (nextScreen !== 'bossIntro' && nextScreen !== 'gameComplete') {
          patch({ screen: 'loading' });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (screen === 'bossIntro') {
      const timer = setTimeout(() => {
        patch({ screen: 'loading' });
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (screen === 'gameComplete') {
      // Auto-restart after completing the game
      const timer = setTimeout(() => {
        const s = useGameStore.getState();
        startNewGame(s.difficulty, s.nightmareFlags, generateSeedPhrase());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoplay, screen, advanceStage, patch, startNewGame]);

  // Handle ESC key for pause (manual mode only)
  useEffect(() => {
    if (autoplay) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const current = useGameStore.getState().screen;
        if (current === 'playing') {
          patch({ screen: 'paused' });
        } else if (current === 'paused') {
          patch({ screen: 'playing' });
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [patch, autoplay]);

  const isGameActive =
    screen === 'loading' ||
    screen === 'playing' ||
    screen === 'paused' ||
    screen === 'dead' ||
    screen === 'victory' ||
    screen === 'bossIntro' ||
    screen === 'gameComplete';

  return (
    <View style={styles.container}>
      {isGameActive && <R3FRoot />}
      {/* Loading screen — blocks gameplay while assets preload for the current circle */}
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'playing' && <HUD />}
      {/* Touch overlay — shown when playing on any touch device (phone, tablet, foldable).
          Mounted above HUD so buttons appear on top of the health/ammo overlay. */}
      {screen === 'playing' && touchActive && <TouchOverlay />}
      {screen === 'paused' && <PauseMenu />}
      {screen === 'dead' && <DeathScreen />}
      {screen === 'victory' && <VictoryScreen />}
      {screen === 'bossIntro' && <BossIntroScreen />}
      {screen === 'gameComplete' && <GameCompleteScreen />}
      {(screen === 'mainMenu' || screen === 'newGame' || screen === 'settings') && <MainMenu />}
      {isDevMode && <DevOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});

export default App;
