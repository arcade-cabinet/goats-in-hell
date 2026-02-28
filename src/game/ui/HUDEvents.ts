/**
 * HUD event bridge — engine-agnostic no-op stubs.
 *
 * Legacy Babylon.js code imported registerDamageDirection, triggerBloodSplatter,
 * triggerEnvKill etc. from BabylonHUD. The R3F HUD reads these events via
 * Zustand/GameState instead, so these are no-ops kept to avoid breaking
 * game-logic imports in AISystem, CombatSystem, HazardSystem.
 */
import type { Vec3 } from '../entities/components';

/**
 * Register a damage direction for the HUD directional indicator.
 * In R3F, the HUD overlay reads damageFlash from GameState directly.
 */
export function registerDamageDirection(_sourcePos: Vec3): void {
  // No-op: R3F HUD reads damage state from Zustand
}

/** Trigger a blood splatter overlay effect. */
export function triggerBloodSplatter(_intensity: number): void {
  // No-op: R3F HUD reads damageFlash from GameState
}

/** Reset damage indicators. */
export function resetDamageIndicators(): void {
  // No-op
}

/** Trigger environmental kill notification. */
export function triggerEnvKill(_source: string): void {
  // No-op: R3F HUD reads kill streak from GameState
}

/** Show floor stats overlay. */
export function showFloorStats(): void {
  // No-op
}

/** Check if floor stats overlay is active. */
export function isFloorStatsActive(): boolean {
  return false;
}

/** Show save toast notification. */
export function showSaveToast(): void {
  // No-op
}

/** Reset boss phase indicator. */
export function resetBossPhase(): void {
  // No-op
}
