/**
 * Debug overlay displayed during autoplay mode.
 * Shows AI governor state, current target, weapon, and session stats.
 * Reads governor via window.__aiGovernor (set by PlayerController).
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useGameStore} from '../state/GameStore';
import type {AIDebugInfo} from '../game/systems/AIGovernor';

const STATE_COLORS: Record<string, string> = {
  hunt: '#ff4444',
  heal: '#44ff44',
  flee: '#ffaa00',
  explore: '#4488ff',
};

export const AutoplayOverlay: React.FC = () => {
  const [debug, setDebug] = useState<AIDebugInfo | null>(null);
  const score = useGameStore(s => s.score);
  const kills = useGameStore(s => s.kills);
  const totalKills = useGameStore(s => s.totalKills);
  const floor = useGameStore(s => s.stage.floor);
  const difficulty = useGameStore(s => s.difficulty);
  const startTime = useGameStore(s => s.startTime);

  useEffect(() => {
    const interval = setInterval(() => {
      const gov = (window as any).__aiGovernor;
      if (gov?.getDebugInfo) {
        setDebug(gov.getDebugInfo());
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

  const stateColor = debug ? STATE_COLORS[debug.state] ?? '#888' : '#888';

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>AUTOPLAY</Text>
          <View style={[styles.dot, {backgroundColor: '#44ff44'}]} />
        </View>

        <View style={styles.divider} />

        {/* AI State */}
        <View style={styles.row}>
          <Text style={styles.label}>STATE</Text>
          <Text style={[styles.value, {color: stateColor}]}>
            {debug?.state?.toUpperCase() ?? '...'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>TARGET</Text>
          <Text style={styles.value}>
            {debug ? `${debug.targetType} (${debug.targetDist}u)` : '...'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>WEAPON</Text>
          <Text style={styles.value}>{debug?.weapon ?? '...'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>STEER</Text>
          <Text style={styles.value}>{debug?.steering ?? '...'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Session stats */}
        <View style={styles.row}>
          <Text style={styles.label}>DIFF</Text>
          <Text style={styles.valueDim}>{difficulty.toUpperCase()}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>FLOOR</Text>
          <Text style={styles.valueDim}>{floor}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>KILLS</Text>
          <Text style={styles.valueDim}>
            {kills} / {totalKills}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.valueDim}>{score.toLocaleString()}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>TIME</Text>
          <Text style={styles.valueDim}>{timeStr}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  panel: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(68, 255, 68, 0.3)',
    padding: 10,
    minWidth: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#44ff44',
    letterSpacing: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(68, 255, 68, 0.15)',
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 1,
  },
  label: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#668866',
    letterSpacing: 1,
  },
  value: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cccccc',
    marginLeft: 12,
  },
  valueDim: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#999999',
    marginLeft: 12,
  },
});
