/**
 * KillHintSystem -- subtle moral-feedback hints triggered by optional kills.
 *
 * After every 10th optional kill, a lower-third hint text is displayed briefly.
 * On circle transitions, a circle-appropriate hint is shown instead.
 * The HUD reads the current hint text + visibility via getKillHint().
 */

import { useGameStore } from '../../state/GameStore';

// ---------------------------------------------------------------------------
// Hint message pools
// ---------------------------------------------------------------------------

const KILL_HINTS = [
  'Another sin carried deeper...',
  'The weight grows...',
  'Blood begets blood...',
  'The abyss watches...',
  'Each kill echoes...',
];

const CIRCLE_HINTS: Record<number, string> = {
  1: 'The descent begins...',
  2: 'Deeper into torment...',
  3: 'The flames know your name...',
  4: 'No mercy was shown...',
  5: 'Halfway through Hell...',
  6: 'The violence follows you...',
  7: 'Sins pile like stones...',
  8: 'Almost at the bottom...',
  9: 'The final circle awaits...',
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentHint = '';
let hintVisibleUntil = 0;
let lastOptionalKills = 0;
let killHintIndex = 0;

/** Duration a hint stays visible (ms). */
const HINT_DURATION = 3000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call after an optional kill to check if a hint should be triggered.
 * Triggers every 10th optional kill.
 */
export function checkKillHint(): void {
  const { optionalKills } = useGameStore.getState();
  // Auto-reset if a new game was started (kills went back to 0)
  if (optionalKills === 0 && lastOptionalKills > 0) {
    resetKillHints();
    return;
  }
  if (optionalKills > 0 && optionalKills !== lastOptionalKills && optionalKills % 10 === 0) {
    currentHint = KILL_HINTS[killHintIndex % KILL_HINTS.length];
    killHintIndex++;
    hintVisibleUntil = Date.now() + HINT_DURATION;
  }
  lastOptionalKills = optionalKills;
}

/**
 * Show a circle-transition hint.
 */
export function showCircleHint(circleNumber: number): void {
  const hint = CIRCLE_HINTS[circleNumber];
  if (hint) {
    currentHint = hint;
    hintVisibleUntil = Date.now() + HINT_DURATION;
  }
}

/**
 * Get the current hint text and opacity (0-1).
 * Returns null when no hint is active.
 */
export function getKillHint(): { text: string; opacity: number } | null {
  const now = Date.now();
  if (now >= hintVisibleUntil || !currentHint) return null;

  const remaining = hintVisibleUntil - now;
  const elapsed = HINT_DURATION - remaining;

  let opacity = 1;
  if (elapsed < 400) {
    opacity = elapsed / 400; // fade in
  } else if (remaining < 600) {
    opacity = remaining / 600; // fade out
  }

  return { text: currentHint, opacity };
}

/** Reset hint state (on new game). */
export function resetKillHints(): void {
  currentHint = '';
  hintVisibleUntil = 0;
  lastOptionalKills = 0;
  killHintIndex = 0;
}
