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
  updateUserDailyStats,
  updateUserStreak,
} from "../operations/user";
import {
  getSquad,
  getSquadMembers,
  updateSquadStreak,
} from "../operations/squad";
import {
  calculateStreak,
  calculateSquadStreak,
  calculateAverageStreak,
} from "../calculators/streak";
import { getTodayString } from "../utils/date";
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
 * 1. Create workout record
 * 2. Update user daily stats
 * 3. Calculate and update personal streak
 * 4. Calculate and update squad streak
 *
 * @param input - Check-in input data
 * @returns Check-in result with all updated streaks
 */
export async function executeCheckIn(
  input: CheckInInput
): Promise<CheckInResult> {
  const { userId, squadId, imageUrl, note } = input;
  const today = getTodayString();

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

  // Persist to Firestore
  await updateUserStreak(userId, personalStreak, longestStreak);

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

  const members = await getSquadMembers(squadId);
  const memberIds = members.map((m) => m.userId);

  // Get all members' stats
  const memberStatsMap = new Map<string, UserDailyStats[]>();
  for (const memberId of memberIds) {
    const stats = await getUserStats(memberId);
    memberStatsMap.set(memberId, stats);
  }

  // Calculate streaks
  const squadStreak = calculateSquadStreak(memberStatsMap, memberIds);
  const squadAverageStreak = calculateAverageStreak(memberStatsMap);

  // Persist to Firestore
  await updateSquadStreak(squadId, squadStreak, squadAverageStreak);

  return { squadStreak, squadAverageStreak };
}
