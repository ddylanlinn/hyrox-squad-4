/**
 * 日期處理工具函數
 */

/**
 * 取得今天的日期字串 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * 取得指定天數前的日期字串 (YYYY-MM-DD)
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

/**
 * 計算兩個日期之間的天數差
 */
export function calculateDaysUntil(
  targetDate: string,
  currentDate: string
): number {
  const target = new Date(targetDate);
  const current = new Date(currentDate);
  const diffTime = target.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 產生日期範圍陣列
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
 * 產生最近 N 天的日期陣列（不包含今天）
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n; i > 0; i--) {
    dates.push(getDaysAgo(i));
  }
  return dates;
}

/**
 * 格式化日期為顯示用字串
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
