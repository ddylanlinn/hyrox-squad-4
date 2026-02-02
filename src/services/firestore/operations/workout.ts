/**
 * Workout Operations
 * Handle workout-related Firestore CRUD operations
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
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
 * @param date - Check-in date (optional, defaults to today)
 * @returns Workout ID
 */
export async function createWorkoutRecord(
  userId: string,
  squadId: string,
  imageUrl: string,
  note?: string,
  date?: string
): Promise<string> {
  const workoutsRef = collection(db, "workouts");
  const workoutDoc = doc(workoutsRef);
  const checkInDate = date || getTodayString();

  const workoutData: WorkoutDocument = {
    id: workoutDoc.id,
    userId,
    squadId,
    date: checkInDate,
    completedAt: Timestamp.now(),
    imageUrl,
    note: note || "",
    createdAt: Timestamp.now(),
  };

  await setDoc(workoutDoc, workoutData);

  return workoutDoc.id;
}

/**
 * Get workout by ID
 *
 * @param workoutId - Workout ID
 * @returns Workout document or null if not found
 */
export async function getWorkoutById(
  workoutId: string
): Promise<WorkoutDocument | null> {
  const workoutRef = doc(db, "workouts", workoutId);
  const workoutSnap = await getDoc(workoutRef);

  if (workoutSnap.exists()) {
    return workoutSnap.data() as WorkoutDocument;
  }
  return null;
}

/**
 * Update workout record
 * Only allows updating imageUrl and note
 *
 * @param workoutId - Workout ID
 * @param updates - Fields to update (imageUrl and/or note)
 */
export async function updateWorkout(
  workoutId: string,
  updates: { imageUrl?: string; note?: string }
): Promise<void> {
  const workoutRef = doc(db, "workouts", workoutId);
  await updateDoc(workoutRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete workout
 * Returns the workout data before deletion for cleanup operations
 *
 * @param workoutId - Workout ID
 * @returns Workout document before deletion
 * @throws Error if workout not found
 */
export async function deleteWorkout(
  workoutId: string
): Promise<WorkoutDocument> {
  const workoutRef = doc(db, "workouts", workoutId);

  // Fetch workout to get metadata
  const workoutSnap = await getDoc(workoutRef);
  if (!workoutSnap.exists()) {
    throw new Error(`Workout ${workoutId} not found`);
  }

  const workoutData = workoutSnap.data() as WorkoutDocument;

  // Delete workout document
  await deleteDoc(workoutRef);

  return workoutData;
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
