/**
 * Date Utility Functions
 * Helper functions for date manipulation and formatting
 */

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
