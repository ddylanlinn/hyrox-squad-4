/**
 * Firestore Service
 * 統一匯出所有 Firestore 相關操作
 *
 * 使用範例：
 * import { getDashboardData, createWorkout } from '@/services/firestore';
 */

// Squad Operations
export {
  getSquad,
  getSquadMembers,
  updateSquad,
  updateSquadMember,
} from "./squad";

// User Operations
export {
  getUser,
  getUserStats,
  getUserStatsByDate,
  updateUser,
  updateUserDailyStats,
} from "./user";

// Workout Operations
export {
  getTodayWorkouts,
  getWorkoutsByDate,
  getUserWorkouts,
  createWorkout,
  deleteWorkout,
} from "./workout";

// Dashboard
export {
  getDashboardData,
  getSquadDashboardData,
  type DashboardData,
} from "./dashboard";

// Helper Functions
export {
  calculateStreak,
  calculateDaysUntilCompetition,
  getTodayString,
  getDaysAgo,
  generateDateRange,
  formatDate,
  isToday,
  isYesterday,
} from "./helpers";
