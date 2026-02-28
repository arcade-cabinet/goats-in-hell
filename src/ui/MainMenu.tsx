import React, {useEffect, useState, useRef, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, type DimensionValue} from 'react-native';
import {
  useGameStore,
  generateSeedPhrase,
  SEED_POOLS,
  DIFFICULTY_PRESETS,
} from '../state/GameStore';
import type {Difficulty, NightmareFlags} from '../state/GameStore';
import {writeSettings} from '../state/GameStore';
import {setMasterVolume} from '../game/systems/AudioSystem';
import {setMusicMasterVolume} from '../game/systems/MusicSystem';

// ---------------------------------------------------------------------------
// Main Menu (New Game / Continue / Settings)
// ---------------------------------------------------------------------------

export const MainMenu: React.FC = () => {
  const screen = useGameStore(s => s.screen);

  if (screen === 'newGame') return <NewGameScreen />;
  if (screen === 'settings') return <SettingsScreen />;
  return <TitleScreen />;
};

// ---------------------------------------------------------------------------
// Title Screen
// ---------------------------------------------------------------------------

const GOAT_ART = `        ╱╲     ╱╲
       ╱  ╲   ╱  ╲
      ╱    ╲_╱    ╲
     │  ◈        ◈  │
     │       ▼       │
      ╲    ┌───┐    ╱
       ╲   │ ▲ │   ╱
        ╲  └───┘  ╱
         ╲_______╱
          │ ║║║ │
          │ ║║║ │
         ╱│     │╲
        ╱ └─────┘ ╲`;

const TitleScreen: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const patch = useGameStore(s => s.patch);
  const hasSave = useGameStore(s => s.hasSave);
  const continueGame = useGameStore(s => s.continueGame);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1, duration: 1200, useNativeDriver: false}),
        Animated.timing(pulseAnim, {toValue: 0.3, duration: 1200, useNativeDriver: false}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={s.container}>
      <View style={s.bgLayer} />

      {/* Decorative border lines */}
      <View style={s.borderTop} />
      <View style={s.borderBottom} />

      {/* Pentagram hint — subtle decorative lines */}
      <Text style={s.pentagram}>{'⛧'}</Text>

      {/* Goat skull art */}
      <Animated.Text style={[s.goatArt, {opacity: pulseAnim}]}>
        {GOAT_ART}
      </Animated.Text>

      {/* Title */}
      <View style={s.titleWrap}>
        <Text style={s.titleGlow}>GOATS IN HELL</Text>
        <Text style={s.title}>GOATS IN HELL</Text>
      </View>
      <Text style={s.subtitle}>A DESCENT INTO MADNESS</Text>

      <Text style={s.divider}>{'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'}</Text>

      <Animated.Text style={[s.pulse, {opacity: pulseAnim}]}>
        {'— CHOOSE YOUR FATE —'}
      </Animated.Text>

      {/* Menu buttons */}
      <View style={s.menuButtons}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => patch({screen: 'newGame'})}
          activeOpacity={0.7}>
          <Text style={s.primaryBtnText}>NEW GAME</Text>
        </TouchableOpacity>

        {hasSave ? (
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={continueGame}
            activeOpacity={0.7}>
            <Text style={s.secondaryBtnText}>CONTINUE</Text>
            <Text style={s.btnHint}>Resume saved run</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.secondaryBtn, s.disabledBtn]}>
            <Text style={[s.secondaryBtnText, s.disabledBtnText]}>CONTINUE</Text>
            <Text style={s.btnHint}>No save found</Text>
          </View>
        )}

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => patch({screen: 'settings'})}
          activeOpacity={0.7}>
          <Text style={s.secondaryBtnText}>SETTINGS</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom decorative elements */}
      <Text style={s.bottomDecor}>{'⛧  ☠  ⛧'}</Text>

      <Text style={s.footer}>v0.6.6.6</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// New Game Screen – Difficulty Grid + Seed Selection
// ---------------------------------------------------------------------------

const DIFFICULTIES: {key: Difficulty; icon: string; desc: string}[] = [
  {key: 'easy', icon: '🕯', desc: 'Merciful spawns\n+50% pickups'},
  {key: 'normal', icon: '🔥', desc: 'The intended\nexperience'},
  {key: 'hard', icon: '💀', desc: 'Relentless hordes\nfewer supplies'},
];

