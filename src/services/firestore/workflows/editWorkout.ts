/**
 * Edit/Delete Workout Workflow
 * Orchestrates the complete edit/delete process including:
 * - Validating workout ownership
 * - Updating workout data
 * - Managing image storage
 * - Recalculating streaks after deletion
 */

import {
  runTransaction,
  doc,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import {
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} from "../operations/workout";
import {
  getUser,
  getUserStats,
  updateUserStreak,
} from "../operations/user";
import { getSquad, updateSquad } from "../operations/squad";
import {
  calculateStreak,
  calculateSquadStreak,
  calculateAverageStreak,
} from "../calculators/streak";
import { getBoundMemberIds } from "../../auth/binding";
import { deleteWorkoutImage } from "../../storage";
import type { UserDailyStats, WorkoutDocument } from "../../../types/firestore";

/**
 * Input for edit workout workflow
 */
export interface EditWorkoutInput {
  workoutId: string;
  userId: string;
  squadId: string;
  imageUrl?: string;
  note?: string;
  oldImageUrl?: string;
}

/**
 * Execute edit workout workflow
 *
 * This function:
 * 1. Validates workout exists and belongs to userId
 * 2. Deletes old image from Storage if new image provided
 * 3. Updates workout document
 * 4. No streak recalculation needed (date/count unchanged)
 *
 * @param input - Edit workout input data
 * @throws Error if workout not found or unauthorized
 */
export async function executeEditWorkout(
  input: EditWorkoutInput
): Promise<void> {
  const { workoutId, userId, imageUrl, note, oldImageUrl } = input;

  // Step 1: Validate workout exists and belongs to user
  const workout = await getWorkoutById(workoutId);
  if (!workout) {
    throw new Error(`Workout ${workoutId} not found`);
  }

  if (workout.userId !== userId) {
    throw new Error("Unauthorized: Cannot edit another user's workout");
  }

  // Step 2: If new image provided, delete old image from Storage
  if (imageUrl && oldImageUrl && imageUrl !== oldImageUrl) {
    try {
      await deleteWorkoutImage(oldImageUrl);
      console.log(`Deleted old workout image: ${oldImageUrl}`);
    } catch (error) {
      console.warn(`Failed to delete old image: ${error}`);
      // Don't fail the whole operation if image deletion fails
    }
  }

  // Step 3: Update workout document
  const updates: { imageUrl?: string; note?: string } = {};
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (note !== undefined) updates.note = note;

  await updateWorkout(workoutId, updates);
  console.log(`Updated workout: ${workoutId}`);
}

/**
 * Input for delete workout workflow
 */
export interface DeleteWorkoutInput {
  workoutId: string;
  userId: string;
  squadId: string;
}

/**
 * Result of delete workout workflow
 */
export interface DeleteWorkoutResult {
  personalStreak: number;
  squadStreak: number;
}

/**
 * Execute delete workout workflow
 *
 * This function orchestrates:
 * 1. Validate workout belongs to userId
 * 2. Delete workout image from Storage
 * 3. Update all counters and delete documents in a single Transaction
 * 4. Recalculate streaks (post-transaction)
 *
 * @param input - Delete workout input data
 * @returns New streak values after deletion
 * @throws Error if workout not found or unauthorized
 */
export async function executeDeleteWorkout(
  input: DeleteWorkoutInput
): Promise<DeleteWorkoutResult> {
  const { workoutId, userId, squadId } = input;

  // Step 1: Validate workout belongs to user (Pre-check)
  const workout = await getWorkoutById(workoutId);
  if (!workout) {
    throw new Error(`Workout ${workoutId} not found`);
  }

  if (workout.userId !== userId) {
    throw new Error("Unauthorized: Cannot delete another user's workout");
  }

  // Step 2: Delete workout image from Storage
  // We do this first because we can't roll back storage operations easily,
  // but having an orphaned image is better than having a broken database state.
  try {
    await deleteWorkoutImage(workout.imageUrl);
    console.log(`Deleted workout image: ${workout.imageUrl}`);
  } catch (error) {
    console.warn(`Failed to delete workout image: ${error}`);
    // Continue with deletion even if image deletion fails
  }

  // Step 3: Transactional Update
  await runTransaction(db, async (transaction) => {
    // Refs
    const workoutRef = doc(db, "workouts", workoutId);
    const userRef = doc(db, "users", userId);
    const squadRef = doc(db, "squads", squadId);
    const userDailyStatsRef = doc(db, "users", userId, "stats", workout.date);

    // Reads
    const workoutDoc = await transaction.get(workoutRef);
    if (!workoutDoc.exists()) {
      throw new Error(`Workout ${workoutId} does not exist!`);
    }

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error(`User ${userId} does not exist!`);
    }

    const squadDoc = await transaction.get(squadRef);
    if (!squadDoc.exists()) {
      throw new Error(`Squad ${squadId} does not exist!`);
    }

    const statsDoc = await transaction.get(userDailyStatsRef);

    // Writes
    // 1. Delete workout
    transaction.delete(workoutRef);

    // 2. Decrement user totalWorkouts
    const currentTotalWorkouts = userDoc.data().totalWorkouts || 0;
    transaction.update(userRef, {
      totalWorkouts: Math.max(0, currentTotalWorkouts - 1),
      updatedAt: Timestamp.now(),
    });

    // 3. Decrement squad totalWorkouts
    const currentSquadTotalWorkouts = squadDoc.data().totalWorkouts || 0;
    transaction.update(squadRef, {
      totalWorkouts: Math.max(0, currentSquadTotalWorkouts - 1),
      updatedAt: Timestamp.now(),
    });

    // 4. Update daily stats
    if (statsDoc.exists()) {
      const currentCount = statsDoc.data().count || 0;
      transaction.update(userDailyStatsRef, {
        count: Math.max(0, currentCount - 1),
        workoutIds: arrayRemove(workoutId),
        updatedAt: Timestamp.now(),
      });
    }
  });

  console.log(`Transactional delete completed for workout: ${workoutId}`);

  // Step 4: Recalculate streaks (Post-transaction)
  // Streak calculation involves heavy reads and is not critical for data integrity
  const personalStreak = await recalculatePersonalStreak(userId);
  console.log(`Recalculated personal streak for ${userId}: ${personalStreak}`);

  const squadStreak = await recalculateSquadStreak(squadId);
  console.log(`Recalculated squad streak for ${squadId}: ${squadStreak}`);

  return {
    personalStreak,
    squadStreak,
  };
}

