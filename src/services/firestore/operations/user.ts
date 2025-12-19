/**
 * User Operations
 * Handle user-related Firestore CRUD operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import type { UserDocument, UserDailyStats } from "../../../types/firestore";

/**
 * Get user data
 */
export async function getUser(userId: string): Promise<UserDocument | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserDocument;
  }
  return null;
}

/**
 * Get user stats for the last N days
 *
 * @param userId - User ID
 * @param days - Number of days, default 70 days
 */
export async function getUserStats(
  userId: string,
  days: number = 70
): Promise<UserDailyStats[]> {
  const statsRef = collection(db, "users", userId, "stats");
  const statsQuery = query(statsRef, orderBy("date", "desc"), limit(days));
  const statsSnap = await getDocs(statsQuery);

  return statsSnap.docs.map((doc) => doc.data() as UserDailyStats);
}

/**
 * Get user stats by date
 */
export async function getUserStatsByDate(
  userId: string,
  date: string
): Promise<UserDailyStats | null> {
  const statsRef = doc(db, "users", userId, "stats", date);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    return statsSnap.data() as UserDailyStats;
  }
  return null;
}

/**
 * Update user data
 */
export async function updateUser(
  userId: string,
  data: Partial<UserDocument>
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update user streak
 */
export async function updateUserStreak(
  userId: string,
  currentStreak: number,
  longestStreak: number
): Promise<void> {
  await updateUser(userId, {
    currentStreak,
    longestStreak,
    lastWorkoutDate: new Date().toISOString().split("T")[0],
  });
}

/**
 * Update user daily stats
 * Internal use, called by workout service
 */
export async function updateUserDailyStats(
  userId: string,
  date: string,
  workoutId: string
): Promise<void> {
  const statsRef = doc(db, "users", userId, "stats", date);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    // Update existing stats
    const currentData = statsSnap.data() as UserDailyStats;
    await updateDoc(statsRef, {
      count: currentData.count + 1,
      workoutIds: [...currentData.workoutIds, workoutId],
      updatedAt: Timestamp.now(),
    });
  } else {
    // Create new stats
    const newStats: UserDailyStats = {
      date,
      userId,
      count: 1,
      workoutIds: [workoutId],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(statsRef, newStats);
  }
}
