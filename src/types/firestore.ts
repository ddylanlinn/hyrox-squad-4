import { Timestamp } from "firebase-admin/firestore";

// ==================== Squad Types ====================

export interface SquadDocument {
  id: string;
  name: string;
  description?: string;
  competitionDate: string; // YYYY-MM-DD
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // 成員資訊
  memberIds: string[];
  memberCount: number;
  captainId?: string;

  // 小隊統計（快取欄位）
  currentStreak: number;
  averageStreak: number;
  totalWorkouts: number;
  lastActivityDate?: string; // YYYY-MM-DD

  // 目標設定
  targetDailyWorkouts?: number;

  // 可選的擴展欄位
  avatarUrl?: string;
  color?: string;
  isActive: boolean;
}

export interface SquadMemberDocument {
  userId: string;
  squadId: string;
  joinedAt: Timestamp;
  role: "captain" | "member";

  // 成員在小隊中的統計（快取）
  currentStreak: number;
  totalWorkouts: number;
  lastWorkoutDate?: string; // YYYY-MM-DD

  // 使用者基本資料（冗餘，減少查詢）
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface SquadDailyStats {
  date: string; // YYYY-MM-DD
  squadId: string;
  totalWorkouts: number;
  activeMembers: string[];
  completionRate: number; // 0-1

  // 各成員的完成次數
  memberCounts: {
    [userId: string]: number;
  };

  // 距離比賽天數（快取）
  daysUntilCompetition: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== User Types ====================

export interface UserDocument {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // 小隊關聯
  currentSquadId?: string;
  squadIds: string[];

  // 統計欄位
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate?: string; // YYYY-MM-DD
}

export interface UserDailyStats {
  date: string; // YYYY-MM-DD
  userId: string;
  count: number; // 當日完成次數 (0-4)
  workoutIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== Workout Types ====================

export interface WorkoutDocument {
  id: string;
  userId: string;
  squadId: string;
  date: string; // YYYY-MM-DD
  completedAt: Timestamp;
  imageUrl: string;
  note?: string;
  createdAt: Timestamp;

  // 可選欄位
  missionId?: string;
}

// ==================== Daily Stats Types ====================

export interface GlobalDailyStats {
  date: string; // YYYY-MM-DD
  totalWorkouts: number;
  activeUsers: string[];
  updatedAt: Timestamp;

  // 快取欄位
  userCounts: {
    [userId: string]: number;
  };
}

// ==================== JSON Data Types (for import) ====================

export interface SquadData {
  id: string;
  name: string;
  description?: string;
  competitionDate: string;
  memberIds: string[];
  captainId?: string;
  targetDailyWorkouts?: number;
  color?: string;
}

export interface UserData {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface WorkoutData {
  userId: string;
  date: string; // YYYY-MM-DD
  imageUrl: string;
  note?: string;
}

export interface InitialData {
  squads: SquadData[];
  users: UserData[];
  workouts?: WorkoutData[];
}
