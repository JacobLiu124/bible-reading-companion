import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard } from "@/components/PostCard";
import { PageTitle, Skeleton } from "@/components/ui";
import { addDays, localToday } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Global thread" };

export default function GlobalArchivePage({ params }: { params: Promise<{ date: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Archive params={params} />
    </Suspense>
  );
}

async function Archive({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) notFound();
  const viewer = await requireViewer();
  const tz = viewer.profile.timezone;
  const today = localToday(tz);
  if (date >= today) notFound();

  const supabase = await createClient();
  const [schedule, posts] = await Promise.all([
    supabase.from("reading_schedule").select("label").eq("day", date).maybeSingle(),
    supabase.from("feed_posts").select("*").is("group_id", null).eq("reading_date", date)
      .order("created_at", { ascending: false }).limit(200),
  ]);
  const next = addDays(date, 1);

  return (
    <div>
      <PageTitle sub={formatDay(date)}>🌍 {schedule.data?.label ?? "Global thread"}</PageTitle>
      <div className="mb-4 flex justify-between text-sm">
        <Link href={`/global/${addDays(date, -1)}`} className="text-accent">← Previous day</Link>
        <Link href={next >= today ? "/today" : `/global/${next}`} className="text-accent">
          {next >= today ? "Today →" : "Next day →"}
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">New posts are closed for this day, but you can still comment.</p>
      {(posts.data ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">No posts this day.</p>
      ) : (
        <div className="space-y-3">
          {(posts.data ?? []).map((p) => (
            <PostCard key={p.id} post={p} viewerId={viewer.id} timeZone={tz} readOnly={viewer.profile.is_demo} />
          ))}
        </div>
      )}
    </div>
  );
}
