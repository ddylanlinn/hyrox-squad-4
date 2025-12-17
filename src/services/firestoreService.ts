/**
 * Firestore Service
 *
 * Provides unified interface for all Firestore database operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  SquadDocument,
  SquadMemberDocument,
  UserDocument,
  UserDailyStats,
  WorkoutDocument,
} from "../types/firestore";

// ==================== Squad Operations ====================

/**
 * Get squad data
 */
export async function getSquad(squadId: string): Promise<SquadDocument | null> {
  const squadRef = doc(db, "squads", squadId);
  const squadSnap = await getDoc(squadRef);

  if (squadSnap.exists()) {
    return squadSnap.data() as SquadDocument;
  }
  return null;
}

/**
 * Get squad members
 */
export async function getSquadMembers(
  squadId: string
): Promise<SquadMemberDocument[]> {
  const membersRef = collection(db, "squads", squadId, "members");
  const membersSnap = await getDocs(
    query(membersRef, orderBy("currentStreak", "desc"))
  );

  return membersSnap.docs.map((doc) => doc.data() as SquadMemberDocument);
}

/**
 * Update squad data
 */
export async function updateSquad(
  squadId: string,
  data: Partial<SquadDocument>
): Promise<void> {
  const squadRef = doc(db, "squads", squadId);
  await updateDoc(squadRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ==================== User Operations ====================

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
 * Get user statistics for the last N days
 */
export async function getUserStats(
  userId: string,
  days: number = 70
): Promise<UserDailyStats[]> {
  const statsRef = collection(db, "users", userId, "stats");
  const statsSnap = await getDocs(
    query(statsRef, orderBy("date", "desc"), limit(days))
  );

  return statsSnap.docs.map((doc) => doc.data() as UserDailyStats);
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

// ==================== Workout Operations ====================

/**
 * Get all workout records for today
 */
export async function getTodayWorkouts(
  squadId: string
): Promise<WorkoutDocument[]> {
  const today = new Date().toISOString().split("T")[0];
  const workoutsRef = collection(db, "workouts");
  const workoutsSnap = await getDocs(
    query(
      workoutsRef,
      where("squadId", "==", squadId),
      where("date", "==", today),
      orderBy("completedAt", "desc")
    )
  );

  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * Get workout records for a specific date
 */
export async function getWorkoutsByDate(
  squadId: string,
  date: string
): Promise<WorkoutDocument[]> {
  const workoutsRef = collection(db, "workouts");
  const workoutsSnap = await getDocs(
    query(
      workoutsRef,
      where("squadId", "==", squadId),
      where("date", "==", date),
      orderBy("completedAt", "desc")
    )
  );

  return workoutsSnap.docs.map((doc) => doc.data() as WorkoutDocument);
}

/**
 * Create workout record
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

  await setDoc(workoutDoc, workoutData);

  // Update user daily statistics
  await updateUserDailyStats(userId, today, workoutDoc.id);

  return workoutDoc.id;
}

/**
 * Update user daily statistics
 */
async function updateUserDailyStats(
  userId: string,
  date: string,
  workoutId: string
): Promise<void> {
  const statsRef = doc(db, "users", userId, "stats", date);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    const currentData = statsSnap.data() as UserDailyStats;
    await updateDoc(statsRef, {
      count: currentData.count + 1,
      workoutIds: [...currentData.workoutIds, workoutId],
      updatedAt: Timestamp.now(),
    });
  } else {
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

// ==================== Dashboard Data ====================

/**
 * Get all data needed for dashboard
 */
export async function getDashboardData(userId: string, squadId: string) {
  const [squad, members, user, userStats, todayWorkouts] = await Promise.all([
    getSquad(squadId),
    getSquadMembers(squadId),
    getUser(userId),
    getUserStats(userId, 70),
    getTodayWorkouts(squadId),
  ]);

  return {
    squad,
    members,
    user,
    userStats,
    todayWorkouts,
  };
}

// ==================== Helper Functions ====================

/**
 * Calculate streak days
 */
export function calculateStreak(stats: UserDailyStats[]): number {
  if (stats.length === 0) return 0;

  // Sort by date descending
  const sortedStats = [...stats].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const stat of sortedStats) {
    const statDate = new Date(stat.date);
    statDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak && stat.count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate days until competition
 */
export function calculateDaysUntilCompetition(competitionDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const competition = new Date(competitionDate);
  competition.setHours(0, 0, 0, 0);

  const diffTime = competition.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
