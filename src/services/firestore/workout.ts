/**
 * Workout Service
 * Handle workout-related Firestore operations
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { WorkoutDocument } from "../../types/firestore";
import { updateUserDailyStats } from "./user";

/**
 * Get today's all workouts
 */
export async function getTodayWorkouts(
  squadId: string
): Promise<WorkoutDocument[]> {
  const today = new Date().toISOString().split("T")[0];
  return getWorkoutsByDate(squadId, today);
}

/**
 * Get workouts by date
 */
export async function getWorkoutsByDate(
  squadId: string,
  date: string
): Promise<WorkoutDocument[]> {
  const workoutsRef = collection(db, "workouts");
  const workoutsQuery = query(
    workoutsRef,
    where("squadId", "==", squadId),
    where("date", "==", date),
    orderBy("completedAt", "desc")
  );
  const workoutsSnap = await getDocs(workoutsQuery);

  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * Get user workouts
 */
export async function getUserWorkouts(
  userId: string,
  limit?: number
): Promise<WorkoutDocument[]> {
  const workoutsRef = collection(db, "workouts");
  let workoutsQuery = query(
    workoutsRef,
    where("userId", "==", userId),
    orderBy("completedAt", "desc")
  );

  if (limit) {
    workoutsQuery = query(workoutsQuery, orderBy("completedAt", "desc"));
  }

  const workoutsSnap = await getDocs(workoutsQuery);
  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * Create workout
 *
 * @param userId - User ID
 * @param squadId - Squad ID
 * @param imageUrl - Workout image URL
 * @param note - Note (optional)
 * @returns Workout ID
 */
export async function createWorkout(
  userId: string,
  squadId: string,
  imageUrl: string,
  note?: string
): Promise<string> {
  const workoutsRef = collection(db, "workouts");
  const workoutDoc = doc(workoutsRef);
  const today = new Date().toISOString().split("T")[0];

  const workoutData: WorkoutDocument = {
    id: workoutDoc.id,
    userId,
    squadId,
    date: today,
    completedAt: Timestamp.now(),
    imageUrl,
    note: note || "",
    createdAt: Timestamp.now(),
  };

  // Create workout
  await setDoc(workoutDoc, workoutData);

  // Update user daily stats
  await updateUserDailyStats(userId, today, workoutDoc.id);

  return workoutDoc.id;
}

/**
 * Delete workout
 * Note: This operation should also update related statistics
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  const workoutRef = doc(db, "workouts", workoutId);
  // TODO: Implement delete logic, including updating statistics
  // await deleteDoc(workoutRef);
  throw new Error("Delete workout not implemented yet");
}
