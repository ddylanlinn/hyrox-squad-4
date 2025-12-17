import type { WorkoutRecord, DailyStats, User } from "../types";
import type {
  WorkoutDocument,
  UserDailyStats,
  SquadMemberDocument,
} from "../types/firestore";

/**
 * Convert Firestore UserDailyStats to frontend DailyStats format
 */
export function convertUserDailyStatsToHistory(
  stats: UserDailyStats[]
): DailyStats[] {
  return stats.map((stat) => ({
    date: stat.date,
    count: stat.count,
    records: [], // Detailed records not needed in history view
  }));
}

/**
 * Convert Firestore WorkoutDocument to frontend WorkoutRecord format
 */
export function convertWorkoutDocumentToRecord(
  workout: WorkoutDocument
): WorkoutRecord {
  return {
    userId: workout.userId,
    completedAt: workout.completedAt.toDate().toISOString(),
    imageUrl: workout.imageUrl,
    note: workout.note,
  };
}

/**
 * Convert Firestore SquadMemberDocument to frontend User format
 */
export function convertSquadMembersToUsers(
  members: SquadMemberDocument[]
): User[] {
  return members.map((member) => ({
    id: member.userId,
    name: member.name,
    initials: member.initials,
    avatarUrl: member.avatarUrl,
  }));
}
