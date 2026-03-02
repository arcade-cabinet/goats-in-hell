/**
 * GameCompleteScreen -- ending overlay shown after defeating the Circle 9 boss.
 *
 * Determines the ending based on the player's kill ratio:
 * - >30% optional enemies SKIPPED -> Ascent ending (escape Hell)
 * - <=30% optional enemies SKIPPED -> Remain ending (become Hell's guardian)
 *
 * Displays ending-specific title, narrative text, themed visuals, a
 * comprehensive stats panel, and a return-to-menu button.
 */
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DIFFICULTY_PRESETS, useGameStore } from '../state/GameStore';

function formatPlaytime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

type Ending = 'ascent' | 'remain';

function determineEnding(optionalKills: number, optionalEnemiesTotal: number): Ending {
  const optionalSkipped = optionalEnemiesTotal - optionalKills;
  const skipRatio = optionalEnemiesTotal > 0 ? optionalSkipped / optionalEnemiesTotal : 0;
  return skipRatio > 0.3 ? 'ascent' : 'remain';
}

const ENDING_CONFIG = {
  ascent: {
    title: 'THE SCAPEGOAT RISES',
    subtitle:
      'Through nine circles of torment, you carried the sins upward\u2014and found a way out. The goat ascends.',
    buttonText: 'RETURN TO THE SURFACE',
    titleColor: '#ffcc33',
    glowColor: 'rgba(255, 200, 50, 0.6)',
    glowColorFar: 'rgba(255, 200, 50, 0.25)',
    borderColor: 'rgba(255, 200, 50, 0.3)',
    overlayColor: 'rgba(0, 8, 20, 0.95)',
    starColor: '#ffcc33',
    subtitleColor: '#887744',
  },
  remain: {
    title: "HELL'S GUARDIAN",
    subtitle:
      'The Scapegoat descends no further. The violence became you. Hell has a new guardian.',
    buttonText: 'EMBRACE THE DARK',
    titleColor: '#cc2200',
    glowColor: 'rgba(200, 30, 0, 0.6)',
    glowColorFar: 'rgba(200, 30, 0, 0.25)',
    borderColor: 'rgba(200, 30, 0, 0.3)',
    overlayColor: 'rgba(20, 0, 0, 0.95)',
    starColor: '#cc2200',
    subtitleColor: '#774433',
  },
} as const;

export const GameCompleteScreen: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const totalKills = useGameStore((s) => s.totalKills);
  const mandatoryKills = useGameStore((s) => s.mandatoryKills);
  const optionalKills = useGameStore((s) => s.optionalKills);
  const optionalEnemiesTotal = useGameStore((s) => s.optionalEnemiesTotal);
  const floor = useGameStore((s) => s.stage.floor);
  const level = useGameStore((s) => s.leveling.level);
  const startTime = useGameStore((s) => s.startTime);
  const difficulty = useGameStore((s) => s.difficulty);
  const nightmareFlags = useGameStore((s) => s.nightmareFlags);
  const bossesDefeated = useGameStore((s) => s.bossesDefeated);
  const resetToMenu = useGameStore((s) => s.resetToMenu);

  const ending = determineEnding(optionalKills, optionalEnemiesTotal);
  const config = ENDING_CONFIG[ending];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-40)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  const diffLabel = DIFFICULTY_PRESETS[difficulty].label;
  const isNightmare = nightmareFlags.nightmare || nightmareFlags.ultraNightmare;
  const playtime = formatPlaytime(startTime);

  const optionalSkipped = optionalEnemiesTotal - optionalKills;
  const skipPercent =
    optionalEnemiesTotal > 0 ? Math.round((optionalSkipped / optionalEnemiesTotal) * 100) : 0;

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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="box-none">
      <View style={[styles.overlay, { backgroundColor: config.overlayColor }]} />

      {/* Decorative top */}
      <View style={styles.border}>
        <View style={[styles.borderLine, { backgroundColor: config.borderColor }]} />
        <Text style={[styles.borderStar, { color: config.starColor }]}>{'\u2726'}</Text>
        <View style={[styles.borderLine, { backgroundColor: config.borderColor }]} />
        <Text style={[styles.borderStar, { color: config.starColor }]}>{'\u2726'}</Text>
        <View style={[styles.borderLine, { backgroundColor: config.borderColor }]} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleWrap, { transform: [{ translateY: titleSlide }] }]}>
        <Text style={[styles.titleGlow2, { textShadowColor: config.glowColorFar }]}>
          {config.title}
        </Text>
        <Text style={[styles.titleGlow1, { textShadowColor: config.glowColor }]}>
          {config.title}
        </Text>
        <Text style={[styles.title, { color: config.titleColor }]}>{config.title}</Text>
      </Animated.View>

      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, color: config.subtitleColor }]}>
        {config.subtitle}
      </Animated.Text>

      {/* Final stats */}
      <Animated.View
        style={[styles.statsPanel, { opacity: fadeAnim, borderColor: `${config.borderColor}` }]}
      >
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
          <Text style={styles.statLabel}>MANDATORY KILLS</Text>
          <Text style={styles.statValue}>{mandatoryKills}</Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>OPTIONAL KILLS</Text>
          <Text style={[styles.statValue, ending === 'remain' && styles.statValueRed]}>
            {optionalKills} / {optionalEnemiesTotal}
          </Text>
        </View>
        <View style={styles.statSep} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>ENEMIES SPARED</Text>
          <Text style={[styles.statValue, ending === 'ascent' && styles.statValueGold]}>
            {skipPercent}%
          </Text>
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
        style={[styles.returnBtn, { borderColor: config.titleColor }]}
        onPress={resetToMenu}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.returnGlow,
            { opacity: pulseAnim, backgroundColor: `${config.borderColor}` },
          ]}
        />
        <Text style={[styles.returnText, { color: config.titleColor }]}>{config.buttonText}</Text>
      </TouchableOpacity>

      {/* Decorative bottom */}
      <View style={styles.border}>
        <View style={[styles.borderLine, { backgroundColor: config.borderColor }]} />
        <Text style={[styles.borderStar, { color: config.starColor }]}>{'\u2726'}</Text>
        <View style={[styles.borderLine, { backgroundColor: config.borderColor }]} />
        <Text style={[styles.borderStar, { color: config.starColor }]}>{'\u2726'}</Text>
        <View style={[styles.borderLine, { backgroundColor: config.borderColor }]} />
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
  },
  borderStar: {
    fontSize: 14,
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
    letterSpacing: 6,
  },
  titleGlow1: {
    position: 'absolute',
    fontSize: 44,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleGlow2: {
    position: 'absolute',
    fontSize: 44,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },

  subtitle: {
    fontFamily: 'Courier',
    fontSize: 13,
    letterSpacing: 3,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  statsPanel: {
    backgroundColor: 'rgba(10, 15, 25, 0.5)',
    borderWidth: 1,
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
    backgroundColor: 'rgba(255, 200, 50, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  returnGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  returnText: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
});
