import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/ActionButton";
import { PostCard } from "@/components/PostCard";
import { GeneralComposer } from "@/components/PostComposer";
import { Badge, Card, Skeleton } from "@/components/ui";
import { denominationLabel } from "@/lib/denominations";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { joinGroupAction, leaveGroupAction } from "../actions";

export const metadata = { title: "Group" };

type Params = Promise<{ slug: string }>;

export default function GroupPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Group params={params} />
    </Suspense>
  );
}

async function Group({ params }: { params: Params }) {
  const { slug } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("*").eq("slug", slug).maybeSingle();
  if (!group) notFound();

  const [membership, posts, memberCount] = await Promise.all([
    supabase.from("group_members").select("role, muted_until").eq("group_id", group.id).eq("user_id", viewer.id).maybeSingle(),
    supabase.from("feed_posts").select("*").eq("group_id", group.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("group_members").select("user_id", { count: "exact", head: true }).eq("group_id", group.id).eq("banned", false),
  ]);
  const role = membership.data?.role;
  const isMember = Boolean(role);
  const isMod = role === "owner" || role === "admin" || (viewer.profile.is_site_admin && group.visibility === "public");
  const readOnly = viewer.profile.is_demo;
  const denom = denominationLabel(group.denomination);
  const mutedUntil = membership.data?.muted_until && new Date(membership.data.muted_until) > new Date()
    ? membership.data.muted_until : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/groups" className="text-sm text-accent">← Groups</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{group.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{group.visibility === "private" ? "🔒 Private" : "🌐 Public"}</Badge>
              {denom && <Badge>{denom}</Badge>}
              <Badge>{memberCount.count ?? 0} members</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isMod && <Link href={`/groups/${group.slug}/settings`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2">Manage</Link>}
            {!isMember && group.visibility === "public" && (
              <ActionButton variant="primary" action={joinGroupAction.bind(null, group.id)} disabled={readOnly}>Join group</ActionButton>
            )}
            {isMember && role !== "owner" && (
              <ActionButton variant="ghost" action={leaveGroupAction.bind(null, group.id)} confirm={`Leave ${group.name}?`} disabled={readOnly}>
                Leave
              </ActionButton>
            )}
          </div>
        </div>
        {group.description && <p className="mt-3 text-muted">{group.description}</p>}
      </div>

      {group.rules && (
        <Card className="bg-surface-2">
          <p className="text-sm font-medium">Group rules</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{group.rules}</p>
        </Card>
      )}

      {isMember && !mutedUntil && (
        <Card>
          <h2 className="mb-3 font-serif text-lg font-semibold">Post to the group</h2>
          <GeneralComposer groupId={group.id} readOnly={readOnly} />
          <p className="mt-3 text-xs text-muted">Reading reflections are shared from the Today page after you check in.</p>
        </Card>
      )}
      {mutedUntil && (
        <p className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">
          You&apos;re muted in this group until {new Date(mutedUntil).toLocaleString()}.
        </p>
      )}

      <section className="space-y-3">
        {(posts.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">No posts yet.</p>
        ) : (
          (posts.data ?? []).map((p) => (
            <PostCard key={p.id} post={p} viewerId={viewer.id} timeZone={viewer.profile.timezone} readOnly={readOnly || !isMember} />
          ))
        )}
      </section>
    </div>
  );
}
