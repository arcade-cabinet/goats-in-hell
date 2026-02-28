/**
 * PlayerDamageBridge — engine-agnostic bridge for applying damage to the player.
 *
 * AISystem (engine-agnostic) calls `bridgeDamagePlayer()` which routes to the
 * renderer's `damagePlayer()` via a registered callback. This keeps AISystem
 * free of R3F/Three.js imports while centralizing death guards and permadeath
 * handling in a single code path.
 */

export type DamagePlayerFn = (damage: number) => boolean;

let bridgeCallback: DamagePlayerFn | null = null;

/** Register the renderer's damagePlayer function. Called once on mount. */
export function setPlayerDamageBridge(fn: DamagePlayerFn): void {
  bridgeCallback = fn;
}

/** Clear the bridge on unmount. */
export function clearPlayerDamageBridge(): void {
  bridgeCallback = null;
}

/**
 * Apply damage to the player via the bridge.
 * Returns true if the player died.
 */
export function bridgeDamagePlayer(damage: number): boolean {
  if (bridgeCallback) return bridgeCallback(damage);
  return false;
}
