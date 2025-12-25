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
 * 1. Validate not already checked in today
 * 2. Create workout record
 * 3. Update user daily stats
 * 4. Calculate and update personal streak
 * 5. Calculate and update squad streak
 *
 * @param input - Check-in input data
 * @returns Check-in result with all updated streaks
 * @throws Error if user has already checked in today
 */
export async function executeCheckIn(
  input: CheckInInput
): Promise<CheckInResult> {
  const { userId, squadId, imageUrl, note } = input;
  const today = getTodayString();

  // Step 0: Pre-check - Has user already checked in today?
  const existingStats = await getUserStatsByDate(userId, today);
  if (existingStats && existingStats.count > 0) {
    throw new Error("You have already checked in today");
  }

  // Step 1: Create workout record
  const workoutId = await createWorkoutRecord(userId, squadId, imageUrl, note);
  console.log(`Created workout: ${workoutId}`);

  // Step 2: Update user daily stats
  await updateUserDailyStats(userId, today, workoutId);
  console.log(`Updated daily stats for user: ${userId}`);

  // Step 3: Calculate and update personal streak
  const { personalStreak, longestStreak } = await refreshPersonalStreak(userId);
  console.log(`Updated user ${userId} streak:`, {
    personalStreak,
    longestStreak,
  });

  // Step 4: Calculate and update squad streak
  const { squadStreak, squadAverageStreak } = await refreshSquadStreak(squadId);
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
 */
async function refreshPersonalStreak(userId: string): Promise<{
  personalStreak: number;
  longestStreak: number;
}> {
  const userStats = await getUserStats(userId);
  const personalStreak = calculateStreak(userStats);

  // Get existing longest streak
  const userData = await getUser(userId);
  const longestStreak = Math.max(personalStreak, userData?.longestStreak || 0);

  // Persist to Firestore (with totalWorkouts increment during check-in)
  await updateUserStreak(userId, personalStreak, longestStreak, true);

  return { personalStreak, longestStreak };
}

/**
 * Refresh squad streak
 * Recalculates and persists squad current and average streak
 */
async function refreshSquadStreak(squadId: string): Promise<{
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
  await updateSquadStreak(squadId, squadStreak, squadAverageStreak);

  return { squadStreak, squadAverageStreak };
}
