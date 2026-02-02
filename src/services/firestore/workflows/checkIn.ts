/**
 * Check-in Workflow
 * Orchestrates the complete check-in process including:
 * - Creating workout record
 * - Updating daily stats
 * - Calculating and persisting personal streak
 * - Calculating and persisting squad streak
 */

import { createWorkoutRecord } from "../operations/workout";
import {
  getUser,
  getUserStats,
  getUserStatsByDate,
  updateUserDailyStats,
  updateUserStreak,
} from "../operations/user";
import { getSquad, updateSquadStreak, updateSquad } from "../operations/squad";
import {
  calculateStreak,
  calculateSquadStreak,
  calculateAverageStreak,
} from "../calculators/streak";
import { getTodayString } from "../utils/date";
import { getBoundMemberIds } from "../../auth/binding";
import type { UserDailyStats } from "../../../types/firestore";

/**
 * Input for check-in workflow
 */
export interface CheckInInput {
  userId: string;
  squadId: string;
  imageUrl: string;
  note?: string;
  date?: string; // Optional date for past check-ins (YYYY-MM-DD)
}

/**
 * Result of check-in workflow
 */
export interface CheckInResult {
  workoutId: string;
  personalStreak: number;
  longestStreak: number;
  squadStreak: number;
  squadAverageStreak: number;
}

/**
 * Execute complete check-in workflow
 *
 * This function orchestrates:
 * 1. Validate date format and not in future
 * 2. Validate not already checked in for the specified date
 * 3. Create workout record
 * 4. Update user daily stats
 * 5. Calculate and update personal streak
 * 6. Calculate and update squad streak
 *
 * @param input - Check-in input data
 * @returns Check-in result with all updated streaks
 * @throws Error if date is invalid or user has already checked in
 */
export async function executeCheckIn(
  input: CheckInInput
): Promise<CheckInResult> {
  const { userId, squadId, imageUrl, note, date } = input;
  const checkInDate = date || getTodayString();

  // Step 0: Validate date
  // Validate format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkInDate)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  // Validate not in future
  const today = getTodayString();
  if (checkInDate > today) {
    throw new Error("Cannot check in for a future date");
  }

  // Pre-check - Has user already checked in for this date?
  const existingStats = await getUserStatsByDate(userId, checkInDate);
  if (existingStats && existingStats.count > 0) {
    throw new Error(`You have already checked in on ${checkInDate}`);
  }

  // Step 1: Create workout record
  const workoutId = await createWorkoutRecord(
    userId,
    squadId,
    imageUrl,
    note,
    checkInDate
  );
  console.log(`Created workout: ${workoutId} for date: ${checkInDate}`);

  // Step 2: Update user daily stats
  await updateUserDailyStats(userId, checkInDate, workoutId);
  console.log(`Updated daily stats for user: ${userId} on ${checkInDate}`);

  // Step 3: Calculate and update personal streak
  const { personalStreak, longestStreak } = await refreshPersonalStreak(
    userId,
    checkInDate
  );
  console.log(`Updated user ${userId} streak:`, {
    personalStreak,
    longestStreak,
  });

  // Step 4: Calculate and update squad streak
  const { squadStreak, squadAverageStreak } = await refreshSquadStreak(
    squadId,
    checkInDate
  );
  console.log(`Updated squad ${squadId} streak:`, {
    squadStreak,
    squadAverageStreak,
  });

  // Step 5: Increment squad totalWorkouts
  const squad = await getSquad(squadId);
  if (squad) {
    await updateSquad(squadId, {
      totalWorkouts: (squad.totalWorkouts || 0) + 1,
    });
    console.log(
      `Incremented squad ${squadId} totalWorkouts: ${
        (squad.totalWorkouts || 0) + 1
      }`
    );
  }

  return {
    workoutId,
    personalStreak,
    longestStreak,
    squadStreak,
    squadAverageStreak,
  };
}

