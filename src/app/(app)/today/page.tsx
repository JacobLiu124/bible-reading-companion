import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CheckInButton } from "@/components/CheckInButton";
import { FriendsRow } from "@/components/FriendsRow";
import { PostCard, PostList } from "@/components/PostCard";
import { ReadingComposer } from "@/components/PostComposer";
import { Card, SectionTitle, Skeleton } from "@/components/ui";
import { WeekDots } from "@/components/WeekDots";
import { addDays, localToday, weekStart } from "@/lib/dates";
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
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-14 w-48" />
      <Skeleton className="mx-auto size-28 rounded-full" />
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

  const [schedule, checkIns, goals, groups, global, friends] = await Promise.all([
    supabase.from("reading_schedule").select("label").eq("day", today).maybeSingle(),
    supabase.from("check_ins").select("local_date").gte("local_date", addDays(today, -400)),
    supabase.from("goal_history").select("effective_week_start, goal"),
    getMyGroups(viewer.id),
    supabase.from("feed_posts").select("*").is("group_id", null).eq("reading_date", today)
      .order("created_at", { ascending: false }).limit(100),
    supabase.rpc("friends_read_today"),
  ]);

  const dates = (checkIns.data ?? []).map((c) => c.local_date);
  const checkedIn = dates.includes(today);
  const streak = computeStreak({
    checkIns: dates,
    goalHistory: (goals.data ?? []).map((g) => ({ effectiveWeekStart: g.effective_week_start, goal: g.goal })),
    today,
  });
  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => dates.includes(addDays(monday, i)));
  const todayIndex = Math.round((Date.parse(today) - Date.parse(monday)) / 86_400_000);
  const friendList = [...(friends.data ?? [])].sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));
  const chapter = schedule.data?.label;
  const posts = global.data ?? [];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <FriendsRow friends={friendList} inAnyGroup={groups.length > 0} />
        <div>
          <p className="text-sm text-muted">{formatDay(today)}</p>
          {chapter ? (
            <>
              <h1 className="mt-1 text-5xl font-bold tracking-tight">{chapter}</h1>
              <p className="mt-2 text-muted">Today&apos;s chapter for everyone. Grab your Bible.</p>
            </>
          ) : (
            <>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">No reading scheduled today</h1>
              <p className="mt-2 text-muted">You can still check in to keep your streak going.</p>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-6 pt-2">
          <CheckInButton checkedIn={checkedIn} readOnly={readOnly} />
          <WeekDots read={week} todayIndex={todayIndex} streak={streak} />
        </div>
      </section>

      {checkedIn && chapter && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">What stood out?</h2>
          <ReadingComposer groups={groups.map(({ id, name }) => ({ id, name }))} readOnly={readOnly} />
        </Card>
      )}

      <section>
        <SectionTitle
          action={
            <Link href={`/global/${addDays(today, -1)}`} className="inline-flex items-center gap-0.5 text-sm font-medium text-accent hover:underline">
              <ChevronLeft size={16} aria-hidden /> Yesterday
            </Link>
          }
        >
          {chapter ? `Everyone on ${chapter}` : "The global thread"}
        </SectionTitle>
        {posts.length === 0 ? (
          <p className="py-6 text-muted">
            {chapter ? "No one has shared yet today. Check in and share what stood out." : "Nothing here today."}
          </p>
        ) : (
          <PostList>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} viewerId={viewer.id} timeZone={tz} readOnly={readOnly} />
            ))}
          </PostList>
        )}
      </section>
    </div>
  );
}
