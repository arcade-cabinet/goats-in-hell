import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {useGameStore} from '../state/GameStore';

const SKULL_ART = `        .-""""-.
       /        \\
      |  O    O  |
      |    __    |
      |   /  \\   |
       \\  \\__/  /
        '-.  .-'
       ___||_||___
      /    ~~~~   \\
     /              \\`;

function formatSurvivalTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) {
    return `${min}m ${sec}s`;
  }
  return `${sec}s`;
}

export const DeathScreen: React.FC = () => {
  const score = useGameStore(s => s.score);
  const totalKills = useGameStore(s => s.totalKills);
  const floor = useGameStore(s => s.stage.floor);
  const level = useGameStore(s => s.leveling.level);
  const startTime = useGameStore(s => s.startTime);
  const difficulty = useGameStore(s => s.difficulty);
  const nightmareFlags = useGameStore(s => s.nightmareFlags);
  const seed = useGameStore(s => s.seed);
  const startNewGame = useGameStore(s => s.startNewGame);
  const resetToMenu = useGameStore(s => s.resetToMenu);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  // Fade-in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, titleScale]);

  // Pulsing retry button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleTryAgain = () => {
    startNewGame(difficulty, nightmareFlags, seed);
  };

  const handleQuit = () => {
    resetToMenu();
  };

  const survivalTime = formatSurvivalTime(startTime);

  return (
    <Animated.View
      style={[styles.container, {opacity: fadeAnim}]}
      pointerEvents="box-none">
      {/* Red tinted dark overlay */}
      <View style={styles.overlay} />

      {/* Skull decoration */}
      <Animated.View style={[styles.skullContainer, {opacity: fadeAnim}]}>
        <Text style={styles.skullArt}>{SKULL_ART}</Text>
      </Animated.View>

      {/* Title with glow layers */}
      <Animated.View
        style={[styles.titleContainer, {transform: [{scale: titleScale}]}]}>
        <Text style={styles.titleGlow3}>YOU DIED</Text>
        <Text style={styles.titleGlow2}>YOU DIED</Text>
        <Text style={styles.titleGlow1}>YOU DIED</Text>
        <Text style={styles.title}>YOU DIED</Text>
      </Animated.View>

      <Animated.Text style={[styles.subtitle, {opacity: fadeAnim}]}>
        The goats have claimed your soul...
      </Animated.Text>

      {/* Stats panel */}
      <Animated.View style={[styles.statsPanel, {opacity: fadeAnim}]}>
        <View style={styles.statsDividerTop} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score.toLocaleString()}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>TOTAL KILLS</Text>
          <Text style={styles.statValue}>{totalKills}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>FLOOR REACHED</Text>
          <Text style={styles.statValue}>{floor}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>TIME SURVIVED</Text>
          <Text style={styles.statValue}>{survivalTime}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>LEVEL REACHED</Text>
          <Text style={styles.statValuePurple}>{level}</Text>
        </View>

        <View style={styles.statsDividerBottom} />
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonsContainer, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleTryAgain}
          activeOpacity={0.7}>
          <Animated.View
            style={[styles.retryButtonGlow, {opacity: pulseAnim}]}
          />
          <Text style={styles.retryButtonText}>TRY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quitButton}
          onPress={handleQuit}
          activeOpacity={0.7}>
          <Text style={styles.quitButtonText}>QUIT TO MENU</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40, 0, 0, 0.92)',
  },

  // Skull
  skullContainer: {
    marginBottom: 10,
  },
  skullArt: {
    fontFamily: 'Courier',
    fontSize: 10,
    lineHeight: 12,
    color: '#660000',
    textAlign: 'center',
  },

  // Title with glow layers
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 4,
  },
  title: {
    position: 'absolute',
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#cc0000',
    letterSpacing: 8,
  },
  titleGlow1: {
    position: 'absolute',
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 0, 0, 0.7)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 12,
  },
  titleGlow2: {
    position: 'absolute',
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 20, 0, 0.4)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 30,
  },
  titleGlow3: {
    position: 'absolute',
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 50, 0, 0.2)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 60,
  },

  subtitle: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#884433',
    letterSpacing: 3,
    marginBottom: 24,
  },

  // Stats panel
  statsPanel: {
    backgroundColor: 'rgba(10, 5, 5, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.25)',
    paddingHorizontal: 30,
    paddingVertical: 16,
    marginBottom: 30,
    minWidth: 280,
  },
  statsDividerTop: {
    height: 1,
    backgroundColor: 'rgba(204, 0, 0, 0.2)',
    marginBottom: 12,
  },
  statsDividerBottom: {
    height: 1,
    backgroundColor: 'rgba(204, 0, 0, 0.2)',
    marginTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  statRowSep: {
    height: 1,
    backgroundColor: 'rgba(204, 0, 0, 0.08)',
    marginVertical: 4,
  },
  statLabel: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#887766',
    letterSpacing: 2,
  },
  statValue: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccbbaa',
    marginLeft: 24,
  },
  statValuePurple: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#aa88ff',
    marginLeft: 24,
  },

  // Buttons
  buttonsContainer: {
    alignItems: 'center',
    gap: 14,
  },
  retryButton: {
    borderWidth: 2,
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 50,
    alignItems: 'center',
    overflow: 'hidden',
  },
  retryButtonGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(204, 0, 0, 0.1)',
  },
  retryButtonText: {
    fontFamily: 'Courier',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#cc0000',
    letterSpacing: 6,
  },
  quitButton: {
    borderWidth: 1,
    borderColor: '#554433',
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  quitButtonText: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#776655',
    letterSpacing: 3,
  },
});
