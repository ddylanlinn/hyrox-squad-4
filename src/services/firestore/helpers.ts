/**
 * Firestore Helper Functions
 * 輔助函數和工具方法
 */

import type { UserDailyStats } from "../../types/firestore";

/**
 * 計算連續天數
 *
 * @param stats - 使用者每日統計陣列（應按日期降序排列）
 * @returns 連續天數
 */
export function calculateStreak(stats: UserDailyStats[]): number {
  if (stats.length === 0) return 0;

  // 確保按日期降序排列
  const sortedStats = [...stats].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const stat of sortedStats) {
    const statDate = new Date(stat.date);
    statDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 檢查是否連續且有訓練記錄
    if (daysDiff === streak && stat.count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 計算距離比賽天數
 *
 * @param competitionDate - 比賽日期 (YYYY-MM-DD)
 * @returns 距離天數（負數表示已過期）
 */
export function calculateDaysUntilCompetition(competitionDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const competition = new Date(competitionDate);
  competition.setHours(0, 0, 0, 0);

  const diffTime = competition.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 取得今天的日期字串
 *
 * @returns YYYY-MM-DD 格式的日期字串
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * 取得指定天數前的日期字串
 *
 * @param days - 天數
 * @returns YYYY-MM-DD 格式的日期字串
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

/**
 * 產生日期範圍陣列
 *
 * @param startDate - 開始日期 (YYYY-MM-DD)
 * @param endDate - 結束日期 (YYYY-MM-DD)
 * @returns 日期字串陣列
 */
export function generateDateRange(
  startDate: string,
  endDate: string
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 格式化日期為顯示用字串
 *
 * @param dateString - 日期字串 (YYYY-MM-DD)
 * @param locale - 語系，預設繁體中文
 * @returns 格式化後的日期字串
 */
export function formatDate(
  dateString: string,
  locale: string = "zh-TW"
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 檢查日期是否為今天
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * 檢查日期是否為昨天
 */
export function isYesterday(dateString: string): boolean {
  return dateString === getDaysAgo(1);
}
