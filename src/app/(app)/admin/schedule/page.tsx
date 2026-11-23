import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/ActionButton";
import { Card, PageTitle, Skeleton } from "@/components/ui";
import { addDays, localToday } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { clearScheduleDayAction } from "./actions";
import { ScheduleForm } from "./schedule-form";

export const metadata = { title: "Reading schedule" };

export default function SchedulePage() {
  return (
    <div>
      <PageTitle sub="The chapter everyone reads each day.">Reading schedule</PageTitle>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Schedule />
      </Suspense>
    </div>
  );
}

async function Schedule() {
  const viewer = await requireViewer();
  if (!viewer.profile.is_site_admin) notFound();
  const supabase = await createClient();
  const today = localToday(viewer.profile.timezone);
  const end = addDays(today, 59);
  const { data } = await supabase.from("reading_schedule").select("*").gte("day", today).lte("day", end).order("day");
  const byDay = new Map((data ?? []).map((r) => [r.day, r]));
  const days = Array.from({ length: 60 }, (_, i) => addDays(today, i));
  const missingSoon = days.slice(0, 7).filter((d) => !byDay.has(d));
  const firstGap = days.find((d) => !byDay.has(d)) ?? addDays(end, 1);

  return (
    <div className="space-y-6">
      {missingSoon.length > 0 && (
        <p role="alert" className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">
          ⚠️ {missingSoon.length} of the next 7 days {missingSoon.length === 1 ? "has" : "have"} no reading: {missingSoon.map(formatDay).join(", ")}.
        </p>
      )}
      <Card>
        <h2 className="mb-3 font-serif text-lg font-semibold">Set a day</h2>
        <ScheduleForm defaultDay={firstGap} />
      </Card>
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {days.map((d) => {
            const r = byDay.get(d);
            return (
              <li key={d} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                <span className={d === today ? "font-medium" : "text-muted"}>{formatDay(d)}</span>
                <span className="flex items-center gap-2">
                  {r ? <span className="font-medium">{r.label}</span> : <span className="text-danger">—</span>}
                  {r && (
                    <ActionButton variant="ghost" action={clearScheduleDayAction.bind(null, d)} confirm={`Clear ${r.label} on ${formatDay(d)}?`}>
                      Clear
                    </ActionButton>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
