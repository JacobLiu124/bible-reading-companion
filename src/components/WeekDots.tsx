import type { Streak } from "@/lib/streak";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Mon–Sun dots: yellow for days read, an outline for today. */
export function WeekDots({ read, todayIndex, streak }: { read: boolean[]; todayIndex: number; streak: Streak }) {
  const { current, best, thisWeekCount, thisWeekGoal } = streak;
  const weeks = (n: number) => `${n}-week streak`;
  return (
    <div className="flex flex-col items-center gap-2">
      <ol className="flex gap-2" aria-label="This week">
        {read.map((r, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                r ? "bg-joy text-joy-ink" : "text-muted ring-1 ring-line"
              } ${i === todayIndex && !r ? "ring-2 ring-accent text-ink" : ""}`}
            >
              {DAY_LETTERS[i]}
            </span>
            <span className="sr-only">{DAY_NAMES[i]}: {r ? "read" : "not read"}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{Math.min(thisWeekCount, 7)} of {thisWeekGoal}</span> this week
        {current > 0 && <>, {weeks(current)}</>}
        {best > current && <span className="text-muted"> (best {best})</span>}
      </p>
    </div>
  );
}
