/**
 * Dashboard Aggregator
 * Aggregates multiple data sources to provide complete dashboard data
 */

import { getSquad, getSquadMembers } from "../operations/squad";
import { getUser, getUserStats } from "../operations/user";
import { getTodayWorkouts } from "../operations/workout";
import type {
  SquadDocument,
  SquadMemberDocument,
  UserDocument,
  UserDailyStats,
  WorkoutDocument,
} from "../../../types/firestore";

/**
 * Team daily stats - aggregated from all members
 * count = number of members who completed workout on that day (0-4)
 */
export interface TeamDailyStats {
  date: string; // YYYY-MM-DD
  count: number; // 0-4 (number of members who completed)
  memberIds: string[]; // IDs of members who completed
}

/**
 * Dashboard data interface
 */
export interface DashboardData {
  squad: SquadDocument | null;
  members: SquadMemberDocument[];
  user: UserDocument | null;
  userStats: UserDailyStats[];
  todayWorkouts: WorkoutDocument[];
  teamHistory: TeamDailyStats[]; // Added: aggregated team stats for Heatmap
}

/**
 * Aggregate member stats into team daily stats
 * Per TECHNICAL_SPEC.md L549-555: count = number of members completed (0-4)
 */
function aggregateTeamStats(
  memberStatsMap: Map<string, UserDailyStats[]>
): TeamDailyStats[] {
  // Build a map of date -> memberIds who completed
  const dateMap = new Map<string, Set<string>>();

  for (const [memberId, stats] of memberStatsMap.entries()) {
    for (const stat of stats) {
      if (stat.count > 0) {
        if (!dateMap.has(stat.date)) {
          dateMap.set(stat.date, new Set());
        }
        dateMap.get(stat.date)!.add(memberId);
      }
    }
  }

  // Convert to TeamDailyStats array
  const result: TeamDailyStats[] = [];
  for (const [date, memberIds] of dateMap.entries()) {
    result.push({
      date,
      count: memberIds.size,
      memberIds: Array.from(memberIds),
    });
  }

  // Sort by date descending
  return result.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get all data required for the dashboard
 *
 * This function retrieves all necessary data in parallel for better performance
 *
 * @param userId - User ID
 * @param squadId - Squad ID
 * @param statsDays - Number of days to retrieve stats for, default is 80 days (matches HEATMAP_DAYS_COUNT)
 * @returns Complete dashboard data
 */
export async function getDashboardData(
  userId: string,
  squadId: string,
  statsDays: number = 80
): Promise<DashboardData> {
  // Step 1: Get squad and members
  const [squad, members, user, todayWorkouts] = await Promise.all([
    getSquad(squadId),
    getSquadMembers(squadId),
    getUser(userId),
    getTodayWorkouts(squadId),
  ]);

  // Step 2: Get all members' stats for team history
  const memberIds = squad?.memberIds || [];
  const memberStatsMap = new Map<string, UserDailyStats[]>();

  // Also get current user's stats
  const userStatsPromise = getUserStats(userId, statsDays);

  // Get all members' stats in parallel
  const memberStatsPromises = memberIds.map(async (memberId) => {
    const stats = await getUserStats(memberId, statsDays);
    return { memberId, stats };
  });

  const [userStats, ...memberStatsResults] = await Promise.all([
    userStatsPromise,
    ...memberStatsPromises,
  ]);

  // Build memberStatsMap
  for (const { memberId, stats } of memberStatsResults) {
    memberStatsMap.set(memberId, stats);
  }

  // Step 3: Aggregate team stats for Heatmap
  const teamHistory = aggregateTeamStats(memberStatsMap);

  return {
    squad,
    members,
    user,
    userStats,
    todayWorkouts,
    teamHistory,
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
