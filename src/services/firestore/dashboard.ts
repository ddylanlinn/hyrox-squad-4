/**
 * Dashboard Service
 * 聚合多個資料來源，提供儀表板所需的完整資料
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
 * 儀表板資料介面
 */
export interface DashboardData {
  squad: SquadDocument | null;
  members: SquadMemberDocument[];
  user: UserDocument | null;
  userStats: UserDailyStats[];
  todayWorkouts: WorkoutDocument[];
}

/**
 * 取得儀表板所需的所有資料
 *
 * 這個函數會並行取得所有必要的資料，提升效能
 *
 * @param userId - 使用者 ID
 * @param squadId - 小隊 ID
 * @param statsDays - 要取得的統計天數，預設 70 天
 * @returns 儀表板完整資料
 */
export async function getDashboardData(
  userId: string,
  squadId: string,
  statsDays: number = 70
): Promise<DashboardData> {
  // 並行取得所有資料，提升效能
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
 * 取得小隊儀表板資料（不包含個人統計）
 * 適用於查看其他小隊的情況
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
