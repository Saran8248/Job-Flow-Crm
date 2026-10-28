/**
 * Centralized Indian Standard Time (IST - UTC+5:30) Date Utilities
 * Ensures consistent day-boundary calculations across API routes and tests.
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Returns current timestamp shifted by the IST offset
 */
export function getISTDate(date: Date = new Date()): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Computes exact start and end of day in UTC corresponding to IST calendar day.
 */
export function getISTTodayBounds(referenceDate: Date = new Date()): {
  startOfToday: Date;
  endOfToday: Date;
} {
  const istNow = new Date(referenceDate.getTime() + IST_OFFSET_MS);
  const startOfDayIST = new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  const startOfToday = new Date(startOfDayIST.getTime() - IST_OFFSET_MS);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startOfToday, endOfToday };
}

/**
 * Resolves standard date ranges ("today", "yesterday", "7days", "30days", "all", "custom")
 * consistently bounded to IST calendar day edges.
 */
export function getISTDateRangeBounds(
  range: string = "today",
  customStart?: string | null,
  customEnd?: string | null
): { start: Date | null; end: Date | null } {
  const { startOfToday, endOfToday } = getISTTodayBounds();

  if (range === "all") {
    return { start: null, end: null };
  }

  if (range === "yesterday") {
    const yesterdayStart = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(endOfToday.getTime() - 24 * 60 * 60 * 1000);
    return { start: yesterdayStart, end: yesterdayEnd };
  }

  if (range === "7days") {
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { start: sevenDaysAgo, end: endOfToday };
  }

  if (range === "30days") {
    const thirtyDaysAgo = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { start: thirtyDaysAgo, end: endOfToday };
  }

  if (range === "custom" && customStart) {
    const [sy, sm, sd] = customStart.split("-").map(Number);
    const start = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0) - IST_OFFSET_MS);

    let end = endOfToday;
    if (customEnd) {
      const [ey, em, ed] = customEnd.split("-").map(Number);
      end = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - IST_OFFSET_MS);
    }
    return { start, end };
  }

  // Default: today
  return { start: startOfToday, end: endOfToday };
}

/**
 * Checks whether two dates fall on the exact same IST calendar day
 */
export function isSameISTDay(dateA: Date, dateB: Date): boolean {
  const istA = new Date(dateA.getTime() + IST_OFFSET_MS);
  const istB = new Date(dateB.getTime() + IST_OFFSET_MS);

  return (
    istA.getUTCFullYear() === istB.getUTCFullYear() &&
    istA.getUTCMonth() === istB.getUTCMonth() &&
    istA.getUTCDate() === istB.getUTCDate()
  );
}

/**
 * Formats a date into IST readable string
 */
export function formatISTDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options,
  }).format(date);
}
