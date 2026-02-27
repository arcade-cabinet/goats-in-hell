import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {useGameStore, DIFFICULTY_PRESETS} from '../state/GameStore';

function formatPlaytime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

export const GameCompleteScreen: React.FC = () => {
  const score = useGameStore(s => s.score);
  const totalKills = useGameStore(s => s.totalKills);
  const floor = useGameStore(s => s.stage.floor);
  const level = useGameStore(s => s.leveling.level);
  const startTime = useGameStore(s => s.startTime);
  const difficulty = useGameStore(s => s.difficulty);
  const nightmareFlags = useGameStore(s => s.nightmareFlags);
  const bossesDefeated = useGameStore(s => s.bossesDefeated);
  const resetToMenu = useGameStore(s => s.resetToMenu);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-40)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  const diffLabel = DIFFICULTY_PRESETS[difficulty].label;
  const isNightmare = nightmareFlags.nightmare || nightmareFlags.ultraNightmare;
  const playtime = formatPlaytime(startTime);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.spring(titleSlide, {
        toValue: 0,
        friction: 4,
        tension: 25,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, titleSlide]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]} pointerEvents="box-none">
      <View style={styles.overlay} />

      {/* Decorative top */}
      <View style={styles.border}>
        <View style={styles.borderLine} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderLine} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderLine} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleWrap, {transform: [{translateY: titleSlide}]}]}>
        <Text style={styles.titleGlow2}>YOU ESCAPED</Text>
        <Text style={styles.titleGlow1}>YOU ESCAPED</Text>
        <Text style={styles.title}>YOU ESCAPED</Text>
      </Animated.View>

      <Animated.Text style={[styles.subtitle, {opacity: fadeAnim}]}>
        The gates of Hell close behind you...
      </Animated.Text>

      {/* Final stats */}
      <Animated.View style={[styles.statsPanel, {opacity: fadeAnim}]}>
        <View style={styles.divider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>FINAL SCORE</Text>
          <Text style={styles.statValueGold}>{score.toLocaleString()}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>TOTAL KILLS</Text>
          <Text style={styles.statValue}>{totalKills}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>FLOORS CLEARED</Text>
          <Text style={styles.statValue}>{floor}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>LEVEL REACHED</Text>
          <Text style={styles.statValuePurple}>{level}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>PLAYTIME</Text>
          <Text style={styles.statValue}>{playtime}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>DIFFICULTY</Text>
          <Text style={styles.statValue}>{diffLabel.toUpperCase()}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>BOSSES SLAIN</Text>
          <Text style={styles.statValueGold}>{bossesDefeated.length}</Text>
        </View>

        {isNightmare && (
          <>
            <View style={styles.statSep} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>MODE</Text>
              <Text style={styles.statValueRed}>
                {nightmareFlags.ultraNightmare ? 'ULTRA NIGHTMARE' : 'NIGHTMARE'}
              </Text>
            </View>
          </>
        )}

        <View style={styles.divider} />
      </Animated.View>

      {/* Return button */}
      <TouchableOpacity
        style={styles.returnBtn}
        onPress={resetToMenu}
        activeOpacity={0.7}>
        <Animated.View style={[styles.returnGlow, {opacity: pulseAnim}]} />
        <Text style={styles.returnText}>RETURN TO THE SURFACE</Text>
      </TouchableOpacity>

      {/* Decorative bottom */}
      <View style={styles.border}>
        <View style={styles.borderLine} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderLine} />
        <Text style={styles.borderStar}>{'\u2726'}</Text>
        <View style={styles.borderLine} />
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
    backgroundColor: 'rgba(0, 8, 20, 0.95)',
  },

  border: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  borderLine: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 200, 50, 0.3)',
  },
  borderStar: {
    fontSize: 14,
    color: '#ffcc33',
  },

  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    marginBottom: 4,
  },
  title: {
    position: 'absolute',
    fontSize: 44,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#ffcc33',
    letterSpacing: 6,
  },
  titleGlow1: {
    position: 'absolute',
    fontSize: 44,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 200, 50, 0.6)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 15,
  },
  titleGlow2: {
    position: 'absolute',
    fontSize: 44,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 200, 50, 0.25)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 40,
  },

  subtitle: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#887744',
    letterSpacing: 3,
    marginBottom: 20,
  },

  statsPanel: {
    backgroundColor: 'rgba(10, 15, 25, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 50, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 14,
    marginBottom: 24,
    minWidth: 300,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 200, 50, 0.15)',
    marginVertical: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 3,
  },
  statSep: {
    height: 1,
    backgroundColor: 'rgba(255, 200, 50, 0.06)',
    marginVertical: 3,
  },
  statLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#887766',
    letterSpacing: 2,
  },
  statValue: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ccbbaa',
    marginLeft: 20,
  },
  statValueGold: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffcc33',
    marginLeft: 20,
  },
  statValuePurple: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aa88ff',
    marginLeft: 20,
  },
  statValueRed: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
    marginLeft: 20,
  },

  returnBtn: {
    borderWidth: 2,
    borderColor: '#ffcc33',
    backgroundColor: 'rgba(255, 200, 50, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  returnGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 200, 50, 0.06)',
  },
  returnText: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffcc33',
    letterSpacing: 4,
  },
});
