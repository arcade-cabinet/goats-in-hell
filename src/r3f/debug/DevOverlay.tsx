/**
 * DevOverlay -- read-only diagnostic panel (activated by ?devmode URL param).
 *
 * Reads from:
 *   - useGameStore  (circle, floor, kills, score, screen)
 *   - world.entities  (player position, HP, enemy positions)
 *   - getModelLoadState()  (model provenance: loaded / loading / failed)
 *
 * All tunables (colors, sizes, refresh rate) live in config/devOverlay.json.
 * The interactive control API lives in GameDevBridge.ts (window.__game).
 *
 * Columns:
 *   LEVEL   — circle, floor, encounter, screen, kills, score
 *   PLAYER  — world XYZ, grid XZ, HP, weapon, ammo
 *   ASSETS  — loaded/loading/failed model keys (provenance for every GLB)
 *   ENTITIES — type | grid pos | model key | GLB/FALLBACK/FAILED | HP
 */
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { devOverlayConfig } from '../../config';
import { CELL_SIZE } from '../../constants';
import { getActiveAmmo, isPlayerEntity } from '../../game/entities/TypedEntityGuards';
import { world } from '../../game/entities/world';
import { ENEMY_MODEL_ASSETS } from '../../game/systems/AssetRegistry';
import { useGameStore } from '../../state/GameStore';
import { getModelLoadState } from '../systems/ModelLoader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toGrid(w: number): number {
  return Math.round(w / CELL_SIZE);
}

function modelKeyForType(type: string): string | null {
  const k = `enemy-${type}` as keyof typeof ENEMY_MODEL_ASSETS;
  return ENEMY_MODEL_ASSETS[k] != null ? `enemy-${type}` : null;
}

type ModelStatus = 'GLB' | 'FALLBACK' | 'FAILED' | 'N/A';

function resolveModelStatus(
  modelKey: string | null,
  loaded: string[],
  failed: string[],
): ModelStatus {
  if (!modelKey) return 'N/A';
  if (failed.includes(modelKey)) return 'FAILED';
  if (loaded.includes(modelKey)) return 'GLB';
  return 'FALLBACK';
}

