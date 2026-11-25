import type { Streak } from "@/lib/streak";
import { type DayState, weekDays, weekSummary } from "@/lib/week";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DOT: Record<DayState, string> = {
  read: "bg-joy text-joy-ink",
  missed: "text-muted border border-dashed border-muted/50",
  today: "text-ink ring-2 ring-accent",
  upcoming: "text-muted ring-1 ring-line",
};
const SAY: Record<DayState, string> = {
  read: "read",
  missed: "missed",
  today: "today, not read yet",
  upcoming: "still to come",
};

/** Mon–Sun: yellow for days read, a dashed outline for missed days, then a line on what's left. */
export function WeekDots({
  read,
  todayIndex,
  streak,
}: {
  read: boolean[];
  todayIndex: number;
  streak: Streak;
}) {
  const days = weekDays(read, todayIndex);
  const weeks = (n: number) => `${n}-week streak`;
  return (
    <div className="flex flex-col items-center gap-3">
      <ol className="flex gap-2" aria-label="This week">
        {days.map((d, i) => (
          <li key={i}>
            <span
              aria-hidden
              className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${DOT[d]}`}
            >
              {DAY_LETTERS[i]}
            </span>
            <span className="sr-only">
              {DAY_NAMES[i]}: {SAY[d]}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-center text-sm">
        {weekSummary(read, todayIndex, streak.thisWeekGoal, streak.current)}
      </p>
      {(streak.current > 0 || streak.best > 0) && (
        <p className="text-muted -mt-2 text-xs">
          {streak.current > 0 ? weeks(streak.current) : "No streak yet"}
          {streak.best > streak.current && `, best ${streak.best}`}
        </p>
      )}
    </div>
  );
}
