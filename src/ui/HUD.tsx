import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useGameStore} from '../state/GameStore';
import {world} from '../game/entities/world';
import {weapons} from '../game/weapons/weapons';
import {getThemeForFloor} from '../game/levels/FloorThemes';
import type {Entity, WeaponId} from '../game/entities/components';

function getPlayer(): Entity | undefined {
  return world.entities.find(e => e.type === 'player');
}

function getHealthColor(ratio: number): string {
  if (ratio > 0.6) return '#44ff44';
  if (ratio > 0.35) return '#ffcc00';
  if (ratio > 0.15) return '#ff6600';
  return '#ff2200';
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export const HUD: React.FC = () => {
  const [tick, setTick] = useState(0);
  const lowHpAnim = useRef(new Animated.Value(1)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const scoreRef = useRef(0);

  // 60ms polling interval for responsive HUD
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Low HP pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lowHpAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(lowHpAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lowHpAnim]);

  // Animated score counter
  useEffect(() => {
    const target = useGameStore.getState().score;
    if (target !== scoreRef.current) {
      const diff = target - scoreRef.current;
      const step = Math.max(1, Math.ceil(Math.abs(diff) / 8));
      const interval = setInterval(() => {
        scoreRef.current += diff > 0 ? step : -step;
        if (
          (diff > 0 && scoreRef.current >= target) ||
          (diff < 0 && scoreRef.current <= target)
        ) {
          scoreRef.current = target;
          clearInterval(interval);
        }
        setDisplayScore(scoreRef.current);
      }, 30);
      return () => clearInterval(interval);
    }
  });

  const screen = useGameStore.getState().screen;
  const storeState = useGameStore.getState();
  const player = getPlayer();

  if (screen !== 'playing') {
    return null;
  }

  const hp = player?.player?.hp ?? 0;
  const maxHp = player?.player?.maxHp ?? 100;
  const hpRatio = maxHp > 0 ? hp / maxHp : 0;
  const isLowHp = hpRatio < 0.25;
  const healthColor = getHealthColor(hpRatio);

  const currentWeapon: WeaponId = player?.player?.currentWeapon ?? 'hellPistol';
  const weaponDef = weapons[currentWeapon];
  const weaponName = weaponDef?.name?.toUpperCase() ?? 'UNKNOWN';
  const isReloading = player?.player?.isReloading ?? false;
  const reloadStart = player?.player?.reloadStart ?? 0;
  const reloadTime = weaponDef?.reloadTime ?? 1500;

  const ammoData = player?.ammo?.[currentWeapon];
  const ammoCurrent = ammoData?.current ?? 0;
  const ammoMagSize = ammoData?.magSize ?? weaponDef?.magSize ?? 0;
  const ammoReserve = ammoData?.reserve ?? 0;

  const floor = storeState.stage.floor;
  const encounterType = storeState.stage.encounterType;
  const kills = storeState.kills;
  const leveling = storeState.leveling;
  const theme = getThemeForFloor(floor);
  const elapsed = Date.now() - storeState.startTime;
  const xpProgress = leveling.xpToNext > 0 ? leveling.xp / leveling.xpToNext : 0;

  // Reload progress (0 to 1)
  const reloadProgress = isReloading
    ? Math.min(1, (Date.now() - reloadStart) / reloadTime)
    : 0;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Low HP vignette overlay */}
      {isLowHp && (
        <Animated.View style={[styles.lowHpVignette, {opacity: lowHpAnim}]} />
      )}

      {/* Health bar - bottom left */}
      <View style={styles.healthContainer}>
        <View style={styles.healthPanel}>
          <View style={styles.healthBarOuter}>
            <Animated.View
              style={[
                styles.healthBarInner,
                {
                  width: `${hpRatio * 100}%` as any,
                  backgroundColor: healthColor,
                },
                isLowHp && {opacity: lowHpAnim},
              ]}
            />
            {/* Health bar tick marks */}
            {[0.25, 0.5, 0.75].map(p => (
              <View
                key={p}
                style={[styles.healthTick, {left: `${p * 100}%` as any}]}
              />
            ))}
          </View>
          <View style={styles.healthTextRow}>
            <Animated.Text
              style={[
                styles.healthLabel,
                {color: healthColor},
                isLowHp && {opacity: lowHpAnim},
              ]}>
              HP
            </Animated.Text>
            <Text style={styles.healthValue}>
              {hp}
              <Text style={styles.healthMax}>/{maxHp}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Ammo display - bottom right */}
      <View style={styles.ammoContainer}>
        <View style={styles.ammoPanel}>
          {isReloading ? (
            <View style={styles.reloadContainer}>
              <Text style={styles.reloadingText}>RELOADING</Text>
              <View style={styles.reloadBarOuter}>
                <View
                  style={[
                    styles.reloadBarInner,
                    {width: `${reloadProgress * 100}%` as any},
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.ammoDisplay}>
              <Text style={styles.ammoCurrent}>{ammoCurrent}</Text>
              <Text style={styles.ammoSep}>/</Text>
              <Text style={styles.ammoMag}>{ammoMagSize}</Text>
              <Text style={styles.ammoDivider}>|</Text>
              <Text style={styles.ammoReserve}>{ammoReserve}</Text>
            </View>
          )}
          <Text style={styles.weaponName}>{weaponName}</Text>
        </View>
      </View>

      {/* Floor indicator - top left */}
      <View style={styles.floorContainer}>
        <View style={styles.floorPanel}>
          <Text style={styles.floorNumber}>FL {floor}</Text>
          <Text style={styles.floorTheme}>{theme.displayName}</Text>
          {encounterType !== 'explore' && (
            <Text style={styles.encounterTag}>
              {encounterType === 'arena' ? 'ARENA' : 'BOSS'}
            </Text>
          )}
        </View>
        {/* Level / XP bar */}
        <View style={styles.levelPanel}>
          <Text style={styles.levelText}>LV {leveling.level}</Text>
          <View style={styles.xpBarOuter}>
            <View
              style={[
                styles.xpBarInner,
                {width: `${Math.min(100, xpProgress * 100)}%` as any},
              ]}
            />
          </View>
          <Text style={styles.xpText}>
            {leveling.xp}/{leveling.xpToNext}
          </Text>
        </View>
      </View>

      {/* Score / kills / time - top center */}
      <View style={styles.topCenter}>
        <Text style={styles.scoreText}>{displayScore.toLocaleString()}</Text>
        <View style={styles.topStatsRow}>
          <Text style={styles.killsText}>KILLS {kills}</Text>
          <Text style={styles.topStatSep}>|</Text>
          <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Weapon slots - top right */}
      <View style={styles.weaponSlotsContainer}>
        {(['hellPistol', 'brimShotgun', 'hellfireCannon', 'goatsBane'] as WeaponId[]).map(
          (wid, i) => {
            const owned = player?.player?.weapons?.includes(wid);
            const active = currentWeapon === wid;
            return (
              <View
                key={wid}
                style={[
                  styles.weaponSlot,
                  active && styles.weaponSlotActive,
                  !owned && styles.weaponSlotLocked,
                ]}>
                <Text
                  style={[
                    styles.weaponSlotText,
                    active && styles.weaponSlotTextActive,
                    !owned && styles.weaponSlotTextLocked,
                  ]}>
                  {i + 1}
                </Text>
              </View>
            );
          },
        )}
      </View>

      {/* Crosshair - center */}
      <View style={styles.crosshairContainer}>
        <View style={[styles.crosshairArm, styles.crosshairTop]} />
        <View style={[styles.crosshairArm, styles.crosshairBottom]} />
        <View style={[styles.crosshairArm, styles.crosshairLeft]} />
        <View style={[styles.crosshairArm, styles.crosshairRight]} />
        <View style={styles.crosshairDot} />
      </View>
    </View>
  );
};

