/**
 * Kill Streak System — tracks rapid kills and announces combos.
 *
 * Classic arena FPS announcer: DOUBLE KILL, TRIPLE KILL, MASSACRE, etc.
 * Kills within a time window count as a streak. Awards bonus XP.
 */

import {useGameStore} from '../../state/GameStore';
import {getGameTime} from './GameClock';

// ---------------------------------------------------------------------------
// Streak tiers
// ---------------------------------------------------------------------------

interface StreakTier {
  kills: number;
  label: string;
  xpBonus: number;
  color: string;
}

const STREAK_TIERS: StreakTier[] = [
  {kills: 2, label: 'DOUBLE KILL', xpBonus: 50, color: '#ffcc00'},
  {kills: 3, label: 'TRIPLE KILL', xpBonus: 100, color: '#ff8800'},
  {kills: 4, label: 'QUAD KILL', xpBonus: 200, color: '#ff4400'},
  {kills: 5, label: 'MASSACRE', xpBonus: 400, color: '#ff0000'},
  {kills: 7, label: 'RAMPAGE', xpBonus: 600, color: '#cc00ff'},
  {kills: 10, label: 'UNSTOPPABLE', xpBonus: 1000, color: '#ff00ff'},
  {kills: 15, label: 'GODLIKE', xpBonus: 2000, color: '#ffffff'},
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Time window (ms of game time) to maintain a streak. */
const STREAK_WINDOW = 3000;

let streakCount = 0;
let lastKillTime = 0;
let currentAnnouncement: {label: string; color: string; time: number} | null = null;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Call when an enemy is killed. Returns announcement if a streak tier was reached. */
export function registerKill(): void {
  const now = getGameTime();

  if (now - lastKillTime > STREAK_WINDOW) {
    // Streak expired — start fresh
    streakCount = 1;
  } else {
    streakCount++;
  }
  lastKillTime = now;

  // Check if we hit a streak tier
  const tier = getStreakTier(streakCount);
  if (tier) {
    currentAnnouncement = {
      label: tier.label,
      color: tier.color,
      time: now,
    };
    // Award bonus XP
    useGameStore.getState().awardXp(tier.xpBonus);
  }
}

/** Get the current active announcement (if any, within display window). */
export function getAnnouncement(): {label: string; color: string; progress: number} | null {
  if (!currentAnnouncement) return null;

  const elapsed = getGameTime() - currentAnnouncement.time;
  const displayDuration = 2000; // Show for 2 seconds

  if (elapsed > displayDuration) {
    currentAnnouncement = null;
    return null;
  }

  return {
    label: currentAnnouncement.label,
    color: currentAnnouncement.color,
    progress: elapsed / displayDuration, // 0 → 1 for animation
  };
}

/** Get current kill streak count. */
export function getStreakCount(): number {
  const now = getGameTime();
  if (now - lastKillTime > STREAK_WINDOW) return 0;
  return streakCount;
}

export function resetKillStreaks(): void {
  streakCount = 0;
  lastKillTime = 0;
  currentAnnouncement = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStreakTier(kills: number): StreakTier | null {
  // Return the highest tier that matches
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (kills >= STREAK_TIERS[i].kills) {
      return STREAK_TIERS[i];
    }
  }
  return null;
}
