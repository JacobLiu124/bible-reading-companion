import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/ActionButton";
import { Badge, Card, PageTitle, Skeleton } from "@/components/ui";
import { requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import {
  createInviteAction, deleteOwnGroupAction, revokeInviteAction, setRoleAction, transferOwnershipAction, unbanAction,
} from "../../actions";
import { GroupForm } from "../../group-form";
import { CopyLink } from "./copy-link";

export const metadata = { title: "Manage group" };

type Params = Promise<{ slug: string }>;

export default function GroupSettingsPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Settings params={params} />
    </Suspense>
  );
}

async function Settings({ params }: { params: Params }) {
  const { slug } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("*").eq("slug", slug).maybeSingle();
  if (!group) notFound();
  const { data: me } = await supabase.from("group_members").select("role").eq("group_id", group.id).eq("user_id", viewer.id).maybeSingle();
  const role = me?.role;
  if (role !== "owner" && role !== "admin") notFound();
  const isOwner = role === "owner";
  const readOnly = viewer.profile.is_demo;

  const [members, invites] = await Promise.all([
    supabase.from("group_members").select("user_id, role, banned, joined_at, profiles(username, display_name)")
      .eq("group_id", group.id).order("joined_at"),
    supabase.from("group_invites").select("code, expires_at, revoked").eq("group_id", group.id)
      .eq("revoked", false).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
  ]);
  const active = (members.data ?? []).filter((m) => !m.banned);
  const banned = (members.data ?? []).filter((m) => m.banned);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/groups/${group.slug}`} className="text-sm text-accent">← {group.name}</Link>
        <PageTitle>Manage group</PageTitle>
      </div>

      <Card>
        <h2 className="mb-4 font-serif text-lg font-semibold">Details</h2>
        <GroupForm initial={group} readOnly={readOnly} />
      </Card>

      <Card>
        <h2 className="mb-1 font-serif text-lg font-semibold">Invite links</h2>
        <p className="mb-4 text-sm text-muted">
          {group.visibility === "private" ? "Private groups can only be joined with an invite link." : "Anyone can join this public group, but invite links make it easy to share."}
          {" "}Links last 7 days.
        </p>
        <div className="space-y-2">
          {(invites.data ?? []).map((i) => (
            <div key={i.code} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
              <CopyLink path={`/invite/${i.code}`} />
              <div className="flex items-center gap-2 text-xs text-muted">
                expires {new Date(i.expires_at).toLocaleDateString()}
                <ActionButton variant="ghost" action={revokeInviteAction.bind(null, i.code)} disabled={readOnly}>Revoke</ActionButton>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <ActionButton action={createInviteAction.bind(null, group.id)} disabled={readOnly}>Create invite link</ActionButton>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-serif text-lg font-semibold">Members ({active.length})</h2>
        <ul className="divide-y divide-line">
          {active.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{m.profiles?.display_name} <span className="font-normal text-muted">@{m.profiles?.username}</span></p>
                {m.role !== "member" && <Badge className="mt-1 bg-accent-soft text-accent">{m.role}</Badge>}
              </div>
              {isOwner && m.user_id !== viewer.id && (
                <div className="flex flex-wrap gap-2">
                  {m.role === "member" && <ActionButton variant="ghost" action={setRoleAction.bind(null, group.id, m.user_id, "admin")} disabled={readOnly}>Make admin</ActionButton>}
                  {m.role === "admin" && <ActionButton variant="ghost" action={setRoleAction.bind(null, group.id, m.user_id, "member")} disabled={readOnly}>Remove admin</ActionButton>}
                  <ActionButton
                    variant="ghost"
                    action={transferOwnershipAction.bind(null, group.id, m.user_id)}
                    confirm={`Make ${m.profiles?.display_name} the owner? You'll become an admin.`}
                    disabled={readOnly}
                  >
                    Make owner
                  </ActionButton>
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">To warn, mute or ban someone, use the ⋯ menu on one of their posts or comments.</p>
      </Card>

      {banned.length > 0 && (
        <Card>
          <h2 className="mb-4 font-serif text-lg font-semibold">Banned</h2>
          <ul className="divide-y divide-line">
            {banned.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-3">
                <span>{m.profiles?.display_name} <span className="text-muted">@{m.profiles?.username}</span></span>
                <ActionButton variant="ghost" action={unbanAction.bind(null, group.id, m.user_id)} disabled={readOnly}>Unban</ActionButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isOwner && (
        <Card className="border-danger/40">
          <h2 className="mb-1 font-serif text-lg font-semibold text-danger">Delete group</h2>
          <p className="mb-3 text-sm text-muted">Deletes the group and all its posts for everyone. This can&apos;t be undone.</p>
          <ActionButton variant="danger" action={deleteOwnGroupAction.bind(null, group.id)} confirm={`Delete ${group.name} and all its posts? This can't be undone.`} disabled={readOnly}>
            Delete group
          </ActionButton>
        </Card>
      )}
    </div>
  );
}
