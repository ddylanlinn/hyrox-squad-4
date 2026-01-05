/**
 * Streak Calculator Functions
 * Pure calculation functions for streak-related computations
 */

import type { UserDailyStats } from "../../../types/firestore";
import { getTodayString, toLocalDateString } from "../utils/date";

/**
 * Calculate personal streak
 *
 * Algorithm:
 * - Count consecutive days backwards from today (or yesterday if no record today)
 * - Use Map for O(1) lookup performance
 * - Handle timezone correctly with local date strings
 *
 * @param stats - User daily stats array (can be unsorted)
 * @returns Streak count
 */
export function calculateStreak(stats: UserDailyStats[]): number {
  if (stats.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = getTodayString();

  // Build a Map for O(1) lookup - only include days with workouts
  const statsMap = new Map<string, UserDailyStats>();
  for (const stat of stats) {
    if (stat.count > 0) {
      statsMap.set(stat.date, stat);
    }
  }

  // Check if today has a record
  const hasTodayRecord = statsMap.has(todayString);

  let streak = 0;
  let checkDate = new Date(today);

  // If no record today, start from yesterday (1-day grace period)
  if (!hasTodayRecord) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days backwards
  while (streak < 365) {
    // Safety limit
    const dateString = toLocalDateString(checkDate);

    if (statsMap.has(dateString)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Break when we hit a gap
      break;
    }
  }

  return streak;
}

/**
 * Calculate squad streak
 * Squad streak counts consecutive days where AT LEAST ONE member has checked in
 *
 * Algorithm:
 * - Count backwards from today (or yesterday if no member checked in today)
 * - For each day, verify at least one member has workout record
 * - Stop at first day where no member checked in
 *
 * @param memberStats - Map of userId to their daily stats array
 * @param memberIds - All member IDs in the squad
 * @returns Squad streak count
 */
export function calculateSquadStreak(
  memberStats: Map<string, UserDailyStats[]>,
  memberIds: string[]
): number {
  if (memberIds.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = getTodayString();

  // Build Maps for each member for O(1) lookup
  const memberStatsLookup = new Map<string, Map<string, UserDailyStats>>();
  for (const [memberId, stats] of memberStats.entries()) {
    const statsMap = new Map<string, UserDailyStats>();
    for (const stat of stats) {
      if (stat.count > 0) {
        statsMap.set(stat.date, stat);
      }
    }
    memberStatsLookup.set(memberId, statsMap);
  }

  // Check if any member checked in today
  const anyCheckedInToday = memberIds.some((memberId) => {
    const statsMap = memberStatsLookup.get(memberId);
    return statsMap && statsMap.has(todayString);
  });

  let squadStreak = 0;
  let checkDate = new Date(today);

  // If no member checked in today, start from yesterday (grace period)
  if (!anyCheckedInToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Check consecutive days backwards
  while (squadStreak < 365) {
    // Safety limit
    const checkDateString = toLocalDateString(checkDate);

    // Check if ANY member has checked in on this date
    const anyCheckedIn = memberIds.some((memberId) => {
      const statsMap = memberStatsLookup.get(memberId);
      return statsMap && statsMap.has(checkDateString);
    });

    if (anyCheckedIn) {
      squadStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return squadStreak;
}

/**
 * Calculate average streak across all members
 *
 * @param memberStats - Map of userId to their daily stats array
 * @returns Average streak
 */
export function calculateAverageStreak(
  memberStats: Map<string, UserDailyStats[]>
): number {
  if (memberStats.size === 0) return 0;

  let totalStreak = 0;
  for (const stats of memberStats.values()) {
    totalStreak += calculateStreak(stats);
  }

  return Math.round(totalStreak / memberStats.size);
}
