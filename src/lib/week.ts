export type DayState = "read" | "missed" | "today" | "upcoming";

/** Mon–Sun states for the week view. `read` is Mon..Sun, `todayIndex` is 0 (Mon) to 6 (Sun). */
export function weekDays(read: boolean[], todayIndex: number): DayState[] {
  return read.map((r, i) => {
    if (r) return "read";
    if (i < todayIndex) return "missed";
    return i === todayIndex ? "today" : "upcoming";
  });
}

/**
 * One line under the week dots: what was read and missed, then what's left.
 * It never scolds: a goal out of reach points to the next week instead.
 */
export function weekSummary(read: boolean[], todayIndex: number, goal: number, streak: number): string {
  const readCount = read.filter(Boolean).length;
  const missed = read.filter((r, i) => !r && i < todayIndex).length;
  const head = missed > 0 ? `${readCount} read, ${missed} missed` : `${readCount} read`;
  const need = goal - readCount;
  if (need <= 0) return `${head}. Goal met this week.`;

  const daysLeft = 7 - todayIndex - (read[todayIndex] ? 1 : 0);
  if (need > daysLeft) return `${head}. A fresh week starts Monday.`;

  const more = need === 1 ? "One more" : `${need} more`;
  const when = todayIndex === 6 ? "today" : "by Sunday";
  const outcome = streak > 0 ? "keeps your streak" : "meets your goal";
  return `${head}. ${more} ${when} ${outcome}.`;
}