const CROSSHAIR_COLOR = 'rgba(255, 80, 60, 0.75)';
const CROSSHAIR_LENGTH = 14;
const CROSSHAIR_THICKNESS = 2;
const CROSSHAIR_GAP = 5;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Low HP vignette
  lowHpVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 20,
    borderColor: 'rgba(200, 0, 0, 0.25)',
  },

  // -- Health bar (bottom left) --
  healthContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  healthPanel: {
    backgroundColor: 'rgba(10, 5, 5, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.3)',
    padding: 10,
    minWidth: 220,
  },
  healthBarOuter: {
    width: 200,
    height: 14,
    backgroundColor: '#1a0505',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  healthBarInner: {
    height: '100%' as any,
  },
  healthTick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%' as any,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  healthTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  healthLabel: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  healthValue: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ccbbaa',
  },
  healthMax: {
    fontSize: 12,
    color: '#665544',
  },

  // -- Ammo (bottom right) --
  ammoContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  ammoPanel: {
    backgroundColor: 'rgba(10, 5, 5, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.3)',
    padding: 10,
    alignItems: 'flex-end',
  },
  ammoDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ammoCurrent: {
    fontFamily: 'Courier',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  ammoSep: {
    fontFamily: 'Courier',
    fontSize: 20,
    color: '#665544',
    marginHorizontal: 2,
  },
  ammoMag: {
    fontFamily: 'Courier',
    fontSize: 18,
    color: '#998877',
  },
  ammoDivider: {
    fontFamily: 'Courier',
    fontSize: 18,
    color: '#443322',
    marginHorizontal: 8,
  },
  ammoReserve: {
    fontFamily: 'Courier',
    fontSize: 16,
    color: '#887766',
  },
  weaponName: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#cc0000',
    letterSpacing: 2,
    marginTop: 4,
  },

  // Reload indicator
  reloadContainer: {
    alignItems: 'flex-end',
  },
  reloadingText: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffaa00',
    letterSpacing: 3,
  },
  reloadBarOuter: {
    width: 140,
    height: 6,
    backgroundColor: '#1a0505',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
    marginTop: 4,
    overflow: 'hidden',
  },
  reloadBarInner: {
    height: '100%' as any,
    backgroundColor: '#ffaa00',
  },

  // -- Floor (top left) --
  floorContainer: {
    position: 'absolute',
    top: 16,
    left: 20,
  },
  floorPanel: {
    backgroundColor: 'rgba(10, 5, 5, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  floorNumber: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cc0000',
    letterSpacing: 2,
  },
  floorTheme: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#884433',
    letterSpacing: 2,
  },
  encounterTag: {
    fontFamily: 'Courier',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffaa00',
    letterSpacing: 2,
    marginTop: 2,
  },
  levelPanel: {
    backgroundColor: 'rgba(10, 5, 5, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(100, 50, 200, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aa88ff',
    letterSpacing: 1,
  },
  xpBarOuter: {
    width: 60,
    height: 6,
    backgroundColor: '#1a0520',
    borderWidth: 1,
    borderColor: 'rgba(100, 50, 200, 0.25)',
    overflow: 'hidden',
  },
  xpBarInner: {
    height: '100%' as any,
    backgroundColor: '#8855cc',
  },
  xpText: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#665588',
  },

  // -- Score/kills/time (top center) --
  topCenter: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: 'Courier',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(255, 0, 0, 0.6)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  topStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  killsText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#cc4444',
    letterSpacing: 2,
  },
  topStatSep: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#443322',
  },
  timeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#887766',
    letterSpacing: 1,
  },

  // -- Weapon slots (top right) --
  weaponSlotsContainer: {
    position: 'absolute',
    top: 16,
    right: 20,
    flexDirection: 'row',
    gap: 4,
  },
  weaponSlot: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.3)',
    backgroundColor: 'rgba(10, 5, 5, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weaponSlotActive: {
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.15)',
  },
  weaponSlotLocked: {
    opacity: 0.3,
  },
  weaponSlotText: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#887766',
  },
  weaponSlotTextActive: {
    color: '#cc0000',
  },
  weaponSlotTextLocked: {
    color: '#443322',
  },

  // -- Crosshair --
  crosshairContainer: {
    position: 'absolute',
    top: '50%' as any,
    left: '50%' as any,
    width: 0,
    height: 0,
  },
  crosshairArm: {
    position: 'absolute',
    backgroundColor: CROSSHAIR_COLOR,
  },
  crosshairTop: {
    width: CROSSHAIR_THICKNESS,
    height: CROSSHAIR_LENGTH,
    left: -(CROSSHAIR_THICKNESS / 2),
    bottom: CROSSHAIR_GAP,
  },
  crosshairBottom: {
    width: CROSSHAIR_THICKNESS,
    height: CROSSHAIR_LENGTH,
    left: -(CROSSHAIR_THICKNESS / 2),
    top: CROSSHAIR_GAP,
  },
  crosshairLeft: {
    width: CROSSHAIR_LENGTH,
    height: CROSSHAIR_THICKNESS,
    top: -(CROSSHAIR_THICKNESS / 2),
    right: CROSSHAIR_GAP,
  },
  crosshairRight: {
    width: CROSSHAIR_LENGTH,
    height: CROSSHAIR_THICKNESS,
    top: -(CROSSHAIR_THICKNESS / 2),
    left: CROSSHAIR_GAP,
  },
  crosshairDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: CROSSHAIR_COLOR,
    left: -1,
    top: -1,
  },
});