/**
 * Refresh personal streak for a user
 * Recalculates and persists the current and longest streak
 *
 * @param userId - User ID
 * @param checkInDate - The date being checked in (for eventual consistency handling)
 */
async function refreshPersonalStreak(
  userId: string,
  checkInDate: string
): Promise<{
  personalStreak: number;
  longestStreak: number;
}> {
  const userStats = await getUserStats(userId);

  // Optimization: If userStats doesn't have the check-in date yet (eventual consistency), add it
  // This ensures calculateStreak sees the workout that was just created
  const hasCheckInDate = userStats.some((s) => s.date === checkInDate);
  if (!hasCheckInDate) {
    userStats.unshift({
      date: checkInDate,
      userId,
      count: 1,
      workoutIds: [], // Not needed for calculation
      createdAt: null as any,
      updatedAt: null as any,
    });
  }

  const personalStreak = calculateStreak(userStats);

  // Get existing longest streak
  const userData = await getUser(userId);
  const longestStreak = Math.max(personalStreak, userData?.longestStreak || 0);

  // Persist to Firestore (with totalWorkouts increment during check-in)
  // Note: We only persist longestStreak, currentStreak is calculated in real-time
  await updateUserStreak(userId, longestStreak, true);

  return { personalStreak, longestStreak };
}

/**
 * Refresh squad streak
 * Recalculates and persists squad current and average streak
 *
 * @param squadId - Squad ID
 * @param checkInDate - The date being checked in (for eventual consistency handling)
 */
async function refreshSquadStreak(
  squadId: string,
  checkInDate: string
): Promise<{
  squadStreak: number;
  squadAverageStreak: number;
}> {
  const squad = await getSquad(squadId);
  if (!squad) {
    console.warn(`Squad ${squadId} not found`);
    return { squadStreak: 0, squadAverageStreak: 0 };
  }

  // Get all member IDs from squad
  const allMemberIds = squad.memberIds;

  if (!allMemberIds || allMemberIds.length === 0) {
    console.warn(`Squad ${squadId} has no members`);
    return { squadStreak: 0, squadAverageStreak: 0 };
  }

  // Per docs: Only count BOUND members for streak calculation
  // "如果「所有已綁定登入的使用者」在當天都完成打卡 → streak +1"
  const boundMemberIds = await getBoundMemberIds(allMemberIds);

  if (boundMemberIds.length === 0) {
    console.warn(`Squad ${squadId} has no bound members`);
    return { squadStreak: 0, squadAverageStreak: 0 };
  }

  // Get bound members' stats only
  const memberStatsMap = new Map<string, UserDailyStats[]>();

  for (const memberId of boundMemberIds) {
    const stats = await getUserStats(memberId);

    // Optimization: Ensure check-in date is reflected for all bound members if they just checked in
    // This handles eventual consistency where getDocs might not see the latest write yet
    const hasCheckInDate = stats.some((s) => s.date === checkInDate);
    if (!hasCheckInDate) {
      // We check the specific date's stats for this member to be sure
      const dateStats = await getUserStatsByDate(memberId, checkInDate);
      if (dateStats && dateStats.count > 0) {
        stats.unshift(dateStats);
      }
    }

    memberStatsMap.set(memberId, stats);
  }

  // Calculate streaks using only bound members
  const squadStreak = calculateSquadStreak(memberStatsMap, boundMemberIds);
  const squadAverageStreak = calculateAverageStreak(memberStatsMap);

  console.log(`Calculated squad streaks for ${squadId}:`, {
    squadStreak,
    squadAverageStreak,
    totalMembers: allMemberIds.length,
    boundMembers: boundMemberIds.length,
  });

  // Persist to Firestore
  // Note: We only persist averageStreak, currentStreak is calculated in real-time
  await updateSquadStreak(squadId, squadAverageStreak);

  return { squadStreak, squadAverageStreak };
}
