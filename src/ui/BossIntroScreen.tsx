import type React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../state/GameStore';

const BOSS_NAMES: Record<string, string> = {
  infernoGoat: 'INFERNO GOAT',
  voidGoat: 'VOID GOAT',
  ironGoat: 'IRON GOAT',
  archGoat: 'ARCH GOAT',
};

const BOSS_TAUNTS: Record<string, string> = {
  infernoGoat: 'The flames hunger for your flesh...',
  voidGoat: 'Step into the nothing...',
  ironGoat: 'Your weapons are useless here...',
  archGoat: 'Kneel before the horned throne...',
};

export const BossIntroScreen: React.FC = () => {
  const bossId = useGameStore((s) => s.stage.bossId);
  const floor = useGameStore((s) => s.stage.floor);
  const patch = useGameStore((s) => s.patch);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  const bossName = BOSS_NAMES[bossId ?? ''] ?? 'UNKNOWN HORROR';
  const bossTaunt = BOSS_TAUNTS[bossId ?? ''] ?? 'Something stirs in the dark...';

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
        tension: 30,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, titleScale]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleEnter = () => {
    patch({ screen: 'playing', startTime: Date.now() });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="box-none">
      <View style={styles.overlay} />

      {/* Decorative border */}
      <View style={styles.topBorder}>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2620'}</Text>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2620'}</Text>
        <View style={styles.borderSegment} />
      </View>

      <Text style={styles.floorLabel}>FLOOR {floor}</Text>

      <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }] }]}>
        <Text style={styles.titleGlow2}>BOSS</Text>
        <Text style={styles.titleGlow1}>BOSS</Text>
        <Text style={styles.title}>BOSS</Text>
      </Animated.View>

      <Text style={styles.bossName}>{bossName}</Text>
      <Text style={styles.taunt}>{bossTaunt}</Text>

      <TouchableOpacity style={styles.enterButton} onPress={handleEnter} activeOpacity={0.7}>
        <Animated.View style={[styles.enterGlow, { opacity: pulseAnim }]} />
        <Text style={styles.enterText}>ENTER THE ARENA</Text>
      </TouchableOpacity>

      <View style={styles.bottomBorder}>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2620'}</Text>
        <View style={styles.borderSegment} />
        <Text style={styles.borderStar}>{'\u2620'}</Text>
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
    backgroundColor: 'rgba(30, 0, 10, 0.95)',
  },

  topBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  bottomBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  borderSegment: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 0, 50, 0.3)',
  },
  borderStar: {
    fontSize: 16,
    color: '#cc0033',
  },

  floorLabel: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#883344',
    letterSpacing: 6,
    marginBottom: 8,
  },

  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 8,
  },
  title: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#cc0033',
    letterSpacing: 12,
  },
  titleGlow1: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 12,
    textShadowColor: 'rgba(255, 0, 50, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleGlow2: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 12,
    textShadowColor: 'rgba(255, 0, 50, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },

  bossName: {
    fontFamily: 'Courier',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4466',
    letterSpacing: 4,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 50, 100, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  taunt: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#884455',
    letterSpacing: 3,
    marginBottom: 32,
  },

  enterButton: {
    borderWidth: 2,
    borderColor: '#cc0033',
    backgroundColor: 'rgba(204, 0, 50, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  enterGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(204, 0, 50, 0.1)',
  },
  enterText: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cc0033',
    letterSpacing: 4,
  },
});
