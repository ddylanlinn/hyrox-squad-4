/**
 * Firestore Helper Functions
 * Helper functions and utility methods
 */

import type { UserDailyStats } from "../../types/firestore";

/**
 * Calculate streak
 *
 * @param stats - User daily stats array (should be sorted by date in descending order)
 * @returns Streak count
 */
export function calculateStreak(stats: UserDailyStats[]): number {
  if (stats.length === 0) return 0;

  // Ensure sorted by date in descending order
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

    // Check if consecutive and has workout record
    if (daysDiff === streak && stat.count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate days until competition
 *
 * @param competitionDate - Competition date (YYYY-MM-DD)
 * @returns Days until competition (negative number if expired)
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
 * Get today's date string
 *
 * @returns YYYY-MM-DD formatted date string
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get the date string for a specified number of days ago
 *
 * @param days - Number of days
 * @returns YYYY-MM-DD formatted date string
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

/**
 * Generate date range array
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Date string array
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
 * Format date to display string
 *
 * @param dateString - Date string (YYYY-MM-DD)
 * @param locale - Language, default is Traditional Chinese
 * @returns Formatted date string
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
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(dateString: string): boolean {
  return dateString === getDaysAgo(1);
}