const NewGameScreen: React.FC = () => {
  const patch = useGameStore(s => s.patch);
  const startNewGame = useGameStore(s => s.startNewGame);

  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [nightmare, setNightmare] = useState(false);
  const [permadeath, setPermadeath] = useState(false);
  const [ultraNightmare, setUltraNightmare] = useState(false);
  const [seed, setSeed] = useState(generateSeedPhrase);

  // When ultra nightmare is toggled on, permadeath is forced
  const effectivePermadeath = ultraNightmare || permadeath;

  const rerollSeed = useCallback(() => {
    setSeed(generateSeedPhrase());
  }, []);

  const rerollWord = useCallback(
    (idx: 0 | 1 | 2) => {
      const parts = seed.split('-');
      const pool = idx < 2 ? SEED_POOLS.ADJECTIVES : SEED_POOLS.NOUNS;
      parts[idx] = pool[Math.floor(Math.random() * pool.length)];
      setSeed(parts.join('-'));
    },
    [seed],
  );

  const handleStart = () => {
    const flags: NightmareFlags = {
      nightmare,
      permadeath: effectivePermadeath,
      ultraNightmare,
    };
    startNewGame(difficulty, flags, seed);
  };

  const diffMod = DIFFICULTY_PRESETS[difficulty];

  return (
    <View style={s.container}>
      <View style={s.bgLayer} />

      <TouchableOpacity onPress={() => patch({screen: 'mainMenu'})} style={s.backBtn}>
        <Text style={s.backBtnText}>{'< BACK'}</Text>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>NEW DESCENT</Text>

      {/* Difficulty Grid – top row: 3 graduated difficulties */}
      <Text style={s.label}>DIFFICULTY</Text>
      <View style={s.diffGrid}>
        {DIFFICULTIES.map(d => {
          const active = difficulty === d.key;
          return (
            <TouchableOpacity
              key={d.key}
              style={[s.diffCell, active && s.diffCellActive]}
              onPress={() => setDifficulty(d.key)}
              activeOpacity={0.7}>
              <Text style={s.diffIcon}>{d.icon}</Text>
              <Text style={[s.diffLabel, active && s.diffLabelActive]}>
                {DIFFICULTY_PRESETS[d.key].label.toUpperCase()}
              </Text>
              <Text style={s.diffDesc}>{d.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom row: nightmare modifiers */}
      <View style={s.modRow}>
        <TouchableOpacity
          style={[s.modCell, nightmare && s.modCellActive]}
          onPress={() => setNightmare(n => !n)}
          activeOpacity={0.7}>
          <Text style={s.modIcon}>👹</Text>
          <Text style={[s.modLabel, nightmare && s.modLabelActive]}>NIGHTMARE</Text>
          <Text style={s.modDesc}>2x damage{'\n'}no health drops</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.modCell,
            effectivePermadeath && s.modCellActive,
            ultraNightmare && s.modCellLocked,
          ]}
          onPress={() => !ultraNightmare && setPermadeath(p => !p)}
          activeOpacity={ultraNightmare ? 1 : 0.7}>
          <Text style={s.modIcon}>⚰</Text>
          <Text style={[s.modLabel, effectivePermadeath && s.modLabelActive]}>
            PERMADEATH
          </Text>
          <Text style={s.modDesc}>
            {ultraNightmare ? 'Forced by\nUltra Nightmare' : 'One life\nno continues'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.modCell, ultraNightmare && s.modCellUltra]}
          onPress={() => {
            setUltraNightmare(u => {
              const next = !u;
              if (next) {
                setNightmare(true);
                setPermadeath(true);
              }
              return next;
            });
          }}
          activeOpacity={0.7}>
          <Text style={s.modIcon}>🩸</Text>
          <Text style={[s.modLabel, ultraNightmare && s.modLabelUltra]}>
            ULTRA{'\n'}NIGHTMARE
          </Text>
          <Text style={s.modDesc}>Everything on{'\n'}extra boss phases</Text>
        </TouchableOpacity>
      </View>

      {/* Seed selector */}
      <Text style={[s.label, {marginTop: 20}]}>SEED</Text>
      <View style={s.seedRow}>
        {seed.split('-').map((word, idx) => (
          <TouchableOpacity
            key={idx}
            style={s.seedWord}
            onPress={() => rerollWord(idx as 0 | 1 | 2)}>
            <Text style={s.seedWordText}>{word}</Text>
            <Text style={s.seedReroll}>↻</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={rerollSeed}>
        <Text style={s.rerollAll}>REROLL ALL</Text>
      </TouchableOpacity>

      {/* Stats preview */}
      <View style={s.preview}>
        <Text style={s.previewText}>
          HP {diffMod.playerStartHp} | Enemy HP ×{diffMod.enemyHpMult} | DMG ×
          {diffMod.enemyDmgMult} | XP ×{diffMod.xpMult}
        </Text>
      </View>

      {/* Start button */}
      <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.7}>
        <Text style={s.startBtnText}>DESCEND</Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Settings Screen
// ---------------------------------------------------------------------------

/** Helper to persist all settings to localStorage after a store patch. */
const persistAllSettings = () => {
  const st = useGameStore.getState();
  writeSettings({
    masterVolume: st.masterVolume,
    mouseSensitivity: st.mouseSensitivity,
    touchLookSensitivity: st.touchLookSensitivity,
    gamepadLookSensitivity: st.gamepadLookSensitivity,
    gamepadDeadzone: st.gamepadDeadzone,
    gyroSensitivity: st.gyroSensitivity,
    gyroEnabled: st.gyroEnabled,
    hapticsEnabled: st.hapticsEnabled,
  });
};

/** Generic slider row used throughout the Settings screen. */
const SettingSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Display formatter — defaults to percentage of max. */
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({label, value, min, max, step, format, onChange}) => {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  const display = format ? format(value) : `${Math.round(value * 100)}%`;

  const adjust = (delta: number) => {
    const raw = value + delta;
    // Round to avoid floating-point drift
    const clamped = Math.max(min, Math.min(max, Math.round(raw * 1000) / 1000));
    onChange(clamped);
  };

  return (
    <View style={s.settingRow}>
      <Text style={s.settingLabel}>{label}</Text>
      <View style={s.sliderRow}>
        <TouchableOpacity onPress={() => adjust(-step)} style={s.sliderBtn}>
          <Text style={s.sliderBtnText}>-</Text>
        </TouchableOpacity>
        <View style={s.sliderTrack}>
          <View style={[s.sliderFill, {width: `${pct}%` as DimensionValue}]} />
        </View>
        <TouchableOpacity onPress={() => adjust(step)} style={s.sliderBtn}>
          <Text style={s.sliderBtnText}>+</Text>
        </TouchableOpacity>
        <Text style={s.sliderValue}>{display}</Text>
      </View>
    </View>
  );
};

/** Toggle row for boolean settings. */
const SettingToggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({label, value, onChange}) => (
  <View style={s.settingRow}>
    <View style={s.toggleRow}>
      <Text style={s.settingLabel}>{label}</Text>
      <TouchableOpacity
        style={[s.toggleBtn, value && s.toggleBtnActive]}
        onPress={() => onChange(!value)}
        activeOpacity={0.7}>
        <Text style={[s.toggleBtnText, value && s.toggleBtnTextActive]}>
          {value ? 'ON' : 'OFF'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const SettingsScreen: React.FC = () => {
  const patch = useGameStore(s => s.patch);
  const masterVolume = useGameStore(s => s.masterVolume);
  const mouseSensitivity = useGameStore(s => s.mouseSensitivity);
  const touchLookSensitivity = useGameStore(s => s.touchLookSensitivity);
  const gamepadLookSensitivity = useGameStore(s => s.gamepadLookSensitivity);
  const gamepadDeadzone = useGameStore(s => s.gamepadDeadzone);
  const gyroSensitivity = useGameStore(s => s.gyroSensitivity);
  const gyroEnabled = useGameStore(s => s.gyroEnabled);
  const hapticsEnabled = useGameStore(s => s.hapticsEnabled);

  /** Patch store + persist. For volume we also update audio engine. */
  const patchAndPersist = useCallback((partial: Record<string, unknown>) => {
    patch(partial as any);
    // Defer persistence so the store has settled
    setTimeout(persistAllSettings, 0);
  }, [patch]);

  const adjustVolume = useCallback((v: number) => {
    patchAndPersist({masterVolume: v});
    setMasterVolume(v);
    setMusicMasterVolume(v);
  }, [patchAndPersist]);

  return (
    <View style={s.container}>
      <View style={s.bgLayer} />
      <TouchableOpacity onPress={() => patch({screen: 'mainMenu'})} style={s.backBtn}>
        <Text style={s.backBtnText}>{'< BACK'}</Text>
      </TouchableOpacity>
      <Text style={s.sectionTitle}>SETTINGS</Text>

      {/* --- Audio section --- */}
      <Text style={s.settingsSectionHeader}>AUDIO</Text>

      <SettingSlider
        label="VOLUME"
        value={masterVolume}
        min={0}
        max={1}
        step={0.1}
        onChange={adjustVolume}
      />

      {/* --- Controls section --- */}
      <Text style={s.settingsSectionHeader}>CONTROLS</Text>

      <SettingSlider
        label="MOUSE SENSITIVITY"
        value={mouseSensitivity}
        min={0.1}
        max={1}
        step={0.1}
        onChange={v => patchAndPersist({mouseSensitivity: v})}
      />
      <SettingSlider
        label="TOUCH LOOK SENSITIVITY"
        value={touchLookSensitivity}
        min={0.1}
        max={2}
        step={0.1}
        format={v => `${v.toFixed(1)}x`}
        onChange={v => patchAndPersist({touchLookSensitivity: v})}
      />
      <SettingSlider
        label="GAMEPAD LOOK SENSITIVITY"
        value={gamepadLookSensitivity}
        min={0.1}
        max={2}
        step={0.1}
        format={v => `${v.toFixed(1)}x`}
        onChange={v => patchAndPersist({gamepadLookSensitivity: v})}
      />
      <SettingSlider
        label="GAMEPAD DEADZONE"
        value={gamepadDeadzone}
        min={0.05}
        max={0.4}
        step={0.05}
        format={v => v.toFixed(2)}
        onChange={v => patchAndPersist({gamepadDeadzone: v})}
      />

      {/* --- Features section --- */}
      <Text style={s.settingsSectionHeader}>FEATURES</Text>

      <SettingToggle
        label="GYROSCOPE AIM (MOBILE)"
        value={gyroEnabled}
        onChange={v => patchAndPersist({gyroEnabled: v})}
      />
      {gyroEnabled && (
        <SettingSlider
          label="GYRO SENSITIVITY"
          value={gyroSensitivity}
          min={0.1}
          max={2}
          step={0.1}
          format={v => `${v.toFixed(1)}x`}
          onChange={v => patchAndPersist({gyroSensitivity: v})}
        />
      )}
      <SettingToggle
        label="VIBRATION FEEDBACK"
        value={hapticsEnabled}
        onChange={v => patchAndPersist({hapticsEnabled: v})}
      />

      {/* Controls reference */}
      <View style={s.settingsGroup}>
        <Text style={s.settingsLabel}>KEY BINDINGS</Text>
        <View style={s.controlsGrid}>
          <View style={s.controlCol}>
            <Text style={s.controlLine}><Text style={s.controlKey}>WASD</Text>{'  '}Move</Text>
            <Text style={s.controlLine}><Text style={s.controlKey}>MOUSE</Text>{'  '}Look</Text>
            <Text style={s.controlLine}><Text style={s.controlKey}>CLICK</Text>{'  '}Shoot</Text>
            <Text style={s.controlLine}><Text style={s.controlKey}>SHIFT</Text>{'  '}Sprint</Text>
          </View>
          <View style={s.controlCol}>
            <Text style={s.controlLine}><Text style={s.controlKey}>R</Text>{'     '}Reload</Text>
            <Text style={s.controlLine}><Text style={s.controlKey}>1-4</Text>{'   '}Weapons</Text>
            <Text style={s.controlLine}><Text style={s.controlKey}>ESC</Text>{'   '}Pause</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#110000',
  },

  // Decorative borders
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#440000',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#440000',
  },
  pentagram: {
    fontSize: 30,
    color: '#330000',
    marginBottom: 8,
    opacity: 0.4,
  },

  // Goat art
  goatArt: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#cc2200',
    lineHeight: 17,
    marginBottom: 16,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(255, 68, 0, 0.6)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 8,
  },

  // Title
  titleWrap: {alignItems: 'center', justifyContent: 'center', height: 50, marginBottom: 4, width: '100%' as DimensionValue},
  title: {
    position: 'absolute',
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#cc0000',
    letterSpacing: 10,
  },
  titleGlow: {
    position: 'absolute',
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 10,
    textShadowColor: 'rgba(255, 0, 0, 0.9)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 30,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Courier',
    color: '#884422',
    letterSpacing: 8,
    marginBottom: 8,
  },
  divider: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#440000',
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.5,
  },
  pulse: {
    fontSize: 14,
    fontFamily: 'Courier',
    color: '#cc0000',
    letterSpacing: 4,
    marginBottom: 16,
  },

  // Menu buttons
  menuButtons: {alignItems: 'center', gap: 12, marginBottom: 16},
  primaryBtn: {
    borderWidth: 2,
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.12)',
    paddingVertical: 14,
    paddingHorizontal: 60,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#cc0000',
    fontSize: 22,
    letterSpacing: 6,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#660000',
    backgroundColor: 'rgba(102, 0, 0, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#880000',
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  btnHint: {
    color: '#442222',
    fontSize: 9,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  disabledBtn: {
    opacity: 0.35,
  },
  disabledBtnText: {
    color: '#553333',
  },

  bottomDecor: {
    fontFamily: 'Courier',
    fontSize: 16,
    color: '#440000',
    letterSpacing: 8,
    marginTop: 8,
    opacity: 0.5,
  },

  footer: {
    position: 'absolute',
    bottom: 12,
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#331111',
    letterSpacing: 2,
  },

  // Back button
  backBtn: {position: 'absolute', top: 20, left: 20, padding: 8},
  backBtnText: {fontFamily: 'Courier', fontSize: 14, color: '#880000', letterSpacing: 2},

  // Section title
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#cc0000',
    letterSpacing: 6,
    marginBottom: 16,
  },

  // Label
  label: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#884422',
    letterSpacing: 4,
    marginBottom: 8,
  },

  // Difficulty grid (3 columns)
  diffGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  diffCell: {
    width: 120,
    borderWidth: 1,
    borderColor: '#440000',
    backgroundColor: 'rgba(40, 0, 0, 0.3)',
    padding: 12,
    alignItems: 'center',
  },
  diffCellActive: {
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.15)',
  },
  diffIcon: {fontSize: 24, marginBottom: 4},
  diffLabel: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#663333',
    letterSpacing: 2,
    marginBottom: 4,
  },
  diffLabelActive: {color: '#cc0000'},
  diffDesc: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#553322',
    textAlign: 'center',
    lineHeight: 12,
  },

  // Modifier row (3 columns)
  modRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  modCell: {
    width: 120,
    borderWidth: 1,
    borderColor: '#330000',
    backgroundColor: 'rgba(30, 0, 0, 0.3)',
    padding: 10,
    alignItems: 'center',
  },
  modCellActive: {
    borderColor: '#aa4400',
    backgroundColor: 'rgba(170, 68, 0, 0.15)',
  },
  modCellLocked: {
    opacity: 0.5,
  },
  modCellUltra: {
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.2)',
  },
  modIcon: {fontSize: 20, marginBottom: 2},
  modLabel: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#553333',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 2,
  },
  modLabelActive: {color: '#cc6600'},
  modLabelUltra: {color: '#ff0000'},
  modDesc: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#443322',
    textAlign: 'center',
    lineHeight: 11,
  },

  // Seed selector
  seedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  seedWord: {
    borderWidth: 1,
    borderColor: '#440022',
    backgroundColor: 'rgba(40, 0, 20, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seedWordText: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#aa4466',
    letterSpacing: 1,
  },
  seedReroll: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#663344',
  },
  rerollAll: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#663344',
    letterSpacing: 2,
    marginBottom: 8,
  },

  // Stats preview
  preview: {
    borderTopWidth: 1,
    borderColor: '#330000',
    paddingTop: 8,
    marginBottom: 16,
  },
  previewText: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#664433',
    letterSpacing: 1,
  },

  // Start button
  startBtn: {
    borderWidth: 2,
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  startBtnText: {
    fontFamily: 'Courier',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#cc0000',
    letterSpacing: 6,
  },

  // Settings section header (e.g. "CONTROLS", "FEATURES")
  settingsSectionHeader: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#cc0000',
    letterSpacing: 6,
    marginTop: 16,
    marginBottom: 10,
    opacity: 0.7,
  },

  // Settings
  settingRow: {
    marginBottom: 14,
    width: 320,
  },
  settingLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#884433',
    letterSpacing: 4,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: '#660000',
    backgroundColor: 'rgba(102, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderBtnText: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cc0000',
  },
  sliderTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#1a0505',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.25)',
    overflow: 'hidden' as const,
  },
  sliderFill: {
    height: '100%' as DimensionValue,
    backgroundColor: '#cc0000',
  },
  sliderValue: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#cc0000',
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right' as const,
  },
  // Toggle controls
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#440000',
    backgroundColor: 'rgba(40, 0, 0, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 14,
    minWidth: 56,
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.15)',
  },
  toggleBtnText: {
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#553333',
    letterSpacing: 2,
  },
  toggleBtnTextActive: {
    color: '#cc0000',
  },

  settingsGroup: {
    alignItems: 'center',
    marginTop: 20,
  },
  settingsLabel: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#663333',
    letterSpacing: 6,
    marginBottom: 10,
  },
  controlsGrid: {
    flexDirection: 'row',
    gap: 30,
  },
  controlCol: {gap: 2},
  controlLine: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#553322',
    lineHeight: 16,
  },
  controlKey: {
    color: '#884433',
    fontWeight: 'bold',
  },
});
