/**
 * PropErrorModal -- dismissable overlay shown when DungeonProps finds spawn types
 * with no registered GLB in AssetRegistry.
 *
 * Unlike FatalErrorModal this is non-blocking — the level still renders, but all
 * unregistered prop types are invisible. Dismissed with a button or by clicking the
 * overlay background. Errors are also printed to console.error for CI visibility.
 */
import type React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PropErrorModalProps {
  errors: string[];
  onDismiss: () => void;
}

export const PropErrorModal: React.FC<PropErrorModalProps> = ({ errors, onDismiss }) => {
  if (errors.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Semi-transparent overlay — tap to dismiss */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss} />

      {/* Modal panel */}
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚠ ASSET REGISTRY ERROR</Text>
          <Text style={styles.headerCount}>
            {errors.length} MISSING PROP REGISTRATION{errors.length !== 1 ? 'S' : ''}
          </Text>
        </View>

        <Text style={styles.body}>
          The following prop types were spawned but have no GLB registered in AssetRegistry.
          {'\n'}Add each to PROP_MODEL_ASSETS or SETPIECE_MODEL_ASSETS to render them.
        </Text>

        <ScrollView style={styles.errorList} contentContainerStyle={styles.errorListContent}>
          {errors.map((err) => (
            <Text key={err} style={styles.errorLine} selectable>
              {'  •  '}
              {err}
            </Text>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.dismissText}>DISMISS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  panel: {
    backgroundColor: '#0a0000',
    borderWidth: 2,
    borderColor: 'rgba(255, 100, 0, 0.6)',
    width: '90%',
    maxWidth: 680,
    maxHeight: '80%',
    zIndex: 1,
  },
  header: {
    backgroundColor: 'rgba(255, 80, 0, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 100, 0, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6600',
    letterSpacing: 2,
  },
  headerCount: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: '#884422',
    letterSpacing: 1,
  },

  body: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#886644',
    lineHeight: 17,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  errorList: {
    maxHeight: 240,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 100, 0, 0.2)',
  },
  errorListContent: {
    padding: 12,
  },
  errorLine: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#ff8844',
    lineHeight: 19,
  },

  dismissButton: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 100, 0, 0.3)',
    backgroundColor: 'rgba(255, 80, 0, 0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6600',
    letterSpacing: 4,
  },
});
