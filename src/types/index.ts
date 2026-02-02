export interface User {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface WorkoutRecord {
  id: string; // Workout document ID
  userId: string;
  completedAt: string; // ISO string
  imageUrl: string;
  note?: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  count: number; // 0 to 4
  records: WorkoutRecord[];
}