/**
 * Recalculate personal streak after workout deletion
 */
async function recalculatePersonalStreak(userId: string): Promise<number> {
  const userStats = await getUserStats(userId);
  const personalStreak = calculateStreak(userStats);

  // Get existing longest streak (don't decrease it)
  const userData = await getUser(userId);
  const longestStreak = userData?.longestStreak || 0;

  // Only update if current streak is higher than longest
  const newLongestStreak = Math.max(personalStreak, longestStreak);

  // Persist to Firestore (don't increment totalWorkouts)
  await updateUserStreak(userId, newLongestStreak, false);

  return personalStreak;
}

/**
 * Recalculate squad streak after workout deletion
 */
async function recalculateSquadStreak(squadId: string): Promise<number> {
  const squad = await getSquad(squadId);
  if (!squad) {
    console.warn(`Squad ${squadId} not found`);
    return 0;
  }

  const allMemberIds = squad.memberIds;
  if (!allMemberIds || allMemberIds.length === 0) {
    console.warn(`Squad ${squadId} has no members`);
    return 0;
  }

  // Only count BOUND members for streak calculation
  const boundMemberIds = await getBoundMemberIds(allMemberIds);

  if (boundMemberIds.length === 0) {
    console.warn(`Squad ${squadId} has no bound members`);
    return 0;
  }

  // Get bound members' stats in PARALLEL
  const memberStatsMap = new Map<string, UserDailyStats[]>();

  const statsPromises = boundMemberIds.map(async (memberId) => {
    const stats = await getUserStats(memberId);
    return { memberId, stats };
  });

  const results = await Promise.all(statsPromises);

  results.forEach(({ memberId, stats }) => {
    memberStatsMap.set(memberId, stats);
  });

  // Calculate streaks
  const squadStreak = calculateSquadStreak(memberStatsMap, boundMemberIds);
  const squadAverageStreak = calculateAverageStreak(memberStatsMap);

  console.log(`Recalculated squad streaks for ${squadId}:`, {
    squadStreak,
    squadAverageStreak,
    boundMembers: boundMemberIds.length,
  });

  // Persist to Firestore
  await updateSquad(squadId, {
    averageStreak: squadAverageStreak,
  });

  return squadStreak;
}
