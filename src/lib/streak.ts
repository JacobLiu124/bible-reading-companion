import { addDays, weekStart } from "./dates";

export type GoalChange = { effectiveWeekStart: string; goal: number };
export type StreakInput = { checkIns: string[]; goalHistory: GoalChange[]; today: string };
export type Streak = { current: number; best: number; thisWeekCount: number; thisWeekGoal: number };

const DEFAULT_GOAL = 3;

function goalFor(week: string, history: GoalChange[]): number {
  let goal = DEFAULT_GOAL;
  let latest = "";
  for (const h of history) {
    if (h.effectiveWeekStart <= week && h.effectiveWeekStart >= latest) {
      latest = h.effectiveWeekStart;
      goal = h.goal;
    }
  }
  if (!latest && history.length) {
    // goal changed only after this week: use the earliest known goal
    goal = [...history].sort((a, b) => a.effectiveWeekStart.localeCompare(b.effectiveWeekStart))[0].goal;
  }
  return goal;
}

/** Weekly streak: a week counts when its check-ins reach the goal in effect that week. */
export function computeStreak({ checkIns, goalHistory, today }: StreakInput): Streak {
  const counts = new Map<string, number>();
  for (const d of new Set(checkIns)) {
    if (d > today) continue;
    const w = weekStart(d);
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  const thisWeek = weekStart(today);
  const thisWeekCount = counts.get(thisWeek) ?? 0;
  const thisWeekGoal = goalFor(thisWeek, goalHistory);
  const met = (w: string) => (counts.get(w) ?? 0) >= goalFor(w, goalHistory);

  // current: consecutive met weeks ending last week, plus this week if already met
  let current = 0;
  for (let w = addDays(thisWeek, -7); met(w); w = addDays(w, -7)) current++;
  if (thisWeekCount >= thisWeekGoal) current++;

  // best: longest run of met weeks (this week only if met)
  let best = 0;
  const weeks = [...counts.keys()].sort();
  if (weeks.length) {
    let run = 0;
    for (let w = weeks[0]; w <= thisWeek; w = addDays(w, 7)) {
      run = met(w) ? run + 1 : w === thisWeek ? run : 0;
      best = Math.max(best, run);
    }
  }
  best = Math.max(best, current);

  return { current, best, thisWeekCount, thisWeekGoal };
}
