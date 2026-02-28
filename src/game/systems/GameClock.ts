/**
 * GameClock — the single source of truth for in-game elapsed time.
 *
 * Accumulated from frame deltas inside the game loop. Stops when the game
 * is paused, on menus, or during death/victory screens — only advances
 * when gameplay is active. Every system that needs "time" (kill streaks,
 * cooldowns, animations, damage event TTLs) reads from this clock,
 * making the game fully frame-rate independent and tamper-resistant.
 *
 * Usage:
 *   - Call `tickGameClock(dt)` once per frame from the game loop (dt in ms).
 *   - Call `resetGameClock()` at game start / new run.
 *   - Read `getGameTime()` for current accumulated time (ms).
 *   - Read `getGameDelta()` for last frame's delta (ms).
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Accumulated game time in milliseconds (only advances during gameplay). */
let gameTimeMs = 0;

/** Last frame's delta in milliseconds. */
let lastDeltaMs = 0;

/** Monotonic frame counter (never resets within a session). */
let frameCount = 0;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Advance the clock by one frame. Call exactly once per game loop tick. */
export function tickGameClock(deltaMs: number): void {
  lastDeltaMs = deltaMs;
  gameTimeMs += deltaMs;
  frameCount++;
}

/** Reset the clock to zero. Call at game start / new run. */
export function resetGameClock(): void {
  gameTimeMs = 0;
  lastDeltaMs = 0;
  frameCount = 0;
}

/** Current accumulated game time in milliseconds. */
export function getGameTime(): number {
  return gameTimeMs;
}

/** Last frame's delta in milliseconds. */
export function getGameDelta(): number {
  return lastDeltaMs;
}

/** Total frames since last reset. */
export function getFrameCount(): number {
  return frameCount;
}
