/**
 * FatalErrorModal -- full-screen error overlay shown when initialization fails.
 *
 * Styled in the same hell-noir aesthetic as DeathScreen. Blocks all game
 * interaction and surfaces the raw error message so bugs can be diagnosed.
 * Only way out is to reload the page.
 */
import type React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FatalErrorModalProps {
  error: Error | string;
}

const GLITCH_ART = `██████╗ ██████╗ ██████╗  ██████╗ ██████╗
██╔════╝ ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
█████╗   ██████╔╝██████╔╝██║   ██║██████╔╝
██╔══╝   ██╔══██╗██╔══██╗██║   ██║██╔══██╗
███████╗ ██║  ██║██║  ██║╚██████╔╝██║  ██║`;

export const FatalErrorModal: React.FC<FatalErrorModalProps> = ({ error }) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-only">
      {/* Dark overlay — blocks all interaction beneath */}
      <View style={styles.overlay} />

      {/* Glitch art header */}
      <View style={styles.artContainer}>
        <Text style={styles.glitchArt}>{GLITCH_ART}</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleGlow}>INITIALIZATION FAILED</Text>
        <Text style={styles.title}>INITIALIZATION FAILED</Text>
      </View>

      <Text style={styles.subtitle}>hell.exe encountered a fatal exception</Text>

      {/* Error details panel */}
      <View style={styles.errorPanel}>
        <View style={styles.errorPanelHeader}>
          <Text style={styles.errorPanelHeaderText}>EXCEPTION DETAIL</Text>
        </View>
        <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorScrollContent}>
          <Text style={styles.errorMessage}>{message}</Text>
          {stack && (
            <Text style={styles.errorStack} selectable>
              {stack}
            </Text>
          )}
        </ScrollView>
      </View>

      <Text style={styles.hint}>
        Check the browser console for additional context. Open DevTools → Console.
      </Text>

      {/* Reload button */}
      <TouchableOpacity style={styles.reloadButton} onPress={handleReload} activeOpacity={0.7}>
        <Text style={styles.reloadButtonText}>↺ RELOAD PAGE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
  },

  // Art
  artContainer: {
    marginBottom: 12,
  },
  glitchArt: {
    fontFamily: 'Courier',
    fontSize: 7,
    lineHeight: 9,
    color: '#330011',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 4,
  },
  titleGlow: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: 'transparent',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 30, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#ff2200',
    letterSpacing: 6,
  },

  subtitle: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#664433',
    letterSpacing: 2,
    marginBottom: 20,
  },

  // Error panel
  errorPanel: {
    backgroundColor: 'rgba(5, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 0, 0.3)',
    width: '100%',
    maxWidth: 640,
    maxHeight: 260,
    marginBottom: 12,
  },
  errorPanelHeader: {
    backgroundColor: 'rgba(255, 30, 0, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 30, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  errorPanelHeaderText: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#884422',
    letterSpacing: 3,
  },
  errorScroll: {
    flex: 1,
  },
  errorScrollContent: {
    padding: 12,
  },
  errorMessage: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#ff6633',
    lineHeight: 20,
    marginBottom: 8,
  },
  errorStack: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#443322',
    lineHeight: 14,
  },

  hint: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#443322',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: 480,
  },

  // Reload button
  reloadButton: {
    borderWidth: 2,
    borderColor: '#cc2200',
    backgroundColor: 'rgba(204, 34, 0, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  reloadButtonText: {
    fontFamily: 'Courier',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cc2200',
    letterSpacing: 4,
  },
});
