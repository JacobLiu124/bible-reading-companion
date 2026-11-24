import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge, Card, PageTitle, Skeleton } from "@/components/ui";
import { formatTime } from "@/lib/format";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { ReportActions } from "./report-actions";

export const metadata = { title: "Moderation" };

const REASONS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate",
  other: "Other",
};

export default function ModerationPage() {
  return (
    <div>
      <PageTitle sub="Reports from the spaces you moderate.">Moderation</PageTitle>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Queue />
      </Suspense>
    </div>
  );
}

async function Queue() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const isSiteAdmin = viewer.profile.is_site_admin;

  const { data: modGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", viewer.id)
    .eq("banned", false)
    .in("role", ["owner", "admin"]);
  const myModGroups = new Set((modGroups ?? []).map((g) => g.group_id));
  if (!isSiteAdmin && myModGroups.size === 0) notFound();

  const [reports, log] = await Promise.all([
    supabase
      .from("reports")
      .select("*, groups(name, slug, visibility)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("moderation_actions").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  // RLS also returns reports the viewer filed themselves; keep only ones they moderate.
  const queue = (reports.data ?? []).filter((r) =>
    r.is_global
      ? isSiteAdmin
      : r.group_id && (myModGroups.has(r.group_id) || (isSiteAdmin && r.groups?.visibility === "public")),
  );
  const tz = viewer.profile.timezone;

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Open reports ({queue.length})</h2>
        {queue.length === 0 && (
          <p className="text-muted">Nothing to review. Reports from your groups will show up here.</p>
        )}
        {queue.map((r) => (
          <Card key={r.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className="bg-danger/10 text-danger">{REASONS[r.reason]}</Badge>
              <span className="text-muted">
                {r.is_global ? "Global thread" : r.groups?.name}, reported by @{r.reporter_username} on{" "}
                {formatTime(r.created_at, tz)}
              </span>
            </div>
            <blockquote className="bg-surface-2 rounded-xl p-3 text-sm whitespace-pre-wrap">
              <span className="font-medium">
                @{r.target_username} {r.comment_id ? "commented" : "posted"}:
              </span>
              {"\n"}
              {r.content_snapshot || "(no text)"}
            </blockquote>
            {r.note && <p className="text-muted text-sm">Note: {r.note}</p>}
            {r.post_id && (
              <Link href={`/posts/${r.post_id}`} className="text-accent text-sm font-medium hover:underline">
                View in context
              </Link>
            )}
            <ReportActions
              report={{ ...r, group_name: r.groups?.name ?? null }}
              canDeleteGroup={isSiteAdmin && r.groups?.visibility === "public"}
            />
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Recent actions</h2>
        {(log.data ?? []).length === 0 ? (
          <p className="text-muted">No actions yet.</p>
        ) : (
          <ul className="divide-line border-line bg-surface divide-y rounded-2xl border">
            {(log.data ?? []).map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm">
                <span className="font-medium">@{a.actor_username}</span> {a.action.replace("_", " ")}{" "}
                {a.target_username && <span className="font-medium">@{a.target_username}</span>}{" "}
                <span className="text-muted">
                  in {a.is_global ? "the global thread" : (a.group_name ?? "a deleted group")},{" "}
                  {formatTime(a.created_at, tz)}
                  {a.reason && `. Reason: ${a.reason}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
