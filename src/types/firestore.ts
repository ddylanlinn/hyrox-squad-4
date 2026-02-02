import { Timestamp } from "firebase/firestore";

// ==================== Squad Types ====================

export interface SquadDocument {
  id: string;
  name: string;
  description?: string;
  competitionDate: string; // YYYY-MM-DD
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Member information
  memberIds: string[];
  memberCount: number; // Number of members in the squad (required)
  captainId?: string;

  // Squad statistics (cached fields)
  averageStreak: number;
  totalWorkouts: number;
  lastActivityDate?: string; // YYYY-MM-DD

  // Target settings
  targetDailyWorkouts?: number;

  // Optional extension fields
  color?: string;
  isActive?: boolean; // Whether the squad is currently active
}

/**
 * Squad member subcollection document
 * Only stores squad-specific data (role, joinedAt)
 *
 * Collection: squads/{squadId}/members/{userId}
 *
 * Note: User stats (totalWorkouts) are read from users/{userId}
 * at runtime and merged into this interface for convenience
 */
export interface SquadMemberDocument {
  // Squad-specific fields (stored in subcollection)
  userId: string;
  squadId: string;
  joinedAt: Timestamp;
  role: "captain" | "member";

  // Runtime-merged fields from users/{userId}
  // These are NOT stored in the subcollection, but merged by getSquadMembers()
  totalWorkouts: number;
  lastWorkoutDate?: string; // YYYY-MM-DD
  name: string;
  initials: string;
  avatarUrl?: string;
}

/**
 * Minimal subcollection document structure
 * Used for Firestore reads/writes - only contains stored fields
 */
export interface SquadMemberStoredData {
  role: "captain" | "member";
  joinedAt: Timestamp;
}

/**
 * @reserved - 預留類型，目前未使用
 * 用於未來擴充每日團隊統計功能
 */
export interface SquadDailyStats {
  date: string; // YYYY-MM-DD
  squadId: string;
  totalWorkouts: number;
  activeMembers: string[];
  completionRate: number; // 0-1

  // Completion count for each member
  memberCounts: {
    [userId: string]: number;
  };

  // Days until competition (cached)
  daysUntilCompetition: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== User Types ====================

export interface UserDocument {
  id: string;
  name: string;
  initials: string;
  email?: string; // Added: User email
  avatarUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp; // Added: Last login time

  // Squad associations
  currentSquadId?: string;
  squadIds?: string[]; // Made optional, new users may not have joined a squad yet

  // Statistics fields
  longestStreak?: number; // Made optional
  totalWorkouts?: number; // Made optional
  lastWorkoutDate?: string; // YYYY-MM-DD
}

// ==================== Auth Binding Types ====================

/**
 * Authentication account binding
 * Used to bind Firebase Auth UID to app user ID
 *
 * Collection: auth-bindings/{firebaseAuthUid}
 */
export interface AuthBindingDocument {
  firebaseAuthUid: string; // Firebase Auth UID (document ID)
  appUserId: string; // Bound app user ID (u1, u2, u3, u4)
  provider: string; // Login method (google.com, facebook.com, etc.)
  email?: string; // Login email
  displayName?: string; // Login display name
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDailyStats {
  date: string; // YYYY-MM-DD
  userId: string;
  count: number; // Daily completion count (0-10)
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
  updatedAt?: Timestamp; // Added for edit tracking

  // Optional fields
  missionId?: string;
}

// ==================== Daily Stats Types ====================

/**
 * @reserved - 預留類型，目前未使用
 * 用於未來擴充全域每日統計功能
 */
export interface GlobalDailyStats {
  date: string; // YYYY-MM-DD
  totalWorkouts: number;
  activeUsers: string[];
  updatedAt: Timestamp;

  // Cached fields
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
