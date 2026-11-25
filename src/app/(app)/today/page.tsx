import { ChevronLeft, PenLine } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CheckInButton } from "@/components/CheckInButton";
import { FriendsRow } from "@/components/FriendsRow";
import { PostCard, PostList } from "@/components/PostCard";
import { ReadingComposer } from "@/components/PostComposer";
import { SectionTitle, Skeleton } from "@/components/ui";
import { WeekDots } from "@/components/WeekDots";
import { addDays, localToday, weekStart } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { getMyGroups, requireViewer } from "@/lib/queries";
import { defaultShareDestination } from "@/lib/share";
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
    <div className="space-y-6 pt-6">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-20 w-72" />
      <Skeleton className="mx-auto size-28 rounded-full" />
      <Skeleton className="h-40" />
    </div>
  );
}

async function Today() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const tz = viewer.profile.timezone;
  const today = localToday(tz);
  const readOnly = viewer.profile.is_demo;

  const [schedule, checkIns, goals, groups, global, friends, myPosts] = await Promise.all([
    supabase.from("reading_schedule").select("label").eq("day", today).maybeSingle(),
    supabase.from("check_ins").select("local_date, created_at").gte("local_date", addDays(today, -400)),
    supabase.from("goal_history").select("effective_week_start, goal"),
    getMyGroups(viewer.id),
    supabase
      .from("feed_posts")
      .select("*")
      .is("group_id", null)
      .eq("reading_date", today)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("friends_read_today"),
    supabase
      .from("feed_posts")
      .select("group_id")
      .eq("author_id", viewer.id)
      .not("group_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const rows = checkIns.data ?? [];
  const dates = rows.map((c) => c.local_date);
  const todaysCheckIn = rows.find((c) => c.local_date === today) ?? null;
  const streak = computeStreak({
    checkIns: dates,
    goalHistory: (goals.data ?? []).map((g) => ({
      effectiveWeekStart: g.effective_week_start,
      goal: g.goal,
    })),
    today,
  });
  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => dates.includes(addDays(monday, i)));
  const todayIndex = Math.round((Date.parse(today) - Date.parse(monday)) / 86_400_000);
  const friendList = [...(friends.data ?? [])].sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));
  const chapter = schedule.data?.label;
  const posts = global.data ?? [];
  const defaultDestination = defaultShareDestination(
    (myPosts.data ?? []).map((p) => p.group_id),
    groups.map((g) => g.id),
  );

  return (
    <div className="space-y-12">
      <section className="pt-4 sm:pt-10">
        <p className="text-muted text-sm">{formatDay(today)}</p>
        {chapter ? (
          <>
            <h1 className="mt-2 text-6xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl">
              {chapter}
            </h1>
            <p className="text-muted mt-4 max-w-md text-lg">
              Today&apos;s chapter for everyone. Grab your Bible and find a quiet spot.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight">No reading scheduled today</h1>
            <p className="text-muted mt-4 max-w-md text-lg">
              A quiet day. Read anything you like and check in.
            </p>
          </>
        )}

        <div className="mt-10 flex flex-col items-center gap-7">
          <CheckInButton
            key={todaysCheckIn?.created_at ?? "not-checked-in"}
            checkedIn={Boolean(todaysCheckIn)}
            checkedInAt={todaysCheckIn?.created_at ?? null}
            readOnly={readOnly}
          />
          <WeekDots read={week} todayIndex={todayIndex} streak={streak} />
        </div>
      </section>

      <FriendsRow friends={friendList} inAnyGroup={groups.length > 0} />

      {todaysCheckIn && chapter && (
        <details className="group">
          <summary className="bg-surface-2 hover:bg-line flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-5 py-3 font-semibold transition-colors [&::-webkit-details-marker]:hidden">
            <PenLine size={18} aria-hidden /> Share what stood out
          </summary>
          <div className="pt-6">
            <ReadingComposer
              groups={groups.map(({ id, name }) => ({ id, name }))}
              defaultDestination={defaultDestination}
              readOnly={readOnly}
            />
          </div>
        </details>
      )}

      <section>
        <SectionTitle
          action={
            <Link
              href={`/global/${addDays(today, -1)}`}
              className="text-accent inline-flex min-h-11 items-center gap-0.5 text-sm font-medium hover:underline"
            >
              <ChevronLeft size={16} aria-hidden /> Yesterday
            </Link>
          }
        >
          {chapter ? `Everyone on ${chapter}` : "The global thread"}
        </SectionTitle>
        {posts.length === 0 ? (
          <p className="text-muted py-6">
            {chapter
              ? "No one has shared yet today. Check in and share what stood out."
              : "Nothing here today."}
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
