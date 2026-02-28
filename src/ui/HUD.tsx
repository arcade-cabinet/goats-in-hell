import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, Animated, type DimensionValue} from 'react-native';
import {useGameStore, DIFFICULTY_PRESETS} from '../state/GameStore';
import {world} from '../game/entities/world';
import {weapons} from '../game/weapons/weapons';
import {getThemeForFloor} from '../game/levels/FloorThemes';
import {getWaveInfo} from '../game/systems/WaveSystem';
import {getActiveLevel} from '../game/levels/activeLevelRef';
import {consumeDamageEvents} from '../game/systems/damageEvents';
import {CELL_SIZE, MapCell} from '../game/levels/LevelGenerator';
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
  const difficulty = storeState.difficulty;
  const nightmareFlags = storeState.nightmareFlags;
  const theme = getThemeForFloor(floor);
  const elapsed = Date.now() - storeState.startTime;
  const xpProgress = leveling.xpToNext > 0 ? leveling.xp / leveling.xpToNext : 0;
  const diffLabel = DIFFICULTY_PRESETS[difficulty].label.toUpperCase();
  const hitMarker = storeState.hitMarker ?? 0;
  const crosshairHit = hitMarker > 0;

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
                  width: `${hpRatio * 100}%` as DimensionValue,
                  backgroundColor: healthColor,
                },
                isLowHp && {opacity: lowHpAnim},
              ]}
            />
            {/* Health bar tick marks */}
            {[0.25, 0.5, 0.75].map(p => (
              <View
                key={p}
                style={[styles.healthTick, {left: `${p * 100}%` as DimensionValue}]}
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
                    {width: `${reloadProgress * 100}%` as DimensionValue},
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
          {encounterType === 'arena' && (() => {
            const waveInfo = getWaveInfo();
            return (
              <View style={styles.waveRow}>
                <Text style={styles.waveText}>WAVE {waveInfo.wave}</Text>
                {waveInfo.multiplier > 1 && (
                  <Text style={styles.streakText}>x{waveInfo.multiplier.toFixed(1)}</Text>
                )}
              </View>
            );
          })()}
        </View>
        {/* Level / XP bar */}
        <View style={styles.levelPanel}>
          <Text style={styles.levelText}>LV {leveling.level}</Text>
          <View style={styles.xpBarOuter}>
            <View
              style={[
                styles.xpBarInner,
                {width: `${Math.min(100, xpProgress * 100)}%` as DimensionValue},
              ]}
            />
          </View>
          <Text style={styles.xpText}>
            {leveling.xp}/{leveling.xpToNext}
          </Text>
        </View>
        {/* Difficulty / Nightmare indicators */}
        <View style={styles.diffIndicatorRow}>
          <Text style={[
            styles.diffTag,
            difficulty === 'hard' && styles.diffTagHard,
          ]}>{diffLabel}</Text>
          {nightmareFlags.ultraNightmare && (
            <Text style={styles.nightmareTagUltra}>ULTRA</Text>
          )}
          {nightmareFlags.nightmare && !nightmareFlags.ultraNightmare && (
            <Text style={styles.nightmareTag}>NIGHTMARE</Text>
          )}
          {nightmareFlags.permadeath && !nightmareFlags.ultraNightmare && (
            <Text style={styles.permadeathTag}>PERMA</Text>
          )}
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

      {/* Boss HP bar - top center (boss encounters only) */}
      {encounterType === 'boss' && <BossHealthBar />}

      {/* Minimap - bottom center-right (explore mode only) */}
      {encounterType === 'explore' && <Minimap />}

      {/* Damage numbers (center area) */}
      <DamageNumbers />

      {/* Crosshair - center (flashes white on hit) */}
      <View style={styles.crosshairContainer}>
        <View style={[styles.crosshairArm, styles.crosshairTop, crosshairHit && styles.crosshairHit]} />
        <View style={[styles.crosshairArm, styles.crosshairBottom, crosshairHit && styles.crosshairHit]} />
        <View style={[styles.crosshairArm, styles.crosshairLeft, crosshairHit && styles.crosshairHit]} />
        <View style={[styles.crosshairArm, styles.crosshairRight, crosshairHit && styles.crosshairHit]} />
        <View style={[styles.crosshairDot, crosshairHit && styles.crosshairDotHit]} />
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Minimap
// ---------------------------------------------------------------------------

const MINIMAP_SIZE = 120;
const MINIMAP_RADIUS = 12; // cells visible in each direction

const Minimap: React.FC = () => {
  const level = getActiveLevel();
  if (!level) return null;

  const player = getPlayer();
  if (!player?.position) return null;

  const {grid, width, depth} = level;
  const px = Math.floor(player.position.x / CELL_SIZE);
  const pz = Math.floor(player.position.z / CELL_SIZE);

  // Visible window centered on player
  const minX = Math.max(0, px - MINIMAP_RADIUS);
  const maxX = Math.min(width - 1, px + MINIMAP_RADIUS);
  const minZ = Math.max(0, pz - MINIMAP_RADIUS);
  const maxZ = Math.min(depth - 1, pz + MINIMAP_RADIUS);

  const visW = maxX - minX + 1;
  const visH = maxZ - minZ + 1;
  const cellPx = MINIMAP_SIZE / (MINIMAP_RADIUS * 2 + 1);

  // Build pixel data
  const cells: React.JSX.Element[] = [];
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const cell = grid[z]?.[x];
      if (cell === undefined) continue;
      const isWall = cell >= MapCell.WALL_STONE && cell <= MapCell.DOOR;
      if (!isWall) continue;

      const color = cell === MapCell.WALL_LAVA ? '#552200'
        : cell === MapCell.WALL_FLESH ? '#331111'
        : cell === MapCell.DOOR ? '#554422'
        : '#333333';

      cells.push(
        <View
          key={`${x}-${z}`}
          style={{
            position: 'absolute',
            left: (x - minX) * cellPx,
            top: (z - minZ) * cellPx,
            width: cellPx,
            height: cellPx,
            backgroundColor: color,
          }}
        />,
      );
    }
  }

  // Enemy dots
  const enemies = world.entities.filter(e => e.enemy && e.position);
  const enemyDots: React.JSX.Element[] = [];
  for (const e of enemies) {
    const ex = Math.floor(e.position!.x / CELL_SIZE);
    const ez = Math.floor(e.position!.z / CELL_SIZE);
    if (ex < minX || ex > maxX || ez < minZ || ez > maxZ) continue;
    enemyDots.push(
      <View
        key={`e-${e.id}`}
        style={{
          position: 'absolute',
          left: (ex - minX) * cellPx + cellPx / 2 - 2,
          top: (ez - minZ) * cellPx + cellPx / 2 - 2,
          width: 4,
          height: 4,
          backgroundColor: '#ff3333',
          borderRadius: 2,
        }}
      />,
    );
  }

  // Player dot position
  const playerDotLeft = (px - minX) * cellPx + cellPx / 2 - 3;
  const playerDotTop = (pz - minZ) * cellPx + cellPx / 2 - 3;

  return (
    <View style={styles.minimapContainer}>
      <View style={styles.minimapBorder}>
        <View style={styles.minimapInner}>
          {cells}
          {enemyDots}
          {/* Player dot */}
          <View
            style={{
              position: 'absolute',
              left: playerDotLeft,
              top: playerDotTop,
              width: 6,
              height: 6,
              backgroundColor: '#44ff44',
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Damage Numbers
// ---------------------------------------------------------------------------

const DMG_FLOAT_DIST = 60; // pixels to float upward
const DMG_LIFETIME = 1200; // matches MAX_AGE in damageEvents.ts

const DamageNumbers: React.FC = () => {
  const events = consumeDamageEvents();
  if (events.length === 0) return null;

  const now = Date.now();

  return (
    <>
      {events.map(ev => {
        const age = now - ev.time;
        const progress = Math.min(1, age / DMG_LIFETIME);
        const opacity = 1 - progress;
        const translateY = -progress * DMG_FLOAT_DIST;
        // Stable random offset derived from event id
        const offsetX = ((ev.id * 7919) % 120) - 60;
        const offsetY = ((ev.id * 6271) % 40) - 20;

        return (
          <Text
            key={ev.id}
            style={[
              styles.dmgNumber,
              ev.amount >= 30 && styles.dmgNumberBig,
              {
                opacity,
                transform: [{translateY: translateY + offsetY}],
                left: '50%' as DimensionValue,
                marginLeft: offsetX,
              },
            ]}>
            {ev.amount}
          </Text>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Boss Health Bar
// ---------------------------------------------------------------------------

const BOSS_TYPES = new Set(['archGoat', 'infernoGoat', 'voidGoat', 'ironGoat']);
const BOSS_DISPLAY_NAMES: Record<string, string> = {
  infernoGoat: 'INFERNO GOAT',
  voidGoat: 'VOID GOAT',
  ironGoat: 'IRON GOAT',
  archGoat: 'ARCH GOAT',
};

const BossHealthBar: React.FC = () => {
  const boss = world.entities.find(e => e.enemy && BOSS_TYPES.has(e.type ?? ''));
  if (!boss?.enemy) return null;

  const {hp, maxHp} = boss.enemy;
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const name = BOSS_DISPLAY_NAMES[boss.type ?? ''] ?? 'BOSS';

  const barColor = ratio > 0.5 ? '#cc0000' : ratio > 0.25 ? '#ff6600' : '#ff2200';

  return (
    <View style={styles.bossBarContainer}>
      <Text style={styles.bossName}>{name}</Text>
      <View style={styles.bossBarOuter}>
        <View
          style={[
            styles.bossBarInner,
            {width: `${ratio * 100}%` as DimensionValue, backgroundColor: barColor},
          ]}
        />
        {/* Tick marks at 25%, 50%, 75% */}
        {[0.25, 0.5, 0.75].map(p => (
          <View
            key={p}
            style={[styles.bossBarTick, {left: `${p * 100}%` as DimensionValue}]}
          />
        ))}
      </View>
      <Text style={styles.bossHpText}>
        {hp} / {maxHp}
      </Text>
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
    height: '100%' as DimensionValue,
  },
  healthTick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%' as DimensionValue,
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
    height: '100%' as DimensionValue,
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
  waveRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  waveText: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff6644',
    letterSpacing: 1,
  },
  streakText: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffcc00',
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
    height: '100%' as DimensionValue,
    backgroundColor: '#8855cc',
  },
  xpText: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#665588',
  },

  // -- Difficulty/Nightmare indicators --
  diffIndicatorRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  diffTag: {
    fontFamily: 'Courier',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#887766',
    letterSpacing: 1,
    backgroundColor: 'rgba(10, 5, 5, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(136, 119, 102, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  diffTagHard: {
    color: '#cc4400',
    borderColor: 'rgba(204, 68, 0, 0.3)',
  },
  nightmareTag: {
    fontFamily: 'Courier',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ff6600',
    letterSpacing: 1,
    backgroundColor: 'rgba(40, 10, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  nightmareTagUltra: {
    fontFamily: 'Courier',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ff0000',
    letterSpacing: 1,
    backgroundColor: 'rgba(40, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  permadeathTag: {
    fontFamily: 'Courier',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#880000',
    letterSpacing: 1,
    backgroundColor: 'rgba(30, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(136, 0, 0, 0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
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
    top: '50%' as DimensionValue,
    left: '50%' as DimensionValue,
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
  // -- Minimap --
  minimapContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  minimapBorder: {
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 2,
  },
  minimapInner: {
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    backgroundColor: '#0a0505',
    overflow: 'hidden' as const,
  },

  // -- Damage numbers --
  dmgNumber: {
    position: 'absolute',
    top: '45%' as DimensionValue,
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffcc00',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  dmgNumberBig: {
    fontSize: 22,
    color: '#ff4400',
  },

  // -- Boss health bar --
  bossBarContainer: {
    position: 'absolute',
    top: 70,
    left: '25%' as DimensionValue,
    right: '25%' as DimensionValue,
    alignItems: 'center',
  },
  bossName: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cc0000',
    letterSpacing: 4,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 6,
  },
  bossBarOuter: {
    width: '100%' as DimensionValue,
    height: 10,
    backgroundColor: '#1a0505',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.4)',
    overflow: 'hidden',
  },
  bossBarInner: {
    height: '100%' as DimensionValue,
  },
  bossBarTick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%' as DimensionValue,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bossHpText: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#887766',
    letterSpacing: 1,
    marginTop: 2,
  },

  crosshairHit: {
    backgroundColor: '#ffffff',
  },
  crosshairDotHit: {
    backgroundColor: '#ffffff',
    width: 4,
    height: 4,
    left: -2,
    top: -2,
  },
});
