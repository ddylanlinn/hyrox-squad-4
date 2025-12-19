/**
 * Streak Calculator Functions
 * Pure calculation functions for streak-related computations
 */

import type { UserDailyStats } from "../../../types/firestore";
import { getTodayString } from "../utils/date";

/**
 * Calculate personal streak
 *
 * @param stats - User daily stats array (should be sorted by date in descending order)
 * @returns Streak count
 */
export function calculateStreak(stats: UserDailyStats[]): number {
  if (stats.length === 0) return 0;

  // Ensure sorted by date in descending order
  const sortedStats = [...stats].sort((a, b) => b.date.localeCompare(a.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = getTodayString();

  // Check if today has a record
  const hasTodayRecord = sortedStats.some(
    (stat) => stat.date === todayString && stat.count > 0
  );

  // If today has no record, start counting from yesterday (give 1-day grace period)
  // If today has a record, start counting from today
  let streak = 0;
  const startDayOffset = hasTodayRecord ? 0 : 1;

  for (const stat of sortedStats) {
    const statDate = new Date(stat.date);
    statDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Start counting from startDayOffset (0 if checked in today, 1 if not)
    // Check if consecutive and has workout record
    if (daysDiff === streak + startDayOffset && stat.count > 0) {
      streak++;
    } else if (daysDiff > streak + startDayOffset) {
      // If we've passed the expected date, stop counting
      break;
    }
  }

  return streak;
}

/**
 * Calculate squad streak
 * Squad streak counts consecutive days where ALL members have checked in
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

  let squadStreak = 0;

  // Check if all members checked in today
  const allCheckedInToday = memberIds.every((memberId) => {
    const stats = memberStats.get(memberId) || [];
    return stats.some((stat) => stat.date === todayString && stat.count > 0);
  });

  // Start from yesterday if not all members checked in today (1-day grace period)
  const startDayOffset = allCheckedInToday ? 0 : 1;

  // Check consecutive days backwards
  for (let dayOffset = startDayOffset; dayOffset < 365; dayOffset++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - dayOffset);
    const checkDateString = checkDate.toISOString().split("T")[0];

    // Check if ALL members have checked in on this date
    const allCheckedIn = memberIds.every((memberId) => {
      const stats = memberStats.get(memberId) || [];
      return stats.some(
        (stat) => stat.date === checkDateString && stat.count > 0
      );
    });

    if (allCheckedIn) {
      squadStreak++;
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
