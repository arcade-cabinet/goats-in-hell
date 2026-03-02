/**
 * VictoryScreen -- floor-clear overlay shown after all enemies are defeated.
 *
 * Displays the cleared floor number with a gold glow, per-floor stats (kills,
 * score, time, XP level), and a speed-bonus indicator if the floor was cleared
 * under 60 seconds. The "DESCEND DEEPER" button advances to the next floor
 * (or routes to bossIntro / gameComplete as appropriate).
 */
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { showCircleHint } from '../game/systems/KillHintSystem';
import { useGameStore } from '../state/GameStore';

const FAST_CLEAR_THRESHOLD_SEC = 60;
const FAST_CLEAR_BONUS = 500;

function formatFloorTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) {
    return `${min}m ${sec}s`;
  }
  return `${sec}s`;
}

export const VictoryScreen: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const kills = useGameStore((s) => s.kills);
  const floor = useGameStore((s) => s.stage.floor);
  const level = useGameStore((s) => s.leveling.level);
  const startTime = useGameStore((s) => s.startTime);
  const advanceStage = useGameStore((s) => s.advanceStage);
  const patch = useGameStore((s) => s.patch);
  const resetToMenu = useGameStore((s) => s.resetToMenu);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-30)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const bonusFlash = useRef(new Animated.Value(0)).current;

  const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
  const isFastClear = elapsedSec <= FAST_CLEAR_THRESHOLD_SEC;
  const timeStr = formatFloorTime(startTime);

  // Fade-in and slide on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.spring(titleSlide, {
        toValue: 0,
        friction: 5,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, titleSlide]);

  // Pulsing descend button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Bonus score flash
  useEffect(() => {
    if (isFastClear) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bonusFlash, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(bonusFlash, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [bonusFlash, isFastClear]);

  const handleDescend = () => {
    const bonus = isFastClear ? FAST_CLEAR_BONUS : 0;
    if (bonus > 0) {
      patch({ score: score + bonus });
    }
    const prevCircle = useGameStore.getState().circleNumber;
    advanceStage();
    // Show circle-transition hint if the circle changed
    const nextCircle = useGameStore.getState().circleNumber;
    if (nextCircle !== prevCircle) {
      showCircleHint(nextCircle);
    }
    // advanceStage may set screen to 'bossIntro' or 'gameComplete' —
    // only transition to 'playing' if neither of those was set
    const nextScreen = useGameStore.getState().screen;
    if (nextScreen !== 'bossIntro' && nextScreen !== 'gameComplete') {
      patch({ screen: 'playing', startTime: Date.now() });
    }
  };

  const handleExit = () => {
    resetToMenu();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="box-none">
      {/* Gold-tinted dark overlay */}
      <View style={styles.overlay} />

      {/* Decorative top border */}
      <View style={styles.topBorder}>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderSegment} />
      </View>

      {/* Floor number */}
      <Animated.View style={[styles.floorBadge, { transform: [{ translateY: titleSlide }] }]}>
        <Text style={styles.floorLabel}>FLOOR</Text>
        <Text style={styles.floorNumber}>{floor}</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, { transform: [{ translateY: titleSlide }] }]}>
        <Text style={styles.titleGlow2}>FLOOR CLEARED</Text>
        <Text style={styles.titleGlow1}>FLOOR CLEARED</Text>
        <Text style={styles.title}>FLOOR CLEARED</Text>
      </Animated.View>

      <Text style={styles.subtitle}>The darkness recedes... for now.</Text>

      {/* Stats panel */}
      <Animated.View style={[styles.statsPanel, { opacity: fadeAnim }]}>
        <View style={styles.statsDivider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>KILLS THIS FLOOR</Text>
          <Text style={styles.statValue}>{kills}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValueGold}>{score.toLocaleString()}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{timeStr}</Text>
        </View>

        <View style={styles.statRowSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>LEVEL</Text>
          <Text style={styles.statValuePurple}>{level}</Text>
        </View>

        <View style={styles.statsDivider} />

        {/* Fast clear bonus */}
        {isFastClear && (
          <Animated.View style={[styles.bonusContainer, { opacity: bonusFlash }]}>
            <Text style={styles.bonusLabel}>SPEED BONUS</Text>
            <Text style={styles.bonusValue}>+{FAST_CLEAR_BONUS}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.descendButton} onPress={handleDescend} activeOpacity={0.7}>
          <Animated.View style={[styles.descendButtonGlow, { opacity: pulseAnim }]} />
          <Text style={styles.descendButtonText}>DESCEND DEEPER</Text>
          <Text style={styles.descendHint}>Floor {floor + 1} awaits</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitButton} onPress={handleExit} activeOpacity={0.7}>
          <Text style={styles.exitButtonText}>EXIT TO MENU</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative bottom border */}
      <View style={styles.bottomBorder}>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderSegment} />
      </View>
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
    backgroundColor: 'rgba(15, 10, 0, 0.92)',
  },

  // Decorative borders
  topBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  bottomBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  borderSegment: {
    width: 50,
    height: 1,
    backgroundColor: 'rgba(255, 170, 0, 0.25)',
  },
  borderStar: {
    fontSize: 12,
    color: '#cc8800',
  },

  // Floor badge
  floorBadge: {
    alignItems: 'center',
    marginBottom: 4,
  },
  floorLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#cc8800',
    letterSpacing: 8,
  },
  floorNumber: {
    fontFamily: 'Courier',
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffaa00',
    textShadowColor: 'rgba(255, 170, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    lineHeight: 60,
  },

  // Title with glow
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    marginBottom: 6,
  },
  title: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#ffaa00',
    letterSpacing: 6,
  },
  titleGlow1: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 170, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleGlow2: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 170, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },

  subtitle: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#886644',
    letterSpacing: 3,
    marginBottom: 20,
  },

  // Stats panel
  statsPanel: {
    backgroundColor: 'rgba(15, 10, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 14,
    marginBottom: 24,
    minWidth: 280,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    marginVertical: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  statRowSep: {
    height: 1,
    backgroundColor: 'rgba(255, 170, 0, 0.06)',
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
  statValueGold: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffaa00',
    marginLeft: 24,
  },
  statValuePurple: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#aa88ff',
    marginLeft: 24,
  },

  // Bonus
  bonusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 8,
  },
  bonusLabel: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffcc00',
    letterSpacing: 2,
  },
  bonusValue: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffcc00',
  },

  // Buttons
  buttonsContainer: {
    alignItems: 'center',
    gap: 14,
  },
  descendButton: {
    borderWidth: 2,
    borderColor: '#ffaa00',
    backgroundColor: 'rgba(255, 170, 0, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 44,
    alignItems: 'center',
    overflow: 'hidden',
  },
  descendButtonGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 170, 0, 0.08)',
  },
  descendButtonText: {
    fontFamily: 'Courier',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffaa00',
    letterSpacing: 5,
  },
  descendHint: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#886644',
    letterSpacing: 2,
    marginTop: 4,
  },
  exitButton: {
    borderWidth: 1,
    borderColor: '#554433',
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  exitButtonText: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#776655',
    letterSpacing: 3,
  },
});
