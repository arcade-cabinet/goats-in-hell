import type React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setMasterVolume } from '../game/systems/AudioSystem';
import { setMusicMasterVolume } from '../game/systems/MusicSystem';
import { useGameStore, writeSettings } from '../state/GameStore';

export const PauseMenu: React.FC = () => {
  const patch = useGameStore((s) => s.patch);
  const resetToMenu = useGameStore((s) => s.resetToMenu);
  const masterVolume = useGameStore((s) => s.masterVolume);
  const mouseSensitivity = useGameStore((s) => s.mouseSensitivity);

  const volumePercent = Math.round(masterVolume * 100);
  const sensitivityPercent = Math.round(mouseSensitivity * 100);

  const persistSettings = () => {
    const s = useGameStore.getState();
    writeSettings({
      masterVolume: s.masterVolume,
      mouseSensitivity: s.mouseSensitivity,
      touchLookSensitivity: s.touchLookSensitivity,
      gamepadLookSensitivity: s.gamepadLookSensitivity,
      gamepadDeadzone: s.gamepadDeadzone,
      gyroSensitivity: s.gyroSensitivity,
      gyroEnabled: s.gyroEnabled,
      hapticsEnabled: s.hapticsEnabled,
    });
  };

  const adjustVolume = (delta: number) => {
    const newVol = Math.max(0, Math.min(1, masterVolume + delta));
    patch({ masterVolume: newVol });
    setMasterVolume(newVol);
    setMusicMasterVolume(newVol);
    setTimeout(persistSettings, 0);
  };

  const adjustSensitivity = (delta: number) => {
    const newSens = Math.max(0.1, Math.min(1, mouseSensitivity + delta));
    patch({ mouseSensitivity: newSens });
    setTimeout(persistSettings, 0);
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dark semi-transparent background */}
      <View style={styles.backdrop} />

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleGlow}>PAUSED</Text>
          <Text style={styles.title}>PAUSED</Text>
        </View>

        {/* Decorative divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDot}>{'\u2666'}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.resumeButton}
            onPress={() => patch({ screen: 'playing' })}
            activeOpacity={0.7}
          >
            <View style={styles.resumeButtonHighlight} />
            <Text style={styles.resumeButtonText}>RESUME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quitButton}
            onPress={() => resetToMenu()}
            activeOpacity={0.7}
          >
            <Text style={styles.quitButtonText}>QUIT TO MENU</Text>
          </TouchableOpacity>
        </View>

        {/* Divider before settings */}
        <View style={styles.dividerSmall}>
          <View style={styles.dividerLineSmall} />
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>VOLUME</Text>
            <View style={styles.sliderRow}>
              <TouchableOpacity onPress={() => adjustVolume(-0.1)} style={styles.sliderBtn}>
                <Text style={styles.sliderBtnText}>-</Text>
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${volumePercent}%` as any }]} />
              </View>
              <TouchableOpacity onPress={() => adjustVolume(0.1)} style={styles.sliderBtn}>
                <Text style={styles.sliderBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{volumePercent}%</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>SENSITIVITY</Text>
            <View style={styles.sliderRow}>
              <TouchableOpacity onPress={() => adjustSensitivity(-0.1)} style={styles.sliderBtn}>
                <Text style={styles.sliderBtnText}>-</Text>
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${sensitivityPercent}%` as any }]} />
              </View>
              <TouchableOpacity onPress={() => adjustSensitivity(0.1)} style={styles.sliderBtn}>
                <Text style={styles.sliderBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{sensitivityPercent}%</Text>
            </View>
          </View>
        </View>

        {/* Divider before controls */}
        <View style={styles.dividerSmall}>
          <View style={styles.dividerLineSmall} />
        </View>

        {/* Controls reference */}
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsHeader}>CONTROLS</Text>
          <View style={styles.controlsGrid}>
            <View style={styles.controlCol}>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>W A S D</Text>
                <Text style={styles.controlAction}>Move</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>MOUSE</Text>
                <Text style={styles.controlAction}>Look</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>L-CLICK</Text>
                <Text style={styles.controlAction}>Shoot</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>SHIFT</Text>
                <Text style={styles.controlAction}>Sprint</Text>
              </View>
            </View>
            <View style={styles.controlCol}>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>R</Text>
                <Text style={styles.controlAction}>Reload</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>1 - 4</Text>
                <Text style={styles.controlAction}>Switch Weapon</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlKey}>ESC</Text>
                <Text style={styles.controlAction}>Pause / Resume</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 2, 2, 0.82)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },

  // Title with dim glow
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 6,
  },
  title: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#776655',
    letterSpacing: 12,
  },
  titleGlow: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 12,
    textShadowColor: 'rgba(136, 85, 51, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  // Dividers
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  dividerLine: {
    width: 70,
    height: 1,
    backgroundColor: 'rgba(136, 85, 51, 0.25)',
  },
  dividerDot: {
    fontSize: 10,
    color: '#664422',
  },
  dividerSmall: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  dividerLineSmall: {
    width: 200,
    height: 1,
    backgroundColor: 'rgba(136, 85, 51, 0.12)',
  },

  // Buttons
  buttonsContainer: {
    alignItems: 'center',
    gap: 14,
  },
  resumeButton: {
    borderWidth: 2,
    borderColor: '#cc0000',
    backgroundColor: 'rgba(204, 0, 0, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 50,
    alignItems: 'center',
    overflow: 'hidden',
    minWidth: 220,
  },
  resumeButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(204, 0, 0, 0.3)',
  },
  resumeButtonText: {
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
    minWidth: 220,
  },
  quitButtonText: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#776655',
    letterSpacing: 3,
  },

  // Settings
  settingsContainer: {
    alignItems: 'center',
    width: 280,
  },
  settingRow: {
    marginBottom: 14,
    width: '100%',
  },
  settingLabel: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#776655',
    letterSpacing: 3,
    marginBottom: 6,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderBtn: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: '#554433',
    backgroundColor: 'rgba(85, 68, 51, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderBtnText: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#776655',
  },
  sliderTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#1a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(136, 85, 51, 0.25)',
    overflow: 'hidden' as const,
  },
  sliderFill: {
    height: '100%' as any,
    backgroundColor: '#884422',
  },
  sliderValue: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#776655',
    fontWeight: 'bold',
    width: 36,
    textAlign: 'right' as const,
  },

  // Controls reference
  controlsContainer: {
    alignItems: 'center',
  },
  controlsHeader: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#554433',
    letterSpacing: 6,
    marginBottom: 10,
  },
  controlsGrid: {
    flexDirection: 'row',
    gap: 30,
  },
  controlCol: {
    gap: 6,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  controlKey: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#776655',
    width: 70,
    textAlign: 'right',
  },
  controlAction: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#554433',
  },
});
