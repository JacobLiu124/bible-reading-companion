import Link from "next/link";
import { Suspense } from "react";
import { CheckInButton } from "@/components/CheckInButton";
import { PostCard } from "@/components/PostCard";
import { ReadingComposer } from "@/components/PostComposer";
import { StreakCard } from "@/components/StreakCard";
import { Card, Skeleton } from "@/components/ui";
import { addDays, localToday } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { getMyGroups, requireViewer } from "@/lib/queries";
import { computeStreak } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <Today />
    </Suspense>
  );
}

function TodaySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-44" />
      <Skeleton className="h-28" />
      <Skeleton className="h-64" />
    </div>
  );
}

async function Today() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const tz = viewer.profile.timezone;
  const today = localToday(tz);
  const readOnly = viewer.profile.is_demo;

  const [schedule, checkIns, goals, groups, global] = await Promise.all([
    supabase.from("reading_schedule").select("label").eq("day", today).maybeSingle(),
    supabase.from("check_ins").select("local_date").gte("local_date", addDays(today, -400)),
    supabase.from("goal_history").select("effective_week_start, goal"),
    getMyGroups(viewer.id),
    supabase.from("feed_posts").select("*").is("group_id", null).eq("reading_date", today)
      .order("created_at", { ascending: false }).limit(100),
  ]);

  const dates = (checkIns.data ?? []).map((c) => c.local_date);
  const checkedIn = dates.includes(today);
  const streak = computeStreak({
    checkIns: dates,
    goalHistory: (goals.data ?? []).map((g) => ({ effectiveWeekStart: g.effective_week_start, goal: g.goal })),
    today,
  });
  const chapter = schedule.data?.label;
  const posts = global.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="bg-accent-soft/40 p-6 sm:p-8">
        <p className="text-sm text-muted">{formatDay(today)}</p>
        {chapter ? (
          <>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">📖 {chapter}</h1>
            <p className="mt-2 text-muted">Grab your Bible.</p>
          </>
        ) : (
          <>
            <h1 className="mt-2 font-serif text-3xl font-semibold">No reading scheduled today</h1>
            <p className="mt-2 text-muted">You can still check in to keep your streak going.</p>
          </>
        )}
        <div className="mt-6">
          <CheckInButton checkedIn={checkedIn} readOnly={readOnly} />
        </div>
      </Card>

      <StreakCard streak={streak} />

      {checkedIn && chapter && (
        <Card>
          <h2 className="mb-4 font-serif text-xl font-semibold">What stood out?</h2>
          <ReadingComposer groups={groups.map(({ id, name }) => ({ id, name }))} readOnly={readOnly} />
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold">🌍 Global thread</h2>
          <Link href={`/global/${addDays(today, -1)}`} className="text-sm text-accent">Yesterday →</Link>
        </div>
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
            {chapter ? "No one has shared yet today. Be the first!" : "Nothing here today."}
          </p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} viewerId={viewer.id} timeZone={tz} readOnly={readOnly} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