// Status colors sourced from config
const STATUS_COLOR: Record<ModelStatus, string> = {
  GLB: devOverlayConfig.colors.modelGlb,
  FALLBACK: devOverlayConfig.colors.modelLoading,
  FAILED: devOverlayConfig.colors.modelFailed,
  'N/A': devOverlayConfig.colors.modelNA,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DevOverlay() {
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh at configured rate (default 500ms = 2 Hz)
  useEffect(() => {
    intervalRef.current = setInterval(
      () => setTick((t) => t + 1),
      devOverlayConfig.panel.refreshRateMs,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ---- Zustand state ----
  const circle = useGameStore((s) => s.circleNumber);
  const stage = useGameStore((s) => s.stage);
  const kills = useGameStore((s) => s.kills);
  const score = useGameStore((s) => s.score);
  const screen = useGameStore((s) => s.screen);

  // ---- ECS: player entity ----
  const rawPlayer = world.entities.find((e) => e.type === 'player');
  const playerEntity = rawPlayer && isPlayerEntity(rawPlayer) ? rawPlayer : null;
  const pos = playerEntity?.position;
  const hp = playerEntity?.player?.hp ?? 0;
  const maxHp = playerEntity?.player?.maxHp ?? 100;
  const weapon = playerEntity?.player?.currentWeapon ?? '—';
  const weaponAmmo = playerEntity ? getActiveAmmo(playerEntity) : undefined;
  const clipAmmo = weaponAmmo?.current ?? 0;
  const clipMax = weaponAmmo?.magSize ?? 0;
  const reserveAmmo = weaponAmmo?.reserve ?? 0;

  const wx = pos ? Math.round(pos.x * 10) / 10 : 0;
  const wy = pos ? Math.round(pos.y * 10) / 10 : 0;
  const wz = pos ? Math.round(pos.z * 10) / 10 : 0;
  const gx = toGrid(wx);
  const gz = toGrid(wz);

  // ---- Model state ----
  const modelState = getModelLoadState();

  // ---- Entity list ----
  const entities = world.entities
    .filter((e) => e.position && (e.enemy || e.player))
    .map((e) => {
      const type = e.type ?? 'unknown';
      const isEnemy = !!e.enemy;
      const mk = isEnemy ? modelKeyForType(type) : null;
      const status = resolveModelStatus(mk, modelState.loaded, modelState.failed);
      return {
        id: e.id ?? '?',
        type,
        gx: toGrid(e.position!.x),
        gz: toGrid(e.position!.z),
        hp:
          e.enemy?.hp != null
            ? Math.round(e.enemy.hp)
            : e.player?.hp != null
              ? Math.round(e.player.hp)
              : null,
        mk,
        status,
      };
    });

  const enemyCount = entities.filter((e) => e.type !== 'player').length;
  const c = devOverlayConfig.colors;
  const hpColor =
    hp < maxHp * devOverlayConfig.thresholds.playerHealthLowFraction
      ? c.playerHealthLow
      : c.playerHealthOk;

  return (
    <View style={styles.root} pointerEvents="none">
      {/* ---- LEVEL ---- */}
      <View style={styles.panel}>
        <Text style={styles.heading}>LEVEL</Text>
        <Row label="circ" val={String(circle)} />
        <Row label="fl  " val={String(stage.floor)} />
        <Row label="enc " val={stage.encounterType} />
        <Row label="scr " val={screen} />
        <Row label="kill" val={String(kills)} />
        <Row label="sc  " val={String(score)} />
      </View>

      {/* ---- PLAYER ---- */}
      <View style={styles.panel}>
        <Text style={styles.heading}>PLAYER</Text>
        <Row label="world" val={`${wx} ${wy} ${wz}`} />
        <Row label="grid " val={`${gx}, ${gz}`} />
        <Row label="HP   " val={`${Math.round(hp)}/${maxHp}`} valColor={hpColor} />
        <Row label="wpn  " val={weapon} />
        <Row label="ammo " val={`${clipAmmo}/${clipMax} + ${reserveAmmo}r`} />
      </View>

      {/* ---- ASSETS ---- */}
      <View style={styles.panel}>
        <Text style={styles.heading}>ASSETS (models)</Text>
        <Text style={styles.assetSummary}>
          <Text style={{ color: c.modelGlb }}>{modelState.loaded.length}✓ </Text>
          <Text style={{ color: c.modelLoading }}>{modelState.loading.length}⟳ </Text>
          <Text style={{ color: c.modelFailed }}>{modelState.failed.length}✗</Text>
        </Text>
        {modelState.failed.map((k) => (
          <Text key={k} style={[styles.assetRow, { color: c.modelFailed }]}>
            ✗ {k}
          </Text>
        ))}
        {modelState.loading.map((k) => (
          <Text key={k} style={[styles.assetRow, { color: c.modelLoading }]}>
            ⟳ {k}
          </Text>
        ))}
        {modelState.loaded.map((k) => (
          <Text key={k} style={[styles.assetRow, { color: c.modelGlb }]}>
            ✓ {k}
          </Text>
        ))}
      </View>

      {/* ---- ENTITIES ---- */}
      <View style={[styles.panel, styles.entityPanel]}>
        <Text style={styles.heading}>ENTITIES ({enemyCount} enemies)</Text>
        <ScrollView style={styles.entityScroll} nestedScrollEnabled>
          {entities.map((e) => (
            <Text key={e.id} style={styles.entityRow}>
              <Text style={{ color: c.entityType }}>{e.type.padEnd(11)}</Text>{' '}
              <Text style={{ color: c.entityMeta }}>
                ({e.gx},{e.gz})
              </Text>{' '}
              {e.mk && <Text style={{ color: STATUS_COLOR[e.status] }}>[{e.status}]</Text>}
              {e.hp !== null && <Text style={{ color: c.entityMeta }}> {e.hp}hp</Text>}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Row helper
// ---------------------------------------------------------------------------

function Row({ label, val, valColor }: { label: string; val: string; valColor?: string }) {
  return (
    <Text style={styles.row}>
      <Text style={styles.label}>{label} </Text>
      <Text style={[styles.val, valColor ? { color: valColor } : {}]}>{val}</Text>
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Styles — layout/font metrics only; colors come from devOverlayConfig
// ---------------------------------------------------------------------------

const c = devOverlayConfig.colors;

const styles = StyleSheet.create({
  root: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: devOverlayConfig.panel.width,
    gap: 4,
  },
  panel: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 5,
    borderRadius: 2,
  },
  heading: {
    color: c.heading,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 2,
  },
  row: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#ccc',
    lineHeight: 14,
  },
  label: {
    color: c.label,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  val: {
    color: c.value,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  assetSummary: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 2,
  },
  assetRow: {
    fontFamily: 'monospace',
    fontSize: 9,
    lineHeight: 12,
  },
  entityPanel: {
    maxHeight: devOverlayConfig.panel.entityPanelMaxHeight,
  },
  entityScroll: {
    maxHeight: devOverlayConfig.panel.entityScrollMaxHeight,
  },
  entityRow: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#ccc',
    lineHeight: 13,
  },
});
