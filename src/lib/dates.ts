/** Dates are plain 'YYYY-MM-DD' strings in the user's own timezone. */

export function localToday(timeZone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

function toUtc(date: string): Date {
  return new Date(date + "T00:00:00Z");
}

export function addDays(date: string, days: number): string {
  return new Date(toUtc(date).getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const isoDow = toUtc(date).getUTCDay() || 7; // Mon=1 .. Sun=7
  return addDays(date, 1 - isoDow);
}
