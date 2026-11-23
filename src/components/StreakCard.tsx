import type { Streak } from "@/lib/streak";
import { Card } from "@/components/ui";

export function StreakCard({ streak }: { streak: Streak }) {
  const { current, best, thisWeekCount, thisWeekGoal } = streak;
  const done = thisWeekCount >= thisWeekGoal;
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted">This week</p>
        <p className="mt-1 text-2xl font-semibold">
          {Math.min(thisWeekCount, 7)} <span className="text-base font-normal text-muted">/ {thisWeekGoal}</span>
        </p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: thisWeekGoal }, (_, i) => (
            <span key={i} className={`h-2 w-6 rounded-full ${i < thisWeekCount ? "bg-accent" : "bg-surface-2"}`} />
          ))}
        </div>
        {done && <p className="mt-2 text-sm text-ok">Goal met this week 🎉</p>}
      </div>
      <div className="text-right">
        <p className="text-sm text-muted">Streak</p>
        <p className="mt-1 text-2xl font-semibold">🔥 {current} <span className="text-base font-normal text-muted">{current === 1 ? "week" : "weeks"}</span></p>
        <p className="text-xs text-muted">Best: {best}</p>
      </div>
    </Card>
  );
}
