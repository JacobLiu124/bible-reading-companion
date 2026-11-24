/** "23 Nov, 2:15 pm" in the viewer's timezone. */
export function formatTime(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
}

/** "Monday 23 November" for a 'YYYY-MM-DD' date. */
export function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date + "T00:00:00Z"));
}
