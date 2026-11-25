import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { BackLink } from "@/components/BackLink";
import { Bookshelf } from "@/components/Bookshelf";
import { SectionTitle, Skeleton } from "@/components/ui";
import { localToday } from "@/lib/dates";
import { denominationLabel } from "@/lib/denominations";
import { requireViewer } from "@/lib/queries";
import { buildShelf, shelfSummary } from "@/lib/shelf";
import { computeStreak } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const viewer = await requireViewer();
  const { profile } = viewer;
  const supabase = await createClient();
  const today = localToday(profile.timezone);

  const [plan, checkIns, goals] = await Promise.all([
    supabase.from("reading_schedule").select("day, book, chapter").order("day").limit(2000),
    supabase.from("check_ins").select("local_date"),
    supabase.from("goal_history").select("effective_week_start, goal"),
  ]);

  const dates = (checkIns.data ?? []).map((c) => c.local_date);
  const shelf = buildShelf(plan.data ?? [], today, dates);
  const streak = computeStreak({
    checkIns: dates,
    goalHistory: (goals.data ?? []).map((g) => ({
      effectiveWeekStart: g.effective_week_start,
      goal: g.goal,
    })),
    today,
  });
  const denom = denominationLabel(profile.denomination);
  const weeks = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;

  return (
    <div className="space-y-10">
      <BackLink href="/settings">Settings</BackLink>

      <header className="flex items-center gap-4">
        <Avatar name={profile.display_name} seed={profile.username} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight">{profile.display_name}</h1>
          <p className="text-muted">
            @{profile.username}
            {denom && <>, {denom}</>}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-4">
        <div>
          <dt className="text-muted text-sm">Streak</dt>
          <dd className="mt-1 text-2xl font-bold">{weeks(streak.current)}</dd>
        </div>
        <div>
          <dt className="text-muted text-sm">Best streak</dt>
          <dd className="mt-1 text-2xl font-bold">{weeks(streak.best)}</dd>
        </div>
        <div>
          <dt className="text-muted text-sm">Weekly goal</dt>
          <dd className="mt-1 text-2xl font-bold">{profile.weekly_goal} days</dd>
        </div>
      </dl>

      <section>
        <SectionTitle>Your reading plan</SectionTitle>
        <p className="text-muted mb-5">{shelfSummary(shelf)}</p>
        {shelf.books.length > 0 ? (
          <Bookshelf shelf={shelf} />
        ) : (
          <p className="text-muted">The reading plan is empty. A site admin can add days in Schedule.</p>
        )}
      </section>
    </div>
  );
}
