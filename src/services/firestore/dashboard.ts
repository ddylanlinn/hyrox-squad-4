/**
 * Dashboard Service
 * Aggregates multiple data sources to provide complete dashboard data
 */

import { getSquad, getSquadMembers } from "./squad";
import { getUser, getUserStats } from "./user";
import { getTodayWorkouts } from "./workout";
import type {
  SquadDocument,
  SquadMemberDocument,
  UserDocument,
  UserDailyStats,
  WorkoutDocument,
} from "../../types/firestore";

/**
 * Dashboard data interface
 */
export interface DashboardData {
  squad: SquadDocument | null;
  members: SquadMemberDocument[];
  user: UserDocument | null;
  userStats: UserDailyStats[];
  todayWorkouts: WorkoutDocument[];
}

/**
 * Get all data required for the dashboard
 *
 * This function retrieves all necessary data in parallel for better performance
 *
 * @param userId - User ID
 * @param squadId - Squad ID
 * @param statsDays - Number of days to retrieve stats for, default is 70 days
 * @returns Complete dashboard data
 */
export async function getDashboardData(
  userId: string,
  squadId: string,
  statsDays: number = 70
): Promise<DashboardData> {
  // Retrieve all data in parallel for better performance
  const [squad, members, user, userStats, todayWorkouts] = await Promise.all([
    getSquad(squadId),
    getSquadMembers(squadId),
    getUser(userId),
    getUserStats(userId, statsDays),
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

/**
 * Get squad dashboard data (without individual stats)
 * 
 * @param squadId - Squad ID
 * @returns Squad dashboard data
 */
export async function getSquadDashboardData(squadId: string): Promise<{
  squad: SquadDocument | null;
  members: SquadMemberDocument[];
  todayWorkouts: WorkoutDocument[];
}> {
  const [squad, members, todayWorkouts] = await Promise.all([
    getSquad(squadId),
    getSquadMembers(squadId),
    getTodayWorkouts(squadId),
  ]);

  return {
    squad,
    members,
    todayWorkouts,
  };
}
