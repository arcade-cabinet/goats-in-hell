import {Color4} from '@babylonjs/core';
import type {Scene as BabylonScene} from '@babylonjs/core';
import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {Scene} from 'reactylon';
import {EngineWrapper} from './EngineWrapper';
import {GameEngine} from './game/GameEngine';
import {MainMenu} from './ui/MainMenu';
import {useGameStore, generateSeedPhrase} from './state/GameStore';
import type {Difficulty} from './state/GameStore';

const App = () => {
  const screen = useGameStore(s => s.screen);
  const patch = useGameStore(s => s.patch);
  const autoplay = useGameStore(s => s.autoplay);
  const startNewGame = useGameStore(s => s.startNewGame);

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
        {nightmare: false, permadeath: false, ultraNightmare: false},
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
      startNewGame(
        s.difficulty,
        s.nightmareFlags,
        generateSeedPhrase(),
      );
    }, 3000); // 3-second pause on death screen before restarting
    return () => clearTimeout(timer);
  }, [autoplay, screen, startNewGame]);

  // Autoplay: auto-advance on victory / bossIntro / gameComplete
  const advanceStage = useGameStore(s => s.advanceStage);
  useEffect(() => {
    if (!autoplay) return;
    if (screen === 'victory') {
      const timer = setTimeout(() => {
        advanceStage();
        const nextScreen = useGameStore.getState().screen;
        if (nextScreen !== 'bossIntro' && nextScreen !== 'gameComplete') {
          patch({screen: 'playing', startTime: Date.now()});
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (screen === 'bossIntro') {
      const timer = setTimeout(() => {
        patch({screen: 'playing', startTime: Date.now()});
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (screen === 'gameComplete') {
      // Auto-restart after completing the game
      const timer = setTimeout(() => {
        const s = useGameStore.getState();
        startNewGame(
          s.difficulty,
          s.nightmareFlags,
          generateSeedPhrase(),
        );
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
          patch({screen: 'paused'});
        } else if (current === 'paused') {
          patch({screen: 'playing'});
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [patch, autoplay]);

  const isGameActive =
    screen === 'playing' ||
    screen === 'paused' ||
    screen === 'dead' ||
    screen === 'victory' ||
    screen === 'bossIntro' ||
    screen === 'gameComplete';

  return (
    <View style={styles.container}>
      {isGameActive && (
        <EngineWrapper camera={undefined}>
          <Scene
            onSceneReady={(scene: BabylonScene) => {
              scene.clearColor = new Color4(0.05, 0.01, 0.02, 1);
            }}>
            <GameEngine />
          </Scene>
        </EngineWrapper>
      )}
      {(screen === 'mainMenu' || screen === 'newGame' || screen === 'settings') && (
        <MainMenu />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
});

export default App;
