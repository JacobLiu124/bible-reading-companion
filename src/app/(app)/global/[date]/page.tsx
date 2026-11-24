import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard, PostList } from "@/components/PostCard";
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

const navLink = "inline-flex items-center gap-0.5 font-medium text-accent hover:underline";

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
  const list = posts.data ?? [];

  return (
    <div>
      <PageTitle sub={`${formatDay(date)}. New posts are closed, but you can still reply.`}>
        {schedule.data?.label ?? "Global thread"}
      </PageTitle>
      <div className="mb-2 flex justify-between text-sm">
        <Link href={`/global/${addDays(date, -1)}`} className={navLink}><ChevronLeft size={16} aria-hidden /> Previous day</Link>
        <Link href={next >= today ? "/today" : `/global/${next}`} className={navLink}>
          {next >= today ? "Today" : "Next day"} <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-muted">No one shared that day.</p>
      ) : (
        <PostList>
          {list.map((p) => (
            <PostCard key={p.id} post={p} viewerId={viewer.id} timeZone={tz} readOnly={viewer.profile.is_demo} />
          ))}
        </PostList>
      )}
    </div>
  );
}
