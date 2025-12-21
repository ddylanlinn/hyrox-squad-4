/**
 * Firestore Service
 * Export all Firestore related operations
 *
 * Usage example:
 * import { getDashboardData, executeCheckIn } from '@/services/firestore';
 */

// ============================================================
// Workflows (Preferred API for business operations)
// ============================================================
export {
  executeCheckIn,
  type CheckInInput,
  type CheckInResult,
} from "./workflows/checkIn";

// ============================================================
// Aggregators (Data fetching)
// ============================================================
export {
  getDashboardData,
  getSquadDashboardData,
  type DashboardData,
} from "./aggregators/dashboard";

// ============================================================
// Operations (Direct CRUD access when needed)
// ============================================================

// User Operations
export {
  getUser,
  getUserStats,
  getUserStatsByDate,
  updateUser,
  updateUserStreak,
  updateUserDailyStats,
} from "./operations/user";

// Squad Operations
export {
  getSquad,
  getSquadMembers,
  updateSquad,
  updateSquadStreak,
} from "./operations/squad";

// Workout Operations
export {
  getTodayWorkouts,
  getWorkoutsByDate,
  getUserWorkouts,
  createWorkoutRecord,
  deleteWorkout,
} from "./operations/workout";

// ============================================================
// Calculators (Pure functions)
// ============================================================
export {
  calculateStreak,
  calculateSquadStreak,
  calculateAverageStreak,
} from "./calculators/streak";

// ============================================================
// Utils (Helper functions)
// ============================================================
export {
  getTodayString,
  getDaysAgo,
  generateDateRange,
  formatDate,
  isToday,
  isYesterday,
  calculateDaysUntilCompetition,
  toLocalDateString,
} from "./utils/date";
