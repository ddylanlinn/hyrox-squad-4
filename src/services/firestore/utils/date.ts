/**
 * Date Utility Functions
 * Helper functions for date manipulation and formatting
 */

/**
 * Convert Date object to local date string (YYYY-MM-DD)
 * Uses local timezone instead of UTC to avoid date shift issues
 *
 * @param date - Date object
 * @returns YYYY-MM-DD formatted date string in local timezone
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date string in local timezone
 *
 * @returns YYYY-MM-DD formatted date string
 */
export function getTodayString(): string {
  return toLocalDateString(new Date());
}

/**
 * Get the date string for a specified number of days ago in local timezone
 *
 * @param days - Number of days
 * @returns YYYY-MM-DD formatted date string
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalDateString(date);
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
    dates.push(toLocalDateString(current));
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
