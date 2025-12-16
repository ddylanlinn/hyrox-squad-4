export interface User {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string; // Placeholder or actual image
}

export interface WorkoutRecord {
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

export interface Mission {
  title: string;
  description: string;
}