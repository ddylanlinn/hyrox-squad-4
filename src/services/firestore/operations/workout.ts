/**
 * Workout Operations
 * Handle workout-related Firestore CRUD operations
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
import { db } from "../../../config/firebase";
import type { WorkoutDocument } from "../../../types/firestore";
import { getTodayString } from "../utils/date";

/**
 * Get today's all workouts
 */
export async function getTodayWorkouts(
  squadId: string
): Promise<WorkoutDocument[]> {
  const today = getTodayString();
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
  limitCount?: number
): Promise<WorkoutDocument[]> {
  const workoutsRef = collection(db, "workouts");
  let workoutsQuery = query(
    workoutsRef,
    where("userId", "==", userId),
    orderBy("completedAt", "desc")
  );

  // Note: limit functionality would need to be imported and used here
  // Currently just returns all workouts sorted by date

  const workoutsSnap = await getDocs(workoutsQuery);
  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * Create workout record (CRUD only, no side effects)
 *
 * @param userId - User ID
 * @param squadId - Squad ID
 * @param imageUrl - Workout image URL
 * @param note - Note (optional)
 * @returns Workout ID
 */
export async function createWorkoutRecord(
  userId: string,
  squadId: string,
  imageUrl: string,
  note?: string
): Promise<string> {
  const workoutsRef = collection(db, "workouts");
  const workoutDoc = doc(workoutsRef);
  const today = getTodayString();

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

  await setDoc(workoutDoc, workoutData);

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

/**
 * Get recent workouts for a squad (for timeline view)
 * Returns workouts from recent days, grouped by date
 *
 * @param squadId - Squad ID
 * @param days - Number of days to fetch (default: 30)
 * @returns Map of date string to workout documents
 */
export async function getRecentWorkouts(
  squadId: string,
  days: number = 30
): Promise<Map<string, WorkoutDocument[]>> {
  // Calculate the start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  const startDateString = startDate.toISOString().split("T")[0];

  const workoutsRef = collection(db, "workouts");
  const workoutsQuery = query(
    workoutsRef,
    where("squadId", "==", squadId),
    where("date", ">=", startDateString),
    orderBy("date", "desc"),
    orderBy("completedAt", "desc")
  );

  const workoutsSnap = await getDocs(workoutsQuery);
  const workouts = workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);

  // Group by date
  const groupedWorkouts = new Map<string, WorkoutDocument[]>();
  for (const workout of workouts) {
    const dateKey = workout.date;
    if (!groupedWorkouts.has(dateKey)) {
      groupedWorkouts.set(dateKey, []);
    }
    groupedWorkouts.get(dateKey)!.push(workout);
  }

  return groupedWorkouts;
}

/**
 * Get all workouts for a squad (no date limit)
 */
export async function getAllWorkouts(
  squadId: string
): Promise<Map<string, WorkoutDocument[]>> {
  const workoutsRef = collection(db, "workouts");
  const workoutsQuery = query(
    workoutsRef,
    where("squadId", "==", squadId),
    orderBy("date", "desc"),
    orderBy("completedAt", "desc")
  );

  const workoutsSnap = await getDocs(workoutsQuery);
  const workouts = workoutsSnap.docs.map(
    (doc) => doc.data() as WorkoutDocument
  );

  // Group by date
  const groupedWorkouts = new Map<string, WorkoutDocument[]>();
  for (const workout of workouts) {
    const dateKey = workout.date;
    if (!groupedWorkouts.has(dateKey)) {
      groupedWorkouts.set(dateKey, []);
    }
    groupedWorkouts.get(dateKey)!.push(workout);
  }

  return groupedWorkouts;
}
